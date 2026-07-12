---
read_when:
    - Dostosowywanie częstotliwości lub komunikatów Heartbeat
    - Wybór między Heartbeat a Cron do zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T15:04:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy Cron?** Wskazówki dotyczące wyboru znajdziesz w sekcji [Automatyzacja](/pl/automation).
</Note>

Heartbeat uruchamia **okresowe tury agenta** w sesji głównej, dzięki czemu model może zgłaszać wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat jest zaplanowaną turą sesji głównej — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks). Rekordy zadań służą do pracy odłączonej (uruchomienia ACP, podagenci, izolowane zadania Cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

<Steps>
  <Step title="Wybierz częstotliwość">
    Pozostaw Heartbeat włączony (domyślnie `30m` lub `1h`, gdy skonfigurowano uwierzytelnianie Anthropic OAuth/tokenem, w tym ponowne użycie Claude CLI) albo ustaw własną częstotliwość.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz krótką listę kontrolną `HEARTBEAT.md` lub blok `tasks:` w przestrzeni roboczej agenta.
  </Step>
  <Step title="Zdecyduj, dokąd mają trafiać wiadomości Heartbeat">
    Wartością domyślną jest `target: "none"`; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrajanie">
    - Włącz dostarczanie toku rozumowania Heartbeat, aby zapewnić przejrzystość.
    - Użyj lekkiego kontekstu inicjalizacyjnego, jeśli uruchomienia Heartbeat potrzebują tylko pliku `HEARTBEAT.md`.
    - Włącz izolowane sesje, aby uniknąć wysyłania pełnej historii rozmowy przy każdym uruchomieniu Heartbeat.
    - Ogranicz Heartbeat do godzin aktywności (czas lokalny).

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

- Interwał: `30m`. Zastosowanie wartości domyślnych dostawcy Anthropic zwiększa go do `1h`, gdy rozpoznanym trybem uwierzytelniania jest OAuth/token (w tym ponowne użycie Claude CLI), ale tylko wtedy, gdy `heartbeat.every` nie jest ustawione. Ustaw `agents.defaults.heartbeat.every` lub `agents.list[].heartbeat.every` dla poszczególnych agentów; użyj `0m`, aby wyłączyć.
- Treść monitu (konfigurowalna przez `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Limit czasu: tury Heartbeat bez ustawionej wartości używają `agents.defaults.timeoutSeconds`, jeśli ją skonfigurowano. W przeciwnym razie używają interwału Heartbeat ograniczonego do 600 sekund. Ustaw `agents.defaults.heartbeat.timeoutSeconds` lub `agents.list[].heartbeat.timeoutSeconds` dla poszczególnych agentów, aby umożliwić dłuższą pracę Heartbeat.
- Monit Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Monit systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat jest włączony dla domyślnego agenta (a `includeSystemPromptSection` nie ma wartości `false`), a uruchomienie jest oznaczane wewnętrznie.
- Gdy Heartbeat jest wyłączony przez `0m`, zwykłe uruchomienia również pomijają `HEARTBEAT.md` w kontekście inicjalizacyjnym, aby model nie widział instrukcji przeznaczonych wyłącznie dla Heartbeat.
- Godziny aktywności (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza tym przedziałem Heartbeat jest pomijany aż do następnego wywołania mieszczącego się w przedziale.
- Heartbeat jest automatycznie odraczany, gdy praca Cron jest aktywna lub oczekuje w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby odraczać także agenta, gdy jego własny podagent powiązany z kluczem sesji lub zagnieżdżone ścieżki poleceń są zajęte; agenci równorzędni nie są już wstrzymywani tylko dlatego, że inny agent wykonuje pracę podagenta.

## Do czego służy monit Heartbeat

Domyślny monit jest celowo ogólny:

- **Zadania w tle**: „Uwzględnij zaległe zadania” zachęca agenta do przeglądania dalszych działań (skrzynki odbiorczej, kalendarza, przypomnień, pracy w kolejce) i zgłaszania pilnych spraw.
- **Kontakt z człowiekiem**: „Od czasu do czasu w ciągu dnia zapytaj swojego człowieka, jak się ma” zachęca do sporadycznej, krótkiej wiadomości „czy czegoś potrzebujesz?”, ale zapobiega wysyłaniu wiadomości w nocy dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat wykonywał bardzo konkretne działanie (np. „sprawdź statystyki Gmail PubSub” lub „zweryfikuj stan Gateway”), ustaw niestandardową treść w `agents.defaults.heartbeat.prompt` (lub `agents.list[].heartbeat.prompt`), która zostanie wysłana dosłownie.

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia Heartbeat mogą zamiast tego wywołać `heartbeat_respond` z `notify: false`, aby nie wyświetlać aktualizacji, lub z `notify: true` i `notificationText`, aby wysłać alert. Jeśli występuje ustrukturyzowana odpowiedź narzędzia, ma ona pierwszeństwo przed tekstowym rozwiązaniem zastępczym.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy występuje ono na **początku lub końcu** odpowiedzi. Token zostaje usunięty, a odpowiedź odrzucona, jeśli pozostała treść ma **≤ `ackMaxChars`** znaków (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` występuje **w środku** odpowiedzi, nie jest traktowane w szczególny sposób.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć wyłącznie tekst alertu.

Poza uruchomieniami Heartbeat przypadkowe `HEARTBEAT_OK` na początku lub końcu wiadomości jest usuwane i rejestrowane; wiadomość zawierająca wyłącznie `HEARTBEAT_OK` jest odrzucana.

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` określa globalne działanie Heartbeat.
- `agents.list[].heartbeat` jest nakładane na te ustawienia; jeśli dowolny agent ma blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` określa domyślne ustawienia widoczności dla wszystkich kanałów.
- `channels.<channel>.heartbeat` zastępuje wartości domyślne kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały obsługujące wiele kont) zastępuje ustawienia poszczególnych kanałów.

### Heartbeat dla poszczególnych agentów

Jeśli dowolny wpis `agents.list[]` zawiera blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**. Blok poszczególnego agenta jest nakładany na `agents.defaults.heartbeat` (możesz więc raz ustawić wspólne wartości domyślne, a następnie zastępować je dla poszczególnych agentów).

Przykład: dwóch agentów, ale tylko drugi uruchamia Heartbeat.

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

Poza tym przedziałem (przed 9:00 lub po 22:00 czasu wschodniego) Heartbeat jest pomijany. Następne zaplanowane wywołanie mieszczące się w przedziale zostanie uruchomione normalnie.

### Konfiguracja całodobowa

Jeśli chcesz, aby Heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia do przedziału czasowego; jest to zachowanie domyślne).
- Ustaw przedział całodniowy: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Nie ustawiaj tej samej godziny `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako przedział o zerowej długości, dlatego Heartbeat będzie zawsze pomijany.
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
  Po włączeniu dostarcza również oddzielną wiadomość `Thinking`, gdy jest dostępna (w takim samym formacie jak `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wartość true powoduje, że uruchomienia Heartbeat używają lekkiego kontekstu inicjalizacyjnego i zachowują tylko `HEARTBEAT.md` spośród plików inicjalizacyjnych przestrzeni roboczej.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wartość true powoduje, że każde uruchomienie Heartbeat odbywa się w nowej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co Cron `sessionTarget: "isolated"`. Znacznie zmniejsza koszt tokenów każdego uruchomienia Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Kierowanie dostarczania nadal korzysta z kontekstu sesji głównej.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wartość true powoduje odraczanie uruchomień Heartbeat, gdy dodatkowe ścieżki danego agenta są zajęte: jego własny podagent powiązany z kluczem sesji lub zagnieżdżona praca poleceń. Ścieżki Cron zawsze odraczają Heartbeat, nawet bez tej flagi, dzięki czemu hosty modeli lokalnych nie uruchamiają jednocześnie monitów Cron i Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

