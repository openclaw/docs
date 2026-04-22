---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Channels einrichten
    - Eine Konversation in einem Message-Channel an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Fehlerbehebung bei ACP-Abschlusszustellung oder Agent-zu-Agent-Schleifen
    - '`/acp`-Befehle aus dem Chat ausführen'
summary: ACP-Runtime-Sitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agenten verwenden
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-22T04:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agenten

Sitzungen mit dem [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn du OpenClaw in natürlicher Sprache bittest, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Runtime weiterleiten (nicht an die native Sub-Agent-Runtime). Jeder ACP-Sitzungs-Spawn wird als [background task](/de/automation/tasks) verfolgt.

Wenn du möchtest, dass Codex oder Claude Code sich direkt
als externer MCP-Client mit bestehenden OpenClaw-Channel-Konversationen verbinden,
verwende [`openclaw mcp serve`](/cli/mcp) statt ACP.

## Welche Seite brauche ich?

Es gibt drei nahe verwandte Oberflächen, die leicht verwechselt werden können:

| Du möchtest ...                                                                     | Verwende das                           | Hinweise                                                                                                     |
| ------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agenten               | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background tasks, Runtime-Kontrollen |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/cli/acp)             | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                       |
| Eine lokale AI-CLI als reines Text-Fallback-Modell wiederverwenden                   | [CLI Backends](/de/gateway/cli-backends)  | Kein ACP. Keine OpenClaw-Tools, keine ACP-Kontrollen, keine Harness-Runtime                                  |

## Funktioniert das sofort?

Normalerweise ja.

- Neue Installationen liefern jetzt das gebündelte Runtime-Plugin `acpx` standardmäßig aktiviert aus.
- Das gebündelte `acpx`-Plugin bevorzugt seine pluginlokale gepinnte `acpx`-Binärdatei.
- Beim Start prüft OpenClaw diese Binärdatei und repariert sie bei Bedarf selbst.
- Starte mit `/acp doctor`, wenn du eine schnelle Bereitschaftsprüfung möchtest.

Was bei der ersten Verwendung trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann beim ersten Verwenden dieses Harnesses bei Bedarf mit `npx` abgerufen werden.
- Vendor-Auth muss auf dem Host für dieses Harness weiterhin vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugriff hat, können Adapter-Abrufe beim ersten Lauf fehlschlagen, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter muss möglicherweise dennoch beim ersten Lauf abgerufen werden.
- `/acp spawn claude`: dieselbe Situation für den Claude-ACP-Adapter, plus Claude-seitige Auth auf diesem Host.

## Schneller Operator-Ablauf

Verwende dies, wenn du ein praktisches `/acp`-Runbook möchtest:

1. Eine Sitzung erzeugen:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder dem Thread arbeiten (oder diesen Sitzungsschlüssel explizit ansprechen).
3. Runtime-Status prüfen:
   - `/acp status`
4. Runtime-Optionen bei Bedarf anpassen:
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

