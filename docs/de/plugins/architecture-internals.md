---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Channel-Lebenszyklus oder Paket-Bundles
    - Ladereihenfolge von Plugins oder Registry-Status debuggen
    - Hinzufügen einer neuen Plugin-Funktion oder eines Kontext-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-07-12T15:39:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Für das öffentliche Funktionsmodell, die Plugin-Strukturen sowie die Zuständigkeits- und Ausführungsverträge siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite behandelt die internen Mechanismen: Ladepipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Ladepipeline

Beim Start führt OpenClaw ungefähr folgende Schritte aus:

1. Stammverzeichnisse potenzieller Plugins ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten festlegen
6. aktivierte native Module laden: Erstellte gebündelte Module verwenden einen nativen Loader;
   lokale TypeScript-Quellen von Drittanbietern verwenden als Notlösung den Jiti-Fallback
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle und Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` – der Loader verwendet die jeweils vorhandene Variante (`def.register ?? def.activate`) und ruft sie an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; verwenden Sie für neue Plugins bevorzugt `register`.
</Note>

Sicherheitsprüfungen werden **vor** der Runtime-Ausführung durchgeführt. Die Ermittlung blockiert einen Kandidaten, wenn:

- sein aufgelöster Einstiegspunkt außerhalb des Plugin-Stammverzeichnisses liegt
- sein Pfad (oder sein Stammverzeichnis) für alle Benutzer beschreibbar ist
- bei nicht gebündelten Plugins die Eigentümerschaft des Pfads nicht mit der aktuellen uid (oder root) übereinstimmt

Bei für alle Benutzer beschreibbaren gebündelten Verzeichnissen wird zunächst direkt ein Reparaturversuch mit `chmod` durchgeführt (npm-/globale Installationen können Paketverzeichnisse mit `0777` ausliefern), bevor die Prüfung erneut erfolgt; Eigentümerschaftsprüfungen werden für gebündelte Ursprünge vollständig übersprungen.

Blockierte Kandidaten enthalten in der ausgegebenen Diagnose weiterhin ihre Plugin-ID, sofern sie bekannt ist (einschließlich IDs, die aus einem Manifest innerhalb eines ansonsten abgelehnten Verzeichnisses ermittelt wurden). Dadurch wird einer Konfiguration, die auf diese ID verweist, ein blockiertes Plugin mit einer Warnung zur Pfadsicherheit angezeigt statt eines nicht zugehörigen Fehlers „unbekanntes Plugin“.

### Manifest-zentriertes Verhalten

Das Manifest ist die maßgebliche Informationsquelle der Steuerungsebene. OpenClaw verwendet es für Folgendes:

- das Plugin identifizieren
- deklarierte Channels/Skills/das Konfigurationsschema oder Bundle-Funktionen ermitteln
- `plugins.entries.<id>.config` validieren
- Beschriftungen/Platzhalter der Control UI ergänzen
- Installations-/Katalogmetadaten anzeigen
- leichtgewichtige Aktivierungs- und Einrichtungsdeskriptoren erhalten, ohne die Plugin-Laufzeit zu laden

Bei nativen Plugins ist das Laufzeitmodul der Teil der Datenebene. Es registriert
das tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale Manifestblöcke `activation` und `setup` verbleiben auf der Steuerungsebene.
Sie sind reine Metadatendeskriptoren für die Aktivierungsplanung und Einrichtungsermittlung;
sie ersetzen weder die Laufzeitregistrierung noch `register(...)` oder `setupEntry`.
Aktive Aktivierungsnutzer verwenden Befehls-, Channel- und Provider-Hinweise aus dem Manifest,
um das Laden von Plugins vor einer umfassenderen Materialisierung der Registry
einzugrenzen:

- Beim Laden der CLI wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Bei der Channel-Einrichtung/Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte
  Channel-ID gehört
- Bei der expliziten Provider-Einrichtung/Laufzeitauflösung wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört
- Die Startplanung des Gateways verwendet `activation.onStartup` für explizite
  Startimporte; Plugins ohne Startmetadaten werden nur durch spezifischere
  Aktivierungsauslöser geladen

Der Aktivierungsplaner stellt sowohl eine reine ID-API für bestehende Aufrufer als auch eine
Plan-API für die Diagnose bereit. Planeinträge geben an, warum ein Plugin ausgewählt wurde,
wobei explizite `activation.*`-Hinweise vom Fallback auf Manifest-Eigentümerschaft getrennt werden:

| Grund (aus `activation.*`-Hinweisen) | Grund (aus Manifest-Eigentümerschaft)                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                             |
| `activation-capability-hint`         | —                                                                                             |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                         |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                   |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`)  |
| `activation-route-hint`              | —                                                                                             |
| — (Hook-Auslöser hat keine Hinweisvariante) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)           |

Diese Trennung der Gründe bildet die Kompatibilitätsgrenze: Bestehende Plugin-Metadaten
funktionieren weiterhin, während neuer Code allgemeine Hinweise oder Fallback-Verhalten
erkennen kann, ohne die Semantik des Ladens der Laufzeit zu ändern.

Laufzeit-Vorabladevorgänge zur Anfragezeit, die den umfassenden Geltungsbereich `all` anfordern,
leiten weiterhin einen expliziten effektiven Satz von Plugin-IDs aus der Konfiguration, der Startplanung,
konfigurierten Channels, Slots und Regeln für die automatische Aktivierung ab
(`resolveEffectivePluginIds` in `src/plugins/effective-plugin-ids.ts`). Wenn dieser
abgeleitete Satz leer ist, lässt OpenClaw den Geltungsbereich leer, statt ihn auf
jedes auffindbare Plugin auszuweiten.

Die Einrichtungsermittlung bevorzugt Deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor auf `setup-api`
für Plugins zurückgegriffen wird, die weiterhin Laufzeit-Hooks während der Einrichtung benötigen.
Listen zur Provider-Einrichtung verwenden `providerAuthChoices` aus dem Manifest,
aus Deskriptoren abgeleitete Einrichtungsoptionen und Installationskatalog-Metadaten,
ohne die Provider-Laufzeit zu laden. Ein explizites `setup.requiresRuntime: false`
ist eine rein deskriptorbasierte Abgrenzung; wenn `requiresRuntime` fehlt, bleibt
der bisherige Fallback auf setup-api aus Kompatibilitätsgründen erhalten. Wenn
mehr als ein ermitteltes Plugin denselben normalisierten Provider für die Einrichtung oder
dieselbe CLI-Backend-ID beansprucht, lehnt die Einrichtungssuche den mehrdeutigen Eigentümer ab,
statt sich auf die Ermittlungsreihenfolge zu verlassen. Wenn die Einrichtungslaufzeit ausgeführt
wird, melden Registry-Diagnosen Abweichungen zwischen `setup.providers` / `setup.cliBackends`
und den tatsächlich durch setup-api registrierten Providern oder CLI-Backends,
ohne ältere Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert weder Ergebnisse der Plugin-Ermittlung noch direkte Daten der Manifest-Registry
hinter zeitbasierten Fenstern zwischen. Installationen, Manifeständerungen und Änderungen an
Ladepfaden müssen beim nächsten expliziten Lesen der Metadaten oder beim Neuaufbau eines Snapshots
sichtbar werden. Der Parser für Manifestdateien verwendet einen begrenzten
Dateisignatur-Cache, dessen Schlüssel aus dem geöffneten Manifestpfad sowie Gerät/Inode,
Größe und mtime/ctime besteht; dieser Cache vermeidet lediglich das erneute Parsen
unveränderter Bytes und darf keine Antworten zu Ermittlung, Registry,
Eigentümerschaft oder Richtlinien zwischenspeichern.

