---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Decydowanie między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, Webhook i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-06-27T17:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, wybudza agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu lub punktu końcowego Webhook.

## Szybki start

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
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
- Definicje zadań, stan środowiska wykonawczego i historia uruchomień są utrwalane we współdzielonej bazie danych stanu SQLite OpenClaw, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Przy aktualizacji uruchom `openclaw doctor --fix`, aby zaimportować starsze pliki `~/.openclaw/cron/jobs.json`, `jobs-state.json` i `runs/*.jsonl` do SQLite oraz zmienić ich nazwy z sufiksem `.migrated`. Niepoprawnie sformatowane wiersze zadań są pomijane w środowisku wykonawczym i kopiowane do `jobs-quarantine.json` w celu późniejszej naprawy lub przeglądu.
- `cron.store` nadal określa logiczny klucz magazynu Cron i ścieżkę importu doctor. Po imporcie edycja tego pliku JSON nie zmienia już aktywnych zadań Cron; zamiast tego użyj `openclaw cron add|edit|remove` albo metod RPC Cron w Gateway.
- Wszystkie wykonania Cron tworzą rekordy [zadania w tle](/pl/automation/tasks).
- Podczas uruchamiania Gateway zaległe izolowane zadania tur agenta są planowane ponownie poza oknem łączenia kanału zamiast być odtwarzane natychmiast, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia Cron w trybie best-effort zamykają śledzone karty/procesy przeglądarki dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, dzięki czemu odłączona automatyzacja przeglądarki nie zostawia osieroconych procesów.
- Izolowane uruchomienia Cron, które otrzymają wąskie uprawnienie samoczyszczenia Cron, nadal mogą odczytywać stan harmonogramu, samofiltrowaną listę swojego bieżącego zadania i historię uruchomień tego zadania, dzięki czemu kontrole stanu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do modyfikacji Cron.
- Izolowane uruchomienia Cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją stanu (`on it`, `pulling everything together` i podobne wskazówki), a żadne uruchomienie potomnego subagenta nie odpowiada już za końcową odpowiedź, OpenClaw ponownie prosi raz o właściwy wynik przed dostarczeniem.
- Izolowane uruchomienia Cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia, w tym opakowań `UNAVAILABLE` hosta węzła, których zagnieżdżony komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`, więc zablokowane polecenie nie jest raportowane jako zielone uruchomienie, a zwykła proza asystenta nie jest traktowana jako odmowa.
- Izolowane uruchomienia Cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstaje ładunek odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniu zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, Cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na sprzątanie. Jeśli uruchomienie się nie opróżni, sprzątanie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim Cron zapisze przekroczenie czasu, więc zakolejkowana praca czatu nie zostaje za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera lub przed pierwszym wywołaniem modelu, Cron zapisuje przekroczenie czasu właściwe dla fazy, takie jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te watchdogy obejmują osadzonych dostawców i dostawców opartych na CLI, zanim ich zewnętrzny proces CLI zostanie faktycznie uruchomiony, i są limitowane niezależnie od długich wartości `timeoutSeconds`, aby awarie zimnego startu/uwierzytelniania/kontekstu pojawiały się szybko zamiast czekać na pełny budżet zadania.
- Jeśli używasz systemowego crona albo innego zewnętrznego harmonogramu do uruchamiania `openclaw agent`, opakuj go eskalacją twardego ubicia, mimo że CLI obsługuje `SIGTERM`/`SIGINT`. Uruchomienia oparte na Gateway proszą Gateway o przerwanie zaakceptowanych uruchomień; lokalne i osadzone uruchomienia awaryjne otrzymują ten sam sygnał przerwania. Dla GNU `timeout` preferuj `timeout -k 60 600 openclaw agent ...` zamiast zwykłego `timeout 600 ...`; wartość `-k` jest zabezpieczeniem nadzorcy, jeśli proces nie może się opróżnić. Dla jednostek systemd zachowaj ten sam kształt, używając sygnału zatrzymania `SIGTERM` oraz okna karencji, takiego jak `TimeoutStopSec`, przed ewentualnym końcowym ubiciem. Jeśli ponowna próba użyje ponownie `--run-id`, gdy pierwotne uruchomienie Gateway nadal jest aktywne, duplikat jest raportowany jako w toku zamiast uruchamiać drugie uruchomienie.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla Cron jest najpierw własnością środowiska wykonawczego, a dopiero potem opiera się na trwałej historii: aktywne zadanie Cron pozostaje żywe, dopóki środowisko wykonawcze Cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej. Gdy środowisko wykonawcze przestanie posiadać zadanie i minie 5-minutowe okno karencji, czynności utrzymaniowe sprawdzają utrwalone dzienniki uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, księga zadań jest finalizowana na jej podstawie; w przeciwnym razie utrzymanie należące do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odzyskać dane z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie Cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                   |
| ------- | --------- | ------------------------------------------------------ |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                         |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie Cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby planować według lokalnego czasu zegarowego.

Powtarzające się wyrażenia na początek godziny są automatycznie rozłożone o maksymalnie 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby ustawić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są wieloznacznikami, croner dopasowuje, gdy pasuje **którekolwiek** z pól — nie oba. To standardowe zachowanie crona Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj według jednego pola i sprawdź drugie w prompcie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w         | Najlepsze do                    |
| --------------- | ------------------- | ----------------------- | ------------------------------- |
| Sesja główna    | `main`              | Dedykowana ścieżka wybudzania Cron | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, prace w tle            |
| Bieżąca sesja   | `current`           | Powiązana w chwili utworzenia | Powtarzalna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja    | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe do ścieżki uruchomień należącej do Cron i opcjonalnie wybudzają Heartbeat (`--wake now` lub `--wake next-heartbeat`). Mogą używać ostatniego kontekstu dostarczenia docelowej sesji głównej do odpowiedzi, ale nie dopisują rutynowych tur Cron do ścieżki czatu z człowiekiem i nie przedłużają świeżości dziennego/bezczynnego resetu dla sesji docelowej. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.

    Zdarzenia Cron w sesji głównej są samodzielnymi przypomnieniami zdarzeń systemowych. Nie
    zawierają automatycznie instrukcji „Read
    HEARTBEAT.md” z domyślnego promptu Heartbeat. Jeśli powtarzające się przypomnienie powinno konsultować
    `HEARTBEAT.md`, powiedz to jawnie w tekście zdarzenia Cron albo we
    własnych instrukcjach agenta.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkrypcji/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawnie wybrane przez użytkownika nadpisania modelu/uwierzytelniania, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza Cron: routingu kanału/grupy, polityki wysyłania lub kolejkowania, podwyższenia uprawnień, pochodzenia ani powiązania środowiska wykonawczego ACP. Użyj `current` lub `session:<id>`, gdy powtarzające się zadanie ma celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych sprzątanie środowiska wykonawczego obejmuje teraz best-effort sprzątanie przeglądarki dla tej sesji Cron. Błędy sprzątania są ignorowane, więc rzeczywisty wynik Cron nadal ma pierwszeństwo.

    Izolowane uruchomienia Cron usuwają też wszystkie dołączone instancje środowiska wykonawczego MCP utworzone dla zadania za pośrednictwem współdzielonej ścieżki sprzątania środowiska wykonawczego. Odpowiada to sposobowi zamykania klientów MCP sesji głównej i sesji niestandardowych, więc izolowane zadania Cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia Cron orkiestrują subagentów, dostarczanie także preferuje końcowy wynik potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz, zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane ładunki Discord nadal są dostarczane jako osobne ładunki, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Ładunki poleceń

Używaj ładunków poleceń dla deterministycznych skryptów, które powinny działać wewnątrz harmonogramu Gateway bez uruchamiania izolowanej tury agenta wspieranej przez model. Zadania poleceń wykonują się na hoście Gateway, przechwytują stdout/stderr, zapisują uruchomienie w historii Cron i używają tych samych trybów dostarczania `announce`, `webhook` i `none` co zadania izolowane.

<Note>
Cron poleceń to powierzchnia automatyzacji Gateway dla operatora-administratora, a nie wywołanie
`tools.exec` agenta. Tworzenie, aktualizowanie, usuwanie lub ręczne uruchamianie zadań Cron
wymaga `operator.admin`; zaplanowane uruchomienia poleceń wykonują się później wewnątrz
procesu Gateway jako automatyzacja autorstwa tego administratora. Polityka exec agenta, taka jak
`tools.exec.mode`, prompty zatwierdzeń i listy dozwolonych narzędzi dla agentów, zarządza
narzędziami exec widocznymi dla modelu, a nie ładunkami Cron poleceń.
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

`--command <shell>` zapisuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'`, gdy chcesz dokładnego wykonania argv bez parsowania powłoki. Opcjonalne pola `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` i `--output-max-bytes` kontrolują środowisko procesu, stdin i limity wyjścia.

