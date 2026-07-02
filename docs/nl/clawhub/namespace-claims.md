---
read_when:
    - Een organisatie, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een melding, beroep of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u ClawHub-review aanvraagt voor eigendomsgeschillen over organisatie, merk, eigenaar-handle, pakket-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-02T17:41:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatiehandles, skill-slugs, Plugin-pakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt te horen bij een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al
geclaimd, gereserveerd, misleidend of betwist is op ClawHub, vraag dan het
personeel om deze te beoordelen met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
in-productrapportages of het accountbezwaarformulier voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-personeel moet beoordelen of
een namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in
quarantaine geplaatst, gealiast of anderszins gewijzigd vanwege eigendom in de
echte wereld.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met je GitHub-organisatie, project,
  bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige
  namespace-owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het
eigendomsconflict, volg dan ook de relevante moderatie- of beveiligingsrichtlijnen.
Het namespaceclaimformulier is bedoeld voor eigendomsbeoordeling, niet voor
noodmeldingen van kwetsbaarheden.

## Voordat je indient

Bevestig eerst dat je publiceert met de owner die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin`
worden gepubliceerd als de overeenkomende owner `example-org`.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de
betrokken resource te publiceren, hernoemen, overdragen, verbergen of verwijderen.
Gebruik een claim wanneer je de huidige owner niet kunt beheren of wanneer
personeel een geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-organisaties, repositories, releases of maintainers
- officiële projectdocumentatie die de namespace noemt
- bewijs via domein of officieel e-maildomein
- controle over scopes in npm, PyPI, crates.io of andere pakketregisters
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan
  worden besproken
- geschiedenis van bronrepository's, pakketgeschiedenis of openbare
  hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen zonder
privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challengetokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met personeel nodig
heeft. Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een namespace
reserveren, eigendom overdragen, een resource hernoemen, een bestaande vermelding
verbergen of in quarantaine plaatsen, een alias of redirect toevoegen, om meer
bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt
overgedragen. Personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico
en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
