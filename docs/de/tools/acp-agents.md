---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen in Nachrichtenkanälen einrichten
    - Binden einer Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung
    - Fehlerbehebung bei ACP-Backend, Plugin-Verdrahtung oder Auslieferung von Vervollständigungen
    - Bedienung von /acp-Befehlen aus dem Chat
sidebarTitle: ACP agents
summary: Externe Programmierumgebungen (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-05-02T06:47:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36a1c58b22d0f615e20e84fcdb15c39800825ee0bad64c966d6f14d44d3c1458
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin besitzt die Steuerungen für `/codex ...` und die
eingebettete Runtime `agentRuntime.id: "codex"`; ACP besitzt die Steuerungen
für `/acp ...` und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client
direkt eine Verbindung zu bestehenden OpenClaw-Kanalunterhaltungen herstellt,
verwenden Sie [`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie                         | Hinweise                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex in der aktuellen Unterhaltung binden oder steuern                                         | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stopp- und Steuerungsfunktionen. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                                 |
| Eine OpenClaw Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen       | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                                                                 |
| Eine lokale AI-CLI als reines Text-Fallback-Modell wiederverwenden                              | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                           |

## Funktioniert das direkt nach der Installation?

In der Regel ja. Neue Installationen liefern das gebündelte `acpx`-Runtime-Plugin
standardmäßig aktiviert aus, mit einer Plugin-lokal gepinnten `acpx`-Binärdatei,
die OpenClaw prüft und sofort selbst repariert, nachdem der Gateway-HTTP-Listener
aktiv ist. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Starts, wenn ACP **wirklich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die
aktuelle Sitzung darf nicht durch die Sandbox blockiert sein, und ein Runtime-Backend
muss geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills
und `sessions_spawn`-ACP-Hinweise ausgeblendet, damit der Agent kein nicht verfügbares
Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Stolperfallen beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein restriktives Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird der gebündelte Standard absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der gebündelte Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Andere Ziel-Harness-Adapter können beim ersten Verwenden weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Die Anbieteranmeldung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindungen und Richtlinien; das Harness
    besitzt seine Provider-Anmeldung, seinen Modellkatalog, sein Dateisystemverhalten
    und seine nativen Tools.

    Prüfen Sie Folgendes, bevor Sie OpenClaw verantwortlich machen:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness — Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und lassen Sie das Backend seinen Standard verwenden.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsaufforderungen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe normalerweise ein ACPX-Berechtigungsprofil, das ohne Benutzereingriff fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges in
[ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem gebündelten `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für
`/acp spawn <id>` oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                             | Hinweise                                                                            |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code-ACP-Adapter                       | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex-ACP-Adapter                             | Nur expliziter ACP-Fallback, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wurde. |
| `copilot`  | GitHub Copilot-ACP-Adapter                    | Erfordert Copilot-CLI/Runtime-Authentifizierung.                                    |
| `cursor`   | Cursor CLI-ACP (`cursor-agent acp`)           | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                             | Erfordert Factory/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI-ACP-Adapter                        | Erfordert Gemini CLI-Authentifizierung oder API-Schlüsseleinrichtung.               |
| `iflow`    | iFlow CLI                                     | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                 | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                             | Erfordert Kimi/Moonshot-Authentifizierung auf dem Host.                             |
| `kiro`     | Kiro CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode-ACP-Adapter                          | Erfordert OpenCode CLI/Provider-Authentifizierung.                                  |
| `openclaw` | OpenClaw Gateway-Bridge über `openclaw acp`   | Ermöglicht einem ACP-fähigen Harness, zurück mit einer OpenClaw Gateway-Sitzung zu sprechen. |
| `pi`       | Pi/eingebettete OpenClaw-Runtime              | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                          | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden,
aber die OpenClaw-Richtlinie prüft weiterhin `acp.allowedAgents` und jede
`agents.list[].runtime.acp.agent`-Zuordnung vor dem Dispatch.

## Betreiber-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im gebundenen Thread fort
    (oder zielen Sie explizit auf den Sitzungsschlüssel).
  </Step>
  <Step title="Status prüfen">
    `/acp status`
  </Step>
  <Step title="Abstimmen">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steuern">
    Ohne Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lebenszyklusdetails">
    - Spawn erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf einem Parent gehört.
    - Parent-eigene ACP-Sitzungen werden als Hintergrundarbeit behandelt, selbst wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Parent-Aufgabenbenachrichtiger, statt sich wie eine normale benutzerseitige Chatsitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste Parent-eigene One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Unterhaltungsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz verschwunden ist.
    - Gebundene Folgemeldungen gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder die Bindung noch die Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann weiterhin seinen eigenen Upstream-Verlauf behalten, wenn es Fortsetzen unterstützt.
    - Inaktive Runtime-Worker können nach `acp.runtime.ttlMinutes` bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routing-Regeln">
    Natürlichsprachliche Auslöser, die zum **nativen Codex-Plugin**
    routen sollen, wenn es aktiviert ist:

    - „Binden Sie diesen Discord-Kanal an Codex.“
    - „Hängen Sie diesen Chat an den Codex-Thread `<id>` an.“
    - „Zeigen Sie Codex-Threads an und binden Sie dann diesen.“

    Native Codex-Unterhaltungsbindung ist der Standardpfad für Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie shell/apply-patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse injiziert OpenClaw pro Turn ein natives
    Hook-Relay, sodass Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen routen können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das
    Relay bleibt bewusst konservativ: Es verändert keine Codex-nativen Tool-Argumente
    und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur,
    wenn Sie das ACP-Runtime/Sitzungsmodell möchten. Die eingebettete Codex-
    Supportgrenze ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract)
    dokumentiert.

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - `openai-codex/*` — PI-Codex-OAuth-/Abonnement-Route.
    - `openai/*` plus `agentRuntime.id: "codex"` — native eingebettete Laufzeitumgebung des Codex-App-Servers.
    - `/codex ...` — native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` — explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    Auslöser, die zur ACP-Laufzeitumgebung routen sollten:

    - "Als einmalige Claude Code-ACP-Sitzung ausführen und das Ergebnis zusammenfassen."
    - "Gemini CLI für diese Aufgabe in einem Thread verwenden und Folgeaktionen anschließend in demselben Thread behalten."
    - "Codex über ACP in einem Hintergrund-Thread ausführen."

    OpenClaw wählt `runtime: "acp"`, löst den Harness-`agentId` auf,
    bindet, sofern unterstützt, an die aktuelle Konversation oder den Thread und
    routet Folgeaktionen bis zum Schließen/Ablauf an diese Sitzung. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für die angeforderte Operation nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anforderer nicht sandboxed ist und ein ACP-Laufzeit-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert die automatische
    ACP-Thread-Dispatch-Verarbeitung, blendet explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe jedoch nicht aus und blockiert sie nicht. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser Eintrag ist
    ausdrücklich mit `agents.list[].runtime.type="acp"` konfiguriert;
    verwenden Sie andernfalls die Standard-Sub-Agent-Laufzeitumgebung. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeitumgebung benötigen. Verwenden Sie den **nativen Codex-
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native
delegierte Läufe benötigen.

| Bereich        | ACP-Sitzung                           | Sub-Agent-Lauf                   |
| -------------- | ------------------------------------- | -------------------------------- |
| Laufzeit       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Hauptbefehle   | `/acp ...`                            | `/subagents ...`                 |
| Spawn-Tool     | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungssteuerungsebene.
2. Gebündeltes `acpx`-Laufzeit-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Hintergrundaufgabenverfolgung und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate reine Text-Laufzeitumgebungen für lokale Fallbacks — siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder dauerhafte Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einen einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** — wo Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Laufzeitstatus, an den OpenClaw routet.
- **Untergeordneter Thread/Thema** — eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Workspace** — der Dateisystemort (`cwd`, Repo-Checkout, Backend-Workspace), an dem der Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung an — kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung unter Kontrolle. Folgenachrichten in dieser
Konversation werden an dieselbe Sitzung geroutet; `/new` und `/reset` setzen die
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
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Konversation ankündigen; OpenClaw gibt andernfalls eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg erhalten.
    - In Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` — nicht `--bind here`.
    - Wenn Sie einen anderen ACP-Agent ohne `--cwd` erzeugen, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agenten**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf die Backend-Standardeinstellung zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal — `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler Folgetext an die gebundene ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
    - ACP-Ausgabe wird an denselben Thread zurückgeliefert.
    - Unfocus/Schließen/Archivieren/Idle-Timeout oder Max-Age-Ablauf entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an den ACP-Harness.

    Erforderliche Feature-Flags für threadgebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um die automatische ACP-Thread-Dispatch-Verarbeitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Erzeugen von Thread-Sitzungen im Kanaladapter aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanal-
    adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumsthemen in Gruppen/Supergroups und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Für nicht ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in
`bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Formen pro Kanal:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-Forumsthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/-Gruppe:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des besitzenden OpenClaw-Agenten.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales betreiberseitiges Label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Laufzeit-Standards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Überschreibungsrangfolge für ACP-gebundene Sitzungen:**

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

- OpenClaw stellt sicher, dass die konfigurierte ACP-Sitzung vor der Verwendung vorhanden ist.
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung geroutet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Laufzeitbindungen (zum Beispiel durch Thread-Focus-Flows erstellt) gelten weiterhin, wo vorhanden.
- Für Cross-Agent-ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Ziel-Agent-Workspace aus der Agent-Konfiguration.
- Fehlende geerbte Workspace-Pfade fallen auf das Standard-cwd des Backends zurück; nicht fehlende Zugriffsfehler erscheinen als Spawn-Fehler.

## ACP-Sitzungen starten

Zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="From sessions_spawn">
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
    `thread: true`, um eine persistente gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="Über den /acp-Befehl">
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
  Initialer Prompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Thread-Bindungsablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist persistent. Wenn `thread: true` ist und
  `mode` weggelassen wird, kann OpenClaw je nach
  Runtime-Pfad standardmäßig persistentes Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Runtime-Arbeitsverzeichnis (durch Backend-/Runtime-
  Richtlinie validiert). Wenn es weggelassen wird, erbt der ACP-Spawn den Arbeitsbereich des Zielagenten,
  sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-
  Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operator-sichtbares Label, das in Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs als Systemereignisse zurück an die
  anfordernde Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, der auf ein sitzungsbezogenes JSONL-Protokoll verweist
  (`<sessionId>.acp-stream.jsonl`), das Sie für den vollständigen Relay-Verlauf mitverfolgen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den ACP-Child-Turn nach N Sekunden ab. `0` hält den Turn auf dem
  No-Timeout-Pfad des Gateway. Derselbe Wert wird auf den Gateway-
  Lauf und die ACP-Runtime angewendet, damit festhängende oder quota-erschöpfte Harnesses nicht
  unbegrenzt die Parent-Agent-Spur belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizites Modell-Override für die ACP-Child-Sitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Refs wie `openai-codex/gpt-5.4` vor
  `session/new` in die Codex-ACP-Startkonfiguration; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Andere Harnesses müssen ACP-`models` angeben und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl, statt
  stillschweigend auf den Standard des Zielagenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet, und `off`
  lässt das Reasoning-Aufwand-Start-Override weg.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Unterhaltung an Ort und Stelle; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                  |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen Child-Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für die Bindung der aktuellen Unterhaltung bereitstellen.
    - `--bind` und `--thread` können im selben `/acp spawn`-Aufruf nicht kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen Child-Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuell aktiven Thread; schlägt fehl, wenn Sie sich in keinem befinden.               |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                      |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten faktisch `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung ohne Erstellen eines Child-Threads anheften möchten.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder Parent-eigene
Hintergrundarbeit sein. Der Zustellungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür vorgesehen, auf einer sichtbaren Chat-
    Oberfläche weiterzusprechen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Topic an die ACP-Sitzung.
    - Persistent konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Follow-up-Nachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgaben werden an denselben
    Kanal/Thread/dasselbe Topic zurückgeliefert.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Follow-ups werden als Prompt-Text gesendet, plus Anhänge nur, wenn Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor dem ACP-Dispatch abgefangen.
    - Runtime-generierte Abschlussereignisse werden je Ziel materialisiert. OpenClaw-Agenten erhalten den internen Runtime-Kontext-Umschlag von OpenClaw; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Child-Ergebnis und der Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Umschlag sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben, wo möglich, in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-eigene einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agentenlauf gespawnt werden, sind Hintergrund-
    Children, ähnlich wie Sub-Agents:

    - Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
    - Child-Turns laufen auf derselben Hintergrundspur, die von nativen Sub-Agent-Spawns verwendet wird, sodass ein langsames ACP-Harness keine unzusammenhängende Arbeit der Hauptsitzung blockiert.
    - Abschlussmeldungen laufen über den Task-Completion-Ankündigungspfad zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor es sie an ein externes Harness sendet, sodass Harnesses keine OpenClaw-eigenen Runtime-Kontextmarker sehen.
    - Der Parent schreibt das Child-Ergebnis in normaler Assistentenstimme um, wenn eine benutzersichtbare Antwort hilfreich ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen Parent
    und Child. Das Child hat bereits einen Abschlusskanal zurück zum
    Parent.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Spawn eine andere Sitzung adressieren. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Injizieren der Nachricht einen Agent-to-Agent-(A2A)-Follow-up-Pfad:

    - Auf die Antwort der Zielsitzung warten.
    - Optional den Anforderer und das Ziel eine begrenzte Anzahl von Follow-up-Turns austauschen lassen.
    - Das Ziel bitten, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender ein
    sichtbares Follow-up benötigt. Er bleibt aktiviert, wenn eine unzusammenhängende Sitzung ein
    ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt das A2A-Follow-up nur, wenn der Anforderer der
    Parent seines eigenen Parent-eigenen einmaligen ACP-Child ist. In diesem Fall kann
    A2A zusätzlich zur Task Completion den Parent mit dem
    Child-Ergebnis wecken, die Antwort des Parent zurück in das Child weiterleiten und
    eine Parent/Child-Echoschleife erzeugen. Das `sessions_send`-Ergebnis meldet
    `delivery.status="skipped"` für diesen Fall eines eigenen Child, weil der
    Abschluss-Pfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorherigen weiterarbeitet.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Eine Codex-Sitzung von Ihrem Laptop auf Ihr Telefon übergeben — weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben.
    - Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, nun headless über Ihren Agenten.
    - Arbeit wiederaufnehmen, die durch einen Gateway-Neustart oder Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"` ist; die standardmäßige Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"` ist; die standardmäßige Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `resumeSessionId` ist eine host-lokale ACP-/Harness-Resume-ID, kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft weiterhin die ACP-Spawn-Richtlinie und die Zielagentenrichtlinie vor dem Dispatch, während das ACP-Backend oder Harness die Autorisierung zum Laden dieser Upstream-ID besitzt.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Zielagent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Post-Deploy-Smoke-Test">
    Führen Sie nach einem Gateway-Deploy eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Verifizieren Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Verifizieren Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Belassen Sie das Gate auf `mode: "run"` und überspringen Sie `streamTo: "parent"` —
    thread-gebundenes `mode: "session"` und Stream-Relay-Pfade sind separate
    umfangreichere Integrationsläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Harness **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, zugelassene Agenten, Sitzungseigentümerschaft, Kanalbindungen und Gateway-Zustellungsrichtlinien.
- Verwenden Sie `runtime: "subagent"` für OpenClaw-native Arbeit mit Sandbox-Erzwingung.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
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

Bindungen der aktuellen Unterhaltung und Thread-Bindungen werden beide in
Schritt 2 berücksichtigt.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl              | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Schreiboperation für Laufzeitkonfigurationsoptionen. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeit-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für die Genehmigungsrichtlinie festlegen.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout (Sekunden) festlegen.                    | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen von Sitzungs-Laufzeitoptionen entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Kürzlich verwendete ACP-Sitzungen aus dem Store auflisten. | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Fehlerbehebungen. | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen auf Laufzeit- und
Backend-Ebene. Fehler zu nicht unterstützten Steuerungen werden
klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Store für die aktuell gebundene oder anfordernde Sitzung; Ziel-Token
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

### Zuordnung von Laufzeitoptionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                      | Wird zugeordnet zu                    | Hinweise                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | Laufzeitkonfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>`  | Laufzeitkonfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw das entsprechende `reasoning_effort`, sofern der Adapter eines unterstützt.                                                                      |
| `/acp permissions <profile>` | Laufzeitkonfigurationsschlüssel `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | Laufzeitkonfigurationsschlüssel `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | Laufzeit-cwd-Überschreibung           | Direkte Aktualisierung.                                                                                                                                                       |
| `/acp set <key> <value>`     | generisch                             | `key=cwd` verwendet den Pfad für die cwd-Überschreibung.                                                                                                                       |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen  | —                                                                                                                                                                              |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI-
Aliasse), zu den MCP-Brücken plugin-tools und OpenClaw-tools sowie zu ACP-
Berechtigungsmodi finden Sie unter
[ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                      | Behebung                                                                                                                                                                                            |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                             | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                                  | Setzen Sie `acp.enabled=true`.                                                                                                                                                                      |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatischer Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                                                      | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing wieder aufzunehmen; explizite Aufrufe von `sessions_spawn({ runtime: "acp" })` funktionieren weiterhin.                 |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                            | Verwenden Sie eine erlaubte `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                                    |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin fehlt, ist deaktiviert, wird durch Allow-/Deny-Richtlinien blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Installations- oder Richtlinienfehler des Backends, falls es weiterhin fehlerhaft bleibt.    |
| Harness command not found                                                   | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erste `npx`-Abruf für einen Nicht-Codex-Adapter ist fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit.                                                    |
| Model-not-found from the harness                                            | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                                     | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                            |
| Vendor auth error from the harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                           | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Umgebung des Gateway-Hosts bereit.                                                                                  |
| `Unable to resolve session target: ...`                                     | Ungültiger Schlüssel/ID/Label-Token.                                                                                         | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel/das exakte Label und versuchen Sie es erneut.                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                                                              | Wechseln Sie zum Ziel-Chat/-Kanal und versuchen Sie es erneut, oder verwenden Sie einen ungebundenen Spawn.                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine ACP-Bindungsfunktion für die aktuelle Unterhaltung.                                                        | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                             | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                         | Binden Sie als Besitzer erneut oder verwenden Sie eine andere Unterhaltung oder einen anderen Thread.                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Thread-Bindungsfunktion.                                                                                   | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Laufzeit ist hostseitig; die anfordernde Sitzung läuft in der Sandbox.                                                   | Verwenden Sie `runtime="subagent"` aus Sandbox-Sitzungen heraus oder führen Sie ACP-Spawn aus einer Nicht-Sandbox-Sitzung aus.                                                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Laufzeit angefordert.                                                                  | Verwenden Sie `runtime="subagent"` für erforderliche Sandbox-Ausführung oder ACP mit `sandbox="inherit"` aus einer Nicht-Sandbox-Sitzung heraus.                                                    |
| `Cannot apply --model ... did not advertise model support`                  | Der Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.                                                       | Verwenden Sie einen Harness, der ACP-`models`/`session/set_model` ankündigt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls dieser ein eigenes Start-Flag hat. |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                                   | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Exec-Vorgänge in einer nicht interaktiven ACP-Sitzung.                                   | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie den Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                                   | Prüfen Sie die Gateway-Logs auf `AcpRuntimeError`. Für volle Berechtigungen setzen Sie `permissionMode=approve-all`; für graceful Degradation setzen Sie `nonInteractivePermissions=deny`.         |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                           | Überwachen Sie mit `ps aux \| grep acpx`; beenden Sie veraltete Prozesse manuell.                                                                                                                   |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interner Ereignisumschlag ist über die ACP-Grenze geleakt.                                                                   | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur einfache Abschluss-Prompts erhalten.                                                        |

## Verwandte Themen

- [ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
