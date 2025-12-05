#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */

import { FanRequirements } from '@matter/main/devices/fan';
import { FanControl } from '@matter/types/clusters/fan-control';
import { Gpio } from "pigpio";

import * as Consts from "./consts.js"

/**換気扇スイッチのGPIOピンNo */
const GPIO_SW_TOGGLE_FAN = 22;

/**実機換気扇のGPIOピンNo */
const GPIO_DEV_FAN = 24;
/**換気扇インジケータLEDのGPIOピンNo */
const GPIO_IND_FAN = 23;

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

export class VentilationFan extends FanRequirements.OnOffServer {
  override initialize() {
    //this.state.fanModeSequence = FanControl.FanModeSequence.OffHigh;
    this.reactTo(this.events.onOff$Changed, this.#applyOnOff);
    BTN_FAN.glitchFilter(Consts.GLITCH_INTERVAL_NS);
    BTN_FAN.on("alert", (level: any, tickl: any) => {
      if (level == 0) {
        const current = this.state.onOff;
        this.state.onOff = !current;
      }
    });
  }

  #applyOnOff(swOn: boolean) {

    if (swOn) {
      this.switchOn();      
    } else {
      this.switchOff();      
    }
  };

  protected switchOn() {
    DEV_FAN.digitalWrite(1);
    IND_FAN.digitalWrite(1);
  }

  protected switchOff() {
    DEV_FAN.digitalWrite(0);
    IND_FAN.digitalWrite(0);
  }
}

//export const VentilationFan = new Endpoint(FanDevice)