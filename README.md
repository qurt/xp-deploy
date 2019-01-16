## Установка xp-deploy cli в ваш проект

`npm install xp-deploy`
или
`yarn add xp-deploy`

## Как использовать

1. Создать файл `xpd_config.json` в корне проекта

```json
{
  "default": {
    "user": "dev",
    "deployTo": "/path/to/deploy/folder",
    "deployFrom": "/path/to/dist/folder",
    "keepReleases": 2
  },
  "test": {
    "servers": "example.com",
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

2.  Запустите при помощи команды `./node_modules/xp-deploy/bin/xpd deploy to:test`
