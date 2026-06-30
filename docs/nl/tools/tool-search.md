---
read_when:
    - Je wilt dat OpenClaw-agents een grote toolcatalogus gebruiken zonder elk toolschema aan de prompt toe te voegen
    - Je wilt OpenClaw-tools, MCP-tools en clienttools beschikbaar maken via één compact runtime-oppervlak
    - Je implementeert of debugt hulpmiddelontdekking voor OpenClaw-uitvoeringen
summary: 'Toolzoekfunctie: comprimeer grote OpenClaw-toolcatalogi achter zoeken, beschrijven en aanroepen'
title: Zoeken naar tools
x-i18n:
    generated_at: "2026-06-30T14:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

De toolzoekfunctie is een experimentele OpenClaw-agentruntimefunctie. Deze geeft agents een
compacte manier om grote toolcatalogi te ontdekken en aan te roepen. Dit is nuttig wanneer de run
veel beschikbare tools heeft, maar het model waarschijnlijk maar enkele daarvan nodig heeft.

Deze pagina documenteert de OpenClaw-toolzoekfunctie. Dit is niet de Codex-native toolzoek- of
dynamic-tools-oppervlakte. Codex-native code mode, tool search, deferred
dynamic tools en nested tool calls zijn stabiele Codex-harnessoppervlakken en zijn
niet afhankelijk van `tools.toolSearch`.

Wanneer dit is ingeschakeld voor OpenClaw-runs, ontvangt het model standaard één `tool_search_code`-tool.
Die tool voert een korte JavaScript-body uit in een geïsoleerd Node-subproces
met een `openclaw.tools`-bridge:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

De catalogus kan OpenClaw-tools, Plugin-tools, MCP-tools en door de client
geleverde tools bevatten. Het model ziet niet vooraf elk volledig schema.
In plaats daarvan doorzoekt het compacte descriptoren, beschrijft het één geselecteerde tool wanneer het
het exacte schema nodig heeft, en roept het die tool aan via OpenClaw.

Codex-harnessruns ontvangen deze experimentele OpenClaw-toolzoekbediening
niet. OpenClaw geeft productmogelijkheden door aan Codex als dynamic tools, en
Codex is eigenaar van de stabiele native code mode, native tool search, deferred dynamic
tools en nested tool calls.

## Hoe een beurt wordt uitgevoerd

Tijdens de planning bouwt de ingesloten OpenClaw-runner de effectieve catalogus voor de
run:

1. Los het actieve toolbeleid op voor de agent, het profiel, de sandbox en de sessie.
2. Geef geschikte OpenClaw- en Plugin-tools weer.
3. Geef geschikte MCP-tools weer via de MCP-runtime van de sessie.
4. Voeg geschikte clienttools toe die voor de huidige run zijn geleverd.
5. Indexeer compacte descriptoren voor zoeken.
6. Stel de OpenClaw-codebridge, de gestructureerde fallbacktools of het
   compacte directoryoppervlak beschikbaar aan het model.

Tijdens de uitvoering keert elke echte toolaanroep terug naar OpenClaw. De geïsoleerde Node-runtime
bevat geen Plugin-implementaties, MCP-clientobjecten of geheimen.
`openclaw.tools.call(...)` gaat over de bridge terug naar de Gateway, waar het
normale beleid, goedkeuring, hooks, logging en resultaatverwerking nog steeds van toepassing zijn.

## Modi

`tools.toolSearch` heeft drie modelgerichte modi:

- `code`: stelt `tool_search_code` beschikbaar, de standaard compacte JavaScript-bridge.
- `tools`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar als gewone
  gestructureerde tools voor providers die geen code moeten ontvangen.
- `directory`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar plus een
  begrensde promptdirectory met beschikbare toolnamen en beschrijvingen voor
  providers die toolnamen moeten zien zonder elk volledig schema. OpenClaw kan
  ook een kleine begrensde set waarschijnlijke of vereiste toolschema's direct
  voor de huidige beurt beschikbaar stellen.

Alle modi gebruiken dezelfde door beleid gefilterde catalogus en het normale OpenClaw-uitvoeringspad.
Als de huidige runtime het geïsoleerde Node-kindproces voor code mode niet kan starten,
valt de standaard `code`-modus terug op `tools` vóór cataloguscompactie.
In `directory`-modus blijven door de client geleverde tools direct zichtbaar
voor de huidige run, terwijl OpenClaw-tools, Plugin-tools en MCP-tools achter
de directorycatalogus kunnen worden gecompacteerd. Een directe aanroep naar een exacte verborgen
directorynaam wordt vóór uitvoering vanuit dezelfde geautoriseerde catalogus gehydrateerd.

Alle modi zijn experimenteel. Geef de voorkeur aan directe toolblootstelling voor kleine OpenClaw-toolcatalogi,
en geef de voorkeur aan de Codex-native stabiele oppervlakken voor Codex-harnessruns.

Er is geen aparte configuratie voor bronselectie. Wanneer de toolzoekfunctie is ingeschakeld, bevat de
catalogus geschikte OpenClaw-, MCP- en clienttools na normale beleidsfiltering.

## Waarom dit bestaat

Grote catalogi zijn nuttig maar duur. Elk toolschema naar het model sturen
maakt de aanvraag groter, vertraagt de planning en verhoogt de kans op
onbedoelde toolselectie.

De toolzoekfunctie verandert de vorm:

- directe tools: het model ziet elk geselecteerd schema vóór het eerste token
- code mode van de toolzoekfunctie: het model ziet één compacte codetool en een korte API-contract
- tools-modus van de toolzoekfunctie: het model ziet drie compacte gestructureerde fallbacktools
- directorymodus van de toolzoekfunctie: het model ziet een begrensde directory plus
  zoek-/beschrijf-/aanroepbediening en een kleine begrensde set waarschijnlijke of vereiste
  schema's
- tijdens de beurt: het model kan resterende schema's laden wanneer nodig

Directe toolblootstelling blijft de juiste standaard voor kleine catalogi. De toolzoekfunctie
is het beste wanneer één run veel tools kan zien, vooral van MCP-servers of
door clients geleverde apptools.

## API

`openclaw.tools.search(query, options?)`

Doorzoekt de effectieve catalogus voor de huidige run. Resultaten zijn compact en veilig
om terug te plaatsen in de promptcontext.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Laadt volledige metadata voor één zoekresultaat, inclusief het exacte invoerschema.

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

De gestructureerde fallbackmodus stelt dezelfde bewerkingen beschikbaar als tools:

- `tool_search`
- `tool_describe`
- `tool_call`

Directorymodus stelt beschikbaar:

- `tool_search`
- `tool_describe`
- `tool_call`

Deze houdt ook door de client geleverde tools direct zichtbaar en kan een kleine
begrensde set waarschijnlijke of vereiste catalogustoolschema's direct beschikbaar stellen voor de huidige
beurt. Als de begrensde directory vermeldingen weglaat, gebruik dan `tool_search` om ze te vinden. Als
het model direct een exacte verborgen directorytoolnaam opvraagt, hydrateert OpenClaw
deze vanuit de geautoriseerde catalogus vóór normale uitvoering.
Toolnamen van clienttools in directorymodus mogen niet botsen met OpenClaw-, Plugin- of MCP-
toolnamen, omdat exacte uitgestelde dispatch die namen gebruikt.

## Runtimegrens

De codebridge draait in een kortlevend Node-subproces. Het subproces start
met Node permission mode ingeschakeld, een lege omgeving, geen bestandssysteem- of
netwerktoekenningen, en geen child-process- of worker-toekenningen. OpenClaw dwingt een
wall-clock-time-out van het bovenliggende proces af en stopt het subproces bij time-out, inclusief
na async-voortzettingen.

De runtime stelt alleen beschikbaar:

- `console.log`, `console.warn` en `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normaal OpenClaw-gedrag blijft van toepassing op uiteindelijke aanroepen:

- beleid voor toestaan en weigeren van tools
- toolbeperkingen per agent en per sandbox
- toolbeleid van kanaal/runtime
- goedkeuringshooks
- Plugin-`before_tool_call`-hooks
- sessie-identiteit, logs en telemetrie

## Configuratie

Schakel de toolzoekfunctie in voor OpenClaw-runs met de standaard codebridge:

```bash
openclaw config set tools.toolSearch true
```

Equivalente JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gebruik in plaats daarvan de gestructureerde fallbacktools voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Gebruik in plaats daarvan het compacte directoryoppervlak voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Stem de time-out van code mode en limieten voor zoekresultaten af:

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

Schakel dit uit:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt en telemetrie

De toolzoekfunctie registreert voldoende telemetrie om deze te vergelijken met directe toolblootstelling:

- totaal aantal geserialiseerde tool- en promptbytes dat naar de harness is verzonden
- catalogusgrootte en uitsplitsing naar bron
- aantallen zoek-, beschrijf- en aanroepbewerkingen
- uiteindelijke toolaanroepen uitgevoerd via OpenClaw
- geselecteerde tool-id's en bronnen

Sessielogs moeten het mogelijk maken om te beantwoorden:

- hoeveel toolschema's het model vooraf zag
- hoeveel zoek- en beschrijfbewerkingen het uitvoerde
- welke uiteindelijke tool werd aangeroepen
- of het resultaat afkomstig was van OpenClaw, MCP of een clienttool

## E2E-validatie

Het QA Lab Gateway-scenario bewijst beide paden met de OpenClaw-runtime:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Het maakt een tijdelijke nep-Plugin met een grote toolcatalogus, start de mock-
OpenAI-provider, start een Gateway eenmaal in directe modus en eenmaal met de toolzoekfunctie
ingeschakeld, en vergelijkt vervolgens provideraanvraagpayloads en sessielogs.

De regressie bewijst:

1. Directe modus kan de nep-Plugin-tool aanroepen.
2. De toolzoekfunctie kan dezelfde nep-Plugin-tool aanroepen.
3. Directe modus stelt de schema's van de nep-Plugin-tool direct beschikbaar aan de provider.
4. De toolzoekfunctie stelt alleen de compacte bridge beschikbaar.
5. De aanvraagpayload van de toolzoekfunctie is kleiner voor de grote nepcatalogus.
6. Sessielogs tonen de verwachte aantallen toolaanroepen en telemetrie van bridged aanroepen.

## Foutgedrag

De toolzoekfunctie moet fail-closed zijn:

- als een tool niet in het effectieve beleid staat, mag zoeken deze niet retourneren
- als een geselecteerde tool onbeschikbaar wordt, moet `tool_call` falen
- als beleid of goedkeuring uitvoering blokkeert, moet het aanroepresultaat die
  blokkade rapporteren in plaats van deze te omzeilen
- als de codebridge geen geïsoleerde runtime kan maken, gebruik dan `mode: "tools"` of
  schakel de toolzoekfunctie uit voor die deployment

## Gerelateerd

- [Tools en plugins](/nl/tools)
- [Multi-agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools)
- [Exec-tool](/nl/tools/exec)
- [ACP-agents instellen](/nl/tools/acp-agents-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