Der sichere schnelle Pfad für Metadaten basiert auf explizitem Objektbesitz, nicht auf einem verborgenen Cache.
Hot Paths beim Gateway-Start sollten den aktuellen `PluginMetadataSnapshot`, die
abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry durch die
Aufrufkette weitergeben. Konfigurationsvalidierung, automatische Aktivierung beim Start, Plugin-Bootstrap und Provider-
Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und
den aktuellen Plugin-Bestand repräsentieren. Die Setup-Suche rekonstruiert Manifest-Metadaten weiterhin bei Bedarf,
sofern der jeweilige Setup-Pfad keine explizite Manifest-Registry erhält; behalten Sie
dies als Fallback für den kalten Pfad bei, statt verborgene Such-Caches hinzuzufügen. Wenn sich die
Eingabe ändert, erstellen Sie den Snapshot neu und ersetzen Sie ihn, statt ihn zu verändern oder
historische Kopien aufzubewahren. Ansichten der aktiven Plugin-Registry und gebündelte
Hilfsfunktionen für den Channel-Bootstrap sollten aus der aktuellen
Registry beziehungsweise dem aktuellen Stammverzeichnis neu berechnet werden. Kurzlebige Maps sind innerhalb eines einzelnen Aufrufs in Ordnung, um Arbeit zu deduplizieren oder
Wiedereintritt zu verhindern; sie dürfen nicht zu prozessweiten Metadaten-Caches werden.

Beim Laden von Plugins ist die persistente Cache-Schicht das Laden zur Laufzeit. Sie darf
den Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, etwa:

- `PluginLoaderCacheState` und kompatible aktive Laufzeit-Registrys
- jiti-/Modul-Caches und Loader-Caches für öffentliche Oberflächen, die verwendet werden, um zu vermeiden, dass
  dieselbe Laufzeitoberfläche wiederholt importiert wird
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf zur Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Implementierungsdetails der Datenebene. Sie dürfen keine
Fragen der Steuerungsebene beantworten, etwa „welches Plugin ist für diesen Provider zuständig?“, es sei denn, der
Aufrufer hat ausdrücklich das Laden zur Laufzeit angefordert.

Fügen Sie keine persistenten oder zeitbasierten Caches hinzu für:

- Discovery-Ergebnisse
- direkte Manifest-Registrys
- Manifest-Registrys, die aus dem Index installierter Plugins rekonstruiert wurden
- Suche nach dem zuständigen Provider, Modellunterdrückung, Provider-Richtlinien oder Metadaten
  öffentlicher Artefakte
- jede andere aus Manifesten abgeleitete Antwort, bei der ein geändertes Manifest, ein installierter Index
  oder ein Ladepfad beim nächsten Lesen der Metadaten sichtbar sein sollte

Aufrufer, die Manifest-Metadaten aus dem persistent gespeicherten Index installierter Plugins
neu erstellen, rekonstruieren diese Registry bei Bedarf. Der installierte Index ist dauerhafter
Zustand der Quellebene; er ist kein verborgener prozessinterner Metadaten-Cache.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Variablen des Kerns. Sie registrieren sich in einer
zentralen Plugin-Registry (`PluginRegistry` in `src/plugins/registry-types.ts`),
die Plugin-Datensätze (Identität, Quelle, Ursprung, Status, Diagnosen)
sowie Arrays für jede Funktionalität verwaltet: Tools, Legacy-Hooks und typisierte Hooks,
Channels, Provider, Gateway-RPC-Handler, HTTP-Routen, CLI-Registrare,
Hintergrunddienste, Plugin-eigene Befehle und Dutzende weitere typisierte Provider-
Familien (Sprachausgabe, Embeddings, Bild-/Video-/Musikgenerierung, Web-
Abruf/-Suche, Agent-Harnesse, Sitzungsaktionen und so weiter).

Kernfunktionen lesen anschließend aus dieser Registry, statt direkt mit Plugin-
Modulen zu kommunizieren. Dadurch bleibt das Laden unidirektional:

- Plugin-Modul -> Registrierung in der Registry
- Kern-Laufzeit -> Nutzung der Registry

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Kernoberflächen nur
einen Integrationspunkt benötigen: „Registry lesen“, statt „jedes
Plugin-Modul gesondert behandeln“.

## Callbacks für Konversationsbindungen

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung entschieden wurde.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungs-
anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Für dieses Plugin und diese Konversation besteht nun eine Bindung.
        console.log(event.binding?.conversationId);
        return;
      }

      // Die Anfrage wurde abgelehnt; lokalen ausstehenden Zustand löschen.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Nutzlast:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Zusammenfassung der Anfrage, der Hinweis zum Trennen, die Absender-ID und
  die Konversationsmetadaten

Dieser Callback dient ausschließlich zur Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und wird ausgeführt, nachdem die Genehmigungsverarbeitung des Kerns abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben drei Ebenen:

- **Manifest-Metadaten** für kostengünstige Suchen vor der Laufzeit:
  `setup.providers[].envVars`, die veraltete Kompatibilitätsoption `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (Legacy: `discovery`) sowie
  `applyConfigDefaults`.
- **Laufzeit-Hooks**: mehr als 40 optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Wrapping, Denkstufen, Wiederholungsrichtlinien und Endpunkte für Nutzungsdaten. Siehe
  [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw ist weiterhin für die generische Agent-Schleife, Failover, Transkriptverarbeitung und
Tool-Richtlinien zuständig. Diese Hooks bilden die Erweiterungsoberfläche für Provider-spezifisches
Verhalten, ohne dass dafür ein vollständig eigener Inferenztransport erforderlich ist.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider umgebungsvariablenbasierte
Anmeldedaten besitzt, die generische Authentifizierungs-, Status- und Modellauswahlpfade ohne
Laden der Plugin-Laufzeit erkennen sollen. Das veraltete `providerAuthEnvVars` wird während des
Einstellungszeitraums weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins,
die es verwenden, erhalten eine Manifestdiagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die Umgebungsvariablen, Authentifizierungsprofile,
konfigurationsgestützte Authentifizierung und API-Schlüssel-Onboarding-Auswahl einer anderen
Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
Onboarding-/Authentifizierungsauswahl-Oberflächen der CLI die Auswahl-ID des Providers,
Gruppenbeschriftungen und eine einfache Authentifizierungsverdrahtung mit einem einzigen Flag
kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie `envVars` der Provider-Laufzeit
für Hinweise für Betreiber bei, etwa Onboarding-Beschriftungen oder Einrichtungsvariablen für
OAuth-Client-ID und -Client-Secret.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal über umgebungsvariablengesteuerte
Authentifizierung oder Einrichtung verfügt, die generische Shell-Umgebungs-Fallbacks,
Konfigurations-/Statusprüfungen oder Einrichtungsaufforderungen ohne Laden der Kanallaufzeit
erkennen sollen.

### Reihenfolge und Verwendung der Hooks

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Verwendungszeitpunkt“ dient als schnelle Entscheidungshilfe.
Reine Kompatibilitätsfelder für Provider, die OpenClaw nicht mehr aufruft, etwa
`ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht
aufgeführt.

