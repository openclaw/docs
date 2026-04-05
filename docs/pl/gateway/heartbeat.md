---
read_when:
    - Dostosowywanie częstotliwości heartbeat lub komunikatów
    - Podejmowanie decyzji między heartbeat a cron dla zaplanowanych zadań
summary: Komunikaty odpytywania heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T13:53:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat czy Cron?** Zobacz [Automation & Tasks](/pl/automation), aby uzyskać wskazówki, kiedy używać każdego z nich.

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, dzięki czemu model może
pokazać wszystko, co wymaga uwagi, bez spamowania Cię.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [background task](/pl/automation/tasks).
Rekordy zadań służą do pracy odłączonej (uruchomienia ACP, subagenci, izolowane zadania cron).

Rozwiązywanie problemów: [Scheduled Tasks](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

1. Pozostaw heartbeat włączony (domyślnie `30m` albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) albo ustaw własną częstotliwość.
2. Utwórz małą listę kontrolną `HEARTBEAT.md` lub blok `tasks:` w workspace agenta (opcjonalne, ale zalecane).
3. Zdecyduj, dokąd mają trafiać komunikaty heartbeat (`target: "none"` jest wartością domyślną; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu).
4. Opcjonalnie włącz dostarczanie rozumowania heartbeat dla większej przejrzystości.
5. Opcjonalnie użyj lekkiego kontekstu bootstrap, jeśli uruchomienia heartbeat potrzebują tylko `HEARTBEAT.md`.
6. Opcjonalnie włącz izolowane sesje, aby nie wysyłać pełnej historii rozmowy przy każdym heartbeat.
7. Opcjonalnie ogranicz heartbeat do aktywnych godzin (czas lokalny).

Przykładowy config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie jest "none")
        directPolicy: "allow", // domyślnie: zezwalaj na cele direct/DM; ustaw "block", aby wyciszyć
        lightContext: true, // opcjonalnie: wstrzykuj tylko HEARTBEAT.md z plików bootstrap
        isolatedSession: true, // opcjonalnie: nowa sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalnie: wyślij też osobny komunikat `Reasoning:`
      },
    },
  },
}
```

## Wartości domyślne

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo per agent `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt
  systemowy zawiera sekcję „Heartbeat”, a uruchomienie jest oznaczane wewnętrznie.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej.
  Poza oknem heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

## Do czego służy prompt heartbeat

Domyślny prompt jest celowo szeroki:

- **Background tasks**: „Consider outstanding tasks” skłania agenta do przeglądania
  zadań do wykonania (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i sygnalizowania wszystkiego, co pilne.
- **Sprawdzenie u człowieka**: „Checkup sometimes on your human during day time” skłania do
  okazjonalnego lekkiego komunikatu „czy czegoś potrzebujesz?”, ale unika nocnego spamu
  dzięki użyciu Twojej skonfigurowanej lokalnej strefy czasowej (zobacz [/concepts/timezone](/concepts/timezone)).

Heartbeat może reagować na ukończone [background tasks](/pl/automation/tasks), ale samo uruchomienie heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub”
albo „zweryfikuj stan gateway”), ustaw `agents.defaults.heartbeat.prompt` (lub
`agents.list[].heartbeat.prompt`) na niestandardową treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się
  na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź jest
  odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się **w środku** odpowiedzi, nie jest traktowane
  w specjalny sposób.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane
i logowane; wiadomość zawierająca wyłącznie `HEARTBEAT_OK` jest odrzucana.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarczaj osobny komunikat Reasoning: gdy dostępny)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy heartbeat w nowej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <channel id> (core lub wtyczka, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału wielokontowego
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maks. liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i pierwszeństwo

- `agents.defaults.heartbeat` ustawia globalne zachowanie heartbeat.
- `agents.list[].heartbeat` scala się na wierzchu; jeśli którykolwiek agent ma blok `heartbeat`, **tylko ci agenci** uruchamiają heartbeat.
- `channels.defaults.heartbeat` ustawia domyślne ustawienia widoczności dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje domyślne ustawienia kanału.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały wielokontowe) nadpisuje ustawienia per kanał.

### Heartbeat per agent

Jeśli którykolwiek wpis `agents.list[]` zawiera blok `heartbeat`, **tylko ci agenci**
uruchamiają heartbeat. Blok per agent scala się na wierzchu `agents.defaults.heartbeat`
(dzięki czemu możesz ustawić wspólne wartości domyślne raz i nadpisać je per agent).

