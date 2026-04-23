---
read_when:
    - Native OpenClaw-Plugins entwickeln oder debuggen
    - Das Plugin-Fähigkeitsmodell oder Ownership-Grenzen verstehen
    - An der Plugin-Ladepipeline oder Registry arbeiten
    - Provider-Laufzeit-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Laufzeit-Helfer'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-23T06:30:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 893063d259d4a813c92aec2a74a4d67b1ccf058fc085a900a0470d72ab88f8c8
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **detaillierte Architekturreferenz**. Praktische Anleitungen finden Sie hier:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzerhandbuch
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel-Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Channel erstellen
  - [Provider-Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK-Übersicht](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des Plugin-Systems von OpenClaw.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit             | Registrierungsmethode                           | Beispiel-Plugins                     |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Textinferenz          | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI-Inferenz-Backend  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Sprache               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Sprache      | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medienverständnis     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Bildgenerierung       | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung      | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Videogenerierung      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web-Abruf             | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Websuche              | `api.registerWebSearchProvider(...)`            | `google`                             |
| Channel / Messaging   | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **altes reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Kern umgesetzt und wird heute von gebündelten/nativen Plugins
verwendet, aber die Kompatibilität externer Plugins braucht weiterhin eine strengere Messlatte als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Richtlinien:

- **bestehende externe Plugins:** hook-basierte Integrationen funktionsfähig halten; behandeln Sie
  dies als Kompatibilitätsbasis
- **neue gebündelte/native Plugins:** bevorzugen Sie explizite Fähigkeitsregistrierung statt
  anbieter-spezifischer direkter Zugriffe oder neuer reiner Hook-Designs
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber behandeln Sie die
  fähigkeitsspezifischen Hilfsoberflächen als weiterentwickelbar, solange die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil kennzeichnet

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- alte Hooks bleiben während
  des Übergangs der sicherste Weg ohne Breaking Changes für externe Plugins
- exportierte Hilfs-Subpfade sind nicht alle gleich; bevorzugen Sie den engen dokumentierten
  Vertrag, nicht zufällige Hilfsexporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bild-
  generierung)
- **hook-only** -- registriert nur Hooks (typisierte oder benutzerdefinierte), keine Fähigkeiten,
  Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Aufschlüsselung der Fähigkeiten
eines Plugins anzuzeigen. Details finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Alte Hooks

Der Hook `before_agent_start` wird weiterhin als Kompatibilitätspfad für
reine Hook-Plugins unterstützt. Alte reale Plugins hängen weiterhin davon ab.

Ausrichtung:

- funktionsfähig halten
- als veraltet dokumentieren
- für Arbeit an Modell-/Provider-Überschreibungen `before_model_resolve` bevorzugen
- für Arbeit an Prompt-Mutationen `before_prompt_build` bevorzugen
- erst entfernen, wenn die reale Nutzung zurückgeht und Fixture-Abdeckung beweist, dass die Migration sicher ist

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute beschädigen --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet mögliche Plugins aus konfigurierten Pfaden, Workspace-Wurzeln,
   globalen Extension-Wurzeln und gebündelten extensions. Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Kern entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Memory ausgewählt ist.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden prozessintern über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Zeit-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung erlaubt es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Send-/Edit-/React-Tool registrieren.
OpenClaw behält ein gemeinsames `message`-Tool im Kern, und
Channel-Plugins besitzen die channelspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Kern besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verdrahtung, Sitzungs-/Thread-
  Bookkeeping und Ausführungs-Dispatch
- Channel-Plugins besitzen Discovery für begrenzte Aktionen, Fähigkeits-Discovery und alle
  channelspezifischen Schemafragmente
- Channel-Plugins besitzen providerspezifische Grammatik für Sitzungskonversationen, zum Beispiel
  wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die endgültige Aktion über ihren Aktionsadapter aus

Für Channel-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf erlaubt es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schema-
Beiträge gemeinsam zurückzugeben, damit diese Teile nicht auseinanderlaufen.

Wenn ein channelspezifischer Parameter des Nachrichtentools eine Medienquelle wie einen
lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem
`mediaSourceParams` von `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise zum Zugriff auf ausgehende Medien anzuwenden,
ohne Plugin-eigene Parameternamen fest zu codieren.
Bevorzugen Sie dort aktionsbezogene Maps statt einer flachen channelweiten Liste, damit ein
nur profilbezogener Medienparameter nicht bei nicht verwandten Aktionen wie
`send` normalisiert wird.

Der Kern übergibt Laufzeit-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann
Nachrichtenaktionen auf Basis des aktiven Accounts, des aktuellen Raums/Threads/der aktuellen Nachricht oder
der vertrauenswürdigen Identität des anfragenden Absenders ausblenden oder anzeigen, ohne
channelspezifische Zweige im Kern-Tool `message` fest zu codieren.

Deshalb sind Routing-Änderungen des eingebetteten Runners weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-
Discovery-Grenze weiterzugeben, damit das gemeinsame `message`-Tool die richtige
channel-eigene Oberfläche für den aktuellen Zug bereitstellt.

Für channel-eigene Ausführungshelfer sollten gebündelte Plugins die Ausführungs-
Runtime in ihren eigenen Extension-Modulen halten. Der Kern besitzt nicht länger die
Runtimes für Nachrichtenaaktionen von Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools`.
Wir veröffentlichen keine separaten Subpfade `plugin-sdk/*-action-runtime`, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
Extension-eigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Kern sollte
keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche extensions importieren. Wenn der Kern ein Verhalten benötigt, soll er entweder das
eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins nutzen oder den Bedarf
in eine enge generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die zum allgemeinen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Kern verschiebt jetzt das gemeinsame Parsing von Umfragen, bis die Plugin-Umfrage-
Dispatch die Aktion abgelehnt hat, sodass plugin-eigene Umfrage-Handler
channelspezifische Umfragefelder akzeptieren können, ohne zuerst vom generischen Umfrage-Parser blockiert zu werden.

