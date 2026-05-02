---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Channel-Lebenszyklus oder Paket-Packs
    - Debugging der Plugin-Ladereihenfolge oder des Registry-Zustands
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Kontext-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-05-02T06:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Für das öffentliche Capability-Modell, Plugin-Formen und Ownership-/Ausführungsverträge siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die Referenz für die internen Mechanismen: Lade-Pipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start macht OpenClaw ungefähr Folgendes:

1. Kandidaten für Plugin-Roots ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   lokaler TypeScript-Quellcode von Drittanbietern verwendet den Jiti-Notfall-Fallback
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen verfügbar machen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheits-Gates greifen **vor** der Runtime-Ausführung. Kandidaten werden blockiert, wenn der Einstiegspunkt den Plugin-Root verlässt, der Pfad für alle beschreibbar ist oder die Pfad-Ownership bei nicht gebündelten Plugins verdächtig wirkt.

### Manifest-first-Verhalten

Das Manifest ist die Source of Truth der Steuerungsebene. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschemata oder Bundle-Capabilities zu ermitteln
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Datenebenen-Teil. Es registriert tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Steuerungsebene. Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung; sie ersetzen keine Runtime-Registrierung, `register(...)` oder `setupEntry`. Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern, um das Laden von Plugins vor breiterer Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen
- Gateway-Startplanung verwendet `activation.onStartup` für explizite Start-Imports
  und Start-Opt-outs; Plugins ohne Startmetadaten werden nur über engere
  Aktivierungsauslöser geladen

Der Aktivierungsplaner stellt sowohl eine reine ID-API für bestehende Aufrufer als auch eine Plan-API für neue Diagnosen bereit. Planeinträge geben an, warum ein Plugin ausgewählt wurde, und trennen explizite `activation.*`-Planerhinweise von Manifest-Ownership-Fallbacks wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze: Bestehende Plugin-Metadaten funktionieren weiterhin, während neuer Code breite Hinweise oder Fallback-Verhalten erkennen kann, ohne die Runtime-Ladesemantik zu ändern.

