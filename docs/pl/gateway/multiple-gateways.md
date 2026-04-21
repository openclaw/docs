---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tej samej maszynie
    - Potrzebujesz odizolowanej konfiguracji/stanu/portów dla każdego Gateway
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele Gatewayów
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Wiele Gatewayów (ten sam host)

W większości konfiguracji należy używać jednego Gateway, ponieważ pojedynczy Gateway może obsługiwać wiele połączeń komunikacyjnych i agentów. Jeśli potrzebujesz silniejszej izolacji lub redundancji (np. rescue bot), uruchom osobne Gatewaye z odizolowanymi profilami/portami.

## Najbardziej zalecana konfiguracja

Dla większości użytkowników najprostsza konfiguracja rescue bot wygląda tak:

- pozostaw głównego bota na domyślnym profilu
- uruchom rescue bot z `--profile rescue`
- użyj całkowicie osobnego bota Telegram dla konta rescue
- pozostaw rescue bot na innym porcie bazowym, na przykład `19789`

Dzięki temu rescue bot pozostaje odizolowany od głównego bota, więc może diagnozować problemy lub wprowadzać zmiany konfiguracji, jeśli podstawowy bot przestanie działać. Zachowaj co najmniej 20 portów odstępu między portami bazowymi, aby pochodne porty przeglądarki/canvas/CDP nigdy się nie pokrywały.

## Szybki start rescue bot

Użyj tego jako domyślnej ścieżki, chyba że masz ważny powód, by zrobić coś innego:

```bash
# Rescue bot (osobny bot Telegram, osobny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli Twój główny bot już działa, zwykle to wszystko, czego potrzebujesz.

Podczas `openclaw --profile rescue onboard`:

- użyj osobnego tokena bota Telegram
- zachowaj profil `rescue`
- użyj portu bazowego co najmniej 20 wyższego niż główny bot
- zaakceptuj domyślny workspace rescue, chyba że już samodzielnie nim zarządzasz

Jeśli onboarding już zainstalował za Ciebie usługę rescue, końcowe polecenie `gateway install` nie jest potrzebne.

## Dlaczego to działa

Rescue bot pozostaje niezależny, ponieważ ma własne:

- profil/konfigurację
- katalog stanu
- workspace
- port bazowy (oraz porty pochodne)
- token bota Telegram

W większości konfiguracji dla profilu rescue użyj całkowicie osobnego bota Telegram:

- łatwo ograniczyć go wyłącznie do operatorów
- osobny token bota i tożsamość
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na wiadomościach DM, gdy główny bot jest uszkodzony

## Co zmienia `--profile rescue onboard`

`openclaw --profile rescue onboard` używa standardowego przepływu onboardingu, ale zapisuje wszystko w osobnym profilu.

W praktyce oznacza to, że rescue bot dostaje własne:

- plik konfiguracji
- katalog stanu
- workspace (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym prompty są takie same jak przy zwykłym onboardingu.

## Ogólna konfiguracja wielu Gatewayów

Układ z rescue bot opisany powyżej to najprostsza opcja domyślna, ale ten sam wzorzec izolacji działa dla dowolnej pary lub grupy Gatewayów na jednym hoście.

W bardziej ogólnej konfiguracji nadaj każdemu dodatkowemu Gatewayowi własny nazwany profil i własny port bazowy:

```bash
# główny (profil domyślny)
openclaw setup
openclaw gateway --port 18789

# dodatkowy gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jeśli chcesz, aby oba Gatewaye używały nazwanych profili, to również działa:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Usługi działają według tego samego wzorca:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Użyj szybkiego startu rescue bot, gdy chcesz mieć zapasowy kanał operatorski. Użyj ogólnego wzorca profili, gdy chcesz mieć wiele długotrwale działających Gatewayów dla różnych kanałów, tenantów, workspace'ów lub ról operacyjnych.

## Lista kontrolna izolacji

Zachowaj te elementy unikalne dla każdej instancji Gateway:

- `OPENCLAW_CONFIG_PATH` — plik konfiguracji dla instancji
- `OPENCLAW_STATE_DIR` — sesje, poświadczenia, cache dla instancji
- `agents.defaults.workspace` — główny katalog workspace dla instancji
- `gateway.port` (lub `--port`) — unikalny dla każdej instancji
- pochodne porty przeglądarki/canvas/CDP

Jeśli te elementy są współdzielone, pojawią się konflikty konfiguracji i portów.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = baza + 2 (tylko local loopback)
- host canvas jest udostępniany na serwerze HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profilu przeglądarki są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpisujesz którykolwiek z tych parametrów w konfiguracji lub env, musisz zachować ich unikalność dla każdej instancji.

## Uwagi o Browser/CDP (częsta pułapka)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i własnego zakresu CDP (pochodnego od jej portu gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (dla profilu, dla instancji).

## Ręczny przykład env

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

Interpretacja:

- `gateway status --deep` pomaga wykryć nieaktualne usługi launchd/systemd/schtasks pozostałe po starszych instalacjach.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden odizolowany gateway.
