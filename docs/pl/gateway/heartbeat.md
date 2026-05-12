---
read_when:
    - Dostosowywanie częstotliwości Heartbeat lub komunikatów
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy cron?** Zobacz [Automatyzacja](/pl/automation), aby uzyskać wskazówki, kiedy używać każdego z nich.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w sesji głównej, aby model mógł sygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura w sesji głównej — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, podagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (początkujący)

<Steps>
  <Step title="Wybierz rytm">
    Pozostaw włączone heartbeaty (domyślnie `30m` albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) lub ustaw własny rytm.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz małą listę kontrolną `HEARTBEAT.md` albo blok `tasks:` w obszarze roboczym agenta.
  </Step>
  <Step title="Zdecyduj, dokąd mają trafiać wiadomości heartbeat">
    `target: "none"` jest ustawieniem domyślnym; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrajanie">
    - Włącz dostarczanie rozumowania heartbeat dla przejrzystości.
    - Użyj lekkiego kontekstu startowego, jeśli uruchomienia heartbeat potrzebują tylko `HEARTBEAT.md`.
    - Włącz izolowane sesje, aby uniknąć wysyłania pełnej historii rozmowy przy każdym heartbeat.
    - Ogranicz heartbeaty do godzin aktywności (czasu lokalnego).

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Domyślne ustawienia

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo `agents.list[].heartbeat.every` dla agenta; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy heartbeaty są włączone dla domyślnego agenta, a uruchomienie jest oznaczone wewnętrznie.
- Gdy heartbeaty są wyłączone przez `0m`, zwykłe uruchomienia pomijają także `HEARTBEAT.md` w kontekście startowym, aby model nie widział instrukcji przeznaczonych tylko dla heartbeat.
- Godziny aktywności (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza oknem heartbeaty są pomijane do następnego taktu wewnątrz okna.
- Heartbeaty automatycznie odraczają się, gdy praca cron jest aktywna lub w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby również odraczać agenta przy jego własnym podagencie z kluczem sesji lub zagnieżdżonych ścieżkach poleceń; agenci równorzędni nie są już wstrzymywani tylko dlatego, że inny agent ma trwającą pracę podagenta.

## Do czego służy prompt heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Consider outstanding tasks” zachęca agenta do przejrzenia dalszych działań (skrzynka odbiorcza, kalendarz, przypomnienia, praca w kolejce) i zasygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” zachęca do okazjonalnej, lekkiej wiadomości „czy czegoś potrzebujesz?”, ale unika nocnego spamu, używając skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj kondycję Gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na niestandardową treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia heartbeat obsługujące narzędzia mogą zamiast tego wywołać `heartbeat_respond` z `notify: false` dla braku widocznej aktualizacji albo `notify: true` plus `notificationText` dla alertu. Jeśli występuje, strukturalna odpowiedź narzędzia ma pierwszeństwo przed tekstowym wariantem awaryjnym.
- Podczas uruchomień heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się w **środku** odpowiedzi, nie jest traktowane specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza heartbeatami zbłąkane `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i logowane; wiadomość składająca się tylko z `HEARTBEAT_OK` jest odrzucana.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `agents.defaults.heartbeat` ustawia globalne zachowanie heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli dowolny agent ma blok `heartbeat`, heartbeaty uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` zastępuje domyślne ustawienia kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały wielokontowe) zastępuje ustawienia dla kanału.

### Heartbeaty dla agenta

Jeśli dowolny wpis `agents.list[]` zawiera blok `heartbeat`, heartbeaty uruchamiają **tylko ci agenci**. Blok dla agenta scala się na wierzchu `agents.defaults.heartbeat` (dzięki czemu możesz raz ustawić wspólne ustawienia domyślne i nadpisywać je dla poszczególnych agentów).

Przykład: dwóch agentów, tylko drugi agent uruchamia heartbeaty.

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

Ogranicz heartbeaty do godzin pracy w konkretnej strefie czasowej:

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

Poza tym oknem (przed 9:00 lub po 22:00 czasu wschodniego) heartbeaty są pomijane. Następny zaplanowany takt wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby heartbeaty działały cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia oknem czasowym; to zachowanie domyślne).
- Ustaw okno całodniowe: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj tego samego czasu `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc heartbeaty są zawsze pomijane.
</Warning>

### Przykład wielu kont

Użyj `accountId`, aby wskazać konkretne konto w kanałach wielokontowych, takich jak Telegram:

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
  Interwał heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu dla uruchomień heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Gdy włączone, dostarcza także osobną wiadomość `Reasoning:`, gdy jest dostępna (taki sam kształt jak `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy ma wartość true, uruchomienia heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy ma wartość true, każdy heartbeat uruchamia się w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Dramatycznie zmniejsza koszt tokenów dla każdego heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu sesji głównej.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Gdy ma wartość true, uruchomienia heartbeat odraczają się na dodatkowych zajętych ścieżkach tego agenta: jego własnym podagencie z kluczem sesji lub zagnieżdżonej pracy poleceń. Ścieżki cron zawsze odraczają heartbeaty, nawet bez tej flagi, więc hosty modeli lokalnych nie uruchamiają promptów cron i heartbeat jednocześnie.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień heartbeat.

- `main` (domyślnie): sesja główna agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
- Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcz do ostatnio używanego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał albo identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
- `none` (domyślnie): uruchom heartbeat, ale **nie dostarczaj** na zewnątrz.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania bezpośredniego/DM. `allow`: zezwól na bezpośrednie/DM dostarczanie heartbeat. `block`: wycisz bezpośrednie/DM dostarczanie (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). W przypadku tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta stosuje się do rozwiązanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczenie jest pomijane.

