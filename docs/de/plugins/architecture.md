---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Fähigkeitsmodell oder die Ownership-Grenzen von Plugins verstehen
    - An der Plugin-Lade-Pipeline oder Registry arbeiten
    - Runtime-Hooks für Provider oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Contracts, Lade-Pipeline und Laufzeithelfer'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-24T08:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Dies ist die **umfassende Architekturreferenz** für das OpenClaw-Plugin-System. Für
praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Endbenutzeranleitung zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins erstellen" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Channel-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit             | Registrierungsmethode                           | Beispiel-Plugins                    |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Text-Inferenz         | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| CLI-Inferenz-Backend  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Sprache               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Echtzeit-Stimme       | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Medienverständnis     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Bildgenerierung       | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung      | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Videogenerierung      | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web-Abruf             | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Websuche              | `api.registerWebSearchProvider(...)`            | `google`                            |
| Channel / Messaging   | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| Gateway-Erkennung     | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools, Discovery-
Services oder Hintergrunddienste bereitstellt, ist ein **Legacy-hook-only**-Plugin. Dieses Muster
wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core gelandet und wird heute von gebündelten/nativen Plugins
verwendet, aber die externe Plugin-Kompatibilität braucht weiterhin eine strengere Messlatte als „es ist
exportiert, also ist es eingefroren“.

| Plugin-Situation                                | Richtlinie                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                      | Hook-basierte Integrationen funktionsfähig halten; das ist die Kompatibilitäts-Baseline.      |
| Neue gebündelte/native Plugins                  | Explizite Fähigkeitsregistrierung gegenüber anbieterspezifischen Zugriffen oder neuen rein hook-basierten Designs bevorzugen. |
| Externe Plugins, die Fähigkeitsregistrierung übernehmen | Erlaubt, aber fähigkeitsspezifische Hilfsoberflächen als weiterentwickelbar behandeln, sofern die Docs sie nicht als stabil markieren. |

Die Fähigkeitsregistrierung ist die beabsichtigte Richtung. Legacy-Hooks bleiben während des
Übergangs der sicherste Weg ohne Breaking Changes für externe Plugins. Exportierte
Hilfs-Subpaths sind nicht alle gleich — bevorzugen Sie enge dokumentierte Contracts statt
zufälliger Hilfsexporte.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability**: registriert genau einen Fähigkeitstyp (zum Beispiel ein
  nur-Provider-Plugin wie `mistral`).
- **hybrid-capability**: registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Text-Inferenz, Sprache, Medienverständnis und Bild-
  generierung).
