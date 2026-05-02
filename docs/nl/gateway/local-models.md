---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je configureert LM Studio of een OpenAI-compatibele proxy
    - Je hebt de veiligste richtlijnen voor lokale modellen nodig
summary: OpenClaw uitvoeren op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-endpoints)
title: Lokale modellen
x-i18n:
    generated_at: "2026-05-02T22:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale modellen zijn haalbaar. Ze leggen de lat ook hoger voor hardware, contextgrootte en verdediging tegen promptinjectie — kleine of agressief gekwantiseerde kaarten kappen context af en laten veiligheid lekken. Deze pagina is de uitgesproken gids voor high-end lokale stacks en aangepaste OpenAI-compatibele lokale servers. Begin voor onboarding met de minste frictie met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`.

## Hardwarebodem

Mik hoog: **≥2 maximaal uitgeruste Mac Studio's of een vergelijkbare GPU-rig (~$30k+)** voor een comfortabele agentloop. Eén **24 GB** GPU werkt alleen voor lichtere prompts met hogere latency. Draai altijd de **grootste / volledige variant die je kunt hosten**; kleine of sterk gekwantiseerde checkpoints verhogen het risico op promptinjectie (zie [Beveiliging](/nl/gateway/security)).

## Kies een backend

| Backend                                              | Gebruik wanneer                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/nl/providers/lmstudio)                     | Eerste lokale setup, GUI-loader, native Responses API                       |
| [Ollama](/nl/providers/ollama)                          | CLI-workflow, modelbibliotheek, hands-off systemd-service                   |
| MLX / vLLM / SGLang                                  | Self-hosted serving met hoge doorvoer via een OpenAI-compatibel HTTP-endpoint |
| LiteLLM / OAI-proxy / aangepaste OpenAI-compatibele proxy | Je een andere model-API voorziet en OpenClaw die als OpenAI moet behandelen |

