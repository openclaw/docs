---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby zapoznać się z przewodnikiem koncepcyjnym.
</Tip>

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` albo `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże zadanie z główną sesją agenta.
    - `isolated` tworzy świeży transkrypt i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże zadanie z aktywną sesją w chwili utworzenia.
    - `session:<id>` przypina zadanie do jawnego, trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka izolowanej sesji">
    Izolowane uruchomienia resetują kontekst rozmowy z otoczenia. Routing kanału i grupy, zasady wysyłania/kolejkowania, podwyższenie uprawnień, pochodzenie oraz powiązanie środowiska wykonawczego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, czy zostanie bezpiecznie odrzucona.

Cele z prefiksem dostawcy mogą ujednoznacznić nierozstrzygnięte kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte albo ma wartość `last`. Tylko prefiksy ogłaszane przez załadowany plugin są selektorami dostawcy. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu izolowanego Cron jest współdzielone między agentem i uruchamiaczem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` dostarcza awaryjnie końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do rozstrzygniętego celu.
- `webhook` publikuje ukończony ładunek pod URL.
- `none` wyłącza awaryjne dostarczanie przez uruchamiacz.

`--announce` to awaryjne dostarczanie końcowej odpowiedzi przez uruchamiacz. `--no-deliver` wyłącza to awaryjne dostarczanie, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują bieżący cel dostarczania czatu na potrzeby awaryjnego dostarczania ogłoszenia. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszenia zadania, gdy nie ustawiono jawnego celu awarii.

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowym trybem dostarczania jest `webhook`. Zadania izolowane akceptują go we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy
nie powstaje żaden ładunek odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają
liczniki błędów i wyzwalają powiadomienia o awariach.

Jeśli izolowane uruchomienie przekroczy limit czasu przed pierwszym żądaniem do modelu, `openclaw cron show`
i `openclaw cron runs` zawierają błąd specyficzny dla fazy, taki jak
`setup timed out before runner start` albo
`stalled before first model call (last phase: context-engine)`.
Dla dostawców opartych na CLI strażnik przedmodelowy pozostaje aktywny do chwili rozpoczęcia zewnętrznej
tury CLI, więc zastoje w wyszukiwaniu sesji, haku, uwierzytelnianiu, prompcie i konfiguracji CLI są
zgłaszane jako przedmodelowe awarie Cron.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, które interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe domyślnie usuwają się po sukcesie. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awariach dla powtarzających się powiadomień o pominiętych uruchomieniach.

Dla zadań izolowanych, które celują w lokalnie skonfigurowanego dostawcę modelu, Cron uruchamia lekką kontrolę wstępną dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` przez Loopback, sieć prywatną i `.local` są sprawdzani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sprawdzani pod `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie jest rejestrowane jako `skipped` i ponawiane w późniejszym harmonogramie; pasujące martwe punkty końcowe są buforowane przez 5 minut, aby wiele zadań nie obciążało tego samego lokalnego serwera.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, natomiast oczekujący stan środowiska wykonawczego znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie zmodyfikowany zewnętrznie, Gateway ponownie wczyta zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; przepisanie samego formatowania nie czyści oczekującego slotu.

### Uruchomienia ręczne

`openclaw cron run` zwraca odpowiedź, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozstrzygnąć, Cron kończy uruchomienie jawnym błędem walidacji zamiast wracać awaryjnie do agenta zadania lub domyślnego wyboru modelu.
</Warning>

Cron `--model` jest **podstawowym modelem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane modele awaryjne nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Ładunek `fallbacks` dla zadania zastępuje skonfigurowaną listę awaryjną, gdy jest obecny.
- Pusta lista awaryjna dla zadania (`fallbacks: []` w ładunku/API zadania) wymusza ścisłe uruchomienie Cron.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy awaryjnej, OpenClaw przekazuje jawne puste nadpisanie awaryjne, aby podstawowy model agenta nie został dołączony jako ukryty cel ponowienia.

### Priorytet modeli izolowanego Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie haka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron, gdy użytkownik je wybrał.
4. Wybór modelu agenta albo domyślny.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu live. Konfiguracja modelu `params.fastMode` ma zastosowanie domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo przed konfiguracją.

### Ponowienia przełączania modelu live

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model oraz nadpisanie przełączonego profilu uwierzytelniania, gdy jest obecne, dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a potem przerywa zamiast zapętlać się bez końca.

## Wynik uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Izolowane tury Cron tłumią nieaktualne odpowiedzi będące wyłącznie potwierdzeniem. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne potomne uruchomienie podagenta nie odpowiada za ostateczną odpowiedź, Cron ponownie pyta raz o rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie Cron zwraca tylko cichy token (`NO_REPLY` albo `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają awaryjnie do znanych znaczników odmowy w końcowym wyniku, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` i frazy odmowy powiązania z akceptacją.

`cron list` i historia uruchomień pokazują przyczynę odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed obecnego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje proste zadania awaryjnego Webhook z `notify: true` do jawnego dostarczania Webhook, gdy skonfigurowano `cron.webhook`.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmieniania wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla zadania izolowanego:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst startowy dla zadania izolowanego:

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

Utwórz zadanie izolowane z lekkim kontekstem startowym:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań tury agenta. Dla uruchomień Cron tryb lekki pozostawia pusty kontekst startowy zamiast wstrzykiwać pełny zestaw startowy obszaru roboczego.

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

`cron list --json` i `cron show <job-id> --json` zawierają pole najwyższego poziomu `status` w każdym zadaniu, obliczane z `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` albo `idle`. Odzwierciedla to kolumnę statusu czytelną dla człowieka, aby narzędzia zewnętrzne mogły odczytać stan zadania bez ponownego jego wyprowadzania.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron, rozstrzygniętym celem, wysyłkami narzędzia wiadomości, użyciem ścieżki awaryjnej i stanem dostarczenia.

Przekierowanie agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` jest pominięte w zadaniach tury agenta, i wraca awaryjnie do agenta domyślnego (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

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
