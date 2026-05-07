---
read_when:
    - Sie ändern die eingebettete Agent-Laufzeitumgebung oder die Harness-Registry
    - Sie registrieren einen Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-05-07T13:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-Turn. Er ist kein Modell-Provider, kein Kanal und keine Tool-Registry. Zum benutzerorientierten mentalen Modell siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist noch experimentell, weil die Parametertypen bewusst den aktuellen eingebetteten Runner widerspiegeln.

## Wann Sie ein Harness verwenden sollten

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie ihre eigene native Sitzungs-Runtime hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction besitzt
- eine lokale CLI oder ein Daemon, der native Planungs-/Reasoning-/Tool-Events streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-Sitzungstranskript ihre eigene Resume-ID benötigt

Registrieren Sie **kein** Harness nur, um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Auth-Status
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Workspace, Sandbox und Tool-Policy
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback und Policy für Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine Provider aus, ersetzt keine Kanalauslieferung und wechselt Modelle nicht stillschweigend.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein OpenClaw-eigenes Policy-Bundle für Runtime-Entscheidungen, die zwischen PI und nativen Harnesses gemeinsam bleiben müssen:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für Provider-bewusste Tool-Schema-Policy
- `runtimePlan.transcript.resolvePolicy(...)` für Transkriptbereinigung und
  Tool-Call-Reparatur-Policy
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsames `NO_REPLY` und Unterdrückung der Medienauslieferung
- `runtimePlan.outcome.classifyRunResult(...)` für Modell-Fallback-Klassifizierung
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses dürfen den Plan für Entscheidungen verwenden, die dem PI-Verhalten entsprechen müssen, sollten ihn aber weiterhin als host-eigenen Versuchszustand behandeln. Mutieren Sie ihn nicht und verwenden Sie ihn nicht, um innerhalb eines Turns Provider/Modelle zu wechseln.

## Ein Harness registrieren

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

## Auswahl-Policy

OpenClaw wählt nach der Provider-/Modellauflösung ein Harness aus:

1. Die aufgezeichnete Harness-ID einer vorhandenen Sitzung gewinnt, sodass Config-/Env-Änderungen dieses Transkript nicht per Hot-Switch auf eine andere Runtime umstellen.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt für noch nicht angeheftete Sitzungen ein registriertes Harness mit dieser ID.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das eingebaute PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den aufgelösten Provider/das aufgelöste Modell unterstützen.
5. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback nicht deaktiviert ist.

Plugin-Harness-Fehler erscheinen als Ausführungsfehler. Im Modus `auto` wird der PI-Fallback nur verwendet, wenn kein registriertes Plugin-Harness den aufgelösten Provider/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw denselben Turn nicht erneut über PI ab, weil das Auth-/Runtime-Semantik ändern oder Nebeneffekte duplizieren kann.

Die ausgewählte Harness-ID wird nach einem eingebetteten Lauf mit der Sitzungs-ID persistiert. Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie Transkripthistorie haben. Verwenden Sie eine neue/zurückgesetzte Sitzung, wenn Sie zwischen PI und einem nativen Plugin-Harness wechseln. `/status` zeigt nicht standardmäßige Harness-IDs wie `codex` neben `Fast` an; PI bleibt verborgen, weil es der standardmäßige Kompatibilitätspfad ist. Wenn das ausgewählte Harness überraschend ist, aktivieren Sie das Debug-Logging für `agents/harness` und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Policy und im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Core behandelt dies als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin oder die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selektor.

## Provider-plus-Harness-Kopplung

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modell-Refs, Auth-Status, Modellmetadaten und `/model`-Auswahl für den Rest von OpenClaw sichtbar. Das Harness beansprucht diesen Provider dann in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Benutzer-Modell-Refs: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- Kompatibilitäts-Refs: Legacy-Refs `codex/gpt-*` werden weiterhin akzeptiert, aber neue Configs sollten sie nicht als normale Provider-/Modell-Refs verwenden
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil das Codex-Harness den nativen Codex-Login/die native Codex-Sitzung besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und überlässt dem Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Reine `openai/gpt-*`-Refs verwenden weiterhin den normalen OpenClaw-Provider-Pfad, sofern Sie nicht mit `agentRuntime.id: "codex"` das Codex-Harness erzwingen. Ältere `codex/gpt-*`-Refs wählen aus Kompatibilitätsgründen weiterhin den Codex-Provider und das Codex-Harness aus.

