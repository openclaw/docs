---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-13T05:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

Deze pagina beschrijft welke soorten vaardigheden en content ClawHub toestaat, en welke misbruiksworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruiksworkflows, niet alleen op losse trefwoorden. Als een vaardigheid is gebouwd om verdediging te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of gedrag zonder toestemming mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet toestaan

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige opmaak.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde controle-interfaces beoordeelbaar houdt.
- Defensieve beveiligingsreview, moderatietools en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante installatie en proef- of voorbeeldmodi.
- Documentatie, migratiedraaiboeken, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet oké

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: authenticatieomzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of antibotomzeiling, rate-limit-omzeiling, stealth-scraping ontworpen om beveiligingen te verslaan, overname van livegesprekken of agents, herbruikbare sessiediefstal, het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accounts opwarmen of farmen, nepbetrokkenheid, karma- of volgeropbouw, automatisering met meerdere accounts, massaal posten, spambotten, marktplaats- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, oplichtingsbenadering, nep-sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacyschendende scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde benadering, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte gegevens of datalekdumps kopen, publiceren, downloaden of operationaliseren.

- Imitatie zonder toestemming of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tools voor identiteitsmanipulatie die worden gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en volwassenengeneratie met uitgeschakelde veiligheidsmaatregelen.
  - Voorbeelden: NSFW-afbeeldings-, video- of contentgeneratie, wrappers voor volwassencontent rond API's van derden, of vaardigheden waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatieopdrachten, `curl | sh`, niet-vermelde vereisten voor geheimen, niet-vermeld gebruik van privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, misleidende metadata die verhult wat de vaardigheid echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet toestaan

- “Maak stealth-verkopersaccounts aan na bans op marktplaatsen.”
- “Wijzig Telegram-koppeling zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Bouw Reddit/Twitter-accounts op met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start koude benadering op schaal.”
- “Koop, publiceer of download gelekte gegevens of datalekdumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context doet ertoe. Hetzelfde onderwerp kan legitiem zijn in een nauw afgebakende defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruiksworkflow is verpakt.
- We moeten neigen naar actie wanneer een vaardigheid duidelijk is geoptimaliseerd voor ontwijking, misleiding of gebruik zonder toestemming.
- Herhaalde uploads in deze categorieën zijn reden om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende vaardigheden verbergen, verwijderen of permanent verwijderen.
- We kunnen tokens intrekken, gekoppelde content zacht verwijderen en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
