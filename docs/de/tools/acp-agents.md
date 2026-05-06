---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Nachrichtenkanälen einrichten
    - Binden einer Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung
    - Fehlerbehebung beim ACP-Backend, bei der Plugin-Anbindung oder bei der Antwortzustellung
    - Ausführen von /acp-Befehlen aus dem Chat
sidebarTitle: ACP agents
summary: Externe Programmierumgebungen (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-05-06T07:04:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder Start einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der Standardpfad für Codex.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die
eingebettete Runtime `agentRuntime.id: "codex"`; ACP besitzt die
`/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code sich als externer MCP-Client
direkt mit bestehenden OpenClaw-Kanalunterhaltungen verbindet, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie dies                    | Hinweise                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                         | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stoppen und Steuerung. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                        |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen       | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                                                                                                        |
| Eine lokale AI-CLI als rein textbasiertes Fallback-Modell wiederverwenden                       | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                 |

## Funktioniert das sofort?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Starts, wenn ACP **wirklich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein,
die aktuelle Sitzung darf nicht durch die Sandbox blockiert sein, und ein
Runtime-Backend muss geladen sein. Wenn diese Bedingungen nicht erfüllt sind,
bleiben ACP-Plugin-Skills und die ACP-Anleitung für `sessions_spawn`
ausgeblendet, damit der Agent kein nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Fallstricke beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein restriktives Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Andere Ziel-Harness-Adapter können bei der ersten Verwendung weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Die Vendor-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindungen und Richtlinie; das Harness
    besitzt seine Provider-Anmeldung, den Modellkatalog, das Dateisystemverhalten
    und native Tools.

    Bevor Sie OpenClaw verantwortlich machen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness - Modell-IDs sind nicht zwischen Harnesses portierbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und überlassen Sie dem Backend seinen Standardwert.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsaufforderungen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe in der Regel ein ACPX-Berechtigungsprofil, das ohne Benutzerinteraktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges in
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für
`/acp spawn <id>` oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                             | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code-ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex-ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`  | GitHub Copilot-ACP-Adapter                     | Erfordert Copilot CLI-/Runtime-Authentifizierung.                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI-ACP-Adapter                         | Erfordert Gemini CLI-Authentifizierung oder API-Key-Einrichtung.                    |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi/Moonshot-Authentifizierung auf dem Host.                             |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode-ACP-Adapter                           | Erfordert OpenCode CLI-/Provider-Authentifizierung.                                 |
| `openclaw` | OpenClaw-Gateway-Bridge über `openclaw acp`    | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zurückzusprechen. |
| `pi`       | Pi/eingebettete OpenClaw-Runtime               | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert
werden, aber die OpenClaw-Richtlinie prüft vor dem Dispatch weiterhin
`acp.allowedAgents` und jede Zuordnung `agents.list[].runtime.acp.agent`.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im Thread fort (oder
    adressieren Sie den Sitzungsschlüssel explizit).
  </Step>
  <Step title="Status prüfen">
    `/acp status`
  </Step>
  <Step title="Anpassen">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steuern">
    Ohne den Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle-Details">
    - Starten erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf parent-owned ist.
    - Parent-owned ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Parent-Task-Notifier, statt sich wie eine normale benutzerorientierte Chat-Sitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste parent-owned One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Unterhaltungsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe abgeschlossen ist oder ihr Aufgabendatensatz fehlt.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden nie als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder die Bindung noch die Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seine eigene Upstream-Historie weiterhin behalten, wenn es Fortsetzen unterstützt.
    - Inaktive Runtime-Worker kommen nach `acp.runtime.ttlMinutes` für die Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routingregeln">
    Natürlichsprachliche Auslöser, die zum **nativen Codex-Plugin**
    routen sollten, wenn es aktiviert ist:

    - "Binden Sie diesen Discord-Kanal an Codex."
    - "Hängen Sie diesen Chat an den Codex-Thread `<id>` an."
    - "Zeigen Sie Codex-Threads an und binden Sie dann diesen."

    Die native Codex-Unterhaltungsbindung ist der standardmäßige Chat-Steuerungspfad.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie Shell/Apply-Patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse injiziert OpenClaw pro Turn ein natives
    Hook-Relay, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen routen können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelllauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay
    bleibt bewusst konservativ: Es verändert keine Codex-nativen Tool-Argumente
    und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur,
    wenn Sie das ACP-Runtime-/Sitzungsmodell möchten. Die Support-Grenze für
    eingebettetes Codex ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Modell-/Provider-/Runtime-Auswahl: Spickzettel">
    - `openai-codex/*` - PI-Codex-OAuth-/Abonnement-Route.
    - `openai/*` plus `agentRuntime.id: "codex"` - eingebettete native Runtime des Codex App-Servers.
    - `/codex ...` - native Codex-Unterhaltungssteuerung.
    - `/acp ...` oder `runtime: "acp"` - explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="ACP-Routing-Trigger in natürlicher Sprache">
    Trigger, die zur ACP-Runtime routen sollten:

    - "Führen Sie dies als einmalige Claude Code ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und behalten Sie anschließende Nachfragen in demselben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst das Harness-`agentId` auf,
    bindet bei Unterstützung an die aktuelle Unterhaltung oder den Thread und
    routet Nachfragen bis zum Schließen/Ablauf an diese Sitzung. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für die angeforderte Operation nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anforderer nicht sandboxed ist und ein ACP-Runtime-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert den automatischen
    ACP-Thread-Dispatch, verbirgt oder blockiert aber keine expliziten
    `sessions_spawn({ runtime: "acp" })`-Aufrufe. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser Eintrag ist
    explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    andernfalls verwenden Sie die Standard-Runtime für Sub-Agents. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie den **nativen Codex
App-Server** für Codex-Unterhaltungsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native
delegierte Ausführungen möchten.

| Bereich       | ACP-Sitzung                          | Sub-Agent-Ausführung               |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime  |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Control-Plane.
2. Offizielles `@openclaw/acpx`-Runtime-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Runtime-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Hintergrundaufgabenverfolgung und optionaler Unterhaltungs-/Thread-Bindung.

CLI-Backends sind separate textbasierte lokale Fallback-Runtimes - siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt als praktische Regel:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Runtime-Steuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentalmodell

- **Chat-Oberfläche** - wo Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** - der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, an den OpenClaw routet.
- **Kind-Thread/-Thema** - eine optionale zusätzliche Nachrichtenoberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** - der Dateisystemort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), an dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Unterhaltung

