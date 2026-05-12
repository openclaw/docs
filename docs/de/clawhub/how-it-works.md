---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichungen, Scans und Aktualisierungen funktionieren.
x-i18n:
    generated_at: "2026-05-12T04:09:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw-Skills und Plugins. Sie gibt Benutzern einen
Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und
OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jede öffentliche Auflistung ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Signalen zu Downloads, Installationen, Sternen und Kommentaren
- Sicherheits-Scan- und Moderationsstatus

Die Auflistungsseite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu tun behauptet, bevor sie ihn bzw. es installieren.

## Skills

Ein Skill ist ein versioniertes Text-Bundle mit `SKILL.md` im Zentrum. Er kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es die angegebenen Kompatibilitätsmetadaten,
bevor es installiert. Paketeinträge können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Die Veröffentlichung erstellt einen neuen unveränderlichen Versionseintrag. Publisher verwenden die `clawhub`-
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Upload zu prüfen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Aktualisierungen später dasselbe
Registry-Paket auflösen können. Die ClawHub-CLI unterstützt außerdem direkte Workflows zum Installieren und
Aktualisieren von Skills für Benutzer, die von der Registry verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace wünschen.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, wenn sie verfügbar sind. Inhalte, die zurückgehalten, verborgen
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, bleiben aber
für den Owner zur Diagnose sichtbar.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Zulässige Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf die
kanonische ClawHub-Auflistung zurückverlinken, Rate Limits einhalten und vermeiden, eine Empfehlung zu suggerieren.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP-API](/de/clawhub/http-api).
