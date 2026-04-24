---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tej samej maszynie
    - Potrzebujesz izolowanej konfiguracji/stanu/portów dla każdego Gateway
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Wiele Gateway (ten sam host)

W większości konfiguracji należy używać jednego Gateway, ponieważ pojedynczy Gateway może obsłużyć wiele połączeń komunikacyjnych i agentów. Jeśli potrzebujesz silniejszej izolacji lub nadmiarowości (np. bota ratunkowego), uruchom osobne Gateway z izolowanymi profilami/portami.

## Najlepsza zalecana konfiguracja

Dla większości użytkowników najprostsza konfiguracja bota ratunkowego wygląda tak:

- pozostaw głównego bota na profilu domyślnym
- uruchom bota ratunkowego na `--profile rescue`
- użyj całkowicie oddzielnego bota Telegram dla konta ratunkowego
- utrzymuj bota ratunkowego na innym porcie bazowym, np. `19789`

To utrzymuje bota ratunkowego w izolacji od głównego bota, dzięki czemu może debugować lub stosować
zmiany konfiguracji, jeśli główny bot nie działa. Zachowaj co najmniej 20 portów odstępu między
portami bazowymi, aby pochodne porty browser/canvas/CDP nigdy się nie zderzyły.

## Szybki start dla bota ratunkowego

Używaj tego jako domyślnej ścieżki, chyba że masz mocny powód, aby zrobić coś
innego:

```bash
# Bot ratunkowy (oddzielny bot Telegram, oddzielny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli główny bot już działa, to zwykle wszystko, czego potrzebujesz.

Podczas `openclaw --profile rescue onboard`:

- użyj oddzielnego tokenu bota Telegram
- pozostaw profil `rescue`
- użyj portu bazowego co najmniej 20 wyższego niż dla głównego bota
- zaakceptuj domyślny obszar roboczy ratunkowy, chyba że już sam nim zarządzasz

Jeśli onboarding już zainstalował usługę ratunkową za ciebie, końcowe
`gateway install` nie jest potrzebne.

## Dlaczego to działa

Bot ratunkowy pozostaje niezależny, ponieważ ma własne:

- profil/konfigurację
- katalog stanu
- obszar roboczy
- port bazowy (plus porty pochodne)
- token bota Telegram

W większości konfiguracji używaj całkowicie oddzielnego bota Telegram dla profilu ratunkowego:

- łatwo utrzymać go jako operator-only
- oddzielny token i tożsamość bota
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na wiadomościach prywatnych, gdy główny bot jest uszkodzony

## Co zmienia `--profile rescue onboard`

`openclaw --profile rescue onboard` używa normalnego przepływu onboardingu, ale
zapisuje wszystko do osobnego profilu.

W praktyce oznacza to, że bot ratunkowy dostaje własne:

- plik konfiguracji
- katalog stanu
- obszar roboczy (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym prompty są takie same jak przy zwykłym onboardingu.

## Ogólna konfiguracja wielo-Gateway

Powyższy układ bota ratunkowego jest najłatwiejszą opcją domyślną, ale ten sam wzorzec
izolacji działa dla dowolnej pary lub grupy Gateway na jednym hoście.

W bardziej ogólnej konfiguracji nadaj każdemu dodatkowemu Gateway własny nazwany profil i
własny port bazowy:

```bash
# main (profil domyślny)
openclaw setup
openclaw gateway --port 18789

# dodatkowy gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jeśli chcesz, aby oba Gateway używały nazwanych profili, to również działa:

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

Użyj szybkiego startu bota ratunkowego, gdy chcesz mieć zapasowy tor operatora. Użyj
ogólnego wzorca profili, gdy chcesz mieć wiele długotrwałych Gateway dla
różnych kanałów, tenantów, obszarów roboczych lub ról operacyjnych.

## Lista kontrolna izolacji

Utrzymuj te elementy unikalne dla każdej instancji Gateway:

- `OPENCLAW_CONFIG_PATH` — plik konfiguracji per instancja
- `OPENCLAW_STATE_DIR` — sesje, poświadczenia, cache per instancja
- `agents.defaults.workspace` — katalog główny obszaru roboczego per instancja
- `gateway.port` (lub `--port`) — unikalny per instancja
- pochodne porty browser/canvas/CDP

Jeśli te elementy są współdzielone, wystąpią wyścigi konfiguracji i konflikty portów.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = baza + 2 (tylko loopback)
- host Canvas jest serwowany przez serwer HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profili Browser są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpisujesz którykolwiek z nich w konfiguracji lub env, musisz utrzymać ich unikalność per instancja.

## Uwagi dotyczące Browser/CDP (częsta pułapka)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i własnego zakresu CDP (pochodnego od portu gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` per instancja.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (per profil, per instancja).

## Przykład ręcznego env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep` pomaga wykryć nieaktualne usługi launchd/systemd/schtasks z wcześniejszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jedno izolowane gateway.

## Powiązane

- [Instrukcja operacyjna Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
