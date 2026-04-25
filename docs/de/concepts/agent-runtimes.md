---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Agenten-Laufzeit.
    - Sie sind durch Provider-/Modell-/Laufzeit-Bezeichnungen in Status oder Konfiguration verwirrt.
    - Sie dokumentieren die Funktionsparität für ein natives Harness.
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agenten-Laufzeiten voneinander trennt
title: Agenten-Laufzeiten
x-i18n:
    generated_at: "2026-04-25T13:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Eine **Agenten-Laufzeit** ist die Komponente, die einen vorbereiteten Modell-Loop besitzt: Sie
empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt
den fertigen Turn an OpenClaw zurück.

Laufzeiten lassen sich leicht mit Providern verwechseln, weil beide in der Nähe der
Modellkonfiguration auftauchen. Es sind jedoch unterschiedliche Schichten:

| Schicht         | Beispiele                             | Bedeutung                                                               |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Provider        | `openai`, `anthropic`, `openai-codex` | Wie OpenClaw authentifiziert, Modelle erkennt und Modell-Refs benennt. |
| Modell          | `gpt-5.5`, `claude-opus-4-6`          | Das für den Agenten-Turn ausgewählte Modell.                            |
| Agenten-Laufzeit | `pi`, `codex`, ACP-gestützte Laufzeiten | Der Low-Level-Loop, der den vorbereiteten Turn ausführt.              |
| Kanal           | Telegram, Discord, Slack, WhatsApp    | Wo Nachrichten in OpenClaw eingehen und es wieder verlassen.            |

Sie werden auch das Wort **Harness** in Code und Konfiguration sehen. Ein Harness ist die
Implementierung, die eine Agenten-Laufzeit bereitstellt. Zum Beispiel implementiert das gebündelte Codex-
Harness die Laufzeit `codex`. Der Konfigurationsschlüssel heißt aus Kompatibilitätsgründen weiterhin
`embeddedHarness`, aber benutzerseitige Dokumentation und Statusausgabe sollten im Allgemeinen von Laufzeit sprechen.

