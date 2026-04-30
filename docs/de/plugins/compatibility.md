---
read_when:
    - Sie pflegen ein OpenClaw-Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Plugin-SDK- oder Manifest-Migration
summary: Plugin-Kompatibilitätsverträge, Metadaten zur Veraltung und Erwartungen an die Migration
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-04-30T07:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter verdrahtet, bevor sie entfernt werden. Dadurch werden vorhandene gebündelte und externe Plugins geschützt, während sich die Verträge für SDK, Manifest, Einrichtung, Konfiguration und Agent-Laufzeit weiterentwickeln.

## Kompatibilitätsregistry

Plugin-Kompatibilitätsverträge werden in der Core-Registry unter
`src/plugins/compat/registry.ts` verfolgt.

Jeder Eintrag enthält:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Verantwortungsbereich: SDK, Konfiguration, Einrichtung, Kanal, Provider, Plugin-Ausführung, Agent-Laufzeit
  oder Core
- Einführungs- und Veraltungsdaten, sofern zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Die Registry ist die Quelle für Maintainer-Planung und zukünftige Plugin-Inspector-Prüfungen. Wenn sich ein für Plugins sichtbares Verhalten ändert, fügen Sie den Kompatibilitätseintrag in derselben Änderung hinzu oder aktualisieren Sie ihn, die den Adapter hinzufügt.

