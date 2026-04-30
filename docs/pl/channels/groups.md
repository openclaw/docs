---
read_when:
    - Zmiana zachowania czatu grupowego lub kontroli wzmianek
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-04-30T16:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traktuje czaty grupowe spójnie na wszystkich powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i odpowiadać w niej.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz wymóg wzmianki.
- Zwykłe końcowe odpowiedzi w grupach/kanałach są domyślnie prywatne. Widoczny wynik w pokoju używa narzędzia `message`.

W praktyce: nadawcy z listy dozwolonych mogą wywołać OpenClaw, wspominając o nim.

<Note>
**TL;DR**

- **Dostęp DM** jest kontrolowany przez `*.allowFrom`.
- **Dostęp grupowy** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez wymóg wzmianki (`requireMention`, `/activation`).

</Note>

Szybki przebieg (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Widoczne odpowiedzi

W przypadku pokojów grupowych/kanałowych OpenClaw domyślnie ustawia `messages.groupChat.visibleReplies: "message_tool"`.
Oznacza to, że agent nadal przetwarza turę i może aktualizować pamięć/stan sesji, ale jego zwykła końcowa odpowiedź nie jest automatycznie publikowana z powrotem w pokoju. Aby wypowiedzieć się widocznie, agent używa `message(action=send)`.

W przypadku czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować globalnie takie samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych/kanałowych.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur w trybie obserwowania. W trybie wyłącznie narzędziowym brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania są nadal wysyłane, gdy agent działa w trybie wyłącznie narzędziowym. Domyślny grupowy tryb pisania jest dla tych tur podnoszony z „message” do „instant”, ponieważ może nigdy nie pojawić się zwykły tekst wiadomości asystenta, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

Aby przywrócić starsze automatyczne końcowe odpowiedzi dla pokojów grupowych/kanałowych:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko wtedy,
gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, by widoczny wynik przechodził przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikowe (Discord, Telegram i inne powierzchnie z natywną obsługą poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny dla kanału interfejs poleceń otrzymał oczekiwaną odpowiedź. Dotyczy to tylko zweryfikowanych tur poleceń natywnych; polecenia `/...` wpisywane jako tekst i zwykłe tury czatu nadal stosują skonfigurowane domyślne ustawienie grupy.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grupowym biorą udział dwie różne kontrolki:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, przekazane metadane).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie w takiej postaci, w jakiej został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Obecne zachowanie jest specyficzne dla kanału">
    - Niektóre kanały już stosują filtrowanie na podstawie nadawcy dla dodatkowego kontekstu w określonych ścieżkach (na przykład inicjowanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania w takiej postaci, w jakiej został odebrany.

  </Accordion>
  <Accordion title="Kierunek wzmacniania zabezpieczeń (planowany)">
    - `contextVisibility: "all"` (domyślnie) zachowuje obecne działanie „jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek dla cytatu/odpowiedzi.

    Dopóki ten model wzmacniania zabezpieczeń nie zostanie wdrożony spójnie we wszystkich kanałach, należy spodziewać się różnic między powierzchniami.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe                    | `groupPolicy: "disabled"`                                  |
| Tylko konkretne grupy                         | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)         |
| Tylko Ty możesz wyzwalać w grupach               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forów Telegram dodają `:topic:<threadId>` do identyfikatora grupy, aby każdy temat miał własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub sesji per nadawca, jeśli skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój „osobisty” ruch to **DM-y**, a Twój „publiczny” ruch to **grupy**.

Dlaczego: w trybie jednego agenta DM-y zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie sandboxa, podczas gdy Twoja główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólna przestrzeń robocza + pamięć), ale dwie postawy wykonawcze:

- **DM-y**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych przestrzeni roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM-y na hoście, grupy w sandboxie">
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

  </Tab>
</Tabs>

Powiązane:

- Klucze konfiguracji i wartości domyślne: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)
- Debugowanie, dlaczego narzędzie jest blokowane: [Sandbox a polityka narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowane jako `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokojów/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grup

Kontroluj, jak wiadomości grupowe/pokojowe są obsługiwane dla każdego kanału:

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

| Polityka        | Zachowanie                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; wymóg wzmianki nadal obowiązuje.      |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.                           |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dla poszczególnych kanałów">
    - `groupPolicy` jest oddzielone od wymogu wzmianki (który wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (fallback: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować albo do przychodzącego identyfikatora grupy Signal, albo do telefonu/UUID nadawcy.
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu DM; autoryzacja nadawcy grupowego pozostaje jawnie przypisana do list dozwolonych grup.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokojów lub aliasy; wyszukiwanie nazw dołączonych pokojów działa na zasadzie best-effort, a nierozwiązane nazwy są ignorowane w czasie wykonywania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` na poziomie pokoju.
    - Grupowe DM-y są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazw użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślna wartość to `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie wykonywania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), polityka grup przechodzi w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

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
  <Step title="Wymóg wzmianki">
    Wymóg wzmianki (`requireMention`, `/activation`).
  </Step>
</Steps>

## Wymóg wzmianki (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że nadpisano to dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota może również liczyć się jako niejawna wzmianka w kanałach, które udostępniają metadane cytatu. Obecne wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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
    - Bramkowanie wzmianek jest wymuszane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza bramkowania wzmianek; ustaw dla tej grupy `requireMention` na `false`, gdy wszystkie wiadomości powinny wyzwalać działanie.
    - Kontekst promptu czatu grupowego przenosi rozstrzygniętą instrukcję cichej odpowiedzi w każdej turze; pliki obszaru roboczego nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których ciche odpowiedzi są dozwolone, traktują czyste puste tury modelu lub tury zawierające tylko rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Domyślne ustawienia Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla gildii/kanału).
    - Kontekst historii grupy jest opakowywany jednolicie we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania wzmianek); użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi dla grup/kanałów (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **wewnątrz konkretnej grupy/pokoju/kanału**.

- `tools`: zezwalaj/odmawiaj narzędzi dla całej grupy.
- `toolsBySender`: nadpisania według nadawcy w grupie. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (wygrywa najbardziej szczegółowe):

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
Ograniczenia narzędzi dla grup/kanałów są stosowane oprócz globalnej polityki narzędzi/agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, nadal ustawiając domyślne zachowanie dotyczące wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych konfiguracji, takich jak `groupAllowFrom`, albo udokumentowanego zapasowego mechanizmu konfiguracji dla tego kanału.
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

Właściciele grup mogą przełączać aktywację dla poszczególnych grup:

- `/activation mention`
- `/activation always`

Właściciel jest określany przez `channels.whatsapp.allowFrom` (albo własny numer E.164 bota, gdy nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Ładunki przychodzące z grupy ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianek)
- Tematy forum Telegram zawierają również `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanałów:

- BlueBubbles może opcjonalnie wzbogacać nienazwanych uczestników grup macOS z lokalnej bazy Kontaktów przed wypełnieniem `GroupMembers`. Domyślnie jest to wyłączone i uruchamia się dopiero po przejściu normalnego bramkowania grupy.

Prompt systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste wiersze i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` przy routingu lub dodawaniu do listy dozwolonych.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisań kont.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie dotyczące tylko WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
