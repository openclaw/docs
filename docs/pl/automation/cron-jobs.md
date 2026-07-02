---
read_when:
    - Planowanie zadań w tle lub wybudzeń
    - Podłączanie zewnętrznych wyzwalaczy (webhooków, Gmaila) do OpenClaw
    - Decydowanie między Heartbeat a Cron dla zaplanowanych zadań
sidebarTitle: Scheduled tasks
summary: Zaplanowane zadania, webhooki i wyzwalacze Gmail PubSub dla harmonogramu Gateway
title: Zaplanowane zadania
x-i18n:
    generated_at: "2026-07-02T01:16:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron to wbudowany harmonogram Gateway. Utrwala zadania, budzi agenta we właściwym czasie i może dostarczać wynik z powrotem do kanału czatu albo punktu końcowego Webhook.

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

## Jak działa cron

- Cron działa **wewnątrz procesu Gateway** (nie wewnątrz modelu).
- Definicje zadań, stan środowiska wykonawczego i historia uruchomień są utrwalane we współdzielonej bazie stanu SQLite OpenClaw, więc ponowne uruchomienia nie powodują utraty harmonogramów.
- Po aktualizacji uruchom `openclaw doctor --fix`, aby zaimportować starsze pliki `~/.openclaw/cron/jobs.json`, `jobs-state.json` i `runs/*.jsonl` do SQLite oraz zmienić ich nazwy, dodając sufiks `.migrated`. Nieprawidłowo sformatowane wiersze zadań są pomijane przez środowisko wykonawcze i kopiowane do `jobs-quarantine.json` w celu późniejszej naprawy lub przeglądu.
- `cron.store` nadal wskazuje logiczny klucz magazynu cron i ścieżkę importu dla doctor. Po imporcie edytowanie tego pliku JSON nie zmienia już aktywnych zadań cron; zamiast tego użyj `openclaw cron add|edit|remove` albo metod RPC cron w Gateway.
- Wszystkie wykonania cron tworzą rekordy [zadań w tle](/pl/automation/tasks).
- Przy starcie Gateway zaległe izolowane zadania tur agenta są ponownie planowane poza oknem łączenia kanału zamiast natychmiastowego odtwarzania, dzięki czemu uruchamianie Discord/Telegram i konfiguracja poleceń natywnych pozostają responsywne po restartach.
- Zadania jednorazowe (`--at`) domyślnie automatycznie usuwają się po powodzeniu.
- Izolowane uruchomienia cron podejmują najlepszą możliwą próbę zamknięcia śledzonych kart/przeglądarek i procesów dla swojej sesji `cron:<jobId>` po zakończeniu uruchomienia, aby odłączona automatyzacja przeglądarki nie pozostawiała osieroconych procesów.
- Izolowane uruchomienia cron, które otrzymają wąskie uprawnienie do samoczyszczenia cron, nadal mogą odczytywać status harmonogramu, samofiltrowaną listę swojego bieżącego zadania oraz historię uruchomień tego zadania, dzięki czemu kontrole statusu/Heartbeat mogą sprawdzać własny harmonogram bez uzyskiwania szerszego dostępu do modyfikowania cron.
- Izolowane uruchomienia cron chronią też przed nieaktualnymi odpowiedziami potwierdzającymi. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu (`on it`, `pulling everything together` i podobne wskazówki), a żadne potomne uruchomienie subagenta nie odpowiada już za ostateczną odpowiedź, OpenClaw jednokrotnie ponownie prosi o rzeczywisty wynik przed dostarczeniem.
- Izolowane uruchomienia cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia, w tym opakowań hosta węzła `UNAVAILABLE`, których zagnieżdżony komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` albo `INVALID_REQUEST`, aby zablokowane polecenie nie było raportowane jako udane uruchomienie, a zwykła proza asystenta nie była traktowana jako odmowa.
- Izolowane uruchomienia cron traktują też awarie agenta na poziomie uruchomienia jako błędy zadania, nawet gdy nie powstaje ładunek odpowiedzi, dzięki czemu awarie modelu/dostawcy zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniu zamiast oznaczać zadanie jako zakończone sukcesem.
- Gdy izolowane zadanie tury agenta osiągnie `timeoutSeconds`, cron przerywa bazowe uruchomienie agenta i daje mu krótkie okno na czyszczenie. Jeśli uruchomienie się nie opróżni, czyszczenie należące do Gateway wymusza wyczyszczenie własności sesji tego uruchomienia, zanim cron zapisze przekroczenie czasu, więc kolejkowana praca z czatu nie pozostaje za nieaktualną sesją przetwarzania.
- Jeśli izolowana tura agenta zatrzyma się przed startem runnera albo przed pierwszym wywołaniem modelu, cron zapisuje przekroczenie czasu specyficzne dla fazy, takie jak `setup timed out before runner start` albo `stalled before first model call (last phase: context-engine)`. Te mechanizmy nadzoru obejmują osadzonych dostawców i dostawców opartych na CLI, zanim ich zewnętrzny proces CLI faktycznie zostanie uruchomiony, oraz są ograniczane niezależnie od długich wartości `timeoutSeconds`, aby awarie zimnego startu/uwierzytelniania/kontekstu ujawniały się szybko zamiast czekać na pełny budżet zadania.
- Jeśli używasz systemowego cron albo innego zewnętrznego harmonogramu do uruchamiania `openclaw agent`, opakuj go eskalacją twardego zakończenia, mimo że CLI obsługuje `SIGTERM`/`SIGINT`. Uruchomienia wspierane przez Gateway proszą Gateway o przerwanie zaakceptowanych uruchomień; lokalne i osadzone uruchomienia awaryjne otrzymują ten sam sygnał przerwania. Dla GNU `timeout` preferuj `timeout -k 60 600 openclaw agent ...` zamiast zwykłego `timeout 600 ...`; wartość `-k` jest zabezpieczeniem nadzorcy, jeśli proces nie może się opróżnić. W jednostkach systemd zachowaj ten sam kształt, używając sygnału zatrzymania `SIGTERM` oraz okna karencji, takiego jak `TimeoutStopSec`, przed ewentualnym końcowym zabiciem. Jeśli ponowienie użyje ponownie `--run-id`, gdy pierwotne uruchomienie Gateway nadal jest aktywne, duplikat zostanie zgłoszony jako będący w toku zamiast uruchamiać drugie uruchomienie.

<a id="maintenance"></a>

<Note>
Uzgadnianie zadań dla cron jest najpierw własnością środowiska wykonawczego, a dopiero potem jest oparte na trwałej historii: aktywne zadanie cron pozostaje aktywne, dopóki środowisko wykonawcze cron nadal śledzi to zadanie jako uruchomione, nawet jeśli nadal istnieje stary wiersz sesji potomnej. Gdy środowisko wykonawcze przestanie posiadać zadanie i upłynie 5-minutowe okno karencji, konserwacja sprawdza utrwalone dzienniki uruchomień i stan zadania dla pasującego uruchomienia `cron:<jobId>:<startedAt>`. Jeśli ta trwała historia pokazuje wynik terminalny, rejestr zadań zostaje na jej podstawie sfinalizowany; w przeciwnym razie konserwacja należąca do Gateway może oznaczyć zadanie jako `lost`. Audyt offline CLI może odtworzyć stan z trwałej historii, ale nie traktuje własnego pustego zestawu aktywnych zadań w procesie jako dowodu, że uruchomienie cron należące do Gateway zniknęło.
</Note>

## Typy harmonogramów

| Rodzaj  | Flaga CLI | Opis                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Jednorazowy znacznik czasu (ISO 8601 albo względny, np. `20m`) |
| `every` | `--every` | Stały interwał                                          |
| `cron`  | `--cron`  | 5-polowe albo 6-polowe wyrażenie cron z opcjonalnym `--tz` |

Znaczniki czasu bez strefy czasowej są traktowane jako UTC. Dodaj `--tz America/New_York`, aby planować według lokalnego czasu zegarowego.

Powtarzające się wyrażenia na początek godziny są automatycznie rozkładane z przesunięciem do 5 minut, aby zmniejszyć skoki obciążenia. Użyj `--exact`, aby wymusić precyzyjne taktowanie, albo `--stagger 30s`, aby określić jawne okno.

### Dzień miesiąca i dzień tygodnia używają logiki OR

Wyrażenia Cron są analizowane przez [croner](https://github.com/Hexagon/croner). Gdy pola dnia miesiąca i dnia tygodnia nie są symbolami wieloznacznymi, croner dopasowuje, gdy pasuje **którekolwiek** z pól — nie oba. To standardowe zachowanie Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To uruchamia się około 5–6 razy w miesiącu zamiast 0–1 razy w miesiącu. OpenClaw używa tutaj domyślnego zachowania OR Cronera. Aby wymagać obu warunków, użyj modyfikatora dnia tygodnia `+` Cronera (`0 9 15 * +1`) albo zaplanuj na podstawie jednego pola i sprawdzaj drugie w monicie lub poleceniu zadania.

## Style wykonania

| Styl            | Wartość `--session` | Uruchamia się w         | Najlepsze do                   |
| --------------- | ------------------- | ----------------------- | ------------------------------ |
| Sesja główna    | `main`              | Dedykowana ścieżka budzenia cron | Przypomnienia, zdarzenia systemowe |
| Izolowane       | `isolated`          | Dedykowana `cron:<jobId>` | Raporty, prace w tle           |
| Bieżąca sesja   | `current`           | Odłączone uruchomienie cron | Cykliczna praca świadoma kontekstu |
| Niestandardowa sesja | `session:custom-id` | Odłączone uruchomienie cron | Kierowanie do znanego czatu/sesji |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Zadania **sesji głównej** kolejkowują zdarzenie systemowe do ścieżki uruchomień należącej do cron i opcjonalnie budzą Heartbeat (`--wake now` albo `--wake next-heartbeat`). Mogą używać ostatniego kontekstu dostarczenia docelowej sesji głównej do odpowiedzi, ale nie dopisują rutynowych tur cron do ścieżki czatu człowieka i nie przedłużają świeżości dziennego/bezczynnościowego resetu dla docelowej sesji. Zadania **izolowane** uruchamiają dedykowaną turę agenta ze świeżą sesją. Zadania sesji **bieżącej** i **niestandardowej** (`current`, `session:xxx`) mogą używać wybranego czatu/sesji jako kontekstu dostarczenia i bezpiecznego zasiewania preferencji, ale każde uruchomienie nadal wykonuje się w odłączonej sesji cron, aby zaplanowana praca nie blokowała ani nie zanieczyszczała transkryptu rozmowy na żywo.

    Zdarzenia cron sesji głównej są samodzielnymi przypomnieniami zdarzeń systemowych. Nie zawierają automatycznie instrukcji „Read HEARTBEAT.md” z domyślnego monitu Heartbeat. Jeśli cykliczne przypomnienie powinno sprawdzać `HEARTBEAT.md`, powiedz to wprost w tekście zdarzenia cron albo we własnych instrukcjach agenta.

  </Accordion>
  <Accordion title="What 'fresh session' means for detached jobs">
    Dla zadań izolowanych, zadań bieżącej sesji i zadań niestandardowej sesji „świeża sesja” oznacza nowy identyfikator transkryptu/sesji dla każdego uruchomienia. OpenClaw może przenosić bezpieczne preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne nadpisania modelu/uwierzytelniania wybrane przez użytkownika. Odłączone uruchomienia nie dziedziczą otaczającego kontekstu rozmowy ze starszego wiersza cron: trasowania kanału/grupy, zasad wysyłania lub kolejkowania, podniesienia uprawnień, pochodzenia ani powiązania środowiska wykonawczego ACP. Umieść trwały stan pracy cyklicznej w monicie, plikach obszaru roboczego, narzędziach albo systemie, na którym działa zadanie, zamiast polegać na transkrypcie czatu na żywo jako pamięci cron.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Dla zadań izolowanych rozmontowanie środowiska wykonawczego obejmuje teraz najlepszą możliwą próbę czyszczenia przeglądarki dla tej sesji cron. Niepowodzenia czyszczenia są ignorowane, więc rzeczywisty wynik cron nadal ma pierwszeństwo.

    Izolowane uruchomienia cron usuwają też wszelkie dołączone instancje środowiska wykonawczego MCP utworzone dla zadania przez współdzieloną ścieżkę czyszczenia środowiska wykonawczego. Odpowiada to sposobowi rozmontowywania klientów MCP sesji głównej i niestandardowej, więc izolowane zadania cron nie wyciekają procesów potomnych stdio ani długotrwałych połączeń MCP między uruchomieniami.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Gdy izolowane uruchomienia cron koordynują subagentów, dostarczanie również preferuje końcowy wynik potomka zamiast nieaktualnego tymczasowego tekstu rodzica. Jeśli potomkowie nadal działają, OpenClaw tłumi tę częściową aktualizację rodzica zamiast ją ogłaszać.

    W przypadku tekstowych celów ogłoszeń Discord OpenClaw wysyła kanoniczny końcowy tekst asystenta raz zamiast odtwarzać zarówno strumieniowane/pośrednie ładunki tekstowe, jak i końcową odpowiedź. Media i ustrukturyzowane ładunki Discord nadal są dostarczane jako osobne ładunki, aby załączniki i komponenty nie zostały pominięte.

  </Accordion>
</AccordionGroup>

### Ładunki poleceń

Używaj ładunków poleceń dla deterministycznych skryptów, które powinny działać wewnątrz harmonogramu Gateway bez uruchamiania izolowanej tury agenta opartej na modelu. Zadania poleceń wykonują się na hoście Gateway, przechwytują stdout/stderr, zapisują uruchomienie w historii cron i ponownie używają tych samych trybów dostarczania `announce`, `webhook` i `none` co zadania izolowane.

<Note>
Command cron to powierzchnia automatyzacji Gateway dla administratora-operatora, a nie wywołanie agenta `tools.exec`. Tworzenie, aktualizowanie, usuwanie albo ręczne uruchamianie zadań cron wymaga `operator.admin`; zaplanowane uruchomienia poleceń wykonują się później wewnątrz procesu Gateway jako automatyzacja utworzona przez tego administratora. Zasady exec agenta, takie jak `tools.exec.mode`, monity zatwierdzeń i listy dozwolonych narzędzi poszczególnych agentów, regulują widoczne dla modelu narzędzia exec, a nie ładunki command cron.
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

`--command <shell>` przechowuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'`, gdy chcesz dokładnego wykonania argv bez analizy przez powłokę. Opcjonalne pola `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` i `--output-max-bytes` kontrolują środowisko procesu, stdin i limity wyjścia.

