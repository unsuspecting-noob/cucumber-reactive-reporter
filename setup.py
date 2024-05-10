from setuptools import setup
from py.cucumber_reactive_reporter.cucumber_reactive_reporter import __version__
import os

def package_files(directory):
    paths = []
    for (path, directories, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('', path, filename))
    return paths

extra_files = package_files('react')
print(extra_files)
setup(
    name='cucumber_reactive_reporter',
    version=__version__,
    url='https://github.com/unsuspecting-noob/cucumber-reactive-reporter',
    author='unsuspecting-noob',
    author_email='nikolai.i.popov@gmail.com',
    packages=['cucumber_reactive_reporter'],
    package_dir={'cucumber_reactive_reporter': 'py/cucumber_reactive_reporter'},
    include_package_data=True,
    zip_safe=False,
    package_data={'cucumber_reactive_reporter': extra_files},
)