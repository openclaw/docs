---
read_when:
    - Sie ändern die eingebettete Agent-Laufzeitumgebung oder die Harness-Registry
    - Sie registrieren ein Agent-Harness aus einem mitgelieferten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Schnittstelle für Plugins, die den Low-Level-Executor für eingebettete Agenten ersetzen
title: Plugins für Agenten-Testumgebungen
x-i18n:
    generated_at: "2026-05-03T06:43:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agenten-
Turn. Er ist kein Modell-Provider, kein Kanal und keine Tool-Registry.
Zum nutzerseitigen mentalen Modell siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
noch experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner widerspiegeln.

## Wann Sie ein Harness verwenden sollten

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie ihre eigene native Sitzungs-
Laufzeit hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction besitzt
- eine lokale CLI oder ein Daemon, der native Plan-/Reasoning-/Tool-Events streamen muss
- eine Modell-Laufzeit, die zusätzlich zum OpenClaw-
  Sitzungstranskript eine eigene Resume-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Wofür Core weiterhin zuständig ist

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Authentifizierungsstatus der Laufzeit
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Workspace, Sandbox und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback und Richtlinie für Live-Modellwechsel

Diese Trennung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine
Provider aus, ersetzt keine Kanalzustellung und wechselt Modelle nicht unbemerkt.

Der vorbereitete Versuch enthält auch `params.runtimePlan`, ein OpenClaw-eigenes
Richtlinienpaket für Laufzeitentscheidungen, die über PI und native
Harnesses hinweg geteilt bleiben müssen:

- `runtimePlan.tools.normalize(...)` und
  `runtimePlan.tools.logDiagnostics(...)` für Provider-bewusste Tool-Schema-Richtlinien
- `runtimePlan.transcript.resolvePolicy(...)` für Transkriptbereinigung und
  Tool-Call-Reparaturrichtlinien
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsam genutzte `NO_REPLY`- und Medien-
  Zustellungsunterdrückung
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung von Modell-Fallbacks
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses können den Plan für Entscheidungen verwenden, die dem PI-Verhalten entsprechen müssen, sollten
ihn aber weiterhin als Host-eigenen Versuchszustand behandeln. Verändern Sie ihn nicht und verwenden Sie ihn nicht, um
innerhalb eines Turns Provider/Modelle zu wechseln.

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

OpenClaw wählt nach der Provider-/Modellauflösung ein Harness aus:

1. Die aufgezeichnete Harness-ID einer bestehenden Sitzung gewinnt, sodass Konfigurations-/Umgebungsänderungen dieses Transkript nicht
   im laufenden Betrieb auf eine andere Laufzeit umschalten.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID für
   Sitzungen, die noch nicht festgelegt sind.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das eingebaute PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Provider/das aufgelöste Modell unterstützen.
5. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern PI-Fallback nicht
   deaktiviert ist.

Fehler von Plugin-Harnesses werden als Ausführungsfehler angezeigt. Im `auto`-Modus wird PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness den aufgelösten
Provider/das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung beansprucht hat, spielt OpenClaw
denselben Turn nicht noch einmal über PI ab, weil das Authentifizierungs-/Laufzeitsemantik ändern
oder Seiteneffekte duplizieren kann.

Die ausgewählte Harness-ID wird nach einer eingebetteten Ausführung zusammen mit der Sitzungs-ID persistiert.
Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-festgelegt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie eine neue/zurückgesetzte Sitzung, wenn Sie zwischen PI und einem
nativen Plugin-Harness wechseln. `/status` zeigt nicht standardmäßige Harness-IDs wie `codex`
neben `Fast` an; PI bleibt ausgeblendet, weil es der Standard-Kompatibilitätspfad ist.
Wenn das ausgewählte Harness unerwartet ist, aktivieren Sie `agents/harness`-Debug-Logging und
prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und im
`auto`-Modus das Unterstützungsresultat jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Core behandelt dies
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin
oder in die Operatorkonfiguration, nicht in den gemeinsam genutzten Laufzeitselektor.

## Provider-plus-Harness-Kopplung

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen,
Authentifizierungsstatus, Modellmetadaten und `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Das Harness beansprucht diesen Provider dann in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Nutzer-Modellreferenzen: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- Kompatibilitätsreferenzen: Legacy-Referenzen `codex/gpt-*` bleiben akzeptiert, aber neue
  Konfigurationen sollten sie nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, weil das Codex-Harness den
  nativen Codex-Login/die native Codex-Sitzung besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt das
  Harness mit dem nativen App-Server-Protokoll kommunizieren

Das Codex-Plugin ist additiv. Reine `openai/gpt-*`-Referenzen verwenden weiterhin den
normalen OpenClaw-Provider-Pfad, sofern Sie das Codex-Harness nicht mit
`agentRuntime.id: "codex"` erzwingen. Ältere `codex/gpt-*`-Referenzen wählen aus
Kompatibilitätsgründen weiterhin den Codex-Provider und das Codex-Harness aus.

Für Operatoreinrichtung, Beispiele für Modellpräfixe und reine Codex-Konfigurationen siehe
[Codex-Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.125.0` oder neuer. Das Codex-Plugin prüft
den Initialisierungs-Handshake des App-Servers und blockiert ältere oder unversionierte Server, damit
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde. Die
Untergrenze `0.125.0` enthält die native MCP-Hook-Payload-Unterstützung, die in
Codex `0.124.0` gelandet ist, während OpenClaw an die neuere getestete stabile Linie gebunden wird.

