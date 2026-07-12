---
read_when:
    - Je wilt dat OpenClaw-agenten een grote toolcatalogus gebruiken zonder elk toolschema aan de prompt toe te voegen
    - U wilt OpenClaw-tools, MCP-tools en clienttools beschikbaar maken via één compact runtime-oppervlak
    - Je implementeert of debugt de detectie van tools voor OpenClaw-uitvoeringen
summary: 'Tool Search: omvangrijke OpenClaw-toolcatalogi compact aanbieden via zoeken, beschrijven en aanroepen'
title: Hulpmiddelen zoeken
x-i18n:
    generated_at: "2026-07-12T09:31:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search is een experimentele functie van de OpenClaw-agentruntime. Hiermee kunnen agents op één compacte manier grote toolcatalogi doorzoeken en tools aanroepen. Dit is nuttig wanneer voor een run veel tools beschikbaar zijn, maar het model er waarschijnlijk slechts enkele nodig heeft.

Deze pagina documenteert OpenClaw Tool Search. Dit is niet de Codex-eigen interface voor het zoeken naar tools of dynamische tools. De Codex-eigen codemodus, het zoeken naar tools, uitgestelde dynamische tools en geneste toolaanroepen zijn stabiele interfaces van de Codex-harness en zijn niet afhankelijk van `tools.toolSearch`.

Wanneer Tool Search is ingeschakeld voor OpenClaw-runs, ontvangt het model standaard één tool `tool_search_code`, plus eventuele tools die uitsluitend rechtstreeks beschikbaar zijn en waarvan de gestructureerde resultaten niet via de compacte bridge kunnen worden doorgegeven. De codetool voert een korte JavaScript-body uit in een geïsoleerd Node-subproces met een `openclaw.tools`-bridge:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

De catalogus kan daarvoor geschikte OpenClaw-tools, plugintools, MCP-tools en door de client geleverde tools bevatten. Het model ziet niet vooraf elk gecatalogiseerd schema. In plaats daarvan doorzoekt het compacte beschrijvingen, vraagt het de details van één geselecteerde tool op wanneer het exacte schema nodig is en roept het die tool via OpenClaw aan. Tools die uitsluitend rechtstreeks beschikbaar zijn, blijven zichtbaar voor het model en worden niet aan de catalogus toegevoegd.

Runs van de Codex-harness ontvangen deze experimentele besturingselementen van OpenClaw Tool Search niet. OpenClaw geeft productmogelijkheden als dynamische tools door aan Codex. Codex beheert de stabiele eigen codemodus, de eigen toolzoekfunctie, uitgestelde dynamische tools en geneste toolaanroepen.

## Hoe een beurt wordt uitgevoerd

Tijdens de planning stelt de ingesloten OpenClaw-runner de effectieve catalogus voor de run samen:

1. Bepaal het actieve toolbeleid voor de agent, het profiel, de sandbox en de sessie.
2. Maak een lijst van geschikte OpenClaw- en plugintools.
3. Maak via de MCP-runtime van de sessie een lijst van geschikte MCP-tools.
4. Voeg geschikte, door de client geleverde tools voor de huidige run toe.
5. Houd tools die uitsluitend rechtstreeks beschikbaar zijn zichtbaar voor het model en indexeer compacte beschrijvingen voor de overige tools die voor de catalogus geschikt zijn.
6. Stel naast die uitsluitend rechtstreeks beschikbare tools de OpenClaw-codebridge, de gestructureerde terugvaltools of de compacte directory-interface beschikbaar.

Tijdens de uitvoering keert elke daadwerkelijke toolaanroep terug naar OpenClaw. De geïsoleerde Node-runtime bevat geen pluginimplementaties, MCP-clientobjecten of geheimen. `openclaw.tools.call(...)` gaat via de bridge terug naar de Gateway, waar het normale beleid en de normale goedkeuring, hooks, logboekregistratie en resultaatverwerking van toepassing blijven.

## Modi

`tools.toolSearch` heeft drie voor het model zichtbare modi:

- `code`: stelt `tool_search_code`, de standaard compacte JavaScript-bridge, beschikbaar naast tools die uitsluitend rechtstreeks beschikbaar zijn.
- `tools`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar als gewone gestructureerde tools voor providers die geen code mogen ontvangen, naast tools die uitsluitend rechtstreeks beschikbaar zijn.
- `directory`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar, plus een begrensde promptdirectory met namen en beschrijvingen van beschikbare tools voor providers die toolnamen moeten zien zonder elk volledig schema te ontvangen. OpenClaw kan voor de huidige beurt ook rechtstreeks een kleine, begrensde verzameling waarschijnlijke of vereiste toolschema's beschikbaar stellen. Ook in deze modus blijven tools die uitsluitend rechtstreeks beschikbaar zijn zichtbaar.

