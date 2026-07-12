---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Kanal-Lebenszyklus oder Paket-Bundles
    - Ladereihenfolge von Plugins oder Registry-Status debuggen
    - Hinzufügen einer neuen Plugin-Funktion oder eines Kontext-Engine-Plugins
summary: 'Interna der Plugin-Architektur: Lade-Pipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interna der Plugin-Architektur
x-i18n:
    generated_at: "2026-07-12T01:52:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Informationen zum öffentlichen Funktionsmodell, zu Plugin-Strukturen und zu den Verträgen für Zuständigkeit und Ausführung finden Sie unter [Plugin-Architektur](/de/plugins/architecture). Diese Seite behandelt die internen Mechanismen: Ladepipeline, Registry, Runtime-Hooks, Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Ladepipeline

Beim Start führt OpenClaw ungefähr folgende Schritte aus:

1. mögliche Plugin-Stammverzeichnisse ermitteln
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten bestimmen
6. aktivierte native Module laden: erstellte gebündelte Module verwenden einen nativen Loader;
   lokaler TypeScript-Quellcode von Drittanbietern verwendet als Notlösung den Jiti-Fallback
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle und Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` — der Loader verwendet die jeweils vorhandene Funktion (`def.register ?? def.activate`) und ruft sie an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Sicherheitsprüfungen werden **vor** der Runtime-Ausführung durchgeführt. Die Ermittlung blockiert einen Kandidaten, wenn:

- sein aufgelöster Einstiegspunkt außerhalb des Plugin-Stammverzeichnisses liegt
- sein Pfad (oder sein Stammverzeichnis) für alle Benutzer beschreibbar ist
- bei nicht gebündelten Plugins der Pfadeigentümer nicht mit der aktuellen UID (oder root) übereinstimmt

Bei für alle Benutzer beschreibbaren gebündelten Verzeichnissen wird zunächst versucht, die Berechtigungen direkt mit `chmod` zu reparieren (npm-/globale Installationen können Paketverzeichnisse mit `0777` ausliefern), bevor die Prüfung erneut ausgeführt wird; Eigentümerprüfungen werden für gebündelte Ursprünge vollständig übersprungen.

Blockierte Kandidaten enthalten in der ausgegebenen Diagnose weiterhin ihre Plugin-ID, sofern diese bekannt ist (einschließlich IDs, die aus einem Manifest in einem ansonsten abgelehnten Verzeichnis aufgelöst wurden). Dadurch wird eine Konfiguration, die auf diese ID verweist, einem blockierten Plugin mit einer Warnung zur Pfadsicherheit zugeordnet, statt einen nicht zusammenhängenden Fehler „unbekanntes Plugin“ zu erhalten.

### Manifest-zuerst-Verhalten

Das Manifest ist die maßgebliche Quelle der Steuerungsebene. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle, Skills, Konfigurationsschemas oder Bundle-Funktionen zu ermitteln
- `plugins.entries.<id>.config` zu validieren
- Beschriftungen und Platzhalter der Control UI zu ergänzen
- Installations- und Katalogmetadaten anzuzeigen
- kostengünstige Aktivierungs- und Einrichtungsdeskriptoren beizubehalten, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Teil der Datenebene. Es registriert das tatsächliche Verhalten, etwa Hooks, Tools, Befehle oder Provider-Abläufe.

Optionale Manifest-Blöcke `activation` und `setup` verbleiben auf der Steuerungsebene. Sie sind reine Metadatendeskriptoren für die Aktivierungsplanung und Einrichtungsermittlung; sie ersetzen weder die Runtime-Registrierung noch `register(...)` oder `setupEntry`.
Aktive Aktivierungsverbraucher verwenden Hinweise zu Befehlen, Kanälen und Providern aus dem Manifest, um das Laden von Plugins vor einer umfassenderen Materialisierung der Registry einzugrenzen:

- Beim Laden der CLI wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Bei der Kanaleinrichtung und Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte Kanal-ID gehört
- Bei der expliziten Provider-Einrichtung und Runtime-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte Provider-ID gehört
- Die Startplanung des Gateway verwendet `activation.onStartup` für explizite Startimporte; Plugins ohne Startmetadaten werden nur über spezifischere Aktivierungsauslöser geladen

Der Aktivierungsplaner stellt sowohl eine reine ID-API für bestehende Aufrufer als auch eine Plan-API für Diagnosen bereit. Planeinträge geben an, warum ein Plugin ausgewählt wurde, und unterscheiden dabei explizite `activation.*`-Hinweise vom Fallback auf die Manifest-Zuständigkeit:

| Grund (aus `activation.*`-Hinweisen) | Grund (aus der Manifest-Zuständigkeit)                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                           |
| `activation-capability-hint`         | —                                                                                           |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                       |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                 |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                           |
| — (Hook-Auslöser hat keine Hinweisvariante) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)          |

Diese Trennung der Gründe bildet die Kompatibilitätsgrenze: Bestehende Plugin-Metadaten funktionieren weiterhin, während neuer Code umfassende Hinweise oder Fallback-Verhalten erkennen kann, ohne die Semantik des Runtime-Ladens zu ändern.

Runtime-Vorabladevorgänge während einer Anfrage, die den umfassenden Bereich `all` anfordern, leiten weiterhin aus der Konfiguration, der Startplanung, den konfigurierten Kanälen, Slots und Regeln zur automatischen Aktivierung eine explizite effektive Menge von Plugin-IDs ab (`resolveEffectivePluginIds` in `src/plugins/effective-plugin-ids.ts`). Ist diese abgeleitete Menge leer, lässt OpenClaw den Bereich leer, statt ihn auf jedes ermittelbare Plugin zu erweitern.

Die Einrichtungsermittlung bevorzugt IDs aus Deskriptoren wie `setup.providers` und `setup.cliBackends`, um mögliche Plugins einzugrenzen, bevor für Plugins, die weiterhin Runtime-Hooks während der Einrichtung benötigen, auf `setup-api` zurückgegriffen wird. Listen zur Provider-Einrichtung verwenden `providerAuthChoices` aus dem Manifest, aus Deskriptoren abgeleitete Einrichtungsoptionen und Metadaten des Installationskatalogs, ohne die Provider-Runtime zu laden. Ein explizites `setup.requiresRuntime: false` begrenzt die Verarbeitung auf Deskriptoren; wenn `requiresRuntime` fehlt, bleibt aus Kompatibilitätsgründen der veraltete Fallback auf `setup-api` erhalten. Wenn mehrere ermittelte Plugins dieselbe normalisierte Provider-ID für die Einrichtung oder dieselbe CLI-Backend-ID beanspruchen, lehnt die Einrichtungssuche die mehrdeutige Zuständigkeit ab, statt sich auf die Ermittlungsreihenfolge zu verlassen. Wird die Einrichtungs-Runtime ausgeführt, melden Registry-Diagnosen Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-Backends, die tatsächlich durch `setup-api` registriert wurden, ohne veraltete Plugins zu blockieren.

### Plugin-Cache-Grenze

OpenClaw speichert weder Ergebnisse der Plugin-Ermittlung noch direkte Daten der Manifest-Registry hinter zeitgesteuerten Cache-Fenstern. Installationen, Manifeständerungen und Änderungen an Ladepfaden müssen beim nächsten expliziten Lesen von Metadaten oder beim nächsten Neuaufbau eines Snapshots sichtbar werden.
Der Parser für Manifestdateien verwendet einen begrenzten Cache für Dateisignaturen, dessen Schlüssel aus dem geöffneten Manifestpfad sowie Gerät/Inode, Größe und mtime/ctime besteht. Dieser Cache verhindert lediglich, dass unveränderte Bytes erneut geparst werden, und darf keine Antworten zu Ermittlung, Registry, Zuständigkeit oder Richtlinien zwischenspeichern.

Der sichere schnelle Metadatenpfad basiert auf expliziter Objektzuständigkeit, nicht auf einem verborgenen Cache.
Leistungskritische Pfade beim Start des Gateway sollten den aktuellen `PluginMetadataSnapshot`, die abgeleitete `PluginLookUpTable` oder eine explizite Manifest-Registry entlang der Aufrufkette weiterreichen. Konfigurationsvalidierung, automatische Aktivierung beim Start, Plugin-Bootstrap und Provider-Auswahl können diese Objekte wiederverwenden, solange sie die aktuelle Konfiguration und den aktuellen Plugin-Bestand repräsentieren. Die Einrichtungssuche rekonstruiert Manifest-Metadaten weiterhin bei Bedarf, sofern der jeweilige Einrichtungspfad keine explizite Manifest-Registry erhält; behalten Sie dies als Fallback für selten verwendete Pfade bei, statt verborgene Such-Caches hinzuzufügen. Wenn sich die Eingabe ändert, bauen Sie den Snapshot neu auf und ersetzen Sie ihn, statt ihn zu verändern oder historische Kopien aufzubewahren. Ansichten der aktiven Plugin-Registry und Bootstrap-Hilfsfunktionen für gebündelte Kanäle sollten aus der aktuellen Registry beziehungsweise dem aktuellen Stammverzeichnis neu berechnet werden. Kurzlebige Maps innerhalb eines einzelnen Aufrufs sind zulässig, um Arbeiten zu deduplizieren oder einen erneuten Eintritt zu verhindern; sie dürfen nicht zu Prozessmetadaten-Caches werden.

Beim Laden von Plugins ist das Runtime-Laden die persistente Cache-Schicht. Sie darf Loader-Zustand wiederverwenden, wenn Code oder installierte Artefakte tatsächlich geladen werden, beispielsweise:

- `PluginLoaderCacheState` und kompatible aktive Runtime-Registrys
- Jiti-/Modul-Caches und Loader-Caches für öffentliche Oberflächen, die verhindern, dass dieselbe Runtime-Oberfläche wiederholt importiert wird
- Dateisystem-Caches für installierte Plugin-Artefakte
- kurzlebige Maps pro Aufruf für Pfadnormalisierung oder Duplikatauflösung

Diese Caches sind Implementierungsdetails der Datenebene. Sie dürfen keine Fragen der Steuerungsebene wie „Welchem Plugin gehört dieser Provider?“ beantworten, sofern der Aufrufer nicht ausdrücklich das Laden der Runtime angefordert hat.

Fügen Sie keine persistenten oder zeitgesteuerten Caches hinzu für:

- Ergebnisse der Ermittlung
- direkte Manifest-Registrys
- aus dem Index installierter Plugins rekonstruierte Manifest-Registrys
- Provider-Zuständigkeitssuche, Modellunterdrückung, Provider-Richtlinien oder Metadaten öffentlicher Artefakte
- andere aus dem Manifest abgeleitete Antworten, bei denen ein geändertes Manifest, ein geänderter Installationsindex oder ein geänderter Ladepfad beim nächsten Lesen der Metadaten sichtbar sein sollte

Aufrufer, die Manifest-Metadaten aus dem persistenten Index installierter Plugins neu aufbauen, rekonstruieren diese Registry bei Bedarf. Der Installationsindex ist ein dauerhafter Zustand der Quellebene; er ist kein verborgener prozessinterner Metadaten-Cache.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Variablen des Kerns. Sie registrieren sich in einer zentralen Plugin-Registry (`PluginRegistry` in `src/plugins/registry-types.ts`), die Plugin-Datensätze (Identität, Quelle, Ursprung, Status und Diagnosen) sowie Arrays für jede Funktion verwaltet: Tools, veraltete und typisierte Hooks, Kanäle, Provider, Gateway-RPC-Handler, HTTP-Routen, CLI-Registrierungsfunktionen, Hintergrunddienste, Plugin-eigene Befehle und viele weitere typisierte Provider-Familien (Sprachausgabe, Einbettungen, Bild-/Video-/Musikgenerierung, Webabruf/-suche, Agent-Harnesses, Sitzungsaktionen und weitere).

Kernfunktionen lesen anschließend aus dieser Registry, statt direkt mit Plugin-Modulen zu kommunizieren. Dadurch bleibt das Laden unidirektional:

- Plugin-Modul -> Registrierung in der Registry
- Kern-Runtime -> Nutzung der Registry

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Kernoberflächen nur einen Integrationspunkt benötigen: „Registry lesen“, statt „jedes Plugin-Modul als Sonderfall behandeln“.

## Callbacks für Konversationsbindungen

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung entschieden wurde.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungsanfrage genehmigt oder abgelehnt wurde:

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
- `request`: die ursprüngliche Zusammenfassung der Anfrage, der Hinweis zur Trennung, die Absender-ID und die Konversationsmetadaten

Dieser Callback dient ausschließlich der Benachrichtigung. Er ändert nicht, wer eine Konversation binden darf, und wird ausgeführt, nachdem die Verarbeitung der Genehmigung im Kern abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins verfügen über drei Ebenen:

- **Manifest-Metadaten** für eine kostengünstige Suche vor dem Start der Runtime:
  `setup.providers[].envVars`, das veraltete Kompatibilitätsfeld `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (veraltet: `discovery`) sowie
  `applyConfigDefaults`.
