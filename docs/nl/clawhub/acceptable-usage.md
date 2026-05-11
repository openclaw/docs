---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een Skill verborgen moet worden of een gebruiker moet worden verbannen
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-11T20:22:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

Deze pagina beschrijft welke soorten Skills en content ClawHub accepteert, en welke misbruikworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruikworkflows, niet alleen op losse trefwoorden. Als een Skill is gebouwd om verdedigingen te omzeilen, platformen te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet accepteren

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke states en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geinstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde controlinterfaces beoordeelbaar houdt.
- Defensieve securityreviews, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete credentials, transparante setup en dry-run- of voorbeeldmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor security-omzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-bot-ontwijking, omzeiling van rate limits, stealth scraping ontworpen om beveiligingen te verslaan, overname van livegesprekken of agents, herbruikbare sessiediefstal, automatisch goedkeuren van pairingflows voor niet-goedgekeurde gebruikers.

- Platformmisbruik en ban-ontwijking.
  - Voorbeelden: stealthaccounts na bans, accountopwarming/-farming, nepbetrokkenheid, kweken van karma of volgers, multi-accountautomatisering, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiele workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, scam-outreach, nep sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: op schaal contactgegevens scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach dumps kopen, publiceren, downloaden of operationeel inzetten.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te impersoneren of te misleiden.

- Expliciete seksuele content en volwassenengeneratie met uitgeschakelde veiligheidsmaatregelen.
  - Voorbeelden: NSFW-afbeeldings-/video-/contentgeneratie, wrappers voor volwassencontent rond API's van derden, of Skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando's, `curl | sh`, niet-vermelde secretvereisten, niet-vermeld gebruik van privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, misleidende metadata die verbergt wat de Skill echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet accepteren

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Wijzig Telegram-pairing zodat niet-goedgekeurde gebruikers automatisch pairingcodes ontvangen.”
- “Kweek Reddit-/Twitter-accounts met ondetecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start koude outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach dumps.”
- “Maak e-mail- of sociale accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een smalle defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het is verpakt als een misbruikworkflow.
- We moeten neigen naar actie wanneer een Skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieen zijn reden om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende Skills verbergen, verwijderen of hard-deleten.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
