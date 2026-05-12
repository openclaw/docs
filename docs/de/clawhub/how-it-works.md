---
read_when:
    - Listings, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-05-12T00:56:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registry-Ebene für OpenClaw Skills und Plugins. Es bietet Benutzern einen
Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und
OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jede öffentliche Auflistung ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations-, Stern- und Kommentarsignalen
- Sicherheitsprüfungs- und Moderationsstatus

Die Auflistungsseite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder
Plugin vor der Installation zu tun vorgibt.

## Skills

Ein Skill ist ein versioniertes Text-Bundle rund um `SKILL.md`. Es kann
unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Skill-Namen,
die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten zu verstehen. Genaue
Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und
automatisierten Prüfungen helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angezeigten Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
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

Verwenden Sie Testläufe, um die aufgelöste Payload vor dem Upload in der Vorschau zu prüfen. Öffentliche Seiten zeigen anschließend
die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Prüfstatus an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Aktualisierungen später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt auch direkte Skill-Installations- und
Aktualisierungs-Workflows für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Workspace wünschen.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, aber Releases unterliegen weiterhin Upload-Gates,
automatisierten Prüfungen, Benutzerberichten und Moderatoraktionen.

Öffentliche Seiten zeigen Prüfzusammenfassungen an, wenn diese verfügbar sind. Inhalte, die zurückgehalten, ausgeblendet
oder blockiert werden, können aus der öffentlichen Suche und aus Installationsabläufen verschwinden, bleiben jedoch
für den Owner zu Diagnosezwecken sichtbar.

Siehe [Sicherheit + Moderation](/de/clawhub/security) und
[Akzeptable Nutzung](/de/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Discovery, Suche, Paketdetails und
Downloads bereit. Drittanbieter-Kataloge dürfen diese APIs verwenden, wenn sie zurück auf die
kanonische ClawHub-Auflistung verlinken, Ratenlimits respektieren und keine Befürwortung implizieren.

Siehe [Public API](/de/clawhub/api) und [HTTP API](/de/clawhub/http-api).
