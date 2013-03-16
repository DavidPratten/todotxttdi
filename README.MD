### todotxttdi Dropbox application

todotxttdi (Todo.txt Text Driven Interface) is a self-contained html5 Todo.txt client hosted entirely in your Chrome, Firefox, Safari, or Opera browser. When authorised by you, todotxttdi creates a Todo.txt file in your Dropbox, and automatically saves your changes. todotxttdi supports the full Todo.txt [specification](https://github.com/ginatrapani/todo.txt-cli/wiki/The-Todo.txt-Format), with some useful extensions.

You may use this client at any time by visiting [http://todotxttdi.com/](http://todotxttdi.com/)

### The "Zen" of todotxttdi

todotxttdi is guided by the following principles:

+ The [Todo.txt specification](https://github.com/ginatrapani/todo.txt-cli/wiki/The-Todo.txt-Format) is fully supported 
+ The user interface is driven by the user's text. (Text Driven Interface). Changing the content of your Todo.txt file may update the user interface so that relevant capabilities are available.
+ The Todo.txt file is **always** just a text file and filtering should not hide part of it.
+The Todo.txt file is available to be accessed from multiple locations, computers and browsers with automatic handover from one to the next. Reloading the Todo.txt file will return you to where you left off.

###Authorisation with Dropbox

Once the application page is loaded, Dropbox will ask you if you authorise the application. If you authorise todotxttdi, Dropbox gives your browser access to just one folder: `/Apps/todotxttdi` in your Dropbox. You may close your browser and reload the application without having to reauthorise it. To revoke authorisation for your browser, click the "Disconnect" button.

The todotxtapi application will only work if your browser has an authorised and active connection with dropbox.com.

###Todo.txt editor

####Sorting

todotxttdi sorts lines according to the Todo.txt specification. By default, todotxttdi provides buttons to sort alphabetically (A-Z), by creation date, by priority, by context code, and project code. You may also sort by hashtags if you use them. If a line contains multiple codes, the sort is based on the first code found.

todotxttdi also supports the sorting by extension tags such as `due:` . When an extension tag is detected, a sort button is added for your use.

Sorting the Todo.txt file does not trigger a save to Dropbox. This is because each line in a Todo.txt file is independent, and sorting does not change the information that you have entered.

####Filtering

todotxttdi places the lines that match a filter at the top of the Todo.txt file and rather than hiding the non-matching lines, it shows them after two blank lines. This preserves the spirit of Todo.txt - that it is always just a text file.

todotxttdi allows you to enter up to three independent filters. Filters are applied simply by clicking in the filter field. The currently applied filter has a green background. Filters are remembered by your browser and are not stored in Dropbox.

Each filter consists of one or more space separated items. For a Todo.txt line to match a filter, it must match every space separated filter item. If a filter item is preceded by a "-" sign, this means a line will match if it doesn't contain this item. If a filter item contains multiple sub-items separated by "|" then a line will match if it matches any one of the sub-items.

You may use a "~" prefix to temporarily disable a filter item so you don't need to retype it later.

If you wish to use one of the following characters in a filter you will need to precede them with a "`\`" character. Use "`\+`" instead of "`+`", "`\*`" instead of "`*`", ditto for "`\.`", "`\(`", and "`\)`". And yes, this means, if you care, you may use regular expressions in the filters.

Prior to applying each filter, todotxttdi analyses all due:yyyy-mm-dd dates and adds a hashtag: "` #past`", "` #today`", or "` #tomorrow`" as appropriate. These may be filtered against. For example: the filter "`#past|#today`" will filter for all current Todo.txt lines.

Filtering the Todo.txt file does not trigger a save to Dropbox. This is because each line in a Todo.txt file is independent, and filtering (like sorting) does not change the information that you have entered.

####Editing

Typing changes into the text area will cause it to be saved to the Todo.txt file the next time you pause your typing.

todotxttdi greatly simplifies entering dates. The entry of both task completion:` x yyyy-mm-dd`" and due dates: `due:yyyy-mm-dd` are simplified. Dates may be entered as text (e.g. `due:today;`, `due:tomorrow;`, `due:+4;`, `due:+4d;`, `due:monday;`), in each context the dates will be interpreted as soon as the ';' is typed. For example a completed task can be entered as x yesterday; and a reminder set as due:next thursday; The kinds of dates that are understood is defined here http://www.datejs.com/

Task dependency (precedence)

A task that can't be started until another task is complete may include an tag of `after:xxxx` where the task on which this task depends contains a corresponding `id:xxxx` tag.

Every `id:` tag must be unique.

As soon as all tasks on which a task depends are deleted or marked as completed, the now 'ready to run' task will be highlighted in the user interface.

Privacy Policy

The only information that is recorded by the todotxttdi.com website is the fact that the (empty) application page was requested. After your browser loads the (empty) todotxttdi application page from the todotxttdi.com website, the browser's only connection is with dropbox.com. Your browser retrieves your Todo.txt and saves it using a secure (https) connection with Dropbox.com. While editting, your data remains entirely in your browser.