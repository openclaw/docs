---
read_when:
    - Chcesz skonteneryzowany gateway z Podmanem zamiast Dockera
summary: Uruchamianie OpenClaw w bezrootowym kontenerze Podman
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:43:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Uruchom OpenClaw Gateway w bezrootowym kontenerze Podman, zarządzanym przez bieżącego użytkownika bez uprawnień root.

Docelowy model jest następujący:

- Podman uruchamia kontener gateway.
- Hostowy `openclaw` CLI jest płaszczyzną sterowania.
- Stan trwały domyślnie znajduje się na hoście w `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie bezrootowym
- **OpenClaw CLI** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatyczne uruchamianie zarządzane przez Quadlet
- **Opcjonalnie:** `sudo` tylko wtedy, gdy chcesz użyć `loginctl enable-linger "$(whoami)"` dla trwałości po uruchomieniu systemu na hoście bez monitora

## Szybki start

<Steps>
  <Step title="Jednorazowa konfiguracja">
    Z katalogu głównego repozytorium uruchom `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Uruchom kontener Gateway">
    Uruchom kontener za pomocą `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Uruchom onboarding wewnątrz kontenera">
    Uruchom `./scripts/run-openclaw-podman.sh launch setup`, a następnie otwórz `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Zarządzaj działającym kontenerem z hostowego CLI">
    Ustaw `OPENCLAW_CONTAINER=openclaw`, a następnie używaj zwykłych poleceń `openclaw` z hosta.
  </Step>
</Steps>

Szczegóły konfiguracji:

- `./scripts/podman/setup.sh` domyślnie buduje `openclaw:local` w Twoim bezrootowym magazynie Podman albo używa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli je ustawisz.
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli go brakuje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli go brakuje.
- Przy ręcznym uruchamianiu helper odczytuje tylko niewielką listę dozwolonych kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje jawne zmienne środowiskowe runtime do kontenera; nie przekazuje całego pliku środowiska do Podman.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet jest opcją tylko dla Linuksa, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne środowiskowe budowania/konfiguracji:

- `OPENCLAW_IMAGE` lub `OPENCLAW_PODMAN_IMAGE` -- użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- zainstaluj dodatkowe pakiety apt podczas budowania obrazu (akceptuje też starsze `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- zainstaluj dodatkowe pakiety Python podczas budowania obrazu; przypnij wersje i używaj tylko indeksów pakietów, którym ufasz
- `OPENCLAW_EXTENSIONS` -- wstępnie zainstaluj zależności pluginów w czasie budowania
- `OPENCLAW_INSTALL_BROWSER` -- wstępnie zainstaluj Chromium i Xvfb do automatyzacji przeglądarki (ustaw na `1`, aby włączyć)

Uruchomienie kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener z bieżącymi uid/gid za pomocą `--userns=keep-id` i montuje stan OpenClaw do kontenera przez bind mount.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokenu z `~/.openclaw/.env`.

Uwierzytelnianie modeli w Podman:

- Użyj uwierzytelniania zarządzanego przez OpenClaw podczas konfiguracji: kluczy API Anthropic dla Anthropic albo uwierzytelniania OAuth przeglądarki/kodem urządzenia OpenAI Codex dla OpenAI opartego na Codex.
- Launcher Podman nie montuje katalogów domowych poświadczeń hostowego CLI, takich jak `~/.claude` czy `~/.codex`, do kontenera konfiguracji ani gateway.
- Istniejące logowania hostowego CLI są ścieżkami wygody na tym samym hoście. W instalacjach kontenerowych trzymaj uwierzytelnianie dostawców w zamontowanym stanie `~/.openclaw`, którym zarządza konfiguracja.

Domyślne hostowe CLI:

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

W systemie macOS maszyna Podman może sprawić, że przeglądarka będzie wyglądać dla gateway jak nielokalna.
Jeśli Control UI zgłasza błędy uwierzytelniania urządzenia po uruchomieniu, skorzystaj ze wskazówek Tailscale w
[Podman i Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman i Tailscale

Aby uzyskać dostęp HTTPS lub zdalny dostęp przez przeglądarkę, postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Pozostaw host publikacji Podman jako `127.0.0.1`.
- Preferuj zarządzane przez hosta `tailscale serve` zamiast `openclaw gateway --tailscale serve`.
- W systemie macOS, jeśli lokalny kontekst uwierzytelniania urządzenia w przeglądarce jest zawodny, użyj dostępu Tailscale zamiast doraźnych obejść z lokalnymi tunelami.

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

Aby zachować trwałość po uruchomieniu systemu na hostach SSH/bez monitora, włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, środowisko i przechowywanie

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog workspace:** `~/.openclaw/workspace`
- **Plik tokenu:** `~/.openclaw/.env`
- **Helper uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet montują stan hosta do kontenera przez bind mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców,
sesje i workspace przetrwają wymianę kontenera.
Konfiguracja Podman zasila też `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie gateway, aby lokalny dashboard działał z powiązaniem kontenera, które nie jest local loopback.

Przydatne zmienne środowiskowe dla ręcznego launchera:

- `OPENCLAW_PODMAN_CONTAINER` -- nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hosta mapowany na kontener `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hosta mapowany na kontener `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfejs hosta dla opublikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- tryb wiązania gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (domyślnie), `auto` lub `host`

Ręczny launcher odczytuje `~/.openclaw/.env` przed finalizacją domyślnych wartości kontenera/obrazu, więc możesz je tam utrwalić.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch`. Repozytoryjny launcher lokalny nie utrwala niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: opublikowane porty `127.0.0.1`, `--bind lan` wewnątrz kontenera i przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako runtime `EnvironmentFile` dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa listy dozwolonych nadpisań specyficznych dla Podman z ręcznego launchera.
- Jeśli potrzebujesz niestandardowych portów publikacji, hosta publikacji lub innych flag uruchamiania kontenera, użyj ręcznego launchera albo edytuj bezpośrednio `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i zrestartuj usługę.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymaj kontener:** `podman stop openclaw`
- **Usuń kontener:** `podman rm -f openclaw`
- **Otwórz URL dashboardu z hostowego CLI:** `openclaw dashboard --no-open`
- **Kondycja/status przez hostowe CLI:** `openclaw gateway status --deep` (sonda RPC + dodatkowe
  skanowanie usługi)

## Rozwiązywanie problemów

- **Odmowa uprawnień (EACCES) w konfiguracji lub workspace:** Kontener domyślnie działa z `--userns=keep-id` i `--user <your uid>:<your gid>`. Upewnij się, że ścieżki konfiguracji/workspace na hoście należą do bieżącego użytkownika.
- **Start Gateway zablokowany (brak `gateway.mode=local`):** Upewnij się, że `~/.openclaw/openclaw.json` istnieje i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy go, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają w zły cel:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w swojej powłoce.
- **`openclaw update` kończy się niepowodzeniem z `--container`:** To oczekiwane. Przebuduj/pobierz obraz, a następnie zrestartuj kontener albo usługę Quadlet.
- **Usługa Quadlet nie startuje:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. W systemach bez monitora może być też potrzebne `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje bind mounty:** Pozostaw domyślne zachowanie montowania bez zmian; launcher automatycznie dodaje `:Z` w Linuksie, gdy SELinux jest w trybie enforcing lub permissive.

## Powiązane

- [Docker](/pl/install/docker)
- [Proces Gateway w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
