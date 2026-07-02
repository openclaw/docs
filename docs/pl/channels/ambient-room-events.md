---
read_when:
    - Konfigurowanie stale aktywnych pokoi grup lub kanałów
    - Chcesz, aby agent obserwował rozmowy w pokoju bez automatycznego publikowania końcowego tekstu
    - Debugowanie pisania i użycia tokenów bez widocznej wiadomości w pokoju
sidebarTitle: Ambient room events
summary: Niech obsługiwane pokoje grupowe zapewniają cichy kontekst, chyba że agent wysyła za pomocą narzędzia wiadomości
title: Zdarzenia otoczenia w pomieszczeniu
x-i18n:
    generated_at: "2026-07-02T17:47:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Zdarzenia otoczenia pokoju pozwalają OpenClaw przetwarzać niewspomniane rozmowy grupowe lub kanałowe jako cichy kontekst. Agent może aktualizować pamięć i stan sesji, ale pokój pozostaje cichy, chyba że agent jawnie wywoła narzędzie `message`.

W przypadku zawsze aktywnych czatów grupowych jest to zalecany tryb: połącz `messages.groupChat.unmentionedInbound: "room_event"` z `messages.groupChat.visibleReplies: "message_tool"`. Użyj go, gdy agent powinien nasłuchiwać, decydować, kiedy odpowiedź jest przydatna, i unikać starego wzorca promptu polegającego na odpowiadaniu `NO_REPLY`.

Obsługiwane obecnie: kanały gildii Discord, kanały Slack i kanały prywatne, wieloosobowe wiadomości prywatne Slack oraz grupy lub supergrupy Telegram. Inne kanały grupowe zachowują swoje dotychczasowe zachowanie grupowe, chyba że ich strona kanału wskazuje, że obsługują zdarzenia otoczenia pokoju.

## Zalecana konfiguracja

Ustaw globalne zachowanie czatu grupowego:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Następnie skonfiguruj sam pokój jako zawsze aktywny, wyłączając dla niego bramkowanie wzmianką. Kanał nadal musi być dozwolony przez swoją zwykłą zasadę `groupPolicy`, listę dozwolonych pokoi i listę dozwolonych nadawców.

Po zapisaniu konfiguracji Gateway przeładowuje na gorąco ustawienia `messages`. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone.

## Co się zmienia

Z `messages.groupChat.unmentionedInbound: "room_event"`:

- niewspomniane dozwolone wiadomości grupowe lub kanałowe stają się cichymi zdarzeniami pokoju
- wspomniane wiadomości pozostają żądaniami użytkownika
- polecenia tekstowe i polecenia natywne pozostają żądaniami użytkownika
- żądania przerwania lub zatrzymania pozostają żądaniami użytkownika
- wiadomości bezpośrednie pozostają żądaniami użytkownika

Zdarzenia pokoju używają ścisłego dostarczania widocznego. Końcowy tekst asystenta jest prywatny. Agent musi wywołać `message(action=send)`, aby opublikować wiadomość w pokoju.

## Przykład Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Użyj konfiguracji Discord dla konkretnego kanału, gdy tylko jeden kanał ma być otoczeniowy:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Przykład Slack

