---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (Webhook, Gmail) do OpenClaw
    - Wybór między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, webhooks i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-07-01T08:32:12Z"
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
- Definicje zadań, stan wykonywania i historia uruchomień są utrwalane we współdzielonej bazie stanu SQLite OpenClaw, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Po aktualizacji uruchom `openclaw doctor --fix`, aby zaimportować starsze pliki `~/.openclaw/cron/jobs.json`, `jobs-state.json` i `runs/*.jsonl` do SQLite oraz zmienić ich nazwy z sufiksem `.migrated`. Nieprawidłowo sformatowane wiersze zadań są pomijane w runtime i kopiowane do `jobs-quarantine.json` w celu późniejszej naprawy lub przeglądu.
- `cron.store` nadal wskazuje logiczny klucz magazynu cron i ścieżkę importu doctor. Po imporcie edycja tego pliku JSON nie zmienia już aktywnych zadań cron; zamiast tego użyj `openclaw cron add|edit|remove` albo metod RPC cron Gateway.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Podczas startu Gateway zaległe izolowane zadania tur agenta są planowane ponownie poza oknem łączenia z kanałem zamiast natychmiastowego odtwarzania, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie usuwają się automatycznie po powodzeniu.
- Izolowane uruchomienia cron w trybie najlepszych starań zamykają śledzone karty/przeglądarki/procesy dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, aby odłączona automatyzacja przeglądarki nie zostawiała osieroconych procesów.
- Izolowane uruchomienia cron, które otrzymają wąskie uprawnienie do samoczyszczenia cron, nadal mogą odczytywać status harmonogramu, samofiltrowaną listę swojego bieżącego zadania i historię uruchomień tego zadania, więc kontrole statusu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do modyfikacji cron.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne uruchomienie potomnego subagenta nie jest już odpowiedzialne za ostateczną odpowiedź, OpenClaw ponownie prosi raz o faktyczny wynik przed dostarczeniem.
- Izolowane uruchomienia cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia, w tym opakowań `UNAVAILABLE` hosta węzła, których zagnieżdżony komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`, dzięki czemu zablokowane polecenie nie jest raportowane jako poprawne uruchomienie, a zwykła proza asystenta nie jest traktowana jako odmowa.
- Izolowane uruchomienia cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy nie powstanie payload odpowiedzi, więc awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniu zamiast oznaczać zadanie jako udane.
- Gdy izolowane zadanie tury agenta osiąga `timeoutSeconds`, cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na oczyszczenie. Jeśli uruchomienie się nie opróżni, czyszczenie należące do Gateway wymusza zwolnienie własności sesji tego uruchomienia, zanim cron zapisze przekroczenie czasu, dzięki czemu zakolejkowana praca z czatu nie zostaje za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera lub przed pierwszym wywołaniem modelu, cron zapisuje przekroczenie czasu specyficzne dla fazy, takie jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te mechanizmy nadzoru obejmują osadzonych dostawców i dostawców opartych na CLI zanim ich zewnętrzny proces CLI zostanie faktycznie uruchomiony, i są ograniczane niezależnie od długich wartości `timeoutSeconds`, aby awarie zimnego startu/uwierzytelniania/kontekstu ujawniały się szybko zamiast czekać na pełny budżet zadania.
- Jeśli używasz systemowego cron lub innego zewnętrznego harmonogramu do uruchamiania `openclaw agent`, opakuj go eskalacją twardego zakończenia, mimo że CLI obsługuje `SIGTERM`/`SIGINT`. Uruchomienia oparte na Gateway proszą Gateway o przerwanie zaakceptowanych uruchomień; lokalne i osadzone uruchomienia awaryjne otrzymują ten sam sygnał przerwania. Dla GNU `timeout` preferuj `timeout -k 60 600 openclaw agent ...` zamiast zwykłego `timeout 600 ...`; wartość `-k` jest zabezpieczeniem nadzorcy, jeśli proces nie może się opróżnić. Dla jednostek systemd zachowaj ten sam kształt, używając sygnału zatrzymania `SIGTERM` oraz okna łaski, takiego jak `TimeoutStopSec`, przed ostatecznym zabiciem. Jeśli ponowna próba użyje ponownie `--run-id`, gdy oryginalne uruchomienie Gateway nadal jest aktywne, duplikat zostanie zgłoszony jako w toku zamiast uruchamiać drugie uruchomienie.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron najpierw należy do runtime, a dopiero potem opiera się na trwałej historii: aktywne zadanie cron pozostaje żywe, dopóki runtime cron nadal śledzi to zadanie jako uruchomione, nawet jeśli stary wiersz sesji podrzędnej nadal istnieje. Gdy runtime przestanie być właścicielem zadania i wygaśnie 5-minutowe okno łaski, kontrole utrzymaniowe sprawdzają utrwalone dzienniki uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań jest finalizowany na jego podstawie; w przeciwnym razie utrzymanie należące do Gateway może oznaczyć zadanie jako `lost`. Audyt CLI offline może odtworzyć stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 lub względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe lub 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York` dla harmonogramu według lokalnego czasu zegarowego.

