# Koi
Koi is a framework for developing Javascript applications on top of jQuery.

## Development philosophy
> Write once, use forever.

The Koi system is designed to facilitate the development of software which is:

-   Extensible
-   Configurable
-   Reusable

To accomplish this goal, Koi requires external software to manage its
components and generate production builds. The Koi SDK client is an open
source command line interface which is maintained and developed alongside the 
Koi system. It is available here: https://github.com/Knewton/Koi-SDK-Client

It's always the expectation that some external software will be required, but
there's no particular reason why you'd need to use the provided SDK client.
External parties are free to develop their own SDK management software.

Please refer to the INSTALL document for help with setting up the SDK.

### A note on capitalization

We use different capitalizations of Koi in different contexts:

-	"Koi" is the Koi system as a whole and associated development philosophy.
-	"koi" is the command line SDK client that builds applications from sources.
-	"KOI" is the object exposed to Javascript that provides the framework's functionality.

## Application Development

A Koi application consists of:

-	an HTML page rendered in a web browser (index.html);
-	a set of plugins from some external SDK (manifest.json);
-	application-specific configurations for those plugins (configuration.js);
-	application-specific software which makes use of those plugins.

### 1. Creating an application
#### index.html
#### manifest.json
#### configuration.js
#### en_US.json
#### initialization.js
### 2. Templates
#### Declare template variables
#### Define template variables
#### Adding custom variables
#### Localization
### 3. Replication
#### Declaring a replicant template
#### Declaring a replicator
#### Instantiating a replication
### 4. Working with components
#### Creating a new component
#### Declaring a component instance
#### Configuring a component instance
#### Add application code to a component
### 5. Working with plugins
#### Creating a plugin
#### Configuring a plugin
#### Using a plugin
### 6. Working with events
#### When to use
#### How to use
#### Things to avoid
