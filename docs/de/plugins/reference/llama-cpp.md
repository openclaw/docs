---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das llama-cpp-Plugin
summary: Lokale GGUF-Textinferenz und Embeddings über node-llama-cpp.
title: Llama-Cpp-Plugin
x-i18n:
    generated_at: "2026-07-24T03:59:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Llama-Cpp-Plugin

Lokale GGUF-Textinferenz und Einbettungen über node-llama-cpp.

## Distribution

- Paket: `@openclaw/llama-cpp-provider`
- Installationsweg: npm; ClawHub

## Oberfläche

Provider: `llama-cpp`; Verträge: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Standardtextmodell

Während der interaktiven Einrichtung bietet OpenClaw Gemma 4 E4B IT Q4_K_M als
gebündelten Download von ungefähr 5.0 GB an. Das Angebot erfordert insgesamt
mindestens 16 GiB RAM. Bereits zwischengespeicherte Modelle werden auf kleineren
Rechnern weiterhin erkannt.

Um ein anderes Modell zu verwenden, setzen Sie `params.modelPath` auf eine beliebige benutzerdefinierte GGUF-Datei. Benutzerdefinierte Modelle
unterliegen nicht der RAM-Anforderung für den gebündelten Download. Auf Rechnern, die
diese Anforderung nicht erfüllen, können Sie auch ein kleineres Modell über Ollama oder LM Studio ausführen oder
einen Cloud-Provider auswählen.

<!-- openclaw-plugin-reference:manual-end -->

## Zugehörige Dokumentation

- [llama-cpp](/de/plugins/llama-cpp)
