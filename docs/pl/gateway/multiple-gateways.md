---
read_when:
    - Uruchamianie więcej niż jednej Gateway na tej samej maszynie
    - Potrzebujesz izolowanej konfiguracji/stanu/portów dla każdej Gateway
summary: Uruchamiaj wiele bram OpenClaw Gateway na jednym hoście (izolacja, porty i profile)
title: Wiele bram Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Wiele bram Gateway (ten sam host)

W większości konfiguracji powinna wystarczyć jedna Gateway, ponieważ pojedyncza Gateway może obsługiwać wiele połączeń komunikacyjnych i agentów. Jeśli potrzebujesz silniejszej izolacji lub redundancji (np. bota ratunkowego), uruchom osobne bramy Gateway z izolowanymi profilami/portami.

## Lista kontrolna izolacji (wymagane)

- `OPENCLAW_CONFIG_PATH` — plik konfiguracji dla każdej instancji
- `OPENCLAW_STATE_DIR` — sesje, poświadczenia i cache dla każdej instancji
- `agents.defaults.workspace` — katalog główny obszaru roboczego dla każdej instancji
- `gateway.port` (lub `--port`) — unikalny dla każdej instancji
- Porty pochodne (browser/canvas) nie mogą się nakładać

Jeśli te elementy są współdzielone, wystąpią wyścigi konfiguracji i konflikty portów.

## Zalecane: profile (`--profile`)

Profile automatycznie nadają zakres `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` i dodają sufiksy do nazw usług.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Usługi dla poszczególnych profili:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Przewodnik po bocie ratunkowym

Uruchom drugą Gateway na tym samym hoście z własnymi:

- profilem/konfiguracją
- katalogiem stanu
- obszarem roboczym
- portem bazowym (plus porty pochodne)

Dzięki temu bot ratunkowy pozostaje odizolowany od głównego bota, więc może diagnozować problemy lub wprowadzać zmiany konfiguracji, jeśli główny bot przestanie działać.

Odstęp między portami: pozostaw co najmniej 20 portów między portami bazowymi, aby pochodne porty browser/canvas/CDP nigdy się nie zderzały.

### Jak zainstalować (bot ratunkowy)

```bash
# Główny bot (istniejący lub nowy, bez parametru --profile)
# Działa na porcie 18789 + porty Chrome CDC/Canvas/...
openclaw onboard
openclaw gateway install

# Bot ratunkowy (izolowany profil + porty)
openclaw --profile rescue onboard
# Uwagi:
# - nazwa obszaru roboczego domyślnie otrzyma przyrostek -rescue
# - port powinien wynosić co najmniej 18789 + 20 portów,
#   lepiej wybrać całkowicie inny port bazowy, na przykład 19789,
# - pozostała część onboardingu jest taka sama jak zwykle

# Aby zainstalować usługę (jeśli nie stało się to automatycznie podczas konfiguracji)
openclaw --profile rescue gateway install
```

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = bazowy + 2 (tylko local loopback)
- host canvas jest udostępniany przez serwer HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profilu browser są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpisujesz którykolwiek z nich w konfiguracji lub env, musisz zachować ich unikalność dla każdej instancji.

## Uwagi o browser/CDP (częsta pułapka)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania browser oraz własnego zakresu CDP (pochodnego od portu gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (dla profilu i instancji).

## Przykład ręcznego env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Szybkie kontrole

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretacja:

- `gateway status --deep` pomaga wykryć nieaktualne usługi launchd/systemd/schtasks ze starszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jedną izolowaną gateway.
