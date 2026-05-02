---
read_when:
    - Sie möchten die mitgelieferte Codex-App-Server-Testumgebung verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, anstatt auf Pi zurückzufallen
summary: Eingebettete OpenClaw-Agent-Durchläufe über den mitgelieferten Codex-App-Server-Harness ausführen
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-05-02T23:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin lässt OpenClaw eingebettete Agent-Turns über den
Codex app-server statt über das eingebaute PI-Harness ausführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Session übernehmen soll:
Modellerkennung, natives Thread-Resume, native Compaction und app-server-Ausführung.
OpenClaw bleibt weiterhin zuständig für Chat-Kanäle, Session-Dateien, Modellauswahl,
Tools, Genehmigungen, Medienzustellung und die sichtbare Transcript-Spiegelung.

Wenn ein Quell-Chat-Turn über das Codex-Harness läuft, verwenden sichtbare Antworten
standardmäßig das OpenClaw-`message`-Tool, sofern das Deployment
`messages.visibleReplies` nicht ausdrücklich konfiguriert hat. Der Agent kann seinen
Codex-Turn weiterhin privat abschließen; er postet nur dann in den Kanal, wenn er
`message(action="send")` aufruft. Setzen Sie `messages.visibleReplies: "automatic"`,
um finale Antworten in direkten Chats weiterhin über den alten automatischen
Zustellpfad auszuliefern.

Codex-Heartbeat-Turns erhalten außerdem standardmäßig das Tool `heartbeat_respond`,
damit der Agent erfassen kann, ob der Wake still bleiben oder benachrichtigen soll,
ohne diesen Kontrollfluss in finalen Text zu codieren.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diese Route: mit
einem ChatGPT/Codex-Abonnement anmelden und eingebettete Agent-Turns dann über die
native Codex app-server-Runtime ausführen. Die Modellreferenz bleibt weiterhin
kanonisch `openai/gpt-*`; die Abonnement-Authentifizierung kommt aus dem
Codex-Konto/-Profil, nicht aus einem `openai-codex/*`-Modellpräfix.

Melden Sie sich zuerst mit Codex OAuth an, falls Sie das noch nicht getan haben:

```bash
openclaw models auth login --provider openai-codex
```

Aktivieren Sie dann das gebündelte `codex`-Plugin und erzwingen Sie die
Codex-Runtime:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort ebenfalls
`codex` auf:

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

Verwenden Sie nicht `openai-codex/gpt-*`, wenn Sie die native Codex-Runtime
meinen. Dieses Präfix ist die explizite Route „Codex OAuth über PI“.
Konfigurationsänderungen gelten für neue oder zurückgesetzte Sessions;
bestehende Sessions behalten ihre aufgezeichnete Runtime.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere separate Fähigkeiten bereit:

| Fähigkeit                         | Wie Sie sie verwenden                              | Was sie bewirkt                                                             |
| --------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                         | Führt eingebettete OpenClaw-Agent-Turns über Codex app-server aus.          |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex app-server-Threads aus einer Messaging-Unterhaltung. |
| Codex app-server-Provider/-Katalog | `codex`-Interna, über das Harness offengelegt      | Ermöglicht der Runtime, app-server-Modelle zu erkennen und zu validieren.   |
| Codex-Pfad für Medienverständnis  | `codex/*`-Kompatibilitätspfade für Bildmodelle     | Führt begrenzte Codex app-server-Turns für unterstützte Modelle zum Bildverständnis aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks rund um Codex-native Ereignisse       | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Durch das Aktivieren des Plugins werden diese Fähigkeiten verfügbar. Es bewirkt
**nicht**:

- Codex für jedes OpenAI-Modell zu verwenden
- `openai-codex/*`-Modellreferenzen in die native Runtime umzuwandeln
- ACP/acpx zum Standard-Codex-Pfad zu machen
- bestehende Sessions, die bereits eine PI-Runtime aufgezeichnet haben, im laufenden Betrieb umzuschalten
- OpenClaw-Kanalzustellung, Session-Dateien, Auth-Profil-Speicherung oder
  Nachrichten-Routing zu ersetzen

