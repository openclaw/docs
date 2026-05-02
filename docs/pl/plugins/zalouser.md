---
read_when:
    - Chcesz obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz Plugin zalouser
summary: 'Plugin Zalo Personal: logowanie przez QR + obsługa wiadomości za pośrednictwem natywnego zca-js (instalacja Pluginu + konfiguracja kanału + narzędzie)'
title: Osobisty Plugin Zalo
x-i18n:
    generated_at: "2026-05-02T22:22:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Obsługa Zalo Personal w OpenClaw za pośrednictwem Plugin, z użyciem natywnego `zca-js` do automatyzacji zwykłego konta użytkownika Zalo.

<Warning>
Nieoficjalna automatyzacja może doprowadzić do zawieszenia lub zablokowania konta. Używasz jej na własne ryzyko.
</Warning>

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje on **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostawiamy zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Gdzie działa

Ten Plugin działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj go na **maszynie uruchamiającej Gateway**, a następnie uruchom Gateway ponownie.

Nie jest wymagany zewnętrzny plik binarny CLI `zca`/`openzca`.

## Instalacja

### Opcja A: instalacja z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Użyj samej nazwy pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Następnie uruchom Gateway ponownie.

### Opcja B: instalacja z folderu lokalnego (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom Gateway ponownie.

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

Akcje wiadomości kanału obsługują także `react` dla reakcji na wiadomości.

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Plugin społecznościowe](/pl/plugins/community)
