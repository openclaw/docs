---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-06-28T05:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Schicht für OpenClaw-Skills und -Plugins. Es bietet Benutzern einen
Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und
OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jedes öffentliche Listing ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenangabe
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations- und Star-Signale
- Sicherheitsscan- und Moderationsstatus

Die Listing-Seite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu tun angibt, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Text-Bundle mit `SKILL.md` im Mittelpunkt. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Genaue
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angekündigten Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
Mindestversion des Gateways, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
Source of Truth sein soll:

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

Verwenden Sie Probeläufe, um die aufgelöste Payload vor dem Upload zu prüfen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenangabe und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Updates später dasselbe
Registry-Paket auflösen können. Die ClawHub-CLI unterstützt außerdem direkte Skill-Installations- und
Update-Workflows für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace verwenden möchten.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, Releases unterliegen jedoch weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzermeldungen und Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen, sofern verfügbar. Inhalte, die zurückgehalten, verborgen
oder blockiert werden, können aus öffentlichen Such- und Installationsabläufen verschwinden, bleiben
für den Owner jedoch zu Diagnosezwecken sichtbar.

Siehe [Security](/de/clawhub/security), [Security Audits](/de/clawhub/security-audits),
[Moderation and Account Safety](/de/clawhub/moderation) und
[Acceptable usage](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge dürfen diese APIs verwenden, wenn sie auf das
kanonische ClawHub-Listing zurückverweisen, Rate Limits einhalten und nicht den Eindruck einer Empfehlung erwecken.

Siehe [Public API](/de/clawhub/api) und [HTTP API](/de/clawhub/http-api).
