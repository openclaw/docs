---
read_when:
    - Sie ändern die eingebettete Agentenlaufzeit oder die Harness-Registrierung
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Schnittstelle für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Plugins für Agent-Harnesses
x-i18n:
    generated_at: "2026-07-24T05:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b672b30cae9071049d6714477ec70a5196aea447f44c3492a5c23310a5e4de2a
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-
Turn. Es ist weder ein Modell-Provider noch ein Kanal oder eine Tool-Registry. Das
benutzerorientierte mentale Modell finden Sie unter [Agent-Laufzeiten](/de/concepts/agent-runtimes).

Verwenden Sie diese Schnittstelle nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, da die Parametertypen absichtlich den
aktuellen eingebetteten Runner abbilden.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie über eine eigene native Sitzungs-
laufzeit verfügt und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist:

- ein nativer Coding-Agent-Server, der Threads und Compaction verwaltet
- eine lokale CLI oder ein Daemon, die bzw. der native Planungs-/Reasoning-/Tool-Ereignisse streamen muss
- eine Modelllaufzeit, die zusätzlich zum OpenClaw-
  Sitzungstranskript eine eigene Fortsetzungs-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs erstellen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was weiterhin dem Core unterliegt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Authentifizierungsstatus der Laufzeit, sofern das Harness nicht angibt, den Authentifizierungs-Bootstrap selbst zu verwalten
- Reasoning-Stufe und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Arbeitsbereich, Sandbox und Tool-Richtlinie
- Callbacks für Kanalantworten und Streaming
- Richtlinie für Modell-Fallback und Live-Modellwechsel

Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine Provider aus, ersetzt nicht die Kanal-
zustellung und wechselt nicht stillschweigend das Modell.

### Harness-eigener Authentifizierungs-Bootstrap

Standardmäßig löst der Core die Provider-Anmeldedaten auf, bevor er ein Harness aufruft. Ein
vertrauenswürdiges Harness, das sich über seine eigene native Laufzeit authentifizieren kann, darf
`authBootstrap: "harness"` in seiner statischen `AgentHarness`-Registrierung setzen. Der Core
überspringt dann seinen generischen Bootstrap für Provider-Anmeldedaten sowie Fehler wegen fehlender Anmeldedaten
bei jedem von diesem Harness übernommenen Versuch.

Der Core leitet weiterhin ein kompatibles, ausdrücklich ausgewähltes oder geordnetes OpenClaw-Authentifizierungs-
profil und dessen bereichsgebundenen Speicher weiter, sofern eines vorhanden ist. Das Harness muss dieses
Profil oder seine nativen Anmeldedaten auflösen, bevor es Modellanfragen stellt, Geheimnisse
auf den Versuch beschränken und umsetzbare Authentifizierungsfehler ausgeben. Setzen Sie
diese Fähigkeit nicht bei einem Harness, das die Authentifizierung nur gelegentlich selbst verwaltet.

### Verifizierte Laufzeitartefakte für die Einrichtung

Ein lokales Harness, das Inferenz für die erstmalige Einrichtung bereitstellen kann, muss die
Implementierung bestätigen, die die Prüfung abgeschlossen hat. Wenn
`params.captureRuntimeArtifact` wahr ist, geben Sie ein opakes
`result.runtimeArtifact` mit einer stabilen ID und einem Inhaltsfingerabdruck zurück. Registrieren Sie eine
entsprechende `runtimeArtifact.validate(...)`-Fähigkeit, die diese Bindung erneut prüft,
ohne ein anderes Harness zu laden oder nicht zugehörige Plugins zu durchsuchen.

Verifizierte OpenClaw-Fortsetzungen übergeben außerdem `params.expectedRuntimeArtifact`.
Das Harness muss diesen Wert mit dem exakten nativen Prozess vergleichen, den es übernommen hat, und
vor dem Starten oder Fortsetzen eines nativen Threads fehlschlagen, wenn sie voneinander abweichen. Bei gewöhnlichen Agent-
Turns fehlen beide Felder, sodass Inhalts-Hashing nicht im normalen Hot Path für Anfragen erfolgt.
Remote-/WebSocket-Harnesses benötigen einen Vertrag zur Serverattestierung, bevor
sie teilnehmen können; eine Versionszeichenfolge allein ist keine Artefaktidentität.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein OpenClaw-eigenes
Richtlinienpaket für Laufzeitentscheidungen, die zwischen OpenClaw und
nativen Harnesses einheitlich bleiben müssen:

- `runtimePlan.tools.normalize(...)` und `runtimePlan.tools.logDiagnostics(...)`
  für Provider-spezifische Richtlinien zu Tool-Schemas
- `runtimePlan.transcript.resolvePolicy(...)` für die Bereinigung von Transkripten und
  die Richtlinie zur Reparatur von Tool-Aufrufen
- `runtimePlan.delivery.isSilentPayload(...)` für gemeinsame `NO_REPLY` und die Unterdrückung
  der Medienzustellung
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung von Modell-
  Fallbacks
- `runtimePlan.observability` für aufgelöste Metadaten zu Provider, Modell und Harness

Harnesses dürfen den Plan für Entscheidungen verwenden, die mit dem Verhalten von OpenClaw
übereinstimmen müssen, müssen ihn jedoch als hosteigenen Status des Versuchs behandeln: Er darf nicht verändert
oder zum Wechseln von Providern/Modellen innerhalb eines Turns verwendet werden.

### Vertrag für den Anfragetransport

`supports(ctx)` empfängt den aufgelösten Modelltransport in `ctx.modelProvider`.
Zwei geheimnisfreie, Provider-eigene Fakten beschreiben die ausgewählte Route:

- `runtimePolicy.compatibleIds` führt die Laufzeit-IDs auf, die der Provider
  als mit dieser konkreten Route kompatibel deklariert. Eine fehlende Richtlinie bedeutet, dass der Provider
  keine Kompatibilität auf Routenebene deklariert hat; sie ist keine Erlaubnis, Unterstützung anzunehmen.
- `requestTransportOverrides: "none"` bedeutet, dass keine ausdrücklich konfigurierte Überschreibung der Provider-/Modellanfrage
  reproduziert werden muss. `"present"` bedeutet, dass ausdrücklich konfigurierte Header, Authentifizierungs-
  transport, Proxy-, TLS-, lokaler Dienst-, privates Netzwerk-Verhalten oder Anfrage-
  parameter vorhanden sind. Das Faktum legt diese Werte nicht offen.

Geben Sie `{ supported: false, reason }` zurück, wenn das Harness den
vorbereiteten Transport nicht reproduzieren kann. Leiten Sie die Unterstützung nach der Auswahl nicht aus der Rohkonfiguration ab.
Wenn die Authentifizierungsvorbereitung mehrere Wiederholungsrouten ergibt, muss ein Harness
alle unterstützen, bevor die Ausführung delegiert wird. Bei impliziter Auswahl wird OpenClaw verwendet, wenn kein Plugin
die vollständige Menge übernehmen kann; eine ausdrückliche oder persistierte Plugin-Auswahl schlägt sicher geschlossen fehl.

