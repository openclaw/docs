---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-07-02T08:52:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego Webhook.

## Szybki start

<Steps>
  <Step title="Dodaj jednorazowe przypomnienie">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Sprawdź swoje zadania">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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
- Definicje zadań, stan wykonania i historia uruchomień są utrwalane we współdzielonej bazie stanu SQLite OpenClaw, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Po uaktualnieniu uruchom `openclaw doctor --fix`, aby zaimportować starsze pliki `~/.openclaw/cron/jobs.json`, `jobs-state.json` oraz `runs/*.jsonl` do SQLite i zmienić ich nazwy, dodając sufiks `.migrated`. Nieprawidłowo sformatowane wiersze zadań są pomijane w czasie wykonywania i kopiowane do `jobs-quarantine.json` w celu późniejszej naprawy lub przeglądu.
- `cron.store` nadal określa logiczny klucz magazynu cron i ścieżkę importu doctor. Po imporcie edycja tego pliku JSON nie zmienia już aktywnych zadań cron; zamiast tego użyj `openclaw cron add|edit|remove` albo metod RPC Cron w Gateway.
- Wszystkie wykonania cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tur agenta są ponownie planowane poza oknem łączenia kanału, zamiast odtwarzać się natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie automatycznie usuwają się po powodzeniu.
- Izolowane uruchomienia Cron w trybie best-effort zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, więc odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia Cron, które otrzymują wąskie uprawnienie samoczyszczenia cron, nadal mogą odczytywać status harmonogramu, przefiltrowaną do siebie listę bieżącego zadania oraz historię uruchomień tego zadania, więc kontrole statusu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do modyfikacji cron.
- Izolowane uruchomienia Cron zabezpieczają się także przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie odpowiada już za ostateczną odpowiedź, OpenClaw ponawia monit raz, prosząc o właściwy wynik przed dostarczeniem.
- Izolowane uruchomienia Cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia, w tym opakowań node-host `UNAVAILABLE`, których zagnieżdżony komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` albo `INVALID_REQUEST`, dzięki czemu zablokowane polecenie nie jest raportowane jako udane uruchomienie, a zwykła proza asystenta nie jest traktowana jako odmowa.
- Izolowane uruchomienia Cron traktują także awarie agenta na poziomie uruchomienia jako błędy zadania, nawet gdy nie powstaje żaden payload odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o awarii zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiąga `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie nie zostanie opróżnione, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze limit czasu, więc zakolejkowana praca czatu nie pozostaje za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera albo przed pierwszym wywołaniem modelu, Cron zapisuje limit czasu specyficzny dla fazy, taki jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te watchdogi obejmują osadzonych dostawców i dostawców opartych na CLI, zanim ich zewnętrzny proces CLI faktycznie się uruchomi, oraz są limitowane niezależnie od długich wartości `timeoutSeconds`, dzięki czemu awarie zimnego startu/uwierzytelniania/kontekstu ujawniają się szybko, zamiast czekać na pełny budżet zadania.
- Jeśli używasz systemowego cron albo innego zewnętrznego harmonogramu do uruchamiania `openclaw agent`, opakuj go eskalacją hard-kill, mimo że CLI obsługuje `SIGTERM`/`SIGINT`. Uruchomienia obsługiwane przez Gateway proszą Gateway o przerwanie zaakceptowanych uruchomień; lokalne i osadzone uruchomienia fallback otrzymują ten sam sygnał przerwania. Dla GNU `timeout` preferuj `timeout -k 60 600 openclaw agent ...` zamiast zwykłego `timeout 600 ...`; wartość `-k` jest zabezpieczeniem nadzorcy, jeśli proces nie może się opróżnić. W jednostkach systemd zachowaj ten sam kształt, używając sygnału zatrzymania `SIGTERM` oraz okna łaski, takiego jak `TimeoutStopSec`, przed ewentualnym końcowym zabiciem. Jeśli ponowienie użyje tego samego `--run-id`, gdy oryginalne uruchomienie Gateway jest nadal aktywne, duplikat zostanie zgłoszony jako będący w toku zamiast uruchamiać drugie wykonanie.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest najpierw własnością runtime, a dopiero potem opiera się na trwałej historii: aktywne zadanie cron pozostaje żywe, dopóki runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej. Gdy runtime przestaje posiadać zadanie i upłynie 5-minutowe okno łaski, kontrole konserwacyjne sprawdzają utrwalone dzienniki uruchomień i stan zadania pod kątem pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik końcowy, księga zadań jest finalizowana na jej podstawie; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramowania według lokalnego czasu zegarowego.

