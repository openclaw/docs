---
read_when:
    - Instalowanie lub konfigurowanie harnessu acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostka MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harnessa acpx, konfiguracja pluginu, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-06-27T18:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Omówienie, runbook operatora i pojęcia znajdziesz w [agenci ACP](/pl/tools/acp-agents).

Poniższe sekcje omawiają konfigurację harness acpx, konfigurację pluginu dla mostów MCP oraz konfigurację uprawnień.

Używaj tej strony tylko wtedy, gdy konfigurujesz ścieżkę ACP/acpx. W przypadku natywnej konfiguracji środowiska uruchomieniowego serwera aplikacji Codex użyj strony [Codex harness](/pl/plugins/codex-harness). W przypadku kluczy API OpenAI lub konfiguracji dostawcy modeli Codex OAuth użyj strony
[OpenAI](/pl/providers/openai).

Codex ma dwie ścieżki OpenClaw:

| Ścieżka                   | Konfiguracja/polecenie                                  | Strona konfiguracji                    |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Natywny serwer aplikacji Codex | `/codex ...`, odwołania agentów `openai/gpt-*`      | [Codex harness](/pl/plugins/codex-harness) |
| Jawny adapter Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ta strona                              |

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
- `qwen`

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli Twoja lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może także kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (a nie normalną ścieżką OpenClaw `agentId`).

Kontrola modelu zależy od możliwości adaptera. Odwołania do modeli Codex ACP są normalizowane przez OpenClaw przed uruchomieniem. Inne harness wymagają ACP `models` oraz obsługi `session/set_model`; jeśli harness nie udostępnia ani tej możliwości ACP, ani własnej flagi modelu startowego, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Podstawowa konfiguracja ACP core:

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
      "openclaw",
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

Jeśli tworzenie ACP powiązane z wątkiem nie działa, najpierw zweryfikuj flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Wiązania bieżącej konwersacji nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji i adaptera kanału, który udostępnia wiązania konwersacji ACP.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Pluginu dla backendu acpx

Instalacje pakietowe używają oficjalnego Pluginu środowiska uruchomieniowego `@openclaw/acpx` dla ACP.
Zainstaluj i włącz go przed użyciem sesji harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą również używać lokalnego Pluginu workspace po `pnpm install`.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, zablokowano go przez `plugins.allow` / `plugins.deny` albo chcesz wrócić do Pluginu pakietowego, użyj jawnej ścieżki pakietu:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja workspace podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie Plugin `acpx` rejestruje osadzony backend ACP podczas uruchamiania Gateway i czeka na sondę startową osadzonego środowiska uruchomieniowego przed sygnałem `ready` Gateway. Ustaw `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` lub `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` tylko dla skryptów lub środowisk, które celowo utrzymują sondę startową wyłączoną. Uruchom `/acp doctor`, aby wykonać jawną sondę na żądanie.

Nadpisz polecenie lub wersję w konfiguracji Pluginu:

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
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla Pluginu.

Nadpisz polecenie pojedynczego agenta ACP przy użyciu argumentów strukturalnych, gdy ścieżka lub wartość flagi powinna pozostać jednym tokenem argv:

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

- `agents.<id>.command` to plik wykonywalny albo istniejący ciąg polecenia dla tego agenta ACP.
- `agents.<id>.args` jest opcjonalne. Każdy element tablicy jest cytowany dla powłoki, zanim OpenClaw przekaże go przez bieżący rejestr ciągów poleceń acpx.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie za pomocą `npm install -g openclaw`, zależności środowiska uruchomieniowego acpx (pliki binarne specyficzne dla platformy) są instalowane automatycznie przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, Gateway nadal uruchamia się normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Pluginu

Domyślnie sesje ACPX **nie** udostępniają narzędzi zarejestrowanych przez Pluginy OpenClaw dla harness ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, wywoływali zainstalowane narzędzia Pluginów OpenClaw, takie jak recall/store pamięci, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia Pluginów już zarejestrowane przez zainstalowane i włączone Pluginy OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- Rozszerza to powierzchnię narzędzi harness ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi Pluginów już aktywnych w Gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie w samym OpenClaw.
- Przejrzyj zainstalowane Pluginy przed włączeniem tej funkcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi Pluginów jest dodatkowym, opcjonalnym ułatwieniem, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez MCP. Włącz oddzielny most narzędzi core, gdy agent ACP potrzebuje wybranych wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Utrzymuje udostępnianie narzędzi core jako jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu operacji środowiska uruchomieniowego

Plugin `acpx` domyślnie daje 120 sekund na uruchomienie osadzonego środowiska uruchomieniowego i operacje kontrolne. Daje to wolniejszym harness, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie uruchomienia i inicjalizacji ACP. Nadpisz to, jeśli host potrzebuje innego limitu operacji:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Tury środowiska uruchomieniowego używają limitów czasu agenta/uruchomienia OpenClaw, w tym `/acp timeout`.
`sessions_spawn` nie akceptuje nadpisań limitu czasu dla pojedynczego wywołania. Po zmianie tej wartości uruchom ponownie Gateway.

### Konfiguracja agenta sondy kondycji

Gdy `/acp doctor` lub sonda startowa sprawdza backend, dołączony Plugin `acpx` sonduje jednego agenta harness. Jeśli `acp.allowedAgents` jest ustawione, domyślnie używa pierwszego dozwolonego agenta; w przeciwnym razie domyślnie używa `codex`. Jeśli Twoje wdrożenie wymaga innego agenta ACP do kontroli kondycji, ustaw agenta sondy jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie Gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TUI do zatwierdzania ani odrzucania monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji kontrolujące sposób obsługi uprawnień:

Te uprawnienia harness ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag obejścia dostawców backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik awaryjny na poziomie harness dla sesji ACP.

Szersze porównanie między OpenClaw `tools.exec.mode`, zatwierdzeniami Codex Guardian i uprawnieniami harness ACPX znajdziesz w
[Tryby uprawnień](/pl/tools/permission-modes).

### `permissionMode`

Kontroluje, które operacje agent harness może wykonywać bez monitowania.

| Wartość         | Zachowanie                                               |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i exec wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                  |

### `nonInteractivePermissions`

Kontroluje, co się dzieje, gdy monit o uprawnienia miałby zostać wyświetlony, ale nie jest dostępne interaktywne TUI (co zawsze dotyczy sesji ACP).

| Wartość | Zachowanie                                                       |
| ------- | ---------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślne)**               |
| `deny`  | Po cichu odmawia uprawnienia i kontynuuje (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie Gateway.

<Warning>
OpenClaw domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła monit o uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast ulegać awarii.
</Warning>

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — omówienie, runbook operatora, pojęcia
- [Podagenci](/pl/tools/subagents)
- [Routing wielu agentów](/pl/concepts/multi-agent)
