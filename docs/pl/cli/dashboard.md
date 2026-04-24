---
read_when:
    - Chcesz otworzyć interfejs Control przy użyciu bieżącego tokenu
    - Chcesz wypisać URL bez uruchamiania przeglądarki
summary: Dokumentacja CLI dla `openclaw dashboard` (otwórz interfejs Control)
title: Panel kontrolny
x-i18n:
    generated_at: "2026-04-24T09:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Otwórz interfejs Control przy użyciu bieżącego uwierzytelniania.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Uwagi:

- `dashboard` rozstrzyga skonfigurowane SecretRef-y `gateway.auth.token`, gdy to możliwe.
- Dla tokenów zarządzanych przez SecretRef (rozstrzygniętych lub nierozstrzygniętych) `dashboard` wypisuje/kopiuje/otwiera URL bez tokenu, aby uniknąć ujawniania zewnętrznych sekretów w danych wyjściowych terminala, historii schowka lub argumentach uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale nierozstrzygnięty w tej ścieżce polecenia, polecenie wypisuje URL bez tokenu oraz jawne wskazówki naprawcze zamiast osadzać nieprawidłowy placeholder tokenu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Panel kontrolny](/pl/web/dashboard)
