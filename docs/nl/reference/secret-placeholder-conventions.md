---
read_when:
    - Documentatie schrijven die tokens, API-sleutels of fragmenten met inloggegevens bevat
    - Voorbeelden bijwerken die mogelijk worden gescand door tooling voor geheimdetectie
summary: Conventies voor secret-scanner-veilige placeholders voor docs en voorbeelden
title: Conventies voor geheime placeholders
x-i18n:
    generated_at: "2026-06-27T18:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Conventies voor tijdelijke aanduidingen voor geheimen

Gebruik tijdelijke aanduidingen die menselijk leesbaar zijn, maar niet lijken op echte geheimen.

## Aanbevolen stijl

- Geef de voorkeur aan beschrijvende waarden zoals `example-openai-key-not-real` of `example-discord-bot-token`.
- Geef voor shellfragmenten de voorkeur aan `${OPENAI_API_KEY}` boven inline tekenreeksen die op tokens lijken.
- Houd voorbeelden duidelijk nep en beperkt tot hun doel (provider, kanaal, auth-type).

## Vermijd deze patronen in docs

- Letterlijke header- of footertekst van een PEM-privésleutel.
- Voorvoegsels die lijken op live-inloggegevens, bijvoorbeeld `sk-...`, `xoxb-...`, `AKIA...`.
- Bearer-tokens met een realistische uitstraling die uit runtimelogboeken zijn gekopieerd.

## Voorbeeld

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
