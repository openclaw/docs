---
read_when:
    - Listings, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichungen, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-07-03T02:44:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Wie ClawHub funktioniert

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Sie bietet Benutzern einen
Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und
OpenClaw ausreichend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jede öffentliche Auflistung ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations- und Star-Signalen
- Sicherheits-Scan- und Moderationsstatus

Die Auflistungsseite ist der maßgebliche Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu leisten beansprucht, bevor sie ihn bzw. es installieren.

## Skills

Ein Skill ist ein versioniertes Text-Bundle mit `SKILL.md` als Mittelpunkt. Er kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die ausgewiesenen
Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
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

Verwenden Sie Testläufe, um die aufgelöste Nutzlast vor dem Upload zu prüfen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Updates später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Skill-Installations- und
Update-Workflows für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspaces verwenden möchten.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, Releases unterliegen jedoch weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderationsmaßnahmen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, sofern verfügbar. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, während sie für den
Owner zu Diagnosezwecken sichtbar bleiben.

Siehe [Sicherheit](/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits),
[Moderation und Kontosicherheit](/de/clawhub/moderation) und
[Akzeptable Nutzung](/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf die
maßgebliche ClawHub-Auflistung zurückverlinken, Rate Limits beachten und nicht den Eindruck einer Empfehlung erwecken.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP API](/clawhub/http-api).
