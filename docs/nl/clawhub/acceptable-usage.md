---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor beoordelaars schrijven
    - Bepalen of een skill moet worden verborgen of een gebruiker moet worden verbannen
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet host.'
x-i18n:
    generated_at: "2026-05-12T00:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

Deze pagina beschrijft welke soorten skills en content ClawHub accepteert, en welke misbruikworkflows het niet host.

Deze regels zijn bewust praktisch. We geven vooral om end-to-end misbruikworkflows, niet alleen om geïsoleerde trefwoorden. Als een skill is gebouwd om verdediging te omzeilen, platformen te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet accepteren

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersstromen gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5 JavaScript-naar-TypeScript-conversie die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces reviewbaar houdt.
- Defensieve beveiligingsreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete referenties, transparante installatie en simulatie- of voorbeeldmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of antibot-omzeiling, omzeiling van snelheidslimieten, heimelijk scrapen dat is ontworpen om beveiligingen te verslaan, livegesprek- of agentovername, herbruikbare sessiediefstal, koppelingsflows automatisch goedkeuren voor niet-goedgekeurde gebruikers.

- Platformmisbruik en ban-omzeiling.
  - Voorbeelden: heimelijke accounts na bans, accounts opwarmen/farmen, nepbetrokkenheid, karma- of volgersopbouw, automatisering met meerdere accounts, massaal posten, spambots, marktplaats- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betalingsflows, oplichtingsoutreach, nep sociaal bewijs, tools die uitgaven of afschrijvingen mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-schendend scrapen, verrijken of surveilleren.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach-dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en volwassenengeneratie met uitgeschakelde veiligheid.
  - Voorbeelden: NSFW-afbeelding-/video-/contentgeneratie, wrappers voor volwassencontent rond API's van derden, of skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando's, `curl | sh`, niet-vermelde geheime vereisten, niet-vermeld gebruik van privésleutels, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, misleidende metadata die verbergt wat de skill echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet accepteren

- “Maak heimelijke verkopersaccounts aan na bans op marktplaatsen.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Bouw Reddit-/Twitter-accounts op met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start koude outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach-dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een beperkte defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruikworkflow wordt verpakt.
- We moeten neigen naar actie wanneer een skill duidelijk is geoptimaliseerd voor omzeiling, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn gronden om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende skills verbergen, verwijderen of definitief verwijderen.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en herhaaldelijke of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
