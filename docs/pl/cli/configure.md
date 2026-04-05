---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja CLI dla `openclaw configure` (interaktywne podpowiedzi konfiguracji)
title: configure
x-i18n:
    generated_at: "2026-04-05T13:48:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktywny kreator do konfigurowania poświadczeń, urządzeń i domyślnych ustawień agenta.

Uwaga: Sekcja **Model** zawiera teraz wybór wielokrotny dla allowlisty
`agents.defaults.models` (co jest widoczne w `/model` i w selektorze modeli).

Gdy konfiguracja zaczyna się od wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i
allowlisty automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich
jak Volcengine/BytePlus, ta sama preferencja dopasowuje także ich warianty
planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy
dałby pustą listę, konfiguracja wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor.

Wskazówka: `openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj
`openclaw config get|set|unset` do nieinteraktywnych edycji.

W przypadku wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego poświadczenia. Niektórzy dostawcy pokazują także dodatkowe
podpowiedzi specyficzne dla dostawcy:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z użyciem tego samego `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Referencja konfiguracji Gateway: [Konfiguracja](/gateway/configuration)
- CLI config: [Config](/cli/config)

## Opcje

- `--section <section>`: powtarzalny filtr sekcji

Dostępne sekcje:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Uwagi:

- Wybór miejsca uruchomienia Gateway zawsze aktualizuje `gateway.mode`. Możesz wybrać „Kontynuuj” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji proszą o allowlisty kanałów/pokoi. Możesz wprowadzać nazwy lub identyfikatory; kreator rozwiązuje nazwy do identyfikatorów, gdy to możliwe.
- Jeśli uruchamiasz krok instalacji daemona, uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, konfiguracja waliduje SecretRef, ale nie zapisuje rozwiązanych jawnych wartości tokena w metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, konfiguracja blokuje instalację daemona i pokazuje konkretne wskazówki naprawcze.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, konfiguracja blokuje instalację daemona, dopóki tryb nie zostanie ustawiony jawnie.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
