const settings = {
    default_feed_rate: undefined,
    steps_per_mm: new Array(3),
    default_seek_rate: undefined
}

const sys = {
    opt_stop: undefined,
    coord_select: undefined
}

const X_AXIS = 0, Y_AXIS = 1, Z_AXIS = 2;

export class GCodeInterpreter {
    constructor() {
        this.gc = new GCodeInterpreterState();
    }

    interpretGCode(code) {
        let group_number = MODAL_GROUP_NONE,
            int_value,
            non_modal_action = NON_MODAL_NONE, // Tracks the actions of modal group 0 (non-modal)
            absolute_override = false, // true(1) = absolute motion for this block only {G53}
            gc = this.gc;


        code.words.forEach(word => {
            int_value = parseInt(word.value, 10);
            switch (word.letter) {
                case 'G':
                    // Set modal group values
                    switch (int_value) {
                        // group 0: non-modal gcodes
                        case 4: case 10: case 28: case 30: case 53: case 92:
                            group_number = MODAL_GROUP_0; break;

                        // group 1: motion
                        // codes supported by grbl:
                        case 0: case 1: case 2: case 3: case 80:
                        // codes not supported by grbl:
                        case 38: case 81: case 82: case 83: case 84:
                        case 85: case 86: case 87: case 88: case 89:
                            group_number = MODAL_GROUP_1; break;

                        // group 2: plane selection
                        case 17: case 18: case 19: group_number = MODAL_GROUP_2; break;

                        // group 3: distance mode
                        case 90: case 91: group_number = MODAL_GROUP_3; break;

                        // group 5: feed rate mode
                        case 93: case 94: group_number = MODAL_GROUP_5; break;

                        // group 6: units
                        case 20: case 21: group_number = MODAL_GROUP_6; break;

                        // group 7: cutter radius compensation (not supported by grbl)
                        case 40: case 41: case 42: group_number = MODAL_GROUP_7; break;

                        // group 8: tool length offset (not supported by grbl)
                        case 43: case 49: group_number = MODAL_GROUP_8; break;

                        // group 10: return mode in canned cycles (not supported by grbl)
                        case 98: case 99: group_number = MODAL_GROUP_10; break;

                        // group 12: coordinate system selection
                        case 54: case 55: case 56: case 57: case 58: case 59:
                            group_number = MODAL_GROUP_12; break;

                        // group 13: path control mode (not supported by grbl)
                        case 61: case 64: group_number = MODAL_GROUP_13; break;
                        default: break;
                    }
                    // Set 'G' commands
                    switch (int_value) {
                        case 0:
                            gc.motion_mode = MOTION_MODE_SEEK;
                            console.log("MOTION_MODE_SEEK");
                            break;
                        case 1:
                            gc.motion_mode = MOTION_MODE_LINEAR;
                            console.log("MOTION_MODE_LINEAR");
                            break;
                        case 2:
                            gc.motion_mode = MOTION_MODE_CW_ARC;
                            console.log("MOTION_MODE_CW_ARC");
                            break;
                        case 3:
                            gc.motion_mode = MOTION_MODE_CCW_ARC;
                            console.log("MOTION_MODE_CCW_ARC");
                            break;
                        case 4:
                            non_modal_action = NON_MODAL_DWELL;
                            console.log("NON_MODAL_DWELL");
                            break;
                        case 10:
                            non_modal_action = NON_MODAL_SET_COORDINATE_DATA;
                            console.log("NON_MODAL_SET_COORDINATE_DATA");
                            break;
                        case 17:
                            gc.selectPlane(X_AXIS, Y_AXIS, Z_AXIS);
                            console.log("PLANE: XYZ");
                            break;
                        case 18:
                            gc.selectPlane(X_AXIS, Z_AXIS, Y_AXIS);
                            console.log("PLANE: XZY");
                            break;
                        case 19:
                            gc.selectPlane(Y_AXIS, Z_AXIS, X_AXIS);
                            console.log("PLANE: YZX");
                            break;
                        case 20:
                            gc.inches_mode = true;
                            console.log("UNITS: inches");
                            break;
                        case 21:
                            gc.inches_mode = false;
                            console.log("UNITS: millimeters");
                            break;
                        case 28: case 30:
                            non_modal_action = NON_MODAL_GO_HOME;
                            console.log("NON_MODAL_GO_HOME");
                            break;
                        case 53:
                            absolute_override = true;
                            console.log("absolute_override ON");
                            break;
                        case 54: case 55: case 56: case 57: case 58: case 59:
                            int_value -= 54; // Compute coordinate system row index (0=G54,1=G55,...)
                            if (int_value < 3) {
                                sys.coord_select = int_value;
                            } else {
                                throw new Error(STATUS_UNSUPPORTED_STATEMENT);
                            }
                            console.log("coordinate system selection");
                            break;
                        case 80:
                            gc.motion_mode = MOTION_MODE_CANCEL;
                            console.log("MOTION_MODE_CANCEL");
                            break;
                        case 90:
                            gc.absolute_mode = true;
                            console.log("absolute_mode ON");
                            break;
                        case 91:
                            gc.absolute_mode = false;
                            console.log("absolute_mode OFF");
                            break;
                        case 92:
                            int_value = parseInt(10 * word.value); // Multiply by 10 to pick up G92.1
                            switch (int_value) {
                                case 920:
                                    non_modal_action = NON_MODAL_SET_COORDINATE_OFFSET;
                                    console.log("NON_MODAL_SET_COORDINATE_OFFSET");
                                    break;
                                case 921:
                                    non_modal_action = NON_MODAL_RESET_COORDINATE_OFFSET;
                                    console.log("NON_MODAL_RESET_COORDINATE_OFFSET");
                                    break;
                                default: throw new Error(STATUS_UNSUPPORTED_STATEMENT);
                            }
                            break;
                        case 93:
                            gc.inverse_feed_rate_mode = true;
                            console.log("inverse_feed_rate_mode ON");
                            break;
                        case 94:
                            gc.inverse_feed_rate_mode = false;
                            console.log("inverse_feed_rate_mode OFF");
                            break;
                        default: throw new Error(STATUS_UNSUPPORTED_STATEMENT);
                    }
                    break;
                case 'M':
                    // Set modal group values
                    switch (int_value) {

                        // group 4: Stopping
                        // codes supported by grbl:
                        case 0: case 1: case 2: case 30:
                        // codes not supported by grbl:
                        case 60:
                            group_number = MODAL_GROUP_4; break;

                        // group 6: units (not supported by grbl)
                        case 6: group_number = MODAL_GROUP_6; break;

                        // group 7: Spindle turning
                        case 3: case 4: case 5: group_number = MODAL_GROUP_7; break;

                        // group 8: Coolant (special case: M7 & M8 may be active at the same time) (not supported by grbl)
                        case 7: case 8: case 9: group_number = MODAL_GROUP_8; break;

                        // group 9: Enable/disable feed and speed override switches (not supported by grbl)
                        case 48: case 49: group_number = MODAL_GROUP_9; break;
                    }
            }
            let message = word + " code: " + word.letter + " val: " + word.value + " group: ";

            switch (group_number) {
                case MODAL_GROUP_NONE: message += "no group"; break;
                case MODAL_GROUP_0: message += "non modal"; break;
                case MODAL_GROUP_1: message += "motion"; break;
                case MODAL_GROUP_2: message += "plane selection"; break;
                case MODAL_GROUP_3: message += "distance mode"; break;
                case MODAL_GROUP_4: message += "stopping"; break;
                case MODAL_GROUP_5: message += "feed rate mode"; break;
                case MODAL_GROUP_6: message += "units"; break;
                case MODAL_GROUP_7: message += (word.letter == "G" ? "cutter radius compensation" : "spindle turning"); break;
                case MODAL_GROUP_8: message += (word.letter == "G" ? "tool length offset" : "coolant"); break;
                case MODAL_GROUP_9: message += "enable/disable feed and speed override switches"; break;
                case MODAL_GROUP_10: message += "return mode in canned cycles"; break;
                case MODAL_GROUP_12: message += "coordinate system selection"; break;
                case MODAL_GROUP_13: message += "path control mode"; break;
                default: break;
            }
            console.log(message);
        })
    }

