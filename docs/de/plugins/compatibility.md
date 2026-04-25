---
read_when:
    - Sie pflegen ein OpenClaw Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Migration des Plugin SDK oder des Manifests
summary: Plugin-Kompatibilitätsverträge, Deprecation-Metadaten und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-04-25T18:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter verdrahtet, bevor sie entfernt werden. Das schützt bestehende gebündelte und externe Plugins, während sich die Verträge für SDK, Manifest, Einrichtung, Konfiguration und Agent-Laufzeit weiterentwickeln.

## Kompatibilitätsregister

Plugin-Kompatibilitätsverträge werden im Core-Register unter
`src/plugins/compat/registry.ts` nachverfolgt.

Jeder Eintrag hat:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Owner: SDK, config, setup, channel, provider, plugin execution, agent runtime
  oder core
- Einführungs- und Deprecation-Daten, sofern zutreffend
- Hinweise zur Ersetzung
- Dokumentation, Diagnosen und Tests, die das alte und neue Verhalten abdecken

Das Register ist die Quelle für die Planung durch Maintainer und für zukünftige Prüfungen des Plugin-Inspectors. Wenn sich ein Plugin-seitiges Verhalten ändert, fügen Sie im selben Change, der den Adapter hinzufügt, auch den Kompatibilitätseintrag hinzu oder aktualisieren Sie ihn.

## Paket für den Plugin-Inspector

Der Plugin-Inspector sollte außerhalb des Core-OpenClaw-Repos als separates
Paket/Repository leben, gestützt auf die versionierten Kompatibilitäts- und Manifest-Verträge.

Die CLI für den ersten Tag sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte Folgendes ausgeben:

- Manifest-/Schema-Validierung
- die geprüfte Version des Vertrags zur Kompatibilität
- Prüfungen von Installations-/Quellmetadaten
- Cold-Path-Import-Prüfungen
- Deprecation- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Anmerkungen. Der OpenClaw-Core sollte Verträge und Fixtures bereitstellen, die der Inspector verwenden kann, aber das Inspector-Binary nicht aus dem Hauptpaket `openclaw` veröffentlichen.

## Deprecation-Richtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht in derselben Release entfernen, in der seine Ersetzung eingeführt wird.

Die Migrationsabfolge ist:

1. Fügen Sie den neuen Vertrag hinzu.
2. Behalten Sie das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet bei.
3. Geben Sie Diagnosen oder Warnungen aus, wenn Plugin-Autoren handeln können.
4. Dokumentieren Sie die Ersetzung und den Zeitplan.
5. Testen Sie sowohl den alten als auch den neuen Pfad.
6. Warten Sie das angekündigte Migrationsfenster ab.
7. Entfernen Sie nur mit expliziter Genehmigung für eine Breaking-Release.

Veraltete Einträge müssen ein Startdatum für Warnungen, eine Ersetzung, einen Link zur Dokumentation und ein Zieldatum für die Entfernung enthalten, sofern bekannt.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- alte breit gefasste SDK-Importe wie `openclaw/plugin-sdk/compat`
- alte Plugin-Formen nur mit Hooks und `before_agent_start`
- Verhalten für Allowlist und Aktivierung gebündelter Plugins
- alte Env-Var-Manifest-Metadaten für Provider/Kanal
- Aktivierungshinweise, die durch Ownership von Manifest-Beiträgen ersetzt werden
- Namensaliase `embeddedHarness` und `agent-harness`, während sich die öffentliche Benennung in Richtung `agentRuntime` bewegt
- Fallback für generierte Metadaten gebündelter Kanalkonfigurationen, während registry-first-`channelConfigs`-Metadaten eingeführt werden
- das persistierte Env zum Deaktivieren des Plugin-Registers, während Reparaturabläufe Operatoren zu `openclaw plugins registry --refresh` und `openclaw doctor --fix` migrieren

Neuer Plugin-Code sollte die im Register und im spezifischen Migrationsleitfaden aufgeführte Ersetzung bevorzugen. Bestehende Plugins können weiterhin einen Kompatibilitätspfad verwenden, bis die Dokumentation, Diagnosen und Release Notes ein Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten bevorstehende Plugin-Deprecations mit Zieldaten und Links zur Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