Die Setup-Erkennung bevorzugt jetzt deskriptor-eigene IDs wie `setup.providers` und `setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf `setup-api` für Plugins zurückfällt, die weiterhin Setup-Zeit-Runtime-Hooks benötigen. Provider-Setup-Listen verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete Setup-Auswahlen und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden. Explizites `setup.requiresRuntime: false` ist ein rein deskriptorbasierter Stopp; ein ausgelassenes `requiresRuntime` behält aus Kompatibilitätsgründen den Legacy-`setup-api`-Fallback bei. Wenn mehr als ein erkanntes Plugin denselben normalisierten Setup-Provider oder dieselbe CLI-Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Owner, statt sich auf die Erkennungsreihenfolge zu verlassen. Wenn die Setup-Runtime ausgeführt wird, melden Registry-Diagnosen Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-Backends, die von setup-api registriert wurden, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert Ergebnisse der Plugin-Erkennung oder direkte Manifest-Registry-Daten nicht hinter Wall-Clock-Fenstern zwischen. Installationen, Manifeständerungen und Änderungen an Ladepfaden müssen beim nächsten expliziten Lesen von Metadaten oder Neuaufbau eines Snapshots sichtbar werden. Der Manifest-Dateiparser darf einen begrenzten Dateisignatur-Cache behalten, der nach geöffnetem Manifestpfad, Inode, Größe und Zeitstempeln geschlüsselt ist; dieser Cache vermeidet nur das erneute Parsen unveränderter Bytes und darf keine Erkennungs-, Registry-, Owner- oder Policy-Antworten zwischenspeichern.

Der sichere schnelle Metadatenpfad ist explizite Objekt-Ownership, kein versteckter Cache. Heiße Gateway-Startpfade sollten den aktuellen `PluginMetadataSnapshot`, die abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die Aufrufkette reichen. Konfigurationsvalidierung, automatische Startaktivierung, Plugin-Bootstrap und Provider-Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und das aktuelle Plugin-Inventar repräsentieren. Die Setup-Suche rekonstruiert Manifestmetadaten weiterhin bei Bedarf, sofern der spezifische Setup-Pfad keine explizite Manifest-Registry erhält; behalten Sie dies als Cold-Path-Fallback bei, statt versteckte Lookup-Caches hinzuzufügen. Wenn sich die Eingabe ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder historische Kopien zu behalten.
Ansichten über die aktive Plugin-Registry und gebündelte Kanal-Bootstrap-Helfer sollten aus der aktuellen Registry/dem aktuellen Root neu berechnet werden. Kurzlebige Maps sind innerhalb eines Aufrufs in Ordnung, um Arbeit zu deduplizieren oder Wiedereintritt abzusichern; sie dürfen nicht zu Prozess-Metadaten-Caches werden.

Beim Laden von Plugins ist die persistente Cache-Schicht das Runtime-Laden. Sie darf Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, etwa:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- Jiti-/Modul-Caches und Public-Surface-Loader-Caches, die verwendet werden, um dieselbe Runtime-Oberfläche nicht wiederholt zu importieren
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Auflösung von Duplikaten

Diese Caches sind Implementierungsdetails der Datenebene. Sie dürfen keine Fragen der Steuerungsebene beantworten, etwa „welches Plugin besitzt diesen Provider?“, sofern der Aufrufer nicht ausdrücklich Runtime-Laden angefordert hat.

Fügen Sie keine persistenten oder Wall-Clock-Caches hinzu für:

- Erkennungsergebnisse
- direkte Manifest-Registries
- Manifest-Registries, die aus dem installierten Plugin-Index rekonstruiert werden
- Provider-Owner-Lookup, Modellunterdrückung, Provider-Policy oder Public-Artifact-
  Metadaten
- jede andere manifestabgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index
  oder ein Ladepfad beim nächsten Lesen von Metadaten sichtbar sein sollte

Aufrufer, die Manifestmetadaten aus dem persistierten installierten Plugin-Index neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist dauerhafter Source-Plane-Zustand; er ist kein versteckter In-Process-Metadaten-Cache.

## Registry-Modell

Geladene Plugins mutieren keine beliebigen Core-Globals direkt. Sie registrieren sich in einer zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- Plugin-eigene Befehle

Core-Funktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Runtime -> Registry-Nutzung

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversationsbindungen

Plugins, die eine Konversation binden, können reagieren, wenn eine Freigabe aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um nach Genehmigung oder Ablehnung einer Bindungsanfrage einen Callback zu erhalten:

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
- `request`: die ursprüngliche Anfragezusammenfassung, der Detach-Hinweis, die Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine Konversation binden darf, und er läuft, nachdem die Core-Freigabebehandlung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifestmetadaten** für günstiges Pre-Runtime-Lookup:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Konfigurationszeit-Hooks**: `catalog` (Legacy-`discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: über 40 optionale Hooks, die Auth, Modellauflösung,
  Stream-Wrapping, Thinking-Level, Replay-Policy und Usage-Endpunkte abdecken. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptbehandlung und Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne einen vollständig eigenen Inference-Transport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider umgebungsbasierte Anmeldedaten hat, die generische Auth-/Status-/Modellauswahlpfade sehen sollten, ohne die Plugin-Runtime zu laden. Das veraltete `providerAuthEnvVars` wird während des Deprecation-Fensters weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins, die es verwenden, erhalten eine Manifestdiagnose. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die Env Vars, Auth-Profile, konfigurationsgestützte Auth und API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn Onboarding-/Auth-Auswahl-CLI-Oberflächen die Auswahl-ID, Gruppenlabels und einfache Ein-Flag-Auth-Verkabelung des Providers kennen sollten, ohne die Provider-Runtime zu laden. Behalten Sie Runtime-`envVars` des Providers für operator-facing Hinweise wie Onboarding-Labels oder OAuth-Client-ID-/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal umgebungsgetriebene Auth oder Einrichtung hat, die generische Shell-Env-Fallbacks, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollten, ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Verwendung“ ist die schnelle Entscheidungshilfe.
