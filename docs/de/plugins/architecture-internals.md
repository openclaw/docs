---
read_when:
    - Provider-Runtime-Hooks, Kanal-Lebenszyklus oder Paketgruppen implementieren
    - Debuggen der Plugin-Ladereihenfolge oder des Registry-Zustands
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Context-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-04-30T07:03:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

For das öffentliche Capability-Modell, Plugin-Formen und Owner-/Ausführungskontrakte siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die Referenz für die internen Mechanismen: Lade-Pipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start führt OpenClaw grob Folgendes aus:

1. Kandidaten für Plugin-Wurzeln ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   nicht gebaute native Plugins verwenden jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten werden blockiert,
wenn der Einstieg die Plugin-Wurzel verlässt, der Pfad für alle beschreibbar ist oder die
Pfad-Eigentümerschaft bei nicht gebündelten Plugins verdächtig wirkt.

### Manifest-first-Verhalten

Das Manifest ist die Control-Plane-Quelle der Wahrheit. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Capabilities zu ermitteln
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu erweitern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren ohne Laden der Plugin-Runtime zu bewahren

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` verbleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen weder Runtime-Registrierung noch `register(...)` oder `setupEntry`.
Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins vor einer breiteren Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen
- Die Gateway-Startplanung verwendet `activation.onStartup` für explizite Start-Imports
  und Start-Opt-outs; jedes Plugin sollte dies deklarieren, während OpenClaw
  sich von impliziten Start-Imports entfernt. Plugins ohne statische
  Capability-Metadaten und ohne `activation.onStartup` verwenden aus Kompatibilitätsgründen weiterhin den
  veralteten impliziten Start-Sidecar-Fallback

Der Aktivierungsplaner stellt sowohl eine reine IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite `activation.*`-Planerhinweise von Manifest-Ownership-Fallbacks
wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze:
Bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Runtime-Ladesemantik zu ändern.

Die Setup-Erkennung bevorzugt jetzt deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie für Plugins, die weiterhin Setup-Zeit-Runtime-Hooks benötigen, auf
`setup-api` zurückfällt. Provider-Setup-Listen verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete Setup-
Optionen und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden. Explizites
`setup.requiresRuntime: false` ist ein reiner Deskriptor-Grenzpunkt; ein ausgelassenes
`requiresRuntime` behält den Legacy-`setup-api`-Fallback aus Kompatibilitätsgründen bei. Wenn mehr
als ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-
Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Owner, statt sich auf die
Erkennungsreihenfolge zu verlassen. Wenn Setup-Runtime ausgeführt wird, melden Registry-Diagnosen
Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-
Backends, die durch setup-api registriert wurden, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert weder Plugin-Erkennungsergebnisse noch direkte Manifest-Registry-
Daten hinter Zeitfenstern nach Wanduhrzeit zwischen. Installationen, Manifeständerungen und Ladepfadänderungen
müssen beim nächsten expliziten Metadatenlesen oder Snapshot-Neuaufbau sichtbar werden.
Der Manifest-Dateiparser kann einen begrenzten Dateisignatur-Cache behalten, der über den
geöffneten Manifestpfad, Inode, Größe und Zeitstempel indiziert ist; dieser Cache vermeidet nur
das erneute Parsen unveränderter Bytes und darf keine Erkennungs-, Registry-, Owner- oder
Policy-Antworten zwischenspeichern.

Der sichere Metadaten-Schnellpfad ist explizite Objekt-Ownership, nicht ein versteckter Cache.
Gateway-Start-Hotpaths sollten den aktuellen `PluginMetadataSnapshot`, die
abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die Aufrufkette
weitergeben. Konfigurationsvalidierung, automatische Start-Aktivierung, Plugin-Bootstrap und Provider-
Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und
das Plugin-Inventar repräsentieren. Die Setup-Suche rekonstruiert Manifest-Metadaten weiterhin bei Bedarf,
es sei denn, der konkrete Setup-Pfad erhält eine explizite Manifest-Registry; behalten Sie dies
als Cold-Path-Fallback bei, statt versteckte Lookup-Caches hinzuzufügen. Wenn sich die Eingabe
ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder
historische Kopien zu behalten.
Sichten auf die aktive Plugin-Registry und gebündelte Kanal-Bootstrap-Hilfen
sollten aus der aktuellen Registry/Wurzel neu berechnet werden. Kurzlebige Maps sind
innerhalb eines Aufrufs in Ordnung, um Arbeit zu deduplizieren oder Wiedereintritt zu schützen; sie dürfen nicht zu Prozess-
Metadaten-Caches werden.

Für das Laden von Plugins ist die persistente Cache-Schicht das Runtime-Laden. Sie kann
Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, zum Beispiel:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- jiti-/Modul-Caches und Public-Surface-Loader-Caches, die verwendet werden, um das wiederholte Importieren
  derselben Runtime-Oberfläche zu vermeiden
- Runtime-Abhängigkeits-Spiegel und Dateisystem-Caches für installierte Plugin-
  Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Data-Plane-Implementierungsdetails. Sie dürfen keine
Control-Plane-Fragen wie „welches Plugin besitzt diesen Provider?“ beantworten, es sei denn, der
Aufrufer hat bewusst Runtime-Laden angefordert.

Fügen Sie keine persistenten oder Wanduhrzeit-Caches hinzu für:

- Erkennungsergebnisse
- direkte Manifest-Registries
- Manifest-Registries, die aus dem installierten Plugin-Index rekonstruiert wurden
- Provider-Owner-Lookup, Modellunterdrückung, Provider-Policy oder Public-Artifact-
  Metadaten
- jede andere aus dem Manifest abgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index
  oder Ladepfad beim nächsten Metadatenlesen sichtbar sein sollte

Aufrufer, die Manifest-Metadaten aus dem persistierten installierten Plugin-
Index neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist dauerhafter
Source-Plane-Zustand; er ist kein versteckter In-Process-Metadaten-Cache.

## Registry-Modell

Geladene Plugins mutieren keine beliebigen Core-Globals direkt. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- plugin-eigene Befehle

Core-Funktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Runtime -> Registry-Nutzung

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-
Modul als Sonderfall behandeln“.

## Conversation-Binding-Callbacks

Plugins, die eine Conversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

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

Callback-Payload-Felder:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, Detach-Hinweis, Sender-ID und
  Conversation-Metadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine
Conversation binden darf, und er läuft, nachdem die Core-Genehmigungsverarbeitung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifest-Metadaten** für günstiges Lookup vor der Runtime:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Konfigurationszeit-Hooks**: `catalog` (Legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: über 40 optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Wrapping, Denkstufen, Replay-Policy und Nutzungsendpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw besitzt weiterhin den generischen Agent-Loop, Failover, Transcript-Verarbeitung und
Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne einen vollständig eigenen Inferenztransport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider env-basierte
Anmeldedaten hat, die generische Auth-/Status-/Modellpicker-Pfade sehen sollten, ohne
die Plugin-Runtime zu laden. Das veraltete `providerAuthEnvVars` wird während des
Deprecation-Fensters weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins,
die es verwenden, erhalten eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die env vars, Auth-Profile, konfigurationsgestützte Authentifizierung und API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest
`providerAuthChoices`, wenn Onboarding-/Auth-Auswahl-CLI-Oberflächen die
Choice-ID, Gruppenlabels und einfache One-Flag-Auth-Verdrahtung des Providers kennen sollten, ohne
die Provider-Runtime zu laden. Behalten Sie Provider-Runtime-
`envVars` für operatororientierte Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Authentifizierung oder Setup hat, die
generischer Shell-env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollten,
ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks in ungefähr dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.
Nur kompatibilitätsbezogene Provider-Felder, die OpenClaw nicht mehr aufruft, wie
`ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier bewusst nicht
aufgeführt.