- „Binde diesen Discord-Channel an Codex.“
- „Starte hier eine persistente Codex-Sitzung in einem Thread und halte den Fokus darauf.“
- „Führe das als One-shot-Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und behalte Follow-ups im selben Workspace.“
- „Verwende für diese Aufgabe Gemini CLI in einem Thread und behalte Follow-ups dann in diesem Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` auswählen.
2. Das angeforderte Harness-Ziel (`agentId`, zum Beispiel `codex`) auflösen.
3. Wenn eine Bindung an die aktuelle Konversation angefordert wird und der aktive Channel sie unterstützt, die ACP-Sitzung an diese Konversation binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wird und der aktuelle Channel sie unterstützt, die ACP-Sitzung an den Thread binden.
5. Nachfolgende gebundene Nachrichten an dieselbe ACP-Sitzung routen, bis der Fokus aufgehoben, die Sitzung geschlossen oder sie abgelaufen ist.

## ACP versus Sub-Agenten

Verwende ACP, wenn du eine externe Harness-Runtime möchtest. Verwende Sub-Agenten, wenn du OpenClaw-native delegierte Ausführungen möchtest.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Ausführung                |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime   |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. ACP-Sitzungs-Control-Plane von OpenClaw
2. gebündeltes Runtime-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Runtime-/Sitzungsmechanik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Kontrollen, Sitzungs-Fortsetzung, background-task-Tracking und optionaler Konversations-/Thread-Bindung.
- CLI-Backends sind separate reine Text-Laufzeiten als lokale Fallbacks. Siehe [CLI Backends](/de/gateway/cli-backends).

Für Operatoren gilt praktisch:

- wenn du `/acp spawn`, bindbare Sitzungen, Runtime-Kontrollen oder persistente Harness-Arbeit möchtest: verwende ACP
- wenn du einfaches lokales Text-Fallback über die rohe CLI möchtest: verwende CLI-Backends

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

Verwende `/acp spawn <harness> --bind here`, wenn die aktuelle Konversation zu einem dauerhaften ACP-Workspace werden soll, ohne einen Child-Thread zu erstellen.

Verhalten:

- OpenClaw behält Eigentümerschaft über Channel-Transport, Auth, Sicherheit und Zustellung.
- Die aktuelle Konversation wird auf den erzeugten ACP-Sitzungsschlüssel gepinnt.
- Nachfolgende Nachrichten in dieser Konversation werden an dieselbe ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung an die aktuelle Konversation.

Was das praktisch bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche bei. Auf Discord bleibt der aktuelle Channel der aktuelle Channel.
- `--bind here` kann dennoch eine neue ACP-Sitzung erstellen, wenn du neue Arbeit erzeugst. Die Bindung hängt diese Sitzung an die aktuelle Konversation.
- `--bind here` erstellt nicht von selbst einen Child-Discord-Thread oder ein Telegram-Topic.
- Die ACP-Runtime kann weiterhin ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen vom Backend verwalteten Workspace auf der Festplatte haben. Dieser Runtime-Workspace ist getrennt von der Chat-Oberfläche und impliziert keinen neuen Messaging-Thread.
- Wenn du zu einem anderen ACP-Agenten spawnst und `--cwd` nicht übergibst, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agenten**, nicht den des Anfragenden.
- Wenn dieser übernommene Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), greift OpenClaw auf das Standard-`cwd` des Backend zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der übernommene Workspace existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt der Spawn den tatsächlichen Zugriffsfehler zurück, statt `cwd` zu verwerfen.

Mentales Modell:

- Chat-Oberfläche: wo Menschen weiterreden (`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP-Sitzung: der dauerhafte Codex-/Claude-/Gemini-Runtime-Status, an den OpenClaw routet
- Child-Thread/-Topic: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Runtime-Workspace: der Dateisystemort, an dem das Harness läuft (`cwd`, Repo-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat behalten, eine Codex-ACP-Sitzung erzeugen oder anhängen und zukünftige Nachrichten hierhin an sie routen
- `/acp spawn codex --thread auto`: OpenClaw kann einen Child-Thread/ein Child-Topic erstellen und die ACP-Sitzung dort binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindungen an die aktuelle Konversation:

- Chat-/Message-Channels, die Unterstützung für Bindungen an die aktuelle Konversation ausweisen, können `--bind here` über den gemeinsamen Konversations-Bindungspfad verwenden.
- Channels mit benutzerdefinierter Thread-/Topic-Semantik können weiterhin channelspezifische Kanonisierung hinter derselben gemeinsamen Schnittstelle bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation direkt binden“.
- Generische Bindungen an die aktuelle Konversation verwenden den gemeinsamen OpenClaw-Bindungsspeicher und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Channel oder Thread direkt. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen Child-Thread für `--thread auto|here` erstellen muss.
- Wenn der aktive Channel keine ACP-Bindungen an die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung aus, dass dies nicht unterstützt wird.
- `resume` und Fragen zu „neuer Sitzung“ sind ACP-Sitzungsfragen, keine Channel-Fragen. Du kannst Runtime-Status wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Channel-Adapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Nachfolgende Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
- ACP-Ausgaben werden an denselben Thread zurückgeliefert.
- Das Aufheben des Fokus, Schließen, Archivieren, der Idle-Timeout oder das Erreichen des Maximalalters entfernt die Bindung.

Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Channel-Adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare Meldung aus, dass dies nicht unterstützt/verfügbar ist.

Erforderliche Feature-Flags für threadgebundenes ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (setze `false`, um den ACP-Dispatch zu pausieren)
- ACP-Thread-Spawn-Flag des Channel-Adapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channels mit Thread-Unterstützung

- Jeder Channel-Adapter, der Sitzung-/Thread-Bindungsfähigkeit bereitstellt.
- Aktuelle integrierte Unterstützung:
  - Discord-Threads/-Channels
  - Telegram-Topics (Forum-Topics in Gruppen/Supergroups und DM-Topics)
- Plugin-Channels können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

## Channelspezifische Einstellungen

Für nicht-ephemere Workflows konfiguriere persistente ACP-Bindungen in `bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

- `bindings[].type="acp"` markiert eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Channel oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forum-Topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzuge `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzuge `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die zugehörige OpenClaw-Agent-ID.
- Optionale ACP-Overrides befinden sich unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Runtime-Standardwerte pro Agent

Verwende `agents.list[].runtime`, um ACP-Standardwerte einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Vorrang bei Overrides für ACP-gebundene Sitzungen:

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

- OpenClaw stellt vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung existiert.
- Nachrichten in diesem Channel oder Topic werden an die konfigurierte ACP-Sitzung geroutet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindungen (zum Beispiel erstellt durch Thread-Fokus-Abläufe) gelten weiterhin, wo vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende übernommene Workspace-Pfade fallen auf das Standard-`cwd` des Backend zurück; echte Zugriffsfehler auf vorhandene Pfade werden als Spawn-Fehler ausgegeben.

## ACP-Sitzungen starten (Schnittstellen)

### Von `sessions_spawn`

Verwende `runtime: "acp"`, um eine ACP-Sitzung aus einem Agent-Turn oder Tool-Aufruf zu starten.

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

- `runtime` ist standardmäßig `subagent`, daher setze `runtime: "acp"` für ACP-Sitzungen explizit.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, wenn dies konfiguriert ist.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Schnittstellendetails:

- `task` (erforderlich): initialer Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
- `thread` (optional, Standard `false`): Thread-Bindungsablauf anfordern, wo unterstützt.
- `mode` (optional): `run` (one-shot) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Arbeitsverzeichnis der Runtime (validiert durch Backend-/Runtime-Richtlinie). Wenn es weggelassen wird, übernimmt ACP-Spawn bei vorhandener Konfiguration den Workspace des Ziel-Agenten; fehlende übernommene Pfade fallen auf Backend-Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitiges Label, das in Sitzungs-/Banner-Text verwendet wird.
- `resumeSessionId` (optional): eine bestehende ACP-Sitzung fortsetzen, statt eine neue zu erstellen. Der Agent spielt den Konversationsverlauf über `session/load` erneut ab. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Zusammenfassungen des Fortschritts des initialen ACP-Laufs als Systemevents zurück an die anfordernde Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsspezifisches JSONL-Log (`<sessionId>.acp-stream.jsonl`) verweist, das du für den vollständigen Relay-Verlauf mitverfolgen kannst.

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder vom Parent kontrollierte background tasks sein. Der Zustellungspfad hängt von dieser Form ab.

### Interaktive ACP-Sitzungen

Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche weiterzusprechen:

- `/acp spawn ... --bind here` bindet die aktuelle Konversation an die ACP-Sitzung.
- `/acp spawn ... --thread ...` bindet einen Channel-Thread/ein Topic an die ACP-Sitzung.
- Persistente konfigurierte `bindings[].type="acp"` routen passende Konversationen an dieselbe ACP-Sitzung.

Nachfolgende Nachrichten in der gebundenen Konversation werden direkt an die ACP-Sitzung geroutet, und ACP-Ausgaben werden an denselben Channel/Thread/dasselbe Topic zurückgeliefert.

### Vom Parent kontrollierte One-shot-ACP-Sitzungen

One-shot-ACP-Sitzungen, die von einem anderen Agent-Lauf erzeugt werden, sind background tasks als Children, ähnlich wie Sub-Agenten:

- Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
- Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
- Der Abschluss meldet sich über den internen Ankündigungspfad für Task-Abschlüsse zurück.
- Der Parent formuliert das Child-Ergebnis in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

Behandle diesen Pfad nicht als Peer-to-Peer-Chat zwischen Parent und Child. Das Child hat bereits einen Abschlusskanal zurück zum Parent.

### `sessions_send` und A2A-Zustellung

`sessions_send` kann nach dem Spawn eine andere Sitzung ansprechen. Für normale Peer-Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-(A2A)-Folgepfad:

- auf die Antwort der Ziel-Sitzung warten
- optional dem Anfragenden und dem Ziel erlauben, eine begrenzte Zahl an Folge-Turns auszutauschen
- das Ziel auffordern, eine Ankündigungsnachricht zu erzeugen
- diese Ankündigung an den sichtbaren Channel oder Thread zustellen

Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender ein sichtbares Follow-up benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung eine ACP-Zielsitzung sehen und ihr Nachrichten senden kann, zum Beispiel unter breiten Einstellungen in `tools.sessions.visibility`.

OpenClaw überspringt das A2A-Follow-up nur dann, wenn der Anfragende der Parent seines eigenen vom Parent kontrollierten One-shot-ACP-Child ist. In diesem Fall kann das Ausführen von A2A zusätzlich zur Task-Abschlussmeldung den Parent mit dem Ergebnis des Child aufwecken, die Antwort des Parent zurück in das Child weiterleiten und eine Echo-Schleife zwischen Parent und Child erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall eines kontrollierten Child `delivery.status="skipped"`, weil der Abschlusspfad bereits für das Ergebnis verantwortlich ist.

### Eine bestehende Sitzung fortsetzen

Verwende `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt den Konversationsverlauf über `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorherigen fortsetzt.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop an das Handy übergeben — deinem Agenten sagen, er soll dort weitermachen, wo du aufgehört hast
- Eine Coding-Sitzung fortsetzen, die du interaktiv in der CLI gestartet hast, jetzt headless über deinen Agenten
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Sub-Agent-Runtime verwendet wird.
- `resumeSessionId` stellt den vorgelagerten ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die du erstellst, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

### Smoke-Test für Operatoren

Verwende dies nach einem Gateway-Deployment, wenn du schnell live prüfen willst, dass ACP-Spawn
wirklich end-to-end funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Die Version/den Commit des bereitgestellten Gateway auf dem Ziel-Host prüfen.
2. Bestätigen, dass der bereitgestellte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agenten bitten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifizieren, dass der Agent meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Die temporäre ACPX-Bridge-Sitzung bereinigen.

Beispiel-Prompt an den Live-Agenten:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halte diesen Smoke-Test auf `mode: "run"`, außer du testest absichtlich
  threadgebundene persistente ACP-Sitzungen.
- Verlange für dieses Basis-Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  Fähigkeiten des Anfragenden/der Sitzung ab und ist eine separate Integrationsprüfung.
- Behandle threadgebundenes `mode: "session"`-Testing als zweiten, reichhaltigeren Integrations-
  Durchlauf aus einem echten Discord-Thread oder Telegram-Topic.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwende `runtime: "subagent"`, wenn du durch die Sandbox erzwungene Ausführung benötigst.

### Über den Befehl `/acp`

Verwende `/acp spawn` für explizite Operator-Kontrolle aus dem Chat, wenn nötig.

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

Auflösungsreihenfolge:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfordernde Sitzung

Bindungen an die aktuelle Konversation und Thread-Bindungen nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bind-Modi

`/acp spawn` unterstützt `--bind here|off`.

| Modus  | Verhalten                                                               |
| ------ | ----------------------------------------------------------------------- |
| `here` | Die aktuell aktive Konversation direkt binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Keine Bindung an die aktuelle Konversation erstellen.                   |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „mach diesen Channel oder Chat zu Codex-gestützt“.
- `--bind here` erstellt keinen Child-Thread.
- `--bind here` ist nur auf Channels verfügbar, die Unterstützung für Bindungen an die aktuelle Konversation bereitstellen.
- `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus  | Verhalten                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen Child-Thread erstellen/binden, wenn unterstützt. |
| `here` | Aktiven aktuellen Thread verlangen; fehlschlagen, wenn keiner aktiv ist.                              |
| `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                        |

Hinweise:

- Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Channel-Richtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwende `--bind here`, wenn du die aktuelle Konversation pinnen möchtest, ohne einen Child-Thread zu erstellen.

## ACP-Kontrollen

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

`/acp status` zeigt die effektiven Runtime-Optionen und, wenn verfügbar, sowohl Runtime- als auch Backend-Sitzungskennungen.

Einige Kontrollen hängen von den Fähigkeiten des Backend ab. Wenn ein Backend eine Kontrolle nicht unterstützt, gibt OpenClaw einen klaren Fehler für nicht unterstützte Kontrolle zurück.

## ACP-Befehls-Kochbuch

| Befehl               | Was er tut                                                   | Beispiel                                                      |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steer-Anweisung an laufende Sitzung senden.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.                | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Runtime-Optionen, Fähigkeiten anzeigen. | `/acp status`                                              |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung setzen.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Generisches Schreiben einer Runtime-Konfigurationsoption.    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Override für das Arbeitsverzeichnis der Runtime setzen.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für die Genehmigungsrichtlinie setzen.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout (Sekunden) setzen.                           | `/acp timeout 120`                                            |
| `/acp model`         | Override für das Runtime-Modell setzen.                      | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Runtime-Overrides der Sitzung entfernen.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Store auflisten.              | `/acp sessions`                                               |
| `/acp doctor`        | Zustand des Backend, Fähigkeiten, umsetzbare Fixes.          | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                            |

`/acp sessions` liest den Store für die aktuell gebundene oder anfordernde Sitzung. Befehle, die `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über die Gateway-Sitzungserkennung auf, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

## Zuordnung der Runtime-Optionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Runtime-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Runtime-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Runtime-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert den `cwd`-Override der Runtime direkt.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad für den `cwd`-Override.
- `/acp reset-options` entfernt alle Runtime-Overrides für die Zielsitzung.

## Unterstützung für acpx-Harnesses (aktuell)

Aktuelle integrierte Harness-Aliase in acpx:

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

Wenn OpenClaw das acpx-Backend verwendet, bevorzuge diese Werte für `agentId`, sofern deine acpx-Konfiguration keine benutzerdefinierten Agent-Aliase definiert.
Wenn deine lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreibe den Befehl des `cursor`-Agenten in deiner acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Verwendung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Escape-Hatch ist eine acpx-CLI-Funktion (nicht der normale `agentId`-Pfad von OpenClaw).

## Erforderliche Konfiguration

ACP-Basis in Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; setze false, um den ACP-Dispatch zu pausieren und /acp-Kontrollen beizubehalten.
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

Die Konfiguration für Thread-Bindungen ist channelspezifisch. Beispiel für Discord:

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

Wenn threadgebundener ACP-Spawn nicht funktioniert, prüfe zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindungen an die aktuelle Konversation erfordern keine Erstellung eines Child-Threads. Sie benötigen einen aktiven Konversationskontext und einen Channel-Adapter, der ACP-Konversationsbindungen bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Neue Installationen liefern das gebündelte Runtime-Plugin `acpx` standardmäßig aktiviert aus, daher funktioniert ACP
normalerweise ohne manuellen Plugin-Installationsschritt.

Starte mit:

```text
/acp doctor
```

Wenn du `acpx` deaktiviert, es über `plugins.allow` / `plugins.deny` verweigert oder
auf ein lokales Entwicklungs-Checkout umschalten möchtest, verwende den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Dann den Zustand des Backend prüfen:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und -Version

Standardmäßig verwendet das gebündelte acpx-Backend-Plugin (`acpx`) die pluginlokale gepinnte Binärdatei:

1. Der Befehl ist standardmäßig das pluginlokale `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version ist standardmäßig der Pin der Extension.
3. Beim Start registriert sich das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrund-Ensure-Job prüft `acpx --version`.
5. Wenn die pluginlokale Binärdatei fehlt oder nicht passt, wird Folgendes ausgeführt:
   `npm install --omit=dev --no-save acpx@<pinned>` und danach erneut geprüft.

Du kannst Befehl/Version in der Plugin-Konfiguration überschreiben:

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
- `expectedVersion: "any"` deaktiviert strikte Versionsabgleiche.
- Wenn `command` auf eine benutzerdefinierte Binärdatei/einen benutzerdefinierten Pfad zeigt, wird die pluginlokale Auto-Installation deaktiviert.
- Der OpenClaw-Start bleibt nicht blockierend, während die Backend-Zustandsprüfung läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn du OpenClaw global mit `npm install -g openclaw` installierst, werden die acpx-
Runtime-Abhängigkeiten (plattformabhängige Binärdateien) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway
trotzdem normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen **keine** von OpenClaw-Plugins registrierten Tools für
das ACP-Harness bereit.

Wenn ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen sollen, aktiviere die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen integrierten MCP-Server mit dem Namen `openclaw-plugin-tools` in den Bootstrap der ACPX-Sitzung.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dadurch wird die Tool-Oberfläche des ACP-Harness erweitert.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die im Gateway bereits aktiv sind.
- Behandle dies als dieselbe Vertrauensgrenze, wie wenn diese Plugins in
  OpenClaw selbst ausgeführt werden dürften.
- Prüfe installierte Plugins, bevor du dies aktivierst.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Bridge für Plugin-Tools ist
eine zusätzliche Opt-in-Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### Konfiguration des Runtime-Timeouts

Das gebündelte Plugin `acpx` setzt für eingebettete Runtime-Turns standardmäßig ein
Timeout von 120 Sekunden. Dadurch erhalten langsamere Harnesses wie Gemini CLI genug Zeit, ACP-Start und Initialisierung abzuschließen. Überschreibe dies, wenn dein Host ein anderes
Runtime-Limit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starte das Gateway neu, nachdem du diesen Wert geändert hast.

### Konfiguration des Probe-Agenten für Health Checks

Das gebündelte Plugin `acpx` prüft einen Harness-Agenten, während es entscheidet, ob das
Backend der eingebetteten Runtime bereit ist. Standardmäßig ist dies `codex`. Wenn deine Bereitstellung
einen anderen Standard-ACP-Agenten verwendet, setze den Probe-Agenten auf dieselbe ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starte das Gateway neu, nachdem du diesen Wert geändert hast.

## Konfiguration von Berechtigungen

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Datei-Schreib- und Shell-Exec-Genehmigungsaufforderungen anzunehmen oder abzulehnen. Das Plugin `acpx` stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von CLI-Backend-Vendor-Bypass-Flags wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-seitige Break-Glass-Schalter für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Aufforderung ausführen kann.

| Wert            | Verhalten                                                   |
| ----------------| ----------------------------------------------------------- |
| `approve-all`   | Alle Datei-Schreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Aufforderungen. |
| `deny-all`      | Alle Genehmigungsaufforderungen ablehnen.                   |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Genehmigungsaufforderung angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                          |
| ------ | ------------------------------------------------------------------ |
| `fail` | Die Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**        |
| `deny` | Die Berechtigung stillschweigend ablehnen und fortfahren (graceful degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starte das Gateway neu, nachdem du diese Werte geändert hast.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Exec-Vorgang, der eine Genehmigungsaufforderung auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn du Berechtigungen einschränken musst, setze `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradiert werden, statt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                          | Fix                                                                                                                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                        | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                          |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                       | `acp.enabled=true` setzen.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                         | `acp.dispatch.enabled=true` setzen.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                 | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                               |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                            | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen.                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                  | In den Ziel-Chat/-Channel wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine Fähigkeit für ACP-Bindung an die aktuelle Konversation.         | `/acp spawn ... --thread ...` verwenden, wo unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder zu einem unterstützten Channel wechseln.              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                  | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                             | Als Eigentümer neu binden oder eine andere Konversation bzw. einen anderen Thread verwenden.                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Fähigkeit für Thread-Bindung.                                   | `--thread off` verwenden oder zu einem unterstützten Adapter/Channel wechseln.                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime ist hostseitig; die anfordernde Sitzung ist sandboxed.                | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Runtime angefordert.                            | `runtime="subagent"` für erforderliches Sandboxing verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                        |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                        | Mit `/acp spawn` neu erstellen, dann Thread erneut binden/fokussieren.                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Exec-Vorgänge in einer nicht interaktiven ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und das Gateway neu starten. Siehe [Konfiguration von Berechtigungen](#permission-configuration). |
| ACP session fails early with little output                                  | Genehmigungsaufforderungen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für vollständige Berechtigungen `permissionMode=approve-all` setzen; für graceful degradation `nonInteractivePermissions=deny` setzen. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess ist beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                          |
