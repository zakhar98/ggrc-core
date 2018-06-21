/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

can.Model.Cacheable('CMS.Models.TechnologyEnvironment', {
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
    'base-notifications',
  ],
  attributes: {
    context: 'CMS.Models.Context.stub',
    modified_by: 'CMS.Models.Person.stub',
    object_people: 'CMS.Models.ObjectPerson.stubs',
    people: 'CMS.Models.Person.stubs',
    objectives: 'CMS.Models.Objective.stubs',
    controls: 'CMS.Models.Control.stubs',
    sections: 'CMS.Models.get_stubs',
  },
  tree_view_options: {
    attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
    attr_list: can.Model.Cacheable.attr_list.concat([
      {attr_title: 'Effective Date', attr_name: 'start_date'},
      {attr_title: 'Last Deprecated Date', attr_name: 'end_date'},
      {attr_title: 'Reference URL', attr_name: 'reference_url'},
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
