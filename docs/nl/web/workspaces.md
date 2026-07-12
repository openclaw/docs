---
read_when:
    - Werkruimtetabbladen en widgets maken of herschikken
    - Een agent een werkruimte laten samenstellen
    - Beoordeling van het goedkeurings- en sandboxmodel voor aangepaste widgets
summary: Door agents samenstelbare werkruimten in de Control UI
title: Werkruimten
x-i18n:
    generated_at: "2026-07-12T09:27:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

Het tabblad **Workspaces** in de [Control UI](/nl/web/control-ui) is een omgeving die u samen met uw
agents inricht. Tabbladen, widgets, hun posities in een raster met 12 kolommen en hun
gegevensbindingen bevinden zich allemaal in één document. Alles wat dat document kan bewerken, kan
de workspace samenstellen: u, de CLI `openclaw workspaces` of een agent die `workspace_*`-tools aanroept.

Elke schrijfbewerking doorloopt hetzelfde gevalideerde pad, zodat de indeling van een gebruiker en die van een agent
niet van elkaar kunnen afwijken. Elke geaccepteerde schrijfbewerking verhoogt een versie en verzendt
`plugin.workspaces.changed`, zodat de bewerking van een agent zonder
herladen verschijnt in een browser die al geopend is.

## Workspaces inschakelen

De meegeleverde Workspaces-plugin is standaard uitgeschakeld. Open **Plugins** in de Control UI,
zoek **Workspaces** en selecteer **Enable**. U kunt de plugin ook inschakelen via de CLI:

```sh
openclaw plugins enable workspaces
```

Door de plugin in te schakelen wordt het tabblad **Workspaces** toegevoegd en komen de CLI
`openclaw workspaces` en de agenttools `workspace_*` beschikbaar. Als u de plugin uitschakelt, worden deze
interfaces verwijderd zonder de workspacedatabase of widgetassets te verwijderen.

## De standaardworkspace

Wanneer u deze voor het eerst opent, krijgt u een workspace **Overview**: kaarten voor kosten en tokens, de status van instanties,
sessies, de Cron-status en een activiteitenfeed. Dit is gewone workspace-inhoud — versleep, verklein,
verberg of verwijder deze.

## Ingebouwde widgets

De plugin wordt geleverd met negen vertrouwde widgets die als systeemeigen UI worden weergegeven:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Widgets geven gegevens op via **bindingen**; ze halen deze nooit zelf op:

| Binding  | Wordt omgezet naar                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `static` | Een letterlijke waarde die in het document is opgeslagen (maximaal 8 KB).                                               |
| `file`   | Een JSON-, Markdown- of CSV-bestand onder `<stateDir>/workspaces/data/`, eventueel beperkt met een JSON-pointer.         |
| `rpc`    | Een methode uit een vaste toelatingslijst met alleen-lezen Gateway-methoden, omgezet door de vertrouwde Control UI.      |

De `file`-binding is de eenvoudigste manier om uw eigen getallen in een workspace te plaatsen: schrijf een
JSON-bestand naar de gegevensmap en laat een `stat-card` ernaar verwijzen.

## Herkomst

Tabbladen en widgets bevatten een `createdBy`-stempel — `user`, `system` of `agent:<id>` — die wordt ingesteld op basis van
degene die de schrijfbewerking heeft uitgevoerd. De aanroeper kan deze niet opgeven, zodat een agent zijn
werk niet als het uwe kan bestempelen en de chip ‘AI’ op een door een agent gemaakte widget altijd klopt.

## Aangepaste widgets

Een agent kan met `workspace_widget_scaffold` een echte HTML-widget maken (of u kunt dit doen met
`openclaw workspaces widget-scaffold <name>`). Door agents gemaakte code wordt als vijandig beschouwd:

- Een nieuw aangemaakte widget wordt met de status **pending** in het register opgenomen. Er wordt geen iframe gemaakt en de
  assetroute retourneert 404 voor de bestanden totdat een beheerder de widget goedkeurt.
- Goedkeuring is een afzonderlijke beslissing, los van het bewerken van een indeling: `workspaces.widget.approve`
  vereist het bereik `operator.approvals`, hetzelfde bereik dat goedkeuringen voor uitvoerbewerkingen beveiligt.
- Een goedgekeurde widget wordt weergegeven in een `<iframe sandbox="allow-scripts">` — nooit met
  `allow-same-origin` — zodat de oorsprong ervan ondoorzichtig is en de widget geen toegang heeft tot de DOM,
  opslag of cookies van het bovenliggende document.
- De assets worden aangeboden met `connect-src 'none'`, waardoor netwerkverbindingen vanuit scripts, zoals
  `fetch`, XHR en WebSockets, worden geblokkeerd. De widget bevat geen aanmeldgegevens en communiceert nooit met de Gateway.
- Gegevens bereiken de widget uitsluitend via een geversioneerde `postMessage`-brug. Aangepaste code kan
  gedeclareerde `static`-bindingen ontvangen. Dit zijn al workspacewaarden die door een agent of beheerder zijn
  gemaakt. RPC- en bestandsbindingen blijven in vertrouwde ingebouwde widgets: browsers staan toe dat een
  gesandboxt onderliggend document binnen het eigen frame navigeert, zodat bevoorrechte gegevens nooit naar
  door agents gemaakte HTML worden verzonden.

Voor het verzenden van een prompt vanuit een widget naar de chat is bovendien een manifestmogelijkheid vereist,
evenals een bevestiging per aanroep waarin de exacte tekst wordt geciteerd; daarnaast geldt er een frequentielimiet.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

Voor `widget-approve` is een apparaat vereist dat is gekoppeld met het bereik `operator.approvals`; bij goedkeuring vanuit
de Control UI is dit niet nodig, omdat de browser dit bereik al bezit.

## Opslag

Het workspacedocument, het register met aangepaste widgets en een ringbuffer voor twintig bewerkingen die ongedaan kunnen worden gemaakt, bevinden zich in
`<stateDir>/workspaces/workspaces.sqlite`. Assets van door agents gemaakte widgets blijven op schijf staan onder
`<stateDir>/workspaces/widgets/<name>/` en gegevens voor bestandsbindingen onder
`<stateDir>/workspaces/data/`, omdat een agent deze met gewone bestandstools maakt en
de widgetroute de bytes ervan aanbiedt.
