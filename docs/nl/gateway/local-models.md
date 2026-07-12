---
read_when:
    - Je wilt modellen aanbieden vanaf je eigen GPU-machine
    - Je configureert LM Studio of een OpenAI-compatibele proxy
    - Je hebt richtlijnen nodig voor het veiligste lokale model
summary: Voer OpenClaw uit op lokale LLM's (LM Studio, vLLM, LiteLLM, aangepaste OpenAI-eindpunten)
title: Lokale modellen
x-i18n:
    generated_at: "2026-07-12T08:54:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale modellen werken, maar stellen hogere eisen aan hardware, contextgrootte en bescherming tegen promptinjectie: kleine of agressief gekwantiseerde modellen kappen de context af en slaan veiligheidsfilters aan de providerzijde over. Deze pagina behandelt geavanceerdere lokale stacks en aangepaste OpenAI-compatibele servers. Begin voor de eenvoudigste aanpak met [LM Studio](/nl/providers/lmstudio) of [Ollama](/nl/providers/ollama) en `openclaw onboard`.

Zie [Lokale modelservices](/nl/gateway/local-model-services) voor lokale servers die alleen moeten starten wanneer een geselecteerd model ze nodig heeft.

## Minimale hardwarevereisten

Streef naar **2 of meer maximaal uitgeruste Mac Studio's of een vergelijkbare GPU-installatie (~$30.000+)** voor een soepel draaiende agentlus. Eén GPU met **24 GB** kan alleen lichtere prompts verwerken, met een hogere latentie. Gebruik altijd de **grootste variant of volledige versie die u kunt hosten** — kleine of sterk gekwantiseerde checkpoints verhogen het risico op promptinjectie (zie [Beveiliging](/nl/gateway/security)).

## Kies een backend

| Backend                                              | Gebruiken wanneer                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [ds4](/nl/providers/ds4)                                | Lokale DeepSeek V4 Flash op macOS Metal met OpenAI-compatibele toolaanroepen                        |
| [LM Studio](/nl/providers/lmstudio)                     | Eerste lokale installatie, GUI-lader, systeemeigen Responses API                                   |
| LiteLLM / OAI-proxy / aangepaste OpenAI-compatibele proxy | U een andere model-API ontsluit en wilt dat OpenClaw deze als OpenAI behandelt                  |
| MLX / vLLM / SGLang                                  | Zelfgehoste verwerking met hoge doorvoer en een OpenAI-compatibel HTTP-eindpunt                     |
| [Ollama](/nl/providers/ollama)                          | CLI-workflow, modelbibliotheek, zelfstandig werkende systemd-service                                |

Gebruik `api: "openai-responses"` wanneer de backend dit ondersteunt (LM Studio doet dat). Gebruik anders `api: "openai-completions"`. Als `api` bij een aangepaste provider met een `baseUrl` wordt weggelaten, gebruikt OpenClaw standaard `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** het officiële Ollama-installatieprogramma voor Linux schakelt een systemd-service met `Restart=always` in. Bij WSL2-installaties met een GPU kan automatisch starten tijdens het opstarten het laatstgebruikte model opnieuw laden en het hostgeheugen bezet houden, waardoor de VM herhaaldelijk opnieuw wordt gestart. Zie [WSL2-crashlus](/nl/providers/ollama#troubleshooting).
</Warning>

## LM Studio + groot lokaal model (Responses API)

Dit is momenteel de beste lokale stack. Laad een groot model in LM Studio (een volledige versie van Qwen, DeepSeek of Llama), schakel de lokale server in (standaard `http://127.0.0.1:1234`) en gebruik de Responses API om redeneringen gescheiden te houden van de uiteindelijke tekst.

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

Installatiecontrolelijst:

