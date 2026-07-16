---
read_when:
    - Instalowanie lub konfigurowanie harnessu acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostka MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja środowiska acpx, konfiguracja Pluginu i uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-07-16T19:09:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Omówienie, podręcznik operacyjny i pojęcia znajdują się w sekcji [agenci ACP](/pl/tools/acp-agents).

Ta strona opisuje konfigurację środowiska acpx, konfigurację pluginu dla mostków MCP oraz konfigurację uprawnień.

Tej strony należy używać tylko podczas konfigurowania ścieżki ACP/acpx. Informacje o natywnej konfiguracji środowiska uruchomieniowego app-server Codex znajdują się w sekcji [Środowisko Codex](/pl/plugins/codex-harness). Informacje o kluczach API OpenAI lub konfiguracji dostawcy modeli Codex OAuth znajdują się w sekcji [OpenAI](/pl/providers/openai).

Codex udostępnia dwie ścieżki OpenClaw:

| Ścieżka                   | Konfiguracja/polecenie                                  | Strona konfiguracji                     |
| ------------------------- | ------------------------------------------------------- | --------------------------------------- |
| Natywny app-server Codex  | Odwołania do agentów `/codex ...`, `openai/gpt-*`       | [Środowisko Codex](/pl/plugins/codex-harness) |
| Jawny adapter Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ta strona                               |

Należy preferować ścieżkę natywną, chyba że jawnie wymagane jest zachowanie ACP/acpx.

## Obsługa środowiska acpx (obecnie)

Wbudowane aliasy środowiska acpx (z przypiętej zależności `acpx`):

