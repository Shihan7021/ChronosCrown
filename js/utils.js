// js/utils.js - Shared utility functions

/**
 * Formats a number as a USD currency string.
 * @param {number} value The number to format.
 * @returns {string} A string like "$1,234.56".
 */
export function formatCurrency(value) {
  if (typeof value !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * A simple query selector helper.
 * @param {string} selector A CSS selector.
 * @returns {HTMLElement|null} The first element matching the selector.
 */
export const $ = (selector) => document.querySelector(selector);
