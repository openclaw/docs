---
read_when:
    - Chcesz używać skonteneryzowanego Gateway z Podman zamiast Docker
summary: Uruchom OpenClaw w kontenerze Podman bez uprawnień roota
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

Uruchom OpenClaw Gateway w bezrootowym kontenerze Podman zarządzanym przez bieżącego użytkownika bez uprawnień roota.

Docelowy model jest następujący:

- Podman uruchamia kontener Gateway.
- Twój hostowy CLI `openclaw` jest płaszczyzną sterowania.
- Stan trwały domyślnie znajduje się na hoście w `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie bezrootowym
- **OpenClaw CLI** zainstalowany na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatyczny start zarządzany przez Quadlet
- **Opcjonalnie:** `sudo` tylko wtedy, gdy chcesz użyć `loginctl enable-linger "$(whoami)"` dla trwałości po rozruchu na hoście bez monitora

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

  <Step title="Zarządzaj działającym kontenerem z hostowego CLI">
    Ustaw `OPENCLAW_CONTAINER=openclaw`, a następnie używaj zwykłych poleceń `openclaw` z hosta.
  </Step>
</Steps>

Szczegóły konfiguracji:

- `./scripts/podman/setup.sh` domyślnie buduje `openclaw:local` w Twoim bezrootowym magazynie Podman albo używa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli ustawisz jedną z tych zmiennych.
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli go brakuje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli go brakuje.
- Przy ręcznych uruchomieniach pomocnik odczytuje tylko krótką listę dozwolonych kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje do kontenera jawne zmienne środowiskowe środowiska uruchomieniowego; nie przekazuje pełnego pliku środowiska do Podman.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet jest opcją wyłącznie dla Linuksa, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne środowiskowe budowania/konfiguracji:

- `OPENCLAW_IMAGE` lub `OPENCLAW_PODMAN_IMAGE` -- użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zainstaluj dodatkowe pakiety apt podczas budowania obrazu
- `OPENCLAW_EXTENSIONS` -- wstępnie zainstaluj zależności Plugin podczas budowania
- `OPENCLAW_INSTALL_BROWSER` -- wstępnie zainstaluj Chromium i Xvfb dla automatyzacji przeglądarki (ustaw na `1`, aby włączyć)

Uruchomienie kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener jako bieżący uid/gid z `--userns=keep-id` i montuje przez bind stan OpenClaw w kontenerze.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokena z `~/.openclaw/.env`.

Domyślne ustawienie hostowego CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Wtedy polecenia takie jak te będą automatycznie uruchamiane wewnątrz tego kontenera:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Na macOS maszyna Podman może sprawić, że przeglądarka będzie wyglądać dla Gateway jak nielokalna.
Jeśli Control UI zgłasza błędy uwierzytelniania urządzenia po uruchomieniu, skorzystaj ze wskazówek dotyczących Tailscale w sekcji
[Podman i Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman i Tailscale

Aby uzyskać dostęp HTTPS lub zdalny dostęp przez przeglądarkę, postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Zachowaj host publikowania Podman jako `127.0.0.1`.
- Preferuj zarządzane przez hosta `tailscale serve` zamiast `openclaw gateway --tailscale serve`.
- Na macOS, jeśli lokalny kontekst uwierzytelniania urządzenia w przeglądarce jest zawodny, użyj dostępu Tailscale zamiast doraźnych obejść z lokalnym tunelem.

Zobacz:

- [Tailscale](/pl/gateway/tailscale)
- [Control UI](/pl/web/control-ui)

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiono `./scripts/podman/setup.sh --quadlet`, konfiguracja instaluje plik Quadlet w:

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

Aby zapewnić trwałość po rozruchu na hostach SSH/bez monitora, włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, środowisko i pamięć masowa

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog obszaru roboczego:** `~/.openclaw/workspace`
- **Plik tokena:** `~/.openclaw/.env`
- **Pomocnik uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet montują przez bind stan hosta w kontenerze:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, `auth-profiles.json` poszczególnych agentów, stan kanałów/dostawców,
sesje i obszar roboczy przetrwają wymianę kontenera.
Konfiguracja Podman zasila też `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie Gateway, aby lokalny dashboard działał z wiązaniem kontenera innym niż loopback.

Przydatne zmienne środowiskowe dla ręcznego launchera:

- `OPENCLAW_PODMAN_CONTAINER` -- nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hosta mapowany na port kontenera `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hosta mapowany na port kontenera `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfejs hosta dla opublikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- tryb wiązania Gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (domyślnie), `auto` lub `host`

Ręczny launcher odczytuje `~/.openclaw/.env` przed finalizacją domyślnych ustawień kontenera/obrazu, więc możesz je tam utrwalić.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla poleceń `./scripts/podman/setup.sh`, jak i późniejszych `./scripts/run-openclaw-podman.sh launch`. Launcher lokalny dla repozytorium nie utrwala niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: opublikowane porty `127.0.0.1`, `--bind lan` wewnątrz kontenera i przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (Gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako środowiskowy `EnvironmentFile` czasu działania dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa listy dozwolonych nadpisań specyficznych dla Podman z ręcznego launchera.
- Jeśli potrzebujesz niestandardowych portów publikowania, hosta publikowania lub innych flag uruchamiania kontenera, użyj ręcznego launchera albo edytuj bezpośrednio `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i uruchom usługę ponownie.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymanie kontenera:** `podman stop openclaw`
- **Usunięcie kontenera:** `podman rm -f openclaw`
- **Otwarcie URL dashboardu z hostowego CLI:** `openclaw dashboard --no-open`
- **Kondycja/status przez hostowe CLI:** `openclaw gateway status --deep` (sonda RPC + dodatkowe
  skanowanie usługi)

## Rozwiązywanie problemów

- **Odmowa dostępu (EACCES) do konfiguracji lub obszaru roboczego:** Kontener domyślnie działa z `--userns=keep-id` i `--user <your uid>:<your gid>`. Upewnij się, że ścieżki konfiguracji/obszaru roboczego na hoście należą do bieżącego użytkownika.
- **Start Gateway zablokowany (brak `gateway.mode=local`):** Upewnij się, że `~/.openclaw/openclaw.json` istnieje i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy go, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają do niewłaściwego celu:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w swojej powłoce.
- **`openclaw update` kończy się niepowodzeniem z `--container`:** To oczekiwane. Odbuduj/pobierz obraz, a następnie uruchom ponownie kontener albo usługę Quadlet.
- **Usługa Quadlet nie startuje:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. W systemach bez monitora może być też potrzebne `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje montowania bind:** Pozostaw domyślne zachowanie montowania bez zmian; launcher automatycznie dodaje `:Z` w Linuksie, gdy SELinux działa w trybie enforcing lub permissive.

## Powiązane

- [Docker](/pl/install/docker)
- [Proces Gateway w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
