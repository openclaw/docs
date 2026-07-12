---
read_when:
    - Chcesz korzystać z obsługi Zalo Personal (nieoficjalnej) w OpenClaw
    - Konfigurujesz lub rozwijasz plugin zalouser
summary: 'Plugin Zalo Personal: logowanie kodem QR i obsługa wiadomości przez natywną bibliotekę zca-js (instalacja pluginu, konfiguracja kanału i narzędzie)'
title: Plugin osobisty Zalo
x-i18n:
    generated_at: "2026-07-12T15:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Obsługa Zalo Personal dla OpenClaw za pośrednictwem pluginu, który używa natywnego `zca-js` do
automatyzacji zwykłego konta użytkownika Zalo. Zewnętrzny plik binarny CLI `zca`/`openzca` nie jest
wymagany.

<Warning>
Nieoficjalna automatyzacja może doprowadzić do zawieszenia lub zablokowania konta. Korzystasz z niej na własne ryzyko.
</Warning>

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby wyraźnie wskazać, że automatyzowane jest **osobiste konto
użytkownika Zalo** (nieoficjalnie). Osobny identyfikator kanału `zalo` odnosi się do oficjalnej,
wbudowanej integracji z botem Zalo/Webhookiem — zobacz [Zalo](/pl/channels/zalo).

## Miejsce działania

Ten plugin działa **wewnątrz procesu Gateway**. W przypadku zdalnego Gateway
zainstaluj i skonfiguruj go na tym hoście, a następnie uruchom ponownie Gateway.

## Instalacja

### Z npm

```bash
openclaw plugins install @openclaw/zalouser
```

Użyj samej nazwy pakietu, aby korzystać z bieżącego oficjalnego tagu wydania; przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji. Następnie uruchom ponownie Gateway.

### Z folderu lokalnego (środowisko deweloperskie)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom ponownie Gateway.

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

Informacje o kontroli dostępu do wiadomości prywatnych i grup, konfiguracji wielu kont,
zmiennych środowiskowych oraz rozwiązywaniu problemów znajdziesz w sekcji [Konfiguracja osobistego kanału Zalo](/pl/channels/zalouser).

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Narzędzie agenta

Nazwa narzędzia: `zalouser`

Działania: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Działania wiadomości kanału (nie narzędzia agenta) obsługują również `react` do reagowania
na wiadomości.

## Powiązane materiały

- [Konfiguracja osobistego kanału Zalo](/pl/channels/zalouser)
- [Zalo (oficjalny kanał bota/Webhooka)](/pl/channels/zalo)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [ClawHub](/clawhub)
