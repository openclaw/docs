---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je koppelt LM Studio of een OpenAI-compatibele proxy
    - Je hebt de veiligste richtlijnen voor lokale modellen nodig
summary: Voer OpenClaw uit op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-06-27T17:34:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale modellen zijn haalbaar. Ze stellen ook hogere eisen aan hardware, contextgrootte en verdediging tegen promptinjectie — kleine of agressief gekwantiseerde kaarten kappen context af en lekken veiligheid. Deze pagina is de uitgesproken handleiding voor lokale stacks in het hogere segment en aangepaste OpenAI-compatibele lokale servers. Voor onboarding met de minste frictie begin je met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`.

Voor lokale servers die alleen moeten starten wanneer een geselecteerd model ze nodig heeft, zie
[Lokale modelservices](/nl/gateway/local-model-services).

## Hardwareminimum

Richt hoog: **≥2 maximaal uitgeruste Mac Studios of een vergelijkbare GPU-rig (~$30k+)** voor een comfortabele agentlus. Eén **24 GB** GPU werkt alleen voor lichtere prompts met hogere latency. Draai altijd de **grootste / volledige variant die je kunt hosten**; kleine of zwaar gekwantiseerde checkpoints verhogen het risico op promptinjectie (zie [Beveiliging](/nl/gateway/security)).

## Kies een backend

| Backend                                              | Gebruik wanneer                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/nl/providers/ds4)                                | Lokale DeepSeek V4 Flash op macOS Metal met OpenAI-compatibele toolcalls    |
| [LM Studio](/nl/providers/lmstudio)                     | Eerste lokale setup, GUI-loader, native Responses API                    |
| LiteLLM / OAI-proxy / aangepaste OpenAI-compatibele proxy | Je een andere model-API front en OpenClaw die als OpenAI moet behandelen         |
| MLX / vLLM / SGLang                                  | Self-hosted serving met hoge doorvoer via een OpenAI-compatibel HTTP-endpoint |
| [Ollama](/nl/providers/ollama)                          | CLI-workflow, modelbibliotheek, hands-off systemd-service                      |

Gebruik Responses API (`api: "openai-responses"`) wanneer de backend dit ondersteunt (LM Studio doet dat). Blijf anders bij Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** De officiële Ollama Linux-installer schakelt een systemd-service in met `Restart=always`. Op WSL2-GPU-setups kan automatisch starten het laatst gebruikte model tijdens het opstarten opnieuw laden en hostgeheugen vastzetten. Als je WSL2-VM herhaaldelijk opnieuw opstart nadat Ollama is ingeschakeld, zie [WSL2-crashlus](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
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

**Setupchecklist**

- Installeer LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Download in LM Studio de **grootste beschikbare modelbuild** (vermijd "small"/zwaar gekwantiseerde varianten), start de server en bevestig dat `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de werkelijke model-ID die in LM Studio wordt getoond.
- Houd het model geladen; koud laden voegt opstartlatency toe.
- Pas `contextWindow`/`maxTokens` aan als je LM Studio-build afwijkt.
- Blijf voor WhatsApp bij Responses API, zodat alleen de uiteindelijke tekst wordt verzonden.

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

Wissel de primaire volgorde en fallbackvolgorde om; houd hetzelfde providersblok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale machine offline is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regio-gebonden endpoints (bijv. gehost in de VS). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacypad; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle wilt over de datastroom.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtig `/v1/chat/completions`
endpoint beschikbaar stellen. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het providersblok hierboven door je
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
`openai-completions`. Aangepaste/lokale providervermeldingen vertrouwen hun exact geconfigureerde
`baseUrl`-oorsprong voor afgeschermde modelverzoeken, inclusief loopback, LAN, tailnet
en private DNS-hosts. Verzoeken naar andere private origins hebben nog steeds
`request.allowPrivateNetwork: true` nodig; metadata-/link-local origins blijven geblokkeerd
zonder expliciete opt-in. Stel dit in op `false` om exact-origin-vertrouwen uit te schakelen.

De waarde `models.providers.<id>.models[].id` is provider-lokaal. Neem daar niet
de providerprefix in op. Een MLX-server die bijvoorbeeld is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet deze
catalogus-ID en modelreferentie gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede visiemodellen, zodat beeldbijlagen
in agentbeurten worden geïnjecteerd. Interactieve onboarding voor aangepaste providers
leidt gangbare visiemodel-ID's af en vraagt alleen naar onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende visie-ID's of `--custom-text-input` wanneer een model dat op een bekend model lijkt
achter je endpoint alleen tekst ondersteunt.

Houd `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De providertime-out
geldt alleen voor model-HTTP-verzoeken, inclusief verbinden, headers, body-streaming
en de totale afbreking van guarded-fetch. Als de agent- of runtime-out lager is, verhoog
dan ook dat plafond, omdat providertime-outs niet de volledige agentrun kunnen verlengen.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt het opslaan van een niet-geheime lokale marker zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` naar loopback, een privé-LAN, `.local` of een kale hostnaam resolveert. OpenClaw behandelt dit als een geldige lokale credential in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsnotitie voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-endpoints
- native OpenAI-only request shaping geldt hier niet: geen
  `service_tier`, geen Responses `store`, geen OpenAI reasoning-compat payload
  shaping en geen prompt-cache hints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet geïnjecteerd op deze aangepaste proxy-URL's

Compatibiliteitsnotities voor strengere OpenAI-compatibele backends:

- Sommige servers accepteren op Chat Completions alleen string `messages[].content`, geen
  gestructureerde arrays met contentonderdelen. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die endpoints.
