---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Einrichten konversationsgebundener ACP-Sitzungen in Messaging-Kanälen
    - Verknüpfen einer Nachrichtenkanal-Konversation mit einer persistenten ACP-Sitzung
    - Fehlerbehebung für ACP-Backend, Plugin-Anbindung oder Zustellung von Abschlüssen
    - /acp-Befehle im Chat ausführen
sidebarTitle: ACP agents
summary: Führen Sie externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend aus
title: ACP-Agenten
x-i18n:
    generated_at: "2026-07-12T02:12:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen ermöglichen
OpenClaw, externe Coding-Harnesses (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses)
über ein ACP-Backend-Plugin auszuführen. Jeder Start wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das native
Codex-App-Server-Plugin verwaltet die `/codex ...`-Steuerung und die standardmäßige
eingebettete `openai/gpt-*`-Laufzeit für Agenteninteraktionen; ACP verwaltet die
`/acp ...`-Steuerung und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Damit Codex oder Claude Code sich als externer MCP-Client direkt mit
bestehenden OpenClaw-Kanalunterhaltungen verbinden kann, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) anstelle von ACP.
</Note>

## Welche Seite benötige ich?

| Sie möchten ...                                                                                           | Verwenden Sie                          | Hinweise                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                                   | `/codex bind`, `/codex threads`        | Nativer Codex-App-Server-Pfad bei aktiviertem `codex`-Plugin: gebundene Chatantworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Beenden und Steuern. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                            | An Chats gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerung                                                                  |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen                 | [`openclaw acp`](/de/cli/acp)             | Brückenmodus: Eine IDE/ein Client kommuniziert über stdio/WebSocket per ACP mit OpenClaw                                                                                                  |
| Eine lokale KI-CLI als reines Text-Fallback-Modell wiederverwenden                                       | [CLI-Backends](/de/gateway/cli-backends)  | Kein ACP: keine OpenClaw-Werkzeuge, keine ACP-Steuerung, keine Harness-Laufzeit                                                                                                           |

## Funktioniert dies ohne weitere Konfiguration?

Ja, nach der Installation des offiziellen ACP-Laufzeit-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Quellcode-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` aus, um die
Einsatzbereitschaft zu prüfen.

OpenClaw informiert Agenten nur dann über das Starten von ACP-Sitzungen, wenn ACP
**tatsächlich nutzbar** ist: ACP muss aktiviert sein, die Weiterleitung darf nicht
deaktiviert sein, die aktuelle Sitzung darf nicht durch die Sandbox blockiert
sein und ein Laufzeit-Backend muss geladen und fehlerfrei sein. Wenn eine dieser
Bedingungen nicht erfüllt ist, bleiben ACP-Skills und die ACP-Anleitung für
`sessions_spawn` verborgen, damit der Agent kein nicht verfügbares Backend
vorschlägt.

<AccordionGroup>
  <Accordion title="Fallstricke beim ersten Start">
    - Wenn `plugins.allow` festgelegt ist, handelt es sich um eine restriktive Plugin-Liste, die `acpx` **enthalten muss**. Andernfalls wird das installierte ACP-Backend absichtlich blockiert (`/acp doctor` meldet den fehlenden Eintrag in der Zulassungsliste).
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin ausgeliefert und nach Möglichkeit lokal gestartet.
    - Codex ACP wird mit einem isolierten `CODEX_HOME` ausgeführt. OpenClaw kopiert vertrauenswürdige Projektvertrauenseinträge sowie sichere Konfigurationen für die Modell-/Provider-Weiterleitung (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` und sichere `model_providers.<name>`-Felder) aus der Codex-Konfiguration des Hosts; Authentifizierung, Benachrichtigungen und Hooks verbleiben ausschließlich in der Hostkonfiguration.
    - Andere Adapter für Ziel-Harnesses können bei der ersten Verwendung bei Bedarf mit `npx` abgerufen werden.
    - Die Authentifizierung beim jeweiligen Hersteller muss für dieses Harness bereits auf dem Host eingerichtet sein.
    - Wenn der Host weder über npm noch über Netzwerkzugriff verfügt, schlagen Adapterabrufe beim ersten Start fehl, bis die Caches vorab gefüllt wurden oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Laufzeitvoraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw verwaltet
    Weiterleitung, Status der Hintergrundaufgaben, Zustellung, Bindungen und
    Richtlinien; das Harness verwaltet seine Provider-Anmeldung, seinen
    Modellkatalog, sein Dateisystemverhalten und seine nativen Werkzeuge.

    Bevor Sie OpenClaw als Ursache vermuten, prüfen Sie Folgendes:

    - `/acp doctor` meldet ein aktiviertes, fehlerfreies Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` zugelassen, wenn diese Zulassungsliste festgelegt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host gestartet werden.
    - Die Provider-Authentifizierung für dieses Harness ist vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell ist für dieses Harness verfügbar – Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` ist vorhanden und zugänglich; alternativ lassen Sie `cwd` weg, damit das Backend seinen Standardwert verwendet.
    - Der Berechtigungsmodus ist für die Aufgabe geeignet. Nicht interaktive Sitzungen können keine nativen Berechtigungsaufforderungen anklicken. Coding-Durchläufe mit vielen Schreib- oder Ausführungsvorgängen benötigen daher üblicherweise ein ACPX-Berechtigungsprofil, das ohne Benutzerinteraktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Werkzeuge und integrierte OpenClaw-Werkzeuge werden ACP-Harnesses
