---
read_when:
    - Erstellen oder Debuggen nativer OpenClaw-Plugins
    - Verständnis des Plugin-Fähigkeitsmodells oder der Zuständigkeitsgrenzen
    - Arbeiten an der Plugin-Ladepipeline oder der Registry
    - Implementierung von Provider-Laufzeit-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeit, Verträge, Ladepipeline und Laufzeithelfer'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-21T13:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **umfassende Architekturreferenz**. Praktische Anleitungen finden Sie hier:
  - [Install and use plugins](/de/tools/plugin) — Benutzerleitfaden
  - [Getting Started](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK Overview](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des Plugin-Systems von OpenClaw.

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
| Bilderzeugung          | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikerzeugung         | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Videoerzeugung         | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                            |
| Kanal / Messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **Legacy-hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core eingeführt und wird heute von gebündelten/nativen Plugins
verwendet, aber die Kompatibilität externer Plugins braucht weiterhin eine strengere Messlatte als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen funktionsfähig halten; dies
  als Kompatibilitätsbasis behandeln
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung gegenüber
  anbieterspezifischen Sonderzugriffen oder neuen Hook-only-Designs bevorzugen
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber die
  fähigkeitsspezifischen Hilfsoberflächen als in Entwicklung behandeln, sofern die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil kennzeichnet

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- Legacy-Hooks bleiben während
  des Übergangs der sicherste No-Breakage-Pfad für externe Plugins
- exportierte Hilfs-Subpfade sind nicht alle gleich; den schmalen dokumentierten
  Vertrag bevorzugen, nicht beiläufig exportierte Hilfen

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bilderzeugung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Fähigkeitsaufschlüsselung
eines Plugins anzuzeigen. Siehe [CLI reference](/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Reale Legacy-Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeit an Modell-/Provider-Überschreibungen bevorzugen
- `before_prompt_build` für Arbeit an Prompt-Mutationen bevorzugen
- erst entfernen, wenn die reale Nutzung sinkt und Fixture-Abdeckung eine sichere Migration belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eine dieser Kennzeichnungen:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` führen heute zum Ausfall Ihres Plugins --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Erkennung**
   OpenClaw findet potenzielle Plugins aus konfigurierten Pfaden, Workspace-Wurzeln,
   globalen Erweiterungswurzeln und gebündelten Erweiterungen. Die Erkennung liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt ist.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden prozessintern über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Oberflächenkonsum**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Metadaten zur Parse-Zeit stammen aus `registerCli(..., { descriptors: [...] })`
- das echte Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

So bleibt der plugin-eigene CLI-Code im Plugin, während OpenClaw dennoch
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Entwurfsgrenze:

- Erkennung + Konfigurationsvalidierung sollten anhand von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugincode auszuführen
- natives Laufzeitverhalten stammt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Kanal-Plugins und das gemeinsame Nachrichtentool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren. OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Kanal-Plugins besitzen die kanalspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verdrahtung, Sitzungs-/Thread-
  Verwaltung und die Ausführungsweiterleitung
- Kanal-Plugins besitzen die bereichsspezifische Aktionserkennung, Fähigkeitserkennung und alle
  kanalspezifischen Schemafragmente
- Kanal-Plugins besitzen providerspezifische Grammatik für Sitzungs-Konversationen, z. B.
  wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Erkennungsaufruf ermöglicht es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schemabeiträge gemeinsam zurückzugeben, damit diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Nachrichtentool-Parameter eine Medienquelle wie einen
lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin auch
`mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden,
ohne plugin-eigene Parameternamen fest zu codieren.
Bevorzugen Sie dort aktionsbezogene Maps statt einer flachen kanalweiten Liste, damit ein
nur profilbezogener Medienparameter nicht bei nicht verwandten Aktionen wie
`send` normalisiert wird.

Der Core übergibt Laufzeit-Scope in diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Kanal kann
Nachrichtenaktionen basierend auf dem aktiven Konto, dem aktuellen Raum/Thread/der aktuellen Nachricht oder der
vertrauenswürdigen Anfordereridentität ausblenden oder anzeigen, ohne kanalspezifische Verzweigungen
im gemeinsamen `message`-Tool des Core fest zu codieren.

Deshalb bleiben Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die
pluginseitige Erkennungsgrenze weiterzugeben, damit das gemeinsame `message`-Tool die richtige, kanalbesitzte
Oberfläche für den aktuellen Turn bereitstellt.

Für kanalbesitzte Ausführungshilfen sollten gebündelte Plugins die Ausführungs-
Laufzeit in ihren eigenen Erweiterungsmodulen behalten. Der Core besitzt nicht mehr die Discord-,
Slack-, Telegram- oder WhatsApp-Nachrichtenaktions-Laufzeiten unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpfade, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
erweiterungsbesitzten Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, entweder das
eigene `api.ts`-/`runtime-api.ts`-Barrel des gebündelten Plugins nutzen oder den Bedarf
in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum allgemeinen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt das gemeinsame Umfrage-Parsing jetzt, bis die pluginseitige Umfrage-
Weiterleitung die Aktion ablehnt, sodass plugin-eigene Umfrage-Handler kanalspezifische
Umfragefelder akzeptieren können, ohne zuvor vom generischen Umfrage-Parser blockiert zu werden.

Siehe [Load pipeline](#load-pipeline) für die vollständige Startsequenz.

## Modell für Fähigkeitszuständigkeit

OpenClaw behandelt ein natives Plugin als Zuständigkeitsgrenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium unzusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die vollständige von ihm eingeführte
  Feature-Oberfläche besitzen
- Kanäle sollten gemeinsame Core-Fähigkeiten nutzen, anstatt
  Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte `openai`-Plugin besitzt das Verhalten des OpenAI-Modell-Providers und das OpenAI-Verhalten für
  Sprache + Echtzeit-Stimme + Medienverständnis + Bilderzeugung
- das gebündelte `elevenlabs`-Plugin besitzt das ElevenLabs-Sprachverhalten
- das gebündelte `microsoft`-Plugin besitzt das Microsoft-Sprachverhalten
- das gebündelte `google`-Plugin besitzt das Verhalten des Google-Modell-Providers sowie das Google-Verhalten für
  Medienverständnis + Bilderzeugung + Websuche
- das gebündelte `firecrawl`-Plugin besitzt das Firecrawl-Web-Abruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte `qwen`-Plugin besitzt das Qwen-Text-Provider-Verhalten sowie
  das Verhalten für Medienverständnis und Videoerzeugung
- das `voice-call`-Plugin ist ein Feature-Plugin: Es besitzt Anruftransport, Tools,
  CLI, Routen und Twilio-Medienstream-Überbrückung, nutzt aber gemeinsame Fähigkeiten für Sprache
  sowie Echtzeit-Transkription und Echtzeit-Stimme, anstatt
  Anbieter-Plugins direkt zu importieren

Der angestrebte Endzustand ist:

- OpenAI lebt in einem einzigen Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftig Video umfasst
- ein anderer Anbieter kann dasselbe für seinen eigenen Oberflächenbereich tun
- Kanäle interessiert nicht, welches Anbieter-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist der entscheidende Unterschied:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung fest codieren?“ Die erste Frage lautet „wie sieht
der Core-Vertrag für die Videofähigkeit aus?“ Sobald dieser Vertrag existiert, können Anbieter-Plugins
sich dafür registrieren, und Kanal-/Feature-Plugins können ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit verfügbar machen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

So bleibt die Zuständigkeit explizit, während Core-Verhalten vermieden wird, das von einem
einzigen Anbieter oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Fähigkeitsschichtung

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wohin Code gehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Regeln zur Konfigurationszusammenführung, Auslieferungssemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprache-
  synthese, Bilderzeugung, künftige Video-Backends, Nutzungsendpunkte
- **Kanal-/Feature-Plugin-Schicht**: Slack-/Discord-/voice-call-/usw.-Integration,
  die Core-Fähigkeiten nutzt und auf einer Oberfläche präsentiert

Zum Beispiel folgt TTS dieser Form:

- der Core besitzt die TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalauslieferung
- `openai`, `elevenlabs` und `microsoft` besitzen Syntheseimplementierungen
- `voice-call` nutzt den TTS-Laufzeithelfer für Telefonie

Dasselbe Muster sollte für künftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medien-
verständnis, Bilderzeugung, Videoerzeugung, Web-Abruf und Websuche hat,
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

Wichtig sind nicht die exakten Hilfsnamen. Wichtig ist die Form:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins nutzen `api.runtime.*`-Hilfen, nicht Anbietercode
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat, die es
  nach eigener Aussage besitzt

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Zuständigkeitsmodell gilt auch hier:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren je nach Fall `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Kanal- und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt
   direkt an Anbietercode zu verdrahten

So werden die Videoannahmen eines einzelnen Providers nicht in den Core eingebrannt. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videoerzeugung verwendet bereits dieselbe Reihenfolge: Der Core besitzt den typisierten
Fähigkeitsvertrag und den Laufzeithelfer, und Anbieter-Plugins registrieren
`api.registerVideoGenerationProvider(...)`-Implementierungen dafür.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeithelfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Zuständigkeit ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können die Zuständigkeit gebündelter Plugins durchsetzen und stilles Driften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Zuständigkeit explizit prüfen kann. Heute wird das für Modell-
   Provider, Speech-Provider, Websuch-Provider und die Zuständigkeit gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammenspielen, weil die Zuständigkeit
deklariert, typisiert und testbar ist, statt implizit zu bleiben.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Core verborgen sind
- einmalige Plugin-Ausnahmepfade, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel die Abstraktionsebene anheben: zuerst die Fähigkeit definieren, dann
Plugins daran anschließen lassen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht willkürlicher Codeausführung innerhalb
  des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als
Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das größtenteils gebündelte
Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code für die Entwicklungszeit, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/auf der Allowlist ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Komfortfunktionen.

Halten Sie die Fähigkeitsregistrierung öffentlich. Reduzieren Sie Nicht-Vertrags-Hilfsexporte:

- hilfsspezifische Subpfade für gebündelte Plugins
- Laufzeit-Verdrahtungs-Subpfade, die nicht als öffentliche API gedacht sind
- anbieterspezifische Komforthelfer
- Setup-/Onboarding-Helfer, die Implementierungsdetails sind

Einige Hilfs-Subpfade gebündelter Plugins verbleiben aus Kompatibilitätsgründen und für die
Pflege gebündelter Plugins noch in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte für Implementierungsdetails, nicht als das empfohlene SDK-Muster für
neue Drittanbieter-Plugins.

## Ladepipeline

Beim Start führt OpenClaw ungefähr Folgendes aus:

1. Wurzeln potenzieller Plugins erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten festlegen
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein Legacy-Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; für neue Plugins `register` bevorzugen.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt die Plugin-Wurzel verlässt, der Pfad weltweit beschreibbar ist oder die
Pfadinhaberschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit auf der Steuerungsebene. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Control-UI-Beschriftungen/-Platzhalter zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu erhalten, ohne die Plugin-Laufzeit zu laden

Für native Plugins ist das Laufzeitmodul der Teil der Datenebene. Es registriert das
tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Steuerungsebene.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen nicht Laufzeitregistrierung, `register(...)` oder `setupEntry`.
Die ersten Live-Aktivierungskonsumenten verwenden nun Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins einzugrenzen, bevor eine breitere Materialisierung der Registry erfolgt:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Laufzeitauflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Die Setup-Erkennung bevorzugt nun Deskriptor-besessene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Setup-Laufzeit-Hooks benötigen. Wenn mehr als
ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, verweigert die Setup-Auflösung den mehrdeutigen Eigentümer, anstatt sich auf die Erkennungsreihenfolge zu verlassen.

### Was der Loader zwischenspeichert

OpenClaw hält kurze prozessinterne Caches für:

- Erkennungsergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren stoßartige Startvorgänge und den Overhead wiederholter Befehle. Man kann sie
sicher als kurzlebige Performance-Caches betrachten, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
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
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, anstatt direkt mit Plugin-Modulen zu kommunizieren.
Dadurch bleibt das Laden unidirektional:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um nach der Genehmigung oder Ablehnung einer Bindungsanfrage einen Callback zu erhalten:

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
- `request`: die ursprüngliche Anforderungszusammenfassung, Hinweis zum Trennen, Absender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er wird ausgeführt, nachdem die Core-Verarbeitung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für günstige env-auth-
  Abfrage von Providern vor dem Laden der Laufzeit, `providerAuthAliases` für Provider-Varianten, die sich
  Authentifizierung teilen, `channelEnvVars` für günstige env-/Setup-Abfrage von Kanälen vor dem Laden der Laufzeit,
  sowie `providerAuthChoices` für günstige Onboarding-/Auth-Choice-Labels und
  CLI-Flag-Metadaten vor dem Laden der Laufzeit
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptverarbeitung und
Tool-Richtlinien. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenztransport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider env-basierte Anmeldedaten hat,
die generische Auth-/Status-/Modellwähler-Pfade ohne Laden der Plugin-
Laufzeit sehen sollen. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die
env vars, Auth-Profile, konfigurationsgestützte Authentifizierung und die API-Key-
Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
CLI-Oberflächen für Onboarding/Auth-Auswahl die Choice-ID des Providers, Gruppenlabels und einfache
Authentifizierungsverdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie Provider-Laufzeit-
`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Authentifizierung oder Setup hat,
die generischer Shell-env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts ohne Laden der Kanal-Laufzeit sehen sollen.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „When to use“ ist die kurze Entscheidungshilfe.

| #   | Hook                              | Was er bewirkt                                                                                                 | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht die Provider-Konfiguration während der Generierung von `models.json` in `models.providers`      | Der Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                     |
| 2   | `applyConfigDefaults`             | Wendet provider-eigene globale Konfigurationsstandardwerte während der Materialisierung der Konfiguration an   | Standardwerte hängen vom Authentifizierungsmodus, von env oder von der Modellfamilien-Semantik des Providers ab                            |
| --  | _(built-in model lookup)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Vorschau-Aliasse für Modell-IDs vor der Auflösung                                    | Der Provider besitzt die Alias-Bereinigung vor der kanonischen Modellauflösung                                                              |
| 4   | `normalizeTransport`              | Normalisiert Provider-Familien-`api` / `baseUrl` vor der generischen Modellzusammenstellung                    | Der Provider besitzt die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                           |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                      | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Hilfen der Google-Familie stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet Compat-Umschreibungen für native Streaming-Nutzung auf Konfigurations-Provider an                       | Der Provider benötigt endpoint-gesteuerte Korrekturen für Metadaten der nativen Streaming-Nutzung                                          |
| 7   | `resolveConfigApiKey`             | Löst env-marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Laufzeit-Authentifizierung auf | Der Provider besitzt provider-eigene env-marker-API-Key-Auflösung; `amazon-bedrock` hat hier ebenfalls einen eingebauten AWS-env-marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/self-hosted oder konfigurationsgestützte Authentifizierung verfügbar, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                               |
| 9   | `resolveExternalAuthProfiles`     | Legt provider-eigene externe Auth-Profile darüber; Standard für `persistence` ist `runtime-only` bei CLI-/app-eigenen Credentials | Der Provider verwendet externe Auth-Credentials wieder, ohne kopierte Refresh-Tokens zu persistieren                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuften gespeicherte synthetische Profil-Platzhalter hinter env-/konfigurationsgestützter Authentifizierung herab | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang haben sollten                                                   |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry stehen             | Der Provider akzeptiert beliebige vorgelagerte Modell-IDs                                                                                   |
| 12  | `prepareDynamicModel`             | Asynchrone Aufwärmphase, danach läuft `resolveDynamicModel` erneut                                             | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 13  | `normalizeResolvedModel`          | Finale Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet                                 | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                              |
| 14  | `contributeResolvedModelCompat`   | Steuert Compat-Flags für Anbietermodelle hinter einem anderen kompatiblen Transport bei                        | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                          |
| 15  | `capabilities`                    | Provider-eigene Metadaten für Transkripte/Tools, die von gemeinsamer Core-Logik verwendet werden              | Der Provider benötigt Besonderheiten für Transkripte/Provider-Familien                                                                      |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der Embedded Runner sie sieht                                                 | Der Provider benötigt Schema-Bereinigung für Transportfamilien                                                                              |
| 17  | `inspectToolSchemas`              | Macht provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar                                        | Der Provider möchte Keyword-Warnungen, ohne dem Core providerspezifische Regeln beizubringen                                               |
| 18  | `resolveReasoningOutputMode`      | Wählt nativen oder getaggten Vertrag für Reasoning-Ausgabe                                                     | Der Provider benötigt getaggte Argumentation/finale Ausgabe statt nativer Felder                                                           |
| 19  | `prepareExtraParams`              | Normalisierung von Anforderungsparametern vor generischen Wrappern für Stream-Optionen                         | Der Provider benötigt Standard-Anforderungsparameter oder providerbezogene Parameterbereinigung                                             |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                         | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                      |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Der Provider benötigt Wrapper für Anforderungsheader/Body/Modell-Compat ohne benutzerdefinierten Transport                                |
| 22  | `resolveTransportTurnState`       | Hängt native turn-spezifische Transport-Header oder Metadaten an                                               | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder eine Session-Cool-down-Richtlinie an                                        | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                      |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zur Laufzeitzeichenfolge `apiKey`                       | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Richtlinien bei Refresh-Fehlern    | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refresh-Mechanismen                                                                     |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                           | Der Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Overflow des Kontextfensters                                                      | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                         |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                           | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                      |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                           | Der Provider benötigt proxyspezifisches TTL-Gating für den Cache                                                                            |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                          | Der Provider benötigt einen providerspezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                 |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                      | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                           |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                     | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Auswahllisten                                    |
| 33  | `resolveThinkingProfile`          | Modellspezifische `/think`-Stufe, Anzeigelabels und Standardwert                                               | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Stufenleiter oder ein binäres Label bereit                    |
| 34  | `isBinaryThinking`                | Compat-Hook für Argumentations-Umschalter an/aus                                                               | Der Provider stellt nur binäres Thinking an/aus bereit                                                                                      |
| 35  | `supportsXHighThinking`           | Compat-Hook für Unterstützung von `xhigh`-Argumentation                                                        | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Compat-Hook für die standardmäßige `/think`-Stufe                                                              | Der Provider besitzt die standardmäßige `/think`-Richtlinie für eine Modellfamilie                                                         |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Der Provider besitzt die Zuordnung bevorzugter Modelle für Live/Smoke                                                                       |
| 38  | `prepareRuntimeAuth`              | Tauscht ein konfiguriertes Credential unmittelbar vor der Inferenz gegen das tatsächliche Laufzeit-Token/den Schlüssel aus | Der Provider benötigt einen Token-Austausch oder ein kurzlebiges Anforderungs-Credential                                                   |
| 39  | `resolveUsageAuth`                | Löst Nutzungs-/Abrechnungs-Credentials für `/usage` und verwandte Statusoberflächen auf                       | Der Provider benötigt benutzerdefiniertes Parsen von Nutzungs-/Quota-Tokens oder ein anderes Nutzungs-Credential                          |
| 40  | `fetchUsageSnapshot`              | Ruft providerspezifische Nutzungs-/Quota-Snapshots ab und normalisiert sie, nachdem die Authentifizierung aufgelöst wurde | Der Provider benötigt einen providerspezifischen Nutzungsendpunkt oder einen Payload-Parser                                                |
| 41  | `createEmbeddingProvider`         | Erstellt einen provider-eigenen Embedding-Adapter für Speicher/Suche                                           | Das Verhalten von Speicher-Embeddings gehört zum Provider-Plugin                                                                            |
| 42  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Transkriptverarbeitung für den Provider steuert                   | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                     |
| 43  | `sanitizeReplayHistory`           | Schreibt den Replay-Verlauf nach der generischen Transkriptbereinigung um                                     | Der Provider benötigt providerspezifische Replay-Umschreibungen über gemeinsame Compaction-Hilfen hinaus                                   |
| 44  | `validateReplayTurns`             | Finale Validierung oder Umformung von Replay-Turns vor dem Embedded Runner                                    | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Turn-Validierung                                           |
| 45  | `onModelSelected`                 | Führt provider-eigene Nebeneffekte nach der Modellauswahl aus                                                 | Der Provider benötigt Telemetrie oder provider-eigenen Zustand, wenn ein Modell aktiv wird                                                 |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und gehen dann andere Hook-fähige Provider-Plugins durch,
bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration ändert. So bleiben
Alias-/Compat-Provider-Shims funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Konfigurationseintrag der Google-Familie umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer
diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für
Provider-Verhalten gedacht, das weiterhin in OpenClaws normaler Inferenzschleife läuft.

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
  und `wrapStreamFn`, weil es Claude-4.6-Vorwärtskompatibilität,
  Hinweise zur Provider-Familie, Hinweise zur Auth-Reparatur, Integration des Nutzungsendpunkts,
  Eignung für Prompt-Cache, auth-bewusste Konfigurationsstandardwerte, die
  standardmäßige/adaptive Thinking-Richtlinie von Claude und anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Anthropics Claude-spezifische Stream-Hilfen verbleiben vorerst in der eigenen
  öffentlichen `api.ts`- / `contract-api.ts`-Seam des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Anthropic-Wrapper-Builder, anstatt das generische SDK um die
  Beta-Header-Regeln eines einzelnen Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` und `isModernModelRef`,
  weil es GPT-5.4-Vorwärtskompatibilität, die direkte OpenAI-
  Normalisierung `openai-completions` -> `openai-responses`, Codex-bewusste Auth-
  Hinweise, Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die Thinking- /
  Live-Modell-Richtlinie von GPT-5 besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche,
  Payload-Formung für Reasoning-Compat und Context-Management für Responses.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs bereitstellen kann, bevor OpenClaws statischer Katalog aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle bzw. von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  geräteeigenes Login, Modell-Fallback-Verhalten, Claude-Transkript-
  Besonderheiten, einen Austausch GitHub-Token -> Copilot-Token und einen provider-eigenen Nutzungsendpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf den gemeinsamen OpenAI-Transporten läuft, aber seine Transport-/Basis-URL-
  Normalisierung, OAuth-Refresh-Fallback-Richtlinie, standardmäßige Transportwahl,
  synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt sich dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` den Gemini-3.1-Fallback für Vorwärtskompatibilität,
  native Gemini-Replay-Validierung, Bereinigung des Bootstrap-Replays, den getaggten
  Modus der Reasoning-Ausgabe und modernes Modell-Matching besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Gemini-Thinking-Payload besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und Verdrahtung des Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, sodass Claude-spezifische Replay-Bereinigung
  auf Claude-IDs beschränkt bleibt statt auf jeden Transport `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveThinkingProfile`, weil es
  die Bedrock-spezifische Klassifizierung von Throttle-/Not-ready-/Context-overflow-Fehlern
  für Anthropic-on-Bedrock-Verkehr besitzt; seine Replay-Richtlinie teilt sich weiterhin denselben
  ausschließlich auf Claude bezogenen Schutz `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und Bereinigung von Gemini-
  Thought-Signatures ohne native Gemini-Replay-Validierung oder
  Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Semantik von Anthropic-Nachrichten als auch OpenAI-kompatible Semantik besitzt; es behält das Entfernen von
  ausschließlich auf Claude bezogenen Thinking-Blöcken auf der Anthropic-Seite bei, während es den
  Modus der Reasoning-Ausgabe wieder auf nativ zurücksetzt, und die Stream-Familie `minimax-fast-mode` besitzt
  Umschreibungen für den Fast-Modus auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog`, `resolveThinkingProfile` und `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber provider-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Zustand auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Request-Header,
  Normalisierung der Reasoning-Payload, Hinweise für Gemini-Transkripte und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` behält Kilo-Thinking-
  Injektion auf dem gemeinsamen Proxy-Stream-Pfad bei und überspringt `kilo/auto` sowie
  andere Proxy-Modell-IDs, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, binäre Thinking-UX, modernes Modell-Matching sowie sowohl
  Nutzungs-Auth als auch das Abrufen von Quoten besitzt; die Stream-Familie `tool-stream-default-on` hält
  den standardmäßig aktivierten `tool_stream`-Wrapper aus handgeschriebenem Klebstoff pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es native Normalisierung des xAI-Responses-Transports, Umschreibungen von
  Grok-Fast-Mode-Aliassen, standardmäßiges `tool_stream`, Bereinigung von Strict-Tool / Reasoning-Payload,
  Fallback-Wiederverwendung von Authentifizierung für plugin-eigene Tools, Vorwärtskompatibilität bei der Auflösung von Grok-
  Modellen und provider-eigene Compat-Patches wie das xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und das Decodieren von
  Tool-Call-Argumenten mit HTML-Entities besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Besonderheiten von Transkripten/Tools aus dem Core herauszuhalten.
- Nur-Katalog-gebündelte Provider wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videoerzeugung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten plugin-eigen ist, auch wenn die Inferenz weiterhin über die gemeinsamen
  Transporte läuft.

## Laufzeithelfer

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Nutzlast für Datei-/Sprachnachrichten-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist je nach Provider optional. Verwenden Sie es für anbietereigene Voice-Picker oder Setup-Flows.
- Sprachlisten können umfangreichere Metadaten wie Locale, Geschlecht und Personality-Tags für providerbewusste Auswahllisten enthalten.
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

- TTS-Richtlinien, Fallback und Antwortzustellung im Core belassen.
- Sprach-Provider für anbietereigenes Syntheseverhalten verwenden.
- Das Legacy-Microsoft-`edge`-Eingabefeld wird zur Provider-ID `microsoft` normalisiert.
- Das bevorzugte Zuständigkeitsmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und künftige Medien-Provider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt einer generischen Key/Value-Bag:

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

- Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core belassen.
- Anbieterverhalten im Provider-Plugin belassen.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videoerzeugung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeithelfer
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeithelfer zum Medienverständnis können Plugins Folgendes aufrufen:

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
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können auch Hintergrund-Subagent-Durchläufe über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Überschreibungen pro Durchlauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Durchläufe müssen Betreiber mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Nicht vertrauenswürdige Subagent-Durchläufe von Plugins funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, anstatt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Laufzeithelfer nutzen, anstatt
in die Verdrahtung des Agent-Tools zu greifen:

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

Plugins können Websuch-Provider außerdem über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Provider-Auswahl, Auflösung von Credentials und gemeinsame Anforderungssemantik im Core belassen.
- Websuch-Provider für anbieterspezifische Suchtransporte verwenden.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne von dem Wrapper des Agent-Tools abzuhängen.

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
- `listProviders(...)`: verfügbare Provider für Bilderzeugung und ihre Fähigkeiten auflisten.

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
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Sich überschneidende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. `exact`-/`prefix`-Fallthrough-Ketten nur innerhalb derselben `auth`-Stufe beibehalten.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Runtime-Scopes des Operators. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helferaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header ausdrücklich vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätstragenden Plugin-Routenanfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine pluginseitige Route mit Gateway-Authentifizierung implizit eine Admin-Oberfläche ist. Wenn Ihre Route Verhalten nur für Administratoren benötigt, verlangen Sie einen HTTP-Modus mit Identitätsträger und dokumentieren Sie den expliziten Header-Vertrag `x-openclaw-scopes`.

## SDK-Importpfade für Plugins

Verwenden Sie SDK-Subpfade statt des monolithischen Imports `openclaw/plugin-sdk`, wenn
Sie Plugins erstellen:

- `openclaw/plugin-sdk/plugin-entry` für Plugin-Registrierungsprimitiven.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen, pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas
  des Wurzel-`openclaw.json` (`OpenClawSchema`).
- Stabile Kanalprimitiven wie `openclaw/plugin-sdk/channel-setup`,
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
  `channel-inbound` ist die gemeinsame Heimat für Entprellung, Mention-Matching,
  Hilfen für eingehende Mention-Richtlinien, Umschlagformatierung und Hilfen zum
  Kontext eingehender Umschläge.
  `channel-setup` ist die schmale Setup-Seam für optionale Installationen.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich der importsicheren Setup-Patch-Adapter.
  `setup-adapter-runtime` ist die env-bewusste Adapter-Seam für Konto-Setup.
  `setup-tools` ist die kleine CLI-/Archiv-/Dokumentations-Helfer-Seam (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Bereichs-Subpfade wie `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurationshelfer.
  `telegram-command-config` ist die schmale öffentliche Seam für Telegram-spezifische
  Normalisierung/Validierung benutzerdefinierter Befehle und bleibt verfügbar, auch wenn die gebündelte
  Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Seam für Text/Markdown/Logging, einschließlich
  des Entfernens von für Assistenten sichtbarem Text, Hilfen zum Rendern/Chunking von Markdown, Redaktions-
  Hilfen, Hilfen für Directive-Tags und Safe-Text-Dienstprogrammen.
- Kanalspezifische Seams für Genehmigungen sollten einen einzelnen `approvalCapability`-
  Vertrag auf dem Plugin bevorzugen. Der Core liest dann Authentifizierung, Zustellung, Rendering,
  natives Routing und das Verhalten des lazy nativen Handlers für Genehmigungen über diese eine Fähigkeit,
  anstatt Genehmigungsverhalten in nicht zusammenhängende Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins bestehen. Neuer Code sollte stattdessen die schmaleren
  generischen Primitiven importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Interne Bestandteile gebündelter Erweiterungen bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpfade verwenden. OpenClaw-Core-/Test-Code kann die öffentlichen
  Repo-Einstiegspunkte unter einer Plugin-Paketwurzel wie `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng begrenzte Dateien wie
  `login-qr-api.js` verwenden. Niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Erweiterung importieren.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Helfer/Typen,
  `<plugin-package-root>/runtime-api.js` ist das Barrel nur für Laufzeit,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt für das gebündelte Plugin,
  und `<plugin-package-root>/setup-entry.js` ist der Einstiegspunkt für das Setup-Plugin.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Hilfen wie
    `wrapAnthropicProviderStream`, Hilfen für Beta-Header und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Hilfen für Standardmodelle und
    Builder für Realtime-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Hilfen für Onboarding/Konfiguration,
    während `register.runtime.js` für repo-lokale Nutzung weiterhin generische
    `plugin-sdk/provider-stream`-Hilfen re-exportieren kann.
- Öffentlich zugängliche Einstiegspunkte, die über eine Fassade geladen werden, bevorzugen den aktiven Runtime-Snapshot der Konfiguration,
  wenn einer vorhanden ist, und greifen sonst auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Runtime-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Ein kleiner
  reservierter Kompatibilitätssatz gebündelter, kanalgebrandeter Hilfs-Seams existiert weiterhin.
  Behandeln Sie diese als Seams für gebündelte Wartung/Kompatibilität, nicht als neue Importziele für Drittanbieter;
  neue kanalübergreifende Verträge sollten weiterhin auf generischen `plugin-sdk/*`-Subpfaden oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Hinweis zur Kompatibilität:

- Vermeiden Sie das Root-Barrel `openclaw/plugin-sdk` für neuen Code.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Setup-/Pairing-/Reply-/
  Feedback-/Contract-/Inbound-/Threading-/Command-/Secret-input-/Webhook-/Infra-/
  Allowlist-/Status-/Message-tool-Subpfade sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Ziel-Parsing/-Matching gehört zu `openclaw/plugin-sdk/channel-targets`.
  Gates für Nachrichtenaktionen und Hilfen für Reaktions-Nachrichten-IDs gehören zu
  `openclaw/plugin-sdk/channel-actions`.
- Hilfs-Barrels, die spezifisch für gebündelte Erweiterungen sind, sind standardmäßig nicht stabil. Wenn ein
  Helfer nur von einer gebündelten Erweiterung benötigt wird, behalten Sie ihn hinter der
  lokalen Seam `api.js` oder `runtime-api.js` der Erweiterung, statt ihn in
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht kanalgebrandet. Gemeinsames Ziel-
  Parsing gehört zu `openclaw/plugin-sdk/channel-targets`; kanalspezifische
  Interna bleiben hinter der lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Subpfade wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie
  heute verwenden. Ihre Existenz bedeutet für sich genommen nicht, dass jeder exportierte Helfer ein
  langfristig eingefrorener externer Vertrag ist.

## Nachrichtentool-Schemas

Plugins sollten kanalspezifische Schemabeiträge für `describeMessageTool(...)`
besitzen. Providerspezifische Felder im Plugin behalten, nicht im gemeinsamen Core.

Für gemeinsam portable Schemafragmente die über
`openclaw/plugin-sdk/channel-actions` exportierten generischen Helfer wiederverwenden:

- `createMessageToolButtonsSchema()` für Payloads im Stil von Button-Rastern
- `createMessageToolCardSchema()` für strukturierte Karten-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definieren Sie sie in der
eigenen Quelle dieses Plugins, statt sie in das gemeinsame SDK zu befördern.

## Auflösung von Kanalzielen

Kanal-Plugins sollten kanalspezifische Zielsemantik besitzen. Den gemeinsamen
ausgehenden Host generisch halten und die Oberfläche des Messaging-Adapters für Provider-Regeln verwenden:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Directory-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zur id-ähnlichen Auflösung springen soll statt zur Directory-Suche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn der
  Core nach der Normalisierung oder nach einem Directory-Miss eine abschließende provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Sitzungs-
  Routen-Konstruktion, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- `inferTargetChatType` für Kategorieentscheidungen verwenden, die vor dem
  Durchsuchen von Peers/Gruppen erfolgen sollten.
- `looksLikeId` für Prüfungen im Stil „dies als explizite/native Ziel-ID behandeln“ verwenden.
- `resolveTarget` für providerspezifischen Normalisierungs-Fallback verwenden, nicht für
  breite Directory-Suche.
- Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern halten, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, wie etwa:

- durch Allowlist gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Maps
- kontoabhängige statische Directory-Fallbacks

Die gemeinsamen Helfer in `directory-runtime` verarbeiten nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Helfer für Deduplizierung/Normalisierung
- Aufbau von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen einzelnen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für Basis-URLs
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere verwandte Provider-Einträge synthetisieren
- `late`: letzter Durchlauf nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalinspektion

Wenn Ihr Plugin einen Kanal registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Credentials
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Geheimnisse fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Konfigurations-
  Reparatur-Flows sollten keine Laufzeit-Credentials materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur den beschreibenden Kontozustand zurückgeben.
- `enabled` und `configured` beibehalten.
- Relevante Felder zur Credential-Quelle/zum Credential-Status einschließen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. Es reicht, `tokenStatus: "available"` (und das passende Quellenfeld)
  für statusartige Befehle zurückzugeben.
- `configured_unavailable` verwenden, wenn ein Credential über SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar ist.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Erweiterungen auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, sodass
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Bäume von Plugin-Abhängigkeiten
„pure JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges reines Setup-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegspunkts. Das hält Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt auch Tools, Hooks oder anderen Code nur für die Laufzeit
verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin in denselben `setupEntry`-Pfad während der
Pre-Listen-Startphase des Gateways aufnehmen, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche, die
vor dem Start des Gateway-Listenings existieren muss, vollständig abdeckt. In der Praxis bedeutet das, dass der
Setup-Eintrag jede kanalbesessene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway auf eingehende Verbindungen lauscht
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Eintrag weiterhin eine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Eintrag beim Start laden.

Gebündelte Kanäle können auch reine Setup-Helfer für die Vertragsoberfläche veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Kanal-Laufzeit geladen wird. Die aktuelle Oberfläche
für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine Legacy-Konfiguration eines einzelnen Kontos
nach `channels.<id>.accounts.*` befördern muss, ohne den vollständigen Plugin-Eintrag zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes befördertes Konto, wenn bereits benannte Konten existieren, und kann einen
konfigurierten nicht kanonischen Standard-Kontoschlüssel beibehalten, statt immer
`accounts.default` zu erzeugen.

Diese Setup-Patch-Adapter halten die Erkennung der gebündelten Vertragsoberfläche lazy. Die Importzeit
bleibt gering; die Promotionsoberfläche wird nur bei der ersten Verwendung geladen, statt beim Modulimport
erneut in den Start des gebündelten Kanals einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie diese auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, auch wenn ein Plugin einen engeren Scope anfordert.

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

### Metadaten des Kanalkatalogs

Kanal-Plugins können Metadaten für Setup/Erkennung über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekannt geben. So bleiben die Core-Katalogdaten frei von Daten.

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

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Doku-Link
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen sollte
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerungen für Texte auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen für konfigurierte Kanallisten aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Konfigurations-Auswahllisten aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal für Oberflächen der Doku-Navigation als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; `exposure` bevorzugen
- `quickstartAllowFrom`: nimmt den Kanal in den standardmäßigen Quickstart-Flow `allowFrom` auf
- `forceAccountBinding`: erzwingt explizite Kontobindung, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann auch **externe Kanalkataloge** zusammenführen (zum Beispiel einen Export aus einem MPM-
Registry). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder setzen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

## Plugins für die Kontext-Engine

Plugins für die Kontext-Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Zusammenstellung
und Compaction. Registrieren Sie sie in Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss,
anstatt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, `compact()`
implementiert lassen und ihn explizit delegieren:

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

## Hinzufügen einer neuen Fähigkeit

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie das
Plugin-System nicht mit einem privaten Direktzugriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Zusammenführung der Konfiguration,
   Lebenszyklus, kanalseitige Semantik und Form des Laufzeithelfers.
2. typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   `OpenClawPluginApi` und/oder `api.runtime` mit der kleinsten nützlichen
   typisierten Fähigkeitsoberfläche erweitern.
3. Core- und Kanal-/Feature-Konsumenten verdrahten
   Kanäle und Feature-Plugins sollten die neue Fähigkeit über den Core nutzen,
   nicht durch direkten Import einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends für diese Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Tests hinzufügen, damit Zuständigkeit und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzelnen
Providers fest codiert zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeithelfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung in der Plugin-Laufzeit in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie nutzen müssen
- Capture-/Test-Helfer in `src/test-utils/plugin-registration.ts`
- Assertions für Zuständigkeit/Verträge in `src/plugins/contracts/registry.ts`
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

So bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Kanal-Plugins nutzen Laufzeithelfer
- Vertragstests halten Zuständigkeit explizit
