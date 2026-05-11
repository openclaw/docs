---
read_when:
    - Sie betreuen ein OpenClaw Plugin
    - Sie sehen eine Kompatibilitätswarnung für ein Plugin
    - Sie planen eine Plugin-SDK- oder Manifest-Migration
summary: Plugin-Kompatibilitätsverträge, Abkündigungsmetadaten und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-05-11T20:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter verdrahtet, bevor sie entfernt werden. Das schützt vorhandene gebündelte und externe Plugins, während sich die SDK-, Manifest-, Setup-, Konfigurations- und Agent-Runtime-Verträge weiterentwickeln.

## Kompatibilitäts-Registry

Plugin-Kompatibilitätsverträge werden in der Core-Registry unter
`src/plugins/compat/registry.ts` nachverfolgt.

Jeder Eintrag enthält:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Owner: SDK, Konfiguration, Setup, Kanal, Provider, Plugin-Ausführung, Agent-Runtime
  oder Core
- Einführungs- und Deprecation-Daten, sofern zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Die Registry ist die Quelle für die Maintainer-Planung und künftige Prüfungen
durch den Plugin-Inspector. Wenn sich ein Plugin-seitiges Verhalten ändert,
fügen Sie im selben Change, der den Adapter hinzufügt, den Kompatibilitätseintrag
hinzu oder aktualisieren Sie ihn.

Kompatibilität für Doctor-Reparaturen und Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge
decken alte Konfigurationsformen, Install-Ledger-Layouts und Reparatur-Shims ab,
die möglicherweise verfügbar bleiben müssen, nachdem der Runtime-Kompatibilitätspfad
entfernt wurde.

Release-Sweeps sollten beide Registries prüfen. Löschen Sie eine Doctor-Migration
nicht nur deshalb, weil der passende Runtime- oder Konfigurations-Kompatibilitätseintrag
abgelaufen ist; prüfen Sie zuerst, dass es keinen unterstützten Upgrade-Pfad gibt,
der die Reparatur noch benötigt. Validieren Sie außerdem jede Ersatz-Annotation
während der Release-Planung erneut, weil sich Plugin-Ownership und
Konfigurationsumfang ändern können, wenn Provider und Kanäle aus dem Core
ausgelagert werden.

## Plugin-Inspector-Paket

Der Plugin-Inspector sollte außerhalb des zentralen OpenClaw-Repos als separates
Paket/Repository liegen, gestützt auf die versionierten Kompatibilitäts- und
Manifest-Verträge.

Die Day-one-CLI sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte ausgeben:

- Manifest-/Schema-Validierung
- die geprüfte Vertragskompatibilitätsversion
- Prüfungen der Install-/Quellmetadaten
- Cold-Path-Importprüfungen
- Deprecation- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Annotationen.
OpenClaw Core sollte Verträge und Fixtures bereitstellen, die der Inspector
verwenden kann, sollte das Inspector-Binary aber nicht aus dem Hauptpaket
`openclaw` veröffentlichen.

### Maintainer-Akzeptanz-Lane

Verwenden Sie die Crabbox-gestützte Blacksmith Testbox für die Akzeptanz-Lane
installierbarer Pakete, wenn Sie den externen Inspector gegen OpenClaw-Plugin-Pakete
validieren. Führen Sie sie aus einem sauberen OpenClaw-Checkout aus, nachdem das
Paket gebaut wurde:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Halten Sie diese Lane für Maintainer opt-in, weil sie ein externes npm-Paket
installiert und möglicherweise Plugin-Pakete prüft, die außerhalb des Repos
geklont wurden. Die lokalen Repo-Guards decken die SDK-Export-Map,
Kompatibilitäts-Registry-Metadaten, den Abbau veralteter SDK-Imports und die
Import-Grenzen gebündelter Plugins ab; Testbox-Inspector-Proof deckt das Paket
so ab, wie externe Plugin-Autoren es konsumieren.

