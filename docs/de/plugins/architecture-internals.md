---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Channel-Lifecycle oder Paket-Packs
    - Debuggen der Plugin-Ladereihenfolge oder des Registry-Zustands
    - Eine neue Plugin-Fähigkeit oder ein Kontext-Engine-Plugin hinzufügen
summary: 'Interna der Plugin-Architektur: Lade-Pipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-05-02T20:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Für das öffentliche Funktionsmodell, Plugin-Formen und Eigentums-/Ausführungs-
verträge siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die
Referenz für die internen Mechanismen: Lade-Pipeline, Registry, Runtime-Hooks,
Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start macht OpenClaw ungefähr Folgendes:

1. Kandidaten für Plugin-Roots entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   lokale Drittanbieter-Quelltexte in TypeScript verwenden den Notfall-Fallback Jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen verfügbar machen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten
werden blockiert, wenn der Einstieg den Plugin-Root verlässt, der Pfad für alle
beschreibbar ist oder die Pfad-Eigentümerschaft bei nicht gebündelten Plugins
verdächtig wirkt.

### Manifest-first-Verhalten

Das Manifest ist die Control-Plane-Quelle der Wahrheit. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Funktionen zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren ohne Laden der Plugin-Runtime zu bewahren

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale Manifestblöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen weder Runtime-Registrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen,
Kanälen und Providern, um das Laden von Plugins vor einer breiteren
Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte
  Kanal-ID gehört
- explizite Provider-Setup/Runtime-Auflösung wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört
- Gateway-Startplanung verwendet `activation.onStartup` für explizite Start-Imports
  und Start-Opt-outs; Plugins ohne Startmetadaten werden nur über engere
  Aktivierungs-Trigger geladen

Runtime-Preloads zur Anfragezeit, die den breiten Scope `all` anfordern, leiten
weiterhin eine explizite effektive Plugin-ID-Menge aus Konfiguration, Startplanung,
konfigurierten Kanälen, Slots und Auto-Enable-Regeln ab. Wenn diese abgeleitete
Menge leer ist, lädt OpenClaw eine leere Runtime-Registry, statt auf jedes
entdeckbare Plugin auszuweiten.

Der Aktivierungsplaner stellt sowohl eine Nur-IDs-API für bestehende Aufrufer als
auch eine Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein
Plugin ausgewählt wurde, und trennen explizite `activation.*`-Planerhinweise von
Manifest-Eigentümerschafts-Fallbacks wie `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` und Hooks. Diese Trennung der Gründe ist die
Kompatibilitätsgrenze: Bestehende Plugin-Metadaten funktionieren weiter, während
neuer Code breite Hinweise oder Fallback-Verhalten erkennen kann, ohne die
Semantik des Runtime-Ladens zu ändern.

Setup-Erkennung bevorzugt jetzt deskriptoreigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf `setup-api`
für Plugins zurückfällt, die weiterhin Runtime-Hooks zur Setup-Zeit benötigen.
Provider-Setup-Listen verwenden Manifest-`providerAuthChoices`, aus Deskriptoren
abgeleitete Setup-Auswahlen und Installationskatalog-Metadaten, ohne die
Provider-Runtime zu laden. Explizites `setup.requiresRuntime: false` ist eine
nur auf Deskriptoren bezogene Abschneidegrenze; ausgelassenes `requiresRuntime`
behält aus Kompatibilitätsgründen den Legacy-`setup-api`-Fallback bei. Wenn mehr
als ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder
CLI-Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Besitzer,
statt sich auf die Entdeckungsreihenfolge zu verlassen. Wenn Setup-Runtime
ausgeführt wird, melden Registry-Diagnosen Abweichungen zwischen
`setup.providers` / `setup.cliBackends` und den von setup-api registrierten
Providern oder CLI-Backends, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw cached Plugin-Discovery-Ergebnisse oder direkte Manifest-Registry-Daten
nicht hinter Zeitfenstern nach Wanduhrzeit. Installationen, Manifeständerungen
und Änderungen an Ladepfaden müssen beim nächsten expliziten Metadaten-Lesevorgang
oder Snapshot-Neuaufbau sichtbar werden. Der Manifestdatei-Parser darf einen
begrenzten Datei-Signatur-Cache behalten, der nach geöffnetem Manifestpfad, Inode,
Größe und Zeitstempeln geschlüsselt ist; dieser Cache vermeidet nur das erneute
Parsen unveränderter Bytes und darf Discovery-, Registry-, Besitzer- oder
Policy-Antworten nicht cachen.

