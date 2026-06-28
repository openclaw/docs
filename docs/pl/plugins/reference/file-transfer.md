---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin do transferu plików
summary: Pobieraj, wyświetlaj i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń węzła. Omija obcinanie standardowego wyjścia bash, używając base64 przez node.invoke dla plików binarnych do 16 MB.
title: Plugin transferu plików
x-i18n:
    generated_at: "2026-05-02T20:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plugin transferu plików

Pobieraj, wyświetlaj i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń węzłów. Omija obcinanie `stdout` przez `bash`, używając `base64` przez `node.invoke` dla plików binarnych do 16 MB.

## Dystrybucja

- Pakiet: `@openclaw/file-transfer`
- Ścieżka instalacji: zawarte w OpenClaw

## Interfejs

kontrakty: narzędzia
