---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je sluit LM Studio of een OpenAI-compatibele proxy aan
    - Je hebt de veiligste richtlijnen voor lokale modellen nodig
summary: OpenClaw uitvoeren op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-04-30T09:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Lokaal kan, maar OpenClaw verwacht een grote context en sterke verdediging tegen promptinjectie. Kleine kaarten beperken de context en verzwakken de veiligheid. Leg de lat hoog: **≥2 maximaal uitgeruste Mac Studios of een vergelijkbare GPU-rig (~$30k+)**. Een enkele **24 GB** GPU werkt alleen voor lichtere prompts met hogere latency. Gebruik de **grootste / volledige modelvariant die je kunt draaien**; agressief gekwantiseerde of “kleine” checkpoints verhogen het risico op promptinjectie (zie [Beveiliging](/nl/gateway/security)).

Als je de lokale setup met de minste frictie wilt, begin dan met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`. Deze pagina is de uitgesproken gids voor high-end lokale stacks en aangepaste lokale servers die OpenAI-compatibel zijn.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** Het officiële Linux-installatieprogramma van Ollama schakelt een systemd-service in met `Restart=always`. Op WSL2-GPU-setups kan automatisch starten het laatst gebruikte model tijdens het opstarten opnieuw laden en hostgeheugen vastzetten. Als je WSL2-VM herhaaldelijk opnieuw opstart nadat Ollama is ingeschakeld, zie [WSL2-crashloop](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Aanbevolen: LM Studio + groot lokaal model (Responses API)

Beste huidige lokale stack. Laad een groot model in LM Studio (bijvoorbeeld een volledige Qwen-, DeepSeek- of Llama-build), schakel de lokale server in (standaard `http://127.0.0.1:1234`) en gebruik Responses API om redenering gescheiden te houden van de definitieve tekst.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Setup-checklist**

- Installeer LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Download in LM Studio de **grootste beschikbare modelbuild** (vermijd “kleine”/zwaar gekwantiseerde varianten), start de server en bevestig dat `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de daadwerkelijke model-ID die in LM Studio wordt getoond.
- Houd het model geladen; koud laden voegt opstartlatency toe.
- Pas `contextWindow`/`maxTokens` aan als je LM Studio-build afwijkt.
- Houd je voor WhatsApp aan Responses API, zodat alleen definitieve tekst wordt verzonden.

Houd gehoste modellen geconfigureerd, ook wanneer je lokaal draait; gebruik `models.mode: "merge"` zodat fallbacks beschikbaar blijven.

### Hybride configuratie: gehost primair, lokaal als fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Lokaal eerst met gehost vangnet

Wissel de volgorde van primair en fallback om; behoud hetzelfde providers-blok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale machine niet beschikbaar is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regio-vastgezette endpoints (bijv. gehost in de VS). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacytraject; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle wilt over de datastroom.

## Andere lokale proxies die OpenAI-compatibel zijn

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtige `/v1/chat/completions`
endpoint beschikbaar stellen. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het providerblok hierboven door je
endpoint en model-ID:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Als `api` wordt weggelaten op een aangepaste provider met een `baseUrl`, gebruikt OpenClaw standaard
`openai-completions`. Loopback-endpoints zoals `127.0.0.1` worden automatisch
vertrouwd; LAN-, tailnet- en private DNS-endpoints hebben nog steeds
`request.allowPrivateNetwork: true` nodig.

De waarde `models.providers.<id>.models[].id` is lokaal voor de provider. Neem daar
niet het providerprefix in op. Een MLX-server die is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet bijvoorbeeld deze
catalogus-ID en modelreferentie gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede vision-modellen zodat afbeeldingsbijlagen
in agentbeurten worden geïnjecteerd. Interactieve onboarding voor aangepaste providers
leidt veelvoorkomende vision-model-ID's af en vraagt alleen naar onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende vision-ID's of `--custom-text-input` wanneer een bekend ogend model
achter je endpoint alleen tekst ondersteunt.

Houd `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De provider-timeout
geldt alleen voor HTTP-modelverzoeken, inclusief verbinding, headers, body-streaming
en de totale guarded-fetch-afbreking.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt het bewaren van een niet-geheime lokale marker zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` naar loopback, een privaat LAN, `.local` of een bare hostname resolveert. OpenClaw behandelt dit als een geldige lokale credential in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsnotitie voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-endpoints
- native OpenAI-only request shaping is hier niet van toepassing: geen
  `service_tier`, geen Responses `store`, geen OpenAI reasoning-compat payload
  shaping en geen prompt-cachehints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet geïnjecteerd op deze aangepaste proxy-URL's

Compatibiliteitsnotities voor striktere OpenAI-compatibele backends:

- Sommige servers accepteren op Chat Completions alleen string `messages[].content`, geen
  gestructureerde content-part-arrays. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die endpoints.
- Sommige lokale modellen geven zelfstandige toolverzoeken tussen haken uit als tekst, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw promoveert
  die alleen naar echte toolcalls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen voor antwoorden die voor de gebruiker zichtbaar zijn.
- Als een model JSON, XML of ReAct-achtige tekst uitvoert die op een toolcall lijkt
  maar de provider geen gestructureerde aanroep heeft uitgevoerd, laat OpenClaw dit als
  tekst staan en logt het een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als incompatibiliteit met toolcalls van provider/model,
  niet als een voltooide toolrun.
- Als tools als assistenttekst verschijnen in plaats van te worden uitgevoerd, bijvoorbeeld ruwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  controleer dan eerst of de server een chattemplate/parser gebruikt die toolcalls ondersteunt. Voor
  OpenAI-compatibele Chat Completions-backends waarvan de parser alleen werkt wanneer toolgebruik
  wordt afgedwongen, stel je een requestoverride per model in in plaats van te vertrouwen op
  tekstparsing:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Gebruik dit alleen voor modellen/sessies waarbij elke normale beurt een tool moet aanroepen.
  Dit overschrijft de standaard proxywaarde van OpenClaw van `tool_choice: "auto"`.
  Vervang `local/my-local-model` door de exacte provider/model-referentie die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI-redeneringsinspanningen accepteert die verder gaan
  dan het ingebouwde profiel, declareer ze dan op het compat-blok van het model. Door hier `"xhigh"`
  toe te voegen, maken `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
  validatie het niveau beschikbaar voor die geconfigureerde provider/model-referentie:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Sommige kleinere of striktere lokale backends zijn instabiel met de volledige
  agent-runtime-promptvorm van OpenClaw, vooral wanneer toolschema's zijn opgenomen. Controleer eerst
  het providerpad met de lichte lokale probe:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Gebruik in plaats daarvan de Gateway-modelprobe om de Gateway-route zonder de volledige
  agentpromptvorm te controleren:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Zowel lokale als Gateway-modelprobes verzenden alleen de opgegeven prompt. De
  Gateway-probe valideert nog steeds Gateway-routering, auth en providerselectie,
  maar slaat bewust eerdere sessietranscripts, AGENTS/bootstrap-context,
  context-engine-assemblage, tools en gebundelde MCP-servers over.

  Als dat slaagt maar normale OpenClaw-agentbeurten mislukken, probeer dan eerst
  `agents.defaults.experimental.localModelLean: true` om zware
  standaardtools zoals `browser`, `cron` en `message` weg te laten; dit is een experimentele
  vlag, geen stabiele instelling voor standaardmodus. Zie
  [Experimentele functies](/nl/concepts/experimental-features). Als dat nog steeds mislukt, probeer dan
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Als de backend nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem
  meestal capaciteit van het upstream model/de upstream server of een backendbug, niet de
  transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad opnieuw; een koude start is een veelvoorkomende oorzaak van “hangen”.
