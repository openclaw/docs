---
read_when:
    - Zmiana zachowania czatu grupowego lub wymogu wzmianki
    - Ograniczanie mentionPatterns do określonych konwersacji grupowych
sidebarTitle: Groups
summary: Zachowanie czatów grupowych na różnych platformach (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-07-12T14:52:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw stosuje te same reguły grup we wszystkich kanałach obsługujących grupy, w tym Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp i Zalo.

W przypadku stale aktywnych pokoi, które powinny dostarczać dyskretny kontekst, chyba że agent jawnie wyśle widoczną wiadomość, zobacz [Zdarzenia otoczenia pokoju](/pl/channels/ambient-room-events).

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „działa” na Twoich własnych kontach komunikatorów. Nie istnieje osobny użytkownik-bot WhatsApp: jeśli **należysz** do grupy, OpenClaw może ją widzieć i w niej odpowiadać.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`); nadawcy w grupach są blokowani, dopóki nie zostaną dodani do listy dozwolonych.
- Odpowiedzi wymagają wzmianki, chyba że wyłączysz wymóg wzmianki dla danej grupy.
- Końcowy tekst odpowiedzi jest automatycznie publikowany w pokoju (`visibleReplies: "automatic"`).

Innymi słowy: nadawcy z listy dozwolonych mogą uruchomić OpenClaw, wymieniając jego nazwę.

<Note>
**W skrócie**

- **Dostęp do wiadomości prywatnych** jest kontrolowany przez `*.allowFrom`.
- **Dostęp do grup** jest kontrolowany przez `*.groupPolicy` i listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez wymóg wzmianki (`requireMention`, `/activation`).

</Note>

Skrócony przebieg (co dzieje się z wiadomością grupową):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Widoczne odpowiedzi

W przypadku zwykłych żądań w grupach i kanałach OpenClaw domyślnie używa `messages.groupChat.visibleReplies: "automatic"`: końcowy tekst asystenta jest publikowany w pokoju jako widoczna odpowiedź.

Użyj `messages.groupChat.visibleReplies: "message_tool"`, jeśli we współdzielonym pokoju agent powinien sam decydować, kiedy zabrać głos, wywołując `message(action=send)`. Działa to najlepiej z modelami niezawodnie korzystającymi z narzędzi (na przykład GPT-5.6 Sol). Jeśli model nie użyje narzędzia i zwróci merytoryczny tekst końcowy, OpenClaw zachowa ten tekst jako prywatny, zamiast publikować go w pokoju.

Użyj `"automatic"` w przypadku modeli lub środowisk uruchomieniowych, które nie stosują niezawodnie dostarczania wyłącznie przez narzędzie: zwykłe końcowe odpowiedzi tekstowe są publikowane bezpośrednio w pokoju, a agent nadal może wywołać `message(action=send)` dla plików, obrazów lub innych załączników, których nie można dołączyć do tekstu końcowego.

Jeśli narzędzie wiadomości jest niedostępne zgodnie z aktywną polityką narzędzi, OpenClaw powraca do automatycznych widocznych odpowiedzi, zamiast po cichu pomijać odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

W przypadku czatów bezpośrednich i wszystkich innych zdarzeń źródłowych `messages.visibleReplies: "message_tool"` stosuje globalnie to samo zachowanie oparte wyłącznie na narzędziu; `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokoi grupowych i kanałów. Bezpośrednie interakcje w wewnętrznym WebChat domyślnie automatycznie dostarczają końcową odpowiedź, dzięki czemu Pi i Codex otrzymują ten sam kontrakt widocznych odpowiedzi.

Tryb oparty wyłącznie na narzędziu zastępuje wcześniejszy wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` w większości interakcji w trybie biernej obserwacji. W tym trybie prompt nie definiuje kontraktu `NO_REPLY`; brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wyjątkiem są powiązania konwersacji należące do Pluginu. Gdy Plugin powiąże wątek i przejmie przychodzącą interakcję, zwrócona przez Plugin odpowiedź jest widoczną odpowiedzią powiązania; nie wymaga `message(action=send)`. Ta odpowiedź stanowi dane wyjściowe środowiska uruchomieniowego Pluginu, a nie prywatny końcowy tekst modelu.

Wskaźniki pisania nadal są wysyłane w przypadku bezpośrednich żądań grupowych. Zdarzenia otoczenia stale aktywnych pokoi, jeśli są włączone, pozostają ściśle wyciszone, chyba że agent wywoła narzędzie wiadomości.

Sesje domyślnie pomijają szczegółowe podsumowania narzędzi i postępu. Użyj `/verbose on` (lub `/verbose full`), aby wyświetlać je podczas debugowania bieżącej sesji, oraz `/verbose off`, aby przywrócić zachowanie obejmujące wyłącznie odpowiedzi końcowe. Stan szczegółowości jest przypisany do sesji i działa tak samo w czatach bezpośrednich, grupach, kanałach oraz tematach forum.

Aby przesyłać niewspominające agenta wiadomości ze stale aktywnej grupy jako dyskretny kontekst pokoju, a nie żądania użytkownika, użyj [Zdarzeń otoczenia pokoju](/pl/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Wartością domyślną jest `unmentionedInbound: "user_request"`. Wiadomości zawierające wzmiankę, polecenia, żądania przerwania oraz wiadomości prywatne pozostają żądaniami użytkownika.

Aby wymagać przesyłania widocznych danych wyjściowych przez narzędzie wiadomości dla żądań grupowych i kanałowych:

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

Gateway wczytuje zmiany konfiguracji `messages` bez ponownego uruchamiania po zapisaniu pliku. Uruchom go ponownie tylko wtedy, gdy ponowne wczytywanie konfiguracji jest wyłączone (`gateway.reload.mode: "off"`).

Interakcje z poleceniami omijają `visibleReplies: "message_tool"` i zawsze odpowiadają w sposób widoczny: zarówno natywne polecenia z ukośnikiem (Discord, Telegram i inne interfejsy z natywną obsługą poleceń), jak i autoryzowane polecenia tekstowe `/...` publikują odpowiedź w czacie źródłowym. Nieautoryzowane tekstowe interakcje `/...` w grupach nadal wymagają narzędzia wiadomości; zwykłe interakcje czatowe stosują skonfigurowane ustawienie domyślne.

## Widoczność kontekstu i listy dozwolonych

Za bezpieczeństwo grup odpowiadają dwa różne mechanizmy:

- **Autoryzacja wyzwalania**: kto może uruchomić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych właściwe dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest przekazywany do modelu (tekst odpowiedzi lub cytatu, historia wątku, metadane przekazania).

Domyślnie OpenClaw zachowuje kontekst w otrzymanej postaci: listy dozwolonych określają, kto może wyzwalać działania, a nie które cytowane lub historyczne fragmenty widzi model. Aby filtrować również dodatkowy kontekst, ustaw `contextVisibility`:

| Tryb                | Zachowanie                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `"all"` (domyślny)  | Zachowuje dodatkowy kontekst w otrzymanej postaci.                                                 |
| `"allowlist"`       | Przekazuje tylko kontekst historii, wątku, cytatu i przekazania pochodzący od dozwolonych nadawców. |
| `"allowlist_quote"` | Jak `allowlist`, ale zachowuje także jawnie cytowaną wiadomość lub wiadomość, na którą odpowiadano, niezależnie od nadawcy. |

Ustaw tę opcję dla kanału (`channels.<channel>.contextVisibility`), konta (`channels.<channel>.accounts.<accountId>.contextVisibility`) lub globalnie (`channels.defaults.contextVisibility`). Kanały pobierające dodatkowy kontekst (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) stosują tę politykę podczas tworzenia kontekstu przychodzącego; nieznane kombinacje polityk są bezpiecznie odrzucane, a kontekst pomijany.

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                                           | Ustawienie                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe                          | `groupPolicy: "disabled"`                                  |
| Zezwolić tylko na określone grupy                              | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Zezwolić tylko sobie na wyzwalanie w grupach                   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Używać jednego zbioru zaufanych nadawców we wszystkich kanałach | `groupAllowFrom: ["accessGroup:operators"]`                |

Informacje o wielokrotnie używanych listach dozwolonych nadawców znajdziesz w sekcji [Grupy dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje i kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub sesji osobnych dla każdego nadawcy, jeśli skonfigurowano `session.dmScope`).
- Heartbeat działa w skonfigurowanej sesji Heartbeat (domyślnie w głównej sesji agenta); sesje grupowe nie uruchamiają własnych Heartbeatów.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste wiadomości prywatne i publiczne grupy (jeden agent)

Tak — sprawdza się to dobrze, jeśli „osobisty” ruch stanowią **wiadomości prywatne**, a „publiczny” ruch — **grupy**.

Dlaczego: w trybie jednego agenta wiadomości prywatne zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), natomiast grupy zawsze używają **innych niż główny** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz izolację w piaskownicy z `mode: "non-main"`, te sesje grupowe będą działać w skonfigurowanym zapleczu piaskownicy, natomiast główna sesja wiadomości prywatnych pozostanie na hoście. Jeśli nie wybierzesz innego zaplecza, domyślnie używany jest Docker.

Zapewnia to jeden „mózg” agenta (współdzielony obszar roboczy i pamięć), ale dwa tryby wykonywania:

- **Wiadomości prywatne**: pełny zestaw narzędzi (host)
- **Grupy**: piaskownica i ograniczone narzędzia

<Note>
Jeśli potrzebujesz całkowicie oddzielnych obszarów roboczych lub person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta i powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Wiadomości prywatne na hoście, grupy w piaskownicy">
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
    Chcesz, aby „grupy widziały tylko folder X”, zamiast „braku dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w piaskownicy wyłącznie ścieżki z listy dozwolonych:

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

Powiązane informacje:

- Klucze konfiguracji i wartości domyślne: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)
- Debugowanie przyczyn blokowania narzędzia: [Piaskownica a polityka narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
- Szczegóły montowania przez powiązanie: [Izolacja w piaskownicy](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlane

- Etykiety interfejsu używają `displayName`, jeśli jest dostępne, w formacie `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokoi i kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`). Bardzo długie, nieczytelne identyfikatory są skracane do stabilnego tokenu, zamiast ujawniać pełne identyfikatory tras w interfejsie.

## Polityka grup

Określ sposób obsługi wiadomości grupowych i wiadomości w pokojach dla każdego kanału:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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

| Zasada        | Działanie                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy pomijają listy dozwolonych; nadal obowiązuje wymóg wzmianki. |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.             |
| `"allowlist"` | Zezwala tylko na grupy/pokoje zgodne ze skonfigurowaną listą dozwolonych. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` jest niezależne od wymogu wzmianki (który wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (wartość rezerwowa: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może dopasowywać identyfikator przychodzącej grupy Signal albo telefon/UUID nadawcy.
    - Zatwierdzenia parowania wiadomości prywatnych (wpisy magazynu `*-allowFrom`) dotyczą wyłącznie dostępu do wiadomości prywatnych; autoryzacja nadawcy w grupie nadal wymaga jawnych grupowych list dozwolonych.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Używaj identyfikatorów pokoi (`!room:server`) lub aliasów (`#alias:server`); klucze nazw pokoi są dopasowywane tylko przy `channels.matrix.dangerouslyAllowNameMatching: true`, a nierozpoznane wpisy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` dla poszczególnych pokoi.
    - Grupowe wiadomości prywatne są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: listy dozwolonych nadawców akceptują wyłącznie numeryczne identyfikatory użytkowników (`"123456789"`; prefiksy `telegram:`/`tg:` są usuwane bez uwzględniania wielkości liter). Wpisy `@username` nie są dopasowywane w czasie działania i powodują zapisanie ostrzeżenia w dzienniku; konfiguracja przekształca `@username` na identyfikatory. Ujemne identyfikatory czatów należy umieszczać w `channels.telegram.groups`, a nie na listach dozwolonych nadawców.
    - Wartość domyślna to `groupPolicy: "allowlist"`; jeśli grupowa lista dozwolonych jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy całkowicie brakuje bloku dostawcy (nie istnieje `channels.<provider>`), zasada grupowa bezpiecznie przyjmuje `allowlist` zamiast dziedziczyć `channels.defaults.groupPolicy`, a Gateway zapisuje tę wartość rezerwową w dzienniku raz na konto.

  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Grupowe listy dozwolonych (`*.groups`, `*.groupAllowFrom`, lista dozwolonych właściwa dla kanału).
  </Step>
  <Step title="Mention gating">
    Wymóg wzmianki (`requireMention`, `/activation`).
  </Step>
</Steps>

## Wymóg wzmianki (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że ustawienie zostanie nadpisane dla danej grupy. Wartości domyślne znajdują się w poszczególnych podsystemach pod `*.groups."*"`.

Odpowiedź na wiadomość bota jest uznawana za niejawną wzmiankę, gdy kanał udostępnia metadane odpowiedzi; cytowanie wiadomości bota również może zostać uznane za wzmiankę w kanałach udostępniających metadane cytowania. Obecnie wbudowane przypadki to: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp oraz osobiste Zalo.

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

## Zakres skonfigurowanych wzorców wzmianek

Skonfigurowane `mentionPatterns` są rezerwowymi wyzwalaczami opartymi na wyrażeniach regularnych. Używaj ich, gdy platforma nie udostępnia natywnej wzmianki o bocie lub gdy zwykły tekst, taki jak `openclaw:`, powinien być uznawany za wzmiankę. Natywne wzmianki platformy są obsługiwane oddzielnie: jeśli Discord, Slack, Telegram, Matrix lub inny kanał może potwierdzić, że wiadomość jawnie wspominała bota, taka natywna wzmianka nadal uruchamia agenta, nawet gdy skonfigurowane wzorce wyrażeń regularnych są wyłączone.

Domyślnie skonfigurowane wzorce wzmianek obowiązują wszędzie tam, gdzie kanał przekazuje dane dostawcy i konwersacji do mechanizmu wykrywania wzmianek. Aby ogólne wzorce nie wybudzały agenta w każdej grupie, ogranicz ich zakres dla poszczególnych kanałów za pomocą `channels.<channel>.mentionPatterns`.

Użyj `mode: "deny"`, gdy wzorce wzmianek oparte na wyrażeniach regularnych powinny być domyślnie wyłączone dla kanału, a następnie włącz je w określonych pokojach za pomocą `allowIn`:

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

Użyj domyślnego `mode: "allow"` (lub pomiń `mode`), gdy wzorce wzmianek oparte na wyrażeniach regularnych powinny obowiązywać szeroko, a następnie wyłącz je w hałaśliwych pokojach za pomocą `denyIn`:

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

| Pole            | Działanie                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Wzorce wzmianek oparte na wyrażeniach regularnych są włączone, chyba że identyfikator konwersacji znajduje się w `denyIn`. Jest to wartość domyślna. |
| `mode: "deny"`  | Wzorce wzmianek oparte na wyrażeniach regularnych są wyłączone, chyba że identyfikator konwersacji znajduje się w `allowIn`. |
| `allowIn`       | Identyfikatory konwersacji, w których wzorce wzmianek oparte na wyrażeniach regularnych są włączone w trybie odmowy. |
| `denyIn`        | Identyfikatory konwersacji, w których wzorce wzmianek oparte na wyrażeniach regularnych są wyłączone. `denyIn` ma pierwszeństwo przed `allowIn`, jeśli oba zawierają ten sam identyfikator. |

Obecnie obsługiwane zasady zakresu wyrażeń regularnych:

| Kanał    | Identyfikatory używane w `allowIn` / `denyIn`                |
| -------- | ------------------------------------------------------------ |
| Discord  | Identyfikatory kanałów Discord.                              |
| Matrix   | Identyfikatory pokoi Matrix.                                 |
| Slack    | Identyfikatory kanałów Slack.                                |
| Telegram | Identyfikatory czatów grupowych lub `chatId:topic:threadId` dla tematów forum. |
| WhatsApp | Identyfikatory konwersacji WhatsApp, takie jak `123@g.us`.   |

Konfiguracje kanałów na poziomie konta mogą ustawić tę samą zasadę w `channels.<channel>.accounts.<accountId>.mentionPatterns`, jeśli dany kanał obsługuje wiele kont. Zasada konta ma pierwszeństwo przed zasadą kanału najwyższego poziomu dla tego konta.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` to bezpieczne wzorce wyrażeń regularnych nieuwzględniające wielkości liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane (z ostrzeżeniem).
    - Pierwszeństwo wzorców: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę) nadpisuje `messages.groupChat.mentionPatterns`; gdy żadne z nich nie jest ustawione, wzorce są wyprowadzane z nazwy/emotikonu tożsamości agenta.
    - Wymóg wzmianki jest egzekwowany tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza wymogu wzmianki; ustaw `requireMention` tej grupy na `false`, jeśli wszystkie wiadomości powinny uruchamiać agenta.
    - Automatyczny kontekst monitu czatu grupowego w każdym przebiegu zawiera rozstrzygniętą instrukcję cichej odpowiedzi; pliki obszaru roboczego nie powinny powielać mechanizmu `NO_REPLY`.
    - Grupy, w których dozwolone są automatyczne ciche odpowiedzi, traktują puste lub zawierające wyłącznie rozumowanie przebiegi modelu jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie nigdy nie otrzymują instrukcji `NO_REPLY`, a odpowiedzi grupowe korzystające wyłącznie z narzędzia wiadomości pozostają ciche dzięki niewywoływaniu `message(action=send)`.
    - Stała komunikacja w tle w grupie domyślnie używa semantyki żądania użytkownika. Ustaw `messages.groupChat.unmentionedInbound: "room_event"`, aby zamiast tego przesyłać ją jako cichy kontekst. Przykłady konfiguracji zawiera strona [Zdarzenia pokoju w tle](/pl/channels/ambient-room-events).
    - Zdarzenia pokoju nie są przechowywane jako fikcyjne żądania użytkownika, a prywatny tekst asystenta ze zdarzeń pokoju bez narzędzia wiadomości nie jest ponownie odtwarzany jako historia czatu.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla poszczególnych serwerów/kanałów).
    - Kontekst historii grupy jest jednolicie opakowywany we wszystkich kanałach. Grupy wymagające wzmianki zachowują oczekujące pominięte wiadomości; grupy stale aktywne mogą również zachowywać ostatnio przetworzone wiadomości pokoju, jeśli kanał to obsługuje. Użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) do nadpisania. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie narzędzi dostępnych **wewnątrz określonej grupy/pokoju/kanału**.

