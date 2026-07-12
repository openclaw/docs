---
read_when:
    - Sie wählen zwischen OpenClaw, Codex, ACP oder einer anderen nativen Agentenlaufzeit.
    - Sie sind durch Provider-/Modell-/Runtime-Bezeichnungen in Statusmeldungen oder der Konfiguration verwirrt
    - Sie dokumentieren die Gleichwertigkeit der Unterstützung für ein natives Harness.
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agent-Runtimes voneinander trennt
title: Agenten-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-07-12T15:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Runtime** besitzt genau eine vorbereitete Modellschleife: Sie empfängt den Prompt,
steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt den abgeschlossenen Turn
an OpenClaw zurück.

Runtimes werden leicht mit Providern verwechselt, da beide in der Nähe der
Modellkonfiguration vorkommen. Sie bilden jedoch unterschiedliche Ebenen:

| Ebene         | Beispiele                                    | Bedeutung                                                                 |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Provider      | `anthropic`, `github-copilot`, `openai`      | Wie OpenClaw sich authentifiziert, Modelle erkennt und Modellreferenzen benennt. |
| Modell        | `claude-opus-4-6`, `gpt-5.6-sol`             | Das für den Agent-Turn ausgewählte Modell.                                |
| Agent-Runtime | `claude-cli`, `codex`, `copilot`, `openclaw` | Die Low-Level-Schleife oder das Backend, die bzw. das den vorbereiteten Turn ausführt. |
| Kanal         | Discord, Slack, Telegram, WhatsApp           | Wo Nachrichten in OpenClaw eingehen und es verlassen.                     |

Ein **Harness** ist die Implementierung, die eine Agent-Runtime bereitstellt
(Codebegriff). Beispielsweise implementiert das gebündelte Codex-Harness die
`codex`-Runtime. Die öffentliche Konfiguration verwendet `agentRuntime.id` in
Provider- oder Modelleinträgen; Runtime-Schlüssel für den gesamten Agent sind
veraltet und werden ignoriert. `openclaw doctor --fix` entfernt alte
Runtime-Festlegungen für den gesamten Agent und schreibt veraltete
Runtime-Modellreferenzen in kanonische Provider-/Modellreferenzen sowie, falls
erforderlich, in eine modellspezifische Runtime-Richtlinie um.

Zwei Runtime-Familien:

- **Eingebettete Harnesses** werden innerhalb der vorbereiteten Agent-Schleife
  von OpenClaw ausgeführt: die integrierte `openclaw`-Runtime sowie registrierte
  Plugin-Harnesses wie `codex` und `copilot`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die
  Modellreferenz kanonisch bleibt. Beispielsweise bedeutet
  `anthropic/claude-opus-4-8` mit einer modellspezifischen
  `agentRuntime.id: "claude-cli"`: „Wählen Sie das Anthropic-Modell aus und
  führen Sie es über Claude CLI aus.“ `claude-cli` ist keine ID eines
  eingebetteten Harnesses und darf nicht an die AgentHarness-Auswahl
  übergeben werden.

Das `copilot`-Harness ist ein separates, optionales externes Plugin-Harness
für die GitHub Copilot CLI; die benutzerbezogene Entscheidung zwischen der
PI-, Codex- und GitHub-Copilot-Agent-Runtime finden Sie unter
[GitHub-Copilot-Agent-Runtime](/de/plugins/copilot).

## Codex-Oberflächen

Mehrere Oberflächen verwenden den Namen Codex:

| Oberfläche                                       | OpenClaw-Name/-Konfiguration          | Funktion                                                                                                           |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Native Codex-App-Server-Runtime                  | `openai/*`-Modellreferenzen           | Führt eingebettete OpenAI-Agent-Turns über den Codex-App-Server aus. Dies ist die übliche Einrichtung mit einem ChatGPT-/Codex-Abonnement. |
| Codex-OAuth-Authentifizierungsprofile            | `openai`-OAuth-Profile                | Speichert die Authentifizierung für das ChatGPT-/Codex-Abonnement, die das Codex-App-Server-Harness verwendet.      |
| Codex-ACP-Adapter                                | `runtime: "acp"`, `agentId: "codex"` | Führt Codex über die externe ACP-/acpx-Steuerungsebene aus. Verwenden Sie dies nur, wenn ACP/acpx ausdrücklich angefordert wird. |
| Nativer Codex-Befehlssatz zur Chat-Steuerung     | `/codex ...`                          | Bindet Codex-App-Server-Threads, setzt sie fort, steuert und beendet sie und zeigt Informationen zu ihnen an.       |
| OpenAI-Platform-API-Route für Nicht-Agent-Oberflächen | `openai/*` sowie API-Schlüssel-Authentifizierung | Direkte OpenAI-APIs wie Bilder, Embeddings, Sprache und Echtzeit.                                                   |

