---
read_when:
    - Programmier-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen in Messaging-Kanälen einrichten
    - Binden einer Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung
    - Fehlerbehebung beim ACP-Backend, bei der Plugin-Verdrahtung oder bei der Zustellung von Vervollständigungen
    - Ausführen von /acp-Befehlen aus dem Chat heraus
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-05-10T19:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder Spawn einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der Standardpfad für Codex.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die
standardmäßige eingebettete `openai/gpt-*`-Runtime für Agent-Turns; ACP besitzt
die `/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code sich als externer MCP-Client
direkt mit bestehenden OpenClaw-Kanalunterhaltungen verbindet, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie                         | Hinweise                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                         | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stopp- und Steuerbefehle. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                         |
| Eine OpenClaw Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen       | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw                                                                                                                         |
| Eine lokale AI-CLI als textbasiertes Fallback-Modell wiederverwenden                            | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                   |

## Funktioniert das sofort?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Spawning, wenn ACP **wirklich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein,
die aktuelle Sitzung darf nicht durch die Sandbox blockiert sein, und ein
Runtime-Backend muss geladen sein. Wenn diese Bedingungen nicht erfüllt sind,
bleiben ACP-Plugin-Skills und `sessions_spawn`-ACP-Anleitungen verborgen, damit
der Agent kein nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Stolpersteine beim ersten Start">
    - Wenn `plugins.allow` gesetzt ist, ist dies ein restriktives Plugin-Inventar und **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Codex ACP läuft mit einem isolierten `CODEX_HOME`; OpenClaw kopiert nur vertrauenswürdige Projekteinträge aus der Codex-Konfiguration des Hosts und vertraut dem aktiven Workspace, während Authentifizierung, Benachrichtigungen und Hooks in der Host-Konfiguration verbleiben.
    - Andere Ziel-Harness-Adapter können beim ersten Verwenden weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Vendor-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugang hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Zustellung, Bindings und Policy; das Harness
    besitzt seine Provider-Anmeldung, den Modellkatalog, Dateisystemverhalten und
    native Tools.

    Bevor Sie OpenClaw verantwortlich machen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness - Modell-IDs sind nicht zwischen Harnesses portierbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und verwenden Sie den Standardwert des Backends.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe in der Regel ein ACPX-Berechtigungsprofil, das headless fortfahren kann.

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
| `claude`   | Claude Code-ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex-ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`  | GitHub Copilot-ACP-Adapter                     | Erfordert Copilot-CLI/Runtime-Authentifizierung.                                    |
| `cursor`   | Cursor CLI-ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
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

