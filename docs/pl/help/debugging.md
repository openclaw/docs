---
read_when:
    - Należy sprawdzić nieprzetworzone dane wyjściowe modelu pod kątem wycieku rozumowania.
    - Chcesz uruchomić Gateway w trybie obserwacji podczas pracy iteracyjnej
    - Potrzebujesz powtarzalnego przepływu pracy debugowania
summary: 'Narzędzia debugowania: tryb obserwacji, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-10T19:40:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania dla wyjścia strumieniowego, zwłaszcza gdy provider miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie wykonywania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w czasie wykonywania** (pamięć, nie dysk).
`/debug` jest domyślnie wyłączone; włącz je za pomocą `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączać mało oczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śladu sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do pluginu wiersze śladu/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Użyj `/trace` do diagnostyki pluginu, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do normalnego szczegółowego wyjścia statusu/narzędzi, a
`/debug` do nadpisań konfiguracji tylko w czasie wykonywania.

## Ślad cyklu życia pluginu

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia pluginu wydają się wolne
i potrzebujesz wbudowanego rozbicia faz dla metadanych pluginu, wykrywania, rejestru,
lustra runtime, mutacji konfiguracji oraz pracy odświeżania. Ślad jest opcjonalny i zapisuje
do stderr, dzięki czemu wyjście poleceń JSON pozostaje parsowalne.

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

Użyj tego do badania cyklu życia pluginu przed sięgnięciem po profiler CPU.
Jeśli polecenie jest uruchamiane z checkoutu źródeł, preferuj pomiar zbudowanego
runtime za pomocą `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy także narzut runnera źródłowego.

## Uruchamianie CLI i profilowanie poleceń

Użyj wpisanego do repozytorium benchmarku uruchamiania, gdy polecenie wydaje się wolne:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Do jednorazowego profilowania przez normalny runner źródłowy ustaw
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner źródłowy dodaje flagi profilu CPU Node i zapisuje `.cpuprofile` dla
polecenia. Użyj tego przed dodaniem tymczasowej instrumentacji do kodu polecenia.

