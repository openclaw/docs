---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhook, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhook i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-11T20:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczyć wynik z powrotem do kanału czatu albo punktu końcowego Webhook.

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
    openclaw cron get <job-id>
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
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytywać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` zostanie edytowany podczas działania Gateway albo po jego zatrzymaniu, OpenClaw porównuje zmienione pola harmonogramu z oczekującymi metadanymi slotu czasu działania i czyści nieaktualne wartości `nextRunAtMs`. Czyste zmiany formatowania albo przepisywanie wyłącznie kolejności kluczy zachowują oczekujący slot.
- Wszystkie wykonania Cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tur agenta są przeplanowywane poza okno łączenia kanałów zamiast odtwarzać się natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja natywnych poleceń pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po sukcesie.
- Izolowane uruchomienia Cron na zasadzie best-effort zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, dzięki czemu odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia Cron, które otrzymają wąskie uprawnienie do samoczyszczenia Cron, nadal mogą odczytywać stan harmonogramu, samofiltrowaną listę swojego bieżącego zadania oraz historię uruchomień tego zadania, więc kontrole stanu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do mutowania Cron.
- Izolowane uruchomienia Cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją stanu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie jest nadal odpowiedzialne za ostateczną odpowiedź, OpenClaw ponownie odpytuje raz o rzeczywisty wynik przed dostarczeniem.
- Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych końcowych markerów podsumowania/wyjścia, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, dzięki czemu zablokowane polecenie nie jest raportowane jako udane uruchomienie.
- Izolowane uruchomienia Cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstaje ładunek odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, czyszczenie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze przekroczenie czasu, dzięki czemu oczekująca praca czatu nie zostaje za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera albo przed pierwszym wywołaniem modelu, Cron zapisuje przekroczenie czasu specyficzne dla fazy, takie jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te watchdogi obejmują osadzonych dostawców i dostawców opartych na CLI, zanim ich zewnętrzny proces CLI zostanie faktycznie uruchomiony, i są ograniczane niezależnie od długich wartości `timeoutSeconds`, dzięki czemu awarie zimnego startu/autoryzacji/kontekstu ujawniają się szybko, zamiast czekać na pełny budżet zadania.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla Cron jest najpierw własnością czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie Cron pozostaje aktywne, dopóki środowisko czasu działania Cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej. Gdy środowisko czasu działania przestanie być właścicielem zadania i upłynie 5-minutowe okno karencji, kontrole konserwacyjne sprawdzają utrwalone logi uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań jest finalizowany na jej podstawie; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odtworzyć stan z trwałej historii, ale nie traktuje własnego pustego zbioru aktywnych zadań w procesie jako dowodu, że uruchomienie Cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 albo względny, jak `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe albo 6-polowe wyrażenie Cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramowania według lokalnego czasu zegarowego.

Cykliczne wyrażenia z początkiem godziny są automatycznie rozpraszane o maksymalnie 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby podać jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są analizowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pola dnia miesiąca, jak i dnia tygodnia nie są wieloznaczne, croner dopasowuje, gdy **którekolwiek** pole pasuje — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj na jednym polu i sprawdź drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w         | Najlepsze do                    |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesja główna    | `main`              | Następna tura Heartbeat  | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązana w chwili utworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja   | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** dodają do kolejki zdarzenie systemowe i opcjonalnie wybudzają Heartbeat (`--wake now` albo `--wake next-heartbeat`). Te zdarzenia systemowe nie przedłużają świeżości dziennego/bezczynnościowego resetu dla docelowej sesji. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenieść bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/autoryzacji, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza Cron: trasowania kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, źródła ani powiązania runtime ACP. Użyj `current` albo `session:<id>`, gdy zadanie cykliczne ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych rozbieranie środowiska czasu działania obejmuje teraz czyszczenie przeglądarki best-effort dla tej sesji Cron. Awarie czyszczenia są ignorowane, aby rzeczywisty wynik Cron nadal miał pierwszeństwo.

    Izolowane uruchomienia Cron usuwają też wszystkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia runtime. Jest to zgodne ze sposobem rozbierania klientów MCP sesji głównej i sesji niestandardowych, więc izolowane zadania Cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia Cron orkiestrują subagentów, dostarczanie również preferuje ostateczny wynik potomny zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłaszania Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i ostateczną odpowiedź. Multimedia i ustrukturyzowane ładunki Discord nadal są dostarczane jako osobne ładunki, więc załączniki i komponenty nie są pomijane.

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
  Pomiń wstrzykiwanie pliku bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. Nie jest to to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallback nadal obowiązują, gdy model podstawowy zadania zawiedzie. Jeśli żądany model nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji, zamiast po cichu wracać do wyboru modelu agenta/domyślnego zadania.

