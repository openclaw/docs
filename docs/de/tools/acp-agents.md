---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Einrichten konversationsgebundener ACP-Sitzungen in Messaging-Kanälen
    - Eine Unterhaltung in einem Nachrichtenkanal an eine persistente ACP-Sitzung binden
    - Fehlerbehebung für ACP-Backend, Plugin-Anbindung oder Zustellung von Abschlüssen
    - /acp-Befehle im Chat ausführen
sidebarTitle: ACP agents
summary: Externe Coding-Harnesses (Claude Code, Cursor, Gemini CLI, explizites Codex ACP, OpenClaw ACP, OpenCode) über das ACP-Backend ausführen
title: ACP-Agenten
x-i18n:
    generated_at: "2026-07-24T04:08:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc7f32ff927c7e949be1595f6aa00ed034a51185c6a6b1e0df01a242954667d1
    source_path: tools/acp-agents.md
    workflow: 16
---

Sitzungen des [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es
OpenClaw, externe Coding-Harnesses (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses)
über ein ACP-Backend-Plugin auszuführen. Jeder Start wird als
[Hintergrundaufgabe](/de/automation/tasks) erfasst.

<Note>
**ACP ist der Pfad für externe Harnesses, nicht der standardmäßige Codex-Pfad.** Das native
Codex-App-Server-Plugin verwaltet die `/codex ...`-Steuerelemente und die standardmäßige
eingebettete `openai/gpt-*`-Runtime für Agentendurchläufe; ACP verwaltet die `/acp ...`-Steuerelemente
und `sessions_spawn({ runtime: "acp" })`-Sitzungen.

Damit Codex oder Claude Code als externer MCP-Client direkt eine Verbindung zu
bestehenden OpenClaw-Kanalunterhaltungen herstellen kann, verwenden Sie
[`openclaw mcp serve`](/de/cli/mcp) anstelle von ACP.
</Note>

## Welche Seite benötige ich?

| Sie möchten ...                                                                                 | Verwenden Sie                          | Hinweise                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Unterhaltung binden oder steuern                                         | `/codex bind`, `/codex threads`        | Nativer Codex-App-Server-Pfad, wenn das `codex`-Plugin aktiviert ist: gebundene Chatantworten, Bildweiterleitung, Modell/Schnellmodus/Berechtigungen, Anhalten und Steuern. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite                     | An Chats gebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerelemente |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen        | [`openclaw acp`](/de/cli/acp)             | Bridge-Modus: Eine IDE/ein Client kommuniziert über stdio/WebSocket per ACP mit OpenClaw                                                                                    |
| Eine lokale KI-CLI als reines Text-Fallbackmodell wiederverwenden                               | [CLI-Backends](/de/gateway/cli-backends) | Kein ACP: keine OpenClaw-Tools, keine ACP-Steuerelemente, keine Harness-Runtime                                                                                              |

## Funktioniert dies ohne weitere Konfiguration?

Ja, nach der Installation des offiziellen ACP-Runtime-Plugins:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Quellcode-Checkouts können das lokale `extensions/acpx`-Workspace-Plugin nach
`pnpm install` verwenden. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

OpenClaw informiert Agenten nur dann über das Starten per ACP, wenn ACP **tatsächlich verwendbar** ist:
ACP muss aktiviert sein, der Dispatch darf nicht deaktiviert sein, die aktuelle Sitzung darf
nicht durch die Sandbox blockiert sein und ein Runtime-Backend muss geladen und funktionsfähig sein. Wenn
eine Bedingung nicht erfüllt ist, bleiben ACP-Skills und die ACP-Anleitung für `sessions_spawn`
ausgeblendet, damit der Agent kein nicht verfügbares Backend vorschlägt.

<AccordionGroup>
  <Accordion title="Fallstricke beim ersten Start">
    - Wenn `plugins.allow` festgelegt ist, handelt es sich um ein restriktives Plugin-Inventar, das `acpx` **enthalten muss**. Andernfalls wird das installierte ACP-Backend absichtlich blockiert (`/acp doctor` meldet den fehlenden Eintrag in der Zulassungsliste).
    - Der Codex-ACP-Adapter wird mit dem `acpx`-Plugin ausgeliefert und startet nach Möglichkeit lokal.
    - Codex ACP wird mit einer isolierten `CODEX_HOME` ausgeführt. OpenClaw kopiert vertrauenswürdige Projekt-Vertrauenseinträge sowie sichere Konfigurationen für die Modell-/Provider-Weiterleitung (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` und sichere `model_providers.<name>`-Felder) aus der Codex-Konfiguration des Hosts; Authentifizierung, Benachrichtigungen und Hooks verbleiben ausschließlich in der Hostkonfiguration.
    - Andere Ziel-Harness-Adapter können bei der ersten Verwendung bei Bedarf mit `npx` abgerufen werden.
    - Die Anbieter-Authentifizierung für dieses Harness muss bereits auf dem Host vorhanden sein.
    - Wenn auf dem Host weder npm noch Netzwerkzugriff verfügbar ist, schlagen Adapterabrufe beim ersten Start fehl, bis die Caches vorab gefüllt wurden oder der Adapter auf andere Weise installiert wurde.

  </Accordion>
  <Accordion title="Runtime-Voraussetzungen">
    ACP startet einen echten externen Harness-Prozess. OpenClaw verwaltet das Routing,
    den Zustand der Hintergrundaufgaben, die Zustellung, Bindungen und Richtlinien; das Harness verwaltet
    seine Provider-Anmeldung, seinen Modellkatalog, sein Dateisystemverhalten und seine nativen Tools.

    Bevor Sie OpenClaw als Ursache annehmen, überprüfen Sie Folgendes:

    - `/acp doctor` meldet ein aktiviertes, funktionsfähiges Backend.
    - Die Ziel-ID ist durch `acp.allowedAgents` zugelassen, wenn diese Zulassungsliste festgelegt ist.
    - Der Harness-Befehl kann auf dem Gateway-Host gestartet werden.
    - Die Provider-Authentifizierung ist für dieses Harness vorhanden (`claude`, `codex`, `gemini`, `opencode`, `droid` usw.).
    - Das ausgewählte Modell ist für dieses Harness verfügbar – Modell-IDs sind nicht zwischen Harnesses übertragbar.
    - Das angeforderte `cwd` ist vorhanden und zugänglich. Alternativ lassen Sie `cwd` weg, damit das Backend seinen Standardwert verwendet.
    - Der Berechtigungsmodus entspricht der Aufgabe. Nicht interaktive Sitzungen können native Berechtigungsabfragen nicht anklicken. Daher benötigen schreib- und ausführungsintensive Coding-Durchläufe üblicherweise ein ACPX-Berechtigungsprofil, das ohne Benutzerinteraktion fortfahren kann.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-Tools und integrierte OpenClaw-Tools werden ACP-Harnesses standardmäßig
**nicht** bereitgestellt. Aktivieren Sie die expliziten MCP-Bridges unter
[ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup) nur, wenn das Harness
diese Tools direkt aufrufen soll.

## Unterstützte Harness-Ziele

Verwenden Sie mit dem `acpx`-Backend diese IDs als `/acp spawn <id>`- oder
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`-Ziele:

| Harness-ID   | Typisches Backend                               | Hinweise                                                                            |
| ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude-Code-ACP-Adapter                        | Erfordert Claude-Code-Authentifizierung auf dem Host.                               |
| `codex`      | Codex-ACP-Adapter                              | Nur expliziter ACP-Fallback, wenn das native `/codex` nicht verfügbar ist oder ACP angefordert wird. |
| `copilot`    | GitHub-Copilot-ACP-Adapter                     | Erfordert Copilot-CLI-/Runtime-Authentifizierung.                                   |
| `cursor`     | Cursor-CLI-ACP (`cursor-agent acp`)            | Überschreiben Sie den acpx-Befehl, wenn eine lokale Installation einen anderen ACP-Einstiegspunkt bereitstellt. |
| `droid`      | Factory Droid CLI                              | Erfordert Factory-/Droid-Authentifizierung oder `FACTORY_API_KEY` in der Harness-Umgebung. |
| `fast-agent` | fast-agent-mcp-ACP-Adapter                     | Wird bei Bedarf mit `uvx` abgerufen.                                   |
| `gemini`     | Gemini-CLI-ACP-Adapter                         | Erfordert Gemini-CLI-Authentifizierung oder die Einrichtung eines API-Schlüssels.  |
| `iflow`      | iFlow CLI                                      | Verfügbarkeit des Adapters und Modellsteuerung hängen von der installierten CLI ab. |
| `kilocode`   | Kilo Code CLI                                  | Verfügbarkeit des Adapters und Modellsteuerung hängen von der installierten CLI ab. |
| `kimi`       | Kimi/Moonshot CLI                              | Erfordert Kimi-/Moonshot-Authentifizierung auf dem Host.                            |
| `kiro`       | Kiro CLI                                       | Verfügbarkeit des Adapters und Modellsteuerung hängen von der installierten CLI ab. |
| `mux`        | Mux-CLI-ACP-Adapter                            | Wird bei Bedarf mit `npx` abgerufen.                                   |
| `opencode`   | OpenCode-ACP-Adapter                           | Erfordert OpenCode-CLI-/Provider-Authentifizierung.                                 |
| `openclaw`   | OpenClaw-Gateway-Bridge über `openclaw acp` | Ermöglicht einem ACP-fähigen Harness die Kommunikation mit einer OpenClaw-Gateway-Sitzung. |
| `qoder`      | Qoder CLI                                      | Verfügbarkeit des Adapters und Modellsteuerung hängen von der installierten CLI ab. |
| `qwen`       | Qwen Code / Qwen CLI                           | Erfordert Qwen-kompatible Authentifizierung auf dem Host.                           |
| `trae`       | Trae-CLI-ACP-Adapter                           | Verfügbarkeit des Adapters und Modellsteuerung hängen von der installierten CLI ab. |

`pi` (pi-acp) ist ebenfalls im acpx-Backend registriert, ist jedoch kein Coding-Harness
im gleichen Sinne wie die oben aufgeführten.

Benutzerdefinierte acpx-Agenten-Aliasse können in acpx selbst konfiguriert werden, die OpenClaw-
Richtlinie prüft jedoch weiterhin `acp.allowedAgents` und jede
`agents.entries.*.runtime.acp.agent`-Zuordnung vor dem Dispatch.

## Betriebshandbuch

Schneller `/acp`-Ablauf aus dem Chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oder explizit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Arbeiten">
    Fahren Sie in der gebundenen Unterhaltung oder im Thread fort (oder geben Sie den Sitzungsschlüssel
    explizit als Ziel an).
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
  <Step title="Anhalten">
    `/acp cancel` (aktueller Durchlauf) oder `/acp close` (Sitzung und Bindungen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Details zum Lebenszyklus">
    - Beim Starten wird eine ACP-Laufzeitsitzung erstellt oder fortgesetzt, ACP-Metadaten werden im OpenClaw-Sitzungsspeicher erfasst und möglicherweise wird eine Hintergrundaufgabe erstellt, wenn der Lauf einer übergeordneten Aufgabe gehört.
    - ACP-Sitzungen, die einer übergeordneten Aufgabe gehören, werden auch dann als Hintergrundarbeit behandelt, wenn die Laufzeitsitzung persistent ist; Abschluss und oberflächenübergreifende Zustellung erfolgen über die Benachrichtigungsfunktion der übergeordneten Aufgabe, statt wie bei einer normalen benutzerseitigen Chatsitzung.
    - Die Aufgabenverwaltung schließt beendete oder verwaiste einmalige ACP-Sitzungen, die einer übergeordneten Aufgabe gehören. Persistente ACP-Sitzungen bleiben erhalten, solange eine aktive Konversationsbindung besteht; veraltete persistente Sitzungen ohne aktive Bindung werden geschlossen, damit sie nicht unbemerkt fortgesetzt werden können, nachdem die zugehörige Aufgabe abgeschlossen wurde oder ihr Aufgabendatensatz nicht mehr vorhanden ist.
    - Gebundene Folgenachrichten werden direkt an die ACP-Sitzung gesendet, bis die Bindung geschlossen, der Fokus aufgehoben, sie zurückgesetzt oder abgelaufen ist.
    - Gateway-Befehle bleiben lokal. `/acp ...`, `/status` und `/unfocus` werden niemals als normaler Prompt-Text an ein gebundenes ACP-Harness gesendet.
    - `cancel` bricht den aktiven Durchlauf ab, wenn das Backend einen Abbruch unterstützt; die Bindungs- oder Sitzungsmetadaten werden dadurch nicht gelöscht.
    - `close` beendet die ACP-Sitzung aus Sicht von OpenClaw und entfernt die Bindung. Ein Harness kann seinen eigenen Upstream-Verlauf weiterhin behalten, wenn es die Fortsetzung unterstützt.
    - Das acpx-Plugin bereinigt nach `close` die OpenClaw-eigenen Wrapper- und Adapter-Prozessbäume und entfernt beim Start des Gateways veraltete OpenClaw-eigene ACPX-Waisenprozesse.
    - Inaktive Laufzeit-Worker können nach Ablauf des integrierten Inaktivitätszeitraums bereinigt werden; gespeicherte Sitzungsmetadaten bleiben für `/acp sessions` verfügbar.

  </Accordion>
  <Accordion title="Routingregeln für natives Codex">
    Natürlichsprachliche Auslöser, die an das **native Codex-Plugin** weitergeleitet werden sollten,
    wenn es aktiviert ist:

    - „Binden Sie diesen Discord-Kanal an Codex.“
    - „Verknüpfen Sie diesen Chat mit dem Codex-Thread `<id>`.“
    - „Zeigen Sie Codex-Threads an und binden Sie dann diesen.“

    Die native Codex-Konversationsbindung ist der standardmäßige Pfad zur Chat-Steuerung.
    Dynamische OpenClaw-Tools werden weiterhin über OpenClaw ausgeführt, während Codex-native
    Tools wie Shell/apply-patch innerhalb von Codex ausgeführt werden. Für Codex-native
    Tool-Ereignisse fügt OpenClaw pro Durchlauf eine native Hook-Weiterleitung ein, damit Plugin-Hooks
    `before_tool_call` blockieren, `after_tool_call` beobachten und Codex-
    `PermissionRequest`-Ereignisse über OpenClaw-Genehmigungen weiterleiten können. Codex-`Stop`-Hooks
    werden an OpenClaw-`before_agent_finalize` weitergeleitet, wo Plugins
    einen weiteren Modelldurchlauf anfordern können, bevor Codex seine Antwort abschließt. Die Weiterleitung bleibt
    bewusst konservativ: Sie verändert weder Argumente Codex-nativer Tools
    noch schreibt sie Codex-Thread-Datensätze um. Verwenden Sie explizites ACP nur, wenn Sie das
    ACP-Laufzeit-/Sitzungsmodell verwenden möchten. Die Unterstützungsgrenze für eingebettetes Codex ist im
    [Unterstützungsvertrag für Codex-Harness v1](/de/plugins/codex-harness-runtime#v1-support-contract)
    dokumentiert.

  </Accordion>
  <Accordion title="Kurzübersicht zur Modell-/Provider-/Laufzeitauswahl">
    - Veraltete Codex-Modellreferenzen – veraltete Codex-OAuth-/Abonnement-Modellroute, die durch doctor repariert wird.
    - `openai/*` – eingebettete native Codex-App-Server-Laufzeit für OpenAI-Agentendurchläufe.
    - `/codex ...` – native Codex-Konversationssteuerung.
    - `/acp ...` oder `runtime: "acp"` – explizite ACP-/acpx-Steuerung.

  </Accordion>
  <Accordion title="Natürlichsprachliche Auslöser für ACP-Routing">
    Auslöser, die an die ACP-Laufzeit weitergeleitet werden sollten:

    - „Führen Sie dies als einmalige Claude-Code-ACP-Sitzung aus und fassen Sie das Ergebnis zusammen.“
    - „Verwenden Sie Gemini CLI für diese Aufgabe in einem Thread und belassen Sie Folgenachrichten anschließend im selben Thread.“
    - „Führen Sie Codex über ACP in einem Hintergrund-Thread aus.“

    OpenClaw wählt `runtime: "acp"`, löst das Harness `agentId` auf, bindet es, sofern unterstützt,
    an die aktuelle Konversation oder den aktuellen Thread und leitet Folgenachrichten
    bis zum Schließen oder Ablaufen an diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn
    ACP/acpx explizit angegeben ist oder das native Codex-Plugin für den
    angeforderten Vorgang nicht verfügbar ist.

    Für `sessions_spawn` wird `runtime: "acp"` nur angeboten, wenn ACP
    aktiviert ist, die anfragende Instanz nicht in einer Sandbox ausgeführt wird und ein ACP-Laufzeit-Backend
    geladen ist. `acp.dispatch.enabled=false` pausiert die automatische ACP-Thread-Weiterleitung,
    blendet oder blockiert explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe
    jedoch nicht. Es richtet sich an ACP-Harness-IDs wie `codex`, `claude`, `droid`,
    `gemini` oder `opencode`. Übergeben Sie keine normale OpenClaw-Konfigurations-Agenten-ID
    aus `agents_list`, sofern dieser Eintrag nicht ausdrücklich mit
    `agents.entries.*.runtime.type="acp"` konfiguriert ist; verwenden Sie andernfalls die standardmäßige
    Sub-Agent-Laufzeit. Wenn ein OpenClaw-Agent mit
    `runtime.type="acp"` konfiguriert ist, verwendet OpenClaw `runtime.acp.agent` als zugrunde liegende
    Harness-ID.

  </Accordion>
</AccordionGroup>

## ACP im Vergleich zu Sub-Agenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit benötigen. Verwenden Sie den **nativen Codex-
App-Server** für die Bindung und Steuerung von Codex-Konversationen, wenn das Plugin `codex`
aktiviert ist. Verwenden Sie **Sub-Agenten**, wenn Sie von OpenClaw nativ delegierte Läufe benötigen.

| Bereich        | ACP-Sitzung                            | Sub-Agent-Lauf                       |
| -------------- | -------------------------------------- | ------------------------------------ |
| Laufzeit       | ACP-Backend-Plugin (zum Beispiel acpx) | Native OpenClaw-Sub-Agent-Laufzeit   |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle   | `/acp ...`                            | `/subagents ...`                   |
| Start-Tool     | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-Agenten](/de/tools/subagents).

## So führt ACP Claude Code aus

Für Claude Code über ACP besteht der Stack aus:

1. OpenClaw-ACP-Steuerungsebene für Sitzungen.
2. Offizielles `@openclaw/acpx`-Laufzeit-Plugin.
3. Claude-ACP-Adapter.
4. Claude-seitige Laufzeit-/Sitzungsmechanismen.

ACP Claude ist eine **Harness-Sitzung** mit ACP-Steuerung, Sitzungsfortsetzung,
Verfolgung von Hintergrundaufgaben und optionaler Konversations-/Thread-Bindung.

CLI-Backends sind separate, ausschließlich textbasierte lokale Fallback-Laufzeiten – siehe
[CLI-Backends](/de/gateway/cli-backends).

Für Betreiber gilt praktisch folgende Regel:

- **Benötigen Sie `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerung oder persistente Harness-Arbeit?** Verwenden Sie ACP.
- **Benötigen Sie einen einfachen lokalen Text-Fallback über die unverarbeitete CLI?** Verwenden Sie CLI-Backends.

## Gebundene Sitzungen

### Grundkonzept

- **Chat-Oberfläche** – der Ort, an dem Personen weiter kommunizieren (Discord-Kanal, Telegram-Thema, iMessage-Chat).
- **ACP-Sitzung** – der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet.
- **Untergeordneter Thread/untergeordnetes Thema** – eine optionale zusätzliche Nachrichtenoberfläche, die nur durch `--thread ...` erstellt wird.
- **Laufzeit-Arbeitsbereich** – der Dateisystemspeicherort (`cwd`, Repository-Checkout, Backend-Arbeitsbereich), an dem das Harness ausgeführt wird. Unabhängig von der Chat-Oberfläche.

### Bindungen an die aktuelle Konversation

`/acp spawn <harness> --bind here` bindet die aktuelle Konversation an die
gestartete ACP-Sitzung – kein untergeordneter Thread, dieselbe Chat-Oberfläche. OpenClaw behält
die Kontrolle über Transport, Authentifizierung, Sicherheit und Zustellung. Folgenachrichten in dieser
Konversation werden an dieselbe Sitzung weitergeleitet; `/new` und `/reset` setzen die Sitzung
direkt zurück; `/acp close` entfernt die Bindung.

Beispiele:

```text
/codex bind                                              # native Codex-Bindung, künftige Nachrichten hierher weiterleiten
/codex model gpt-5.4                                     # den gebundenen nativen Codex-Thread anpassen
/codex stop                                              # den aktiven nativen Codex-Durchlauf steuern
/acp spawn codex --bind here                             # expliziter ACP-Fallback für Codex
/acp spawn codex --thread auto                           # kann einen untergeordneten Thread/ein untergeordnetes Thema erstellen und dort binden
/acp spawn codex --bind here --cwd /workspace/repo       # dieselbe Chat-Bindung, Codex wird in /workspace/repo ausgeführt
```

<AccordionGroup>
  <Accordion title="Bindungsregeln und Exklusivität">
    - `--bind here` und `--thread ...` schließen sich gegenseitig aus.
    - `--bind here` funktioniert nur bei Kanälen, die die Bindung an die aktuelle Konversation anbieten; andernfalls gibt OpenClaw eine eindeutige Meldung zurück, dass dies nicht unterstützt wird. Bindungen bleiben über Gateway-Neustarts hinweg bestehen.
    - Bei Discord steuert `spawnSessions` die Erstellung untergeordneter Threads für `--thread auto|here` – nicht für `--bind here`.
    - Wenn Sie ohne `--cwd` einen anderen ACP-Agenten starten, übernimmt OpenClaw standardmäßig den Arbeitsbereich des **Ziel-Agenten**. Fehlende übernommene Pfade (`ENOENT`/`ENOTDIR`) fallen auf die Backend-Voreinstellung zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Startfehler ausgegeben.
    - Gateway-Verwaltungsbefehle bleiben in gebundenen Konversationen lokal – `/acp ...`-Befehle werden von OpenClaw verarbeitet, selbst wenn normaler Folgetext an die gebundene ACP-Sitzung weitergeleitet wird; `/status` und `/unfocus` bleiben ebenfalls lokal, wenn die Befehlsverarbeitung für diese Oberfläche aktiviert ist.

  </Accordion>
  <Accordion title="An Threads gebundene Sitzungen">
    Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind:

    - OpenClaw bindet einen Thread an eine ACP-Zielsitzung.
    - Folgenachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
    - ACP-Ausgaben werden an denselben Thread zurückgesendet.
    - Das Aufheben des Fokus, Schließen, Archivieren, Überschreiten des Inaktivitätszeitlimits oder Ablaufen des Höchstalters entfernt die Bindung.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` und `/unfocus` sind Gateway-Befehle und keine Prompts für das ACP-Harness.

    Erforderliche Funktionsschalter für threadgebundenes ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um die automatische ACP-Thread-Weiterleitung zu pausieren; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin).
    - Das Starten von Thread-Sitzungen durch Kanaladapter ist aktiviert (Voreinstellung: `true`):
      - Discord/Telegram: `session.threadBindings.spawnSessions=true`

    Die Unterstützung von Thread-Bindungen ist adapterspezifisch. Wenn der aktive Kanaladapter
    keine Thread-Bindungen unterstützt, gibt OpenClaw eine eindeutige Meldung zurück,
    dass diese nicht unterstützt werden oder nicht verfügbar sind.

  </Accordion>
  <Accordion title="Kanäle mit Thread-Unterstützung">
    - Jeder Kanaladapter, der Funktionen zur Sitzungs-/Thread-Bindung bereitstellt.
    - Aktuelle integrierte Unterstützung: **Discord**-Threads/-Kanäle, **Telegram**-Themen (Forenthemen in Gruppen/Supergruppen und Themen in Direktnachrichten).
    - Plugin-Kanäle können über dieselbe Bindungsschnittstelle Unterstützung hinzufügen.

  </Accordion>
</AccordionGroup>

## Persistente Kanalbindungen

Konfigurieren Sie für nicht flüchtige Workflows persistente ACP-Bindungen in den übergeordneten
`bindings[]`-Einträgen.

### Bindungsmodell

<ParamField path="bindings[].type" type='"acp"'>
  Kennzeichnet eine persistente ACP-Konversationsbindung.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifiziert die Zielkonversation. Kanalspezifische Strukturen:

- **Discord-Kanal/-Thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-Kanal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Bevorzugen Sie stabile Slack-IDs; Kanalbindungen erfassen auch Antworten innerhalb der Threads dieses Kanals.
- **Telegram-Forumsthema:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-DM/-Gruppe:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Verwenden Sie für direkte Chats E.164-Nummern wie `+15555550123` und für Gruppen WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us`.
- **iMessage-DM/-Gruppe:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Die ID des zuständigen OpenClaw-Agenten.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionale ACP-Überschreibung.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optionale bedienerseitige Bezeichnung.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionales Laufzeit-Arbeitsverzeichnis.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionale Backend-Überschreibung.
</ParamField>

### Laufzeitstandards pro Agent

Verwenden Sie `agents.entries.*.runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.entries.*.runtime.type="acp"`
- `agents.entries.*.runtime.acp.agent` (Harness-ID, z. B. `codex` oder `claude`)
- `agents.entries.*.runtime.acp.backend`
- `agents.entries.*.runtime.acp.mode`
- `agents.entries.*.runtime.acp.cwd`

**Überschreibungsrangfolge für ACP-gebundene Sitzungen:**

1. `bindings[].acp.*`
2. `agents.entries.*.runtime.acp.*`
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
- Konfigurierte ACP-Bindungen sind für ihre Sitzungsroute zuständig. Die Broadcast-Auffächerung des Kanals ersetzt bei einer übereinstimmenden Bindung nicht die konfigurierte ACP-Sitzung.
- In gebundenen Unterhaltungen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Laufzeitbindungen (beispielsweise durch Thread-Fokus-Abläufe erstellte) gelten weiterhin, sofern sie vorhanden sind.
- Bei agentenübergreifenden ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Arbeitsbereich des Zielagenten aus der Agentenkonfiguration.
- Nicht vorhandene übernommene Arbeitsbereichspfade greifen auf das standardmäßige Backend-Arbeitsverzeichnis zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Startfehler ausgegeben.

## ACP-Sitzungen starten

Es gibt zwei Möglichkeiten, eine ACP-Sitzung zu starten:

<Tabs>
  <Tab title="Über sessions_spawn">
    Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agentendurchlauf oder
    Werkzeugaufruf zu starten.

    ```json
    {
      "task": "Repository öffnen und fehlgeschlagene Tests zusammenfassen",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` verwendet standardmäßig `subagent`. Legen Sie daher `runtime: "acp"` für
    ACP-Sitzungen explizit fest. Wenn `agentId` weggelassen wird, verwendet OpenClaw
    bei entsprechender Konfiguration `acp.defaultAgent`. `mode: "session"` erfordert `thread: true`,
    damit eine dauerhaft gebundene Unterhaltung erhalten bleibt.
    </Note>

  </Tab>
  <Tab title="Über den Befehl /acp">
    Verwenden Sie `/acp spawn` zur expliziten Steuerung durch den Bediener im Chat.

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
  Harness-ID des ACP-Ziels. Greift auf `acp.defaultAgent` zurück, falls festgelegt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert den Ablauf zur Thread-Bindung an, sofern unterstützt.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` ist einmalig; `"session"` ist dauerhaft. Wenn `thread: true` festgelegt und
  `mode` weggelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig dauerhaftes
  Verhalten verwenden. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Angefordertes Laufzeit-Arbeitsverzeichnis (durch die Backend-/Laufzeitrichtlinie validiert).
  Wenn es weggelassen wird, übernimmt der ACP-Start bei entsprechender Konfiguration den
  Arbeitsbereich des Zielagenten; nicht vorhandene übernommene Pfade greifen auf die
  Backend-Standards zurück, während tatsächliche Zugriffsfehler zurückgegeben werden.
</ParamField>
<ParamField path="label" type="string">
  Bedienerseitige Bezeichnung, die im Sitzungs-/Bannertext verwendet wird.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Setzt eine vorhandene ACP-Sitzung fort, anstatt eine neue zu erstellen. Der Agent
  gibt seinen Unterhaltungsverlauf über `session/load` erneut wieder. Erfordert
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` überträgt Fortschrittszusammenfassungen des anfänglichen ACP-Durchlaufs als
  Systemereignisse an die anfordernde Sitzung zurück. OpenClaw speichert den vollständigen
  Weiterleitungsverlauf im SQLite-Zustand des untergeordneten Agenten und entfernt ihn
  zusammen mit der untergeordneten Sitzung. Übergeordnete Fortschrittsstreams zeigen
  standardmäßig Assistentenkommentare und ACP-Statusfortschritt an, sofern nicht
  `streaming.progress.commentary=false`. Discord verwendet für übergeordnete
  Vorschauen ebenfalls standardmäßig den Fortschrittsmodus, wenn kein Streammodus
  konfiguriert ist. Der Statusfortschritt berücksichtigt weiterhin `acp.stream.tagVisibility`,
  sodass Tags wie `plan` ausgeblendet bleiben, sofern sie nicht explizit
  aktiviert werden.
</ParamField>

ACP-Durchläufe mit `sessions_spawn` verwenden `agents.defaults.subagents.runTimeoutSeconds`
als standardmäßige Begrenzung für untergeordnete Durchläufe. Das Werkzeug akzeptiert keine
Zeitüberschreibungen pro Aufruf (`runTimeoutSeconds`/`timeoutSeconds` werden mit einem
Fehler zurückgewiesen, der zur Konfiguration des Standardwerts auffordert).

<ParamField path="model" type="string">
  Explizite Modellüberschreibung für die untergeordnete ACP-Sitzung. Codex-ACP-Starts
  normalisieren OpenAI-Referenzen wie `openai/gpt-5.4` vor `session/new` in die
  Codex-ACP-Startkonfiguration; Slash-Formen wie `openai/gpt-5.4/high` legen auch den
  Schlussfolgerungsaufwand von Codex ACP fest. Wenn der Wert weggelassen wird, verwendet
  `sessions_spawn({ runtime: "acp" })` vorhandene Modellstandards für Unteragenten (`agents.defaults.subagents.model` oder
  `agents.entries.*.subagents.model`), sofern konfiguriert; andernfalls verwendet das ACP-Harness sein
  eigenes Standardmodell. Andere Harnesses müssen ACP-`models` bekannt geben
  und `session/set_model` unterstützen; andernfalls schlagen OpenClaw/acpx eindeutig fehl,
  statt stillschweigend auf den Standard des Zielagenten zurückzugreifen.
</ParamField>
<ParamField path="thinking" type="string">
  Expliziter Denk-/Schlussfolgerungsaufwand. Für Codex ACP wird `minimal` einem
  geringen Aufwand zugeordnet, `low`/`medium`/`high`/`xhigh` werden direkt zugeordnet und bei
  `off` wird die Überschreibung des Schlussfolgerungsaufwands beim Start
  weggelassen. Wenn der Wert weggelassen wird, verwenden ACP-Starts vorhandene
  Denkstandards für Unteragenten und `agents.defaults.models["provider/model"].params.thinking` pro Modell für das ausgewählte
  Modell.
</ParamField>

## Bindungs- und Thread-Modi beim Start

<Tabs>
  <Tab title="--bind here|off">
    | Modus   | Verhalten                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Die aktuell aktive Unterhaltung an Ort und Stelle binden; schlägt fehl, wenn keine aktiv ist. |
    | `off`  | Keine Bindung für die aktuelle Unterhaltung erstellen.                          |

    Hinweise:

    - `--bind here` ist der einfachste Bedienerpfad für „diesen Kanal oder Chat mit Codex unterstützen“.
    - `--bind here` erstellt keinen untergeordneten Thread.
    - `--bind here` ist nur auf Kanälen verfügbar, die die Bindung der aktuellen Unterhaltung unterstützen.
    - `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus   | Verhalten                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, sofern unterstützt. |
    | `here` | Einen aktuell aktiven Thread voraussetzen; schlägt fehl, wenn keiner aktiv ist.                                                  |
    | `off`  | Keine Bindung. Die Sitzung wird ungebunden gestartet.                                                                 |

    Hinweise:

    - Auf Oberflächen ohne Thread-Bindung entspricht das Standardverhalten faktisch `off`.
    - Ein Thread-gebundener Start erfordert Unterstützung durch die Kanalrichtlinie:
      - Discord/Telegram: `session.threadBindings.spawnSessions=true`
    - Verwenden Sie `--bind here`, wenn Sie die aktuelle Unterhaltung anheften möchten, ohne einen untergeordneten Thread zu erstellen.

  </Tab>
</Tabs>

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Arbeitsbereiche oder übergeordnete
Hintergrundaufgaben sein. Der Zustellungspfad hängt von dieser Form ab.

<AccordionGroup>
  <Accordion title="Interaktive ACP-Sitzungen">
    Interaktive Sitzungen sind dazu vorgesehen, die Unterhaltung auf einer sichtbaren Chatoberfläche fortzusetzen:

    - `/acp spawn ... --bind here` bindet die aktuelle Unterhaltung an die ACP-Sitzung.
    - `/acp spawn ... --thread ...` bindet einen Kanal-Thread bzw. ein Kanalthema an die ACP-Sitzung.
    - Dauerhaft konfigurierte `bindings[].type="acp"` leiten übereinstimmende Unterhaltungen an dieselbe ACP-Sitzung weiter.

    Folgenachrichten in der gebundenen Unterhaltung werden direkt an die ACP-Sitzung
    weitergeleitet, und ACP-Ausgaben werden an denselben
    Kanal/Thread bzw. dasselbe Thema zurückgesendet.

    Was OpenClaw an das Harness sendet:

    - Normale gebundene Folgeanfragen werden als Prompt-Text gesendet, zuzüglich Anhängen, sofern Harness/Backend diese unterstützt.
    - `/acp`-Verwaltungsbefehle und lokale Gateway-Befehle werden vor der ACP-Weiterleitung abgefangen.
    - Zur Laufzeit generierte Abschlussereignisse werden pro Ziel materialisiert. OpenClaw-Agenten erhalten die interne Laufzeitkontext-Hülle von OpenClaw; externe ACP-Harnesses erhalten einen einfachen Prompt mit dem Ergebnis des untergeordneten Prozesses und einer Anweisung. Die unverarbeitete `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-Hülle darf niemals an externe Harnesses gesendet oder als ACP-Benutzertranskripttext gespeichert werden.
    - ACP-Transkripteinträge verwenden den benutzersichtbaren Auslösetext oder den einfachen Abschlussprompt. Interne Ereignismetadaten bleiben in OpenClaw nach Möglichkeit strukturiert und werden nicht als vom Benutzer verfasster Chatinhalt behandelt.

  </Accordion>
  <Accordion title="Übergeordnete einmalige ACP-Sitzungen">
    Einmalige ACP-Sitzungen, die von einem anderen Agentenlauf gestartet werden, sind untergeordnete
    Hintergrundprozesse, ähnlich wie Sub-Agenten:

    - Der übergeordnete Prozess fordert mit `sessions_spawn({ runtime: "acp", mode: "run" })` eine Aufgabe an.
    - Der untergeordnete Prozess wird in seiner eigenen ACP-Harness-Sitzung ausgeführt.
    - Untergeordnete Durchläufe werden auf derselben Hintergrund-Lane wie native Sub-Agent-Starts ausgeführt, sodass ein langsames ACP-Harness nicht die Arbeit unabhängiger Hauptsitzungen blockiert.
    - Der Abschluss wird über den Ankündigungspfad für Aufgabenabschlüsse zurückgemeldet. OpenClaw wandelt interne Abschlussmetadaten in einen einfachen ACP-Prompt um, bevor dieser an ein externes Harness gesendet wird, sodass Harnesses keine ausschließlich OpenClaw-internen Laufzeitkontextmarkierungen sehen.
    - Der übergeordnete Prozess formuliert das Ergebnis des untergeordneten Prozesses in normaler Assistentensprache neu, wenn eine benutzersichtbare Antwort sinnvoll ist.

    Behandeln Sie diesen Pfad **nicht** als Peer-to-Peer-Chat zwischen übergeordnetem und
    untergeordnetem Prozess. Der untergeordnete Prozess verfügt bereits über einen Abschlusskanal zurück zum übergeordneten Prozess.

  </Accordion>
  <Accordion title="sessions_send und A2A-Zustellung">
    `sessions_send` kann nach dem Start auf eine andere Sitzung zielen. Für normale Peer-
    Sitzungen verwendet OpenClaw nach dem Einfügen der Nachricht einen Agent-zu-Agent-
    Folgepfad (A2A):

    - Auf die Antwort der Zielsitzung warten.
    - Optional dem anfordernden Prozess und dem Ziel eine begrenzte Anzahl von Folgedurchläufen ermöglichen.
    - Das Ziel auffordern, eine Ankündigungsnachricht zu erstellen.
    - Diese Ankündigung an den sichtbaren Kanal oder Thread zustellen.

    Dieser A2A-Pfad ist ein Rückfallmechanismus für Peer-Sendevorgänge, bei denen der Absender eine
    sichtbare Folgeantwort benötigt. Er bleibt aktiviert, wenn eine unabhängige Sitzung ein ACP-Ziel sehen und
    ihm Nachrichten senden kann, beispielsweise bei weitreichenden `tools.sessions.visibility`-
    Einstellungen.

    OpenClaw überspringt die A2A-Folgekommunikation nur, wenn der anfordernde Prozess der übergeordnete Prozess seines
    eigenen, von ihm verwalteten einmaligen ACP-Kindprozesses ist. In diesem Fall kann A2A zusätzlich
    zum Aufgabenabschluss den übergeordneten Prozess mit dem Ergebnis des untergeordneten Prozesses aktivieren, die Antwort
    des übergeordneten Prozesses an den untergeordneten Prozess zurückleiten und eine Echo-
    Schleife zwischen übergeordnetem und untergeordnetem Prozess erzeugen. Das `sessions_send`-Ergebnis meldet für
    diesen Fall eines eigenen Kindprozesses `delivery.status="skipped"`, da der Abschlusspfad bereits
    für das Ergebnis zuständig ist.

  </Accordion>
  <Accordion title="Vorhandene Sitzung fortsetzen">
    Verwenden Sie `resumeSessionId`, um eine vorherige ACP-Sitzung fortzusetzen, anstatt
    eine neue zu starten. Der Agent spielt seinen Gesprächsverlauf über
    `session/load` erneut ab und setzt daher mit dem vollständigen bisherigen Kontext fort.

    ```json
    {
      "task": "Dort fortfahren, wo wir aufgehört haben – die verbleibenden Testfehler beheben",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Häufige Anwendungsfälle:

    - Eine Codex-Sitzung von Ihrem Laptop auf Ihr Telefon übergeben – weisen Sie Ihren Agenten an, dort fortzufahren, wo Sie aufgehört haben.
    - Eine Programmiersitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, nun ohne Benutzeroberfläche über Ihren Agenten.
    - Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Leerlaufzeitlimit unterbrochen wurde.

    Hinweise:

    - `resumeSessionId` gilt nur, wenn `runtime: "acp"`; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `streamTo` gilt nur, wenn `runtime: "acp"`; die standardmäßige Sub-Agent-Laufzeit ignoriert dieses ausschließlich für ACP vorgesehene Feld.
    - `resumeSessionId` ist eine hostlokale ACP-/Harness-Fortsetzungs-ID und kein OpenClaw-Kanalsitzungsschlüssel; OpenClaw prüft vor der Weiterleitung weiterhin die ACP-Startrichtlinie und die Richtlinie des Zielagenten, während das ACP-Backend oder Harness für die Autorisierung zum Laden dieser vorgelagerten ID zuständig ist.
    - `resumeSessionId` stellt den vorgelagerten ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin wie gewohnt für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
    - Der Zielagent muss `session/load` unterstützen (Codex und Claude Code tun dies).
    - Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Start mit einer eindeutigen Fehlermeldung fehl – es erfolgt kein stiller Rückfall auf eine neue Sitzung.

  </Accordion>
  <Accordion title="Smoke-Test nach der Bereitstellung">
    Führen Sie nach einer Gateway-Bereitstellung eine vollständige Live-End-to-End-Prüfung aus, anstatt
    sich auf Unit-Tests zu verlassen:

    1. Die bereitgestellte Gateway-Version und den Commit auf dem Zielhost überprüfen.
    2. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten öffnen.
    3. Diesen Agenten auffordern, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
    4. `accepted=yes`, eine echte `childSessionKey` und das Ausbleiben eines Validierungsfehlers überprüfen.
    5. Die temporäre Bridge-Sitzung bereinigen.

    Beschränken Sie das Gate auf `mode: "run"` und überspringen Sie `streamTo: "parent"` –
    threadgebundene `mode: "session"`- und Stream-Relay-Pfade sind separate, umfangreichere
    Integrationsdurchläufe.

  </Accordion>
</AccordionGroup>

## Sandbox-Kompatibilität

ACP-Sitzungen werden derzeit in der Host-Laufzeit ausgeführt, **nicht** innerhalb der OpenClaw-
Sandbox.

<Warning>
**Sicherheitsgrenze:**

- Das externe Harness kann gemäß seinen eigenen CLI-Berechtigungen und dem ausgewählten `cwd` lesen und schreiben.
- Die Sandbox-Richtlinie von OpenClaw umschließt die Ausführung des ACP-Harnesses **nicht**.
- OpenClaw erzwingt weiterhin ACP-Funktions-Gates, zulässige Agenten, Sitzungseigentum, Kanalbindungen und die Gateway-Zustellungsrichtlinie.
- Verwenden Sie `runtime: "subagent"` für Sandbox-erzwungene, OpenClaw-native Arbeit.

</Warning>

Aktuelle Einschränkungen:

- Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, werden ACP-Starts sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.

## Auflösung des Sitzungsziels

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`,
`session-id` oder `session-label`).

**Auflösungsreihenfolge:**

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann die Bezeichnung
2. Aktuelle Thread-Bindung (wenn dieses Gespräch/dieser Thread an eine ACP-Sitzung gebunden ist).
3. Rückfall auf die aktuelle anfordernde Sitzung.

Sowohl Bindungen des aktuellen Gesprächs als auch Thread-Bindungen werden in Schritt 2 berücksichtigt.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen eindeutigen Fehler zurück
(`Unable to resolve session target: ...`).

## ACP-Steuerung

| Befehl              | Funktion                                              | Beispiel                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional an das aktuelle Gespräch oder den Thread binden. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Durchlauf für die Zielsitzung abbrechen.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an die laufende Sitzung senden.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Bindung der Thread-Ziele aufheben.                  | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Laufzeitoptionen und Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Laufzeitmodus für die Zielsitzung festlegen.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Generische Laufzeitkonfigurationsoption schreiben.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeitarbeitsverzeichnisses festlegen.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil der Genehmigungsrichtlinie festlegen.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Zeitlimit (Sekunden) festlegen.                            | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells festlegen.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Sitzungslaufzeitoptionen entfernen.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Speicher auflisten.                      | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten und umsetzbare Korrekturen.           | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben.             | `/acp install`                                                |

Laufzeitsteuerungen (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` und `reset-options`) erfordern
eine Eigentümeridentität von externen Kanälen und `operator.admin` von internen
Gateway-Clients. Autorisierte Absender, die keine Eigentümer sind, können weiterhin `sessions`,
`doctor`, `install` und `help` verwenden. Für Absender, die keine Eigentümer sind, listet `/acp sessions`
nur die aktuell gebundene oder anfordernde Sitzung auf; Eigentümeridentitäten und
`operator.admin`-Clients sehen alle kürzlich verwendeten Sitzungen.

`/acp status` zeigt die effektiven Laufzeitoptionen sowie Laufzeit- und
Backend-Sitzungskennungen an. Fehler wegen nicht unterstützter Steuerungen werden
eindeutig angezeigt, wenn einem Backend eine Fähigkeit fehlt. Befehle, die Ziel-Token akzeptieren
(`session-key`, `session-id` oder `session-label`), lösen diese über die Gateway-
Sitzungserkennung auf, einschließlich benutzerdefinierter agentenspezifischer `session.store`-Stammverzeichnisse. `/acp sessions`
akzeptiert kein Ziel-Token.

### Zuordnung der Laufzeitoptionen

`/acp` verfügt über Komfortbefehle und einen generischen Setter. Gleichwertige Vorgänge:

| Befehl                      | Entspricht                              | Hinweise                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Laufzeit-Konfigurationsschlüssel `model`           | Für Codex ACP normalisiert OpenClaw `openai/<model>` zur Adapter-Modell-ID und ordnet Reasoning-Suffixe mit Schrägstrich wie `openai/gpt-5.4/high` `reasoning_effort` zu.                                         |
| `/acp set thinking <level>`  | kanonische Option `thinking`          | OpenClaw sendet das vom Backend angegebene Äquivalent, sofern vorhanden, wobei `thinking`, dann `effort`, `reasoning_effort` oder `thought_level` bevorzugt wird. Für Codex ACP ordnet der Adapter Werte `reasoning_effort` zu. |
| `/acp permissions <profile>` | kanonische Option `permissionProfile` | OpenClaw sendet das vom Backend angegebene Äquivalent, sofern vorhanden, beispielsweise `approval_policy`, `permission_profile`, `permissions` oder `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | kanonische Option `timeoutSeconds`    | OpenClaw sendet das vom Backend angegebene Äquivalent, sofern vorhanden, beispielsweise `timeout` oder `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | Überschreibung des Laufzeit-Arbeitsverzeichnisses                 | Direkte Aktualisierung.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generisch                              | `key=cwd` verwendet den Pfad der Arbeitsverzeichnis-Überschreibung.                                                                                                                                                                      |
| `/acp reset-options`         | löscht alle Laufzeitüberschreibungen         | -                                                                                                                                                                                                          |

## acpx-Harness, Plugin-Einrichtung und Berechtigungen

Informationen zur Konfiguration des acpx-Harness (Aliase für Claude Code / Codex / Gemini CLI),
zu den MCP-Bridges für Plugin-Tools und OpenClaw-Tools sowie zu ACP-Berechtigungsmodi
finden Sie unter [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                                   | Wahrscheinliche Ursache                                                                                                           | Behebung                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Backend-Plugin fehlt, ist deaktiviert oder wird durch `plugins.allow` blockiert.                                                       | Installieren und aktivieren Sie das Backend-Plugin, nehmen Sie `acpx` in `plugins.allow` auf, wenn diese Zulassungsliste festgelegt ist, und führen Sie anschließend `/acp doctor` aus.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP ist global deaktiviert.                                                                                                 | Legen Sie `acp.enabled=true` fest.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Die automatische Weiterleitung normaler Thread-Nachrichten ist deaktiviert.                                                               | Legen Sie `acp.dispatch.enabled=true` fest, um die automatische Thread-Weiterleitung wiederaufzunehmen; explizite `sessions_spawn({ runtime: "acp" })`-Aufrufe funktionieren weiterhin.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Der Agent befindet sich nicht in der Zulassungsliste.                                                                                                | Verwenden Sie einen zulässigen `agentId` oder aktualisieren Sie `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` meldet direkt nach dem Start, dass das Backend nicht bereit ist                               | Das Backend-Plugin fehlt, ist deaktiviert, wird durch eine Zulassungs-/Sperrrichtlinie blockiert oder die konfigurierte ausführbare Datei ist nicht verfügbar.        | Installieren/aktivieren Sie das Backend-Plugin, führen Sie `/acp doctor` erneut aus und prüfen Sie den Installations- oder Richtlinienfehler des Backends, falls sein Zustand weiterhin fehlerhaft ist.                                           |
| Harness-Befehl nicht gefunden                                                                 | Die Adapter-CLI ist nicht installiert, das externe Plugin fehlt oder der erstmalige Abruf über `npx` ist bei einem Nicht-Codex-Adapter fehlgeschlagen. | Führen Sie `/acp doctor` aus, installieren Sie den Adapter auf dem Gateway-Host bzw. wärmen Sie ihn dort vor oder konfigurieren Sie den acpx-Agentenbefehl explizit.                                                      |
| Das Harness meldet, dass das Modell nicht gefunden wurde                                                          | Die Modell-ID ist für einen anderen Provider bzw. ein anderes Harness gültig, jedoch nicht für dieses ACP-Ziel.                                                | Verwenden Sie ein von diesem Harness aufgeführtes Modell, konfigurieren Sie das Modell im Harness oder lassen Sie die Überschreibung weg.                                                                            |
| Das Harness meldet einen Authentifizierungsfehler des Anbieters                                                        | OpenClaw funktioniert ordnungsgemäß, aber die Ziel-CLI bzw. der Provider ist nicht angemeldet.                                                     | Melden Sie sich an oder stellen Sie den erforderlichen Provider-Schlüssel in der Umgebung des Gateway-Hosts bereit.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Ungültiges Schlüssel-, ID- oder Bezeichnungs-Token.                                                                                                | Führen Sie `/acp sessions` aus, kopieren Sie den Schlüssel bzw. die Bezeichnung exakt und versuchen Sie es erneut.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` wurde ohne aktive bindungsfähige Unterhaltung verwendet.                                                            | Wechseln Sie zum Ziel-Chat/-Kanal und versuchen Sie es erneut oder verwenden Sie einen ungebundenen Start.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Der Adapter unterstützt keine ACP-Bindung an die aktuelle Unterhaltung.                                                             | Verwenden Sie `/acp spawn ... --thread ...`, sofern unterstützt, konfigurieren Sie `bindings[]` auf oberster Ebene oder wechseln Sie zu einem unterstützten Kanal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                                                         | Wechseln Sie zum Ziel-Thread oder verwenden Sie `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Ein anderer Benutzer ist Eigentümer des aktiven Bindungsziels.                                                                           | Binden Sie es als Eigentümer erneut oder verwenden Sie eine andere Unterhaltung bzw. einen anderen Thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Der Adapter unterstützt keine Thread-Bindung.                                                                               | Verwenden Sie `--thread off` oder wechseln Sie zu einem unterstützten Adapter/Kanal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Die ACP-Laufzeit wird auf dem Host ausgeführt; die Sitzung des Anforderers läuft in einer Sandbox.                                                              | Verwenden Sie `runtime="subagent"` aus Sandbox-Sitzungen oder starten Sie ACP aus einer Sitzung ohne Sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` wurde für die ACP-Laufzeit angefordert.                                                                         | Verwenden Sie `runtime="subagent"`, wenn eine Sandbox erforderlich ist, oder verwenden Sie ACP mit `sandbox="inherit"` aus einer Sitzung ohne Sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Das Ziel-Harness unterstützt keinen generischen ACP-Modellwechsel.                                                        | Verwenden Sie ein Harness, das ACP `models`/`session/set_model` unterstützt, verwenden Sie Codex-ACP-Modellreferenzen oder konfigurieren Sie das Modell direkt im Harness, sofern es über ein eigenes Start-Flag verfügt. |
| Fehlende ACP-Metadaten für gebundene Sitzung                                                    | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                                                                    | Erstellen Sie sie mit `/acp spawn` neu und binden bzw. fokussieren Sie anschließend den Thread erneut.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blockiert Schreibvorgänge/Ausführungen in einer nicht interaktiven ACP-Sitzung.                                                    | Setzen Sie `plugins.entries.acpx.config.permissionMode` auf `approve-all` und starten Sie das Gateway neu. Siehe [Berechtigungskonfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt frühzeitig mit wenig Ausgabe fehl                                                | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert.                                        | Prüfen Sie die Gateway-Protokolle auf `AcpRuntimeError`. Legen Sie für vollständige Berechtigungen `permissionMode=approve-all` und für eine kontrollierte Funktionseinschränkung `nonInteractivePermissions=deny` fest.        |
| ACP-Sitzung bleibt nach Abschluss der Arbeit unbegrenzt hängen                                     | Der Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet.                                                    | Aktualisieren Sie OpenClaw; die aktuelle acpx-Bereinigung beendet veraltete Wrapper- und Adapterprozesse, die OpenClaw gehören, beim Schließen und beim Start des Gateways.                                             |
| Harness sieht `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Eine interne Ereignishülle ist über die ACP-Grenze gelangt.                                                                | Aktualisieren Sie OpenClaw und führen Sie den Abschlussablauf erneut aus; externe Harnesses sollten ausschließlich einfache Abschlussaufforderungen erhalten.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` gehört zur
nativen Codex-Hook-Weiterleitung, nicht zu ACP/acpx. Starten Sie in einem gebundenen Codex-Chat eine
neue Sitzung mit `/new` oder `/reset`; wenn dies einmal funktioniert und der Fehler dann beim
nächsten nativen Tool-Aufruf erneut auftritt, starten Sie den Codex-App-Server oder das OpenClaw-Gateway neu,
anstatt `/new` zu wiederholen. Siehe
[Fehlerbehebung für das Codex-Harness](/de/plugins/codex-harness#troubleshooting).
</Note>

## Verwandte Themen

- [ACP-Agenten – Einrichtung](/de/tools/acp-agents-setup)
- [Agent senden](/de/tools/agent-send)
- [CLI-Backends](/de/gateway/cli-backends)
- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (Bridge-Modus)](/de/cli/acp)
- [Sub-Agenten](/de/tools/subagents)
