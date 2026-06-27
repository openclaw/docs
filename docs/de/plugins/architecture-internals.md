---
read_when:
    - Provider-Runtime-Hooks, Kanal-Lebenszyklus oder Paket-Packs implementieren
    - Debugging der Plugin-Ladereihenfolge oder des Registry-Zustands
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Kontext-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-06-27T17:44:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Für das öffentliche Capability-Modell, Plugin-Formen und Eigentums-/Ausführungsverträge siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die Referenz für die internen Mechaniken: Lade-Pipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start macht OpenClaw ungefähr Folgendes:

1. Kandidaten für Plugin-Roots ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   lokaler TypeScript-Quellcode von Drittanbietern verwendet den Notfall-Fallback Jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten werden blockiert,
wenn der Eintrag aus dem Plugin-Root ausbricht, der Pfad für alle beschreibbar ist oder die
Pfad-Eigentümerschaft bei nicht gebündelten Plugins verdächtig wirkt.

Blockierte Kandidaten bleiben für Diagnosen an ihre Plugin-ID gebunden. Wenn die Konfiguration
weiterhin auf diese ID verweist, meldet die Validierung das Plugin als vorhanden, aber blockiert,
und verweist zurück auf die Pfadsicherheitswarnung, statt den Konfigurationseintrag als veraltet
zu behandeln.

### Manifest-zuerst-Verhalten

Das Manifest ist die maßgebliche Control-Plane-Quelle. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschemas oder Bundle-Capabilities zu ermitteln
- `plugins.entries.<id>.config` zu validieren
- Control-UI-Labels/Platzhalter zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Einrichtungsdeskriptoren zu erhalten, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Einrichtungserkennung;
sie ersetzen keine Runtime-Registrierung, `register(...)` oder `setupEntry`.
Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Channels und Providern,
um das Laden von Plugins vor einer breiteren Registry-Materialisierung einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Channel-Einrichtung/Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte
  Channel-ID gehört
- explizite Provider-Einrichtung/Runtime-Auflösung wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört
- Gateway-Startplanung verwendet `activation.onStartup` für explizite Startimporte
  und Start-Opt-outs; Plugins ohne Startmetadaten laden nur
  über engere Aktivierungsauslöser

Request-Time-Runtime-Preloads, die den breiten Scope `all` anfordern, leiten weiterhin eine
explizite effektive Plugin-ID-Menge aus Konfiguration, Startplanung, konfigurierten
Channels, Slots und Auto-Enable-Regeln ab. Wenn diese abgeleitete Menge leer ist, lädt OpenClaw
eine leere Runtime-Registry, statt auf jedes auffindbare Plugin zu erweitern.

Der Aktivierungsplaner stellt sowohl eine Nur-IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite `activation.*`-Planerhinweise von Manifest-Eigentümer-Fallbacks wie
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Aufteilung der Gründe ist die Kompatibilitätsgrenze:
bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Semantik des Runtime-Ladens zu ändern.

Die Einrichtungserkennung bevorzugt jetzt deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Runtime-Hooks zur Einrichtungszeit benötigen. Provider-
Einrichtungslisten verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete
Einrichtungsoptionen und Installationskatalog-Metadaten, ohne die Provider-Runtime zu laden. Explizites
`setup.requiresRuntime: false` ist eine reine Deskriptor-Grenze; ein ausgelassenes
`requiresRuntime` behält den Legacy-`setup-api`-Fallback zur Kompatibilität bei. Wenn mehr
als ein gefundenes Plugin dieselbe normalisierte Einrichtungs-Provider- oder CLI-
Backend-ID beansprucht, verweigert die Einrichtungssuche den mehrdeutigen Eigentümer, statt sich auf
die Erkennungsreihenfolge zu verlassen. Wenn die Einrichtungs-Runtime ausgeführt wird, melden Registry-Diagnosen
Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-
Backends, die von setup-api registriert wurden, ohne Legacy-Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw cached Plugin-Erkennungsergebnisse oder direkte Manifest-Registry-Daten nicht
hinter Zeitfenstern. Installationen, Manifest-Bearbeitungen und Änderungen an Ladepfaden
müssen beim nächsten expliziten Metadatenlesen oder Snapshot-Neuaufbau sichtbar werden.
Der Manifest-Dateiparser darf einen begrenzten Dateisignatur-Cache halten, der nach dem
geöffneten Manifestpfad, Inode, Größe und Zeitstempeln indiziert ist; dieser Cache vermeidet nur
das erneute Parsen unveränderter Bytes und darf keine Erkennungs-, Registry-, Eigentümer- oder
Policy-Antworten cachen.

