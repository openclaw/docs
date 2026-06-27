---
read_when:
    - Dokumentation schreiben, die Token, API-Schlüssel oder Anmeldedaten-Snippets enthält
    - Beispiele aktualisieren, die möglicherweise von Tools zur Secret-Erkennung gescannt werden
summary: Konventionen für Secret-Scanner-sichere Platzhalter in Dokumentation und Beispielen
title: Konventionen für Geheimnis-Platzhalter
x-i18n:
    generated_at: "2026-06-27T18:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konventionen für Secret-Platzhalter

Verwenden Sie Platzhalter, die für Menschen lesbar sind, aber echten Secrets nicht ähneln.

## Empfohlener Stil

- Bevorzugen Sie beschreibende Werte wie `example-openai-key-not-real` oder `example-discord-bot-token`.
- Für Shell-Beispiele bevorzugen Sie `${OPENAI_API_KEY}` gegenüber inline tokenähnlichen Zeichenfolgen.
- Halten Sie Beispiele offensichtlich unecht und auf den Zweck begrenzt (Provider, Kanal, Auth-Typ).

## Vermeiden Sie diese Muster in der Dokumentation

- Wörtliche PEM-Header- oder Footer-Texte privater Schlüssel.
- Präfixe, die Live-Zugangsdaten ähneln, zum Beispiel `sk-...`, `xoxb-...`, `AKIA...`.
- Realistisch aussehende Bearer-Token, die aus Laufzeitprotokollen kopiert wurden.

## Beispiel

```bash
# Gut
export OPENAI_API_KEY="example-openai-key-not-real"

# Besser (wenn es in der Dokumentation um Env-Verdrahtung geht)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
