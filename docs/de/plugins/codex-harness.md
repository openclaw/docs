---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agenten-Turns über den mitgelieferten Codex-App-Server-Harness ausführen
title: Codex-Ausführungsumgebung
x-i18n:
    generated_at: "2026-05-07T01:53:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin lässt OpenClaw eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte PI-Harness ausführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, native Thread-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle,
Sitzungsdateien, Modellauswahl, Tools, Genehmigungen, Medienauslieferung und
die sichtbare Transkriptspiegelung.

Wenn ein Quell-Chat-Turn über das Codex-Harness läuft, verwenden sichtbare
Antworten standardmäßig das OpenClaw-Tool `message`, sofern die Bereitstellung
`messages.visibleReplies` nicht ausdrücklich konfiguriert hat. Der Agent kann
seinen Codex-Turn weiterhin privat abschließen; er postet nur dann in den
Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um abschließende Antworten in
Direkt-Chats auf dem bisherigen automatischen Zustellpfad zu belassen.

Codex-Heartbeat-Turns erhalten standardmäßig auch das Tool `heartbeat_respond`,
damit der Agent erfassen kann, ob das Aufwachen still bleiben oder benachrichtigen
soll, ohne diesen Kontrollfluss in abschließendem Text zu kodieren.

Heartbeat-spezifische Hinweise zur Initiative werden als Codex-Entwickleranweisung
im Kollaborationsmodus direkt im Heartbeat-Turn gesendet. Normale Chat-Turns
stellen stattdessen den Codex-Default-Modus wieder her, statt Heartbeat-Philosophie
in ihrem normalen Laufzeit-Prompt mitzunehmen.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diesen Weg: Melden
Sie sich mit einem ChatGPT/Codex-Abonnement an und führen Sie dann eingebettete
Agent-Turns über die native Codex-App-Server-Laufzeit aus. Die Modellreferenz
bleibt weiterhin kanonisch als `openai/gpt-*`; die Abonnement-Authentifizierung
kommt aus dem Codex-Konto/-Profil, nicht aus einem Modellpräfix
`openai-codex/*`.

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `codex` dort
ebenfalls auf:

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

Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Dieses Präfix ist
ein Legacy-Pfad, den `openclaw doctor --fix` in primären Modellen, Fallbacks,
Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanal-Overrides und veralteten
persistierten Sitzungs-Routen-Pins zu `openai/gpt-*` umschreibt.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere getrennte Fähigkeiten bereit:

| Fähigkeit                         | So verwenden Sie sie                               | Was sie bewirkt                                                              |
| --------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Native eingebettete Laufzeit      | `agentRuntime.id: "codex"`                         | Führt eingebettete OpenClaw-Agent-Turns über den Codex-App-Server aus.       |
| Native Chat-Steuerungsbefehle     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex-App-Server-Provider/-Katalog | `codex`-Interna, über das Harness bereitgestellt   | Ermöglicht der Laufzeit, App-Server-Modelle zu erkennen und zu validieren.   |
| Codex-Medienverständnispfad       | `codex/*`-Kompatibilitätspfade für Bildmodelle     | Führt begrenzte Codex-App-Server-Turns für unterstützte Bildverständnismodelle aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks rund um Codex-native Ereignisse       | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten oder zu blockieren. |

Das Aktivieren des Plugins macht diese Fähigkeiten verfügbar. Es bewirkt **nicht**:

- dass Codex für jedes OpenAI-Modell verwendet wird
- dass `openai-codex/*`-Modellreferenzen ohne Doctor in die native Laufzeit
  umgewandelt werden, der verifiziert, dass Codex installiert und aktiviert ist,
  das `codex`-Harness bereitstellt und OAuth-bereit ist
- dass ACP/acpx zum Standardpfad für Codex wird
- dass bestehende Sitzungen, die bereits eine PI-Laufzeit aufgezeichnet haben,
  automatisch umgeschaltet werden
- dass OpenClaw-Kanalzustellung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichten-Routing ersetzt werden

