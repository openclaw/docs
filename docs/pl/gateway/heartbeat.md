---
read_when:
    - Dostosowywanie częstotliwości heartbeat lub komunikacji
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy Cron?** Zobacz [Automatyzacja i zadania](/pl/automation), aby dowiedzieć się, kiedy używać którego z nich.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł sygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadania w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, subagenty, izolowane zadania Cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

<Steps>
  <Step title="Wybierz częstotliwość">
    Pozostaw Heartbeat włączony (domyślnie `30m` albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz krótką listę kontrolną `HEARTBEAT.md` albo blok `tasks:` w obszarze roboczym agenta.
  </Step>
  <Step title="Zdecyduj, dokąd mają trafiać wiadomości Heartbeat">
    `target: "none"` jest wartością domyślną; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrajanie">
    - Włącz dostarczanie rozumowania Heartbeat dla przejrzystości.
    - Użyj lekkiego kontekstu startowego, jeśli uruchomienia Heartbeat potrzebują tylko `HEARTBEAT.md`.
    - Włącz izolowane sesje, aby unikać wysyłania pełnej historii rozmowy przy każdym Heartbeat.
    - Ogranicz Heartbeat do aktywnych godzin (czasu lokalnego).

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
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat jest włączony dla domyślnego agenta, a uruchomienie jest oznaczane wewnętrznie.
- Gdy Heartbeat jest wyłączony za pomocą `0m`, normalne uruchomienia pomijają także `HEARTBEAT.md` w kontekście startowym, aby model nie widział instrukcji przeznaczonych wyłącznie dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza tym oknem Heartbeat jest pomijany do następnego taktu przypadającego w oknie.
- Heartbeat automatycznie odracza działanie, gdy praca Cron jest aktywna lub w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby odraczać także przy dodatkowo zajętych ścieżkach (praca subagenta lub zagnieżdżonych poleceń); jest to przydatne dla lokalnego Ollama i innych ograniczonych hostów z jednym środowiskiem uruchomieniowym.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Consider outstanding tasks” zachęca agenta do przeglądu spraw do wykonania (skrzynka odbiorcza, kalendarz, przypomnienia, praca w kolejce) i sygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” zachęca do okazjonalnej, lekkiej wiadomości w stylu „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj kondycję gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na niestandardową treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia Heartbeat obsługujące narzędzia mogą zamiast tego wywołać `heartbeat_respond` z `notify: false`, aby nie pokazywać widocznej aktualizacji, albo `notify: true` oraz `notificationText`, aby wysłać alert. Gdy jest obecna, ustrukturyzowana odpowiedź narzędzia ma pierwszeństwo przed tekstową rezerwą.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się w **środku** odpowiedzi, nie jest traktowane specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza Heartbeat zabłąkane `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i logowane; wiadomość zawierająca wyłącznie `HEARTBEAT_OK` jest odrzucana.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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
- `agents.list[].heartbeat` jest scalane na wierzchu; jeśli którykolwiek agent ma blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje ustawienia domyślne kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) nadpisuje ustawienia dla kanału.

### Heartbeat dla poszczególnych agentów

Jeśli dowolny wpis `agents.list[]` zawiera blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat. Blok dla konkretnego agenta jest scalany na wierzchu `agents.defaults.heartbeat` (dzięki temu możesz raz ustawić wspólne wartości domyślne i nadpisywać je dla poszczególnych agentów).

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

### Przykład godzin aktywności

Ogranicz Heartbeat do godzin pracy w konkretnej strefie czasowej:

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

Poza tym przedziałem (przed 9:00 lub po 22:00 czasu wschodniego) Heartbeat jest pomijany. Następne zaplanowane uruchomienie w tym przedziale odbędzie się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby Heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia do okna czasowego; jest to zachowanie domyślne).
- Ustaw okno obejmujące cały dzień: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj tego samego czasu `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc uruchomienia Heartbeat są zawsze pomijane.
</Warning>

### Przykład wielu kont

Użyj `accountId`, aby wskazać konkretne konto w kanałach obsługujących wiele kont, takich jak Telegram:

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

### Uwagi dotyczące pól

<ParamField path="every" type="string">
  Interwał Heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne zastąpienie modelu dla uruchomień Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Po włączeniu dostarcza także oddzielną wiadomość `Reasoning:`, gdy jest dostępna (w takim samym kształcie jak `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap obszaru roboczego.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy ma wartość true, każde uruchomienie Heartbeat działa w świeżej sesji bez wcześniejszej historii konwersacji. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Znacznie zmniejsza koszt tokenów na pojedyncze uruchomienie Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu głównej sesji.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Gdy ma wartość true, uruchomienia Heartbeat są odraczane także na dodatkowo zajętych torach: pracy subagenta lub zagnieżdżonych poleceń. Tory Cron zawsze odraczają Heartbeat, nawet bez tej flagi, więc hosty modeli lokalnych nie uruchamiają promptów Cron i Heartbeat w tym samym czasie.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

- `main` (domyślnie): główna sesja agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` lub z [CLI sesji](/pl/cli/sessions)).
- Formaty klucza sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcz do ostatnio użytego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał lub identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
- `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** go zewnętrznie.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania bezpośredniego/DM. `allow`: zezwalaj na bezpośrednie/DM dostarczanie Heartbeat. `block`: wycisz bezpośrednie/DM dostarczanie (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne zastąpienie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów obsługujących wiele kont. Gdy `target: "last"`, identyfikator konta stosuje się do rozwiązanego ostatniego kanału, jeśli obsługuje on konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczenie jest pomijane.

</ParamField>
<ParamField path="prompt" type="string">
  Zastępuje domyślną treść promptu (bez scalania).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy ma wartość true, tłumi ładunki ostrzeżeń o błędach narzędzi podczas przebiegów heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza przebiegi heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` jako początku dnia), `end` (HH:MM wyłącznie; `24:00` dozwolone jako koniec dnia) oraz opcjonalnym `timezone`.