`/acp spawn <harness> --bind here` heftet die aktuelle Unterhaltung an die
erzeugte ACP-Sitzung - kein Kind-Thread, dieselbe Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung in seiner Verantwortung. Nachfolgende Nachrichten in dieser
Unterhaltung werden an dieselbe Sitzung geroutet; `/new` und `/reset` setzen die
Sitzung an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Unterhaltung ankündigen; andernfalls gibt OpenClaw eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung von Kind-Threads für `--thread auto|here` - nicht `--bind here`.
    - Wenn Sie ohne `--cwd` zu einem anderen ACP-Agent spawnen, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agent**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Unterhaltungen lokal - `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler Folgetext an die gebundene ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
    - ACP-Ausgabe wird an denselben Thread zurückgeliefert.
    - Unfocus/Schließen/Archivieren/Idle-Timeout oder Ablauf durch Höchstalter entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um den automatischen ACP-Thread-Dispatch zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Thread-Sitzungs-Spawns im Kanaladapter aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Thread-Bindungsunterstützung ist adapterspezifisch. Wenn der aktive Kanal-
    adapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Für nicht-ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in
Top-Level-`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Unterhaltungsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielunterhaltung. Formen pro Kanal:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-Forumthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/-Gruppe:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des besitzenden OpenClaw-Agent.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales betreiberseitiges Label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Runtime-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Runtime-Standardwerte pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standardwerte einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Überschreibungspriorität für ACP-gebundene Sitzungen:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globale ACP-Standardwerte (z. B. `acp.backend`)

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
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung geroutet.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Runtime-Bindungen (zum Beispiel von Thread-Focus-Flows erstellt) gelten weiterhin dort, wo sie vorhanden sind.
- Bei Cross-Agent-ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Ziel-Agent-Arbeitsbereich aus der Agent-Konfiguration.
- Fehlende geerbte Arbeitsbereichspfade fallen auf das Backend-Standard-cwd zurück; nicht fehlende Zugriffsfehler erscheinen als Spawn-Fehler.