| #   | Hook                              | Was er tut                                                                                                                     | Wann verwenden                                                                                                                                                      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der `models.json`-Generierung in `models.providers` veröffentlichen                             | Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                                                  |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden                         | Standardwerte hängen vom Authentifizierungsmodus, von der Umgebung oder von der Modellfamilien-Semantik des Providers ab                                             |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                                     | _(kein Plugin-Hook)_                                                                                                                                                |
| 3   | `normalizeModelId`                | Legacy- oder Vorschau-Modell-ID-Aliase vor der Suche normalisieren                                                              | Provider ist für die Alias-Bereinigung vor der kanonischen Modellauflösung zuständig                                                                                 |
| 4   | `normalizeTransport`              | Provider-Familien-`api` / `baseUrl` vor der generischen Modellzusammenstellung normalisieren                                    | Provider ist für die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie zuständig                                               |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung normalisieren                                                      | Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helfer sichern auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Nutzungs-Kompatibilitätsumschreibungen auf Konfigurations-Provider anwenden                                   | Provider benötigt endpunktgesteuerte Korrekturen für native Streaming-Nutzungsmetadaten                                                                              |
| 7   | `resolveConfigApiKey`             | Authentifizierung über Umgebungsmarker für Konfigurations-Provider vor dem Laden der Laufzeit-Authentifizierung auflösen        | Provider hat Provider-eigene Umgebungsmarker-API-Schlüsselauflösung; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Umgebungsmarker-Auflöser              |
| 8   | `resolveSyntheticAuth`            | Lokale/selbst gehostete oder konfigurationsgestützte Authentifizierung offenlegen, ohne Klartext dauerhaft zu speichern         | Provider kann mit einem synthetischen/lokalen Anmeldeinformationsmarker arbeiten                                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Authentifizierungsprofile überlagern; Standard-`persistence` ist `runtime-only` für CLI-/App-eigene Anmeldeinformationen | Provider verwendet externe Authentifizierungsdaten wieder, ohne kopierte Refresh-Token dauerhaft zu speichern; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profil-Platzhalter hinter umgebungs-/konfigurationsgestützte Authentifizierung zurückstufen           | Provider speichert synthetische Platzhalterprofile, die keine Vorrangstellung erhalten sollten                                                                       |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind                                 | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                                   |
| 12  | `prepareDynamicModel`             | Asynchrones Aufwärmen, danach wird `resolveDynamicModel` erneut ausgeführt                                                      | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                                          |
| 13  | `normalizeResolvedModel`          | Finale Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                                             | Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Kern-Transport                                                                            |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitätsflags für Vendor-Modelle hinter einem anderen kompatiblen Transport beisteuern                                   | Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                                        |
| 15  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                                             | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                                       |
| 16  | `inspectToolSchemas`              | Provider-eigene Schema-Diagnosen nach der Normalisierung offenlegen                                                             | Provider möchte Schlüsselwortwarnungen, ohne dem Kern Provider-spezifische Regeln beizubringen                                                                       |
| 17  | `resolveReasoningOutputMode`      | Vertrag für native vs. markierte Reasoning-Ausgabe auswählen                                                                    | Provider benötigt markierte Reasoning-/finale Ausgabe statt nativer Felder                                                                                          |
| 18  | `prepareExtraParams`              | Anfrageparameter-Normalisierung vor generischen Stream-Options-Wrappern                                                         | Provider benötigt Standard-Anfrageparameter oder Provider-spezifische Parameterbereinigung                                                                           |
| 19  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                                         | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                                    |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                                    | Provider benötigt Kompatibilitäts-Wrapper für Anfrage-Header/-Body/-Modell ohne benutzerdefinierten Transport                                                       |
| 21  | `resolveTransportTurnState`       | Native transportbezogene Header oder Metadaten pro Turn anhängen                                                               | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                                    |
| 22  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Richtlinie zur Sitzungsabkühlung anhängen                                                          | Provider möchte, dass generische WS-Transporte Sitzungsheader oder Fallback-Richtlinie abstimmen                                                                     |
| 23  | `formatApiKey`                    | Authentifizierungsprofil-Formatierer: gespeichertes Profil wird zur Laufzeit-`apiKey`-Zeichenfolge                             | Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt eine benutzerdefinierte Laufzeit-Tokenform                                                  |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Richtlinien bei Refresh-Fehlern                            | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshers                                                                                                          |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                                            | Provider benötigt Provider-eigene Authentifizierungsreparaturhinweise nach einem Refresh-Fehler                                                                     |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfensterüberlauf                                                                             | Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                                                        |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                                            | Provider kann rohe API-/Transportfehler auf Ratenlimit/Überlastung/usw. abbilden                                                                                    |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                                            | Provider benötigt Proxy-spezifische Cache-TTL-Steuerung                                                                                                             |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                                             | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                                              |
| 30  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                                      | Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahllisten                                                                              |
| 31  | `resolveThinkingProfile`          | Modellspezifischer `/think`-Level-Satz, Anzeigelabels und Standardwert                                                          | Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder ein binäres Label bereit                                                       |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für den Ein/Aus-Reasoning-Schalter                                                                         | Provider bietet nur binäres Thinking ein/aus an                                                                                                                     |
| 33  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                                        | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für den Standard-`/think`-Level                                                                            | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                                             |
| 35  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                                             | Provider besitzt den bevorzugten Live-/Smoke-Modellabgleich                                                                                                         |
| 36  | `prepareRuntimeAuth`              | Eine konfigurierte Anmeldeinformation direkt vor der Inferenz in das tatsächliche Laufzeit-Token/den tatsächlichen Laufzeitschlüssel austauschen | Provider benötigt einen Token-Austausch oder kurzlebige Anfrageanmeldeinformationen                                                                                  |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungs-Zugangsdaten für `/usage` und zugehörige Statusoberflächen auflösen                                     | Provider benötigt benutzerdefiniertes Token-Parsing für Nutzung/Kontingent oder andere Nutzungs-Zugangsdaten                                                               |
| 38  | `fetchUsageSnapshot`              | Provider-spezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde                             | Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Payload-Parser                                                                           |
| 39  | `createEmbeddingProvider`         | Einen vom Provider verwalteten Embedding-Adapter für Speicher/Suche erstellen                                                     | Verhalten für Speicher-Embeddings gehört zum Provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptbehandlung für den Provider steuert                                        | Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transkriptbereinigung umschreiben                                                        | Provider benötigt Provider-spezifische Replay-Umschreibungen über gemeinsame Compaction-Hilfsfunktionen hinaus                                                             |
| 42  | `validateReplayTurns`             | Abschließende Replay-Turn-Validierung oder -Umformung vor dem eingebetteten Runner                                           | Provider-Transport benötigt nach generischer Bereinigung eine strengere Turn-Validierung                                                                    |
| 43  | `onModelSelected`                 | Vom Provider verwaltete Nebeneffekte nach der Auswahl ausführen                                                                 | Provider benötigt Telemetrie oder vom Provider verwalteten Zustand, wenn ein Modell aktiv wird                                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und gehen dann zu anderen hook-fähigen
Provider-Plugins über, bis eines die Modell-ID oder den Transport/die
Konfiguration tatsächlich ändert. So funktionieren Alias-/Kompatibilitäts-
Provider-Shims weiter, ohne dass der Aufrufer wissen muss, welches mitgelieferte
Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Family-Konfigurationseintrag umschreibt, wendet der mitgelieferte
Google-Konfigurationsnormalisierer diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig eigenes Wire-Protokoll oder einen eigenen
Request-Executor benötigt, ist das eine andere Erweiterungsklasse. Diese Hooks
sind für Provider-Verhalten gedacht, das weiterhin in OpenClaws normalem
Inference-Loop ausgeführt wird.

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