| Hook                              | Funktion                                                                                                                   | Verwendungszweck                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen                     | Der Provider verwaltet einen Katalog oder Standardwerte für die Basis-URL                                                                                                |
| `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden                    | Standardwerte hängen vom Authentifizierungsmodus, von der Umgebung oder von der Semantik der Modellfamilie des Providers ab                                              |
| _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                                | _(kein Plugin-Hook)_                                                                                                                                                     |
| `normalizeModelId`                | Aliasse für veraltete oder Vorschau-Modell-IDs vor der Suche normalisieren                                                 | Der Provider bereinigt Aliasse vor der kanonischen Modellauflösung                                                                                                       |
| `normalizeTransport`              | `api` / `baseUrl` der Provider-Familie vor der generischen Modellzusammenstellung normalisieren                            | Der Provider bereinigt den Transport für benutzerdefinierte Provider-IDs derselben Transportfamilie                                                                      |
| `normalizeConfig`                 | `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung normalisieren                                                 | Der Provider benötigt eine Konfigurationsbereinigung, die im Plugin verbleiben sollte; gebündelte Hilfsfunktionen der Google-Familie sichern zudem unterstützte Google-Konfigurationseinträge ab |
| `applyNativeStreamingUsageCompat` | Kompatibilitätsanpassungen für die native Streaming-Nutzung auf konfigurierte Provider anwenden                            | Der Provider benötigt Endpunkt-basierte Korrekturen der Metadaten zur nativen Streaming-Nutzung                                                                          |
| `resolveConfigApiKey`             | Authentifizierung über Umgebungsmarker für konfigurierte Provider vor dem Laden der Laufzeitauthentifizierung auflösen     | Provider stellen eigene Hooks zur Auflösung von API-Schlüsseln über Umgebungsmarker bereit                                                                                |
| `resolveSyntheticAuth`            | Lokale, selbst gehostete oder konfigurationsgestützte Authentifizierung ohne Klartextspeicherung bereitstellen             | Der Provider kann mit einem synthetischen/lokalen Anmeldedatenmarker betrieben werden                                                                                     |
| `resolveExternalAuthProfiles`     | Provider-eigene externe Authentifizierungsprofile überlagern; Standardwert für `persistence` ist `runtime-only` für CLI-/App-eigene Anmeldedaten | Der Provider verwendet externe Authentifizierungsdaten erneut, ohne kopierte Aktualisierungstoken zu speichern; `contracts.externalAuthProviders` im Manifest deklarieren |
| `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profilplatzhalter hinter umgebungs-/konfigurationsgestützter Authentifizierung einordnen         | Der Provider speichert synthetische Platzhalterprofile, die bei der Priorisierung nicht bevorzugt werden sollen                                                           |
| `resolveDynamicModel`             | Synchrone Ausweichlösung für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry enthalten sind             | Der Provider akzeptiert beliebige Modell-IDs des Upstream-Dienstes                                                                                                        |
| `prepareDynamicModel`             | Asynchrone Vorbereitung; anschließend wird `resolveDynamicModel` erneut ausgeführt                                         | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                                                     |
| `normalizeResolvedModel`          | Abschließende Anpassung, bevor der eingebettete Runner das aufgelöste Modell verwendet                                     | Der Provider benötigt Transportanpassungen, verwendet aber weiterhin einen Kerntransport                                                                                 |
| `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie verarbeitet                                                  | Der Provider benötigt eine Schema-Bereinigung für die Transportfamilie                                                                                                   |
| `inspectToolSchemas`              | Provider-eigene Schemadiagnosen nach der Normalisierung bereitstellen                                                      | Der Provider möchte Warnungen zu Schlüsselwörtern ausgeben, ohne den Kern um Provider-spezifische Regeln zu erweitern                                                     |
| `resolveReasoningOutputMode`      | Zwischen nativem und Tag-basiertem Vertrag für die Reasoning-Ausgabe wählen                                                | Der Provider benötigt Tag-basierte Reasoning-/Endausgaben anstelle nativer Felder                                                                                         |
| `prepareExtraParams`              | Anfrageparameter vor den generischen Wrappern für Stream-Optionen normalisieren                                            | Der Provider benötigt Standard-Anfrageparameter oder eine Provider-spezifische Parameterbereinigung                                                                      |
| `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                                    | Der Provider benötigt ein benutzerdefiniertes Übertragungsprotokoll, nicht nur einen Wrapper                                                                              |
| `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                               | Der Provider benötigt Kompatibilitäts-Wrapper für Anfrageheader, -text oder Modelle, jedoch keinen benutzerdefinierten Transport                                          |
| `resolveTransportTurnState`       | Native Transportheader oder Metadaten pro Durchlauf anhängen                                                               | Der Provider möchte, dass generische Transporte eine Provider-native Durchlaufidentität senden                                                                            |
| `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder eine Abkühlrichtlinie für Sitzungen anhängen                                                  | Der Provider möchte Sitzungsheader oder die Ausweichrichtlinie generischer WS-Transporte anpassen                                                                         |
| `formatApiKey`                    | Formatierer für Authentifizierungsprofile: Das gespeicherte Profil wird zur Laufzeit-Zeichenfolge `apiKey`                 | Der Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt ein benutzerdefiniertes Format für das Laufzeittoken                                          |
| `refreshOAuth`                    | OAuth-Aktualisierung für benutzerdefinierte Aktualisierungsendpunkte oder Richtlinien bei Aktualisierungsfehlern überschreiben | Der Provider ist nicht mit den gemeinsamen OpenClaw-Aktualisierungsmechanismen kompatibel                                                                                 |
| `buildAuthDoctorHint`             | Reparaturhinweis anhängen, wenn die OAuth-Aktualisierung fehlschlägt                                                       | Der Provider benötigt nach einem Aktualisierungsfehler eigene Anweisungen zur Reparatur der Authentifizierung                                                              |
| `matchesContextOverflowError`     | Provider-eigene Erkennung einer Überschreitung des Kontextfensters                                                         | Der Provider liefert rohe Überlauffehler, die generische Heuristiken nicht erkennen würden                                                                                |
| `classifyFailoverReason`          | Provider-eigene Klassifizierung des Failover-Grunds                                                                        | Der Provider kann rohe API-/Transportfehler auf Ratenbegrenzung, Überlastung usw. abbilden                                                                                |
| `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                                       | Der Provider benötigt Proxy-spezifische Bedingungen für die Cache-TTL                                                                                                    |
| `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                                        | Der Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                                               |
| `augmentModelCatalog`             | Synthetische/abschließende Katalogzeilen nach der Ermittlung anhängen (veraltet, siehe unten)                               | Der Provider benötigt synthetische Zeilen zur Vorwärtskompatibilität in `models list` und Auswahllisten                                                                   |
| `resolveThinkingProfile`          | Modellspezifische Stufenmenge, Anzeigebezeichnungen und Standardwert für `/think`                                          | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Abstufung oder binäre Bezeichnung bereit                                                     |
| `isBinaryThinking`                | Kompatibilitäts-Hook für binäres Ein-/Ausschalten des Reasonings                                                           | Der Provider unterstützt Thinking nur binär als ein/aus                                                                                                                  |
| `supportsXHighThinking`           | Kompatibilitäts-Hook für die Reasoning-Unterstützung von `xhigh`                                                          | Der Provider möchte `xhigh` nur für eine Teilmenge der Modelle aktivieren                                                                                                 |
| `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für die standardmäßige `/think`-Stufe                                                                | Der Provider verwaltet die standardmäßige `/think`-Richtlinie für eine Modellfamilie                                                                                      |
| `isModernModelRef`                | Erkennung moderner Modelle für Live-Profilfilter und Smoke-Auswahl                                                         | Der Provider verwaltet die Erkennung bevorzugter Modelle für Live-/Smoke-Tests                                                                                            |
| `prepareRuntimeAuth`              | Konfigurierte Anmeldedaten unmittelbar vor der Inferenz gegen das tatsächliche Laufzeittoken bzw. den tatsächlichen Schlüssel austauschen | Der Provider benötigt einen Tokenaustausch oder kurzlebige Anmeldedaten für die Anfrage                                                                                   |
| `resolveUsageAuth`                | Nutzungs-/Abrechnungsanmeldedaten für `/usage` und zugehörige Statusoberflächen auflösen                                   | Der Provider benötigt eine benutzerdefinierte Auswertung von Nutzungs-/Kontingenttoken oder andere Nutzungsanmeldedaten                                                   |
| `fetchUsageSnapshot`              | Provider-spezifische Nutzungs-/Kontingent-Snapshots nach Auflösung der Authentifizierung abrufen und normalisieren         | Der Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Payload-Parser                                                                                    |
| `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Speicher/Suche erstellen                                          | Das Verhalten von Speicher-Embeddings gehört in das Provider-Plugin                                                                           |
| `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transkriptverarbeitung für den Provider steuert                    | Der Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (zum Beispiel zum Entfernen von Thinking-Blöcken)                           |
| `sanitizeReplayHistory`           | Den Replay-Verlauf nach der allgemeinen Transkriptbereinigung umschreiben                                      | Der Provider benötigt Provider-spezifische Replay-Anpassungen, die über gemeinsame Compaction-Hilfsfunktionen hinausgehen                      |
| `validateReplayTurns`             | Abschließende Validierung oder Umformung der Replay-Turns vor dem eingebetteten Runner                          | Der Provider-Transport benötigt nach der allgemeinen Bereinigung eine strengere Turn-Validierung                                               |
| `onModelSelected`                 | Provider-eigene Nebeneffekte nach der Auswahl ausführen                                                        | Der Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                     |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
übereinstimmende Provider-Plugin und durchlaufen dann weitere Provider-Plugins
mit Hook-Unterstützung, bis eines tatsächlich die Modell-ID oder den
Transport/die Konfiguration ändert. Dadurch funktionieren
Alias-/Kompatibilitäts-Shims für Provider weiterhin, ohne dass der Aufrufer
wissen muss, welches gebündelte Plugin für die Umschreibung zuständig ist. Wenn
kein Provider-Hook einen unterstützten Konfigurationseintrag der Google-Familie
umschreibt, führt der gebündelte Google-Konfigurationsnormalisierer weiterhin
diese Kompatibilitätsbereinigung durch.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen
benutzerdefinierten Request-Executor benötigt, handelt es sich um eine andere
Erweiterungsklasse. Diese Hooks sind für Provider-Verhalten vorgesehen, das
weiterhin in der normalen Inferenzschleife von OpenClaw ausgeführt wird.

