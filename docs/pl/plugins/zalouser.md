---
read_when:
    - Chcesz obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz Plugin zalouser
summary: 'Plugin Zalo Personal: logowanie przez QR + wiadomości przez natywne `zca-js` (instalacja Pluginu + konfiguracja kanału + narzędzie)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-24T09:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Obsługa Zalo Personal dla OpenClaw przez Plugin, wykorzystująca natywne `zca-js` do automatyzacji zwykłego osobistego konta użytkownika Zalo.

> **Warning:** Nieoficjalna automatyzacja może prowadzić do zawieszenia/zablokowania konta. Używasz na własne ryzyko.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby było jasne, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostaje zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten Plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie uruchom Gateway ponownie.

Nie jest wymagane żadne zewnętrzne binarium CLI `zca`/`openzca`.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Następnie uruchom Gateway ponownie.

### Opcja B: instalacja z lokalnego katalogu (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom Gateway ponownie.

## Konfiguracja

Konfiguracja kanału znajduje się pod `channels.zalouser` (a nie `plugins.entries.*`):

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

Akcje wiadomości kanału obsługują również `react` dla reakcji na wiadomości.

## Powiązane

- [Budowanie Pluginów](/pl/plugins/building-plugins)
- [Pluginy społecznościowe](/pl/plugins/community)
