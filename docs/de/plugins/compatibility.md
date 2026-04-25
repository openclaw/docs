---
read_when:
    - Sie warten ein OpenClaw-Plugin.
    - Sie sehen eine Plugin-Kompatibilitätswarnung.
    - Sie planen eine Migration des Plugin-SDK oder Manifests.
summary: Plugin-Kompatibilitätsverträge, Metadaten zu Veraltungen und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-04-25T13:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitätsadapter verdrahtet,
bevor sie entfernt werden. Das schützt bestehende gebündelte und externe
Plugins, während sich die Verträge für SDK, Manifest, Setup, Konfiguration und
Agent-Laufzeit weiterentwickeln.

## Kompatibilitätsregister

Plugin-Kompatibilitätsverträge werden im Core-Register unter
`src/plugins/compat/registry.ts` nachverfolgt.

Jeder Eintrag hat:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Owner: SDK, Konfiguration, Setup, Kanal, Provider, Plugin-Ausführung, Agent-Laufzeit
  oder Core
- Einführungs- und Veraltungsdaten, sofern zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnostik und Tests, die altes und neues Verhalten abdecken

Das Register ist die Quelle für die Planung durch Maintainer und für zukünftige
Prüfungen durch den Plugin Inspector. Wenn sich ein pluginseitiges Verhalten ändert,
fügen Sie in derselben Änderung, die den Adapter hinzufügt, auch den Kompatibilitätseintrag hinzu oder aktualisieren ihn.

## Paket Plugin Inspector

Der Plugin Inspector sollte außerhalb des Core-OpenClaw-Repos als separates
Paket/Repository leben, das auf versionierten Kompatibilitäts- und Manifest-
Verträgen basiert.

Die CLI für den ersten Tag sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Es sollte Folgendes ausgeben:

- Validierung von Manifest/Schemata
- die geprüfte Kompatibilitätsversion des Vertrags
- Prüfungen von Installations-/Quellmetadaten
- Prüfungen von Cold-Path-Imports
- Warnungen zu Veraltungen und Kompatibilität

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Anmerkungen. Der OpenClaw-
Core sollte Verträge und Fixtures bereitstellen, die der Inspector verwenden kann, aber das Inspector-Binary
nicht aus dem Hauptpaket `openclaw` veröffentlichen.

## Richtlinie für Veraltungen

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht in derselben Release
entfernen, in der sein Ersatz eingeführt wird.

Die Migrationsreihenfolge ist:

1. Den neuen Vertrag hinzufügen.
2. Das alte Verhalten über einen benannten Kompatibilitätsadapter verdrahtet lassen.
3. Diagnostik oder Warnungen ausgeben, wenn Plugin-Autoren handeln können.
4. Den Ersatz und die Zeitleiste dokumentieren.
5. Sowohl den alten als auch den neuen Pfad testen.
6. Das angekündigte Migrationsfenster abwarten.
7. Nur mit expliziter Genehmigung für eine Breaking-Release entfernen.

Veraltete Einträge müssen ein Startdatum für Warnungen, den Ersatz, einen Link zur Dokumentation
und ein Zieldatum für die Entfernung enthalten, sofern bekannt.

## Aktuelle Kompatibilitätsbereiche

Zu den aktuellen Kompatibilitätseinträgen gehören:

- veraltete breite SDK-Importe wie `openclaw/plugin-sdk/compat`
- veraltete reine Hook-Plugin-Formen und `before_agent_start`
- Verhalten der Allowlist und Aktivierung gebündelter Plugins
- veraltete Env-Var-Manifestmetadaten für Provider/Kanäle
- Aktivierungshinweise, die durch Eigentümerschaft von Manifest-Beiträgen ersetzt werden
- Benennungsaliase `embeddedHarness` und `agent-harness`, während sich die öffentliche Benennung in Richtung
  `agentRuntime` bewegt
- Fallback für generierte gebündelte Kanal-Konfigurationsmetadaten, während
  registry-first-Metadaten `channelConfigs` eingeführt werden

Neuer Plugin-Code sollte den im Register und im
jeweiligen Migrationsleitfaden aufgeführten Ersatz bevorzugen. Bestehende Plugins können einen Kompatibilitätspfad weiter verwenden,
bis Dokumentation, Diagnostik und Release Notes ein Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten kommende Plugin-Veraltungen mit Zieldaten und
Links zur Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein
Kompatibilitätspfad auf `removal-pending` oder `removed` wechselt.
