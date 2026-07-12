---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T15:48:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio führt llama.cpp- (GGUF) oder MLX-Modelle lokal aus, entweder als GUI-Anwendung oder als Headless-Daemon `llmster`.
Installations- und Produktdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

<Steps>
  <Step title="Server installieren und starten">
    Installieren Sie LM Studio (Desktop) oder `llmster` (Headless) und starten Sie anschließend den Server:

    ```bash
    lms server start --port 1234
    ```

    Alternativ können Sie den Headless-Daemon ausführen:

    ```bash
    lms daemon up
    ```

    Wenn Sie die Desktop-Anwendung verwenden, aktivieren Sie JIT, damit Modelle reibungslos geladen werden; weitere Informationen finden Sie im
    [LM-Studio-Leitfaden zu JIT und TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="API-Schlüssel festlegen, wenn die Authentifizierung aktiviert ist">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Wenn die LM-Studio-Authentifizierung deaktiviert ist, lassen Sie den API-Schlüssel während der Einrichtung leer. Weitere Informationen finden Sie unter
    [LM-Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard
    ```

    Wählen Sie `LM Studio` und anschließend an der Eingabeaufforderung `Default model` ein Modell aus.

  </Step>
</Steps>

Ändern Sie das Standardmodell später:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM-Studio-Modellschlüssel verwenden das Format `author/model-name` (z. B. `qwen/qwen3.5-9b`); OpenClaw-Modellreferenzen
stellen den Provider voran: `lmstudio/qwen/qwen3.5-9b`. Ermitteln Sie den genauen Schlüssel eines Modells, indem Sie den
folgenden Befehl ausführen und das Feld `key` prüfen:

```bash
curl http://localhost:1234/api/v1/models
```

## Nicht interaktives Onboarding

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Alternativ können Sie Basis-URL, Modell und API-Schlüssel explizit angeben:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` übernimmt den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`) ohne
das Provider-Präfix `lmstudio/`. Übergeben Sie für authentifizierte Server `--lmstudio-api-key` (oder setzen Sie `LM_API_TOKEN`);
lassen Sie die Option bei nicht authentifizierten Servern weg. OpenClaw speichert stattdessen eine lokale, nicht geheime Markierung.
`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin akzeptiert, `--lmstudio-api-key` wird jedoch bevorzugt.

Dadurch wird `models.providers.lmstudio` geschrieben und das Standardmodell auf `lmstudio/<custom-model-id>` festgelegt.
Wenn Sie einen API-Schlüssel angeben, wird außerdem das Authentifizierungsprofil `lmstudio:default` geschrieben.

Bei der interaktiven Einrichtung kann zusätzlich eine bevorzugte Kontextlänge für das Laden abgefragt werden, die auf alle
erkannten und in der Konfiguration gespeicherten Modelle angewendet wird.

## Konfiguration

### Kompatibilität der Streaming-Nutzungsdaten

LM Studio gibt bei gestreamten Antworten nicht immer ein OpenAI-konformes `usage`-Objekt aus. OpenClaw
ermittelt die Tokenanzahl stattdessen aus den llama.cpp-Metadaten `timings.prompt_n` / `timings.predicted_n`.
Jeder als lokaler Endpunkt aufgelöste OpenAI-kompatible Endpunkt (Loopback-Host) erhält denselben
Fallback. Dies deckt weitere lokale Backends wie vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
und text-generation-webui ab.

### Kompatibilität des Denkmodus

Wenn die Erkennung über `/api/v1/models` von LM Studio modellspezifische Reasoning-Optionen meldet, stellt OpenClaw
entsprechende `reasoning_effort`-Werte (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) in den
Modellkompatibilitätsmetadaten bereit. Einige LM-Studio-Builds geben eine binäre UI-Option (`allowed_options: ["off",
"on"]`) an, lehnen diese wörtlichen Werte unter `/v1/chat/completions` jedoch ab; OpenClaw normalisiert diese
binäre Form vor dem Senden von Anfragen auf die sechsstufige Skala. Dies gilt auch für ältere gespeicherte Konfigurationen,
die noch Reasoning-Zuordnungen mit `off`/`on` enthalten.

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

### Vorabladen deaktivieren

LM Studio unterstützt das Just-in-Time-Laden (JIT) von Modellen, bei dem Modelle bei der ersten Anfrage geladen werden. OpenClaw
lädt Modelle standardmäßig über den nativen Ladeendpunkt von LM Studio vorab, was hilfreich ist, wenn JIT
deaktiviert ist. Wenn stattdessen das JIT-, Leerlauf-TTL- und Auto-Evict-Verhalten von LM Studio den Modelllebenszyklus steuern soll,
deaktivieren Sie den Vorabladeschritt von OpenClaw:

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

### LAN- oder Tailnet-Host

Verwenden Sie die erreichbare Adresse des LM-Studio-Hosts, behalten Sie `/v1` bei und stellen Sie sicher, dass LM Studio auf diesem
Rechner nicht nur an die Loopback-Schnittstelle gebunden ist:

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

`lmstudio` vertraut seinem konfigurierten Endpunkt automatisch für Modellanfragen, einschließlich Loopback-,
LAN- und Tailnet-Hosts (ausgenommen Metadaten- und Link-Local-Ursprünge). Jeder benutzerdefinierte/lokale OpenAI-kompatible
Provider-Eintrag erhält dieselbe Vertrauensstellung für den exakten Ursprung. Anfragen an einen anderen privaten Host oder Port
erfordern weiterhin `models.providers.<id>.request.allowPrivateNetwork: true`; setzen Sie den Wert auf `false`, um
das standardmäßige Vertrauen zu deaktivieren.

## Fehlerbehebung

### LM Studio wird nicht erkannt

Stellen Sie sicher, dass LM Studio ausgeführt wird:

```bash
lms server start --port 1234
```

Wenn die Authentifizierung aktiviert ist, setzen Sie außerdem `LM_API_TOKEN`. Überprüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Weitere Informationen finden Sie unter [LM-Studio-Authentifizierung](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn der Server keine Authentifizierung erfordert, lassen Sie den Schlüssel während der Einrichtung leer.

## Verwandte Themen

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
