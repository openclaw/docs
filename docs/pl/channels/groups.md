---
read_when:
    - Zmiana zachowania czatu grupowego lub wymogu wzmianki
    - Ograniczanie mentionPatterns do określonych rozmów grupowych
sidebarTitle: Groups
summary: Zachowanie czatu grupowego na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-07-16T18:11:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw stosuje te same reguły grup we wszystkich kanałach obsługujących grupy, w tym Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp i Zalo.

W przypadku stale aktywnych pokojów, które powinny dostarczać dyskretny kontekst, chyba że agent jawnie wyśle widoczną wiadomość, zobacz [Zdarzenia pokoju w tle](/pl/channels/ambient-room-events).

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na własnych kontach komunikatorów użytkownika. Nie istnieje oddzielny użytkownik bota WhatsApp: jeśli **użytkownik** należy do grupy, OpenClaw może ją zobaczyć i w niej odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`); nadawcy w grupach są blokowani do czasu dodania ich do listy dozwolonych.
- Odpowiedzi wymagają wzmianki, chyba że dla danej grupy wyłączono ograniczenie oparte na wzmiankach.
- Końcowy tekst odpowiedzi jest automatycznie publikowany w pokoju (`visibleReplies: "automatic"`).

Innymi słowy: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wspominając o nim.

<Note>
**W skrócie**

- **Dostęp do wiadomości prywatnych** jest kontrolowany przez `*.allowFrom`.
- **Dostęp do grup** jest kontrolowany przez `*.groupPolicy` i listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez ograniczenie oparte na wzmiankach (`requireMention`, `/activation`).

</Note>

Skrócony przebieg (co dzieje się z wiadomością grupową):

```text
groupPolicy? disabled -> odrzuć
groupPolicy? allowlist -> grupa dozwolona? nie -> odrzuć
requireMention? tak -> wspomniano? nie -> zapisz tylko jako kontekst
wzmianka/odpowiedź/polecenie/wiadomość prywatna -> żądanie użytkownika
rozmowa w stale aktywnej grupie -> żądanie użytkownika lub zdarzenie pokoju, jeśli skonfigurowano
```

## Widoczne odpowiedzi

W przypadku zwykłych żądań w grupach lub kanałach OpenClaw domyślnie używa `messages.groupChat.visibleReplies: "automatic"`: końcowy tekst asystenta jest publikowany w pokoju jako widoczna odpowiedź.

Użyj `messages.groupChat.visibleReplies: "message_tool"`, gdy w pokoju współdzielonym agent powinien decydować, kiedy zabrać głos, wywołując `message(action=send)`. Działa to najlepiej z modelami niezawodnie korzystającymi z narzędzi (na przykład GPT-5.6 Sol). Jeśli model nie użyje narzędzia i zwróci merytoryczny tekst końcowy, OpenClaw zachowa ten tekst jako prywatny, zamiast publikować go w pokoju.

Użyj `"automatic"` w przypadku modeli lub środowisk uruchomieniowych, które nie przestrzegają niezawodnie dostarczania wyłącznie przez narzędzia: zwykłe końcowe odpowiedzi tekstowe są publikowane bezpośrednio w pokoju, a agent nadal może wywołać `message(action=send)` w celu wysłania plików, obrazów lub innych załączników, których nie można dołączyć do tekstu końcowego.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw powraca do automatycznych widocznych odpowiedzi, zamiast po cichu pomijać odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

W przypadku czatów bezpośrednich i każdego innego zdarzenia źródłowego `messages.visibleReplies: "message_tool"` stosuje globalnie to samo zachowanie oparte wyłącznie na narzędziu; `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych i kanałów. Bezpośrednie interakcje w wewnętrznym WebChat domyślnie automatycznie dostarczają końcową odpowiedź, dzięki czemu Pi i Codex korzystają z tego samego kontraktu widocznej odpowiedzi.

