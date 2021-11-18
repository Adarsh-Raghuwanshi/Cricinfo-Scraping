//input -> node cricinfoWorldcup.js --dest1=worldcup.csv --dest2=Worldcup --dest3=Worldcup_Qrcodes --matchJson=match.json --teamsJson=teams.json --url=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let axios = require("axios");
let jsdom = require("jsdom");
let fs = require("fs");
let excel = require("excel4node");
let path = require("path");
let pdf = require("pdf-lib");
let qrcode = require("qrcode");
let minimist = require("minimist");
let args = minimist(process.argv);

//get the data from given url.
let dataPromise = axios.get(args.url);

dataPromise.then(function(response){
    let html = response.data;

    //here convert the data in dom, so can do manipultion in it and make json with site's information.
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matches = [];
    
    let totalMatch = document.querySelectorAll("div.match-info-FIXTURES");
    for(let i = 0; i < totalMatch.length; i++){
        
        let match = {
            t1 : "",
            t2 : "",
            ts1 : "",
            ts2 : "",
            result : ""
        }

        let teamName = totalMatch[i].querySelectorAll("div.name-detail > p.name");
        match.t1 = teamName[0].textContent;
        match.t2 = teamName[1].textContent;
        
        let teamScore = totalMatch[i].querySelectorAll("div.score-detail > span.score");
        if(teamScore.length == 2){
            match.ts1 = teamScore[0].textContent;
            match.ts2 = teamScore[1].textContent;
        }
        else if(teamScore.length == 1){
            match.ts1 = teamScore[0].textContent;
            match.ts2 = "";
        }
        else{
            match.ts1 = "";
            match.ts2 = "";
        }
        
        let matchResult = document.querySelectorAll("div.match-info-FIXTURES > div.status-text");
        match.result = matchResult[i].textContent;

        matches.push(match);
    }

    let matchesJson = JSON.stringify(matches);
    fs.writeFileSync(args.matchJson, matchesJson, "utf-8");  

    //here convert the json of data to the json that we require.
    let teams = [];
    for(let i = 0; i < matches.length; i++){
        addTeamToTeamArrayIfNotThere(teams, matches[i].t1);
        addTeamToTeamArrayIfNotThere(teams, matches[i].t2);
    }    
    
    for(let i = 0; i < matches.length; i++){
        addMatchToParticularTeam(teams, matches[i].t1, matches[i].t2, matches[i].ts1, matches[i].ts2, matches[i].result);
        addMatchToParticularTeam(teams, matches[i].t2, matches[i].t1, matches[i].ts2, matches[i].ts1, matches[i].result);
    }
    
    let teamsJson = JSON.stringify(teams);
    fs.writeFileSync(args.teamsJson, teamsJson, "utf-8");

    //here we prepare the qrcodes.
    createQr(teams, args.dest3);
    
    //from here prepare the excel and pdf from json.
    prepareExcel(teams);
    prepareFolderAndPdf(teams, args.dest2);

}).catch(function(err){
    console.log(err);
})

function addTeamToTeamArrayIfNotThere(teams, teamName){
    let tidx = -1;

    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == teamName){
            tidx = i;
            break;
        }
        
    }

    if(tidx == -1){
        teams.push({
            name : teamName,
            matches : []
        })
    }
}

function addMatchToParticularTeam(teams, homeTeam, oppoTeam, selfScore, oppoScore, result){
    
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == homeTeam){
            teams[i].matches.push({
                vs : oppoTeam,
                t1s : selfScore,
                t2s : oppoScore,
                result : result
            })
            break;
        }
    }
}

function prepareExcel(teams){

    let wb = new excel.Workbook();
    let hs = wb.createStyle({
        font :{
            bold : true
        }
    });        
    for(let i = 0; i < teams.length; i++){

        let ws = wb.addWorksheet(teams[i].name);
        
        ws.cell(1,1).string("Oppo Team").style(hs);
        ws.cell(1,2).string("Self Score").style(hs);
        ws.cell(1,3).string("Oppo Score").style(hs);
        ws.cell(1,4).string("Result").style(hs);
        
        for(let j = 0; j < teams[i].matches.length; j++){

            ws.cell(j+2,1).string(teams[i].matches[j].vs);
            ws.cell(j+2,2).string(teams[i].matches[j].t1s);
            ws.cell(j+2,3).string(teams[i].matches[j].t2s);
            ws.cell(j+2,4).string(teams[i].matches[j].result);
        }
    }

    wb.write(args.dest1);
}

function prepareFolderAndPdf(teams, dataDir){

    if(fs.existsSync(dataDir) == true){
        fs.rmdirSync(dataDir, {recursive : true});
    }
    fs.mkdirSync(dataDir);

    for(let i = 0; i < teams.length; i++){
        let teamFolderName = path.join(dataDir, teams[i].name);
        fs.mkdirSync(teamFolderName);

        for(let j = 0; j < teams[i].matches.length; j++){
            let matchinfo = teams[i].matches[j];
            matchScoreCardPdf(teamFolderName, matchinfo, teams[i].name);
        }
    }
}

function matchScoreCardPdf(teamFolderName, match, homeTeams){
    let matchFileName = path.join(teamFolderName, match.vs);
    
    let templateFileBytes = fs.readFileSync("Template.pdf");
    let pdfdocPromise = pdf.PDFDocument.load(templateFileBytes);

    pdfdocPromise.then(function(pdfdoc){
        let page = pdfdoc.getPage(0);

        page.drawText(homeTeams, {
            x: 353,
            y: 320,
            size: 14
        });
        page.drawText(match.vs, {
            x: 110,
            y: 198,
            size: 15
        });
        page.drawText(match.t1s, {
            x: 273,
            y: 198,
            size: 18
        });
        page.drawText(match.t2s, {
            x: 418,
            y: 198,
            size: 18
        });
        page.drawText(match.result, {
            x: 215,
            y: 122,
            size: 12
        });

        let finalPdfBytesPromise = pdfdoc.save();
        finalPdfBytesPromise.then(function(finalPdfBytes){
            if(fs.existsSync(matchFileName + ".pdf") == true){

                fs.writeFileSync(matchFileName + "1.pdf", finalPdfBytes);
            }
            else{
                fs.writeFileSync(matchFileName + ".pdf", finalPdfBytes);
            }
        })
    })
}

function createQr(teams, qrFolderName){

    if(fs.existsSync(qrFolderName) == true){
        fs.rmdirSync(qrFolderName, {recursive : true});
    }
    fs.mkdirSync(qrFolderName);

    for(let i = 0; i < teams.length; i++){
        let qrTeamFolder = path.join(qrFolderName, teams[i].name);
        fs.mkdirSync(qrTeamFolder);

        for(let j = 0; j < teams[i].matches.length; j++){
            let vsTeamsQr = path.join(qrTeamFolder, teams[i].name + " vs " + teams[i].matches[j].vs);
            let matchArray = [];

            matchArray.push(teams[i].name + " Score : " + teams[i].matches[j].t1s + ", ");
            matchArray.push("Opponent team : " + teams[i].matches[j].vs + ", ");
            matchArray.push("score : " + teams[i].matches[j].t2s + ", ");
            matchArray.push("Result : " + teams[i].matches[j].result + ".");

            if(fs.existsSync(vsTeamsQr + ".png") == true){
                qrcode.toFile(vsTeamsQr + "1.png", matchArray);
            }
            else{
                qrcode.toFile(vsTeamsQr + ".png", matchArray);
            }
        }
    }
}