    interpret(gcodeModel) {
        gcodeModel.codes.forEach(code => {
            this.interpretGCode(code);
        })
    }
}

class GCodeInterpreterState {
    constructor() {
        this.status_code = undefined;              // Parser status for current block
        this.motion_mode = undefined;              // {G0, G1, G2, G3, G80}
        this.inverse_feed_rate_mode = undefined;   // {G93, G94}
        this.inches_mode = false;      // 0 = millimeter mode, 1 = inches mode {G20, G21}
        this.absolute_mode = true;     // 0 = relative motion, 1 = absolute motion {G90, G91}
        this.program_flow = undefined;             // {M0, M1, M2, M30}
        this.spindle_direction = undefined;        // 1 = CW, -1 = CCW, 0 = Stop {M3, M4, M5}
        this.feed_rate = settings.default_feed_rate; // Millimeters/second
        this.seek_rate = settings.default_seek_rate; // Millimeters/second
        this.position = new Array(3);  // Where the interpreter considers the tool to be at this point in the code
        this.tool = undefined;
        this.spindle_speed = undefined;            // RPM/100
        this.plane_axis_0 = undefined;
        this.plane_axis_1 = undefined;
        this.plane_axis_2 = undefined;             // The axes of the selected plane

        this.selectPlane(X_AXIS, Y_AXIS, Z_AXIS);
    }

