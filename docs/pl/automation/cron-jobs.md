---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhook, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhook i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-06T17:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać dane wyjściowe z powrotem do kanału czatu lub endpointu Webhook.

## Szybki start

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Jak działa Cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok, w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje Cron w git, śledź `jobs.json` i dodaj `jobs-state.json` do gitignore.
- Po podziale starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` jest edytowany podczas działania Gateway lub po jego zatrzymaniu, OpenClaw porównuje zmienione pola harmonogramu z metadanymi oczekującego slotu czasu działania i czyści nieaktualne wartości `nextRunAtMs`. Zmiany wyłącznie formatowania lub kolejności kluczy zachowują oczekujący slot.
- Wszystkie wykonania Cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tury agenta są przeplanowywane poza okno łączenia kanałów zamiast odtwarzania natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po ponownych uruchomieniach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia Cron dokładają najlepszych starań, aby zamknąć śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, dzięki czemu odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia Cron, które otrzymają wąskie uprawnienie do samooczyszczania Cron, nadal mogą odczytywać status harmonogramu i samofiltrowaną listę swojego bieżącego zadania, więc kontrole statusu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do mutacji Cron.
- Izolowane uruchomienia Cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik to tylko tymczasowa aktualizacja statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie podagenta nie jest nadal odpowiedzialne za ostateczną odpowiedź, OpenClaw ponownie prosi raz o rzeczywisty wynik przed dostarczeniem.
- Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników końcowego podsumowania/danych wyjściowych, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, więc zablokowane polecenie nie jest zgłaszane jako zielone uruchomienie.
- Izolowane uruchomienia Cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstanie ładunek odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze przekroczenie limitu czasu, więc oczekująca praca czatu nie zostaje za nieaktualną sesją przetwarzania.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla Cron jest najpierw własnością czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie Cron pozostaje żywe, gdy środowisko uruchomieniowe Cron nadal śledzi to zadanie jako uruchomione, nawet jeśli stary wiersz sesji potomnej nadal istnieje. Gdy środowisko uruchomieniowe przestaje być właścicielem zadania, a 5-minutowe okno karencji wygasa, konserwacja sprawdza utrwalone logi uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik końcowy, rejestr zadań jest z niej finalizowany; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać dane z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie Cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramu

| Rodzaj | Flaga CLI | Opis |
| ------- | --------- | ------------------------------------------------------- |
| `at` | `--at` | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał |
| `cron` | `--cron` | 5-polowe lub 6-polowe wyrażenie Cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby harmonogram działał według lokalnego czasu zegarowego.

Cykliczne wyrażenia na początek godziny są automatycznie rozłożone losowo do 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, lub `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** pole, a nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5-6 razy w miesiącu zamiast 0-1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia Croner `+` (`0 9 15 * +1`) albo zaplanuj według jednego pola i zabezpiecz drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl | Wartość `--session` | Uruchamia się w | Najlepsze do |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna | `main` | Następna tura Heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowany | `isolated` | Dedykowane `cron:<jobId>` | Raporty, prace w tle |
| Bieżąca sesja | `current` | Powiązana w czasie tworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała sesja nazwana | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie przedłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety i jawnie wybrane przez użytkownika nadpisania modelu/uwierzytelniania, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza Cron: routingu kanału/grupy, polityki wysyłania lub kolejkowania, podniesienia uprawnień, źródła ani powiązania czasu działania ACP. Użyj `current` lub `session:<id>`, gdy zadanie cykliczne ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych kończenie czasu działania obejmuje teraz najlepsze starania w celu posprzątania przeglądarki dla tej sesji Cron. Awarie sprzątania są ignorowane, więc rzeczywisty wynik Cron nadal ma pierwszeństwo.

    Izolowane uruchomienia Cron usuwają też wszelkie dołączone instancje czasu działania MCP utworzone dla zadania przez współdzieloną ścieżkę sprzątania czasu działania. Odpowiada to sposobowi zamykania klientów MCP sesji głównej i sesji niestandardowej, więc izolowane zadania Cron nie wyciekają potomnych procesów stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia Cron orkiestrują podagentów, dostarczanie również preferuje końcowe dane wyjściowe potomka zamiast nieaktualnego tekstu tymczasowego rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    W przypadku tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane ładunki Discord nadal są dostarczane jako oddzielne ładunki, więc załączniki i komponenty nie są pomijane.

  </Accordion>
</AccordionGroup>

### Opcje ładunku dla zadań izolowanych

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla izolowanych).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu myślenia.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku startowego przestrzeni roboczej.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako modelu głównego tego zadania. Nie jest tym samym co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallback nadal mają zastosowanie, gdy model główny zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie może zostać rozwiązany, Cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego zadania.

Zadania Cron mogą też przenosić `fallbacks` na poziomie ładunku. Gdy jest obecna, ta lista zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłego uruchomienia Cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w ładunku, ani w konfiguracji, OpenClaw przekazuje jawne puste nadpisanie fallback, aby model główny agenta nie został dopisany jako ukryty dodatkowy cel ponowienia.

