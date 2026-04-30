---
read_when:
    - Należy sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie obserwowania zmian podczas pracy iteracyjnej
    - Potrzebujesz powtarzalnego procesu debugowania
summary: 'Narzędzia debugowania: tryb obserwacji, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-04-30T09:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania dla wyjścia strumieniowego, szczególnie gdy dostawca miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie wykonywania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w czasie wykonywania** (pamięć, nie dysk).
`/debug` jest domyślnie wyłączone; włącz za pomocą `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączać nieoczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śledzenia sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do Plugin wiersze śledzenia/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Użyj `/trace` do diagnostyki Plugin, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` dla zwykłego szczegółowego wyjścia statusu/narzędzi i nadal używaj
`/debug` dla nadpisań konfiguracji tylko w czasie wykonywania.

## Śledzenie cyklu życia Plugin

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia Plugin wydają się wolne
i potrzebujesz wbudowanego podziału na fazy dla metadanych Plugin, odkrywania, rejestru,
lustra runtime, mutacji konfiguracji i odświeżania. Śledzenie jest dobrowolne i zapisuje
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
mierzy również narzut uruchamiacza źródeł.

## Tymczasowy pomiar czasu debugowania CLI

OpenClaw przechowuje `src/cli/debug-timing.ts` jako mały pomocnik do lokalnego
badania. Celowo nie jest domyślnie podłączony do startu CLI, routingu poleceń
ani żadnego polecenia. Używaj go tylko podczas debugowania wolnego polecenia, a następnie
usuń importy i zakresy przed wdrożeniem zmiany zachowania.

Użyj tego, gdy polecenie jest wolne i potrzebujesz szybkiego podziału faz przed
podjęciem decyzji, czy użyć profilera CPU, czy naprawić konkretny podsystem.

### Dodaj tymczasowe zakresy

Dodaj pomocnik w pobliżu badanego kodu. Na przykład podczas debugowania
`openclaw models list` tymczasowa poprawka w
`src/commands/models/list.list-command.ts` może wyglądać tak:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Wytyczne:

- Poprzedzaj tymczasowe nazwy faz prefiksem `debug:`.
- Dodaj tylko kilka zakresów wokół podejrzanych wolnych sekcji.
- Preferuj szerokie fazy, takie jak `registry`, `auth_store` lub `rows`, zamiast nazw pomocników.
- Używaj `time()` do pracy synchronicznej i `timeAsync()` do obietnic.
- Utrzymuj stdout czysty. Pomocnik zapisuje do stderr, więc wyjście JSON polecenia pozostaje
  parsowalne.
- Usuń tymczasowe importy i zakresy przed otwarciem finalnego PR z poprawką.
- Dołącz wyjście pomiaru czasu lub krótkie podsumowanie w zgłoszeniu albo PR, które wyjaśnia
  optymalizację.

### Uruchom z czytelnym wyjściem

Tryb czytelny jest najlepszy do debugowania na żywo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Przykładowe wyjście z tymczasowego badania `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Ustalenia z tego wyjścia:

| Faza                                     |       Czas | Co to oznacza                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Ładowanie magazynu profili uwierzytelniania to największy koszt i należy zbadać je najpierw.            |
| `debug:models:list:ensure_models_json`   |       5.0s | Synchronizacja `models.json` jest wystarczająco kosztowna, aby sprawdzić buforowanie lub warunki pomijania. |
| `debug:models:list:load_model_registry`  |       5.9s | Budowa rejestru i praca nad dostępnością dostawcy również są istotnymi kosztami.                        |
| `debug:models:list:read_registry_models` |       2.4s | Odczyt wszystkich modeli rejestru nie jest darmowy i może mieć znaczenie dla `--all`.                   |
| fazy dodawania wierszy                   | 3.2s łącznie | Zbudowanie pięciu wyświetlanych wierszy nadal zajmuje kilka sekund, więc ścieżka filtrowania wymaga bliższego sprawdzenia. |
| `debug:models:list:print_model_table`    |        0ms | Renderowanie nie jest wąskim gardłem.                                                                   |

Te ustalenia wystarczają, aby pokierować następną poprawką bez utrzymywania kodu pomiaru czasu w
ścieżkach produkcyjnych.

### Uruchom z wyjściem JSON

Użyj trybu JSON, gdy chcesz zapisać lub porównać dane pomiaru czasu:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Każdy wiersz stderr jest jednym obiektem JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Posprzątaj przed wdrożeniem

Przed otwarciem finalnego PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Polecenie nie powinno zwrócić żadnych tymczasowych miejsc wywołań instrumentacji, chyba że PR
jawnie dodaje stałą powierzchnię diagnostyczną. W przypadku zwykłych poprawek wydajności
zostaw tylko zmianę zachowania, testy i krótką notatkę z dowodami z pomiaru czasu.

Dla głębszych hotspotów CPU użyj profilowania Node (`--cpu-prof`) lub zewnętrznego
profilera zamiast dodawać więcej wrapperów pomiaru czasu.

## Tryb obserwowania Gateway

Do szybkiej iteracji uruchom gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant zależny od profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania exec agentów pozostają odłączone i zamiast tego wypisują
instrukcje dołączenia. Dołącz ręcznie, gdy jest to potrzebne:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux uruchamia surowy obserwator:

```bash
node scripts/watch-node.mjs gateway --force
```

Użyj trybu pierwszoplanowego, gdy tmux nie jest pożądany:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Wyłącz automatyczne dołączanie, zachowując zarządzanie tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
poświadczenia dostawców w normalnym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.

Obserwator restartuje się przy plikach istotnych dla budowania pod `src/`, plikach źródłowych rozszerzeń,
metadanych `package.json` i `openclaw.plugin.json` rozszerzeń, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych rozszerzeń restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia obserwowania odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc zduplikowane procesy nadrzędne obserwatora
są zastępowane zamiast się piętrzyć.

## Profil deweloperski + deweloperski Gateway (--dev)

Użyj profilu deweloperskiego, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan pod `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (porty pochodne przesuwają się wraz z nim).
- **`gateway --dev`: mówi Gateway, aby automatycznie utworzył domyślną konfigurację +
  workspace** w razie braku (i pominął BOOTSTRAP.md).

Zalecany przepływ (profil deweloperski + bootstrap deweloperski):

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

2. **Bootstrap deweloperski** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, bind loopback).
   - Ustawia `agent.workspace` na deweloperski workspace.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Zasila pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija dostawców kanałów w trybie deweloperskim (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetowania (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` jest **globalną** flagą profilu i bywa przechwytywana przez niektóre uruchamiacze. Jeśli musisz zapisać to jawnie, użyj formy ze zmienną środowiskową:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, poświadczenia, sesje i deweloperski workspace (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację deweloperską.

<Tip>
Jeśli gateway niedeweloperski już działa (launchd lub systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Surowe logowanie strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako zwykłe delty tekstowe
(czy jako osobne bloki myślenia).

Włącz to przez CLI:

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

Plik domyślny:

`~/.openclaw/logs/raw-stream.jsonl`

## Logowanie surowych fragmentów (pi-mono)

Aby przechwytywać **surowe fragmenty zgodne z OpenAI** przed ich sparsowaniem do bloków,
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

> Uwaga: jest emitowane tylko przez procesy używające dostawcy
> `openai-completions` pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, dane wyjściowe narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuń je po zakończeniu debugowania.
- Jeśli udostępniasz logi, najpierw usuń z nich sekrety i dane osobowe.

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
