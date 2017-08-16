# kwikar-cli

The idea is to help developers get started faster with new projects, allowing them to focus on building their application, which is what really matters. With kwikar, you can easily spawn projects from already made templates taken from github repositories with the topic 'kwikar-template'. 

## Getting Started
You can easily install the CLi with the following command:
```
npm install -g kwikar
```

Then to start a new project you then run 

```
kwikar init
```
This will take you through the configuration steps where you set the project name & choose the service template amongst other things. 

## How to create a service template.
Creating a service template is as simple as just adding the topic 'kwikar-template' to your github repository. This way kwikar-cli will be able to pick up the repo when looking for service templates to offer as choices when choosing a template in `kwikar init`.

## The Future
1. Creating a `kwikar deploy` to deploy to different servers e.g Heroku, Azure, Google Cloud etc.
2. Support for creating templates from Docker images.