Nur kompatibilitätsbezogene Provider-Felder, die OpenClaw nicht mehr aufruft, wie
`ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht aufgeführt.

| #   | Hook                              | Was er tut                                                                                                    | Wann verwenden                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der `models.json`-Generierung in `models.providers` veröffentlichen            | Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                                |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden       | Standardwerte hängen vom Authentifizierungsmodus, von der Umgebung oder von der Modellfamiliensemantik des Providers ab                           |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                   | _(kein Plugin-Hook)_                                                                                                                              |
| 3   | `normalizeModelId`                | Legacy- oder Preview-Modell-ID-Aliase vor der Suche normalisieren                                             | Provider ist für die Alias-Bereinigung vor der kanonischen Modellauflösung zuständig                                                              |
| 4   | `normalizeTransport`              | Provider-Familien-`api` / `baseUrl` vor der generischen Modellassemblierung normalisieren                     | Provider ist für die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie zuständig                            |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung normalisieren                                    | Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Hilfsfunktionen sichern auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitätsumschreibungen auf Konfigurations-Provider anwenden                    | Provider benötigt endpunktgesteuerte Korrekturen für native Streaming-Usage-Metadaten                                                             |
| 7   | `resolveConfigApiKey`             | Env-Marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Laufzeit-Authentifizierung auflösen | Provider hat Provider-eigene Env-Marker-API-Key-Auflösung; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver          |
| 8   | `resolveSyntheticAuth`            | Lokale/self-hosted oder konfigurationsgestützte Authentifizierung verfügbar machen, ohne Klartext zu persistieren | Provider kann mit einem synthetischen/lokalen Anmeldeinformationsmarker arbeiten                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Authentifizierungsprofile überlagern; Standardwert für `persistence` ist `runtime-only` für CLI-/App-eigene Anmeldeinformationen | Provider verwendet externe Authentifizierungsdaten wieder, ohne kopierte Refresh-Tokens zu persistieren; `contracts.externalAuthProviders` im Manifest deklarieren |
| 10  | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profilplatzhalter hinter env-/konfigurationsgestützte Authentifizierung herabstufen | Provider speichert synthetische Platzhalterprofile, die keinen Vorrang erhalten sollten                                                           |
| 11  | `resolveDynamicModel`             | Synchrone Fallback-Auflösung für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind      | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrones Aufwärmen, danach wird `resolveDynamicModel` erneut ausgeführt                                    | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                        |
| 13  | `normalizeResolvedModel`          | Finale Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                            | Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                                         |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beisteuern                | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                            |
| 15  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                           | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                     |
| 16  | `inspectToolSchemas`              | Provider-eigene Schemadiagnosen nach der Normalisierung anzeigen                                             | Provider möchte Keyword-Warnungen, ohne Core Provider-spezifische Regeln beizubringen                                                            |
| 17  | `resolveReasoningOutputMode`      | Native vs. getaggte Reasoning-Output-Verträge auswählen                                                       | Provider benötigt getaggtes Reasoning/finale Ausgabe statt nativer Felder                                                                         |
| 18  | `prepareExtraParams`              | Request-Parameter-Normalisierung vor generischen Stream-Option-Wrappern                                       | Provider benötigt Standard-Request-Parameter oder per-Provider-Parameterbereinigung                                                               |
| 19  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                       | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                 |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                  | Provider benötigt Request-Header-/Body-/Modell-Kompatibilitäts-Wrapper ohne benutzerdefinierten Transport                                        |
| 21  | `resolveTransportTurnState`       | Native Transport-Header oder Metadaten pro Turn anhängen                                                      | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Session-Cool-down-Richtlinie anhängen                                            | Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinie anpassen                                                  |
| 23  | `formatApiKey`                    | Authentifizierungsprofil-Formatter: gespeichertes Profil wird zur Laufzeit-`apiKey`-Zeichenfolge              | Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                              |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinien                | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                        |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Provider benötigt Provider-eigene Anleitung zur Authentifizierungsreparatur nach Refresh-Fehler                                                  |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfensterüberlauf                                                           | Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                                     |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                          | Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                                 |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                          | Provider benötigt Proxy-spezifisches Cache-TTL-Gating                                                                                            |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                           | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                          |
| 30  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Discovery angehängt werden                                    | Provider benötigt synthetische Forward-Kompatibilitätszeilen in `models list` und Auswahllisten                                                  |
| 31  | `resolveThinkingProfile`          | Modellspezifisches `/think`-Level-Set, Anzeigebezeichnungen und Standardwert                                  | Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder binäre Bezeichnung bereit                                   |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für Ein/Aus-Reasoning-Schalter                                                           | Provider bietet nur binäres Thinking Ein/Aus an                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh`-Reasoning-Unterstützungs-Kompatibilitäts-Hook                                                         | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für das Standard-`/think`-Level                                                          | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                          |
| 35  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                           | Provider besitzt bevorzugtes Live-/Smoke-Modell-Matching                                                                                         |
| 36  | `prepareRuntimeAuth`              | Eine konfigurierte Anmeldeinformation unmittelbar vor der Inferenz in das tatsächliche Laufzeit-Token/den tatsächlichen Laufzeit-Key austauschen | Provider benötigt einen Token-Austausch oder kurzlebige Request-Anmeldeinformationen                                                             |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungsanmeldedaten für `/usage` und zugehörige Statusoberflächen auflösen                                     | Provider benötigt benutzerdefinierte Analyse von Nutzungs-/Kontingent-Token oder andere Nutzungsanmeldedaten                                                               |
| 38  | `fetchUsageSnapshot`              | Provider-spezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde                             | Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Payload-Parser                                                                           |
| 39  | `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Speicher/Suche erstellen                                                     | Speicher-Embedding-Verhalten gehört zum Provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptbehandlung für den Provider steuert                                        | Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transkriptbereinigung umschreiben                                                        | Provider benötigt Provider-spezifische Replay-Umschreibungen über gemeinsame Compaction-Hilfsfunktionen hinaus                                                             |
| 42  | `validateReplayTurns`             | Abschließende Replay-Turn-Validierung oder Umformung vor dem eingebetteten Runner                                           | Provider-Transport benötigt nach generischer Bereinigung strengere Turn-Validierung                                                                    |
| 43  | `onModelSelected`                 | Provider-eigene Nebeneffekte nach der Auswahl ausführen                                                                 | Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und fallen dann auf andere Hook-fähige Provider-Plugins
zurück, bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration
ändert. Dadurch funktionieren Alias-/Kompatibilitäts-Provider-Shims, ohne dass
der Aufrufer wissen muss, welches gebündelte Plugin die Umschreibung besitzt.
Wenn kein Provider-Hook einen unterstützten Konfigurationseintrag der Google-Familie
umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer weiterhin
diese Kompatibilitätsbereinigung an.

Wenn der Provider ein vollständig eigenes Wire-Protokoll oder einen eigenen
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks
sind für Provider-Verhalten gedacht, das weiterhin in OpenClaws normaler
Inference-Schleife läuft.

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

Gebündelte Provider-Plugins kombinieren die Hooks oben, um Katalog, Authentifizierung,
Thinking, Replay und Nutzungsanforderungen der jeweiligen Anbieter abzubilden.
Der maßgebliche Hook-Satz liegt bei jedem Plugin unter `extensions/`; diese Seite
veranschaulicht die Formen, statt die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie vorgelagerte
    Modell-IDs vor OpenClaws statischem Katalog verfügbar machen können.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration selbst zu
    besitzen.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Gemeinsam benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern,
    sich über `buildReplayPolicy` für Transkript-Richtlinien zu entscheiden,
    statt dass jedes Plugin die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame
    Inference-Schleife.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-Header, `/fast` / `serviceTier` und `context1m` befinden sich im
    öffentlichen `api.ts`-/`contract-api.ts`-Seam des Anthropic-Plugins
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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider neu sampeln/codieren.
- `listVoices` ist je Provider optional. Verwenden Sie es für vom Anbieter besessene Voice-Picker oder Einrichtungsabläufe.
- Stimmauflistungen können reichhaltigere Metadaten wie Locale, Geschlecht und Persönlichkeits-Tags für Provider-bewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

Plugins können auch Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

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
- Verwenden Sie Sprach-Provider für vom Anbieter besessenes Syntheseverhalten.
- Die Legacy-Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Besitzmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, wenn OpenClaw diese
  Capability-Verträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Medienverständnis-Provider statt einer generischen Key/Value-Bag:

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
- Belassen Sie Anbieter-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Videogenerierung folgt bereits demselben Muster:
  - Core besitzt den Capability-Vertrag und die Runtime-Hilfsfunktion
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins konsumieren `api.runtime.videoGeneration.*`

Für Medienverständnis-Runtime-Hilfsfunktionen können Plugins Folgendes aufrufen:

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

Für Audiotranskription können Plugins entweder die Medienverständnis-Runtime
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
- Verwendet die Core-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können über `api.runtime.subagent` auch Hintergrund-Subagent-Läufe starten:

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
- OpenClaw beachtet diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für Plugin-besessene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Nicht vertrauenswürdige Plugin-Subagent-Läufe funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der erstellenden Plugin-ID markiert. Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebiges Löschen von Sitzungen erfordert weiterhin eine admin-begrenzte Gateway-Anfrage.

Für Websuche können Plugins die gemeinsame Runtime-Hilfsfunktion konsumieren, statt
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

Plugins können auch Websuch-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Belassen Sie Provider-Auswahl, Anmeldedatenauflösung und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuch-Provider für anbieterspezifische Suchtransporte.
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

- `generate(...)`: Generiert ein Bild mit der konfigurierten Kette von Bildgenerierungs-Providern.
- `listProviders(...)`: Listet verfügbare Bildgenerierungs-Provider und deren Capabilities auf.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte mit `api.registerHttpRoute(...)` verfügbar machen.

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
- `auth`: Erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für Plugin-verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: Optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: Optional. Ermöglicht demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: Geben Sie `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte `path + match`-Konflikte werden abgelehnt, außer `replaceExisting: true` ist gesetzt, und ein Plugin kann die Route eines anderen Plugin nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`/`prefix`-Fallthrough-Ketten nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten Operator-Runtime-Scopes **nicht** automatisch. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Runtime-Scope, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes für Plugin-Routen auf `operator.write` fixiert, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätstragenden Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Gateway-authentifizierte Plugin-Route eine implizite Admin-Oberfläche ist. Wenn Ihre Route admin-only Verhalten benötigt, verlangen Sie einen identitätstragenden Auth-Modus und dokumentieren Sie den expliziten `x-openclaw-scopes`-Header-Vertrag.

## Plugin-SDK-Importpfade

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade statt des monolithischen Root-Barrels `openclaw/plugin-sdk`. Core-Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung            |
| `openclaw/plugin-sdk/channel-core`  | Hilfsfunktionen für Channel-Einträge/Builds        |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfsfunktionen und Umbrella-Vertrag |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Approval-Verhalten sollte in einem
einzigen `approvalCapability`-Vertrag konsolidiert werden, statt über
unzusammenhängende Plugin-Felder gemischt zu werden. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Config-Hilfsfunktionen befinden sich unter passenden fokussierten
`*-runtime`-Unterpfaden (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` usw.). Bevorzugen Sie `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation`
anstelle des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro Root eines gebündelten Plugin-Pakets):