- Pominięte albo `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
- `"local"`: zawsze używa strefy czasowej systemu hosta.
- Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` opisanego wyżej.
- `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako okno o zerowej szerokości (zawsze poza oknem).
- Poza aktywnym oknem heartbeat są pomijane do następnego taktu wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Routing sesji i celu">
    - Heartbeat domyślnie działa w głównej sesji agenta (`agent:<id>:<mainKey>`) albo `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać to konkretną sesją kanału (Discord/WhatsApp/itd.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczanie jest kontrolowane przez `target` i `to`.
    - Aby dostarczyć do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia heartbeat domyślnie zezwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, nadal wykonując turę heartbeat.
    - Jeśli główna kolejka, pas sesji docelowej, pas cron albo aktywne zadanie cron jest zajęte, heartbeat jest pomijany i ponawiany później.
    - Jeśli `skipWhenBusy: true`, pasy subagentów i zagnieżdżone również odraczają przebiegi heartbeat.
    - Jeśli `target` nie rozwiąże się do żadnego zewnętrznego miejsca docelowego, przebieg nadal się odbywa, ale nie jest wysyłana żadna wiadomość wychodząca.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, przebieg jest pomijany z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić heartbeat, zaktualizować znaczniki czasu zadań do wykonania, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
    - Jeśli rozpoznany cel heartbeat obsługuje pisanie, OpenClaw pokazuje pisanie, gdy przebieg heartbeat jest aktywny. Używa to tego samego celu, do którego heartbeat wysłałby wyjście czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie heartbeat **nie** utrzymują sesji przy życiu. Metadane heartbeat mogą zaktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej prawdziwej wiadomości użytkownika/kanału, a dzienne wygaśnięcie używa `sessionStartedAt`.
    - Historia Control UI i WebChat ukrywa prompty heartbeat oraz potwierdzenia wyłącznie OK. Podstawowy transkrypt sesji nadal może zawierać te tury do audytu/odtworzenia.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą zakolejkować zdarzenie systemowe i wybudzić heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że przebieg heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrole widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są tłumione, a treść alertu jest dostarczana. Możesz dostosować to dla kanału lub konta:

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

Pierwszeństwo: dla konta → dla kanału → domyślne wartości kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija przebieg heartbeat (brak wywołania modelu).

### Przykłady dla kanału i dla konta

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

| Cel                                      | Konfiguracja                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                      |
| Całkowicie cicho (brak wiadomości, brak wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (brak wiadomości)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli plik `HEARTBEAT.md` istnieje w obszarze roboczym, domyślny prompt mówi agentowi, aby go przeczytał. Traktuj go jako swoją „checklistę heartbeat”: małą, stabilną i bezpieczną do dołączania co 30 minut.

W normalnych przebiegach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki heartbeat są włączone dla domyślnego agenta. Wyłączenie rytmu heartbeat za pomocą `0m` albo ustawienie `includeSystemPromptSection: false` pomija go w normalnym kontekście startowym.

Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (zawiera tylko puste wiersze i nagłówki markdown, takie jak `# Heading`), OpenClaw pomija przebieg heartbeat, aby oszczędzić wywołania API. To pominięcie jest zgłaszane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

Utrzymuj go bardzo małym (krótka checklista lub przypomnienia), aby uniknąć rozrostu promptu.

Przykład `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały ustrukturyzowany blok `tasks:` dla kontroli opartych na interwałach wewnątrz samego heartbeat.

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
    - OpenClaw parsuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
    - W prompcie heartbeat dla danego taktu uwzględniane są tylko zadania **do wykonania**.
    - Jeśli żadne zadania nie są do wykonania, heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
    - Treść niezwiązana z zadaniami w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań do wykonania.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają normalne restarty.
    - Znaczniki czasu zadań są przesuwane dopiero po zakończeniu przez przebieg heartbeat normalnej ścieżki odpowiedzi. Pominięte przebiegi `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie w każdym takcie.

### Czy agent może zaktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` jest zwykłym plikiem w obszarze roboczym agenta, więc możesz powiedzieć agentowi (w normalnym czacie) coś takiego:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać dzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiony na follow-upach ze skrzynki odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dołączyć wprost linię w swoim prompcie heartbeat, taką jak: „Jeśli checklista się zdezaktualizuje, zaktualizuj HEARTBEAT.md lepszą wersją.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w `HEARTBEAT.md` — staje się on częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Możesz zakolejkować zdarzenie systemowe i wyzwolić natychmiastowy heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli skonfigurowano `heartbeat` dla wielu agentów, ręczne wybudzenie natychmiast uruchamia heartbeat każdego z tych agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie heartbeat dostarcza tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu heartbeat dostarczy także osobną wiadomość z prefiksem `Reasoning:` (w tym samym kształcie co `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się do Ciebie odezwać — ale może też ujawnić więcej wewnętrznych szczegółów, niż chcesz. Lepiej pozostawić to wyłączone w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (z ~100 tys. tokenów do ~2-5 tys. na przebieg).
- Użyj `lightContext: true`, aby ograniczyć pliki startowe tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` mały.
- Użyj `target: "none"`, jeśli chcesz tylko aktualizacji stanu wewnętrznego.

## Przepełnienie kontekstu po heartbeat

Jeśli heartbeat wcześniej pozostawił istniejącą sesję na mniejszym modelu lokalnym, na przykład modelu Ollama z oknem 32k, a następna tura głównej sesji zgłasza przepełnienie kontekstu, zresetuj model runtime sesji z powrotem do skonfigurowanego modelu podstawowego. Komunikat resetu OpenClaw wskazuje to, gdy ostatni model runtime pasuje do skonfigurowanego `heartbeat.model`.

Obecne heartbeat zachowują istniejący model runtime współdzielonej sesji po zakończeniu przebiegu. Nadal możesz użyć `isolatedSession: true`, aby uruchamiać heartbeat w świeżej sesji, połączyć to z `lightContext: true` dla najmniejszego promptu albo wybrać model heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest odłączona praca
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
