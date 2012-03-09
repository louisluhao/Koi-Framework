#!/bin/sh
# Adds resources to a koi project
resource_uri="$1"
resource_name="$2"
path_to_lib="$3"
if [[ -z $path_to_lib ]]; then
	path_to_lib="lib"
fi
dir=`pwd`
# Proper environment
cd $dir
if ! git rev-parse --git-dir > /dev/null 2>&1; then
	echo "This path must be part of a git repository"
	exit 1
fi
git_root=`git rev-parse --git-dir`
project_root=`dirname $git_root`
if [[ -f .koi/lib_version ]]; then
	dest="ext"
else
	dest="lib"
fi
# Add resources
cd $project_root
if [[ -d .koi/src/$resource_name ]]; then
	echo "$resource_name is already checked out."
else
	git submodule add $resource_uri .koi/src/$resource_name
fi
if [[ -d $dest/$resource_name ]]; then
	echo "$resource_name is already linked."
else
	cd $dest
	ln -s ../.koi/src/$resource_name/$path_to_lib $resource_name
fi
