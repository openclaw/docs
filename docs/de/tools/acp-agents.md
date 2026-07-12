---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Einrichten konversationsgebundener ACP-Sitzungen in Messaging-Kanälen
    - Eine Unterhaltung in einem Nachrichtenkanal an eine persistente ACP-Sitzung binden
    - Fehlerbehebung für ACP-Backend, Plugin-Anbindung oder Abschlusszustellung
    - /acp-Befehle aus dem Chat heraus verwenden
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-07-12T15:55:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen ermöglichen es
OpenClaw, externe Coding-Harnesses (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses)
über ein ACP-Backend-Plugin auszuführen. Jeder Start wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das native
Codex-App-Server-Plugin verwaltet die `/codex ...`-Steuerung und die standardmäßige
eingebettete `openai/gpt-*`-Runtime für Agentendurchläufe; ACP verwaltet die `/acp ...`-Steuerung
und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Damit Codex oder Claude Code als externer MCP-Client eine direkte Verbindung zu
bestehenden OpenClaw-Channel-Konversationen herstellen kann, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) anstelle von ACP.
</Note>

## Welche Seite benötige ich?

| Sie möchten ...                                                                                       | Verwenden Sie                          | Hinweise                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex in der aktuellen Konversation binden oder steuern                                               | `/codex bind`, `/codex threads`        | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist: gebundene Chat-Antworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Stoppen und Steuern. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                            | An Chats gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerung                                                                    |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen             | [`openclaw acp`](/de/cli/acp)             | Bridge-Modus: Eine IDE/ein Client kommuniziert über stdio/WebSocket per ACP mit OpenClaw                                                                                                   |
| Eine lokale KI-CLI als reines Text-Fallback-Modell wiederverwenden                                    | [CLI-Backends](/de/gateway/cli-backends)  | Kein ACP: keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Runtime                                                                                                                  |

