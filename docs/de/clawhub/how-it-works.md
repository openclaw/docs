---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-12T12:53:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Wie ClawHub funktioniert

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Sie bietet Benutzern
einen Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen,
und stellt OpenClaw genügend Metadaten bereit, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations-, Star- und Kommentarsignalen
- Sicherheits-Scan und Moderationsstatus

Die Eintragsseite ist der maßgebliche Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu tun angibt, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Textpaket rund um `SKILL.md`. Er kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Genaue
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin von ClawHub installiert, prüft es die angezeigten Kompatibilitätsmetadaten
vor der Installation. Paketeinträge können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichen

Das Veröffentlichen erstellt einen neuen unveränderlichen Versionseintrag. Publisher verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Upload zu prüfen. Öffentliche Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Updates dasselbe
Registry-Paket später auflösen können. Die ClawHub CLI unterstützt auch direkte Skill-Installations- und
Update-Workflows für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace wünschen.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Maßnahmen durch Moderatoren.

Öffentliche Seiten zeigen Scan-Zusammenfassungen, sofern verfügbar. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus öffentlichen Such- und Installationsabläufen verschwinden, während sie
für den Owner zu Diagnosezwecken sichtbar bleiben.

Siehe [Sicherheit und Moderation](/de/clawhub/security) und
[Zulässige Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf den
maßgeblichen ClawHub-Eintrag zurückverlinken, Ratenbegrenzungen einhalten und keine Befürwortung implizieren.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP API](/de/clawhub/http-api).
