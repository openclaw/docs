---
read_when:
    - Chcesz interaktywnie dostosować dane uwierzytelniające, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja CLI dla `openclaw configure` (interaktywne monity konfiguracji)
title: Konfiguruj
x-i18n:
    generated_at: "2026-07-12T14:59:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktywne monity umożliwiające wprowadzanie ukierunkowanych zmian w istniejącej konfiguracji: danych uwierzytelniających, urządzeń, ustawień domyślnych agenta, Gateway, kanałów, pluginów, Skills oraz kontroli kondycji.

Użyj `openclaw onboard` lub `openclaw setup`, aby przejść przez pełny proces pierwszego uruchomienia z przewodnikiem, `openclaw setup --baseline`, aby utworzyć tylko bazową konfigurację i obszar roboczy, albo `openclaw channels add`, jeśli potrzebujesz jedynie skonfigurować konto kanału.

<Tip>
Polecenie `openclaw config` bez podpolecenia otwiera ten sam kreator. Do nieinteraktywnej edycji użyj `openclaw config get|set|unset`.
</Tip>

## Opcje

`--section <section>`: powtarzalny filtr sekcji. Dostępne sekcje:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Wybranie `gateway`, `daemon` lub `health` (albo uruchomienie pełnego kreatora bez `--section`) powoduje wyświetlenie pytania o miejsce działania Gateway i aktualizację `gateway.mode`. Filtry sekcji pomijające wszystkie te trzy pozycje przechodzą bezpośrednio do żądanej konfiguracji bez pytania o tryb Gateway. Wybranie zdalnego trybu Gateway zapisuje zdalną konfigurację i natychmiast kończy działanie; nie wykonuje kroków przeznaczonych wyłącznie dla środowiska lokalnego, takich jak instalowanie pluginów.

<Note>
`openclaw configure` wymaga interaktywnego terminala (zarówno stdin, jak i stdout muszą być terminalami TTY). Bez niego polecenie wyświetla równoważne nieinteraktywne polecenia `openclaw config get|set|patch|validate` i kończy działanie z błędem zamiast wykonywać proces częściowo.
</Note>

## Sekcja modelu

<Note>
Sekcja **Model** zawiera możliwość wielokrotnego wyboru listy dozwolonych modeli `agents.defaults.models` (określającej, co pojawia się w `/model` i selektorze modeli). Opcje konfiguracji dotyczące konkretnego dostawcy scalają wybrane modele z istniejącą listą dozwolonych zamiast zastępować niespokrewnionych dostawców już obecnych w konfiguracji.

Ponowne uruchomienie uwierzytelniania dostawcy z poziomu konfiguratora zachowuje istniejące ustawienie `agents.defaults.model.primary`, nawet jeśli etap uwierzytelniania dostawcy zwraca poprawkę konfiguracji z własnym zalecanym modelem domyślnym. Dodanie dostawcy lub ponowne uwierzytelnienie udostępnia jego modele bez przejmowania roli bieżącego modelu głównego. Aby celowo zmienić model domyślny, użyj `openclaw models auth login --provider <id> --set-default` lub `openclaw models set <model>`.
</Note>

Gdy konfigurator rozpoczyna działanie od wyboru uwierzytelniania dostawcy, selektory modelu domyślnego i listy dozwolonych automatycznie preferują tego dostawcę. W przypadku powiązanych dostawców, takich jak Volcengine i BytePlus, ta sama preferencja obejmuje również warianty ich planów programistycznych (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr preferowanego dostawcy zwróciłby pustą listę, konfigurator używa niefiltrowanego katalogu zamiast wyświetlać pusty selektor.

## Sekcja internetowa

Polecenie `openclaw configure --section web` umożliwia wybranie dostawcy wyszukiwania internetowego i skonfigurowanie jego danych uwierzytelniających. Niektórzy dostawcy wyświetlają dodatkowe pytania zależne od dostawcy:

- **Grok** może zaproponować opcjonalną konfigurację `x_search` przy użyciu tego samego profilu OAuth xAI lub klucza API oraz umożliwić wybór modelu `x_search`.
- **Kimi** może poprosić o wybór regionu API Moonshot (`api.moonshot.ai` lub `api.moonshot.cn`) oraz domyślnego modelu Kimi do wyszukiwania internetowego.

## Inne uwagi

- Po zapisaniu lokalnej konfiguracji konfigurator instaluje wybrane pluginy dostępne do pobrania, jeśli wymaga tego wybrana ścieżka konfiguracji. Konfiguracja zdalnego Gateway nie instaluje lokalnych pakietów pluginów.
- Usługi oparte na kanałach (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji proszą o listy dozwolonych kanałów lub pomieszczeń. Możesz wprowadzać nazwy lub identyfikatory; kreator w miarę możliwości przekształca nazwy na identyfikatory.
- Jeśli uruchomisz etap instalacji demona, uwierzytelnianie tokenem wymaga tokenu. Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, konfigurator weryfikuje SecretRef, ale nie zapisuje rozpoznanych wartości tokenów w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy; jeśli SecretRef nie może zostać rozpoznany, konfigurator blokuje instalację demona i wyświetla praktyczne wskazówki dotyczące rozwiązania problemu.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, konfigurator blokuje instalację demona do czasu jawnego ustawienia trybu.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
- CLI konfiguracji: [Konfiguracja](/pl/cli/config)
