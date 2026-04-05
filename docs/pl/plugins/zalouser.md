---
read_when:
    - Chcesz obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz plugin zalouser
summary: 'Plugin Zalo Personal: logowanie QR + wiadomości przez natywne `zca-js` (instalacja pluginu + konfiguracja kanału + narzędzie)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T14:02:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Obsługa Zalo Personal dla OpenClaw przez plugin, wykorzystujący natywne `zca-js` do automatyzacji zwykłego konta użytkownika Zalo.

> **Ostrzeżenie:** Nieoficjalna automatyzacja może prowadzić do zawieszenia/zbanowania konta. Używasz jej na własne ryzyko.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie uruchom ponownie Gateway.

Nie jest wymagany żaden zewnętrzny binarny CLI `zca`/`openzca`.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Następnie uruchom ponownie Gateway.

### Opcja B: instalacja z lokalnego folderu (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom ponownie Gateway.

## Konfiguracja

Konfiguracja kanału znajduje się pod `channels.zalouser` (nie `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Narzędzie agenta

Nazwa narzędzia: `zalouser`

Akcje: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Akcje wiadomości kanałowych obsługują także `react` dla reakcji na wiadomości.