Der sichere schnelle Metadatenpfad ist explizite Objekteigentümerschaft, kein versteckter Cache.
Gateway-Start-Hot-Paths sollten den aktuellen `PluginMetadataSnapshot`, die
abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die Aufrufkette
reichen. Konfigurationsvalidierung, Start-Auto-Enable, Plugin-Bootstrap und Provider-
Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und das
Plugin-Inventar darstellen. Die Einrichtungssuche rekonstruiert Manifest-Metadaten weiterhin bei Bedarf,
sofern der konkrete Einrichtungspfad keine explizite Manifest-Registry erhält; behalten Sie dies
als Cold-Path-Fallback bei, statt versteckte Lookup-Caches hinzuzufügen. Wenn sich die Eingabe
ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu mutieren oder
historische Kopien zu behalten.
Sichten auf die aktive Plugin-Registry und gebündelte Channel-Bootstrap-Helfer
sollten aus der aktuellen Registry/dem aktuellen Root neu berechnet werden. Kurzlebige Maps sind
innerhalb eines einzelnen Aufrufs in Ordnung, um Arbeit zu deduplizieren oder Wiedereintritt abzusichern; sie
dürfen nicht zu Prozess-Metadaten-Caches werden.

Beim Plugin-Laden ist die persistente Cache-Schicht das Runtime-Laden. Sie darf
Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, zum Beispiel:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registries
- jiti-/Modul-Caches und Public-Surface-Loader-Caches, die verwendet werden, um zu vermeiden,
  dieselbe Runtime-Oberfläche wiederholt zu importieren
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Data-Plane-Implementierungsdetails. Sie dürfen keine Control-Plane-
Fragen wie „Welchem Plugin gehört dieser Provider?“ beantworten, es sei denn, der
Aufrufer hat absichtlich Runtime-Laden angefordert.

Fügen Sie keine persistenten oder zeitfensterbasierten Caches hinzu für:

- Erkennungsergebnisse
- direkte Manifest-Registries
- Manifest-Registries, die aus dem installierten Plugin-Index rekonstruiert wurden
- Provider-Eigentümer-Lookup, Modellunterdrückung, Provider-Policy oder Metadaten zu öffentlichen Artefakten
- jede andere aus dem Manifest abgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index
  oder ein Ladepfad beim nächsten Metadatenlesen sichtbar sein sollte

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
- Channels
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

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul als Sonderfall behandeln“.

## Callbacks für Conversation Bindings

Plugins, die eine Conversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
Anforderung genehmigt oder abgelehnt wurde:

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
- `binding`: das aufgelöste Binding für genehmigte Anforderungen
- `request`: die ursprüngliche Anforderungszusammenfassung, der Detach-Hinweis, die Sender-ID und
  Conversation-Metadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Conversation binden darf, und er läuft, nachdem die Core-Genehmigungsverarbeitung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Schichten:

