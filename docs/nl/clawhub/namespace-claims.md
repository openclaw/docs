---
read_when:
    - Een org, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Bepalen of u een melding, bezwaar of namespace-claim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe u ClawHub-review aanvraagt voor eigendomsgeschillen over org, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-06-28T20:41:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, org-handles, skill-slugs, Plugin-pakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag staff om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het formulier voor accountbezwaar voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-staff moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een org-handle die overeenkomt met je GitHub-org, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen onder de
  overeenkomende ClawHub-owner zou mogen publiceren
- een skill-slug of Plugin-pakketnaam die een project lijkt na te bootsen
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de listing onveilig, schadelijk of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het formulier voor namespaceclaims
is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de getroffen resource te publiceren,
te hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer staff een
geschil moet oplossen.

## Bewijs om toe te voegen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-org-, repo-, release- of maintainergeschiedenis
- officiële projectdocumentatie waarin de namespace wordt genoemd
- bewijs van domein of officieel e-maildomein
- controle over scope in npm, PyPI, crates.io of een ander pakketregister
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar te bespreken is
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Staff moet de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet toevoegen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Voeg niet toe:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privé-juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met staff nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-staff een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande listing verbergen of in quarantaine plaatsen,
een alias of redirect toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Staff weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/nl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
