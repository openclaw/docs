---
read_when:
    - Sie wählen zwischen OpenClaw, Codex, ACP oder einer anderen nativen Agenten-Laufzeit.
    - Sie sind durch Provider-/Modell-/Laufzeitbezeichnungen im Status oder in der Konfiguration verwirrt
    - Sie dokumentieren die Gleichwertigkeit der Unterstützung für ein natives Harness.
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agenten-Laufzeitumgebungen voneinander trennt
title: Agent-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-07-12T01:31:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Laufzeitumgebung** besitzt genau eine vorbereitete Modellschleife: Sie empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Werkzeugaufrufe und gibt den abgeschlossenen Durchlauf an OpenClaw zurück.

Laufzeitumgebungen können leicht mit Providern verwechselt werden, da beide in der Nähe der Modellkonfiguration erscheinen. Es handelt sich jedoch um unterschiedliche Schichten:

| Schicht                  | Beispiele                                    | Bedeutung                                                                                      |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Provider                 | `anthropic`, `github-copilot`, `openai`      | Wie OpenClaw sich authentifiziert, Modelle erkennt und Modellreferenzen benennt.                |
| Modell                   | `claude-opus-4-6`, `gpt-5.6-sol`             | Das für den Agent-Durchlauf ausgewählte Modell.                                                 |
| Agent-Laufzeitumgebung   | `claude-cli`, `codex`, `copilot`, `openclaw` | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Durchlauf ausführt.               |
| Kanal                    | Discord, Slack, Telegram, WhatsApp           | Wo Nachrichten in OpenClaw eingehen und es verlassen.                                          |

Ein **Harness** ist die Implementierung, die eine Agent-Laufzeitumgebung bereitstellt (Codebegriff). Beispielsweise implementiert das mitgelieferte Codex-Harness die Laufzeitumgebung `codex`. Die öffentliche Konfiguration verwendet `agentRuntime.id` in Provider- oder Modelleinträgen; Laufzeitschlüssel für den gesamten Agent sind veraltet und werden ignoriert. `openclaw doctor --fix` entfernt alte Laufzeitbindungen für den gesamten Agent und schreibt veraltete Laufzeit-Modellreferenzen in kanonische Provider-/Modellreferenzen sowie, wo erforderlich, in eine modellspezifische Laufzeitrichtlinie um.

Zwei Laufzeitfamilien:

- **Eingebettete Harnesses** werden innerhalb der vorbereiteten Agent-Schleife von OpenClaw ausgeführt: die integrierte Laufzeitumgebung `openclaw` sowie registrierte Plugin-Harnesses wie `codex` und `copilot`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modellreferenz kanonisch bleibt. Beispielsweise bedeutet `anthropic/claude-opus-4-8` mit einem modellspezifischen `agentRuntime.id: "claude-cli"`: „Wählen Sie das Anthropic-Modell aus und führen Sie es über Claude CLI aus.“ `claude-cli` ist keine ID eines eingebetteten Harnesses und darf nicht an die AgentHarness-Auswahl übergeben werden.

Das `copilot`-Harness ist ein separates, optionales externes Plugin-Harness für die GitHub Copilot CLI; unter [GitHub-Copilot-Agent-Laufzeitumgebung](/de/plugins/copilot) finden Sie die benutzerorientierte Entscheidung zwischen PI, Codex und der GitHub-Copilot-Agent-Laufzeitumgebung.

## Codex-Oberflächen

Mehrere Oberflächen verwenden den Namen Codex:

| Oberfläche                                               | OpenClaw-Name/-Konfiguration          | Funktion                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Native Codex-App-Server-Laufzeitumgebung                 | `openai/*`-Modellreferenzen           | Führt eingebettete OpenAI-Agent-Durchläufe über den Codex-App-Server aus. Dies ist die übliche Einrichtung für ChatGPT-/Codex-Abonnements. |
| Codex-OAuth-Authentifizierungsprofile                    | `openai`-OAuth-Profile                | Speichert die Authentifizierung für ChatGPT-/Codex-Abonnements, die das Codex-App-Server-Harness verwendet.                       |
| Codex-ACP-Adapter                                        | `runtime: "acp"`, `agentId: "codex"`  | Führt Codex über die externe ACP-/acpx-Steuerungsebene aus. Verwenden Sie dies nur, wenn ACP/acpx ausdrücklich angefordert wird.   |
| Nativer Codex-Befehlssatz zur Chatsteuerung              | `/codex ...`                          | Bindet Codex-App-Server-Threads, setzt sie fort, steuert und beendet sie und zeigt ihren Status im Chat an.                       |
| OpenAI-Platform-API-Route für Nicht-Agent-Oberflächen    | `openai/*` plus API-Schlüsselauthentifizierung | Direkte OpenAI-APIs wie Bilder, Einbettungen, Sprache und Echtzeit.                                                        |

