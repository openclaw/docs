---
read_when:
    - Sie warten ein OpenClaw-Plugin.
    - Sie sehen eine Plugin-Kompatibilitätswarnung.
    - Sie planen eine Migration des Plugin-SDK oder des Manifests.
summary: Kompatibilitätsverträge für Plugins, Metadaten zur Abkündigung und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-04-26T11:34:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw hält ältere Plugin-Verträge über benannte Kompatibilitäts-
Adapter angeschlossen, bevor sie entfernt werden. Dadurch werden bestehende
gebündelte und externe Plugins geschützt, während sich die Verträge für SDK,
Manifest, Setup, Konfiguration und Agent-Laufzeit weiterentwickeln.

## Kompatibilitäts-Registry

Plugin-Kompatibilitätsverträge werden in der Core-Registry unter
`src/plugins/compat/registry.ts` erfasst.

Jeder Eintrag hat:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Eigentümer: SDK, Konfiguration, Setup, Kanal, Provider, Plugin-Ausführung, Agent-Laufzeit
  oder Core
- Einführungs- und Abkündigungsdaten, falls zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosen und Tests, die das alte und das neue Verhalten abdecken

Die Registry ist die Quelle für Maintainer-Planung und zukünftige Prüfungen im
Plugin-Inspektor. Wenn sich ein pluginseitiges Verhalten ändert, fügen Sie den
Kompatibilitätseintrag in derselben Änderung hinzu oder aktualisieren ihn, die den Adapter einführt.

Doctor-Reparatur- und Migrationskompatibilität wird getrennt unter
`src/commands/doctor/shared/deprecation-compat.ts` erfasst. Diese Einträge decken alte
Konfigurationsformen, Layouts des Installations-Ledgers und Reparatur-Shims ab, die
möglicherweise verfügbar bleiben müssen, nachdem der Laufzeit-Kompatibilitätspfad entfernt wurde.

Release-Durchläufe sollten beide Registries prüfen. Löschen Sie eine Doctor-Migration
nicht einfach deshalb, weil der passende Laufzeit- oder Konfigurations-Kompatibilitätseintrag abgelaufen ist; prüfen Sie zuerst, ob es noch einen unterstützten Upgrade-Pfad gibt, der die Reparatur benötigt. Validieren Sie außerdem jede Ersetzungsanmerkung während der Release-Planung erneut, da sich Plugin-Eigentümerschaft und Konfigurations-Footprint ändern können, wenn Provider und Kanäle aus dem Core verschoben werden.

## Paket für den Plugin-Inspektor

Der Plugin-Inspektor sollte außerhalb des Core-OpenClaw-Repos als separates
Paket/Repository leben, gestützt auf die versionierten Kompatibilitäts- und Manifest-
Verträge.

Die CLI für Tag eins sollte sein:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte Folgendes ausgeben:

- Manifest-/Schema-Validierung
- die geprüfte Version des Vertrags zur Kompatibilität
- Prüfungen von Installations-/Quellmetadaten
- Importprüfungen auf dem Kaltpfad
- Abkündigungs- und Kompatibilitätswarnungen

Verwenden Sie `--json` für stabile maschinenlesbare Ausgabe in CI-Anmerkungen. OpenClaw
Core sollte Verträge und Fixtures bereitstellen, die der Inspektor verwenden kann, aber
das Binärprogramm des Inspektors nicht aus dem Hauptpaket `openclaw` veröffentlichen.

## Abkündigungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht in derselben Version entfernen,
in der sein Ersatz eingeführt wird.

Die Migrationsreihenfolge ist:

1. Den neuen Vertrag hinzufügen.
2. Das alte Verhalten über einen benannten Kompatibilitätsadapter angeschlossen lassen.
3. Diagnosen oder Warnungen ausgeben, wenn Plugin-Autoren handeln können.
4. Den Ersatz und die Zeitachse dokumentieren.
5. Sowohl den alten als auch den neuen Pfad testen.
6. Das angekündigte Migrationsfenster abwarten.
7. Nur mit expliziter Genehmigung für ein Breaking Release entfernen.

