---
read_when:
    - Chcesz konteneryzowanego gateway z Podman zamiast Docker
summary: Uruchamiaj OpenClaw w bezrootowym kontenerze Podman
title: Podman
x-i18n:
    generated_at: "2026-04-05T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Uruchamiaj OpenClaw Gateway w bezrootowym kontenerze Podman, zarządzanym przez bieżącego użytkownika bez uprawnień roota.

Docelowy model wygląda następująco:

- Podman uruchamia kontener gateway.
- Twoje hostowe CLI `openclaw` jest płaszczyzną sterowania.
- Trwały stan znajduje się na hoście, domyślnie w `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie rootless
- **CLI OpenClaw** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatyczne uruchamianie zarządzane przez Quadlet
- **Opcjonalnie:** `sudo`, tylko jeśli chcesz `loginctl enable-linger "$(whoami)"` dla trwałości po restarcie na hoście bezgłowym

## Szybki start

<Steps>
  <Step title="Jednorazowa konfiguracja">
    Z katalogu głównego repozytorium uruchom `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Uruchom kontener Gateway">
    Uruchom kontener poleceniem `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Uruchom onboarding wewnątrz kontenera">
    Uruchom `./scripts/run-openclaw-podman.sh launch setup`, a następnie otwórz `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Zarządzaj uruchomionym kontenerem z hostowego CLI">
    Ustaw `OPENCLAW_CONTAINER=openclaw`, a następnie używaj zwykłych poleceń `openclaw` z hosta.
  </Step>
</Steps>

Szczegóły konfiguracji:

- `./scripts/podman/setup.sh` domyślnie buduje `openclaw:local` w twoim rootless store Podman albo używa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli ustawisz jedną z tych zmiennych.
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli plik nie istnieje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli plik nie istnieje.
- Dla uruchomień ręcznych pomocnik odczytuje tylko niewielką listę dozwolonych kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje do kontenera jawne zmienne env środowiska uruchomieniowego; nie przekazuje Podman całego pliku env.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet jest opcją tylko dla Linux, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne env dla build/setup:

- `OPENCLAW_IMAGE` lub `OPENCLAW_PODMAN_IMAGE` -- użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zainstaluj dodatkowe pakiety apt podczas budowania obrazu
- `OPENCLAW_EXTENSIONS` -- zainstaluj zależności rozszerzeń podczas budowania

Uruchamianie kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener jako bieżące uid/gid z `--userns=keep-id` i bind-mountuje stan OpenClaw do kontenera.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokena z `~/.openclaw/.env`.

Domyślne hostowe CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Wtedy takie polecenia jak poniższe będą uruchamiane automatycznie wewnątrz tego kontenera:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # obejmuje dodatkowy skan usług
openclaw doctor
openclaw channels login
```

Na macOS Podman machine może sprawić, że przeglądarka będzie wyglądać dla gateway jak nielokalna.
Jeśli po uruchomieniu Control UI zgłasza błędy device-auth, skorzystaj ze wskazówek Tailscale w
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Aby uzyskać dostęp HTTPS lub zdalny dostęp z przeglądarki, postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Utrzymuj host publikacji Podman jako `127.0.0.1`.
- Preferuj zarządzane przez hosta `tailscale serve` zamiast `openclaw gateway --tailscale serve`.
- Na macOS, jeśli lokalny kontekst device-auth przeglądarki jest zawodny, użyj dostępu przez Tailscale zamiast doraźnych obejść z lokalnymi tunelami.

Zobacz:

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiłeś `./scripts/podman/setup.sh --quadlet`, konfiguracja instaluje plik Quadlet w:

```bash
~/.config/containers/systemd/openclaw.container
```

Przydatne polecenia:

- **Uruchom:** `systemctl --user start openclaw.service`
- **Zatrzymaj:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logi:** `journalctl --user -u openclaw.service -f`

Po edycji pliku Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aby zachować trwałość po starcie systemu na hostach SSH/bezgłowych, włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, env i pamięć trwała

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog workspace:** `~/.openclaw/workspace`
- **Plik tokena:** `~/.openclaw/.env`
- **Pomocnik uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet bind-mountują stan hosta do kontenera:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców,
sesje i workspace przetrwają wymianę kontenera.
Konfiguracja Podman zasiewa także `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie gateway, aby lokalny dashboard działał z nieloopbackowym bindem kontenera.

Przydatne zmienne env dla ręcznego launchera:

- `OPENCLAW_PODMAN_CONTAINER` -- nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hosta mapowany na kontener `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hosta mapowany na kontener `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfejs hosta dla publikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- tryb bindowania gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (domyślnie), `auto` lub `host`

Ręczny launcher odczytuje `~/.openclaw/.env` przed ustaleniem końcowych wartości domyślnych kontenera/obrazu, więc możesz je tam trwale zapisać.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch`. Lokalny launcher repozytorium nie utrwala niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: porty publikowane na `127.0.0.1`, `--bind lan` wewnątrz kontenera i przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako `EnvironmentFile` środowiska uruchomieniowego dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa listy dozwolonych nadpisań specyficznych dla Podman z ręcznego launchera.
- Jeśli potrzebujesz niestandardowych portów publikacji, hosta publikacji lub innych flag uruchomienia kontenera, użyj ręcznego launchera albo edytuj bezpośrednio `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i uruchom ponownie usługę.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymaj kontener:** `podman stop openclaw`
- **Usuń kontener:** `podman rm -f openclaw`
- **Otwórz URL dashboard z hostowego CLI:** `openclaw dashboard --no-open`
- **Health/status przez hostowe CLI:** `openclaw gateway status --deep` (sonda RPC + dodatkowy
  skan usług)

## Rozwiązywanie problemów

- **Permission denied (EACCES) dla konfiguracji lub workspace:** Kontener domyślnie działa z `--userns=keep-id` i `--user <twoje uid>:<twoje gid>`. Upewnij się, że ścieżki konfiguracji/workspace na hoście należą do bieżącego użytkownika.
- **Zablokowane uruchomienie gateway (brak `gateway.mode=local`):** Upewnij się, że istnieje `~/.openclaw/openclaw.json` i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy ten plik, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają do niewłaściwego celu:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w swojej powłoce.
- **`openclaw update` nie działa z `--container`:** To oczekiwane. Przebuduj/pobierz obraz, a następnie uruchom ponownie kontener lub usługę Quadlet.
- **Usługa Quadlet nie startuje:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. W systemach bezgłowych możesz też potrzebować `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje bind mounty:** Pozostaw domyślne zachowanie montowania bez zmian; launcher automatycznie dodaje `:Z` na Linux, gdy SELinux jest w trybie enforcing lub permissive.

## Powiązane

- [Docker](/install/docker)
- [Proces gateway w tle](/gateway/background-process)
- [Rozwiązywanie problemów z gateway](/gateway/troubleshooting)
