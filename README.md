[![version][version-badge]][package]

## Init

Create an `xpd_config.json` file in the project root or execute `npx xp-deploy init`

```json
{
  "default": {
    "user": "dev",
    "deployTo": "/home/dev/www/test",
    "deployFrom": "./dist",
    "keepReleases": 2,
    "copy": false
  },
  "test": {
    "servers": "test.example.com",
    "preDeploy": {
      "local": ["echo 1", "echo 2"],
      "remote": "echo 3"
    },
    "postDeploy": {
      "local": "echo 1",
      "remote": "echo 2"
    }
  },
  "production": {
    "servers": ["example-01.com", "example-02.com"],
    "preDeploy": {
      "local": ["echo 1", "echo 2"],
      "remote": "echo 3"
    },
    "postDeploy": {
      "local": "echo 1",
      "remote": "echo 2"
    }
  }
}
```

The root key of the configuration is the name of the environment.
In `default' you can specify parameters that will be applied to all default environments. Further use of the parameters overwrites the defaults.

### Options
`user` Username for connection.

`servers` The address of the server to connect. If there are several servers, an array is used.
 
`deployTo` Directory to deploy on server.

`deployFrom` Local directory with dist.

`keepReleases` The number of releases to be left on the server.
 
`preDeploy` An object that contains commands to run before uploading files to the server. `local` to execute local commands, `remote` to execute on the server.

`postDeploy` Similarly to `preDeploy` only commands are executed after files are loaded.

`copy` Indicates whether to copy the previous release before updating the files.

## Run 
`npx xp-deploy deploy to:test`

[version-badge]: https://img.shields.io/npm/v/xp-deploy
[package]: https://www.npmjs.com/package/xp-deploy
