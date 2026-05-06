---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je sluit LM Studio of een OpenAI-compatibele proxy aan
    - U hebt de veiligste richtlijnen voor lokale modellen nodig
summary: OpenClaw uitvoeren op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-05-06T09:13:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale modellen zijn haalbaar. Ze leggen de lat ook hoger voor hardware, contextgrootte en verdediging tegen prompt-injectie — kleine of agressief gekwantiseerde kaarten kappen context af en ondermijnen veiligheid. Deze pagina is de uitgesproken gids voor lokale stacks in het hogere segment en aangepaste OpenAI-compatibele lokale servers. Voor onboarding met de minste wrijving begin je met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`.

## Hardwareminimum

Mik hoog: **≥2 maximaal uitgeruste Mac Studios of een vergelijkbare GPU-rig (~$30k+)** voor een comfortabele agentlus. Een enkele **24 GB** GPU werkt alleen voor lichtere prompts met hogere latentie. Draai altijd de **grootste / volledige variant die je kunt hosten**; kleine of zwaar gekwantiseerde checkpoints vergroten het risico op prompt-injectie (zie [Beveiliging](/nl/gateway/security)).

## Kies een backend

| Backend                                              | Gebruik wanneer                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/nl/providers/lmstudio)                     | Eerste lokale installatie, GUI-loader, native Responses API                    |
| [Ollama](/nl/providers/ollama)                          | CLI-workflow, modelbibliotheek, hands-off systemd-service                      |
| MLX / vLLM / SGLang                                  | Self-hosted serving met hoge doorvoer via een OpenAI-compatibel HTTP-eindpunt |
| LiteLLM / OAI-proxy / aangepaste OpenAI-compatibele proxy | Je een andere model-API ervoor zet en OpenClaw die als OpenAI moet behandelen         |

Gebruik Responses API (`api: "openai-responses"`) wanneer de backend dit ondersteunt (LM Studio doet dat). Blijf anders bij Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-gebruikers:** De officiële Linux-installer van Ollama schakelt een systemd-service in met `Restart=always`. Bij WSL2 GPU-setups kan autostart tijdens het opstarten het laatste model opnieuw laden en hostgeheugen vastpinnen. Als je WSL2-VM herhaaldelijk opnieuw opstart na het inschakelen van Ollama, zie [WSL2-crashlus](/nl/providers/ollama#wsl2-crash-loop-repeated-reboots).
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

**Installatiechecklist**

- Installeer LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Download in LM Studio de **grootste beschikbare modelbuild** (vermijd "small"/zwaar gekwantiseerde varianten), start de server en bevestig dat `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de werkelijke model-ID die in LM Studio wordt getoond.
- Houd het model geladen; koud laden voegt opstartlatentie toe.
- Pas `contextWindow`/`maxTokens` aan als jouw LM Studio-build verschilt.
- Blijf voor WhatsApp bij Responses API zodat alleen definitieve tekst wordt verzonden.

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

Wissel de primaire en fallback-volgorde om; behoud hetzelfde providers-blok en `models.mode: "merge"` zodat je kunt terugvallen op Sonnet of Opus wanneer de lokale box niet beschikbaar is.

### Regionale hosting / dataroutering

- Gehoste MiniMax/Kimi/GLM-varianten bestaan ook op OpenRouter met regiogebonden eindpunten (bijv. gehost in de VS). Kies daar de regionale variant om verkeer binnen je gekozen jurisdictie te houden terwijl je nog steeds `models.mode: "merge"` gebruikt voor Anthropic/OpenAI-fallbacks.
- Alleen lokaal blijft het sterkste privacytraject; gehoste regionale routering is de middenweg wanneer je providerfuncties nodig hebt maar controle wilt over de gegevensstroom.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of aangepaste
gateways werken als ze een OpenAI-achtig `/v1/chat/completions`
eindpunt aanbieden. Gebruik de Chat Completions-adapter tenzij de backend expliciet
ondersteuning voor `/v1/responses` documenteert. Vervang het providerblok hierboven door je
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
vertrouwd; LAN-, tailnet- en privé-DNS-eindpunten hebben nog steeds
`request.allowPrivateNetwork: true` nodig.