Priorytet wyboru modelu dla zadań izolowanych:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Zapisane nadpisanie modelu sesji Cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozwiązaną aktywną selekcją. Jeśli konfiguracja wybranego modelu ma `params.fastMode`, izolowany Cron używa jej domyślnie. Zapisane nadpisanie `fastMode` sesji nadal ma pierwszeństwo nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie przełączenia aktywnego modelu, Cron ponawia próbę z przełączonym dostawcą/modelem i utrwala tę aktywną selekcję dla bieżącego uruchomienia przed ponowieniem. Gdy przełączenie przenosi też nowy profil uwierzytelniania, Cron utrwala również to nadpisanie profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia Cron przerywa zamiast zapętlać się w nieskończoność.

Zanim izolowane uruchomienie Cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest loopback, siecią prywatną lub `.local`. Jeśli ten endpoint jest niedostępny, uruchomienie jest zapisywane jako `skipped` z wyraźnym błędem dostawcy/modelu zamiast rozpoczynać wywołanie modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele należnych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą sondę zamiast tworzyć lawinę żądań. Pominięte uruchomienia preflight dostawcy nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzanych powiadomień o pominięciach.

## Dostarczanie i dane wyjściowe

| Tryb | Co się dzieje |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza końcowy tekst awaryjnie do celu, jeśli agent go nie wysłał |
| `webhook` | Wysyła ładunek zakończonego zdarzenia metodą POST pod URL |
| `none` | Brak awaryjnego dostarczania przez runner |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfigurację mogą także przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie ogłoszenia używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Tylko prefiksy ogłaszane przez załadowany plugin są selektorami dostawców. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane, zamiast pozwolić WhatsApp zinterpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami dostawców.

W przypadku izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może używać narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija zapasowe ogłoszenie. W przeciwnym razie `announce`, `webhook` i `none` sterują tylko tym, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla zapasowej trasy ogłoszenia. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania dostawcy nie są odtwarzane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie ogłoszeń używa skonfigurowanych list dozwolonych kanałów, aby sprawdzać poprawność i przekierowywać nieaktualne cele. Zatwierdzenia magazynu parowania DM nie są odbiorcami automatyzacji zapasowej; ustaw `delivery.to` albo skonfiguruj wpis kanału `allowFrom`, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o błędach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` nadpisuje ją dla pojedynczego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach wracają teraz do tego głównego celu ogłoszeń.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowy tryb dostarczania to `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia zachowują osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

## Przykłady CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  </Tab>
  <Tab title="Model and thinking override">
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
  </Tab>
</Tabs>

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

Tokeny w ciągu zapytania są odrzucane.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Dodaj zdarzenie systemowe do kolejki dla głównej sesji:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Opis zdarzenia.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` albo `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Uruchom izolowaną turę agenta:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` albo `agent` za pomocą szablonów lub transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe hooków za local loopback, tailnet albo zaufanym reverse proxy.

- Użyj dedykowanego tokena hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Trzymaj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne trasowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

<Steps>
  <Step title="Select the GCP project">
    Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

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

<Note>
Uwaga o nadpisaniu modelu:

- `openclaw cron add|edit --model ...` zmienia model wybrany dla zadania.
- Jeśli model jest dozwolony, dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, cron kończy uruchomienie z jawnym błędem walidacji.
- Skonfigurowane łańcuchy zapasowe nadal obowiązują, ponieważ cron `--model` jest podstawowym modelem zadania, a nie nadpisaniem sesji `/model`.
- Payload `fallbacks` zastępuje skonfigurowane fallbacki dla tego zadania; `fallbacks: []` wyłącza fallback i wymusza ścisłe uruchomienie.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy fallbacków nie przechodzi do podstawowego modelu agenta jako cichy dodatkowy cel ponownej próby.

</Note>

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wywołania cron, jak i wykonanie izolowanych tur agentów. Izolowane tury agentów cron wewnętrznie używają dedykowanej kolejki wykonania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne wrappery cron. Współdzielona ścieżka niebędąca cron `nested` nie jest rozszerzana przez to ustawienie.

Sidecar stanu runtime jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, a ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego sidecara do oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia i tożsamości harmonogramu, która mówi schedulerowi, kiedy zewnętrznie edytowane zadanie potrzebuje świeżego `nextRunAtMs`.

Wyłącz cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Ponowna próba jednorazowa**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe wyłączają natychmiast.

    **Ponowna próba cykliczna**: wykładniczy backoff (od 30 s do 60 min) między ponownymi próbami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy izolowanych sesji uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron not firing">
    - Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
    - Potwierdź, że Gateway działa nieprzerwanie.
    - Dla harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron uruchomiony, ale brak dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się awaryjnego wysłania przez runnera. Agent nadal może wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysłanie wychodzące zostało pominięte.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokoju `delivery.to` mogą kończyć się niepowodzeniem, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie, ustawiając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez dane uwierzytelniające.
    - Jeśli izolowane uruchomienie zwraca tylko token ciszy (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczenie wychodzące, a także pomija awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się zapobiegać przejściu /new-style">
    - Świeżość resetu dziennego i resetu bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako swojej bazowej wartości bezczynności.

  </Accordion>
  <Accordion title="Pułapki strefy czasowej">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - `activeHours` Heartbeat używa skonfigurowanego rozpoznawania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
