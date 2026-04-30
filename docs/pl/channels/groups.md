---
read_when:
    - Zmiana zachowania czatu grupowego lub bramkowania wzmianek
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-30T09:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traktuje czaty grupowe spójnie na różnych powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „żyje” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i odpowiadać w niej.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że wyraźnie wyłączysz bramkowanie wzmiankami.
- Zwykłe odpowiedzi końcowe w grupach/kanałach są domyślnie prywatne. Widoczne wyjście w pokoju używa narzędzia `message`.

Innymi słowy: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wspominając o nim.

<Note>
**TL;DR**

- **Dostęp do DM** jest kontrolowany przez `*.allowFrom`.
- **Dostęp grupowy** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmiankami (`requireMention`, `/activation`).

</Note>

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Widoczne odpowiedzi

Dla pokoi grupowych/kanałowych OpenClaw domyślnie ustawia `messages.groupChat.visibleReplies: "message_tool"`.
Oznacza to, że agent nadal przetwarza turę i może aktualizować stan pamięci/sesji, ale jego zwykła odpowiedź końcowa nie jest automatycznie publikowana z powrotem w pokoju. Aby wypowiedzieć się widocznie, agent używa `message(action=send)`.

Dla czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować takie samo zachowanie widocznej odpowiedzi wyłącznie przez narzędzie globalnie. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokoi grupowych/kanałowych.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur w trybie obserwowania. W trybie wyłącznie narzędziowym brak widocznej akcji oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania nadal są wysyłane, gdy agent pracuje w trybie wyłącznie narzędziowym. Domyślny tryb pisania w grupie jest dla tych tur podnoszony z „message” do „instant”, ponieważ może nigdy nie pojawić się zwykły tekst wiadomości asystenta, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

Aby przywrócić starsze automatyczne odpowiedzi końcowe dla pokoi grupowych/kanałowych:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Aby wymagać, by widoczne wyjście przechodziło przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia slash (Discord, Telegram i inne powierzchnie z natywną obsługą poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny interfejs poleceń kanału otrzymał oczekiwaną odpowiedź. Dotyczy to wyłącznie zweryfikowanych natywnych tur poleceń; wpisywane tekstowo polecenia `/...` i zwykłe tury czatu nadal stosują skonfigurowaną domyślną wartość grupową.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwo grupowe zaangażowane są dwie różne kontrolki:

- **Autoryzacja wyzwalania**: kto może uruchomić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i utrzymuje kontekst w większości tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać akcje, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Bieżące zachowanie jest specyficzne dla kanału">
    - Niektóre kanały stosują już filtrowanie według nadawcy dla dodatkowego kontekstu w określonych ścieżkach (na przykład zasilanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

  </Accordion>
  <Accordion title="Kierunek wzmacniania bezpieczeństwa (planowany)">
    - `contextVisibility: "all"` (domyślne) zachowuje bieżące zachowanie „tak jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

    Dopóki ten model wzmacniania bezpieczeństwa nie zostanie spójnie wdrożony we wszystkich kanałach, spodziewaj się różnic zależnych od powierzchni.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko konkretne grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"` )    |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forów Telegram dodają `:topic:<threadId>` do identyfikatora grupy, aby każdy temat miał własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub sesji na nadawcę, jeśli skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój „osobisty” ruch to **DM**, a Twój „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie sandbox, podczas gdy Twoja główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli żadnego nie wybierzesz.

Daje Ci to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwa tryby wykonania:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nie mogą się nigdy mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).
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
    Chcesz, aby „grupy widziały tylko folder X” zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w sandboxie tylko ścieżki z listy dozwolonych:

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
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox kontra zasady narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowane jako `<channel>:<token>`.
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

| Zasada        | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmiankami nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dla poszczególnych kanałów">
    - `groupPolicy` jest oddzielne od bramkowania wzmiankami (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (zapasowo: jawne `allowFrom`).
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu do DM; autoryzacja nadawcy grupowego pozostaje jawnie przypisana do grupowych list dozwolonych.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa w trybie best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` dla poszczególnych pokoi.
    - Grupowe DM są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazw użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślnie jest `groupPolicy: "allowlist"`; jeśli Twoja lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grup przechodzi w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listy dozwolonych grup">
    Listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału).
  </Step>
  <Step title="Bramkowanie wzmiankami">
    Bramkowanie wzmiankami (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bramkowanie wzmiankami (domyślne)

Wiadomości grupowe wymagają wzmianki, chyba że nadpisano to dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu pod `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota może też liczyć się jako niejawna wzmianka w kanałach, które udostępniają metadane cytatu. Obecne wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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
  <Accordion title="Uwagi dotyczące bramkowania wzmianek">
    - `mentionPatterns` to bezpieczne wzorce wyrażeń regularnych niewrażliwe na wielkość liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
    - Powierzchnie udostępniające jawne wzmianki nadal przechodzą; wzorce są mechanizmem zapasowym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie wzmianek jest wymuszane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki albo `mentionPatterns`).
    - Kontekst promptu czatu grupowego przenosi rozwiązaną instrukcję cichej odpowiedzi w każdej turze; pliki workspace nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające tylko reasoning jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Domyślne wartości Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla gildii/kanału).
    - Kontekst historii grupy jest jednolicie opakowywany we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania wzmianek); użyj `messages.groupChat.historyLimit` dla globalnej wartości domyślnej i `channels.<channel>.historyLimit` (albo `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **wewnątrz konkretnej grupy/pokoju/kanału**.

- `tools`: zezwalaj na narzędzia lub ich odmawiaj dla całej grupy.
- `toolsBySender`: nadpisania dla nadawcy w obrębie grupy. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz wildcard `"*"`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (wygrywa najbardziej szczegółowe dopasowanie):

<Steps>
  <Step title="Group toolsBySender">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Group tools">
    `tools` grupy/kanału.
  </Step>
  <Step title="Default toolsBySender">
    Domyślne (`"*"`) dopasowanie `toolsBySender`.
  </Step>
  <Step title="Default tools">
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
Ograniczenia narzędzi grupy/kanału są stosowane oprócz globalnej polityki narzędzi lub polityki narzędzi agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` albo `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie ustawiając domyślne zachowanie dotyczące wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM to nie to samo co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo udokumentowanego mechanizmu zapasowego konfiguracji dla tego kanału.
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
  <Tab title="Zezwalaj tylko na konkretne grupy (WhatsApp)">
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
  <Tab title="Wyzwalacze tylko dla właściciela (WhatsApp)">
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

## Aktywacja (tylko właściciel)

Właściciele grup mogą przełączać aktywację dla grupy:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (albo własny E.164 bota, gdy nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Ładunki przychodzące grup ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianek)
- Tematy forum Telegram zawierają także `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu zwykłego bramkowania grupowego.

Prompt systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste wiersze i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Wyświetl czaty: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne zasady promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie wildcard oraz semantykę nadpisywania kont.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy broadcast](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
