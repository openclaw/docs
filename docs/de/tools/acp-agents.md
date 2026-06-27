---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationgebundene ACP-Sitzungen in Messaging-Kanälen einrichten
    - Eine Message-Channel-Unterhaltung an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend, Plugin-Verkabelung oder Zustellung von Abschlüssen
    - /acp-Befehle aus dem Chat bedienen
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-06-27T18:15:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder Start einer ACP-Sitzung wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die standardmäßige
eingebettete `openai/gpt-*`-Runtime für Agent-Turns; ACP besitzt
die `/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client
direkt eine Verbindung zu bestehenden OpenClaw-Kanalunterhaltungen herstellt,
verwenden Sie [`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite benötige ich?

| Sie möchten ...                                                                                 | Verwenden Sie                         | Hinweise                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                          | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/fast/Berechtigungen, Stoppen und Steuerungen. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerungen                                                                       |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen        | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                                                       |
| Eine lokale AI-CLI als Nur-Text-Fallback-Modell wiederverwenden                                  | [CLI-Backends](/de/gateway/cli-backends) | Kein ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Runtime                                                                                                                  |

## Funktioniert das sofort?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können das lokale Workspace-Plugin `extensions/acpx` nach
`pnpm install` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Spawning, wenn ACP **wirklich
verwendbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die aktuelle
Sitzung darf nicht durch die Sandbox blockiert sein, und ein Runtime-Backend muss
geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills und
die ACP-Hinweise zu `sessions_spawn` ausgeblendet, damit der Agent kein
nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Stolperfallen beim ersten Lauf">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein restriktives Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und wenn möglich lokal gestartet.
    - Codex ACP läuft mit einem isolierten `CODEX_HOME`; OpenClaw kopiert vertrauenswürdige Projekteinträge sowie sichere Modell/Provider-Routing-Konfiguration aus der Host-Codex-Konfiguration, während Authentifizierung, Benachrichtigungen und Hooks in der Host-Konfiguration bleiben.
    - Andere Ziel-Harness-Adapter können beim ersten Verwenden weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Vendor-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host kein npm oder keinen Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Lauf fehl, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert ist.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Hintergrundaufgabenstatus, Auslieferung, Bindungen und Richtlinien; das Harness
    besitzt seine Provider-Anmeldung, seinen Modellkatalog, sein Dateisystemverhalten und
    native Tools.

    Bevor Sie OpenClaw verantwortlich machen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness - Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und lassen Sie das Backend seine Standardeinstellung verwenden.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe in der Regel ein ACPX-Berechtigungsprofil, das ohne Bedienung fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges in
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Mit dem `acpx`-Backend verwenden Sie diese Harness-IDs als Ziele für `/acp spawn <id>`
oder `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID | Typisches Backend                              | Hinweise                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`  | GitHub Copilot ACP-Adapter                     | Erfordert Copilot-CLI/Runtime-Authentifizierung.                                    |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI ACP-Adapter                         | Erfordert Gemini CLI-Authentifizierung oder API-Schlüssel-Einrichtung.              |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi/Moonshot-Authentifizierung auf dem Host.                             |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode ACP-Adapter                           | Erfordert OpenCode-CLI/Provider-Authentifizierung.                                  |
| `openclaw` | OpenClaw-Gateway-Bridge über `openclaw acp`    | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zurückzusprechen. |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agent-Aliase können in acpx selbst konfiguriert werden, aber die
OpenClaw-Richtlinie prüft vor dem Dispatch weiterhin `acp.allowedAgents` und alle
`agents.list[].runtime.acp.agent`-Zuordnungen.