- `tools`: zezwala na narzędzia lub ich zabrania w całej grupie (`allow`, `alsoAllow`, `deny`; odmowa ma pierwszeństwo).
- `toolsBySender`: nadpisania dla poszczególnych nadawców w grupie. Używaj jawnych prefiksów kluczy: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oraz symbolu wieloznacznego `"*"`. Identyfikatory kanałów używają kanonicznych identyfikatorów kanałów OpenClaw; aliasy takie jak `teams` są normalizowane do `msteams`. Starsze klucze bez prefiksów są nadal akceptowane, dopasowywane wyłącznie jako `id:` i powodują zapisanie ostrzeżenia o wycofaniu w dzienniku.

Kolejność rozstrzygania (najbardziej szczegółowe ustawienie ma pierwszeństwo):

<Steps>
  <Step title="Group toolsBySender">
    Dopasowanie `toolsBySender` grupy/kanału.
  </Step>
  <Step title="Group tools">
    `tools` grupy/kanału.
  </Step>
  <Step title="Default toolsBySender">
    Domyślne dopasowanie `toolsBySender` (`"*"`).
  </Step>
  <Step title="Default tools">
    Domyślne `tools` (`"*"`).
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
Ograniczenia narzędzi grupy/kanału są stosowane dodatkowo względem globalnych zasad narzędzi lub zasad agenta (odmowa nadal ma pierwszeństwo). Niektóre kanały używają innego zagnieżdżenia dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grupowe listy dozwolonych

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako grupowa lista dozwolonych. Użyj `"*"`, aby zezwolić na wszystkie grupy, jednocześnie nadal ustawiając domyślne zachowanie dotyczące wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie wiadomości prywatnych magazyn parowania odblokowuje wyłącznie wiadomości prywatne. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego za pomocą list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, lub udokumentowanego zapasowego ustawienia konfiguracji dla danego kanału.
</Warning>