Jeśli stdout nie jest pusty, ten tekst jest dostarczonym wynikiem. Jeśli stdout jest pusty, a stderr nie jest pusty, dostarczany jest stderr. Jeśli obecne są oba strumienie, Cron dostarcza mały blok `stdout:` / `stderr:`. Zerowy kod wyjścia zapisuje uruchomienie jako `ok`; niezerowe wyjście, sygnał, timeout lub timeout braku wyjścia zapisuje `error` i może wyzwolić alerty o awarii. Polecenie, które wypisuje tylko `NO_REPLY`, używa standardowego tłumienia cichego tokena Cron i nie publikuje niczego z powrotem na czacie.

### Opcje payloadu dla izolowanych zadań

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla trybu izolowanego).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista modeli fallback dla danego zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Przekaż `--fallbacks ""`, aby wykonać ścisłe uruchomienie bez fallbacków.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  W `cron edit` usuwa nadpisanie fallbacków dla danego zadania, aby zadanie korzystało ze skonfigurowanej kolejności fallbacków. Nie można łączyć z `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  W `cron edit` usuwa nadpisanie modelu dla danego zadania, aby zadanie korzystało ze standardowej kolejności wyboru modelu Cron (zapisane nadpisanie sesji Cron, jeśli ustawione, w przeciwnym razie model agenta/domyślny). Nie można łączyć z `--model`.
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

`--model` używa wybranego dozwolonego modelu jako głównego modelu tego zadania. To nie jest to samo co nadpisanie `/model` w sesji czatu: skonfigurowane łańcuchy fallbacków nadal mają zastosowanie, gdy główny model zadania zawiedzie. Jeśli żądany model nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą także przenosić `fallbacks` na poziomie payloadu. Gdy są obecne, lista ta zastępuje skonfigurowany łańcuch fallbacków dla zadania. Użyj `fallbacks: []` w payloadzie/API zadania, gdy chcesz ścisłego uruchomienia Cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma ani fallbacków w payloadzie, ani skonfigurowanych fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby główny model agenta nie został dołączony jako ukryty dodatkowy cel ponowienia.

Kontrole wstępne dostawcy lokalnego przechodzą przez skonfigurowane fallbacki przed oznaczeniem uruchomienia Cron jako `skipped`; `fallbacks: []` utrzymuje tę ścieżkę kontroli wstępnej w trybie ścisłym.

Kolejność wyboru modelu dla izolowanych zadań:

1. Nadpisanie modelu haka Gmail (gdy uruchomienie pochodziło z Gmaila i to nadpisanie jest dozwolone)
2. `model` w payloadzie danego zadania
3. Zapisane nadpisanie modelu sesji Cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb szybki także podąża za rozwiązaną aktywną selekcją. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany Cron używa tego domyślnie. Zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją w obu kierunkach. Tryb automatyczny używa progu `params.fastAutoOnSeconds` wybranego modelu, gdy jest obecny, domyślnie 60 sekund.

Jeśli izolowane uruchomienie trafi na przekazanie przełączenia modelu na żywo, Cron ponawia z przełączonym dostawcą/modelem i utrwala tę aktywną selekcję dla bieżącego uruchomienia przed ponowieniem. Gdy przełączenie przenosi także nowy profil uwierzytelniania, Cron utrwala również nadpisanie tego profilu uwierzytelniania dla bieżącego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia Cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie Cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest loopback, w sieci prywatnej albo `.local`. Jeśli ten endpoint nie działa, uruchomienie jest zapisywane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczynania wywołania modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele zaplanowanych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć lawinę żądań. Pominięte uruchomienia po kontroli wstępnej dostawcy nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz otrzymywać powtarzane powiadomienia o pominięciu.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza tekst końcowy fallbackiem do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła payload zdarzenia zakończenia metodą POST pod URL            |
| `none`     | Brak fallbackowego dostarczenia przez runner                        |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; OpenClaw akceptuje także skrót należący do Telegram: `-1001234567890:123`. Bezpośredni wywołujący RPC/konfiguracji mogą przekazać `delivery.threadId` jako string lub number. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim Cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Tylko prefiksy ogłaszane przez załadowany Plugin są selektorami dostawcy. Jeśli `delivery.channel` jest jawne, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwolić WhatsApp zinterpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami dostawcy.

Dla izolowanych zadań dostarczanie czatu jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message`, nawet gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija fallback announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw przechowuje zachowany aktywny cel dostarczania dla fallbackowej trasy announce. Wewnętrzne klucze sesji mogą być zapisane małymi literami; cele dostarczania dostawcy nie są odtwarzane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych allowlist kanałów do walidacji i przekierowania nieaktualnych celów. Zatwierdzenia z magazynu par DM nie są odbiorcami automatyzacji fallbackowej; ustaw `delivery.to` albo skonfiguruj wpis kanału `allowFrom`, gdy zaplanowane zadanie ma proaktywnie wysłać wiadomość do DM.

