import os
import xml.etree.ElementTree as ET
import json
import sys

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

def extract_table_indexes_from_directory(directory):
    """
    Extracts index information from AxTable XML files in a given directory.

    Args:
        directory (str): The directory containing the XML files.

    Returns:
        list: A list of dictionaries containing table index information.
    """
    table_indexes = []

    for filename in os.listdir(directory):
        if filename.endswith(".xml"):
            file_path = os.path.join(directory, filename)
            print(f"Processing file: {file_path}")
            try:
                tree = ET.parse(file_path)
                root = tree.getroot()

                # Extract the table name
                name_node = root.find('Name')
                table_name = name_node.text.strip() if name_node is not None and name_node.text else filename.split('.')[0]
                if not name_node or not name_node.text:
                    print(f"WARNING: Missing 'Name' element in {filename}. Using filename as table name.")
                print(f"Table name: {table_name}")

                indexes = []

                # Find all AxTableIndex nodes within Indexes
                indexes_node = root.find('Indexes')
                if indexes_node is not None:
                    for index_node in indexes_node.findall('AxTableIndex'):
                        # Extract index name
                        index_name_node = index_node.find('Name')
                        index_name = index_name_node.text.strip() if index_name_node is not None and index_name_node.text else 'Unnamed_Index'
                        if not index_name_node or not index_name_node.text:
                            print(f"WARNING: Missing 'Name' element in index of {filename}. Using 'Unnamed_Index' as index name.")

                        # Extract AllowDuplicates
                        allow_duplicates_node = index_node.find('AllowDuplicates')
                        allow_duplicates = False  # Default value
                        if allow_duplicates_node is not None and allow_duplicates_node.text:
                            allow_duplicates_text = allow_duplicates_node.text.strip().lower()
                            allow_duplicates = True if allow_duplicates_text == 'yes' else False

                        # Extract columns
                        columns = []
                        fields_node = index_node.find('Fields')
                        if fields_node is not None:
                            for field_node in fields_node.findall('AxTableIndexField'):
                                data_field_node = field_node.find('DataField')
                                if data_field_node is not None and data_field_node.text:
                                    columns.append(data_field_node.text.strip())
                                else:
                                    print(f"WARNING: Missing 'DataField' in an index field of {filename}.")

                        if not columns:
                            print(f"WARNING: No columns found for index '{index_name}' in {filename}.")

                        indexes.append({
                            "indexName": index_name,
                            "columns": columns,
                            "allowDuplicates": allow_duplicates
                        })
                else:
                    print(f"WARNING: No 'Indexes' section found in {filename}.")

                table_indexes.append({
                    "tableName": table_name,
                    "indexes": indexes
                })

            except ET.ParseError as e:
                print(f"Error parsing {filename}: {e}")
            except Exception as e:
                print(f"An unexpected error occurred with {filename}: {e}")

    return table_indexes

def extract_table_indexes(base_directory):
    """
    Finds all AxTable directories and extracts index information from XML files.

    Args:
        base_directory (str): The base directory to start searching from.
    """
    all_table_indexes = []
    ax_table_dirs = find_ax_table_directories(base_directory)

    for ax_table_dir in ax_table_dirs:
        print(f"Processing directory: {ax_table_dir}")
        table_indexes = extract_table_indexes_from_directory(ax_table_dir)
        all_table_indexes.extend(table_indexes)

    # Save extracted data to a JSON file
    with open("tableIndex.json", "w", encoding='utf-8') as outfile:
        json.dump(all_table_indexes, outfile, indent=4)
    print("Index data extracted and saved to tableIndex.json")

if __name__ == "__main__":
    import sys
    
    # Use command line argument if provided, otherwise use default path
    base_directory_path = sys.argv[1] if len(sys.argv) > 1 else r"C:\git\ApplicationSuite\Source\Metadata"
    
    if not os.path.exists(base_directory_path):
        print(f"Directory not found: {base_directory_path}")
        sys.exit(1)
        
    print(f"Using base directory: {base_directory_path}")
    extract_table_indexes(base_directory_path)
    print("Table indexes extraction completed successfully!")