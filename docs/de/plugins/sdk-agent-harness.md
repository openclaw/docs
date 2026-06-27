---
read_when:
    - Sie ändern die eingebettete Agent-Laufzeitumgebung oder die Harness-Registry
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den Low-Level-Executor für eingebettete Agenten ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-06-27T17:58:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agentenlauf. Er ist kein Modell-Provider, kein Channel und keine Tool-Registry.
Das nutzerseitige mentale Modell finden Sie unter [Agent-Runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
noch experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner spiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie einen Agent-Harness, wenn eine Modellfamilie ihre eigene native Session-Runtime hat
und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction besitzt
- eine lokale CLI oder ein Daemon, der native Planungs-, Reasoning- und Tool-Ereignisse streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-Session-Transkript ihre eigene Resume-ID benötigt

Registrieren Sie **keinen** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Auth-Status
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Session-Datei
- Workspace, Sandbox und Tool-Richtlinie
- Channel-Reply-Callbacks und Streaming-Callbacks
- Modell-Fallback und Richtlinie für Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; er wählt keine
Provider aus, ersetzt keine Channel-Zustellung und wechselt Modelle nicht stillschweigend.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein OpenClaw-eigenes
Richtlinienbündel für Runtime-Entscheidungen, die zwischen OpenClaw und nativen
Harnesses geteilt bleiben müssen:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für Provider-bewusste Tool-Schema-Richtlinien
- `runtimePlan.transcript.resolvePolicy(...)` für Transkriptbereinigung und
  Richtlinien zur Reparatur von Tool-Calls
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsame `NO_REPLY`- und Medienunterdrückung
  bei der Zustellung
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung von Modell-Fallbacks
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses dürfen den Plan für Entscheidungen verwenden, die dem OpenClaw-Verhalten entsprechen müssen, sollten
ihn aber weiterhin als hosteigenen Versuchszustand behandeln. Mutieren Sie ihn nicht und verwenden Sie ihn nicht,
um Provider/Modelle innerhalb eines Laufs zu wechseln.

## Harness registrieren

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

OpenClaw wählt einen Harness nach der Provider-/Modellauflösung aus:

1. Modellbezogene Runtime-Richtlinie gewinnt.
2. Providerbezogene Runtime-Richtlinie kommt als Nächstes.
3. `auto` fragt registrierte Harnesses, ob sie den aufgelösten
   Provider/das aufgelöste Modell unterstützen.
4. Wenn kein registrierter Harness passt, verwendet OpenClaw seine eingebettete Runtime.

Fehler von Plugin-Harnesses erscheinen als Laufzeitfehler. Im Modus `auto` wird der eingebettete Fallback
nur verwendet, wenn kein registrierter Plugin-Harness den aufgelösten
Provider/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw
denselben Lauf nicht über eine andere Runtime erneut ab, weil das
Auth-/Runtime-Semantik ändern oder Seiteneffekte duplizieren kann.

Runtime-Pins für ganze Sessions und ganze Agenten werden von der Auswahl ignoriert. Dazu gehören
veraltete Session-Werte `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` und `OPENCLAW_AGENT_RUNTIME`. `/status` zeigt die
effektive Runtime, die aus der Provider-/Modellroute ausgewählt wurde.
Wenn der ausgewählte Harness überraschend ist, aktivieren Sie das Debug-Logging `agents/harness` und
prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im
Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Core behandelt diese
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder in die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selector.

## Provider- und Harness-Kopplung

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen,
Auth-Status, Modellmetadaten und `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Der Harness beansprucht diesen Provider dann in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Nutzermodellreferenzen: `openai/gpt-5.5`
- Kompatibilitätsreferenzen: ältere `codex/gpt-*`-Referenzen bleiben akzeptiert, neue
  Konfigurationen sollten sie aber nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil der Codex-Harness den
  nativen Codex-Login/die native Codex-Session besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt den
  Harness mit dem nativen App-Server-Protokoll sprechen

Das Codex-Plugin ist additiv. Einfache `openai/gpt-*`-Agentenreferenzen beim offiziellen
OpenAI-Provider wählen standardmäßig den Codex-Harness aus. Ältere `codex/gpt-*`-Referenzen
wählen weiterhin aus Kompatibilitätsgründen den Codex-Provider und -Harness aus.

Operator-Setup, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex-Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft
den App-Server-Initialize-Handshake und blockiert ältere oder nicht versionierte Server, sodass
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde. Die
Mindestversion `0.125.0` enthält die Unterstützung für native MCP-Hook-Payloads, die in
Codex `0.124.0` gelandet ist, während OpenClaw an die neuere getestete stabile Linie gebunden wird.

### Tool-Result-Middleware

Gebündelte Plugins und explizit aktivierte installierte Plugins mit passenden Manifest-Verträgen
können über `api.registerAgentToolResultMiddleware(...)` Runtime-neutrale Tool-Result-Middleware
anhängen, wenn ihr Manifest die
zielgerichteten Runtime-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Tool-Result-Transformationen gedacht, die ausgeführt werden müssen, bevor OpenClaw oder Codex
Tool-Ausgaben zurück in das Modell einspeist.

Ältere gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die nur für den Codex-App-Server gilt,
aber neue Ergebnis-Transformationen sollten die Runtime-neutrale API verwenden.
Der nur für den eingebetteten Runner bestimmte Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt;
eingebettete Tool-Result-Transformationen müssen Runtime-neutrale Middleware verwenden.

### Klassifizierung terminaler Ergebnisse

Native Harnesses, die ihre eigene Protokollprojektion besitzen, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Lauf keinen
sichtbaren Assistant-Text erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, sodass OpenClaws Fallback-Richtlinie entscheiden kann, ob mit einem
anderen Modell erneut versucht werden soll. `planning-only` erfordert das explizite Feld `planText`
des Harness; OpenClaw leitet es nicht aus Assistant-Prosa ab. Der Helper lässt absichtlich
Prompt-Fehler, laufende Turns und absichtliche stille Antworten wie
`NO_REPLY` unklassifiziert.

### Agent-End-Seiteneffekte

Native Harnesses müssen `runAgentEndSideEffects(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` aufrufen, nachdem sie einen Versuch abgeschlossen haben. Es
löst den portablen Hook `agent_end` und OpenClaws Research-Capture aus, ohne
interaktive Antworten zu verzögern. Verwenden Sie `awaitAgentEndSideEffects(...)` für lokale,
nicht interaktive Läufe, bei denen der Versuch nicht abgeschlossen werden darf, bis diese Seiteneffekte
beendet sind. Beide Helper akzeptieren dasselbe Payload `{ event, ctx }` wie
`runAgentHarnessAgentEndHook(...)`; ihre Fehler ändern das abgeschlossene
Versuchsergebnis nicht.

### Nutzereingaben und Tool-Oberflächen

Native Harnesses, die eine Nutzereingabeanfrage auf Runtime-Ebene bereitstellen, sollten die
Nutzereingabe-Helper aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, um
den Prompt zu formatieren, ihn über OpenClaws blockierenden Antwortpfad zuzustellen und
Auswahl-/Freiformantworten zurück in die native Antwortform der Runtime zu normalisieren. Der
Helper hält die Channel-/TUI-Darstellung konsistent, während jeder Harness sein
eigenes Protokoll-Parsing und den Lifecycle ausstehender Anfragen behält.

Native Harnesses, die PI-ähnliches kompaktes Tool-Routing benötigen, sollten
`createAgentHarnessToolSurfaceRuntime(...)` aus
`openclaw/plugin-sdk/agent-harness-tool-runtime` verwenden. Es besitzt
Tool-Search-/Code-Mode-Steuerungsauswahl, schlanke Defaults für lokale Modelle,
Runtime-kompatible Schemafilterung, versteckte Katalogausführung, Verzeichnishydratisierung
und Katalogbereinigung. Harnesses besitzen weiterhin ihre SDK-spezifische Tool-Konvertierung
und den nativen Ausführungs-Callback.

### Nativer Codex-Harness-Modus

Der gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agentenläufe. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` verwenden; OpenAI-Agentenläufe wählen standardmäßig den Codex-Harness
aus. Ältere Codex-Modellreferenzrouten sollten mit
`openclaw doctor --fix` repariert werden, und ältere `codex/*`-Modellreferenzen bleiben Kompatibilitäts-
Aliasse für den nativen Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chat-Channel,
den sichtbaren Transkriptspiegel, die Tool-Richtlinie, Freigaben, Medienzustellung und Session-
Auswahl. Verwenden Sie Provider-/Modell-`agentRuntime.id: "codex"`, wenn Sie nachweisen müssen,
dass nur der Codex-App-Server-Pfad den Lauf beanspruchen kann. Explizite Plugin-Runtimes
schlagen geschlossen fehl; Auswahlfehler des Codex-App-Servers und Runtime-Fehler werden nicht
über eine andere Runtime erneut versucht.

## Runtime-Strenge

Standardmäßig verwendet OpenClaw die Provider-/Modell-Runtime-Richtlinie `auto`: registrierte
Plugin-Harnesses können ein Provider-/Modellpaar beanspruchen, und die eingebettete Runtime
verarbeitet den Lauf, wenn keines passt. OpenAI-Agentenreferenzen beim offiziellen OpenAI-Provider verwenden standardmäßig Codex.
Verwenden Sie eine explizite Provider-/Modell-Plugin-Runtime wie
`agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll,
statt über die eingebettete Runtime geroutet zu werden. Fehler ausgewählter Plugin-Harnesses
schlagen immer hart fehl. Dies blockiert kein explizites Provider-/Modell-`agentRuntime.id: "openclaw"`.

Für reine Codex-Embedded-Läufe:

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

Wenn Sie ein CLI-Backend für ein kanonisches Modell möchten, legen Sie die Runtime auf diesen
Modelleintrag:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Agentenspezifische Overrides verwenden dieselbe modellbezogene Form:

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

Ältere Beispiele für Runtime-Konfigurationen auf Ebene des ganzen Agenten wie dieses werden ignoriert:

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

Mit einer expliziten Plugin-Runtime schlägt eine Sitzung früh fehl, wenn das angeforderte
Harness nicht registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder
fehlschlägt, bevor Turn-Seiteneffekte erzeugt werden. Das ist für reine Codex-
Bereitstellungen und für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad
tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht
Bild-, Video-, Musik-, TTS-, PDF- oder anderes Provider-spezifisches Modell-Routing.

## Native Sitzungen und Transcript-Spiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halten Sie diese Bindung ausdrücklich mit der OpenClaw-Sitzung verknüpft, und spiegeln Sie
für Benutzer sichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-Transcript.

Das OpenClaw-Transcript bleibt die Kompatibilitätsschicht für:

- kanal sichtbaren Sitzungsverlauf
- Transcript-Suche und -Indexierung
- Wechsel zurück zum integrierten OpenClaw-Harness in einem späteren Turn
- generisches `/new`-, `/reset`- und Sitzungslöschverhalten

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisstruktur des Harness zurück, statt selbst Kanalmedien zu senden.

So bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Auslieferungspfad wie OpenClaw-gestützte Läufe.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Attempt-/Result-Typaliases tragen aus Kompatibilitätsgründen noch
  Legacy-Namen.
- Die Installation von Harnesses von Drittanbietern ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Runtime benötigen.
- Harness-Wechsel werden turnübergreifend unterstützt. Wechseln Sie Harnesses nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistententext oder Nachrichtenversand
  begonnen haben.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Runtime-Helfer](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
