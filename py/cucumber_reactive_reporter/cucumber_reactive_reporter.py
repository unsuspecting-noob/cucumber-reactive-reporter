import json
import os
import shutil
from pathlib import Path
from importlib import resources as impresources


# from . import react

__version__='1.0.10'

# Define constants for file paths
CUCUMBER_JSON_PATH = "_cucumber-results.json"
SETTINGS_JSON_PATH = "_reporter_settings.json"
HTML_PATH = "_html_report"

DEFAULT_OPTIONS = {
    'title': 'Cucumber Report',
    'description': 'Cucumber report',
    'metadata': {},
    'link_tags': []
}
OPTIONS = {}

def copy_resources(resource_dir, destination_directory):
    # Access the package's resources
    package_files = impresources.files(resource_dir)

    # Recursive function to copy resources
    def copy_resource(resource, dest_dir):
        destination_path = os.path.join(dest_dir, resource.name)
        destination_path = destination_path.replace('react/', '')
        if resource.is_dir():
            # Create the directory at the destination if it does not exist
            os.makedirs(destination_path, exist_ok=True)
            # Recurse into directories
            for item in resource.iterdir():
                copy_resource(item, destination_path)
        else:
            # Copy the file
            shutil.copy(resource, destination_path)
            shutil.copy(resource, destination_path)
            # print(f'Copied {resource} to {destination_path}')

    # Start copying from the root of the package
    copy_resource(package_files, destination_directory)
    #clean up the dest react folder
    os.rmdir(os.path.join(destination_directory, resource_dir))

def cmd_generate(args=None):
    import argparse
    parser = argparse.ArgumentParser(description='Generate a cucumber report')
    parser.add_argument('--source', dest='source', required=True, help='Path to the cucumber JSON file')
    parser.add_argument('--dest', dest='dest', help='Path to the destination directory')
    parser.add_argument('--title', help='Title of the report', default=DEFAULT_OPTIONS['title'])
    parser.add_argument('--description', help='Description of the report')
    parser.add_argument('--metadata', help='Metadata for the report')
    parser.add_argument('--link-tags', help='Link tags for the report')
    args = parser.parse_args(args)
    options = {
        'title': args.title,
        'description': args.description,
        'metadata': args.metadata,
        'link_tags': args.link_tags
    }
    OPTIONS=options
    generate(args.source, args.dest, options)

def generate(source, dest, options=DEFAULT_OPTIONS):
    if options is None:
        options = DEFAULT_OPTIONS

    # Resolve paths
    if not os.path.isabs(source):
        source = os.path.abspath(source)

    if not dest:
        dest = os.path.dirname(source)
    elif not os.path.isabs(dest):
        dest = os.path.abspath(dest)

    # Ensure destination directory exists
    os.makedirs(dest, exist_ok=True)

    # Read and process the JSON file
    with open(source, 'r') as file:
        data = json.load(file)
    processed_data = prep_data_for_store(data)

    # Write the processed data back to the destination
    with open(os.path.join(dest, CUCUMBER_JSON_PATH), 'w') as file:
        json.dump(processed_data, file)
    with open(os.path.join(dest, SETTINGS_JSON_PATH), 'w') as file:
        json.dump(options, file)

    # Copy HTML report
    copy_resources('react', dest)

    # Modify the index.html with dynamic content
    index_html_path = os.path.join(dest, "index.html")
    with open(index_html_path, 'r') as file:
        html_content = file.read()

    print(f"options {options}")
    modified_html = html_content.replace("-=title=-", options['title'])
    with open(index_html_path, 'w') as file:
        file.write(modified_html)

    print("Report generation completed.")


def prep_data_for_store(data):
    # print(data)
    state = {
        'features': {'list': [], 'featuresMap': {}},
        'scenarios': {'list': [], 'scenariosMap': {}},
        'steps': {'stepsMap': {}, 'total_duration_nano_sec': 0}
    }
    feature_index = 0
    for feature in data:
        feature_id = f"{feature_index}_{feature['name'].replace(' ', '_')}"
        process_feature(state, feature, feature_id)
        feature_index += 1
    return state


def process_feature(state, feature, feature_id):
    all_tags =feature['tags'].copy()
    num_failed_scenarios = sum(
        1 for element in feature['elements'] if any(
            step['result']['status'] == 'failed' for step in element['steps']
        )
    )
    num_skipped_scenarios = sum(
        1 for element in feature['elements'] if any(
            step['result']['status'] == 'skipped' for step in element['steps']
        )
    )
    state['features']['list'].append(feature_id)
    state['features']['featuresMap'][feature_id] = {
        'id': feature_id,
        'description': feature['description'][0] if (hasattr(feature['description'], '__len__') == True) else feature['description'],
        # 'description': feature.get('description', ''),
        'uri': feature.get('uri', ''),
        'keyword': feature.get('keyword', ''),
        'name': feature.get('name', ''),
        'line': feature.get('line', ''),
        'tags': feature.get('tags', []),
        'allTags': all_tags,
        'num_failed_scenarios': num_failed_scenarios,
        'num_skipped_scenarios': num_skipped_scenarios
    }

if __name__ == '__main__':
    cmd_generate()