---
read_when:
    - Instalowanie lub konfigurowanie środowiska acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostu MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harnessa acpx, konfiguracja Pluginu, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-05-02T10:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Dla omówienia, runbooka operatora i pojęć zobacz [agenty ACP](/pl/tools/acp-agents).

Poniższe sekcje obejmują konfigurację harnessa acpx, konfigurację Plugin dla mostów MCP oraz konfigurację uprawnień.

Używaj tej strony tylko wtedy, gdy konfigurujesz ścieżkę ACP/acpx. Dla natywnej konfiguracji środowiska uruchomieniowego serwera aplikacji Codex użyj [harnessa Codex](/pl/plugins/codex-harness). Dla kluczy OpenAI API lub konfiguracji dostawcy modeli Codex OAuth użyj
[OpenAI](/pl/providers/openai).

Codex ma dwie ścieżki OpenClaw:

| Ścieżka                   | Konfiguracja/polecenie                                  | Strona konfiguracji                    |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Natywny serwer aplikacji Codex | `/codex ...`, `agentRuntime.id: "codex"`               | [Harness Codex](/pl/plugins/codex-harness) |
| Jawny adapter Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ta strona                              |

Preferuj ścieżkę natywną, chyba że wyraźnie potrzebujesz zachowania ACP/acpx.

## Obsługa harnessa acpx (obecnie)

Obecne wbudowane aliasy harnessa acpx:

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

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że Twoja konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli Twoja lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też wskazywać dowolne adaptery przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (nie normalną ścieżką `agentId` w OpenClaw).

Kontrola modelu zależy od możliwości adaptera. Odwołania do modeli Codex ACP są normalizowane przez OpenClaw przed uruchomieniem. Inne harnessy wymagają ACP `models` oraz obsługi `session/set_model`; jeśli harness nie udostępnia ani tej możliwości ACP, ani własnej flagi modelu przy uruchomieniu, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Podstawowa konfiguracja ACP:

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

Konfiguracja wiązania wątków zależy od adaptera kanału. Przykład dla Discord:

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

Wiązania bieżącej konwersacji nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji oraz adaptera kanału, który udostępnia wiązania konwersacji ACP.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Plugin dla backendu acpx

Instalacje pakietowe używają oficjalnego Plugin środowiska uruchomieniowego `@openclaw/acpx` dla ACP.
Zainstaluj i włącz go przed użyciem sesji harnessa ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą też używać lokalnego Plugin z obszaru roboczego po `pnpm install`.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, zabroniono go przez `plugins.allow` / `plugins.deny` albo chcesz wrócić do spakowanego Plugin, użyj jawnej ścieżki pakietu:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja z obszaru roboczego podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie Plugin `acpx` rejestruje osadzony backend ACP bez uruchamiania agenta ACP podczas startu Gateway. Uruchom `/acp doctor`, aby wykonać jawny test na żywo. Ustaw `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` tylko wtedy, gdy Gateway ma testować skonfigurowanego agenta przy starcie.

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

- `command` przyjmuje ścieżkę bezwzględną, ścieżkę względną (rozwiązywaną z obszaru roboczego OpenClaw) albo nazwę polecenia.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla Plugin.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności środowiska uruchomieniowego acpx (pliki binarne specyficzne dla platformy) są instalowane automatycznie przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Plugin

Domyślnie sesje ACPX **nie** udostępniają narzędzi zarejestrowanych przez Pluginy OpenClaw do harnessa ACP.

Jeśli chcesz, aby agenty ACP, takie jak Codex lub Claude Code, wywoływały zainstalowane narzędzia Plugin OpenClaw, takie jak odczyt/zapis pamięci, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia Plugin już zarejestrowane przez zainstalowane i włączone Pluginy OpenClaw.
- Utrzymuje funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessa ACP.
- Agenty ACP uzyskują dostęp tylko do narzędzi Plugin już aktywnych w gatewayu.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie się w samym OpenClaw.
- Przejrzyj zainstalowane Pluginy przed włączeniem tej funkcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi Plugin jest dodatkowym, opcjonalnym udogodnieniem, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez MCP. Włącz osobny most narzędzi rdzeniowych, gdy agent ACP potrzebuje wybranych wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Utrzymuje udostępnianie narzędzi rdzeniowych jako jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu środowiska uruchomieniowego

Plugin `acpx` domyślnie ustawia limit czasu tur osadzonego środowiska uruchomieniowego na 120 sekund. Daje to wolniejszym harnessom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie startu i inicjalizacji ACP. Nadpisz tę wartość, jeśli Twój host potrzebuje innego limitu środowiska uruchomieniowego:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Uruchom gateway ponownie po zmianie tej wartości.

### Konfiguracja agenta sondy stanu

Gdy `/acp doctor` albo opcjonalna sonda startowa sprawdza backend, dołączony Plugin `acpx` sonduje jednego agenta harnessa. Jeśli ustawiono `acp.allowedAgents`, domyślnie używa pierwszego dozwolonego agenta; w przeciwnym razie domyślnie używa `codex`. Jeśli Twoje wdrożenie wymaga innego agenta ACP do kontroli stanu, ustaw agenta sondy jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Uruchom gateway ponownie po zmianie tej wartości.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania lub odrzucania monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji, które kontrolują sposób obsługi uprawnień:

Te uprawnienia harnessa ACPX są oddzielne od zatwierdzeń wykonywania OpenClaw i oddzielne od flag obejścia dostawców backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik awaryjny na poziomie harnessa dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harnessa może wykonywać bez monitowania.

| Wartość         | Zachowanie                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i exec wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                   |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy monit o uprawnienie miałby zostać pokazany, ale interaktywny TTY nie jest dostępny (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie                                                        |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**               |
| `deny`  | Cicho odmawia uprawnienia i kontynuuje (łagodna degradacja).      |

### Konfiguracja

Ustaw przez konfigurację Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Uruchom gateway ponownie po zmianie tych wartości.

<Warning>
OpenClaw domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła monit o uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast kończyć awarią.
</Warning>

## Powiązane

- [Agenty ACP](/pl/tools/acp-agents) — omówienie, runbook operatora, pojęcia
- [Subagenty](/pl/tools/subagents)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
