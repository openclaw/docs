---
read_when:
    - Musisz sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchamiać Gateway w trybie obserwacji podczas pracy iteracyjnej
    - Potrzebujesz powtarzalnego procesu debugowania
summary: 'Narzędzia debugowania: tryb obserwowania, nieprzetworzone strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-06T09:15:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Pomocnicze narzędzia debugowania dla wyjścia strumieniowego, szczególnie gdy dostawca miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie wykonywania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w czasie wykonywania** (w pamięci, nie na dysku).
`/debug` jest domyślnie wyłączone; włącz za pomocą `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączać rzadko używane ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śladu sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do Pluginu wiersze śladu/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Używaj `/trace` do diagnostyki Pluginów, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłego szczegółowego wyjścia stanu/narzędzi i nadal używaj
`/debug` do nadpisań konfiguracji tylko w czasie wykonywania.

## Ślad cyklu życia Pluginu

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia Pluginu wydają się wolne
i potrzebujesz wbudowanego podziału na fazy dla metadanych Pluginu, wykrywania, rejestru,
lustra czasu wykonywania, mutacji konfiguracji i odświeżania. Ślad jest opcjonalny i zapisuje
do stderr, więc wyjście poleceń JSON pozostaje możliwe do parsowania.

Przykład:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Przykładowe wyjście:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Użyj tego do badania cyklu życia Pluginu, zanim sięgniesz po profiler CPU.
Jeśli polecenie działa z checkoutu źródłowego, preferuj pomiar zbudowanego
środowiska uruchomieniowego za pomocą `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy także narzut uruchamiacza ze źródeł.

## Profilowanie uruchamiania CLI i poleceń

Użyj sprawdzonego do repo benchmarku uruchamiania, gdy polecenie wydaje się wolne:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Do jednorazowego profilowania przez zwykły uruchamiacz ze źródeł ustaw
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Uruchamiacz ze źródeł dodaje flagi profilu CPU Node i zapisuje `.cpuprofile` dla
polecenia. Użyj tego przed dodaniem tymczasowej instrumentacji do kodu polecenia.

Dla zacięć uruchamiania, które wyglądają jak synchroniczna praca systemu plików lub loadera modułów,
dodaj flagę śladu synchronicznego I/O Node przez uruchamiacz ze źródeł:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` domyślnie włącza tę flagę dla obserwowanego procesu potomnego Gateway.
Ustaw `OPENCLAW_TRACE_SYNC_IO=0`, aby wyciszyć wyjście śladu synchronicznego I/O Node w trybie obserwowania.

## Tryb obserwowania Gateway

Do szybkiej iteracji uruchom Gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant właściwy dla profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania wykonawcze agentów pozostają odłączone i zamiast tego drukują
instrukcje dołączenia. W razie potrzeby dołącz ręcznie:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia surowego obserwatora:

```bash
node scripts/watch-node.mjs gateway --force
```

Użyj trybu pierwszoplanowego, gdy tmux nie jest potrzebny:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Wyłącz automatyczne dołączanie, zachowując zarządzanie tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profiluj czas CPU obserwowanego Gateway podczas debugowania gorących punktów uruchamiania/czasu wykonywania:

```bash
pnpm gateway:watch --benchmark
```

Wrapper obserwatora przechwytuje `--benchmark` przed wywołaniem Gateway i zapisuje
jeden plik V8 `.cpuprofile` po każdym zakończeniu procesu potomnego Gateway w
`.artifacts/gateway-watch-profiles/`. Zatrzymaj lub zrestartuj obserwowany Gateway, aby
opróżnić bieżący profil, a następnie otwórz go w Chrome DevTools lub Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz zapisywać profile gdzie indziej.
Użyj `--benchmark-no-force`, gdy chcesz, aby benchmarkowany proces potomny pominął
domyślne czyszczenie portu `--force` i szybko kończył się błędem, jeśli port Gateway jest już
używany.
Tryb benchmarku domyślnie wycisza zalew śladu synchronicznego I/O. Ustaw
`OPENCLAW_TRACE_SYNC_IO=1` z `--benchmark`, gdy jawnie chcesz jednocześnie profili CPU
i stosów wywołań synchronicznego I/O Node. W trybie benchmarku te bloki śladu
są zapisywane do `gateway-watch-output.log` w katalogu benchmarku i
odfiltrowywane z panelu terminala; zwykłe logi Gateway pozostają widoczne.

Wrapper tmux przenosi do panelu typowe, niesekretne selektory czasu wykonywania, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
poświadczenia dostawcy w zwykłym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.
Jeśli obserwowany Gateway zakończy działanie podczas uruchamiania, obserwator uruchamia
`openclaw doctor --fix --non-interactive` jeden raz i restartuje proces potomny Gateway.
Użyj `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, gdy chcesz zobaczyć pierwotną awarię uruchamiania
bez deweloperskiego przebiegu naprawczego.
Zarządzany panel tmux domyślnie używa też kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` przy uruchamianiu `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Obserwator restartuje się przy zmianach plików istotnych dla buildu w `src/`, plików źródłowych rozszerzeń,
metadanych rozszerzeń `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych rozszerzeń restartują
Gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI Gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia obserwowania odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc zduplikowane procesy nadrzędne obserwatora
są zastępowane zamiast się spiętrzać.

## Profil deweloperski + deweloperski Gateway (--dev)

Użyj profilu deweloperskiego, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalna `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port Gateway na `19001` (porty pochodne przesuwają się razem z nim).
- **`gateway --dev`: nakazuje Gateway automatycznie utworzyć domyślną konfigurację +
  przestrzeń roboczą** w razie ich braku (i pominąć BOOTSTRAP.md).

