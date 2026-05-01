---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agentendurchläufe über das mitgelieferte Codex-App-Server-Testgerüst ausführen
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-05-01T06:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin lässt OpenClaw eingebettete Agent-Turns über den
Codex App-Server statt über den integrierten PI-Harness ausführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung besitzen soll:
Modellerkennung, natives Fortsetzen von Threads, native Compaction und
App-Server-Ausführung. OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien,
Modellauswahl, Tools, Freigaben, Medienzustellung und die sichtbare
Transkriptspiegelung.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Um den Codex-Harness für GPT-Agent-Turns zu verwenden, behalten Sie die
Modellreferenz kanonisch als `openai/gpt-*`, aktivieren Sie das gebündelte
`codex`-Plugin und setzen Sie `agentRuntime.id: "codex"`:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort auch `codex`
auf:

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

Verwenden Sie für diesen Pfad nicht `openai-codex/gpt-*`. Das wählt Codex OAuth
über den normalen PI-Runner aus, sofern Sie nicht separat eine Runtime erzwingen.
Konfigurationsänderungen gelten für neue oder zurückgesetzte Sitzungen;
bestehende Sitzungen behalten ihre aufgezeichnete Runtime.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere separate Fähigkeiten bereit:

| Fähigkeit                         | Wie Sie sie verwenden                              | Was sie tut                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Runtime        | `agentRuntime.id: "codex"`                          | Führt eingebettete OpenClaw-Agent-Turns über den Codex App-Server aus.        |
| Native Chat-Steuerungsbefehle      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex App-Server-Provider/Katalog  | `codex`-Interna, über den Harness bereitgestellt    | Ermöglicht der Runtime, App-Server-Modelle zu erkennen und zu validieren.     |
| Codex-Pfad zum Medienverständnis   | `codex/*`-Kompatibilitätspfade für Bildmodelle      | Führt begrenzte Codex-App-Server-Turns für unterstützte Bildverständnismodelle aus. |
| Natives Hook-Relay                 | Plugin-Hooks um Codex-native Ereignisse             | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Durch Aktivieren des Plugins werden diese Fähigkeiten verfügbar. Es bewirkt
**nicht**:

- Codex für jedes OpenAI-Modell zu verwenden
- `openai-codex/*`-Modellreferenzen in die native Runtime umzuwandeln
- ACP/acpx zum Standard-Codex-Pfad zu machen
- bestehende Sitzungen, die bereits eine PI-Runtime aufgezeichnet haben, im laufenden Betrieb umzuschalten
- OpenClaw-Kanalzustellung, Sitzungsdateien, Authentifizierungsprofil-Speicher oder
  Nachrichtenrouting zu ersetzen

Dasselbe Plugin besitzt auch die native `/codex`-Chat-Steuerungsoberfläche. Wenn
das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus dem
Chat zu binden, fortzusetzen, zu steuern, zu stoppen oder zu prüfen, sollten
Agenten `/codex ...` gegenüber ACP bevorzugen. ACP bleibt der explizite Fallback,
wenn der Benutzer nach ACP/acpx fragt oder den ACP-Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche
Kompatibilitätsschicht bei. Dies sind prozessinterne OpenClaw-Hooks, keine
Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über das Codex-`Stop`-Relay
- `agent_end`

