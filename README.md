
# Cricket Website Scrapping

Hi Everyone!😀😀

I made a project based on Web Scraping.😍

Here I extracted teams data of cricket world cup 2019 (Men's)
Used the data to edit a design template that I 
made and make scorecards of each teams in pdf file, write the match summary in a CSV file and also scrape those scorecards in qrcode(you can scan them to get the particular match's summary)....Explored and tried a few npm libraries. 
Learned about dependencies on other libraries. 
Had a lot of fun building this.




## Node modules used

- To get data of cricinfo worldcup 2019 (axios)
- To Process data : Get all teams (jsdom)
- Write processed data in excel : Match results per team in their own sheet (excel4node)
- Create Folders : One for each team (fs)
- Write Files : PDF file for scorecard of each match in relevant folder (pdf-lib)
- To scrape data : Make qrcode of scorecard (qrcode)


## Run Locally

**You should have node installed in your machine.**

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  node cricinfoWorldcup.js --dest1=worldcup.csv --dest2=Worldcup 
  --dest3=Worldcup_Qrcodes --matchJson=match.json 
  --teamsJson=teams.json --url=https://www.espncricinfo.com/
  series/icc-cricket-world-cup-2019-1144415/match-results

```


