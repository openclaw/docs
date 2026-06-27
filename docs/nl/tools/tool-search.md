---
read_when:
    - Je wilt dat OpenClaw-agenten een grote toolcatalogus gebruiken zonder elk toolschema aan de prompt toe te voegen
    - Je wilt OpenClaw-tools, MCP-tools en clienttools beschikbaar maken via één compact runtime-oppervlak
    - Je implementeert of debugt toolontdekking voor OpenClaw-runs
summary: 'Zoeken in tools: maak grote OpenClaw-toolcatalogi compact achter zoeken, beschrijven en aanroepen'
title: Zoeken naar tools
x-i18n:
    generated_at: "2026-06-27T18:31:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search is een experimentele runtimefunctie voor OpenClaw-agenten. Het geeft agenten één
compacte manier om grote toolcatalogi te ontdekken en aan te roepen. Het is nuttig wanneer de run
veel beschikbare tools heeft, maar het model waarschijnlijk maar een paar daarvan nodig heeft.

Deze pagina documenteert OpenClaw Tool Search. Het is niet de Codex-native tool
search- of dynamic-tools-oppervlakte. Codex-native code mode, tool search, uitgestelde
dynamic tools en geneste toolaanroepen zijn stabiele Codex-harness-oppervlakken en zijn
niet afhankelijk van `tools.toolSearch`.

Wanneer dit is ingeschakeld voor OpenClaw-runs, ontvangt het model standaard één `tool_search_code`-tool.
Die tool voert een korte JavaScript-body uit in een geïsoleerd Node-subproces
met een `openclaw.tools`-brug:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

De catalogus kan OpenClaw-tools, Plugin-tools, MCP-tools en door clients geleverde
tools bevatten. Het model ziet niet vooraf elk volledig schema.
In plaats daarvan doorzoekt het compacte descriptors, beschrijft het één geselecteerde tool wanneer het
het exacte schema nodig heeft, en roept het die tool aan via OpenClaw.

Codex-harness-runs ontvangen deze experimentele OpenClaw Tool Search-besturingselementen niet.
OpenClaw geeft productmogelijkheden door aan Codex als dynamic tools, en
Codex bezit de stabiele native code mode, native tool search, uitgestelde dynamic
tools en geneste toolaanroepen.

## Hoe een beurt wordt uitgevoerd

Tijdens het plannen bouwt de ingesloten runner van OpenClaw de effectieve catalogus voor de
run op:

1. Los het actieve toolbeleid op voor de agent, het profiel, de sandbox en de sessie.
2. Maak een lijst van in aanmerking komende OpenClaw- en Plugin-tools.
3. Maak een lijst van in aanmerking komende MCP-tools via de MCP-runtime van de sessie.
4. Voeg in aanmerking komende clienttools toe die voor de huidige run zijn aangeleverd.
5. Indexeer compacte descriptors voor zoeken.
6. Stel de OpenClaw-codebrug, de gestructureerde fallback-tools of het
   compacte directory-oppervlak beschikbaar aan het model.

Tijdens uitvoering keert elke echte toolaanroep terug naar OpenClaw. De geïsoleerde Node-
runtime bevat geen Plugin-implementaties, MCP-clientobjecten of geheimen.
`openclaw.tools.call(...)` gaat via de brug terug de Gateway in, waar het
normale beleid, goedkeuring, hook, logging en resultaatverwerking nog steeds van toepassing zijn.

## Modi

`tools.toolSearch` heeft drie modelgerichte modi:

- `code`: stelt `tool_search_code` beschikbaar, de standaard compacte JavaScript-brug.
- `tools`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar als gewone
  gestructureerde tools voor providers die geen code zouden moeten ontvangen.
- `directory`: stelt `tool_search`, `tool_describe` en `tool_call` beschikbaar plus een
  begrensde promptdirectory met beschikbare toolnamen en beschrijvingen voor
  providers die toolnamen zouden moeten zien zonder elk volledig schema. OpenClaw kan
  ook een kleine begrensde set waarschijnlijke of vereiste toolschema's rechtstreeks
  beschikbaar stellen voor de huidige beurt.

Alle modi gebruiken dezelfde beleidsgefilterde catalogus en het normale OpenClaw-uitvoeringspad.
Als de huidige runtime het geïsoleerde Node-kindproces voor code mode niet kan starten,
valt de standaardmodus `code` terug op `tools` vóór catalogus-
Compaction. In de modus `directory` blijven door clients geleverde tools rechtstreeks zichtbaar
voor de huidige run, terwijl OpenClaw-tools, Plugin-tools en MCP-tools achter de directorycatalogus kunnen worden
gecomprimeerd. Een rechtstreekse aanroep naar een exacte verborgen
directorynaam wordt vóór uitvoering vanuit dezelfde geautoriseerde catalogus gehydrateerd.

Alle modi zijn experimenteel. Geef de voorkeur aan directe toolblootstelling voor kleine OpenClaw-
toolcatalogi, en geef de voorkeur aan de Codex-native stabiele oppervlakken voor Codex-harness-runs.

Er is geen aparte configuratie voor bronselectie. Wanneer Tool Search is ingeschakeld, bevat de
catalogus in aanmerking komende OpenClaw-, MCP- en clienttools na normale beleidsfiltering.

## Waarom dit bestaat

Grote catalogi zijn nuttig maar duur. Elk toolschema naar het model sturen
maakt de aanvraag groter, vertraagt planning en vergroot de kans op onbedoelde
toolselectie.