Powtarzające się wyrażenia na początek godziny są automatycznie rozpraszane o maksymalnie 5 minut, aby ograniczyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** z pól, a nie oba. To standardowe zachowanie cron Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5-6 razy miesięcznie zamiast 0-1 razy miesięcznie. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo harmonogramuj według jednego pola i zabezpiecz drugie w monicie lub poleceniu zadania.

## Style wykonywania

| Styl             | Wartość `--session` | Uruchamia się w         | Najlepsze do                    |
| ---------------- | ------------------- | ----------------------- | ------------------------------- |
| Sesja główna     | `main`              | Dedykowana ścieżka wybudzania cron | Przypomnienia, zdarzenia systemowe |
| Izolowany        | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, zadania w tle          |
| Bieżąca sesja    | `current`           | Powiązana w chwili utworzenia | Powtarzalna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Workflowy budujące na historii  |

<AccordionGroup>
  <Accordion title="Sesja główna kontra izolowana kontra niestandardowa">
    Zadania **sesji głównej** kolejkowały zdarzenie systemowe do należącej do cron ścieżki uruchomień i opcjonalnie wybudzają Heartbeat (`--wake now` albo `--wake next-heartbeat`). Mogą używać ostatniego kontekstu dostarczenia docelowej sesji głównej dla odpowiedzi, ale nie dopisują rutynowych tur cron do ludzkiego kanału czatu i nie przedłużają świeżości dziennego/bezczynnościowego resetu dla docelowej sesji. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając workflowy takie jak codzienne standupy budujące na poprzednich podsumowaniach.

    Zdarzenia cron sesji głównej są samodzielnymi przypomnieniami zdarzeń systemowych. Nie
    dołączają automatycznie instrukcji „Read
    HEARTBEAT.md” z domyślnego monitu Heartbeat. Jeśli powtarzające się przypomnienie powinno konsultować
    `HEARTBEAT.md`, powiedz to jawnie w tekście zdarzenia cron albo we
    własnych instrukcjach agenta.

  </Accordion>
  <Accordion title="Co oznacza „świeża sesja” dla zadań izolowanych">
    W przypadku zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkrypcji/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/uwierzytelniania, ale nie dziedziczy otaczającego kontekstu konwersacji ze starszego wiersza cron: routingu kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania runtime ACP. Użyj `current` albo `session:<id>`, gdy powtarzające się zadanie ma celowo budować na tym samym kontekście konwersacji.
  </Accordion>
  <Accordion title="Sprzątanie runtime">
    W przypadku zadań izolowanych wygaszanie runtime obejmuje teraz best-effort sprzątanie przeglądarki dla tej sesji cron. Awarie sprzątania są ignorowane, aby właściwy wynik cron nadal miał pierwszeństwo.

    Izolowane uruchomienia Cron usuwają także wszelkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę sprzątania runtime. Jest to zgodne ze sposobem wygaszania klientów MCP sesji głównej i sesji niestandardowych, więc izolowane zadania cron nie wyciekają procesów potomnych stdio ani długowiecznych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent i dostarczanie Discord">
    Gdy izolowane uruchomienia Cron orkiestrują subagentów, dostarczanie również preferuje ostateczny wynik potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny ostateczny tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie payloady tekstowe, jak i ostateczną odpowiedź. Multimedia i ustrukturyzowane payloady Discord są nadal dostarczane jako osobne payloady, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Payloady poleceń

