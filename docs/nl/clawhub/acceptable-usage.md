---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een Skill moet worden verborgen of een gebruiker moet worden verbannen
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-12T12:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel Gebruik

Deze pagina beschrijft welke soorten Skills en content ClawHub toestaat, en welke misbruikworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We geven het meeste om volledige misbruikworkflows, niet alleen om geïsoleerde trefwoorden. Als een Skill is gebouwd om verdediging te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet toestaan

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces beoordeelbaar houdt.
- Defensieve securityreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete referenties, transparante configuratie en dry-run- of previewmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-bot-omzeiling, rate-limit-omzeiling, stealth-scraping die is ontworpen om beveiligingen te verslaan, overname van livegesprekken of agents, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en ban-ontwijking.
  - Voorbeelden: stealth-accounts na bans, account warming/farming, nepbetrokkenheid, karma- of volgersopbouw, multi-accountautomatisering, massaal posten, spambots, marketplace- of sociale automatisering die is gebouwd om detectie te vermijden.

- Fraude, scams en misleidende financiële workflows.
  - Voorbeelden: valse certificaten, valse facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacyschendende scraping, verrijking of surveillance.
  - Voorbeelden: op schaal contactgegevens scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte gegevens of breach-dumps kopen, publiceren, downloaden of operationaliseren.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en adult-generatie met uitgeschakelde veiligheid.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video's/content, adult-contentwrappers rond API's van derden, of Skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verdoezelde installatiecommando's, `curl | sh`, niet-vermelde geheime vereisten, niet-vermeld gebruik van privésleutels, remote `npx @latest`-uitvoering zonder duidelijke beoordeelbaarheid, misleidende metadata die verbergen wat de Skill echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet toestaan

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Bouw Reddit/Twitter-accounts op met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met veiligheidscontroles uitgeschakeld.”
- “Scrape leads, verrijk contacten en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte gegevens of breach-dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een beperkte defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruikworkflow wordt verpakt.
- We moeten neigen naar actie wanneer een Skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn reden om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende Skills verbergen, verwijderen of hard-delete uitvoeren.
- We kunnen tokens intrekken, gekoppelde content soft-delete uitvoeren en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
