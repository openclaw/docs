---
read_when:
    - Uruchamianie więcej niż jednego Gateway na tym samym komputerze
    - Potrzebna jest oddzielna konfiguracja, stan i porty dla każdego Gatewaya
summary: Uruchamianie wielu instancji OpenClaw Gateway na jednym hoście (izolacja, porty i profile)
title: Wiele Gatewayów
x-i18n:
    generated_at: "2026-07-16T18:25:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Większość konfiguracji wymaga jednego Gateway — pojedynczy Gateway obsługuje wiele połączeń komunikatorów i agentów. Oddzielne Gateway z izolowanymi profilami/portami należy uruchamiać tylko wtedy, gdy potrzebna jest silniejsza izolacja lub nadmiarowość (np. bot ratunkowy).

## Szybki start bota ratunkowego

Najprostsza konfiguracja bota ratunkowego:

- Pozostaw głównego bota w profilu domyślnym.
- Uruchom bota ratunkowego w `--profile rescue`, z jego własnym tokenem bota Telegram.
- Ustaw dla bota ratunkowego inny port bazowy, np. `19789`.

Dzięki temu bot ratunkowy może diagnozować problemy lub wprowadzać zmiany konfiguracji, jeśli główny bot nie działa. Zachowaj odstęp co najmniej 20 portów między portami bazowymi, aby pochodne porty przeglądarki/CDP nigdy ze sobą nie kolidowały.

```bash
# Bot ratunkowy (oddzielny bot Telegram, oddzielny profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jeśli główny bot już działa, zwykle jest to wszystko, czego potrzeba. Jeśli proces wdrażania już zainstalował usługę ratunkową, pomiń końcowe `gateway install`.

Podczas `openclaw --profile rescue onboard`:

- Użyj oddzielnego tokenu bota Telegram, przeznaczonego dla konta ratunkowego (łatwo ograniczyć go wyłącznie do operatorów, jest niezależny od instalacji kanału/aplikacji głównego bota i zapewnia prostą ścieżkę odzyskiwania przez wiadomości prywatne).
- Zachowaj nazwę profilu `rescue`.
- Użyj portu bazowego wyższego o co najmniej 20 od portu głównego bota.
- Zaakceptuj domyślny obszar roboczy bota ratunkowego, chyba że własny jest już zarządzany samodzielnie.

### Co zmienia `--profile rescue onboard`

`--profile rescue onboard` uruchamia standardowy proces wdrażania, ale zapisuje wszystko w oddzielnym profilu, dzięki czemu bot ratunkowy otrzymuje własne:

- Plik profilu/konfiguracji
- Katalog stanu
- Obszar roboczy (domyślnie: `~/.openclaw/workspace-rescue`)
- Nazwę zarządzanej usługi
- Port bazowy (oraz porty pochodne)
- Token bota Telegram

Pozostałe monity są identyczne jak podczas standardowego wdrażania.

## Ogólna konfiguracja wielu Gateway

Ten sam wzorzec izolacji działa dla dowolnej pary lub grupy Gateway na jednym hoście — każdemu dodatkowemu Gateway należy nadać własny nazwany profil i port bazowy:

```bash
# główny (profil domyślny)
openclaw setup
openclaw gateway --port 18789

# dodatkowy gateway
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

Szybki start bota ratunkowego służy do utworzenia zapasowego kanału operatorskiego; ogólnego wzorca profili należy używać do obsługi wielu długotrwale działających Gateway w różnych kanałach, dzierżawach, obszarach roboczych lub rolach operacyjnych.

## Lista kontrolna izolacji

Poniższe elementy muszą być unikatowe dla każdej instancji Gateway:

| Ustawienie                      | Przeznaczenie                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | Plik konfiguracji poszczególnej instancji             |
| `OPENCLAW_STATE_DIR`         | Sesje, dane uwierzytelniające i pamięci podręczne poszczególnej instancji |
| `agents.defaults.workspace`  | Katalog główny obszaru roboczego poszczególnej instancji          |
| `gateway.port` (lub `--port`) | Unikatowy dla każdej instancji                  |
| Pochodne porty przeglądarki/CDP    | Zobacz poniżej                            |

Współdzielenie któregokolwiek z tych elementów powoduje konflikty konfiguracji, stanu lub portów. Podczas uruchamiania Gateway
wymuszana jest unikatowa własność katalogu stanu, nawet gdy
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` pomija ograniczenie do jednej instancji na konfigurację.

## Mapowanie portów (pochodnych)

Port bazowy = `gateway.port` (lub `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port usługi sterowania przeglądarką = port bazowy + 2 (tylko interfejs pętli zwrotnej).
- Host Canvas jest obsługiwany przez sam serwer HTTP Gateway (ten sam port co `gateway.port`).
- Porty CDP profili przeglądarki są automatycznie przydzielane z zakresu od `browser control port + 9` do `+ 108`.

W przypadku zastąpienia któregokolwiek z tych ustawień w konfiguracji lub zmiennych środowiskowych należy zachować ich unikatowość dla każdej instancji.

## Uwagi dotyczące przeglądarki/CDP (częsta pułapka)

- **Nie** przypisuj `browser.cdpUrl` tej samej wartości w wielu instancjach.
- Każda instancja wymaga własnego portu sterowania przeglądarką i zakresu CDP (pochodnych od jej portu Gateway).
- Aby jawnie określić porty CDP, ustaw `browser.profiles.<name>.cdpPort` dla każdej instancji.
- W przypadku zdalnej przeglądarki Chrome użyj `browser.profiles.<name>.cdpUrl` (dla każdego profilu i każdej instancji).

## Przykład ręcznej konfiguracji zmiennych środowiskowych

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

- `gateway status --deep` wykrywa nieaktualne usługi launchd/systemd/schtasks pozostałe po starszych instalacjach.
- Tekst ostrzeżenia `gateway probe`, taki jak `multiple reachable gateway identities detected`, jest oczekiwany tylko wtedy, gdy celowo uruchamianych jest wiele izolowanych Gateway albo gdy OpenClaw nie może potwierdzić, że osiągalne cele sondowania są tym samym Gateway. Tunel SSH, adres URL serwera proxy lub skonfigurowany zdalny adres URL prowadzący do tego samego Gateway oznacza jeden Gateway z wieloma transportami, nawet jeśli porty transportów są różne.

## Powiązane

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Blokada Gateway](/pl/gateway/gateway-lock)
- [Konfiguracja](/pl/gateway/configuration)
