---
read_when:
    - Een Skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, verbanningen of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkades, verborgen vermeldingen, verbanningen en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-03T01:00:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare vindbaarheid en installatiesurfaces hebben nog steeds vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountacties helpen gebruikers beschermen wanneer een release of account onveilig, misleidend of in strijd met het beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Zie voor auditlabels zoals `Pass`, `Review`, `Warn`, `Malicious` en risiconiveau [Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en [Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over inhoudsrechten [Verzoeken over inhoudsrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen Skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-inhoud, zoals:

- kwaadaardige vermeldingen
- misleidende metadata
- niet-vermelde inloggegevens of toestemmingsvereisten
- verdachte installatie-instructies
- impersonatie
- registraties te kwader trouw of merkmisbruik
- inhoud die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een Skill-pagina, of de meldingsopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een Skill of plugin van derden. Meld die rechtstreeks bij de uitgever of bronrepository die vanuit de vermelding is gekoppeld. ClawHub onderhoudt of patcht geen code van Skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth, scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-advisories niet voor kwetsbaarheden in Skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van melden kan zelf leiden tot accountactie.

## Claims op organisaties en namespaces

Geschillen over eigendom van organisaties, merken, package-scopes, eigenaar-handles of namespaces moeten het proces [Claims op organisaties en namespaces](/clawhub/namespace-claims) gebruiken, niet de meldingsflow in het product of het bezwaarformulier voor accounts.

Gebruik dat proces wanneer ClawHub-medewerkers niet-gevoelig bewijs moeten beoordelen dat een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast of anderszins beoordeeld. Neem geen geheimen, privédocumenten, privéjuridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidskwesties kunnen een uitgever of vermelding onder een moderatieblokkade plaatsen. Wanneer dit gebeurt, kan getroffen inhoud worden verborgen voor openbare vindbaarheid of kunnen toekomstige publicaties verborgen beginnen totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle gevallen oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op openbare installatiesurfaces.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar het probleem oplost of moderatie deze herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze diagnostiek helpt uit te leggen wat er is gebeurd en wat moet veranderen voordat de vermelding kan terugkeren naar openbare surfaces.

## Bans en accountstatus

Accounts die ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen inhoud of verwijderde vermeldingen. Druksignalen voor misbruik door uitgevers worden dagelijks gecontroleerd. Signalen die de drempel van ClawHub voor een mogelijke ban bereiken, kunnen een automatische waarschuwing activeren. Als de volgende in aanmerking komende scan na de waarschuwingsdeadline de uitgever nog steeds binnen de drempel voor een mogelijke ban plaatst, kan ClawHub de accountactie automatisch toepassen. Signalen met lagere zekerheid en begrensde tijdelijke review-signalen blijven buiten automatische handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie begint te falen na accountactie, log dan in op de web-UI om de accountstatus te bekijken. Als inloggen of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account, gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een Skill- of pluginversie als kwaadaardig noemt, download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie: `clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Controleer de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd versluierde installatieopdrachten
- koppel waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
