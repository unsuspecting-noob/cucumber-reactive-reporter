#!/bin/bash

rm -rf .venv
rm -rf __pycache__
rm -rf cucumber_reactive_reporter.egg-info
python3 -m venv .venv
pip install --upgrade pip
chmod +x .venv/bin/activate
.venv/bin/activate
