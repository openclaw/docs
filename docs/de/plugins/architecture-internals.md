---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Kanal-Lebenszyklus oder Paket-Packs
    - Debuggen der Plugin-Ladereihenfolge oder des Registry-Zustands
    - Neue Plugin-Fähigkeit oder neues Kontext-Engine-Plugin hinzufügen
summary: 'Interna der Plugin-Architektur: Lade-Pipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-05-03T21:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Für das öffentliche Capability-Modell, Plugin-Formen und Ownership-/Ausführungs-Contracts siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die Referenz für die interne Mechanik: Lade-Pipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start tut OpenClaw ungefähr Folgendes:

1. Kandidaten für Plugin-Roots erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   lokale TypeScript-Quellen von Drittanbietern verwenden den Notfall-Fallback Jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten werden blockiert, wenn der Einstiegspunkt den Plugin-Root verlässt, der Pfad global beschreibbar ist oder die Pfad-Ownership bei nicht gebündelten Plugins verdächtig wirkt.

Blockierte Kandidaten bleiben für Diagnosen mit ihrer Plugin-ID verknüpft. Wenn die Konfiguration diese ID weiterhin referenziert, meldet die Validierung das Plugin als vorhanden, aber blockiert, und verweist auf die Pfadsicherheitswarnung zurück, statt den Konfigurationseintrag als veraltet zu behandeln.

### Manifest-First-Verhalten

Das Manifest ist die Source of Truth der Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschemata oder Bundle-Capabilities zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu erweitern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren ohne Laden der Plugin-Runtime beizubehalten

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane. Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung; sie ersetzen weder Runtime-Registrierung, `register(...)` noch `setupEntry`. Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern, um das Laden von Plugins vor breiterer Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte Kanal-ID besitzen
- explizite Provider-Setup/Runtime-Auflösung wird auf Plugins eingegrenzt, die die angeforderte Provider-ID besitzen
- Gateway-Startplanung verwendet `activation.onStartup` für explizite Start-Imports und Start-Opt-outs; Plugins ohne Startmetadaten laden nur über engere Aktivierungsauslöser

Runtime-Preloads zur Anfragezeit, die den breiten Scope `all` anfordern, leiten weiterhin eine explizite effektive Plugin-ID-Menge aus Konfiguration, Startplanung, konfigurierten Kanälen, Slots und Auto-Enable-Regeln ab. Wenn diese abgeleitete Menge leer ist, lädt OpenClaw eine leere Runtime-Registry, statt auf jedes auffindbare Plugin auszuweiten.

Der Aktivierungsplaner stellt sowohl eine Nur-IDs-API für bestehende Aufrufer als auch eine Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde, und trennen explizite Planerhinweise aus `activation.*` von Manifest-Ownership-Fallbacks wie `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze: Bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise oder Fallback-Verhalten erkennen kann, ohne die Semantik des Runtime-Ladens zu ändern.

Die Setup-Erkennung bevorzugt jetzt Deskriptor-eigene IDs wie `setup.providers` und `setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie für Plugins, die noch Setup-Zeit-Runtime-Hooks benötigen, auf `setup-api` zurückfällt. Provider-Setup-Listen verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete Setup-Auswahlen und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden. Explizites `setup.requiresRuntime: false` ist ein reiner Deskriptor-Cutoff; ein ausgelassenes `requiresRuntime` behält aus Kompatibilitätsgründen den Legacy-`setup-api`-Fallback bei. Wenn mehr als ein erkanntes Plugin denselben normalisierten Setup-Provider oder dieselbe CLI-Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Owner, statt sich auf die Erkennungsreihenfolge zu verlassen. Wenn die Setup-Runtime ausgeführt wird, melden Registry-Diagnosen Drift zwischen `setup.providers` / `setup.cliBackends` und den von setup-api registrierten Providern oder CLI-Backends, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert Plugin-Erkennungsergebnisse oder direkte Manifest-Registry-Daten nicht hinter Wall-Clock-Fenstern zwischen. Installationen, Manifeständerungen und Änderungen an Ladepfaden müssen beim nächsten expliziten Metadatenlesevorgang oder Snapshot-Neuaufbau sichtbar werden. Der Manifest-Dateiparser kann einen begrenzten Dateisignatur-Cache führen, der nach geöffnetem Manifestpfad, Inode, Größe und Zeitstempeln geschlüsselt ist; dieser Cache vermeidet nur erneutes Parsen unveränderter Bytes und darf keine Erkennungs-, Registry-, Owner- oder Policy-Antworten zwischenspeichern.