Przykład: dwóch agentów, tylko drugi agent uruchamia heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie jest "none")
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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Przykład aktywnych godzin

Ogranicz heartbeat do godzin pracy w określonej strefie czasowej:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie jest "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcjonalne; używa userTimezone, jeśli ustawiono, w przeciwnym razie strefy hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 lub po 22:00 czasu wschodniego) heartbeat są pomijane. Następne zaplanowane tyknięcie wewnątrz okna uruchomi się normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Pomiń `activeHours` całkowicie (brak ograniczenia oknem czasowym; to zachowanie domyślne).
- Ustaw okno całodniowe: `activeHours: { start: "00:00", end: "24:00" }`.

Nie ustawiaj tej samej godziny `start` i `end` (na przykład `08:00` do `08:00`).
Jest to traktowane jako okno o zerowej szerokości, więc heartbeat są zawsze pomijane.

### Przykład wielu kont

Użyj `accountId`, aby kierować na konkretne konto w kanałach wielokontowych, takich jak Telegram:

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

### Uwagi dotyczące pól

- `every`: interwał heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
- `model`: opcjonalne nadpisanie modelu dla uruchomień heartbeat (`provider/model`).
- `includeReasoning`: gdy włączone, dostarcza również osobny komunikat `Reasoning:` gdy jest dostępny (ten sam kształt co `/reasoning on`).
- `lightContext`: gdy true, uruchomienia heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
- `isolatedSession`: gdy true, każdy heartbeat działa w nowej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co cron `sessionTarget: "isolated"`. Radykalnie obniża koszt tokenów per heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu głównej sesji.
- `session`: opcjonalny klucz sesji dla uruchomień heartbeat.
  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiuj z `openclaw sessions --json` lub z [CLI sesji](/cli/sessions)).
  - Formaty kluczy sesji: zobacz [Sessions](/concepts/session) i [Groups](/pl/channels/groups).
- `target`:
  - `last`: dostarczaj do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub identyfikator wtyczki, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
  - `none` (domyślnie): uruchom heartbeat, ale **nie dostarczaj** niczego na zewnątrz.
- `directPolicy`: steruje zachowaniem dostarczania direct/DM:
  - `allow` (domyślnie): zezwalaj na dostarczanie heartbeat do celów direct/DM.
  - `block`: wycisz dostarczanie direct/DM (`reason=dm-blocked`).
- `to`: opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
- `accountId`: opcjonalny identyfikator konta dla kanałów wielokontowych. Gdy `target: "last"`, identyfikator konta ma zastosowanie do rozpoznanego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozpoznanego kanału, dostarczenie jest pomijane.
- `prompt`: nadpisuje domyślną treść promptu (bez scalania).
- `ackMaxChars`: maks. liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
- `suppressToolErrorWarnings`: gdy true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień heartbeat.
- `activeHours`: ogranicza uruchomienia heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` jest dozwolone dla końca dnia) oraz opcjonalnym `timezone`.
  - Pominięte lub `"user"`: używa Twojego `agents.defaults.userTimezone`, jeśli ustawiono, w przeciwnym razie wraca do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, następuje fallback do zachowania `"user"` opisanego powyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
  - Poza aktywnym oknem heartbeat są pomijane aż do następnego tyknięcia wewnątrz okna.

## Zachowanie dostarczania

- Heartbeat są domyślnie uruchamiane w głównej sesji agenta (`agent:<id>:<mainKey>`),
  albo `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać na
  konkretną sesję kanału (Discord/WhatsApp/itd.).
- `session` wpływa tylko na kontekst uruchomienia; dostarczaniem sterują `target` i `to`.
- Aby dostarczyć do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy
  `target: "last"` dostarczenie używa ostatniego zewnętrznego kanału dla tej sesji.
- Dostarczanie heartbeat domyślnie zezwala na cele direct/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłanie do celów direct przy jednoczesnym zachowaniu tury heartbeat.
- Jeśli główna kolejka jest zajęta, heartbeat jest pomijany i ponawiany później.
- Jeśli `target` nie rozpozna żadnego zewnętrznego miejsca docelowego, uruchomienie nadal następuje, ale żadna
  wiadomość wychodząca nie jest wysyłana.
- Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane od razu z `reason=alerts-disabled`.
- Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić heartbeat, zaktualizować znaczniki czasu zadań wymagających wykonania, przywrócić znacznik bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
- Odpowiedzi tylko-heartbeat **nie** utrzymują sesji przy życiu; ostatnie `updatedAt`
  jest przywracane, aby wygaśnięcie bezczynności zachowywało się normalnie.
- Odłączone [background tasks](/pl/automation/tasks) mogą umieścić zdarzenie systemowe w kolejce i wybudzić heartbeat, gdy główna sesja powinna szybko coś zauważyć. To wybudzenie nie sprawia, że heartbeat staje się background task.

## Sterowanie widocznością

Domyślnie potwierdzenia `HEARTBEAT_OK` są ukrywane, podczas gdy treść alertów jest
dostarczana. Możesz to dostosować per kanał lub per konto:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj komunikaty alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK na Telegramie
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Pierwszeństwo: per konto → per kanał → domyślne kanału → wbudowane wartości domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą wyłącznie OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** mają wartość false, OpenClaw całkowicie pomija uruchomienie heartbeat (bez wywołania modelu).

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

| Cel                                      | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Domyślne zachowanie (ciche OK, alerty włączone) | _(brak wymaganego config)_                                                               |
| Całkowicie cicho (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcjonalne)

Jeśli plik `HEARTBEAT.md` istnieje w workspace, domyślny prompt instruuje
agenta, aby go odczytał. Pomyśl o nim jak o swojej „liście kontrolnej heartbeat”: małej, stabilnej i
bezpiecznej do dołączania co 30 minut.

Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie pusty (tylko puste linie i nagłówki markdown
takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
To pominięcie jest raportowane jako `reason=empty-heartbeat-file`.
Jeśli plik nie istnieje, heartbeat nadal działa, a model sam decyduje, co zrobić.

Utrzymuj go w małym rozmiarze (krótka lista kontrolna albo przypomnienia), aby uniknąć rozrostu promptu.

Przykładowy `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje także mały ustrukturyzowany blok `tasks:` dla kontroli
opartych na interwałach wewnątrz samego heartbeat.

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

Zachowanie:

- OpenClaw parsuje blok `tasks:` i sprawdza każde zadanie względem własnego `interval`.
- Do promptu heartbeat dla danego tyknięcia są dołączane tylko zadania, które **mają termin wykonania**.
- Jeśli żadne zadania nie mają terminu wykonania, heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć zmarnowanego wywołania modelu.
- Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście zadań wymagających wykonania.
- Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
- Znaczniki czasu zadań są przesuwane dopiero po tym, jak uruchomienie heartbeat przejdzie normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym tyknięciu.

### Czy agent może aktualizować HEARTBEAT.md?

Tak — jeśli go o to poprosisz.

`HEARTBEAT.md` to po prostu zwykły plik w workspace agenta, więc możesz powiedzieć
agentowi (na zwykłym czacie) coś takiego:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienną kontrolę kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiał się na zadaniach związanych ze skrzynką odbiorczą.”

Jeśli chcesz, aby działo się to proaktywnie, możesz także dołączyć jawną linię w
prompt heartbeat, na przykład: „If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Uwaga dotycząca bezpieczeństwa: nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w
`HEARTBEAT.md` — staje się częścią kontekstu promptu.

## Ręczne wybudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i natychmiast uruchomić heartbeat poleceniem:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jeśli wiele agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia heartbeat każdego z tych
agentów.

Użyj `--mode next-heartbeat`, aby poczekać na następne zaplanowane tyknięcie.

## Dostarczanie rozumowania (opcjonalne)

Domyślnie heartbeat dostarcza tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Po włączeniu heartbeat będą również dostarczać osobny komunikat poprzedzony
`Reasoning:` (ten sam kształt co `/reasoning on`). Może to być przydatne, gdy agent
zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się Cię
powiadomić — ale może to także ujawnić więcej szczegółów wewnętrznych, niż chcesz. W czatach grupowych lepiej pozostawić tę opcję
wyłączoną.

## Świadomość kosztów

Heartbeat uruchamia pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby obniżyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (~100K tokenów spada do ~2-5K na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Utrzymuj `HEARTBEAT.md` w małym rozmiarze.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automation & Tasks](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Background Tasks](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Timezone](/concepts/timezone) — jak strefa czasowa wpływa na harmonogram heartbeat
- [Troubleshooting](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