- Installeer LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Download de **grootste beschikbare modelversie** (vermijd kleine of sterk gekwantiseerde varianten), start de server en controleer of `http://127.0.0.1:1234/v1/models` deze vermeldt.
- Vervang `my-local-model` door de daadwerkelijke model-ID die in LM Studio wordt weergegeven.
- Houd het model geladen; koud laden zorgt voor extra opstartlatentie.
- Pas `contextWindow`/`maxTokens` aan als uw LM Studio-versie hiervan afwijkt.
- Blijf voor WhatsApp bij de Responses API, zodat alleen de uiteindelijke tekst wordt verzonden.
- Behoud `models.mode: "merge"`, zodat gehoste modellen als terugvalopties beschikbaar blijven.

### Hybride configuratie: gehost primair model, lokale terugvaloptie

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

Voor een lokale voorkeursconfiguratie met een gehost vangnet verwisselt u de volgorde van `primary`/`fallbacks` en behoudt u hetzelfde `providers`-blok en `models.mode: "merge"`.

### Regionale hosting en gegevensroutering

Gehoste varianten van MiniMax/Kimi/GLM zijn ook beschikbaar op OpenRouter met aan een regio gekoppelde eindpunten (bijvoorbeeld gehost in de VS). Kies de regionale variant om verkeer binnen het door u gekozen rechtsgebied te houden en behoud `models.mode: "merge"` voor Anthropic/OpenAI-terugvalopties. Alleen lokaal gebruiken biedt nog steeds de beste privacy; gehoste regionale routering is de middenweg wanneer u providerfuncties nodig hebt, maar controle wilt houden over de gegevensstroom.

## Andere OpenAI-compatibele lokale proxy's

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy of een aangepaste Gateway werkt als deze een OpenAI-achtig `/v1/chat/completions`-eindpunt aanbiedt. Gebruik `openai-completions`, tenzij de backend expliciet ondersteuning voor `/v1/responses` documenteert.

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

Vermeldingen voor aangepaste/lokale providers vertrouwen hun exact geconfigureerde `baseUrl`-oorsprong voor beveiligde modelaanvragen, waaronder loopback, LAN, tailnet en hosts met privé-DNS. Oorsprongen voor metadata/link-local worden altijd geblokkeerd. Voor aanvragen naar andere privé-oorsprongen is nog steeds `models.providers.<id>.request.allowPrivateNetwork: true` vereist; stel de vertrouwensvlag in op `false` om vertrouwen in de exacte oorsprong uit te schakelen.

