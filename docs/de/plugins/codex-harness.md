---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Konfigurationsbeispiele für den Codex-Harness
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agent-Turns über den mitgelieferten Codex-App-Server-Harness aus
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-04-30T07:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin lässt OpenClaw eingebettete Agent-Turns über den
Codex-App-Server statt über den integrierten PI-Harness ausführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, natives Fortsetzen von Threads, native Compaction und
App-Server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien,
Modellauswahl, Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkriptspiegelung.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere getrennte Funktionen bereit:

| Funktion                          | Verwendung                                          | Wirkung                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                          | Führt eingebettete OpenClaw-Agent-Turns über den Codex-App-Server aus.        |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Konversation. |
| Codex-App-Server-Provider/Katalog | `codex`-Interna, über den Harness bereitgestellt    | Ermöglicht der Runtime, App-Server-Modelle zu erkennen und zu validieren.      |
| Codex-Pfad für Medienverständnis  | `codex/*`-Bildmodell-Kompatibilitätspfade           | Führt begrenzte Codex-App-Server-Turns für unterstützte Bildverständnismodelle aus. |
| Natives Hook-Relay                | Plugin-Hooks rund um Codex-native Ereignisse        | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten oder zu blockieren. |

Das Aktivieren des Plugins stellt diese Funktionen bereit. Es bewirkt **nicht**, dass:

- Codex für jedes OpenAI-Modell verwendet wird
- `openai-codex/*`-Modellreferenzen in die native Runtime umgewandelt werden
- ACP/acpx zum standardmäßigen Codex-Pfad wird
- bestehende Sitzungen, die bereits eine PI-Runtime aufgezeichnet haben, im laufenden Betrieb umgeschaltet werden
- OpenClaw-Kanalzustellung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichtenrouting ersetzt werden

Dasselbe Plugin verwaltet auch die native `/codex`-Chat-Steuerbefehlsoberfläche. Wenn
das Plugin aktiviert ist und der Benutzer aus dem Chat heraus Codex-Threads binden,
fortsetzen, steuern, stoppen oder inspizieren möchte, sollten Agents `/codex ...`
gegenüber ACP bevorzugen. ACP bleibt der explizite Fallback, wenn der Benutzer nach
ACP/acpx fragt oder den ACP-Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über das Codex-`Stop`-Relay
- `agent_end`

Plugins können außerdem runtime-neutrale Tool-Ergebnis-Middleware registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool
ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
`tool_result_persist`-Plugin-Hook, der von OpenClaw verwaltete Transkript-
Tool-Ergebnis-Schreibvorgänge transformiert.

