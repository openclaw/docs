---
read_when:
    - Een Skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, blokkeringen of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub-meldingen, moderatieblokkades, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-03T13:38:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare ontdekking en installatieoppervlakken hebben nog steeds
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

Ingelogde gebruikers kunnen skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-content, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-gemelde vereiste inloggegevens of machtigingen
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina, of de meldingsopdracht/API
voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een
skill of plugin van derden. Meld die rechtstreeks bij de uitgever of de bronrepository
die vanuit de vermelding is gelinkt. ClawHub onderhoudt of patcht geen code van
skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth,
scanning, moderatie of vertrouwensgrenzen rond downloaden/installeren. Gebruik ClawHub
advisories niet voor kwetsbaarheden in skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf leiden tot
accountmaatregelen.

## Claims voor organisaties en namespaces

Geschillen over eigendom van organisaties, merken, package-scopes, owner-handles of namespaces moeten
het proces [Claims voor organisaties en namespaces](/clawhub/namespace-claims) gebruiken, niet de
meldingsflow in het product of het bezwaarformulier voor accounts.

Gebruik dat proces wanneer je wilt dat ClawHub-medewerkers niet-gevoelig bewijs beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, private juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS challenge-tokens op in een
openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidskwesties kunnen een uitgever of vermelding onder een
moderatieblokkade plaatsen. Wanneer dit gebeurt, kan betrokken content worden verborgen voor openbare
ontdekking of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle
gevallen oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief is bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op
openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar
het probleem oplost of moderatie deze herstelt.

Eigenaren kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze
diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de
vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden kunnen publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountbans, intrekking van tokens, verborgen content of verwijderde vermeldingen.
Druksignalen voor uitgeversmisbruik worden dagelijks gecontroleerd. Signalen die
ClawHub's drempel voor mogelijke bans bereiken kunnen een automatische waarschuwing activeren. Als de volgende
in aanmerking komende scan na de waarschuwingstermijn de uitgever nog steeds in de
drempel voor mogelijke bans plaatst, kan ClawHub de accountmaatregel automatisch toepassen.
Signalen met lagere betrouwbaarheid en begrensde temporele reviewsignalen blijven buiten automatische
handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie
begint te falen na een accountmaatregel, meld je dan aan bij de web-UI om de accountstatus te bekijken.
Als aanmelden of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account,
gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner getriggerde e-mail een skill- of pluginversie als schadelijk noemt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins
`--kind plugin` toe. Bekijk de scanuitvoer, herstel de vermelding, verhoog het versienummer
en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en machtigingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
