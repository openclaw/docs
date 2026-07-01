---
read_when:
    - Een org, merk, pakketscope, eigenaarshandle, skill-slug of pakketnamespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een rapport, beroep of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je ClawHub-review aanvraagt voor geschillen over eigendom van organisatie, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-01T13:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- en namespaceclaims

ClawHub gebruikt owner-handles, org-handles, Skills-slugs, Plugin-pakketnamen en
pakketscopes als publieke namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakketecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag dan het personeel om deze te beoordelen
met het
[issueformulier voor org-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor publieke, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
rapporten of het formulier voor accountbezwaar voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-personeel moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gekoppeld aan een alias,
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een org-handle die overeenkomt met je GitHub-org, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen onder de
  overeenkomende ClawHub-owner mag publiceren
- een Skills-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is los van het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het formulier voor namespaceclaims
is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende owner `example-org`.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de betrokken resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer je de huidige owner niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik publiek, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-org, repo, release of maintainer
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregisterscopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig publiek kan worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of publieke hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, Skills, Plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een publiek GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of inloggegevens
- DNS-challengetokens
- privé juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, private beveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met personeel nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal publiek te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of redirect toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Personeel weegt publiek bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
