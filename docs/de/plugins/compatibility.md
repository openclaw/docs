---
read_when:
    - Sie pflegen ein OpenClaw-Plugin
    - Sie sehen eine Warnung zur Plugin-Kompatibilität
    - Sie planen eine Plugin-SDK- oder Manifest-Migration
summary: Plugin-Kompatibilitätsverträge, Deprecation-Metadaten und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-05-02T06:39:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter verdrahtet, bevor sie entfernt werden. Dies schützt bestehende gebündelte und externe Plugins, während sich die SDK-, Manifest-, Setup-, Konfigurations- und Agent-Laufzeitverträge weiterentwickeln.

## Kompatibilitätsregistrierung

Plugin-Kompatibilitätsverträge werden in der Core-Registry unter
`src/plugins/compat/registry.ts` nachverfolgt.

Jeder Eintrag enthält:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Eigentümer: SDK, Konfiguration, Setup, Kanal, Provider, Plugin-Ausführung, Agent-Laufzeit
  oder Core
- Einführungs- und Veraltungsdaten, falls zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Die Registry ist die Quelle für die Planung durch Maintainer und künftige Prüfungen des Plugin Inspectors. Wenn sich ein Plugin-seitiges Verhalten ändert, fügen Sie den Kompatibilitätseintrag in derselben Änderung hinzu oder aktualisieren Sie ihn, die den Adapter hinzufügt.

Kompatibilität für Doctor-Reparaturen und Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge decken alte Konfigurationsformen, Installations-Ledger-Layouts und Reparatur-Shims ab, die möglicherweise weiterhin verfügbar bleiben müssen, nachdem der Laufzeit-Kompatibilitätspfad entfernt wurde.

Release-Sweeps sollten beide Registries prüfen. Löschen Sie eine Doctor-Migration nicht nur, weil der passende Laufzeit- oder Konfigurationskompatibilitätseintrag abgelaufen ist; prüfen Sie zuerst, ob es keinen unterstützten Upgrade-Pfad gibt, der die Reparatur noch benötigt. Validieren Sie außerdem jede Ersatzannotation während der Release-Planung erneut, da sich Plugin-Eigentümerschaft und Konfigurationsumfang ändern können, wenn Provider und Kanäle aus dem Core heraus verschoben werden.

## Plugin-Inspector-Paket

Der Plugin Inspector sollte außerhalb des Core-OpenClaw-Repos als separates Paket/Repository leben, das auf den versionierten Kompatibilitäts- und Manifestverträgen basiert.

Die CLI am ersten Tag sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte Folgendes ausgeben:

- Manifest-/Schemavalidierung
- die geprüfte Vertragskompatibilitätsversion
- Prüfungen von Installations-/Quellmetadaten
- Importprüfungen für kalte Pfade
- Veraltungs- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Annotationen. OpenClaw Core sollte Verträge und Fixtures bereitstellen, die der Inspector konsumieren kann, sollte das Inspector-Binary aber nicht aus dem Hauptpaket `openclaw` veröffentlichen.

### Abnahmelauf für Maintainer

Verwenden Sie Blacksmith Testbox für den Abnahmelauf installierbarer Pakete, wenn Sie den externen Inspector gegen OpenClaw-Plugin-Pakete validieren. Führen Sie ihn aus einem sauberen OpenClaw-Checkout aus, nachdem das Paket gebaut wurde:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Halten Sie diesen Lauf für Maintainer opt-in, weil er ein externes npm-Paket installiert und möglicherweise Plugin-Pakete prüft, die außerhalb des Repos geklont wurden. Die lokalen Repo-Guards decken die SDK-Export-Map, Metadaten der Kompatibilitätsregistrierung, den Abbau veralteter SDK-Imports und Importgrenzen gebündelter Plugins ab; Testbox-Inspector-Nachweise decken das Paket so ab, wie externe Plugin-Autoren es konsumieren.

