---
read_when:
    - Zmiana zachowania czatu grupowego lub wymogu wzmianki
sidebarTitle: Groups
summary: Zachowanie czatu grupowego w różnych interfejsach (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-05-04T02:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traktuje czaty grupowe spójnie na różnych powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikacyjnych. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może ją zobaczyć i tam odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmiankami.
- Normalne odpowiedzi końcowe w grupach/kanałach są domyślnie prywatne. Widoczny wynik w pokoju używa narzędzia `message`.

Innymi słowy: nadawcy z listy dozwolonych mogą wyzwolić OpenClaw, wspominając go.

<Note>
**W skrócie**

- **Dostęp do wiadomości prywatnych** jest kontrolowany przez `*.allowFrom`.
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

Dla pokojów grupowych/kanałowych OpenClaw domyślnie używa `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` zapisuje tę wartość domyślną w konfiguracjach skonfigurowanych kanałów, które jej nie zawierają.
Oznacza to, że agent nadal przetwarza turę i może aktualizować stan pamięci/sesji, ale jego normalna odpowiedź końcowa nie jest automatycznie publikowana z powrotem w pokoju. Aby wypowiedzieć się widocznie, agent używa `message(action=send)`.

Ta wartość domyślna zależy od modelu/środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia. Jeśli logi pokazują tekst asystenta, ale `didSendViaMessagingTool: false`, model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. To nie jest awaria wysyłania Discord/Slack/Telegram. Użyj modelu niezawodnie wywołującego narzędzia dla sesji grupowych/kanałowych albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi końcowe.

Jeśli narzędzie wiadomości jest niedostępne przy aktywnej polityce narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Dla czatów bezpośrednich i każdej innej tury źródłowej użyj `messages.visibleReplies: "message_tool"`, aby zastosować globalnie to samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie. Harnessy mogą też wybrać to jako swoją nieustawioną wartość domyślną; harness Codex robi to dla czatów bezpośrednich w trybie Codex. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych/kanałowych.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur w trybie nasłuchiwania. W trybie wyłącznie narzędziowym brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wskaźniki pisania są nadal wysyłane, gdy agent pracuje w trybie wyłącznie narzędziowym. Domyślny tryb pisania dla grup zostaje podniesiony z „message” do „instant” dla tych tur, ponieważ może nigdy nie pojawić się normalny tekst wiadomości asystenta, zanim agent zdecyduje, czy wywołać narzędzie wiadomości. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

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

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, by widoczne wyjście przechodziło przez narzędzie wiadomości dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikowe (Discord, Telegram i inne powierzchnie z obsługą natywnych poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny interfejs poleceń kanału otrzymał oczekiwaną odpowiedź. Dotyczy to tylko zweryfikowanych tur poleceń natywnych; polecenia `/...` wpisane jako tekst i zwykłe tury czatu nadal stosują skonfigurowaną domyślną wartość grupową.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwo grup są zaangażowane dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Obecne zachowanie jest specyficzne dla kanału">
    - Niektóre kanały już stosują filtrowanie na podstawie nadawcy dla dodatkowego kontekstu w określonych ścieżkach (na przykład inicjowanie wątku Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

  </Accordion>
  <Accordion title="Kierunek utwardzania (planowany)">
    - `contextVisibility: "all"` (domyślnie) zachowuje obecne zachowanie „tak, jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek cytatu/odpowiedzi.

    Dopóki ten model utwardzania nie zostanie spójnie wdrożony we wszystkich kanałach, należy spodziewać się różnic zależnych od powierzchni.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić wszystkim grupom, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"` )    |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Użyć jednego zaufanego zestawu nadawców w wielu kanałach | `groupAllowFrom: ["accessGroup:operators"]`                |

Aby uzyskać listy dozwolonych nadawców wielokrotnego użytku, zobacz [Grupy dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, aby każdy temat miał własną sesję.
- Czaty bezpośrednie używają głównej sesji (lub osobnej dla nadawcy, jeśli skonfigurowano).
- Heartbeat są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: prywatne wiadomości DM + publiczne grupy (jeden agent)

Tak — działa to dobrze, jeśli Twój ruch „prywatny” to **wiadomości DM**, a ruch „publiczny” to **grupy**.

Dlaczego: w trybie jednego agenta wiadomości DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), natomiast grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz piaskownicę z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym backendzie piaskownicy, a Twoja główna sesja DM pozostanie na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego.

Daje to jeden „mózg” agenta (wspólna przestrzeń robocza + pamięć), ale dwie postawy wykonawcze:

- **Wiadomości DM**: pełne narzędzia (host)
- **Grupy**: piaskownica + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych przestrzeni roboczych/person („prywatne” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wieloagentowy](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Wiadomości DM na hoście, grupy w piaskownicy">
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
- Debugowanie, dlaczego narzędzie jest zablokowane: [Piaskownica kontra polityka narzędzi kontra podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowań bind: [Piaskownica](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowanego jako `<channel>:<token>`.
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

| Polityka      | Zachowanie                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; bramkowanie wzmiankami nadal obowiązuje. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dotyczące poszczególnych kanałów">
    - `groupPolicy` jest niezależne od bramkowania wzmiankami (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (wariant awaryjny: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może dopasować przychodzący identyfikator grupy Signal albo telefon/UUID nadawcy.
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) mają zastosowanie tylko do dostępu DM; autoryzacja nadawcy w grupie pozostaje jawna wobec list dozwolonych grup.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokojów lub aliasy; wyszukiwanie nazw dołączonych pokojów działa na zasadzie najlepszej próby, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są też listy dozwolonych `users` dla poszczególnych pokojów.
    - Grupowe DM są kontrolowane osobno (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może dopasowywać identyfikatory użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) lub nazwy użytkowników (`"@alice"` lub `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Domyślnie używane jest `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa przechodzi w tryb bezpiecznego zamknięcia (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (otwarte/wyłączone/lista dozwolonych).
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

Odpowiedź na wiadomość bota liczy się jako niejawna wzmianka, gdy kanał obsługuje metadane odpowiedzi. Cytowanie wiadomości bota może także liczyć się jako niejawna wzmianka w kanałach udostępniających metadane cytatu. Obecne wbudowane przypadki obejmują Telegram, WhatsApp, Slack, Discord, Microsoft Teams i ZaloUser.

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
    - Powierzchnie udostępniające jawne wzmianki nadal przechodzą; wzorce są mechanizmem awaryjnym.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie wzmiankami jest egzekwowane tylko wtedy, gdy możliwe jest wykrywanie wzmianek (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza bramkowania wzmiankami; ustaw `requireMention` tej grupy na `false`, gdy wszystkie wiadomości powinny wyzwalać działanie.
    - Kontekst promptu czatu grupowego przenosi rozwiązaną instrukcję cichej odpowiedzi w każdej turze; pliki obszaru roboczego nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające tylko rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie robią to samo tylko wtedy, gdy bezpośrednie ciche odpowiedzi są jawnie dozwolone; w przeciwnym razie puste odpowiedzi pozostają nieudanymi turami agenta.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla gildii/kanału).
    - Kontekst historii grup jest opakowywany jednolicie we wszystkich kanałach i jest **tylko oczekujący** (wiadomości pominięte z powodu bramkowania wzmiankami); użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **wewnątrz konkretnej grupy/pokoju/kanału**.

- `tools`: zezwalaj na narzędzia lub odmawiaj ich dla całej grupy.
- `toolsBySender`: nadpisania według nadawcy w grupie. Używaj jawnych prefiksów kluczy: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.

Kolejność rozstrzygania (wygrywa najbardziej szczegółowe dopasowanie):

<Steps>
  <Step title="Grupowe toolsBySender">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Narzędzia grupy">
    `tools` grupy/kanału.
  </Step>
  <Step title="Domyślne toolsBySender">
    Dopasowanie domyślnego (`"*"`) `toolsBySender`.
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
Ograniczenia narzędzi grupy/kanału są stosowane oprócz globalnej zasady narzędzi/zasady narzędzi agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżenia dla pokojów/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie nadal ustawiając domyślne zachowanie dotyczące wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko DM. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo udokumentowanego awaryjnego ustawienia konfiguracji dla tego kanału.
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

Właściciel jest określany przez `channels.whatsapp.allowFrom` (lub własny E.164 bota, gdy nie ustawiono). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmiankami)
- Tematy forum Telegram zawierają także `MessageThreadId` i `IsForum`.

Uwagi specyficzne dla kanału:

- BlueBubbles może opcjonalnie wzbogacić nienazwanych uczestników grup macOS z lokalnej bazy Kontaktów przed wypełnieniem `GroupMembers`. Jest to domyślnie wyłączone i uruchamia się dopiero po przejściu normalnego bramkowania grupy.

Prompt systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, unikał tabel Markdown, minimalizował puste wiersze i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Nazwy grup pochodzące z kanałów i etykiety uczestników są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisań konta.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
