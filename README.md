# Koi
Koi is a framework for developing web applications on top of jQuery.

## Development Philosophy
> Write once, use forever.

Koi is designed to create software which is _extensible_, _configurable_ and
_reusable_.

By _extensible_, we mean we see it as a subset of what you need; it provides
a set of common functionality as a starting point and allows you to add
whatever else you may need with minimum agony.

By _configurable_, we mean it tries not to be opinionated; it should
be able to handle many different use cases without trying to define what's
important for you. In the worst case, everything is modular; if you don't
like what something is doing, you can rip it out and replace it with something
better for the job.

By _reusable_, we mean applications are made up of replaceable components that
can be reused across multiple projects. If you've been using Koi for awhile,
writing a new application should mostly be a matter of fitting together
parts you've already written.

### The SDK

Koi uses external software to manage its components and generate builds. The
Koi SDK client is an open source command line interface which is maintained
and developed alongside the Koi system. It's available
[here](https://github.com/Knewton/Koi-SDK-Client "Koi SDK Client").

An application will almost certainly need some external software for this, but
there's no particular reason why you'd need to use the provided SDK client.
External parties are free to develop their own SDK management software.

Please refer to the INSTALL document for help setting up the SDK.

### A note on capitalization

We use different capitalizations of Koi in different contexts:

-	"Koi" is the Koi system as a whole and associated development philosophy.
-	"koi" is the command line SDK client that builds applications from sources.
-	"KOI" is the Javascript object that exposes framework functionality within applications.

## Application Development

A Koi application consists of:

-	an HTML page rendered in a web browser (index.html);
-	a set of plugins from some external SDK (manifest.json);
-	application-specific configurations for those plugins (configuration.js);
-	application-specific software which makes use of those plugins.

### 1. Creating an application
#### index.html

This contains a basic HTML skeleton for your application. At a minimum, the `<head>`
should contain two `<meta>` tags and one `<script>` that look something like this:

```html
<meta name="manifest" content="manifest.json" scheme="koi-bootstrap" />
<meta name="sdk" content="/remote/sdk" scheme="koi-bootstrap" />
<script type="text/javascript" src="/remote/sdk/koi/framework/bootstrap/development/bootstrap.js"></script>
```

These describe the location of your manifest.json file and load bootstap.js, which
reads the manifest and dynamically loads everything your application needs from it.

In the `<body>`, the app should contain an HTML layout structure for your application.

_TODO more!_

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
