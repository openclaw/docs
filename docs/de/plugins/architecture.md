---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Fähigkeitsmodell von Plugins oder Ownership-Grenzen verstehen
    - An der Ladepipeline oder Registry von Plugins arbeiten
    - Laufzeit-Hooks für Anbieter oder Kanal-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Laufzeit-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-26T11:34:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Dies ist die **ausführliche Architekturreferenz** für das Plugin-System von OpenClaw. Für praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Hinzufügen, Aktivieren und zur Fehlerbehebung bei Plugins.
  </Card>
  <Card title="Plugins erstellen" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionierenden Manifest.
  </Card>
  <Card title="Kanal-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Ein Plugin für einen Messaging-Kanal erstellen.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Ein Plugin für einen Modellanbieter erstellen.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich gegen einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                           | Beispiel-Plugins                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Text-Inferenz          | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Speech                 | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Realtime-Transkription | `api.registerRealtimeTranscriptionProvider(...)`| `openai`                             |
| Realtime-Voice         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / Messaging      | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |
| Gateway-Discovery      | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

<Note>
Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools, Discovery-Dienste oder Hintergrunddienste bereitstellt, ist ein **Legacy-Hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Externe Kompatibilitätshaltung

Das Fähigkeitsmodell ist im Core gelandet und wird heute von gebündelten/nativen Plugins verwendet, aber externe Plugin-Kompatibilität braucht weiterhin eine höhere Hürde als „es ist exportiert, also ist es eingefroren“.

| Pluginsituation                                   | Leitlinie                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Vorhandene externe Plugins                        | Hook-basierte Integrationen funktionsfähig halten; dies ist die Kompatibilitätsbasis.           |
| Neue gebündelte/native Plugins                    | Explizite Fähigkeitsregistrierung gegenüber anbieterspezifischen Reach-ins oder neuen Hook-only-Designs bevorzugen. |
| Externe Plugins mit Fähigkeitsregistrierung       | Erlaubt, aber fähigkeitsspezifische Helper-Oberflächen als in Entwicklung betrachten, sofern die Dokumentation sie nicht als stabil markiert. |