Zadania Cron mogą też przenosić `fallbacks` na poziomie ładunku. Gdy istnieje, ta lista zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłego uruchomienia Cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w ładunku, ani skonfigurowanych, OpenClaw przekazuje jawne puste nadpisanie fallback, aby podstawowy model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu haka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Zapisane nadpisanie modelu sesji Cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb szybki także podąża za rozwiązaną bieżącą selekcją. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany Cron domyślnie tego używa. Zapisane nadpisanie `fastMode` sesji nadal wygrywa nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie z przełączeniem modelu na żywo, Cron ponawia z przełączonym dostawcą/modelem i utrwala ten wybór na żywo dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie niesie też nowy profil autoryzacji, Cron utrwala także nadpisanie tego profilu autoryzacji dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia Cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie cron trafi do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest adresem loopback, siecią prywatną albo `.local`. Jeśli taki endpoint nie działa, uruchomienie jest rejestrowane jako `skipped` z czytelnym błędem dostawcy/modelu, zamiast rozpoczynać wywołanie modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele zaplanowanych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia provider-preflight nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, jeśli chcesz otrzymywać powtarzane powiadomienia o pominięciach.

## Dostarczanie i wynik

| Tryb       | Co się dzieje                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Awaryjnie dostarcza tekst końcowy do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła payload zdarzenia zakończenia metodą POST pod URL             |
| `none`     | Brak awaryjnego dostarczania przez runner                            |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfiguracji mogą też przekazać `delivery.threadId` jako string lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokoi Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Tylko prefiksy ogłaszane przez załadowany Plugin są selektorami dostawcy. Jeśli `delivery.channel` jest jawny, prefiks celu musi nazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane, zamiast pozwolić WhatsApp zinterpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu zarządzaną przez kanał, a nie selektorami dostawcy.

Dla izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner zrobi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw przechowuje zachowany aktywny cel dostarczania dla awaryjnej trasy announce. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania dostawcy nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych list dozwolonych kanałów do walidacji i ponownego trasowania nieaktualnych celów. Zatwierdzenia z pairing-store DM nie są odbiorcami automatyzacji awaryjnej; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o niepowodzeniach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną powiadomień o niepowodzeniach.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadna z tych wartości nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniach teraz wracają do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowy tryb dostarczania to `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania albo globalnej polityki alertów cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia utrzymują osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

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
  <Tab title="Cykliczne izolowane zadanie">
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

Gateway może udostępniać endpointy HTTP Webhook dla wyzwalaczy zewnętrznych. Włącz w konfiguracji:

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

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Dodaj zdarzenie systemowe do kolejki sesji głównej:

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
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` albo `agent` za pomocą szablonów lub transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj endpointy hooków za loopback, tailnet albo zaufanym reverse proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Trzymaj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne trasowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego endpointu HTTPS.
</Note>

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla endpointu push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i `hooks.gmail.account` jest ustawione, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia watch. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

### Ręczna jednorazowa konfiguracja

<Steps>
  <Step title="Wybierz projekt GCP">
    Wybierz projekt GCP, do którego należy klient OAuth używany przez `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Utwórz temat i przyznaj dostęp push Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Uruchom watch">
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

# Get one stored job as JSON
openclaw cron get <jobId>

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
- Jeśli nie jest dozwolony albo nie można go rozwiązać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Skonfigurowane łańcuchy fallback nadal obowiązują, ponieważ `--model` cron jest głównym modelem zadania, a nie nadpisaniem sesji `/model`.
- Payload `fallbacks` zastępuje skonfigurowane fallbacki dla tego zadania; `fallbacks: []` wyłącza fallback i wymusza ścisłe uruchomienie.
- Zwykłe `--model` bez jawnej albo skonfigurowanej listy fallbacków nie przechodzi do głównego modelu agenta jako cichy dodatkowy cel ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie cron, jak i wykonanie izolowanych tur agenta. Izolowane tury agentów cron używają wewnętrznie dedykowanej kolejki wykonania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne opakowania cron. Współdzielona nie-cronowa kolejka `nested` nie jest rozszerzana przez to ustawienie.

Sidecar stanu runtime jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, a ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, nie umieszczaj `jobs-state.json` w kontroli źródeł. OpenClaw używa tego sidecara dla oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia oraz tożsamości harmonogramu, która informuje scheduler, kiedy zewnętrznie edytowane zadanie potrzebuje świeżego `nextRunAtMs`.

Wyłącz cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponowień">
    **Jednorazowe ponowienie**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe natychmiast wyłączają zadanie.

    **Cykliczne ponowienie**: wykładniczy backoff (30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) usuwa izolowane wpisy sesji uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
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
  <Accordion title="Cron się nie uruchamia">
    - Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
    - Upewnij się, że Gateway działa nieprzerwanie.
    - W przypadku harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie sprawdzono poleceniem `openclaw cron run <jobId> --due`, a zadanie nie było jeszcze wymagalne.

  </Accordion>
  <Accordion title="Cron został uruchomiony, ale nie ma dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie jest oczekiwane zapasowe wysłanie przez runnera. Agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłanie wychodzące zostało pominięte.
    - W przypadku Matrix skopiowane lub starsze zadania z identyfikatorami pokojów `delivery.to` zapisanymi małymi literami mogą kończyć się niepowodzeniem, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie, podając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko token ciszy (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczanie wychodzące, a także pomija zapasową ścieżkę kolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub heartbeat wydaje się zapobiegać przełączeniu /new-style">
    - Świeżość resetu dziennego i bezczynności nie jest oparta na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako punktu bazowego bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
    - Cron bez `--tz` używa strefy czasowej hosta gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozpoznawania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
