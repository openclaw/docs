---
read_when:
    - Sie ändern die eingebettete Agentenlaufzeit oder die Harness-Registry
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin.
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Schnittstelle für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-07-16T13:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-
Turn. Es ist weder ein Modell-Provider noch ein Kanal oder eine Tool-Registry. Das
benutzerorientierte mentale Modell finden Sie unter [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes).

Verwenden Sie diese Schnittstelle nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, da die Parametertypen absichtlich den
aktuellen eingebetteten Runner widerspiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie über eine eigene native Sitzungs-
Laufzeitumgebung verfügt und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist:

- ein nativer Coding-Agent-Server, der Threads und Compaction verwaltet
- eine lokale CLI oder ein Daemon, die bzw. der native Planungs-, Reasoning- und Tool-Ereignisse streamen muss
- eine Modell-Laufzeitumgebung, die zusätzlich zum OpenClaw-
  Sitzungstranskript eine eigene Fortsetzungs-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Erstellen Sie für normale HTTP-
oder WebSocket-Modell-APIs ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was weiterhin dem Core gehört

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Laufzeit-Authentifizierungsstatus, sofern das Harness nicht angibt, den Authentifizierungs-Bootstrap zu verwalten
- Thinking-Stufe und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Arbeitsbereich, Sandbox und Tool-Richtlinie
- Callbacks für Kanalantworten und Streaming
- Modell-Fallback und Richtlinie für den Live-Modellwechsel

Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine Provider aus, ersetzt nicht die Kanal-
Zustellung und wechselt nicht stillschweigend das Modell.

### Vom Harness verwalteter Authentifizierungs-Bootstrap

Standardmäßig löst der Core die Provider-Anmeldedaten auf, bevor er ein Harness aufruft. Ein
vertrauenswürdiges Harness, das sich über seine eigene native Laufzeitumgebung authentifizieren kann, darf
`authBootstrap: "harness"` bei seiner statischen `AgentHarness`-Registrierung festlegen. Der Core
überspringt dann für jeden von diesem Harness übernommenen Versuch seinen generischen Bootstrap der Provider-Anmeldedaten
und den Fehler wegen fehlender Anmeldedaten.

Der Core leitet weiterhin ein kompatibles, ausdrücklich ausgewähltes oder geordnetes OpenClaw-Authentifizierungs-
profil und dessen Store mit entsprechendem Geltungsbereich weiter, sofern eines vorhanden ist. Das Harness muss dieses
Profil oder seine nativen Anmeldedaten auflösen, bevor es Modellanfragen sendet, Geheimnisse
auf den Versuch beschränken und aussagekräftige Authentifizierungsfehler melden. Legen Sie
diese Fähigkeit nicht bei einem Harness fest, das die Authentifizierung nur gelegentlich verwaltet.

### Verifizierte Laufzeitartefakte der Einrichtung

Ein lokales Harness, das Inferenz für die Ersteinrichtung bereitstellen kann, muss die
Implementierung bestätigen, die die Prüfung abgeschlossen hat. Wenn
`params.captureRuntimeArtifact` wahr ist, geben Sie ein opakes
`result.runtimeArtifact` mit einer stabilen ID und einem Inhaltsfingerabdruck zurück. Registrieren Sie eine
passende `runtimeArtifact.validate(...)`-Fähigkeit, die diese Bindung erneut prüft,
ohne ein anderes Harness zu laden oder nicht zugehörige Plugins zu durchsuchen.

Verifizierte OpenClaw-Fortsetzungen übergeben außerdem `params.expectedRuntimeArtifact`.
Das Harness muss dies mit dem exakt übernommenen nativen Prozess vergleichen und einen Fehler auslösen,
bevor es einen nativen Thread startet oder fortsetzt, falls sie voneinander abweichen. Bei gewöhnlichen Agent-
Turns fehlen beide Felder, sodass das Inhalts-Hashing nicht im normalen Hot Path der Anfrage erfolgt.
Remote-/WebSocket-Harnesses benötigen einen Server-Attestierungsvertrag, bevor
sie teilnehmen können; eine Versionszeichenfolge allein stellt keine Artefaktidentität dar.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein von OpenClaw verwaltetes
Richtlinienpaket für Laufzeitentscheidungen, die zwischen OpenClaw und
nativen Harnesses einheitlich bleiben müssen:

