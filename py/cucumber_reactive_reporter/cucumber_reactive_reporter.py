import json
import os
import shutil
from pathlib import Path
from importlib import resources as impresources
import base64

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
    package_files = impresources.files('cucumber_reactive_reporter').joinpath(resource_dir)
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
        'steps': {'stepsMap': {}, 'totalDurationNanoSec': 0}
    }


    feature_index = 0
    for feature in data:
        featureId = f"{feature_index}_{feature['name'].replace(' ', '_')}"
        _process_feature(state, feature, featureId)
        feature_index += 1
        # SCENARIO
        num_scenarios = len(feature['elements'])  # avoid multiple lookups
        if feature['elements'] and num_scenarios:
            sc_index = 0
            for sc in feature['elements']:
                # need to make scenario id unique as well
                #it will consist of featureId and scenario_index plus scenario name
                sc_index += 1
                sc_id_arr = [featureId, str(sc_index), sc['name']]
                sc['id'] = ';'.join(sc_id_arr)
                _process_scenario(state, featureId, sc)
                # STEPS
                for st in sc['steps']:
                    _process_step(state, sc['id'], st)
    return state

def _convert_tags(tags):
    return [{'name': f"@{tag}"} for tag in tags]

def _process_feature(state, feature, featureId):
    allTags = feature['tags'].copy()
    #figure out if it has failed stuff
    numFailedScenarios = 0
    numSkippedScenarios = 0
    if feature['elements'] and len(feature['elements']):
        for el in feature['elements']:
            # Collect scenario tags
            if el['tags'] and len(el['tags']):
                temp =_convert_tags(el['tags'])
                #merge with allTags
                for tag in temp:
                    if tag not in allTags:
                        allTags.append(tag)
            # Process scenario steps
            if el['steps'] and len(el['steps']):
                for step in el['steps']:
                    if step['result'] and step['result']['status'] == 'failed':
                        numFailedScenarios += 1
                        break
                    if step['result'] and step['result']['status'] == 'skipped':
                        numSkippedScenarios += 1
                        break


    state['features']['list'].append(featureId)
    state['features']['featuresMap'][featureId] = {
        'id': featureId,
        'description': feature['description'][0] if (hasattr(feature['description'], '__len__') == True) else feature['description'],
        'uri': feature.get('uri', ''),
        'keyword': feature.get('keyword', ''),
        'name': feature.get('name', ''),
        'line': feature.get('line', ''),
        'tags': feature.get('tags', []),
        'allTags': allTags,
        'numFailedScenarios': numFailedScenarios,
        'numSkippedScenarios': numSkippedScenarios
    }
    

def _process_scenario(state, featureId, scenario):
    # Destructuring equivalent in Python using direct key access from dictionary
    scenarioId = scenario['id']
    keyword = scenario['keyword']
    line = 0
    name = scenario['name']
    tags = _convert_tags(list(scenario['tags']))  # Creates a copy of the tags list, convert to reporter format
    scenarioType = scenario['type']

    # Updating the state dictionary
    # Append scenario id to the scenarios list
    state['scenarios']['list'].append(scenarioId)
    
    # Add or update the scenario details in scenariosMap
    state['scenarios']['scenariosMap'][scenarioId] = {
        'failedSteps': 0,
        'featureId': featureId,
        'id': scenarioId,
        'keyword': keyword,
        'line': line,
        'name': name,
        'passedSteps': 0,
        'skippedSteps': 0,
        'tags': tags,
        'type': scenarioType,
        'uri': None
    }

def _process_step(state, scenarioId, st):
    # Direct dictionary key access to mimic JavaScript destructuring
    args = st.get('args', [])
    embeddings = st.get('embeddings', [])
    #decode text stuff from base64
    for emb in embeddings:
        if 'text' in emb['mime_type']:
            emb['data'] = base64.b64decode(emb['data']).decode('utf-8')
    hidden = st.get('hidden', False)
    keyword = st['keyword']
    line = 0
    location = st['location']
    name = st['name']
    duration = st['result']['duration']
    error_message = st['result'].get('error_message', None)
    status = st['result']['status']

    # Check if 'match' exists and get location if available
    location = st['match']['location'] if 'match' in st and 'location' in st['match'] else ""

    # Create step dictionary
    step = {
        'args': args,
        'duration': duration,
        'embeddings': embeddings,
        'error_message': error_message,
        'keyword': keyword,
        'line': line,
        'location': location,
        'name': name,
        'status': status
    }

    # Ensure the scenarioId exists in stepsMap and initialize if not
    if scenarioId not in state['steps']['stepsMap']:
        state['steps']['stepsMap'][scenarioId] = {'steps': []}
    
    # Add the step to the steps list for the scenario
    state['steps']['stepsMap'][scenarioId]['steps'].append(step)
    
    # Update total duration if duration is not NaN
    if not isinstance(duration, str):  # Check if duration is not a string
        state['steps']['totalDurationNanoSec'] += duration

    # Update counts based on step status if not hidden or if there are embeddings
    if not hidden or (embeddings and len(embeddings) > 0):
        if status == 'passed':
            state['scenarios']['scenariosMap'][scenarioId]['passedSteps'] += 1
        elif status == 'skipped':
            state['scenarios']['scenariosMap'][scenarioId]['skippedSteps'] += 1

    # Increment the failed steps counter if the status is 'failed'
    if status == 'failed':
        state['scenarios']['scenariosMap'][scenarioId]['failedSteps'] += 1

if __name__ == '__main__':
    cmd_generate()