- `index.js` — Einstieg des gebündelten Plugin
- `api.js` — Hilfsfunktionen-/Typen-Barrel
- `runtime-api.js` — Runtime-only Barrel
- `setup-entry.js` — Einstieg des Setup-Plugin

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals `src/*` eines anderen Plugin-Pakets aus Core oder aus einem anderen Plugin.
Über Facade geladene Einstiegspunkte bevorzugen den aktiven Runtime-Config-Snapshot, wenn einer
existiert, und fallen dann auf die aufgelöste Config-Datei auf der Festplatte zurück.

Capability-spezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind
nicht automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-Referenzseite,
wenn Sie sich auf sie verlassen.

## Schemata für Message-Tools

Plugins sollten channel-spezifische `describeMessageTool(...)`-Schema-Beiträge
für Nicht-Nachrichten-Primitive wie Reaktionen, Lesebestätigungen und Umfragen besitzen.
Gemeinsame Send-Präsentation sollte den generischen `MessagePresentation`-Vertrag
anstelle von Provider-nativen Button-, Komponenten-, Block- oder Card-Feldern verwenden.
Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Mapping und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichten-Capabilities, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zur angepinnten Zustellung

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine Provider-nativen UI-Auswege aus dem generischen Message-Tool bereit.
Veraltete SDK-Hilfsfunktionen für alte native Schemata bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Directory-Suche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt zur ID-artigen Auflösung springen soll, statt die Directory-Suche zu verwenden.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Directory-Fehlschlag eine finale Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Provider-spezifische Konstruktion der Session-Route,
  sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor dem
  Durchsuchen von Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen auf "dies als explizite/native Ziel-ID behandeln".
