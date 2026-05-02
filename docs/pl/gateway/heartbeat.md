---
read_when:
    - Dostosowywanie częstotliwości Heartbeat lub komunikatów
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Heartbeat
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T09:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat czy Cron?** Zobacz [Automatyzacja i zadania](/pl/automation), aby dowiedzieć się, kiedy używać którego mechanizmu.
</Note>

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł sygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię powiadomieniami.

Heartbeat to zaplanowana tura w głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks). Rekordy zadań są przeznaczone dla pracy odłączonej (uruchomienia ACP, subagenci, izolowane zadania Cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

<Steps>
  <Step title="Wybierz częstotliwość">
    Pozostaw Heartbeat włączony (domyślnie `30m` albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
  </Step>
  <Step title="Dodaj HEARTBEAT.md (opcjonalnie)">
    Utwórz krótką checklistę `HEARTBEAT.md` albo blok `tasks:` w obszarze roboczym agenta.
  </Step>
  <Step title="Zdecyduj, gdzie mają trafiać wiadomości Heartbeat">
    `target: "none"` jest wartością domyślną; ustaw `target: "last"`, aby kierować wiadomości do ostatniego kontaktu.
  </Step>
  <Step title="Opcjonalne dostrajanie">
    - Włącz dostarczanie rozumowania Heartbeat dla przejrzystości.
    - Użyj lekkiego kontekstu startowego, jeśli uruchomienia Heartbeat potrzebują tylko `HEARTBEAT.md`.
    - Włącz izolowane sesje, aby uniknąć wysyłania pełnej historii rozmowy przy każdym Heartbeat.
    - Ogranicz Heartbeat do godzin aktywności (czasu lokalnego).

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
- Prompt Heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy Heartbeat jest włączony dla domyślnego agenta, a uruchomienie jest oznaczone wewnętrznie.
- Gdy Heartbeat jest wyłączony za pomocą `0m`, normalne uruchomienia pomijają też `HEARTBEAT.md` w kontekście startowym, aby model nie widział instrukcji przeznaczonych tylko dla Heartbeat.
- Godziny aktywności (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej. Poza oknem Heartbeat jest pomijany do następnego taktu wewnątrz okna.
- Heartbeat automatycznie odracza działanie, gdy praca Cron jest aktywna lub w kolejce. Ustaw `heartbeat.skipWhenBusy: true`, aby odraczać także przy dodatkowo zajętych ścieżkach (subagent albo zagnieżdżona praca poleceń); jest to przydatne dla lokalnego Ollama i innych ograniczonych hostów z pojedynczym środowiskiem uruchomieniowym.

## Do czego służy prompt Heartbeat

Domyślny prompt jest celowo szeroki:

- **Zadania w tle**: „Consider outstanding tasks” zachęca agenta do przejrzenia dalszych działań (skrzynka odbiorcza, kalendarz, przypomnienia, praca w kolejce) i zgłoszenia wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” zachęca do okazjonalnej, lekkiej wiadomości „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [Strefa czasowa](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj kondycję Gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Uruchomienia Heartbeat z możliwością użycia narzędzi mogą zamiast tego wywołać `heartbeat_respond` z `notify: false`, aby nie pokazywać widocznej aktualizacji, albo `notify: true` oraz `notificationText` dla alertu. Gdy występuje ustrukturyzowana odpowiedź narzędzia, ma ona pierwszeństwo przed tekstowym mechanizmem zastępczym.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź jest odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
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
- `agents.list[].heartbeat` scala się na wierzchu; jeśli jakikolwiek agent ma blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` zastępuje ustawienia domyślne kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały wielokontowe) zastępuje ustawienia dla kanału.

### Heartbeat dla poszczególnych agentów

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**. Blok konkretnego agenta scala się na wierzchu `agents.defaults.heartbeat` (możesz więc ustawić wspólne wartości domyślne raz i nadpisywać je dla agentów).

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
Nie ustawiaj takiej samej godziny `start` i `end` (na przykład od `08:00` do `08:00`). Jest to traktowane jako okno o zerowej szerokości, więc Heartbeat jest zawsze pomijany.
</Warning>

### Przykład wielokontowy

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

### Uwagi dotyczące pól

<ParamField path="every" type="string">
  Interwał Heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu dla uruchomień Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Po włączeniu dostarcza także oddzielną wiadomość `Reasoning:`, gdy jest dostępna (taki sam kształt jak `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Gdy ustawione na true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Gdy ustawione na true, każde uruchomienie Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co Cron `sessionTarget: "isolated"`. Znacząco zmniejsza koszt tokenów na Heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Kierowanie dostarczania nadal używa kontekstu głównej sesji.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Gdy ustawione na true, uruchomienia Heartbeat są odraczane na dodatkowo zajętych ścieżkach: subagent albo zagnieżdżona praca poleceń. Ścieżki Cron zawsze odraczają Heartbeat, nawet bez tej flagi, więc hosty modeli lokalnych nie uruchamiają promptów Cron i Heartbeat jednocześnie.
</ParamField>
<ParamField path="session" type="string">
  Opcjonalny klucz sesji dla uruchomień Heartbeat.

- `main` (domyślnie): główna sesja agenta.
- Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/pl/cli/sessions)).
- Formaty kluczy sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: dostarcz do ostatnio użytego kanału zewnętrznego.
- jawny kanał: dowolny skonfigurowany kanał albo identyfikator Plugin, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
- `none` (domyślnie): uruchom Heartbeat, ale **nie dostarczaj** na zewnątrz.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kontroluje zachowanie dostarczania bezpośredniego/DM. `allow`: zezwalaj na bezpośrednie/DM dostarczanie Heartbeat. `block`: wstrzymaj bezpośrednie/DM dostarczanie (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta ma zastosowanie do rozpoznanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozpoznanego kanału, dostarczenie jest pomijane.

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
- `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako okno o zerowej szerokości (zawsze poza oknem).
- Poza aktywnym oknem Heartbeat są pomijane do następnego taktu wewnątrz okna.

</ParamField>

## Zachowanie dostarczania

<AccordionGroup>
  <Accordion title="Sesja i trasowanie celu">
    - Heartbeat domyślnie uruchamiają się w głównej sesji agenta (`agent:<id>:<mainKey>`) albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby zastąpić to konkretną sesją kanału (Discord/WhatsApp/itd.).
    - `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
    - Aby dostarczyć do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
    - Dostarczenia Heartbeat domyślnie dopuszczają cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłki do celów bezpośrednich, nadal uruchamiając turę Heartbeat.
    - Jeśli główna kolejka, pasmo sesji docelowej, pasmo cron albo aktywne zadanie cron jest zajęte, Heartbeat jest pomijany i ponawiany później.
    - Jeśli `skipWhenBusy: true`, subagent i pasma zagnieżdżone także odraczają uruchomienia Heartbeat.
    - Jeśli `target` nie zostanie rozstrzygnięty do żadnego zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale żadna wiadomość wychodząca nie jest wysyłana.

  </Accordion>
  <Accordion title="Widoczność i zachowanie pomijania">
    - Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
    - Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić Heartbeat, zaktualizować znaczniki czasu należnych zadań, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
    - Jeśli rozstrzygnięty cel Heartbeat obsługuje pisanie, OpenClaw pokazuje pisanie, gdy uruchomienie Heartbeat jest aktywne. Używa to tego samego celu, do którego Heartbeat wysłałby wyjście czatu, i jest wyłączane przez `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cykl życia sesji i audyt">
    - Odpowiedzi wyłącznie Heartbeat **nie** utrzymują sesji przy życiu. Metadane Heartbeat mogą aktualizować wiersz sesji, ale wygaśnięcie bezczynności używa `lastInteractionAt` z ostatniej rzeczywistej wiadomości użytkownika/kanału, a dzienne wygaśnięcie używa `sessionStartedAt`.
    - Historia Control UI i WebChat ukrywa prompty Heartbeat oraz potwierdzenia tylko OK. Bazowy transkrypt sesji nadal może zawierać te tury na potrzeby audytu/odtworzenia.
    - Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i wybudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

  </Accordion>
</AccordionGroup>

## Kontrolki widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treści alertów są dostarczane. Możesz dostosować to dla kanału lub konta:

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

Pierwszeństwo: na konto → na kanał → domyślne ustawienia kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady dla kanału i konta

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
| Całkowita cisza (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli w obszarze roboczym istnieje plik `HEARTBEAT.md`, domyślny prompt mówi agentowi, aby go przeczytał. Traktuj go jak swoją „listę kontrolną Heartbeat”: małą, stabilną i bezpieczną do dołączania co 30 minut.

W normalnych uruchomieniach `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie rytmu Heartbeat przez `0m` albo ustawienie `includeSystemPromptSection: false` pomija go w normalnym kontekście bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (tylko puste wiersze i nagłówki markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API. To pominięcie jest zgłaszane jako `reason=empty-heartbeat-file`. Jeśli pliku brakuje, Heartbeat nadal się uruchamia, a model decyduje, co zrobić.

Utrzymuj go jako bardzo mały (krótka lista kontrolna lub przypomnienia), aby uniknąć rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały ustrukturyzowany blok `tasks:` dla kontroli opartych na interwałach wewnątrz samego Heartbeat.

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
    - Tylko **należne** zadania są dołączane do promptu Heartbeat dla danego taktu.
    - Jeśli żadne zadania nie są należne, Heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
    - Treść niezwiązana z zadaniami w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście należnych zadań.
    - Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają normalne restarty.
    - Znaczniki czasu zadań są przesuwane tylko po tym, jak uruchomienie Heartbeat zakończy swoją normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

  </Accordion>
</AccordionGroup>

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik Heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym takcie.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to zwykły plik w obszarze roboczym agenta, więc możesz powiedzieć agentowi (w normalnym czacie) coś w rodzaju:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiony na działaniach następczych ze skrzynki odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dołączyć jawną linię w swoim prompcie Heartbeat, na przykład: „Jeśli lista kontrolna stanie się nieaktualna, zaktualizuj HEARTBEAT.md lepszą wersją.”

<Warning>
Nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w `HEARTBEAT.md` — staje się on częścią kontekstu promptu.
</Warning>

## Ręczne wybudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i wyzwolić natychmiastowy Heartbeat za pomocą:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia każdy z tych Heartbeat agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następny zaplanowany takt.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie Heartbeat dostarczają tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu Heartbeat będą także dostarczać osobną wiadomość z prefiksem `Reasoning:` (w tym samym kształcie co `/reasoning on`). Może to być przydatne, gdy agent zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się do ciebie odezwać — ale może też ujawnić więcej wewnętrznych szczegółów, niż chcesz. Preferuj pozostawienie tego wyłączonego w czatach grupowych.

## Świadomość kosztów

Heartbeat uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby zmniejszyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii konwersacji (~100 tys. tokenów do ~2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` jako mały.
- Użyj `target: "none"`, jeśli chcesz tylko aktualizacji stanu wewnętrznego.

## Przepełnienie kontekstu po Heartbeat

Jeśli Heartbeat używa mniejszego modelu lokalnego, na przykład modelu Ollama z oknem 32k, a następna tura głównej sesji zgłasza przepełnienie kontekstu, sprawdź, czy poprzedni Heartbeat nie zostawił sesji na modelu Heartbeat. Komunikat resetowania OpenClaw wskazuje to, gdy ostatni model runtime pasuje do skonfigurowanego `heartbeat.model`.

Użyj `isolatedSession: true`, aby uruchamiać Heartbeat w świeżej sesji, połącz to z `lightContext: true` dla najmniejszego promptu albo wybierz model Heartbeat z oknem kontekstu wystarczająco dużym dla współdzielonej sesji.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest odłączona praca
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