- **Manifest-Metadaten** für günstige Pre-Runtime-Lookups:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Konfigurationszeit-Hooks**: `catalog` (Legacy-`discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: mehr als 40 optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Wrapping, Thinking Levels, Replay-Policy und Nutzungsendpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Nutzung](#hook-order-and-usage).

OpenClaw besitzt weiterhin den generischen Agent-Loop, Failover, Transcript-Verarbeitung und
Tool-Policy. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne einen vollständig eigenen Inferenztransport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider umgebungsbasierte
Anmeldedaten hat, die generische Auth-/Status-/Modellpicker-Pfade sehen sollten, ohne
die Plugin-Runtime zu laden. Das veraltete `providerAuthEnvVars` wird während des
Deprecation-Fensters weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins,
die es verwenden, erhalten eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die Umgebungsvariablen, Auth-Profile,
konfigurationsgestützte Authentifizierung und API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-
`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-Oberflächen die
Choice-ID des Providers, Gruppenlabels und einfache One-Flag-Auth-Verdrahtung kennen sollen, ohne
die Provider-Runtime zu laden. Behalten Sie Provider-Runtime-
`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Channel umgebungsgetriebene Authentifizierung oder Einrichtung hat, die
generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Einrichtungs-Prompts sehen sollten,
ohne die Channel-Runtime zu laden.

### Hook-Reihenfolge und Nutzung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.
Nur der Kompatibilität dienende Provider-Felder, die OpenClaw nicht mehr aufruft, wie
`ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht
aufgeführt.

| #   | Hook                              | Was er macht                                                                                                  | Wann verwenden                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht Provider-Konfiguration während der `models.json`-Generierung in `models.providers`             | Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                                |
| 2   | `applyConfigDefaults`             | Wendet Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung an       | Standardwerte hängen vom Auth-Modus, von der Umgebung oder von Provider-Modellfamilien-Semantik ab                                                 |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                   | _(kein Plugin-Hook)_                                                                                                                               |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Preview-Modell-ID-Aliasse vor der Suche                                             | Provider besitzt die Alias-Bereinigung vor der kanonischen Modellauflösung                                                                         |
| 4   | `normalizeTransport`              | Normalisiert Provider-Familien-`api` / `baseUrl` vor der generischen Modellzusammenstellung                   | Provider besitzt die Transportbereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                        |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor Runtime-/Provider-Auflösung                                          | Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helfer sichern außerdem unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet native Kompatibilitätsumschreibungen für Streaming-Nutzung auf Konfigurations-Provider an              | Provider benötigt endpoint-gesteuerte Korrekturen für native Streaming-Nutzungsmetadaten                                                          |
| 7   | `resolveConfigApiKey`             | Löst Env-Marker-Auth für Konfigurations-Provider vor dem Laden der Runtime-Auth auf                           | Provider stellen eigene Hooks zur API-Schlüssel-Auflösung über Env-Marker bereit                                                                   |
| 8   | `resolveSyntheticAuth`            | Macht lokale/self-hosted oder konfigurationsgestützte Auth sichtbar, ohne Klartext dauerhaft zu speichern     | Provider kann mit einem synthetischen/lokalen Anmeldedaten-Marker arbeiten                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Überlagert Provider-eigene externe Auth-Profile; Standard-`persistence` ist `runtime-only` für CLI-/App-eigene Anmeldedaten | Provider verwendet externe Auth-Anmeldedaten wieder, ohne kopierte Refresh-Token dauerhaft zu speichern; `contracts.externalAuthProviders` im Manifest deklarieren |
| 10  | `shouldDeferSyntheticProfileAuth` | Ordnet gespeicherte synthetische Profil-Platzhalter hinter env-/konfigurationsgestützter Auth ein             | Provider speichert synthetische Platzhalterprofile, die keinen Vorrang erhalten sollten                                                           |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind               | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                                  |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                         |
| 13  | `normalizeResolvedModel`          | Finale Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                            | Provider benötigt Transportumschreibungen, nutzt aber weiterhin einen Core-Transport                                                              |
| 14  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie sieht                                            | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                      |
| 15  | `inspectToolSchemas`              | Macht Provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar                                       | Provider möchte Keyword-Warnungen, ohne dem Core Provider-spezifische Regeln beizubringen                                                        |
| 16  | `resolveReasoningOutputMode`      | Wählt nativen gegenüber getaggtem Reasoning-Output-Vertrag                                                    | Provider benötigt getaggtes Reasoning/finale Ausgabe statt nativer Felder                                                                          |
| 17  | `prepareExtraParams`              | Request-Parameter-Normalisierung vor generischen Stream-Options-Wrappern                                      | Provider benötigt Standard-Request-Parameter oder Parameterbereinigung pro Provider                                                               |
| 18  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                        | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                                 |
| 20  | `wrapStreamFn`                    | Stream-Wrapper nach Anwendung generischer Wrapper                                                             | Provider benötigt Kompatibilitäts-Wrapper für Request-Header/-Body/-Modell ohne benutzerdefinierten Transport                                    |
| 21  | `resolveTransportTurnState`       | Hängt native Transport-Header oder Metadaten pro Turn an                                                      | Provider möchte, dass generische Transporte Provider-native Turn-Identität senden                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder Session-Cool-down-Policy an                                                | Provider möchte generische WS-Transporte für Session-Header oder Fallback-Policy abstimmen                                                       |
| 23  | `formatApiKey`                    | Auth-Profil-Formatter: gespeichertes Profil wird zur Runtime-`apiKey`-Zeichenfolge                            | Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                             |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehler-Policy                    | Provider passt nicht zu den gemeinsamen OpenClaw-Refreshern                                                                                        |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Provider benötigt Provider-eigene Auth-Reparaturanleitung nach Refresh-Fehler                                                                     |
| 26  | `matchesContextOverflowError`     | Provider-eigener Matcher für Kontextfensterüberlauf                                                           | Provider hat rohe Überlauffehler, die generische Heuristiken übersehen würden                                                                     |
| 27  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                          | Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                                 |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Policy für Proxy-/Backhaul-Provider                                                              | Provider benötigt Proxy-spezifisches Gating für Cache-TTL                                                                                         |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                      | Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Auth                                                       |
| 30  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Discovery angehängt werden                                    | Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahllisten                                                          |
| 31  | `resolveThinkingProfile`          | Modellspezifische `/think`-Levelmenge, Anzeigelabels und Standardwert                                         | Provider stellt eine benutzerdefinierte Thinking-Leiter oder ein binäres Label für ausgewählte Modelle bereit                                    |
| 32  | `isBinaryThinking`                | Kompatibilitäts-Hook für Ein/Aus-Reasoning-Umschalter                                                         | Provider stellt nur binäres Thinking ein/aus bereit                                                                                               |
| 33  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                      | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für Standard-`/think`-Level                                                              | Provider besitzt die Standard-`/think`-Policy für eine Modellfamilie                                                                              |
| 35  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                           | Provider besitzt Matching für bevorzugte Live-/Smoke-Modelle                                                                                      |
| 36  | `prepareRuntimeAuth`              | Tauscht konfigurierte Anmeldedaten unmittelbar vor der Inferenz gegen das tatsächliche Runtime-Token/den tatsächlichen Runtime-Schlüssel | Provider benötigt einen Token-Austausch oder kurzlebige Request-Anmeldedaten                                                                      |
| 37  | `resolveUsageAuth`                | Löst Nutzungs-/Abrechnungsanmeldedaten für `/usage` und verwandte Statusoberflächen auf                       | Provider benötigt benutzerdefiniertes Parsen von Nutzungs-/Kontingent-Token oder andere Nutzungsanmeldedaten                                     |
| 38  | `fetchUsageSnapshot`              | Provider-spezifische Nutzungs-/Kontingent-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde | Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Payload-Parser                                                           |
| 39  | `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Memory/Suche erstellen                                            | Memory-Embedding-Verhalten gehört zum Provider-Plugin                                                                                         |
| 40  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptverarbeitung für den Provider steuert                    | Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                                  |
| 41  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transkriptbereinigung umschreiben                                              | Provider benötigt Provider-spezifische Replay-Umschreibungen über gemeinsame Compaction-Hilfsfunktionen hinaus                                |
| 42  | `validateReplayTurns`             | Abschließende Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                         | Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                           |
| 43  | `onModelSelected`                 | Provider-eigene Nebeneffekte nach der Auswahl ausführen                                                       | Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                        |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
übereinstimmende Provider-Plugin und fallen dann auf andere hook-fähige
Provider-Plugins zurück, bis eines tatsächlich die Modell-ID oder
Transport/Konfiguration ändert. Dadurch funktionieren
Alias-/Kompatibilitäts-Provider-Shims weiter, ohne dass der Aufrufer wissen muss,
welches gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen
unterstützten Konfigurationseintrag der Google-Familie umschreibt, wendet der
gebündelte Google-Konfigurationsnormalisierer diese Kompatibilitätsbereinigung
weiterhin an.

Wenn der Provider ein vollständig eigenes Wire-Protokoll oder einen eigenen
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese
Hooks sind für Provider-Verhalten gedacht, das weiterhin in OpenClaws normalem
Inference-Loop läuft.

`resolveUsageAuth` entscheidet, ob OpenClaw `fetchUsageSnapshot` aufrufen oder
für Nutzungs-/Status-Oberflächen auf die generische Anmeldedatenauflösung
zurückfallen soll. Geben Sie `{ token, accountId? }` zurück, wenn der Provider
Nutzungsanmeldedaten hat, geben Sie `{ handled: true }` zurück, wenn
provider-eigene Nutzungsauthentifizierung die Anfrage verarbeitet hat und den
generischen API-Key-/OAuth-Fallback unterdrücken muss, und geben Sie `null` oder
`undefined` zurück, wenn der Provider die Nutzungsauthentifizierung nicht
verarbeitet hat.

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

Gebündelte Provider-Plugins kombinieren die oben genannten Hooks, um zu Katalog,
Authentifizierung, Thinking, Replay und Nutzungsanforderungen der jeweiligen
Anbieter zu passen. Der maßgebliche Hook-Satz liegt bei jedem Plugin unter
`extensions/`; diese Seite veranschaulicht die Formen, statt die Liste zu
spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-Modell-IDs
    vor OpenClaws statischem Katalog verfügbar machen können.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration zu besitzen.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Gemeinsame benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern, sich
    über `buildReplayPolicy` in Transcript-Richtlinien einzuklinken, statt dass
    jedes Plugin die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen den gemeinsamen
    Inference-Loop.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen in der öffentlichen
    `api.ts`- / `contract-api.ts`-Seam des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider resamplen/encodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für anbieter-eigene Sprachauswahlen oder Setup-Flows.
- Sprachlisten können reichere Metadaten wie Locale, Geschlecht und Persönlichkeits-Tags für provider-bewusste Auswahlen enthalten.
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
- Verwenden Sie Speech-Provider für anbieter-eigenes Syntheseverhalten.
- Legacy-Microsoft-`edge`-Eingabe wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Besitzmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Speech-, Image- und künftige Media-Provider besitzen, während OpenClaw
  diese Capability-Verträge hinzufügt.

Für Bild-/Audio-/Video-Verstehen registrieren Plugins einen typisierten
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
- Belassen Sie anbieter-spezifisches Verhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Videoerzeugung folgt bereits demselben Muster:
  - Core besitzt den Capability-Vertrag und Runtime-Helfer
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
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
  Bild-/Audio-/Video-Verstehen.
- `extractStructuredWithModel(...)` ist die plugin-seitige Seam für begrenzte,
  provider-eigene, image-first Extraktion. Fügen Sie mindestens eine Bildeingabe hinzu;
  Texteingaben sind ergänzender Kontext.
  Produkt-Plugins besitzen ihre Routen und Schemas, während OpenClaw die
  Provider-/Runtime-Grenze besitzt.
- Verwendet Core-Media-Understanding-Audiokonfiguration (`tools.media.audio`) und Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel übersprungene/nicht unterstützte Eingabe).
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

- `provider` und `model` sind optionale Overrides pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Subagent-Läufe nicht vertrauenswürdiger Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend zurückzufallen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der ID des erstellenden Plugins getaggt. Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; beliebiges Löschen von Sitzungen erfordert weiterhin eine admin-skopierte Gateway-Anfrage.

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

Plugins können außerdem Websuche-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Belassen Sie Provider-Auswahl, Anmeldedatenauflösung und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuche-Provider für anbieter-spezifische Suchtransporte.
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

- `generate(...)`: Erzeugt ein Bild mithilfe der konfigurierten Image-Generation-Provider-Kette.
- `listProviders(...)`: Listet verfügbare Image-Generation-Provider und ihre Capabilities auf.

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
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für Plugin-verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` ausdrücklich deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, außer bei `replaceExisting: true`; ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Behalten Sie `exact`/`prefix`-Fallthrough-Ketten nur auf derselben Authentifizierungsstufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Operator-Laufzeitbereiche. Sie sind für Plugin-verwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Laufzeitbereichs, aber dieser Bereich ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Laufzeitbereiche von Plugin-Routen auf `operator.write` fixiert, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header ausdrücklich vorhanden ist
  - fehlt `x-openclaw-scopes` bei diesen identitätstragenden Plugin-Routen-Anfragen, fällt der Laufzeitbereich auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route nur Admin-Verhalten benötigt, verlangen Sie einen identitätstragenden Authentifizierungsmodus und dokumentieren Sie den ausdrücklichen Header-Vertrag für `x-openclaw-scopes`.

## Plugin-SDK-Importpfade

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade statt des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Kern-Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`  | Hilfen für Channel-Einstieg und -Erstellung        |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfen und Rahmenvertrag     |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema für Root-`openclaw.json` (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf einem
einzigen `approvalCapability`-Vertrag konsolidiert werden, statt über nicht
zusammenhängende Plugin-Felder gemischt zu werden. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurationshilfen liegen unter passenden fokussierten
`*-runtime`-Unterpfaden (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`,
`heartbeat-runtime`, `channel-activity-runtime` usw.). Bevorzugen Sie
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und
`config-mutation` statt des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
kleine Channel-Hilfsfassaden, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (je gebündeltem Plugin-Paket-Root):

