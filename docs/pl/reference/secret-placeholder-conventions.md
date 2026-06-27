---
read_when:
    - Pisanie dokumentacji zawierającej tokeny, klucze API lub fragmenty danych uwierzytelniających
    - Aktualizowanie przykładów, które mogą być skanowane przez narzędzia do wykrywania sekretów
summary: Konwencje symboli zastępczych bezpieczne dla skanera sekretów w dokumentacji i przykładach
title: Konwencje symboli zastępczych sekretów
x-i18n:
    generated_at: "2026-06-27T18:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konwencje symboli zastępczych sekretów

Używaj symboli zastępczych, które są czytelne dla człowieka, ale nie przypominają prawdziwych sekretów.

## Zalecany styl

- Preferuj opisowe wartości, takie jak `example-openai-key-not-real` lub `example-discord-bot-token`.
- W fragmentach powłoki preferuj `${OPENAI_API_KEY}` zamiast wbudowanych ciągów przypominających tokeny.
- Dbaj, aby przykłady były oczywiście fikcyjne i ograniczone do celu (dostawca, kanał, typ uwierzytelniania).

## Unikaj tych wzorców w dokumentacji

- Dosłownego tekstu nagłówka lub stopki prywatnego klucza PEM.
- Prefiksów przypominających aktywne dane uwierzytelniające, na przykład `sk-...`, `xoxb-...`, `AKIA...`.
- Realistycznie wyglądających tokenów bearer skopiowanych z logów środowiska uruchomieniowego.

## Przykład

```bash
# Dobrze
export OPENAI_API_KEY="example-openai-key-not-real"

# Lepiej (gdy dokument dotyczy podłączania zmiennych środowiskowych)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
