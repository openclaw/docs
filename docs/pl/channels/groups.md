---
read_when:
    - Zmiana zachowania czatów grupowych lub bramkowania wzmianek
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-07T09:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5045badbba30587c8f1bf27f6b940c7c471a95c57093c9adb142374413ac81e
    source_path: channels/groups.md
    workflow: 15
---

# Grupy

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika-bota WhatsApp.
Jeśli **jesteś** w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianek.

Innymi słowy: nadawcy z listy dozwolonych mogą wywołać OpenClaw, wspominając go.

> W skrócie
>
> - Dostęp do **wiadomości prywatnych** jest kontrolowany przez `*.allowFrom`.
> - Dostęp do **grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
> - **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmianek (`requireMention`, `/activation`).

Szybki przebieg (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grupowym biorą udział dwa różne mechanizmy:

- **Autoryzacja wyzwolenia**: kto może wywołać agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki kontekst uzupełniający jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw stawia na standardowe zachowanie czatu i w większości zachowuje kontekst tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wywoływać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

Obecne zachowanie zależy od kanału:

- Niektóre kanały już stosują filtrowanie oparte na nadawcy dla kontekstu uzupełniającego w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków Matrix).
- Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

Kierunek utwardzania (planowany):

- `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „jak odebrano”.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców z listy dozwolonych.
- `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, należy oczekiwać różnic zależnie od platformy.

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                 |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz wywoływać w grupach          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub osobnej dla nadawcy, jeśli tak skonfigurowano).
- Heartbeaty są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: prywatne wiadomości + publiczne grupy (jeden agent)

Tak — to działa dobrze, jeśli Twój „prywatny” ruch to **wiadomości prywatne**, a „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta wiadomości prywatne zwykle trafiają do klucza sesji **main** (`agent:main:main`), podczas gdy grupy zawsze używają kluczy sesji **non-main** (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w Dockerze, a Twoja główna sesja wiadomości prywatnych pozostanie na hoście.

Daje to jeden „mózg” agenta (wspólna przestrzeń robocza + pamięć), ale dwie różne postawy wykonawcze:

- **Wiadomości prywatne**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia (Docker)

> Jeśli potrzebujesz naprawdę oddzielnych przestrzeni roboczych/person („prywatne” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Multi-Agent Routing](/pl/concepts/multi-agent).

Przykład (wiadomości prywatne na hoście, grupy w sandboxie + tylko narzędzia do komunikacji):

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

Chcesz, aby „grupy widziały tylko folder X” zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj do sandboxa tylko ścieżki z listy dozwolonych:

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

- Klucze konfiguracji i wartości domyślne: [Gateway configuration](/pl/gateway/configuration-reference#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, jeśli jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Zasada grup

Steruj sposobem obsługi wiadomości grupowych/pokojów dla każdego kanału:

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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Zasada       | Zachowanie                                                   |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Grupy omijają listy dozwolonych; bramkowanie wzmianek nadal obowiązuje. |
| `"disabled"` | Całkowicie blokuj wszystkie wiadomości grupowe.              |
| `"allowlist"` | Zezwalaj tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

Uwagi:

- `groupPolicy` jest oddzielne od bramkowania wzmianek (które wymaga @wzmianek).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: używaj `groupAllowFrom` (rezerwa: jawne `allowFrom`).
- Zatwierdzenia parowania wiadomości prywatnych (wpisy w `*-allowFrom`) dotyczą wyłącznie dostępu do wiadomości prywatnych; autoryzacja nadawcy grupowego pozostaje jawnie zależna od list dozwolonych grup.
- Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
- Slack: lista dozwolonych używa `channels.slack.channels`.
- Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa na zasadzie best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` dla poszczególnych pokoi.
- Grupowe wiadomości prywatne są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazwy użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
- Domyślnie jest `groupPolicy: "allowlist"`; jeśli Twoja lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
- Bezpieczeństwo w czasie działania: gdy cały blok dostawcy nie istnieje (`channels.<provider>` nieobecne), zasada grup wraca do trybu fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

Szybki model mentalny (kolejność oceny dla wiadomości grupowych):

1. `groupPolicy` (open/disabled/allowlist)
2. listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału)
3. bramkowanie wzmianek (`requireMention`, `/activation`)

## Bramkowanie wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu pod `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał
obsługuje metadane odpowiedzi. Cytowanie wiadomości bota także może liczyć się jako niejawna
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
- Platformy, które udostępniają jawne wzmianki, nadal je przekazują; wzorce są mechanizmem zapasowym.
- Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (natywne wzmianki lub skonfigurowane `mentionPatterns`).
- Domyślne ustawienia Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla poszczególnych serwerów/kanałów).
- Kontekst historii grupy jest opakowany jednolicie we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania wzmianek); użyj `messages.groupChat.historyLimit` jako wartości domyślnej globalnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

## Ograniczenia narzędzi dla grup/kanałów (opcjonalnie)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwalaj/blokuj narzędzia dla całej grupy.
- `toolsBySender`: nadpisania dla poszczególnych nadawców w obrębie grupy.
  Używaj jawnych prefiksów kluczy:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`.
  Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe wygrywa):

1. dopasowanie `toolsBySender` grupy/kanału
2. `tools` grupy/kanału
3. domyślne dopasowanie (`"*"` ) `toolsBySender`
4. domyślne `tools` (`"*"`)

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

- Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo do globalnej/agentowej polityki narzędzi (blokada nadal wygrywa).
- Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie ustawiając domyślne zachowanie dla wzmianek.

Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych to nie to samo co autoryzacja grupy.
W kanałach obsługujących parowanie wiadomości prywatnych magazyn parowań odblokowuje tylko wiadomości prywatne. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, lub z udokumentowanego mechanizmu rezerwowego dla danego kanału.

Typowe intencje (kopiuj/wklej):

1. Wyłącz wszystkie odpowiedzi grupowe

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Zezwalaj tylko na określone grupy (WhatsApp)

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

3. Zezwalaj na wszystkie grupy, ale wymagaj wzmianki (jawnie)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Tylko właściciel może wywoływać w grupach (WhatsApp)

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

Właściciele grup mogą przełączać aktywację dla każdej grupy:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny E.164 bota, jeśli nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianek)
- Tematy forum Telegram zawierają także `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanałów:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu standardowego bramkowania grup.

Systemowy prompt agenta zawiera wprowadzenie do grupy przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, ograniczał puste linie i stosował normalne odstępy czatu, a także unikał wpisywania dosłownych sekwencji `\n`.

## Szczegóły iMessage

- Przy routingu lub dodawaniu do listy dozwolonych preferuj `chat_id:<id>`.
- Wyświetl listę czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Szczegóły WhatsApp

Zobacz [Group messages](/pl/channels/group-messages), aby poznać zachowanie specyficzne dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).