### Mitgelieferte Beispiele

Mitgelieferte Provider-Plugins kombinieren die oben genannten Hooks, um die
Katalog-, Auth-, Thinking-, Replay- und Usage-Anforderungen der jeweiligen
Vendors abzudecken. Der maßgebliche Hook-Satz liegt bei jedem Plugin unter
`extensions/`; diese Seite veranschaulicht die Formen, statt die Liste zu
spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalog-Provider">
    OpenRouter, Kilocode, Z.AI und xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor OpenClaws statischem Katalog verfügbar machen können.
  </Accordion>
  <Accordion title="OAuth- und Usage-Endpoint-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi und z.ai
    kombinieren `prepareRuntimeAuth` oder `formatApiKey` mit
    `resolveUsageAuth` + `fetchUsageSnapshot`, um Token-Austausch und
    `/usage`-Integration selbst zu besitzen.
  </Accordion>
  <Accordion title="Replay- und Transcript-Bereinigungsfamilien">
    Gemeinsam benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern,
    sich per `buildReplayPolicy` in Transcript-Richtlinien einzuklinken, statt
    dass jedes Plugin die Bereinigung erneut implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen den gemeinsamen
    Inference-Loop.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Hilfsfunktionen">
    Beta-Header, `/fast` / `serviceTier` und `context1m` befinden sich im
    öffentlichen `api.ts`- / `contract-api.ts`-Seam des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Runtime-Hilfsfunktionen

