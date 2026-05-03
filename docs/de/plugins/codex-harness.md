---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, anstatt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agentenläufe über die gebündelte Codex-App-Server-Testumgebung ausführen
title: Codex-Ausführungsumgebung
x-i18n:
    generated_at: "2026-05-03T21:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Durchläufe über den
Codex App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung verwalten soll:
Modellerkennung, native Thread-Wiederaufnahme, native Compaction und App-Server-Ausführung.
OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Freigaben, Medienzustellung und die sichtbare Transkriptspiegelung.

Wenn ein Quell-Chat-Durchlauf über das Codex-Harness läuft, verwenden sichtbare Antworten standardmäßig
das OpenClaw-Tool `message`, sofern die Bereitstellung `messages.visibleReplies`
nicht explizit konfiguriert hat. Der Agent kann seinen Codex-Durchlauf weiterhin privat abschließen;
er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um abschließende Antworten in direkten Chats auf dem
alten automatischen Zustellpfad zu halten.

Codex-Heartbeat-Durchläufe erhalten standardmäßig auch das Tool `heartbeat_respond`, sodass der
Agent festhalten kann, ob das Aufwecken still bleiben oder benachrichtigen soll, ohne diesen
Kontrollfluss im Abschlusstext zu kodieren.

Heartbeat-spezifische Initiative-Anleitung wird als Codex-Entwicklerinstruktion im Kollaborationsmodus
direkt im Heartbeat-Durchlauf gesendet. Normale Chat-Durchläufe stellen stattdessen
den Codex-Default-Modus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Laufzeit-Prompt mitzuführen.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Nutzer, die „Codex in OpenClaw“ möchten, wollen diese Route: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an und führen Sie dann eingebettete Agent-Durchläufe über die native
Codex-App-Server-Laufzeit aus. Die Modellreferenz bleibt weiterhin kanonisch als
`openai/gpt-*`; Abonnement-Authentifizierung kommt aus dem Codex-Konto/-Profil, nicht
aus einem Modellpräfix `openai-codex/*`.

Melden Sie sich zuerst mit Codex OAuth an, falls noch nicht geschehen:

```bash
openclaw models auth login --provider openai-codex
```

Aktivieren Sie dann das gebündelte `codex`-Plugin und erzwingen Sie die Codex-Laufzeit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort ebenfalls `codex` auf:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Verwenden Sie nicht `openai-codex/gpt-*`, wenn Sie die native Codex-Laufzeit meinen. Dieses Präfix
ist die explizite Route „Codex OAuth über PI“. Konfigurationsänderungen gelten für neue oder
zurückgesetzte Sitzungen; bestehende Sitzungen behalten ihre aufgezeichnete Laufzeit.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere getrennte Fähigkeiten bereit:

| Fähigkeit                         | Wie Sie sie verwenden                              | Was sie bewirkt                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Laufzeit      | `agentRuntime.id: "codex"`                          | Führt eingebettete OpenClaw-Agent-Durchläufe über den Codex App-Server aus.   |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex-App-Server-Provider/-Katalog | `codex`-Interna, über das Harness bereitgestellt    | Ermöglicht der Laufzeit, App-Server-Modelle zu erkennen und zu validieren.    |
| Codex-Pfad für Medienverständnis  | `codex/*` Bildmodell-Kompatibilitätspfade           | Führt begrenzte Codex-App-Server-Durchläufe für unterstützte Bildverständnismodelle aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks um Codex-native Ereignisse             | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Das Aktivieren des Plugins stellt diese Fähigkeiten bereit. Es bewirkt **nicht**, dass:

- Codex für jedes OpenAI-Modell verwendet wird
- `openai-codex/*`-Modellreferenzen in die native Laufzeit umgewandelt werden
- ACP/acpx zum standardmäßigen Codex-Pfad wird
- bestehende Sitzungen, die bereits eine PI-Laufzeit aufgezeichnet haben, per Hot-Switch umgestellt werden
- OpenClaw-Kanalzustellung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichtenrouting ersetzt werden

