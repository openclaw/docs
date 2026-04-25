---
read_when:
    - Sie ändern die eingebettete Agent-Runtime oder die Harness-Registry.
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin.
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Agent-Executor auf niedriger Ebene ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-04-25T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-
Turn. Es ist kein Modell-Provider, kein Channel und keine Tool-Registry.
Für das benutzerseitige mentale Modell siehe [Agent runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner spiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie ihre eigene native Sitzungs-
Runtime hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction selbst verwaltet
- eine lokale CLI oder ein Daemon, der native Ereignisse für Plan/Reasoning/Tools streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-
  Sitzungs-Transkript ihre eigene Resume-ID benötigt

Registrieren Sie **kein** Harness nur, um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Authentifizierungsstatus
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Workspace, Sandbox und Tool-Richtlinie
- Channel-Reply-Callbacks und Streaming-Callbacks
- Richtlinie für Modell-Fallback und Live-Modellwechsel

Diese Aufteilung ist absichtlich so gewählt. Ein Harness führt einen vorbereiteten
Versuch aus; es wählt keine Provider aus, ersetzt nicht die Channel-Zustellung und wechselt nicht stillschweigend Modelle.

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

OpenClaw wählt ein Harness nach der Auflösung von Provider/Modell:

1. Die aufgezeichnete Harness-ID einer bestehenden Sitzung hat Vorrang, sodass Änderungen an Konfiguration/env dieses Transkript nicht
   im laufenden Betrieb auf eine andere Runtime umschalten.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID für
   Sitzungen, die noch nicht fest pinnt sind.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das integrierte PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie das
   aufgelöste Provider/Modell unterstützen.
5. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern PI-Fallback nicht
   deaktiviert ist.

Fehler von Plugin-Harnesses werden als Lauf-Fehler angezeigt. Im Modus `auto` wird der PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness das aufgelöste
Provider/Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw
denselben Turn nicht noch einmal über PI ab, weil dies Auth-/Runtime-Semantik ändern
oder Seiteneffekte duplizieren könnte.

Die ausgewählte Harness-ID wird nach einem eingebetteten Lauf zusammen mit der Sitzungs-ID persistiert.
Veraltete Sitzungen, die vor Harness-Pins erstellt wurden, werden als an PI gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie eine neue/zurückgesetzte Sitzung, wenn Sie zwischen PI und einem
nativen Plugin-Harness wechseln. `/status` zeigt nicht standardmäßige Harness-IDs wie `codex`
neben `Fast`; PI bleibt verborgen, weil es der Standard-Kompatibilitätspfad ist.
Wenn das ausgewählte Harness überraschend ist, aktivieren Sie Debug-Logging für `agents/harness` und
prüfen Sie den strukturierten Gateway-Record `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Grund der Auswahl, die Runtime-/Fallback-Richtlinie und im
Modus `auto` das Ergebnis der Unterstützungsprüfung jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt dies
als normale Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder in die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selektor.

## Pairing von Provider und Harness

Die meisten Harnesses sollten zusätzlich einen Provider registrieren. Der Provider macht Modell-Refs,
Authentifizierungsstatus, Modell-Metadaten und `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Das Harness beansprucht dann diesen Provider in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Modell-Refs für Benutzer: `openai/gpt-5.5` plus
  `embeddedHarness.runtime: "codex"`
- Kompatibilitäts-Refs: veraltete Refs `codex/gpt-*` werden weiterhin akzeptiert, aber neue
  Konfigurationen sollten sie nicht als normale Provider-/Modell-Refs verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, weil das Codex-Harness den
  nativen Codex-Login/die native Sitzung selbst verwaltet
- App-Server-Anfrage: OpenClaw sendet die nackte Modell-ID an Codex und überlässt dem
  Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Normale Refs `openai/gpt-*` verwenden weiterhin den
normalen OpenClaw-Provider-Pfad, sofern Sie nicht das Codex-Harness mit
`embeddedHarness.runtime: "codex"` erzwingen. Ältere Refs `codex/gpt-*` wählen weiterhin
aus Kompatibilitätsgründen den Codex-Provider und das Codex-Harness.

Für die Einrichtung durch Operatoren, Beispiele für Modellpräfixe und reine Codex-Konfigurationen siehe
[Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.118.0` oder neuer. Das Codex-Plugin prüft
den Initialize-Handshake des App-Servers und blockiert ältere oder versionslose Server, sodass
OpenClaw nur gegen die Protokolloberfläche läuft, gegen die es getestet wurde.

### Middleware für Tool-Ergebnisse

Gebündelte Plugins können runtime-neutrale Middleware für Tool-Ergebnisse über
`api.registerAgentToolResultMiddleware(...)` anhängen, wenn ihr Manifest die
Ziel-Runtime-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Nahtstelle ist für asynchrone Transformationen von Tool-Ergebnissen gedacht, die ausgeführt werden müssen, bevor PI oder Codex
die Tool-Ausgabe wieder in das Modell einspeist.

Veraltete gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die nur für den Codex-App-Server gilt,
aber neue Transformationen von Ergebnissen sollten die runtime-neutrale API verwenden.
Der nur für Pi geltende Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt;
Transformationen von Tool-Ergebnissen für Pi müssen runtime-neutrale Middleware verwenden.

### Nativer Codex-Harness-Modus

Das gebündelte Harness `codex` ist der native Codex-Modus für eingebettete OpenClaw-
Agent-Turns. Aktivieren Sie zuerst das gebündelte Plugin `codex` und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` mit `embeddedHarness.runtime: "codex"` verwenden.
Verwenden Sie `openai-codex/*` stattdessen für Codex-OAuth über PI. Veraltete Modell-Refs `codex/*`
bleiben Kompatibilitäts-Aliasse für das native Harness.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die Ausführung über den App-Server. OpenClaw besitzt weiterhin den Chat-Channel,
den sichtbaren Spiegel des Transkripts, die Tool-Richtlinie, Genehmigungen, Medienzustellung und Sitzungs-
auswahl. Verwenden Sie `embeddedHarness.runtime: "codex"` ohne Überschreibung von `fallback`,
wenn Sie nachweisen müssen, dass nur der Pfad über den Codex-App-Server den Lauf beanspruchen kann.
Explizite Plugin-Runtimes schlagen standardmäßig bereits fail closed fehl. Setzen Sie `fallback: "pi"`
nur dann, wenn PI absichtlich eine fehlende Harness-Auswahl behandeln soll. Fehler des Codex-
App-Servers schlagen bereits direkt fehl, statt über PI erneut versucht zu werden.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agents mit `agents.defaults.embeddedHarness`
auf `{ runtime: "auto", fallback: "pi" }` aus. Im Modus `auto` können registrierte Plugin-
Harnesses ein Provider-/Modell-Paar beanspruchen. Wenn keines passt, fällt OpenClaw auf PI zurück.

Setzen Sie im Modus `auto` `fallback: "none"`, wenn eine fehlende Auswahl eines Plugin-Harness
zu einem Fehler führen soll, statt PI zu verwenden. Explizite Plugin-Runtimes wie
`runtime: "codex"` schlagen standardmäßig bereits fail closed fehl, sofern nicht `fallback: "pi"`
im selben Konfigurations- oder Umgebungs-Überschreibungs-Scope gesetzt ist. Fehler ausgewählter Plugin-
Harnesses schlagen immer hart fehl. Dies blockiert kein explizites `runtime: "pi"` oder
`OPENCLAW_AGENT_RUNTIME=pi`.

Für eingebettete Läufe nur mit Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Wenn ein beliebiges registriertes Plugin-Harness passende Modelle beanspruchen darf, OpenClaw aber
niemals stillschweigend auf PI zurückfallen soll, behalten Sie `runtime: "auto"` bei und deaktivieren Sie
den Fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Überschreibungen pro Agent verwenden dieselbe Form:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Runtime. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback aus der
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt eine Sitzung früh fehl, wenn das angeforderte Harness nicht
registriert ist, das aufgelöste Provider/Modell nicht unterstützt oder vor
dem Erzeugen von Seiteneffekten des Turns fehlschlägt. Dies ist absichtlich so für Deployments nur mit Codex und
für Live-Tests, die beweisen müssen, dass der Pfad über den Codex-App-Server tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht
das provider-spezifische Routing für Bilder, Video, Musik, TTS, PDF oder andere Modelle.

## Native Sitzungen und Transkript-Spiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halten Sie diese Bindung ausdrücklich mit der OpenClaw-Sitzung verknüpft und spiegeln Sie
benutzersichtbare Assistant-/Tool-Ausgaben weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanal-sichtbaren Sitzungsverlauf
- Transkript-Suche und Indexierung
- späteres Zurückwechseln zum integrierten PI-Harness
- generisches `/new`, `/reset` und Verhalten beim Löschen von Sitzungen

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw
sie löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core konstruiert die OpenClaw-Tool-Liste und übergibt sie in den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisform des Harness zurück, statt Channel-Medien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie bei PI-gestützten Läufen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Typ-Aliasse für Versuch/Ergebnis tragen weiterhin
  `Pi`-Namen aus Kompatibilitätsgründen.
- Die Installation von Harnesses durch Dritte ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie wirklich eine native Sitzungs-Runtime benötigen.
- Das Wechseln des Harnesses ist zwischen Turns unterstützt. Wechseln Sie Harnesses nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistant-Text oder Message-
  Sends begonnen haben.

## Verwandt

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Runtime Helpers](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