Jeśli stdout nie jest pusty, ten tekst jest dostarczonym wynikiem. Jeśli stdout jest pusty, a stderr nie jest pusty, dostarczany jest stderr. Jeśli obecne są oba strumienie, cron dostarcza mały blok `stdout:` / `stderr:`. Zerowy kod wyjścia zapisuje uruchomienie jako `ok`; niezerowe wyjście, sygnał, timeout lub timeout bez wyjścia zapisuje `error` i może wyzwalać alerty o niepowodzeniu. Polecenie, które wypisuje tylko `NO_REPLY`, używa standardowego tłumienia cichego tokena cron i nie publikuje nic z powrotem na czacie.

### Opcje payloadu dla izolowanych zadań

<ParamField path="--message" type="string" required>
  Tekst promptu (wymagany dla izolowanego).
</ParamField>
<ParamField path="--model" type="string">
  Nadpisanie modelu; używa wybranego dozwolonego modelu dla zadania.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista modeli fallback dla danego zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Przekaż `--fallbacks ""` dla ścisłego uruchomienia bez fallbacków.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  W `cron edit` usuwa nadpisanie fallbacków dla danego zadania, aby zadanie stosowało skonfigurowaną kolejność fallbacków. Nie można łączyć z `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  W `cron edit` usuwa nadpisanie modelu dla danego zadania, aby zadanie stosowało normalną kolejność wyboru modelu cron (zapisane nadpisanie sesji cron, jeśli jest ustawione, w przeciwnym razie model agenta/domyślny). Nie można łączyć z `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Nadpisanie poziomu myślenia.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  W `cron edit` usuwa nadpisanie myślenia dla danego zadania, aby zadanie stosowało normalną kolejność myślenia cron. Nie można łączyć z `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pomiń wstrzykiwanie pliku bootstrapu workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Ogranicz narzędzia, których może używać zadanie, na przykład `--tools exec,read`.
</ParamField>

`--model` używa wybranego dozwolonego modelu jako głównego modelu tego zadania. To nie to samo co nadpisanie `/model` sesji czatu: skonfigurowane łańcuchy fallbacków nadal mają zastosowanie, gdy główny model zadania zawiedzie. Jeśli żądany model nie jest dozwolony lub nie można go rozpoznać, cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji zamiast po cichu wracać do wyboru modelu agenta/domyślnego dla zadania.

Zadania Cron mogą również przenosić `fallbacks` na poziomie payloadu. Gdy są obecne, ta lista zastępuje skonfigurowany łańcuch fallbacków dla zadania. Użyj `fallbacks: []` w payloadzie zadania/API, gdy chcesz ścisłego uruchomienia cron, które próbuje tylko wybranego modelu. Jeśli zadanie ma `--model`, ale nie ma ani payloadu, ani skonfigurowanych fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby model główny agenta nie został dołączony jako ukryty dodatkowy cel ponownej próby.

Kontrole preflight lokalnego dostawcy przechodzą przez skonfigurowane fallbacki przed oznaczeniem uruchomienia cron jako `skipped`; `fallbacks: []` utrzymuje tę ścieżkę preflight jako ścisłą.

Kolejność wyboru modelu dla izolowanych zadań jest następująca:

1. Nadpisanie modelu hooka Gmail (gdy uruchomienie pochodzi z Gmail i to nadpisanie jest dozwolone)
2. `model` payloadu danego zadania
3. Wybrane przez użytkownika zapisane nadpisanie modelu sesji cron
4. Wybór modelu agenta/domyślnego

Tryb szybki także podąża za rozpoznanym wyborem live. Jeśli konfiguracja wybranego modelu ma `params.fastMode`, izolowany cron używa tego domyślnie. Zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją w obu kierunkach. Tryb automatyczny używa progu `params.fastAutoOnSeconds` wybranego modelu, gdy jest obecny, domyślnie 60 sekund.

Jeśli izolowane uruchomienie trafi na przekazanie przełączenia modelu live, cron ponawia próbę z przełączonym dostawcą/modelem i utrwala ten wybór live dla aktywnego uruchomienia przed ponowieniem próby. Gdy przełączenie niesie również nowy profil uwierzytelniania, cron utrwala także to nadpisanie profilu uwierzytelniania dla aktywnego uruchomienia. Ponowienia są ograniczone: po początkowej próbie plus 2 ponowieniach przełączenia cron przerywa zamiast zapętlać się bez końca.

Zanim izolowane uruchomienie cron wejdzie do runnera agenta, OpenClaw sprawdza osiągalne lokalne endpointy dostawców dla skonfigurowanych dostawców `api: "ollama"` i `api: "openai-completions"`, których `baseUrl` jest local loopback, siecią prywatną lub `.local`. Jeśli ten endpoint nie działa, uruchomienie jest zapisywane jako `skipped` z jasnym błędem dostawcy/modelu zamiast rozpoczynać wywołanie modelu. Wynik endpointu jest buforowany przez 5 minut, więc wiele oczekujących zadań używających tego samego niedziałającego lokalnego serwera Ollama, vLLM, SGLang lub LM Studio współdzieli jedną małą próbę zamiast tworzyć burzę żądań. Pominięte uruchomienia preflight dostawcy nie zwiększają backoffu błędu wykonania; włącz `failureAlert.includeSkipped`, gdy chcesz powtarzanych powiadomień o pominięciu.

## Dostarczanie i wyjście

| Tryb       | Co się dzieje                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dostarcza fallbackiem tekst końcowy do celu, jeśli agent go nie wysłał |
| `webhook`  | Wysyła payload zdarzenia zakończenia metodą POST pod URL                                |
| `none`     | Brak fallbackowego dostarczania runnera                                         |

Użyj `--announce --channel telegram --to "-1001234567890"` do dostarczania na kanał. Dla tematów forum Telegram użyj `-1001234567890:topic:123`; OpenClaw akceptuje także należący do Telegram skrót `-1001234567890:123`. Bezpośredni wywołujący RPC/konfiguracji mogą przekazać `delivery.threadId` jako string lub liczbę. Cele Slack/Discord/Mattermost powinny używać jawnych prefiksów (`channel:<id>`, `user:<id>`). Identyfikatory pokojów Matrix rozróżniają wielkość liter; użyj dokładnego ID pokoju albo formy `room:!room:server` z Matrix.

Gdy dostarczanie announce używa `channel: "last"` albo pomija `channel`, cel z prefiksem dostawcy, taki jak `telegram:123`, może wybrać kanał, zanim cron wróci do historii sesji albo pojedynczego skonfigurowanego kanału. Tylko prefiksy reklamowane przez załadowany Plugin są selektorami dostawcy. Jeśli `delivery.channel` jest jawny, prefiks celu musi wskazywać tego samego dostawcę; na przykład `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane zamiast pozwolić WhatsApp interpretować ID Telegram jako numer telefonu. Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają składnią celu należącą do kanału, a nie selektorami dostawcy.

