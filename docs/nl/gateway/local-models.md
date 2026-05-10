---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je sluit LM Studio of een OpenAI-compatibele proxy aan
    - Je hebt de veiligste richtlijnen voor lokale modellen nodig
summary: OpenClaw uitvoeren op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-05-10T19:37:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale modellen zijn haalbaar. Ze leggen ook de lat hoger voor hardware, contextgrootte en verdediging tegen prompt-injectie — kleine of agressief gekwantiseerde kaarten kappen context af en lekken veiligheid. Deze pagina is de uitgesproken gids voor high-end lokale stacks en aangepaste lokale servers die OpenAI-compatibel zijn. Voor onboarding met de minste frictie begin je met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`.

Voor lokale servers die alleen moeten starten wanneer een geselecteerd model ze nodig heeft, zie
[Lokale modelservices](/nl/gateway/local-model-services).

## Hardwareminimum

Mik hoog: **≥2 maximaal uitgeruste Mac Studios of een vergelijkbare GPU-rig (~$30k+)** voor een comfortabele agentlus. Een enkele **24 GB** GPU werkt alleen voor lichtere prompts met hogere latency. Draai altijd de **grootste / volledige variant die je kunt hosten**; kleine of sterk gekwantiseerde checkpoints verhogen het risico op prompt-injectie (zie [Beveiliging](/nl/gateway/security)).

## Kies een backend

| Backend                                              | Gebruik wanneer                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/nl/providers/lmstudio)                     | Eerste lokale setup, GUI-loader, native Responses API                       |
| [Ollama](/nl/providers/ollama)                          | CLI-workflow, modelbibliotheek, systemd-service zonder handmatige bediening |
| MLX / vLLM / SGLang                                  | Zelf gehoste serving met hoge doorvoer en een OpenAI-compatibel HTTP-eindpunt |
| LiteLLM / OAI-proxy / aangepaste OpenAI-compatibele proxy | Je een andere model-API ervoor zet en OpenClaw die als OpenAI moet behandelen |

Gebruik Responses API (`api: "openai-responses"`) wanneer de backend dit ondersteunt (LM Studio doet dat). Blijf anders bij Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** De officiële Linux-installer van Ollama schakelt een systemd-service in met `Restart=always`. Op WSL2 GPU-setups kan autostart het laatst gebruikte model tijdens het opstarten opnieuw laden en hostgeheugen vastzetten. Als je WSL2-VM herhaaldelijk opnieuw opstart na het inschakelen van Ollama, zie [WSL2-crashloop](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Aanbevolen: LM Studio + groot lokaal model (Responses API)

De beste huidige lokale stack. Laad een groot model in LM Studio (bijvoorbeeld een full-size Qwen-, DeepSeek- of Llama-build), schakel de lokale server in (standaard `http://127.0.0.1:1234`) en gebruik Responses API om redenering gescheiden te houden van definitieve tekst.

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

**Setupchecklist**

- Installeer LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Download in LM Studio de **grootste beschikbare modelbuild** (vermijd "small"/sterk gekwantiseerde varianten), start de server en bevestig dat `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de werkelijke model-ID die in LM Studio wordt getoond.
- Houd het model geladen; koud laden voegt opstartlatency toe.
- Pas `contextWindow`/`maxTokens` aan als je LM Studio-build afwijkt.
- Blijf voor WhatsApp bij Responses API, zodat alleen definitieve tekst wordt verzonden.

Houd gehoste modellen geconfigureerd, zelfs wanneer je lokaal draait; gebruik `models.mode: "merge"` zodat fallbacks beschikbaar blijven.

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

Wissel de primaire en fallback-volgorde om; houd hetzelfde providers-blok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale machine niet beschikbaar is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regio-vaste eindpunten (bijv. in de VS gehost). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacytraject; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle over datastromen wilt.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtig `/v1/chat/completions`
eindpunt aanbieden. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het providers-blok hierboven door je
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

De waarde `models.providers.<id>.models[].id` is provider-lokaal. Neem daar
geen providerprefix in op. Een MLX-server die bijvoorbeeld is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet deze
catalogus-ID en modelverwijzing gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede vision-modellen zodat
beeldbijlagen in agentbeurten worden geïnjecteerd. Interactieve onboarding voor aangepaste providers
leidt gangbare vision-model-ID's af en vraagt alleen naar onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende vision-ID's of `--custom-text-input` wanneer een bekend ogend model
achter je eindpunt alleen tekst ondersteunt.

Houd `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De provider-timeout
geldt alleen voor model-HTTP-verzoeken, inclusief connectie, headers, bodystreaming
en de totale abort van de bewaakte fetch.

<Note>
Voor aangepaste OpenAI-compatibele providers is het opslaan van een niet-geheime lokale marker zoals `apiKey: "ollama-local"` toegestaan wanneer `baseUrl` verwijst naar loopback, een privaat LAN, `.local` of een kale hostnaam. OpenClaw behandelt dit als een geldige lokale referentie in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsnotitie voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-eindpunten
- native OpenAI-specifieke request-shaping is hier niet van toepassing: geen
  `service_tier`, geen Responses `store`, geen OpenAI reasoning-compat payload
  shaping en geen prompt-cache-hints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet geïnjecteerd op deze aangepaste proxy-URL's

Compatibiliteitsnotities voor strengere OpenAI-compatibele backends:

- Sommige servers accepteren bij Chat Completions alleen string `messages[].content`, niet
  gestructureerde content-part-arrays. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die eindpunten.
