---
read_when:
    - Musisz sprawdzić surowe wyjście modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie watch podczas iteracji
    - Potrzebujesz powtarzalnego workflow debugowania
summary: 'Narzędzia do debugowania: tryb watch, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-04-05T13:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Debugowanie

Ta strona opisuje pomocniki debugowania dla strumieniowanego wyjścia, zwłaszcza gdy
dostawca miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania środowiska uruchomieniowego

Użyj `/debug` na czacie, aby ustawić nadpisania config **tylko dla środowiska uruchomieniowego** (w pamięci, nie na dysku).
`/debug` jest domyślnie wyłączone; włącz je przez `commands.debug: true`.
Jest to przydatne, gdy musisz przełączać rzadko używane ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i przywraca config z dysku.

## Tryb watch Gateway

Aby szybko iterować, uruchom gateway pod kontrolą obserwatora plików:

```bash
pnpm gateway:watch
```

Mapuje się to na:

```bash
node scripts/watch-node.mjs gateway --force
```

Obserwator restartuje się przy zmianach plików istotnych dla buildu w `src/`, plików źródłowych rozszerzeń,
metadanych rozszerzeń `package.json` i `openclaw.plugin.json`, `tsconfig.json`,
`package.json` oraz `tsdown.config.ts`. Zmiany metadanych rozszerzeń restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i config nadal najpierw
przebudowują `dist`.

Dodaj dowolne flagi CLI gateway po `gateway:watch`, a będą przekazywane przy
każdym restarcie.

## Profil deweloperski + deweloperski gateway (`--dev`)

Użyj profilu deweloperskiego, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalna `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (porty pochodne przesuwają się wraz z nim).
- **`gateway --dev`: mówi Gateway, aby automatycznie utworzył domyślny config +
  workspace**, jeśli ich brakuje (i pominął `BOOTSTRAP.md`).

Zalecany przepływ (profil deweloperski + bootstrap deweloperski):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jeśli nie masz jeszcze globalnej instalacji, uruchamiaj CLI przez `pnpm openclaw ...`.

Co to robi:

1. **Izolacja profilu** (globalne `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (porty browser/canvas odpowiednio się przesuwają)

2. **Bootstrap deweloperski** (`gateway --dev`)
   - Zapisuje minimalny config, jeśli go brakuje (`gateway.mode=local`, bind loopback).
   - Ustawia `agent.workspace` na deweloperski workspace.
   - Ustawia `agent.skipBootstrap=true` (bez `BOOTSTRAP.md`).
   - Tworzy początkowe pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija dostawców kanałów w trybie deweloperskim (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetu (świeży start):

```bash
pnpm gateway:dev:reset
```

Uwaga: `--dev` to **globalna** flaga profilu i bywa przechwytywana przez niektóre wrappery.
Jeśli musisz podać ją jawnie, użyj postaci z env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` czyści config, poświadczenia, sesje i deweloperski workspace (przez
`trash`, nie `rm`), a następnie odtwarza domyślną konfigurację deweloperską.

Wskazówka: jeśli działa już gateway inny niż deweloperski (launchd/systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

## Logowanie surowego strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, aby sprawdzić, czy rozumowanie przychodzi jako zwykłe delty tekstowe
(lub jako osobne bloki myślenia).

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

## Logowanie surowych chunków (pi-mono)

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

> Uwaga: jest to emitowane tylko przez procesy używające dostawcy
> `openai-completions` z pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Trzymaj logi lokalnie i usuwaj je po zakończeniu debugowania.
- Jeśli udostępniasz logi, najpierw usuń z nich sekrety i dane osobowe.
