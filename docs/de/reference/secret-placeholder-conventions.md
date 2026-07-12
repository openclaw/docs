---
read_when:
    - Dokumentation verfassen, die Tokens, API-Schlüssel oder Auszüge aus Anmeldedaten enthält
    - Aktualisieren von Beispielen, die möglicherweise von Werkzeugen zur Geheimniserkennung gescannt werden
summary: Konventionen für Secret-Scanner-sichere Platzhalter in Dokumentation und Beispielen
title: Konventionen für Geheimnisplatzhalter
x-i18n:
    generated_at: "2026-07-12T02:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konventionen für Secret-Platzhalter

Verwenden Sie Platzhalter, die für Menschen lesbar sind, aber nicht wie echte Secrets aussehen.

## Empfohlener Stil

- Bevorzugen Sie aussagekräftige Werte wie `example-openai-key-not-real` oder `example-discord-bot-token`.
- Bevorzugen Sie in Shell-Codeausschnitten `${OPENAI_API_KEY}` gegenüber direkt eingefügten tokenähnlichen Zeichenfolgen.
- Gestalten Sie Beispiele eindeutig als Fälschungen und stimmen Sie sie auf den jeweiligen Zweck ab (Provider, Kanal, Authentifizierungstyp).

## Vermeiden Sie diese Muster in der Dokumentation

- Wörtliche Kopf- oder Fußzeilentexte privater PEM-Schlüssel.
- Präfixe, die echten Zugangsdaten ähneln, z. B. `sk-...`, `xoxb-...`, `AKIA...`.
- Realistisch aussehende Bearer-Tokens, die aus Laufzeitprotokollen kopiert wurden.

## Beispiel

```bash
# Gut
export OPENAI_API_KEY="example-openai-key-not-real"

# Besser (wenn es in der Dokumentation um die Einbindung von Umgebungsvariablen geht)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
