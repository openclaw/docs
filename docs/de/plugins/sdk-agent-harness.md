---
read_when:
    - Sie ändern die Laufzeitumgebung des eingebetteten Agents oder die Harness-Registry.
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin.
    - Sie müssen verstehen, wie sich das Codex-Plugin auf Modellanbieter bezieht.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den Low-Level-Executor für eingebettete Agents ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-04-22T06:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Agent-Harness-Plugins

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-Turn.
Es ist kein Modellanbieter, kein Kanal und keine Tool-Registry.

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag
ist weiterhin experimentell, da die Parametertypen absichtlich den aktuellen
eingebetteten Runner widerspiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie ihre eigene native Session-
Laufzeitumgebung hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction verwaltet
- eine lokale CLI oder ein Daemon, die native Planungs-/Reasoning-/Tool-Ereignisse streamen müssen
- eine Modell-Laufzeitumgebung, die zusätzlich zum OpenClaw-
  Session-Transkript ihre eigene Resume-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin verwaltet

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Anbieter und Modell
- Laufzeit-Authentifizierungsstatus
- Thinking-Level und Kontextbudget
- das OpenClaw-Transkript bzw. die Session-Datei
- Workspace-, Sandbox- und Tool-Richtlinie
- Kanal-Antwort-Callbacks und Streaming-Callbacks
- Modell-Fallback- und Live-Modellwechsel-Richtlinie

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine
Anbieter aus, ersetzt nicht die Kanalzustellung und wechselt nicht stillschweigend Modelle.

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

1. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID.
2. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das integrierte PI-Harness.
3. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Anbieter bzw. das Modell unterstützen.
4. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback nicht deaktiviert ist.

Fehler von Plugin-Harnesses werden als Ausführungsfehler angezeigt. Im `auto`-Modus wird der PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness den aufgelösten
Anbieter bzw. das Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung übernommen hat,
führt OpenClaw denselben Turn nicht erneut über PI aus, da dies die Authentifizierungs-/Laufzeitsemantik ändern
oder Nebenwirkungen duplizieren kann.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt dies
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin
oder in die Operator-Konfiguration, nicht in den gemeinsamen Laufzeit-Selektor.

## Paarung von Provider und Harness

Die meisten Harnesses sollten zusätzlich einen Provider registrieren. Der Provider macht Modell-Refs,
Authentifizierungsstatus, Modellmetadaten und die Auswahl über `/model` für den Rest von
OpenClaw sichtbar. Das Harness beansprucht dann diesen Provider in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- Provider-ID: `codex`
- Benutzer-Modell-Refs: `codex/gpt-5.4`, `codex/gpt-5.2` oder ein anderes Modell, das
  vom Codex-App-Server zurückgegeben wird
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, da das Codex-Harness die
  native Codex-Anmeldung/Session verwaltet
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und überlässt dem
  Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Einfache `openai/gpt-*`-Refs bleiben OpenAI-Provider-
Refs und verwenden weiterhin den normalen OpenClaw-Provider-Pfad. Wählen Sie `codex/gpt-*`,
wenn Sie von Codex verwaltete Authentifizierung, Codex-Modellerkennung, native Threads und
Codex-App-Server-Ausführung möchten. `/model` kann zwischen den vom Codex-App-Server
zurückgegebenen Codex-Modellen wechseln, ohne dass OpenAI-Provider-Anmeldedaten erforderlich sind.

Informationen zur Operator-Einrichtung, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex-Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex-App-Server `0.118.0` oder neuer. Das Codex-Plugin prüft
den Initialisierungs-Handshake des App-Servers und blockiert ältere oder versionlose Server, sodass
OpenClaw nur mit der Protokolloberfläche ausgeführt wird, mit der es getestet wurde.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete OpenClaw-
Agent-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und schließen Sie `codex` in
`plugins.allow` ein, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Es unterscheidet sich
von `openai-codex/*`:

- `openai-codex/*` verwendet ChatGPT/Codex-OAuth über den normalen OpenClaw-Provider-
  Pfad.
