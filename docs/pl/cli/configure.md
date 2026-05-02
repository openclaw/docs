---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja referencyjna CLI dla `openclaw configure` (interaktywne monity konfiguracyjne)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-02T09:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktywny monit do skonfigurowania poświadczeń, urządzeń i domyślnych ustawień agenta.

<Note>
Sekcja **Model** zawiera wybór wielokrotny dla listy dozwolonych `agents.defaults.models` (tego, co pojawia się w `/model` i selektorze modeli). Wybory konfiguracji ograniczone do dostawcy scalają wybrane modele z istniejącą listą dozwolonych, zamiast zastępować niepowiązanych dostawców, którzy są już w konfiguracji.

Ponowne uruchomienie uwierzytelniania dostawcy z poziomu konfiguracji zachowuje istniejące `agents.defaults.model.primary`, nawet gdy krok uwierzytelniania dostawcy zwraca poprawkę konfiguracji z własnym zalecanym modelem domyślnym. Oznacza to, że dodanie lub ponowne uwierzytelnienie xAI, OpenRouter albo innego dostawcy powinno udostępnić nowy model bez przejmowania roli bieżącego modelu głównego. Użyj `openclaw models auth login --provider <id> --set-default` albo `openclaw models set <model>`, gdy celowo chcesz zmienić model domyślny.
</Note>

Gdy konfiguracja rozpoczyna się od wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i listy dozwolonych automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich jak Volcengine i BytePlus, ta sama preferencja obejmuje też ich warianty planów kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy zwróciłby pustą listę, konfiguracja wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor.

<Tip>
`openclaw config` bez podkomendy otwiera ten sam kreator. Użyj `openclaw config get|set|unset` do nieinteraktywnych edycji.
</Tip>

W przypadku wyszukiwania w internecie `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego poświadczenia. Niektórzy dostawcy pokazują też właściwe dla nich
dodatkowe monity:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) oraz domyślny model wyszukiwania internetowego Kimi.

Powiązane:

- Odniesienie konfiguracji Gateway: [Konfiguracja](/pl/gateway/configuration)
- CLI konfiguracji: [Konfiguracja](/pl/cli/config)

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

- Wybór miejsca, w którym działa Gateway, zawsze aktualizuje `gateway.mode`. Możesz wybrać „Kontynuuj” bez innych sekcji, jeśli tylko tego potrzebujesz.
- Po lokalnych zapisach konfiguracji kreator instaluje wybrane Pluginy do pobrania, gdy wymaga ich wybrana ścieżka konfiguracji. Zdalna konfiguracja Gateway nie instaluje lokalnych pakietów Pluginów.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) proszą podczas konfiguracji o listy dozwolonych kanałów/pokoi. Możesz wprowadzić nazwy lub identyfikatory; kreator rozwiązuje nazwy na identyfikatory, gdy to możliwe.
- Jeśli uruchomisz krok instalacji demona, uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, konfiguracja weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokena w postaci zwykłego tekstu do metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie został rozwiązany, konfiguracja blokuje instalację demona i podaje wskazówki naprawcze możliwe do wykonania.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, konfiguracja blokuje instalację demona do czasu jawnego ustawienia trybu.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Powiązane

- [Odniesienie CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
