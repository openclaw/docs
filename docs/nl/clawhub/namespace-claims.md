---
read_when:
    - Een org, merk, pakket-scope, eigenaarshandle, skill-slug of pakket-namespace claimen
    - Een naamruimte oplossen die al is geclaimd of gereserveerd
    - Beslissen of je een melding, beroep of namespace-claim gebruikt
sidebarTitle: Org and Namespace Claims
summary: Een ClawHub-review aanvragen voor eigendomsgeschillen over organisaties, merken, eigenaarshandles, pakket-scopes, skill-slugs of naamruimten.
title: Organisatie- en namespaceclaims
x-i18n:
    generated_at: "2026-07-04T10:50:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- en namespaceclaims

ClawHub gebruikt owner-handles, org-handles, skill-slugs, pluginpakketnamen en
pakketscopes als openbare namespaces. Als een namespace lijkt te horen bij een
echt project, merk, pakketecosysteem of organisatie, maar al is geclaimd,
gereserveerd, misleidend is of wordt betwist op ClawHub, vraag staff dan om deze
te beoordelen met het
[Org- / namespaceclaim-issueformulier](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Gebruik dit pad voor openbare, niet-gevoelige eigendomsbeoordeling. Gebruik geen
in-productmeldingen of het bezwaarformulier voor accounts voor namespaceclaims.

## Wanneer je een claim opent

Open een namespaceclaim wanneer je vindt dat ClawHub-staff moet beoordelen of een
namespace moet worden gereserveerd, overgedragen, hernoemd, verborgen, in
quarantaine geplaatst, gealiast of anderszins gewijzigd vanwege eigendom in de
echte wereld.

Voorbeelden zijn:

- een org-handle die overeenkomt met je GitHub-org, project, bedrijf of community
- een pakketscope zoals `@example-org/*` die alleen onder de bijbehorende
  ClawHub-owner mag publiceren
- een skill-slug of pluginpakketnaam die een project lijkt te imiteren
- een geschil over een merk, handelsmerk, projecthernoeming of pakketgeschiedenis
- een verwijderde, inactieve of onbereikbare owner die de rechtmatige
  namespace-owner blokkeert

Als de vermelding onveilig, schadelijk of misleidend is buiten het
eigendomsgeschil, volg dan ook de relevante moderatie- of beveiligingsrichtlijnen.
Het namespaceclaimformulier is bedoeld voor eigendomsbeoordeling, niet voor het
melden van noodkwetsbaarheden.

## Voordat je indient

Controleer eerst of je publiceert met de owner die overeenkomt met de namespace.
Voor pluginpakketten moeten gescopete namen zoals `@example-org/example-plugin`
worden gepubliceerd als de overeenkomende `example-org`-owner.

Als je de huidige owner kunt beheren, los de namespace dan rechtstreeks op door
de betreffende resource te publiceren, hernoemen, overdragen, verbergen of
verwijderen. Gebruik een claim wanneer je de huidige owner niet kunt beheren of
wanneer staff een geschil moet oplossen.

## Bewijs om op te nemen

Gebruik openbaar, niet-gevoelig bewijs. Nuttig bewijs omvat:

- GitHub-org-, repo-, release- of maintainergeschiedenis
- officiële projectdocumentatie die de namespace noemt
- bewijs van domein of officieel e-maildomein
- controle over npm-, PyPI-, crates.io- of andere pakketregistryscopes
- bewijs van handelsmerk-, merk- of projecteigendom dat veilig openbaar kan
  worden besproken
- bronrepositorygeschiedenis, pakketgeschiedenis of openbare hernoemingsberichten
- links naar de betwiste ClawHub-owner, skill, plugin, pakket of issue

Leg uit wat elke link bewijst. Staff moet de relatie kunnen begrijpen zonder
privéreferenties of geheimen nodig te hebben.

## Wat je niet moet opnemen

Plaats geen geheimen of privébewijs in een openbaar GitHub-issue. Neem niet op:

- API-tokens, ondertekeningssleutels of referenties
- DNS-challenge-tokens
- privé-juridische bestanden of contracten
- persoonlijke identiteitsdocumenten
- privé-e-mails, privé-beveiligingsrapporten of vertrouwelijke klantgegevens

Het claimformulier vraagt of gevoelig bewijs een privékanaal met staff nodig
heeft. Gebruik die optie in plaats van gevoelig materiaal openbaar te plaatsen.

## Mogelijke uitkomsten

Afhankelijk van het bewijs en het risico kan ClawHub-staff een namespace
reserveren, eigendom overdragen, een resource hernoemen, een bestaande vermelding
verbergen of in quarantaine plaatsen, een alias of redirect toevoegen, om meer
bewijs vragen of het verzoek afwijzen.

Namespacebeoordeling garandeert niet dat elke overeenkomende naam wordt
overgedragen. Staff weegt openbaar bewijs, bestaand gebruik, beveiligingsrisico
en gebruikersimpact af.

## Gerelateerde documentatie

- [Publiceren](/nl/clawhub/publishing)
- [Probleemoplossing](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderatie en accountveiligheid](/clawhub/moderation)
- [Beveiliging](/clawhub/security)
