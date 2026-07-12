---
read_when:
    - Konfigurowanie stale aktywnych pokojów grupowych lub kanałowych
    - Chcesz, aby agent śledził rozmowy w pokoju bez automatycznego publikowania końcowego tekstu
    - Debugowanie wskaźnika pisania i użycia tokenów bez widocznej wiadomości w pokoju
sidebarTitle: Ambient room events
summary: Zezwalaj obsługiwanym pokojom grupowym na dostarczanie kontekstu bez aktywnego udziału, chyba że agent wysyła wiadomość za pomocą narzędzia wiadomości
title: Zdarzenia otoczenia w pomieszczeniu
x-i18n:
    generated_at: "2026-07-12T14:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Zdarzenia otoczenia w pokoju umożliwiają OpenClaw przetwarzanie niewspominających agenta rozmów w grupie lub kanale jako dyskretnego kontekstu. Agent może aktualizować pamięć i stan sesji, ale pokój pozostaje cichy, chyba że agent jawnie wywoła narzędzie `message`.

W przypadku stale aktywnych czatów grupowych połącz `messages.groupChat.unmentionedInbound: "room_event"` z `messages.groupChat.visibleReplies: "message_tool"`. Agent nasłuchuje, decyduje, kiedy odpowiedź jest przydatna, i nie potrzebuje już starego wzorca promptu polegającego na odpowiadaniu `NO_REPLY`.

Obecnie obsługiwane są: kanały serwerów Discord, kanały i kanały prywatne Slack, wieloosobowe wiadomości bezpośrednie Slack oraz grupy i supergrupy Telegram. Inne kanały grupowe zachowują dotychczasowe działanie, chyba że ich strona informuje o obsłudze zdarzeń otoczenia w pokoju.

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

Następnie ustaw pokój jako stale aktywny, wyłączając dla niego wymóg wzmianki. Pokój nadal musi spełniać zwykłą zasadę `groupPolicy` oraz znajdować się na liście dozwolonych pokojów i liście dozwolonych nadawców.

Po zapisaniu konfiguracji Gateway zastosuje ustawienia `messages` bez restartu. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub ponowne wczytywanie konfiguracji jest wyłączone (`gateway.reload.mode: "off"`).

## Co się zmienia

Przy ustawieniu `messages.groupChat.unmentionedInbound: "room_event"`:

- dozwolone wiadomości grupowe lub kanałowe bez wzmianki stają się dyskretnymi zdarzeniami pokoju
- wiadomości ze wzmianką pozostają żądaniami użytkownika
- tekstowe polecenia sterujące i polecenia natywne pozostają żądaniami użytkownika
- żądania przerwania lub zatrzymania pozostają żądaniami użytkownika
- wiadomości bezpośrednie pozostają żądaniami użytkownika

Zdarzenia pokoju korzystają ze ścisłego trybu widocznego dostarczania. Końcowy tekst asystenta pozostaje prywatny. Aby opublikować wiadomość w pokoju, agent musi wywołać `message(action=send)`.

W przypadku zdarzeń pokoju wskaźnik pisania i reakcje stanu cyklu życia pozostają wyłączone. Jedynym jawnym wyjątkiem potwierdzenia odbioru jest `messages.ackReactionScope: "all"`, które wysyła skonfigurowaną reakcję potwierdzającą; jeśli pokój ma pozostać całkowicie cichy, użyj węższego zakresu lub `"off"`.

## Przykład dla Discord

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

Użyj konfiguracji Discord dla konkretnego kanału, jeśli tylko jeden kanał ma działać w trybie otoczenia. Przy ustawieniu `groupPolicy: "allowlist"` umieszczenie kanału na liście powoduje jego dopuszczenie (`enabled: false` wyłącza wpis):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Przykład dla Slack

Listy dozwolonych kanałów Slack opierają się przede wszystkim na identyfikatorach. Używaj identyfikatorów kanałów, takich jak `C12345678`, a nie `#channel-name`. Umieszczenie kanału w `channels.slack.channels` powoduje jego dopuszczenie (`enabled: false` wyłącza wpis):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Przykład dla Telegram

W grupach Telegram bot musi mieć możliwość odczytywania zwykłych wiadomości grupowych. Jeśli ustawiono `requireMention: false`, wyłącz tryb prywatności BotFather lub użyj innej konfiguracji Telegram, która przekazuje botowi pełny ruch grupowy.

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

Identyfikatory grup Telegram są zwykle liczbami ujemnymi, takimi jak `-1001234567890`. Odczytaj `chat.id` z `openclaw logs --follow`, przekaż wiadomość grupową botowi pomocniczemu podającemu identyfikatory albo sprawdź `getUpdates` w Bot API.