Fähigkeitsregistrierung ist die beabsichtigte Richtung. Legacy-Hooks bleiben während des Übergangs der sicherste Pfad ohne Bruch für externe Plugins. Exportierte Helper-Subpfade sind nicht alle gleich — bevorzugen Sie enge dokumentierte Verträge statt zufälliger Helper-Exporte.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin in eine Form auf Basis seines tatsächlichen Registrierungsverhaltens (nicht nur anhand statischer Metadaten):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registriert genau einen Fähigkeitstyp (zum Beispiel ein reines Provider-Plugin wie `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registriert mehrere Fähigkeitstypen (zum Beispiel besitzt `openai` Text-Inferenz, Speech, Medienverständnis und Bildgenerierung).
  </Accordion>
  <Accordion title="hook-only">
    Registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten, Tools, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Tools, Befehle, Dienste oder Routen, aber keine Fähigkeiten.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um Form und Fähigkeitsaufschlüsselung eines Plugins anzuzeigen. Siehe [CLI-Referenz](/de/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für Hook-only-Plugins unterstützt. Reale Legacy-Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeit an Modell-/Provider-Überschreibungen bevorzugen
- `before_prompt_build` für Prompt-Mutationen bevorzugen
- erst entfernen, wenn reale Nutzung zurückgeht und Fixture-Abdeckung Migrationssicherheit beweist

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise eines dieser Labels:

| Signal                     | Bedeutung                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, was veraltet ist       |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute beschädigen: `hook-only` ist nur ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

<Steps>
  <Step title="Manifest + Discovery">
    OpenClaw findet Kandidaten-Plugins aus konfigurierten Pfaden, Workspace-Wurzeln, globalen Plugin-Wurzeln und gebündelten Plugins. Discovery liest zuerst native Manifests `openclaw.plugin.json` sowie unterstützte Bundle-Manifests.
  </Step>
  <Step title="Aktivierung + Validierung">
    Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Memory ausgewählt ist.
  </Step>
  <Step title="Laden zur Laufzeit">
    Native OpenClaw-Plugins werden im Prozess über jiti geladen und registrieren Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
  </Step>
  <Step title="Nutzung der Oberflächen">
    Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich erst beim ersten Aufruf registrieren

Dadurch bleibt plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw dennoch Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Manifest-/Konfigurationsvalidierung sollte aus **Manifest-/Schema-Metadaten** funktionieren, ohne Plugincode auszuführen
- native Fähigkeits-Discovery kann vertrauenswürdigen Plugin-Entry-Code laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugins mit `api.registrationMode === "full"`

Diese Aufteilung erlaubt OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Control Plane. Aufrufer können vor dem Laden breiterer Laufzeit-Registries abfragen, welche Plugins für einen konkreten Befehl, Provider, Kanal, eine Route, ein Agent-Harness oder eine Fähigkeit relevant sind.

Der Planer hält das aktuelle Manifestverhalten kompatibel:

- Felder `activation.*` sind explizite Planer-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben der Fallback für Ownership im Manifest
- die ids-only-API des Planers bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Reason-Labels, sodass die Diagnostik explizite Hinweise von Ownership-Fallback unterscheiden kann

<Warning>
Behandeln Sie `activation` nicht als Lifecycle-Hook oder als Ersatz für `register(...)`. Es sind Metadaten, die zum Eingrenzen des Ladens verwendet werden. Bevorzugen Sie Ownership-Felder, wenn diese die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Hinweise für den Planer.
</Warning>

### Kanal-Plugins und das gemeinsame Nachrichten-Tool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Tool zum Senden/Bearbeiten/Reagieren registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Core, und Kanal-Plugins besitzen die kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den Host des gemeinsamen Tools `message`, die Prompt-Verkabelung, Sitzungs-/Thread-Bookkeeping und die Dispatch-Ausführung
- Kanal-Plugins besitzen die Discovery von scoped Actions, Capability-Discovery und alle kanalspezifischen Schemafragmente
- Kanal-Plugins besitzen kanalanbieterspezifische Grammatik für Sitzungskonversationen, etwa wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-Aufruf ermöglicht es einem Plugin, sichtbare Aktionen, Fähigkeiten und Schemabeiträge gemeinsam zurückzugeben, sodass diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Parameter des Nachrichten-Tools eine Medienquelle wie einen lokalen Pfad oder eine entfernte Medien-URL trägt, sollte das Plugin auch `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite Liste, um Normalisierung von Sandbox-Pfaden und Hinweise zum Zugriff auf ausgehende Medien anzuwenden, ohne plugin-eigene Parameternamen fest zu codieren. Bevorzugen Sie dort action-spezifische Maps und keine eine flache kanalweite Liste, damit ein medienbezogener Profilparameter nicht bei nicht zusammenhängenden Aktionen wie `send` normalisiert wird.

Der Core übergibt den Laufzeit-Scope an diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Kanal kann Nachrichtenaktionen je nach aktivem Konto, aktuellem Raum/Thread/Nachricht oder vertrauenswürdiger Anfordereridentität ausblenden oder bereitstellen, ohne kanalspezifische Verzweigungen im Core-Tool `message` fest zu codieren.

Deshalb bleiben Änderungen am Routing des eingebetteten Runners Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-Discovery-Grenze weiterzuleiten, damit das gemeinsame Tool `message` für den aktuellen Turn die richtige plugin-eigene Oberfläche des Kanals bereitstellt.

Für plugin-eigene Helper zur Ausführung sollten gebündelte Plugins die Laufzeit der Ausführung in ihren eigenen Extension-Modulen behalten. Der Core besitzt die Laufzeiten für Nachrichtenaktionen von Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools` nicht mehr. Wir veröffentlichen keine separaten Subpfade `plugin-sdk/*-action-runtime`, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren extension-eigenen Modulen importieren.

Dieselbe Grenze gilt allgemein auch für anbieterspezifische SDK-Seams: Der Core sollte keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal, WhatsApp oder ähnliche Extensions importieren. Wenn der Core ein Verhalten benötigt, sollte er entweder das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins konsumieren oder den Bedarf zu einer engen generischen Fähigkeit im gemeinsamen SDK befördern.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basislinie für Kanäle, die zum gemeinsamen Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt jetzt das gemeinsame Parsen von Umfragen, bis die plugin-eigene Dispatch-Ausführung für Umfragen die Aktion ablehnt, sodass plugin-eigene Handler für Umfragen kanalspezifische Umfragefelder akzeptieren können, ohne zuvor vom generischen Umfrageparser blockiert zu werden.

Siehe [Interne Details der Plugin-Architektur](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Ownership-Modell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein **Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Oberfläche des eingeführten Features besitzen
- Kanäle sollten gemeinsame Fähigkeiten des Cores konsumieren, statt Anbieter-Verhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Anbieter mit mehreren Fähigkeiten">
    `openai` besitzt Text-Inferenz, Speech, Realtime-Voice, Medienverständnis und Bildgenerierung. `google` besitzt Text-Inferenz plus Medienverständnis, Bildgenerierung und Websuche. `qwen` besitzt Text-Inferenz plus Medienverständnis und Videogenerierung.
  </Accordion>
  <Accordion title="Anbieter mit einer Fähigkeit">
    `elevenlabs` und `microsoft` besitzen Speech; `firecrawl` besitzt Web-Abruf; `minimax` / `mistral` / `moonshot` / `zai` besitzen Backends für Medienverständnis.
  </Accordion>
  <Accordion title="Feature-Plugin">
    `voice-call` besitzt Call-Transport, Tools, CLI, Routen und Twilio-Media-Stream-Bridging, konsumiert aber gemeinsame Fähigkeiten für Speech, Realtime-Transkription und Realtime-Voice, statt Anbieter-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Speech, Bilder und künftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberfläche tun
- Kanäle kümmern sich nicht darum, welches Anbieter-Plugin den Provider besitzt; sie konsumieren den gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Dies ist die zentrale Unterscheidung:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder konsumieren können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht „welcher Provider soll die Videoverarbeitung hart codieren?“ Die erste Frage lautet „wie sieht der Core-Vertrag für die Fähigkeit Video aus?“ Sobald dieser Vertrag existiert, können Anbieter-Plugins sich dagegen registrieren und Kanal-/Feature-Plugins ihn konsumieren.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt normalerweise:

<Steps>
  <Step title="Die Fähigkeit definieren">
    Die fehlende Fähigkeit im Core definieren.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Sie typisiert über die Plugin-API/Laufzeit bereitstellen.
  </Step>
  <Step title="Konsumenten verdrahten">
    Kanäle/Features mit dieser Fähigkeit verbinden.
  </Step>
  <Step title="Implementierungen der Anbieter">
    Anbieter-Plugins Implementierungen registrieren lassen.
  </Step>
</Steps>

So bleibt Ownership explizit, während Core-Verhalten vermieden wird, das von einem einzelnen Anbieter oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses mentale Modell, um zu entscheiden, wohin Code gehört:

<Tabs>
  <Tab title="Core-Fähigkeitsschicht">
    Gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln zum Zusammenführen von Konfigurationen, Zustellsemantik und typisierte Verträge.
  </Tab>
  <Tab title="Schicht der Anbieter-Plugins">
    Anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprachsynthese, Bildgenerierung, künftige Video-Backends, Nutzungsendpunkte.
  </Tab>
  <Tab title="Schicht der Kanal-/Feature-Plugins">
    Integration von Slack/Discord/voice-call/etc., die Core-Fähigkeiten konsumiert und auf einer Oberfläche präsentiert.
  </Tab>
</Tabs>

Zum Beispiel folgt TTS dieser Form:

- der Core besitzt TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Implementierungen der Synthese
- `voice-call` konsumiert den Laufzeit-Helper für Telephony-TTS

Dasselbe Muster sollte für künftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame Verträge für Modelle, Speech, Realtime-Transkription, Realtime-Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat, kann ein Anbieter alle seine Oberflächen an einer Stelle besitzen:

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

Wichtig ist nicht die genaue Benennung der Helper. Wichtig ist die Form:

- ein Plugin besitzt die Oberfläche des Anbieters
- der Core besitzt weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins konsumieren `api.runtime.*`-Helper, nicht Anbieter-Code
- Vertragstests können sicherstellen, dass das Plugin die Fähigkeiten registriert hat, die es zu besitzen beansprucht

### Beispiel für eine Fähigkeit: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame Fähigkeit. Dasselbe Ownership-Modell gilt auch hier:

<Steps>
  <Step title="Der Core definiert den Vertrag">
    Der Core definiert den Vertrag für Medienverständnis.
  </Step>
  <Step title="Anbieter-Plugins registrieren sich">
    Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und `describeVideo`.
  </Step>
  <Step title="Konsumenten verwenden das gemeinsame Verhalten">
    Kanal- und Feature-Plugins konsumieren das gemeinsame Verhalten des Cores, statt direkt Anbieter-Code zu verdrahten.
  </Step>
</Steps>

So werden die Video-Annahmen eines einzelnen Anbieters nicht in den Core eingebrannt. Das Plugin besitzt die Anbieter-Oberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videogenerierung folgt bereits derselben Sequenz: Der Core besitzt den typisierten Fähigkeitsvertrag und den Laufzeit-Helper, und Anbieter-Plugins registrieren Implementierungen dagegen mit `api.registerVideoGenerationProvider(...)`.

Brauchen Sie eine konkrete Checkliste zur Einführung? Siehe [Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist bewusst typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeit-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership zurückweisen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierung angezeigt werden
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stille Drift verhindern

Es gibt zwei Ebenen der Durchsetzung:

<AccordionGroup>
  <Accordion title="Durchsetzung der Laufzeitregistrierung">
    Die Plugin-Registry validiert Registrierungen beim Laden von Plugins. Beispiele: doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefinierten Verhaltens.
  </Accordion>
  <Accordion title="Vertragstests">
    Gebündelte Plugins werden bei Testläufen in Vertrags-Registries erfasst, sodass OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modellanbieter, Speech-Anbieter, Websuch-Anbieter und Ownership gebündelter Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammenspielen, weil Ownership deklariert, typisiert und testbar ist, statt implizit zu sein.

### Was in einen Vertrag gehört

<Tabs>
  <Tab title="Gute Verträge">
    - typisiert
    - klein
    - fähigkeitsspezifisch
    - im Besitz des Cores
    - von mehreren Plugins wiederverwendbar
    - von Kanälen/Features ohne Anbieterwissen konsumierbar
  </Tab>
  <Tab title="Schlechte Verträge">
    - anbieterspezifische Richtlinien, die im Core verborgen sind
    - einmalige plugin-spezifische Escape-Hatches, die die Registry umgehen
    - Kanalcode, der direkt auf eine Anbieter-Implementierung zugreift
    - ad hoc-Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind
  </Tab>
</Tabs>

Im Zweifel: Heben Sie die Abstraktionsebene an. Definieren Sie zuerst die Fähigkeit und lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht sandboxed. Ein geladenes natives Plugin hat dieselbe prozessbezogene Vertrauensgrenze wie Core-Code.

<Warning>
Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin ist gleichbedeutend mit beliebiger Codeausführung innerhalb des OpenClaw-Prozesses
  </Warning>

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das vor allem gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie Workspace-Plugins als Code für Entwicklungszeit, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID standardmäßig im npm-Namen verankert bleiben: `@openclaw/<id>`, oder mit einem genehmigten typisierten Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket bewusst eine engere Plugin-Rolle bereitstellt.

<Note>
**Hinweis zum Vertrauen:**

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet bewusst die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/in der Allowlist ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.
- Das Vertrauen in gebündelte Plugins wird aus dem Source-Snapshot aufgelöst — dem Manifest und dem Code auf Datenträger zur Ladezeit — und nicht aus Installationsmetadaten. Ein beschädigter oder ersetzter Installationseintrag kann die Vertrauensoberfläche eines gebündelten Plugins nicht still über das hinaus erweitern, was der tatsächliche Source-Code beansprucht.
  </Note>

## Export-Grenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Convenience.

Halten Sie Fähigkeitsregistrierung öffentlich. Schneiden Sie Helper-Exporte ab, die keine Verträge sind:

- Helper-Subpfade spezifisch für gebündelte Plugins
- Laufzeit-Plumbing-Subpfade, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpfade gebündelter Plugins bleiben aus Kompatibilitätsgründen und zur Pflege gebündelter Plugins weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele umfassen `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und mehrere Seams `plugin-sdk/matrix*`. Behandeln Sie diese als reservierte Exporte für Implementierungsdetails, nicht als empfohlenes SDK-Muster für neue Drittanbieter-Plugins.

## Interna und Referenz

Für die Ladepipeline, das Registry-Modell, Laufzeit-Hooks für Anbieter, Gateway-HTTP-Routen, Schemas des Nachrichten-Tools, Auflösung von Kanalzielen, Anbieter-Kataloge, Plugins für die Kontext-Engine und die Anleitung zum Hinzufügen einer neuen Fähigkeit siehe [Interne Details der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