standardmäßig **nicht** zur Verfügung gestellt. Aktivieren Sie die expliziten
MCP-Brücken unter [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup) nur,
wenn das Harness diese Werkzeuge direkt aufrufen soll.

## Unterstützte Harness-Ziele

Verwenden Sie mit dem `acpx`-Backend die folgenden IDs als Ziele für
`/acp spawn <id>` oder
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID   | Typisches Backend                               | Hinweise                                                                                                 |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `claude`     | Claude-Code-ACP-Adapter                         | Erfordert eine Claude-Code-Authentifizierung auf dem Host.                                               |
| `codex`      | Codex-ACP-Adapter                               | Expliziter ACP-Fallback nur, wenn das native `/codex` nicht verfügbar ist oder ACP angefordert wurde.    |
| `copilot`    | GitHub-Copilot-ACP-Adapter                      | Erfordert eine Copilot-CLI-/Laufzeitauthentifizierung.                                                   |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)             | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bietet. |
| `droid`      | Factory Droid CLI                               | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung.               |
| `fast-agent` | fast-agent-mcp-ACP-Adapter                      | Wird bei Bedarf mit `uvx` abgerufen.                                                                     |
| `gemini`     | Gemini-CLI-ACP-Adapter                          | Erfordert eine Gemini-CLI-Authentifizierung oder die Einrichtung eines API-Schlüssels.                   |
| `iflow`      | iFlow CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                            |
| `kilocode`   | Kilo Code CLI                                   | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                            |
| `kimi`       | Kimi/Moonshot CLI                               | Erfordert eine Kimi-/Moonshot-Authentifizierung auf dem Host.                                            |
| `kiro`       | Kiro CLI                                        | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                            |
| `mux`        | Mux-CLI-ACP-Adapter                             | Wird bei Bedarf mit `npx` abgerufen.                                                                     |
| `opencode`   | OpenCode-ACP-Adapter                            | Erfordert eine OpenCode-CLI-/Provider-Authentifizierung.                                                 |
| `openclaw`   | OpenClaw-Gateway-Brücke über `openclaw acp`     | Ermöglicht einem ACP-fähigen Harness, mit einer OpenClaw-Gateway-Sitzung zu kommunizieren.                |
| `qoder`      | Qoder CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                            |
| `qwen`       | Qwen Code / Qwen CLI                            | Erfordert eine Qwen-kompatible Authentifizierung auf dem Host.                                           |
| `trae`       | Trae-CLI-ACP-Adapter                            | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                            |

`pi` (pi-acp) ist ebenfalls im acpx-Backend registriert, stellt jedoch nicht im
gleichen Sinne wie die oben aufgeführten Ziele ein Coding-Harness dar.

Benutzerdefinierte acpx-Agentenaliase können in acpx selbst konfiguriert werden,
die OpenClaw-Richtlinie prüft vor der Weiterleitung jedoch weiterhin
`acp.allowedAgents` und jede Zuordnung unter
`agents.list[].runtime.acp.agent`.

## Betriebshandbuch

