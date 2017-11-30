/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../simple-popover/simple-popover';
import {getColumnsForModel} from '../../plugins/utils/tree-view-utils';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';

import template from './advanced-search-mapping-criteria.mustache';

(function (can, GGRC, CMS) {
  'use strict';

  /**
   * Mapping Criteria view model.
   * Contains logic used in Mapping Criteria component.
   * @constructor
   */
  var viewModel = can.Map.extend({
    define: {
      /**
       * Contains object represents criteria.
       * Contains the following fields: objectName, filter, mappedTo.
       * Initializes filter with Filter Attribute model.
       * @type {can.Map}
       */
      criteria: {
        type: '*',
        Value: can.Map,
        set: function (criteria) {
          if (!criteria.filter) {
            criteria.attr('filter',
              AdvancedSearch.create.attribute());
          }
          return criteria;
        }
      },
      /**
       * Indicates that criteria can be transformed to Mapping Group.
       * @type {boolean}
       */
      canBeGrouped: {
        type: 'boolean',
        value: false,
        get: function () {
          return this.attr('extendable') &&
           !(this.attr('criteria.mappedTo') && !this.attr('childCanBeGrouped'));
        }
      },
      /**
       * Indicates that child Mapping Criteria can be added.
       * @type {boolean}
       */
      canAddMapping: {
        type: 'boolean',
        value: false,
        get: function () {
          return !this.attr('criteria.mappedTo');
        }
      },
      /**
       * Indicates that popover should be displayed.
       * @type {boolean}
       */
      showPopover: {
        type: 'boolean',
        value: false,
        get: function () {
          return this.attr('canBeGrouped') && this.attr('canAddMapping');
        }
      }
    },
    /**
     * Indicates that child Mappping Criteria can be transformed to Mapping Group.
     * @type {boolean}
     */
    childCanBeGrouped: false,
    /**
     * Contains specific model name.
     * @type {string}
     * @example
     * Section
     * Regulation
     */
    modelName: null,
    /**
     * Indicates that Criteria is created on the root level.
     * Used for displaying correct label.
     */
    root: false,
    /**
     * Indicates that Criteria can be transformed to Mapping Group.
     * @type {boolean}
     */
    extendable: false,
    /**
     * Returns a list of available attributes for specific model.
     * @return {can.List} - List of available attributes.
     */
    availableAttributes: function () {
      var available = getColumnsForModel(
        this.attr('criteria.objectName'),
        null,
        true
      ).available;
      return available;
    },
    /**
     * Returns a list of available mapping types for specific model.
     * @return {Array} - List of available mapping types.
     */
    mappingTypes: function () {
      var mappings = GGRC.Mappings
        .get_canonical_mappings_for(this.attr('modelName'));
      var types = _.chain(mappings)
        .keys()
        .map(function (mapping) {
          return CMS.Models[mapping];
        })
        .compact()
        .sortBy('model_singular')
        .filter(function (mapping) {
          return mapping.model_singular && mapping.title_singular;
        })
        .value();

      if (!this.attr('criteria.objectName')) {
        this.attr('criteria.objectName', _.first(types).model_singular);
      }

      return types;
    },
    /**
     * Returns a criteria title.
     * @return {string} - Criteria title.
     */
    title: function () {
      if (this.attr('root')) {
        return 'Mapped To';
      }
      return 'Where ' +
              CMS.Models[this.attr('modelName')].title_singular +
              ' is mapped to';
    },
    /**
     * Dispatches event meaning that the component should be removed from parent container.
     */
    remove: function () {
      this.dispatch('remove');
    },
    /**
     * Dispatches event meaning that the component should be transformed to Mapping Group.
     */
    createGroup: function () {
      this.dispatch('createGroup');
    },
    /**
     * Creates the child Mapping Criteria.
     */
    addRelevant: function () {
      this.attr('criteria.mappedTo',
        AdvancedSearch.create.mappingCriteria());
    },
    /**
     * Removes the child Mapping Criteria.
     */
    removeRelevant: function () {
      this.removeAttr('criteria.mappedTo');
    },
    /**
     * Transforms child Mapping Criteria to Mapping Group.
     */
    relevantToGroup: function () {
      this.attr('criteria.mappedTo',
        AdvancedSearch.create.group([
          this.attr('criteria.mappedTo'),
          AdvancedSearch.create.operator('AND'),
          AdvancedSearch.create.mappingCriteria()
        ]));
    }
  });

  /**
   * Mapping Criteria is specific kind of Filter Item.
   */
  GGRC.Components('advancedSearchMappingCriteria', {
    tag: 'advanced-search-mapping-criteria',
    template: template,
    viewModel: viewModel,
    leakScope: false
  });
})(window.can, window.GGRC, window.CMS);
