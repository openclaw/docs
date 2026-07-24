---
read_when:
    - Grundlagen zu Einträgen, Versionen, Installationen, Veröffentlichung und Moderation
summary: Funktionsweise von ClawHub-Einträgen, -Versionen, -Installationen, -Veröffentlichungen, -Scans und -Updates.
x-i18n:
    generated_at: "2026-07-24T04:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Funktionsweise von ClawHub

ClawHub ist die Registry-Schicht für OpenClaw Skills und Plugins. Sie bietet Benutzern einen
Ort zum Entdecken von Paketen, Publishern einen Ort zum Veröffentlichen von Versionen und
stellt OpenClaw genügend Metadaten bereit, um diese Pakete sicher zu installieren und zu aktualisieren.

## Registry-Einträge

Jeder öffentliche Eintrag ist ein Registry-Eintrag mit:

- einem Eigentümer und Slug oder Paketnamen
- einer oder mehreren veröffentlichten Versionen
- Metadaten, Zusammenfassung, Dateien und Quellenangabe
- Änderungsprotokoll und Tag-Informationen wie `latest`
- Signalen zu Downloads, Installationen und Sternen
- Status von Sicherheitsscans und Moderation

Die Eintragsseite ist die maßgebliche Stelle, an der Benutzer prüfen können, was ein Skill oder
Plugin eigenen Angaben zufolge leistet, bevor sie es installieren.

## Skills

Ein Skill ist ein versioniertes Textpaket, dessen Kern `SKILL.md` bildet. Es kann
ergänzende Dateien, Beispiele, Vorlagen und Skripte enthalten.

ClawHub liest das Frontmatter in `SKILL.md`, um den Namen,
die Beschreibung, die Anforderungen, die Umgebungsvariablen und die Metadaten des Skills zu erfassen. Korrekte
Metadaten sind wichtig, da sie Benutzern bei der Entscheidung helfen, ob sie den Skill installieren möchten, und
automatisierten Scans ermöglichen, Abweichungen zwischen deklariertem und beobachtetem Verhalten zu erkennen.

Siehe [Skill-Format](/clawhub/skill-format).

## Plugins

Plugins sind paketierte OpenClaw-Erweiterungen. ClawHub speichert Paketmetadaten,
Kompatibilitätsinformationen, Quelllinks, Artefakte und Versionseinträge.

Wenn OpenClaw ein Plugin aus ClawHub installiert, prüft es vor der Installation die angegebenen
Kompatibilitätsmetadaten. Paketeinträge können API-Kompatibilität,
die mindestens erforderliche Gateway-Version, Ziel-Hosts, Umgebungsanforderungen und Artefakt-
Digests enthalten.

Verwenden Sie eine explizite ClawHub-Installationsquelle, wenn die Registry die
maßgebliche Quelle sein soll:

```bash
openclaw plugins install clawhub:<package>
```

## Veröffentlichung

Durch eine Veröffentlichung wird ein neuer unveränderlicher Versionseintrag erstellt. Publisher verwenden die `clawhub`
CLI für authentifizierte Registry-Abläufe:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie Probeläufe, um die aufgelöste Nutzlast vor dem Hochladen zu prüfen. Die öffentlichen Seiten
zeigen anschließend die veröffentlichten Metadaten, Dateien, Quellenangaben und den Scanstatus an.

## Installationen und Aktualisierungen

OpenClaw-Installationsbefehle verwenden ClawHub als Paketquelle:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw speichert Metadaten zur Installationsquelle, damit Aktualisierungen später dasselbe
Registry-Paket auflösen können. Die ClawHub CLI unterstützt außerdem direkte Installations- und
Aktualisierungsabläufe für Skills für Benutzer, die von der Registry verwaltete Skill-Ordner außerhalb eines
vollständigen OpenClaw-Arbeitsbereichs verwenden möchten.

## Sicherheitsstatus

ClawHub steht für Veröffentlichungen offen, Releases unterliegen jedoch weiterhin Upload-Sperren,
automatisierten Prüfungen, Benutzerberichten und Maßnahmen von Moderatoren.

Öffentliche Seiten zeigen, sofern verfügbar, Zusammenfassungen der Scans an. Inhalte, die zurückgehalten, ausgeblendet
oder gesperrt werden, können aus der öffentlichen Suche und den Installationsabläufen verschwinden, während sie
für den Eigentümer zu Diagnosezwecken weiterhin sichtbar bleiben.

Siehe [Sicherheit](/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits),
[Moderation und Kontosicherheit](/clawhub/moderation) und
[Zulässige Nutzung](/clawhub/acceptable-usage).

## API-Zugriff

ClawHub stellt öffentliche Lese-APIs für Erkundung, Suche, Paketdetails und
Downloads bereit. Drittanbieterkataloge dürfen diese APIs verwenden, wenn sie auf den
maßgeblichen ClawHub-Eintrag verweisen, Ratenbegrenzungen einhalten und nicht den Eindruck einer Empfehlung erwecken.

Siehe [Öffentliche API](/clawhub/api) und [HTTP-API](/clawhub/http-api).
