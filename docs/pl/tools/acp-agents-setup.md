---
read_when:
    - Instalowanie lub konfigurowanie mechanizmu acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostu MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harnessa acpx, konfiguracja Plugin, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-05-10T19:55:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Omówienie, runbook operatora i koncepcje znajdziesz w [agentach ACP](/pl/tools/acp-agents).

Poniższe sekcje obejmują konfigurację harness acpx, konfigurację Plugin dla mostów MCP oraz konfigurację uprawnień.

Używaj tej strony tylko wtedy, gdy konfigurujesz ścieżkę ACP/acpx. Dla natywnej konfiguracji środowiska uruchomieniowego Codex
app-server użyj [Codex harness](/pl/plugins/codex-harness). Dla
kluczy API OpenAI lub konfiguracji dostawcy modeli Codex OAuth użyj
[OpenAI](/pl/providers/openai).

Codex ma dwie ścieżki OpenClaw:

| Ścieżka                   | Konfiguracja/polecenie                                  | Strona konfiguracji                    |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Natywny Codex app-server  | `/codex ...`, odwołania agentów `openai/gpt-*`          | [Codex harness](/pl/plugins/codex-harness) |
| Jawny adapter Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ta strona                              |

Preferuj natywną ścieżkę, chyba że wyraźnie potrzebujesz działania ACP/acpx.

## Obsługa harness acpx (aktualnie)

Aktualne wbudowane aliasy harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też wskazywać dowolne adaptery przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (nie zwykłą ścieżką OpenClaw `agentId`).

Sterowanie modelem zależy od możliwości adaptera. Odwołania do modeli Codex ACP są
normalizowane przez OpenClaw przed uruchomieniem. Inne harness wymagają ACP `models` oraz
obsługi `session/set_model`; jeśli harness nie udostępnia ani tej możliwości ACP,
ani własnej flagi modelu przy uruchomieniu, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Bazowa konfiguracja Core ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązania wątków zależy od adaptera kanału. Przykład dla Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Powiązania bieżącej konwersacji nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji oraz adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Plugin dla backendu acpx

Instalacje pakietowe używają oficjalnego runtime Plugin `@openclaw/acpx` dla ACP.
Zainstaluj i włącz go przed użyciem sesji harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą też używać lokalnego Plugin z workspace po `pnpm install`.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, odmówiono go przez `plugins.allow` / `plugins.deny` albo chcesz
wrócić do pakietowego Plugin, użyj jawnej ścieżki pakietu:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja workspace podczas prac rozwojowych:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie Plugin `acpx` sonduje osadzony backend ACP podczas uruchamiania Gateway
i czeka na tę sondę przed sygnałem `ready` gateway. Ustaw
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0`, aby pominąć sondę przy uruchomieniu i rejestrować
backend leniwie. Uruchom `/acp doctor`, aby wykonać jawną sondę na żądanie.

Nadpisz polecenie lub wersję w konfiguracji Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną (rozwiązywaną z workspace OpenClaw) lub nazwę polecenia.
- `expectedVersion: "any"` wyłącza ścisłe dopasowywanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla Plugin.

Nadpisz pojedyncze polecenie agenta ACP przy użyciu ustrukturyzowanych argumentów, gdy ścieżka
lub wartość flagi powinna pozostać jednym tokenem argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` to plik wykonywalny lub istniejący ciąg polecenia dla tego agenta ACP.
- `agents.<id>.args` jest opcjonalne. Każdy element tablicy jest cytowany dla powłoki, zanim OpenClaw przekaże go przez bieżący rejestr ciągów poleceń acpx.

Zobacz [Plugins](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(pliki binarne specyficzne dla platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się
normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP dla narzędzi Plugin

Domyślnie sesje ACPX **nie** udostępniają narzędzi zarejestrowanych przez Plugin OpenClaw
do harness ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, wywoływali zainstalowane
narzędzia OpenClaw Plugin, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu
  sesji ACPX.
- Udostępnia narzędzia Plugin już zarejestrowane przez zainstalowane i włączone OpenClaw
  plugins.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harness ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi Plugin już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym plugins na wykonywanie kodu
  w samym OpenClaw.
- Przejrzyj zainstalowane plugins przed włączeniem tej opcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi Plugin jest
dodatkową wygodą wymagającą zgody, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Most MCP dla narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez
MCP. Włącz oddzielny most narzędzi core, gdy agent ACP potrzebuje wybranych
wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu
  sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Utrzymuje udostępnianie narzędzi core jako jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu runtime

Plugin `acpx` domyślnie ustawia limit czasu tur osadzonego runtime na 120 sekund.
Daje to wolniejszym harness, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie
uruchamiania i inicjalizacji ACP. Nadpisz to, jeśli host potrzebuje innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie gateway.

### Konfiguracja agenta sondy stanu

Gdy `/acp doctor` lub sonda przy uruchomieniu sprawdza backend, dołączony Plugin `acpx`
sonduje jednego agenta harness. Jeśli ustawiono `acp.allowedAgents`, domyślnie jest to
pierwszy dozwolony agent; w przeciwnym razie domyślnie jest to `codex`. Jeśli wdrożenie
wymaga innego agenta ACP do kontroli stanu, ustaw agenta sondy jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania lub odmawiania monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji sterujące obsługą uprawnień:

Te uprawnienia harness ACPX są oddzielne od zatwierdzeń wykonywania OpenClaw i oddzielne od flag obejścia dostawców backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` jest przełącznikiem awaryjnym na poziomie harness dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harness może wykonywać bez monitowania.

| Wartość         | Zachowanie                                               |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdzaj wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdzaj tylko odczyty; zapisy i exec wymagają monitów. |
| `deny-all`      | Odmawiaj wszystkich monitów o uprawnienia.               |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy monit o uprawnienia zostałby pokazany, ale nie jest dostępne interaktywne TTY (co zawsze ma miejsce dla sesji ACP).

| Wartość | Zachowanie                                                       |
| ------- | ---------------------------------------------------------------- |
| `fail`  | Przerwij sesję z `AcpRuntimeError`. **(domyślne)**               |
| `deny`  | Po cichu odmów uprawnienia i kontynuuj (łagodna degradacja).     |

### Konfiguracja

Ustaw przez konfigurację Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

<Warning>
OpenClaw domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła monit o uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast kończyć awarią.
</Warning>

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — omówienie, runbook operatora, koncepcje
- [Sub-agenci](/pl/tools/subagents)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