- Verwenden Sie `resolveTarget` für Provider-spezifische Normalisierungs-Fallbacks, nicht für
  breite Directory-Suche.
- Halten Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  in `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-Feldern.

## Config-gestützte Directories

Plugins, die Directory-Einträge aus Config ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel Config-gestützte Peers/Gruppen benötigt, zum Beispiel:

- allowlist-gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- Account-bezogene statische Directory-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` behandeln nur generische Operationen:

- Abfragefilterung
- Limit-Anwendung
- Hilfsfunktionen für Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Channel-spezifische Account-Inspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Struktur zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Standardwerte für Basis-URLs
oder auth-geschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugin relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreinbare Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf davon ausgehen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Read-only Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Config-Reparaturflüsse
  sollten keine Runtime-Zugangsdaten materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur beschreibenden Account-Zustand zurück.
- Bewahren Sie `enabled` und `configured`.
- Fügen Sie bei Relevanz Felder für Quelle/Status von Zugangsdaten hinzu, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um read-only
  Verfügbarkeit zu melden. `tokenStatus: "available"` zurückzugeben (und das passende Quellfeld)
  reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn Zugangsdaten über SecretRef konfiguriert,
  aber im aktuellen Befehlspfad nicht verfügbar sind.

So können read-only Befehle "konfiguriert, aber in diesem Befehlspfad nicht verfügbar"
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert auszuweisen.

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