Der sichere schnelle Metadatenpfad ist explizite Objekt-Ownership, kein versteckter Cache. Heiße Gateway-Startpfade sollten den aktuellen `PluginMetadataSnapshot`, die abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die Aufrufkette weiterreichen. Konfigurationsvalidierung, Start-Auto-Enable, Plugin-Bootstrap und Provider-Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und das aktuelle Plugin-Inventar repräsentieren. Die Setup-Suche rekonstruiert Manifest-Metadaten weiterhin bei Bedarf, sofern der konkrete Setup-Pfad keine explizite Manifest-Registry erhält; halten Sie das als Cold-Path-Fallback bei, statt versteckte Lookup-Caches hinzuzufügen. Wenn sich die Eingabe ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder historische Kopien zu behalten.
Views über die aktive Plugin-Registry und gebündelte Kanal-Bootstrap-Helfer sollten aus der aktuellen Registry/dem aktuellen Root neu berechnet werden. Kurzlebige Maps innerhalb eines Aufrufs sind in Ordnung, um Arbeit zu deduplizieren oder Wiedereintritt zu schützen; sie dürfen nicht zu Prozess-Metadaten-Caches werden.

Für das Laden von Plugins ist die persistente Cache-Schicht das Runtime-Laden. Sie kann Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, zum Beispiel:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- jiti-/Modul-Caches und Public-Surface-Loader-Caches, die verwendet werden, um wiederholtes Importieren derselben Runtime-Oberfläche zu vermeiden
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Data-Plane-Implementierungsdetails. Sie dürfen keine Control-Plane-Fragen beantworten, etwa „welches Plugin besitzt diesen Provider?“, sofern der Aufrufer nicht absichtlich Runtime-Laden angefordert hat.

Fügen Sie keine persistenten oder Wall-Clock-Caches hinzu für:

- Erkennungsergebnisse
- direkte Manifest-Registries
- Manifest-Registries, die aus dem installierten Plugin-Index rekonstruiert wurden
- Provider-Owner-Lookup, Modellunterdrückung, Provider-Policy oder Public-Artifact-Metadaten
- jede andere aus dem Manifest abgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index oder ein Ladepfad beim nächsten Metadatenlesen sichtbar sein sollte

Aufrufer, die Manifest-Metadaten aus dem persistierten installierten Plugin-Index neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist dauerhafter Source-Plane-Zustand; er ist kein versteckter In-Process-Metadaten-Cache.

## Registry-Modell

Geladene Plugins mutieren keine zufälligen Core-Globals direkt. Sie registrieren sich in einer zentralen Plugin-Registry.

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

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur einen Integrationspunkt benötigen: „Registry lesen“, nicht „jedes Plugin-Modul gesondert behandeln“.