Plugins können über `api.runtime` auf ausgewählte Core-Hilfsfunktionen zugreifen.
Für TTS:

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabepayload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider resamplen/codieren.
- `listVoices` ist je Provider optional. Verwenden Sie es für vendor-eigene Voice-Picker oder Einrichtungsabläufe.
- Voice-Listings können reichere Metadaten wie Locale, Geschlecht und Personality-Tags für provider-bewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

Plugins können außerdem Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Belassen Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Speech-Provider für vendor-eigenes Syntheseverhalten.
- Die Legacy-Microsoft-`edge`-Eingabe wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Speech-, Bild- und zukünftige Media-Provider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Media-Understanding-Provider statt einer generischen Key/Value-Bag:

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

- Belassen Sie Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Core.
- Belassen Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - Core besitzt den Fähigkeitsvertrag und die Runtime-Hilfsfunktion
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Media-Understanding-Runtime-Hilfsfunktionen können Plugins Folgendes aufrufen:

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

Für Audiotranskription können Plugins entweder die Media-Understanding-Runtime
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
- Verwendet die Core-Audiokonfiguration für Media-Understanding (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel übersprungene/nicht unterstützte Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können außerdem Hintergrund-Subagent-Runs über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Overrides pro Run, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Runs müssen Operatoren sich mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktiv dafür entscheiden.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Subagent-Runs nicht vertrauenswürdiger Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der erstellenden Plugin-ID markiert. Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebige Sitzungslöschungen erfordern weiterhin eine admin-begrenzte Gateway-Anfrage.

Für Websuche können Plugins die gemeinsame Runtime-Hilfsfunktion verwenden, statt
in die Agent-Tool-Verdrahtung zu greifen:

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

Plugins können außerdem Websuche-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Belassen Sie Provider-Auswahl, Credential-Auflösung und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuche-Provider für vendor-spezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Agent-Tool-Wrapper abzuhängen.

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

- `generate(...)`: Generiert ein Bild über die konfigurierte Image-Generation-Provider-Kette.
- `listProviders(...)`: Listet verfügbare Image-Generation-Provider und deren Fähigkeiten auf.

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
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für plugin-verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: Gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte `path + match`-Konflikte werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann nicht die Route eines anderen Plugins ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`/`prefix`-Fallback-Ketten nur auf derselben Auth-Stufe.
- `auth: "plugin"`-Routen erhalten **nicht** automatisch Operator-Runtime-Scopes. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- `auth: "gateway"`-Routen laufen innerhalb eines Runtime-Scopes für Gateway-Anfragen, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fixiert, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` an einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätstragenden Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route rein administrative Funktionen benötigt, verlangen Sie einen identitätstragenden Auth-Modus und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin-SDK

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade anstelle des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Zentrale Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`  | Helfer für Kanaleintrag/Build                      |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Helfer und Rahmenvertrag     |
| `openclaw/plugin-sdk/config-schema` | Root-Zod-Schema für `openclaw.json` (`OpenClawSchema`) |

Kanal-Plugins wählen aus einer Familie schmaler Schnittstellen: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf einem
einzigen `approvalCapability`-Vertrag zusammengeführt werden, statt über
nicht verwandte Plugin-Felder gemischt zu werden. Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurationshelfer liegen unter passenden fokussierten `*-runtime`-Unterpfaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` usw.). Bevorzugen Sie `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation`
anstelle des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (je gebündeltem Plugin-Paket-Root):

