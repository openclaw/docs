---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Eine Konversation in einem Nachrichtenkanal an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend und Plugin-Verdrahtung
    - Fehlerbehebung bei der Zustellung von ACP-Abschlüssen oder bei Agent-zu-Agent-Schleifen
    - '`/acp`-Befehle aus dem Chat heraus verwenden'
summary: ACP-Runtime-Sitzungen für Claude Code, Cursor, Gemini CLI, expliziten Codex-ACP-Fallback, OpenClaw ACP und andere Harness-Agents verwenden
title: ACP-Agents
x-i18n:
    generated_at: "2026-04-25T13:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Sitzungen mit [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, Codex in der aktuellen Konversation zu binden oder zu steuern, sollte OpenClaw das native Codex-App-Server-Plugin verwenden (`/codex bind`, `/codex threads`, `/codex resume`). Wenn Sie nach `/acp`, ACP, acpx oder einer Codex-Hintergrund-Child-Session fragen, kann OpenClaw Codex weiterhin über ACP leiten. Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „Claude Code in einem Thread zu starten“ oder ein anderes externes Harness zu verwenden, sollte OpenClaw diese Anfrage an die ACP-Runtime weiterleiten (nicht an die native Sub-Agent-Runtime).

Wenn Sie möchten, dass Codex oder Claude Code sich als externer MCP-Client direkt
mit bestehenden OpenClaw-Kanal-Konversationen verbindet, verwenden Sie
statt ACP [`openclaw mcp serve`](/de/cli/mcp).

## Welche Seite brauche ich?

Es gibt drei nahe beieinanderliegende Oberflächen, die leicht verwechselt werden können:

| Sie möchten ...                                                                                 | Verwenden Sie dies                    | Hinweise                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Konversation binden oder steuern                                        | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/schnell/Berechtigungen, Stop- und Steuerungsfunktionen. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agents               | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerung                                       |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen      | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                                                                      |
| Eine lokale AI-CLI als reines Text-Fallback-Modell wiederverwenden                             | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Runtime                                                                                 |

## Funktioniert das sofort?

In der Regel ja. Frische Installationen werden standardmäßig mit aktiviertem gebündeltem Runtime-Plugin `acpx` ausgeliefert, inklusive einer pluginlokalen fest angehefteten `acpx`-Binärdatei, die OpenClaw beim Start prüft und selbst repariert. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

Typische Stolpersteine beim ersten Start:

- Adapter für Ziel-Harnesses (Codex, Claude usw.) können beim ersten Verwenden bei Bedarf mit `npx` abgerufen werden.
- Die Authentifizierung des Anbieters muss für dieses Harness weiterhin auf dem Host vorhanden sein.
- Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Abrufe von Adaptern beim ersten Start fehl, bis Caches vorgewärmt wurden oder der Adapter auf andere Weise installiert wurde.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

1. **Starten** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` oder explizit `/acp spawn codex --bind here`
2. **Arbeiten** in der gebundenen Konversation oder dem Thread (oder den Sitzungsschlüssel explizit angeben).
3. **Status prüfen** — `/acp status`
4. **Anpassen** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steuern**, ohne den Kontext zu ersetzen — `/acp steer tighten logging and continue`
6. **Beenden** — `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindungen)

Auslöser in natürlicher Sprache, die an das native Codex-Plugin geleitet werden sollten:

- „Binde diesen Discord-Kanal an Codex.“
- „Verbinde diesen Chat mit Codex-Thread `<id>`.“
- „Zeige Codex-Threads und binde dann diesen hier.“