## Operator-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
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
  <Accordion title="Lifecycle-Details">
    - Spawn erstellt oder setzt eine ACP-Runtime-Sitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf dem Parent gehört.
    - Parent-eigene ACP-Sitzungen werden als Hintergrundarbeit behandelt, auch wenn die Runtime-Sitzung persistent ist; Abschluss und oberflächenübergreifende Auslieferung laufen über den Parent-Aufgabenbenachrichtiger, statt sich wie eine normale nutzerseitige Chat-Sitzung zu verhalten.
    - Die Aufgabenwartung schließt terminale oder verwaiste Parent-eigene einmalige ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Unterhaltungsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabendatensatz verschwunden ist.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis die Bindung geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder die Bindung noch die Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seine eigene Upstream-Historie weiterhin behalten, wenn es Fortsetzen unterstützt.
    - Das acpx-Plugin bereinigt OpenClaw-eigene Wrapper- und Adapter-Prozessbäume nach `close` und räumt veraltete OpenClaw-eigene ACPX-Waisen beim Gateway-Start auf.
    - Inaktive Runtime-Worker kommen nach `acp.runtime.ttlMinutes` für die Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Routing-Regeln">
    Trigger in natürlicher Sprache, die zum **nativen Codex-Plugin**
    geroutet werden sollten, wenn es aktiviert ist:

    - „Binde diesen Discord-Kanal an Codex.“
    - „Hänge diesen Chat an den Codex-Thread `<id>` an.“
    - „Zeige Codex-Threads und binde dann diesen.“

    Native Codex-Konversationsbindung ist der standardmäßige Chat-Steuerungspfad.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse fügt OpenClaw pro Turn ein natives
    Hook-Relay ein, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Freigaben routen können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert.
    Das Relay bleibt bewusst konservativ: Es verändert keine Codex-nativen
    Tool-Argumente und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie
    explizites ACP nur, wenn Sie das ACP-Laufzeit-/Sitzungsmodell wünschen.
    Die Support-Grenze für eingebettetes Codex ist im
    [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Kurzreferenz für Modell- / Provider- / Laufzeitauswahl">
    - Legacy-Codex-Modellreferenzen - Legacy-Codex-OAuth-/Abonnement-Modellroute, die durch Doctor repariert wird.
    - `openai/*` - native, eingebettete Codex-App-Server-Laufzeit für OpenAI-Agent-Turns.
    - `/codex ...` - native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` - explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="ACP-Routing-Trigger in natürlicher Sprache">
    Trigger, die zur ACP-Laufzeit routen sollten:

    - "Führen Sie dies als einmalige Claude Code ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und behalten Sie Folgeanfragen anschließend im selben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf,
    bindet, sofern unterstützt, an die aktuelle Konversation oder den
    aktuellen Thread und routet Folgeanfragen bis zum Schließen/Ablaufen an
    diese Sitzung. Codex folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder
    das native Codex-Plugin für den angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anfragende nicht in einer Sandbox läuft und ein
    ACP-Laufzeit-Backend geladen ist. `acp.dispatch.enabled=false` pausiert
    den automatischen ACP-Thread-Versand, blendet explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe jedoch nicht aus und blockiert
    sie nicht. Es zielt auf ACP-Harness-IDs wie `codex`, `claude`, `droid`,
    `gemini` oder `opencode`. Übergeben Sie keine normale OpenClaw-Konfigurations-Agent-ID
    aus `agents_list`, es sei denn, dieser Eintrag ist ausdrücklich mit
    `agents.list[].runtime.type="acp"` konfiguriert; verwenden Sie andernfalls
    die standardmäßige Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent mit
    `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie
den **nativen Codex-App-Server** für Codex-Konversationsbindung/-steuerung, wenn
das `codex`-Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie
OpenClaw-native delegierte Läufe möchten.

| Bereich       | ACP-Sitzung                          | Sub-Agent-Lauf                    |
| ------------- | ------------------------------------ | --------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (z. B. acpx)      | OpenClaw-native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`     | `agent:<agentId>:subagent:<uuid>` |
| Hauptbefehle  | `/acp ...`                           | `/subagents ...`                  |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP besteht der Stack aus:

1. OpenClaw ACP-Sitzungssteuerungsebene.
2. Offizielles `@openclaw/acpx`-Laufzeit-Plugin.
3. Claude ACP-Adapter.
4. Claude-seitige Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen,
Sitzungswiederaufnahme, Hintergrundaufgabenverfolgung und optionaler
Konversations-/Thread-Bindung.

CLI-Backends sind separate, rein textbasierte lokale Fallback-Laufzeiten - siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einen einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentalmodell

- **Chat-Oberfläche** - wo Menschen weitersprechen (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** - der dauerhafte Codex/Claude/Gemini-Laufzeitstatus, zu dem OpenClaw routet.
- **Untergeordneter Thread/Thema** - eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Workspace** - der Dateisystemort (`cwd`, Repo-Checkout, Backend-Workspace), an dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung an - kein untergeordneter Thread, dieselbe Chat-Oberfläche.
OpenClaw behält Transport, Authentifizierung, Sicherheit und Zustellung in
seiner Verantwortung. Folgenachrichten in dieser Konversation werden an dieselbe
Sitzung geroutet; `/new` und `/reset` setzen die Sitzung an Ort und Stelle
zurück; `/acp close` entfernt die Bindung.

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
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` - nicht `--bind here`.
    - Wenn Sie ohne `--cwd` zu einem anderen ACP-Agent spawnen, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agent**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Spawn-Fehler angezeigt.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal - `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Folgetext an die gebundene ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wann immer die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
    - ACP-Ausgaben werden zurück in denselben Thread zugestellt.
    - Unfocus/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf des Maximalalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um den automatischen ACP-Thread-Versand zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Kanaladapter-Thread-Sitzungs-Spawns aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Thread-Bindungsunterstützung ist adapterspezifisch. Wenn der aktive
    Kanaladapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Für nicht flüchtige Workflows konfigurieren Sie persistente ACP-Bindungen in
`bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalabhängige Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen erfassen auch Antworten innerhalb der Threads dieses Kanals.
- **Telegram-Forumthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-DM/-Gruppe:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Verwenden Sie E.164-Nummern wie `+15555550123` für direkte Chats und WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us` für Gruppen.
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
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Laufzeitstandards pro Agent

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

- OpenClaw stellt sicher, dass die konfigurierte ACP-Sitzung nach der kanalspezifischen Zulassung und vor der Verwendung existiert.
- Nachrichten in diesem Kanal, Thema oder Chat werden an die konfigurierte ACP-Sitzung weitergeleitet.
- Konfigurierte ACP-Bindings besitzen ihre Sitzungsroute. Kanal-Broadcast-Fan-out ersetzt die konfigurierte ACP-Sitzung für ein passendes Binding nicht.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindings (zum Beispiel durch Thread-Fokus-Abläufe erstellt) gelten weiterhin, sofern vorhanden.
- Für agentenübergreifende ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Ziel-Agent-Arbeitsbereich aus der Agent-Konfiguration.
- Fehlende geerbte Arbeitsbereichspfade fallen auf das Standard-cwd des Backends zurück; nicht fehlende Zugriffsfehler werden als Startfehler ausgegeben.

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
    `runtime` ist standardmäßig `subagent`; setzen Sie daher für ACP-Sitzungen
    explizit `runtime: "acp"`. Wenn `agentId` ausgelassen wird, verwendet
    OpenClaw `acp.defaultAgent`, sofern konfiguriert. `mode: "session"`
    erfordert `thread: true`, um eine dauerhaft gebundene Unterhaltung beizubehalten.
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
  Anfangsprompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, sofern gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Thread-Binding-Ablauf an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist dauerhaft. Wenn `thread: true` gesetzt ist und
  `mode` ausgelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig dauerhaftes
  Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Runtime-Arbeitsverzeichnis (durch Backend-/Runtime-Richtlinie
  validiert). Wenn ausgelassen, übernimmt der ACP-Start den Ziel-Agent-Arbeitsbereich,
  sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-Standards zurück,
  während echte Zugriffsfehler zurückgegeben werden.
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
  `"parent"` streamt anfängliche Fortschrittszusammenfassungen des ACP-Laufs als
  Systemereignisse zurück an die anfordernde Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Log verweist
  (`<sessionId>.acp-stream.jsonl`), dem Sie für den vollständigen Relay-Verlauf folgen können.
  Parent-Fortschrittsstreams zeigen standardmäßig Assistant-Kommentare und ACP-Statusfortschritt,
  sofern nicht `streaming.progress.commentary=false` gesetzt ist. Discord setzt Parent-Vorschauen
  ebenfalls standardmäßig auf den Fortschrittsmodus, wenn kein Stream-Modus konfiguriert ist.
  Statusfortschritt berücksichtigt weiterhin `acp.stream.tagVisibility`, sodass Tags wie `plan`
  verborgen bleiben, sofern sie nicht explizit aktiviert wurden.
</ParamField>

ACP-`sessions_spawn`-Läufe verwenden `agents.defaults.subagents.runTimeoutSeconds` für
ihr standardmäßiges Child-Turn-Limit. Das Tool akzeptiert keine Timeout-Überschreibungen
pro Aufruf.

<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die ACP-Child-Sitzung. Codex-ACP-Starts
  normalisieren OpenAI-Refs wie `openai/gpt-5.4` vor `session/new` in die Codex-ACP-Startkonfiguration;
  Slash-Formen wie `openai/gpt-5.4/high` setzen außerdem den Codex-ACP-Reasoning-Aufwand.
  Wenn ausgelassen, verwendet `sessions_spawn({ runtime: "acp" })` vorhandene
  Subagent-Modellstandards (`agents.defaults.subagents.model` oder
  `agents.list[].subagents.model`), sofern konfiguriert; andernfalls lässt es das
  ACP-Harness sein eigenes Standardmodell verwenden.
  Andere Harnesses müssen ACP-`models` bekanntgeben und
  `session/set_model` unterstützen; andernfalls schlägt OpenClaw/acpx klar fehl,
  statt stillschweigend auf den Standard des Ziel-Agents zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Thinking-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt abgebildet,
  und `off` lässt die Reasoning-Aufwand-Startüberschreibung weg.
  Wenn ausgelassen, verwenden ACP-Starts vorhandene Subagent-Thinking-Standards und
  pro Modell `agents.defaults.models["provider/model"].params.thinking`
  für das ausgewählte Modell.
</ParamField>

## Spawn-Bind- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                               |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | Bindet die aktuell aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt kein Binding für die aktuelle Unterhaltung.                     |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen Child-Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Binding-Unterstützung für die aktuelle Unterhaltung bereitstellen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                              |
    | ------ | ------------------------------------------------------------------------------------------------------ |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen Child-Thread, sofern unterstützt. |
    | `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn Sie sich nicht in einem befinden.           |
    | `off`  | Kein Binding. Die Sitzung startet ungebunden.                                                          |

    Hinweise:

    - Auf Oberflächen ohne Thread-Binding entspricht das Standardverhalten effektiv `off`.
    - Thread-gebundener Start erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung ohne Erstellung eines Child-Threads fixieren möchten.

  </Tab>
</Tabs>

## Zustellmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder vom Parent verwaltete
Hintergrundarbeit sein. Der Zustellpfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche
    weiterzusprechen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung weitergeleitet, und ACP-Ausgabe wird zurück an denselben
    Kanal/Thread/dasselbe Thema zugestellt.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgenachrichten werden als Prompt-Text gesendet, plus Anhänge nur, wenn das Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor dem ACP-Versand abgefangen.
    - Runtime-generierte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agents erhalten OpenClaws internen Runtime-Kontext-Umschlag; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Child-Ergebnis und der Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Umschlag sollte niemals an externe Harnesses gesendet oder als ACP-Benutzer-Transkripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben, wo möglich, in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chat-Inhalt behandelt.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Von einem anderen Agent-Lauf gestartete einmalige ACP-Sitzungen sind Hintergrund-Childs,
    ähnlich wie Subagents:

    - Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
    - Child-Turns laufen auf derselben Hintergrund-Lane, die von nativen Subagent-Starts verwendet wird, sodass ein langsames ACP-Harness nicht die Arbeit unabhängiger Hauptsitzungen blockiert.
    - Abschlussberichte laufen über den Task-Completion-Ankündigungspfad zurück. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor es sie an ein externes Harness sendet, sodass Harnesses keine nur für OpenClaw bestimmten Runtime-Kontextmarker sehen.
    - Der Parent formuliert das Child-Ergebnis in normaler Assistant-Stimme um, wenn eine benutzersichtbare Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen Parent
    und Child. Das Child hat bereits einen Abschlusskanal zurück zum
    Parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kann nach dem Start eine andere Sitzung ansteuern. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Injizieren der Nachricht einen
    Agent-zu-Agent-Folgepfad (A2A):

    - Auf die Antwort der Zielsitzung warten.
    - Optional Anforderer und Ziel eine begrenzte Anzahl von Folge-Turns austauschen lassen.
    - Das Ziel auffordern, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine unabhängige Sitzung
    ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt die A2A-Nachverfolgung nur, wenn der Anforderer das
    übergeordnete Element seines eigenen, vom übergeordneten Element verwalteten Einmal-ACP-Kindelements ist. In diesem Fall
    kann A2A zusätzlich zum Task-Abschluss das übergeordnete Element mit dem
    Ergebnis des Kindelements aufwecken, die Antwort des übergeordneten Elements zurück an das Kindelement weiterleiten und
    eine Echo-Schleife zwischen übergeordnetem Element und Kindelement erzeugen. Das Ergebnis von `sessions_send` meldet
    `delivery.status="skipped"` für diesen verwalteten Kindfall, weil der
    Abschluss-Pfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Vorhandene Session fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Session fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Gesprächsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des bisherigen Verlaufs fortfährt.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übergeben Sie eine Codex-Session von Ihrem Laptop an Ihr Telefon - weisen Sie Ihren Agent an, dort weiterzumachen, wo Sie aufgehört haben.
    - Setzen Sie eine Coding-Session fort, die Sie interaktiv in der CLI gestartet haben, nun headless über Ihren Agent.
    - Nehmen Sie Arbeit wieder auf, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `streamTo` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `resumeSessionId` ist eine hostlokale ACP/Harness-Fortsetzungs-ID, kein OpenClaw-Kanal-Session-Schlüssel; OpenClaw prüft weiterhin die ACP-Spawn-Richtlinie und die Ziel-Agent-Richtlinie vor der Weiterleitung, während das ACP-Backend oder Harness die Autorisierung zum Laden dieser Upstream-ID besitzt.
    - `resumeSessionId` stellt den Upstream-ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Session, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Session-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl - ohne stillen Fallback auf eine neue Session.

  </Accordion>
  <Accordion title="Smoke-Test nach dem Deployment">
    Führen Sie nach einem Gateway-Deployment eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Prüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Session zu einem Live-Agent.
    3. Bitten Sie diesen Agent, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und dem Task `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Prüfen Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
    5. Bereinigen Sie die temporäre Bridge-Session.

    Belassen Sie das Gate bei `mode: "run"` und überspringen Sie `streamTo: "parent"` -
    threadgebundene `mode: "session"`- und Stream-Relay-Pfade sind separate,
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sessions laufen derzeit auf der Host-Runtime, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Richtlinie von OpenClaw kapselt die ACP-Harness-Ausführung **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agenten, Session-Eigentümerschaft, Kanalbindungen und Gateway-Zustellrichtlinien.
- Verwenden Sie `runtime: "subagent"` für sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die Anforderer-Session in einer Sandbox läuft, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung des Session-Ziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Session-Ziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht den Schlüssel
   - dann die UUID-förmige Session-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn dieses Gespräch/dieser Thread an eine ACP-Session gebunden ist).
3. Fallback auf die aktuelle Anforderer-Session.

Bindungen des aktuellen Gesprächs und Thread-Bindungen nehmen beide an
Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl               | Was er tut                                                | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Session erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Ziel-Session abbrechen.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an die laufende Session senden.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Session schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Runtime-Optionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Ziel-Session setzen.                | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Runtime-Konfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Runtime-Arbeitsverzeichnis-Override setzen.               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Genehmigungsrichtlinienprofil setzen.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout (Sekunden) setzen.                        | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-Modell-Override setzen.                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Runtime-Options-Overrides der Session entfernen.          | `/acp reset-options`                                          |
| `/acp sessions`      | Kürzliche ACP-Sessions aus dem Speicher auflisten.        | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen.     | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp status` zeigt die effektiven Runtime-Optionen sowie Session-Kennungen auf Runtime- und
Backend-Ebene. Fehler für nicht unterstützte Steuerungen werden
klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Speicher für die aktuell gebundene oder die Anforderer-Session; Ziel-Token
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Session-Erkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

### Zuordnung der Runtime-Optionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Entsprechende
Operationen:

| Befehl                       | Wird zugeordnet zu                    | Hinweise                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Runtime-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai/gpt-5.4/high` `reasoning_effort` zu.                                          |
| `/acp set thinking <level>`  | kanonische Option `thinking`          | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, bevorzugt `thinking`, dann `effort`, `reasoning_effort` oder `thought_level`. Für Codex ACP ordnet der Adapter Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, zum Beispiel `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                      |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`    | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, zum Beispiel `timeout` oder `timeout_seconds`.                                                                                      |
| `/acp cwd <path>`            | Runtime-cwd-Override                  | Direkte Aktualisierung.                                                                                                                                                                                    |
| `/acp set <key> <value>`     | generisch                             | `key=cwd` verwendet den cwd-Override-Pfad.                                                                                                                                                                 |
| `/acp reset-options`         | löscht alle Runtime-Overrides         | -                                                                                                                                                                                                          |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI
Aliase), zu den MCP-Bridges plugin-tools und OpenClaw-tools sowie zu ACP-
Berechtigungsmodi finden Sie unter
[ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                | Behebung                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                            | Setzen Sie `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatisches Dispatching aus normalen Thread-Nachrichten ist deaktiviert.                                             | Setzen Sie `acp.dispatch.enabled=true`, um das automatische Thread-Routing fortzusetzen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin.        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                      | Verwenden Sie eine zulässige `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                               |
| `/acp doctor` meldet Backend direkt nach dem Start als nicht bereit          | Backend-Plugin fehlt, ist deaktiviert, durch Allow-/Deny-Policy blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Backend-Installations- oder Policy-Fehler, falls es fehlerhaft bleibt.    |
| Harness-Befehl nicht gefunden                                                | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erste `npx`-Abruf ist bei einem Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit.                                |
| Modell-nicht-gefunden vom Harness                                            | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                              | Verwenden Sie ein von diesem Harness gelistetes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                          |
| Vendor-Authentifizierungsfehler vom Harness                                  | OpenClaw ist fehlerfrei, aber die Ziel-CLI bzw. der Ziel-Provider ist nicht angemeldet.                               | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Umgebung des Gateway-Hosts bereit.                                                              |
| `Unable to resolve session target: ...`                                     | Falscher Schlüssel-/ID-/Label-Token.                                                                                   | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel bzw. das exakte Label und versuchen Sie es erneut.                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                                                       | Wechseln Sie zum Ziel-Chat/-Channel und versuchen Sie es erneut, oder verwenden Sie einen ungebundenen Spawn.                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine ACP-Bindungsfähigkeit für die aktuelle Unterhaltung.                                                 | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Channel.              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                       | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                  | Binden Sie als Besitzer neu oder verwenden Sie eine andere Unterhaltung oder einen anderen Thread.                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Thread-Bindungsfähigkeit.                                                                            | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Channel.                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft auf Host-Seite; die anfragende Session ist sandboxed.                                                | Verwenden Sie `runtime="subagent"` aus sandboxed Sessions oder führen Sie ACP-Spawn aus einer nicht-sandboxed Session aus.                                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                                            | Verwenden Sie `runtime="subagent"` für erforderliches Sandboxing oder verwenden Sie ACP mit `sandbox="inherit"` aus einer nicht-sandboxed Session.                               |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness stellt kein generisches ACP-Modellwechseln bereit.                                                    | Verwenden Sie ein Harness, das ACP `models`/`session/set_model` ausweist, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, wenn es ein eigenes Start-Flag hat. |
| Fehlende ACP-Metadaten für gebundene Session                                 | Veraltete/gelöschte ACP-Session-Metadaten.                                                                             | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                        |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungsaktionen in nicht interaktiver ACP-Session.                            | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie den Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Session schlägt früh mit wenig Ausgabe fehl                              | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                            | Prüfen Sie die Gateway-Logs auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für graceful degradation setzen Sie `nonInteractivePermissions=deny`. |
| ACP-Session bleibt nach Abschluss der Arbeit unbegrenzt stehen               | Harness-Prozess ist beendet, aber die ACP-Session hat keinen Abschluss gemeldet.                                      | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung entfernt veraltete, OpenClaw-eigene Wrapper- und Adapterprozesse beim Schließen und beim Gateway-Start.                |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interner Ereignisumschlag ist über die ACP-Grenze geleakt.                                                            | Aktualisieren Sie OpenClaw und führen Sie den Abschluss-Flow erneut aus; externe Harnesses sollten nur einfache Abschluss-Prompts erhalten.                                      |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` gehört zum
nativen Codex-Hook-Relay, nicht zu ACP/acpx. Starten Sie in einem gebundenen
Codex-Chat eine frische Session mit `/new` oder `/reset`; wenn es einmal
funktioniert und dann beim nächsten nativen Tool-Aufruf erneut auftritt,
starten Sie den Codex-App-Server oder OpenClaw Gateway neu, statt `/new`
zu wiederholen. Siehe [Fehlerbehebung für das Codex-Harness](/de/plugins/codex-harness#troubleshooting).
</Note>

## Verwandte Themen

- [ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agents](/de/tools/subagents)