`resolveUsageAuth` entscheidet, ob OpenClaw `fetchUsageSnapshot` aufrufen oder
für Nutzungs-/Statusoberflächen auf die generische Auflösung von
Anmeldedaten zurückgreifen soll. Geben Sie
`{ token, accountId?, subscriptionType?, rateLimitTier? }` zurück, wenn der
Provider über Anmeldedaten für die Nutzungsabfrage verfügt (die optionalen
Tarifmetadaten werden an `fetchUsageSnapshot` weitergegeben), geben Sie
`{ handled: true }` zurück, wenn die Provider-eigene
Nutzungsauthentifizierung die Anfrage verarbeitet hat und den generischen
Fallback auf API-Schlüssel/OAuth unterdrücken muss, und geben Sie `null` oder
`undefined` zurück, wenn der Provider die Nutzungsauthentifizierung nicht
verarbeitet hat.

Deklarieren Sie Organisations- oder Abrechnungsanmeldedaten im Manifest unter
`providerUsageAuthEnvVars`. Dadurch können generische Ermittlungs- und
Secret-Bereinigungsoberflächen sie erkennen, ohne sie zu Kandidaten für die
Inferenz-Authentifizierung zu machen.

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

Gebündelte Provider-Plugins kombinieren die oben genannten Hooks entsprechend
den Anforderungen jedes Anbieters an Katalog, Authentifizierung, Denkmodus,
Replay und Nutzung. Der maßgebliche Hook-Satz befindet sich bei jedem Plugin
unter `extensions/`; diese Seite veranschaulicht die Strukturen, statt die Liste
zu spiegeln.