- **Runtime-Hooks**: mehr als 40 optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Kapselung, Denkstufen, Wiederholungsrichtlinien und Nutzungsendpunkte. Siehe
  [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw bleibt für die generische Agentenschleife, Failover, Transkriptverarbeitung und Tool-Richtlinien zuständig. Diese Hooks bilden die Erweiterungsoberfläche für Provider-spezifisches Verhalten, ohne dass dafür ein vollständig eigener Inferenztransport erforderlich ist.

Verwenden Sie im Manifest `setup.providers[].envVars`, wenn der Provider umgebungsvariablenbasierte Zugangsdaten besitzt, die generische Pfade für Authentifizierung, Status und Modellauswahl erkennen sollen, ohne die Plugin-Laufzeit zu laden. Das veraltete `providerAuthEnvVars` wird während des Übergangszeitraums weiterhin vom Kompatibilitätsadapter gelesen, und nicht gebündelte Plugins, die es verwenden, erhalten eine Manifestdiagnose. Verwenden Sie im Manifest `providerAuthAliases`, wenn eine Provider-ID die Umgebungsvariablen, Authentifizierungsprofile, konfigurationsbasierte Authentifizierung und die Onboarding-Auswahl für API-Schlüssel einer anderen Provider-ID wiederverwenden soll. Verwenden Sie im Manifest `providerAuthChoices`, wenn CLI-Oberflächen für Onboarding und Authentifizierungsauswahl die Auswahl-ID, Gruppenbeschriftungen und die einfache Authentifizierungskonfiguration des Providers über ein einzelnes Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalten Sie `envVars` der Provider-Laufzeit für Hinweise an Betreiber bei, etwa Onboarding-Beschriftungen oder Einrichtungsvariablen für OAuth-Client-ID und -Client-Secret.

Verwenden Sie im Manifest `channelEnvVars`, wenn ein Kanal über umgebungsvariablengesteuerte Authentifizierung oder Einrichtung verfügt, die der generische Shell-Umgebungsfallback, Konfigurations-/Statusprüfungen oder Einrichtungsaufforderungen erkennen sollen, ohne die Kanallaufzeit zu laden.

### Reihenfolge und Verwendung der Hooks

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ dient als schnelle Entscheidungshilfe.
Provider-Felder, die ausschließlich der Kompatibilität dienen und von OpenClaw nicht mehr aufgerufen werden, etwa `ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier absichtlich nicht aufgeführt.

| Hook                              | Funktionsweise                                                                                                 | Verwendung                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Veröffentlicht die Provider-Konfiguration während der Generierung von `models.json` in `models.providers`       | Der Provider besitzt einen Katalog oder Standardwerte für die Basis-URL                                                                       |
| `applyConfigDefaults`             | Wendet bei der Konfigurationsmaterialisierung globale, Provider-eigene Konfigurationsstandardwerte an           | Standardwerte hängen vom Authentifizierungsmodus, von der Umgebung oder von der Modellfamiliensemantik des Providers ab                        |
| _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                     | _(kein Plugin-Hook)_                                                                                                                          |
| `normalizeModelId`                | Normalisiert veraltete oder Vorschau-Aliasse für Modell-IDs vor der Suche                                      | Der Provider bereinigt Aliasse vor der kanonischen Modellauflösung                                                                            |
| `normalizeTransport`              | Normalisiert `api` / `baseUrl` der Provider-Familie vor der generischen Modellzusammenstellung                  | Der Provider bereinigt den Transport für benutzerdefinierte Provider-IDs derselben Transportfamilie                                            |
| `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                       | Der Provider benötigt eine Konfigurationsbereinigung im Plugin; gebündelte Hilfsfunktionen der Google-Familie sichern zudem unterstützte Google-Konfigurationseinträge ab |
| `applyNativeStreamingUsageCompat` | Wendet Kompatibilitätsanpassungen für native Streaming-Nutzungsdaten auf konfigurierte Provider an              | Der Provider benötigt Endpunkt-gesteuerte Korrekturen der Metadaten für native Streaming-Nutzungsdaten                                        |
| `resolveConfigApiKey`             | Löst die Authentifizierung über Umgebungsmarker für konfigurierte Provider vor dem Laden der Laufzeitauthentifizierung auf | Provider stellen eigene Hooks zur Auflösung von API-Schlüsseln über Umgebungsmarker bereit                                                     |
| `resolveSyntheticAuth`            | Stellt lokale, selbst gehostete oder konfigurationsgestützte Authentifizierung bereit, ohne Klartext zu speichern | Der Provider kann mit einem synthetischen/lokalen Anmeldedatenmarker arbeiten                                                                 |
| `resolveExternalAuthProfiles`     | Überlagert Provider-eigene externe Authentifizierungsprofile; standardmäßig ist `persistence` für CLI-/App-eigene Anmeldedaten `runtime-only` | Der Provider verwendet externe Anmeldedaten erneut, ohne kopierte Aktualisierungstoken zu speichern; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| `shouldDeferSyntheticProfileAuth` | Ordnet gespeicherte synthetische Profilplatzhalter hinter umgebungs-/konfigurationsgestützter Authentifizierung ein | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang erhalten sollen                                                     |
| `resolveDynamicModel`             | Synchroner Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry enthalten sind       | Der Provider akzeptiert beliebige Modell-IDs des Upstream-Dienstes                                                                            |
| `prepareDynamicModel`             | Asynchrone Vorbereitung; anschließend wird `resolveDynamicModel` erneut ausgeführt                              | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                |
| `normalizeResolvedModel`          | Abschließende Anpassung, bevor der eingebettete Runner das aufgelöste Modell verwendet                          | Der Provider benötigt Transportanpassungen, verwendet aber weiterhin einen Core-Transport                                                     |
| `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie verarbeitet                                        | Der Provider benötigt eine Schema-Bereinigung für die Transportfamilie                                                                        |
| `inspectToolSchemas`              | Stellt nach der Normalisierung Provider-eigene Schemadiagnosen bereit                                           | Der Provider möchte vor Schlüsselwörtern warnen, ohne dem Core Provider-spezifische Regeln hinzuzufügen                                        |
| `resolveReasoningOutputMode`      | Wählt den nativen oder Tag-basierten Vertrag für die Reasoning-Ausgabe                                          | Der Provider benötigt Tag-basierte Reasoning-/Endausgaben anstelle nativer Felder                                                             |
| `prepareExtraParams`              | Normalisiert Anfrageparameter vor den generischen Wrappern für Stream-Optionen                                  | Der Provider benötigt standardmäßige Anfrageparameter oder eine Provider-spezifische Parameterbereinigung                                     |
| `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                          | Der Provider benötigt ein benutzerdefiniertes Übertragungsprotokoll und nicht nur einen Wrapper                                                |
| `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                    | Der Provider benötigt Kompatibilitäts-Wrapper für Anfrageheader, -text oder Modell, jedoch keinen benutzerdefinierten Transport                |
| `resolveTransportTurnState`       | Fügt native Transportheader oder Metadaten pro Interaktion hinzu                                                | Der Provider möchte, dass generische Transporte eine Provider-native Interaktionsidentität senden                                              |
| `resolveWebSocketSessionPolicy`   | Fügt native WebSocket-Header oder eine Abklingrichtlinie für Sitzungen hinzu                                    | Der Provider möchte bei generischen WS-Transporten Sitzungsheader oder die Fallback-Richtlinie anpassen                                        |
| `formatApiKey`                    | Formatierer für Authentifizierungsprofile: Das gespeicherte Profil wird zur `apiKey`-Zeichenfolge der Laufzeit  | Der Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt ein benutzerdefiniertes Format des Laufzeittokens                  |
| `refreshOAuth`                    | Überschreibt die OAuth-Aktualisierung für benutzerdefinierte Aktualisierungsendpunkte oder Fehlerrichtlinien    | Der Provider passt nicht zu den gemeinsamen OpenClaw-Aktualisierungsmechanismen                                                               |
| `buildAuthDoctorHint`             | Fügt bei fehlgeschlagener OAuth-Aktualisierung einen Reparaturhinweis an                                        | Der Provider benötigt nach einem Aktualisierungsfehler eigene Anweisungen zur Reparatur der Authentifizierung                                  |
| `matchesContextOverflowError`     | Provider-eigene Erkennung einer Überschreitung des Kontextfensters                                              | Der Provider liefert rohe Überlauffehler, die generische Heuristiken nicht erkennen würden                                                     |
| `classifyFailoverReason`          | Provider-eigene Klassifizierung des Failover-Grunds                                                            | Der Provider kann rohe API-/Transportfehler auf Ratenbegrenzung, Überlastung usw. abbilden                                                     |
| `isCacheTtlEligible`              | Richtlinie für den Prompt-Cache bei Proxy-/Backhaul-Providern                                                   | Der Provider benötigt Proxy-spezifische Zugangsregeln für die Cache-TTL                                                                       |
| `buildMissingAuthMessage`         | Ersetzt die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                                | Der Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                   |
| `augmentModelCatalog`             | Fügt nach der Erkennung synthetische/endgültige Katalogzeilen hinzu (veraltet, siehe unten)                     | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Auswahlelementen                                     |
| `resolveThinkingProfile`          | Modellspezifische Auswahl, Anzeigebezeichnungen und Standardwert für die `/think`-Stufe                         | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Abstufung oder binäre Bezeichnung bereit                          |
| `isBinaryThinking`                | Kompatibilitäts-Hook zum Ein-/Ausschalten von Reasoning                                                        | Der Provider unterstützt nur binäres Ein-/Ausschalten von Thinking                                                                            |
| `supportsXHighThinking`           | Kompatibilitäts-Hook für die Reasoning-Unterstützung von `xhigh`                                                | Der Provider möchte `xhigh` nur für eine Teilmenge der Modelle aktivieren                                                                     |
| `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für die standardmäßige `/think`-Stufe                                                     | Der Provider definiert die standardmäßige `/think`-Richtlinie für eine Modellfamilie                                                          |
| `isModernModelRef`                | Erkennung moderner Modelle für Live-Profilfilter und Smoke-Auswahl                                              | Der Provider definiert die bevorzugte Modellzuordnung für Live-/Smoke-Tests                                                                   |
| `prepareRuntimeAuth`              | Tauscht konfigurierte Anmeldedaten unmittelbar vor der Inferenz gegen das tatsächliche Laufzeittoken bzw. den Laufzeitschlüssel aus | Der Provider benötigt einen Tokenaustausch oder kurzlebige Anmeldedaten für die Anfrage                                                        |
| `resolveUsageAuth`                | Löst Anmeldedaten für Nutzung/Abrechnung für `/usage` und zugehörige Statusoberflächen auf                       | Der Provider benötigt eine benutzerdefinierte Analyse des Nutzungs-/Kontingenttokens oder andere Anmeldedaten für die Nutzung                  |
| `fetchUsageSnapshot`              | Ruft nach Auflösung der Authentifizierung Provider-spezifische Nutzungs-/Kontingentübersichten ab und normalisiert sie | Der Provider benötigt einen Provider-spezifischen Nutzungsendpunkt oder Parser für dessen Nutzdaten                                            |
| `createEmbeddingProvider`         | Einen Provider-eigenen Embedding-Adapter für Speicher/Suche erstellen                                          | Das Verhalten von Speicher-Embeddings gehört in das Provider-Plugin                                                                            |
| `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Verarbeitung des Transkripts für den Provider steuert               | Der Provider benötigt eine benutzerdefinierte Transkriptrichtlinie (beispielsweise zum Entfernen von Denkblöcken)                              |
| `sanitizeReplayHistory`           | Den Replay-Verlauf nach der allgemeinen Transkriptbereinigung umschreiben                                      | Der Provider benötigt Provider-spezifische Replay-Anpassungen, die über die gemeinsamen Compaction-Hilfsfunktionen hinausgehen                 |
| `validateReplayTurns`             | Abschließende Validierung oder Umformung der Replay-Turns vor dem eingebetteten Runner                          | Der Provider-Transport benötigt nach der allgemeinen Bereinigung eine strengere Validierung der Turns                                           |
| `onModelSelected`                 | Provider-eigene Nebeneffekte nach der Auswahl ausführen                                                        | Der Provider benötigt Telemetrie oder Provider-eigenen Zustand, wenn ein Modell aktiv wird                                                      |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und durchlaufen dann weitere Provider-Plugins mit
Hook-Unterstützung, bis eines davon die Modell-ID beziehungsweise den
Transport/die Konfiguration tatsächlich ändert. Dadurch funktionieren
Alias-/Kompatibilitäts-Provider-Shims weiterhin, ohne dass der Aufrufer wissen
muss, welches gebündelte Plugin für die Umschreibung zuständig ist. Wenn kein
Provider-Hook einen unterstützten Konfigurationseintrag der Google-Familie
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
`{ handled: true }` zurück, wenn die Provider-eigene Authentifizierung für die
Nutzungsabfrage die Anfrage verarbeitet hat und den generischen Fallback auf
API-Schlüssel/OAuth unterdrücken muss, und geben Sie `null` oder `undefined`
zurück, wenn der Provider die Authentifizierung für die Nutzungsabfrage nicht
verarbeitet hat.

Deklarieren Sie Organisations- oder Abrechnungsanmeldedaten im Manifest unter
`providerUsageAuthEnvVars`. Dadurch können generische Erkennungs- und
Secret-Bereinigungsoberflächen sie erkennen, ohne sie zu Kandidaten für die
Inferenzauthentifizierung zu machen.

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
den Anforderungen des jeweiligen Anbieters an Katalog, Authentifizierung,
Denkprozesse, Replay und Nutzung. Der maßgebliche Hook-Satz befindet sich bei
jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Strukturen,
anstatt die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Provider mit durchgereichtem Katalog">
    OpenRouter, Kilocode, Z.AI und xAI registrieren `catalog` zusammen mit
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie vorgeschaltete
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
    anstatt die Bereinigung in jedem Plugin neu zu implementieren.
  </Accordion>
  <Accordion title="Provider ausschließlich mit Katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und verwenden die gemeinsame
    Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Hilfsfunktionen">
    Beta-Header, `/fast` / `serviceTier` und `context1m` befinden sich innerhalb
    der öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle des
    Anthropic-Plugins (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) und nicht im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Laufzeit-Hilfsfunktionen

Plugins können über `api.runtime` auf ausgewählte Kern-Hilfsfunktionen zugreifen.
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

- `textToSpeech` gibt die normale TTS-Ausgabenutzlast des Kerns für Datei-/Sprachnotizoberflächen zurück.
- Verwendet die Kernkonfiguration `messages.tts` und die Provider-Auswahl.
- Gibt einen PCM-Audiopuffer und die Abtastrate zurück. Plugins müssen für die Provider neu abtasten/kodieren.
- `listVoices` ist je Provider optional. Verwenden Sie es für anbietereigene Stimmenauswahlen oder Einrichtungsabläufe.
- Der Kern übergibt den Provider-Hooks für `listVoices` eine aufgelöste Request-Deadline; Provider-spezifische Zeitüberschreitungseinstellungen können sie überschreiben.
- Stimmenlisten können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeitstags für Provider-bewusste Auswahloberflächen enthalten.
- OpenAI und ElevenLabs unterstützen derzeit Telefonie. Microsoft nicht.

Plugins können über `api.registerSpeechProvider(...)` auch Sprachausgabe-Provider registrieren.

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

- Belassen Sie TTS-Richtlinien, Fallback und Antwortzustellung im Kern.
- Verwenden Sie Sprachausgabe-Provider für anbietereigenes Syntheseverhalten.
- Die veraltete Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Zuständigkeitsmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider verwalten, wenn OpenClaw
  diese Funktionsverträge hinzufügt.

Für das Verständnis von Bildern, Audio und Videos registrieren Plugins einen typisierten
Provider für Medienverständnis anstelle eines generischen Schlüssel-Wert-Containers:

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

- Belassen Sie Orchestrierung, Fallback, Konfiguration und Channel-Verkabelung im Kern.
- Belassen Sie das Anbieterverhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder und neue optionale Funktionen.
- Die Videogenerierung folgt bereits demselben Muster:
  - Der Kern verwaltet den Funktionsvertrag und die Laufzeit-Hilfsfunktion.
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`.
  - Funktions-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`.

Für Laufzeit-Hilfsfunktionen zum Medienverständnis können Plugins Folgendes aufrufen:

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

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche
  für das Verständnis von Bildern, Audio und Videos.
- `extractStructuredWithModel(...)` ist die Plugin-seitige Schnittstelle für begrenzte,
  Provider-eigene, bildorientierte Extraktion. Fügen Sie mindestens eine Bildeingabe ein;
  Texteingaben dienen als ergänzender Kontext. Produkt-Plugins verwalten ihre Routen und
  Schemas, während OpenClaw die Provider-/Laufzeitgrenze verwaltet.
- Verwendet die Audiokonfiguration des Kern-Medienverständnisses (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (beispielsweise bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können über `api.runtime.subagent` auch Subagent-Läufe im Hintergrund starten:

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

- `provider` und `model` sind optionale Überschreibungen je Lauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur bei vertrauenswürdigen Aufrufern.
- Für Plugin-eigene Fallback-Läufe müssen Betreiber dies mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktivieren.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken, oder `"*"`, um ausdrücklich jedes Ziel zuzulassen.
- Subagent-Läufe nicht vertrauenswürdiger Plugins funktionieren weiterhin, Überschreibungsanfragen werden jedoch abgelehnt, anstatt stillschweigend auf einen Fallback zurückzugreifen.
- Von Plugins erstellte Subagent-Sitzungen werden mit der ID des erstellenden Plugins gekennzeichnet. Der Fallback `api.runtime.subagent.deleteSession(...)` darf nur diese eigenen Sitzungen löschen; das Löschen beliebiger Sitzungen erfordert weiterhin eine Gateway-Anfrage mit Administratorberechtigung.

Für die Websuche können Plugins die gemeinsame Laufzeit-Hilfsfunktion verwenden,
anstatt auf die Verkabelung der Agent-Werkzeuge zuzugreifen:

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

Plugins können über `api.registerWebSearchProvider(...)` auch Websuch-Provider
registrieren.

Hinweise:

- Belassen Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Kern.
- Verwenden Sie Websuch-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Funktions-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Wrapper des Agent-Werkzeugs abhängig zu sein.

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

- `generate(...)`: Erzeugt ein Bild über die konfigurierte Kette von Bildgenerierungs-Providern.
- `listProviders(...)`: Listet verfügbare Bildgenerierungs-Provider und ihre Funktionen auf.

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
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: Gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Sich überschneidende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Behalten Sie `exact`/`prefix`-Weiterleitungsketten ausschließlich auf derselben Authentifizierungsstufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Operator-Laufzeitbereiche. Sie sind für vom Plugin verwaltete Webhooks/Signaturverifizierung vorgesehen, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` werden innerhalb eines Gateway-Anfragelaufzeitbereichs ausgeführt. Die Standardoberfläche (`gatewayRuntimeScopeSurface: "write-default"`) ist bewusst konservativ:
  - Die Bearer-Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode = "token"` / `"password"`) sowie jede Authentifizierungsmethode ohne vertrauenswürdigen Proxy erhalten einen einzelnen Bereich `operator.write`, selbst wenn der Aufrufer `x-openclaw-scopes` sendet.
  - `trusted-proxy`-Aufrufer ohne expliziten `x-openclaw-scopes`-Header behalten ebenfalls die bisherige Oberfläche, die ausschließlich `operator.write` umfasst.
  - `trusted-proxy`-Aufrufer, die `x-openclaw-scopes` senden, erhalten stattdessen die deklarierten Bereiche.
  - Eine Route kann `gatewayRuntimeScopeSurface: "trusted-operator"` aktivieren, damit `x-openclaw-scopes` bei identitätstragenden Authentifizierungsmodi immer berücksichtigt wird (wenn der Header fehlt, wird auf den vollständigen Standardsatz von CLI-Bereichen zurückgegriffen).
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Gateway-authentifizierte Plugin-Route implizit eine Administratoroberfläche ist. Wenn Ihre Route ausschließlich Administratoren vorbehaltenes Verhalten benötigt, aktivieren Sie die Bereichsoberfläche `trusted-operator`, verlangen Sie einen identitätstragenden Authentifizierungsmodus und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.
- Nach Routenabgleich und Authentifizierung unterliegen gewöhnliche Handler der Zugangssteuerung für Gateway-Hauptaufgaben. Ein vorbereitetes oder neu startendes Gateway gibt `503` zurück, bevor der Handler aufgerufen wird. Die eng begrenzte Ausnahme ist eine durch das Manifest berechtigte Route mit `auth: "gateway"`, die außerdem die routenspezifische Oberfläche `trusted-operator` aktiviert; sie bleibt erreichbar, damit die Weiterleitung der Steuerung zur Aussetzung nicht blockiert wird, während gewöhnliche benachbarte Routen desselben Plugins weiterhin hinter der Zugangsgrenze liegen. Die Zuständigkeit von WebSocket-`handleUpgrade` verwendet dieselbe atomare Zugangsgrenze; sobald der Handler einen Socket akzeptiert, liegt dessen weitere Lebensdauer in der Verantwortung des Plugins und wird von dieser Grenze nicht nachverfolgt.

## Importpfade des Plugin SDK

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Unterpfade anstelle des monolithischen Root-Barrels `openclaw/plugin-sdk`. Kern-Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive zur Plugin-Registrierung                 |
| `openclaw/plugin-sdk/channel-core`  | Hilfsfunktionen für Kanaleinstieg und -erstellung  |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Hilfsfunktionen und übergreifender Vertrag |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema der Root-`openclaw.json` (`OpenClawSchema`) |

Kanal-Plugins wählen aus einer Familie schmaler Schnittstellen aus: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Das Genehmigungsverhalten sollte in
einem einzigen `approvalCapability`-Vertrag gebündelt werden, statt über
nicht zusammengehörige Plugin-Felder verteilt zu sein. Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurationshilfen befinden sich unter passenden, fokussierten
`*-runtime`-Unterpfaden (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`,
`heartbeat-runtime`, `channel-activity-runtime` usw.). Bevorzugen Sie
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und
`config-mutation` gegenüber dem breiten Kompatibilitäts-Barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
kleine Fassaden für Kanal-Hilfsfunktionen, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
und `openclaw/plugin-sdk/infra-runtime` sind veraltete Kompatibilitäts-Shims für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive
importieren.
</Info>

