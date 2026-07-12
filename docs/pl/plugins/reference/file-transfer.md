---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin do przesyłania plików
summary: Pobieraj, wyświetlaj i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń węzła. Omija obcinanie standardowego wyjścia powłoki bash, używając kodowania base64 przez node.invoke dla plików binarnych o rozmiarze do 16 MB.
title: Plugin przesyłania plików
x-i18n:
    generated_at: "2026-07-12T15:22:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin przesyłania plików

Pobieraj, wyświetlaj listę i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń węzła. Omija obcinanie standardowego wyjścia powłoki bash, używając kodowania base64 przez `node.invoke` dla plików binarnych o rozmiarze do 16 MB.

## Dystrybucja

- Pakiet: `@openclaw/file-transfer`
- Sposób instalacji: dołączony do OpenClaw

## Interfejs

kontrakty: narzędzia