Die vollständige Startsequenz finden Sie unter [Ladepipeline](#load-pipeline).

## Modell für Ownership von Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-seitigen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die gesamte Feature-Oberfläche besitzen, die es einführt
- Channels sollten gemeinsame Kernfähigkeiten nutzen, statt Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt das OpenAI-Modell-Provider-Verhalten sowie das Verhalten für OpenAI-
  Sprache + Echtzeit-Sprache + Medienverständnis + Bildgenerierung
- das gebündelte Plugin `elevenlabs` besitzt das Sprachverhalten von ElevenLabs
- das gebündelte Plugin `microsoft` besitzt das Sprachverhalten von Microsoft
- das gebündelte Plugin `google` besitzt das Google-Modell-Provider-Verhalten sowie das Verhalten für Google-
  Medienverständnis + Bildgenerierung + Websuche
- das gebündelte Plugin `firecrawl` besitzt das Web-Abruf-Verhalten von Firecrawl
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt das Text-Provider-Verhalten von Qwen sowie
  Medienverständnis- und Videogenerierungsverhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Call-Transport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridge, verwendet aber gemeinsame Fähigkeiten für Sprache
  sowie Echtzeit-Transkription und Echtzeit-Sprache, statt Anbieter-Plugins direkt zu
  importieren

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberfläche tun
- Channels interessieren sich nicht dafür, welches Anbieter-Plugin den Provider besitzt; sie verwenden den
  gemeinsamen Fähigkeitsvertrag, den der Kern bereitstellt

Das ist die zentrale Unterscheidung:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Kernvertrag, den mehrere Plugins implementieren oder verwenden können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider soll die Videobehandlung fest codieren?“ Die erste Frage lautet „wie sieht
der Kernvertrag für Videofähigkeiten aus?“ Sobald dieser Vertrag existiert, können Anbieter-Plugins
sich dagegen registrieren und Channel-/Feature-Plugins können ihn verwenden.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt in der Regel:

1. die fehlende Fähigkeit im Kern definieren
2. sie typisiert über die Plugin-API/Laufzeit bereitstellen
3. Channels/Features an diese Fähigkeit anschließen
4. Anbieter-Plugins Implementierungen registrieren lassen

Dadurch bleibt Ownership explizit, während Kernverhalten vermieden wird, das von einem
einzigen Anbieter oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wohin Code gehört:

- **Kern-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback, Konfigurations-
  Merge-Regeln, Zustellungssemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Auth, Modellkataloge, Sprach-
  synthese, Bildgenerierung, zukünftige Video-Backends, Nutzungsendpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration von Slack/Discord/voice-call/usw.,
  die Kernfähigkeiten verwendet und auf einer Oberfläche darstellt

Zum Beispiel folgt TTS dieser Form:

- der Kern besitzt TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Channel-Zustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Implementierungen der Synthese
- `voice-call` verwendet den Laufzeit-Helfer für Telephonie-TTS

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medien-
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

Wichtig sind nicht die exakten Hilfsnamen. Entscheidend ist die Form:

- ein Plugin besitzt die Anbieteroberfläche
- der Kern besitzt weiterhin die Fähigkeitsverträge
- Channel- und Feature-Plugins verwenden `api.runtime.*`-Helfer, keinen Anbieter-Code
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat,
  die es nach eigener Aussage besitzt

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Ownership-Modell gilt auch hier:

1. der Kern definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren `describeImage`, `transcribeAudio` und
   `describeVideo`, falls zutreffend
3. Channel- und Feature-Plugins verwenden das gemeinsame Kernverhalten, statt sich
   direkt an Anbieter-Code anzuschließen

Dadurch werden die Videoannahmen eines einzelnen Providers nicht in den Kern eingebrannt. Das Plugin besitzt
die Anbieteroberfläche; der Kern besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Kern besitzt den typisierten
Fähigkeitsvertrag und den Laufzeit-Helfer, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dafür.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist absichtlich typisiert und zentralisiert in
`OpenClawPluginApi`. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeit-Helfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Kern kann doppelte Ownership ablehnen, zum Beispiel wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können verwertbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stille Drift verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modell-
   Provider, Sprach-Provider, Websuch-Provider und Ownership der gebündelten Registrierung verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Kern und Channels nahtlos zusammenspielen, weil Ownership
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Kerns
- von mehreren Plugins wiederverwendbar
- von Channels/Features ohne Anbieterwissen verwendbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Kern versteckt sind
- einmalige Escape-Hatches für Plugins, die die Registry umgehen
- Channel-Code, der direkt in eine Anbieterimplementierung greift
- ad hoc Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Wenn Sie unsicher sind, erhöhen Sie das Abstraktionsniveau: Definieren Sie zuerst die Fähigkeit, und
lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **prozessintern** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Kerncode.

Folgen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway abstürzen lassen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das meist gebündelte
Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln
Sie Workspace-Plugins als Code zur Entwicklungszeit, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/in der Allowlist ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Convenience.

Halten Sie Fähigkeitsregistrierung öffentlich. Kürzen Sie Hilfsexporte, die keine Verträge sind:

- Hilfs-Subpfade für gebündelte Plugins
- Laufzeit-Plumbing-Subpfade, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helfer
- Setup-/Onboarding-Helfer, die Implementierungsdetails sind

Einige Hilfs-Subpfade gebündelter Plugins verbleiben aus Kompatibilitätsgründen und für die Wartung gebündelter Plugins weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Implementierungsdetail-Exporte, nicht als empfohlenes SDK-Muster für
neue Drittanbieter-Plugins.

## Ladepipeline

Beim Start führt OpenClaw grob Folgendes aus:

1. mögliche Plugin-Wurzeln entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein alter Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein alter Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`) und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheits-Gates greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Entry die Plugin-Wurzel verlässt, der Pfad weltweit beschreibbar ist oder die Pfad-
Ownership bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-First-Verhalten

Das Manifest ist die Quelle der Wahrheit der Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Beschriftungen/Platzhalter der Control UI zu erweitern
- Metadaten für Installation/Katalog anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu erhalten, ohne die Plugin-Laufzeit zu laden

Für native Plugins ist das Laufzeitmodul der Teil der Data Plane. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale Manifest-Blöcke `activation` und `setup` bleiben in der Control Plane.
Sie sind Deskriptoren nur für Metadaten zur Aktivierungsplanung und Setup-Discovery;
sie ersetzen weder Laufzeitregistrierung noch `register(...)` oder `setupEntry`.
Die ersten Live-Aktivierungskonsumenten verwenden jetzt Hinweise des Manifests zu Befehlen, Channels und Providern,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten Primärbefehl besitzen
- Auflösung von Channel-Setup/Plugin wird auf Plugins eingegrenzt, die die angeforderte
  Channel-ID besitzen
- explizite Auflösung von Provider-Setup/Laufzeit wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Die Setup-Discovery bevorzugt jetzt IDs im Besitz des Deskriptors wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Laufzeit-Hooks zur Setup-Zeit benötigen. Wenn mehr als
ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, verweigert die Setup-Auflösung den mehrdeutigen Besitzer, statt sich auf die Discovery-
Reihenfolge zu verlassen.

### Was der Loader cached

OpenClaw hält kurze prozessinterne Caches für:

- Discovery-Ergebnisse
- Manifest-Registry-Daten
- geladene Plugin-Registries

Diese Caches reduzieren sprunghafte Starts und den Overhead wiederholter Befehle. Man kann sie sich
sicher als kurzlebige Performance-Caches vorstellen, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Stimmen Sie die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ab.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Variablen des Kerns. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- alte Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- Plugin-eigene Befehle

Kernfunktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Kern-Laufzeit -> Registry-Nutzung

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Kernoberflächen nur
einen Integrationspunkt benötigen: „Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wurde.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungs-
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
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragenzusammenfassung, Detach-Hinweis, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er läuft, nachdem die Kernbehandlung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Schichten:

- Manifest-Metadaten: `providerAuthEnvVars` für günstige Lookup von Provider-Umgebungsauthentifizierung
  vor dem Laden der Laufzeit, `providerAuthAliases` für Provider-Varianten, die sich
  Auth teilen, `channelEnvVars` für günstige Lookup von Channel-Umgebung/Setup vor dem Laden der Laufzeit,
  sowie `providerAuthChoices` für günstige Onboarding-/Auth-Choice-Beschriftungen und
  CLI-Flag-Metadaten vor dem Laden der Laufzeit
- Konfigurationszeit-Hooks: `catalog` / altes `discovery` sowie `applyConfigDefaults`
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

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptbehandlung und
Tool-Richtlinien. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenz-Transport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider umgebungsbasierte Zugangsdaten hat,
die generische Auth-/Status-/Modellpicker-Pfade sehen sollen, ohne die Plugin-
Laufzeit zu laden. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die
Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die API-Key-Onboarding-Auswahl
einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn Oberflächen
der CLI für Onboarding/Auth-Auswahl die Choice-ID des Providers, Gruppenbeschriftungen und einfache
Auth-Verdrahtung mit einem Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie Laufzeit-
`envVars` des Providers für operatorseitige Hinweise wie Onboarding-Beschriftungen oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Channel umgebungsgetriebene Authentifizierung oder Setup hat,
die generischer Shell-Umgebungs-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts
sehen sollen, ohne die Channel-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Beschreibung                                                                                                   | Wann verwenden                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen         | Der Provider besitzt einen Katalog oder Standardwerte für Base-URLs                                                                           |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Materialisierung der Konfiguration anwenden    | Standardwerte hängen vom Auth-Modus, der Umgebung oder der Semantik der Modellfamilie des Providers ab                                       |
| --  | _(built-in model lookup)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | Alte oder Preview-Aliasse von Modell-IDs vor der Auflösung normalisieren                                       | Der Provider besitzt die Bereinigung von Aliasen vor der kanonischen Modellauflösung                                                          |
| 4   | `normalizeTransport`              | `api` / `baseUrl` einer Provider-Familie vor dem generischen Modellaufbau normalisieren                        | Der Provider besitzt die Bereinigung des Transports für benutzerdefinierte Provider-IDs in derselben Transportfamilie                        |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung normalisieren                                     | Der Provider benötigt eine Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Hilfsfunktionen der Google-Familie fangen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Umschreibungen für Native-Streaming-Usage-Kompatibilität auf Konfigurations-Provider anwenden                  | Der Provider benötigt endpoint-gesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                            |
| 7   | `resolveConfigApiKey`             | Env-Marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Laufzeit-Authentifizierung auflösen | Der Provider besitzt eine eigene API-Key-Auflösung mit Env-Marker; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | lokale/self-hosted oder konfigurationsgestützte Authentifizierung bereitstellen, ohne Klartext zu speichern    | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Auth-Profile überlagern; Standard für `persistence` ist `runtime-only` für CLI-/App-eigene Zugangsdaten | Der Provider verwendet externe Auth-Zugangsdaten erneut, ohne kopierte Refresh-Tokens zu speichern; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | gespeicherte synthetische Platzhalterprofile hinter env-/konfigurationsgestützter Authentifizierung zurückstufen | Der Provider speichert synthetische Platzhalterprofile, die keine höhere Priorität haben sollen                                               |
| 11  | `resolveDynamicModel`             | synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry stehen              | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                         |
| 12  | `prepareDynamicModel`             | asynchrones Warm-up, danach wird `resolveDynamicModel` erneut ausgeführt                                        | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                |
| 13  | `normalizeResolvedModel`          | endgültige Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                         | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Kern-Transport                                                 |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Anbieter-Modelle hinter einem anderen kompatiblen Transport beitragen                 | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                             |
| 15  | `capabilities`                    | provider-eigene Transkript-/Tooling-Metadaten, die von gemeinsamer Kernlogik verwendet werden                  | Der Provider benötigt Eigenheiten bei Transkripten/Provider-Familien                                                                          |
| 16  | `normalizeToolSchemas`            | Tool-Schemata normalisieren, bevor der eingebettete Runner sie sieht                                            | Der Provider benötigt Bereinigung von Schemata für eine Transportfamilie                                                                      |
| 17  | `inspectToolSchemas`              | provider-eigene Schema-Diagnosen nach der Normalisierung anzeigen                                               | Der Provider möchte Warnungen zu Schlüsselwörtern ausgeben, ohne dem Kern providerspezifische Regeln beizubringen                            |
| 18  | `resolveReasoningOutputMode`      | nativen oder getaggten Vertrag für Reasoning-Ausgabe auswählen                                                  | Der Provider benötigt getaggte Reasoning-/Final-Ausgabe statt nativer Felder                                                                  |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Wrappern für Stream-Optionen                               | Der Provider benötigt Standard-Anfrageparameter oder provider-spezifische Bereinigung von Parametern                                          |
| 20  | `createStreamFn`                  | den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                         | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                         |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                    | Der Provider benötigt Wrapper für Anfrage-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                               |
| 22  | `resolveTransportTurnState`       | native turn-spezifische Transport-Header oder Metadaten anhängen                                                | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket-Header oder Richtlinien zur Session-Abkühlung anhängen                                         | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien anpassen                                          |
| 24  | `formatApiKey`                    | Formatierer für Auth-Profile: gespeichertes Profil wird zur Laufzeit-Zeichenfolge `apiKey`                     | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                   |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Richtlinien bei Refresh-Fehlern     | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                            | Der Provider benötigt provider-eigene Hinweise zur Reparatur der Authentifizierung nach einem Refresh-Fehler                                  |
| 27  | `matchesContextOverflowError`     | provider-eigener Matcher für Überläufe des Kontextfensters                                                      | Der Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                             |
| 28  | `classifyFailoverReason`          | provider-eigene Klassifizierung des Failover-Grunds                                                             | Der Provider kann rohe API-/Transportfehler auf Ratenbegrenzung/Überlastung/usw. abbilden                                                    |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                       | Der Provider benötigt proxy-spezifisches TTL-Gating für den Cache                                                                             |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                           | Der Provider benötigt einen provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                   |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                       | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                              |
| 32  | `augmentModelCatalog`             | synthetische/endgültige Katalogzeilen, die nach der Discovery angehängt werden                                  | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und in Pickern                                          |
| 33  | `resolveThinkingProfile`          | modellspezifische `/think`-Stufe, Anzeigebeschriftungen und Standard                                             | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder ein binäres Label bereit                             |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für Reasoning-Umschaltung ein/aus                                                          | Der Provider bietet nur binäres Thinking ein/aus                                                                                              |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für Unterstützung von `xhigh`-Reasoning                                                    | Der Provider möchte `xhigh` nur für einen Teil der Modelle                                                                                    |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für die Standard-`/think`-Stufe                                                            | Der Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                  |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Der Provider besitzt die Abgleichslogik für bevorzugte Modelle bei Live-/Smoke-Auswahl                                                       |
| 38  | `prepareRuntimeAuth`              | eine konfigurierte Anmeldeinformation direkt vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel umwandeln | Der Provider benötigt einen Token-Austausch oder eine kurzlebige Anmeldeinformation für die Anfrage                                          |
| 39  | `resolveUsageAuth`                | Zugangsdaten für Nutzung/Abrechnung für `/usage` und verwandte Statusoberflächen auflösen                     | Der Provider benötigt benutzerdefiniertes Parsing von Nutzungs-/Quota-Token oder eine andere Nutzungs-Anmeldeinformation                    |
| 40  | `fetchUsageSnapshot`              | providerspezifische Nutzungs-/Quota-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde | Der Provider benötigt einen providerspezifischen Nutzungsendpunkt oder Payload-Parser                                                        |
| 41  | `createEmbeddingProvider`         | einen provider-eigenen Embedding-Adapter für Memory/Suche erstellen                                            | Verhalten für Memory-Embeddings gehört zum Provider-Plugin                                                                                    |
| 42  | `buildReplayPolicy`               | eine Replay-Richtlinie zurückgeben, die die Behandlung von Transkripten für den Provider steuert              | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                       |
| 43  | `sanitizeReplayHistory`           | Replay-Verlauf nach der generischen Bereinigung des Transkripts umschreiben                                    | Der Provider benötigt providerspezifische Umschreibungen des Replay-Verlaufs über gemeinsame Compaction-Helfer hinaus                        |
| 44  | `validateReplayTurns`             | endgültige Validierung oder Umformung von Replay-Zügen vor dem eingebetteten Runner                            | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Validierung von Zügen                                        |
| 45  | `onModelSelected`                 | provider-eigene Nebenwirkungen nach der Modellauswahl ausführen                                                | Der Provider benötigt Telemetrie oder provider-eigenen Status, wenn ein Modell aktiv wird                                                    |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und gehen dann andere hook-fähige Provider-Plugins durch,
bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration ändert. Dadurch bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Konfigurationseintrag der Google-Familie umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer
diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Anfragenausführer benötigt,
ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es Vorwärtskompatibilität für Claude 4.6,
  Hinweise zur Provider-Familie, Hinweise zur Reparatur der Authentifizierung, Integration des
  Nutzungsendpunkts, Eignung für den Prompt-Cache, auth-sensible Konfigurationsstandardwerte, die
  Standard-/adaptive Thinking-Richtlinie von Claude und Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Die Claude-spezifischen Stream-Helfer von Anthropic bleiben vorerst in der
  eigenen öffentlichen Nahtstelle `api.ts` / `contract-api.ts` des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die darunterliegenden
  Builder für Anthropic-Wrapper, statt das generische SDK um die Beta-Header-Regeln
  eines einzelnen Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` und `isModernModelRef`,
  weil es Vorwärtskompatibilität für GPT-5.4, die direkte Normalisierung von OpenAI
  `openai-completions` -> `openai-responses`, Codex-bewusste Hinweise zur Authentifizierung,
  Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die Richtlinie für Thinking /
  Live-Modelle von GPT-5 besitzt; die Stream-Familie `openai-responses-defaults`
  besitzt die gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche,
  Formung von Payloads für Reasoning-Kompatibilität und Kontextverwaltung der Responses.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs bereitstellen kann, bevor der statische Katalog von OpenClaw aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Anfrage-Header, Routing-Metadaten, Reasoning-Patches und
  Richtlinien für den Prompt-Cache aus dem Kern herauszuhalten. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle / von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  provider-eigenen Geräte-Login, Fallback-Verhalten für Modelle, Claude-Transkript-
  Eigenheiten, einen Austausch GitHub-Token -> Copilot-Token und einen provider-eigenen
  Nutzungsendpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf Kern-OpenAI-Transporten läuft, aber seine Normalisierung von Transport/Base-URL,
  die Fallback-Richtlinie für OAuth-Refresh, die Standardwahl des Transports,
  synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` Fallback für Vorwärtskompatibilität mit Gemini 3.1,
  native Gemini-Replay-Validierung, Bereinigung des Bootstrap-Replays,
  den Modus für getaggte Reasoning-Ausgabe und den Abgleich moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Gemini-Thinking-Payload besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und
  Verdrahtung des Quotenendpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, sodass die Claude-spezifische Replay-Bereinigung
  auf Claude-IDs beschränkt bleibt statt auf jeden Transport vom Typ `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveThinkingProfile`, weil es
  Bedrock-spezifische Klassifizierung von Fehlern für Throttling/nicht bereit/Kontextüberlauf
  für Anthropic-on-Bedrock-Traffic besitzt; seine Replay-Richtlinie teilt sich weiterhin denselben
  nur auf Claude beschränkten Schutz `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und eine Bereinigung von Gemini-
  Thought-Signatures ohne native Gemini-Replay-Validierung oder
  Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Message- als auch OpenAI-kompatible Semantik besitzt; es hält das Entfernen Claude-spezifischer
  Thinking-Blöcke auf der Anthropic-Seite aufrecht, während es den Reasoning-
  Ausgabemodus wieder auf nativ zurücksetzt, und die Stream-Familie `minimax-fast-mode` besitzt
  Umschreibungen für Fast-Mode-Modelle auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog`, `resolveThinkingProfile` und `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber eine provider-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Status auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Anfrage-Header,
  Normalisierung der Reasoning-Payload, Hinweise zu Gemini-Transkripten und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält Kilo-Thinking-
  Injektion auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, binäre Thinking-UX, Abgleich moderner Modelle und sowohl
  Nutzungs-Auth als auch Quotenabruf besitzt; die Stream-Familie `tool-stream-default-on` hält
  den standardmäßig aktivierten `tool_stream`-Wrapper aus handgeschriebenem Glue pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es die native xAI-Responses-Transport-Normalisierung, Umschreibungen für Aliasse im Grok-Fast-Mode,
  den Standardwert `tool_stream`, Bereinigung für Strict-Tool / Reasoning-Payload,
  Wiederverwendung von Fallback-Auth für plugin-eigene Tools, die Auflösung
  von Grok-Modellen mit Vorwärtskompatibilität und provider-eigene Kompatibilitäts-Patches wie das Tool-Schema-
  Profil von xAI, nicht unterstützte Schema-Schlüsselwörter, natives `web_search` und HTML-Entity-
  Decodierung von Tool-Call-Argumenten besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Eigenheiten bei Transkripten/Tooling aus dem Kern herauszuhalten.
- Gebündelte Provider nur mit Katalog wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` sowie Usage-Hooks, weil ihr Verhalten für `/usage`
  im Besitz des Plugins ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Helfer

Plugins können über `api.runtime` auf ausgewählte Kern-Helfer zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale TTS-Ausgabe-Payload des Kerns für Oberflächen vom Typ Datei/Sprachnotiz zurück.
- Verwendet die Kernkonfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Samplerate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist optional pro Provider. Verwenden Sie es für provider-eigene Voice-Picker oder Setup-Abläufe.
- Auflistungen von Stimmen können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeitstags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephonie. Microsoft nicht.

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

- Behalten Sie TTS-Richtlinien, Fallback und Antwortzustellung im Kern.
- Verwenden Sie Sprach-Provider für provider-eigenes Syntheseverhalten.
- Alte Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text, Sprache, Bild und künftige Medien-Provider besitzen, wenn OpenClaw diese
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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Kern.
- Behalten Sie Anbieterverhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videogenerierung folgt bereits demselben Muster:
  - der Kern besitzt den Fähigkeitsvertrag und den Laufzeit-Helfer
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeit-Helfer des Medienverständnisses können Plugins Folgendes aufrufen:

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
- Verwendet die Audiokonfiguration des Kern-Medienverständnisses (`tools.media.audio`) und die Reihenfolge des Provider-Fallbacks.
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

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zuzulassen.
- Nicht vertrauenswürdige Läufe von Plugin-Subagenten funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helfer verwenden, statt
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

- Behalten Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Anfragesemantik im Kern.
- Verwenden Sie Websuch-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Wrapper des Agent-Tools abzuhängen.

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

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung erzeugen.
- `listProviders(...)`: verfügbare Provider für Bildgenerierung und ihre Fähigkeiten auflisten.

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
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für Plugin-verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Konflikte bei exakt `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie Ketten von `exact`-/`prefix`-Fallthrough nur innerhalb derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten nicht automatisch Operator-Laufzeit-Scopes. Sie sind für Plugin-verwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helferaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Laufzeit-Scope, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Plugin-Routen-Laufzeit-Scopes auf `operator.write` fest, auch wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routen-Anfragen mit Identität fehlt, fällt der Laufzeit-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Plugin-Route mit Gateway-Authentifizierung implizit eine Admin-Oberfläche ist. Wenn Ihre Route Verhalten nur für Admins benötigt, verlangen Sie einen Auth-Modus mit Identität und dokumentieren Sie den expliziten Vertrag für den Header `x-openclaw-scopes`.

## Importpfade des Plugin-SDK

Verwenden Sie beim Erstellen von Plugins SDK-Subpfade statt des monolithischen Imports `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` für Primitive zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas
  `OpenClawSchema` für das Root-`openclaw.json`.
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
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Abgleich von Erwähnungen,
  Helfer für eingehende Erwähnungsrichtlinien, Formatierung von Envelopes und Helfer für den Kontext eingehender Envelopes.
  `channel-setup` ist die schmale Setup-Naht für optionale Installation.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich importsicherer Setup-Patch-Adapter.
  `setup-adapter-runtime` ist die env-bewusste Naht für Account-Setup-Adapter.
  `setup-tools` ist die kleine Naht für CLI-/Archiv-/Doku-Helfer (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domänen-Subpfade wie `openclaw/plugin-sdk/channel-config-helpers`,
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
  `telegram-command-config` ist die schmale öffentliche Naht für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt verfügbar, auch wenn die gebündelte Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Naht für Text/Markdown/Logging, einschließlich
  Entfernen von für den Assistenten sichtbarem Text, Helfern zum Rendern/Zerlegen von Markdown, Helfern zur Schwärzung,
  Helfern für Directive-Tags und Dienstprogrammen für sicheren Text.
- Approval-spezifische Channel-Seams sollten einen einzelnen Vertrag `approvalCapability`
  auf dem Plugin bevorzugen. Der Kern liest dann Authentifizierung, Zustellung, Rendering,
  natives Routing und Verhalten des lazy nativen Handlers für Genehmigungen über diese eine Fähigkeit,
  statt Genehmigungsverhalten in nicht verwandte Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte die schmaleren
  generischen Primitive importieren, und Repo-Code sollte keine neuen Importe dieses
  Shims hinzufügen.
- Interne Elemente gebündelter extensions bleiben privat. Externe Plugins sollten nur
  Subpfade `openclaw/plugin-sdk/*` verwenden. OpenClaw-Kern-/Testcode kann die öffentlichen
  Repo-Einstiegspunkte unter der Paketwurzel eines Plugins verwenden, etwa `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und schmal abgegrenzte Dateien wie
  `login-qr-api.js`. Importieren Sie niemals `src/*` eines Plugin-Pakets aus dem Kern oder aus
  einer anderen extension.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Helfer/Typen,
  `<plugin-package-root>/runtime-api.js` ist das Barrel nur für Laufzeit,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt des gebündelten Plugins,
  und `<plugin-package-root>/setup-entry.js` ist der Einstiegspunkt des Setup-Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helfer wie
    `wrapAnthropicProviderStream`, Helfer für Beta-Header und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Helfer für Standardmodelle und
    Builder für Echtzeit-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Helfer für Onboarding/Konfiguration,
    während `register.runtime.js` für repo-lokale Verwendung weiterhin generische
    Helfer `plugin-sdk/provider-stream` re-exportieren kann.
- Öffentlich geladene Einstiegspunkte per Fassade bevorzugen den aktiven Laufzeit-Snapshot der Konfiguration,
  wenn einer existiert, und fallen sonst auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Laufzeit-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Ein kleiner
  reservierter Kompatibilitätssatz gebündelter channelmarkierter Helper-Seams existiert weiterhin.
  Behandeln Sie diese als Seams für gebündelte Wartung/Kompatibilität, nicht als neue
  Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen Subpfaden `plugin-sdk/*` oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeiden Sie für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Subpfade für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Parsing/Abgleich von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Nachrichtenaktionen und Helfer für Reaktions-Nachrichten-IDs gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Gebündelte extension-spezifische Helper-Barrels sind standardmäßig nicht stabil. Wenn ein
  Helper nur von einer gebündelten extension benötigt wird, behalten Sie ihn hinter der
  lokalen Nahtstelle `api.js` oder `runtime-api.js` der extension, statt ihn in
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht an Channels gebrandet. Gemeinsames Parsing
  von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`; channelspezifische
  Interna bleiben hinter der lokalen Nahtstelle `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Subpfade wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins
  sie heute verwenden. Ihre Existenz bedeutet für sich genommen nicht, dass jeder exportierte Helper ein
  langfristig eingefrorener externer Vertrag ist.

## Schemas des Nachrichtentools

Plugins sollten die channelspezifischen Schema-Beiträge von `describeMessageTool(...)`
für Nicht-Nachrichten-Primitive wie Reaktionen, Lesevorgänge und Umfragen besitzen.
Gemeinsame Send-Presentation sollte den generischen Vertrag `MessagePresentation`
statt nativer Felder für Buttons, Komponenten, Blöcke oder Karten des Providers verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für Vertrag,
Fallback-Regeln, Provider-Mapping und die Checkliste für Plugin-Autoren.

Plugins mit Send-Fähigkeit deklarieren, was sie über Nachrichtenfähigkeiten rendern können:

- `presentation` für semantische Presentation-Blöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anforderungen an angeheftete Zustellung

Der Kern entscheidet, ob die Presentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie aus dem generischen Nachrichtentool keine nativen UI-Escape-Hatches des Providers bereit.
Veraltete SDK-Helfer für alte native Schemas bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten die channelspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
ausgehenden Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Verzeichnis-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Kern mit, ob eine
  Eingabe direkt zur Auflösung als ID-artig weitergeleitet werden soll statt zur Verzeichnissuche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Kern nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine letzte provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Konstruktion
  der Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen vom Typ „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für provider-spezifischen Normalisierungs-Fallback, nicht für
  breite Verzeichnissuche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, zum Beispiel:

- DM-Peers, die von einer Allowlist gesteuert werden
- konfigurierte Channel-/Gruppen-Maps
- accountbezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Helfer in `directory-runtime` behandeln nur generische Operationen:

- Filterung von Abfragen
- Anwendung von Limits
- Helfer zum Deduplizieren/Normalisieren
- Erzeugen von `ChannelDirectoryEntry[]`

Channelspezifische Account-Prüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte
für Base-URLs oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere verwandte Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als alter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Prüfung

Wenn Ihr Plugin einen Channel registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf davon ausgehen, dass Zugangsdaten
  vollständig materialisiert sind, und darf schnell fehlschlagen, wenn erforderliche Geheimnisse fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und doctor-/config-
  Reparaturabläufe sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur den beschreibenden Account-Status zurückgeben.
- `enabled` und `configured` beibehalten.
- Felder zu Quelle/Status der Zugangsdaten einschließen, wenn relevant, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um die schreibgeschützte
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (und dem passenden Quellfeld)
  reicht für Befehle im Stil von Status aus.
- Verwenden Sie `configured_unavailable`, wenn eine Anmeldeinformation über SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar ist.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert darzustellen.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere extensions aufführt, wird die Plugin-ID zu
`name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheits-Schutzmechanismus: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Abhängigkeitsbäume von Plugins bei „reinem JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt, oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegspunkts. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt des Plugins zusätzlich Tools, Hooks oder anderen nur zur Laufzeit
relevanten Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin in denselben `setupEntry`-Pfad während der
Startphase des Gateways vor dem Listen optieren, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Beginn des Listens des Gateways vorhanden sein muss. In der Praxis bedeutet das, dass der Setup-Einstiegspunkt
jede channel-eigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway mit dem Listen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in diesem Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw
den vollständigen Einstiegspunkt beim Start laden.

Gebündelte Channels können außerdem Setup-only-Helper für Vertragsoberflächen bereitstellen, die der Kern
konsultieren kann, bevor die vollständige Channel-Laufzeit geladen ist. Die aktuelle Oberfläche
für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Kern verwendet diese Oberfläche, wenn er eine alte Channel-Konfiguration mit einem einzelnen Account
in `channels.<id>.accounts.*` überführen muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in einen
benannten hochgestuften Account, wenn benannte Accounts bereits existieren, und kann einen
konfigurierten nicht-kanonischen Standard-Account-Schlüssel beibehalten, statt immer
`accounts.default` zu erzeugen.

Diese Setup-Patch-Adapter halten die Discovery gebündelter Vertragsoberflächen lazy. Die Import-
Zeit bleibt gering; die Oberfläche für Promotion wird nur bei der ersten Verwendung geladen, statt den
Start des gebündelten Channels beim Modulimport erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie unter einem
pluginspezifischen Präfix. Kern-Admin-Namespaces (`config.*`,
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

### Channel-Katalogmetadaten

Channel-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekannt machen. Dadurch bleiben die Katalogdaten im Kern frei von Daten.

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

- `detailLabel`: sekundäre Bezeichnung für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Doku-Link überschreiben
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung der Texte für Auswahloberflächen
- `markdownCapable`: markiert den Channel als markdownfähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: den Channel aus Oberflächen zur Auflistung konfigurierter Channels ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: den Channel aus interaktiven Setup-/Configure-Pickern ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: den Channel für Navigationsoberflächen der Dokumentation als intern/privat markieren
- `showConfigured` / `showInSetup`: alte Aliase werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: den Channel in den Standard-Quickstart-Ablauf `allowFrom` aufnehmen
- `forceAccountBinding`: explizite Account-Bindung verlangen, selbst wenn nur ein Account existiert
- `preferSessionLookupForAnnounceTarget`: bei der Auflösung von Ankündigungszielen Lookup der Sitzung bevorzugen

OpenClaw kann außerdem **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export aus einer MPM-
Registry). Legen Sie eine JSON-Datei an einer der folgenden Stellen ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie mit `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als alte Aliase für den Schlüssel `"entries"`.

## Plugins für die Kontext-Engine

Plugins für die Kontext-Engine besitzen die Orchestrierung des Sitzungskontexts für Aufnahme,
Zusammenstellung und Compaction. Registrieren Sie sie in Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine über
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontextpipeline ersetzen oder erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, behalten Sie `compact()`
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

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten direkten Zugriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Abfolge:

1. den Kernvertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Kern besitzen soll: Richtlinie, Fallback, Konfigurations-
   Merge, Lebenszyklus, channelsichtbare Semantik und Form des Laufzeit-Helfers.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Kern + Channel-/Feature-Konsumenten verdrahten
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Kern verwenden,
   nicht durch direktes Importieren einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends für die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Ownership und Form der Registrierung über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines
einzelnen Providers fest codiert zu werden. Eine konkrete Checkliste mit Dateien und ein ausgearbeitetes Beispiel finden Sie im [Capability Cookbook](/de/plugins/architecture).

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung normalerweise diese
Oberflächen gemeinsam berühren:

- Kern-Vertragstypen in `src/<capability>/types.ts`
- Kern-Runner/Laufzeit-Helfer in `src/<capability>/runtime.ts`
- Oberfläche der Plugin-API zur Registrierung in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung in der Plugin-Laufzeit in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie verwenden müssen
- Helfer für Capture/Tests in `src/test-utils/plugin-registration.ts`
- Assertions für Ownership/Verträge in `src/plugins/contracts/registry.ts`
- Dokumentation für Operatoren/Plugins in `docs/`

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

- der Kern besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Channel-Plugins verwenden Laufzeit-Helfer
- Vertragstests halten Ownership explizit
