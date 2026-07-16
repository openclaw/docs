---
read_when:
    - Een skill, plugin of pakket rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, blokkeringen of accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe meldingen, moderatieblokkeringen, verborgen vermeldingen, uitsluitingen en de accountstatus in ClawHub werken.
title: Moderatie en accountbeveiliging
x-i18n:
    generated_at: "2026-07-16T15:16:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicaties, maar openbare vindbaarheid en installatiekanalen hebben nog steeds
waarborgen nodig. Meldingen, moderatieblokkeringen, verborgen vermeldingen en accountmaatregelen
helpen gebruikers te beschermen wanneer een release of account onveilig of misleidend lijkt, of
niet aan het beleid voldoet.

Deze pagina behandelt moderatie en accountstatus. Zie voor auditlabels zoals
`Pass`, `Review`, `Warn`, `Malicious` en risiconiveau
[Beveiligingsaudits](/clawhub/security-audits).

Zie ook [Beveiliging](/clawhub/security) en
[Aanvaardbaar gebruik](/clawhub/acceptable-usage). Gebruik voor zorgen over auteursrechten of andere
inhoudsrechten [Verzoeken inzake inhoudsrechten](/clawhub/content-rights).

## Meldingen

Ingelogde gebruikers kunnen skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige marketplace-inhoud, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-aangegeven vereisten voor inloggegevens of machtigingen
- verdachte installatie-instructies
- identiteitsmisbruik
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Aanvaardbaar gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een skillpagina of de opdracht/API voor het
melden van pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een
skill of Plugin van derden. Meld deze rechtstreeks bij de uitgever of de
bronrepository waarnaar vanuit de vermelding wordt verwezen. ClawHub onderhoudt
of patcht geen code van skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in
ClawHub zelf. Voorbeelden zijn fouten in de website, API, CLI, registry, authenticatie,
scans, moderatie of vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-
advisories niet voor kwetsbaarheden in skills of plugins van derden.

Goede meldingen zijn specifiek en uitvoerbaar. Misbruik van het meldingssysteem kan
zelf tot accountmaatregelen leiden.

## Claims op organisaties en namespaces

Geschillen over eigendom van organisaties, merken, pakketbereiken, eigenaarshandles of namespaces moeten
via de procedure [Claims op organisaties en namespaces](/clawhub/namespace-claims) worden ingediend, niet via de
meldingsfunctie in het product of het bezwaarformulier voor accounts.

Gebruik die procedure wanneer medewerkers van ClawHub niet-gevoelig bewijs moeten beoordelen dat een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins beoordeeld. Neem geen geheimen, privédocumenten, vertrouwelijke juridische
bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-challengetokens op in een
openbare issue.

## Moderatieblokkeringen

Sommige ernstige bevindingen of beleidsproblemen kunnen ertoe leiden dat een uitgever of vermelding onder een
moderatieblokkering wordt geplaatst. Wanneer dit gebeurt, kan de betrokken inhoud voor openbare
vindbaarheid worden verborgen of kunnen toekomstige publicaties aanvankelijk verborgen zijn totdat het probleem is beoordeeld.

Moderatieblokkeringen zijn bedoeld om gebruikers te beschermen terwijl ClawHub gevallen met een hoog risico
afhandelt. Ze kunnen ook worden opgeheven wanneer een fout-positief resultaat wordt bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn via
openbare installatiekanalen.

Als je een van deze statussen ziet, installeer de release dan niet, tenzij de eigenaar
het probleem oplost of de moderatie de vermelding herstelt.

Eigenaren kunnen mogelijk nog steeds diagnostische gegevens voor hun eigen vastgehouden of verborgen vermeldingen zien. Deze
diagnostische gegevens helpen uit te leggen wat er is gebeurd en wat er moet veranderen voordat de
vermelding naar openbare kanalen kan terugkeren.

## Verbanningen en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen hun publicatietoegang verliezen. Ernstig misbruik kan
leiden tot accountverbanningen, intrekking van tokens, verborgen inhoud of verwijderde vermeldingen.
Signalen van misbruikdruk door uitgevers worden dagelijks gecontroleerd. Signalen die
de drempel voor een mogelijke verbanning van ClawHub bereiken, kunnen een automatische waarschuwing activeren. Als de volgende
in aanmerking komende scan na de waarschuwingstermijn de uitgever nog steeds binnen de
drempel voor een mogelijke verbanning plaatst, kan ClawHub de accountmaatregel automatisch toepassen.
Signalen met een lagere betrouwbaarheid en signalen voor tijdgebonden beoordeling vallen buiten de automatische
handhaving.

Verwijderde, verbannen of uitgeschakelde accounts kunnen geen ClawHub-API-tokens gebruiken. Als CLI-authenticatie
na een accountmaatregel begint te mislukken, log dan in bij de web-UI om de
accountstatus te bekijken. Als inloggen of normale CLI-toegang wordt geblokkeerd door een verbanning of uitgeschakeld account,
gebruik dan het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor een herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een versie van een skill of Plugin als schadelijk aanmerkt,
download dan de opgeslagen scanresultaten voor de geblokkeerde ingediende versie:
`clawhub scan download <slug> --version <version>`. Voeg voor plugins
`--kind plugin` toe. Beoordeel de scanuitvoer, herstel de vermelding, verhoog het versie-
nummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieve resultaten te verminderen en het vertrouwen van gebruikers te vergroten:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- vermeld vereiste omgevingsvariabelen en machtigingen
- vermijd verhulde installatieopdrachten
- verwijs waar mogelijk naar de broncode
- gebruik proefuitvoeringen voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen naar het gedrag van een release