## ACP-Sitzungen starten

Zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Aus sessions_spawn">
    Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agent-Turn oder
    Tool-Aufruf zu starten.

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
    `runtime` ist standardmäßig `subagent`; setzen Sie daher `runtime: "acp"` explizit
    für ACP-Sitzungen. Wenn `agentId` weggelassen wird, verwendet OpenClaw
    `acp.defaultAgent`, sofern konfiguriert. `mode: "session"` erfordert
    `thread: true`, um eine dauerhaft gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Verwenden Sie `/acp spawn` für explizite Operator-Steuerung aus dem Chat.

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
  Anfangs-Prompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn festgelegt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Thread-Bindungsablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist dauerhaft. Wenn `thread: true` gesetzt ist und
  `mode` weggelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig dauerhaftes
  Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Runtime-Arbeitsverzeichnis (durch Backend-/Runtime-
  Richtlinie validiert). Wenn weggelassen, übernimmt ACP Spawn den Workspace
  des Ziel-Agenten, sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-
  Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operator-seitige Bezeichnung, die in Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine bestehende ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ein. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Zusammenfassungen des anfänglichen ACP-Lauffortschritts als
  Systemereignisse zurück an die anfragende Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll verweist
  (`<sessionId>.acp-stream.jsonl`), das Sie für den vollständigen Relay-Verlauf per tail verfolgen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den ACP-Kind-Turn nach N Sekunden ab. `0` hält den Turn auf dem
  No-Timeout-Pfad des Gateways. Derselbe Wert wird auf den Gateway-
  Lauf und die ACP-Runtime angewendet, damit festhängende oder quota-erschöpfte Harnesses
  die Lane des Eltern-Agenten nicht unbegrenzt belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die ACP-Kindsitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Referenzen wie `openai-codex/gpt-5.4` in die Codex-
  ACP-Startkonfiguration vor `session/new`; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Andere Harnesses müssen ACP-`models` ankündigen und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl, statt
  stillschweigend auf den Standard des Ziel-Agenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet, und `off`
  lässt die Reasoning-Aufwand-Startüberschreibung weg.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuelle aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung an die aktuelle Unterhaltung.                   |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat Codex-gestützt machen“.
    - `--bind here` erstellt keinen Kind-Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für Bindungen aktueller Unterhaltungen bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen Kind-Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuellen aktiven Thread; schlägt fehl, wenn keiner vorhanden ist.                    |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                      |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten faktisch `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung fixieren möchten, ohne einen Kind-Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellmodell

ACP-Sitzungen können entweder interaktive Workspaces oder vom Elternteil
verwaltete Hintergrundarbeit sein. Der Zustellpfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-
    Oberfläche weiter zu kommunizieren:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgabe wird an denselben
    Kanal/Thread/dasselbe Thema zurückgeliefert.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur dann, wenn Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Von der Runtime erzeugte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten den internen Runtime-Kontext-Umschlag von OpenClaw; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Kindeergebnis und der Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Umschlag sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben, wo möglich, in OpenClaw strukturiert und werden nicht als benutzerverfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Einmalige ACP-Sitzungen, die von einem anderen Agentenlauf gestartet werden, sind Hintergrund-
    Kindprozesse, ähnlich wie Sub-Agents:

    - Der Elternteil fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Kind läuft in seiner eigenen ACP-Harness-Sitzung.
    - Kind-Turns laufen auf derselben Hintergrund-Lane, die von nativen Sub-Agent-Spawns verwendet wird, sodass ein langsames ACP-Harness nicht unabhängige Arbeit der Hauptsitzung blockiert.
    - Der Abschluss wird über den Task-Completion-Ankündigungspfad zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an ein externes Harness gesendet werden, sodass Harnesses keine nur für OpenClaw bestimmten Runtime-Kontextmarker sehen.
    - Der Elternteil formuliert das Kindeergebnis in normaler Assistentenstimme um, wenn eine benutzersichtbare Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen Elternteil
    und Kind. Das Kind hat bereits einen Abschlusskanal zurück zum
    Elternteil.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kann nach dem Spawn eine andere Sitzung ansprechen. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Injizieren der Nachricht einen Agent-zu-Agent-
    (A2A)-Folgepfad:

    - Auf die Antwort der Zielsitzung warten.
    - Optional anfragende und Ziel-Sitzung eine begrenzte Anzahl von Folgeturns austauschen lassen.
    - Die Zielsitzung auffordern, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender eine
    sichtbare Folgenachricht benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung ein
    ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur, wenn der Anfragende der
    Elternteil seines eigenen, vom Elternteil verwalteten, einmaligen ACP-Kindes ist. In diesem Fall
    kann A2A zusätzlich zur Task Completion den Elternteil mit dem
    Kindeergebnis wecken, die Antwort des Elternteils zurück an das Kind weiterleiten und
    eine Eltern/Kind-Echoschleife erzeugen. Das `sessions_send`-Ergebnis meldet
    `delivery.status="skipped"` für diesen verwalteten Kindfall, weil der
    Abschlusspfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Resume an existing session">
    Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ein, sodass er mit dem vollständigen Kontext des Vorherigen weiterarbeitet.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Eine Codex-Sitzung von Ihrem Laptop auf Ihr Telefon übergeben – weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben.
    - Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI gestartet haben, jetzt headless über Ihren Agenten.
    - Arbeit wiederaufnehmen, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses nur für ACP vorgesehene Feld.
    - `streamTo` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses nur für ACP vorgesehene Feld.
    - `resumeSessionId` ist eine host-lokale ACP-/Harness-Fortsetzungs-ID, kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft weiterhin die ACP-Spawn-Richtlinie und die Ziel-Agent-Richtlinie vor der Weiterleitung, während das ACP-Backend oder Harness die Autorisierung für das Laden dieser Upstream-ID verwaltet.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl – kein stillschweigender Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Führen Sie nach einem Gateway-Deployment eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Verifizieren Sie die deployte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Verifizieren Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validatorfehler.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Belassen Sie das Gate bei `mode: "run"` und überspringen Sie `streamTo: "parent"` –
    thread-gebundenes `mode: "session"` und Stream-Relay-Pfade sind separate
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Die externe Ausführungsumgebung kann gemäß ihren eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen und schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die ACP-Ausführung der Ausführungsumgebung **nicht**.
- OpenClaw erzwingt weiterhin ACP-Funktionsschranken, erlaubte Agenten, Sitzungsbesitz, Kanalbindungen und die Gateway-Zustellrichtlinie.
- Verwenden Sie `runtime: "subagent"` für durch die Sandbox erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, werden ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung des Sitzungsziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung/dieser Thread an eine ACP-Sitzung gebunden ist).
3. Fallback auf die aktuelle anfordernde Sitzung.

Bindungen der aktuellen Unterhaltung und Thread-Bindungen nehmen beide an
Schritt 2 teil.

Wenn kein Ziel aufgelöst wird, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl               | Was er tut                                                | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele lösen.                 | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeit-Konfigurationsoption schreiben.       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeit-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout (Sekunden) festlegen.                    | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Sitzungs-Laufzeitoptionen entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Speicher auflisten.          | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen.     | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen auf Laufzeit- und
Backend-Ebene. Fehler bei nicht unterstützten Steuerungen werden
klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Speicher für die aktuell gebundene oder anfordernde Sitzung; Ziel-Tokens
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

### Zuordnung der Laufzeitoptionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Äquivalente
Vorgänge:

| Befehl                       | Wird zugeordnet zu                    | Hinweise                                                                                                                                                                       |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | Laufzeit-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>`  | Laufzeit-Konfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw das entsprechende `reasoning_effort`, sofern der Adapter eines unterstützt.                                                                      |
| `/acp permissions <profile>` | Laufzeit-Konfigurationsschlüssel `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | Laufzeit-Konfigurationsschlüssel `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | Laufzeit-cwd-Überschreibung           | Direkte Aktualisierung.                                                                                                                                                        |
| `/acp set <key> <value>`     | generisch                             | `key=cwd` verwendet den Pfad der cwd-Überschreibung.                                                                                                                           |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen  | -                                                                                                                                                                              |