Jeder Eintrag wird zu einem Plugin. Wenn der Pack mehrere extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Security-Guardrail: Jeder `openclaw.extensions`-Eintrag muss nach der Symlink-Auflösung innerhalb des Plugin-Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Dev-Abhängigkeiten zur Runtime) und ignoriert geerbte globale npm-Installationseinstellungen.
Halten Sie Plugin-Abhängigkeitsbäume "reines JS/TS" und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges setup-only Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Eintrags. Das hält Startup und Setup leichter,
wenn Ihr Haupteintrag des Plugin auch Tools, Hooks oder anderen runtime-only
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin während der Pre-Listen-Startup-Phase des Gateway in denselben
`setupEntry`-Pfad optieren lassen, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche, die vor dem
Start des Listening des Gateway existieren muss, vollständig abdeckt. In der Praxis bedeutet das, dass der Setup-Eintrag
jede channel-eigene Capability registrieren muss, von der der Startup abhängt, zum Beispiel:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway mit dem Listening beginnt
- alle Gateway-Methoden, Tools oder Dienste, die im selben Zeitfenster existieren müssen

Wenn Ihr vollständiger Eintrag weiterhin eine erforderliche Startup-Capability besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie für das Plugin das Standardverhalten bei und lassen Sie OpenClaw den
vollständigen Eintrag während des Startup laden.

Gebündelte Channels können außerdem setup-only Hilfsfunktionen für Vertragsoberflächen veröffentlichen, die Core
konsultieren kann, bevor die vollständige Channel-Runtime geladen ist. Die aktuelle Setup-Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Oberfläche, wenn eine Legacy-Kanalkonfiguration für ein
einzelnes Konto in `channels.<id>.accounts.*` hochgestuft werden muss, ohne den
vollständigen Plugin-Eintrag zu laden. Matrix ist das aktuelle gebündelte
Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein benanntes
hochgestuftes Konto, wenn benannte Konten bereits existieren, und kann einen
konfigurierten nicht-kanonischen Standardkonto-Schlüssel beibehalten, statt
immer `accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Erkennung der gebündelten Vertragsoberfläche
lazy. Die Importzeit bleibt gering; die Hochstufungsoberfläche wird erst bei der
ersten Verwendung geladen, statt beim Modulimport den Start gebündelter Kanäle
erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halten Sie sie unter
einem Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope
anfordert.

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

### Katalogmetadaten für Kanäle

Kanal-Plugins können Setup-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` veröffentlichen. Dadurch bleiben
die Core-Katalogdaten datenfrei.

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

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Kopiesteuerungen für Auswahloberflächen
- `markdownCapable`: markiert den Kanal für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig
- `exposure.configured`: Kanal aus Oberflächen zur Auflistung konfigurierter Kanäle ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: Kanal aus interaktiven Setup-/Konfigurationsauswahlen ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: Kanal für Dokumentationsnavigationsoberflächen als intern/privat markieren
- `showConfigured` / `showInSetup`: Legacy-Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: den Kanal für den standardmäßigen Quickstart-`allowFrom`-Ablauf aktivieren
- `forceAccountBinding`: explizite Kontobindung verlangen, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: Session-Lookup beim Auflösen von Ankündigungszielen bevorzugen

