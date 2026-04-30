---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T07:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ist eine benutzerfreundliche und zugleich leistungsstarke App zum Ausführen von Open-Weight-Modellen auf Ihrer eigenen Hardware. Sie können damit llama.cpp-Modelle (GGUF) oder MLX-Modelle (Apple Silicon) ausführen. Verfügbar als GUI-Paket oder Headless-Daemon (`llmster`). Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (Headless), und starten Sie dann den lokalen Server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Server starten

Stellen Sie sicher, dass Sie entweder die Desktop-App starten oder den Daemon mit dem folgenden Befehl ausführen:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT für eine reibungslose Nutzung aktiviert ist. Mehr erfahren Sie im [LM Studio JIT- und TTL-Leitfaden](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Wenn die LM Studio-Authentifizierung aktiviert ist, setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM Studio-Authentifizierung deaktiviert ist, können Sie den API-Schlüssel während der interaktiven OpenClaw-Einrichtung leer lassen.

Details zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie das Onboarding aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie im Onboarding die Eingabeaufforderung `Default model`, um Ihr LM Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-Modellreferenzen stellen den Provider-Namen voran: `lmstudio/qwen/qwen3.5-9b`. Sie können den genauen Schlüssel für ein Modell finden, indem Sie `curl http://localhost:1234/api/v1/models` ausführen und das Feld `key` prüfen.

## Nicht interaktives Onboarding

Verwenden Sie nicht interaktives Onboarding, wenn Sie die Einrichtung skripten möchten (CI, Provisionierung, Remote-Bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oder geben Sie die Basis-URL, das Modell und den optionalen API-Schlüssel an:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` akzeptiert den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`), ohne das Provider-Präfix `lmstudio/`.

Für authentifizierte LM Studio-Server übergeben Sie `--lmstudio-api-key` oder setzen Sie `LM_API_TOKEN`.
Für nicht authentifizierte LM Studio-Server lassen Sie den Schlüssel weg; OpenClaw speichert eine lokale, nicht geheime Markierung.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, für LM Studio wird jedoch `--lmstudio-api-key` bevorzugt.

Dies schreibt `models.providers.lmstudio` und setzt das Standardmodell auf `lmstudio/<custom-model-id>`. Wenn Sie einen API-Schlüssel angeben, schreibt die Einrichtung außerdem das Auth-Profil `lmstudio:default`.

Die interaktive Einrichtung kann nach einer optionalen bevorzugten Ladekontextlänge fragen und wendet sie auf die erkannten LM Studio-Modelle an, die sie in der Konfiguration speichert.
Die LM Studio-Plugin-Konfiguration vertraut dem konfigurierten LM Studio-Endpunkt für Modellanfragen, einschließlich Loopback-, LAN- und Tailnet-Hosts. Sie können dies deaktivieren, indem Sie `models.providers.lmstudio.request.allowPrivateNetwork: false` setzen.

## Konfiguration

### Streaming-Nutzungskompatibilität

LM Studio ist mit Streaming-Nutzung kompatibel. Wenn kein OpenAI-förmiges `usage`-Objekt ausgegeben wird, stellt OpenClaw die Token-Zählungen stattdessen aus llama.cpp-artigen Metadaten `timings.prompt_n` / `timings.predicted_n` wieder her.

Dasselbe Streaming-Nutzungsverhalten gilt für diese OpenAI-kompatiblen lokalen Backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Thinking-Kompatibilität

Wenn die Erkennung über `/api/v1/models` von LM Studio modellspezifische Reasoning-Optionen meldet, behält OpenClaw diese nativen Werte in den Modellkompatibilitätsmetadaten bei. Für binäre Thinking-Modelle, die `allowed_options: ["off", "on"]` angeben, ordnet OpenClaw deaktiviertes Thinking `off` und aktivierte `/think`-Stufen `on` zu, statt ausschließlich OpenAI-spezifische Werte wie `low` oder `medium` zu senden.

### Explizite Konfiguration

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

## Fehlerbehebung

### LM Studio nicht erkannt

Stellen Sie sicher, dass LM Studio ausgeführt wird. Wenn die Authentifizierung aktiviert ist, setzen Sie außerdem `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Überprüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

Wenn die Einrichtung HTTP 401 meldet, überprüfen Sie Ihren API-Schlüssel:

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Details zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, lassen Sie den Schlüssel während der Einrichtung leer.

### Just-in-time-Modellladen

LM Studio unterstützt Just-in-time-Modellladen (JIT), bei dem Modelle bei der ersten Anfrage geladen werden. Stellen Sie sicher, dass dies aktiviert ist, um Fehler wie „Model not loaded“ zu vermeiden.

### LM Studio-Host im LAN oder Tailnet

Verwenden Sie die erreichbare Adresse des LM Studio-Hosts, behalten Sie `/v1` bei, und stellen Sie sicher, dass LM Studio auf diesem Computer über Loopback hinaus gebunden ist:

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

Im Gegensatz zu generischen OpenAI-kompatiblen Providern vertraut `lmstudio` automatisch seinem konfigurierten lokalen/privaten Endpunkt für geschützte Modellanfragen. Benutzerdefinierte Loopback-Provider-IDs wie `localhost` oder `127.0.0.1` werden ebenfalls automatisch vertraut; für benutzerdefinierte Provider-IDs im LAN, Tailnet oder privaten DNS setzen Sie `models.providers.<id>.request.allowPrivateNetwork: true` ausdrücklich.

## Verwandte Themen

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
