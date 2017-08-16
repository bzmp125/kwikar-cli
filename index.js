#!/usr/bin/env node

var program = require('commander'),
    chalk = require('chalk'),
    figlet = require('figlet'),
    inquirer = require('inquirer'),
    clear = require('clear'),
    colors = require('colors'),
    Client = require('node-rest-client').Client,
    path = require('path'),
    fs = require('fs'),
    storage = require('node-persist');

storage.initSync({
    dir: 'config',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    continuous: true,
    forgiveParseErrors: true
})

//setting up the program via commander
program
    .version('0.0.1')
    .option('-a, --amount <amount>', 'Amount in USD ($)', parseFloat)
    .option('-m, --phone_number <phone number>', 'Telephone Number')
    .option('-d, --delivery_phone <delivery phone>', 'Mobile Number to which the token will be sent.')
    .option('-E, --delivery_email <email>', 'Email Address to which the token will be sent(optional).')
    .option('-p, --payment_type <payment type>', 'The preferred type of payment.')
    .option('-P, --proxy <proxy:port>', "If for some reason you're behind a proxy.")
    .option('-M, --mobile_number <mobile number>', 'Paying Mobile Number (via Ecocash or Telecash).')
    .option('-i, --init', 'Setting up default values.')
    .parse(process.argv)

var client;
//if user specifies a proxy
if (program.proxy) {
    const URL = require('url').URL;
    var proxy = new URL(program.proxy);

    var options_proxy = (proxy) ? {
        proxy: {
            host: proxy.hostname,
            port: proxy.port,
            user: proxy.username,
            password: proxy.password,
            tunnel: true
        }
    } : {};
    client = new Client(options_proxy);
} else {
    client = new Client();
}

//for the extra what what, 
const ora = require('ora');
var repos = [];
var Repository;
var repoName;

function runConfig(callback) {
    showHeader();
    var projectName = program.init;
    var directoryName = process.cwd().split('/').splice(-1)[0];
    var projectConfig;

    const spinner = ora('Please Wait...').start();
    spinner.color = 'blue';

    var restClient = new Client();
    restClient.get('https://api.github.com/search/repositories?q=topic:kwikar-template', {
        "headers": {
            "User-Agent": "bzmp125"
        }
    }, function (response) {

        if (response.items.length > 0) {
            repos = response.items;
            var choices = response.items.map(choice => {
                return choice.name + ' by ' + choice.owner.login
            })
            spinner.stop();


            inquirer.prompt([{
                    name: 'ProjectName',
                    type: 'input',
                    message: 'Project Name:',
                    default: directoryName,
                    validate: function (value) {
                        if (!value.length) {
                            console.log(chalk.cyan('\n You will have to provide your Meter Number everytime you use BuyMagetsi.'))
                        }
                        return true;
                    }
                },
                {
                    name: 'TemplateName',
                    type: 'rawlist',
                    message: 'Choose a template:',
                    default: choices[0],
                    choices,
                    validate: function (value) {
                        console.log('chosen', value)
                        if (!value.length) {
                            console.log(chalk.cyan('\n You will have to provide your Payment Type everytime you use BuyMagetsi.'))
                        }
                        return true;
                    }
                }
            ]).then(callback)
        } else {
            console.error(chalk.red("Failed to connect to Github, please check internet connection."));
            process.exit(1);
        }
    })

}
if (program.init) {
    runConfig((answers) => {

        repoName = answers.TemplateName.split(' ')[0]
        Repository = repos.map(repo => {
            return (repo.name == repoName) ? repo : null;
        })[0]
        if (!Repository) {
            console.error(chalk.red('Kwikar has failed to get the repository for the project.'))
            process.exit(0);
        }

        //confirm config
        inquirer.prompt([{
            name: 'ConfirmChecksout',
            type: 'confirm',
            message: 'Is this correct? Project Name: ' + answers.ProjectName + ' & Project Template: ' + answers.TemplateName,
            validate: function (checksOut) {
                if (checksOut) {
                    return true;
                } else {
                    runConfig(this)
                    return '';
                }
            }
        }]).then((checksOutAnswers) => {
            if (checksOutAnswers.ConfirmChecksout) {
                let ProjectName = answers.ProjectName;
                let TemplateName = answers.TemplateName;
                let path = process.cwd() + "/" + ProjectName + "/kwikar.json";

                // clone repo and cd into project
                const spinner = ora('Please Wait...Cloning ' + repoName + ' into ' + ProjectName).start();
                spinner.color = 'cyan';

                var cmd = require('node-cmd');
                cmd.get(
                    `
                        git clone ` + Repository.clone_url + ` ` + ProjectName + `
                        cd ` + ProjectName + `
                    `,
                    function (err, data, stderr) {
                        if (!err) {

                            spinner.stop();
                            fs.writeFile(path, JSON.stringify({
                                'ProjectName': answers.ProjectName,
                                'TemplateName': answers.TemplateName,
                                Repository
                            }), function (e) {
                                if (e) {
                                    console.error('Failed to create project directory and config. Please try again or upgrade file permissions for this user.')
                                    process.exit(1);
                                }
                                console.log(chalk.cyan('Done!'))
                            })
                        } else {
                            console.error('Failed to clone repository. Please try again.')
                            process.exit(1);
                        }
                    }
                );

            } else {
                runConfig(this)
            }
        })
    })
} else {
    showHeader();
    console.log('More functionality is coming soon! For now check out kwikar --help for more options, or visit https://github.com/bzmp125/kwikar for more information.')
}

function showHeader() {
    clear();
    console.log('\n \n \n', chalk.cyan(
        figlet.textSync('Kwikar', {
            horizontalLayout: 'full',
            size: 9
        })
    ))

}
