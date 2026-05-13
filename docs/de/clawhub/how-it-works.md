---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-13T05:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Wie ClawHub funktioniert

ClawHub ist die Registry-Ebene für OpenClaw-Skills und -Plugins. Es bietet Benutzern
einen Ort, um Pakete zu entdecken, Herausgebern einen Ort, um Versionen zu veröffentlichen,
und OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations-, Stern- und Kommentarsignalen
- Sicherheits-Scan- und Moderationsstatus

Die Eintragsseite ist der maßgebliche Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin zu tun behauptet, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Text-Bundle rund um `SKILL.md`. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen. Präzise
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren,
und automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionsdatensätze.

Wenn OpenClaw ein Plugin von ClawHub installiert, prüft es vor der Installation die beworbenen
Kompatibilitätsmetadaten. Paketdatensätze können API-Kompatibilität,
minimale Gateway-Version, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Die Veröffentlichung erstellt einen neuen unveränderlichen Versionsdatensatz. Herausgeber verwenden die `clawhub`
CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Upload in der Vorschau zu prüfen. Öffentliche Seiten
zeigen dann die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, sodass Aktualisierungen später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Skill-Installations- und
Aktualisierungs-Workflows für Benutzer, die von der Registry verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Arbeitsbereichs verwenden möchten.

## Sicherheitsstatus

ClawHub ist offen für Veröffentlichungen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderatoraktionen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, wenn sie verfügbar sind. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, bleiben aber
für den Owner zur Diagnose sichtbar.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und
Downloads bereit. Kataloge von Drittanbietern dürfen diese APIs verwenden, wenn sie zurück auf den
maßgeblichen ClawHub-Eintrag verlinken, Rate Limits einhalten und vermeiden, eine Empfehlung zu implizieren.

Siehe [Öffentliche API](/de/clawhub/api) und [HTTP-API](/de/clawhub/http-api).
