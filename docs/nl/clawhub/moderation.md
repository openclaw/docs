---
read_when:
    - Een skill, Plugin of pakket rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - ClawHub-moderatie, bans of accountstatus begrijpen
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatiewachtrijen, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-01T13:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare vindbaarheid en installatieoppervlakken hebben nog steeds
vangrails nodig. Rapportages, moderatieblokkades, verborgen vermeldingen en accountacties
helpen gebruikers beschermen wanneer een release of account onveilig, misleidend of in strijd met
beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Zie voor auditlabels zoals
`Pass`, `Review`, `Warn`, `Malicious` en risiconiveau
[Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en
[Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over
contentrechten [Verzoeken voor contentrechten](/clawhub/content-rights).

## Rapportages

Aangemelde gebruikers kunnen Skills, plugins en pakketten rapporteren.

Gebruik ClawHub-rapportages alleen voor onveilige marketplace-content, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-aangegeven inloggegevens of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill rapporteren** op een Skill-pagina, of de rapportage-
opdracht/API voor pakketten.

Gebruik ClawHub-rapportages niet voor kwetsbaarheden in de eigen broncode van een externe Skill of
Plugin. Meld die rechtstreeks bij de uitgever of bronrepository die vanuit de vermelding is
gelinkt. ClawHub onderhoudt of patcht geen code van externe Skills of plugins.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth,
scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-
advisories niet voor kwetsbaarheden in externe Skills of plugins.

Goede rapportages zijn specifiek en uitvoerbaar. Misbruik van rapporteren kan zelf leiden tot
accountactie.

## Organisatie- en namespaceclaims

Geschillen over eigendom van organisaties, merken, package-scopes, owner-handles of namespaces moeten
het proces [Organisatie- en namespaceclaims](/clawhub/namespace-claims) gebruiken, niet de
rapportageflow in het product of het formulier voor accountberoep.

Gebruik dat proces wanneer ClawHub-medewerkers niet-gevoelig bewijs moeten beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challenge-tokens op in een
openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een
moderatieblokkade plaatsen. Wanneer dit gebeurt, kan betrokken content worden verborgen voor openbare
vindbaarheid of kunnen toekomstige publicaties verborgen beginnen totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle
zaken oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op
openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar
het probleem oplost of moderatie de vermelding herstelt.

Eigenaren kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze
diagnostiek helpt uit te leggen wat er is gebeurd en wat moet veranderen voordat de
vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen.
Druksignalen voor uitgeversmisbruik worden dagelijks gecontroleerd. Signalen die de
potentiële-ban-drempel van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende
geschikte scan na de waarschuwingstermijn de uitgever nog steeds binnen de
potentiële-ban-drempel plaatst, kan ClawHub de accountactie automatisch toepassen.
Signalen met lagere betrouwbaarheid en begrensde temporele beoordelingssignalen blijven buiten automatische
handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth
begint te mislukken na accountactie, meld je dan aan bij de web-UI om de accountstatus te
bekijken. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account,
gebruik dan het [ClawHub-beroepsformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een Skill- of Plugin-versie als schadelijk noemt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins
`--kind plugin` toe. Bekijk de scanoutput, herstel de vermelding, verhoog het versienummer
en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te vergroten:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
