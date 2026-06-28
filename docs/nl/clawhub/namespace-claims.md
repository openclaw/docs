---
read_when:
    - Een organisatie, merk, pakketbereik, eigenaars-handle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een melding, bezwaar of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe je een ClawHub-review aanvraagt voor geschillen over eigendom van organisaties, merken, eigenaar-handles, pakket-scopes, skill-slugs of naamruimten.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-06-28T05:07:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt owner-handles, organisatie-handles, skill-slugs, Plugin-pakketnamen en
pakket-scopes als openbare namespaces. Als een namespace lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag het personeel dan om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen meldingen in het product
of het formulier voor accountbezwaar voor namespaceclaims.

## Wanneer u een claim opent

Open een namespaceclaim wanneer u vindt dat ClawHub-personeel moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-owner
- een skill-slug of Plugin-pakketnaam die een project lijkt na te doen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige namespace-
  owner blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is los van het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor noodmeldingen van kwetsbaarheden.

## Voordat u indient

Controleer eerst of u publiceert met de owner die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende `example-org`-owner.

Als u de huidige owner kunt beheren, los de namespace dan rechtstreeks op door de betrokken resource te publiceren,
hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer u de huidige owner niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-organisatie, repository, release of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- bewijs via domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare hernoemingsmeldingen
- links naar de betwiste ClawHub-owner, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privécommunicatiekanaal met personeel nodig heeft.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/nl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/nl/clawhub/moderation)
- [Beveiliging](/nl/clawhub/security)
