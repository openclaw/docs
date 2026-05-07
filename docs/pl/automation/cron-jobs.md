---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooki, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhook, i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-05-07T01:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego webhooka.

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
- Po podziale starsze wersje OpenClaw mogą odczytywać `jobs.json`, ale mogą traktować zadania jako nowe, ponieważ pola czasu działania znajdują się teraz w `jobs-state.json`.
- Gdy `jobs.json` zostanie edytowany podczas działania Gateway lub gdy jest on zatrzymany, OpenClaw porównuje zmienione pola harmonogramu z oczekującymi metadanymi slotu czasu działania i czyści nieaktualne wartości `nextRunAtMs`. Czyste zmiany formatowania lub wyłącznie kolejności kluczy zachowują oczekujący slot.
- Wszystkie wykonania Cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tury agenta są planowane poza oknem łączenia kanałów zamiast być natychmiast odtwarzane, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie automatycznie usuwają się po sukcesie.
- Izolowane uruchomienia Cron w najlepszym możliwym zakresie zamykają śledzone karty/prcesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, dzięki czemu odłączona automatyzacja przeglądarki nie pozostawia osieroconych procesów.
- Izolowane uruchomienia Cron, które otrzymają wąskie uprawnienie samooczyszczania Cron, nadal mogą odczytywać status harmonogramu i samofiltrowaną listę swojego bieżącego zadania, dzięki czemu kontrole statusu/heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do mutowania Cron.
- Izolowane uruchomienia Cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie jest już odpowiedzialne za ostateczną odpowiedź, OpenClaw ponownie pyta raz o rzeczywisty wynik przed dostarczeniem.
- Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników końcowego podsumowania/wyjścia, takich jak `SYSTEM_RUN_DENIED` i `INVALID_REQUEST`, dzięki czemu zablokowane polecenie nie jest zgłaszane jako udane uruchomienie.
- Izolowane uruchomienia Cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstaje ładunek odpowiedzi, dzięki czemu awarie modelu/providera zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na oczyszczenie. Jeśli uruchomienie nie zostanie opróżnione, oczyszczanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze przekroczenie limitu czasu, dzięki czemu zakolejkowana praca czatu nie zostaje za nieaktualną sesją przetwarzania.

<a id="maintenance"></a>

<Note>
Rekonsyliacja zadań dla Cron jest najpierw własnością czasu działania, a dopiero potem opiera się na trwałej historii: aktywne zadanie Cron pozostaje żywe, dopóki runtime Cron nadal śledzi to zadanie jako uruchomione, nawet jeśli wciąż istnieje stary wiersz sesji potomnej. Gdy runtime przestanie posiadać zadanie i 5-minutowe okno karencji wygaśnie, kontrole konserwacyjne sprawdzają utrwalone dzienniki uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań jest z niej finalizowany; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie Cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie Cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby planować według lokalnego czasu zegarowego.

Cykliczne wyrażenia na początku godziny są automatycznie rozkładane z przesunięciem do 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, lub `--stagger 30s`, aby podać jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są wieloznaczne, croner dopasowuje, gdy pasuje **którekolwiek** z pól, a nie oba. Jest to standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj według jednego pola i zabezpiecz drugie w prompcie lub poleceniu zadania.

## Style wykonywania