## Conversation-Binding-Callbacks

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-Anfrage genehmigt oder abgelehnt wurde:

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
- `request`: die ursprüngliche Anfragezusammenfassung, Detach-Hinweis, Absender-ID und Konversationsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine Konversation binden darf, und wird ausgeführt, nachdem die Core-Genehmigungsbehandlung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifest-Metadaten** für günstige Pre-Runtime-Lookups:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Konfigurationszeit-Hooks**: `catalog` (Legacy-`discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: über 40 optionale Hooks für Auth, Modellauflösung,
  Stream-Wrapping, Thinking-Levels, Replay-Policy und Usage-Endpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Nutzung](#hook-order-and-usage).

OpenClaw besitzt weiterhin den generischen Agent-Loop, Failover, Transcript-Behandlung und Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche für Provider-spezifisches Verhalten, ohne dass ein vollständig eigener Inferenztransport nötig ist.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider umgebungsbasierte Zugangsdaten hat, die generische Auth-/Status-/Modellauswahlpfade sehen sollten, ohne die Plugin-Runtime zu laden. Das veraltete `providerAuthEnvVars` wird während des Deprecation-Fensters weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins, die es verwenden, erhalten eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Auth und API-Schlüssel-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn Onboarding-/Auth-Auswahl-CLI-Oberflächen die Choice-ID des Providers, Gruppenlabels und einfache Ein-Flag-Auth-Verkabelung kennen sollten, ohne die Provider-Runtime zu laden. Behalten Sie Provider-Runtime-`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder OAuth-Client-ID/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal umgebungsgetriebene Auth oder Setup hat, die generische Shell-Env-Fallbacks, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollten, ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Nutzung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.
Nur zur Kompatibilität vorhandene Provider-Felder, die OpenClaw nicht mehr aufruft, wie `ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht aufgeführt.

| #   | Hook                              | Was er tut                                                                                                   | Wann verwenden                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht die Provider-Konfiguration während der `models.json`-Generierung in `models.providers`                                | Provider besitzt einen Katalog oder Standardwerte für Basis-URLs                                                                                                  |
| 2   | `applyConfigDefaults`             | Wendet Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung an                                      | Standardwerte hängen vom Authentifizierungsmodus, der Umgebung oder der Semantik der Provider-Modellfamilie ab                                                                         |
| --  | _(integrierte Modellauflösung)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                          | _(kein Plugin-Hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Preview-Modell-ID-Aliasse vor der Auflösung                                                     | Provider ist für die Alias-Bereinigung vor der kanonischen Modellauflösung zuständig                                                                                 |
| 4   | `normalizeTransport`              | Normalisiert `api` / `baseUrl` der Provider-Familie vor der generischen Modellzusammenstellung                                      | Provider ist für die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie zuständig                                                          |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Runtime-/Provider-Auflösung                                           | Provider benötigt eine Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Helfer für die Google-Familie sichern außerdem unterstützte Google-Konfigurationseinträge ab   |
| 6   | `applyNativeStreamingUsageCompat` | Wendet native Kompatibilitätsumschreibungen für Streaming-Nutzung auf Konfigurations-Provider an                                               | Provider benötigt endpointgesteuerte Korrekturen nativer Metadaten zur Streaming-Nutzung                                                                          |
| 7   | `resolveConfigApiKey`             | Löst Authentifizierung über Umgebungsmarker für Konfigurations-Provider vor dem Laden der Runtime-Authentifizierung auf                                       | Provider hat Provider-eigene API-Schlüsselauflösung über Umgebungsmarker; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Resolver für Umgebungsmarker                  |
| 8   | `resolveSyntheticAuth`            | Stellt lokale/selbst gehostete oder konfigurationsgestützte Authentifizierung bereit, ohne Klartext dauerhaft zu speichern                                   | Provider kann mit einem synthetischen/lokalen Anmeldedatenmarker arbeiten                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Überlagert Provider-eigene externe Authentifizierungsprofile; der Standardwert für `persistence` ist `runtime-only` für CLI-/App-eigene Anmeldedaten | Provider verwendet externe Authentifizierungsdaten wieder, ohne kopierte Refresh-Tokens dauerhaft zu speichern; `contracts.externalAuthProviders` im Manifest deklarieren |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuften gespeicherte synthetische Profil-Platzhalter hinter umgebungs-/konfigurationsgestützte Authentifizierung zurück                                      | Provider speichert synthetische Platzhalterprofile, die keine Vorrangstellung erhalten sollten                                                                 |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry enthalten sind                                       | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach wird `resolveDynamicModel` erneut ausgeführt                                                           | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                                  |
| 13  | `normalizeResolvedModel`          | Abschließende Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                                               | Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                                                             |
| 14  | `contributeResolvedModelCompat`   | Steuert Kompatibilitätsflags für Vendor-Modelle hinter einem anderen kompatiblen Transport bei                                  | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                       |
| 15  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie sieht                                                    | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                                |
| 16  | `inspectToolSchemas`              | Stellt Provider-eigene Schemadiagnosen nach der Normalisierung bereit                                                  | Provider möchte Keyword-Warnungen, ohne Core Provider-spezifische Regeln beizubringen                                                                 |
| 17  | `resolveReasoningOutputMode`      | Wählt nativen oder getaggten Vertrag für Reasoning-Ausgaben                                                              | Provider benötigt getaggtes Reasoning/Final Output statt nativer Felder                                                                         |
| 18  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Stream-Options-Wrappern                                              | Provider benötigt Standard-Anfrageparameter oder Parameterbereinigung pro Provider                                                                           |
| 19  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                                                   | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                              | Provider benötigt Kompatibilitäts-Wrapper für Anfrage-Header, Body oder Modell ohne benutzerdefinierten Transport                                                          |
| 21  | `resolveTransportTurnState`       | Hängt native Transport-Header oder Metadaten pro Turn an                                                           | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder Sitzungs-Cool-down-Richtlinie an                                                    | Provider möchte, dass generische WS-Transporte Sitzungs-Header oder Fallback-Richtlinien abstimmen                                                               |
| 23  | `formatApiKey`                    | Authentifizierungsprofil-Formatter: gespeichertes Profil wird zur Runtime-`apiKey`-Zeichenfolge                                     | Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                                                    |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Richtlinien bei Refresh-Fehlschlägen                                  | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                           |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                                                  | Provider benötigt Provider-eigene Anleitung zur Authentifizierungsreparatur nach einem Refresh-Fehler                                                                      |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfenster-Überlauf                                                                 | Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                                                |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                                  | Provider kann rohe API-/Transportfehler auf Rate-Limit, Überlastung usw. abbilden                                                                          |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                               | Provider benötigt Proxy-spezifische Steuerung der Cache-TTL                                                                                                |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                                                      | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/abschließende Katalogzeilen, die nach der Discovery angehängt werden                                                          | Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahlfeldern                                                                     |
| 31  | `resolveThinkingProfile`          | Modellspezifischer `/think`-Levelsatz, Anzeigelabels und Standardwert                                                 | Provider stellt eine benutzerdefinierte Thinking-Abstufung oder ein binäres Label für ausgewählte Modelle bereit                                                                 |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für den Ein/Aus-Reasoning-Schalter                                                                     | Provider stellt Thinking nur binär ein/aus bereit                                                                                                  |
| 33  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning                                                                   | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für den Standard-`/think`-Level                                                                      | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                                      |
| 35  | `isModernModelRef`                | Modern-Model-Matcher für Live-Profilfilter und Smoke-Auswahl                                              | Provider besitzt das Matching bevorzugter Modelle für Live-/Smoke-Läufe                                                                                             |
| 36  | `prepareRuntimeAuth`              | Tauscht konfigurierte Anmeldedaten direkt vor der Inferenz gegen das tatsächliche Runtime-Token/den tatsächlichen Runtime-Schlüssel aus                       | Provider benötigt einen Token-Austausch oder kurzlebige Anfrage-Anmeldedaten                                                                             |
| 37  | `resolveUsageAuth`                | Nutzungs-/Abrechnungs-Zugangsdaten für `/usage` und zugehörige Statusoberflächen auflösen                                     | Provider benötigt benutzerdefiniertes Token-Parsing für Nutzung/Kontingent oder andere Nutzungs-Zugangsdaten                                                               |
| 38  | `fetchUsageSnapshot`              | Provider-spezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde                             | Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Payload-Parser                                                                           |
| 39  | `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Speicher/Suche erstellen                                                     | Das Embedding-Verhalten für Speicher gehört in das Provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptbehandlung für den Provider steuert                                        | Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach der generischen Transkriptbereinigung umschreiben                                                        | Provider benötigt Provider-spezifische Replay-Umschreibungen über gemeinsame Compaction-Helfer hinaus                                                             |
| 42  | `validateReplayTurns`             | Abschließende Replay-Turn-Validierung oder Umformung vor dem eingebetteten Runner                                           | Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                                    |
| 43  | `onModelSelected`                 | Provider-eigene Nebeneffekte nach der Auswahl ausführen                                                                 | Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und durchlaufen dann andere hook-fähige Provider-Plugins,
bis eines tatsächlich die Modell-ID oder den Transport bzw. die Konfiguration ändert. Dadurch
funktionieren Alias-/Kompatibilitäts-Provider-Shims weiterhin, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Family-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurations-Normalizer weiterhin
diese Kompatibilitätsbereinigung an.

Wenn der Provider ein vollständig eigenes Übertragungsprotokoll oder einen eigenen Request-Executor benötigt,
ist das eine andere Klasse von Plugin. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin in OpenClaws normaler Inferenzschleife läuft.

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

Gebündelte Provider-Plugins kombinieren die obigen Hooks, damit sie zum Katalog,
zur Authentifizierung, zum Thinking, zum Replay und zu den Nutzungsanforderungen jedes Vendors passen. Der maßgebliche Hook-Satz liegt bei
jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Formen, anstatt
die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor OpenClaws statischem Katalog bereitstellen können.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration zu besitzen.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Gemeinsam benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern, sich über
    `buildReplayPolicy` für Transkript-Richtlinien anzumelden, statt dass jedes Plugin
    die Bereinigung erneut implementiert.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb des öffentlichen
    `api.ts`- / `contract-api.ts`-Seams des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) und nicht im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Runtime-Helfer

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Nutzlast für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider neu abtasten/codieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für vom Vendor verantwortete Voice-Picker oder Einrichtungsabläufe.
- Voice-Listen können umfangreichere Metadaten wie Locale, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
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
- Verwenden Sie Speech-Provider für vom Vendor verantwortetes Syntheseverhalten.
- Die alte Microsoft-`edge`-Eingabe wird zur Provider-ID `microsoft` normalisiert.
- Das bevorzugte Besitzmodell ist unternehmensbezogen: Ein Vendor-Plugin kann
  Text-, Speech-, Image- und künftige Medien-Provider besitzen, wenn OpenClaw diese
  Capability-Verträge ergänzt.

