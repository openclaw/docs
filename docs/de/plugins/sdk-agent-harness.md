---
read_when:
    - Sie ändern die eingebettete Agent-Laufzeit oder die Harness-Registry
    - Sie registrieren einen Agent-Harness aus einem mitgelieferten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Plugins für die Agenten-Ausführungsumgebung
x-i18n:
    generated_at: "2026-05-02T06:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-
Turn. Er ist kein Modell-Provider, kein Kanal und keine Tool-Registry.
Zum nutzerseitigen mentalen Modell siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
noch experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner spiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie einen Agent-Harness, wenn eine Modellfamilie ihre eigene native Session-
Runtime hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction besitzt
- eine lokale CLI oder ein Daemon, der native Plan-/Reasoning-/Tool-Ereignisse streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-
  Session-Transkript ihre eigene Resume-ID benötigt

Registrieren Sie **keinen** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Authentifizierungsstatus
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Session-Datei
- Workspace, Sandbox und Tool-Policy
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback und Live-Modellwechsel-Policy

Diese Trennung ist absichtlich. Ein Harness führt einen vorbereiteten Versuch aus; er wählt keine
Provider aus, ersetzt keine Kanalzustellung und wechselt Modelle nicht stillschweigend.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein OpenClaw-eigenes
Policy-Bundle für Runtime-Entscheidungen, die über PI und native
Harnesses hinweg gemeinsam bleiben müssen:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für Provider-bewusste Tool-Schema-Policy
- `runtimePlan.transcript.resolvePolicy(...)` für Transkript-Bereinigung und
  Tool-Call-Reparatur-Policy
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsame `NO_REPLY`- und Medien-
  Zustellunterdrückung
- `runtimePlan.outcome.classifyRunResult(...)` für Modell-Fallback-Klassifizierung
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses können den Plan für Entscheidungen verwenden, die dem PI-Verhalten entsprechen
müssen, sollten ihn aber weiterhin als hosteigenen Versuchszustand behandeln. Mutieren Sie ihn nicht und verwenden Sie ihn nicht,
um innerhalb eines Turns Provider/Modelle zu wechseln.

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

## Auswahl-Policy

OpenClaw wählt nach der Provider-/Modellauflösung einen Harness aus:

1. Die aufgezeichnete Harness-ID einer vorhandenen Session gewinnt, sodass Konfigurations-/Env-Änderungen dieses Transkript nicht
   per Hot-Switch auf eine andere Runtime umstellen.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt für
   Sessions, die noch nicht gepinnt sind, einen registrierten Harness mit dieser ID.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt den integrierten PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Provider/das aufgelöste Modell unterstützen.
5. Wenn kein registrierter Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback nicht
   deaktiviert ist.

Fehler von Plugin-Harnesses werden als Ausführungsfehler angezeigt. Im `auto`-Modus wird der PI-Fallback
nur verwendet, wenn kein registrierter Plugin-Harness den aufgelösten
Provider/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw
denselben Turn nicht über PI erneut ab, weil das Auth-/Runtime-Semantik ändern
oder Seiteneffekte duplizieren kann.

Die ausgewählte Harness-ID wird nach einem eingebetteten Lauf mit der Session-ID persistiert.
Legacy-Sessions, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie eine neue/zurückgesetzte Session, wenn Sie zwischen PI und einem
nativen Plugin-Harness wechseln. `/status` zeigt nicht standardmäßige Harness-IDs wie `codex`
neben `Fast`; PI bleibt verborgen, weil es der Standardkompatibilitätspfad ist.
Wenn der ausgewählte Harness überraschend ist, aktivieren Sie `agents/harness`-Debug-Logging und
prüfen Sie den strukturierten `agent harness selected`-Eintrag des Gateways. Er enthält
die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Policy und im
`auto`-Modus das Support-Ergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Core behandelt dies
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin
oder die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selector.

