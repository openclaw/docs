---
read_when:
    - Zmiana zachowania czatu grupowego lub bramkowania wzmianek
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-05-01T09:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traktuje czaty grupowe spójnie we wszystkich powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „żyje” na Twoich własnych kontach komunikatorów. Nie ma oddzielnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i odpowiadać w niej.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianką.
- Zwykłe końcowe odpowiedzi w grupach/kanałach są domyślnie prywatne. Widoczne wyjście w pokoju używa narzędzia `message`.

Innymi słowy: nadawcy z listy dozwolonych mogą wyzwolić OpenClaw, wspominając o nim.

<Note>
**TL;DR**

- **Dostęp DM** jest kontrolowany przez `*.allowFrom`.
- **Dostęp grupowy** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmianką (`requireMention`, `/activation`).

</Note>

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Widoczne odpowiedzi

Dla pokojów grupowych/kanałów OpenClaw domyślnie ustawia `messages.groupChat.visibleReplies: "message_tool"`.
Oznacza to, że agent nadal przetwarza turę i może aktualizować stan pamięci/sesji, ale jego zwykła końcowa odpowiedź nie jest automatycznie publikowana z powrotem w pokoju. Aby wypowiedzieć się widocznie, agent używa `message(action=send)`.

Jeśli narzędzie wiadomości jest niedostępne w aktywnej polityce narzędzi, OpenClaw przełącza się
na automatyczne widoczne odpowiedzi zamiast po cichu tłumić odpowiedź.
`openclaw doctor` ostrzega o tej niezgodności.

Dla czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować globalnie to samo zachowanie widocznej odpowiedzi wyłącznie przez narzędzie. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych/kanałów.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur w trybie nasłuchiwania. W trybie wyłącznie narzędziowym brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania nadal są wysyłane, gdy agent pracuje w trybie wyłącznie narzędziowym. Domyślny grupowy tryb pisania jest podnoszony z „message” do „instant” dla tych tur, ponieważ może nigdy nie pojawić się zwykły tekst wiadomości asystenta, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

Aby przywrócić starsze automatyczne końcowe odpowiedzi dla pokojów grupowych/kanałów:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko
wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, aby widoczne wyjście przechodziło przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikowe (Discord, Telegram i inne powierzchnie z natywną obsługą poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny dla kanału interfejs poleceń otrzymał oczekiwaną odpowiedź. Dotyczy to tylko zweryfikowanych natywnych tur poleceń; wpisywane tekstowo polecenia `/...` i zwykłe tury czatu nadal przestrzegają skonfigurowanej domyślnej wartości grupowej.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grupowym biorą udział dwie różne kontrolki:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, przekazane metadane).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie tak, jak został otrzymany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Obecne zachowanie jest specyficzne dla kanału">
    - Niektóre kanały już stosują filtrowanie oparte na nadawcy dla dodatkowego kontekstu w konkretnych ścieżkach (na przykład inicjowanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został otrzymany.

  </Accordion>
  <Accordion title="Kierunek utwardzania (planowany)">
    - `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak otrzymano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

    Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, spodziewaj się różnic między powierzchniami.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko konkretne grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, więc każdy temat ma własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub sesji per nadawca, jeśli skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój „osobisty” ruch to **DM**, a Twój „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie sandboxa, podczas gdy Twoja główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wieloagentowy](/pl/concepts/multi-agent).
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
- Debugowanie, dlaczego narzędzie jest zablokowane: [Sandbox kontra polityka narzędzi kontra podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowanego jako `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokojów/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grupowa

Kontroluj, jak wiadomości grupowe/pokojowe są obsługiwane per kanał:

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
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmianką nadal ma zastosowanie. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi per kanał">
    - `groupPolicy` jest oddzielne od bramkowania wzmianką (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (fallback: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować albo do przychodzącego identyfikatora grupy Signal, albo do telefonu/UUID nadawcy.
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) mają zastosowanie tylko do dostępu DM; autoryzacja nadawcy w grupie pozostaje jawna dla list dozwolonych grup.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokojów lub aliasy; wyszukiwanie nazwy dołączonego pokoju jest best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` per pokój.
    - Grupowe DM są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazw użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślnie ustawione jest `groupPolicy: "allowlist"`; jeśli Twoja lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), polityka grupowa przechodzi w tryb zamknięty w razie błędu (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

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
  <Step title="Bramkowanie na podstawie wzmianki">
    Bramkowanie na podstawie wzmianki (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bramkowanie na podstawie wzmianki (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że zostanie to nadpisane dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota może również liczyć się jako niejawna wzmianka w kanałach, które udostępniają metadane cytowania. Obecne wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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
  <Accordion title="Uwagi dotyczące bramkowania na podstawie wzmianki">
    - `mentionPatterns` to bezpieczne wzorce wyrażeń regularnych bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy z zagnieżdżonymi powtórzeniami są ignorowane.
    - Powierzchnie, które udostępniają jawne wzmianki, nadal przechodzą; wzorce są mechanizmem zapasowym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie na podstawie wzmianki jest wymuszane tylko wtedy, gdy wykrywanie wzmianki jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza bramkowania na podstawie wzmianki; ustaw `requireMention` tej grupy na `false`, gdy wszystkie wiadomości mają wyzwalać odpowiedź.
    - Kontekst promptu czatu grupowego przenosi rozwiązaną instrukcję cichej odpowiedzi w każdej turze; pliki przestrzeni roboczej nie powinny powielać mechaniki `NO_REPLY`.
    - Grupy, w których ciche odpowiedzi są dozwolone, traktują czyste puste tury modelu lub tury zawierające tylko rozumowanie jako ciche, równoważne z `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (możliwe do nadpisania dla gildii/kanału).
    - Kontekst historii grup jest opakowywany jednolicie we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania na podstawie wzmianki); użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi dla grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie tego, które narzędzia są dostępne **w konkretnej grupie/pokoju/kanale**.

- `tools`: zezwalaj na narzędzia lub odmawiaj ich dla całej grupy.
- `toolsBySender`: nadpisania dla nadawcy w obrębie grupy. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe wygrywa):

<Steps>
  <Step title="Grupowe toolsBySender">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Grupowe tools">
    `tools` grupy/kanału.
  </Step>
  <Step title="Domyślne toolsBySender">
    Domyślne (`"*"`) dopasowanie `toolsBySender`.
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
Ograniczenia narzędzi dla grupy/kanału są stosowane dodatkowo względem globalnych zasad narzędzi lub zasad narzędzi agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy i jednocześnie nadal ustawić domyślne zachowanie dotyczące wzmianki.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, lub udokumentowanego zapasowego mechanizmu konfiguracji dla danego kanału.
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
  <Tab title="Zezwól tylko na określone grupy (WhatsApp)">
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
  <Tab title="Zezwól na wszystkie grupy, ale wymagaj wzmianki">
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

## Aktywacja (tylko właściciel)

Właściciele grup mogą przełączać aktywację dla grupy:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny numer E.164 bota, gdy nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Ładunki przychodzące grupy ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znany)
- `GroupMembers` (jeśli znani)
- `WasMentioned` (wynik bramkowania na podstawie wzmianki)
- Tematy forum Telegram zawierają również `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Contacts przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i działa dopiero po przejściu normalnego bramkowania grupy.

Prompt systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste wiersze i stosował zwykłe odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup pochodzące z kanału i etykiety uczestników są renderowane jako odgrodzone niezaufane metadane, a nie wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Wyświetl czaty: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symbolu wieloznacznego oraz semantykę nadpisywania konta.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie dotyczące wyłącznie WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianki).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
