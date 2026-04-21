---
read_when:
    - Zmiana zachowania czatu grupowego lub ograniczania wzmianek
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-21T09:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Grupy

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp.
Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Zachowanie domyślne:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz ograniczanie wzmianek.

Tłumaczenie: nadawcy z listy dozwolonych mogą uruchamiać OpenClaw, wspominając o nim.

> W skrócie
>
> - **Dostęp do DM** jest kontrolowany przez `*.allowFrom`.
> - **Dostęp do grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
> - **Wyzwalanie odpowiedzi** jest kontrolowane przez ograniczanie wzmianek (`requireMention`, `/activation`).

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> odrzuć
groupPolicy? allowlist -> grupa dozwolona? nie -> odrzuć
requireMention? yes -> wspomniano? nie -> zapisz tylko jako kontekst
w przeciwnym razie -> odpowiedz
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup biorą udział dwa różne mechanizmy:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazywania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst w większości tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

Obecne zachowanie zależy od kanału:

- Niektóre kanały już stosują filtrowanie dodatkowego kontekstu na podstawie nadawcy w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków Matrix).
- Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania w postaci odebranej.

Kierunek utwardzenia (planowany):

- `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak odebrano”.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
- `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

Dopóki ten model utwardzenia nie zostanie wdrożony spójnie we wszystkich kanałach, należy oczekiwać różnic między platformami.

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
- Czaty bezpośrednie używają głównej sesji (lub sesji per nadawca, jeśli skonfigurowano).
- Heartbeat jest pomijany dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — to działa dobrze, jeśli Twój „osobisty” ruch to **DM**, a „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta wiadomości DM zwykle trafiają do klucza sesji **main** (`agent:main:main`), podczas gdy grupy zawsze używają kluczy sesji **non-main** (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym backendzie sandbox, podczas gdy Twoja główna sesja DM pozostanie na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Dzięki temu otrzymujesz jeden „umysł” agenta (wspólny obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

> Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobisty” i „publiczny” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).

Przykład (DM na hoście, grupy w sandboxie + tylko narzędzia komunikacyjne):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupy/kanały są non-main -> w sandboxie
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

Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i montuj do sandboxa tylko ścieżki z listy dozwolonych:

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
- Debugowanie, dlaczego narzędzie jest zablokowane: [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety interfejsu używają `displayName`, gdy jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Zasady grup

Kontroluj sposób obsługi wiadomości grupowych/pokojowych dla każdego kanału:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeryczny identyfikator użytkownika Telegram (kreator może rozwiązać @username)
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

| Policy        | Zachowanie                                                  |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Grupy omijają listy dozwolonych; ograniczanie wzmianek nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.            |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

Uwagi:

- `groupPolicy` jest oddzielne od ograniczania wzmianek (które wymaga @wzmianek).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (zapasowo: jawne `allowFrom`).
- Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) mają zastosowanie tylko do dostępu DM; autoryzacja nadawców grupowych pozostaje jawnie powiązana z grupowymi listami dozwolonych.
- Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
- Slack: lista dozwolonych używa `channels.slack.channels`.
- Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa najlepiej, jak to możliwe, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; listy dozwolonych `users` per pokój również są obsługiwane.
- Grupowe DM są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazwy użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
- Domyślnie obowiązuje `groupPolicy: "allowlist"`; jeśli Twoja grupowa lista dozwolonych jest pusta, wiadomości grupowe są blokowane.
- Bezpieczeństwo czasu działania: gdy całkowicie brakuje bloku providera (`channels.<provider>` nie istnieje), zasady grup wracają do trybu fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

Szybki model mentalny (kolejność oceny dla wiadomości grupowych):

1. `groupPolicy` (open/disabled/allowlist)
2. grupowe listy dozwolonych (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału)
3. ograniczanie wzmianek (`requireMention`, `/activation`)

## Ograniczanie wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla konkretnej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

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

- `mentionPatterns` to bezpieczne wzorce regex nieczułe na wielkość liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
- Platformy, które udostępniają jawne wzmianki, nadal je przekazują; wzorce są mechanizmem zapasowym.
- Nadpisanie per agent: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
- Ograniczanie wzmianek jest wymuszane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (natywne wzmianki lub skonfigurowane `mentionPatterns`).
- Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można nadpisać per serwer/kanał).
- Kontekst historii grupy jest opakowywany jednolicie we wszystkich kanałach i dotyczy tylko **pending-only** (wiadomości pominiętych z powodu ograniczania wzmianek); użyj `messages.groupChat.historyLimit` dla globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

## Ograniczenia narzędzi dla grup/kanałów (opcjonalnie)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz konkretnej grupy/pokoju/kanału**.

- `tools`: zezwalaj/blokuj narzędzia dla całej grupy.
- `toolsBySender`: nadpisania per nadawca w obrębie grupy.
  Używaj jawnych prefiksów kluczy:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`.
  Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe ma pierwszeństwo):

1. dopasowanie `toolsBySender` grupy/kanału
2. `tools` grupy/kanału
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

- Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo względem globalnych zasad narzędzi lub zasad narzędzi agenta (deny nadal ma pierwszeństwo).
- Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grupowe listy dozwolonych

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako grupowa lista dozwolonych. Użyj `"*"` , aby zezwolić na wszystkie grupy, a jednocześnie ustawić domyślne zachowanie wzmianki.

Częste nieporozumienie: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy.
W przypadku kanałów, które obsługują parowanie DM, magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo z udokumentowanego zapasowego mechanizmu konfiguracji dla tego kanału.

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

Właściciele grup mogą przełączać aktywację dla każdej grupy osobno:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny E.164 bota, jeśli nie jest ustawione). Wyślij polecenie jako samodzielną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik ograniczania wzmianek)
- Tematy forum Telegram zawierają również `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu zwykłego ograniczania grup.

Systemowy prompt agenta zawiera wprowadzenie do grupy przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste linie, stosował normalne odstępy czatu i unikał wpisywania dosłownych sekwencji `\n`.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Wyświetl czaty: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).