Listy dozwolonych kanałów Slack są najpierw oparte na identyfikatorach. Używaj identyfikatorów kanałów, takich jak `C12345678`, a nie `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Przykład Telegram

W przypadku grup Telegram bot musi widzieć zwykłe wiadomości grupowe. Jeśli `requireMention: false`, wyłącz tryb prywatności BotFather albo użyj innej konfiguracji Telegram, która dostarcza botowi pełny ruch grupowy.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Identyfikatory grup Telegram to zwykle liczby ujemne, takie jak `-1001234567890`. Odczytaj `chat.id` z `openclaw logs --follow`, prześlij dalej wiadomość grupową do bota pomocniczego identyfikatorów albo sprawdź `getUpdates` Bot API.

## Zasada właściwa dla agenta

Użyj nadpisania agenta, gdy kilku agentów współdzieli ten sam pokój, ale tylko jeden powinien traktować niewspomniane rozmowy jako kontekst otoczenia:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Wartość `agents.list[].groupChat.unmentionedInbound` właściwa dla agenta nadpisuje `messages.groupChat.unmentionedInbound` dla tego agenta.

## Tryby widocznych odpowiedzi

`messages.groupChat.visibleReplies` domyślnie ma wartość `"automatic"` dla zwykłych żądań użytkownika w grupie/kanale. Zachowaj tę wartość domyślną, gdy chcesz, aby końcowy tekst asystenta był publikowany widocznie bez wymagania jawnego wywołania narzędzia wiadomości.

W przypadku zawsze aktywnych pokoi otoczeniowych `messages.groupChat.visibleReplies: "message_tool"` nadal jest zalecane, szczególnie z najnowszej generacji modelami niezawodnymi w używaniu narzędzi, takimi jak GPT 5.5. Pozwala agentowi zdecydować, kiedy się odezwać, przez wywołanie narzędzia wiadomości. Jeśli model zwróci końcowy tekst bez wywołania narzędzia, OpenClaw zachowa ten tekst końcowy jako prywatny i zapisze metadane wstrzymanego dostarczenia w logach.

Zdarzenia pokoju pozostają ścisłe nawet wtedy, gdy inne żądania grupowe używają automatycznych odpowiedzi. Niewspomniane zdarzenia otoczenia pokoju nadal wymagają `message(action=send)` w celu uzyskania widocznego wyjścia.

## Historia

`messages.groupChat.historyLimit` kontroluje globalną domyślną historię grupy. Kanały mogą ją nadpisać za pomocą `channels.<channel>.historyLimit`, a niektóre kanały obsługują także limity historii dla konkretnego konta.

Ustaw `historyLimit: 0`, aby wyłączyć kontekst historii grupy.

Obsługiwane kanały zdarzeń pokoju zachowują ostatnie wiadomości otoczenia pokoju jako kontekst. Telegram utrzymuje zawsze aktywne, kroczące okno dla każdej grupy ograniczone przez `historyLimit`; przebiegi żądań użytkownika wybierają wpisy po ostatniej zapisanej odpowiedzi bota, podczas gdy przebiegi zdarzeń pokoju otrzymują pełne ostatnie okno, aby model mógł widzieć swoje ostatnie posty. Wycofany klucz trybu Telegram `includeGroupHistoryContext` jest usuwany przez `openclaw doctor --fix`.

## Rozwiązywanie problemów

Jeśli pokój pokazuje pisanie lub użycie tokenów, ale nie ma widocznej wiadomości:

1. Potwierdź, że pokój jest dozwolony przez listę dozwolonych kanału i listę dozwolonych nadawców.
2. Potwierdź, że `requireMention: false` jest ustawione na oczekiwanym poziomie pokoju.
3. Sprawdź, czy `messages.groupChat.unmentionedInbound` albo nadpisanie agenta ma wartość `"room_event"`.
4. Sprawdź logi pod kątem metadanych wstrzymanego końcowego ładunku lub `didSendViaMessagingTool: false`.
5. W przypadku zwykłych żądań grupowych zachowaj lub przywróć `messages.groupChat.visibleReplies: "automatic"`, jeśli chcesz, aby końcowe odpowiedzi były publikowane automatycznie. W przypadku pokoi otoczeniowych używających `message_tool` użyj modelu/runtime'u, który niezawodnie wywołuje narzędzia.

Jeśli pokoje otoczeniowe Telegram w ogóle się nie wyzwalają, sprawdź tryb prywatności BotFather i zweryfikuj, czy Gateway odbiera zwykłe wiadomości grupowe.

Jeśli pokoje otoczeniowe Slack się nie wyzwalają, zweryfikuj, czy klucz kanału jest identyfikatorem kanału Slack i czy aplikacja ma wymagany zakres `channels:history` lub `groups:history` dla tego typu pokoju.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Discord](/pl/channels/discord)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Informacje o konfiguracji kanałów](/pl/gateway/config-channels)
