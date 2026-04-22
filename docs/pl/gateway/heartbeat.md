---
read_when:
    - Dostosowywanie częstotliwości Heartbeat lub komunikatów
    - Decydowanie między Heartbeat a Cron dla zaplanowanych zadań
summary: Komunikaty odpytywania Heartbeat i reguły powiadomień
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T09:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat czy Cron?** Wskazówki, kiedy używać każdego z nich, znajdziesz w [Automatyzacja i zadania](/pl/automation).

Heartbeat uruchamia **okresowe tury agenta** w głównej sesji, aby model mógł
zasygnalizować wszystko, co wymaga uwagi, bez zasypywania Cię wiadomościami.

Heartbeat to zaplanowana tura głównej sesji — **nie** tworzy rekordów [zadań w tle](/pl/automation/tasks).
Rekordy zadań służą do pracy odłączonej od sesji (uruchomienia ACP, subagenci, izolowane zadania Cron).

Rozwiązywanie problemów: [Zaplanowane zadania](/pl/automation/cron-jobs#troubleshooting)

## Szybki start (dla początkujących)

1. Pozostaw włączone heartbeaty (domyślnie `30m`, albo `1h` dla uwierzytelniania Anthropic OAuth/token, w tym ponownego użycia Claude CLI) lub ustaw własną częstotliwość.
2. Utwórz małą listę kontrolną `HEARTBEAT.md` albo blok `tasks:` w obszarze roboczym agenta (opcjonalne, ale zalecane).
3. Zdecyduj, dokąd mają trafiać wiadomości Heartbeat (`target: "none"` jest domyślne; ustaw `target: "last"`, aby kierować je do ostatniego kontaktu).
4. Opcjonalnie: włącz dostarczanie uzasadnienia Heartbeat dla większej przejrzystości.
5. Opcjonalnie: użyj lekkiego kontekstu początkowego, jeśli uruchomienia Heartbeat wymagają tylko `HEARTBEAT.md`.
6. Opcjonalnie: włącz izolowane sesje, aby przy każdym Heartbeat nie wysyłać pełnej historii rozmowy.
7. Opcjonalnie: ogranicz heartbeat do aktywnych godzin (czas lokalny).

Przykładowa konfiguracja:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // jawne dostarczanie do ostatniego kontaktu (domyślnie "none")
        directPolicy: "allow", // domyślnie: zezwalaj na cele bezpośrednie/DM; ustaw "block", aby je wyciszyć
        lightContext: true, // opcjonalnie: wstrzykuj tylko HEARTBEAT.md z plików bootstrap
        isolatedSession: true, // opcjonalnie: świeża sesja przy każdym uruchomieniu (bez historii rozmowy)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcjonalnie: wyślij też osobną wiadomość `Reasoning:`
      },
    },
  },
}
```

## Domyślne ustawienia

- Interwał: `30m` (albo `1h`, gdy wykrytym trybem uwierzytelniania jest Anthropic OAuth/token, w tym ponowne użycie Claude CLI). Ustaw `agents.defaults.heartbeat.every` albo `agents.list[].heartbeat.every`; użyj `0m`, aby wyłączyć.
- Treść promptu (konfigurowalna przez `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat jest wysyłany **dosłownie** jako wiadomość użytkownika. Prompt systemowy zawiera sekcję „Heartbeat” tylko wtedy, gdy heartbeat jest włączony dla domyślnego agenta i uruchomienie jest wewnętrznie oznaczone odpowiednią flagą.
- Gdy heartbeat jest wyłączony przez `0m`, zwykłe uruchomienia także pomijają `HEARTBEAT.md` w kontekście bootstrap, aby model nie widział instrukcji przeznaczonych wyłącznie dla Heartbeat.
- Aktywne godziny (`heartbeat.activeHours`) są sprawdzane w skonfigurowanej strefie czasowej.
  Poza tym oknem heartbeat jest pomijany aż do następnego tyknięcia mieszczącego się w oknie.