Cykliczne wyrażenia na początek godziny są automatycznie rozpraszane o maksymalnie 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjny czas, albo `--stagger 30s`, aby podać jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia cron są parsowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** pole — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 raz w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj według jednego pola i zabezpiecz drugie w prompcie lub poleceniu zadania.

## Style wykonywania

| Styl            | Wartość `--session` | Uruchamiane w          | Najlepsze do                    |
| --------------- | ------------------- | ---------------------- | ------------------------------- |
| Sesja główna    | `main`              | Dedykowana ścieżka wybudzeń cron | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowane `cron:<jobId>` | Raporty, prace w tle            |
| Bieżąca sesja   | `current`           | Powiązana w czasie tworzenia | Cykliczna praca świadoma kontekstu |
| Sesja niestandardowa | `session:custom-id` | Trwała nazwana sesja | Przepływy pracy budujące na historii |

<AccordionGroup>
  <Accordion title="Sesja główna kontra izolowana kontra niestandardowa">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe do ścieżki uruchomień należącej do cron i opcjonalnie wybudzają Heartbeat (`--wake now` albo `--wake next-heartbeat`). Mogą używać ostatniego kontekstu dostarczenia docelowej sesji głównej dla odpowiedzi, ale nie dopisują rutynowych tur cron do ludzkiej ścieżki czatu i nie przedłużają świeżości resetu dziennego/bezczynności dla docelowej sesji. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. **Sesje niestandardowe** (`session:xxx`) utrwalają kontekst między uruchomieniami, umożliwiając przepływy pracy takie jak codzienne standupy budujące na poprzednich podsumowaniach.

    Zdarzenia cron sesji głównej są samodzielnymi przypomnieniami zdarzeń systemowych. Nie
    zawierają automatycznie instrukcji domyślnego promptu Heartbeat „Read
    HEARTBEAT.md”. Jeśli cykliczne przypomnienie powinno odwoływać się do
    `HEARTBEAT.md`, powiedz to jawnie w tekście zdarzenia cron albo we
    własnych instrukcjach agenta.

  </Accordion>
  <Accordion title="Co oznacza „świeża sesja” dla zadań izolowanych">
    Dla zadań izolowanych „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne nadpisania modelu/uwierzytelniania wybrane przez użytkownika, ale nie dziedziczy otaczającego kontekstu rozmowy ze starszego wiersza cron: trasowania kanału/grupy, polityki wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania runtime ACP. Użyj `current` albo `session:<id>`, gdy cykliczne zadanie powinno celowo budować na tym samym kontekście rozmowy.
  </Accordion>
  <Accordion title="Czyszczenie runtime">
    Dla zadań izolowanych zamykanie runtime obejmuje teraz czyszczenie przeglądarki w trybie najlepszych starań dla tej sesji cron. Awarie czyszczenia są ignorowane, więc faktyczny wynik cron nadal ma pierwszeństwo.

    Izolowane uruchomienia cron usuwają też wszelkie dołączone instancje runtime MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia runtime. Odpowiada to sposobowi zamykania klientów MCP sesji głównej i sesji niestandardowej, więc izolowane zadania cron nie powodują wycieków procesów podrzędnych stdio ani długowiecznych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent i dostarczanie do Discord">
    Gdy izolowane uruchomienia cron orkiestrują subagentów, dostarczanie również preferuje ostateczny wynik potomka zamiast nieaktualnego tekstu tymczasowego rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    Dla tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny ostateczny tekst asystenta jeden raz zamiast odtwarzać zarówno streamowane/pośrednie payloady tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane payloady Discord nadal są dostarczane jako osobne payloady, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Payloady poleceń

