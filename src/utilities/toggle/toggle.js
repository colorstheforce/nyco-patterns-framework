'use strict';

/**
 * The Simple Toggle class. This will toggle the class 'active' and 'hidden'
 * on target elements, determined by a click event on a selected link or
 * element. This will also toggle the aria-hidden attribute for targeted
 * elements to support screen readers. Target settings and other functionality
 * can be controlled through data attributes.
 *
 * This uses the .matches() method which will require a polyfill for IE
 * https://polyfill.io/v2/docs/features/#Element_prototype_matches
 *
 * @class
 */
class Toggle {
  /**
   * @constructor
   *
   * @param  {Object}  s  Settings for this Toggle instance
   *
   * @return {Object}     The class
   */
  constructor(s) {
    // Create an object to store existing toggle listeners (if it doesn't exist)
    if (!window.hasOwnProperty('ACCESS_TOGGLES'))
      window.ACCESS_TOGGLES = [];

    s = (!s) ? {} : s;

    this.settings = {
      selector: (s.selector) ? s.selector : Toggle.selector,
      namespace: (s.namespace) ? s.namespace : Toggle.namespace,
      inactiveClass: (s.inactiveClass) ? s.inactiveClass : Toggle.inactiveClass,
      activeClass: (s.activeClass) ? s.activeClass : Toggle.activeClass,
      before: (s.before) ? s.before : false,
      after: (s.after) ? s.after : false
    };

    // Store the element for potential use in callbacks
    this.element = (s.element) ? s.element : false;

    if (this.element)
      this.element.addEventListener('click', (event) => {
        this.toggle(event);
      });
    else
      // If there isn't an existing instantiated toggle, add the event listener.
      if (!window.ACCESS_TOGGLES.hasOwnProperty(this.settings.selector))
        document.querySelector('body').addEventListener('click', event => {
          if (!event.target.matches(this.settings.selector))
            return;

          // Store the event for potential use in callbacks
          this.event = event;

          this.toggle(event);
        });

    // Record that a toggle using this selector has been instantiated. This
    // prevents double toggling.
    window.ACCESS_TOGGLES[this.settings.selector] = true;

    return this;
  }

  /**
   * Logs constants to the debugger
   *
   * @param  {Object}  event  The main click event
   *
   * @return {Object}         The class
   */
  toggle(event) {
    let el = event.target;
    let target = false;
    let focusable = [];

    event.preventDefault();

    /** Anchor Links */
    target = (el.hasAttribute('href')) ?
      document.querySelector(el.getAttribute('href')) : target;

    /** Toggle Controls */
    target = (el.hasAttribute('aria-controls')) ?
      document.querySelector(`#${el.getAttribute('aria-controls')}`) : target;

    /** Focusable Children */
    focusable = (target) ?
      target.querySelectorAll(Toggle.elFocusable.join(', ')) : focusable;

    /** Main Functionality */
    if (!target) return this;
    this.elementToggle(el, target, focusable);

    /** Undo */
    if (el.dataset[`${this.settings.namespace}Undo`]) {
      const undo = document.querySelector(
        el.dataset[`${this.settings.namespace}Undo`]
      );

      undo.addEventListener('click', (event) => {
        event.preventDefault();
        this.elementToggle(el, target);
        undo.removeEventListener('click');
      });
    }

    return this;
  }

  /**
   * The main toggling method
   *
   * @param  {Object}    el         The current element to toggle active
   * @param  {Object}    target     The target element to toggle active/hidden
   * @param  {NodeList}  focusable  Any focusable children in the target
   *
   * @return {Object}          The class
   */
  elementToggle(el, target, focusable = []) {
    let i = 0;
    let attr = '';
    let value = '';

    // Get other toggles that might control the same element
    let others = document.querySelectorAll(
      `[aria-controls="${el.getAttribute('aria-controls')}"]`);

    // Store elements for potential use in callbacks
    this.element = el;
    this.target = target;
    this.others = others;
    this.focusable = focusable;

    /**
     * Toggling before hook
     */
    if (this.settings.before) this.settings.before(this);

    /**
     * Toggle Element and Target classes
     */
    if (this.settings.activeClass) {
      el.classList.toggle(this.settings.activeClass);
      target.classList.toggle(this.settings.activeClass);

      // If there are other toggles that control the same element
      if (others) others.forEach((other) => {
        if (other !== el) other.classList.toggle(this.settings.activeClass);
      });
    }

    if (this.settings.inactiveClass)
      target.classList.toggle(this.settings.inactiveClass);

    /**
     * Target Element Aria Attributes
     */
    for (i = 0; i < Toggle.targetAriaRoles.length; i++) {
      attr = Toggle.targetAriaRoles[i];
      value = target.getAttribute(attr);

      if (value != '' && value)
        target.setAttribute(attr, (value === 'true') ? 'false' : 'true');
    }

    /**
     * Hide the Toggle Target's focusable children from focus.
     * If an element has the data-attribute 'data-toggle-tabindex', use that
     * as the default tab index of the element.
     */
    focusable.forEach(el => {
      let tabindex = el.getAttribute('tabindex');

      if (tabindex === '-1') {
        let dataDefault = el.getAttribute(`data-${Toggle.namespace}-tabindex`);

        if (dataDefault) {
          el.setAttribute('tabindex', dataDefault);
        } else {
          el.removeAttribute('tabindex');
        }
      } else {
        el.setAttribute('tabindex', '-1');
      }
    });

    /**
     * Jump to Target Element (if Toggle Element is an anchor link).
     */
    if (el.hasAttribute('href')) {
      // Reset the history state, this will clear out
      // the hash when the jump item is toggled closed.
      history.pushState('', '',
        window.location.pathname + window.location.search);

      // Target element toggle.
      if (target.classList.contains(this.settings.activeClass)) {
        window.location.hash = el.getAttribute('href');

        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
      } else
        target.removeAttribute('tabindex');
    }

    /**
     * Toggle Element (including multi toggles) Aria Attributes
     */
    for (i = 0; i < Toggle.elAriaRoles.length; i++) {
      attr = Toggle.elAriaRoles[i];
      value = el.getAttribute(attr);

      if (value != '' && value)
        el.setAttribute(attr, (value === 'true') ? 'false' : 'true');

      // If there are other toggles that control the same element
      if (others) others.forEach((other) => {
        if (other !== el && other.getAttribute(attr))
          other.setAttribute(attr, (value === 'true') ? 'false' : 'true');
      });
    }

    /**
     * Toggling complete hook.
     */
    if (this.settings.after) this.settings.after(this);

    return this;
  }
}

/** @type {String} The main selector to add the toggling function to */
Toggle.selector = '[data-js*="toggle"]';

/** @type  {String}  The namespace for our data attribute settings */
Toggle.namespace = 'toggle';

/** @type  {String}  The hide class */
Toggle.inactiveClass = 'hidden';

/** @type  {String}  The active class */
Toggle.activeClass = 'active';

/** @type  {Array}  Aria roles to toggle true/false on the toggling element */
Toggle.elAriaRoles = ['aria-pressed', 'aria-expanded'];

/** @type  {Array}  Aria roles to toggle true/false on the target element */
Toggle.targetAriaRoles = ['aria-hidden'];

/** @type  {Array}  Focusable elements to hide within the hidden target element */
Toggle.elFocusable = [
  'a', 'button', 'input', 'select', 'textarea', 'object', 'embed', 'form',
  'fieldset', 'legend', 'label', 'area', 'audio', 'video', 'iframe', 'svg',
  'details', 'table', '[tabindex]', '[contenteditable]', '[usemap]'
];

export default Toggle;
