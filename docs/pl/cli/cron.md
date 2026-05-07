---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie zadań Cron i logi
summary: Referencja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` akceptuje `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy świeży transkrypt i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże się z aktywną sesją w momencie utworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane uruchomienia resetują kontekst otaczającej rozmowy. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, albo czy zakończy się bezpieczną odmową.

Cele z prefiksem dostawcy mogą rozróżniać nierozstrzygnięte kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte lub ma wartość `last`. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu przez izolowany Cron jest współdzielone między agentem a uruchamiaczem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał bezpośrednio do rozstrzygniętego celu.
- `webhook` wysyła ukończony ładunek pod adres URL.
- `none` wyłącza awaryjne dostarczanie przez uruchamiacz.

`--announce` to awaryjne dostarczanie końcowej odpowiedzi przez uruchamiacz. `--no-deliver` wyłącza to zachowanie awaryjne, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują bieżący cel dostarczania czatu dla awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszenia zadania (gdy nie ustawiono jawnego celu awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowym trybem dostarczania jest `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują awarie agenta na poziomie uruchomienia jako błędy zadania, nawet gdy
nie powstaje żaden ładunek odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają liczniki błędów
i wyzwalają powiadomienia o awarii.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz także `--tz <iana>`, które interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym pomyślnym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awariach dla powtarzających się powiadomień o pominiętych uruchomieniach.

W przypadku zadań izolowanych, które kierują do lokalnie skonfigurowanego dostawcy modelu, Cron wykonuje lekki test wstępny dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` dla local loopback, sieci prywatnej i `.local` są sondowani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sondowani pod `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie jest rejestrowane jako `skipped` i ponawiane w późniejszym harmonogramie; pasujące martwe punkty końcowe są buforowane przez 5 minut, aby uniknąć zasypywania tego samego lokalnego serwera przez wiele zadań.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, podczas gdy oczekujący stan wykonawczy znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie zmienione zewnętrznie, Gateway przeładuje zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; przepisania dotyczące wyłącznie formatowania nie czyszczą oczekującego slotu.

### Uruchomienia ręczne

`openclaw cron run` zwraca wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozstrzygnąć, Cron kończy uruchomienie jawnym błędem walidacji zamiast wracać do wyboru modelu agenta lub modelu domyślnego zadania.
</Warning>

Cron `--model` jest **podstawowym modelem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane modele awaryjne nadal obowiązują, gdy wybrany model zadania zawiedzie.
- Ładunek `fallbacks` dla zadania zastępuje skonfigurowaną listę modeli awaryjnych, gdy jest obecny.
- Pusta lista modeli awaryjnych dla zadania (`fallbacks: []` w ładunku/API zadania) sprawia, że uruchomienie Cron jest ścisłe.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy modeli awaryjnych, OpenClaw przekazuje jawne puste nadpisanie modeli awaryjnych, aby podstawowy model agenta nie został dodany jako ukryty cel ponowienia.

### Priorytet modelu izolowanego Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie z hooka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Wybór modelu agenta lub modelu domyślnego.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` obowiązuje domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo przed konfiguracją.

### Ponowienia przełączenia modelu na żywo

Jeśli izolowane uruchomienie zgłasza `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu uwierzytelniania, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa działanie zamiast zapętlać się bez końca.

## Wynik uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Tury izolowanego Cron tłumią nieaktualne odpowiedzi będące wyłącznie potwierdzeniami. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne uruchomienie agenta potomnego nie odpowiada za ostateczną odpowiedź, Cron ponownie monituje raz o rzeczywisty wynik przed dostarczeniem.

### Tłumienie tokenu ciszy

Jeśli izolowane uruchomienie Cron zwraca tylko token ciszy (`NO_REPLY` lub `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników odmowy w końcowym wyniku, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` oraz frazy odmowy powiązania zatwierdzenia.

`cron list` i historia uruchomień pokazują powód odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Przechowywanie

Przechowywanie i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migracja starszych zadań

<Note>
Jeśli masz zadania Cron sprzed obecnego formatu dostarczania i magazynu, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje proste zadania awaryjne Webhook `notify: true` do jawnego dostarczania Webhook, gdy skonfigurowano `cron.webhook`.
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

Włącz lekki kontekst rozruchowy dla zadania izolowanego:

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

Utwórz zadanie izolowane z lekkim kontekstem rozruchowym:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań tur agenta. W przypadku uruchomień Cron tryb lekki utrzymuje pusty kontekst rozruchowy zamiast wstrzykiwać pełny zestaw rozruchowy obszaru roboczego.

## Typowe polecenia administracyjne

Ręczne uruchomienie i inspekcja:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby pokazać tylko zadania, których efektywny znormalizowany identyfikator agenta pasuje; zadania bez zapisanego identyfikatora agenta liczą się jako skonfigurowany agent domyślny.

`cron list --json` i `cron show <job-id> --json` zawierają pole najwyższego poziomu `status` dla każdego zadania, obliczane z `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` lub `idle`. Odzwierciedla to czytelną dla człowieka kolumnę statusu, dzięki czemu zewnętrzne narzędzia mogą odczytywać stan zadania bez ponownego wyliczania go.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron, rozstrzygniętym celem, wysyłkami narzędzia wiadomości, użyciem ścieżki awaryjnej i stanem dostarczenia.

Ponowne kierowanie agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tur agenta, i wraca do domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

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
