---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Beslissen of een Skill moet worden verborgen of een gebruiker moet worden geblokkeerd
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
x-i18n:
    generated_at: "2026-05-12T04:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel Gebruik

Deze pagina beschrijft welke soorten Skills en content acceptabel zijn voor ClawHub, en welke misbruikworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We letten vooral op end-to-end misbruikworkflows, niet alleen op geïsoleerde trefwoorden. Als een Skill is gebouwd om verdedigingsmaatregelen te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort die niet thuis op ClawHub.

## Recente patronen die expliciet acceptabel zijn

- Frontend- en design-systemwerk dat echte componenten, semantische tokens, toegankelijke toestanden en geteste gebruikersstromen gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-typen gebruikt en gegenereerde control-interfaces controleerbaar houdt.
- Defensieve beveiligingsreview, moderatietools en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring helder houden.
- Toestemmingsgebaseerde workflowautomatisering voor persoonlijke of teamaccounts met expliciete inloggegevens, transparante installatie en dry-run- of previewmodi.
- Documentatie, migratierunbooks, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet acceptabel

- Workflows voor beveiligingsomzeiling of ongeautoriseerde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, omzeiling van Cloudflare of anti-botmaatregelen, omzeiling van snelheidslimieten, stealth-scraping ontworpen om beschermingen te verslaan, overname van live calls of agents, herbruikbare sessiediefstal, pairing-flows automatisch goedkeuren voor niet-goedgekeurde gebruikers.

- Platformmisbruik en banontwijking.
  - Voorbeelden: stealth-accounts na bans, accounts opwarmen/farmen, nepbetrokkenheid, karma- of volgeropbouw, automatisering met meerdere accounts, massaal posten, spambots, marketplace- of sociale automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: valse certificaten, valse facturen, misleidende betalingsstromen, scam-outreach, vals sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows voor synthetische identiteiten gebouwd om accounts voor fraude aan te maken.

- Privacy-schendende scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of gelekte data of breach-dumps kopen, publiceren, downloaden of operationeel inzetten.

- Niet-consensuele imitatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digital twins, neppersona’s, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en adult-generatie met uitgeschakelde veiligheidsmaatregelen.
  - Voorbeelden: NSFW-generatie van afbeeldingen/video’s/content, adult-contentwrappers rond API’s van derden, of Skills waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: verhulde installatiecommando’s, `curl | sh`, niet-gedeclareerde vereisten voor geheimen, niet-gedeclareerd gebruik van privésleutels, externe uitvoering van `npx @latest` zonder duidelijke controleerbaarheid, misleidende metadata die verbergt wat de Skill echt nodig heeft om te draaien.

## Recente patronen die expliciet niet acceptabel zijn

- “Maak stealth-selleraccounts aan na marketplace-bans.”
- “Wijzig Telegram-pairing zodat niet-goedgekeurde gebruikers automatisch pairingcodes ontvangen.”
- “Bouw Reddit-/Twitter-accounts op met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contacten en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte data of breach-dumps.”
- “Maak in bulk e-mail- of sociale accounts aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context is belangrijk. Hetzelfde onderwerp kan legitiem zijn in een beperkte defensieve of toestemmingsgebaseerde setting en onacceptabel wanneer het als misbruikworkflow wordt verpakt.
- We moeten eerder tot actie overgaan wanneer een Skill duidelijk is geoptimaliseerd voor ontwijking, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn grond voor het verbergen van content en het bannen van het account.

## Handhaving

- We kunnen overtredende Skills verbergen, verwijderen of permanent verwijderen.
- We kunnen tokens intrekken, gekoppelde content soft-deleten en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