Schneller `/acp`-Ablauf im Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im gebundenen Thread fort
    (oder geben Sie den Sitzungsschlüssel ausdrücklich als Ziel an).
  </Step>
  <Step title="Status prüfen">
    `/acp status`
  </Step>
  <Step title="Abstimmen">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steuern">
    Ohne den Kontext zu ersetzen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Beenden">
    `/acp cancel` (aktuelle Interaktion) oder `/acp close` (Sitzung und Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Details zum Lebenszyklus">
    - Beim Starten wird eine ACP-Laufzeitsitzung erstellt oder fortgesetzt, ACP-Metadaten werden im OpenClaw-Sitzungsspeicher erfasst und gegebenenfalls wird eine Hintergrundaufgabe erstellt, wenn der Durchlauf einer übergeordneten Aufgabe gehört.
    - ACP-Sitzungen im Besitz einer übergeordneten Aufgabe werden selbst dann als Hintergrundarbeit behandelt, wenn die Laufzeitsitzung persistent ist. Abschluss und oberflächenübergreifende Zustellung erfolgen über die Benachrichtigungsfunktion der übergeordneten Aufgabe, statt wie bei einer gewöhnlichen benutzerseitigen Chatsitzung.
    - Die Aufgabenverwaltung schließt beendete oder verwaiste einmalige ACP-Sitzungen im Besitz einer übergeordneten Aufgabe. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Unterhaltungsbindung besteht. Veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht unbemerkt fortgesetzt werden können, nachdem die zugehörige Aufgabe beendet oder ihr Aufgabeneintrag entfernt wurde.
    - Gebundene Folgenachrichten werden direkt an die ACP-Sitzung gesendet, bis die Bindung geschlossen, deaktiviert, zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als gewöhnlicher Prompttext an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht die aktive Interaktion ab, wenn das Backend den Abbruch unterstützt; die Bindung oder die Sitzungsmetadaten werden dadurch nicht gelöscht.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seinen eigenen vorgelagerten Verlauf weiterhin aufbewahren, wenn es die Fortsetzung unterstützt.
    - Das acpx-Plugin bereinigt nach `close` OpenClaw-eigene Wrapper- und Adapter-Prozessbäume und entfernt beim Start des Gateway veraltete, OpenClaw-eigene ACPX-Waisenprozesse.
    - Inaktive Laufzeit-Worker können nach `acp.runtime.ttlMinutes` bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Weiterleitungsregeln">
    Natürlichsprachige Auslöser, die bei aktiviertem Plugin an das
    **native Codex-Plugin** weitergeleitet werden sollen:

    - „Diesen Discord-Kanal an Codex binden.“
    - „Diesen Chat mit dem Codex-Thread `<id>` verbinden.“
    - „Codex-Threads anzeigen und anschließend diesen binden.“

    Die native Codex-Konversationsbindung ist der standardmäßige Pfad für die Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während Codex-native
    Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden. Für Codex-native
    Tool-Ereignisse fügt OpenClaw pro Durchlauf ein natives Hook-Relay ein, damit Plugin-Hooks
    `before_tool_call` blockieren, `after_tool_call` beobachten und Codex-
    `PermissionRequest`-Ereignisse über OpenClaw-Genehmigungen weiterleiten können. Codex-`Stop`-Hooks
    werden an OpenClaw `before_agent_finalize` weitergeleitet, wo Plugins
    einen weiteren Modelldurchlauf anfordern können, bevor Codex seine Antwort abschließt. Das Relay bleibt
    bewusst konservativ: Es verändert weder Argumente Codex-nativer Tools
    noch schreibt es Codex-Thread-Datensätze um. Verwenden Sie ACP nur dann ausdrücklich, wenn Sie das
    ACP-Laufzeit-/Sitzungsmodell wünschen. Die Unterstützungsgrenze für eingebettetes Codex ist im
    [Supportvertrag für Codex Harness v1](/de/plugins/codex-harness-runtime#v1-support-contract)
    dokumentiert.

  </Accordion>
  <Accordion title="Kurzübersicht zur Auswahl von Modell, Provider und Laufzeit">
    - veraltete Codex-Modellreferenzen – veraltete Codex-OAuth-/Abonnement-Modellroute, die von Doctor repariert wird.
    - `openai/*` – eingebettete Laufzeit des nativen Codex-App-Servers für OpenAI-Agentendurchläufe.
    - `/codex ...` – native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` – explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Auslöser für das ACP-Routing">
    Auslöser, die an die ACP-Laufzeit weiterleiten sollten:

    - „Führen Sie dies als einmalige Claude-Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen.“
    - „Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und führen Sie anschließend weitere Nachrichten im selben Thread fort.“
    - „Führen Sie Codex über ACP in einem Hintergrund-Thread aus.“

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf, bindet die Sitzung
    sofern unterstützt an die aktuelle Konversation oder den aktuellen Thread und leitet weitere Nachrichten
    bis zum Schließen oder Ablauf an diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn
    ACP/acpx explizit angegeben ist oder das native Codex-Plugin für den
    angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angeboten, wenn ACP
    aktiviert ist, der Anfordernde nicht in einer Sandbox ausgeführt wird und ein ACP-Laufzeit-Backend
    geladen ist. `acp.dispatch.enabled=false` pausiert die automatische ACP-Thread-Weiterleitung,
    blendet explizite Aufrufe von `sessions_spawn({ runtime: "acp" })`
    jedoch weder aus noch blockiert sie. Als Ziele dienen ACP-Harness-IDs wie `codex`, `claude`, `droid`,
    `gemini` oder `opencode`. Übergeben Sie keine normale OpenClaw-Konfigurations-Agenten-ID
    aus `agents_list`, es sei denn, dieser Eintrag ist ausdrücklich mit
    `agents.list[].runtime.type="acp"` konfiguriert; verwenden Sie andernfalls die standardmäßige
    Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent mit
    `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw `runtime.acp.agent` als zugrunde liegende
    Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit benötigen. Verwenden Sie den **nativen Codex-
App-Server** für die Bindung und Steuerung von Codex-Konversationen, wenn das `codex`-Plugin
aktiviert ist. Verwenden Sie **Sub-Agenten**, wenn Sie von OpenClaw nativ delegierte Durchläufe wünschen.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Durchlauf                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | Native OpenClaw-Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Erzeugungs-Tool | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agenten](/de/tools/subagents).

## So führt ACP Claude Code aus

Für Claude Code über ACP besteht der Stack aus:

1. OpenClaw-ACP-Steuerungsebene für Sitzungen.
2. Offiziellem Laufzeit-Plugin `@openclaw/acpx`.
3. Claude-ACP-Adapter.
4. Claude-seitiger Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerungen, Sitzungsfortsetzung,
Verfolgung von Hintergrundaufgaben und optionaler Bindung an Konversationen oder Threads.

CLI-Backends sind separate, ausschließlich textbasierte lokale Rückfalllaufzeiten – siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch folgende Regel:

- **Benötigen Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Benötigen Sie einen einfachen lokalen Text-Rückfall über die unverarbeitete CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** – der Ort, an dem Personen weiterkommunizieren (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** – der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/untergeordnetes Thema** – eine optionale zusätzliche Nachrichtenoberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Arbeitsbereich** – der Dateisystempfad (`cwd`, Repository-Checkout, Backend-Arbeitsbereich), in dem das Harness ausgeführt wird. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` bindet die aktuelle Konversation an die
erzeugte ACP-Sitzung – kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
die Kontrolle über Transport, Authentifizierung, Sicherheit und Zustellung. Weitere Nachrichten in dieser
Konversation werden an dieselbe Sitzung weitergeleitet; `/new` und `/reset` setzen die Sitzung
an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, zukünftige Nachrichten hierher weiterleiten
/codex model gpt-5.4                                     # den gebundenen nativen Codex-Thread abstimmen
/codex stop                                              # den aktiven nativen Codex-Durchlauf steuern
/acp spawn codex --bind here                             # expliziter ACP-Rückfall für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein untergeordnetes Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # dieselbe Chat-Bindung, Codex wird in /workspace/repo ausgeführt
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Ausschließlichkeit">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur bei Kanälen, die Bindungen an die aktuelle Konversation anbieten; andernfalls gibt OpenClaw eine eindeutige Meldung aus, dass dies nicht unterstützt wird. Bindungen bleiben über Gateway-Neustarts hinweg erhalten.
    - Bei Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` – nicht für `--bind here`.
    - Wenn Sie ohne `--cwd` eine Sitzung für einen anderen ACP-Agenten erzeugen, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Zielagenten**. Fehlende übernommene Pfade (`ENOENT`/`ENOTDIR`) fallen auf die Backend-Standardeinstellung zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Erzeugungsfehler ausgegeben.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal – `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler nachfolgender Text an die gebundene ACP-Sitzung weitergeleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, sofern die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="An Threads gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
    - Weitere Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
    - ACP-Ausgaben werden an denselben Thread zurückgesendet.
    - Aufheben des Fokus, Schließen, Archivieren, Überschreiten des Inaktivitätszeitlimits oder Ablauf des Höchstalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Funktionsschalter für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie es auf `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite Aufrufe von `sessions_spawn({ runtime: "acp" })` funktionieren weiterhin).
    - Das Erzeugen von Thread-Sitzungen durch den Kanaladapter ist aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanaladapter
    keine Thread-Bindungen unterstützt, gibt OpenClaw eine eindeutige Meldung aus,
    dass die Funktion nicht unterstützt wird oder nicht verfügbar ist.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der die Fähigkeit zur Sitzungs-/Thread-Bindung bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forenthemen in Gruppen/Supergruppen und Direktnachrichten-Themen).
    - Plugin-Kanäle können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Konfigurieren Sie für nicht kurzlebige Arbeitsabläufe persistente ACP-Bindungen in
