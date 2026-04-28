---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczyć wynik z powrotem do kanału czatu lub punktu końcowego Webhook.

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

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań są utrwalane w `~/.openclaw/cron/jobs.json`, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Stan wykonania w czasie działania jest utrwalany obok, w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json`, a `jobs-state.json` dodaj do `.gitignore`.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola środowiska wykonawczego znajdują się teraz w `jobs-state.json`.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Zadania jednorazowe (`--at`) są domyślnie automatycznie usuwane po pomyślnym zakończeniu.
- Izolowane uruchomienia cron po zakończeniu wykonują best-effort zamknięcie śledzonych kart/procesów przeglądarki dla sesji `cron:<jobId>`, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron chronią także przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik to tylko tymczasowa aktualizacja stanu (`on it`, `pulling everything together` i podobne wskazówki) i żadne podrzędne uruchomienie subagenta nie odpowiada już za końcową odpowiedź, OpenClaw ponawia prompt jeden raz, aby uzyskać właściwy wynik przed dostarczeniem.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest przede wszystkim zarządzane przez runtime, a dopiero w drugiej kolejności wspierane przez trwałą historię: aktywne zadanie cron pozostaje aktywne, dopóki runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej. Gdy runtime przestaje zarządzać zadaniem i upłynie 5-minutowe okno karencji, kontrole konserwacyjne sprawdzają utrwalone logi uruchomień i stan zadania dla odpowiadającego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik końcowy, rejestr zadań jest na jej podstawie finalizowany; w przeciwnym razie konserwacja zarządzana przez Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać dane z trwałej historii, ale nie traktuje własnego pustego zbioru aktywnych zadań w procesie jako dowodu, że uruchomienie cron zarządzane przez Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                         |
| ------- | --------- | ------------------------------------------------------------ |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                               |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz`    |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramu według lokalnego czasu ściennego.

Powtarzające się wyrażenia na pełną godzinę są automatycznie rozpraszane do 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy zarówno pola dnia miesiąca, jak i dnia tygodnia nie są wildcardami, croner dopasowuje, gdy **którekolwiek** z pól pasuje — nie oba. To standardowe zachowanie Vixie cron.

```
# Zamierzone: "9:00 piętnastego dnia miesiąca, tylko jeśli to poniedziałek"
# Faktycznie:  "9:00 każdego piętnastego dnia miesiąca ORAZ 9:00 w każdy poniedziałek"
0 9 15 * 1
```

