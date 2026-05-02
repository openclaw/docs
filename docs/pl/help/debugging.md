---
read_when:
    - Należy sprawdzić surowe dane wyjściowe modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie obserwowania podczas iteracyjnego wprowadzania zmian
    - Potrzebujesz powtarzalnego procesu debugowania
summary: 'Narzędzia debugowania: tryb obserwowania, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-05-02T20:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Pomocniki debugowania danych wyjściowych przesyłanych strumieniowo, szczególnie gdy provider miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w czasie działania

Użyj `/debug` w czacie, aby ustawić nadpisania konfiguracji **tylko w czasie działania** (pamięć, nie dysk).
`/debug` jest domyślnie wyłączone; włącz za pomocą `commands.debug: true`.
Jest to przydatne, gdy trzeba przełączać mało znane ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i wraca do konfiguracji zapisanej na dysku.

## Dane wyjściowe śledzenia sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do pluginów wiersze śledzenia/debugowania w jednej sesji
bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Użyj `/trace` do diagnostyki Plugin, takiej jak podsumowania debugowania Active Memory.
Nadal używaj `/verbose` do zwykłych szczegółowych danych wyjściowych statusu/narzędzi oraz
`/debug` do nadpisań konfiguracji tylko w czasie działania.

## Śledzenie cyklu życia Plugin

Użyj `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, gdy polecenia cyklu życia Plugin wydają się wolne
i potrzebujesz wbudowanego rozbicia faz dla metadanych Plugin, wykrywania, rejestru,
lustra runtime, mutacji konfiguracji i odświeżania. Śledzenie jest opcjonalne i zapisuje
do stderr, więc dane wyjściowe poleceń JSON pozostają parsowalne.

Przykład:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Przykładowe dane wyjściowe:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Użyj tego do badania cyklu życia Plugin, zanim sięgniesz po profiler CPU.
Jeśli polecenie działa z checkoutu źródłowego, lepiej mierzyć zbudowany
runtime za pomocą `node dist/entry.js ...` po `pnpm build`; `pnpm openclaw ...`
mierzy również narzut runnera źródeł.

## Tymczasowe pomiary czasu debugowania CLI

OpenClaw utrzymuje `src/cli/debug-timing.ts` jako mały pomocnik do lokalnego
badania. Celowo nie jest domyślnie podłączony do uruchamiania CLI, routingu poleceń
ani żadnego polecenia. Używaj go tylko podczas debugowania wolnego polecenia, a następnie
usuń import i zakresy przed wprowadzeniem zmiany zachowania.

Użyj tego, gdy polecenie jest wolne i potrzebujesz szybkiego rozbicia faz przed
podjęciem decyzji, czy użyć profilera CPU, czy naprawić konkretny podsystem.

### Dodawanie tymczasowych zakresów

Dodaj pomocnik w pobliżu kodu, który badasz. Na przykład podczas debugowania
`openclaw models list` tymczasowa poprawka w
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
- Utrzymuj stdout w czystości. Pomocnik zapisuje do stderr, więc dane wyjściowe JSON polecenia pozostają
  parsowalne.
- Usuń tymczasowe importy i zakresy przed otwarciem końcowego PR z poprawką.
- Dołącz dane wyjściowe pomiarów czasu albo krótkie podsumowanie w issue lub PR, które wyjaśnia
  optymalizację.

### Uruchamianie z czytelnymi danymi wyjściowymi

Tryb czytelny jest najlepszy do debugowania na żywo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Przykładowe dane wyjściowe z tymczasowego badania `models list`:

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

Wnioski z tych danych wyjściowych:

| Faza                                     |        Czas | Co to oznacza                                                                                               |
| ---------------------------------------- | ----------: | ----------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | Wczytywanie magazynu profili uwierzytelniania jest największym kosztem i należy zbadać je jako pierwsze.    |
| `debug:models:list:ensure_models_json`   |        5.0s | Synchronizacja `models.json` jest na tyle kosztowna, że warto sprawdzić warunki cache lub pomijania.         |
| `debug:models:list:load_model_registry`  |        5.9s | Budowanie rejestru i sprawdzanie dostępności providerów również są istotnymi kosztami.                      |
| `debug:models:list:read_registry_models` |        2.4s | Odczyt wszystkich modeli rejestru nie jest darmowy i może mieć znaczenie dla `--all`.                       |
| fazy dołączania wierszy                  | 3.2s łącznie | Zbudowanie pięciu wyświetlanych wierszy nadal zajmuje kilka sekund, więc ścieżka filtrowania wymaga bliższego sprawdzenia. |
| `debug:models:list:print_model_table`    |         0ms | Renderowanie nie jest wąskim gardłem.                                                                       |

Te wnioski wystarczą, aby pokierować następną poprawką bez pozostawiania kodu pomiarów czasu
w ścieżkach produkcyjnych.

### Uruchamianie z danymi wyjściowymi JSON

Użyj trybu JSON, gdy chcesz zapisać lub porównać dane pomiarów czasu:

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

### Sprzątanie przed lądowaniem

Przed otwarciem końcowego PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Polecenie nie powinno zwrócić żadnych tymczasowych miejsc wywołań instrumentacji, chyba że PR
jawnie dodaje stałą powierzchnię diagnostyczną. W przypadku zwykłych poprawek wydajności
zostaw tylko zmianę zachowania, testy i krótką notatkę z dowodami z pomiarów czasu.

W przypadku głębszych hotspotów CPU użyj profilowania Node (`--cpu-prof`) albo zewnętrznego
profilera zamiast dodawać więcej wrapperów pomiaru czasu.

## Tryb obserwowania Gateway

Do szybkiej iteracji uruchom Gateway pod obserwatorem plików:

```bash
pnpm gateway:watch
```

Domyślnie uruchamia to albo restartuje sesję tmux o nazwie
`openclaw-gateway-watch-main` (albo wariant zależny od profilu/portu, taki jak
`openclaw-gateway-watch-dev-19001`) i automatycznie dołącza z terminali interaktywnych.
Powłoki nieinteraktywne, CI i wywołania exec agentów pozostają odłączone i zamiast tego drukują
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

Profiluj czas CPU obserwowanego Gateway podczas debugowania hotspotów uruchamiania/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper obserwatora przechwytuje `--benchmark` przed wywołaniem Gateway i zapisuje
po jednym profilu V8 `.cpuprofile` dla każdego zakończenia procesu potomnego Gateway w
`.artifacts/gateway-watch-profiles/`. Zatrzymaj albo zrestartuj obserwowany Gateway, aby
zrzucić bieżący profil, a następnie otwórz go w Chrome DevTools albo Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Użyj `--benchmark-dir <path>`, gdy chcesz zapisywać profile gdzie indziej.

Wrapper tmux przenosi do panelu typowe niesekretne selektory runtime, takie jak
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` i `OPENCLAW_SKIP_CHANNELS`. Umieść poświadczenia
providerów w swoim normalnym profilu/konfiguracji albo użyj surowego trybu pierwszoplanowego
dla jednorazowych sekretów efemerycznych.
Zarządzany panel tmux domyślnie używa też kolorowych logów Gateway dla czytelności;
ustaw `FORCE_COLOR=0` przy uruchamianiu `pnpm gateway:watch`, aby wyłączyć dane wyjściowe ANSI.

