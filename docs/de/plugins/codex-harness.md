---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agent-Turns über die mitgelieferte Codex-App-Server-Harness ausführen
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-05-03T06:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, native Thread-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien,
Modellauswahl, Tools, Genehmigungen, Medienbereitstellung und die sichtbare
Transkriptspiegelung.

Wenn ein Quell-Chat-Turn über den Codex-Harness läuft, verwenden sichtbare
Antworten standardmäßig das OpenClaw-`message`-Tool, wenn die Bereitstellung
`messages.visibleReplies` nicht explizit konfiguriert hat. Der Agent kann seinen
Codex-Turn weiterhin privat abschließen; er postet nur dann im Kanal, wenn er
`message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, damit Abschlussantworten in direkten
Chats weiterhin über den bisherigen automatischen Bereitstellungspfad laufen.

Codex-Heartbeat-Turns erhalten standardmäßig außerdem das Tool
`heartbeat_respond`, damit der Agent festhalten kann, ob der Wake still bleiben
oder benachrichtigen soll, ohne diesen Kontrollfluss im Abschlusstext zu
kodieren.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diese Route:
Melden Sie sich mit einem ChatGPT-/Codex-Abonnement an und führen Sie dann
eingebettete Agent-Turns über die native Codex-App-Server-Laufzeit aus. Die
Modellreferenz bleibt weiterhin kanonisch als `openai/gpt-*`; die
Abonnementauthentifizierung stammt aus dem Codex-Konto/-Profil, nicht aus einem
Modellpräfix `openai-codex/*`.

Melden Sie sich zuerst mit Codex OAuth an, falls Sie das noch nicht getan haben:

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

Verwenden Sie nicht `openai-codex/gpt-*`, wenn Sie die native Codex-Laufzeit meinen.
Dieses Präfix ist die explizite Route „Codex OAuth über PI“. Konfigurationsänderungen
gelten für neue oder zurückgesetzte Sitzungen; bestehende Sitzungen behalten ihre
aufgezeichnete Laufzeit.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin steuert mehrere separate Fähigkeiten bei:

| Fähigkeit                         | Wie Sie sie verwenden                                | Was sie tut                                                                  |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Native eingebettete Laufzeit      | `agentRuntime.id: "codex"`                           | Führt eingebettete OpenClaw-Agent-Turns über den Codex-App-Server aus.       |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ...  | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Konversation. |
| Codex-App-Server-Provider/-Katalog | `codex`-Interna, über den Harness bereitgestellt     | Ermöglicht der Laufzeit, App-Server-Modelle zu erkennen und zu validieren.   |
| Codex-Pfad für Medienverständnis  | `codex/*`-Kompatibilitätspfade für Bildmodelle       | Führt begrenzte Codex-App-Server-Turns für unterstützte Bildverständnismodelle aus. |
| Nativer Hook-Relay                | Plugin-Hooks um Codex-native Ereignisse              | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Durch Aktivieren des Plugins werden diese Fähigkeiten verfügbar. Es bewirkt **nicht**, dass:

- Codex für jedes OpenAI-Modell verwendet wird
- `openai-codex/*`-Modellreferenzen in die native Laufzeit umgewandelt werden
- ACP/acpx zum Standard-Codex-Pfad wird
- bestehende Sitzungen, die bereits eine PI-Laufzeit aufgezeichnet haben, im laufenden Betrieb umgeschaltet werden
- OpenClaw-Kanalbereitstellung, Sitzungsdateien, Authentifizierungsprofilspeicher oder
  Nachrichtenrouting ersetzt werden

Dasselbe Plugin besitzt auch die native Chat-Steuerbefehlsoberfläche `/codex`.
Wenn das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus
dem Chat zu binden, fortzusetzen, zu steuern, zu stoppen oder zu inspizieren,
sollten Agents `/codex ...` gegenüber ACP bevorzugen. ACP bleibt die explizite
Fallback-Option, wenn der Benutzer nach ACP/acpx fragt oder den ACP-Codex-Adapter
testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche
Kompatibilitätsschicht bei. Dies sind In-Process-OpenClaw-Hooks, keine
Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über den Codex-`Stop`-Relay
- `agent_end`

Plugins können außerdem laufzeitneutrale Middleware für Tool-Ergebnisse
registrieren, um dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem
OpenClaw das Tool ausführt und bevor das Ergebnis an Codex zurückgegeben wird.
Dies ist getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der von
OpenClaw verwaltete Transkript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Zu den Semantiken der Plugin-Hooks selbst siehe [Plugin-Hooks](/de/plugins/hooks)
und [Verhalten von Plugin-Guards](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten
OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` behalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn
sie native App-Server-Ausführung wünschen. Veraltete `codex/*`-Modellreferenzen
wählen den Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber
laufzeitgestützte veraltete Provider-Präfixe werden nicht als normale Modell-/
Provider-Auswahlmöglichkeiten angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, statt die Route zu ändern. Das
ist beabsichtigt: `openai-codex/*` bleibt der PI-Pfad für Codex-OAuth/
Abonnement, und native App-Server-Ausführung bleibt eine explizite
Laufzeitentscheidung.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                              | Modellreferenz            | Laufzeitkonfiguration                 | Authentifizierungs-/Profilroute | Erwartete Statusbezeichnung       |
| -------------------------------------------------- | ------------------------- | ------------------------------------- | ------------------------------- | --------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-*`            | `agentRuntime.id: "codex"`            | Codex OAuth oder Codex-Konto    | `Laufzeit: OpenAI Codex`          |
| OpenAI API über den normalen OpenClaw-Runner       | `openai/gpt-*`            | ausgelassen oder `runtime: "pi"`      | OpenAI API-Schlüssel            | `Laufzeit: OpenClaw Pi Standard`  |
| ChatGPT-/Codex-Abonnement über PI                  | `openai-codex/gpt-*`      | ausgelassen oder `runtime: "pi"`      | OpenAI Codex OAuth-Provider     | `Laufzeit: OpenClaw Pi Standard`  |
| Gemischte Provider mit konservativem Auto-Modus    | providerspezifische Referenzen | `agentRuntime.id: "auto"`         | Pro ausgewähltem Provider       | Abhängig von der ausgewählten Laufzeit |
| Explizite Codex-ACP-Adapter-Sitzung                | ACP-prompt-/modellabhängig | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Authentifizierung   | ACP-Task-/Sitzungsstatus          |

Die wichtige Trennung ist Provider gegenüber Laufzeit:

- `openai-codex/*` beantwortet „welche Provider-/Authentifizierungsroute soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet „welche Schleife soll diesen
  eingebetteten Turn ausführen?“
- `/codex ...` beantwortet „welche native Codex-Konversation soll dieser Chat
  binden oder steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Für die gängige Einrichtung aus
Abonnement plus nativer Codex-Laufzeit verwenden Sie `openai/*` mit
`agentRuntime.id: "codex"`. Verwenden Sie `openai-codex/*` nur, wenn Sie
absichtlich Codex OAuth über PI möchten:

| Modellreferenz                               | Laufzeitpfad                                | Verwenden, wenn                                                           |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenAI-Provider über OpenClaw-/PI-Plumbing  | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` wünschen. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth über OpenClaw/PI         | Sie ChatGPT-/Codex-Abonnementauthentifizierung mit dem standardmäßigen PI-Runner wünschen. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                   | Sie ChatGPT-/Codex-Abonnementauthentifizierung mit nativer Codex-Ausführung wünschen. |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüsselrouten als auch auf
Codex-Abonnementrouten erscheinen, wenn Ihr Konto diese bereitstellt. Verwenden
Sie `openai/gpt-5.5` mit dem Codex-App-Server-Harness für native Codex-Laufzeit,
`openai-codex/gpt-5.5` für PI OAuth oder `openai/gpt-5.5` ohne
Codex-Laufzeitüberschreibung für direkten API-Schlüsselverkehr.

Veraltete `codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsaliase
akzeptiert. Die Doctor-Kompatibilitätsmigration schreibt veraltete primäre
Laufzeitreferenzen in kanonische Modellreferenzen um und zeichnet die
Laufzeitrichtlinie separat auf, während rein als Fallback genutzte veraltete
Referenzen unverändert bleiben, weil die Laufzeit für den gesamten
Agent-Container konfiguriert wird. Neue PI-Codex-OAuth-Konfigurationen sollten
`openai-codex/gpt-*` verwenden; neue native App-Server-Harness-Konfigurationen
sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-Codex-OAuth-Provider-
Pfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis über einen
begrenzten Codex-App-Server-Turn laufen soll. Das Codex-App-Server-Modell muss
Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle scheitern,
bevor der Medien-Turn startet.

Verwenden Sie `/status`, um den effektiven Harness für die aktuelle Sitzung zu
bestätigen. Wenn die Auswahl überraschend ist, aktivieren Sie Debug-Protokollierung
für das Subsystem `agents/harness` und prüfen Sie den strukturierten
Gateway-Datensatz `agent harness selected`. Er enthält die ausgewählte Harness-ID,
den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und im Modus `auto` das
Unterstützungsergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn alle folgenden Bedingungen zutreffen:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agents ist `openai-codex/*`
- die effektive Laufzeit dieses Agents ist nicht `codex`

Diese Warnung existiert, weil Benutzer häufig erwarten, dass „Codex-Plugin
aktiviert“ „native Codex-App-Server-Laufzeit“ bedeutet. OpenClaw zieht diesen
Schluss nicht automatisch. Die Warnung bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT-/Codex-OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-Ausführung
  beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Laufzeitänderung weiterhin `/new`
  oder `/reset`, weil Sitzungs-Laufzeitpins sticky sind.

Die Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Turn
läuft, zeichnet OpenClaw die ausgewählte Harness-ID in dieser Sitzung auf und
verwendet sie für spätere Turns in derselben Sitzungs-ID weiter. Ändern Sie die
`agentRuntime`-Konfiguration oder `OPENCLAW_AGENT_RUNTIME`, wenn zukünftige
Sitzungen einen anderen Harness verwenden sollen; verwenden Sie `/new` oder
`/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Konversation zwischen PI und Codex umschalten. Dadurch wird vermieden, dass ein
Transkript durch zwei inkompatible native Sitzungssysteme wiedergegeben wird.

Veraltete Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt
behandelt, sobald sie Transkriptverlauf haben. Verwenden Sie `/new` oder
`/reset`, um diese Konversation nach einer Konfigurationsänderung für Codex zu
aktivieren.

`/status` zeigt die effektive Modell-Laufzeitumgebung. Die standardmäßige PI-Laufzeitumgebung erscheint als
`Runtime: OpenClaw Pi Default`, und die Codex-App-Server-Laufzeitumgebung erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH` den normalen Start der Laufzeitumgebung
  nicht beeinflussen.
- Codex-Authentifizierung, verfügbar für den App-Server-Prozess oder für die Codex-Authentifizierungsbrücke von OpenClaw.
  Lokale App-Server-Starts verwenden für jeden
  Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`, sodass sie Ihr persönliches
  `~/.codex`-Konto, Skills, Plugins, Ihre Konfiguration, Ihren Thread-Zustand oder native
  `$HOME/.agents/skills` standardmäßig nicht lesen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus dem Codex-CLI-Konto
oder einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Bootstrap-Dateien für den Arbeitsbereich

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumentenerkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für Arbeitsbereichsparität in OpenClaw löst die Codex-Laufzeitumgebung die anderen Bootstrap-
Dateien (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, wenn vorhanden) auf und leitet sie über Codex-
Konfigurationsanweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben
`SOUL.md` und zugehöriger Persona-/Profilkontext des Arbeitsbereichs sichtbar, ohne
`AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Laufzeitumgebung gilt für jede
eingebettete Runde dieses Agents oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeitumgebung erzwungen ist, versucht OpenClaw weiterhin die Codex-Laufzeitumgebung und schlägt geschlossen fehl,
anstatt diese Runde stillschweigend über PI weiterzuleiten.

Verwenden Sie stattdessen eine dieser Formen:

- Setzen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Belassen Sie den Standard-Agent auf `agentRuntime.id: "auto"` und PI-Fallback für die normale gemischte
  Provider-Nutzung.
- Verwenden Sie ältere `codex/*`-Referenzen nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agent bei der normalen automatischen Auswahl und
fügt einen separaten Codex-Agent hinzu:

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

- Der Standard-Agent `main` verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet die Codex-App-Server-Laufzeitumgebung.
- Wenn Codex für den Agent `codex` fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  anstatt stillschweigend PI zu verwenden.

## Agent-Befehlsrouting

Agents sollten Benutzeranfragen nach Absicht weiterleiten, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                  | Agent sollte verwenden ...                        |
| -------------------------------------------------------- | ------------------------------------------------- |
| „Diesen Chat an Codex binden“                            | `/codex bind`                                     |
| „Codex-Thread `<id>` hier fortsetzen“                    | `/codex resume <id>`                              |
| „Codex-Threads anzeigen“                                 | `/codex threads`                                  |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                             |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                       |
| „Mein ChatGPT/Codex-Abonnement mit der Codex-Laufzeitumgebung verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`        |
| „Mein ChatGPT/Codex-Abonnement über PI verwenden“        | `openai-codex/*`-Modellreferenzen                 |
| „Codex über ACP/acpx ausführen“                          | ACP `sessions_spawn({ runtime: "acp", ... })`     |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitungen für Agents nur, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Laufzeit-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten System-Prompt und Plugin-Skills dem Agent kein ACP-
Routing beibringen.

## Nur-Codex-Bereitstellungen

Erzwingen Sie die Codex-Laufzeitumgebung, wenn Sie nachweisen müssen, dass jede eingebettete Agent-Runde
Codex verwendet. Explizite Plugin-Laufzeiten schlagen geschlossen fehl und werden nie stillschweigend
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

Sie können einen Agent ausschließlich auf Codex setzen, während der Standard-Agent die normale
automatische Auswahl beibehält:

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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und die Codex-Laufzeitumgebung erstellt oder setzt ihren begleitenden App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde die Laufzeitumgebung erneut aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn die
Erkennung fehlschlägt oder eine Zeitüberschreitung auftritt, verwendet es einen gebündelten Fallback-Katalog für:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht prüfen und beim
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

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden, statt an eine beliebige separate
Codex-CLI, die lokal installiert ist. Setzen Sie `appServer.command` nur, wenn
Sie bewusst eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Laufzeitumgebungs-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Bedienerhaltung für
autonome Heartbeats: Codex kann Shell- und Netzwerk-Tools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um Codex-Guardian-geprüfte Genehmigungen zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Arbeitsbereichs zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Prüfer statt an eine
menschliche Eingabeaufforderung weiter. Der Prüfer wendet das Risikokonzept von Codex an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Schutzmaßnahmen als im YOLO-Modus
möchten, aber unbeaufsichtigte Agents weiterhin Fortschritte machen müssen.

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen die
Voreinstellung mit expliziten Optionen mischen können. Der ältere Prüferwert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch
`auto_review` verwenden.

Verwenden Sie für einen bereits laufenden App-Server den WebSocket-Transport:

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

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw,
aber OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt sowohl
`CODEX_HOME` als auch `HOME` auf pro-Agent-Verzeichnisse unter dem OpenClaw-
Zustand dieses Agents. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-
Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Zustand auf den OpenClaw-Agent beschränkt, statt aus dem persönlichen
Codex-CLI-Home des Bedieners einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin durch die eigene
Plugin-Registry und den Skill-Loader von OpenClaw. Persönliche Codex-CLI-Assets tun das nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agents werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrationsprovider kopiert Skills in den aktuellen OpenClaw-Agent-
Arbeitsbereich. Native Codex-Plugins, Hooks und Konfigurationsdateien werden gemeldet oder archiviert,
damit sie manuell geprüft werden, statt automatisch aktiviert zu werden, weil sie
Befehle ausführen, MCP-Server bereitstellen oder Anmeldedaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein ChatGPT-abonnementartiges Codex-Authentifizierungsprofil erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten untergeordneten Codex-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Einbettungen oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Schlüssel-Fallback verwenden die App-Server-
Anmeldung statt der geerbten Umgebung des untergeordneten Prozesses. WebSocket-App-Server-Verbindungen
erhalten keinen API-Schlüssel-Fallback aus der Gateway-Umgebung; verwenden Sie ein explizites Authentifizierungsprofil oder das
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

`appServer.clearEnv` betrifft nur den gestarteten untergeordneten Codex-App-Server-Prozess.

Codex Dynamic Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus stellt OpenClaw keine Dynamic Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und `update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien, Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standardwert     | Bedeutung                                                                                         |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um den vollständigen Dynamic-Tool-Satz von OpenClaw für den Codex-App-Server bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen von OpenClaw Dynamic Tools, die in Codex-App-Server-Turns weggelassen werden.   |

Unterstützte `appServer`-Felder:

| Feld                | Standardwert                             | Bedeutung                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                 |
| `command`           | verwaltetes Codex-Binary                 | Ausführbare Datei für den stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                               |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                                                                                                                        |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                                        |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für die agentenspezifische Codex-Isolation von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                               |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird.                                                                                                                                                                      |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                  |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                               |

Von OpenClaw gesteuerte Dynamic-Tool-Aufrufe werden unabhängig von `appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet hat, erwartet der Harness außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der App-Server nach dieser Antwort 60 Sekunden lang still bleibt, unterbricht OpenClaw nach bestem Bemühen den Codex-Turn, zeichnet einen Diagnose-Timeout auf und gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn eingereiht werden.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binary, wenn `appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird für wiederholbare Bereitstellungen bevorzugt, da sie das Plugin-Verhalten in derselben geprüften Datei hält wie die restliche Einrichtung des Codex-Harness.

## Computernutzung

Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt selbst keine Desktop-Aktionen aus. Es bereitet den Codex-App-Server vor, überprüft, dass der `computer-use`-MCP-Server verfügbar ist, und lässt Codex dann während Codex-Modus-Turns die nativen MCP-Tool-Aufrufe verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs registrieren Sie `cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`. Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für den Unterschied zwischen Codex-gesteuerter Computernutzung und direkter MCP-Registrierung.

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

Computernutzung ist macOS-spezifisch und kann lokale Betriebssystemberechtigungen erfordern, bevor der Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist und der MCP-Server nicht verfügbar ist, schlagen Codex-Modus-Turns fehl, bevor der Thread startet, statt stillschweigend ohne die nativen Computer-Use-Tools zu laufen. Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für Marketplace-Optionen, Einschränkungen des Remote-Katalogs, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig gebündelten Codex-Desktop-Marketplace aus `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, falls Codex noch keinen lokalen Marketplace entdeckt hat. Verwenden Sie `/new` oder `/reset`, nachdem Sie Runtime- oder Computer-Use-Konfiguration geändert haben, damit bestehende Sitzungen keine alte PI- oder Codex-Thread-Bindung behalten.

## Häufige Rezepte

Lokales Codex mit standardmäßigem stdio-Transport:

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

Guardian-geprüfte Codex-Genehmigungen:

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

Modellwechsel bleiben OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe erneut an den App-Server. Der Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu kompaktieren.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den angehängten Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer-Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer-Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

### Häufiger Debugging-Ablauf

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanforderung einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, weil die Sitzung den Codex-Harness verwendet, außerdem
   das relevante Codex-Rückmeldungspaket an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, eine Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen `Inspect locally`-
   Befehl in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, damit Sie die Unterhaltung prüfen, sie lokal fortsetzen
   oder Codex fragen können, warum er ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnose-Bundle wünschen. Für die meisten Supportberichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Gruppenchat-Verhalten.

Der OpenClaw-Kern stellt außerdem das nur für Owner verfügbare `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Seine Genehmigungsaufforderung zeigt die Präambel zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche Ausführungsgenehmigung
an. Genehmigen Sie Diagnosen nicht mit einer Regel, die alles erlaubt. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und der Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert
dieselbe Genehmigung auch das Senden der relevanten Codex-Rückmeldungspakete an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird, listet
aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während die
Diagnosepräambel, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über die private
Genehmigungsroute an den Owner gesendet werden. Wenn keine private Owner-Route vorhanden ist,
lehnt OpenClaw die Gruppenanforderung ab und bittet den Owner, sie aus einer Direktnachricht
auszuführen.

Der genehmigte Codex-Upload ruft den Codex-App-Server `feedback/upload` auf und fordert
den App-Server auf, Protokolle für jeden aufgeführten Thread und erzeugte Codex-Unterthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Feedback-Pfad von Codex zu OpenAI-
Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort,
übergibt das aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt den erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Ihnen in einer Kanalunterhaltung ein Fehler auffällt und Sie die
problematische Codex-Sitzung prüfen, sie lokal fortsetzen oder Codex fragen möchten, warum er
eine bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist in der Regel,
zuerst `/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene
Bericht jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex-App-Server-Threads erhalten und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-App-Server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools. |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-Steuerungen; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw das eigene Plugin- und Middleware-Verhalten im
Harness-Adapter auslöst. Für native Codex-Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über App-Server oder native Hook-
Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-App-Server-
Benachrichtigungen und OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
von Codex' internen Anforderungs- oder Compaction-Payloads.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed` werden
als `codex_app_server.hook`-Agent-Ereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                           | Warum                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                             | Der Codex-App-Server besitzt den OpenAI-Durchlauf, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                    |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                             | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                 |
| Dynamische OpenClaw-Tools                     | Unterstützt                             | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                      |
| Prompt- und Kontext-Plugins                   | Unterstützt                             | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Durchlauf, bevor der Thread gestartet oder fortgesetzt wird.                                                                    |
| Lebenszyklus der Kontext-Engine               | Unterstützt                             | Zusammenstellung, Ingestion oder Wartung nach dem Durchlauf und die Koordination der Kontext-Engine-Compaction laufen für Codex-Durchläufe.                                                          |
| Dynamische Tool-Hooks                         | Unterstützt                             | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw besitzt.                                                                                 |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                             |
| Gate zur Überarbeitung der endgültigen Antwort | Über das native Hook-Relay unterstützt  | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                     |
| Nativen Shell-, Patch- und MCP-Block oder Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für verbindliche native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Argumentumschreibung nicht. |
| Native Berechtigungsrichtlinie                | Über das native Hook-Relay unterstützt  | Codex `PermissionRequest` kann über OpenClaw-Richtlinien geroutet werden, wo die Laufzeit dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| App-Server-Trajektorienerfassung              | Unterstützt                             | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                  |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                         | V1-Grenze                                                                                                                                           | Zukünftiger Pfad                                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                    | Native Pre-Tool-Hooks von Codex können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                             |
| Bearbeitbarer Codex-nativer Transkriptverlauf      | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.                |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                           | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten           | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Einträge, kein Token-Delta und keine Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                                  |
| Compaction-Eingriff                                | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                                    | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen       | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.                  | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                               |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Freigaben und Messaging-Tool-Ausgaben
laufen weiter über den normalen OpenClaw-Auslieferungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur explizite Erlauben- oder Ablehnen-Entscheidungen
zurück, wenn die Policy entscheidet. Ein Ergebnis ohne Entscheidung ist keine Erlaubnis. Codex behandelt es als keine
Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzerfreigabepfad zurück.

Codex-MCP-Tool-Freigabeanforderungen werden durch den Plugin-Freigabefluss von OpenClaw
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Elicitation-
Anfragen schlagen weiterhin geschlossen fehl.

Die Steuerung der Active-Run-Warteschlange wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in Eingangsreihenfolge als eine `turn/steer`-Anfrage.
Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steering-Warteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw hält eine Transkriptspiegelung für Channel-
Verlauf, Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistententext und leichtgewichtige Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Signale für Start und Abschluss nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medien-
Understanding verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled`, und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Run übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; falls das Problem bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
einen Timeout hat, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