Für Bild-/Audio-/Video-Verständnis registrieren Plugins einen typisierten
Media-Understanding-Provider statt einer generischen Key/Value-Sammlung:

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
  Ergebnisfelder, neue optionale Capabilities.
- Video-Generierung folgt bereits demselben Muster:
  - Core besitzt den Capability-Vertrag und den Runtime-Helfer
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins nutzen `api.runtime.videoGeneration.*`

Für Media-Understanding-Runtime-Helfer können Plugins aufrufen:

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
  Bild-/Audio-/Video-Verständnis.
- Verwendet die Core-Media-Understanding-Audiokonfiguration (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
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

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Betreiber dies mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktivieren.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Nicht vertrauenswürdige Plugin-Subagent-Läufe funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der ID des erstellenden Plugins markiert. Der Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebige Sitzungslöschung erfordert weiterhin eine admin-berechtigte Gateway-Anfrage.

Für Websuche können Plugins den gemeinsamen Runtime-Helfer nutzen, statt
in die Verdrahtung des Agenten-Tools zu greifen:

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
- Verwenden Sie Websuche-Provider für vendor-spezifische Such-Transporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Agenten-Tool-Wrapper abzuhängen.

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

- `generate(...)`: Generiert ein Bild mithilfe der konfigurierten Kette von Image-Generation-Providern.
- `listProviders(...)`: Listet verfügbare Image-Generation-Provider und deren Capabilities auf.

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
- `handler`: Gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte `path + match`-Konflikte werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Behalten Sie `exact`/`prefix`-Fallthrough-Ketten ausschließlich auf derselben Authentifizierungsstufe.
- `auth: "plugin"`-Routen erhalten **nicht** automatisch Operator-Runtime-Scopes. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- `auth: "gateway"`-Routen laufen innerhalb eines Gateway-Anfrage-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` an einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei diesen identitätsführenden Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Nehmen Sie nicht an, dass eine Gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route Admin-only-Verhalten benötigt, verlangen Sie einen identitätsführenden Authentifizierungsmodus und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Plugin SDK-Importpfade

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade statt des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Zentrale Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für Plugin-Registrierung                 |
| `openclaw/plugin-sdk/channel-core`  | Hilfen für Channel-Einstieg/Build                  |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfen und Umbrella-Vertrag  |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf einem
einzigen `approvalCapability`-Vertrag konsolidiert werden, statt über nicht verwandte
Plugin-Felder hinweg gemischt zu werden. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurationshilfen befinden sich unter passenden fokussierten `*-runtime`-Unterpfaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` usw.). Bevorzugen Sie `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation`
statt des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro gebündeltem Plugin-Package-Root):

