---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja referencyjna CLI dla `openclaw configure` (interaktywne monity konfiguracji)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-01T09:56:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktywny kreator do konfigurowania danych uwierzytelniających, urządzeń i domyślnych ustawień agentów.

<Note>
Sekcja **Model** zawiera wybór wielokrotny dla listy dozwolonych `agents.defaults.models` (tego, co pojawia się w `/model` i selektorze modeli). Opcje konfiguracji ograniczone do dostawcy scalają wybrane modele z istniejącą listą dozwolonych zamiast zastępować niepowiązanych dostawców obecnych już w konfiguracji. Ponowne uruchomienie uwierzytelniania dostawcy z poziomu konfiguracji zachowuje istniejące `agents.defaults.model.primary`. Użyj `openclaw models auth login --provider <id> --set-default` albo `openclaw models set <model>`, gdy celowo chcesz zmienić model domyślny.
</Note>

Gdy konfiguracja zaczyna się od opcji uwierzytelniania dostawcy, selektory modelu domyślnego i listy dozwolonych automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich jak Volcengine i BytePlus, ta sama preferencja obejmuje także ich warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy dałby pustą listę, konfiguracja wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor.

<Tip>
`openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj `openclaw config get|set|unset` do nieinteraktywnych edycji.
</Tip>

W przypadku wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego dane uwierzytelniające. Niektórzy dostawcy pokazują też właściwe dla dostawcy
kolejne monity:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może poprosić o region Moonshot API (`api.moonshot.ai` albo
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Odniesienie do konfiguracji Gateway: [Konfiguracja](/pl/gateway/configuration)
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

- Wybranie miejsca, w którym działa Gateway, zawsze aktualizuje `gateway.mode`. Możesz wybrać „Kontynuuj” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Po zapisach lokalnej konfiguracji konfigurator materializuje nowo wymagane zależności środowiska uruchomieniowego dołączonych Plugin. To wąski krok naprawczy menedżera pakietów, a nie pełne uruchomienie `openclaw doctor`. Konfiguracja zdalnego Gateway nie instaluje lokalnych zależności Plugin.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) proszą podczas konfiguracji o listy dozwolonych kanałów/pokoi. Możesz podać nazwy albo identyfikatory; kreator rozwiązuje nazwy na identyfikatory, gdy to możliwe.
- Jeśli uruchomisz krok instalacji demona, uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, konfigurator weryfikuje SecretRef, ale nie utrwala rozwiązanych wartości tokenu w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu nie jest rozwiązany, konfigurator blokuje instalację demona z praktycznymi wskazówkami naprawczymi.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, konfigurator blokuje instalację demona do czasu jawnego ustawienia trybu.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
