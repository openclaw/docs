---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub ustawienia domyślne agentów
summary: Odwołanie CLI dla `openclaw configure` (interaktywne monity konfiguracji)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-24T09:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktywny monit do konfigurowania poświadczeń, urządzeń i ustawień domyślnych agentów.

Uwaga: Sekcja **Model** zawiera teraz wybór wielokrotny dla listy dozwolonych
`agents.defaults.models` (co pojawia się w `/model` i selektorze modeli).
Wybory konfiguracji ograniczone do dostawcy scalają wybrane modele z istniejącą
listą dozwolonych zamiast zastępować niezwiązanych dostawców już obecnych w konfiguracji.

Gdy configure uruchamia się z wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i
listy dozwolonych automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich
jak Volcengine/BytePlus, ta sama preferencja pasuje również do ich wariantów
planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr
preferowanego dostawcy zwróciłby pustą listę, configure wraca do nieprzefiltrowanego
katalogu zamiast wyświetlać pusty selektor.

Wskazówka: `openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj
`openclaw config get|set|unset` do nieinteraktywnych edycji.

W przypadku wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego poświadczenia. Niektórzy dostawcy pokazują także kolejne monity
specyficzne dla dostawcy:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Odwołanie do konfiguracji Gateway: [Configuration](/pl/gateway/configuration)
- CLI config: [Config](/pl/cli/config)

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

- Wybór miejsca działania Gateway zawsze aktualizuje `gateway.mode`. Możesz wybrać „Continue” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji proszą o listy dozwolonych kanałów/pokoi. Możesz podawać nazwy lub identyfikatory; kreator, jeśli to możliwe, rozwiązuje nazwy do identyfikatorów.
- Jeśli uruchamiasz krok instalacji daemona, uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, configure waliduje SecretRef, ale nie utrwala rozstrzygniętych tokenów w postaci jawnego tekstu w metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozstrzygnięty, configure blokuje instalację daemona i podaje praktyczne wskazówki naprawy.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, configure blokuje instalację daemona do czasu jawnego ustawienia trybu.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Configuration](/pl/gateway/configuration)
