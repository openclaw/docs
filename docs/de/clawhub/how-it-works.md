---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichungen, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-12T15:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Sie bietet Benutzern
einen Ort zum Entdecken von Paketen, Publishern einen Ort zum Veröffentlichen von
Versionen und OpenClaw ausreichend Metadaten, um diese Pakete sicher zu installieren
und zu aktualisieren.

## Registry-Datensätze

Jeder öffentliche Eintrag ist ein Registry-Datensatz mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Signalen zu Downloads, Installationen, Sternen und Kommentaren
- Sicherheits-Scan- und Moderationsstatus

Die Eintragsseite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill
oder Plugin vor der Installation zu leisten vorgibt.

## Skills

Ein Skill ist ein versioniertes Text-Bundle mit `SKILL.md` im Mittelpunkt. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen, die Beschreibung,
Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den
Skill installieren sollen, und automatisierten Scans helfen, Abweichungen zwischen
deklarierter und beobachteter Funktion zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionsdatensätze.

Wenn OpenClaw ein Plugin von ClawHub installiert, prüft es vor der Installation die
beworbenen Kompatibilitätsmetadaten. Paketdatensätze können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests
enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
Source of Truth sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichen

Das Veröffentlichen erstellt einen neuen unveränderlichen Versionsdatensatz. Publisher
verwenden die `clawhub`-CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Testläufe, um die aufgelöste Payload vor dem Upload zu prüfen. Öffentliche
Seiten zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenzuordnung
und den Scan-Status an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Aktualisierungen später
dasselbe Registry-Paket auflösen können. Die ClawHub-CLI unterstützt außerdem direkte
Installations- und Aktualisierungs-Workflows für Skills für Benutzer, die von der
Registry verwaltete Skill-Ordner außerhalb eines vollständigen OpenClaw-Workspace
verwenden möchten.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, aber Releases unterliegen weiterhin
Upload-Gates, automatisierten Prüfungen, Benutzerberichten und Moderationsmaßnahmen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, wenn verfügbar. Inhalte, die
zurückgehalten, ausgeblendet oder blockiert werden, können aus der öffentlichen Suche
und den Installationsabläufen verschwinden, bleiben für den Owner jedoch zu
Diagnosezwecken sichtbar.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und Downloads
bereit. Drittanbieter-Kataloge dürfen diese APIs verwenden, wenn sie auf den
kanonischen ClawHub-Eintrag zurückverlinken, Rate Limits einhalten und keine
Billigung implizieren.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP-API](/de/clawhub/http-api).
