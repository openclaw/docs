---
read_when:
    - Een skill, plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, verbanningen of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkeringen, verborgen vermeldingen, verbanningen en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-03T02:50:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare ontdek- en installatieoppervlakken hebben nog steeds
vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountmaatregelen
helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of buiten
het beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Voor auditlabels zoals
`Pass`, `Review`, `Warn`, `Malicious` en risiconiveau, zie
[Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en
[Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over
contentrechten [Verzoeken over contentrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen Skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-content, zoals:

- kwaadaardige vermeldingen
- misleidende metadata
- niet-gedeclareerde inloggegevens of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina, of de meldingsopdracht/API
voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een
Skill of Plugin van derden. Meld die rechtstreeks bij de uitgever of de bronrepository
die vanuit de vermelding is gelinkt. ClawHub onderhoudt of patcht geen code van
Skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth,
scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub
advisories niet voor kwetsbaarheden in Skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf leiden tot
accountmaatregelen.

## Org- en namespaceclaims

Geschillen over eigendom van orgs, merken, package-scopes, eigenaar-handles of namespaces moeten
het proces [Org- en namespaceclaims](/clawhub/namespace-claims) gebruiken, niet de
in-product meldingsflow of het accountbezwaarformulier.

Gebruik dat proces wanneer je ClawHub-medewerkers nodig hebt om niet-gevoelig bewijs te beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een
openbare issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidskwesties kunnen een uitgever of vermelding onder een
moderatieblokkade plaatsen. Wanneer dit gebeurt, kan betrokken content verborgen worden voor openbare
ontdekking of kunnen toekomstige publicaties verborgen starten totdat de kwestie is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle
gevallen oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op
openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar
het probleem oplost of moderatie deze herstelt.

Eigenaars kunnen nog steeds diagnoses zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze
diagnoses helpen uitleggen wat er is gebeurd en wat er moet veranderen voordat de
vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen.
Signalen voor druk door misbruik van uitgevers worden dagelijks gecontroleerd. Signalen die
ClawHub's potentiële-ban-drempel bereiken, kunnen een automatische waarschuwing activeren. Als de volgende
geschikte scan na de waarschuwingstermijn de uitgever nog steeds in de
potentiële-ban-drempel plaatst, kan ClawHub de accountmaatregel automatisch toepassen.
Reviewsignalen met lagere betrouwbaarheid en begrensde tijdsduur blijven buiten automatische
handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth
begint te falen na een accountmaatregel, meld je dan aan bij de web-UI om de accountstatus
te bekijken. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account,
gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een Skill- of Plugin-versie als kwaadaardig noemt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins
`--kind plugin` toe. Bekijk de scanuitvoer, repareer de vermelding, verhoog het versienummer
en upload de gerepareerde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
