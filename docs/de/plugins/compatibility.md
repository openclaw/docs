---
read_when:
    - Sie pflegen ein OpenClaw Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Migration des Plugin-SDK oder Manifests
summary: Plugin-Kompatibilitätsverträge, Deprecation-Metadaten und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-06-27T17:47:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter
verdrahtet, bevor sie entfernt werden. Das schützt bestehende gebündelte und
externe Plugins, während sich die Verträge für SDK, Manifest, Setup, Konfiguration
und Agent-Laufzeit weiterentwickeln.

## Kompatibilitäts-Registry

Plugin-Kompatibilitätsverträge werden in der Core-Registry unter
`src/plugins/compat/registry.ts` nachverfolgt.

Jeder Eintrag hat:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Eigentümer: SDK, Konfiguration, Setup, Kanal, Provider, Plugin-Ausführung,
  Agent-Laufzeit oder Core
- Einführungs- und Veraltungsdaten, falls zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Die Registry ist die Quelle für die Planung durch Maintainer und zukünftige
Plugin-Inspector-Prüfungen. Wenn sich ein Plugin-seitiges Verhalten ändert,
fügen Sie den Kompatibilitätseintrag in derselben Änderung hinzu oder
aktualisieren Sie ihn, mit der auch der Adapter hinzugefügt wird.

Kompatibilität für Doctor-Reparaturen und Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge
decken alte Konfigurationsformen, Installations-Ledger-Layouts und
Reparatur-Shims ab, die möglicherweise verfügbar bleiben müssen, nachdem der
Laufzeit-Kompatibilitätspfad entfernt wurde.

Release-Sweeps sollten beide Registries prüfen. Löschen Sie eine
Doctor-Migration nicht nur deshalb, weil der passende Laufzeit- oder
Konfigurations-Kompatibilitätseintrag abgelaufen ist; verifizieren Sie zuerst,
dass es keinen unterstützten Upgrade-Pfad gibt, der die Reparatur noch benötigt.
Validieren Sie außerdem jede Ersatzannotation während der Release-Planung erneut,
weil sich Plugin-Eigentümerschaft und Konfigurationsumfang ändern können, wenn
Provider und Kanäle aus dem Core verschoben werden.

## Plugin-Inspector-Paket

Der Plugin-Inspector sollte außerhalb des Core-OpenClaw-Repos als separates
Paket/Repository leben, gestützt auf die versionierten Kompatibilitäts- und
Manifestverträge.

Die CLI am ersten Tag sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte ausgeben:

- Manifest-/Schema-Validierung
- die geprüfte Vertragskompatibilitätsversion
- Prüfungen der Installations-/Quellmetadaten
- Cold-Path-Importprüfungen
- Veraltungs- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Annotationen.
OpenClaw Core sollte Verträge und Fixtures bereitstellen, die der Inspector
nutzen kann, aber das Inspector-Binary nicht aus dem Hauptpaket `openclaw`
veröffentlichen.

### Maintainer-Akzeptanz-Lane

Verwenden Sie Crabbox-gestützte Blacksmith Testbox für die Akzeptanz-Lane für
installierbare Pakete, wenn Sie den externen Inspector gegen OpenClaw
Plugin-Pakete validieren. Führen Sie sie aus einem sauberen OpenClaw-Checkout
aus, nachdem das Paket gebaut wurde:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Halten Sie diese Lane für Maintainer opt-in, weil sie ein externes npm-Paket
installiert und Plugin-Pakete prüfen kann, die außerhalb des Repos geklont
wurden. Die lokalen Repo-Guards decken die SDK-Export-Map,
Kompatibilitäts-Registry-Metadaten, den Abbau veralteter SDK-Importe und die
Importgrenzen gebündelter Erweiterungen ab; der Testbox-Inspector-Nachweis deckt
das Paket so ab, wie externe Plugin-Autoren es nutzen.

## Veraltungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht in demselben Release
entfernen, in dem sein Ersatz eingeführt wird.

Die Migrationssequenz lautet:

1. Fügen Sie den neuen Vertrag hinzu.
2. Halten Sie das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet.
3. Geben Sie Diagnosen oder Warnungen aus, wenn Plugin-Autoren handeln können.
4. Dokumentieren Sie Ersatz und Zeitplan.
5. Testen Sie alte und neue Pfade.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie nur mit ausdrücklicher Genehmigung für ein Breaking-Release.

Veraltete Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen
Dokumentationslink und ein endgültiges Entfernungsdatum enthalten, das höchstens
drei Monate nach Beginn der Warnungen liegt. Fügen Sie keinen veralteten
Kompatibilitätspfad mit offenem Entfernungsfenster hinzu, es sei denn,
Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte Kompatibilität
handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- ältere breite SDK-Importe wie `openclaw/plugin-sdk/compat`
- ältere reine Hook-Plugin-Formen und `before_agent_start`
- ältere `api.on("deactivate", ...)`-Namen für Cleanup-Hooks, während Plugins zu
  `gateway_stop` migrieren
- ältere `activate(api)`-Plugin-Einstiegspunkte, während Plugins zu
  `register(api)` migrieren
- ältere SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  Status-Builder, `openclaw/plugin-sdk/test-utils` (ersetzt durch fokussierte
  `openclaw/plugin-sdk/*`-Test-Unterpfade) und die Typaliasse `ClawdbotConfig` /
  `OpenClawSchemaType`
- Zulassungslisten- und Aktivierungsverhalten für gebündelte Plugins
- ältere Provider-/Kanal-Env-Var-Manifestmetadaten
- ältere Provider-Plugin-Hooks und Typaliasse, während Provider zu expliziten
  Katalog-, Auth-, Thinking-, Replay- und Transport-Hooks wechseln