- `index.js` — Einstieg des gebündelten Plugins
- `api.js` — Barrel für Helfer/Typen
- `runtime-api.js` — reines Runtime-Barrel
- `setup-entry.js` — Einstieg für Setup-Plugin

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals `src/*` eines anderen Plugin-Pakets aus Core oder aus einem anderen Plugin.
Über Fassaden geladene Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot, wenn einer existiert, und fallen dann auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind
nicht automatisch langfristig eingefrorene externe Verträge. Prüfen Sie die
relevante SDK-Referenzseite, wenn Sie sich darauf verlassen.

## Schemata für Nachrichten-Tools

Plugins sollten kanalspezifische `describeMessageTool(...)`-Schemabeiträge
für Nicht-Nachrichten-Primitive wie Reaktionen, Lesebestätigungen und Umfragen
selbst besitzen. Gemeinsame Sendepräsentation sollte den generischen Vertrag
`MessagePresentation` verwenden, statt provider-nativer Button-, Komponenten-,
Block- oder Kartenfelder. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation)
für den Vertrag, Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie darstellen können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zu angehefteter Zustellung

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text herabgestuft wird.
Stellen Sie keine provider-nativen UI-Ausweichmöglichkeiten aus dem generischen Nachrichten-Tool bereit.
Veraltete SDK-Helfer für Legacy-Nativschemata bleiben für bestehende
Drittanbieter-Plugins exportiert, neue Plugins sollten sie jedoch nicht verwenden.

