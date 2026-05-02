---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Nachrichtenkanälen einrichten
    - Binden einer Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung
    - Fehlerbehebung bei ACP-Backend, Plugin-Verkabelung oder Completion-Zustellung
    - Ausführen von /acp-Befehlen aus dem Chat
sidebarTitle: ACP agents
summary: Führen Sie externe Coding-Umgebungen (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend aus
title: ACP-Agenten
x-i18n:
    generated_at: "2026-05-02T21:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder Spawn einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die
eingebettete Runtime `agentRuntime.id: "codex"`; ACP besitzt die
`/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client
direkt eine Verbindung zu bestehenden OpenClaw-Channel-Unterhaltungen herstellt,
verwenden Sie [`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite benötige ich?

| Sie möchten…                                                                                     | Verwenden Sie                         | Hinweise                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                          | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stoppen und Steuerung. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                                 |
| Eine OpenClaw Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen        | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                                                                                                                 |
| Eine lokale KI-CLI als textbasiertes Fallback-Modell wiederverwenden                             | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                          |

## Funktioniert das sofort?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Spawning, wenn ACP **wirklich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die aktuelle
Sitzung darf nicht durch eine Sandbox blockiert sein, und ein Runtime-Backend muss
geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills und
die `sessions_spawn`-ACP-Anleitung verborgen, damit der Agent kein
nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Fallstricke beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein restriktives Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Andere Ziel-Harness-Adapter können bei Bedarf beim ersten Verwenden weiterhin mit `npx` abgerufen werden.
    - Vendor-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugang hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindungen und Richtlinien; das Harness
    besitzt seine Provider-Anmeldung, seinen Modellkatalog, sein Dateisystemverhalten und
    native Tools.

    Bevor Sie OpenClaw als Ursache annehmen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell ist für dieses Harness vorhanden — Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und lassen Sie das Backend seinen Standard verwenden.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können native Berechtigungsaufforderungen nicht anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe normalerweise ein ACPX-Berechtigungsprofil, das ohne Interaktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges in
[ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup) nur dann, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für `/acp spawn <id>`
oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                              | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code-ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex-ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wurde. |
| `copilot`  | GitHub Copilot-ACP-Adapter                     | Erfordert Copilot-CLI/Runtime-Authentifizierung.                                    |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI-ACP-Adapter                         | Erfordert Gemini CLI-Authentifizierung oder API-Key-Einrichtung.                    |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi/Moonshot-Authentifizierung auf dem Host.                             |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode-ACP-Adapter                           | Erfordert OpenCode CLI/Provider-Authentifizierung.                                  |
| `openclaw` | OpenClaw Gateway-Bridge über `openclaw acp`    | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw Gateway-Sitzung zurückzusprechen. |
| `pi`       | Pi/eingebettete OpenClaw-Runtime               | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden, aber die
OpenClaw-Richtlinie prüft weiterhin `acp.allowedAgents` und jede Zuordnung
`agents.list[].runtime.acp.agent` vor dem Dispatch.

## Runbook für Operatoren

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Spawnen">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im gebundenen Thread fort
    (oder adressieren Sie den Sitzungsschlüssel explizit).
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
    `/acp cancel` (aktueller Durchlauf) oder `/acp close` (Sitzung + Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle-Details">
    - Spawning erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf einem Parent gehört.
    - Parent-eigene ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Parent-Aufgabenbenachrichtiger, statt wie eine normale nutzerseitige Chat-Sitzung zu agieren.
    - Aufgabenwartung schließt terminale oder verwaiste Parent-eigene One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Unterhaltungsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz verschwunden ist.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Durchlauf ab, wenn das Backend Abbruch unterstützt; es löscht weder die Bindung noch die Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus OpenClaw-Sicht und entfernt die Bindung. Ein Harness kann seine eigene Upstream-Historie weiterhin behalten, wenn es Fortsetzen unterstützt.
    - Inaktive Runtime-Worker kommen nach `acp.runtime.ttlMinutes` für die Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routing-Regeln">
    Auslöser in natürlicher Sprache, die an das **native Codex-Plugin**
    weitergeleitet werden sollten, wenn es aktiviert ist:

    - „Binden Sie diesen Discord-Channel an Codex.“
    - „Hängen Sie diesen Chat an den Codex-Thread `<id>` an.“
    - „Zeigen Sie Codex-Threads an und binden Sie dann diesen.“

    Native Codex-Unterhaltungsbindung ist der standardmäßige Chat-Steuerungspfad.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    native Codex-Tools wie Shell/Apply-Patch innerhalb von Codex ausgeführt werden.
    Für native Codex-Tool-Ereignisse fügt OpenClaw pro Durchlauf ein natives
    Hook-Relay ein, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    durch OpenClaw-Genehmigungen leiten können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelllauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay bleibt
    bewusst konservativ: Es verändert keine nativen Codex-Tool-Argumente und
    schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur,
    wenn Sie das ACP-Runtime-/Sitzungsmodell möchten. Die Supportgrenze für
    eingebettete Codex-Unterstützung ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Modell-/Provider-/Runtime-Auswahl: Spickzettel">
    - `openai-codex/*` — PI Codex OAuth-/Abonnement-Route.
    - `openai/*` plus `agentRuntime.id: "codex"` — native, eingebettete Codex App-Server-Runtime.
    - `/codex ...` — native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` — explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Trigger für ACP-Routing">
    Trigger, die zur ACP-Runtime geroutet werden sollten:

    - "Führen Sie dies als einmalige Claude Code ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und behalten Sie anschließende Nachfragen in demselben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst das Harness `agentId` auf,
    bindet sich, sofern unterstützt, an die aktuelle Konversation oder den Thread und
    routet Nachfragen bis zum Schließen/Ablauf an diese Sitzung. Codex folgt
    diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex
    Plugin für die angeforderte Operation nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Requester nicht sandboxed ist und ein ACP-Runtime-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert die automatische
    ACP-Thread-Weiterleitung, verbirgt oder blockiert aber keine expliziten
    `sessions_spawn({ runtime: "acp" })`-Aufrufe. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, sofern dieser Eintrag
    nicht ausdrücklich mit `agents.list[].runtime.type="acp"` konfiguriert ist;
    verwenden Sie andernfalls die Standard-Sub-Agent-Runtime. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime benötigen. Verwenden Sie den **nativen Codex
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`
Plugin aktiviert ist. Verwenden Sie **Sub-Agenten**, wenn Sie OpenClaw-native
delegierte Läufe wünschen.

| Bereich          | ACP-Sitzung                           | Sub-Agent-Lauf                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime  |
| Sitzungsschlüssel   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agenten](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP sieht der Stack so aus:

1. OpenClaw ACP-Sitzungs-Control-Plane.
2. Offizielles `@openclaw/acpx`-Runtime-Plugin.
3. Claude ACP-Adapter.
4. Claude-seitige Runtime-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Hintergrundaufgaben-Tracking und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate, text-only lokale Fallback-Runtimes — siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Operators gilt praktisch:

- **Sie möchten `/acp spawn`, bindbare Sitzungen, Runtime-Steuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Sie möchten einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** — wo Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, zu dem OpenClaw routet.
- **Untergeordneter Thread/untergeordnetes Thema** — eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** — der Dateisystemort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), an dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung — kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung in eigener Zuständigkeit. Nachfolgemeldungen in dieser
Konversation werden zur selben Sitzung geroutet; `/new` und `/reset` setzen die
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
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Konversation ankündigen; andernfalls gibt OpenClaw eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` — nicht `--bind here`.
    - Wenn Sie ohne `--cwd` zu einem anderen ACP-Agent spawnen, erbt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal — `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler Nachfolgetext zur gebundenen ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine ACP-Zielsitzung.
    - Nachfolgemeldungen in diesem Thread werden zur gebundenen ACP-Sitzung geroutet.
    - ACP-Ausgaben werden an denselben Thread zurückgeliefert.
    - Unfocus/Schließen/Archivieren/Idle-Timeout oder Ablauf des Höchstalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Kanaladapter-Thread-Sitzungs-Spawns aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanal-
    Adapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumsthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Konfigurieren Sie für nicht-ephemere Workflows persistente ACP-Bindungen in
Top-Level-`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalbezogene Formen:

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
  Optionales, operatorseitiges Label.
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
- Nachrichten in diesem Kanal oder Thema werden zur konfigurierten ACP-Sitzung geroutet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Runtime-Bindungen (zum Beispiel durch Thread-Focus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Für agentübergreifende ACP-Spawns ohne explizites `cwd` erbt OpenClaw den Ziel-Agent-Arbeitsbereich aus der Agent-Konfiguration.
- Fehlende geerbte Arbeitsbereichspfade fallen auf das Standard-cwd des Backends zurück; nicht fehlende Zugriffsfehler erscheinen als Spawn-Fehler.

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
    `runtime` ist standardmäßig `subagent`, legen Sie daher `runtime: "acp"` ausdrücklich
    für ACP-Sitzungen fest. Wenn `agentId` ausgelassen wird, verwendet OpenClaw
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

### Parameter für `sessions_spawn`

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
  Fordert einen Thread-Bindungsablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist ein einmaliger Lauf; `"session"` ist persistent. Wenn `thread: true` ist und
  `mode` ausgelassen wird, kann OpenClaw je nach
  Laufzeitpfad standardmäßig persistentes Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Arbeitsverzeichnis der Laufzeitumgebung (validiert durch Backend-/Laufzeit-
  Richtlinie). Wenn ausgelassen, erbt ACP Spawn den Arbeitsbereich des Ziel-Agenten,
  sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-
  Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operator-seitiges Label, das in Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine bestehende ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs als Systemereignisse zurück an die
  anfordernde Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll verweist
  (`<sessionId>.acp-stream.jsonl`), dem Sie für den vollständigen Relay-Verlauf folgen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den ACP-Kind-Turn nach N Sekunden ab. `0` lässt den Turn auf dem
  No-Timeout-Pfad des Gateways. Derselbe Wert wird auf den Gateway-
  Lauf und die ACP-Laufzeit angewendet, damit blockierte oder quotenerschöpfte Harnesses nicht
  unbegrenzt die Lane des übergeordneten Agenten belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die ACP-Kindsitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Referenzen wie `openai-codex/gpt-5.4` vor `session/new` in die Codex-
  ACP-Startkonfiguration; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Andere Harnesses müssen ACP-`models` ankündigen und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl, statt
  stillschweigend auf den Standard des Ziel-Agenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet, und `off`
  lässt die Startüberschreibung für den Reasoning-Aufwand aus.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuelle aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung an die aktuelle Unterhaltung.                   |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Channel oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen Kind-Thread.
    - `--bind here` ist nur auf Channels verfügbar, die Unterstützung für Bindungen der aktuellen Unterhaltung bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen Kind-Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuellen aktiven Thread; schlägt fehl, wenn Sie sich in keinem befinden.             |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                      |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
    - Thread-gebundener Spawn erfordert Channel-Richtlinienunterstützung:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen Kind-Thread zu erstellen.

  </Tab>
</Tabs>

## Auslieferungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder vom übergeordneten Agenten verwaltete
Hintergrundarbeit sein. Der Auslieferungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-
    Oberfläche weiter zu sprechen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Channel-Thread bzw. ein Thema an die ACP-Sitzung.
    - Persistente konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgaben werden zurück an denselben
    Channel/Thread/dasselbe Thema ausgeliefert.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur, wenn das Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor dem ACP-Dispatch abgefangen.
    - Von der Laufzeit erzeugte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten OpenClaws interne Runtime-Kontext-Hülle; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Kindeergebnis und der Anweisung. Die rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Hülle sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext gespeichert werden.
    - ACP-Transkripteinträge verwenden den für Benutzer sichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben nach Möglichkeit in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Einmalige ACP-Sitzungen, die von einem anderen Agentenlauf gestartet werden, sind Hintergrund-
    Kinder, ähnlich wie Sub-Agents:

    - Der übergeordnete Agent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Kind läuft in seiner eigenen ACP-Harness-Sitzung.
    - Kind-Turns laufen auf derselben Hintergrund-Lane, die von nativen Sub-Agent-Spawns verwendet wird, sodass ein langsames ACP-Harness unabhängige Arbeit der Hauptsitzung nicht blockiert.
    - Abschlussberichte laufen über den Ankündigungspfad für Aufgabenabschlüsse zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an ein externes Harness gesendet werden, sodass Harnesses keine nur für OpenClaw bestimmten Runtime-Kontextmarker sehen.
    - Der übergeordnete Agent formuliert das Kindeergebnis in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem Agenten
    und Kind. Das Kind hat bereits einen Abschlusskanal zurück zum
    übergeordneten Agenten.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kann nach dem Spawn eine andere Sitzung adressieren. Für normale
    Peer-Sitzungen verwendet OpenClaw einen Agent-zu-Agent-Folgepfad (A2A),
    nachdem die Nachricht injiziert wurde:

    - Warten Sie auf die Antwort der Zielsitzung.
    - Optional können Anforderer und Ziel eine begrenzte Anzahl von Folge-Turns austauschen.
    - Fordern Sie das Ziel auf, eine Ankündigungsnachricht zu erzeugen.
    - Liefern Sie diese Ankündigung an den sichtbaren Channel oder Thread aus.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Absender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine unabhängige Sitzung ein ACP-Ziel
    sehen und ihm Nachrichten senden kann, beispielsweise unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur, wenn der Anforderer der
    übergeordnete Agent seines eigenen, vom übergeordneten Agenten verwalteten einmaligen ACP-Kinds ist. In diesem Fall
    kann A2A zusätzlich zum Aufgabenabschluss den übergeordneten Agenten mit dem
    Kindeergebnis wecken, die Antwort des übergeordneten Agenten zurück an das Kind weiterleiten und
    eine Echo-Schleife zwischen übergeordnetem Agenten und Kind erzeugen. Das `sessions_send`-Ergebnis meldet
    `delivery.status="skipped"` für diesen Fall eines eigenen Kinds, weil der
    Abschlusspfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Resume an existing session">
    Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorangegangenen weitermacht.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übergeben Sie eine Codex-Sitzung von Ihrem Laptop an Ihr Telefon — weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben.
    - Setzen Sie eine Coding-Sitzung fort, die Sie interaktiv in der CLI gestartet haben, jetzt headless über Ihren Agenten.
    - Nehmen Sie Arbeit wieder auf, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"` ist; die Standard-Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"` ist; die Standard-Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `resumeSessionId` ist eine host-lokale ACP-/Harness-Fortsetzungs-ID, kein OpenClaw-Channel-Sitzungsschlüssel; OpenClaw prüft vor dem Dispatch weiterhin die ACP-Spawn-Richtlinie und die Ziel-Agent-Richtlinie, während das ACP-Backend oder Harness die Autorisierung zum Laden dieser Upstream-ID besitzt.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Führen Sie nach einem Gateway-Deployment eine Live-End-to-End-Prüfung durch, statt
    Unit-Tests zu vertrauen:

    1. Verifizieren Sie die bereitgestellte Gateway-Version und den Commit auf dem Ziel-Host.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Verifizieren Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Halten Sie das Gate auf `mode: "run"` und überspringen Sie `streamTo: "parent"` —
    Thread-gebundenes `mode: "session"` und Stream-Relay-Pfade sind separate
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeitumgebung, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die ACP-Harness-Ausführung **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agenten, Sitzungseigentümerschaft, Kanalbindungen und die Gateway-Zustellungsrichtlinie.
- Verwenden Sie `runtime: "subagent"` für Sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
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

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen eindeutigen Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufende Runde für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele lösen.                 | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeitkonfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeit-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für Genehmigungsrichtlinien festlegen.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout festlegen (Sekunden).                    | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Laufzeitoptionsüberschreibungen der Sitzung entfernen.    | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Speicher auflisten.        | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten und umsetzbare Korrekturen.  | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen
auf Laufzeit- und Backend-Ebene. Fehler für nicht unterstützte Steuerungen
werden klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions`
liest den Speicher für die aktuell gebundene oder anfordernde Sitzung; Ziel-Tokens
(`session-key`, `session-id` oder `session-label`) werden über die Gateway-
Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-
Wurzeln pro Agent.

### Zuordnung der Laufzeitoptionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                       | Zuordnung zu                         | Hinweise                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | Laufzeitkonfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>`  | Laufzeitkonfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw das entsprechende `reasoning_effort`, sofern der Adapter eines unterstützt.                                                                      |
| `/acp permissions <profile>` | Laufzeitkonfigurationsschlüssel `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | Laufzeitkonfigurationsschlüssel `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | Laufzeit-cwd-Überschreibung          | Direkte Aktualisierung.                                                                                                                                                        |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den Pfad der cwd-Überschreibung.                                                                                                                           |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen | —                                                                                                                                                                              |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI-
Aliasse), zu den MCP-Bridges für Plugin-Tools und OpenClaw-Tools sowie zu
ACP-Berechtigungsmodi finden Sie unter
[ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                 | Behebung                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                        | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                             | Setzen Sie `acp.enabled=true`.                                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatischer Dispatch von normalen Thread-Nachrichten ist deaktiviert.                                                  | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin.                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                       | Verwenden Sie eine erlaubte `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                          |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin fehlt, ist deaktiviert, wird durch Allow-/Deny-Policy blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Backend-Installations- oder Policy-Fehler, wenn es weiterhin fehlerhaft bleibt.     |
| Harness-Befehl nicht gefunden                                               | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erstmalige `npx`-Abruf ist für einen Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/prewärmen Sie den Adapter auf dem Gateway-Host oder konfigurieren Sie den acpx-Agent-Befehl explizit.                                           |
| Modell nicht gefunden vom Harness                                           | Modell-ID ist für einen anderen Provider/ein anderes Harness gültig, aber nicht für dieses ACP-Ziel.                    | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                   |
| Vendor-Authentifizierungsfehler vom Harness                                 | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                      | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereit.                                                                              |
| `Unable to resolve session target: ...`                                     | Ungültiger Schlüssel/ID/Label-Token.                                                                                    | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel/das exakte Label und versuchen Sie es erneut.                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                                                        | Wechseln Sie zum Ziel-Chat/-Kanal und versuchen Sie es erneut, oder verwenden Sie ungebundenes Spawn.                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter bietet keine ACP-Binding-Fähigkeit für die aktuelle Konversation.                                                | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                          |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                        | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Binding-Ziel.                                                                    | Binden Sie als Besitzer neu oder verwenden Sie eine andere Konversation oder einen anderen Thread.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter bietet keine Thread-Binding-Fähigkeit.                                                                          | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime ist hostseitig; die anfragende Sitzung läuft in einer Sandbox.                                              | Verwenden Sie `runtime="subagent"` aus Sandbox-Sitzungen heraus oder starten Sie ACP-Spawn aus einer nicht sandboxierten Sitzung.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Runtime angefordert.                                                                  | Verwenden Sie `runtime="subagent"` für erforderliche Sandbox-Ausführung oder ACP mit `sandbox="inherit"` aus einer nicht sandboxierten Sitzung.                                             |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.                                                  | Verwenden Sie ein Harness, das ACP `models`/`session/set_model` angibt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, wenn es ein eigenes Start-Flag hat. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                             | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Sitzung.                       | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                             | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                             | Prüfen Sie die Gateway-Logs auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für kontrollierte Degradation setzen Sie `nonInteractivePermissions=deny`. |
| ACP-Sitzung hängt nach Abschluss der Arbeit unbegrenzt                      | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                      | Überwachen Sie mit `ps aux \| grep acpx`; beenden Sie veraltete Prozesse manuell.                                                                                                          |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                       | Interner Ereignisumschlag ist über die ACP-Grenze hinaus durchgesickert.                                                | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur reine Abschluss-Prompts erhalten.                                                   |

## Verwandt

- [ACP-Agents – Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agents](/de/tools/subagents)
