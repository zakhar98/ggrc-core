/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../form/form-validation-icon';
import '../form/form-validation-text';
import '../custom-attributes/custom-attributes-field-view';

import template from './custom-attributes.mustache';

(function (can, GGRC, $) {
  'use strict';

  GGRC.Components('localCustomAttributes', {
    tag: 'custom-attributes',
    template: template,
    viewModel: {
      fields: [],
      editMode: false,
      fieldValueChanged: function (e, field) {
        this.dispatch({
          type: 'valueChanged',
          fieldId: e.fieldId,
          value: e.value,
          field: field
        });
      }
    }
  });
})(window.can, window.GGRC, window.jQuery);
