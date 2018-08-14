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

export default Cacheable('CMS.Models.TechnologyEnvironment', {
  root_object: 'technology_environment',
  root_collection: 'technology_environments',
  category: 'business',
  findAll: '/api/technology_environments',
  findOne: '/api/technology_environments/{id}',
  create: 'POST /api/technology_environments',
  update: 'PUT /api/technology_environments/{id}',
  destroy: 'DELETE /api/technology_environments/{id}',
  mixins: [
    'unique_title',
    'ca_update',
    'timeboxed',
    'accessControlList',
    'scope-object-notifications',
    'questionnaire',
  ],
  attributes: {
    context: 'CMS.Models.Context.stub',
    modified_by: 'CMS.Models.Person.stub',
  },
  tree_view_options: {
    attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
    attr_list: Cacheable.attr_list.concat([
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
      },
    ]),
    add_item_view: GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
    link_buttons: true,
    display_attr_names: ['title', 'status', 'updated_at'],
  },
  is_custom_attributable: true,
  isRoleable: true,
  defaults: {
    title: '',
    url: '',
    status: 'Draft',
  },
  sub_tree_view_options: {
    default_filter: ['Product'],
  },
  statuses: ['Draft', 'Deprecated', 'Active'],
  init: function () {
    this.validateNonBlank('title');
    this._super(...arguments);
  },
}, {});
