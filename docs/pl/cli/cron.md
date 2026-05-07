---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres polecenia. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` albo `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy nowy transkrypt i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże się z aktywną sesją w momencie utworzenia.
    - `session:<id>` przypina do jawnego, trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane uruchomienia resetują otaczający kontekst konwersacji. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrany przez użytkownika model lub nadpisania uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z głównej czy bieżącej sesji, albo czy zakończy się niepowodzeniem w trybie zamkniętym.

Cele z prefiksem dostawcy mogą jednoznacznie wskazać nierozstrzygnięte kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte albo ma wartość `last`. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany plugin. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu dla izolowanego Cron jest współdzielone między agentem i runnerem:

- Agent może wysyłać bezpośrednio przy użyciu narzędzia `message`, gdy trasa czatu jest dostępna.
- `announce` dostarcza awaryjnie końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do rozstrzygniętego celu.
- `webhook` wysyła ukończony payload pod adres URL.
- `none` wyłącza awaryjne dostarczanie przez runner.

`--announce` to awaryjne dostarczanie przez runner końcowej odpowiedzi. `--no-deliver` wyłącza to zachowanie awaryjne, ale nie usuwa narzędzia `message` agenta, gdy trasa czatu jest dostępna.

Przypomnienia utworzone z aktywnego czatu zachowują aktywny cel dostarczania czatu dla awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być pisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszenia zadania (gdy nie ustawiono jawnego miejsca docelowego awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy główny tryb dostarczania to `webhook`. Zadania izolowane akceptują go we wszystkich trybach.
</Note>

Uwaga: izolowane uruchomienia Cron traktują awarie agenta na poziomie uruchomienia jako błędy zadania nawet wtedy, gdy
nie zostanie wygenerowany payload odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają liczniki błędów
i wyzwalają powiadomienia o awarii.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe domyślnie usuwają się po powodzeniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego opóźnienia ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awarii dla powtarzających się powiadomień o pominiętych uruchomieniach.

Dla zadań izolowanych kierowanych do lokalnie skonfigurowanego dostawcy modelu Cron wykonuje lekki preflight dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` dla local loopback, sieci prywatnej i `.local` są sprawdzani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sprawdzani pod `/models`. Jeśli endpoint jest nieosiągalny, uruchomienie zostaje zapisane jako `skipped` i ponowione w późniejszym harmonogramie; pasujące martwe endpointy są buforowane przez 5 minut, aby wiele zadań nie przeciążało tego samego lokalnego serwera.

Uwaga: definicje zadań Cron znajdują się w `jobs.json`, a oczekujący stan środowiska uruchomieniowego znajduje się w `jobs-state.json`. Jeśli `jobs.json` zostanie zmieniony zewnętrznie, Gateway ponownie wczyta zmienione harmonogramy i wyczyści nieaktualne oczekujące sloty; zmiany wyłącznie formatowania nie czyszczą oczekującego slotu.

### Uruchomienia ręczne

`openclaw cron run` zwraca wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

<Note>
`openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować starsze zachowanie „uruchom tylko, jeśli termin nadszedł”.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania.

<Warning>
Jeśli model nie jest dozwolony albo nie może zostać rozstrzygnięty, Cron kończy uruchomienie z jawnym błędem walidacji zamiast wracać awaryjnie do agenta zadania albo domyślnego wyboru modelu.
</Warning>

Cron `--model` jest **głównym modelem zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane awaryjne modele nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- `fallbacks` w payloadzie dla zadania zastępuje skonfigurowaną listę awaryjną, gdy jest obecne.
- Pusta lista awaryjna dla zadania (`fallbacks: []` w payloadzie/API zadania) sprawia, że uruchomienie Cron jest ścisłe.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy awaryjnej, OpenClaw przekazuje jawne puste nadpisanie awaryjne, aby główny model agenta nie został dodany jako ukryty cel ponowienia.

### Priorytet modelu izolowanego Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie haka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Wybór modelu agenta albo domyślny.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` ma zastosowanie domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo przed konfiguracją.

### Ponowienia przełączenia modelu na żywo

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron zapisuje przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu uwierzytelniania, gdy jest obecne) dla aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa zamiast zapętlać się bez końca.

## Wynik uruchomienia i odmowy

### Tłumienie nieaktualnych potwierdzeń

Izolowane tury Cron tłumią nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne potomne uruchomienie subagenta nie odpowiada za ostateczną odpowiedź, Cron ponownie prosi raz o rzeczywisty wynik przed dostarczeniem.

### Tłumienie cichego tokenu

Jeśli izolowane uruchomienie Cron zwróci tylko cichy token (`NO_REPLY` albo `no_reply`), Cron tłumi zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie zostanie opublikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron preferują ustrukturyzowane metadane odmowy wykonania z osadzonego uruchomienia, a następnie wracają do znanych znaczników odmowy w końcowym wyniku, takich jak `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` i frazy odmowy powiązania zatwierdzenia.

`cron list` i historia uruchomień pokazują powód odmowy zamiast raportować zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` i `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w payloadzie) i migruje proste zadania awaryjne Webhook z `notify: true` do jawnego dostarczania Webhook, gdy skonfigurowano `cron.webhook`.

Doctor usuwa też utrwalone sentinele Cron `payload.model`, takie jak `"default"`, `"null"`, puste ciągi i JSON `null`. Środowisko uruchomieniowe Cron nadal traktuje każdy niepusty ciąg `payload.model` jako jawne nadpisanie modelu i waliduje go względem `agents.defaults.models`; pomiń klucz modelu, gdy zadanie powinno używać wyboru modelu agenta/domyślnego.
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

Włącz lekki kontekst bootstrap dla zadania izolowanego:

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

Utwórz zadanie izolowane z lekkim kontekstem bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie tylko do izolowanych zadań tur agenta. Dla uruchomień Cron tryb lekki utrzymuje pusty kontekst bootstrap zamiast wstrzykiwać pełny zestaw bootstrap obszaru roboczego.

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

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby pokazać tylko zadania, których efektywny znormalizowany identyfikator agenta pasuje; zadania bez zapisanego identyfikatora agenta liczą się jako skonfigurowany domyślny agent.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron, rozstrzygniętym celem, wysyłkami narzędzia message, użyciem trybu awaryjnego i stanem dostarczenia.

Zmiana docelowego agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tur agenta, i wraca awaryjnie do domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

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