Benutzerdefinierte acpx-Agent-Aliasse können in acpx selbst konfiguriert werden,
aber die OpenClaw-Policy prüft vor dem Dispatch weiterhin `acp.allowedAgents` und
jede `agents.list[].runtime.acp.agent`-Zuordnung.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Spawnen">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im Thread fort (oder adressieren
    Sie den Sitzungsschlüssel explizit).
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
    `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindings).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lebenszyklusdetails">
    - Spawn erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf dem Parent gehört.
    - Parent-eigene ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Parent-Aufgaben-Notifier, statt sich wie eine normale benutzerseitige Chat-Sitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste Parent-eigene One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange ein aktives Unterhaltungs-Binding besteht; veraltete persistente Sitzungen ohne aktives Binding werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz nicht mehr existiert.
    - Gebundene Follow-up-Nachrichten gehen direkt an die ACP-Sitzung, bis das Binding geschlossen, unfokussiert, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden nie als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder Binding noch Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt das Binding. Ein Harness kann weiterhin seine eigene Upstream-Historie behalten, wenn es Fortsetzen unterstützt.
    - Das acpx-Plugin bereinigt von OpenClaw besessene Wrapper- und Adapter-Prozessbäume nach `close` und räumt veraltete von OpenClaw besessene ACPX-Waisen beim Gateway-Start auf.
    - Inaktive Runtime-Worker können nach `acp.runtime.ttlMinutes` bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routing-Regeln">
    Trigger in natürlicher Sprache, die zum **nativen Codex-Plugin**
    geroutet werden sollten, wenn es aktiviert ist:

    - „Binden Sie diesen Discord-Kanal an Codex.“
    - „Hängen Sie diesen Chat an Codex-Thread `<id>` an.“
    - „Zeigen Sie Codex-Threads an und binden Sie dann diesen.“

    Native Codex-Konversationsbindung ist der standardmäßige Pfad für Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse injiziert OpenClaw pro Turn ein natives
    Hook-Relay, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    durch OpenClaw-Genehmigungen leiten können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay bleibt
    bewusst konservativ: Es mutiert keine Codex-nativen Tool-Argumente
    und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur,
    wenn Sie das ACP-Laufzeit-/Sitzungsmodell möchten. Die eingebettete Codex-
    Support-Grenze ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Spickzettel zur Modell-/Provider-/Laufzeitauswahl">
    - `openai-codex/*` - Legacy-Codex-OAuth-/Abonnement-Modellroute, die durch doctor repariert wird.
    - `openai/*` - native eingebettete Codex-App-Server-Laufzeit für OpenAI-Agent-Turns.
    - `/codex ...` - native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` - explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natural-Language-Trigger für ACP-Routing">
    Trigger, die zur ACP-Laufzeit routen sollten:

    - "Führen Sie dies als einmalige Claude Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und behalten Sie anschließende Nachfragen in demselben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf,
    bindet, sofern unterstützt, an die aktuelle Konversation oder den aktuellen Thread und
    routet Nachfragen bis zum Schließen/Ablauf an diese Sitzung. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für die angeforderte Operation nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anfragende nicht sandboxed ist und ein ACP-Laufzeit-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert den automatischen
    ACP-Thread-Versand, blendet explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe aber nicht aus und blockiert sie nicht. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser Eintrag ist
    explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    andernfalls verwenden Sie die standardmäßige Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie den **nativen Codex-
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native
delegierte Läufe möchten.

| Bereich       | ACP-Sitzung                          | Sub-Agent-Lauf                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Control-Plane.
2. Offizielles `@openclaw/acpx`-Laufzeit-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungswiederaufnahme,
Hintergrundaufgabenverfolgung und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate textbasierte lokale Fallback-Laufzeiten - siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Operatoren lautet die praktische Regel:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** - wo Personen weiter kommunizieren (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** - der dauerhafte Codex-/Claude-/Gemini-Laufzeitstatus, an den OpenClaw routet.
- **Untergeordneter Thread/Thema** - eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Workspace** - der Dateisystemort (`cwd`, Repo-Checkout, Backend-Workspace), an dem das Harness ausgeführt wird. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` bindet die aktuelle Konversation an die
gespawnte ACP-Sitzung - kein untergeordneter Thread, gleiche Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung. Nachfolgende Nachrichten in dieser
Konversation werden an dieselbe Sitzung geroutet; `/new` und `/reset` setzen die
Sitzung an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, zukünftige Nachrichten hierher routen
/codex model gpt-5.4                                     # gebundenen nativen Codex-Thread feinabstimmen
/codex stop                                              # aktiven nativen Codex-Turn steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann untergeordneten Thread/Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # gleiche Chat-Bindung, Codex läuft in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Konversation ankündigen; OpenClaw gibt andernfalls eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` - nicht `--bind here`.
    - Wenn Sie ohne `--cwd` zu einem anderen ACP-Agent spawnen, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agents**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Spawn-Fehler angezeigt.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal - `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Nachfolgetext an die gebundene ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Nachfolgende Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
    - ACP-Ausgabe wird an denselben Thread zurückgeliefert.
    - Unfocus/close/archive/idle-timeout oder Ablauf des Maximalalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (auf `false` setzen, um automatischen ACP-Thread-Versand zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Channel-Adapter-Thread-Sitzungs-Spawns aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanal-
    Adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumsthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Für nicht ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in
Top-Level-`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalbezogene Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen entsprechen auch Antworten innerhalb der Threads dieses Kanals.
- **Telegram-Forumsthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die besitzende OpenClaw-Agent-ID.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Übersteuerung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales operatorseitiges Label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Übersteuerung.
</ParamField>

### Laufzeit-Standards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Übersteuerungspriorität für ACP-gebundene Sitzungen:**

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
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindungen (zum Beispiel durch Thread-Focus-Abläufe erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentenübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Ziel-Agent-Arbeitsbereich aus der Agent-Konfiguration.
- Fehlende vererbte Arbeitsbereichspfade fallen auf das Standard-`cwd` des Backends zurück; nicht fehlende Zugriffsfehler werden als Spawn-Fehler angezeigt.

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
    für ACP-Sitzungen. Wenn `agentId` ausgelassen wird, verwendet OpenClaw
    `acp.defaultAgent`, sofern konfiguriert. `mode: "session"` erfordert
    `thread: true`, um eine persistente gebundene Konversation beizubehalten.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Verwenden Sie `/acp spawn` für explizite Operator-Kontrolle aus dem Chat.

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
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert einen Thread-Bindungsablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist ein einmaliger Lauf; `"session"` ist persistent. Wenn `thread: true` gesetzt ist und
  `mode` ausgelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig persistentes Verhalten
  verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Runtime-Arbeitsverzeichnis (validiert durch Backend-/Runtime-
  Richtlinie). Wenn ausgelassen, übernimmt der ACP-Spawn den Ziel-Agent-Arbeitsbereich,
  sofern konfiguriert; fehlende vererbte Pfade fallen auf Backend-
  Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operator-seitiges Label, das im Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nimmt eine vorhandene ACP-Sitzung wieder auf, statt eine neue zu erstellen. Der
  Agent spielt seinen Konversationsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt anfängliche ACP-Lauf-Fortschrittszusammenfassungen als Systemereignisse zurück an die
  anfragende Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, der auf ein sitzungsbezogenes JSONL-Protokoll
  (`<sessionId>.acp-stream.jsonl`) verweist, das Sie für den vollständigen Relay-Verlauf verfolgen können.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Bricht den ACP-Child-Turn nach N Sekunden ab. `0` hält den Turn auf dem
  No-Timeout-Pfad des Gateway. Derselbe Wert wird auf den Gateway-
  Lauf und die ACP-Runtime angewendet, damit blockierte oder kontingenterschöpfte Harnesses
  die Parent-Agent-Spur nicht unbegrenzt belegen.
</ParamField>
<ParamField path="model" type="string">
  Expliziter Model-Override für die ACP-Child-Sitzung. Codex-ACP-Spawns
  normalisieren OpenClaw-Codex-Referenzen wie `openai-codex/gpt-5.4` vor `session/new` in die Codex-
  ACP-Startkonfiguration; Slash-Formen wie
  `openai-codex/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Andere Harnesses müssen ACP `models` bereitstellen und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx eindeutig fehl, statt
  stillschweigend auf den Standard des Ziel-Agent zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Thinking-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet, und `off`
  lässt den Reasoning-Effort-Start-Override aus.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Konversation direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Konversation.                  |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen Child-Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für Bindungen der aktuellen Konversation bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen Child-Thread, wenn unterstützt. |
    | `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn Sie sich in keinem befinden.             |
    | `off`  | Keine Bindung. Sitzung startet ungebunden.                                                         |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen Child-Thread zu erstellen.

  </Tab>
</Tabs>

## Bereitstellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder vom übergeordneten Element verwaltete
Hintergrundarbeit sein. Der Auslieferungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interaktive Sitzungen sollen die Unterhaltung auf einer sichtbaren Chat-
    Oberfläche fortsetzen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgaben werden zurück an denselben
    Kanal/Thread/dasselbe Thema zugestellt.

    Was OpenClaw an den Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur, wenn der Harness/das Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Zur Laufzeit erzeugte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten OpenClaws interne Laufzeitkontext-Hülle; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Ergebnis des untergeordneten Elements und der Anweisung. Die rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Hülle sollte niemals an externe Harnesses gesendet oder als ACP-Benutzer-Transkripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben, wo möglich, in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Einmalige ACP-Sitzungen, die von einem anderen Agentenlauf gestartet werden, sind Hintergrund-
    untergeordnete Elemente, ähnlich wie Sub-Agenten:

    - Das übergeordnete Element fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das untergeordnete Element läuft in einer eigenen ACP-Harness-Sitzung.
    - Durchläufe des untergeordneten Elements laufen auf derselben Hintergrund-Lane wie native Sub-Agent-Starts, sodass ein langsamer ACP-Harness nicht unabhängige Arbeit der Hauptsitzung blockiert.
    - Abschlussmeldungen laufen über den Ankündigungspfad für Aufgabenabschlüsse zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor es sie an einen externen Harness sendet, sodass Harnesses keine nur für OpenClaw bestimmten Laufzeitkontextmarker sehen.
    - Das übergeordnete Element formuliert das Ergebnis des untergeordneten Elements in normaler Assistentenstimme neu, wenn eine benutzersichtbare Antwort nützlich ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem
    und untergeordnetem Element. Das untergeordnete Element hat bereits einen Abschlusskanal zurück zum
    übergeordneten Element.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kann nach dem Start eine andere Sitzung adressieren. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-(A2A)-Folgepfad:

    - Auf die Antwort der Zielsitzung warten.
    - Optional Anforderer und Ziel eine begrenzte Anzahl von Folge-Turns austauschen lassen.
    - Das Ziel bitten, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Absender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine unabhängige Sitzung ein
    ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Folge nur, wenn der Anforderer das
    übergeordnete Element seines eigenen, vom übergeordneten Element verwalteten einmaligen ACP-untergeordneten Elements ist. In diesem Fall
    kann A2A zusätzlich zum Aufgabenabschluss das übergeordnete Element mit dem
    Ergebnis des untergeordneten Elements wecken, die Antwort des übergeordneten Elements zurück an das untergeordnete Element weiterleiten und
    eine Echo-Schleife zwischen übergeordnetem und untergeordnetem Element erzeugen. Das `sessions_send`-Ergebnis meldet
    `delivery.status="skipped"` für diesen Fall eines verwalteten untergeordneten Elements, weil der
    Abschlusspfad bereits für das Ergebnis zuständig ist.

  </Accordion>
  <Accordion title="Resume an existing session">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Unterhaltungsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorherigen fortfährt.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Eine Codex-Sitzung von Ihrem Laptop auf Ihr Telefon übergeben - weisen Sie Ihren Agenten an, dort weiterzumachen, wo Sie aufgehört haben.
    - Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI gestartet haben, nun headless über Ihren Agenten.
    - Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Leerlauf-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"` gesetzt ist; die Standard-Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"` gesetzt ist; die Standard-Sub-Agent-Laufzeit ignoriert dieses nur für ACP bestimmte Feld.
    - `resumeSessionId` ist eine hostlokale ACP-/Harness-Wiederaufnahme-ID, kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft weiterhin die ACP-Start-Policy und die Zielagenten-Policy vor der Weiterleitung, während das ACP-Backend oder der Harness die Autorisierung zum Laden dieser Upstream-ID verwaltet.
    - `resumeSessionId` stellt den Upstream-ACP-Unterhaltungsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Zielagent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Start mit einem klaren Fehler fehl - kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Führen Sie nach einer Gateway-Bereitstellung eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Prüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
    3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Prüfen Sie `accepted=yes`, einen echten `childSessionKey` und dass kein Validator-Fehler vorliegt.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Belassen Sie das Gate bei `mode: "run"` und überspringen Sie `streamTo: "parent"` -
    thread-gebundenes `mode: "session"` und Stream-Relay-Pfade sind separate,
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeitumgebung, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Harness **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agenten, Sitzungsbesitz, Kanalbindungen und die Gateway-Zustellungsrichtlinie.
- Verwenden Sie `runtime: "subagent"` für durch die Sandbox erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
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
3. Fallback auf die aktuelle anfragende Sitzung.

Bindungen der aktuellen Unterhaltung und Thread-Bindungen nehmen beide an
Schritt 2 teil.

Wenn kein Ziel aufgelöst wird, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerbefehle

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an eine laufende Sitzung senden.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeitkonfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeit-Arbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für die Genehmigungsrichtlinie festlegen.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout festlegen (Sekunden).                    | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Sitzungs-Laufzeitoptionen entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Kürzliche ACP-Sitzungen aus dem Store auflisten.          | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten und umsetzbare Korrekturen.  | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen auf Laufzeit- und
Backend-Ebene. Fehler für nicht unterstützte Steuerbefehle werden klar angezeigt,
wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Store für die aktuell gebundene oder anfragende Sitzung; Ziel-Token
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

### Zuordnung der Laufzeitoptionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Äquivalente
Vorgänge:

| Befehl                       | Wird zugeordnet zu                  | Hinweise                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Laufzeitkonfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai-codex/<model>` zur Modell-ID des Adapters und ordnet Slash-Reasoning-Suffixe wie `openai-codex/gpt-5.4/high` `reasoning_effort` zu.                            |
| `/acp set thinking <level>`  | kanonische Option `thinking`         | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, bevorzugt `thinking`, dann `effort`, `reasoning_effort` oder `thought_level`. Für Codex ACP ordnet der Adapter Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, wie `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                                   |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`   | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, wie `timeout` oder `timeout_seconds`.                                                                                               |
| `/acp cwd <path>`            | Laufzeit-`cwd`-Überschreibung        | Direkte Aktualisierung.                                                                                                                                                                                    |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den Pfad der `cwd`-Überschreibung.                                                                                                                                                     |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen | -                                                                                                                                                                                                          |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI-
Aliasse), zu den MCP-Bridges plugin-tools und OpenClaw-tools sowie zu ACP-
Berechtigungsmodi finden Sie unter
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                           | Behebung                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.                                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie anschließend `/acp doctor` aus.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                                 | Setzen Sie `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatischer Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                                                               | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                                | Verwenden Sie eine erlaubte `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` meldet direkt nach dem Start, dass das Backend nicht bereit ist                 | Backend-Plugin fehlt, ist deaktiviert, durch eine Allow-/Deny-Richtlinie blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar.        | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Backend-Installations- oder Richtlinienfehler, falls es fehlerhaft bleibt.                                           |
| Harness-Befehl nicht gefunden                                                   | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erste `npx`-Abruf ist für einen Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit.                                                      |
| Modell nicht gefunden vom Harness                                            | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                                                | Verwenden Sie ein von diesem Harness aufgelistetes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                                            |
| Vendor-Authentifizierungsfehler vom Harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereit.                                                                                             |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                                                                                | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel/das exakte Label und versuchen Sie es erneut.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                                                            | Wechseln Sie zum Ziel-Chat/-Kanal und versuchen Sie es erneut, oder verwenden Sie einen ungebundenen Spawn.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Dem Adapter fehlt die ACP-Binding-Fähigkeit für die aktuelle Konversation.                                                             | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                                         | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Binding-Ziel.                                                                           | Binden Sie als Besitzer neu oder verwenden Sie eine andere Konversation oder einen anderen Thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Dem Adapter fehlt die Thread-Binding-Fähigkeit.                                                                               | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft hostseitig; die anfordernde Sitzung befindet sich in einer Sandbox.                                                              | Verwenden Sie `runtime="subagent"` aus Sandbox-Sitzungen heraus oder führen Sie den ACP-Spawn aus einer Nicht-Sandbox-Sitzung aus.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                                                         | Verwenden Sie `runtime="subagent"` für erforderliches Sandboxing oder verwenden Sie ACP mit `sandbox="inherit"` aus einer Nicht-Sandbox-Sitzung.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Der Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.                                                        | Verwenden Sie einen Harness, der ACP `models`/`session/set_model` ankündigt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls er ein eigenes Start-Flag hat. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                                    | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie anschließend den Thread erneut.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Sitzung.                                                    | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                                        | Prüfen Sie die Gateway-Logs auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für graceful degradation setzen Sie `nonInteractivePermissions=deny`.        |
| ACP-Sitzung bleibt nach abgeschlossener Arbeit unbegrenzt hängen                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                                    | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung entfernt beim Schließen und beim Gateway-Start veraltete Wrapper- und Adapter-Prozesse, die OpenClaw gehören.                                             |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interner Ereignisumschlag ist über die ACP-Grenze geleakt.                                                                | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur reine Abschluss-Prompts erhalten.                                                          |

## Verwandt

- [ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