Alle modi gebruiken dezelfde door beleid gefilterde catalogus en het normale uitvoeringspad van OpenClaw. Tools die zijn gemarkeerd met `catalogMode: "direct-only"` blijven buiten die catalogus en zichtbaar voor het model. Als de huidige runtime het geïsoleerde Node-childproces voor de codemodus niet kan starten, valt de standaardmodus `code` vóór cataloguscompactie terug op `tools`. In de modus `directory` blijven door de client geleverde tools voor de huidige run rechtstreeks zichtbaar, terwijl OpenClaw-tools, plugintools en MCP-tools achter de directorycatalogus kunnen worden gecompacteerd. Een rechtstreekse aanroep van een exacte verborgen directorynaam wordt vóór uitvoering vanuit dezelfde geautoriseerde catalogus geladen.

Alle modi zijn experimenteel. Geef voor kleine catalogi met OpenClaw-tools de voorkeur aan rechtstreekse beschikbaarstelling van tools en gebruik voor runs van de Codex-harness bij voorkeur de stabiele, eigen Codex-interfaces.

Er is geen afzonderlijke configuratie voor bronselectie. Wanneer Tool Search is ingeschakeld, bevat de catalogus na normale beleidsfiltering de daarvoor geschikte OpenClaw-, MCP- en clienttools; tools die uitsluitend rechtstreeks beschikbaar zijn, worden afzonderlijk behouden.

## Waarom dit bestaat

Grote catalogi zijn nuttig, maar kostbaar. Als elk toolschema naar het model wordt verzonden, wordt het verzoek groter, verloopt de planning trager en neemt de kans toe dat per ongeluk een tool wordt geselecteerd.

Tool Search verandert de vorm:

- rechtstreekse tools: het model ziet elk geselecteerd schema vóór het eerste token
- codemodus van Tool Search: het model ziet één compacte codetool, een kort API-contract en eventuele tools die uitsluitend rechtstreeks beschikbaar zijn
- toolmodus van Tool Search: het model ziet drie compacte, gestructureerde terugvaltools plus eventuele tools die uitsluitend rechtstreeks beschikbaar zijn
- directorymodus van Tool Search: het model ziet een begrensde directory plus besturingselementen voor zoeken, beschrijven en aanroepen, een kleine begrensde verzameling waarschijnlijke of vereiste schema's en eventuele tools die uitsluitend rechtstreeks beschikbaar zijn
- tijdens de beurt: het model kan de overige schema's naar behoefte laden

Rechtstreekse beschikbaarstelling van tools blijft de juiste standaard voor kleine catalogi. Tool Search is het meest geschikt wanneer één run toegang kan hebben tot veel tools, met name van MCP-servers of door clients geleverde app-tools.

## API

`openclaw.tools.search(query, options?)`

Doorzoekt de effectieve catalogus voor de huidige run. De resultaten zijn compact en kunnen veilig weer in de promptcontext worden opgenomen.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Laadt de volledige metagegevens voor één zoekresultaat, inclusief het exacte invoerschema.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Roept een geselecteerde tool aan via OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

De gestructureerde terugvalmodus stelt dezelfde bewerkingen als tools beschikbaar:

- `tool_search`
- `tool_describe`
- `tool_call`

De directorymodus stelt het volgende beschikbaar:

- `tool_search`
- `tool_describe`
- `tool_call`

Daarnaast houdt deze modus door de client geleverde tools en alle tools die uitsluitend rechtstreeks beschikbaar zijn direct zichtbaar en kan deze voor de huidige beurt rechtstreeks een kleine begrensde verzameling waarschijnlijke of vereiste schema's van catalogustools beschikbaar stellen. Als vermeldingen in de begrensde directory ontbreken, gebruikt u `tool_search` om ze te vinden. Als het model rechtstreeks de exacte naam van een verborgen directorytool opvraagt, laadt OpenClaw deze vóór de normale uitvoering vanuit de geautoriseerde catalogus.
De namen van clienttools in de directorymodus mogen niet conflicteren met namen van OpenClaw-, plugin- of MCP-tools, omdat exacte uitgestelde dispatch deze namen gebruikt.

