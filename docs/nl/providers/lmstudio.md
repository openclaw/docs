---
read_when:
    - Je wilt OpenClaw uitvoeren met opensourcemodellen via LM Studio
    - Je wilt LM Studio instellen en configureren
summary: Voer OpenClaw uit met LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T09:19:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio voert llama.cpp- (GGUF) of MLX-modellen lokaal uit, als GUI-app of als headless `llmster`-daemon. Zie [lmstudio.ai](https://lmstudio.ai/) voor installatie- en productdocumentatie.

## Snel aan de slag

<Steps>
  <Step title="Installeer en start de server">
    Installeer LM Studio (desktop) of `llmster` (headless) en start vervolgens de server:

    ```bash
    lms server start --port 1234
    ```

    Of voer de headless daemon uit:

    ```bash
    lms daemon up
    ```

    Als je de desktop-app gebruikt, schakel dan JIT in om modellen soepel te laden; zie de
    [LM Studio-handleiding voor JIT en TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Stel een API-sleutel in als authenticatie is ingeschakeld">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Als LM Studio-authenticatie is uitgeschakeld, laat je de API-sleutel tijdens de configuratie leeg. Zie
    [LM Studio-authenticatie](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Voer de onboarding uit">
    ```bash
    openclaw onboard
    ```

    Kies `LM Studio` en selecteer vervolgens een model bij de prompt `Default model`.

  </Step>
</Steps>

Wijzig het standaardmodel later:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-modelsleutels gebruiken de notatie `author/model-name` (bijvoorbeeld `qwen/qwen3.5-9b`); OpenClaw-modelreferenties
voegen de provider vooraan toe: `lmstudio/qwen/qwen3.5-9b`. Vind de exacte sleutel voor een model door de
onderstaande opdracht uit te voeren en het veld `key` te bekijken:

```bash
curl http://localhost:1234/api/v1/models
```

## Niet-interactieve onboarding

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Of geef de basis-URL, het model en de API-sleutel expliciet op:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` verwacht de modelsleutel zoals die door LM Studio wordt geretourneerd (bijvoorbeeld `qwen/qwen3.5-9b`), zonder
het providerprefix `lmstudio/`. Geef `--lmstudio-api-key` door (of stel `LM_API_TOKEN` in) voor geauthenticeerde
servers; laat deze weg voor niet-geauthenticeerde servers, waarna OpenClaw in plaats daarvan een lokale, niet-geheime markering opslaat.
`--custom-api-key` wordt om compatibiliteitsredenen nog steeds geaccepteerd, maar `--lmstudio-api-key` heeft de voorkeur.

Dit schrijft `models.providers.lmstudio` en stelt het standaardmodel in op `lmstudio/<custom-model-id>`.
Als je een API-sleutel opgeeft, wordt ook het authenticatieprofiel `lmstudio:default` geschreven.

De interactieve configuratie kan daarnaast vragen naar een gewenste lengte van de laadcontext en past deze toe op
de gevonden modellen die in de configuratie worden opgeslagen.

## Configuratie

### Compatibiliteit van gebruiksgegevens bij streaming

LM Studio levert bij gestreamde reacties niet altijd een `usage`-object in OpenAI-indeling. OpenClaw
herstelt in plaats daarvan de aantallen tokens uit metadata in llama.cpp-stijl: `timings.prompt_n` / `timings.predicted_n`.
Elk OpenAI-compatibel eindpunt dat als lokaal eindpunt wordt herkend (loopback-host), krijgt dezelfde
fallback. Dit geldt ook voor andere lokale backends, zoals vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
en text-generation-webui.

### Compatibiliteit met denkprocessen

Wanneer de detectie via `/api/v1/models` van LM Studio modelspecifieke redeneeropties rapporteert, stelt OpenClaw
overeenkomende waarden voor `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) beschikbaar in
de compatibiliteitsmetadata van het model. Sommige LM Studio-builds bieden een binaire UI-optie (`allowed_options: ["off",
"on"]`) aan, maar weigeren die letterlijke waarden op `/v1/chat/completions`; OpenClaw normaliseert die
binaire vorm naar de schaal met zes niveaus voordat verzoeken worden verzonden, ook voor oudere opgeslagen configuraties die
nog redeneertoewijzingen met `off`/`on` bevatten.

### Expliciete configuratie

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Vooraf laden uitschakelen

LM Studio ondersteunt just-in-time (JIT) laden van modellen, waarbij modellen bij het eerste verzoek worden geladen. OpenClaw
laadt modellen standaard vooraf via het native laadeindpunt van LM Studio, wat helpt wanneer JIT is
uitgeschakeld. Als je in plaats daarvan JIT, de TTL bij inactiviteit en het automatisch verwijderen van LM Studio de levenscyclus van modellen wilt laten beheren,
schakel je de stap voor vooraf laden van OpenClaw uit:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN- of tailnet-host

Gebruik het bereikbare adres van de LM Studio-host, behoud `/v1` en zorg ervoor dat LM Studio op die machine
niet alleen aan loopback is gebonden:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` vertrouwt automatisch het geconfigureerde eindpunt voor modelverzoeken, waaronder loopback-,
LAN- en tailnet-hosts (met uitzondering van metadata- en link-local-herkomsten). Elke aangepaste/lokale OpenAI-compatibele
providervermelding krijgt hetzelfde vertrouwen voor exact dezelfde herkomst. Voor verzoeken aan een andere privéhost of -poort blijft
`models.providers.<id>.request.allowPrivateNetwork: true` vereist; stel dit in op `false` om het
standaardvertrouwen uit te schakelen.

## Probleemoplossing

### LM Studio niet gedetecteerd

Controleer of LM Studio actief is:

```bash
lms server start --port 1234
```

Als authenticatie is ingeschakeld, stel dan ook `LM_API_TOKEN` in. Controleer of de API bereikbaar is:

```bash
curl http://localhost:1234/api/v1/models
```

### Authenticatiefouten (HTTP 401)

- Controleer of `LM_API_TOKEN` overeenkomt met de sleutel die in LM Studio is geconfigureerd.
- Zie [LM Studio-authenticatie](https://lmstudio.ai/docs/developer/core/authentication).
- Als de server geen authenticatie vereist, laat je de sleutel tijdens de configuratie leeg.

## Gerelateerd

- [Modelselectie](/nl/concepts/model-providers)
- [Ollama](/nl/providers/ollama)
- [Lokale modellen](/nl/gateway/local-models)