Dasselbe Plugin verwaltet auch die native Chat-Steuerbefehlsoberfläche `/codex`. Wenn
das Plugin aktiviert ist und der Nutzer darum bittet, Codex-Threads aus dem Chat zu binden,
wiederaufzunehmen, zu steuern, zu stoppen oder zu prüfen, sollten Agenten `/codex ...` gegenüber ACP bevorzugen. ACP bleibt
der explizite Fallback, wenn der Nutzer ACP/acpx anfordert oder den ACP-
Codex-Adapter testet.

Native Codex-Durchläufe behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht.
Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkript-Einträge
- `before_agent_finalize` über Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können außerdem laufzeitneutrale Tool-Ergebnis-Middleware registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
Plugin-Hook `tool_result_persist`, der von OpenClaw verwaltete Transkript-
Tool-Ergebnis-Schreibvorgänge transformiert.

Zu den Semantiken der Plugin-Hooks selbst siehe [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` beibehalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung wünschen. Alte `codex/*`-Modellreferenzen wählen das
Harness aus Kompatibilitätsgründen weiterhin automatisch aus, laufzeitgestützte alte Provider-Präfixe werden
jedoch nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, anstatt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Codex-OAuth-/Abonnementpfad, und
native App-Server-Ausführung bleibt eine explizite Laufzeitauswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                               | Modellreferenz            | Laufzeitkonfiguration                  | Auth-/Profilroute           | Erwartetes Statuslabel         |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ChatGPT/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`        |
| OpenAI API über normalen OpenClaw-Runner            | `openai/gpt-*`             | ausgelassen oder `runtime: "pi"`       | OpenAI API-Schlüssel         | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-Abonnement über PI                    | `openai-codex/gpt-*`       | ausgelassen oder `runtime: "pi"`       | OpenAI-Codex-OAuth-Provider  | `Runtime: OpenClaw Pi Default` |
| Gemischte Provider mit konservativem Auto-Modus     | providerspezifische Refs   | `agentRuntime.id: "auto"`              | Pro ausgewähltem Provider    | Hängt von ausgewählter Laufzeit ab |
| Explizite Codex-ACP-Adapter-Sitzung                 | abhängig von ACP-Prompt/-Modell | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Auth             | ACP-Aufgaben-/Sitzungsstatus   |

Die wichtige Trennung ist Provider gegenüber Laufzeit:

- `openai-codex/*` beantwortet: „Welche Provider-/Auth-Route soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet: „Welche Schleife soll diesen
  eingebetteten Durchlauf ausführen?“
- `/codex ...` beantwortet: „Welche native Codex-Unterhaltung soll dieser Chat binden
  oder steuern?“
- ACP beantwortet: „Welchen externen Harness-Prozess soll acpx starten?“

## Wählen Sie das richtige Modellpräfix

Routen der OpenAI-Familie sind präfixspezifisch. Für die übliche Einrichtung mit Abonnement plus
nativer Codex-Laufzeit verwenden Sie `openai/*` mit `agentRuntime.id: "codex"`.
Verwenden Sie `openai-codex/*` nur, wenn Sie absichtlich Codex OAuth über PI möchten:

| Modellreferenz                                | Laufzeitpfad                                | Verwenden, wenn                                                           |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing    | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth über OpenClaw/PI          | Sie ChatGPT/Codex-Abonnement-Auth mit dem standardmäßigen PI-Runner möchten. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                     | Sie ChatGPT/Codex-Abonnement-Auth mit nativer Codex-Ausführung möchten.   |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel- als auch auf Codex-Abonnementrouten erscheinen,
wenn Ihr Konto diese bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex-App-Server-
Harness für die native Codex-Laufzeit, `openai-codex/gpt-5.5` für PI OAuth oder
`openai/gpt-5.5` ohne Codex-Laufzeit-Override für direkten API-Schlüssel-Traffic.

Alte `codex/gpt-*`-Refs bleiben als Kompatibilitätsaliase akzeptiert. Die Doctor-
Kompatibilitätsmigration schreibt alte primäre Laufzeit-Refs in kanonische Modell-
Refs um und zeichnet die Laufzeitrichtlinie separat auf, während ausschließlich als Fallback genutzte alte Refs
unverändert bleiben, weil die Laufzeit für den gesamten Agent-Container konfiguriert wird.
Neue PI-Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden; neue native
App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-
Codex-OAuth-Provider-Pfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis über
einen begrenzten Codex-App-Server-Durchlauf laufen soll. Das Codex-App-Server-Modell muss
Bild-Eingabeunterstützung ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Mediendurchlauf
startet.

Verwenden Sie `/status`, um das wirksame Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Gateway-Eintrag `agent harness selected`. Er
enthält die ausgewählte Harness-ID, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und,
im Modus `auto`, das Unterstützungsergebnis jedes Plugin-Kandidaten.

### Was doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn all dies zutrifft:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agenten ist `openai-codex/*`
- die wirksame Laufzeit dieses Agenten ist nicht `codex`

Diese Warnung existiert, weil Nutzer oft erwarten, dass „Codex-Plugin aktiviert“
„native Codex-App-Server-Laufzeit“ bedeutet. OpenClaw macht diesen Sprung nicht. Die Warnung
bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-
  Ausführung beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Laufzeitänderung weiterhin `/new` oder `/reset`,
  da Sitzungs-Laufzeit-Pins haftend sind.

Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Durchlauf läuft,
zeichnet OpenClaw die ausgewählte Harness-ID in dieser Sitzung auf und verwendet sie für
spätere Durchläufe in derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn künftige Sitzungen ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex umschalten. Dadurch wird vermieden, ein Transkript durch
zwei inkompatible native Sitzungssysteme wiederzugeben.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer
Konfigurationsänderung auf Codex umzustellen.

`/status` zeigt die effektive Modelllaufzeit. Der Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, daher wirken sich lokale `codex`-Befehle auf `PATH`
  nicht auf den normalen Harness-Start aus.
- Codex-Authentifizierung, verfügbar für den App-Server-Prozess oder für OpenClaws Codex-Authentifizierungsbrücke.
  Lokale App-Server-Starts verwenden für jeden Agenten ein von OpenClaw verwaltetes Codex-Home
  und ein isoliertes untergeordnetes `HOME`, daher lesen sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Skills, Plugins, Konfiguration, Thread-Status oder native
  `$HOME/.agents/skills`.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus dem Codex-CLI-Konto
oder einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex behandelt `AGENTS.md` selbst über die native Projektdokument-Erkennung. OpenClaw
schreibt keine synthetischen Codex-Projektdokument-Dateien und verlässt sich nicht auf Codex-Fallback-
Dateinamen für Persona-Dateien, da Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-
Dateien (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, wenn vorhanden) auf und leitet sie über Codex-
Konfigurationsanweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleibt
`SOUL.md` und verwandter Workspace-Persona-/Profilkontext sichtbar, ohne
`AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Runtime gilt für jede
eingebettete Runde dieses Agenten oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Runtime erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diese Runde stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agenten mit `agentRuntime.id: "codex"`.
- Behalten Sie den Standardagenten auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-Referenzen `codex/*` nur zur Kompatibilität. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Richtlinie bevorzugen.

Dieses Beispiel belässt den Standardagenten bei der normalen automatischen Auswahl und
fügt einen separaten Codex-Agenten hinzu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Mit dieser Form:

- Der Standardagent `main` verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet den Codex-App-Server-Harness.
- Wenn Codex für den Agenten `codex` fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  statt stillschweigend PI zu verwenden.

## Agentenbefehls-Routing

Agenten sollten Benutzeranfragen nach Absicht routen, nicht nur nach dem Wort „Codex“:

| Benutzer fragt nach ...                                | Agent sollte verwenden ...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                      |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                   |
| „Mein ChatGPT-/Codex-Abonnement mit Codex-Runtime verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`  |
| „Mein ChatGPT-/Codex-Abonnement über PI verwenden“     | `openai-codex/*`-Modellreferenzen                |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Unteragenten |

OpenClaw bewirbt ACP-Spawn-Anleitungen gegenüber Agenten nur, wenn ACP aktiviert,
dispatchbar und durch ein geladenes Runtime-Backend unterstützt ist. Wenn ACP nicht verfügbar ist,
sollten System-Prompt und Plugin-Skills den Agenten kein ACP-
Routing beibringen.

## Nur-Codex-Bereitstellungen

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agentenrunde
Codex verwendet. Explizite Plugin-Runtimes schlagen geschlossen fehl und werden niemals stillschweigend
über PI erneut versucht:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Umgebungsüberschreibung:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agenten nur für Codex konfigurieren, während der Standardagent die normale
automatische Auswahl behält:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine frische
OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt bei Bedarf seinen Sidecar-App-Server-
Thread fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde den Harness erneut aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder ein Timeout auftritt, verwendet es einen gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Sie können die Erkennung unter `plugins.entries.codex.config.discovery` anpassen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht abfragen und beim
Fallback-Katalog bleiben soll:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-Server-Verbindung und Richtlinie

Standardmäßig startet das Plugin OpenClaws verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden, statt an die separat installierte
Codex-CLI, die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn
Sie bewusst eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerk-Tools verwenden, ohne
an nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um sich für von Codex Guardian geprüfte Genehmigungen zu entscheiden, setzen Sie `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Der Guardian-Modus verwendet Codex' nativen Auto-Review-Genehmigungspfad. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerk-
zugriff hinzuzufügen, routet Codex diese Genehmigungsanfrage an den nativen Prüfer statt an eine
menschliche Eingabeaufforderung. Der Prüfer wendet Codex' Risikorahmen an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus wünschen,
aber weiterhin unbeaufsichtigte Agenten Fortschritte machen müssen.

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Entscheidungen mischen können. Der ältere Reviewer-Wert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, aber neue Konfigurationen sollten
`auto_review` verwenden.

Für einen bereits laufenden App-Server verwenden Sie WebSocket-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio-App-Server-Starts erben standardmäßig OpenClaws Prozessumgebung,
aber OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt sowohl
`CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unter dem OpenClaw-
Status dieses Agenten. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-
Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Status auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen
Codex-CLI-Home des Operators einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin durch OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun dies nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agenten werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agenten-
Workspace. Native Codex-Plugins, Hooks und Konfigurationsdateien werden gemeldet oder archiviert,
damit sie manuell geprüft werden können, statt automatisch aktiviert zu werden, da sie
Befehle ausführen, MCP-Server freigeben oder Anmeldeinformationen enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements sieht, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch
bleiben Gateway-weite API-Schlüssel für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale stdio-Env-Key-Fallback verwenden den App-Server-
Login statt geerbter Child-Process-Umgebungsvariablen. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu
`appServer.clearEnv` hinzu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` wirkt sich nur auf den erzeugten untergeordneten Codex-App-Server-Prozess aus.

Dynamische Codex-Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus stellt
OpenClaw keine dynamischen Tools bereit, die native Codex-Workspace-
Operationen duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                           |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um dem Codex-App-Server den vollständigen dynamischen OpenClaw-Tool-Satz bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden.    |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                   |
| `command`           | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Lassen Sie dies ungesetzt, um die verwaltete Binärdatei zu verwenden; setzen Sie es nur für eine ausdrückliche Überschreibung.                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                 |
| `url`               | nicht gesetzt                            | WebSocket-URL des App-Servers.                                                                                                                                                                                                     |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                          |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                      |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für OpenClaws Codex-Isolation pro Agent bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                       |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder durch Guardian geprüfte Ausführung.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird.                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungs-Prompts prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                          |
| `serviceTier`       | nicht gesetzt                            | Optionaler Codex-App-Server-Service-Tier: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                  |

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht OpenClaw
das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene dynamische Tool-Antwort an Codex zurück, damit
der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine Codex-Turn-bezogene App-Server-Anfrage geantwortet hat, erwartet das Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server nach dieser Antwort 60 Sekunden lang still bleibt, unterbricht OpenClaw nach bestem Ermessen
den Codex-Turn, zeichnet einen diagnostischen Timeout auf und gibt die
OpenClaw-Sitzungs-Lane frei, damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten
nativen Turn eingereiht werden.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den Rest der Einrichtung des Codex-Harnesses.

## Computernutzung

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft, ob der
`computer-use`-MCP-Server verfügbar ist, und lässt dann Codex die nativen
MCP-Tool-Aufrufe während Turns im Codex-Modus verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Flows registrieren Sie
`cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für den Unterschied
zwischen Codex-eigener Computer Use und direkter MCP-Registrierung.

Minimale Konfiguration:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Die Einrichtung kann über die Befehlsoberfläche geprüft oder installiert werden:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use ist macOS-spezifisch und kann lokale OS-Berechtigungen erfordern, bevor der
Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist und der MCP-
Server nicht verfügbar ist, schlagen Turns im Codex-Modus fehl, bevor der Thread startet, statt
stillschweigend ohne die nativen Computer-Use-Tools zu laufen. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Grenzen des Remote-Katalogs, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex-Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, falls Codex
noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new` oder `/reset` nach
Änderungen an Runtime- oder Computer-Use-Konfiguration, damit vorhandene Sitzungen keine alte
PI- oder Codex-Thread-Bindung behalten.

## Häufige Rezepte

Lokaler Codex mit standardmäßigem stdio-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Nur-Codex-Harness-Validierung:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Durch Guardian geprüfte Codex-Genehmigungen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Remote-App-Server mit expliziten Headern:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Der Modellwechsel bleibt OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an
einen vorhandenen Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und den Service-Tier erneut an den
App-Server. Ein Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den angehängten Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer Use Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer Use Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

### Gängiger Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Überraschendes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanforderung einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, weil die Sitzung den Codex-Harness verwendet, außerdem
   das relevante Codex-Feedbackpaket an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnosereply in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, eine Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen `Inspect locally`-
   Befehl in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, sodass Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum es ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-
Feedbackupload für den aktuell angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnosepaket wünschen. Für die meisten Supportberichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der OpenClaw-Kern stellt außerdem das nur für Besitzer verfügbare `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt die Vorbemerkung zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine explizite Exec-Genehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und einer Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert
dieselbe Genehmigung außerdem das Senden der relevanten Codex-Feedbackpakete an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird, listet
vor der Genehmigung aber keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Besitzer in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während die
Diagnosevorbemerkung, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über
die private Genehmigungsroute an den Besitzer gesendet werden. Wenn es keine private Besitzerroute gibt,
lehnt OpenClaw die Gruppenanfrage ab und fordert den Besitzer auf, sie aus einer Direktnachricht auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex-App-Servers auf und fordert
den App-Server auf, Protokolle für jeden aufgelisteten Thread und erzeugte Codex-Subthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Feedbackpfad von Codex zu OpenAI-
Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnosereply listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt die erweiterte Historie
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie einen Fehler in einer Kanalunterhaltung bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum es eine
bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist in der Regel, zuerst
`/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Threads des Codex-App-Servers abrufen und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Besitzer                 | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-App-Server-Extension-Middleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools. |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine Projekt- oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Steuerungen auf Codex-Ebene; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks verfügbar gemacht.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im
Harness-Adapter auslöst. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über den App-Server oder native Hook-
Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Benachrichtigungen des Codex-App-Servers
und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws `before_compaction`-, `after_compaction`-, `llm_input`- und
`llm_output`-Ereignisse sind Beobachtungen auf Adapterebene, keine Byte-für-Byte-Erfassungen
interner Codex-Anforderungs- oder Compaction-Payloads.

Native Codex-`hook/started`- und `hook/completed`-App-Server-Benachrichtigungen werden
als `codex_app_server.hook`-Agent-Ereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex-Runtime v1:

| Oberfläche                                    | Unterstützung                           | Warum                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                             | Der Codex-App-Server besitzt den OpenAI-Durchlauf, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                     |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                             | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                  |
| Dynamische OpenClaw-Tools                     | Unterstützt                             | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                       |
| Prompt- und Kontext-Plugins                   | Unterstützt                             | OpenClaw baut Prompt-Overlays und projiziert Kontext in den Codex-Durchlauf, bevor der Thread gestartet oder fortgesetzt wird.                                                                         |
| Lebenszyklus der Kontext-Engine               | Unterstützt                             | Zusammenstellen, Ingest oder Wartung nach dem Durchlauf sowie Compaction-Koordination der Kontext-Engine laufen für Codex-Durchläufe.                                                                 |
| Dynamische Tool-Hooks                         | Unterstützt                             | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um OpenClaw-eigene dynamische Tools herum.                                                                                  |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                               |
| Final-Answer-Revision-Gate                    | Über das native Hook-Relay unterstützt  | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                       |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                | Über das native Hook-Relay unterstützt  | Codex `PermissionRequest` kann über die OpenClaw-Richtlinie geroutet werden, sofern die Runtime sie bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzergenehmigungspfad fort. |
| App-Server-Trajektorieerfassung               | Unterstützt                             | OpenClaw zeichnet die Anforderung auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                               |

Nicht unterstützt in Codex-Runtime v1:

| Oberfläche                                          | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzte Tool-Eingaben.                   |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna verändern. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.    |
| `tool_result_persist` für Codex-native Tool-Einträge | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Einträge.                                         | Transformierte Einträge könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste behaltener/verworfener Einträge, kein Token-Delta und keine Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                     |
| Eingriff in Compaction                              | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                               | Codex-Pre-/Post-Compaction-Hooks hinzufügen, wenn Plugins native Compaction per Veto verhindern oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber der Codex-Kern erstellt die finale OpenAI API-Anfrage intern.         | Benötigt ein Codex-Modellanfragen-Tracing-Ereignis oder eine Debug-API.                  |

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agents.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Zustellpfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag es
benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Allow- oder Deny-Entscheidungen
zurück, wenn die Policy entscheidet. Ein Ergebnis ohne Entscheidung ist kein Allow. Codex behandelt es als
keine Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.

Codex-MCP-Tool-Genehmigungsabfragen werden durch den Genehmigungsfluss von OpenClaws Plugin
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste eingereihte Folge-Nachricht beantwortet diese native
Server-Anfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Abfrageanforderungen
schlagen weiterhin geschlossen fehl.

Active-Run-Queue-Steuerung wird auf Codex-App-Server-`turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chat-Nachrichten
für das konfigurierte Ruhefenster und sendet sie als eine `turn/steer`-Anfrage in
Eingangsreihenfolge. Der Legacy-Modus `queue` sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Folge-Queue, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steuerungs-Queue](/de/concepts/queue-steering).

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an
den Codex-App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Die
Spiegelung enthält den Benutzer-Prompt, finalen Assistententext und schlanke Codex-
Reasoning- oder Plan-Einträge, wenn der App-Server sie ausgibt. Heute zeichnet OpenClaw nur
native Start- und Abschluss-Signale der Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebniseinträge um. Es wird nur angewendet, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Build-suffigierte
Versionen wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agent ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn es bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
ein Timeout hat, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandte Themen

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
