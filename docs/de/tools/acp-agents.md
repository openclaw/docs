---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Unterhaltungsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Eine Unterhaltung auf einem Nachrichtenkanal an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Debuggen der ACP-Abschlusszustellung oder von Agent-zu-Agent-Schleifen
    - '`/acp`-Befehle aus dem Chat heraus verwenden'
summary: ACP-Laufzeitsitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agents verwenden
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T06:35:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4c4c38e7a93c240f6bf30a4cc093e8717ef6459425d56a9287245adc625e51
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

Sitzungen des [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Laufzeit weiterleiten (nicht an die native Sub-Agent-Laufzeit). Jeder Spawn einer ACP-Sitzung wird als [Hintergrundtask](/de/automation/tasks) verfolgt.

Wenn Codex oder Claude Code als externer MCP-Client direkt
zu vorhandenen OpenClaw-Kanalunterhaltungen verbinden sollen, verwenden Sie stattdessen
[`openclaw mcp serve`](/de/cli/mcp) statt ACP.

## Welche Seite brauche ich?

Es gibt drei nahe Oberflächen, die leicht verwechselt werden:

| Sie möchten...                                                                        | Verwenden Sie dies                     | Hinweise                                                                                                             |
| ------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI oder eine andere externe Harness _durch_ OpenClaw ausführen | Diese Seite: ACP Agents                | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundtasks, Laufzeitsteuerungen |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/de/cli/acp)             | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                              |
| Eine lokale KI-CLI als reine Text-Fallback-Modell wiederverwenden                     | [CLI Backends](/de/gateway/cli-backends)  | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Laufzeit                                      |

## Funktioniert das direkt nach der Installation?

Meistens ja.

- Neue Installationen liefern jetzt das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus.
- Das gebündelte Plugin `acpx` bevorzugt sein pluginlokales angeheftetes `acpx`-Binary.
- Beim Start prüft OpenClaw dieses Binary und repariert es bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was bei der ersten Verwendung trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann beim ersten Verwenden dieser Harness bei Bedarf mit `npx` geladen werden.
- Vendor-Auth muss auf dem Host für diese Harness weiterhin vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugang hat, können Adapter-Downloads beim ersten Lauf fehlschlagen, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrapen, aber der Codex-ACP-Adapter kann trotzdem noch einen First-Run-Download benötigen.
- `/acp spawn claude`: dieselbe Situation für den Claude-ACP-Adapter, plus Claude-seitige Auth auf diesem Host.

## Schneller Ablauf für Operatoren

Verwenden Sie dies, wenn Sie ein praktisches `/acp`-Runbook möchten:

1. Eine Sitzung starten:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Unterhaltung oder dem Thread arbeiten (oder diesen Sitzungsschlüssel explizit ansprechen).
3. Laufzeitstatus prüfen:
   - `/acp status`
4. Laufzeitoptionen nach Bedarf anpassen:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Eine aktive Sitzung anstoßen, ohne den Kontext zu ersetzen:
   - `/acp steer tighten logging and continue`
6. Arbeit beenden:
   - `/acp cancel` (aktuellen Turn stoppen), oder
   - `/acp close` (Sitzung schließen + Bindungen entfernen)

## Schnellstart für Menschen

Beispiele für natürliche Anfragen:

- „Binde diesen Discord-Kanal an Codex.“
- „Starte hier eine persistente Codex-Sitzung in einem Thread und halte sie fokussiert.“
- „Führe das als einmalige Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und halte Folgeanfragen im selben Workspace.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und halte Folgeanfragen dann in demselben Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` auswählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Unterhaltung angefordert wurde und der aktive Kanal dies unterstützt, die ACP-Sitzung an diese Unterhaltung binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wurde und der aktuelle Kanal dies unterstützt, die ACP-Sitzung an den Thread binden.
5. Folge-Nachrichten mit Bindung an dieselbe ACP-Sitzung weiterleiten, bis sie entfokussiert/geschlossen/abgelaufen ist.

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie Sub-Agents, wenn Sie OpenClaw-native delegierte Läufe möchten.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Lauf                     |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Control-Plane
2. gebündeltes Laufzeit-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Laufzeit-/Sitzungsmechanik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerungen, Sitzungsfortsetzung, Hintergrundtask-Verfolgung und optionaler Gesprächs-/Thread-Bindung.
- CLI Backends sind separate lokale reine Text-Fallback-Laufzeiten. Siehe [CLI Backends](/de/gateway/cli-backends).

Für Operatoren gilt praktisch:

- wenn Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit möchten: ACP verwenden
- wenn Sie einfachen lokalen Text-Fallback über die rohe CLI möchten: CLI Backends verwenden

## Gebundene Sitzungen

### Bindungen an die aktuelle Unterhaltung

Verwenden Sie `/acp spawn <harness> --bind here`, wenn die aktuelle Unterhaltung zu einem dauerhaften ACP-Workspace werden soll, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw behält die Verantwortung für Kanaltransport, Auth, Sicherheit und Zustellung.
- Die aktuelle Unterhaltung wird an den gestarteten ACP-Sitzungsschlüssel angeheftet.
- Folge-Nachrichten in dieser Unterhaltung werden an dieselbe ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung der aktuellen Unterhaltung.

Was das in der Praxis bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche bei. Auf Discord bleibt der aktuelle Kanal der aktuelle Kanal.
- `--bind here` kann trotzdem eine neue ACP-Sitzung erstellen, wenn Sie neue Arbeit starten. Die Bindung hängt diese Sitzung an die aktuelle Unterhaltung.
- `--bind here` erstellt nicht von sich aus einen untergeordneten Discord-Thread oder ein Telegram-Thema.
- Die ACP-Laufzeit kann weiterhin ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen backendverwalteten Workspace auf der Platte haben. Dieser Laufzeit-Workspace ist getrennt von der Chat-Oberfläche und impliziert keinen neuen Nachrichten-Thread.
- Wenn Sie an einen anderen ACP-Agent spawnen und `--cwd` nicht übergeben, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agent**, nicht den des Anfragenden.
- Wenn dieser übernommene Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), fällt OpenClaw auf das Standard-`cwd` des Backends zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der übernommene Workspace existiert, aber nicht zugreifbar ist (zum Beispiel `EACCES`), gibt der Spawn den echten Zugriffsfehler zurück, statt `cwd` zu verwerfen.

Mentales Modell:

- Chat-Oberfläche: wo Menschen weiterreden (`Discord-Kanal`, `Telegram-Thema`, `iMessage-Chat`)
- ACP-Sitzung: der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet
- untergeordneter Thread/Thema: eine optionale zusätzliche Nachrichtenoberfläche, die nur durch `--thread ...` erstellt wird
- Laufzeit-Workspace: der Dateisystemort, an dem die Harness läuft (`cwd`, Repo-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Sitzung starten oder daran anhängen und künftige Nachrichten hierhin an sie leiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/ein Thema erstellen und die ACP-Sitzung dort binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindung an die aktuelle Unterhaltung:

- Chat-/Nachrichtenkanäle, die Bindung an die aktuelle Unterhaltung unterstützen, können `--bind here` über den gemeinsamen Pfad für Gesprächsbindungen verwenden.
- Kanäle mit benutzerdefinierter Thread-/Themen-Semantik können weiterhin kanalspezifische Kanonisierung hinter derselben gemeinsamen Schnittstelle bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Unterhaltung direkt binden“.
- Generische Bindungen an die aktuelle Unterhaltung verwenden den gemeinsamen OpenClaw-Bindungsspeicher und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Kanal oder Thread direkt. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Kanal keine ACP-Bindungen an die aktuelle Unterhaltung bereitstellt, gibt OpenClaw eine klare Meldung über fehlende Unterstützung zurück.
- `resume` und Fragen nach „neuer Sitzung“ sind ACP-Sitzungsfragen, keine Kanalfragen. Sie können Laufzeitzustand wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal-Adapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Folge-Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
- ACP-Ausgabe wird an denselben Thread zurückgeliefert.
- Entfokussieren/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf des Maximalalters entfernt die Bindung.

Die Unterstützung für Thread-Bindungen ist adapterabhängig. Wenn der aktive Kanal-Adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare Meldung über fehlende Unterstützung/Nichtverfügbarkeit zurück.

Erforderliche Feature-Flags für threadgebundene ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (auf `false` setzen, um ACP-Dispatch zu pausieren)
- ACP-Thread-Spawn-Flag des Kanal-Adapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanal-Adapter, der Capability für Sitzungs-/Thread-Bindung bereitstellt.
- Aktuelle eingebaute Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Themen (Forum-Themen in Gruppen/Supergroups und DM-Themen)
- Plugin-Kanäle können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

## Kanalspezifische Einstellungen

Für nicht ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in Top-Level-Einträgen `bindings[]`.

### Bindungsmodell

- `bindings[].type="acp"` markiert eine persistente ACP-Unterhaltungsbindung.
- `bindings[].match` identifiziert die Zielunterhaltung:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forum-Thema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM-/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM-/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die besitzende OpenClaw-Agent-ID.
- Optionale ACP-Overrides liegen unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Laufzeitstandards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorität von Overrides für gebundene ACP-Sitzungen:

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

- OpenClaw stellt vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung existiert.
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Laufzeitbindungen (zum Beispiel erstellt durch Thread-Focus-Abläufe) gelten weiterhin, sofern vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agent aus der Agent-Konfiguration.
- Fehlende übernommene Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; echte Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler angezeigt.

## ACP-Sitzungen starten (Schnittstellen)

### Aus `sessions_spawn`

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

- `runtime` ist standardmäßig `subagent`, setzen Sie also `runtime: "acp"` explizit für ACP-Sitzungen.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Unterhaltung beizubehalten.

Details zur Schnittstelle:

- `task` (erforderlich): anfänglicher Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
- `thread` (optional, Standard `false`): fordert, wo unterstützt, den Ablauf für Thread-Bindung an.
- `mode` (optional): `run` (einmalig) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` gesetzt ist und `mode` weggelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Arbeitsverzeichnis der Laufzeit (validiert durch Backend-/Laufzeitrichtlinie). Wenn es weggelassen wird, übernimmt der ACP-Spawn den Workspace des Ziel-Agent, sofern konfiguriert; fehlende übernommene Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitiges Label, das in Sitzungs-/Bannertext verwendet wird.
- `resumeSessionId` (optional): eine vorhandene ACP-Sitzung fortsetzen, statt eine neue zu erstellen. Der Agent spielt seinen Gesprächsverlauf über `session/load` erneut ab. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Zusammenfassungen des Fortschritts des anfänglichen ACP-Laufs als Systemereignisse zurück an die anfordernde Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll (`<sessionId>.acp-stream.jsonl`) zeigt, das Sie für den vollständigen Relay-Verlauf verfolgen können.

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder hintergrundseitige, dem Parent gehörende Arbeit sein. Der Zustellungspfad hängt von dieser Form ab.

