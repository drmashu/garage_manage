#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { FanRequirements } from "@matter/main/devices/fan";
import { Gpio } from "pigpio";
import * as Consts from "./consts.js"

/**換気扇スイッチのGPIOピンNo */
const GPIO_SW_TOGGLE_FAN = 18;

/**実機換気扇のGPIOピンNo */
const GPIO_DEV_FAN = 25;
/**換気扇インジケータLEDのGPIOピンNo */
const GPIO_IND_FAN = 8;

/**換気扇スイッチのGPIO */
const BTN_FAN = new Gpio(GPIO_SW_TOGGLE_FAN, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  alert: true,
});

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
 * Implementation of the OnOff cluster for our fan.
 */
export class Fan extends FanRequirements.OnOffServer {
  override initialize() {
    this.reactTo(this.events.onOff$Changed, this.#stateChanged);
  }

  #stateChanged(value: boolean) {
    console.log(`Fan is now ${value ? "working" : "stopped"}`);
  }
}
