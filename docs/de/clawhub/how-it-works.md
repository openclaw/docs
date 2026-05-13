---
read_when:
    - Listings, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-13T04:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Wie ClawHub funktioniert

ClawHub ist die Registry-Schicht für OpenClaw-Skills und -Plugins. Es gibt Benutzern einen
Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und
OpenClaw ausreichend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Änderungsprotokoll und Tag-Informationen wie `latest`
- Download-, Installations-, Stern- und Kommentarsignalen
- Sicherheits-Scan- und Moderationsstatus

Die Eintragsseite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu leisten behauptet, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Textpaket mit `SKILL.md` im Zentrum. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen, die
Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern helfen zu entscheiden, ob sie den Skill installieren sollen, und
automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin von ClawHub installiert, prüft es die angegebene Kompatibilitätsmetadaten
vor der Installation. Paketeinträge können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
Source of Truth sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Durch die Veröffentlichung wird ein neuer unveränderlicher Versionseintrag erstellt. Publisher verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Payload vor dem Upload zu prüfen. Öffentliche Seiten zeigen dann
die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Updates später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Skill-Installations- und
Update-Workflows für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace wünschen.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, wenn sie verfügbar sind. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus öffentlichen Such- und Installationsabläufen verschwinden, während sie für den Owner
zu Diagnosezwecken sichtbar bleiben.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge dürfen diese APIs verwenden, wenn sie auf den
kanonischen ClawHub-Eintrag zurückverlinken, Ratenlimits einhalten und keine Befürwortung nahelegen.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP-API](/de/clawhub/http-api).