## Deprecation-Richtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht im selben Release
entfernen, das seinen Ersatz einführt.

Die Migrationssequenz ist:

1. Fügen Sie den neuen Vertrag hinzu.
2. Halten Sie das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet.
3. Geben Sie Diagnosen oder Warnungen aus, wenn Plugin-Autoren handeln können.
4. Dokumentieren Sie Ersatz und Zeitplan.
5. Testen Sie alte und neue Pfade.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie nur mit ausdrücklicher Breaking-Release-Genehmigung.

Veraltete Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen
Dokumentationslink und ein endgültiges Entfernungsdatum enthalten, das höchstens
drei Monate nach Beginn der Warnungen liegt. Fügen Sie keinen veralteten
Kompatibilitätspfad mit offenem Entfernungsfenster hinzu, es sei denn,
Maintainer entscheiden ausdrücklich, dass es sich um permanente Kompatibilität
handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- alte breite SDK-Imports wie `openclaw/plugin-sdk/compat`
- alte Hook-only-Plugin-Formen und `before_agent_start`
- alte `activate(api)`-Plugin-Einstiegspunkte, während Plugins zu
  `register(api)` migrieren
- alte SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  Status-Builder, `openclaw/plugin-sdk/test-utils` (ersetzt durch fokussierte
  `openclaw/plugin-sdk/*`-Test-Subpfade) sowie die Typaliase `ClawdbotConfig` /
  `OpenClawSchemaType`
- Allowlist- und Enablement-Verhalten gebündelter Plugins
- alte Provider-/Kanal-Env-Var-Manifest-Metadaten
- alte Provider-Plugin-Hooks und Typaliase, während Provider zu expliziten
  Katalog-, Auth-, Thinking-, Replay- und Transport-Hooks wechseln
- alte Runtime-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` und veraltete
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- alte Split-Registrierung von Memory-Plugins, während Memory-Plugins zu
  `registerMemoryCapability` wechseln
- alte Kanal-SDK-Helfer für native Nachrichtenschemas, Mention-Gating,
  Inbound-Envelope-Formatierung und Verschachtelung von Approval-Capabilities
- alte Kanal-Routenschlüssel- und Comparable-Target-Helferaliase, während
  Plugins zu `openclaw/plugin-sdk/channel-route` wechseln
- Aktivierungshinweise, die durch Ownership für Manifest-Contributions ersetzt werden
- `setup-api`-Runtime-Fallback, während Setup-Deskriptoren zu kalten
  `setup.requiresRuntime: false`-Metadaten wechseln
- Provider-`discovery`-Hooks, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanal-Metadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- alte Runtime-Policy-Konfigurationsschlüssel, während Doctor Operators zu
  `agentRuntime` migriert
- Fallback für generierte gebündelte Kanal-Konfigurationsmetadaten, während
  registry-first-`channelConfigs`-Metadaten landen
- persistierte Plugin-Registry-Deaktivierungs- und Install-Migration-Env-Flags,
  während Reparaturflows Operators zu `openclaw plugins registry --refresh` und
  `openclaw doctor --fix` migrieren
- alte Plugin-eigene Konfigurationspfade für Websuche, Webabruf und x_search,
  während Doctor sie zu `plugins.entries.<plugin>.config` migriert
- alte verfasste `plugins.installs`-Konfiguration und gebündelte
  Plugin-Load-Path-Aliasse, während Installationsmetadaten in das
  zustandsverwaltete Plugin-Ledger wechseln

Neuer Plugin-Code sollte den in der Registry und im jeweiligen Migrationsleitfaden
aufgeführten Ersatz bevorzugen. Vorhandene Plugins können einen Kompatibilitätspfad
weiterverwenden, bis Dokumentation, Diagnosen und Release Notes ein
Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten kommende Plugin-Deprecations mit Zieldaten und Links zu
Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein
Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
