#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { Endpoint } from "@matter/main";
import { OnOffLightDevice } from "@matter/main/devices";
import { Gpio } from "pigpio";
import * as Consts from "./consts.js"

/**照明スイッチのGPIOピンNo */
const GPIO_SW_TOGGLE_LIGHT = 17;

/**実機側照明のGPIOピンNo */
const GPIO_DEV_LIGHT = 27;
/**照明インジケータLEDのGPIOピンNo */
const GPIO_IND_LIGHT = 18;

const DEV_LIGHT = new Gpio(GPIO_DEV_LIGHT, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

const IND_LIGHT = new Gpio(GPIO_IND_LIGHT, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_UP,
});

/**
 * 照明用エンドポイントを作成.
 */
export const LightEndpoint = new Endpoint(OnOffLightDevice, {
  id: 'light'
});

/**
 * リモートからのON/OFFイベントの処理.
 */
LightEndpoint.events.onOff.onOff$Changed.on((swOn: any) => {
  console.log(`Light is now ${swOn ? "ON" : "OFF"}`);
  if (swOn) {
    switchOn();
  } else {
    switchOff();
  }
});

/**
 * 照明ボタンのGPIO.
 */
const BTN_LIGHT = new Gpio(GPIO_SW_TOGGLE_LIGHT, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});
/**
 * 照明ボタンの設定.
 * GLITCH_INTERVAL_NS以下の信号は無視.
 */
BTN_LIGHT.glitchFilter(Consts.GLITCH_INTERVAL_NS);
/**
 * 照明ボタン押下時の処理.
 */
BTN_LIGHT.on("alert", async (level: any, tickl: any) => {
  if (level == 0) {
    const onOffValue = LightEndpoint.state.onOff.onOff;
    console.log(`Push HW Btn. Light is ${onOffValue ? "ON" : "OFF"} to ${!onOffValue ? "ON" : "OFF"}`);
    await LightEndpoint.set({
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
  DEV_LIGHT.digitalWrite(1);
  IND_LIGHT.digitalWrite(0);
}

/**
 * 照明OFF.
 */
function switchOff() {
  DEV_LIGHT.digitalWrite(0);
  IND_LIGHT.digitalWrite(1);
}
