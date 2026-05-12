---
read_when:
    - Seelen veröffentlichen
    - Debuggen von Fehlern bei der Veröffentlichung von soul
summary: Soul-Bundle-Format, erforderliche Dateien, Grenzwerte.
x-i18n:
    generated_at: "2026-05-12T00:58:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-Format

## Auf dem Datenträger

Eine Soul ist eine einzelne Datei:

- `SOUL.md` (oder `soul.md`)

Derzeit lehnt onlycrabs.ai zusätzliche Dateien ab.

## `SOUL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert beim Veröffentlichen Metadaten aus dem Frontmatter.
- `description` wird in der UI/Suche als Zusammenfassung der Soul verwendet.

## Beschränkungen

- Gesamtgröße des Bundles: 50 MB.
- Einbettungstext umfasst nur `SOUL.md`.

## Slugs

- Werden standardmäßig aus dem Ordnernamen abgeleitet.
- Müssen kleingeschrieben und URL-sicher sein: `^[a-z0-9][a-z0-9-]*$`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (SemVer).
- Tags sind String-Zeiger auf eine Version; `latest` wird häufig verwendet.