Dla izolowanych zadań dostarczanie na czat jest współdzielone. Jeśli trasa czatu jest dostępna, agent może używać narzędzia `message` nawet wtedy, gdy zadanie używa `--no-deliver`. Jeśli agent wysyła do skonfigurowanego/bieżącego celu, OpenClaw pomija fallbackowy announce. W przeciwnym razie `announce`, `webhook` i `none` kontrolują tylko to, co runner robi z końcową odpowiedzią po turze agenta.

Gdy agent tworzy izolowane przypomnienie z aktywnego czatu, OpenClaw przechowuje zachowany cel dostarczania live dla fallbackowej trasy announce. Wewnętrzne klucze sesji mogą być pisane małymi literami; cele dostarczania dostawcy nie są rekonstruowane z tych kluczy, gdy dostępny jest bieżący kontekst czatu.

Niejawne dostarczanie announce używa skonfigurowanych list dozwolonych kanałów do walidacji i przekierowywania nieaktualnych celów. Zatwierdzenia ze sklepu par DM nie są odbiorcami automatyzacji fallback; ustaw `delivery.to` albo skonfiguruj wpis `allowFrom` kanału, gdy zaplanowane zadanie ma proaktywnie wysyłać do DM.

## Język wyjścia

Zadania Cron nie wywnioskują języka odpowiedzi z kanału, lokalizacji ani poprzednich
wiadomości. Umieść regułę języka w zaplanowanej wiadomości lub szablonie:

