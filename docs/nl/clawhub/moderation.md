---
read_when:
    - Een skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - ClawHub-moderatie, verbanningen of accountstatus begrijpen
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkeringen, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-06-28T00:11:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare ontdekkings- en installatieoppervlakken hebben nog steeds beschermingsmaatregelen nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountmaatregelen helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of in strijd met beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Zie voor auditlabels zoals `Pass`, `Review`, `Warn`, `Malicious` en risiconiveau [Beveiligingsaudits](/nl/clawhub/security-audits).

Zie ook [Beveiliging](/nl/clawhub/security) en [Acceptabel gebruik](/nl/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over inhoudsrechten [Verzoeken voor inhoudsrechten](/nl/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-inhoud, zoals:

- kwaadaardige vermeldingen
- misleidende metadata
- niet-opgegeven inloggegevens of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina, of de meldopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een externe skill of plugin. Meld die rechtstreeks bij de uitgever of bronrepository die vanuit de vermelding is gekoppeld. ClawHub onderhoudt of patcht geen code van externe skills of plugins.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth, scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-advisories niet voor kwetsbaarheden in externe skills of plugins.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf leiden tot een accountmaatregel.

## Org- en namespaceclaims

Geschillen over eigendom van orgs, merken, package-scopes, owner-handles of namespaces moeten het proces [Org- en namespaceclaims](/nl/clawhub/namespace-claims) gebruiken, niet de meldflow in het product of het formulier voor accountbezwaar.

Gebruik dat proces wanneer ClawHub-medewerkers niet-gevoelig bewijs moeten beoordelen dat een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast of anderszins beoordeeld. Voeg geen geheimen, privédocumenten, private juridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challenge-tokens toe aan een openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidskwesties kunnen ertoe leiden dat een uitgever of vermelding onder een moderatieblokkade wordt geplaatst. Wanneer dit gebeurt, kan getroffen inhoud worden verborgen voor openbare ontdekking of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub gevallen met hoog risico oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar het probleem oplost of moderatie deze herstelt.

Eigenaren kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen inhoud of verwijderde vermeldingen. Druksignalen voor uitgeversmisbruik worden dagelijks gecontroleerd. Signalen die de drempel voor een mogelijke ban van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de eerstvolgende geschikte scan na de waarschuwingsdeadline de uitgever nog steeds binnen de drempel voor een mogelijke ban plaatst, kan ClawHub de accountmaatregel automatisch toepassen. Beoordelingssignalen met lagere betrouwbaarheid en begrensde tijdelijke signalen blijven buiten automatische handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie begint te mislukken na een accountmaatregel, meld je dan aan bij de web-UI om de accountstatus te bekijken. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account, gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een skill- of pluginversie als kwaadaardig noemt, download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie: `clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Bekijk de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
