---
read_when:
    - Einträge, Versionen, Installationen, Veröffentlichung und Moderation verstehen
summary: Wie ClawHub-Einträge, Versionen, Installationen, Veröffentlichung, Scans und Updates funktionieren.
x-i18n:
    generated_at: "2026-07-02T00:49:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# So funktioniert ClawHub

ClawHub ist die Registrierungsebene für OpenClaw-Skills und -Plugins. Sie bietet Benutzern einen Ort, um Pakete zu entdecken, Publishern einen Ort, um Versionen zu veröffentlichen, und OpenClaw genügend Metadaten, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Owner und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenzuordnung
- Changelog- und Tag-Informationen wie `latest`
- Download-, Installations- und Star-Signalen
- Sicherheits-Scan- und Moderationsstatus

Die Eintragsseite ist der kanonische Ort, an dem Benutzer prüfen können, was ein Skill oder Plugin zu leisten vorgibt, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Textpaket mit `SKILL.md` im Zentrum. Es kann unterstützende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter von `SKILL.md`, um den Namen, die Beschreibung, Anforderungen, Umgebungsvariablen und Metadaten des Skills zu verstehen. Genaue Metadaten sind wichtig, weil sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren sollen, und automatisierten Scans helfen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten, Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin von ClawHub installiert, prüft es vor der Installation die angekündigten Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität, Mindestversion des Gateways, Host-Ziele, Umgebungsanforderungen und Artefakt-Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die Quelle der Wahrheit sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Die Veröffentlichung erstellt einen neuen unveränderlichen Versionseintrag. Publisher verwenden die `clawhub`-CLI für authentifizierte Registry-Workflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Upload in der Vorschau zu prüfen. Öffentliche Seiten zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenzuordnung und den Scan-Status an.

## Installationen und Updates

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zeichnet Metadaten zur Installationsquelle auf, damit Updates später dasselbe Registry-Paket auflösen können. Die ClawHub-CLI unterstützt außerdem direkte Workflows für Skill-Installation und -Aktualisierung für Benutzer, die Registry-verwaltete Skill-Ordner außerhalb eines vollständigen OpenClaw-Workspaces nutzen möchten.

## Sicherheitsstatus

ClawHub ist für Veröffentlichungen offen, aber Releases unterliegen weiterhin Upload-Gates, automatisierten Prüfungen, Benutzerberichten und Moderationsmaßnahmen.

Öffentliche Seiten zeigen Scan-Zusammenfassungen an, sofern verfügbar. Inhalte, die zurückgehalten, ausgeblendet oder blockiert werden, können aus öffentlicher Suche und Installationsabläufen verschwinden, bleiben dem Owner jedoch für Diagnosezwecke sichtbar.

Siehe [Sicherheit](/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits), [Moderation und Kontosicherheit](/de/clawhub/moderation) und [Akzeptable Nutzung](/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Entdeckung, Suche, Paketdetails und Downloads bereit. Drittanbieter-Kataloge können diese APIs verwenden, wenn sie auf den kanonischen ClawHub-Eintrag zurückverlinken, Rate Limits respektieren und vermeiden, eine Empfehlung nahezulegen.

Siehe [Öffentliche API](/clawhub/api) und [HTTP-API](/clawhub/http-api).
