---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Harness-Konfigurationsbeispiele
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agentendurchläufe über das mitgelieferte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-05-05T01:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das mitgelieferte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Durchläufe über den
Codex App-Server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung besitzen soll: Modell-
Discovery, native Thread-Wiederaufnahme, native Compaction und App-Server-Ausführung.
OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienauslieferung und die sichtbare Transkriptspiegelung.

Wenn ein Quell-Chat-Durchlauf über den Codex-Harness läuft, verwenden sichtbare Antworten standardmäßig
das OpenClaw-`message`-Tool, wenn das Deployment nicht explizit
`messages.visibleReplies` konfiguriert hat. Der Agent kann seinen Codex-Durchlauf weiterhin privat beenden;
er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um finale Antworten in Direktchats auf dem
alten automatischen Auslieferungspfad zu belassen.

Codex-Heartbeat-Durchläufe erhalten standardmäßig auch das Tool `heartbeat_respond`, sodass der
Agent erfassen kann, ob der Wake still bleiben oder benachrichtigen soll, ohne diesen
Kontrollfluss im finalen Text zu kodieren.

Heartbeat-spezifische Initiative-Hinweise werden als Codex Collaboration-Mode-
Developer-Anweisung im Heartbeat-Durchlauf selbst gesendet. Normale Chat-Durchläufe stellen
stattdessen den Codex Default-Modus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Runtime-Prompt mitzuführen.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die "Codex in OpenClaw" möchten, wollen diese Route: mit einem
ChatGPT/Codex-Abonnement anmelden und dann eingebettete Agent-Durchläufe über die native
Codex App-Server-Runtime ausführen. Die Modellreferenz bleibt weiterhin kanonisch
`openai/gpt-*`; die Abonnement-Authentifizierung kommt aus dem Codex-Konto/-Profil, nicht
aus einem `openai-codex/*`-Modellpräfix.

Melden Sie sich zuerst mit Codex OAuth an, falls Sie dies noch nicht getan haben:

```bash
openclaw models auth login --provider openai-codex
```

Aktivieren Sie dann das mitgelieferte `codex`-Plugin und erzwingen Sie die Codex-Runtime:

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

Verwenden Sie nicht `openai-codex/gpt-*`, wenn Sie die native Codex-Runtime meinen. Dieses Präfix
ist die explizite Route "Codex OAuth über PI". Konfigurationsänderungen gelten für neue oder
zurückgesetzte Sitzungen; bestehende Sitzungen behalten ihre aufgezeichnete Runtime.

## Was dieses Plugin ändert

Das mitgelieferte `codex`-Plugin bringt mehrere getrennte Fähigkeiten mit:

| Fähigkeit                         | Wie Sie sie verwenden                            | Was sie tut                                                                  |
| --------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                       | Führt eingebettete OpenClaw-Agent-Durchläufe über den Codex App-Server aus.  |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex App-Server-Provider/-Katalog | `codex`-Interna, über den Harness bereitgestellt | Ermöglicht der Runtime, App-Server-Modelle zu entdecken und zu validieren.    |
| Codex-Medienverständnispfad       | `codex/*`-Kompatibilitätspfade für Bildmodelle   | Führt begrenzte Codex App-Server-Durchläufe für unterstützte Bildverständnismodelle aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks um Codex-native Ereignisse          | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Das Aktivieren des Plugins macht diese Fähigkeiten verfügbar. Es bewirkt **nicht**, dass:

- Codex für jedes OpenAI-Modell verwendet wird
- `openai-codex/*`-Modellreferenzen in die native Runtime konvertiert werden
- ACP/acpx zum Standard-Codex-Pfad wird
- bestehende Sitzungen, die bereits eine PI-Runtime aufgezeichnet haben, live umgeschaltet werden
- OpenClaw-Kanalauslieferung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichten-Routing ersetzt werden

Dasselbe Plugin besitzt auch die native `/codex`-Chat-Steuerbefehlsoberfläche. Wenn
das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus dem Chat zu binden,
fortzusetzen, zu steuern, zu stoppen oder zu inspizieren, sollten Agents `/codex ...` gegenüber ACP bevorzugen. ACP bleibt
der explizite Fallback, wenn der Benutzer ACP/acpx anfordert oder den ACP-
Codex-Adapter testet.

Native Codex-Durchläufe behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Command-Hooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können auch runtime-neutrale Tool-Result-Middleware registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
`tool_result_persist`-Plugin-Hook, der OpenClaw-eigene Transkript-
Tool-Result-Schreibvorgänge transformiert.