Das Binden nativer Codex-Konversationen ist der Standardpfad für die Chat-Steuerung. OpenClaw-Dynamic-Tools werden weiterhin über OpenClaw ausgeführt, während Codex-native Tools wie shell/apply-patch innerhalb von Codex ausgeführt werden. Für Codex-native Tool-Ereignisse injiziert OpenClaw ein natives Hook-Relay pro Turn, damit Plugin-Hooks `before_tool_call` blockieren, `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse über OpenClaw-Genehmigungen leiten können. Das v1-Relay ist bewusst konservativ: Es verändert keine Argumente Codex-nativer Tools, schreibt keine Codex-Thread-Datensätze um und kontrolliert keine finalen Antworten/Stop-Hooks. Verwenden Sie explizit ACP nur dann, wenn Sie das ACP-Runtime-/Sitzungsmodell möchten. Die Support-Grenze für eingebettetes Codex ist im
[Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract) dokumentiert.

Auslöser in natürlicher Sprache, die an die ACP-Runtime geleitet werden sollten:

- „Führe dies als einmalige Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und behalte Nachfragen in demselben Thread.“
- „Führe Codex über ACP in einem Hintergrund-Thread aus.“

OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf, bindet an die aktuelle Konversation oder den aktuellen Thread, wenn unterstützt, und leitet Nachfragen bis zum Schließen/Ablauf an diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn ACP explizit ist oder die angeforderte Hintergrund-Runtime weiterhin ACP benötigt.

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie den nativen Codex-App-Server für die Bindung/Steuerung von Codex-Konversationen. Verwenden Sie Sub-Agents, wenn Sie nativ delegierte Ausführungen von OpenClaw möchten.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Ausführung                |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime  |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## So führt ACP Claude Code aus

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Steuerungsebene
2. gebündeltes Runtime-Plugin `acpx`
3. Claude-ACP-Adapter
4. Runtime-/Sitzungsmechanismus auf Claude-Seite

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerung, Wiederaufnahme von Sitzungen, Nachverfolgung von Hintergrundaufgaben und optionaler Bindung an Konversation/Thread.
- CLI-Backends sind separate reine Text-Fallback-Runtimes für lokal. Siehe [CLI-Backends](/de/gateway/cli-backends).

Für Operatoren gilt praktisch folgende Regel:

- Sie möchten `/acp spawn`, bindbare Sitzungen, Runtime-Steuerung oder persistente Harness-Arbeit: Verwenden Sie ACP.
- Sie möchten einfaches lokales Text-Fallback über die rohe CLI: Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` verankert die aktuelle Konversation an der gestarteten ACP-Sitzung — kein Child-Thread, dieselbe Chat-Oberfläche. OpenClaw behält Ownership über Transport, Authentifizierung, Sicherheit und Zustellung; Nachfolgenachrichten in dieser Konversation werden an dieselbe Sitzung geleitet; `/new` und `/reset` setzen die Sitzung direkt zurück; `/acp close` entfernt die Bindung.

Mentales Modell:

- **Chat-Oberfläche** — der Ort, an dem Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, an den OpenClaw leitet.
- **Child-Thread/Thema** — eine optionale zusätzliche Nachrichtenoberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** — der Dateisystemspeicherort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), in dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

Beispiele:

- `/codex bind` — diesen Chat beibehalten, nativen Codex-App-Server starten oder anbinden, künftige Nachrichten hierher leiten.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — den gebundenen nativen Codex-Thread aus dem Chat anpassen.
- `/codex stop` oder `/codex steer focus on the failing tests first` — den aktiven nativen Codex-Turn steuern.
- `/acp spawn codex --bind here` — expliziter ACP-Fallback für Codex.
- `/acp spawn codex --thread auto` — OpenClaw kann einen Child-Thread/ein Child-Thema erstellen und dort binden.
- `/acp spawn codex --bind here --cwd /workspace/repo` — gleiche Chat-Bindung, Codex läuft in `/workspace/repo`.

Hinweise:

- `--bind here` und `--thread ...` schließen sich gegenseitig aus.
- `--bind here` funktioniert nur auf Kanälen, die eine Bindung an die aktuelle Konversation bekanntgeben; andernfalls gibt OpenClaw eine klare Meldung zu fehlender Unterstützung zurück. Bindungen bleiben über Gateway-Neustarts hinweg erhalten.
- Bei Discord ist `spawnAcpSessions` nur erforderlich, wenn OpenClaw für `--thread auto|here` einen Child-Thread erstellen muss — nicht für `--bind here`.
- Wenn Sie zu einem anderen ACP-Agent ohne `--cwd` starten, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**. Fehlende übernommene Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Spawn-Fehler gemeldet.

### Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Nachfolgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung geleitet.
- ACP-Ausgaben werden zurück in denselben Thread zugestellt.
- Unfocus/Schließen/Archivieren/Idle-Timeout oder Ablauf aufgrund des maximalen Alters entfernt die Bindung.

