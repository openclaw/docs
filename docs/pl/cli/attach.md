---
read_when:
    - Chcesz, aby Claude Code korzystał z narzędzi MCP OpenClaw Gateway
    - Potrzebujesz tymczasowego uprawnienia MCP powiązanego z sesją dla zewnętrznego środowiska testowego
summary: Dokumentacja CLI dla `openclaw attach` (uruchamianie Claude Code z ograniczonym zakresem uprawnień Gateway MCP)
title: Dołącz CLI
x-i18n:
    generated_at: "2026-07-12T14:59:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` uruchamia Claude Code ze ścisłą tymczasową konfiguracją MCP powiązaną z jedną sesją Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opcje:

- `--session <key>` wiąże uprawnienie z sesją Gateway. Domyślnie używana jest sesja główna.
- `--ttl <ms>` żąda dodatniego czasu TTL uprawnienia w milisekundach. Gateway stosuje własny górny limit.
- `--bin <path>` wybiera plik wykonywalny Claude Code. Domyślnie: `claude`.
- `--print-config` zapisuje tymczasowy plik `.mcp.json`, wyświetla polecenie uruchomienia i zmienne środowiskowe oraz pozostawia uprawnienie aktywne do wygaśnięcia czasu TTL (nie uruchamia Claude Code ani nie unieważnia uprawnienia).

Token okaziciela jest przekazywany za pomocą zmiennych środowiskowych, a nie przez argv. OpenClaw uruchamia Claude Code z opcjami `--strict-mcp-config --mcp-config <path>`, dzięki czemu serwery Claude MCP z otoczenia nie dołączają do podłączonej sesji. Standardowe uruchomienia (bez `--print-config`) unieważniają uprawnienie po zakończeniu procesu Claude Code.

Zobacz także: [CLI Gateway](/pl/cli/gateway), [CLI MCP](/pl/cli/mcp) oraz [CLI ACP](/pl/cli/acp).
