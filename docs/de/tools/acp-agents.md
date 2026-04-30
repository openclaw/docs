---
read_when:
    - Programmier-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Binden einer Nachrichtenkanal-Unterhaltung an eine persistente ACP-Sitzung
    - Fehlerbehebung beim ACP-Backend, bei der Plugin-Verkabelung oder bei der Completion-Zustellung
    - Ausführen von /acp-Befehlen aus dem Chat
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-30T07:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
lassen OpenClaw externe Coding-Harnesse (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesse) über ein ACP-Backend-Plugin ausführen.

Jeder Start einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesse, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die
eingebettete Runtime `agentRuntime.id: "codex"`; ACP besitzt die
`/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client
direkt eine Verbindung zu vorhandenen OpenClaw-Kanalkonversationen herstellt,
verwenden Sie [`openclaw mcp serve`](/de/cli/mcp) anstelle von ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie dies                    | Hinweise                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Konversation binden oder steuern                                         | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stopp- und Steuerungsbefehle. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                        |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client verfügbar machen    | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                                                                                                       |
| Eine lokale AI-CLI als rein textbasiertes Fallback-Modell wiederverwenden                       | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                |

## Funktioniert das sofort?

Normalerweise ja. Neuinstallationen enthalten standardmäßig das gebündelte
`acpx`-Runtime-Plugin aktiviert, mit einer Plugin-lokalen, gepinnten
`acpx`-Binärdatei, die OpenClaw beim Start prüft und selbst repariert.
Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Starts, wenn ACP **wirklich
verwendbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert
sein, die aktuelle Sitzung darf nicht durch die Sandbox blockiert sein, und
ein Runtime-Backend muss geladen sein. Wenn diese Bedingungen nicht erfüllt
sind, bleiben ACP-Plugin-Skills und die ACP-Anleitung zu `sessions_spawn`
ausgeblendet, damit der Agent kein nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Stolperfallen beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein restriktives Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird der gebündelte Standard absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der gebündelte Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Andere Ziel-Harness-Adapter können beim ersten Verwenden weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Vendor-Auth muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindungen und Richtlinien; das Harness
    besitzt seine Provider-Anmeldung, den Modellkatalog, das Dateisystemverhalten
    und native Tools.

    Bevor Sie OpenClaw verantwortlich machen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host gestartet werden.
    - Provider-Auth ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness — Modell-IDs sind nicht zwischen Harnessen übertragbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und lassen Sie das Backend seinen Standard verwenden.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe normalerweise ein ACPX-Berechtigungsprofil, das ohne Interaktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnessen
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges
in [ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup) nur dann, wenn das
Harness diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem gebündelten `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für
`/acp spawn <id>` oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                              | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-Adapter                        | Erfordert Claude Code-Auth auf dem Host.                                            |
| `codex`    | Codex ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wurde. |
| `copilot`  | GitHub Copilot ACP-Adapter                     | Erfordert Copilot-CLI/Runtime-Auth.                                                 |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory/Droid-Auth oder `FACTORY_API_KEY` in der Harness-Umgebung.        |
| `gemini`   | Gemini CLI ACP-Adapter                         | Erfordert Gemini CLI-Auth oder API-Key-Einrichtung.                                 |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi/Moonshot-Auth auf dem Host.                                          |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode ACP-Adapter                           | Erfordert OpenCode-CLI/Provider-Auth.                                               |
| `openclaw` | OpenClaw-Gateway-Bridge über `openclaw acp`    | Lässt ein ACP-fähiges Harness mit einer OpenClaw-Gateway-Sitzung zurücksprechen.    |
| `pi`       | Pi/eingebettete OpenClaw-Runtime               | Wird für OpenClaw-native Harness-Experimente verwendet.                             |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Auth auf dem Host.                                        |

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden,
aber die OpenClaw-Richtlinie prüft weiterhin `acp.allowedAgents` und jede
`agents.list[].runtime.acp.agent`-Zuordnung vor dem Dispatch.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Konversation oder im gebundenen Thread fort
    (oder zielen Sie explizit auf den Sitzungsschlüssel).
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
    Ohne Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (aktueller Durchlauf) oder `/acp close` (Sitzung + Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle-Details">
    - Ein Start erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf vom übergeordneten Objekt besessen wird.
    - Vom übergeordneten Objekt besessene ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Notifier der übergeordneten Aufgabe, statt sich wie eine normale benutzerseitige Chat-Sitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste, vom übergeordneten Objekt besessene einmalige ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Konversationsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz entfernt wurde.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Durchlauf ab, wenn das Backend Abbruch unterstützt; es löscht weder die Bindung noch Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann weiterhin seine eigene Upstream-Historie behalten, wenn es Fortsetzen unterstützt.
    - Inaktive Runtime-Worker kommen nach `acp.runtime.ttlMinutes` für die Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routing-Regeln">
    Auslöser in natürlicher Sprache, die zum **nativen Codex-Plugin** geroutet
    werden sollten, wenn es aktiviert ist:

    - "Binden Sie diesen Discord-Kanal an Codex."
    - "Hängen Sie diesen Chat an den Codex-Thread `<id>` an."
    - "Zeigen Sie Codex-Threads an und binden Sie dann diesen hier."

    Die native Codex-Konversationsbindung ist der standardmäßige Pfad für
    Chat-Steuerung. Dynamische OpenClaw-Tools werden weiterhin über OpenClaw
    ausgeführt, während Codex-native Tools wie shell/apply-patch innerhalb von
    Codex ausgeführt werden. Für Codex-native Tool-Ereignisse injiziert OpenClaw
    pro Durchlauf ein natives Hook-Relay, damit Plugin-Hooks `before_tool_call`
    blockieren, `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen routen können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das
    Relay bleibt bewusst konservativ: Es verändert keine Codex-nativen Tool-Argumente
    und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur
    dann, wenn Sie das ACP-Runtime/Sitzungsmodell möchten. Die Grenze der
    eingebetteten Codex-Unterstützung ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract)
    dokumentiert.

  </Accordion>
  <Accordion title="Spickzettel zur Auswahl von Modell / Provider / Runtime">
    - `openai-codex/*` — PI Codex OAuth-/Abonnement-Route.
    - `openai/*` plus `agentRuntime.id: "codex"` — native, im Codex-App-Server eingebettete Runtime.
    - `/codex ...` — native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` — explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="ACP-Routing-Auslöser in natürlicher Sprache">
    Auslöser, die an die ACP-Runtime weiterleiten sollten:

    - „Führen Sie dies als einmalige Claude Code ACP-Sitzung aus und fassen Sie das Ergebnis zusammen.“
    - „Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und behalten Sie anschließende Nachfragen im selben Thread.“
    - „Führen Sie Codex über ACP in einem Hintergrund-Thread aus.“

    OpenClaw wählt `runtime: "acp"`, löst das Harness-`agentId` auf,
    bindet sich, sofern unterstützt, an die aktuelle Konversation oder den aktuellen Thread und
    leitet Folgeanfragen bis zum Schließen oder Ablauf an diese Sitzung weiter. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für den angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anforderer nicht in einer Sandbox läuft und ein ACP-Runtime-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert die automatische
    ACP-Thread-Weiterleitung, blendet explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe aber weder aus noch blockiert es sie. Ziel sind ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser Eintrag ist
    explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    verwenden Sie andernfalls die Standard-Runtime für Sub-Agents. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie den **nativen Codex-
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native
delegierte Läufe möchten.

| Bereich       | ACP-Sitzung                          | Sub-Agent-Lauf                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP besteht der Stack aus:

1. OpenClaw-ACP-Sitzungssteuerungsebene.
2. Gebündeltes `acpx`-Runtime-Plugin.
3. Claude-ACP-Adapter.
4. Runtime-/Sitzungsmechanik auf Claude-Seite.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerung, Sitzungsfortsetzung,
Hintergrundaufgabenverfolgung und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate rein textbasierte lokale Fallback-Runtimes — siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Runtime-Steuerungen oder dauerhafte Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einen einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** — wo Menschen weiter sprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/Thema** — eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** — der Dateisystemort (`cwd`, Repository-Checkout, Backend-Arbeitsbereich), an dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
gestartete ACP-Sitzung — kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung unter Kontrolle. Folgenachrichten in dieser
Konversation werden an dieselbe Sitzung weitergeleitet; `/new` und `/reset` setzen die
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
    - Auf Discord ist `spawnAcpSessions` nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss — nicht für `--bind here`.
    - Wenn Sie ohne `--cwd` einen anderen ACP-Agent starten, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal — `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Folgetext an die gebundene ACP-Sitzung weitergeleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
    - ACP-Ausgabe wird an denselben Thread zurückgeliefert.
    - Unfocus/Schließen/Archivieren/Idle-Timeout oder Max-Age-Ablauf entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - ACP-Thread-Spawn-Flag des Kanaladapters aktiviert (adapterspezifisch):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Thread-Bindungsunterstützung ist adapterspezifisch. Wenn der aktive Kanal-
    adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Dauerhafte Kanalbindungen

Konfigurieren Sie für nicht flüchtige Workflows dauerhafte ACP-Bindungen in
`bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine dauerhafte ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Formen pro Kanal:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-Forumthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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
  Optionales, für Betreiber sichtbares Label.
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

**Überschreibungsreihenfolge für ACP-gebundene Sitzungen:**

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
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Runtime-Bindungen (zum Beispiel durch Thread-Fokus-Flows erstellt) gelten weiterhin, wo vorhanden.
- Für agentübergreifende ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agent-Konfiguration.
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
    `runtime` ist standardmäßig `subagent`; setzen Sie daher `runtime: "acp"` explizit
    für ACP-Sitzungen. Wenn `agentId` weggelassen wird, verwendet OpenClaw
    `acp.defaultAgent`, sofern konfiguriert. `mode: "session"` erfordert
    `thread: true`, um eine dauerhaft gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="Über /acp-Befehl">
    Verwenden Sie `/acp spawn` für explizite Bedienerkontrolle aus dem Chat.

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
  Anfänglicher Prompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, sofern gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Thread-Bindungsablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist dauerhaft. Wenn `thread: true` gesetzt ist und
  `mode` weggelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig dauerhaftes Verhalten verwenden.
  `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Laufzeit-Arbeitsverzeichnis (durch Backend-/Laufzeitrichtlinie
  validiert). Wenn weggelassen, übernimmt ACP Spawn den Workspace des Ziel-Agenten,
  sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-Standards zurück,
  während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Bedienerbezogene Beschriftung, die im Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt anfängliche ACP-Ausführungsfortschritts-Zusammenfassungen als Systemereignisse
  zurück an die anfordernde Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll
  (`<sessionId>.acp-stream.jsonl`) verweist, dem Sie für den vollständigen Relay-Verlauf folgen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den untergeordneten ACP-Turn nach N Sekunden ab. `0` hält den Turn auf dem
  no-timeout-Pfad des Gateways. Derselbe Wert wird auf die Gateway-Ausführung
  und die ACP-Laufzeit angewendet, damit blockierte oder durch Quoten erschöpfte Harnesses
  die Lane des übergeordneten Agenten nicht unbegrenzt belegen.
</ParamField>
<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die untergeordnete ACP-Sitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Referenzen wie `openai-codex/gpt-5.4` in die Codex-
  ACP-Startkonfiguration vor `session/new`; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Andere Harnesses müssen ACP-`models` bekannt geben und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl, statt
  stillschweigend auf den Standard des Ziel-Agenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Thinking-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet, und `off`
  lässt die Reasoning-Aufwand-Startüberschreibung weg.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuelle aktive Unterhaltung an Ort und Stelle; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                  |

    Hinweise:

    - `--bind here` ist der einfachste Bedienerpfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für die Bindung der aktuellen Unterhaltung bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                         |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen untergeordneten Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuell aktiven Thread; schlägt fehl, wenn keiner vorhanden ist.                    |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                    |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder im Besitz des übergeordneten Agenten
befindliche Hintergrundarbeit sein. Der Zustellungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche
    weiter zu kommunizieren:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgaben werden an denselben
    Kanal/Thread/dasselbe Thema zurückgeliefert.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur, wenn das Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Von der Laufzeit erzeugte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten OpenClaws interne Laufzeitkontext-Hülle; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem untergeordneten Ergebnis und der Anweisung. Die rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Hülle sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den für den Benutzer sichtbaren Auslösetext oder den einfachen Abschlussprompt. Interne Ereignismetadaten bleiben, wo möglich, strukturiert in OpenClaw und werden nicht als vom Benutzer verfasster Chatinhalt behandelt.

  </Accordion>
  <Accordion title="Übergeordnete einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einer anderen Agentenausführung gestartet werden, sind Hintergrund-
    Kinder, ähnlich wie Sub-Agenten:

    - Der übergeordnete Agent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Kind läuft in seiner eigenen ACP-Harness-Sitzung.
    - Kind-Turns laufen auf derselben Hintergrund-Lane, die von nativen Sub-Agent-Spawns verwendet wird, sodass ein langsames ACP-Harness nicht die Arbeit nicht verwandter Hauptsitzungen blockiert.
    - Abschlussmeldungen laufen über den Pfad für Task-Completion-Ankündigungen zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an ein externes Harness gesendet werden, sodass Harnesses keine ausschließlich OpenClaw-internen Laufzeitkontextmarker sehen.
    - Der übergeordnete Agent formuliert das Kindergebnis in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem Agenten
    und Kind. Das Kind hat bereits einen Abschlusskanal zurück zum
    übergeordneten Agenten.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Spawn eine andere Sitzung ansprechen. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Injizieren der Nachricht einen Agent-zu-Agent-(A2A)-Folgepfad:

    - Warten Sie auf die Antwort der Zielsitzung.
    - Lassen Sie Anforderer und Ziel optional eine begrenzte Anzahl von Folge-Turns austauschen.
    - Bitten Sie das Ziel, eine Ankündigungsnachricht zu erzeugen.
    - Stellen Sie diese Ankündigung an den sichtbaren Kanal oder Thread zu.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung
    ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur, wenn der Anforderer der
    übergeordnete Agent seines eigenen übergeordneten, einmaligen ACP-Kinds ist. In diesem Fall
    kann A2A zusätzlich zur Task-Completion den übergeordneten Agenten mit dem
    Kindergebnis wecken, die Antwort des übergeordneten Agenten zurück in das Kind weiterleiten und
    eine Eltern/Kind-Echoschleife erzeugen. Das `sessions_send`-Ergebnis meldet
    `delivery.status="skipped"` für diesen Owned-Child-Fall, weil der
    Abschlusspfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorherigen weitermacht.

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
    - Setzen Sie eine Coding-Sitzung fort, die Sie interaktiv in der CLI gestartet haben, nun headless über Ihren Agenten.
    - Nehmen Sie Arbeit wieder auf, die durch einen Gateway-Neustart oder Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"` gesetzt ist; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"` gesetzt ist; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `resumeSessionId` ist eine hostlokale ACP-/Harness-Fortsetzungs-ID, kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft vor der Weiterleitung weiterhin ACP-Spawn-Richtlinie und Ziel-Agentenrichtlinie, während das ACP-Backend oder Harness die Autorisierung zum Laden dieser Upstream-ID besitzt.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach der Bereitstellung">
    Führen Sie nach einer Gateway-Bereitstellung eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Überprüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Überprüfen Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validatorfehler.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Halten Sie das Gate auf `mode: "run"` und überspringen Sie `streamTo: "parent"` —
    Thread-gebundene `mode: "session"`- und Stream-Relay-Pfade sind separate
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Der externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die ACP-Harness-Ausführung **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agenten, Sitzungseigentum, Kanalbindungen und die Gateway-Zustellrichtlinie.
- Verwenden Sie `runtime: "subagent"` für Sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, sind ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
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

## ACP-Steuerung

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Runtime-Optionen, Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Runtime-Konfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Runtime-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout (Sekunden) festlegen.                     | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-Modellüberschreibung festlegen.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Runtime-Optionsüberschreibungen der Sitzung entfernen.    | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Store auflisten.           | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen.     | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Runtime-Optionen sowie Sitzungskennungen auf Runtime- und
Backend-Ebene. Fehler für nicht unterstützte Steuerungen werden
klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Store für die aktuell gebundene oder anfordernde Sitzung; Ziel-Token
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

### Zuordnung der Runtime-Optionen

`/acp` hat Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                       | Wird zugeordnet zu                   | Hinweise                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | Runtime-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu. |
| `/acp set thinking <level>`  | Runtime-Konfigurationsschlüssel `thinking` | Für Codex ACP sendet OpenClaw das entsprechende `reasoning_effort`, sofern der Adapter eines unterstützt.                                                                      |
| `/acp permissions <profile>` | Runtime-Konfigurationsschlüssel `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | Runtime-Konfigurationsschlüssel `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | Runtime-cwd-Überschreibung           | Direkte Aktualisierung.                                                                                                                                                        |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den cwd-Überschreibungspfad.                                                                                                                               |
| `/acp reset-options`         | löscht alle Runtime-Überschreibungen | —                                                                                                                                                                              |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI
Aliasse), zu den MCP-Bridges plugin-tools und OpenClaw-tools sowie zu ACP
Berechtigungsmodi finden Sie unter
[ACP-Agenten — Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                | Behebung                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.                                            | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                            | Setzen Sie `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische Dispatches aus normalen Thread-Nachrichten sind deaktiviert.                                              | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin. |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                      | Verwenden Sie eine zulässige `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Die Plugin-Abhängigkeitsprüfung oder Selbstreparatur läuft noch.                                                       | Warten Sie kurz und führen Sie `/acp doctor` erneut aus; wenn der Zustand fehlerhaft bleibt, prüfen Sie den Installationsfehler des Backends und die Plugin-Zulassungs-/Sperrrichtlinie. |
| Harness command not found                                                   | Die Adapter-CLI ist nicht installiert, bereitgestellte Plugin-Abhängigkeiten fehlen oder der erste `npx`-Abruf für einen Nicht-Codex-Adapter ist fehlgeschlagen. | Führen Sie `/acp doctor` aus, reparieren Sie Plugin-Abhängigkeiten, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit. |
| Model-not-found from the harness                                            | Die Modell-ID ist für einen anderen Provider/ein anderes Harness gültig, aber nicht für dieses ACP-Ziel.               | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                  |
| Vendor auth error from the harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereit.                                                           |
| `Unable to resolve session target: ...`                                     | Ungültiger Schlüssel, ungültige ID oder ungültiges Label-Token.                                                        | Führen Sie `/acp sessions` aus, kopieren Sie den genauen Schlüssel/das genaue Label und versuchen Sie es erneut.                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                                                       | Wechseln Sie in den Ziel-Chat/-Kanal und versuchen Sie es erneut oder verwenden Sie einen ungebundenen Spawn.                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Dem Adapter fehlt die ACP-Bindungsfähigkeit für die aktuelle Konversation.                                             | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                       | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                  | Binden Sie als Besitzer erneut oder verwenden Sie eine andere Konversation oder einen anderen Thread.                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | Dem Adapter fehlt die Thread-Bindungsfähigkeit.                                                                        | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Die ACP-Runtime ist hostseitig; die anfragende Session läuft in einer Sandbox.                                         | Verwenden Sie `runtime="subagent"` aus Sandbox-Sessions oder führen Sie den ACP-Spawn aus einer nicht sandboxed Session aus.                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                                             | Verwenden Sie `runtime="subagent"` für erforderliches Sandboxing oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Session.                                     |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness bietet keine generische ACP-Modellumschaltung an.                                                     | Verwenden Sie ein Harness, das ACP-`models`/`session/set_model` anbietet, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls es ein eigenes Start-Flag hat. |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Session-Metadaten.                                                                            | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Session.                       | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                             | Prüfen Sie die Gateway-Protokolle auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für geordnete Einschränkung setzen Sie `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Der Harness-Prozess wurde beendet, aber die ACP-Session hat keinen Abschluss gemeldet.                                 | Überwachen Sie mit `ps aux \| grep acpx`; beenden Sie veraltete Prozesse manuell.                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Der interne Ereignisumschlag ist über die ACP-Grenze gelangt.                                                         | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur einfache Abschluss-Prompts erhalten.                             |

## Verwandt

- [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agents](/de/tools/subagents)
