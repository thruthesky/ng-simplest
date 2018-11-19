# Simplest Angular Api

Angular PHP Simplest Api

## Environment

* if `enableLoginToAllSubdomains` is set to true, then it will use cookie to save login information to share it to all subdomains.
  * If it is set to false, then it will use localStroage to save login information that is not sharable to subdomains.

````ts
    simplest: {
        backendUrl: 'https://api.sonub.com/index.php',
        enableLoginToAllSubdomains: true
    },
````
