# SNapp

This project aims to meet the needs of beginning music students who want to start playing an instrument without first learning to read traditional sheet music. The goal of this project is to make [WYSIWYP notation](http://comp523k.web.unc.edu/project/) freely available and easily accessible to music students.

## Getting Started

These instructions will allow you to get a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

To run SNapp locally, [Node.js and npm](https://nodejs.org/en/download/) must be installed. Clone the SNapp project locally and, from a shell of your choice, navigate to the project's root directory. Run `npm install --legacy-peer-deps` to install the required dependencies and `npm start` to run the app in development mode. This should automatically open a browser window with the app.

The following commands can be entered in the console to clone, install, and run the app.
```
git clone https://github.com/radiotech/SNapp.git SNapp
cd SNapp
npm install --legacy-peer-deps
npm start
```

These instructions have last been tested on commit `0de542e` using Node.js version 12.13.0 on Windows and MacOS machines.

## Deployment
The project is currently deployed using [GitHub Pages](https://pages.github.com/) and the project's `gh-pages` branch. The deployment can be updated by modifying the contents of this branch in GitHub. New developers can gain access to the GitHub project by being added as a collaborator by an existing member.

SNapp can be built for deployment by running `npm run build` from the project's root directory. A deployment-ready version of the app will be generated and placed in the `build` folder. Most hosting providers such as GoDaddy and AWS should be able to host a copy of the deployment by simply making the contents of this `build` folder publicly available as static web content. There are some additional configuration options listed below that should be taken into consideration when deploying the project.

Routing in SNapp is currently implemented using the full path portion of page URLs. As a result, when hosting a deployment, all paths under the deployment subdomain should be configured to serve the project's main `index.html` document. This also means that SNapp must be hosted at your domain or subdomain's root path. When using GitHub pages, this can be achieved by renaming `index.html` to `404.html` and by setting up a custom domain name for the project.

## Technologies used
This project was developed using [React](https://reactjs.org/) and [Typescript](https://www.typescriptlang.org/). The project is designed to work with the [musicxml](https://www.musicxml.com/) and [mxl](https://www.musicxml.com/tutorial/compressed-mxl-files/) file formats and uses the `localStorage` API and SVGs in the browser to render WYSIWYP content. A basic architecture diagram is included below for reference. A set of architecture decision records related to the app are available from the [project wiki]() on GitHub.

<img src="http://comp523k.web.unc.edu/files/2019/10/Architecture-Diagram.png" width="350"></img>

## Contributing

Please read our [Behavior Guide](https://github.com/radiotech/SNapp/wiki/Behavior-Guide) and [Style Guide](https://github.com/radiotech/SNapp/wiki/Style-Guide) wiki pages for details relating to our code of conduct. Project information can be found on the project's [website](http://comp523k.web.unc.edu/) and [Trello board](https://trello.com/b/bnkZcxZr/snapp-comp-523-group-k). Details relating to the Git branching style used for the project can be found under the [Team](http://comp523k.web.unc.edu/team/) section of the project website. New contributors should request access to the SNapp GitHub project and Trello board.

## Authors

* **Andrew Harvey** - Project Manager

    Coordinated the development of project deliverables and worked to implement routing, test cases, PDF generation, and `localStorage` access within the app.

* **William Lee** - Tech Lead

    Incorporated musical elements including ties, signature changes, accidentals distinctions, and clef divisions into WYSIWYP parsing and rendering.

* **Han Wang** - Webmaster and Design Lead

    Designed the app's user interface, contributed to the layout of the app, and fine-tuned the user experience.

## License

This project is licensed under the MIT License - please see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

The notation used by SNapp, WYSIWYP, was developed by Stuart Byrom. Stuart also commissioned the SNapp project and provided the development team with helpful feedback throughout the app's construction. Our mentor, Benjamin Pollack, was especially helpful to the team during initial project development. 