## Harness registrieren

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
      : { supported: false, reason: "die effektive Route ist nicht Harness-kompatibel" };
  },

  async runAttempt(params) {
    // Starten Sie Ihren nativen Thread oder setzen Sie ihn fort.
    // Verwenden Sie params.prompt, params.tools, params.images, params.onPartialReply,
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

`authBootstrap` fehlt in diesem generischen Beispiel absichtlich. Fügen Sie
`authBootstrap: "harness"` nur hinzu, wenn das Harness den oben beschriebenen Vertrag erfüllt.

### Delegierte Ausführung

Der Eigentümer eines Harnesses darf `delegatedExecutionPluginIds` auf die IDs vertrauenswürdiger
Plugins setzen, die eine vorhandene, an ein Modell gebundene Sitzung ausführen müssen, etwa ein Sprach-
transport, der eine Codex-gestützte Unterhaltung fortsetzt. Dies ist die statische Zustimmung des Eigentümers,
keine Core-Zulassungsliste. Halten Sie sie eng begrenzt.

Delegierte erhalten ausschließlich die Zulassung von Arbeit und die eingebettete Ausführung. OpenClaw verlangt
den exakt gespeicherten Sitzungsschlüssel, Speicherpfad und die Sitzungs-ID; `modelSelectionLocked:
true`; sowie übereinstimmende Werte für `agentHarnessId` und `agentHarnessRuntimeOverride`.
Die Ausführung wird anschließend über den Harness-Eigentümer begrenzt. Erstellung, Patchen,
Zurücksetzen, Löschen und Archivieren von Sitzungen sowie Gateway-Mutationen bleiben ausschließlich dem Eigentümer vorbehalten.

## Auswahlrichtlinie

OpenClaw wählt nach der Provider-/Modellauflösung ein Harness aus:

1. Die modellspezifische Laufzeitrichtlinie hat Vorrang.
2. Danach folgt die Provider-spezifische Laufzeitrichtlinie.
3. `auto` fragt registrierte Harnesses, ob sie die aufgelöste effektive
   Route unterstützen. Provider-/Modellpräfixe allein wählen niemals ein Harness aus.
4. Wenn kein registriertes Harness übereinstimmt, verwendet OpenClaw seine eingebettete Laufzeit.

Fehler von Plugin-Harnesses werden als Ausführungsfehler ausgegeben. Im Modus `auto` gilt der eingebettete
Fallback nur, wenn kein registriertes Plugin-Harness den aufgelösten
Provider bzw. das Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung übernommen hat, führt OpenClaw
denselben Turn nicht erneut über eine andere Laufzeit aus, da dies
die Authentifizierungs-/Laufzeitsemantik ändern oder Nebeneffekte duplizieren kann.

Die konfigurierte Laufzeitrichtlinie bleibt für die gewünschte Laufzeit maßgeblich. Eine
persistierte Sitzung `agentHarnessId` behält die Verantwortung für ihr natives Transkript,
während die Routen-/Authentifizierungsvorbereitung noch aussteht. Keine der beiden Angaben macht eine inkompatible
Route kompatibel: Sobald vorbereitete Fakten vorliegen, muss das ausgewählte oder festgelegte Harness
sie unterstützen, andernfalls schlägt die Ausführung sicher geschlossen fehl. `/status` zeigt die effektive Laufzeit,
die anhand der Richtlinie, der persistierten Zuständigkeit und der Routenunterstützung ausgewählt wurde.
Der Vorbereitungsstatus ist ausdrücklich angegeben: Ein fehlendes `runtimePolicy` bleibt undeklariert,
statt aus zufällig vorhandenen Transportfeldern abgeleitet zu werden.
Wenn Harness-eigene Authentifizierung mehrere physische Routen unaufgelöst lässt, ist das
vorbereitete Unterstützungsfaktum die Schnittmenge ihrer kompatiblen Laufzeit-IDs und
meldet Anfrageüberschreibungen, falls ein Kandidat solche besitzt. Ein einzelner undeklarierter Kandidat
führt daher zu leerer nativer Kompatibilität; `preparedAuth.source: "harness"`
ist ein Authentifizierungseigentümer und keine Erlaubnis, Routenunterstützung abzuleiten.

Wenn die Auswahl des Harnesses überraschend ist, aktivieren Sie das Debug-Logging `agents/harness`
und prüfen Sie den strukturierten `agent harness selected`-Datensatz des Gateways: Er
enthält die ID des ausgewählten Harnesses, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie
und im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt diese
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliasse gehören in das Plugin
oder in die Betreiberkonfiguration, nicht in den gemeinsamen Laufzeitselektor.

## Kombination aus Provider und Harness

Die meisten Harnesses sollten außerdem einen Provider registrieren. Der Provider macht Modellreferenzen,
Authentifizierungsstatus, Modellmetadaten und die Auswahl von `/model` für den Rest von
OpenClaw sichtbar. Das Harness übernimmt diesen Provider anschließend in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Modellreferenzen für Benutzer: `openai/gpt-5.6-sol`
- Kompatibilitätsreferenzen: Veraltete `codex/gpt-*`-Referenzen werden weiterhin akzeptiert, neue
  Konfigurationen sollten sie jedoch nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, da das Codex-Harness die
  native Codex-Anmeldung/-Sitzung verwaltet
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und überlässt dem
  Harness die Kommunikation mit dem nativen App-Server-Protokoll

Das Codex-Plugin ist additiv. Wenn keine Laufzeitrichtlinie festgelegt ist oder `auto` gilt, darf OpenAI
Codex nur auswählen, wenn sein Provider-eigener Routenvertrag `codex` als
kompatibel deklariert: eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses
ohne ausdrücklich konfigurierte Anfrageüberschreibung. Das Präfix `openai/*` allein wählt
Codex niemals aus. Benutzerdefinierte Endpunkte, Completions-Adapter und ausdrücklich konfiguriertes Anfrage-
verhalten verbleiben bei OpenClaw. Offizielle Klartext-HTTP-Endpunkte werden abgelehnt. Ältere `codex/gpt-*`-
Referenzen bleiben Kompatibilitätseingaben. Siehe
[Implizite OpenAI-Agent-Laufzeit](/de/providers/openai#implicit-agent-runtime).

Informationen zur Einrichtung durch Betreiber, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex-Harness](/de/plugins/codex-harness).

Das Codex-Plugin erzwingt die unter
[Codex-Harness](/de/plugins/codex-harness) dokumentierte Mindestversion des App-Servers. Es prüft den Initialisierungs-Handshake und
blockiert ältere Server oder Server ohne Versionsangabe, sodass OpenClaw nur mit der
getesteten Protokolloberfläche arbeitet.

### Middleware für Tool-Ergebnisse

Gebündelte Plugins und ausdrücklich aktivierte installierte Plugins mit übereinstimmenden
Manifestverträgen können über
`api.registerAgentToolResultMiddleware(...)` laufzeitneutrale Middleware für Tool-Ergebnisse anbinden, wenn ihr Manifest die
anvisierten Laufzeit-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Transformationen von Tool-Ergebnissen vorgesehen, die ausgeführt werden müssen, bevor OpenClaw oder
Codex die Tool-Ausgabe an das Modell zurückgibt.

Ältere gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die ausschließlich für den Codex-App-Server
bestimmt ist, neue Ergebnistransformationen sollten jedoch die laufzeitneutrale API verwenden. Der
nur für den eingebetteten Runner vorgesehene Hook `api.registerEmbeddedExtensionFactory(...)` wurde
entfernt; Transformationen eingebetteter Tool-Ergebnisse müssen laufzeitneutrale Middleware verwenden.

### Klassifizierung des Terminalergebnisses

Native Harnesses, die ihre eigene Protokollprojektion verwalten, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, damit die Fallback-Richtlinie von OpenClaw entscheiden kann, ob ein erneuter Versuch mit einem
anderen Modell erfolgen soll. `planning-only` erfordert das explizite Feld `planText`
des Harnesses; OpenClaw leitet es nicht aus Assistentenprosa ab. Der Helper
lässt Promptfehler, laufende Turns und absichtlich stille
Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Nebeneffekte am Agentenende

Native Harnesses müssen `runAgentEndSideEffects(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` aufrufen, nachdem sie einen Versuch abgeschlossen haben. Dies
löst den portablen Hook `agent_end` und die Forschungserfassung von OpenClaw aus,
ohne interaktive Antworten zu verzögern. Verwenden Sie `awaitAgentEndSideEffects(...)` für
lokale, nicht interaktive Ausführungen, bei denen der Versuch erst abgeschlossen werden darf, wenn diese
Nebeneffekte beendet sind. Beide Helper akzeptieren dieselbe Nutzlast `{ event, ctx }` wie
`runAgentHarnessAgentEndHook(...)`; ihre Fehler verändern das Ergebnis des abgeschlossenen
Versuchs nicht.

### Benutzereingabe- und Tool-Oberflächen

Native Harnesses, die eine Benutzereingabeanforderung auf Laufzeitebene bereitstellen, sollten die
Benutzereingabe-Helper aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, um
den Prompt zu formatieren, ihn über den blockierenden Antwortpfad von OpenClaw zu übermitteln und
Auswahlantworten bzw. Freitextantworten wieder in die native Antwortstruktur der Laufzeit zu normalisieren. Der
Helper sorgt für eine konsistente Darstellung in Kanälen und der TUI, während jedes Harness seine
eigene Protokollanalyse und den Lebenszyklus ausstehender Anforderungen verwaltet.

Native Harnesses, die ein PI-ähnliches kompaktes Tool-Routing benötigen, sollten
`createAgentHarnessToolSurfaceRuntime(...)` aus
`openclaw/plugin-sdk/agent-harness-tool-runtime` verwenden. Es verwaltet
die Auswahl der Steuerung für Tool-Suche und Codemodus, schlanke Standardwerte für lokale Modelle,
laufzeitkompatible Schemafilterung, die Ausführung des verborgenen Katalogs, die
Verzeichnishydratisierung und die Katalogbereinigung. Die Harnesses verwalten weiterhin ihre SDK-spezifische
Tool-Konvertierung und ihren nativen Ausführungs-Callback.

### Nativer Codex-Harness-Modus

Das gebündelte Harness `codex` ist der native Codex-Modus für eingebettete
OpenClaw-Agenten-Turns. Aktivieren Sie zuerst das gebündelte Plugin `codex` und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Zulassungsliste verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` verwenden; OpenAI-Agenten-Turns wählen das Codex-Harness
nur aus, wenn die effektive Route Codex-Kompatibilität deklariert. Ältere Codex-Modell-
Referenzen sollten mit `openclaw doctor --fix` repariert werden, und ältere `codex/*`-
Modellreferenzen bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus ausgeführt wird, verwaltet Codex die native Thread-ID, das Fortsetzungsverhalten,
Compaction und die App-Server-Ausführung. OpenClaw verwaltet weiterhin den Chatkanal,
die sichtbare Transkriptspiegelung, die Tool-Richtlinie, Genehmigungen, die Medienübermittlung und die Sitzungsauswahl.
Verwenden Sie Provider/Modell `agentRuntime.id: "codex"`, wenn Sie
nachweisen müssen, dass ausschließlich der Codex-App-Server-Pfad die Ausführung übernehmen kann. Explizite Plugin-
Laufzeiten schlagen geschlossen fehl; Auswahlfehler des Codex-App-Servers und Laufzeitfehler
werden nicht über eine andere Laufzeit erneut versucht.

## Laufzeitstrenge

Standardmäßig verwendet OpenClaw die Provider/Modell-Laufzeitrichtlinie `auto`: Registrierte
Plugin-Harnesses können kompatible effektive Routen übernehmen, und die eingebettete
Laufzeit verarbeitet den Turn, wenn keines übereinstimmt. Ein Provider/Modell-Präfix allein
wählt niemals ein Harness aus. Verwenden Sie eine explizite Provider/Modell-Plugin-Laufzeit wie
`agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll,
statt über die eingebettete Laufzeit geroutet zu werden. Eine explizite Auswahl macht eine
inkompatible Route nicht kompatibel. Fehler ausgewählter Plugin-Harnesses führen immer zu einem
harten Fehlschlag. Dies blockiert kein explizites Provider/Modell-
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

Ältere Beispiele für Laufzeiten auf Ebene des gesamten Agenten wie dieses werden ignoriert:

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
Harness nicht registriert ist, den aufgelösten Provider bzw. das aufgelöste Modell nicht unterstützt oder
fehlschlägt, bevor Nebeneffekte des Turns entstehen. Dies ist bei reinen Codex-
Bereitstellungen und bei Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad
tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agenten-Harness. Sie deaktiviert nicht
das Provider-spezifische Modell-Routing für Bilder, Videos, Musik, TTS, PDF oder andere Inhalte.

## Native Sitzungen und Transkriptspiegelung

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Fortsetzungs-
Token verwalten. Verknüpfen Sie diese Bindung ausdrücklich mit der OpenClaw-Sitzung und
spiegeln Sie für Benutzer sichtbare Assistenten-/Tool-Ausgaben weiterhin in das OpenClaw-
Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- für Kanäle sichtbaren Sitzungsverlauf
- Transkriptsuche und -indizierung
- den Wechsel zurück zum integrierten OpenClaw-Harness in einem späteren Turn
- generisches Verhalten von `/new`, `/reset` und beim Löschen von Sitzungen

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw
sie löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Kern erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten
Versuch. Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis
über die Ergebnisstruktur des Harnesses zurück, statt selbst Kanalmedien zu
senden.

Dadurch verbleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-
Ausgaben auf demselben Übermittlungspfad wie bei von OpenClaw unterstützten Ausführungen.

Setzen Sie `AgentHarnessAttemptResult.hostOwnedToolMediaUrls` nur für native Artefakte,
die die vertrauenswürdige Harness-Laufzeit selbst erstellt und dauerhaft gespeichert hat. Jeder Eintrag muss
auch in `toolMediaUrls` erscheinen. Nehmen Sie niemals Medien aus vom Modell ausgewählten dynamischen Tools oder
OpenClaw-Tools auf. Bei `message_tool_only`-Routen ermöglicht diese enge Herkunftsangabe,
dass Artefakte der nativen Laufzeit die Unterdrückung der Quellantwort überstehen; die normale Senderichtlinie
und die Zulassung für umgebende Räume gelten weiterhin.

### Terminalergebnisse von Tools

`AgentHarnessAttemptParams.observeToolTerminal` ist der vom Host verwaltete Akkumulator für
Terminalergebnisse. Ein Harness, das dynamische OpenClaw-Tools oder native
Tools ausführt, muss ihn aufrufen, sobald jedes Tool ein Terminalergebnis erreicht, bevor das
Versuchsergebnis abgeschlossen wird. Harnesses, die keine Tools ausführen, müssen ihn nicht
aufrufen.

Melden Sie Fakten von der Ausführungsgrenze:

- Übergeben Sie die Protokollaufruf-ID, sofern vorhanden, den kanonischen Tool-Namen und die
  Argumente, die das Tool nach der Vorbereitung oder nach Hook-Umschreibungen tatsächlich erreicht haben.
- Setzen Sie `executionStarted: false`, wenn Validierung, Genehmigung oder eine andere Schutzmaßnahme
  den Aufruf gestoppt hat, bevor die Tool-Implementierung begann. Sobald eine Weiterleitung
  stattgefunden haben könnte, melden Sie vorsichtshalber `true`.
- Melden Sie `outcome: "success"` oder `outcome: "failure"`. Geben Sie die strukturierten
  Fehlerfelder an, die von der Laufzeit verfügbar sind, statt einen Fehler aus
  Anzeigetext abzuleiten.
- Verwenden Sie `nativeMutation` nur für native Tools, die keine OpenClaw-Tool-
  Definition verwenden. Geben Sie dort protokolleigene Mutations- und Wiederholungsfakten an; kopieren Sie
  den Mutationsklassifikator von OpenClaw nicht in das Harness.

Der Callback gibt die kanonische Auflösung für diesen Aufruf zurück. Übernehmen Sie dessen
`lastToolError` in `AgentHarnessAttemptResult` und verwenden Sie dessen Ausführungs-,
Argument- und Nebeneffektfakten in der Harness-Projektion, statt einen
parallelen Zustand abzuleiten. Der Host behält einen nicht aufgelösten mutierenden Fehler trotz nicht zugehöriger
erfolgreicher Tools bei und löscht ihn erst, nachdem die entsprechende Aktion erfolgreich war.

Der Callback bleibt für die Quellkompatibilität mit älteren experimentellen
Harnesses optional. Optional bedeutet für ein Harness, das Tools ausführt, nicht, dass er ignoriert werden kann:
Ohne Terminalberichte kann OpenClaw den tatsächlichen Fehlerzustand mutierender Tools
über spätere Tool-Aufrufe hinweg nicht bewahren, einschließlich eines stillen Heartbeat-Abschlusses.

### Finalisierung abgeschlossener Tools

OpenClaw benötigt möglicherweise eine letzte sichtbare Antwort, nachdem ein Harness jeden
Tool-Aufruf abgeschlossen hat, sein nativer Turn jedoch ohne Assistententext endete. Ein Harness kann sich
durch Implementierung von `finalizeSettledTurn({ attempt,
settledAttempt })` für diese Wiederherstellung entscheiden.

Der Callback ist eine separate Fähigkeit, kein weiterer gewöhnlicher Versuch. Er muss:

- entweder das exakt eingeschränkte native Transkript oder ein vollständiges Anwendungs-
  transkript verwenden, das bis zur Grenze des abgeschlossenen Tool-Ergebnisses eingefroren ist;
- keine Tools, Fähigkeiten zur Erteilung von Berechtigungen oder zur Benutzereingabe, nativen Ausführungs-
  Hooks, Agenten, Skills, Speicher, Zeitplanung, Erweiterungen oder Fernsteuerung bereitstellen;
- nur den vom Host bereitgestellten Finalisierungs-Prompt senden; und
- geschlossen fehlschlagen, wenn seine ausgewählte Transkript-/Isolierungsstrategie
  diese Einschränkungen nicht durchsetzen kann.

OpenClaw ruft den Callback einmal als abschließende Unteroperation außerhalb der
gewöhnlichen Versuchs- und Wiederholungsschleife auf. Ein Fehler beendet die Ausführung mit der
nebeneffektbewussten Warnung vor einem unvollständigen Turn; er kann nicht in gewöhnliche
Authentifizierungs-/Profilrotation, Modell-Fallback, Kontextwiederherstellung, Compaction-
Fortsetzung oder durch Hooks angeforderte Überarbeitungspfade übergehen. Die Finalisierung überspringt außerdem die Plugin-
Prompt-Mutation, `before_agent_run`, LLM-Eingabe/-Ausgabe, Terminalüberarbeitung und
`agent_end`-Hooks. Die Kerndiagnose zeichnet die Operation und ihren Fehler weiterhin auf.

Der Callback gibt `AgentHarnessSettledTurnFinalizationResult` zurück, kein
gewöhnliches Versuchsergebnis. Seine öffentlichen Felder sind auf die abgeschlossene
Assistentennachricht, die Nutzung des Finalisierungsaufrufs, Metadaten zum Transkriptbesitz und
die diagnostische Ablaufverfolgung beschränkt. Tool-, Übermittlungs-, Medien-, Spawn-, Lebenszyklus-, Wiederholungs-, Sitzungs- und
Fallback-Zustand können diese Ergebnisgrenze nicht überschreiten. Unbekannte Felder und Assistenten-
Tool-Aufrufe schlagen geschlossen fehl.

Ein Harness, das intern seine vollständige Versuchs-Engine wiederverwendet, kann vor der Rückgabe
`projectSettledTurnFinalizationAttemptResult(...)` aufrufen. Der Helper
weist kanonische Fehler-, Tool-, Übermittlungs-, Wiederholungs- und Lebenszyklusnachweise zurück und
projiziert dann nur das eingeschränkte Ergebnis. Dies ist mehrschichtiger Schutz nach der nativen Isolierung
und kein Ersatz für das Entfernen der nativen Fähigkeitsoberfläche.

Ein projektionsgestütztes Harness muss den vollständigen Kontext unter
`settledAttempt.settledTurnFinalizationContext` mit
`source: "openclaw-transcript"` ablegen. Es muss den aktiven Zweig erfassen, nachdem der
abgeschlossene Turn gespiegelt wurde, nachweisen, dass der aktuelle Prompt und jeder aktuelle Tool-
Aufruf bzw. jedes aktuelle Ergebnis bis zu dieser Grenze vorhanden sind, und das resultierende Nachrichten-
Array vor der Rückgabe des Versuchs einfrieren. Der Finalisierer muss einen fehlenden,
nicht unterstützten, mehrdeutigen oder übergroßen Kontext ablehnen. Er darf Nachrichten nicht kürzen,
frühere Verläufe nicht verwerfen und dieses Anwendungstranskript nicht als exakten nativen
Verlauf bezeichnen. Harnesses, die eine eingeschränkte native Sitzung fortsetzen, benötigen dieses
Projektionsfeld nicht.

Implementieren Sie diesen Callback nicht durch einen Aufruf von `runAttempt` mit einem nach bestem Bemühen ermittelten
`disableTools`-Hinweis. Der Eigentümer des Harnesses muss die vollständige native
Fähigkeitsgrenze durchsetzen. OpenClaw stellt keinen generischen Fallback bereit, da es
nicht bestätigen kann, dass eine beliebige native Laufzeit diese Einschränkungen eingehalten hat.

Der Callback bleibt für die Kompatibilität mit experimentellen Harnesses von Drittanbietern
optional. Wenn der ausgewählte Harness ihn nicht bereitstellt, behält OpenClaw den
bestehenden Fehler für unvollständige Durchläufe bei, statt wiederholte Nebenwirkungen zu riskieren.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, einige Typaliase für Versuche/Ergebnisse
  tragen aus Kompatibilitätsgründen jedoch weiterhin Legacy-Namen.
- Die Installation von Harnesses von Drittanbietern ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Runtime benötigen.
- Der Wechsel zwischen Harnesses wird über mehrere Durchläufe hinweg unterstützt. Wechseln Sie den Harness nicht
  während eines Durchlaufs, nachdem native Tools, Genehmigungen, Assistententext oder das Senden
  von Nachrichten begonnen haben.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
