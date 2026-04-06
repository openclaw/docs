---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Eine Konversation eines Nachrichtenkanals an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Befehle `/acp` aus dem Chat heraus bedienen
summary: ACP-Laufzeitsitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agenten verwenden
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-06T03:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302f3fe25b1ffe0576592b6e0ad9e8a5781fa5702b31d508d9ba8908f7df33bd
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agenten

Sitzungen mit dem [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Laufzeit weiterleiten (nicht an die native Subagent-Laufzeit). Jeder Spawn einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) erfasst.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client direkt
eine Verbindung zu bestehenden OpenClaw-Kanalunterhaltungen herstellen, verwenden Sie
statt ACP [`openclaw mcp serve`](/cli/mcp).

## Welche Seite brauche ich?

Es gibt drei ähnliche Bereiche, die leicht verwechselt werden können:

| Sie möchten...                                                                     | Verwenden Sie dies            | Hinweise                                                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agenten      | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerung |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen      | [`openclaw acp`](/cli/acp)    | Bridge-Modus. IDE/Client spricht über stdio/WebSocket ACP mit OpenClaw                                              |

## Funktioniert das sofort?

In der Regel ja.

- Frische Installationen liefern jetzt das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert mit.
- Das gebündelte Plugin `acpx` bevorzugt seine Plugin-lokale fixierte Binärdatei `acpx`.
- Beim Start prüft OpenClaw diese Binärdatei und repariert sie bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was bei der ersten Verwendung trotzdem passieren kann:

- Ein Adapter für ein Ziel-Harness kann beim ersten Verwenden dieses Harnesses bei Bedarf mit `npx` abgerufen werden.
- Die Auth des Anbieters muss auf dem Host für dieses Harness weiterhin vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugang hat, können Adapter-Abrufe beim ersten Lauf fehlschlagen, bis Caches vorgewärmt wurden oder der Adapter auf andere Weise installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter muss möglicherweise trotzdem beim ersten Lauf abgerufen werden.
- `/acp spawn claude`: dieselbe Situation für den Claude-ACP-Adapter, plus Claude-seitige Auth auf diesem Host.

## Schneller Operator-Ablauf

Verwenden Sie dies, wenn Sie ein praktisches Runbook für `/acp` möchten:

1. Eine Sitzung starten:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder im Thread arbeiten (oder diese Sitzung explizit über ihren Sitzungsschlüssel ansprechen).
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
- „Starte hier in einem Thread eine persistente Codex-Sitzung und halte sie fokussiert.“
- „Führe das als einmalige Claude Code ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und halte Nachfassaktionen im selben Workspace.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und behalte Nachfassaktionen dann in demselben Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` auswählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Konversation angefordert wurde und der aktive Kanal dies unterstützt, die ACP-Sitzung an diese Konversation binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wurde und der aktuelle Kanal dies unterstützt, die ACP-Sitzung an den Thread binden.
5. Nachfolgende gebundene Nachrichten an dieselbe ACP-Sitzung weiterleiten, bis sie defokussiert/geschlossen/abgelaufen ist.

## ACP versus Subagenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie Subagenten, wenn Sie von OpenClaw nativ delegierte Ausführungen möchten.

| Bereich       | ACP-Sitzung                           | Subagent-Ausführung                 |
| ------------- | ------------------------------------- | ----------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Subagent-Laufzeit   |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Subagenten](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Kontroll-Ebene
2. gebündeltes Laufzeit-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Laufzeit-/Sitzungs-Mechanik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerung, Sitzungsfortsetzung, Nachverfolgung von Hintergrundaufgaben und optionaler Konversations-/Thread-Bindung.
  Für Operatoren gilt in der Praxis:

- Wenn Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit möchten: Verwenden Sie ACP

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

Verwenden Sie `/acp spawn <harness> --bind here`, wenn die aktuelle Konversation zu einem dauerhaften ACP-Workspace werden soll, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw behält die Kontrolle über Kanaltransport, Auth, Sicherheit und Zustellung.
- Die aktuelle Konversation wird an den gestarteten ACP-Sitzungsschlüssel angeheftet.
- Folgemeldungen in dieser Konversation werden an dieselbe ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung an die aktuelle Konversation.

Was das praktisch bedeutet:

- `--bind here` behält dieselbe Chatoberfläche bei. In Discord bleibt der aktuelle Kanal der aktuelle Kanal.
- `--bind here` kann trotzdem eine neue ACP-Sitzung erstellen, wenn Sie neue Arbeit starten. Die Bindung heftet diese Sitzung an die aktuelle Konversation.
- `--bind here` erstellt nicht von selbst einen untergeordneten Discord-Thread oder ein Telegram-Thema.
- Die ACP-Laufzeit kann trotzdem ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen vom Backend verwalteten Workspace auf dem Datenträger haben. Dieser Laufzeit-Workspace ist von der Chatoberfläche getrennt und impliziert keinen neuen Messaging-Thread.
- Wenn Sie zu einem anderen ACP-Agenten spawnen und kein `--cwd` übergeben, übernimmt OpenClaw standardmäßig den Workspace des **Zielagenten**, nicht den des Anfragenden.
- Wenn dieser übernommene Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), greift OpenClaw auf das Standard-`cwd` des Backends zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der übernommene Workspace existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt der Spawn den tatsächlichen Zugriffsfehler zurück, statt `cwd` zu verwerfen.

Gedankenmodell:

- Chatoberfläche: wo die Menschen weiterreden (`Discord-Kanal`, `Telegram-Thema`, `iMessage-Chat`)
- ACP-Sitzung: der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet
- untergeordneter Thread/Thema: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Laufzeit-Workspace: der Speicherort im Dateisystem, in dem das Harness läuft (`cwd`, Repo-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Sitzung starten oder anhängen und zukünftige Nachrichten hierhin an sie weiterleiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/ein Thema erstellen und die ACP-Sitzung daran binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindung an die aktuelle Konversation:

- Chat-/Nachrichtenkanäle, die die Bindung an die aktuelle Konversation unterstützen, können `--bind here` über den gemeinsamen Konversations-Bindungspfad verwenden.
- Kanäle mit eigener Thread-/Themen-Semantik können hinter derselben gemeinsamen Schnittstelle weiterhin kanalspezifische Kanonisierung bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation direkt binden“.
- Generische Bindungen an die aktuelle Konversation verwenden den gemeinsamen OpenClaw-Bindungsspeicher und überleben normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- In Discord bindet `--bind here` den aktuellen Kanal oder Thread direkt. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Kanal keine ACP-Bindungen an die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung zur fehlenden Unterstützung zurück.
- `resume` und Fragen nach einer „neuen Sitzung“ betreffen ACP-Sitzungen, nicht Kanäle. Sie können den Laufzeitzustand wiederverwenden oder ersetzen, ohne die aktuelle Chatoberfläche zu ändern.

### Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal-Adapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Folgemeldungen in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
- ACP-Ausgaben werden zurück in denselben Thread zugestellt.
- Defokussieren/Schließen/Archivieren/Idle-Timeout oder Ablauf nach Maximalalter entfernt die Bindung.

Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanal-Adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare Meldung zu fehlender Unterstützung/Nichtverfügbarkeit zurück.

Erforderliche Feature-Flags für threadgebundene ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um ACP-Dispatch anzuhalten)
- ACP-Thread-Spawn-Flag des Kanal-Adapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanal-Adapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
- Derzeit integrierte Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Themen (Forenthemen in Gruppen/Supergruppen und DM-Themen)
- Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

## Kanalspezifische Einstellungen

Für nicht-ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in `bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