Obserwator restartuje się przy plikach istotnych dla buildu w `src/`, plikach źródłowych pluginów,
metadanych `package.json` i `openclaw.plugin.json` pluginów, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych pluginów restartują
Gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal
najpierw przebudowują `dist`.

Dodaj dowolne flagi CLI Gateway po `gateway:watch`, a zostaną przekazane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia obserwatora odtwarza nazwany panel tmux, a
surowy obserwator nadal utrzymuje blokadę pojedynczego obserwatora, więc zduplikowane procesy nadrzędne obserwatora
są zastępowane zamiast się gromadzić.

## Profil dev + dev Gateway (--dev)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port Gateway na `19001` (porty pochodne przesuwają się wraz z nim).
- **`gateway --dev`: nakazuje Gateway automatycznie utworzyć domyślną konfigurację +
  workspace**, gdy ich brakuje (i pominąć BOOTSTRAP.md).

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
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, powiązanie z loopback).
   - Ustawia `agent.workspace` na workspace dev.
   - Ustawia `agent.skipBootstrap=true` (bez BOOTSTRAP.md).
   - Zasiewa pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija providerów kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetowania (świeży start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` to **globalna** flaga profilu i jest przechwytywana przez niektóre mechanizmy uruchamiające. Jeśli musisz zapisać ją jawnie, użyj formy zmiennej środowiskowej:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` czyści konfigurację, dane logowania, sesje i deweloperski obszar roboczy (używając
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację deweloperską.

<Tip>
Jeśli Gateway inny niż deweloperski już działa (`launchd` lub `systemd`), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

</Tip>

## Rejestrowanie surowego strumienia (OpenClaw)

OpenClaw może rejestrować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie dociera jako delty zwykłego tekstu
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

Aby przechwycić **surowe fragmenty zgodne z OpenAI** przed ich przetworzeniem na bloki,
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

- Dzienniki surowego strumienia mogą zawierać pełne prompty, dane wyjściowe narzędzi i dane użytkownika.
- Przechowuj dzienniki lokalnie i usuń je po debugowaniu.
- Jeśli udostępniasz dzienniki, najpierw usuń z nich sekrety i dane osobowe.

## Powiązane

- [Rozwiązywanie problemów](/pl/help/troubleshooting)
- [Najczęściej zadawane pytania](/pl/help/faq)
