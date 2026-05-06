---
read_when:
    - Chcesz mieć obsługę Zalo Personal (nieoficjalną) w OpenClaw
    - Konfigurujesz lub rozwijasz Plugin zalouser
summary: 'Plugin Zalo Personal: logowanie QR + obsługa wiadomości przez natywne zca-js (instalacja pluginu + konfiguracja kanału + narzędzie)'
title: Osobisty Plugin Zalo
x-i18n:
    generated_at: "2026-05-06T17:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Obsługa Zalo Personal dla OpenClaw za pośrednictwem pluginu, z użyciem natywnego `zca-js` do automatyzacji zwykłego konta użytkownika Zalo.

<Warning>
Nieoficjalna automatyzacja może doprowadzić do zawieszenia lub zablokowania konta. Używasz jej na własne ryzyko.
</Warning>

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje on **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` na potrzeby potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie zrestartuj Gateway.

Zewnętrzny plik binarny CLI `zca`/`openzca` nie jest wymagany.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Użyj samej nazwy pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Następnie zrestartuj Gateway.

### Opcja B: instalacja z folderu lokalnego (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie zrestartuj Gateway.

## Konfiguracja

Konfiguracja kanału znajduje się w `channels.zalouser` (nie w `plugins.entries.*`):

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

Akcje wiadomości kanału obsługują także `react` dla reakcji na wiadomości.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Pluginy społecznościowe](/pl/plugins/community)
