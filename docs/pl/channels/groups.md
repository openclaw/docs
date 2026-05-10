---
read_when:
    - Zmiana zachowania czatu grupowego lub bramkowania wzmianek
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-05-10T19:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw obsługuje czaty grupowe spójnie na różnych powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i odpowiadać w niej.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianką.
- Zwykłe odpowiedzi końcowe w grupach/kanałach są domyślnie prywatne. Widoczne wyjście w pokoju używa narzędzia `message`.

Innymi słowy: nadawcy z listy dozwolonych mogą wywołać OpenClaw, wspominając o nim.

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

W przypadku pokoi grupowych/kanałowych OpenClaw domyślnie ustawia `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` zapisuje tę wartość domyślną w konfiguracjach skonfigurowanych kanałów, które ją pomijają.
Oznacza to, że agent nadal przetwarza turę i może aktualizować stan pamięci/sesji, ale jego zwykła odpowiedź końcowa nie jest automatycznie publikowana z powrotem w pokoju. Aby mówić w sposób widoczny, agent używa `message(action=send)`.

Ta wartość domyślna zależy od modelu/środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia. Jeśli logi pokazują tekst asystenta, ale `didSendViaMessagingTool: false`, model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. To nie jest błąd wysyłania w Discord/Slack/Telegram. Użyj modelu niezawodnie wywołującego narzędzia dla sesji grupowych/kanałowych albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi końcowe.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu tłumić odpowiedź.
`openclaw doctor` ostrzega o tej niezgodności.

W przypadku czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować globalnie takie samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie. Harnessy mogą też wybrać to jako swoją nieustawioną wartość domyślną; harness Codex robi to dla czatów bezpośrednich w trybie Codex. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokoi grupowych/kanałowych.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur w trybie nasłuchiwania. W trybie wyłącznie narzędziowym brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania są nadal wysyłane, gdy agent pracuje w trybie wyłącznie narzędziowym. Domyślny tryb pisania w grupach jest podnoszony z "message" do "instant" dla tych tur, ponieważ może nigdy nie pojawić się zwykły tekst wiadomości asystenta, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

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

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Restartuj tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, by widoczne wyjście przechodziło przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikowe (Discord, Telegram i inne powierzchnie z obsługą natywnych poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny interfejs poleceń kanału otrzymał oczekiwaną odpowiedź. Dotyczy to tylko zweryfikowanych tur natywnych poleceń; polecenia `/...` wpisane jako tekst i zwykłe tury czatu nadal przestrzegają skonfigurowanej wartości domyślnej grupy.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grupowym biorą udział dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki kontekst uzupełniający jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, przekazane metadane).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać akcje, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Bieżące zachowanie zależy od kanału">
    - Niektóre kanały już stosują filtrowanie na podstawie nadawcy dla kontekstu uzupełniającego w określonych ścieżkach (na przykład zasilanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

  </Accordion>
  <Accordion title="Kierunek utwardzania (planowany)">
    - `contextVisibility: "all"` (domyślnie) zachowuje bieżące zachowanie „jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek cytatu/odpowiedzi.

    Dopóki ten model utwardzania nie zostanie wdrożony spójnie we wszystkich kanałach, spodziewaj się różnic zależnych od powierzchni.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)         |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Ponownie użyć jednego zaufanego zestawu nadawców w kanałach | `groupAllowFrom: ["accessGroup:operators"]`                |