```bash
openclaw cron edit <jobId> \
  --message "Podsumuj aktualizacje. Odpowiedz po chińsku; pozostaw adresy URL, kod i nazwy produktów bez zmian."
```

W przypadku plików szablonów zachowaj instrukcję dotyczącą języka w wyrenderowanym prompcie i
sprawdź, czy symbole zastępcze takie jak `{{language}}` są wypełnione przed uruchomieniem zadania. Jeśli
wynik miesza języki, sformułuj regułę jawnie, na przykład: "Używaj chińskiego
w tekście narracyjnym i zachowuj terminy techniczne po angielsku."

Powiadomienia o niepowodzeniach używają osobnej ścieżki miejsca docelowego:

- `cron.failureDestination` ustawia globalną wartość domyślną dla powiadomień o niepowodzeniach.
- `job.delivery.failureDestination` nadpisuje ją dla konkretnego zadania.
- Jeśli żadna z tych wartości nie jest ustawiona, a zadanie już dostarcza wiadomości przez `announce`, powiadomienia o niepowodzeniach są teraz kierowane awaryjnie do tego głównego celu `announce`.
- `delivery.failureDestination` jest obsługiwane tylko w zadaniach `sessionTarget="isolated"`, chyba że głównym trybem dostarczania jest `webhook`.
- `failureAlert.includeSkipped: true` włącza dla zadania lub globalnej polityki alertów Cron powtarzane alerty o pominiętych uruchomieniach. Pominięte uruchomienia utrzymują osobny licznik kolejnych pominięć, więc nie wpływają na wycofywanie po błędach wykonania.

