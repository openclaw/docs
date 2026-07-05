---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaars-handle, skill-slug of pakketnaamruimte claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een rapport, bezwaar of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over organisaties, merken, eigenaar-handles, package-scopes, skill-slugs of namespaces.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-05T07:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en naamruimteclaims

ClawHub gebruikt eigenaarhandles, organisatiehandles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare naamruimten. Als een naamruimte lijkt toe te behoren aan een
echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag het personeel om deze te beoordelen
met het
[issueformulier voor organisatie-/naamruimteclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen rapporten in het product
of het bezwaarformulier voor accounts voor naamruimteclaims.

## Wanneer je een claim opent

Open een naamruimteclaim wanneer je vindt dat ClawHub-personeel moet beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege feitelijk eigendom.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of Plugin-pakketnaam die zich lijkt voor te doen als een project
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige naamruimte-
  eigenaar blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het naamruimteclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de eigenaar die overeenkomt met de naamruimte.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als je de huidige eigenaar kunt beheren, los de naamruimte dan rechtstreeks op door de getroffen resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige eigenaar niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-organisatie, repo, release of maintainer
- officiële projectdocumentatie die de naamruimte noemt
- bewijs van domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar te bespreken is
- geschiedenis van bronrepository, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met personeel vereist.
Gebruik die optie in plaats van gevoelig materiaal openbaar te posten.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een naamruimte reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
