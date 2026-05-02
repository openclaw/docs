---
read_when:
    - Je wilt OpenClaw uitvoeren met opensourcemodellen via LM Studio
    - Je wilt LM Studio instellen en configureren
summary: OpenClaw uitvoeren met LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T11:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio is een gebruiksvriendelijke maar krachtige app om open-weight modellen op je eigen hardware uit te voeren. Hiermee kun je llama.cpp (GGUF)- of MLX-modellen (Apple Silicon) uitvoeren. Beschikbaar als GUI-pakket of headless daemon (`llmster`). Zie voor product- en installatiedocumentatie [lmstudio.ai](https://lmstudio.ai/).

## Snel starten

1. Installeer LM Studio (desktop) of `llmster` (headless), en start daarna de lokale server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Start de server

Zorg dat je de desktop-app start of de daemon uitvoert met de volgende opdracht:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Als je de app gebruikt, zorg dan dat JIT is ingeschakeld voor een soepele ervaring. Lees meer in de [LM Studio JIT- en TTL-handleiding](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Als LM Studio-authenticatie is ingeschakeld, stel dan `LM_API_TOKEN` in:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Als LM Studio-authenticatie is uitgeschakeld, kun je de API-sleutel leeg laten tijdens de interactieve OpenClaw-configuratie.

Zie [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) voor details over het instellen van LM Studio-authenticatie.

4. Voer onboarding uit en kies `LM Studio`:

```bash
openclaw onboard
```

5. Gebruik tijdens onboarding de prompt `Default model` om je LM Studio-model te kiezen.

Je kunt dit ook later instellen of wijzigen:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-modelsleutels volgen de indeling `author/model-name` (bijv. `qwen/qwen3.5-9b`). OpenClaw
modelverwijzingen zetten de providernaam ervoor: `lmstudio/qwen/qwen3.5-9b`. Je kunt de exacte sleutel voor
een model vinden door `curl http://localhost:1234/api/v1/models` uit te voeren en naar het veld `key` te kijken.

## Niet-interactieve onboarding

Gebruik niet-interactieve onboarding wanneer je de configuratie wilt scripten (CI, provisioning, externe bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Of geef de basis-URL, het model en de optionele API-sleutel op:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` gebruikt de modelsleutel zoals die door LM Studio wordt geretourneerd (bijv. `qwen/qwen3.5-9b`), zonder
de providerprefix `lmstudio/`.

Geef voor geauthenticeerde LM Studio-servers `--lmstudio-api-key` door of stel `LM_API_TOKEN` in.
Laat voor niet-geauthenticeerde LM Studio-servers de sleutel weg; OpenClaw slaat een lokale niet-geheime markering op.

`--custom-api-key` blijft ondersteund voor compatibiliteit, maar `--lmstudio-api-key` heeft de voorkeur voor LM Studio.

Dit schrijft `models.providers.lmstudio` en stelt het standaardmodel in op
`lmstudio/<custom-model-id>`. Wanneer je een API-sleutel opgeeft, schrijft de configuratie ook het
authenticatieprofiel `lmstudio:default`.

Interactieve configuratie kan vragen om een optionele voorkeurslengte voor de laadcontext en past die toe op de ontdekte LM Studio-modellen die in de configuratie worden opgeslagen.
De LM Studio Plugin-configuratie vertrouwt het geconfigureerde LM Studio-eindpunt voor modelaanvragen, inclusief loopback-, LAN- en tailnet-hosts. Je kunt je hiervoor afmelden door `models.providers.lmstudio.request.allowPrivateNetwork: false` in te stellen.

## Configuratie

### Compatibiliteit met streaminggebruik

LM Studio is compatibel met streaminggebruik. Wanneer het geen OpenAI-vormgegeven
`usage`-object uitzendt, herstelt OpenClaw in plaats daarvan tokenaantallen uit llama.cpp-achtige
metadata `timings.prompt_n` / `timings.predicted_n`.

Hetzelfde gedrag voor streaminggebruik geldt voor deze OpenAI-compatibele lokale backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibiliteit met denken

Wanneer de modeldetectie van LM Studio via `/api/v1/models` modelspecifieke redeneeropties
rapporteert, bewaart OpenClaw die native waarden in modelcompatibiliteitsmetadata. Voor
binaire denkmodellen die `allowed_options: ["off", "on"]` adverteren,
koppelt OpenClaw uitgeschakeld denken aan `off` en ingeschakelde `/think`-niveaus aan `on`,
in plaats van OpenAI-only waarden zoals `low` of `medium` te verzenden.

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

## Probleemoplossing

### LM Studio niet gedetecteerd

Zorg dat LM Studio actief is. Als authenticatie is ingeschakeld, stel dan ook `LM_API_TOKEN` in:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Controleer of de API toegankelijk is:

```bash
curl http://localhost:1234/api/v1/models
```

### Authenticatiefouten (HTTP 401)

Als de configuratie HTTP 401 meldt, controleer dan je API-sleutel:

- Controleer of `LM_API_TOKEN` overeenkomt met de sleutel die in LM Studio is geconfigureerd.
- Zie [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) voor details over het instellen van LM Studio-authenticatie.
- Als je server geen authenticatie vereist, laat de sleutel dan leeg tijdens de configuratie.

### Just-in-time model laden

LM Studio ondersteunt just-in-time (JIT) model laden, waarbij modellen bij de eerste aanvraag worden geladen. OpenClaw laadt modellen standaard vooraf via het native laadeindpunt van LM Studio, wat helpt wanneer JIT is uitgeschakeld. Schakel de preload-stap van OpenClaw uit om LM Studio's JIT-, idle TTL- en auto-evict-gedrag de modellevenscyclus te laten beheren:

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

### LAN- of tailnet-LM Studio-host

Gebruik het bereikbare adres van de LM Studio-host, behoud `/v1`, en zorg dat LM Studio op die machine buiten loopback is gebonden:

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

In tegenstelling tot generieke OpenAI-compatibele providers vertrouwt `lmstudio` automatisch zijn geconfigureerde lokale/private eindpunt voor bewaakte modelaanvragen. Aangepaste loopback-provider-ID's zoals `localhost` of `127.0.0.1` worden ook automatisch vertrouwd; stel voor aangepaste provider-ID's voor LAN, tailnet of private DNS expliciet `models.providers.<id>.request.allowPrivateNetwork: true` in.

## Gerelateerd

- [Modelselectie](/nl/concepts/model-providers)
- [Ollama](/nl/providers/ollama)
- [Lokale modellen](/nl/gateway/local-models)