Plugins können außerdem Runtime-neutrale Tool-Ergebnis-Middleware registrieren,
um dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool
ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Dies ist vom
öffentlichen `tool_result_persist`-Plugin-Hook getrennt, der
OpenClaw-eigene Transkript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Zu den Semantiken der Plugin-Hooks selbst siehe [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten
OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` behalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn
sie native App-Server-Ausführung wünschen. Veraltete `codex/*`-Modellreferenzen
wählen den Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber
Runtime-gestützte alte Provider-Präfixe werden nicht als normale Modell-/
Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, statt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Pfad für Codex
OAuth/Abonnement, und native App-Server-Ausführung bleibt eine explizite
Runtime-Auswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                       | Modellreferenz            | Runtime-Konfiguration                  | Plugin-Anforderung         | Erwartetes Statuslabel         |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI-API über den normalen OpenClaw-Runner | `openai/gpt-*`             | weggelassen oder `runtime: "pi"`       | OpenAI-Provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/Abonnement über PI              | `openai-codex/gpt-*`       | weggelassen oder `runtime: "pi"`       | OpenAI-Codex-OAuth-Provider | `Runtime: OpenClaw Pi Default` |
| Native eingebettete Codex-App-Server-Turns  | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex`-Plugin              | `Runtime: OpenAI Codex`        |
| Gemischte Provider mit konservativem Auto-Modus | Provider-spezifische Referenzen | `agentRuntime.id: "auto"`              | Optionale Plugin-Runtimes   | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Sitzung         | ACP-prompt-/modellabhängig | `sessions_spawn` mit `runtime: "acp"` | fehlerfreies `acpx`-Backend | ACP-Task-/Sitzungsstatus       |

Die wichtige Trennung ist Provider versus Runtime:

- `openai-codex/*` beantwortet: „Welche Provider-/Authentifizierungsroute soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet: „Welche Schleife soll diesen
  eingebetteten Turn ausführen?“
- `/codex ...` beantwortet: „Welche native Codex-Unterhaltung soll dieser Chat
  binden oder steuern?“
- ACP beantwortet: „Welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie
`openai-codex/*`, wenn Sie Codex OAuth über PI möchten; verwenden Sie `openai/*`,
wenn Sie direkten OpenAI-API-Zugriff möchten oder wenn Sie den nativen
Codex-App-Server-Harness erzwingen:

| Modellreferenz                               | Runtime-Pfad                                | Verwenden, wenn                                                           |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing    | Sie aktuellen direkten Zugriff auf die OpenAI Platform API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth über OpenClaw/PI          | Sie ChatGPT-/Codex-Abonnementauthentifizierung mit dem Standard-PI-Runner möchten. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                     | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

GPT-5.5 ist in OpenClaw derzeit nur über Abonnement/OAuth verfügbar. Verwenden
Sie `openai-codex/gpt-5.5` für PI OAuth oder `openai/gpt-5.5` mit dem
Codex-App-Server-Harness. Direkter API-Schlüssel-Zugriff für
`openai/gpt-5.5` wird unterstützt, sobald OpenAI GPT-5.5 in der öffentlichen API
aktiviert.

Veraltete `codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsaliasse
akzeptiert. Die Doctor-Kompatibilitätsmigration schreibt veraltete primäre
Runtime-Referenzen in kanonische Modellreferenzen um und zeichnet die
Runtime-Richtlinie separat auf, während reine Fallback-Verweise auf veraltete
Referenzen unverändert bleiben, weil Runtime für den gesamten Agent-Container
konfiguriert wird. Neue PI-Codex-OAuth-Konfigurationen sollten
`openai-codex/gpt-*` verwenden; neue native App-Server-Harness-Konfigurationen
sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-Codex-OAuth-
Provider-Pfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Das Codex-App-Server-
Modell muss Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle
schlagen fehl, bevor der Medien-Turn startet.

Verwenden Sie `/status`, um den wirksamen Harness für die aktuelle Sitzung zu
bestätigen. Wenn die Auswahl überrascht, aktivieren Sie Debug-Protokollierung
für das `agents/harness`-Subsystem und prüfen Sie den strukturierten
`agent harness selected`-Datensatz des Gateways. Er enthält die ausgewählte
Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im
`auto`-Modus das Unterstützungsergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn alle folgenden Punkte zutreffen:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agenten ist `openai-codex/*`
- die wirksame Runtime dieses Agenten ist nicht `codex`

Diese Warnung existiert, weil Benutzer oft erwarten, dass „Codex-Plugin
aktiviert“ „native Codex-App-Server-Runtime“ bedeutet. OpenClaw macht diesen
Sprung nicht. Die Warnung bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell in `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-
  Ausführung beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Runtime-Änderung weiterhin `/new`
  oder `/reset`, weil Sitzungs-Runtime-Pins haften bleiben.

Die Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter
Turn ausgeführt wird, zeichnet OpenClaw die ausgewählte Harness-ID in dieser
Sitzung auf und verwendet sie für spätere Turns mit derselben Sitzungs-ID
weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen einen anderen Harness
verwenden sollen; verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu
starten, bevor Sie eine bestehende Unterhaltung zwischen PI und Codex wechseln.
So wird vermieden, ein Transkript über zwei inkompatible native Sitzungssysteme
wiederzugeben.

Altsitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt
behandelt, sobald sie Transkriptverlauf haben. Verwenden Sie `/new` oder
`/reset`, um diese Unterhaltung nach einer Konfigurationsänderung für Codex zu
aktivieren.

`/status` zeigt die wirksame Modell-Runtime. Der Standard-PI-Harness erscheint
als `Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint
als `Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet
  standardmäßig eine kompatible Codex-App-Server-Binärdatei, sodass lokale
  `codex`-Befehle auf `PATH` den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung, die dem App-Server-Prozess oder OpenClaws
  Codex-Authentifizierungsbrücke verfügbar ist. Lokale App-Server-Starts über
  stdio verwenden für jeden Agenten ein von OpenClaw verwaltetes Codex-Home und
  ein isoliertes untergeordnetes `HOME`, sodass sie standardmäßig nicht Ihr
  persönliches `~/.codex`-Konto, Ihre Skills, Plugins, Konfiguration, Ihren
  Thread-Zustand oder native `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch
bleibt OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus
dem Codex-CLI-Konto oder einem OpenClaw-`openai-codex`-Authentifizierungsprofil.
Lokale stdio-App-Server-Starts können auch auf `CODEX_API_KEY` /
`OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei
zwischen Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Runtime gilt für jede
eingebettete Runde dieses Agenten oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Runtime erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diese Runde stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agenten mit `agentRuntime.id: "codex"`.
- Behalten Sie den Standard-Agenten auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie alte `codex/*`-Referenzen nur zur Kompatibilität. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Policy bevorzugen.

Dieses Beispiel behält den Standard-Agenten bei der normalen automatischen Auswahl und
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

- Der standardmäßige `main`-Agent verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der `codex`-Agent verwendet den Codex-App-Server-Harness.
- Wenn Codex für den `codex`-Agenten fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  statt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agenten sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach...                                   | Agent sollte verwenden...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                            | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                    | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                                 | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Codex als Runtime für diesen Agenten verwenden“         | Konfigurationsänderung an `agentRuntime.id`      |
| „Mein ChatGPT/Codex-Abonnement mit normalem OpenClaw verwenden“ | `openai-codex/*`-Modellreferenzen                |
| „Codex über ACP/acpx ausführen“                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agenten |

OpenClaw bewirbt ACP-Spawn-Anleitung für Agenten nur, wenn ACP aktiviert,
dispatchbar und durch ein geladenes Runtime-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und die Plugin-Skills dem Agenten kein ACP-Routing
beibringen.

## Nur-Codex-Bereitstellungen

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agentenrunde
Codex verwendet. Explizite Plugin-Runtimes haben standardmäßig keinen PI-Fallback, daher ist
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

Umgebungsüberschreibung:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann. Setzen Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur, wenn PI bewusst die
fehlende Harness-Auswahl übernehmen soll.

## Codex pro Agent

Sie können einen Agenten nur für Codex konfigurieren, während der Standard-Agent die normale
automatische Auswahl behält:

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

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread nach Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde den Harness wieder aus der aktuellen Konfiguration auflösen.

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

## App-Server-Verbindung und Policy

Standardmäßig startet das Plugin OpenClaws verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei ist als gebündelte Plugin-Runtime-Abhängigkeit deklariert und wird
mit den restlichen Abhängigkeiten des `codex`-Plugins bereitgestellt. Dadurch bleibt die App-Server-
Version an das gebündelte Plugin gebunden, statt an eine beliebige separat installierte lokale Codex-CLI.
Setzen Sie `appServer.command` nur, wenn Sie bewusst eine andere ausführbare Datei verwenden möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Betreiberhaltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerk-Tools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um Codex-Genehmigungen mit Guardian-Prüfung zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet Codex’ nativen Genehmigungspfad mit automatischer Prüfung. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Arbeitsbereichs zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, routet Codex diese Genehmigungsanfrage an den nativen Prüfer statt an eine
menschliche Eingabeaufforderung. Der Prüfer wendet Codex’ Risikorahmen an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus wünschen,
aber unbeaufsichtigte Agenten weiterhin Fortschritt machen müssen.

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Policy-Felder überschreiben `mode` weiterhin, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Auswahlwerten mischen können. Der ältere Reviewer-Wert `guardian_subagent` wird
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
`CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unter dem OpenClaw-Status
dieses Agenten. Codex’ eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, sodass beide Werte für lokale App-Server-
Starts isoliert sind. Dadurch bleiben native Codex-Skills, Plugins, Konfiguration, Konten und Thread-
Status auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen Codex-CLI-Home
des Betreibers einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin durch OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun dies nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agenten werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agenten-
Arbeitsbereich. Native Codex-Plugins, Hooks und Konfigurationsdateien werden zur manuellen Prüfung
gemeldet oder archiviert, statt automatisch aktiviert zu werden, weil sie
Befehle ausführen, MCP-Server bereitstellen oder Zugangsdaten enthalten können.

Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im ChatGPT-Abonnementstil erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale stdio-Fallback über Umgebungsvariablen verwenden App-Server-
Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Umgebungs-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

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

`appServer.clearEnv` betrifft nur den erzeugten Codex-App-Server-Kindprozess.

Unterstützte `appServer`-Felder:

| Feld                | Standardwert                             | Bedeutung                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                     |
| `command`           | verwaltetes Codex-Binary                 | Ausführbare Datei für den stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                   |
| `url`               | nicht gesetzt                            | WebSocket-URL des App-Servers.                                                                                                                                                                                                       |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                            |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für OpenClaws Codex-Isolation pro Agent bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                   |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder durch Guardian geprüfte Ausführung.                                                                                                                                                                    |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                                                                                                             |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandboxmodus, der an Thread-Start/Fortsetzung gesendet wird.                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                     |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                   |

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout
bricht OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine
fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt
werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet
hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` abschließt. Wenn der App-Server danach 60 Sekunden lang still
bleibt, unterbricht OpenClaw nach bestem Aufwand den Codex-Turn, zeichnet einen
Diagnose-Timeout auf und gibt die OpenClaw-Sitzungslane frei, damit nachfolgende
Chatnachrichten nicht hinter einem veralteten nativen Turn eingereiht werden.

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
in derselben geprüften Datei hält wie den Rest des Codex-Harness-Setups.

## Computernutzung

Computernutzung wird in einem eigenen Einrichtungsleitfaden behandelt:
[Codex Computernutzung](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft,
dass der MCP-Server `computer-use` verfügbar ist, und lässt Codex dann die
nativen MCP-Tool-Aufrufe während Codex-Modus-Turns abwickeln.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs
registrieren Sie `cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex Computernutzung](/de/plugins/codex-computer-use) für die Unterscheidung
zwischen Codex-eigener Computernutzung und direkter MCP-Registrierung.

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

Computernutzung ist macOS-spezifisch und kann lokale Betriebssystemberechtigungen
erfordern, bevor der Codex-MCP-Server Apps steuern kann. Wenn
`computerUse.enabled` `true` ist und der MCP-Server nicht verfügbar ist,
schlagen Codex-Modus-Turns fehl, bevor der Thread startet, statt still ohne die
nativen Computernutzungs-Tools zu laufen. Siehe
[Codex Computernutzung](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Grenzen des Remote-Katalogs, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` `true` ist, kann OpenClaw den standardmäßig
gebündelten Codex Desktop Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren,
falls Codex noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new`
oder `/reset`, nachdem Sie die Laufzeit- oder Computernutzungskonfiguration
geändert haben, damit bestehende Sitzungen keine alte PI- oder Codex-Thread-Bindung
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

Modellwechsel bleiben von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an einen
bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell
ausgewählte OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, den
Sandboxmodus und die Service-Stufe erneut an den App-Server. Ein Wechsel von
`openai/gpt-5.5` zu `openai/gpt-5.2` behält die Thread-Bindung bei, fordert
Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Diagnosefeedback für den angehängten Thread nach.
- `/codex computer-use status` prüft das konfigurierte Computernutzungs-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computernutzungs-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Rate-Limit-Status.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

### Häufiger Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack oder einem anderen
Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das
Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie beobachtet haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt das lokale
   Gateway-Diagnose-Zip und sendet, weil die Sitzung das Codex-Harness verwendet,
   außerdem das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine Zeile `Inspect locally` für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl
   `Inspect locally` in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, sodass Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum es ein bestimmtes Tool oder einen bestimmten Plan ausgewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-Feedback-Upload für den aktuell angehängten Thread ohne das vollständige OpenClaw-Gateway-Diagnosepaket wünschen. Für die meisten Supportberichte ist `/diagnostics [note]` der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und die Codex-Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics) für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der OpenClaw-Kern stellt außerdem das nur für Owner verfügbare `/diagnostics [note]` als allgemeinen Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt die Vorbemerkung zu sensiblen Daten, verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert `openclaw gateway diagnostics export --json` jedes Mal über eine explizite Ausführungsgenehmigung an. Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und einer Manifest-Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert dieselbe Genehmigung auch das Senden der relevanten Codex-Feedback-Bundles an OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird, listet aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält OpenClaw den geteilten Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während die Diagnose-Vorbemerkung, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über die private Genehmigungsroute an den Owner gesendet werden. Wenn es keine private Owner-Route gibt, lehnt OpenClaw die Gruppenanfrage ab und bittet den Owner, sie aus einer DM heraus auszuführen.

Der genehmigte Codex-Upload ruft Codex-app-server `feedback/upload` auf und bittet den app-server, Protokolle für jeden aufgeführten Thread und gestartete Codex-Unterthreads einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Feedbackpfad von Codex zu OpenAI-Servern; wenn Codex-Feedback in diesem app-server deaktiviert ist, gibt der Befehl den app-server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das aktuell ausgewählte OpenClaw-Modell an app-server und lässt den erweiterten Verlauf aktiviert.

### Einen Codex-Thread über die CLI inspizieren

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Ihnen in einer Kanalkonversation ein Fehler auffällt und Sie die problematische Codex-Sitzung untersuchen, lokal fortsetzen oder Codex fragen möchten, warum er eine bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist normalerweise, zuerst `/diagnostics [note]` auszuführen: Nachdem Sie die Genehmigung erteilt haben, listet der abgeschlossene Bericht jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel `codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder `/codex threads [filter]` für aktuelle Codex-app-server-Threads abrufen und dann denselben `codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-app-server `0.125.0` oder neuer. Einzelne Steuerungsmethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein zukünftiger oder angepasster app-server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-app-server-Erweiterungs-Middleware | Mit OpenClaw gebündelte Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Niedrigstufiger Codex-Lebenszyklus und native Tool-Richtlinien aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`, `PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben Steuerungen auf Codex-Ebene; sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf angefordert hat, daher löst OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im Harness-Adapter aus. Für native Codex-Tools besitzt Codex den kanonischen Tool-Datensatz. OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über app-server- oder native Hook-Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-app-server-Benachrichtigungen und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen. Die OpenClaw-Ereignisse `before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind Beobachtungen auf Adapterebene, keine Byte-für-Byte-Erfassungen der internen Anfrage- oder Compaction-Payloads von Codex.

Native Codex-`hook/started`- und `hook/completed`-app-server-Benachrichtigungen werden als `codex_app_server.hook`-Agent-Ereignisse für Verlauf und Debugging projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen an diese Grenze an.

Unterstützt in Codex-Runtime v1:

| Oberfläche                                    | Unterstützung                          | Warum                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                            | Codex-app-server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                               |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                            | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                   |
| Dynamische OpenClaw-Tools                     | Unterstützt                            | Codex bittet OpenClaw, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                             |
| Prompt- und Kontext-Plugins                   | Unterstützt                            | OpenClaw baut Prompt-Overlays auf und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                          |
| Kontext-Engine-Lebenszyklus                   | Unterstützt                            | Zusammenstellung, Ingestion oder Wartung nach dem Turn sowie die Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                    |
| Dynamische Tool-Hooks                         | Unterstützt                            | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um dynamische Tools, die OpenClaw gehören.                                                                              |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                               |
| Gate zur Überarbeitung der finalen Antwort    | Über das native Hook-Relay unterstützt | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` bittet Codex um einen weiteren Modelllauf vor der Finalisierung.                                                                |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für verbindlich unterstützte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-app-server `0.125.0` oder neuer. Blockieren wird unterstützt; das Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                | Über das native Hook-Relay unterstützt | Codex `PermissionRequest` kann durch OpenClaw-Richtlinien geroutet werden, sofern die Runtime dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| app-server-Verlaufserfassung                  | Unterstützt                            | OpenClaw zeichnet die Anfrage auf, die es an app-server gesendet hat, sowie die app-server-Benachrichtigungen, die es empfängt.                                                                        |

Nicht unterstützt in Codex-Runtime v1:

| Oberfläche                                        | V1-Grenze                                                                                                                                            | Zukünftiger Pfad                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                   | Codex-native Vor-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                         | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                       |
| Bearbeitbarer Codex-nativer Transkriptverlauf     | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe benötigt werden.     |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert von OpenClaw kontrollierte Transkript-Schreibvorgänge, nicht Codex-native Tool-Datensätze.                                | Transformierte Datensätze könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten          | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste der behaltenen/verworfenen Einträge, kein Token-Delta und keine Zusammenfassungspayload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                           |
| Compaction-Eingriff                               | Aktuelle OpenClaw-Compaction-Hooks sind im Codex-Modus auf Benachrichtigungsebene.                                                                   | Codex-Hooks vor/nach der Compaction hinzufügen, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Model-API-Anfragen       | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.                   | Benötigt ein Codex-Model-Request-Tracing-Ereignis oder eine Debug-API.                         |

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Videos, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Auslieferungspfad.

Die native Hook-Weiterleitung ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Allow- oder Deny-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist kein Allow.
Codex behandelt es als keine Hook-Entscheidung und fällt auf den eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.

Genehmigungsanfragen für Codex-MCP-Tools werden über den Plugin-Genehmigungsfluss von
OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste eingereihte Follow-up-Nachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Elicitation-Anfragen
schlagen weiterhin geschlossen fehl.

Die Steuerung der Active-Run-Warteschlange wird auf Codex-App-Server-`turn/steer` abgebildet. Mit dem
Standardwert `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chat-Nachrichten
für das konfigurierte Ruhefenster und sendet sie in Eingangsreihenfolge als eine `turn/steer`-Anfrage.
Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-Review- und manuelle
Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall verwendet
OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steering-Warteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Model den Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw hält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Model- oder Harness-Wechsel vor. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistententext und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
Codex-native Tool-Ergebnisdatensätze nicht um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein von OpenClaw kontrolliertes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Model-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Model mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt jetzt fehl, statt auf PI zurückzufallen, sofern Sie
nicht explizit `agentRuntime.fallback: "pi"` setzen. Sobald der Codex-App-Server
ausgewählt ist, treten seine Fehler direkt ohne zusätzliche Fallback-Konfiguration zutage.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil der
stabile Protokoll-Mindeststand `0.125.0` das ist, was OpenClaw testet.

**Model-Erkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Model verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Model sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn das Problem bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu bereinigen. Wenn `computer-use.list_apps`
ein Timeout hat, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandte Themen

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Model-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
