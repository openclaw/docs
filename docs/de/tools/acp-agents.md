---
read_when:
    - Ausführen von Coding-Harnesses über ACP
    - Einrichten von gesprächsgebundenen ACP-Sitzungen auf Messaging-Kanälen
    - Binden einer Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Bedienen von `/acp`-Befehlen aus dem Chat
summary: Verwenden Sie ACP-Laufzeitsitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agenten.
title: ACP Agents
x-i18n:
    generated_at: "2026-04-21T13:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agents

Sitzungen des [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Laufzeit weiterleiten (nicht an die native Sub-Agent-Laufzeit). Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Wenn Sie möchten, dass Codex oder Claude Code direkt als externer MCP-Client
mit bestehenden OpenClaw-Kanal-Konversationen verbunden werden, verwenden Sie
anstelle von ACP [`openclaw mcp serve`](/cli/mcp).

## Welche Seite brauche ich?

Es gibt drei nahe verwandte Oberflächen, die leicht verwechselt werden:

| Sie möchten...                                                                     | Verwenden Sie dies                    | Hinweise                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agents               | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerung |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                        |
| Eine lokale AI-CLI als reines Text-Fallback-Modell wiederverwenden                 | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Laufzeit                                  |

## Funktioniert das sofort?

Normalerweise ja.

- Frische Installationen werden jetzt standardmäßig mit aktiviertem gebündelten `acpx`-Laufzeit-Plugin ausgeliefert.
- Das gebündelte `acpx`-Plugin bevorzugt seine pluginlokal angeheftete `acpx`-Binärdatei.
- Beim Start prüft OpenClaw diese Binärdatei und repariert sie bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was bei der ersten Nutzung trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann bei der ersten Verwendung dieses Harnesses bedarfsabhängig mit `npx` abgerufen werden.
- Vendor-Authentifizierung muss auf dem Host für dieses Harness weiterhin vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugang hat, kann das erstmalige Abrufen von Adaptern fehlschlagen, bis die Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wird.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter muss möglicherweise beim ersten Lauf noch abgerufen werden.
- `/acp spawn claude`: dasselbe gilt für den Claude-ACP-Adapter sowie für die Claude-seitige Authentifizierung auf diesem Host.

## Schneller Operator-Ablauf

Verwenden Sie dies, wenn Sie ein praktisches `/acp`-Runbook möchten:

1. Eine Sitzung starten:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder im Thread arbeiten (oder diesen Sitzungsschlüssel explizit ansprechen).
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

- „Diesen Discord-Kanal an Codex binden.“
- „Hier eine persistente Codex-Sitzung in einem Thread starten und fokussiert halten.“
- „Das als One-Shot-Claude-Code-ACP-Sitzung ausführen und das Ergebnis zusammenfassen.“
- „Diesen iMessage-Chat an Codex binden und Folgeanfragen im selben Arbeitsbereich behalten.“
- „Für diese Aufgabe Gemini CLI in einem Thread verwenden und Folgeanfragen dann in demselben Thread behalten.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` wählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Konversation angefordert wird und der aktive Kanal dies unterstützt, die ACP-Sitzung an diese Konversation binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wird und der aktuelle Kanal dies unterstützt, die ACP-Sitzung an den Thread binden.
5. Gebundene Folgenachrichten an dieselbe ACP-Sitzung weiterleiten, bis der Fokus aufgehoben, sie geschlossen oder sie abgelaufen ist.

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie Sub-Agents, wenn Sie OpenClaw-native delegierte Ausführungen möchten.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Ausführung                |
| ------------- | ------------------------------------- | ----------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP sieht der Stack so aus:

1. OpenClaw-ACP-Sitzungs-Steuerungsebene
2. gebündeltes `acpx`-Laufzeit-Plugin
3. Claude-ACP-Adapter
4. Claude-seitige Laufzeit-/Sitzungsmechanik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerung, Sitzungsfortsetzung, Nachverfolgung von Hintergrundaufgaben und optionaler Konversations-/Thread-Bindung.
- CLI-Backends sind separate reine Text-Local-Fallback-Laufzeiten. Siehe [CLI-Backends](/de/gateway/cli-backends).

Für Operatoren lautet die praktische Regel:

- wenn Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerung oder persistente Harness-Arbeit möchten: ACP verwenden
- wenn Sie einfaches lokales Text-Fallback über die rohe CLI möchten: CLI-Backends verwenden

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

Verwenden Sie `/acp spawn <harness> --bind here`, wenn die aktuelle Konversation zu einem dauerhaften ACP-Arbeitsbereich werden soll, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw bleibt Eigentümer von Kanaltransport, Authentifizierung, Sicherheit und Zustellung.
- Die aktuelle Konversation wird an den gestarteten ACP-Sitzungsschlüssel angeheftet.
- Folgenachrichten in dieser Konversation werden an dieselbe ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung an die aktuelle Konversation.

Was das in der Praxis bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche. Auf Discord bleibt der aktuelle Kanal der aktuelle Kanal.
- `--bind here` kann trotzdem eine neue ACP-Sitzung erstellen, wenn Sie frische Arbeit starten. Die Bindung verknüpft diese Sitzung mit der aktuellen Konversation.
- `--bind here` erstellt nicht selbstständig einen untergeordneten Discord-Thread oder ein Telegram-Thema.
- Die ACP-Laufzeit kann weiterhin ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen backendverwalteten Arbeitsbereich auf der Festplatte haben. Dieser Laufzeit-Arbeitsbereich ist von der Chat-Oberfläche getrennt und impliziert keinen neuen Messaging-Thread.
- Wenn Sie zu einem anderen ACP-Agenten starten und `--cwd` nicht übergeben, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**, nicht den des Anforderers.
- Wenn dieser übernommene Arbeitsbereichspfad fehlt (`ENOENT`/`ENOTDIR`), fällt OpenClaw auf das Standard-`cwd` des Backends zurück, anstatt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der übernommene Arbeitsbereich existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt Spawn den tatsächlichen Zugriffsfehler zurück, anstatt `cwd` zu verwerfen.

Mentales Modell:

- Chat-Oberfläche: wo Menschen weiter reden (`Discord-Kanal`, `Telegram-Thema`, `iMessage-Chat`)
- ACP-Sitzung: der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet
- untergeordneter Thread/Thema: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Laufzeit-Arbeitsbereich: der Dateisystemort, an dem das Harness läuft (`cwd`, Repository-Checkout, Backend-Arbeitsbereich)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Sitzung starten oder anhängen und künftige Nachrichten hierhin an sie weiterleiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/ein Thema erstellen und dort die ACP-Sitzung binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindung an die aktuelle Konversation:

- Chat-/Nachrichtenkanäle, die die Bindung an die aktuelle Konversation unterstützen, können `--bind here` über den gemeinsamen Konversations-Bindungspfad verwenden.
- Kanäle mit benutzerdefinierter Thread-/Thema-Semantik können hinter derselben gemeinsamen Schnittstelle weiterhin kanalspezifische Kanonisierung bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation an Ort und Stelle binden“.
- Generische Bindungen an die aktuelle Konversation verwenden den gemeinsamen OpenClaw-Binding-Store und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Kanal oder Thread an Ort und Stelle. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Kanal keine ACP-Bindungen an die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung zurück, dass dies nicht unterstützt wird.
- `resume` und Fragen zu „neuer Sitzung“ sind Fragen zur ACP-Sitzung, nicht zum Kanal. Sie können den Laufzeitzustand wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
- ACP-Ausgaben werden in denselben Thread zurückgeliefert.
- Fokus aufheben/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf des maximalen Alters entfernt die Bindung.

Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanaladapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare Meldung zurück, dass dies nicht unterstützt/verfügbar ist.

Erforderliche Feature-Flags für threadgebundene ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (auf `false` setzen, um ACP-Dispatch zu pausieren)
- ACP-Thread-Spawn-Flag des Kanaladapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
- Aktuelle integrierte Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Themen (Forenthemen in Gruppen/Supergruppen und DM-Themen)
- Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

## Kanalspezifische Einstellungen

Für nicht-ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in Top-Level-Einträgen `bindings[]`.

### Bindungsmodell

- `bindings[].type="acp"` kennzeichnet eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forenthema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Für stabile Gruppenbindungen `chat_id:*` oder `chat_identifier:*` bevorzugen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Für stabile Gruppenbindungen `chat_id:*` bevorzugen.
- `bindings[].agentId` ist die ID des besitzenden OpenClaw-Agenten.
- Optionale ACP-Überschreibungen befinden sich unter `bindings[].acp`:
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

Reihenfolge der Überschreibung für ACP-gebundene Sitzungen:

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
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Laufzeitbindungen (zum Beispiel durch Thread-Focus-Abläufe erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentenübergreifenden ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agentenkonfiguration.
- Fehlende übernommene Arbeitsbereichspfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler ausgegeben.

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
- Wenn `agentId` ausgelassen wird, verwendet OpenClaw `acp.defaultAgent`, falls konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Details zur Schnittstelle:

- `task` (erforderlich): anfänglicher Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
- `thread` (optional, Standard `false`): fordert einen Thread-Bindungsablauf an, sofern unterstützt.
- `mode` (optional): `run` (One-Shot) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` und `mode` ausgelassen werden, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes Verhalten wählen
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Laufzeit-Arbeitsverzeichnis (validiert durch Backend-/Laufzeitrichtlinie). Wenn ausgelassen, übernimmt ACP-Spawn den Arbeitsbereich des Ziel-Agenten, sofern konfiguriert; fehlende übernommene Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): für Operatoren sichtbares Label, das in Sitzungs-/Banner-Text verwendet wird.
- `resumeSessionId` (optional): setzt eine bestehende ACP-Sitzung fort, anstatt eine neue zu erstellen. Der Agent spielt seinen Gesprächsverlauf über `session/load` erneut ein. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Fortschrittszusammenfassungen des anfänglichen ACP-Laufs als Systemereignisse zurück an die anfordernde Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Log (`<sessionId>.acp-stream.jsonl`) zeigt, das Sie für den vollständigen Relay-Verlauf beobachten können.

