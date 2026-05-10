---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Agent-Runtime
    - Sie sind durch Provider-/Modell-/Runtime-Bezeichnungen in Status oder Konfiguration verwirrt
    - Sie dokumentieren die Support-Parität für ein natives Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agenten-Laufzeitumgebungen trennt
title: Agent-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-05-10T19:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Laufzeitumgebung** ist die Komponente, die eine vorbereitete Modellschleife besitzt: Sie
empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Werkzeugaufrufe und gibt
den abgeschlossenen Durchlauf an OpenClaw zurück.

Laufzeitumgebungen lassen sich leicht mit Providern verwechseln, da beide in der Nähe der
Modellkonfiguration auftauchen. Es sind unterschiedliche Ebenen:

| Ebene         | Beispiele                             | Bedeutung                                                            |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Wie OpenClaw authentifiziert, Modelle erkennt und Modellrefs benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`          | Das für den Agent-Durchlauf ausgewählte Modell.                       |
| Agent-Laufzeitumgebung | `pi`, `codex`, `claude-cli`  | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Durchlauf ausführt. |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Wo Nachrichten in OpenClaw eingehen und es verlassen.                |

Außerdem werden Sie im Code das Wort **harness** sehen. Ein Harness ist die Implementierung,
die eine Agent-Laufzeitumgebung bereitstellt. Beispielsweise implementiert der gebündelte Codex-Harness
die Laufzeitumgebung `codex`. Öffentliche Konfiguration verwendet `agentRuntime.id` in
Provider- oder Modelleinträgen; Laufzeitumgebungsschlüssel auf Ebene des gesamten Agents sind veraltet und werden ignoriert.
`openclaw doctor --fix` entfernt alte Laufzeitumgebungs-Pins auf Ebene des gesamten Agents und schreibt
Legacy-Laufzeitmodellrefs bei Bedarf in kanonische Provider-/Modellrefs plus modellbezogene
Laufzeitumgebungsrichtlinie um.

Es gibt zwei Laufzeitumgebungsfamilien:

- **Eingebettete Harnesses** laufen innerhalb der vorbereiteten Agent-Schleife von OpenClaw. Heute ist dies
  die integrierte Laufzeitumgebung `pi` plus registrierte Plugin-Harnesses wie
  `codex`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modellref
  kanonisch bleibt. Beispielsweise bedeutet `anthropic/claude-opus-4-7` mit
  einem modellbezogenen `agentRuntime.id: "claude-cli"`: „Anthropic-
  Modell auswählen, über Claude CLI ausführen.“ `claude-cli` ist keine eingebettete Harness-ID
  und darf nicht an die AgentHarness-Auswahl übergeben werden.

## Codex-Oberflächen

Die meiste Verwirrung entsteht dadurch, dass mehrere verschiedene Oberflächen den Namen Codex teilen:

| Oberfläche                                      | OpenClaw-Name/-Konfiguration       | Funktion                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Native Codex-App-Server-Laufzeitumgebung        | `openai/*`-Modellrefs              | Führt eingebettete OpenAI-Agent-Durchläufe über den Codex-App-Server aus. Dies ist die übliche ChatGPT/Codex-Abonnementkonfiguration. |
| Codex-OAuth-Authentifizierungsprofile           | `openai-codex`-Auth-Provider       | Speichert ChatGPT/Codex-Abonnementauthentifizierung, die der Codex-App-Server-Harness verwendet.              |
| Codex-ACP-Adapter                               | `runtime: "acp"`, `agentId: "codex"` | Führt Codex über die externe ACP/acpx-Steuerungsebene aus. Nur verwenden, wenn ACP/acpx ausdrücklich angefordert wird. |
| Nativer Codex-Chat-Steuerungsbefehlssatz        | `/codex ...`                       | Bindet, setzt fort, steuert, stoppt und inspiziert Codex-App-Server-Threads aus dem Chat heraus.              |
| OpenAI-Platform-API-Route für Nicht-Agent-Oberflächen | `openai/*` plus API-Schlüssel-Auth | Wird für direkte OpenAI-APIs wie Bilder, Embeddings, Sprache und Echtzeit verwendet.                          |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des `codex`-Plugins macht
die nativen App-Server-Funktionen verfügbar; `openclaw doctor --fix` übernimmt die Legacy-
Routenreparatur für `openai-codex/*` und die Bereinigung veralteter Sitzungs-Pins. Die Auswahl von
`openai/*` für ein Agent-Modell bedeutet nun „dies über Codex ausführen“, sofern keine
Nicht-Agent-OpenAI-API-Oberfläche verwendet wird.

Die übliche ChatGPT/Codex-Abonnementkonfiguration verwendet Codex OAuth für Authentifizierung, behält aber
die Modellref als `openai/*` bei und wählt die Laufzeitumgebung `codex` aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Das bedeutet, OpenClaw wählt eine OpenAI-Modellref aus und fordert dann die Codex-App-Server-
Laufzeitumgebung auf, den eingebetteten Agent-Durchlauf auszuführen. Es bedeutet nicht „API-Abrechnung verwenden“,
und es bedeutet nicht, dass der Kanal, der Modell-Provider-Katalog oder der OpenClaw-Sitzungsspeicher
zu Codex wird.

Wenn das gebündelte `codex`-Plugin aktiviert ist, sollte die natürlichsprachliche Codex-Steuerung
die native `/codex`-Befehlsoberfläche (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) anstelle von ACP verwenden. Verwenden Sie ACP für
Codex nur, wenn der Benutzer ausdrücklich nach ACP/acpx fragt oder den ACP-
Adapterpfad testet. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe
Harnesses verwenden weiterhin ACP.

Dies ist der agentseitige Entscheidungsbaum:

1. Wenn der Benutzer nach **Codex-Bindung/-Steuerung/-Thread/-Fortsetzung/-Lenkung/-Stopp** fragt, verwenden Sie die
   native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. Wenn der Benutzer **Codex als eingebettete Laufzeitumgebung** anfordert oder die normale
   abonnementgestützte Codex-Agent-Erfahrung möchte, verwenden Sie `openai/<model>`.
3. Wenn der Benutzer ausdrücklich **PI für ein OpenAI-Modell** wählt, behalten Sie die Modellref
   als `openai/<model>` bei und setzen Sie die Provider-/Modell-Laufzeitumgebungsrichtlinie auf
   `agentRuntime.id: "pi"`. Ein ausgewähltes `openai-codex`-Auth-Profil wird
   intern über den Legacy-Codex-Auth-Transport von PI geroutet.
4. Wenn die Legacy-Konfiguration noch **`openai-codex/*`-Modellrefs** enthält, reparieren Sie sie mit
   `openclaw doctor --fix` zu `openai/<model>`; doctor behält die Codex-Auth-
   Route bei, indem bei Bedarf Provider-/modellbezogen `agentRuntime.id: "codex"` hinzugefügt wird,
   wo die alte Modellref dies implizierte.
5. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex-ACP-Adapter** sagt, verwenden Sie
   ACP mit `runtime: "acp"` und `agentId: "codex"`.
6. Wenn die Anfrage **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder
   einen anderen externen Harness** betrifft, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Laufzeitumgebung.

| Sie meinen ...                         | Verwenden Sie ...                          |
| --------------------------------------- | -------------------------------------------- |
| Codex-App-Server-Chat-/Thread-Steuerung | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Codex-App-Server-Agent-Laufzeitumgebung | `openai/*`-Agent-Modellrefs        |
| OpenAI Codex OAuth                      | `openai-codex`-Auth-Profile                 |
| Claude Code oder anderer externer Harness | ACP/acpx                                  |

Für die Präfix-Aufteilung der OpenAI-Familie siehe [OpenAI](/de/providers/openai) und
[Modell-Provider](/de/concepts/model-providers). Für den Supportvertrag der
Codex-Harness-Runtime siehe [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract).

## Runtime-Eigentümerschaft

Verschiedene Runtimes besitzen unterschiedlich große Teile des Loops.

| Oberfläche                  | OpenClaw PI embedded                    | Codex-App-Server                                                           |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Besitzer des Modell-Loops   | OpenClaw über den PI-embedded-Runner    | Codex-App-Server                                                           |
| Kanonischer Thread-Zustand  | OpenClaw-Transkript                     | Codex-Thread plus OpenClaw-Transkriptspiegel                               |
| Dynamische OpenClaw-Tools   | Nativer OpenClaw-Tool-Loop              | Über den Codex-Adapter angebunden                                          |
| Native Shell- und Dateitools | PI/OpenClaw-Pfad                       | Codex-native Tools, wo unterstützt über native Hooks angebunden            |
| Kontext-Engine              | Native OpenClaw-Kontextzusammenstellung | OpenClaw projiziert zusammengesetzten Kontext in den Codex-Turn            |
| Compaction                  | OpenClaw oder ausgewählte Kontext-Engine | Codex-native Compaction, mit OpenClaw-Benachrichtigungen und Spiegelpflege |
| Kanalzustellung             | OpenClaw                                | OpenClaw                                                                   |

Diese Aufteilung der Eigentümerschaft ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Plugin-Hook-Verhalten bereitstellen.
- Wenn die native Runtime die Oberfläche besitzt, benötigt OpenClaw Runtime-Ereignisse oder native Hooks.
- Wenn die native Runtime den kanonischen Thread-Zustand besitzt, sollte OpenClaw Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Runtime-Auswahl

OpenClaw wählt nach Provider- und Modellauflösung eine eingebettete Runtime aus:

1. Modellbezogene Runtime-Richtlinien haben Vorrang. Diese können in einem konfigurierten Provider-
   Modelleintrag oder in `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime` liegen.
2. Provider-bezogene Runtime-Richtlinien folgen danach unter
   `models.providers.<provider>.agentRuntime`.
3. Im Modus `auto` können registrierte Plugin-Runtimes unterstützte Provider/Modell-
   Paare für sich beanspruchen.
4. Wenn im Modus `auto` keine Runtime einen Turn beansprucht, verwendet OpenClaw PI als
   Kompatibilitäts-Runtime. Verwenden Sie eine explizite Runtime-ID, wenn der Lauf
   strikt sein muss.

Runtime-Festlegungen für ganze Sitzungen und ganze Agents werden ignoriert. Dazu gehören
`OPENCLAW_AGENT_RUNTIME`, der Sitzungszustand `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` und `agents.list[].agentRuntime`. Führen Sie
`openclaw doctor --fix` aus, um veraltete Runtime-Konfiguration für ganze Agents zu entfernen und
Legacy-Runtime-Modellreferenzen zu konvertieren, wo OpenClaw die Absicht bewahren kann.

Explizite Provider/Modell-Plugin-Runtimes schlagen geschlossen fehl. Zum Beispiel bedeutet
`agentRuntime.id: "codex"` bei einem Provider oder Modell Codex oder einen eindeutigen
Auswahl-/Runtime-Fehler; es wird niemals stillschweigend zurück zu PI geroutet.

CLI-Backend-Aliase unterscheiden sich von eingebetteten Harness-IDs. Die bevorzugte
Form für die Claude-CLI ist:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Legacy-Referenzen wie `claude-cli/claude-opus-4-7` werden aus
Kompatibilitätsgründen weiterhin unterstützt, aber neue Konfiguration sollte Provider/Modell kanonisch halten und
das Ausführungs-Backend in die Provider/Modell-Runtime-Richtlinie legen.

Der Modus `auto` ist für die meisten Provider absichtlich konservativ. OpenAI-Agent-
Modelle sind die Ausnahme: Nicht gesetzte Runtime und `auto` werden beide zum Codex-
Harness aufgelöst. Explizite PI-Runtime-Konfiguration bleibt eine optionale Kompatibilitätsroute für
`openai/*`-Agent-Turns; wenn sie mit einem ausgewählten `openai-codex`-Auth-Profil kombiniert wird,
routet OpenClaw PI intern über den Legacy-Codex-Auth-Transport und
behält dabei die öffentliche Modellreferenz als `openai/*` bei. Veraltete OpenAI-PI-Sitzungsfestlegungen werden
von der Runtime-Auswahl ignoriert und können mit `openclaw doctor --fix` bereinigt werden.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während
`openai-codex/*` in der Konfiguration verbleibt, behandeln Sie dies als Legacy-Routenzustand. Führen Sie
`openclaw doctor --fix` aus, um ihn zu `openai/*` mit der Codex-Runtime umzuschreiben.

## Kompatibilitätsvertrag

Wenn eine Runtime nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt.
Verwenden Sie diese Struktur für Runtime-Dokumentation:

| Frage                                 | Warum es wichtig ist                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Wem gehört der Modell-Loop?           | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen über die endgültige Antwort erfolgen. |
| Wem gehört der kanonische Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder ihn nur spiegeln kann.                               |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools hängen davon ab.                                  |
| Funktionieren dynamische Tool-Hooks?  | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools.        |
| Funktionieren native Tool-Hooks?      | Shell-, Patch- und Runtime-eigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Wird der Lebenszyklus der Kontext-Engine ausgeführt? | Speicher- und Kontext-Plugins hängen vom Lebenszyklus für Zusammenstellung, Ingest, Nach-dem-Turn und Compaction ab. |
| Welche Compaction-Daten werden offengelegt? | Einige Plugins benötigen nur Benachrichtigungen, während andere Metadaten zu beibehaltenen/verworfenen Elementen benötigen. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine PI-Äquivalenz annehmen, wenn die native Runtime mehr Zustand besitzt.            |

Der Supportvertrag der Codex-Runtime ist dokumentiert in
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract).

## Statuslabels

Die Statusausgabe kann sowohl `Execution`- als auch `Runtime`-Labels anzeigen. Lesen Sie sie als
Diagnosedaten, nicht als Provider-Namen.

- Eine Modellreferenz wie `openai/gpt-5.5` gibt den ausgewählten Provider/das ausgewählte Modell an.
- Eine Runtime-ID wie `codex` gibt an, welcher Loop den Turn ausführt.
- Ein Kanallabel wie Telegram oder Discord gibt an, wo die Unterhaltung stattfindet.

Wenn ein Lauf weiterhin eine unerwartete Runtime anzeigt, prüfen Sie zuerst die Runtime-Richtlinie
des ausgewählten Providers/Modells. Legacy-Runtime-Pins für Sitzungen bestimmen das Routing nicht mehr.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Loop](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
