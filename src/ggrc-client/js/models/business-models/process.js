/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cacheable from '../cacheable';
import '../mixins/unique-title';
import '../mixins/ca-update';
import '../mixins/timeboxed';
import '../mixins/access-control-list';
import '../mixins/scope-object-notifications';
import '../mixins/questionnaire';

export default Cacheable('CMS.Models.Process', {
  root_object: 'process',
  root_collection: 'processes',
  model_plural: 'Processes',
  table_plural: 'processes',
  title_plural: 'Processes',
  model_singular: 'Process',
  title_singular: 'Process',
  table_singular: 'process',
  category: 'business',
  findAll: 'GET /api/processes',
  findOne: 'GET /api/processes/{id}',
  create: 'POST /api/processes',
  update: 'PUT /api/processes/{id}',
  destroy: 'DELETE /api/processes/{id}',
  mixins: [
    'unique_title',
    'ca_update',
    'timeboxed',
    'accessControlList',
    'scope-object-notifications',
    'questionnaire',
  ],
  is_custom_attributable: true,
  isRoleable: true,
  attributes: {
    context: 'CMS.Models.Context.stub',
    modified_by: 'CMS.Models.Person.stub',
    network_zone: 'CMS.Models.Option.stub',
  },
  defaults: {
    title: '',
    url: '',
    status: 'Draft',
  },
  tree_view_options: {
    attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
    attr_list: can.Model.Cacheable.attr_list.concat([
      {
        attr_title: 'Network Zone',
        attr_name: 'network_zone',
        attr_sort_field: 'network_zone',
      },
      {attr_title: 'Effective Date', attr_name: 'start_date'},
      {attr_title: 'Last Deprecated Date', attr_name: 'end_date'},
      {attr_title: 'Reference URL', attr_name: 'reference_url'},
      {
        attr_title: 'Description',
        attr_name: 'description',
        disable_sorting: true,
      }, {
        attr_title: 'Notes',
        attr_name: 'notes',
        disable_sorting: true,
      }, {
        attr_title: 'Assessment Procedure',
        attr_name: 'test_plan',
        disable_sorting: true,
      }]),
    add_item_view: GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
  },
  sub_tree_view_options: {
    default_filter: ['Risk'],
  },
  statuses: ['Draft', 'Deprecated', 'Active'],
  init: function () {
    if (this._super) {
      this._super(...arguments);
    }

    this.validateNonBlank('title');
  },
}, {});
