---
read_when:
    - Een organisatie, merk, pakketbereik, eigenaarsnaam, skill-slug of pakketnaamruimte claimen
    - Een naamruimte omzetten die al is geclaimd of gereserveerd
    - Beslissen of u een melding, bezwaar of namespaceclaim moet gebruiken
sidebarTitle: Org and Namespace Claims
summary: Hoe u een beoordeling door ClawHub aanvraagt voor geschillen over het eigendom van een organisatie, merk, eigenaarsgebruikersnaam, pakketbereik, skill-slug of naamruimte.
title: Organisatie- en naamruimteclaims
x-i18n:
    generated_at: "2026-07-12T08:40:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Claims op organisaties en naamruimten

ClawHub gebruikt eigenaarsnamen, organisatienamen, skill-slugs, pakketnamen van Plugins en
pakket-scopes als openbare naamruimten. Als een naamruimte bij een bestaand
project, merk, pakketecosysteem of een bestaande organisatie lijkt te horen, maar op ClawHub al
geclaimd of gereserveerd is, misleidend is of wordt betwist, vraag het personeel dan deze te beoordelen
via het
[issueformulier voor een claim op een organisatie/naamruimte](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik deze procedure voor openbare, niet-gevoelige beoordelingen van eigendom. Gebruik voor
naamruimteclaims geen meldingen in het product of het bezwaarformulier voor accounts.

## Wanneer u een claim moet indienen

Dien een naamruimteclaim in wanneer u vindt dat ClawHub-medewerkers moeten beoordelen of een
naamruimte moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, van een alias voorzien
of anderszins gewijzigd vanwege eigendom in de echte wereld.

Voorbeelden zijn:

- een organisatienaam die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakket-scope zoals `@example-org/*` waaronder alleen de overeenkomende
  ClawHub-eigenaar mag publiceren
- een skill-slug of pakketnaam van een Plugin die zich lijkt voor te doen als een project
- een geschil over een merk, handelsmerk, hernoeming van een project of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige eigenaar van de
  naamruimte blokkeert

Als de vermelding behalve het eigendomsgeschil ook onveilig, schadelijk of misleidend is,
volg dan ook de toepasselijke richtlijnen voor moderatie of beveiliging. Het formulier voor
naamruimteclaims is bedoeld voor eigendomsbeoordeling, niet voor het met spoed melden van kwetsbaarheden.

## Voordat u een claim indient

Controleer eerst of u publiceert met de eigenaar die bij de naamruimte hoort.
Voor Plugin-pakketten moeten namen met een scope, zoals `@example-org/example-plugin`, worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, corrigeer de naamruimte dan rechtstreeks door de betreffende
resource te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer u de huidige eigenaar niet kunt beheren of wanneer personeel een
geschil moet oplossen.

## Op te nemen bewijsmateriaal

Gebruik openbaar, niet-gevoelig bewijsmateriaal. Nuttig bewijs omvat:

- geschiedenis van een GitHub-organisatie, repository, release of beheerder
- officiële projectdocumentatie waarin de naamruimte wordt genoemd
- bewijs via een domein of officieel e-maildomein
- beheer van een scope in npm, PyPI, crates.io of een ander pakketregister
- bewijs van eigendom van een handelsmerk, merk of project dat veilig openbaar kan worden besproken
- geschiedenis van de bronrepository of het pakket, of openbare aankondigingen van een hernoeming
- links naar de betwiste eigenaar, skill, Plugin, het pakket of issue op ClawHub

Leg uit wat elke link bewijst. Medewerkers moeten de relatie kunnen begrijpen
zonder dat zij privéreferenties of geheimen nodig hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijsmateriaal in een openbaar GitHub-issue. Neem het volgende niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-verificatietokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

In het claimformulier wordt gevraagd of gevoelig bewijsmateriaal via een privékanaal voor medewerkers
moet worden aangeleverd. Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een naamruimte reserveren,
het eigendom overdragen, een resource hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Een naamruimtebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico's en de gevolgen voor gebruikers af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
