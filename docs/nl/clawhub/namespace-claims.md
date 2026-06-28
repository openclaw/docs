---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaars-handle, Skills-slug of pakketnaamruimte claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een rapport, bezwaar of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over org, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-06-28T07:42:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatiehandles, skill-slugs, pluginpakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
echt project, merk, pakketecosysteem of echte organisatie, maar al is
geclaimd, gereserveerd, misleidend is of op ClawHub wordt betwist, vraag dan medewerkers om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het accountbezwaarformulier voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-medewerkers moeten beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of pluginpakketnaam die een project lijkt na te doen
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaimformulier
is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor pluginpakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, herstel de namespace dan rechtstreeks door de getroffen resource te publiceren,
te hernoemen, over te dragen, te verbergen of te verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie-, repo-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- domein- of officieel e-maildomeinbewijs
- controle over npm-, PyPI-, crates.io- of andere pakketregistryscopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
- privé juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met medewerkers nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/nl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