Die Semantik der Plugin-Hooks selbst finden Sie unter [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` behalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung wünschen. Alte `codex/*`-Modellreferenzen wählen den
Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber runtime-gestützte alte Provider-Präfixe werden
nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, anstatt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Codex-OAuth-/Abonnementpfad, und
native App-Server-Ausführung bleibt eine explizite Runtime-Auswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                              | Modellreferenz            | Runtime-Konfiguration                  | Auth-/Profilroute           | Erwartetes Statuslabel         |
| -------------------------------------------------- | ------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`        |
| OpenAI API über normalen OpenClaw-Runner           | `openai/gpt-*`            | ausgelassen oder `runtime: "pi"`       | OpenAI API-Schlüssel         | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-Abonnement über PI                   | `openai-codex/gpt-*`      | ausgelassen oder `runtime: "pi"`       | OpenAI Codex OAuth-Provider  | `Runtime: OpenClaw Pi Default` |
| Gemischte Provider mit konservativem Auto-Modus    | providerspezifische Referenzen | `agentRuntime.id: "auto"`          | Je ausgewähltem Provider     | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Sitzung                | ACP-Prompt/-Modell abhängig | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Auth             | ACP-Task-/Sitzungsstatus       |

Die wichtige Trennung ist Provider gegenüber Runtime:

- `openai-codex/*` beantwortet: "Welche Provider-/Auth-Route soll PI verwenden?"
- `agentRuntime.id: "codex"` beantwortet: "Welche Schleife soll diesen
  eingebetteten Durchlauf ausführen?"
- `/codex ...` beantwortet: "Welche native Codex-Unterhaltung soll dieser Chat binden
  oder steuern?"
- ACP beantwortet: "Welchen externen Harness-Prozess soll acpx starten?"

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Für die übliche Einrichtung mit Abonnement plus
nativer Codex-Runtime verwenden Sie `openai/*` mit `agentRuntime.id: "codex"`.
Verwenden Sie `openai-codex/*` nur, wenn Sie bewusst Codex OAuth über PI möchten:

| Modellreferenz                                | Runtime-Pfad                                | Verwenden, wenn                                                            |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing   | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth über OpenClaw/PI         | Sie ChatGPT/Codex-Abonnementauthentifizierung mit dem Standard-PI-Runner möchten. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex App-Server-Harness                    | Sie ChatGPT/Codex-Abonnementauthentifizierung mit nativer Codex-Ausführung möchten. |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel- als auch auf Codex-Abonnementrouten erscheinen,
wenn Ihr Konto diese bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex App-Server-
Harness für native Codex-Runtime, `openai-codex/gpt-5.5` für PI OAuth oder
`openai/gpt-5.5` ohne Codex-Runtime-Override für direkten API-Schlüssel-Traffic.

Alte `codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsaliase akzeptiert. Die Doctor-
Kompatibilitätsmigration schreibt alte primäre Runtime-Referenzen in kanonische Modellreferenzen
um und zeichnet die Runtime-Policy separat auf, während reine Fallback-Alt-Referenzen
unverändert bleiben, weil die Runtime für den gesamten Agent-Container konfiguriert wird.
Neue PI-Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden; neue native
App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-
Codex-OAuth-Provider-Pfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex App-Server-Durchlauf laufen soll. Das Codex App-Server-Modell muss
Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Mediendurchlauf
startet.

Verwenden Sie `/status`, um den effektiven Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überrascht, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er
enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Policy und
im Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn all dies zutrifft:

- das mitgelieferte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agents ist `openai-codex/*`
- die effektive Runtime dieses Agents ist nicht `codex`

Diese Warnung existiert, weil Benutzer häufig erwarten, dass "Codex-Plugin aktiviert" bedeutet:
"native Codex App-Server-Runtime." OpenClaw macht diesen Sprung nicht. Die Warnung
bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell in `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-
  Ausführung beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Runtime-Änderung weiterhin `/new` oder `/reset`,
  weil Sitzungs-Runtime-Pins sticky sind.

Die Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Durchlauf läuft,
zeichnet OpenClaw die ausgewählte Harness-ID in dieser Sitzung auf und verwendet sie für
spätere Durchläufe mit derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen einen anderen Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex umschalten. Dadurch wird vermieden, ein Transkript über
zwei inkompatible native Sitzungssysteme wiederzugeben.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer
Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die effektive Modelllaufzeit an. Der Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle auf dem `PATH` den
  normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung, die für den App-Server-Prozess oder die Codex-Authentifizierungsbrücke
  von OpenClaw verfügbar ist. Lokale App-Server-Starts verwenden für jeden
  Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`,
  sodass sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Skills, Plugins, Konfiguration, Thread-Zustand oder native
  `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus dem Codex-CLI-Konto
oder einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale Stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-
Dateien (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, falls vorhanden) auf und leitet sie über Codex-
Konfigurationsanweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleibt
`SOUL.md` und zugehöriger Workspace-Persona-/Profilkontext sichtbar, ohne
`AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei
zwischen Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Runtime gilt für jede
eingebettete Runde dieses Agent oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Runtime erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diese Runde stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Lassen Sie den Standard-Agent auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-`codex/*`-Refs nur für Kompatibilität. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Richtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agent auf normaler automatischer Auswahl und
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

- Der Standard-`main`-Agent verwendet den normalen Provider-Pfad und den PI-Kompatibilitätsfallback.
- Der `codex`-Agent verwendet den Codex-App-Server-Harness.
- Wenn Codex für den `codex`-Agent fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  statt stillschweigend PI zu verwenden.

## Agent-Befehlsrouting

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                | Agent sollte verwenden ...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf erstellen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Mein ChatGPT/Codex-Abonnement mit der Codex-Runtime verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Mein ChatGPT/Codex-Abonnement über PI verwenden“      | `openai-codex/*`-Modell-Refs                     |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und nicht native Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitung für Agents nur, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Runtime-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten System-Prompt und Plugin-Skills den Agent nicht über ACP-Routing
unterrichten.

## Nur-Codex-Bereitstellungen

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agent-Runde
Codex verwendet. Explizite Plugin-Runtimes schlagen geschlossen fehl und werden nie stillschweigend
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

Bei erzwungenem Codex schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agent nur für Codex konfigurieren, während der Standard-Agent die normale
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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine frische
OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde den Harness wieder aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder eine Zeitüberschreitung auftritt, verwendet es einen gebündelten Fallback-Katalog für:

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

## App-Server-Verbindung und -Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden, statt an die jeweils separat
lokal installierte Codex-CLI. Setzen Sie `appServer.command` nur, wenn
Sie bewusst eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerktools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um Codex-Genehmigungen mit Guardian-Review zu aktivieren, setzen Sie `appServer.mode:
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

Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, routet Codex diese Genehmigungsanfrage an den nativen Reviewer statt an eine
menschliche Eingabeaufforderung. Der Reviewer wendet das Codex-Risikoframework an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Schutzmechanismen als im YOLO-Modus möchten,
aber unbeaufsichtigte Agents weiterhin Fortschritt machen müssen.

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Entscheidungen kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird
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

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw,
aber OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt sowohl
`CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unter dem OpenClaw-
Zustand dieses Agent. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, sodass beide Werte für lokale App-Server-
Starts isoliert sind. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Zustand auf den OpenClaw-Agent begrenzt, statt aus dem persönlichen
Codex-CLI-Home des Operators einzufließen.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin über OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun das nicht. Wenn Sie
nützliche Codex-CLI-Skills oder -Plugins haben, die Teil eines OpenClaw-Agent werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-
Workspace. Native Codex-Plugins, Hooks und Konfigurationsdateien werden zur manuellen Prüfung
gemeldet oder archiviert, statt automatisch aktiviert zu werden, weil sie
Befehle ausführen, MCP-Server bereitstellen oder Zugangsdaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agent.
3. Nur für lokale Stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale Stdio-Env-Key-Fallback verwenden App-Server-
Login statt geerbter Child-Process-Umgebung. WebSocket-App-Server-Verbindungen
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

`appServer.clearEnv` betrifft nur den erzeugten untergeordneten Codex-App-Server-Prozess.

Dynamische Codex-Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine dynamischen Tools bereit, die Codex-native Workspace-
Operationen duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um den vollständigen dynamischen OpenClaw-Toolsatz für den Codex-App-Server bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen. |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` erzeugt Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                      |
| `command`           | verwaltetes Codex-Binary                 | Ausführbare Datei für den stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                    |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                                                                                                             |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                             |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine vererbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für die Codex-Isolation pro Agent durch OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                           |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/-Fortsetzung/-Turn gesendet wird.                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/-Fortsetzung gesendet wird.                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                      |
| `serviceTier`       | nicht gesetzt                            | Optionaler Codex-App-Server-Service-Tier: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                   |

Von OpenClaw verwaltete dynamische Toolaufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-Anfrage `item/tool/call` muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht
OpenClaw das Toolsignal ab, soweit unterstützt, und gibt eine fehlgeschlagene
Dynamisches-Tool-Antwort an Codex zurück, sodass der Turn fortgesetzt werden kann,
anstatt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet hat,
erwartet das Harness außerdem, dass Codex den nativen Turn mit `turn/completed`
abschließt. Wenn der App-Server danach 60 Sekunden lang still bleibt, unterbricht
OpenClaw den Codex-Turn nach bestem Aufwand, zeichnet einen diagnostischen Timeout auf
und gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht hinter
einem veralteten nativen Turn eingereiht werden.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Config wird
für wiederholbare Bereitstellungen bevorzugt, da sie das Plugin-Verhalten in derselben
geprüften Datei hält wie die übrige Einrichtung des Codex-Harnesses.

## Computernutzung

Computer Use wird in einem eigenen Einrichtungsleitfaden behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt selbst
keine Desktop-Aktionen aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
MCP-Server `computer-use` verfügbar ist, und überlässt Codex dann die nativen
MCP-Toolaufrufe während Turns im Codex-Modus.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Flows registrieren Sie
`cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für die Unterscheidung
zwischen Codex-eigener Computer Use und direkter MCP-Registrierung.

Minimale Config:

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
Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` `true` ist und der MCP-
Server nicht verfügbar ist, schlagen Turns im Codex-Modus fehl, bevor der Thread startet,
anstatt stillschweigend ohne die nativen Computer-Use-Tools zu laufen. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Grenzen des Remote-Katalogs, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` `true` ist, kann OpenClaw den standardmäßigen gebündelten
Codex-Desktop-Marketplace von
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, falls Codex
noch keinen lokalen Marketplace entdeckt hat. Verwenden Sie `/new` oder `/reset`, nachdem
Sie die Runtime- oder Computer-Use-Config geändert haben, damit vorhandene Sitzungen keine alte
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

Modellwechsel bleiben von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an einen vorhandenen
Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und den Service-Tier erneut an den
App-Server. Beim Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die
Thread-Bindung erhalten, aber Codex wird aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität des app-server, Modelle, Konto, Rate-Limits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex app-server auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem vorhandenen Codex-Thread.
- `/codex compact` fordert den Codex app-server auf, den verbundenen Thread zu kompaktieren.
- `/codex review` startet eine native Codex-Review für den verbundenen Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den verbundenen Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer-Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer-Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Rate-Limit-Status an.
- `/codex mcp` listet den MCP-Serverstatus des Codex app-server auf.
- `/codex skills` listet Codex app-server-Skills auf.

Wenn Codex einen Nutzungslimit-Fehler meldet, enthält OpenClaw die nächste
Zurücksetzungszeit des app-server, sofern Codex eine bereitgestellt hat. Verwenden Sie `/codex account` in derselben
Unterhaltung, um das aktuelle Konto und die Rate-Limit-Fenster zu prüfen.

### Häufiger Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt das lokale Gateway-
   Diagnose-Zip und sendet, da die Sitzung den Codex-Harness verwendet, außerdem
   das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen `Inspect locally`-
   Befehl in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, damit Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum ein bestimmtes Tool oder ein bestimmter Plan gewählt wurde.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell verbundenen Thread ohne das vollständige OpenClaw-
Gateway-Diagnose-Bundle möchten. Für die meisten Support-Berichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und die Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der OpenClaw-Kern stellt außerdem den nur für Eigentümer verfügbaren allgemeinen
Gateway-Diagnosebefehl `/diagnostics [note]` bereit. Seine Genehmigungsaufforderung zeigt den Vorspann zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert jedes Mal
`openclaw gateway diagnostics export --json` über eine ausdrückliche Exec-Genehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und der Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert
dieselbe Genehmigung auch das Senden der relevanten Codex-Feedback-Bundles an
OpenAI-Server. Die Genehmigungsaufforderung weist darauf hin, dass Codex-Feedback gesendet wird,
listet vor der Genehmigung jedoch keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Eigentümer in einem Gruppenchat aufgerufen wird, hält OpenClaw den
geteilten Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während der
Diagnosevorspann, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über die private Genehmigungsroute
an den Eigentümer gesendet werden. Wenn keine private Eigentümerroute vorhanden ist,
lehnt OpenClaw die Gruppenanfrage ab und fordert den Eigentümer auf, sie aus einer Direktnachricht auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex app-server auf und fordert
den app-server auf, Logs für jeden aufgeführten Thread und erzeugte Codex-Unterthreads
einzuschließen, sofern verfügbar. Der Upload läuft über Codex' normalen Feedback-Pfad zu OpenAI-
Servern; wenn Codex-Feedback in diesem app-server deaktiviert ist, gibt der Befehl
den app-server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den app-server und lässt den erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Ihnen in einer Kanalunterhaltung ein Fehler auffällt und Sie die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten,
warum eine bestimmte Tool- oder Reasoning-Entscheidung getroffen wurde. Der einfachste Weg ist meist,
zuerst `/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex app-server-Threads abrufen und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex app-server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster app-server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Eigentümer               | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex app-server-Erweiterungs-Middleware | Von OpenClaw gebündelte Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lifecycle und native Tool-Policy aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte Bridge für native Tools und Berechtigungen
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Kontrollen auf Codex-Ebene; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw das Plugin- und Middleware-Verhalten auslöst, das es im
Harness-Adapter besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Eintrag.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über den app-server oder native Hook-
Callbacks bereit.

Compaction- und LLM-Lifecycle-Projektionen stammen aus Benachrichtigungen des Codex app-server
und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfrage- oder Compaction-Payloads von Codex.

Native Codex-`hook/started`- und `hook/completed`-app-server-Benachrichtigungen werden
als `codex_app_server.hook`-Agent-Ereignisse für Verlauf und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr vom
nativen Modell-Loop, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                          | Warum                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modell-Loop über Codex                 | Unterstützt                            | Codex app-server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                            |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                            | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                |
| Dynamische OpenClaw-Tools                     | Unterstützt                            | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                     |
| Prompt- und Kontext-Plugins                   | Unterstützt                            | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                        |
| Lifecycle der Kontext-Engine                  | Unterstützt                            | Zusammenstellung, Ingestion oder Wartung nach dem Turn sowie Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                     |
| Dynamische Tool-Hooks                         | Unterstützt                            | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um OpenClaw-eigene dynamische Tools.                                                                                 |
| Lifecycle-Hooks                               | Als Adapterbeobachtungen unterstützt   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                            |
| Gate zur Überarbeitung der finalen Antwort    | Über das native Hook-Relay unterstützt | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                    |
| Native Shell-, Patch- und MCP-Blockierung oder Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex app-server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungs-Policy                   | Über das native Hook-Relay unterstützt | Codex `PermissionRequest` kann über die OpenClaw-Policy geroutet werden, sofern die Laufzeit sie bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| App-server-Verlaufserfassung                  | Unterstützt                            | OpenClaw zeichnet die Anfrage auf, die es an den app-server gesendet hat, sowie die app-server-Benachrichtigungen, die es empfängt.                                                                  |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                         | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                    | Codex-native Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                     | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                         |
| Bearbeitbarer Codex-nativer Transkriptverlauf      | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht unterstützte Interna nicht verändern. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.             |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                        | Könnte transformierte Datensätze spiegeln, aber eine kanonische Umschreibung braucht Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten           | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Einträge, kein Token-Delta und keine Zusammenfassung. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                             |
| Compaction-Eingriff                                | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                                | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction blockieren oder umschreiben müssen. |
| Bytegenaue Erfassung von Model-API-Anfragen        | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.                | Benötigt ein Codex-Model-Request-Tracing-Ereignis oder eine Debug-API.                            |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben
laufen weiterhin über den normalen OpenClaw-Auslieferungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Support-Vertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Runtime umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Runtime-Vertrag
sie benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Allow- oder Deny-Entscheidungen
zurück, wenn die Policy entscheidet. Ein Ergebnis ohne Entscheidung ist kein Allow. Codex behandelt es als keine
Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzerfreigabepfad zurück.

Codex-MCP-Tool-Genehmigungsaufforderungen werden durch OpenClaws Plugin-
Genehmigungsfluss geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste in die Warteschlange gestellte Folgenachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Aufforderungsanfragen
schlagen weiterhin geschlossen fehl.

Active-Run-Warteschlangensteuerung wird auf Codex-App-Server `turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw in die Warteschlange gestellte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie als eine `turn/steer`-Anfrage in
Eingangsreihenfolge. Der ältere `queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steuerungswarteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Model das Codex-Harness verwendet, wird native Thread-Compaction
an den Codex-App-Server delegiert. OpenClaw hält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Model- oder Harness-Wechsel vor. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistententext sowie schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste der Einträge bereit, die Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist`
derzeit keine Codex-nativen Tool-Ergebnisdatensätze um. Es gilt nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medien-
Understanding verwenden weiterhin die passenden Provider-/Model-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Model mit
`agentRuntime.id: "codex"` (oder eine ältere `codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled`, und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann PI weiterhin als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Run übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Runtime schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Model-Erkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Model verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine ältere
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Model sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; falls das bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu bereinigen. Wenn `computer-use.list_apps`
in ein Timeout läuft, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Model-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
