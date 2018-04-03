'use strict';

const config = require('../../server/model-config');

const protos = [
  'prototype.__count__',
  'prototype.__create__',
  'prototype.__delete__',
  'prototype.__destroyById__',
  'prototype.__findById__',
  'prototype.__get__',
  'prototype.__updateById__',
];

module.exports = {
  RemoteMethod: {
    modelsWithScopeRules: function() {
      let models = Object.keys(config).filter((key) => {
        if (key === '_meta') return;
        if (!config[key].options) return;
        if (!config[key].options.remoting) return;
        if (!config[key].options.remoting.scopes) return;
        return key;
      });
      return models;
    },
    applyModelScopeRules: function(lbModels) {
      const methodsNames = [];
      let models = this.modelsWithScopeRules();
      models.forEach((modelName) => {
        let model = config[modelName];
        let scopeDefinitions = Object.keys(model.options.remoting.scopes);
        scopeDefinitions.forEach((scope) => {
          let definition = model.options.remoting.scopes[scope];
          let methods = Object.keys(definition);
          let disabledMethods = [];
          methods.forEach((item, index) => {
            if (item === '*') {
              if (index > 0) console.warn(`Wildcard (*) rule must be declared before any other rules.`);
              if (!definition[item]) protos.map(proto => disabledMethods.push(`${proto}${scope}`));
              return;
            }

            let methodName = `prototype.__${item}__${scope}`;
            if (disabledMethods.length === 0) {
              disabledMethods.push(methodName);
              return;
            } else {
              let index = disabledMethods.indexOf(methodName);
              if (!definition[item] && index < 0) disabledMethods.push(methodName);
              if (definition[item] && index > 0) disabledMethods = disabledMethods
                .filter(method => method !== methodName);
            }
          });

          disabledMethods.map((methodName) => {
            lbModels[modelName].disableRemoteMethodByName(methodName)
          });
        });
      });
    }
  },
};
