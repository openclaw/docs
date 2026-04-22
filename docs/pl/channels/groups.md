---
read_when:
    - Zmiana zachowania czatu grupowego lub ograniczania odpowiedzi do wzmianek
summary: Zachowanie czatu grupowego na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# Grupy

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika-bota WhatsApp.
Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Zachowanie domyślne:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz ograniczanie odpowiedzi do wzmianek.

Innymi słowy: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wzmiankując go.

> W skrócie
>
> - Dostęp do **DM** jest kontrolowany przez `*.allowFrom`.
> - Dostęp do **grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
> - **Wyzwalanie odpowiedzi** jest kontrolowane przez ograniczanie do wzmianek (`requireMention`, `/activation`).

Szybki przebieg (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> odrzuć
groupPolicy? allowlist -> grupa dozwolona? nie -> odrzuć
requireMention? tak -> wspomniano? nie -> zachowaj tylko dla kontekstu
w przeciwnym razie -> odpowiedz
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup uczestniczą dwa różne mechanizmy:

- **Autoryzacja wyzwolenia**: kto może uruchomić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania dalej).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie w postaci, w jakiej został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytatu czy fragmentu historii.

Bieżące zachowanie zależy od kanału:

- Niektóre kanały już stosują filtrowanie dodatkowego kontekstu na podstawie nadawcy w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków w Matrix).
- Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania dalej w odebranej postaci.

Kierunek utwardzania (planowany):

- `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak odebrano”.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
- `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, należy oczekiwać różnic zależnie od platformy.

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                 |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi w grupach      | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz uruchamiać w grupach         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, więc każdy temat ma własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub sesji per nadawca, jeśli jest skonfigurowana).
- Heartbeat są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — to działa dobrze, jeśli Twój „osobisty” ruch to **DM**, a „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta wiadomości DM zazwyczaj trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym backendzie sandbox, podczas gdy Twoja główna sesja DM pozostanie na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

> Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routowanie wielu agentów](/pl/concepts/multi-agent).

Przykład (DM na hoście, grupy w sandboxie + tylko narzędzia do wiadomości):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupy/kanały są niegłówne -> w sandboxie
        scope: "session", // najsilniejsza izolacja (jeden kontener na grupę/kanał)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Jeśli allow nie jest puste, wszystko inne jest blokowane (deny nadal ma pierwszeństwo).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj do sandboxa tylko ścieżki z listy dozwolonych:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Powiązane:

- Klucze konfiguracji i wartości domyślne: [Konfiguracja Gateway](/pl/gateway/configuration-reference#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlane

- Etykiety interfejsu używają `displayName`, gdy jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Zasady grup

Kontrolują sposób obsługi wiadomości grupowych/pokojów dla każdego kanału:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeryczny identyfikator użytkownika Telegram (kreator może rozpoznać @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Zasada       | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; ograniczanie do wzmianek nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

Uwagi:

- `groupPolicy` jest niezależne od ograniczania do wzmianek (które wymaga @wzmianek).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: używają `groupAllowFrom` (zapasowo: jawne `allowFrom`).
- Zatwierdzenia parowania DM (wpisy w magazynie `*-allowFrom`) dotyczą tylko dostępu do DM; autoryzacja nadawcy w grupach pozostaje jawna w listach dozwolonych dla grup.
- Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
- Slack: lista dozwolonych używa `channels.slack.channels`.
- Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory lub aliasy pokoi; wyszukiwanie nazw dołączonych pokoi jest realizowane metodą best-effort, a nierozpoznane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są też listy dozwolonych `users` per pokój.
- Grupowe DM są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazwy użytkowników (`"@alice"` lub `"alice"`); prefiksy nie rozróżniają wielkości liter.
- Domyślnie obowiązuje `groupPolicy: "allowlist"`; jeśli Twoja lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
- Bezpieczeństwo wykonania: gdy blok dostawcy jest całkowicie nieobecny (`channels.<provider>` nie istnieje), zasady grup przechodzą do trybu fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

Szybki model myślowy (kolejność oceny wiadomości grupowych):

1. `groupPolicy` (open/disabled/allowlist)
2. listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału)
3. ograniczanie do wzmianek (`requireMention`, `/activation`)

## Ograniczanie do wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla danej grupy. Wartości domyślne znajdują się per podsystem pod `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał
obsługuje metadane odpowiedzi. Cytowanie wiadomości bota również może liczyć się jako niejawna
wzmianka na kanałach, które udostępniają metadane cytatu. Obecnie wbudowane przypadki obejmują
Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Uwagi:

- `mentionPatterns` to bezpieczne wzorce regex bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
- Platformy, które dostarczają jawne wzmianki, nadal je przekazują; wzorce są mechanizmem zapasowym.
- Nadpisanie per agent: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
- Ograniczanie do wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (natywne wzmianki lub skonfigurowane `mentionPatterns`).
- Domyślne ustawienia Discord znajdują się w `channels.discord.guilds."*"` (z możliwością nadpisania per serwer/kanał).
- Kontekst historii grupy jest opakowany jednolicie we wszystkich kanałach i obejmuje tylko **oczekujące** wiadomości (pominięte z powodu ograniczania do wzmianek); użyj `messages.groupChat.historyLimit` dla wartości domyślnej globalnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

## Ograniczenia narzędzi dla grup/kanałów (opcjonalnie)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwalaj/blokuj narzędzia dla całej grupy.
- `toolsBySender`: nadpisania per nadawca wewnątrz grupy.
  Używaj jawnych prefiksów kluczy:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` i wildcard `"*"`.
  Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe ma pierwszeństwo):

1. dopasowanie `toolsBySender` dla grupy/kanału
2. `tools` dla grupy/kanału
3. dopasowanie domyślnego (`"*"`) `toolsBySender`
4. domyślne (`"*"`) `tools`

Przykład (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Uwagi:

- Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo względem globalnych zasad narzędzi lub zasad narzędzi agenta (`deny` nadal ma pierwszeństwo).
- Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listy dozwolonych grup

Gdy skonfigurowane są `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"` , aby zezwolić na wszystkie grupy, a jednocześnie ustawić domyślne zachowanie dotyczące wzmianek.

Częsta pomyłka: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy.
W kanałach obsługujących parowanie DM magazyn parowań odblokowuje wyłącznie DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo z udokumentowanego zapasowego ustawienia konfiguracji dla danego kanału.

Typowe cele (kopiuj/wklej):

1. Wyłącz wszystkie odpowiedzi w grupach

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Zezwól tylko na określone grupy (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Zezwól na wszystkie grupy, ale wymagaj wzmianki (jawnie)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Tylko właściciel może uruchamiać w grupach (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Aktywacja (tylko właściciel)

Właściciele grup mogą przełączać aktywację dla każdej grupy osobno:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub przez własny numer E.164 bota, gdy nie jest ustawione). Wyślij polecenie jako samodzielną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik ograniczania do wzmianek)
- Tematy forum Telegram dodatkowo zawierają `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu standardowego ograniczania grup.

System prompt agenta zawiera wprowadzenie do grupy przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, ograniczał puste linie i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`.

## Szczegóły iMessage

- Przy routingu lub tworzeniu list dozwolonych preferuj `chat_id:<id>`.
- Wyświetlanie listy czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## System prompts WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne zasady system promptów WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie wildcard oraz semantykę nadpisywania kont.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).