## Auflösung von Kanalzielen

Kanal-Plugins sollten kanalspezifische Zielsemantik selbst besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt in eine ID-artige Auflösung gehen soll, statt eine Verzeichnissuche auszuführen.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Verzeichnis-Fehltreffer eine finale Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die provider-spezifische Konstruktion der Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen stattfinden sollen.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für provider-spezifische Normalisierungs-Fallbacks, nicht für
  breite Verzeichnissuchen.
- Halten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  in `target`-Werten oder provider-spezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, zum Beispiel:

- allowlist-gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Zuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Helfer in `directory-runtime` behandeln nur generische Operationen:

- Abfragefilterung
- Anwendung von Limits
- Helfer für Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin provider-spezifische Modell-IDs, Basis-URL-Defaults
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalinspektion

Wenn Ihr Plugin einen Kanal registriert, implementieren Sie bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf annehmen, dass Anmeldedaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurations-
  Reparaturabläufe sollten keine Runtime-Anmeldedaten materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur beschreibenden Kontostatus zurück.
- Behalten Sie `enabled` und `configured` bei.
- Fügen Sie Felder für Quelle/Status der Anmeldedaten hinzu, wenn relevant, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` (und das passende Quellfeld)
  reicht für Statusbefehle aus.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert,
  aber im aktuellen Befehlspfad nicht verfügbar sind.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Paket-Bundles

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

Jeder Eintrag wird zu einem Plugin. Wenn das Paket mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach der Symlink-Auflösung innerhalb des Plugin-Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Dev-Abhängigkeiten zur Laufzeit) und ignoriert geerbte globale npm-Installations-Einstellungen.
Halten Sie Plugin-Abhängigkeitsbäume „reines JS/TS“ und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein schlankes, reines Setup-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Eintrags. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupt-Plugin-Eintrag auch Tools, Hooks oder anderen rein Runtime-bezogenen
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin während der Pre-Listen-Startphase des Gateways für denselben
`setupEntry`-Pfad anmelden, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche, die vor dem
Beginn des Gateway-Listenings existieren muss, vollständig abdeckt. In der Praxis bedeutet das,
dass der Setup-Eintrag jede kanal-eigene Fähigkeit registrieren muss, von der der Start abhängt, zum Beispiel:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway mit dem Listening beginnt
- alle Gateway-Methoden, Tools oder Dienste, die während desselben Zeitfensters existieren müssen

Wenn Ihr vollständiger Eintrag weiterhin eine erforderliche Startup-Fähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Belassen Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Eintrag beim Start laden.

Gebündelte Kanäle können auch reine Setup-Helfer für Vertragsoberflächen veröffentlichen, die Core
konsultieren kann, bevor die vollständige Kanal-Runtime geladen ist. Die aktuelle Setup-Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Oberfläche, wenn eine Legacy-Konfiguration für einen Single-Account-Kanal in `channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Eintrag zu laden. Matrix ist das aktuelle mitgelieferte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein benanntes hochgestuftes Konto, wenn benannte Konten bereits existieren, und kann einen konfigurierten nicht-kanonischen Standardschlüssel für das Standardkonto beibehalten, statt immer `accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Ermittlung der mitgelieferten Vertragsoberflächen lazy. Die Importzeit bleibt gering; die Promotion-Oberfläche wird erst bei der ersten Verwendung geladen, statt beim Modulimport erneut in den Start des mitgelieferten Kanals einzusteigen.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halten Sie sie unter einem Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

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

Kanal-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und Installationshinweise über `openclaw.install` veröffentlichen. Dadurch bleibt der Core-Katalog datenfrei.

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

Nützliche `openclaw.channel`-Felder über das minimale Beispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Textsteuerung für Auswahloberflächen
- `markdownCapable`: markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen zur Auflistung konfigurierter Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal als intern/privat für Navigationsoberflächen der Dokumentation
- `showConfigured` / `showInSetup`: Legacy-Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: bindet den Kanal in den standardmäßigen Quickstart-`allowFrom`-Flow ein
- `forceAccountBinding`: erfordert eine explizite Kontobindung, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen

OpenClaw kann außerdem **externe Kanalkataloge** zusammenführen (zum Beispiel einen MPM-Registry-Export). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

Generierte Kanalkatalogeinträge und Installationskatalogeinträge für Provider stellen normalisierte Fakten zur Installationsquelle neben dem rohen Block `openclaw.install` bereit. Die normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version oder ein flexibler Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob zusätzlich ein lokaler Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die normalisierten Fakten, falls der geparste npm-Paketname von dieser Identität abweicht. Sie warnen außerdem, wenn `defaultChoice` ungültig ist oder auf eine nicht verfügbare Quelle zeigt, sowie wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind. Consumer sollten `installSource` als additives optionales Feld behandeln, damit manuell erstellte Einträge und Katalog-Shims es nicht synthetisieren müssen. Dadurch können Onboarding und Diagnosen den Zustand der Source Plane erklären, ohne Plugin-Runtime zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus `expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus Kompatibilitätsgründen weiterhin, zeigen aber Source-Plane-Warnungen an, damit sich der Katalog in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu beschädigen. Wenn das Onboarding von einem lokalen Katalogpfad installiert, zeichnet es einen verwalteten Plugin-Indexeintrag mit `source: "path"` und, wenn möglich, einem workspace-relativen `sourcePath` auf. Der absolute operative Ladepfad bleibt in `plugins.load.paths`; der Installationsdatensatz vermeidet, lokale Workstation-Pfade in langlebige Konfiguration zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für Source-Plane-Diagnosen sichtbar, ohne eine zweite rohe Offenlegungsoberfläche für Dateisystempfade hinzuzufügen. Der persistierte Plugin-Index `plugins/installs.json` ist die verbindliche Quelle für Installationen und kann aktualisiert werden, ohne Plugin-Runtime-Module zu laden. Seine Map `installRecords` ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder ungültig ist; sein Array `plugins` ist eine neu erstellbare Manifestansicht.

