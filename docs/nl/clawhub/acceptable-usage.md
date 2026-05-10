---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een Skill moet worden verborgen of een gebruiker moet worden geblokkeerd
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-10T19:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

Deze pagina beschrijft welke soorten skills en inhoud ClawHub toestaat, en welke misbruikworkflows het niet host.

Deze regels zijn bewust praktisch. We geven vooral om end-to-end misbruikworkflows, niet alleen om geïsoleerde trefwoorden. Als een skill is gebouwd om verdedigingsmaatregelen te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of gedrag zonder toestemming mogelijk te maken, hoort deze niet thuis op ClawHub.

## Recente patronen die we expliciet toestaan

- Frontend- en design-systemwerk dat echte componenten, semantische tokens, toegankelijke states en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5 JavaScript-naar-TypeScript-conversie die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces beoordeelbaar houdt.
- Defensieve securityreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Workflowautomatisering op basis van toestemming voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante configuratie en dry-run- of previewmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor securitybypass of ongeautoriseerde toegang.
  - Voorbeelden: auth-bypass, accountovername, CAPTCHA-bypass, omzeiling van Cloudflare of anti-botmaatregelen, rate-limit-bypass, stealth scraping ontworpen om beveiligingen te omzeilen, overname van live calls of agents, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en ban-ontwijking.
  - Voorbeelden: stealthaccounts na bans, account warming/farming, nepengagement, karma- of volgeropbouw, multi-accountautomatisering, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, scams en misleidende financiële workflows.
  - Voorbeelden: nep-certificaten, nepfacturen, misleidende betaalflows, scam-outreach, nep sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows voor synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching gebruikt zonder duidelijke toestemming, of het kopen, publiceren, downloaden of operationeel maken van gelekte data of breach dumps.

- Niet-consensuele imitatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en adult generation met uitgeschakelde veiligheidsmaatregelen.
  - Voorbeelden: NSFW-afbeelding/video/contentgeneratie, adult-contentwrappers rond API's van derden, of skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: versluierde installatiecommando's, `curl | sh`, niet-aangegeven secretvereisten, niet-aangegeven gebruik van private keys, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, misleidende metadata die verbergt wat de skill echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet toestaan

- “Maak stealthverkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-koppeling aan zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Bouw Reddit/Twitter-accounts op met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach dumps.”
- “Maak in bulk e-mail- of sociale accounts aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een beperkte defensieve of consent-based setting en onaanvaardbaar wanneer het is verpakt als een misbruikworkflow.
- We moeten neigen naar actie wanneer een skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of gebruik zonder toestemming.
- Herhaalde uploads in deze categorieën zijn grond voor het verbergen van content en het bannen van het account.

## Handhaving

- We kunnen overtredende skills verbergen, verwijderen of hard-delete uitvoeren.
- We kunnen tokens intrekken, gekoppelde content soft-delete uitvoeren en recidivisten of ernstige overtreders bannen.
- We garanderen geen waarschuwing vooraf bij duidelijk misbruik.
