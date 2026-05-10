---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-10T19:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wyniki z powrotem do kanału czatu lub punktu końcowego webhooka.

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
- Stan wykonania w czasie działania jest utrwalany obok nich w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json` i dodaj `jobs-state.json` do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` zostanie edytowany podczas działania Gateway lub gdy jest zatrzymany, OpenClaw porównuje zmienione pola harmonogramu z oczekującymi metadanymi przedziałów czasu działania i czyści nieaktualne wartości `nextRunAtMs`. Czyste formatowanie lub przepisanie wyłącznie kolejności kluczy zachowuje oczekujący przedział.
- Wszystkie wykonania cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tur agenta są przeplanowywane poza okno łączenia kanałów zamiast odtwarzania ich natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja natywnych poleceń pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po powodzeniu.
- Izolowane uruchomienia cron w trybie best-effort zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron, które otrzymają wąskie uprawnienie do samoczyszczenia cron, nadal mogą odczytywać status harmonogramu, samofiltrowaną listę swojego bieżącego zadania oraz historię uruchomień tego zadania, dzięki czemu kontrole statusu/heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do mutacji cron.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie odpowiada już za końcową odpowiedź, OpenClaw jednokrotnie ponawia zapytanie o właściwy wynik przed dostarczeniem.
- Izolowane uruchomienia cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych końcowych znaczników podsumowania/wyjścia, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, dzięki czemu zablokowane polecenie nie jest raportowane jako zielone uruchomienie.
- Izolowane uruchomienia cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstanie payload odpowiedzi, dzięki czemu awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniu zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim cron zapisze timeout, aby praca czatu w kolejce nie pozostała za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera lub przed pierwszym wywołaniem modelu, cron zapisuje timeout właściwy dla fazy, taki jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te watchdogi obejmują osadzonych dostawców i dostawców opartych na CLI, zanim ich zewnętrzny proces CLI faktycznie zostanie uruchomiony, i są limitowane niezależnie od długich wartości `timeoutSeconds`, aby awarie zimnego startu/uwierzytelniania/kontekstu ujawniały się szybko zamiast czekać na pełny budżet zadania.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest najpierw własnością czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie cron pozostaje aktywne, dopóki runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli wciąż istnieje stary wiersz sesji potomnej. Gdy runtime przestanie posiadać zadanie i 5-minutowe okno karencji wygaśnie, konserwacja sprawdza utrwalone logi uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań jest finalizowany na jego podstawie; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt offline CLI może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zbioru aktywnych zadań w procesie jako dowodu, że uruchomienie cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramu według lokalnego czasu ściennego.

Cykliczne wyrażenia z początkiem godziny są automatycznie rozkładane z przesunięciem do 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjne taktowanie, albo `--stagger 30s`, aby podać jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pole dnia miesiąca, jak i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** z pól — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 raz w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia Cronera `+` (`0 9 15 * +1`) albo zaplanuj według jednego pola i zabezpiecz drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w        | Najlepsze do                    |
| --------------- | ------------------- | ---------------------- | ------------------------------- |
| Sesja główna    | `main`              | Następna tura heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, prace w tle            |
| Bieżąca sesja   | `current`           | Powiązana w chwili utworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja   | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie wydłużają świeżości dziennego/bezczynnościowego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na wcześniejszych podsumowaniach.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne nadpisania modelu/uwierzytelniania wybrane przez użytkownika, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza cron: routingu kanału/grupy, polityki wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania runtime ACP. Użyj `current` lub `session:<id>`, gdy cykliczne zadanie ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych demontaż runtime obejmuje teraz sprzątanie przeglądarki w trybie best-effort dla tej sesji cron. Awarie sprzątania są ignorowane, więc właściwy wynik cron nadal ma pierwszeństwo.

    Izolowane uruchomienia cron usuwają też wszystkie dołączone instancje runtime MCP utworzone dla zadania przez wspólną ścieżkę sprzątania runtime. Odpowiada to sposobowi, w jaki klienci MCP sesji głównej i sesji niestandardowej są zamykani, więc izolowane zadania cron nie wyciekają procesów potomnych stdio ani długowiecznych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia cron koordynują subagentów, dostarczanie również preferuje końcowe wyjście potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłaszania Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie payloady tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane payloady Discord nadal są dostarczane jako oddzielne payloady, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Opcje payloadu dla zadań izolowanych

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
  Pomiń wstrzykiwanie pliku bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których może używać zadanie, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako głównego modelu tego zadania. To nie jest to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallback nadal obowiązują, gdy główny model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą również przenosić `fallbacks` na poziomie payloadu. Gdy są obecne, ta lista zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w payloadzie/API zadania, gdy chcesz rygorystycznego uruchomienia cron, które próbuje wyłącznie wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w payloadzie, ani w konfiguracji, OpenClaw przekazuje jawne puste nadpisanie fallback, aby główny model agenta nie został dołączony jako ukryty dodatkowy cel ponownej próby.

Kolejność pierwszeństwa wyboru modelu dla zadań izolowanych:

1. Nadpisanie modelu haka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` w payloadzie zadania
3. Zapisane nadpisanie modelu sesji cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślny

Tryb szybki również podąża za rozwiązaną aktywną selekcją. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron używa jej domyślnie. Zapisane nadpisanie sesji `fastMode` nadal wygrywa nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie przełączenia modelu na żywo, cron ponawia próbę z przełączonym dostawcą/modelem i utrwala tę selekcję na żywo dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie przenosi też nowy profil uwierzytelniania, cron utrwala również nadpisanie tego profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie Cron trafi do mechanizmu uruchamiania agenta, OpenClaw sprawdza osiągalne lokalne punkty końcowe dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest adresem loopback, sieci prywatnej lub `.local`. Jeśli ten punkt końcowy nie działa, uruchomienie jest rejestrowane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczynania wywołania modelu. Wynik punktu końcowego jest buforowany przez 5 minut, więc wiele wymagalnych zadań korzystających z tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć lawinę żądań. Pominięte uruchomienia wstępnej kontroli dostawcy nie zwiększają wycofania po błędzie wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz otrzymywać powtarzane powiadomienia o pominięciach.

## Dostarczanie i dane wyjściowe

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Awaryjnie dostarcza tekst końcowy do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła metodą POST ładunek zdarzenia zakończenia do adresu URL      |
| `none`     | Brak awaryjnego dostarczania przez mechanizm uruchamiający          |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfiguracji mogą także przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim Cron przejdzie awaryjnie do historii sesji lub jednego skonfigurowanego kanału. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwolić WhatsApp interpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celów należącą do kanału, a nie selektorami dostawcy.

Dla izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wyśle wiadomość do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co mechanizm uruchamiający robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla awaryjnej trasy announce. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania dostawców nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych list dozwolonych kanałów do walidacji i ponownego wyznaczania tras dla nieaktualnych celów. Zatwierdzenia w magazynie par DM nie są odbiorcami automatyzacji awaryjnej; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o awariach używają oddzielnej ścieżki miejsca docelowego:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o awariach.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadna z nich nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o awariach teraz awaryjnie używają tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów Cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia zachowują oddzielny licznik kolejnych pominięć, więc nie wpływają na wycofanie po błędzie wykonania.

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
  <Tab title="Nadpisanie modelu i trybu myślenia">
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

Każde żądanie musi zawierać token haka w nagłówku:

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
  <Accordion title="Mapowane haki (POST /hooks/<name>)">
    Niestandardowe nazwy haków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe haków za loopback, tailnetem albo zaufanym zwrotnym proxy.

- Użyj dedykowanego tokena haka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Trzymaj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne routowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki haków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki odbiorczej Gmail do OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone haki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja kreatorem (zalecana)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy ustawiono `hooks.enabled=true` i `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

<Steps>
  <Step title="Wybierz projekt GCP">
    Wybierz projekt GCP, który jest właścicielem klienta OAuth używanego przez `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Utwórz temat i nadaj Gmail dostęp push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Rozpocznij obserwację">
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
- Jeśli model jest dozwolony, ten dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Skonfigurowane łańcuchy awaryjne nadal obowiązują, ponieważ `--model` w Cron jest podstawowym ustawieniem zadania, a nie nadpisaniem sesji `/model`.
- Ładunek `fallbacks` zastępuje skonfigurowane mechanizmy awaryjne dla tego zadania; `fallbacks: []` wyłącza mechanizm awaryjny i sprawia, że uruchomienie jest rygorystyczne.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy mechanizmów awaryjnych nie przechodzi do podstawowego modelu agenta jako cichego dodatkowego celu ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie Cron, jak i wykonywanie izolowanych tur agenta. Izolowane tury agenta Cron używają wewnętrznie dedykowanej ścieżki wykonania kolejki `cron-nested`, więc podniesienie tej wartości pozwala niezależnym uruchomieniom LLM w Cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne opakowania Cron. Współdzielona ścieżka `nested` poza Cron nie jest rozszerzana tym ustawieniem.

Boczny plik stanu środowiska uruchomieniowego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, a ścieżka magazynu bez sufiksu `.json` dokleja `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego bocznego pliku dla oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia i tożsamości harmonogramu, która mówi harmonogramowi, kiedy zewnętrznie edytowane zadanie potrzebuje świeżego `nextRunAtMs`.

Wyłącz Cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponowień">
    **Ponowienie jednorazowe**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wycofaniem wykładniczym. Błędy trwałe wyłączają zadanie natychmiast.

    **Ponowienie cykliczne**: wycofanie wykładnicze (od 30 s do 60 min) między ponowieniami. Wycofanie resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) przycina wpisy izolowanych sesji uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
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
  <Accordion title="Cron nie uruchamia się">
    - Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
    - Upewnij się, że Gateway działa nieprzerwanie.
    - W przypadku harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w danych wyjściowych uruchomienia oznacza, że uruchomienie ręczne zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a zadanie nie było jeszcze wymagalne.

  </Accordion>
  <Accordion title="Cron uruchomił się, ale bez dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie jest oczekiwane wysłanie awaryjne przez runner. Agent nadal może wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłanie wychodzące zostało pominięte.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokojów `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie, podając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw tłumi bezpośrednie dostarczanie wychodzące, a także awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydają się uniemożliwiać przejście /new-style">
    - Świeżość dziennego i bezczynnego resetu nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynne bez `lastInteractionAt` używają odzyskanego czasu rozpoczęcia jako swojej bazowej wartości bezczynności.

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
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury głównej sesji
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
