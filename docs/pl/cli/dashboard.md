---
read_when:
    - Chcesz otworzyć Control UI z bieżącym tokenem
    - Chcesz wypisać adres URL bez uruchamiania przeglądarki
summary: Dokumentacja referencyjna CLI dla `openclaw dashboard` (otwórz Control UI)
title: Panel
x-i18n:
    generated_at: "2026-05-05T01:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Otwórz Control UI przy użyciu bieżącego uwierzytelnienia.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Uwagi:

- `dashboard` rozwiązuje skonfigurowane SecretRefs `gateway.auth.token`, gdy to możliwe.
- `dashboard` respektuje `gateway.tls.enabled`: Gateway z włączonym TLS wypisuje/otwiera
  adresy URL Control UI z `https://` i łączy się przez `wss://`.
- Jeśli dostarczenie adresu URL pulpitu uwierzytelnionego tokenem przez schowek/przeglądarkę się nie powiedzie,
  `dashboard` rejestruje bezpieczną wskazówkę dotyczącą ręcznego uwierzytelnienia, wskazującą `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` oraz klucz fragmentu `token`, bez wypisywania wartości
  tokenu.
- W przypadku tokenów zarządzanych przez SecretRef (rozwiązanych lub nierozwiązanych) `dashboard` wypisuje/kopiuje/otwiera adres URL bez tokenu, aby uniknąć ujawniania zewnętrznych sekretów w danych wyjściowych terminala, historii schowka lub argumentach uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale nie został rozwiązany w tej ścieżce polecenia, polecenie wypisuje adres URL bez tokenu oraz wyraźne wskazówki naprawcze zamiast osadzać nieprawidłowy symbol zastępczy tokenu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Dashboard](/pl/web/dashboard)