## Język wyjściowy

Zadania Cron nie wywnioskują języka odpowiedzi z kanału, ustawień regionalnych ani poprzednich
wiadomości. Umieść regułę języka w zaplanowanej wiadomości lub szablonie:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Dla plików szablonów zachowaj instrukcję języka w wyrenderowanym prompcie i
sprawdź, czy placeholdery takie jak `{{language}}` są wypełnione przed uruchomieniem zadania. Jeśli
wyjście miesza języki, ustaw regułę jawnie, na przykład: „Używaj chińskiego
dla tekstu narracyjnego i zachowaj terminy techniczne po angielsku”.

Powiadomienia o awariach korzystają z osobnej ścieżki celu:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o awariach.
- `job.delivery.failureDestination` nadpisuje ją dla danego zadania.
- Jeśli żadne z nich nie jest ustawione, a zadanie już dostarcza przez `announce`, powiadomienia o awariach wracają teraz do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że główny tryb dostarczania to `webhook`.
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

## Webhooki

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

Każde żądanie musi zawierać token haka w nagłówku:

- `Authorization: Bearer <token>` (zalecane)
- `x-openclaw-token: <token>`

Tokeny w query string są odrzucane.

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
  <Accordion title="Zmapowane haki (POST /hooks/<name>)">
    Niestandardowe nazwy haków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne payloady w akcje `wake` albo `agent` za pomocą szablonów lub transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj endpointy haków za loopback, tailnetem albo zaufanym reverse proxy.

