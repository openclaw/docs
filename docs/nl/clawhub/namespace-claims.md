---
read_when:
    - Een organisatie, merk, package-scope, eigenaarshandle, skill-slug of package-namespace claimen
    - Een namespace oplossen die al is geclaimd of gereserveerd
    - Beslissen of u een rapport, bezwaar of namespaceclaim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Hoe u een ClawHub-review aanvraagt voor geschillen over eigendom van organisatie, merk, owner-handle, package-scope, skill-slug of namespace.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-02T14:06:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisatie- en namespaceclaims

ClawHub gebruikt eigenaarhandles, organisatiehandles, skill-slugs, Plugin-pakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie, maar al is
geclaimd, gereserveerd, misleidend is of wordt betwist op ClawHub, vraag dan medewerkers om deze te beoordelen
met het
[issueformulier voor organisatie-/namespaceclaims](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen in-product
meldingen of het accountbezwaarformulier voor namespaceclaims.

## Wanneer u een claim opent

Open een namespaceclaim wanneer u vindt dat ClawHub-medewerkers moeten beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in quarantaine geplaatst, gealiast
of anderszins gewijzigd vanwege werkelijk eigendom.

Voorbeelden zijn:

- een organisatiehandle die overeenkomt met uw GitHub-organisatie, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen gepubliceerd zou mogen worden onder de
  overeenkomende ClawHub-eigenaar
- een skill-slug of Plugin-pakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare eigenaar die de rechtmatige namespace-
  eigenaar blokkeert

Als de vermelding onveilig, schadelijk of misleidend is buiten het eigendomsgeschil om,
volg dan ook de relevante moderatie- of beveiligingsrichtlijnen. Het namespaceclaim-
formulier is bedoeld voor eigendomsbeoordeling, niet voor spoedmeldingen van kwetsbaarheden.

## Voordat u indient

Controleer eerst of u publiceert met de eigenaar die overeenkomt met de namespace.
Voor Plugin-pakketten moeten gescopete namen zoals `@example-org/example-plugin` worden
gepubliceerd als de overeenkomende eigenaar `example-org`.

Als u de huidige eigenaar kunt beheren, herstel de namespace dan rechtstreeks door de getroffen bron
te publiceren, hernoemen, overdragen, verbergen of verwijderen. Gebruik een claim
wanneer u de huidige eigenaar niet kunt beheren of wanneer medewerkers een
geschil moeten oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- geschiedenis van GitHub-organisatie, repo, release of maintainer
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregisterscopes
- bewijs van eigendom van handelsmerk, merk of project dat veilig openbaar kan worden besproken
- geschiedenis van bronrepository, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-eigenaar, skill, Plugin, pakket of issue

Leg uit wat elke link bewijst. Medewerkers moeten de
relatie kunnen begrijpen zonder privéreferenties of geheimen nodig te hebben.

## Wat u niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privéjuridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privébeveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met medewerkers vereist.
Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kunnen ClawHub-medewerkers een namespace reserveren,
eigendom overdragen, een bron hernoemen, een bestaande vermelding verbergen of in quarantaine plaatsen,
een alias of omleiding toevoegen, om meer bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt overgedragen.
Medewerkers wegen openbaar bewijs, bestaand gebruik, beveiligingsrisico en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
