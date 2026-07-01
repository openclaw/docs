---
read_when:
    - Een Skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Moderatie, verbanningen of accountstatus in ClawHub begrijpen
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkades, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-01T08:15:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare vindbaarheid en installatiesurfaces hebben nog steeds vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountacties helpen gebruikers beschermen wanneer een release of account onveilig, misleidend of in strijd met beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Voor auditlabels zoals `Pass`, `Review`, `Warn`, `Malicious` en risiconiveau, zie [Security Audits](/clawhub/security-audits).

Zie ook [Security](/clawhub/security) en [Acceptable usage](/clawhub/acceptable-usage). Gebruik voor zorgen over auteursrecht of andere inhoudsrechten [Content Rights Requests](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-inhoud, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-gemelde referenties of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptable usage](/clawhub/acceptable-usage) schendt

Gebruik de knop **Report skill** op een skillpagina, of de meldingsopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een skill of plugin van derden. Meld die rechtstreeks aan de uitgever of bronrepository die vanuit de vermelding is gelinkt. ClawHub onderhoudt of patcht geen code van skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth, scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-advisories niet voor kwetsbaarheden in skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van melden kan zelf leiden tot accountactie.

## Organisatie- en namespaceclaims

Geschillen over eigendom van organisaties, merken, package-scopes, owner-handles of namespaces moeten het proces [Org and Namespace Claims](/clawhub/namespace-claims) gebruiken, niet de meldingsflow in het product of het accountbezwaarformulier.

Gebruik dat proces wanneer ClawHub-medewerkers niet-gevoelig bewijs moeten beoordelen dat een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challenge-tokens op in een openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een moderatieblokkade plaatsen. Wanneer dit gebeurt, kan betrokken inhoud worden verborgen voor openbare vindbaarheid, of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle gevallen oplost. Ze kunnen ook worden opgeheven wanneer een fout-positieve bevinding wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan zijn vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op openbare installatiesurfaces.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar het probleem oplost of moderatie de vermelding herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de vermelding kan terugkeren naar openbare surfaces.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, intrekking van tokens, verborgen inhoud of verwijderde vermeldingen. Signalen voor misbruikdruk door uitgevers worden dagelijks gecontroleerd. Signalen die de potentiële-ban-drempel van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende in aanmerking komende scan na de waarschuwingstermijn de uitgever nog steeds binnen de potentiële-ban-drempel plaatst, kan ClawHub de accountactie automatisch toepassen. Signalen met lagere betrouwbaarheid en begrensde tijdelijke beoordelingssignalen blijven buiten automatische handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie na een accountactie begint te mislukken, meld je dan aan bij de web-UI om de accountstatus te controleren. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account, gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een skill- of pluginversie als schadelijk noemt, download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Bekijk de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieve bevindingen te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd verhulde installatieopdrachten
- link naar de broncode waar mogelijk
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen naar releasegedrag
