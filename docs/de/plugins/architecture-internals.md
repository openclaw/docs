---
read_when:
    - Implementierung von Provider-Runtime-Hooks, Kanal-Lebenszyklus oder Paket-Bundles
    - Plugin-Ladereihenfolge oder Registrierungszustand debuggen
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Kontext-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-05-10T19:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Informationen zum öffentlichen Capability-Modell, zu Plugin-Formen und zu Ownership-/Ausführungsverträgen finden Sie unter [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die Referenz für die internen Mechanismen: Lade-Pipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start führt OpenClaw ungefähr Folgendes aus:

1. mögliche Plugin-Wurzeln ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   lokaler TypeScript-Quellcode von Drittanbieter-Plugins verwendet den Notfall-Fallback Jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten werden blockiert,
wenn der Einstieg aus der Plugin-Wurzel ausbricht, der Pfad weltweit beschreibbar ist oder die
Pfad-Ownership für nicht gebündelte Plugins verdächtig wirkt.

Blockierte Kandidaten bleiben für Diagnosen mit ihrer Plugin-ID verknüpft. Wenn die Konfiguration
weiterhin auf diese ID verweist, meldet die Validierung das Plugin als vorhanden, aber blockiert,
und verweist zurück auf die Pfadsicherheitswarnung, statt den Konfigurationseintrag
als veraltet zu behandeln.

### Manifest-first-Verhalten

Das Manifest ist die Control-Plane-Quelle der Wahrheit. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschemas oder Bundle-Capabilities zu ermitteln
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu erweitern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind rein metadatenbasierte Deskriptoren für Aktivierungsplanung und Setup-Ermittlung;
sie ersetzen weder Runtime-Registrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins vor einer breiteren Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte
  Kanal-ID gehört
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört
- Gateway-Startplanung verwendet `activation.onStartup` für explizite Start-Imports
  und Start-Opt-outs; Plugins ohne Startmetadaten laden nur
  über engere Aktivierungsauslöser

Request-time-Runtime-Preloads, die den breiten `all`-Scope anfordern, leiten weiterhin eine
explizite effektive Plugin-ID-Menge aus Konfiguration, Startplanung, konfigurierten
Kanälen, Slots und Auto-Enable-Regeln ab. Wenn diese abgeleitete Menge leer ist, lädt OpenClaw
eine leere Runtime-Registry, statt auf jedes auffindbare Plugin auszuweiten.

Der Aktivierungsplaner stellt sowohl eine reine IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite Planerhinweise aus `activation.*` von Manifest-Ownership-
Fallbacks wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze:
Bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Runtime-Ladesemantik zu ändern.

Die Setup-Ermittlung bevorzugt jetzt deskriptoreigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie für Plugins, die weiterhin
Setup-time-Runtime-Hooks benötigen, auf `setup-api` zurückfällt. Provider-Setup-Listen
verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete Setup-Auswahlen
und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden. Explizites
`setup.requiresRuntime: false` ist eine reine Deskriptor-Abschneidung; ausgelassenes
`requiresRuntime` behält aus Kompatibilitätsgründen den Legacy-Fallback auf setup-api bei. Wenn mehr
als ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-ID beansprucht,
verweigert die Setup-Suche den mehrdeutigen Owner, statt sich auf
Ermittlungsreihenfolge zu verlassen. Wenn Setup-Runtime ausgeführt wird, melden Registry-Diagnosen
Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-
Backends, die von setup-api registriert werden, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert Ergebnisse der Plugin-Ermittlung oder direkte Manifest-Registry-
Daten nicht hinter zeitbasierten Fenstern im Cache. Installationen, Manifeständerungen und Änderungen
an Ladepfaden müssen beim nächsten expliziten Metadatenlesevorgang oder Snapshot-Neuaufbau sichtbar werden.
Der Manifestdatei-Parser darf einen begrenzten Dateisignatur-Cache führen, der nach dem
geöffneten Manifestpfad, Inode, Größe und Zeitstempeln indiziert ist; dieser Cache vermeidet nur
das erneute Parsen unveränderter Bytes und darf keine Ermittlungs-, Registry-, Owner- oder
Policy-Antworten cachen.

Der sichere schnelle Metadatenpfad ist explizite Objekt-Ownership, kein versteckter Cache.
Gateway-Start-Hot-Paths sollten das aktuelle `PluginMetadataSnapshot`, die
abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die Aufrufkette
weiterreichen. Konfigurationsvalidierung, Start-Auto-Enable, Plugin-Bootstrap und Provider-
Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und
das aktuelle Plugin-Inventar repräsentieren. Setup-Lookup rekonstruiert Manifest-Metadaten weiterhin
bei Bedarf, sofern der spezifische Setup-Pfad keine explizite Manifest-Registry erhält; behalten Sie das
als Cold-Path-Fallback bei, statt versteckte Lookup-Caches hinzuzufügen. Wenn sich die Eingabe
ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder
historische Kopien zu behalten.
Ansichten über die aktive Plugin-Registry und gebündelte Kanal-Bootstrap-Helfer
sollten aus der aktuellen Registry/Wurzel neu berechnet werden. Kurzlebige Maps sind innerhalb
eines Aufrufs in Ordnung, um Arbeit zu deduplizieren oder Wiedereintritt abzusichern; sie dürfen nicht zu
Prozess-Metadaten-Caches werden.

Für das Laden von Plugins ist die persistente Cache-Schicht das Runtime-Laden. Sie darf
Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, zum Beispiel:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- jiti-/Modul-Caches und Public-Surface-Loader-Caches, die verwendet werden, um den Import
  derselben Runtime-Oberfläche wiederholt zu vermeiden
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Data-Plane-Implementierungsdetails. Sie dürfen keine
Control-Plane-Fragen beantworten, etwa „welchem Plugin gehört dieser Provider?“, sofern der
Aufrufer nicht bewusst Runtime-Laden angefordert hat.

Fügen Sie keine persistenten oder zeitbasierten Caches hinzu für:

- Ermittlungsergebnisse
- direkte Manifest-Registries
- aus dem installierten Plugin-Index rekonstruierte Manifest-Registries
- Provider-Owner-Lookup, Modellunterdrückung, Provider-Policy oder Public-Artifact-
  Metadaten
- jede andere aus dem Manifest abgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index
  oder ein Ladepfad beim nächsten Metadatenlesevorgang sichtbar sein sollte

Aufrufer, die Manifest-Metadaten aus dem persistierten installierten Plugin-
Index neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist dauerhafter
Source-Plane-Zustand; er ist kein versteckter In-Process-Metadaten-Cache.

## Registry-Modell

Geladene Plugins mutieren nicht direkt beliebige Core-Globals. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Herkunft, Status, Diagnosen)
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

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „Registry lesen“, nicht „jedes Plugin-
Modul speziell behandeln“.

