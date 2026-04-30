---
read_when:
    - Chcesz skonteneryzowany Gateway z Podman zamiast Docker
summary: Uruchamianie OpenClaw w kontenerze Podman bez uprawnień roota
title: Podman
x-i18n:
    generated_at: "2026-04-30T10:02:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Uruchom OpenClaw Gateway w bezrootowym kontenerze Podman, zarządzanym przez bieżącego użytkownika bez uprawnień root.

Docelowy model jest następujący:

- Podman uruchamia kontener Gateway.
- Hostowy `openclaw` CLI jest płaszczyzną sterowania.
- Stan trwały domyślnie znajduje się na hoście w `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` albo osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie bezrootowym
- **OpenClaw CLI** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatyczny start zarządzany przez Quadlet
- **Opcjonalnie:** `sudo` tylko wtedy, gdy chcesz użyć `loginctl enable-linger "$(whoami)"` do trwałości po rozruchu na hoście bez monitora

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
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli plik nie istnieje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli plik nie istnieje.
- Przy ręcznych uruchomieniach pomocnik odczytuje tylko małą listę dozwolonych kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje do kontenera jawne zmienne środowiskowe czasu uruchomienia; nie przekazuje pełnego pliku środowiska do Podman.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet jest opcją tylko dla Linuksa, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne środowiskowe budowania/konfiguracji:

- `OPENCLAW_IMAGE` albo `OPENCLAW_PODMAN_IMAGE` -- użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zainstaluj dodatkowe pakiety apt podczas budowania obrazu
- `OPENCLAW_EXTENSIONS` -- wstępnie zainstaluj zależności Plugin podczas budowania
- `OPENCLAW_INSTALL_BROWSER` -- wstępnie zainstaluj Chromium i Xvfb do automatyzacji przeglądarki (ustaw na `1`, aby włączyć)

Uruchomienie kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener jako bieżące uid/gid z `--userns=keep-id` i montuje stan OpenClaw w kontenerze przez bind mount.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokenu z `~/.openclaw/.env`.

Domyślne hostowe CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Następnie polecenia takie jak poniższe będą uruchamiane automatycznie wewnątrz tego kontenera:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Na macOS maszyna Podman może sprawić, że przeglądarka będzie wyglądać dla Gateway jak nielokalna.
Jeśli Control UI zgłasza błędy uwierzytelniania urządzenia po uruchomieniu, skorzystaj ze wskazówek dotyczących Tailscale w
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Aby uzyskać dostęp przez HTTPS albo zdalną przeglądarkę, postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Pozostaw host publikowania Podman jako `127.0.0.1`.
- Preferuj zarządzane przez hosta `tailscale serve` zamiast `openclaw gateway --tailscale serve`.
- Na macOS, jeśli kontekst uwierzytelniania urządzenia w lokalnej przeglądarce jest zawodny, użyj dostępu przez Tailscale zamiast doraźnych obejść z lokalnym tunelem.

Zobacz:

- [Tailscale](/pl/gateway/tailscale)
- [Control UI](/pl/web/control-ui)

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiono `./scripts/podman/setup.sh --quadlet`, konfiguracja instaluje plik Quadlet w:

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

Aby zapewnić trwałość po rozruchu na hostach SSH/bez monitora, włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, środowisko i przechowywanie

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog obszaru roboczego:** `~/.openclaw/workspace`
- **Plik tokenu:** `~/.openclaw/.env`
- **Pomocnik uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet montują stan hosta w kontenerze przez bind mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców,
sesje i obszar roboczy przetrwają wymianę kontenera.
Konfiguracja Podman zasiewa też `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie Gateway, aby lokalny dashboard działał z wiązaniem kontenera innym niż loopback.

Przydatne zmienne środowiskowe dla ręcznego programu uruchamiającego:

- `OPENCLAW_PODMAN_CONTAINER` -- nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hosta mapowany na kontener `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hosta mapowany na kontener `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfejs hosta dla opublikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- tryb wiązania Gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (domyślnie), `auto` albo `host`

Ręczny program uruchamiający odczytuje `~/.openclaw/.env` przed finalizacją ustawień domyślnych kontenera/obrazu, więc możesz utrwalić te wartości w tym pliku.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` albo `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch`. Lokalny dla repozytorium program uruchamiający nie utrwala niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: porty opublikowane na `127.0.0.1`, `--bind lan` wewnątrz kontenera oraz przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (Gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako runtime `EnvironmentFile` dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa listy dozwolonych nadpisań specyficznych dla Podman z ręcznego programu uruchamiającego.
- Jeśli potrzebujesz niestandardowych portów publikowania, hosta publikowania albo innych flag uruchamiania kontenera, użyj ręcznego programu uruchamiającego albo edytuj bezpośrednio `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i zrestartuj usługę.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymaj kontener:** `podman stop openclaw`
- **Usuń kontener:** `podman rm -f openclaw`
- **Otwórz URL dashboardu z hostowego CLI:** `openclaw dashboard --no-open`
- **Kondycja/status przez hostowe CLI:** `openclaw gateway status --deep` (sonda RPC + dodatkowe
  skanowanie usług)

## Rozwiązywanie problemów

- **Odmowa uprawnień (EACCES) przy konfiguracji albo obszarze roboczym:** Kontener domyślnie działa z `--userns=keep-id` i `--user <your uid>:<your gid>`. Upewnij się, że ścieżki konfiguracji/obszaru roboczego na hoście należą do bieżącego użytkownika.
- **Start Gateway zablokowany (brak `gateway.mode=local`):** Upewnij się, że `~/.openclaw/openclaw.json` istnieje i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy go, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają w zły cel:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w powłoce.
- **`openclaw update` kończy się niepowodzeniem z `--container`:** To oczekiwane. Przebuduj/pobierz obraz, a następnie zrestartuj kontener albo usługę Quadlet.
- **Usługa Quadlet nie startuje:** Uruchom `systemctl --user daemon-reload`, a potem `systemctl --user start openclaw.service`. Na systemach bez monitora może być też potrzebne `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje bind mounty:** Pozostaw domyślne zachowanie montowania bez zmian; program uruchamiający automatycznie dodaje `:Z` na Linuksie, gdy SELinux działa w trybie enforcing albo permissive.

## Powiązane

- [Docker](/pl/install/docker)
- [Proces Gateway w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
