#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { setInterval } from "node:timers/promises";
import { Endpoint, StorageService } from "@matter/main";
import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { WindowCovering } from "@matter/main/clusters/window-covering";
import {  WindowCoveringServer } from "@matter/main/behaviors/window-covering";
import { Gpio } from "pigpio";
import * as Consts from "./consts.js";
import { HCSR04 } from "../sensors/hcsr04.js";

/** シャッター開ボタンのGPIOピンNo */
const GPIO_BTN_SHUTTER_OPEN = 5;
/** 実機側シャッター開ボタンのGPIOピンNo */
const GPIO_DEV_SHUTTER_OPEN = 6;

/** シャッター閉ボタンのGPIOピンNo */
const GPIO_BTN_SHUTTER_CLOSE = 20;
/** 実機側シャッター閉ボタンのGPIOピンNo */
const GPIO_DEV_SHUTTER_CLOSE = 21;

/** HC-SR04のトリガーピンのGPIOピンNo */
const GPIO_HCSR04_TRIGGER = 12;
/** HC-SR04のエコーピンのGPIOピンNo */
const GPIO_HCSR04_ECHO = 13;

/** ％指定時の動作判定誤差 */
const MOVE_PCT = 500;

/** 実機側シャッター開ボタンのGPIO */
const DEV_SHUTTER_OPEN = new Gpio(GPIO_DEV_SHUTTER_OPEN, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

/** 実機側シャッター閉ボタンのGPIOピン */
const DEV_SHUTTER_CLOSE = new Gpio(GPIO_DEV_SHUTTER_CLOSE, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

/** HC-SR04センサー */
const SENSOR = new HCSR04(GPIO_HCSR04_TRIGGER, GPIO_HCSR04_ECHO);

/** 距離計測間隔(ms) */
const MEASUREMENT_INTERVAL = 100;

/**
 * 照明用エンドポイントを作成.
 */
export const ShutterEndpoint = new Endpoint(
  WindowCoveringDevice.with(
    WindowCoveringServer.with(
      WindowCovering.Feature.Lift,
      WindowCovering.Feature.PositionAwareLift,
      WindowCovering.Feature.AbsolutePosition
    )
  ),
  {
    id: "shutter",
    windowCovering: {
      type: WindowCovering.WindowCoveringType.Shutter, // シャッター
      endProductType: WindowCovering.EndProductType.RollerShutter, // 巻取式シャッター
      // featureMap: {
      //   lift: true, // 昇降機能
      //   //absolutePosition: true,   // 絶対位置（数値指定）を有効化
      //   positionAwareLift: true, // 現在位置の把握を有効化
      // },
      configStatus: {
        operational: true,
      },
    },
  }
);


/** シャッター開ボタンのGPIO */
const BTN_SHUTTER_OPEN = new Gpio(GPIO_BTN_SHUTTER_OPEN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});
BTN_SHUTTER_OPEN.glitchFilter(Consts.GLITCH_INTERVAL_NS);
BTN_SHUTTER_OPEN.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    console.log("Push Shutter Open Button");
    if (
      ShutterEndpoint.state.windowCovering.operationalStatus.lift ==
      WindowCovering.MovementStatus.Stopped
    ) {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Opening,
          },
        },
      });
      // シャッター開度測定開始
    } else {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
        },
      });
    }
  }
});

/** シャッター閉ボタンのGPIO */
const BTN_SHUTTER_CLOSE = new Gpio(GPIO_BTN_SHUTTER_CLOSE, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});
BTN_SHUTTER_CLOSE.glitchFilter(Consts.GLITCH_INTERVAL_NS);
BTN_SHUTTER_CLOSE.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    console.log("Push Shutter Close Button");
    if (
      ShutterEndpoint.state.windowCovering.operationalStatus.lift ===
      WindowCovering.MovementStatus.Stopped
    ) {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Closing,
          },
        },
      });
      // シャッター開度測定開始
    } else {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
        },
      });
    }
  }
});

/**
 * 指定位置への移動コマンド
 */
// @ts-ignore
(ShutterEndpoint as any).setCommandHandler("goToLiftPercentage", async ({ request, endpoint }: { request: WindowCovering.GoToLiftPercentageRequest, endpoint: typeof ShutterEndpoint }) => {
    console.log(
      `移動命令を受信: ${request.liftPercent100thsValue / 100}% へ移動します`
    );

    try {
      // 状態を「移動中」に更新
      await endpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Opening,
          },
        },
      });

      // 指定位置への移動
      await moveToPosition(request.liftPercent100thsValue);

      // 現在位置属性を更新（本来は移動完了後や移動中に随時更新します）
      await endpoint.set({
        windowCovering: {
          currentPositionLiftPercent100ths: request.liftPercent100thsValue,
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
        },
      });

      console.log("移動完了");
    } catch (error) {
      console.error("移動失敗:", error);
    }
  }
);

/**
 * キャリブレーション実行コマンド
 */