## Conversation-Binding-Callbacks

Plugins, die eine Conversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um nach dem Genehmigen oder Ablehnen
einer Bind-Anfrage einen Callback zu erhalten:

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
- `binding`: das aufgelöste Binding für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, der Detach-Hinweis, die Sender-ID und
  Conversation-Metadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Conversation binden darf, und er läuft, nachdem die Core-Genehmigungsbehandlung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifest-Metadaten** für günstige Pre-Runtime-Lookups:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Config-time-Hooks**: `catalog` (Legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: über 40 optionale Hooks für Auth, Modellauflösung,
  Stream-Wrapping, Thinking-Level, Replay-Policy und Usage-Endpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Nutzung](#hook-order-and-usage).

OpenClaw besitzt weiterhin den generischen Agent-Loop, Failover, Transcript-Handling und
Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne einen vollständig eigenen Inferenztransport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider env-basierte
Anmeldedaten hat, die generische Auth-/Status-/Modell-Picker-Pfade sehen sollten, ohne
die Plugin-Runtime zu laden. Das veraltete `providerAuthEnvVars` wird während des
Deprecation-Fensters weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins,
die es verwenden, erhalten eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die Env-Vars, Auth-Profile, konfigurationsgestützte Auth und
API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-
`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-Oberflächen die
Choice-ID des Providers, Gruppenlabels und einfache One-Flag-Auth-Verkabelung kennen sollten, ohne
die Provider-Runtime zu laden. Behalten Sie Provider-Runtime-
`envVars` für operator-facing Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Auth oder Setup hat, die
generische Shell-Env-Fallbacks, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollten,
ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Nutzung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.
Nur der Kompatibilität dienende Provider-Felder, die OpenClaw nicht mehr aufruft, etwa
`ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht
aufgeführt.

| #   | Hook                              | Was er macht                                                                                                   | Wann verwenden                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht Provider-Konfiguration während der `models.json`-Generierung in `models.providers`                                | Provider besitzt einen Katalog oder Standardwerte für Basis-URLs                                                                                                  |
| 2   | `applyConfigDefaults`             | Wendet Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung an                                      | Standardwerte hängen vom Authentifizierungsmodus, der Umgebung oder der Modellfamilien-Semantik des Providers ab                                                                         |
| --  | _(integrierte Modellsuche)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                          | _(kein Plugin-Hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Preview-Modell-ID-Aliasse vor der Suche                                                     | Provider besitzt die Alias-Bereinigung vor der kanonischen Modellauflösung                                                                                 |
| 4   | `normalizeTransport`              | Normalisiert Provider-Familien-`api` / `baseUrl` vor der generischen Modellassemblierung                                      | Provider besitzt die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                                          |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Runtime-/Provider-Auflösung                                           | Provider benötigt eine Konfigurationsbereinigung, die im Plugin leben sollte; gebündelte Google-Familien-Hilfsfunktionen sichern außerdem unterstützte Google-Konfigurationseinträge ab   |
| 6   | `applyNativeStreamingUsageCompat` | Wendet native Kompatibilitätsumschreibungen für Streaming-Nutzungsdaten auf Konfigurations-Provider an                                               | Provider benötigt endpoint-gesteuerte Korrekturen für native Streaming-Nutzungsmetadaten                                                                          |
| 7   | `resolveConfigApiKey`             | Löst Authentifizierung über Umgebungsmarker für Konfigurations-Provider vor dem Laden der Runtime-Authentifizierung auf                                       | Provider hat Provider-eigene API-Schlüsselauflösung über Umgebungsmarker; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Umgebungsmarker-Resolver                  |
| 8   | `resolveSyntheticAuth`            | Macht lokale/selbst gehostete oder konfigurationsgestützte Authentifizierung verfügbar, ohne Klartext dauerhaft zu speichern                                   | Provider kann mit einem synthetischen/lokalen Zugangsdatenmarker arbeiten                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Überlagert Provider-eigene externe Authentifizierungsprofile; Standard-`persistence` ist `runtime-only` für CLI-/App-eigene Zugangsdaten | Provider verwendet externe Authentifizierungsdaten wieder, ohne kopierte Refresh-Tokens dauerhaft zu speichern; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuft gespeicherte synthetische Profilplatzhalter hinter umgebungs-/konfigurationsgestützte Authentifizierung zurück                                      | Provider speichert synthetische Platzhalterprofile, die keinen Vorrang erhalten sollten                                                                 |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind                                       | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrmes Warm-up, danach läuft `resolveDynamicModel` erneut                                                           | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                                  |
| 13  | `normalizeResolvedModel`          | Abschließende Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                                               | Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Kerntransport                                                                             |
| 14  | `contributeResolvedModelCompat`   | Steuert Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport bei                                  | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                       |
| 15  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie sieht                                                    | Provider benötigt Schemakorrektur für die Transportfamilie                                                                                                |
| 16  | `inspectToolSchemas`              | Macht Provider-eigene Schemadiagnosen nach der Normalisierung sichtbar                                                  | Provider möchte Schlüsselwortwarnungen ausgeben, ohne dem Kern Provider-spezifische Regeln beizubringen                                                                 |
| 17  | `resolveReasoningOutputMode`      | Wählt nativen oder getaggten Reasoning-Ausgabevertrag                                                              | Provider benötigt getaggtes Reasoning/finale Ausgabe anstelle nativer Felder                                                                         |
| 18  | `prepareExtraParams`              | Request-Parameter-Normalisierung vor generischen Stream-Options-Wrappern                                              | Provider benötigt Standard-Request-Parameter oder eine Parameterbereinigung pro Provider                                                                           |
| 19  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                                                   | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                              | Provider benötigt Kompatibilitäts-Wrapper für Request-Header, Body oder Modell ohne benutzerdefinierten Transport                                                          |
| 21  | `resolveTransportTurnState`       | Fügt native Transport-Header oder Metadaten pro Turn hinzu                                                           | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Fügt native WebSocket-Header oder eine Session-Cool-down-Policy hinzu                                                    | Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Policy abstimmen                                                               |
| 23  | `formatApiKey`                    | Authentifizierungsprofil-Formatter: gespeichertes Profil wird zur Runtime-`apiKey`-Zeichenfolge                                     | Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                                                    |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinien                                  | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                           |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn der OAuth-Refresh fehlschlägt                                                                  | Provider benötigt Provider-eigene Anleitung zur Authentifizierungsreparatur nach Refresh-Fehlern                                                                      |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfenster-Überläufe                                                                 | Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                                                |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                                  | Provider kann rohe API-/Transportfehler auf Ratenbegrenzung, Überlastung usw. abbilden                                                                          |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                               | Provider benötigt Proxy-spezifische Cache-TTL-Gating-Regeln                                                                                                |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                                                      | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                                          | Provider benötigt synthetische Forward-Compatibility-Zeilen in `models list` und Auswahloberflächen                                                                     |
| 31  | `resolveThinkingProfile`          | Modellspezifische `/think`-Level-Menge, Anzeigelabels und Standardwert                                                 | Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder ein binäres Label bereit                                                                 |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für den Reasoning-Umschalter Ein/Aus                                                                     | Provider stellt Thinking nur binär ein/aus bereit                                                                                                  |
| 33  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning                                                                   | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für das Standard-`/think`-Level                                                                      | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                                      |
| 35  | `isModernModelRef`                | Modern-Model-Matcher für Live-Profilfilter und Smoke-Auswahl                                              | Provider besitzt den bevorzugten Modellabgleich für Live/Smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Tauscht konfigurierte Zugangsdaten direkt vor der Inferenz gegen das tatsächliche Runtime-Token bzw. den tatsächlichen Runtime-Schlüssel aus                       | Provider benötigt einen Token-Austausch oder kurzlebige Request-Zugangsdaten                                                                             |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungs-Anmeldedaten für `/usage` und zugehörige Statusoberflächen auflösen                                     | Provider benötigt benutzerdefiniertes Parsing von Nutzungs-/Kontingent-Token oder andere Nutzungs-Anmeldedaten                                                               |
| 38  | `fetchUsageSnapshot`              | Providerspezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde                             | Provider benötigt einen providerspezifischen Nutzungs-Endpunkt oder Payload-Parser                                                                           |
| 39  | `createEmbeddingProvider`         | Einen vom Provider verwalteten Embedding-Adapter für Speicher/Suche erstellen                                                     | Embedding-Verhalten für Speicher gehört in das Provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transcript-Verarbeitung für den Provider steuert                                        | Provider benötigt eine benutzerdefinierte Transcript-Richtlinie (zum Beispiel Entfernen von Denkblöcken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transcript-Bereinigung umschreiben                                                        | Provider benötigt providerspezifische Replay-Umschreibungen über gemeinsame Compaction-Helfer hinaus                                                             |
| 42  | `validateReplayTurns`             | Abschließende Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                                           | Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                                    |
| 43  | `onModelSelected`                 | Vom Provider verwaltete Seiteneffekte nach der Auswahl ausführen                                                                 | Provider benötigt Telemetrie oder vom Provider verwalteten Zustand, wenn ein Modell aktiv wird                                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
übereinstimmende Provider-Plugin und fallen dann auf andere Provider-Plugins mit
Hook-Unterstützung zurück, bis eines die Modell-ID oder Transport/Konfiguration
tatsächlich ändert. Dadurch funktionieren Alias-/Kompatibilitäts-Provider-Shims,
ohne dass der Aufrufer wissen muss, welches gebündelte Plugin die Umschreibung
besitzt. Wenn kein Provider-Hook einen unterstützten Konfigurationseintrag der
Google-Familie umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer
weiterhin diese Kompatibilitätsbereinigung an.

Wenn der Provider ein vollständig eigenes Wire-Protokoll oder einen eigenen
Request-Executor benötigt, ist das eine andere Erweiterungsklasse. Diese Hooks
sind für Provider-Verhalten gedacht, das weiterhin in OpenClaws normalem
Inference-Loop läuft.

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

Gebündelte Provider-Plugins kombinieren die obigen Hooks, um Katalog-, Auth-,
Thinking-, Replay- und Nutzungsanforderungen der jeweiligen Anbieter abzubilden.
Der maßgebliche Hook-Satz liegt bei jedem Plugin unter `extensions/`; diese Seite
veranschaulicht die Formen, statt die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalog-Provider">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie vorgelagerte
    Modell-IDs vor OpenClaws statischem Katalog verfügbar machen können.
  </Accordion>
  <Accordion title="OAuth- und Nutzungsendpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppeln
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration zu besitzen.
  </Accordion>
  <Accordion title="Replay- und Transkriptbereinigungsfamilien">
    Gemeinsame benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern,
    sich über `buildReplayPolicy` für Transkriptrichtlinien zu entscheiden,
    statt dass jedes Plugin die Bereinigung erneut implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen den gemeinsamen
    Inference-Loop.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helfer">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen im öffentlichen
    `api.ts`- / `contract-api.ts`-Seam des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) und nicht im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Runtime-Helfer

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabenutzlast für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider resamplen/kodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für anbietereigene Voice-Picker oder Einrichtungsabläufe.
- Voice-Listen können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
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

- Behalten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Speech-Provider für anbietereigenes Syntheseverhalten.
- Legacy-Microsoft-`edge`-Eingabe wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Besitzmodell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Speech-, Image- und zukünftige Media-Provider besitzen, wenn OpenClaw
  diese Capability-Verträge hinzufügt.

Für Bild-/Audio-/Videoverstehen registrieren Plugins einen typisierten
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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Core.
- Behalten Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Videogenerierung folgt bereits demselben Muster:
  - Core besitzt den Capability-Vertrag und den Runtime-Helfer
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Media-Understanding-Runtime-Helfer können Plugins Folgendes aufrufen:

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
  Bild-/Audio-/Videoverstehen.
- Verwendet die Core-Media-Understanding-Audiokonfiguration (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird, zum Beispiel bei übersprungener/nicht unterstützter Eingabe.
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können auch Hintergrund-Subagent-Läufe über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Overrides pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für pluginbesessene Fallback-Läufe müssen Operatoren dies mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktivieren.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Subagent-Läufe nicht vertrauenswürdiger Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der ID des erstellenden Plugins markiert. Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebiges Löschen von Sitzungen erfordert weiterhin eine Gateway-Anfrage mit Admin-Scope.

Für Websuche können Plugins den gemeinsamen Runtime-Helfer verwenden, statt
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

Plugins können Web-Search-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Credential-Auflösung und gemeinsame Request-Semantik im Core.
- Verwenden Sie Web-Search-Provider für vendorspezifische Suchtransporte.
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

- `generate(...)`: generiert ein Bild mit der konfigurierten Image-Generation-Provider-Kette.
- `listProviders(...)`: listet verfügbare Image-Generation-Provider und deren Capabilities auf.

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
- `replaceExisting`: optional. Ermöglicht demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`/`prefix`-Fallthrough-Ketten ausschließlich auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **keine** Operator-Runtime-Scopes automatisch. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` werden innerhalb eines Gateway-Anfrage-Runtime-Scopes ausgeführt, aber dieser Scope ist bewusst konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Plugin-Routen-Runtime-Scopes auf `operator.write` fixiert, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätsführenden Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route ausschließlich adminberechtigtes Verhalten benötigt, verlangen Sie einen Auth-Modus mit Identität und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Plugin-SDK-Importpfade

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade statt des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Core-Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`  | Hilfsfunktionen für Channel-Einstieg/Build         |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfsfunktionen und Umbrella-Vertrag |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema für das Root-`openclaw.json` (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf einem
einzigen `approvalCapability`-Vertrag konsolidiert werden, statt über nicht
zusammenhängende Plugin-Felder gemischt zu werden. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurationshilfen liegen unter passenden fokussierten `*-runtime`-Unterpfaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` usw.). Bevorzugen Sie `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation`
anstelle des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro Root eines gebündelten Plugin-Pakets):

- `index.js` — Einstieg für gebündeltes Plugin
- `api.js` — Barrel für Hilfsfunktionen/Typen
- `runtime-api.js` — reines Runtime-Barrel
- `setup-entry.js` — Einstieg für Setup-Plugin

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus Core oder aus einem anderen Plugin.
Über Facades geladene Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot, wenn einer
existiert, und fallen dann auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge. Prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich darauf verlassen.

## Schemas für Message-Tools

Plugins sollten channel-spezifische `describeMessageTool(...)`-Schema-
Beiträge für Nicht-Nachrichten-Primitive wie Reaktionen, Lesebestätigungen und Umfragen besitzen.
Gemeinsame Sendepräsentation sollte den generischen `MessagePresentation`-Vertrag
anstelle von Provider-nativen Button-, Component-, Block- oder Card-Feldern verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für angeheftete Zustellungsanfragen

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine Provider-nativen UI-Ausweichpfade über das generische Message-Tool bereit.
Veraltete SDK-Hilfsfunktionen für Legacy-native Schemas bleiben für bestehende
Drittanbieter-Plugins exportiert, neue Plugins sollten sie jedoch nicht verwenden.

## Channel-Zielauflösung

Channel-Plugins sollten channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt zu ID-artiger Auflösung springen soll, statt die Verzeichnissuche zu verwenden.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine finale Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` übernimmt die Provider-spezifische Session-
  Routen-Erstellung, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor dem
  Durchsuchen von Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifischen Normalisierungs-Fallback, nicht für
  breite Verzeichnissuche.
- Halten Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs in `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, wie etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- account-bezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` behandeln nur generische Operationen:

- Abfragefilterung
- Anwendung von Limits
- Deduplizierungs-/Normalisierungshilfen
- Erstellen von `ChannelDirectoryEntry[]`

Channel-spezifische Account-Prüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Standardwerte für Base-URLs
oder auth-geschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu OpenClaws
eingebauten impliziten Providern zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Plugins können außerdem schreibgeschützte Modellzeilen über
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` veröffentlichen. Dies ist der zukünftige Pfad für Listen-/Hilfe-/Picker-Oberflächen und unterstützt
Zeilen für `text`, `image_generation`, `video_generation` und `music_generation`.
Provider-Plugins besitzen weiterhin Live-Endpunktaufrufe, Token-Austausch und Vendor-
Antwortzuordnung; Core besitzt die gemeinsame Zeilenform, Quellenlabels und die
Hilfeformatierung für Media-Tools. Registrierungen von Media-Generation-Providern synthetisieren statische
Katalogzeilen automatisch aus `defaultModel`, `models` und `capabilities`.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias, gibt aber eine Deprecation-Warnung aus
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`
- `augmentModelCatalog` ist veraltet; gebündelte Provider sollten ergänzende
  Zeilen über `registerModelCatalogProvider` veröffentlichen

## Schreibgeschützte Channel-Prüfung

Wenn Ihr Plugin einen Channel registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf davon ausgehen, dass Anmeldedaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurations-
  Reparaturflüsse sollten Runtime-Anmeldedaten nicht materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur beschreibenden Account-Zustand zurück.
- Behalten Sie `enabled` und `configured` bei.
- Fügen Sie bei Relevanz Felder für Quelle/Status von Anmeldedaten hinzu, wie etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` (und das passende Quellenfeld)
  zurückzugeben, reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert, aber
  im aktuellen Befehlspfad nicht verfügbar sind.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert zu melden.

## Package-Packs

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach der Symlink-Auflösung innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Dev-Abhängigkeiten zur Laufzeit) und ignoriert geerbte globale npm-Installations-Einstellungen.
Halten Sie Plugin-Abhängigkeitsbäume „pure JS/TS“ und vermeiden Sie Pakete, die
`postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges, nur für Setup bestimmtes Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegs. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupt-Plugin-Einstieg auch Tools, Hooks oder anderen rein Runtime-bezogenen
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin während der Pre-Listen-Startphase des Gateway in denselben
`setupEntry`-Pfad aufnehmen, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche, die vorhanden sein muss,
bevor der Gateway mit dem Lauschen beginnt, vollständig abdeckt. In der Praxis bedeutet das,
dass der Setup-Eintrag jede channel-eigene Capability registrieren muss, von der der Start abhängt, zum Beispiel:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway mit dem Lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Eintrag weiterhin eine erforderliche Start-Capability besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw den
vollständigen Eintrag während des Starts laden.

Gebündelte Channels können auch reine Setup-Hilfen für die Vertragsoberfläche veröffentlichen, die Core
abfragen kann, bevor die vollständige Channel-Laufzeit geladen wird. Die aktuelle Setup-
Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Oberfläche, wenn eine ältere Einzelkonto-Channel-
Konfiguration in `channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Eintrag zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes hochgestuftes Konto, wenn bereits benannte Konten vorhanden sind, und kann einen
konfigurierten nicht kanonischen Standardkonto-Schlüssel beibehalten, anstatt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Erkennung der gebündelten Vertragsoberfläche lazy. Die Import-
Zeit bleibt gering; die Promotion-Oberfläche wird erst bei der ersten Verwendung geladen, statt
beim Modulimport erneut in den Start des gebündelten Channels einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie unter einem
Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
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
Installationshinweise über `openclaw.install` bekanntmachen. Dadurch bleibt der Core-Katalog frei von Daten.