- `main` (domyślnie): główna sesja agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` lub z [CLI sesji](/pl/cli/sessions)).
- Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcza do ostatnio używanego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał lub identyfikator pluginu, na przykład `discord`, `matrix`, `telegram` lub `whatsapp`.
- `none` (domyślnie): uruchamia Heartbeat, ale **nie dostarcza go** na zewnątrz.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steruje sposobem dostarczania bezpośredniego/przez DM. `allow`: zezwala na bezpośrednie dostarczanie Heartbeat/przez DM. `block`: blokuje bezpośrednie dostarczanie/przez DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne zastąpienie odbiorcy (identyfikator zależny od kanału, np. E.164 dla WhatsApp lub identyfikator czatu Telegram). W przypadku tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów obsługujących wiele kont. Gdy ustawiono `target: "last"`, identyfikator konta ma zastosowanie do ostatniego rozpoznanego kanału, jeśli obsługuje on konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie odpowiada skonfigurowanemu kontu rozpoznanego kanału, dostarczenie zostaje pominięte.

</ParamField>
<ParamField path="prompt" type="string">
  Zastępuje domyślną treść promptu (bez scalania).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Określa, czy wstrzykiwana jest sekcja `## Heartbeats` promptu systemowego domyślnego agenta. Ustaw `false`, aby zachować działanie Heartbeat w czasie wykonywania (częstotliwość, dostarczanie, HEARTBEAT.md), pomijając instrukcje Heartbeat w prompcie systemowym agenta.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maksymalna liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Gdy wartość wynosi true, komunikaty ostrzegawcze o błędach narzędzi są pomijane podczas uruchomień Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maksymalna liczba sekund dozwolona na turę agenta Heartbeat przed jej przerwaniem. Pozostaw bez ustawienia, aby użyć `agents.defaults.timeoutSeconds`, jeśli jest ustawione, a w przeciwnym razie częstotliwości Heartbeat ograniczonej do 600 sekund.