Gebruik Responses API (`api: "openai-responses"`) wanneer de backend die ondersteunt (LM Studio doet dat). Blijf anders bij Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** De officiële Ollama Linux-installer schakelt een systemd-service in met `Restart=always`. Op WSL2 GPU-setups kan autostart tijdens het booten het laatste model opnieuw laden en hostgeheugen vasthouden. Als je WSL2-VM herhaaldelijk opnieuw opstart na het inschakelen van Ollama, zie [WSL2-crashloop](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Aanbevolen: LM Studio + groot lokaal model (Responses API)

Beste huidige lokale stack. Laad een groot model in LM Studio (bijvoorbeeld een volledige Qwen-, DeepSeek- of Llama-build), schakel de lokale server in (standaard `http://127.0.0.1:1234`) en gebruik Responses API om reasoning gescheiden te houden van de uiteindelijke tekst.

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
- Download in LM Studio de **grootste beschikbare modelbuild** (vermijd “small”/sterk gekwantiseerde varianten), start de server en bevestig dat `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de daadwerkelijke model-ID die in LM Studio wordt getoond.
- Houd het model geladen; koud laden voegt opstartlatency toe.
- Pas `contextWindow`/`maxTokens` aan als je LM Studio-build afwijkt.
- Blijf voor WhatsApp bij Responses API zodat alleen de uiteindelijke tekst wordt verzonden.

Houd gehoste modellen geconfigureerd, ook wanneer je lokaal draait; gebruik `models.mode: "merge"` zodat fallbacks beschikbaar blijven.

### Hybride configuratie: gehoste primaire optie, lokale fallback

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

Wissel de volgorde van primaire optie en fallback; houd hetzelfde providers-blok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale machine down is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regio-gebonden endpoints (bijv. gehost in de VS). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacypad; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle wilt over datastromen.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtig `/v1/chat/completions`
endpoint aanbieden. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het providers-blok hierboven door je
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

Als `api` wordt weggelaten bij een aangepaste provider met een `baseUrl`, gebruikt OpenClaw standaard
`openai-completions`. Loopback-endpoints zoals `127.0.0.1` worden automatisch
vertrouwd; LAN-, tailnet- en privé-DNS-endpoints hebben nog steeds
`request.allowPrivateNetwork: true` nodig.

De waarde `models.providers.<id>.models[].id` is providerspecifiek. Neem daar
het providerprefix niet in op. Een MLX-server die bijvoorbeeld is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet deze
catalogus-ID en modelreferentie gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede vision-modellen zodat afbeeldingsbijlagen
in agentbeurten worden geïnjecteerd. Interactieve onboarding voor aangepaste providers
leidt veelvoorkomende vision-model-ID's af en vraagt alleen naar onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende vision-ID's of `--custom-text-input` wanneer een bekend ogend model
alleen tekst ondersteunt achter je endpoint.

Houd `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De providertime-out
geldt alleen voor HTTP-modelrequests, inclusief verbinden, headers, bodystreaming
en de totale bewaakte fetch-abort.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt het opslaan van een niet-geheime lokale marker zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` verwijst naar loopback, een privé-LAN, `.local` of een kale hostnaam. OpenClaw behandelt dit als geldige lokale credentials in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsnotitie voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-endpoints
- native OpenAI-only request shaping is hier niet van toepassing: geen
  `service_tier`, geen Responses `store`, geen OpenAI reasoning-compat payload
  shaping en geen promptcache-hints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet geïnjecteerd op deze aangepaste proxy-URL's

Compatibiliteitsnotities voor striktere OpenAI-compatibele backends:

- Sommige servers accepteren bij Chat Completions alleen string-`messages[].content`, niet
  gestructureerde content-part-arrays. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die endpoints.
- Sommige lokale modellen geven zelfstandige toolrequests tussen haken als tekst uit, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw promoveert
  die alleen naar echte toolcalls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen voor antwoorden die zichtbaar zijn voor gebruikers.
- Als een model JSON, XML of ReAct-achtige tekst uitgeeft die op een toolcall lijkt
  maar de provider geen gestructureerde aanroep heeft uitgegeven, laat OpenClaw dit als
  tekst staan en logt het een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als incompatibiliteit met toolcalls van provider/model,
  niet als een voltooide toolrun.
- Als tools verschijnen als assistenttekst in plaats van te draaien, bijvoorbeeld rauwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  verifieer dan eerst dat de server een chattemplate/parser gebruikt die toolcalls ondersteunt. Voor
  OpenAI-compatibele Chat Completions-backends waarvan de parser alleen werkt wanneer toolgebruik
  wordt afgedwongen, stel je een request-override per model in in plaats van op tekstparsing
  te vertrouwen:

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
  Het overschrijft de standaard proxywaarde van OpenClaw: `tool_choice: "auto"`.
  Vervang `local/my-local-model` door de exacte provider/model-referentie die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI-reasoninginspanningen accepteert buiten
  het ingebouwde profiel, declareer die dan op het compat-blok van het model. Door hier `"xhigh"`
  toe te voegen, maken `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
  validatie het niveau zichtbaar voor die geconfigureerde provider/model-referentie:

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

Als het model netjes laadt maar volledige agentbeurten zich verkeerd gedragen, werk dan van boven naar beneden — bevestig eerst het transport en verklein daarna het oppervlak.

1. **Bevestig dat het lokale model zelf reageert.** Geen tools, geen agentcontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bevestig Gateway-routering.** Verstuurt alleen de opgegeven prompt — slaat transcript, AGENTS-bootstrap, context-engine-assemblage, tools en gebundelde MCP-servers over, maar oefent nog steeds Gateway-routering, auth en providerselectie uit:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probeer lean-modus.** Als beide probes slagen maar echte agentbeurten mislukken met misvormde toolaanroepen of te grote prompts, schakel dan `agents.defaults.experimental.localModelLean: true` in. Dit verwijdert de drie zwaarste standaardtools (`browser`, `cron`, `message`), zodat de promptvorm kleiner en minder kwetsbaar is. Zie [Experimentele functies → Lean-modus voor lokaal model](/nl/concepts/experimental-features#local-model-lean-mode) voor de volledige uitleg, wanneer je dit gebruikt en hoe je bevestigt dat het aan staat.

4. **Schakel tools als laatste redmiddel volledig uit.** Als lean-modus niet genoeg is, stel dan `models.providers.<provider>.models[].compat.supportsTools: false` in voor die modelvermelding. De agent werkt dan zonder toolaanroepen op dat model.

5. **Daarna ligt de bottleneck upstream.** Als de backend na lean-modus en `supportsTools: false` nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem meestal upstream model- of servercapaciteit — contextvenster, GPU-geheugen, kv-cacheverdrijving of een backendbug. Op dat punt ligt het niet aan de transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad het opnieuw; koude start is een veelvoorkomende oorzaak van “hangen”.
- Zegt de lokale server `terminated`, `ECONNRESET`, of sluit deze de stream halverwege de beurt?
  OpenClaw registreert een laag-cardinaliteit `model.call.error.failureKind` plus de
  RSS/heap-snapshot van het OpenClaw-proces in diagnostics. Voor geheugenbelasting
  bij LM Studio/Ollama vergelijk je die timestamp met het serverlog of macOS-crash- /
  jetsam-log om te bevestigen of de modelserver is beëindigd.
- OpenClaw leidt preflightdrempels voor het contextvenster af uit het gedetecteerde modelvenster, of uit het niet-afgetopte modelvenster wanneer `agents.defaults.contextTokens` het effectieve venster verlaagt. Het waarschuwt onder 20% met een **8k**-ondergrens. Harde blokkades gebruiken de 10%-drempel met een **4k**-ondergrens, afgetopt op het effectieve contextvenster zodat te grote modelmetadata een verder geldige gebruikerslimiet niet kunnen weigeren. Als je die preflight raakt, verhoog dan de contextlimiet van de server/het model of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- Geeft een OpenAI-compatibele server `messages[].content ... expected a string` terug?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- Werken directe kleine `/v1/chat/completions`-aanroepen, maar faalt `openclaw infer model run --local`
  op Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelreferentie, auth-
  marker en serverlogs; lokale `model run` bevat geen agenttools.
  Als lokale `model run` slaagt maar grotere agentbeurten falen, verklein dan het
  tooloppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Verschijnen toolaanroepen als ruwe JSON/XML/ReAct-tekst, of retourneert de provider een
  lege `tool_calls`-array? Voeg geen proxy toe die blind assistenttekst
  omzet in tooluitvoering. Repareer eerst de chat-template/parser van de server. Als het
  model alleen werkt wanneer toolgebruik wordt afgedwongen, voeg dan de per-model
  `params.extra_body.tool_choice: "required"`-override hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een toolaanroep wordt verwacht.
- Veiligheid: lokale modellen slaan providerfilters over; houd agents smal en Compaction aan om de impactradius van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Modelfailover](/nl/concepts/model-failover)
