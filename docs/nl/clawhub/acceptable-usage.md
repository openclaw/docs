---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor beoordelaars schrijven
    - Bepalen of een skill moet worden verborgen of een gebruiker moet worden geblokkeerd
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
x-i18n:
    generated_at: "2026-05-12T23:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

Deze pagina beschrijft de soorten Skills en content waar ClawHub akkoord mee is, en de misbruiksworkflows die het niet zal hosten.

Deze regels zijn bewust praktisch. We geven het meeste om end-to-end misbruiksworkflows, niet alleen om geïsoleerde trefwoorden. Als een skill is gebouwd om verdediging te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen waar we expliciet akkoord mee zijn

- Frontend- en design-systemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5 JavaScript-naar-TypeScript-conversie die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces controleerbaar houdt.
- Defensieve beveiligingsreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante configuratie en dry-run- of voorbeeldmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet akkoord

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-bot-ontwijking, rate-limit-omzeiling, stealth-scraping ontworpen om beschermingen te verslaan, overname van live gesprekken of agents, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accounts opwarmen/farmen, nepbetrokkenheid, karma- of volgeropbouw, multi-accountautomatisering, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, scams en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betalingsflows, scam-outreach, nep sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows voor synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: op schaal contactgegevens scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach-dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona’s, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en generatie voor volwassenen met uitgeschakelde veiligheid.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video’s/content, wrappers voor volwassenencontent rond API’s van derden, of skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: versluierde installatiecommando’s, `curl | sh`, niet-aangegeven vereisten voor secrets, niet-aangegeven gebruik van privésleutels, externe uitvoering van `npx @latest` zonder duidelijke controleerbaarheid, misleidende metadata die verbergt wat de skill echt nodig heeft om te draaien.

## Recente patronen waar we expliciet niet akkoord mee zijn

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Kweek Reddit/Twitter-accounts met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en lanceer koude outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach-dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een nauw afgebakende defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruiksworkflow is verpakt.
- We moeten neigen naar actie wanneer een skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn reden om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende skills verbergen, verwijderen of definitief verwijderen.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en herhaaldelijke of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
