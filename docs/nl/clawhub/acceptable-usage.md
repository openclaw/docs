---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een skill moet worden verborgen of een gebruiker moet worden verbannen
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-11T22:19:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

Deze pagina beschrijft welke soorten skills en inhoud ClawHub accepteert, en welke misbruikworkflows het niet host.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruikworkflows, niet alleen op losse trefwoorden. Als een skill is gebouwd om verdedigingsmechanismen te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die wij expliciet accepteren

- Frontend- en design-systemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5 JavaScript-naar-TypeScript-conversie die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces controleerbaar houdt.
- Defensieve beveiligingsreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante installatie en dry-run- of previewmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet acceptabel

- Workflows voor het omzeilen van beveiliging of voor ongeautoriseerde toegang.
  - Voorbeelden: auth bypass, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-bot-omzeiling, rate-limit-omzeiling, stealth scraping ontworpen om beveiligingen te verslaan, live call- of agentovername, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en ban-ontwijking.
  - Voorbeelden: stealth-accounts na bans, account warming/farming, nepbetrokkenheid, karma- of volgersopbouw, multi-accountautomatisering, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, scam-outreach, nep sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-invasieve scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching gebruikt zonder duidelijke toestemming, of gelekte gegevens of breach dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele imitatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digital twins, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele inhoud en veiligheid-uitgeschakelde adult-generatie.
  - Voorbeelden: NSFW-afbeeldings-/video-/inhoudsgeneratie, adult-contentwrappers rond API's van derden, of skills waarvan het primaire doel expliciete seksuele inhoud is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando's, `curl | sh`, niet-gemelde vereisten voor geheimen, niet-gemeld gebruik van privésleutels, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, misleidende metadata die verbergt wat de skill echt nodig heeft om te draaien.

## Recente patronen die wij expliciet niet accepteren

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Ontwikkel Reddit/Twitter-accounts met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-inhoud met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start koude outreach op schaal.”
- “Koop, publiceer of download gelekte gegevens of breach dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een nauwe defensieve of op toestemming gebaseerde setting, en onacceptabel wanneer het is verpakt als een misbruikworkflow.
- We moeten neigen naar actie wanneer een skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn grond om inhoud te verbergen en het account te bannen.

## Handhaving

- We kunnen schendende skills verbergen, verwijderen of permanent verwijderen.
- We kunnen tokens intrekken, gekoppelde inhoud soft-deleten en terugkerende of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
