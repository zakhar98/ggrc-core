/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import {getCustomAttributableModels} from '../../plugins/utils/models-utils';

/* class CustomAttributable
  *
  * CustomAttributable does not query the backend, it is used to display a
  * list of objects in the custom attributes widget. It inherits from
  * cacheable because it needs getBinding to properly display
  * CustomAttributeDefinitions as children
  *
  */
export default Cacheable('CMS.Models.CustomAttributable', {
  root_object: 'custom_attributable',
  tree_view_options: {
    attr_list: [{
      attr_title: 'OBJECT TYPE',
      attr_name: 'title',
      attr_type: 'admin',
      disable_sorting: true,
    }],
    attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
  },
  findAll: function () {
    let types = _.orderBy(getCustomAttributableModels(),
      'category', false);

    return can.when(can.map(types, (type, i) => {
      return new this(can.extend({}, type, {
        id: i,
      }));
    }));
  },
}, {
  // Cacheable checks if selfLink is set when the findAll deferred is done
  selfLink: '/custom_attribute_list',
});
