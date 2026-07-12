---
read_when:
    - Sie pflegen ein OpenClaw-Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Migration des Plugin-SDKs oder Manifests
summary: Plugin-Kompatibilitätsverträge, Metadaten zu veralteten Funktionen und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-07-12T15:33:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw bindet ältere Plugin-Verträge über benannte Kompatibilitätsadapter
weiterhin ein, bevor sie entfernt werden. Dies schützt bestehende gebündelte und externe
Plugins, während sich die Verträge für SDK, Manifest, Einrichtung, Konfiguration und Agent-Laufzeit
weiterentwickeln.

## Kompatibilitätsregister

Plugin-Kompatibilitätsverträge werden im zentralen Register unter
`src/plugins/compat/registry.ts` nachverfolgt. Jeder Eintrag umfasst:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Verantwortungsbereich: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` oder `core`
- Einführungs- und Einstellungsdaten, sofern zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Das Register dient als Grundlage für die Planung durch Maintainer und zukünftige Prüfungen durch den Plugin-
Inspektor. Wenn sich ein Plugin-relevantes Verhalten ändert, fügen Sie den
Kompatibilitätseintrag in derselben Änderung hinzu oder aktualisieren Sie ihn, mit der auch der Adapter hinzugefügt wird.

Kompatibilität für Doctor-Reparaturen und -Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge decken alte
Konfigurationsstrukturen, Layouts des Installationsbuchs und Reparatur-Shims ab, die möglicherweise
verfügbar bleiben müssen, nachdem der Laufzeit-Kompatibilitätspfad entfernt wurde.

Release-Prüfläufe sollten beide Register prüfen. Löschen Sie eine Doctor-
Migration nicht nur deshalb, weil der entsprechende Laufzeit- oder Konfigurations-Kompatibilitätseintrag
abgelaufen ist; überprüfen Sie zunächst, dass kein unterstützter Upgrade-Pfad die
Reparatur weiterhin benötigt. Überprüfen Sie während der Release-Planung auch jede Ersatzangabe
erneut, da sich Plugin-Verantwortung und Konfigurationsumfang ändern können, wenn Provider
und Kanäle aus dem Kern verschoben werden.

## Einstellungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht im selben Release
entfernen, in dem sein Ersatz eingeführt wird. Migrationsreihenfolge:

1. Fügen Sie den neuen Vertrag hinzu.
2. Binden Sie das alte Verhalten weiterhin über einen benannten Kompatibilitätsadapter ein.
3. Geben Sie Diagnosen oder Warnungen aus, sobald Plugin-Autoren handeln können.
4. Dokumentieren Sie den Ersatz und den Zeitplan.
5. Testen Sie sowohl den alten als auch den neuen Pfad.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie ihn nur mit ausdrücklicher Genehmigung für ein inkompatibles Release.

Als eingestellt markierte Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen Dokumentations-
Link und ein endgültiges Entfernungsdatum enthalten, das höchstens drei Monate nach Beginn der Warnungen
liegt. Fügen Sie keinen eingestellten Kompatibilitätspfad mit einem unbefristeten
Entfernungsfenster hinzu, es sei denn, die Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte
Kompatibilität handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Das Register verfolgt derzeit etwa 70 Kompatibilitätscodes in diesen
Bereichen. Neuer Plugin-Code sollte in jedem Bereich und im jeweiligen
Migrationsleitfaden den Ersatz verwenden; bestehende Plugins können einen Kompatibilitätspfad
weiterverwenden, bis Dokumentation, Diagnosen und Release-Hinweise ein Entfernungsfenster ankündigen.

- ältere umfassende SDK-Importe wie `openclaw/plugin-sdk/compat`
- ältere reine Hook-Plugin-Strukturen und `before_agent_start`
- ältere Namen für Bereinigungs-Hooks wie `api.on("deactivate", ...)`, während Plugins
  zu `gateway_stop` migrieren
- ältere Plugin-Einstiegspunkte `activate(api)`, während Plugins zu
  `register(api)` migrieren
- ältere SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, Status-Builder in `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (ersetzt durch gezielte
  `openclaw/plugin-sdk/*`-Test-Unterpfade) sowie die Typaliasse `ClawdbotConfig` /
  `OpenClawSchemaType`
