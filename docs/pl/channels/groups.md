---
read_when:
    - Zmieniasz zachowanie czatów grupowych lub reguły wymuszania wzmianek
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-05T13:44:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# Grupy

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika-bota WhatsApp.
Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz wymuszanie wzmianek.

Inaczej mówiąc: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wspominając o nim.

> TL;DR
>
> - Dostęp do **DM** jest kontrolowany przez `*.allowFrom`.
> - Dostęp do **grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
> - **Wyzwalanie odpowiedzi** jest kontrolowane przez wymuszanie wzmianek (`requireMention`, `/activation`).

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grupowym biorą udział dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwolenia**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie w takiej postaci, w jakiej został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wywoływać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

Obecne zachowanie zależy od kanału:

- Niektóre kanały już stosują filtrowanie kontekstu dodatkowego oparte na nadawcy w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków Matrix).
- Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania w odebranej postaci.

Planowany kierunek utwardzenia:

- `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak odebrano”.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
- `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

Dopóki ten model utwardzenia nie zostanie spójnie wdrożony we wszystkich kanałach, należy oczekiwać różnic zależnie od platformy.

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                 |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub sesji per nadawca, jeśli tak skonfigurowano).
- Heartbeat jest pomijany dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — to działa dobrze, jeśli Twój ruch „osobisty” to **DM**, a ruch „publiczny” to **grupy**.

Dlaczego: w trybie pojedynczego agenta wiadomości DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają kluczy sesji **innych niż główna** (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w Dockerze, podczas gdy Twoja główna sesja DM pozostanie na hoście.

Daje to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwa tryby wykonywania:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + narzędzia ograniczone do komunikacji

> Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobisty” i „publiczny” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/concepts/multi-agent).

Przykład (DM na hoście, grupy w sandboxie + tylko narzędzia komunikacyjne):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Chcesz, aby „grupy widziały tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w sandboxie tylko ścieżki z listy dozwolonych:

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

- Klucze konfiguracji i wartości domyślne: [Konfiguracja gateway](/gateway/configuration-reference#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlane

- Etykiety interfejsu używają `displayName`, gdy jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokojów/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grup

Kontroluj sposób obsługi wiadomości grupowych/pokojów dla każdego kanału:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Polityka      | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; wymuszanie wzmianek nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

Uwagi:

- `groupPolicy` jest oddzielne od wymuszania wzmianek (które wymaga @wzmianek).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (awaryjnie: jawne `allowFrom`).
- Zatwierdzenia parowania DM (wpisy `*-allowFrom` w magazynie) dotyczą tylko dostępu do DM; autoryzacja nadawców w grupach pozostaje jawnie kontrolowana przez grupowe listy dozwolonych.
- Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
- Slack: lista dozwolonych używa `channels.slack.channels`.
- Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokojów lub aliasy; wyszukiwanie nazw dołączonych pokojów działa w trybie best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są też listy dozwolonych `users` per pokój.
- Grupowe DM są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) albo nazwy użytkowników (`"@alice"` lub `"alice"`); prefiksy nie rozróżniają wielkości liter.
- Domyślnie ustawione jest `groupPolicy: "allowlist"`; jeśli grupowa lista dozwolonych jest pusta, wiadomości grupowe są blokowane.
- Bezpieczeństwo w czasie działania: gdy całkowicie brakuje bloku dostawcy (`channels.<provider>` nie istnieje), polityka grup przechodzi do trybu fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

Szybki model mentalny (kolejność oceny wiadomości grupowych):

1. `groupPolicy` (`open`/`disabled`/`allowlist`)
2. grupowe listy dozwolonych (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału)
3. wymuszanie wzmianek (`requireMention`, `/activation`)

## Wymuszanie wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to zastąpione dla konkretnej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka (gdy kanał obsługuje metadane odpowiedzi). Dotyczy to Telegram, WhatsApp, Slack, Discord i Microsoft Teams.

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

- `mentionPatterns` to bezpieczne wzorce regex niewrażliwe na wielkość liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
- Platformy, które dostarczają jawne wzmianki, nadal je przekazują; wzorce są rozwiązaniem awaryjnym.
- Zastąpienie per agent: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wiele agentów współdzieli grupę).
- Wymuszanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
- Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać per serwer/kanał).
- Kontekst historii grupy jest opakowany jednolicie we wszystkich kanałach i obejmuje tylko **oczekujące** wiadomości (wiadomości pominięte z powodu wymuszania wzmianek); użyj `messages.groupChat.historyLimit` dla globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

## Ograniczenia narzędzi dla grup/kanałów (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwala/zabrania narzędzi dla całej grupy.
- `toolsBySender`: nadpisania per nadawca w obrębie grupy.
  Używaj jawnych prefiksów kluczy:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`.
  Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe wygrywa):

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

- Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo do globalnej/polityki narzędzi agenta (`deny` nadal wygrywa).
- Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grupowe listy dozwolonych

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako grupowa lista dozwolonych. Użyj `"*"`, aby zezwolić na wszystkie grupy, a jednocześnie ustawić domyślne zachowanie dotyczące wzmianek.

Częste nieporozumienie: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy.
W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupy z list dozwolonych w konfiguracji, takich jak `groupAllowFrom` lub opisane awaryjne ustawienie konfiguracji dla danego kanału.

Typowe intencje (kopiuj/wklej):

1. Wyłącz wszystkie odpowiedzi grupowe

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

4. Tylko właściciel może wyzwalać w grupach (WhatsApp)

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

Właściciele grup mogą przełączać aktywację per grupa:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny E.164 bota, jeśli nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik wymuszania wzmianki)
- Tematy forum Telegram zawierają też `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanałów:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy kontaktów przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i działa dopiero po przejściu zwykłych reguł kontroli grup.

Prompt systemowy agenta zawiera wprowadzenie grupowe przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown i nie wpisywał dosłownych sekwencji `\n`.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Wyświetl listę czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).
