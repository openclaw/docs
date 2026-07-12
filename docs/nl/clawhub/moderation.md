---
read_when:
    - Een skill, plugin of pakket rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
    - Inzicht in ClawHub-moderatie, blokkeringen en accountstatus
sidebarTitle: Moderation and Account Safety
summary: Hoe meldingen, moderatieblokkeringen, verborgen vermeldingen, verbanningen en accountstatus in ClawHub werken.
title: Moderatie en accountbeveiliging
x-i18n:
    generated_at: "2026-07-12T08:39:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderatie en accountveiligheid

ClawHub staat open voor publicatie, maar openbare vindbaarheid en installatiekanalen hebben nog steeds beschermingsmaatregelen nodig. Meldingen, moderatieblokkeringen, verborgen vermeldingen en accountmaatregelen helpen gebruikers te beschermen wanneer een release of account onveilig, misleidend of in strijd met het beleid lijkt.

Deze pagina behandelt moderatie en accountstatus. Zie [Beveiligingsaudits](/clawhub/security-audits) voor auditlabels zoals `Pass`, `Review`, `Warn` en `Malicious`, en voor het risiconiveau.

Zie ook [Beveiliging](/nl/clawhub/security) en [Aanvaardbaar gebruik](/clawhub/acceptable-usage). Gebruik [Verzoeken inzake inhoudsrechten](/clawhub/content-rights) voor zorgen over auteursrecht of andere rechten op inhoud.

## Meldingen

Ingelogde gebruikers kunnen Skills, plugins en pakketten melden.

Gebruik ClawHub-meldingen alleen voor onveilige inhoud op de marktplaats, zoals:

- schadelijke vermeldingen
- misleidende metadata
- niet-aangegeven vereisten voor inloggegevens of machtigingen
- verdachte installatie-instructies
- identiteitsmisbruik
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Aanvaardbaar gebruik](/clawhub/acceptable-usage) schendt

Gebruik de knop **Skill melden** op een Skill-pagina of de meldingsopdracht/API voor pakketten.

Gebruik ClawHub-meldingen niet voor kwetsbaarheden in de eigen broncode van een Skill of Plugin van derden. Meld deze rechtstreeks bij de uitgever of de broncoderepository waarnaar vanuit de vermelding wordt verwezen. ClawHub onderhoudt of herstelt geen code van Skills of plugins van derden.

GitHub Security Advisories voor `openclaw/clawhub` zijn bedoeld voor kwetsbaarheden in ClawHub zelf. Voorbeelden zijn fouten in de website, API, CLI, het register, de authenticatie, het scannen, de moderatie of de vertrouwensgrenzen voor downloaden/installeren. Gebruik ClawHub-adviezen niet voor kwetsbaarheden in Skills of plugins van derden.

Goede meldingen zijn specifiek en bruikbaar. Misbruik van de meldingsfunctie kan zelf tot accountmaatregelen leiden.

## Claims op organisaties en naamruimten

Geschillen over eigendom van organisaties, merken, pakketbereiken, eigenaarshandles of naamruimten moeten de procedure [Claims op organisaties en naamruimten](/clawhub/namespace-claims) gebruiken, niet de meldingsprocedure in het product of het bezwaarformulier voor accounts.

Gebruik die procedure wanneer medewerkers van ClawHub niet-gevoelig bewijs moeten beoordelen dat een naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien of anderszins beoordeeld. Neem geen geheimen, privédocumenten, vertrouwelijke juridische bestanden, persoonlijke identiteitsdocumenten, API-tokens of DNS-uitdagingstokens op in een openbaar issue.

## Moderatieblokkeringen

Sommige ernstige bevindingen of beleidsproblemen kunnen ertoe leiden dat een uitgever of vermelding onder een moderatieblokkering wordt geplaatst. Wanneer dit gebeurt, kan de betreffende inhoud voor openbare vindbaarheid worden verborgen of kunnen toekomstige publicaties aanvankelijk verborgen zijn totdat het probleem is beoordeeld.

Moderatieblokkeringen zijn bedoeld om gebruikers te beschermen terwijl ClawHub gevallen met een hoog risico afhandelt. Ze kunnen ook worden opgeheven wanneer een fout-positief resultaat is bevestigd.

## Verborgen of geblokkeerde vermeldingen

Een vermelding kan worden vastgehouden, verborgen, in quarantaine geplaatst, ingetrokken of anderszins niet beschikbaar zijn via openbare installatiekanalen.

Als u een van deze statussen ziet, installeer de release dan niet, tenzij de eigenaar het probleem oplost of de moderatie de vermelding herstelt.

Eigenaren kunnen mogelijk nog steeds diagnostische informatie voor hun eigen vastgehouden of verborgen vermeldingen zien. Deze diagnostische informatie helpt uit te leggen wat er is gebeurd en wat er moet veranderen voordat de vermelding naar openbare kanalen kan terugkeren.

## Verbanningen en accountstatus

Accounts die het beleid van ClawHub schenden, kunnen hun publicatietoegang verliezen. Ernstig misbruik kan leiden tot verbanning van accounts, intrekking van tokens, verborgen inhoud of verwijderde vermeldingen. Signalen die wijzen op misbruik door uitgevers worden dagelijks gecontroleerd. Signalen die de drempel van ClawHub voor een mogelijke verbanning bereiken, kunnen een automatische waarschuwing activeren. Als de eerstvolgende in aanmerking komende scan na de waarschuwingstermijn de uitgever nog steeds binnen de drempel voor een mogelijke verbanning plaatst, kan ClawHub de accountmaatregel automatisch toepassen. Beoordelingssignalen met een lagere betrouwbaarheid en een beperkte geldigheidsduur worden niet automatisch afgedwongen.

Verwijderde, verbannen of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie na een accountmaatregel niet meer werkt, meldt u zich aan bij de webinterface om de accountstatus te controleren. Als aanmelden of normale CLI-toegang wordt geblokkeerd door een verbanning of een uitgeschakeld account, gebruikt u het [ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) voor een herstelbeoordeling.

Als een door een scanner geactiveerde e-mail een versie van een Skill of Plugin als schadelijk aanmerkt, downloadt u de opgeslagen scanresultaten voor de geblokkeerde ingediende versie: `clawhub scan download <slug> --version <version>`. Voeg voor plugins `--kind plugin` toe. Controleer de scanuitvoer, herstel de vermelding, verhoog het versienummer en upload de herstelde versie.

## Richtlijnen voor uitgevers

Om fout-positieve resultaten te verminderen en het vertrouwen van gebruikers te vergroten:

- houd namen, samenvattingen, tags en wijzigingslogboeken nauwkeurig
- vermeld vereiste omgevingsvariabelen en machtigingen
- vermijd versluierde installatieopdrachten
- verwijs waar mogelijk naar de broncode
- gebruik proefuitvoeringen voordat u plugins publiceert
- reageer duidelijk als gebruikers of moderatoren vragen naar het gedrag van een release
