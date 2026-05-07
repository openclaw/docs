---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooki, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-07T13:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego webhook.

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
- Stan wykonania w czasie działania jest utrwalany obok nich w `~/.openclaw/cron/jobs-state.json`. Jeśli śledzisz definicje cron w git, śledź `jobs.json` i dodaj `jobs-state.json` do gitignore.
- Po rozdzieleniu starsze wersje OpenClaw mogą odczytywać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola runtime znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` jest edytowany podczas działania Gateway lub gdy jest zatrzymany, OpenClaw porównuje zmienione pola harmonogramu z metadanymi oczekującego slotu runtime i czyści nieaktualne wartości `nextRunAtMs`. Przepisanie dotyczące wyłącznie formatowania lub kolejności kluczy zachowuje oczekujący slot.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tury agenta są planowane ponownie poza oknem łączenia kanałów zamiast odtwarzania ich natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja natywnych poleceń pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia cron w miarę możliwości zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, więc odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia cron, które otrzymują wąskie uprawnienie do samooczyszczania cron, nadal mogą odczytywać status harmonogramu i samofiltrowaną listę swojego bieżącego zadania, więc kontrole statusu/heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do mutacji cron.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne uruchomienie podrzędnego subagenta nie jest nadal odpowiedzialne za ostateczną odpowiedź, OpenClaw ponownie odpytuje raz o rzeczywisty wynik przed dostarczeniem.
- Izolowane uruchomienia cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych końcowych znaczników podsumowania/wyjścia, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, więc zablokowane polecenie nie jest raportowane jako zielone uruchomienie.
- Izolowane uruchomienia cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstaje payload odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniu zamiast oznaczania zadania jako udanego.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na oczyszczenie. Jeśli uruchomienie nie zostanie opróżnione, oczyszczanie zarządzane przez Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim cron zapisze timeout, więc zakolejkowana praca czatu nie zostaje za nieaktualną sesją przetwarzania.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest najpierw własnością runtime, a dopiero potem jest oparte na trwałej historii: aktywne zadanie cron pozostaje żywe, dopóki runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli stary wiersz sesji podrzędnej nadal istnieje. Gdy runtime przestanie być właścicielem zadania i 5-minutowe okno karencji wygaśnie, kontrole konserwacyjne sprawdzają utrwalone logi uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, ledger zadań jest finalizowany na jego podstawie; w przeciwnym razie konserwacja zarządzana przez Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie cron zarządzane przez Gateway zniknęło.
</Note>

## Typy harmonogramu

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla planowania według lokalnego czasu zegarowego.

Powtarzające się wyrażenia na początek godziny są automatycznie rozpraszane o maksymalnie 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** z pól — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Croner. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Croner (`0 9 15 * +1`) albo zaplanuj według jednego pola i sprawdzaj drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w         | Najlepsze do                    |
| --------------- | ------------------- | ----------------------- | ------------------------------- |
| Sesja główna    | `main`              | Następna tura heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Wiązana w czasie tworzenia | Powtarzająca się praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Sesja główna kontra izolowana kontra niestandardowa">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie wydłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy, takie jak codzienne standupy budujące na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="Co oznacza „świeża sesja” dla zadań izolowanych">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/uwierzytelniania, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza cron: routingu kanału/grupy, polityki wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania runtime ACP. Użyj `current` lub `session:<id>`, gdy powtarzające się zadanie ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Oczyszczanie runtime">
    Dla zadań izolowanych wygaszanie runtime obejmuje teraz najlepsze możliwe oczyszczanie przeglądarki dla tej sesji cron. Niepowodzenia oczyszczania są ignorowane, aby rzeczywisty wynik cron nadal miał pierwszeństwo.

    Izolowane uruchomienia cron usuwają też wszystkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę oczyszczania runtime. Jest to zgodne ze sposobem wygaszania klientów MCP sesji głównej i sesji niestandardowej, więc izolowane zadania cron nie pozostawiają wyciekających procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Dostarczanie subagenta i Discord">
    Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczanie preferuje też końcowe wyjście potomka zamiast nieaktualnego tekstu tymczasowego rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie payloady tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane payloady Discord nadal są dostarczane jako oddzielne payloady, aby załączniki i komponenty nie zostały pominięte.

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
  Pomiń wstrzykiwanie pliku bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. Nie jest to to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallback nadal mają zastosowanie, gdy podstawowy model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą też przenosić `fallbacks` na poziomie payloadu. Gdy są obecne, ta lista zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w payloadzie/API zadania, gdy chcesz ścisłe uruchomienie cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w payloadzie, ani w konfiguracji, OpenClaw przekazuje jawne puste nadpisanie fallback, aby podstawowy model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Pierwszeństwo wyboru modelu dla zadań izolowanych jest następujące:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` payloadu na zadanie
3. Przechowywane nadpisanie modelu sesji cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślny

Tryb szybki również podąża za rozwiązaną żywą selekcją. Jeśli konfiguracja wybranego modelu ma `params.fastMode`, izolowany cron domyślnie tego używa. Przechowywane nadpisanie `fastMode` sesji nadal wygrywa nad konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na żywe przekazanie przełączenia modelu, cron ponawia z przełączonym dostawcą/modelem i utrwala ten żywy wybór dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie przenosi też nowy profil uwierzytelniania, cron utrwala również nadpisanie tego profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne punkty końcowe dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest loopback, siecią prywatną lub `.local`. Jeśli ten punkt końcowy jest niedostępny, uruchomienie jest zapisywane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczynania wywołania modelu. Wynik punktu końcowego jest buforowany przez 5 minut, więc wiele wymagalnych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia wstępnej kontroli dostawcy nie zwiększają backoffu błędu wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz otrzymywać powtarzające się powiadomienia o pominięciu.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza końcowy tekst fallbackiem do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła POST payload zdarzenia zakończenia do URL                    |
| `none`     | Brak fallbackowego dostarczania runnera                             |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfiguracji mogą też przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie ogłoszenia używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim Cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwalać WhatsApp interpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami dostawcy.

W przypadku izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija ogłoszenie awaryjne. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw przechowuje zachowany cel dostarczania na żywo dla awaryjnej trasy ogłoszenia. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania dostawcy nie są odtwarzane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie ogłoszeń używa skonfigurowanych list dozwolonych kanałów do walidowania i przekierowywania nieaktualnych celów. Zatwierdzenia z magazynu parowania DM nie są odbiorcami automatyzacji awaryjnej; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o błędach używają osobnej ścieżki celu:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o błędach.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o błędach wracają teraz do tego podstawowego celu ogłoszenia.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowy tryb dostarczania to `webhook`.
- `failureAlert.includeSkipped: true` włącza powtarzane alerty o pominiętych uruchomieniach dla zadania albo globalnej polityki alertów Cron. Pominięte uruchomienia utrzymują osobny licznik kolejnych pominięć, więc nie wpływają na wycofywanie po błędach wykonania.

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
  <Accordion title="Mapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` albo `agent` za pomocą szablonów lub przekształceń kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Utrzymuj punkty końcowe hooków za loopback, tailnetem albo zaufanym odwrotnym proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Utrzymuj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
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

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i `hooks.gmail.account` jest ustawione, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

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
  <Step title="Utwórz temat i przyznaj Gmail dostęp push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Uruchom obserwację">
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
- Skonfigurowane łańcuchy awaryjne nadal obowiązują, ponieważ `--model` Cron jest podstawowym modelem zadania, a nie nadpisaniem sesji `/model`.
- Ładunek `fallbacks` zastępuje skonfigurowane fallbacki dla tego zadania; `fallbacks: []` wyłącza fallback i wymusza ścisłe uruchomienie.
- Zwykłe `--model` bez jawnej albo skonfigurowanej listy fallbacków nie przechodzi po cichu do podstawowego modelu agenta jako dodatkowy cel ponownej próby.

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

`maxConcurrentRuns` ogranicza zarówno wysyłanie zaplanowanych zadań Cron, jak i wykonywanie izolowanych tur agenta. Izolowane tury agenta Cron używają wewnętrznie dedykowanej kolejki wykonania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne opakowania Cron. Współdzielona ścieżka `nested` poza Cron nie jest poszerzana przez to ustawienie.

Boczny plik stanu środowiska uruchomieniowego jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego bocznego pliku dla oczekujących slotów, aktywnych znaczników, metadanych ostatniego uruchomienia oraz tożsamości harmonogramu, która informuje scheduler, kiedy zewnętrznie edytowane zadanie wymaga świeżego `nextRunAtMs`.

Wyłącz Cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponawiania">
    **Ponawianie jednorazowe**: błędy przejściowe (limit częstotliwości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym wycofywaniem. Błędy trwałe wyłączają natychmiast.

    **Ponawianie cykliczne**: wykładnicze wycofywanie (od 30 s do 60 min) między próbami. Wycofywanie resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Utrzymanie">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy izolowanych sesji uruchomieniowych. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
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
  <Accordion title="Cron nie uruchamia się">
    - Sprawdź `cron.enabled` i zmienną środowiskową `OPENCLAW_SKIP_CRON`.
    - Potwierdź, że Gateway działa nieprzerwanie.
    - Dla harmonogramów `cron` sprawdź strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone za pomocą `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron się uruchomił, ale bez dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się awaryjnego wysłania przez runnera. Agent nadal może wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący lub nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że wysyłanie wychodzące zostało pominięte.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokojów `delivery.to` mogą kończyć się niepowodzeniem, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie, ustawiając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez dane uwierzytelniające.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczenie wychodzące, a także zapasową ścieżkę podsumowania w kolejce, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z wcześniejszym czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się blokować przejście /new-style">
    - Świeżość resetu dziennego i bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesjami](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcie JSONL, jeśli plik nadal jest dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako swojej bazowej wartości bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozstrzygania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