### Eine bestehende Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Gesprächsverlauf über `session/load` erneut ein, sodass er mit dem vollständigen Kontext dessen fortfährt, was zuvor geschehen ist.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop auf das Telefon übergeben — weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben und jetzt headless über Ihren Agenten weiterführen
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Leerlauf-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Sub-Agent-Laufzeit verwendet wird.
- `resumeSessionId` stellt den vorgelagerten ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stilles Zurückfallen auf eine neue Sitzung.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie eine schnelle Live-Prüfung möchten, dass ACP-Spawn
tatsächlich Ende-zu-Ende funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Überprüfen Sie die deployte Gateway-Version/den Commit auf dem Ziel-Host.
2. Bestätigen Sie, dass der deployte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Bitten Sie diesen Agenten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifizieren Sie, dass der Agent meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Bereinigen Sie die temporäre ACPX-Bridge-Sitzung.

Beispiel-Prompt für den Live-Agenten:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halten Sie diesen Smoke-Test bei `mode: "run"`, sofern Sie nicht absichtlich
  persistente threadgebundene ACP-Sitzungen testen.
- Verlangen Sie für das grundlegende Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  den Fähigkeiten der anfordernden Sitzung/des Requesters ab und ist eine separate Integrationsprüfung.
- Behandeln Sie threadgebundenes Testen mit `mode: "session"` als zweiten, umfassenderen Integrationsdurchlauf
  aus einem echten Discord-Thread oder Telegram-Thema.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine durch die Sandbox erzwungene Ausführung benötigen.

