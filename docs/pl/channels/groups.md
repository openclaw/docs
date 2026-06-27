---
read_when:
    - Zmiana zachowania czatu grupowego lub bramkowania wzmianek
    - Ograniczanie mentionPatterns do konkretnych rozmów grupowych
sidebarTitle: Groups
summary: Zachowanie czatu grupowego na różnych powierzchniach (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupy
x-i18n:
    generated_at: "2026-06-27T17:10:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traktuje czaty grupowe spójnie na różnych powierzchniach: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

W przypadku stale aktywnych pokoi, które powinny dostarczać cichy kontekst, chyba że agent jawnie wyśle widoczną wiadomość, zobacz [Ambient room events](/pl/channels/ambient-room-events).

## Wprowadzenie dla początkujących (2 minuty)

OpenClaw „żyje” na Twoich własnych kontach komunikatorów. Nie ma osobnego użytkownika bota WhatsApp. Jeśli **Ty** jesteś w grupie, OpenClaw może widzieć tę grupę i odpowiadać w niej.

Domyślne zachowanie:

- Grupy są ograniczone (`groupPolicy: "allowlist"`).
- Odpowiedzi wymagają wzmianki, chyba że jawnie wyłączysz bramkowanie wzmiankami.
- Widoczne odpowiedzi w grupach/kanałach domyślnie używają narzędzia `message`.

Tłumacząc: nadawcy z listy dozwolonych mogą wyzwolić OpenClaw, wzmiankując go.

<Note>
**TL;DR**

- **Dostęp do DM** jest kontrolowany przez `*.allowFrom`.
- **Dostęp do grupy** jest kontrolowany przez `*.groupPolicy` + listy dozwolonych (`*.groups`, `*.groupAllowFrom`).
- **Wyzwalanie odpowiedzi** jest kontrolowane przez bramkowanie wzmiankami (`requireMention`, `/activation`).

</Note>

Szybki przepływ (co dzieje się z wiadomością grupową):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Widoczne odpowiedzi

Dla zwykłych żądań grupowych/kanałowych OpenClaw domyślnie ustawia `messages.groupChat.visibleReplies: "automatic"`. Końcowy tekst asystenta jest publikowany przez starszą ścieżkę widocznej odpowiedzi, chyba że włączysz dla pokoju wyjście wyłącznie przez narzędzie wiadomości.

Użyj `messages.groupChat.visibleReplies: "message_tool"`, gdy współdzielony pokój powinien pozwalać agentowi decydować, kiedy mówić, przez wywołanie `message(action=send)`. Działa to najlepiej w pokojach grupowych obsługiwanych przez najnowszej generacji modele niezawodnie korzystające z narzędzi, takie jak GPT 5.5. Jeśli model pominie to narzędzie i zwróci merytoryczny tekst końcowy, OpenClaw zachowa ten tekst końcowy jako prywatny zamiast publikować go w pokoju.

Użyj `"automatic"` dla słabszych modeli lub środowisk uruchomieniowych, które nie rozumieją niezawodnie dostarczania wyłącznie przez narzędzia. W trybie automatycznym końcowy tekst asystenta jest widoczną ścieżką odpowiedzi źródłowej, więc model, który nie potrafi konsekwentnie wywoływać `message(action=send)`, nadal może odpowiadać normalnie.

W trybie automatycznym zwykłe końcowe odpowiedzi tekstowe są publikowane bezpośrednio w pokoju. Jeśli widoczna odpowiedź potrzebuje plików, obrazów lub innych załączników, agent nadal może użyć `message(action=send)` dla tego załącznika zamiast próbować wymusić go przez końcową odpowiedź tekstową.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Dla czatów bezpośrednich i każdego innego zdarzenia źródłowego użyj `messages.visibleReplies: "message_tool"`, aby globalnie zastosować to samo zachowanie widocznej odpowiedzi wyłącznie przez narzędzie. Bezpośrednie tury wewnętrznego WebChat domyślnie używają automatycznego dostarczania końcowej odpowiedzi, dzięki czemu Pi i Codex otrzymują ten sam kontrakt widocznej odpowiedzi. Ustaw `messages.visibleReplies: "message_tool"`, aby celowo wymagać `message(action=send)` dla widocznego wyjścia. `messages.groupChat.visibleReplies` pozostaje bardziej szczegółowym nadpisaniem dla pokojów grupowych/kanałowych.

Zastępuje to stary wzorzec wymuszania na modelu odpowiedzi `NO_REPLY` dla większości tur trybu nasłuchiwania. W trybie wyłącznie narzędziowym prompt nie definiuje kontraktu `NO_REPLY`. Brak widocznego działania oznacza po prostu niewywołanie narzędzia wiadomości.

Wyjątkiem są powiązania konwersacji należące do Plugin. Gdy Plugin powiąże wątek i przejmie turę przychodzącą, odpowiedź zwrócona przez Plugin jest widoczną odpowiedzią powiązania; nie potrzebuje `message(action=send)`. Ta odpowiedź jest wyjściem środowiska uruchomieniowego Plugin, a nie prywatnym tekstem końcowym modelu.

Wskaźniki pisania nadal są wysyłane dla bezpośrednich żądań grupowych. Ambient always-on room events, gdy są włączone, pozostają ścisłe i ciche, chyba że agent wywoła narzędzie wiadomości.

Sesje domyślnie tłumią szczegółowe podsumowania narzędzi/postępu. Użyj `/verbose on`, aby pokazać te podsumowania dla bieżącej sesji podczas debugowania, oraz `/verbose off`, aby wrócić do zachowania wyłącznie końcowej odpowiedzi. Ten sam stan szczegółowości obowiązuje w czatach bezpośrednich, grupach, kanałach i tematach forum.

Aby przesyłać niewzmiankowane stale aktywne rozmowy grupowe jako cichy kontekst pokoju zamiast żądań użytkownika, użyj [Ambient room events](/pl/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Domyślna wartość to `unmentionedInbound: "user_request"`.

Wzmiankowane wiadomości, polecenia, żądania przerwania i DM pozostają żądaniami użytkownika.

Aby wymagać, by widoczne wyjście dla żądań grupowych/kanałowych przechodziło przez narzędzie wiadomości:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub przeładowanie konfiguracji jest wyłączone we wdrożeniu.

Aby wymagać, by widoczne wyjście dla każdego czatu źródłowego przechodziło przez narzędzie wiadomości:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Natywne polecenia ukośnikowe (Discord, Telegram i inne powierzchnie z obsługą natywnych poleceń) omijają `visibleReplies: "message_tool"` i zawsze odpowiadają widocznie, aby natywny interfejs poleceń kanału otrzymał oczekiwaną odpowiedź. Dotyczy to wyłącznie zweryfikowanych tur natywnych poleceń; wpisywane tekstowo polecenia `/...` i zwykłe tury czatu nadal podążają za skonfigurowaną domyślną wartością grupy.

## Widoczność kontekstu i listy dozwolonych

W bezpieczeństwie grup biorą udział dwa różne mechanizmy kontroli:

- **Autoryzacja wyzwalania**: kto może wyzwolić agenta (`groupPolicy`, `groups`, `groupAllowFrom`, listy dozwolonych specyficzne dla kanału).
- **Widoczność kontekstu**: jaki dodatkowy kontekst jest wstrzykiwany do modelu (tekst odpowiedzi, cytaty, historia wątku, metadane przekazania).

Domyślnie OpenClaw priorytetowo traktuje normalne zachowanie czatu i zachowuje kontekst głównie tak, jak został odebrany. Oznacza to, że listy dozwolonych przede wszystkim decydują, kto może wyzwalać działania, a nie stanowią uniwersalnej granicy redakcji dla każdego cytowanego lub historycznego fragmentu.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Niektóre kanały już stosują filtrowanie oparte na nadawcy dla dodatkowego kontekstu w określonych ścieżkach (na przykład inicjowanie wątków Slack, wyszukiwania odpowiedzi/wątków Matrix).
    - Inne kanały nadal przekazują kontekst cytatu/odpowiedzi/przekazania tak, jak został odebrany.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (domyślne) zachowuje bieżące zachowanie „tak jak odebrano”.
    - `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców z listy dozwolonych.
    - `contextVisibility: "allowlist_quote"` to `allowlist` plus jeden jawny wyjątek cytatu/odpowiedzi.

    Dopóki ten model wzmacniania nie zostanie spójnie wdrożony we wszystkich kanałach, spodziewaj się różnic między powierzchniami.

  </Accordion>
</AccordionGroup>

![Przepływ wiadomości grupowej](/images/groups-flow.svg)

Jeśli chcesz...

| Cel                                          | Co ustawić                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Zezwolić na wszystkie grupy, ale odpowiadać tylko na @wzmianki | `groups: { "*": { requireMention: true } }`                |
| Wyłączyć wszystkie odpowiedzi grupowe        | `groupPolicy: "disabled"`                                  |
| Tylko określone grupy                        | `groups: { "<group-id>": { ... } }` (bez klucza `"*"`)     |
| Tylko Ty możesz wyzwalać w grupach           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Ponownie użyć jednego zaufanego zestawu nadawców między kanałami | `groupAllowFrom: ["accessGroup:operators"]`                |

W przypadku wielokrotnego użytku list dozwolonych nadawców zobacz [Grupy dostępu](/pl/channels/access-groups).

## Klucze sesji

- Sesje grupowe używają kluczy sesji `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały używają `agent:<agentId>:<channel>:channel:<id>`).
- Tematy forum Telegram dodają `:topic:<threadId>` do identyfikatora grupy, dzięki czemu każdy temat ma własną sesję.
- Czaty bezpośrednie używają sesji głównej (lub osobnej na nadawcę, jeśli skonfigurowano).
- Heartbeats są pomijane dla sesji grupowych.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Wzorzec: osobiste DM + publiczne grupy (pojedynczy agent)

Tak — działa to dobrze, jeśli Twój „osobisty” ruch to **DM**, a Twój „publiczny” ruch to **grupy**.

Dlaczego: w trybie pojedynczego agenta DM zwykle trafiają do **głównego** klucza sesji (`agent:main:main`), podczas gdy grupy zawsze używają **niegłównych** kluczy sesji (`agent:main:<channel>:group:<id>`). Jeśli włączysz sandboxing z `mode: "non-main"`, te sesje grupowe działają w skonfigurowanym backendzie sandbox, podczas gdy Twoja główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli go nie wybierzesz.

Daje to jeden „mózg” agenta (współdzielony obszar roboczy + pamięć), ale dwie postawy wykonawcze:

- **DM**: pełne narzędzia (host)
- **Grupy**: sandbox + ograniczone narzędzia

<Note>
Jeśli potrzebujesz naprawdę oddzielnych obszarów roboczych/person („osobiste” i „publiczne” nigdy nie mogą się mieszać), użyj drugiego agenta + powiązań. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent).
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
    Chcesz, aby „grupy widziały tylko folder X” zamiast „brak dostępu do hosta”? Zachowaj `workspaceAccess: "none"` i zamontuj w sandbox wyłącznie ścieżki z listy dozwolonych:

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
- Szczegóły montowań bind: [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts)