Diese Oberflächen sind absichtlich voneinander unabhängig. Durch Aktivieren des Plugins `codex` werden native App-Server-Funktionen verfügbar; `openclaw doctor --fix` ist für die Reparatur veralteter Codex-Routen und die Bereinigung veralteter Sitzungsbindungen zuständig. Die Auswahl von `openai/*` für ein Agent-Modell bedeutet nun „über Codex ausführen“, sofern keine Nicht-Agent-Oberfläche der OpenAI API verwendet wird.

Die übliche Einrichtung für ChatGPT-/Codex-Abonnements verwendet Codex OAuth zur Authentifizierung, behält jedoch `openai/*` als Modellreferenz bei und wählt die Laufzeitumgebung `codex` aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Das bedeutet, dass OpenClaw eine OpenAI-Modellreferenz auswählt und anschließend die Codex-App-Server-Laufzeitumgebung auffordert, den eingebetteten Agent-Durchlauf auszuführen. Es bedeutet weder „API-Abrechnung verwenden“, noch bedeutet es, dass der Kanal, der Modell-Provider-Katalog oder der Sitzungsspeicher von OpenClaw zu Codex wird.

Wenn das mitgelieferte Plugin `codex` aktiviert ist, verwenden Sie für die natürlichsprachliche Codex-Steuerung die native `/codex`-Befehlsoberfläche (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) anstelle von ACP. Verwenden Sie ACP für Codex nur, wenn der Benutzer ausdrücklich ACP/acpx anfordert oder den ACP-Adapterpfad testet. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe Harnesses verwenden weiterhin ACP.

Entscheidungsbaum:

1. **Codex-Bindung/-Steuerung/-Thread/-Fortsetzung/-Lenkung/-Beendigung** -> native `/codex`-Befehlsoberfläche, wenn das mitgelieferte Plugin `codex` aktiviert ist.
2. **Codex als eingebettete Laufzeitumgebung** oder die normale, abonnementgestützte Codex-Agent-Nutzung -> `openai/<model>`.
3. **OpenClaw wurde ausdrücklich für ein OpenAI-Modell ausgewählt** -> Behalten Sie `openai/<model>` als Modellreferenz bei und setzen Sie die Provider-/Modell-Laufzeitrichtlinie auf `agentRuntime.id: "openclaw"`. Ein ausgewähltes `openai`-OAuth-Profil wird intern über den Codex-Authentifizierungstransport von OpenClaw geleitet.
4. **Veraltete Codex-Modellreferenzen in der Konfiguration** -> Reparieren Sie sie mit `openclaw doctor --fix` zu `openai/<model>`; Doctor behält die Codex-Authentifizierungsroute bei, indem dort, wo die alte Modellreferenz dies implizierte, ein Provider-/modellspezifisches `agentRuntime.id: "codex"` hinzugefügt wird. Veraltete **`codex-cli/*`**-Modellreferenzen werden auf dieselbe Codex-App-Server-Route `openai/<model>` umgestellt; OpenClaw stellt kein mitgeliefertes Codex-CLI-Backend mehr bereit.
5. **ACP, acpx oder der Codex-ACP-Adapter wird ausdrücklich angefordert** -> `runtime: "acp"` und `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder ein anderes externes Harness** -> ACP/acpx, nicht die native Subagent-Laufzeitumgebung.

| Gemeint ist ...                              | Verwenden Sie ...                                      |
| -------------------------------------------- | ------------------------------------------------------ |
| Codex-App-Server-Chat-/Thread-Steuerung      | `/codex ...` aus dem mitgelieferten Plugin `codex`     |
| Eingebettete Codex-App-Server-Agent-Laufzeitumgebung | `openai/*`-Agent-Modellreferenzen                |
| OpenAI Codex OAuth                           | `openai`-OAuth-Profile                                 |
| Claude Code oder ein anderes externes Harness | ACP/acpx                                               |

Zur Aufteilung der Präfixe innerhalb der OpenAI-Familie siehe [OpenAI](/de/providers/openai) und [Modell-Provider](/de/concepts/model-providers). Den Unterstützungsvertrag für die Codex-Laufzeitumgebung finden Sie unter [Codex-Harness-Laufzeitumgebung](/de/plugins/codex-harness-runtime#v1-support-contract).

## Zuständigkeit der Laufzeitumgebung

Unterschiedliche Laufzeitumgebungen sind für unterschiedlich große Teile der Schleife zuständig:

| Oberfläche                     | Eingebettetes OpenClaw                              | Codex-App-Server                                                                    |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Eigentümer der Modellschleife  | OpenClaw, über den eingebetteten OpenClaw-Runner    | Codex-App-Server                                                                    |
| Kanonischer Thread-Zustand     | OpenClaw-Transkript                                 | Codex-Thread plus Spiegel des OpenClaw-Transkripts                                  |
| Dynamische OpenClaw-Werkzeuge  | Native OpenClaw-Werkzeugschleife                    | Über den Codex-Adapter angebunden                                                   |
| Native Shell- und Dateiverkzeuge | OpenClaw-Pfad                                     | Codex-native Werkzeuge, sofern unterstützt über native Hooks angebunden             |
| Kontext-Engine                 | Native OpenClaw-Kontextzusammenstellung             | OpenClaw projiziert den zusammengestellten Kontext in den Codex-Durchlauf            |
| Compaction                     | OpenClaw oder ausgewählte Kontext-Engine            | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelverwaltung       |
| Kanalauslieferung              | OpenClaw                                            | OpenClaw                                                                            |

Entwurfsregel: Wenn OpenClaw für die Oberfläche zuständig ist, kann es das normale Verhalten von Plugin-Hooks bereitstellen. Wenn die native Laufzeitumgebung für die Oberfläche zuständig ist, benötigt OpenClaw Laufzeitereignisse oder native Hooks. Wenn die native Laufzeitumgebung für den kanonischen Thread-Zustand zuständig ist, spiegelt OpenClaw den Kontext und projiziert ihn, anstatt nicht unterstützte Interna umzuschreiben.

## Auswahl der Laufzeitumgebung

OpenClaw bestimmt eine eingebettete Laufzeitumgebung nach der Provider- und Modellauflösung in dieser Reihenfolge:

1. Die **modellspezifische Laufzeitrichtlinie** hat Vorrang. Sie befindet sich in einem konfigurierten Modell-Eintrag des Providers oder in `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`. Ein Provider-Platzhalter wie `agents.defaults.models["vllm/*"].agentRuntime` wird nach der exakten Modellrichtlinie angewendet, sodass dynamisch erkannte Provider-Modelle eine Laufzeitumgebung gemeinsam verwenden können, ohne exakte modellspezifische Ausnahmen zu überschreiben.
2. **Providerspezifische Laufzeitrichtlinie**: `models.providers.<provider>.agentRuntime`.
3. **Modus `auto`**: Registrierte Plugin-Laufzeitumgebungen können unterstützte Provider-/Modellpaare für sich beanspruchen.
4. Wenn im Modus `auto` keine Laufzeitumgebung den Durchlauf übernimmt, greift OpenClaw aus Kompatibilitätsgründen auf `openclaw` zurück. Verwenden Sie eine ausdrückliche Laufzeit-ID, wenn die Ausführung strikt sein muss.

Laufzeitbindungen für die gesamte Sitzung und den gesamten Agent werden ignoriert: `OPENCLAW_AGENT_RUNTIME`, der Sitzungszustand `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`. Führen Sie `openclaw doctor --fix` aus, um veraltete Laufzeitkonfigurationen für den gesamten Agent zu entfernen und veraltete Laufzeit-Modellreferenzen umzuwandeln, sofern die Absicht erhalten werden kann.

Explizite Provider-/Modell-Plugin-Laufzeitumgebungen schlagen geschlossen fehl: `agentRuntime.id: "codex"` für einen Provider oder ein Modell bedeutet Codex oder einen eindeutigen Auswahl-/Laufzeitfehler – es wird niemals stillschweigend zu OpenClaw zurückgeleitet. Nur `auto` darf einen nicht zugeordneten Durchlauf an OpenClaw weiterleiten.

Aliasse für CLI-Backends unterscheiden sich von den IDs eingebetteter Harnesses. Bevorzugte Form für Claude CLI:

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

Veraltete Referenzen wie `claude-cli/claude-opus-4-7` werden aus Kompatibilitätsgründen weiterhin unterstützt, neue Konfigurationen sollten jedoch die Provider-/Modellreferenz kanonisch halten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie festlegen.

Veraltete `codex-cli/*`-Referenzen unterscheiden sich davon: Doctor migriert sie zu `openai/*`, sodass sie über das Codex-App-Server-Harness ausgeführt werden, statt ein Codex-CLI-Backend beizubehalten.

Der Modus `auto` ist für die meisten Provider bewusst konservativ. OpenAI-Agent-Modelle bilden die Ausnahme: Sowohl eine nicht gesetzte Laufzeitumgebung als auch `auto` werden zum Codex-Harness aufgelöst. Eine explizite OpenClaw-Laufzeitkonfiguration bleibt eine optionale Kompatibilitätsroute für `openai/*`-Agent-Durchläufe; in Verbindung mit einem ausgewählten `openai`-OAuth-Profil leitet OpenClaw diesen Pfad intern über den Codex-Authentifizierungstransport, während die öffentliche Modellreferenz `openai/*` bleibt. Veraltete OpenAI-Laufzeitbindungen in Sitzungen werden bei der Laufzeitauswahl ignoriert und können mit `openclaw doctor --fix` bereinigt werden.

Wenn `openclaw doctor` davor warnt, dass das Plugin `codex` aktiviert ist, während die Konfiguration noch veraltete Codex-Modellreferenzen enthält, behandeln Sie dies als veralteten Routenzustand und führen Sie `openclaw doctor --fix` aus, um ihn mit der Codex-Laufzeitumgebung zu `openai/*` umzuschreiben.

## GitHub-Copilot-Agent-Laufzeitumgebung

Das externe Plugin `@openclaw/copilot` registriert eine optionale `copilot`-Laufzeit,
die auf der GitHub Copilot CLI (`@github/copilot-sdk`) basiert. Es beansprucht den
kanonischen Abonnement-Provider `github-copilot` und wird von `auto` **niemals** ausgewählt.
Aktivieren Sie es pro Modell oder pro Provider über `agentRuntime.id`:

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

Das Harness beansprucht seinen Provider, seine Laufzeit, seinen CLI-Sitzungsschlüssel und das
Präfix seines Authentifizierungsprofils in `extensions/copilot/doctor-contract-api.ts`, das
`openclaw doctor` automatisch lädt. Informationen zu Konfiguration, Authentifizierung,
Transkriptspiegelung, Compaction, dem deklarativen Doctor-Vertrag und der umfassenderen
Entscheidung zwischen PI, Codex und Copilot SDK finden Sie unter
[GitHub-Copilot-Agentenlaufzeit](/de/plugins/copilot).

## Kompatibilitätsvertrag

Wenn eine Laufzeit nicht zu OpenClaw gehört, sollte ihre Dokumentation angeben, welche
OpenClaw-Oberflächen sie unterstützt:

| Frage                                      | Warum dies wichtig ist                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Wer steuert die Modellschleife?            | Bestimmt, wo Wiederholungsversuche, Werkzeugfortsetzungen und Entscheidungen über die endgültige Antwort erfolgen. |
| Wer verwaltet den kanonischen Threadverlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder nur spiegeln kann.                                           |
| Funktionieren dynamische OpenClaw-Werkzeuge? | Nachrichtenübermittlung, Sitzungen, Cron und OpenClaw-eigene Werkzeuge sind darauf angewiesen.                 |
| Funktionieren dynamische Werkzeug-Hooks?   | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Werkzeuge.            |
| Funktionieren native Werkzeug-Hooks?       | Shell-, Patch- und laufzeiteigene Werkzeuge benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Wird der Lebenszyklus der Kontext-Engine ausgeführt? | Speicher- und Kontext-Plugins sind auf die Lebenszyklusphasen Zusammenstellung, Aufnahme, Nachbearbeitung und Compaction angewiesen. |
| Welche Compaction-Daten werden bereitgestellt? | Einige Plugins benötigen nur Benachrichtigungen, andere Metadaten zu beibehaltenen und verworfenen Inhalten.  |
| Was wird absichtlich nicht unterstützt?    | Benutzer sollten keine Gleichwertigkeit mit OpenClaw annehmen, wenn die native Laufzeit mehr Zustand verwaltet. |

Der Unterstützungsvertrag für die Codex-Laufzeit ist unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

## Statusbezeichnungen

Die Statusausgabe kann sowohl die Bezeichnungen `Execution` als auch `Runtime` anzeigen.
Betrachten Sie diese als Diagnoseangaben, nicht als Provider-Namen:

- Eine Modellreferenz wie `openai/gpt-5.6-sol` bezeichnet den ausgewählten Provider und das ausgewählte Modell.
- Eine Laufzeit-ID wie `codex` bezeichnet die Schleife, die den Durchlauf ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord gibt an, wo die Unterhaltung stattfindet.

Wenn ein Lauf eine unerwartete Laufzeit anzeigt, prüfen Sie zuerst die Laufzeitrichtlinie
des ausgewählten Providers und Modells. Veraltete Laufzeitfixierungen für Sitzungen
bestimmen das Routing nicht mehr.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [GitHub-Copilot-Agentenlaufzeit](/de/plugins/copilot)
- [OpenAI](/de/providers/openai)
- [Agenten-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agentenschleife](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
