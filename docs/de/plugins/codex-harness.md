---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Harness-Konfigurationsbeispiele
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, statt auf PI zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agent-Durchläufe über den mitgelieferten Codex-App-Server-Harness aus
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-05-02T06:39:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Durchläufe über den
Codex-App-Server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, native Thread-Fortsetzung, native Compaction und App-Server-Ausführung.
OpenClaw bleibt weiterhin für Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und die sichtbare Transkriptspiegelung zuständig.

Wenn ein Quell-Chat-Durchlauf über den Codex-Harness läuft, verwenden sichtbare Antworten standardmäßig
das OpenClaw-`message`-Tool, wenn die Bereitstellung
`messages.visibleReplies` nicht explizit konfiguriert hat. Der Agent kann seinen Codex-Durchlauf weiterhin privat abschließen;
er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um abschließende Antworten in Direkt-Chats auf dem
älteren automatischen Zustellpfad zu belassen.

Codex-Heartbeat-Durchläufe erhalten standardmäßig auch das Tool `heartbeat_respond`, sodass der
Agent festhalten kann, ob der Wake still bleiben oder benachrichtigen soll, ohne
diesen Kontrollfluss im abschließenden Text zu codieren.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diese Route: Melden Sie sich mit einem
ChatGPT-/Codex-Abonnement an und führen Sie dann eingebettete Agent-Durchläufe über die native
Codex-App-Server-Laufzeit aus. Die Modellreferenz bleibt weiterhin kanonisch
`openai/gpt-*`; die Abonnement-Authentifizierung kommt aus dem Codex-Konto/-Profil, nicht
aus einem Modellpräfix `openai-codex/*`.

Melden Sie sich zuerst mit Codex OAuth an, falls Sie dies noch nicht getan haben:

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
        fallback: "none",
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

Das gebündelte `codex`-Plugin stellt mehrere separate Fähigkeiten bereit:

| Fähigkeit                         | Wie Sie sie verwenden                              | Was sie bewirkt                                                              |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Laufzeit      | `agentRuntime.id: "codex"`                         | Führt eingebettete OpenClaw-Agent-Durchläufe über den Codex-App-Server aus.   |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex-App-Server-Provider/-Katalog | `codex`-Interna, über den Harness verfügbar        | Ermöglicht der Laufzeit, App-Server-Modelle zu erkennen und zu validieren.    |
| Codex-Pfad für Medienverständnis  | `codex/*`-Kompatibilitätspfade für Bildmodelle     | Führt begrenzte Codex-App-Server-Durchläufe für unterstützte Bildverständnismodelle aus. |
| Natives Hook-Relay                | Plugin-Hooks um Codex-native Ereignisse            | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Durch Aktivieren des Plugins werden diese Fähigkeiten verfügbar. Es bewirkt **nicht**:

- Codex für jedes OpenAI-Modell zu verwenden
- `openai-codex/*`-Modellreferenzen in die native Laufzeit umzuwandeln
- ACP/acpx zum Standard-Codex-Pfad zu machen
- bestehende Sitzungen automatisch umzuschalten, die bereits eine PI-Laufzeit aufgezeichnet haben
- OpenClaw-Kanalzustellung, Sitzungsdateien, Authentifizierungsprofilspeicher oder
  Nachrichtenrouting zu ersetzen

Dasselbe Plugin besitzt auch die native Chat-Steuerbefehlsoberfläche `/codex`. Wenn
das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus dem Chat zu binden,
fortzusetzen, zu steuern, zu stoppen oder zu prüfen, sollten Agents `/codex ...` ACP vorziehen. ACP bleibt
der explizite Fallback, wenn der Benutzer nach ACP/acpx fragt oder den ACP-
Codex-Adapter testet.

Native Codex-Durchläufe behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Command-Hooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über Codex-`Stop`-Relay
- `agent_end`

Plugins können außerdem laufzeitneutrale Tool-Ergebnis-Middleware registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
Plugin-Hook `tool_result_persist`, der OpenClaw-eigene Transkript-
Tool-Ergebnisschreibvorgänge transformiert.