<AccordionGroup>
  <Accordion title="Provider mit durchgereichtem Katalog">
    OpenRouter, Kilocode, Z.AI und xAI registrieren `catalog` sowie
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie vorgelagerte
    Modell-IDs vor dem statischen Katalog von OpenClaw bereitstellen können.
  </Accordion>
  <Accordion title="Provider mit OAuth- und Nutzungsendpunkten">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi und z.ai
    kombinieren `prepareRuntimeAuth` oder `formatApiKey` mit
    `resolveUsageAuth` + `fetchUsageSnapshot`, um den Token-Austausch und die
    `/usage`-Integration zu übernehmen.
  </Accordion>
  <Accordion title="Familien für Replay- und Transkriptbereinigung">
    Gemeinsam benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern,
    sich über `buildReplayPolicy` für Transkriptrichtlinien zu entscheiden,
    anstatt dass jedes Plugin die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Provider nur mit Katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame
    Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helfer">
    Beta-Header, `/fast` / `serviceTier` und `context1m` befinden sich innerhalb
    der öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle des
    Anthropic-Plugins (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Laufzeithelfer

Plugins können über `api.runtime` auf ausgewählte Kernhelfer zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale TTS-Ausgabenutzlast des Kerns für Datei-/Sprachnotizoberflächen zurück.
- Verwendet die Kernkonfiguration `messages.tts` und die Provider-Auswahl.
- Gibt einen PCM-Audiopuffer und die Abtastrate zurück. Plugins müssen für Provider neu abtasten/kodieren.
- `listVoices` ist je Provider optional. Verwenden Sie es für anbietereigene Stimmauswahlen oder Einrichtungsabläufe.
- Der Kern übergibt den Provider-Hooks für `listVoices` eine aufgelöste Anfragefrist; Provider-spezifische Zeitüberschreitungseinstellungen können sie überschreiben.
- Stimmlisten können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeitstags für Provider-spezifische Auswahlen enthalten.
- OpenAI und ElevenLabs unterstützen derzeit Telefonie. Microsoft nicht.

Plugins können außerdem Sprachausgabe-Provider über `api.registerSpeechProvider(...)` registrieren.

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
- Verwenden Sie Sprachausgabe-Provider für anbietereigenes Syntheseverhalten.
- Die veraltete Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Zuständigkeitsmodell ist unternehmensorientiert: Ein einzelnes Anbieter-Plugin kann Text-, Sprach-, Bild- und zukünftige Medien-Provider verwalten, wenn OpenClaw diese Fähigkeitsverträge ergänzt.

Für das Verstehen von Bildern, Audio und Videos registrieren Plugins einen
typisierten Provider für Medienverständnis statt einer generischen
Schlüssel/Wert-Sammlung:

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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Kern.
- Behalten Sie das Anbieterverhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videogenerierung folgt bereits demselben Muster:
  - Der Kern verwaltet den Fähigkeitsvertrag und den Laufzeithelfer.
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`.
  - Funktions-/Kanal-Plugins verwenden `api.runtime.videoGeneration.*`.

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
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

Für die Audiotranskription können Plugins entweder die Laufzeit für
Medienverständnis oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für das Verstehen von Bildern, Audio und Videos.
- `extractStructuredWithModel(...)` ist die Plugin-seitige Schnittstelle für begrenzte, Provider-eigene bildzentrierte Extraktion. Fügen Sie mindestens eine Bildeingabe ein; Texteingaben dienen als ergänzender Kontext. Produkt-Plugins verwalten ihre Routen und Schemas, während OpenClaw die Provider-/Laufzeitgrenze verwaltet.
- Verwendet die Audiokonfiguration des Kern-Medienverständnisses (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (beispielsweise bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können außerdem über `api.runtime.subagent` Subagent-Hintergrundläufe starten:

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
- Für Plugin-eigene Fallback-Läufe müssen Betreiber dies mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktivieren.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um ausdrücklich jedes Ziel zuzulassen.
- Subagent-Läufe nicht vertrauenswürdiger Plugins funktionieren weiterhin, Überschreibungsanfragen werden jedoch abgelehnt, statt stillschweigend auf einen Fallback zurückzugreifen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der ID des erstellenden Plugins gekennzeichnet. Der Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; das beliebige Löschen von Sitzungen erfordert weiterhin eine Gateway-Anfrage mit Administratorbereich.

Für die Websuche können Plugins den gemeinsamen Laufzeithelfer verwenden, statt
auf die Verdrahtung der Agentenwerkzeuge zuzugreifen:

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

Plugins können außerdem Websuch-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Anfragesemantik im Kern.
- Verwenden Sie Websuch-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Funktions-/Kanal-Plugins, die Suchverhalten benötigen, ohne vom Wrapper des Agentenwerkzeugs abhängig zu sein.

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

- `generate(...)`: Erzeugt ein Bild mithilfe der konfigurierten Kette von Bildgenerierungs-Providern.
- `listProviders(...)`: Listet verfügbare Bildgenerierungs-Provider und ihre Fähigkeiten auf.

## Gateway-HTTP-Routen

Plugins können mit `api.registerHttpRoute(...)` HTTP-Endpunkte bereitstellen.

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

- `path`: Routenpfad unter dem HTTP-Server des Gateways.
- `auth`: erforderlich, `"gateway"` oder `"plugin"`. Verwenden Sie `"gateway"`, um die normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für eine vom Plugin verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `handleUpgrade`: optionaler Handler für WebSocket-Upgrade-Anfragen auf derselben Route.
- `replaceExisting`: optional. Ermöglicht demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: Geben Sie `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` ausdrücklich deklarieren.
- Konflikte mit identischem `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` festgelegt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Verwenden Sie `exact`/`prefix`-Fallthrough-Ketten nur auf derselben Authentifizierungsstufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Laufzeit-Scopes für Operatoren. Sie sind für vom Plugin verwaltete Webhooks bzw. Signaturverifizierung vorgesehen, nicht für privilegierte Aufrufe von Gateway-Hilfsfunktionen.
- Routen mit `auth: "gateway"` werden innerhalb eines Laufzeit-Scopes für Gateway-Anfragen ausgeführt. Die Standardoberfläche (`gatewayRuntimeScopeSurface: "write-default"`) ist bewusst restriktiv:
  - Die Bearer-Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode = "token"` / `"password"`) und jede Authentifizierungsmethode ohne vertrauenswürdigen Proxy erhalten einen einzelnen Scope `operator.write`, selbst wenn der Aufrufer `x-openclaw-scopes` sendet.
  - `trusted-proxy`-Aufrufer ohne expliziten `x-openclaw-scopes`-Header behalten ebenfalls die bisherige Oberfläche, die ausschließlich `operator.write` umfasst.
  - `trusted-proxy`-Aufrufer, die `x-openclaw-scopes` senden, erhalten stattdessen die deklarierten Scopes.
  - Eine Route kann sich mit `gatewayRuntimeScopeSurface: "trusted-operator"` dafür entscheiden, `x-openclaw-scopes` bei identitätstragenden Authentifizierungsmodi immer zu berücksichtigen (wenn der Header fehlt, wird auf den vollständigen Standardsatz von CLI-Scopes zurückgegriffen).