Die Unterstützung für Thread-Bindung ist adapterspezifisch. Wenn der aktive Kanaladapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare Meldung zu fehlender Unterstützung/Nichtverfügbarkeit zurück.

Erforderliche Feature-Flags für threadgebundenes ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um den ACP-Dispatch anzuhalten)
- ACP-Thread-Spawn-Flag des Kanaladapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanaladapter, der Funktionen zum Binden von Sitzungen/Threads bereitstellt.
- Aktuelle integrierte Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Themen (Forenthemen in Gruppen/Supergroups und DM-Themen)
- Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

## Kanalspezifische Einstellungen

Für nicht flüchtige Workflows konfigurieren Sie persistente ACP-Bindungen in `bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

- `bindings[].type="acp"` kennzeichnet eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forenthema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM-/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM-/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die owning `agentId` von OpenClaw.
- Optionale ACP-Overrides befinden sich unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Runtime-Standards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Override-Reihenfolge für ACP-gebundene Sitzungen:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globale ACP-Standards (zum Beispiel `acp.backend`)

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Verhalten:

- OpenClaw stellt sicher, dass die konfigurierte ACP-Sitzung vor der Verwendung existiert.
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung geleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindungen (zum Beispiel durch Thread-Focus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentübergreifenden ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende übernommene Arbeitsbereichspfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler gemeldet.

## ACP-Sitzungen starten (Schnittstellen)

### Von `sessions_spawn`

Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agent-Turn oder Tool-Aufruf zu starten.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Hinweise:

- `runtime` ist standardmäßig `subagent`, setzen Sie für ACP-Sitzungen also explizit `runtime: "acp"`.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, falls konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Details der Schnittstelle:

- `task` (erforderlich): initialer Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
- `thread` (optional, Standard `false`): fordert einen Thread-Bindungs-Flow an, sofern unterstützt.
- `mode` (optional): `run` (einmalig) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` gesetzt ist und `mode` weggelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Runtime-Arbeitsverzeichnis (validiert durch Backend-/Runtime-Richtlinie). Wenn weggelassen, übernimmt ein ACP-Start den Arbeitsbereich des Ziel-Agenten, falls konfiguriert; fehlende übernommene Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitige Bezeichnung, die in Sitzungs-/Banner-Text verwendet wird.
- `resumeSessionId` (optional): setzt eine bestehende ACP-Sitzung fort, statt eine neue zu erstellen. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ein. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Zusammenfassungen des Fortschritts des initialen ACP-Laufs als Systemereignisse zurück an die anfragende Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll (`<sessionId>.acp-stream.jsonl`) verweist, das Sie für den vollständigen Relay-Verlauf verfolgen können.
- `model` (optional): explizite Modellüberschreibung für die ACP-Child-Sitzung. Wird für `runtime: "acp"` berücksichtigt, sodass die Child-Sitzung das angeforderte Modell verwendet, statt stillschweigend auf den Standard des Ziel-Agenten zurückzufallen.

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder dem Parent gehörende Hintergrundarbeit sein. Der Zustellpfad hängt von dieser Form ab.

### Interaktive ACP-Sitzungen

Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche weitergeführt zu werden:

- `/acp spawn ... --bind here` bindet die aktuelle Konversation an die ACP-Sitzung.
- `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
- Persistente konfigurierte `bindings[].type="acp"` leiten passende Konversationen an dieselbe ACP-Sitzung.

Nachrichten in der gebundenen Konversation werden direkt an die ACP-Sitzung geleitet, und ACP-Ausgaben werden in denselben Kanal/Thread/dasselbe Thema zurück zugestellt.

### Einmalige ACP-Sitzungen, die dem Parent gehören

Einmalige ACP-Sitzungen, die von einem anderen Agent-Lauf gestartet werden, sind Hintergrund-Child-Sitzungen, ähnlich wie Sub-Agents:

- Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
- Die Child-Sitzung läuft in ihrer eigenen ACP-Harness-Sitzung.
- Der Abschluss wird über den internen Ankündigungspfad für Task-Abschluss zurückgemeldet.
- Der Parent schreibt das Ergebnis der Child-Sitzung in normaler Assistentenstimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

Behandeln Sie diesen Pfad nicht als Peer-to-Peer-Chat zwischen Parent und Child. Die Child-Sitzung hat bereits einen Abschlusskanal zurück zum Parent.

### `sessions_send` und A2A-Zustellung

`sessions_send` kann nach dem Start eine andere Sitzung als Ziel haben. Für normale Peer-Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-(A2A)-Nachverfolgungspfad:

- auf die Antwort der Zielsitzung warten
- dem Anfragenden und dem Ziel optional erlauben, eine begrenzte Anzahl von Nachfolge-Turns auszutauschen
- das Ziel bitten, eine Ankündigungsnachricht zu erzeugen
- diese Ankündigung an den sichtbaren Kanal oder Thread zustellen

Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender eine sichtbare Nachverfolgung benötigt. Er bleibt aktiviert, wenn eine nicht zusammenhängende Sitzung eine ACP-Zielsitzung sehen und ihr Nachrichten senden kann, zum Beispiel bei breiten `tools.sessions.visibility`-Einstellungen.

OpenClaw überspringt die A2A-Nachverfolgung nur, wenn der Anfragende der Parent seiner eigenen, ihm gehörenden einmaligen ACP-Child-Sitzung ist. In diesem Fall kann A2A zusätzlich zur Task-Abschlussbehandlung den Parent mit dem Ergebnis der Child-Sitzung aufwecken, die Antwort des Parent zurück in die Child-Sitzung weiterleiten und eine Echo-Schleife zwischen Parent und Child erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall mit eigener Child-Sitzung `delivery.status="skipped"`, weil der Abschlusspfad bereits für das Ergebnis verantwortlich ist.

### Eine bestehende Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ein, sodass er mit vollem Kontext darüber fortfährt, was zuvor geschehen ist.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Übergabe einer Codex-Sitzung von Ihrem Laptop auf Ihr Telefon — weisen Sie Ihren Agent an, dort weiterzumachen, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, jetzt headless über Ihren Agent
- Arbeit fortsetzen, die durch einen Gateway-Neustart oder Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — bei Verwendung mit der Sub-Agent-Runtime wird ein Fehler zurückgegeben.
- `resumeSessionId` stellt den vorgelagerten ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Start mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

<Accordion title="Rauchtest nach der Bereitstellung">

Führen Sie nach einer Gateway-Bereitstellung eine echte Live-End-to-End-Prüfung aus, statt sich auf Unit-Tests zu verlassen:

1. Verifizieren Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agent.
3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
4. Verifizieren Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
5. Bereinigen Sie die temporäre Bridge-Sitzung.

Behalten Sie das Gate auf `mode: "run"` und lassen Sie `streamTo: "parent"` weg — an Threads gebundene Pfade mit `mode: "session"` und Stream-Relay-Pfade sind separate, umfangreichere Integrationsdurchläufe.

</Accordion>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung in einer Sandbox läuft, werden ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine durch die Sandbox erzwungene Ausführung benötigen.

### Über den Befehl `/acp`

Verwenden Sie `/acp spawn` für explizite Operator-Steuerung aus dem Chat, wenn nötig.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Wichtige Flags:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Siehe [Slash-Befehle](/de/tools/slash-commands).

## Auflösung des Sitzungsziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Reihenfolge der Auflösung:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfragende Sitzung

Bindungen an die aktuelle Konversation und Thread-Bindungen nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bindungsmodi

`/acp spawn` unterstützt `--bind here|off`.

| Modus  | Verhalten                                                            |
| ------ | -------------------------------------------------------------------- |
| `here` | Bindet die aktuelle aktive Konversation direkt; schlägt fehl, wenn keine aktiv ist. |
| `off`  | Erstellt keine Bindung an die aktuelle Konversation.                 |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex unterstützen“.
- `--bind here` erstellt keinen Child-Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für die Bindung an die aktuelle Konversation bereitstellen.
- `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus  | Verhalten                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen Child-Thread erstellen/binden, wenn unterstützt. |
| `here` | Aktiven aktuellen Thread voraussetzen; schlägt fehl, wenn Sie sich nicht in einem Thread befinden.    |
| `off`  | Keine Bindung. Sitzung wird ungebunden gestartet.                                                      |

