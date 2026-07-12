---
read_when:
    - Musisz sprawdzić surowe dane wyjściowe modelu pod kątem ujawnienia toku rozumowania
    - Chcesz uruchomić Gateway w trybie obserwacji podczas wprowadzania kolejnych zmian
    - Potrzebujesz powtarzalnego procesu debugowania
summary: 'Narzędzia debugowania: tryb obserwacji, nieprzetworzone strumienie modelu i śledzenie wycieku procesu rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-07-12T15:11:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Pomocnicze narzędzia do debugowania strumieniowego wyjścia, iteracyjnego uruchamiania Gateway i profilowania uruchamiania.

## Nadpisania debugowania środowiska uruchomieniowego

`/debug` ustawia nadpisania konfiguracji **wyłącznie dla środowiska uruchomieniowego** (w pamięci, nie na dysku). Domyślnie wyłączone; włącz za pomocą `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` usuwa wszystkie nadpisania i przywraca konfigurację zapisaną na dysku.

## Dane wyjściowe śledzenia sesji

`/trace` wyświetla wiersze śledzenia/debugowania należące do pluginu dla jednej sesji bez włączania pełnego trybu szczegółowego. Używaj go do diagnostyki pluginów, na przykład podsumowań debugowania Active Memory; do zwykłych danych wyjściowych stanu i narzędzi używaj `/verbose`.

```text
/trace
/trace on
/trace off
```

## Śledzenie cyklu życia pluginu

Ustaw `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, aby uzyskać podział na poszczególne fazy obsługi metadanych pluginu, wykrywania, rejestru, kopii środowiska uruchomieniowego, modyfikowania konfiguracji i odświeżania. Dane są zapisywane do stderr, dzięki czemu dane wyjściowe poleceń w formacie JSON pozostają możliwe do przeanalizowania.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Użyj tego, zanim sięgniesz po profiler CPU. W kopii roboczej kodu źródłowego mierz zbudowane środowisko uruchomieniowe za pomocą `node dist/entry.js ...` po wykonaniu `pnpm build`; `pnpm openclaw ...` uwzględnia również narzut modułu uruchamiającego kod źródłowy.

## Profilowanie uruchamiania CLI i poleceń

Wzorce wydajności uruchamiania zapisane w repozytorium:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

W celu jednorazowego profilowania przez standardowy moduł uruchamiający kod źródłowy ustaw `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Moduł uruchamiający kod źródłowy dodaje flagi profilu CPU Node i zapisuje plik `.cpuprofile` dla polecenia. Użyj tego przed dodaniem tymczasowej instrumentacji do kodu polecenia.

W przypadku zawieszania się podczas uruchamiania, które wygląda na synchroniczne operacje systemu plików lub modułu ładującego moduły, dodaj flagę śledzenia synchronicznych operacji wejścia/wyjścia Node za pośrednictwem modułu uruchamiającego kod źródłowy:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` domyślnie pozostawia tę flagę wyłączoną dla obserwowanego procesu potomnego Gateway; ustaw `OPENCLAW_TRACE_SYNC_IO=1`, jeśli chcesz również uzyskać dane wyjściowe śledzenia synchronicznych operacji wejścia/wyjścia w trybie obserwowania.

## Tryb obserwowania Gateway

```bash
pnpm gateway:watch
```

Domyślnie uruchamia lub ponownie uruchamia to sesję tmux o nazwie `openclaw-gateway-watch-<profile>` (na przykład `openclaw-gateway-watch-main`), z sufiksem portu, takim jak `openclaw-gateway-watch-dev-19001`, dodawanym tylko wtedy, gdy `OPENCLAW_GATEWAY_PORT` różni się od domyślnego portu `18789`. Polecenie automatycznie dołącza sesję w terminalach interaktywnych; powłoki nieinteraktywne, CI i wywołania wykonawcze agentów pozostają odłączone i zamiast tego wyświetlają instrukcje dołączenia:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia bezpośrednio obserwatora:

```bash
node scripts/watch-node.mjs gateway --force
```

Przed obserwowaniem tego samego portu zatrzymaj zainstalowaną usługę Gateway:

```bash
pnpm openclaw gateway stop
```

Opcja `--force` obserwatora usuwa bieżący proces nasłuchujący, ale nie wyłącza nadzorowanej usługi. W przeciwnym razie usługa launchd, systemd lub Scheduled Task może uruchomić się ponownie i zastąpić obserwowany Gateway.

Tryb pierwszoplanowy bez tmux:

```bash
pnpm gateway:watch:raw
# lub
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Zachowaj zarządzanie przez tmux, ale wyłącz automatyczne dołączanie:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profiluj czas CPU obserwowanego Gateway podczas debugowania newralgicznych miejsc uruchamiania lub działania:

