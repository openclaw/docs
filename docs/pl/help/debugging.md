---
read_when:
    - Musisz sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie obserwowania podczas iteracji
    - Potrzebujesz powtarzalnego przepływu pracy do debugowania
summary: 'Narzędzia do debugowania: tryb obserwowania, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-06-27T17:39:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania dla wyjścia strumieniowego, szczególnie gdy provider miesza reasoning ze zwykłym tekstem.

## Nadpisania debugowania w runtime

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w runtime** (pamięć, nie dysk).
`/debug` jest domyślnie wyłączone; włącz je przez `commands.debug: true`.
To przydatne, gdy trzeba przełączać mniej oczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śladu sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do pluginu wiersze trace/debug w jednej sesji
bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Używaj `/trace` do diagnostyki pluginów, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłego szczegółowego wyjścia statusu/narzędzi oraz
`/debug` do nadpisań konfiguracji tylko w runtime.

## Ślad cyklu życia pluginu

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia pluginów wydają się wolne
i potrzebujesz wbudowanego rozbicia faz dla metadanych pluginów, discovery, registry,
lustra runtime, mutacji konfiguracji i odświeżania. Ślad jest opt-in i zapisuje
do stderr, więc wyjście poleceń JSON pozostaje parsowalne.

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

Użyj tego do badania cyklu życia pluginów przed sięgnięciem po profiler CPU.
Jeśli polecenie działa z checkoutu źródłowego, preferuj pomiar zbudowanego
runtime przez `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy też narzut source-runnera.

## Uruchamianie CLI i profilowanie poleceń

Użyj sprawdzonego w repozytorium benchmarku startu, gdy polecenie wydaje się wolne:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Do jednorazowego profilowania przez zwykły source runner ustaw
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner dodaje flagi profilu CPU Node i zapisuje `.cpuprofile` dla
polecenia. Użyj tego przed dodawaniem tymczasowej instrumentacji do kodu polecenia.

W przypadku zatrzymań startu wyglądających na synchroniczną pracę systemu plików lub loadera modułów
dodaj flagę śladu synchronicznego I/O Node przez source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` domyślnie pozostawia tę flagę wyłączoną dla obserwowanego
procesu potomnego Gateway. Ustaw `OPENCLAW_TRACE_SYNC_IO=1`, gdy wyraźnie chcesz wyjścia
śladu synchronicznego I/O Node w trybie watch.

## Tryb watch Gateway

Do szybkiej iteracji uruchom gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant zależny od profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania agent exec pozostają odłączone i zamiast tego drukują
instrukcje dołączenia. W razie potrzeby dołącz ręcznie:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia surowy watcher:

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

Profiluj czas CPU obserwowanego Gateway podczas debugowania hotspotów startu/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch zużywa `--benchmark` przed wywołaniem Gateway i zapisuje
jeden plik V8 `.cpuprofile` przy każdym zakończeniu procesu potomnego Gateway pod
`.artifacts/gateway-watch-profiles/`. Zatrzymaj lub zrestartuj obserwowany gateway, aby
opróżnić bieżący profil, a następnie otwórz go w Chrome DevTools lub Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz umieścić profile gdzie indziej.
Użyj `--benchmark-no-force`, gdy chcesz, aby benchmarkowany proces potomny pominął
domyślne czyszczenie portu `--force` i szybko zakończył się błędem, jeśli port Gateway jest już
w użyciu.
Tryb benchmark domyślnie wycisza spam śladu sync-I/O. Ustaw
`OPENCLAW_TRACE_SYNC_IO=1` z `--benchmark`, gdy wyraźnie chcesz zarówno profili CPU,
jak i śladów stosu synchronicznego I/O Node. W trybie benchmark te bloki śladu
są zapisywane do `gateway-watch-output.log` w katalogu benchmarku i
filtrowane z panelu terminala; zwykłe logi Gateway pozostają widoczne.

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść poświadczenia providerów
w zwykłym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.
Jeśli obserwowany Gateway zakończy działanie podczas startu, watcher uruchamia
`openclaw doctor --fix --non-interactive` raz i restartuje proces potomny Gateway.
Użyj `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, gdy chcesz zobaczyć pierwotny błąd startu
bez przeznaczonego tylko dla dev przebiegu naprawczego.
Zarządzany panel tmux domyślnie używa też kolorowanych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` podczas uruchamiania `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Watcher restartuje się przy plikach istotnych dla buildu pod `src/`, plikach źródłowych rozszerzeń,
metadanych rozszerzeń `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych rozszerzeń restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia watch odtwarza nazwany panel tmux, a
surowy watcher nadal utrzymuje swoją blokadę pojedynczego watchera, więc zduplikowane procesy nadrzędne watcherów
są zastępowane zamiast się piętrzyć.

