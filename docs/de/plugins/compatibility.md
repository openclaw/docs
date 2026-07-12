---
read_when:
    - Sie pflegen ein OpenClaw-Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Migration des Plugin-SDKs oder Manifests
summary: Plugin-Kompatibilitätsverträge, Metadaten zur Einstellung und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-07-12T01:54:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw bindet ältere Plugin-Verträge über benannte Kompatibilitätsadapter
weiterhin ein, bevor sie entfernt werden. Dies schützt vorhandene gebündelte
und externe Plugins, während sich die Verträge für SDK, Manifest, Einrichtung,
Konfiguration und Agent-Runtime weiterentwickeln.

## Kompatibilitätsregister

Plugin-Kompatibilitätsverträge werden im zentralen Register unter
`src/plugins/compat/registry.ts` nachverfolgt. Jeder Eintrag enthält:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Verantwortungsbereich: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` oder `core`
- Einführungs- und, sofern zutreffend, Veraltungsdaten
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Das Register dient als Grundlage für die Planung durch Maintainer und für
künftige Prüfungen durch den Plugin-Inspektor. Wenn sich ein für Plugins
relevantes Verhalten ändert, fügen Sie im selben Änderungssatz, der den
Adapter hinzufügt, den Kompatibilitätseintrag hinzu oder aktualisieren Sie ihn.

Die Kompatibilität von Doctor-Reparaturen und -Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge
decken alte Konfigurationsstrukturen, Layouts des Installationsverzeichnisses
und Reparatur-Shims ab, die möglicherweise weiterhin verfügbar bleiben müssen,
nachdem der Runtime-Kompatibilitätspfad entfernt wurde.

Bei Release-Prüfungen sollten beide Register kontrolliert werden. Löschen Sie
eine Doctor-Migration nicht allein deshalb, weil der zugehörige Runtime- oder
Konfigurations-Kompatibilitätseintrag abgelaufen ist. Prüfen Sie zunächst, ob
kein unterstützter Upgrade-Pfad die Reparatur noch benötigt. Validieren Sie bei
der Release-Planung außerdem jede Ersatzangabe erneut, da sich die
Plugin-Verantwortung und der Konfigurationsumfang ändern können, wenn Provider
und Kanäle aus dem Core verlagert werden.

## Veraltungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht im selben Release
entfernen, in dem sein Ersatz eingeführt wird. Migrationsabfolge:

1. Fügen Sie den neuen Vertrag hinzu.
2. Binden Sie das alte Verhalten weiterhin über einen benannten Kompatibilitätsadapter ein.
3. Geben Sie Diagnosen oder Warnungen aus, sobald Plugin-Autoren handeln können.
4. Dokumentieren Sie den Ersatz und den Zeitplan.
5. Testen Sie sowohl den alten als auch den neuen Pfad.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie den alten Vertrag nur mit ausdrücklicher Genehmigung für ein Release mit inkompatiblen Änderungen.

Veraltete Einträge müssen ein Startdatum für die Warnung, einen Ersatz, einen
Dokumentationslink und ein endgültiges Entfernungsdatum enthalten, das höchstens
drei Monate nach Beginn der Warnungen liegt. Fügen Sie keinen veralteten
Kompatibilitätspfad mit einem unbefristeten Entfernungsfenster hinzu, es sei
denn, die Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte
Kompatibilität handelt, und kennzeichnen ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Das Register umfasst derzeit etwa 70 Kompatibilitätscodes in den folgenden
Bereichen. Neuer Plugin-Code sollte in jedem Bereich sowie im jeweiligen
Migrationsleitfaden den Ersatz verwenden. Vorhandene Plugins können einen
Kompatibilitätspfad weiterverwenden, bis Dokumentation, Diagnosen und
Release-Hinweise ein Entfernungsfenster ankündigen.

- veraltete breite SDK-Importe wie `openclaw/plugin-sdk/compat`
- veraltete reine Hook-Plugin-Strukturen und `before_agent_start`
- veraltete Namen für den Bereinigungs-Hook `api.on("deactivate", ...)`, während
  Plugins zu `gateway_stop` migrieren
- veraltete Plugin-Einstiegspunkte `activate(api)`, während Plugins zu
  `register(api)` migrieren
- veraltete SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, Status-Builder aus
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (ersetzt
  durch gezielte Test-Unterpfade unter `openclaw/plugin-sdk/*`) sowie die
  Typaliasse `ClawdbotConfig` / `OpenClawSchemaType`
- Zulassungslisten- und Aktivierungsverhalten gebündelter Plugins
- veraltete Manifestmetadaten für Umgebungsvariablen von Providern und Kanälen
- veraltete Provider-Plugin-Hooks und Typaliasse, während Provider zu
  expliziten Katalog-, Authentifizierungs-, Denk-, Wiedergabe- und
  Transport-Hooks wechseln
- veraltete Runtime-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` sowie die veralteten
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- flache Callback-Felder von WhatsApp `WebInboundMessage` (siehe unten)
- übergeordnete Zulassungsfelder von WhatsApp `WebInboundMessage` (siehe unten)
- veraltete geteilte Registrierung von Speicher-Plugins, während
  Speicher-Plugins zu `registerMemoryCapability` wechseln
- veraltete speicherspezifische Registrierung von Embedding-Providern, während
  Embedding-Provider zu `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` wechseln
- veraltete Kanal-SDK-Hilfsfunktionen für native Nachrichtenschemas,
  Erwähnungsbeschränkung, Formatierung eingehender Umschläge und Verschachtelung
  von Genehmigungsfunktionen
- veraltete Aliasse für Kanal-Routenschlüssel und Hilfsfunktionen für
  vergleichbare Ziele, während Plugins zu
  `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch die Verantwortungszuordnung von
  Manifestbeiträgen ersetzt werden
- Runtime-Fallback für `setup-api`, während Einrichtungsdeskriptoren zu den
  ohne Runtime auswertbaren Metadaten `setup.requiresRuntime: false` wechseln
- Provider-Hooks für `discovery`, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanalmetadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- veraltete Konfigurationsschlüssel für Runtime-Richtlinien, während Doctor
  Betreiber zu `agentRuntime` migriert
- Fallback für generierte Konfigurationsmetadaten gebündelter Kanäle, während
  registerbasierte `channelConfigs`-Metadaten eingeführt werden
- persistierte Umgebungs-Flags für die Deaktivierung des Plugin-Registers und
  die Installationsmigration, während Reparaturabläufe Betreiber zu
  `openclaw plugins registry --refresh` und `openclaw doctor --fix` migrieren
- veraltete Plugin-eigene Konfigurationspfade für Websuche, Webabruf und
  x_search, während Doctor sie zu `plugins.entries.<plugin>.config` migriert
- veraltete manuell erstellte `plugins.installs`-Konfigurationen und
  Ladepfad-Aliasse gebündelter Plugins, während Installationsmetadaten in das
  zustandsverwaltete Plugin-Verzeichnis verschoben werden

### Flache Aliasse für eingehende WhatsApp-Callbacks

WhatsApp-Runtime-Callbacks liefern `WebInboundMessage`: die kanonischen
verschachtelten Kontexte `event`, `payload`, `quote`, `group` und `platform`
sowie veraltete flache Aliasse für die ausgelieferten Callback-Felder. Neuer
Callback-Code sollte die verschachtelten Kontexte lesen. Code, der bereinigte
verschachtelte Callback-Nachrichten erstellt, kann
`WebInboundCallbackMessage` verwenden. Kompatibilitäts-Listener, die weiterhin
alte flache Test- oder Plugin-Nachrichten einschleusen, sollten
`LegacyFlatWebInboundMessage` oder `WebInboundMessageInput` verwenden.

Die flachen Aliasse bleiben bis zum **2026-08-30** verfügbar. Dieses Fenster
gilt nur für den Zugriff auf flache Aliasse, nicht für die verschachtelte
Struktur, die den kanonischen Runtime-Vertrag darstellt. Die
TypeScript-Annotation `@deprecated` jedes flachen Alias benennt seinen exakten
verschachtelten Ersatz. Häufige Beispiele:

- `id`, `timestamp` und `isBatched` werden unter `event` eingeordnet.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  und `untrustedStructuredContext` werden unter `payload` eingeordnet.
- `to`, `chatId`, Absender-/Selbstfelder, `sendComposing`, `reply(...)` und
  `sendMedia(...)` werden unter `platform` eingeordnet.
- `replyTo*`-Felder werden unter `quote` eingeordnet; Felder für
  Gruppenbetreff, Teilnehmer und Erwähnungen werden unter `group` eingeordnet.

`payload.untrustedStructuredContext` wird aus eingehenden Provider-Nutzdaten
extrahiert. Plugins sollten `label`, `source` und `type` prüfen, bevor sie
dessen `payload` als maßgeblich behandeln.

### Zulassungsfelder für eingehende WhatsApp-Nachrichten

Akzeptierte WhatsApp-Callback-Nachrichten enthalten `admission`, einen für die
öffentliche Weitergabe sicheren Umschlag für die Zugriffssteuerungsentscheidung,
durch die die Nachricht zugelassen wurde. Neuer Callback-Code sollte
Zulassungsinformationen aus `msg.admission` lesen statt aus den älteren
übergeordneten Zulassungsfeldern.

Die übergeordneten Felder bleiben bis zum **2026-08-30** verfügbar. Die
TypeScript-Annotation `@deprecated` jedes Feldes benennt dessen Ersatz:

- `from` und `conversationId` werden zu `admission.conversation.id` verschoben.
- `accountId` wird zu `admission.accountId` verschoben.
- `accessControlPassed` ist eine abgeleitete Kompatibilitätsansicht von
  `admission.ingress.decision === "allow"`; bei Nachrichten, die bereits
  `admission` enthalten, schreibt das Setzen des veralteten booleschen Werts
  den Eingangsgraphen nicht um.
- `chatType` wird zu `admission.conversation.kind` verschoben.

## Plugin-Inspektor-Paket

Der Plugin-Inspektor sollte außerhalb des zentralen OpenClaw-Repositorys als
separates Paket/Repository angesiedelt sein und auf den versionierten
Kompatibilitäts- und Manifestverträgen basieren. Die anfängliche CLI sollte
lauten:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte die Manifest-/Schemavalidierung, die geprüfte
Vertragskompatibilitätsversion, Prüfungen der Installations-/Quellmetadaten,
Importprüfungen für Pfade ohne Runtime sowie Veraltungs-/Kompatibilitätswarnungen
ausgeben. Verwenden Sie `--json` für eine stabile, maschinenlesbare Ausgabe in
CI-Anmerkungen. Der OpenClaw-Core sollte Verträge und Fixtures bereitstellen,
die der Inspektor verwenden kann, aber die Inspektor-Binärdatei nicht über das
Hauptpaket `openclaw` veröffentlichen.

### Abnahmelauf für Maintainer

Verwenden Sie die Crabbox-gestützte Blacksmith Testbox für den Abnahmelauf
installierbarer Pakete, wenn Sie den externen Inspektor mit OpenClaw-Plugin-
Paketen validieren. Führen Sie ihn nach dem Erstellen des Pakets aus einem
sauberen OpenClaw-Checkout aus:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Dieser Lauf sollte für Maintainer optional bleiben, da er ein externes
npm-Paket installiert und möglicherweise Plugin-Pakete prüft, die außerhalb
des Repositorys geklont wurden. Die lokalen Repository-Schutzprüfungen decken
die SDK-Exportzuordnung, Metadaten des Kompatibilitätsregisters, den Abbau
veralteter SDK-Importe und die Importgrenzen gebündelter Erweiterungen ab.
Der Inspektornachweis in der Testbox deckt das Paket so ab, wie externe
Plugin-Autoren es verwenden.

## Release-Hinweise

Release-Hinweise sollten bevorstehende Plugin-Veraltungen mit Zieldaten und
Links zur Migrationsdokumentation enthalten, bevor ein Kompatibilitätspfad zu
`removal-pending` oder `removed` wechselt.