Tryb oparty wyłącznie na narzędziu zastępuje stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` w większości interakcji w trybie biernej obserwacji. W trybie opartym wyłącznie na narzędziu prompt nie definiuje kontraktu `NO_REPLY`; brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wyjątkiem są powiązania konwersacji zarządzane przez Plugin. Gdy Plugin powiąże wątek i przejmie przychodzącą interakcję, zwrócona przez Plugin odpowiedź staje się widoczną odpowiedzią powiązania; nie wymaga `message(action=send)`. Jest to wynik środowiska uruchomieniowego Plugin, a nie prywatny tekst końcowy modelu.

Wskaźniki pisania są nadal wysyłane dla bezpośrednich żądań grupowych. Zdarzenia stale aktywnych pokojów w tle, jeśli są włączone, pozostają ściśle dyskretne, chyba że agent wywoła narzędzie wiadomości.

Sesje domyślnie ukrywają szczegółowe podsumowania narzędzi i postępu. Użyj `/verbose on` (lub `/verbose full`), aby wyświetlać je w bieżącej sesji podczas debugowania, oraz `/verbose off`, aby powrócić do zachowania obejmującego wyłącznie odpowiedzi końcowe. Stan szczegółowości jest przypisany do sesji i działa tak samo w czatach bezpośrednich, grupach, kanałach i tematach forum.

Aby przesyłać niewspominające agenta rozmowy w stale aktywnej grupie jako dyskretny kontekst pokoju zamiast żądań użytkownika, użyj [Zdarzeń pokoju w tle](/pl/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Wartością domyślną jest `unmentionedInbound: "user_request"`. Wiadomości ze wzmiankami, polecenia, żądania przerwania i wiadomości prywatne nadal są żądaniami użytkownika.

Aby wymagać przesyłania widocznych danych wyjściowych przez narzędzie wiadomości w przypadku żądań grupowych i kanałowych:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Aby wymagać tego dla każdego czatu źródłowego:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway wykrywa zmiany konfiguracji `messages` bez ponownego uruchamiania po zapisaniu pliku. Ponowne uruchomienie jest wymagane tylko wtedy, gdy przeładowywanie konfiguracji jest wyłączone (`gateway.reload.mode: "off"`).

Interakcje poleceń omijają `visibleReplies: "message_tool"` i zawsze odpowiadają w widoczny sposób: zarówno natywne polecenia z ukośnikiem (Discord, Telegram i inne interfejsy z natywną obsługą poleceń), jak i autoryzowane polecenia tekstowe `/...` publikują odpowiedź w czacie źródłowym. Nieautoryzowane tekstowe interakcje `/...` w grupach pozostają obsługiwane wyłącznie przez narzędzie wiadomości; zwykłe interakcje czatu działają zgodnie ze skonfigurowanym ustawieniem domyślnym.

## Widoczność kontekstu i listy dozwolonych

Bezpieczeństwo grup obejmuje dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może uruchamiać agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych właściwe dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest przekazywany do modelu (tekst odpowiedzi/cytatu, historia wątku, metadane przekazania).

Domyślnie OpenClaw zachowuje kontekst w otrzymanej postaci: listy dozwolonych określają, kto może wyzwalać działania, a nie jakie cytowane lub historyczne fragmenty widzi model. Aby również filtrować dodatkowy kontekst, ustaw `contextVisibility`:

| Tryb                | Zachowanie                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (domyślnie)   | Zachowaj dodatkowy kontekst w otrzymanej postaci.                                           |
| `"allowlist"`       | Przekazuj historię, wątek, cytat i przekazany kontekst tylko od nadawców z listy dozwolonych.     |
| `"allowlist_quote"` | `allowlist`, a dodatkowo zachowaj jawnie cytowaną wiadomość lub wiadomość, na którą udzielono odpowiedzi, od dowolnego nadawcy. |

Ustaw tę opcję dla kanału (`channels.<channel>.contextVisibility`), konta (`channels.<channel>.accounts.<accountId>.contextVisibility`) lub globalnie (`channels.defaults.contextVisibility`). Kanały pobierające dodatkowy kontekst (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) stosują tę politykę podczas tworzenia kontekstu przychodzącego; nieznane kombinacje polityk skutkują bezpiecznym odrzuceniem i pominięciem kontekstu.

![Przebieg wiadomości grupowej](/images/groups-flow.svg)

W zależności od celu:

| Cel                                         | Ustawienie                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwalaj na wszystkie grupy, ale odpowiadaj tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłącz wszystkie odpowiedzi grupowe                    | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                         | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)         |
| Tylko użytkownik może wyzwalać działania w grupach               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Używaj jednego zaufanego zestawu nadawców w wielu kanałach | `groupAllowFrom: ["accessGroup:operators"]`                |

Informacje o listach dozwolonych nadawców wielokrotnego użytku zawiera sekcja [Grupy dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje i kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub sesji osobnych dla poszczególnych nadawców, jeśli skonfigurowano `session.dmScope`).
- Heartbeat działa w skonfigurowanej sesji Heartbeat (domyślnie w głównej sesji agenta); sesje grupowe nie uruchamiają własnych Heartbeat.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste wiadomości prywatne i publiczne grupy (jeden agent)

Tak — sprawdza się to dobrze, jeśli „osobisty” ruch obejmuje **wiadomości prywatne**, a „publiczny” ruch obejmuje **grupy**.

Przyczyna: w trybie jednego agenta wiadomości prywatne zwykle trafiają do klucza sesji **głównej** (`agent:main:main`), natomiast grupy zawsze używają kluczy sesji **innych niż główny** (`agent:main:<channel>:group:<id>`). Jeśli piaskownica zostanie włączona za pomocą `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym zapleczu piaskownicy, podczas gdy główna sesja wiadomości prywatnych pozostanie na hoście. Jeśli nie zostanie wybrane inne zaplecze, domyślnie używany jest Docker.