## Profil dev + dev gateway (--dev)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan pod `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (porty pochodne przesuwają się razem z nim).
- **`gateway --dev`: mówi Gateway, aby automatycznie utworzył domyślną konfigurację +
  workspace**, gdy ich brakuje (i pominął BOOTSTRAP.md).

Zalecany przepływ (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom CLI przez `pnpm openclaw ...`.

Co to robi:

1. **Izolacja profilu** (globalne `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas przesuwają się odpowiednio)

2. **Bootstrap dev** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, bind loopback).
   - Ustawia `agent.workspace` na workspace dev.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Uzupełnia pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3-PO** (droid protokolarny).
   - Pomija providerów kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetu (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywana przez niektóre runnery. Jeśli musisz ją zapisać jawnie, użyj formy zmiennej env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, poświadczenia, sesje i workspace dev (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację dev.

<Tip>
Jeśli gateway non-dev już działa (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Surowe logowanie strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy reasoning przychodzi jako delty zwykłego tekstu
(czy jako osobne bloki thinking).

Włącz przez CLI:

```bash
pnpm gateway:watch --raw-stream
```

Opcjonalne nadpisanie ścieżki:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Równoważne zmienne env:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Domyślny plik:

`~/.openclaw/logs/raw-stream.jsonl`

## Logowanie surowych chunków zgodnych z OpenAI

Aby przechwycić **surowe chunki zgodne z OpenAI** przed sparsowaniem ich do bloków,
włącz logger transportu:

```bash
OPENCLAW_RAW_STREAM=1
```

Opcjonalna ścieżka:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Domyślny plik:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz logi, najpierw usuń sekrety i dane osobowe.

## Debugowanie w VSCode

Mapy źródłowe są wymagane, aby włączyć debugowanie w IDE opartych na VSCode, ponieważ wiele wygenerowanych plików otrzymuje hashowane nazwy w ramach procesu budowania. Dołączone konfiguracje `launch.json` celują w usługę Gateway, ale można je szybko dostosować do innych celów:

1. **Przebuduj i debuguj Gateway** - debugowanie usługi Gateway po utworzeniu nowego buildu
2. **Debuguj Gateway** - debugowanie usługi Gateway z istniejącego już buildu

### Konfiguracja

Domyślna konfiguracja **Przebuduj i debuguj Gateway** zawiera wszystko, czego trzeba; automatycznie usunie folder `/dist` i przebuduje projekt z włączonym debugowaniem:

1. Otwórz panel **Run and Debug** z Activity Bar albo naciśnij `Ctrl`+`Shift`+`D`
2. W IDE upewnij się, że w menu konfiguracji wybrano **Rebuild and Debug Gateway**, a następnie naciśnij przycisk **Start Debugging**

Alternatywnie - jeśli wolisz ręcznie zarządzać procesami budowania i debugowania:

1. Otwórz terminal i włącz mapy źródłowe:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. W tym samym terminalu przebuduj projekt: `pnpm clean:dist && pnpm build`
3. W IDE wybierz opcję **Debug Gateway** w menu konfiguracji **Run and Debug**, a następnie naciśnij przycisk **Start Debugging**

Możesz teraz ustawiać breakpointy w plikach źródłowych TypeScript (katalog `src/`), a debugger poprawnie zmapuje breakpointy na skompilowany JavaScript przez mapy źródłowe. Będzie można sprawdzać zmienne, przechodzić krokowo przez kod i analizować stosy wywołań zgodnie z oczekiwaniami.

### Uwagi

- Jeśli używasz opcji **"Rebuild and Debug Gateway"** - przy każdym uruchomieniu debuggera folder `/dist` zostanie całkowicie usunięty, a przed uruchomieniem Gateway zostanie wykonane pełne `pnpm build` z włączonymi mapami źródłowymi
- Jeśli używasz opcji **"Debug Gateway"** - sesje debugowania można uruchamiać i zatrzymywać w dowolnym momencie bez wpływu na folder `/dist`, ale musisz użyć osobnego procesu terminala zarówno do włączenia debugowania, jak i zarządzania cyklem budowania
- Zmodyfikuj ustawienia `launch.json` dla `args`, aby debugować inne sekcje projektu
- Jeśli potrzebujesz użyć zbudowanego CLI OpenClaw do innych zadań (np. `dashboard --no-open`, jeśli sesja debugowania tworzy nowy token auth), możesz wykonać je w innym terminalu jako `node ./openclaw.mjs` albo utworzyć alias powłoki, taki jak `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
