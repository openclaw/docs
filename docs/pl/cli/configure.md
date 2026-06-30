---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja CLI dla `openclaw configure` (interaktywne monity konfiguracji)
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-30T22:36:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktywny monit do wprowadzania ukierunkowanych zmian w istniejącej konfiguracji: dane uwierzytelniające, urządzenia, domyślne ustawienia agentów, Gateway, kanały, pluginy, Skills i kontrole kondycji.

Użyj `openclaw onboard` lub `openclaw setup`, aby przejść przez pełny, prowadzony proces pierwszego uruchomienia, `openclaw setup --baseline`, aby utworzyć tylko bazową konfigurację/przestrzeń roboczą, oraz `openclaw channels add`, gdy potrzebujesz wyłącznie skonfigurować konto kanału.

<Note>
Sekcja **Model** zawiera wybór wielokrotny dla listy dozwolonych `agents.defaults.models` (tego, co pojawia się w `/model` i selektorze modeli). Wybory konfiguracji ograniczone do dostawcy scalają wybrane modele z istniejącą listą dozwolonych zamiast zastępować niepowiązanych dostawców już obecnych w konfiguracji.

Ponowne uruchomienie uwierzytelniania dostawcy z poziomu konfiguracji zachowuje istniejący `agents.defaults.model.primary`, nawet gdy krok uwierzytelniania dostawcy zwraca poprawkę konfiguracji z własnym zalecanym modelem domyślnym. Oznacza to, że dodanie lub ponowne uwierzytelnienie xAI, OpenRouter albo innego dostawcy powinno udostępnić nowy model bez przejmowania roli bieżącego modelu głównego. Użyj `openclaw models auth login --provider <id> --set-default` albo `openclaw models set <model>`, gdy celowo chcesz zmienić model domyślny.
</Note>

Gdy konfiguracja rozpoczyna się od wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i listy dozwolonych automatycznie preferują tego dostawcę. W przypadku sparowanych dostawców, takich jak Volcengine i BytePlus, ta sama preferencja dopasowuje także ich warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy wygenerowałby pustą listę, konfiguracja wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor.

<Tip>
`openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj `openclaw config get|set|unset` do nieinteraktywnych edycji.
</Tip>

W przypadku wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego dane uwierzytelniające. Niektórzy dostawcy pokazują też specyficzne dla dostawcy
monity uzupełniające:

- **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym profilem OAuth xAI
  albo kluczem API i pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region Moonshot API (`api.moonshot.ai` kontra
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Dokumentacja konfiguracji Gateway: [Konfiguracja](/pl/gateway/configuration)
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

- Pełny kreator i sekcje związane z Gateway pytają, gdzie działa Gateway, i aktualizują `gateway.mode`. Filtry sekcji, które nie obejmują `gateway`, `daemon` ani `health`, przechodzą bezpośrednio do żądanej konfiguracji.
- Po zapisach lokalnej konfiguracji configure instaluje wybrane pluginy do pobrania, gdy wymaga ich wybrana ścieżka konfiguracji. Zdalna konfiguracja Gateway nie instaluje lokalnych pakietów pluginów.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji proszą o listy dozwolonych kanałów/pokoi. Możesz wprowadzić nazwy lub identyfikatory; kreator rozwiązuje nazwy do identyfikatorów, gdy jest to możliwe.
- Jeśli uruchomisz krok instalacji demona, uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, configure waliduje SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w postaci zwykłego tekstu do metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie został rozwiązany, configure blokuje instalację demona z praktycznymi wskazówkami naprawczymi.
- Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, configure blokuje instalację demona do czasu jawnego ustawienia trybu.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
