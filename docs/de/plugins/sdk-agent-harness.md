---
read_when:
    - Sie ändern die eingebettete Agent-Runtime oder die Harness-Registry
    - Sie registrieren ein Agent-Harness aus einem mitgelieferten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, in welchem Verhältnis das Codex-Plugin zu Modell-Providern steht.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-05-10T19:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agenten-Turn. Er ist kein Modell-Provider, kein Kanal und keine Tool-Registry. Für das nutzerorientierte mentale Modell siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist noch experimentell, weil die Parametertypen bewusst den aktuellen eingebetteten Runner widerspiegeln.

## Wann Sie einen Harness verwenden sollten

Registrieren Sie einen Agent Harness, wenn eine Modellfamilie ihre eigene native Session-Runtime hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction besitzt
- eine lokale CLI oder ein Daemon, der native Plan-/Reasoning-/Tool-Events streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-Session-Transkript eine eigene Resume-ID benötigt

Registrieren Sie **keinen** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Authentifizierungsstatus
- Denkstufe und Kontextbudget
- die OpenClaw-Transkript-/Session-Datei
- Workspace, Sandbox und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback und Richtlinie für Live-Modellwechsel

Diese Trennung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; er wählt keine Provider aus, ersetzt keine Kanalauslieferung und wechselt Modelle nicht stillschweigend.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein von OpenClaw besessenes Richtlinienpaket für Runtime-Entscheidungen, die über Pi und native Harnesses hinweg geteilt bleiben müssen:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für Provider-bewusste Tool-Schema-Richtlinien
- `runtimePlan.transcript.resolvePolicy(...)` für Transkriptsanitisierung und
  Tool-Call-Reparaturrichtlinien
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsame `NO_REPLY`- und Medienauslieferungsunterdrückung
- `runtimePlan.outcome.classifyRunResult(...)` für Modell-Fallback-Klassifizierung
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses können den Plan für Entscheidungen verwenden, die dem Pi-Verhalten entsprechen müssen, sollten ihn aber weiterhin als versuchsspezifischen Zustand des Hosts behandeln. Mutieren Sie ihn nicht und verwenden Sie ihn nicht, um innerhalb eines Turns Provider/Modelle zu wechseln.

## Einen Harness registrieren

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Auswahlrichtlinie

OpenClaw wählt nach der Provider-/Modellauflösung einen Harness aus:

1. Modellbezogene Runtime-Richtlinie gewinnt.
2. Providerbezogene Runtime-Richtlinie kommt als Nächstes.
3. `auto` fragt registrierte Harnesses, ob sie den aufgelösten
   Provider/das aufgelöste Modell unterstützen.
4. Wenn kein registrierter Harness passt, verwendet OpenClaw Pi, sofern Pi-Fallback nicht deaktiviert ist.

Plugin-Harness-Fehler werden als Laufzeitfehler sichtbar. Im `auto`-Modus wird Pi-Fallback nur verwendet, wenn kein registrierter Plugin-Harness den aufgelösten Provider/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw denselben Turn nicht erneut über Pi ab, weil das Auth-/Runtime-Semantik ändern oder Seiteneffekte duplizieren kann.

Runtime-Pins für die gesamte Session und den gesamten Agenten werden von der Auswahl ignoriert. Dazu gehören veraltete Session-Werte für `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` und `OPENCLAW_AGENT_RUNTIME`. `/status` zeigt die effektive Runtime, die aus der Provider-/Modellroute ausgewählt wurde.
Wenn der ausgewählte Harness überraschend ist, aktivieren Sie `agents/harness`-Debug-Logging und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im `auto`-Modus das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Core behandelt dies als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin oder die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selector.

## Provider-plus-Harness-Paarung

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen, Auth-Status, Modellmetadaten und `/model`-Auswahl für den Rest von OpenClaw sichtbar. Der Harness beansprucht diesen Provider dann in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Nutzermodellreferenzen: `openai/gpt-5.5`
- Kompatibilitätsreferenzen: Legacy-Referenzen `codex/gpt-*` bleiben akzeptiert, neue
  Konfigurationen sollten sie aber nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil der Codex-Harness den
  nativen Codex-Login/die native Codex-Session besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt den
  Harness mit dem nativen App-Server-Protokoll kommunizieren

Das Codex-Plugin ist additiv. Einfache `openai/gpt-*`-Agentenreferenzen beim offiziellen OpenAI-Provider wählen standardmäßig den Codex-Harness aus. Ältere `codex/gpt-*`-Referenzen wählen aus Kompatibilitätsgründen weiterhin den Codex-Provider und -Harness aus.

