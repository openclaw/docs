---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie zadań Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla planisty Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` albo `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy świeży transkrypt i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże się z aktywną sesją w momencie utworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane uruchomienia resetują otaczający kontekst rozmowy. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska wykonawczego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` wyświetlają podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, czy zakończy się zamkniętą porażką.

Cele z prefiksem dostawcy mogą rozróżniać nierozstrzygnięte kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte albo ma wartość `last`. Selektorami dostawców są tylko prefiksy ogłaszane przez załadowany plugin. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu przez izolowany Cron jest współdzielone między agentem a runnerem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy trasa czatu jest dostępna.
- `announce` dostarcza awaryjnie końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do rozstrzygniętego celu.
- `webhook` publikuje ukończony ładunek pod adresem URL.
- `none` wyłącza awaryjne dostarczanie przez runner.

`--announce` to awaryjne dostarczanie przez runner dla końcowej odpowiedzi. `--no-deliver` wyłącza tę ścieżkę awaryjną, ale nie usuwa narzędzia `message` agenta, gdy trasa czatu jest dostępna.

Przypomnienia utworzone z aktywnego czatu zachowują aktywny cel dostarczania czatu na potrzeby awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszeń zadania (gdy nie ustawiono jawnego celu awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy głównym trybem dostarczania jest `webhook`. Izolowane zadania akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują awarie agenta na poziomie uruchomienia jako błędy zadania, nawet gdy
nie powstaje ładunek odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają liczniki
błędów i wyzwalają powiadomienia o awarii.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe domyślnie usuwają się po sukcesie. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego backoffu ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na backoff ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awariach dla powtarzających się powiadomień o pominiętych uruchomieniach.

Dla izolowanych zadań, które celują w lokalnie skonfigurowanego dostawcę modelu, Cron wykonuje lekki preflight dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` dla loopbacku, sieci prywatnej i `.local` są sondowani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sondowani pod `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie jest rejestrowane jako `skipped` i ponawiane w późniejszym harmonogramie; pasujące martwe punkty końcowe są buforowane przez 5 minut, aby uniknąć uderzania wielu zadań w ten sam lokalny serwer.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, a oczekujący stan środowiska wykonawczego znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie edytowany zewnętrznie, Gateway ponownie wczyta zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; przepisywanie wyłącznie formatowania nie czyści oczekującego slotu.

### Ręczne uruchomienia

`openclaw cron run` zwraca wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony albo nie można go rozstrzygnąć, Cron kończy uruchomienie jawnym błędem walidacji zamiast wracać awaryjnie do agenta zadania lub domyślnego wyboru modelu.
</Warning>

Cron `--model` to **podstawowy wybór zadania**, a nie nadpisanie `/model` sesji czatu. Oznacza to:

- Skonfigurowane modele awaryjne nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Ładunek `fallbacks` dla zadania zastępuje skonfigurowaną listę modeli awaryjnych, gdy jest obecny.
- Pusta lista awaryjna dla zadania (`fallbacks: []` w ładunku/API zadania) sprawia, że uruchomienie Cron jest ścisłe.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy awaryjnej, OpenClaw przekazuje jawne puste nadpisanie awaryjne, aby podstawowy model agenta nie został dołączony jako ukryty cel ponowienia.

### Kolejność pierwszeństwa modelu izolowanego Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie Gmail-hook.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik wybrał model).
4. Wybór modelu agenta lub domyślnego modelu.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` ma domyślnie zastosowanie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją.

### Ponowienia przełączania modelu na żywo

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model (oraz przełączone nadpisanie profilu uwierzytelniania, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a potem przerywa zamiast zapętlać się bez końca.

## Wynik uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Izolowane tury Cron tłumią nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne potomne uruchomienie subagenta nie odpowiada za ostateczną odpowiedź, Cron ponawia monit raz, aby uzyskać rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie Cron zwraca tylko cichy token (`NO_REPLY` albo `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników odmowy w końcowym wyniku, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` i frazy odmowy powiązania z zatwierdzeniem.

`cron list` i historia uruchomień pokazują powód odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) oraz migruje proste zadania awaryjne Webhook z `notify: true` do jawnego dostarczania Webhook, gdy `cron.webhook` jest skonfigurowane.
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

Ogłoś na konkretnym kanale:

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

`--light-context` dotyczy tylko izolowanych zadań tury agenta. Dla uruchomień Cron tryb lekki utrzymuje kontekst bootstrapu pusty zamiast wstrzykiwać pełny zestaw bootstrapu obszaru roboczego.

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

Wpisy `cron runs` obejmują diagnostykę dostarczania z zamierzonym celem Cron, rozstrzygniętym celem, wysłaniami narzędzia wiadomości, użyciem ścieżki awaryjnej i stanem dostarczenia.

Zmiana celu agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` jest pominięte w zadaniach tury agenta, i wraca awaryjnie do agenta domyślnego (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

Drobne zmiany dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Powiązane

- [Referencja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
