---
doc-schema-version: 1
read_when:
    - Sie möchten Drittanbieter-Plugins für OpenClaw finden
    - Sie möchten Ihr eigenes Plugin auf ClawHub veröffentlichen oder auflisten
summary: Community-gepflegte OpenClaw-Plugins finden und veröffentlichen
title: Community-Plugins
x-i18n:
    generated_at: "2026-06-27T17:47:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Drittanbieterpakete, die OpenClaw um Kanäle,
Tools, Provider, Hooks oder andere Funktionen erweitern. Verwenden Sie [ClawHub](/de/clawhub) als
primäre Suchoberfläche für öffentliche Community-Plugins.

## Plugins finden

Durchsuchen Sie ClawHub über die CLI:

```bash
openclaw plugins search "calendar"
```

Installieren Sie ein ClawHub-Plugin mit einem expliziten Quellpräfix:

```bash
openclaw plugins install clawhub:<package-name>
```

npm bleibt während der Einführungsumstellung ein unterstützter direkter Installationspfad:

```bash
openclaw plugins install npm:<package-name>
```

Verwenden Sie [Plugins verwalten](/de/plugins/manage-plugins) für gängige Beispiele zum Installieren, Aktualisieren,
Prüfen und Deinstallieren. Verwenden Sie [`openclaw plugins`](/de/cli/plugins) für die
vollständige Befehlsreferenz und die Regeln zur Quellenauswahl.

## Plugins veröffentlichen

Veröffentlichen Sie öffentliche Community-Plugins auf ClawHub, wenn OpenClaw-Benutzer sie
entdecken und installieren können sollen. ClawHub besitzt die Live-Paketliste, den Release-Verlauf,
den Scanstatus und Installationshinweise; die Dokumentation pflegt keinen statischen
Katalog von Drittanbieter-Plugins.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Stellen Sie vor der Veröffentlichung sicher, dass das Plugin Paketmetadaten, ein Plugin-Manifest,
Einrichtungsdokumentation und einen klaren Wartungsverantwortlichen hat. ClawHub validiert Owner-Scope,
Paketname, Version, Dateigrenzen und Quellmetadaten, bevor es ein
Release erstellt, und hält neue Releases anschließend von normalen Installations- und Download-
Oberflächen verborgen, bis Review und Verifizierung abgeschlossen sind.

Verwenden Sie diese Checkliste vor der Veröffentlichung:

| Anforderung          | Warum                                                 |
| -------------------- | --------------------------------------------------- |
| Auf ClawHub veröffentlicht | Benutzer benötigen Hinweise, damit `openclaw plugins install` funktioniert |
| Öffentliches GitHub-Repository   | Quellreview, Issue-Tracking, Transparenz         |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren              |
| Aktive Wartung   | Aktuelle Updates oder reaktionsschnelle Issue-Bearbeitung         |

Verwenden Sie diese Seiten für den vollständigen Veröffentlichungsvertrag:

- [ClawHub-Veröffentlichung](/de/clawhub/publishing) erklärt Owner, Scopes, Releases,
  Review, Paketvalidierung und Paketübertragung.
- [Plugins erstellen](/de/plugins/building-plugins) zeigt die Form des Plugin-Pakets
  und den ersten Veröffentlichungsworkflow.
- [Plugin-Manifest](/de/plugins/manifest) definiert native Plugin-Manifestfelder.

## Verwandt

- [Plugins](/de/tools/plugin) - installieren, konfigurieren, neu starten und Fehler beheben
- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele
- [ClawHub-Veröffentlichung](/de/clawhub/publishing) - Veröffentlichungs- und Release-Regeln
