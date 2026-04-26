---
read_when:
    - Sie ändern die eingebettete Agenten-Laufzeit oder die Harness-Registrierung.
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin.
    - Sie müssen verstehen, wie sich das Codex-Plugin auf Modellanbieter bezieht.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den Low-Level-Executor des eingebetteten Agenten ersetzen
title: Plugins für das Agent-Harness
x-i18n:
    generated_at: "2026-04-26T11:35:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agenten-Turn. Es ist kein Modellanbieter, kein Kanal und keine Tool-Registrierung.
Für das nutzerseitige mentale Modell siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
noch experimentell, weil die Parametertypen absichtlich die aktuelle
eingebettete Laufzeit spiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie ihre eigene native Sitzungs-
Laufzeit hat und der normale OpenClaw-Anbietertransport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction verwaltet
- eine lokale CLI oder ein Daemon, der native Planungs-/Reasoning-/Tool-Ereignisse streamen muss
- eine Modell-Laufzeit, die zusätzlich zum OpenClaw-
  Sitzungstranskript ihre eigene Resume-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Anbieter-Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin verwaltet

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Anbieter und Modell
- Laufzeit-Authentifizierungsstatus
- Denkstufe und Kontextbudget
- das OpenClaw-Transkript bzw. die Sitzungsdatei
- Workspace, Sandbox und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback- und Richtlinie für Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine
Anbieter aus, ersetzt nicht die Kanalauslieferung und wechselt nicht stillschweigend Modelle.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein von OpenClaw verwaltetes
Richtlinienbündel für Laufzeitentscheidungen, das über PI und native
Harnesses hinweg gemeinsam genutzt werden muss:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für anbieterspezifische Tool-Schema-Richtlinien
- `runtimePlan.transcript.resolvePolicy(...)` für Transkript-Bereinigung und
  Richtlinien zur Reparatur von Tool-Aufrufen
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsam genutzte `NO_REPLY`- und Medien-
  Auslieferungsunterdrückung
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung von Modell-Fallbacks
- `runtimePlan.observability` für aufgelöste Anbieter-/Modell-/Harness-Metadaten

Harnesses können den Plan für Entscheidungen verwenden, die mit dem PI-Verhalten übereinstimmen müssen,
sollten ihn aber weiterhin als hostseitigen Versuchsstatus behandeln. Verändern Sie ihn nicht und verwenden Sie ihn nicht, um
innerhalb eines Turns Anbieter/Modelle zu wechseln.

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

## Auswahlrichtlinie

OpenClaw wählt ein Harness nach der Auflösung von Anbieter/Modell aus:

1. Die aufgezeichnete Harness-ID einer vorhandenen Sitzung hat Vorrang, damit Konfigurations-/Umgebungsänderungen
   dieses Transkript nicht per Hot-Switch auf eine andere Laufzeit umstellen.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt für
   Sitzungen, die noch nicht angeheftet sind, ein registriertes Harness mit dieser ID.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das integrierte PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Anbieter/das aufgelöste Modell unterstützen.
5. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback nicht
   deaktiviert ist.

Fehler von Plugin-Harnesses werden als Ausführungsfehler angezeigt. Im `auto`-Modus wird PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness den aufgelösten
Anbieter/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung beansprucht hat, führt OpenClaw
denselben Turn nicht noch einmal über PI aus, weil das Authentifizierungs-/Laufzeitsemantik ändern
oder Seiteneffekte duplizieren kann.

Die ausgewählte Harness-ID wird nach einer eingebetteten Ausführung zusammen mit der Sitzungs-ID persistiert.
Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als an PI angeheftet behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie eine neue/zurückgesetzte Sitzung, wenn Sie zwischen PI und einem
nativen Plugin-Harness wechseln. `/status` zeigt nicht standardmäßige Harness-IDs wie `codex`
neben `Fast` an; PI bleibt ausgeblendet, weil es der standardmäßige Kompatibilitätspfad ist.
Wenn das ausgewählte Harness überraschend ist, aktivieren Sie das Debug-Logging für `agents/harness` und
prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und im
`auto`-Modus das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt das
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören ins Plugin
oder in die Operator-Konfiguration, nicht in den gemeinsamen Laufzeitselektor.

## Paarung von Anbieter und Harness

Die meisten Harnesses sollten auch einen Anbieter registrieren. Der Anbieter macht Modell-Referenzen,
Authentifizierungsstatus, Modell-Metadaten und die Auswahl über `/model` für den Rest von
OpenClaw sichtbar. Das Harness beansprucht dann diesen Anbieter in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Nutzer-Modell-Referenzen: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- Kompatibilitätsreferenzen: Legacy-Referenzen `codex/gpt-*` bleiben akzeptiert, aber neue
  Konfigurationen sollten sie nicht als normale Anbieter-/Modell-Referenzen verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Anbieterverfügbarkeit, weil das Codex-Harness den
  nativen Codex-Login/die native Codex-Sitzung verwaltet
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und überlässt dem
  Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Reine `openai/gpt-*`-Referenzen verwenden weiterhin den
normalen OpenClaw-Anbieterpfad, sofern Sie das Codex-Harness nicht mit
`agentRuntime.id: "codex"` erzwingen. Ältere Referenzen `codex/gpt-*` wählen aus
Kompatibilitätsgründen weiterhin den Codex-Anbieter und das Codex-Harness aus.

