---
doc-schema-version: 1
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin auf ClawHub veröffentlichen oder auflisten.
summary: Von der Community gepflegte OpenClaw-Plugins finden und veröffentlichen
title: Community-Plugins
x-i18n:
    generated_at: "2026-07-12T01:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Pakete von Drittanbietern, die OpenClaw um Kanäle, Tools, Provider, Hooks oder andere Funktionen erweitern. Verwenden Sie [ClawHub](/clawhub) als primäre Anlaufstelle, um öffentliche Community-Plugins zu finden.

## Plugins finden

Durchsuchen Sie ClawHub über die CLI:

```bash
openclaw plugins search "calendar"
```

Installieren Sie ein ClawHub-Plugin mit einem expliziten Quellpräfix:

```bash
openclaw plugins install clawhub:<package-name>
```

Während der Umstellung zur Einführung bleibt npm als direkter Installationsweg unterstützt:

```bash
openclaw plugins install npm:<package-name>
```

Unter [Plugins verwalten](/de/plugins/manage-plugins) finden Sie gängige Beispiele zum Installieren, Aktualisieren, Prüfen und Deinstallieren. Die vollständige Befehlsreferenz und die Regeln zur Quellenauswahl finden Sie unter [`openclaw plugins`](/de/cli/plugins).

## Plugins veröffentlichen

Veröffentlichen Sie öffentliche Community-Plugins auf ClawHub, damit OpenClaw-Benutzer sie finden und installieren können. ClawHub verwaltet die aktuelle Paketliste, den Veröffentlichungsverlauf, den Scanstatus und die Installationshinweise. Die Dokumentation führt keinen statischen Katalog mit Plugins von Drittanbietern.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Stellen Sie vor der Veröffentlichung sicher, dass das Plugin über Paketmetadaten, ein Plugin-Manifest, eine Einrichtungsdokumentation und eine klar benannte für die Wartung verantwortliche Person verfügt. ClawHub validiert den Geltungsbereich des Eigentümers, den Paketnamen, die Version, die Dateibeschränkungen und die Quellmetadaten, bevor eine Veröffentlichung erstellt wird. Neue Veröffentlichungen bleiben anschließend auf den regulären Installations- und Download-Oberflächen verborgen, bis Prüfung und Verifizierung abgeschlossen sind.

Checkliste vor der Veröffentlichung:

| Anforderung                    | Warum                                                               |
| ------------------------------ | ------------------------------------------------------------------- |
| Auf ClawHub veröffentlicht     | Die Hinweise für `openclaw plugins install` müssen funktionieren    |
| Öffentliches GitHub-Repository | Quellcodeprüfung, Problemverfolgung und Transparenz                  |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie das Plugin konfigurieren |
| Aktive Wartung                 | Aktuelle Updates oder zeitnahe Bearbeitung gemeldeter Probleme      |

Vollständiger Veröffentlichungsvertrag:

- [Veröffentlichung auf ClawHub](/de/clawhub/publishing) – Eigentümer, Geltungsbereiche, Veröffentlichungen, Prüfung, Paketvalidierung und Paketübertragung
- [Plugins erstellen](/de/plugins/building-plugins) – die Struktur des Plugin-Pakets und der Ablauf der ersten Veröffentlichung
- [Plugin-Manifest](/de/plugins/manifest) – Felder des nativen Plugin-Manifests

## Verwandte Themen

- [Plugins](/de/tools/plugin) – installieren, konfigurieren, neu starten und Fehler beheben
- [Plugins verwalten](/de/plugins/manage-plugins) – Befehlsbeispiele
- [Veröffentlichung auf ClawHub](/de/clawhub/publishing) – Regeln für Veröffentlichung und Releases
