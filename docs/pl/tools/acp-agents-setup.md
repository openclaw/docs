---
read_when:
    - Instalowanie lub konfigurowanie środowiska acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostka MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harnessu acpx, konfiguracja Plugin, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-04-30T10:20:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Informacje ogólne, runbook operatora i pojęcia znajdziesz w [agentach ACP](/pl/tools/acp-agents).

Poniższe sekcje obejmują konfigurację harness acpx, konfigurację plugin dla mostów MCP oraz konfigurację uprawnień.

Użyj tej strony tylko wtedy, gdy konfigurujesz ścieżkę ACP/acpx. Dla natywnej konfiguracji środowiska uruchomieniowego app-server Codex użyj [harness Codex](/pl/plugins/codex-harness). Dla kluczy API OpenAI albo konfiguracji dostawcy modeli OAuth Codex użyj [OpenAI](/pl/providers/openai).

Codex ma dwie ścieżki OpenClaw:

| Ścieżka                  | Konfiguracja/polecenie                                | Strona konfiguracji                    |
| ------------------------ | ----------------------------------------------------- | -------------------------------------- |
| Natywny app-server Codex | `/codex ...`, `agentRuntime.id: "codex"`              | [harness Codex](/pl/plugins/codex-harness) |
| Jawny adapter ACP Codex  | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ta strona                              |

Preferuj ścieżkę natywną, chyba że wyraźnie potrzebujesz zachowania ACP/acpx.

## Obsługa harness acpx (bieżąca)

Bieżące wbudowane aliasy harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor: `cursor-agent acp`)
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

Bezpośrednie użycie CLI acpx może też wskazywać dowolne adaptery przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (nie zwykłą ścieżką `agentId` w OpenClaw).

Kontrola modelu zależy od możliwości adaptera. Referencje modeli ACP Codex są normalizowane przez OpenClaw przed startem. Inne harnessy wymagają ACP `models` oraz obsługi `session/set_model`; jeśli harness nie udostępnia ani tej możliwości ACP, ani własnej flagi modelu przy starcie, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Bazowa konfiguracja ACP rdzenia:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Wiązania bieżącej konwersacji nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji oraz adaptera kanału, który udostępnia wiązania konwersacji ACP.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja plugin dla backendu acpx

Nowe instalacje zawierają dołączony Plugin środowiska uruchomieniowego `acpx`, domyślnie włączony, więc ACP zwykle działa bez ręcznego kroku instalacji plugin.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz przełączyć się na lokalny checkout deweloperski, użyj jawnej ścieżki plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja z lokalnego workspace podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź kondycję backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie dołączony Plugin `acpx` rejestruje osadzony backend ACP bez uruchamiania agenta ACP podczas startu Gateway. Uruchom `/acp doctor`, aby wykonać jawny test na żywo. Ustaw `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` tylko wtedy, gdy Gateway ma sprawdzać skonfigurowanego agenta przy starcie.

Nadpisz polecenie lub wersję w konfiguracji plugin:

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

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną (rozwiązywaną względem workspace OpenClaw) albo nazwę polecenia.
- `expectedVersion: "any"` wyłącza ścisłe dopasowywanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla plugin.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności środowiska uruchomieniowego acpx (pliki binarne specyficzne dla platformy) są instalowane automatycznie przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi plugin

Domyślnie sesje ACPX **nie** udostępniają narzędzi zarejestrowanych przez plugin OpenClaw do harness ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, wywoływali zainstalowane narzędzia plugin OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia plugin już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harness ACP.
- Agenci ACP otrzymują dostęp tylko do narzędzi plugin już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym pluginom na wykonywanie się w samym OpenClaw.
- Przejrzyj zainstalowane pluginy przed włączeniem tej opcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi plugin jest dodatkowym udogodnieniem opt-in, a nie zamiennikiem ogólnej konfiguracji serwerów MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez MCP. Włącz osobny most narzędzi rdzenia, gdy agent ACP potrzebuje wybranych wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Utrzymuje ekspozycję narzędzi rdzenia jako jawną i domyślnie wyłączoną.

### Konfiguracja limitu czasu środowiska uruchomieniowego

Dołączony Plugin `acpx` domyślnie ustawia limit czasu osadzonych tur środowiska uruchomieniowego na 120 sekund. Daje to wolniejszym harnessom, takim jak CLI Gemini, wystarczająco dużo czasu na ukończenie startu i inicjalizacji ACP. Nadpisz tę wartość, jeśli Twój host potrzebuje innego limitu środowiska uruchomieniowego:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie gateway.

### Konfiguracja agenta testu kondycji

Gdy `/acp doctor` albo opcjonalny test przy starcie sprawdza backend, dołączony Plugin `acpx` testuje jednego agenta harness. Jeśli `acp.allowedAgents` jest ustawione, domyślnie używa pierwszego dozwolonego agenta; w przeciwnym razie domyślnie używa `codex`. Jeśli Twoje wdrożenie wymaga innego agenta ACP do testów kondycji, ustaw agenta testowego jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracyjne, które kontrolują obsługę uprawnień:

Te uprawnienia harness ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag obejścia dostawców backendu CLI, takich jak `--permission-mode bypassPermissions` w CLI Claude. ACPX `approve-all` to przełącznik awaryjny na poziomie harness dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harness może wykonywać bez monitowania.

| Wartość         | Zachowanie                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i exec wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                   |

### `nonInteractivePermissions`

Kontroluje, co się dzieje, gdy zostałby wyświetlony monit o uprawnienie, ale interaktywny TTY nie jest dostępny (co zawsze dotyczy sesji ACP).

| Wartość | Zachowanie                                                       |
| ------- | ---------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślne)**               |
| `deny`  | Po cichu odmawia uprawnienia i kontynuuje (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

<Warning>
OpenClaw domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła monit o uprawnienie, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast kończyć awarią.
</Warning>

## Powiązane

- [agenci ACP](/pl/tools/acp-agents) — informacje ogólne, runbook operatora, pojęcia
- [Subagenci](/pl/tools/subagents)
- [Routing wielu agentów](/pl/concepts/multi-agent)