Używaj payloadów poleceń dla deterministycznych skryptów, które powinny działać w harmonogramie Gateway bez uruchamiania izolowanej tury agenta opartej na modelu. Zadania poleceń wykonują się na hoście Gateway, przechwytują stdout/stderr, zapisują uruchomienie w historii cron i ponownie używają tych samych trybów dostarczania `announce`, `webhook` i `none` co zadania izolowane.

<Note>
Cron poleceń jest powierzchnią automatyzacji administracyjnej operatora w Gateway, a nie wywołaniem
`tools.exec` agenta. Tworzenie, aktualizowanie, usuwanie lub ręczne uruchamianie zadań cron
wymaga `operator.admin`; zaplanowane uruchomienia poleceń wykonują się później wewnątrz
procesu Gateway jako automatyzacja utworzona przez administratora. Zasady exec agenta, takie jak
`tools.exec.mode`, monity zatwierdzania i listy dozwolonych narzędzi na agenta, zarządzają
narzędziami exec widocznymi dla modelu, a nie payloadami cron poleceń.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` przechowuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'`, gdy chcesz dokładnego wykonania argv bez parsowania powłoki. Opcjonalne pola `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` i `--output-max-bytes` kontrolują środowisko procesu, stdin i limity wyjścia.

Jeśli stdout nie jest pusty, ten tekst jest dostarczonym wynikiem. Jeśli stdout jest pusty, a stderr nie jest pusty, dostarczany jest stderr. Jeśli oba strumienie są obecne, cron dostarcza mały blok `stdout:` / `stderr:`. Zerowy kod wyjścia zapisuje uruchomienie jako `ok`; niezerowe wyjście, sygnał, timeout lub timeout braku wyjścia zapisuje `error` i może wyzwolić alerty o niepowodzeniu. Polecenie, które wypisuje tylko `NO_REPLY`, używa standardowego tłumienia cichego tokenu cron i nie publikuje niczego z powrotem na czacie.

### Opcje payloadu dla izolowanych zadań

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla izolowanego).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista modeli fallback dla zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Przekaż `--fallbacks ""`, aby uruchomić ściśle bez fallbacków.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Przy `cron edit` usuwa nadpisanie fallbacków dla zadania, aby zadanie stosowało skonfigurowaną kolejność fallbacków. Nie można łączyć z `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Przy `cron edit` usuwa nadpisanie modelu dla zadania, aby zadanie stosowało normalną kolejność wyboru modelu cron (zapisane nadpisanie sesji cron, jeśli ustawione, w przeciwnym razie model agenta/domyślny). Nie można łączyć z `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu Thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Przy `cron edit` usuwa nadpisanie Thinking dla zadania, aby zadanie stosowało normalną kolejność Thinking cron. Nie można łączyć z `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomija wstrzykiwanie pliku bootstrapu workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicza narzędzia, których zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako podstawowego modelu tego zadania. To nie to samo co nadpisanie `/model` w sesji czatu: skonfigurowane łańcuchy fallback nadal mają zastosowanie, gdy podstawowy model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą też przenosić `fallbacks` na poziomie payloadu. Gdy taka lista jest obecna, zastępuje skonfigurowany łańcuch fallbacków dla zadania. Użyj `fallbacks: []` w payloadzie/API zadania, gdy chcesz ścisłego uruchomienia cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w payloadzie, ani w konfiguracji, OpenClaw przekazuje jawne puste nadpisanie fallback, aby podstawowy model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Kontrole preflight lokalnych providerów przechodzą po skonfigurowanych fallbackach przed oznaczeniem uruchomienia cron jako `skipped`; `fallbacks: []` utrzymuje tę ścieżkę preflight jako ścisłą.

Kolejność wyboru modelu dla izolowanych zadań to:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` w payloadzie zadania
3. Wybrane przez użytkownika zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki również podąża za rozwiązaną aktywną selekcją. Jeśli konfiguracja wybranego modelu ma `params.fastMode`, izolowany cron domyślnie go używa. Zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją w obu kierunkach. Tryb automatyczny używa progu `params.fastAutoOnSeconds` wybranego modelu, gdy jest obecny, domyślnie 60 sekund.

