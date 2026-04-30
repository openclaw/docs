---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy nową transkrypcję i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże się z aktywną sesją w chwili tworzenia.
    - `session:<id>` przypina do jawnego, trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka izolowanej sesji">
    Izolowane uruchomienia resetują otaczający kontekst rozmowy. Routing kanałów i grup, zasady wysyłania/kolejkowania, podniesienie uprawnień, źródło oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje i jawne, wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, czy zakończy się bezpieczną odmową.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu przez izolowany Cron jest współdzielone między agentem a runnerem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy trasa czatu jest dostępna.
- `announce` dostarcza awaryjnie tylko końcową odpowiedź, gdy agent nie wysłał jej bezpośrednio do rozstrzygniętego celu.
- `webhook` publikuje ukończony payload pod URL.
- `none` wyłącza awaryjne dostarczanie przez runner.

`--announce` to awaryjne dostarczanie przez runner końcowej odpowiedzi. `--no-deliver` wyłącza tę ścieżkę awaryjną, ale nie usuwa narzędzia `message` agenta, gdy trasa czatu jest dostępna.

Przypomnienia utworzone z aktywnego czatu zachowują docelowy punkt dostarczania czatu na żywo dla awaryjnego dostarczania przez announce. Wewnętrzne klucze sesji mogą być pisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie błędów

Powiadomienia o błędach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel announce zadania (gdy nie ustawiono jawnego miejsca docelowego błędów).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowy tryb dostarczania to `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują błędy agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy
nie powstanie payload odpowiedzi, więc błędy modelu/dostawcy nadal zwiększają
liczniki błędów i wyzwalają powiadomienia o błędach.

## Planowanie

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, które interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po sukcesie. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponawiania po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone osobno od błędów wykonania. Nie wpływają na opóźnienie ponawiania, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o błędach dla powtarzających się powiadomień o pominiętych uruchomieniach.

Dla izolowanych zadań, które wskazują lokalnego skonfigurowanego dostawcę modelu, Cron wykonuje lekki preflight dostawcy przed rozpoczęciem tury agenta. Dostawcy local loopback, sieci prywatnej i `.local` z `api: "ollama"` są sprawdzani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sprawdzani pod `/models`. Jeśli endpoint jest nieosiągalny, uruchomienie jest zapisywane jako `skipped` i ponawiane w późniejszym harmonogramie; pasujące martwe endpointy są buforowane przez 5 minut, aby uniknąć zasypywania tego samego lokalnego serwera przez wiele zadań.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, a oczekujący stan środowiska uruchomieniowego w `jobs-state.json`. Jeśli `jobs.json` zostanie edytowany zewnętrznie, Gateway ponownie wczyta zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; przepisywanie dotyczące tylko formatowania nie czyści oczekującego slotu.

### Ręczne uruchomienia

`openclaw cron run` zwraca odpowiedź, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin przypada teraz”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozstrzygnąć, Cron kończy uruchomienie jawnym błędem walidacji zamiast wracać awaryjnie do wyboru agenta zadania lub modelu domyślnego.
</Warning>

Cron `--model` jest **podstawowym modelem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane awaryjne modele nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Payload `fallbacks` na poziomie zadania zastępuje skonfigurowaną listę awaryjną, gdy jest obecny.
- Pusta lista awaryjna na poziomie zadania (`fallbacks: []` w payloadzie/API zadania) sprawia, że uruchomienie Cron jest rygorystyczne.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy awaryjnej, OpenClaw przekazuje jawne puste nadpisanie awaryjne, aby podstawowy model agenta nie został dodany jako ukryty cel ponowienia.

### Kolejność pierwszeństwa modeli w izolowanym Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie z hooka Gmail.
2. `--model` na poziomie zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Wybór agenta lub modelu domyślnego.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` ma zastosowanie domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją.

### Ponowienia przełączenia modelu na żywo

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model (oraz przełączone nadpisanie profilu uwierzytelniania, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponawiania jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa działanie zamiast zapętlać się bez końca.

## Wynik uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Izolowane tury Cron tłumią nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne uruchomienie podrzędnego subagenta nie odpowiada za ostateczną odpowiedź, Cron raz ponownie prosi o rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie Cron zwróci tylko cichy token (`NO_REPLY` lub `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie zostanie opublikowane z powrotem na czacie.

### Strukturalne odmowy

Izolowane uruchomienia Cron preferują strukturalne metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają awaryjnie do znanych znaczników odmowy w końcowym wyniku, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` i frazy odmowy powiązania zatwierdzeń.

`cron list` i historia uruchomień pokazują powód odmowy zamiast raportować zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w payloadzie) i migruje proste zadania awaryjne Webhook `notify: true` do jawnego dostarczania Webhook, gdy skonfigurowano `cron.webhook`.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst bootstrapu dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś na określonym kanale:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Ogłoś w temacie forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z lekkim kontekstem bootstrapu:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie tylko do izolowanych zadań tury agenta. W uruchomieniach Cron tryb lekki pozostawia kontekst bootstrapu pusty zamiast wstrzykiwać pełny zestaw bootstrapu obszaru roboczego.

## Typowe polecenia administracyjne

Ręczne uruchomienie i inspekcja:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Wpisy `cron runs` obejmują diagnostykę dostarczania z zamierzonym celem Cron, rozstrzygniętym celem, wysyłkami narzędzia message, użyciem ścieżki awaryjnej i stanem dostarczenia.

Przekierowanie agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tury agenta, i wraca awaryjnie do domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

Korekty dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