- ältere Laufzeit-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` und veraltete
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- flache WhatsApp-`WebInboundMessage`-Callback-Felder wie `body`, `chatId`,
  `reply(...)` und `mediaPath`, während Callback-Nutzer zu den verschachtelten
  Kontexten `event`, `payload`, `quote`, `group` und `platform` von
  `WebInboundCallbackMessage` migrieren
- WhatsApp-`WebInboundMessage`-Admission-Felder auf oberster Ebene wie `from`,
  `conversationId`, `accountId`, `accessControlPassed` und `chatType`, während
  Callback-Nutzer zum `admission`-Envelope migrieren
- ältere Split-Registrierung für Memory-Plugins, während Memory-Plugins zu
  `registerMemoryCapability` wechseln
- ältere Memory-spezifische Registrierung von Embedding-Providern, während
  Embedding-Provider zu `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` wechseln
- ältere Kanal-SDK-Helfer für native Nachrichtenschemas, Mention-Gating,
  Formatierung eingehender Envelopes und Verschachtelung von Approval-Capabilitys
- ältere Kanal-Routenschlüssel und vergleichbare Target-Helferaliasse, während
  Plugins zu `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch Eigentümerschaft von Manifest-Contributions
  ersetzt werden
- `setup-api`-Laufzeit-Fallback, während Setup-Deskriptoren zu kalten
  `setup.requiresRuntime: false`-Metadaten wechseln
- Provider-`discovery`-Hooks, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanal-Metadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- ältere runtime-policy-Konfigurationsschlüssel, während Doctor Operatoren zu
  `agentRuntime` migriert
- Fallback für generierte gebündelte Kanal-Konfigurationsmetadaten, während
  Registry-first-`channelConfigs`-Metadaten landen
- persistierte Env-Flags für Deaktivierung der Plugin-Registry und
  Installationsmigration, während Reparaturabläufe Operatoren zu
  `openclaw plugins registry --refresh` und `openclaw doctor --fix` migrieren
- ältere Plugin-eigene Konfigurationspfade für Websuche, Webabruf und x_search,
  während Doctor sie zu `plugins.entries.<plugin>.config` migriert
- ältere verfasste `plugins.installs`-Konfiguration und Ladepfad-Aliasse für
  gebündelte Plugins, während Installationsmetadaten in das zustandsverwaltete
  Plugin-Ledger verschoben werden

Neuer Plugin-Code sollte den in der Registry und im jeweiligen Migrationsleitfaden
aufgeführten Ersatz bevorzugen. Bestehende Plugins können einen
Kompatibilitätspfad weiter nutzen, bis Dokumentation, Diagnosen und Release Notes
ein Entfernungsfenster ankündigen.

### Flache Aliasse für eingehende WhatsApp-Callbacks

WhatsApp-Laufzeit-Callbacks liefern `WebInboundMessage`: die kanonischen
verschachtelten Kontexte `event`, `payload`, `quote`, `group` und `platform`
plus veraltete flache Aliasse für die ausgelieferten Callback-Felder. Neuer
Callback-Code sollte die verschachtelten Kontexte lesen. Code, der saubere
verschachtelte Callback-Nachrichten konstruiert, kann
`WebInboundCallbackMessage` verwenden; Kompatibilitäts-Listener, die noch alte
flache Test- oder Plugin-Nachrichten injizieren, sollten
`LegacyFlatWebInboundMessage` oder `WebInboundMessageInput` verwenden.

Die flachen Aliasse bleiben bis **2026-08-30** verfügbar. Dieses
Entfernungsfenster gilt nur für den Zugriff über flache Aliasse; die
verschachtelte Callback-Form ist der kanonische Laufzeitvertrag. Die TypeScript-
`@deprecated`-Annotationen für jeden flachen Alias nennen seinen exakten
verschachtelten Ersatz. Häufige Beispiele:

- `id`, `timestamp` und `isBatched` wandern unter `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` und
  `untrustedStructuredContext` wandern unter `payload`.
- `to`, `chatId`, Sender-/Self-Felder, `sendComposing`, `reply(...)` und
  `sendMedia(...)` wandern unter `platform`.
- `replyTo*`-Felder wandern unter `quote`, und Felder für Gruppensubjekt,
  Teilnehmer und Mentions wandern unter `group`.

`payload.untrustedStructuredContext` wird aus eingehenden Provider-Payloads
extrahiert. Plugins sollten `label`, `source` und `type` prüfen, bevor sie
dessen `payload` als autoritativ behandeln.

### WhatsApp-Eingangs-Admission-Felder

Akzeptierte WhatsApp-Callback-Nachrichten tragen jetzt `admission`, ein öffentlich
sicheres Envelope für die Access-Control-Entscheidung, die die Nachricht
zugelassen hat. Neuer Callback-Code sollte Admission-Fakten aus `msg.admission`
lesen statt aus den älteren Admission-Feldern auf oberster Ebene.

Die Felder auf oberster Ebene bleiben bis **2026-08-30** verfügbar. Die
TypeScript-`@deprecated`-Annotationen nennen jeden Ersatz:

- `from` und `conversationId` wandern zu `admission.conversation.id`.
- `accountId` wandert zu `admission.accountId`.
- `accessControlPassed` ist eine abgeleitete Kompatibilitätsansicht von
  `admission.ingress.decision === "allow"`; bei Nachrichten, die bereits
  `admission` tragen, schreibt das Schreiben des älteren booleschen Werts den
  Ingress-Graphen nicht um.
- `chatType` wandert zu `admission.conversation.kind`.

## Release Notes

Release Notes sollten kommende Plugin-Veraltungen mit Zieldaten und Links zu
Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein
Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
