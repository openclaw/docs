---
read_when:
    - Chcesz obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz Plugin zalouser
summary: 'Plugin Zalo Personal: logowanie QR + wysyłanie wiadomości przez natywny zca-js (instalacja Plugin + konfiguracja kanału + narzędzie)'
title: Osobisty Plugin Zalo
x-i18n:
    generated_at: "2026-04-30T10:11:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (plugin)

Obsługa Zalo Personal w OpenClaw za pomocą pluginu, z użyciem natywnego `zca-js` do automatyzacji zwykłego konta użytkownika Zalo.

<Warning>
Nieoficjalna automatyzacja może prowadzić do zawieszenia lub zablokowania konta. Używasz jej na własne ryzyko.
</Warning>

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje on **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie uruchom ponownie Gateway.

Nie jest wymagany zewnętrzny plik binarny CLI `zca`/`openzca`.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, ta wersja pakietu pochodzi
ze starszego zewnętrznego wydania pakietów; użyj aktualnej spakowanej wersji OpenClaw albo
ścieżki do folderu lokalnego, dopóki nie zostanie opublikowany nowszy pakiet npm.

Następnie uruchom ponownie Gateway.

### Opcja B: instalacja z folderu lokalnego (dev)

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

Akcje wiadomości kanału obsługują też `react` dla reakcji na wiadomości.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Pluginy społecznościowe](/pl/plugins/community)