Używaj payloadów poleceń dla deterministycznych skryptów, które powinny działać wewnątrz harmonogramu Gateway bez uruchamiania izolowanej tury agenta opartej na modelu. Zadania poleceń wykonują się na hoście Gateway, przechwytują stdout/stderr, zapisują uruchomienie w historii cron i używają tych samych trybów dostarczania `announce`, `webhook` oraz `none` co zadania izolowane.

<Note>
Command cron to powierzchnia automatyzacji Gateway dla administratora-operatora, a nie wywołanie
`tools.exec` agenta. Tworzenie, aktualizowanie, usuwanie lub ręczne uruchamianie zadań cron
wymaga `operator.admin`; zaplanowane uruchomienia poleceń wykonują się później wewnątrz
procesu Gateway jako automatyzacja utworzona przez tego administratora. Polityka exec agenta, taka jak
`tools.exec.mode`, prompty zatwierdzenia i listy dozwolonych narzędzi per agent, zarządza
widocznymi dla modelu narzędziami exec, a nie payloadami command cron.
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

`--command <shell>` przechowuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'`, gdy chcesz dokładnego wykonania argv bez parsowania przez powłokę. Opcjonalne pola `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` i `--output-max-bytes` kontrolują środowisko procesu, stdin oraz limity wyjścia.

Jeśli `stdout` nie jest pusty, ten tekst jest dostarczonym wynikiem. Jeśli `stdout` jest pusty, a `stderr` nie jest pusty, dostarczany jest `stderr`. Jeśli obecne są oba strumienie, cron dostarcza mały blok `stdout:` / `stderr:`. Zerowy kod wyjścia zapisuje uruchomienie jako `ok`; niezerowe wyjście, sygnał, timeout lub timeout braku wyjścia zapisuje `error` i może wyzwolić alerty niepowodzenia. Polecenie, które wypisuje tylko `NO_REPLY`, używa zwykłego tłumienia cichego tokenu cron i nie odsyła niczego na czat.