</ParamField>
<ParamField path="activeHours" type="object">
  Ogranicza uruchomienia Heartbeat do określonego przedziału czasu. Obiekt zawierający `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` jest dozwolone dla końca dnia) oraz opcjonalne `timezone`.

- Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli jest ustawione, a w przeciwnym razie strefy czasowej systemu hosta.
- `"local"`: zawsze używa strefy czasowej systemu hosta.
- Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, stosowane jest zachowanie `"user"` opisane powyżej.
- Wartości `start` i `end` nie mogą być równe dla aktywnego przedziału; równe wartości są traktowane jako przedział o zerowej szerokości (zawsze poza przedziałem).
- Poza aktywnym przedziałem uruchomienia Heartbeat są pomijane do następnego taktu przypadającego wewnątrz przedziału.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Routing sesji i celu">
    - Heartbeat jest domyślnie uruchamiany w głównej sesji agenta (`agent:<id>:<mainKey>`) lub w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby wskazać konkretną sesję kanału (Discord/WhatsApp/itp.).
    - `session` wpływa wyłącznie na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
    - Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia Heartbeat domyślnie zezwalają na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby zablokować wysyłanie do celów bezpośrednich, nadal wykonując turę Heartbeat.
    - Jeśli główna kolejka, linia sesji docelowej, linia Cron lub aktywne zadanie Cron są zajęte, Heartbeat zostaje pominięty i ponowiony później.
    - Jeśli ustawiono `skipWhenBusy: true`, linie podagentów powiązane z kluczem sesji tego agenta oraz linie zagnieżdżone również odraczają uruchomienia Heartbeat. Zajęte linie innych agentów nie powodują odroczenia dla tego agenta.
    - Jeśli `target` nie zostanie rozpoznany jako żadne zewnętrzne miejsce docelowe, uruchomienie nadal następuje, ale żadna wiadomość wychodząca nie jest wysyłana.

  </Accordion>
  <Accordion title="Widoczność i pomijanie">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wyłączone, uruchomienie zostaje od razu pominięte z `reason=alerts-disabled`.
    - Jeśli wyłączono tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu wymaganych zadań, przywrócić znacznik czasu bezczynności sesji i pominąć zewnętrzny ładunek alertu.
    - Jeśli rozpoznany cel Heartbeat obsługuje wskaźnik pisania, OpenClaw wyświetla go podczas aktywnego uruchomienia Heartbeat. Używany jest ten sam cel, do którego Heartbeat wysłałby wiadomość czatu; funkcję wyłącza ustawienie `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie z Heartbeat **nie** utrzymują sesji aktywnej. Metadane Heartbeat mogą zaktualizować wiersz sesji, ale wygaśnięcie z powodu bezczynności używa `lastInteractionAt` z ostatniej rzeczywistej wiadomości użytkownika/kanału, a wygaśnięcie dzienne używa `sessionStartedAt`.
    - Historia w interfejsie sterowania i WebChat ukrywa prompty Heartbeat oraz potwierdzenia zawierające wyłącznie OK. Bazowy zapis sesji może nadal zawierać te tury na potrzeby audytu lub ponownego odtworzenia.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i wybudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. Takie wybudzenie nie zmienia uruchomienia Heartbeat w zadanie w tle.

  </Accordion>
</AccordionGroup>

## Kontrola widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są pomijane, a treść alertów jest dostarczana. Możesz dostosować to dla każdego kanału lub konta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj komunikaty alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK w Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Pomiń dostarczanie alertów dla tego konta
```