Beispiel:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (selbst gehostet)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Selbst gehosteter Chat über Nextcloud Talk-Webhook-Bots.",
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

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Copy-Steuerungen für die Auswahloberfläche
- `markdownCapable`: markiert den Channel für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig
- `exposure.configured`: den Channel aus Oberflächen zur Auflistung konfigurierter Channels ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: den Channel aus interaktiven Setup-/Konfigurationsauswahlen ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: den Channel für Dokumentationsnavigationsoberflächen als intern/privat markieren
- `showConfigured` / `showInSetup`: ältere Aliasse, die weiterhin aus Kompatibilitätsgründen akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: den Channel für den standardmäßigen Quickstart-`allowFrom`-Flow anmelden
- `forceAccountBinding`: explizite Kontobindung verlangen, auch wenn nur ein Konto vorhanden ist
- `preferSessionLookupForAnnounceTarget`: Session-Suche beim Auflösen von Ankündigungszielen bevorzugen

OpenClaw kann auch **externe Channel-Kataloge** zusammenführen, zum Beispiel einen MPM-
Registry-Export. Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als ältere Aliasse für den Schlüssel `"entries"`.

Generierte Channel-Katalogeinträge und Provider-Installationskatalogeinträge stellen
normalisierte Installationsquellen-Fakten neben dem unverarbeiteten `openclaw.install`-Block bereit. Die
normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version oder ein freier
Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob außerdem ein lokaler
Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die
normalisierten Fakten, falls der geparste npm-Paketname von dieser Identität abweicht.
Sie warnen außerdem, wenn `defaultChoice` ungültig ist oder auf eine Quelle verweist, die
nicht verfügbar ist, sowie wenn npm-Integritätsmetadaten ohne gültige npm-
Quelle vorhanden sind. Consumer sollten `installSource` als additives optionales Feld behandeln, damit
manuell erstellte Einträge und Katalog-Shims es nicht synthetisieren müssen.
So können Onboarding und Diagnosen den Zustand der Quellenebene erklären, ohne
die Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, erzeugen aber Warnungen der Quellenebene, damit sich der Katalog
in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne vorhandene Plugins zu beschädigen.
Wenn das Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen verwalteten Plugin-
Plugin-Indexeintrag mit `source: "path"` und, wenn möglich, einem arbeitsbereichsrelativen
`sourcePath` auf. Der absolute operative Ladepfad bleibt in
`plugins.load.paths`; der Installationsdatensatz vermeidet, lokale Workstation-
Pfade in langlebige Konfiguration zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für
Diagnosen der Quellenebene sichtbar, ohne eine zweite rohe Offenlegungsfläche für Dateisystempfade
hinzuzufügen. Der persistierte Plugin-Index `plugins/installs.json` ist die Installations-
Wahrheitsquelle und kann aktualisiert werden, ohne Plugin-Laufzeitmodule zu laden.
Seine `installRecords`-Map ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder
ungültig ist; sein `plugins`-Array ist eine wiederaufbaubare Manifestansicht.

