---
read_when:
    - Documentatie schrijven die tokens, API-sleutels of fragmenten met inloggegevens bevat
    - Voorbeelden bijwerken die mogelijk door tools voor geheimdetectie worden gescand
summary: Conventies voor placeholders die veilig zijn voor secretscanners in documentatie en voorbeelden
title: Conventies voor tijdelijke aanduidingen van geheimen
x-i18n:
    generated_at: "2026-07-12T09:22:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Conventies voor tijdelijke aanduidingen van geheimen

Gebruik tijdelijke aanduidingen die leesbaar zijn voor mensen, maar niet op echte geheimen lijken.

## Aanbevolen stijl

- Geef de voorkeur aan beschrijvende waarden zoals `example-openai-key-not-real` of `example-discord-bot-token`.
- Geef voor shell-fragmenten de voorkeur aan `${OPENAI_API_KEY}` boven tekenreeksen in de tekst die op tokens lijken.
- Zorg dat voorbeelden duidelijk fictief zijn en beperkt blijven tot hun doel (provider, kanaal, authenticatietype).

## Vermijd deze patronen in documentatie

- Letterlijke kop- of voettekst van een persoonlijke PEM-sleutel.
- Voorvoegsels die op actieve inloggegevens lijken, bijvoorbeeld `sk-...`, `xoxb-...`, `AKIA...`.
- Realistisch ogende bearer-tokens die uit runtimelogboeken zijn gekopieerd.

## Voorbeeld

```bash
# Goed
export OPENAI_API_KEY="example-openai-key-not-real"

# Beter (wanneer het document over de koppeling van omgevingsvariabelen gaat)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