- `bindings[].type="acp"` markiert eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forenthema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die besitzende OpenClaw-Agent-ID.
- Optionale ACP-Overrides liegen unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Laufzeitstandards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standardwerte einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Override-Priorität für gebundene ACP-Sitzungen:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globale ACP-Standardwerte (zum Beispiel `acp.backend`)

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
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Laufzeitbindungen (zum Beispiel durch Thread-Fokus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Bei kanalübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Zielagenten-Workspace aus der Agent-Konfiguration.
- Fehlende übernommene Workspace-Pfade greifen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler auf vorhandene Pfade werden als Spawn-Fehler ausgegeben.

## ACP-Sitzungen starten (Schnittstellen)

### Über `sessions_spawn`

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

- `runtime` ist standardmäßig `subagent`; setzen Sie für ACP-Sitzungen also explizit `runtime: "acp"`.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Details der Schnittstelle:

- `task` (erforderlich): anfänglicher Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
- `thread` (optional, Standard `false`): fordert den Thread-Bindungsablauf an, sofern unterstützt.
- `mode` (optional): `run` (einmalig) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Arbeitsverzeichnis der Laufzeit (validiert durch Backend-/Laufzeitrichtlinie). Wenn es weggelassen wird, übernimmt der ACP-Spawn den Zielagenten-Workspace, sofern konfiguriert; fehlende übernommene Pfade greifen auf Backend-Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitiges Label, das im Sitzungs-/Bannertext verwendet wird.
- `resumeSessionId` (optional): eine vorhandene ACP-Sitzung fortsetzen, statt eine neue zu erstellen. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ein. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Fortschrittszusammenfassungen des anfänglichen ACP-Laufs als Systemereignisse zurück an die anfordernde Sitzung.
  - Falls verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein JSONL-Protokoll mit Sitzungsbezug (`<sessionId>.acp-stream.jsonl`) zeigt, das Sie für den vollständigen Relay-Verlauf verfolgen können.

### Eine vorhandene Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ein und macht damit mit vollem Kontext dessen weiter, was vorher war.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop an das Telefon übergeben — bitten Sie Ihren Agenten, dort weiterzumachen, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, jetzt headless über Ihren Agenten
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — bei Verwendung mit der Subagent-Laufzeit wird ein Fehler zurückgegeben.
- `resumeSessionId` stellt den Upstream-ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Zielagent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Rückfall auf eine neue Sitzung.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie eine schnelle Live-Prüfung möchten, dass ACP-Spawn
tatsächlich Ende-zu-Ende funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Die Version/den Commit des bereitgestellten Gateways auf dem Zielhost prüfen.
2. Bestätigen, dass der bereitgestellte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agenten bitten, `sessions_spawn` mit Folgendem aufzurufen:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - Aufgabe: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Überprüfen, dass der Agent Folgendes meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Die temporäre ACPX-Bridge-Sitzung bereinigen.

Beispiel-Prompt für den Live-Agenten:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halten Sie diesen Smoke-Test auf `mode: "run"`, sofern Sie nicht absichtlich
  persistente ACP-Sitzungen mit Thread-Bindung testen.
- Verlangen Sie für das grundlegende Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  Fähigkeiten der anfordernden Sitzung ab und ist eine separate Integrationsprüfung.
- Behandeln Sie Tests für threadgebundenes `mode: "session"` als zweiten, umfangreicheren Integrationsdurchlauf aus einem echten Discord-Thread oder Telegram-Thema.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine durch die Sandbox erzwungene Ausführung benötigen.

### Über den Befehl `/acp`

Verwenden Sie `/acp spawn`, wenn Sie explizite Operator-Steuerung aus dem Chat benötigen.

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

Die meisten Aktionen unter `/acp` akzeptieren optional ein Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Reihenfolge der Auflösung:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine sitzungs-ID im UUID-Format
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Rückfall auf die aktuelle anfordernde Sitzung

Sowohl Bindungen an die aktuelle Konversation als auch Thread-Bindungen nehmen an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Bindungsmodi beim Spawn

`/acp spawn` unterstützt `--bind here|off`.

| Modus  | Verhalten                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| `here` | Die aktuelle aktive Konversation direkt binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Keine Bindung an die aktuelle Konversation erstellen.                        |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat an Codex anbinden“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur in Kanälen verfügbar, die Bindung an die aktuelle Konversation unterstützen.
- `--bind` und `--thread` können nicht im selben Aufruf von `/acp spawn` kombiniert werden.

## Thread-Modi beim Spawn

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus  | Verhalten                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: bei Unterstützung einen untergeordneten Thread erstellen/binden. |
| `here` | Aktiven aktuellen Thread verlangen; fehlschlagen, wenn Sie sich nicht in einem Thread befinden.       |
| `off`  | Keine Bindung. Sitzung startet ungebunden.                                                             |

Hinweise:

- Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten faktisch `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen untergeordneten Thread zu erstellen.

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

`/acp status` zeigt die effektiven Laufzeitoptionen und, sofern verfügbar, sowohl Sitzungskennungen auf Laufzeit- als auch auf Backend-Ebene.

Einige Steuerungen hängen von den Fähigkeiten des Backends ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren unsupported-control-Fehler zurück.

## Cookbook für ACP-Befehle

| Befehl               | Was er tut                                                 | Beispiel                                                      |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an laufende Sitzung senden.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.              | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Laufzeitoptionen, Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung setzen.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Generisches Schreiben einer Laufzeitkonfigurationsoption.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Override für das Arbeitsverzeichnis der Laufzeit setzen.   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für die Freigaberichtlinie setzen.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout setzen (Sekunden).                        | `/acp timeout 120`                                            |
| `/acp model`         | Laufzeit-Override für das Modell setzen.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Laufzeit-Overrides der Sitzung entfernen.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Speicher auflisten.         | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Behebungen.       | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp sessions` liest den Speicher für die aktuell gebundene oder anfordernde Sitzung. Befehle, die Tokens `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über die Gateway-Sitzungserkennung auf, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

## Zuordnung von Laufzeitoptionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Laufzeitkonfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Laufzeitkonfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Laufzeitkonfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert den Laufzeit-Override für `cwd` direkt.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Override-Pfad für `cwd`.
- `/acp reset-options` löscht alle Laufzeit-Overrides für die Zielsitzung.

## Unterstützung für acpx-Harnesses (aktuell)

Aktuelle integrierte Harness-Aliasse von acpx:

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

Wenn OpenClaw das Backend acpx verwendet, sollten Sie diese Werte für `agentId` bevorzugen, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie stattdessen den Befehl des Agents `cursor` in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Nutzung der acpx-CLI kann auch beliebige Adapter über `--agent <command>` ansprechen, aber dieser rohe Escape-Hatch ist eine Funktion der acpx-CLI (nicht des normalen `agentId`-Pfads von OpenClaw).

## Erforderliche Konfiguration

ACP-Baseline im Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; setzen Sie false, um ACP-Dispatch anzuhalten und /acp-Steuerungen beizubehalten.
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

Die Konfiguration für Thread-Bindungen ist spezifisch für den Kanal-Adapter. Beispiel für Discord:

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

Bindungen an die aktuelle Konversation erfordern keine Erstellung eines untergeordneten Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanal-Adapter, der ACP-Konversationsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das Backend acpx

Frische Installationen liefern das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert mit, daher
funktioniert ACP normalerweise ohne manuellen Installationsschritt für Plugins.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` abgelehnt oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie anschließend den Zustand des Backends:

```text
/acp doctor
```

### Konfiguration von Befehl und Version für acpx

Standardmäßig verwendet das gebündelte Backend-Plugin acpx (`acpx`) die Plugin-lokale fixierte Binärdatei:

1. Der Befehl verwendet standardmäßig die Plugin-lokale `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version verwendet standardmäßig den Pin der Erweiterung.
3. Beim Start registriert OpenClaw das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrund-Ensure-Job prüft `acpx --version`.
5. Wenn die Plugin-lokale Binärdatei fehlt oder nicht passt, führt es Folgendes aus:
   `npm install --omit=dev --no-save acpx@<pinned>` und prüft anschließend erneut.

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
- `expectedVersion: "any"` deaktiviert striktes Versions-Matching.
- Wenn `command` auf eine benutzerdefinierte Binärdatei/einen benutzerdefinierten Pfad zeigt, ist die automatische Plugin-lokale Installation deaktiviert.
- Der OpenClaw-Start bleibt nicht blockierend, während die Zustandsprüfung des Backends läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-
Laufzeitabhängigkeiten (plattformabhängige Binärdateien) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen **keine** von OpenClaw durch Plugins registrierten Tools für
das ACP-Harness bereit.

Wenn Sie möchten, dass ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory recall/store aufrufen können, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen integrierten MCP-Server mit dem Namen `openclaw-plugin-tools` in den
  Bootstrap von ACPX-Sitzungen.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harnesses.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die im Gateway bereits aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie das Zulassen der Ausführung dieser Plugins in
  OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Bridge für Plugin-Tools ist eine
zusätzliche optionale Komfortfunktion, kein Ersatz für die generische Konfiguration von MCP-Servern.

## Konfiguration von Berechtigungen

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Prompt-Anfragen für Dateischreib- und Shell-Ausführungsberechtigungen zu bestätigen oder abzulehnen. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie mit Berechtigungen umgegangen wird:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Freigaben und getrennt von Vendor-Bypass-Flags des CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Rückfrage ausführen kann.

| Wert            | Verhalten                                                        |
| --------------- | ---------------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch freigeben. |
| `approve-reads` | Nur Lesevorgänge automatisch freigeben; Schreibvorgänge und exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungsanfragen ablehnen.                             |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsanfrage angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                          |
| ------ | ------------------------------------------------------------------ |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**            |
| `deny` | Die Berechtigung stillschweigend verweigern und fortfahren (Graceful Degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreibvorgang oder exec, der eine Berechtigungsanfrage auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen kontrolliert degradiert werden, statt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                             | Behebung                                                                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                          | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                         | `acp.enabled=true` setzen.                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                           | `acp.dispatch.enabled=true` setzen.                                                                                                                                   |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent befindet sich nicht in der Allowlist.                                         | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                   |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                              | `/acp sessions` ausführen, exakten Schlüssel/Label kopieren, erneut versuchen.                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                    | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine ACP-Bindungsfähigkeit für aktuelle Konversationen.                | `/acp spawn ... --thread ...` verwenden, sofern unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder zu einem unterstützten Kanal wechseln.               |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                    | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                               | Als Besitzer erneut binden oder eine andere Konversation/einen anderen Thread verwenden.                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Fähigkeit für Thread-Bindung.                                     | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Laufzeit läuft auf dem Host; die anfordernde Sitzung ist in einer Sandbox.      | `runtime="subagent"` aus Sandbox-Sitzungen verwenden oder ACP-Spawn aus einer Sitzung ohne Sandbox ausführen.                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Laufzeit angefordert.                             | Für zwingende Sandbox `runtime="subagent"` verwenden oder ACP mit `sandbox="inherit"` aus einer Sitzung ohne Sandbox verwenden.                                       |
| Fehlende ACP-Metadaten für gebundene Sitzung                                | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                          | Mit `/acp spawn` neu erstellen und dann Thread erneut binden/fokussieren.                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreibvorgänge/exec in nicht interaktiver ACP-Sitzung.  | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Konfiguration von Berechtigungen](#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                             | Berechtigungsanfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Protokolle auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für kontrollierte Degradation `nonInteractivePermissions=deny`. |
| ACP-Sitzung bleibt nach Abschluss der Arbeit unendlich hängen               | Der Harness-Prozess wurde beendet, aber die ACP-Sitzung meldete keinen Abschluss.   | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                              |
