---
read_when:
    - Sie möchten Embeddings für die Speichersuche aus einem lokalen GGUF-Modell verwenden.
    - Sie konfigurieren memorySearch.provider = "local"
    - Sie benötigen das OpenClaw-Plugin, das für die node-llama-cpp-Laufzeitumgebung zuständig ist
sidebarTitle: llama.cpp Provider
summary: Installieren Sie den offiziellen llama.cpp-Provider für lokale Gedächtnis-Embeddings im GGUF-Format
title: llama.cpp-Provider
x-i18n:
    generated_at: "2026-07-12T01:55:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` ist das offizielle externe Provider-Plugin für lokale GGUF-
Einbettungen. Es registriert die Einbettungs-Provider-ID `local` und verwaltet die
von `memorySearch.provider: "local"` verwendete Laufzeitabhängigkeit
`node-llama-cpp`.

Installieren Sie es, bevor Sie lokale Speichereinbettungen verwenden:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Das primäre npm-Paket `openclaw` enthält `node-llama-cpp` nicht. Indem die
native Abhängigkeit in diesem Plugin verbleibt, wird verhindert, dass reguläre
npm-Aktualisierungen von OpenClaw eine manuell installierte Laufzeitumgebung im
Paketverzeichnis von OpenClaw löschen.

## Konfiguration

Setzen Sie `memorySearch.provider` auf `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` verwendet standardmäßig die oben gezeigte `hf:`-URI
(`embeddinggemma-300m-qat-Q8_0.gguf`). Geben Sie eine andere `hf:`-URI oder
eine lokale `.gguf`-Datei an, um ein anderes Modell zu verwenden.
`local.modelCacheDir` überschreibt den Speicherort für heruntergeladene
Modelle (Standard: `~/.node-llama-cpp/models`), und `local.contextSize`
akzeptiert eine Ganzzahl oder `"auto"`.

Wenn `local.contextSize` numerisch ist, übergibt der Provider diese Anforderung
auch an die automatische Platzierung der GPU-Schichten von node-llama-cpp.
Dadurch kann node-llama-cpp das Modell und den Einbettungskontext gemeinsam
unter Beibehaltung seiner Speichersicherheitsprüfungen einpassen. Bei `"auto"`
behält node-llama-cpp seine normale automatische Platzierung bei.

## Native Laufzeitumgebung

Verwenden Sie Node 24, um eine möglichst reibungslose native Installation zu
gewährleisten. Quellcode-Checkouts mit pnpm müssen möglicherweise die native
Abhängigkeit genehmigen und neu erstellen:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Laufzeitdiagnose

Führen Sie nach dem Laden des Providers `openclaw memory status --deep` aus,
um das ausgewählte Backend und den Build, Gerätenamen, auf die GPU ausgelagerte
Schichten, die angeforderte Kontextgröße sowie den zuletzt erfassten
VRAM- oder Unified-Memory-Schnappschuss zu prüfen. Die VRAM-Werte enthalten
einen Beobachtungszeitstempel, da passive Statusabfragen weder das Modell neu
laden noch das Gerät abfragen.

Dieselben zuletzt bekannten Daten können in `openclaw doctor` erscheinen, wenn
der laufende Gateway den lokalen Provider bereits verwendet hat. Ein normaler
Status- oder Doctor-Befehl lädt nicht eigens ein Modell, nur um Diagnosedaten
zu erfassen.

## Fehlerbehebung

Wenn `node-llama-cpp` fehlt oder nicht geladen werden kann, meldet OpenClaw den
Fehler zusammen mit folgenden Schritten:

1. Installieren Sie das Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Verwenden Sie Node 24 für native Installationen/Aktualisierungen.
3. Bei einem pnpm-Quellcode-Checkout: `pnpm approve-builds`, danach `pnpm rebuild node-llama-cpp`.

Für lokale Einbettungen mit weniger Aufwand und ohne nativen Build-Schritt
setzen Sie `memorySearch.provider` stattdessen auf einen Remote-Provider für
Einbettungen, beispielsweise `lmstudio`, `ollama`, `openai` oder `voyage`.
