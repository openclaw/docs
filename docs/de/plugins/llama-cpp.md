---
read_when:
    - Sie möchten lokale Textinferenz ohne API-Schlüssel oder Modellserver nutzen
    - Sie möchten Embeddings für die Speichersuche aus einem lokalen GGUF-Modell verwenden
    - Sie konfigurieren `memory.search.provider = "local"`
    - Sie benötigen das OpenClaw-Plugin, dem die node-llama-cpp-Laufzeitumgebung zugeordnet ist
sidebarTitle: llama.cpp Provider
summary: Führen Sie lokale GGUF-Textinferenz und Memory-Embeddings in OpenClaw mit llama.cpp aus
title: llama.cpp-Provider
x-i18n:
    generated_at: "2026-07-24T04:45:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 88e6d66943adcbc602421b8cc00359b3ed87357194c3ffaa845c1db7fbcd9c38
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` ist das offizielle externe Provider-Plugin für prozessinterne lokale GGUF-
Textinferenz und Embeddings. Es registriert den Text-Provider `llama-cpp`,
den Embedding-Provider `local` und verwaltet die native Laufzeitumgebung `node-llama-cpp`.

Installieren Sie es, bevor Sie lokale Inferenz oder lokale Speicher-Embeddings verwenden:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Das `openclaw`-Hauptpaket auf npm enthält `node-llama-cpp` nicht. Indem die
native Abhängigkeit in diesem Plugin verbleibt, wird verhindert, dass normale OpenClaw-npm-Updates
eine manuell installierte Laufzeitumgebung im OpenClaw-Paketverzeichnis
löschen.

## Lokale Textinferenz

Wählen Sie beim interaktiven Onboarding **Lokales Modell (llama.cpp)**. OpenClaw fragt
vor dem Herunterladen des Standardmodells nach:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Die Datei Qwen3 4B Instruct 2507 Q4_K_M ist etwa 2,5 GB groß. Planen Sie ungefähr 3 GB
RAM für die Modellgewichte sowie zusätzlichen Speicher für den Kontext und die OpenClaw-Laufzeitumgebung ein. Der Standardkontext
wird automatisch mit einer Obergrenze von 8.192 Token dimensioniert, sodass er auf
Rechnern mit 8 GB praktikabel bleibt. Konfigurieren Sie einen größeren Kontext nur, wenn der Rechner über ausreichend
Arbeitsspeicher verfügt.

Die Erkennungsprüfung beim Onboarding ist schreibgeschützt. Sie bietet llama.cpp automatisch
nur an, wenn sich die standardmäßige oder konfigurierte GGUF-Datei bereits im Modell-Cache befindet; während
der Erkennung wird niemals etwas heruntergeladen. Ollama und LM Studio bleiben separate Optionen für lokale
Dienste und behalten ihre eigenen Erkennungsabläufe. Durch die manuelle Auswahl von llama.cpp
wird zum Herunterladen des Standardmodells aufgefordert.

Der Provider verwendet die eingebettete Chatvorlage des GGUF-Modells und den nativen
Funktionsaufruf von node-llama-cpp. Text wird Token für Token gestreamt. Tool-Aufrufe werden
zur Ausführung an OpenClaw zurückgegeben, statt innerhalb von node-llama-cpp ausgeführt zu werden.

### Ein anderes GGUF-Modell verwenden

Fügen Sie `models.providers.llama-cpp` ein Modell hinzu. Geben Sie in `params.modelPath` einen lokalen Pfad oder die vollständige
`hf:`-Datei-URI an:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

Bei der Inferenz wird ein fehlendes Modell niemals implizit heruntergeladen. Laden Sie bei einer benutzerdefinierten `hf:`-URI
zuerst die GGUF-Datei in `modelCacheDir` herunter. Die Erkennung verwendet den
eigenen schreibgeschützten Cache-Resolver von node-llama-cpp, einschließlich der Benennung von Repository,
Branch und aufgeteilten Dateien.

## Konfiguration der Speicher-Embeddings

Setzen Sie `memory.search.provider` auf `local`:

```json5
{
  memory: {
    search: {
      provider: "local",
      local: {
        modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

`local.modelPath` verwendet standardmäßig die oben gezeigte `hf:`-URI (`embeddinggemma-300m-qat-Q8_0.gguf`).
Verweisen Sie auf eine andere `hf:`-URI oder eine lokale `.gguf`-Datei, um ein anderes
Modell zu verwenden. `local.modelCacheDir` überschreibt den Speicherort für heruntergeladene Modelle
(Standard: `~/.node-llama-cpp/models`), und `local.contextSize` akzeptiert eine
Ganzzahl oder `"auto"`.

Wenn `local.contextSize` numerisch ist, übergibt der Provider diese Anforderung auch
an die automatische Platzierung der GPU-Schichten von node-llama-cpp. Dadurch kann node-llama-cpp
das Modell und den Embedding-Kontext gemeinsam einpassen und gleichzeitig seine Prüfungen zur
Speichersicherheit beibehalten. Mit `"auto"` behält node-llama-cpp seine normale automatische Platzierung bei.

## Native Laufzeitumgebung

Verwenden Sie Node 24 für eine möglichst reibungslose native Installation. Quellcode-Checkouts mit
pnpm müssen die native Abhängigkeit möglicherweise genehmigen und neu erstellen:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnose der Speicher-Laufzeitumgebung

Führen Sie `openclaw memory status --deep` aus, nachdem der Provider geladen wurde, um
das ausgewählte Backend und den Build, Gerätenamen, auf die GPU ausgelagerte Schichten, die angeforderte
Kontextgröße sowie den zuletzt beobachteten Snapshot des VRAM oder des einheitlichen Speichers zu prüfen. Die VRAM-
Werte enthalten einen Beobachtungszeitstempel, da passive Statusabfragen weder
das Modell neu laden noch das Gerät abfragen.

Dieselben zuletzt bekannten Angaben können in `openclaw doctor` erscheinen, wenn das laufende
Gateway den lokalen Provider bereits verwendet hat. Ein normaler Status- oder Doctor-Befehl
lädt nicht eigens ein Modell, nur um Diagnosedaten zu erfassen.

## Fehlerbehebung

Wenn `node-llama-cpp` fehlt oder nicht geladen werden kann, meldet OpenClaw den Fehler
mit:

1. Installieren Sie das Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Verwenden Sie Node 24 für native Installationen/Aktualisierungen.
3. Aus einem pnpm-Quellcode-Checkout: `pnpm approve-builds`, anschließend `pnpm rebuild node-llama-cpp`.

Verwenden Sie stattdessen den Ollama- oder LM-Studio-Provider für lokale Inferenz ohne eine
prozessinterne native Abhängigkeit. Für unkompliziertere lokale Embeddings setzen Sie
`memory.search.provider` stattdessen auf einen entfernten Embedding-Provider wie `lmstudio`,
`ollama`, `openai` oder `voyage`.