Der sichere schnelle Metadatenpfad ist explizite Objekt-Eigentümerschaft, kein
versteckter Cache. Gateway-Start-Hotpaths sollten den aktuellen
`PluginMetadataSnapshot`, die abgeleitete `PluginLookUpTable` oder eine explizite
Manifest-Registry durch die Aufrufkette reichen. Konfigurationsvalidierung,
Start-Auto-Enable, Plugin-Bootstrap und Provider-Auswahl können diese Objekte
wiederverwenden, solange sie die aktuelle Konfiguration und das aktuelle
Plugin-Inventar repräsentieren. Die Setup-Suche rekonstruiert Manifestmetadaten
weiterhin bei Bedarf, sofern der konkrete Setup-Pfad keine explizite
Manifest-Registry erhält; behalten Sie dies als Cold-Path-Fallback bei, statt
versteckte Such-Caches hinzuzufügen. Wenn sich die Eingabe ändert, bauen Sie den
Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder historische
Kopien zu behalten.
Sichten über die aktive Plugin-Registry und gebündelte Kanal-Bootstrap-Hilfen
sollten aus der aktuellen Registry/dem aktuellen Root neu berechnet werden.
Kurzlebige Maps sind innerhalb eines Aufrufs in Ordnung, um Arbeit zu
deduplizieren oder Wiedereintritt abzusichern; sie dürfen nicht zu
Prozess-Metadaten-Caches werden.

Für das Laden von Plugins ist die persistente Cache-Schicht das Runtime-Laden.
Sie darf Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte
tatsächlich geladen werden, zum Beispiel:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- jiti-/Modul-Caches und Loader-Caches für öffentliche Oberflächen, die verwendet werden,
  um denselben Runtime-Surface nicht wiederholt zu importieren
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Implementierungsdetails der Data Plane. Sie dürfen keine
Control-Plane-Fragen beantworten, etwa „welchem Plugin gehört dieser Provider?“,
es sei denn, der Aufrufer hat bewusst Runtime-Laden angefordert.

Fügen Sie keine persistenten oder wanduhrzeitbasierten Caches hinzu für:

- Discovery-Ergebnisse
- direkte Manifest-Registries
- Manifest-Registries, die aus dem installierten Plugin-Index rekonstruiert werden
- Provider-Besitzersuche, Modellunterdrückung, Provider-Policy oder Metadaten
  öffentlicher Artefakte
- jede andere aus dem Manifest abgeleitete Antwort, bei der ein geändertes Manifest,
  ein installierter Index oder ein Ladepfad beim nächsten Metadaten-Lesen sichtbar sein sollte

Aufrufer, die Manifestmetadaten aus dem persistenten installierten Plugin-Index
neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist
dauerhafter Source-Plane-Zustand; er ist kein versteckter prozessinterner
Metadaten-Cache.

## Registry-Modell

Geladene Plugins mutieren nicht direkt beliebige Core-Globals. Sie registrieren
sich in einer zentralen Plugin-Registry.

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
- Plugin-eigene Befehle

Core-Funktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Runtime -> Registry-Nutzung

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten
Core-Oberflächen nur einen Integrationspunkt benötigen: „die Registry lesen“,
nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung
aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu
erhalten, nachdem eine Bindungsanfrage genehmigt oder abgelehnt wurde:

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