- `index.js` — Einstieg für gebündeltes Plugin
- `api.js` — Barrel für Hilfen/Typen
- `runtime-api.js` — reines Runtime-Barrel
- `setup-entry.js` — Setup-Plugin-Einstieg

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Packages aus Core oder aus einem anderen Plugin.
Über Fassaden geladene Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot, falls einer
existiert, und fallen dann auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich auf sie verlassen.

## Message-Tool-Schemas

Plugins sollten Channel-spezifische `describeMessageTool(...)`-Schema-
Beiträge für Nicht-Nachrichten-Primitive wie Reaktionen, Lesebestätigungen und Umfragen besitzen.
Gemeinsame Sendepräsentation sollte den generischen `MessagePresentation`-Vertrag
statt provider-nativer Button-, Komponenten-, Block- oder Kartenfelder verwenden.
Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für angepinnte Zustellanfragen

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Legen Sie keine provider-nativen UI-Ausweichpfade aus dem generischen Message-Tool offen.
Veraltete SDK-Hilfen für alte native Schemas bleiben für bestehende Drittanbieter-
Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten Channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt zur ID-ähnlichen Auflösung springen soll, statt die Verzeichnissuche zu verwenden.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine finale Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Provider-spezifische Konstruktion
  der Session-Route, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor dem
  Suchen von Peers/Gruppen stattfinden sollen.