To uruchamia się ~5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR z Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` z Croner (`0 9 15 * +1`) albo ustaw harmonogram według jednego pola i sprawdzaj drugie w promptcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamiane w             | Najlepsze do                     |
| --------------- | ------------------- | ------------------------- | -------------------------------- |
| Sesja główna    | `main`              | Następny cykl Heartbeat   | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle           |
| Bieżąca sesja   | `current`           | Powiązane przy tworzeniu  | Cykliczna praca zależna od kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja   | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Sesja główna vs izolowana vs niestandardowa">
    Zadania w **sesji głównej** umieszczają w kolejce zdarzenie systemowe i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie wydłużają świeżości resetu dziennego/bezczynności dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowany cykl agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy, takie jak codzienne standupy, które opierają się na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="Co oznacza „świeża sesja” dla zadań izolowanych">
    W przypadku zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/auth, ale nie dziedziczy kontekstu otaczającej rozmowy ze starszego wiersza cron: routingu kanału/grupy, polityki wysyłki lub kolejki, uprawnień podwyższonych, pochodzenia ani powiązania runtime ACP. Użyj `current` lub `session:<id>`, gdy cykliczne zadanie powinno celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Czyszczenie środowiska wykonawczego">
    W przypadku zadań izolowanych zamykanie runtime obejmuje teraz również best-effort czyszczenie przeglądarki dla tej sesji cron. Błędy czyszczenia są ignorowane, więc rzeczywisty wynik cron nadal ma pierwszeństwo.

    Izolowane uruchomienia cron usuwają także wszelkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia runtime. Jest to zgodne z tym, jak klienci MCP sesji głównej i niestandardowej są zamykani, dzięki czemu izolowane zadania cron nie pozostawiają wycieków procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Dostarczanie przez subagenta i Discord">
    Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczenie również preferuje końcowy wynik potomny zamiast nieaktualnego tekstu tymczasowego rodzica. Jeśli potomkowie nadal działają, OpenClaw pomija taką częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń w Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta tylko raz, zamiast odtwarzać zarówno payloady tekstu strumieniowanego/pośredniego, jak i końcową odpowiedź. Payloady mediów i strukturalne payloady Discord są nadal dostarczane osobno, aby nie utracić załączników i komponentów.

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
  Nadpisanie poziomu thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku bootstrap obszaru roboczego.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz, których narzędzi zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu dla tego zadania. Jeśli żądany model nie jest dozwolony, cron zapisuje ostrzeżenie w logu i zamiast tego wraca do wyboru modelu agenta/domyślnego dla zadania. Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie modelu bez jawnej listy fallback per zadanie nie dodaje już podstawowego modelu agenta jako ukrytego dodatkowego celu ponowień.

Kolejność pierwszeństwa wyboru modelu dla zadań izolowanych jest następująca:

1. Nadpisanie modelu przez hook Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. Payload `model` per zadanie
3. Nadpisanie modelu zapisanej sesji cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb fast również podąża za rozstrzygniętym wyborem na żywo. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron domyślnie używa tej wartości. Zapisane nadpisanie `fastMode` sesji nadal ma pierwszeństwo nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie napotka przejęcie przez przełączenie modelu na żywo, cron ponawia próbę z przełączonym providerem/modelem i utrwala ten wybór na żywo dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie obejmuje także nowy profil auth, cron utrwala również to nadpisanie profilu auth dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie i 2 ponowieniach po przełączeniu cron przerywa zamiast zapętlać się bez końca.

## Dostarczanie i wynik

| Tryb      | Co się dzieje                                                    |
| --------- | ---------------------------------------------------------------- |
| `announce` | Zastępczo dostarcz końcowy tekst do celu, jeśli agent go nie wysłał |
| `webhook`  | Wyślij payload zdarzenia zakończenia metodą POST na URL         |
| `none`     | Brak zastępczego dostarczania przez wykonawcę                   |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania do kanału. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix są wrażliwe na wielkość liter; użyj dokładnego room ID albo formy `room:!room:server` z Matrix.

Dla zadań izolowanych dostarczanie do czatu jest współdzielone. Jeśli dostępna jest trasa czatu, agent może używać narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wyśle do skonfigurowanego/bieżącego celu, OpenClaw pomija zastępcze ogłoszenie. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co wykonawca robi z końcową odpowiedzią po cyklu agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla trasy zastępczego ogłoszenia. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania providera nie są rekonstruowane na podstawie tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Powiadomienia o niepowodzeniu korzystają z osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniu.
- `job.delivery.failureDestination` nadpisuje ją per zadanie.
- Jeśli żadna z tych wartości nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniu wracają teraz domyślnie do tego głównego celu ogłoszeń.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach z `sessionTarget="isolated"`, chyba że główny tryb dostarczania to `webhook`.

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
  <Tab title="Nadpisanie modelu i thinking">
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

Tokeny w query string nie są akceptowane.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Umieść w kolejce zdarzenie systemowe dla sesji głównej:

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
    Uruchom izolowany cykl agenta:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe hooków za local loopback, tailnetem lub zaufanym reverse proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów auth Gateway.
- Utrzymuj `hooks.path` na dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawny routing `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.
</Warning>

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmail z OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja przez kreator (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawione jest `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia watch. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

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
  <Step title="Utwórz topic i przyznaj Gmail dostęp push">
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

### Nadpisanie modelu dla Gmail

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
- Jeśli model jest dozwolony, dokładnie ten provider/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony, cron wyświetla ostrzeżenie i wraca do wyboru modelu agenta/domyślnego dla zadania.
- Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe nadpisanie `--model` bez jawnej listy fallback per zadanie nie przechodzi już do podstawowego modelu agenta jako cichego dodatkowego celu ponowień.
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

Plik sidecar stanu runtime jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Wyłącz cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponowień">
    **Ponowienie zadania jednorazowego**: błędy przejściowe (limit zapytań, przeciążenie, sieć, błąd serwera) są ponawiane maksymalnie 3 razy z wykładniczym backoff. Błędy trwałe wyłączają zadanie natychmiast.

    **Ponowienie zadania cyklicznego**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) przycina wpisy sesji izolowanych uruchomień. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki logów uruchomień.
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
    - Potwierdź, że Gateway działa bez przerwy.
    - Dla harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due` i zadanie nie było jeszcze wymagalne.
  </Accordion>
  <Accordion title="Cron uruchomił się, ale nie było dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie należy oczekiwać zastępczej wysyłki przez wykonawcę. Agent może nadal wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
    - W przypadku Matrix skopiowane lub starsze zadania z identyfikatorami pokojów `delivery.to` zapisanymi małymi literami mogą kończyć się błędem, ponieważ identyfikatory pokojów Matrix są wrażliwe na wielkość liter. Edytuj zadanie, ustawiając dokładną wartość `!room:server` albo `room:!room:server` z Matrix.
    - Błędy auth kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczenie wychodzące, a także zastępczą ścieżkę podsumowania w kolejce, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma używalną trasę (`channel: "last"` z poprzednim czatem lub jawny kanał/cel).
  </Accordion>
  <Accordion title="Wygląda na to, że cron lub Heartbeat uniemożliwia rollover w stylu /new">
    - Świeżość resetu dziennego i bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesjami](/pl/concepts/session#session-lifecycle).
    - Wybudzenia cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji dla routingu/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed dodaniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, jeśli plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako bazowej wartości bezczynności.
  </Accordion>
  <Accordion title="Pułapki związane ze strefą czasową">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozstrzygania strefy czasowej.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe cykle sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
