---
read_when:
    - Zmiana zachowania czatów grupowych lub bramkowania wzmianek
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-24T08:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma oddzielnego użytkownika-bota WhatsApp.
Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianek.

Innymi słowy: nadawcy z listy dozwolonych mogą wywołać OpenClaw, wzmiankując go.

> TL;DR
>
> - Dostęp do **DM** jest kontrolowany przez `*.allowFrom`.
> - Dostęp do **grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
> - **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmianek (`requireMention`, `/activation`).

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> odrzuć
groupPolicy? allowlist -> grupa dozwolona? nie -> odrzuć
requireMention? tak -> wzmiankowano? nie -> zapisz tylko dla kontekstu
w przeciwnym razie -> odpowiedz
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup biorą udział dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może wywołać agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki kontekst uzupełniający jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje zwykłe zachowanie czatu i zachowuje kontekst głównie w takiej postaci, w jakiej został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wywoływać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

Obecne zachowanie jest zależne od kanału:

- Niektóre kanały już stosują filtrowanie uzupełniającego kontekstu według nadawcy w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków Matrix).
- Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania w takiej postaci, w jakiej został odebrany.

Kierunek utwardzania (planowany):

- `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak odebrano”.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców z listy dozwolonych.
- `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, należy oczekiwać różnic między platformami.

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                 |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi w grupach      | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz wywoływać w grupach          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub sesji per nadawca, jeśli jest skonfigurowana).
- Heartbeat jest pomijany dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — to działa dobrze, jeśli Twój ruch „osobisty” to **DM**, a ruch „publiczny” to **grupy**.

Dlaczego: w trybie jednego agenta DM zwykle trafiają do klucza sesji **głównej** (`agent:main:main`), podczas gdy grupy zawsze używają kluczy sesji **innych niż główna** (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym backendzie sandboxa, podczas gdy Twoja główna sesja DM pozostanie na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jednego „mózga” agenta (współdzielony obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

> Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + bindings. Zobacz [Multi-Agent Routing](/pl/concepts/multi-agent).

Przykład (DM na hoście, grupy w sandboxie + tylko narzędzia do wiadomości):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupy/kanały są non-main -> sandbox
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

Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w sandboxie tylko ścieżki z listy dozwolonych:

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

- Klucze konfiguracji i wartości domyślne: [Gateway configuration](/pl/gateway/config-agents#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły bind mountów: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety interfejsu używają `displayName`, gdy jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowuje `#@+._-`).

## Zasady grup

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

| Zasada         | Zachowanie                                                   |
| -------------- | ------------------------------------------------------------ |
| `"open"`       | Grupy omijają listy dozwolonych; bramkowanie wzmianek nadal obowiązuje. |
| `"disabled"`   | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"`  | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

Uwagi:

- `groupPolicy` jest oddzielne od bramkowania wzmianek (które wymaga @wzmianek).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: używają `groupAllowFrom` (fallback: jawne `allowFrom`).
- Zatwierdzenia parowania DM (wpisy w magazynie `*-allowFrom`) dotyczą tylko dostępu DM; autoryzacja nadawców grupowych pozostaje jawnie kontrolowana przez listy dozwolonych grup.
- Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
- Slack: lista dozwolonych używa `channels.slack.channels`.
- Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa na zasadzie best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` per pokój.
- Grupowe DM są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazw użytkowników (`"@alice"` albo `"alice"`); prefiksy są niewrażliwe na wielkość liter.
- Wartość domyślna to `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
- Bezpieczeństwo środowiska uruchomieniowego: gdy całkowicie brakuje bloku dostawcy (`channels.<provider>` nie istnieje), zasady grup przechodzą w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

Szybki model mentalny (kolejność oceny wiadomości grupowych):

1. `groupPolicy` (open/disabled/allowlist)
2. listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału)
3. bramkowanie wzmianek (`requireMention`, `/activation`)

## Bramkowanie wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla konkretnej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

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

- `mentionPatterns` to bezpieczne wzorce regex niewrażliwe na wielkość liter; nieprawidłowe wzorce i niebezpieczne zagnieżdżone formy powtórzeń są ignorowane.
- Platformy, które dostarczają jawne wzmianki, nadal je przekazują; wzorce są rozwiązaniem zapasowym.
- Nadpisanie per agent: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (natywne wzmianki lub skonfigurowane `mentionPatterns`).
- Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (mogą być nadpisane per guild/kanał).
- Kontekst historii grupy jest opakowywany jednolicie we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania wzmianek); użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

## Ograniczenia narzędzi dla grup/kanałów (opcjonalnie)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwala/blokuje narzędzia dla całej grupy.
- `toolsBySender`: nadpisania per nadawca w obrębie grupy.
  Używaj jawnych prefiksów kluczy:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`.
  Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe ma pierwszeństwo):

1. dopasowanie `toolsBySender` dla grupy/kanału
2. `tools` dla grupy/kanału
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

- Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo do globalnej/per-agent polityki narzędzi (deny nadal ma pierwszeństwo).
- Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"` aby zezwolić na wszystkie grupy, jednocześnie nadal ustawiając domyślne zachowanie wzmianek.

Częsta pomyłka: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy.
W kanałach, które obsługują parowanie DM, magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo z udokumentowanego fallbacku konfiguracji dla danego kanału.

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

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny numer E.164 bota, jeśli nie jest ustawiony). Wyślij polecenie jako samodzielną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianek)
- Tematy forum Telegram dodatkowo zawierają `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanałów:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy danych Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu zwykłego bramkowania grup.

Systemowy prompt agenta zawiera wprowadzenie grupowe przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, ograniczał puste linie do minimum, stosował zwykłe odstępy czatu i unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Wyświetl czaty: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Systemowe prompty WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne zasady systemowych promptów WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie wildcardów oraz semantykę nadpisywania kont.

## Szczegóły WhatsApp

Zobacz [Group messages](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Group messages](/pl/channels/group-messages)
- [Broadcast groups](/pl/channels/broadcast-groups)
- [Channel routing](/pl/channels/channel-routing)
- [Pairing](/pl/channels/pairing)