Jeśli izolowane uruchomienie trafi na aktywne przekazanie przełączenia modelu, cron ponawia z przełączonym providerem/modelem i utrwala tę aktywną selekcję dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie przenosi też nowy profil uwierzytelniania, cron utrwala również to nadpisanie profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się w nieskończoność.

Zanim izolowane uruchomienie cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy providerów dla skonfigurowanych providerów `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest local loopback, w sieci prywatnej lub `.local`. Jeśli ten endpoint jest niedostępny, uruchomienie jest zapisywane jako `skipped` z czytelnym błędem providera/modelu zamiast rozpoczynać wywołanie modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele oczekujących zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Uruchomienia pominięte przez preflight providera nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzanych powiadomień o pominięciach.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza tekst końcowy fallbackiem do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła payload zakończonego zdarzenia metodą POST na URL             |
| `none`     | Brak fallbackowego dostarczania przez runner                         |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; OpenClaw akceptuje też należący do Telegram skrót `-1001234567890:123`. Bezpośredni wywołujący RPC/konfiguracji mogą przekazać `delivery.threadId` jako string lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` lub pomija `channel`, cel z prefiksem providera, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Selektorami providerów są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego providera; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwalać WhatsApp interpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami providerów.

Dla izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija fallback announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla trasy fallback announce. Wewnętrzne klucze sesji mogą być małymi literami; cele dostarczania providerów nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych list dozwolonych kanałów do walidacji i przekierowywania przestarzałych celów. Zatwierdzenia ze store parowania DM nie są odbiorcami automatyzacji fallback; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

## Język wyjścia

Zadania Cron nie wywnioskują języka odpowiedzi z kanału, ustawień regionalnych ani poprzednich
wiadomości. Umieść regułę języka w zaplanowanej wiadomości lub szablonie:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

W przypadku plików szablonów trzymaj instrukcję językową w renderowanym prompcie i
sprawdź, czy placeholdery takie jak `{{language}}` są wypełnione przed uruchomieniem zadania. Jeśli
wyjście miesza języki, określ regułę jawnie, na przykład: "Use Chinese
for narrative text and keep technical terms in English."

Powiadomienia o niepowodzeniach używają osobnej ścieżki docelowej:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniach.
- `job.delivery.failureDestination` nadpisuje ją dla zadania.
- Jeśli żadna z nich nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniach wracają teraz do tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że podstawowy tryb dostarczania to `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia mają osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

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
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Nadpisanie modelu i Thinking">
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
  <Tab title="Wyjście Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Wyjście polecenia">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway może udostępniać endpointy HTTP Webhook dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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
    Uruchamia izolowaną turę agenta:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodem.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj endpointy hooków za local loopback, tailnet lub zaufanym reverse proxy.

- Użyj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania gateway.
- Trzymaj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć, do którego efektywnego agenta może kierować hook, w tym agenta domyślnego, gdy `agentId` jest pominięte.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady hooków są domyślnie opakowywane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Podłącz wyzwalacze skrzynki odbiorczej Gmail do OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

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

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` zwraca wynik po zakolejkowaniu ręcznego uruchomienia. Użyj `--wait` dla hooków zamykania, skryptów konserwacyjnych lub innej automatyzacji, która musi blokować działanie do zakończenia zakolejkowanego uruchomienia. Tryb oczekiwania odpytuje dokładnie zwrócone `runId`; kończy się kodem `0` dla statusu `ok` i kodem niezerowym dla `error`, `skipped` albo przekroczenia limitu oczekiwania.

Narzędzie agenta `cron` zwraca zwarte podsumowania zadań (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) z `cron(action: "list")`; użyj `cron(action: "get", jobId: "...")`, aby uzyskać jedną pełną definicję zadania. Bezpośredni wywołujący Gateway mogą przekazać `compact: true` do `cron.list`; pominięcie tej opcji zachowuje istniejącą pełną odpowiedź z podglądami dostarczania.

