export const config = {
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
  }
};
