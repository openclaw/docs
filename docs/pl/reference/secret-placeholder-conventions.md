---
read_when:
    - Pisanie dokumentacji zawierającej tokeny, klucze API lub fragmenty danych uwierzytelniających
    - Aktualizowanie przykładów, które mogą być skanowane przez narzędzia do wykrywania sekretów
summary: Konwencje symboli zastępczych bezpiecznych dla skanerów sekretów w dokumentacji i przykładach
title: Konwencje dotyczące symboli zastępczych danych poufnych
x-i18n:
    generated_at: "2026-07-12T15:38:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konwencje dotyczące symboli zastępczych sekretów

Używaj symboli zastępczych, które są czytelne dla ludzi, ale nie przypominają prawdziwych sekretów.

## Zalecany styl

- Preferuj opisowe wartości, takie jak `example-openai-key-not-real` lub `example-discord-bot-token`.
- We fragmentach skryptów powłoki preferuj `${OPENAI_API_KEY}` zamiast ciągów wpisanych bezpośrednio i przypominających tokeny.
- Zadbaj, aby przykłady były jednoznacznie fikcyjne i dopasowane do celu (dostawcy, kanału, typu uwierzytelniania).

## W dokumentacji unikaj następujących wzorców

- Dosłownego tekstu nagłówka lub stopki klucza prywatnego PEM.
- Prefiksów przypominających aktywne dane uwierzytelniające, np. `sk-...`, `xoxb-...`, `AKIA...`.
- Realistycznie wyglądających tokenów okaziciela skopiowanych z dzienników środowiska uruchomieniowego.

## Przykład

```bash
# Dobrze
export OPENAI_API_KEY="example-openai-key-not-real"

# Lepiej (gdy dokumentacja dotyczy konfiguracji zmiennych środowiskowych)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