```bash
pnpm gateway:watch --benchmark
```

Skrypt opakowujący obserwatora przetwarza `--benchmark` przed wywołaniem Gateway i zapisuje jeden plik V8 `.cpuprofile` po każdym zakończeniu procesu potomnego Gateway w katalogu `.artifacts/gateway-watch-profiles/`. Zatrzymaj lub uruchom ponownie obserwowany Gateway, aby zapisać bieżący profil, a następnie otwórz go za pomocą Chrome DevTools lub Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: zapisuje profile w innym miejscu.
- `--benchmark-no-force`: pomija domyślne zwalnianie portu za pomocą `--force` i natychmiast kończy działanie błędem, jeśli port Gateway jest już używany.

Tryb pomiaru wydajności domyślnie wycisza nadmiarowe komunikaty śledzenia synchronicznych operacji wejścia/wyjścia. Ustaw `OPENCLAW_TRACE_SYNC_IO=1` razem z `--benchmark`, aby uzyskać zarówno profile CPU, jak i ślady stosu synchronicznych operacji wejścia/wyjścia; w trybie pomiaru wydajności te bloki śledzenia są zapisywane w pliku `gateway-watch-output.log` w katalogu pomiaru wydajności (i odfiltrowywane z panelu terminala), podczas gdy zwykłe dzienniki Gateway pozostają widoczne.

Skrypt opakowujący tmux przekazuje do panelu typowe, niepoufne selektory środowiska uruchomieniowego, w tym `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Dane uwierzytelniające dostawcy umieść w zwykłym profilu lub konfiguracji albo użyj bezpośredniego trybu pierwszoplanowego dla jednorazowych, tymczasowych sekretów.

Jeśli obserwowany Gateway zakończy działanie podczas uruchamiania, obserwator jednokrotnie uruchomi `openclaw doctor --fix --non-interactive`, a następnie ponownie uruchomi proces potomny Gateway. Ustaw `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, aby zobaczyć pierwotny błąd uruchamiania bez przeznaczonego wyłącznie do programowania etapu naprawy.

Zarządzany panel tmux domyślnie wyświetla kolorowe dzienniki Gateway; aby wyłączyć dane wyjściowe ANSI, ustaw `FORCE_COLOR=0` podczas uruchamiania `pnpm gateway:watch`.

Obserwator uruchamia się ponownie po zmianach w plikach istotnych dla kompilacji w katalogu `src/`, plikach źródłowych rozszerzeń, metadanych rozszerzeń w plikach `package.json` i `openclaw.plugin.json`, a także plikach `tsconfig.json`, `package.json` i `tsdown.config.ts`. Zmiany metadanych rozszerzeń ponownie uruchamiają Gateway bez wymuszania ponownej kompilacji; zmiany kodu źródłowego i konfiguracji nadal najpierw ponownie kompilują katalog `dist`.

Dodaj flagi CLI Gateway po `gateway:watch`, a zostaną przekazane przy każdym ponownym uruchomieniu. Ponowne wykonanie tego samego polecenia obserwowania odtwarza panel tmux o podanej nazwie; bezpośredni obserwator używa blokady pojedynczego obserwatora, dzięki czemu zduplikowane procesy nadrzędne obserwatora są zastępowane zamiast się kumulować.

## Profil deweloperski i deweloperski Gateway (--dev)

Dwie **oddzielne** flagi `--dev`:

- **Globalna flaga `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i ustawia domyślny port Gateway na `19001` (porty pochodne są odpowiednio przesuwane).
- **`gateway --dev`:** nakazuje Gateway automatycznie utworzyć domyślną konfigurację i przestrzeń roboczą, jeśli ich brakuje (oraz pominąć inicjalizację).

Zalecany przebieg (profil deweloperski i inicjalizacja deweloperska):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Bez instalacji globalnej uruchom CLI za pomocą `pnpm openclaw ...`.

Działanie:

1. **Izolacja profilu** (globalna flaga `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (porty przeglądarki i obszaru roboczego są odpowiednio przesuwane)

2. **Inicjalizacja deweloperska** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, powiązanie z local loopback).
   - Ustawia `agents.defaults.workspace` na deweloperską przestrzeń roboczą oraz `agents.defaults.skipBootstrap=true`.
   - Tworzy początkowe pliki przestrzeni roboczej, jeśli ich brakuje: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Domyślna tożsamość: **C3-PO** (droid protokolarny).
   - `pnpm gateway:dev` ustawia także `OPENCLAW_SKIP_CHANNELS=1`, aby pominąć dostawców kanałów.

Przebieg resetowania (czysty start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywana przez niektóre moduły uruchamiające. Jeśli musisz podać ją jawnie, użyj zmiennej środowiskowej:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` usuwa konfigurację, dane uwierzytelniające i sesje oraz czyści deweloperską przestrzeń roboczą (przenosi ją do kosza, a nie usuwa), po czym ponownie tworzy domyślne środowisko deweloperskie.

<Tip>
Jeśli niedeweloperski Gateway już działa (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Rejestrowanie nieprzetworzonego strumienia

OpenClaw może rejestrować **nieprzetworzony strumień asystenta** przed jakimkolwiek filtrowaniem lub formatowaniem. Jest to najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako przyrostowe fragmenty zwykłego tekstu, czy jako oddzielne bloki rozumowania.

Włącz za pomocą CLI:

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

Plik domyślny: `~/.openclaw/logs/raw-stream.jsonl`

## Uwagi dotyczące bezpieczeństwa

- Dzienniki nieprzetworzonego strumienia mogą zawierać pełne prompty, dane wyjściowe narzędzi i dane użytkowników.
- Przechowuj dzienniki lokalnie i usuń je po zakończeniu debugowania.
- Jeśli udostępniasz dzienniki, najpierw usuń z nich sekrety i dane osobowe.

## Debugowanie w VSCode

Mapy źródeł są wymagane, ponieważ kompilacja dodaje skróty do nazw wygenerowanych plików. Dołączony plik `launch.json` wskazuje usługę Gateway:

1. **Rebuild and Debug Gateway** — usuwa katalog `/dist` i ponownie kompiluje projekt z włączonym debugowaniem przed uruchomieniem Gateway.
2. **Debug Gateway** — debugguje istniejącą kompilację bez modyfikowania katalogu `/dist`.

### Konfiguracja

1. Otwórz **Run and Debug** (na pasku aktywności lub za pomocą `Ctrl`+`Shift`+`D`).
2. Wybierz **Rebuild and Debug Gateway** i naciśnij **Start Debugging**.

Aby zamiast tego ręcznie zarządzać cyklem kompilowania i debugowania:

1. Włącz mapy źródeł w terminalu:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Ponownie skompiluj: `pnpm clean:dist && pnpm build`
3. Wybierz **Debug Gateway** i naciśnij **Start Debugging**.

Ustaw punkty przerwania w plikach TypeScript w katalogu `src/`; debuger mapuje je na skompilowany kod JavaScript za pomocą map źródeł.

### Uwagi

- **Rebuild and Debug Gateway** usuwa katalog `/dist` i przy każdym uruchomieniu wykonuje pełne `pnpm build` z mapami źródeł.
- **Debug Gateway** może być uruchamiany i zatrzymywany bez wpływu na katalog `/dist`, ale cyklem kompilacji zarządzasz w osobnym terminalu.
- Zmodyfikuj argumenty `args` w pliku `launch.json`, aby debugować inne podpolecenia CLI.
- Aby używać zbudowanego CLI do innych zadań (na przykład `dashboard --no-open`, jeśli sesja debugowania tworzy nowy token uwierzytelniający), uruchom go w innym terminalu: `node ./openclaw.mjs` lub za pomocą aliasu, takiego jak `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Powiązane materiały

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [Często zadawane pytania](/pl/help/faq)