- Praktische Regel: Gehen Sie nicht davon aus, dass eine per Gateway authentifizierte Plugin-Route implizit eine Administratoroberfläche ist. Wenn Ihre Route ausschließlich Administratoren vorbehaltenes Verhalten benötigt, aktivieren Sie die Scope-Oberfläche `trusted-operator`, verlangen Sie einen identitätstragenden Authentifizierungsmodus und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.
- Nach dem Routenabgleich und der Authentifizierung unterliegen gewöhnliche Handler der Zulassung von Gateway-Root-Arbeit. Ein vorbereitetes oder neu startendes Gateway gibt `503` zurück, bevor der Handler aufgerufen wird. Die eng gefasste Ausnahme ist eine durch das Manifest berechtigte Route mit `auth: "gateway"`, die außerdem die routenspezifische Oberfläche `trusted-operator` aktiviert; sie bleibt erreichbar, damit die Weiterleitung der Aussetzungssteuerung nicht blockiert wird, während gewöhnliche gleichgeordnete Routen desselben Plugins weiterhin hinter der Zulassungsgrenze liegen. Die Zuständigkeit von WebSocket-`handleUpgrade` verwendet dieselbe atomare Zulassungsgrenze; sobald der Handler einen Socket akzeptiert, liegt dessen weitere Lebensdauer in der Verantwortung des Plugins und wird von dieser Grenze nicht erfasst.

