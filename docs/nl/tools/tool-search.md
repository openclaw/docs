---
read_when:
    - Je wilt dat PI-agenten een grote toolcatalogus gebruiken zonder elk toolschema aan de prompt toe te voegen
    - Je wilt OpenClaw-tools, MCP-tools en clienttools beschikbaar maken via één compact PI-oppervlak
    - Je implementeert of debugt tooldetectie voor Pi-uitvoeringen
summary: 'Toolzoekfunctie: comprimeer grote PI-toolcatalogi achter zoeken, beschrijven en aanroepen'
title: Zoeken naar tools
x-i18n:
    generated_at: "2026-05-11T20:55:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search is een experimentele OpenClaw PI-agentfunctie. Het geeft PI-agenten één
compacte manier om grote toolcatalogi te ontdekken en aan te roepen. Het is nuttig wanneer de run
veel beschikbare tools heeft, maar het model er waarschijnlijk maar enkele nodig heeft.

Deze pagina documenteert OpenClaw PI Tool Search. Het is niet de Codex-native tool
search- of dynamic-tools-surface. Codex-native code mode, tool search, deferred
dynamic tools en nested tool calls zijn stabiele Codex harness-surfaces en zijn
niet afhankelijk van `tools.toolSearch`.

Wanneer dit voor PI is ingeschakeld, ontvangt het model standaard één `tool_search_code`-tool.
Die tool voert een korte JavaScript-body uit in een geïsoleerd Node-subproces met een
`openclaw.tools`-bridge:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

De catalogus kan OpenClaw-tools, Plugin-tools, MCP-tools en
door clients aangeleverde tools bevatten. Het model ziet niet vooraf elk volledig schema.
In plaats daarvan doorzoekt het compacte descriptors, beschrijft het één geselecteerde tool wanneer het
het exacte schema nodig heeft, en roept het die tool aan via OpenClaw.

Codex harness-runs ontvangen deze experimentele OpenClaw Tool Search-controls niet.
OpenClaw geeft productcapaciteiten door aan Codex als dynamic tools, en
Codex beheert de stabiele native code mode, native tool search, deferred dynamic
tools en nested tool calls.

## Hoe een beurt wordt uitgevoerd

Tijdens de planning bouwt de PI embedded runner de effectieve catalogus voor de
run:

1. Los het actieve toolbeleid op voor de agent, het profiel, de sandbox en de sessie.
2. Vermeld geschikte OpenClaw- en Plugin-tools.
3. Vermeld geschikte MCP-tools via de sessie-MCP-runtime.
4. Voeg geschikte clienttools toe die voor de huidige run zijn aangeleverd.
5. Indexeer compacte descriptors voor zoeken.
6. Stel de PI-codebridge of de gestructureerde fallbacktools beschikbaar aan het
   model.

Tijdens uitvoering keert elke echte toolaanroep terug naar OpenClaw. De geïsoleerde Node-
runtime bevat geen Plugin-implementaties, MCP-clientobjecten of geheimen.
`openclaw.tools.call(...)` gaat via de bridge terug naar de Gateway, waar het
normale beleid, goedkeuringen, hooks, logging en resultaatverwerking nog steeds gelden.

## Modi

`tools.toolSearch` heeft twee modelgerichte modi:

- `code`: stelt `tool_search_code` beschikbaar, de standaard compacte JavaScript-bridge.
- `tools`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar als gewone
  gestructureerde tools voor providers die geen code zouden moeten ontvangen.

Beide modi gebruiken dezelfde catalogus en hetzelfde uitvoeringspad. Het enige verschil is de
vorm die het model ziet. Als de huidige runtime het geïsoleerde Node-
childproces voor code mode niet kan starten, valt de standaardmodus `code` terug op `tools` vóór
cataloguscompactie.

Beide modi zijn experimenteel. Geef voor kleine PI-toolcatalogi de voorkeur aan directe
toolblootstelling, en geef voor Codex harness-runs de voorkeur aan de Codex-native stabiele surfaces.

Er is geen afzonderlijke configuratie voor bronselectie. Wanneer Tool Search is ingeschakeld, bevat de
catalogus geschikte OpenClaw-, MCP- en clienttools na normale beleidsfiltering.

## Waarom dit bestaat

Grote catalogi zijn nuttig maar duur. Elk toolschema naar het model sturen
maakt de aanvraag groter, vertraagt de planning en vergroot de kans op onbedoelde
toolselectie.

