import os
import xml.etree.ElementTree as ET
import json

def find_ax_table_directories(base_directory):
    """
    Recursively find all directories named 'AxTable' starting from the base directory.

    Args:
        base_directory (str): The base directory to start searching from.

    Returns:
        list: A list of paths to directories named 'AxTable'.
    """
    ax_table_dirs = []
    for root, dirs, files in os.walk(base_directory):
        if 'AxTable' in dirs:
            ax_table_dirs.append(os.path.join(root, 'AxTable'))
    return ax_table_dirs

def extract_table_relations_from_directory(directory):
    """
    Extracts relationship information from AxTable XML files in a given directory.

    Args:
        directory (str): The directory containing the XML files.

    Returns:
        list: A list of dictionaries containing table relationship information.
    """
    table_relations = []

    for filename in os.listdir(directory):
        if filename.endswith(".xml"):
            file_path = os.path.join(directory, filename)
            print(f"Processing file: {file_path}")
            try:
                tree = ET.parse(file_path)
                root = tree.getroot()

                # Extract the table name
                name_node = root.find('Name')
                table_name = name_node.text if name_node is not None else None
                if not table_name:
                    print(f"WARNING: Missing 'Name' element in {filename}")
                    table_name = filename.split('.')[0]  # Use filename as fallback
                print(f"Table name: {table_name}")
                
                relations = []

                # Handle potential namespaces
                namespaces = {'ns': root.tag.split('}')[0][1:]} if '}' in root.tag else {}

                # Find all AxTableRelation nodes
                for relation_node in root.findall('.//AxTableRelation', namespaces):
                    relation_name = relation_node.find('Name', namespaces).text if relation_node.find('Name', namespaces) is not None else 'Unnamed_Relation'
                    related_table = relation_node.find('RelatedTable', namespaces).text if relation_node.find('RelatedTable', namespaces) is not None else 'Unknown'
                    cardinality = relation_node.find('Cardinality', namespaces).text if relation_node.find('Cardinality', namespaces) is not None else 'Unknown'
                    relationship_type = relation_node.find('RelationshipType', namespaces).text if relation_node.find('RelationshipType', namespaces) is not None else 'Unknown'
                    constraints = []

                    # Extract constraints
                    for constraint_node in relation_node.findall('.//AxTableRelationConstraint', namespaces):
                        field = constraint_node.find('Field', namespaces).text if constraint_node.find('Field', namespaces) is not None else 'Unknown'
                        related_field = constraint_node.find('RelatedField', namespaces).text if constraint_node.find('RelatedField', namespaces) is not None else 'Unknown'
                        constraints.append({"field": field, "relatedField": related_field})

                    relations.append({
                        "name": relation_name,
                        "relatedTable": related_table,
                        "cardinality": cardinality,
                        "relationshipType": relationship_type,
                        "constraints": constraints
                    })

                # Append the table name and its relations as a dictionary
                table_relations.append({"tableName": table_name, "relations": relations})

            except ET.ParseError as e:
                print(f"Error parsing {filename}: {e}")
            except Exception as e:
                print(f"An unexpected error occurred with {filename}: {e}")

    return table_relations

def extract_table_relations(base_directory):
    """
    Finds all AxTable directories and extracts relationship information from XML files.

    Args:
        base_directory (str): The base directory to start searching from.
    """
    all_table_relations = []
    ax_table_dirs = find_ax_table_directories(base_directory)

    for ax_table_dir in ax_table_dirs:
        print(f"Processing directory: {ax_table_dir}")
        table_relations = extract_table_relations_from_directory(ax_table_dir)
        all_table_relations.extend(table_relations)

    # Save extracted data to a JSON file
    with open("tableRelations.json", "w", encoding='utf-8') as outfile:
        json.dump(all_table_relations, outfile, indent=4)
    print("Relation data extracted and saved to tableRelations.json")

if __name__ == "__main__":
    base_directory_path = r"C:\git\ApplicationSuite\Source\Metadata"
    if not os.path.exists(base_directory_path):
        print(f"Directory not found: {base_directory_path}")
    else:
        extract_table_relations(base_directory_path) 