Für Operator-Setup, Beispiele für Modellpräfixe und Codex-only-Configs siehe [Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft den App-Server-Initialize-Handshake und blockiert ältere oder unversionierte Server, damit OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde. Die Untergrenze `0.125.0` enthält die native MCP-Hook-Payload-Unterstützung, die in Codex `0.124.0` gelandet ist, während OpenClaw auf die neuere getestete stabile Linie gepinnt wird.

### Tool-Ergebnis-Middleware

Gebündelte Plugins können über `api.registerAgentToolResultMiddleware(...)` runtime-neutrale Tool-Ergebnis-Middleware anhängen, wenn ihr Manifest die Ziel-Runtime-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige Schnittstelle ist für asynchrone Tool-Ergebnis-Transformationen gedacht, die laufen müssen, bevor PI oder Codex Tool-Ausgaben zurück in das Modell einspeisen.

Legacy-gebündelte Plugins können weiterhin `api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die nur für den Codex-App-Server gilt, aber neue Ergebnis-Transformationen sollten die runtime-neutrale API verwenden. Der nur für Pi geltende Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt; Pi-Tool-Ergebnis-Transformationen müssen runtime-neutrale Middleware verwenden.

### Klassifizierung terminaler Ergebnisse

Native Harnesses, die ihre eigene Protokollprojektion besitzen, können `classifyAgentHarnessTerminalOutcome(...)` aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen sichtbaren Assistant-Text erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder `planning-only` zurück, damit die Fallback-Policy von OpenClaw entscheiden kann, ob sie mit einem anderen Modell erneut versuchen soll. Er lässt Prompt-Fehler, laufende Turns und absichtlich stille Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-Agent-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in `plugins.allow` auf, wenn Ihre Config eine restriktive Allowlist verwendet. Native App-Server-Configs sollten `openai/gpt-*` verwenden; OpenAI-Agent-Turns wählen standardmäßig das Codex-Harness aus. Legacy-Routen `openai-codex/*` sollten mit `openclaw doctor --fix` repariert werden, und Legacy-Modell-Refs `codex/*` bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten, Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chat-Kanal, den sichtbaren Transkriptspiegel, die Tool-Policy, Genehmigungen, Medienauslieferung und Sitzungsauswahl. Verwenden Sie `agentRuntime.id: "codex"`, wenn Sie nachweisen müssen, dass nur der Codex-App-Server-Pfad den Lauf beanspruchen kann. Explizite Plugin-Runtimes schlagen geschlossen fehl; Codex-App-Server-Auswahlfehler und Runtime-Fehler werden nicht über PI erneut versucht.

## Runtime-Striktheit

Standardmäßig führt OpenClaw eingebettete Agenten mit OpenClaw Pi aus. Im Modus `auto` können registrierte Plugin-Harnesses ein Provider-/Modellpaar beanspruchen, und PI übernimmt den Turn, wenn keines passt. Verwenden Sie eine explizite Plugin-Runtime wie `agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll, statt über PI geroutet zu werden. Fehler ausgewählter Plugin-Harnesses schlagen immer hart fehl. Dies blockiert kein explizites `agentRuntime.id: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi`.

Für eingebettete Codex-only-Läufe:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Wenn Sie möchten, dass jedes registrierte Plugin-Harness passende Modelle beansprucht und andernfalls PI verwendet wird, setzen Sie `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Pro-Agent-Overrides verwenden dieselbe Form:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Runtime.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Mit einer expliziten Plugin-Runtime schlägt eine Sitzung früh fehl, wenn das angeforderte Harness nicht registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder fehlschlägt, bevor es Turn-Nebeneffekte erzeugt. Das ist für Codex-only-Bereitstellungen und für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert kein image-, video-, music-, TTS-, PDF- oder anderes Provider-spezifisches Modell-Routing.

## Native Sitzungen und Transkriptspiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein Daemon-seitiges Resume-Token behalten. Halten Sie diese Bindung ausdrücklich mit der OpenClaw-Sitzung verknüpft und spiegeln Sie weiterhin benutzersichtbare Assistant-/Tool-Ausgaben in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanalsichtbare Sitzungshistorie
- Transkriptsuche und Indexierung
- späterer Wechsel zurück zum eingebauten PI-Harness
- generisches Verhalten für `/new`, `/reset` und Sitzungs-Löschung

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie löschen kann, wenn die besitzende OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch. Wenn ein Harness einen dynamischen Tool-Call ausführt, geben Sie das Tool-Ergebnis über die Ergebnisform des Harnesses zurück, statt Kanalmedien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben auf demselben Auslieferungspfad wie PI-gestützte Läufe.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Typaliasse für Versuch/Ergebnis
  tragen aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Harnesses von Drittanbietern ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Runtime benötigen.
- Das Wechseln des Harnesses wird über Turns hinweg unterstützt. Wechseln Sie den Harness nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistententext oder Nachrichtenversand
  begonnen haben.

## Verwandte Themen

- [SDK-Überblick](/de/plugins/sdk-overview)
- [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
