---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` albo `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże z główną sesją agenta.
    - `isolated` tworzy świeżą transkrypcję i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże z aktywną sesją w chwili utworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane uruchomienia resetują otaczający kontekst rozmowy. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub autoryzacji mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, czy zakończy się bezpieczną odmową.

Cele z prefiksem dostawcy mogą rozróżniać nierozstrzygnięte kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte albo ma wartość `last`. Selektorami dostawców są tylko prefiksy ogłaszane przez wczytany plugin. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować dane wyjściowe wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu izolowanego cron jest współdzielone między agentem i runnerem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał bezpośrednio do rozstrzygniętego celu.
- `webhook` wysyła ukończony ładunek do adresu URL.
- `none` wyłącza awaryjne dostarczanie przez runner.

`--announce` to awaryjne dostarczanie przez runner końcowej odpowiedzi. `--no-deliver` wyłącza to zachowanie awaryjne, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują bieżący cel dostarczania czatu dla awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być pisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie błędów

Powiadomienia o błędach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszeń zadania (gdy nie ustawiono jawnego celu błędów).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy główny tryb dostarczania to `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia cron traktują błędy agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy
nie powstaje ładunek odpowiedzi, więc błędy modelu/dostawcy nadal zwiększają
liczniki błędów i wyzwalają powiadomienia o błędach.

Jeśli izolowane uruchomienie przekroczy limit czasu przed pierwszym żądaniem modelu, `openclaw cron show`
i `openclaw cron runs` uwzględniają błąd właściwy dla fazy, taki jak
`setup timed out before runner start` albo
`stalled before first model call (last phase: context-engine)`.
Dla dostawców opartych na CLI watchdog przed modelem pozostaje aktywny do chwili rozpoczęcia zewnętrznego
przebiegu CLI, więc zacięcia wyszukiwania sesji, hooka, autoryzacji, promptu i konfiguracji CLI są
zgłaszane jako błędy cron przed modelem.

## Planowanie

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć dla alertów o błędach powiadomienia o powtarzających się pominiętych uruchomieniach.

Dla zadań izolowanych, które celują w lokalnie skonfigurowanego dostawcę modelu, cron uruchamia lekką kontrolę wstępną dostawcy przed rozpoczęciem tury agenta. Dostawcy Loopback, sieci prywatnej i `.local` `api: "ollama"` są sondowani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sondowani pod `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie zostaje zapisane jako `skipped` i ponowione w późniejszym harmonogramie; pasujące martwe punkty końcowe są buforowane przez 5 minut, aby uniknąć przeciążania tego samego lokalnego serwera przez wiele zadań.

Uwaga: definicje zadań cron znajdują się w `jobs.json`, a oczekujący stan środowiska uruchomieniowego znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie zmodyfikowany zewnętrznie, Gateway przeładuje zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; zmiany wyłącznie formatowania nie czyszczą oczekującego slotu.

### Uruchomienia ręczne

`openclaw cron run` zwraca wynik, gdy tylko uruchomienie ręczne zostanie zakolejkowane. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony albo nie można go rozstrzygnąć, cron kończy uruchomienie jawnym błędem walidacji zamiast wracać do agenta zadania lub domyślnego wyboru modelu.
</Warning>

Cron `--model` jest **głównym wyborem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to:

- Skonfigurowane fallbacki modeli nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- `fallbacks` w ładunku zadania zastępuje skonfigurowaną listę fallbacków, gdy jest obecne.
- Pusta lista fallbacków dla zadania (`fallbacks: []` w ładunku/API zadania) sprawia, że uruchomienie cron jest ścisłe.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby główny model agenta nie został dołączony jako ukryty cel ponowienia.

### Kolejność wyboru modelu w izolowanym cron

Izolowany cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie hooka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji cron (gdy użytkownik je wybrał).
4. Wybór modelu agenta lub domyślny.

### Tryb szybki

Tryb szybki izolowanego cron podąża za rozstrzygniętym wyborem modelu live. Konfiguracja modelu `params.fastMode` ma domyślnie zastosowanie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją.

### Ponowienia po przełączeniu modelu live

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, cron utrwala przełączonego dostawcę i model (oraz przełączone nadpisanie profilu autoryzacji, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa działanie zamiast zapętlać się bez końca.

## Dane wyjściowe uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Izolowane tury cron tłumią nieaktualne odpowiedzi zawierające tylko potwierdzenie. Jeśli pierwszy wynik jest jedynie tymczasową aktualizacją statusu i żadne potomne uruchomienie subagenta nie odpowiada za ostateczną odpowiedź, cron jednokrotnie ponawia prompt o rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie cron zwraca tylko cichy token (`NO_REPLY` albo `no_reply`), cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników odmowy w końcowych danych wyjściowych, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` i frazy odmowy powiązania zatwierdzenia.

`cron list` i historia uruchomień pokazują przyczynę odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migracja starszych zadań

<Note>
Jeśli masz zadania cron sprzed bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje proste zadania awaryjne webhook `notify: true` do jawnego dostarczania webhook, gdy skonfigurowano `cron.webhook`.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla zadania izolowanego:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst inicjalizacji dla zadania izolowanego:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś w konkretnym kanale:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Ogłoś w temacie forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z lekkim kontekstem inicjalizacji:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie tylko do izolowanych zadań tur agenta. Dla uruchomień cron tryb lekki pozostawia kontekst inicjalizacji pusty zamiast wstrzykiwać pełny zestaw inicjalizacji obszaru roboczego.

## Typowe polecenia administracyjne

Uruchomienie ręczne i inspekcja:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby pokazać tylko zadania, których efektywny znormalizowany identyfikator agenta pasuje; zadania bez zapisanego identyfikatora agenta liczą się jako skonfigurowany agent domyślny.

`openclaw cron get <job-id>` zwraca bezpośrednio zapisany JSON zadania. Użyj `cron show <job-id>`, gdy chcesz zobaczyć czytelny dla człowieka widok z podglądem trasy dostarczania.

`cron list --json` i `cron show <job-id> --json` zawierają pole najwyższego poziomu `status` w każdym zadaniu, obliczane z `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` albo `idle`. Odzwierciedla to czytelną dla człowieka kolumnę statusu, aby narzędzia zewnętrzne mogły odczytywać stan zadania bez ponownego wyprowadzania go.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem cron, rozstrzygniętym celem, wysłaniami narzędzia wiadomości, użyciem fallbacku i stanem dostarczenia.

Zmiana celu agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tur agenta, i wraca do agenta domyślnego (`main`). Przekaż `--agent <id>` w chwili tworzenia, aby przypiąć konkretnego agenta.

Drobne zmiany dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
