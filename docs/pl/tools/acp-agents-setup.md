---
read_when:
    - Instalowanie lub konfigurowanie środowiska acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostka MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja środowiska acpx, konfiguracja pluginu, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-07-12T15:39:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Omówienie, procedury operacyjne i pojęcia znajdziesz w dokumencie [agenci ACP](/pl/tools/acp-agents).

Ta strona opisuje konfigurację środowiska acpx, konfigurację pluginu dla mostków MCP oraz konfigurację uprawnień.

Korzystaj z tej strony tylko podczas konfigurowania ścieżki ACP/acpx. W przypadku konfiguracji natywnego środowiska wykonawczego serwera aplikacji Codex użyj strony [Środowisko Codex](/pl/plugins/codex-harness). W przypadku kluczy API OpenAI lub konfiguracji dostawcy modeli Codex OAuth użyj strony [OpenAI](/pl/providers/openai).

Codex udostępnia dwie ścieżki OpenClaw:

| Ścieżka                           | Konfiguracja/polecenie                                  | Strona konfiguracji                         |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Natywny serwer aplikacji Codex    | `/codex ...`, odwołania agentów `openai/gpt-*`          | [Środowisko Codex](/pl/plugins/codex-harness)  |
| Jawny adapter Codex ACP           | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`  | Ta strona                                   |

Preferuj ścieżkę natywną, chyba że wyraźnie potrzebujesz działania ACP/acpx.

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
| `openclaw`   | Most ACP OpenClaw (natywne `openclaw acp`)                                                                      |
| `pi`         | [Agent programistyczny Pi](https://github.com/mariozechner/pi)                                                  |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` i `factorydroid` również wskazują na wbudowany adapter `droid`.

Gdy OpenClaw korzysta z zaplecza acpx, preferuj te wartości dla `agentId`, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, zastąp polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może również wskazywać dowolne adaptery za pomocą `--agent <command>`, ale ten nieprzetworzony mechanizm obejścia jest funkcją CLI acpx, a nie standardową ścieżką `agentId` w OpenClaw.

Sterowanie modelem zależy od możliwości adaptera. Odwołania do modeli Codex ACP są normalizowane przez OpenClaw przed uruchomieniem. Inne środowiska wymagają obsługi `models` ACP oraz `session/set_model`; jeśli środowisko nie udostępnia ani tej możliwości ACP, ani własnej flagi modelu przy uruchamianiu, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Podstawowa konfiguracja ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Wartość domyślna to true; ustaw false, aby wstrzymać przekazywanie ACP przy zachowaniu elementów sterujących /acp.
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
      // Wartości domyślne to coalesceIdleMs: 350, maxChunkChars: 1800; tutaj pokazano je jawnie.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązania z wątkiem zależy od adaptera kanału. Przykład dla Discord:

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
        // Wartość domyślna to już true; tutaj pokazano ją jawnie.
        spawnSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązanego z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Powiązania z bieżącą konwersacją nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji i adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja pluginu dla zaplecza acpx

Instalacje pakietowe korzystają z oficjalnego pluginu środowiska wykonawczego `@openclaw/acpx` dla ACP.
Zainstaluj i włącz go przed użyciem sesji środowiska ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie robocze kodu źródłowego mogą również korzystać z lokalnego pluginu przestrzeni roboczej po wykonaniu `pnpm install`.

Rozpocznij od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, odmówiono dostępu przez `plugins.allow` / `plugins.deny` albo chcesz wrócić do pluginu pakietowego, użyj jawnej ścieżki pakietu:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja lokalnej przestrzeni roboczej podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź stan zaplecza:

```text
/acp doctor
```

### Test uruchomieniowy środowiska wykonawczego acpx

Plugin `acpx` osadza środowisko wykonawcze ACP bezpośrednio (bez osobnego pliku binarnego `acpx` ani wersji do skonfigurowania). Domyślnie rejestruje osadzone zaplecze podczas uruchamiania Gateway i czeka na test uruchomieniowy przed sygnałem `ready` gatewaya. Ustaw `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` lub `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` wyłącznie dla skryptów lub środowisk, które celowo pozostawiają test uruchomieniowy wyłączony. Uruchom `/acp doctor`, aby wykonać jawny test na żądanie.

Zastąp polecenie pojedynczego agenta ACP argumentami strukturalnymi, gdy ścieżka lub wartość flagi powinna pozostać jednym tokenem argv:

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
- `agents.<id>.args` jest opcjonalne. Każdy element tablicy jest ujmowany w cudzysłowy zgodnie z regułami powłoki, zanim OpenClaw przekaże go przez bieżący rejestr ciągów poleceń acpx.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczne pobieranie adapterów