Die häufige Codex-Konfiguration verwendet den Provider `openai` mit der Laufzeit `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Das bedeutet, dass OpenClaw einen OpenAI-Modell-Ref auswählt und dann die Codex-App-Server-
Laufzeit bittet, den eingebetteten Agenten-Turn auszuführen. Es bedeutet nicht, dass der Kanal, der
Katalog des Modell-Providers oder der Sitzungsspeicher von OpenClaw zu Codex werden.

Zur Aufteilung der OpenAI-Familienpräfixe siehe [OpenAI](/de/providers/openai) und
[Modell-Provider](/de/concepts/model-providers). Zum Support-Vertrag der Codex-Laufzeit siehe
[Codex harness](/de/plugins/codex-harness#v1-support-contract).

## Ownership der Laufzeit

Verschiedene Laufzeiten besitzen unterschiedlich große Teile des Loops.

| Oberfläche                  | OpenClaw PI eingebettet                | Codex-App-Server                                                            |
| --------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| Eigentümer des Modell-Loops | OpenClaw über den eingebetteten PI-Runner | Codex-App-Server                                                          |
| Kanonischer Thread-Status   | OpenClaw-Transkript                    | Codex-Thread plus OpenClaw-Transkript-Spiegel                               |
| Dynamische OpenClaw-Tools   | Nativer OpenClaw-Tool-Loop             | Über den Codex-Adapter überbrückt                                            |
| Native Shell- und Datei-Tools | PI-/OpenClaw-Pfad                    | Codex-native Tools, soweit unterstützt über native Hooks überbrückt          |
| Context Engine              | Native OpenClaw-Kontextassemblierung   | Von OpenClaw projektierter, im Codex-Turn assemblierter Kontext             |
| Compaction                  | OpenClaw oder ausgewählte Context Engine | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelpflege |
| Kanalzustellung             | OpenClaw                               | OpenClaw                                                                    |

Diese Aufteilung der Ownership ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Verhalten über Plugin-Hooks bereitstellen.
- Wenn die native Laufzeit die Oberfläche besitzt, benötigt OpenClaw Laufzeitereignisse oder native Hooks.
- Wenn die native Laufzeit den kanonischen Thread-Status besitzt, sollte OpenClaw spiegeln und Kontext projizieren, statt nicht unterstützte Interna umzuschreiben.

## Auswahl der Laufzeit

OpenClaw wählt eine eingebettete Laufzeit nach der Auflösung von Provider und Modell:

1. Die aufgezeichnete Laufzeit einer Sitzung hat Vorrang. Konfigurationsänderungen schalten ein
   bestehendes Transkript nicht im laufenden Betrieb auf ein anderes natives Thread-System um.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt diese Laufzeit für neue oder zurückgesetzte Sitzungen.
3. `agents.defaults.embeddedHarness.runtime` oder
   `agents.list[].embeddedHarness.runtime` können `auto`, `pi` oder eine registrierte
   Laufzeit-ID wie `codex` setzen.
4. Im Modus `auto` können registrierte Plugin-Laufzeiten unterstützte Provider-/Modell-
   Paare beanspruchen.
5. Wenn im Modus `auto` keine Laufzeit einen Turn beansprucht und `fallback: "pi"` gesetzt ist
   (der Standard), verwendet OpenClaw PI als Kompatibilitäts-Fallback. Setzen Sie
   `fallback: "none"`, damit eine nicht passende Auswahl im Modus `auto` stattdessen fehlschlägt.

Explizite Plugin-Laufzeiten schlagen standardmäßig fail-closed fehl. Zum Beispiel bedeutet
`runtime: "codex"` Codex oder einen klaren Auswahlfehler, es sei denn, Sie setzen
`fallback: "pi"` im selben Überschreibungsbereich. Eine Laufzeitüberschreibung erbt
keine umfassendere Fallback-Einstellung, daher wird ein agentenweites `runtime: "codex"` nicht stillschweigend
auf PI zurückgeleitet, nur weil in den Standardwerten `fallback: "pi"` verwendet wurde.

## Kompatibilitätsvertrag

Wenn eine Laufzeit nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt.
Verwenden Sie für Laufzeitdokumentation dieses Schema:

| Frage                                   | Warum das wichtig ist                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Wer besitzt den Modell-Loop?            | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen zur finalen Antwort stattfinden. |
| Wer besitzt den kanonischen Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder nur spiegeln kann.                        |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools hängen davon ab.                        |
| Funktionieren dynamische Tool-Hooks?    | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools. |
| Funktionieren native Tool-Hooks?        | Shell-, Patch- und laufzeiteigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Läuft der Lifecycle der Context Engine? | Memory- und Kontext-Plugins hängen von Lifecycle für Assemble, Ingest, After-Turn und Compaction ab. |
| Welche Compaction-Daten werden offengelegt? | Manche Plugins benötigen nur Benachrichtigungen, andere Metadaten über Behalten/Verwerfen. |
| Was ist bewusst nicht unterstützt?      | Benutzer sollten keine PI-Gleichwertigkeit annehmen, wenn die native Laufzeit mehr Status besitzt. |

Der Support-Vertrag der Codex-Laufzeit ist dokumentiert in
[Codex harness](/de/plugins/codex-harness#v1-support-contract).

## Statusbezeichnungen

In der Statusausgabe können sowohl die Bezeichnungen `Execution` als auch `Runtime` erscheinen. Lesen Sie diese als
Diagnoseinformationen, nicht als Providernamen.

- Ein Modell-Ref wie `openai/gpt-5.5` sagt Ihnen, welcher Provider/welches Modell ausgewählt wurde.
- Eine Laufzeit-ID wie `codex` sagt Ihnen, welcher Loop den Turn ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord sagt Ihnen, wo die Unterhaltung stattfindet.

Wenn eine Sitzung nach einer Änderung der Laufzeitkonfiguration weiterhin PI anzeigt, starten Sie eine neue Sitzung
mit `/new` oder löschen Sie die aktuelle mit `/reset`. Bestehende Sitzungen behalten ihre
aufgezeichnete Laufzeit bei, damit ein Transkript nicht durch zwei inkompatible native
Sitzungssysteme wiedergegeben wird.

## Verwandt

- [Codex harness](/de/plugins/codex-harness)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agenten-Loop](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
