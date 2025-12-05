#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { Endpoint } from "@matter/main";
import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { WindowCovering } from "@matter/main/clusters/window-covering";
import {
  MovementDirection,
  MovementType,
  WindowCoveringServer,
} from "@matter/main/behaviors/window-covering";
import { Gpio } from "pigpio";
import * as Consts from "./consts.js"
import {HCSR04} from "../sensors/hcsr04.js"

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

const BTN_SHUTTER_OPEN = new Gpio(GPIO_BTN_SHUTTER_OPEN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});

const BTN_SHUTTER_CLOSE = new Gpio(GPIO_BTN_SHUTTER_CLOSE, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});

const DEV_SHUTTER_OPEN = new Gpio(GPIO_DEV_SHUTTER_OPEN, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

const DEV_SHUTTER_CLOSE = new Gpio(GPIO_DEV_SHUTTER_CLOSE, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

const SENSOR = new HCSR04(GPIO_HCSR04_TRIGGER, GPIO_HCSR04_ECHO);

/**
 *
 */
class ShutterServer extends WindowCoveringServer.with("Lift", "PositionAwareLift") {

  /**
   * シャッターを開ける
   */
  protected openShutter() {
    // シャッター開信号発信
    DEV_SHUTTER_OPEN.trigger(Consts.BTN_TRIGGER_MS, 1);
  }

  /**
   * シャッターを閉じる
   */
  protected closeShutter() {
    // シャッター閉信号発信
    DEV_SHUTTER_CLOSE.trigger(Consts.BTN_TRIGGER_MS, 1);
  }

  /**
   * シャッター操作
   */
  override async handleMovement(
    type: MovementType,
    reversed: boolean,
    direction: MovementDirection,
    targetPercent100ths?: number
  ) {
    console.log(
      "Move shatter",
      direction === MovementDirection.Open ? "Open" : "Close",
      targetPercent100ths !== undefined ? `${targetPercent100ths / 100}%` : ""
    );

    switch (direction) {
      case MovementDirection.Open:
        // シャッターを開く
        this.openShutter();
        break;
      case MovementDirection.Close:
        // シャッターを閉じる
        this.closeShutter();
        break;
      case MovementDirection.DefinedByPosition:
        // 指定距離までシャッターを動かす
        break;
    }
  }

  /**
   * シャッター停止
   */
  override handleStopMovement() {
    if (this.state.operationalStatus.lift != WindowCovering.MovementStatus.Stopped){
      // シャッター動作中であれば、いずれかのボタン操作で停止する
      this.openShutter();
    }
    super.handleStopMovement();
  }

  /**
   * キャリブレーション実行
   */
  override executeCalibration() {
    // シャッターを開ける
    // シャッターが止まるのを待つ
    // シャッターの距離を測る
    // 全開時の距離を記録する
    // シャッターを閉じる
    // シャッターが止まるのを待つ
    // シャッターの距離を測る
    // 全開時の距離を記録する
  }
}

/**
 * 照明用エンドポイントを作成.
 */
export const ShutterEndpoint = new Endpoint(WindowCoveringDevice.with(ShutterServer), {
  id: 'shutter'
});

BTN_SHUTTER_OPEN.glitchFilter(Consts.GLITCH_INTERVAL_NS);
BTN_SHUTTER_OPEN.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    console.log("Push Shutter Open Button");
    if (ShutterEndpoint.state.windowCovering.operationalStatus.lift == WindowCovering.MovementStatus.Stopped) {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Opening,
          },
        }
      });
      // シャッター開度測定開始

    } else {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
          }
      });
    }
  }
});

BTN_SHUTTER_CLOSE.glitchFilter(Consts.GLITCH_INTERVAL_NS);
BTN_SHUTTER_CLOSE.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    console.log("Push Shutter Close Button");
    if (ShutterEndpoint.state.windowCovering.operationalStatus.lift == WindowCovering.MovementStatus.Stopped) {
      await ShutterEndpoint.set({
        windowCovering:{
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Closing,
          },
        }
      });
      // シャッター開度測定開始
    } else {
      await ShutterEndpoint.set({
        windowCovering: {
          operationalStatus: {
            lift: WindowCovering.MovementStatus.Stopped,
          },
        }
      });
    }
  }
});