## Provider- und Harness-Kopplung

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen,
Auth-Status, Modellmetadaten und `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Der Harness beansprucht diesen Provider dann in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Nutzer-Modellreferenzen: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- Kompatibilitätsreferenzen: alte `codex/gpt-*`-Referenzen bleiben akzeptiert, neue
  Konfigurationen sollten sie aber nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil der Codex-Harness den
  nativen Codex-Login/die native Codex-Session besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt den
  Harness mit dem nativen App-Server-Protokoll sprechen

Das Codex-Plugin ist additiv. Normale `openai/gpt-*`-Referenzen verwenden weiterhin den
normalen OpenClaw-Provider-Pfad, sofern Sie den Codex-Harness nicht mit
`agentRuntime.id: "codex"` erzwingen. Ältere `codex/gpt-*`-Referenzen wählen aus Kompatibilitätsgründen weiterhin den
Codex-Provider und -Harness aus.

Für Operator-Setup, Modellpräfix-Beispiele und reine Codex-Konfigurationen siehe
[Codex-Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft
den App-Server-Initialize-Handshake und blockiert ältere oder unversionierte Server, sodass
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde. Der
`0.125.0`-Mindeststand umfasst die native MCP-Hook-Payload-Unterstützung, die in
Codex `0.124.0` gelandet ist, während OpenClaw an die neuere getestete stabile Linie gepinnt wird.

### Tool-Ergebnis-Middleware

Gebündelte Plugins können Runtime-neutrale Tool-Ergebnis-Middleware über
`api.registerAgentToolResultMiddleware(...)` anhängen, wenn ihr Manifest die
anvisierten Runtime-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Nahtstelle ist für asynchrone Tool-Ergebnis-Transformationen gedacht, die ausgeführt werden müssen, bevor PI oder Codex
Tool-Ausgaben wieder in das Modell einspeisen.

Legacy-gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Codex-App-Server-only-
Middleware verwenden, aber neue Ergebnis-Transformationen sollten die Runtime-neutrale API verwenden.
Der reine Pi-Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt;
Pi-Tool-Ergebnis-Transformationen müssen Runtime-neutrale Middleware verwenden.

### Klassifizierung terminaler Ergebnisse

Native Harnesses, die ihre eigene Protokollprojektion besitzen, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, sodass OpenClaws Fallback-Policy entscheiden kann, ob mit einem
anderen Modell erneut versucht werden soll. Er lässt Prompt-Fehler, laufende Turns und
absichtliche stille Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Nativer Codex-Harness-Modus

Der gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agent-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` mit `agentRuntime.id: "codex"` verwenden.
Verwenden Sie `openai-codex/*` für Codex-OAuth über PI. Legacy-`codex/*`-
Modellreferenzen bleiben Kompatibilitätsaliase für den nativen Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chat-Kanal,
den sichtbaren Transkriptspiegel, die Tool-Policy, Genehmigungen, Medienzustellung und Session-
Auswahl. Verwenden Sie `agentRuntime.id: "codex"` ohne `fallback`-Override,
wenn Sie belegen müssen, dass nur der Codex-App-Server-Pfad den Lauf beanspruchen kann.
Explizite Plugin-Runtimes schlagen bereits standardmäßig geschlossen fehl. Setzen Sie `fallback: "pi"`
nur, wenn Sie PI absichtlich die fehlende Harness-Auswahl behandeln lassen möchten. Codex-
App-Server-Fehler schlagen bereits direkt fehl, statt über PI erneut versucht zu werden.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agents mit `agents.defaults.agentRuntime`
auf `{ id: "auto", fallback: "pi" }` gesetzt aus. Im `auto`-Modus können registrierte Plugin-
Harnesses ein Provider-/Modellpaar beanspruchen. Wenn keines passt, fällt OpenClaw auf
PI zurück.

Setzen Sie im `auto`-Modus `fallback: "none"`, wenn eine fehlende Plugin-Harness-
Auswahl fehlschlagen soll, statt PI zu verwenden. Explizite Plugin-Runtimes wie
`agentRuntime.id: "codex"` schlagen bereits standardmäßig geschlossen fehl, außer
`fallback: "pi"` ist im selben Konfigurations- oder Umgebungs-Override-Scope gesetzt.
Fehler ausgewählter Plugin-Harnesses schlagen immer hart fehl. Dies blockiert kein
explizites `agentRuntime.id: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi`.

Für reine Codex-embedded-Läufe:

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

Wenn ein registrierter Plugin-Harness passende Modelle beanspruchen darf, OpenClaw aber niemals
stillschweigend auf PI zurückfallen soll, behalten Sie `runtime: "auto"` bei und deaktivieren
den Fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Agent-spezifische Overrides verwenden dieselbe Form:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Runtime. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback über die
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Bei deaktiviertem Fallback schlägt eine Session früh fehl, wenn der angeforderte Harness nicht
registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder vor dem
Erzeugen von Turn-Seiteneffekten fehlschlägt. Das ist für reine Codex-Deployments und
für Live-Tests, die belegen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird, beabsichtigt.

Diese Einstellung steuert nur den eingebetteten Agent-Harness. Sie deaktiviert nicht
bild-, video-, musik-, TTS-, PDF- oder andere Provider-spezifische Modellweiterleitung.

## Native Sessions und Transkriptspiegel

Ein Harness kann eine native Session-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halten Sie diese Bindung explizit mit der OpenClaw-Session verknüpft und
spiegeln Sie nutzerseitig sichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanal-sichtbaren Session-Verlauf
- Transkriptsuche und Indexierung
- späteres Zurückwechseln zum integrierten PI-Harness in einem späteren Turn
- generisches Verhalten von `/new`, `/reset` und Session-Löschung

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die besitzende OpenClaw-Session zurückgesetzt wird.

## Tool- und Medienergebnisse

Core erstellt die OpenClaw-Toolliste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Toolaufruf ausführt, geben Sie das Toolergebnis über
die Ergebnisstruktur des Harness zurück, statt selbst Channel-Medien zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Auslieferungspfad wie Pi-gestützte Ausführungen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Attempt-/Result-Typaliase tragen aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Session-Runtime benötigen.
- Harness-Wechsel werden über Turns hinweg unterstützt. Wechseln Sie den Harness nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistenztext oder Nachrichtenversand
  begonnen haben.

## Verwandte Themen

- [SDK-Überblick](/de/plugins/sdk-overview)
- [Runtime-Helfer](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
