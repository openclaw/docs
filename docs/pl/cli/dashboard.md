---
read_when:
    - Chcesz otworzyć interfejs sterowania przy użyciu bieżącego tokenu
    - Chcesz wyświetlić adres URL bez uruchamiania przeglądarki
summary: Dokumentacja CLI dla `openclaw dashboard` (otwieranie interfejsu sterowania)
title: Panel sterowania
x-i18n:
    generated_at: "2026-07-12T14:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Otwórz interfejs Control UI, używając bieżącego uwierzytelnienia.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: wyświetl adres URL, ale nie uruchamiaj przeglądarki.
- `--yes`: w razie potrzeby uruchom/zainstaluj Gateway bez wyświetlania monitu.

Uwagi:

- W miarę możliwości rozwiązuje skonfigurowane odwołania SecretRef w `gateway.auth.token`.
- Uwzględnia ustawienie `gateway.tls.enabled`: Gatewaye z włączonym TLS wyświetlają/otwierają adresy URL interfejsu Control UI z prefiksem `https://` i łączą się przez `wss://`.
- W przypadku powiązania `lan` lub `custom` z symbolem wieloznacznym uruchomienia na tym samym hoście zawsze używają adresu pętli zwrotnej, ponieważ symbol wieloznaczny nie jest adresem docelowym przeglądarki. Nieszyfrowane powiązania `tailnet` i `custom` również używają `127.0.0.1`, aby przeglądarka miała bezpieczny kontekst; konkretne hosty z włączonym TLS zachowują skonfigurowany adres, aby nazwy certyfikatów były zgodne.
- Przed przekazaniem uwierzytelnionego adresu URL pętli zwrotnej dla powiązania z konkretnym interfejsem polecenie sprawdza skonfigurowany interfejs i weryfikuje, czy on oraz `127.0.0.1` należą do tego samego procesu Gateway. W przypadku niejednoznacznej własności procesu nasłuchującego operacja kończy się bezpiecznie niepowodzeniem i wyświetla wskazówki dotyczące stanu.
- W przypadku tokenów zarządzanych przez SecretRef (rozwiązanych lub nierozwiązanych) wyświetlany, kopiowany lub otwierany adres URL nigdy nie zawiera tokenu, dzięki czemu zewnętrzne sekrety nie trafiają do danych wyjściowych terminala, historii schowka ani argumentów uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale pozostaje nierozwiązany, polecenie zamiast nieprawidłowego symbolu zastępczego tokenu wyświetla adres URL bez tokenu oraz wskazówki dotyczące rozwiązania problemu.
- Jeśli przekazanie do schowka/przeglądarki nie powiedzie się dla adresu URL uwierzytelnianego tokenem, polecenie zapisuje bezpieczną wskazówkę dotyczącą ręcznego uwierzytelnienia, wymieniającą `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` oraz klucz fragmentu adresu URL `token`, bez wyświetlania wartości tokenu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Panel sterowania](/pl/web/dashboard)
