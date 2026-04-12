---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Fähigkeitsmodell von Plugins oder Eigentümerschaftsgrenzen verstehen
    - An der Ladepipeline oder Registrierung von Plugins arbeiten
    - Provider-Laufzeit-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Eigentümerschaft, Verträge, Ladepipeline und Laufzeit-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-12T06:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6165a9da8b40de3bb7334fcb16023da5515deb83c4897ca1df1726f4a97db9e0
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **Referenz zur tiefen Architektur**. Praktische Anleitungen finden Sie unter:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzeranleitung
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel-Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider-Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK-Übersicht](/de/plugins/sdk-overview) — Importzuordnung und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                            | Beispiel-Plugins                    |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| Textinferenz           | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`               |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Echtzeit-Stimme        | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                            |
| Channel / Messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **Legacy-Hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core angekommen und wird heute von gebündelten/nativen Plugins
verwendet, aber die Kompatibilität externer Plugins benötigt weiterhin strengere Maßstäbe als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** halten Sie hook-basierte Integrationen funktionsfähig; behandeln Sie
  dies als Kompatibilitäts-Basislinie
- **neue gebündelte/native Plugins:** bevorzugen Sie explizite Fähigkeitsregistrierung statt
  anbieterspezifischer Eingriffe oder neuer Hook-only-Designs
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber behandeln Sie die
  fähigkeitsspezifischen Hilfsoberflächen als weiterentwickelnd, sofern die Docs einen
  Vertrag nicht ausdrücklich als stabil kennzeichnen

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- Legacy-Hooks bleiben während
  des Übergangs der sicherste Weg ohne Brüche für externe Plugins
- exportierte Hilfs-Subpaths sind nicht alle gleichwertig; bevorzugen Sie den schmalen dokumentierten
  Vertrag, nicht beiläufige Hilfsexporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und
  Bildgenerierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine
  Fähigkeiten, Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Aufschlüsselung der Fähigkeiten
eines Plugins zu sehen. Weitere Details finden Sie in der [CLI-Referenz](/cli/plugins#inspect).

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Legacy-Plugins aus der Praxis hängen weiterhin davon ab.

Ausrichtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten zur Modell-/Provider-Überschreibung bevorzugen
- `before_prompt_build` für Arbeiten zur Prompt-Mutation bevorzugen
- erst entfernen, wenn die tatsächliche Nutzung zurückgeht und die Fixture-Abdeckung eine sichere Migration belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Die Konfiguration wird sauber geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Das Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Das Plugin verwendet `before_agent_start`, das veraltet ist |
| **hard error**             | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute kaputt machen --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Erkennung**
   OpenClaw findet potenzielle Plugins aus konfigurierten Pfaden, Workspace-Wurzeln,
   globalen Erweiterungswurzeln und gebündelten Erweiterungen. Die Erkennung liest zuerst native
   `openclaw.plugin.json`-Manifeste plus unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt ist.
3. **Laufzeit-Laden**
   Native OpenClaw-Plugins werden prozessintern über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste verfügbar zu machen.

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Zeit-Metadaten stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw
Root-Befehlsnamen weiterhin vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Erkennung + Konfigurationsvalidierung sollten anhand von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugincode auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Aufteilung ermöglicht es OpenClaw, Konfigurationen zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise aufzubauen, bevor die vollständige Laufzeit aktiv ist.

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Sende-/Bearbeitungs-/Reaktions-Tool registrieren.
OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Channel-Plugins besitzen die channelspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verkabelung, Sitzungs-/Thread-
  Buchführung und Ausführungs-Dispatch
- Channel-Plugins besitzen die bereichsbezogene Aktionserkennung, Fähigkeitserkennung und alle
  channelspezifischen Schemafragmente
- Channel-Plugins besitzen die provider-spezifische Sitzungs-Konversationsgrammatik, also
  wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die finale Aktion über ihren Aktions-Adapter aus

Für Channel-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Erkennungsaufruf
ermöglicht es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schemabeiträge
zusammen zurückzugeben, damit diese Teile nicht auseinanderdriften.

Der Core übergibt den Laufzeitbereich an diesen Erkennungsschritt. Wichtige Felder sind unter anderem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Channel kann
Nachrichtenaktionen abhängig vom aktiven Konto, vom aktuellen Raum/Thread/Nachricht oder
von einer vertrauenswürdigen Anforderer-Identität ausblenden oder verfügbar machen, ohne
channelspezifische Verzweigungen im Core-`message`-Tool fest zu verdrahten.

Deshalb bleiben Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-
Erkennungsgrenze weiterzuleiten, damit das gemeinsame `message`-Tool die richtige
plugin-eigene Oberfläche für den aktuellen Turn verfügbar macht.

Für plugin-eigene Ausführungs-Hilfsfunktionen sollten gebündelte Plugins die Ausführungs-
Laufzeit in ihren eigenen Erweiterungsmodulen behalten. Der Core besitzt nicht länger die Discord-,
Slack-, Telegram- oder WhatsApp-Nachrichtenaktions-Laufzeiten unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpaths, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für provider-benannte SDK-Seams: Der Core sollte
keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, soll er entweder das
eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins nutzen oder den Bedarf
zu einer schmalen generischen Fähigkeit im gemeinsamen SDK befördern.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die in das gemeinsame
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt das gemeinsame Umfrage-Parsing jetzt, bis die Plugin-Umfrage-Dispatch
die Aktion ablehnt, damit plugin-eigene Umfrage-Handler channelspezifische Umfragefelder
akzeptieren können, ohne zuvor vom generischen Umfrage-Parser blockiert zu werden.

Die vollständige Startsequenz finden Sie unter [Ladepipeline](#load-pipeline).

## Modell zur Eigentümerschaft von Fähigkeiten

OpenClaw behandelt ein natives Plugin als Eigentümerschaftsgrenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-bezogenen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Feature-Oberfläche besitzen, die es einführt
- Channels sollten gemeinsame Core-Fähigkeiten nutzen, anstatt Provider-Verhalten
  ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt das Modell-Provider-Verhalten von OpenAI sowie OpenAI-
  Sprache + Echtzeit-Stimme + Medienverständnis + Bildgenerierungs-Verhalten
- das gebündelte Plugin `elevenlabs` besitzt das Sprachverhalten von ElevenLabs
- das gebündelte Plugin `microsoft` besitzt das Sprachverhalten von Microsoft
- das gebündelte Plugin `google` besitzt das Modell-Provider-Verhalten von Google sowie Google-
  Medienverständnis + Bildgenerierung + Websuche-Verhalten
- das gebündelte Plugin `firecrawl` besitzt das Web-Abruf-Verhalten von Firecrawl
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Medienverständnis-Backends
- das gebündelte Plugin `qwen` besitzt das Text-Provider-Verhalten von Qwen sowie
  Medienverständnis- und Videogenerierungs-Verhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Call-Transport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridge, nutzt jedoch gemeinsame Sprach- sowie
  Echtzeit-Transkriptions- und Echtzeit-Stimmen-Fähigkeiten, anstatt Anbieter-Plugins direkt zu importieren

Der angestrebte Endzustand ist:

- OpenAI befindet sich in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  zukünftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberflächenabdeckung tun
- Channels ist es egal, welches Anbieter-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist die entscheidende Unterscheidung:

- **plugin** = Eigentümerschaftsgrenze
- **capability** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung fest verdrahten?“ Die erste Frage ist „wie sieht
der Core-Vertrag für die Videofähigkeit aus?“ Sobald dieser Vertrag existiert,
können Anbieter-Plugins sich dafür registrieren und Channel-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/-Laufzeit verfügbar machen
3. Channels/Features an diese Fähigkeit anbinden
4. Anbieter-Plugins Implementierungen registrieren lassen

So bleibt Eigentümerschaft explizit, während Core-Verhalten vermieden wird, das von einem
einzigen Anbieter oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses Denkmodell, um zu entscheiden, wohin Code gehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Regeln zum Zusammenführen von Konfigurationen, Zustellsemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Auth, Modellkataloge, Sprach-
  synthese, Bildgenerierung, zukünftige Video-Backends, Nutzungsendpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration für Slack/Discord/voice-call/usw.,
  die Core-Fähigkeiten nutzt und auf einer Oberfläche präsentiert

Zum Beispiel folgt TTS dieser Form:

- der Core besitzt Richtlinien für TTS zur Antwortzeit, Fallback-Reihenfolge, Einstellungen und Channel-Zustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Synthese-Implementierungen
- `voice-call` nutzt die TTS-Laufzeit-Hilfsfunktion für Telefonie

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medien-
verständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat,
kann ein Anbieter alle seine Oberflächen an einem Ort besitzen:

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

Worauf es ankommt, sind nicht die exakten Namen der Hilfsfunktionen. Die Form ist entscheidend:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Channels und Feature-Plugins nutzen `api.runtime.*`-Hilfsfunktionen, nicht Anbietercode
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat, von denen es behauptet,
  dass es sie besitzt

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Eigentümerschaftsmodell gilt auch hier:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Channels und Feature-Plugins nutzen das gemeinsame Core-Verhalten, anstatt
   direkt an Anbietercode anzubinden

So wird vermieden, dass Video-Annahmen eines einzelnen Providers in den Core eingebaut werden. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Core besitzt den typisierten
Fähigkeitsvertrag und die Laufzeit-Hilfsfunktion, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dagegen.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeit-Hilfsfunktionen, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Eigentümerschaft ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können die Eigentümerschaft gebündelter Plugins durchsetzen und stille Abweichungen verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, damit
   OpenClaw Eigentümerschaft explizit prüfen kann. Heute wird dies für Modell-
   Provider, Speech-Provider, Websearch-Provider und die Eigentümerschaft gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw von Anfang an weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Channels nahtlos zusammenspielen, weil Eigentümerschaft
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Channels/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Core versteckt sind
- einmalige Plugin-Notausgänge, die die Registry umgehen
- Channel-Code, der direkt in eine Anbieterimplementierung greift
- ad hoc erzeugte Laufzeitobjekte, die kein Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel erhöhen Sie die Abstraktionsebene: Definieren Sie zuerst die Fähigkeit und lassen Sie dann Plugins andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **prozessintern** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb
  des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das meist
gebündelte Skills.

Verwenden Sie Zulassungslisten und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code für die Entwicklungszeit, nicht als Produktionsstandard.

Bei Namen gebündelter Workspace-Pakete sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zum Vertrauensmodell:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert ist bzw. auf der Zulassungsliste steht.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Bequemlichkeit.

Halten Sie die Fähigkeitsregistrierung öffentlich. Beschneiden Sie nicht-vertragliche Hilfsexporte:

- gebündelte pluginspezifische Hilfs-Subpaths
- Subpaths für Laufzeit-Verkabelung, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Hilfsfunktionen
- Setup-/Onboarding-Hilfsfunktionen, die Implementierungsdetails sind

Einige gebündelte Plugin-Hilfs-Subpaths verbleiben aus Kompatibilitätsgründen und für die Wartung gebündelter Plugins weiterhin in der generierten SDK-Exportzuordnung. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte mit Implementierungsdetails, nicht als das empfohlene SDK-Muster für
neue Drittanbieter-Plugins.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. potenzielle Plugin-Wurzeln erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. für jeden Kandidaten die Aktivierung entscheiden
6. aktivierte native Module via jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein Legacy-Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeit-Oberflächen verfügbar machen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst das jeweils vorhandene auf (`def.register ?? def.activate`) und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsschranken greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt die Plugin-Wurzel verlässt, der Pfad weltweit beschreibbar ist oder die Pfad-
Eigentümerschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-First-Verhalten

Das Manifest ist die Quelle der Wahrheit auf der Control Plane. OpenClaw nutzt es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in der Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu erhalten, ohne die Plugin-Laufzeit zu laden

Bei nativen Plugins ist das Laufzeitmodul der Teil der Data Plane. Es registriert
das tatsächliche Verhalten, etwa Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale `activation`- und `setup`-Blöcke im Manifest bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen weder die Laufzeitregistrierung, `register(...)` noch `setupEntry`.

Die Setup-Erkennung bevorzugt jetzt deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin setupzeitige Laufzeit-Hooks benötigen. Wenn mehr als
ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-ID beansprucht,
verweigert die Setup-Suche den mehrdeutigen Besitzer, anstatt sich auf die Erkennungsreihenfolge zu verlassen.

### Was der Loader cached

OpenClaw hält kurze prozessinterne Caches für:

- Erkennungsergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren Lastspitzen beim Start und den Overhead wiederholter Befehle. Man kann sie sich
sicher als kurzlebige Performance-Caches vorstellen, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, anstatt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt brauchen: „die Registry lesen“ statt „für jedes Plugin-
Modul einen Spezialfall bauen“.

## Callbacks für Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungsanfrage genehmigt oder abgelehnt wurde:

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

Felder der Callback-Nutzlast:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragenzusammenfassung, Hinweis zum Lösen der Bindung, Absender-ID und
  Konversationsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er läuft, nachdem die Genehmigungsverarbeitung im Core abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für kostengünstige Provider-Abfragen von Umgebungs-Auth
  vor dem Laden der Laufzeit, `providerAuthAliases` für Provider-Varianten, die sich
  Auth teilen, `channelEnvVars` für kostengünstige Channel-Abfragen von Umgebung/Setup vor dem Laden der Laufzeit,
  sowie `providerAuthChoices` für kostengünstige Onboarding-/Auth-Auswahllabels und
  Metadaten für CLI-Flags vor dem Laden der Laufzeit
- Hooks zur Konfigurationszeit: `catalog` / Legacy-`discovery` sowie `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, die Behandlung von Transkripten und
die Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für provider-spezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenz-Transport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider umgebungsbasierte Zugangsdaten hat,
die generische Auth-/Status-/Modellauswahlpfade ohne Laden der Plugin-
Laufzeit sehen sollen. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die
Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Auth und die API-Key-Onboarding-Auswahl
einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
CLI-Oberflächen für Onboarding/Auth-Auswahl die Auswahl-ID des Providers, Gruppenlabels und einfache
Auth-Verdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie zur Laufzeit des Providers
`envVars` für betreiberseitige Hinweise wie Onboarding-Labels oder
Setup-Variablen für OAuth-Client-ID/Client-Secret bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Channel umgebungsgetriebene Auth oder Einrichtung hat,
die generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne die Channel-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist der schnelle Entscheidungsleitfaden.

