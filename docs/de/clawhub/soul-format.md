---
read_when:
    - Seelen veröffentlichen
    - Debuggen von Fehlern bei soul publish
summary: Soul-Bundle-Format, erforderliche Dateien, Grenzwerte.
x-i18n:
    generated_at: "2026-05-12T23:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-Format

## Auf dem Datenträger

Ein Soul ist eine einzelne Datei:

- `SOUL.md` (oder `soul.md`)

Derzeit lehnt onlycrabs.ai zusätzliche Dateien ab.

## `SOUL.md`

- Markdown mit optionalem YAML-Frontmatter.
- Der Server extrahiert während der Veröffentlichung Metadaten aus dem Frontmatter.
- `description` wird als Soul-Zusammenfassung in der Benutzeroberfläche/Suche verwendet.

## Limits

- Gesamtgröße des Bundles: 50MB.
- Der Embedding-Text enthält nur `SOUL.md`.

## Slugs

- Standardmäßig aus dem Ordnernamen abgeleitet.
- Müssen kleingeschrieben und URL-sicher sein: `^[a-z0-9][a-z0-9-]*$`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (semver).
- Tags sind String-Zeiger auf eine Version; `latest` wird häufig verwendet.