De waarde `models.providers.<id>.models[].id` is provider-lokaal. Neem daar
de providerprefix niet in op. Een MLX-server die is gestart met
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` moet bijvoorbeeld deze
catalogus-ID en modelreferentie gebruiken:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in op lokale of geproxiede vision-modellen zodat
afbeeldingsbijlagen in agentbeurten worden ingevoegd. Interactieve onboarding voor aangepaste providers
leidt gangbare vision-model-ID's af en vraagt alleen om onbekende namen.
Niet-interactieve onboarding gebruikt dezelfde afleiding; gebruik `--custom-image-input`
voor onbekende vision-ID's of `--custom-text-input` wanneer een bekend ogend model
achter je eindpunt alleen tekst ondersteunt.

Behoud `models.mode: "merge"` zodat gehoste modellen beschikbaar blijven als fallbacks.
Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale of externe modelservers
voordat je `agents.defaults.timeoutSeconds` verhoogt. De provider-time-out
geldt alleen voor model-HTTP-verzoeken, inclusief verbinden, headers, bodystreaming
en de totale bewaakte fetch-afbreking.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt het bewaren van een niet-geheime lokale marker zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` naar loopback, een privé-LAN, `.local` of een kale hostnaam verwijst. OpenClaw behandelt dit als geldige lokale referenties in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor elke provider die een publieke hostnaam accepteert.
</Note>

Gedragsnotitie voor lokale/geproxiede `/v1`-backends:

- OpenClaw behandelt deze als proxy-achtige OpenAI-compatibele routes, niet als native
  OpenAI-eindpunten
- native request shaping die alleen voor OpenAI geldt, is hier niet van toepassing: geen
  `service_tier`, geen Responses `store`, geen payload-shaping voor OpenAI reasoning-compat,
  en geen prompt-cache-hints
- verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
  worden niet ingevoegd op deze aangepaste proxy-URL's

Compatibiliteitsnotities voor strengere OpenAI-compatibele backends:

- Sommige servers accepteren bij Chat Completions alleen string `messages[].content`, geen
  gestructureerde contentpart-arrays. Stel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` in voor
  die eindpunten.
- Sommige lokale modellen geven zelfstandige bracketed tool-aanvragen als tekst uit, zoals
  `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw zet
  die alleen om in echte tool-calls wanneer de naam exact overeenkomt met een geregistreerde
  tool voor de beurt; anders wordt het blok behandeld als niet-ondersteunde tekst en
  verborgen voor gebruikerszichtbare antwoorden.
- Als een model JSON, XML of ReAct-achtige tekst uitvoert die eruitziet als een tool-call
  maar de provider geen gestructureerde aanroep heeft uitgevoerd, laat OpenClaw dit als
  tekst staan en logt het een waarschuwing met de run-ID, provider/model, gedetecteerd patroon en
  toolnaam wanneer beschikbaar. Behandel dat als incompatibiliteit van provider/model met tool-calls,
  niet als een voltooide toolrun.