</ParamField>
<ParamField path="prompt" type="string">
  Zastępuje domyślną treść promptu (bez scalania).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy ma wartość true, pomija ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z polami `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.

- Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli ustawiono, w przeciwnym razie wraca do strefy czasowej systemu hosta.
- `"local"`: zawsze używa strefy czasowej systemu hosta.
- Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` powyżej.
- `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
- Poza aktywnym oknem Heartbeat są pomijane do następnego taktu wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Sesja i routing celu">
    - Heartbeat domyślnie uruchamiają się w głównej sesji agenta (`agent:<id>:<mainKey>`) albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby zastąpić to konkretną sesją kanału (Discord/WhatsApp/itd.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
    - Aby dostarczyć do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczenie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia Heartbeat domyślnie pozwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby pominąć wysyłki do celów bezpośrednich, nadal wykonując turę Heartbeat.
    - Jeśli główna kolejka, tor sesji docelowej, tor Cron albo aktywne zadanie Cron są zajęte, Heartbeat jest pomijany i ponawiany później.
    - Jeśli `skipWhenBusy: true`, podagent tej sesji agenta kluczowany sesją oraz zagnieżdżone tory także odraczają uruchomienia Heartbeat. Zajęte tory innych agentów nie odraczają tego agenta.
    - Jeśli `target` nie rozwiąże się do żadnego zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale nie jest wysyłana żadna wiadomość wychodząca.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu zadań do wykonania, przywrócić znacznik bezczynności sesji i pominąć zewnętrzny ładunek alertu.
    - Jeśli rozpoznany cel Heartbeat obsługuje pisanie, OpenClaw pokazuje pisanie, gdy uruchomienie Heartbeat jest aktywne. Używa to tego samego celu, do którego Heartbeat wysłałby wynik czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie Heartbeat **nie** utrzymują sesji przy życiu. Metadane Heartbeat mogą aktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej prawdziwej wiadomości użytkownika/kanału, a wygaśnięcie dzienne używa `sessionStartedAt`.
    - Interfejs sterowania i historia WebChat ukrywają prompty Heartbeat oraz potwierdzenia zawierające tylko OK. Bazowy transkrypt sesji nadal może zawierać te tury na potrzeby audytu/odtwarzania.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i wybudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrolki widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są pomijane, a treść alertów jest dostarczana. Możesz dostosować to dla kanału lub konta:

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

Priorytet: na konto → na kanał → domyślne ustawienia kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

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

| Cel                                             | Konfiguracja                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                     |
| Całkowicie cicho (bez wiadomości i wskaźnika)  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)                | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                       | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli w przestrzeni roboczej istnieje plik `HEARTBEAT.md`, domyślny prompt każe agentowi go przeczytać. Traktuj go jak swoją „listę kontrolną Heartbeat”: małą, stabilną i bezpieczną do dołączania co 30 minut.

Przy normalnych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie rytmu Heartbeat za pomocą `0m` albo ustawienie `includeSystemPromptSection: false` pomija go w normalnym kontekście startowym.

Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (tylko puste wiersze i nagłówki Markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API. To pominięcie jest raportowane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal się uruchamia, a model decyduje, co zrobić.

Utrzymuj go bardzo małym (krótka lista kontrolna lub przypomnienia), aby uniknąć rozdęcia promptu.

Przykład `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje też mały ustrukturyzowany blok `tasks:` dla kontroli opartych na interwałach wewnątrz samego Heartbeat.

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
    - Do promptu Heartbeat dla danego taktu są dołączane tylko zadania **do wykonania**.
    - Jeśli żadne zadania nie są do wykonania, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
    - Treść niezwiązana z zadaniami w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań do wykonania.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają normalne restarty.
    - Znaczniki czasu zadań są przesuwane dopiero po tym, jak uruchomienie Heartbeat zakończy normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to zwykły plik w przestrzeni roboczej agenta, więc możesz powiedzieć agentowi (w normalnym czacie) na przykład:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, żeby był krótszy i skupiał się na follow-upach w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dołączyć w prompcie Heartbeat jawny wiersz, taki jak: „Jeśli lista kontrolna się zdezaktualizuje, zaktualizuj HEARTBEAT.md lepszą wersją.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonu, prywatnych tokenów) w `HEARTBEAT.md` — staje się on częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i wyzwolić natychmiastowy Heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie uruchamia natychmiast każdy z tych Heartbeat agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie Heartbeat dostarczają tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat będą także dostarczać osobną wiadomość z prefiksem `Reasoning:` (ten sam kształt co `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/kodexami i chcesz zobaczyć, dlaczego zdecydował się do Ciebie odezwać — ale może też ujawnić więcej wewnętrznych szczegółów, niż chcesz. W czatach grupowych lepiej pozostawić to wyłączone.

## Świadomość kosztów

Heartbeat uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100K tokenów do ~2-5K na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki startowe tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` mały.
- Użyj `target: "none"`, jeśli chcesz tylko aktualizacji stanu wewnętrznego.

## Przepełnienie kontekstu po Heartbeat

Jeśli Heartbeat wcześniej pozostawił istniejącą sesję na mniejszym modelu lokalnym, na przykład modelu Ollama z oknem 32k, a następna tura głównej sesji zgłasza przepełnienie kontekstu, zresetuj model wykonawczy sesji z powrotem do skonfigurowanego modelu głównego. Komunikat resetu OpenClaw wskazuje to, gdy ostatni model wykonawczy pasuje do skonfigurowanego `heartbeat.model`.

Obecne Heartbeat zachowują istniejący model wykonawczy współdzielonej sesji po zakończeniu uruchomienia. Nadal możesz użyć `isolatedSession: true`, aby uruchamiać Heartbeat w świeżej sesji, połączyć to z `lightContext: true` dla najmniejszego promptu albo wybrać model Heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest odłączona praca
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