## Importpfade des Plugin-SDKs

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade anstelle des monolithischen Root-Barrels `openclaw/plugin-sdk`.
Unterpfade des Kerns:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive zur Plugin-Registrierung                 |
| `openclaw/plugin-sdk/channel-core`  | Hilfsfunktionen für Channel-Einstieg und -Erstellung |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfsfunktionen und übergreifender Vertrag |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema der Root-`openclaw.json` (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen – `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Das Genehmigungsverhalten sollte
in einem einzigen `approvalCapability`-Vertrag gebündelt werden, anstatt es über
nicht zusammenhängende Plugin-Felder zu verteilen. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurationshilfen befinden sich unter entsprechend fokussierten `*-runtime`-Unterpfaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` usw.). Bevorzugen Sie `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation`
anstelle des breiten Kompatibilitäts-Barrels `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
kleine Fassaden für Channel-Hilfsfunktionen, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (je Root-Paket eines gebündelten Plugins):

- `index.js` — Einstiegspunkt des gebündelten Plugins
- `api.js` — Barrel für Hilfsfunktionen/Typen
- `runtime-api.js` — ausschließlich für die Laufzeit bestimmtes Barrel
- `setup-entry.js` — Einstiegspunkt des Einrichtungs-Plugins

Externe Plugins sollten ausschließlich Unterpfade von `openclaw/plugin-sdk/*` importieren. Importieren Sie niemals
`src/*` aus dem Paket eines anderen Plugins in den Kern oder in ein anderes Plugin.
Über eine Fassade geladene Einstiegspunkte bevorzugen den aktiven Snapshot der Laufzeitkonfiguration, sofern
einer vorhanden ist, und greifen andernfalls auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.

Funktionsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie derzeit verwenden. Sie sind nicht
automatisch langfristig unveränderliche externe Verträge – prüfen Sie die entsprechende
SDK-Referenzseite, wenn Sie sich auf sie verlassen.

## Schemas des Nachrichtenwerkzeugs

Plugins sollten die Channel-spezifischen Schemabeiträge für `describeMessageTool(...)`
für Primitive außerhalb von Nachrichten wie Reaktionen, Lesevorgänge und Umfragen selbst verwalten.
Die gemeinsame Sendepräsentation sollte den generischen `MessagePresentation`-Vertrag
anstelle Provider-nativer Schaltflächen-, Komponenten-, Block- oder Kartenfelder verwenden.
Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, die Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren über Nachrichtenfunktionen, was sie darstellen können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` für Anfragen zur angehefteten Zustellung

Der Kern entscheidet, ob die Präsentation nativ dargestellt oder auf Text reduziert wird.
Stellen Sie im generischen Nachrichtenwerkzeug keine Ausweichmöglichkeiten für Provider-native Benutzeroberflächen bereit.
Veraltete SDK-Hilfsfunktionen für bisherige native Schemas bleiben für bestehende
Plugins von Drittanbietern exportiert, neue Plugins sollten sie jedoch nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten für Channel-spezifische Zielsemantik zuständig sein. Halten Sie den gemeinsamen
ausgehenden Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Kern mit, ob eine
  Eingabe direkt zur ID-ähnlichen Auflösung übergehen und die Verzeichnissuche überspringen soll.
- `messaging.targetResolver.reservedLiterals` führt alleinstehende Wörter auf, die
  Channel-/Sitzungsreferenzen für diesen Provider darstellen. Die Auflösung berücksichtigt konfigurierte
  Verzeichniseinträge, bevor reservierte Literale abgelehnt werden, und schlägt anschließend bei einem
  Verzeichnis-Fehlschlag geschlossen fehl.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Kern nach der Normalisierung oder einem Verzeichnis-Fehlschlag eine abschließende, vom Provider verwaltete Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` ist für die Provider-spezifische Konstruktion der Sitzungsroute
  zuständig, sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor der
  Suche nach Peers/Gruppen erfolgen sollen.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifische Normalisierungs-Fallbacks, nicht für
  eine umfassende Verzeichnissuche.
- Belassen Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  innerhalb von `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin belassen und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, beispielsweise:

- durch eine Zulassungsliste gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppenzuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` verarbeiten nur generische Vorgänge:

- Abfragefilterung
- Anwendung von Begrenzungen
- Hilfsfunktionen zur Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung verbleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Struktur zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Standardwerte für
Basis-URLs oder authentifizierungsabhängige Modellmetadaten verwaltet.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Schlüssel- oder umgebungsvariablengesteuerte Provider
- `profile`: Provider, die angezeigt werden, wenn Authentifizierungsprofile vorhanden sind
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge erzeugen
- `late`: letzter Durchlauf nach anderen impliziten Providern

Spätere Provider haben bei Schlüsselkollisionen Vorrang, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Plugins können außerdem schreibgeschützte Modellzeilen über
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` veröffentlichen. Dies ist der künftig vorgesehene Pfad für Listen-, Hilfe- und Auswahloberflächen und unterstützt
Zeilen der Typen `text`, `voice`, `image_generation`, `video_generation` und `music_generation`.
Provider-Plugins sind weiterhin für Live-Endpunktaufrufe, Token-Austausch und die
Zuordnung von Anbieterantworten zuständig; der Core verwaltet die gemeinsame Zeilenstruktur, Quellbezeichnungen und
die Formatierung der Hilfe für Medienwerkzeuge. Registrierungen von Providern für die Mediengenerierung erzeugen
automatisch statische Katalogzeilen aus `defaultModel`, `models` und
`capabilities`.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias, gibt jedoch eine Veraltungswarnung aus
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`
  und gibt eine Warnung aus
- `augmentModelCatalog` ist veraltet; gebündelte Provider sollten
  ergänzende Zeilen über `registerModelCatalogProvider` veröffentlichen

## Schreibgeschützte Kanalprüfung

Wenn Ihr Plugin einen Kanal registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` zusätzlich zu `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf davon ausgehen, dass Anmeldedaten
  vollständig materialisiert sind, und kann frühzeitig fehlschlagen, wenn erforderliche Geheimnisse fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurations-
  Reparaturabläufe sollten Laufzeitanmeldedaten nicht allein zur Beschreibung der Konfiguration
  materialisieren müssen.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur einen beschreibenden Kontostatus zurück.
- Behalten Sie `enabled` und `configured` bei.
- Schließen Sie bei Bedarf Felder für Quelle und Status der Anmeldedaten ein, beispielsweise:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Tokenwerte zurückgeben, nur um die schreibgeschützte
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (und des
  zugehörigen Quellfelds) reicht für Statusbefehle aus.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef
  konfiguriert sind, aber im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem
Befehlspfad nicht verfügbar“ melden, statt abzustürzen oder das Konto
fälschlicherweise als nicht konfiguriert auszuweisen.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Paket mehrere Erweiterungen
auflistet, wird die Plugin-ID zu `<manifestOrPackageName>/<fileBase>` (die
Manifest-ID hat Vorrang, sofern vorhanden; andernfalls wird der Name ohne
Namensraum aus `package.json` verwendet).

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie diese in diesem
Verzeichnis, damit `node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsvorgabe: Jeder Eintrag in `openclaw.extensions` muss nach der
Auflösung symbolischer Links innerhalb des Plugin-Verzeichnisses bleiben.
Einträge, die aus dem Paketverzeichnis herausführen, werden abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten
mit einem projektlokalen `npm install --omit=dev --ignore-scripts` (keine
Lebenszyklus-Skripte, keine Entwicklungsabhängigkeiten zur Laufzeit) und
ignoriert dabei übernommene globale npm-Installationseinstellungen. Halten Sie
Plugin-Abhängigkeitsbäume „reines JS/TS“ und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für die
Einrichtung verweisen. Wenn OpenClaw Einrichtungsoberflächen für ein
deaktiviertes Kanal-Plugin benötigt oder wenn ein Kanal-Plugin aktiviert, aber
noch nicht konfiguriert ist, lädt es `setupEntry` statt des vollständigen
Plugin-Einstiegspunkts. Dadurch bleiben Start und Einrichtung schlanker, wenn
Ihr Haupt-Plugin-Einstiegspunkt außerdem Tools, Hooks oder anderen Code
einbindet, der nur zur Laufzeit benötigt wird.

Optional: Mit `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin während der Vorbereitungsphase vor dem Lauschen des
Gateway denselben `setupEntry`-Pfad verwenden, selbst wenn der Kanal bereits
konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig
abdeckt, die vorhanden sein muss, bevor der Gateway zu lauschen beginnt. In der
Praxis bedeutet dies, dass der Einrichtungs-Einstiegspunkt jede kanaleigene
Funktion registrieren muss, von der der Start abhängt, beispielsweise:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor der Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die im selben Zeitraum vorhanden sein müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche
Startfunktion bereitstellt, aktivieren Sie dieses Flag nicht. Behalten Sie das
Standardverhalten für das Plugin bei und lassen Sie OpenClaw während des Starts
den vollständigen Einstiegspunkt laden.

Gebündelte Kanäle können außerdem Hilfsfunktionen für die reine
Einrichtungsvertragsoberfläche veröffentlichen, die der Kern abfragen kann,
bevor die vollständige Kanallaufzeit geladen wird. Die aktuelle
Einrichtungs-Promotionsoberfläche umfasst:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Kern verwendet diese Oberfläche, wenn er eine alte Einzelkonto-
Kanalkonfiguration nach `channels.<id>.accounts.*` überführen muss, ohne den
vollständigen Plugin-Einstiegspunkt zu laden. Matrix ist das aktuelle gebündelte
Beispiel: Wenn bereits benannte Konten vorhanden sind, verschiebt es nur
Authentifizierungs-/Bootstrap-Schlüssel in ein benanntes überführtes Konto und
kann einen konfigurierten, nicht kanonischen Standardschlüssel für das Konto
beibehalten, statt immer `accounts.default` zu erstellen.

Diese Adapter für Einrichtungs-Patches halten die Erkennung der gebündelten
Vertragsoberfläche verzögert. Die Importzeit bleibt kurz; die
Promotionsoberfläche wird erst bei der ersten Verwendung geladen, statt beim
Modulimport den Start des gebündelten Kanals erneut auszuführen.

Wenn diese Startoberflächen Gateway-RPC-Methoden umfassen, verwenden Sie dafür
ein Plugin-spezifisches Präfix. Die administrativen Kern-Namensräume
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
werden immer zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen
engeren Geltungsbereich anfordert.

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

Kanal-Plugins können Einrichtungs-/Erkennungsmetadaten über `openclaw.channel`
und Installationshinweise über `openclaw.install` bereitstellen. Dadurch bleibt
der Kernkatalog frei von Daten.

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
      "blurb": "Selbst gehosteter Chat über Nextcloud-Talk-Webhook-Bots.",
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

Nützliche Felder von `openclaw.channel`, die über das Minimalbeispiel hinausgehen:

- `detailLabel`: sekundäre Bezeichnung für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerungen für Texte der Auswahloberfläche
- `markdownCapable`: kennzeichnet den Kanal für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig
- `exposure.configured`: blendet den Kanal in Listenoberflächen für konfigurierte Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal in interaktiven Einrichtungs-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: kennzeichnet den Kanal für Navigationsoberflächen der Dokumentation als intern/privat
- `showConfigured` / `showInSetup`: aus Kompatibilitätsgründen weiterhin akzeptierte alte Aliasse; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: nimmt den Kanal in den standardmäßigen Quickstart-Ablauf `allowFrom` auf
- `forceAccountBinding`: erfordert eine explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist
- `preferSessionLookupForAnnounceTarget`: bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen

OpenClaw kann außerdem **externe Kanalkataloge** zusammenführen (beispielsweise
einen Export aus einer MPM-Registry). Legen Sie eine JSON-Datei an einem der
folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder lassen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder
`OPENCLAW_MPM_CATALOG_PATHS`) auf eine oder mehrere JSON-Dateien verweisen
(durch Kommas, Semikolons oder `PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als
alte Aliasse für den Schlüssel `"entries"`.

Generierte Einträge des Kanalkatalogs und Einträge des
Provider-Installationskatalogs stellen neben dem rohen Block
`openclaw.install` normalisierte Fakten zur Installationsquelle bereit. Die
normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version
oder ein gleitender Selektor ist, ob die erwarteten Integritätsmetadaten
vorhanden sind und ob außerdem ein lokaler Quellpfad verfügbar ist. Wenn die
Identität des Katalogs/Pakets bekannt ist, warnen die normalisierten Fakten,
falls der geparste npm-Paketname von dieser Identität abweicht. Sie warnen
außerdem, wenn `defaultChoice` ungültig ist oder auf eine nicht verfügbare
Quelle verweist und wenn npm-Integritätsmetadaten ohne eine gültige npm-Quelle
vorhanden sind. Verbraucher sollten `installSource` als additives optionales
Feld behandeln, damit manuell erstellte Einträge und Katalog-Shims es nicht
synthetisieren müssen.
Dadurch können Onboarding und Diagnose den Zustand der Quellenebene erläutern,
ohne die Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` zusammen mit
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren
aus Kompatibilitätsgründen weiterhin, zeigen jedoch Warnungen der Quellenebene
an, sodass der Katalog schrittweise zu fixierten, integritätsgeprüften
Installationen übergehen kann, ohne vorhandene Plugins zu beeinträchtigen.
Wenn das Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen
verwalteten Plugin-Indexeintrag mit `source: "path"` und nach Möglichkeit einem
arbeitsbereichsrelativen `sourcePath` auf. Der absolute operative Ladepfad
verbleibt in `plugins.load.paths`; der Installationseintrag vermeidet es,
lokale Arbeitsplatzpfade in eine langlebige Konfiguration zu duplizieren.
Dadurch bleiben lokale Entwicklungsinstallationen für die Diagnose der
Quellenebene sichtbar, ohne eine zweite Oberfläche zur Offenlegung roher
Dateisystempfade hinzuzufügen. Die persistierte SQLite-Tabelle
`installed_plugin_index` ist die maßgebliche Quelle für Installationen und kann
aktualisiert werden, ohne Plugin-Laufzeitmodule zu laden. Ihre
`installRecords`-Map ist dauerhaft, selbst wenn ein Plugin-Manifest fehlt oder
ungültig ist; ihre `plugins`-Nutzlast ist eine neu erstellbare Manifestansicht.

## Plugins für die Kontext-Engine

Plugins für die Kontext-Engine steuern die Orchestrierung des Sitzungskontexts
für Aufnahme, Zusammenstellung und Compaction. Registrieren Sie sie aus Ihrem
Plugin mit `api.registerContextEngine(id, factory)` und wählen Sie anschließend
die aktive Engine mit `plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die standardmäßige Kontextpipeline ersetzen
oder erweitern muss, statt lediglich Speichersuche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Der Factory-Kontext `ctx` stellt optionale Werte für `config`, `agentDir` und
`workspaceDir` zur Initialisierung während der Konstruktion bereit.

`assemble()` kann `contextProjection` zurückgeben, wenn das aktive Harness über
einen persistenten Backend-Thread verfügt. Lassen Sie es für die alte
turnbasierte Projektion weg. Geben Sie `{ mode: "thread_bootstrap", epoch }`
zurück, wenn der zusammengestellte Kontext einmalig in einen Backend-Thread
eingefügt und bis zur Änderung der Epoche wiederverwendet werden soll. Ändern
Sie die Epoche, nachdem sich der semantische Kontext der Engine geändert hat,
beispielsweise nach einem Engine-eigenen Compaction-Durchlauf. Hosts können
Metadaten von Tool-Aufrufen, die Eingabeform und redigierte Tool-Ergebnisse in
einer Thread-Bootstrap-Projektion beibehalten, damit neue Backend-Threads die
Tool-Kontinuität erhalten, ohne rohe, geheimnishaltige Nutzlasten zu kopieren.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** verwaltet, lassen Sie
`compact()` implementiert und delegieren Sie ihn ausdrücklich:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Funktion hinzufügen

Wenn ein Plugin ein Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie
das Plugin-System nicht durch einen privaten Direktzugriff. Fügen Sie die fehlende Funktion hinzu.

Empfohlene Reihenfolge:

1. **Definieren Sie den Kernvertrag.** Legen Sie fest, welches gemeinsame Verhalten der Kern übernehmen soll:
   Richtlinien, Fallback, Zusammenführung der Konfiguration, Lebenszyklus, kanalbezogene Semantik und
   Form der Runtime-Hilfsfunktion.
2. **Fügen Sie typisierte Registrierungs-/Runtime-Oberflächen für Plugins hinzu.** Erweitern Sie
   `OpenClawPluginApi` und/oder `api.runtime` um die kleinste sinnvoll nutzbare typisierte
   Funktionsoberfläche.
3. **Binden Sie Kern- und Kanal-/Funktionsnutzer an.** Kanäle und Funktions-Plugins
   sollten die neue Funktion über den Kern nutzen, nicht durch den direkten Import einer
   herstellerspezifischen Implementierung.
4. **Registrieren Sie herstellerspezifische Implementierungen.** Hersteller-Plugins registrieren anschließend ihre
   Backends für die Funktion.
5. **Fügen Sie Vertragsabdeckung hinzu.** Fügen Sie Tests hinzu, damit Zuständigkeit und Registrierungsform
   dauerhaft explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne fest auf die Weltsicht eines einzelnen
Providers zugeschnitten zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel finden Sie im [Funktions-Cookbook](/de/plugins/adding-capabilities).

### Checkliste für Funktionen

Wenn Sie eine neue Funktion hinzufügen, sollte die Implementierung in der Regel diese
Oberflächen gemeinsam betreffen:

- Kernvertragstypen in `src/<capability>/types.ts`
- Kern-Runner bzw. Runtime-Hilfsfunktion in `src/<capability>/runtime.ts`
- Registrierungsoberfläche der Plugin-API in `src/plugins/types.ts`
- Anbindung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung in der Plugin-Runtime unter `src/plugins/runtime/*`, wenn Funktions-/Kanal-
  Plugins sie nutzen müssen
- Erfassungs-/Testhilfen in `src/test-utils/plugin-registration.ts`
- Zuständigkeits-/Vertragsprüfungen in `src/plugins/contracts/registry.ts`
- Betreiber-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist dies normalerweise ein Zeichen dafür, dass die Funktion
noch nicht vollständig integriert ist.

### Funktionsvorlage

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

Muster für Vertragstests (`src/plugins/contracts/registry.ts` stellt Zuständigkeits-
abfragen wie `providerContractPluginIds` bereit; Tests prüfen, ob die Liste
`contracts.videoGenerationProviders` eines Plugins dem entspricht, was es tatsächlich registriert):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- Der Kern besitzt den Funktionsvertrag und die Orchestrierung
- Hersteller-Plugins besitzen die herstellerspezifischen Implementierungen
- Funktions-/Kanal-Plugins nutzen Runtime-Hilfsfunktionen
- Vertragstests halten die Zuständigkeit explizit fest

## Verwandte Themen

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Funktionsmodell und Formen
- [Unterpfade des Plugin SDK](/de/plugins/sdk-subpaths)
- [Einrichtung des Plugin SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