Für Operator-Einrichtung, Modellpräfix-Beispiele und Codex-only-Konfigurationen siehe [Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft den Initialize-Handshake des App-Servers und blockiert ältere oder unversionierte Server, damit OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde. Die Untergrenze `0.125.0` enthält die native MCP-Hook-Payload-Unterstützung, die in Codex `0.124.0` eingeführt wurde, während OpenClaw an die neuere getestete stabile Linie gebunden wird.

### Tool-Ergebnis-Middleware

Gebündelte Plugins können Runtime-neutrale Tool-Ergebnis-Middleware über `api.registerAgentToolResultMiddleware(...)` anhängen, wenn ihr Manifest die Ziel-Runtime-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige Schnittstelle ist für asynchrone Tool-Ergebnis-Transformationen gedacht, die ausgeführt werden müssen, bevor Pi oder Codex Tool-Ausgaben wieder in das Modell einspeist.

Legacy-gebündelte Plugins können weiterhin `api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die nur für den Codex-App-Server gilt, neue Ergebnis-Transformationen sollten jedoch die Runtime-neutrale API verwenden. Der Pi-only-Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt; Pi-Tool-Ergebnis-Transformationen müssen Runtime-neutrale Middleware verwenden.

### Terminale Ergebnisklassifizierung

Native Harnesses, die ihre eigene Protokollprojektion besitzen, können `classifyAgentHarnessTerminalOutcome(...)` aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder `planning-only` zurück, damit die Fallback-Richtlinie von OpenClaw entscheiden kann, ob auf einem anderen Modell erneut versucht werden soll. Er lässt Prompt-Fehler, laufende Turns und beabsichtigte stille Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Nativer Codex-Harness-Modus

Der gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-Agenten-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in `plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-Konfigurationen sollten `openai/gpt-*` verwenden; OpenAI-Agenten-Turns wählen standardmäßig den Codex-Harness. Legacy-Routen `openai-codex/*` sollten mit `openclaw doctor --fix` repariert werden, und Legacy-Modellreferenzen `codex/*` bleiben Kompatibilitätsaliase für den nativen Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten, Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chatkanal, den sichtbaren Transkriptspiegel, die Tool-Richtlinie, Genehmigungen, Medienauslieferung und Session-Auswahl. Verwenden Sie Provider/Modell `agentRuntime.id: "codex"`, wenn Sie nachweisen müssen, dass nur der Codex-App-Server-Pfad den Lauf beanspruchen kann. Explizite Plugin-Runtimes schlagen geschlossen fehl; Codex-App-Server-Auswahlfehler und Runtime-Fehler werden nicht über Pi erneut versucht.

## Runtime-Striktheit

Standardmäßig verwendet OpenClaw die Provider-/Modell-Runtime-Richtlinie `auto`: Registrierte Plugin-Harnesses können ein Provider-/Modellpaar beanspruchen, und Pi verarbeitet den Turn, wenn keines passt. OpenAI-Agentenreferenzen beim offiziellen OpenAI-Provider verwenden standardmäßig Codex. Verwenden Sie eine explizite Provider-/Modell-Plugin-Runtime wie `agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll, statt über Pi geroutet zu werden. Ausfälle ausgewählter Plugin-Harnesses schlagen immer hart fehl. Dies blockiert keine explizite Provider-/Modell-Konfiguration `agentRuntime.id: "pi"`.

Für Codex-only-eingebettete Läufe:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

Wenn Sie ein CLI-Backend für ein kanonisches Modell wünschen, legen Sie die Runtime auf diesen Modelleintrag:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Pro-Agent-Overrides verwenden dieselbe modellbezogene Form:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Legacy-Beispiele für Runtime-Konfigurationen auf Ebene des gesamten Agenten wie dieses werden ignoriert:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Mit einer expliziten Plugin-Runtime schlägt eine Session früh fehl, wenn der angeforderte Harness nicht registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder fehlschlägt, bevor Turn-Seiteneffekte erzeugt wurden. Das ist für Codex-only-Deployments und für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur den eingebetteten Agent Harness. Sie deaktiviert kein bild-, video-, musik-, TTS-, PDF- oder anderes Provider-spezifisches Modellrouting.

## Native Sessions und Transkriptspiegel

Ein Harness kann eine native Session-ID, Thread-ID oder ein Resume-Token auf Daemon-Seite behalten. Halten Sie diese Bindung explizit mit der OpenClaw-Session verknüpft und spiegeln Sie nutzersichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanalsichtbaren Session-Verlauf
- Transkriptsuche und Indexierung
- Wechsel zurück zum eingebauten Pi-Harness in einem späteren Turn
- generisches Verhalten für `/new`, `/reset` und Session-Löschung

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie löschen kann, wenn die besitzende OpenClaw-Session zurückgesetzt wird.

## Tool- und Medienergebnisse

Core erstellt die OpenClaw-Toolliste und übergibt sie an den vorbereiteten Versuch. Wenn ein Harness einen dynamischen Tool-Call ausführt, geben Sie das Tool-Ergebnis über die Harness-Ergebnisform zurück, statt selbst Kanalmedien zu senden.

So bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben auf demselben Auslieferungspfad wie Pi-gestützte Läufe.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Attempt-/Result-Typaliase tragen aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins, bis Sie eine native Session-Runtime benötigen.
- Harness-Wechsel werden über Turns hinweg unterstützt. Wechseln Sie Harnesses nicht mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistententext oder Nachrichtensendungen begonnen haben.

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview)
- [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
