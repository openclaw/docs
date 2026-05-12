---
read_when:
    - Dostosowywanie częstotliwości Heartbeat lub treści komunikatów
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy cron?** Zobacz [Automatyzacja](/pl/automation), aby uzyskać wskazówki, kiedy używać każdego z nich.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł zgłosić wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadania w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone do pracy odłączonej (uruchomienia ACP, subagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (początkujący)

<Steps>
  <Step title="Wybierz częstotliwość">
    Pozostaw Heartbeat włączony (domyślnie `30m`, albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz krótką listę kontrolną `HEARTBEAT.md` albo blok `tasks:` w przestrzeni roboczej agenta.
  </Step>
  <Step title="Zdecyduj, dokąd mają trafiać wiadomości Heartbeat">
    `target: "none"` jest wartością domyślną; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrajanie">
    - Włącz dostarczanie rozumowania Heartbeat dla większej przejrzystości.
    - Użyj lekkiego kontekstu startowego, jeśli uruchomienia Heartbeat potrzebują tylko `HEARTBEAT.md`.
    - Włącz izolowane sesje, aby uniknąć wysyłania pełnej historii rozmowy przy każdym Heartbeat.
    - Ogranicz Heartbeat do aktywnych godzin (czas lokalny).

  </Step>
</Steps>

Przykładowa konfiguracja:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Wartości domyślne

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo `agents.list[].heartbeat.every` dla konkretnego agenta; użyj `0m`, aby wyłączyć.
- Treść polecenia (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Polecenie Heartbeat jest wysyłane **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat jest włączony dla domyślnego agenta, a uruchomienie jest oznaczane wewnętrznie.
- Gdy Heartbeat jest wyłączony przez `0m`, normalne uruchomienia pomijają też `HEARTBEAT.md` w kontekście startowym, aby model nie widział instrukcji przeznaczonych tylko dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza oknem Heartbeat jest pomijany do następnego taktu wewnątrz okna.
- Heartbeat automatycznie odracza się, gdy praca cron jest aktywna albo w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby odraczać także przy dodatkowo zajętych ścieżkach (praca subagenta albo zagnieżdżonych poleceń); jest to przydatne dla lokalnego Ollama i innych ograniczonych hostów z pojedynczym runtime.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Consider outstanding tasks” zachęca agenta do przejrzenia działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, praca w kolejce) i zgłoszenia wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” zachęca do okazjonalnej, lekkiej wiadomości „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat wykonywał coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj kondycję gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia Heartbeat z obsługą narzędzi mogą zamiast tego wywołać `heartbeat_respond` z `notify: false` bez widocznej aktualizacji albo `notify: true` plus `notificationText` dla alertu. Gdy jest obecna, strukturalna odpowiedź narzędzia ma pierwszeństwo przed tekstowym fallbackiem.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku albo końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się w **środku** odpowiedzi, nie jest traktowane specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza Heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i logowane; wiadomość zawierająca tylko `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` ustawia globalne zachowanie Heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli którykolwiek agent ma blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje domyślne ustawienia kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały wielokontowe) nadpisuje ustawienia dla kanału.

### Heartbeat dla poszczególnych agentów

Jeśli dowolny wpis `agents.list[]` zawiera blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat. Blok dla agenta scala się na wierzchu `agents.defaults.heartbeat` (więc możesz raz ustawić wspólne wartości domyślne i nadpisywać je dla agentów).

Przykład: dwóch agentów, tylko drugi agent uruchamia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Przykład aktywnych godzin

Ogranicz Heartbeat do godzin pracy w określonej strefie czasowej:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 albo po 22:00 czasu wschodniego) Heartbeat jest pomijany. Następny zaplanowany takt wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby Heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia oknem czasowym; to zachowanie domyślne).
- Ustaw okno całodniowe: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj tej samej godziny `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc Heartbeat jest zawsze pomijany.
</Warning>

### Przykład wielokontowy

Użyj `accountId`, aby wskazać konkretne konto na kanałach wielokontowych, takich jak Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Uwagi o polach

<ParamField path="every" type="string">
  Interwał Heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu dla uruchomień Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Gdy włączone, dostarcza także osobną wiadomość `Reasoning:`, jeśli jest dostępna (ten sam kształt co `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy `true`, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych przestrzeni roboczej.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy `true`, każdy Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Znacznie zmniejsza koszt tokenów na Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu głównej sesji.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Gdy `true`, uruchomienia Heartbeat odraczają się przy dodatkowo zajętych ścieżkach: pracy subagenta albo zagnieżdżonych poleceń. Ścieżki cron zawsze odraczają Heartbeat, nawet bez tej flagi, więc hosty lokalnych modeli nie uruchamiają jednocześnie promptów cron i Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