## Przykłady CLI

<Tabs>
  <Tab title="Jednorazowe przypomnienie">
    ```bash
    openclaw cron add \
      --name "Sprawdzenie kalendarza" \
      --at "20m" \
      --session main \
      --system-event "Następny Heartbeat: sprawdź kalendarz." \
      --wake now
    ```
  </Tab>
  <Tab title="Cykliczne zadanie izolowane">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Podsumuj nocne aktualizacje." \
      --name "Poranny skrót" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Nadpisanie modelu i rozumowania">
    ```bash
    openclaw cron add \
      --name "Głęboka analiza" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Cotygodniowa dogłębna analiza postępów projektu." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Dane wyjściowe Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Podsumuj dzisiejsze wdrożenia jako JSON." \
      --name "Podsumowanie wdrożeń" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Dane wyjściowe polecenia">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Sonda głębokości kolejki" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooki

Gateway może udostępniać punkty końcowe HTTP webhooków dla zewnętrznych wyzwalaczy. Włącz w konfiguracji:

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
      -d '{"text":"Otrzymano nowy e-mail","mode":"now"}'
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
      -d '{"message":"Podsumuj skrzynkę odbiorczą","name":"E-mail","model":"openai/gpt-5.4"}'
    ```

    Pola: `message` (wymagane), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapowane hooki (POST /hooks/<name>)">
    Niestandardowe nazwy hooków są rozwiązywane przez `hooks.mappings` w konfiguracji. Mapowania mogą przekształcać dowolne ładunki w akcje `wake` lub `agent` za pomocą szablonów albo transformacji kodu.
  </Accordion>