### Tool-Result-Middleware

Gebündelte Plugins können laufzeitneutrale Tool-Result-Middleware über
`api.registerAgentToolResultMiddleware(...)` anhängen, wenn ihr Manifest die
Ziel-Laufzeit-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Tool-Result-Transformationen gedacht, die ausgeführt werden müssen, bevor PI oder Codex
Tool-Ausgaben zurück in das Modell einspeisen.

Legacy-gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für reine Codex-App-Server-
Middleware verwenden, aber neue Result-Transformationen sollten die laufzeitneutrale API verwenden.
Der reine Pi-Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt;
Pi-Tool-Result-Transformationen müssen laufzeitneutrale Middleware verwenden.

### Terminale Ergebnisklassifizierung

Native Harnesses, die ihre eigene Protokollprojektion besitzen, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, damit die Fallback-Richtlinie von OpenClaw entscheiden kann, ob ein Retry mit einem
anderen Modell erfolgen soll. Er lässt Prompt-Fehler, laufende Turns und
absichtlich stille Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agenten-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` mit `agentRuntime.id: "codex"` verwenden.
Verwenden Sie `openai-codex/*` für Codex-OAuth über PI. Legacy-`codex/*`-
Modellreferenzen bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chat-Kanal,
den sichtbaren Transkriptspiegel, die Tool-Richtlinie, Freigaben, Medienzustellung und Sitzungs-
auswahl. Verwenden Sie `agentRuntime.id: "codex"`, wenn Sie nachweisen müssen, dass nur der
Codex-App-Server-Pfad die Ausführung beanspruchen kann. Explizite Plugin-Laufzeiten schlagen geschlossen fehl;
Auswahlfehler des Codex-App-Servers und Laufzeitfehler werden nicht über
PI erneut versucht.

## Laufzeitstrenge

Standardmäßig führt OpenClaw eingebettete Agenten mit OpenClaw Pi aus. Im `auto`-Modus
können registrierte Plugin-Harnesses ein Provider-/Modellpaar beanspruchen, und PI übernimmt den
Turn, wenn nichts passt. Verwenden Sie eine explizite Plugin-Laufzeit wie
`agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll, statt
über PI geroutet zu werden. Fehler ausgewählter Plugin-Harnesses schlagen immer hart fehl. Dies
blockiert weder ein explizites `agentRuntime.id: "pi"` noch
`OPENCLAW_AGENT_RUNTIME=pi`.

Für reine Codex-eingebettete Ausführungen:

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

Wenn Sie möchten, dass jedes registrierte Plugin-Harness passende Modelle beansprucht und andernfalls
PI verwendet wird, setzen Sie `id: "auto"`:

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

Agentenspezifische Overrides verwenden dieselbe Form:

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

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Laufzeit.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Mit einer expliziten Plugin-Laufzeit schlägt eine Sitzung früh fehl, wenn das angeforderte
Harness nicht registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder
fehlschlägt, bevor Turn-Seiteneffekte erzeugt werden. Das ist für reine Codex-
Deployments und für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad
tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht
Bild-, Video-, Musik-, TTS-, PDF- oder anderes Provider-spezifisches Modell-Routing.

## Native Sitzungen und Transkriptspiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein Daemon-seitiges Resume-Token behalten.
Halten Sie diese Bindung ausdrücklich mit der OpenClaw-Sitzung verknüpft und spiegeln Sie
nutzerseitig sichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanal sichtbarer Sitzungsverlauf
- Transkriptsuche und -indexierung
- Rückwechsel zum eingebauten PI-Harness in einem späteren Turn
- generisches `/new`-, `/reset`- und Sitzungs-Löschverhalten

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Call ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisform des Harnesses zurück, statt Kanalmedien selbst zu senden.

So bleiben Text-, Bild-, Video-, Musik-, TTS-, Freigabe- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie PI-gestützte Ausführungen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Versuchs-/Ergebnis-Typaliase
  tragen aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Runtime benötigen.
- Harness-Wechsel werden über Turns hinweg unterstützt. Wechseln Sie Harnesses nicht mitten in
  einem Turn, nachdem native Tools, Genehmigungen, Assistententext oder das Senden
  von Nachrichten begonnen haben.

## Verwandt

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
