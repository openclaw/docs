---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Agent-Laufzeitumgebung
    - Sie sind durch Provider-, Modell- oder Runtime-Bezeichnungen im Status oder in der Konfiguration verwirrt
    - Sie dokumentieren die Support-Parität für ein natives Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agenten-Laufzeitumgebungen trennt
title: Agent-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-05-02T06:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Runtime** ist die Komponente, die eine vorbereitete Modellschleife besitzt: Sie
empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt
den abgeschlossenen Turn an OpenClaw zurück.

Runtimes lassen sich leicht mit Providern verwechseln, weil beide in der Nähe der
Modellkonfiguration auftauchen. Sie sind unterschiedliche Ebenen:

| Ebene         | Beispiele                             | Bedeutung                                                           |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Wie OpenClaw authentifiziert, Modelle entdeckt und Modell-Refs benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`          | Das für den Agent-Turn ausgewählte Modell.                          |
| Agent-Runtime | `pi`, `codex`, `claude-cli`           | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Turn ausführt. |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Wo Nachrichten in OpenClaw eintreten und es verlassen.              |

Sie werden im Code auch das Wort **Harness** sehen. Ein Harness ist die Implementierung,
die eine Agent-Runtime bereitstellt. Zum Beispiel implementiert der gebündelte Codex-Harness
die `codex`-Runtime. Öffentliche Konfiguration verwendet `agentRuntime.id`; `openclaw
doctor --fix` schreibt ältere Runtime-Policy-Schlüssel in diese Form um.

Es gibt zwei Runtime-Familien:

- **Eingebettete Harnesses** laufen innerhalb der vorbereiteten Agent-Schleife von OpenClaw. Heute ist dies
  die integrierte `pi`-Runtime plus registrierte Plugin-Harnesses wie
  `codex`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modell-Ref
  kanonisch bleibt. Zum Beispiel bedeutet `anthropic/claude-opus-4-7` mit
  `agentRuntime.id: "claude-cli"` „Anthropic-Modell auswählen, über
  Claude CLI ausführen.“ `claude-cli` ist keine eingebettete Harness-ID und darf nicht
  an die AgentHarness-Auswahl übergeben werden.

## Codex-Oberflächen

Die meiste Verwirrung entsteht dadurch, dass mehrere verschiedene Oberflächen den Namen Codex teilen:

| Oberfläche                                           | OpenClaw-Name/-Konfiguration              | Aufgabe                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Native Codex App-Server-Runtime                      | `openai/*` plus `agentRuntime.id: "codex"` | Führt den eingebetteten Agent-Turn über den Codex App-Server aus. Dies ist die übliche Einrichtung für ChatGPT-/Codex-Abonnements. |
| Codex OAuth-Provider-Route                           | `openai-codex/*` Modell-Refs              | Verwendet ChatGPT-/Codex-Abonnement-OAuth über den normalen OpenClaw PI-Runner.                            |
| Codex ACP-Adapter                                    | `runtime: "acp"`, `agentId: "codex"`       | Führt Codex über die externe ACP/acpx-Steuerungsebene aus. Nur verwenden, wenn ACP/acpx ausdrücklich angefragt wird. |
| Nativer Codex Chat-Steuerungsbefehlssatz             | `/codex ...`                               | Bindet, setzt fort, steuert, stoppt und inspiziert Codex App-Server-Threads aus dem Chat heraus.           |
| OpenAI Platform API-Route für GPT-/Codex-artige Modelle | `openai/*` Modell-Refs                  | Verwendet OpenAI-API-Schlüssel-Authentifizierung, sofern kein Runtime-Override, wie `agentRuntime.id: "codex"`, den Turn ausführt. |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des `codex`-Plugins macht
die nativen App-Server-Funktionen verfügbar; es schreibt `openai-codex/*` nicht in
`openai/*` um, ändert keine bestehenden Sitzungen und macht ACP nicht zum Codex-Standard.
Die Auswahl von `openai-codex/*` bedeutet „die Codex OAuth-Provider-Route verwenden“,
sofern Sie nicht separat eine Runtime erzwingen.

Die übliche ChatGPT-/Codex-Abonnementkonfiguration verwendet Codex OAuth für die Authentifizierung,
behält die Modell-Ref jedoch als `openai/*` bei und wählt die `codex`-Runtime:

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

Das bedeutet, dass OpenClaw eine OpenAI-Modell-Ref auswählt und anschließend die Codex App-Server-
Runtime bittet, den eingebetteten Agent-Turn auszuführen. Es bedeutet nicht „API-Abrechnung verwenden“,
und es bedeutet nicht, dass der Kanal, der Modell-Provider-Katalog oder der OpenClaw-Sitzungsspeicher
zu Codex wird.

Wenn das gebündelte `codex`-Plugin aktiviert ist, sollte die natürlichsprachliche Codex-Steuerung
die native `/codex`-Befehlsoberfläche (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) statt ACP verwenden. Verwenden Sie ACP für
Codex nur, wenn der Benutzer ausdrücklich nach ACP/acpx fragt oder den ACP-Adapterpfad testet.
Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe Harnesses verwenden weiterhin ACP.

Dies ist der Entscheidungsbaum für Agents:

1. Wenn der Benutzer nach **Codex bind/control/thread/resume/steer/stop** fragt, verwenden Sie die
   native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. Wenn der Benutzer nach **Codex als eingebetteter Runtime** fragt oder das normale
   abonnementgestützte Codex-Agent-Erlebnis möchte, verwenden Sie
   `openai/<model>` mit `agentRuntime.id: "codex"`.
3. Wenn der Benutzer nach **Codex OAuth-/Abonnementauthentifizierung auf dem normalen OpenClaw
   Runner** fragt, verwenden Sie `openai-codex/<model>` und lassen die Runtime als PI.
4. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex ACP-Adapter** sagt, verwenden Sie
   ACP mit `runtime: "acp"` und `agentId: "codex"`.
5. Wenn die Anfrage **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder
   einen anderen externen Harness** betrifft, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Runtime.

| Sie meinen ...                         | Verwenden Sie ...                            |
| -------------------------------------- | -------------------------------------------- |
| Codex App-Server-Chat-/Thread-Steuerung | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Agent-Runtime des Codex App-Servers | `agentRuntime.id: "codex"`                   |
| OpenAI Codex OAuth auf dem PI-Runner   | `openai-codex/*` Modell-Refs                 |
| Claude Code oder anderer externer Harness | ACP/acpx                                     |

Zur Aufteilung der OpenAI-Familienpräfixe siehe [OpenAI](/de/providers/openai) und
[Modell-Provider](/de/concepts/model-providers). Zum Support-Vertrag der Codex-Runtime
siehe [Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

## Runtime-Verantwortung

Verschiedene Runtimes besitzen unterschiedliche Teile der Schleife.

| Oberfläche                  | OpenClaw PI eingebettet                  | Codex App-Server                                                           |
| --------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Besitzer der Modellschleife | OpenClaw über den eingebetteten PI-Runner | Codex App-Server                                                           |
| Kanonischer Thread-Zustand  | OpenClaw-Transkript                      | Codex-Thread plus OpenClaw-Transkriptspiegel                               |
| Dynamische OpenClaw-Tools   | Native OpenClaw-Tool-Schleife            | Über den Codex-Adapter gebrückt                                            |
| Native Shell- und Datei-Tools | PI/OpenClaw-Pfad                       | Codex-native Tools, über native Hooks gebrückt, sofern unterstützt         |
| Kontext-Engine              | Native OpenClaw-Kontextzusammenstellung  | OpenClaw-Projekte stellen Kontext in den Codex-Turn zusammen               |
| Compaction                  | OpenClaw oder ausgewählte Kontext-Engine | Codex-native Compaction, mit OpenClaw-Benachrichtigungen und Spiegelpflege |
| Kanalzustellung             | OpenClaw                                 | OpenClaw                                                                   |

Diese Verantwortungsaufteilung ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Plugin-Hook-Verhalten bereitstellen.
- Wenn die native Runtime die Oberfläche besitzt, benötigt OpenClaw Runtime-Ereignisse oder native Hooks.
- Wenn die native Runtime den kanonischen Thread-Zustand besitzt, sollte OpenClaw Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Runtime-Auswahl

OpenClaw wählt eine eingebettete Runtime nach der Provider- und Modellauflösung aus:

1. Die in einer Sitzung aufgezeichnete Runtime gewinnt. Konfigurationsänderungen wechseln ein
   bestehendes Transkript nicht im laufenden Betrieb auf ein anderes natives Thread-System.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt diese Runtime für neue oder zurückgesetzte Sitzungen.
3. `agents.defaults.agentRuntime.id` oder `agents.list[].agentRuntime.id` kann
   `auto`, `pi`, eine registrierte eingebettete Harness-ID wie `codex` oder einen
   unterstützten CLI-Backend-Alias wie `claude-cli` setzen.
4. Im `auto`-Modus können registrierte Plugin-Runtimes unterstützte Provider-/Modellpaare
   beanspruchen.
5. Wenn im `auto`-Modus keine Runtime einen Turn beansprucht und `fallback: "pi"` gesetzt ist
   (der Standard), verwendet OpenClaw PI als Kompatibilitäts-Fallback. Setzen Sie
   `fallback: "none"`, damit eine nicht zugeordnete Auswahl im `auto`-Modus stattdessen fehlschlägt.

Explizite Plugin-Runtimes schlagen standardmäßig geschlossen fehl. Zum Beispiel bedeutet
`agentRuntime.id: "codex"` Codex oder einen eindeutigen Auswahlfehler, sofern Sie nicht
`fallback: "pi"` im selben Override-Gültigkeitsbereich setzen. Ein Runtime-Override erbt
keine breitere Fallback-Einstellung, sodass ein `agentRuntime.id: "codex"` auf Agent-Ebene nicht
stillschweigend zurück zu PI geleitet wird, nur weil die Defaults `fallback: "pi"` verwendet haben.

CLI-Backend-Aliasse unterscheiden sich von eingebetteten Harness-IDs. Die bevorzugte
Claude CLI-Form ist:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Legacy-Refs wie `claude-cli/claude-opus-4-7` bleiben aus Kompatibilitätsgründen
unterstützt, aber neue Konfiguration sollte Provider/Modell kanonisch halten und das
Ausführungs-Backend in `agentRuntime.id` setzen.

Der `auto`-Modus ist absichtlich konservativ. Plugin-Runtimes können
Provider-/Modellpaare beanspruchen, die sie verstehen, aber das Codex-Plugin beansprucht den
`openai-codex`-Provider im `auto`-Modus nicht. Dadurch bleibt
`openai-codex/*` die explizite PI-Codex-OAuth-Route, und Abonnementauthentifizierungs-Konfigurationen
werden nicht stillschweigend auf den nativen App-Server-Harness verschoben.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während
`openai-codex/*` weiterhin über PI geleitet wird, behandeln Sie dies als Diagnose, nicht als
Migration. Lassen Sie die Konfiguration unverändert, wenn PI Codex OAuth das ist, was Sie möchten.
Wechseln Sie nur dann zu `openai/<model>` plus `agentRuntime.id: "codex"`, wenn Sie native
Codex App-Server-Ausführung möchten.

## Kompatibilitätsvertrag

Wenn eine Runtime nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt.
Verwenden Sie diese Form für Runtime-Dokumentation:

| Frage                                  | Warum es wichtig ist                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Wer ist für den Model Loop zuständig?  | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen zur endgültigen Antwort erfolgen. |
| Wer ist für den kanonischen Thread-Verlauf zuständig? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder nur spiegeln kann.                              |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools hängen davon ab.                            |
| Funktionieren dynamische Tool-Hooks?   | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools.  |
| Funktionieren native Tool-Hooks?       | Shell-, Patch- und runtime-eigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Läuft der Lebenszyklus der Kontext-Engine? | Speicher- und Kontext-Plugins hängen vom Assemble-, Ingest-, After-Turn- und Compaction-Lebenszyklus ab. |
| Welche Compaction-Daten werden offengelegt? | Manche Plugins benötigen nur Benachrichtigungen, während andere beibehaltene/verworfene Metadaten benötigen. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine PI-Gleichwertigkeit annehmen, wenn die native Runtime mehr Zustand besitzt. |

Der Supportvertrag für die Codex-Runtime ist in
[Codex-Harness](/de/plugins/codex-harness#v1-support-contract) dokumentiert.

## Statusbezeichnungen

Die Statusausgabe kann sowohl die Labels `Execution` als auch `Runtime` anzeigen. Verstehen Sie sie als
Diagnoseangaben, nicht als Provider-Namen.

- Eine Modellreferenz wie `openai/gpt-5.5` zeigt Ihnen den ausgewählten Provider/das ausgewählte Modell.
- Eine Runtime-ID wie `codex` zeigt Ihnen, welche Schleife den Turn ausführt.
- Ein Kanal-Label wie Telegram oder Discord zeigt Ihnen, wo die Unterhaltung stattfindet.

Wenn eine Sitzung nach dem Ändern der Runtime-Konfiguration weiterhin PI anzeigt, starten Sie eine neue Sitzung
mit `/new` oder löschen Sie die aktuelle mit `/reset`. Bestehende Sitzungen behalten ihre
aufgezeichnete Runtime, damit ein Transkript nicht durch zwei inkompatible native
Sitzungssysteme erneut wiedergegeben wird.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent Loop](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
