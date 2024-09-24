# boggle-solver
Find all words for a boggle (or similar) puzzle

could also work for:
* http://www.playbabble.com/

# demo
https://yummysoup.github.io/boggle-solver/html/

# usage
Enter a grid of newline-delimited characters in the textarea on the right
All valid words (4 characters or longer) will appear near the bottom

# assumptions and limitations
* only finds words 4 characters or longer
* "Q" implies "Qu"
* has a hard-coded dictionary (otcwl2)

# notes on implementation
I built this over a decade ago (2014) with jquery and it probably worked nicely with IE6

I'd probably do things a bit differently today