Tool Search verandert de vorm:

- directe tools: het model ziet elk geselecteerd schema vóór het eerste token
- Tool Search code mode: het model ziet één compacte codetool en een kort API-
  contract
- Tool Search tools mode: het model ziet drie compacte gestructureerde fallback-
  tools
- Tool Search directory mode: het model ziet een begrensde directory plus
  zoek-/beschrijf-/aanroepbesturing en een kleine begrensde set waarschijnlijke of vereiste
  schema's
- tijdens de beurt: het model kan resterende schema's laden wanneer nodig

Directe toolblootstelling blijft de juiste standaard voor kleine catalogi. Tool Search
is het meest geschikt wanneer één run veel tools kan zien, vooral van MCP-servers of
door clients geleverde app-tools.

## API

`openclaw.tools.search(query, options?)`

Doorzoekt de effectieve catalogus voor de huidige run. Resultaten zijn compact en veilig
om terug te plaatsen in promptcontext.

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

Directory-modus stelt beschikbaar:

- `tool_search`
- `tool_describe`
- `tool_call`

Deze houdt ook door clients geleverde tools rechtstreeks zichtbaar en kan een kleine
begrensde set waarschijnlijke of vereiste catalogustoolschema's rechtstreeks beschikbaar stellen voor de huidige
beurt. Als de begrensde directory vermeldingen weglaat, gebruik dan `tool_search` om ze te vinden. Als
het model rechtstreeks een exacte verborgen directorytoolnaam aanvraagt, hydrateert OpenClaw
die vanuit de geautoriseerde catalogus vóór normale uitvoering.
Toolnamen van clients in directory-modus mogen niet botsen met OpenClaw-, Plugin- of MCP-
toolnamen, omdat exacte uitgestelde dispatch die namen gebruikt.

## Runtimegrens

De codebrug draait in een kortlevend Node-subproces. Het subproces start
met Node-permissiemodus ingeschakeld, een lege omgeving, geen bestandssysteem- of
netwerktoekenningen en geen toekenningen voor kindprocessen of workers. OpenClaw dwingt een
wall-clock-time-out in het ouderproces af en beëindigt het subproces bij time-out, inclusief
na asynchrone voortzettingen.

De runtime stelt alleen beschikbaar:

- `console.log`, `console.warn` en `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normaal OpenClaw-gedrag blijft van toepassing op uiteindelijke aanroepen:

- tool-allow- en deny-beleid
- toolbeperkingen per agent en per sandbox
- toolbeleid van kanaal/runtime
- goedkeuringshooks
- Plugin-`before_tool_call`-hooks
- sessie-identiteit, logs en telemetrie

## Configuratie

Schakel Tool Search voor OpenClaw-runs in met de standaard codebrug:

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

Gebruik in plaats daarvan de gestructureerde fallback-tools voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Gebruik in plaats daarvan het compacte directory-oppervlak voor OpenClaw-runs:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Stem de code-mode-time-out en limieten voor zoekresultaten af:

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

Tool Search legt genoeg telemetrie vast om het te vergelijken met directe toolblootstelling:

- totaal aantal geserialiseerde tool- en promptbytes dat naar de harness is verzonden
- catalogusgrootte en bronuitsplitsing
- aantallen zoek-, beschrijf- en aanroepacties
- uiteindelijke toolaanroepen uitgevoerd via OpenClaw
- geselecteerde tool-id's en bronnen

Sessielogs moeten het mogelijk maken te beantwoorden:

- hoeveel toolschema's het model vooraf zag
- hoeveel zoek- en beschrijfbewerkingen het uitvoerde
- welke uiteindelijke tool werd aangeroepen
- of het resultaat afkomstig was van OpenClaw, MCP of een clienttool

## E2E-validatie

De Gateway E2E-runner bewijst beide paden met de OpenClaw-runtime:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Deze maakt een tijdelijke nep-Plugin met een grote toolcatalogus, start de mock-
OpenAI-provider, start eenmaal een Gateway in directe modus en eenmaal met Tool Search
ingeschakeld, en vergelijkt daarna provider-aanvraagpayloads en sessielogs.

De regressie bewijst:

1. Directe modus kan de nep-Plugin-tool aanroepen.
2. Tool Search kan dezelfde nep-Plugin-tool aanroepen.
3. Directe modus stelt de schema's van de nep-Plugin-tool rechtstreeks beschikbaar aan de provider.
4. Tool Search stelt alleen de compacte brug beschikbaar.
5. De Tool Search-aanvraagpayload is kleiner voor de grote nepcatalogus.
6. Sessielogs tonen de verwachte aantallen toolaanroepen en telemetrie voor overbrugde aanroepen.

## Faalgedrag

Tool Search moet gesloten falen:

- als een tool niet in het effectieve beleid staat, mag zoeken deze niet retourneren
- als een geselecteerde tool niet meer beschikbaar is, moet `tool_call` falen
- als beleid of goedkeuring uitvoering blokkeert, moet het aanroepresultaat die
  blokkade rapporteren in plaats van deze te omzeilen
- als de codebrug geen geïsoleerde runtime kan maken, gebruik dan `mode: "tools"` of
  schakel Tool Search uit voor die deployment

## Gerelateerd

- [Tools en plugins](/nl/tools)
- [Multi-agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools)
- [Exec-tool](/nl/tools/exec)
- [ACP-agenten instellen](/nl/tools/acp-agents-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