## Etykiety wyświetlania

- Etykiety UI używają `displayName`, gdy jest dostępne, sformatowane jako `<channel>:<token>`.
- `#room` jest zarezerwowane dla pokojów/kanałów; czaty grupowe używają `g-<slug>` (małe litery, spacje -> `-`, zachowaj `#@+._-`).

## Polityka grup

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

| Zasada        | Zachowanie                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupy pomijają listy dozwolonych; bramkowanie wzmianek nadal obowiązuje.      |
| `"disabled"`  | Całkowicie blokuje wszystkie wiadomości grupowe.                           |
| `"allowlist"` | Zezwala tylko na grupy/pokoje zgodne ze skonfigurowaną listą dozwolonych. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` jest oddzielne od bramkowania wzmianek (które wymaga @wzmianek).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: użyj `groupAllowFrom` (wartość awaryjna: jawne `allowFrom`).
    - Signal: `groupAllowFrom` może pasować do przychodzącego identyfikatora grupy Signal albo do telefonu/UUID nadawcy.
    - Zatwierdzenia parowania DM (wpisy magazynu `*-allowFrom`) dotyczą tylko dostępu DM; autoryzacja nadawcy grupowego pozostaje jawnie powiązana z listami dozwolonych grup.
    - Discord: lista dozwolonych używa `channels.discord.guilds.<id>.channels`.
    - Slack: lista dozwolonych używa `channels.slack.channels`.
    - Matrix: lista dozwolonych używa `channels.matrix.groups`. Preferuj identyfikatory pokoi lub aliasy; wyszukiwanie nazw dołączonych pokoi działa w trybie najlepszej próby, a nierozwiązane nazwy są ignorowane w czasie działania. Użyj `channels.matrix.groupAllowFrom`, aby ograniczyć nadawców; obsługiwane są także listy dozwolonych `users` dla poszczególnych pokoi.
    - Grupowe DM-y są kontrolowane oddzielnie (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Lista dozwolonych Telegram może pasować do identyfikatorów użytkowników (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) albo nazw użytkowników (`"@alice"` lub `"alice"`); prefiksy nie rozróżniają wielkości liter.
    - Wartość domyślna to `groupPolicy: "allowlist"`; jeśli lista dozwolonych grup jest pusta, wiadomości grupowe są blokowane.
    - Bezpieczeństwo w czasie działania: gdy blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa przechodzi w tryb fail-closed (zwykle `allowlist`) zamiast dziedziczyć `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Szybki model mentalny (kolejność oceny wiadomości grupowych):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Listy dozwolonych grup (`*.groups`, `*.groupAllowFrom`, lista dozwolonych specyficzna dla kanału).
  </Step>
  <Step title="Mention gating">
    Bramkowanie wzmianek (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bramkowanie wzmianek (domyślnie)

Wiadomości grupowe wymagają wzmianki, chyba że nadpisano to dla danej grupy. Wartości domyślne znajdują się dla każdego podsystemu pod `*.groups."*"`.

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

## Określanie zakresu skonfigurowanych wzorców wzmianek

Skonfigurowane `mentionPatterns` są wyzwalaczami awaryjnymi regex. Używaj ich, gdy
platforma nie udostępnia natywnej wzmianki bota albo gdy chcesz, aby zwykły tekst,
taki jak `openclaw:`, liczył się jako wzmianka. Natywne wzmianki platformy są oddzielne:
gdy Discord, Slack, Telegram, Matrix lub inny kanał może potwierdzić, że wiadomość
jawnie wspomniała bota, ta natywna wzmianka nadal wyzwala działanie, nawet jeśli
skonfigurowane wzorce regex są zabronione.

Domyślnie skonfigurowane wzorce wzmianek obowiązują wszędzie tam, gdzie kanał przekazuje
fakty dostawcy i konwersacji do wykrywania wzmianek. Aby szerokie wzorce
nie budziły agenta w każdej grupie, określ ich zakres dla kanału za pomocą
`channels.<channel>.mentionPatterns`.

Użyj `mode: "deny"`, gdy wzorce wzmianek regex mają być domyślnie wyłączone dla
kanału, a następnie włącz je w konkretnych pokojach za pomocą `allowIn`:

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

Użyj domyślnego `mode: "allow"` (albo pomiń `mode`), gdy wzorce wzmianek regex
mają obowiązywać szeroko, a następnie wyłącz je w hałaśliwych pokojach za pomocą `denyIn`:

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
| `mode: "allow"` | Wzorce wzmianek regex są włączone, chyba że identyfikator konwersacji znajduje się w `denyIn`. To jest wartość domyślna.                    |
| `mode: "deny"`  | Wzorce wzmianek regex są wyłączone, chyba że identyfikator konwersacji znajduje się w `allowIn`.                                       |
| `allowIn`       | Identyfikatory konwersacji, w których wzorce wzmianek regex są włączone w trybie deny.                                               |
| `denyIn`        | Identyfikatory konwersacji, w których wzorce wzmianek regex są wyłączone. `denyIn` ma pierwszeństwo przed `allowIn`, jeśli oba zawierają ten sam identyfikator. |

Obecnie obsługiwana zasada zakresu regex:

| Kanał  | Identyfikatory używane w `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Identyfikatory kanałów Discord.                                         |
| Matrix   | Identyfikatory pokoi Matrix.                                             |
| Slack    | Identyfikatory kanałów Slack.                                           |
| Telegram | Identyfikatory czatów grupowych albo `chatId:topic:threadId` dla tematów forum. |
| WhatsApp | Identyfikatory konwersacji WhatsApp, takie jak `123@g.us`.                |

Konfiguracje kanałów na poziomie konta mogą ustawić tę samą zasadę pod
`channels.<channel>.accounts.<accountId>.mentionPatterns`, gdy dany kanał
obsługuje wiele kont. Zasada konta ma pierwszeństwo przed zasadą kanału
najwyższego poziomu dla tego konta.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` to bezpieczne wzorce regex bez rozróżniania wielkości liter; nieprawidłowe wzorce i niebezpieczne formy zagnieżdżonych powtórzeń są ignorowane.
    - Powierzchnie, które dostarczają jawne wzmianki, nadal przechodzą; skonfigurowane wzorce regex są mechanizmem awaryjnym.
    - `channels.<channel>.mentionPatterns.mode: "deny"` domyślnie wyłącza skonfigurowane wzorce wzmianek dla tego kanału; włącz wybrane konwersacje ponownie za pomocą `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` wyłącza skonfigurowane wzorce wzmianek dla konkretnych identyfikatorów konwersacji, podczas gdy natywne @wzmianki platformy nadal przechodzą.
    - Nadpisanie dla agenta: `agents.list[].groupChat.mentionPatterns` (przydatne, gdy wielu agentów współdzieli grupę).
    - Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie wzmianek jest możliwe (skonfigurowano natywne wzmianki lub `mentionPatterns`).
    - Dodanie grupy lub nadawcy do listy dozwolonych nie wyłącza bramkowania wzmianek; ustaw `requireMention` tej grupy na `false`, gdy wszystkie wiadomości mają wyzwalać działanie.
    - Automatyczny kontekst promptu czatu grupowego przenosi rozwiązaną instrukcję cichej odpowiedzi w każdej turze; pliki obszaru roboczego nie powinny duplikować mechaniki `NO_REPLY`.
    - Grupy, w których dozwolone są automatyczne ciche odpowiedzi, traktują czyste puste tury modelu lub tury zawierające tylko rozumowanie jako ciche, równoważne `NO_REPLY`. Czaty bezpośrednie nigdy nie otrzymują wskazówek `NO_REPLY`, a grupowe odpowiedzi używające wyłącznie narzędzia wiadomości pozostają ciche przez niewywołanie `message(action=send)`.
    - Otaczająca, zawsze włączona rozmowa grupowa domyślnie używa semantyki żądania użytkownika. Ustaw `messages.groupChat.unmentionedInbound: "room_event"`, aby przesyłać ją zamiast tego jako cichy kontekst. Zobacz [Zdarzenia otoczenia pokoju](/pl/channels/ambient-room-events), aby poznać przykłady konfiguracji.
    - Zdarzenia pokoju nie są przechowywane jako fałszywe żądania użytkownika, a prywatny tekst asystenta ze zdarzeń pokoju bez narzędzia wiadomości nie jest odtwarzany jako historia czatu.
    - Wartości domyślne Discord znajdują się w `channels.discord.guilds."*"` (można je nadpisać dla gildii/kanału).
    - Kontekst historii grupy jest opakowywany jednolicie we wszystkich kanałach. Grupy bramkowane wzmiankami zachowują oczekujące pominięte wiadomości; grupy zawsze włączone mogą także zachowywać ostatnie przetworzone wiadomości pokoju, gdy kanał to obsługuje. Użyj `messages.groupChat.historyLimit` jako globalnej wartości domyślnej oraz `channels.<channel>.historyLimit` (lub `channels.<channel>.accounts.*.historyLimit`) dla nadpisań. Ustaw `0`, aby wyłączyć.

  </Accordion>
</AccordionGroup>

## Ograniczenia narzędzi grupy/kanału (opcjonalne)

Niektóre konfiguracje kanałów obsługują ograniczanie, które narzędzia są dostępne **wewnątrz konkretnej grupy/pokoju/kanału**.

- `tools`: zezwalaj na narzędzia lub odmawiaj ich dla całej grupy.
- `toolsBySender`: nadpisania dla poszczególnych nadawców w grupie. Używaj jawnych prefiksów kluczy: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` i symbol wieloznaczny `"*"`. Identyfikatory kanałów używają kanonicznych identyfikatorów kanałów OpenClaw; aliasy takie jak `teams` są normalizowane do `msteams`. Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.

Kolejność rozstrzygania (wygrywa najbardziej szczegółowe dopasowanie):

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
Ograniczenia narzędzi grupy/kanału są stosowane dodatkowo względem globalnej zasady narzędzi/agenta (odmowa nadal wygrywa). Niektóre kanały używają innego zagnieżdżania dla pokoi/kanałów (np. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listy dozwolonych grup

Gdy skonfigurowano `channels.whatsapp.groups`, `channels.telegram.groups` lub `channels.imessage.groups`, klucze działają jako lista dozwolonych grup. Użyj `"*"`, aby zezwolić na wszystkie grupy, nadal ustawiając domyślne zachowanie wzmianek.

<Warning>
Częste nieporozumienie: zatwierdzenie parowania DM nie jest tym samym co autoryzacja grupy. W kanałach obsługujących parowanie DM magazyn parowania odblokowuje tylko wiadomości prywatne. Polecenia grupowe nadal wymagają jawnej autoryzacji nadawcy grupowego z list dozwolonych w konfiguracji, takich jak `groupAllowFrom`, albo udokumentowanego awaryjnego ustawienia konfiguracji dla tego kanału.
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
  <Tab title="Wyzwalacze tylko właściciela (WhatsApp)">
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

Właściciel jest określany przez `channels.whatsapp.allowFrom` (albo własny numer E.164 bota, gdy nie jest ustawiony). Wyślij polecenie jako samodzielną wiadomość. Inne powierzchnie obecnie ignorują `/activation`.

## Pola kontekstu

Przychodzące ładunki grupowe ustawiają:

- `ChatType=group`
- `GroupSubject` (jeśli znane)
- `GroupMembers` (jeśli znane)
- `WasMentioned` (wynik bramkowania wzmianki)
- Tematy forum Telegram zawierają też `MessageThreadId` i `IsForum`.

Systemowy prompt agenta zawiera wprowadzenie grupowe w pierwszej turze nowej sesji grupowej. Przypomina modelowi, aby odpowiadał jak człowiek, minimalizował puste wiersze i stosował normalne odstępy czatu oraz unikał wpisywania dosłownych sekwencji `\n`. Grupy inne niż Telegram odradzają też tabele Markdown; wskazówki dotyczące tekstu sformatowanego Telegram pochodzą z promptu kanału Telegram. Nazwy grup i etykiety uczestników pochodzące z kanału są renderowane jako odgrodzone niezaufane metadane, a nie jako wbudowane instrukcje systemowe.

## Szczegóły iMessage

- Preferuj `chat_id:<id>` podczas routingu lub dodawania do listy dozwolonych.
- Lista czatów: `imsg chats --limit 20`.
- Odpowiedzi grupowe zawsze wracają do tego samego `chat_id`.

## Prompty systemowe WhatsApp

Zobacz [WhatsApp](/pl/channels/whatsapp#system-prompts), aby poznać kanoniczne reguły promptów systemowych WhatsApp, w tym rozstrzyganie promptów grupowych i bezpośrednich, zachowanie symboli wieloznacznych oraz semantykę nadpisania konta.

## Szczegóły WhatsApp

Zobacz [Wiadomości grupowe](/pl/channels/group-messages), aby poznać zachowanie specyficzne tylko dla WhatsApp (wstrzykiwanie historii, szczegóły obsługi wzmianek).

## Powiązane

- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Wiadomości grupowe](/pl/channels/group-messages)
- [Parowanie](/pl/channels/pairing)