Dasselbe Plugin verwaltet auch die native `/codex`-Chat-Steuerungsoberfläche.
Wenn das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus
dem Chat zu binden, fortzusetzen, zu steuern, zu stoppen oder zu inspizieren,
sollten Agents `/codex ...` gegenüber ACP bevorzugen. ACP bleibt der ausdrückliche
Fallback, wenn der Benutzer ACP/acpx anfordert oder den ACP-Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche
Kompatibilitätsschicht bei. Dies sind prozessinterne OpenClaw-Hooks, keine
Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkript-Datensätze
- `before_agent_finalize` über die Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können außerdem laufzeitneutrale Tool-Ergebnis-Middleware registrieren,
um dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool
ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Dies ist
getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der
OpenClaw-eigene Transkript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Informationen zur Semantik der Plugin-Hooks selbst finden Sie unter
[Plugin-Hooks](/de/plugins/hooks) und [Plugin-Guard-Verhalten](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten
OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` belassen und
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` ausdrücklich
erzwingen, wenn sie native App-Server-Ausführung möchten. Legacy-`codex/*`-
Modellreferenzen wählen das Harness aus Kompatibilitätsgründen weiterhin
automatisch aus, aber laufzeitgestützte Legacy-Provider-Präfixe werden nicht als
normale Modell-/Provider-Auswahl angezeigt.

Wenn eine konfigurierte Modellroute noch `openai-codex/*` ist, schreibt
`openclaw doctor --fix` sie zu `openai/*` um. Für passende Agent-Routen setzt es
die Agent-Laufzeit nur dann auf `codex`, wenn das Codex-Plugin installiert und
aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat;
andernfalls setzt es die Laufzeit auf `pi`.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                              | Modellreferenz            | Laufzeitkonfiguration                  | Auth-/Profilroute           | Erwartetes Statuslabel         |
| -------------------------------------------------- | ------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| ChatGPT/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`        |
| OpenAI-API über normalen OpenClaw-Runner           | `openai/gpt-*`            | ausgelassen oder `runtime: "pi"`       | OpenAI-API-Schlüssel         | `Runtime: OpenClaw Pi Default` |
| Legacy-Konfiguration, die Doctor-Reparatur benötigt | `openai-codex/gpt-*`      | repariert zu `codex` oder `pi`         | Bestehende konfigurierte Auth | Nach `doctor --fix` erneut prüfen |
| Gemischte Provider mit konservativem Auto-Modus    | providerspezifische Referenzen | `agentRuntime.id: "auto"`          | Je ausgewähltem Provider     | Hängt von der ausgewählten Laufzeit ab |
| Explizite Codex-ACP-Adaptersitzung                 | ACP-prompt-/modellabhängig | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Auth             | ACP-Aufgaben-/Sitzungsstatus   |

Die wichtige Trennung ist Provider gegenüber Laufzeit:

- `openai-codex/*` ist ein Legacy-Pfad, den Doctor umschreibt.
- `agentRuntime.id: "codex"` erfordert das Codex-Harness und schlägt geschlossen
  fehl, wenn es nicht verfügbar ist.
- `agentRuntime.id: "auto"` lässt registrierte Harnesses passende Provider-Routen
  beanspruchen, aber kanonische OpenAI-Referenzen bleiben PI-verwaltet, sofern
  kein Harness dieses Provider-/Modellpaar unterstützt.
- `/codex ...` beantwortet „welche native Codex-Unterhaltung soll dieser Chat
  binden oder steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix auswählen

Routen der OpenAI-Familie sind präfixspezifisch. Für die übliche Einrichtung mit
Abonnement plus nativer Codex-Laufzeit verwenden Sie `openai/*` mit
`agentRuntime.id: "codex"`. Behandeln Sie `openai-codex/*` als
Legacy-Konfiguration, die Doctor umschreiben sollte:

| Modellreferenz                                | Laufzeitpfad                                  | Verwenden, wenn                                                           |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing     | Sie aktuellen direkten Zugriff auf die OpenAI-Platform-API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | Durch Doctor reparierter Legacy-Pfad          | Sie eine alte Konfiguration verwenden; führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                      | Sie ChatGPT/Codex-Abonnement-Auth mit nativer Codex-Ausführung möchten.   |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüsselrouten als auch auf
Codex-Abonnementrouten erscheinen, wenn Ihr Konto diese bereitstellt. Verwenden
Sie `openai/gpt-5.5` mit dem Codex-App-Server-Harness für die native
Codex-Laufzeit oder `openai/gpt-5.5` ohne Codex-Laufzeit-Override für direkten
API-Schlüssel-Traffic.

Legacy-`codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsaliase
akzeptiert. Die Doctor-Kompatibilitätsmigration schreibt Legacy-Laufzeitreferenzen
in kanonische Modellreferenzen um und zeichnet die Laufzeitrichtlinie separat
auf. Neue native App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai/gpt-*` für die normale OpenAI-Route und `codex/gpt-*`, wenn
Bildverständnis über einen begrenzten Codex-App-Server-Turn laufen soll.
Verwenden Sie nicht `openai-codex/gpt-*`; Doctor schreibt dieses Legacy-Präfix
zu `openai/gpt-*` um. Das Codex-App-Server-Modell muss Unterstützung für
Bildeingaben ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der
Medien-Turn startet.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu
bestätigen. Wenn die Auswahl überraschend ist, aktivieren Sie Debug-Logging für
das Subsystem `agents/harness` und prüfen Sie den strukturierten Gateway-Datensatz
`agent harness selected`. Er enthält die ausgewählte Harness-ID, den Auswahlgrund,
die Laufzeit-/Fallback-Richtlinie und im Modus `auto` das Support-Ergebnis jedes
Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn konfigurierte Modellreferenzen oder persistierter
Sitzungsroutenstatus noch `openai-codex/*` verwenden. `openclaw doctor --fix`
schreibt diese Routen um zu:

- `openai/<model>`
- `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, das
  `codex`-Harness bereitstellt und nutzbares OAuth hat
- andernfalls `agentRuntime.id: "pi"`

Die Route `codex` erzwingt das native Codex-Harness. Die Route `pi` hält den
Agent auf dem standardmäßigen OpenClaw-Runner, statt Codex als Nebeneffekt der
Legacy-Routenbereinigung zu aktivieren oder zu installieren.
Doctor repariert außerdem veraltete persistierte Sitzungspins in erkannten
Agent-Sitzungsspeichern, damit alte Unterhaltungen nicht auf der entfernten Route
festhängen.

Die Harness-Auswahl ist keine Steuerung einer Live-Sitzung. Wenn ein eingebetteter Turn ausgeführt wird,
zeichnet OpenClaw die ausgewählte Harness-ID für diese Sitzung auf und verwendet sie
für spätere Turns mit derselben Sitzungs-ID weiter. Ändern Sie die Konfiguration `agentRuntime` oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex umschalten. Dadurch wird vermieden, dass ein Transcript durch
zwei inkompatible native Sitzungssysteme wiedergegeben wird.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transcript-Verlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer
Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die wirksame Modell-Runtime an. Das Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und das Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung muss für den App-Server-Prozess oder für OpenClaws Codex-Authentifizierungs-Bridge
  verfügbar sein. Lokale App-Server-Starts verwenden für jeden
  Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`, sodass sie Ihr persönliches
  `~/.codex`-Konto, Ihre Skills, Plugins, Konfiguration, Thread-Zustand oder nativen
  `$HOME/.agents/skills` standardmäßig nicht lesen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise vom Codex-CLI-Konto
oder einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, da Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für Workspace-Parität in OpenClaw löst das Codex-Harness die anderen Bootstrap-Dateien
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, wenn vorhanden) auf und leitet sie über Codex-
Entwickleranweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben
`SOUL.md` und verwandter Workspace-Persona-/Profilkontext auf der nativen
Codex-Verhaltenssteuerungsebene sichtbar, ohne `AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln können soll. Eine erzwungene Runtime gilt für jeden
eingebetteten Turn dieses Agenten oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Runtime erzwungen ist, versucht OpenClaw weiterhin das Codex-Harness und schlägt geschlossen fehl,
anstatt diesen Turn stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agenten mit `agentRuntime.id: "codex"`.
- Belassen Sie den Standard-Agenten bei `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-Referenzen `codex/*` nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Richtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agenten bei der normalen automatischen Auswahl und
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

- Der Standard-Agent `main` verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet das Codex-App-Server-Harness.
- Wenn Codex für den Agenten `codex` fehlt oder nicht unterstützt wird, schlägt der Turn fehl,
  anstatt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agenten sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                | Agent sollte verwenden ...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Support-Bericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Mein ChatGPT-/Codex-Abonnement mit der Codex-Runtime verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Alte `openai-codex/*`-Konfigurations-/Sitzungs-Pins reparieren“ | `openclaw doctor --fix`                          |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agenten |

OpenClaw bewirbt ACP-Spawn-Anleitungen für Agenten nur dann, wenn ACP aktiviert,
dispatchbar und durch ein geladenes Runtime-Backend abgesichert ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills dem Agenten kein ACP-Routing
beibringen.

## Nur-Codex-Deployments

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
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

Umgebungs-Override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, falls das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agenten nur für Codex konfigurieren, während der Standard-Agent die normale
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

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread nach Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt den nächsten Turn das Harness wieder aus der aktuellen Konfiguration auflösen.

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

Standardmäßig startet das Plugin OpenClaws verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gekoppelt, statt an die jeweils separat
lokal installierte Codex CLI. Setzen Sie `appServer.command` nur dann, wenn
Sie absichtlich eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die
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

Der Guardian-Modus verwendet Codex' nativen Auto-Review-Genehmigungspfad. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Prüfer weiter, statt an eine
menschliche Eingabeaufforderung. Der Prüfer wendet Codex' Risikorahmen an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Schutzvorkehrungen als im YOLO-Modus
möchten, aber unbeaufsichtigte Agenten trotzdem Fortschritte machen müssen.

Das Preset `guardian` erweitert sich zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Deployments
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
aber OpenClaw besitzt die Codex-App-Server-Konto-Bridge und setzt sowohl
`CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse im OpenClaw-Zustand
dieses Agenten. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-
Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Zustand auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen
Codex-CLI-Home des Operators einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin über OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun dies nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agenten werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-
Workspace. Native Codex-Plugins, Hooks und Konfigurationsdateien werden zur manuellen Prüfung
gemeldet oder archiviert, statt automatisch aktiviert zu werden, da sie
Befehle ausführen, MCP-Server verfügbar machen oder Zugangsdaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale stdio-Fallback mit Umgebungsvariablen-Schlüssel verwenden die App-Server-
Anmeldung statt der geerbten Umgebung des untergeordneten Prozesses. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Umgebungsfallback für API-Schlüssel; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

Wenn ein Deployment zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu
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

Dynamische Codex-Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine dynamischen Tools bereit, die native Codex-Workspace-Operationen
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                      |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um Codex-App-Servern den vollständigen dynamischen Tool-Satz von OpenClaw bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden. |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` erzeugt Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                |
| `command`           | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                             |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                                                                                                                      |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                                  |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für die agentenspezifische Codex-Isolation von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder guardian-geprüfte Ausführung.                                                                                                                                                                                    |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/-Fortsetzung/-Turn gesendet wird.                                                                                                                                                     |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/-Fortsetzung gesendet wird.                                                                                                                                                                   |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                               |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Serviceklasse: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                            |

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht OpenClaw das Tool-
Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene dynamische Tool-Antwort an Codex zurück, damit
der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-spezifische App-Server-Anfrage von Codex geantwortet hat, erwartet das Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server nach dieser Antwort 60 Sekunden lang still bleibt, unterbricht OpenClaw nach bestem Bemühen
den Codex-Turn, zeichnet einen Diagnose-Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten
nativen Turn in der Warteschlange hängen.

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
geprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Computernutzung

Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen
MCP-Tool-Aufrufe während Turns im Codex-Modus verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs registrieren Sie
`cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex-Computernutzung](/de/plugins/codex-computer-use) für die Unterscheidung
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

Computernutzung ist macOS-spezifisch und kann lokale OS-Berechtigungen erfordern, bevor der
Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist und der MCP-
Server nicht verfügbar ist, schlagen Turns im Codex-Modus fehl, bevor der Thread startet, statt
stillschweigend ohne die nativen Computernutzungstools zu laufen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Kataloggrenzen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex-Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, falls Codex
noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new` oder `/reset`, nachdem Sie
Runtime- oder Computernutzungskonfiguration geändert haben, damit bestehende Sitzungen keine alte
PI- oder Codex-Thread-Bindung behalten.

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

Der Modellwechsel bleibt OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn erneut das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Serviceklasse an den
App-Server. Der Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu verdichten.
- `/codex review` startet die native Codex-Überprüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Diagnosefeedback für den angehängten Thread nach.
- `/codex computer-use status` prüft das konfigurierte Computer Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

Wenn Codex einen Fehler wegen eines Nutzungslimits meldet, enthält OpenClaw die nächste
Zurücksetzzeit des App-Servers, sofern Codex eine bereitgestellt hat. Verwenden Sie `/codex account` in derselben
Unterhaltung, um die aktuellen Konto- und Ratenlimitfenster zu prüfen.

### Üblicher Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanforderung einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, da die Sitzung den Codex-Harness verwendet, außerdem
   das relevante Codex-Feedbackpaket an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Paketpfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen `Inspect locally`-
   Befehl in einem Terminal aus. Er sieht wie `codex resume <thread-id>` aus und öffnet den
   nativen Codex-Thread, damit Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum es ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnosepaket wünschen. Für die meisten Supportberichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und die Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der Kern von OpenClaw stellt außerdem owner-only `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt die Präambel zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche Exec-Genehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Allow-All-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Paketpfad und der Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert
dieselbe Genehmigung außerdem das Senden der relevanten Codex-Feedbackpakete an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird,
listet aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während die
Diagnosepräambel, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über
die private Genehmigungsroute an den Owner gesendet werden. Wenn es keine private Owner-Route gibt,
lehnt OpenClaw die Gruppenanfrage ab und fordert den Owner auf, sie aus einer Direktnachricht auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex-App-Servers auf und bittet
den App-Server, Logs für jeden aufgeführten Thread und erzeugte Codex-Subthreads
einzuschließen, sofern verfügbar. Der Upload läuft über Codex' normalen Feedbackpfad zu OpenAI-
Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt erweiterte Historie
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie in einer Kanalunterhaltung einen Fehler bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum es eine
bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist in der Regel, zuerst
`/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch aus `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex-App-Server-Threads abrufen und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuerungsmethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesse hinweg.  |
| Codex-App-Server-Erweiterungs-Middleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungs-Bridge
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Wenn Codex-App-Server-Genehmigungen aktiviert sind
(`approvalPolicy` ist nicht `"never"`), lässt die standardmäßig injizierte native Hook-Konfiguration
`PermissionRequest` aus, damit der App-Server-Reviewer von Codex und die Genehmigungs-
Bridge von OpenClaw echte Eskalationen nach der Überprüfung behandeln. Operatoren können
weiterhin explizit `permission_request` zu `nativeHookRelay.events` hinzufügen, wenn sie das Kompatibilitäts-
Relay benötigen. Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben
Steuerungen auf Codex-Ebene; sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im
Harness-Adapter auslöst. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über den App-Server oder native Hook-
Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-App-Server-
Benachrichtigungen und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfrage- oder Compaction-Payloads von Codex.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed`
werden als `codex_app_server.hook`-Agent-Ereignisse für Verlauf und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex Runtime v1:

| Oberfläche                                    | Unterstützung                                                                        | Warum                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                                                                         | Der Codex App-Server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                               |
| OpenClaw-Kanal-Routing und -Zustellung        | Unterstützt                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Laufzeit.                                                                                                      |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                         | Codex bittet OpenClaw, diese Tools auszuführen, daher bleibt OpenClaw im Ausführungspfad.                                                                                                                  |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                         | OpenClaw baut Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                                  |
| Lebenszyklus der Kontext-Engine               | Unterstützt                                                                         | Zusammenstellung, Aufnahme oder Wartung nach dem Turn sowie die Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                         |
| Dynamische Tool-Hooks                         | Unterstützt                                                                         | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw gehören.                                                                                       |
| Lifecycle-Hooks                               | Als Adapter-Beobachtungen unterstützt                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                    |
| Final-Antwort-Überarbeitungs-Gate             | Über das native Hook-Relay unterstützt                                                | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                           |
| Nativer Shell-, Patch- und MCP-Block oder Beobachtung | Über das native Hook-Relay unterstützt                                       | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; das Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                | Über Codex App-Server-Genehmigungen und das native Kompatibilitäts-Hook-Relay unterstützt | Genehmigungsanfragen des Codex App-Servers werden nach der Codex-Prüfung über OpenClaw geleitet. Das native Hook-Relay `PermissionRequest` ist für native Genehmigungsmodi optional, weil Codex es vor der Guardian-Prüfung ausgibt. |
| App-Server-Trajektorienerfassung              | Unterstützt                                                                         | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                        |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                           | V1-Grenze                                                                                                                                       | Zukünftiger Weg                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                 |
| Bearbeitbarer Codex-nativer Transkriptverlauf        | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite Codex App-Server-APIs hinzufügen, falls native Thread-Chirurgie nötig ist.      |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert Transkriptschreibvorgänge, die OpenClaw gehören, nicht Codex-native Tool-Datensätze.                                | Könnte transformierte Datensätze spiegeln, aber die kanonische Umschreibung braucht Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Beibehalten-/Verworfen-Liste, kein Token-Delta und keine Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                      |
| Compaction-Eingriff                                 | Aktuelle OpenClaw-Compaction-Hooks sind im Codex-Modus auf Benachrichtigungsebene.                                                             | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Modell-API-Anfrageerfassung              | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber Codex Core baut die endgültige OpenAI-API-Anfrage intern.              | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

OpenClaw baut weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben
laufen weiterhin über den normalen OpenClaw-Zustellungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Erlauben- oder Ablehnen-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Erlaubnis. Codex behandelt es als keine
Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.
Genehmigungsmodi des Codex App-Servers lassen diesen nativen Hook standardmäßig weg; dieser Absatz
gilt, wenn `permission_request` explizit in
`nativeHookRelay.events` enthalten ist oder eine Kompatibilitätslaufzeit ihn installiert.
Wenn ein Operator `allow-always` für eine native Codex-Berechtigungsanfrage wählt,
merkt sich OpenClaw den exakt passenden Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerprint für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist absichtlich nur eine exakte Übereinstimmung:
Ein geänderter Befehl, geänderte Argumente, eine geänderte Tool-Payload oder ein geändertes cwd erzeugt eine neue
Genehmigung.

Codex-MCP-Tool-Genehmigungsaufforderungen werden durch den Plugin-Genehmigungsfluss von OpenClaw
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Aufforderungsanfragen
schlagen weiterhin geschlossen fehl.

Aktive Run-Queue-Steuerung wird auf Codex App-Server `turn/steer` abgebildet. Mit dem
Standardwert `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie als eine `turn/steer`-Anfrage in
Eingangsreihenfolge. Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Prüfungs- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Queue, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steering-Queue](/de/concepts/queue-steering).

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftiges Modell- oder Harness-Wechseln. Die
Spiegelung enthält den Benutzerprompt, den endgültigen Assistant-Text und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Heute zeichnet OpenClaw nur
Signale zum Start und Abschluss nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
keine Codex-nativen Tool-Ergebnisdatensätze um. Es gilt nur, wenn
OpenClaw ein Tool-Ergebnis in ein Transkript einer Sitzung schreibt, die OpenClaw gehört.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medien-
Verständnis nutzen weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow` `codex`
ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Run beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex App-Server
ausgewählt ist, werden seine Fehler direkt angezeigt.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Vorabversionen derselben Version oder Builds mit Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil der
stabile Protokoll-Mindeststand `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn das Problem weiterhin besteht, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
mit einer Zeitüberschreitung endet, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
