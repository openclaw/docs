---
read_when:
    - Sie ändern die eingebettete Agenten-Laufzeit oder die Harness-Registry
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie sich das Codex-Plugin auf Modell-Provider bezieht
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Agenten-Executor auf niedriger Ebene ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-04-11T02:46:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Agent-Harness-Plugins

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agenten-
Zug. Es ist kein Modell-Provider, kein Kanal und keine Tool-Registry.

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, da die Parametertypen absichtlich den aktuellen
eingebetteten Runner widerspiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modelfamilie eine eigene native Sitzungs-
Laufzeit hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Kompaktierung selbst verwaltet
- eine lokale CLI oder ein Daemon, der native Plan-/Reasoning-/Tool-Ereignisse streamen muss
- eine Modell-Laufzeit, die zusätzlich zum OpenClaw-Sitzungsprotokoll eine eigene Resume-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin verwaltet

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Laufzeit-Auth-Status
- Thinking-Stufe und Kontextbudget
- das OpenClaw-Transkript bzw. die Sitzungsdatei
- Workspace, Sandbox und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Richtlinie für Modell-Fallback und Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt
keine Provider aus, ersetzt nicht die Kanalzustellung und wechselt nicht stillschweigend Modelle.

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

OpenClaw wählt ein Harness nach der Auflösung von Provider/Modell aus:

1. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID.
2. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das integrierte PI-Harness.
3. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Provider/das aufgelöste Modell unterstützen.
4. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback
   nicht deaktiviert ist.

Fehler bei erzwungenen Plugin-Harnesses werden als Lauf-Fehler angezeigt. Im Modus `auto`
kann OpenClaw auf PI zurückfallen, wenn das ausgewählte Plugin-Harness fehlschlägt, bevor ein
Zug Nebeneffekte erzeugt hat. Setzen Sie `OPENCLAW_AGENT_HARNESS_FALLBACK=none` oder
`embeddedHarness.fallback: "none"`, um diesen Fallback stattdessen zu einem harten Fehler zu machen.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt dies
als normale Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder die Operatorkonfiguration, nicht in den gemeinsamen Laufzeit-Selektor.

## Pairing von Provider und Harness

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen,
Auth-Status, Modellmetadaten und die Auswahl über `/model` für den Rest von
OpenClaw sichtbar. Das Harness beansprucht dann diesen Provider in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- Provider-ID: `codex`
- Modellreferenzen für Benutzer: `codex/gpt-5.4`, `codex/gpt-5.2` oder ein anderes Modell, das
  vom Codex-App-Server zurückgegeben wird
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil das Codex-Harness den nativen Codex-Login/die native Codex-Sitzung verwaltet
- App-Server-Request: OpenClaw sendet die reine Modell-ID an Codex und lässt das
  Harness mit dem nativen App-Server-Protokoll sprechen

Das Codex-Plugin ist additiv. Einfache `openai/gpt-*`-Referenzen bleiben OpenAI-Provider-
Referenzen und verwenden weiterhin den normalen OpenClaw-Providerpfad. Wählen Sie `codex/gpt-*`,
wenn Sie von Codex verwaltete Auth, Codex-Modellerkennung, native Threads und
Codex-App-Server-Ausführung nutzen möchten. `/model` kann zwischen den vom Codex-App-Server zurückgegebenen
Codex-Modellen wechseln, ohne OpenAI-Provider-Zugangsdaten zu erfordern.

Informationen zur Operatoreinrichtung, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.118.0` oder neuer. Das Codex-Plugin prüft den
Initialize-Handshake des App-Servers und blockiert ältere oder versionslose Server, damit
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agenten mit `agents.defaults.embeddedHarness`
auf `{ runtime: "auto", fallback: "pi" }` gesetzt aus. Im Modus `auto` können registrierte Plugin-
Harnesses ein Provider-/Modell-Paar beanspruchen. Wenn keines passt oder wenn ein automatisch ausgewähltes
Plugin-Harness fehlschlägt, bevor es Ausgabe erzeugt, fällt OpenClaw auf PI zurück.

Setzen Sie `fallback: "none"`, wenn Sie nachweisen müssen, dass ein Plugin-Harness die einzige
verwendete Laufzeit ist. Dadurch wird der automatische PI-Fallback deaktiviert; ein explizites
`runtime: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi` wird dadurch nicht blockiert.

Für eingebettete reine-Codex-Läufe:

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

Wenn Sie möchten, dass jedes registrierte Plugin-Harness passende Modelle beanspruchen kann, aber niemals
möchten, dass OpenClaw stillschweigend auf PI zurückfällt, behalten Sie `runtime: "auto"` bei und deaktivieren
Sie den Fallback:

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

Agentenspezifische Überschreibungen verwenden dieselbe Form:

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

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Laufzeit. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback über die
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt eine Sitzung früh fehl, wenn das angeforderte Harness nicht
registriert ist, den aufgelösten Provider/das aufgelöste Modell nicht unterstützt oder fehlschlägt, bevor
Nebeneffekte des Zuges erzeugt werden. Das ist beabsichtigt für reine-Codex-Bereitstellungen und
für Live-Tests, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht das
providerspezifische Modell-Routing für Bilder, Videos, Musik, TTS, PDF oder andere Inhalte.

## Native Sitzungen und Transkript-Spiegelung

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halten Sie diese Bindung explizit mit der OpenClaw-Sitzung verknüpft und spiegeln Sie
für Benutzer sichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- sitzungsverlauf, der in Kanälen sichtbar ist
- Transkriptsuche und -indizierung
- späteres Zurückwechseln zum integrierten PI-Harness in einem späteren Zug
- generisches Verhalten von `/new`, `/reset` und Sitzungs-Löschung

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisform des Harnesses zurück, anstatt Kanalmedien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie bei PI-gestützten Läufen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Typaliasse für Versuch/Ergebnis tragen aus
  Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Laufzeit benötigen.
- Das Wechseln von Harnesses zwischen Zügen wird unterstützt. Wechseln Sie Harnesses nicht mitten in einem
  Zug, nachdem native Tools, Genehmigungen, Assistententext oder Nachrichtensendungen begonnen haben.

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview)
- [Runtime Helpers](/de/plugins/sdk-runtime)
- [Provider Plugins](/de/plugins/sdk-provider-plugins)
- [Codex Harness](/de/plugins/codex-harness)
- [Model Providers](/de/concepts/model-providers)