`openclaw cron create` jest aliasem `openclaw cron add`, a nowe zadania mogą używać pozycyjnego harmonogramu (`"0 9 * * 1"`, `"every 1h"`, `"20m"` albo znacznika czasu ISO), po którym następuje pozycyjny prompt agenta. Użyj `--webhook <url>` w `cron add|create` albo `cron edit`, aby wysłać metodą POST payload zakończonego uruchomienia do punktu końcowego HTTP. Dostarczania Webhook nie można łączyć z flagami dostarczania na czat, takimi jak `--announce`, `--channel`, `--to`, `--thread-id` lub `--account`. W `cron edit` opcje `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` usuwają te pola routingu pojedynczo (każda jest odrzucana razem z odpowiadającą jej flagą ustawiającą), co różni się od `--no-deliver`, które wyłącza awaryjne dostarczanie przez runner.

<Note>
Uwaga o nadpisaniu modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, ten dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Patche payloadu API `cron.update` mogą ustawić `model: null`, aby wyczyścić zapisane nadpisanie modelu zadania.
- `openclaw cron edit <job-id> --clear-model` czyści to nadpisanie z CLI (ten sam efekt co patch `model: null`) i nie może być łączone z `--model`.
- Skonfigurowane łańcuchy awaryjne nadal obowiązują, ponieważ `--model` Cron jest modelem głównym zadania, a nie nadpisaniem sesji `/model`.
- `openclaw cron add|edit --fallbacks ...` ustawia `fallbacks` payloadu, zastępując skonfigurowane mechanizmy awaryjne dla tego zadania; `--fallbacks ""` wyłącza mechanizm awaryjny i wymusza rygorystyczne uruchomienie. `openclaw cron edit <job-id> --clear-fallbacks` czyści nadpisanie dla danego zadania.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy mechanizmów awaryjnych nie przechodzi po cichu do modelu głównego agenta jako dodatkowego celu ponowienia.

</Note>

## Konfiguracja

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` ogranicza zarówno zaplanowaną dyspozycję Cron, jak i wykonywanie izolowanych tur agenta, a domyślnie wynosi 8. Izolowane tury agenta Cron używają wewnętrznie dedykowanej kolejki wykonywania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle, zamiast uruchamiać tylko ich zewnętrzne wrappery Cron. To ustawienie nie poszerza współdzielonej kolejki nie-Cron `nested`.

`cron.store` jest logicznym kluczem magazynu i starszą ścieżką importu dla doctor. Uruchom `openclaw doctor --fix`, aby zaimportować istniejące magazyny JSON do SQLite i je zarchiwizować; przyszłe zmiany Cron powinny przechodzić przez CLI lub API Gateway.

Wyłącz Cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Ponowienie jednorazowe**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoffem. Błędy trwałe wyłączają zadanie natychmiast.

    **Ponowienie cykliczne**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy izolowanych sesji uruchomień. `cron.runLog.keepLines` ogranicza zachowane wiersze historii uruchomień SQLite na zadanie; `maxBytes` jest zachowane dla zgodności konfiguracji ze starszymi dziennikami uruchomień opartymi na plikach.
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
    - Dla harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone z `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się awaryjnego wysłania przez runner. Agent nadal może wysłać wiadomość bezpośrednio narzędziem `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokojów `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie do dokładnej wartości `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko token ciszy (`NO_REPLY` / `no_reply`), OpenClaw wstrzymuje bezpośrednie dostarczanie wychodzące, a także wstrzymuje awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Świeżość resetu dziennego i bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie gateway mogą aktualizować wiersz sesji dla routingu/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - Dla starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odtworzyć `sessionStartedAt` z nagłówka sesji transkryptu JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odtworzonego czasu rozpoczęcia jako bazowej wartości bezczynności.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron bez `--tz` używa strefy czasowej hosta gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozwiązywania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
