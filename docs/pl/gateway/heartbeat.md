---
read_when:
    - Dostosowywanie kadencji Heartbeat lub komunikatów
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty sondowania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:33:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy cron?** Zobacz [Automatyzacja](/pl/automation), aby uzyskać wskazówki, kiedy używać każdego z nich.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł wskazać wszystko, co wymaga uwagi, bez zalewania Cię wiadomościami.

Heartbeat to zaplanowana tura w głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone do pracy odłączonej (uruchomienia ACP, podagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (początkujący)

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Wartości domyślne

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Limit czasu: tury Heartbeat bez ustawionej wartości używają `agents.defaults.timeoutSeconds`, jeśli jest ustawione. W przeciwnym razie używają częstotliwości Heartbeat ograniczonej do 600 sekund. Ustaw `agents.defaults.heartbeat.timeoutSeconds` albo `agents.list[].heartbeat.timeoutSeconds` dla dłuższej pracy Heartbeat.
- Prompt Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat jest włączony dla domyślnego agenta, a uruchomienie jest oznaczane wewnętrznie.
- Gdy Heartbeat jest wyłączony przez `0m`, zwykłe uruchomienia pomijają także `HEARTBEAT.md` w kontekście startowym, aby model nie widział instrukcji przeznaczonych tylko dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza oknem Heartbeat jest pomijany do następnego tyknięcia wewnątrz okna.
- Heartbeat automatycznie odkłada działanie, gdy praca cron jest aktywna albo w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby dodatkowo odkładać agenta przy jego własnych torach podagentów powiązanych kluczem sesji albo zagnieżdżonych poleceń; agenci równorzędni nie są już wstrzymywani tylko dlatego, że inny agent ma trwającą pracę podagenta.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Rozważ zaległe zadania” zachęca agenta do przejrzenia dalszych działań (skrzynka odbiorcza, kalendarz, przypomnienia, praca w kolejce) i wskazania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Sprawdzaj czasem swojego człowieka w ciągu dnia” zachęca do okazjonalnej, lekkiej wiadomości „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj stan Gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na niestandardową treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia Heartbeat z obsługą narzędzi mogą zamiast tego wywołać `heartbeat_respond` z `notify: false` dla braku widocznej aktualizacji albo `notify: true` oraz `notificationText` dla alertu. Gdy jest obecna, odpowiedź strukturalna narzędzia ma pierwszeństwo przed tekstową ścieżką awaryjną.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku albo końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się w **środku** odpowiedzi, nie jest traktowany specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć wyłącznie tekst alertu.

Poza Heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i logowane; wiadomość zawierająca tylko `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

- `agents.defaults.heartbeat` ustawia globalne zachowanie Heartbeat.
- `agents.list[].heartbeat` jest scalane na wierzchu; jeśli którykolwiek agent ma blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` zastępuje wartości domyślne kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) zastępuje ustawienia dla kanału.

### Heartbeat dla poszczególnych agentów

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat. Blok dla agenta jest scalany na wierzchu `agents.defaults.heartbeat` (dzięki czemu możesz raz ustawić wspólne wartości domyślne i nadpisywać je per agent).

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

Poza tym oknem (przed 9:00 albo po 22:00 czasu wschodniego) Heartbeat jest pomijany. Następne zaplanowane tyknięcie wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby Heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia oknem czasowym; to zachowanie domyślne).
- Ustaw okno całodniowe: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj takiego samego czasu `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc Heartbeat jest zawsze pomijany.
</Warning>

### Przykład wielu kont

Użyj `accountId`, aby wskazać konkretne konto w kanałach z wieloma kontami, takich jak Telegram:

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
  Gdy włączone, dostarcza także osobną wiadomość `Thinking`, jeśli jest dostępna (ten sam kształt co `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy ustawione na true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy ustawione na true, każdy Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Znacząco zmniejsza koszt tokenów na każdy Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Kierowanie dostarczania nadal używa kontekstu głównej sesji.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Gdy ustawione na true, uruchomienia Heartbeat odkładają się przy dodatkowych zajętych torach tego agenta: jego własnej pracy podagenta powiązanej kluczem sesji albo pracy zagnieżdżonych poleceń. Tory cron zawsze odkładają Heartbeat, nawet bez tej flagi, więc hosty modeli lokalnych nie uruchamiają promptów cron i Heartbeat jednocześnie.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

- `main` (domyślnie): główna sesja agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
- Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcz do ostatnio używanego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał albo identyfikator Plugin, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
- `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** go zewnętrznie.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania bezpośredniego/DM. `allow`: zezwalaj na bezpośrednie/DM dostarczanie Heartbeat. `block`: wstrzymaj bezpośrednie/DM dostarczanie (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów z wieloma kontami. Gdy `target: "last"`, identyfikator konta dotyczy rozpoznanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozpoznanego kanału, dostarczenie jest pomijane.

</ParamField>
<ParamField path="prompt" type="string">
  Zastępuje domyślną treść promptu (bez scalania).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy wartość to true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maksymalna liczba sekund dozwolona na turę agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`, gdy jest ustawione; w przeciwnym razie używana jest częstotliwość Heartbeat ograniczona do 600 sekund.

</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.

- Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione; w przeciwnym razie wraca do strefy czasowej systemu hosta.
- `"local"`: zawsze używa strefy czasowej systemu hosta.
- Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` opisanego powyżej.
- `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako okno o zerowej szerokości (zawsze poza oknem).
- Poza aktywnym oknem Heartbeaty są pomijane do następnego taktu wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Routing sesji i celu">
    - Heartbeaty domyślnie działają w głównej sesji agenta (`agent:<id>:<mainKey>`) albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby zastąpić to konkretną sesją kanału (Discord/WhatsApp/itp.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
    - Aby dostarczyć do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia Heartbeat domyślnie pozwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, nadal uruchamiając turę Heartbeat.
    - Jeśli główna kolejka, linia sesji docelowej, linia Cron lub aktywne zadanie Cron jest zajęte, Heartbeat jest pomijany i ponawiany później.
    - Jeśli `skipWhenBusy: true`, podagent tej sesji agenta kluczowany sesją oraz zagnieżdżone linie także odraczają uruchomienia Heartbeat. Zajęte linie innych agentów nie odraczają tego agenta.
    - Jeśli `target` nie rozpozna żadnego zewnętrznego miejsca docelowego, uruchomienie nadal się odbywa, ale nie jest wysyłana żadna wiadomość wychodząca.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu zadań do wykonania, przywrócić znacznik bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
    - Jeśli rozpoznany cel Heartbeat obsługuje sygnalizowanie pisania, OpenClaw pokazuje pisanie, gdy uruchomienie Heartbeat jest aktywne. Używa to tego samego celu, do którego Heartbeat wysłałby wynik czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie Heartbeat **nie** utrzymują sesji przy życiu. Metadane Heartbeat mogą zaktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej prawdziwej wiadomości użytkownika/kanału, a wygaśnięcie dzienne używa `sessionStartedAt`.
    - Historia Control UI i WebChat ukrywa prompty Heartbeat oraz potwierdzenia zawierające tylko OK. Bazowy transkrypt sesji nadal może zawierać te tury do audytu/odtworzenia.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i obudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrole widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treść alertu jest dostarczana. Możesz dostosować to dla kanału lub konta:

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

Pierwszeństwo: ustawienia konta → ustawienia kanału → domyślne ustawienia kanałów → wbudowane ustawienia domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw pomija całe uruchomienie Heartbeat (bez wywołania modelu).

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
| Domyślne zachowanie (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                      |
| Pełna cisza (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli w obszarze roboczym istnieje plik `HEARTBEAT.md`, domyślny prompt mówi agentowi, aby go przeczytał. Traktuj go jak swoją „listę kontrolną Heartbeat”: małą, stabilną i bezpieczną do uwzględniania co 30 minut.

Podczas normalnych uruchomień `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie częstotliwości Heartbeat za pomocą `0m` lub ustawienie `includeSystemPromptSection: false` pomija go w normalnym kontekście bootstrap.

W natywnym harness Codex treść `HEARTBEAT.md` nie jest wstrzykiwana do tury. Jeśli plik istnieje i zawiera treść inną niż białe znaki, instrukcje trybu współpracy Heartbeat wskazują Codexowi plik i każą go przeczytać przed kontynuacją.

Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (tylko puste wiersze, komentarze Markdown/HTML, nagłówki Markdown takie jak `# Heading`, znaczniki bloków kodu lub puste szkielety listy kontrolnej), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API. To pominięcie jest raportowane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

Utrzymuj go bardzo małym (krótka lista kontrolna lub przypomnienia), aby uniknąć rozrostu promptu.

Przykład `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały strukturalny blok `tasks:` do kontroli opartych na interwałach wewnątrz samego Heartbeat.

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
    - Tylko zadania **do wykonania** są uwzględniane w prompcie Heartbeat dla danego taktu.
    - Jeśli żadne zadania nie są do wykonania, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
    - Treść niezwiązana z zadaniami w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań do wykonania.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają normalne restarty.
    - Znaczniki czasu zadań są przesuwane tylko po tym, jak uruchomienie Heartbeat zakończy swoją normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to zwykły plik w obszarze roboczym agenta, więc możesz powiedzieć agentowi (w normalnym czacie) coś takiego:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, żeby był krótszy i skupiony na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać wyraźną linię w swoim prompcie Heartbeat, na przykład: „Jeśli lista kontrolna się zestarzeje, zaktualizuj HEARTBEAT.md lepszą wersją.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w `HEARTBEAT.md` — staje się on częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i wywołać natychmiastowy Heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia Heartbeat każdego z tych agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie Heartbeaty dostarczają tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeaty dostarczą także osobną wiadomość z prefiksem `Thinking` (ten sam kształt co `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/kodeksami i chcesz zobaczyć, dlaczego zdecydował się do ciebie odezwać — ale może też ujawnić więcej szczegółów wewnętrznych, niż chcesz. W czatach grupowych lepiej pozostawić to wyłączone.

## Świadomość kosztów

Heartbeaty uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby ograniczyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100 tys. tokenów do ~2-5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` mały.
- Użyj `target: "none"`, jeśli chcesz tylko aktualizacji stanu wewnętrznego.

## Przepełnienie kontekstu po Heartbeat

Jeśli Heartbeat wcześniej zostawił istniejącą sesję na mniejszym modelu lokalnym, na przykład modelu Ollama z oknem 32k, a następna tura głównej sesji zgłasza przepełnienie kontekstu, zresetuj model runtime sesji z powrotem do skonfigurowanego modelu głównego. Komunikat resetu OpenClaw wskazuje to, gdy ostatni model runtime pasuje do skonfigurowanego `heartbeat.model`.

Obecne Heartbeaty zachowują istniejący model runtime współdzielonej sesji po zakończeniu uruchomienia. Nadal możesz użyć `isolatedSession: true`, aby uruchamiać Heartbeaty w świeżej sesji, połączyć to z `lightContext: true` dla najmniejszego promptu albo wybrać model Heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na harmonogram Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
