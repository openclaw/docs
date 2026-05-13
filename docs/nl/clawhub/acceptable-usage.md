---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor reviewers schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-13T02:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

Deze pagina beschrijft welke soorten Skills en content ClawHub toestaat, en welke misbruikworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruikworkflows, niet alleen op geïsoleerde trefwoorden. Als een Skill is gebouwd om verdediging te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort deze niet thuis op ClawHub.

## Recente patronen die we expliciet toestaan

- Frontend- en ontwerpsysteemwerk dat echte componenten, semantische tokens, toegankelijke statussen en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces beoordeelbaar houdt.
- Defensieve beveiligingsreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante installatie en dry-run- of voorbeeldmodi.
- Documentatie, migratiedraaiboeken, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-bot-ontwijking, rate-limit-omzeiling, stealth-scraping ontworpen om beschermingen te verslaan, live call- of agentovername, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accounts opwarmen of farmen, nepbetrokkenheid, karma- of volgeropbouw, automatisering met meerdere accounts, massaal posten, spambots, marktplaats- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, oplichtingsoutreach, nep sociaal bewijs, tools die uitgaven of kosten in rekening brengen mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of synthetische-identiteitsworkflows gebouwd om accounts voor fraude te maken.

- Privacy-invasieve scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching gebruikt zonder duidelijke toestemming, of gelekte data of breach dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele imitatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona’s, gekloonde influencers, of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en volwassenengeneratie met uitgeschakelde beveiliging.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video’s/content, wrappers voor volwassencontent rond API’s van derden, of Skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando’s, `curl | sh`, niet-aangegeven geheime vereisten, niet-aangegeven gebruik van private keys, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, misleidende metadata die verbergt wat de Skill werkelijk nodig heeft om te draaien.

## Recente patronen die we expliciet niet toestaan

- “Maak stealth-verkopersaccounts aan na marktplaatsbans.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Kweek Reddit/Twitter-accounts met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start koude outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een smalle defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruikworkflow wordt verpakt.
- We moeten neigen naar actie wanneer een Skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn grond voor het verbergen van content en het bannen van het account.

## Handhaving

- We kunnen overtredende Skills verbergen, verwijderen of definitief verwijderen.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en recidivisten of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
