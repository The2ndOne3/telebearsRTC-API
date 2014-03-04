# Overview
This is the API server that polls for the telebearsRTC application. Every time it detects a difference, it calls a webhook in the application to send out alerts to subscribed users.

This repository also contains all the data dumps of classes and sections to initialise the polling system.

# Dependencies
* `npm install` will install all Node dependencies
* `foreman` runs scripts with the environment variables set in `.env`

# Data-dumping
```bash
cd src
foreman run node load-courses.js
foreman run node load-names.js
foreman run node load-sections.js # This takes on the order of 6 minutes
# foreman run node load-enrollment.js # This takes on the order of 20 minutes
foreman run node transform-section-list.js
```

# Notes
Running `load-enrollment` will throw errors sometimes, especially with upper-division Architecture classes. This is because the Berkeley API tends to buckle under rapid querying, which is one of many reasons why we cache the results. If this happens, just rerun `load-enrollment` until no errors are reported.