- Verwenden Sie `looksLikeId` für Prüfungen wie „diese Eingabe als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifischen Normalisierungs-Fallback, nicht für
  breite Verzeichnissuche.
- Halten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs in `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Hilfen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- account-bezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfen in `directory-runtime` behandeln nur generische Operationen:

- Abfragefilterung
- Anwendung von Limits
- Deduplizierungs-/Normalisierungshilfen
- Erstellen von `ChannelDirectoryEntry[]`

Channel-spezifische Account-Inspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Basis-URL-
Standardwerte oder auth-geschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Read-only-Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf annehmen, dass Anmeldedaten
  vollständig materialisiert sind, und schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Read-only-Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Config-
  Reparaturabläufe sollten keine Runtime-Anmeldedaten materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur beschreibenden Account-Status zurück.
- Bewahren Sie `enabled` und `configured`.
- Fügen Sie relevante Felder für Quelle/Status von Anmeldedaten ein, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um Read-only-
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (und dem passenden Quellfeld)
  genügt für statusartige Befehle.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert,
  aber im aktuellen Befehlspfad nicht verfügbar sind.

So können Read-only-Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert auszuweisen.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Erweiterungen auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie diese in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach Symlink-Auflösung innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Package-Verzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Dev-Abhängigkeiten zur Runtime) und ignoriert geerbte globale npm-Installations-
Einstellungen. Halten Sie Plugin-Abhängigkeitsbäume „pure JS/TS“ und vermeiden Sie Packages, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges, nur für Setup bestimmtes Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch unkonfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegs. Das hält Start und Setup leichter,
wenn Ihr Haupt-Plugin-Einstieg auch Tools, Hooks oder anderen nur zur Runtime verwendeten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin während der Pre-Listen-Startphase des Gateways für denselben `setupEntry`-Pfad anmelden,
selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche, die vor dem
Beginn des Lauschens durch den Gateway existieren muss, vollständig abdeckt. In der Praxis bedeutet das,
dass der Setup-Eintrag jede vom Channel besessene Fähigkeit registrieren muss, von der der Startup abhängt, etwa:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Einstieg weiterhin eine erforderliche Startup-Fähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw den
vollständigen Einstieg während des Startups laden.

Gebündelte Channels können außerdem nur für Setup gedachte Vertragshilfen veröffentlichen, die Core
abfragen kann, bevor die vollständige Channel-Runtime geladen ist. Die aktuelle Setup-
Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Schnittstelle, wenn eine Legacy-Konfiguration eines Einzelkonto-Kanals in `channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Eintrag zu laden. Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein benanntes hochgestuftes Konto, wenn benannte Konten bereits vorhanden sind, und kann einen konfigurierten nicht-kanonischen Standardschlüssel für das Konto beibehalten, statt immer `accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Erkennung gebündelter Vertragsschnittstellen lazy. Die Importzeit bleibt gering; die Hochstufungsschnittstelle wird erst bei der ersten Verwendung geladen, statt beim Modulimport den Start des gebündelten Kanals erneut auszulösen.

Wenn diese Startschnittstellen Gateway-RPC-Methoden enthalten, behalten Sie sie unter einem Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

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

Nützliche `openclaw.channel`-Felder über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Kopiesteuerungen für Auswahloberflächen
- `markdownCapable`: markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal in Oberflächen zur Auflistung konfigurierter Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal in interaktiven Setup-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal als intern/privat für Dokumentations-Navigationsoberflächen
- `showConfigured` / `showInSetup`: Legacy-Aliase, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: bindet den Kanal in den standardmäßigen Quickstart-`allowFrom`-Ablauf ein
- `forceAccountBinding`: erfordert explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist
- `preferSessionLookupForAnnounceTarget`: bevorzugt Sitzungs-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann auch **externe Kanalkataloge** zusammenführen, zum Beispiel einen MPM-Registry-Export. Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliase für den Schlüssel `"entries"`.

Generierte Kanalkatalogeinträge und Provider-Installationskatalogeinträge stellen normalisierte Fakten zur Installationsquelle neben dem rohen `openclaw.install`-Block bereit. Die normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version oder ein flexibler Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob auch ein lokaler Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die normalisierten Fakten, falls der geparste npm-Paketname von dieser Identität abweicht. Sie warnen auch, wenn `defaultChoice` ungültig ist oder auf eine nicht verfügbare Quelle zeigt, sowie wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind. Verbraucher sollten `installSource` als additives optionales Feld behandeln, damit manuell erstellte Einträge und Katalog-Shims es nicht synthetisieren müssen. Dadurch können Onboarding und Diagnosen den Zustand der Quellenebene erklären, ohne die Plugin-Runtime zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus `expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus Kompatibilitätsgründen weiterhin, erzeugen aber Warnungen auf der Quellenebene, damit sich der Katalog in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu beschädigen. Wenn das Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen verwalteten Plugin-Indexeintrag mit `source: "path"` und, wenn möglich, einem Workspace-relativen `sourcePath` auf. Der absolute operative Ladepfad bleibt in `plugins.load.paths`; der Installationseintrag vermeidet es, lokale Workstation-Pfade in langfristige Konfigurationen zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für Diagnosen auf der Quellenebene sichtbar, ohne eine zweite Offenlegungsoberfläche für rohe Dateisystempfade hinzuzufügen. Der persistierte Plugin-Index `plugins/installs.json` ist die maßgebliche Installationsquelle und kann aktualisiert werden, ohne Plugin-Runtime-Module zu laden. Seine `installRecords`-Map ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder ungültig ist; sein `plugins`-Array ist eine neu aufbaubare Manifestansicht.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Sitzungskontexts für Ingest, Assembly und Compaction. Registrieren Sie sie aus Ihrem Plugin mit `api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit `plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss, statt nur Speichersuche oder Hooks hinzuzufügen.

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