Hinweise:

- Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
- An Threads gebundene Starts erfordern Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation fest anheften möchten, ohne einen Child-Thread zu erstellen.

## ACP-Steuerung

| Befehl               | Was er macht                                              | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Turn in Ausführung für die Zielsitzung abbrechen.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an laufende Sitzung senden.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Bindungen an Thread-Ziele aufheben. | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Runtime-Optionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generisches Schreiben einer Runtime-Konfigurationsoption. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Runtime-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                        |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout (Sekunden) festlegen.                     | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Runtime-Modells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Sitzungs-Runtime-Optionen entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Store auflisten.             | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen.     | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                          |

`/acp status` zeigt die effektiven Runtime-Optionen sowie Sitzungskennungen auf Runtime- und Backend-Ebene. Fehler bei nicht unterstützten Steuerbefehlen werden klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den Store für die aktuell gebundene oder anfragende Sitzung; Ziel-Token (`session-key`, `session-id` oder `session-label`) werden über die Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

## Zuordnung der Runtime-Optionen

`/acp` bietet Komfortbefehle und einen generischen Setter.

Gleichwertige Operationen:

- `/acp model <id>` wird auf den Runtime-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Runtime-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Runtime-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert die Überschreibung des Runtime-`cwd` direkt.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad zur `cwd`-Überschreibung.
- `/acp reset-options` löscht alle Runtime-Überschreibungen für die Zielsitzung.

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Für die acpx-Harness-Konfiguration (Aliases für Claude Code / Codex / Gemini CLI), die MCP-Bridges für Plugin-Tools und OpenClaw-Tools sowie ACP-Berechtigungsmodi siehe
[ACP-Agents — Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                    | Wahrscheinliche Ursache                                                         | Lösung                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Backend-Plugin fehlt oder ist deaktiviert.                                      | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP ist global deaktiviert.                                                     | `acp.enabled=true` setzen.                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                       | `acp.dispatch.enabled=true` setzen.                                                                                                                                          |
| `ACP agent "<id>" is not allowed by policy`                                | Agent steht nicht auf der Allowlist.                                            | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                        |
| `Unable to resolve session target: ...`                                    | Ungültiges Schlüssel-/ID-/Label-Token.                                          | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen.                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.               | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebunden starten.                                                                                              |
| `Conversation bindings are unavailable for <channel>.`                     | Adapter unterstützt keine ACP-Bindung an die aktuelle Konversation.             | `/acp spawn ... --thread ...` verwenden, sofern unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder zu einem unterstützten Kanal wechseln.                     |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Ein anderer Benutzer besitzt das aktive Bindungsziel.                           | Als Owner neu binden oder eine andere Konversation bzw. einen anderen Thread verwenden.                                                                                      |
| `Thread bindings are unavailable for <channel>.`                           | Adapter unterstützt keine Thread-Bindung.                                       | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | ACP-Runtime läuft auf Host-Seite; die anfragende Sitzung läuft in einer Sandbox. | `runtime="subagent"` aus Sitzungen in der Sandbox verwenden oder den ACP-Start aus einer Sitzung ohne Sandbox ausführen.                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | `sandbox="require"` wurde für die ACP-Runtime angefordert.                      | `runtime="subagent"` für erforderliche Sandbox-Ausführung verwenden oder ACP mit `sandbox="inherit"` aus einer Sitzung ohne Sandbox verwenden.                              |
| Fehlende ACP-Metadaten für gebundene Sitzung                               | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                      | Mit `/acp spawn` neu erstellen und dann Thread erneut binden/fokussieren.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode` blockiert Schreib-/Ausführungsaktionen in einer nicht interaktiven ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Konfiguration von Berechtigungen](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt früh fehl und liefert kaum Ausgabe                     | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für vollständige Berechtigungen `permissionMode=approve-all` setzen; für kontrollierten Abbau `nonInteractivePermissions=deny` setzen. |
| ACP-Sitzung hängt nach Abschluss der Arbeit unbegrenzt                     | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                                   |

## Verwandt

- [Sub-Agents](/de/tools/subagents)
- [Sandbox-Tools für mehrere Agents](/de/tools/multi-agent-sandbox-tools)
- [Agent send](/de/tools/agent-send)
