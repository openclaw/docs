---
read_when:
    - Musisz sprawdzić surowe dane wyjściowe modelu pod kątem ujawnienia rozumowania
    - Chcesz uruchomić Gateway w trybie obserwowania podczas iteracji
    - Potrzebujesz powtarzalnego procesu debugowania
summary: 'Narzędzia do debugowania: tryb obserwacji, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-03T21:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania dla wyjścia strumieniowego, zwłaszcza gdy provider miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie działania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w czasie działania** (w pamięci, nie na dysku).
`/debug` jest domyślnie wyłączone; włącz za pomocą `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączać mniej oczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śledzenia sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do pluginu wiersze śledzenia/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Użyj `/trace` do diagnostyki pluginów, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłego szczegółowego wyjścia statusu/narzędzi, a `/debug` do nadpisań konfiguracji tylko w czasie działania.

## Śledzenie cyklu życia Plugin

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia pluginu wydają się wolne
i potrzebujesz wbudowanego rozbicia faz dla metadanych pluginu, wykrywania, rejestru,
lustra runtime, mutacji konfiguracji i odświeżania. Śledzenie jest opcjonalne i zapisuje
do stderr, więc wyjście polecenia JSON pozostaje możliwe do parsowania.

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

Użyj tego do badania cyklu życia pluginu, zanim sięgniesz po profiler CPU.
Jeśli polecenie jest uruchamiane z checkoutu źródeł, preferuj mierzenie zbudowanego
runtime za pomocą `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy także narzut runnera źródeł.

## Profilowanie uruchamiania CLI i poleceń

Użyj dołączonego benchmarku uruchamiania, gdy polecenie wydaje się wolne:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Do jednorazowego profilowania przez zwykły runner źródeł ustaw
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner źródeł dodaje flagi profilu CPU Node i zapisuje `.cpuprofile` dla
polecenia. Użyj tego przed dodawaniem tymczasowej instrumentacji do kodu polecenia.

## Tryb obserwacji Gateway

Dla szybkiej iteracji uruchom Gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant specyficzny dla profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania agent exec pozostają odłączone i zamiast tego wypisują
instrukcje dołączenia. W razie potrzeby dołącz ręcznie:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia surowy obserwator:

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

Profiluj czas CPU obserwowanego Gateway podczas debugowania wąskich gardeł uruchamiania/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper obserwatora zużywa `--benchmark` przed wywołaniem Gateway i zapisuje
jeden plik V8 `.cpuprofile` dla każdego zakończenia procesu potomnego Gateway w
`.artifacts/gateway-watch-profiles/`. Zatrzymaj lub zrestartuj obserwowany gateway, aby
opróżnić bieżący profil, a następnie otwórz go w Chrome DevTools albo Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz zapisywać profile gdzie indziej.
Użyj `--benchmark-no-force`, gdy chcesz, aby benchmarkowany proces potomny pominął
domyślne czyszczenie portu `--force` i szybko zakończył się błędem, jeśli port Gateway jest już
używany.

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
poświadczenia providerów w normalnym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.
Jeśli obserwowany Gateway zakończy działanie podczas uruchamiania, obserwator uruchamia
`openclaw doctor --fix --non-interactive` raz i restartuje proces potomny Gateway.
Użyj `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, gdy chcesz zobaczyć pierwotną awarię uruchamiania
bez deweloperskiego przebiegu naprawczego.
Zarządzany panel tmux domyślnie używa także kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` podczas uruchamiania `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Obserwator restartuje się po zmianach plików istotnych dla buildu w `src/`, plików źródłowych rozszerzeń,
metadanych rozszerzeń `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych rozszerzeń restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia obserwatora odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc duplikaty procesów nadrzędnych obserwatora
są zastępowane zamiast się piętrzyć.

## Profil dev + Gateway dev (--dev)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (porty pochodne przesuwają się razem z nim).
- **`gateway --dev`: informuje Gateway, aby automatycznie utworzył domyślną konfigurację +
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
   - `OPENCLAW_GATEWAY_PORT=19001` (przeglądarka/canvas przesuwają się odpowiednio)

2. **Bootstrap dev** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, bind loopback).
   - Ustawia `agent.workspace` na workspace dev.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Zasila pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija providery kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetowania (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywane przez niektóre runnery. Jeśli musisz zapisać to jawnie, użyj formy zmiennej środowiskowej:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, poświadczenia, sesje i workspace dev (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację dev.

<Tip>
Jeśli brama inna niż dev już działa (launchd albo systemd), najpierw ją zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Surowe logowanie strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie dociera jako delty zwykłego tekstu
(czy jako osobne bloki myślenia).

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

## Surowe logowanie fragmentów (pi-mono)

Aby przechwycić **surowe fragmenty zgodne z OpenAI** przed sparsowaniem ich na bloki,
pi-mono udostępnia osobny logger:

```bash
PI_RAW_STREAM=1
```

Opcjonalna ścieżka:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Domyślny plik:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Uwaga: jest to emitowane tylko przez procesy używające providera pi-mono
> `openai-completions`.

## Uwagi dotyczące bezpieczeństwa

- Surowe logi strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po zakończeniu debugowania.
- Jeśli udostępniasz logi, najpierw usuń sekrety i dane osobowe.

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
