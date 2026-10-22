import React from 'react';
let documentTree;

export function loadTemplate(template) {
  documentTree = new DOMParser().parseFromString(template, 'text/html').body.firstElementChild;
}
const token = /{{\s*([\w.]+)\s*}}/g;

function lookup(scope, path) {
  return path.split('.').reduce((value, part) => value?.[part], scope);
}

function interpolate(value, scope) {
  return value.replace(token, (_, path) => String(lookup(scope, path) ?? ''));
}

function expression(value, scope) {
  const match = /^{{\s*([\w.]+)\s*}}$/.exec(value);
  return match ? lookup(scope, match[1]) : interpolate(value, scope);
}

function styleObject(css, scope) {
  const result = {};
  for (const declaration of interpolate(css, scope).split(';')) {
    const separator = declaration.indexOf(':');
    if (separator < 0) continue;
    const name = declaration.slice(0, separator).trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = declaration.slice(separator + 1).trim();
    if (name && value) result[name] = value;
  }
  return result;
}

function renderNode(node, scope, key) {
  if (node.nodeType === Node.TEXT_NODE) return interpolate(node.textContent, scope);
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const tag = node.localName;
  if (tag === 'sc-if') {
    if (!expression(node.getAttribute('value') || '', scope)) return null;
    return React.createElement(React.Fragment, { key }, ...renderChildren(node, scope));
  }
  if (tag === 'sc-for') {
    const items = expression(node.getAttribute('list') || '', scope);
    const alias = node.getAttribute('as');
    if (!Array.isArray(items)) return null;
    return React.createElement(React.Fragment, { key }, ...items.map((item, index) =>
      React.createElement(React.Fragment, { key: item?.id ?? index }, ...renderChildren(node, { ...scope, [alias]: item }))
    ));
  }
  const props = { key };
  for (const attr of node.attributes) {
    const name = attr.name;
    if (name.startsWith('sc-camel-on-')) {
      const event = name === 'sc-camel-on-click' ? 'onClick' : 'onChange';
      props[event] = expression(attr.value, scope);
    } else if (name === 'sc-camel-view-box') props.viewBox = attr.value;
    else if (name === 'style') props.style = styleObject(attr.value, scope);
    else if (name === 'class') props.className = interpolate(attr.value, scope);
    else if (name === 'for') props.htmlFor = interpolate(attr.value, scope);
    else if (name === 'value') props.value = interpolate(attr.value, scope);
    else props[name] = interpolate(attr.value, scope);
  }
  if (tag === 'input' && props.value === undefined) props.value = '';
  return React.createElement(tag, props, ...renderChildren(node, scope));
}

function renderChildren(node, scope) {
  return [...node.childNodes].map((child, index) => renderNode(child, scope, index));
}

export function TemplateView({ values }) {
  return renderNode(documentTree, values, 'app');
}