- **hook-only**: registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Dienste.
- **non-capability**: registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten.

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Fähigkeitsaufschlüsselung
eines Plugins zu sehen. Siehe [CLI-Referenz](/de/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
rein hook-basierte Plugins unterstützt. Legacy-Plugins aus der Praxis sind weiterhin davon abhängig.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeit an Modell-/Provider-Überschreibungen bevorzugen
- `before_prompt_build` für Änderungen an Prompts bevorzugen
- erst entfernen, nachdem die reale Nutzung sinkt und Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute kaputt machen:
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet Kandidaten-Plugins in konfigurierten Pfaden, Workspace-Roots,
   globalen Plugin-Roots und gebündelten Plugins. Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein gefundenes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt ist.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden per jiti im Prozess geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten stammen aus `registerCli(..., { descriptors: [...] })`
- das echte Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw trotzdem
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten anhand von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung ermöglicht es OpenClaw, Konfigurationen zu validieren, fehlende/deaktivierte Plugins
zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Control Plane. Aufrufer können fragen, welche Plugins
für einen konkreten Befehl, Provider, Channel, eine Route, ein Agent-Harness oder eine
Fähigkeit relevant sind, bevor breitere Laufzeit-Registries geladen werden.

Der Planer hält das aktuelle Manifest-Verhalten kompatibel:

- `activation.*`-Felder sind explizite Planer-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` und Hooks bleiben Fallbacks für Manifest-Ownership
- die ids-only-Planer-API bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungslabels, damit die Diagnose explizite
  Hinweise von Ownership-Fallback unterscheiden kann

Behandeln Sie `activation` nicht als Lifecycle-Hook oder als Ersatz für
`register(...)`. Es handelt sich um Metadaten, die zum Einschränken des Ladens verwendet werden. Bevorzugen Sie Ownership-Felder,
wenn sie die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche
Planer-Hinweise.

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool
registrieren. OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Channel-Plugins besitzen die channelspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verkabelung, Session-/Thread-
  Buchhaltung und Ausführungs-Dispatch
- Channel-Plugins besitzen die Discovery für bereichsbezogene Aktionen, Fähigkeits-Discovery
  und alle channelspezifischen Schemafragmente
- Channel-Plugins besitzen providerspezifische Sitzungs-Konversationsgrammatik, also etwa
  wie Konversations-IDs Thread-IDs kodieren oder von Elternkonversationen erben
- Channel-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Channel-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf erlaubt es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schema-
Beiträge zusammen zurückzugeben, damit diese Teile nicht auseinanderdriften.

Wenn ein channelspezifischer message-tool-Parameter eine Medienquelle wie einen
lokalen Pfad oder eine entfernte Medien-URL enthält, sollte das Plugin außerdem
`mediaSourceParams` von `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff
anzuwenden, ohne Plugin-eigene Parameternamen hart zu codieren.
Bevorzugen Sie dort aktionsbezogene Maps statt einer kanalweiten flachen Liste, damit ein
nur profilbezogener Medienparameter nicht bei nicht zusammenhängenden Aktionen wie
`send` normalisiert wird.

Der Core übergibt den Laufzeit-Scope an diesen Discovery-Schritt. Wichtige Felder sind unter anderem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann
Nachrichtenaktionen abhängig vom aktiven Konto, dem aktuellen Raum/Thread/Nachricht oder der
vertrauenswürdigen Identität des Anfragenden ausblenden oder bereitstellen, ohne
channelspezifische Verzweigungen im Core-Tool `message` hart zu codieren.

Darum sind Routing-Änderungen im eingebetteten Runner weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Session-Identität an die Plugin-
Discovery-Grenze weiterzuleiten, damit das gemeinsame Tool `message` die richtige, Channel-eigene
Oberfläche für den aktuellen Turn bereitstellt.

Bei Channel-eigenen Ausführungshelfern sollten gebündelte Plugins die Ausführungs-
Laufzeit innerhalb ihrer eigenen Erweiterungsmodule halten. Der Core besitzt nicht länger die Discord-,
Slack-, Telegram- oder WhatsApp-Nachrichtenaktions-Laufzeiten unter `src/agents/tools`.
Wir veröffentlichen keine separaten Subpaths `plugin-sdk/*-action-runtime`, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt,
sollte er entweder das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins
verwenden oder den Bedarf in eine schmale generische Fähigkeit im gemeinsam genutzten SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die zum gemeinsamen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt das gemeinsame Parsing von Umfragen jetzt so lange, bis der
plugin-eigene Dispatch für Umfragen die Aktion ablehnt, damit plugin-eigene
Umfrage-Handler channelspezifische Umfragefelder akzeptieren können, ohne zuerst
vom generischen Umfrage-Parser blockiert zu werden.

Siehe [Plugin architecture internals](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Modell für Capability-Ownership

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die vollständige Feature-Oberfläche
  besitzen, die es einführt
- Channels sollten gemeinsame Core-Capabilities nutzen, statt
  Provider-Verhalten ad hoc neu zu implementieren

<Accordion title="Beispielhafte Ownership-Muster über gebündelte Plugins hinweg">
  - **Anbieter mit mehreren Capabilities**: `openai` besitzt Text-Inferenz, Sprache, Echtzeit-
    Stimme, Medienverständnis und Bildgenerierung. `google` besitzt Text-
    Inferenz plus Medienverständnis, Bildgenerierung und Websuche.
    `qwen` besitzt Text-Inferenz plus Medienverständnis und Videogenerierung.
  - **Anbieter mit einzelner Capability**: `elevenlabs` und `microsoft` besitzen Sprache;
    `firecrawl` besitzt Web-Abruf; `minimax` / `mistral` / `moonshot` / `zai` besitzen
    Backends für Medienverständnis.
  - **Feature-Plugin**: `voice-call` besitzt Anruftransport, Tools, CLI, Routen
    und Twilio-Medienstrom-Bridge, nutzt aber gemeinsame Capabilities für Sprache, Echtzeit-
    Transkription und Echtzeit-Stimme, statt Anbieter-Plugins direkt zu importieren.
</Accordion>

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Sprache, Bilder und
  zukünftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seinen eigenen Oberflächenbereich tun
- Channels ist es egal, welches Anbieter-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Capability-Contract, den der Core bereitstellt

Das ist die entscheidende Unterscheidung:

- **Plugin** = Ownership-Grenze
- **Capability** = Core-Contract, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte Videoverarbeitung hart codieren?“ Die erste Frage lautet
„was ist der Core-Capability-Contract für Video?“ Sobald dieser Contract existiert,
können Anbieter-Plugins sich dafür registrieren und Channel-/Feature-Plugins ihn nutzen.

Wenn die Capability noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Capability im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit bereitstellen
3. Channels/Features gegen diese Capability verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

Dadurch bleibt Ownership explizit, während Core-Verhalten vermieden wird, das von einem
einzelnen Anbieter oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Capability-Schichtung

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wo Code hingehört:

- **Core-Capability-Schicht**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Regeln zum Zusammenführen von Konfigurationen, Zustellsemantik und typisierte Contracts
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Auth, Modellkataloge, Sprache-
  synthese, Bildgenerierung, zukünftige Video-Backends, Nutzungsendpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration von Slack/Discord/voice-call/usw.,
  die Core-Capabilities nutzt und sie auf einer Oberfläche darstellt

TTS folgt zum Beispiel dieser Form:

- der Core besitzt TTS-Richtlinien zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Channel-Zustellung
- `openai`, `elevenlabs` und `microsoft` besitzen Synthese-Implementierungen
- `voice-call` nutzt den Laufzeithelfer für Telephony-TTS

Dasselbe Muster sollte für zukünftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Contracts für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis,
Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat,
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
      // Auth-/Modellkatalog-/Laufzeit-Hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // Anbieter-Sprachkonfiguration — das Interface SpeechProviderPlugin direkt implementieren
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
        // Credential- + Fetch-Logik
      }),
    );
  },
};