`bindings[]`-Einträgen auf oberster Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Kennzeichnet eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalspezifische Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/-Direktnachricht:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen erfassen auch Antworten innerhalb der Threads dieses Kanals.
- **Telegram-Forenthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-Direktnachricht/-Gruppe:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Verwenden Sie für direkte Chats E.164-Nummern wie `+15555550123` und für Gruppen WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us`.
- **iMessage-Direktnachricht/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des zuständigen OpenClaw-Agenten.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionale betreiberseitige Bezeichnung.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Laufzeit-Standardeinstellungen pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standardeinstellungen einmal pro Agent festzulegen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Überschreibungsrangfolge für gebundene ACP-Sitzungen:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globale ACP-Standardeinstellungen (z. B. `acp.backend`)

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

- OpenClaw stellt nach der kanalspezifischen Zulassung und vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung vorhanden ist.
- Nachrichten in diesem Kanal, Thema oder Chat werden an die konfigurierte ACP-Sitzung weitergeleitet.
- Konfigurierte ACP-Bindungen sind für ihre Sitzungsroute zuständig. Die Auffächerung von Kanalübertragungen ersetzt bei einer übereinstimmenden Bindung nicht die konfigurierte ACP-Sitzung.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Laufzeitbindungen, die beispielsweise durch Abläufe zur Thread-Fokussierung erstellt wurden, gelten weiterhin, sofern sie vorhanden sind.
- Bei agentenübergreifenden ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Ziel-Agenten aus der Agentenkonfiguration.
- Fehlende übernommene Arbeitsbereichspfade greifen auf das Standardarbeitsverzeichnis des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Startfehler ausgegeben.

## ACP-Sitzungen starten

Es gibt zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Über sessions_spawn">
    Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agentendurchlauf oder
    Werkzeugaufruf zu starten.

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
    `runtime` verwendet standardmäßig `subagent`. Legen Sie daher für
    ACP-Sitzungen ausdrücklich `runtime: "acp"` fest. Wenn `agentId` weggelassen wird, verwendet OpenClaw
    das konfigurierte `acp.defaultAgent`. `mode: "session"` erfordert `thread: true`, damit eine
    dauerhafte gebundene Unterhaltung erhalten bleibt.
    </Note>

  </Tab>
  <Tab title="Über den Befehl /acp">
    Verwenden Sie `/acp spawn` für die explizite Steuerung durch Bedienpersonal im Chat.

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

### Parameter von `sessions_spawn`

<ParamField path="task" type="string" required>
  An die ACP-Sitzung gesendete anfängliche Eingabeaufforderung.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Muss für ACP-Sitzungen `"acp"` sein.
</ParamField>
<ParamField path="agentId" type="string">
  ID der ACP-Zielumgebung. Greift auf `acp.defaultAgent` zurück, sofern festgelegt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Ablauf zur Thread-Bindung an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig, `"session"` ist dauerhaft. Wenn `thread: true` festgelegt und
  `mode` weggelassen wird, kann OpenClaw abhängig vom Laufzeitpfad standardmäßig dauerhaftes Verhalten
  verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Arbeitsverzeichnis der Laufzeit, das anhand der Backend- bzw. Laufzeitrichtlinie validiert wird.
  Wenn es weggelassen wird, übernimmt der ACP-Start den Arbeitsbereich des Ziel-Agenten, sofern konfiguriert;
  fehlende übernommene Pfade greifen auf die Backend-Standardwerte zurück, während tatsächliche
  Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Für Bedienpersonal sichtbare Bezeichnung, die im Sitzungs- bzw. Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, statt eine neue zu erstellen. Der Agent
  spielt den Unterhaltungsverlauf über `session/load` erneut ein. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Fortschrittszusammenfassungen des anfänglichen ACP-Durchlaufs als Systemereignisse
  an die anfordernde Sitzung zurück. Akzeptierte Antworten enthalten unter anderem `streamLogPath`,
  das auf ein sitzungsspezifisches JSONL-Protokoll (`<sessionId>.acp-stream.jsonl`) verweist, das Sie
  für den vollständigen Weiterleitungsverlauf verfolgen können. Übergeordnete Fortschrittsstreams zeigen standardmäßig
  Kommentare des Assistenten und ACP-Statusfortschritte, sofern nicht
  `streaming.progress.commentary=false` festgelegt ist. Discord verwendet für Vorschauen in der übergeordneten Sitzung
  ebenfalls standardmäßig den Fortschrittsmodus, wenn kein Streammodus konfiguriert ist. Der Statusfortschritt
  berücksichtigt weiterhin `acp.stream.tagVisibility`, sodass Tags wie `plan`
  verborgen bleiben, sofern sie nicht ausdrücklich aktiviert wurden.
</ParamField>

ACP-Durchläufe mit `sessions_spawn` verwenden `agents.defaults.subagents.runTimeoutSeconds`
als standardmäßige Begrenzung für untergeordnete Durchläufe. Das Werkzeug akzeptiert keine
aufrufspezifischen Zeitüberschreibungen (`runTimeoutSeconds`/`timeoutSeconds` werden mit einem
Fehler abgelehnt, der zur Konfiguration des Standardwerts auffordert).

<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die untergeordnete ACP-Sitzung. Codex-ACP-Starts
  normalisieren OpenAI-Referenzen wie `openai/gpt-5.4` vor `session/new` in die
  Startkonfiguration von Codex ACP; Schreibweisen mit Schrägstrich wie `openai/gpt-5.4/high` legen außerdem
  den Reasoning-Aufwand von Codex ACP fest. Wenn der Wert weggelassen wird, verwendet `sessions_spawn({ runtime: "acp" })`
  vorhandene Modellstandardwerte für Unteragenten (`agents.defaults.subagents.model` oder
  `agents.list[].subagents.model`), sofern konfiguriert; andernfalls verwendet die ACP-Umgebung
  ihr eigenes Standardmodell. Andere Umgebungen müssen ACP-`models` bekannt geben und
  `session/set_model` unterstützen; andernfalls schlagen OpenClaw/acpx eindeutig fehl,
  statt unbemerkt auf den Standardwert des Ziel-Agenten zurückzugreifen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` einem niedrigen
  Aufwand zugeordnet, `low`/`medium`/`high`/`xhigh` werden direkt zugeordnet und bei `off` wird die
  Startüberschreibung für den Reasoning-Aufwand weggelassen. Wenn der Wert weggelassen wird, verwenden ACP-Starts vorhandene
  Denkstandardwerte für Unteragenten sowie
  `agents.defaults.models["provider/model"].params.thinking` für das ausgewählte
  Modell.