</AccordionGroup>

<Warning>
Trzymaj punkty końcowe hooków za local loopback, tailnet lub zaufanym odwrotnym proxy.

- Używaj dedykowanego tokenu hooka; nie używaj ponownie tokenów uwierzytelniania Gateway.
- Utrzymuj `hooks.path` w dedykowanej podścieżce; `/` jest odrzucane.
- Ustaw `hooks.allowedAgentIds`, aby ograniczyć, którego efektywnego agenta może wskazywać hook, w tym agenta domyślnego, gdy `agentId` jest pominięte.
- Pozostaw `hooks.allowRequestSessionKey=false`, chyba że potrzebujesz sesji wybieranych przez wywołującego.
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

Zapisuje to konfigurację `hooks.gmail`, włącza preset Gmail i używa Tailscale Funnel dla punktu końcowego push.

### Automatyczne uruchamianie Gateway

Gdy `hooks.enabled=true` i ustawione jest `hooks.gmail.account`, Gateway uruchamia `gog gmail watch serve` przy starcie i automatycznie odnawia obserwację. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby z tego zrezygnować.

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

`openclaw cron run <jobId>` zwraca wynik po dodaniu ręcznego uruchomienia do kolejki. Użyj `--wait` dla hooków zamykania, skryptów konserwacyjnych lub innej automatyzacji, która musi blokować działanie do czasu zakończenia uruchomienia z kolejki. Tryb oczekiwania odpytuje dokładnie zwrócone `runId`; kończy działanie z kodem `0` dla statusu `ok` i kodem niezerowym dla `error`, `skipped` lub przekroczenia limitu czasu oczekiwania.

