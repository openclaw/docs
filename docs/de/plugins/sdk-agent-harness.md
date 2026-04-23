---
read_when:
    - Du änderst die eingebettete Agenten-Laufzeit oder die Harness-Registry
    - Du registrierst einen Agent Harness aus einem gebündelten oder vertrauenswürdigen Plugin
    - Du musst verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den Low-Level-Executor des eingebetteten Agenten ersetzen
title: Plugins für Agent Harness
x-i18n:
    generated_at: "2026-04-23T06:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins für Agent Harness

Ein **Agent Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agenten-
Turn. Er ist kein Modell-Provider, kein Kanal und keine Tool-Registry.

Verwende diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
noch experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner spiegeln.

## Wann ein Harness verwendet werden sollte

Registriere einen Agent Harness, wenn eine Modellfamilie eine eigene native Sitzungs-
Laufzeit hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction selbst verwaltet
- eine lokale CLI oder ein Daemon, die native Plan-/Reasoning-/Tool-Ereignisse streamen müssen
- eine Modell-Laufzeit, die zusätzlich zum OpenClaw-
  Sitzungs-Transcript eine eigene Resume-ID benötigt

Registriere **kein** Harness nur, um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstelle ein [Provider Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Laufzeit-Auth-Status
- Thinking-Stufe und Kontextbudget
- die OpenClaw-Transcript-/Sitzungsdatei
- Workspace, Sandboxing und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Richtlinie für Modell-Fallback und Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; er wählt
keine Provider aus, ersetzt nicht die Kanalzustellung und wechselt nicht stillschweigend Modelle.

## Ein Harness registrieren

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mein nativer Agent Harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Starte oder setze deinen nativen Thread fort.
    // Verwende params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent und die anderen vorbereiteten Versuchsfelder.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mein nativer Agent",
  description: "Führt ausgewählte Modelle über einen nativen Agent-Daemon aus.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Auswahlrichtlinie

OpenClaw wählt nach der Auflösung von Provider/Modell ein Harness aus:

1. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID.
2. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das integrierte PI-Harness.
3. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie das
   aufgelöste Provider-/Modellpaar unterstützen.
4. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback
   nicht deaktiviert ist.

Fehler von Plugin-Harnesses werden als Lauf-Fehler sichtbar. Im Modus `auto` wird der PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness das aufgelöste
Provider-/Modellpaar unterstützt. Sobald ein Plugin-Harness einen Lauf übernommen hat, führt OpenClaw
denselben Turn nicht erneut über PI aus, weil dies Auth-/Laufzeitsemantik ändern
oder Seiteneffekte duplizieren kann.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt dies
als normale Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder die Operatorkonfiguration, nicht in den gemeinsamen Laufzeit-Selektor.

## Paarung aus Provider und Harness

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modell-Refs,
Auth-Status, Modellmetadaten und die Auswahl per `/model` für den Rest von
OpenClaw sichtbar. Das Harness übernimmt dann diesen Provider in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- Provider-ID: `codex`
- Modell-Refs für Benutzer: `codex/gpt-5.4`, `codex/gpt-5.2` oder ein anderes Modell, das
  vom Codex-App-Server zurückgegeben wird
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil das Codex-Harness
  das native Codex-Login/die native Codex-Sitzung besitzt
- App-Server-Anfrage: OpenClaw sendet die nackte Modell-ID an Codex und überlässt dem
  Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Reine `openai/gpt-*`-Refs bleiben OpenAI-Provider-
Refs und verwenden weiterhin den normalen OpenClaw-Providerpfad. Wähle `codex/gpt-*`,
wenn du von Codex verwaltete Auth, Codex-Modellerkennung, native Threads und
Codex-App-Server-Ausführung möchtest. `/model` kann zwischen den vom Codex-App-Server zurückgegebenen Codex-Modellen wechseln, ohne OpenAI-Provider-Anmeldedaten zu benötigen.

Für die Operatoreinrichtung, Beispiele für Modellpräfixe und nur Codex betreffende Konfigurationen siehe
[Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.118.0` oder neuer. Das Codex-Plugin prüft
den Initialize-Handshake des App-Servers und blockiert ältere oder unversionierte Server, damit
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde.

### Middleware für Tool-Ergebnisse des Codex-App-Servers

Gebündelte Plugins können auch Codex-App-Server-spezifische `tool_result`-
Middleware über `api.registerCodexAppServerExtensionFactory(...)` anhängen, wenn ihr
Manifest `contracts.embeddedExtensionFactories: ["codex-app-server"]` deklariert.
Dies ist die Trusted-Plugin-Seam für asynchrone Tool-Ergebnis-Transformationen, die
innerhalb des nativen Codex-Harness laufen müssen, bevor die Tool-Ausgabe zurück
in das OpenClaw-Transcript projiziert wird.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agenten-Turns. Aktiviere zuerst das gebündelte `codex`-Plugin und schließe `codex` in
`plugins.allow` ein, wenn deine Konfiguration eine restriktive Allowlist verwendet. Es unterscheidet sich
von `openai-codex/*`:

- `openai-codex/*` verwendet ChatGPT-/Codex-OAuth über den normalen OpenClaw-Provider-
  Pfad.
- `codex/*` verwendet den gebündelten Codex-Provider und leitet den Turn über den Codex-
  App-Server.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die App-Server-Ausführung. OpenClaw besitzt weiterhin den Chat-Kanal,
den sichtbaren Transcript-Spiegel, die Tool-Richtlinie, Genehmigungen, Medienzustellung und Sitzungs-
Auswahl. Verwende `embeddedHarness.runtime: "codex"` mit
`embeddedHarness.fallback: "none"`, wenn du nachweisen musst, dass nur der Codex-
App-Server-Pfad den Lauf übernehmen kann. Diese Konfiguration ist nur ein Auswahl-Guard:
Fehler des Codex-App-Servers schlagen bereits direkt fehl, statt einen erneuten Versuch über PI auszulösen.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agenten mit `agents.defaults.embeddedHarness`
gleich `{ runtime: "auto", fallback: "pi" }` aus. Im Modus `auto` können registrierte Plugin-
Harnesses ein Provider-/Modellpaar übernehmen. Wenn keines passt, fällt OpenClaw auf PI zurück.

Setze `fallback: "none"`, wenn das Fehlschlagen der Plugin-Harness-Auswahl
anstatt der Verwendung von PI zum Fehler führen soll. Fehler ausgewählter Plugin-Harnesses schlagen bereits hart fehl. Dies
blockiert kein explizites `runtime: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi`.

Für eingebettete Läufe nur mit Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Wenn du möchtest, dass irgendein registriertes Plugin-Harness passende Modelle übernimmt, aber niemals
möchtest, dass OpenClaw stillschweigend auf PI zurückfällt, belasse `runtime: "auto"` und deaktiviere
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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Laufzeit. Verwende
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback aus der
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt eine Sitzung frühzeitig fehl, wenn das angeforderte Harness nicht
registriert ist, das aufgelöste Provider-/Modellpaar nicht unterstützt oder fehlschlägt, bevor
Seiteneffekte des Turns erzeugt wurden. Das ist beabsichtigt für nur-Codex-Bereitstellungen und
für Live-Tests, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur den eingebetteten Agent Harness. Sie deaktiviert nicht
Provider-spezifisches Modellrouting für Bilder, Video, Musik, TTS, PDF oder andere Bereiche.

## Native Sitzungen und Transcript-Spiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halte diese Bindung explizit mit der OpenClaw-Sitzung verknüpft und spiegele
für Benutzer sichtbare Assistant-/Tool-Ausgabe weiterhin in das OpenClaw-Transcript.

Das OpenClaw-Transcript bleibt die Kompatibilitätsschicht für:

- kanal sichtbaren Sitzungsverlauf
- Transcript-Suche und -Indexierung
- Wechsel zurück zum integrierten PI-Harness in einem späteren Turn
- generisches Verhalten von `/new`, `/reset` und Löschen von Sitzungen

Wenn dein Harness eine Sidecar-Bindung speichert, implementiere `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, gib das Tool-Ergebnis über
die Ergebnisform des Harness zurück, anstatt Kanalmedien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie bei von PI gestützten Läufen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Alias-Typen für Versuch/Ergebnis tragen aus Kompatibilitätsgründen weiterhin
  `Pi`-Namen.
- Die Installation von Harnesses durch Dritte ist experimentell. Bevorzuge Provider Plugins,
  bis du eine native Sitzungs-Laufzeit benötigst.
- Das Wechseln von Harnesses zwischen Turns wird unterstützt. Wechsle Harnesses nicht in der
  Mitte eines Turns, nachdem native Tools, Genehmigungen, Assistant-Text oder Nachrichten-
  Sendungen begonnen haben.

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview)
- [Runtime Helpers](/de/plugins/sdk-runtime)
- [Provider Plugins](/de/plugins/sdk-provider-plugins)
- [Codex Harness](/de/plugins/codex-harness)
- [Model Providers](/de/concepts/model-providers)