- `codex/*` verwendet den gebündelten Codex-Provider und leitet den Turn über den Codex-
  App-Server.

Wenn dieser Modus ausgeführt wird, verwaltet Codex die native Thread-ID, das Resume-Verhalten,
Compaction und die App-Server-Ausführung. OpenClaw verwaltet weiterhin den Chat-Kanal,
das sichtbare Transkript-Mirror, die Tool-Richtlinie, Genehmigungen, Medienzustellung und die Session-
Auswahl. Verwenden Sie `embeddedHarness.runtime: "codex"` zusammen mit
`embeddedHarness.fallback: "none"`, wenn Sie nachweisen müssen, dass nur der Codex-
App-Server-Pfad die Ausführung übernehmen kann. Diese Konfiguration ist nur eine Auswahl-Schutzmaßnahme:
Fehler des Codex-App-Servers schlagen bereits direkt fehl, statt erneut über PI versucht zu werden.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agents mit `agents.defaults.embeddedHarness`
auf `{ runtime: "auto", fallback: "pi" }` gesetzt aus. Im `auto`-Modus können registrierte Plugin-
Harnesses ein Anbieter-/Modell-Paar übernehmen. Wenn keines passt, fällt OpenClaw auf PI zurück.

Setzen Sie `fallback: "none"`, wenn das Fehlen einer passenden Plugin-Harness-Auswahl
fehlschlagen soll, statt PI zu verwenden. Fehler ausgewählter Plugin-Harnesses schlagen bereits hart fehl. Dies
blockiert kein explizites `runtime: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi`.

Für rein Codex-basierte eingebettete Ausführungen:

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

Wenn Sie möchten, dass jedes registrierte Plugin-Harness passende Modelle übernehmen kann, aber
OpenClaw niemals stillschweigend auf PI zurückfallen soll, behalten Sie `runtime: "auto"` bei und deaktivieren
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

Pro-Agent-Überschreibungen verwenden dieselbe Struktur:

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

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Laufzeitumgebung. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback über die
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Bei deaktiviertem Fallback schlägt eine Session früh fehl, wenn das angeforderte Harness nicht
registriert ist, den aufgelösten Anbieter bzw. das Modell nicht unterstützt oder fehlschlägt, bevor
Turn-Nebenwirkungen erzeugt wurden. Das ist beabsichtigt für reine Codex-Bereitstellungen und
für Live-Tests, die nachweisen müssen, dass der Codex-App-Server-Pfad tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert nicht das
anbieterabhängige Modell-Routing für Bilder, Videos, Musik, TTS, PDFs oder andere Fälle.

## Native Sessions und Transkript-Mirror

Ein Harness kann eine native Session-ID, Thread-ID oder ein Daemon-seitiges Resume-Token behalten.
Halten Sie diese Bindung explizit der OpenClaw-Session zugeordnet und spiegeln Sie weiterhin
für Benutzer sichtbare Assistant-/Tool-Ausgaben in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanalbezogenen sichtbaren Session-Verlauf
- Transkriptsuche und -indexierung
- den Wechsel zurück zum integrierten PI-Harness in einem späteren Turn
- generisches `/new`, `/reset` und Verhalten beim Löschen von Sessions

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw sie
löschen kann, wenn die zugehörige OpenClaw-Session zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisstruktur des Harness zurück, statt Kanalmedien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie bei PI-gestützten Ausführungen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Typaliasnamen für Versuch/Ergebnis
  tragen aus Kompatibilitätsgründen weiterhin `Pi`-Namen.
- Die Installation von Harnesses durch Dritte ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Session-Laufzeitumgebung benötigen.
- Ein Wechsel des Harness zwischen Turns wird unterstützt. Wechseln Sie Harnesses nicht mitten in einem
  Turn, nachdem native Tools, Genehmigungen, Assistant-Text oder Nachrichtenversand begonnen haben.

## Verwandt

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Laufzeit-Helfer](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modellanbieter](/de/concepts/model-providers)