- `runtimePlan.tools.normalize(...)` und `runtimePlan.tools.logDiagnostics(...)`
  für Provider-bezogene Richtlinien zu Tool-Schemas
- `runtimePlan.transcript.resolvePolicy(...)` für die Bereinigung von Transkripten und
  Richtlinien zur Reparatur von Tool-Aufrufen
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsame `NO_REPLY` und die Unterdrückung
  der Medienzustellung
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung von
  Modell-Fallbacks
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses dürfen den Plan für Entscheidungen verwenden, die mit dem OpenClaw-Verhalten
übereinstimmen müssen, sollten ihn jedoch als versuchsbezogenen Zustand behandeln, der dem Host gehört: Ändern Sie ihn nicht
und verwenden Sie ihn nicht, um innerhalb eines Turns Provider oder Modelle zu wechseln.

### Vertrag für den Anfragetransport

`supports(ctx)` empfängt den aufgelösten Modelltransport in `ctx.modelProvider`.
Zwei geheimnisfreie, dem Provider gehörende Fakten beschreiben die ausgewählte Route:

- `runtimePolicy.compatibleIds` führt die Laufzeit-IDs auf, die der Provider
  für diese konkrete Route als kompatibel angibt. Eine fehlende Richtlinie bedeutet, dass der Provider
  keine Kompatibilität auf Routenebene angegeben hat; sie ist keine Erlaubnis, Unterstützung anzunehmen.
- `requestTransportOverrides: "none"` bedeutet, dass keine konfigurierte Überschreibung einer Provider-/Modellanfrage
  reproduziert werden muss. `"present"` bedeutet, dass konfigurierte Header, ein Authentifizierungs-
  transport, Proxy-, TLS-, lokaler Dienst-, privates Netzwerkverhalten oder Anfrage-
  parameter vorhanden sind. Das Faktum legt diese Werte nicht offen.

Geben Sie `{ supported: false, reason }` zurück, wenn das Harness den
vorbereiteten Transport nicht reproduzieren kann. Leiten Sie die Unterstützung nach der Auswahl nicht durch das Lesen der Rohkonfiguration ab.
Wenn die Authentifizierungsvorbereitung mehrere Wiederholungsrouten ergibt, muss ein Harness
alle unterstützen, bevor die Ausführung übergeben wird. Bei impliziter Auswahl wird OpenClaw verwendet, wenn kein Plugin
die vollständige Menge übernehmen kann; eine ausdrückliche oder persistierte Plugin-Auswahl schlägt sicher geschlossen fehl.

