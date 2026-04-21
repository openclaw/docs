---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Decydowanie między Heartbeat a Cron dla zaplanowanych zadań
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-21T09:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać dane wyjściowe z powrotem do kanału czatu lub punktu końcowego Webhook.

## Szybki start

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok, w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json`, a `jobs-state.json` dodaj do `gitignore`.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako świeże, ponieważ pola środowiska uruchomieniowego znajdują się teraz w `jobs-state.json`.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia cron przy zakończeniu wykonują w miarę możliwości zamknięcie śledzonych kart/przeglądarek i procesów dla swojej sesji `cron:<jobId>`, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli
  pierwszy wynik to tylko tymczasowa aktualizacja stanu (`on it`, `pulling everything
together` i podobne wskazówki), a żadne podrzędne uruchomienie subagenta nie
  odpowiada już za końcową odpowiedź, OpenClaw ponawia prompt raz, aby uzyskać
  rzeczywisty wynik przed dostarczeniem.

<a id="maintenance"></a>

Uzgadnianie zadań dla cron jest własnością środowiska uruchomieniowego: aktywne zadanie cron pozostaje aktywne, dopóki
środowisko cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji podrzędnej.
Gdy środowisko przestaje być właścicielem zadania i upłynie 5-minutowe okno karencji, konserwacja może
oznaczyć zadanie jako `lost`.

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                          |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                                |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz`     |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` do harmonogramowania według lokalnego czasu zegarowego.

Powtarzające się wyrażenia na pełną godzinę są automatycznie rozpraszane maksymalnie do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić dokładny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie cron Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 raz w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR z Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` z Croner (`0 9 15 * +1`) albo zaplanuj według jednego pola i sprawdzaj drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w          | Najlepsze dla                   |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna    | `main`              | Następny Heartbeat turn  | Przypomnienia, zdarzenia systemowe |
| Izolowany       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązana w czasie tworzenia | Praca cykliczna zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budowane na historii |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowany turn agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy, które bazują na poprzednich podsumowaniach.

Dla zadań izolowanych zamykanie środowiska uruchomieniowego obejmuje teraz także czyszczenie przeglądarki dla tej sesji cron, wykonywane w miarę możliwości. Błędy czyszczenia są ignorowane, aby faktyczny wynik cron nadal miał pierwszeństwo.

Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczanie preferuje także końcowy
wynik potomny zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal
działają, OpenClaw pomija tę częściową aktualizację rodzica zamiast ją ogłaszać.

### Opcje payloadu dla zadań izolowanych

- `--message`: tekst promptu (wymagany dla izolowanych)
- `--model` / `--thinking`: nadpisania modelu i poziomu myślenia
- `--light-context`: pomiń wstrzykiwanie plików bootstrap obszaru roboczego
- `--tools exec,read`: ogranicz, których narzędzi zadanie może używać

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model
nie jest dozwolony, cron zapisuje ostrzeżenie w logach i wraca do wyboru modelu
agenta/domyślnego dla zadania. Skonfigurowane łańcuchy fallback nadal mają zastosowanie,
ale zwykłe nadpisanie modelu bez jawnej listy fallback per zadanie nie dołącza już
głównego modelu agenta jako ukrytego dodatkowego celu ponowienia.

Priorytet wyboru modelu dla zadań izolowanych jest następujący:

1. Nadpisanie modelu przez hook Gmaila (gdy uruchomienie pochodzi z Gmaila i to nadpisanie jest dozwolone)
2. `model` w payloadzie zadania
3. Zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozstrzygniętym wyborem na żywo. Jeśli wybrana konfiguracja modelu
ma `params.fastMode`, izolowany cron domyślnie używa tego ustawienia. Zapisane nadpisanie
`fastMode` sesji nadal ma pierwszeństwo względem konfiguracji w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie live model-switch, cron ponawia próbę z
przełączonym dostawcą/modelem i utrwala ten wybór live przed ponowieniem. Gdy przełączenie
obejmuje także nowy profil autoryzacji, cron utrwala również to nadpisanie profilu autoryzacji.
Ponowienia są ograniczone: po początkowej próbie oraz 2 ponowieniach przełączenia
cron przerywa zamiast zapętlać się bez końca.

