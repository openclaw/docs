---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-07-02T17:34:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Es bietet Benutzern
einen Ort, um Pakete zu entdecken, Herausgebern einen Ort, um Versionen zu
veröffentlichen, und stellt OpenClaw genügend Metadaten bereit, um diese Pakete
sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jede öffentliche Auflistung ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations- und Star-Signalen
- Sicherheits-Scan- und Moderationsstatus

Die Auflistungsseite ist der kanonische Ort, an dem Benutzer prüfen können, was
ein Skill oder Plugin vor der Installation zu tun vorgibt.

## Skills

Ein Skill ist ein versioniertes Textpaket rund um `SKILL.md`. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen, die
Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen.
Genaue Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen,
ob sie den Skill installieren sollen, und automatisierten Scans helfen,
Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert
Paketmetadaten, Kompatibilitätsinformationen, Quelllinks, Artefakte und
Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation
die angezeigten Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
eine Mindestversion des Gateway, Host-Ziele, Umgebungsanforderungen und
Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Die Veröffentlichung erstellt einen neuen unveränderlichen Versionseintrag.
Herausgeber verwenden die `clawhub`-CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Testläufe, um die aufgelöste Nutzlast vor dem Upload in der
Vorschau zu prüfen. Öffentliche Seiten zeigen anschließend die veröffentlichten
Metadaten, Dateien, Quellenzuordnung und den Scan-Status an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Aktualisierungen
später dasselbe Registry-Paket auflösen können. Die ClawHub-CLI unterstützt
außerdem direkte Workflows zum Installieren und Aktualisieren von Skills für
Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines vollständigen
OpenClaw-Workspace verwenden möchten.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, aber Releases unterliegen weiterhin
Upload-Gates, automatisierten Prüfungen, Benutzerberichten und
Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, sofern verfügbar. Inhalte,
die zurückgehalten, ausgeblendet oder blockiert werden, können aus der
öffentlichen Suche und aus Installationsabläufen verschwinden, während sie für
den Owner zu Diagnosezwecken sichtbar bleiben.

Siehe [Sicherheit](/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits),
[Moderation und Kontosicherheit](/de/clawhub/moderation) und
[Akzeptable Nutzung](/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge dürfen diese APIs verwenden, wenn sie
auf die kanonische ClawHub-Auflistung zurückverlinken, Ratenbegrenzungen
einhalten und nicht den Eindruck einer Empfehlung erwecken.

Siehe [Öffentliche API](/clawhub/api) und [HTTP-API](/clawhub/http-api).
