---
read_when:
    - Een Skill, Plugin of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, verbanningen of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe ClawHub meldingen, moderatieblokkades, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-01T15:27:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publiceren, maar openbare ontdekking en installatieoppervlakken hebben nog steeds vangrails nodig. Meldingen, moderatieblokkades, verborgen vermeldingen en accountacties helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of in strijd met beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Voor auditlabels zoals `Pass`, `Review`, `Warn`, `Malicious` en risiconiveau, zie [Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en [Aanvaardbaar gebruik](/clawhub/acceptable-usage). Gebruik voor auteursrechtelijke of andere zorgen over contentrechten [Verzoeken over contentrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen Skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-content, zoals:

- kwaadaardige vermeldingen
- misleidende metadata
- niet-aangegeven referenties of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Aanvaardbaar gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina, of de pakketmeldingsopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een externe skill of plugin. Meld die rechtstreeks aan de uitgever of de bronrepository die vanuit de vermelding is gelinkt. ClawHub onderhoudt of patcht geen code van externe skills of plugins.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth, scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-advisories niet voor kwetsbaarheden in externe skills of plugins.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf tot accountactie leiden.

## Claims op organisaties en namespaces

Geschillen over eigendom van organisaties, merken, pakketscopes, eigenaar-handles of namespaces moeten het proces [Claims op organisaties en namespaces](/clawhub/namespace-claims) gebruiken, niet de meldingsflow in het product of het accountbezwaarformulier.

Gebruik dat proces wanneer je ClawHub-medewerkers niet-gevoelig bewijs wilt laten beoordelen dat een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast of anderszins beoordeeld. Neem geen geheimen, privédocumenten, vertrouwelijke juridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een openbaar issue.

## Moderatieblokkades

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een moderatieblokkade plaatsen. Wanneer dit gebeurt, kan getroffen content worden verborgen voor openbare ontdekking of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkades zijn bedoeld om gebruikers te beschermen terwijl ClawHub gevallen met hoog risico oplost. Ze kunnen ook worden opgeheven wanneer een false positive wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar het probleem oplost of moderatie deze herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen. Signalen voor misbruikdruk door uitgevers worden dagelijks gecontroleerd. Signalen die de potentiële-ban-drempel van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende in aanmerking komende scan na de waarschuwingsdeadline de uitgever nog steeds binnen de potentiële-ban-drempel plaatst, kan ClawHub de accountactie automatisch toepassen. Signalen met lagere betrouwbaarheid en begrensde tijdelijke beoordelingssignalen blijven buiten automatische handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth begint te falen na accountactie, log dan in op de web-UI om de accountstatus te bekijken. Als inloggen of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account, gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een versie van een skill of plugin als kwaadaardig noemt, download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie: `clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Bekijk de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om false positives te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over releasegedrag
