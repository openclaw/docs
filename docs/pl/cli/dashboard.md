---
read_when:
    - Chcesz otworzyć Control UI z użyciem bieżącego tokena
    - Chcesz wypisać URL bez uruchamiania przeglądarki
summary: Dokumentacja CLI dla `openclaw dashboard` (otwieranie Control UI)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T13:48:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Otwórz Control UI przy użyciu bieżącego uwierzytelnienia.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Uwagi:

- `dashboard` rozwiązuje skonfigurowane SecretRef dla `gateway.auth.token`, gdy jest to możliwe.
- Dla tokenów zarządzanych przez SecretRef (rozwiązanych lub nierozwiązanych) `dashboard` wypisuje/kopiuje/otwiera URL bez tokena, aby uniknąć ujawnienia zewnętrznych sekretów w wyjściu terminala, historii schowka lub argumentach uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale nierozwiązany w tej ścieżce polecenia, polecenie wypisuje URL bez tokena oraz wyraźne wskazówki naprawcze zamiast osadzać nieprawidłowy placeholder tokena.
