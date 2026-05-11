---
read_when:
    - Zmiana zachowania czatu grupowego lub ograniczania według wzmianek
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-05-11T20:20:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw obsługuje czaty grupowe spójnie we wszystkich interfejsach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmianką.
- Normalne odpowiedzi końcowe w grupach/kanałach są domyślnie prywatne. Widoczne wyjście w pokoju używa narzędzia `message`.

Tłumacząc: nadawcy z listy dozwolonych mogą uruchamiać OpenClaw, wspominając o nim.

<Note>
**W skrócie**

- **Dostęp do wiadomości prywatnych** jest kontrolowany przez `*.allowFrom`.
- **Dostęp do grup** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
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
`openclaw doctor --fix` zapisuje tę wartość domyślną w konfiguracjach skonfigurowanych kanałów, które ją pomijają.
Oznacza to, że agent nadal przetwarza turę i może aktualizować pamięć/stan sesji, ale jego normalna odpowiedź końcowa nie jest automatycznie publikowana z powrotem w pokoju. Aby mówić widocznie, agent używa `message(action=send)`.

Ta wartość domyślna zależy od modelu/środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia. Jeśli logi pokazują tekst asystenta, ale `didSendViaMessagingTool: false`, model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. To nie jest błąd wysyłania Discord/Slack/Telegram. Użyj modelu niezawodnego w wywoływaniu narzędzi dla sesji grupowych/kanałowych albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi końcowe.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw przełącza się z powrotem na automatyczne widoczne odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Dla czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować globalnie to samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie. Harnessy mogą też wybrać to jako swoją nieustawioną wartość domyślną; harness Codex robi tak dla czatów bezpośrednich w trybie Codex. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych/kanałowych.

Zastępuje to stary wzorzec zmuszania modelu do odpowiadania `NO_REPLY` dla większości tur w trybie nasłuchiwania. W trybie wyłącznie narzędziowym brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania są nadal wysyłane, gdy agent pracuje w trybie wyłącznie narzędziowym. Domyślny tryb pisania w grupie jest dla tych tur podnoszony z "message" do "instant", ponieważ normalny tekst wiadomości asystenta może nigdy się nie pojawić, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

