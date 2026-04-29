---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je sluit LM Studio of een OpenAI-compatibele proxy aan
    - Je hebt de veiligste richtlijnen voor lokale modellen nodig
summary: OpenClaw uitvoeren op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-04-29T22:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

Lokaal is haalbaar, maar OpenClaw verwacht een grote context + sterke verdediging tegen prompt-injectie. Kleine kaarten kappen context af en laten veiligheid lekken. Mik hoog: **≥2 maximaal uitgeruste Mac Studios of een vergelijkbare GPU-rig (~$30k+)**. Een enkele **24 GB** GPU werkt alleen voor lichtere prompts met hogere latentie. Gebruik de **grootste / volledige modelvariant die je kunt draaien**; agressief gekwantiseerde of “kleine” checkpoints verhogen het risico op prompt-injectie (zie [Beveiliging](/nl/gateway/security)).

Als je de lokale setup met de minste frictie wilt, begin dan met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`. Deze pagina is de uitgesproken gids voor lokale stacks in het hogere segment en aangepaste OpenAI-compatibele lokale servers.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** Het officiële Linux-installatieprogramma van Ollama schakelt een systemd-service in met `Restart=always`. Op WSL2-GPU-setups kan autostart het laatste model tijdens het opstarten opnieuw laden en hostgeheugen vastzetten. Als je WSL2-VM herhaaldelijk opnieuw opstart na het inschakelen van Ollama, zie [WSL2-crashloop](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Aanbevolen: LM Studio + groot lokaal model (Responses API)

Beste huidige lokale stack. Laad een groot model in LM Studio (bijvoorbeeld een volledige Qwen-, DeepSeek- of Llama-build), schakel de lokale server in (standaard `http://127.0.0.1:1234`) en gebruik Responses API om redenering gescheiden te houden van de uiteindelijke tekst.

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
- Houd het model geladen; koud laden voegt opstartlatentie toe.
- Pas `contextWindow`/`maxTokens` aan als je LM Studio-build afwijkt.
- Houd je voor WhatsApp aan Responses API, zodat alleen uiteindelijke tekst wordt verzonden.

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

### Eerst lokaal met gehost vangnet

Wissel de volgorde van primair en fallback om; behoud hetzelfde providers-blok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale machine offline is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regio-gebonden eindpunten (bijv. gehost in de VS). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacypad; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle wilt over datastromen.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtig `/v1/chat/completions`-
eindpunt aanbieden. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het provider-blok hierboven door je
eindpunt en model-ID:

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

Als `api` wordt weggelaten bij een aangepaste provider met een `baseUrl`, gebruikt OpenClaw standaard
`openai-completions`. Loopback-eindpunten zoals `127.0.0.1` worden automatisch
vertrouwd; LAN-, tailnet- en private DNS-eindpunten hebben nog steeds
`request.allowPrivateNetwork: true` nodig.

De waarde `models.providers.<id>.models[].id` is lokaal voor de provider. Neem daar
het provider-voorvoegsel niet in op. Bijvoorbeeld: een MLX-server die is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet deze
catalogus-ID en modelreferentie gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede vision-modellen zodat beeldbijlagen
in agentbeurten worden geïnjecteerd. Interactieve onboarding voor aangepaste providers
leidt gangbare vision-model-ID's af en vraagt alleen om onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende vision-ID's of `--custom-text-input` wanneer een model dat er bekend uitziet
achter je eindpunt alleen tekst ondersteunt.

Houd `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De providertime-out geldt
alleen voor model-HTTP-verzoeken, inclusief verbinden, headers, body-streaming
en de totale bewaakte fetch-afbreking.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt het bewaren van een niet-geheime lokale markering zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` naar loopback, een privé-LAN, `.local` of een kale hostnaam resolveert. OpenClaw behandelt dit als een geldige lokale credential in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsopmerking voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-eindpunten
- native request shaping die alleen voor OpenAI geldt, is hier niet van toepassing: geen
  `service_tier`, geen Responses `store`, geen OpenAI reasoning-compat payload
  shaping en geen prompt-cachehints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet geïnjecteerd op deze aangepaste proxy-URL's

