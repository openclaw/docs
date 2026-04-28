---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Channels einrichten
    - Eine Konversation auf einem Nachrichten-Channel an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend, Plugin-Verdrahtung oder Zustellung von Abschlüssen
    - Ausführen von `/acp`-Befehlen aus dem Chat
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-26T11:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
lassen OpenClaw externe Coding-Harnesses ausführen (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin.

Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin verwaltet `/codex ...`-Steuerelemente und die
eingebettete Laufzeit `agentRuntime.id: "codex"`; ACP verwaltet
`/acp ...`-Steuerelemente und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn du möchtest, dass Codex oder Claude Code sich als externer MCP-Client
direkt mit bestehenden OpenClaw-Kanalunterhaltungen verbindet, verwende
statt ACP [`openclaw mcp serve`](/de/cli/mcp).
</Note>

## Welche Seite brauche ich?

| Du möchtest…                                                                                   | Verwende das                         | Hinweise                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                       | `/codex bind`, `/codex threads`      | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; enthält gebundene Chat-Antworten, Bildweiterleitung, Modell-/Fast-/Berechtigungs-, Stopp- und Steuerungsoptionen. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                          | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerung                                                                          |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen      | [`openclaw acp`](/de/cli/acp)           | Brückenmodus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                                                        |
| Eine lokale AI-CLI als reines Text-Fallback-Modell wiederverwenden                             | [CLI Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerelemente, keine Harness-Laufzeit                                                                                                             |

## Funktioniert das direkt nach der Installation?

In der Regel ja. Frische Installationen werden standardmäßig mit dem gebündelten
`acpx`-Laufzeit-Plugin ausgeliefert, aktiviert und mit einer plugin-lokalen,
fixierten `acpx`-Binärdatei, die OpenClaw beim Start prüft und selbst repariert.
Führe `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agents nur dann über ACP-Startmöglichkeiten, wenn ACP **tatsächlich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die aktuelle
Sitzung darf nicht durch die Sandbox blockiert sein, und ein Laufzeit-Backend muss
geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills und
ACP-Hinweise zu `sessions_spawn` ausgeblendet, damit der Agent kein nicht verfügbares
Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Fallstricke beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um eine restriktive Plugin-Inventarliste und sie **muss** `acpx` enthalten; andernfalls wird der gebündelte Standard absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Ziel-Harness-Adapter (Codex, Claude usw.) können beim ersten Verwenden bei Bedarf mit `npx` abgerufen werden.
    - Die Anbieter-Authentifizierung muss auf dem Host für dieses Harness weiterhin vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapter-Abrufe beim ersten Start fehl, bis die Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wird.

  </Accordion>
  <Accordion title="Laufzeitvoraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw verwaltet Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindungen und Richtlinien; das Harness
    verwaltet seinen Provider-Login, Modellkatalog, Dateisystemverhalten und
    nativen Tools.

    Bevor du OpenClaw verantwortlich machst, überprüfe:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host gestartet werden.
    - Die Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness — Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lasse `cwd` weg und das Backend seinen Standard verwenden.
    - Der Berechtigungsmodus passt zur Aufgabe. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe in der Regel ein ACPX-Berechtigungsprofil, das unbeaufsichtigt fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden standardmäßig **nicht**
für ACP-Harnesses bereitgestellt. Aktiviere die expliziten MCP-Brücken in
[ACP agents — setup](/de/tools/acp-agents-setup) nur dann, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem gebündelten `acpx`-Backend verwende diese Harness-IDs als Ziele für `/acp spawn <id>`
oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                              | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`  | GitHub Copilot ACP-Adapter                     | Erfordert Copilot CLI-/Laufzeit-Authentifizierung.                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreibe den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI ACP-Adapter                         | Erfordert Gemini CLI-Authentifizierung oder API-Schlüssel-Konfiguration.            |
| `iflow`    | iFlow CLI                                      | Adapter-Verfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.      |
| `kilocode` | Kilo Code CLI                                  | Adapter-Verfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.      |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi-/Moonshot-Authentifizierung auf dem Host.                            |
| `kiro`     | Kiro CLI                                       | Adapter-Verfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.      |
| `opencode` | OpenCode ACP-Adapter                           | Erfordert OpenCode CLI-/Provider-Authentifizierung.                                 |
| `openclaw` | OpenClaw-Gateway-Brücke über `openclaw acp`    | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zurückzusprechen. |
| `pi`       | Pi/eingebettete OpenClaw-Laufzeit              | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden, aber die
OpenClaw-Richtlinie prüft weiterhin `acp.allowedAgents` und jede
Zuordnung `agents.list[].runtime.acp.agent`, bevor Dispatch erfolgt.

## Runbook für Betreiber

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahre in der gebundenen Unterhaltung oder im Thread fort (oder sprich den
    Sitzungsschlüssel explizit an).
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
  <Step title="Beenden">
    `/acp cancel` (aktuelle Runde) oder `/acp close` (Sitzung + Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lebenszyklusdetails">
    - Starten erstellt oder setzt eine ACP-Laufzeitsitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf dem übergeordneten Prozess gehört.
    - Gebundene Folgemeldungen gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, defokussiert, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden nie als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht die aktive Runde ab, wenn das Backend Abbruch unterstützt; die Bindung oder Sitzungsmetadaten werden dabei nicht gelöscht.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seinen eigenen Upstream-Verlauf dennoch behalten, wenn es Wiederaufnahme unterstützt.
    - Inaktive Laufzeit-Worker kommen nach `acp.runtime.ttlMinutes` für die Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routingregeln">
    Natürlichsprachige Auslöser, die zum **nativen Codex-Plugin**
    geleitet werden sollten, wenn es aktiviert ist:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Die native Codex-Unterhaltungsbindung ist der standardmäßige Chat-Steuerungspfad.
    OpenClaw-Dynamic-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie shell/apply-patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse injiziert OpenClaw ein nativen
    Hook-Relay pro Runde, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen leiten können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay bleibt
    absichtlich konservativ: Es verändert keine Codex-nativen Tool-
    Argumente und schreibt keine Codex-Thread-Datensätze um. Verwende explizites ACP nur,
    wenn du das ACP-Laufzeit-/Sitzungsmodell möchtest. Die eingebettete Codex-
    Support-Grenze ist im
    [Codex harness v1 support contract](/de/plugins/codex-harness#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Spickzettel für Modell-/Provider-/Laufzeitauswahl">
    - `openai-codex/*` — PI Codex OAuth-/Abonnementpfad.
    - `openai/*` plus `agentRuntime.id: "codex"` — native eingebettete Codex-App-Server-Laufzeit.
    - `/codex ...` — native Codex-Unterhaltungssteuerung.
    - `/acp ...` oder `runtime: "acp"` — explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachige Auslöser für ACP-Routing">
    Auslöser, die an die ACP-Laufzeit geleitet werden sollten:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf,
    bindet an die aktuelle Unterhaltung oder den aktuellen Thread, wenn unterstützt, und
    leitet Folgeanfragen an diese Sitzung weiter, bis sie geschlossen wird oder abläuft. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für die angeforderte Operation nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur dann beworben, wenn ACP
    aktiviert ist, der Anforderer nicht in einer Sandbox läuft und ein ACP-Laufzeit-
    Backend geladen ist. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergib keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, außer dieser Eintrag ist
    explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    andernfalls verwende die standardmäßige Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwende ACP, wenn du eine externe Harness-Laufzeit möchtest. Verwende den **nativen Codex
App-Server** für Codex-Unterhaltungsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwende **Sub-Agents**, wenn du OpenClaw-native
delegierte Läufe möchtest.

| Bereich      | ACP-Sitzung                           | Sub-Agent-Lauf                      |
| ------------ | ------------------------------------- | ----------------------------------- |
| Laufzeit     | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit  |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`     | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool   | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Steuerungsebene.
2. Gebündeltes `acpx`-Laufzeit-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerelementen, Sitzungsfortsetzung,
Verfolgung von Hintergrundaufgaben und optionaler Unterhaltungs-/Thread-Bindung.

CLI Backends sind separate reine Text-Local-Fallback-Laufzeiten — siehe
[CLI Backends](/de/gateway/cli-backends).

Für Betreiber gilt in der Praxis:

- **Du möchtest `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerung oder persistente Harness-Arbeit?** Verwende ACP.
- **Du möchtest einfaches lokales Text-Fallback über die rohe CLI?** Verwende CLI Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** — wo Personen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/Thema** — eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Arbeitsbereich** — der Dateisystemspeicherort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), in dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Unterhaltung

`/acp spawn <harness> --bind here` heftet die aktuelle Unterhaltung an die
gestartete ACP-Sitzung — kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw verwaltet weiterhin
Transport, Authentifizierung, Sicherheit und Zustellung. Folgemeldungen in dieser
Unterhaltung werden an dieselbe Sitzung geleitet; `/new` und `/reset` setzen die
Sitzung an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, zukünftige Nachrichten hierhin leiten
/codex model gpt-5.4                                     # den gebundenen nativen Codex-Thread anpassen
/codex stop                                              # die aktive native Codex-Runde steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # dieselbe Chat-Bindung, Codex läuft in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Unterhaltung unterstützen; andernfalls gibt OpenClaw eine klare Meldung über fehlende Unterstützung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord ist `spawnAcpSessions` nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss — nicht für `--bind here`.
    - Wenn du zu einem anderen ACP-Agenten ohne `--cwd` spawnst, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**. Fehlende übernommene Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Spawn-Fehler ausgegeben.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Unterhaltungen lokal — `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Folge-Text an die gebundene ACP-Sitzung geleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, sobald die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgemeldungen in diesem Thread werden an die gebundene ACP-Sitzung geleitet.
    - ACP-Ausgabe wird zurück in denselben Thread zugestellt.
    - Defokussieren/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf wegen Maximalalter entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setze `false`, um ACP-Dispatch zu pausieren).
    - Flag für ACP-Thread-Spawn des Kanaladapters aktiviert (adapter-spezifisch):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Unterstützung für Thread-Bindung ist adapter-spezifisch. Wenn der aktive Kanal-
    Adapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare
    Meldung über fehlende Unterstützung/Nichtverfügbarkeit zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forum-Themen in Gruppen/Supergroups und DM-Themen).
    - Plugin-Kanäle können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Für nicht flüchtige Workflows konfiguriere persistente ACP-Bindungen in
`bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Kennzeichnet eine persistente ACP-Unterhaltungsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Ziel-Unterhaltung. Kanalabhängige Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-Forum-Thema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/Gruppe:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzuge `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
- **iMessage DM/Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzuge `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die besitzende OpenClaw-Agent-ID.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales bedienerseitiges Label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Laufzeitstandards pro Agent

Verwende `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Reihenfolge der Überschreibungspriorität für ACP-gebundene Sitzungen:**

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
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung geleitet.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Laufzeitbindungen (zum Beispiel erstellt durch Thread-Fokus-Flows) gelten weiterhin, sofern vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende übernommene Arbeitsbereichspfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler ausgegeben.

## ACP-Sitzungen starten

Es gibt zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Von sessions_spawn">
    Verwende `runtime: "acp"`, um eine ACP-Sitzung aus einer Agent-Runde oder
    einem Tool-Aufruf zu starten.

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
    `runtime` ist standardmäßig `subagent`, daher setze `runtime: "acp"` explizit
    für ACP-Sitzungen. Wenn `agentId` ausgelassen wird, verwendet OpenClaw
    `acp.defaultAgent`, sofern konfiguriert. `mode: "session"` erfordert
    `thread: true`, um eine persistente gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="Vom /acp-Befehl">
    Verwende `/acp spawn` für explizite Betreibersteuerung aus dem Chat.

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

    Siehe [Slash commands](/de/tools/slash-commands).

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
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert, wo unterstützt, einen Thread-Bindungsablauf an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist ein One-Shot; `"session"` ist persistent. Wenn `thread: true` und
  `mode` ausgelassen wird, kann OpenClaw je nach
  Laufzeitpfad standardmäßig persistentes Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Laufzeit-Arbeitsverzeichnis (validiert durch Backend-/Laufzeit-
  Richtlinie). Wenn ausgelassen, übernimmt ACP-Spawn den Arbeitsbereich
  des Ziel-Agenten, sofern konfiguriert; fehlende übernommene Pfade fallen auf Backend-
  Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Bedienerseitiges Label, das in Sitzungs-/Banner-Text verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine bestehende ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs zurück an die
  anfordernde Sitzung als Systemereignisse. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll
  (`<sessionId>.acp-stream.jsonl`) verweist, das du für den vollständigen Relay-Verlauf mitlesen kannst.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht die ACP-Child-Runde nach N Sekunden ab. `0` belässt die Runde auf dem
  No-Timeout-Pfad des Gateways. Derselbe Wert wird auf den Gateway-
  Lauf und die ACP-Laufzeit angewendet, damit festhängende/Quota-
  erschöpfte Harnesses nicht unbegrenzt den Parent-Agent-Lane
  belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizite Modell-Überschreibung für die ACP-Child-Sitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Referenzen wie `openai-codex/gpt-5.4` zu Codex-
  ACP-Startkonfiguration vor `session/new`; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen ebenfalls den Codex-ACP-Denkaufwand.
  Andere Harnesses müssen ACP-`models` bewerben und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl, statt
  stillschweigend auf den Standard des Ziel-Agenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  geringen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt zugeordnet, und `off`
  lässt die Startüberschreibung für den Reasoning-Aufwand weg.
</ParamField>

## Bindungs- und Thread-Modi beim Spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Unterhaltung an Ort und Stelle; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung an die aktuelle Unterhaltung.                   |

    Hinweise:

    - `--bind here` ist der einfachste Betreiberpfad für „diesen Kanal oder Chat Codex-gestützt machen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Bindung an die aktuelle Unterhaltung unterstützen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen untergeordneten Thread, wenn unterstützt. |
    | `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn keiner aktiv ist.                        |
    | `off`  | Keine Bindung. Die Sitzung wird ungebunden gestartet.                                               |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten faktisch `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Verwende `--bind here`, wenn du die aktuelle Unterhaltung fixieren möchtest, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder Parent-eigene
Hintergrundarbeit sein. Der Zustellungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-
    Oberfläche weiterzusprechen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Persistente konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung.

    Folgemeldungen in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgabe wird zurück in denselben
    Kanal/Thread/dasselbe Thema zugestellt.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgeanfragen werden als Prompt-Text gesendet, plus Anhänge nur dann, wenn das Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor ACP-Dispatch abgefangen.
    - Laufzeitgenerierte Abschlussereignisse werden je nach Ziel materialisiert. OpenClaw-Agents erhalten das interne Laufzeitkontext-Envelop von OpenClaw; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Child-Ergebnis und einer Anweisung. Das rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Envelop darf niemals an externe Harnesses gesendet oder als ACP-Benutzer-Transkripttext gespeichert werden.
    - ACP-Transkripteinträge verwenden den für Benutzer sichtbaren Auslösertext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben nach Möglichkeit in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-eigene One-Shot-ACP-Sitzungen">
    One-Shot-ACP-Sitzungen, die von einem anderen Agent-Lauf gestartet werden, sind Hintergrund-
    Children, ähnlich wie Sub-Agents:

    - Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
    - Child-Runden laufen auf derselben Hintergrund-Lane wie native Sub-Agent-Spawns, damit ein langsames ACP-Harness nicht die Arbeit nicht verwandter Hauptsitzungen blockiert.
    - Der Abschluss wird über den Ankündigungspfad für Task-Abschlüsse zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an ein externes Harness gesendet werden, damit Harnesses keine nur für OpenClaw bestimmten Laufzeitkontext-Marker sehen.
    - Der Parent formuliert das Child-Ergebnis in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

    Behandle diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen Parent
    und Child. Das Child hat bereits einen Abschlusskanal zurück zum
    Parent.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Spawn auf eine andere Sitzung zielen. Für normale
    Peer-Sitzungen verwendet OpenClaw einen Agent-to-Agent-(A2A)-Folgepfad,
    nachdem die Nachricht injiziert wurde:

    - Auf die Antwort der Zielsitzung warten.
    - Optional Anforderer und Ziel eine begrenzte Anzahl weiterer Folge-Runden austauschen lassen.
    - Das Ziel anweisen, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Absender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung
    ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel bei breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur dann, wenn der Anforderer der
    Parent seines eigenen Parent-eigenen One-Shot-ACP-Childs ist. In diesem Fall
    kann A2A zusätzlich zum Task-Abschluss den Parent mit dem
    Child-Ergebnis wecken, die Antwort des Parent zurück in das Child weiterleiten und
    eine Echo-Schleife zwischen Parent und Child erzeugen. Das Ergebnis von `sessions_send` meldet
    `delivery.status="skipped"` für diesen Own-Child-Fall, weil der
    Abschlusspfad bereits für das Ergebnis zuständig ist.

  </Accordion>
  <Accordion title="Eine bestehende Sitzung fortsetzen">
    Verwende `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ab und macht somit mit vollem Kontext dessen weiter, was vorher geschah.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Eine Codex-Sitzung vom Laptop auf das Handy übergeben — weise deinen Agent an, dort weiterzumachen, wo du aufgehört hast.
    - Eine Coding-Sitzung fortsetzen, die du interaktiv in der CLI begonnen hast, jetzt unbeaufsichtigt über deinen Agent.
    - Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Sub-Agent-Laufzeit verwendet wird.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die du erstellst, daher erfordert `mode: "session"` weiterhin `thread: true`.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach dem Deployment">
    Führe nach einem Gateway-Deployment eine echte End-to-End-Live-Prüfung aus,
    statt Unit-Tests zu vertrauen:

    1. Verifiziere die bereitgestellte Gateway-Version und den Commit auf dem Ziel-Host.
    2. Öffne eine temporäre ACPX-Brücken-Sitzung zu einem Live-Agent.
    3. Weise diesen Agent an, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Verifiziere `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
    5. Räume die temporäre Brücken-Sitzung auf.

    Behalte das Gate auf `mode: "run"` und überspringe `streamTo: "parent"` —
    thread-gebundene `mode: "session"`- und Stream-Relay-Pfade sind separate,
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann entsprechend seinen eigenen CLI-Berechtigungen und dem gewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw **umschließt** die Ausführung von ACP-Harnesses **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agents, Sitzungsbesitz, Kanalbindungen und die Zustellungsrichtlinie des Gateways.
- Verwende `runtime: "subagent"` für Sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren optional ein Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung/dieser Thread an eine ACP-Sitzung gebunden ist).
3. Fallback auf die aktuelle anfordernde Sitzung.

Bindungen an die aktuelle Unterhaltung und Thread-Bindungen wirken beide in
Schritt 2 mit.

Wenn sich kein Ziel auflösen lässt, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerelemente

| Befehl               | Funktion                                                   | Beispiel                                                      |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Erstellt eine ACP-Sitzung; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Bricht die laufende Runde für die Zielsitzung ab.          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Sendet eine Steueranweisung an die laufende Sitzung.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Schließt die Sitzung und löst Bindungen an Thread-Ziele.   | `/acp close`                                                  |
| `/acp status`        | Zeigt Backend, Modus, Status, Laufzeitoptionen und Fähigkeiten an. | `/acp status`                                                 |
| `/acp set-mode`      | Setzt den Laufzeitmodus für die Zielsitzung.               | `/acp set-mode plan`                                          |
| `/acp set`           | Schreibt eine generische Laufzeit-Konfigurationsoption.    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Setzt die Überschreibung des Laufzeit-Arbeitsverzeichnisses. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Setzt das Richtlinienprofil für Genehmigungen.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Setzt das Laufzeit-Timeout (Sekunden).                     | `/acp timeout 120`                                            |
| `/acp model`         | Setzt die Modell-Überschreibung der Laufzeit.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Entfernt Überschreibungen der Sitzungs-Laufzeitoptionen.   | `/acp reset-options`                                          |
| `/acp sessions`      | Listet die letzten ACP-Sitzungen aus dem Speicher auf.     | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Gesundheit, Fähigkeiten, umsetzbare Korrekturen.   | `/acp doctor`                                                 |
| `/acp install`       | Gibt deterministische Installations- und Aktivierungsschritte aus. | `/acp install`                                                |

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen auf Laufzeit- und
Backend-Ebene. Fehler wegen nicht unterstützter Steuerelemente werden klar angezeigt,
wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Speicher für die aktuell gebundene oder anfordernde Sitzung; Ziel-Token
(`session-key`, `session-id` oder `session-label`) werden über
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-
Wurzeln pro Agent.

### Zuordnung der Laufzeitoptionen

`/acp` hat Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                      | Entspricht                           | Hinweise                                                                                                                                                                        |
| --------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`           | Laufzeit-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>` | Laufzeit-Konfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw den entsprechenden `reasoning_effort`, sofern der Adapter einen solchen unterstützt.                                                          |
| `/acp permissions <profile>` | Laufzeit-Konfigurationsschlüssel `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`    | Laufzeit-Konfigurationsschlüssel `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`           | Laufzeit-`cwd`-Überschreibung        | Direkte Aktualisierung.                                                                                                                                                         |
| `/acp set <key> <value>`    | generisch                            | `key=cwd` verwendet den `cwd`-Überschreibungspfad.                                                                                                                              |
| `/acp reset-options`        | löscht alle Laufzeit-Überschreibungen | —                                                                                                                                                                              |

## acpx-Harness, Plugin-Setup und Berechtigungen

Für acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI-
Aliasse), die MCP-Brücken für Plugin-Tools und OpenClaw-Tools sowie ACP-
Berechtigungsmodi siehe
[ACP agents — setup](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                         | Behebung                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.    | Backend-Plugin installieren und aktivieren, `acpx` in `plugins.allow` aufnehmen, wenn diese Allowlist gesetzt ist, dann `/acp doctor` ausführen.                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                     | `acp.enabled=true` setzen.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                       | `acp.dispatch.enabled=true` setzen.                                                                                                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent steht nicht in der Allowlist.                                             | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                      |
| `/acp doctor` reports backend not ready right after startup                 | Plugin-Abhängigkeitsprüfung oder Selbstreparatur läuft noch.                    | Kurz warten und `/acp doctor` erneut ausführen; wenn es weiter ungesund bleibt, den Backend-Installationsfehler und die Plugin-Allow-/Deny-Richtlinie prüfen.             |
| Harness command not found                                                   | Adapter-CLI ist nicht installiert oder der `npx`-Abruf beim ersten Start ist fehlgeschlagen. | Adapter auf dem Gateway-Host installieren/vorwärmen oder den acpx-Agent-Befehl explizit konfigurieren.                                                                   |
| Model-not-found from the harness                                            | Modell-ID ist für einen anderen Provider/ein anderes Harness gültig, aber nicht für dieses ACP-Ziel. | Ein von diesem Harness gelistetes Modell verwenden, das Modell im Harness konfigurieren oder die Überschreibung weglassen.                                               |
| Vendor auth error from the harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI bzw. der Ziel-Provider ist nicht angemeldet. | Anmelden oder den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereitstellen.                                                                           |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                          | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen.                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter unterstützt keine ACP-Bindung an die aktuelle Unterhaltung.             | `/acp spawn ... --thread ...` verwenden, wo unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder in einen unterstützten Kanal wechseln.                       |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                           | Als Besitzer neu binden oder eine andere Unterhaltung bzw. einen anderen Thread verwenden.                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | Adapter unterstützt keine Thread-Bindung.                                       | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Laufzeit ist hostseitig; die anfordernde Sitzung läuft in einer Sandbox.    | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Laufzeit angefordert.                     | `runtime="subagent"` für erforderliche Sandbox-Isolation verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                          |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.          | Ein Harness verwenden, das ACP-`models`/`session/set_model` bewirbt, Codex-ACP-Modellreferenzen verwenden oder das Modell direkt im Harness konfigurieren, falls es ein eigenes Start-Flag hat. |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                      | Mit `/acp spawn` neu erstellen, dann Thread erneut binden/fokussieren.                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreiben/Ausführen in einer nicht interaktiven ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Permission configuration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Protokolle auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für kontrollierten Abbau `nonInteractivePermissions=deny` setzen. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                                  |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Internes Ereignis-Envelop ist über die ACP-Grenze hinaus geleakt.               | OpenClaw aktualisieren und den Abschlussablauf erneut ausführen; externe Harnesses sollten nur einfache Abschluss-Prompts erhalten.                                       |

## Verwandt

- [ACP agents — setup](/de/tools/acp-agents-setup)
- [Agent send](/de/tools/agent-send)
- [CLI Backends](/de/gateway/cli-backends)
- [Codex harness](/de/plugins/codex-harness)
- [Multi-agent sandbox tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Brückenmodus)](/de/cli/acp)
- [Sub-agents](/de/tools/subagents)
