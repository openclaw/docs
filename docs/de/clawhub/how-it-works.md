---
read_when:
    - Listings, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Funktionsweise von ClawHub-Einträgen, Versionen, Installationen, Veröffentlichungen, Scans und Aktualisierungen.
x-i18n:
    generated_at: "2026-07-16T12:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Schicht für OpenClaw Skills und Plugins. Sie bietet Benutzern einen
Ort, an dem sie Pakete entdecken können, Herausgebern einen Ort zur Veröffentlichung von Versionen und
OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Eigentümer und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenangabe
- Änderungsprotokoll und Tag-Informationen wie `latest`
- Download-, Installations- und Sternsignalen
- Status der Sicherheitsprüfung und Moderation

Die Eintragsseite ist der maßgebliche Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin laut eigener Beschreibung leistet, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Textpaket mit `SKILL.md` als zentraler Datei. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen,
die Beschreibung, die Anforderungen, die Umgebungsvariablen und die Metadaten des Skills zu erfassen. Präzise
Metadaten sind wichtig, da sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Prüfungen ermöglichen, Abweichungen zwischen dem deklarierten und dem beobachteten Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angegebenen
Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
die mindestens erforderliche Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests
enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry als
maßgebliche Quelle dienen soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Durch die Veröffentlichung wird ein neuer unveränderlicher Versionseintrag erstellt. Herausgeber verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Hochladen in der Vorschau anzuzeigen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenangaben und den Prüfstatus an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Aktualisierungen später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Installations- und
Aktualisierungsworkflows für Skills für Benutzer, die von der Registry verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Arbeitsbereichs verwenden möchten.

## Sicherheitsstatus

ClawHub ermöglicht offene Veröffentlichungen, doch Releases unterliegen weiterhin Upload-Prüfschranken,
automatisierten Prüfungen, Benutzerberichten und Maßnahmen der Moderatoren.

Öffentliche Seiten zeigen Prüfzusammenfassungen an, sofern verfügbar. Inhalte, die zurückgehalten, verborgen
oder blockiert werden, können aus der öffentlichen Suche und den Installationsabläufen verschwinden, während sie
für den Eigentümer zu Diagnosezwecken sichtbar bleiben.

Siehe [Sicherheit](/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits),
[Moderation und Kontosicherheit](/de/clawhub/moderation) und
[Zulässige Nutzung](/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Kataloge von Drittanbietern dürfen diese APIs verwenden, wenn sie auf den
maßgeblichen ClawHub-Eintrag verlinken, Ratenbegrenzungen einhalten und nicht den Eindruck einer Empfehlung erwecken.

Siehe [Öffentliche API](/clawhub/api) und [HTTP-API](/clawhub/http-api).
