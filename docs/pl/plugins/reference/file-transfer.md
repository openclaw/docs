---
read_when:
    - Instalowanie, konfigurowanie lub audytowanie pluginu do przesyłania plików
summary: Pobieraj, wyświetlaj i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń Node. Omija obcinanie standardowego wyjścia bash, używając kodowania base64 przez node.invoke dla plików binarnych o rozmiarze do 16 MB.
title: Plugin przesyłania plików
x-i18n:
    generated_at: "2026-07-16T18:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin przesyłania plików

Pobieranie, wyświetlanie listy i zapisywanie plików na sparowanych węzłach za pomocą dedykowanych poleceń węzła. Omija obcinanie danych wyjściowych stdout przez bash dzięki użyciu kodowania base64 za pośrednictwem node.invoke dla plików binarnych o rozmiarze do 16 MB.

## Dystrybucja

- Pakiet: `@openclaw/file-transfer`
- Sposób instalacji: zawarty w OpenClaw

## Interfejs

kontrakty: `tools`