Zapewnia to jeden „mózg” agenta (wspólny obszar roboczy i pamięć), ale dwa tryby wykonywania:

- **Wiadomości prywatne**: pełny zestaw narzędzi (host)
- **Grupy**: piaskownica i ograniczony zestaw narzędzi

<Note>
Jeśli potrzebne są całkowicie oddzielne obszary robocze lub persony („osobiste” i „publiczne” nigdy nie mogą się mieszać), należy użyć drugiego agenta i powiązań. Zobacz [Trasowanie wieloagentowe](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Wiadomości prywatne na hoście, grupy w piaskownicy">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grupy/kanały nie są główne -> działają w piaskownicy
            scope: "session", // najsilniejsza izolacja (jeden kontener na grupę/kanał)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Jeśli lista allow nie jest pusta, wszystko inne jest blokowane (deny nadal ma pierwszeństwo).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Grupy widzą tylko folder z listy dozwolonych">
    Potrzebne jest ustawienie „grupy widzą tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w piaskownicy tylko ścieżki z listy dozwolonych:

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
                // ścieżkaHosta:ścieżkaKontenera:tryb
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

Powiązane informacje:

- Klucze konfiguracji i wartości domyślne: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)
- Debugowanie przyczyn blokowania narzędzia: [Piaskownica a polityka narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowania powiązań: [Piaskownica](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety interfejsu użytkownika używają `displayName`, jeśli jest dostępny, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowany dla pokojów i kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`). Bardzo długie nieprzezroczyste identyfikatory są skracane do stabilnego tokenu, aby pełne identyfikatory tras nie trafiały do interfejsu użytkownika.

## Polityka grup

Sterowanie obsługą wiadomości grupowych i wiadomości w pokojach dla poszczególnych kanałów:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeryczny identyfikator użytkownika Telegram (konfiguracja rozpoznaje @username)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| Zasada        | Zachowanie                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy omijają listy dozwolonych; wymóg wzmianki nadal obowiązuje.      |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.                           |
| `"allowlist"` | Zezwala tylko na grupy/pokoje pasujące do skonfigurowanej listy dozwolonych. |

<AccordionGroup>
  <Accordion title="Uwagi dotyczące poszczególnych kanałów">
    - `groupPolicy` jest niezależne od wymogu wzmianki (który wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: używa `groupAllowFrom` (wartość zastępcza: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować do identyfikatora przychodzącej grupy Signal albo telefonu/UUID nadawcy.
    - Zatwierdzenia parowania wiadomości bezpośrednich (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu do wiadomości bezpośrednich; autoryzacja nadawców grupowych nadal wymaga jawnych grupowych list dozwolonych.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Należy używać identyfikatorów pokojów (`!room:server`) lub aliasów (`#alias:server`); klucze nazw pokojów są dopasowywane tylko z `channels.matrix.dangerouslyAllowNameMatching: true`, a nierozpoznane wpisy są ignorowane podczas działania. Aby ograniczyć nadawców, należy użyć `channels.matrix.groupAllowFrom`; obsługiwane są również listy dozwolonych `users` dla poszczególnych pokojów.
    - Grupowe wiadomości bezpośrednie są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: listy dozwolonych nadawców przyjmują wyłącznie numeryczne identyfikatory użytkowników (`"123456789"`; prefiksy `telegram:`/`tg:` są usuwane bez rozróżniania wielkości liter). Wpisy `@username` nie są dopasowywane podczas działania i powodują zapisanie ostrzeżenia w dzienniku; konfiguracja rozpoznaje `@username` jako identyfikatory. Ujemne identyfikatory czatów należy umieszczać w `channels.telegram.groups`, a nie na listach dozwolonych nadawców.
    - Wartością domyślną jest `groupPolicy: "allowlist"`; jeśli grupowa lista dozwolonych jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo podczas działania: gdy całkowicie brakuje bloku dostawcy (brak `channels.<provider>`), zasada grupowa przechodzi bezpiecznie do `allowlist` zamiast dziedziczyć `channels.defaults.groupPolicy`, a Gateway zapisuje tę wartość zastępczą w dzienniku raz dla każdego konta.

  </Accordion>
</AccordionGroup>

Uproszczony model działania (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Grupowe listy dozwolonych">
    Grupowe listy dozwolonych (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału).
  </Step>
  <Step title="Wymóg wzmianki">
    Wymóg wzmianki (`requireMention`, `/activation`).
  </Step>
</Steps>

## Wymóg wzmianki (domyślny)

Wiadomości grupowe wymagają wzmianki, chyba że ustawienie zostanie nadpisane dla danej grupy. Wartości domyślne są określane dla poszczególnych podsystemów w `*.groups."*"`.

Odpowiedź na wiadomość bota jest uznawana za niejawną wzmiankę, jeśli kanał udostępnia metadane odpowiedzi; cytowanie wiadomości bota może również zostać uznane za wzmiankę w kanałach udostępniających metadane cytatu. Obecnie wbudowane przypadki obejmują: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp oraz osobiste Zalo.

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

## Ograniczanie zakresu skonfigurowanych wzorców wzmianek

Skonfigurowane `mentionPatterns` są zastępczymi wyzwalaczami w postaci wyrażeń regularnych. Należy ich używać, gdy
platforma nie udostępnia natywnej wzmianki o bocie lub gdy zwykły tekst, taki
jak `openclaw:`, ma być uznawany za wzmiankę. Natywne wzmianki platformy są niezależne:
gdy Discord, Slack, Telegram, Matrix, Signal lub inny kanał może potwierdzić, że wiadomość
jawnie zawierała wzmiankę o bocie, ta natywna wzmianka nadal zadziała, nawet jeśli
skonfigurowane wzorce wyrażeń regularnych są wyłączone.

Domyślnie skonfigurowane wzorce wzmianek obowiązują wszędzie tam, gdzie kanał przekazuje informacje o dostawcy i konwersacji do mechanizmu wykrywania wzmianek. Aby szerokie wzorce nie aktywowały agenta w każdej grupie, należy ograniczyć ich zakres dla poszczególnych kanałów za pomocą `channels.<channel>.mentionPatterns`.

Należy użyć `mode: "deny"`, gdy wzorce wzmianek oparte na wyrażeniach regularnych mają być domyślnie wyłączone dla kanału, a następnie włączyć je w określonych pokojach za pomocą `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Należy użyć domyślnego `mode: "allow"` (lub pominąć `mode`), gdy wzorce wzmianek oparte na wyrażeniach regularnych mają obowiązywać szeroko, a następnie wyłączyć je w hałaśliwych pokojach za pomocą `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Rozstrzyganie zasad:

| Pole           | Efekt                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Wzorce wzmianek oparte na wyrażeniach regularnych są włączone, chyba że identyfikator konwersacji znajduje się w `denyIn`. Jest to wartość domyślna.                    |
| `mode: "deny"`  | Wzorce wzmianek oparte na wyrażeniach regularnych są wyłączone, chyba że identyfikator konwersacji znajduje się w `allowIn`.                                       |
| `allowIn`       | Identyfikatory konwersacji, dla których wzorce wzmianek oparte na wyrażeniach regularnych są włączone w trybie odmowy.                                               |
| `denyIn`        | Identyfikatory konwersacji, dla których wzorce wzmianek oparte na wyrażeniach regularnych są wyłączone. `denyIn` ma pierwszeństwo przed `allowIn`, jeśli oba zawierają ten sam identyfikator. |

Obecnie obsługiwana zasada zakresu wyrażeń regularnych:

| Kanał  | Identyfikatory używane w `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Identyfikatory kanałów Discord.                                         |
| Matrix   | Identyfikatory pokojów Matrix.                                             |
| Slack    | Identyfikatory kanałów Slack.                                           |
| Telegram | Identyfikatory czatów grupowych lub `chatId:topic:threadId` dla tematów forum. |
| WhatsApp | Identyfikatory konwersacji WhatsApp, takie jak `123@g.us`.                |

Konfiguracje kanału na poziomie konta mogą określać tę samą zasadę w `channels.<channel>.accounts.<accountId>.mentionPatterns`, jeśli dany kanał obsługuje wiele kont. Dla danego konta zasada konta ma pierwszeństwo przed zasadą kanału najwyższego poziomu.

<AccordionGroup>
  <Accordion title="Uwagi dotyczące wymogu wzmianki">
    - `mentionPatterns` są bezpiecznymi wzorcami wyrażeń regularnych bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane (z ostrzeżeniem).
    - Pierwszeństwo wzorców: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę) nadpisuje `messages.groupChat.mentionPatterns`; jeśli nie ustawiono żadnego z nich, wzorce są wyprowadzane z nazwy/emoji tożsamości agenta.
    - Wymóg wzmianki jest egzekwowany tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza wymogu wzmianki; należy ustawić `requireMention` tej grupy na `false`, jeśli wszystkie wiadomości mają wyzwalać działanie.
    - Automatyczny kontekst monitu czatu grupowego zawiera w każdej turze rozpoznaną instrukcję cichej odpowiedzi; pliki obszaru roboczego nie powinny powielać mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są automatyczne ciche odpowiedzi, traktują puste tury modelu lub tury zawierające wyłącznie rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie nigdy nie otrzymują wskazówek `NO_REPLY`, a odpowiedzi grupowe korzystające wyłącznie z narzędzia wiadomości pozostają ciche dzięki niewywoływaniu `message(action=send)`.
    - Stale aktywna komunikacja w tle w grupie domyślnie korzysta z semantyki żądania użytkownika. Aby przesyłać ją jako cichy kontekst, należy ustawić `messages.groupChat.unmentionedInbound: "room_event"`. Przykłady konfiguracji znajdują się w sekcji [Zdarzenia pokojów w tle](/pl/channels/ambient-room-events).
    - Zdarzenia pokojów nie są przechowywane jako fikcyjne żądania użytkowników, a prywatny tekst asystenta ze zdarzeń pokojów bez narzędzia wiadomości nie jest ponownie odtwarzany jako historia czatu.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla poszczególnych serwerów/kanałów).
    - Kontekst historii grup jest jednolicie opakowywany we wszystkich kanałach. Grupy z wymogiem wzmianki zachowują oczekujące pominięte wiadomości; stale aktywne grupy mogą również zachowywać ostatnio przetworzone wiadomości z pokoju, jeśli kanał to obsługuje. Należy użyć `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) do nadpisywania. Aby wyłączyć, należy ustawić `0`.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi dla grup/kanałów (opcjonalne)

Niektóre konfiguracje kanałów umożliwiają ograniczenie narzędzi dostępnych **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwala na narzędzia lub ich zabrania dla całej grupy (`allow`, `alsoAllow`, `deny`; odmowa ma pierwszeństwo).
- `toolsBySender`: nadpisania dla poszczególnych nadawców w grupie. Należy używać jawnych prefiksów kluczy: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Identyfikatory kanałów używają kanonicznych identyfikatorów kanałów OpenClaw; aliasy takie jak `teams` są normalizowane do `msteams`. Starsze klucze bez prefiksów są nadal akceptowane, dopasowywane wyłącznie jako `id:` i powodują zapisanie ostrzeżenia o wycofaniu w dzienniku.

Kolejność rozstrzygania (najbardziej szczegółowe ustawienie ma pierwszeństwo):

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
  <Step title="Narzędzia domyślne">
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
Ograniczenia narzędzi dla grup/kanałów są stosowane dodatkowo do globalnych zasad narzędzi i zasad agenta (odmowa nadal ma pierwszeństwo). Niektóre kanały używają innego poziomu zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użycie `"*"` pozwala zezwolić na wszystkie grupy, jednocześnie nadal określając domyślne zachowanie dotyczące wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie jest tym samym co autoryzacja grupy. W przypadku kanałów obsługujących parowanie wiadomości prywatnych magazyn parowania odblokowuje wyłącznie wiadomości prywatne. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy w grupie za pomocą list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, lub udokumentowanej konfiguracji zastępczej dla danego kanału.
</Warning>

Typowe zastosowania (do skopiowania i wklejenia):

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

## Aktywacja (tylko dla właściciela)

Właściciele grup mogą przełączać aktywację dla poszczególnych grup za pomocą samodzielnej wiadomości:

- `/activation mention`
- `/activation always`

`/activation` jest podstawowym poleceniem dostępnym wyłącznie dla właściciela i ma zastosowanie tylko w czatach grupowych. Właścicielem jest nadawca zgodny z `commands.ownerAllowFrom`; listy `allowFrom` kanału kontrolują jedynie zwykły dostęp do kanału i poleceń. Zapisany tryb zastępuje ustawienie `requireMention` danej grupy w kanałach, które go uwzględniają (Google Chat, QQBot, Telegram, WhatsApp), a wprowadzenie grupowego monitu systemowego wszędzie odzwierciedla aktywny tryb.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania według wzmianki)
- Tematy forum Telegram zawierają również `MessageThreadId` i `IsForum`.

Monit systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej (oraz po zmianie `/activation`). Przypomina ono modelowi, aby odpowiadał jak człowiek, ograniczał puste wiersze, stosował standardowe odstępy w czacie i unikał wpisywania dosłownych sekwencji `\n`. Kanały, których zadeklarowany tryb tabel nie zachowuje tabel natywnych ani surowych, również odradzają używanie tabel Markdown. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako odgrodzone, niezaufane metadane, a nie wbudowane instrukcje systemowe.

## Szczegóły dotyczące iMessage

- Podczas kierowania lub tworzenia listy dozwolonych preferowane jest `chat_id:<id>`.
- Wyświetlanie listy czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Monity systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły monitów systemowych WhatsApp, w tym rozstrzyganie monitów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisywania na poziomie konta.

## Szczegóły dotyczące WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie właściwe tylko dla WhatsApp (wstrzykiwanie historii i szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Kierowanie kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
