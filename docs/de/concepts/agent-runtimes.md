---
read_when:
    - Sie wählen zwischen OpenClaw, Codex, ACP oder einer anderen nativen Agent-Runtime
    - Sie sind durch Provider-/Modell-/Runtime-Bezeichnungen in Status oder Konfiguration verwirrt
    - Sie dokumentieren die Support-Parität für einen nativen Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agenten-Laufzeiten trennt
title: Agent-Laufzeiten
x-i18n:
    generated_at: "2026-06-27T17:22:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Runtime** ist die Komponente, die genau eine vorbereitete Modellschleife besitzt: Sie empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt den abgeschlossenen Turn an OpenClaw zurück.

Runtimes lassen sich leicht mit Providern verwechseln, weil beide in der Nähe der Modellkonfiguration auftauchen. Es sind unterschiedliche Ebenen:

| Ebene         | Beispiele                                    | Bedeutung                                                           |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `github-copilot`      | Wie OpenClaw authentifiziert, Modelle erkennt und Modellreferenzen benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`                 | Das für den Agent-Turn ausgewählte Modell.                          |
| Agent-Runtime | `openclaw`, `codex`, `copilot`, `claude-cli` | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Turn ausführt. |
| Kanal         | Telegram, Discord, Slack, WhatsApp           | Wo Nachrichten in OpenClaw ein- und austreten.                      |

Im Code sehen Sie außerdem das Wort **Harness**. Ein Harness ist die Implementierung, die eine Agent-Runtime bereitstellt. Zum Beispiel implementiert der gebündelte Codex-Harness die Runtime `codex`. Öffentliche Konfiguration verwendet `agentRuntime.id` in Provider- oder Modelleinträgen; Runtime-Schlüssel für ganze Agents sind veraltet und werden ignoriert. `openclaw doctor --fix` entfernt alte Runtime-Pins für ganze Agents und schreibt veraltete Runtime-Modellreferenzen in kanonische Provider-/Modellreferenzen plus bei Bedarf modellbezogene Runtime-Richtlinie um.

Es gibt zwei Runtime-Familien:

- **Eingebettete Harnesses** laufen innerhalb der vorbereiteten Agent-Schleife von OpenClaw. Heute umfasst dies die integrierte Runtime `openclaw` sowie registrierte Plugin-Harnesses wie `codex` und `copilot`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modellreferenz kanonisch bleibt. Zum Beispiel bedeutet `anthropic/claude-opus-4-8` mit einer modellbezogenen Einstellung `agentRuntime.id: "claude-cli"`: „Anthropic-Modell auswählen, über Claude CLI ausführen.“ `claude-cli` ist keine eingebettete Harness-ID und darf nicht an die AgentHarness-Auswahl übergeben werden.

Der `copilot`-Harness ist ein separater, optionaler externer Plugin-Harness für die GitHub Copilot CLI; siehe [GitHub Copilot-Agent-Runtime](/de/plugins/copilot) für die benutzerseitige Entscheidung zwischen PI, Codex und GitHub Copilot-Agent-Runtime.

## Codex-Oberflächen

Die meiste Verwirrung entsteht dadurch, dass mehrere verschiedene Oberflächen den Namen Codex teilen:

| Oberfläche                                      | OpenClaw-Name/-Konfiguration          | Aufgabe                                                                                                        |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Native Codex-App-Server-Runtime                  | `openai/*`-Modellreferenzen          | Führt eingebettete OpenAI-Agent-Turns über den Codex-App-Server aus. Dies ist die übliche ChatGPT/Codex-Abonnement-Einrichtung. |
| Codex-OAuth-Authentifizierungsprofile            | `openai`-OAuth-Profile               | Speichert die ChatGPT/Codex-Abonnement-Authentifizierung, die der Codex-App-Server-Harness nutzt.              |
| Codex-ACP-Adapter                                | `runtime: "acp"`, `agentId: "codex"` | Führt Codex über die externe ACP/acpx-Steuerungsebene aus. Nur verwenden, wenn ACP/acpx ausdrücklich angefordert wird. |
| Native Codex-Chat-Steuerbefehle                  | `/codex ...`                         | Bindet, setzt fort, steuert, stoppt und inspiziert Codex-App-Server-Threads aus dem Chat heraus.               |
| OpenAI-Platform-API-Route für Nicht-Agent-Oberflächen | `openai/*` plus API-Schlüssel-Auth | Wird für direkte OpenAI-APIs wie Bilder, Embeddings, Sprache und Echtzeit verwendet.                           |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des `codex`-Plugins macht die nativen App-Server-Funktionen verfügbar; `openclaw doctor --fix` ist für die Reparatur veralteter Codex-Routen und die Bereinigung veralteter Sitzungs-Pins zuständig. Die Auswahl von `openai/*` für ein Agent-Modell bedeutet jetzt „dies über Codex ausführen“, sofern keine Nicht-Agent-Oberfläche der OpenAI-API verwendet wird.

Die übliche ChatGPT/Codex-Abonnement-Einrichtung verwendet Codex OAuth für die Authentifizierung, behält aber die Modellreferenz als `openai/*` bei und wählt die Runtime `codex` aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Das bedeutet, dass OpenClaw eine OpenAI-Modellreferenz auswählt und dann die Codex-App-Server-Runtime auffordert, den eingebetteten Agent-Turn auszuführen. Es bedeutet nicht „API-Abrechnung verwenden“, und es bedeutet nicht, dass der Kanal, der Modell-Provider-Katalog oder der OpenClaw-Sitzungsspeicher zu Codex wird.

Wenn das gebündelte `codex`-Plugin aktiviert ist, sollte die natürlichsprachliche Codex-Steuerung die native `/codex`-Befehlsoberfläche (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) statt ACP verwenden. Verwenden Sie ACP für Codex nur, wenn der Benutzer ausdrücklich ACP/acpx anfordert oder den ACP-Adapterpfad testet. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe Harnesses verwenden weiterhin ACP.

Dies ist der Entscheidungsbaum für Agents:

1. Wenn der Benutzer **Codex-Bindung/-Steuerung/-Thread/-Fortsetzung/-Lenkung/-Stopp** anfordert, verwenden Sie die native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. Wenn der Benutzer **Codex als eingebettete Runtime** anfordert oder die normale, abonnementgestützte Codex-Agent-Erfahrung möchte, verwenden Sie `openai/<model>`.
3. Wenn der Benutzer ausdrücklich **OpenClaw für ein OpenAI-Modell** auswählt, behalten Sie die Modellreferenz als `openai/<model>` bei und setzen Sie die Provider-/Modell-Runtime-Richtlinie auf `agentRuntime.id: "openclaw"`. Ein ausgewähltes `openai`-OAuth-Profil wird intern über OpenClaws Codex-Auth-Transport geroutet.
4. Wenn die alte Konfiguration noch **veraltete Codex-Modellreferenzen** enthält, reparieren Sie sie mit `openclaw doctor --fix` zu `openai/<model>`; doctor behält die Codex-Authentifizierungsroute bei, indem es dort, wo die alte Modellreferenz dies implizierte, eine Provider-/modellbezogene `agentRuntime.id: "codex"` hinzufügt.
   Veraltete **`codex-cli/*`-Modellreferenzen** werden auf dieselbe `openai/<model>`-Codex-App-Server-Route repariert; OpenClaw behält kein gebündeltes Codex-CLI-Backend mehr bei.
5. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex-ACP-Adapter** sagt, verwenden Sie ACP mit `runtime: "acp"` und `agentId: "codex"`.
6. Wenn die Anfrage **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder einen anderen externen Harness** betrifft, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Runtime.

| Gemeint ist...                         | Verwenden Sie...                             |
| --------------------------------------- | -------------------------------------------- |
| Codex-App-Server-Chat-/Thread-Steuerung | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Codex-App-Server-Agent-Runtime | `openai/*`-Agent-Modellreferenzen        |
| OpenAI Codex OAuth                      | `openai`-OAuth-Profile                       |
| Claude Code oder anderer externer Harness | ACP/acpx                                   |

Zur Präfixaufteilung der OpenAI-Familie siehe [OpenAI](/de/providers/openai) und [Modell-Provider](/de/concepts/model-providers). Zum Support-Vertrag der Codex-Runtime siehe [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract).

## Runtime-Zuständigkeit

Verschiedene Runtimes besitzen unterschiedlich große Teile der Schleife.

| Oberfläche                  | OpenClaw eingebettet                          | Codex-App-Server                                                           |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Besitzer der Modellschleife | OpenClaw über den eingebetteten OpenClaw-Runner | Codex-App-Server                                                          |
| Kanonischer Thread-Zustand  | OpenClaw-Transkript                           | Codex-Thread plus OpenClaw-Transkriptspiegel                               |
| Dynamische OpenClaw-Tools   | Native OpenClaw-Tool-Schleife                 | Über den Codex-Adapter gebridged                                           |
| Native Shell- und Datei-Tools | OpenClaw-Pfad                               | Codex-native Tools, wo unterstützt über native Hooks gebridged             |
| Kontext-Engine              | Native OpenClaw-Kontextzusammenstellung       | OpenClaw-Projekte stellen Kontext für den Codex-Turn zusammen              |
| Compaction                  | OpenClaw oder ausgewählte Kontext-Engine      | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelpflege  |
| Kanalzustellung             | OpenClaw                                      | OpenClaw                                                                    |

Diese Zuständigkeitsaufteilung ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Plugin-Hook-Verhalten bereitstellen.
- Wenn die native Runtime die Oberfläche besitzt, benötigt OpenClaw Runtime-Ereignisse oder native Hooks.
- Wenn die native Runtime den kanonischen Thread-Zustand besitzt, sollte OpenClaw Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Runtime-Auswahl

OpenClaw wählt nach Provider- und Modellauflösung eine eingebettete Runtime aus:

1. Modellbezogene Runtime-Richtlinie gewinnt. Diese kann in einem konfigurierten Provider-Modelleintrag oder in `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` stehen. Ein Provider-Wildcard wie `agents.defaults.models["vllm/*"].agentRuntime` gilt nach exakter Modellrichtlinie, sodass dynamisch erkannte Provider-Modelle eine Runtime teilen können, ohne exakte Ausnahmen pro Modell zu überschreiben.
2. Provider-bezogene Runtime-Richtlinie folgt unter `models.providers.<provider>.agentRuntime`.
3. Im Modus `auto` können registrierte Plugin-Runtimes unterstützte Provider-/Modellpaare beanspruchen.
4. Wenn im Modus `auto` keine Runtime einen Turn beansprucht, verwendet OpenClaw `openclaw` als Kompatibilitäts-Runtime. Verwenden Sie eine explizite Runtime-ID, wenn der Lauf strikt sein muss.

Runtime-Pins für ganze Sitzungen und ganze Agents werden ignoriert. Dazu gehören `OPENCLAW_AGENT_RUNTIME`, der Sitzungszustand `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` und `agents.list[].agentRuntime`. Führen Sie `openclaw doctor --fix` aus, um veraltete Runtime-Konfiguration für ganze Agents zu entfernen und veraltete Runtime-Modellreferenzen dort umzuwandeln, wo OpenClaw die Absicht erhalten kann.

Explizite Provider-/Modell-Plugin-Runtimes schlagen geschlossen fehl. Zum Beispiel bedeutet `agentRuntime.id: "codex"` bei einem Provider oder Modell Codex oder einen klaren Auswahl-/Runtime-Fehler; es wird nie stillschweigend zurück zu OpenClaw geroutet.

CLI-Backend-Aliasse unterscheiden sich von eingebetteten Harness-IDs. Die bevorzugte Claude-CLI-Form ist:

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

Veraltete Referenzen wie `claude-cli/claude-opus-4-7` bleiben aus Kompatibilitätsgründen unterstützt, neue Konfiguration sollte jedoch Provider/Modell kanonisch halten und das Ausführungs-Backend in die Provider-/Modell-Runtime-Richtlinie legen.

Veraltete `codex-cli/*`-Referenzen sind anders: doctor migriert sie zu `openai/*`, sodass sie über den Codex-App-Server-Harness laufen, statt ein Codex-CLI-Backend beizubehalten.

Der Modus `auto` ist für die meisten Provider absichtlich konservativ. OpenAI-Agent-Modelle sind die Ausnahme: Sowohl eine nicht gesetzte Runtime als auch `auto` werden zum Codex-Harness aufgelöst. Eine explizite OpenClaw-Runtime-Konfiguration bleibt eine optionale Kompatibilitätsroute für `openai/*`-Agent-Turns; wenn sie mit einem ausgewählten `openai`-OAuth-Profil kombiniert wird, routet OpenClaw diesen Pfad intern über den Codex-Auth-Transport und behält die öffentliche Modellreferenz als `openai/*` bei. Veraltete OpenAI-Runtime-Sitzungs-Pins werden von der Runtime-Auswahl ignoriert und können mit `openclaw doctor --fix` bereinigt werden.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während
veraltete Codex-Modellreferenzen in der Konfiguration verbleiben, behandeln Sie das als veralteten Routing-Zustand. Führen Sie
`openclaw doctor --fix` aus, um ihn mit der Codex-Runtime zu `openai/*` umzuschreiben.

## GitHub Copilot-Agent-Runtime

Das externe `@openclaw/copilot`-Plugin registriert eine optionale `copilot`-Runtime,
die von der GitHub Copilot CLI (`@github/copilot-sdk`) gestützt wird. Es beansprucht den
kanonischen Abonnement-Provider `github-copilot` und wird **nie** von
`auto` ausgewählt. Aktivieren Sie sie pro Modell oder pro Provider über `agentRuntime.id`:

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

Der Harness beansprucht seinen Provider, seine Runtime, seinen CLI-Sitzungsschlüssel und sein Auth-Profil-
Präfix in `extensions/copilot/doctor-contract-api.ts`, das
`openclaw doctor` automatisch lädt. Informationen zu Konfiguration, Auth, Transcript-Spiegelung,
Compaction, dem deklarativen Doctor-Vertrag und der umfassenderen Entscheidung zwischen PI, Codex und
Copilot SDK finden Sie unter [GitHub Copilot-Agent-Runtime](/de/plugins/copilot).

## Kompatibilitätsvertrag

Wenn eine Runtime nicht OpenClaw ist, sollte sie dokumentieren, welche OpenClaw-Schnittstellen sie unterstützt.
Verwenden Sie diese Form für Runtime-Dokumentation:

| Frage                                  | Warum es wichtig ist                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Wer besitzt die Modellschleife?        | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen über die finale Antwort stattfinden. |
| Wer besitzt den kanonischen Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder ihn nur spiegeln kann.                              |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools hängen davon ab.                                |
| Funktionieren dynamische Tool-Hooks?   | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools.       |
| Funktionieren native Tool-Hooks?       | Shell-, Patch- und Runtime-eigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Läuft der Lebenszyklus der Kontext-Engine? | Memory- und Kontext-Plugins hängen von assemble, ingest, after-turn und dem Compaction-Lebenszyklus ab. |
| Welche Compaction-Daten werden offengelegt? | Manche Plugins benötigen nur Benachrichtigungen, während andere Metadaten zu Beibehaltenem/Verworfenem benötigen. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine OpenClaw-Gleichwertigkeit annehmen, wenn die native Runtime mehr Zustand besitzt. |

Der Support-Vertrag der Codex-Runtime ist in
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#v1-support-contract) dokumentiert.

## Statuslabels

Die Statusausgabe kann sowohl `Execution`- als auch `Runtime`-Labels anzeigen. Lesen Sie sie als
Diagnoseinformationen, nicht als Provider-Namen.

- Eine Modellreferenz wie `openai/gpt-5.5` zeigt Ihnen den ausgewählten Provider bzw. das ausgewählte Modell.
- Eine Runtime-ID wie `codex` zeigt Ihnen, welche Schleife den Turn ausführt.
- Ein Kanal-Label wie Telegram oder Discord zeigt Ihnen, wo die Unterhaltung stattfindet.

Wenn ein Lauf weiterhin eine unerwartete Runtime anzeigt, prüfen Sie zuerst die Runtime-Richtlinie
des ausgewählten Providers/Modells. Veraltete Runtime-Pins für Sitzungen entscheiden das Routing nicht mehr.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [GitHub Copilot-Agent-Runtime](/de/plugins/copilot)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
