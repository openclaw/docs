---
read_when:
    - Een skill, plugin of package rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, bans of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatiewachtstanden, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-04T10:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare vindbaarheid en installatieoppervlakken hebben nog steeds vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountacties helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of in strijd met beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Zie voor auditlabels zoals `Pass`, `Review`, `Warn`, `Malicious` en risiconiveau [Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en [Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over inhoudsrechten [Verzoeken over inhoudsrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen Skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-inhoud, zoals:

- kwaadaardige vermeldingen
- misleidende metadata
- niet-vermelde vereisten voor inloggegevens of machtigingen
- verdachte installatie-instructies
- impersonatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill rapporteren** op een Skill-pagina, of de meldingsopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een Skill of plugin van een derde partij. Meld die rechtstreeks aan de uitgever of de bronrepository die vanuit de vermelding is gekoppeld. ClawHub onderhoudt of patcht geen code van Skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth, scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-advisories niet voor kwetsbaarheden in Skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf tot accountactie leiden.

## Org- en namespaceclaims

Geschillen over eigendom van een org, merk, package-scope, owner-handle of namespace moeten het proces [Org- en namespaceclaims](/clawhub/namespace-claims) gebruiken, niet de meldingsstroom in het product of het bezwaarformulier voor accounts.

Gebruik dat proces wanneer je ClawHub-medewerkers niet-gevoelig bewijs wilt laten beoordelen dat een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een openbare issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een moderatieblokkade plaatsen. Wanneer dit gebeurt, kan getroffen inhoud worden verborgen voor openbare vindbaarheid of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle gevallen oplost. Ze kunnen ook worden opgeheven wanneer een vals-positieve bevinding wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar het probleem oplost of moderatie de release herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, intrekking van tokens, verborgen inhoud of verwijderde vermeldingen. Signalen voor misbruikdruk door uitgevers worden dagelijks gecontroleerd. Signalen die de potentiële-ban-drempel van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende geschikte scan na de waarschuwingstermijn de uitgever nog steeds in de potentiële-ban-drempel plaatst, kan ClawHub de accountactie automatisch toepassen. Reviewsignalen met lagere betrouwbaarheid en begrensde temporele signalen blijven buiten automatische handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie na een accountactie begint te mislukken, meld je dan aan bij de web-UI om de accountstatus te bekijken. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account, gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een Skill- of pluginversie als kwaadaardig noemt, download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Review de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om vals-positieve bevindingen te verminderen en het vertrouwen van gebruikers te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en machtigingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
