---
read_when:
    - Dokumentation verfassen, die Tokens, API-Schlüssel oder Anmeldedaten-Snippets enthält
    - Beispiele aktualisieren, die möglicherweise von Tools zur Geheimniserkennung gescannt werden
summary: Konventionen für Secret-Scanner-sichere Platzhalter in Dokumentation und Beispielen
title: Konventionen für Geheimnis-Platzhalter
x-i18n:
    generated_at: "2026-07-24T04:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konventionen für Secret-Platzhalter

Verwenden Sie Platzhalter, die für Menschen lesbar sind, aber keinen echten Secrets ähneln.

## Empfohlener Stil

- Bevorzugen Sie aussagekräftige Werte wie `example-openai-key-not-real` oder `example-discord-bot-token`.
- Bevorzugen Sie für Shell-Codeausschnitte `${OPENAI_API_KEY}` gegenüber eingebetteten tokenähnlichen Zeichenfolgen.
- Gestalten Sie Beispiele eindeutig als unecht und auf ihren Zweck beschränkt (Provider, Kanal, Authentifizierungstyp).

## Diese Muster in der Dokumentation vermeiden

- Wörtlicher Kopf- oder Fußzeilentext eines privaten PEM-Schlüssels.
- Präfixe, die echten Anmeldedaten ähneln, z. B. `sk-...`, `xoxb-...`, `AKIA...`.
- Realistisch aussehende Bearer-Token, die aus Laufzeitprotokollen kopiert wurden.

## Beispiel

```bash
# Gut
export OPENAI_API_KEY="example-openai-key-not-real"

# Besser (wenn es in der Dokumentation um die Einbindung von Umgebungsvariablen geht)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
