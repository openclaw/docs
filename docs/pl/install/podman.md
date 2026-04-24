---
read_when:
    - Chcesz uruchomić gateway w kontenerze przy użyciu Podman zamiast Docker
summary: Uruchom OpenClaw w kontenerze rootless Podman
title: Podman
x-i18n:
    generated_at: "2026-04-24T09:18:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

Uruchom Gateway OpenClaw w kontenerze rootless Podman, zarządzanym przez bieżącego użytkownika bez uprawnień root.

Zamierzony model jest następujący:

- Podman uruchamia kontener gateway.
- Twoje hostowe CLI `openclaw` jest płaszczyzną sterowania.
- Trwały stan znajduje się na hoście, domyślnie pod `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie rootless
- **OpenClaw CLI** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatyczny start zarządzany przez Quadlet
- **Opcjonalnie:** `sudo` tylko wtedy, gdy chcesz użyć `loginctl enable-linger "$(whoami)"` dla trwałości po restarcie na hoście headless

## Szybki start

<Steps>
  <Step title="Jednorazowa konfiguracja">
    Z katalogu głównego repo uruchom `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Uruchom kontener Gateway">
    Uruchom kontener poleceniem `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Uruchom onboarding wewnątrz kontenera">
    Uruchom `./scripts/run-openclaw-podman.sh launch setup`, a następnie otwórz `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Zarządzaj działającym kontenerem z hostowego CLI">
    Ustaw `OPENCLAW_CONTAINER=openclaw`, a następnie używaj zwykłych poleceń `openclaw` z hosta.
  </Step>
</Steps>

Szczegóły konfiguracji:

- `./scripts/podman/setup.sh` domyślnie buduje `openclaw:local` w Twoim magazynie rootless Podman albo używa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli ustawisz jedną z tych zmiennych.
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli plik nie istnieje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli plik nie istnieje.
- Dla ręcznych uruchomień helper odczytuje tylko małą allowlistę kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje do kontenera jawne zmienne env runtime; nie przekazuje całego pliku env do Podman.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet jest opcją tylko dla Linux, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne env build/setup:

- `OPENCLAW_IMAGE` lub `OPENCLAW_PODMAN_IMAGE` -- użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instaluj dodatkowe pakiety apt podczas budowania obrazu
- `OPENCLAW_EXTENSIONS` -- wstępnie instaluj zależności Plugin podczas budowania

Uruchomienie kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener jako Twój bieżący uid/gid z `--userns=keep-id` i bind-mountuje stan OpenClaw do kontenera.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokenu z `~/.openclaw/.env`.

Hostowe ustawienie domyślne CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Wtedy polecenia takie jak poniższe będą automatycznie uruchamiane wewnątrz tego kontenera:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Na macOS Podman machine może sprawić, że przeglądarka będzie wyglądać dla gateway jak nielokalna.
Jeśli po uruchomieniu Control UI zgłasza błędy device-auth, użyj wskazówek Tailscale z
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Dla HTTPS lub zdalnego dostępu z przeglądarki postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Utrzymuj host publikacji Podman na `127.0.0.1`.
- Preferuj `tailscale serve` zarządzane przez host zamiast `openclaw gateway --tailscale serve`.
- Na macOS, jeśli lokalny kontekst device-auth przeglądarki jest zawodny, używaj dostępu Tailscale zamiast doraźnych lokalnych obejść tunelowych.

Zobacz:

- [Tailscale](/pl/gateway/tailscale)
- [Control UI](/pl/web/control-ui)

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiłeś `./scripts/podman/setup.sh --quadlet`, konfiguracja instaluje plik Quadlet pod:

```bash
~/.config/containers/systemd/openclaw.container
```

Przydatne polecenia:

- **Start:** `systemctl --user start openclaw.service`
- **Stop:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logi:** `journalctl --user -u openclaw.service -f`

Po edycji pliku Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aby utrzymać usługę po restarcie na hostach SSH/headless, włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, env i przechowywanie

- **Katalog config:** `~/.openclaw`
- **Katalog workspace:** `~/.openclaw/workspace`
- **Plik tokenu:** `~/.openclaw/.env`
- **Helper uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet bind-mountują stan hosta do kontenera:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/providerów,
sesje i workspace przetrwają wymianę kontenera.
Konfiguracja Podman inicjalizuje też `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie gateway, tak aby lokalny dashboard działał z powiązaniem poza loopback wewnątrz kontenera.

Przydatne zmienne env dla ręcznego launchera:

- `OPENCLAW_PODMAN_CONTAINER` -- nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hosta mapowany na kontener `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hosta mapowany na kontener `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfejs hosta dla publikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- tryb powiązania gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (domyślnie), `auto` lub `host`

Ręczny launcher odczytuje `~/.openclaw/.env` przed ustaleniem końcowych wartości domyślnych kontenera/obrazu, więc możesz je tam zapisać na stałe.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch`. Repozytoryjny launcher nie zapisuje niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: publikowane porty `127.0.0.1`, `--bind lan` wewnątrz kontenera i przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako runtime `EnvironmentFile` dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie korzysta z allowlisty nadpisań specyficznych dla Podman używanej przez ręczny launcher.
- Jeśli potrzebujesz niestandardowych publikowanych portów, hosta publikacji lub innych flag uruchamiania kontenera, użyj ręcznego launchera albo edytuj bezpośrednio `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i uruchom usługę ponownie.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymanie kontenera:** `podman stop openclaw`
- **Usunięcie kontenera:** `podman rm -f openclaw`
- **Otwórz URL dashboard z hostowego CLI:** `openclaw dashboard --no-open`
- **Health/status przez hostowe CLI:** `openclaw gateway status --deep` (probe RPC + dodatkowe
  skanowanie usług)

## Rozwiązywanie problemów

- **Permission denied (EACCES) na config lub workspace:** Kontener domyślnie działa z `--userns=keep-id` i `--user <your uid>:<your gid>`. Upewnij się, że ścieżki config/workspace na hoście należą do bieżącego użytkownika.
- **Gateway start blocked (brak `gateway.mode=local`):** Upewnij się, że istnieje `~/.openclaw/openclaw.json` i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy ten plik, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają do niewłaściwego celu:** Użyj jawnie `openclaw --container <name> ...` albo eksportuj `OPENCLAW_CONTAINER=<name>` w swojej powłoce.
- **`openclaw update` kończy się błędem z `--container`:** To oczekiwane. Zbuduj/pobierz ponownie obraz, a następnie uruchom ponownie kontener lub usługę Quadlet.
- **Usługa Quadlet nie startuje:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. Na systemach headless możesz też potrzebować `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje bind-mounty:** Nie zmieniaj domyślnego zachowania montowania; launcher automatycznie dodaje `:Z` na Linux, gdy SELinux jest w trybie enforcing lub permissive.

## Powiązane

- [Docker](/pl/install/docker)
- [Proces Gateway w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