- `index.js` — Einstieg für gebündelte Plugins
- `api.js` — Barrel für Hilfen/Typen
- `runtime-api.js` — nur Laufzeit-Barrel
- `setup-entry.js` — Setup-Plugin-Einstieg

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals `src/*` eines anderen Plugin-Pakets aus Core oder aus einem anderen Plugin.
Über Fassaden geladene Einstiegspunkte bevorzugen den aktiven Laufzeit-Konfigurations-Snapshot, wenn einer
existiert, und fallen danach auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind
nicht automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-Referenzseite, wenn Sie sich auf sie verlassen.

## Nachrichtentool-Schemas

Plugins sollten Channel-spezifische Schema-Beiträge für
`describeMessageTool(...)` für Nicht-Nachrichten-Primitive wie Reaktionen,
Lesebestätigungen und Umfragen besitzen. Gemeinsame Sende-Präsentation sollte
den generischen `MessagePresentation`-Vertrag verwenden statt Provider-nativer
Button-, Komponenten-, Block- oder Kartenfelder. Siehe
[Nachrichtenpräsentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie darstellen können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zu angehefteter Zustellung

Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine Provider-nativen UI-Ausweichpfade aus dem generischen Nachrichtentool bereit.
Veraltete SDK-Hilfen für ältere native Schemas bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten Channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt Core mit, ob eine
  Eingabe direkt zur ID-artigen Auflösung gehen soll, statt eine Verzeichnissuche zu verwenden.
- `messaging.targetResolver.reservedLiterals` listet einfache Wörter auf, die
  Channel-/Sitzungsreferenzen für diesen Provider sind. Die Auflösung bewahrt konfigurierte
  Verzeichniseinträge, bevor reservierte Literale abgelehnt werden, und schlägt dann bei einem
  Verzeichnisfehler geschlossen fehl.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  Core nach der Normalisierung oder nach einem Verzeichnisfehler eine abschließende Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Provider-spezifische
  Konstruktion der Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor der
  Suche nach Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifischen Normalisierungs-Fallback, nicht für
  breite Verzeichnissuche.
- Halten Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  innerhalb von `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Hilfen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- durch Allowlist gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfen in `directory-runtime` behandeln nur generische Vorgänge:

- Abfragefilterung
- Anwendung von Limits
- Hilfen für Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Channel-spezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs,
Standardwerte für Basis-URLs oder authentifizierungsgeschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Plugins können außerdem schreibgeschützte Modellzeilen über
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` veröffentlichen. Dies ist der künftige Pfad für Listen-/Hilfe-/Auswahloberflächen und unterstützt
`text`-, `image_generation`-, `video_generation`- und `music_generation`-Zeilen.
Provider-Plugins besitzen weiterhin Live-Endpunktaufrufe, Token-Austausch und
Zuordnung von Vendor-Antworten; Core besitzt die gemeinsame Zeilenform,
Quellenlabels und Formatierung der Medientool-Hilfe. Registrierungen von
Mediengenerierungs-Providern synthetisieren automatisch statische Katalogzeilen
aus `defaultModel`, `models` und `capabilities`.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias, gibt aber eine Veraltungswarnung aus
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`
- `augmentModelCatalog` ist veraltet; gebündelte Provider sollten ergänzende
  Zeilen über `registerModelCatalogProvider` veröffentlichen

## Schreibgeschützte Channel-Prüfung

Wenn Ihr Plugin einen Channel registriert, implementieren Sie bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurations-
  Reparaturabläufe sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur beschreibenden Kontostatus zurück.
- Bewahren Sie `enabled` und `configured`.
- Fügen Sie bei Bedarf Felder für Quelle/Status von Zugangsdaten hinzu, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` (und das passende Quellenfeld)
  reicht für Statusbefehle aus.
- Verwenden Sie `configured_unavailable`, wenn Zugangsdaten per SecretRef konfiguriert,
  aber im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad
nicht verfügbar“ melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

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

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach der Symlink-Auflösung innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Entwicklungsabhängigkeiten zur Laufzeit) und ignoriert geerbte globale npm-Installations­einstellungen.
Halten Sie Plugin-Abhängigkeitsbäume "reine JS/TS" und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges, nur für die Einrichtung bestimmtes Modul verweisen.
Wenn OpenClaw Einrichtungsoberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegs. Dadurch bleiben Start und Einrichtung schlanker,
wenn Ihr Haupt-Plugin-Einstieg auch Tools, Hooks oder anderen nur zur Laufzeit benötigten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin während der Pre-Listen-Startphase des Gateway in denselben
`setupEntry`-Pfad aufnehmen, auch wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die vorhanden sein muss,
bevor der Gateway zu lauschen beginnt. In der Praxis bedeutet das, dass der Einrichtungseinstieg
jede kanalverwaltete Capability registrieren muss, von der der Start abhängt, zum Beispiel:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Einstieg weiterhin eine erforderliche Start-Capability besitzt, aktivieren Sie
dieses Flag nicht. Belassen Sie das Plugin beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Einstieg während des Starts laden.