    selectPlane(axis_0, axis_1, axis_2) {
        this.plane_axis_0 = axis_0;
        this.plane_axis_1 = axis_1;
        this.plane_axis_2 = axis_2;
    }
}

const MODAL_GROUP_NONE = 0,
    MODAL_GROUP_0 = 1, // [G4,G10,G28,G30,G53,G92,G92.1] Non-modal ( [G92.2,G92.3] not supported by grbl )
    MODAL_GROUP_1 = 2, // [G0,G1,G2,G3,G80] Motion ( [G38.2,G81,G82,G83,G84,G85,G86,G87,G88,G89] not supported by grbl )
    MODAL_GROUP_2 = 3, // [G17,G18,G19] Plane selection
    MODAL_GROUP_3 = 4, // [G90,G91] Distance mode
    MODAL_GROUP_4 = 5, // [M0,M1,M2,M30] Stopping ( [M60] not supported by grbl )
    MODAL_GROUP_5 = 6, // [G93,G94] Feed rate mode
    MODAL_GROUP_6 = 7, // [G20,G21] Units ( [M6] not supported by grbl )
    MODAL_GROUP_7 = 8, // [M3,M4,M5] Spindle turning, ( [G40,G41,G42] Cutter radius compensation: not supported by grbl )
    MODAL_GROUP_8 = 9, // (not supported by grbl) [G43,G49] Tool length offset, [M7,M8,M9] Coolant (special case: M7 & M8 may be active at the same time)
    MODAL_GROUP_9 = 10,  // (not supported by grbl) [M48,M49] Enable/disable feed and speed override switches
    MODAL_GROUP_10 = 11, // (not supported by grbl) [G98,G99] Return mode in canned cycles
    MODAL_GROUP_12 = 12, // [G54,G55,G56,G57,G58,G59] Coordinate system selection ( [G59.1,G59.2,G59.3] not supported by grbl )
    MODAL_GROUP_13 = 13; // (not supported by grbl) [G61,G61.1,G64] path control mode


const MOTION_MODE_SEEK = 0, // G0
    MOTION_MODE_LINEAR = 1, // G1
    MOTION_MODE_CW_ARC = 2,  // G2
    MOTION_MODE_CCW_ARC = 3,  // G3
    MOTION_MODE_CANCEL = 4; // G80

const PROGRAM_FLOW_RUNNING = 0,
    PROGRAM_FLOW_PAUSED = 1, // M0, M1
    PROGRAM_FLOW_COMPLETED = 2; // M2, M30

const NON_MODAL_NONE = 0,
    NON_MODAL_DWELL = 1, // G4
    NON_MODAL_SET_COORDINATE_DATA = 2, // G10
    NON_MODAL_GO_HOME = 3, // G28,G30
    NON_MODAL_SET_COORDINATE_OFFSET = 4, // G92
    NON_MODAL_RESET_COORDINATE_OFFSET = 5; //G92.1

const STATUS_UNSUPPORTED_STATEMENT = "Unsupported statement.";