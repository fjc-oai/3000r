# 3000r

## links
- https://three000r-web.onrender.com
- https://dashboard.render.com/web/srv-d2shk66mcj7s73a5raeg/deploys/dep-d31q4cemcj7s738v6rr0
- https://console.neon.tech/app/projects/mute-mud-01593984/branches/br-winter-king-af7p2cux/sql-editor?database=neondb

## cmds
- `npm run build && rm -rf ../backend/frontend/dist && cp -r dist ../backend/frontend/`
- `uvicorn app:app --reload --port 8000`

# Features

## TODO 09/15 (DONE)
1. on the home page, i need to new faeture: 
so currently we can use start botton to start a session.
but sometimes i have done learning separately. i only want to record a session, by typing the duration. or i want to record some new words directly.
could you implement this as another option on 

2. for recent sessions (showing on both home page and start session page), can we show aggregated session info, e.g. instead of showing every session, can you show the learning duration for past a week aggregated per day

3. currently i'm using render to deploy this webpage. because i'm using a free plan, so the free instance will spin down with inactivity, which can delay requests by 50 seconds or more.

can i somehow activity this webpage by itself (e.g. on backend somehow) every few minutes, to prevent it inactivity?

## TODO 09/11
### word review
so in the first page, besides start session button, i want to add a new button leading to word bank page.

in word bank page, there are several ways to display/filter the words i have added

it can show the words added in past a day, a week, a month, or a customized range. it also has an option to show all the words.

for each word displayed, only show the word itself by default. when hover your mouse, it shows all the example sentences 
### word test
1. select words: time based, random, familarity
2. test. 
   1. mode 1: show words, click yes or no
   2. mode 2: show examples, click yes or no, hint shows words
3. familarity is defined as
   1. (#yes) / (#yes + #no)
   2. every new word by default is #yes=0, #no=1
   3. each click bump either #yes or #no

## TODO 9.8 (DONE)
couple feedbacks.

1. overall looks great. the word part works well
2. for the session, i don't need "back" button
3. in the first page, let's also show the latest 7 sessions as well
4. when i click end session button, please show a session summary on the right hand, which list all the new words added to the session (you can use the starttime to figure out all the new words)
5. after clicking the start session button, i want to a running clock of how long this session last so far