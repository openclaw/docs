---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Einrichten von an Unterhaltungen gebundenen ACP-Sitzungen in Messaging-Kanälen
    - Binden einer Konversation in einem Nachrichtenkanal an eine persistente ACP-Sitzung
    - Fehlerbehebung bei ACP-Backend, Plugin-Einbindung oder Auslieferung von Vervollständigungen
    - /acp-Befehle aus dem Chat ausführen
sidebarTitle: ACP agents
summary: Externe Programmier-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-05-07T13:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die
eingebettete Laufzeit `agentRuntime.id: "codex"`; ACP besitzt
`/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code sich als externer MCP-Client
direkt mit bestehenden OpenClaw-Kanalunterhaltungen verbindet, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie                         | Hinweise                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                          | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stopp- und Steuerungsbefehle. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerungen                                                                                         |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen        | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                                                                         |
| Eine lokale AI-CLI als rein textbasiertes Fallback-Modell wiederverwenden                        | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Laufzeit                                                                                                                                 |

## Funktioniert das sofort?

Ja, nach der Installation des offiziellen ACP-Laufzeit-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Starts, wenn ACP **tatsächlich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die aktuelle
Sitzung darf nicht durch die Sandbox blockiert sein, und ein Laufzeit-Backend muss
geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills und
die ACP-Anleitung für `sessions_spawn` verborgen, damit der Agent kein
nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="First-run gotchas">
    - Wenn `plugins.allow` gesetzt ist, ist es ein restriktives Plugin-Inventar und **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Codex ACP läuft mit einem isolierten `CODEX_HOME`; OpenClaw kopiert nur vertrauenswürdige Projekteinträge aus der Codex-Konfiguration des Hosts und vertraut dem aktiven Workspace, während Authentifizierung, Benachrichtigungen und Hooks in der Host-Konfiguration verbleiben.
    - Andere Ziel-Harness-Adapter können bei Bedarf beim ersten Verwenden weiterhin mit `npx` abgerufen werden.
    - Vendor-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt wurden oder der Adapter auf andere Weise installiert ist.

  </Accordion>
  <Accordion title="Runtime prerequisites">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindings und Policy; das Harness
    besitzt seine Provider-Anmeldung, den Modellkatalog, das Dateisystemverhalten und
    native Tools.

    Bevor Sie OpenClaw dafür verantwortlich machen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness - Modell-IDs sind nicht zwischen Harnesses portierbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und das Backend verwendet seinen Standardwert.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe normalerweise ein ACPX-Berechtigungsprofil, das headless fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges in
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für
`/acp spawn <id>` oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                              | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | Erfordert Claude-Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex ACP adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wurde. |
| `copilot`  | GitHub Copilot ACP adapter                     | Erfordert Copilot-CLI-/Laufzeit-Authentifizierung.                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI ACP adapter                         | Erfordert Gemini-CLI-Authentifizierung oder API-Key-Einrichtung.                    |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi-/Moonshot-Authentifizierung auf dem Host.                            |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode ACP adapter                           | Erfordert OpenCode-CLI-/Provider-Authentifizierung.                                 |
| `openclaw` | OpenClaw Gateway bridge through `openclaw acp` | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zurückzusprechen. |
| `pi`       | Pi/embedded OpenClaw runtime                   | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden, aber die
OpenClaw-Policy prüft vor dem Dispatch weiterhin `acp.allowedAgents` und alle
Zuordnungen in `agents.list[].runtime.acp.agent`.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Work">
    Fahren Sie in der gebundenen Unterhaltung oder im Thread fort (oder zielen Sie
    explizit auf den Sitzungsschlüssel).
  </Step>
  <Step title="Check state">
    `/acp status`
  </Step>
  <Step title="Tune">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steer">
    Ohne den Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stop">
    `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindings).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - Spawn erstellt eine ACP-Laufzeitsitzung oder setzt sie fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf parent-owned ist.
    - Parent-owned ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Laufzeitsitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Parent-Aufgaben-Notifier, statt sich wie eine normale benutzerseitige Chat-Sitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste parent-owned One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange ein aktives Unterhaltungs-Binding besteht; veraltete persistente Sitzungen ohne aktives Binding werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz verschwunden ist.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis das Binding geschlossen, nicht mehr fokussiert, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden nie als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder das Binding noch die Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt das Binding. Ein Harness kann seinen eigenen Upstream-Verlauf weiterhin behalten, wenn es Fortsetzen unterstützt.
    - Das acpx-Plugin bereinigt OpenClaw-eigene Wrapper- und Adapter-Prozessbäume nach `close` und räumt veraltete OpenClaw-eigene ACPX-Waisen während des Gateway-Starts ab.
    - Leerlaufende Laufzeit-Worker können nach `acp.runtime.ttlMinutes` bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex routing rules">
    Auslöser in natürlicher Sprache, die an das **native Codex-Plugin**
    geroutet werden sollten, wenn es aktiviert ist:

    - "Binde diesen Discord-Kanal an Codex."
    - "Hänge diesen Chat an den Codex-Thread `<id>` an."
    - "Zeige Codex-Threads und binde dann diesen hier."

    Native Codex-Konversationsbindung ist der Standardpfad für Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt,
    während Codex-native Tools wie Shell/apply-patch innerhalb von Codex
    ausgeführt werden. Für Codex-native Tool-Ereignisse injiziert OpenClaw
    pro Turn ein natives Hook-Relay, damit Plugin-Hooks `before_tool_call`
    blockieren, `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen leiten können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert.
    Das Relay bleibt bewusst konservativ: Es verändert keine Codex-nativen
    Tool-Argumente und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie
    explizites ACP nur, wenn Sie das ACP-Runtime-/Sitzungsmodell möchten. Die
    Support-Grenze für eingebettete Codex-Unterstützung ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract)
    dokumentiert.

  </Accordion>
  <Accordion title="Spickzettel zur Auswahl von Modell / Provider / Runtime">
    - `openai-codex/*` - Legacy-Codex-OAuth-/Abonnement-Modellroute, die von doctor repariert wird.
    - `openai/*` - native, in den Codex-App-Server eingebettete Runtime für OpenAI-Agent-Turns.
    - `/codex ...` - native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` - explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Trigger für ACP-Routing">
    Trigger, die zur ACP-Runtime geleitet werden sollten:

    - "Führen Sie dies als einmalige Claude Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread, und behalten Sie anschließende Rückfragen in demselben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf,
    bindet, sofern unterstützt, an die aktuelle Konversation oder den
    aktuellen Thread und leitet Folgeanfragen bis zum Schließen/Ablauf an
    diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn ACP/acpx explizit
    ist oder das native Codex-Plugin für die angeforderte Operation nicht
    verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anforderer nicht sandboxed ist und ein ACP-Runtime-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert die automatische
    ACP-Thread-Weiterleitung, blendet explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe jedoch nicht aus und blockiert
    sie auch nicht. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser
    Eintrag ist explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    verwenden Sie andernfalls die standardmäßige Sub-Agent-Runtime. Wenn ein
    OpenClaw-Agent mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie
den **nativen Codex-App-Server** für Codex-Konversationsbindung/-steuerung,
wenn das `codex`-Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie
OpenClaw-native delegierte Ausführungen möchten.

| Bereich       | ACP-Sitzung                          | Sub-Agent-Ausführung                |
| ------------- | ------------------------------------ | ----------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`     | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                           | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Control-Plane.
2. Offizielles `@openclaw/acpx`-Runtime-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Runtime-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Hintergrundaufgaben-Tracking und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate textbasierte lokale Fallback-Runtimes - siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Operatoren lautet die praktische Regel:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Runtime-Steuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** - dort, wo Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** - der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/untergeordnetes Thema** - eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** - der Dateisystemort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), an dem das Harness ausgeführt wird. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung an - kein untergeordneter Thread, dieselbe Chat-Oberfläche.
OpenClaw behält Transport, Authentifizierung, Sicherheit und Zustellung in der
Hand. Folgenachrichten in dieser Konversation werden an dieselbe Sitzung
geleitet; `/new` und `/reset` setzen die Sitzung an Ort und Stelle zurück;
`/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, künftige Nachrichten hierhin routen
/codex model gpt-5.4                                     # gebundenen nativen Codex-Thread anpassen
/codex stop                                              # aktiven nativen Codex-Turn steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # gleiche Chat-Bindung, Codex läuft in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Konversation ankündigen; andernfalls gibt OpenClaw eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` - nicht `--bind here`.
    - Wenn Sie ohne `--cwd` einen anderen ACP-Agent starten, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agents**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal - `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Folgetext an die gebundene ACP-Sitzung weitergeleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung geleitet.
    - ACP-Ausgabe wird an denselben Thread zurückgeliefert.
    - Unfocus/Schließen/Archivieren/Idle-Timeout oder Ablauf durch maximales Alter entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Spawns von Thread-Sitzungen im Kanaladapter aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive
    Kanaladapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit verfügbar macht.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Konfigurieren Sie für nicht flüchtige Workflows persistente ACP-Bindungen in
Top-Level-`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Formen pro Kanal:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-Forumthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/-Gruppe:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die besitzende OpenClaw-Agent-ID.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales operatorseitiges Label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Runtime-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Runtime-Standards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Überschreibungsreihenfolge für ACP-gebundene Sitzungen:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globale ACP-Standards (z. B. `acp.backend`)

### Beispiel

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

### Verhalten

- OpenClaw stellt sicher, dass die konfigurierte ACP-Sitzung vor der Verwendung existiert.
- Nachrichten in diesem Kanal oder Topic werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindungen (zum Beispiel durch Thread-Fokus-Abläufe erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentenübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agenten aus der Agentenkonfiguration.
- Fehlende übernommene Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler auf vorhandene Pfade werden als Spawn-Fehler ausgegeben.

## ACP-Sitzungen starten

Es gibt zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Über sessions_spawn">
    Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agenten-Turn oder
    Tool-Aufruf heraus zu starten.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    Für `runtime` gilt standardmäßig `subagent`; setzen Sie daher
    `runtime: "acp"` für ACP-Sitzungen explizit. Wenn `agentId`
    ausgelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern
    konfiguriert. `mode: "session"` erfordert `thread: true`, um eine
    persistente gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="Über den /acp-Befehl">
    Verwenden Sie `/acp spawn` für explizite Operatorsteuerung aus dem Chat heraus.

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

  </Tab>
</Tabs>

### `sessions_spawn`-Parameter

<ParamField path="task" type="string" required>
  Initialer Prompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, sofern gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Thread-Bindungsablauf anfordern, wo unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist persistent. Wenn `thread: true`
  ist und `mode` ausgelassen wird, kann OpenClaw je nach Runtime-Pfad
  standardmäßig persistentes Verhalten verwenden. `mode: "session"`
  erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Runtime-Arbeitsverzeichnis (durch Backend-/Runtime-
  Richtlinie validiert). Wenn ausgelassen, übernimmt der ACP-Spawn den
  Workspace des Ziel-Agenten, sofern konfiguriert; fehlende übernommene
  Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler
  zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operatorseitiges Label, das in Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Eine bestehende ACP-Sitzung fortsetzen, statt eine neue zu erstellen.
  Der Agent spielt seinen Gesprächsverlauf über `session/load` wieder ab.
  Erfordert `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Zusammenfassungen des anfänglichen ACP-Run-Fortschritts
  als Systemereignisse zurück an die anfragende Sitzung. Akzeptierte
  Antworten enthalten `streamLogPath`, der auf ein sitzungsbezogenes
  JSONL-Protokoll (`<sessionId>.acp-stream.jsonl`) verweist, das Sie für
  den vollständigen Relay-Verlauf fortlaufend mitlesen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den ACP-Child-Turn nach N Sekunden ab. `0` belässt den Turn auf
  dem No-Timeout-Pfad des Gateways. Derselbe Wert wird auf den Gateway-
  Run und die ACP-Runtime angewendet, sodass blockierte Harnesses oder
  solche mit erschöpftem Kontingent die Lane des übergeordneten Agenten
  nicht unbegrenzt belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die ACP-Child-Sitzung. Codex-ACP-
  Spawns normalisieren OpenClaw-Codex-Refs wie `openai-codex/gpt-5.4`
  vor `session/new` in die Codex-ACP-Startkonfiguration; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Reasoning-Aufwand für
  Codex ACP. Andere Harnesses müssen ACP-`models` bekanntgeben und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx
  klar fehl, statt stillschweigend auf den Standard des Ziel-Agenten
  zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Thinking-/Reasoning-Aufwand. Für Codex ACP wird `minimal`
  auf niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden
  direkt abgebildet, und `off` lässt die Startüberschreibung für den
  Reasoning-Aufwand weg.
</ParamField>

## Spawn-Modi für Bindung und Thread

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                  |

    Hinweise:

    - `--bind here` ist der einfachste Operatorpfad, um „diesen Kanal oder Chat mit Codex zu hinterlegen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für Bindungen der aktuellen Unterhaltung bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen untergeordneten Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuell aktiven Thread; schlägt fehl, wenn keiner vorhanden ist.                      |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                      |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung fixieren möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder vom Parent
verwaltete Hintergrundarbeit sein. Der Zustellungspfad hängt von dieser
Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-
    Oberfläche weiter zu kommunizieren:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Topic an die ACP-Sitzung.
    - Persistent konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung weitergeleitet, und ACP-Ausgabe wird zurück an denselben
    Kanal/Thread/dasselbe Topic zugestellt.

    Was OpenClaw an den Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur, wenn der Harness/das Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor dem ACP-Versand abgefangen.
    - Runtime-generierte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten OpenClaws internen Runtime-Kontext-Envelope; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Child-Ergebnis und einer Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Envelope sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den für Benutzer sichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben, wo möglich, in OpenClaw strukturiert und werden nicht als von Benutzern verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-eigene einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agenten-Run gestartet
    werden, sind untergeordnete Hintergrundsitzungen, ähnlich wie
    Unteragenten:

    - Der übergeordnete Agent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Die untergeordnete Sitzung läuft in ihrer eigenen ACP-Harness-Sitzung.
    - Child-Turns laufen auf derselben Hintergrund-Lane, die von nativen Unteragenten-Spawns verwendet wird, sodass ein langsamer ACP-Harness nicht unabhängige Hauptsitzungsarbeit blockiert.
    - Abschlussberichte laufen über den Ankündigungspfad für Aufgabenabschlüsse zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an einen externen Harness gesendet werden, sodass Harnesses keine OpenClaw-spezifischen Runtime-Kontextmarker sehen.
    - Der übergeordnete Agent schreibt das Child-Ergebnis in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen
    Parent und Child. Das Child hat bereits einen Abschlusskanal zurück
    zum Parent.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Spawn eine andere Sitzung als Ziel
    ansprechen. Für normale Peer-Sitzungen verwendet OpenClaw nach dem
    Injizieren der Nachricht einen Agent-zu-Agent-(A2A)-Folgepfad:

    - Auf die Antwort der Zielsitzung warten.
    - Optional zulassen, dass Requester und Ziel eine begrenzte Anzahl von Folge-Turns austauschen.
    - Das Ziel auffordern, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Sendungen zwischen Peers, bei
    denen der Sender eine sichtbare Folgeantwort benötigt. Er bleibt
    aktiviert, wenn eine unabhängige Sitzung ein ACP-Ziel sehen und ihm
    Nachrichten senden kann, zum Beispiel unter breit gefassten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur, wenn der Requester der
    Parent seines eigenen einmaligen ACP-Childs ist. In diesem Fall kann
    das Ausführen von A2A zusätzlich zum Aufgabenabschluss den Parent mit
    dem Child-Ergebnis wecken, die Antwort des Parents zurück in das
    Child weiterleiten und eine Parent/Child-Echoschleife erzeugen. Das
    `sessions_send`-Ergebnis meldet `delivery.status="skipped"` für
    diesen eigenen Child-Fall, weil der Abschlusspfad bereits für das
    Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Bestehende Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung
    fortzusetzen, statt neu zu starten. Der Agent spielt seinen
    Gesprächsverlauf über `session/load` wieder ab und setzt daher mit
    vollständigem Kontext dessen fort, was zuvor geschah.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übergeben Sie eine Codex-Sitzung von Ihrem Laptop an Ihr Telefon - weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben.
    - Setzen Sie eine Programmiersitzung fort, die Sie interaktiv in der CLI gestartet haben, nun ohne Oberfläche über Ihren Agenten.
    - Nehmen Sie Arbeit wieder auf, die durch einen Gateway-Neustart oder Leerlauf-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"` gesetzt ist; die Standard-Unteragenten-Runtime ignoriert dieses reine ACP-Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"` gesetzt ist; die Standard-Unteragenten-Runtime ignoriert dieses reine ACP-Feld.
    - `resumeSessionId` ist eine hostlokale ACP-/Harness-Fortsetzungs-ID, kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft weiterhin die ACP-Spawn-Richtlinie und die Ziel-Agenten-Richtlinie vor dem Versand, während das ACP-Backend oder der Harness für die Autorisierung zum Laden dieser Upstream-ID verantwortlich ist.
    - `resumeSessionId` stellt den Upstream-ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl - kein stillschweigendes Zurückfallen auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach dem Deployment">
    Führen Sie nach einem Gateway-Deployment einen Live-End-to-End-Check aus, statt
    sich auf Unit-Tests zu verlassen:

    1. Überprüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Überprüfen Sie `accepted=yes`, einen echten `childSessionKey` und dass kein Validator-Fehler vorliegt.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Belassen Sie das Gate bei `mode: "run"` und überspringen Sie `streamTo: "parent"` -
    Thread-gebundenes `mode: "session"` und Stream-Relay-Pfade sind separate,
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit in der Host-Runtime, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Harness **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agenten, Sitzungsbesitz, Kanalbindungen und Gateway-Zustellrichtlinien.
- Verwenden Sie `runtime: "subagent"` für sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung/dieser Thread an eine ACP-Sitzung gebunden ist).
3. Fallback auf die aktuelle anfordernde Sitzung.

Aktuelle Unterhaltungsbindungen und Thread-Bindungen nehmen beide an
Schritt 2 teil.

Wenn kein Ziel aufgelöst wird, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an laufende Sitzung senden.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Runtime-Optionen, Funktionen anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Runtime-Konfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Runtime-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Genehmigungsrichtlinienprofil festlegen.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout festlegen (Sekunden).                     | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-Modellüberschreibung festlegen.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Runtime-Optionsüberschreibungen der Sitzung entfernen.    | `/acp reset-options`                                          |
| `/acp sessions`      | Zuletzt verwendete ACP-Sitzungen aus dem Store auflisten. | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Funktionen, umsetzbare Korrekturen.      | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Runtime-Optionen sowie Sitzungskennungen
auf Runtime- und Backend-Ebene. Fehler für nicht unterstützte Steuerungen
werden klar angezeigt, wenn einem Backend eine Funktion fehlt. `/acp sessions` liest den
Store für die aktuell gebundene oder anfordernde Sitzung; Ziel-Tokens
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots
pro Agent.

### Zuordnung von Runtime-Optionen

`/acp` hat Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                       | Wird zugeordnet zu                   | Hinweise                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | Runtime-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>`  | Runtime-Konfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw das entsprechende `reasoning_effort`, sofern der Adapter eines unterstützt.                                                                      |
| `/acp permissions <profile>` | Runtime-Konfigurationsschlüssel `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | Runtime-Konfigurationsschlüssel `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | Runtime-cwd-Überschreibung           | Direkte Aktualisierung.                                                                                                                                                        |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den cwd-Überschreibungspfad.                                                                                                                               |
| `/acp reset-options`         | löscht alle Runtime-Überschreibungen | -                                                                                                                                                                              |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Für die acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI
Aliases), die MCP-Bridges plugin-tools und OpenClaw-tools sowie ACP-
Berechtigungsmodi siehe
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                 | Behebung                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                         | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                              | Setzen Sie `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatisches Dispatching aus normalen Thread-Nachrichten ist deaktiviert.                                                | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin. |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                        | Verwenden Sie eine erlaubte `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin fehlt, ist deaktiviert, wird durch Allow-/Deny-Richtlinie blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Backend-Installations- oder Richtlinienfehler, falls es weiterhin fehlerhaft bleibt. |
| Harness command not found                                                   | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erste `npx`-Abruf ist für einen Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit.                         |
| Model-not-found from the harness                                            | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                                 | Verwenden Sie ein von diesem Harness aufgelistetes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                |
| Vendor auth error from the harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                       | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereit.                                                           |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                                                                   | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel/das exakte Label und versuchen Sie es erneut.                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                                                         | Wechseln Sie zum Zielchat/-kanal und versuchen Sie es erneut, oder verwenden Sie einen ungebundenen Spawn.                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter unterstützt keine ACP-Bindung für die aktuelle Konversation.                                                     | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                         | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                    | Binden Sie als Besitzer neu oder verwenden Sie eine andere Konversation oder einen anderen Thread.                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter unterstützt keine Thread-Bindung.                                                                                | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft hostseitig; die anfragende Sitzung ist sandboxed.                                                      | Verwenden Sie `runtime="subagent"` aus sandboxed Sitzungen heraus oder starten Sie ACP-Spawn aus einer nicht sandboxed Sitzung.                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                                               | Verwenden Sie `runtime="subagent"` für erforderliches Sandboxing oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung.                                      |
| `Cannot apply --model ... did not advertise model support`                  | Der Ziel-Harness stellt kein generisches Umschalten von ACP-Modellen bereit.                                             | Verwenden Sie einen Harness, der ACP `models`/`session/set_model` ankündigt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls dieser ein eigenes Start-Flag hat. |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                              | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Sitzung.                        | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                              | Prüfen Sie die Gateway-Protokolle auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für kontrollierte Einschränkung setzen Sie `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                       | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung entfernt beim Schließen und beim Gateway-Start veraltete, von OpenClaw verwaltete Wrapper- und Adapterprozesse. |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interner Ereignisumschlag ist über die ACP-Grenze gelangt.                                                              | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur reine Abschluss-Prompts erhalten.                                |

## Verwandt

- [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