### Interaktive ACP-Sitzungen

Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche weiterzureden:

- `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
- `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
- Persistente konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

Folge-Nachrichten in der gebundenen Unterhaltung werden direkt an die ACP-Sitzung weitergeleitet, und ACP-Ausgabe wird an denselben Kanal/Thread/dasselbe Thema zurückgeliefert.

### Dem Parent gehörende einmalige ACP-Sitzungen

Einmalige ACP-Sitzungen, die von einem anderen Agent-Lauf gestartet werden, sind Hintergrund-Kinder, ähnlich wie Sub-Agents:

- Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
- Das Kind läuft in seiner eigenen ACP-Harness-Sitzung.
- Der Abschluss wird über den internen Pfad zur Ankündigung des Task-Abschlusses zurückgemeldet.
- Der Parent formuliert das Ergebnis des Kindes in normaler Assistentenstimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

Behandeln Sie diesen Pfad nicht als Peer-to-Peer-Chat zwischen Parent und Kind. Das Kind hat bereits einen Abschlusskanal zurück zum Parent.

### `sessions_send` und A2A-Zustellung

`sessions_send` kann nach dem Spawn eine andere Sitzung ansprechen. Für normale Peer-Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-Follow-up-Pfad (A2A):

- auf die Antwort der Zielsitzung warten
- dem Anfragenden und dem Ziel optional eine begrenzte Anzahl von Folge-Turns erlauben
- das Ziel bitten, eine Ankündigungsnachricht zu erzeugen
- diese Ankündigung an den sichtbaren Kanal oder Thread zustellen