Dla zacięć startowych, które wyglądają jak synchroniczna praca systemu plików lub loadera modułów,
dodaj flagę śladu synchronicznego I/O Node przez runner źródłowy:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` domyślnie pozostawia tę flagę wyłączoną dla obserwowanego
procesu potomnego Gateway. Ustaw `OPENCLAW_TRACE_SYNC_IO=1`, gdy jawnie chcesz
wyjście śladu synchronicznego I/O Node w trybie watch.

## Tryb watch Gateway

Do szybkiej iteracji uruchom Gateway pod watcherem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant specyficzny dla profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania exec agentów pozostają odłączone i zamiast tego
wypisują instrukcje dołączenia. W razie potrzeby dołącz ręcznie:

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

Profiluj czas CPU obserwowanego Gateway podczas debugowania hotspotów startowych/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch zużywa `--benchmark` przed wywołaniem Gateway i zapisuje
jeden plik V8 `.cpuprofile` na każde zakończenie procesu potomnego Gateway w
`.artifacts/gateway-watch-profiles/`. Zatrzymaj lub zrestartuj obserwowany gateway, aby
opróżnić bieżący profil, a następnie otwórz go w Chrome DevTools lub Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz zapisywać profile gdzie indziej.
Użyj `--benchmark-no-force`, gdy chcesz, aby benchmarkowany proces potomny pominął
domyślne czyszczenie portu `--force` i szybko zakończył się błędem, jeśli port Gateway jest już
używany.
Tryb benchmark domyślnie tłumi spam śladu sync-I/O. Ustaw
`OPENCLAW_TRACE_SYNC_IO=1` z `--benchmark`, gdy jawnie chcesz zarówno profile CPU,
jak i ślady stosu sync-I/O Node. W trybie benchmark te bloki śladu
są zapisywane do `gateway-watch-output.log` w katalogu benchmarku i
filtrowane z panelu terminala; normalne logi Gateway pozostają widoczne.

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
dane uwierzytelniające providerów w normalnym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych efemerycznych sekretów.
Jeśli obserwowany Gateway kończy działanie podczas startu, watcher uruchamia
`openclaw doctor --fix --non-interactive` raz i restartuje proces potomny Gateway.
Użyj `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, gdy chcesz zobaczyć pierwotny błąd startowy
bez naprawy tylko dla trybu developerskiego.
Zarządzany panel tmux domyślnie używa też kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` podczas uruchamiania `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Watcher restartuje się po zmianach plików istotnych dla buildu w `src/`, plikach źródłowych extension,
metadanych extension `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych extension restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia watch odtwarza nazwany panel tmux, a
surowy watcher nadal zachowuje swoją blokadę pojedynczego watchera, więc zduplikowane procesy nadrzędne watcherów
są zastępowane zamiast się kumulować.

## Profil dev + gateway dev (--dev)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
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
   - Ustawia `agent.skipBootstrap=true` (brak BOOTSTRAP.md).
   - Zasiewa pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3-PO** (droid protokolarny).
   - Pomija providery kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetowania (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywana przez niektóre runnery. Jeśli musisz zapisać ją jawnie, użyj formy zmiennej env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` usuwa konfigurację, dane uwierzytelniające, sesje i workspace dev (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację dev.

<Tip>
Jeśli gateway nie-dev już działa (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Logowanie surowego strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako zwykłe delty tekstowe
(albo jako osobne bloki myślenia).

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

Plik domyślny:

`~/.openclaw/logs/raw-stream.jsonl`

## Logowanie surowych fragmentów (pi-mono)

Aby przechwycić **surowe fragmenty kompatybilne z OpenAI** przed sparsowaniem ich do bloków,
pi-mono udostępnia osobny logger:

```bash
PI_RAW_STREAM=1
```

Opcjonalna ścieżka:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Plik domyślny:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Uwaga: jest to emitowane tylko przez procesy używające providera
> `openai-completions` pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz logi, najpierw usuń sekrety i PII.

## Debugowanie w VSCode

Mapy źródeł są wymagane do włączenia debugowania w IDE opartych na VSCode, ponieważ wiele wygenerowanych plików otrzymuje haszowane nazwy w ramach procesu build. Dołączone konfiguracje `launch.json` celują w usługę Gateway, ale można je szybko dostosować do innych celów:

1. **Przebuduj i debuguj Gateway** - Debuguje usługę Gateway po utworzeniu nowego buildu
2. **Debuguj Gateway** - Debuguje usługę Gateway z istniejącego wcześniej buildu

### Konfiguracja

Domyślna konfiguracja **Przebuduj i debuguj Gateway** zawiera wszystko, co potrzebne; automatycznie usunie folder `/dist` i przebuduje projekt z włączonym debugowaniem:

1. Otwórz panel **Run and Debug** z paska aktywności albo naciśnij `Ctrl`+`Shift`+`D`
2. W IDE upewnij się, że w liście konfiguracji wybrano **Przebuduj i debuguj Gateway**, a następnie naciśnij przycisk **Start Debugging**

Alternatywnie - jeśli wolisz ręcznie zarządzać procesami buildu i debugowania:

1. Otwórz terminal i włącz mapy źródeł:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. W tym samym terminalu przebuduj projekt: `pnpm clean:dist && pnpm build`
3. W IDE wybierz opcję **Debuguj Gateway** z listy konfiguracji **Run and Debug**, a następnie naciśnij przycisk **Start Debugging**

Możesz teraz ustawiać breakpointy w plikach źródłowych TypeScript (katalog `src/`), a debugger poprawnie zmapuje breakpointy na skompilowany JavaScript za pomocą map źródeł. Będzie można sprawdzać zmienne, przechodzić przez kod krok po kroku i analizować stosy wywołań zgodnie z oczekiwaniami.

### Uwagi

- Jeśli używasz opcji **"Przebuduj i debuguj Gateway"** - za każdym uruchomieniem debuggera całkowicie usunie on folder `/dist` i uruchomi pełne `pnpm build` z włączonymi mapami źródeł przed startem Gateway
- Jeśli używasz opcji **"Debuguj Gateway"** - sesje debugowania można uruchamiać i zatrzymywać w dowolnym momencie bez wpływu na folder `/dist`, ale musisz używać osobnego procesu terminala zarówno do włączenia debugowania, jak i zarządzania cyklem buildu
- Zmodyfikuj ustawienia `launch.json` dla `args`, aby debugować inne części projektu
- Jeśli musisz użyć zbudowanego OpenClaw CLI do innych zadań (np. `dashboard --no-open`, jeśli sesja debugowania tworzy nowy token uwierzytelniania), możesz uruchomić je w innym terminalu jako `node ./openclaw.mjs` albo utworzyć alias powłoki, taki jak `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
