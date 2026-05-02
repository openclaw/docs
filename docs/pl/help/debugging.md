---
read_when:
    - Należy sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchamiać Gateway w trybie obserwowania podczas pracy iteracyjnej
    - Potrzebujesz powtarzalnego przepływu pracy do debugowania
summary: 'Narzędzia do debugowania: tryb obserwacji, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-02T09:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania dla wyjścia strumieniowego, zwłaszcza gdy dostawca miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie wykonywania

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w czasie wykonywania** (pamięć, nie dysk).
`/debug` jest domyślnie wyłączone; włącz przez `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączyć mało oczywiste ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Wyjście śladu sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do pluginu wiersze śledzenia/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Użyj `/trace` do diagnostyki pluginu, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłego szczegółowego statusu/wyjścia narzędzi i nadal używaj
`/debug` do nadpisań konfiguracji tylko w czasie wykonywania.

## Ślad cyklu życia Plugin

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia pluginu wydają się powolne
i potrzebujesz wbudowanego podziału faz dla metadanych pluginu, wykrywania, rejestru,
lustra środowiska wykonawczego, mutacji konfiguracji i odświeżania. Ślad jest opcjonalny i zapisuje
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

Użyj tego do badania cyklu życia pluginu, zanim sięgniesz po profiler CPU.
Jeśli polecenie działa z kopii źródłowej, lepiej zmierzyć zbudowane środowisko wykonawcze
przez `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy też narzut uruchamiania ze źródeł.

## Tymczasowe pomiary debugowania CLI

OpenClaw utrzymuje `src/cli/debug-timing.ts` jako mały pomocnik do lokalnego
badania. Celowo nie jest domyślnie podłączony do uruchamiania CLI, routingu poleceń
ani żadnego polecenia. Używaj go tylko podczas debugowania wolnego polecenia, a potem
usuń import i zakresy przed wdrożeniem zmiany zachowania.

Użyj tego, gdy polecenie jest wolne i potrzebujesz szybkiego podziału faz, zanim
zdecydujesz, czy użyć profilera CPU, czy naprawić konkretny podsystem.

### Dodaj tymczasowe zakresy

Dodaj pomocnik w pobliżu kodu, który badasz. Na przykład podczas debugowania
`openclaw models list` tymczasowa łatka w
`src/commands/models/list.list-command.ts` mogłaby wyglądać tak:

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
- Dodaj tylko kilka zakresów wokół podejrzewanych wolnych sekcji.
- Preferuj szerokie fazy, takie jak `registry`, `auth_store` lub `rows`, zamiast nazw
  pomocników.
- Używaj `time()` do pracy synchronicznej i `timeAsync()` do obietnic.
- Utrzymuj stdout w czystości. Pomocnik zapisuje do stderr, więc wyjście JSON polecenia pozostaje
  możliwe do parsowania.
- Usuń tymczasowe importy i zakresy przed otwarciem końcowego PR z poprawką.
- Dołącz wyjście pomiarów lub krótkie podsumowanie w zgłoszeniu albo PR, które wyjaśnia
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

Wnioski z tego wyjścia:

| Faza                                     |        Czas | Co to oznacza                                                                                           |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | Wczytywanie magazynu profili uwierzytelniania jest największym kosztem i należy zbadać je jako pierwsze. |
| `debug:models:list:ensure_models_json`   |        5.0s | Synchronizacja `models.json` jest wystarczająco kosztowna, aby sprawdzić buforowanie lub warunki pomijania. |
| `debug:models:list:load_model_registry`  |        5.9s | Budowanie rejestru i sprawdzanie dostępności dostawcy to także istotne koszty.                          |
| `debug:models:list:read_registry_models` |        2.4s | Odczyt wszystkich modeli rejestru nie jest darmowy i może mieć znaczenie dla `--all`.                    |
| fazy dodawania wierszy                   | łącznie 3.2s | Budowanie pięciu wyświetlanych wierszy nadal zajmuje kilka sekund, więc ścieżka filtrowania wymaga bliższego przyjrzenia się. |
| `debug:models:list:print_model_table`    |         0ms | Renderowanie nie jest wąskim gardłem.                                                                   |

Te wnioski wystarczają, aby poprowadzić następną łatkę bez pozostawiania kodu pomiarów w
ścieżkach produkcyjnych.

### Uruchom z wyjściem JSON

Użyj trybu JSON, gdy chcesz zapisać lub porównać dane pomiarowe:

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

Przed otwarciem końcowego PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Polecenie nie powinno zwrócić żadnych tymczasowych miejsc wywołań instrumentacji, chyba że PR
jawnie dodaje stałą powierzchnię diagnostyczną. Przy zwykłych poprawkach wydajności
zostaw tylko zmianę zachowania, testy i krótką notatkę z dowodami pomiarowymi.

W przypadku głębszych hotspotów CPU użyj profilowania Node (`--cpu-prof`) albo zewnętrznego
profilera zamiast dodawać więcej opakowań pomiarowych.

## Tryb obserwowania Gateway

Do szybkiej iteracji uruchom Gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to lub restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant zależny od profilu/portu, taki jak
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

Opakowanie tmux przenosi do panelu typowe nietajne selektory środowiska wykonawczego, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść
dane uwierzytelniające dostawców w zwykłym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.
Zarządzany panel tmux domyślnie używa też kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` przy uruchamianiu `pnpm gateway:watch`, aby wyłączyć wyjście ANSI.

Obserwator restartuje się przy plikach istotnych dla budowania w `src/`, plikach źródłowych pluginów,
metadanych `package.json` i `openclaw.plugin.json` pluginów, `tsconfig.json`,
`package.json` i `tsdown.config.ts`. Zmiany metadanych pluginów restartują
Gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI Gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia obserwowania odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc zduplikowani rodzice obserwatora
są zastępowani zamiast się piętrzyć.

## Profil dev + Gateway dev (--dev)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port Gateway na `19001` (porty pochodne przesuwają się razem z nim).
- **`gateway --dev`: mówi Gateway, aby automatycznie utworzył domyślną konfigurację +
  workspace** gdy ich brakuje (i pominął BOOTSTRAP.md).

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
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, wiązanie loopback).
   - Ustawia `agent.workspace` na workspace dev.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Zasila brakujące pliki workspace:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija dostawców kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

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

`--reset` czyści konfigurację, dane uwierzytelniające, sesje i workspace dev (używając
`trash`, nie `rm`), a potem odtwarza domyślną konfigurację dev.

<Tip>
Jeśli brama inna niż dev już działa (launchd lub systemd), najpierw ją zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Surowe logowanie strumienia (OpenClaw)

OpenClaw może rejestrować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako delty zwykłego tekstu
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

Domyślny plik:

`~/.openclaw/logs/raw-stream.jsonl`

## Rejestrowanie surowych fragmentów (pi-mono)

Aby przechwycić **surowe fragmenty zgodne z OpenAI**, zanim zostaną sparsowane do bloków,
pi-mono udostępnia osobny rejestrator:

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
> `openai-completions` pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Dzienniki surowego strumienia mogą zawierać pełne prompty, wyniki narzędzi i dane użytkownika.
- Przechowuj dzienniki lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz dzienniki, najpierw usuń sekrety i dane osobowe.

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [FAQ](/pl/help/faq)