Dieser A2A-Pfad ist ein Fallback für Peer-Sendungen, wenn der Sender ein sichtbares Follow-up benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten Einstellungen von `tools.sessions.visibility`.

OpenClaw überspringt das A2A-Follow-up nur dann, wenn der Anfragende der Parent seines eigenen, dem Parent gehörenden einmaligen ACP-Kinds ist. In diesem Fall kann A2A zusätzlich zum Task-Abschluss den Parent mit dem Ergebnis des Kindes aufwecken, die Antwort des Parent zurück an das Kind weiterleiten und eine Echo-Schleife zwischen Parent und Kind erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall eines besessenen Kinds `delivery.status="skipped"`, weil der Abschlusspfad bereits für das Ergebnis verantwortlich ist.

### Eine vorhandene Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Gesprächsverlauf über `session/load` erneut ab, sodass er mit dem vollständigen Kontext dessen fortfährt, was vorher geschah.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop ans Telefon übergeben — den Agent bitten, dort weiterzumachen, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, jetzt headless über Ihren Agent
- Arbeit wiederaufnehmen, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Sub-Agent-Laufzeit verwendet wird.
- `resumeSessionId` stellt den vorgelagerten ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stillschweigender Fallback auf eine neue Sitzung.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie schnell live prüfen möchten, dass ACP-Spawn tatsächlich Ende-zu-Ende funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Die bereitgestellte Gateway-Version/den Commit auf dem Zielhost prüfen.
2. Bestätigen, dass der bereitgestellte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agent öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agent bitten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - Task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Prüfen, dass der Agent meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Die temporäre ACPX-Bridge-Sitzung bereinigen.

Beispiel-Prompt an den Live-Agent:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halten Sie diesen Smoke-Test bei `mode: "run"`, sofern Sie nicht absichtlich
  persistente threadgebundene ACP-Sitzungen testen.
- Verlangen Sie für das Baseline-Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  den Fähigkeiten der anfordernden Sitzung/des Anfragenden ab und ist eine separate Integrationsprüfung.
- Betrachten Sie threadgebundene Tests mit `mode: "session"` als zweiten, reichhaltigeren Integrations-
  durchlauf aus einem echten Discord-Thread oder Telegram-Thema.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine sandbox-erzwungene Ausführung benötigen.

### Aus dem Befehl `/acp`

Verwenden Sie `/acp spawn` für explizite Operator-Steuerung aus dem Chat heraus, wenn nötig.

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

Siehe [Slash Commands](/de/tools/slash-commands).

## Auflösung des Sitzungsziels

Die meisten Aktionen von `/acp` akzeptieren ein optionales Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Auflösungsreihenfolge:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann die wie eine UUID geformte Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfordernde Sitzung

Bindungen an die aktuelle Unterhaltung und Thread-Bindungen nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bindungsmodi

`/acp spawn` unterstützt `--bind here|off`.

