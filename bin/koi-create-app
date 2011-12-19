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
# Create application
app_name="$1"
app_path="apps/$app_name"
if [[ -d $app_path ]]; then
	echo "$app_path is already defined."
	exit 1
fi
mkdir -p $app_path
cd $app_path
ln -s ../../lib lib