Kolejność pierwszeństwa: dla konta → dla kanału → domyślne ustawienia kanałów → ustawienia wbudowane.

### Działanie poszczególnych flag

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwróci odpowiedź zawierającą wyłącznie OK.
- `showAlerts`: wysyła treść alertu, gdy model zwróci odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni interfejsu prezentujących stan.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady ustawień dla kanału i konta

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
          showAlerts: false # pomijaj alerty tylko dla konta ops
  telegram:
    heartbeat:
      showOk: true
```

### Typowe wzorce

| Cel                                              | Konfiguracja                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Zachowanie domyślne (ciche OK, alerty włączone)  | _(konfiguracja nie jest wymagana)_                                                       |
| Pełna cisza (bez wiadomości i bez wskaźnika)      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)                   | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                          | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalnie)

Jeśli w przestrzeni roboczej istnieje plik `HEARTBEAT.md`, domyślny prompt nakazuje agentowi go odczytać. Traktuj go jako „listę kontrolną Heartbeat”: krótką, stabilną i bezpieczną do sprawdzania co 30 minut.

Podczas zwykłych uruchomień plik `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie częstotliwości Heartbeat za pomocą `0m` lub ustawienie `includeSystemPromptSection: false` powoduje pominięcie go w zwykłym kontekście inicjalizacji.

W natywnym środowisku Codex zawartość `HEARTBEAT.md` nie jest wstrzykiwana do tury tak jak inne pliki inicjalizacyjne. Jeśli plik istnieje i zawiera znaki inne niż białe, notatka trybu współpracy Heartbeat wskazuje Codex ten plik i nakazuje odczytać go przed kontynuowaniem.

Jeśli plik `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (zawiera tylko puste wiersze, komentarze Markdown/HTML, nagłówki Markdown takie jak `# Heading`, znaczniki bloków kodu lub puste pozycje listy kontrolnej), OpenClaw pomija uruchomienie Heartbeat, aby ograniczyć wywołania API. Pominięcie jest raportowane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal zostaje uruchomiony, a model decyduje, co zrobić.

Plik powinien być bardzo krótki (krótka lista kontrolna lub przypomnienia), aby uniknąć nadmiernego rozrostu promptu.

Przykładowy plik `HEARTBEAT.md`:

```md
# Lista kontrolna Heartbeat

- Szybki przegląd: czy w skrzynkach odbiorczych jest coś pilnego?
- Jeśli jest dzień i nic innego nie oczekuje, wykonaj krótką kontrolę.
- Jeśli zadanie jest zablokowane, zapisz _czego brakuje_ i następnym razem zapytaj Petera.
```

### Bloki `tasks:`

Plik `HEARTBEAT.md` obsługuje również mały, ustrukturyzowany blok `tasks:` przeznaczony do kontroli wykonywanych okresowo w ramach samego Heartbeat.

Przykład:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Sprawdź pilne nieprzeczytane wiadomości e-mail i oznacz wszystko, co wymaga szybkiej reakcji."
- name: calendar-scan
  interval: 2h
  prompt: "Sprawdź nadchodzące spotkania wymagające przygotowania lub dalszych działań."

# Dodatkowe instrukcje

- Alerty powinny być krótkie.
- Jeśli po wykonaniu wszystkich wymaganych zadań nic nie wymaga uwagi, odpowiedz HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Działanie">
    - OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie zgodnie z jego własnym `interval`.
    - W prompcie Heartbeat dla danego taktu uwzględniane są tylko zadania, których termin **nadeszedł**.
    - Jeśli termin żadnego zadania nie nadszedł, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zbędnego wywołania modelu.
    - Treść niezwiązana z zadaniami w pliku `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście wymaganych zadań.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), dzięki czemu interwały zachowują się po zwykłych ponownych uruchomieniach.
    - Znaczniki czasu zadań są przesuwane dopiero po ukończeniu przez uruchomienie Heartbeat zwykłej ścieżki odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy jeden plik Heartbeat ma zawierać kilka okresowych kontroli, bez ponoszenia kosztu wszystkich z nich przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` jest zwykłym plikiem w przestrzeni roboczej agenta, dlatego możesz powiedzieć agentowi (na zwykłym czacie) na przykład:

- „Zaktualizuj `HEARTBEAT.md`, dodając codzienną kontrolę kalendarza”.
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiał się na dalszych działaniach dotyczących skrzynki odbiorczej”.

Jeśli chcesz, aby działo się to proaktywnie, możesz również umieścić w prompcie Heartbeat wyraźną instrukcję, na przykład: „Jeśli lista kontrolna stanie się nieaktualna, zaktualizuj HEARTBEAT.md, zastępując ją lepszą”.

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów ani prywatnych tokenów) w pliku `HEARTBEAT.md` — staje się on częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Użyj `openclaw system event`, aby dodać zdarzenie systemowe do kolejki i opcjonalnie natychmiast uruchomić Heartbeat:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Flaga                        | Opis                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Tekst zdarzenia systemowego (wymagany).                                                                      |
| `--mode <mode>`              | `now` natychmiast uruchamia Heartbeat; `next-heartbeat` (domyślnie) czeka na następny zaplanowany takt.      |
| `--session-key <sessionKey>` | Kieruje zdarzenie do określonej sesji; domyślnie używana jest główna sesja agenta.                           |
| `--json`                     | Zwraca dane w formacie JSON.                                                                                 |

Jeśli nie podano `--session-key`, a wiele agentów ma skonfigurowany `heartbeat`, opcja `--mode now` natychmiast uruchamia Heartbeat każdego z tych agentów.

Powiązane elementy sterujące Heartbeat w tej samej grupie CLI:

```bash
openclaw system heartbeat last     # pokaż ostatnie zdarzenie Heartbeat
openclaw system heartbeat enable   # włącz Heartbeat
openclaw system heartbeat disable  # wyłącz Heartbeat
```

## Dostarczanie toku rozumowania (opcjonalnie)

Domyślnie Heartbeat dostarcza tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz zapewnić przejrzystość, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat dostarcza również osobną wiadomość poprzedzoną prefiksem `Thinking` (w takim samym formacie jak `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/instancjami Codex i chcesz wiedzieć, dlaczego zdecydował się wysłać Ci powiadomienie — może jednak ujawnić więcej wewnętrznych szczegółów, niż chcesz. W czatach grupowych najlepiej pozostawić tę opcję wyłączoną.

## Świadomość kosztów

Heartbeat wykonuje pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszty:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii konwersacji (zmniejszając liczbę tokenów z ok. 100 tys. do ok. 2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki inicjalizacyjne wyłącznie do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Zachowaj niewielki rozmiar pliku `HEARTBEAT.md`.
- Użyj `target: "none"`, jeśli potrzebujesz tylko wewnętrznych aktualizacji stanu.

## Przepełnienie kontekstu po Heartbeat

Po zakończeniu uruchomienia Heartbeat zachowuje istniejący model wykonawczy współdzielonej sesji, dlatego Heartbeat, który przełączył sesję na mniejszy model lokalny (na przykład model Ollama z oknem 32 tys. tokenów), może pozostawić ten model aktywny podczas następnej tury głównej sesji. Jeśli ta następna tura zgłosi przepełnienie kontekstu, a ostatni model wykonawczy sesji jest zgodny ze skonfigurowanym `heartbeat.model`, komunikat odzyskiwania OpenClaw wskazuje przeniesienie modelu Heartbeat jako prawdopodobną przyczynę i sugeruje rozwiązanie.

Aby temu zapobiec: użyj `isolatedSession: true`, aby uruchamiać Heartbeat w nowej sesji (opcjonalnie w połączeniu z `lightContext: true`, aby uzyskać najmniejszy możliwy prompt), albo wybierz model Heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Zadania w tle](/pl/automation/tasks) — sposób śledzenia odłączonych zadań
- [Strefa czasowa](/pl/concepts/timezone) — wpływ strefy czasowej na harmonogram Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — diagnozowanie problemów z automatyzacją