| Styl            | Wartość `--session` | Uruchamiane w           | Najlepsze do                    |
| --------------- | ------------------- | ----------------------- | ------------------------------- |
| Sesja główna    | `main`              | Następna tura heartbeat | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja   | `current`           | Powiązane w czasie tworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe i opcjonalnie wybudzają heartbeat (`--wake now` lub `--wake next-heartbeat`). Te zdarzenia systemowe nie przedłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta z nową sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „nowa sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne wybrane przez użytkownika nadpisania modelu/autoryzacji, ale nie dziedziczy otaczającego kontekstu konwersacji ze starszego wiersza Cron: routingu kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania runtime ACP. Użyj `current` lub `session:<id>`, gdy cykliczne zadanie ma celowo budować na tym samym kontekście konwersacji.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych demontaż runtime obejmuje teraz oczyszczanie przeglądarki w najlepszym możliwym zakresie dla tej sesji Cron. Awarie oczyszczania są ignorowane, aby rzeczywisty wynik Cron nadal był decydujący.

    Izolowane uruchomienia Cron usuwają też wszelkie spakietowane instancje runtime MCP utworzone dla zadania przez wspólną ścieżkę oczyszczania runtime. Odpowiada to sposobowi demontażu klientów MCP sesji głównej i sesji niestandardowych, więc izolowane zadania Cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia Cron orkiestrują subagentów, dostarczanie również preferuje końcowe wyjście potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla docelowych ogłoszeń Discord zawierających tylko tekst OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane ładunki Discord nadal są dostarczane jako osobne ładunki, aby załączniki i komponenty nie zostały pominięte.

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
  Nadpisanie poziomu thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku bootstrap przestrzeni roboczej.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. To nie jest to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallback nadal mają zastosowanie, gdy podstawowy model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Jeśli starsze lub ręcznie edytowane wpisy `jobs.json` przechowują `payload.model` jako `"default"`, `"null"`, pusty ciąg albo JSON `null`, uruchom `openclaw doctor --fix`. Doctor usuwa te nieprawidłowe utrwalone sentinele nadpisań; runtime nie obsługuje ich jako aliasów fallback. Pomiń pole modelu, aby użyć normalnego wyboru modelu agenta/domyślnego.

Zadania Cron mogą też zawierać `fallbacks` na poziomie ładunku. Jeśli lista jest obecna, zastępuje skonfigurowany łańcuch fallback dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłe uruchomienie Cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma ani fallbacków w ładunku, ani skonfigurowanych fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallback, aby podstawowy model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Priorytet wyboru modelu dla zadań izolowanych jest następujący:

1. Nadpisanie modelu haka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku zadania
3. Wybrane przez użytkownika zapisane nadpisanie modelu sesji Cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozwiązaną aktywną selekcją. Jeśli konfiguracja wybranego modelu ma `params.fastMode`, izolowany Cron używa jej domyślnie. Zapisane nadpisanie `fastMode` sesji nadal wygrywa z konfiguracją w obu kierunkach.

Jeśli izolowane uruchomienie trafi na przekazanie przełącznika modelu na żywo, Cron ponawia z przełączonym providerem/modelem i utrwala tę aktywną selekcję dla bieżącego uruchomienia przed ponowieniem. Gdy przełączenie niesie też nowy profil autoryzacji, Cron utrwala również nadpisanie tego profilu autoryzacji dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia Cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie Cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne punkty końcowe providerów dla skonfigurowanych providerów `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest local loopback, siecią prywatną lub `.local`. Jeśli ten punkt końcowy jest niedostępny, uruchomienie jest zapisywane jako `skipped` z jasnym błędem providera/modelu zamiast rozpoczynać wywołanie modelu. Wynik punktu końcowego jest buforowany przez 5 minut, więc wiele wymagalnych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia preflight providera nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzane powiadomienia o pominięciu.

## Dostarczanie i wynik

| Tryb       | Co się dzieje                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza awaryjnie tekst końcowy do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła payload zdarzenia zakończenia metodą POST pod URL            |
| `none`     | Brak awaryjnego dostarczania przez runner                           |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. W przypadku tematów forum Telegram użyj `-1001234567890:topic:123`; bezpośredni wywołujący RPC/konfiguracji mogą też przekazać `delivery.threadId` jako ciąg znaków lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` albo pomija `channel`, cel z prefiksem providera, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Selektorami providera są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawny, prefiks celu musi wskazywać tego samego providera; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwolić WhatsApp zinterpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami providera.

W przypadku izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może używać narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija awaryjne announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla awaryjnej trasy announce. Wewnętrzne klucze sesji mogą być pisane małymi literami; cele dostarczania providera nie są odtwarzane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych list dozwolonych kanałów do weryfikowania i przekierowywania nieaktualnych celów. Zatwierdzenia z magazynu par DM nie są odbiorcami automatyzacji awaryjnej; ustaw `delivery.to` albo skonfiguruj wpis kanału `allowFrom`, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