## Funktioniert dies ohne weitere Konfiguration?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Quellcode-Checkouts können nach `pnpm install` das lokale Workspace-Plugin
`extensions/acpx` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über das Starten via ACP, wenn ACP **tatsächlich verwendbar** ist:
ACP muss aktiviert sein, der Dispatch darf nicht deaktiviert sein, die aktuelle Sitzung darf
nicht durch die Sandbox blockiert sein und ein Runtime-Backend muss geladen und funktionsfähig sein. Wenn
eine Bedingung nicht erfüllt ist, bleiben ACP-Skills und die ACP-Anleitung für `sessions_spawn` verborgen,
damit der Agent kein nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Stolperfallen beim ersten Start">
    - Wenn `plugins.allow` festgelegt ist, handelt es sich um ein restriktives Plugin-Inventar, das `acpx` **enthalten muss**. Andernfalls wird das installierte ACP-Backend absichtlich blockiert (`/acp doctor` meldet den fehlenden Allowlist-Eintrag).
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin ausgeliefert und startet nach Möglichkeit lokal.
    - Codex ACP wird mit einem isolierten `CODEX_HOME` ausgeführt. OpenClaw kopiert vertrauenswürdige Projekt-Vertrauenseinträge sowie sichere Konfiguration für die Modell-/Provider-Weiterleitung (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` und sichere `model_providers.<name>`-Felder) aus der Codex-Konfiguration des Hosts; Authentifizierung, Benachrichtigungen und Hooks verbleiben ausschließlich in der Host-Konfiguration.
    - Andere Adapter für Ziel-Harnesses können bei der ersten Verwendung bei Bedarf mit `npx` abgerufen werden.
    - Die Anbieterauthentifizierung für dieses Harness muss bereits auf dem Host vorhanden sein.
    - Wenn der Host keinen npm- oder Netzwerkzugriff hat, schlagen Adapterabrufe beim ersten Start fehl, bis die Caches vorab befüllt wurden oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw verwaltet Weiterleitung,
    den Status der Hintergrundaufgabe, Zustellung, Bindungen und Richtlinien; das Harness verwaltet
    seine Provider-Anmeldung, seinen Modellkatalog, sein Dateisystemverhalten und seine nativen Tools.

    Bevor Sie OpenClaw als Ursache ansehen, überprüfen Sie Folgendes:

    - `/acp doctor` meldet ein aktiviertes, funktionsfähiges Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` zugelassen, wenn diese Allowlist festgelegt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host gestartet werden.
    - Die Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell ist für dieses Harness vorhanden – Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` ist vorhanden und zugänglich. Alternativ lassen Sie `cwd` weg, damit das Backend seinen Standardwert verwendet.
    - Der Berechtigungsmodus entspricht der Arbeit. Nicht interaktive Sitzungen können native Berechtigungsabfragen nicht anklicken. Daher benötigen Coding-Durchläufe mit vielen Schreib- oder Ausführungsvorgängen üblicherweise ein ACPX-Berechtigungsprofil, das ohne Benutzerinteraktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses
standardmäßig **nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges unter
[ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Verwenden Sie mit dem `acpx`-Backend diese IDs als Ziele für `/acp spawn <id>` oder
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-ID   | Typisches Backend                               | Hinweise                                                                                             |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `claude`     | Claude-Code-ACP-Adapter                         | Erfordert Claude-Code-Authentifizierung auf dem Host.                                                |
| `codex`      | Codex-ACP-Adapter                               | Nur expliziter ACP-Fallback, wenn das native `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`    | GitHub-Copilot-ACP-Adapter                      | Erfordert Copilot-CLI-/Runtime-Authentifizierung.                                                     |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)             | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`      | Factory Droid CLI                               | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung.           |
| `fast-agent` | fast-agent-mcp-ACP-Adapter                      | Wird bei Bedarf mit `uvx` abgerufen.                                                                 |
| `gemini`     | Gemini-CLI-ACP-Adapter                          | Erfordert Gemini-CLI-Authentifizierung oder die Einrichtung eines API-Schlüssels.                    |
| `iflow`      | iFlow CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                        |
| `kilocode`   | Kilo Code CLI                                   | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                        |
| `kimi`       | Kimi/Moonshot CLI                               | Erfordert Kimi-/Moonshot-Authentifizierung auf dem Host.                                             |
| `kiro`       | Kiro CLI                                        | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                        |
| `mux`        | Mux-CLI-ACP-Adapter                             | Wird bei Bedarf mit `npx` abgerufen.                                                                 |
| `opencode`   | OpenCode-ACP-Adapter                            | Erfordert OpenCode-CLI-/Provider-Authentifizierung.                                                  |
| `openclaw`   | OpenClaw-Gateway-Bridge über `openclaw acp`     | Ermöglicht einem ACP-fähigen Harness die Kommunikation mit einer OpenClaw-Gateway-Sitzung.           |
| `qoder`      | Qoder CLI                                       | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                        |
| `qwen`       | Qwen Code / Qwen CLI                            | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                                            |
| `trae`       | Trae-CLI-ACP-Adapter                            | Adapterverfügbarkeit und Modellsteuerung hängen von der installierten CLI ab.                        |

`pi` (pi-acp) ist ebenfalls im acpx-Backend registriert, ist jedoch kein Coding-Harness
im selben Sinne wie die oben aufgeführten.

Benutzerdefinierte acpx-Agentenaliase können in acpx selbst konfiguriert werden, die OpenClaw-
Richtlinie prüft jedoch weiterhin `acp.allowedAgents` und jede
`agents.list[].runtime.acp.agent`-Zuordnung vor dem Dispatch.

## Betriebsleitfaden

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Konversation oder im gebundenen Thread fort (oder adressieren Sie den Sitzungsschlüssel
    explizit).
  </Step>
  <Step title="Status prüfen">
    `/acp status`
  </Step>
  <Step title="Anpassen">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
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
  <Accordion title="Details zum Lebenszyklus">
    - Das Starten erstellt eine ACP-Runtime-Sitzung oder setzt sie fort, speichert ACP-Metadaten im OpenClaw-Sitzungsspeicher und kann eine Hintergrundaufgabe erstellen, wenn der Durchlauf dem übergeordneten Prozess gehört.
    - ACP-Sitzungen im Besitz eines übergeordneten Prozesses werden auch dann als Hintergrundarbeit behandelt, wenn die Runtime-Sitzung persistent ist. Abschluss und oberflächenübergreifende Zustellung erfolgen über die Aufgabenbenachrichtigung des übergeordneten Prozesses, statt wie bei einer normalen benutzerseitigen Chat-Sitzung.
    - Die Aufgabenverwaltung schließt beendete oder verwaiste einmalige ACP-Sitzungen im Besitz eines übergeordneten Prozesses. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Konversationsbindung besteht. Veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht unbemerkt fortgesetzt werden können, nachdem die zugehörige Aufgabe beendet wurde oder ihr Aufgabeneintrag nicht mehr vorhanden ist.
    - Gebundene Folgenachrichten werden direkt an die ACP-Sitzung gesendet, bis die Bindung geschlossen, der Fokus aufgehoben, sie zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Durchlauf ab, wenn das Backend Abbrüche unterstützt. Dabei werden weder die Bindung noch die Sitzungsmetadaten gelöscht.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seinen eigenen vorgelagerten Verlauf weiterhin behalten, wenn es die Wiederaufnahme unterstützt.
    - Das acpx-Plugin bereinigt nach `close` die OpenClaw-eigenen Wrapper- und Adapter-Prozessbäume und entfernt beim Start des Gateways veraltete verwaiste OpenClaw-eigene ACPX-Prozesse.
    - Inaktive Runtime-Worker können nach `acp.runtime.ttlMinutes` bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Native Codex-Weiterleitungsregeln">
    Auslöser in natürlicher Sprache, die bei aktiviertem Plugin an das **native Codex-Plugin**
    weitergeleitet werden sollten:

    - „Binde diesen Discord-Channel an Codex.“
    - „Verknüpfe diesen Chat mit dem Codex-Thread `<id>`.“
    - „Zeige Codex-Threads an und binde dann diesen.“

    Native Codex-Konversationsbindung ist der standardmäßige Pfad für die Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während Codex-native
    Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden. Für Codex-native
    Tool-Ereignisse fügt OpenClaw pro Durchlauf ein natives Hook-Relay ein, damit Plugin-Hooks
    `before_tool_call` blockieren, `after_tool_call` beobachten und Codex-
    `PermissionRequest`-Ereignisse über OpenClaw-Genehmigungen weiterleiten können. Codex-`Stop`-Hooks
    werden an OpenClaw-`before_agent_finalize` weitergeleitet, wo Plugins
    einen weiteren Modelldurchlauf anfordern können, bevor Codex seine Antwort finalisiert. Das Relay bleibt
    bewusst konservativ: Es verändert weder Argumente Codex-nativer Tools
    noch schreibt es Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur, wenn Sie das
    ACP-Laufzeit-/Sitzungsmodell verwenden möchten. Die eingebettete Codex-Unterstützungsgrenze ist
    im
    [Supportvertrag für Codex Harness v1](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

  </Accordion>
  <Accordion title="Spickzettel zur Auswahl von Modell / Provider / Laufzeit">
    - Legacy-Codex-Modellreferenzen – Legacy-Route für Codex-OAuth-/Abonnementmodelle, die durch doctor repariert wird.
    - `openai/*` – eingebettete native Codex-App-Server-Laufzeit für OpenAI-Agentendurchläufe.
    - `/codex ...` – native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` – explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Auslöser für ACP-Routing">
    Auslöser, die an die ACP-Laufzeit weiterleiten sollten:

    - „Führen Sie dies als einmalige Claude Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen.“
    - „Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und führen Sie Folgeanfragen anschließend im selben Thread fort.“
    - „Führen Sie Codex über ACP in einem Hintergrund-Thread aus.“

    OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf, bindet sie,
    sofern unterstützt, an die aktuelle Konversation oder den aktuellen Thread und leitet Folgeanfragen
    bis zum Schließen/Ablaufen an diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn
    ACP/acpx explizit angegeben ist oder das native Codex-Plugin für den
    angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angeboten, wenn ACP
    aktiviert ist, der Anfordernde nicht in einer Sandbox ausgeführt wird und ein ACP-Laufzeit-Backend
    geladen ist. `acp.dispatch.enabled=false` pausiert die automatische ACP-Thread-Weiterleitung,
    blendet explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe jedoch weder aus noch blockiert sie.
    Das Ziel sind ACP-Harness-IDs wie `codex`, `claude`, `droid`,
    `gemini` oder `opencode`. Übergeben Sie keine normale OpenClaw-Konfigurations-Agenten-ID
    aus `agents_list`, sofern dieser Eintrag nicht ausdrücklich mit
    `agents.list[].runtime.type="acp"` konfiguriert ist; verwenden Sie andernfalls die standardmäßige
    Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent mit
    `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw `runtime.acp.agent` als zugrunde liegende
    Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit benötigen. Verwenden Sie den **nativen Codex-
App-Server** für Codex-Konversationsbindung/-steuerung, wenn das `codex`-Plugin
aktiviert ist. Verwenden Sie **Sub-Agents**, wenn Sie OpenClaw-native delegierte Durchläufe benötigen.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Durchlauf                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Erzeugungs-Tool | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agents](/de/tools/subagents).

## So führt ACP Claude Code aus

Für Claude Code über ACP besteht der Stack aus:

1. OpenClaw-ACP-Steuerungsebene für Sitzungen.
2. Offiziellem Laufzeit-Plugin `@openclaw/acpx`.
3. Claude-ACP-Adapter.
4. Claude-seitiger Laufzeit-/Sitzungsmechanik.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerelementen, Wiederaufnahme der Sitzung,
Verfolgung von Hintergrundaufgaben und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate, rein textbasierte lokale Fallback-Laufzeiten – siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch:

- **Benötigen Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerung oder dauerhafte Harness-Arbeit?** Verwenden Sie ACP.
- **Benötigen Sie einen einfachen lokalen Text-Fallback über die unverarbeitete CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Mentales Modell

- **Chat-Oberfläche** – der Ort, an dem Personen weiter kommunizieren (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** – der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/untergeordnetes Thema** – eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Arbeitsbereich** – der Dateisystemort (`cwd`, Repository-Checkout, Backend-Arbeitsbereich), an dem das Harness ausgeführt wird. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` heftet die aktuelle Konversation an die
erzeugte ACP-Sitzung – kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
die Kontrolle über Transport, Authentifizierung, Sicherheit und Zustellung. Folgenachrichten in dieser
Konversation werden an dieselbe Sitzung weitergeleitet; `/new` und `/reset` setzen die Sitzung
an Ort und Stelle zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, künftige Nachrichten hierher weiterleiten
/codex model gpt-5.4                                     # den gebundenen nativen Codex-Thread abstimmen
/codex stop                                              # den aktiven nativen Codex-Durchlauf steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein untergeordnetes Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # dieselbe Chat-Bindung, Codex wird in /workspace/repo ausgeführt
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und gegenseitiger Ausschluss">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur auf Kanälen, die Bindungen an die aktuelle Konversation anbieten; andernfalls gibt OpenClaw eine klare Meldung aus, dass dies nicht unterstützt wird. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Auf Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` – nicht für `--bind here`.
    - Wenn Sie ohne `--cwd` für einen anderen ACP-Agenten eine Sitzung erzeugen, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Zielagenten**. Fehlende geerbte Pfade (`ENOENT`/`ENOTDIR`) greifen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Erzeugungsfehler ausgegeben.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal – `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler Folgetext an die gebundene ACP-Sitzung weitergeleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, sofern die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="Thread-gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine ACP-Zielsitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
    - ACP-Ausgaben werden an denselben Thread zurückgesendet.
    - Aufheben der Fokussierung/Schließen/Archivieren/Inaktivitätszeitüberschreitung oder Ablauf des Höchstalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle, keine Prompts an das ACP-Harness.

    Erforderliche Funktionsschalter für Thread-gebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie es auf `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Erzeugung von Thread-Sitzungen im Kanaladapter aktiviert (Standard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Die Unterstützung für Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanaladapter
    keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare Meldung aus,
    dass diese nicht unterstützt oder verfügbar sind.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Funktionen zur Sitzungs-/Thread-Bindung bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forenthemen in Gruppen/Supergruppen und DM-Themen).
    - Plugin-Kanäle können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

  </Accordion>
</AccordionGroup>

## Dauerhafte Kanalbindungen

Konfigurieren Sie für nicht kurzlebige Arbeitsabläufe dauerhafte ACP-Bindungen in
`bindings[]`-Einträgen der obersten Ebene.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Kennzeichnet eine dauerhafte ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalspezifische Formen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen stimmen auch mit Antworten in den Threads dieses Kanals überein.
- **Telegram-Forenthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-DM/-Gruppe:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Verwenden Sie E.164-Nummern wie `+15555550123` für Direktchats und WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us` für Gruppen.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des besitzenden OpenClaw-Agenten.
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

### Laufzeitstandards pro Agent

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

- OpenClaw stellt nach der kanalspezifischen Zulassung und vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung vorhanden ist.
- Nachrichten in diesem Kanal, Thema oder Chat werden an die konfigurierte ACP-Sitzung weitergeleitet.
- Konfigurierte ACP-Bindungen sind Eigentümer ihrer Sitzungsroute. Die Broadcast-Auffächerung des Kanals ersetzt bei einer übereinstimmenden Bindung nicht die konfigurierte ACP-Sitzung.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Laufzeitbindungen (beispielsweise durch Thread-Fokus-Abläufe erstellte) gelten weiterhin, sofern vorhanden.
- Bei agentenübergreifenden ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Zielagenten aus der Agentenkonfiguration.
- Fehlende übernommene Arbeitsbereichspfade fallen auf das standardmäßige cwd des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Startfehler ausgegeben.

## ACP-Sitzungen starten

Es gibt zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Über sessions_spawn">
    Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agentendurchlauf oder
    Tool-Aufruf zu starten.

    ```json
    {
      "task": "Öffne das Repository und fasse fehlgeschlagene Tests zusammen",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` ist standardmäßig `subagent`. Legen Sie daher für
    ACP-Sitzungen explizit `runtime: "acp"` fest. Wenn `agentId` weggelassen wird, verwendet OpenClaw
    das konfigurierte `acp.defaultAgent`. `mode: "session"` erfordert `thread: true`, damit eine
    dauerhafte gebundene Unterhaltung erhalten bleibt.
    </Note>

  </Tab>
  <Tab title="Über den Befehl /acp">
    Verwenden Sie `/acp spawn` für die explizite Steuerung durch Bediener über den Chat.

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
  ID des ACP-Ziel-Harnesses. Fällt auf `acp.defaultAgent` zurück, sofern festgelegt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert, sofern unterstützt, einen Thread-Bindungsablauf an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist ein einmaliger Durchlauf; `"session"` ist dauerhaft. Wenn `thread: true` gilt und
  `mode` weggelassen wird, kann OpenClaw abhängig vom Laufzeitpfad standardmäßig dauerhaftes
  Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Arbeitsverzeichnis der Laufzeit (durch die Backend-/Laufzeitrichtlinie validiert).
  Wird es weggelassen, übernimmt der ACP-Start den konfigurierten Arbeitsbereich des Zielagenten;
  fehlende übernommene Pfade fallen auf die Backend-Standardwerte zurück, während tatsächliche
  Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Bedienerbezogene Bezeichnung, die im Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, anstatt eine neue zu erstellen. Der Agent
  spielt seinen Unterhaltungsverlauf über `session/load` erneut ab. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt Zusammenfassungen des anfänglichen ACP-Durchlauffortschritts als Systemereignisse
  an die anfordernde Sitzung zurück. Akzeptierte Antworten enthalten unter anderem `streamLogPath`,
  der auf ein sitzungsbezogenes JSONL-Protokoll (`<sessionId>.acp-stream.jsonl`) verweist, dem Sie
  für den vollständigen Weiterleitungsverlauf folgen können. Übergeordnete Fortschrittsstreams zeigen standardmäßig
  Assistentenkommentare und ACP-Statusfortschritt, sofern
  `streaming.progress.commentary=false` nicht festgelegt ist. Discord verwendet für übergeordnete
  Vorschauen ebenfalls standardmäßig den Fortschrittsmodus, wenn kein Streammodus konfiguriert ist. Der
  Statusfortschritt berücksichtigt weiterhin `acp.stream.tagVisibility`, sodass Tags wie `plan`
  ausgeblendet bleiben, sofern sie nicht explizit aktiviert werden.
</ParamField>

ACP-`sessions_spawn`-Durchläufe verwenden `agents.defaults.subagents.runTimeoutSeconds`
als standardmäßige Zeitbegrenzung für den untergeordneten Durchlauf. Das Tool akzeptiert keine
Zeitüberschreibungen pro Aufruf (`runTimeoutSeconds`/`timeoutSeconds` werden mit einem
Fehler abgelehnt, der zur Konfiguration des Standardwerts auffordert).

<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die untergeordnete ACP-Sitzung. Codex-ACP-Starts
  normalisieren OpenAI-Referenzen wie `openai/gpt-5.4` vor `session/new` in die
  Codex-ACP-Startkonfiguration; Slash-Formen wie `openai/gpt-5.4/high` legen außerdem
  den Codex-ACP-Reasoning-Aufwand fest. Wird der Parameter weggelassen, verwendet
  `sessions_spawn({ runtime: "acp" })` vorhandene Standardmodelle für Subagenten
  (`agents.defaults.subagents.model` oder `agents.list[].subagents.model`), sofern konfiguriert;
  andernfalls verwendet das ACP-Harness sein eigenes Standardmodell. Andere Harnesses müssen
  ACP-`models` bekannt geben und `session/set_model` unterstützen; andernfalls schlagen
  OpenClaw/acpx eindeutig fehl, anstatt stillschweigend auf den Standardwert des Zielagenten zurückzufallen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Reasoning-Aufwand. Für Codex ACP wird `minimal` einem niedrigen
  Aufwand zugeordnet, `low`/`medium`/`high`/`xhigh` werden direkt zugeordnet und bei `off`
  wird die Startüberschreibung für den Reasoning-Aufwand weggelassen. Wird der Parameter weggelassen,
  verwenden ACP-Starts vorhandene Denkstandardwerte für Subagenten sowie
  `agents.defaults.models["provider/model"].params.thinking` für das ausgewählte
  Modell.
</ParamField>

## Bindungs- und Thread-Modi beim Start

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Verhalten                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bindet die aktuell aktive Unterhaltung direkt; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Erstellt keine Bindung für die aktuelle Unterhaltung.                   |

    Hinweise:

    - `--bind here` ist der einfachste Bedienerpfad, um „diesen Kanal oder Chat mit Codex zu betreiben“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die Bindungen für die aktuelle Unterhaltung unterstützen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Verhalten                                                                                          |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: bindet diesen Thread. Außerhalb eines Threads: erstellt/bindet, sofern unterstützt, einen untergeordneten Thread. |
    | `here` | Erfordert einen aktuell aktiven Thread; schlägt fehl, wenn Sie sich in keinem befinden.            |
    | `off`  | Keine Bindung. Die Sitzung startet ungebunden.                                                     |

    Hinweise:

    - Auf Bindungsoberflächen ohne Threads entspricht das Standardverhalten effektiv `off`.
    - Ein an einen Thread gebundener Start erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder vom übergeordneten Prozess verwaltete
Hintergrundarbeit sein. Der Zustellungsweg hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dafür vorgesehen, die Unterhaltung auf einer sichtbaren Chatoberfläche fortzuführen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten übereinstimmende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die ACP-
    Sitzung weitergeleitet, und ACP-Ausgaben werden an denselben
    Kanal/Thread/dasselbe Thema zurückgesendet.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgenachrichten werden als Eingabeaufforderungstext gesendet, ergänzt um Anhänge, sofern das Harness/Backend diese unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Von der Laufzeit erzeugte Abschlussereignisse werden für jedes Ziel aufbereitet. OpenClaw-Agenten erhalten den internen Laufzeitkontext-Umschlag von OpenClaw; externe ACP-Harnesses erhalten eine einfache Eingabeaufforderung mit dem Ergebnis des untergeordneten Prozesses und einer Anweisung. Der rohe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Umschlag darf niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext gespeichert werden.
    - ACP-Transkripteinträge verwenden den für Benutzer sichtbaren Auslösertext oder die einfache Abschlussaufforderung. Interne Ereignismetadaten bleiben nach Möglichkeit in OpenClaw strukturiert und werden nicht als vom Benutzer verfasster Chatinhalt behandelt.

  </Accordion>
  <Accordion title="Vom übergeordneten Prozess verwaltete einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agentendurchlauf gestartet werden, sind untergeordnete
    Hintergrundprozesse, ähnlich wie Subagenten:

    - Der übergeordnete Prozess fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
    - Der untergeordnete Prozess wird in seiner eigenen ACP-Harness-Sitzung ausgeführt.
    - Untergeordnete Durchläufe werden auf derselben Hintergrundspur ausgeführt, die für native Subagenten-Starts verwendet wird, sodass ein langsames ACP-Harness nicht die Arbeit anderer Hauptsitzungen blockiert.
    - Der Abschluss wird über den Ankündigungspfad für Aufgabenabschlüsse zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in eine einfache ACP-Eingabeaufforderung um, bevor sie an ein externes Harness gesendet werden, sodass Harnesses keine ausschließlich für OpenClaw bestimmten Laufzeitkontextmarkierungen sehen.
    - Der übergeordnete Prozess formuliert das Ergebnis des untergeordneten Prozesses mit normaler Assistentenstimme neu, wenn eine benutzerbezogene Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem und
    untergeordnetem Prozess. Der untergeordnete Prozess verfügt bereits über einen Abschlusskanal zurück zum übergeordneten Prozess.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Start eine andere Sitzung ansprechen. Für normale Peer-
    Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-Folgepfad (A2A):

    - Auf die Antwort der Zielsitzung warten.
    - Optional dem anfordernden Prozess und dem Ziel eine begrenzte Anzahl von Folgeaustauschen ermöglichen.
    - Das Ziel auffordern, eine Ankündigungsnachricht zu erstellen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Fallback für Übertragungen an Peers, bei denen der Absender eine
    sichtbare Folgenachricht benötigt. Er bleibt aktiviert, wenn eine nicht zugehörige Sitzung ein ACP-Ziel sehen und
    ihm Nachrichten senden kann, beispielsweise bei weit gefassten Einstellungen für `tools.sessions.visibility`.

    OpenClaw überspringt die A2A-Folgenachricht nur, wenn der Anforderer das übergeordnete Element
    seines eigenen, dem übergeordneten Element zugehörigen, einmalig ausgeführten ACP-Kindelements ist. In diesem Fall kann die Ausführung von A2A zusätzlich
    zum Aufgabenabschluss das übergeordnete Element mit dem Ergebnis des Kindelements reaktivieren, die Antwort
    des übergeordneten Elements an das Kindelement zurückleiten und eine Echo-Schleife zwischen übergeordnetem Element und Kindelement
    erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall des zugehörigen Kindelements
    `delivery.status="skipped"`, da der Abschlusspfad bereits für
    das Ergebnis zuständig ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, anstatt
    eine neue zu starten. Der Agent spielt seinen Konversationsverlauf über
    `session/load` erneut ab und setzt daher mit dem vollständigen bisherigen Kontext fort.

    ```json
    {
      "task": "Fahren Sie dort fort, wo wir aufgehört haben – beheben Sie die verbleibenden Testfehler",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Übertragen Sie eine Codex-Sitzung von Ihrem Laptop auf Ihr Smartphone – weisen Sie Ihren Agenten an, dort fortzufahren, wo Sie aufgehört haben.
    - Setzen Sie eine Programmiersitzung, die Sie interaktiv in der CLI gestartet haben, nun ohne Benutzeroberfläche über Ihren Agenten fort.
    - Nehmen Sie Arbeiten wieder auf, die durch einen Neustart des Gateways oder eine Zeitüberschreitung bei Inaktivität unterbrochen wurden.

    Hinweise:

    - `resumeSessionId` gilt nur bei `runtime: "acp"`; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `streamTo` gilt nur bei `runtime: "acp"`; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `resumeSessionId` ist eine hostlokale ACP-/Harness-Fortsetzungs-ID und kein OpenClaw-Sitzungsschlüssel eines Kanals; OpenClaw prüft vor der Weiterleitung weiterhin die ACP-Start-Richtlinie und die Richtlinie des Ziel-Agenten, während das ACP-Backend oder Harness für die Autorisierung zum Laden dieser Upstream-ID zuständig ist.
    - `resumeSessionId` stellt den Upstream-ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin wie gewohnt für die neue OpenClaw-Sitzung, die Sie erstellen. Daher erfordert `mode: "session"` weiterhin `thread: true`.
    - Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Start mit einer eindeutigen Fehlermeldung fehl – es erfolgt kein stiller Fallback auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach der Bereitstellung">
    Führen Sie nach der Bereitstellung eines Gateways eine vollständige Live-End-to-End-Prüfung durch, statt sich auf
    Unit-Tests zu verlassen:

    1. Überprüfen Sie die bereitgestellte Gateway-Version und den Commit auf dem Zielhost.
    2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung mit einem Live-Agenten.
    3. Fordern Sie diesen Agenten auf, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. Überprüfen Sie `accepted=yes`, einen echten `childSessionKey` und das Ausbleiben eines Validatorfehlers.
    5. Bereinigen Sie die temporäre Bridge-Sitzung.

    Beschränken Sie diese Prüfung auf `mode: "run"` und überspringen Sie `streamTo: "parent"` –
    threadgebundene Pfade mit `mode: "session"` und Stream-Relay-Pfade sind separate, umfassendere
    Integrationsprüfungen.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen werden derzeit in der Host-Laufzeit ausgeführt, **nicht** innerhalb der OpenClaw-
Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann entsprechend seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen und schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Harnesses **nicht**.
- OpenClaw erzwingt weiterhin ACP-Funktionsfreigaben, zulässige Agenten, Sitzungseigentümerschaft, Kanalbindungen und die Gateway-Zustellungsrichtlinie.
- Verwenden Sie `runtime: "subagent"` für OpenClaw-native Arbeiten mit erzwungener Sandbox.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung in einer Sandbox ausgeführt wird, sind ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung des Sitzungsziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zunächst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann das Label
2. Aktuelle Thread-Bindung (wenn diese Unterhaltung/dieser Thread an eine ACP-Sitzung gebunden ist).
3. Rückgriff auf die aktuelle anfragende Sitzung.

Sowohl Bindungen der aktuellen Unterhaltung als auch Thread-Bindungen werden in Schritt 2 berücksichtigt.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen eindeutigen Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerung

| Befehl               | Funktion                                                  | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuell oder an Thread binden. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Durchlauf für die Zielsitzung abbrechen.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steuerungsanweisung an die laufende Sitzung senden.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Bindungen an Thread-Ziele aufheben. | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.              | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeitkonfigurationsoption schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeitarbeitsverzeichnisses festlegen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout (Sekunden) festlegen.                     | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Laufzeitoptionen der Sitzung entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Kürzlich gespeicherte ACP-Sitzungen auflisten.            | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten und umsetzbare Korrekturen anzeigen. | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

Laufzeitsteuerungen (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` und `reset-options`) erfordern
bei externen Kanälen die Identität des Eigentümers und bei internen
Gateway-Clients `operator.admin`. Autorisierte Absender, die nicht Eigentümer sind, können weiterhin `sessions`,
`doctor`, `install` und `help` verwenden.

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Sitzungskennungen
auf Laufzeit- und Backend-Ebene an. Fehler bei nicht unterstützten Steuerungen werden
eindeutig angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den Speicher
für die aktuell gebundene oder anfragende Sitzung; Ziel-Token (`session-key`,
`session-id` oder `session-label`) werden über die Sitzungsermittlung des Gateways aufgelöst,
einschließlich benutzerdefinierter agentenspezifischer `session.store`-Stammverzeichnisse.

### Zuordnung der Laufzeitoptionen

`/acp` verfügt über Komfortbefehle und einen generischen Setter. Gleichwertige Vorgänge:

| Befehl                      | Wird zugeordnet zu                   | Hinweise                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Laufzeitkonfigurationsschlüssel `model` | Für Codex ACP normalisiert OpenClaw `openai/<model>` zur Modell-ID des Adapters und ordnet Reasoning-Suffixe nach einem Schrägstrich wie `openai/gpt-5.4/high` `reasoning_effort` zu.                       |
| `/acp set thinking <level>`  | kanonische Option `thinking`         | OpenClaw sendet die vom Backend angegebene Entsprechung, sofern vorhanden, und bevorzugt dabei `thinking`, dann `effort`, `reasoning_effort` oder `thought_level`. Für Codex ACP ordnet der Adapter die Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet die vom Backend angegebene Entsprechung, sofern vorhanden, beispielsweise `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                  |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`   | OpenClaw sendet die vom Backend angegebene Entsprechung, sofern vorhanden, beispielsweise `timeout` oder `timeout_seconds`.                                                                                 |
| `/acp cwd <path>`            | Überschreibung des Laufzeitarbeitsverzeichnisses | Direkte Aktualisierung.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | generisch                            | `key=cwd` verwendet den Pfad zur Überschreibung des Arbeitsverzeichnisses.                                                                                                                                  |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen | -                                                                                                                                                                                                          |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur Konfiguration des acpx-Harness (Aliasse für Claude Code / Codex / Gemini CLI),
zu den MCP-Bridges für Plugin-Tools und OpenClaw-Tools sowie zu den ACP-Berechtigungsmodi
finden Sie unter [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                                   | Wahrscheinliche Ursache                                                                                                           | Behebung                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Backend-Plugin fehlt, ist deaktiviert oder durch `plugins.allow` blockiert.                                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Zulassungsliste festgelegt ist, und führen Sie anschließend `/acp doctor` aus.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP ist global deaktiviert.                                                                                                 | Setzen Sie `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Die automatische Weiterleitung normaler Thread-Nachrichten ist deaktiviert.                                                               | Setzen Sie `acp.dispatch.enabled=true`, um die automatische Thread-Weiterleitung fortzusetzen; explizite Aufrufe von `sessions_spawn({ runtime: "acp" })` funktionieren weiterhin.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Der Agent befindet sich nicht in der Zulassungsliste.                                                                                                | Verwenden Sie eine zulässige `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                               | Das Backend-Plugin fehlt, ist deaktiviert, durch die Zulassungs-/Sperrrichtlinie blockiert oder seine konfigurierte ausführbare Datei ist nicht verfügbar.        | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Installations- oder Richtlinienfehler des Backends, falls es weiterhin nicht funktionsfähig ist.                                           |
| Harness-Befehl nicht gefunden                                                                 | Die Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erstmalige `npx`-Abruf ist bei einem Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren Sie den Adapter auf dem Gateway-Host bzw. wärmen Sie ihn dort vor oder konfigurieren Sie den Befehl des acpx-Agenten explizit.                                                      |
| Modell-vom-Harness-nicht-gefunden                                                         | Die Modell-ID ist für einen anderen Provider/ein anderes Harness gültig, jedoch nicht für dieses ACP-Ziel.                                                | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                                            |
| Provider-Authentifizierungsfehler vom Harness                                                        | OpenClaw ist funktionsfähig, aber die Ziel-CLI bzw. der Ziel-Provider ist nicht angemeldet.                                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Umgebung des Gateway-Hosts bereit.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Ungültiger Schlüssel, ungültige ID oder ungültiges Label-Token.                                                                                                | Führen Sie `/acp sessions` aus, kopieren Sie den exakten Schlüssel bzw. das exakte Label und versuchen Sie es erneut.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` wurde ohne aktive bindbare Unterhaltung verwendet.                                                            | Wechseln Sie zum Zielchat/-kanal und versuchen Sie es erneut oder starten Sie eine ungebundene Sitzung.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Dem Adapter fehlt die ACP-Bindungsfunktion für die aktuelle Unterhaltung.                                                             | Verwenden Sie, sofern unterstützt, `/acp spawn ... --thread ...`, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                                         | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Ein anderer Benutzer ist Eigentümer des aktiven Bindungsziels.                                                                           | Binden Sie als Eigentümer erneut oder verwenden Sie eine andere Unterhaltung bzw. einen anderen Thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Dem Adapter fehlt die Funktion zur Thread-Bindung.                                                                               | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Die ACP-Laufzeit wird auf dem Host ausgeführt; die anfordernde Sitzung ist in einer Sandbox isoliert.                                                              | Verwenden Sie aus Sandbox-Sitzungen `runtime="subagent"` oder starten Sie ACP aus einer Sitzung ohne Sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Für die ACP-Laufzeit wurde `sandbox="require"` angefordert.                                                                         | Verwenden Sie `runtime="subagent"`, wenn eine Sandbox erforderlich ist, oder verwenden Sie ACP mit `sandbox="inherit"` aus einer Sitzung ohne Sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Das Ziel-Harness stellt keine generische ACP-Modellumschaltung bereit.                                                        | Verwenden Sie ein Harness, das ACP-`models`/`session/set_model` anbietet, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, falls dieses über ein eigenes Startflag verfügt. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                                    | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                                    | Erstellen Sie die Sitzung mit `/acp spawn` neu und binden bzw. fokussieren Sie anschließend den Thread erneut.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blockiert Schreib-/Ausführungsvorgänge in einer nicht interaktiven ACP-Sitzung.                                                    | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt frühzeitig mit wenig Ausgabe fehl                                                | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                                        | Prüfen Sie die Gateway-Protokolle auf `AcpRuntimeError`. Setzen Sie für vollständige Berechtigungen `permissionMode=approve-all`; setzen Sie für einen kontrollierten Funktionsabbau `nonInteractivePermissions=deny`.        |
| ACP-Sitzung bleibt nach Abschluss der Arbeit unbegrenzt hängen                                     | Der Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet.                                                    | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung beendet beim Schließen und beim Start des Gateways veraltete Wrapper- und Adapterprozesse, die OpenClaw gehören.                                             |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Die interne Ereignishülle ist über die ACP-Grenze hinweg durchgesickert.                                                                | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten ausschließlich Klartext-Abschluss-Prompts erhalten.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` gehört zur
nativen Codex-Hook-Weiterleitung, nicht zu ACP/acpx. Starten Sie in einem gebundenen
Codex-Chat mit `/new` oder `/reset` eine neue Sitzung; wenn es einmal funktioniert
und beim nächsten nativen Tool-Aufruf erneut auftritt, starten Sie den Codex-App-Server
oder das OpenClaw Gateway neu, statt `/new` zu wiederholen. Siehe
[Fehlerbehebung für das Codex-Harness](/de/plugins/codex-harness#troubleshooting).
</Note>

## Verwandte Themen

- [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup)
- [Senden durch Agenten](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
