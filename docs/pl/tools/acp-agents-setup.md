---
read_when:
    - Instalowanie lub konfigurowanie uprzęży acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostu MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja uprzęży acpx, konfiguracja Plugin, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-04-24T09:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Przegląd, runbook operatora i koncepcje znajdziesz w [Agentach ACP](/pl/tools/acp-agents).
Ta strona opisuje konfigurację uprzęży acpx, konfigurację Plugin dla mostów MCP oraz
konfigurację uprawnień.

## Obsługa uprzęży acpx (obecnie)

Obecne wbudowane aliasy uprzęży acpx:

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
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka awaryjna jest funkcją CLI acpx (a nie zwykłą ścieżką `agentId` w OpenClaw).

## Wymagana konfiguracja

Bazowa konfiguracja ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Domyślnie true; ustaw false, aby wstrzymać wysyłkę ACP przy zachowaniu kontrolek /acp.
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

Konfiguracja powiązania wątków jest specyficzna dla adaptera kanału. Przykład dla Discord:

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

Jeśli uruchamianie ACP powiązanego z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą konwersacją nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu rozmowy i adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Plugin dla backendu acpx

Świeże instalacje dostarczają wbudowany Plugin środowiska uruchomieniowego `acpx` domyślnie włączony, więc ACP
zwykle działa bez ręcznego kroku instalacji Plugin.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączono `acpx`, zabroniono go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalne checkout deweloperskie, użyj jawnej ścieżki Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja z lokalnego obszaru roboczego podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie wbudowany Plugin `acpx` używa przypiętego binarium lokalnego dla Plugin (`node_modules/.bin/acpx` wewnątrz pakietu Plugin). Przy starcie backend jest rejestrowany jako niegotowy, a zadanie w tle weryfikuje `acpx --version`; jeśli binarium brakuje albo wersja się nie zgadza, uruchamia `npm install --omit=dev --no-save acpx@<pinned>` i ponawia weryfikację. Gateway przez cały czas pozostaje nieblokujący.

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

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną (rozwiązywaną względem obszaru roboczego OpenClaw) albo nazwę polecenia.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla Plugin.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie za pomocą `npm install -g openclaw`, zależności
środowiska uruchomieniowego acpx (binaria specyficzne dla platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, Gateway nadal uruchomi się
normalnie i zgłosi brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Plugin

Domyślnie sesje ACPX **nie** udostępniają narzędzi zarejestrowanych przez Plugin OpenClaw
uprzęży ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, mogli wywoływać zainstalowane
narzędzia Plugin OpenClaw, takie jak przywoływanie/zapisywanie pamięci, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia Plugin już zarejestrowane przez zainstalowane i włączone Pluginy OpenClaw.
- Zachowuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- Rozszerza to powierzchnię narzędzi uprzęży ACP.
- Agenci ACP dostają dostęp tylko do narzędzi Plugin już aktywnych w Gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie działań
  w samym OpenClaw.
- Przejrzyj zainstalowane Pluginy przed włączeniem tej funkcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most plugin-tools jest
dodatkową wygodną opcją opt-in, a nie zastępstwem dla ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez
MCP. Włącz osobny most narzędzi rdzenia, gdy agent ACP potrzebuje wybranych
wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Zachowuje udostępnianie narzędzi rdzenia jako jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu środowiska uruchomieniowego

Wbudowany Plugin `acpx` domyślnie ustawia limit czasu tur osadzonego środowiska uruchomieniowego na 120 sekund.
Daje to wolniejszym uprzężom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie
uruchamiania i inicjalizacji ACP. Nadpisz tę wartość, jeśli Twój host wymaga innego
limitu środowiska uruchomieniowego:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie Gateway.

### Konfiguracja agenta sondy stanu

Wbudowany Plugin `acpx` sonduje jednego agenta uprzęży podczas ustalania, czy
backend osadzonego środowiska uruchomieniowego jest gotowy. Domyślnie jest to `codex`. Jeśli Twoje wdrożenie
używa innego domyślnego agenta ACP, ustaw agenta sondy na ten sam identyfikator:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie Gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania monitów o uprawnienia zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracyjne, które kontrolują sposób obsługi uprawnień:

Te uprawnienia uprzęży ACPX są oddzielone od akceptacji exec OpenClaw oraz od flag obejścia dostawcy backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik awaryjny break-glass na poziomie uprzęży dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent uprzęży może wykonywać bez monitu.

| Wartość         | Zachowanie                                                 |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapis i exec wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                    |

### `nonInteractivePermissions`

Kontroluje, co się stanie, gdy miałby zostać pokazany monit o uprawnienia, ale nie jest dostępne interaktywne TTY (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie                                                        |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**               |
| `deny`  | Po cichu odrzuca uprawnienie i kontynuuje (łagodna degradacja).   |

### Konfiguracja

Ustawiane przez konfigurację Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie Gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywołuje monit o uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje ulegały łagodnej degradacji zamiast się wykrzaczać.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — przegląd, runbook operatora, koncepcje
- [Sub-agenci](/pl/tools/subagents)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
