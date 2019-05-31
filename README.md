## Как использовать

1. Создать файл `xpd_config.json` там же, где лежит папка dist с билдом

```json
{
  "default": {
    "user": "dev",
    "deployTo": "/home/dev/www/test",
    "deployFrom": "./dist",
    "keepReleases": 2
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

2.  Запустить при помощи команды `npx xp-deploy deploy to:test`
