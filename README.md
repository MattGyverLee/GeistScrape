# GeistScrape
A utility to scrape text/media content from a local Geist PKB (https://github.com/bryanph/Geist)

This utility will scrape text files attached to nodes for a specific user (In DraftJS format) and export them to **markdown**, **text**, or **both**.

It must have access to the Bolt interface of Neo4j (normally port 7687).
The **uri**, **username** and **password** must be set in the script.

Values for DefUserNumber (harvested from Neo4j), outputPath, and formats can be passed at runtime in this order, or configured ezplicitly.

I have successfully compiled a version with full configuration using pkg to create a "single-user" version.

Known issues: 
 * It does not even ATTEMPT to parse TeX data in the text, which is something I don't use. 
