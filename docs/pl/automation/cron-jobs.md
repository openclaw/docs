---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhooki, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-24T08:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram Gateway. Trwale zapisuje zadania, wybudza agenta we właściwym czasie i może dostarczać dane wyjściowe z powrotem do kanału czatu lub punktu końcowego Webhook.

## Szybki start

```bash
# Dodaj jednorazowe przypomnienie
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Sprawdź swoje zadania
openclaw cron list
openclaw cron show <job-id>

# Zobacz historię uruchomień
openclaw cron runs --id <job-id>
```

## Jak działa cron

- Cron działa **wewnątrz** procesu Gateway (nie wewnątrz modelu).
- Definicje zadań są trwale zapisywane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest trwale zapisywany obok w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json`, a `jobs-state.json` dodaj do `gitignore`.
- Po tym rozdzieleniu starsze wersje OpenClaw mogą odczytywać `jobs.json`, ale mogą traktować zadania jako świeże, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym zakończeniu.
- Izolowane uruchomienia cron po zakończeniu wykonują best-effort zamknięcie śledzonych kart/przetwarzanych procesów przeglądarki dla swojej sesji `cron:<jobId>`, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron chronią również przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli
  pierwszy wynik to tylko tymczasowa aktualizacja stanu (`on it`, `pulling everything
together` i podobne wskazówki), a żadne podrzędne uruchomienie subagenta nie jest już
  odpowiedzialne za odpowiedź końcową, OpenClaw ponawia prompt raz, aby uzyskać rzeczywisty
  wynik przed dostarczeniem.

<a id="maintenance"></a>

Rekonsyliacja zadań dla cron jest zarządzana przez runtime: aktywne zadanie cron pozostaje aktywne, dopóki
runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji podrzędnej.
Gdy runtime przestaje być właścicielem zadania i upłynie 5-minutowe okno karencji, maintenance może
oznaczyć zadanie jako `lost`.

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                           |
| ------- | --------- | -------------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`)  |
| `every` | `--every` | Stały interwał                                                 |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz`      |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramu według lokalnego czasu zegarowego.

Powtarzające się wyrażenia o pełnej godzinie są automatycznie rozkładane z przesunięciem do 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić dokładny czas, lub `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pola dnia miesiąca, jak i dnia tygodnia nie są wildcardami, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie Vixie cron.

```
# Zamierzone: "9:00 piętnastego dnia miesiąca, tylko jeśli to poniedziałek"
# Faktyczne:  "9:00 każdego piętnastego dnia miesiąca ORAZ 9:00 w każdy poniedziałek"
0 9 15 * 1
```

