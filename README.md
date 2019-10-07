[![version][version-badge]][package]

## Инициализация

Создать файл `xpd_config.json` в корне проекта или выполнить `npx xp-deploy init`

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

Корневым ключом конфига является название окружения.
В `default` можно указать параметры которые будут применяться ко всем окружениям по умолчанию. Дальнейшее использование параметров перезаписывает значения по умолчанию.

### Параметры
`user` Имя пользователя для подключения.

`servers` Адрес сервера для подключения. Если серверов несколько - используется массив.
 
`deployTo` Директория на сервере, куда производится деплой.

`deployFrom` Локальная директория с дистрибутивом, относительно корня проекта

`keepReleases` Количество релизов, которые нужно оставлять на сервере.
 
`preDeploy` Объект, содержащий в себе команды для запуска перед загрузкой файлов на сервер. `local` для выполнения локальных команд, `remote` - для выполнения на сервере.

`postDeploy` Аналогично `preDeploy` только команды выполняются после загрузки файлов.

`copy` Указывает, копировать ли предыдущий релиз перед обновлением файлов.

## Запуск 
`npx xp-deploy deploy to:test`

[version-badge]: https://img.shields.io/npm/v/xp-deploy
[package]: https://www.npmjs.com/package/xp-deploy
