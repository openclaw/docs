---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie zadań Cron i logi
summary: Dokumentacja CLI dla `openclaw cron` (planuj i uruchamiaj zadania w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-02T09:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres polecenia. Zobacz [zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` akceptuje `main`, `isolated`, `current` albo `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy nową transkrypcję i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże się z aktywną sesją w chwili tworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka izolowanej sesji">
    Izolowane uruchomienia resetują otaczający kontekst rozmowy. Routing kanałów i grup, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrany przez użytkownika model lub nadpisania uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozpoznanej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozpoznana z sesji głównej lub bieżącej, czy zakończy się bezpieczną odmową.

Cele z prefiksem dostawcy mogą ujednoznacznić nierozpoznane kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte albo ma wartość `last`. Tylko prefiksy ogłaszane przez załadowany Plugin są selektorami dostawców. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wyjście wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu izolowanego Cron jest współdzielone między agentem a procesem uruchamiającym:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza ostateczną odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do rozpoznanego celu.
- `webhook` publikuje ukończony ładunek pod URL.
- `none` wyłącza awaryjne dostarczanie przez proces uruchamiający.

`--announce` to awaryjne dostarczanie ostatecznej odpowiedzi przez proces uruchamiający. `--no-deliver` wyłącza to zachowanie awaryjne, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują docelowy czat na żywo do awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokoi Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozpoznawane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszenia zadania (gdy nie ustawiono jawnego celu awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy głównym trybem dostarczania jest `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują awarie agenta na poziomie uruchomienia jako błędy zadania, nawet gdy
nie powstaje ładunek odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają liczniki błędów
i wyzwalają powiadomienia o awarii.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awarii dla powtarzających się powiadomień o pominiętych uruchomieniach.

Dla izolowanych zadań kierowanych do lokalnie skonfigurowanego dostawcy modelu Cron wykonuje lekki test wstępny dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` dostępni przez loopback, sieć prywatną i `.local` są sondowani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sondowani pod `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie jest zapisywane jako `skipped` i ponawiane w późniejszym harmonogramie; pasujące martwe punkty końcowe są buforowane przez 5 minut, aby uniknąć zasypywania tego samego lokalnego serwera przez wiele zadań.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, a oczekujący stan środowiska uruchomieniowego znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie zmodyfikowany zewnętrznie, Gateway ponownie załaduje zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; przepisania zmieniające tylko formatowanie nie czyszczą oczekującego slotu.

### Uruchomienia ręczne

`openclaw cron run` zwraca wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony albo nie można go rozpoznać, Cron kończy uruchomienie jawnym błędem walidacji zamiast wracać do agenta zadania lub domyślnego wyboru modelu.
</Warning>

Cron `--model` jest **głównym modelem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane modele awaryjne nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Ładunek `fallbacks` dla zadania zastępuje skonfigurowaną listę modeli awaryjnych, gdy jest obecny.
- Pusta lista modeli awaryjnych dla zadania (`fallbacks: []` w ładunku zadania/API) sprawia, że uruchomienie Cron jest rygorystyczne.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy modeli awaryjnych, OpenClaw przekazuje jawne puste nadpisanie modeli awaryjnych, aby główny model agenta nie został dodany jako ukryty cel ponowienia.

### Priorytet modeli izolowanego Cron

Izolowany Cron rozpoznaje aktywny model w tej kolejności:

1. Nadpisanie haka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Agent lub domyślny wybór modelu.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozpoznanym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` ma zastosowanie domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją.

### Ponowienia po przełączeniu modelu na żywo

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron zapisuje przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu uwierzytelniania, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa zamiast zapętlać się bez końca.

## Wyjście uruchomienia i odmowy

### Tłumienie nieaktualnego potwierdzenia

Izolowane tury Cron tłumią nieaktualne odpowiedzi będące wyłącznie potwierdzeniem. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne uruchomienie potomnego subagenta nie odpowiada za ostateczną odpowiedź, Cron ponownie prosi raz o rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie Cron zwróci tylko cichy token (`NO_REPLY` albo `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę podsumowania w kolejce, więc nic nie jest publikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników odmowy w końcowym wyjściu, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` oraz frazy odmowy powiązania zatwierdzenia.

`cron list` i historia uruchomień pokazują przyczynę odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone izolowane sesje uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed bieżącego formatu dostarczania i magazynu, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) oraz migruje proste zadania awaryjne Webhook z `notify: true` do jawnego dostarczania Webhook, gdy `cron.webhook` jest skonfigurowane.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmieniania wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst rozruchowy dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś do określonego kanału:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Ogłoś do tematu forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z lekkim kontekstem rozruchowym:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie tylko do izolowanych zadań tury agenta. W przypadku uruchomień Cron tryb lekki utrzymuje pusty kontekst rozruchowy zamiast wstrzykiwać pełny zestaw rozruchowy obszaru roboczego.

## Typowe polecenia administracyjne

Ręczne uruchomienie i inspekcja:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron, rozpoznanym celem, wysłaniami narzędzia wiadomości, użyciem mechanizmu awaryjnego i stanem dostarczenia.

Zmiana agenta i celu sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` jest pominięte w zadaniach tury agenta, i wraca do domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

Dostosowania dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