## acpx-Ausführungsumgebung, Plugin-Einrichtung und Berechtigungen

Informationen zur Konfiguration der acpx-Ausführungsumgebung (Claude Code / Codex / Gemini CLI-
Aliase), zu den MCP-Bridges für Plugin-Tools und OpenClaw-Tools sowie zu ACP-
Berechtigungsmodi finden Sie unter
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                | Behebung                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.                                            | Backend-Plugin installieren und aktivieren, `acpx` in `plugins.allow` aufnehmen, wenn diese Allowlist gesetzt ist, dann `/acp doctor` ausführen.                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                            | `acp.enabled=true` setzen.                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatischer Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                                                | `acp.dispatch.enabled=true` setzen, um automatisches Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin.             |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                      | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                         |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin fehlt, ist deaktiviert, durch Allow-/Deny-Richtlinie blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Backend-Plugin installieren/aktivieren, `/acp doctor` erneut ausführen und den Installations- oder Richtlinienfehler des Backends prüfen, wenn es fehlerhaft bleibt.          |
| Harness command not found                                                   | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erste `npx`-Abruf für einen Nicht-Codex-Adapter ist fehlgeschlagen. | `/acp doctor` ausführen, den Adapter auf dem Gateway-Host installieren/vorwärmen oder den acpx-Agent-Befehl explizit konfigurieren.                                           |
| Model-not-found vom Harness                                                 | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                               | Ein von diesem Harness aufgeführtes Modell verwenden, das Modell im Harness konfigurieren oder die Überschreibung weglassen.                                                  |
| Vendor-Auth-Fehler vom Harness                                              | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                     | Anmelden oder den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereitstellen.                                                                               |
| `Unable to resolve session target: ...`                                     | Ungültiger Schlüssel/ID/Label-Token.                                                                                   | `/acp sessions` ausführen, exakten Schlüssel/exaktes Label kopieren und erneut versuchen.                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                                                       | Zum Zielchat/-kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter unterstützt keine ACP-Binding-Fähigkeit für die aktuelle Unterhaltung.                                         | Wo unterstützt `/acp spawn ... --thread ...` verwenden, `bindings[]` auf oberster Ebene konfigurieren oder zu einem unterstützten Kanal wechseln.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                       | Zum Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Binding-Ziel.                                                                  | Als Besitzer neu binden oder eine andere Unterhaltung oder einen anderen Thread verwenden.                                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | Adapter unterstützt keine Thread-Binding-Fähigkeit.                                                                    | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft hostseitig; die anfordernde Sitzung ist sandboxed.                                                   | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                                             | Für erforderliches Sandboxing `runtime="subagent"` verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                                    |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness stellt keinen generischen ACP-Modellwechsel bereit.                                                   | Ein Harness verwenden, das ACP `models`/`session/set_model` anbietet, Codex-ACP-Modellreferenzen verwenden oder das Modell direkt im Harness konfigurieren, falls es ein eigenes Start-Flag hat. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                             | Mit `/acp spawn` neu erstellen, dann Thread neu binden/fokussieren.                                                                                                          |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Sitzung.                       | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                             | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                             | Gateway-Logs auf `AcpRuntimeError` prüfen. Für vollständige Berechtigungen `permissionMode=approve-all` setzen; für elegante Degradierung `nonInteractivePermissions=deny` setzen. |
| ACP-Sitzung hängt nach abgeschlossener Arbeit unbegrenzt                    | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                     | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                                    |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                       | Interner Event-Umschlag ist über die ACP-Grenze geleakt.                                                               | OpenClaw aktualisieren und den Abschlussablauf erneut ausführen; externe Harnesses sollten nur reine Abschluss-Prompts erhalten.                                             |

## Verwandt

- [ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
