---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhook, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla planisty Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-30T09:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu albo punktu końcowego Webhook.

## Szybki start

<Steps>
  <Step title="Dodaj jednorazowe przypomnienie">
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
  <Step title="Sprawdź swoje zadania">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Zobacz historię uruchomień">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Jak działa Cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie tracą harmonogramów.
- Stan wykonywania w czasie działania jest utrwalany obok nich w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje Cron w git, śledź `jobs.json` i dodaj `jobs-state.json` do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` jest edytowany podczas działania Gateway albo po jego zatrzymaniu, OpenClaw porównuje zmienione pola harmonogramu z oczekującymi metadanymi slotu czasu działania i czyści nieaktualne wartości `nextRunAtMs`. Czyste formatowanie albo przepisanie zmieniające tylko kolejność kluczy zachowuje oczekujący slot.
- Wszystkie wykonania Cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Przy starcie Gateway zaległe izolowane zadania tur agenta są ponownie planowane poza oknem łączenia kanałów zamiast odtwarzać się natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja natywnych poleceń pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) po sukcesie domyślnie usuwają się automatycznie.
- Izolowane uruchomienia Cron na zasadzie best-effort zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po ukończeniu uruchomienia, więc odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia Cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją stanu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie jest nadal odpowiedzialne za końcową odpowiedź, OpenClaw ponownie prosi raz o właściwy wynik przed dostarczeniem.
- Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a potem wracają do znanych końcowych znaczników podsumowania/wyjścia, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, więc zablokowane polecenie nie jest zgłaszane jako zielone uruchomienie.
- Izolowane uruchomienia Cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstanie ładunek odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast czyścić zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze przekroczenie limitu czasu, więc zakolejkowana praca czatu nie zostaje za nieaktualną sesją przetwarzania.

<a id="maintenance"></a>

<Note>
Rekonsyliacja zadań dla Cron najpierw należy do czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie Cron pozostaje żywe, dopóki czas działania Cron nadal śledzi to zadanie jako uruchomione, nawet jeśli stary wiersz sesji potomnej nadal istnieje. Gdy czas działania przestanie posiadać zadanie i upłynie 5-minutowe okno karencji, utrzymanie sprawdza utrwalone dzienniki uruchomień oraz stan zadania pod kątem pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, księga zadań jest finalizowana na jej podstawie; w przeciwnym razie utrzymanie należące do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie Cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 albo względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie Cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby planować według lokalnego czasu zegarowego.

Cykliczne wyrażenia na początek godziny są automatycznie rozkładane z przesunięciem do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są analizowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pola dnia miesiąca, jak i dnia tygodnia nie są wieloznaczne, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo planuj na podstawie jednego pola i zabezpiecz drugie w prompcie lub poleceniu zadania.

## Style wykonywania

| Styl             | Wartość `--session` | Uruchamia się w         | Najlepsze do                    |
| ---------------- | ------------------- | ----------------------- | ------------------------------- |
| Sesja główna     | `main`              | Następna tura Heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowane        | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, prace w tle          |
| Bieżąca sesja    | `current`           | Powiązana przy tworzeniu | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja  | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Sesja główna kontra izolowana kontra niestandardowa">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie wydłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="Co oznacza „świeża sesja” dla zadań izolowanych">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne wybrane przez użytkownika nadpisania modelu/uwierzytelniania, ale nie dziedziczy kontekstu rozmowy z otoczenia ze starszego wiersza Cron: routingu kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania czasu działania ACP. Użyj `current` albo `session:<id>`, gdy zadanie cykliczne ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Sprzątanie czasu działania">
    Dla zadań izolowanych demontaż czasu działania obejmuje teraz best-effort sprzątanie przeglądarki dla tej sesji Cron. Awarie sprzątania są ignorowane, więc właściwy wynik Cron nadal ma pierwszeństwo.

    Izolowane uruchomienia Cron usuwają także wszystkie dołączone instancje czasu działania MCP utworzone dla zadania przez wspólną ścieżkę sprzątania czasu działania. Odpowiada to sposobowi demontażu klientów MCP sesji głównej i sesji niestandardowej, więc izolowane zadania Cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent i dostarczanie Discord">
    Gdy izolowane uruchomienia Cron orkiestrują subagentów, dostarczanie preferuje również końcowe wyjście potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw wycisza tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłaszania Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane ładunki Discord nadal są dostarczane jako osobne ładunki, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Opcje ładunku dla zadań izolowanych

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla izolowanego).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu myślenia.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku bootstrapu obszaru roboczego.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. To nie to samo co nadpisanie `/model` w sesji czatu: skonfigurowane łańcuchy fallback nadal obowiązują, gdy podstawowy model zadania zawiedzie. Jeśli żądany model nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą też przenosić `fallbacks` na poziomie ładunku. Gdy są obecne, ta lista zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłe uruchomienie Cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma ani fallbacków w ładunku, ani skonfigurowanych fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallback, aby podstawowy model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu z haka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Zapisane wybrane przez użytkownika nadpisanie modelu sesji Cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozwiązaną bieżącą selekcją. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany Cron używa tego domyślnie. Zapisane nadpisanie `fastMode` sesji nadal wygrywa nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie zmiany modelu na żywo, Cron ponawia z przełączonym dostawcą/modelem i utrwala tę bieżącą selekcję dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie niesie też nowy profil uwierzytelniania, Cron utrwala również to nadpisanie profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie i 2 ponowieniach przełączenia Cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie Cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne punkty końcowe dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` to local loopback, sieć prywatna albo `.local`. Jeśli ten punkt końcowy nie działa, uruchomienie jest zapisywane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczynać wywołanie modelu. Wynik punktu końcowego jest buforowany przez 5 minut, więc wiele wymagalnych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang albo LM Studio współdzieli jedną małą sondę zamiast tworzyć burzę żądań. Pominięte uruchomienia provider-preflight nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzane powiadomienia o pominięciu.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallbackowo dostarcz końcowy tekst do celu, jeśli agent nie wysłał  |
| `webhook`  | Wyślij metodą POST ładunek zakończonego zdarzenia pod URL           |
| `none`     | Brak fallbackowego dostarczania runnera                             |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfiguracji mogą też przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Dla izolowanych zadań dostarczanie na czat jest współdzielone. Jeśli dostępna jest trasa czatu, agent może użyć narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija zapasowe ogłoszenie. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany bieżący cel dostarczania dla zapasowej trasy ogłoszenia. Wewnętrzne klucze sesji mogą być pisane małymi literami; cele dostarczania dostawcy nie są odtwarzane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Powiadomienia o niepowodzeniach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniach.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadna z tych wartości nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniach wracają teraz do tego podstawowego celu ogłoszenia.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania albo globalnej polityki alertów cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia zachowują osobny licznik kolejnych pominięć, więc nie wpływają na wycofywanie po błędach wykonania.

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