`models.providers.<id>.models[].id` is lokaal voor de provider — neem het providervoorvoegsel niet op. Voor een MLX-server die is gestart met `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Stel `input: ["text", "image"]` in voor lokale of via een proxy aangeboden visiemodellen, zodat afbeeldingsbijlagen in agentbeurten worden ingevoegd. Interactieve onboarding van aangepaste providers herkent gangbare ID's van visiemodellen en stelt alleen vragen over onbekende namen; niet-interactieve onboarding gebruikt dezelfde herkenning, met `--custom-image-input` / `--custom-text-input` om deze te overschrijven.

Gebruik `models.providers.<id>.timeoutSeconds` voor trage lokale/externe modelservers voordat u `agents.defaults.timeoutSeconds` verhoogt. De providertime-out omvat verbinding, headers, streaming van de hoofdtekst en het volledig afbreken van beveiligd ophalen, uitsluitend voor HTTP-modelaanvragen. Als de time-out van de agent/uitvoering lager is, verhoogt u die ook, omdat de providertime-out niet de gehele uitvoering kan verlengen.

<Note>
Voor aangepaste OpenAI-compatibele providers wordt een niet-geheime lokale markering zoals `apiKey: "ollama-local"` geaccepteerd wanneer `baseUrl` wordt omgezet naar loopback, een privé-LAN, `.local` of een kale hostnaam — OpenClaw behandelt deze als geldige lokale referentie in plaats van een ontbrekende sleutel te melden. Gebruik een echte waarde voor providers die een openbare hostnaam accepteren.
</Note>

Gedragsopmerkingen voor lokale of via een proxy aangeboden `/v1`-backends:

- OpenClaw behandelt deze als OpenAI-compatibele proxyroutes, niet als systeemeigen OpenAI-eindpunten.
- Aanvraagvormgeving die alleen voor systeemeigen OpenAI geldt, wordt niet toegepast: geen `service_tier`, geen Responses-`store`, geen OpenAI-compatibele vormgeving van redeneringspayloads en geen aanwijzingen voor promptcaching.
- Verborgen OpenClaw-toeschrijvingsheaders (`originator`, `version`, `User-Agent`) worden niet ingevoegd bij aangepaste proxy-URL's.

Compatibiliteitsoverschrijvingen voor strengere OpenAI-compatibele backends:

- **Alleen tekenreeksinhoud**: sommige servers accepteren voor `messages[].content` alleen tekenreeksen, geen gestructureerde arrays met inhoudsdelen. Stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
- **Strikte berichtsleutels**: als de server berichtvermeldingen met meer dan `role`/`content` weigert, stelt u `compat.strictMessageKeys: true` in.
- **Tooltekst tussen blokhaken**: sommige lokale modellen produceren zelfstandige toolaanvragen als tekst tussen blokhaken, zoals `[tool_name]` gevolgd door JSON en `[END_TOOL_REQUEST]`. OpenClaw zet deze alleen om in echte toolaanroepen wanneer de naam exact overeenkomt met een voor die beurt geregistreerde tool; anders blijft het verborgen, niet-ondersteunde tekst.
- **Ongestructureerde tekst die op een toolaanroep lijkt**: als een model JSON/XML/ReAct-achtige tekst produceert die op een toolaanroep lijkt, maar geen gestructureerde aanroep was, laat OpenClaw deze als tekst staan en registreert het een waarschuwing met de uitvoerings-ID, provider/het model, het gedetecteerde patroon en, indien beschikbaar, de toolnaam. Dit is een incompatibiliteit van de provider/het model, geen voltooide tooluitvoering.
- **Toolgebruik afdwingen**: als tools verschijnen als assistenttekst (onbewerkte JSON/XML/ReAct of een lege `tool_calls`-array), controleert u eerst of de chatsjabloon/parser van de server toolaanroepen ondersteunt. Als de parser alleen werkt wanneer toolgebruik wordt afgedwongen, overschrijft u per model de standaardproxywaarde van `tool_choice: "auto"`:

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

  Gebruik dit alleen wanneer elke normale beurt een tool moet aanroepen. Vervang `local/my-local-model` door de exacte referentie uit `openclaw models list` of stel deze in via de CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Extra redeneerniveaus**: als een aangepast OpenAI-compatibel model naast het ingebouwde profiel extra OpenAI-redeneerniveaus accepteert, declareert u deze in het compatibiliteitsblok van het model. Door `"xhigh"` toe te voegen, wordt dit voor die modelreferentie beschikbaar in `/think xhigh`, sessiekiezers, Gateway-validatie en `llm-task`-validatie:

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

Als het model probleemloos wordt geladen, maar volledige agentbeurten niet goed werken, gaat u van boven naar beneden te werk: controleer eerst het transport en beperk daarna het oppervlak.

1. **Controleer of het lokale model reageert** — zonder tools en zonder agentcontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bevestig Gateway-routering** - verzendt alleen de prompt en slaat het transcript, de AGENTS-bootstrap, de samenstelling van de context-engine, tools en meegeleverde MCP-servers over, maar test nog steeds de Gateway-routering, authenticatie en providerselectie:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probeer de lichte modus** als beide controles slagen, maar echte agentbeurten mislukken met onjuist gevormde toolaanroepen of te grote prompts: stel `agents.defaults.experimental.localModelLean: true` in. Hiermee worden zware tools voor de browser, cron, berichten, mediageneratie, spraak en PDF's weggelaten, tenzij ze expliciet vereist zijn. Grotere toolcatalogi worden standaard achter gestructureerde Tool Search-bedieningselementen geplaatst, terwijl `exec` direct zichtbaar blijft. Zie [Experimentele functies -> Lichte modus voor lokale modellen](/nl/concepts/experimental-features#local-model-lean-mode) voor meer informatie en hoe u controleert of deze is ingeschakeld.

4. **Schakel tools als laatste redmiddel volledig uit** door voor dat model `models.providers.<provider>.models[].compat.supportsTools: false` in te stellen. De agent wordt dan zonder toolaanroepen uitgevoerd.

5. **Daarna ligt het knelpunt stroomopwaarts.** Als de backend na inschakeling van de lichte modus en `supportsTools: false` nog steeds alleen bij grotere OpenClaw-uitvoeringen mislukt, ligt het resterende probleem doorgaans bij het model of de server zelf — het contextvenster, GPU-geheugen, verwijdering uit de kv-cache of een backendfout — en niet bij de transportlaag van OpenClaw.

## Problemen oplossen

- **Kan de Gateway de proxy niet bereiken?** `curl http://127.0.0.1:1234/v1/models`.
- **LM Studio-model niet geladen?** Laad het opnieuw; een koude start is een veelvoorkomende oorzaak van 'vastlopen'.
- **Meldt de lokale server `terminated` of `ECONNRESET`, of sluit deze de stream halverwege een beurt?** OpenClaw registreert in de diagnostische gegevens een `model.call.error.failureKind` met lage cardinaliteit, plus een momentopname van het RSS- en heapgeheugen van het OpenClaw-proces. Vergelijk bij geheugendruk in LM Studio/Ollama die tijdstempel met het serverlogboek of een macOS-crash- of jetsamlogboek om te bevestigen of de modelserver is beëindigd.
- **Contextfouten?** OpenClaw leidt de drempelwaarden voor de voorafgaande controle van het contextvenster af van het gedetecteerde modelvenster (of het begrensde venster wanneer `agents.defaults.contextTokens` dit verlaagt), met een waarschuwing onder 20% en een ondergrens van **8k**, en een harde blokkering onder 10% met een ondergrens van **4k** (begrensd tot het effectieve contextvenster, zodat te grote modelmetagegevens een geldige gebruikerslimiet niet kunnen afwijzen). Verlaag `contextWindow` of verhoog de contextlimiet van de server of het model.
- **`messages[].content ... expected a string`?** Voeg `compat.requiresStringContent: true` toe aan de vermelding van dat model.
- **`validation.keys`, of 'message entries only allow `role` and `content`'?** Voeg `compat.strictMessageKeys: true` toe aan de vermelding van dat model.
- **Werken rechtstreekse aanroepen van `/v1/chat/completions`, maar mislukt `openclaw infer model run --local` bij Gemma of een ander lokaal model?** Controleer eerst de provider-URL, modelverwijzing, authenticatiemarkering en serverlogboeken — `model run` slaat agenttools volledig over. Als `model run` slaagt maar grotere agentbeurten mislukken, verklein dan het tooloppervlak met `localModelLean` of `compat.supportsTools: false`.
- **Verschijnen toolaanroepen als onbewerkte JSON/XML/ReAct-tekst, of retourneert de provider een lege `tool_calls`-array?** Voeg geen proxy toe die assistenttekst blindelings omzet in tooluitvoering — corrigeer eerst de chatsjabloon of parser van de server. Als het model alleen werkt wanneer toolgebruik wordt afgedwongen, voeg dan de bovenstaande overschrijving `params.extra_body.tool_choice: "required"` toe en gebruik die modelvermelding alleen voor sessies waarin bij elke beurt een toolaanroep wordt verwacht.
- **Veiligheid**: lokale modellen slaan filters aan de providerzijde over. Houd agents beperkt en laat Compaction ingeschakeld om de impact van promptinjectie te beperken.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Model-failover](/nl/concepts/model-failover)