- Zegt de lokale server `terminated`, `ECONNRESET`, of sluit die de stream halverwege een beurt?
  OpenClaw registreert een low-cardinality `model.call.error.failureKind` plus de
  OpenClaw-proces-RSS/heap-snapshot in diagnostiek. Voor geheugenbelasting bij LM Studio/Ollama
  vergelijk je die tijdstempel met het serverlog of het macOS-crash- /
  jetsam-log om te bevestigen of de modelserver is gestopt.
- OpenClaw leidt drempels voor preflight-controles van het contextvenster af uit het gedetecteerde modelvenster, of uit het niet-afgetopte modelvenster wanneer `agents.defaults.contextTokens` het effectieve venster verlaagt. Het waarschuwt onder 20% met een **8k**-ondergrens. Harde blokkades gebruiken de drempel van 10% met een **4k**-ondergrens, afgetopt op het effectieve contextvenster zodat te grote modelmetadata geen anders geldige gebruikerslimiet kunnen weigeren. Als je die preflight-controle raakt, verhoog dan de contextlimiet van de server/het model of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- Geeft een OpenAI-compatibele server `messages[].content ... expected a string` terug?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- Werken directe kleine `/v1/chat/completions`-aanroepen, maar faalt `openclaw infer model run --local`
  op Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelverwijzing, auth-
  markering en serverlogs; lokale `model run` bevat geen agenttools.
  Als lokale `model run` slaagt maar grotere agentbeurten mislukken, verklein dan het
  tooloppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Verschijnen toolaanroepen als ruwe JSON/XML/ReAct-tekst, of retourneert de provider een
  lege `tool_calls`-array? Voeg geen proxy toe die assistenttekst blind omzet
  in tooluitvoering. Los eerst de chattemplate/parser van de server op. Als het
  model alleen werkt wanneer toolgebruik wordt afgedwongen, voeg dan de per-model
  `params.extra_body.tool_choice: "required"`-override hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een toolaanroep wordt verwacht.
- Veiligheid: lokale modellen slaan filters aan de providerzijde over; houd agents beperkt en Compaction ingeschakeld om de impact van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Model-failover](/nl/concepts/model-failover)
