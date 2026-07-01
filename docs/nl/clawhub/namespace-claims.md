---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een rapport, beroep of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe je een ClawHub-review aanvraagt voor geschillen over eigendom van organisaties, merken, owner-handles, package-scopes, skill-slugs of namespaces.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-01T20:27:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatiehandles, Skills-slugs, Plugin-pakketnamen en
pakket-scopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend of betwist op ClawHub, vraag dan staff om deze te beoordelen
met het
[formulier voor organisatie- / namespaceclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
rapporten of het formulier voor accountberoep voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-staff moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege werkelijk eigendom.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen onder de
  overeenkomende ClawHub-owner mag publiceren
- een Skills-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de listing onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmelding van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de getroffen
resource te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer staff een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie, repo, release of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregistratie-scopes
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare aankondigingen van hernoemingen
- links naar de betwiste ClawHub-owner, Skills, Plugin, pakket of issue

Leg uit wat elke link bewijst. Staff moet de relatie kunnen begrijpen
zonder privé-inloggegevens of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of inloggegevens
- DNS-challenge-tokens
- privé juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met staff nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-staff een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande listing verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Staff weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
