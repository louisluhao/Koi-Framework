#!/bin/sh
# Adds resources to a koi project
dir=`pwd`
# Proper environment
cd $dir
if ! git rev-parse --git-dir > /dev/null 2>&1; then
	echo "This path must be part of a git repository"
	exit 1
fi
git_root=`git rev-parse --git-dir`
project_root=`dirname $git_root`
cd $project_root
# Add resource
resource_uri="$1"
resource_name="$2"
if [[ -d lib/$resource_name ]]; then
	echo "$resource_name is already defined."
	exit 1
fi
if [[ -d .koi/src/$resource_name ]]; then
	echo "$resource_name is already defined."
	exit 1
fi
git submodule add $resource_uri .koi/src/$resource_name
cd lib
ln -s ../.koi/src/$resource_name/lib $resource_name