`acpx` automatycznie pobiera adaptery ACP (na przykład mosty ACP Claude i Codex) za pośrednictwem `npx` przy pierwszym użyciu. Nie trzeba ręcznie instalować pakietów adapterów, a sam OpenClaw nie wymaga osobnego kroku po instalacji. Jeśli pobranie lub uruchomienie adaptera nie powiedzie się, `/acp doctor` zgłosi błąd.

### Most MCP narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają środowisku ACP narzędzi zarejestrowanych przez pluginy OpenClaw.

Jeśli agenci ACP, tacy jak Codex lub Claude Code, mają wywoływać narzędzia zainstalowanych pluginów OpenClaw, takie jak odczyt lub zapis pamięci, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Działanie:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do procesu inicjalizacji sesji ACPX.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Funkcja pozostaje jawna i domyślnie wyłączona.

Uwagi dotyczące bezpieczeństwa i zaufania:

- Rozszerza to zestaw narzędzi dostępnych dla środowiska ACP.
- Agenci ACP uzyskują dostęp wyłącznie do narzędzi pluginów już aktywnych w gatewayu.
- Traktuj to jako tę samą granicę zaufania co zezwolenie tym pluginom na wykonywanie kodu w samym OpenClaw.
- Przed włączeniem przejrzyj zainstalowane pluginy.

Niestandardowe `mcpServers` nadal działają tak jak wcześniej. Wbudowany most narzędzi pluginów jest dodatkowym, opcjonalnym udogodnieniem, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX **nie** udostępniają również wbudowanych narzędzi OpenClaw przez MCP. Włącz oddzielny most narzędzi podstawowych, gdy agent ACP potrzebuje wybranych wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Działanie:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do procesu inicjalizacji sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowa wersja serwera udostępnia `cron`.
- Udostępnianie narzędzi podstawowych pozostaje jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu operacji środowiska wykonawczego

Plugin `acpx` domyślnie przeznacza 120 sekund na uruchomienie osadzonego środowiska wykonawczego i operacje sterujące. Daje to wolniejszym środowiskom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie uruchamiania i inicjalizacji ACP. Zmień tę wartość, jeśli host wymaga innego limitu operacji:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Tury środowiska wykonawczego korzystają z limitów czasu agenta/uruchomienia OpenClaw, w tym `/acp timeout`.
`sessions_spawn` nie przyjmuje nadpisań limitu czasu dla pojedynczego wywołania; ścieżką operatorską jest `agents.defaults.subagents.runTimeoutSeconds`. Po zmianie `timeoutSeconds` uruchom ponownie gateway.

### Konfiguracja agenta testu stanu

Gdy `/acp doctor` lub test uruchomieniowy sprawdza zaplecze, dołączony plugin `acpx` testuje jednego agenta środowiska. Jeśli ustawiono `acp.allowedAgents`, domyślnie używany jest pierwszy dozwolony agent; w przeciwnym razie domyślnie używany jest `codex`. Jeśli wdrożenie wymaga innego agenta ACP do testów stanu, ustaw go jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY umożliwiającego zatwierdzanie lub odrzucanie monitów o uprawnienia do zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji sterujące obsługą uprawnień:

Te uprawnienia środowiska ACPX są niezależne od zatwierdzeń wykonywania w OpenClaw oraz od flag obejścia dostawcy zaplecza CLI, takich jak `--permission-mode bypassPermissions` w Claude CLI. `approve-all` w ACPX jest awaryjnym przełącznikiem na poziomie środowiska dla sesji ACP.

Szersze porównanie `tools.exec.mode` w OpenClaw, zatwierdzeń Codex Guardian i uprawnień środowiska ACPX znajdziesz w dokumencie [Tryby uprawnień](/pl/tools/permission-modes).

### `permissionMode`

Określa, które operacje agent środowiska może wykonywać bez monitowania.

| Wartość         | Zachowanie                                                                |
| --------------- | ------------------------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki.     |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i wykonanie wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                                   |

### `nonInteractivePermissions`

Określa, co się dzieje, gdy powinien zostać wyświetlony monit o uprawnienia, ale interaktywny TTY nie jest dostępny (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie                                                                           |
| ------- | ------------------------------------------------------------------------------------ |
| `fail`  | Przerywa sesję z błędem `PermissionPromptUnavailableError`. **(domyślnie)**           |
| `deny`  | Po cichu odmawia uprawnienia i kontynuuje działanie (łagodne ograniczenie funkcjonalności). |

### Konfiguracja

Ustaw za pomocą konfiguracji Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie Gateway.

<Warning>
OpenClaw domyślnie używa ustawień `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każda operacja zapisu lub wykonania, która wywołuje monit o uprawnienia, może zakończyć się błędem `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje łagodnie ograniczały funkcjonalność zamiast ulegać awarii.
</Warning>

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — omówienie, podręcznik operatora, pojęcia
- [Podagenci](/pl/tools/subagents)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
