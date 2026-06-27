---
read_when:
    - Łączenie OpenClaw z obszarem roboczym ClickClack
    - Testowanie tożsamości botów ClickClack
summary: Konfiguracja kanału tokena bota ClickClack i składnia celu
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack łączy OpenClaw z samodzielnie hostowanym obszarem roboczym ClickClack za pomocą pełnoprawnych tokenów botów ClickClack.

Użyj tego, gdy chcesz, aby agent OpenClaw pojawiał się jako użytkownik-bot ClickClack. ClickClack obsługuje niezależne boty usługowe i boty należące do użytkowników; boty należące do użytkowników zachowują `owner_user_id` i otrzymują tylko te zakresy tokena, które im przyznasz.

## Szybka konfiguracja

Utwórz token bota w ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

W przypadku bota należącego do użytkownika dodaj `--owner <user_id>`.

Skonfiguruj OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Następnie uruchom:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Jeśli `plugins.allow` jest niepustą listą restrykcyjną, jawne wybranie
ClickClack podczas konfiguracji kanału albo uruchomienie `openclaw plugins enable clickclack`
dopisuje `clickclack` do tej listy. Instalacja podczas onboardingu używa tego samego
zachowania opartego na jawnym wyborze. Te ścieżki nie nadpisują `plugins.deny` ani
globalnego ustawienia `plugins.enabled: false`. Bezpośrednie
`openclaw plugins install @openclaw/clickclack` działa zgodnie ze standardową
polityką instalacji pluginów i także zapisuje ClickClack w istniejącej allowliście.

## Wiele botów

Każde konto otwiera własne połączenie realtime z ClickClack i używa własnego tokena bota.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` używa bezpośrednio `api.runtime.llm.complete` do krótkich odpowiedzi bota.
Gdy konto ustawia `agentId`, OpenClaw wymaga jawnego bitu zaufania
`plugins.entries.clickclack.llm.allowAgentIdOverride`, aby plugin
mógł uruchamiać uzupełnienia dla tego agenta bota. Pozostaw to wyłączone, jeśli używasz tylko domyślnej
trasy agenta.

## Cele

- `channel:<name-or-id>` wysyła do kanału obszaru roboczego. Cele bez prefiksu domyślnie używają `channel:`.
- `dm:<user_id>` tworzy lub ponownie wykorzystuje bezpośrednią rozmowę z tym użytkownikiem.
- `thread:<message_id>` odpowiada w istniejącym wątku.

Przykłady:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Uprawnienia

Zakresy tokenów ClickClack są egzekwowane przez API ClickClack.

- `bot:read`: odczyt danych obszaru roboczego/kanału/wiadomości/wątku/DM/realtime/profilu.
- `bot:write`: `bot:read` oraz wiadomości kanału, odpowiedzi w wątkach, DM i przesyłanie plików.
- `bot:admin`: `bot:write` oraz tworzenie kanałów.

OpenClaw potrzebuje tylko `bot:write` do zwykłego czatu agenta.

## Rozwiązywanie problemów

- `ClickClack is not configured`: ustaw `channels.clickclack.token` albo `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: ustaw `workspace` na identyfikator obszaru roboczego albo slug zwrócony przez ClickClack.
- Brak odpowiedzi przychodzących: potwierdź, że token ma dostęp do odczytu realtime i że bot nie odpowiada na własne wiadomości.
- Wysyłanie do kanału kończy się niepowodzeniem: sprawdź, czy bot jest członkiem obszaru roboczego i ma `bot:write`.