## Do czego służy prompt heartbeat

Domyślny prompt jest celowo ogólny:

- **Zadania w tle**: „Consider outstanding tasks” skłania agenta do przejrzenia
  oczekujących działań następczych (skrzynka odbiorcza, kalendarz, przypomnienia, kolejka pracy) i zasygnalizowania wszystkiego, co pilne.
- **Kontakt z człowiekiem**: „Checkup sometimes on your human during day time” skłania do okazjonalnej lekkiej wiadomości w stylu „czy czegoś potrzebujesz?”, ale unika nocnego spamu dzięki użyciu skonfigurowanej lokalnej strefy czasowej (zobacz [/concepts/timezone](/pl/concepts/timezone)).

Heartbeat może reagować na ukończone [zadania w tle](/pl/automation/tasks), ale samo uruchomienie Heartbeat nie tworzy rekordu zadania.

Jeśli chcesz, aby Heartbeat robił coś bardzo konkretnego (np. „sprawdź statystyki Gmail PubSub” albo „zweryfikuj stan Gateway”), ustaw `agents.defaults.heartbeat.prompt` (albo `agents.list[].heartbeat.prompt`) na własną treść (wysyłaną dosłownie).

## Kontrakt odpowiedzi

- Jeśli nic nie wymaga uwagi, odpowiedz **`HEARTBEAT_OK`**.
- Podczas uruchomień Heartbeat OpenClaw traktuje `HEARTBEAT_OK` jako potwierdzenie, gdy pojawia się na **początku lub końcu** odpowiedzi. Token jest usuwany, a odpowiedź odrzucana, jeśli pozostała treść ma **≤ `ackMaxChars`** (domyślnie: 300).
- Jeśli `HEARTBEAT_OK` pojawia się **w środku** odpowiedzi, nie jest traktowany w sposób szczególny.
- W przypadku alertów **nie** dołączaj `HEARTBEAT_OK`; zwróć tylko tekst alertu.

Poza Heartbeat przypadkowe `HEARTBEAT_OK` na początku/końcu wiadomości jest usuwane i rejestrowane; wiadomość, która zawiera wyłącznie `HEARTBEAT_OK`, jest odrzucana.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // domyślnie: 30m (0m wyłącza)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // domyślnie: false (dostarczaj osobną wiadomość Reasoning:, gdy jest dostępna)
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap obszaru roboczego
        isolatedSession: false, // domyślnie: false; true uruchamia każdy heartbeat w świeżej sesji (bez historii rozmowy)
        target: "last", // domyślnie: none | opcje: last | none | <id kanału> (rdzeniowego lub Plugin, np. "bluebubbles")
        to: "+15551234567", // opcjonalne nadpisanie specyficzne dla kanału
        accountId: "ops-bot", // opcjonalny identyfikator kanału dla wielu kont
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maks. liczba znaków dozwolona po HEARTBEAT_OK
      },
    },
  },
}
```

### Zakres i priorytet

- `agents.defaults.heartbeat` ustawia globalne zachowanie Heartbeat.
- `agents.list[].heartbeat` jest nakładane na to ustawienie; jeśli jakikolwiek agent ma blok `heartbeat`, heartbeat uruchamiają **tylko ci agenci**.
- `channels.defaults.heartbeat` ustawia domyślną widoczność dla wszystkich kanałów.
- `channels.<channel>.heartbeat` nadpisuje ustawienia domyślne kanałów.
- `channels.<channel>.accounts.<id>.heartbeat` (kanały z wieloma kontami) nadpisuje ustawienia per kanał.

### Heartbeat per agent

Jeśli jakikolwiek wpis `agents.list[]` zawiera blok `heartbeat`, heartbeat uruchamiają **tylko ci agenci**. Blok per agent jest nakładany na `agents.defaults.heartbeat`
(dzięki temu możesz raz ustawić wspólne wartości domyślne i nadpisywać je dla poszczególnych agentów).

Przykład: dwóch agentów, heartbeat uruchamia tylko drugi agent.

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

Ogranicz heartbeat do godzin pracy w określonej strefie czasowej:

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
          timezone: "America/New_York", // opcjonalnie; używa `userTimezone`, jeśli ustawiono, w przeciwnym razie strefy czasowej hosta
        },
      },
    },
  },
}
```

