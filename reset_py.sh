#!/bin/bash

rm -rf .venv
rm -rf __pycache__
rm -rf cucumber_reactive_reporter.egg-info
python3 -m venv .venv
pip install --upgrade pip
source .venv/bin/activate
