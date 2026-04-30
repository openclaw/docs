---
read_when:
    - Weryfikowanie pokrycia poświadczeń SecretRef
    - Audytowanie, czy poświadczenie kwalifikuje się do `secrets configure` lub `secrets apply`
    - Weryfikowanie, dlaczego poświadczenie znajduje się poza obsługiwanym zakresem
summary: Kanoniczny zakres obsługiwanych i nieobsługiwanych poświadczeń SecretRef
title: Interfejs poświadczeń SecretRef
x-i18n:
    generated_at: "2026-04-30T10:17:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ta strona definiuje kanoniczną powierzchnię poświadczeń SecretRef.

Zakres:

- W zakresie: wyłącznie poświadczenia dostarczone przez użytkownika, których OpenClaw nie tworzy ani nie rotuje.
- Poza zakresem: poświadczenia tworzone lub rotowane w czasie działania, materiały odświeżania OAuth oraz artefakty podobne do sesji.

## Obsługiwane poświadczenia

### Cele `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)