Typowe zastosowania (skopiuj/wklej):

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

## Aktywacja (tylko właściciel)

Właściciele grup mogą przełączać aktywację osobno dla każdej grupy za pomocą samodzielnej wiadomości:

- `/activation mention`
- `/activation always`

`/activation` to podstawowe polecenie dostępne wyłącznie dla właściciela, które działa tylko w czatach grupowych. Właścicielem jest nadawca zgodny z ustawieniem `allowFrom` / `commands.ownerAllowFrom` kanału (gdy nie skonfigurowano listy dozwolonych, własny identyfikator konta jest uznawany za właściciela). Zapisany tryb zastępuje ustawienie `requireMention` tej grupy w kanałach, które go uwzględniają (Google Chat, QQBot, Telegram, WhatsApp), a wprowadzenie grupowego monitu systemowego wszędzie odzwierciedla aktywny tryb.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli jest znany)
- `GroupMembers` (jeśli są znani)
- `WasMentioned` (wynik warunku wymagania wzmianki)
- Tematy forum Telegram zawierają również `MessageThreadId` i `IsForum`.

Monit systemowy agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej (oraz po zmianach za pomocą `/activation`). Przypomina modelowi, aby odpowiadał jak człowiek, ograniczał puste wiersze, stosował standardowe odstępy czatu i unikał wpisywania dosłownych sekwencji `\n`. W grupach innych niż Telegram odradzane są również tabele Markdown; wskazówki dotyczące tekstu sformatowanego w Telegram pochodzą z monitu kanału Telegram. Nazwy grup i etykiety uczestników pochodzące z kanału są wyświetlane jako odgrodzone, niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły dotyczące iMessage

- Podczas trasowania lub dodawania do listy dozwolonych preferuj `chat_id:<id>`.
- Wyświetlanie listy czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Monity systemowe WhatsApp

Kanoniczne reguły monitów systemowych WhatsApp, w tym rozstrzyganie monitów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisywania ustawień konta, opisano w sekcji [WhatsApp](/pl/channels/whatsapp#system-prompts).

## Szczegóły dotyczące WhatsApp

Zachowanie dotyczące wyłącznie WhatsApp (wstrzykiwanie historii i szczegóły obsługi wzmianek) opisano w sekcji [Wiadomości grupowe](/pl/channels/group-messages).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
