---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhook, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-02T09:42:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać dane wyjściowe z powrotem do kanału czatu lub punktu końcowego Webhook.

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

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok, w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json` i dodaj `jobs-state.json` do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytywać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` zostanie edytowany podczas działania lub zatrzymania Gateway, OpenClaw porównuje zmienione pola harmonogramu z oczekującymi metadanymi slotu czasu działania i czyści przestarzałe wartości `nextRunAtMs`. Same zmiany formatowania lub kolejności kluczy zachowują oczekujący slot.
- Wszystkie wykonania cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Przy uruchomieniu Gateway zaległe izolowane zadania tury agenta są planowane ponownie poza oknem łączenia kanału, zamiast być natychmiast odtwarzane, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia cron dokładają starań, aby po zakończeniu uruchomienia zamknąć śledzone karty/procesy przeglądarki dla ich sesji `cron:<jobId>`, dzięki czemu odłączona automatyzacja przeglądarki nie pozostawia osieroconych procesów.
- Izolowane uruchomienia cron chronią też przed przestarzałymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją stanu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie jest nadal odpowiedzialne za ostateczną odpowiedź, OpenClaw ponawia monit raz, prosząc o właściwy wynik przed dostarczeniem.
- Izolowane uruchomienia cron preferują uporządkowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych markerów końcowego podsumowania/danych wyjściowych, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, aby zablokowane polecenie nie zostało zgłoszone jako udane uruchomienie.
- Izolowane uruchomienia cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstanie ładunek odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast oznaczać zadanie jako pomyślne.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim cron zarejestruje przekroczenie limitu czasu, aby oczekująca praca czatu nie została za przestarzałą sesją przetwarzania.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest najpierw własnością czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie cron pozostaje żywe, dopóki środowisko wykonawcze cron nadal śledzi to zadanie jako uruchomione, nawet jeśli stary wiersz sesji potomnej nadal istnieje. Gdy środowisko wykonawcze przestanie być właścicielem zadania, a 5-minutowe okno karencji wygaśnie, konserwacja sprawdza utrwalone dzienniki uruchomień i stan zadania pod kątem pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań jest finalizowany na jej podstawie; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby planować według lokalnego czasu zegarowego.

Cykliczne wyrażenia wykonywane o pełnej godzinie są automatycznie rozpraszane o maksymalnie 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, lub `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są analizowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie cron Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj według jednego pola i zabezpiecz drugie w monicie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Działa w                 | Najlepsze do                    |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna    | `main`              | Następna tura Heartbeat  | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązana w czasie tworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie wydłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy, takie jak codzienne standupy, które budują na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenieść bezpieczne preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne nadpisania modelu/uwierzytelniania wybrane przez użytkownika, ale nie dziedziczy otaczającego kontekstu konwersacji ze starszego wiersza cron: routingu kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania środowiska wykonawczego ACP. Użyj `current` lub `session:<id>`, gdy cykliczne zadanie ma celowo budować na tym samym kontekście konwersacji.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych demontaż czasu działania obejmuje teraz najlepszą możliwą próbę sprzątania przeglądarki dla tej sesji cron. Awarie sprzątania są ignorowane, aby właściwy wynik cron nadal miał pierwszeństwo.

    Izolowane uruchomienia cron zwalniają też wszystkie dołączone instancje środowiska wykonawczego MCP utworzone dla zadania przez współdzieloną ścieżkę sprzątania czasu działania. Odpowiada to sposobowi demontażu klientów MCP sesji głównej i sesji niestandardowych, więc izolowane zadania cron nie pozostawiają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczanie preferuje również końcowe dane wyjściowe potomka zamiast przestarzałego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i ostateczną odpowiedź. Media i uporządkowane ładunki Discord są nadal dostarczane jako osobne ładunki, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Opcje ładunku dla zadań izolowanych

<ParamField path="--message" type="string" required>
  Tekst monitu (wymagany dla izolowanych).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu myślenia.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku startowego obszaru roboczego.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. To nie jest to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy awaryjne nadal mają zastosowanie, gdy podstawowy model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania cron mogą też przenosić `fallbacks` na poziomie ładunku. Gdy lista jest obecna, zastępuje skonfigurowany łańcuch awaryjny dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłego uruchomienia cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma ani ładunku, ani skonfigurowanych fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby model podstawowy agenta nie został dołączony jako ukryty dodatkowy cel ponownej próby.

Priorytet wyboru modelu dla zadań izolowanych jest następujący:

1. Nadpisanie modelu haka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Przechowywane nadpisanie modelu sesji cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozstrzygniętym wyborem na żywo. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron używa jej domyślnie. Przechowywane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie napotka przekazanie przełączania modelu na żywo, cron ponawia próbę z przełączonym dostawcą/modelem i utrwala ten wybór na żywo dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie niesie też nowy profil uwierzytelniania, cron utrwala również to nadpisanie profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po pierwszej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne punkty końcowe dostawcy dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest local loopback, siecią prywatną lub `.local`. Jeśli ten punkt końcowy jest niedostępny, uruchomienie jest rejestrowane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczęcia wywołania modelu. Wynik punktu końcowego jest buforowany przez 5 minut, więc wiele zaległych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia preflight dostawcy nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzających się powiadomień o pominięciu.

## Dostarczanie i dane wyjściowe

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza końcowy tekst awaryjnie do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła ładunek zakończonego zdarzenia metodą POST na URL           |
| `none`     | Brak awaryjnego dostarczania przez runner                           |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfigurację mogą też przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokoi Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie ogłoszeń używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim Cron wróci do historii sesji albo jednego skonfigurowanego kanału. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany plugin. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone zamiast pozwalać WhatsApp interpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` oraz `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami dostawcy.

W przypadku zadań izolowanych dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija ogłoszenie awaryjne. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany cel dostarczania na żywo dla awaryjnej trasy ogłoszenia. Wewnętrzne klucze sesji mogą być pisane małymi literami; cele dostarczania dostawcy nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie ogłoszeń używa skonfigurowanych list dozwolonych kanałów do weryfikowania i przekierowywania nieaktualnych celów. Zatwierdzenia z magazynu par DM nie są odbiorcami automatyzacji awaryjnej; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o błędach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` zastępuje ją dla danego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach przechodzą teraz awaryjnie na ten podstawowy cel ogłoszenia.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania albo globalnej polityki alertów Cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia zachowują osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

