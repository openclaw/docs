---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Bepalen of een Skill moet worden verborgen of een gebruiker moet worden verbannen
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-13T04:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

Deze pagina beschrijft welke soorten Skills en content ClawHub accepteert, en welke misbruikworkflows het niet host.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruikworkflows, niet alleen op losse trefwoorden. Als een Skill is gebouwd om verdedigingsmaatregelen te omzeilen, platformen te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die we expliciet accepteren

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke states en geteste gebruikersflows gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces beoordeelbaar houdt.
- Defensieve securityreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Op toestemming gebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete credentials, transparante installatie en dry-run- of preview-modi.
- Documentatie, migratierunbooks, developer utilities en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor het omzeilen van beveiliging of ongeautoriseerde toegang.
  - Voorbeelden: auth bypass, account takeover, CAPTCHA-bypass, Cloudflare- of anti-botomzeiling, rate-limit-bypass, stealth scraping ontworpen om beveiligingen te verslaan, live call- of agent takeover, herbruikbare sessiediefstal, pairingflows automatisch goedkeuren voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accountwarming/-farming, nepbetrokkenheid, karma- of volgeropbouw, multi-accountautomatisering, massaal posten, spambots, marketplace- of social-automatisering gebouwd om detectie te vermijden.

- Fraude, scams en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalflows, scamoutreach, nep-social proof, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude aan te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach dumps kopen, publiceren, downloaden of operationeel inzetten.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand na te bootsen of te misleiden.

- Expliciete seksuele content en adult generation met uitgeschakelde veiligheidsmaatregelen.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video's/content, adult-contentwrappers rond API's van derden, of Skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando's, `curl | sh`, niet-vermelde secretvereisten, niet-vermeld gebruik van private keys, uitvoering op afstand van `npx @latest` zonder duidelijke beoordeelbaarheid, misleidende metadata die verbergt wat de Skill echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet accepteren

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Pas Telegram-pairing aan zodat niet-goedgekeurde gebruikers automatisch pairingcodes ontvangen.”
- “Bouw Reddit-/Twitter-accounts op met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach dumps.”
- “Maak e-mail- of social accounts in bulk aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een nauw defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als misbruikworkflow wordt verpakt.
- We moeten neigen naar actie wanneer een Skill duidelijk is geoptimaliseerd voor omzeiling, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn grond voor het verbergen van content en het bannen van het account.

## Handhaving

- We kunnen overtredende Skills verbergen, verwijderen of hard-deleten.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
