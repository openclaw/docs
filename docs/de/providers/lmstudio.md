---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ist eine benutzerfreundliche und zugleich leistungsstarke App zum Ausführen von Open-Weight-Modellen auf Ihrer eigenen Hardware. Sie können damit llama.cpp-Modelle (GGUF) oder MLX-Modelle (Apple Silicon) ausführen. Es ist als GUI-Paket oder als Headless-Daemon (`llmster`) verfügbar. Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (headless), und starten Sie dann den lokalen Server:

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

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT aktiviert ist, um eine reibungslose Nutzung zu gewährleisten. Weitere Informationen finden Sie im [LM Studio JIT- und TTL-Leitfaden](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

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

5. Verwenden Sie im Onboarding die Abfrage `Default model`, um Ihr LM Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-Modellschlüssel verwenden das Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-Modellreferenzen stellen den Provider-Namen voran: `lmstudio/qwen/qwen3.5-9b`. Den genauen Schlüssel für ein Modell finden Sie, indem Sie `curl http://localhost:1234/api/v1/models` ausführen und sich das Feld `key` ansehen.

## Nicht interaktives Onboarding

Verwenden Sie nicht interaktives Onboarding, wenn Sie die Einrichtung per Skript ausführen möchten (CI, Provisionierung, Remote-Bootstrap):

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

`--custom-model-id` erwartet den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`), ohne das Provider-Präfix `lmstudio/`.

Übergeben Sie für authentifizierte LM Studio-Server `--lmstudio-api-key` oder setzen Sie `LM_API_TOKEN`.
Lassen Sie für nicht authentifizierte LM Studio-Server den Schlüssel weg; OpenClaw speichert eine lokale, nicht geheime Markierung.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, für LM Studio wird jedoch `--lmstudio-api-key` bevorzugt.

Dies schreibt `models.providers.lmstudio` und setzt das Standardmodell auf `lmstudio/<custom-model-id>`. Wenn Sie einen API-Schlüssel angeben, schreibt die Einrichtung außerdem das Authentifizierungsprofil `lmstudio:default`.

Die interaktive Einrichtung kann nach einer optionalen bevorzugten Lade-Kontextlänge fragen und diese auf die erkannten LM Studio-Modelle anwenden, die sie in der Konfiguration speichert.
Die LM Studio-Plugin-Konfiguration vertraut dem konfigurierten LM Studio-Endpunkt für Modellanfragen, einschließlich Loopback-, LAN- und Tailnet-Hosts. Sie können dies deaktivieren, indem Sie `models.providers.lmstudio.request.allowPrivateNetwork: false` setzen.

## Konfiguration

### Kompatibilität mit Streaming-Nutzung

LM Studio ist mit Streaming-Nutzung kompatibel. Wenn es kein OpenAI-förmiges `usage`-Objekt ausgibt, rekonstruiert OpenClaw die Token-Zählungen stattdessen aus llama.cpp-artigen Metadaten `timings.prompt_n` / `timings.predicted_n`.

Dasselbe Verhalten für Streaming-Nutzung gilt für diese OpenAI-kompatiblen lokalen Backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatibilität mit Thinking

Wenn die Erkennung von LM Studio unter `/api/v1/models` modellspezifische Reasoning-Optionen meldet, stellt OpenClaw die passenden OpenAI-kompatiblen `reasoning_effort`-Werte in den Modellkompatibilitätsmetadaten bereit. Aktuelle LM Studio-Builds können binäre UI-Optionen wie `allowed_options: ["off", "on"]` melden, während sie diese Werte unter `/v1/chat/completions` ablehnen; OpenClaw normalisiert diese binäre Erkennungsform vor dem Senden von Anfragen zu `none`, `minimal`, `low`, `medium`, `high` und `xhigh`. Ältere gespeicherte LM Studio-Konfigurationen, die `off`/`on`-Reasoning-Zuordnungen enthalten, werden beim Laden des Katalogs auf dieselbe Weise normalisiert.

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

Wenn die Einrichtung HTTP 401 meldet, prüfen Sie Ihren API-Schlüssel:

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Details zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, lassen Sie den Schlüssel während der Einrichtung leer.

### Just-in-Time-Modellladen

LM Studio unterstützt Just-in-Time-Modellladen (JIT), bei dem Modelle bei der ersten Anfrage geladen werden. OpenClaw lädt Modelle standardmäßig über den nativen Lade-Endpunkt von LM Studio vor, was hilfreich ist, wenn JIT deaktiviert ist. Deaktivieren Sie den Vorlade-Schritt von OpenClaw, damit JIT, Leerlauf-TTL und Auto-Evict-Verhalten von LM Studio den Modelllebenszyklus steuern:

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

Verwenden Sie die erreichbare Adresse des LM Studio-Hosts, behalten Sie `/v1` bei, und stellen Sie sicher, dass LM Studio auf diesem Computer nicht nur an Loopback gebunden ist:

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

Anders als generische OpenAI-kompatible Provider vertraut `lmstudio` seinem konfigurierten lokalen/privaten Endpunkt für geschützte Modellanfragen automatisch. Benutzerdefinierte Loopback-Provider-IDs wie `localhost` oder `127.0.0.1` werden ebenfalls automatisch als vertrauenswürdig behandelt; für benutzerdefinierte Provider-IDs für LAN, Tailnet oder privates DNS setzen Sie explizit `models.providers.<id>.request.allowPrivateNetwork: true`.

## Verwandte Themen

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