## Plugins für die Kontext-Engine

Plugins für die Kontext-Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Zusammenstellung und Compaction. Registrieren Sie sie aus Ihrem Plugin mit `api.registerContextEngine(id, factory)` und wählen Sie anschließend die aktive Engine mit `plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss, statt lediglich Memory-Suche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

Die Factory `ctx` stellt optionale Werte `config`, `agentDir` und `workspaceDir` für die Initialisierung zur Konstruktionszeit bereit.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()` implementiert und delegieren Sie ihn explizit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie das Plugin-System nicht mit einem privaten Zugriff in Interna. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. Definieren Sie den Core-Vertrag
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurationszusammenführung, Lebenszyklus, kanalbezogene Semantik und Form der Runtime-Helfer.
2. Fügen Sie typisierte Plugin-Registrierungs-/Runtime-Oberflächen hinzu
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste sinnvolle typisierte Capability-Oberfläche.
3. Verdrahten Sie Core- und Kanal-/Feature-Consumer
   Kanäle und Feature-Plugins sollten die neue Capability über den Core konsumieren, nicht durch direkten Import einer Vendor-Implementierung.
4. Registrieren Sie Vendor-Implementierungen
   Vendor-Plugins registrieren dann ihre Backends gegen die Capability.
5. Fügen Sie Vertragsabdeckung hinzu
   Fügen Sie Tests hinzu, damit Besitz und Registrierungsform langfristig explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne fest auf die Weltsicht eines einzelnen Providers codiert zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel finden Sie im [Capability-Cookbook](/de/plugins/architecture).

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Runtime-Helfer in `src/<capability>/runtime.ts`
- Registrierungsoberfläche der Plugin-API in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Runtime-Exponierung für Plugins in `src/plugins/runtime/*`, wenn Feature-/Kanal-Plugins sie konsumieren müssen
- Capture-/Testhelfer in `src/test-utils/plugin-registration.ts`
- Besitz-/Vertragsassertionen in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Capability noch nicht vollständig integriert ist.

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

- Core besitzt den Capability-Vertrag und die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Kanal-Plugins konsumieren Runtime-Helfer
- Vertragstests halten den Besitz explizit

## Verwandte Themen

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
