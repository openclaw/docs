---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub ustawienia domyślne agenta
summary: Dokumentacja referencyjna CLI dla `openclaw configure` (interaktywne monity konfiguracji)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-30T09:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktywny monit do konfigurowania poświadczeń, urządzeń i domyślnych ustawień agenta.

<Note>
Sekcja **Model** zawiera wielokrotny wybór dla listy dozwolonych `agents.defaults.models` (tego, co pojawia się w `/model` i selektorze modelu). Opcje konfiguracji ograniczone do dostawcy scalają wybrane modele z istniejącą listą dozwolonych zamiast zastępować niepowiązanych dostawców już obecnych w konfiguracji. Ponowne uruchomienie uwierzytelniania dostawcy z konfiguracji zachowuje istniejące `agents.defaults.model.primary`. Użyj `openclaw models auth login --provider <id> --set-default` lub `openclaw models set <model>`, gdy celowo chcesz zmienić model domyślny.
</Note>

Gdy konfiguracja rozpoczyna się od wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i listy dozwolonych automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich jak Volcengine i BytePlus, ta sama preferencja pasuje także do ich wariantów planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy utworzyłby pustą listę, konfiguracja wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor.

<Tip>
`openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj `openclaw config get|set|unset` do nieinteraktywnych edycji.
</Tip>

Dla wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego poświadczenia. Niektórzy dostawcy pokazują też specyficzne
dla dostawcy monity uzupełniające:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może poprosić o region API Moonshot (`api.moonshot.ai` kontra
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

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

- Wybór miejsca uruchamiania Gateway zawsze aktualizuje `gateway.mode`. Możesz wybrać „Kontynuuj” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji proszą o listy dozwolonych kanałów/pokojów. Możesz wprowadzić nazwy lub identyfikatory; kreator rozwiązuje nazwy na identyfikatory, gdy to możliwe.
- Jeśli uruchomisz krok instalacji demona, uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, konfiguracja weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokenów w postaci zwykłego tekstu w metadanych środowiska usługi supervisor.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, konfiguracja blokuje instalację demona z praktycznymi wskazówkami naprawczymi.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, konfiguracja blokuje instalację demona do czasu jawnego ustawienia trybu.

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
