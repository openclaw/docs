---
read_when:
    - Erstellen oder Debuggen nativer OpenClaw-Plugins
    - Verstehen des Plugin-Fähigkeitsmodells oder der Ownership-Grenzen
    - Arbeiten an der Plugin-Ladepipeline oder Registry
    - Implementieren von Provider-Laufzeit-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Laufzeit-Helfer'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-06T03:12:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d39158455701dedfb75f6c20b8c69fd36ed9841f1d92bed1915f448df57fd47b
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **tiefgehende Architekturreferenz**. Praktische Anleitungen finden Sie unter:
  - [Install and use plugins](/de/tools/plugin) — Benutzerhandbuch
  - [Getting Started](/de/plugins/building-plugins) — Tutorial für das erste Plugin
  - [Channel Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider Plugins](/de/plugins/sdk-provider-plugins) — einen Modellanbieter erstellen
  - [SDK Overview](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des Plugin-Systems von OpenClaw.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit             | Registrierungsmethode                           | Beispiel-Plugins                     |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Textinferenz          | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Sprache               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Stimme       | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medienverständnis     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Bildgenerierung       | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung      | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Videogenerierung      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web-Abruf             | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Websuche              | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / Messaging     | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Services bereitstellt, ist ein **Legacy-Plugin nur mit Hooks**. Dieses Muster wird weiterhin vollständig unterstützt.

### Externe Kompatibilitätshaltung

Das Fähigkeitsmodell ist im Core eingeführt und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität benötigt weiterhin eine strengere Hürde als „es wird exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen weiter funktionsfähig halten; dies
  als Kompatibilitäts-Baseline behandeln
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung bevorzugen statt
  anbieterspezifischer direkter Zugriffe oder neuer Designs nur mit Hooks
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber
  fähigkeitsspezifische Helferoberflächen als weiterentwickelnd behandeln, sofern die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil kennzeichnet

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- Legacy-Hooks bleiben während
  des Übergangs der sicherste No-Breakage-Pfad für externe Plugins
- exportierte Helfer-Unterpfade sind nicht alle gleich; bevorzugen Sie den schmalen dokumentierten
  Vertrag, nicht beiläufige Helfer-Exporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bild-
  generierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Services
- **non-capability** -- registriert Tools, Befehle, Services oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Aufschlüsselung der Fähigkeiten
eines Plugins zu sehen. Siehe [CLI reference](/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Plugins nur mit Hooks unterstützt. Reale Legacy-Plugins hängen weiterhin davon ab.

Ausrichtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Überschreibung bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Mutationen bevorzugen
- nur entfernen, nachdem die tatsächliche Nutzung zurückgeht und die Abdeckung durch Fixtures die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` machen Ihr Plugin heute kaputt --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Discovery**
   OpenClaw findet potenzielle Plugins aus konfigurierten Pfaden, Workspace-Wurzeln,
   globalen Erweiterungswurzeln und gebündelten Erweiterungen. Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Memory ausgewählt ist.
3. **Laden zur Laufzeit**
   Native OpenClaw-Plugins werden im Prozess über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung von Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Services bereitzustellen.

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code im Plugin, während OpenClaw weiterhin
Root-Befehlsnamen vor dem Parsing reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten auf Basis von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem `register(api)`-Pfad des Plugin-Moduls

Diese Aufteilung ermöglicht OpenClaw, Konfigurationen zu validieren, fehlende/deaktivierte Plugins
zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Kanal-Plugins und das gemeinsame Nachrichtentool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Sende-/Bearbeitungs-/Reaktions-Tool registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Core, und
Kanal-Plugins besitzen die kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Wiring, Session-/Thread-
  Buchführung und Ausführungs-Dispatch
- Kanal-Plugins besitzen Discovery für gescopte Aktionen, Fähigkeits-Discovery und alle
  kanalspezifischen Schemafragmente
- Kanal-Plugins besitzen die providerspezifische Grammatik für Sitzungsunterhaltungen, zum Beispiel
  wie Gesprächs-IDs Thread-IDs kodieren oder von Elterngesprächen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf lässt ein Plugin seine sichtbaren Aktionen, Fähigkeiten und
Schemabeiträge gemeinsam zurückgeben, damit diese Teile nicht auseinanderlaufen.

Der Core übergibt den Laufzeit-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdiges eingehendes `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Kanal kann
Nachrichtenaktionen basierend auf aktivem Konto, aktuellem Raum/Thread/Nachricht oder
vertrauenswürdiger Anfordereridentität ausblenden oder anzeigen, ohne kanalspezifische Verzweigungen im
gemeinsamen `message`-Tool des Core fest zu codieren.

Deshalb bleiben Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-
Discovery-Grenze weiterzugeben, damit das gemeinsame `message`-Tool die richtige kanaleigene
Oberfläche für den aktuellen Zug bereitstellt.

Für kanaleigene Ausführungshelfer sollten gebündelte Plugins die Ausführungs-
Laufzeit in ihren eigenen Erweiterungsmodulen halten. Der Core besitzt nicht länger die
Laufzeiten für Discord-, Slack-, Telegram- oder WhatsApp-Nachrichtenaktionen unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Unterpfade, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, entweder
das eigene `api.ts` / `runtime-api.ts`-Barrel des gebündelten Plugins nutzen oder den Bedarf
in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Baseline für Kanäle, die in das gemeinsame
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt jetzt das gemeinsame Poll-Parsing, bis der Plugin-Poll-Dispatch die
Aktion abgelehnt hat, sodass Plugin-eigene Poll-Handler kanalspezifische Poll-
Felder akzeptieren können, ohne zuerst vom generischen Poll-Parser blockiert zu werden.

Siehe [Ladepipeline](#load-pipeline) für die vollständige Startsequenz.

## Ownership-Modell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium unverbundener Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-seitigen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die vollständige Feature-Oberfläche besitzen, die es einführt
- Kanäle sollten gemeinsame Core-Fähigkeiten nutzen, statt Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt OpenAI-Modellanbieter-Verhalten und OpenAI-
  Verhalten für Sprache + Echtzeit-Stimme + Medienverständnis + Bildgenerierung
- das gebündelte Plugin `elevenlabs` besitzt ElevenLabs-Sprachverhalten
- das gebündelte Plugin `microsoft` besitzt Microsoft-Sprachverhalten
- das gebündelte Plugin `google` besitzt Google-Modellanbieter-Verhalten plus Google-
  Verhalten für Medienverständnis + Bildgenerierung + Websuche
- das gebündelte Plugin `firecrawl` besitzt Firecrawl-Webabruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt Qwen-Textprovider-Verhalten plus
  Medienverständnis- und Videogenerierungs-Verhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Gesprächstransport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridging, nutzt aber gemeinsame Fähigkeiten für Sprache
  plus Echtzeit-Transkription und Echtzeit-Stimme statt Anbieter-Plugins direkt zu importieren

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftig Video umfasst
- ein anderer Anbieter kann dasselbe für seinen eigenen Oberflächenbereich tun
- Kanäle kümmern sich nicht darum, welches Anbieter-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist die zentrale Unterscheidung:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider soll Videoverarbeitung fest codieren?“ Die erste Frage lautet
„wie sieht der Core-Fähigkeitsvertrag für Video aus?“ Sobald dieser Vertrag existiert,
können Anbieter-Plugins sich dafür registrieren und Kanal-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit bereitstellen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

So bleibt Ownership explizit, während Core-Verhalten vermieden wird, das von
einem einzelnen Anbieter oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses Denkmodell, wenn Sie entscheiden, wo Code hingehört:

- **Core-Fähigkeitsebene**: gemeinsame Orchestrierung, Richtlinien, Fallback, Konfigurations-
  Merge-Regeln, Zustellungssemantik und typisierte Verträge
- **Anbieter-Plugin-Ebene**: anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprach-
  synthese, Bildgenerierung, künftige Video-Backends, Nutzungsendpunkte
- **Kanal-/Feature-Plugin-Ebene**: Slack-/Discord-/voice-call-/usw.-Integration,
  die Core-Fähigkeiten nutzt und auf einer Oberfläche präsentiert

Zum Beispiel folgt TTS dieser Struktur:

- der Core besitzt TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` besitzen Synthese-Implementierungen
- `voice-call` nutzt den Telephony-TTS-Laufzeithelfer

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medien-
verständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat,
kann ein Anbieter alle seine Oberflächen an einer Stelle besitzen:

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

Wichtig sind nicht die exakten Helfernamen. Wichtig ist die Struktur:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins nutzen `api.runtime.*`-Helfer, nicht Anbietercode
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat,
  die es vorgibt zu besitzen

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Ownership-Modell gilt dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren `describeImage`, `transcribeAudio` und
   `describeVideo`, je nachdem was zutrifft
3. Kanal- und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt direkt
   an Anbietercode zu verdrahten

Dadurch werden die Video-Annahmen eines einzelnen Providers nicht in den Core eingebrannt. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Videogenerierung folgt bereits derselben Sequenz: Der Core besitzt den typisierten
Fähigkeitsvertrag und Laufzeithelfer, und Anbieter-Plugins registrieren
`api.registerVideoGenerationProvider(...)`-Implementierungen dafür.

Sie benötigen eine konkrete Rollout-Checkliste? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeithelfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership ablehnen, etwa zwei Plugins, die dieselbe
  Provider-ID registrieren
- der Start kann verwertbare Diagnosen für fehlerhafte Registrierung ausgeben
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stilles Drift verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen während Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte Sprachprovider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modell-
   provider, Sprachprovider, Websuchprovider und Ownership gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Das ermöglicht dem Core und den Kanälen eine nahtlose Zusammensetzung, weil
Ownership deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- vom Core besessen
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Core versteckt sind
- einmalige Plugin-Escape-Hatches, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc-Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Wenn Sie unsicher sind, erhöhen Sie die Abstraktionsebene: Definieren Sie zuerst die Fähigkeit und
lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
gesandboxed. Ein geladenes natives Plugin hat dieselbe prozessweite Vertrauensgrenze wie
Core-Code.

Folgen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin ist gleichbedeutend mit beliebiger Codeausführung innerhalb
  des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als
Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das überwiegend gebündelte
Skills.

Verwenden Sie Zulassungslisten und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code für Entwicklungszeit, nicht als Produktionsstandard.

Für Namen gebündelter Workspace-Pakete sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>`, oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine schmalere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/zugelassen ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Comfort-Funktionen.

Halten Sie Fähigkeitsregistrierung öffentlich. Beschneiden Sie Nicht-Vertrags-Helfer-Exporte:

- gebündelte pluginspezifische Helfer-Unterpfade
- Laufzeit-Plumbing-Unterpfade, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helfer
- Setup-/Onboarding-Helfer, die Implementierungsdetails sind

Einige Helfer-Unterpfade gebündelter Plugins verbleiben aus Kompatibilitätsgründen und für die
Pflege gebündelter Plugins weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte mit Implementierungsdetails, nicht als empfohlenes SDK-Muster für
neue Plugins von Drittanbietern.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. potenzielle Plugin-Wurzeln entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module via jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein Legacy-Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst die jeweils vorhandene Variante auf (`def.register ?? def.activate`) und ruft sie an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheits-Gates greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Entry die Plugin-Wurzel verlässt, der Pfad weltweit beschreibbar ist oder die
Pfad-Ownership bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-First-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Steuerungsebene. OpenClaw nutzt es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Control-UI-Labels/-Platzhalter anzureichern
- Installations-/Katalogmetadaten anzuzeigen

Für native Plugins ist das Laufzeitmodul der Datenebenen-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

### Was der Loader cached

OpenClaw behält kurze prozessinterne Caches für:

- Discovery-Ergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren burstige Starts und Overhead bei wiederholten Befehlen. Man sollte sie
als kurzlebige Performance-Caches verstehen, nicht als Persistenz.

Performance-Hinweis:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt zufällige globale Core-Objekte. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Herkunft, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrund-Services
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. So bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-
Oberflächen nur einen Integrationspunkt benötigen: „Registry lesen“, nicht „jedes
Plugin-Modul speziell behandeln“.

## Callbacks für Gesprächsbindungen

Plugins, die ein Gespräch binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine
Bindungsanfrage genehmigt oder abgelehnt wurde:

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
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfrageszusammenfassung, Detach-Hinweis, Sender-ID und
  Gesprächsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer ein Gespräch
binden darf, und er läuft, nachdem die Core-Behandlung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für günstiges Lookup von env-Auth vor dem
  Laden der Laufzeit, plus `providerAuthChoices` für günstige Labels für Onboarding/Auth-Auswahl
  und CLI-Flag-Metadaten vor dem Laden der Laufzeit
- Hooks zur Konfigurationszeit: `catalog` / Legacy-`discovery` plus `applyConfigDefaults`
- Laufzeit-Hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transcript-Verarbeitung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenztransport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider env-basierte Anmeldedaten
hat, die generische Auth-/Status-/Modellauswahlpfade sehen sollen, ohne die Plugin-Laufzeit zu laden.
Verwenden Sie Manifest-`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-
Oberflächen die Choice-ID des Providers, Gruppenlabels und einfache
Auth-Verdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie Provider-Laufzeit-
`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er tut                                                                             | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der `models.json`-Erzeugung in `models.providers` veröffentlichen | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Globale Standardwerte des Providers bei der Materialisierung der Konfiguration anwenden | Standardwerte hängen von Auth-Modus, env oder der Semantik der Modellfamilie des Providers ab                                              |
| --  | _(integriertes Modell-Lookup)_    | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                             | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Legacy- oder Preview-Aliase für Modell-IDs vor dem Lookup normalisieren                | Der Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                  |
| 4   | `normalizeTransport`              | Provider-Familien-`api` / `baseUrl` vor generischer Modellzusammensetzung normalisieren | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                               |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Laufzeit-/Provider-Auflösung normalisieren                  | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helfer stützen auch unterstützte Google-Konfigurationseinträge |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen auf Konfigurationsprovider anwenden | Der Provider benötigt endpointgesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                          |
| 7   | `resolveConfigApiKey`             | Env-Marker-Auth für Konfigurationsprovider vor dem Laden der Laufzeit-Auth auflösen    | Der Provider besitzt provider-eigene Env-Marker-Auflösung für API-Schlüssel; `amazon-bedrock` hat hier ebenfalls einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Lokale/self-hosted oder konfigurationsgestützte Authentifizierung bereitstellen, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Anmeldedaten-Marker arbeiten                                                             |
| 9   | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profil-Platzhalter hinter env-/konfigurationsgestützter Auth absenken | Der Provider speichert synthetische Platzhalterprofile, die keine Priorität gewinnen sollen                                                |
| 10  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 11  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                          | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 12  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet          | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                              |
| 13  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Anbietermodelle hinter einem anderen kompatiblen Transport beitragen | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                          |
| 14  | `capabilities`                    | Provider-eigene Transcript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden | Der Provider benötigt Besonderheiten bei Transcript/Provider-Familie                                                                        |
| 15  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der Embedded Runner sie sieht                         | Der Provider benötigt Bereinigung von Schemas auf Ebene der Transportfamilie                                                                |
| 16  | `inspectToolSchemas`              | Provider-eigene Schema-Diagnosen nach der Normalisierung ausgeben                       | Der Provider möchte Keyword-Warnungen ohne dem Core providerspezifische Regeln beizubringen                                                |
| 17  | `resolveReasoningOutputMode`      | Vertrag für native vs. getaggte Reasoning-Ausgabe auswählen                             | Der Provider benötigt getaggte Reasoning-/Final-Output-Ausgabe statt nativer Felder                                                        |
| 18  | `prepareExtraParams`              | Request-Parameter-Normalisierung vor generischen Stream-Option-Wrappern                 | Der Provider benötigt Standard-Request-Parameter oder providerspezifische Parameter-Bereinigung                                             |
| 19  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen | Der Provider benötigt ein benutzerdefiniertes Wire-Protocol, nicht nur einen Wrapper                                                       |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                            | Der Provider benötigt Wrapper für Request-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                            |
| 21  | `resolveTransportTurnState`       | Native Header oder Metadaten pro Zug am Transport anhängen                              | Der Provider möchte, dass generische Transporte provider-native Zugidentität senden                                                        |
| 22  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Session-Abkühlungsrichtlinie anhängen                      | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien anpassen                                       |
| 23  | `formatApiKey`                    | Auth-Profil-Formatierer: gespeichertes Profil wird zur Laufzeit-Zeichenfolge `apiKey`  | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Richtlinie bei Refresh-Fehlern | Der Provider passt nicht in die gemeinsamen `pi-ai`-Refresher                                                                              |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                    | Der Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                              | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                         |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung des Failover-Grunds                                     | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                      |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                    | Der Provider benötigt proxiespezifische TTL-Grenzen für den Cache                                                                          |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung     | Der Provider benötigt einen providerspezifischen Wiederherstellungshinweis für fehlende Auth                                               |
| 30  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                           |
| 31  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen werden nach Discovery angehängt                       | Der Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahlen                                                    |
| 32  | `isBinaryThinking`                | On/Off-Reasoning-Umschalter für Provider mit binärem Thinking                           | Der Provider bietet nur binäres Thinking an/aus                                                                                             |
| 33  | `supportsXHighThinking`           | Unterstützung für `xhigh`-Reasoning bei ausgewählten Modellen                           | Der Provider möchte `xhigh` nur bei einer Teilmenge von Modellen                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | Standardstufe für `/think` bei einer bestimmten Modellfamilie                           | Der Provider besitzt die Standardrichtlinie für `/think` bei einer Modellfamilie                                                            |
| 35  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                     | Der Provider besitzt Matching für bevorzugte Modelle bei Live/Smoke                                                                         |
| 36  | `prepareRuntimeAuth`              | Konfigurierte Anmeldedaten direkt vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel umtauschen | Der Provider benötigt einen Token-Austausch oder kurzlebige Anmeldedaten für Requests                                                     |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungs-Anmeldedaten für `/usage` und verwandte Statusoberflächen auflösen | Der Provider benötigt benutzerdefiniertes Parsing von Nutzungs-/Quota-Token oder andere Nutzungs-Anmeldedaten                             |
| 38  | `fetchUsageSnapshot`              | Providerspezifische Nutzungs-/Quota-Snapshots abrufen und normalisieren, nachdem Auth aufgelöst wurde | Der Provider benötigt einen providerspezifischen Nutzungsendpunkt oder Payload-Parser                                                     |
| 39  | `createEmbeddingProvider`         | Einen provider-eigenen Embedding-Adapter für Memory/Search erstellen                    | Embedding-Verhalten für Memory gehört zum Provider-Plugin                                                                                   |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transcript-Verarbeitung für den Provider steuert | Der Provider benötigt eine benutzerdefinierte Transcript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                     |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transcript-Bereinigung umschreiben                      | Der Provider benötigt providerspezifische Replay-Umschreibungen jenseits gemeinsamer Verdichtungshelfer                                    |
| 42  | `validateReplayTurns`             | Endgültige Validierung oder Umformung von Replay-Zügen vor dem Embedded Runner          | Der Provider-Transport benötigt strengere Zugvalidierung nach generischer Bereinigung                                                      |
| 43  | `onModelSelected`                 | Provider-eigene Side Effects nach Auswahl eines Modells ausführen                       | Der Provider benötigt Telemetrie oder provider-eigenen Zustand, wenn ein Modell aktiv wird                                                 |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und fallen dann durch andere Hook-fähige Provider-Plugins,
bis eines Modell-ID oder Transport/Konfiguration tatsächlich ändert. So bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Google-Konfigurations-
Normalizer mit dieser Kompatibilitätsbereinigung.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protocol oder einen benutzerdefinierten
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für
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

### Integrierte Beispiele

- Anthropic verwendet `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es Claude-4.6-Forward-Compat,
  Hinweise zur Provider-Familie, Anleitungen zur Auth-Reparatur, Integration des Nutzungsendpunkts,
  Prompt-Cache-Berechtigung, auth-sensitive Konfigurationsstandardwerte, die Claude-
  Standard-/adaptive Thinking-Richtlinie und Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- An die Claude-spezifischen Stream-Helfer von Anthropic wird vorerst über das eigene
  öffentliche Seam `api.ts` / `contract-api.ts` des gebündelten Plugins herangeführt. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die niedrigstufigen
  Anthropic-Wrapper-Builder, statt das generische SDK um die Beta-Header-Regeln
  eines Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es GPT-5.4-Forward-Compat, die direkte OpenAI-
  Normalisierung `openai-completions` -> `openai-responses`, Codex-fähige Auth-
  Hinweise, Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die GPT-5-Thinking-/
  Live-Modell-Richtlinie besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche,
  Reasoning-Compat-Payload-Formung und Responses-Kontextverwaltung.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider Pass-Through ist und neue
  Modell-IDs anzeigen kann, bevor der statische Katalog von OpenClaw aktualisiert ist; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie kommt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle / `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  provider-eigenen Device-Login, Modell-Fallback-Verhalten, Claude-Transcript-Besonderheiten,
  einen Austausch GitHub-Token -> Copilot-Token und einen provider-eigenen Nutzungsendpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf den OpenAI-Core-Transporten läuft, aber seine Transport-/`baseUrl`-
  Normalisierung, OAuth-Refresh-Fallback-Richtlinie, Standardwahl des Transports,
  synthetische Codex-Katalogzeilen und Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt sich dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` Gemini-3.1-Forward-Compat-Fallback,
  native Gemini-Replay-Validierung, Sanitisierung des Bootstrap-Replays, den getaggten
  Reasoning-Output-Modus und Matching moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung von Gemini-Thinking-Payloads besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und
  Verdrahtung des Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, sodass Claude-spezifische Replay-Bereinigung an Claude-IDs
  gebunden bleibt statt an jeden `anthropic-messages`-Transport.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es
  Bedrock-spezifische Fehlerklassifizierung für Drosselung/nicht bereit/Kontextüberlauf
  für Anthropic-on-Bedrock-Verkehr besitzt; seine Replay-Richtlinie teilt sich dennoch denselben
  reinen Claude-Schutz `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und Sanitisierung von Gemini-
  Thought-Signatures ohne native Gemini-Replay-Validierung oder
  Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Messages- als auch OpenAI-kompatible Semantik besitzt; dadurch bleibt das Entfernen Claude-spezifischer
  Thinking-Blöcke auf der Anthropic-Seite erhalten, während der Reasoning-Output-Modus zurück auf native Werte überschrieben wird, und die Stream-Familie `minimax-fast-mode` besitzt Umschreibungen für Fast-Mode-Modelle auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` plus `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport nutzt, aber provider-eigene Normalisierung von Thinking-Payloads benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Zustand auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Request-Header,
  Normalisierung von Reasoning-Payloads, Hinweise für Gemini-Transcripts und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält Kilo-Thinking-
  Injektion auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, UX für binäres Thinking, Matching moderner Modelle und sowohl
  Usage-Auth als auch Quota-Abruf besitzt; die Stream-Familie `tool-stream-default-on` hält den
  standardmäßig aktiven `tool_stream`-Wrapper aus handgeschriebenem Glue pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es native Normalisierung für xAI-Responses-Transport, Grok-Fast-Mode-
  Alias-Umschreibungen, standardmäßiges `tool_stream`, striktes Tool-/Reasoning-Payload-
  Cleanup, Wiederverwendung von Fallback-Auth für plugin-eigene Tools, Forward-Compat-
  Auflösung von Grok-Modellen und provider-eigene Kompatibilitäts-Patches wie xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und Dekodierung von HTML-Entities in Argumenten von Tool-Calls besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Transcript-/Tooling-Besonderheiten aus dem Core herauszuhalten.
- Gebündelte reine Katalog-Provider wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Textprovider sowie gemeinsame Registrierungen für Medienverständnis und Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten plugin-eigen ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Helfer

Plugins können über `api.runtime` auf ausgewählte Core-Helfer zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale Core-TTS-Output-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiobuffer + Sample-Rate zurück. Plugins müssen für Provider resamplen/kodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für Anbieter-eigene Voice-Picker oder Setup-Flows.
- Sprachlisten können umfangreichere Metadaten wie Locale, Geschlecht und Personality-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können Sprachprovider auch über `api.registerSpeechProvider(...)` registrieren.

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

- Halten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Sprachprovider für Anbieter-eigenes Syntheseverhalten.
- Legacy-Microsoft-Input `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und künftige Medienprovider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

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

- Halten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core.
- Halten Sie Anbieterverhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeithelfer
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins nutzen `api.runtime.videoGeneration.*`

Für Laufzeithelfer für Medienverständnis können Plugins Folgendes aufrufen:

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
- Verwendet die Audio-Konfiguration für Medienverständnis im Core (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenem/nicht unterstütztem Input).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können auch Hintergrundläufe von Subagenten über `api.runtime.subagent` starten:

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
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Subagent-Läufe aus nicht vertrauenswürdigen Plugins funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend auf Fallback umzuschalten.

Für Websuche können Plugins den gemeinsamen Laufzeithelfer nutzen, statt
in die Verdrahtung des Agent-Tools einzugreifen:

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

Plugins können Websuchprovider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Halten Sie Providerauswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuchprovider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne vom Wrapper des Agent-Tools abzuhängen.

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

- `generate(...)`: ein Bild mithilfe der konfigurierten Kette von Bildgenerierungsprovidern erzeugen.
- `listProviders(...)`: verfügbare Bildgenerierungsprovider und ihre Fähigkeiten auflisten.

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

Felder der Route:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, außer bei `replaceExisting: true`, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie Fallthrough-Ketten aus `exact`/`prefix` nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Operator-Laufzeit-Scopes. Sie sind für pluginverwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Helferaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Request-Laufzeit-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Laufzeit-Scopes von Plugin-Routen bei `operator.write`, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identitätsträgern (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header ausdrücklich vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routenanfragen mit Identitätsträger fehlt, fällt der Laufzeit-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Plugin-Route mit Gateway-Auth implizit eine Admin-Oberfläche ist. Wenn Ihre Route Verhalten nur für Admins benötigt, verlangen Sie einen Auth-Modus mit Identitätsträger und dokumentieren Sie den expliziten Header-Vertrag `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie SDK-Unterpfade statt des monolithischen Imports `openclaw/plugin-sdk`,
wenn Sie Plugins erstellen:

- `openclaw/plugin-sdk/plugin-entry` für Primitive zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen, pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas für das Root-`openclaw.json`
  (`OpenClawSchema`).
- Stabile Kanal-Primitiven wie `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Auth/Antwort/Webhook.
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Mention-Matching,
  Envelope-Formatierung und Helfer für den Kontext eingehender Envelopes.
  `channel-setup` ist das schmale Setup-Seam für optionale Installation.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich importsicherer Setup-Patch-Adapter.
  `setup-adapter-runtime` ist das env-sensitive Account-Setup-Adapter-Seam.
  `setup-tools` ist das kleine CLI-/Archiv-/Doku-Helfer-Seam (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain-Unterpfade wie `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurationshelfer.
  `telegram-command-config` ist das schmale öffentliche Seam für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt auch dann verfügbar, wenn die Oberfläche des gebündelten
  Telegram-Vertrags vorübergehend nicht verfügbar ist.
  `text-runtime` ist das gemeinsame Text-/Markdown-/Logging-Seam, einschließlich
  des Strippings von für den Assistant sichtbarem Text, Helfern zum Rendern/Chunking von Markdown, Helfern zur Redaktion,
  Helfern für Directive-Tags und Safe-Text-Utilities.
- Approval-spezifische Kanal-Seams sollten einen einzigen Vertrag `approvalCapability`
  auf dem Plugin bevorzugen. Der Core liest dann Authentifizierung, Zustellung, Rendern und
  natives Routing für Approvals über diese eine Fähigkeit statt Approval-Verhalten
  in nicht verwandte Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte stattdessen die schmaleren
  generischen Primitiven importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Interna gebündelter Erweiterungen bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Unterpfade verwenden. OpenClaw-Core-/Test-Code darf die öffentlichen
  Repo-Entry-Points unter einer Plugin-Paketwurzel nutzen, etwa `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und schmal fokussierte Dateien wie
  `login-qr-api.js`. Importieren Sie niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Erweiterung.
- Aufteilung der Repo-Entry-Points:
  `<plugin-package-root>/api.js` ist das Helfer-/Typen-Barrel,
  `<plugin-package-root>/runtime-api.js` ist das reine Laufzeit-Barrel,
  `<plugin-package-root>/index.js` ist der gebündelte Plugin-Entry,
  und `<plugin-package-root>/setup-entry.js` ist der Setup-Plugin-Entry.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helfer wie
    `wrapAnthropicProviderStream`, Beta-Header-Helfer und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Helfer für Standardmodelle und
    Builder für Echtzeit-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Onboarding-/Konfigurations-
    Helfer, während `register.runtime.js` für repo-lokale Nutzung weiterhin generische
    Helfer aus `plugin-sdk/provider-stream` re-exportieren kann.
- Über Fassaden geladene öffentliche Entry-Points bevorzugen den aktiven Laufzeit-Snapshot der Konfiguration,
  wenn einer existiert, und fallen andernfalls auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Laufzeit-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Ein kleiner
  reservierter Kompatibilitätssatz gebündelter kanalmarkierter Helfer-Seams existiert weiterhin.
  Behandeln Sie diese als Seams für Pflege/Kompatibilität gebündelter Plugins, nicht als neue
  Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen Unterpfaden `plugin-sdk/*` oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeiden Sie für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Unterpfade für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der beabsichtigte Vertrag für neue
  Arbeiten an gebündelten und externen Plugins.
  Ziel-Parsing/-Matching gehört nach `openclaw/plugin-sdk/channel-targets`.
  Gates für Message-Actions und Reaction-Message-ID-Helfer gehören nach
  `openclaw/plugin-sdk/channel-actions`.
- Gebündelte erweiterungsspezifische Helper-Barrels sind standardmäßig nicht stabil. Wenn ein
  Helfer nur von einer gebündelten Erweiterung benötigt wird, halten Sie ihn hinter dem
  lokalen Seam `api.js` oder `runtime-api.js` der Erweiterung, statt ihn nach
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht kanalmarkiert. Gemeinsames Ziel-
  Parsing gehört nach `openclaw/plugin-sdk/channel-targets`; kanalspezifische
  Interna bleiben hinter dem lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Unterpfade wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie heute verwenden. Ihre Existenz bedeutet für sich genommen nicht, dass jeder exportierte Helfer ein
  langfristig eingefrorener externer Vertrag ist.

## Message-Tool-Schemas

Plugins sollten kanalspezifische Schemabeiträge in `describeMessageTool(...)`
besitzen. Halten Sie providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsam portable Schemafragmente verwenden Sie die generischen Helfer, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil eines Button-Rasters
- `createMessageToolCardSchema()` für strukturierte Card-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definieren Sie sie in
dessen Plugin-Quellcode statt sie in das gemeinsame SDK zu befördern.

## Auflösung von Kanalzielen

Kanal-Plugins sollten kanalspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Directory-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob ein
  Input direkt zur id-artigen Auflösung springen soll statt zur Directory-Suche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn der
  Core nach der Normalisierung oder nach einem Directory-Miss eine endgültige provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Konstruktion
  der Session-Route, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche in Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen des Typs „behandle dies als explizite/native Ziel-ID“.
- Verwenden Sie `resolveTarget` für providerspezifischen Fallback bei der Normalisierung, nicht für
  allgemeine Directory-Suche.
- Halten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  in `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- DM-Peers, die von einer Zulassungsliste gesteuert werden
- konfigurierte Kanal-/Gruppen-Zuordnungen
- kontogescopte statische Directory-Fallbacks

Die gemeinsamen Helfer in `directory-runtime` behandeln nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Hilfen für Deduplizierung/Normalisierung
- Erzeugung von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für `baseUrl`
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
impliziten integrierten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider, die von API-Schlüssel oder env getrieben sind
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalinspektion

Wenn Ihr Plugin einen Kanal registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Es darf davon ausgehen, dass Anmeldedaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Config-
  Reparatur-Flows sollten keine Laufzeit-Anmeldedaten materialisieren müssen, nur um die Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Wenn relevant, Felder zu Quelle/Status von Anmeldedaten einschließen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu berichten. `tokenStatus: "available"` (und das passende Quellenfeld) reicht für statusartige Befehle.
- Verwenden Sie `configured_unavailable`, wenn ein Anmeldedatensatz über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Paket-Packs

Ein Plugin-Verzeichnis kann ein `package.json` mit `openclaw.extensions` enthalten:

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
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Abhängigkeitsbäume von Plugins „reines JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Setup-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Entrys. Das hält Start und Setup leichter,
wenn Ihr Haupteintrag des Plugins auch Tools, Hooks oder anderen reinen
Laufzeitcode verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin während der Pre-Listen-Startphase des Gateways in denselben `setupEntry`-
Pfad optieren, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die vor dem Beginnen des Gateways zu lauschen existieren muss. In der Praxis bedeutet das, dass der Setup-Entry jede kanaleigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway auf Anfragen hört
- alle Gateway-Methoden, Tools oder Services, die in diesem selben Fenster existieren müssen

Wenn Ihr vollständiger Entry weiterhin eine erforderliche Startfähigkeit besitzt, aktivieren
Sie dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw den
vollständigen Entry während des Starts laden.

Gebündelte Kanäle können auch Helfer für reine Setup-Vertragsoberflächen veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Kanal-Laufzeit geladen ist. Die aktuelle Setup-
Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine Legacy-Konfiguration eines
Einzelkonto-Kanals nach `channels.<id>.accounts.*` promoten muss, ohne den vollständigen Plugin-Entry zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-
Schlüssel in ein benanntes promotetes Konto, wenn bereits benannte Konten existieren, und es kann
einen konfigurierten nicht-kanonischen Standardkontoschlüssel beibehalten, statt immer
`accounts.default` zu erzeugen.

Diese Setup-Patch-Adapter halten Discovery gebündelter Vertragsoberflächen lazy. Die
Importzeit bleibt leichtgewichtig; die Promotion-Oberfläche wird nur bei der ersten Nutzung geladen, statt
beim Modulimport erneut in den Start gebündelter Kanäle einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halten Sie sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
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

### Metadaten zum Kanal-Katalog

Kanal-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. So bleibt der Core-Katalog datenfrei.

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

Nützliche Felder in `openclaw.channel` über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Doku-Link überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit geringerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerungen für Text auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als Markdown-fähig für Entscheidungen zum Outbound-Formatting
- `exposure.configured`: den Kanal auf Oberflächen für konfigurierte Kanäle ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: den Kanal in interaktiven Setup-/Configure-Pickern ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: den Kanal für Oberflächen der Doku-Navigation als intern/privat markieren
- `showConfigured` / `showInSetup`: Legacy-Aliase werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: den Kanal in den Standard-Quickstart-Flow für `allowFrom` optieren
- `forceAccountBinding`: explizite Kontobindung verlangen, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: Session-Lookup bevorzugen, wenn Ankündigungsziele aufgelöst werden

OpenClaw kann auch **externe Kanal-Kataloge** zusammenführen (zum Beispiel einen Export einer
MPM-Registry). Legen Sie eine JSON-Datei unter einem der folgenden Pfade ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder lassen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien zeigen (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert aus Legacy-Gründen auch `"packages"` oder `"plugins"` als Alias für den Schlüssel `"entries"`.

## Plugins für die Context Engine

Plugins für die Context Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Zusammenstellung
und Verdichtung. Registrieren Sie sie aus Ihrem Plugin heraus mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontextpipeline ersetzen oder erweitern muss, statt nur Memory Search oder Hooks hinzuzufügen.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn Ihre Engine den Verdichtungsalgorithmus **nicht** besitzt, implementieren Sie `compact()`
trotzdem und delegieren Sie ihn explizit:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie
das Plugin-System nicht mit einem privaten direkten Zugriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Config-Merge,
   Lifecycle, kanalgerichtete Semantik und Form der Laufzeithelfer.
2. typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core + Kanal-/Feature-Konsumenten verdrahten
   Kanäle und Feature-Plugins sollten die neue Fähigkeit über den Core nutzen,
   nicht durch direkten Import einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends für die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne in die Weltsicht eines einzelnen
Providers hart codiert zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Datei-Checkliste und ein durchgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung normalerweise
diese Oberflächen gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeithelfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Plugin-Laufzeitbereitstellung in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie nutzen müssen
- Capture-/Test-Helfer in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertragsassertions in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Fähigkeit
noch nicht vollständig integriert ist.

### Vorlage für Fähigkeiten

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

So bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Kanal-Plugins nutzen Laufzeithelfer
- Vertragstests halten Ownership explizit