- Sommige lokale modellen geven zelfstandige toolverzoeken tussen haken uit als tekst, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw promoveert
  die alleen tot echte tool calls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen voor antwoorden die gebruikers zien.
- Als een model JSON, XML of ReAct-achtige tekst uitvoert die op een tool call lijkt
  maar de provider geen gestructureerde aanroep heeft uitgegeven, laat OpenClaw dit als
  tekst staan en logt een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als tool-call-incompatibiliteit van provider/model,
  niet als een voltooide toolrun.
- Als tools verschijnen als assistenttekst in plaats van uitgevoerd te worden, bijvoorbeeld ruwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  controleer dan eerst of de server een chattemplate/parser gebruikt die tool calls ondersteunt. Voor
  OpenAI-compatibele Chat Completions-backends waarvan de parser alleen werkt wanneer toolgebruik
  wordt afgedwongen, stel je een request-override per model in in plaats van te vertrouwen op tekstparsing:

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
  Het overschrijft de standaard proxywaarde van OpenClaw van `tool_choice: "auto"`.
  Vervang `local/my-local-model` door de exacte provider/model-verwijzing die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI-reasoning efforts accepteert buiten
  het ingebouwde profiel, declareer ze dan in het compat-blok van het model. Door hier `"xhigh"`
  toe te voegen, tonen `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
  validatie het niveau voor die geconfigureerde provider/model-verwijzing:

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

## Kleinere of strengere backends

Als het model schoon laadt maar volledige agentbeurten zich verkeerd gedragen, werk dan van boven naar beneden — bevestig eerst het transport en vernauw daarna het oppervlak.

1. **Bevestig dat het lokale model zelf reageert.** Geen hulpmiddelen, geen agentcontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bevestig Gateway-routering.** Verstuurt alleen de opgegeven prompt — slaat transcript, AGENTS-bootstrap, samenstelling door de context-engine, hulpmiddelen en gebundelde MCP-servers over, maar test nog steeds Gateway-routering, authenticatie en providerselectie:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probeer lean-modus.** Als beide probes slagen maar echte agentbeurten mislukken met misvormde hulpmiddelaanroepen of te grote prompts, schakel dan `agents.defaults.experimental.localModelLean: true` in. Dit verwijdert de drie zwaarste standaardhulpmiddelen (`browser`, `cron`, `message`), zodat de promptvorm kleiner en minder kwetsbaar is. Zie [Experimentele functies → Lean-modus voor lokaal model](/nl/concepts/experimental-features#local-model-lean-mode) voor de volledige uitleg, wanneer je dit gebruikt en hoe je bevestigt dat het is ingeschakeld.

4. **Schakel hulpmiddelen als laatste redmiddel volledig uit.** Als lean-modus niet genoeg is, stel dan `models.providers.<provider>.models[].compat.supportsTools: false` in voor die modelvermelding. De agent werkt dan zonder hulpmiddelaanroepen op dat model.

5. **Daarna ligt de bottleneck upstream.** Als de backend na lean-modus en `supportsTools: false` nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem meestal upstream-model- of servercapaciteit — contextvenster, GPU-geheugen, kv-cacheverwijdering of een backendbug. Op dat punt is het niet de transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad opnieuw; een cold start is een veelvoorkomende oorzaak van “hangen”.
- Lokale server meldt `terminated`, `ECONNRESET`, of sluit de stream halverwege de beurt?
  OpenClaw registreert een low-cardinality `model.call.error.failureKind` plus de
  RSS/heap-snapshot van het OpenClaw-proces in diagnostiek. Vergelijk bij
  geheugendruk in LM Studio/Ollama die timestamp met het serverlog of macOS-crash- /
  jetsam-log om te bevestigen of de modelserver is beëindigd.
- OpenClaw leidt preflightdrempels voor het contextvenster af uit het gedetecteerde modelvenster, of uit het niet-afgetopte modelvenster wanneer `agents.defaults.contextTokens` het effectieve venster verlaagt. Het waarschuwt onder 20% met een ondergrens van **8k**. Harde blokkades gebruiken de drempel van 10% met een ondergrens van **4k**, afgetopt op het effectieve contextvenster zodat te ruime modelmetadata geen anders geldige gebruikerslimiet kan afwijzen. Als je die preflight raakt, verhoog dan de contextlimiet van de server/het model of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- OpenAI-compatibele server retourneert `messages[].content ... expected a string`?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- OpenAI-compatibele server retourneert `validation.keys` of zegt dat berichtitems alleen `role` en `content` toestaan?
  Voeg `compat.strictMessageKeys: true` toe aan die modelvermelding.
- Directe kleine `/v1/chat/completions`-aanroepen werken, maar `openclaw infer model run --local`
  faalt op Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelreferentie, authenticatiemarkering
  en serverlogs; lokale `model run` bevat geen agenthulpmiddelen.
  Als lokale `model run` slaagt maar grotere agentbeurten falen, verklein dan het
  hulpmiddelenoppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Hulpmiddelaanroepen verschijnen als ruwe JSON/XML/ReAct-tekst, of de provider retourneert een
  lege `tool_calls`-array? Voeg geen proxy toe die assistenttekst blind omzet
  in uitvoering van hulpmiddelen. Repareer eerst de chattemplate/parser van de server. Als het
  model alleen werkt wanneer hulpmiddelgebruik wordt afgedwongen, voeg dan de per-model
  override `params.extra_body.tool_choice: "required"` hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een hulpmiddelaanroep wordt verwacht.
- Veiligheid: lokale modellen slaan filters aan providerzijde over; houd agents smal en Compaction ingeschakeld om de blast radius van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Modelfailover](/nl/concepts/model-failover)
