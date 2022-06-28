
# Arvan Snippet Cli

Make your template once and use it many times and avoid duplication in coding.

  

## Requirements

You only need Node-JS to use this package.

  

## Installation

Install ```arsnippet``` package as global in your system.

```

npm install --global arsnippet

```

  

## Usage

#### Define Template

To create a template, first create a folder and then create the file you want in it. You can also define variables in your files to specify the values you want when rendering the template.

To define your variables, you must put the name of the variable between 4 brackets. Like the following text:

```

Hello World! I'm {{ name }}. This is my first template!

```

ArSnippet will later ask you for the values of your variables when rendering the template.

#### Import Template

To use a template, you first need to add it to ArSnippet.

Use the following command to add your template:

```

arsnippet import <template-path>

```

After calling the above command, the desired template will be saved with the name of the folder of your choice.

Using the ```-n``` or ```--name``` flag, you can save the template with your own name.

For example:

```

arsnippet import <template-path> [--name | -n] <custom-template-name>

```

#### Render Template

To use templates that you previously added to ArSnippet, you must use the render command, which contains two arguments. The first argument is the name of the template you added and the second is the name of the folder where the template is to be created.

An example of a command is:

```

arsnippet render <template-name> <target-folder-name>

```

#### Update Template
If you need to change a file in your template, here the ‍‍‍‍‍‍```update``` command will help you. With the ```update``` command, you can easily edit your desired file.
This command requires only one template name argument. The following command:
```
arsnippet update <template-name>
```
Then, after executing the command, ArSnippet will provide you with a menu of files in the template and will ask you to select the file you want. Then an editor will open for you that contains the contents of your file, you can apply your changes.
Windows uses the default text editor, and Linux and Mac use Vim.

#### Remove Template
To clear the template, all you have to do is give the template name to ArSnippet as an argument and drink your coffee safely :)
Example of a delete command:
```
arsnippet remove <template-name>
```
If you need to delete all the templates you can use the following command:
```
arsnippet removeall
```
Thats it!


#### Template Files Context
You can also use the detail command to view the contents of each file in your template.
Like the following command:
```
arsnippet detail <template-name>
```
This command, like the update command, returns a menu of template files for you to select.

#### List Of Exists Templates
With the list command, ArSnippet returns a table of available templates for you.
Like:
```
arsnippet list
```