| Alias        | Opakowuje                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Mostek ACP OpenClaw (natywny `openclaw acp`)                                                                |
| `pi`         | [Agent programistyczny Pi](https://github.com/mariozechner/pi)                                                  |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` i `factorydroid` również wskazują na wbudowany adapter `droid`.

Gdy OpenClaw używa backendu acpx, należy preferować te wartości dla `agentId`, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, należy zastąpić polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może również wskazywać dowolne adaptery za pomocą `--agent <command>`, ale ten surowy mechanizm obejścia jest funkcją CLI acpx (a nie standardową ścieżką OpenClaw `agentId`).

Sterowanie modelem zależy od możliwości adaptera. Odwołania do modeli Codex ACP są normalizowane przez OpenClaw przed uruchomieniem. Inne środowiska wymagają obsługi ACP `models` oraz `session/set_model`; jeśli środowisko nie udostępnia ani tej funkcji ACP, ani własnej flagi modelu używanej podczas uruchamiania, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Podstawowa konfiguracja ACP w rdzeniu:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Wartość domyślna to true; ustaw false, aby wstrzymać wysyłanie ACP przy zachowaniu kontrolek /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Wartości domyślne to coalesceIdleMs: 350, maxChunkChars: 1800; pokazano je tutaj jawnie.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązań wątków zależy od adaptera kanału. Przykład dla Discord:

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
        // Wartość domyślna to już true; pokazano ją tutaj jawnie.
        spawnSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, należy najpierw sprawdzić flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Powiązania z bieżącą konwersacją nie wymagają utworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji oraz adaptera kanału udostępniającego powiązania konwersacji ACP.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja pluginu dla backendu acpx

Instalacje z pakietu używają oficjalnego pluginu środowiska uruchomieniowego `@openclaw/acpx` dla ACP.
Należy go zainstalować i włączyć przed użyciem sesji środowiska ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie robocze kodu źródłowego mogą również używać lokalnego pluginu obszaru roboczego po wykonaniu `pnpm install`.

Należy rozpocząć od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, odmówiono dostępu za pomocą `plugins.allow` / `plugins.deny` lub wymagany jest powrót do pluginu z pakietu, należy użyć jawnej ścieżki pakietu:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja lokalnego obszaru roboczego podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie należy sprawdzić stan backendu:

```text
/acp doctor
```

### Sonda uruchomienia środowiska acpx

Plugin `acpx` osadza środowisko uruchomieniowe ACP bezpośrednio (bez oddzielnego pliku binarnego `acpx` ani wersji do skonfigurowania). Domyślnie rejestruje osadzony backend podczas uruchamiania Gateway i oczekuje na sondę uruchomieniową przed sygnałem gateway `ready`. Wartości `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` lub `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` należy ustawiać tylko dla skryptów lub środowisk, które celowo utrzymują sondę uruchomieniową jako wyłączoną. Aby jawnie uruchomić sondę na żądanie, należy wykonać `/acp doctor`.

Polecenie pojedynczego agenta ACP można zastąpić argumentami strukturalnymi, gdy ścieżka lub wartość flagi powinna pozostać jednym tokenem argv:

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

- `agents.<id>.command` to plik wykonywalny lub istniejący ciąg polecenia dla danego agenta ACP.
- `agents.<id>.args` jest opcjonalne. Każdy element tablicy jest ujmowany w cudzysłowy powłoki, zanim OpenClaw przekaże go przez bieżący rejestr ciągów poleceń acpx.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczne pobieranie adaptera

`acpx` automatycznie pobiera adaptery ACP (na przykład mostki ACP Claude i Codex) za pomocą `npx` przy pierwszym użyciu. Nie trzeba ręcznie instalować pakietów adapterów, a sam OpenClaw nie wymaga oddzielnego kroku poinstalacyjnego. Jeśli pobieranie lub uruchamianie adaptera zakończy się niepowodzeniem, `/acp doctor` zgłosi błąd.

### Mostek MCP narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają środowisku ACP narzędzi zarejestrowanych przez pluginy OpenClaw.

Aby agenci ACP, tacy jak Codex lub Claude Code, mogli wywoływać narzędzia zainstalowanych pluginów OpenClaw, takie jak odczyt i zapis pamięci, należy włączyć dedykowany mostek:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Działanie:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do inicjalizacji sesji ACPX.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Przekazuje aktywną tożsamość sesji ACP do fabryk narzędzi pluginów, dzięki czemu narzędzia o zakresie agenta pozostają w przestrzeni nazw tego agenta.
- Zapewnia jawne włączanie funkcji, która jest domyślnie wyłączona.

Uwagi dotyczące bezpieczeństwa i zaufania:

- Rozszerza to zakres narzędzi środowiska ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi pluginów już aktywnych w gateway.
- Należy traktować to jako tę samą granicę zaufania co zezwolenie tym pluginom na wykonywanie kodu w samym OpenClaw.
- Przed włączeniem należy przejrzeć zainstalowane pluginy.

Niestandardowe `mcpServers` nadal działają tak jak wcześniej. Wbudowany mostek narzędzi pluginów jest dodatkowym, opcjonalnym udogodnieniem, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Mostek MCP narzędzi OpenClaw

Domyślnie sesje ACPX **nie** udostępniają również wbudowanych narzędzi OpenClaw przez MCP. Gdy agent ACP potrzebuje wybranych wbudowanych narzędzi, takich jak `cron`, należy włączyć oddzielny mostek narzędzi rdzenia:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Działanie:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do inicjalizacji sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowa wersja serwera udostępnia `cron`.
- Zapewnia jawne udostępnianie narzędzi rdzenia, które jest domyślnie wyłączone.

### Konfiguracja limitu czasu operacji środowiska uruchomieniowego

Plugin `acpx` domyślnie przyznaje 120 sekund na uruchomienie osadzonego środowiska uruchomieniowego i operacje sterujące. Dzięki temu wolniejsze środowiska, takie jak Gemini CLI, mają wystarczająco dużo czasu na ukończenie uruchamiania i inicjalizacji ACP. Jeśli host wymaga innego limitu operacji, należy go zastąpić:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Przebiegi środowiska uruchomieniowego korzystają z limitów czasu agentów/przebiegów OpenClaw, w tym `/acp timeout`.
`sessions_spawn` nie przyjmuje indywidualnych nadpisań limitu czasu dla poszczególnych wywołań; ścieżką operatora jest `agents.defaults.subagents.runTimeoutSeconds`. Po zmianie `timeoutSeconds` należy ponownie uruchomić gateway.

### Konfiguracja agenta sondy stanu

Gdy `/acp doctor` lub sonda uruchomieniowa sprawdza backend, dołączony plugin `acpx` sonduje jednego agenta środowiska. Jeśli ustawiono `acp.allowedAgents`, domyślnie wybierany jest pierwszy dozwolony agent; w przeciwnym razie wartością domyślną jest `codex`. Jeśli wdrożenie wymaga innego agenta ACP do kontroli stanu, należy jawnie ustawić agenta sondy:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości należy ponownie uruchomić gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY umożliwiającego zatwierdzanie lub odrzucanie monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji sterujące obsługą uprawnień:

Te uprawnienia mechanizmu ACPX są niezależne od zatwierdzeń wykonywania w OpenClaw oraz od flag dostawców backendów CLI omijających zabezpieczenia, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to awaryjny przełącznik na poziomie mechanizmu dla sesji ACP.

Szersze porównanie `tools.exec.mode` w OpenClaw, zatwierdzeń Codex Guardian
oraz uprawnień mechanizmu ACPX zawiera sekcja
[Tryby uprawnień](/pl/tools/permission-modes).

### `permissionMode`

Określa, które operacje agent mechanizmu może wykonywać bez wyświetlania monitu.

| Wartość           | Działanie                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki.          |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i wykonywanie wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                              |

### `nonInteractivePermissions`

Określa, co się dzieje, gdy powinien zostać wyświetlony monit o uprawnienia, ale interaktywny TTY nie jest dostępny (co zawsze ma miejsce w przypadku sesji ACP).

| Wartość  | Działanie                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Przerywa sesję z błędem `PermissionPromptUnavailableError`. **(domyślnie)** |
| `deny` | Po cichu odrzuca uprawnienie i kontynuuje działanie (łagodna degradacja).        |

### Konfiguracja

Ustaw za pomocą konfiguracji Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie Gateway.

<Warning>
OpenClaw domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każda operacja zapisu lub wykonania, która wywołuje monit o uprawnienia, może zakończyć się błędem `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Jeśli konieczne jest ograniczenie uprawnień, ustaw `nonInteractivePermissions` na `deny`, aby sesje ulegały łagodnej degradacji zamiast kończyć się awarią.
</Warning>

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — przegląd, podręcznik operatora, pojęcia
- [Podagenci](/pl/tools/subagents)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