Callback-Nutzlastfelder:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, der Ablösehinweis, die Absender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er läuft, nachdem die Core-Genehmigungsverarbeitung
abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifestmetadaten** für günstige Pre-Runtime-Suche:
  `setup.providers[].envVars`, veraltete Kompatibilitätsoption `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (Legacy-`discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: über 40 optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Wrapping, Denkstufen, Replay-Policy und Nutzungsendpunkte. Siehe
  vollständige Liste unter [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover,
Transkriptverarbeitung und Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche
für providerspezifisches Verhalten, ohne einen vollständig eigenen
Inference-Transport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider
env-basierte Zugangsdaten hat, die generische Authentifizierungs-/Status-/
Modellauswahlpfade ohne Laden der Plugin-Runtime sehen sollten. Das veraltete
`providerAuthEnvVars` wird während des Deprecation-Fensters weiterhin vom
Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins, die es verwenden,
erhalten eine Manifestdiagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die env vars, Auth-Profile, konfigurationsgestützte
Authentifizierung und API-Key-Onboarding-Auswahl einer anderen Provider-ID
wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
Onboarding-/Auth-Auswahl-CLI-Oberflächen die Auswahl-ID, Gruppenlabels und
einfache Ein-Flag-Auth-Verdrahtung des Providers kennen sollten, ohne die
Provider-Runtime zu laden. Behalten Sie Provider-Runtime-`envVars` für
operatorseitige Hinweise wie Onboarding-Labels oder Setup-Variablen für
OAuth-Client-ID/Client-Secret.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte
Authentifizierung oder Einrichtung hat, die generischer Shell-env-Fallback,
Konfigurations-/Statusprüfungen oder Setup-Prompts ohne Laden der Kanal-Runtime
sehen sollten.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge
auf.
Die Spalte „Wann verwenden“ ist der schnelle Entscheidungsleitfaden.
Nur kompatibilitätsbezogene Provider-Felder, die OpenClaw nicht mehr aufruft,
wie `ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier bewusst
nicht aufgeführt.

| #   | Erweiterungspunkt                 | Was er tut                                                                                                                | Wann verwenden                                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der `models.json`-Generierung in `models.providers` veröffentlichen                        | Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                                               |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden                   | Standardwerte hängen von Auth-Modus, Umgebung oder Provider-Modellfamilien-Semantik ab                                                                            |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                               | _(kein Plugin-Hook)_                                                                                                                                              |
| 3   | `normalizeModelId`                | Legacy- oder Preview-Model-ID-Aliase vor der Suche normalisieren                                                          | Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                                            |
| 4   | `normalizeTransport`              | Provider-Familien-`api` / `baseUrl` vor der generischen Modellassemblierung normalisieren                                 | Provider besitzt Transportbereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                                           |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Runtime-/Provider-Auflösung normalisieren                                                     | Provider benötigt Konfigurationsbereinigung, die beim Plugin leben sollte; gebündelte Google-Familien-Helfer sichern außerdem unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitätsumschreibungen auf Konfigurations-Provider anwenden                                 | Provider benötigt endpointgesteuerte Korrekturen nativer Streaming-Usage-Metadaten                                                                                |
| 7   | `resolveConfigApiKey`             | Auth per Env-Marker für Konfigurations-Provider vor dem Laden der Runtime-Auth auflösen                                   | Provider hat Provider-eigene Env-Marker-API-Key-Auflösung; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver                         |
| 8   | `resolveSyntheticAuth`            | Lokale/selbstgehostete oder konfigurationsgestützte Auth verfügbar machen, ohne Klartext dauerhaft zu speichern           | Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Auth-Profile überlagern; Standard-`persistence` ist `runtime-only` für CLI-/App-eigene Zugangsdaten | Provider verwendet externe Auth-Zugangsdaten erneut, ohne kopierte Refresh-Tokens dauerhaft zu speichern; `contracts.externalAuthProviders` im Manifest deklarieren |
| 10  | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profilplatzhalter hinter env-/konfigurationsgestützte Auth zurückstufen                         | Provider speichert synthetische Platzhalterprofile, die keine Vorrangstellung erhalten sollten                                                                    |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind                           | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, dann wird `resolveDynamicModel` erneut ausgeführt                                                     | Provider benötigt Netzwerkmetadaten vor dem Auflösen unbekannter IDs                                                                                              |
| 13  | `normalizeResolvedModel`          | Finale Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                                        | Provider benötigt Transportumschreibungen, verwendet aber weiterhin einen Core-Transport                                                                          |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitätsflags für Vendor-Modelle hinter einem anderen kompatiblen Transport beisteuern                             | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                                            |
| 15  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                                       | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                                     |
| 16  | `inspectToolSchemas`              | Provider-eigene Schemadiagnosen nach der Normalisierung anzeigen                                                          | Provider möchte Keyword-Warnungen, ohne dem Core Provider-spezifische Regeln beizubringen                                                                         |
| 17  | `resolveReasoningOutputMode`      | Nativen vs. getaggten Reasoning-Output-Vertrag auswählen                                                                  | Provider benötigt getaggtes Reasoning/finale Ausgabe statt nativer Felder                                                                                         |
| 18  | `prepareExtraParams`              | Request-Parameter-Normalisierung vor generischen Stream-Options-Wrappern                                                  | Provider benötigt Standard-Request-Parameter oder Provider-spezifische Parameterbereinigung                                                                       |
| 19  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                                    | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                                 |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                              | Provider benötigt Request-Header-/Body-/Modell-Kompatibilitätswrapper ohne benutzerdefinierten Transport                                                          |
| 21  | `resolveTransportTurnState`       | Native Transport-Header oder Metadaten pro Turn anhängen                                                                  | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Sitzungs-Cool-down-Richtlinie anhängen                                                       | Provider möchte, dass generische WS-Transporte Sitzungsheader oder Fallback-Richtlinie anpassen                                                                   |
| 23  | `formatApiKey`                    | Auth-Profil-Formatter: gespeichertes Profil wird zur Runtime-`apiKey`-Zeichenfolge                                        | Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                                              |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinie                             | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                                        |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                                      | Provider benötigt Provider-eigene Auth-Reparaturanleitung nach Refresh-Fehler                                                                                    |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfenster-Überlauf                                                                      | Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                                                     |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                                      | Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                                                 |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                                      | Provider benötigt Proxy-spezifisches Cache-TTL-Gating                                                                                                            |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Auth                                                    | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Auth                                                                        |
| 30  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                                | Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahllisten                                                                          |
| 31  | `resolveThinkingProfile`          | Modellspezifisches `/think`-Level-Set, Anzeigelabels und Standardwert                                                    | Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder ein binäres Label bereit                                                    |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für Ein/Aus-Reasoning-Umschalter                                                                     | Provider stellt nur binäres Thinking ein/aus bereit                                                                                                              |
| 33  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                                  | Provider möchte `xhigh` nur für eine Teilmenge der Modelle                                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für Standard-`/think`-Level                                                                          | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                                         |
| 35  | `isModernModelRef`                | Modern-Modell-Matcher für Live-Profilfilter und Smoke-Auswahl                                                             | Provider besitzt bevorzugtes Live-/Smoke-Modell-Matching                                                                                                         |
| 36  | `prepareRuntimeAuth`              | Ein konfiguriertes Credential direkt vor der Inferenz in das tatsächliche Runtime-Token/den tatsächlichen Runtime-Schlüssel umtauschen | Provider benötigt einen Token-Austausch oder ein kurzlebiges Request-Credential                                                                                   |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungszugangsdaten für `/usage` und zugehörige Statusoberflächen auflösen                                     | Provider benötigt eine benutzerdefinierte Analyse von Nutzungs-/Kontingent-Tokens oder andere Nutzungszugangsdaten                                                               |
| 38  | `fetchUsageSnapshot`              | Providerspezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde                             | Provider benötigt einen providerspezifischen Nutzungs-Endpunkt oder Payload-Parser                                                                           |
| 39  | `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Speicher/Suche erstellen                                                     | Das Verhalten von Speicher-Embeddings gehört zum Provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptverarbeitung für den Provider steuert                                        | Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (zum Beispiel das Entfernen von Denkblöcken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach der generischen Transkriptbereinigung umschreiben                                                        | Provider benötigt providerspezifische Replay-Umschreibungen über gemeinsame Compaction-Helfer hinaus                                                             |
| 42  | `validateReplayTurns`             | Abschließende Replay-Turn-Validierung oder Umformung vor dem eingebetteten Runner                                           | Provider-Transport benötigt nach der generischen Bereinigung eine strengere Turn-Validierung                                                                    |
| 43  | `onModelSelected`                 | Provider-eigene Nebenwirkungen nach der Auswahl ausführen                                                                 | Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und fallen dann durch andere hook-fähige Provider-Plugins
zurück, bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration
ändert. Dadurch funktionieren Alias-/Kompatibilitäts-Provider-Shims weiter, ohne
dass der Aufrufer wissen muss, welches gebündelte Plugin die Umschreibung besitzt.
Wenn kein Provider-Hook einen unterstützten Konfigurationseintrag der Google-Familie
umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer diese
Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig eigenes Wire-Protokoll oder einen eigenen
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks
sind für Provider-Verhalten gedacht, das weiterhin in OpenClaws normaler
Inferenzschleife läuft.

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

Gebündelte Provider-Plugins kombinieren die Hooks oben, um sie an Katalog-,
Authentifizierungs-, Denk-, Replay- und Nutzungsanforderungen der jeweiligen
Vendor anzupassen. Der verbindliche Hook-Satz liegt bei jedem Plugin unter
`extensions/`; diese Seite veranschaulicht die Formen, statt die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Durchreichende Katalog-Provider">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-Modell-IDs
    vor OpenClaws statischem Katalog verfügbar machen können.
  </Accordion>
  <Accordion title="OAuth- und Nutzungsendpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration zu besitzen.
  </Accordion>
  <Accordion title="Replay- und Transkriptbereinigungsfamilien">
    Gemeinsame benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) lassen Provider per
    `buildReplayPolicy` in Transkriptregeln einsteigen, statt dass jedes Plugin
    die Bereinigung erneut implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Hilfsfunktionen">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb der
    öffentlichen `api.ts`- / `contract-api.ts`-Nahtstelle des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Runtime-Hilfsfunktionen

Plugins können über `api.runtime` auf ausgewählte Kern-Hilfsfunktionen zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale Kern-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Kernkonfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider resamplen/encodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für vom Vendor gesteuerte Stimmenauswahl oder Einrichtungsabläufe.
- Stimmenlisten können reichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeits-Tags für Provider-bewusste Auswahloberflächen enthalten.
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

- Belassen Sie TTS-Regeln, Fallback und Antwortzustellung im Kern.
- Verwenden Sie Sprach-Provider für vom Vendor gesteuertes Syntheseverhalten.
- Legacy-Microsoft-`edge`-Eingabe wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Besitzmodell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Sprach-, Bild- und künftige Medien-Provider besitzen, während OpenClaw
  diese Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt einer generischen Key-Value-Bag:

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

- Belassen Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Kern.
- Belassen Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - Der Kern besitzt den Fähigkeitsvertrag und die Runtime-Hilfsfunktion
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins konsumieren `api.runtime.videoGeneration.*`

Für Runtime-Hilfsfunktionen zum Medienverständnis können Plugins Folgendes aufrufen:

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
- Verwendet die Kern-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können außerdem Hintergrund-Subagent-Läufe über `api.runtime.subagent` starten:

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
- Für Plugin-eigene Fallback-Läufe müssen Betreiber mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um explizit jedes Ziel zu erlauben.
- Nicht vertrauenswürdige Plugin-Subagent-Läufe funktionieren weiterhin, aber Überschreibungsanforderungen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der erstellenden Plugin-ID markiert. Fallback-`api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebige Sitzungs-Löschung erfordert weiterhin eine admin-skopierte Gateway-Anforderung.

Für Websuche können Plugins die gemeinsame Runtime-Hilfsfunktion nutzen, statt
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

- Belassen Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Kern.
- Verwenden Sie Websuche-Provider für Vendor-spezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne vom Agent-Tool-Wrapper abhängig zu sein.

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

- `generate(...)`: Generieren Sie ein Bild über die konfigurierte Provider-Kette für Bildgenerierung.
- `listProviders(...)`: Listen Sie verfügbare Provider für Bildgenerierung und deren Fähigkeiten auf.

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
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: Gibt `true` zurück, wenn die Route die Anforderung verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`/`prefix`-Fallthrough-Ketten nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **keine** Operator-Runtime-Scopes automatisch. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` festgelegt, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätstragenden Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route ausschließlich Admin-Verhalten benötigt, verlangen Sie einen Auth-Modus mit Identität und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Plugin-SDK-Importpfade

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Subpfade anstelle des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Zentrale Subpfade:

| Subpfad                             | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung            |
| `openclaw/plugin-sdk/channel-core`  | Hilfsfunktionen für Channel-Einstieg/-Build        |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfsfunktionen und Umbrella-Vertrag |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf
einem `approvalCapability`-Vertrag konsolidiert werden, statt es über
unzusammenhängende Plugin-Felder zu mischen. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurationshilfen liegen unter passenden fokussierten `*-runtime`-Subpfaden
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
- `api.js` — Barrel für Hilfsfunktionen/Typen
- `runtime-api.js` — reines Runtime-Barrel
- `setup-entry.js` — Einstieg des Setup-Plugins

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Subpfade importieren. Importieren Sie niemals `src/*` eines anderen Plugin-Pakets aus Core oder aus einem anderen Plugin.
Über Facades geladene Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot, wenn einer vorhanden ist, und fallen anschließend auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Fähigkeitsspezifische Subpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge. Prüfen Sie die relevante SDK-Referenzseite, wenn Sie sich auf sie verlassen.

## Schemas für Nachrichten-Tools

Plugins sollten channelspezifische `describeMessageTool(...)`-Schema-Beiträge
für Nicht-Nachrichten-Primitive wie Reaktionen, Lesestatus und Umfragen besitzen.
Die gemeinsame Sendepräsentation sollte den generischen `MessagePresentation`-Vertrag
anstelle Provider-nativer Button-, Komponenten-, Block- oder Kartenfelder verwenden.
Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zu angehefteter Zustellung

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Geben Sie keine Provider-nativen UI-Ausweichpfade über das generische Nachrichten-Tool frei.
Veraltete SDK-Hilfsfunktionen für ältere native Schemas bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Channel-Zielauflösung

Channel-Plugins sollten channelspezifische Zielsemantik besitzen. Halten Sie den
gemeinsamen ausgehenden Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Verzeichnissuche als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt zur id-ähnlichen Auflösung springen soll, statt die Verzeichnissuche zu verwenden.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine endgültige Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Provider-spezifische Konstruktion
  der Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen stattfinden sollen.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifischen Normalisierungs-Fallback, nicht für
  breite Verzeichnissuche.
- Halten Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  innerhalb von `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, wie etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- accountbezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` behandeln nur generische Operationen:

- Abfragefilterung
- Limit-Anwendung
- Hilfsfunktionen für Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Channelspezifische Account-Prüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Base-URL-Standardeinstellungen oder auth-geschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere verwandte Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins einen integrierten Provider-Eintrag mit derselben Provider-ID absichtlich überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Read-only-Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, implementieren Sie bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf davon ausgehen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Read-only-Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurationsreparatur-Flows sollten keine Runtime-Zugangsdaten materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Geben Sie nur beschreibenden Account-Status zurück.
- Bewahren Sie `enabled` und `configured`.
- Beziehen Sie Felder für Zugangsdatenquelle/-status ein, wenn relevant, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Tokenwerte zurückgeben, nur um Read-only-Verfügbarkeit
  zu melden. `tokenStatus: "available"` (und das passende Quellenfeld)
  zurückzugeben, reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn Zugangsdaten über SecretRef konfiguriert sind, aber
  im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können Read-only-Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert zu melden.

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

Jeder Eintrag wird zu einem Plugin. Wenn der Pack mehrere Erweiterungen auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach Symlink-Auflösung innerhalb des Plugin-Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Entwicklungsabhängigkeiten zur Laufzeit) und ignoriert geerbte globale npm-Installations-Einstellungen.
Halten Sie Plugin-Abhängigkeitsbäume „pure JS/TS“ und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges setup-only-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegs. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupteinstieg des Plugins auch Tools, Hooks oder anderen reinen Runtime-Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin während der Pre-Listen-Startphase des Gateway in denselben `setupEntry`-Pfad versetzen, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche vollständig abdeckt, die vorhanden sein muss,
bevor der Gateway beginnt, Anfragen anzunehmen. Praktisch bedeutet das, dass der Setup-Einstieg
jede Channel-eigene Fähigkeit registrieren muss, von der der Startup abhängt, zum Beispiel:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway beginnt, Anfragen anzunehmen
- alle Gateway-Methoden, Tools oder Dienste, die im selben Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Einstieg noch irgendeine erforderliche Startup-Fähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Belassen Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Einstieg während des Startups laden.

Gebündelte Channels können auch setup-only-Hilfsfunktionen für Vertragsoberflächen veröffentlichen, die Core
konsultieren kann, bevor die vollständige Channel-Runtime geladen ist. Die aktuelle Setup-Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Oberfläche, wenn eine alte Single-Account-Channel-Konfiguration zu `channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Eintrag zu laden. Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in einen benannten hochgestuften Account, wenn bereits benannte Accounts vorhanden sind, und kann einen konfigurierten nicht kanonischen Standard-Account-Schlüssel beibehalten, statt immer `accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Erkennung gebündelter Vertragsoberflächen lazy. Die Importzeit bleibt gering; die Promotion-Oberfläche wird erst bei der ersten Verwendung geladen, statt beim Modulimport erneut den gebündelten Channel-Start auszulösen.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, belassen Sie sie auf einem Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

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

Channel-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und Installationshinweise über `openclaw.install` bereitstellen. Dadurch bleibt der Core-Katalog datenfrei.

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

Nützliche `openclaw.channel`-Felder über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Dokumentationslink
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung von Texten für Auswahloberflächen
- `markdownCapable`: kennzeichnet den Channel als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Channel aus Oberflächen zur Auflistung konfigurierter Channels aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Channel aus interaktiven Setup-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: kennzeichnet den Channel als intern/privat für Dokumentationsnavigationsoberflächen
- `showConfigured` / `showInSetup`: alte Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: bindet den Channel in den Standard-Quickstart-`allowFrom`-Ablauf ein
- `forceAccountBinding`: erfordert explizites Account-Binding, selbst wenn nur ein Account vorhanden ist
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Announcement-Zielen

OpenClaw kann auch **externe Channel-Kataloge** zusammenführen, zum Beispiel einen MPM-Registry-Export. Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf eine oder mehrere JSON-Dateien (durch Komma, Semikolon oder `PATH` getrennt). Jede Datei sollte `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als alte Aliasse für den Schlüssel `"entries"`.

Generierte Channel-Katalogeinträge und Provider-Installationskatalogeinträge stellen normalisierte Fakten zur Installationsquelle neben dem rohen Block `openclaw.install` bereit. Die normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version oder ein gleitender Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob auch ein lokaler Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die normalisierten Fakten, falls der geparste npm-Paketname von dieser Identität abweicht. Sie warnen auch, wenn `defaultChoice` ungültig ist oder auf eine nicht verfügbare Quelle verweist, und wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind. Consumer sollten `installSource` als additives optionales Feld behandeln, damit handgebaute Einträge und Katalog-Shims es nicht synthetisieren müssen. Dadurch können Onboarding und Diagnosen den Zustand der Quellenebene erklären, ohne Plugin-Runtime zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus `expectedIntegrity` bevorzugen. Bloße Paketnamen und Dist-Tags funktionieren aus Kompatibilitätsgründen weiterhin, erzeugen aber Warnungen zur Quellenebene, damit sich der Katalog in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu beschädigen. Wenn das Onboarding aus einem lokalen Katalogpfad installiert, wird ein verwalteter Plugin-Indexeintrag mit `source: "path"` und, sofern möglich, einem workspace-relativen `sourcePath` aufgezeichnet. Der absolute operative Ladepfad bleibt in `plugins.load.paths`; der Installationsdatensatz vermeidet es, lokale Workstation-Pfade in langlebige Konfiguration zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für Diagnosen der Quellenebene sichtbar, ohne eine zweite Offenlegungsoberfläche für rohe Dateisystempfade hinzuzufügen. Der persistierte Plugin-Index `plugins/installs.json` ist die maßgebliche Quelle für Installationsdaten und kann aktualisiert werden, ohne Plugin-Runtime-Module zu laden. Seine `installRecords`-Map ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder ungültig ist; sein `plugins`-Array ist eine neu aufbaubare Manifestansicht.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Session-Kontexts für Ingest, Assembly und Compaction. Registrieren Sie sie aus Ihrem Plugin mit `api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit `plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, behalten Sie `compact()` implementiert und delegieren Sie explizit:

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

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie das Plugin-System nicht mit einem privaten Zugriff. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. Definieren Sie den Core-Vertrag
   Entscheiden Sie, welches gemeinsame Verhalten Core besitzen soll: Policy, Fallback, Konfigurationszusammenführung, Lebenszyklus, Channel-seitige Semantik und Form der Runtime-Helfer.
2. Fügen Sie typisierte Plugin-Registrierungs-/Runtime-Oberflächen hinzu
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche typisierte Capability-Oberfläche.
3. Verdrahten Sie Core- und Channel-/Feature-Consumer
   Channels und Feature-Plugins sollten die neue Capability über Core nutzen, nicht durch direkten Import einer Vendor-Implementierung.
4. Registrieren Sie Vendor-Implementierungen
   Vendor-Plugins registrieren dann ihre Backends für die Capability.
5. Fügen Sie Vertragsabdeckung hinzu
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform über die Zeit explizit bleiben.

So bleibt OpenClaw eigenständig positioniert, ohne hart auf die Weltsicht eines einzelnen Providers festgelegt zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel finden Sie im [Capability-Cookbook](/de/plugins/architecture).

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner-/Runtime-Helfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Runtime-Exposure in `src/plugins/runtime/*`, wenn Feature-/Channel-Plugins sie nutzen müssen
- Capture-/Test-Helfer in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertragsassertions in `src/plugins/contracts/registry.ts`
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

Vertragstestmuster:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Damit bleibt die Regel einfach:

- Core besitzt den Capability-Vertrag und die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins nutzen Runtime-Helfer
- Vertragstests halten Ownership explizit

## Verwandte Themen

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins bauen](/de/plugins/building-plugins)
