#!/bin/sh
# Initializes a directory as a Koi project
dir=`pwd`
function mdir()
{
	if [[ ! -d $1 ]]; then
		mkdir -p $1
	fi
}
# Proper environment
cd $dir
if ! git rev-parse --git-dir > /dev/null 2>&1; then
	echo "This path must be part of a git repository"
	exit 1
fi
git_root=`git rev-parse --git-dir`
project_root=`dirname $git_root`
cd $project_root
# Initialize submodules
git submodule init
# Setup koi directories
mdir .koi/src
mdir ext
# Setup files
echo "0.2" > .koi/lib_version
# Success
echo "Directory initialized as a koi library"