Für die Operator-Einrichtung, Beispiele für Modellpräfixe und reine Codex-Konfigurationen siehe
[Codex-Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft den
Initialize-Handshake des App-Servers und blockiert ältere oder versionslose Server, damit
OpenClaw nur gegen die Protokolloberfläche ausgeführt wird, mit der es getestet wurde. Die
Untergrenze `0.125.0` umfasst die Unterstützung für native MCP-Hook-Payloads, die in
Codex `0.124.0` eingeführt wurde, während OpenClaw auf die neuere getestete stabile Linie festgelegt wird.

### Middleware für Tool-Ergebnisse

Gebündelte Plugins können über
`api.registerAgentToolResultMiddleware(...)` laufzeitneutrale Middleware für Tool-Ergebnisse anhängen, wenn
ihr Manifest die Ziel-Laufzeit-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Transformationen von Tool-Ergebnissen gedacht, die ausgeführt werden müssen, bevor PI oder Codex
die Tool-Ausgabe an das Modell zurückgeben.

Legacy-gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die nur für den Codex-App-Server gilt,
aber neue Ergebnis-Transformationen sollten die laufzeitneutrale API verwenden.
Der nur für Pi verfügbare Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt;
Pi-Transformationen von Tool-Ergebnissen müssen laufzeitneutrale Middleware verwenden.

### Klassifizierung terminaler Ergebnisse

Native Harnesses, die ihre eigene Protokollprojektion verwalten, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistant-Text erzeugt hat. Die Hilfsfunktion gibt `empty`, `reasoning-only` oder
`planning-only` zurück, damit OpenClaw anhand seiner Fallback-Richtlinie entscheiden kann, ob ein erneuter Versuch mit
einem anderen Modell erfolgen soll. Prompt-Fehler, laufende Turns und
beabsichtigt stille Antworten wie `NO_REPLY` werden absichtlich nicht klassifiziert.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agenten-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und fügen Sie `codex` in
`plugins.allow` ein, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` mit `agentRuntime.id: "codex"` verwenden.
Verwenden Sie stattdessen `openai-codex/*` für Codex OAuth über PI. Legacy-Referenzen `codex/*`
bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus ausgeführt wird, verwaltet Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die Ausführung des App-Servers. OpenClaw verwaltet weiterhin den Chat-Kanal,
den sichtbaren Transkriptspiegel, die Tool-Richtlinie, Genehmigungen, Medienauslieferung und die Sitzungs-
auswahl. Verwenden Sie `agentRuntime.id: "codex"` ohne `fallback`-Override,
wenn Sie nachweisen müssen, dass nur der Codex-App-Server-Pfad die Ausführung beanspruchen kann.
Explizite Plugin-Laufzeiten schlagen standardmäßig bereits mit geschlossenem Fehlerbild fehl. Setzen Sie `fallback: "pi"`
nur dann, wenn Sie absichtlich möchten, dass PI eine fehlende Harness-Auswahl behandelt. Fehler des Codex-
App-Servers schlagen bereits direkt fehl, anstatt erneut über PI versucht zu werden.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agenten mit `agents.defaults.agentRuntime`
auf `{ id: "auto", fallback: "pi" }` aus. Im `auto`-Modus können registrierte Plugin-
Harnesses ein Anbieter-/Modell-Paar beanspruchen. Wenn keines passt, fällt OpenClaw auf
PI zurück.

Setzen Sie im `auto`-Modus `fallback: "none"`, wenn eine fehlende Plugin-Harness-
Auswahl fehlschlagen soll, anstatt PI zu verwenden. Explizite Plugin-Laufzeiten wie
`runtime: "codex"` schlagen standardmäßig bereits mit geschlossenem Fehlerbild fehl, es sei denn, `fallback: "pi"` ist
im selben Konfigurations- oder Umgebungs-Override-Bereich gesetzt. Fehler ausgewählter Plugin-Harnesses
schlagen immer hart fehl. Dies blockiert kein explizites `runtime: "pi"` oder
`OPENCLAW_AGENT_RUNTIME=pi`.

Für reine Codex-Einbettungsausführungen:

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

Wenn Sie möchten, dass jedes registrierte Plugin-Harness passende Modelle beanspruchen kann, aber niemals
möchten, dass OpenClaw stillschweigend auf PI zurückfällt, behalten Sie `runtime: "auto"` bei und deaktivieren Sie
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

Pro-Agent-Overrides verwenden dieselbe Form:

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

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Laufzeit. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback aus der
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt eine Sitzung frühzeitig fehl, wenn das angeforderte Harness nicht
registriert ist, den aufgelösten Anbieter/das aufgelöste Modell nicht unterstützt oder fehlschlägt, bevor
Turn-Seiteneffekte erzeugt werden. Das ist für reine Codex-Bereitstellungen und
für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht
anbieterbezogenes Modell-Routing für Bilder, Videos, Musik, TTS, PDF oder andere modellspezifische Routen.

## Native Sitzungen und Transkriptspiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token verwalten.
Halten Sie diese Bindung explizit der OpenClaw-Sitzung zugeordnet und spiegeln Sie
für Nutzer sichtbare Assistant-/Tool-Ausgaben weiter in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- im Kanal sichtbaren Sitzungsverlauf
- Transkriptsuche und Indizierung
- den späteren Wechsel zurück zum integrierten PI-Harness
- generisches Verhalten von `/new`, `/reset` und Sitzungs-Löschung

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisform des Harness zurück, anstatt Kanalmedien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Auslieferungspfad wie bei durch PI gestützten Ausführungen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Alias-Typen für Versuch/Ergebnis tragen
  aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Anbieter-Plugins,
  bis Sie eine native Sitzungs-Laufzeit benötigen.
- Das Wechseln von Harnesses über mehrere Turns hinweg wird unterstützt. Wechseln Sie Harnesses nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistant-Text oder Nachrichten-
  sendungen begonnen haben.

## Verwandte Themen

- [SDK-Überblick](/de/plugins/sdk-overview)
- [Laufzeit-Helfer](/de/plugins/sdk-runtime)
- [Anbieter-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modellanbieter](/de/concepts/model-providers)
