---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor reviewers schrijven
    - Beslissen of een vaardigheid verborgen moet worden of een gebruiker geblokkeerd
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
x-i18n:
    generated_at: "2026-05-12T08:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

Deze pagina beschrijft welke soorten vaardigheden en content ClawHub toestaat, en welke misbruikworkflows het niet zal hosten.

Deze regels zijn bewust praktisch. We hechten het meeste belang aan misbruikworkflows van begin tot eind, niet alleen aan geïsoleerde trefwoorden. Als een vaardigheid is gebouwd om verdedigingen te omzeilen, platforms te misbruiken, mensen op te lichten, privacy te schenden of niet-consensueel gedrag mogelijk te maken, hoort deze niet thuis op ClawHub.

## Recente patronen die we expliciet toestaan

- Frontend- en designsysteemwerk dat echte componenten, semantische tokens, toegankelijke states en geteste gebruikersstromen gebruikt.
- shadcn/ui-compositie die geïnstalleerde broncomponenten, projectaliassen en gedocumenteerde varianten gebruikt in plaats van eenmalige markup.
- UI5-conversie van JavaScript naar TypeScript die opmerkingen behoudt, concrete UI5-types gebruikt en gegenereerde control-interfaces controleerbaar houdt.
- Defensieve securityreview, moderatietooling en prompts voor misbruikdetectie die bewijs tonen en grenzen voor menselijke goedkeuring duidelijk houden.
- Workflowautomatisering op basis van toestemming voor persoonlijke accounts of teamaccounts met expliciete referenties, transparante installatie en dry-run- of previewmodi.
- Documentatie, migratiedraaiboeken, ontwikkelaarshulpmiddelen en testfixtures die zijn afgebakend tot de software die ze ondersteunen.

## Niet toegestaan

- Workflows voor securityomzeiling of onbevoegde toegang.
  - Voorbeelden: auth-omzeiling, accountovername, CAPTCHA-omzeiling, Cloudflare- of anti-botomzeiling, omzeiling van rate limits, stealth-scraping ontworpen om beschermingen te verslaan, overname van live calls of agents, herbruikbare sessiediefstal, automatisch goedkeuren van koppelingsstromen voor niet-goedgekeurde gebruikers.

- Platformmisbruik en omzeiling van bans.
  - Voorbeelden: stealth-accounts na bans, account warming/farming, nepengagement, het kweken van karma of volgers, multi-accountautomatisering, massaal posten, spambots, marketplace- of social-automatisering gebouwd om detectie te vermijden.

- Fraude, oplichting en misleidende financiële workflows.
  - Voorbeelden: nepcertificaten, nepfacturen, misleidende betaalstromen, scam-outreach, nep-sociaal bewijs, tools die uitgaven of kosten mogelijk maken zonder duidelijke menselijke goedkeuring en transparante controles, of workflows met synthetische identiteiten die zijn gebouwd om accounts voor fraude te maken.

- Privacy-invasieve scraping, verrijking of surveillance.
  - Voorbeelden: contactgegevens op schaal scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, gezichtszoekopdrachten of biometrische matching zonder duidelijke toestemming, of het kopen, publiceren, downloaden of operationaliseren van gelekte gegevens of breach dumps.

- Niet-consensuele impersonatie of misleidende identiteitsmanipulatie.
  - Voorbeelden: face swap, digitale tweelingen, neppersona's, gekloonde influencers of andere tooling voor identiteitsmanipulatie die wordt gebruikt om iemand te imiteren of te misleiden.

- Expliciete seksuele content en adult-generatie met uitgeschakelde beveiliging.
  - Voorbeelden: generatie van NSFW-afbeeldingen/video's/content, adult-contentwrappers rond API's van derden, of vaardigheden waarvan het primaire doel expliciete seksuele content is.

- Verborgen, onveilige of misleidende uitvoeringsvereisten.
  - Voorbeelden: versluierde installatiecommando's, `curl | sh`, niet-vermelde geheimvereisten, niet-vermeld gebruik van private keys, externe `npx @latest`-uitvoering zonder duidelijke controleerbaarheid, misleidende metadata die verbergen wat de vaardigheid echt nodig heeft om te draaien.

## Recente patronen die we expliciet niet toestaan

- “Maak stealth-verkopersaccounts aan na marketplace-bans.”
- “Wijzig Telegram-koppeling zodat niet-goedgekeurde gebruikers automatisch koppelingscodes ontvangen.”
- “Kweek Reddit/Twitter-accounts met niet-detecteerbare automatisering.”
- “Genereer professionele certificaten of facturen voor willekeurig gebruik.”
- “Genereer NSFW-content met uitgeschakelde veiligheidscontroles.”
- “Scrape leads, verrijk contactpersonen en start cold outreach op schaal.”
- “Koop, publiceer of download gelekte gegevens of breach dumps.”
- “Maak in bulk e-mail- of social accounts aan met synthetische identiteiten of CAPTCHA-oplossing.”

## Opmerkingen voor reviewers

- Context doet ertoe. Hetzelfde onderwerp kan legitiem zijn in een nauw defensieve of consent-based setting en onaanvaardbaar wanneer het als misbruikworkflow wordt verpakt.
- We moeten neigen naar actie wanneer een vaardigheid duidelijk is geoptimaliseerd voor omzeiling, misleiding of niet-consensueel gebruik.
- Herhaalde uploads in deze categorieën zijn redenen om content te verbergen en het account te bannen.

## Handhaving

- We kunnen overtredende vaardigheden verbergen, verwijderen of definitief verwijderen.
- We kunnen tokens intrekken, bijbehorende content soft-deleten en herhaalde of ernstige overtreders bannen.
- We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik.