## Zasada właściwa dla agenta

Użyj nadpisania dla agenta, gdy kilku agentów współdzieli ten sam pokój, ale tylko jeden powinien traktować rozmowy bez wzmianki jako kontekst otoczenia:

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

Wartość `agents.list[].groupChat.unmentionedInbound` właściwa dla agenta zastępuje dla niego wartość `messages.groupChat.unmentionedInbound`.

## Tryby widocznych odpowiedzi

Domyślną wartością `messages.groupChat.visibleReplies` jest `"automatic"` dla zwykłych żądań użytkownika w grupie lub kanale. Zachowaj tę wartość domyślną, jeśli końcowy tekst asystenta ma być publikowany w widoczny sposób bez jawnego wywołania narzędzia wiadomości.

W przypadku stale aktywnych pokojów otoczenia nadal zaleca się `messages.groupChat.visibleReplies: "message_tool"`, szczególnie z modelami najnowszej generacji, które niezawodnie używają narzędzi, takimi jak GPT-5.6 Sol. Pozwala to agentowi decydować, kiedy zabrać głos, przez wywołanie narzędzia wiadomości. Jeśli model zwróci końcowy tekst bez wywołania narzędzia, OpenClaw zachowa go jako prywatny i zarejestruje metadane wstrzymanego dostarczenia.

Zdarzenia pokoju pozostają objęte ścisłymi zasadami, nawet gdy inne żądania grupowe korzystają z odpowiedzi automatycznych. Zdarzenia otoczenia w pokoju bez wzmianki zawsze wymagają `message(action=send)`, aby dane wyjściowe były widoczne.

## Historia

`messages.groupChat.historyLimit` ustawia globalną domyślną długość historii grupy (50, jeśli nie ustawiono; wartość musi być dodatnią liczbą całkowitą). Kanały mogą ją zastąpić za pomocą `channels.<channel>.historyLimit`, a niektóre kanały obsługują również limity historii właściwe dla konta. Ustaw `historyLimit: 0` na poziomie kanału, aby wyłączyć kontekst historii grupy dla tego kanału.

Kanały obsługujące zdarzenia pokoju zachowują ostatnie wiadomości otoczenia w pokoju jako kontekst. Telegram przechowuje stale aktywne, przesuwne okno dla każdej grupy, ograniczone przez `historyLimit`; tury żądań użytkownika wybierają wpisy po ostatniej zarejestrowanej odpowiedzi bota, natomiast tury zdarzeń pokoju otrzymują pełne ostatnie okno, dzięki czemu model może zobaczyć własne niedawne wpisy. Wycofany klucz trybu Telegram `includeGroupHistoryContext` jest usuwany przez `openclaw doctor --fix`.

## Rozwiązywanie problemów

Jeśli w pokoju widać wskaźnik pisania lub użycie tokenów, ale nie pojawia się widoczna wiadomość:

1. Potwierdź, że pokój jest dozwolony przez listę dozwolonych kanału i listę dozwolonych nadawców.
2. Potwierdź, że `requireMention: false` ustawiono na oczekiwanym poziomie pokoju.
3. Sprawdź, czy `messages.groupChat.unmentionedInbound` lub nadpisanie dla agenta ma wartość `"room_event"`.
4. Sprawdź dzienniki pod kątem metadanych wstrzymanego końcowego ładunku lub `didSendViaMessagingTool: false`.
5. W przypadku zwykłych żądań grupowych zachowaj lub przywróć `messages.groupChat.visibleReplies: "automatic"`, jeśli końcowe odpowiedzi mają być publikowane automatycznie. W pokojach otoczenia używających `message_tool` użyj modelu lub środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia.

Jeśli pokoje otoczenia Telegram w ogóle nie wyzwalają zdarzeń, sprawdź tryb prywatności BotFather i upewnij się, że Gateway odbiera zwykłe wiadomości grupowe.

Jeśli pokoje otoczenia Slack nie wyzwalają zdarzeń, upewnij się, że klucz kanału jest identyfikatorem kanału Slack, a aplikacja ma zakres dostępu do historii odpowiedni dla danego typu pokoju: `channels:history` (publiczny), `groups:history` (prywatny) lub `mpim:history` (wieloosobowe wiadomości bezpośrednie).

## Powiązane

- [Grupy](/pl/channels/groups)
- [Discord](/pl/channels/discord)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Dokumentacja konfiguracji kanałów](/pl/gateway/config-channels)
