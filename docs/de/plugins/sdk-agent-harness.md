---
read_when:
    - Sie ändern die eingebettete Agentenlaufzeit oder die Harness-Registry
    - Sie registrieren ein Agent-Harness über ein gebündeltes oder vertrauenswürdiges Plugin.
    - Sie müssen verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Schnittstelle für Plugins, die den eingebetteten Low-Level-Agent-Ausführer ersetzen
title: Plugins für den Agent-Harness
x-i18n:
    generated_at: "2026-07-12T15:47:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Ein **Agent-Harness** ist der Low-Level-Ausführer für einen vorbereiteten OpenClaw-Agenten-
Turn. Es ist weder ein Modell-Provider noch ein Kanal oder eine Tool-Registry. Das
benutzerorientierte mentale Modell finden Sie unter [Agenten-Runtimes](/de/concepts/agent-runtimes).

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, da die Parametertypen absichtlich den
aktuellen eingebetteten Runner widerspiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modellfamilie über eine eigene native Sitzungs-
Runtime verfügt und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist:

- ein nativer Coding-Agent-Server, der Threads und Compaction verwaltet
- eine lokale CLI oder ein Daemon, die bzw. der native Planungs-, Reasoning- und Tool-Ereignisse streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-
  Sitzungstranskript eine eigene Fortsetzungs-ID benötigt

Registrieren Sie **kein** Harness, nur um eine neue LLM-API hinzuzufügen. Erstellen Sie für normale HTTP- oder
WebSocket-Modell-APIs ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Wofür der Core weiterhin zuständig ist

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Authentifizierungsstatus, sofern das Harness nicht erklärt, dass es den Authentifizierungs-Bootstrap verwaltet
- Thinking-Level und Kontextbudget
- die OpenClaw-Transkript-/Sitzungsdatei
- Workspace-, Sandbox- und Tool-Richtlinie
- Kanalantwort-Callbacks und Streaming-Callbacks
- Modell-Fallback und Richtlinie für den Live-Modellwechsel

Ein Harness führt einen vorbereiteten Versuch aus; es wählt keine Provider aus, ersetzt nicht die Kanal-
zustellung und wechselt nicht unbemerkt Modelle.

### Harness-eigener Authentifizierungs-Bootstrap

Standardmäßig löst der Core die Provider-Anmeldedaten auf, bevor er ein Harness aufruft. Ein
vertrauenswürdiges Harness, das sich über seine eigene native Runtime authentifizieren kann, darf
`authBootstrap: "harness"` in seiner statischen `AgentHarness`-Registrierung festlegen. Der Core
überspringt dann bei jedem von diesem Harness beanspruchten Versuch seinen generischen Bootstrap für Provider-Anmeldedaten und den Fehler wegen
fehlender Anmeldedaten.

Der Core leitet weiterhin ein kompatibles, explizit ausgewähltes oder geordnetes OpenClaw-Authentifizierungs-
profil und dessen bereichsgebundenen Speicher weiter, sofern eines vorhanden ist. Das Harness muss dieses
Profil oder seine nativen Anmeldedaten auflösen, bevor es Modellanfragen sendet, Geheimnisse
auf den Versuch beschränken und verwertbare Authentifizierungsfehler ausgeben. Legen Sie
diese Fähigkeit nicht für ein Harness fest, das nur manchmal für die Authentifizierung zuständig ist.

### Verifizierte Runtime-Artefakte für die Einrichtung

Ein lokales Harness, das Inferenz für die Ersteinrichtung bereitstellen kann, muss die
Implementierung bestätigen, die die Prüfung abgeschlossen hat. Wenn
`params.captureRuntimeArtifact` den Wert true hat, geben Sie ein undurchsichtiges
`result.runtimeArtifact` mit einer stabilen ID und einem Inhaltsfingerabdruck zurück. Registrieren Sie eine
passende `runtimeArtifact.validate(...)`-Fähigkeit, die diese Bindung erneut prüft,
ohne ein anderes Harness zu laden oder nicht zugehörige Plugins zu durchsuchen.