Kompatibilität für Doctor-Reparaturen und Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` verfolgt. Diese Einträge decken alte Konfigurationsformen, Install-Ledger-Layouts und Reparatur-Shims ab, die möglicherweise verfügbar bleiben müssen, nachdem der Laufzeit-Kompatibilitätspfad entfernt wurde.

Release-Prüfungen sollten beide Registries prüfen. Löschen Sie eine Doctor-Migration nicht nur deshalb, weil der passende Laufzeit- oder Konfigurations-Kompatibilitätseintrag abgelaufen ist; verifizieren Sie zuerst, dass es keinen unterstützten Upgrade-Pfad gibt, der die Reparatur noch benötigt. Validieren Sie außerdem jede Ersatzanmerkung während der Release-Planung erneut, da sich Plugin-Zuständigkeit und Konfigurationsumfang ändern können, wenn Provider und Kanäle aus dem Core verschoben werden.

## Plugin-Inspector-Paket

Der Plugin Inspector sollte außerhalb des zentralen OpenClaw-Repos als separates Paket/Repository leben, gestützt auf die versionierten Kompatibilitäts- und Manifestverträge.

Die CLI für den ersten Tag sollte lauten:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte Folgendes ausgeben:

- Manifest-/Schemavalidierung
- die geprüfte Vertragskompatibilitätsversion
- Prüfungen von Installations-/Quellmetadaten
- Importprüfungen für kalte Pfade
- Veraltungs- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgaben in CI-Anmerkungen. OpenClaw Core sollte Verträge und Fixtures bereitstellen, die der Inspector verwenden kann, sollte das Inspector-Binary aber nicht aus dem Hauptpaket `openclaw` veröffentlichen.

### Maintainer-Akzeptanzlane

Verwenden Sie Blacksmith Testbox für die Akzeptanzlane für installierbare Pakete, wenn Sie den externen Inspector gegen OpenClaw-Plugin-Pakete validieren. Führen Sie sie aus einem sauberen OpenClaw-Checkout aus, nachdem das Paket gebaut wurde:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Halten Sie diese Lane für Maintainer optional, da sie ein externes npm-Paket installiert und möglicherweise Plugin-Pakete inspiziert, die außerhalb des Repos geklont wurden. Die lokalen Repo-Guards decken die SDK-Export-Map, Metadaten der Kompatibilitätsregistry, den Abbau veralteter SDK-Importe und Importgrenzen gebündelter Plugins ab; der Testbox-Inspector-Nachweis deckt das Paket so ab, wie externe Plugin-Autoren es verwenden.

## Veraltungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht im selben Release entfernen, in dem sein Ersatz eingeführt wird.

Die Migrationssequenz lautet:

1. Fügen Sie den neuen Vertrag hinzu.
2. Halten Sie das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet.
3. Geben Sie Diagnosen oder Warnungen aus, wenn Plugin-Autoren handeln können.
4. Dokumentieren Sie den Ersatz und den Zeitplan.
5. Testen Sie alte und neue Pfade.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie nur mit ausdrücklicher Genehmigung für ein Breaking Release.

Veraltete Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen Dokumentationslink und ein endgültiges Entfernungsdatum enthalten, das höchstens drei Monate nach Beginn der Warnungen liegt. Fügen Sie keinen veralteten Kompatibilitätspfad mit offenem Entfernungsfenster hinzu, es sei denn, Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte Kompatibilität handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- alte breite SDK-Importe wie `openclaw/plugin-sdk/compat`
- alte rein Hook-basierte Plugin-Formen und `before_agent_start`
- alte `activate(api)`-Plugin-Einstiegspunkte, während Plugins zu
  `register(api)` migrieren
- alte SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  Status-Builder, `openclaw/plugin-sdk/test-utils` (ersetzt durch fokussierte
  `openclaw/plugin-sdk/*`-Test-Unterpfade) und die Typaliase `ClawdbotConfig` /
  `OpenClawSchemaType`
- Allowlist- und Aktivierungsverhalten für gebündelte Plugins
- alte Provider-/Kanal-Env-Var-Manifestmetadaten
- alte Provider-Plugin-Hooks und Typaliase, während Provider zu
  expliziten Katalog-, Auth-, Thinking-, Replay- und Transport-Hooks wechseln
- alte Laufzeit-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` und veraltete
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- alte aufgeteilte Registrierung für Memory-Plugins, während Memory-Plugins zu
  `registerMemoryCapability` wechseln
- alte Kanal-SDK-Helfer für native Nachrichtenschemata, Mention-Gating,
  Formatierung eingehender Envelopes und Verschachtelung von Genehmigungsfähigkeiten
- alter Kanalroutenschlüssel und vergleichbare Target-Helferaliase, während Plugins zu
  `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch Zuständigkeit für Manifestbeiträge ersetzt werden
- veraltetes implizites Laden von Startup-Sidecars für Plugins, die
  `activation.onStartup` nicht deklariert haben; Maintainer können das künftig strengere Verhalten mit
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` testen
- `setup-api`-Laufzeit-Fallback, während Setup-Deskriptoren zu kalten
  `setup.requiresRuntime: false`-Metadaten wechseln
- Provider-`discovery`-Hooks, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanalmetadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- alte Runtime-Policy-Konfigurationsschlüssel, während Doctor Betreiber zu
  `agentRuntime` migriert
- Fallback für generierte gebündelte Kanal-Konfigurationsmetadaten, während Registry-first-
  `channelConfigs`-Metadaten landen
- persistierte Plugin-Registry-Deaktivierung und Env-Flags für Installationsmigration, während
  Reparaturabläufe Betreiber zu `openclaw plugins registry --refresh` und
  `openclaw doctor --fix` migrieren
- alte Konfigurationspfade für Plugin-eigene Websuche, Webabruf und x_search, während
  Doctor sie zu `plugins.entries.<plugin>.config` migriert
- alte vom Benutzer verfasste `plugins.installs`-Konfiguration und Ladepfad-Aliasse für gebündelte Plugins, während Installationsmetadaten in das zustandsverwaltete Plugin-Ledger verschoben werden

Neuer Plugin-Code sollte den in der Registry und im jeweiligen Migrationsleitfaden aufgeführten Ersatz bevorzugen. Vorhandene Plugins können einen Kompatibilitätspfad weiter verwenden, bis Dokumentation, Diagnosen und Release Notes ein Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten kommende Plugin-Veraltungen mit Zieldaten und Links zu Migrationsdokumenten enthalten. Diese Warnung muss erfolgen, bevor ein Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