### Opcje ładunku dla zadań izolowanych

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla izolowanego).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista modeli fallback dla pojedynczego zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Przekaż `--fallbacks ""`, aby wykonać ścisłe uruchomienie bez fallbacków.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  W `cron edit` usuwa nadpisanie fallbacków dla pojedynczego zadania, aby zadanie stosowało skonfigurowany priorytet fallbacków. Nie można łączyć z `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  W `cron edit` usuwa nadpisanie modelu dla pojedynczego zadania, aby zadanie stosowało zwykły priorytet wyboru modelu cron (zapisane nadpisanie sesji cron, jeśli ustawione, w przeciwnym razie model agenta/domyślny). Nie można łączyć z `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu myślenia.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  W `cron edit` usuwa nadpisanie myślenia dla pojedynczego zadania, aby zadanie stosowało zwykły priorytet myślenia cron. Nie można łączyć z `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomija wstrzyknięcie pliku bootstrapu workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicza, których narzędzi zadanie może używać, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako głównego modelu tego zadania. To nie jest to samo co nadpisanie `/model` w sesji czatu: skonfigurowane łańcuchy fallbacków nadal obowiązują, gdy główny model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozwiązać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania cron mogą też przenosić `fallbacks` na poziomie ładunku. Gdy są obecne, ta lista zastępuje skonfigurowany łańcuch fallbacków dla zadania. Użyj `fallbacks: []` w ładunku/API zadania, gdy chcesz ścisłe uruchomienie cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma fallbacków ani w ładunku, ani w konfiguracji, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby główny model agenta nie został dołączony jako ukryty dodatkowy cel ponownej próby.

Kontrole preflight lokalnego providera przechodzą przez skonfigurowane fallbacki przed oznaczeniem uruchomienia cron jako `skipped`; `fallbacks: []` utrzymuje tę ścieżkę preflight jako ścisłą.

Priorytet wyboru modelu dla zadań izolowanych:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodziło z Gmail i to nadpisanie jest dozwolone)
2. `model` w ładunku pojedynczego zadania
3. Zapisane nadpisanie modelu sesji cron wybrane przez użytkownika
4. Wybór modelu agenta/domyślnego

Tryb szybki także podąża za rozwiązaną aktywną selekcją. Jeśli wybrana konfiguracja modelu ma `params.fastMode`, izolowany cron używa jej domyślnie. Zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją w obu kierunkach. Tryb automatyczny używa progu `params.fastAutoOnSeconds` wybranego modelu, gdy jest obecny, z domyślną wartością 60 sekund.

Jeśli izolowane uruchomienie trafi na przekazanie live przełączenia modelu, cron ponawia próbę z przełączonym providerem/modelem i utrwala ten wybór live dla aktywnego uruchomienia przed ponowieniem. Gdy przełączenie przenosi też nowy profil auth, cron utrwala również to nadpisanie profilu auth dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy providerów dla skonfigurowanych providerów `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest loopback, w sieci prywatnej lub `.local`. Jeśli ten endpoint nie działa, uruchomienie jest zapisywane jako `skipped` z czytelnym błędem providera/modelu zamiast rozpoczynać wywołanie modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele należnych zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia provider-preflight nie zwiększają backoffu błędów wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzające się powiadomienia o pominięciach.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza tekst końcowy z fallbackiem do celu, jeśli agent nie wysłał |
| `webhook`  | Wysyła ładunek zdarzenia zakończenia metodą POST pod URL            |
| `none`     | Brak fallbackowego dostarczania przez runner                        |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; OpenClaw akceptuje też skrót należący do Telegram `-1001234567890:123`. Bezpośredni wywołujący RPC/konfiguracji mogą przekazać `delivery.threadId` jako string lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego identyfikatora pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` lub pomija `channel`, cel z prefiksem providera, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Tylko prefiksy ogłaszane przez załadowany Plugin są selektorami providera. Jeśli `delivery.channel` jest jawne, prefiks celu musi nazywać tego samego providera; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane, zamiast pozwolić WhatsApp interpretować identyfikator Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami providera.

Dla zadań izolowanych dostarczanie na czat jest współdzielone. Jeśli trasa czatu jest dostępna, agent może użyć narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija fallback announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw zapisuje zachowany aktywny cel dostarczania dla fallbackowej trasy announce. Wewnętrzne klucze sesji mogą być małymi literami; cele dostarczania providera nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych allowlist kanałów do walidacji i ponownego routingu nieaktualnych celów. Zatwierdzenia ze store parowania DM nie są odbiorcami automatyzacji fallback; ustaw `delivery.to` albo skonfiguruj wpis kanału `allowFrom`, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

## Język wyjścia

Zadania cron nie wnioskują języka odpowiedzi z kanału, locale ani poprzednich
wiadomości. Umieść regułę języka w zaplanowanej wiadomości lub szablonie:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

W przypadku plików szablonów zachowaj instrukcję językową w renderowanym prompcie i
sprawdź, czy placeholdery takie jak `{{language}}` są wypełnione przed uruchomieniem zadania. Jeśli
wyjście miesza języki, ustaw regułę jawnie, na przykład: „Używaj chińskiego
dla tekstu narracyjnego i zachowaj terminy techniczne po angielsku”.

Powiadomienia o niepowodzeniach podążają osobną ścieżką docelową:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniach.
- `job.delivery.failureDestination` nadpisuje ją dla pojedynczego zadania.
- Jeśli żadna z nich nie jest ustawiona, a zadanie już dostarcza przez `announce`, powiadomienia o niepowodzeniach wracają teraz do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że głównym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów cron powtarzające się alerty o pominiętych uruchomieniach. Pominięte uruchomienia utrzymują osobny licznik kolejnych pominięć, więc nie wpływają na backoff błędów wykonania.

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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

Gateway może udostępniać endpointy Webhook HTTP dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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
      `now` lub `next-heartbeat`.
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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj endpointy hooków za loopback, tailnetem lub zaufanym reverse proxy.

- Użyj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Trzymaj `hooks.path` w dedykowanej ścieżce podrzędnej; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć, którego efektywnego agenta może wskazywać hook, w tym domyślnego agenta, gdy `agentId` jest pominięte.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że wymagane są sesje wybierane przez wywołującego.
- Jeśli włączysz `hooks.allowRequestSessionKey`, ustaw też `hooks.allowedSessionKeyPrefixes`, aby ograniczyć dozwolone kształty kluczy sesji.
- Ładunki hooków są domyślnie opakowane granicami bezpieczeństwa.

</Warning>

## Integracja Gmail PubSub

Połącz wyzwalacze skrzynki odbiorczej Gmaila z OpenClaw przez Google PubSub.

<Note>
**Wymagania wstępne:** CLI `gcloud`, `gog` (gogcli), włączone hooki OpenClaw, Tailscale dla publicznego punktu końcowego HTTPS.
</Note>

### Konfiguracja kreatorem (zalecane)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

To zapisuje konfigurację `hooks.gmail`, włącza preset Gmaila i używa Tailscale Funnel jako punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawiono `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` podczas startu i automatycznie odnawia watch. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

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
  <Step title="Utwórz temat i przyznaj Gmailowi dostęp push">
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

### Nadpisanie modelu Gmaila

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

`openclaw cron run <jobId>` kończy działanie po dodaniu ręcznego uruchomienia do kolejki. Użyj `--wait` dla hooków zamykania, skryptów konserwacyjnych lub innej automatyzacji, która musi blokować działanie do zakończenia zakolejkowanego uruchomienia. Tryb oczekiwania odpytuje dokładnie zwrócone `runId`; kończy się kodem `0` dla statusu `ok` i kodem niezerowym dla `error`, `skipped` albo przekroczenia limitu oczekiwania.

Narzędzie agenta `cron` zwraca zwięzłe podsumowania zadań (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) z `cron(action: "list")`; użyj `cron(action: "get", jobId: "...")` dla pełnej definicji jednego zadania. Bezpośredni wywołujący Gateway mogą przekazać `compact: true` do `cron.list`; pominięcie tego zachowuje istniejącą pełną odpowiedź z podglądami dostarczania.

`openclaw cron create` jest aliasem dla `openclaw cron add`, a nowe zadania mogą używać pozycyjnego harmonogramu (`"0 9 * * 1"`, `"every 1h"`, `"20m"` albo znacznika czasu ISO), po którym następuje pozycyjny prompt agenta. Użyj `--webhook <url>` przy `cron add|create` lub `cron edit`, aby wysłać POST z ładunkiem zakończonego uruchomienia do punktu końcowego HTTP. Dostarczania przez Webhook nie można łączyć z flagami dostarczania na czat, takimi jak `--announce`, `--channel`, `--to`, `--thread-id` lub `--account`. Przy `cron edit` opcje `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` pojedynczo usuwają te pola trasowania (każda jest odrzucana razem z odpowiadającą jej flagą ustawiającą), co różni się od `--no-deliver`, które wyłącza awaryjne dostarczanie przez runner.

<Note>
Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładny dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony albo nie można go rozpoznać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Łatki ładunku API `cron.update` mogą ustawić `model: null`, aby wyczyścić zapisane nadpisanie modelu zadania.
- `openclaw cron edit <job-id> --clear-model` czyści to nadpisanie z CLI (ten sam efekt co łatka `model: null`) i nie może być łączone z `--model`.
- Skonfigurowane łańcuchy fallback nadal mają zastosowanie, ponieważ cron `--model` jest podstawowym modelem zadania, a nie nadpisaniem sesji `/model`.
- `openclaw cron add|edit --fallbacks ...` ustawia `fallbacks` ładunku, zastępując skonfigurowane fallback dla tego zadania; `--fallbacks ""` wyłącza fallback i wymusza ścisłe uruchomienie. `openclaw cron edit <job-id> --clear-fallbacks` czyści nadpisanie dla danego zadania.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy fallback nie przechodzi po cichu do podstawowego modelu agenta jako dodatkowego celu ponownej próby.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie Cron, jak i wykonywanie izolowanej tury agenta, a domyślnie ma wartość 8. Izolowane tury agenta Cron używają wewnętrznie dedykowanej kolejki wykonawczej `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle zamiast uruchamiać tylko ich zewnętrzne opakowania Cron. Wspólna, niecronowa kolejka `nested` nie jest rozszerzana przez to ustawienie.