Narzędzie agenta `cron` zwraca zwarte podsumowania zadań (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) z `cron(action: "list")`; użyj `cron(action: "get", jobId: "...")` dla pełnej definicji jednego zadania. Bezpośredni wywołujący Gateway mogą przekazać `compact: true` do `cron.list`; pominięcie tego zachowuje dotychczasową pełną odpowiedź z podglądami dostarczania.

`openclaw cron create` jest aliasem dla `openclaw cron add`, a nowe zadania mogą używać harmonogramu pozycyjnego (`"0 9 * * 1"`, `"every 1h"`, `"20m"` lub znacznika czasu ISO), po którym następuje pozycyjny prompt agenta. Użyj `--webhook <url>` w `cron add|create` lub `cron edit`, aby wysłać ukończony ładunek uruchomienia metodą POST do punktu końcowego HTTP. Dostarczania Webhook nie można łączyć z flagami dostarczania czatu, takimi jak `--announce`, `--channel`, `--to`, `--thread-id` lub `--account`. W `cron edit` flagi `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` usuwają te pola routingu pojedynczo (każda jest odrzucana razem z odpowiadającą jej flagą ustawiającą), co różni się od wyłączenia awaryjnego dostarczania runnera przez `--no-deliver`.

<Note>
Uwaga dotycząca nadpisania modelu:

- `openclaw cron add|edit --model ...` zmienia wybrany model zadania.
- Jeśli model jest dozwolony, dokładnie ten dostawca/model trafia do izolowanego uruchomienia agenta.
- Jeśli nie jest dozwolony lub nie można go rozwiązać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji.
- Łatki ładunku API `cron.update` mogą ustawić `model: null`, aby wyczyścić zapisane nadpisanie modelu zadania.
- `openclaw cron edit <job-id> --clear-model` czyści to nadpisanie z CLI (ten sam efekt co łatka `model: null`) i nie może być łączone z `--model`.
- Skonfigurowane łańcuchy awaryjne nadal mają zastosowanie, ponieważ `--model` Cron jest modelem podstawowym zadania, a nie nadpisaniem sesji `/model`.
- `openclaw cron add|edit --fallbacks ...` ustawia `fallbacks` ładunku, zastępując skonfigurowane mechanizmy awaryjne dla tego zadania; `--fallbacks ""` wyłącza mechanizm awaryjny i wymusza ścisłe uruchomienie. `openclaw cron edit <job-id> --clear-fallbacks` czyści nadpisanie dla zadania.
- Zwykłe `--model` bez jawnej lub skonfigurowanej listy mechanizmów awaryjnych nie przechodzi do modelu podstawowego agenta jako cichy dodatkowy cel ponowienia.

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

