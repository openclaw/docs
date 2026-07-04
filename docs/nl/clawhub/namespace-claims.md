---
read_when:
    - Een organisatie, merk, pakket-scope, owner-handle, skill-slug of pakket-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Bepalen of u een rapport, beroep of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-beoordeling aanvraagt voor geschillen over eigendom van organisatie, merk, eigenaarshandle, pakket-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-04T20:36:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner handles, org handles, skill-slugs, pluginpakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie maar al is geclaimd,
gereserveerd, misleidend is of wordt betwist op ClawHub, vraag dan medewerkers
om deze te beoordelen via het
[issueformulier voor organisatie-/namespaceclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
in-productmeldingen of het formulier voor accountberoep voor namespaceclaims.

## Wanneer je een claim moet openen

Open een namespaceclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast,
of anderszins gewijzigd vanwege echt eigendom.

Voorbeelden zijn:

- een org handle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of pluginpakketnaam die een project lijkt te imiteren
- een geschil over merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante richtlijnen voor moderatie of beveiliging. Het namespaceclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor pluginpakketten moeten gescopete namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de
betroffen resource te publiceren, te hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Op te nemen bewijs

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repository-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- domein- of officieel bewijs via e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregistry-scope
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privémedewerkerskanaal nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