- Używaj dedykowanego tokena haka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Trzymaj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć, na którego efektywnego agenta może celować hak, w tym domyślnego agenta, gdy `agentId` jest pominięte.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw także `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Payloady haków są domyślnie opakowywane granicami bezpieczeństwa.

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

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel jako punktu końcowego push.

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

`openclaw cron run <jobId>` zwraca wynik po dodaniu ręcznego uruchomienia do kolejki. Użyj `--wait` dla hooków zamykania, skryptów konserwacyjnych lub innej automatyzacji, która musi blokować działanie do zakończenia zakolejkowanego uruchomienia. Tryb oczekiwania odpytuje dokładnie zwrócone `runId`; kończy z kodem `0` dla statusu `ok` oraz kodem niezerowym dla `error`, `skipped` albo przekroczenia limitu oczekiwania.

Narzędzie agenta `cron` zwraca kompaktowe podsumowania zadań (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) z `cron(action: "list")`; użyj `cron(action: "get", jobId: "...")` dla jednej pełnej definicji zadania. Bezpośredni wywołujący Gateway mogą przekazać `compact: true` do `cron.list`; pominięcie tej opcji zachowuje istniejącą pełną odpowiedź z podglądami dostarczenia.

`openclaw cron create` jest aliasem dla `openclaw cron add`, a nowe zadania mogą używać harmonogramu pozycyjnego (`"0 9 * * 1"`, `"every 1h"`, `"20m"` albo znacznika czasu ISO), po którym następuje pozycyjny prompt agenta. Użyj `--webhook <url>` z `cron add|create` lub `cron edit`, aby wysłać ładunek zakończonego uruchomienia metodą POST do punktu końcowego HTTP. Dostarczenia Webhook nie można łączyć z flagami dostarczania czatu, takimi jak `--announce`, `--channel`, `--to`, `--thread-id` lub `--account`. W `cron edit` opcje `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` usuwają te pola routingu pojedynczo (każda jest odrzucana razem z odpowiadającą jej flagą ustawiającą), co różni się od `--no-deliver`, które wyłącza zapasowe dostarczanie runnera.

<Note>
Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia model wybrany dla zadania.
- Jeśli model jest dozwolony, dokładny provider/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Poprawki ładunku API `cron.update` mogą ustawić `model: null`, aby wyczyścić zapisane nadpisanie modelu zadania.
- `openclaw cron edit <job-id> --clear-model` czyści to nadpisanie z CLI (ten sam efekt co poprawka `model: null`) i nie może być łączone z `--model`.
- Skonfigurowane łańcuchy zapasowe nadal obowiązują, ponieważ `--model` Cron jest modelem głównym zadania, a nie nadpisaniem sesji `/model`.
- `openclaw cron add|edit --fallbacks ...` ustawia `fallbacks` w ładunku, zastępując skonfigurowane opcje zapasowe dla tego zadania; `--fallbacks ""` wyłącza tryb zapasowy i wymusza ścisłe uruchomienie. `openclaw cron edit <job-id> --clear-fallbacks` czyści nadpisanie dla danego zadania.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy zapasowej nie przechodzi po cichu do głównego modelu agenta jako dodatkowego celu ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie Cron, jak i wykonywanie izolowanych tur agenta, a domyślnie ma wartość 8. Izolowane tury agenta Cron używają wewnętrznie dedykowanej ścieżki wykonania kolejki `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle, zamiast tylko uruchamiać ich zewnętrzne opakowania Cron. Współdzielona ścieżka `nested` niezwiązana z Cron nie jest poszerzana przez to ustawienie.