Verifizierte Crestodian-Fortsetzungen übergeben außerdem `params.expectedRuntimeArtifact`.
Das Harness muss es mit dem tatsächlich abgerufenen nativen Prozess vergleichen und einen Fehler auslösen,
bevor es einen nativen Thread startet oder fortsetzt, falls sie sich unterscheiden. Gewöhnliche Agenten-
Turns lassen beide Felder aus, sodass das Inhalts-Hashing nicht Teil des normalen Hot-Path für Anfragen
ist. Remote-/WebSocket-Harnesses benötigen einen Server-Attestierungsvertrag, bevor
sie teilnehmen können; eine Versionszeichenfolge allein stellt keine Artefaktidentität dar.

Der vorbereitete Versuch enthält außerdem `params.runtimePlan`, ein OpenClaw-eigenes
Richtlinienpaket für Runtime-Entscheidungen, die für OpenClaw und
native Harnesses einheitlich bleiben müssen:

- `runtimePlan.tools.normalize(...)` und `runtimePlan.tools.logDiagnostics(...)`
  für eine Provider-bezogene Richtlinie für Tool-Schemas
- `runtimePlan.transcript.resolvePolicy(...)` für die Bereinigung von Transkripten und
  die Richtlinie zur Reparatur von Tool-Aufrufen
- `runtimePlan.delivery.isSilentPayload(...)` für die gemeinsame Unterdrückung der Zustellung von `NO_REPLY` und Medien
- `runtimePlan.outcome.classifyRunResult(...)` für die Klassifizierung des Modell-Fallbacks
- `runtimePlan.observability` für aufgelöste Provider-/Modell-/Harness-Metadaten

Harnesses dürfen den Plan für Entscheidungen verwenden, die dem Verhalten von OpenClaw entsprechen müssen,
müssen ihn jedoch als hosteigenen Versuchszustand behandeln: Verändern Sie ihn nicht und verwenden
Sie ihn nicht, um innerhalb eines Turns Provider oder Modelle zu wechseln.

### Vertrag für den Anfragetransport

`supports(ctx)` erhält den aufgelösten Modelltransport in `ctx.modelProvider`.
Zwei geheimnisfreie, Provider-eigene Fakten beschreiben die ausgewählte Route:

- `runtimePolicy.compatibleIds` listet die Runtime-IDs auf, die der Provider
  als mit dieser konkreten Route kompatibel deklariert. Eine fehlende Richtlinie bedeutet, dass der Provider
  keine Kompatibilität auf Routenebene deklariert hat; dies ist keine Erlaubnis, Unterstützung anzunehmen.
- `requestTransportOverrides: "none"` bedeutet, dass keine verfasste Überschreibung für Provider-/Modellanfragen
  reproduziert werden muss. `"present"` bedeutet, dass verfasste Header, Authentifizierungs-
  transport-, Proxy-, TLS-, lokale Dienst-, private Netzwerkverhaltensweisen oder Anfrage-
  parameter vorhanden sind. Der Fakt legt diese Werte nicht offen.

