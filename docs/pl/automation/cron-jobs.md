---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooki, Gmail) do OpenClaw
    - Wybór między heartbeat a cron dla zaplanowanych zadań
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-05T13:43:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43b906914461aba9af327e7e8c22aa856f65802ec2da37ed0c4f872d229cfde6
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać dane wyjściowe z powrotem do kanału czatu lub punktu końcowego webhooka.

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

# See run history
openclaw cron runs --id <job-id>
```

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Zadania są zapisywane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym wykonaniu.
- Izolowane uruchomienia cron przy zakończeniu wykonania próbują zamknąć śledzone karty/procesy przeglądarki dla sesji `cron:<jobId>`, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją stanu (`on it`, `pulling everything together` i podobne wskazówki) i żadne podrzędne uruchomienie subagenta nie odpowiada już za końcową odpowiedź, OpenClaw ponawia prompt raz, aby uzyskać właściwy wynik przed dostarczeniem.

Uzgadnianie zadań dla cron jest zarządzane przez środowisko uruchomieniowe: aktywne zadanie cron pozostaje aktywne, dopóki środowisko wykonawcze cron nadal śledzi dane zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji podrzędnej.
Gdy środowisko wykonawcze przestanie zarządzać zadaniem i upłynie 5-minutowe okno karencji, mechanizm utrzymania może oznaczyć zadanie jako `lost`.

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby używać harmonogramu według lokalnego czasu ściennego.

Powtarzające się wyrażenia uruchamiane o pełnej godzinie są automatycznie rozpraszane do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjne uruchamianie, albo `--stagger 30s`, aby ustawić jawne okno.

## Style wykonania

| Styl           | Wartość `--session`  | Uruchamiane w             | Najlepsze do                    |
| -------------- | -------------------- | ------------------------- | ------------------------------- |
| Sesja główna   | `main`               | Następny obrót heartbeat  | Przypomnienia, zdarzenia systemowe |
| Izolowane      | `isolated`           | Dedykowana `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja  | `current`            | Powiązane podczas tworzenia | Cykliczna praca zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja   | Przepływy pracy budujące na historii |

Zadania **sesji głównej** umieszczają zdarzenie systemowe w kolejce i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Zadania **izolowane** uruchamiają dedykowany obrót agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) zachowują kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy, które bazują na poprzednich podsumowaniach.

W przypadku zadań izolowanych zamykanie środowiska wykonawczego obejmuje teraz próbę wyczyszczenia przeglądarki dla tej sesji cron. Błędy czyszczenia są ignorowane, aby rzeczywisty wynik cron nadal miał pierwszeństwo.

Gdy izolowane uruchomienia cron koordynują pracę subagentów, dostarczanie także preferuje końcowe dane wyjściowe potomne zamiast nieaktualnego tymczasowego tekstu nadrzędnego. Jeśli potomkowie nadal działają, OpenClaw pomija tę częściową aktualizację nadrzędną zamiast ją ogłaszać.

### Opcje ładunku dla zadań izolowanych

- `--message`: tekst promptu (wymagany dla izolowanych)
- `--model` / `--thinking`: nadpisania modelu i poziomu myślenia
- `--light-context`: pomiń wstrzykiwanie pliku bootstrap obszaru roboczego
- `--tools exec,read`: ogranicz, których narzędzi zadanie może używać

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model nie jest dozwolony, cron zapisuje ostrzeżenie i zamiast tego wraca do wyboru modelu agenta/domyślnego dla zadania. Skonfigurowane łańcuchy fallbacków nadal obowiązują, ale zwykłe nadpisanie modelu bez jawnej listy fallbacków dla zadania nie dołącza już podstawowego modelu agenta jako ukrytego dodatkowego celu ponowienia.

Kolejność pierwszeństwa wyboru modelu dla zadań izolowanych jest następująca:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodzi z Gmaila i to nadpisanie jest dozwolone)
2. `model` w ładunku dla danego zadania
3. Zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozstrzygniętym bieżącym wyborem. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron domyślnie go używa. Zapisane nadpisanie `fastMode` dla sesji nadal ma pierwszeństwo wobec konfiguracji w obu kierunkach.

Jeśli izolowane uruchomienie napotka przekazanie do aktywnego przełączenia modelu, cron ponawia próbę z przełączonym dostawcą/modelem i zapisuje ten bieżący wybór przed ponowieniem. Gdy przełączenie obejmuje także nowy profil uwierzytelniania, cron zapisuje również to nadpisanie profilu uwierzytelniania. Liczba ponowień jest ograniczona: po początkowej próbie oraz 2 ponowieniach przełączenia cron przerywa działanie zamiast zapętlać się bez końca.

