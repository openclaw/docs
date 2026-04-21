---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tej samej maszynie
    - Potrzebujesz odizolowanej konfiguracji/stanu/portów dla każdego Gateway
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele Gatewayów
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Wiele Gatewayów (ten sam host)

W większości konfiguracji należy używać jednego Gateway, ponieważ pojedynczy Gateway może obsługiwać wiele połączeń komunikatorów i agentów. Jeśli potrzebujesz silniejszej izolacji lub nadmiarowości (np. rescue bot), uruchom osobne Gatewaye z odizolowanymi profilami/portami.

## Lista kontrolna izolacji (wymagana)

- `OPENCLAW_CONFIG_PATH` — plik konfiguracyjny dla każdej instancji
- `OPENCLAW_STATE_DIR` — sesje, poświadczenia i cache dla każdej instancji
- `agents.defaults.workspace` — główny katalog workspace dla każdej instancji
- `gateway.port` (lub `--port`) — unikalny dla każdej instancji
- Porty pochodne (browser/canvas) nie mogą się nakładać

Jeśli te elementy są współdzielone, wystąpią wyścigi konfiguracji i konflikty portów.

## Zalecane: użyj domyślnego profilu dla głównego Gateway, nazwanego profilu dla rescue

Profile automatycznie ograniczają `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` do swojego zakresu i dodają sufiksy do nazw usług. Dla większości konfiguracji rescue bota pozostaw głównego bota na profilu domyślnym, a tylko rescue botowi przypisz nazwany profil, taki jak `rescue`.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Usługi:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Jeśli chcesz, aby oba Gatewaye używały nazwanych profili, to również działa, ale nie jest to wymagane.

## Przewodnik po rescue bocie

Zalecana konfiguracja:

- pozostaw głównego bota na profilu domyślnym
- uruchom rescue bota na `--profile rescue`
- użyj całkowicie oddzielnego bota Telegram dla konta rescue
- pozostaw rescue bota na innym porcie bazowym, takim jak `19001`

Dzięki temu rescue bot pozostaje odizolowany od głównego bota, dzięki czemu może diagnozować problemy lub stosować zmiany konfiguracji, jeśli główny bot nie działa. Pozostaw co najmniej 20 portów odstępu między portami bazowymi, aby pochodne porty browser/canvas/CDP nigdy się nie zderzyły.

### Zalecany kanał/konto rescue

W większości konfiguracji użyj całkowicie oddzielnego bota Telegram dla profilu rescue.

Dlaczego Telegram:

- łatwo ograniczyć go wyłącznie do operatora
- oddzielny token bota i tożsamość
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na wiadomościach DM, gdy główny bot jest uszkodzony

Najważniejsza jest pełna niezależność: oddzielne konto bota, oddzielne poświadczenia, oddzielny profil OpenClaw, oddzielny workspace i oddzielny port.

### Zalecany przebieg instalacji

Użyj tego jako domyślnej konfiguracji, chyba że masz ważny powód, aby zrobić inaczej:

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Podczas `openclaw --profile rescue onboard`:

- użyj oddzielnego tokena bota Telegram
- zachowaj profil `rescue`
- użyj portu bazowego co najmniej o 20 wyższego niż dla głównego bota
- zaakceptuj domyślny workspace rescue, chyba że już zarządzasz własnym

Jeśli onboarding już zainstalował za Ciebie usługę rescue, końcowe `gateway install` nie jest potrzebne.

### Co zmienia onboarding

`openclaw --profile rescue onboard` używa normalnego przepływu onboardingu, ale zapisuje wszystko do oddzielnego profilu.

W praktyce oznacza to, że rescue bot otrzymuje własne:

- plik konfiguracyjny
- katalog stanu
- workspace (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym prompty są takie same jak przy normalnym onboardingu.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = bazowy + 2 (tylko loopback)
- host canvas jest udostępniany przez serwer HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profilu przeglądarki są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpisujesz którykolwiek z nich w konfiguracji lub zmiennych środowiskowych, musisz zachować ich unikalność dla każdej instancji.

## Uwagi o browser/CDP (częsty problem)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i własnego zakresu CDP (pochodnego od swojego portu Gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (dla każdego profilu, dla każdej instancji).

## Przykład ręcznej konfiguracji env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Szybkie sprawdzenia

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretacja:

- `gateway status --deep` pomaga wykryć nieaktualne usługi launchd/systemd/schtasks pozostałe po starszych instalacjach.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden odizolowany Gateway.
