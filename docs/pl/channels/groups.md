---
read_when:
    - Zmiana zachowania czatu grupowego lub bramkowania wzmianek
sidebarTitle: Groups
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-26T11:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw traktuje czaty grupowe spójnie na różnych platformach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma oddzielnego użytkownika-bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianek.

Inaczej mówiąc: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wzmiankując go.

<Note>
**W skrócie**

- **Dostęp do DM** jest kontrolowany przez `*.allowFrom`.
- **Dostęp do grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmianek (`requireMention`, `/activation`).
</Note>

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> odrzuć
groupPolicy? allowlist -> grupa dozwolona? nie -> odrzuć
requireMention? yes -> wzmianka? nie -> zapisz tylko do kontekstu
w przeciwnym razie -> odpowiedz
```

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup biorą udział dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwolenia**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki kontekst uzupełniający jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetyzuje normalne zachowanie czatu i zachowuje kontekst w większości tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują o tym, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Bieżące zachowanie jest specyficzne dla kanału">
    - Niektóre kanały już stosują filtrowanie oparte na nadawcy dla kontekstu uzupełniającego w określonych ścieżkach (na przykład inicjalizacja wątków Slack, wyszukiwanie odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.
  </Accordion>
  <Accordion title="Kierunek utwardzania (planowany)">
    - `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie zgodne z odebranymi danymi.
    - `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` oznacza `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

    Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, należy oczekiwać różnic zależnie od platformy.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                  |
| -------------------------------------------- | ----------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na wzmianki @ | `groups: { "*": { requireMention: true } }`                 |
| Wyłączyć wszystkie odpowiedzi w grupach      | `groupPolicy: "disabled"`                                   |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)      |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub osobnej dla nadawcy, jeśli została skonfigurowana).
- Heartbeat jest pomijany dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój ruch „osobisty” to **DM**, a ruch „publiczny” to **grupy**.

Dlaczego: w trybie jednego agenta DM zwykle trafiają do klucza **głównej** sesji (`agent:main:main`), podczas gdy grupy zawsze używają kluczy sesji **niegłównych** (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym backendzie sandbox, a Twoja główna sesja DM pozostanie na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Multi-Agent Routing](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM na hoście, grupy w sandboxie">
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
  </Tab>
  <Tab title="Grupy widzą tylko folder z listy dozwolonych">
    Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i montuj w sandboxie tylko ścieżki z listy dozwolonych:

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

  </Tab>
</Tabs>

Powiązane:

- Klucze konfiguracji i wartości domyślne: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły bind mountów: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety interfejsu używają `displayName`, gdy jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowuje `#@+._-`).

## Polityka grup

Kontroluje sposób obsługi wiadomości grupowych/pokojów dla każdego kanału:

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

| Polityka      | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmianek nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dla poszczególnych kanałów">
    - `groupPolicy` jest oddzielne od bramkowania wzmianek (które wymaga wzmianek @).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: używaj `groupAllowFrom` (zapasowo: jawne `allowFrom`).
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu do DM; autoryzacja nadawców grupowych pozostaje jawnie powiązana z listami dozwolonych dla grup.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa best-effort, a nierozwiązane nazwy są ignorowane w czasie wykonywania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są też listy dozwolonych `users` dla poszczególnych pokoi.
    - Grupowe DM są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazwy użytkowników (`"@alice"` albo `"alice"`); prefiksy są niewrażliwe na wielkość liter.
    - Wartością domyślną jest `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo wykonania: gdy blok dostawcy całkowicie nie istnieje (`channels.<provider>` nieobecne), polityka grup przechodzi w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny dla wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listy dozwolonych grup">
    Listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału).
  </Step>
  <Step title="Bramkowanie wzmianek">
    Bramkowanie wzmianek (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bramkowanie wzmianek (domyślne)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota także może liczyć się jako niejawna wzmianka na kanałach, które udostępniają metadane cytatu. Obecnie wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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

<AccordionGroup>
  <Accordion title="Uwagi o bramkowaniu wzmianek">
    - `mentionPatterns` to bezpieczne wzorce regex niewrażliwe na wielkość liter; nieprawidłowe wzorce i niebezpieczne zagnieżdżone formy powtórzeń są ignorowane.
    - Platformy, które udostępniają jawne wzmianki, nadal je przekazują; wzorce są rozwiązaniem zapasowym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie wzmianek jest wymuszane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (natywne wzmianki lub skonfigurowane `mentionPatterns`).
    - Grupy, w których dozwolone są ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające wyłącznie rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie nadal traktują puste odpowiedzi jako nieudaną turę agenta.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można nadpisywać dla poszczególnych serwerów/kanałów).
    - Kontekst historii grupy jest opakowywany jednolicie we wszystkich kanałach i obejmuje **tylko oczekujące** wiadomości (pominięte z powodu bramkowania wzmianek); użyj `messages.groupChat.historyLimit` dla globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.
  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi dla grup/kanałów (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwalanie/blokowanie narzędzi dla całej grupy.
- `toolsBySender`: nadpisania dla poszczególnych nadawców w obrębie grupy. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`. Starsze klucze bez prefiksów są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe wygrywa):

<Steps>
  <Step title="Grupowe toolsBySender">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Grupowe tools">
    `tools` grupy/kanału.
  </Step>
  <Step title="Domyślne toolsBySender">
    Dopasowanie domyślnego (`"*"`) `toolsBySender`.
  </Step>
  <Step title="Domyślne tools">
    Domyślne (`"*"`) `tools`.
  </Step>
</Steps>

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

<Note>
Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo do globalnej/powiązanej z agentem polityki narzędzi (deny nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowane są `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie ustawiając domyślne zachowanie wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy. W kanałach, które obsługują parowanie DM, magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom` albo udokumentowany fallback konfiguracji dla danego kanału.
</Warning>

Typowe intencje (kopiuj/wklej):

<Tabs>
  <Tab title="Wyłącz wszystkie odpowiedzi grupowe">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Zezwalaj tylko na określone grupy (WhatsApp)">
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
  </Tab>
  <Tab title="Zezwalaj na wszystkie grupy, ale wymagaj wzmianki">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Wyzwalanie tylko przez właściciela (WhatsApp)">
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
  </Tab>
</Tabs>

## Activation (tylko właściciel)

Właściciele grup mogą przełączać aktywację dla poszczególnych grup:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny E.164 bota, jeśli nie jest ustawione). Wyślij polecenie jako osobną wiadomość. Inne platformy obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące payloady grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianek)
- Tematy forum Telegram dodatkowo zawierają `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacać uczestników nienazwanych grup macOS z lokalnej bazy danych Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i działa dopiero po przejściu zwykłego bramkowania grup.

Prompt systemowy agenta zawiera wprowadzenie grupowe przy pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste linie i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Przy routingu lub dodawaniu do listy dozwolonych preferuj `chat_id:<id>`.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne zasady promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie wildcard oraz semantykę nadpisywania kont.

## Szczegóły WhatsApp

Zobacz [Group messages](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Broadcast groups](/pl/channels/broadcast-groups)
- [Channel routing](/pl/channels/channel-routing)
- [Group messages](/pl/channels/group-messages)
- [Pairing](/pl/channels/pairing)