| Modus  | Verhalten                                                               |
| ------ | ----------------------------------------------------------------------- |
| `here` | Die aktuelle aktive Unterhaltung direkt binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Keine Bindung an die aktuelle Unterhaltung erstellen.                   |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat Codex-gestützt machen“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die Bindung an die aktuelle Unterhaltung unterstützen.
- `--bind` und `--thread` können im selben Aufruf von `/acp spawn` nicht kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus  | Verhalten                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, sofern unterstützt. |
| `here` | Aktiven aktuellen Thread voraussetzen; fehlschlagen, wenn Sie sich nicht in einem befinden.           |
| `off`  | Keine Bindung. Sitzung startet ungebunden.                                                             |

Hinweise:

- Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

## ACP-Steuerungen

Verfügbare Befehlsfamilie:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` zeigt die effektiven Laufzeitoptionen und, wenn verfügbar, sowohl Sitzungskennungen auf Laufzeit- als auch auf Backend-Ebene.

Einige Steuerungen hängen von den Fähigkeiten des Backends ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren Fehler für nicht unterstützte Steuerungen zurück.

## Kochbuch für ACP-Befehle

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an eine laufende Sitzung senden.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Laufzeitoptionen und Capabilities anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung setzen.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Generisches Schreiben einer Laufzeit-Konfigurationsoption. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Override für das Arbeitsverzeichnis der Laufzeit setzen.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Freigaberichtlinie setzen.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout setzen (Sekunden).                       | `/acp timeout 120`                                            |
| `/acp model`         | Laufzeit-Override für das Modell setzen.                  | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Laufzeit-Overrides der Sitzung entfernen.                 | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Store auflisten.             | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Integrität, Capabilities, umsetzbare Korrekturen. | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp sessions` liest den Store für die aktuell gebundene oder anfordernde Sitzung. Befehle, die `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über Gateway-Sitzungs-Discovery auf, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

## Zuordnung von Laufzeitoptionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Laufzeit-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Laufzeit-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Laufzeit-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert direkt das `cwd`-Override der Laufzeit.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den `cwd`-Override-Pfad.
- `/acp reset-options` löscht alle Laufzeit-Overrides für die Zielsitzung.

## Unterstützung für `acpx`-Harnesses (aktuell)

Aktuelle eingebaute Harness-Aliase von `acpx`:

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

Wenn OpenClaw das Backend `acpx` verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre `acpx`-Konfiguration keine benutzerdefinierten Agent-Aliase definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agent in Ihrer `acpx`-Konfiguration, statt den eingebauten Standard zu ändern.

Direkte Nutzung der `acpx`-CLI kann auch beliebige Adapter über `--agent <command>` ansprechen, aber diese rohe Escape-Hatch ist eine Funktion der `acpx`-CLI (nicht der normale `agentId`-Pfad von OpenClaw).

## Erforderliche Konfiguration

Core-ACP-Basis:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch zu pausieren, während /acp-Steuerungen erhalten bleiben.
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

Die Konfiguration der Thread-Bindung ist kanaladapterspezifisch. Beispiel für Discord:

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

Wenn threadgebundener ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindungen an die aktuelle Unterhaltung erfordern keine Erstellung eines untergeordneten Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Kanal-Adapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das Backend `acpx`

Neue Installationen liefern das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus, daher funktioniert ACP
normalerweise ohne manuellen Schritt zur Plugin-Installation.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert haben, es über `plugins.allow` / `plugins.deny` abgelehnt haben oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Anschließend die Integrität des Backends prüfen:

```text
/acp doctor
```

### Konfiguration von `acpx`-Befehl und Version

Standardmäßig verwendet das gebündelte `acpx`-Backend-Plugin (`acpx`) das pluginlokale angeheftete Binary:

1. Der Befehl verwendet standardmäßig das pluginlokale `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version wird standardmäßig vom Extension-Pin übernommen.
3. Beim Start registriert sich das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrundjob `ensure` prüft `acpx --version`.
5. Wenn das pluginlokale Binary fehlt oder nicht passt, wird Folgendes ausgeführt:
   `npm install --omit=dev --no-save acpx@<pinned>` und danach erneut geprüft.

Sie können Befehl/Version in der Plugin-Konfiguration überschreiben:

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

Hinweise:

- `command` akzeptiert einen absoluten Pfad, relativen Pfad oder Befehlsnamen (`acpx`).
- Relative Pfade werden vom OpenClaw-Workspace-Verzeichnis aus aufgelöst.
- `expectedVersion: "any"` deaktiviert strenges Versions-Matching.
- Wenn `command` auf ein benutzerdefiniertes Binary/einen benutzerdefinierten Pfad zeigt, wird die pluginlokale Auto-Installation deaktiviert.
- Der OpenClaw-Start bleibt nicht blockierend, während die Integritätsprüfung des Backends läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die `acpx`-
Laufzeitabhängigkeiten (plattformspezifische Binaries) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway dennoch
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen registrierte OpenClaw-Plugin-Tools **nicht** der
ACP-Harness zur Verfügung.

Wenn ACP Agents wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory-Recall/Store aufrufen sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen eingebauten MCP-Server namens `openclaw-plugin-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche der ACP-Harness.
- ACP Agents erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie die Ausführung dieser Plugins
  in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die eingebaute Bridge für Plugin-Tools ist eine
zusätzliche Opt-in-Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen auch eingebaute OpenClaw-Tools **nicht** über
MCP bereit. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP Agent ausgewählte
eingebaute Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen eingebauten MCP-Server namens `openclaw-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt ausgewählte eingebaute OpenClaw-Tools bereit. Der anfängliche Server stellt `cron` bereit.
- Hält die Bereitstellung von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Laufzeit-Timeouts

Das gebündelte Plugin `acpx` setzt für eingebettete Laufzeit-Turns standardmäßig ein
Timeout von 120 Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI genug Zeit, den
ACP-Start und die Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes
Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

### Konfiguration des Agent für Health-Probes

Das gebündelte Plugin `acpx` prüft einen Harness-Agent, während es entscheidet, ob das
eingebettete Laufzeit-Backend bereit ist. Standardmäßig ist das `codex`. Wenn Ihr Deployment
einen anderen Standard-ACP-Agent verwendet, setzen Sie den Probe-Agent auf dieselbe ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Prompts für Berechtigungen zum Schreiben von Dateien oder Ausführen von Shell-Befehlen zu genehmigen oder abzulehnen. Das Plugin `acpx` stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Freigaben und getrennt von Vendor-Bypass-Flags der CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Prompt ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungs-Prompts ablehnen.                     |

### `nonInteractivePermissions`

Steuert, was geschieht, wenn ein Berechtigungs-Prompt angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Die Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**      |
| `deny` | Die Berechtigung stillschweigend ablehnen und fortfahren (graceful degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway nach dem Ändern dieser Werte neu.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Exec-Vorgang, der einen Berechtigungs-Prompt auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradation ausführen, statt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                           | Behebung                                                                                                                                                           |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                        | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                       | `acp.enabled=true` setzen.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                         | `acp.dispatch.enabled=true` setzen.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                 | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                               |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                            | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen.                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                  | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine Capability für ACP-Bindung an die aktuelle Unterhaltung.        | `/acp spawn ... --thread ...` verwenden, wo unterstützt, Top-Level-`bindings[]` konfigurieren oder in einen unterstützten Kanal wechseln.                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                  | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                             | Als Eigentümer erneut binden oder eine andere Unterhaltung bzw. einen anderen Thread verwenden.                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Capability für Thread-Bindungen.                                | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Die ACP-Laufzeit läuft hostseitig; die anfordernde Sitzung ist sandboxed.         | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Laufzeit angefordert.                       | `runtime="subagent"` für erforderliches Sandboxing verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                        |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                        | Mit `/acp spawn` neu erstellen, dann Thread erneut binden/fokussieren.                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreibvorgänge/Exec in einer nicht interaktiven ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Berechtigungskonfiguration](#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungs-Prompts werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Protokolle auf `AcpRuntimeError` prüfen. Für vollständige Berechtigungen `permissionMode=approve-all` setzen; für graceful degradation `nonInteractivePermissions=deny` setzen. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                         |