Aby przywrócić starsze automatyczne odpowiedzi końcowe dla pokojów grupowych/kanałowych:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko wtedy, gdy obserwowanie plików albo przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, by widoczne wyjście przechodziło przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikiem (Discord, Telegram i inne interfejsy z obsługą natywnych poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny dla kanału interfejs poleceń otrzymał oczekiwaną odpowiedź. Dotyczy to tylko zweryfikowanych tur natywnych poleceń; polecenia `/...` wpisane jako tekst i zwykłe tury czatu nadal podążają za skonfigurowaną domyślną wartością dla grupy.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup uczestniczą dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może uruchomić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst w większości tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Niektóre kanały już stosują filtrowanie na podstawie nadawcy dla dodatkowego kontekstu w określonych ścieżkach (na przykład inicjowanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek cytatu/odpowiedzi.

    Dopóki ten model wzmocnienia nie zostanie spójnie wdrożony we wszystkich kanałach, spodziewaj się różnic zależnie od interfejsu.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)    |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Ponownie użyć jednego zestawu zaufanych nadawców między kanałami | `groupAllowFrom: ["accessGroup:operators"]`                |

Listy dozwolonych nadawców wielokrotnego użytku opisano w [grupach dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forów Telegram dodają `:topic:<threadId>` do identyfikatora grupy, aby każdy temat miał własną sesję.
- Czaty bezpośrednie używają sesji głównej (albo sesji dla każdego nadawcy, jeśli tak skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste wiadomości prywatne + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój ruch „osobisty” to **wiadomości prywatne**, a ruch „publiczny” to **grupy**.

Dlaczego: w trybie jednego agenta wiadomości prywatne zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), natomiast grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz piaskownicę z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie piaskownicy, a Twoja główna sesja wiadomości prywatnych pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólny obszar roboczy + pamięć), ale dwie postawy wykonywania:

- **Wiadomości prywatne**: pełne narzędzia (host)
- **Grupy**: piaskownica + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę osobnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Chcesz, aby „grupy mogły widzieć tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w piaskownicy tylko ścieżki z listy dozwolonych:

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
- Debugowanie, dlaczego narzędzie jest zablokowane: [Piaskownica kontra polityka narzędzi kontra uprawnienia podwyższone](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań wiązanych: [Piaskownica](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowane jako `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokojów/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grup

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

| Polityka      | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmianką nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dotyczące poszczególnych kanałów">
    - `groupPolicy` jest oddzielne od bramkowania wzmiankami (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (zastępczo: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować do przychodzącego identyfikatora grupy Signal albo telefonu/UUID nadawcy.
    - Zatwierdzenia parowania wiadomości prywatnych (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu do wiadomości prywatnych; autoryzacja nadawcy grupowego pozostaje jawna w grupowych listach dozwolonych.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokojów lub aliasy; wyszukiwanie nazw pokojów, do których dołączono, jest realizowane w miarę możliwości, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` dla poszczególnych pokojów.
    - Grupowe wiadomości prywatne są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazw użytkowników (`"@alice"` albo `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślnie jest `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), polityka grupowa przechodzi w tryb domyślnie zamknięty (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

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

Wiadomości grupowe wymagają wzmianki, chyba że nadpisano to dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu w `*.groups."*"`.

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota może także liczyć się jako niejawna wzmianka w kanałach, które udostępniają metadane cytatu. Obecne wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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
  <Accordion title="Uwagi dotyczące bramkowania wzmiankami">
    - `mentionPatterns` to bezpieczne wzorce regex bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
    - Powierzchnie, które dostarczają jawne wzmianki, nadal przechodzą; wzorce są mechanizmem zastępczym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie wzmiankami jest wymuszane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza bramkowania wzmiankami; ustaw `requireMention` tej grupy na `false`, gdy wszystkie wiadomości powinny wyzwalać działanie.
    - Kontekst promptu czatu grupowego przenosi rozwiązaną instrukcję cichej odpowiedzi w każdej turze; pliki obszaru roboczego nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające wyłącznie rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (możliwe do nadpisania dla gildii/kanału).
    - Kontekst historii grup jest opakowywany jednolicie we wszystkich kanałach. Grupy bramkowane wzmiankami zachowują oczekujące pominięte wiadomości; grupy zawsze aktywne mogą także zachowywać ostatnio przetworzone wiadomości pokoju, gdy kanał to obsługuje. Użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwalaj na narzędzia lub ich odmawiaj dla całej grupy.
- `toolsBySender`: nadpisania dla poszczególnych nadawców w grupie. Użyj jawnych prefiksów kluczy: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbol wieloznaczny `"*"`. Identyfikatory kanałów używają kanonicznych identyfikatorów kanałów OpenClaw; aliasy takie jak `teams` normalizują się do `msteams`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

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
Ograniczenia narzędzi grupy/kanału są stosowane dodatkowo względem globalnej polityki narzędzi lub polityki narzędzi agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowane jest `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, nadal ustawiając domyślne zachowanie wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie wiadomości prywatnych magazyn parowania odblokowuje tylko wiadomości prywatne. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych konfiguracji, takich jak `groupAllowFrom`, albo udokumentowanego mechanizmu zastępczego konfiguracji dla tego kanału.
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

Właściciel jest określany przez `channels.whatsapp.allowFrom` (albo własny E.164 bota, gdy nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmiankami)
- Tematy forów Telegram obejmują także `MessageThreadId` i `IsForum`.

Prompt systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste linie i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako odgrodzone niezaufane metadane, a nie wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisań kont.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie dotyczące wyłącznie WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