- Zulassungslisten- und Aktivierungsverhalten gebündelter Plugins
- ältere Manifest-Metadaten für Provider-/Kanal-Umgebungsvariablen
- ältere Provider-Plugin-Hooks und Typaliasse, während Provider zu
  expliziten Katalog-, Authentifizierungs-, Denk-, Wiedergabe- und Transport-Hooks wechseln
- ältere Laufzeit-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` und die eingestellten
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- flache Callback-Felder von WhatsApp `WebInboundMessage` (siehe unten)
- übergeordnete Zulassungsfelder von WhatsApp `WebInboundMessage` (siehe unten)
- ältere geteilte Registrierung für Speicher-Plugins, während Speicher-Plugins zu
  `registerMemoryCapability` wechseln
- ältere speicherspezifische Registrierung von Embedding-Providern, während Embedding-
  Provider zu `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` wechseln
- ältere Kanal-SDK-Hilfsfunktionen für native Nachrichtenschemata, Erwähnungsfilterung,
  Formatierung eingehender Umschläge und Verschachtelung von Genehmigungsfähigkeiten
- ältere Aliasse für Kanal-Routenschlüssel und Hilfsfunktionen für vergleichbare Ziele, während
  Plugins zu `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch Verantwortlichkeit für Manifest-Beiträge ersetzt werden
- Laufzeit-Fallback von `setup-api`, während Einrichtungsdeskriptoren zu kalten
  `setup.requiresRuntime: false`-Metadaten wechseln
- Provider-`discovery`-Hooks, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanal-Metadaten `showConfigured` / `showInSetup`, während Kanalpakete
  zu `openclaw.channel.exposure` wechseln
- ältere Konfigurationsschlüssel für Laufzeitrichtlinien, während Doctor Betreiber zu
  `agentRuntime` migriert
- Fallback für generierte Konfigurationsmetadaten gebündelter Kanäle, während Registry-First-
  `channelConfigs`-Metadaten eingeführt werden
- persistierte Umgebungsflags zum Deaktivieren des Plugin-Registers und für Installationsmigrationen, während
  Reparaturabläufe Betreiber zu `openclaw plugins registry --refresh`
  und `openclaw doctor --fix` migrieren
- ältere Plugin-eigene Konfigurationspfade für Websuche, Webabruf und x_search,
  während Doctor sie zu `plugins.entries.<plugin>.config` migriert
- ältere erstellte `plugins.installs`-Konfiguration und Aliasse für Ladepfade gebündelter Plugins,
  während Installationsmetadaten in das zustandsverwaltete Plugin-Installationsbuch verschoben werden

### Flache Aliasse für eingehende WhatsApp-Callbacks

WhatsApp-Laufzeit-Callbacks liefern `WebInboundMessage`: die kanonischen
verschachtelten Kontexte `event`, `payload`, `quote`, `group` und `platform` sowie
eingestellte flache Aliasse für die ausgelieferten Callback-Felder. Neuer Callback-Code
sollte die verschachtelten Kontexte lesen. Code, der saubere verschachtelte Callback-
Nachrichten erstellt, kann `WebInboundCallbackMessage` verwenden; Kompatibilitäts-Listener, die
weiterhin alte flache Test- oder Plugin-Nachrichten einspeisen, sollten
`LegacyFlatWebInboundMessage` oder `WebInboundMessageInput` verwenden.

Die flachen Aliasse bleiben bis zum **2026-08-30** verfügbar; dieses Fenster gilt
nur für den Zugriff über flache Aliasse, nicht für die verschachtelte Struktur, die den kanonischen
Laufzeitvertrag darstellt. Die TypeScript-Annotation `@deprecated` jedes flachen Alias
nennt seinen exakten verschachtelten Ersatz. Häufige Beispiele:

- `id`, `timestamp` und `isBatched` werden unter `event` verschoben.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  und `untrustedStructuredContext` werden unter `payload` verschoben.
- `to`, `chatId`, Absender-/Selbst-Felder, `sendComposing`, `reply(...)` und
  `sendMedia(...)` werden unter `platform` verschoben.
- `replyTo*`-Felder werden unter `quote` verschoben; Felder für Gruppenbetreff, -teilnehmer und -erwähnungen
  werden unter `group` verschoben.

`payload.untrustedStructuredContext` wird aus eingehenden Provider-
Nutzdaten extrahiert. Plugins sollten `label`, `source` und `type` prüfen, bevor
sie dessen `payload` als maßgeblich behandeln.

### Zulassungsfelder für eingehende WhatsApp-Nachrichten

Akzeptierte WhatsApp-Callback-Nachrichten enthalten `admission`, einen für die Öffentlichkeit sicheren
Umschlag für die Zugriffskontrollentscheidung, durch die die Nachricht zugelassen wurde. Neuer
Callback-Code sollte Zulassungsinformationen aus `msg.admission` lesen statt aus
den älteren übergeordneten Zulassungsfeldern.

Die übergeordneten Felder bleiben bis zum **2026-08-30** verfügbar. Die
TypeScript-Annotation `@deprecated` jedes Feldes nennt seinen Ersatz:

- `from` und `conversationId` werden zu `admission.conversation.id` verschoben.
- `accountId` wird zu `admission.accountId` verschoben.
- `accessControlPassed` ist eine abgeleitete Kompatibilitätsansicht von
  `admission.ingress.decision === "allow"`; bei Nachrichten, die bereits
  `admission` enthalten, schreibt das Setzen des älteren booleschen Werts den Eingangs-
  graphen nicht neu.
- `chatType` wird zu `admission.conversation.kind` verschoben.

## Plugin-Inspektorpaket

Der Plugin-Inspektor sollte außerhalb des zentralen OpenClaw-Repositorys als
separates Paket/Repository liegen, das auf den versionierten Kompatibilitäts- und
Manifest-Verträgen basiert. Die CLI sollte am ersten Tag wie folgt lauten:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte Manifest-/Schemavalidierung, die geprüfte Vertragskompatibilitäts-
version, Prüfungen von Installations-/Quellmetadaten, Kaltpfad-Import-
prüfungen und Einstellungs-/Kompatibilitätswarnungen ausgeben. Verwenden Sie `--json` für eine stabile,
maschinenlesbare Ausgabe in CI-Anmerkungen. Der OpenClaw-Kern sollte
Verträge und Fixtures bereitstellen, die der Inspektor verwenden kann, aber die
Inspektor-Binärdatei nicht über das Hauptpaket `openclaw` veröffentlichen.

### Akzeptanzprüflauf für Maintainer

Verwenden Sie die Crabbox-gestützte Blacksmith Testbox für den Akzeptanz-
prüflauf des installierbaren Pakets, wenn der externe Inspektor mit OpenClaw-Plugin-
Paketen validiert wird. Führen Sie ihn nach dem Erstellen des Pakets aus einem sauberen OpenClaw-Checkout aus:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Dieser Prüflauf sollte für Maintainer optional bleiben, da er ein externes npm-
Paket installiert und möglicherweise Plugin-Pakete untersucht, die außerhalb des Repositorys geklont wurden. Die lokalen
Repository-Schutzprüfungen decken die SDK-Exportzuordnung, Metadaten des Kompatibilitätsregisters,
den Abbau eingestellter SDK-Importe und Importgrenzen gebündelter Erweiterungen ab;
der Testbox-Nachweis für den Inspektor deckt das Paket so ab, wie externe Plugin-Autoren
es verwenden.

## Release-Hinweise

Release-Hinweise sollten bevorstehende Plugin-Einstellungen mit Zieldaten
und Links zur Migrationsdokumentation enthalten, bevor ein Kompatibilitätspfad zu
`removal-pending` oder `removed` wechselt.