Repo-interne Einstiegspunkte (je Root des gebündelten Plugin-Pakets):

- `index.js` — Einstiegspunkt des gebündelten Plugins
- `api.js` — Barrel für Hilfsfunktionen/Typen
- `runtime-api.js` — ausschließlich für die Laufzeit bestimmtes Barrel
- `setup-entry.js` — Einstiegspunkt des Einrichtungs-Plugins

Externe Plugins sollten ausschließlich Unterpfade von `openclaw/plugin-sdk/*`
importieren. Importieren Sie niemals `src/*` eines anderen Plugin-Pakets aus
dem Kern oder einem anderen Plugin. Über eine Fassade geladene Einstiegspunkte
bevorzugen den aktiven Snapshot der Laufzeitkonfiguration, sofern vorhanden,
und greifen andernfalls auf die aufgelöste Konfigurationsdatei auf dem
Datenträger zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie derzeit verwenden. Sie
sind nicht automatisch langfristig unveränderliche externe Verträge. Prüfen
Sie die entsprechende SDK-Referenzseite, wenn Sie sich auf sie verlassen.

## Schemas für Nachrichtenwerkzeuge

Plugins sollten kanalspezifische Schemabeiträge für `describeMessageTool(...)`
für Primitive übernehmen, die keine Nachrichten sind, beispielsweise
Reaktionen, Lesebestätigungen und Umfragen. Die gemeinsame Sendedarstellung
sollte den generischen Vertrag `MessagePresentation` anstelle von
Provider-nativen Schaltflächen-, Komponenten-, Block- oder Kartenfeldern
verwenden. Informationen zum Vertrag, zu Fallback-Regeln, zur Provider-Zuordnung
und zur Prüfliste für Plugin-Autoren finden Sie unter
[Nachrichtendarstellung](/de/plugins/message-presentation).

