# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Object State Module"""

import unittest
from ddt import ddt
from ddt import data
import ggrc.app  # noqa pylint: disable=unused-import
from ggrc.models import all_models


@ddt
class TestAccessControlList(unittest.TestCase):
  """Test Access Control List"""

  ACL_OBJECTS = (
      'AccessGroup', 'Assessment', 'Clause', 'Contract',
      'Control', 'DataAsset', 'Facility', 'Issue', 'Market',
      'Objective', 'OrgGroup', 'Policy', 'Process', 'Product', 'Project',
      'Program', 'Regulation', 'Risk', 'Section', 'Standard', 'System',
      'System', 'Process', 'Threat', 'Vendor', 'Metric',
      'TechnologyEnvironment')

  @data(*ACL_OBJECTS)
  def test_access_control_roles(self, obj):  # noqa pylint: disable=no-self-use
    """Test if ACL_OBJECTS have the access_control_list property"""
    model = getattr(all_models, obj)
    assert hasattr(model, "access_control_list"), \
        "{} does not have access_control_list prop".format(model.__name__)