// @ts-ignore
(ShutterEndpoint as any).setCommandHandler("executeCalibration", async ({ endpoint }: { endpoint: typeof ShutterEndpoint }) => {
    console.log("キャリブレーションを開始します");
    let prevPos: number | null;

    try {
      // A. 動作中のステータスに更新
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Opening,
          },
        },
      });

      // シャッターを開ける
      openShutter();

      // シャッターが止まるのを待つ
      prevPos =
        ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
      for await (const _ of setInterval(MEASUREMENT_INTERVAL * 10)) {
        const nowPos =
          ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
        if (nowPos !== prevPos) {
          break;
        }
      }

      // 全開時の距離を記録する
      shutterPosTop =
        ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
      storage.set("shutter_top", shutterPosTop);

      // シャッターを閉じる
      closeShutter();
      // シャッターが止まるのを待つ
      prevPos =
        ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
      for await (const _ of setInterval(MEASUREMENT_INTERVAL * 10)) {
        const nowPos =
          ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
        if (nowPos !== prevPos) {
          break;
        }
      }
      // 全開時の距離を記録する
      shutterPosBottom =
        ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;
      storage.set("shutter_bottom", shutterPosBottom);

      // 校正結果を反映して「有効(Operational)」にする
      await ShutterEndpoint.set({
        windowCovering: {
          // キャリブレーション完了フラグを立てる
          configStatus: {
            operational: true, // ★重要: trueにすることで操作可能になる
            onlineReserved: true,
          },

          // 停止状態に戻す
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
        },
      });

      console.log("キャリブレーションが正常に完了しました。");
    } catch (error) {
      console.error("キャリブレーション失敗:", error);
      // 失敗した場合は例外を投げる（コントローラー側にエラーが通知される）
      throw new Error("Calibration sequence failed on hardware");
    }
  }
);

/**
 * 停止コマンド
 */
// @ts-ignore
(ShutterEndpoint as any).setCommandHandler("stopMotion", async ({ endpoint }: { endpoint: typeof ShutterEndpoint }) => {
  console.log("停止命令を受信しました");

  try {
    // 実際のハードウェア(モーター)へ停止命令を出す
    if (
      ShutterEndpoint.state.windowCovering.operationalStatus.lift !==
      WindowCovering.MovementStatus.Stopped
    ) {
      openShutter();
    }

    // 状態を「停止中」に更新
    await endpoint.set({
      windowCovering: {
        operationalStatus: {
          lift: WindowCovering.MovementStatus.Stopped,
        },
      },
    });

    console.log("デバイスを停止しました");
  } catch (error) {
    console.error("停止処理失敗:", error);
  }
});

/**
 * 上昇・下降命令 (upOrOpen / downOrClose)
 * ボタン型のUIで「開く」「閉じる」が押された場合
 */
// @ts-ignore
(ShutterEndpoint as any).setCommandHandler("upOrOpen", async ({ endpoint }: { endpoint: typeof ShutterEndpoint }) => {
  console.log("全開命令を受信");
  openShutter();
});

/**
 * 下降コマンド実行 (downOrClose)
 * ボタン型のUIで「開く」「閉じる」が押された場合
 */
// @ts-ignore
(ShutterEndpoint as any).setCommandHandler("downOrClose", async ({ endpoint }: { endpoint: typeof ShutterEndpoint }) => {
  console.log("全閉命令を受信");
  closeShutter();
});
/**
 * シャッターを開ける
 */
function openShutter() {
  // シャッター開信号発信
  DEV_SHUTTER_OPEN.trigger(Consts.BTN_TRIGGER_MS, 1);
}

/**
 * シャッターを閉じる
 */
function closeShutter() {
  // シャッター閉信号発信
  DEV_SHUTTER_CLOSE.trigger(Consts.BTN_TRIGGER_MS, 1);
}

/**
 * シャッターを指定位置まで動かす
 */
async function moveToPosition(targetPercent100ths: number) {
  const currentPercent100ths =
    ShutterEndpoint.state.windowCovering.currentPositionLiftPercent100ths;

  if (currentPercent100ths === null) {
    console.warn("現在位置が不明なため、指定位置への移動をスキップします。");
    return;
  }
  if (
    currentPercent100ths - MOVE_PCT < targetPercent100ths &&
    currentPercent100ths + MOVE_PCT > targetPercent100ths
  ) {
    // 現在開度と指定開度がMOVE_PCT%以内の差なら動かない
  } else if (currentPercent100ths < targetPercent100ths) {
    // 現在開度が指定開度より小さい場合は
    // 指定開度までシャッターを開ける
    openShutter();
  } else {
    // 現在開度が指定開度より大きい場合は
    // 指定開度までシャッターを閉じる
    closeShutter();
  }
}

/**
 * 距離計測
 */
for await (const _ of setInterval(MEASUREMENT_INTERVAL)) {
  const distance = await SENSOR.getDistanceCm();

  const percent100ths = Math.round(
    ((distance - shutterPosTop) / (shutterPosBottom - shutterPosTop)) * 100
  );
  await ShutterEndpoint.set({
    windowCovering: {
      currentPositionLiftPercent100ths: percent100ths,
    },
  });
}
