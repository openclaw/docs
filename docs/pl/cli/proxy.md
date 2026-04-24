---
read_when:
    - Musisz lokalnie przechwycić ruch transportowy OpenClaw do debugowania
    - Chcesz sprawdzić sesje proxy debugowania, blob-y lub wbudowane presety zapytań
summary: Dokumentacja CLI dla `openclaw proxy`, lokalnego proxy debugowania i inspektora przechwyceń
title: Proxy
x-i18n:
    generated_at: "2026-04-24T09:03:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Uruchamiaj lokalne jawne proxy debugowania i sprawdzaj przechwycony ruch.

To polecenie debugowania służy do badania na poziomie transportu. Może uruchomić
lokalne proxy, uruchomić polecenie potomne z włączonym przechwytywaniem, wyświetlić sesje przechwyceń,
odpytować typowe wzorce ruchu, odczytywać przechwycone blob-y i czyścić lokalne dane
przechwyceń.

## Polecenia

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Presety zapytań

`openclaw proxy query --preset <name>` akceptuje:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Uwagi

- `start` domyślnie używa `127.0.0.1`, chyba że ustawiono `--host`.
- `run` uruchamia lokalne proxy debugowania, a następnie uruchamia polecenie po `--`.
- Przechwycenia to lokalne dane debugowania; po zakończeniu użyj `openclaw proxy purge`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)