Die Semantik der Plugin-Hooks selbst finden Sie unter [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` beibehalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung wünschen. Ältere `codex/*`-Modellreferenzen wählen den
Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber runtime-gestützte ältere Provider-Präfixe werden nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das `codex`-Plugin aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, statt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Codex-OAuth-/Abonnementpfad, und
native App-Server-Ausführung bleibt eine explizite Runtime-Auswahl.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                         | Modellreferenz            | Runtime-Konfiguration                  | Plugin-Anforderung         | Erwartete Statusbeschriftung   |
| --------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI-API über normalen OpenClaw-Runner      | `openai/gpt-*`             | ausgelassen oder `runtime: "pi"`       | OpenAI-Provider             | `Runtime: OpenClaw Pi Default` |
| Codex-OAuth/Abonnement über PI                | `openai-codex/gpt-*`       | ausgelassen oder `runtime: "pi"`       | OpenAI-Codex-OAuth-Provider | `Runtime: OpenClaw Pi Default` |
| Native eingebettete Codex-App-Server-Turns    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex`-Plugin              | `Runtime: OpenAI Codex`        |
| Gemischte Provider mit konservativem Automatikmodus | Provider-spezifische Referenzen | `agentRuntime.id: "auto"`              | Optionale Plugin-Runtimes   | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adaptersitzung            | ACP-Prompt/Modell-abhängig | `sessions_spawn` mit `runtime: "acp"`  | funktionsfähiges `acpx`-Backend | ACP-Aufgaben-/Sitzungsstatus   |

Die wichtige Trennung ist Provider gegenüber Runtime:

- `openai-codex/*` beantwortet: „Welche Provider-/Auth-Route soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet: „Welche Schleife soll diesen
  eingebetteten Turn ausführen?“
- `/codex ...` beantwortet: „Welche native Codex-Konversation soll dieser Chat binden
  oder steuern?“
- ACP beantwortet: „Welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix auswählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie `openai-codex/*`, wenn Sie
Codex-OAuth über PI möchten; verwenden Sie `openai/*`, wenn Sie direkten OpenAI-API-Zugriff
möchten oder wenn Sie den nativen Codex-App-Server-Harness erzwingen:

| Modellreferenz                                | Runtime-Pfad                                | Verwendung bei                                                            |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing   | Sie möchten aktuellen direkten Zugriff auf die OpenAI-Platform-API mit `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI-Codex-OAuth über OpenClaw/PI         | Sie möchten ChatGPT/Codex-Abonnement-Authentifizierung mit dem standardmäßigen PI-Runner. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                    | Sie möchten native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn. |

GPT-5.5 ist in OpenClaw derzeit nur per Abonnement/OAuth verfügbar. Verwenden Sie
`openai-codex/gpt-5.5` für PI-OAuth oder `openai/gpt-5.5` mit dem Codex-
App-Server-Harness. Direkter API-Schlüssel-Zugriff für `openai/gpt-5.5` wird unterstützt,
sobald OpenAI GPT-5.5 in der öffentlichen API aktiviert.

Ältere `codex/gpt-*`-Referenzen werden weiterhin als Kompatibilitätsaliase akzeptiert. Die
Doctor-Kompatibilitätsmigration schreibt ältere primäre Runtime-Referenzen in kanonische
Modellreferenzen um und zeichnet die Runtime-Richtlinie separat auf, während reine Fallback-
Legacy-Referenzen unverändert bleiben, weil die Runtime für den gesamten Agent-Container
konfiguriert wird. Neue PI-Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden;
neue native App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den OpenAI-Codex-OAuth-Provider-Pfad laufen soll.
Verwenden Sie `codex/gpt-*`, wenn Bildverständnis über einen begrenzten Codex-App-Server-Turn laufen soll.
Das Codex-App-Server-Modell muss Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle
schlagen fehl, bevor der Medien-Turn beginnt.

Verwenden Sie `/status`, um den effektiven Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im
`auto`-Modus das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn alle folgenden Punkte zutreffen:

- das gebündelte `codex`-Plugin ist aktiviert oder erlaubt
- das primäre Modell eines Agents ist `openai-codex/*`
- die effektive Runtime dieses Agents ist nicht `codex`

Diese Warnung existiert, weil Benutzer häufig erwarten, dass „Codex-Plugin aktiviert“
„native Codex-App-Server-Runtime“ bedeutet. OpenClaw macht diesen Sprung nicht. Die Warnung
bedeutet:

- **Es ist keine Änderung erforderlich**, wenn Sie ChatGPT/Codex-OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie native App-Server-
  Ausführung beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Runtime-Änderung weiterhin `/new` oder `/reset`,
  weil Sitzungslaufzeit-Pins dauerhaft sind.

Die Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Turn läuft,
zeichnet OpenClaw die ausgewählte Harness-ID in dieser Sitzung auf und verwendet sie für
spätere Turns in derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn künftige Sitzungen einen anderen Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten, bevor Sie eine bestehende
Konversation zwischen PI und Codex umschalten. Dadurch wird vermieden, dass ein Transkript über
zwei inkompatible native Sitzungssysteme erneut abgespielt wird.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Konversation nach einer
Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die effektive Modell-Runtime. Der standardmäßige PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig ein kompatibles
  Codex-App-Server-Binary, sodass lokale `codex`-Befehle in `PATH` den normalen
  Harness-Start nicht beeinflussen.
- Codex-Authentifizierung, die dem App-Server-Prozess oder der Codex-Auth-
  Bridge von OpenClaw zur Verfügung steht.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung üblicherweise aus dem Codex-CLI-Konto
oder einem OpenClaw-`openai-codex`-Auth-Profil. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Minimale Konfiguration

Verwenden Sie `openai/gpt-5.5`, aktivieren Sie das gebündelte Plugin und erzwingen Sie den `codex`-Harness:

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

Legacy-Konfigurationen, die `agents.defaults.model` oder ein Agent-Modell auf
`codex/<model>` setzen, aktivieren weiterhin automatisch das gebündelte `codex`-Plugin. Neue Konfigurationen sollten
`openai/<model>` plus den expliziten `agentRuntime`-Eintrag oben bevorzugen.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Runtime gilt für jeden
eingebetteten Turn dieses Agents oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen,
während diese Runtime erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diesen Turn stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Setzen Sie Codex auf einen dedizierten Agenten mit `agentRuntime.id: "codex"`.
- Belassen Sie den Standard-Agenten auf `agentRuntime.id: "auto"` und PI-Fallback für die normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-Referenzen `codex/*` nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Runtime-Richtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agenten auf normaler automatischer Auswahl und
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

- Der Standard-Agent `main` verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet das Codex-App-Server-Harness.
- Wenn Codex für den Agenten `codex` fehlt oder nicht unterstützt wird, schlägt der Turn fehl,
  statt stillschweigend PI zu verwenden.

## Agent-Befehlsrouting

Agenten sollten Benutzeranfragen nach Absicht weiterleiten, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach ...                                  | Agent sollte verwenden ...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                            | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                    | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                                 | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Codex als Runtime für diesen Agenten verwenden“          | Konfigurationsänderung an `agentRuntime.id`      |
| „Mein ChatGPT/Codex-Abonnement mit normalem OpenClaw verwenden“ | Modellreferenzen `openai-codex/*`                |
| „Codex über ACP/acpx ausführen“                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Unter-Agenten |

OpenClaw bewirbt ACP-Spawn-Anleitungen für Agenten nur, wenn ACP aktiviert,
dispatchbar und durch ein geladenes Runtime-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills den Agenten kein ACP-Routing
beibringen.

## Nur-Codex-Deployments

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
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

Umgebungs-Override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann. Setzen Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur, wenn Sie bewusst möchten, dass PI eine
fehlende Harness-Auswahl übernimmt.

## Codex pro Agent

Sie können einen Agenten ausschließlich für Codex konfigurieren, während der Standard-Agent die normale
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

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt seinen Sidecar-App-Server-Thread oder setzt ihn
bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt den nächsten Turn das Harness erneut aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn die
Erkennung fehlschlägt oder ein Timeout auftritt, verwendet es einen gebündelten Fallback-Katalog für:

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

Die verwaltete Binärdatei wird als gebündelte Plugin-Runtime-Abhängigkeit deklariert und zusammen
mit den restlichen Abhängigkeiten des Plugins `codex` bereitgestellt. Dadurch bleibt die App-Server-
Version an das gebündelte Plugin gebunden, statt an die separate Codex-CLI,
die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn Sie
bewusst eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerktools verwenden, ohne
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

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Arbeitsbereichs zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Prüfer statt an eine
menschliche Eingabeaufforderung weiter. Der Prüfer wendet das Risikomodell von Codex an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus möchten,
aber dennoch unbeaufsichtigte Agenten Fortschritte machen müssen.

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass fortgeschrittene Deployments das
Preset mit expliziten Entscheidungen kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird
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
aber OpenClaw besitzt die Konto-Brücke für den Codex-App-Server. Die Authentifizierung wird in dieser
Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers, etwa eine lokale ChatGPT-Anmeldung der Codex-CLI.
3. Nur für lokale Stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokale Stdio-Env-Key-Fallbacks verwenden die App-Server-
Anmeldung statt der geerbten Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des entfernten App-Servers.

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

`appServer.clearEnv` wirkt sich nur auf den erzeugten Codex-App-Server-Kindprozess aus.

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                 |
| `command`           | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                               |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                        |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                                                                                            |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                    |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                               |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder von Guardian geprüfte Ausführung.                                                                                  |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                         |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird.                                                                      |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                  |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                               |

Dynamische Tool-Aufrufe, die OpenClaw gehören, sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-Anfrage `item/tool/call` muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout
bricht OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine
fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt
werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine Codex-Turn-bezogene App-Server-Anfrage geantwortet
hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` beendet. Wenn der App-Server danach 60 Sekunden lang stumm
bleibt, unterbricht OpenClaw nach bestem Bemühen den Codex-Turn, zeichnet einen
diagnostischen Timeout auf und gibt die OpenClaw-Sitzungsspur frei, damit
nachfolgende Chat-Nachrichten nicht hinter einem veralteten nativen Turn
eingereiht werden.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Die
Konfiguration wird für wiederholbare Deployments bevorzugt, weil sie das
Plugin-Verhalten in derselben geprüften Datei wie den Rest der
Codex-Harness-Einrichtung hält.

## Computernutzung

Die Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Kurz gesagt: OpenClaw vendort die Desktop-Control-App nicht und führt selbst
keine Desktop-Aktionen aus. Es bereitet den Codex-App-Server vor, prüft, ob der
MCP-Server `computer-use` verfügbar ist, und lässt Codex dann die nativen
MCP-Tool-Aufrufe während Codex-Modus-Turns verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs
registrieren Sie `cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex-Computernutzung](/de/plugins/codex-computer-use) für den Unterschied
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
`computerUse.enabled` true ist und der MCP-Server nicht verfügbar ist, schlagen
Codex-Modus-Turns fehl, bevor der Thread startet, statt stillschweigend ohne die
nativen Computernutzungs-Tools zu laufen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Kataloggrenzen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex Desktop Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren,
falls Codex noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new`
oder `/reset`, nachdem Sie Laufzeit- oder Computernutzungskonfiguration geändert
haben, damit bestehende Sitzungen keine alte PI- oder Codex-Thread-Bindung
behalten.

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

Von Guardian geprüfte Codex-Genehmigungen:

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

Der Modellwechsel bleibt OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an einen
bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell
ausgewählte OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox
und die Service-Stufe erneut an den App-Server. Der Wechsel von
`openai/gpt-5.5` zu `openai/gpt-5.2` behält die Thread-Bindung bei, fordert
Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er
ist generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle
unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` bittet den Codex-App-Server, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den angehängten Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computernutzungs-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computernutzungs-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Rate-Limit-Status.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

### Häufiger Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack oder einem anderen
Kanal etwas Überraschendes tut, beginnen Sie mit der Unterhaltung, in der das
Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie beobachtet haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt das lokale Gateway-
   Diagnose-Zip und sendet, da die Sitzung das Codex-Harness verwendet, außerdem
   das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutzzusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine Zeile `Inspect locally` für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl `Inspect locally`
   in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, damit Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum er ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den
Codex-Feedback-Upload für den aktuell angehängten Thread ohne das vollständige
OpenClaw-Gateway-Diagnose-Bundle wünschen. Für die meisten Supportberichte ist
`/diagnostics [note]` der bessere Ausgangspunkt, weil es den lokalen Gateway-
Status und Codex-Thread-IDs in einer Antwort zusammenführt. Siehe
[Diagnoseexport](/de/gateway/diagnostics) für das vollständige Datenschutzmodell
und das Verhalten in Gruppenchats.

Der OpenClaw-Kern stellt außerdem den nur für Owner verfügbaren Befehl
`/diagnostics [note]` als allgemeinen Gateway-Diagnosebefehl bereit. Dessen
Genehmigungsaufforderung zeigt die Einleitung zu sensiblen Daten, verlinkt auf
[Diagnoseexport](/de/gateway/diagnostics) und fordert jedes Mal
`openclaw gateway diagnostics export --json` über explizite Exec-Genehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und der
Manifestzusammenfassung. Wenn die aktive OpenClaw-Sitzung das Codex-Harness
verwendet, autorisiert dieselbe Genehmigung auch das Senden der relevanten
Codex-Feedback-Bundles an OpenAI-Server. Die Genehmigungsaufforderung weist
darauf hin, dass Codex-Feedback gesendet wird, listet aber vor der Genehmigung
keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält
OpenClaw den gemeinsamen Kanal sauber: Die Gruppe erhält nur einen kurzen
Hinweis, während Diagnoseeinleitung, Genehmigungsaufforderungen und
Codex-Sitzungs-/Thread-IDs über die private Genehmigungsroute an den Owner
gesendet werden. Wenn keine private Owner-Route vorhanden ist, lehnt OpenClaw
die Gruppenanfrage ab und bittet den Owner, sie aus einer DM auszuführen.

Der genehmigte Codex-Upload ruft Codex app-server `feedback/upload` auf und weist
app-server an, Protokolle für jeden aufgeführten Thread und erzeugte Codex-Subthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Codex-Feedbackpfad zu OpenAI-
Servern; wenn Codex-Feedback in diesem app-server deaktiviert ist, gibt der Befehl
den app-server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung verweigern oder
ignorieren, gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an app-server und lässt den erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie einen Fehler in einer Kanalunterhaltung bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum es eine
bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist normalerweise,
zuerst `/diagnostics [note]` auszuführen: Nachdem Sie dies genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex app-server-Threads erhalten und anschließend denselben
`codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex app-server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster app-server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Verantwortlich           | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex app-server-Erweiterungsmiddleware | In OpenClaw gebündelte Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools. |
| Native Codex-Hooks                    | Codex                    | Niedrigstufiger Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektbezogenen oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-seitige Steuerelemente; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, daher löst OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im
Harness-Adapter aus. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, sofern Codex diesen Vorgang nicht über app-server oder native Hook-
Callbacks bereitstellt.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-App-Server-Benachrichtigungen und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen. Die OpenClaw-Ereignisse `before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen der internen Anfrage- oder Compaction-Payloads von Codex.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed` werden als `codex_app_server.hook`-Agent-Ereignisse für Trajektorie und Debugging projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Unterstützungsvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen an diese Grenze an.

Unterstützt in Codex Runtime v1:

| Bereich                                       | Unterstützung                                 | Warum                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex               | Unterstützt                               | Der Codex-App-Server besitzt den OpenAI-Turn, die native Thread-Wiederaufnahme und die native Tool-Fortsetzung.                                                                                                            |
| OpenClaw-Kanalrouting und Zustellung         | Unterstützt                               | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                      |
| Dynamische OpenClaw-Tools                        | Unterstützt                               | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                                  |
| Prompt- und Kontext-Plugins                    | Unterstützt                               | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                                      |
| Lebenszyklus der Kontext-Engine                      | Unterstützt                               | Zusammenstellung, Aufnahme oder Wartung nach dem Turn sowie Compaction-Koordination der Kontext-Engine laufen für Codex-Turns.                                                                                           |
| Dynamische Tool-Hooks                            | Unterstützt                               | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw besitzt.                                                                                            |
| Lebenszyklus-Hooks                               | Als Adapterbeobachtungen unterstützt       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                             |
| Revisions-Gate für finale Antworten                    | Über das native Hook-Relay unterstützt | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                                                  |
| Nativer Shell-, Patch- und MCP-Block oder Beobachtung | Über das native Hook-Relay unterstützt | Codex `PreToolUse` und `PostToolUse` werden für festgeschriebene native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                      | Über das native Hook-Relay unterstützt | Codex `PermissionRequest` kann über OpenClaw-Richtlinien geleitet werden, wenn die Runtime dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Wächter- oder Benutzerfreigabepfad fort.     |
| App-Server-Trajektorieerfassung                 | Unterstützt                               | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                                                      |

Nicht unterstützt in Codex Runtime v1:

| Bereich                                             | V1-Grenze                                                                                                                                     | Zukünftiger Pfad                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                       | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                               | Erfordert Codex-Hook-/Schemaunterstützung für ersetzende Tool-Eingaben.                            |
| Bearbeitbarer Codex-nativer Transkriptverlauf            | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.                    |
| `tool_result_persist` für Codex-native Tool-Einträge | Dieser Hook transformiert Transkriptschreibvorgänge, die OpenClaw besitzt, nicht Codex-native Tool-Einträge.                                                           | Könnte transformierte Einträge spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung.              |
| Umfangreiche native Compaction-Metadaten                     | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste von behaltenen/verworfenen Elementen, kein Token-Delta und keine Zusammenfassungspayload.            | Benötigt reichhaltigere Codex-Compaction-Ereignisse.                                                     |
| Compaction-Eingriff                             | Aktuelle OpenClaw-Compaction-Hooks befinden sich im Codex-Modus auf Benachrichtigungsebene.                                                                         | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen             | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber der Codex-Kern erstellt die finale OpenAI-API-Anfrage intern.                      | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                                   |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den eingebetteten Low-Level-Agent-Executor.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom Harness. Text, Bilder, Video, Musik, TTS, Freigaben und Messaging-Tool-Ausgaben laufen weiterhin über den normalen OpenClaw-Zustellungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der V1-Unterstützungsvertrag ist auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In der Codex-Runtime umfasst das Shell-, Patch- und MCP-`PreToolUse`-, `PostToolUse`- und `PermissionRequest`-Payloads. Nehmen Sie nicht an, dass jedes zukünftige Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Runtime-Vertrag sie benennt.

Für `PermissionRequest` gibt OpenClaw nur dann ausdrückliche Zulassen- oder Ablehnen-Entscheidungen zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist kein Zulassen. Codex behandelt es als keine Hook-Entscheidung und fällt auf seinen eigenen Wächter- oder Benutzerfreigabepfad zurück.

Codex-MCP-Tool-Freigabeanforderungen werden über den Plugin-Freigabefluss von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als `"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den ursprünglichen Chat gesendet, und die nächste eingereihte Folgenachricht beantwortet diese native Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Anforderungsanfragen schlagen weiterhin geschlossen fehl.

Die Steuerung der Active-run-Warteschlange wird auf Codex app-server `turn/steer` abgebildet. Mit dem
Standardwert `messages.queue.mode: "steer"` sammelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in Eingangsreihenfolge als eine
`turn/steer`-Anfrage. Der Legacy-Modus `queue` sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-turn-Steering ablehnen. In diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steering queue](/de/concepts/queue-steering).

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex app-server delegiert. OpenClaw behält eine Transkriptspiegelung für
Kanalverlauf, Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Die
Spiegelung enthält den User-Prompt, den finalen Assistententext und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der app-server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale der nativen Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medienverständnis
verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-Referenz `codex/*`), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow` `codex`
ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Run übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Runtime schlägt jetzt fehl, statt auf PI zurückzufallen, sofern Sie nicht
explizit `agentRuntime.fallback: "pi"` setzen. Sobald der Codex app-server ausgewählt ist,
werden seine Fehler ohne zusätzliche Fallback-Konfiguration direkt ausgegeben.

**Der app-server wird abgelehnt:** Aktualisieren Sie Codex, damit der app-server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte app-server dieselbe Codex app-server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine Legacy-Referenz
`codex/*` ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
Modus `auto` auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agent ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; falls das bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu entfernen. Wenn `computer-use.list_apps`
wegen Zeitüberschreitung fehlschlägt, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
