---
read_when:
    - Chcesz obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz Plugin zalouser
summary: 'Plugin Zalo Personal: logowanie kodem QR + wysyłanie wiadomości przez natywny zca-js (instalacja Pluginu + konfiguracja kanału + narzędzie)'
title: Osobisty Plugin Zalo
x-i18n:
    generated_at: "2026-05-10T19:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Obsługa Zalo Personal dla OpenClaw przez Plugin, z użyciem natywnego `zca-js` do automatyzacji zwykłego konta użytkownika Zalo.

<Warning>
Nieoficjalna automatyzacja może prowadzić do zawieszenia lub zablokowania konta. Używasz jej na własne ryzyko.
</Warning>

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje on **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten Plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie zrestartuj Gateway.

Nie jest wymagany zewnętrzny binarny CLI `zca`/`openzca`.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Użyj samego pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

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

- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [ClawHub](/pl/clawhub)
