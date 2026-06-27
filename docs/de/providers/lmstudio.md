---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:05:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ist eine zugängliche und zugleich leistungsstarke App zum Ausführen von Open-Weight-Modellen auf Ihrer eigenen Hardware. Sie können damit llama.cpp-Modelle (GGUF) oder MLX-Modelle (Apple Silicon) ausführen. Es gibt LM Studio als GUI-Paket oder als Headless-Daemon (`llmster`). Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (Headless), und starten Sie dann den lokalen Server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Starten Sie den Server

Stellen Sie sicher, dass Sie entweder die Desktop-App starten oder den Daemon mit folgendem Befehl ausführen:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT aktiviert ist, um eine reibungslose Nutzung zu ermöglichen. Weitere Informationen finden Sie im [LM Studio JIT- und TTL-Leitfaden](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Wenn die LM Studio-Authentifizierung aktiviert ist, setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM Studio-Authentifizierung deaktiviert ist, können Sie den API-Schlüssel während der interaktiven OpenClaw-Einrichtung leer lassen.

Details zur LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie das Onboarding aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie im Onboarding die Eingabeaufforderung `Default model`, um Ihr LM Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-Modellreferenzen stellen den Provider-Namen voran: `lmstudio/qwen/qwen3.5-9b`. Den genauen Schlüssel für ein Modell finden Sie, indem Sie `curl http://localhost:1234/api/v1/models` ausführen und das Feld `key` ansehen.

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

`--custom-model-id` akzeptiert den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`), ohne den Provider-Präfix `lmstudio/`.

Übergeben Sie für authentifizierte LM Studio-Server `--lmstudio-api-key` oder setzen Sie `LM_API_TOKEN`.
Lassen Sie für nicht authentifizierte LM Studio-Server den Schlüssel weg; OpenClaw speichert eine lokale, nicht geheime Markierung.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, aber für LM Studio wird `--lmstudio-api-key` bevorzugt.

Dies schreibt `models.providers.lmstudio` und setzt das Standardmodell auf `lmstudio/<custom-model-id>`. Wenn Sie einen API-Schlüssel angeben, schreibt die Einrichtung außerdem das Authentifizierungsprofil `lmstudio:default`.

Die interaktive Einrichtung kann nach einer optionalen bevorzugten Länge des Ladekontexts fragen und wendet diese auf die gefundenen LM Studio-Modelle an, die sie in der Konfiguration speichert.
Die LM Studio-Plugin-Konfiguration vertraut dem konfigurierten LM Studio-Endpunkt für Modellanfragen, einschließlich local loopback, LAN- und Tailnet-Hosts. Metadaten-/Link-local-Ursprünge erfordern weiterhin eine ausdrückliche Zustimmung. Sie können dies deaktivieren, indem Sie `models.providers.lmstudio.request.allowPrivateNetwork: false` setzen.

## Konfiguration

### Kompatibilität mit Streaming-Nutzungsdaten

LM Studio ist mit Streaming-Nutzungsdaten kompatibel. Wenn es kein `usage`-Objekt im OpenAI-Format ausgibt, stellt OpenClaw Token-Zählungen stattdessen aus Metadaten im llama.cpp-Stil wieder her: `timings.prompt_n` / `timings.predicted_n`.

Dasselbe Verhalten für Streaming-Nutzungsdaten gilt für diese OpenAI-kompatiblen lokalen Backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Thinking-Kompatibilität

Wenn die `/api/v1/models`-Erkennung von LM Studio modellspezifische Reasoning-Optionen meldet, stellt OpenClaw die passenden OpenAI-kompatiblen `reasoning_effort`-Werte in den Modellkompatibilitätsmetadaten bereit. Aktuelle LM Studio-Builds können binäre UI-Optionen wie `allowed_options: ["off", "on"]` melden, diese Werte jedoch bei `/v1/chat/completions` ablehnen; OpenClaw normalisiert diese binäre Erkennungsform vor dem Senden von Anfragen auf `none`, `minimal`, `low`, `medium`, `high` und `xhigh`. Ältere gespeicherte LM Studio-Konfigurationen, die `off`/`on`-Reasoning-Zuordnungen enthalten, werden beim Laden des Katalogs auf dieselbe Weise normalisiert.

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

### LM Studio wird nicht erkannt

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
- Details zur LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, lassen Sie den Schlüssel während der Einrichtung leer.

### Just-in-time-Modellladen

LM Studio unterstützt Just-in-time-Modellladen (JIT), bei dem Modelle bei der ersten Anfrage geladen werden. OpenClaw lädt Modelle standardmäßig über den nativen Ladeendpunkt von LM Studio vor, was hilfreich ist, wenn JIT deaktiviert ist. Um LM Studios JIT, Leerlauf-TTL und Auto-Evict-Verhalten den Modelllebenszyklus verwalten zu lassen, deaktivieren Sie den Vorladeschritt von OpenClaw:

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

### LAN- oder Tailnet-LM Studio-Host

Verwenden Sie die erreichbare Adresse des LM Studio-Hosts, behalten Sie `/v1` bei, und stellen Sie sicher, dass LM Studio auf diesem Rechner nicht nur an loopback gebunden ist:

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

`lmstudio` vertraut seinem konfigurierten lokalen/privaten Endpunkt automatisch für geschützte Modellanfragen. Benutzerdefinierte/lokale OpenAI-kompatible Provider-Einträge vertrauen ebenfalls ihrem exakt konfigurierten `baseUrl`-Ursprung, ausgenommen Metadaten-/Link-local-Ursprünge; Anfragen an andere private Ports oder Ziele erfordern weiterhin `models.providers.<id>.request.allowPrivateNetwork: true`. Setzen Sie `models.providers.<id>.request.allowPrivateNetwork: false`, um das Vertrauen in den exakten Ursprung zu deaktivieren.

## Verwandte Themen

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