Poza tym oknem (przed 9:00 lub po 22:00 czasu wschodniego) heartbeat jest pomijany. Następne zaplanowane tyknięcie mieszczące się w oknie zostanie uruchomione normalnie.

### Konfiguracja 24/7

Jeśli chcesz, aby heartbeat działał przez cały dzień, użyj jednego z tych wzorców:

- Całkowicie pomiń `activeHours` (brak ograniczenia do okna czasowego; to zachowanie domyślne).
- Ustaw okno całodzienne: `activeHours: { start: "00:00", end: "24:00" }`.

Nie ustawiaj tej samej godziny dla `start` i `end` (na przykład `08:00` do `08:00`).
Jest to traktowane jako okno o zerowej szerokości, więc heartbeat jest zawsze pomijany.

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

### Uwagi o polach

- `every`: interwał heartbeat (ciąg czasu trwania; domyślna jednostka = minuty).
- `model`: opcjonalne nadpisanie modelu dla uruchomień Heartbeat (`provider/model`).
- `includeReasoning`: gdy włączone, dostarcza także osobną wiadomość `Reasoning:`, gdy jest dostępna (w tej samej postaci co `/reasoning on`).
- `lightContext`: gdy ustawione na true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap obszaru roboczego.
- `isolatedSession`: gdy ustawione na true, każdy heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Używa tego samego wzorca izolacji co Cron `sessionTarget: "isolated"`. Znacznie zmniejsza koszt tokenów na pojedynczy heartbeat. Połącz z `lightContext: true`, aby uzyskać maksymalne oszczędności. Routing dostarczania nadal używa kontekstu głównej sesji.
- `session`: opcjonalny klucz sesji dla uruchomień Heartbeat.
  - `main` (domyślnie): główna sesja agenta.
  - Jawny klucz sesji (skopiuj z `openclaw sessions --json` albo z [CLI sesji](/cli/sessions)).
  - Formaty klucza sesji: zobacz [Sesje](/pl/concepts/session) i [Grupy](/pl/channels/groups).
- `target`:
  - `last`: dostarczaj do ostatnio użytego zewnętrznego kanału.
  - jawny kanał: dowolny skonfigurowany kanał lub id Plugin, na przykład `discord`, `matrix`, `telegram` albo `whatsapp`.
  - `none` (domyślnie): uruchom heartbeat, ale **nie dostarczaj** go na zewnątrz.
- `directPolicy`: kontroluje zachowanie dostarczania bezpośredniego/DM:
  - `allow` (domyślnie): zezwalaj na dostarczanie Heartbeat bezpośrednio/DM.
  - `block`: wycisz dostarczanie bezpośrednie/DM (`reason=dm-blocked`).
