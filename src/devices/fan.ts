#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */

import { Endpoint } from "@matter/main";
import { OnOffPlugInUnitDevice } from "@matter/main/devices";
import { Gpio } from "pigpio";

import * as Consts from "./consts.js"

/**換気扇スイッチのGPIOピンNo */
const GPIO_SW_TOGGLE_FAN = 22;

/**実機換気扇のGPIOピンNo */
const GPIO_DEV_FAN = 24;
/**換気扇インジケータLEDのGPIOピンNo */
const GPIO_IND_FAN = 23;

/**実機換気扇のGPIO */
const DEV_FAN = new Gpio(GPIO_DEV_FAN, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

/**換気扇インジケータLEDのGPIO */
const IND_FAN = new Gpio(GPIO_IND_FAN, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_UP,
});

/**
 * 照明用エンドポイントを作成.
 */
export const FanEndpoint = new Endpoint(OnOffLightDevice, {
  id: 'fan'
});

/**
 * リモートからのON/OFFイベントの処理.
 */
FanEndpoint.events.onOff.onOff$Changed.on((swOn: any) => {
  console.log(`Light is now ${swOn ? "ON" : "OFF"}`);
  if (swOn) {
    switchOn();
  } else {
    switchOff();
  }
});

/**換気扇スイッチのGPIO */
const BTN_FAN = new Gpio(GPIO_SW_TOGGLE_FAN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});

/**
 * 換気扇ボタンの設定.
 * GLITCH_INTERVAL_NS以下の信号は無視.
 */
BTN_FAN.glitchFilter(Consts.GLITCH_INTERVAL_NS);
/**
 * 換気扇ボタン押下時の処理.
 */
BTN_FAN.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    const onOffValue = FanEndpoint.state.onOff.onOff;
    console.log(`Push HW Btn. Fan is ${onOffValue ? "ON" : "OFF"} to ${!onOffValue ? "ON" : "OFF"}`);
    await FanEndpoint.set({
      onOff: {
          onOff: !onOffValue,
      },
    });
  } 
});

/**
 * 照明ON.
 */
function switchOn() {
  DEV_FAN.digitalWrite(1);
  IND_FAN.digitalWrite(1);
}

/**
 * 照明OFF.
 */
function switchOff() {
  DEV_FAN.digitalWrite(0);
  IND_FAN.digitalWrite(0);
}
