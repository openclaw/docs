---
read_when:
    - Seelen veröffentlichen
    - Fehlerbehebung bei soul publish-Fehlern
summary: Soul-Bundle-Format, erforderliche Dateien, Beschränkungen.
x-i18n:
    generated_at: "2026-05-13T04:18:30Z"
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
- `description` wird als Zusammenfassung der Soul in der UI/Suche verwendet.

## Grenzwerte

- Gesamtgröße des Bundles: 50 MB.
- Einbettungstext enthält nur `SOUL.md`.

## URL-Namenssegmente

- Standardmäßig vom Ordnernamen abgeleitet.
- Muss kleingeschrieben und URL-sicher sein: `^[a-z0-9][a-z0-9-]*$`.

## Versionierung + Tags

- Jede Veröffentlichung erstellt eine neue Version (SemVer).
- Tags sind Zeichenketten-Zeiger auf eine Version; `latest` wird häufig verwendet.
