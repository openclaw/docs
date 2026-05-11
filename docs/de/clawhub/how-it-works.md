---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: So funktionieren ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates.
x-i18n:
    generated_at: "2026-05-11T20:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Sie bietet Benutzern einen
Ort zum Entdecken von Paketen, Publishern einen Ort zum Veröffentlichen von Versionen und
OpenClaw ausreichend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jedes öffentliche Listing ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenangaben
- Changelog- und Tag-Informationen wie `latest`
- Signalen zu Downloads, Installationen, Sternen und Kommentaren
- Sicherheits-Scan und Moderationsstatus

Die Listing-Seite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin vor der Installation zu tun vorgibt.

## Skills

Ein Skill ist ein versioniertes Text-Bundle rund um `SKILL.md`. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angegebenen Kompatibilitätsmetadaten.
Paketeinträge können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichen

Beim Veröffentlichen wird ein neuer unveränderlicher Versionseintrag erstellt. Publisher verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Testläufe, um die aufgelöste Nutzlast vor dem Upload zu prüfen. Öffentliche Seiten zeigen dann
die veröffentlichten Metadaten, Dateien, Quellenangaben und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Updates später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Installations- und
Update-Workflows für Skills für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace verwenden möchten.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Maßnahmen durch Moderatoren.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, wenn sie verfügbar sind. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, während sie
für den Owner zur Diagnose oder Anfechtung weiterhin sichtbar bleiben.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf das
kanonische ClawHub-Listing zurückverlinken, Ratenlimits respektieren und keine Empfehlung implizieren.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP-API](/de/clawhub/http-api).
