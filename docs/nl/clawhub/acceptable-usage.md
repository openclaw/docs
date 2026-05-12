---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een vaardigheid moet worden verborgen of een gebruiker moet worden geblokkeerd
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
x-i18n:
    generated_at: "2026-05-12T15:42:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

Deze pagina beschrijft welke soorten Skills en inhoud ClawHub accepteert, en welke misbruikworkflows het niet host.

Deze regels zijn bewust praktisch. We geven het meest om end-to-end misbruikworkflows, niet alleen om geïsoleerde trefwoorden. Als een Skill is gebouwd om verdedigingen te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet accepteren

- Frontend- en design-systemwerk dat echte componenten, semantische tokens, toegankelijke states en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces controleerbaar houdt.
- Defensieve security review, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete credentials, transparante configuratie en dry-run- of previewmodi.
- Documentatie, migratierunbooks, ontwikkelaarstools en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor het omzeilen van beveiliging of ongeautoriseerde toegang.
  - Voorbeelden: auth-bypass, accountovername, CAPTCHA-bypass, Cloudflare- of anti-bot-omzeiling, rate-limit-bypass, stealth-scraping ontworpen om beveiligingen te verslaan, overname van live calls of agents, herbruikbare sessiediefstal, pairingflows automatisch goedkeuren voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accounts opwarmen/farmen, nepbetrokkenheid, karma- of volgeropbouw, automatisering met meerdere accounts, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, scams en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, scamoutreach, nep-social proof, tools die uitgaven of afschrijvingen mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows voor synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele imitatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.

- Expliciete seksuele inhoud en adult-generatie met uitgeschakelde veiligheidsfuncties.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video's/inhoud, adult-content-wrappers rond API's van derden, of Skills waarvan het primaire doel expliciete seksuele inhoud is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando's, `curl | sh`, niet-gedeclareerde secretvereisten, niet-gedeclareerd gebruik van private keys, externe uitvoering van `npx @latest` zonder duidelijke controleerbaarheid, misleidende metadata die verbergt wat de Skill werkelijk nodig heeft om te draaien.

## Recente patronen die we expliciet niet accepteren

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-pairing aan zodat niet-goedgekeurde gebruikers automatisch pairingcodes ontvangen.”
- “Bouw Reddit/Twitter-accounts op met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-inhoud met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach dumps.”
- “Maak in bulk e-mail- of sociale accounts aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een nauw defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het is verpakt als een misbruikworkflow.
- We moeten neigen naar actie wanneer een Skill duidelijk is geoptimaliseerd voor ontduiking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn grond om inhoud te verbergen en het account te bannen.

## Handhaving

- We kunnen Skills die de regels schenden verbergen, verwijderen of definitief verwijderen.
- We kunnen tokens intrekken, gekoppelde inhoud soft-deleten en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