## Veraltungsrichtlinie

OpenClaw sollte keinen dokumentierten Plugin-Vertrag in demselben Release entfernen, das seinen Ersatz einführt.

Die Migrationssequenz ist:

1. Fügen Sie den neuen Vertrag hinzu.
2. Halten Sie das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet.
3. Geben Sie Diagnosen oder Warnungen aus, wenn Plugin-Autoren handeln können.
4. Dokumentieren Sie den Ersatz und den Zeitplan.
5. Testen Sie sowohl alte als auch neue Pfade.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie nur mit expliziter Genehmigung für ein Breaking Release.

Veraltete Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen Dokumentationslink und ein endgültiges Entfernungsdatum enthalten, das höchstens drei Monate nach Beginn der Warnungen liegt. Fügen Sie keinen veralteten Kompatibilitätspfad mit offenem Entfernungsfenster hinzu, es sei denn, die Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte Kompatibilität handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- alte breite SDK-Imports wie `openclaw/plugin-sdk/compat`
- alte reine Hook-Plugin-Formen und `before_agent_start`
- alte `activate(api)`-Plugin-Einstiegspunkte, während Plugins zu
  `register(api)` migrieren
- alte SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  Status-Builder, `openclaw/plugin-sdk/test-utils` (ersetzt durch fokussierte
  Test-Unterpfade unter `openclaw/plugin-sdk/*`) und die Typaliase `ClawdbotConfig` /
  `OpenClawSchemaType`
- Allowlist- und Aktivierungsverhalten für gebündelte Plugins
- alte Provider-/Kanal-Manifestmetadaten für Umgebungsvariablen
- alte Provider-Plugin-Hooks und Typaliase, während Provider zu
  expliziten Katalog-, Authentifizierungs-, Thinking-, Replay- und Transport-Hooks wechseln
- alte Laufzeit-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` und veraltete
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- alte geteilte Registrierung für Memory-Plugins, während Memory-Plugins zu
  `registerMemoryCapability` wechseln
- alte Kanal-SDK-Helfer für native Nachrichtenschemas, Erwähnungs-Gating,
  Formatierung eingehender Envelopes und Verschachtelung von Freigabefähigkeiten
- alte Kanal-Routenschlüssel und Helfer-Aliasse für vergleichbare Ziele, während Plugins
  zu `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch Manifest-Beitragseigentümerschaft ersetzt werden
- `setup-api`-Laufzeit-Fallback, während Setup-Deskriptoren zu kalten
  `setup.requiresRuntime: false`-Metadaten wechseln
- Provider-`discovery`-Hooks, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanalmetadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- alte Laufzeitrichtlinien-Konfigurationsschlüssel, während Doctor Operatoren zu
  `agentRuntime` migriert
- Fallback für generierte gebündelte Kanal-Konfigurationsmetadaten, während registry-first
  `channelConfigs`-Metadaten eingeführt werden
- persistierte Umgebungsflags zum Deaktivieren der Plugin-Registry und zur Installationsmigration, während
  Reparaturabläufe Operatoren zu `openclaw plugins registry --refresh` und
  `openclaw doctor --fix` migrieren
- alte Plugin-eigene Konfigurationspfade für Websuche, Webabruf und x_search, während
  Doctor sie zu `plugins.entries.<plugin>.config` migriert
- alte autorisierte `plugins.installs`-Konfiguration und Aliasse für Ladepfade gebündelter Plugins,
  während Installationsmetadaten in das zustandsverwaltete Plugin-Ledger wechseln

Neuer Plugin-Code sollte den Ersatz bevorzugen, der in der Registry und im jeweiligen Migrationsleitfaden aufgeführt ist. Bestehende Plugins können einen Kompatibilitätspfad weiterverwenden, bis Dokumentation, Diagnosen und Release Notes ein Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten kommende Plugin-Veraltungen mit Zieldaten und Links zu Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