Sendefähige Plugins deklarieren über Nachrichtenfähigkeiten, was sie darstellen
können:

- `presentation` für semantische Darstellungsblöcke (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` für Anforderungen zur angehefteten Zustellung

Der Kern entscheidet, ob die Darstellung nativ gerendert oder auf Text
reduziert wird. Stellen Sie über das generische Nachrichtenwerkzeug keine
Provider-nativen UI-Ausweichmöglichkeiten bereit. Veraltete SDK-Hilfsfunktionen
für bisherige native Schemas bleiben für bestehende Drittanbieter-Plugins
exportiert, neue Plugins sollten sie jedoch nicht verwenden.

## Auflösung von Kanalzielen

Kanal-Plugins sollten die kanalspezifische Zielsemantik übernehmen. Halten Sie
den gemeinsamen ausgehenden Host generisch und verwenden Sie die Oberfläche
des Nachrichtenadapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet vor der Verzeichnissuche,
  ob ein normalisiertes Ziel als `direct`, `group` oder `channel` behandelt
  werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Kern mit,
  ob eine Eingabe direkt mit einer ID-ähnlichen Auflösung verarbeitet werden
  soll, anstatt das Verzeichnis zu durchsuchen.
- `messaging.targetResolver.reservedLiterals` listet einzelne Wörter auf, die
  für diesen Provider Kanal-/Sitzungsreferenzen darstellen. Bei der Auflösung
  werden konfigurierte Verzeichniseinträge berücksichtigt, bevor reservierte
  Literale abgelehnt werden; bei einem Fehlschlag der Verzeichnissuche wird
  anschließend sicher abgebrochen.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Kern nach der Normalisierung oder nach einem Fehlschlag der
  Verzeichnissuche eine abschließende, vom Provider verwaltete Auflösung
  benötigt.
- `messaging.resolveOutboundSessionRoute(...)` übernimmt die Provider-spezifische
  Erstellung der Sitzungsroute, sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor der
  Suche nach Kontakten/Gruppen erfolgen sollen.
- Verwenden Sie `looksLikeId` für Prüfungen nach dem Muster „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` als Fallback für die Provider-spezifische
  Normalisierung, nicht für eine umfassende Verzeichnissuche.
- Behalten Sie Provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und
  Raum-IDs innerhalb von `target`-Werten oder Provider-spezifischen Parametern,
  nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese
Logik im Plugin belassen und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Kontakte/Gruppen
benötigt, beispielsweise:

- durch Zulassungslisten gesteuerte Direktnachrichtenkontakte
- konfigurierte Kanal-/Gruppenzuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` übernehmen nur
generische Operationen:

- Abfragefilterung
- Anwendung von Begrenzungen
- Hilfsfunktionen zur Deduplizierung/Normalisierung
- Erstellung von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoprüfungen und ID-Normalisierungen sollten in der
Plugin-Implementierung verbleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Struktur zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs,
Standard-Basis-URLs oder authentifizierungsabhängige Modellmetadaten verwaltet.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache, durch API-Schlüssel oder Umgebungsvariablen gesteuerte Provider
- `profile`: Provider, die bei vorhandenen Authentifizierungsprofilen erscheinen
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge erzeugen
- `late`: letzter Durchlauf nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins einen
integrierten Provider-Eintrag mit derselben Provider-ID gezielt überschreiben
können.

Plugins können außerdem schreibgeschützte Modellzeilen über
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` veröffentlichen. Dies ist der zukünftige Weg für Listen-, Hilfe- und
Auswahloberflächen und unterstützt Zeilen für `text`, `voice`,
`image_generation`, `video_generation` und `music_generation`. Provider-Plugins
bleiben für Live-Endpunktaufrufe, Token-Austausch und die Zuordnung von
Herstellerantworten zuständig; der Kern übernimmt die gemeinsame Zeilenstruktur,
Quellenbezeichnungen und die Formatierung der Hilfe für Medienwerkzeuge.
Registrierungen von Providern zur Mediengenerierung erzeugen automatisch
statische Katalogzeilen aus `defaultModel`, `models` und `capabilities`.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias, gibt jedoch eine
  Veraltungswarnung aus.
- Wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet
  OpenClaw `catalog` und gibt eine Warnung aus.
- `augmentModelCatalog` ist veraltet; gebündelte Provider sollten ergänzende
  Zeilen über `registerModelCatalogProvider` veröffentlichen.

## Schreibgeschützte Kanalprüfung

Wenn Ihr Plugin einen Kanal registriert, sollten Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit
`resolveAccount(...)` implementieren.

Gründe:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf davon ausgehen, dass
  Zugangsdaten vollständig materialisiert sind, und kann sofort fehlschlagen,
  wenn erforderliche Geheimnisse fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`,
  `openclaw status --all`, `openclaw channels status`,
  `openclaw channels resolve` sowie Reparaturabläufe für Doctor/Konfiguration
  sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um die
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Geben Sie nur einen beschreibenden Kontostatus zurück.
- Behalten Sie `enabled` und `configured` bei.
- Geben Sie bei Bedarf Felder für Quelle und Status der Zugangsdaten an, beispielsweise:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine unverschlüsselten Tokenwerte zurückgeben, nur um die schreibgeschützte
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (zusammen
  mit dem entsprechenden Quellfeld) reicht für Statusbefehle aus.
- Verwenden Sie `configured_unavailable`, wenn Zugangsdaten über SecretRef konfiguriert,
  aber im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad
nicht verfügbar“ melden, anstatt abzustürzen oder das Konto fälschlicherweise
als nicht konfiguriert auszuweisen.

## Paketbündel

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

Jeder Eintrag wird zu einem Plugin. Wenn das Bündel mehrere Erweiterungen auflistet,
wird die Plugin-ID zu `<manifestOrPackageName>/<fileBase>` (die Manifest-ID hat
Vorrang, sofern vorhanden; andernfalls wird der Name aus `package.json` ohne
Namensraum verwendet).

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie diese in diesem
Verzeichnis, sodass `node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsvorkehrung: Jeder Eintrag in `openclaw.extensions` muss nach der
Auflösung symbolischer Verknüpfungen innerhalb des Plugin-Verzeichnisses verbleiben.
Einträge, die aus dem Paketverzeichnis herausführen, werden abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten
mit einem projektlokalen `npm install --omit=dev --ignore-scripts` (keine
Lebenszyklusskripte und zur Laufzeit keine Entwicklungsabhängigkeiten), wobei
übernommene globale npm-Installationseinstellungen ignoriert werden.
Halten Sie die Abhängigkeitsbäume von Plugins „reines JS/TS“ und vermeiden Sie
Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein schlankes Modul verweisen, das nur
für die Einrichtung bestimmt ist. Wenn OpenClaw Einrichtungsoberflächen für ein
deaktiviertes Kanal-Plugin benötigt oder wenn ein Kanal-Plugin aktiviert, aber
noch nicht konfiguriert ist, lädt es `setupEntry` anstelle des vollständigen
Plugin-Einstiegspunkts. Dadurch bleiben Start und Einrichtung schlanker, wenn
Ihr Haupt-Plugin-Einstiegspunkt zusätzlich Werkzeuge, Hooks oder anderen
ausschließlich zur Laufzeit benötigten Code einbindet.

Optional: Mit `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin während der Vorbereitungsphase vor dem Lauschen des Gateways
denselben `setupEntry`-Pfad verwenden, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die vor dem Beginn des Lauschens durch
den Gateway erforderliche Startoberfläche vollständig abdeckt. In der Praxis
bedeutet dies, dass der Einrichtungseinstiegspunkt jede kanaleigene Fähigkeit
registrieren muss, von der der Start abhängt, beispielsweise:

- die Kanalregistrierung selbst
- sämtliche HTTP-Routen, die verfügbar sein müssen, bevor der Gateway mit dem Lauschen beginnt
- sämtliche Gateway-Methoden, Werkzeuge oder Dienste, die im selben Zeitraum vorhanden sein müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche Startfähigkeit
bereitstellt, aktivieren Sie dieses Flag nicht. Behalten Sie für das Plugin das
Standardverhalten bei und lassen Sie OpenClaw während des Starts den vollständigen
Einstiegspunkt laden.

Gebündelte Kanäle können außerdem Hilfsfunktionen für die reine Einrichtungs-
Vertragsoberfläche veröffentlichen, die der Kern abfragen kann, bevor die vollständige
Kanallaufzeit geladen wird. Die aktuelle Einrichtungsoberfläche für die Überführung ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Kern verwendet diese Oberfläche, wenn er eine veraltete Einzelkonto-
Kanalkonfiguration nach `channels.<id>.accounts.*` überführen muss, ohne den
vollständigen Plugin-Einstiegspunkt zu laden. Matrix ist das aktuelle gebündelte
Beispiel: Wenn bereits benannte Konten vorhanden sind, verschiebt es nur
Authentifizierungs-/Bootstrap-Schlüssel in ein benanntes überführtes Konto und
kann einen konfigurierten, nicht kanonischen Schlüssel für das Standardkonto
beibehalten, anstatt immer `accounts.default` zu erstellen.

Diese Einrichtungs-Patchadapter halten die Ermittlung gebündelter Vertragsoberflächen
träge. Die Importzeit bleibt kurz; die Überführungsoberfläche wird erst bei der
ersten Verwendung geladen, anstatt beim Modulimport den Start gebündelter Kanäle
erneut auszuführen.

Wenn diese Startoberflächen Gateway-RPC-Methoden umfassen, behalten Sie dafür
ein Plugin-spezifisches Präfix bei. Die administrativen Kern-Namensräume
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
werden stets in `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren
Geltungsbereich anfordert.

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

Kanal-Plugins können über `openclaw.channel` Metadaten für Einrichtung und
Ermittlung sowie über `openclaw.install` Installationshinweise bereitstellen.
Dadurch bleibt der Kernkatalog frei von Daten.

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

Nützliche Felder von `openclaw.channel`, die über das Minimalbeispiel hinausgehen:

- `detailLabel`: sekundäre Bezeichnung für ausführlichere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Dokumentationslink
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung des Textes auf der Auswahloberfläche
- `markdownCapable`: kennzeichnet den Kanal für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig
- `exposure.configured`: blendet den Kanal in Auflistungsoberflächen für konfigurierte Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal in interaktiven Auswahlmenüs für Einrichtung/Konfiguration aus, wenn auf `false` gesetzt
- `exposure.docs`: kennzeichnet den Kanal für Dokumentations-Navigationsoberflächen als intern/privat
- `showConfigured` / `showInSetup`: veraltete Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: nimmt den Kanal in den standardmäßigen `allowFrom`-Ablauf für den Schnellstart auf
- `forceAccountBinding`: erfordert eine explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist
- `preferSessionLookupForAnnounceTarget`: bevorzugt die Sitzungssuche beim Auflösen von Bekanntgabezielen

OpenClaw kann außerdem **externe Kanalkataloge** zusammenführen (beispielsweise
einen Export aus einer MPM-Registry). Legen Sie eine JSON-Datei an einem der
folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Alternativ können Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder
`OPENCLAW_MPM_CATALOG_PATHS`) auf eine oder mehrere JSON-Dateien verweisen lassen
(durch Kommas, Semikolons oder `PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als
veraltete Aliasse für den Schlüssel `"entries"`.

Generierte Einträge des Kanalkatalogs und Einträge des Provider-Installationskatalogs
stellen neben dem unverarbeiteten Block `openclaw.install` normalisierte Angaben
zur Installationsquelle bereit. Die normalisierten Angaben zeigen, ob die
npm-Spezifikation eine exakte Version oder ein variabler Selektor ist, ob die
erwarteten Integritätsmetadaten vorhanden sind und ob außerdem ein lokaler
Quellpfad verfügbar ist. Wenn die Katalog-/Paketidentität bekannt ist, warnen die
normalisierten Angaben, falls der ausgelesene npm-Paketname von dieser Identität
abweicht. Sie warnen außerdem, wenn `defaultChoice` ungültig ist oder auf eine
nicht verfügbare Quelle verweist und wenn npm-Integritätsmetadaten ohne eine
gültige npm-Quelle vorhanden sind. Verbraucher sollten `installSource` als
additives optionales Feld behandeln, damit manuell erstellte Einträge und
Katalog-Kompatibilitätsschichten es nicht erzeugen müssen.
Dadurch können Onboarding und Diagnose den Zustand der Quellebene erläutern,
ohne die Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` zusammen mit
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren
aus Kompatibilitätsgründen weiterhin, zeigen jedoch Warnungen zur Quellebene an,
damit der Katalog schrittweise zu festgeschriebenen, integritätsgeprüften
Installationen übergehen kann, ohne bestehende Plugins zu beeinträchtigen.
Wenn das Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen
verwalteten Plugin-Indexeintrag mit `source: "path"` und nach Möglichkeit einem
arbeitsbereichsrelativen `sourcePath` auf. Der absolute operative Ladepfad
verbleibt in `plugins.load.paths`; der Installationseintrag vermeidet es, lokale
Arbeitsstationspfade in die langlebige Konfiguration zu duplizieren. Dadurch
bleiben lokale Entwicklungsinstallationen für die Diagnose der Quellebene
sichtbar, ohne eine zweite Offenlegungsoberfläche für unverarbeitete
Dateisystempfade hinzuzufügen. Die persistierte SQLite-Tabelle
`installed_plugin_index` ist die maßgebliche Quelle für Installationen und kann
aktualisiert werden, ohne Plugin-Laufzeitmodule zu laden. Ihre `installRecords`-
Zuordnung bleibt dauerhaft erhalten, selbst wenn ein Plugin-Manifest fehlt oder
ungültig ist; ihre `plugins`-Nutzlast ist eine wiederherstellbare Manifestansicht.

## Plugins für Kontext-Engines

Plugins für Kontext-Engines übernehmen die Orchestrierung des Sitzungskontexts
für Aufnahme, Zusammenstellung und Compaction. Registrieren Sie sie aus Ihrem
Plugin mit `api.registerContextEngine(id, factory)` und wählen Sie anschließend
die aktive Engine mit `plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die standardmäßige Kontextpipeline ersetzen
oder erweitern muss, anstatt lediglich Speichersuche oder Hooks hinzuzufügen.

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
`workspaceDir` zur Initialisierung während der Erstellung bereit.

`assemble()` kann `contextProjection` zurückgeben, wenn das aktive Testgerüst
über einen persistenten Backend-Thread verfügt. Lassen Sie es für die veraltete
Projektion pro Durchlauf weg. Geben Sie `{ mode: "thread_bootstrap", epoch }`
zurück, wenn der zusammengestellte Kontext einmalig in einen Backend-Thread
eingefügt und bis zur Änderung der Epoche wiederverwendet werden soll. Ändern Sie
die Epoche nach semantischen Änderungen am Kontext der Engine, beispielsweise
nach einem von der Engine gesteuerten Compaction-Durchlauf. Hosts können
Metadaten von Werkzeugaufrufen, die Eingabeform und bereinigte Werkzeugergebnisse
in einer Thread-Bootstrap-Projektion beibehalten, damit neue Backend-Threads die
Werkzeugkontinuität bewahren, ohne unverarbeitete, geheimnishaltige Nutzlasten
zu kopieren.

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie
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

## Hinzufügen einer neuen Fähigkeit

Wenn ein Plugin ein Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie das Plugin-System nicht durch einen privaten internen Zugriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. **Definieren Sie den Kernvertrag.** Legen Sie fest, welches gemeinsame Verhalten der Kern übernehmen soll: Richtlinien, Fallback, Zusammenführung der Konfiguration, Lebenszyklus, kanalbezogene Semantik und Form der Runtime-Hilfsfunktion.
2. **Fügen Sie typisierte Oberflächen für Plugin-Registrierung und Runtime hinzu.** Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste zweckmäßige typisierte Fähigkeitsoberfläche.
3. **Binden Sie Kern und Kanal-/Funktionsnutzer an.** Kanäle und Funktions-Plugins sollten die neue Fähigkeit über den Kern nutzen, statt eine herstellerspezifische Implementierung direkt zu importieren.
4. **Registrieren Sie herstellerspezifische Implementierungen.** Hersteller-Plugins registrieren anschließend ihre Backends für die Fähigkeit.
5. **Fügen Sie Vertragsabdeckung hinzu.** Fügen Sie Tests hinzu, damit Eigentümerschaft und Registrierungsform dauerhaft explizit bleiben.

Auf diese Weise behält OpenClaw klare Vorgaben bei, ohne fest auf die Weltsicht eines einzelnen Providers zugeschnitten zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel finden Sie im [Kochbuch für Fähigkeiten](/de/plugins/adding-capabilities).

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung normalerweise die folgenden Oberflächen gemeinsam betreffen:

- Kernvertragstypen in `src/<capability>/types.ts`
- Kern-Runner bzw. Runtime-Hilfsfunktion in `src/<capability>/runtime.ts`
- Registrierungsoberfläche der Plugin-API in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung über die Plugin-Runtime in `src/plugins/runtime/*`, wenn Funktions-/Kanal-Plugins darauf zugreifen müssen
- Erfassungs-/Testhilfen in `src/test-utils/plugin-registration.ts`
- Prüfungen der Eigentümerschaft und Verträge in `src/plugins/contracts/registry.ts`
- Dokumentation für Betreiber und Plugins in `docs/`

Wenn eine dieser Oberflächen fehlt, deutet das normalerweise darauf hin, dass die Fähigkeit noch nicht vollständig integriert ist.

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

Muster für Vertragstests (`src/plugins/contracts/registry.ts` stellt Abfragen der Eigentümerschaft wie `providerContractPluginIds` bereit; Tests prüfen, ob die Liste `contracts.videoGenerationProviders` eines Plugins mit den tatsächlich registrierten Einträgen übereinstimmt):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- Der Kern übernimmt den Fähigkeitsvertrag und die Orchestrierung.
- Hersteller-Plugins übernehmen herstellerspezifische Implementierungen.
- Funktions-/Kanal-Plugins nutzen Runtime-Hilfsfunktionen.
- Vertragstests halten die Eigentümerschaft explizit.

## Verwandte Themen

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Fähigkeitsmodell und zugehörige Formen
- [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths)
- [Einrichtung des Plugin-SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
