#!/bin/bash

# Usage: ./rename.sh <pattern> <search_substring> <replacement_substring> [search_directory]
# Example: ./rename.sh 'shipping-destination.*' 'shipping-destination' 'shipment-destination' ./src/api/

PATTERN="$1"
SEARCH_SUBSTRING="$2"
REPLACEMENT_SUBSTRING="$3"
SEARCH_DIR="${4:-.}"

if [ -z "$PATTERN" ] || [ -z "$SEARCH_SUBSTRING" ] || [ -z "$REPLACEMENT_SUBSTRING" ]; then
  echo "Usage: $0 <pattern> <search_substring> <replacement_substring> [search_directory]"
  exit 1
fi

FOUND_FILES=$(find "$SEARCH_DIR" -type f -name "$PATTERN")

if [ -z "$FOUND_FILES" ]; then
  echo "No files matching pattern '$PATTERN' found in '$SEARCH_DIR'."
  exit 1
fi

for FILE in $FOUND_FILES; do
  DIRNAME=$(dirname "$FILE")
  BASENAME=$(basename "$FILE")
  NEW_BASENAME="${BASENAME//$SEARCH_SUBSTRING/$REPLACEMENT_SUBSTRING}"
  if [ "$BASENAME" != "$NEW_BASENAME" ]; then
    mv "$FILE" "$DIRNAME/$NEW_BASENAME"
    echo "Renamed '$FILE' to '$DIRNAME/$NEW_BASENAME'"
  fi
done