Tool Search verandert de vorm:

- directe tools: het model ziet elk geselecteerd schema vóór het eerste token
- Tool Search-code mode: het model ziet één compacte codetool en een kort API-
  contract
- Tool Search-tools mode: het model ziet drie compacte gestructureerde fallback-
  tools
- tijdens de beurt: het model laadt alleen de toolschema's die het daadwerkelijk nodig heeft

Directe toolblootstelling blijft de juiste standaard voor kleine catalogi. Tool Search
is het meest geschikt wanneer één run veel tools kan zien, vooral van MCP-servers of
door clients aangeleverde app-tools.

## API

`openclaw.tools.search(query, options?)`

Doorzoekt de effectieve catalogus voor de huidige run. Resultaten zijn compact en veilig
om terug in de promptcontext te plaatsen.

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

## Runtimegrens

De codebridge draait in een kortlevend Node-subproces. Het subproces start
met ingeschakelde Node-permissiemodus, een lege omgeving, geen filesystem- of
netwerkrechten, en geen child-process- of workerrechten. OpenClaw dwingt een
wall-clock-time-out af in het bovenliggende proces en beëindigt het subproces bij time-out, inclusief
na async continuations.

De runtime stelt alleen het volgende beschikbaar:

- `console.log`, `console.warn` en `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normaal OpenClaw-gedrag blijft gelden voor definitieve aanroepen:

- beleid voor het toestaan en weigeren van tools
- toolbeperkingen per agent en per sandbox
- owner-only-afscherming
- goedkeuringshooks
- Plugin-`before_tool_call`-hooks
- sessie-identiteit, logs en telemetrie

## Configuratie

Schakel Tool Search in voor PI-runs met de standaard codebridge:

```bash
openclaw config set tools.toolSearch true
```

Equivalent JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gebruik in plaats daarvan de gestructureerde fallbacktools voor PI-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Stem de time-out voor code mode en limieten voor zoekresultaten af:

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

Schakel het uit:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt en telemetrie

Tool Search registreert voldoende telemetrie om het te vergelijken met directe toolblootstelling:

- totaal aantal geserialiseerde tool- en promptbytes dat naar de harness is gestuurd
- catalogusgrootte en uitsplitsing per bron
- aantallen voor zoeken, beschrijven en aanroepen
- definitieve toolaanroepen uitgevoerd via OpenClaw
- geselecteerde tool-id's en bronnen

Sessielogs zouden het mogelijk moeten maken om te beantwoorden:

- hoeveel toolschema's het model vooraf zag
- hoeveel zoek- en beschrijfbewerkingen het heeft uitgevoerd
- welke definitieve tool is aangeroepen
- of het resultaat afkomstig was van OpenClaw, MCP of een clienttool

## E2E-validatie

De Gateway E2E-runner bewijst beide paden met de PI-harness:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Deze maakt een tijdelijke nep-Plugin met een grote toolcatalogus, start de mock-
OpenAI-provider, start een Gateway één keer in directe modus en één keer met Tool Search
ingeschakeld, en vergelijkt vervolgens provider-requestpayloads en sessielogs.

De regressie bewijst:

1. Directe modus kan de nep-Plugin-tool aanroepen.
2. Tool Search kan dezelfde nep-Plugin-tool aanroepen.
3. Directe modus stelt de schema's van de nep-Plugin-tool rechtstreeks beschikbaar aan de provider.
4. Tool Search stelt alleen de compacte bridge beschikbaar.
5. De Tool Search-requestpayload is kleiner voor de grote nepcatalogus.
6. Sessielogs tonen de verwachte aantallen toolaanroepen en telemetrie voor bridged calls.

## Faalgedrag

Tool Search moet gesloten falen:

- als een tool niet in het effectieve beleid staat, mag zoeken deze niet retourneren
- als een geselecteerde tool niet meer beschikbaar is, moet `tool_call` mislukken
- als beleid of goedkeuring uitvoering blokkeert, moet het aanroepresultaat die
  blokkade melden in plaats van deze te omzeilen
- als de codebridge geen geïsoleerde runtime kan maken, gebruik dan `mode: "tools"` of
  schakel Tool Search uit voor die deployment

## Gerelateerd

- [Tools en plugins](/nl/tools)
- [Multi-agent sandbox en tools](/nl/tools/multi-agent-sandbox-tools)
- [Exec-tool](/nl/tools/exec)
- [ACP-agenten instellen](/nl/tools/acp-agents-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
