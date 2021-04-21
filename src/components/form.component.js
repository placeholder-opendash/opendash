import lodash from "lodash";

import Logger from "../helper/logger";

const logger = Logger("od.ui.form");

class controller {
  static get $inject() {
    return ["$element", "$compile", "$rootScope", "$q"];
  }

  constructor($element, $compile, $rootScope, $q) {
    this.$onInit = () => {
      logger.assert(
        lodash.isArray(this.form),
        "Databinding 'form' must be an Array"
      );
      logger.assert(
        lodash.isObject(this.data),
        "Databinding 'data' must be an Object"
      );

      let scope = $rootScope.$new();
      let template = "<div>";

      scope.output = this.data;
      scope.helper = {};
      scope.label = {};
      scope.error = {};
      scope.isVisible = {};

      function onChange(key, value) {
        try {
          this.onChange(key, value);
        } catch (error) {
          // that's ok...
        }
        // console.log(key);
      }

      for (const element of this.form) {
        if (!this.validateFormElement(element)) {
          logger.warn("Form Element is not valid.");
          continue;
        }

        // add helper object:
        scope.helper[element.key] = {};

        scope.isVisible[element.key] = function () {
          if (!lodash.isFunction(element.isVisible)) {
            return true;
          }

          return element.isVisible();
        };

        // add label:
        scope.label[element.key] = element.label;

        template += `<div ng-show="isVisible['${element.key}']()">`;
        template += `<span>{{ label['${element.key}'] | translate }}</span>`;

        switch (element.type) {
          case "input":
            scope.helper[element.key].onChange = function () {
              onChange(element.key, null);
            };

            template += `<input
                          type="${element.settings.type || "text"}"
                          ng-model="output['${element.key}']"
                          ng-change="helper['${element.key}'].onChange()"
                          >`;

            break;

          case "textarea":
            scope.helper[element.key].onChange = function () {
              onChange(element.key, null);
            };

            template += `<textarea rows="${element.settings.rows || "4"}"
                            ng-model="output['${element.key}']"
                            ng-change="helper['${element.key}'].onChange()"
                            ></textarea>`;

            break;

          case "select":
            scope.helper[element.key].options = element.settings.options;

            scope.helper[element.key].onChange = function () {
              onChange(element.key, null);
            };

            template += `<select
                          ng-model="output['${element.key}']"
                          ng-options="o.value as o.label for o in helper['${element.key
              }'].options"
                          ng-change="helper['${element.key}'].onChange()"
                          ></select>`;

            break;

          case "select-item":
            scope.helper[element.key].watcher = function (selection) {
              scope.output[element.key] = selection;
              onChange(element.key, selection);
            };

            scope.helper[element.key].settings = Object.assign(
              {},
              element.settings,
              {
                initialSelection: scope.output[element.key],
              }
            );

            template += `<od-select-item
                          config="helper['${element.key}'].settings"
                          watch="helper['${element.key}'].watcher"
                          ></od-select-item>`;

            break;

          case "select-date":
            scope.helper[element.key].watcher = function (selection) {
              scope.output[element.key] = selection;
              onChange(element.key, selection);
            };

            scope.helper[element.key].settings = element.settings;

            template += `<od-select-date
                          config="helper['${element.key}'].settings"
                          watch="helper['${element.key}'].watcher"
                          ></od-select-date>`;

            break;

          case "select-icon":
            scope.helper[element.key].watcher = function (selection) {
              scope.output[element.key] = selection;
              onChange(element.key, selection);
            };

            scope.helper[element.key].settings = element.settings;

            template += `<od-select-icon
                          selection="output['${element.key}']"
                          options="helper['${element.key}'].settings.options"
                          watch="helper['${element.key}'].watcher"
                          ></od-select-icon>`;

            break;

          default:
            logger.warn("Unknown type.");
            break;
        }

        template += "</div>";
      }

      // For debugging:
      // template += "<pre>{{ output }}</pre>";
      template += "</div>";

      // create new element and use it as form html
      let element = $compile(template)(scope);
      $element.html(element);
      setTimeout(() => {
        scope.$digest();
      }, 100);
    };
  }

  validateFormElement(element) {
    return (
      lodash.isObject(element) &&
      lodash.isString(element.type) &&
      lodash.isString(element.key) &&
      lodash.isString(element.label) &&
      lodash.isObject(element.settings)
    );
  }
}

const template = "{{ 'od.ui.form.error.creation' | translate }}";

let component = {
  controller,
  template,
  bindings: {
    form: "<",
    data: "<",
    onChange: "&",
    valid: "=",
  },
};

export default component;
