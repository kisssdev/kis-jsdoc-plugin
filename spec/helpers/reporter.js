const { SpecReporter } = require('jasmine-spec-reporter');

/* eslint-disable no-undef */
jasmine.getEnv().clearReporters(); // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter({ // add jasmine-spec-reporter
  spec: {
    displayPending: true,
  },
}));