| #   | Hook                              | Was er tut                                                                                                     | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht Provider-Konfiguration in `models.providers` während der Generierung von `models.json`         | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Wendet provider-eigene globale Konfigurationsstandards während der Materialisierung der Konfiguration an      | Standardwerte hängen vom Auth-Modus, der Umgebung oder der Semantik der Modellfamilie des Providers ab                                     |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                   | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Vorschau-Aliasse für Modell-IDs vor der Suche                                       | Der Provider besitzt die Alias-Bereinigung vor der kanonischen Modellauflösung                                                              |
| 4   | `normalizeTransport`              | Normalisiert providerfamilienbezogene `api` / `baseUrl` vor der generischen Modellassemblierung              | Der Provider besitzt die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                           |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                     | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Hilfsfunktionen der Google-Familie stützen außerdem unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet Umschreibungen der Kompatibilität für native Streaming-Nutzung auf Konfigurations-Provider an          | Der Provider benötigt endpunktgesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                           |
| 7   | `resolveConfigApiKey`             | Löst Env-Marker-Auth für Konfigurations-Provider vor dem Laden der Laufzeit-Auth auf                          | Der Provider besitzt eine provider-eigene API-Key-Auflösung für Env-Marker; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/selbstgehostete oder konfigurationsgestützte Auth sichtbar, ohne Klartext zu persistieren       | Der Provider kann mit einem synthetischen/lokalen Anmeldedaten-Marker betrieben werden                                                     |
| 9   | `resolveExternalAuthProfiles`     | Legt provider-eigene externe Auth-Profile darüber; Standard für `persistence` ist `runtime-only` für CLI-/app-eigene Anmeldedaten | Der Provider verwendet externe Auth-Anmeldedaten wieder, ohne kopierte Refresh-Tokens zu persistieren                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Ordnet gespeicherte synthetische Profil-Platzhalter hinter umgebungs-/konfigurationsgestützte Auth ein       | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang erhalten sollten                                                 |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind              | Der Provider akzeptiert beliebige vorgelagerte Modell-IDs                                                                                   |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 13  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet                                | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                               |
| 14  | `contributeResolvedModelCompat`   | Liefert Kompatibilitäts-Flags für Anbietermodelle hinter einem anderen kompatiblen Transport                  | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                          |
| 15  | `capabilities`                    | Provider-eigene Metadaten für Transkripte/Tooling, die von gemeinsamer Core-Logik verwendet werden           | Der Provider benötigt Besonderheiten für Transkripte oder die Provider-Familie                                                              |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der Embedded Runner sie sieht                                                | Der Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                           |
| 17  | `inspectToolSchemas`              | Macht provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar                                       | Der Provider möchte Keyword-Warnungen bereitstellen, ohne dem Core providerspezifische Regeln beizubringen                                 |
| 18  | `resolveReasoningOutputMode`      | Wählt den nativen oder den getaggten Vertrag für Reasoning-Ausgabe                                            | Der Provider benötigt getaggte Reasoning-/Final-Ausgabe anstelle nativer Felder                                                            |
| 19  | `prepareExtraParams`              | Normalisierung von Anforderungsparametern vor generischen Wrappern für Stream-Optionen                        | Der Provider benötigt Standard-Anforderungsparameter oder provider-spezifische Bereinigung von Parametern                                  |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                        | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                      |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                  | Der Provider benötigt Kompatibilitäts-Wrapper für Anfrage-Header/Body/Modell ohne benutzerdefinierten Transport                           |
| 22  | `resolveTransportTurnState`       | Hängt native transportbezogene Header oder Metadaten pro Turn an                                              | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder eine Session-Cool-down-Richtlinie an                                       | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien anpassen                                       |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: Das gespeicherte Profil wird zum Laufzeit-String `apiKey`                        | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Tokenform zur Laufzeit                             |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Richtlinien bei Refresh-Fehlern   | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                              |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Der Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                                                    | Der Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                          |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung der Failover-Ursache                                                          | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                      |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                     | Der Provider benötigt proxy-spezifische Steuerung für Cache-TTL                                                                             |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                      | Der Provider benötigt einen provider-spezifischen Hinweis zur Wiederherstellung bei fehlender Auth                                          |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter vorgelagerter Modelle plus optionaler benutzerseitiger Fehlerhinweis                | Der Provider muss veraltete vorgelagerte Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                       |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                    | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Auswahllisten                                    |
| 33  | `isBinaryThinking`                | Ein/Aus-Schalter für Reasoning bei Providern mit binärem Thinking                                             | Der Provider bietet nur binäres Thinking ein/aus an                                                                                        |
| 34  | `supportsXHighThinking`           | Unterstützung für `xhigh`-Reasoning bei ausgewählten Modellen                                                 | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 35  | `resolveDefaultThinkingLevel`     | Standardstufe für `/think` für eine bestimmte Modellfamilie                                                   | Der Provider besitzt die Standardrichtlinie für `/think` für eine Modellfamilie                                                            |
| 36  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profil-Filter und Smoke-Auswahl                                          | Der Provider besitzt die Zuordnung für bevorzugte Modelle bei Live-/Smoke-Auswahl                                                          |
| 37  | `prepareRuntimeAuth`              | Tauscht eine konfigurierte Anmeldedaten kurz vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel um | Der Provider benötigt einen Token-Austausch oder kurzlebige Anfrage-Anmeldedaten                                                           |
| 38  | `resolveUsageAuth`                | Löst Nutzungs-/Abrechnungs-Anmeldedaten für `/usage` und verwandte Status-Oberflächen auf                     | Der Provider benötigt benutzerdefiniertes Parsing für Nutzungs-/Quota-Token oder andere Nutzungs-Anmeldedaten                              |
| 39  | `fetchUsageSnapshot`              | Ruft provider-spezifische Nutzungs-/Quota-Snapshots ab und normalisiert sie, nachdem die Auth aufgelöst wurde | Der Provider benötigt einen provider-spezifischen Nutzungsendpunkt oder einen Parser für die Nutzlast                                      |
| 40  | `createEmbeddingProvider`         | Baut einen provider-eigenen Embedding-Adapter für Speicher/Suche                                               | Das Verhalten von Speicher-Embeddings gehört zum Provider-Plugin                                                                            |
| 41  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Transkriptbehandlung für den Provider steuert                     | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                      |
| 42  | `sanitizeReplayHistory`           | Schreibt den Replay-Verlauf nach der generischen Transkript-Bereinigung um                                     | Der Provider benötigt provider-spezifische Umschreibungen für Replay über gemeinsame Kompaktierungs-Hilfsfunktionen hinaus                 |
| 43  | `validateReplayTurns`             | Finale Validierung oder Umformung von Replay-Turns vor dem Embedded Runner                                     | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Validierung von Turns                                      |
| 44  | `onModelSelected`                 | Führt provider-eigene Seiteneffekte nach der Auswahl aus                                                       | Der Provider benötigt Telemetrie oder provider-eigenen Zustand, wenn ein Modell aktiv wird                                                 |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und fallen dann auf andere hook-fähige Provider-Plugins zurück,
bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. So bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten Konfigurationseintrag
der Google-Familie umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer diese
Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten
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
  und `wrapStreamFn`, weil es Vorwärtskompatibilität für Claude 4.6,
  Hinweise zur Provider-Familie, Richtlinien zur Auth-Reparatur, Integration des
  Nutzungsendpunkts, Eignung für Prompt-Cache, Auth-bewusste Konfigurationsstandards, die
  Standard-/adaptive Thinking-Richtlinie für Claude und Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Anthropics Claude-spezifische Stream-Hilfsfunktionen bleiben vorerst in der eigenen
  öffentlichen `api.ts`- / `contract-api.ts`-Seam des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Builder für Anthropic-Wrapper, statt das generische SDK anhand der Beta-Header-Regeln eines
  einzelnen Providers zu verbreitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es Vorwärtskompatibilität für GPT-5.4, die direkte
  Normalisierung von OpenAI `openai-completions` -> `openai-responses`, Codex-bewusste Auth-
  Hinweise, Spark-Unterdrückung, synthetische Zeilen für OpenAI-Listen und die Thinking- /
  Live-Modell-Richtlinie für GPT-5 besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche,
  Formung von Reasoning-Compat-Payloads und Responses-Kontextverwaltung.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider Durchleitung ist und neue
  Modell-IDs verfügbar machen kann, bevor der statische Katalog von OpenClaw aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, damit
  provider-spezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien nicht im Core landen. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  die Proxy-Reasoning-Injektion und die Überspring-Logik für nicht unterstützte Modelle / `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  provider-eigenes Device-Login, Fallback-Verhalten für Modelle, Besonderheiten bei Claude-Transkripten,
  einen GitHub-Token -> Copilot-Token-Austausch und einen provider-eigenen Nutzungsendpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf Core-OpenAI-Transporten läuft, aber seine Normalisierung von
  Transport/`baseUrl`, die Fallback-Richtlinie für OAuth-Refresh, die Standardwahl des
  Transports, synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` Vorwärtskompatibilitäts-Fallback für Gemini 3.1,
  native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replay,
  den getaggten Modus für Reasoning-Ausgabe und die Zuordnung moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Gemini-Thinking-Payload besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und die Verdrahtung des Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, damit Claude-spezifische Replay-Bereinigung auf Claude-IDs
  beschränkt bleibt statt auf jeden Transport `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es
  Bedrock-spezifische Klassifizierung von Drosselungs-/Nicht-bereit-/Kontextüberlauf-Fehlern
  für Anthropic-on-Bedrock-Datenverkehr besitzt; seine Replay-Richtlinie teilt sich weiterhin
  dieselbe nur auf Claude bezogene Absicherung `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und eine
  Bereinigung von Gemini-Thought-Signatures ohne native Gemini-Replay-Validierung oder
  Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl Semantik von
  Anthropic-Messages als auch OpenAI-Kompatibilität besitzt; es behält das nur auf Claude bezogene
  Entfernen von Thinking-Blöcken auf der Anthropic-Seite bei und überschreibt den
  Reasoning-Ausgabemodus zurück auf nativ, und die Stream-Familie `minimax-fast-mode` besitzt
  Umschreibungen von Fast-Mode-Modellen auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` plus `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber provider-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` ordnet Konfiguration plus `/think`-Status seiner
  nativen binären Thinking-Payload zu.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Request-Header,
  Normalisierung von Reasoning-Payload, Hinweise für Gemini-Transkripte und Steuerung der Anthropic-
  Cache-TTL benötigt; die Stream-Familie `kilocode-thinking` hält die Injektion von Kilo-Thinking
  auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, UX für binäres Thinking, Zuordnung moderner Modelle und sowohl
  Nutzungs-Auth als auch Abruf von Quotas besitzt; die Stream-Familie `tool-stream-default-on` hält
  den standardmäßig aktivierten `tool_stream`-Wrapper aus handgeschriebener Provider-Logik heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es Normalisierung für nativen xAI-Responses-Transport, Umschreibungen von Grok-
  Fast-Mode-Aliassen, Standardwerte für `tool_stream`, Bereinigung von Strict-Tool / Reasoning-Payload,
  Wiederverwendung von Fallback-Auth für plugin-eigene Tools, Vorwärtskompatibilität bei der Auflösung von Grok-
  Modellen und provider-eigene Kompatibilitätspatches wie xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und Dekodierung von
  Tool-Call-Argumenten mit HTML-Entities besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um Besonderheiten bei
  Transkripten/Tooling aus dem Core herauszuhalten.
- Gebündelte Provider nur mit Katalog wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten plugin-eigen ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Hilfsfunktionen

Plugins können über `api.runtime` auf ausgewählte Hilfsfunktionen des Core zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Oberflächen wie Datei/Sprachnotiz zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Samplerate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist je nach Provider optional. Verwenden Sie es für anbieter-eigene Voice-Picker oder Setup-Abläufe.
- Sprachlisten können reichhaltigere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeitstags für provider-bewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

Plugins können auch Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Behalten Sie TTS-Richtlinien, Fallback und Antwortzustellung im Core.
- Verwenden Sie Speech-Provider für anbieter-eigenes Syntheseverhalten.
- Die Legacy-Eingabe `edge` von Microsoft wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Eigentümerschaftsmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt einer generischen Key/Value-Tasche:

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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Core.
- Behalten Sie Anbieterverhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und die Laufzeit-Hilfsfunktion
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins nutzen `api.runtime.videoGeneration.*`

Für Laufzeit-Hilfsfunktionen des Medienverständnisses können Plugins Folgendes aufrufen:

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

Für Audio-Transkription können Plugins entweder die Laufzeit des Medienverständnisses
oder das ältere STT-Alias verwenden:

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
- Verwendet die Audio-Konfiguration des Core für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können auch Hintergrundläufe von Subagents über `api.runtime.subagent` starten:

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
- Für plugin-eigene Fallback-Läufe müssen Betreiber mit `plugins.entries.<id>.subagent.allowModelOverride: true` explizit zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Läufe von Subagents aus nicht vertrauenswürdigen Plugins funktionieren weiterhin, aber Überschreibungsanforderungen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins die gemeinsame Laufzeit-Hilfsfunktion nutzen, statt
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

Plugins können Websearch-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung von Zugangsdaten und gemeinsame Anfrage-Semantik im Core.
- Verwenden Sie Websearch-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Wrapper des Agent-Tools abhängig zu sein.

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

- `generate(...)`: Erzeugt ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung.
- `listProviders(...)`: Listet verfügbare Provider für Bildgenerierung und ihre Fähigkeiten auf.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte über `api.registerHttpRoute(...)` bereitstellen.

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
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Auth zu verlangen, oder `"plugin"` für plugin-verwaltete Auth/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Ermöglicht demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann keine Route eines anderen Plugins ersetzen.
- Sich überschneidende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`-/`prefix`-Fallthrough-Ketten nur auf derselben `auth`-Stufe.
- Routen mit `auth: "plugin"` erhalten nicht automatisch Runtime-Scopes des Operators. Sie sind für plugin-verwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Runtime-Scopes für Gateway-Anfragen, aber dieser Scope ist absichtlich konservativ:
  - Bearer-Auth mit gemeinsamem Geheimnis (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header ausdrücklich vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen Plugin-Routenanfragen mit Identität fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route rein administratives Verhalten benötigt, verlangen Sie einen identitätsführenden Auth-Modus und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie SDK-Subpaths statt des monolithischen Imports `openclaw/plugin-sdk`,
wenn Sie Plugins erstellen:

- `openclaw/plugin-sdk/plugin-entry` für Primitive zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas von `openclaw.json`
  an der Wurzel (`OpenClawSchema`).
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
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Auth/Antwort/Webhook.
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Mention-Matching,
  Hilfsfunktionen für Mention-Richtlinien bei eingehenden Nachrichten, Envelope-Formatierung und
  Hilfsfunktionen für den Kontext eingehender Envelopes.
  `channel-setup` ist die schmale Setup-Seam für optionale Installation.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich der importsicheren Setup-Patch-Adapter.
  `setup-adapter-runtime` ist die umgebungsbewusste Adapter-Seam für die Kontoeinrichtung.
  `setup-tools` ist die kleine Helfer-Seam für CLI/Archive/Docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domänen-Subpaths wie `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurations-Hilfsfunktionen.
  `telegram-command-config` ist die schmale öffentliche Seam für die Normalisierung/Validierung von benutzerdefinierten
  Telegram-Befehlen und bleibt verfügbar, auch wenn die gebündelte
  Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Seam für Text/Markdown/Logging, einschließlich
  des Entfernens von für Assistenten sichtbarem Text, Hilfsfunktionen zum Rendern/Chunking von Markdown, Hilfsfunktionen zur
  Schwärzung, Hilfsfunktionen für Direktiven-Tags und sichere Text-Utilities.
- Approval-spezifische Channel-Seams sollten einen einzigen `approvalCapability`-
  Vertrag auf dem Plugin bevorzugen. Der Core liest dann Approval-Auth, Zustellung, Rendering,
  natives Routing und Verhalten des lazy nativen Handlers über diese eine Fähigkeit,
  statt Approval-Verhalten in nicht zusammenhängende Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte stattdessen die schmaleren
  generischen Primitive importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Interna gebündelter Erweiterungen bleiben privat. Externe Plugins sollten nur
  Subpaths `openclaw/plugin-sdk/*` verwenden. Core-/Test-Code von OpenClaw kann die öffentlichen
  Repo-Einstiegspunkte unter einer Plugin-Paketwurzel wie `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng begrenzte Dateien wie
  `login-qr-api.js` verwenden. Importieren Sie niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Erweiterung.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Hilfsfunktionen/Typen,
  `<plugin-package-root>/runtime-api.js` ist das reine Laufzeit-Barrel,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt des gebündelten Plugins
  und `<plugin-package-root>/setup-entry.js` ist der Einstiegspunkt des Setup-Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Hilfsfunktionen wie
    `wrapAnthropicProviderStream`, Hilfsfunktionen für Beta-Header und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Hilfsfunktionen für Standardmodelle und
    Builder für Realtime-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration,
    während `register.runtime.js` weiterhin generische
    `plugin-sdk/provider-stream`-Hilfsfunktionen für die repo-lokale Verwendung reexportieren kann.
- Öffentlich verfügbare Einstiegspunkte, die per Facade geladen werden, bevorzugen den aktiven Runtime-Konfigurations-Snapshot,
  wenn einer existiert, und fallen andernfalls auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Runtime-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Eine kleine
  reservierte Kompatibilitätsmenge gebündelter, channelmarkierter Hilfs-Seams existiert weiterhin.
  Behandeln Sie diese als Seams für gebündelte Wartung/Kompatibilität, nicht als neue Importziele für Dritte; neue channelübergreifende Verträge sollten weiterhin auf
  generischen Subpaths `plugin-sdk/*` oder in den plugin-lokalen Barrels `api.js` /
  `runtime-api.js` landen.

Hinweis zur Kompatibilität:

- Vermeiden Sie für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Subpaths für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Ziel-Parsing/-Matching gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Nachrichtenaktionen und Hilfsfunktionen für Reaktions-Nachrichten-IDs gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Gebündelte erweiterungsspezifische Hilfs-Barrels sind standardmäßig nicht stabil. Wenn eine
  Hilfsfunktion nur von einer gebündelten Erweiterung benötigt wird, behalten Sie sie hinter der
  lokalen Seam `api.js` oder `runtime-api.js` der Erweiterung, statt sie nach
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Hilfs-Seams sollten generisch sein, nicht channelmarkiert. Gemeinsames Ziel-
  Parsing gehört auf `openclaw/plugin-sdk/channel-targets`; channelspezifische
  Interna bleiben hinter der lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Subpaths wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie
  heute verwenden. Ihr Vorhandensein bedeutet für sich genommen nicht, dass jede exportierte Hilfsfunktion ein
  langfristig eingefrorener externer Vertrag ist.

## Schemata des Nachrichtentools

Plugins sollten channelspezifische Schemabeiträge für `describeMessageTool(...)`
besitzen. Behalten Sie providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsam nutzbare portable Schemafragmente verwenden Sie die generischen Hilfsfunktionen wieder, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil eines Button-Rasters
- `createMessageToolCardSchema()` für strukturierte Karten-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definieren Sie sie im
eigenen Quellcode dieses Plugins, statt sie in das gemeinsame SDK zu befördern.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channelspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Verzeichnissuche als `direct`, `group` oder `channel` behandelt
  werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt in eine ID-ähnliche Auflösung gehen sollte statt in die Verzeichnissuche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine endgültige provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die provider-spezifische Sitzungs-
  Routenkonstruktion, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen vom Typ „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für provider-spezifischen Normalisierungs-Fallback, nicht für
  eine breite Verzeichnissuche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- von der Zulassungsliste getriebene DM-Peers
- konfigurierte Kanal-/Gruppen-Zuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` behandeln nur generische Operationen:

- Filterung von Abfragen
- Anwendung von Limits
- Hilfsfunktionen zum Deduplizieren/Normalisieren
- Aufbau von `ChannelDirectoryEntry[]`

Channelspezifische Konto-Inspektion und ID-Normalisierung sollten in der
Plugin-Implementierung verbleiben.

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
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Config-
  Reparaturabläufe sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um die Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur den deskriptiven Kontostatus zurück.
- Bewahren Sie `enabled` und `configured`.
- Schließen Sie Felder zur Quelle/zum Status von Zugangsdaten ein, wenn relevant, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine Rohwerte von Tokens zurückgeben, nur um die Verfügbarkeit
  schreibgeschützt zu melden. `tokenStatus: "available"` (und das passende Quellenfeld)
  reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn ein Zugangsdatenwert über SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar ist.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ melden,
statt abzustürzen oder das Konto fälschlich als nicht konfiguriert darzustellen.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Erweiterungen auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis herausführen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Bäume von Plugin-Abhängigkeiten bei
„purem JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges reines Setup-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegspunkts. So bleiben Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt des Plugins auch Tools, Hooks oder anderen reinen Laufzeit-
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin auf denselben Pfad `setupEntry` während der
Startup-Phase des Gateways vor dem Listen opt-in setzen, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche vollständig abdeckt, die
existieren muss, bevor das Gateway beginnt zu lauschen. In der Praxis bedeutet das, dass der
Setup-Einstiegspunkt jede channel-eigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche Startup-Fähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Belassen Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Einstiegspunkt während des Starts laden.

Gebündelte Channels können auch Hilfsfunktionen für Setup-only-Vertragsoberflächen veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Channel-Laufzeit geladen ist. Die aktuelle Oberfläche für Setup-
Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine Legacy-Single-Account-Channel-
Konfiguration nach `channels.<id>.accounts.*` promoten muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes promotetes Konto, wenn benannte Konten bereits existieren, und es kann einen
konfigurierten nicht-kanonischen Standard-Kontoschlüssel beibehalten, statt immer
`accounts.default` zu erzeugen.

Diese Setup-Patch-Adapter halten die Erkennung gebündelter Vertragsoberflächen lazy. Die Import-
Zeit bleibt leicht; die Promotionsoberfläche wird erst bei der ersten Verwendung geladen, statt
beim Modulimport erneut in den Startup gebündelter Channels einzutreten.

Wenn diese Startup-Oberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

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

### Katalogmetadaten für Channels

Channel-Plugins können Setup-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekannt machen. So bleibt der Core-Katalog datenfrei.

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

Nützliche Felder von `openclaw.channel` über das minimale Beispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Status-Oberflächen
- `docsLabel`: überschreibt den Linktext für den Docs-Link
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die von diesem Katalogeintrag übertroffen werden sollen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerelemente für Text auf Auswahloberflächen
- `markdownCapable`: markiert den Channel als markdownfähig für Entscheidungen zur Outbound-Formatierung
- `exposure.configured`: blendet den Channel aus Oberflächen zur Auflistung konfigurierter Channels aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Channel aus interaktiven Setup-/Configure-Pickern aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Channel für Oberflächen der Docs-Navigation als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: optiert den Channel in den Standardablauf `allowFrom` des Quickstarts ein
- `forceAccountBinding`: verlangt explizite Kontobindung, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann auch **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export einer MPM-
Registry). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Sitzungs-Kontexts für Ingest, Zusammenstellung
und Kompaktierung. Registrieren Sie sie in Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine über
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontextpipeline ersetzen oder erweitern muss, anstatt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Kompaktierungsalgorithmus **nicht** besitzt, behalten Sie `compact()`
implementiert und delegieren Sie explizit:

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

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Eingriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurationszusammenführung,
   Lebenszyklus, channelseitige Semantik und Form der Laufzeit-Hilfsfunktion.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core- + Channel-/Feature-Konsumenten anbinden
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Core nutzen,
   nicht durch direkten Import einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends für die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne an die Weltsicht eines einzelnen
Providers fest verdrahtet zu werden. Eine konkrete Datei-Checkliste und ein durchgearbeitetes Beispiel finden Sie im [Capability Cookbook](/de/plugins/architecture).

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung normalerweise diese
Oberflächen gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Hilfsfunktion in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Plugin-Laufzeit-Exposition in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie nutzen müssen
- Hilfsfunktionen zum Erfassen/Testen in `src/test-utils/plugin-registration.ts`
- Eigentümerschafts-/Vertrags-Assertions in `src/plugins/contracts/registry.ts`
- Betreiber-/Plugin-Dokumentation in `docs/`

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

Damit bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Channel-Plugins nutzen Laufzeit-Hilfsfunktionen
- Vertragstests halten Eigentümerschaft explizit
