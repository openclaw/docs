---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tej samej maszynie
    - Potrzebujesz odizolowanej konfiguracji/stanu/portów dla każdego Gateway
summary: Uruchamianie wielu Gateway OpenClaw na jednym hoście (izolacja, porty i profile)
title: Wiele bram
x-i18n:
    generated_at: "2026-06-27T17:35:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Większość konfiguracji powinna używać jednego Gateway, ponieważ pojedynczy Gateway może obsługiwać wiele połączeń komunikatorów i agentów. Jeśli potrzebujesz silniejszej izolacji lub nadmiarowości (np. bota ratunkowego), uruchom osobne Gateway z izolowanymi profilami/portami.

## Najlepsza zalecana konfiguracja

Dla większości użytkowników najprostsza konfiguracja bota ratunkowego to:

- pozostawienie głównego bota na profilu domyślnym
- uruchomienie bota ratunkowego na `--profile rescue`
- użycie całkowicie osobnego bota Telegram dla konta ratunkowego
- utrzymywanie bota ratunkowego na innym porcie bazowym, takim jak `19789`

Dzięki temu bot ratunkowy pozostaje odizolowany od głównego bota, więc może debugować lub stosować
zmiany konfiguracji, jeśli podstawowy bot przestanie działać. Pozostaw co najmniej 20 portów odstępu między
portami bazowymi, aby pochodne porty przeglądarki/canvas/CDP nigdy nie kolidowały.

## Szybki start bota ratunkowego

Użyj tego jako domyślnej ścieżki, chyba że masz ważny powód, aby zrobić coś
innego:

```bash
# Bot ratunkowy (osobny bot Telegram, osobny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli główny bot już działa, zwykle to wszystko, czego potrzebujesz.

Podczas `openclaw --profile rescue onboard`:

- użyj osobnego tokenu bota Telegram
- zachowaj profil `rescue`
- użyj portu bazowego co najmniej o 20 wyższego niż główny bot
- zaakceptuj domyślny roboczy obszar ratunkowy, chyba że już zarządzasz własnym

Jeśli onboarding już zainstalował dla Ciebie usługę ratunkową, końcowe
`gateway install` nie jest potrzebne.

## Dlaczego to działa

Bot ratunkowy pozostaje niezależny, ponieważ ma własne:

- profil/konfigurację
- katalog stanu
- obszar roboczy
- port bazowy (plus porty pochodne)
- token bota Telegram

Dla większości konfiguracji użyj całkowicie osobnego bota Telegram dla profilu ratunkowego:

- łatwo utrzymać go wyłącznie dla operatorów
- osobny token i tożsamość bota
- niezależność od instalacji kanału/aplikacji głównego bota
- prosta ścieżka odzyskiwania oparta na wiadomościach DM, gdy główny bot jest uszkodzony

## Co zmienia `--profile rescue onboard`

`openclaw --profile rescue onboard` używa normalnego przepływu onboardingu, ale
zapisuje wszystko w osobnym profilu.

W praktyce oznacza to, że bot ratunkowy otrzymuje własne:

- plik konfiguracyjny
- katalog stanu
- obszar roboczy (domyślnie `~/.openclaw/workspace-rescue`)
- nazwę zarządzanej usługi

Poza tym monity są takie same jak przy normalnym onboardingu.

## Ogólna konfiguracja wielu Gateway

Powyższy układ bota ratunkowego jest najłatwiejszą opcją domyślną, ale ten sam wzorzec izolacji
działa dla dowolnej pary lub grupy Gateway na jednym hoście.

W bardziej ogólnej konfiguracji nadaj każdemu dodatkowemu Gateway własny nazwany profil oraz
własny port bazowy:

```bash
# główny (profil domyślny)
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

Użyj szybkiego startu bota ratunkowego, gdy chcesz mieć zapasową ścieżkę operatorską. Użyj
ogólnego wzorca profili, gdy chcesz mieć wiele długowiecznych Gateway dla
różnych kanałów, tenantów, obszarów roboczych lub ról operacyjnych.

## Lista kontrolna izolacji

Zachowaj unikalność tych elementów dla każdej instancji Gateway:

- `OPENCLAW_CONFIG_PATH` — plik konfiguracyjny danej instancji
- `OPENCLAW_STATE_DIR` — sesje, poświadczenia, pamięci podręczne danej instancji
- `agents.defaults.workspace` — katalog główny obszaru roboczego danej instancji
- `gateway.port` (lub `--port`) — unikalny dla każdej instancji
- pochodne porty przeglądarki/canvas/CDP

Jeśli będą współdzielone, wystąpią wyścigi konfiguracji i konflikty portów.

## Mapowanie portów (pochodne)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- port usługi sterowania przeglądarką = bazowy + 2 (tylko local loopback)
- host canvas jest serwowany na serwerze HTTP Gateway (ten sam port co `gateway.port`)
- porty CDP profilu przeglądarki są automatycznie przydzielane z zakresu `browser.controlPort + 9 .. + 108`

Jeśli nadpiszesz którekolwiek z nich w konfiguracji lub zmiennych środowiskowych, musisz zachować ich unikalność dla każdej instancji.

## Uwagi o przeglądarce/CDP (częsta pułapka)

- **Nie** ustawiaj `browser.cdpUrl` na te same wartości w wielu instancjach.
- Każda instancja potrzebuje własnego portu sterowania przeglądarką i zakresu CDP (pochodnego od jej portu gateway).
- Jeśli potrzebujesz jawnych portów CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- Zdalny Chrome: użyj `browser.profiles.<name>.cdpUrl` (dla profilu, dla instancji).

## Ręczny przykład zmiennych środowiskowych

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

- `gateway status --deep` pomaga wykryć przestarzałe usługi launchd/systemd/schtasks ze starszych instalacji.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateway identities detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamiasz więcej niż jeden odizolowany gateway, albo gdy OpenClaw nie może udowodnić, że osiągalne cele sondowania są tym samym gateway. Tunel SSH, adres URL proxy lub skonfigurowany zdalny adres URL do tego samego gateway to jeden gateway z wieloma transportami, nawet jeśli porty transportu się różnią.

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