Diese Oberflächen sind absichtlich voneinander unabhängig. Durch Aktivieren
des `codex`-Plugins werden native App-Server-Funktionen verfügbar;
`openclaw doctor --fix` übernimmt die Reparatur veralteter Codex-Routen und
die Bereinigung überholter Sitzungsfestlegungen. Die Auswahl von `openai/*`
für ein Agent-Modell bedeutet nun „über Codex ausführen“, sofern keine
Nicht-Agent-Oberfläche der OpenAI API verwendet wird.

Die übliche Einrichtung mit einem ChatGPT-/Codex-Abonnement verwendet Codex
OAuth für die Authentifizierung, behält jedoch `openai/*` als Modellreferenz
bei und wählt die `codex`-Runtime aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Das bedeutet, dass OpenClaw eine OpenAI-Modellreferenz auswählt und anschließend
die Codex-App-Server-Runtime auffordert, den eingebetteten Agent-Turn
auszuführen. Es bedeutet weder „API-Abrechnung verwenden“, noch bedeutet es,
dass der Kanal, der Modell-Provider-Katalog oder der Sitzungsspeicher von
OpenClaw zu Codex wird.

Wenn das gebündelte `codex`-Plugin aktiviert ist, verwenden Sie für die
natürlichsprachliche Codex-Steuerung die native `/codex`-Befehlsoberfläche
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) anstelle von ACP. Verwenden Sie ACP für Codex nur, wenn der
Benutzer ausdrücklich ACP/acpx anfordert oder den ACP-Adapterpfad testet.
Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe Harnesses
verwenden weiterhin ACP.

Entscheidungsbaum:

1. **Codex-Bindung/-Steuerung/-Thread/-Fortsetzung/-Lenkung/-Beendigung** -> native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. **Codex als eingebettete Runtime** oder die normale abonnementsbasierte Codex-Agent-Erfahrung -> `openai/<model>`.
3. **OpenClaw wurde ausdrücklich für ein OpenAI-Modell ausgewählt** -> Behalten Sie `openai/<model>` als Modellreferenz bei und setzen Sie die Provider-/Modell-Runtime-Richtlinie auf `agentRuntime.id: "openclaw"`. Ein ausgewähltes `openai`-OAuth-Profil wird intern über den Codex-Authentifizierungstransport von OpenClaw geleitet.
4. **Veraltete Codex-Modellreferenzen in der Konfiguration** -> Reparieren Sie sie mit `openclaw doctor --fix` zu `openai/<model>`; Doctor behält die Codex-Authentifizierungsroute bei, indem bei Bedarf eine Provider-/modellspezifische `agentRuntime.id: "codex"` hinzugefügt wird, wenn die alte Modellreferenz dies implizierte. Veraltete **`codex-cli/*`**-Modellreferenzen werden auf dieselbe Codex-App-Server-Route `openai/<model>` repariert; OpenClaw behält kein gebündeltes Codex-CLI-Backend mehr bei.
5. **ACP, acpx oder der Codex-ACP-Adapter wird ausdrücklich angefordert** -> `runtime: "acp"` und `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder ein anderes externes Harness** -> ACP/acpx, nicht die native Sub-Agent-Runtime.

| Gemeint ist ...                          | Verwenden Sie ...                                  |
| ---------------------------------------- | -------------------------------------------------- |
| Chat-/Thread-Steuerung des Codex-App-Servers | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Agent-Runtime des Codex-App-Servers | `openai/*`-Agent-Modellreferenzen             |
| OpenAI Codex OAuth                       | `openai`-OAuth-Profile                             |
| Claude Code oder ein anderes externes Harness | ACP/acpx                                      |

Informationen zur Aufteilung der Präfixe der OpenAI-Familie finden Sie unter
[OpenAI](/de/providers/openai) und [Modell-Provider](/de/concepts/model-providers).
Den Supportvertrag für die Codex-Runtime finden Sie unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract).

## Runtime-Zuständigkeit

Verschiedene Runtimes sind für unterschiedlich große Teile der Schleife
zuständig:

| Oberfläche                  | Eingebettet in OpenClaw                         | Codex-App-Server                                                            |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Eigentümer der Modellschleife | OpenClaw, über den eingebetteten OpenClaw-Runner | Codex-App-Server                                                           |
| Kanonischer Thread-Status   | OpenClaw-Transkript                             | Codex-Thread sowie eine Spiegelung des OpenClaw-Transkripts                  |
| Dynamische OpenClaw-Tools   | Native OpenClaw-Tool-Schleife                   | Über den Codex-Adapter verbunden                                            |
| Native Shell- und Datei-Tools | OpenClaw-Pfad                                 | Codex-native Tools, sofern unterstützt über native Hooks verbunden          |
| Kontext-Engine              | Native OpenClaw-Kontextzusammenstellung         | OpenClaw projiziert den zusammengestellten Kontext in den Codex-Turn         |
| Compaction                  | OpenClaw oder ausgewählte Kontext-Engine        | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelpflege    |
| Kanalzustellung             | OpenClaw                                        | OpenClaw                                                                    |

Entwurfsregel: Wenn OpenClaw für die Oberfläche zuständig ist, kann es das
normale Verhalten von Plugin-Hooks bereitstellen. Wenn die native Runtime für
die Oberfläche zuständig ist, benötigt OpenClaw Runtime-Ereignisse oder native
Hooks. Wenn die native Runtime für den kanonischen Thread-Status zuständig ist,
spiegelt und projiziert OpenClaw den Kontext, anstatt nicht unterstützte
Interna umzuschreiben.

## Runtime-Auswahl

OpenClaw löst eine eingebettete Runtime nach der Provider- und Modellauflösung
in dieser Reihenfolge auf:

1. Die **modellspezifische Runtime-Richtlinie** hat Vorrang. Sie befindet sich
   in einem konfigurierten Provider-Modelleintrag oder in
   `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Ein
   Provider-Platzhalter wie
   `agents.defaults.models["vllm/*"].agentRuntime` wird nach der exakten
   Modellrichtlinie angewendet, sodass dynamisch erkannte Provider-Modelle eine
   Runtime gemeinsam nutzen können, ohne exakte modellspezifische Ausnahmen zu
   überschreiben.
2. **Providerspezifische Runtime-Richtlinie**: `models.providers.<provider>.agentRuntime`.
3. **`auto`-Modus**: Registrierte Plugin-Runtimes können unterstützte
   Provider-/Modellpaare beanspruchen.
4. Wenn im `auto`-Modus keine Runtime den Turn beansprucht, greift OpenClaw auf
   `openclaw` als Kompatibilitäts-Runtime zurück. Verwenden Sie eine explizite
   Runtime-ID, wenn die Ausführung strikt sein muss.

Runtime-Festlegungen für die gesamte Sitzung und den gesamten Agent werden
ignoriert: `OPENCLAW_AGENT_RUNTIME`, der Sitzungsstatus
`agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` und
`agents.list[].agentRuntime`. Führen Sie `openclaw doctor --fix` aus, um
veraltete Runtime-Konfigurationen für den gesamten Agent zu entfernen und
veraltete Runtime-Modellreferenzen umzuwandeln, sofern die Absicht erhalten
werden kann.

Explizite Provider-/Modell-Plugin-Runtimes schlagen geschlossen fehl:
`agentRuntime.id: "codex"` bei einem Provider oder Modell bedeutet Codex oder
einen eindeutigen Auswahl-/Runtime-Fehler – die Ausführung wird niemals
stillschweigend zu OpenClaw zurückgeleitet. Nur `auto` darf einen nicht
zugeordneten Turn an OpenClaw weiterleiten.

Aliasse für CLI-Backends unterscheiden sich von IDs eingebetteter Harnesses.
Bevorzugte Form für Claude CLI:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Veraltete Referenzen wie `claude-cli/claude-opus-4-7` werden aus
Kompatibilitätsgründen weiterhin unterstützt, neue Konfigurationen sollten
jedoch die Provider-/Modellreferenz kanonisch halten und das
Ausführungs-Backend in der Provider-/Modell-Runtime-Richtlinie angeben.

Veraltete `codex-cli/*`-Referenzen sind anders: Doctor migriert sie zu
`openai/*`, damit sie über das Codex-App-Server-Harness ausgeführt werden,
anstatt ein Codex-CLI-Backend beizubehalten.

Der `auto`-Modus ist für die meisten Provider absichtlich konservativ.
OpenAI-Agent-Modelle bilden die Ausnahme: Sowohl eine nicht gesetzte Runtime
als auch `auto` werden zum Codex-Harness aufgelöst. Eine explizite
OpenClaw-Runtime-Konfiguration bleibt eine optionale Kompatibilitätsroute für
`openai/*`-Agent-Turns; in Verbindung mit einem ausgewählten
`openai`-OAuth-Profil leitet OpenClaw diesen Pfad intern über den
Codex-Authentifizierungstransport, während die öffentliche Modellreferenz
`openai/*` bleibt. Veraltete OpenAI-Runtime-Sitzungsfestlegungen werden von der
Runtime-Auswahl ignoriert und können mit `openclaw doctor --fix` bereinigt
werden.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während
veraltete Codex-Modellreferenzen in der Konfiguration verbleiben, behandeln
Sie dies als veralteten Routenzustand und führen Sie `openclaw doctor --fix`
aus, um ihn mit der Codex-Runtime zu `openai/*` umzuschreiben.

## GitHub-Copilot-Agent-Runtime

Das externe Plugin `@openclaw/copilot` registriert eine optionale `copilot`-Runtime,
die auf der GitHub Copilot CLI (`@github/copilot-sdk`) basiert. Es beansprucht den
kanonischen Abonnement-Provider `github-copilot` und wird von `auto` **niemals**
ausgewählt. Aktivieren Sie sie pro Modell oder pro Provider über `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Das Harness beansprucht seinen Provider, seine Runtime, seinen CLI-Sitzungsschlüssel und das Präfix
seines Authentifizierungsprofils in `extensions/copilot/doctor-contract-api.ts`, das `openclaw doctor`
automatisch lädt. Informationen zu Konfiguration, Authentifizierung, Spiegelung von Transkripten, Compaction, dem
deklarativen Doctor-Vertrag und der umfassenderen Entscheidung zwischen PI, Codex und Copilot SDK
finden Sie unter [GitHub-Copilot-Agent-Runtime](/de/plugins/copilot).

## Kompatibilitätsvertrag

Wenn eine Runtime nicht OpenClaw ist, sollte ihre Dokumentation angeben, welche OpenClaw-Oberflächen
sie unterstützt:

| Frage                                  | Warum dies wichtig ist                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Wer steuert die Modellschleife?        | Bestimmt, wo Wiederholungsversuche, die Fortsetzung von Tools und Entscheidungen über die endgültige Antwort erfolgen. |
| Wer verwaltet den kanonischen Threadverlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder nur spiegeln kann.                                 |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools sind darauf angewiesen.                          |
| Funktionieren dynamische Tool-Hooks?   | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools.      |
| Funktionieren native Tool-Hooks?       | Shell-, Patch- und Runtime-eigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Wird der Lebenszyklus der Kontext-Engine ausgeführt? | Speicher- und Kontext-Plugins sind vom Lebenszyklus für Zusammenstellung, Aufnahme, Nachbearbeitung und Compaction abhängig. |
| Welche Compaction-Daten werden bereitgestellt? | Einige Plugins benötigen nur Benachrichtigungen, andere Metadaten zu beibehaltenen und verworfenen Inhalten. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten nicht von Gleichwertigkeit mit OpenClaw ausgehen, wenn die native Runtime mehr Zustand verwaltet. |

Der Unterstützungsvertrag der Codex-Runtime ist unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

## Statusbezeichnungen

Die Statusausgabe kann sowohl die Bezeichnungen `Execution` als auch `Runtime` anzeigen. Verstehen Sie sie als
Diagnoseinformationen, nicht als Providernamen:

- Eine Modellreferenz wie `openai/gpt-5.6-sol` ist der ausgewählte Provider und das ausgewählte Modell.
- Eine Runtime-ID wie `codex` bezeichnet die Schleife, die den Durchlauf ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord gibt an, wo die Unterhaltung stattfindet.

Wenn ein Lauf eine unerwartete Runtime anzeigt, prüfen Sie zuerst die Runtime-Richtlinie des ausgewählten
Providers und Modells. Veraltete Runtime-Festlegungen für Sitzungen bestimmen das Routing nicht mehr.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [GitHub-Copilot-Agent-Runtime](/de/plugins/copilot)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agentenschleife](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
