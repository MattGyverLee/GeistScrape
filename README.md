#GeistScrape
A utility designed to scrape text/media content from a local Geist PKB (https://github.com/bryanph/Geist)

This utility will scrape text files attached to nodes for a specific user (In DraftJS format) and export them to **markdown**, **text**, or **both**. The files are placed in folders by collection and named with the node-name. 

##Configuration:

It must have network access to the Bolt interface of Neo4j (normally port 7687).

The server's **uri**, **username** and **password** must be set in the script.

Values for DefUserNumber (which must be harvested from Neo4j), outputPath, and formats can be passed at runtime in this order, or configured explicitly.

##Compilation:
I have successfully compiled a version with full configuration using pkg to create a "single-user" executable version.

##Known issues: 

- It does not even ATTEMPT to parse TeX data in the text, which is something I don't use.
- I don't know what it will do with images.