`cron.store` to logiczny klucz magazynu i ścieżka importu dla starszego doctor. Uruchom `openclaw doctor --fix`, aby zaimportować istniejące magazyny JSON do SQLite i je zarchiwizować; przyszłe zmiany Cron powinny przechodzić przez CLI albo API Gateway.

Wyłączenie Cron: `cron.enabled: false` albo `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponawiania">
    **Jednorazowe ponowienie**: błędy przejściowe (limit szybkości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym backoff. Błędy trwałe wyłączają natychmiast.

    **Ponowienie cykliczne**: wykładniczy backoff (od 30 s do 60 min) między ponowieniami. Backoff resetuje się po następnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy izolowanych sesji uruchomień. `cron.runLog.keepLines` ogranicza liczbę zachowywanych wierszy historii uruchomień SQLite na zadanie; `maxBytes` jest zachowane dla zgodności konfiguracji ze starszymi dziennikami uruchomień opartymi na plikach.
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
    - Dla harmonogramów `cron` zweryfikuj strefę czasową (`--tz`) względem strefy czasowej hosta.
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie zostało sprawdzone przez `openclaw cron run <jobId> --due`, a zadanie nie było jeszcze należne.

  </Accordion>
  <Accordion title="Cron się uruchomił, ale nie ma dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się awaryjnej wysyłki przez runner. Agent nadal może wysyłać bezpośrednio narzędziem `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczenia (`channel`/`to`) oznacza, że wysyłka wychodząca została pominięta.
    - W Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokojów `delivery.to` mogą kończyć się niepowodzeniem, ponieważ identyfikatory pokojów Matrix rozróżniają wielkość liter. Edytuj zadanie do dokładnej wartości `!room:server` albo `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczenie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` / `no_reply`), OpenClaw wycisza bezpośrednie dostarczanie wychodzące i wycisza także awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czat.
    - Jeśli agent ma sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się zapobiegać rollover w stylu /new">
    - Świeżość resetu dziennego i bezczynności nie opiera się na `updatedAt`; zobacz [Zarządzanie sesją](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji dla trasowania/statusu, ale nie wydłużają `sessionStartedAt` ani `lastInteractionAt`.
    - Dla starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji transkryptu JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu startu jako punktu odniesienia bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
    - Cron bez `--tz` używa strefy czasowej hosta Gateway.
    - Harmonogramy `at` bez strefy czasowej są traktowane jako UTC.
    - Heartbeat `activeHours` używa skonfigurowanego rozpoznawania strefy czasowej.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla wykonań Cron
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury głównej sesji
- [Strefa czasowa](/pl/concepts/timezone) — konfiguracja strefy czasowej
