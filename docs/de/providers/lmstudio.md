---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T06:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio ist eine benutzerfreundliche und zugleich leistungsstarke App zum Ausführen von Open-Weight-Modellen auf Ihrer eigenen Hardware. Sie können damit llama.cpp-Modelle (GGUF) oder MLX-Modelle (Apple Silicon) ausführen. Sie ist als GUI-Paket oder als Headless-Daemon (`llmster`) verfügbar. Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (Headless), und starten Sie dann den lokalen Server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Starten Sie den Server

Stellen Sie sicher, dass Sie entweder die Desktop-App starten oder den Daemon mit dem folgenden Befehl ausführen:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT für eine reibungslose Nutzung aktiviert ist. Weitere Informationen finden Sie im [LM Studio JIT- und TTL-Leitfaden](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Wenn die LM Studio-Authentifizierung aktiviert ist, setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM Studio-Authentifizierung deaktiviert ist, können Sie den API-Schlüssel während der interaktiven OpenClaw-Einrichtung leer lassen.

Details zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie die Einrichtung aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie während der Einrichtung die Eingabeaufforderung `Default model`, um Ihr LM Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw
stellt Modellreferenzen den Providernamen voran: `lmstudio/qwen/qwen3.5-9b`. Den exakten Schlüssel für
ein Modell finden Sie, indem Sie `curl http://localhost:1234/api/v1/models` ausführen und das Feld `key` prüfen.

## Nicht interaktive Einrichtung

Verwenden Sie die nicht interaktive Einrichtung, wenn Sie die Einrichtung skripten möchten (CI, Provisionierung, Remote-Bootstrap):

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

`--custom-model-id` nimmt den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`) ohne
den Provider-Präfix `lmstudio/`.

Für authentifizierte LM Studio-Server übergeben Sie `--lmstudio-api-key` oder setzen `LM_API_TOKEN`.
Für nicht authentifizierte LM Studio-Server lassen Sie den Schlüssel weg; OpenClaw speichert eine lokale, nicht geheime Markierung.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, aber `--lmstudio-api-key` wird für LM Studio bevorzugt.

Dies schreibt `models.providers.lmstudio` und setzt das Standardmodell auf
`lmstudio/<custom-model-id>`. Wenn Sie einen API-Schlüssel angeben, schreibt die Einrichtung außerdem das
Authentifizierungsprofil `lmstudio:default`.

Die interaktive Einrichtung kann eine optionale bevorzugte Länge des Ladekontexts abfragen und sie auf die erkannten LM Studio-Modelle anwenden, die sie in der Konfiguration speichert.
Die LM Studio-Plugin-Konfiguration vertraut dem konfigurierten LM Studio-Endpunkt für Modellanfragen, einschließlich loopback-, LAN- und tailnet-Hosts. Sie können dies deaktivieren, indem Sie `models.providers.lmstudio.request.allowPrivateNetwork: false` setzen.

## Konfiguration

### Kompatibilität der Streaming-Nutzung

LM Studio ist mit Streaming-Nutzung kompatibel. Wenn es kein OpenAI-förmiges
`usage`-Objekt ausgibt, stellt OpenClaw stattdessen Token-Zählungen aus Metadaten im llama.cpp-Stil
`timings.prompt_n` / `timings.predicted_n` wieder her.

Dasselbe Verhalten für Streaming-Nutzung gilt für diese OpenAI-kompatiblen lokalen Backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatibilität des Denkmodus

Wenn die `/api/v1/models`-Erkennung von LM Studio modellspezifische Reasoning-
Optionen meldet, bewahrt OpenClaw diese nativen Werte in den Modellkompatibilitätsmetadaten auf. Für
binäre Denkmodelle, die `allowed_options: ["off", "on"]` bekanntgeben,
ordnet OpenClaw deaktiviertes Denken `off` und aktivierte `/think`-Stufen `on` zu,
anstatt OpenAI-spezifische Werte wie `low` oder `medium` zu senden.

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

Prüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

Wenn die Einrichtung HTTP 401 meldet, prüfen Sie Ihren API-Schlüssel:

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Details zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, lassen Sie den Schlüssel während der Einrichtung leer.

### Just-in-time-Modellladen

LM Studio unterstützt Just-in-time-Modellladen (JIT), bei dem Modelle bei der ersten Anfrage geladen werden. OpenClaw lädt Modelle standardmäßig über den nativen Ladeendpunkt von LM Studio vor, was hilfreich ist, wenn JIT deaktiviert ist. Um LM Studios JIT-, Leerlauf-TTL- und Auto-Evict-Verhalten den Modelllebenszyklus verwalten zu lassen, deaktivieren Sie den Vorladeschritt von OpenClaw:

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

### LM Studio-Host im LAN oder tailnet

Verwenden Sie die erreichbare Adresse des LM Studio-Hosts, behalten Sie `/v1` bei und stellen Sie sicher, dass LM Studio auf diesem Rechner nicht nur an loopback gebunden ist:

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

Anders als generische OpenAI-kompatible Provider vertraut `lmstudio` seinem konfigurierten lokalen/privaten Endpunkt automatisch für geschützte Modellanfragen. Benutzerdefinierte loopback-Provider-IDs wie `localhost` oder `127.0.0.1` werden ebenfalls automatisch vertraut; für benutzerdefinierte Provider-IDs für LAN, tailnet oder privates DNS setzen Sie `models.providers.<id>.request.allowPrivateNetwork: true` ausdrücklich.

## Verwandte Themen

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