Gebündelte Kanäle können außerdem nur für die Einrichtung bestimmte Hilfsfunktionen für Vertragsoberflächen veröffentlichen, die Core
abfragen kann, bevor die vollständige Kanallaufzeit geladen wird. Die aktuelle Oberfläche für
Einrichtungs-Promotions ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core verwendet diese Oberfläche, wenn eine Legacy-Einzelkonto-Kanalkonfiguration
in `channels.<id>.accounts.*` überführt werden muss, ohne den vollständigen Plugin-Einstieg zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Authentifizierungs-/Bootstrap-Schlüssel in ein
benanntes promotetes Konto, wenn bereits benannte Konten existieren, und kann einen
konfigurierten nicht kanonischen Standardkonto-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Einrichtungs-Patch-Adapter halten die Erkennung gebündelter Vertragsoberflächen lazy. Die Importzeit
bleibt gering; die Promotionsoberfläche wird erst bei der ersten Verwendung geladen, statt
beim Modulimport erneut in den Start des gebündelten Kanals einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halten Sie sie unter einem
Plugin-spezifischen Präfix. Core-Administrationsnamespaces (`config.*`,
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

### Kanal-Katalogmetadaten

Kanal-Plugins können Einrichtungs-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekanntgeben. Dadurch bleibt der Core-Katalog datenfrei.

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
- `preferOver`: niedriger priorisierte Plugin-/Kanal-IDs, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Kopiersteuerungen für Auswahloberflächen
- `markdownCapable`: markiert den Kanal für ausgehende Formatierungsentscheidungen als Markdown-fähig
- `exposure.configured`: blendet den Kanal aus Oberflächen mit konfigurierten Kanallisten aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Einrichtungs-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal für Dokumentationsnavigationsoberflächen als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: nimmt den Kanal in den standardmäßigen Quickstart-`allowFrom`-Flow auf
- `forceAccountBinding`: erfordert eine explizite Kontobindung, auch wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen

OpenClaw kann außerdem **externe Kanalkataloge** zusammenführen (zum Beispiel einen MPM-
Registry-Export). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

Generierte Kanalkatalogeinträge und Provider-Installationskatalogeinträge stellen
normalisierte Fakten zur Installationsquelle neben dem rohen `openclaw.install`-Block bereit. Die
normalisierten Fakten identifizieren, ob die npm-Spezifikation eine exakte Version oder ein gleitender
Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob auch ein lokaler
Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die
normalisierten Fakten, falls der geparste npm-Paketname von dieser Identität abweicht.
Sie warnen außerdem, wenn `defaultChoice` ungültig ist oder auf eine Quelle verweist, die
nicht verfügbar ist, sowie wenn npm-Integritätsmetadaten ohne gültige npm-
Quelle vorhanden sind. Konsumenten sollten `installSource` als additives optionales Feld behandeln, damit
manuell erstellte Einträge und Katalog-Shims es nicht synthetisieren müssen.
Dadurch können Onboarding und Diagnose den Zustand der Source-Plane erklären, ohne
Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, erzeugen aber Source-Plane-Warnungen, damit der Katalog sich
in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu beschädigen.
Wenn Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen verwalteten Plugin-
Plugin-Indexeintrag mit `source: "path"` und, wenn möglich, einem workspace-relativen
`sourcePath` auf. Der absolute operative Ladepfad bleibt in
`plugins.load.paths`; der Installationsdatensatz vermeidet es, lokale Workstation-
Pfade in langlebige Konfiguration zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für
Source-Plane-Diagnosen sichtbar, ohne eine zweite rohe Offenlegungsoberfläche für Dateisystempfade
hinzuzufügen. Die persistierte SQLite-Zeile `installed_plugin_index` ist die
maßgebliche Installationsquelle und kann aktualisiert werden, ohne Plugin-Laufzeitmodule zu laden.
Ihre `installRecords`-Map ist dauerhaft, auch wenn ein Plugin-Manifest fehlt oder
ungültig ist; ihre `plugins`-Nutzlast ist eine neu aufbaubare Manifestansicht.

## Kontext-Engine-Plugins

Kontext-Engine-Plugins besitzen die Sitzungs-Kontextorchestrierung für Ingest, Assembly
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie anschließend die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss,
statt nur Speichersuche oder Hooks hinzuzufügen.

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

`assemble()` kann `contextProjection` zurückgeben, wenn das aktive Harness einen
persistenten Backend-Thread hat. Lassen Sie es für die Legacy-Projektion pro Turn weg. Geben Sie
`{ mode: "thread_bootstrap", epoch }` zurück, wenn der zusammengestellte Kontext einmal
in einen Backend-Thread injiziert und wiederverwendet werden soll, bis sich die Epoche ändert. Ändern Sie
die Epoche, nachdem sich der semantische Kontext der Engine geändert hat, etwa nach einem
Engine-eigenen Compaction-Durchlauf. Hosts können Tool-Call-Metadaten, Eingabeform
und redigierte Tool-Ergebnisse in einer Thread-Bootstrap-Projektion beibehalten, damit frische
Backend-Threads Tool-Kontinuität erhalten, ohne rohe geheimnistragende
Nutzlasten zu kopieren.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, halten Sie `compact()`
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

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Zugriff. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten Core besitzen soll: Policy, Fallback, Konfigurationszusammenführung,
   Lifecycle, kanalbezogene Semantik und Form von Laufzeit-Hilfsfunktionen.
2. typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. Core + Kanal-/Feature-Konsumenten verdrahten
   Kanäle und Feature-Plugins sollten die neue Capability über Core konsumieren,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends für die Capability.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Besitz und Registrierungsform über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne fest auf die Weltsicht eines einzelnen
Providers verdrahtet zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel finden Sie im [Capability Cookbook](/de/plugins/adding-capabilities).

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner-/Laufzeit-Hilfsfunktion in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Laufzeit-Exponierung in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie konsumieren müssen
- Erfassungs-/Test-Hilfsfunktionen in `src/test-utils/plugin-registration.ts`
- Besitz-/Vertragsassertionen in `src/plugins/contracts/registry.ts`
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

Muster für Vertragstests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Damit bleibt die Regel einfach:

- Core besitzt den Capability-Vertrag und die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Kanal-Plugins nutzen Runtime-Hilfsfunktionen
- Vertragstests halten die Zuständigkeit explizit

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
