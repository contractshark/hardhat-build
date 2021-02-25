"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.assertHardhatInvariant = exports.applyErrorMessageTemplate = exports.NomicLabsHardhatPluginError = exports.HardhatPluginError = exports.HardhatError = exports.CustomError = void 0;
var caller_package_1 = require("../util/caller-package");
var strings_1 = require("../util/strings");
var errors_list_1 = require("./errors-list");
var inspect = Symbol["for"]("nodejs.util.inspect.custom");
var CustomError = /** @class */ (function (_super) {
    __extends(CustomError, _super);
    function CustomError(message, parent) {
        var _this = 
        // WARNING: Using super when extending a builtin class doesn't work well
        // with TS if you are compiling to a version of JavaScript that doesn't have
        // native classes. We don't do that in Hardhat.
        //
        // For more info about this, take a look at: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        _super.call(this, message) || this;
        _this.parent = parent;
        _this.name = _this.constructor.name;
        // We do this to avoid including the constructor in the stack trace
        if (Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(_this, _this.constructor);
        }
        return _this;
    }
    CustomError.prototype[inspect] = function () {
        var _a, _b, _c, _d, _e;
        var str = this.stack;
        if (this.parent !== undefined) {
            var parentAsAny = this.parent;
            var causeString = (_e = (_d = (_b = (_a = parentAsAny[inspect]) === null || _a === void 0 ? void 0 : _a.call(parentAsAny)) !== null && _b !== void 0 ? _b : (_c = parentAsAny.inspect) === null || _c === void 0 ? void 0 : _c.call(parentAsAny)) !== null && _d !== void 0 ? _d : parentAsAny.stack) !== null && _e !== void 0 ? _e : parentAsAny.toString();
            var nestedCauseStr = causeString
                .split("\n")
                .map(function (line) { return "    " + line; })
                .join("\n")
                .trim();
            str += "\n\n    Caused by: " + nestedCauseStr;
        }
        return str;
    };
    return CustomError;
}(Error));
exports.CustomError = CustomError;
var HardhatError = /** @class */ (function (_super) {
    __extends(HardhatError, _super);
    function HardhatError(errorDescriptor, messageArguments, parentError) {
        if (messageArguments === void 0) { messageArguments = {}; }
        var _this = this;
        var prefix = errors_list_1.getErrorCode(errorDescriptor) + ": ";
        var formattedMessage = applyErrorMessageTemplate(errorDescriptor.message, messageArguments);
        _this = _super.call(this, prefix + formattedMessage, parentError) || this;
        _this.errorDescriptor = errorDescriptor;
        _this.number = errorDescriptor.number;
        _this.messageArguments = messageArguments;
        _this._isHardhatError = true;
        Object.setPrototypeOf(_this, HardhatError.prototype);
        return _this;
    }
    HardhatError.isHardhatError = function (other) {
        return (other !== undefined && other !== null && other._isHardhatError === true);
    };
    HardhatError.isHardhatErrorType = function (other, descriptor) {
        return (HardhatError.isHardhatError(other) &&
            other.errorDescriptor.number === descriptor.number);
    };
    return HardhatError;
}(CustomError));
exports.HardhatError = HardhatError;
/**
 * This class is used to throw errors from hardhat plugins made by third parties.
 */
