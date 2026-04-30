---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tym samym komputerze
    - Wymagana jest odizolowana konfiguracja, stan i porty dla każdego Gateway.
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele Gateway
x-i18n:
    generated_at: "2026-04-30T09:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Większość konfiguracji powinna używać jednego Gateway, ponieważ pojedynczy Gateway może obsługiwać wiele połączeń komunikatorów i agentów. Jeśli potrzebujesz silniejszej izolacji lub nadmiarowości (np. bota ratunkowego), uruchom osobne Gateway z izolowanymi profilami/portami.

## Najlepsza zalecana konfiguracja

Dla większości użytkowników najprostsza konfiguracja bota ratunkowego to:

- pozostawienie głównego bota na domyślnym profilu
- uruchomienie bota ratunkowego na `--profile rescue`
- użycie całkowicie osobnego bota Telegram dla konta ratunkowego
- pozostawienie bota ratunkowego na innym porcie bazowym, takim jak `19789`

Dzięki temu bot ratunkowy jest odizolowany od głównego bota, więc może debugować lub stosować
zmiany konfiguracji, jeśli główny bot nie działa. Zostaw co najmniej 20 portów odstępu między
portami bazowymi, aby pochodne porty przeglądarki/canvas/CDP nigdy się nie zderzały.

## Szybki start bota ratunkowego

Użyj tej ścieżki domyślnie, chyba że masz ważny powód, aby zrobić coś
innego:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Podczas `openclaw --profile rescue onboard`:

- użyj osobnego tokena bota Telegram
- zachowaj profil `rescue`
- użyj portu bazowego co najmniej o 20 wyższego niż główny bot
- zaakceptuj domyślny obszar roboczy ratunkowy, chyba że zarządzasz już własnym

Jeśli onboarding już zainstalował usługę ratunkową za Ciebie, końcowe
`gateway install` nie jest potrzebne.

## Dlaczego to działa

Bot ratunkowy pozostaje niezależny, ponieważ ma własne:

- profil/konfigurację
- katalog stanu
- obszar roboczy
- port bazowy (plus porty pochodne)
- token bota Telegram

W większości konfiguracji użyj całkowicie osobnego bota Telegram dla profilu ratunkowego:

- łatwo ograniczyć go tylko do operatorów
- osobny token i tożsamość bota
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na wiadomościach DM, gdy główny bot jest uszkodzony

## Co zmienia `--profile rescue onboard`

`openclaw --profile rescue onboard` używa standardowego przepływu onboarding, ale
zapisuje wszystko w osobnym profilu.

W praktyce oznacza to, że bot ratunkowy dostaje własne:

- plik konfiguracji
- katalog stanu
- obszar roboczy (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym monity są takie same jak przy normalnym onboardingu.

## Ogólna konfiguracja wielu Gateway

Powyższy układ bota ratunkowego jest najłatwiejszą opcją domyślną, ale ten sam wzorzec
izolacji działa dla dowolnej pary lub grupy Gateway na jednym hoście.

W bardziej ogólnej konfiguracji nadaj każdemu dodatkowemu Gateway własny nazwany profil i własny
port bazowy:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jeśli chcesz, aby oba Gateway używały nazwanych profili, to też działa:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Usługi używają tego samego wzorca:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Użyj szybkiego startu bota ratunkowego, gdy chcesz mieć awaryjną ścieżkę operatora. Użyj
ogólnego wzorca profili, gdy chcesz mieć wiele długotrwale działających Gateway dla
różnych kanałów, tenantów, obszarów roboczych lub ról operacyjnych.

## Lista kontrolna izolacji

Zachowaj te wartości unikatowe dla każdej instancji Gateway:

- `OPENCLAW_CONFIG_PATH` — plik konfiguracji dla danej instancji
- `OPENCLAW_STATE_DIR` — sesje, dane logowania i pamięci podręczne dla danej instancji
- `agents.defaults.workspace` — główny katalog obszaru roboczego dla danej instancji
- `gateway.port` (lub `--port`) — unikatowy dla każdej instancji
- pochodne porty przeglądarki/canvas/CDP

Jeśli będą współdzielone, wystąpią wyścigi konfiguracji i konflikty portów.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = baza + 2 (tylko loopback)
- host canvas jest udostępniany na serwerze HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profilu przeglądarki są przydzielane automatycznie z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpiszesz którekolwiek z nich w konfiguracji lub env, musisz zachować ich unikatowość dla każdej instancji.

## Uwagi o przeglądarce/CDP (częsta pułapka)

- **Nie** przypinaj `browser.cdpUrl` do tych samych wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i zakresu CDP (pochodzących od jej portu Gateway).
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

- `gateway status --deep` pomaga wykryć nieaktualne usługi launchd/systemd/schtasks ze starszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateways detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden izolowany Gateway.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
