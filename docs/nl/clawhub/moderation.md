---
read_when:
    - Een skill, plugin of pakket rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - ClawHub-moderatie, verbanningen of accountstatus begrijpen
sidebarTitle: Moderation and Account Safety
summary: Hoe meldingen in ClawHub, moderatieblokkades, verborgen vermeldingen, bans en accountstatus werken.
title: Moderatie en accountveiligheid
x-i18n:
    generated_at: "2026-07-04T20:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare discovery- en installatieoppervlakken hebben nog steeds
vangrails nodig. Meldingen, moderatieblokkeringen, verborgen vermeldingen en accountacties
helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of buiten
beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Voor auditlabels zoals
`Pass`, `Review`, `Warn`, `Malicious` en risiconiveau, zie
[Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en
[Acceptabel gebruik](/clawhub/acceptable-usage). Gebruik voor zorgen over auteursrecht of andere
contentrechten [Verzoeken voor contentrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen Skills, Plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-content, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-vermelde credentials of toestemmingsvereisten
- verdachte installatie-instructies
- imitatie
- registraties te kwader trouw of merkmisbruik
- content die [Acceptabel gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een Skill-pagina, of de rapportage-
opdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een externe Skill of
Plugin. Meld die rechtstreeks aan de uitgever of bronrepository die vanuit de vermelding is gelinkt.
ClawHub onderhoudt of patcht geen code van externe Skills of Plugins.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn bugs in de website, API, CLI, registry, auth,
scanning, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-
advisories niet voor kwetsbaarheden in externe Skills of Plugins.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van meldingen kan zelf leiden tot
accountactie.

## Claims voor organisaties en namespaces

Geschillen over eigendom van organisaties, merken, package-scopes, owner-handles of namespaces moeten
het proces [Claims voor organisaties en namespaces](/clawhub/namespace-claims) gebruiken, niet de
rapportageflow in het product of het formulier voor accountbezwaar.

Gebruik dat proces wanneer je ClawHub-medewerkers nodig hebt om niet-gevoelig bewijs te beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, privé-juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challenge-tokens op in een
openbare issue.

## Moderatieblokkeringen

Sommige ernstige bevindingen of beleidsproblemen kunnen een uitgever of vermelding onder een
moderatieblokkering plaatsen. Wanneer dit gebeurt, kan betrokken content verborgen zijn voor openbare
discovery of kunnen toekomstige publicaties verborgen starten totdat het probleem is beoordeeld.

Moderatieblokkeringen zijn bedoeld om gebruikers te beschermen terwijl ClawHub risicovolle
gevallen oplost. Ze kunnen ook worden opgeheven wanneer een fout-positief wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn op
openbare installatieoppervlakken.

Als je een van deze statussen ziet, installeer de release dan niet tenzij de eigenaar
het probleem oplost of moderatie deze herstelt.

Eigenaars kunnen nog steeds diagnostiek zien voor hun eigen vastgehouden of verborgen vermeldingen. Deze
diagnostiek helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de
vermelding kan terugkeren naar openbare oppervlakken.

## Bans en accountstatus

Accounts die ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen.
Signalen voor misbruikdruk door uitgevers worden dagelijks gecontroleerd. Signalen die
ClawHubs drempel voor mogelijke bans bereiken, kunnen een automatische waarschuwing activeren. Als de volgende
geschikte scan na de waarschuwingstermijn de uitgever nog steeds in de
drempel voor mogelijke bans plaatst, kan ClawHub de accountactie automatisch toepassen.
Signalen met lagere betrouwbaarheid en begrensde temporele beoordelingssignalen blijven buiten automatische
handhaving.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth
begint te falen na accountactie, log dan in op de web-UI om de accountstatus te
controleren. Als inloggen of normale CLI-toegang wordt geblokkeerd door een ban of uitgeschakeld account,
gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een Skill- of Plugin-versie als schadelijk benoemt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor Plugins
`--kind plugin` toe. Controleer de scanuitvoer, repareer de vermelding, verhoog het versienummer
en upload de gerepareerde versie.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en toestemmingen
- vermijd versluierde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je Plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen naar releasegedrag