Abgekündigte Einträge müssen ein Startdatum für Warnungen, einen Ersatz, einen Dokumentationslink
und ein endgültiges Entfernungsdatum enthalten, das höchstens drei Monate nach Beginn der Warnung liegt. Fügen Sie
keinen abgekündigten Kompatibilitätspfad mit einem offenen Enddatum hinzu, es sei denn,
Maintainer entscheiden ausdrücklich, dass es sich um dauerhafte Kompatibilität handelt, und markieren ihn stattdessen als `active`.

## Aktuelle Kompatibilitätsbereiche

Aktuelle Kompatibilitätseinträge umfassen:

- ältere breite SDK-Importe wie `openclaw/plugin-sdk/compat`
- ältere Plugin-Formen nur mit Hooks und `before_agent_start`
- ältere Plugin-Entrypoints `activate(api)`, während Plugins zu
  `register(api)` migrieren
- ältere SDK-Aliasse wie `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, Status-Builder für `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` und die Typ-Aliasse `ClawdbotConfig` /
  `OpenClawSchemaType`
- Verhalten für Allowlist und Aktivierung gebündelter Plugins
- ältere Metadaten im Manifest für env-Variablen von Provider/Kanal
- ältere Provider-Plugin-Hooks und Typ-Aliasse, während Provider zu
  expliziten Hooks für Katalog, Authentifizierung, Thinking, Replay und Transport wechseln
- ältere Laufzeit-Aliasse wie `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` und `api.runtime.stt`
- ältere geteilte Registrierung von Speicher-Plugins, während Speicher-Plugins zu
  `registerMemoryCapability` wechseln
- ältere Kanal-SDK-Helfer für native Nachrichtenschemas, Steuerung über Erwähnungen,
  Formatierung eingehender Envelopes und verschachtelte Approval-Fähigkeiten
- Aktivierungshinweise, die durch Eigentümerschaft von Manifest-Beiträgen ersetzt werden
- Laufzeit-Fallback von `setup-api`, während Setup-Deskriptoren zu kalten
  Metadaten `setup.requiresRuntime: false` wechseln
- Provider-Hooks `discovery`, während Provider-Katalog-Hooks zu
  `catalog.run(...)` wechseln
- Kanal-Metadaten `showConfigured` / `showInSetup`, während Kanalpakete zu
  `openclaw.channel.exposure` wechseln
- ältere Konfigurationsschlüssel für Laufzeitrichtlinien, während Doctor Operatoren zu
  `agentRuntime` migriert
- Fallback für generierte Metadaten zur Konfiguration gebündelter Kanäle, während
  registry-first-Metadaten `channelConfigs` eingeführt werden
- Umgebungsflags zum Deaktivieren der persistenten Plugin-Registry und zur Installationsmigration, während
  Reparaturabläufe Operatoren zu `openclaw plugins registry --refresh` und
  `openclaw doctor --fix` migrieren
- ältere plugin-eigene Konfigurationspfade für Websuche, Web-Fetch und x_search, während
  Doctor sie nach `plugins.entries.<plugin>.config` migriert
- ältere authored config `plugins.installs` und Load-Path-Aliasse für gebündelte Plugins, während Installationsmetadaten in das vom Zustand verwaltete Plugin-Ledger verschoben werden

Neuer Plugin-Code sollte den in der Registry und im jeweiligen
Migrationsleitfaden aufgeführten Ersatz bevorzugen. Bestehende Plugins können einen Kompatibilitätspfad
weiterhin verwenden, bis Dokumentation, Diagnosen und Release Notes ein Entfernungsfenster ankündigen.

## Release Notes

Release Notes sollten bevorstehende Abkündigungen von Plugins mit Zieldaten und
Links zu Migrationsdokumentation enthalten. Diese Warnung muss erfolgen, bevor ein
Kompatibilitätspfad zu `removal-pending` oder `removed` wechselt.