Gateway może udostępniać punkty końcowe Webhook HTTP dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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
      `now` lub `next-heartbeat`.
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
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe hooków za local loopback, tailnetem albo zaufanym odwrotnym proxy.

- Użyj dedykowanego tokena hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Trzymaj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne kierowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja kreatorem (zalecana)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczny start Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia obserwowanie. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

<Steps>
  <Step title="Select the GCP project">
    Wybierz projekt GCP, do którego należy klient OAuth używany przez `gog`:

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
Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia model wybrany dla zadania.
- Jeśli model jest dozwolony, dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Skonfigurowane łańcuchy zapasowe nadal mają zastosowanie, ponieważ cron `--model` jest podstawowym wyborem zadania, a nie nadpisaniem sesji `/model`.
- Ładunek `fallbacks` zastępuje skonfigurowane elementy zapasowe dla tego zadania; `fallbacks: []` wyłącza zapas i sprawia, że uruchomienie jest ścisłe.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy zapasowej nie przechodzi do podstawowego agenta jako cichy dodatkowy cel ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie cron, jak i wykonywanie izolowanej tury agenta. Izolowane tury agenta cron używają wewnętrznie dedykowanej kolejki wykonania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne opakowania cron. Współdzielona niecronowa kolejka `nested` nie jest poszerzana przez to ustawienie.

Plik towarzyszący stanu środowiska wykonawczego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego pliku towarzyszącego dla oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia oraz tożsamości harmonogramu, która informuje scheduler, kiedy zewnętrznie edytowane zadanie wymaga świeżego `nextRunAtMs`.

Wyłącz cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Ponowienie jednorazowe**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym wycofywaniem. Błędy trwałe wyłączają natychmiast.

    **Ponowienie cykliczne**: wykładnicze wycofywanie (od 30 s do 60 min) między ponowieniami. Wycofywanie resetuje się po następnym pomyślnym uruchomieniu.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (domyślnie `24h`) czyści wpisy izolowanych sesji uruchomieniowych. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie czyści pliki dziennika uruchomień.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

### Drabina poleceń

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
    - Potwierdź, że Gateway działa ciągle.
    - W przypadku harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Tryb dostarczania `none` oznacza, że nie jest oczekiwane zapasowe wysłanie przez runnera. Agent nadal może wysłać bezpośrednio narzędziem `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokoi `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokoi Matrix rozróżniają wielkość liter. Edytuj zadanie do dokładnej wartości `!room:server` albo `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw wstrzymuje bezpośrednie dostarczanie wychodzące, a także wstrzymuje zapasową ścieżkę kolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.
    - Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma używalną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się uniemożliwiać przełączenie /new-style">
    - Świeżość dziennego i bezczynnego resetu nie jest oparta na `updatedAt`; zobacz [Zarządzanie sesjami](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec oraz księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynne bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako bazowego punktu odniesienia bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozpoznawania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