`maxConcurrentRuns` ogranicza zarówno zaplanowane wysyłanie Cron, jak i wykonywanie izolowanej tury agenta, a domyślna wartość to 8. Izolowane tury agentów Cron używają wewnętrznie dedykowanej kolejki wykonywania `cron-nested`, więc zwiększenie tej wartości pozwala niezależnym uruchomieniom LLM Cron postępować równolegle zamiast uruchamiać tylko ich zewnętrzne opakowania Cron. To ustawienie nie poszerza współdzielonej kolejki `nested` niezwiązanej z Cron.

`cron.store` jest logicznym kluczem magazynu i starszą ścieżką importu doctor. Uruchom `openclaw doctor --fix`, aby zaimportować istniejące magazyny JSON do SQLite i je zarchiwizować; przyszłe zmiany Cron powinny przechodzić przez CLI lub API Gateway.

Wyłącz Cron: `cron.enabled: false` lub `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Zachowanie ponowień">
    **Ponowienie jednorazowe**: błędy przejściowe (limit częstotliwości, przeciążenie, sieć, błąd serwera) są ponawiane do 3 razy z wykładniczym opóźnieniem. Błędy trwałe wyłączają natychmiast.

    **Ponowienie cykliczne**: wykładnicze opóźnienie (od 30 s do 60 min) między ponowieniami. Opóźnienie resetuje się po kolejnym udanym uruchomieniu.

  </Accordion>
  <Accordion title="Konserwacja">
    `cron.sessionRetention` (domyślnie `24h`) usuwa wpisy izolowanych sesji uruchomień. `cron.runLog.keepLines` ogranicza liczbę zachowywanych wierszy historii uruchomień SQLite na zadanie; `maxBytes` jest zachowywane dla zgodności konfiguracji ze starszymi dziennikami uruchomień opartymi na plikach.
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
    - `reason: not-due` w wyniku uruchomienia oznacza, że ręczne uruchomienie sprawdzono za pomocą `openclaw cron run <jobId> --due`, a termin zadania jeszcze nie nadszedł.

  </Accordion>
  <Accordion title="Cron został uruchomiony, ale nie ma dostarczenia">
    - Tryb dostarczania `none` oznacza, że nie oczekuje się awaryjnego wysłania przez runnera. Agent nadal może wysłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
    - Brakujący/nieprawidłowy cel dostarczania (`channel`/`to`) oznacza, że wysłanie wychodzące zostało pominięte.
    - W przypadku Matrix skopiowane lub starsze zadania z zapisanymi małymi literami identyfikatorami pokoju `delivery.to` mogą się nie powieść, ponieważ identyfikatory pokoi Matrix rozróżniają wielkość liter. Edytuj zadanie do dokładnej wartości `!room:server` lub `room:!room:server` z Matrix.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że dostarczanie zostało zablokowane przez poświadczenia.
    - Jeśli izolowane uruchomienie zwraca tylko token ciszy (`NO_REPLY` / `no_reply`), OpenClaw pomija bezpośrednie dostarczanie wychodzące i pomija też awaryjną ścieżkę podsumowania z kolejki, więc nic nie zostaje opublikowane z powrotem na czacie.
    - Jeśli agent powinien sam wysłać wiadomość do użytkownika, sprawdź, czy zadanie ma użyteczną trasę (`channel: "last"` z poprzednim czatem albo jawny kanał/cel).

  </Accordion>
  <Accordion title="Cron lub Heartbeat wydaje się zapobiegać rolloverowi w stylu /new">
    - Świeżość resetu dziennego i bezczynności nie jest oparta na `updatedAt`; zobacz [Zarządzanie sesjami](/pl/concepts/session#session-lifecycle).
    - Wybudzenia Cron, uruchomienia Heartbeat, powiadomienia exec i księgowanie Gateway mogą aktualizować wiersz sesji na potrzeby routingu/statusu, ale nie przedłużają `sessionStartedAt` ani `lastInteractionAt`.
    - Dla starszych wierszy utworzonych przed istnieniem tych pól OpenClaw może odzyskać `sessionStartedAt` z nagłówka sesji transkryptu JSONL, gdy plik jest nadal dostępny. Starsze wiersze bezczynności bez `lastInteractionAt` używają tego odzyskanego czasu rozpoczęcia jako swojej bazowej wartości bezczynności.

  </Accordion>
  <Accordion title="Pułapki stref czasowych">
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