- `to`: opcjonalne nadpisanie odbiorcy (identyfikator specyficzny dla kanału, np. E.164 dla WhatsApp albo identyfikator czatu Telegram). Dla tematów/wątków Telegram użyj `<chatId>:topic:<messageThreadId>`.
- `accountId`: opcjonalny identyfikator konta dla kanałów z wieloma kontami. Gdy `target: "last"`, identyfikator konta jest stosowany do rozstrzygniętego ostatniego kanału, jeśli obsługuje konta; w przeciwnym razie jest ignorowany. Jeśli identyfikator konta nie pasuje do skonfigurowanego konta dla rozstrzygniętego kanału, dostarczenie jest pomijane.
- `prompt`: nadpisuje domyślną treść promptu (bez łączenia).
- `ackMaxChars`: maks. liczba znaków dozwolona po `HEARTBEAT_OK` przed dostarczeniem.
- `suppressToolErrorWarnings`: gdy ustawione na true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `activeHours`: ogranicza uruchomienia Heartbeat do okna czasowego. Obiekt z `start` (HH:MM, włącznie; użyj `00:00` dla początku dnia), `end` (HH:MM, wyłącznie; `24:00` dozwolone dla końca dnia) oraz opcjonalnym `timezone`.
  - Pominięte lub `"user"`: używa `agents.defaults.userTimezone`, jeśli ustawiono, w przeciwnym razie przechodzi do strefy czasowej systemu hosta.
  - `"local"`: zawsze używa strefy czasowej systemu hosta.
  - Dowolny identyfikator IANA (np. `America/New_York`): używany bezpośrednio; jeśli jest nieprawidłowy, następuje przejście do zachowania `"user"` opisanego wyżej.
  - `start` i `end` nie mogą być równe dla aktywnego okna; równe wartości są traktowane jako zerowa szerokość (zawsze poza oknem).
  - Poza aktywnym oknem heartbeat jest pomijany aż do następnego tyknięcia mieszczącego się w oknie.

## Zachowanie dostarczania

- Domyślnie heartbeat jest uruchamiany w głównej sesji agenta (`agent:<id>:<mainKey>`),
  albo w `global`, gdy `session.scope = "global"`. Ustaw `session`, aby nadpisać to na
  konkretną sesję kanału (Discord/WhatsApp/itd.).
- `session` wpływa tylko na kontekst uruchomienia; dostarczanie jest kontrolowane przez `target` i `to`.
- Aby dostarczać do konkretnego kanału/odbiorcy, ustaw `target` + `to`. Przy
  `target: "last"` dostarczanie używa ostatniego zewnętrznego kanału dla tej sesji.
- Domyślnie dostarczanie Heartbeat zezwala na cele bezpośrednie/DM. Ustaw `directPolicy: "block"`, aby wyciszyć wysyłkę do celów bezpośrednich, jednocześnie nadal uruchamiając turę Heartbeat.
- Jeśli główna kolejka jest zajęta, heartbeat zostaje pominięty i ponowiony później.
- Jeśli `target` nie zostanie rozstrzygnięty do żadnego zewnętrznego miejsca docelowego, uruchomienie i tak nastąpi, ale żadna wiadomość wychodząca nie zostanie wysłana.
- Jeśli `showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone, uruchomienie jest pomijane z góry jako `reason=alerts-disabled`.
- Jeśli wyłączone jest tylko dostarczanie alertów, OpenClaw nadal może uruchomić heartbeat, zaktualizować znaczniki czasu należnych zadań, przywrócić znacznik czasu bezczynności sesji i wyciszyć zewnętrzny ładunek alertu.
- Jeśli rozstrzygnięty cel Heartbeat obsługuje wskaźnik pisania, OpenClaw pokazuje pisanie, gdy uruchomienie Heartbeat jest aktywne. Używa to tego samego celu, do którego Heartbeat wysłałby wynik czatu, i jest wyłączane przez `typingMode: "never"`.
- Odpowiedzi wyłącznie heartbeat **nie** podtrzymują aktywności sesji; ostatnie `updatedAt`
  zostaje przywrócone, aby wygasanie bezczynności działało normalnie.
- Odłączone [zadania w tle](/pl/automation/tasks) mogą dodać zdarzenie systemowe do kolejki i wybudzić Heartbeat, gdy główna sesja powinna szybko coś zauważyć. Takie wybudzenie nie sprawia, że uruchomienie Heartbeat staje się zadaniem w tle.

## Kontrola widoczności

Domyślnie potwierdzenia `HEARTBEAT_OK` są wyciszane, a treść alertów jest
dostarczana. Możesz to dostosować dla każdego kanału lub konta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ukryj HEARTBEAT_OK (domyślnie)
      showAlerts: true # Pokazuj komunikaty alertów (domyślnie)
      useIndicator: true # Emituj zdarzenia wskaźnika (domyślnie)
  telegram:
    heartbeat:
      showOk: true # Pokazuj potwierdzenia OK w Telegramie
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Wycisz dostarczanie alertów dla tego konta
```