var HardhatPluginError = /** @class */ (function (_super) {
    __extends(HardhatPluginError, _super);
    function HardhatPluginError(pluginNameOrMessage, messageOrParent, parent) {
        var _this = this;
        if (typeof messageOrParent === "string") {
            _this = _super.call(this, messageOrParent, parent) || this;
            _this.pluginName = pluginNameOrMessage;
        }
        else {
            _this = _super.call(this, pluginNameOrMessage, messageOrParent) || this;
            _this.pluginName = caller_package_1.getClosestCallerPackage();
        }
        _this._isHardhatPluginError = true;
        Object.setPrototypeOf(_this, HardhatPluginError.prototype);
        return _this;
    }
    HardhatPluginError.isHardhatPluginError = function (other) {
        return (other !== undefined &&
            other !== null &&
            other._isHardhatPluginError === true);
    };
    return HardhatPluginError;
}(CustomError));
exports.HardhatPluginError = HardhatPluginError;
var NomicLabsHardhatPluginError = /** @class */ (function (_super) {
    __extends(NomicLabsHardhatPluginError, _super);
    /**
     * This class is used to throw errors from *core* hardhat plugins. If you are
     * developing a third-party plugin, use HardhatPluginError instead.
     */
    function NomicLabsHardhatPluginError(pluginName, message, parent, shouldBeReported) {
        if (shouldBeReported === void 0) { shouldBeReported = false; }
        var _this = _super.call(this, pluginName, message, parent) || this;
        _this.shouldBeReported = shouldBeReported;
        _this._isNomicLabsHardhatPluginError = true;
        Object.setPrototypeOf(_this, NomicLabsHardhatPluginError.prototype);
        return _this;
    }
    NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError = function (other) {
        return (other !== undefined &&
            other !== null &&
            other._isNomicLabsHardhatPluginError === true);
    };
    return NomicLabsHardhatPluginError;
}(HardhatPluginError));
exports.NomicLabsHardhatPluginError = NomicLabsHardhatPluginError;
/**
 * This function applies error messages templates like this:
 *
 *  - Template is a string which contains a variable tags. A variable tag is a
 *    a variable name surrounded by %. Eg: %plugin1%
 *  - A variable name is a string of alphanumeric ascii characters.
 *  - Every variable tag is replaced by its value.
 *  - %% is replaced by %.
 *  - Values can't contain variable tags.
 *  - If a variable is not present in the template, but present in the values
 *    object, an error is thrown.
 *
 * @param template The template string.
 * @param values A map of variable names to their values.
 */
function applyErrorMessageTemplate(template, values) {
    return _applyErrorMessageTemplate(template, values, false);
}
exports.applyErrorMessageTemplate = applyErrorMessageTemplate;
function _applyErrorMessageTemplate(template, values, isRecursiveCall) {
    if (!isRecursiveCall) {
        for (var _i = 0, _a = Object.keys(values); _i < _a.length; _i++) {
            var variableName = _a[_i];
            if (variableName.match(/^[a-zA-Z][a-zA-Z0-9]*$/) === null) {
                throw new HardhatError(errors_list_1.ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME, {
                    variable: variableName
                });
            }
            var variableTag = "%" + variableName + "%";
            if (!template.includes(variableTag)) {
                throw new HardhatError(errors_list_1.ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING, {
                    variable: variableName
                });
            }
        }
    }
    if (template.includes("%%")) {
        return template
            .split("%%")
            .map(function (part) { return _applyErrorMessageTemplate(part, values, true); })
            .join("%");
    }
    for (var _b = 0, _c = Object.keys(values); _b < _c.length; _b++) {
        var variableName = _c[_b];
        var value = void 0;
        if (values[variableName] === undefined) {
            value = "undefined";
        }
        else if (values[variableName] === null) {
            value = "null";
        }
        else {
            value = values[variableName].toString();
        }
        if (value === undefined) {
            value = "undefined";
        }
        var variableTag = "%" + variableName + "%";
        if (value.match(/%([a-zA-Z][a-zA-Z0-9]*)?%/) !== null) {
            throw new HardhatError(errors_list_1.ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG, { variable: variableName });
        }
        template = strings_1.replaceAll(template, variableTag, value);
    }
    return template;
}
function assertHardhatInvariant(invariant, message) {
    if (!invariant) {
        throw new HardhatError(errors_list_1.ERRORS.GENERAL.ASSERTION_ERROR, { message: message });
    }
}
exports.assertHardhatInvariant = assertHardhatInvariant;