## Dostarczanie i dane wyjściowe

| Tryb      | Co się dzieje                                           |
| --------- | ------------------------------------------------------- |
| `announce` | Dostarcza podsumowanie do docelowego kanału (domyślnie dla izolowanych) |
| `webhook`  | Wysyła ładunek zdarzenia zakończenia metodą POST na URL |
| `none`     | Tylko wewnętrznie, bez dostarczania                     |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`).

Dla izolowanych zadań zarządzanych przez cron ścieżką końcowego dostarczenia zarządza wykonawca. Agent otrzymuje prompt, aby zwrócić podsumowanie w postaci zwykłego tekstu, a następnie to podsumowanie jest wysyłane przez `announce`, `webhook` lub pozostaje wewnętrzne dla `none`. `--no-deliver` nie przekazuje dostarczania z powrotem agentowi; utrzymuje uruchomienie jako wewnętrzne.

Jeśli oryginalne zadanie wyraźnie nakazuje wysłanie wiadomości do jakiegoś zewnętrznego odbiorcy, agent powinien wskazać w swoich danych wyjściowych, do kogo/gdzie ta wiadomość powinna trafić, zamiast próbować wysłać ją bezpośrednio.

Powiadomienia o niepowodzeniu korzystają z oddzielnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniu.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniu teraz wracają domyślnie do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań z `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.

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

Gateway może udostępniać punkty końcowe webhooków HTTP dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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

Tokeny w ciągu zapytania są odrzucane.

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

Uruchamia izolowany obrót agenta:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zmapowane hooki (POST /hooks/\<name\>)

Niestandardowe nazwy hooków są rozstrzygane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki na akcje `wake` lub `agent` przy użyciu szablonów albo transformacji kodem.

### Bezpieczeństwo

- Utrzymuj punkty końcowe hooków za loopbackiem, tailnetem lub zaufanym reverse proxy.
- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Utrzymuj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne trasowanie `agentId`.
- Utrzymuj `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowywane granicami bezpieczeństwa.

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki odbiorczej Gmail do OpenClaw przez Google PubSub.

**Wymagania wstępne**: CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i `hooks.gmail.account` jest ustawione, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

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

3. Uruchom obserwację:

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

Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładnie ten dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony, cron wyświetla ostrzeżenie i wraca do wyboru modelu agenta/domyślnego dla zadania.
- Skonfigurowane łańcuchy fallbacków nadal obowiązują, ale zwykłe nadpisanie `--model` bez jawnej listy fallbacków dla zadania nie przechodzi już do modelu podstawowego agenta jako cichego dodatkowego celu ponowienia.

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

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

**Ponowienie zadania jednorazowego**: błędy przejściowe (limit żądań, przeciążenie, sieć, błąd serwera) są ponawiane maksymalnie 3 razy z wykładniczym opóźnieniem. Błędy trwałe natychmiast wyłączają zadanie.

**Ponowienie zadania cyklicznego**: wykładnicze opóźnienie (od 30 s do 60 min) między kolejnymi próbami. Opóźnienie zeruje się po następnym udanym uruchomieniu.

**Utrzymanie**: `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dzienników uruchomień.

## Rozwiązywanie problemów

### Sekwencja poleceń

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
- W przypadku harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
- `reason: not-due` w danych wyjściowych uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due`, a zadanie nie było jeszcze wymagalne.

### Cron uruchomił się, ale nic nie dostarczono

- Tryb dostarczania `none` oznacza, że nie należy oczekiwać żadnej zewnętrznej wiadomości.
- Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka została pominięta.
- Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
- Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczanie wychodzące, a także pomija awaryjną ścieżkę podsumowania w kolejce, więc nic nie zostanie opublikowane z powrotem na czacie.
- W przypadku izolowanych zadań zarządzanych przez cron nie oczekuj, że agent użyje narzędzia wiadomości jako fallbacku. Wykonawca zarządza końcowym dostarczeniem; `--no-deliver` utrzymuje je jako wewnętrzne zamiast zezwalać na bezpośrednią wysyłkę.

### Pułapki związane ze strefami czasowymi

- Cron bez `--tz` używa strefy czasowej hosta gateway.
- Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
- `activeHours` heartbeat używa skonfigurowanego rozstrzygania strefy czasowej.

## Powiązane

- [Automatyzacja i zadania](/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/gateway/heartbeat) — okresowe obroty sesji głównej
- [Strefa czasowa](/concepts/timezone) — konfiguracja strefy czasowej
