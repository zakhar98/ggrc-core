/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Spinner from 'spin.js';
import {
  warning,
  BUTTON_VIEW_SAVE_CANCEL_DELETE,
  BUTTON_CREATE_PROPOSAL,
} from '../plugins/utils/modals';
import {
  hasWarningType,
  shouldApplyPreconditions,
} from '../plugins/utils/controllers';
import Permission from '../permission';
import {
  getPageInstance,
  navigate,
} from '../plugins/utils/current-page-utils';
import modalModels from '../models/modal-models';
import Mappings from '../models/mappers/mappings';

(function (can, $, GGRC) {
  'use strict';

  let originalModalShow = $.fn.modal.Constructor.prototype.show;
  let originalModalHide = $.fn.modal.Constructor.prototype.hide;

  let handlers = {
    modal: function ($target, $trigger, option) {
      $target.modal(option).draggable({handle: '.modal-header'});
    },

    deleteform: function ($target, $trigger, option) {
      let model = modalModels[$trigger.attr('data-object-singular')];
      let instance;
      let deleteCounts = new can.Map({loading: true, counts: ''});
      let modalSettings;

      if ($trigger.attr('data-object-id') === 'page') {
        instance = getPageInstance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }

      Mappings.get_orphaned_count(instance).done(function (counts) {
        deleteCounts.attr('loading', false);
        deleteCounts.attr('counts', counts);
      }).fail(function () {
        deleteCounts.attr('loading', false);
      });

      modalSettings = {
        $trigger: $trigger,
        skip_refresh: !$trigger.data('refresh'),
        new_object_form: false,
        button_view:
          GGRC.mustache_path + '/modals/delete_cancel_buttons.mustache',
        model: model,
        instance: instance,
        delete_counts: deleteCounts,
        modal_title: 'Delete ' + $trigger.attr('data-object-singular'),
        content_view:
          GGRC.mustache_path + '/base_objects/confirm_delete.mustache',
      };

      if (hasWarningType(instance)) {
        modalSettings = _.assign(
          modalSettings,
          warning.settings,
          {
            objectShortInfo: [instance.type, instance.title].join(' '),
            confirmOperationName: 'delete',
            operation: 'deletion',
          }
        );
      }

      warning(
        modalSettings,
        _.constant({}),
        _.constant({}), {
          controller: $target
            .modal_form(option, $trigger)
            .ggrc_controllers_delete.bind($target),
        });

      $target.on('modal:success', function (e, data) {
        let modelName = $trigger.attr('data-object-plural').toLowerCase();
        if ($trigger.attr('data-object-id') === 'page' ||
          (instance === getPageInstance())) {
          navigate('/dashboard');
        } else if (modelName === 'people' || modelName === 'roles') {
          window.location.assign('/admin#' + modelName + '_list');
          navigate();
        } else {
          $trigger.trigger('modal:success', data);
          $target.modal_form('hide');
        }
      });
    },

    form: function ($target, $trigger, option) {
      const needToRefresh = (
        $trigger.data('refresh') ||
        $trigger.data('refresh') === undefined
      );
      let formTarget = $trigger.data('form-target');
      let objectParams = $trigger.attr('data-object-params');
      let extendNewInstance = $trigger.attr('data-extend-new-instance');
      let triggerParent = $trigger.closest('.add-button');
      let model = modalModels[$trigger.attr('data-object-singular')];
      let isProposal = $trigger.data('is-proposal');
      let instance;
      let modalTitle;
      let contentView;

      if ($trigger.attr('data-object-id') === 'page') {
        instance = getPageInstance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }

      objectParams = objectParams ? JSON.parse(objectParams) : {};
      extendNewInstance = extendNewInstance
        ? JSON.parse(extendNewInstance)
        : {};

      modalTitle =
        (instance ? 'Edit ' : 'New ') +
        ($trigger.attr('data-object-singular-override') ||
        model.title_singular ||
        $trigger.attr('data-object-singular'));

      if (isProposal) {
        modalTitle = `Proposal for ${model.title_singular}`;
      }

      contentView = $trigger.data('template') ||
        GGRC.mustache_path + '/' +
        $trigger.attr('data-object-plural') +
        '/modal_content.mustache';

      $target
        .modal_form(option, $trigger)
        .ggrc_controllers_modals({
          new_object_form: !$trigger.attr('data-object-id'),
          object_params: objectParams,
          extendNewInstance,
          button_view: isProposal ?
            BUTTON_CREATE_PROPOSAL :
            BUTTON_VIEW_SAVE_CANCEL_DELETE,
          model: model,
          oldData: {
            status: instance && instance.status, // status before changing
          },
          applyPreconditions:
            shouldApplyPreconditions(instance),
          current_user: GGRC.current_user,
          instance: instance,
          skip_refresh: !needToRefresh,
          modal_title: objectParams.modal_title || modalTitle,
          content_view: contentView,
          isProposal: isProposal,
          $trigger: $trigger,
        });

      $target.on('modal:success', function (e, data, xhr) {
        let dirty;
        let $active;
        let WARN_MSG = [
          'The $trigger element was not found in the DOM, thus some',
          'application events will not be propagated.',
        ].join(' ');
        let args = arguments;

        if (formTarget === 'nothing') {
          $trigger.trigger(
            'modal:success', Array.prototype.slice.call(args, 1)
          );
          return;
        } else if (formTarget === 'refresh') {
          refreshPage();
        } else if (formTarget === 'redirect') {
          if (typeof xhr !== 'undefined' && 'getResponseHeader' in xhr) {
            navigate(xhr.getResponseHeader('location'));
          } else if (data._redirect) {
            navigate(data._redirect);
          } else {
            navigate(data.selfLink.replace('/api', ''));
          }
        } else {
          $target.modal_form('hide');
          if ($trigger.data('dirty')) {
            dirty = $($trigger.data('dirty').split(',')).map(function (i, val) {
              return '[href="' + val.trim() + '"]';
            }).get().join(',');
            $(dirty).data('tab-loaded', false);
          }
          if (dirty) {
            $active = $(dirty).filter('.active [href]');
            $active.closest('.active').removeClass('active');
            $active.click();
          }

          // For some reason it can happen that the original $trigger element
          // is removed from the DOM and replaced with another identical
          // element. We thus need to trigger the event on that new element
          // (present in the DOM) if we want event handlers to be invoked.
          if (!document.contains($trigger[0])) {
            $trigger = $('[data-link-purpose="open-edit-modal"]');
            if (_.isEmpty($trigger)) {
              console.warn(WARN_MSG); // eslint-disable-line
              return;
            }
          }

          $trigger.trigger('routeparam', $trigger.data('route'));

          if (triggerParent && triggerParent.length) {
            $trigger = triggerParent;
          }

          Permission.refresh().then(function () {
            let hiddenElement;
            let tagName;

            // 'is_allowed' helper rerenders an elements
            // we should trigger event for hidden element
            if (!$trigger.is(':visible') && option.uniqueId &&
              $trigger.context) {
              tagName = $trigger.context.tagName;

              hiddenElement =
                $(tagName + "[data-unique-id='" + option.uniqueId + "']");

              if (hiddenElement) {
                $trigger = hiddenElement;
              }
            }

            $trigger.trigger(
              'modal:success', Array.prototype.slice.call(args, 1)
            );
          });
        }
      });

      $target.on('modal:discard', () => {
        if ( instance ) {
          instance.restore(true);
        }
      });
    },

    archiveform: function ($target, $trigger, option) {
      let model = modalModels[$trigger.attr('data-object-singular')];
      let instance;

      if ($trigger.attr('data-object-id') === 'page') {
        instance = getPageInstance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }

      $target
        .modal_form(option, $trigger)
        .ggrc_controllers_toggle_archive({
          $trigger: $trigger,
          new_object_form: false,
          button_view: GGRC.mustache_path +
          '/modals/archive_cancel_buttons.mustache',
          model: model,
          instance: instance,
          modal_title: 'Archive ' + $trigger.attr('data-object-singular'),
          content_view: GGRC.mustache_path +
          '/base_objects/confirm_archive.mustache',
        });

      $target.on('modal:success', function (e, data) {
        $trigger.trigger('modal:success', data);
        $target.modal_form('hide');
      });
    },
  };

  function preloadContent() {
    let template =
      ['<div class="modal-header">',
        '<a class="pull-right modal-dismiss tabbable" href="#" data-dismiss="modal">',
        '<i class="fa fa-times black"></i>',
        '</a>',
        '<h2>Loading...</h2>',
        '</div>',
        '<div class="modal-body" style="padding-top:150px;"></div>',
        '<div class="modal-footer">',
        '</div>',
      ];
    return $(template.join('\n'))
      .filter('.modal-body')
      .html(
        $(new Spinner().spin().el)
          .css({
            width: '100px', height: '100px',
            left: '50%', top: '50%',
            zIndex: calculate_spinner_z_index,
          })
      ).end();
  }

  function emitLoaded(responseText, textStatus, xhr) {
    if (xhr.status === 403) {
      // For now, only inject the response HTML in the case
      // of an authorization error
      $(this).html(responseText);
    }
    $(this).trigger('loaded');
  }

  function refreshPage() {
    setTimeout(navigate.bind(GGRC), 10);
  }

  function arrangeBackgroundModals(modals, referenceModal) {
    let $header;
    let headerHeight;
    let _top;
    modals = $(modals).not(referenceModal);
    if (modals.length < 1) return;

    $header = referenceModal.find('.modal-header');
    headerHeight = $header.height() +
      Number($header.css('padding-top')) +
      Number($header.css('padding-bottom'));
    _top = Number($(referenceModal).offset().top);

    modals.css({
      overflow: 'hidden',
      height: function () {
        return headerHeight;
      },
      top: function (i) {
        return _top - (modals.length - i) * (headerHeight);
      },
      'margin-top': 0,
      position: 'absolute',
    });
    modals.off('scroll.modalajax');
  }

  function arrangeTopModal(modal) {
    let $header = modal.find('.modal-header:first');
    let headerHeight = $header.height() +
      Number($header.css('padding-top')) +
      Number($header.css('padding-bottom'));

    let offsetParent = modal.offsetParent();
    let _scrollY = 0;
    let _top = 0;
    let _left = modal.position().left;
    if (!offsetParent.length || offsetParent.is('html, body')) {
      offsetParent = $(window);
      _scrollY = window.scrollY;
      _top = _scrollY +
        (offsetParent.height() -
        modal.height()) / 5 +
        headerHeight / 5;
    } else {
      _top = offsetParent.closest('.modal').offset().top -
        offsetParent.offset().top + headerHeight;
      _left = offsetParent.closest('.modal').offset().left +
        offsetParent.closest('.modal').width() / 2 -
        offsetParent.offset().left;
    }
    if (_top < 0) {
      _top = 0;
    }
    modal
      .css('top', _top + 'px')
      .css({position: 'absolute', 'margin-top': 0, left: _left});
  }

  function reconfigureModals() {
    let modalBackdrops = $('.modal-backdrop').css('z-index', function (i) {
      return 2990 + i * 20;
    });

    let modals = $('.modal:visible');
    modals.each(function (i) {
      let parent = this.parentNode;
      if (parent !== document.body) {
        modalBackdrops
          .eq(i)
          .detach()
          .appendTo(parent);
      }
    });
    modalBackdrops.slice(modals.length).remove();

    modals.not(this.$element).css('z-index', function (i) {
      return 3000 + i * 20;
    });
    this.$element.css('z-index', 3000 + (modals.length - 1) * 20);
    if (this.$element.length) {
      arrangeTopModal(this.$element);
    }
    arrangeBackgroundModals(modals, this.$element);
  }

  $.fn.modal.Constructor.prototype.show = function () {
    let that = this;
    let $el = this.$element;
    let shownevents;
    let keyevents;
    if (!(shownevents = $._data($el[0], 'events').shown) ||
      $(shownevents).filter(function () {
        return $.inArray('arrange', this.namespace.split('.')) > -1;
      }).length < 1) {
      $el.on('shown.arrange, loaded.arrange', function (ev) {
        if (ev.target === ev.currentTarget) {
          reconfigureModals.call(that);
        }
      });
    }

    if ($el.is('body > * *')) {
      this.$parentElement = $el.parent();
      $el.detach().appendTo(document.body);
    }

    // prevent form submissions when descendant elements are also modals.
    if (!(keyevents = $._data($el[0], 'events').keypress) ||
      $(keyevents).filter(function () {
        return $.inArray('preventdoublesubmit', this.namespace.split('.')) > -1;
      }).length < 1) {
      $el.on('keypress.preventdoublesubmit', function (ev) {
        if (ev.which === 13 &&
          !$(document.activeElement).hasClass('create-form__input') &&
          !$(document.activeElement).parents('.pagination').length
        ) {
          ev.preventDefault();
          if (ev.originalEvent) {
            ev.originalEvent.preventDefault();
          }
          return false;
        }
      });
    }
    if (!(keyevents = $._data($el[0], 'events').keyup) ||
      $(keyevents).filter(function () {
        return $.inArray('preventdoubleescape', this.namespace.split('.')) > -1;
      }).length < 1) {
      $el.on('keyup.preventdoubleescape', function (ev) {
        if (ev.which === 27 && $(ev.target).closest('.modal').length) {
          $(ev.target).closest('.modal').attr('tabindex', -1).focus();
          ev.stopPropagation();
          if (ev.originalEvent) {
            ev.originalEvent.stopPropagation();
          }
          // perform additional check before simple hide
          that.hide(ev, true);
        }
      });
      if (!$el.attr('tabindex')) {
        $el.attr('tabindex', -1);
      }
      setTimeout(function () {
        $el.focus();
      }, 1);
    }
    // This is a hack to stop propagation for
    // modals when we dismiss modal
    $(document).on('keyup.dismiss.modal', (e) => {
      e.stopPropagation();
    });
    originalModalShow.apply(this, arguments);
  };

  $.fn.modal.Constructor.prototype.hide = function (ev) {
    let modals;
    let lastModal;
    let animated;
    // We already hid one
    if (ev && (ev.modalHidden)) {
      return;
    }

    if (this.$parentElement) {
      this.$element.detach().appendTo(this.$parentElement);
      this.$parentElement = null;
    }

    originalModalHide.apply(this, arguments);

    animated =
      $('.modal').filter(':animated');
    if (animated.length) {
      animated.stop(true, true);
    }

    modals = $('.modal:visible');
    lastModal = modals.last();
    lastModal.css({height: '', overflow: '', top: '', 'margin-top': ''});
    if (lastModal.length) {
      arrangeTopModal(lastModal);

      // The app has several types of modals. After
      // closing several of them there are situations when focus is lost
      // (is set to body) and events (for example, press the escape key) don't
      // work correctly (open modals is closing in the wrong order). Thus
      // we should set focus on the top modal to all events spread from it.
      lastModal.focus();
    }
    arrangeBackgroundModals(modals, lastModal);
    // mark that we've hidden one
    if (ev) {
      ev.modalHidden = true;
    }
  };

  GGRC.register_modal_hook = function (toggle, launchFn) {
    $(function () {
      $('body').on(
        'click.modal-ajax.data-api keydown.modal-ajax.data-api',
        toggle ?
          '[data-toggle=modal-ajax-' + toggle + ']' :
          '[data-toggle=modal-ajax]',
        function (e) {
          let $this = $(this);
          let loadHref;
          let modalId;
          let target;
          let $target;
          let option;
          let href;
          let newTarget;

          if ($this.hasClass('disabled')) {
            return;
          }
          if (e.type === 'keydown' && e.which !== 13) {
            return; // activate for keydown on Enter/Return only.
          }

          href = $this.attr('data-href') || $this.attr('href');
          loadHref = !$this.data().noHrefLoad;

          modalId = 'ajax-modal-' +
            href.replace(/[/?=&#%!]/g, '-').replace(/^-/, '');
          target = $this.attr('data-target') || $('#' + modalId);

          $target = $(target);
          newTarget = $target.length === 0;

          if (newTarget) {
            $target = $('<div id="' + modalId + '" class="modal hide"></div>');
            $target.addClass($this.attr('data-modal-class'));
            $this.attr('data-target', '#' + modalId);
          }

          $target.on('hidden', function (ev) {
            if (ev.target === ev.currentTarget) {
              $target.remove();
            }
          });

          if (newTarget || $this.data('modal-reset') === 'reset') {
            $target.html(preloadContent());
            if (
              $this.prop('protocol') === window.location.protocol &&
              loadHref
            ) {
              $target.load(href, emitLoaded);
            }
          }

          option = $target.data('modal-help') ?
            'toggle' : $.extend({}, $target.data(), $this.data());
          import(/* webpackChunkName: "modalsCtrls" */'../controllers/modals')
            .then(() => {
              launchFn.apply($target, [$target, $this, option]);
            });
        });
    });
  };
  $(function () {
    can.each({
      '': handlers.modal,
      form: handlers.form,
      deleteform: handlers.deleteform,
      archiveform: handlers.archiveform,
    },
    function (launchFn, toggle) {
      GGRC.register_modal_hook(toggle, launchFn);
    });
  });

  function focusNext($tabbable, index) {
    index = index === $tabbable.length-1 ? 0 : index + 1;
    for (let i = index; i < $tabbable.length; i++) {
      if ($($tabbable[i]).is('a, button, :input, [tabindex], :visible, .tabbable')) {
        $tabbable[i].focus();
        return;
      }
      if (i === $tabbable.length-1) {
        i = -1;
      }
    }
  }

  function focusPrev($tabbable, index) {
    index = index === 0 ? $tabbable.length-1 : index - 1;
    for (let i = index; i >= 0; i--) {
      if ($($tabbable[i]).is('a, button, :input, [tabindex], :visible, .tabbable')) {
        $tabbable[i].focus();
        return;
      }
      if (i === 0) {
        i = $tabbable.length;
      }
    }
  }

  window.addEventListener('keydown', function (event) {
    if (event.keyCode === 9) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.keyCode === 9) {
      let $tabbable = null;
      let $current = $( document.activeElement );
      let $parent = $current.closest('.tab-parent, body, .ggrc_controllers_modals');
      console.log($parent);
      $tabbable = $parent.find('.ql-editor, .ui-autocomplete-input, .tabbable, .input-block-level, select');
      console.log($tabbable);
      for (let i = 0; i < $tabbable.length; i++) {
        if ($tabbable[i] === $current[0]) {
          console.log($tabbable[i]);
          if (event.shiftKey) {
            focusPrev($tabbable, i);
            break;
          } else {
            focusNext($tabbable, i);
            break;
          }
        }
      }
      event.stopPropagation();
    }
  }, true);
})(window.can, window.can.$, window.GGRC);
