---
read_when:
    - Chcesz, aby Claude Code korzystał z narzędzi MCP OpenClaw Gateway
    - Potrzebujesz tymczasowego uprawnienia MCP powiązanego z sesją dla zewnętrznego środowiska testowego
summary: Informacje referencyjne CLI dla `openclaw attach` (uruchom Claude Code z ograniczonym przyznaniem uprawnień Gateway MCP)
title: Dołącz CLI
x-i18n:
    generated_at: "2026-07-02T01:17:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` uruchamia Claude Code ze ścisłą tymczasową konfiguracją MCP powiązaną
z jedną sesją Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opcje:

- `--session <key>` wiąże przyznane uprawnienie z sesją Gateway. Domyślnie jest to sesja główna.
- `--ttl <ms>` żąda dodatniego TTL przyznanego uprawnienia w milisekundach. Gateway stosuje własny limit maksymalny.
- `--bin <path>` wybiera plik binarny Claude Code. Domyślnie `claude`.
- `--print-config` zapisuje tymczasowy plik `.mcp.json`, wypisuje polecenie uruchomieniowe i zmienne środowiskowe oraz pozostawia przyznane uprawnienie aktywne do wygaśnięcia TTL.

Token okaziciela jest przekazywany przez zmienne środowiskowe, a nie przez argv. OpenClaw
uruchamia Claude Code z `--strict-mcp-config --mcp-config <path>`, dzięki czemu otaczające
serwery MCP Claude nie dołączają do dołączonej sesji. Zwykłe uruchomienia unieważniają
przyznane uprawnienie po zakończeniu procesu Claude Code.

Zobacz też: [CLI Gateway](/pl/cli/gateway), [CLI MCP](/pl/cli/mcp) i [CLI ACP](/pl/cli/acp).