Uruchamia się to około 5–6 razy w miesiącu zamiast 0–1 raz w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` w Croner (`0 9 15 * +1`) albo ustaw harmonogram według jednego pola, a drugie sprawdzaj w prompcie lub poleceniu swojego zadania.

## Style wykonywania

| Styl            | Wartość `--session` | Uruchamiane w             | Najlepsze do                    |
| --------------- | ------------------- | ------------------------- | ------------------------------- |
| Sesja główna    | `main`              | Następny Heartbeat        | Przypomnienia, zdarzenia systemowe |
| Izolowany       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązane w chwili utworzenia | Powtarzalna praca zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja   | Przepływy pracy budujące na historii |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowaną turę agenta z nową sesją. **Sesje niestandardowe** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy, które bazują na poprzednich podsumowaniach.

Dla zadań izolowanych zamykanie runtime obejmuje teraz best-effort czyszczenie przeglądarki dla tej sesji cron. Błędy czyszczenia są ignorowane, aby rzeczywisty wynik cron nadal miał pierwszeństwo.

Izolowane uruchomienia cron usuwają również wszystkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia runtime. Odpowiada to sposobowi zamykania klientów MCP dla sesji głównej i sesji niestandardowych, dzięki czemu izolowane zadania cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczanie preferuje również końcowe
dane wyjściowe potomka zamiast nieaktualnego tekstu tymczasowego rodzica. Jeśli potomkowie nadal się
uruchamiają, OpenClaw pomija tę częściową aktualizację rodzica zamiast ją ogłaszać.

### Opcje ładunku dla zadań izolowanych

- `--message`: tekst promptu (wymagany dla izolowanych)
- `--model` / `--thinking`: nadpisania modelu i poziomu myślenia
- `--light-context`: pomiń wstrzykiwanie plików bootstrap obszaru roboczego
- `--tools exec,read`: ogranicz, których narzędzi zadanie może używać

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model
nie jest dozwolony, cron zapisuje ostrzeżenie w logu i wraca do wyboru modelu agenta/domylślnego dla zadania.
Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie modelu bez jawnej listy fallbacków dla zadania nie dopina już podstawowego modelu agenta jako ukrytego dodatkowego celu ponowienia.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Przechowywane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozstrzygniętym wyborem na żywo. Jeśli wybrana konfiguracja modelu
ma `params.fastMode`, izolowany cron domyślnie używa tej wartości. Przechowywane nadpisanie sesji
`fastMode` nadal ma pierwszeństwo nad konfiguracją w obie strony.

Jeśli izolowane uruchomienie trafi na przekazanie z aktywnym przełączeniem modelu, cron ponawia próbę z
przełączonym dostawcą/modelem i zapisuje ten wybór na żywo przed ponowną próbą. Gdy przełączenie niesie
także nowy profil uwierzytelniania, cron zapisuje również to nadpisanie profilu uwierzytelniania.
Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach po przełączeniu cron przerywa zamiast zapętlać się bez końca.

## Dostarczanie i dane wyjściowe

| Tryb       | Co się dzieje                                                      |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Zastępczo dostarcza końcowy tekst do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła metodą POST ładunek zdarzenia zakończonego do URL           |
| `none`     | Brak zastępczego dostarczania przez runner                         |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

Dla zadań izolowanych dostarczanie czatu jest współdzielone. Jeśli dostępna jest trasa czatu,
agent może używać narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli
agent wyśle do skonfigurowanego/bieżącego celu, OpenClaw pomija zastępcze ogłoszenie.
W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co
runner robi z końcową odpowiedzią po turze agenta.

Powiadomienia o błędach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach wracają teraz domyślnie do tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowy tryb dostarczania to `webhook`.

## Przykłady CLI

Jednorazowe przypomnienie (sesja główna):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Powtarzalne zadanie izolowane z dostarczaniem:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Zadanie izolowane z nadpisaniem modelu i poziomu myślenia:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooki

Gateway może udostępniać punkty końcowe HTTP Webhook dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Uwierzytelnianie

Każde żądanie musi zawierać token hooka w nagłówku:

- `Authorization: Bearer <token>` (zalecane)
- `x-openclaw-token: <token>`

Tokeny w query string nie są akceptowane.

### POST /hooks/wake

Umieszcza zdarzenie systemowe w kolejce dla sesji głównej:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wymagane): opis zdarzenia
- `mode` (opcjonalne): `now` (domyślnie) lub `next-heartbeat`

### POST /hooks/agent

Uruchamia izolowaną turę agenta:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapowane hooki (POST /hooks/\<name\>)

Niestandardowe nazwy hooków są rozstrzygane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodem.

### Bezpieczeństwo

- Trzymaj punkty końcowe hooków za local loopback, tailnetem lub zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Trzymaj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne trasowanie `agentId`.
- Zachowaj `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączasz `hooks.allowRequestSessionKey`, ustaw również `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowywane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja przez kreator (zalecana)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i `hooks.gmail.account` jest ustawione, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia watch. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

1. Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Utwórz topic i przyznaj Gmail dostęp push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Uruchom watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Nadpisanie modelu Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Zarządzanie zadaniami

```bash
# Wyświetl wszystkie zadania
openclaw cron list

# Pokaż jedno zadanie, w tym rozstrzygniętą trasę dostarczania
openclaw cron show <jobId>

# Edytuj zadanie
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Wymuś uruchomienie zadania teraz
openclaw cron run <jobId>

# Uruchom tylko, jeśli termin już nadszedł
openclaw cron run <jobId> --due

# Wyświetl historię uruchomień
openclaw cron runs --id <jobId> --limit 50

# Usuń zadanie
openclaw cron remove <jobId>

# Wybór agenta (konfiguracje z wieloma agentami)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładnie ten dostawca/model trafia do izolowanego
  uruchomienia agenta.
- Jeśli nie jest dozwolony, cron zapisuje ostrzeżenie i wraca do wyboru
  modelu agenta/domyślnego dla zadania.
- Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie `--model`
  bez jawnej listy fallbacków dla zadania nie przechodzi już do podstawowego modelu agenta
  jako cichego dodatkowego celu ponowienia.

## Konfiguracja

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Sidecar stanu runtime jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak
`~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu
bez sufiksu `.json` dopisuje `-state.json`.

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponowienia dla zadań jednorazowych**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane maksymalnie 3 razy z wykładniczym backoffem. Błędy trwałe wyłączają zadanie natychmiast.

**Ponowienia dla zadań cyklicznych**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

**Maintenance**: `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki logów uruchomień.

## Rozwiązywanie problemów

### Drabinka poleceń

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron się nie uruchamia

- Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
- Potwierdź, że Gateway działa bez przerwy.
- Dla harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w danych wyjściowych uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due` i termin zadania jeszcze nie nadszedł.

### Cron uruchomił się, ale nic nie zostało dostarczone

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać zastępczego wysłania przez runner. Agent
  nadal może wysłać wiadomość bezpośrednio narzędziem `message`, gdy dostępna jest trasa czatu.
- Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka została pominięta.
- Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`),
  OpenClaw pomija bezpośrednie dostarczanie wychodzące, a także pomija zastępczą
  ścieżkę podsumowania w kolejce, więc nic nie jest publikowane z powrotem do czatu.
- Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma używalną
  trasę (`channel: "last"` z poprzednim czatem lub jawny kanał/cel).

### Pułapki związane ze strefami czasowymi

- Cron bez `--tz` używa strefy czasowej hosta gateway.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- Heartbeat `activeHours` używa rozstrzygania skonfigurowanej strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