Priorytet: per konto → per kanał → domyślne kanału → wbudowane domyślne.

### Co robi każda flaga

- `showOk`: wysyła potwierdzenie `HEARTBEAT_OK`, gdy model zwraca odpowiedź zawierającą tylko OK.
- `showAlerts`: wysyła treść alertu, gdy model zwraca odpowiedź inną niż OK.
- `useIndicator`: emituje zdarzenia wskaźnika dla powierzchni statusu UI.

Jeśli **wszystkie trzy** są ustawione na false, OpenClaw całkowicie pomija uruchomienie Heartbeat (bez wywołania modelu).

### Przykłady per kanał a per konto

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
| Zachowanie domyślne (ciche OK, alerty włączone) | _(konfiguracja nie jest potrzebna)_                                                      |
| Pełna cisza (bez wiadomości, bez wskaźnika) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Tylko wskaźnik (bez wiadomości)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK tylko w jednym kanale                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## `HEARTBEAT.md` (opcjonalnie)

Jeśli w obszarze roboczym istnieje plik `HEARTBEAT.md`, domyślny prompt mówi
agentowi, aby go odczytał. Potraktuj go jako swoją „listę kontrolną heartbeat”:
małą, stabilną i bezpieczną do dołączania co 30 minut.

Podczas zwykłych uruchomień `HEARTBEAT.md` jest wstrzykiwany tylko wtedy, gdy
wskazówki Heartbeat są włączone dla domyślnego agenta. Wyłączenie częstotliwości heartbeat przez `0m` albo ustawienie `includeSystemPromptSection: false` powoduje pominięcie go w zwykłym kontekście bootstrap.

Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki markdown
takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API.
To pominięcie jest raportowane jako `reason=empty-heartbeat-file`.
Jeśli pliku nie ma, Heartbeat nadal działa, a model sam decyduje, co zrobić.

Plik powinien być mały (krótka lista kontrolna albo przypomnienia), aby uniknąć rozrostu promptu.

Przykład `HEARTBEAT.md`:

```md
# Lista kontrolna heartbeat

- Szybki przegląd: czy w skrzynkach jest coś pilnego?
- Jeśli jest dzień, wykonaj lekkie sprawdzenie, jeśli nic innego nie oczekuje.
- Jeśli jakieś zadanie jest zablokowane, zapisz _czego brakuje_ i zapytaj Petera następnym razem.
```

### Bloki `tasks:`

`HEARTBEAT.md` obsługuje też mały ustrukturyzowany blok `tasks:` do kontroli
sprawdzania według interwałów wewnątrz samego Heartbeat.

Przykład:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Sprawdź pilne nieprzeczytane e-maile i oznacz wszystko, co jest wrażliwe czasowo."
- name: calendar-scan
  interval: 2h
  prompt: "Sprawdź nadchodzące spotkania, które wymagają przygotowania lub działań następczych."

# Dodatkowe instrukcje