### Aus dem Befehl `/acp`

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

Siehe [Slash Commands](/de/tools/slash-commands).

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Reihenfolge der Auflösung:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfordernde Sitzung

Bindungen an die aktuelle Konversation und Thread-Bindungen nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bindungsmodi

`/acp spawn` unterstützt `--bind here|off`.

| Modus | Verhalten                                                              |
| ------ | ---------------------------------------------------------------------- |
| `here` | Bindet die aktuell aktive Konversation an Ort und Stelle; schlägt fehl, wenn keine aktiv ist. |
| `off`  | Erstellt keine Bindung an die aktuelle Konversation.                   |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die die Bindung an die aktuelle Konversation unterstützen.
- `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus | Verhalten                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen untergeordneten Thread, wenn unterstützt. |
| `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn keiner aktiv ist.                        |
| `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                       |

Hinweise:

- Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen untergeordneten Thread zu erstellen.

## ACP-Steuerung

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

`/acp status` zeigt die effektiven Laufzeitoptionen und, sofern verfügbar, sowohl Kennungen auf Laufzeitebene als auch auf Backend-Ebene an.

Einige Steuerungen hängen von den Fähigkeiten des Backends ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren Fehler für nicht unterstützte Steuerung zurück.

## ACP-Befehls-Kochbuch

| Befehl              | Funktion                                                   | Beispiel                                                      |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`        | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`       | Laufenden Turn für die Zielsitzung abbrechen.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`        | Steueranweisung an eine laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`        | Sitzung schließen und Thread-Ziele entbinden.              | `/acp close`                                                  |
| `/acp status`       | Backend, Modus, Zustand, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`     | Laufzeitmodus für die Zielsitzung festlegen.               | `/acp set-mode plan`                                          |
| `/acp set`          | Generischen Laufzeit-Konfigurationswert schreiben.         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`          | Überschreibung des Laufzeit-Arbeitsverzeichnisses setzen.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`  | Profil für die Genehmigungsrichtlinie festlegen.           | `/acp permissions strict`                                     |
| `/acp timeout`      | Laufzeit-Timeout (Sekunden) festlegen.                     | `/acp timeout 120`                                            |
| `/acp model`        | Überschreibung des Laufzeitmodells festlegen.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options`| Überschreibungen der Sitzungs-Laufzeitoptionen entfernen.  | `/acp reset-options`                                          |
| `/acp sessions`     | Kürzlich verwendete ACP-Sitzungen aus dem Store auflisten. | `/acp sessions`                                               |
| `/acp doctor`       | Backend-Gesundheit, Fähigkeiten, umsetzbare Korrekturen.   | `/acp doctor`                                                 |
| `/acp install`      | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp sessions` liest den Store für die aktuelle gebundene oder anfordernde Sitzung. Befehle, die Tokens vom Typ `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über die Gateway-Sitzungserkennung auf, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

## Abbildung von Laufzeitoptionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Laufzeit-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Laufzeit-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Laufzeit-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert direkt die Überschreibung des Laufzeit-`cwd`.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad für die `cwd`-Überschreibung.
- `/acp reset-options` löscht alle Laufzeitüberschreibungen für die Zielsitzung.

## acpx-Harness-Unterstützung (aktuell)

Aktuelle integrierte acpx-Harness-Aliasse:

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

Wenn OpenClaw das acpx-Backend verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie stattdessen den Agent-Befehl `cursor` in Ihrer acpx-Konfiguration, anstatt den integrierten Standard zu ändern.

Die direkte Verwendung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Escape-Hatch ist eine acpx-CLI-Funktion (nicht der normale OpenClaw-`agentId`-Pfad).

## Erforderliche Konfiguration

ACP-Basis in Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch zu pausieren und /acp-Steuerungen beizubehalten.
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

Die Thread-Bindungskonfiguration ist kanadapter-spezifisch. Beispiel für Discord:

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

Bindungen an die aktuelle Konversation erfordern keine Erstellung eines untergeordneten Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanaladapter, der ACP-Konversationsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Frische Installationen werden standardmäßig mit aktiviertem gebündelten `acpx`-Laufzeit-Plugin ausgeliefert, daher
funktioniert ACP normalerweise ohne einen manuellen Plugin-Installationsschritt.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, es über `plugins.allow` / `plugins.deny` verweigert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie dann die Backend-Gesundheit:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte acpx-Backend-Plugin (`acpx`) die pluginlokal angeheftete Binärdatei:

1. Der Befehl ist standardmäßig die pluginlokale `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version ist standardmäßig die Anheftung der Extension.
3. Beim Start wird das ACP-Backend sofort als nicht bereit registriert.
4. Ein Ensure-Job im Hintergrund prüft `acpx --version`.
5. Wenn die pluginlokale Binärdatei fehlt oder nicht übereinstimmt, wird Folgendes ausgeführt:
   `npm install --omit=dev --no-save acpx@<pinned>` und anschließend erneut geprüft.

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
- `expectedVersion: "any"` deaktiviert strikte Versionsprüfung.
- Wenn `command` auf eine benutzerdefinierte Binärdatei/einen benutzerdefinierten Pfad zeigt, wird die pluginlokale Auto-Installation deaktiviert.
- Der OpenClaw-Start bleibt nicht blockierend, während die Backend-Gesundheitsprüfung läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Abhängigkeitsinstallation

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-
Laufzeitabhängigkeiten (plattformspezifische Binärdateien) automatisch
über einen Postinstall-Hook installiert. Falls die automatische Installation fehlschlägt, startet das Gateway dennoch
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen **keine** von OpenClaw-Plugins registrierten Tools für
das ACP-Harness bereit.