## Ein Harness registrieren

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mein natives Agent-Harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "die effektive Route ist nicht mit dem Harness kompatibel" };
  },

  async runAttempt(params) {
    // Starten Sie Ihren nativen Thread oder setzen Sie ihn fort.
    // Verwenden Sie params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent und die weiteren Felder des vorbereiteten Versuchs.
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

`authBootstrap` fehlt in diesem generischen Beispiel absichtlich. Fügen Sie
`authBootstrap: "harness"` nur hinzu, wenn das Harness den obigen Vertrag erfüllt.

### Delegierte Ausführung

Ein Harness-Eigentümer darf `delegatedExecutionPluginIds` auf die IDs vertrauenswürdiger
Plugins setzen, die eine bestehende, an ein Modell gebundene Sitzung ausführen müssen, etwa wenn ein Sprach-
transport eine Codex-gestützte Unterhaltung fortsetzt. Dies ist die statische Zustimmung des Eigentümers,
keine Core-Allowlist. Halten Sie sie eng begrenzt.

Delegierte erhalten ausschließlich die Zulassung zur Arbeit und die eingebettete Ausführung. OpenClaw verlangt
den exakt gespeicherten Sitzungsschlüssel, Store-Pfad und die Sitzungs-ID; `modelSelectionLocked:
true`; sowie übereinstimmende Werte für `agentHarnessId` und `agentHarnessRuntimeOverride`.
Die Ausführung wird anschließend über den Harness-Eigentümer abgegrenzt. Erstellung, Änderung,
Zurücksetzung, Löschung und Archivierung von Sitzungen sowie Gateway-Mutationen bleiben ausschließlich dem Eigentümer vorbehalten.

## Auswahlrichtlinie

OpenClaw wählt ein Harness nach der Provider-/Modellauflösung aus:

1. Die modellspezifische Laufzeitrichtlinie hat Vorrang.
2. Danach folgt die Provider-spezifische Laufzeitrichtlinie.
3. `auto` fragt registrierte Harnesses, ob sie die aufgelöste effektive
   Route unterstützen. Provider-/Modellpräfixe allein wählen niemals ein Harness aus.
4. Wenn kein registriertes Harness übereinstimmt, verwendet OpenClaw seine eingebettete Laufzeitumgebung.

Fehler von Plugin-Harnesses werden als Ausführungsfehler gemeldet. Im Modus `auto` gilt der eingebettete
Fallback nur, wenn kein registriertes Plugin-Harness den aufgelösten
Provider bzw. das Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung übernommen hat, spielt OpenClaw
denselben Turn nicht erneut über eine andere Laufzeitumgebung ab, da dies
die Authentifizierungs-/Laufzeitsemantik verändern oder Nebenwirkungen duplizieren kann.

Die konfigurierte Laufzeitrichtlinie bleibt für die gewünschte Laufzeitumgebung maßgeblich. Ein
persistiertes Sitzungs-`agentHarnessId` behält die Zuständigkeit für sein natives Transkript,
während die Routen-/Authentifizierungsvorbereitung noch aussteht. Keines von beiden macht eine inkompatible
Route kompatibel: Sobald vorbereitete Fakten vorliegen, muss das ausgewählte oder angeheftete Harness
sie unterstützen, andernfalls schlägt die Ausführung sicher geschlossen fehl. `/status` zeigt die effektive Laufzeitumgebung,
die anhand der Richtlinie, der persistierten Zuständigkeit und der Routenunterstützung ausgewählt wurde.
Der Vorbereitungsstatus ist explizit: Ein fehlendes `runtimePolicy` bleibt nicht deklariert,
anstatt aus den zufällig vorhandenen Transportfeldern abgeleitet zu werden.
Wenn eine vom Harness verwaltete Authentifizierung mehrere physische Routen unaufgelöst lässt, ist das
vorbereitete Unterstützungsfaktum die Schnittmenge ihrer kompatiblen Laufzeit-IDs und
meldet Anfrageüberschreibungen, falls ein Kandidat solche besitzt. Ein einzelner nicht deklarierter Kandidat
führt daher zu leerer nativer Kompatibilität; `preparedAuth.source: "harness"`
ist ein Authentifizierungseigentümer und keine Erlaubnis, Routenunterstützung abzuleiten.

Wenn das ausgewählte Harness überraschend ist, aktivieren Sie das Debug-Logging `agents/harness`
und prüfen Sie den strukturierten `agent harness selected`-Datensatz des Gateway: Er
enthält die ID des ausgewählten Harness, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie
und im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt diese
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder die Betreiberkonfiguration, nicht in den gemeinsamen Laufzeitselektor.

## Kombination aus Provider und Harness

Die meisten Harnesses sollten außerdem einen Provider registrieren. Der Provider macht Modellreferenzen,
Authentifizierungsstatus, Modellmetadaten und die `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Das Harness übernimmt diesen Provider anschließend in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Modellreferenzen für Benutzer: `openai/gpt-5.6-sol`
- Kompatibilitätsreferenzen: Veraltete `codex/gpt-*`-Referenzen werden weiterhin akzeptiert, neue
  Konfigurationen sollten sie jedoch nicht als reguläre Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, da das Codex-Harness die
  native Codex-Anmeldung/-Sitzung verwaltet
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt das
  Harness mit dem nativen App-Server-Protokoll kommunizieren

Das Codex-Plugin ist additiv. Wenn die Laufzeitrichtlinie nicht gesetzt oder auf `auto` gesetzt ist, darf OpenAI
Codex nur auswählen, wenn sein Provider-eigener Routenvertrag `codex` als
kompatibel deklariert: eine exakte offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses
ohne konfigurierte Anfrageüberschreibung. Das Präfix `openai/*` allein wählt
Codex niemals aus. Benutzerdefinierte Endpunkte, Completions-Adapter und konfiguriertes Anfrage-
verhalten verbleiben bei OpenClaw. Offizielle Klartext-HTTP-Endpunkte werden abgelehnt. Ältere `codex/gpt-*`-
Referenzen bleiben Kompatibilitätseingaben. Siehe
[Implizite OpenAI-Agent-Laufzeitumgebung](/de/providers/openai#implicit-agent-runtime).

Informationen zur Einrichtung durch Betreiber, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex-Harness](/de/plugins/codex-harness).

Das Codex-Plugin erzwingt die unter
[Codex-Harness](/de/plugins/codex-harness) dokumentierte Mindestversion des App-Servers. Es prüft den Initialisierungs-Handshake und
blockiert ältere oder nicht versionierte Server, sodass OpenClaw nur mit der getesteten
Protokollschnittstelle ausgeführt wird.

### Middleware für Tool-Ergebnisse

Gebündelte Plugins und ausdrücklich aktivierte installierte Plugins mit passenden
Manifestverträgen können über `api.registerAgentToolResultMiddleware(...)` laufzeitneutrale Middleware für Tool-Ergebnisse
einbinden, wenn ihr Manifest die
Ziel-Laufzeit-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Transformationen von Tool-Ergebnissen vorgesehen, die ausgeführt werden müssen, bevor OpenClaw oder
Codex die Tool-Ausgabe wieder an das Modell übergibt.

Legacy-bündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die ausschließlich für den Codex-App-Server
bestimmt ist, neue Ergebnistransformationen sollten jedoch die laufzeitneutrale API verwenden. Der
ausschließlich für den eingebetteten Runner bestimmte Hook `api.registerEmbeddedExtensionFactory(...)` wurde
entfernt; Transformationen von Werkzeugergebnissen im eingebetteten Runner müssen laufzeitneutrale Middleware verwenden.

### Klassifizierung des terminalen Ergebnisses

Native Harnesses, die ihre eigene Protokollprojektion verwalten, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, damit die Fallback-Richtlinie von OpenClaw entscheiden kann, ob ein erneuter Versuch mit einem
anderen Modell erfolgen soll. `planning-only` erfordert das explizite Feld `planText`
des Harnesses; OpenClaw leitet es nicht aus Assistentenprosa ab. Der Helper
lässt Promptfehler, laufende Turns und absichtlich stille
Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Seiteneffekte am Agentenende

Native Harnesses müssen `runAgentEndSideEffects(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` aufrufen, nachdem sie einen Versuch abgeschlossen haben. Der Helper
löst den portablen Hook `agent_end` und die Forschungserfassung von OpenClaw aus,
ohne interaktive Antworten zu verzögern. Verwenden Sie `awaitAgentEndSideEffects(...)` für
lokale, nicht interaktive Ausführungen, bei denen der Versuch erst abgeschlossen werden darf, nachdem diese
Seiteneffekte beendet sind. Beide Helper akzeptieren dieselbe `{ event, ctx }`-Nutzlast wie
`runAgentHarnessAgentEndHook(...)`; ihre Fehler verändern das Ergebnis des abgeschlossenen
Versuchs nicht.

### Benutzereingaben und Werkzeugoberflächen

Native Harnesses, die eine Benutzereingabeanforderung auf Laufzeitebene bereitstellen, sollten die
Benutzereingabe-Helper aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, um
den Prompt zu formatieren, ihn über den blockierenden Antwortpfad von OpenClaw zuzustellen und
Auswahlantworten beziehungsweise Freitextantworten zurück in die native Antwortstruktur der Laufzeit zu normalisieren. Der
Helper hält die Darstellung in Kanälen und der TUI konsistent, während jedes Harness seine
eigene Protokollanalyse und den Lebenszyklus ausstehender Anforderungen verwaltet.

Native Harnesses, die eine kompakte PI-ähnliche Werkzeugweiterleitung benötigen, sollten
`createAgentHarnessToolSurfaceRuntime(...)` aus
`openclaw/plugin-sdk/agent-harness-tool-runtime` verwenden. Der Helper verwaltet
die Auswahl der Steuerung für Werkzeugsuche und Codemodus, schlanke Standardwerte für lokale Modelle,
laufzeitkompatible Schemafilterung, die Ausführung des verborgenen Katalogs, die
Verzeichnishydratisierung und die Katalogbereinigung. Harnesses verwalten weiterhin ihre SDK-spezifische
Werkzeugkonvertierung und ihren nativen Ausführungs-Callback.

### Nativer Codex-Harness-Modus

Das gebündelte Harness `codex` ist der native Codex-Modus für eingebettete
OpenClaw-Agenten-Turns. Aktivieren Sie zuerst das gebündelte Plugin `codex` und nehmen Sie `codex` in
`plugins.allow` auf, falls Ihre Konfiguration eine restriktive Zulassungsliste verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` verwenden; OpenAI-Agenten-Turns wählen das Codex-Harness
nur aus, wenn die effektive Route Codex-Kompatibilität deklariert. Legacy-Codex-Modellreferenzen
sollten mit `openclaw doctor --fix` repariert werden, und Legacy-Modellreferenzen vom Typ `codex/*`
bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus ausgeführt wird, verwaltet Codex die native Thread-ID, das Fortsetzungsverhalten,
Compaction und die App-Server-Ausführung. OpenClaw verwaltet weiterhin den Chatkanal,
die sichtbare Transkriptspiegelung, die Werkzeugrichtlinie, Genehmigungen, die Medienzustellung und die Sitzungsauswahl.
Verwenden Sie Provider/Modell `agentRuntime.id: "codex"`, wenn Sie
nachweisen müssen, dass ausschließlich der Codex-App-Server-Pfad die Ausführung übernehmen kann. Explizite Plugin-
Laufzeiten schlagen geschlossen fehl; Auswahlfehler des Codex-App-Servers und Laufzeitfehler
werden nicht über eine andere Laufzeit erneut versucht.

## Laufzeitstrenge

Standardmäßig verwendet OpenClaw die Provider-/Modell-Laufzeitrichtlinie `auto`: Registrierte
Plugin-Harnesses können kompatible effektive Routen übernehmen, und die eingebettete
Laufzeit verarbeitet den Turn, wenn keine Übereinstimmung vorliegt. Ein Provider-/Modellpräfix allein
wählt niemals ein Harness aus. Verwenden Sie eine explizite Provider-/Modell-Plugin-Laufzeit wie
`agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll,
statt über die eingebettete Laufzeit weitergeleitet zu werden. Eine explizite Auswahl macht eine
inkompatible Route nicht kompatibel. Fehler ausgewählter Plugin-Harnesses führen immer
zu einem harten Fehler. Dies blockiert kein explizites Provider/Modell
`agentRuntime.id: "openclaw"`.

Für ausschließlich Codex verwendende eingebettete Ausführungen:

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Wenn Sie ein CLI-Backend für ein kanonisches Modell wünschen, legen Sie die Laufzeit in diesem
Modelleintrag fest:

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

Agentenspezifische Überschreibungen verwenden dieselbe modellbezogene Struktur:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Legacy-Beispiele mit einer Laufzeit für den gesamten Agenten wie dieses werden ignoriert:

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

Bei einer expliziten Plugin-Laufzeit schlägt eine Sitzung frühzeitig fehl, wenn das angeforderte
Harness nicht registriert ist, den aufgelösten Provider beziehungsweise das aufgelöste Modell nicht unterstützt oder
fehlschlägt, bevor Seiteneffekte des Turns erzeugt werden. Dies ist bei ausschließlich Codex verwendenden
Bereitstellungen und bei Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad
tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agenten-Harness. Sie deaktiviert nicht
die Provider-spezifische Modellweiterleitung für Bilder, Videos, Musik, TTS, PDF oder andere Formate.

## Native Sitzungen und Transkriptspiegelung

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges
Fortsetzungstoken verwalten. Ordnen Sie diese Bindung ausdrücklich der OpenClaw-Sitzung zu und
spiegeln Sie benutzersichtbare Assistenten- und Werkzeugausgaben weiterhin in das OpenClaw-
Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- kanalsichtbaren Sitzungsverlauf
- Transkriptsuche und -indizierung
- den Wechsel zurück zum integrierten OpenClaw-Harness in einem späteren Turn
- generisches Verhalten von `/new`, `/reset` und beim Löschen von Sitzungen

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw
sie löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Werkzeug- und Medienergebnisse

Der Kern erstellt die OpenClaw-Werkzeugliste und übergibt sie an den vorbereiteten
Versuch. Wenn ein Harness einen dynamischen Werkzeugaufruf ausführt, geben Sie das Werkzeugergebnis
über die Ergebnisstruktur des Harnesses zurück, statt selbst Kanalmedien
zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Werkzeug-
Ausgaben auf demselben Zustellungspfad wie von OpenClaw gestützte Ausführungen.

### Terminale Werkzeugergebnisse

`AgentHarnessAttemptParams.observeToolTerminal` ist der vom Host verwaltete Akkumulator für terminale
Ergebnisse. Ein Harness, das dynamische OpenClaw-Werkzeuge oder native
Werkzeuge ausführt, muss ihn aufrufen, sobald jedes Werkzeug genau ein terminales Ergebnis erreicht, bevor das
Versuchsergebnis abgeschlossen wird. Harnesses, die keine Werkzeuge ausführen, müssen ihn nicht
aufrufen.

Melden Sie Fakten von der Ausführungsgrenze:

- Übergeben Sie die Protokollaufruf-ID, sofern vorhanden, den kanonischen Werkzeugnamen und die
  Argumente, die nach der Vorbereitung oder Umschreibung durch Hooks tatsächlich beim Werkzeug eingegangen sind.
- Setzen Sie `executionStarted: false`, wenn Validierung, Genehmigung oder eine andere Schutzprüfung
  den Aufruf beendet hat, bevor die Werkzeugimplementierung begann. Sobald möglicherweise eine Weiterleitung
  stattgefunden hat, melden Sie vorsichtshalber `true`.
- Melden Sie `outcome: "success"` oder `outcome: "failure"`. Fügen Sie die strukturierten
  Fehlerfelder hinzu, die von der Laufzeit verfügbar sind, statt einen Fehler aus
  dem Anzeigetext abzuleiten.
- Verwenden Sie `nativeMutation` nur für native Werkzeuge, die keine OpenClaw-Werkzeugdefinition
  verwenden. Geben Sie dort protokollverwaltete Fakten zu Mutationen und Wiederholungen an; kopieren Sie nicht
  den Mutationsklassifizierer von OpenClaw in das Harness.

Der Callback gibt die kanonische Auflösung für diesen Aufruf zurück. Übernehmen Sie dessen
`lastToolError` in `AgentHarnessAttemptResult` und verwenden Sie dessen Fakten zu Ausführung,
Argumenten und Seiteneffekten in der Harness-Projektion, statt einen
parallelen Zustand abzuleiten. Der Host behält einen nicht aufgelösten mutierenden Fehler über nicht zusammenhängende
erfolgreiche Werkzeuge hinweg bei und löscht ihn erst, nachdem die entsprechende Aktion erfolgreich ist.

Der Callback bleibt für die Quellkompatibilität mit älteren experimentellen
Harnesses optional. Optional bedeutet für ein Harness, das Werkzeuge ausführt, nicht, dass er ignoriert werden kann:
Ohne terminale Meldungen kann OpenClaw den Wahrheitswert von Fehlern mutierender Werkzeuge
über spätere Werkzeugaufrufe hinweg nicht bewahren, einschließlich eines stillen Heartbeat-Abschlusses.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, einige Typaliase für Versuche und Ergebnisse
  tragen aus Kompatibilitätsgründen jedoch weiterhin Legacy-Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungslaufzeit benötigen.
- Der Wechsel zwischen Harnesses wird über mehrere Turns hinweg unterstützt. Wechseln Sie Harnesses nicht
  mitten in einem Turn, nachdem native Werkzeuge, Genehmigungen, Assistententext oder das Senden von
  Nachrichten begonnen haben.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Laufzeit-Helper](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