Powiadomienia o awariach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o awariach.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadna z nich nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o awariach wracają teraz do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że głównym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia utrzymują osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

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

Tokeny w ciągu zapytania są odrzucane.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Kolejkuje zdarzenie systemowe dla głównej sesji:

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
    Uruchamia turę izolowanego agenta:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zmapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` lub `agent` przy użyciu szablonów albo transformacji kodem.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj endpointy hooków za local loopback, tailnetem albo zaufanym zwrotnym proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Trzymaj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć jawne kierowanie `agentId`.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki odbiorczej Gmail do OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego endpointu HTTPS.
</Note>

### Konfiguracja kreatorem (zalecana)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Zapisuje to konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla endpointu push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby zrezygnować.

### Ręczna jednorazowa konfiguracja

<Steps>
  <Step title="Wybierz projekt GCP">
    Wybierz projekt GCP, który posiada klienta OAuth używanego przez `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Utwórz temat i nadaj Gmail dostęp do push">
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
Uwaga o nadpisaniu modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładny provider/model trafia do uruchomienia izolowanego agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Skonfigurowane łańcuchy fallbacków nadal mają zastosowanie, ponieważ `--model` cron jest głównym modelem zadania, a nie nadpisaniem `/model` sesji.
- Payload `fallbacks` zastępuje skonfigurowane fallbacki dla tego zadania; `fallbacks: []` wyłącza fallback i wymusza ścisłe uruchomienie.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy fallbacków nie przechodzi do głównego modelu agenta jako cichy dodatkowy cel ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane dispatchowanie cron, jak i wykonanie tury izolowanego agenta. Tury izolowanych agentów cron używają wewnętrznie dedykowanej kolejki wykonawczej `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM cron postępować równolegle zamiast uruchamiać tylko ich zewnętrzne wrappery cron. Współdzielona nie-cronowa kolejka `nested` nie jest poszerzana przez to ustawienie.

Plik pomocniczy stanu runtime jest wyprowadzany z `cron.store`: magazyn `.json`, taki jak `~/clawd/cron/jobs.json`, używa `~/clawd/cron/jobs-state.json`, natomiast ścieżka magazynu bez sufiksu `.json` dodaje `-state.json`.

Jeśli ręcznie edytujesz `jobs.json`, pozostaw `jobs-state.json` poza kontrolą wersji. OpenClaw używa tego pliku pomocniczego dla oczekujących slotów, aktywnych markerów, metadanych ostatniego uruchomienia i tożsamości harmonogramu, która mówi schedulerowi, kiedy zewnętrznie edytowane zadanie wymaga świeżego `nextRunAtMs`.

Wyłącz cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponowień">
    **Jednorazowe ponowienie**: błędy przejściowe (limit stawek, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe wyłączają natychmiast.

    **Cykliczne ponowienie**: wykładniczy backoff (30s do 60m) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy sesji uruchomień izolowanych. `cron.runLog.maxBytes` / `cron.runLog.keepLines` automatycznie przycinają pliki dziennika uruchomień.
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
    - Sprawdź zmienną środowiskową `cron.enabled` i `OPENCLAW_SKIP_CRON`.
    - Potwierdź, że Gateway działa nieprzerwanie.
    - W przypadku harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie sprawdzono przez `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron uruchomił się, ale nie nastąpiło dostarczenie">
    - Tryb dostarczania `none` oznacza, że nie jest oczekiwane wysłanie awaryjne przez runnera. Agent nadal może wysłać wiadomość bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokojów `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie, podając dokładną wartość `!room:server` lub `room:!room:server` z Matrix.
    - Błędy autoryzacji kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw wstrzyma bezpośrednie dostarczenie wychodzące, a także wstrzyma awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie zostanie opublikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub heartbeat wydaje się uniemożliwiać przełączenie /new-style">
    - Świeżość resetowania dziennego i bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia heartbeat, powiadomienia exec i czynności porządkowe Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji w transkrypcji JSONL, gdy plik jest nadal dostępny. Starsze bezczynne wiersze bez `lastInteractionAt` używają odzyskanego czasu rozpoczęcia jako punktu odniesienia bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozpoznawania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury głównej sesji
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
