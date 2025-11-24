/** 
 */
import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { MovementDirection, MovementType, WindowCoveringServer } from "@matter/main/behaviors/window-covering";

const ShutterServer = WindowCoveringServer.with("Lift", "PositionAwareLift");

/**
 * Implementation of the Matter WindowCovering cluster for the shade motor.
 */
export class Shutter extends ShutterServer {
    override async handleMovement(
        type: MovementType,
        reversed: boolean,
        direction: MovementDirection,
        targetPercent100ths?: number,
    ) {
        console.log(
            "Move shatter",
            direction === MovementDirection.Open ? "Open" : "Close",
            targetPercent100ths !== undefined ? `${targetPercent100ths / 100}%` : "",
        );

        // Updates the shade position
        await super.handleMovement(type, reversed, direction, targetPercent100ths);
    }
}