Geben Sie `{ supported: false, reason }` zurück, wenn das Harness den
vorbereiteten Transport nicht reproduzieren kann. Leiten Sie die Unterstützung nach der Auswahl nicht durch Lesen der Rohkonfiguration ab.
Wenn die Authentifizierungsvorbereitung mehrere Wiederholungsrouten ergibt, muss ein Harness
alle unterstützen, bevor die Weiterleitung erfolgt. Bei impliziter Auswahl wird OpenClaw verwendet, wenn kein Plugin
den vollständigen Satz übernehmen kann; eine explizite oder persistierte Plugin-Auswahl schlägt geschlossen fehl.

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
      : { supported: false, reason: "Die effektive Route ist nicht mit dem Harness kompatibel" };
  },

  async runAttempt(params) {
    // Starten Sie Ihren nativen Thread oder setzen Sie ihn fort.
    // Verwenden Sie params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent und die anderen vorbereiteten Felder des Versuchs.
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

`authBootstrap` fehlt in diesem allgemeinen Beispiel absichtlich. Fügen Sie
`authBootstrap: "harness"` nur hinzu, wenn das Harness den obigen Vertrag erfüllt.

### Delegierte Ausführung

Der Eigentümer eines Harness kann `delegatedExecutionPluginIds` auf die IDs vertrauenswürdiger
Plugins setzen, die eine vorhandene, an ein Modell gebundene Sitzung ausführen müssen, etwa wenn ein
Sprachtransport eine Codex-gestützte Unterhaltung fortsetzt. Dies ist eine statische Zustimmung des Eigentümers,
keine Allowlist des Kerns. Halten Sie sie eng begrenzt.

Delegierte erhalten ausschließlich die Zulassung von Arbeit und die eingebettete Ausführung. OpenClaw benötigt
den exakten gespeicherten Sitzungsschlüssel, Speicherpfad und die Sitzungs-ID; `modelSelectionLocked:
true`; sowie übereinstimmende Werte für `agentHarnessId` und `agentHarnessRuntimeOverride`.
Die Ausführung wird dann über den Eigentümer des Harness eingegrenzt. Erstellung, Änderung,
Zurücksetzung, Löschung und Archivierung von Sitzungen sowie Gateway-Mutationen bleiben ausschließlich dem Eigentümer vorbehalten.

## Auswahlrichtlinie

OpenClaw wählt nach der Provider-/Modellauflösung ein Harness aus:

1. Die modellspezifische Laufzeitrichtlinie hat Vorrang.
2. Danach folgt die providerspezifische Laufzeitrichtlinie.
3. `auto` fragt registrierte Harnesses, ob sie die aufgelöste effektive
   Route unterstützen. Provider-/Modellpräfixe allein wählen niemals ein Harness aus.
4. Wenn kein registriertes Harness passt, verwendet OpenClaw seine eingebettete Laufzeit.

Fehler eines Plugin-Harness werden als Ausführungsfehler gemeldet. Im Modus `auto` gilt der eingebettete
Fallback nur, wenn kein registriertes Plugin-Harness den aufgelösten
Provider bzw. das aufgelöste Modell unterstützt. Sobald ein Plugin-Harness eine Ausführung übernommen hat, führt OpenClaw
denselben Durchlauf nicht erneut über eine andere Laufzeit aus, da dies
die Authentifizierungs-/Laufzeitsemantik ändern oder Nebeneffekte duplizieren kann.

Die konfigurierte Laufzeitrichtlinie bleibt für die gewünschte Laufzeit maßgeblich. Eine
persistierte Sitzungs-`agentHarnessId` behält die Eigentümerschaft an ihrem nativen Transkript,
während die Routen-/Authentifizierungsvorbereitung noch aussteht. Keine von beiden macht eine inkompatible
Route kompatibel: Sobald vorbereitete Fakten vorliegen, muss das ausgewählte oder angeheftete Harness
sie unterstützen, andernfalls schlägt die Ausführung sicher geschlossen fehl. `/status` zeigt die effektive Laufzeit,
die anhand von Richtlinie, persistierter Eigentümerschaft und Routenunterstützung ausgewählt wurde.
Der vorbereitete Status ist explizit: Eine fehlende `runtimePolicy` bleibt undeklariert,
statt aus zufällig vorhandenen Transportfeldern abgeleitet zu werden.
Wenn die Harness-eigene Authentifizierung mehrere physische Routen unaufgelöst lässt, ist das
vorbereitete Unterstützungsfaktum die Schnittmenge ihrer kompatiblen Laufzeit-IDs und
meldet Anfrageüberschreibungen, falls ein Kandidat solche enthält. Ein undeklarierter Kandidat
macht daher die native Kompatibilität leer; `preparedAuth.source: "harness"`
bezeichnet einen Authentifizierungseigentümer und ist keine Erlaubnis, Routenunterstützung abzuleiten.

Wenn die Auswahl des Harness überraschend ist, aktivieren Sie das Debug-Logging für `agents/harness`
und prüfen Sie den strukturierten Datensatz `agent harness selected` des Gateway: Er
enthält die ID des ausgewählten Harness, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie
und im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Kern behandelt diese
wie eine gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin
oder in die Betreiberkonfiguration, nicht in die gemeinsam genutzte Laufzeitauswahl.

## Kopplung von Provider und Harness

Die meisten Harnesses sollten auch einen Provider registrieren. Der Provider macht Modellreferenzen,
Authentifizierungsstatus, Modellmetadaten und die `/model`-Auswahl für den Rest von
OpenClaw sichtbar. Das Harness übernimmt diesen Provider anschließend in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- bevorzugte Modellreferenzen für Benutzer: `openai/gpt-5.6-sol`
- Kompatibilitätsreferenzen: Veraltete `codex/gpt-*`-Referenzen werden weiterhin akzeptiert, neue
  Konfigurationen sollten sie jedoch nicht als normale Provider-/Modellreferenzen verwenden
- Harness-ID: `codex`
- Authentifizierung: synthetische Provider-Verfügbarkeit, da das Codex-Harness die
  native Codex-Anmeldung/-Sitzung besitzt
- App-Server-Anfrage: OpenClaw sendet die reine Modell-ID an Codex und lässt das
  Harness mit dem nativen App-Server-Protokoll kommunizieren

Das Codex-Plugin ist additiv. Wenn die Laufzeitrichtlinie nicht festgelegt ist oder auf `auto` steht, darf OpenAI
Codex nur auswählen, wenn sein Provider-eigener Routenvertrag `codex` als
kompatibel deklariert: eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses
ohne eigens erstellte Anfrageüberschreibung. Das Präfix `openai/*` allein wählt
Codex niemals aus. Benutzerdefinierte Endpunkte, Completions-Adapter und eigens erstelltes Anfrageverhalten
verbleiben bei OpenClaw. Offizielle Klartext-HTTP-Endpunkte werden abgelehnt. Ältere `codex/gpt-*`-
Referenzen bleiben Kompatibilitätseingaben. Siehe
[Implizite OpenAI-Agent-Laufzeit](/de/providers/openai#implicit-agent-runtime).

Informationen zur Einrichtung durch Betreiber, Beispiele für Modellpräfixe und reine Codex-Konfigurationen finden Sie unter
[Codex-Harness](/de/plugins/codex-harness).

Das Codex-Plugin erzwingt die unter
[Codex-Harness](/de/plugins/codex-harness) dokumentierte Mindestversion des App-Servers. Es prüft den Initialisierungs-Handshake und
blockiert ältere oder nicht versionierte Server, sodass OpenClaw nur mit der
Protokolloberfläche ausgeführt wird, die es getestet hat.

### Middleware für Werkzeugergebnisse

Gebündelte Plugins und ausdrücklich aktivierte installierte Plugins mit übereinstimmenden
Manifestverträgen können über
`api.registerAgentToolResultMiddleware(...)` laufzeitneutrale Middleware für Werkzeugergebnisse anbinden, wenn ihr Manifest die
vorgesehenen Laufzeit-IDs in `contracts.agentToolResultMiddleware` deklariert. Diese vertrauenswürdige
Schnittstelle ist für asynchrone Transformationen von Werkzeugergebnissen vorgesehen, die ausgeführt werden müssen, bevor OpenClaw oder
Codex die Werkzeugausgabe wieder an das Modell übergibt.

Ältere gebündelte Plugins können weiterhin
`api.registerCodexAppServerExtensionFactory(...)` für Middleware verwenden, die ausschließlich für den Codex-App-Server bestimmt ist;
neue Ergebnistransformationen sollten jedoch die laufzeitneutrale API verwenden. Der ausschließlich für den eingebetteten Runner bestimmte
Hook `api.registerEmbeddedExtensionFactory(...)` wurde entfernt; eingebettete Transformationen von Werkzeugergebnissen müssen
laufzeitneutrale Middleware verwenden.

### Klassifizierung des Terminalergebnisses

Native Harnesses, die ihre eigene Protokollprojektion verwalten, können
`classifyAgentHarnessTerminalOutcome(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` verwenden, wenn ein abgeschlossener Turn keinen
sichtbaren Assistententext erzeugt hat. Der Helper gibt `empty`, `reasoning-only` oder
`planning-only` zurück, damit die Fallback-Richtlinie von OpenClaw entscheiden kann, ob mit einem
anderen Modell ein erneuter Versuch erfolgen soll. `planning-only` erfordert das explizite Feld `planText`
des Harnesses; OpenClaw leitet es nicht aus Assistentenprosa ab. Der Helper
lässt Prompt-Fehler, laufende Turns und absichtlich stille
Antworten wie `NO_REPLY` bewusst unklassifiziert.

### Seiteneffekte am Agentenende

Native Harnesses müssen `runAgentEndSideEffects(...)` aus
`openclaw/plugin-sdk/agent-harness-runtime` aufrufen, nachdem sie einen Versuch abgeschlossen haben. Die Funktion
führt den portablen Hook `agent_end` und die Forschungserfassung von OpenClaw aus,
ohne interaktive Antworten zu verzögern. Verwenden Sie `awaitAgentEndSideEffects(...)` für
lokale, nicht interaktive Ausführungen, bei denen der Versuch erst abgeschlossen werden darf, wenn diese
Seiteneffekte beendet sind. Beide Helper akzeptieren dieselbe Nutzlast `{ event, ctx }` wie
`runAgentHarnessAgentEndHook(...)`; ihre Fehler verändern das Ergebnis des abgeschlossenen
Versuchs nicht.

### Benutzereingaben und Tool-Oberflächen

Native Harnesses, die eine Benutzereingabeanforderung auf Runtime-Ebene bereitstellen, sollten die
Benutzereingabe-Helper aus `openclaw/plugin-sdk/agent-harness-runtime` verwenden, um
den Prompt zu formatieren, ihn über den blockierenden Antwortpfad von OpenClaw zuzustellen und
Auswahlantworten beziehungsweise Freitextantworten wieder in die native Antwortstruktur der Runtime zu normalisieren. Der
Helper hält die Darstellung in Kanälen und der TUI konsistent, während jedes Harness seine
eigene Protokollanalyse und den Lebenszyklus ausstehender Anforderungen verwaltet.

Native Harnesses, die ein kompaktes PI-ähnliches Tool-Routing benötigen, sollten
`createAgentHarnessToolSurfaceRuntime(...)` aus
`openclaw/plugin-sdk/agent-harness-tool-runtime` verwenden. Es verwaltet
die Auswahl der Tool-Suche beziehungsweise des Code-Modus, schlanke Standardwerte für lokale Modelle,
Runtime-kompatible Schemafilterung, die Ausführung des verborgenen Katalogs, die
Verzeichnishydrierung und die Katalogbereinigung. Harnesses bleiben weiterhin für ihre SDK-spezifische
Tool-Konvertierung und den nativen Ausführungs-Callback verantwortlich.

### Nativer Codex-Harness-Modus

Das gebündelte `codex`-Harness ist der native Codex-Modus für eingebettete
Agenten-Turns von OpenClaw. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in
`plugins.allow` auf, falls Ihre Konfiguration eine restriktive Positivliste verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` verwenden; OpenAI-Agenten-Turns wählen das Codex-Harness
nur aus, wenn die effektive Route Codex-Kompatibilität deklariert. Veraltete Codex-Modell-
Referenzen sollten mit `openclaw doctor --fix` repariert werden, und veraltete `codex/*`-
Modellreferenzen bleiben Kompatibilitätsaliase für das native Harness.

Wenn dieser Modus ausgeführt wird, verwaltet Codex die native Thread-ID, das Fortsetzungsverhalten,
Compaction und die App-Server-Ausführung. OpenClaw verwaltet weiterhin den Chatkanal,
die sichtbare Transkriptspiegelung, die Tool-Richtlinie, Genehmigungen, die Medienzustellung und die Sitzungsauswahl.
Verwenden Sie für Provider/Modell `agentRuntime.id: "codex"`, wenn Sie
nachweisen müssen, dass ausschließlich der Codex-App-Server-Pfad die Ausführung übernehmen kann. Explizite Plugin-
Runtimes schlagen geschlossen fehl; Auswahlfehler des Codex-App-Servers und Runtime-Fehler
werden nicht über eine andere Runtime erneut versucht.

## Runtime-Striktheit

Standardmäßig verwendet OpenClaw die Runtime-Richtlinie `auto` für Provider/Modell: Registrierte
Plugin-Harnesses können kompatible effektive Routen übernehmen, und die eingebettete
Runtime verarbeitet den Turn, wenn keines übereinstimmt. Ein Provider-/Modellpräfix allein
wählt niemals ein Harness aus. Verwenden Sie eine explizite Plugin-Runtime für Provider/Modell wie
`agentRuntime.id: "codex"`, wenn eine fehlende Harness-Auswahl fehlschlagen soll,
statt über die eingebettete Runtime zu routen. Eine explizite Auswahl macht eine
inkompatible Route nicht kompatibel. Fehler ausgewählter Plugin-Harnesses führen immer zu einem
harten Fehlschlag. Dies blockiert kein explizites
`agentRuntime.id: "openclaw"` für Provider/Modell.

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

Wenn Sie ein CLI-Backend für ein einzelnes kanonisches Modell verwenden möchten, legen Sie die Runtime in diesem
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

Veraltete Runtime-Beispiele für den gesamten Agenten wie dieses werden ignoriert:

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

Bei einer expliziten Plugin-Runtime schlägt eine Sitzung frühzeitig fehl, wenn das angeforderte
Harness nicht registriert ist, den aufgelösten Provider beziehungsweise das Modell nicht unterstützt oder
fehlschlägt, bevor Seiteneffekte des Turns erzeugt werden. Dies ist für reine Codex-
Bereitstellungen und für Live-Tests beabsichtigt, die nachweisen müssen, dass der Codex-App-Server-Pfad
tatsächlich verwendet wird.

Diese Einstellung steuert ausschließlich das eingebettete Agenten-Harness. Sie deaktiviert nicht das
Provider-spezifische Modell-Routing für Bilder, Videos, Musik, TTS, PDF oder andere Formate.

## Native Sitzungen und Transkriptspiegelung

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein serverseitiges Fortsetzungs-
Token verwalten. Halten Sie diese Bindung explizit mit der OpenClaw-Sitzung verknüpft und
spiegeln Sie für Benutzer sichtbare Assistenten- und Tool-Ausgaben weiterhin in das OpenClaw-
Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- den im Kanal sichtbaren Sitzungsverlauf
- Transkriptsuche und -indizierung
- den Wechsel zurück zum integrierten OpenClaw-Harness in einem späteren Turn
- das generische Verhalten von `/new`, `/reset` und beim Löschen von Sitzungen

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw
sie löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Kern erstellt die OpenClaw-Tool-Liste und übergibt sie an den vorbereiteten
Versuch. Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis
über die Ergebnisstruktur des Harnesses zurück, statt selbst Kanalmedien
zu senden.

Dadurch verbleiben Text-, Bild-, Video-, Musik-, TTS-, Genehmigungs- und Messaging-Tool-
Ausgaben auf demselben Zustellungspfad wie von OpenClaw unterstützte Ausführungen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, einige Typaliase für Versuche und Ergebnisse
  tragen aus Kompatibilitätsgründen jedoch weiterhin veraltete Namen.
- Die Installation von Drittanbieter-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie eine native Sitzungs-Runtime benötigen.
- Der Wechsel zwischen Harnesses wird über mehrere Turns hinweg unterstützt. Wechseln Sie das Harness nicht
  mitten in einem Turn, nachdem native Tools, Genehmigungen, Assistententext oder das Senden von
  Nachrichten begonnen haben.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview)
- [Runtime-Helper](/de/plugins/sdk-runtime)
- [Provider-Plugins](/de/plugins/sdk-provider-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Modell-Provider](/de/concepts/model-providers)
