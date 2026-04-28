---
read_when:
    - Dostosowywanie częstotliwości lub komunikatów Heartbeat
    - Wybieranie między Heartbeat a Cron do zadań harmonogramowanych
sidebarTitle: Heartbeat
summary: Wiadomości odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat czy Cron?** Zobacz [Automatyzacja i zadania](/pl/automation), aby dowiedzieć się, kiedy używać którego rozwiązania.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł sygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, podagenci, izolowane zadania Cron).

Rozwiązywanie problemów: [Zadania harmonogramowane](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

<Steps>
  <Step title="Wybierz częstotliwość">
    Pozostaw Heartbeat włączone (domyślnie `30m`, albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz małą checklistę `HEARTBEAT.md` albo blok `tasks:` w workspace agenta.
  </Step>
  <Step title="Zdecyduj, dokąd mają trafiać wiadomości Heartbeat">
    `target: "none"` to ustawienie domyślne; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrojenie">
    - Włącz dostarczanie rozumowania Heartbeat dla większej przejrzystości.
    - Używaj lekkiego kontekstu bootstrap, jeśli uruchomienia Heartbeat potrzebują tylko `HEARTBEAT.md`.
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
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        directPolicy: "allow", // domyślnie: zezwalaj na cele direct/DM; ustaw "block", aby je wyciszyć
        lightContext: true, // opcjonalnie: wstrzykuj tylko HEARTBEAT.md z plików bootstrap
        isolatedSession: true, // opcjonalnie: nowa sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalnie: wysyłaj też osobną wiadomość `Reasoning:`
      },
    },
  },
}
```

## Wartości domyślne

- Interwał: `30m` (albo `1h`, gdy wykryty tryb uwierzytelniania to Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo per agent `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat są włączone dla domyślnego agenta, a uruchomienie jest wewnętrznie oznaczone.
- Gdy Heartbeat są wyłączone przez `0m`, zwykłe uruchomienia również pomijają `HEARTBEAT.md` w kontekście bootstrap, aby model nie widział instrukcji przeznaczonych tylko dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza tym oknem Heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Consider outstanding tasks” skłania agenta do przeglądu działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i sygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” skłania do okazjonalnej lekkiej wiadomości typu „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „check Gmail PubSub stats” albo „verify gateway health”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako ack, gdy pojawia się na **początku albo końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się **w środku** odpowiedzi, nie jest traktowane specjalnie.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza Heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i logowane; wiadomość zawierająca tylko `HEARTBEAT_OK` jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarczaj osobną wiadomość Reasoning:, gdy dostępna)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w nowej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <channel id> (rdzeń lub Plugin, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału dla wielu kont
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maksymalna liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` ustawia globalne zachowanie Heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli jakikolwiek agent ma blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślne reguły widoczności dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje domyślne ustawienia kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały wielokontowe) nadpisuje ustawienia per kanał.

### Heartbeat per agent

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**. Blok per agent scala się na wierzchu `agents.defaults.heartbeat` (więc możesz raz ustawić wspólne wartości domyślne i nadpisywać je per agent).

Przykład: dwóch agentów, tylko drugi agent uruchamia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
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
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcjonalnie; używa userTimezone, jeśli ustawiono, w przeciwnym razie strefy hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 albo po 22:00 czasu wschodniego) Heartbeat są pomijane. Następne zaplanowane tyknięcie wewnątrz okna zostanie wykonane normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby Heartbeat działały przez całą dobę, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia oknem czasowym; to zachowanie domyślne).
- Ustaw całodobowe okno: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj tego samego czasu `start` i `end` (na przykład `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc Heartbeat będą zawsze pomijane.
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
          to: "12345678:topic:42", // opcjonalnie: kieruj do konkretnego tematu/wątku
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

### Uwagi do pól

<ParamField path="every" type="string">
  Interwał Heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu dla uruchomień Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Gdy włączone, dostarcza także osobną wiadomość `Reasoning:`, gdy jest dostępna (ten sam kształt co `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy true, każdy Heartbeat działa w nowej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co Cron `sessionTarget: "isolated"`. Znacząco zmniejsza koszt tokenów na każde uruchomienie Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Trasowanie dostarczania nadal używa kontekstu głównej sesji.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiowany z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
  - Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
  - `last`: dostarczaj do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub identyfikator Pluginu, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
  - `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** go na zewnątrz.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania direct/DM. `allow`: zezwalaj na dostarczanie Heartbeat do direct/DM. `block`: wycisz dostarczanie direct/DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta ma zastosowanie do rozwiązanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozwiązanego kanału, dostarczanie jest pomijane.
</ParamField>
<ParamField path="prompt" type="string">
  Nadpisuje domyślną treść promptu (bez scalania).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z polami `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.

  - Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione, w przeciwnym razie wraca do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, wraca do zachowania `"user"` opisanego wyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako okno o zerowej szerokości (zawsze poza oknem).
  - Poza aktywnym oknem Heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Sesja i trasowanie celu">
    - Heartbeat domyślnie działają w głównej sesji agenta (`agent:<id>:<mainKey>`), albo `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać to na konkretną sesję kanału (Discord/WhatsApp/itd.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczanie jest kontrolowane przez `target` i `to`.
    - Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczanie Heartbeat domyślnie zezwala na cele direct/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, jednocześnie nadal uruchamiając turę Heartbeat.
    - Jeśli główna kolejka jest zajęta, Heartbeat jest pomijany i ponawiany później.
    - Jeśli `target` nie rozwiązuje się do żadnego zewnętrznego celu, uruchomienie nadal następuje, ale żadna wiadomość wychodząca nie jest wysyłana.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu należnych zadań, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
    - Jeśli rozwiązany cel Heartbeat obsługuje wskaźnik pisania, OpenClaw pokazuje pisanie, gdy uruchomienie Heartbeat jest aktywne. Używa to tego samego celu, do którego Heartbeat wysłałby wynik czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi zawierające wyłącznie Heartbeat **nie** utrzymują sesji przy życiu. Metadane Heartbeat mogą aktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej prawdziwej wiadomości użytkownika/kanału, a wygaśnięcie dzienne używa `sessionStartedAt`.
    - Control UI i historia WebChat ukrywają prompty Heartbeat oraz potwierdzenia zawierające tylko OK. Bazowy transkrypt sesji nadal może zawierać te tury na potrzeby audytu/odtwarzania.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą kolejkować zdarzenie systemowe i wybudzać Heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrola widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treść alertów jest dostarczana. Możesz to dostosować per kanał albo per konto:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj wiadomości alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK w Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Pierwszeństwo: per konto → per kanał → domyślne kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady per kanał vs per konto

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # wszystkie konta Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # wycisz alerty tylko dla konta ops
  telegram:
    heartbeat:
      showOk: true
```

### Typowe wzorce

| Cel                                      | Konfiguracja                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                |
| Całkowicie ciche (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalnie)

Jeśli w workspace istnieje plik `HEARTBEAT.md`, domyślny prompt mówi agentowi, aby go przeczytał. Traktuj go jako swoją „checklistę Heartbeat”: małą, stabilną i bezpieczną do dołączania co 30 minut.

Przy zwykłych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie częstotliwości Heartbeat przez `0m` albo ustawienie `includeSystemPromptSection: false` pomija go w zwykłym kontekście bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki Markdown jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API. Takie pominięcie jest raportowane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal się uruchamia, a model sam decyduje, co zrobić.

Utrzymuj go w małej formie (krótka checklista albo przypomnienia), aby uniknąć rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Checklista Heartbeat

- Szybki przegląd: czy w skrzynkach odbiorczych jest coś pilnego?
- Jeśli jest dzień, wykonaj lekki check-in, jeśli nic innego nie oczekuje.
- Jeśli zadanie jest zablokowane, zapisz _czego brakuje_ i zapytaj Petera następnym razem.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje też mały strukturalny blok `tasks:` do sprawdzeń opartych na interwałach w samym Heartbeat.

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
    - OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem własnego `interval`.
    - Tylko zadania **należne** są uwzględniane w promptcie Heartbeat dla danego tyknięcia.
    - Jeśli żadne zadania nie są należne, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zbędnego wywołania modelu.
    - Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście należnych zadań.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
    - Znaczniki czasu zadań są przesuwane dopiero po tym, jak uruchomienie Heartbeat zakończy normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym tyknięciu.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to po prostu zwykły plik w workspace agenta, więc możesz powiedzieć agentowi (w zwykłym czacie) coś w rodzaju:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienne sprawdzanie kalendarza.”
- „Przepisz `HEARTBEAT.md`, żeby był krótszy i skupiał się na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać jawny wiersz w promptcie Heartbeat, np.: „If the checklist becomes stale, update HEARTBEAT.md with a better one.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w `HEARTBEAT.md` — staje się częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Możesz zakolejkować zdarzenie systemowe i wywołać natychmiastowy Heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowane `heartbeat`, ręczne wybudzenie natychmiast uruchamia Heartbeat każdego z tych agentów.

Użyj `--mode next-heartbeat`, aby zaczekać do następnego zaplanowanego tyknięcia.

## Dostarczanie rozumowania (opcjonalnie)

Domyślnie Heartbeat dostarcza tylko końcowy ładunek „answer”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat będzie również dostarczać osobną wiadomość z prefiksem `Reasoning:` (ten sam kształt co `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się Cię pingnąć — ale może też ujawnić więcej szczegółów wewnętrznych, niż chcesz. W czatach grupowych lepiej pozostawić to wyłączone.

## Świadomość kosztów

Heartbeat uruchamia pełne tury agenta. Krótsze interwały spalają więcej tokenów. Aby obniżyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100 tys. tokenów do ~2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` w małej formie.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest odłączona praca
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na harmonogram Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
