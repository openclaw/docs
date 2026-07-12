---
doc-schema-version: 1
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin auf ClawHub veröffentlichen oder auflisten.
summary: Von der Community gepflegte OpenClaw-Plugins finden und veröffentlichen
title: Community-Plugins
x-i18n:
    generated_at: "2026-07-12T15:43:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Community-Plugins sind Pakete von Drittanbietern, die OpenClaw um
Kanäle, Tools, Provider, Hooks oder andere Funktionen erweitern. Verwenden Sie
[ClawHub](/de/clawhub) als primäre Plattform zur Suche nach öffentlichen
Community-Plugins.

## Plugins finden

Durchsuchen Sie ClawHub über die CLI:

```bash
openclaw plugins search "calendar"
```

Installieren Sie ein ClawHub-Plugin mit einem expliziten Quellpräfix:

```bash
openclaw plugins install clawhub:<package-name>
```

npm bleibt während der Umstellung zum Start ein unterstützter Weg für die Direktinstallation:

```bash
openclaw plugins install npm:<package-name>
```

Unter [Plugins verwalten](/de/plugins/manage-plugins) finden Sie gängige Beispiele
zum Installieren, Aktualisieren, Prüfen und Deinstallieren. Unter
[`openclaw plugins`](/de/cli/plugins) finden Sie die vollständige Befehlsreferenz
und die Regeln zur Quellenauswahl.

## Plugins veröffentlichen

Veröffentlichen Sie öffentliche Community-Plugins auf ClawHub, damit
OpenClaw-Benutzer sie finden und installieren können. ClawHub verwaltet die
aktuelle Paketliste, den Release-Verlauf, den Scanstatus und die
Installationshinweise; die Dokumentation führt keinen statischen Katalog
von Drittanbieter-Plugins.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Stellen Sie vor der Veröffentlichung sicher, dass das Plugin über
Paketmetadaten, ein Plugin-Manifest, eine Einrichtungsdokumentation und eine
eindeutig benannte zuständige Person für die Wartung verfügt. ClawHub
validiert den Eigentümerbereich, den Paketnamen, die Version, Dateigrenzwerte
und Quellmetadaten, bevor ein Release erstellt wird. Anschließend bleiben neue
Releases auf den regulären Installations- und Download-Oberflächen verborgen,
bis die Prüfung und Verifizierung abgeschlossen sind.

Checkliste vor der Veröffentlichung:

| Anforderung                  | Grund                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| Auf ClawHub veröffentlicht   | Hinweise für `openclaw plugins install` müssen funktionieren |
| Öffentliches GitHub-Repository | Quellcodeprüfung, Problemverfolgung, Transparenz            |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie es konfiguriert wird   |
| Aktive Wartung               | Aktuelle Updates oder zeitnahe Bearbeitung von Problemen     |

Vollständiger Veröffentlichungsvertrag:

- [Veröffentlichung auf ClawHub](/de/clawhub/publishing) - Eigentümer, Bereiche,
  Releases, Prüfung, Paketvalidierung und Paketübertragung
- [Plugins erstellen](/de/plugins/building-plugins) - die Struktur des
  Plugin-Pakets und der Ablauf der ersten Veröffentlichung
- [Plugin-Manifest](/de/plugins/manifest) - Felder des nativen Plugin-Manifests

## Verwandte Themen

- [Plugins](/de/tools/plugin) - installieren, konfigurieren, neu starten und Fehler beheben
- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele
- [Veröffentlichung auf ClawHub](/de/clawhub/publishing) - Veröffentlichungs- und Release-Regeln