Wenn Sie möchten, dass ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen können, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server namens `openclaw-plugin-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Sicherheits- und Vertrauenshinweise:

- Dies erweitert die Tool-Oberfläche des ACP-Harnesses.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die im Gateway bereits aktiv sind.
- Betrachten Sie dies als dieselbe Vertrauensgrenze wie das Ausführen dieser Plugins
  in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Plugin-Tools-Bridge ist
eine zusätzliche optionale Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### Konfiguration des Laufzeit-Timeouts

Das gebündelte `acpx`-Plugin setzt für eingebettete Laufzeit-Turns standardmäßig ein
Timeout von 120 Sekunden. Das gibt langsameren Harnesses wie Gemini CLI genügend Zeit, um
ACP-Start und Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes
Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Agents für Health-Probes

Das gebündelte `acpx`-Plugin prüft ein Harness-Agent, während es entscheidet, ob das
eingebettete Laufzeit-Backend bereit ist. Standard ist `codex`. Wenn Ihr Deployment
einen anderen Standard-ACP-Agenten verwendet, setzen Sie den Probe-Agenten auf dieselbe ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Aufforderungen zur Genehmigung oder Ablehnung von Schreibzugriffen auf Dateien und Shell-Ausführung zu bestätigen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von Vendor-Bypass-Flags der CLI-Backends wie Claude-CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-seitige Break-Glass-Schalter für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Aufforderung ausführen kann.

| Wert            | Verhalten                                                 |
| ---------------- | -------------------------------------------------------- |
| `approve-all`    | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads`  | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Ausführung erfordern Aufforderungen. |
| `deny-all`       | Alle Berechtigungsaufforderungen ablehnen.               |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsaufforderung angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**          |
| `deny` | Berechtigung stillschweigend verweigern und fortfahren (Graceful Degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Ausführungsvorgang, der eine Berechtigungsaufforderung auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen sich kontrolliert verschlechtern, anstatt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                         | Behebung                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                      | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                     | `acp.enabled=true` setzen.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                       | `acp.dispatch.enabled=true` setzen.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                               | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                               |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                          | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen.                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine ACP-Bindungsfähigkeit für die aktuelle Konversation.          | Unterstützt, `/acp spawn ... --thread ...` verwenden, Top-Level-`bindings[]` konfigurieren oder zu einem unterstützten Kanal wechseln.                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                           | Als Eigentümer neu binden oder eine andere Konversation bzw. einen anderen Thread verwenden.                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Thread-Bindungsfähigkeit.                                     | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Laufzeit ist hostseitig; die anfordernde Sitzung läuft in einer Sandbox.    | In Sandbox-Sitzungen `runtime="subagent"` verwenden oder ACP-Spawn aus einer nicht sandboxierten Sitzung ausführen.                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Laufzeit angefordert.                     | Für erforderliche Sandbox-Verwendung `runtime="subagent"` nutzen oder ACP mit `sandbox="inherit"` aus einer nicht sandboxierten Sitzung verwenden.                |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                      | Mit `/acp spawn` neu erstellen, dann Thread neu binden/fokussieren.                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreiben/Ausführen in einer nicht interaktiven ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und das Gateway neu starten. Siehe [Berechtigungskonfiguration](#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsaufforderungen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für Graceful Degradation `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess ist beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden. |
