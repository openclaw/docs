---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Listings, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-10T19:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Es bietet Benutzern einen
Ort zum Entdecken von Paketen, Publishern einen Ort zum Veröffentlichen von Versionen und
OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenangabe
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations-, Stern- und Kommentarsignalen
- Sicherheits-Scan- und Moderationsstatus

Die Eintragsseite ist die kanonische Stelle, an der Benutzer prüfen können, was ein Skill oder
Plugin vor der Installation zu leisten angibt.

## Skills

Ein Skill ist ein versioniertes Textpaket mit `SKILL.md` als Mittelpunkt. Er kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Genaue
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren,
und automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionsdatensätze.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angezeigten
Kompatibilitätsmetadaten. Paketdatensätze können API-Kompatibilität,
Gateway-Mindestversion, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
Source of Truth sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichen

Beim Veröffentlichen wird ein neuer unveränderlicher Versionsdatensatz erstellt. Publisher verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Payload vor dem Upload zu prüfen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenangaben und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Updates später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Workflows zum Installieren und
Aktualisieren von Skills für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspaces nutzen möchten.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, sofern verfügbar. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, während sie
für den Owner zu Diagnose- oder Einspruchszwecken sichtbar bleiben.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf den
kanonischen ClawHub-Eintrag zurückverlinken, Ratenlimits einhalten und keine Empfehlung implizieren.

Siehe [Public API](/de/clawhub/api) und [HTTP API](/de/clawhub/http-api).
