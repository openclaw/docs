---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tym samym komputerze
    - Potrzebujesz odizolowanej konfiguracji, stanu i portów dla każdego Gatewaya
summary: Uruchamianie wielu instancji Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele instancji Gateway
x-i18n:
    generated_at: "2026-07-12T15:06:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Większość konfiguracji wymaga jednego Gateway — pojedynczy Gateway obsługuje wiele połączeń komunikatorów i agentów. Oddzielne Gateway z izolowanymi profilami/portami uruchamiaj tylko wtedy, gdy potrzebujesz silniejszej izolacji lub nadmiarowości (np. bota ratunkowego).

## Szybki start z botem ratunkowym

Najprostsza konfiguracja bota ratunkowego:

- Pozostaw głównego bota w profilu domyślnym.
- Uruchom bota ratunkowego z `--profile rescue`, używając jego własnego tokenu bota Telegram.
- Ustaw dla bota ratunkowego inny port bazowy, np. `19789`.

Dzięki temu bot ratunkowy może diagnozować problemy lub wprowadzać zmiany w konfiguracji, jeśli główny bot nie działa. Zachowaj odstęp co najmniej 20 portów między portami bazowymi, aby pochodne porty przeglądarki/CDP nigdy nie powodowały konfliktów.

```bash
# Bot ratunkowy (oddzielny bot Telegram, oddzielny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli główny bot już działa, zwykle jest to wszystko, czego potrzebujesz. Jeśli proces wdrażania zainstalował już usługę ratunkową, pomiń końcowe polecenie `gateway install`.

Podczas wykonywania `openclaw --profile rescue onboard`:

- Użyj oddzielnego tokenu bota Telegram przeznaczonego dla konta ratunkowego (łatwo ograniczyć je wyłącznie do operatorów, uniezależnić od instalacji kanału/aplikacji głównego bota i zapewnić prostą ścieżkę odzyskiwania przez wiadomości prywatne).
- Zachowaj nazwę profilu `rescue`.
- Użyj portu bazowego wyższego o co najmniej 20 od portu głównego bota.
- Zaakceptuj domyślny obszar roboczy bota ratunkowego, chyba że zarządzasz już własnym.

### Co zmienia `--profile rescue onboard`

Polecenie `--profile rescue onboard` uruchamia standardowy proces wdrażania, ale zapisuje wszystko w oddzielnym profilu, dzięki czemu bot ratunkowy otrzymuje własne:

- Plik profilu/konfiguracji
- Katalog stanu
- Obszar roboczy (domyślnie: `~/.openclaw/workspace-rescue`)
- Nazwę zarządzanej usługi
- Port bazowy (oraz porty pochodne)
- Token bota Telegram

Pozostałe monity są identyczne jak w standardowym procesie wdrażania.

## Ogólna konfiguracja wielu Gateway

Ten sam wzorzec izolacji działa dla dowolnej pary lub grupy Gateway na jednym hoście — nadaj każdemu dodatkowemu Gateway własny nazwany profil i port bazowy:

```bash
# główny (profil domyślny)
openclaw setup
openclaw gateway --port 18789

# dodatkowy Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Nazwane profile po obu stronach również działają:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Usługi korzystają z tego samego wzorca:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Użyj szybkiego startu z botem ratunkowym, aby utworzyć awaryjny kanał operatorski; ogólnego wzorca profili używaj dla wielu długotrwale działających Gateway obsługujących różne kanały, dzierżawców, obszary robocze lub role operacyjne.

## Lista kontrolna izolacji

Dla każdej instancji Gateway zachowaj unikatowe wartości:

| Ustawienie                   | Przeznaczenie                                      |
| ---------------------------- | -------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Plik konfiguracji poszczególnej instancji          |
| `OPENCLAW_STATE_DIR`         | Sesje, dane uwierzytelniające i pamięci podręczne poszczególnej instancji |
| `agents.defaults.workspace`  | Katalog główny obszaru roboczego poszczególnej instancji |
| `gateway.port` (lub `--port`) | Unikatowy dla każdej instancji                    |
| Pochodne porty przeglądarki/CDP | Patrz poniżej                                   |

Współdzielenie któregokolwiek z nich powoduje wyścigi konfiguracji i konflikty portów.

## Mapowanie portów (pochodnych)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port usługi sterowania przeglądarką = port bazowy + 2 (tylko local loopback).
- Host Canvas jest udostępniany bezpośrednio przez serwer HTTP Gateway (na tym samym porcie co `gateway.port`).
- Porty CDP profili przeglądarki są automatycznie przydzielane od `port usługi sterowania przeglądarką + 9` do `+ 108`.

Jeśli nadpiszesz którąkolwiek z tych wartości w konfiguracji lub zmiennych środowiskowych, musisz zachować ich unikatowość dla każdej instancji.

## Uwagi dotyczące przeglądarki/CDP (częsta pułapka)

- **Nie** ustawiaj `browser.cdpUrl` na tę samą wartość w wielu instancjach.
- Każda instancja wymaga własnego portu sterowania przeglądarką i zakresu CDP (wyprowadzanych z jej portu Gateway).
- Aby jawnie określić porty CDP, ustaw `browser.profiles.<name>.cdpPort` osobno dla każdej instancji.
- W przypadku zdalnej przeglądarki Chrome użyj `browser.profiles.<name>.cdpUrl` (osobno dla każdego profilu i każdej instancji).

## Przykład ręcznego ustawienia zmiennych środowiskowych

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Szybkie kontrole

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` wykrywa nieaktualne usługi launchd/systemd/schtasks pochodzące ze starszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateway identities detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden izolowany Gateway lub gdy OpenClaw nie może potwierdzić, że osiągalne cele sondowania są tym samym Gateway. Tunel SSH, adres URL serwera proxy lub skonfigurowany zdalny adres URL prowadzący do tego samego Gateway oznacza jeden Gateway z wieloma metodami transportu, nawet jeśli porty transportowe są różne.

## Powiązane materiały

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
