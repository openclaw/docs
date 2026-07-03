---
read_when:
    - Een organisatie, merk, package-scope, eigenaarshandle, skill-slug of package-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een rapport, beroep of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe je een ClawHub-beoordeling aanvraagt voor eigendomsgeschillen over organisaties, merken, eigenaarshandles, pakket-scopes, vaardigheids-slugs of naamruimten.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-03T23:36:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- en namespaceclaims

ClawHub gebruikt eigenaarhandles, org-handles, skill-slugs, pluginpakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie, maar al is geclaimd,
gereserveerd, misleidend is of wordt betwist op ClawHub, vraag dan medewerkers
om deze te beoordelen met het
[issueformulier voor org- / namespaceclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
in-productmeldingen of het formulier voor accountberoep voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-medewerkers moeten
beoordelen of een namespace moet worden gereserveerd, overgedragen, hernoemd,
verborgen, in quarantaine geplaatst, gealiast of anderszins gewijzigd vanwege
eigendom in de echte wereld.

Voorbeelden zijn:

- een org-handle die overeenkomt met je GitHub-org, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of pluginpakketnaam die zich lijkt voor te doen als een project
- een merk, handelsmerk, projecthernoeming of geschil over pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige
  namespace-eigenaar blokkeert

Als de vermelding onveilig, schadelijk of misleidend is buiten het
eigendomsgeschil, volg dan ook de relevante moderatie- of beveiligingsrichtlijnen.
Het namespaceclaimformulier is bedoeld voor eigendomsbeoordeling, niet voor
noodmeldingen van kwetsbaarheden.

## Voordat je indient

Bevestig eerst dat je publiceert met de eigenaar die overeenkomt met de
namespace. Voor pluginpakketten moeten scoped namen zoals
`@example-org/example-plugin` worden gepubliceerd als de overeenkomende eigenaar
`example-org`.

Als je de huidige eigenaar kunt beheren, herstel de namespace dan rechtstreeks
door de betrokken resource te publiceren, hernoemen, overdragen, verbergen of
verwijderen. Gebruik een claim wanneer je de huidige eigenaar niet kunt beheren
of wanneer medewerkers een geschil moeten oplossen.

## Bewijs om toe te voegen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-org-, repo-, release- of maintainergeschiedenis
- officiële projectdocs die de namespace noemen
- bewijs van domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregisterscopes
- handelsmerk-, merk- of projecteigendomsbewijs dat veilig openbaar besproken kan
  worden
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de relatie kunnen begrijpen
zonder private inloggegevens of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privaat bewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of inloggegevens
- DNS-challenge-tokens
- private juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- private e-mails, private beveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privaat kanaal met medewerkers
nodig heeft. Gebruik die optie in plaats van gevoelig materiaal openbaar te
plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace
reserveren, eigendom overdragen, een resource hernoemen, een bestaande vermelding
verbergen of in quarantaine plaatsen, een alias of redirect toevoegen, om meer
bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt
overgedragen. Medewerkers wegen openbaar bewijs, bestaand gebruik,
beveiligingsrisico en impact op gebruikers af.

## Gerelateerde docs

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