Für die Semantik der Plugin-Hooks selbst siehe [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Schutzverhalten](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` belassen und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung wünschen. Ältere `codex/*`-Modellreferenzen wählen aus
Kompatibilitätsgründen weiterhin automatisch den Harness aus, aber laufzeitgestützte ältere Provider-Präfixe werden
nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, anstatt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Pfad für Codex OAuth/Abonnement, und
native App-Server-Ausführung bleibt eine explizite Laufzeitauswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                                 | Modellreferenz            | Laufzeitkonfiguration                  | Authentifizierungs-/Profilroute | Erwartetes Statuslabel          |
| ----------------------------------------------------- | ------------------------- | -------------------------------------- | ------------------------------- | ------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Laufzeit  | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | Codex OAuth oder Codex-Konto    | `Runtime: OpenAI Codex`         |
| OpenAI API über normalen OpenClaw-Runner              | `openai/gpt-*`            | weggelassen oder `runtime: "pi"`       | OpenAI-API-Schlüssel            | `Runtime: OpenClaw Pi Default`  |
| ChatGPT-/Codex-Abonnement über PI                     | `openai-codex/gpt-*`      | weggelassen oder `runtime: "pi"`       | OpenAI-Codex-OAuth-Provider     | `Runtime: OpenClaw Pi Default`  |
| Gemischte Provider mit konservativem Auto-Modus       | Provider-spezifische Referenzen | `agentRuntime.id: "auto"`          | Je ausgewähltem Provider        | Hängt von der ausgewählten Laufzeit ab |
| Explizite Codex-ACP-Adapter-Sitzung                   | ACP-prompt-/modellabhängig | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Authentifizierung   | ACP-Aufgaben-/Sitzungsstatus    |

Die wichtige Trennung ist Provider gegenüber Laufzeit:

- `openai-codex/*` beantwortet „welche Provider-/Authentifizierungsroute soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet „welcher Loop soll diesen
  eingebetteten Durchlauf ausführen?“
- `/codex ...` beantwortet „welche native Codex-Unterhaltung soll dieser Chat binden
  oder steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Für die übliche Einrichtung mit Abonnement plus
nativer Codex-Laufzeit verwenden Sie `openai/*` mit `agentRuntime.id: "codex"`.
Verwenden Sie `openai-codex/*` nur, wenn Sie bewusst Codex OAuth über PI möchten:

| Modellreferenz                                | Laufzeitpfad                                  | Verwenden, wenn                                                            |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw-/PI-Plumbing   | Sie aktuellen direkten Zugriff auf die OpenAI Platform API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth über OpenClaw/PI          | Sie ChatGPT-/Codex-Abonnement-Authentifizierung mit dem standardmäßigen PI-Runner möchten. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                     | Sie ChatGPT-/Codex-Abonnement-Authentifizierung mit nativer Codex-Ausführung möchten. |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel- als auch auf Codex-Abonnement-Routen erscheinen,
wenn Ihr Konto sie bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex-App-Server-
Harness für native Codex-Laufzeit, `openai-codex/gpt-5.5` für PI OAuth oder
`openai/gpt-5.5` ohne Codex-Laufzeitüberschreibung für direkten API-Schlüssel-Traffic.

Ältere `codex/gpt-*`-Referenzen bleiben als Kompatibilitätsaliase akzeptiert. Die
Doctor-Kompatibilitätsmigration schreibt ältere primäre Laufzeitreferenzen in kanonische Modellreferenzen um
und zeichnet die Laufzeitrichtlinie separat auf, während ältere Referenzen, die nur als Fallback dienen,
unverändert bleiben, weil die Laufzeit für den gesamten Agent-Container konfiguriert wird.
Neue PI-Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden; neue native
App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-
Codex-OAuth-Provider-Pfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Durchlauf laufen soll. Das Codex-App-Server-Modell muss
Bild-Eingabenunterstützung ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Medien-Durchlauf
startet.

Verwenden Sie `/status`, um den effektiven Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er
enthält die ausgewählte Harness-ID, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und
im `auto`-Modus das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn all dies zutrifft:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agents ist `openai-codex/*`
- die effektive Laufzeit dieses Agents ist nicht `codex`

Diese Warnung existiert, weil Benutzer oft erwarten, dass „Codex-Plugin aktiviert“ bedeutet:
„native Codex-App-Server-Laufzeit“. OpenClaw zieht diesen Schluss nicht. Die Warnung
bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-
  Ausführung beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Laufzeitänderung weiterhin `/new` oder `/reset`,
  weil Sitzungs-Laufzeit-Pins dauerhaft sind.

Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Durchlauf läuft,
zeichnet OpenClaw die ausgewählte Harness-ID für diese Sitzung auf und verwendet sie
für spätere Durchläufe in derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen einen anderen Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex wechseln. Dadurch wird vermieden, ein Transkript durch
zwei inkompatible native Sitzungssysteme wiederzugeben.

Ältere Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkripthistorie haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach
einer Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die effektiv verwendete Modell-Runtime. Das Standard-Pi-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und das Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem, mitgeliefertem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das mitgelieferte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, daher beeinflussen lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht.
- Codex-Authentifizierung muss für den App-Server-Prozess oder für OpenClaws Codex-Authentifizierungsbridge
  verfügbar sein. Lokale App-Server-Starts verwenden ein von OpenClaw verwaltetes Codex-Home für jeden
  Agenten und ein isoliertes untergeordnetes `HOME`, sodass sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Ihre Skills, Plugins, Konfiguration, Thread-Zustände oder nativen
  `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung üblicherweise aus dem Codex-CLI-Konto
oder einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale stdio-App-Server-Starts können
außerdem auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Runtime gilt für jede
eingebettete Runde dieses Agenten oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Runtime erzwungen ist, versucht OpenClaw trotzdem das Codex-Harness und schlägt geschlossen fehl,
anstatt diese Runde stillschweigend über Pi zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agenten mit `agentRuntime.id: "codex"`.
- Behalten Sie den Standard-Agenten auf `agentRuntime.id: "auto"` und Pi-Fallback für normale gemischte
  Provider-Nutzung bei.
- Verwenden Sie ältere `codex/*`-Referenzen nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Richtlinie bevorzugen.

Dieses Beispiel behält den Standard-Agenten bei normaler automatischer Auswahl und
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
        fallback: "pi",
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

- Der Standard-Agent `main` verwendet den normalen Provider-Pfad und den Pi-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet das Codex-App-Server-Harness.
- Wenn Codex für den Agenten `codex` fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  anstatt stillschweigend Pi zu verwenden.

## Agent-Befehlsrouting

Agenten sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                | Agent sollte verwenden ...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Mein ChatGPT/Codex-Abonnement mit der Codex-Runtime verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Mein ChatGPT/Codex-Abonnement über Pi verwenden“      | `openai-codex/*`-Modellreferenzen                |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Unter-Agenten |

OpenClaw bewirbt ACP-Spawn-Anleitungen gegenüber Agenten nur, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Runtime-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills dem Agenten kein ACP-Routing beibringen.

## Nur-Codex-Bereitstellungen

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agentenrunde
Codex verwendet. Explizite Plugin-Runtimes verwenden standardmäßig keinen Pi-Fallback, daher ist
`fallback: "none"` optional, aber oft als Dokumentation nützlich:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Umgebungs-Override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann. Setzen Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur, wenn Sie absichtlich möchten, dass Pi eine
fehlende Harness-Auswahl behandelt.

## Codex pro Agent

Sie können einen Agenten ausschließlich auf Codex festlegen, während der Standard-Agent die normale
automatische Auswahl beibehält:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um zwischen Agenten und Modellen zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-Thread
bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde das Harness wieder aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder eine Zeitüberschreitung auftritt, verwendet es einen mitgelieferten Fallback-Katalog für:

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
App-Server-Version an das mitgelieferte Plugin gebunden statt an die separate
Codex-CLI, die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn
Sie absichtlich eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerktools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, auf die niemand antworten kann.

Um Genehmigungen mit Codex-Guardian-Prüfung zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet Codex’ nativen Auto-Review-Genehmigungspfad. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Arbeitsbereichs zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Prüfer statt an eine
menschliche Eingabeaufforderung weiter. Der Prüfer wendet Codex’ Risiko-Framework an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Schutzmechanismen als im YOLO-Modus möchten,
aber weiterhin benötigen, dass unbeaufsichtigte Agenten Fortschritte machen.

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass fortgeschrittene Bereitstellungen
die Voreinstellung mit expliziten Entscheidungen mischen können. Der ältere Prüferwert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch
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
aber OpenClaw besitzt die Codex-App-Server-Kontobridge und setzt sowohl
`CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unter dem OpenClaw-Zustand
dieses Agenten. Codex’ eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-Starts
isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-Zustand
auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen Codex-CLI-Home
des Operators einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin durch OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun das nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agenten werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agentenarbeitsbereich.
Codex-native Plugins, Hooks und Konfigurationsdateien werden zur manuellen Prüfung gemeldet oder archiviert,
anstatt automatisch aktiviert zu werden, weil sie Befehle ausführen,
MCP-Server freigeben oder Zugangsdaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements sieht, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Key-Fallback verwenden App-Server-Login
statt geerbter Env des untergeordneten Prozesses. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des entfernten App-Servers.

Wenn eine Bereitstellung zusätzliche Umgebungsisolierung benötigt, fügen Sie diese Variablen zu
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

Codex-Dynamic-Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine Dynamic-Tools bereit, die Codex-native Arbeitsbereichsoperationen duplizieren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um den vollständigen dynamischen OpenClaw-Tool-Satz für den Codex app-server bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex app-server-Turns ausgelassen werden.        |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                             |
| `command`           | verwaltetes Codex-Binary                 | Ausführbare Datei für den stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                          |
| `url`               | nicht gesetzt                            | WebSocket-URL des app-server.                                                                                                                                                                                                               |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                                    |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                               |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-app-server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für die Codex-Isolation pro Agent von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Zeitlimit für app-server-Control-Plane-Aufrufe.                                                                                                                                                                                             |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird.                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird.                                                                                                                                                                   |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                             |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex app-server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                          |

Dynamische Tool-Aufrufe im Besitz von OpenClaw werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout
bricht OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine
fehlgeschlagene dynamische Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine auf einen Codex-Turn bezogene app-server-Anfrage
geantwortet hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` abschließt. Wenn der app-server nach dieser Antwort 60 Sekunden
lang still bleibt, unterbricht OpenClaw nach bestem Bemühen den Codex-Turn,
zeichnet ein diagnostisches Timeout auf und gibt die OpenClaw-Sitzungsspur frei,
damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten nativen Turn
in die Warteschlange gestellt werden.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binary, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration
wird für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten
in derselben geprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw liefert die Desktop-Control-App nicht mit und führt
selbst keine Desktop-Aktionen aus. Es bereitet Codex app-server vor, überprüft,
dass der MCP-Server `computer-use` verfügbar ist, und überlässt Codex dann die
nativen MCP-Tool-Aufrufe während Turns im Codex-Modus.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs
registrieren Sie `cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex Computer Use](/de/plugins/codex-computer-use) zur Unterscheidung
zwischen Computer Use im Besitz von Codex und direkter MCP-Registrierung.

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
        fallback: "none",
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

Computer Use ist macOS-spezifisch und kann lokale Betriebssystemberechtigungen
erfordern, bevor der Codex-MCP-Server Apps steuern kann. Wenn
`computerUse.enabled` true ist und der MCP-Server nicht verfügbar ist, schlagen
Turns im Codex-Modus fehl, bevor der Thread startet, statt stillschweigend ohne
die nativen Computer-Use-Tools zu laufen. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Kataloggrenzen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex-Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren,
falls Codex noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new`
oder `/reset`, nachdem Sie Laufzeit- oder Computer-Use-Konfiguration geändert
haben, damit vorhandene Sitzungen keine alte PI- oder Codex-Thread-Bindung
beibehalten.

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

Codex-only-Harness-Validierung:

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

Remote-app-server mit expliziten Headern:

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

Modellwechsel bleiben OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an einen
vorhandenen Codex-Thread angehängt ist, sendet der nächste Turn das aktuell
ausgewählte OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox
und die Service-Stufe erneut an den app-server. Der Wechsel von `openai/gpt-5.5`
zu `openai/gpt-5.2` behält die Thread-Bindung bei, weist Codex aber an, mit dem
neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität des app-server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex app-server auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert Codex app-server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den angehängten Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer-Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer-Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Serverstatus des Codex app-server auf.
- `/codex skills` listet Skills des Codex app-server auf.

### Häufiger Debugging-Ablauf

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, da die Sitzung das Codex-Harness verwendet, außerdem
   das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutzzusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und für jeden Codex-Thread eine `Inspect locally`-Zeile.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen `Inspect locally`-
   Befehl in einem Terminal aus. Er sieht wie `codex resume <thread-id>` aus und öffnet den
   nativen Codex-Thread, sodass Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum es ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den derzeit angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnose-Bundle möchten. Für die meisten Support-Berichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Status und die Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der Kern von OpenClaw stellt außerdem das nur für Owner bestimmte `/diagnostics [note]`
als allgemeinen Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt den
Vorspann zu sensiblen Daten, verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche Exec-Genehmigung
an. Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung sendet
OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und einer Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung das Codex-Harness verwendet, autorisiert
dieselbe Genehmigung auch das Senden der relevanten Codex-Feedback-Bundles an OpenAI-
Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird, listet aber
vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während der
Diagnosevorspann, die Genehmigungsaufforderungen und die Codex-Sitzungs-/Thread-IDs über
die private Genehmigungsroute an den Owner gesendet werden. Wenn es keine private Owner-
Route gibt, lehnt OpenClaw die Gruppenanfrage ab und bittet den Owner, sie aus einer DM
auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex-App-Servers auf und bittet
den App-Server, Protokolle für jeden aufgeführten Thread und erzeugte Codex-Unterthreads
einzuschließen, sofern verfügbar. Der Upload läuft über Codex' normalen Feedback-Pfad zu
OpenAI-Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-Befehle für
die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt
OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen Gateway-
Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für normale Turns
verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
derzeit ausgewählte OpenClaw-Modell an den App-Server und lässt den erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie in einer Kanalunterhaltung einen Fehler bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum es
ein bestimmtes Tool oder eine bestimmte Reasoning-Entscheidung getroffen hat. Der einfachste
Weg ist normalerweise, zuerst `/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt
haben, listet der abgeschlossene Bericht jeden Codex-Thread auf und gibt einen `Inspect locally`-
Befehl aus, zum Beispiel `codex resume <thread-id>`. Sie können diesen Befehl direkt in ein
Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex-App-Server-Threads erhalten und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-App-Server-Erweiterungsmiddleware | Mit OpenClaw gebündelte Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Niedrige Codex-Lifecycle- und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungs-
Bridge injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-Level-Steuerelemente; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks offengelegt.

Bei dynamischen OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf
angefordert hat, sodass OpenClaw das eigene Plugin- und Middleware-Verhalten im Harness-
Adapter auslöst. Bei Codex-nativen Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, kann aber den nativen Codex-Thread nicht
umschreiben, sofern Codex diese Operation nicht über App-Server- oder native Hook-Callbacks
bereitstellt.

Compaction- und LLM-Lifecycle-Projektionen stammen aus Codex-App-Server-Benachrichtigungen
und OpenClaw-Adapterstatus, nicht aus nativen Codex-Hook-Befehlen. OpenClaws Ereignisse
`before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind Beobachtungen auf
Adapterebene, keine bytegenauen Erfassungen interner Anfragen oder Compaction-Payloads von
Codex.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed` werden als
`codex_app_server.hook`-Agentenereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen um
diese Grenze herum an.

Unterstützt in Codex-Runtime v1:

| Oberfläche                                   | Unterstützung                          | Warum                                                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex             | Unterstützt                            | Der Codex-App-Server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                         |
| OpenClaw-Kanalrouting und -Zustellung        | Unterstützt                            | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                 |
| Dynamische OpenClaw-Tools                    | Unterstützt                            | Codex bittet OpenClaw, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                           |
| Prompt- und Kontext-Plugins                  | Unterstützt                            | OpenClaw baut Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                            |
| Kontext-Engine-Lifecycle                     | Unterstützt                            | Assemble, Ingest oder Wartung nach dem Turn sowie die Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                             |
| Dynamische Tool-Hooks                        | Unterstützt                            | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw gehören.                                                                                 |
| Lifecycle-Hooks                              | Als Adapterbeobachtungen unterstützt   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                              |
| Gate zur Überarbeitung der finalen Antwort   | Über das native Hook-Relay unterstützt | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` bittet Codex um einen weiteren Modelllauf vor der Finalisierung.                                                               |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; das Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie               | Über das native Hook-Relay unterstützt | Codex `PermissionRequest` kann über OpenClaw-Richtlinien geroutet werden, sofern die Runtime dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, setzt Codex seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| App-Server-Trajektorienerfassung             | Unterstützt                            | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                 |

Nicht unterstützt in Codex-Runtime v1:

| Oberfläche                                             | V1-Grenze                                                                                                                                     | Zukünftiger Pfad                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                       | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                               | Erfordert Codex-Hook-/Schemaunterstützung für ersetzende Tool-Eingaben.                            |
| Bearbeitbarer Codex-nativer Transkriptverlauf            | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Fügen Sie explizite Codex-App-Server-APIs hinzu, wenn native Thread-Chirurgie erforderlich ist.                    |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert von OpenClaw verwaltete Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                                           | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung.              |
| Umfangreiche native Compaction-Metadaten                     | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste behaltener/verworfener Einträge, Token-Differenz oder Zusammenfassungs-Payload.            | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                                     |
| Compaction-Intervention                             | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                                         | Fügen Sie Codex-Pre-/Post-Compaction-Hooks hinzu, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Model-API-Anfragen             | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.                      | Benötigt ein Codex-Model-Request-Tracing-Ereignis oder eine Debug-API.                                   |

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agents.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Videos, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Auslieferungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der Supportvertrag von v1 ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Runtime umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Runtime-Vertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Allow- oder Deny-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist kein Allow.
Codex behandelt es als keine Hook-Entscheidung und fällt auf den eigenen Guardian- oder
Benutzergenehmigungspfad zurück.

Codex-MCP-Tool-Genehmigungsabfragen werden über OpenClaws Plugin-Genehmigungsfluss
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Follow-up-Nachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Abfrageanfragen
schlagen weiterhin geschlossen fehl.

Active-Run-Queue-Steuerung wird auf Codex-App-Server-`turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in Ankunftsreihenfolge als eine `turn/steer`-Anfrage.
Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Queue, wenn der ausgewählte Modus einen Fallback erlaubt. Siehe
[Steering-Queue](/de/concepts/queue-steering).

Wenn das ausgewählte Model den Codex-Harness verwendet, wird native Thread-Compaction
an den Codex-App-Server delegiert. OpenClaw hält eine Transkriptspiegelung für Channel-
Verlauf, Suche, `/new`, `/reset` und zukünftige Model- oder Harness-Wechsel. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistant-Text und leichtgewichtige Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist`
derzeit keine Codex-nativen Tool-Ergebnisdatensätze um. Es gilt nur, wenn
OpenClaw ein Tool-Ergebnis in ein von OpenClaw verwaltetes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Model-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Model mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Runtime schlägt jetzt fehl, statt auf PI zurückzufallen, sofern Sie nicht
explizit `agentRuntime.fallback: "pi"` setzen. Sobald der Codex-App-Server
ausgewählt ist, treten seine Fehler ohne zusätzliche Fallback-Konfiguration direkt zutage.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Build-Suffix-
Versionen wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil der
stabile Protokoll-Mindeststand `0.125.0` das ist, was OpenClaw testet.

**Model-Erkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Model verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agent ein von Codex unterstütztes OpenAI-Model sein.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn es bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
ein Timeout erreicht, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandte Themen

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Model-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