- Sommige lokale modellen geven zelfstandige bracketed toolverzoeken als tekst uit, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw promoveert
  die alleen tot echte toolcalls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen in gebruikerszichtbare antwoorden.
- Als een model JSON, XML of ReAct-achtige tekst uitgeeft die op een toolcall lijkt,
  maar de provider geen gestructureerde aanroep heeft uitgegeven, laat OpenClaw dit als
  tekst staan en logt het een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als incompatibiliteit van provider/model met toolcalls,
  niet als een voltooide toolrun.
- Als tools als assistenttekst verschijnen in plaats van te draaien, bijvoorbeeld ruwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  controleer dan eerst of de server een chattemplate/parser gebruikt die toolcalls ondersteunt. Voor
  OpenAI-compatibele Chat Completions-backends waarvan de parser alleen werkt wanneer toolgebruik
  wordt afgedwongen, stel je een requestoverride per model in in plaats van te vertrouwen op tekst
  parsing:

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
  Vervang `local/my-local-model` door de exacte provider/model-referentie die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI-redeneerinspanningen accepteert buiten
  het ingebouwde profiel, declareer die dan op het modelcompatblok. Door hier `"xhigh"`
  toe te voegen, worden `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
  validatie het niveau laten tonen voor die geconfigureerde provider/model-referentie:

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

## Kleinere of striktere backends

Als het model netjes laadt, maar volledige agentbeurten zich verkeerd gedragen, werk dan van boven naar beneden: bevestig eerst het transport en beperk daarna het oppervlak.

1. **Bevestig dat het lokale model zelf reageert.** Geen tools, geen agentcontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bevestig Gateway-routering.** Verstuurt alleen de opgegeven prompt: slaat transcript, AGENTS-bootstrap, context-engine-assembly, tools en gebundelde MCP-servers over, maar oefent nog steeds Gateway-routering, auth en providerselectie uit:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probeer lean mode.** Als beide controles slagen maar echte agentbeurten mislukken met misvormde toolaanroepen of te grote prompts, schakel dan `agents.defaults.experimental.localModelLean: true` in. Dit verwijdert de drie zwaarste standaardtools (`browser`, `cron`, `message`) en plaatst grotere toolcatalogi standaard achter gestructureerde Tool Search-bedieningselementen, behalve voor runs die directe semantiek voor `message`-bezorging moeten behouden. Zie [Experimentele functies → Lean mode voor lokaal model](/nl/concepts/experimental-features#local-model-lean-mode) voor de volledige uitleg, wanneer je dit moet gebruiken en hoe je bevestigt dat het is ingeschakeld.

4. **Schakel tools als laatste redmiddel volledig uit.** Als lean mode niet genoeg is, stel dan `models.providers.<provider>.models[].compat.supportsTools: false` in voor die modelvermelding. De agent werkt dan zonder toolaanroepen op dat model.

5. **Daarna ligt de bottleneck upstream.** Als de backend na lean mode en `supportsTools: false` nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem meestal upstream model- of servercapaciteit: contextvenster, GPU-geheugen, kv-cacheverwijdering of een backendbug. Op dat punt is het niet de transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad het opnieuw; een koude start is een veelvoorkomende oorzaak van "hangen".
- Lokale server meldt `terminated`, `ECONNRESET`, of sluit de stream halverwege een beurt?
  OpenClaw registreert een low-cardinality `model.call.error.failureKind` plus de
  RSS/heap-snapshot van het OpenClaw-proces in diagnostiek. Voor geheugendruk bij
  LM Studio/Ollama vergelijk je dat tijdstip met het serverlog of het macOS-crash-/
  jetsam-log om te bevestigen of de modelserver is beëindigd.
- OpenClaw leidt preflight-drempels voor contextvensters af uit het gedetecteerde modelvenster, of uit het onbeperkte modelvenster wanneer `agents.defaults.contextTokens` het effectieve venster verlaagt. Het waarschuwt onder 20% met een ondergrens van **8k**. Harde blokkades gebruiken de drempel van 10% met een ondergrens van **4k**, afgetopt op het effectieve contextvenster zodat te grote modelmetadata geen verder geldige gebruikerslimiet kunnen weigeren. Als je die preflight raakt, verhoog dan de contextlimiet van de server/het model of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- OpenAI-compatibele server retourneert `messages[].content ... expected a string`?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- OpenAI-compatibele server retourneert `validation.keys` of zegt dat berichtvermeldingen alleen `role` en `content` toestaan?
  Voeg `compat.strictMessageKeys: true` toe aan die modelvermelding.
- Directe kleine `/v1/chat/completions`-aanroepen werken, maar `openclaw infer model run --local`
  faalt op Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelverwijzing, auth-
  marker en serverlogs; lokale `model run` bevat geen agenttools.
  Als lokale `model run` slaagt maar grotere agentbeurten falen, verklein dan het
  tooloppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Toolaanroepen verschijnen als ruwe JSON/XML/ReAct-tekst, of de provider retourneert een
  lege `tool_calls`-array? Voeg geen proxy toe die assistenttekst blind omzet
  in tooluitvoering. Herstel eerst de chattemplate/parser van de server. Als het
  model alleen werkt wanneer toolgebruik wordt afgedwongen, voeg dan de per-model
  override `params.extra_body.tool_choice: "required"` hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een toolaanroep wordt verwacht.
- Veiligheid: lokale modellen slaan filters aan providerzijde over; houd agents smal en compaction ingeschakeld om de blast radius van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Modelfailover](/nl/concepts/model-failover)
