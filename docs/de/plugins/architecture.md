---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Plugin-Capability-Modell oder Eigentumsgrenzen verstehen
    - An der Plugin-Ladepipeline oder Registry arbeiten
    - Provider-Laufzeit-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Capability-Modell, Eigentümerschaft, Verträge, Ladepipeline und Laufzeit-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-22T04:24:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **Referenz für die Tiefenarchitektur**. Praktische Anleitungen finden Sie hier:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzeranleitung
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider Plugins](/de/plugins/sdk-provider-plugins) — einen Modellanbieter erstellen
  - [SDK Overview](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Capability-Modell

Capabilities sind das öffentliche **native Plugin**-Modell innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Capability-Typen:

| Capability             | Registrierungsmethode                            | Beispiel-Plugins                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Text-Inferenz          | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Stimme        | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Bilderzeugung          | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikerzeugung         | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videoerzeugung         | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / Messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Ein Plugin, das null Capabilities registriert, aber Hooks, Tools oder
Services bereitstellt, ist ein **altes reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Capability-Modell ist im Core gelandet und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität braucht weiterhin eine strengere Messlatte als
„es ist exportiert, also ist es eingefroren“.

Aktuelle Richtlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen funktionsfähig halten; behandeln Sie
  dies als Kompatibilitätsbasis
- **neue gebündelte/native Plugins:** explizite Capability-Registrierung bevorzugen statt
  anbieterspezifischer Direktzugriffe oder neuer reiner Hook-Designs
- **externe Plugins, die Capability-Registrierung übernehmen:** erlaubt, aber behandeln Sie die
  Capability-spezifischen Helper-Oberflächen als in Entwicklung, sofern die Dokumentation
  einen Vertrag nicht ausdrücklich als stabil markiert

Praktische Regel:

- Capability-Registrierungs-APIs sind die vorgesehene Richtung
- alte Hooks bleiben während des Übergangs der sicherste Weg ohne Bruch für externe Plugins
- exportierte Helper-Subpaths sind nicht alle gleich; bevorzugen Sie den schmalen dokumentierten
  Vertrag, nicht zufällige Helper-Exporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Capability-Typ (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Capability-Typen (zum Beispiel
  besitzt `openai` Text-Inferenz, Sprache, Medienverständnis und
  Bilderzeugung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Capabilities,
  Tools, Befehle oder Services
- **non-capability** -- registriert Tools, Befehle, Services oder Routen, aber keine
  Capabilities

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Capability-
Aufschlüsselung eines Plugins zu sehen. Siehe [CLI-Referenz](/cli/plugins#inspect) für Details.

### Alte Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für reine Hook-Plugins
unterstützt. Alte reale Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als alt dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Überschreibungen bevorzugen
- `before_prompt_build` für Prompt-Mutationen bevorzugen
- erst entfernen, wenn reale Nutzung sinkt und Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist      |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` machen Ihr Plugin heute kaputt --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Discovery**
   OpenClaw findet potenzielle Plugins aus konfigurierten Pfaden, Workspace-Roots,
   globalen Extension-Roots und gebündelten Erweiterungen. Discovery liest zuerst native
   Manifeste `openclaw.plugin.json` sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt wird.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden in-process über jiti geladen und registrieren
   Capabilities in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Datensätze normalisiert, ohne Laufzeitcode zu importieren.
4. **Oberflächenverbrauch**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Services verfügbar zu machen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche CLI-Modul des Plugins kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw
Root-Befehlsnamen bereits vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung erlaubt es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins
zu erklären und UI-/Schema-Hinweise aufzubauen, bevor die vollständige Laufzeit aktiv ist.

### Channel Plugins und das gemeinsame Message-Tool

Channel Plugins müssen kein separates Tool zum Senden/Bearbeiten/Reagieren für
normale Chat-Aktionen registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Core,
und Channel Plugins besitzen die kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verdrahtung, Sitzungs-/Thread-
  Verwaltung und Ausführungs-Dispatch
- Channel Plugins besitzen bereichsbezogene Action-Discovery, Capability-Discovery und alle
  kanalspezifischen Schemafragmente
- Channel Plugins besitzen anbieter­spezifische Grammatik für Sitzungsunterhaltungen, etwa
  wie Konversations-IDs Thread-IDs kodieren oder von Elternkonversationen erben
- Channel Plugins führen die finale Aktion über ihren Action-Adapter aus

Für Channel Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf erlaubt es einem Plugin, seine sichtbaren Actions, Capabilities und
Schemabeiträge gemeinsam zurückzugeben, sodass diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Parameter des Message-Tools eine Medienquelle trägt, etwa einen
lokalen Pfad oder eine entfernte Medien-URL, sollte das Plugin außerdem
`mediaSourceParams` von `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden,
ohne Plugin-eigene Parameternamen hartzukodieren.
Bevorzugen Sie dort actionspezifische Maps statt einer flachen kanalweiten Liste, damit ein
nur profilbezogener Medienparameter nicht bei nicht verwandten Actions wie
`send` normalisiert wird.

Der Core übergibt Laufzeit-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Kanal kann Message-Actions abhängig vom
aktiven Konto, aktuellen Raum/Thread/Nachricht oder der vertrauenswürdigen Identität des
Anfragenden ausblenden oder einblenden, ohne kanalspezifische Verzweigungen im
gemeinsamen Core-`message`-Tool hartzukodieren.

Deshalb bleiben Änderungen am Routing des eingebetteten Runners weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-
Discovery-Grenze weiterzugeben, damit das gemeinsame `message`-Tool die richtige kanalbezogene
Oberfläche für den aktuellen Turn freigibt.

Für kanalbezogene Ausführungs-Helper sollten gebündelte Plugins die Ausführungslaufzeit
innerhalb ihrer eigenen Extension-Module behalten. Der Core besitzt nicht länger die
Laufzeiten für Message-Actions von Discord, Slack, Telegram oder WhatsApp unter
`src/agents/tools`.
Wir veröffentlichen keine separaten Subpaths `plugin-sdk/*-action-runtime`, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
eigenen Extension-Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt,
soll entweder das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins
verwendet oder die Anforderung in eine schmale generische Capability im gemeinsamen SDK
überführt werden.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum allgemeinen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt das gemeinsame Parsing von Umfragen jetzt bis nach dem Ablehnen
des Actions durch den Plugin-Dispatch, sodass Plugin-eigene Umfrage-Handler kanalspezifische
Umfragefelder akzeptieren können, ohne zuvor vom generischen Umfrageparser blockiert zu werden.

Siehe [Ladepipeline](#load-pipeline) für die vollständige Startsequenz.

## Capability-Eigentumsmodell

OpenClaw behandelt ein natives Plugin als Eigentumsgrenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die vollständige Feature-Oberfläche besitzen,
  die es einführt
- Kanäle sollten gemeinsame Core-Capabilities nutzen, statt Provider-Verhalten ad hoc
  neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt OpenAI-Modell-Provider-Verhalten sowie OpenAI-
  Verhalten für Sprache + Echtzeit-Stimme + Medienverständnis + Bilderzeugung
- das gebündelte Plugin `elevenlabs` besitzt ElevenLabs-Sprachverhalten
- das gebündelte Plugin `microsoft` besitzt Microsoft-Sprachverhalten
- das gebündelte Plugin `google` besitzt Google-Modell-Provider-Verhalten sowie Google-
  Verhalten für Medienverständnis + Bilderzeugung + Websuche
- das gebündelte Plugin `firecrawl` besitzt Firecrawl-Web-Abruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt Qwen-Text-Provider-Verhalten sowie
  Medienverständnis- und Videoerzeugungsverhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Aufruftransport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridge, verwendet aber gemeinsame Capabilities für Sprache
  sowie Echtzeit-Transkription und Echtzeit-Stimme, statt Vendor-Plugins direkt zu
  importieren

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seinen eigenen Oberflächenbereich tun
- Kanäle interessiert nicht, welches Vendor-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Capability-Vertrag, den der Core bereitstellt

Das ist der entscheidende Unterschied:

- **Plugin** = Eigentumsgrenze
- **Capability** = Core-Vertrag, den mehrere Plugins implementieren oder verwenden können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider soll Videoverhalten hartkodieren?“ Die erste Frage lautet „wie sieht
der Core-Capability-Vertrag für Video aus?“ Sobald dieser Vertrag existiert, können
Vendor-Plugins ihn registrieren und Channel-/Feature-Plugins ihn verwenden.

Wenn die Capability noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Capability im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit verfügbar machen
3. Kanäle/Features gegen diese Capability verdrahten
4. Vendor-Plugins Implementierungen registrieren lassen

Dadurch bleibt Eigentum explizit und es wird vermieden, dass Core-Verhalten von einem
einzigen Anbieter oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Capability-Schichtung

Verwenden Sie dieses mentale Modell, um zu entscheiden, wohin Code gehört:

- **Core-Capability-Schicht**: gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln zum
  Zusammenführen von Konfiguration, Zustellungssemantik und typisierte Verträge
- **Vendor-Plugin-Schicht**: anbieterspezifische APIs, Auth, Modellkataloge, Sprach-
  Synthese, Bilderzeugung, künftige Video-Backends, Usage-Endpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration für Slack/Discord/voice-call/etc.,
  die Core-Capabilities nutzt und auf einer Oberfläche präsentiert

Zum Beispiel folgt TTS diesem Muster:

- der Core besitzt TTS-Richtlinien zur Antwortzeit, Fallback-Reihenfolge, Einstellungen und Zustellung an Kanäle
- `openai`, `elevenlabs` und `microsoft` besitzen Synthese-Implementierungen
- `voice-call` verwendet den Laufzeit-Helper für TTS in der Telefonie

Dasselbe Muster sollte für künftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medien-
verständnis, Bilderzeugung, Videoerzeugung, Web-Abruf und Websuche hat,
kann ein Anbieter all seine Oberflächen an einer Stelle besitzen:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Wichtig sind nicht die exakten Helper-Namen. Wichtig ist die Form:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Capability-Verträge
- Channel- und Feature-Plugins verwenden `api.runtime.*`-Helper, nicht Vendor-Code
- Vertragstests können prüfen, dass das Plugin die Capabilities registriert hat, die es
  zu besitzen angibt

### Capability-Beispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Capability. Dasselbe Eigentumsmodell gilt dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Vendor-Plugins registrieren `describeImage`, `transcribeAudio` und
   `describeVideo`, sofern anwendbar
3. Channel- und Feature-Plugins verwenden das gemeinsame Core-Verhalten statt
   direkt Vendor-Code zu verdrahten

Dadurch wird vermieden, Annahmen eines einzelnen Providers über Video in den Core einzubrennen. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Capability-Vertrag und das Fallback-Verhalten.

Die Videoerzeugung verwendet bereits dieselbe Reihenfolge: Der Core besitzt den typisierten
Capability-Vertrag und den Laufzeit-Helper, und Vendor-Plugins registrieren
Implementierungen über `api.registerVideoGenerationProvider(...)`.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist bewusst typisiert und zentralisiert in
`OpenClawPluginApi`. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeit-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Eigentümerschaft ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierung angezeigt werden
- Vertragstests können Eigentümerschaft gebündelter Plugins durchsetzen und lautloses Driften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Eigentümerschaft explizit prüfen kann. Heute wird dies für Modell-
   Provider, Sprach-Provider, Websuche-Provider und Eigentümerschaft gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw von vornherein weiß, welches Plugin welche
Oberfläche besitzt. Das erlaubt es Core und Kanälen, nahtlos zu komponieren, weil Eigentümerschaft
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- capability-spezifisch
- vom Core besessen
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- im Core versteckte anbieterspezifische Richtlinien
- einmalige plugin-spezifische Escape-Hatches, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc-Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel die Abstraktionsebene anheben: zuerst die Capability definieren, dann
Plugins daran andocken lassen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **in-process** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren
- ein Bug in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als
Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das größtenteils gebündelte
Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Entwicklungszeit-Code, nicht als Produktionsstandard.

Halten Sie bei gebündelten Workspace-Paketnamen die Plugin-ID im npm-
Namen verankert: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket bewusst eine engere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  bewusst die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/allowlistet ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Export-Grenze

OpenClaw exportiert Capabilities, nicht Implementierungsbequemlichkeit.

Halten Sie die Capability-Registrierung öffentlich. Kürzen Sie nichtvertragliche Helper-Exporte:

- Helper-Subpaths für gebündelte Plugins
- Laufzeit-Plumbing-Subpaths, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins bleiben aus Kompatibilitäts- und Wartungsgründen
weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte für Implementierungsdetails, nicht als empfohlenes SDK-Muster für
neue Plugins von Drittanbietern.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. potenzielle Plugin-Roots entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein alter Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeitoberflächen verfügbar machen

<Note>
`activate` ist ein alter Alias für `register` — der Loader löst das jeweils vorhandene auf (`def.register ?? def.activate`) und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; für neue Plugins `register` bevorzugen.
</Note>

Die Sicherheitsschranken greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Entry dem Plugin-Root entkommt, der Pfad weltweit beschreibbar ist oder
die Pfadeigentümerschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Capabilities zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu erhalten, ohne die Plugin-Laufzeit zu laden

Für native Plugins ist das Laufzeitmodul der Data-Plane-Teil. Es registriert tatsächliches
Verhalten wie Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale Manifest-Blöcke `activation` und `setup` bleiben in der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Discovery;
sie ersetzen nicht Laufzeitregistrierung, `register(...)` oder `setupEntry`.
Die ersten Live-Aktivierungskonsumenten verwenden jetzt Manifest-Hinweise zu Befehl, Kanal und Provider,
um das Laden von Plugins einzugrenzen, bevor eine breitere Materialisierung der Registry erfolgt:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Channel-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Laufzeitauflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Die Setup-Discovery bevorzugt jetzt Deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor auf
`setup-api` für Plugins zurückgegriffen wird, die weiterhin Laufzeit-Hooks zur Setup-Zeit benötigen. Wenn mehr als
ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-ID beansprucht,
lehnt die Setup-Suche den mehrdeutigen Eigentümer ab, statt sich auf die Discovery-Reihenfolge
zu verlassen.

### Was der Loader zwischenspeichert

OpenClaw hält kurze In-Process-Caches für:

- Discovery-Ergebnisse
- Manifest-Registry-Daten
- geladene Plugin-Registries

Diese Caches reduzieren spitzenartige Starts und den wiederholten Overhead von Befehlen. Sie können sie
als kurzlebige Performance-Caches betrachten, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins mutieren nicht direkt irgendwelche zufälligen globalen Core-Variablen. Sie registrieren sich in
einer zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Herkunft, Status, Diagnosen)
- Tools
- alte Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- Plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu
kommunizieren. Das hält das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Verbrauch

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Conversation-Binding

Plugins, die eine Unterhaltung binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
Anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Payload:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: das aufgelöste Binding für genehmigte Anfragen
- `request`: die ursprüngliche Anfragesummary, Hinweis zum Trennen, Sender-ID und
  Metadaten der Unterhaltung

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine Unterhaltung binden darf,
und er läuft, nachdem die Core-Behandlung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für günstiges Lookup von env-basierter Provider-Auth
  vor dem Laden der Laufzeit, `providerAuthAliases` für Provider-Varianten, die
  Auth teilen, `channelEnvVars` für günstiges env-/Setup-Lookup von Kanälen vor dem Laden der Laufzeit,
  sowie `providerAuthChoices` für günstige Labels bei Onboarding/Auth-Auswahl und
  Metadaten zu CLI-Flags vor dem Laden der Laufzeit
- Hooks zur Konfigurationszeit: `catalog` / altes `discovery` sowie `applyConfigDefaults`
- Laufzeit-Hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agentenschleife, Failover, Transcript-Behandlung und
Tool-Richtlinien. Diese Hooks sind die Erweiterungsoberfläche für anbieter­spezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenztransport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider env-basierte Zugangsdaten hat,
die generische Auth-/Status-/Modellauswahlpfade sehen sollen, ohne die Plugin-
Laufzeit zu laden. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die
env-Variablen, Auth-Profile, konfigurationsgestützte Auth und API-Key-Onboarding-Auswahl
einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
CLI-Oberflächen für Onboarding/Auth-Auswahl die Choice-ID des Providers, Gruppenlabels und einfache
Auth-Verdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie Provider-Laufzeit-
`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder Setup-Variablen für OAuth-
Client-ID/Client-Secret bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Auth oder Setup hat, die
generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne die Kanal-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist der schnelle Entscheidungsleitfaden.

| #   | Hook                              | Was er tut                                                                                                     | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht die Provider-Konfiguration in `models.providers` während der Generierung von `models.json`      | Der Provider besitzt einen Katalog oder Standardwerte für Base-URLs                                                                         |
| 2   | `applyConfigDefaults`             | Wendet provider-eigene globale Konfigurationsstandardwerte während der Materialisierung der Konfiguration an   | Standardwerte hängen von Auth-Modus, env oder der Semantik der Provider-Modellfamilie ab                                                   |
| --  | _(built-in model lookup)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalisiert alte oder Preview-Modell-ID-Aliasse vor dem Lookup                                                | Der Provider besitzt die Bereinigung von Aliasen vor der kanonischen Modellauflösung                                                       |
| 4   | `normalizeTransport`              | Normalisiert `api` / `baseUrl` einer Provider-Familie vor dem generischen Modellaufbau                         | Der Provider besitzt die Transportbereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                            |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                      | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Helper der Google-Familie stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet Rewrites für die Kompatibilität nativer Streaming-Nutzung auf Konfigurationsprovider an                 | Der Provider benötigt endpointgesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                           |
| 7   | `resolveConfigApiKey`             | Löst Env-Marker-Auth für Konfigurationsprovider vor dem Laden der Laufzeit-Auth auf                            | Der Provider hat provider-eigene API-Key-Auflösung per Env-Marker; `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/self-hosted oder konfigurationsgestützte Auth sichtbar, ohne Klartext zu persistieren             | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                |
| 9   | `resolveExternalAuthProfiles`     | Legt provider-eigene externe Auth-Profile darüber; Standard-`persistence` ist `runtime-only` für CLI-/App-eigene Credentials | Der Provider verwendet externe Auth-Credentials wieder, ohne kopierte Refresh-Tokens zu persistieren                                       |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuft gespeicherte synthetische Profilplatzhalter hinter env-/konfigurationsgestützte Auth zurück             | Der Provider speichert synthetische Platzhalterprofile, die in der Priorität nicht gewinnen sollen                                         |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry stehen              | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                 | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 13  | `normalizeResolvedModel`          | Letztes Rewrite, bevor der eingebettete Runner das aufgelöste Modell verwendet                                 | Der Provider benötigt Transport-Rewrites, verwendet aber weiterhin einen Core-Transport                                                     |
| 14  | `contributeResolvedModelCompat`   | Liefert Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport bei                | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                          |
| 15  | `capabilities`                    | Provider-eigene Transcript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden                | Der Provider benötigt Besonderheiten bei Transcript/Provider-Familie                                                                        |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie sieht                                             | Der Provider benötigt schemabezogene Bereinigung für eine Transportfamilie                                                                  |
| 17  | `inspectToolSchemas`              | Macht provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar                                         | Der Provider möchte Warnungen zu Schlüsselwörtern, ohne dem Core provider­spezifische Regeln beizubringen                                  |
| 18  | `resolveReasoningOutputMode`      | Wählt nativen vs. getaggten Vertrag für Reasoning-Ausgaben                                                     | Der Provider benötigt getaggte Reasoning-/Final-Ausgabe statt nativer Felder                                                               |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Wrappern für Stream-Optionen                              | Der Provider benötigt Standard-Anfrageparameter oder providerbezogene Bereinigung von Parametern                                            |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                          | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                      |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Der Provider benötigt Wrapper für Anfrage-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                             |
| 22  | `resolveTransportTurnState`       | Hängt native turnbezogene Transport-Header oder Metadaten an                                                   | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder Richtlinien für Session-Cooldown an                                         | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                      |
| 24  | `formatApiKey`                    | Auth-Profil-Formatter: gespeichertes Profil wird zur Laufzeit-Zeichenfolge `apiKey`                            | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinien           | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                             |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                           | Der Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                                                     | Der Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                          |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung des Failover-Grunds                                                            | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                       |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                     | Der Provider benötigt proxyspezifisches TTL-Gating für Cache                                                                               |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                       | Der Provider benötigt einen provider­spezifischen Wiederherstellungshinweis für fehlende Auth                                              |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                       | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                            |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen werden nach der Discovery angehängt                                          | Der Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Pickern                                                      |
| 33  | `resolveThinkingProfile`          | Modellspezifische `/think`-Stufe, Anzeigelabels und Standardwert                                               | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Ladder oder ein binäres Label bereit                         |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für Ein/Aus-Toggle von Reasoning                                                          | Der Provider unterstützt Reasoning nur binär als Ein/Aus                                                                                    |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                       | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für die Standardstufe von `/think`                                                        | Der Provider besitzt die Standardrichtlinie für `/think` in einer Modellfamilie                                                            |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Der Provider besitzt das Matching bevorzugter Modelle für Live/Smoke                                                                        |
| 38  | `prepareRuntimeAuth`              | Tauscht ein konfiguriertes Credential unmittelbar vor der Inferenz in den tatsächlichen Laufzeit-Token/-Schlüssel um | Der Provider benötigt einen Token-Austausch oder ein kurzlebiges Anfrage-Credential                                                        |
| 39  | `resolveUsageAuth`                | Löst Credentials für Nutzung/Abrechnung für `/usage` und zugehörige Statusoberflächen auf                    | Der Provider benötigt benutzerdefiniertes Parsen von Usage-/Quota-Tokens oder ein anderes Usage-Credential                                 |
| 40  | `fetchUsageSnapshot`              | Holt und normalisiert provider­spezifische Nutzungs-/Quota-Snapshots, nachdem Auth aufgelöst wurde           | Der Provider benötigt einen provider­spezifischen Usage-Endpunkt oder Payload-Parser                                                       |
| 41  | `createEmbeddingProvider`         | Baut einen provider-eigenen Embedding-Adapter für Speicher/Suche                                               | Verhalten für Speicher-Embeddings gehört zum Provider-Plugin                                                                                |
| 42  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Transcript-Behandlung für den Provider steuert                    | Der Provider benötigt eine benutzerdefinierte Transcript-Richtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                          |
| 43  | `sanitizeReplayHistory`           | Schreibt die Replay-Historie nach der generischen Transcript-Bereinigung um                                    | Der Provider benötigt provider­spezifische Replay-Rewrites über gemeinsame Compaction-Helper hinaus                                        |
| 44  | `validateReplayTurns`             | Finale Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                               | Der Provider-Transport benötigt nach generischer Bereinigung eine strengere Validierung von Turns                                          |
| 45  | `onModelSelected`                 | Führt provider-eigene Nebenwirkungen nach der Modellauswahl aus                                                | Der Provider benötigt Telemetrie oder provider-eigenen Status, wenn ein Modell aktiv wird                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
gematchte Provider-Plugin und fallen dann auf andere hookfähige Provider-Plugins zurück,
bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. Dadurch bleiben
Alias-/Kompatibilitäts-Provider-Shims funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin das Rewrite besitzt. Wenn kein Provider-Hook einen unterstützten
Konfigurationseintrag der Google-Familie umschreibt, greift weiterhin der gebündelte Google-Konfigurations-
Normalizer für diese Kompatibilitätsbereinigung.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten
Anfrage-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für
Provider-Verhalten gedacht, das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

### Provider-Beispiel

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Eingebaute Beispiele

- Anthropic verwendet `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es die Vorwärtskompatibilität für Claude 4.6,
  Hinweise zur Provider-Familie, Anleitungen zur Auth-Reparatur, die Integration des
  Usage-Endpunkts, die Eignung für Prompt-Cache, Auth-bewusste Konfigurationsstandardwerte, die
  Standard-/adaptive Thinking-Richtlinie für Claude und Anthropic-spezifisches Stream-Shaping für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Anthropic-spezifische Stream-Helper für Claude bleiben vorerst in der eigenen
  öffentlichen Nahtstelle `api.ts` / `contract-api.ts` des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Wrapper-Builder für Anthropic, statt das generische SDK anhand der
  Beta-Header-Regeln eines einzelnen Providers zu verbreitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` und `isModernModelRef`,
  weil es die Vorwärtskompatibilität für GPT-5.4, die direkte
  Normalisierung `openai-completions` -> `openai-responses` für OpenAI, Codex-bewusste Auth-
  Hinweise, Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die Thinking- /
  Live-Model-Richtlinie für GPT-5 besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche,
  Shaping der Payload für Reasoning-Kompatibilität und Kontextverwaltung für Responses.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs verfügbar machen kann, bevor der statische Katalog von OpenClaw aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  provider­spezifische Anfrage-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle / von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  provider-eigenen Geräte-Login, Modell-Fallback-Verhalten, Claude-Transcript-
  Besonderheiten, einen Austausch GitHub-Token -> Copilot-Token und einen provider-eigenen Usage-
  Endpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf Core-OpenAI-Transporten läuft, aber seine Transport-/Base-URL-
  Normalisierung, OAuth-Refresh-Fallback-Richtlinie, Standardwahl für den Transport,
  synthetische Codex-Katalogzeilen und Integration des ChatGPT-Usage-Endpunkts besitzt; es
  teilt sich dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` den Vorwärtskompatibilitäts-Fallback für Gemini 3.1,
  native Gemini-Replay-Validierung, Sanitisierung des Bootstrap-Replays, den getaggten
  Modus für Reasoning-Ausgaben und das Matching moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Thinking-Payload von Gemini besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und Verdrahtung des
  Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, damit Claude-spezifische Replay-Bereinigung auf
  Claude-IDs beschränkt bleibt statt auf jeden Transport `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveThinkingProfile`, weil es
  Bedrock-spezifische Klassifizierung von Fehlern für Throttle/Nicht-bereit/Kontextüberlauf
  bei Anthropic-on-Bedrock-Verkehr besitzt; seine Replay-Richtlinie teilt sich weiterhin dieselbe
  nur-Claude-Schranke `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und eine Sanitisierung von
  Thinking-Signaturen für Gemini benötigen, jedoch ohne native Gemini-Replay-Validierung oder
  Bootstrap-Rewrites.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Message- als auch OpenAI-kompatible Semantik besitzt; dadurch bleibt das Entfernen
  von Thinking-Blöcken nur für Claude auf der Anthropic-Seite erhalten, während der
  Modus für Reasoning-Ausgaben wieder auf nativ zurückgesetzt wird, und die Stream-Familie
  `minimax-fast-mode` besitzt Umschreibungen für Fast-Mode-Modelle auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog`, `resolveThinkingProfile` und `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber provider-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Status auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Anfrage-Header,
  Normalisierung der Reasoning-Payload, Hinweise zu Gemini-Transcripts und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält Kilo-Thinking-
  Injektion auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es den GLM-5-Fallback,
  Standardwerte für `tool_stream`, binäre Thinking-UX, Matching moderner Modelle und sowohl
  Usage-Auth als auch Quota-Abruf besitzt; die Stream-Familie `tool-stream-default-on` hält
  den standardmäßig aktivierten Wrapper `tool_stream` aus handgeschriebenem Glue pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es die Normalisierung für nativen xAI-Responses-Transport, Umschreibungen von
  Grok-Fast-Mode-Aliasen, Standardwerte für `tool_stream`, Bereinigung für Strict-Tool / Reasoning-Payload,
  Fallback-Wiederverwendung von Auth für plugin-eigene Tools, Vorwärtskompatibilitäts-
  Auflösung für Grok-Modelle und provider-eigene Kompatibilitätspatches wie xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Schlüsselwörter, natives `web_search` und Dekodierung von Tool-Call-
  Argumenten mit HTML-Entities besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Transcript-/Tooling-Besonderheiten aus dem Core herauszuhalten.
- Gebündelte reine Katalog-Provider wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videoerzeugung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten plugin-eigen ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Helper

Plugins können über `api.runtime` auf ausgewählte Core-Helper zugreifen. Für TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Hinweise:

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Dateiflächen/Sprachnotizflächen zurück.
- Verwendet Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider resamplen/kodieren.
- `listVoices` ist je nach Provider optional. Verwenden Sie es für provider-eigene Voice-Picker oder Setup-Abläufe.
- Sprachlisten können reichhaltigere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

Plugins können außerdem Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Hinweise:

- Behalten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Sprach-Provider für vendor-eigenes Syntheseverhalten.
- Alte Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Eigentumsmodell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Sprach-, Bild- und künftige Medien-Provider besitzen, wenn OpenClaw diese
  Capability-Verträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt eines generischen Key/Value-Bags:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Hinweise:

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core.
- Behalten Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Die Videoerzeugung folgt bereits demselben Muster:
  - der Core besitzt den Capability-Vertrag und den Laufzeit-Helper
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeit-Helper zum Medienverständnis können Plugins Folgendes aufrufen:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Für Audiotranskription können Plugins entweder die Laufzeit für Medienverständnis
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für
  Bild-/Audio-/Videoverständnis.
- Verwendet die Core-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können außerdem Hintergrundläufe von Subagenten über `api.runtime.subagent` starten:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Hinweise:

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` explizit zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Nicht vertrauenswürdige Läufe von Plugin-Subagenten funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helper verwenden, statt
in die Verdrahtung des Agenten-Tools einzugreifen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins können Websuche-Provider außerdem über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung von Credentials und gemeinsame Anfragesemantik im Core.
- Verwenden Sie Websuche-Provider für vendorspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Agenten-Tool-Wrapper abhängig zu sein.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für Bilderzeugung erzeugen.
- `listProviders(...)`: verfügbare Provider für Bilderzeugung und ihre Capabilities auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte mit `api.registerHttpRoute(...)` bereitstellen.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Routenfelder:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Auth/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie Fallthrough-Ketten für `exact`/`prefix` nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Laufzeit-Scopes des Operators. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Aufrufe von Gateway-Helpern.
- Routen mit `auth: "gateway"` laufen innerhalb eines Laufzeit-Scope für Gateway-Anfragen, aber dieser Scope ist bewusst konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Laufzeit-Scopes für Plugin-Routen auf `operator.write` festgenagelt, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identitätsträgern (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routenanfragen mit Identitätsträgern fehlt, fällt der Laufzeit-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine pluginbezogene Route mit Gateway-Auth implizit eine Admin-Oberfläche ist. Wenn Ihre Route Admin-only-Verhalten benötigt, verlangen Sie einen HTTP-Auth-Modus mit Identitätsträgern und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie beim Schreiben von Plugins SDK-Subpaths statt des monolithischen Imports `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` für Primitive zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas `openclaw.json` auf Root-Ebene
  (`OpenClawSchema`).
- Stabile Channel-Primitive wie `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` und
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Auth/Antworten/Webhooks.
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Mention-Matching,
  Helper für eingehende Mention-Richtlinien, Envelope-Formatierung und Kontext-Helper für eingehende Envelopes.
  `channel-setup` ist die schmale Setup-Nahtstelle für optionale Installationen.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich der importsicheren Patch-Adapter für Setup.
  `setup-adapter-runtime` ist die env-bewusste Adapter-Nahtstelle für Konto-Setup.
  `setup-tools` ist die kleine Nahtstelle für CLI-/Archiv-/Dokumentations-Helper (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain-Subpaths wie `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` und
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurations-Helper.
  `telegram-command-config` ist die schmale öffentliche Nahtstelle für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt verfügbar, selbst wenn die Oberfläche des gebündelten
  Telegram-Vertrags vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Nahtstelle für Text/Markdown/Logging, einschließlich
  des Entfernens von für den Assistant sichtbarem Text, Helpern zum Rendern/Chunking von Markdown, Helpern für Redaction,
  Helpern für Directive-Tags und Safe-Text-Utilities.
- Approval-spezifische Channel-Seams sollten bevorzugt einen einzelnen Vertrag `approvalCapability`
  auf dem Plugin verwenden. Der Core liest dann Auth, Zustellung, Rendering,
  natives Routing und Verhalten für lazy native Handler über diese eine Capability,
  statt Approval-Verhalten in nicht zusammenhängende Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitätshim für ältere Plugins erhalten. Neuer Code sollte stattdessen die engeren
  generischen Primitive importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Gebündelte Extension-Interna bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpaths verwenden. OpenClaw-Core-/Test-Code darf die
  öffentlichen Repo-Einstiegspunkte unter einem Plugin-Paket-Root wie `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng begrenzte Dateien wie
  `login-qr-api.js` verwenden. Importieren Sie niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Erweiterung.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Helper/Typen,
  `<plugin-package-root>/runtime-api.js` ist das reine Laufzeit-Barrel,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt des gebündelten Plugins,
  und `<plugin-package-root>/setup-entry.js` ist der Setup-Einstiegspunkt des Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helper wie
    `wrapAnthropicProviderStream`, Helper für Beta-Header und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Helper für Standardmodelle und
    Realtime-Provider-Builder.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Helper für Onboarding/Konfiguration,
    während `register.runtime.js` weiterhin generische
    Helper `plugin-sdk/provider-stream` für repo-lokale Verwendung re-exportieren kann.
- Öffentlich zugängliche Einstiegspunkte, die über Fassaden geladen werden, bevorzugen den aktiven Laufzeit-Snapshot der Konfiguration,
  wenn einer existiert, und fallen andernfalls auf die auf Datenträger aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Laufzeit-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Ein kleiner
  reservierter Kompatibilitätssatz an helperbezogenen Channel-Seams gebündelter Marken existiert weiterhin.
  Behandeln Sie diese als Wartungs-/Kompatibilitäts-Seams für Bundles, nicht als neue Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen `plugin-sdk/*`-Subpaths oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeiden Sie das Root-Barrel `openclaw/plugin-sdk` für neuen Code.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Subpaths für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der vorgesehene Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Ziel-Parsing/-Matching gehört auf `openclaw/plugin-sdk/channel-targets`.
  Message-Action-Gates und Reaktions-Helper für Nachrichten-IDs gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Erweiterungsspezifische Helper-Barrels gebündelter Erweiterungen sind standardmäßig nicht stabil. Wenn ein
  Helper nur von einer gebündelten Erweiterung benötigt wird, behalten Sie ihn hinter der
  lokalen Nahtstelle `api.js` oder `runtime-api.js` der Erweiterung, statt ihn in
  `openclaw/plugin-sdk/<extension>` hochzustufen.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht kanalgebrandet. Gemeinsames Ziel-
  Parsing gehört auf `openclaw/plugin-sdk/channel-targets`; kanalspezifische
  Interna bleiben hinter dem lokalen `api.js`- oder `runtime-api.js`-
  Seam des besitzenden Plugins.
- Capability-spezifische Subpaths wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie
  heute verwenden. Ihre Existenz bedeutet nicht automatisch, dass jeder exportierte Helper ein
  langfristig eingefrorener externer Vertrag ist.

## Schemas für das Message-Tool

Plugins sollten kanalspezifische Schemabeiträge in `describeMessageTool(...)`
für nicht nachrichtenbezogene Primitive wie Reaktionen, Lesevorgänge und Umfragen besitzen.
Gemeinsame Präsentation für das Senden sollte den generischen Vertrag `MessagePresentation`
statt provider-nativer Felder für Buttons, Komponenten, Blöcke oder Karten verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für Vertrag,
Fallback-Regeln, Provider-Mapping und Checkliste für Plugin-Autoren.

Plugins mit Sendefähigkeit deklarieren über Message-Capabilities, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen mit angehefteter Zustellung

Der Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine provider-nativen UI-Escape-Hatches aus dem generischen Message-Tool bereit.
Veraltete SDK-Helper für alte native Schemas bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Kanalzielen

Channel Plugins sollten kanalspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Directory-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zu einer id-artigen Auflösung springen soll statt in die Directory-Suche zu gehen.
- `messaging.targetResolver.resolveTarget(...)` ist der Fallback des Plugins, wenn der
  Core nach Normalisierung oder nach einem Directory-Fehlschlag eine finale provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die provider­spezifische Konstruktion von Sitzungsrouten,
  sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor dem
  Suchen nach Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen vom Typ „als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für provider­spezifischen Normalisierungs-Fallback, nicht für
  breite Directory-Suche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder provider­spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie das, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Zuordnungen
- kontobezogene statische Directory-Fallbacks

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Operationen:

- Query-Filterung
- Anwenden von Limits
- Deduplizierungs-/Normalisierungs-Helper
- Aufbau von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen einzelnen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin provider­spezifische Modell-IDs, Standardwerte für Base-URLs
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere verwandte Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als alter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Nur-Lese-Inspektion von Kanälen

Wenn Ihr Plugin einen Kanal registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Es darf annehmen, dass Credentials
  vollständig materialisiert sind, und bei fehlenden erforderlichen Secrets schnell fehlschlagen.
- Nur-Lese-Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Konfigurations-
  Reparaturabläufe sollten keine Laufzeit-Credentials materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Wenn relevant, Felder für Credential-Quelle/-Status einschließen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um Nur-Lese-
  Verfügbarkeit zu melden. Es genügt, `tokenStatus: "available"` (und das passende Quellenfeld)
  für statusartige Befehle zurückzugeben.
- Verwenden Sie `configured_unavailable`, wenn ein Credential über SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar ist.

Dadurch können Nur-Lese-Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Paket-Packs

Ein Plugin-Verzeichnis kann eine `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Erweiterungen aufführt, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, sodass
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die dem Paketverzeichnis entkommen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie die Abhängigkeitsbäume von Plugins
„reines JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges reines Setup-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch unkonfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegs. Das hält Start und Setup leichter,
wenn Ihr Haupteinstieg des Plugins auch Tools, Hooks oder anderen nur laufzeitbezogenen
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin auch in der
Pre-Listen-Startphase des Gateways auf denselben `setupEntry`-Pfad setzen, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die existieren muss,
bevor das Gateway zu lauschen beginnt. In der Praxis bedeutet das, dass der Setup-Eintrag
jede kanalbezogene Capability registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway beginnt zu lauschen
- alle Gateway-Methoden, Tools oder Services, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Einstieg weiterhin eine erforderliche Start-Capability besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw den
vollständigen Einstieg beim Start laden.

Gebündelte Kanäle können auch reines Setup-Helper für Vertragsoberflächen veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Kanallaufzeit geladen wird. Die aktuelle Oberfläche für Setup-
Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine alte Einzelkonto-Kanalkonfiguration
nach `channels.<id>.accounts.*` promoten muss, ohne den vollständigen Plugin-Einstieg zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes promotetes Konto, wenn bereits benannte Konten existieren, und es kann einen
konfigurierten nicht-kanonischen Standardkontoschlüssel erhalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery gebündelter Vertragsoberflächen lazy. Die Importzeit bleibt leicht; die
Promotionsoberfläche wird nur bei erster Verwendung geladen, statt
beim Modulimport erneut in den Start gebündelter Kanäle einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie auf einem
plugin­spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen schmaleren Scope anfordert.

Beispiel:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel-Katalogmetadaten

Channel Plugins können Metadaten für Setup/Discovery über `openclaw.channel` und
Installationshinweise über `openclaw.install` veröffentlichen. Dadurch bleiben die Katalogdaten im Core frei von Daten.

Beispiel:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Nützliche Felder von `openclaw.channel` über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Dokumentationslink
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerelemente für Text auf Auswahlschnittstellen
- `markdownCapable`: markiert den Kanal als markdownfähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen für konfigurierte Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal als intern/privat für Oberflächen zur Dokumentationsnavigation
- `showConfigured` / `showInSetup`: alte Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: nimmt den Kanal in den standardmäßigen Quickstart-Ablauf `allowFrom` auf
- `forceAccountBinding`: erzwingt explizites Account-Binding, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann außerdem **externe Channel-Kataloge** zusammenführen (zum Beispiel einen MPM-
Registry-Export). Legen Sie eine JSON-Datei an einem dieser Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie mit `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert auch `"packages"` oder `"plugins"` als alte Aliasse für den Schlüssel `"entries"`.

## Plugins für die Context Engine

Plugins für die Context Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Zusammenstellung
und Compaction. Registrieren Sie sie in Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontextpipeline ersetzen oder erweitern muss, statt nur Speicher-Suche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()`
implementiert und delegieren Sie ihn explizit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Capability hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Direktzugriff. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Zusammenführen der Konfiguration,
   Lebenszyklus, kanalbezogene Semantik und Form des Laufzeit-Helpers.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. Core- und Channel-/Feature-Konsumenten verdrahten
   Channels und Feature-Plugins sollten die neue Capability über den Core verwenden,
   nicht durch direkten Import einer Anbieterimplementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends gegen die Capability.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzelnen
Providers fest verdrahtet zu sein. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel.

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung normalerweise diese
Oberflächen gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helper in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Plugin-Laufzeitbereitstellung in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie nutzen müssen
- Erfassungs-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Assertions zu Eigentümerschaft/Verträgen in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Capability
noch nicht vollständig integriert ist.

### Capability-Vorlage

Minimales Muster:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Muster für Vertragstests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- der Core besitzt Capability-Vertrag + Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins verwenden Laufzeit-Helper
- Vertragstests halten Eigentümerschaft explizit