</ParamField>

## Bindungs- und Threadmodi beim Start

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                                      |
    | ------ | ------------------------------------------------------------------------------ |
    | `here` | Bindet die aktuell aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                          |

    Hinweise:

    - `--bind here` ist der einfachste Pfad für Bedienpersonal, um „diesen Kanal oder Chat durch Codex zu unterstützen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur für Kanäle verfügbar, die Bindungen der aktuellen Unterhaltung unterstützen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                                             |
    | ------ | --------------------------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet einen untergeordneten Thread, sofern unterstützt. |
    | `here` | Erfordert den aktuell aktiven Thread; schlägt fehl, wenn Sie sich in keinem befinden.                                |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                                         |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung entspricht das Standardverhalten praktisch `off`.
    - Ein an einen Thread gebundener Start erfordert die Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder im Besitz der übergeordneten Sitzung befindliche Hintergrundarbeit
sein. Der Zustellungspfad hängt von dieser Ausprägung ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind für fortlaufende Unterhaltungen auf einer sichtbaren Chatoberfläche vorgesehen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread bzw. ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten übereinstimmende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die ACP-
    Sitzung weitergeleitet, und ACP-Ausgaben werden an denselben
    Kanal/Thread/dasselbe Thema zurückgesendet.

    Was OpenClaw an die Umgebung sendet:

    - Normale gebundene Folgenachrichten werden als Eingabeaufforderungstext gesendet, ergänzt um Anhänge, sofern die Umgebung bzw. das Backend diese unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Von der Laufzeit erzeugte Abschlussereignisse werden für jedes Ziel materialisiert. OpenClaw-Agenten erhalten die interne Laufzeitkontext-Hülle von OpenClaw; externe ACP-Umgebungen erhalten eine einfache Eingabeaufforderung mit dem Ergebnis des untergeordneten Prozesses und einer Anweisung. Die rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Hülle darf niemals an externe Umgebungen gesendet oder als Text eines ACP-Benutzertranskripts gespeichert werden.
    - ACP-Transkripteinträge verwenden den für Benutzer sichtbaren Auslösertext oder die einfache Abschluss-Eingabeaufforderung. Interne Ereignismetadaten bleiben nach Möglichkeit in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chatinhalt behandelt.

  </Accordion>
  <Accordion title="Im Besitz der übergeordneten Sitzung befindliche einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agentendurchlauf gestartet werden, sind untergeordnete
    Hintergrundprozesse, ähnlich wie Unteragenten:

    - Die übergeordnete Sitzung fordert mit `sessions_spawn({ runtime: "acp", mode: "run" })` Arbeit an.
    - Der untergeordnete Prozess wird in einer eigenen ACP-Umgebungssitzung ausgeführt.
    - Untergeordnete Durchläufe werden in derselben Hintergrundspur ausgeführt, die auch für native Unteragentenstarts verwendet wird, sodass eine langsame ACP-Umgebung nicht die nicht zusammenhängende Arbeit der Hauptsitzung blockiert.
    - Der Abschluss wird über den Ankündigungspfad für Aufgabenabschlüsse zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in eine einfache ACP-Eingabeaufforderung um, bevor sie an eine externe Umgebung gesendet werden, sodass Umgebungen keine ausschließlich OpenClaw-internen Laufzeitkontextmarkierungen sehen.
    - Die übergeordnete Sitzung formuliert das Ergebnis des untergeordneten Prozesses in normaler Assistentensprache neu, wenn eine für Benutzer sichtbare Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem und
    untergeordnetem Prozess. Der untergeordnete Prozess verfügt bereits über einen Abschlusskanal zurück zur übergeordneten Sitzung.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Start eine andere Sitzung ansprechen. Für normale Peer-
    Sitzungen verwendet OpenClaw nach dem Einspeisen der Nachricht einen
    Agent-zu-Agent-Folgepfad (A2A):

    - Auf die Antwort der Zielsitzung warten.
    - Optional der anfordernden Sitzung und der Zielsitzung den Austausch einer begrenzten Anzahl von Folgedurchläufen ermöglichen.
    - Die Zielsitzung auffordern, eine Ankündigungsnachricht zu erzeugen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Übertragungen zwischen Peers, bei denen der Absender eine
    sichtbare Rückmeldung benötigt. Er bleibt aktiviert, wenn eine nicht zugehörige Sitzung ein ACP-Ziel sehen und
    ihm Nachrichten senden kann, beispielsweise bei weit gefassten Einstellungen für `tools.sessions.visibility`.

    OpenClaw überspringt die A2A-Rückmeldung nur, wenn der Anfragende der übergeordneten Sitzung seines
    eigenen, von dieser übergeordneten Sitzung verwalteten einmaligen ACP-Kindprozesses entspricht. In diesem Fall kann die Ausführung von A2A zusätzlich
    zum Aufgabenabschluss die übergeordnete Sitzung mit dem Ergebnis des Kindprozesses aktivieren, die Antwort
    der übergeordneten Sitzung an den Kindprozess zurückleiten und eine Echo-
    Schleife zwischen übergeordneter Sitzung und Kindprozess erzeugen. Das Ergebnis von `sessions_send` meldet
    für diesen Fall eines verwalteten Kindprozesses `delivery.status="skipped"`, da der Abschlusspfad bereits
    für das Ergebnis verantwortlich ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, anstatt
    eine neue zu starten. Der Agent spielt seinen Gesprächsverlauf über
    `session/load` erneut ein und setzt daher mit dem vollständigen bisherigen Kontext fort.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übergeben Sie eine Codex-Sitzung von Ihrem Laptop an Ihr Telefon – weisen Sie Ihren Agenten an, dort fortzufahren, wo Sie aufgehört haben.
    - Setzen Sie eine Programmiersitzung, die Sie interaktiv in der CLI begonnen haben, nun ohne Benutzeroberfläche über Ihren Agenten fort.
    - Nehmen Sie Arbeiten wieder auf, die durch einen Neustart des Gateway oder eine Zeitüberschreitung wegen Inaktivität unterbrochen wurden.

    Hinweise:

    - `resumeSessionId` gilt nur bei `runtime: "acp"`; die standardmäßige Subagent-Laufzeitumgebung ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `streamTo` gilt nur bei `runtime: "acp"`; die standardmäßige Subagent-Laufzeitumgebung ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `resumeSessionId` ist eine hostlokale Fortsetzungs-ID für ACP bzw. das Testsystem und kein OpenClaw-Sitzungsschlüssel eines Kanals; OpenClaw prüft vor der Weiterleitung weiterhin die ACP-Startregeln und die Richtlinie des Ziel-Agenten, während das ACP-Backend oder das Testsystem für die Autorisierung zum Laden dieser vorgelagerten ID zuständig ist.
    - `resumeSessionId` stellt den vorgelagerten ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin wie gewohnt für die neue OpenClaw-Sitzung, die Sie erstellen. Daher erfordert `mode: "session"` weiterhin `thread: true`.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code unterstützen dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Start mit einer eindeutigen Fehlermeldung fehl – es erfolgt kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach der Bereitstellung">
    Führen Sie nach der Bereitstellung eines Gateway eine vollständige Live-Prüfung durch, anstatt sich auf
    Unit-Tests zu verlassen:

    1. Überprüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem aktiven Agenten.
    3. Weisen Sie diesen Agenten an, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Überprüfen Sie `accepted=yes`, einen echten `childSessionKey` und das Ausbleiben eines Validierungsfehlers.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Beschränken Sie diese Prüfung auf `mode: "run"` und lassen Sie `streamTo: "parent"` aus –
    an Threads gebundene Pfade mit `mode: "session"` und Stream-Weiterleitung sind separate, umfangreichere
    Integrationsprüfungen.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen werden derzeit in der Laufzeitumgebung des Hosts ausgeführt, **nicht** innerhalb der OpenClaw-
Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Testsystem kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen und schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Testsystems **nicht**.
- OpenClaw erzwingt weiterhin ACP-Funktionsfreigaben, zulässige Agenten, Sitzungseigentum, Kanalbindungen und die Zustellungsrichtlinie des Gateway.
- Verwenden Sie `runtime: "subagent"` für native OpenClaw-Arbeiten mit erzwungener Sandbox.

