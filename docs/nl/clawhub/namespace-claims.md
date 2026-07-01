---
read_when:
    - Een organisatie, merk, pakketbereik, gebruikersnaam van eigenaar, vaardigheidsslug of pakketnaamruimte claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe je een ClawHub-review aanvraagt voor geschillen over eigendom van een organisatie, merk, eigenaarshandle, pakket-scope, skill-slug of namespace.
title: Organisatie- en naamruimteclaims
x-i18n:
    generated_at: "2026-07-01T15:27:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt eigenaar-handles, organisatie-handles, Skills-slugs, Plugin-pakketnamen en
pakket-scopes als openbare namespaces. Als een namespace lijkt toe te behoren aan een
project, merk, pakket-ecosysteem of organisatie in de echte wereld, maar al is
geclaimd, gereserveerd, misleidend of betwist op ClawHub, vraag dan het personeel om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen rapporten
in het product of het formulier voor accountberoep voor namespaceclaims.

## Wanneer u een claim opent

Open een namespaceclaim wanneer u vindt dat ClawHub-personeel moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatie-handle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` die alleen mag publiceren onder de
  overeenkomende ClawHub-eigenaar
- een Skills-slug of Plugin-pakketnaam die een project lijkt na te bootsen
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige namespace-eigenaar
  blokkeert

Als de vermelding onveilig, kwaadaardig of misleidend is buiten het eigendomsgeschil,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaimformulier
is bedoeld voor eigendomsbeoordeling, niet voor noodmelding van kwetsbaarheden.

## Voordat u indient

Controleer eerst of u publiceert met de eigenaar die overeenkomt met de namespace.
Voor Plugin-pakketten moeten scoped namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, herstel de namespace dan rechtstreeks door de getroffen
resource te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer u de huidige eigenaar niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-organisatie, repo, release of maintainer
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- beheer over npm-, PyPI-, crates.io- of andere pakketregister-scopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, Skills, Plugin, pakket of issue

Leg uit wat elke link bewijst. Personeel moet de relatie kunnen begrijpen
zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met personeel vereist.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-personeel een namespace reserveren,
eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Personeel weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico en impact op gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
