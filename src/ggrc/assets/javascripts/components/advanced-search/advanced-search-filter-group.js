/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import AdvancedSearchContainer from '../view-models/advanced-search-container-vm';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';

import template from './advanced-search-filter-group.mustache';

(function (can, GGRC) {
  'use strict';

  /**
   * Filter Group view model.
   * Contains logic used in Filter Group component
   * @constructor
   */
  var viewModel = AdvancedSearchContainer.extend({
    /**
     * Contains available attributes for specific model.
     * @type {can.List}
     */
    availableAttributes: can.List(),
    /**
     * Adds Filter Operator and Filter Attribute to the collection.
     */
    addFilterCriterion: function () {
      var items = this.attr('items');
      items.push(AdvancedSearch.create.operator('AND'));
      items.push(AdvancedSearch.create.attribute());
    }
  });

  /**
   * Filter Group is a component allowing to compose Filter Attributes and Operators.
   */
  GGRC.Components('advancedSearchFilterGroup', {
    tag: 'advanced-search-filter-group',
    template: template,
    viewModel: viewModel
  });
})(window.can, window.GGRC);
