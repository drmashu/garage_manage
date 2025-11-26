#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { OnOffLightRequirements } from "@matter/main/devices/on-off-light";
import { Gpio } from "pigpio";
import * as Consts from "./consts.js"

/**照明スイッチのGPIOピンNo */
const GPIO_SW_TOGGLE_LIGHT = 17;

/**実機側照明のGPIOピンNo */
const GPIO_DEV_LIGHT = 24;
/**照明インジケータLEDのGPIOピンNo */
const GPIO_IND_LIGHT = 7;

const BTN_LIGHT = new Gpio(GPIO_SW_TOGGLE_LIGHT, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});

const DEV_LIGHT = new Gpio(GPIO_DEV_LIGHT, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_DOWN,
});

const IND_LIGHT = new Gpio(GPIO_IND_LIGHT, {
  mode: Gpio.OUTPUT,
  pullUpDown: Gpio.PUD_UP,
});

/**
 * 照明のON/OFFサーバ
 */
export class Light extends OnOffLightRequirements.OnOffServer {
  override initialize() {
    this.reactTo(this.events.onOff$Changed, this.#stateChanged);
  }

  #stateChanged(value: boolean) {
    console.log(`Light is now ${value ? "illuminated" : "dark"}`);
  }
}