Listy dozwolonych nadawców wielokrotnego użytku opisano w [Grupach dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub sesji per nadawca, jeśli skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + grupy publiczne (pojedynczy agent)

Tak — to działa dobrze, jeśli Twój „osobisty” ruch to **DM**, a Twój „publiczny” ruch to **grupy**.

Dlaczego: w trybie pojedynczego agenta DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie sandboxa, podczas gdy Twoja główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólna przestrzeń robocza + pamięć), ale dwa tryby wykonywania:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych przestrzeni roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Trasowanie wielu agentów](/pl/concepts/multi-agent).
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
    Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w sandboxie tylko ścieżki z listy dozwolonych:

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
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox a polityka narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlane

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowane jako `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grup

Kontroluj, jak wiadomości grupowe/pokojowe są obsługiwane w każdym kanale:

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
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmianką nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dla poszczególnych kanałów">
    - `groupPolicy` jest oddzielne od bramkowania według wzmianek (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (wariant awaryjny: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować do identyfikatora przychodzącej grupy Signal albo do telefonu/UUID nadawcy.
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu do DM; autoryzacja nadawcy grupowego pozostaje jawna w allowlistach grup.
    - Discord: allowlista używa `channels.discord.guilds.<id>.channels`.
    - Slack: allowlista używa `channels.slack.channels`.
    - Matrix: allowlista używa `channels.matrix.groups`. Preferuj identyfikatory lub aliasy pokojów; wyszukiwanie nazw dołączonych pokojów działa w trybie best-effort, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są też allowlisty `users` dla poszczególnych pokojów.
    - Grupowe DM są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlista Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) albo nazwy użytkowników (`"@alice"` lub `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślnie jest `groupPolicy: "allowlist"`; jeśli allowlista grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa przechodzi w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlisty grup">
    Allowlisty grup (`*.groups`, `*.groupAllowFrom`, allowlista właściwa dla kanału).
  </Step>
  <Step title="Bramkowanie według wzmianek">
    Bramkowanie według wzmianek (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bramkowanie według wzmianek (domyślne)

Wiadomości grupowe wymagają wzmianki, chyba że nadpisano to dla danej grupy. Wartości domyślne znajdują się w każdym podsystemie pod `*.groups."*"`.

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
  <Accordion title="Uwagi dotyczące bramkowania według wzmianek">
    - `mentionPatterns` to bezpieczne wzorce wyrażeń regularnych bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy z zagnieżdżonymi powtórzeniami są ignorowane.
    - Powierzchnie, które zapewniają jawne wzmianki, nadal przechodzą; wzorce są wariantem awaryjnym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wiele agentów współdzieli grupę).
    - Bramkowanie według wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do allowlisty nie wyłącza bramkowania według wzmianek; ustaw `requireMention` tej grupy na `false`, gdy wszystkie wiadomości mają wyzwalać odpowiedź.
    - Kontekst promptu czatu grupowego przenosi rozstrzygniętą instrukcję cichej odpowiedzi w każdej turze; pliki workspace nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające tylko rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla gildii/kanału).
    - Kontekst historii grupy jest opakowany jednolicie we wszystkich kanałach. Grupy bramkowane wzmiankami zachowują oczekujące pominięte wiadomości; grupy zawsze aktywne mogą też zachowywać ostatnio przetworzone wiadomości pokoju, gdy kanał to obsługuje. Użyj `messages.groupChat.historyLimit` dla globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **w konkretnej grupie/pokoju/kanale**.

- `tools`: zezwalaj na narzędzia lub odmawiaj narzędzi dla całej grupy.
- `toolsBySender`: nadpisania dla poszczególnych nadawców w grupie. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (najbardziej szczegółowe wygrywa):

<Steps>
  <Step title="toolsBySender grupy">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Narzędzia grupy">
    `tools` grupy/kanału.
  </Step>
  <Step title="Domyślne toolsBySender">
    Domyślne (`"*"`) dopasowanie `toolsBySender`.
  </Step>
  <Step title="Domyślne narzędzia">
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
Ograniczenia narzędzi grupy/kanału są stosowane dodatkowo względem globalnej zasady narzędzi lub zasady narzędzi agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlisty grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako allowlista grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie nadal ustawiając domyślne zachowanie wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z allowlist konfiguracji, takich jak `groupAllowFrom`, lub udokumentowanego wariantu awaryjnego konfiguracji dla tego kanału.
</Warning>

Typowe zamiary (kopiuj/wklej):

<Tabs>
  <Tab title="Wyłącz wszystkie odpowiedzi grupowe">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Zezwól tylko na konkretne grupy (WhatsApp)">
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

Właściciele grup mogą przełączać aktywację dla poszczególnych grup:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny numer E.164 bota, gdy nie jest ustawione). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znany)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania według wzmianek)
- Tematy forum Telegram zawierają też `MessageThreadId` i `IsForum`.

Prompt systemowy agenta zawiera wprowadzenie do grupy w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste wiersze i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako odgrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Specyfika iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do allowlisty.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisań konta.

## Specyfika WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie właściwe tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