## Przykłady CLI

<Tabs>
  <Tab title="Jednorazowe przypomnienie">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Cykliczne zadanie izolowane">
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
  <Tab title="Nadpisanie modelu i myślenia">
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

Gateway może udostępniać punkty końcowe Webhook HTTP dla wyzwalaczy zewnętrznych. Włącz w konfiguracji:

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
  <Accordion title="Mapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` albo `agent` za pomocą szablonów lub transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe hooków za loopbackiem, tailnetem albo zaufanym reverse proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Trzymaj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne routowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowywane granicami bezpieczeństwa.

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

### Automatyczny start Gateway

Gdy `hooks.enabled=true` i `hooks.gmail.account` jest ustawione, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwowanie. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna konfiguracja jednorazowa

<Steps>
  <Step title="Wybierz projekt GCP">
    Wybierz projekt GCP, do którego należy klient OAuth używany przez `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Utwórz temat i przyznaj Gmail dostęp do push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Uruchom obserwowanie">
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

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Skonfigurowane łańcuchy awaryjne nadal obowiązują, ponieważ `--model` Cron jest podstawowym modelem zadania, a nie nadpisaniem `/model` sesji.
- Ładunek `fallbacks` zastępuje skonfigurowane ścieżki awaryjne dla tego zadania; `fallbacks: []` wyłącza ścieżkę awaryjną i czyni uruchomienie ścisłym.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy ścieżek awaryjnych nie przechodzi do podstawowego modelu agenta jako cichy dodatkowy cel ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie Cron, jak i wykonywanie izolowanych tur agenta. Izolowane tury agenta Cron używają wewnętrznie dedykowanej kolejki wykonania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle zamiast uruchamiać tylko ich zewnętrzne wrappery Cron. Współdzielona, nie-Cron-owa ścieżka `nested` nie jest rozszerzana przez to ustawienie.

Plik boczny stanu uruchomieniowego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego pliku bocznego do oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia oraz tożsamości harmonogramu, która informuje scheduler, kiedy zewnętrznie edytowane zadanie potrzebuje świeżego `nextRunAtMs`.

Wyłącz Cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponawiania">
    **Ponawianie jednorazowe**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe natychmiast wyłączają zadanie.

    **Ponawianie cykliczne**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) przycina wpisy izolowanych sesji uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
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
  <Accordion title="Cron się nie uruchamia">
    - Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
    - Potwierdź, że Gateway działa nieprzerwanie.
    - W przypadku harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyjściu uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a zadanie nie było jeszcze wymagalne.

  </Accordion>
  <Accordion title="Cron uruchomił się, ale nic nie dostarczono">
    - Tryb dostarczania `none` oznacza, że nie jest oczekiwane wysłanie przez rezerwowy runner. Agent nadal może wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że pominięto wysyłkę wychodzącą.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokoi `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokoi Matrix rozróżniają wielkość liter. Edytuj zadanie, podając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez dane uwierzytelniające.
    - Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw wstrzyma bezpośrednie dostarczenie wychodzące, a także wstrzyma rezerwową ścieżkę podsumowania w kolejce, więc nic nie zostanie opublikowane z powrotem na czacie.
    - Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z wcześniejszym czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się zapobiegać przejściu /new-style">
    - Świeżość codziennego i bezczynnego resetu nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji transkryptu JSONL, gdy plik jest nadal dostępny. Starsze bezczynne wiersze bez `lastInteractionAt` używają odzyskanego czasu rozpoczęcia jako swojej bazowej wartości bezczynności.

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
