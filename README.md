# Overview
This is the API server that polls for the telebearsRTC application. Every time it detects a difference, it calls a webhook in the application to send out alerts to subscribed users.

This repository also contains all the data dumps of classes and sections to initialise the polling system.

# Dependencies
* `npm install` will install all Node dependencies
* `foreman` runs scripts with the environment variables set in `.env`

# Data-dumping
``bash
foreman run node load-courses.js
foreman run node canonify-names.js
foreman run node load-sections.js // This one is REEAAAAALLY slow
foreman run node build-section-list.js
``