---
read_when:
    - Een Skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, bans of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkeringen, verborgen vermeldingen, verbanningen en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-04T03:54:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publiceren, maar openbare ontdekking en installatie-oppervlakken hebben nog steeds
vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountacties
helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of buiten
beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Voor auditlabels zoals
`Pass`, `Review`, `Warn`, `Malicious` en risiconiveau, zie
[Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en
[Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over
contentrechten [Verzoeken rond contentrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-content, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-aangegeven referenties of machtigingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina, of de meldopdracht/API
voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een
skill of plugin van derden. Meld die rechtstreeks aan de uitgever of de bronrepository
die vanuit de vermelding is gelinkt. ClawHub onderhoudt of patcht geen
skill- of plugincode van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth,
scans, moderatie of vertrouwensgrenzen voor downloads/installaties. Gebruik ClawHub
advisories niet voor kwetsbaarheden in skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf leiden tot
accountactie.

## Org- en namespaceclaims

Geschillen over eigendom van organisaties, merken, package-scopes, owner-handles of namespaces moeten
het proces [Org- en namespaceclaims](/clawhub/namespace-claims) gebruiken, niet de
in-product meldingsflow of het bezwaarformulier voor accounts.

Gebruik dat proces wanneer ClawHub-medewerkers niet-gevoelig bewijs moeten beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een
openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een
moderatieblokkade plaatsen. Wanneer dit gebeurt, kan betrokken content worden verborgen voor openbare
ontdekking of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle
gevallen oplost. Ze kunnen ook worden opgeheven wanneer een vals-positief is bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op
openbare installatie-oppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar
het probleem oplost of moderatie de release herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze
diagnostiek helpt uit te leggen wat er is gebeurd en wat moet veranderen voordat de
vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen.
Druksignalen voor uitgeversmisbruik worden dagelijks gecontroleerd. Signalen die de
potentiële-ban-drempel van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende
geschikte scan na de waarschuwingsdeadline de uitgever nog steeds in de
potentiële-ban-drempel plaatst, kan ClawHub de accountactie automatisch toepassen.
Signalen met lagere betrouwbaarheid en begrensde temporele beoordeling blijven buiten automatische
handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth
begint te falen na een accountactie, meld je dan aan bij de web-UI om de accountstatus
te controleren. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account,
gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een skill- of pluginversie als schadelijk noemt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins
`--kind plugin` toe. Bekijk de scanuitvoer, herstel de vermelding, verhoog het versienummer
en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om vals-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en machtigingen
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar broncode
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
