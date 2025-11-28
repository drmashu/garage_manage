/**
 * @license
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gpio } from 'pigpio';

/**
 * HC-SR04を使用して距離を計測するクラス
 */
export class HCSR04 {
  private trigger: Gpio;
  private echo: Gpio;

  constructor(triggerPin: number, echoPin: number) {
    this.trigger = new Gpio(triggerPin, { mode: Gpio.OUTPUT });
    this.echo = new Gpio(echoPin, { mode: Gpio.INPUT, alert: true });
    this.trigger.digitalWrite(0);
  }

  async getDistanceCm(): Promise<number> {
    return new Promise((resolve) => {
      let startTick: number | null = null;

      const handler = (level: number, tick: number) => {
        if (level === 1) startTick = tick;
        if (level === 0 && startTick !== null) {
          const diff = (tick >>> 0) - (startTick >>> 0); // microseconds
          const cm = diff / 2 / 29.1;
          this.echo.off('alert', handler);
          resolve(cm);
        }
      };

      this.echo.on('alert', handler);
      this.trigger.trigger(10, 1); // 10µs pulse
    });
  }
}