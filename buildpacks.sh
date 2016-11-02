#!/usr/bin/env bash

heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 https://github.com/heroku/heroku-buildpack-apt
heroku buildpacks:add --index 3 https://github.com/captain401/heroku-buildpack-xvfb
heroku buildpacks:add --index 4 https://github.com/atm8y/heroku-buildpack-slimerjs