`cron.store` to logiczny klucz magazynu i ścieżka importu dla starszych wersji doctor. Uruchom `openclaw doctor --fix`, aby zaimportować istniejące magazyny JSON do SQLite i je zarchiwizować; przyszłe zmiany Cron powinny przechodzić przez CLI lub API Gateway.

Wyłącz Cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Jednorazowe ponowienie**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym opóźnieniem. Błędy trwałe wyłączają zadanie natychmiast.

    **Ponowienie cykliczne**: wykładnicze opóźnienie (od 30 s do 60 min) między ponowieniami. Opóźnienie resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (domyślnie `24h`) usuwa stare wpisy izolowanych sesji uruchomień. `cron.runLog.keepLines` ogranicza liczbę zachowanych wierszy historii uruchomień SQLite na zadanie; `maxBytes` jest zachowane dla zgodności konfiguracji ze starszymi logami uruchomień opartymi na plikach.
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
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się zapasowego wysłania przez runnera. Agent nadal może wysłać bezpośrednio za pomocą narzędzia `message`, gdy trasa czatu jest dostępna.
    - Brakujący/nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że ruch wychodzący został pominięty.
    - Dla Matrix skopiowane lub starsze zadania z identyfikatorami pokojów `delivery.to` zapisanymi małymi literami mogą kończyć się niepowodzeniem, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie do dokładnej wartości `!room:server` albo `room:!room:server` z Matrix.
    - Błędy autoryzacji kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw tłumi bezpośrednie dostarczenie wychodzące i tłumi także zapasową ścieżkę zakolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Świeżość dziennego i bezczynnego resetu nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji dla routingu/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - W przypadku starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odtworzyć `sessionStartedAt` z nagłówka sesji transkryptu JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odtworzonego czasu startu jako swojej bazowej wartości bezczynności.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - `activeHours` Heartbeat używa skonfigurowanego rozwiązywania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