## Dostarczanie i dane wyjściowe

| Tryb      | Co się dzieje                                                    |
| --------- | ---------------------------------------------------------------- |
| `announce` | Awaryjnie dostarcz końcowy tekst do celu, jeśli agent go nie wysłał |
| `webhook`  | Wyślij payload zdarzenia zakończenia metodą POST na URL          |
| `none`     | Brak awaryjnego dostarczania przez runner                        |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. Dla tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

Dla zadań izolowanych dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna,
agent może użyć narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli
agent wyśle do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne ogłoszenie.
W przeciwnym razie `announce`, `webhook` i `none` sterują tylko tym, co runner robi z
końcową odpowiedzią po turnie agenta.

Powiadomienia o niepowodzeniu podążają osobną ścieżką celu:

- `cron.failureDestination` ustawia globalną domyślną wartość dla powiadomień o niepowodzeniu.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniu wracają teraz awaryjnie do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach z `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.

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

Cykliczne zadanie izolowane z dostarczaniem:

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

Zadanie izolowane z nadpisaniem modelu i myślenia:

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

Tokeny w query string są odrzucane.

### POST /hooks/wake

Umieść zdarzenie systemowe w kolejce dla sesji głównej:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wymagane): opis zdarzenia
- `mode` (opcjonalne): `now` (domyślnie) lub `next-heartbeat`

### POST /hooks/agent

Uruchom izolowany turn agenta:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapowane hooki (POST /hooks/\<name\>)

Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolny payload w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodem.

### Bezpieczeństwo

- Utrzymuj punkty końcowe hooków za loopbackiem, tailnetem lub zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów autoryzacji gateway.
- Utrzymuj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne routowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty klucza sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki Gmail do OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja przez kreatora (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia watch. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

### Ręczna jednorazowa konfiguracja

1. Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Utwórz temat i przyznaj Gmailowi dostęp push:

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
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Uwaga o nadpisaniu modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładnie ten dostawca/model trafia do izolowanego
  uruchomienia agenta.
- Jeśli nie jest dozwolony, cron wyświetla ostrzeżenie i wraca do wyboru modelu
  agenta/domyślnego dla zadania.
- Skonfigurowane łańcuchy fallback nadal mają zastosowanie, ale zwykłe nadpisanie `--model`
  bez jawnej listy fallback per zadanie nie przechodzi już do głównego modelu
  agenta jako cichego dodatkowego celu ponowienia.

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

Towarzyszący plik stanu środowiska uruchomieniowego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak
`~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu
bez sufiksu `.json` dopisuje `-state.json`.

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponowienia dla zadań jednorazowych**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane maksymalnie 3 razy z wykładniczym backoff. Błędy trwałe powodują natychmiastowe wyłączenie.

**Ponowienia dla zadań cyklicznych**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

**Konserwacja**: `cron.sessionRetention` (domyślnie `24h`) przycina wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki logów uruchomień.

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
- Potwierdź, że Gateway działa nieprzerwanie.
- Dla harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w danych wyjściowych uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due` i zadanie nie było jeszcze należne.

### Cron uruchomił się, ale nic nie zostało dostarczone

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać awaryjnego wysłania przez runner. Agent
  nadal może wysłać wiadomość bezpośrednio narzędziem `message`, gdy trasa czatu jest dostępna.
- Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
- Błędy autoryzacji kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`),
  OpenClaw pomija bezpośrednie dostarczanie wychodzące i pomija także awaryjną
  ścieżkę podsumowania w kolejce, więc nic nie jest publikowane z powrotem na czacie.
- Jeśli agent ma sam wysłać wiadomość użytkownikowi, sprawdź, czy zadanie ma używalną
  trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

### Pułapki związane ze strefą czasową

- Cron bez `--tz` używa strefy czasowej hosta gateway.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- Heartbeat `activeHours` używa skonfigurowanego rozwiązywania strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe turny sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