- `main` (domyślnie): główna sesja agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
- Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcz do ostatnio używanego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał albo identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
- `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** go na zewnątrz.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania bezpośredniego/DM. `allow`: zezwól na bezpośrednie/DM dostarczanie Heartbeat. `block`: wycisz bezpośrednie/DM dostarczanie (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta ma zastosowanie do rozwiązanego ostatniego kanału, jeśli obsługuje on konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczenie jest pomijane.

</ParamField>
<ParamField path="prompt" type="string">
  Nadpisuje domyślną treść promptu (bez scalania).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy ma wartość true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.

- Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
- `"local"`: zawsze używa strefy czasowej systemu hosta.
- Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` opisanego powyżej.
- `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
- Poza aktywnym oknem Heartbeat są pomijane do następnego taktu wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Sesja i routing celu">
    - Heartbeat domyślnie działają w głównej sesji agenta (`agent:<id>:<mainKey>`) albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać na konkretną sesję kanału (Discord/WhatsApp/itp.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
    - Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia Heartbeat domyślnie pozwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, nadal uruchamiając turę Heartbeat.
    - Jeśli główna kolejka, ścieżka sesji docelowej, ścieżka cron albo aktywne zadanie cron jest zajęte, Heartbeat jest pomijany i ponawiany później.
    - Jeśli `skipWhenBusy: true`, subagent i zagnieżdżone ścieżki również odkładają uruchomienia Heartbeat.
    - Jeśli `target` nie rozwiązuje się do żadnego zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale nie jest wysyłana żadna wiadomość wychodząca.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu zadań do wykonania, przywrócić znacznik bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
    - Jeśli rozwiązany cel Heartbeat obsługuje wpisywanie, OpenClaw pokazuje wpisywanie, gdy uruchomienie Heartbeat jest aktywne. Używa tego samego celu, do którego Heartbeat wysłałby wynik czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie Heartbeat **nie** utrzymują sesji przy życiu. Metadane Heartbeat mogą zaktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej rzeczywistej wiadomości użytkownika/kanału, a wygaśnięcie dzienne używa `sessionStartedAt`.
    - Interfejs sterowania i historia WebChat ukrywają podpowiedzi Heartbeat oraz potwierdzenia wyłącznie OK. Bazowy transkrypt sesji może nadal zawierać te tury na potrzeby audytu/odtworzenia.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i obudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. To obudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrolki widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, podczas gdy treść alertu jest dostarczana. Możesz dostosować to dla kanału lub konta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Pierwszeństwo: na konto → na kanał → domyślne kanału → wbudowane domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź wyłącznie OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu interfejsu.

Jeśli **wszystkie trzy** są false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady na kanał i na konto

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Typowe wzorce

| Cel                                      | Konfiguracja                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Domyślne zachowanie (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                     |
| Całkowicie ciche (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli w obszarze roboczym istnieje plik `HEARTBEAT.md`, domyślna podpowiedź każe agentowi go przeczytać. Pomyśl o nim jak o swojej „liście kontrolnej Heartbeat”: małej, stabilnej i bezpiecznej do dołączania co 30 minut.

Przy normalnych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie rytmu Heartbeat za pomocą `0m` albo ustawienie `includeSystemPromptSection: false` pomija go w normalnym kontekście startowym.

Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (tylko puste wiersze i nagłówki markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API. To pominięcie jest zgłaszane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

Utrzymuj go bardzo małym (krótka lista kontrolna lub przypomnienia), aby uniknąć rozrostu podpowiedzi.

Przykład `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje też mały, ustrukturyzowany blok `tasks:` dla kontroli opartych na interwałach wewnątrz samego Heartbeat.

Przykład:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Zachowanie">
    - OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
    - Tylko zadania **do wykonania** są dołączane do podpowiedzi Heartbeat dla danego taktu.
    - Jeśli żadne zadania nie są do wykonania, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
    - Treść niezwiązana z zadaniami w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań do wykonania.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają normalne restarty.
    - Znaczniki czasu zadań są przesuwane dopiero po zakończeniu przez uruchomienie Heartbeat normalnej ścieżki odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to zwykły plik w obszarze roboczym agenta, więc możesz powiedzieć agentowi (w normalnym czacie) coś takiego:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiony na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać jawną linię w swojej podpowiedzi Heartbeat, np.: „Jeśli lista kontrolna stanie się nieaktualna, zaktualizuj HEARTBEAT.md lepszą wersją.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w `HEARTBEAT.md` — staje się on częścią kontekstu podpowiedzi.
</Warning>

## Ręczne obudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i wyzwolić natychmiastowy Heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne obudzenie natychmiast uruchamia każdy z tych Heartbeat agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie Heartbeat dostarczają tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat będą też dostarczać oddzielną wiadomość poprzedzoną `Reasoning:` (w takim samym kształcie jak `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/kodeksami i chcesz zobaczyć, dlaczego zdecydował się do ciebie odezwać — ale może też ujawnić więcej szczegółów wewnętrznych, niż chcesz. Preferuj pozostawienie tego wyłączonego w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100K tokenów do ~2-5K na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki startowe tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` mały.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Przepełnienie kontekstu po Heartbeat

Jeśli Heartbeat wcześniej pozostawił istniejącą sesję na mniejszym modelu lokalnym, na przykład modelu Ollama z oknem 32k, a następna tura głównej sesji zgłasza przepełnienie kontekstu, zresetuj model runtime sesji z powrotem do skonfigurowanego modelu podstawowego. Komunikat resetu OpenClaw wskazuje to, gdy ostatni model runtime pasuje do skonfigurowanego `heartbeat.model`.

Obecne Heartbeat zachowują istniejący model runtime współdzielonej sesji po zakończeniu uruchomienia. Nadal możesz użyć `isolatedSession: true`, aby uruchamiać Heartbeat w świeżej sesji, połączyć to z `lightContext: true` dla najmniejszej podpowiedzi albo wybrać model Heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest odłączona praca
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