- Als tools als assistenttekst verschijnen in plaats van te draaien, bijvoorbeeld ruwe JSON,
  XML, ReAct-syntaxis of een lege `tool_calls`-array in de providerrespons,
  verifieer dan eerst dat de server een chattemplate/parser gebruikt die tool-calls ondersteunt. Voor
  OpenAI-compatibele Chat Completions-backends waarvan de parser alleen werkt wanneer toolgebruik
  wordt afgedwongen, stel je een request-override per model in in plaats van te vertrouwen op tekst
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
  Het overschrijft de standaard proxywaarde van OpenClaw: `tool_choice: "auto"`.
  Vervang `local/my-local-model` door de exacte provider/model-referentie die wordt getoond door
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Als een aangepast OpenAI-compatibel model OpenAI-redeneerinspanningen accepteert buiten
  het ingebouwde profiel, declareer die dan in het compat-blok van het model. Door hier `"xhigh"`
  toe te voegen, laten `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-
  validatie het niveau zien voor die geconfigureerde provider/model-referentie:

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

Als het model schoon laadt maar volledige agentbeurten zich verkeerd gedragen, werk dan top-down — bevestig eerst het transport en beperk daarna het oppervlak.

1. **Controleer of het lokale model zelf reageert.** Geen hulpmiddelen, geen agentcontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Controleer Gateway-routering.** Verstuurt alleen de opgegeven prompt — slaat transcript, AGENTS-bootstrap, context-engine-assemblage, hulpmiddelen en gebundelde MCP-servers over, maar test nog steeds Gateway-routering, authenticatie en providerselectie:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probeer de slanke modus.** Als beide probes slagen maar echte agentbeurten mislukken met verkeerd gevormde hulpmiddelaanroepen of te grote prompts, schakel dan `agents.defaults.experimental.localModelLean: true` in. Dit laat de drie zwaarste standaardhulpmiddelen (`browser`, `cron`, `message`) weg, zodat de promptvorm kleiner en minder kwetsbaar is. Zie [Experimentele functies → Slanke modus voor lokale modellen](/nl/concepts/experimental-features#local-model-lean-mode) voor de volledige uitleg, wanneer je dit gebruikt en hoe je bevestigt dat het is ingeschakeld.

4. **Schakel hulpmiddelen als laatste redmiddel volledig uit.** Als de slanke modus niet genoeg is, stel dan `models.providers.<provider>.models[].compat.supportsTools: false` in voor die modelvermelding. De agent werkt dan zonder hulpmiddelaanroepen op dat model.

5. **Daarna ligt de flessenhals upstream.** Als de backend na de slanke modus en `supportsTools: false` nog steeds alleen faalt bij grotere OpenClaw-runs, is het resterende probleem meestal upstream model- of servercapaciteit — contextvenster, GPU-geheugen, kv-cacheverdringing of een backendbug. Op dat moment ligt het niet meer aan de transportlaag van OpenClaw.

## Probleemoplossing

- Kan Gateway de proxy bereiken? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-model niet geladen? Laad opnieuw; een koude start is een veelvoorkomende oorzaak van "hangen".
- Zegt de lokale server `terminated`, `ECONNRESET`, of sluit deze de stream halverwege de beurt?
  OpenClaw registreert een `model.call.error.failureKind` met lage cardinaliteit plus de
  RSS/heap-snapshot van het OpenClaw-proces in diagnostiek. Voor geheugenbelasting bij LM Studio/Ollama
  vergelijk je die tijdstempel met het serverlogboek of het macOS-crash- /
  jetsam-logboek om te bevestigen of de modelserver is beëindigd.
- OpenClaw leidt contextvenster-preflightdrempels af uit het gedetecteerde modelvenster, of uit het onbeperkte modelvenster wanneer `agents.defaults.contextTokens` het effectieve venster verlaagt. Het waarschuwt onder 20% met een ondergrens van **8k**. Harde blokkades gebruiken de drempel van 10% met een ondergrens van **4k**, begrensd tot het effectieve contextvenster zodat te grote modelmetadata geen anderszins geldige gebruikerslimiet kunnen afwijzen. Als je deze preflight raakt, verhoog dan de server-/modelcontextlimiet of kies een groter model.
- Contextfouten? Verlaag `contextWindow` of verhoog je serverlimiet.
- Geeft een OpenAI-compatibele server `messages[].content ... expected a string` terug?
  Voeg `compat.requiresStringContent: true` toe aan die modelvermelding.
- Werken directe kleine `/v1/chat/completions`-aanroepen, maar faalt `openclaw infer model run --local`
  op Gemma of een ander lokaal model? Controleer eerst de provider-URL, modelreferentie, authenticatiemarkering
  en serverlogboeken; lokale `model run` bevat geen agenthulpmiddelen.
  Als lokale `model run` slaagt maar grotere agentbeurten falen, verklein dan het
  hulpmiddeloppervlak van de agent met `localModelLean` of `compat.supportsTools: false`.
- Verschijnen hulpmiddelaanroepen als ruwe JSON/XML/ReAct-tekst, of geeft de provider een
  lege `tool_calls`-array terug? Voeg geen proxy toe die assistenttekst blindelings omzet
  in hulpmiddeluitvoering. Herstel eerst de chattemplate/parser van de server. Als het
  model alleen werkt wanneer hulpmiddelgebruik wordt afgedwongen, voeg dan de per-model
  `params.extra_body.tool_choice: "required"`-override hierboven toe en gebruik die modelvermelding
  alleen voor sessies waarin bij elke beurt een hulpmiddeloproep wordt verwacht.
- Veiligheid: lokale modellen slaan providerfilters over; houd agents beperkt en Compaction ingeschakeld om de impact van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Modelfailover](/nl/concepts/model-failover)
