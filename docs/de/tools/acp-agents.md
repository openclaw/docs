---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Einrichten konversationsgebundener ACP-Sitzungen in Messaging-Kanälen
    - Eine Message-Channel-Unterhaltung an eine persistente ACP-Sitzung binden
    - Fehlerbehebung für ACP-Backend, Plugin-Verdrahtung oder Completion-Zustellung
    - /acp-Befehle aus dem Chat bedienen
sidebarTitle: ACP agents
summary: Führen Sie externe Coding-Harnesse (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend aus
title: ACP-Agenten
x-i18n:
    generated_at: "2026-06-30T14:00:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen
ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI und andere
unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der Standardpfad für Codex.** Das
native Codex-App-Server-Plugin besitzt die `/codex ...`-Steuerungen und die standardmäßige
eingebettete `openai/gpt-*`-Laufzeit für Agenten-Turns; ACP besitzt die
`/acp ...`-Steuerungen und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client
direkt eine Verbindung zu bestehenden OpenClaw-Kanalunterhaltungen herstellt,
verwenden Sie [`openclaw mcp serve`](/de/cli/mcp) statt ACP.
</Note>

## Welche Seite brauche ich?

| Sie möchten …                                                                                   | Verwenden Sie                         | Hinweise                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                         | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stopp- und Steuerbefehle. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                           | Chat-gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerungen                                                                       |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen       | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                                                        |
| Eine lokale KI-CLI als reines Text-Fallback-Modell wiederverwenden                              | [CLI-Backends](/de/gateway/cli-backends) | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Laufzeit                                                                                                                |

## Funktioniert das direkt nach der Installation?

Ja, nach der Installation des offiziellen ACP-Laufzeit-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können das lokale Workspace-Plugin `extensions/acpx` nach
`pnpm install` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über ACP-Spawns, wenn ACP **wirklich
nutzbar** ist: ACP muss aktiviert sein, Dispatch darf nicht deaktiviert sein, die aktuelle
Sitzung darf nicht durch die Sandbox blockiert sein, und ein Laufzeit-Backend muss
geladen sein. Wenn diese Bedingungen nicht erfüllt sind, bleiben ACP-Plugin-Skills und
die `sessions_spawn`-ACP-Anleitung verborgen, damit der Agent kein
nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="First-run gotchas">
    - Wenn `plugins.allow` gesetzt ist, handelt es sich um ein einschränkendes Plugin-Inventar und es **muss** `acpx` enthalten; andernfalls wird das installierte ACP-Backend absichtlich blockiert und `/acp doctor` meldet den fehlenden Allowlist-Eintrag.
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin bereitgestellt und nach Möglichkeit lokal gestartet.
    - Codex ACP läuft mit einem isolierten `CODEX_HOME`; OpenClaw kopiert vertrauenswürdige Projekteinträge sowie sichere Modell-/Provider-Routing-Konfiguration aus der Host-Codex-Konfiguration, während Authentifizierung, Benachrichtigungen und Hooks in der Host-Konfiguration bleiben.
    - Andere Ziel-Harness-Adapter können bei der ersten Verwendung weiterhin bei Bedarf mit `npx` abgerufen werden.
    - Die Anbieter-Authentifizierung muss für dieses Harness weiterhin auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis Caches vorgewärmt sind oder der Adapter auf anderem Weg installiert wurde.

  </Accordion>
  <Accordion title="Runtime prerequisites">
    ACP startet einen echten externen Harness-Prozess. OpenClaw besitzt Routing,
    Status von Hintergrundaufgaben, Zustellung, Bindings und Richtlinien; das Harness
    besitzt seine Provider-Anmeldung, den Modellkatalog, das Dateisystemverhalten und
    native Tools.

    Bevor Sie OpenClaw als Ursache annehmen, prüfen Sie:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` erlaubt, wenn diese Allowlist gesetzt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host starten.
    - Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell existiert für dieses Harness - Modell-IDs sind nicht zwischen Harnesses portierbar.
    - Das angeforderte `cwd` existiert und ist zugänglich, oder lassen Sie `cwd` weg und überlassen Sie dem Backend die Verwendung seines Standards.
    - Der Berechtigungsmodus passt zur Arbeit. Nicht interaktive Sitzungen können keine nativen Berechtigungsabfragen anklicken, daher benötigen schreib-/ausführungsintensive Coding-Läufe meist ein ACPX-Berechtigungsprofil, das ohne Bedienung fortfahren kann.

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
| `claude`   | Claude Code ACP-Adapter                        | Erfordert Claude Code-Authentifizierung auf dem Host.                               |
| `codex`    | Codex ACP-Adapter                              | Expliziter ACP-Fallback nur, wenn natives `/codex` nicht verfügbar ist oder ACP angefordert wurde. |
| `copilot`  | GitHub Copilot ACP-Adapter                     | Erfordert Copilot-CLI-/Laufzeit-Authentifizierung.                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`    | Factory Droid CLI                              | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `gemini`   | Gemini CLI ACP-Adapter                         | Erfordert Gemini CLI-Authentifizierung oder API-Schlüssel-Einrichtung.              |
| `iflow`    | iFlow CLI                                      | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kilocode` | Kilo Code CLI                                  | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `kimi`     | Kimi/Moonshot CLI                              | Erfordert Kimi-/Moonshot-Authentifizierung auf dem Host.                            |
| `kiro`     | Kiro CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.       |
| `opencode` | OpenCode ACP-Adapter                           | Erfordert OpenCode CLI-/Provider-Authentifizierung.                                 |
| `openclaw` | OpenClaw Gateway-Bridge über `openclaw acp`    | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zu sprechen. |
| `qwen`     | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |

Benutzerdefinierte acpx-Agenten-Aliasse können in acpx selbst konfiguriert werden, aber die OpenClaw-
Richtlinie prüft weiterhin `acp.allowedAgents` und jede
`agents.list[].runtime.acp.agent`-Zuordnung vor dem Dispatch.

## Betreiber-Runbook

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Work">
    Fahren Sie in der gebundenen Unterhaltung oder im gebundenen Thread fort
    (oder adressieren Sie den Sitzungsschlüssel explizit).
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
    Ohne Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stop">
    `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindings).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - Spawn erstellt oder setzt eine ACP-Laufzeitsitzung fort, zeichnet ACP-Metadaten im OpenClaw-Sitzungsspeicher auf und kann eine Hintergrundaufgabe erstellen, wenn der Lauf übergeordnetem Besitz unterliegt.
    - Übergeordnet besessene ACP-Sitzungen werden als Hintergrundarbeit behandelt, selbst wenn die Laufzeitsitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung laufen über den Notifier der übergeordneten Aufgabe, statt wie eine normale benutzerseitige Chat-Sitzung zu agieren.
    - Aufgabenwartung schließt terminale oder verwaiste übergeordnet besessene One-Shot-ACP-Sitzungen. Persistente ACP-Sitzungen bleiben erhalten, solange ein aktives Unterhaltungs-Binding besteht; veraltete persistente Sitzungen ohne aktives Binding werden geschlossen, damit sie nicht stillschweigend fortgesetzt werden können, nachdem die besitzende Aufgabe erledigt ist oder ihr Aufgabeneintrag fehlt.
    - Gebundene Folgenachrichten gehen direkt an die ACP-Sitzung, bis das Binding geschlossen, aus dem Fokus genommen, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden nie als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Turn ab, wenn das Backend Abbruch unterstützt; es löscht weder das Binding noch Sitzungsmetadaten.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt das Binding. Ein Harness kann seine eigene Upstream-Historie weiterhin behalten, wenn es Fortsetzen unterstützt.
    - Das acpx-Plugin bereinigt OpenClaw-eigene Wrapper- und Adapter-Prozessbäume nach `close` und entfernt veraltete OpenClaw-eigene ACPX-Waisen während des Gateway-Starts.
    - Leerlaufende Laufzeit-Worker kommen nach `acp.runtime.ttlMinutes` für Bereinigung infrage; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex routing rules">
    Natürlichsprachliche Auslöser, die an das **native Codex-
    Plugin** geleitet werden sollten, wenn es aktiviert ist:

    - „Binde diesen Discord-Kanal an Codex.“
    - „Hänge diesen Chat an Codex-Thread `<id>` an.“
    - „Zeige Codex-Threads und binde dann diesen.“

    Native Codex-Konversationsbindung ist der standardmäßige Chat-Steuerungspfad.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während
    Codex-native Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden.
    Für Codex-native Tool-Ereignisse injiziert OpenClaw pro Turn ein natives
    Hook-Relay, damit Plugin-Hooks `before_tool_call` blockieren,
    `after_tool_call` beobachten und Codex-`PermissionRequest`-Ereignisse
    über OpenClaw-Genehmigungen routen können. Codex-`Stop`-Hooks werden an
    OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins einen weiteren
    Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay bleibt
    bewusst konservativ: Es verändert keine Codex-nativen Tool-
    Argumente und schreibt keine Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur,
    wenn Sie das ACP-Runtime/Sitzungsmodell wünschen. Die eingebettete Codex-
    Support-Grenze ist im
    [Support-Vertrag für Codex Harness v1](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Kurzreferenz zur Modell-/Provider-/Runtime-Auswahl">
    - Legacy-Codex-Modellreferenzen - Legacy-Codex-OAuth/Abonnement-Modellroute, durch doctor repariert.
    - `openai/*` - native eingebettete Codex-App-Server-Runtime für OpenAI-Agent-Turns.
    - `/codex ...` - native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` - explizite ACP/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Trigger für ACP-Routing">
    Trigger, die zur ACP-Runtime routen sollten:

    - "Führen Sie dies als einmalige Claude-Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen."
    - "Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread, und behalten Sie anschließend Folgeanfragen in demselben Thread."
    - "Führen Sie Codex über ACP in einem Hintergrund-Thread aus."

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf,
    bindet sich, sofern unterstützt, an die aktuelle Konversation oder den aktuellen Thread und
    routet Folgeanfragen bis zum Schließen/Ablauf an diese Sitzung. Codex
    folgt diesem Pfad nur, wenn ACP/acpx explizit ist oder das native Codex-
    Plugin für den angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angekündigt, wenn ACP
    aktiviert ist, der Anforderer nicht sandboxed ist und ein ACP-Runtime-
    Backend geladen ist. `acp.dispatch.enabled=false` pausiert die automatische
    ACP-Thread-Weiterleitung, blendet oder blockiert aber explizite
    `sessions_spawn({ runtime: "acp" })`-Aufrufe nicht. Es zielt auf ACP-Harness-IDs wie `codex`,
    `claude`, `droid`, `gemini` oder `opencode`. Übergeben Sie keine normale
    OpenClaw-Konfigurations-Agent-ID aus `agents_list`, es sei denn, dieser Eintrag ist
    explizit mit `agents.list[].runtime.type="acp"` konfiguriert;
    verwenden Sie andernfalls die standardmäßige Sub-Agent-Runtime. Wenn ein OpenClaw-Agent
    mit `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw
    `runtime.acp.agent` als zugrunde liegende Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime wünschen. Verwenden Sie den **nativen Codex-
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`-
Plugin aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native
delegierte Läufe wünschen.

| Bereich       | ACP-Sitzung                         | Sub-Agent-Lauf                    |
| ------------- | ----------------------------------- | --------------------------------- |
| Runtime       | ACP-Backend-Plugin (z. B. acpx)     | OpenClaw-native Sub-Agent-Runtime |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`    | `agent:<agentId>:subagent:<uuid>` |
| Hauptbefehle  | `/acp ...`                          | `/subagents ...`                  |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP sieht der Stack so aus:

1. OpenClaw-ACP-Sitzungs-Control-Plane.
2. Offizielles `@openclaw/acpx`-Runtime-Plugin.
3. Claude-ACP-Adapter.
4. Runtime/Sitzungsmechanik auf Claude-Seite.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Hintergrundaufgabenverfolgung und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate textbasierte lokale Fallback-Runtimes - siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch:

- **Möchten Sie `/acp spawn`, bindbare Sitzungen, Runtime-Steuerungen oder dauerhafte Harness-Arbeit?** Verwenden Sie ACP.
- **Möchten Sie einfachen lokalen Text-Fallback über die rohe CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** - wo Personen weiter kommunizieren (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** - der dauerhafte Codex/Claude/Gemini-Runtime-Zustand, an den OpenClaw routet.
- **Untergeordneter Thread/Thema** - eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Runtime-Arbeitsbereich** - der Dateisystemspeicherort (`cwd`, Repo-Checkout, Backend-Arbeitsbereich), an dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung - kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
Transport, Authentifizierung, Sicherheit und Zustellung. Folge-Nachrichten in dieser
Konversation werden an dieselbe Sitzung geroutet; `/new` und `/reset` setzen die
Sitzung an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, künftige Nachrichten hierher routen
/codex model gpt-5.4                                     # den gebundenen nativen Codex-Thread abstimmen
/codex stop                                              # den aktiven nativen Codex-Turn steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # dieselbe Chat-Bindung, Codex läuft in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindung an die aktuelle Konversation ankündigen; andernfalls gibt OpenClaw eine klare Nicht-unterstützt-Meldung zurück. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` - nicht `--bind here`.
    - Wenn Sie ohne `--cwd` einen anderen ACP-Agent starten, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agents**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) fallen auf die Backend-Standardeinstellung zurück; andere Zugriffsfehler (z. B. `EACCES`) erscheinen als Spawn-Fehler.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal - `/acp ...`-Befehle werden von OpenClaw verarbeitet, auch wenn normaler Folgetext an die gebundene ACP-Sitzung geroutet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, sobald die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Folge-Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
    - ACP-Ausgabe wird zurück in denselben Thread zugestellt.
    - Unfocus/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf durch maximales Alter entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Feature-Flags für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Erstellung von Thread-Sitzungen im Kanaladapter aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Thread-Bindungsunterstützung ist adapterspezifisch. Wenn der aktive Kanal-
    Adapter Thread-Bindungen nicht unterstützt, gibt OpenClaw eine klare
    Nicht-unterstützt-/Nicht-verfügbar-Meldung zurück.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forumthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können Unterstützung über dieselbe Bindungsschnittstelle hinzufügen.

  </Accordion>
</AccordionGroup>

## Dauerhafte Kanalbindungen

Für nicht flüchtige Workflows konfigurieren Sie dauerhafte ACP-Bindungen in
Top-Level-`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Markiert eine dauerhafte ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalbezogene Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen treffen auch auf Antworten innerhalb der Threads dieses Kanals zu.
- **Telegram-Forumthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-DM/-Gruppe:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Verwenden Sie E.164-Nummern wie `+15555550123` für direkte Chats und WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us` für Gruppen.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des besitzenden OpenClaw-Agents.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionales, betreiberseitig sichtbares Label.
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

**Überschreibungsrangfolge für ACP-gebundene Sitzungen:**

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

- OpenClaw stellt sicher, dass die konfigurierte ACP-Sitzung nach der kanalspezifischen Zulassung und vor der Verwendung vorhanden ist.
- Nachrichten in diesem Kanal, Thema oder Chat werden an die konfigurierte ACP-Sitzung geleitet.
- Konfigurierte ACP-Bindungen besitzen ihre Sitzungsroute. Kanal-Broadcast-Fan-out ersetzt die konfigurierte ACP-Sitzung für eine passende Bindung nicht.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Laufzeit-Bindungen (zum Beispiel durch Thread-Fokus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende geerbte Arbeitsbereichspfade fallen auf das Standard-cwd des Backends zurück; nicht fehlende Zugriffsfehler werden als Spawn-Fehler angezeigt.

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
    `runtime` ist standardmäßig `subagent`; setzen Sie daher für ACP-Sitzungen
    explizit `runtime: "acp"`. Wenn `agentId` ausgelassen wird, verwendet
    OpenClaw `acp.defaultAgent`, sofern konfiguriert. `mode: "session"` erfordert
    `thread: true`, um eine persistente gebundene Unterhaltung beizubehalten.
    </Note>

  </Tab>
  <Tab title="Aus dem /acp-Befehl">
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
  Anfänglicher Prompt, der an die ACP-Sitzung gesendet wird.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert einen Thread-Bindungsflow an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist persistent. Wenn `thread: true` gesetzt ist und
  `mode` ausgelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes
  Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Laufzeit-Arbeitsverzeichnis (validiert durch Backend-/Laufzeit-
  Richtlinie). Wenn ausgelassen, übernimmt der ACP-Spawn den Arbeitsbereich des
  Ziel-Agenten, sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-
  Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Operator-seitige Bezeichnung, die in Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, statt eine neue zu erstellen. Der
  Agent spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt anfängliche Fortschrittszusammenfassungen des ACP-Laufs als
  Systemereignisse zurück an die anfragende Sitzung. Akzeptierte Antworten enthalten
  `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Protokoll verweist
  (`<sessionId>.acp-stream.jsonl`), das Sie für den vollständigen Relay-Verlauf
  verfolgen können. Parent-Fortschrittsstreams zeigen standardmäßig Assistant-Kommentare
  und ACP-Statusfortschritt an, sofern nicht `streaming.progress.commentary=false`
  gesetzt ist. Discord setzt Parent-Vorschauen ebenfalls standardmäßig auf den
  Fortschrittsmodus, wenn kein Stream-Modus konfiguriert ist. Statusfortschritt
  berücksichtigt weiterhin `acp.stream.tagVisibility`, sodass Tags wie `plan`
  verborgen bleiben, sofern sie nicht explizit aktiviert werden.
</ParamField>

ACP-`sessions_spawn`-Läufe verwenden `agents.defaults.subagents.runTimeoutSeconds` als
standardmäßiges Limit für untergeordnete Turns. Das Tool akzeptiert keine
Timeout-Überschreibungen pro Aufruf.

<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die untergeordnete ACP-Sitzung. Codex-ACP-Spawns
  normalisieren OpenAI-Referenzen wie `openai/gpt-5.4` vor `session/new` in die
  Codex-ACP-Startkonfiguration; Slash-Formen wie `openai/gpt-5.4/high` setzen
  außerdem den Codex-ACP-Reasoning-Aufwand.
  Wenn ausgelassen, verwendet `sessions_spawn({ runtime: "acp" })` vorhandene
  Subagent-Modellstandards (`agents.defaults.subagents.model` oder
  `agents.list[].subagents.model`), sofern konfiguriert; andernfalls lässt es das
  ACP-Harness sein eigenes Standardmodell verwenden.
  Andere Harnesses müssen ACP-`models` ankündigen und `session/set_model`
  unterstützen; andernfalls schlägt OpenClaw/acpx eindeutig fehl, statt still auf
  den Standard des Ziel-Agenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Thinking-/Reasoning-Aufwand. Für Codex ACP wird `minimal` auf
  niedrigen Aufwand abgebildet, `low`/`medium`/`high`/`xhigh` werden direkt
  abgebildet, und `off` lässt die Reasoning-Aufwand-Startüberschreibung aus.
  Wenn ausgelassen, verwenden ACP-Spawns vorhandene Subagent-Thinking-Standards und
  pro Modell `agents.defaults.models["provider/model"].params.thinking`
  für das ausgewählte Modell.
</ParamField>

## Spawn-Bindungs- und Thread-Modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                            |
    | ------ | -------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                 |

    Hinweise:

    - `--bind here` ist der einfachste Operator-Pfad für „diesen Kanal oder Chat mit Codex hinterlegen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Bindungsunterstützung für die aktuelle Unterhaltung bereitstellen.
    - `--bind` und `--thread` können im selben `/acp spawn`-Aufruf nicht kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                         |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, sofern unterstützt. |
    | `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn keiner vorhanden ist.                  |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                    |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung ist das Standardverhalten effektiv `off`.
    - Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder vom Parent verwaltete
Hintergrundarbeit sein. Der Zustellungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche
    weiter zu kommunizieren:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Persistente konfigurierte `bindings[].type="acp"` leiten passende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgemeldungen in der gebundenen Unterhaltung werden direkt an die
    ACP-Sitzung geleitet, und ACP-Ausgabe wird zurück an denselben
    Kanal/Thread/dasselbe Thema zugestellt.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Follow-ups werden als Prompt-Text gesendet, plus Anhänge nur dann, wenn Harness/Backend sie unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weitergabe abgefangen.
    - Von der Laufzeit erzeugte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten den internen Runtime-Context-Umschlag von OpenClaw; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem untergeordneten Ergebnis und der Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Umschlag sollte niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext persistiert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschluss-Prompt. Interne Ereignismetadaten bleiben in OpenClaw nach Möglichkeit strukturiert und werden nicht als vom Benutzer verfasste Chat-Inhalte behandelt.

  </Accordion>
  <Accordion title="Vom Parent verwaltete einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agent-Lauf gestartet werden, sind
    Hintergrund-Children, ähnlich wie Subagents:

    - Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
    - Child-Turns laufen auf derselben Hintergrund-Lane wie native Subagent-Spawns, sodass ein langsames ACP-Harness keine unabhängige Arbeit der Hauptsitzung blockiert.
    - Abschlussberichte werden über den Task-Completion-Ankündigungspfad zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor sie an ein externes Harness gesendet werden, sodass Harnesses keine nur OpenClaw-internen Runtime-Context-Marker sehen.
    - Der Parent formuliert das Child-Ergebnis in normaler Assistant-Stimme um, wenn eine benutzersichtbare Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen Parent
    und Child. Das Child hat bereits einen Abschlusskanal zurück zum
    Parent.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Spawn eine andere Sitzung ansprechen. Für normale
    Peer-Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen
    Agent-zu-Agent-Follow-up-Pfad (A2A):

    - Auf die Antwort der Zielsitzung warten.
    - Optional anfragende Sitzung und Ziel eine begrenzte Anzahl von Follow-up-Turns austauschen lassen.
    - Das Ziel auffordern, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender ein
    sichtbares Follow-up benötigt. Er bleibt aktiviert, wenn eine unabhängige Sitzung
    ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten
    `tools.sessions.visibility`-Einstellungen.

    OpenClaw überspringt das A2A-Follow-up nur, wenn der Anforderer der
    Parent seines eigenen, Parent-eigenen einmaligen ACP-Childs ist. In diesem Fall
    kann A2A zusätzlich zum Aufgabenabschluss den Parent mit dem Ergebnis des
    Childs aufwecken, die Antwort des Parents zurück an das Child weiterleiten und
    eine Parent/Child-Echoschleife erzeugen. Das Ergebnis von `sessions_send` meldet
    `delivery.status="skipped"` für diesen Owned-Child-Fall, weil der
    Abschluss-Pfad bereits für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt
    neu zu starten. Der Agent spielt seinen Gesprächsverlauf über
    `session/load` erneut ab, sodass er mit dem vollständigen Kontext des Vorherigen
    fortfährt.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übergeben Sie eine Codex-Sitzung von Ihrem Laptop an Ihr Telefon - weisen Sie Ihren Agent an, dort weiterzumachen, wo Sie aufgehört haben.
    - Setzen Sie eine Coding-Sitzung fort, die Sie interaktiv in der CLI gestartet haben, jetzt headless über Ihren Agent.
    - Nehmen Sie Arbeit wieder auf, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `streamTo` gilt nur bei `runtime: "acp"`; die Standard-Sub-Agent-Runtime ignoriert dieses reine ACP-Feld.
    - `resumeSessionId` ist eine hostlokale ACP/Harness-Resume-ID, kein OpenClaw-Channel-Sitzungsschlüssel; OpenClaw prüft weiterhin die ACP-Spawn-Policy und die Ziel-Agent-Policy vor dem Dispatch, während das ACP-Backend oder Harness die Autorisierung zum Laden dieser Upstream-ID besitzt.
    - `resumeSessionId` stellt den Upstream-ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl - ohne stillen Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach dem Deployment">
    Führen Sie nach einem Gateway-Deployment eine Live-End-to-End-Prüfung aus, statt
    Unit-Tests zu vertrauen:

    1. Prüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agent.
    3. Bitten Sie diesen Agent, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Prüfen Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Belassen Sie das Gate bei `mode: "run"` und überspringen Sie `streamTo: "parent"` -
    threadgebundenes `mode: "session"` und Stream-Relay-Pfade sind separate
    umfangreichere Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, **nicht** innerhalb der
OpenClaw-Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen/schreiben.
- Die Sandbox-Policy von OpenClaw kapselt die ACP-Harness-Ausführung **nicht**.
- OpenClaw erzwingt weiterhin ACP-Feature-Gates, erlaubte Agents, Sitzungsbesitz, Channel-Bindings und Gateway-Zustellungsrichtlinien.
- Verwenden Sie `runtime: "subagent"` für sandbox-erzwungene OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die Anforderer-Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
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
3. Fallback auf die aktuelle Anforderer-Sitzung.

Bindungen der aktuellen Unterhaltung und Thread-Bindungen werden beide in
Schritt 2 berücksichtigt.

Wenn kein Ziel aufgelöst wird, gibt OpenClaw einen klaren Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerungen

| Befehl               | Was er tut                                               | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an laufende Sitzung senden.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Runtime-Optionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Runtime-Konfigurationsoption schreiben.         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Override für das Runtime-Arbeitsverzeichnis festlegen.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Approval-Policy-Profil festlegen.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout festlegen (Sekunden).                     | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-Modell-Override festlegen.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Runtime-Options-Overrides der Sitzung entfernen.          | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Store auflisten.            | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten und umsetzbare Korrekturen.  | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

Runtime-Steuerungen (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` und `reset-options`) erfordern
eine Owner-Identität aus externen Channels und `operator.admin` von internen Gateway-
Clients. Autorisierte Nicht-Owner-Absender können weiterhin `sessions`, `doctor`,
`install` und `help` verwenden.

`/acp status` zeigt die effektiven Runtime-Optionen sowie Sitzungskennungen auf
Runtime- und Backend-Ebene. Fehler für nicht unterstützte Steuerungen werden klar
angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den
Store für die aktuell gebundene oder die Anforderer-Sitzung; Ziel-Tokens
(`session-key`, `session-id` oder `session-label`) werden über die
Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter
`session.store`-Stammverzeichnisse pro Agent.

### Zuordnung von Runtime-Optionen

`/acp` bietet Komfortbefehle und einen generischen Setter. Äquivalente
Operationen:

| Befehl                       | Wird zugeordnet zu                  | Hinweise                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Runtime-Konfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai/<model>` zur Adapter-Modell-ID und ordnet Slash-Reasoning-Suffixe wie `openai/gpt-5.4/high` `reasoning_effort` zu.                                             |
| `/acp set thinking <level>`  | kanonische Option `thinking`         | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, und bevorzugt `thinking`, dann `effort`, `reasoning_effort` oder `thought_level`. Für Codex ACP ordnet der Adapter Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, etwa `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                                  |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`   | OpenClaw sendet das vom Backend beworbene Äquivalent, wenn vorhanden, etwa `timeout` oder `timeout_seconds`.                                                                                               |
| `/acp cwd <path>`            | Runtime-cwd-Override                 | Direkte Aktualisierung.                                                                                                                                                                                    |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den cwd-Override-Pfad.                                                                                                                                                                 |
| `/acp reset-options`         | löscht alle Runtime-Overrides        | -                                                                                                                                                                                                          |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur acpx-Harness-Konfiguration (Claude Code / Codex / Gemini CLI-
Aliasse), den MCP-Bridges plugin-tools und OpenClaw-tools sowie ACP-
Berechtigungsmodi finden Sie unter
[ACP-Agents - Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                                                | Behebung                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Allowlist gesetzt ist, und führen Sie dann `/acp doctor` aus.    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                                                            | Setzen Sie `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische Dispatch-Verarbeitung aus normalen Thread-Nachrichten ist deaktiviert.                                    | Setzen Sie `acp.dispatch.enabled=true`, um automatisches Thread-Routing wieder aufzunehmen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin. |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent ist nicht in der Allowlist.                                                                                      | Verwenden Sie eine zulässige `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin fehlt, ist deaktiviert, wird durch Allow-/Deny-Policy blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar. | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Installations- oder Policy-Fehler des Backends, falls es fehlerhaft bleibt. |
| Harness command not found                                                   | Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erstmalige `npx`-Abruf ist für einen Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren/wärmen Sie den Adapter auf dem Gateway-Host vor oder konfigurieren Sie den acpx-Agent-Befehl explizit.                         |
| Model-not-found from the harness                                            | Modell-ID ist für einen anderen Provider/Harness gültig, aber nicht für dieses ACP-Ziel.                               | Verwenden Sie ein von diesem Harness gelistetes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                   |
| Vendor auth error from the harness                                          | OpenClaw ist fehlerfrei, aber die Ziel-CLI/der Ziel-Provider ist nicht angemeldet.                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Gateway-Host-Umgebung bereit.                                                           |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                                                                 | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel/das exakte Label und versuchen Sie es erneut.                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                                                       | Wechseln Sie zum Ziel-Chat/-Channel und versuchen Sie es erneut oder verwenden Sie einen ungebundenen Spawn.                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Dem Adapter fehlt die ACP-Bindungsfähigkeit für die aktuelle Unterhaltung.                                             | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Channel.      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                       | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                  | Binden Sie als Besitzer neu oder verwenden Sie eine andere Unterhaltung oder einen anderen Thread.                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | Dem Adapter fehlt die Thread-Bindungsfähigkeit.                                                                        | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Channel.                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft hostseitig; die anfragende Sitzung ist sandboxed.                                                    | Verwenden Sie `runtime="subagent"` aus sandboxed Sitzungen oder führen Sie ACP-Spawn aus einer nicht sandboxed Sitzung aus.                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Runtime angefordert.                                                                 | Verwenden Sie `runtime="subagent"` für erforderliches Sandboxing oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung.                                      |
| `Cannot apply --model ... did not advertise model support`                  | Das Ziel-Harness stellt kein generisches ACP-Modellwechseln bereit.                                                    | Verwenden Sie ein Harness, das ACP `models`/`session/set_model` bewirbt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls es ein eigenes Startflag hat. |
| Missing ACP metadata for bound session                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                             | Erstellen Sie sie mit `/acp spawn` neu und binden/fokussieren Sie dann den Thread erneut.                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Ausführungszugriffe in einer nicht interaktiven ACP-Sitzung.                       | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie den Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                             | Prüfen Sie die Gateway-Logs auf `AcpRuntimeError`. Für vollständige Berechtigungen setzen Sie `permissionMode=approve-all`; für graceful degradation setzen Sie `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Harness-Prozess wurde beendet, aber ACP-Sitzung hat keinen Abschluss gemeldet.                                         | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung entfernt beim Schließen und beim Gateway-Start veraltete, OpenClaw-eigene Wrapper- und Adapterprozesse.        |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interner Ereignis-Umschlag ist über die ACP-Grenze gelangt.                                                           | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten nur einfache Abschluss-Prompts erhalten.                             |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` gehört zum
nativen Codex-Hook-Relay, nicht zu ACP/acpx. Starten Sie in einem gebundenen
Codex-Chat eine frische Sitzung mit `/new` oder `/reset`; wenn dies einmal
funktioniert und dann beim nächsten nativen Tool-Aufruf erneut auftritt,
starten Sie den Codex-App-Server oder den OpenClaw Gateway neu, statt `/new`
zu wiederholen. Siehe [Fehlerbehebung zum Codex-Harness](/de/plugins/codex-harness#troubleshooting).
</Note>

## Verwandt

- [ACP-Agenten - Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