OpenClaw kann auch **externe Kanalkataloge** zusammenführen (zum Beispiel einen
MPM-Registry-Export). Legen Sie eine JSON-Datei an einem dieser Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Kommas/Semikolons/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

Generierte Kanalkatalogeinträge und Provider-Installationskatalogeinträge stellen
normalisierte Installationsquellen-Fakten neben dem rohen `openclaw.install`-Block
bereit. Die normalisierten Fakten identifizieren, ob die npm-Spezifikation eine
exakte Version oder ein schwebender Selektor ist, ob erwartete Integritätsmetadaten
vorhanden sind und ob auch ein lokaler Quellpfad verfügbar ist. Wenn die
Katalog-/Paketidentität bekannt ist, warnen die normalisierten Fakten, falls der
geparste npm-Paketname von dieser Identität abweicht. Sie warnen außerdem, wenn
`defaultChoice` ungültig ist oder auf eine Quelle verweist, die nicht verfügbar
ist, sowie wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind.
Consumer sollten `installSource` als additives optionales Feld behandeln, damit
von Hand erstellte Einträge und Katalog-Shims es nicht synthetisieren müssen.
Dadurch können Onboarding und Diagnosen den Zustand der Source-Plane erklären,
ohne Plugin-Runtime zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, zeigen aber Source-Plane-Warnungen an, damit sich
der Katalog in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann,
ohne bestehende Plugins zu beschädigen. Wenn Onboarding aus einem lokalen Katalogpfad
installiert, zeichnet es einen verwalteten Plugin-Plugin-Indexeintrag mit
`source: "path"` und, wenn möglich, einem Workspace-relativen `sourcePath` auf.
Der absolute operative Ladepfad bleibt in `plugins.load.paths`; der Installationsdatensatz
vermeidet es, lokale Workstation-Pfade in langfristige Konfiguration zu duplizieren.
So bleiben lokale Entwicklungsinstallationen für Source-Plane-Diagnosen sichtbar,
ohne eine zweite Oberfläche zur Offenlegung roher Dateisystempfade hinzuzufügen.
Der persistierte Plugin-Index `plugins/installs.json` ist die maßgebliche
Installationsquelle und kann aktualisiert werden, ohne Plugin-Runtime-Module zu laden.
Seine `installRecords`-Map ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder
ungültig ist; sein `plugins`-Array ist eine neu aufbaubare Manifestansicht.

## Kontext-Engine-Plugins

Kontext-Engine-Plugins besitzen die Orchestrierung des Sitzungskontexts für
Ingest, Zusammenstellung und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)`, und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder
erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

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

Die Factory `ctx` stellt optionale Werte für `config`, `agentDir` und `workspaceDir`
für die Initialisierung zur Konstruktionszeit bereit.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()`
implementiert und delegieren Sie explizit:

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

## Neue Capability hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen
Sie das Plugin-System nicht mit einem privaten Zugriff nach innen. Fügen Sie die
fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten Core besitzen sollte: Policy, Fallback, Konfigurationszusammenführung,
   Lifecycle, kanalbezogene Semantik und Form der Runtime-Helfer.
2. typisierte Plugin-Registrierungs-/Runtime-Oberflächen hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. Core und Kanal-/Feature-Consumer verdrahten
   Kanäle und Feature-Plugins sollten die neue Capability über Core konsumieren,
   nicht indem sie direkt eine Vendor-Implementierung importieren.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends gegen die Capability.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Besitz und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf die Weltsicht eines einzelnen
Providers festcodiert zu werden. Eine konkrete Datei-Checkliste und ein
ausgearbeitetes Beispiel finden Sie im [Capability-Cookbook](/de/plugins/architecture).

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner-/Runtime-Helfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Runtime-Exponierung in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie konsumieren müssen
- Capture-/Testhelfer in `src/test-utils/plugin-registration.ts`
- Besitz-/Vertrags-Assertions in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das in der Regel ein Zeichen dafür, dass
die Capability noch nicht vollständig integriert ist.

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

Vertragstestmuster:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- Core besitzt den Capability-Vertrag und die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Kanal-Plugins konsumieren Runtime-Helfer
- Vertragstests halten den Besitz explizit

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Subpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins bauen](/de/plugins/building-plugins)
