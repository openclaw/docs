---
read_when:
    - Musisz sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie śledzenia zmian podczas pracy iteracyjnej
    - Potrzebny jest powtarzalny proces debugowania
summary: 'Narzędzia debugowania: tryb obserwacji, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-05T01:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Pomocnicze narzędzia debugowania dla strumieniowego wyjścia, zwłaszcza gdy provider miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie działania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko na czas działania** (w pamięci, nie na dysku).
`/debug` jest domyślnie wyłączone; włącz je za pomocą `commands.debug: true`.
Przydaje się to, gdy trzeba przełączyć nieoczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śladu sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do Plugin linie śladu/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Używaj `/trace` do diagnostyki Plugin, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłego szczegółowego wyjścia statusu/narzędzi i nadal używaj
`/debug` do nadpisań konfiguracji tylko na czas działania.

## Ślad cyklu życia Plugin

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia Plugin wydają się wolne
i potrzebujesz wbudowanego podziału na fazy dla metadanych Plugin, odkrywania, rejestru,
lustra runtime, mutacji konfiguracji oraz odświeżania. Ślad jest opcjonalny i zapisuje
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

Użyj tego do badania cyklu życia Plugin, zanim sięgniesz po profiler CPU.
Jeśli polecenie działa z checkoutu źródłowego, preferuj pomiar zbudowanego
runtime za pomocą `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy także narzut runnera źródłowego.

## Profilowanie uruchamiania CLI i poleceń

Użyj dołączonego benchmarku uruchamiania, gdy polecenie wydaje się wolne:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Do jednorazowego profilowania przez zwykły runner źródłowy ustaw
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner źródłowy dodaje flagi profilu CPU Node i zapisuje `.cpuprofile` dla
polecenia. Użyj tego przed dodaniem tymczasowej instrumentacji do kodu polecenia.

W przypadku zacięć uruchamiania, które wyglądają na synchroniczną pracę systemu plików lub loadera modułów,
dodaj flagę śladu synchronicznego I/O Node przez runner źródłowy:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` domyślnie włącza tę flagę dla obserwowanego procesu potomnego Gateway.
Ustaw `OPENCLAW_TRACE_SYNC_IO=0`, aby wyciszyć wyjście śladu synchronicznego I/O Node w trybie watch.

## Tryb watch Gateway

Do szybkiej iteracji uruchom gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant zależny od profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania exec agentów pozostają odłączone i zamiast tego wypisują
instrukcje dołączenia. W razie potrzeby dołącz ręcznie:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia surowy obserwator:

```bash
node scripts/watch-node.mjs gateway --force
```

Użyj trybu foreground, gdy tmux nie jest potrzebny:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Wyłącz automatyczne dołączanie, zachowując zarządzanie tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profiluj czas CPU obserwowanego Gateway podczas debugowania hotspotów uruchamiania/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch zużywa `--benchmark` przed wywołaniem Gateway i zapisuje
jeden plik V8 `.cpuprofile` na każde zakończenie procesu potomnego Gateway pod
`.artifacts/gateway-watch-profiles/`. Zatrzymaj lub zrestartuj obserwowany gateway, aby
opróżnić bieżący profil, a następnie otwórz go w Chrome DevTools lub Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz zapisywać profile gdzie indziej.
Użyj `--benchmark-no-force`, gdy chcesz, aby benchmarkowany proces potomny pominął
domyślne czyszczenie portu `--force` i szybko zakończył się błędem, jeśli port Gateway jest już
zajęty.
Tryb benchmark domyślnie wycisza spam śladu sync-I/O. Ustaw
`OPENCLAW_TRACE_SYNC_IO=1` z `--benchmark`, gdy wyraźnie chcesz mieć zarówno profile CPU,
jak i stosy śladu synchronicznego I/O Node. W trybie benchmark te bloki śladu
są zapisywane do `gateway-watch-output.log` w katalogu benchmarku i
filtrowane z panelu terminala; zwykłe logi Gateway pozostają widoczne.

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
poświadczenia providerów w normalnym profilu/konfiguracji albo użyj surowego trybu foreground
dla jednorazowych sekretów efemerycznych.
Jeśli obserwowany Gateway zakończy działanie podczas uruchamiania, obserwator uruchamia
`openclaw doctor --fix --non-interactive` jeden raz i restartuje proces potomny Gateway.
Użyj `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, gdy chcesz zobaczyć pierwotną awarię uruchamiania
bez naprawy tylko dla środowiska dev.
Zarządzany panel tmux domyślnie używa też kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` podczas uruchamiania `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Obserwator restartuje się przy plikach istotnych dla buildu pod `src/`, plikach źródłowych extension,
metadanych extension `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych extension restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródła i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia watch odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc zduplikowane procesy nadrzędne obserwatora
są zastępowane zamiast się kumulować.

## Profil dev + gateway dev (`--dev`)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan pod `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (pochodne porty przesuwają się razem z nim).
- **`gateway --dev`: mówi Gateway, aby automatycznie utworzył domyślną konfigurację +
  workspace**, gdy ich brakuje (i pominął BOOTSTRAP.md).

Zalecany przepływ (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jeśli nie masz jeszcze globalnej instalacji, uruchom CLI przez `pnpm openclaw ...`.

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
   - Zasila pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija providerów kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetu (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i niektóre runnery ją przechwytują. Jeśli musisz ją zapisać wprost, użyj formy zmiennej env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, poświadczenia, sesje i workspace dev (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację dev.

<Tip>
Jeśli gateway inny niż dev już działa (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Surowe logowanie strumienia (OpenClaw)

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

Równoważne zmienne env:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Domyślny plik:

`~/.openclaw/logs/raw-stream.jsonl`

## Surowe logowanie chunków (pi-mono)

Aby przechwycić **surowe chunki zgodne z OpenAI** przed sparsowaniem ich do bloków,
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

> Uwaga: jest to emitowane tylko przez procesy używające providera
> `openai-completions` z pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Surowe logi strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz logi, najpierw usuń sekrety i dane osobowe.

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