- Alerty powinny być krótkie.
- Jeśli po wszystkich należnych zadaniach nic nie wymaga uwagi, odpowiedz HEARTBEAT_OK.
```

Zachowanie:

- OpenClaw analizuje blok `tasks:` i sprawdza każde zadanie względem jego własnego `interval`.
- Do promptu heartbeat dla danego tyknięcia dołączane są tylko zadania, które są **należne**.
- Jeśli żadne zadania nie są należne, heartbeat jest całkowicie pomijany (`reason=no-tasks-due`), aby uniknąć niepotrzebnego wywołania modelu.
- Treść spoza zadań w `HEARTBEAT.md` jest zachowywana i dołączana jako dodatkowy kontekst po liście należnych zadań.
- Znaczniki czasu ostatniego uruchomienia zadań są przechowywane w stanie sesji (`heartbeatTaskState`), więc interwały przetrwają zwykłe restarty.
- Znaczniki czasu zadań są aktualizowane dopiero po tym, jak uruchomienie Heartbeat przejdzie normalną ścieżkę odpowiedzi. Pominięte uruchomienia `empty-heartbeat-file` / `no-tasks-due` nie oznaczają zadań jako ukończonych.

Tryb zadań jest przydatny, gdy chcesz, aby jeden plik heartbeat zawierał kilka okresowych kontroli bez płacenia za wszystkie przy każdym tyknięciu.

### Czy agent może aktualizować `HEARTBEAT.md`?

Tak — jeśli mu to zlecisz.

`HEARTBEAT.md` to po prostu zwykły plik w obszarze roboczym agenta, więc możesz powiedzieć
agentowi (w normalnym czacie) coś takiego:

- „Zaktualizuj `HEARTBEAT.md`, aby dodać codzienne sprawdzenie kalendarza.”
- „Przepisz `HEARTBEAT.md`, aby był krótszy i skupiał się na działaniach następczych w skrzynce odbiorczej.”

Jeśli chcesz, aby działo się to proaktywnie, możesz też dodać jawny wiersz do
swojego promptu heartbeat, na przykład: „Jeśli lista kontrolna się zestarzeje, zaktualizuj HEARTBEAT.md
na lepszą.”

Uwaga dotycząca bezpieczeństwa: nie umieszczaj sekretów (kluczy API, numerów telefonów, prywatnych tokenów) w
`HEARTBEAT.md` — staje się on częścią kontekstu promptu.

## Ręczne wybudzenie (na żądanie)

Możesz dodać zdarzenie systemowe do kolejki i natychmiast wyzwolić Heartbeat poleceniem:

```bash
openclaw system event --text "Sprawdź pilne działania następcze" --mode now
```

Jeśli wielu agentów ma skonfigurowany `heartbeat`, ręczne wybudzenie natychmiast uruchamia Heartbeat każdego z nich.

Użyj `--mode next-heartbeat`, aby poczekać na następne zaplanowane tyknięcie.

## Dostarczanie uzasadnienia (opcjonalnie)

Domyślnie heartbeaty dostarczają tylko końcowy ładunek „odpowiedzi”.

Jeśli chcesz większej przejrzystości, włącz:

- `agents.defaults.heartbeat.includeReasoning: true`

Gdy ta opcja jest włączona, heartbeaty dostarczają także osobną wiadomość z prefiksem
`Reasoning:` (w tej samej postaci co `/reasoning on`). Może to być przydatne, gdy agent
zarządza wieloma sesjami/codexami i chcesz zobaczyć, dlaczego zdecydował się
Cię pingnąć — ale może też ujawnić więcej szczegółów wewnętrznych, niż chcesz. Lepiej pozostawić to wyłączone w czatach grupowych.

## Świadomość kosztów

Heartbeaty uruchamiają pełne tury agenta. Krótsze interwały zużywają więcej tokenów. Aby obniżyć koszt:

- Użyj `isolatedSession: true`, aby uniknąć wysyłania pełnej historii rozmowy (z ~100 tys. tokenów do ~2–5 tys. na uruchomienie).
- Użyj `lightContext: true`, aby ograniczyć pliki bootstrap tylko do `HEARTBEAT.md`.
- Ustaw tańszy `model` (np. `ollama/llama3.2:1b`).
- Plik `HEARTBEAT.md` powinien być mały.
- Użyj `target: "none"`, jeśli chcesz tylko wewnętrznych aktualizacji stanu.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — jak śledzona jest praca odłączona
- [Strefa czasowa](/pl/concepts/timezone) — jak strefa czasowa wpływa na planowanie Heartbeat
- [Rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting) — debugowanie problemów z automatyzacją