## Kontext-Engine-Plugins

Kontext-Engine-Plugins besitzen die Orchestrierung des Sitzungskontexts für Ingest, Assembly
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss,
anstatt nur Speichersuche oder Hooks hinzuzufügen.

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

Die Factory `ctx` stellt optionale Werte `config`, `agentDir` und `workspaceDir`
für die Initialisierung zur Konstruktionszeit bereit.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()`
implementiert und delegieren Sie ihn explizit:

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

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Zugriff. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. definieren Sie den Core-Vertrag
   Entscheiden Sie, welches gemeinsame Verhalten Core besitzen soll: Policy, Fallback, Konfigurationszusammenführung,
   Lifecycle, channel-seitige Semantik und Form der Laufzeithelfer.
2. fügen Sie typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzu
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. verdrahten Sie Core- und Channel-/Feature-Consumer
   Channels und Feature-Plugins sollten die neue Capability über Core konsumieren,
   nicht durch direkten Import einer Vendor-Implementierung.
4. registrieren Sie Vendor-Implementierungen
   Vendor-Plugins registrieren anschließend ihre Backends für die Capability.
5. fügen Sie Vertragsabdeckung hinzu
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne hart auf die Weltsicht eines einzelnen
Providers festgelegt zu werden. Siehe das [Capability-Kochbuch](/de/plugins/adding-capabilities)
für eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel.

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese
Oberflächen in der Regel gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner-/Laufzeithelfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Laufzeitfreigabe in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie konsumieren müssen
- Capture-/Testhelfer in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertragsassertions in `src/plugins/contracts/registry.ts`
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

Vertragstestmuster:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Das hält die Regel einfach:

- Core besitzt den Capability-Vertrag und die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins konsumieren Laufzeithelfer
- Vertragstests halten Ownership explizit

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
