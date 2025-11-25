#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { MovementDirection, MovementType, WindowCoveringServer } from "@matter/main/behaviors/window-covering";

const ShutterServer = WindowCoveringServer.with("Lift", "PositionAwareLift");

const GPIO_SW_SHUTTER_UP = 14;
const GPIO_SW_SHUTTER_DOWN = 15;
const GPIO_DEV_SHUTTER_UP = 22;
const GPIO_DEV_SHUTTER_DOWN = 23;

const GPIO_HCSR04_TRIGGER = 20;
const GPIO_HCSR04_ECHO = 21;

/**
 * 
 */
export class Shutter extends ShutterServer {
    
    /**
     * 初期化処理
     */
    override initialize(): MaybePromise {


        return super.initialize();
    }

    /**
     * シャッター操作
     */
    override async handleMovement(
        type: MovementType,
        reversed: boolean,
        direction: MovementDirection,
        targetPercent100ths?: number,
    ) : MaybePromise {

        if (this.internal.disableOperationalModeHandling) {
            return;
        }

        console.log(
            "Move shatter",
            direction === MovementDirection.Open ? "Open" : "Close",
            targetPercent100ths !== undefined ? `${targetPercent100ths / 100}%` : "",
        );

        switch(direction) {
            case MovementDirection.Open:
            // シャッターを開く
                break;
            case MovementDirection.Close:
            // シャッターを閉じる
                break;
            case MovementDirection.DefinedByPosition:
            // 指定距離までシャッターを動かす
                break;
        }
   }

    /**
     * キャリブレーション実行
     */
    override executeCalibration(): MaybePromise {
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