export default plugin;
```

Wichtig sind nicht die genauen Namen der Helfer. Entscheidend ist die Form:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Capability-Contracts
- Channels und Feature-Plugins nutzen Helfer aus `api.runtime.*`, nicht Anbietercode
- Contract-Tests können prüfen, dass das Plugin die Capabilities registriert, die es
  vorgibt zu besitzen

### Beispiel für eine Capability: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Capability. Dasselbe Ownership-Modell gilt auch dort:

1. der Core definiert den Contract für Medienverständnis
2. Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Channel- und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt
   direkt an Anbietercode zu verdrahten

Dadurch werden die Video-Annahmen eines einzelnen Providers nicht in den Core eingebrannt. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Capability-Contract und das Fallback-Verhalten.

Videogenerierung verwendet bereits dieselbe Abfolge: Der Core besitzt den typisierten
Capability-Contract und den Laufzeithelfer, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dafür.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Contracts und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Contract definiert die unterstützten Registrierungspunkte und
die Laufzeithelfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierungen ausgegeben werden
- Contract-Tests können Ownership gebündelter Plugins durchsetzen und stilles Driften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden von Plugins. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Contract-Tests**
   Gebündelte Plugins werden während Testläufen in Contract-Registries erfasst, damit
   OpenClaw Ownership explizit prüfen kann. Heute wird das für Modell-
   Provider, Speech-Provider, Websuch-Provider und Registrierungs-Ownership gebündelter Plugins verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können der Core und Channels nahtlos zusammenspielen, weil Ownership
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Contract gehört

Gute Plugin-Contracts sind:

- typisiert
- klein
- capability-spezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Channels/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Contracts sind:

- anbieterspezifische Richtlinien, die im Core verborgen sind
- einmalige pluginspezifische Escape-Hatches, die die Registry umgehen
- Channel-Code, der direkt in eine Anbieterimplementierung greift
- ad hoc Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel: Heben Sie die Abstraktionsebene an. Definieren Sie zuerst die Capability und
lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Folgen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin ist gleichbedeutend mit beliebiger Codeausführung innerhalb
  des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das meist
gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code zur Entwicklungszeit, nicht als Standard für die Produktion.

Bei gebündelten Workspace-Paketnamen halten Sie die Plugin-ID im npm-
Namen verankert: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zum Vertrauen:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/auf der Allowlist steht.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.
- Vertrauen in gebündelte Plugins wird aus dem Source-Snapshot aufgelöst — dem Manifest und
  Code auf Datenträger zur Ladezeit — und nicht aus Installationsmetadaten. Ein beschädigter
  oder ersetzter Installationseintrag kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend
  über das hinaus erweitern, was die tatsächliche Quelle beansprucht.

## Export-Grenze

OpenClaw exportiert Capabilities, keine Bequemlichkeitsimplementierungen.

Halten Sie die Registrierung von Capabilities öffentlich. Kürzen Sie nichtvertragliche Helferexporte:

- helper-Subpaths speziell für gebündelte Plugins
- Subpaths für Laufzeitverdrahtung, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helfer
- Setup-/Onboarding-Helfer, die Implementierungsdetails sind

Einige Hilfs-Subpaths gebündelter Plugins bleiben aus Kompatibilitätsgründen und für die Pflege gebündelter Plugins weiterhin in der generierten SDK-Export-Map erhalten. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere Seams vom Typ `plugin-sdk/matrix*`. Behandeln Sie diese als
reservierte, implementierungsbezogene Exporte, nicht als empfohlenes SDK-Muster für
neue Drittanbieter-Plugins.

## Interna und Referenz

Für die Lade-Pipeline, das Registry-Modell, Runtime-Hooks für Provider, Gateway-HTTP-
Routen, Schemas für Nachrichtentools, Auflösung von Channel-Zielen, Provider-Kataloge,
Context-Engine-Plugins und die Anleitung zum Hinzufügen einer neuen Capability siehe
[Plugin architecture internals](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugin-Manifest](/de/plugins/manifest)