</Warning>

Derzeitige Einschränkungen:

- Wenn die anfragende Sitzung in einer Sandbox ausgeführt wird, werden ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung des Sitzungsziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann die Bezeichnung
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung bzw. dieser Thread an eine ACP-Sitzung gebunden ist).
3. Fallback auf die aktuelle anfragende Sitzung.

Sowohl Bindungen der aktuellen Unterhaltung als auch Thread-Bindungen werden in Schritt 2 berücksichtigt.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen eindeutigen Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerung

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Durchlauf für die Zielsitzung abbrechen.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an die laufende Sitzung senden.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Bindungen von Thread-Zielen lösen.  | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Laufzeitoptionen und Funktionen anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeitkonfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeitarbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Zeitüberschreitung in Sekunden festlegen.        | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Laufzeitoptionen für die Sitzung entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Kürzlich gespeicherte ACP-Sitzungen auflisten.            | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Funktionen und umsetzbare Korrekturen anzeigen. | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

Laufzeitsteuerungen (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` und `reset-options`) erfordern
bei externen Kanälen die Identität des Eigentümers und bei internen
Gateway-Clients `operator.admin`. Autorisierte Absender, die nicht Eigentümer sind, können weiterhin `sessions`,
`doctor`, `install` und `help` verwenden.

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen
auf Laufzeit- und Backend-Ebene. Fehler wegen nicht unterstützter Steuerungsfunktionen werden
eindeutig angezeigt, wenn einem Backend eine Funktion fehlt. `/acp sessions` liest den Speicher
für die aktuell gebundene oder anfragende Sitzung; Ziel-Token (`session-key`,
`session-id` oder `session-label`) werden über die Sitzungserkennung des Gateway aufgelöst,
einschließlich benutzerdefinierter `session.store`-Stammverzeichnisse je Agent.

### Zuordnung von Laufzeitoptionen

`/acp` bietet Komfortbefehle und eine generische Festlegungsfunktion. Gleichwertige Operationen:

| Befehl                       | Entspricht                           | Hinweise                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Laufzeitkonfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai/<model>` zur Modell-ID des Adapters und ordnet mit Schrägstrich angehängte Suffixe für den Denkaufwand, etwa `openai/gpt-5.4/high`, `reasoning_effort` zu.       |
| `/acp set thinking <level>`  | kanonische Option `thinking`         | OpenClaw sendet, sofern vorhanden, das vom Backend angegebene Äquivalent und bevorzugt dabei `thinking`, dann `effort`, `reasoning_effort` oder `thought_level`. Für Codex ACP ordnet der Adapter die Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet, sofern vorhanden, das vom Backend angegebene Äquivalent, beispielsweise `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                    |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`   | OpenClaw sendet, sofern vorhanden, das vom Backend angegebene Äquivalent, beispielsweise `timeout` oder `timeout_seconds`.                                                                                  |
| `/acp cwd <path>`            | Überschreibung des Laufzeitarbeitsverzeichnisses | Direkte Aktualisierung.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den Pfad zur Überschreibung des Arbeitsverzeichnisses.                                                                                                                                 |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen | -                                                                                                                                                                                                          |

## acpx-Testsystem, Plugin-Einrichtung und Berechtigungen

Informationen zur Konfiguration des acpx-Testsystems (Aliase für Claude Code / Codex / Gemini CLI),
zu den MCP-Bridges der Plugin-Tools und OpenClaw-Tools sowie zu den ACP-Berechtigungsmodi
finden Sie unter [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                                   | Wahrscheinliche Ursache                                                                                                           | Behebung                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.                                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Positivliste festgelegt ist, und führen Sie anschließend `/acp doctor` aus.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP ist global deaktiviert.                                                                                                 | Setzen Sie `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Die automatische Weiterleitung normaler Thread-Nachrichten ist deaktiviert.                                                               | Setzen Sie `acp.dispatch.enabled=true`, um die automatische Thread-Weiterleitung wieder zu aktivieren; explizite Aufrufe von `sessions_spawn({ runtime: "acp" })` funktionieren weiterhin.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Der Agent befindet sich nicht in der Positivliste.                                                                                                | Verwenden Sie eine zulässige `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                               | Das Backend-Plugin fehlt, ist deaktiviert, durch eine Zulassungs-/Ablehnungsrichtlinie blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar.        | Installieren bzw. aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und untersuchen Sie den Installations- oder Richtlinienfehler des Backends, falls es weiterhin nicht funktionsfähig ist.                                           |
| Harness-Befehl nicht gefunden                                                                 | Die Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erstmalige Abruf über `npx` ist bei einem Adapter außer Codex fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren bzw. initialisieren Sie den Adapter vorab auf dem Gateway-Host oder konfigurieren Sie den Befehl des acpx-Agenten explizit.                                                      |
| Meldung „Modell nicht gefunden“ vom Harness                                                          | Die Modell-ID ist für einen anderen Provider bzw. ein anderes Harness gültig, jedoch nicht für dieses ACP-Ziel.                                                | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                                            |
| Authentifizierungsfehler des Anbieters vom Harness                                                        | OpenClaw funktioniert ordnungsgemäß, aber die Ziel-CLI bzw. der Provider ist nicht angemeldet.                                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Umgebung des Gateway-Hosts bereit.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Ungültiges Schlüssel-, ID- oder Bezeichner-Token.                                                                                                | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel bzw. Bezeichner und versuchen Sie es erneut.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` wurde ohne aktive bindungsfähige Konversation verwendet.                                                            | Wechseln Sie zum Ziel-Chat bzw. -Kanal und versuchen Sie es erneut oder starten Sie eine Sitzung ohne Bindung.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Dem Adapter fehlt die ACP-Fähigkeit zur Bindung an die aktuelle Konversation.                                                             | Verwenden Sie, sofern unterstützt, `/acp spawn ... --thread ...`, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                                         | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Ein anderer Benutzer besitzt das aktive Bindungsziel.                                                                           | Nehmen Sie die erneute Bindung als Eigentümer vor oder verwenden Sie eine andere Konversation bzw. einen anderen Thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Dem Adapter fehlt die Fähigkeit zur Thread-Bindung.                                                                               | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter bzw. Kanal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Die ACP-Laufzeit wird hostseitig ausgeführt; die anfragende Sitzung läuft in einer Sandbox.                                                              | Verwenden Sie in Sandbox-Sitzungen `runtime="subagent"` oder starten Sie ACP aus einer Sitzung, die nicht in einer Sandbox ausgeführt wird.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Für die ACP-Laufzeit wurde `sandbox="require"` angefordert.                                                                         | Verwenden Sie `runtime="subagent"`, wenn eine Sandbox zwingend erforderlich ist, oder verwenden Sie ACP mit `sandbox="inherit"` aus einer Sitzung, die nicht in einer Sandbox ausgeführt wird.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Das Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.                                                        | Verwenden Sie ein Harness, das ACP-`models` bzw. `session/set_model` bereitstellt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, sofern dieses über ein eigenes Start-Flag verfügt. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                                    | Veraltete oder gelöschte ACP-Sitzungsmetadaten.                                                                                    | Erstellen Sie die Sitzung mit `/acp spawn` neu und binden bzw. fokussieren Sie anschließend den Thread erneut.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blockiert Schreibvorgänge bzw. Befehlsausführungen in einer nicht interaktiven ACP-Sitzung.                                                    | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie den Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt frühzeitig und mit geringer Ausgabe fehl                                                | Berechtigungsabfragen werden durch `permissionMode` bzw. `nonInteractivePermissions` blockiert.                                        | Prüfen Sie die Gateway-Protokolle auf `AcpRuntimeError`. Setzen Sie für vollständige Berechtigungen `permissionMode=approve-all`; setzen Sie für eine kontrollierte Einschränkung `nonInteractivePermissions=deny`.        |
| ACP-Sitzung bleibt nach Abschluss der Arbeit unbegrenzt hängen                                     | Der Harness-Prozess wurde beendet, aber die ACP-Sitzung hat keinen Abschluss gemeldet.                                                    | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung beendet beim Schließen und beim Start des Gateways veraltete Wrapper- und Adapterprozesse, die OpenClaw gehören.                                             |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Die interne Ereignishülle ist über die ACP-Grenze hinweg durchgesickert.                                                                | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten ausschließlich reine Abschlussaufforderungen erhalten.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` gehört zur
nativen Codex-Hook-Weiterleitung, nicht zu ACP/acpx. Starten Sie in einem gebundenen
Codex-Chat mit `/new` oder `/reset` eine neue Sitzung. Wenn dies einmal funktioniert
und der Fehler beim nächsten nativen Werkzeugaufruf erneut auftritt, starten Sie
statt einer erneuten Ausführung von `/new` den Codex-App-Server oder den OpenClaw
Gateway neu. Siehe
[Fehlerbehebung für das Codex-Harness](/de/plugins/codex-harness#troubleshooting).
</Note>

## Verwandte Themen

- [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup)
- [Agentenversand](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Werkzeuge](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Brückenmodus)](/de/cli/acp)
- [Unteragenten](/de/tools/subagents)