Dasselbe Plugin besitzt auch die native `/codex`-Chat-Steuerbefehlsoberfläche.
Wenn das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus
dem Chat zu binden, fortzusetzen, zu steuern, zu stoppen oder zu inspizieren,
sollten Agents `/codex ...` gegenüber ACP bevorzugen. ACP bleibt der explizite
Fallback, wenn der Benutzer ACP/acpx verlangt oder den ACP-Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche
Kompatibilitätsschicht. Dies sind prozessinterne OpenClaw-Hooks, keine
Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transcript-Einträge
- `before_agent_finalize` über die Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können außerdem runtime-neutrale Tool-Ergebnis-Middleware registrieren,
um dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool
ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Das ist
getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der von OpenClaw
verwaltete Transcript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Die Semantik der Plugin-Hooks selbst finden Sie unter
[Plugin-Hooks](/de/plugins/hooks) und
[Plugin-Guard-Verhalten](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten
OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` beibehalten und
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` ausdrücklich
erzwingen, wenn native app-server-Ausführung gewünscht ist. Alte
`codex/*`-Modellreferenzen wählen aus Kompatibilitätsgründen weiterhin
automatisch das Harness aus, aber runtime-gestützte alte Provider-Präfixe werden
nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, statt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Pfad für Codex
OAuth/Abonnement, und native app-server-Ausführung bleibt eine explizite
Runtime-Auswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                               | Modellreferenz             | Runtime-Konfiguration                 | Auth-/Profilroute            | Erwartetes Statuslabel         |
| --------------------------------------------------- | -------------------------- | ------------------------------------- | ---------------------------- | ------------------------------ |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`        |
| OpenAI API über normalen OpenClaw-Runner            | `openai/gpt-*`             | ausgelassen oder `runtime: "pi"`      | OpenAI-API-Schlüssel         | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-Abonnement über PI                    | `openai-codex/gpt-*`       | ausgelassen oder `runtime: "pi"`      | OpenAI Codex OAuth-Provider  | `Runtime: OpenClaw Pi Default` |
| Gemischte Provider mit konservativem Automatikmodus | provider-spezifische Referenzen | `agentRuntime.id: "auto"`         | Je ausgewähltem Provider     | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Session                 | Abhängig von ACP-Prompt/-Modell | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Authentifizierung | ACP-Aufgaben-/Session-Status   |

Die wichtige Trennung ist Provider gegenüber Runtime:

- `openai-codex/*` beantwortet „Welche Provider-/Authentifizierungsroute soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet „Welche Schleife soll diesen
  eingebetteten Turn ausführen?“
- `/codex ...` beantwortet „Welche native Codex-Unterhaltung soll dieser Chat
  binden oder steuern?“
- ACP beantwortet „Welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Für die übliche Einrichtung mit
Abonnement plus nativer Codex-Runtime verwenden Sie `openai/*` mit
`agentRuntime.id: "codex"`. Verwenden Sie `openai-codex/*` nur, wenn Sie
absichtlich Codex OAuth über PI wünschen:

| Modellreferenz                               | Runtime-Pfad                                 | Verwendung                                                                 |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenAI-Provider über OpenClaw/PI-Plumbing    | Sie möchten aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth über OpenClaw/PI          | Sie möchten ChatGPT/Codex-Abonnement-Authentifizierung mit dem Standard-PI-Runner. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-Harness                    | Sie möchten ChatGPT/Codex-Abonnement-Authentifizierung mit nativer Codex-Ausführung. |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel-Routen als auch auf
Codex-Abonnement-Routen erscheinen, wenn Ihr Konto sie bereitstellt. Verwenden
Sie `openai/gpt-5.5` mit dem Codex app-server-Harness für native
Codex-Runtime, `openai-codex/gpt-5.5` für PI OAuth oder `openai/gpt-5.5` ohne
Codex-Runtime-Override für direkten API-Schlüssel-Traffic.

Alte `codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsalias
akzeptiert. Die Doctor-Kompatibilitätsmigration schreibt alte primäre
Runtime-Referenzen in kanonische Modellreferenzen um und zeichnet die
Runtime-Richtlinie separat auf, während alte Referenzen, die nur als Fallback
dienen, unverändert bleiben, weil die Runtime für den gesamten Agent-Container
konfiguriert wird. Neue PI-Codex-OAuth-Konfigurationen sollten
`openai-codex/gpt-*` verwenden; neue native app-server-Harness-Konfigurationen
sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-Codex-OAuth-Provider-Pfad
laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis über einen
begrenzten Codex app-server-Turn laufen soll. Das Codex app-server-Modell muss
Unterstützung für Bildeingaben deklarieren; reine Text-Codex-Modelle schlagen
fehl, bevor der Medien-Turn startet.

Verwenden Sie `/status`, um das wirksame Harness für die aktuelle Session zu
bestätigen. Wenn die Auswahl überraschend ist, aktivieren Sie Debug-Logging für
das Subsystem `agents/harness` und prüfen Sie den strukturierten
`agent harness selected`-Eintrag des Gateways. Er enthält die ausgewählte
Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im Modus
`auto` das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn alle diese Bedingungen zutreffen:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agents ist `openai-codex/*`
- die wirksame Runtime dieses Agents ist nicht `codex`

Diese Warnung existiert, weil Benutzer häufig erwarten, dass „Codex-Plugin
aktiviert“ „native Codex app-server-Runtime“ bedeutet. OpenClaw zieht diesen
Schluss nicht. Die Warnung bedeutet:

- **Keine Änderung ist erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native app-server-Ausführung
  beabsichtigt haben.
- Bestehende Sessions benötigen nach einer Runtime-Änderung weiterhin `/new`
  oder `/reset`, weil Session-Runtime-Pins sticky sind.

Die Harness-Auswahl ist keine Live-Session-Steuerung. Wenn ein eingebetteter
Turn läuft, zeichnet OpenClaw die ausgewählte Harness-ID in dieser Session auf
und verwendet sie für spätere Turns in derselben Session-ID weiter. Ändern Sie
die `agentRuntime`-Konfiguration oder `OPENCLAW_AGENT_RUNTIME`, wenn zukünftige
Sessions ein anderes Harness verwenden sollen; verwenden Sie `/new` oder
`/reset`, um eine frische Session zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex umschalten. Dadurch wird vermieden, dass ein
Transcript durch zwei inkompatible native Session-Systeme wiedergegeben wird.

Alte Sessions, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt
behandelt, sobald sie Transcript-Verlauf haben. Verwenden Sie `/new` oder
`/reset`, um diese Unterhaltung nach einer Konfigurationsänderung für Codex zu
aktivieren.

`/status` zeigt die effektive Modelllaufzeit an. Der Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH` den
  normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung verfügbar für den App-Server-Prozess oder für OpenClaws Codex-Authentifizierungs-
  Bridge. Lokale App-Server-Starts verwenden für jeden
  Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`, sodass sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Skills, Plugins, Konfiguration, Thread-Status oder native
  `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung üblicherweise aus dem Codex-CLI-Konto
oder aus einem OpenClaw-Authentifizierungsprofil `openai-codex`. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über native Projektdokument-Erkennung. OpenClaw
schreibt keine synthetischen Codex-Projektdokument-Dateien und ist für Persona-Dateien nicht von Codex-Fallback-
Dateinamen abhängig, da Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-
Dateien auf (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, wenn vorhanden) und leitet sie über Codex-
Konfigurationsanweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben
`SOUL.md` und verwandter Workspace-Persona-/Profilkontext sichtbar, ohne
`AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Laufzeit gilt für jede
eingebettete Runde dieses Agents oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeit erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diese Runde stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Belassen Sie den Standard-Agent auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-Refs `codex/*` nur für Kompatibilität. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agent bei normaler automatischer Auswahl und
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
- Wenn Codex für den `codex`-Agent fehlt oder nicht unterstützt wird, schlägt die Runde fehl,
  statt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                | Agent sollte verwenden ...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf erstellen“ | `/diagnostics [note]`                  |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                    |
| „Mein ChatGPT/Codex-Abonnement mit der Codex-Laufzeit verwenden“ | `openai/*` plus `agentRuntime.id: "codex"` |
| „Mein ChatGPT/Codex-Abonnement über PI verwenden“      | `openai-codex/*`-Modell-Refs                    |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitungen für Agents nur dann, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Laufzeit-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills dem Agent kein ACP-
Routing vermitteln.

## Nur-Codex-Bereitstellungen

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agent-Runde
Codex verwendet. Explizite Plugin-Laufzeiten verwenden standardmäßig keinen PI-Fallback, daher ist
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur, wenn Sie PI absichtlich fehlende
Harness-Auswahl behandeln lassen möchten.

## Codex pro Agent

Sie können einen Agent ausschließlich für Codex konfigurieren, während der Standard-Agent die normale
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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Runde den Harness erneut aus der aktuellen Konfiguration auflösen.

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

Standardmäßig startet das Plugin OpenClaws verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden, statt an die separat installierte
Codex CLI, die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn
Sie absichtlich eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauensvolle lokale Operator-Haltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerktools verwenden, ohne
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

Der Guardian-Modus verwendet Codex' nativen Auto-Review-Genehmigungspfad. Wenn Codex anfordert,
die Sandbox zu verlassen, außerhalb des Workspaces zu schreiben oder Berechtigungen wie Netzwerk-
Zugriff hinzuzufügen, leitet Codex diese Genehmigungsanforderung an den nativen Prüfer weiter statt an eine
menschliche Aufforderung. Der Prüfer wendet Codex' Risikorahmen an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus wünschen,
aber unbeaufsichtigte Agents trotzdem Fortschritt erzielen sollen.

Die Voreinstellung `guardian` erweitert sich zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`.
Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass erweiterte Bereitstellungen die
Voreinstellung mit expliziten Auswahlmöglichkeiten mischen können. Der ältere Prüferwert `guardian_subagent` wird
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
aber OpenClaw verwaltet die Codex-App-Server-Konto-Bridge und setzt sowohl
`CODEX_HOME` als auch `HOME` auf Agent-spezifische Verzeichnisse unter dem OpenClaw-
Status dieses Agents. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, sodass beide Werte für lokale App-Server-
Starts isoliert sind. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Status auf den OpenClaw-Agent beschränkt, statt aus dem persönlichen Codex-CLI-Home des Operators
einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin durch OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun das nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agents werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-
Workspace. Codex-native Plugins, Hooks und Konfigurationsdateien werden gemeldet oder archiviert,
damit sie manuell geprüft werden können, statt automatisch aktiviert zu werden, da sie
Befehle ausführen, MCP-Server verfügbar machen oder Anmeldedaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Runden versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokale stdio-Env-Key-Fallbacks verwenden den App-Server-
Login statt geerbter Umgebungsvariablen des untergeordneten Prozesses. WebSocket-App-Server-Verbindungen
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

Codex Dynamic Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus stellt
OpenClaw keine Dynamic Tools bereit, die native Codex-Arbeitsbereichsvorgänge
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                          |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um Codex App-Server den vollständigen OpenClaw-Dynamic-Tool-Satz bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche OpenClaw-Dynamic-Tool-Namen, die in Codex-App-Server-Turns ausgelassen werden sollen. |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` erzeugt Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                               |
| `command`           | verwaltetes Codex-Binärprogramm          | Ausführbare Datei für den stdio-Transport. Lassen Sie dies nicht gesetzt, um das verwaltete Binärprogramm zu verwenden; setzen Sie es nur für eine ausdrückliche Überschreibung.                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                             |
| `url`               | nicht gesetzt                            | WebSocket-URL des App-Servers.                                                                                                                                                                                                                 |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                                  |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für die Codex-Isolation pro Agent von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder durch Guardian geprüfte Ausführung.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird.                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungs-Prompts prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                     |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                            |

OpenClaw-eigene Dynamic-Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anfrage muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht
OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene
Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt werden kann,
anstatt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine Codex-App-Server-Anfrage mit Turn-Geltungsbereich
geantwortet hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` abschließt. Wenn der App-Server nach dieser Antwort 60 Sekunden
lang still bleibt, unterbricht OpenClaw nach bestem Ermessen den Codex-Turn,
zeichnet einen diagnostischen Timeout auf und gibt die OpenClaw-Sitzungsspur frei,
damit nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn
eingereiht werden.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binärprogramm, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Die Konfiguration
wird für reproduzierbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten
in derselben geprüften Datei hält wie die restliche Einrichtung des Codex-Harness.

## Computer Use

Computer Use wird in einem eigenen Einrichtungsleitfaden behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw bündelt die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet Codex App-Server vor, prüft, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen
MCP-Tool-Aufrufe während Turns im Codex-Modus verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs registrieren Sie
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

Computer Use ist macOS-spezifisch und kann lokale OS-Berechtigungen erfordern,
bevor der Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist
und der MCP-Server nicht verfügbar ist, schlagen Turns im Codex-Modus fehl, bevor
der Thread startet, anstatt stillschweigend ohne die nativen Computer-Use-Tools zu
laufen. Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Katalogbeschränkungen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig gebündelten
Codex Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, falls Codex
noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new` oder `/reset`, nachdem
Sie die Runtime- oder Computer-Use-Konfiguration geändert haben, damit bestehende Sitzungen
keine alte PI- oder Codex-Thread-Bindung behalten.

## Häufige Rezepte

Lokaler Codex mit Standard-stdio-Transport:

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
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe
erneut an den App-Server. Der Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu verdichten.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Diagnosefeedback für den angehängten Thread nach.
- `/codex computer-use status` prüft das konfigurierte Computer Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Rate-Limit-Status an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

### Häufiger Debugging-Ablauf

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack,
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, weil die Sitzung das Codex-Harness verwendet, außerdem
   das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl `Inspect locally`
   in einem Terminal aus. Er sieht wie `codex resume <thread-id>` aus und öffnet den
   nativen Codex-Thread, sodass Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum es ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnose-Bundle möchten. Für die meisten Support-Berichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Zustand und Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der OpenClaw-Kern stellt außerdem das nur für Besitzer verfügbare `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt die Einleitung zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche Ausführungsgenehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Alles-erlauben-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und einer Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung das Codex-Harness verwendet, autorisiert
dieselbe Genehmigung auch das Senden der relevanten Codex-Feedback-Bundles an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird,
listet aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Besitzer in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis, während die
Diagnoseeinleitung, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über
die private Genehmigungsroute an den Besitzer gesendet werden. Wenn es keine private Besitzerroute gibt,
lehnt OpenClaw die Gruppenanfrage ab und bittet den Besitzer, sie aus einer Direktnachricht auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex-App-Servers auf und fordert
den App-Server auf, Logs für jeden aufgeführten Thread und erzeugte Codex-Subthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Codex-Feedbackpfad zu OpenAI-
Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und hält den erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie einen Fehler in einer Kanalunterhaltung bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum es eine
bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist normalerweise, zuerst
`/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex-App-Server-Threads erhalten und dann denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Besitzer                 | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-App-Server-Erweiterungs-Middleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools.   |
| Native Codex-Hooks                    | Codex                    | Niedrigstufiger Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine Projekt- oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-Steuerelemente; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex die
Ausführung angefordert hat, daher löst OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im
Harness-Adapter aus. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, sofern Codex diese Operation nicht über App-Server- oder native Hook-
Callbacks bereitstellt.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-App-Server-
Benachrichtigungen und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws `before_compaction`-, `after_compaction`-, `llm_input`- und
`llm_output`-Ereignisse sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfragen oder Compaction-Payloads von Codex.

Native Codex-`hook/started`- und `hook/completed`-App-Server-Benachrichtigungen werden
als `codex_app_server.hook`-Agentenereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                          | Warum                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                            | Der Codex-App-Server besitzt den OpenAI-Durchlauf, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                    |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                            | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                 |
| Dynamische OpenClaw-Tools                     | Unterstützt                            | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                      |
| Prompt- und Kontext-Plugins                   | Unterstützt                            | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Durchlauf, bevor der Thread gestartet oder fortgesetzt wird.                                                                   |
| Kontext-Engine-Lebenszyklus                   | Unterstützt                            | Zusammenstellung, Aufnahme oder Wartung nach dem Durchlauf sowie Koordination der Kontext-Engine-Compaction laufen für Codex-Durchläufe.                                                             |
| Dynamische Tool-Hooks                         | Unterstützt                            | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um OpenClaw-eigene dynamische Tools.                                                                                 |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                             |
| Abschlussantwort-Überarbeitungsgate           | Über das native Hook-Relay unterstützt | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                    |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Argumentumschreibung nicht. |
| Native Berechtigungsrichtlinie                | Über das native Hook-Relay unterstützt | Codex `PermissionRequest` kann durch OpenClaw-Richtlinien geroutet werden, sofern die Laufzeit dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, läuft Codex über seinen normalen Guardian- oder Benutzergenehmigungspfad weiter. |
| App-Server-Trajektorienerfassung              | Unterstützt                            | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                 |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                          | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation von nativen Tool-Argumenten                | Codex-native Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                     | Erfordert Codex-Hook-/Schemaunterstützung für Ersatz-Tool-Eingaben.                       |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht unterstützte Interna nicht mutieren. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.     |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                      | Transformierte Datensätze könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Einträge, kein Token-Delta und keine Zusammenfassungsnutzlast. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                      |
| Compaction-Intervention                             | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                               | Codex-Pre-/Post-Compaction-Hooks hinzufügen, wenn Plugins native Compaction per Veto verhindern oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.               | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den niedrigstufigen eingebetteten Agent-Executor.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben
laufen weiterhin über den normalen OpenClaw-Auslieferungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Nutzlasten. Nehmen Sie nicht an, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Zulassen- oder Ablehnen-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Zulassung. Codex behandelt es so, als
läge keine Hook-Entscheidung vor, und fällt auf seinen eigenen Guardian- oder Benutzerfreigabepfad zurück.

Codex-MCP-Tool-Genehmigungsanfragen werden durch den OpenClaw-Plugin-
Genehmigungsfluss geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste in die Warteschlange gestellte Folgenachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Anfrageanforderungen
schlagen weiterhin geschlossen fehl.

Steuerung der Warteschlange aktiver Läufe wird auf Codex-App-Server-`turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw Chatnachrichten in der Warteschlange
für das konfigurierte Ruhefenster und sendet sie in
Eingangsreihenfolge als eine `turn/steer`-Anfrage. Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steuerungswarteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Die
Spiegelung umfasst den Benutzerprompt, finalen Assistententext und leichtgewichtige Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
Codex-native Tool-Ergebnisdatensätze nicht um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medienverständnis
verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Ref), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt jetzt fehl, statt auf PI zurückzufallen, es sei denn, Sie
setzen explizit `agentRuntime.fallback: "pi"`. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt ohne zusätzliche Fallback-Konfiguration sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine Legacy-
`codex/*`-Ref ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Refs bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agent ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn dies bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
ein Timeout erreicht, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