Die Factory `ctx` stellt optionale Werte `config`, `agentDir` und `workspaceDir` für die Initialisierung zur Erstellungszeit bereit.

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

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie das Plugin-System nicht mit einem privaten Zugriff nach innen. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. Definieren Sie den Core-Vertrag
   Entscheiden Sie, welches gemeinsame Verhalten Core besitzen soll: Policy, Fallback, Zusammenführung von Konfiguration, Lebenszyklus, kanalbezogene Semantik und Form der Runtime-Hilfsfunktionen.
2. Fügen Sie typisierte Plugin-Registrierungs-/Runtime-Schnittstellen hinzu
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche typisierte Capability-Schnittstelle.
3. Verdrahten Sie Core- und Kanal-/Feature-Verbraucher
   Kanäle und Feature-Plugins sollten die neue Capability über Core verwenden, nicht durch direkten Import einer Anbieterimplementierung.
4. Registrieren Sie Anbieterimplementierungen
   Anbieter-Plugins registrieren dann ihre Backends für die Capability.
5. Fügen Sie Vertragsabdeckung hinzu
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne hart an die Weltsicht eines einzelnen Providers gebunden zu werden. Siehe das [Capability-Cookbook](/de/plugins/architecture) für eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel.

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung in der Regel diese Oberflächen gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner-/Runtime-Hilfsfunktion in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsschnittstelle in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Runtime-Offenlegung in `src/plugins/runtime/*`, wenn Feature-/Kanal-Plugins sie verwenden müssen
- Capture-/Test-Hilfsfunktionen in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertragsassertionen in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das in der Regel ein Zeichen dafür, dass die Capability noch nicht vollständig integriert ist.

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
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Kanal-Plugins verwenden Runtime-Hilfsfunktionen
- Vertragstests halten Ownership explizit

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