Compatibiliteitsopmerkingen voor strengere OpenAI-compatibele backends:

- Sommige servers accepteren bij Chat Completions alleen string-`messages[].content`, geen
  gestructureerde arrays met contentonderdelen. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die eindpunten.
- Sommige lokale modellen geven zelfstandige, tussen blokhaken geplaatste toolverzoeken als tekst uit, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw promoveert
  die alleen naar echte tool calls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen voor gebruikerszichtbare antwoorden.
- Als een model JSON, XML of ReAct-achtige tekst uitzendt die op een tool call lijkt
  maar de provider geen gestructureerde aanroep heeft uitgezonden, laat OpenClaw dit als
  tekst staan en logt een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als incompatibiliteit van provider/model met tool calls,
  niet als een voltooide toolrun.
- Als tools als assistant-tekst verschijnen in plaats van te draaien, bijvoorbeeld ruwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  controleer dan eerst of de server een chattemplate/parser gebruikt die tool calls ondersteunt. Voor
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
  Dit overschrijft de standaard proxywaarde van OpenClaw: `tool_choice: "auto"`.
  Vervang `local/my-local-model` door de exacte provider/model-referentie die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI reasoning efforts accepteert buiten
  het ingebouwde profiel, declareer die dan in het compat-blok van het model. Door hier `"xhigh"`
  toe te voegen, stellen `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
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

- Sommige kleinere of strengere lokale backends zijn instabiel met de volledige
  promptvorm van de agent-runtime van OpenClaw, vooral wanneer toolschema's zijn inbegrepen. Controleer eerst
  het providerpad met de slanke lokale probe:

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
  maar slaat opzettelijk eerdere sessietranscripten, AGENTS/bootstrap-context,
  context-engine-assemblage, tools en gebundelde MCP-servers over.

  Als dat slaagt maar normale OpenClaw-agentbeurten mislukken, probeer dan eerst
  `agents.defaults.experimental.localModelLean: true` om zware
  standaardtools zoals `browser`, `cron` en `message` weg te laten; dit is een experimentele
  vlag, geen stabiele instelling voor de standaardmodus. Zie
  [Experimentele functies](/nl/concepts/experimental-features). Als dat nog steeds mislukt, probeer dan
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Als de backend nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem
  meestal upstream model-/servercapaciteit of een backendbug, niet de
  transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad opnieuw; een koude start is een veelvoorkomende oorzaak van “vastlopen”.
- Lokale server meldt `terminated`, `ECONNRESET`, of sluit de stream halverwege de beurt?
  OpenClaw registreert een lage-cardinaliteit `model.call.error.failureKind` plus de
  RSS-/heap-snapshot van het OpenClaw-proces in diagnostiek. Voor geheugendruk bij LM Studio/Ollama
  vergelijk je die tijdstempel met het serverlog of macOS-crash- /
  jetsam-log om te bevestigen of de modelserver is beëindigd.
- OpenClaw waarschuwt wanneer het gedetecteerde contextvenster lager is dan **32k** en blokkeert onder **16k**. Als je die preflight raakt, verhoog dan de contextlimiet van de server/het model of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- OpenAI-compatibele server retourneert `messages[].content ... expected a string`?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- Directe kleine `/v1/chat/completions`-aanroepen werken, maar `openclaw infer model run --local`
  faalt bij Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelreferentie, auth-
  marker en serverlogs; lokale `model run` bevat geen agenttools.
  Als lokale `model run` slaagt maar grotere agentbeurten mislukken, verklein dan het
  tooloppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Tool-calls verschijnen als ruwe JSON/XML/ReAct-tekst, of de provider retourneert een
  lege `tool_calls`-array? Voeg geen proxy toe die assistenttekst blind omzet
  in tooluitvoering. Repareer eerst de chattemplate/parser van de server. Als het
  model alleen werkt wanneer toolgebruik wordt afgedwongen, voeg dan de per-model
  `params.extra_body.tool_choice: "required"`-override hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een tool-call wordt verwacht.
- Veiligheid: lokale modellen slaan filters aan providerzijde over; houd agents beperkt en Compaction ingeschakeld om de impact van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Model-failover](/nl/concepts/model-failover)