## Runtimegrens

De codebridge wordt uitgevoerd in een kortlevend Node-subproces. Het subproces start met de toestemmingsmodus van Node ingeschakeld, een lege omgeving, zonder toegang tot het bestandssysteem of netwerk en zonder toestemming voor childprocessen of workers. OpenClaw handhaaft vanuit het hoofdproces een time-out op basis van verstreken tijd en beëindigt het subproces bij een time-out, ook na asynchrone vervolgstappen.

De runtime stelt uitsluitend het volgende beschikbaar:

- `console.log`, `console.warn` en `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Het normale gedrag van OpenClaw blijft van toepassing op uiteindelijke aanroepen:

- beleid voor het toestaan en weigeren van tools
- toolbeperkingen per agent en per sandbox
- toolbeleid voor kanalen en runtimes
- goedkeuringshooks
- pluginhooks `before_tool_call`
- sessie-identiteit, logboeken en telemetrie

## Configuratie

Schakel Tool Search voor OpenClaw-runs in met de standaardcodebridge:

```bash
openclaw config set tools.toolSearch true
```

Gelijkwaardige JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gebruik in plaats daarvan de gestructureerde terugvaltools voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Gebruik in plaats daarvan de compacte directory-interface voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Pas de time-out van de codemodus en de limieten voor zoekresultaten aan (de weergegeven waarden zijn de standaardwaarden):

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

De runtime begrenst `codeTimeoutMs` tot 1000-60000, `maxSearchLimit` tot 1-50 en `searchDefaultLimit` tot 1..`maxSearchLimit`.

Schakel de functie uit:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt en telemetrie

Tool Search registreert voldoende telemetrie om de functie te vergelijken met rechtstreekse beschikbaarstelling van tools:

- het totale aantal geserialiseerde bytes aan tools en prompts dat naar de harness wordt verzonden
- de catalogusgrootte en uitsplitsing per bron
- het aantal zoek-, beschrijf- en aanroepbewerkingen
- uiteindelijke toolaanroepen die via OpenClaw zijn uitgevoerd
- geselecteerde tool-id's en bronnen

Aan de hand van sessielogboeken moeten de volgende vragen kunnen worden beantwoord:

- hoeveel toolschema's het model vooraf heeft gezien
- hoeveel zoek- en beschrijfbewerkingen het heeft uitgevoerd
- welke uiteindelijke tool is aangeroepen
- of het resultaat afkomstig was van OpenClaw, MCP of een clienttool

## E2E-validatie

Het Gatewayscenario van QA Lab bewijst beide paden met de OpenClaw-runtime:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Het maakt een tijdelijke nepplugin met een grote toolcatalogus, start de gesimuleerde OpenAI-provider, start eenmaal een Gateway in de rechtstreekse modus en eenmaal met Tool Search ingeschakeld, en vergelijkt vervolgens de verzoekpayloads van de provider en de sessielogboeken.

De regressietest bewijst:

1. De rechtstreekse modus kan de tool van de nepplugin aanroepen.
2. Tool Search kan dezelfde tool van de nepplugin aanroepen.
3. De rechtstreekse modus stelt de schema's van de nepplugintools rechtstreeks beschikbaar aan de provider.
4. Tool Search stelt uitsluitend de compacte bridge en eventuele tools die uitsluitend rechtstreeks beschikbaar zijn beschikbaar.
5. De verzoekpayload van Tool Search is kleiner voor de grote nepcatalogus.
6. De sessielogboeken tonen de verwachte aantallen toolaanroepen en telemetrie van aanroepen via de bridge.

## Gedrag bij fouten

Tool Search moet gesloten falen:

- als een tool niet binnen het effectieve beleid valt, mag de zoekfunctie deze niet retourneren
- als een geselecteerde tool niet meer beschikbaar is, moet `tool_call` mislukken
- als beleid of goedkeuring de uitvoering blokkeert, moet het aanroepresultaat die blokkering melden in plaats van deze te omzeilen
- als de codebridge geen geïsoleerde runtime kan maken, gebruikt u `mode: "tools"` of schakelt u Tool Search voor die implementatie uit

## Gerelateerd

- [Tools en plugins](/nl/tools)
- [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
- [Exec-tool](/nl/tools/exec)
- [Configuratie van ACP-agents](/nl/tools/acp-agents-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