Zalecany przepływ (profil deweloperski + bootstrap deweloperski):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom CLI przez `pnpm openclaw ...`.

Co to robi:

1. **Izolacja profilu** (globalna `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (przeglądarka/canvas przesuwają się odpowiednio)

2. **Bootstrap deweloperski** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, bind loopback).
   - Ustawia `agent.workspace` na deweloperską przestrzeń roboczą.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Zasiewa pliki przestrzeni roboczej, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3-PO** (droid protokolarny).
   - Pomija dostawców kanałów w trybie deweloperskim (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetowania (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywana przez niektóre uruchamiacze. Jeśli musisz ją zapisać jawnie, użyj formy zmiennej środowiskowej:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, poświadczenia, sesje i deweloperską przestrzeń roboczą (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację deweloperską.

<Tip>
Jeśli działa już niedeweloperski Gateway (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Logowanie surowego strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako delty zwykłego tekstu
(czy jako oddzielne bloki myślenia).

Włącz przez CLI:

```bash
pnpm gateway:watch --raw-stream
```

Opcjonalne nadpisanie ścieżki:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Równoważne zmienne środowiskowe:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Domyślny plik:

`~/.openclaw/logs/raw-stream.jsonl`

## Logowanie surowych fragmentów (pi-mono)

Aby przechwycić **surowe fragmenty zgodne z OpenAI** przed sparsowaniem ich do bloków,
pi-mono udostępnia oddzielny logger:

```bash
PI_RAW_STREAM=1
```

Opcjonalna ścieżka:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Domyślny plik:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Uwaga: jest to emitowane tylko przez procesy używające dostawcy
> `openai-completions` z pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz logi, najpierw usuń sekrety i PII.

## Debugowanie w VSCode

Mapy źródeł są wymagane, aby włączyć debugowanie w IDE opartych na VSCode, ponieważ wiele wygenerowanych plików otrzymuje hashowane nazwy w ramach procesu buildowania. Dołączone konfiguracje `launch.json` celują w usługę Gateway, ale można je szybko dostosować do innych celów:

1. **Przebuduj i debuguj Gateway** - debugowanie usługi Gateway po utworzeniu nowego buildu
2. **Debuguj Gateway** - debugowanie usługi Gateway z już istniejącego buildu

### Konfiguracja

Domyślna konfiguracja **Przebuduj i debuguj Gateway** zawiera wszystko, co potrzebne; automatycznie usunie folder `/dist` i przebuduje projekt z włączonym debugowaniem:

1. Otwórz panel **Uruchamianie i debugowanie** z paska aktywności albo naciśnij `Ctrl`+`Shift`+`D`
2. W IDE upewnij się, że w menu rozwijanym konfiguracji wybrano **Przebuduj i debuguj Gateway**, a następnie naciśnij przycisk **Rozpocznij debugowanie**

Alternatywnie - jeśli wolisz ręcznie zarządzać procesami buildowania i debugowania:

1. Otwórz terminal i włącz mapy źródeł:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. W tym samym terminalu przebuduj projekt: `pnpm clean:dist && pnpm build`
3. W IDE wybierz opcję **Debuguj Gateway** w menu rozwijanym konfiguracji **Uruchamianie i debugowanie**, a następnie naciśnij przycisk **Rozpocznij debugowanie**

Możesz teraz ustawiać punkty przerwania w plikach źródłowych TypeScript (katalog `src/`), a debugger poprawnie zmapuje punkty przerwania do skompilowanego JavaScriptu za pomocą map źródeł. Będzie można sprawdzać zmienne, przechodzić przez kod krok po kroku i analizować stosy wywołań zgodnie z oczekiwaniami.

### Uwagi

- Jeśli używasz opcji **"Przebuduj i debuguj Gateway"** - przy każdym uruchomieniu debuggera folder `/dist` zostanie całkowicie usunięty, a pełne `pnpm build` z włączonymi mapami źródeł zostanie wykonane przed uruchomieniem Gateway
- Jeśli używasz opcji **"Debuguj Gateway"** - sesje debugowania można uruchamiać i zatrzymywać w dowolnym momencie bez wpływu na folder `/dist`, ale musisz użyć oddzielnego procesu terminala, aby zarówno włączyć debugowanie, jak i zarządzać cyklem buildowania
- Zmodyfikuj ustawienia `args` w `launch.json`, aby debugować inne sekcje projektu
- Jeśli musisz użyć zbudowanego CLI OpenClaw do innych zadań (np. `dashboard --no-open`, jeśli sesja debugowania tworzy nowy token uwierzytelniania), możesz wykonać go w innym terminalu jako `node ./openclaw.mjs` albo utworzyć alias powłoki taki jak `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
