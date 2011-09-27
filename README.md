# koi
koi is a system for developing javascript applications on top of jQuery.

# Development philosophy
> Write once, use forever.

A koi application is an executable HTML page which is rendered within a web 
browser; composed of plugins from some external software development kit (SDK), 
application-specific configurations for those plugins, and application-specific
software which makes use of those plugins.

The koi system is designed to facilitate the development of software which is:
-   Extensible
-   Configurable
-   Reusable

To accomplish this designed goal, koi requires external software to manage its
SDK and build production versions of the code. The koi SDK client is an open
source command line interface which is maintained and developed alongside the 
koi system. It is available here: https://github.com/Knewton/Koi-SDK-Client

It is always the expectation that some external software will be required, but
it is not required to use the provided SDK client. External parties can develop
their own SDK management software and utilize the koi system, but that is in no
way required.

Please refer to the INSTALL document for help with setting up an SDK.

# Application development
## 1. Creating an application
### index.html
### manifest.json
### configuration.js
### en_US.json
### initialization.js
## 2. Templates
### Declare template variables
### Define template variables
### Adding custom variables
### Localization
## 3. Replication
### Declaring a replicant template
### Declaring a replicator
### Instantiating a replication
## 4. Working with components
### Creating a new component
### Declaring a component instance
### Configuring a component instance
### Add application code to a component
## 5. Working with plugins
### Creating a plugin
### Configuring a plugin
### Using a plugin
## 6. Working with events
### When to use
### How to use
### Things to avoid
