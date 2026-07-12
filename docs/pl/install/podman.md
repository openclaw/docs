---
read_when:
    - Chcesz uruchomić Gateway w kontenerze za pomocą Podmana zamiast Dockera
summary: Uruchom OpenClaw w kontenerze Podman bez uprawnień roota
title: Podman
x-i18n:
    generated_at: "2026-07-12T15:14:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Uruchom Gateway OpenClaw w kontenerze Podman bez uprawnień roota, zarządzanym przez bieżącego użytkownika bez uprawnień roota.

Model działania:

- Podman uruchamia kontener Gateway.
- CLI `openclaw` na hoście pełni funkcję płaszczyzny sterowania.
- Trwały stan jest domyślnie przechowywany na hoście w `~/.openclaw`.
- Do codziennego zarządzania używa się `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub osobnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie bez uprawnień roota
- **CLI OpenClaw** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatycznego uruchamiania zarządzanego przez Quadlet
- **Opcjonalnie:** `sudo` tylko wtedy, gdy chcesz użyć `loginctl enable-linger "$(whoami)"`, aby zapewnić uruchamianie podczas rozruchu na hoście bez monitora

## Szybki start

<Steps>
  <Step title="Konfiguracja jednorazowa">
    W katalogu głównym repozytorium uruchom `./scripts/podman/setup.sh`.

    Skrypt buduje obraz `openclaw:local` w magazynie Podman bieżącego użytkownika (lub pobiera `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli je ustawiono), tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli plik nie istnieje, oraz tworzy `~/.openclaw/.env` z wygenerowanym `OPENCLAW_GATEWAY_TOKEN`, jeśli plik nie istnieje.

    Opcjonalne zmienne środowiskowe czasu budowania:

    | Zmienna | Działanie |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Używa istniejącego lub pobranego obrazu zamiast budowania `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Instaluje dodatkowe pakiety apt podczas budowania obrazu (akceptuje również starszą zmienną `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Instaluje dodatkowe pakiety Python podczas budowania obrazu; przypinaj wersje i używaj wyłącznie zaufanych indeksów pakietów |
    | `OPENCLAW_EXTENSIONS` | Kompiluje i pakuje wybrane obsługiwane pluginy oraz instaluje ich zależności środowiska uruchomieniowego |
    | `OPENCLAW_INSTALL_BROWSER` | Wstępnie instaluje Chromium i Xvfb na potrzeby automatyzacji przeglądarki (ustaw na `1`) |

    Aby zamiast tego użyć konfiguracji zarządzanej przez Quadlet (tylko Linux i usługi użytkownika systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Uruchom kontener Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Uruchamia kontener z identyfikatorami uid/gid bieżącego użytkownika przy użyciu `--userns=keep-id` i montuje stan OpenClaw z hosta w kontenerze.

  </Step>

  <Step title="Uruchom konfigurację początkową wewnątrz kontenera">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Następnie otwórz `http://127.0.0.1:18789/` i użyj tokenu z `~/.openclaw/.env`.

    Uwierzytelnianie modelu: podczas konfiguracji użyj uwierzytelniania zarządzanego przez OpenClaw (kluczy API Anthropic albo uwierzytelniania OAuth w przeglądarce lub za pomocą kodu urządzenia OpenAI Codex dla OpenAI obsługiwanego przez Codex). Program uruchamiający Podman nie montuje katalogów poświadczeń CLI hosta, takich jak `~/.claude` lub `~/.codex`, w kontenerze konfiguracji ani Gateway. Istniejące logowania CLI hosta są jedynie udogodnieniem na tym samym hoście — w instalacjach kontenerowych przechowuj uwierzytelnianie dostawcy w zamontowanym stanie `~/.openclaw`, którym zarządza konfiguracja.

  </Step>

  <Step title="Zarządzaj działającym kontenerem za pomocą CLI hosta">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Od tej chwili zwykłe polecenia `openclaw` są automatycznie uruchamiane wewnątrz tego kontenera:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # obejmuje dodatkowe skanowanie usług
    openclaw doctor
    openclaw channels login
    ```

    W systemie macOS maszyna Podman może sprawić, że przeglądarka będzie postrzegana przez Gateway jako nielokalna. Jeśli po uruchomieniu interfejs sterowania zgłasza błędy uwierzytelniania urządzenia, skorzystaj ze wskazówek dotyczących Tailscale w sekcji [Podman i Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Ręczny program uruchamiający odczytuje z `~/.openclaw/.env` tylko niewielką listę dozwolonych kluczy związanych z Podman i przekazuje do kontenera jawnie określone zmienne środowiskowe środowiska uruchomieniowego; nie przekazuje całego pliku środowiskowego do Podman.

<a id="podman-and-tailscale"></a>

## Podman i Tailscale

Aby uzyskać dostęp przez HTTPS lub zdalną przeglądarkę, postępuj zgodnie z główną dokumentacją Tailscale.

Uwagi dotyczące Podman:

- Zachowaj adres publikowania Podman jako `127.0.0.1`.
- Preferuj zarządzane przez hosta `tailscale serve` zamiast `openclaw gateway --tailscale serve`.
- W systemie macOS, jeśli lokalny kontekst uwierzytelniania urządzenia w przeglądarce jest zawodny, użyj dostępu przez Tailscale zamiast doraźnych obejść z lokalnymi tunelami.

Zobacz [Tailscale](/pl/gateway/tailscale) i [interfejs sterowania](/pl/web/control-ui).

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiono `./scripts/podman/setup.sh --quadlet`, skrypt konfiguracyjny instaluje plik Quadlet w `~/.config/containers/systemd/openclaw.container`.

| Działanie | Polecenie                                  |
| --------- | ------------------------------------------ |
| Uruchomienie | `systemctl --user start openclaw.service`  |
| Zatrzymanie | `systemctl --user stop openclaw.service`   |
| Stan      | `systemctl --user status openclaw.service` |
| Dzienniki | `journalctl --user -u openclaw.service -f` |

Po edycji pliku Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Aby zapewnić uruchamianie podczas rozruchu na hostach obsługiwanych przez SSH lub bez monitora, włącz utrzymywanie sesji bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Wygenerowana usługa Quadlet zachowuje stałą, wzmocnioną konfigurację domyślną: porty publikowane na `127.0.0.1` (`18789` dla Gateway, `18790` dla mostu), `--bind lan` wewnątrz kontenera, przestrzeń nazw użytkownika `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` oraz `TimeoutStartSec=300`. Odczytuje `~/.openclaw/.env` jako plik `EnvironmentFile` środowiska uruchomieniowego dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa listy dozwolonych nadpisań specyficznych dla Podman z ręcznego programu uruchamiającego. Aby użyć niestandardowych publikowanych portów, adresu publikowania lub innych flag uruchamiania kontenera, skorzystaj z ręcznego programu uruchamiającego albo bezpośrednio edytuj `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i ponownie uruchom usługę.

## Konfiguracja, środowisko i pamięć masowa

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog przestrzeni roboczej:** `~/.openclaw/workspace`
- **Plik tokenu:** `~/.openclaw/.env`
- **Skrypt uruchamiający:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiający i Quadlet montują stan hosta w kontenerze: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, dlatego `openclaw.json`, pliki `auth-profiles.json` poszczególnych agentów, stan kanałów i dostawców, sesje oraz przestrzeń robocza pozostają zachowane po zastąpieniu kontenera. Konfiguracja początkowa dodaje również wartości `127.0.0.1` i `localhost` do `gateway.controlUi.allowedOrigins` dla publikowanego portu Gateway, dzięki czemu lokalny pulpit działa z powiązaniem kontenera innym niż local loopback.

Przydatne zmienne środowiskowe ręcznego programu uruchamiającego (zapisz je w `~/.openclaw/.env`; program uruchamiający odczytuje ten plik przed ostatecznym ustaleniem domyślnych ustawień kontenera i obrazu):

| Zmienna                                    | Wartość domyślna | Działanie                              |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Nazwa kontenera                        |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Obraz do uruchomienia                  |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Port hosta mapowany na port kontenera `18789` |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Port hosta mapowany na port kontenera `18790` |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Interfejs hosta dla publikowanych portów |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Tryb powiązania Gateway wewnątrz kontenera |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` lub `host`           |

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla poleceń `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch` — program uruchamiający z repozytorium nie zachowuje niestandardowych nadpisań ścieżek między sesjami powłoki.

## Uaktualnianie obrazów

Po ponownym zbudowaniu lub pobraniu nowego obrazu uruchom ponownie kontener albo usługę Quadlet.
Podczas pierwszego uruchomienia nowej wersji OpenClaw Gateway wykonuje bezpieczne naprawy stanu i pluginów, zanim zgłosi gotowość.

Jeśli Gateway zakończy działanie zamiast osiągnąć stan gotowości, uruchom ten sam obraz jednorazowo z poleceniem `openclaw doctor --fix` dla tego samego zamontowanego stanu i konfiguracji, a następnie uruchom Gateway ponownie w zwykły sposób:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Na hostach z SELinux dodaj `,Z` do obu montowań, jeśli Podman blokuje dostęp do zamontowanego stanu.

## Przydatne polecenia

- **Dzienniki kontenera:** `podman logs -f openclaw`
- **Zatrzymanie kontenera:** `podman stop openclaw`
- **Usunięcie kontenera:** `podman rm -f openclaw`
- **Otwarcie adresu URL pulpitu za pomocą CLI hosta:** `openclaw dashboard --no-open`
- **Kondycja i stan za pomocą CLI hosta:** `openclaw gateway status --deep` (sonda RPC i dodatkowe skanowanie usług)

## Rozwiązywanie problemów

- **Odmowa dostępu (EACCES) do konfiguracji lub przestrzeni roboczej:** Kontener domyślnie działa z `--userns=keep-id` i `--user <identyfikator uid użytkownika>:<identyfikator gid użytkownika>`. Upewnij się, że ścieżki konfiguracji i przestrzeni roboczej na hoście należą do bieżącego użytkownika.
- **Uruchomienie Gateway zablokowane (brak `gateway.mode=local`):** Upewnij się, że plik `~/.openclaw/openclaw.json` istnieje i ustawia `gateway.mode="local"`. Skrypt `scripts/podman/setup.sh` tworzy go, jeśli nie istnieje.
- **Kontener uruchamia się ponownie po aktualizacji obrazu:** Uruchom jednorazowe polecenie `openclaw doctor --fix` opisane w sekcji [Uaktualnianie obrazów](#upgrading-images), a następnie ponownie uruchom Gateway.
- **Polecenia CLI kontenera trafiają do niewłaściwego celu:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w powłoce.
- **Polecenie `openclaw update` kończy się niepowodzeniem z `--container`:** Jest to oczekiwane zachowanie. Ponownie zbuduj lub pobierz obraz, a następnie ponownie uruchom kontener albo usługę Quadlet.
- **Usługa Quadlet nie uruchamia się:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. W systemach bez monitora może być również potrzebne `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje montowania:** Pozostaw domyślne działanie montowania bez zmian; program uruchamiający automatycznie dodaje `:Z` w systemie Linux, gdy SELinux działa w trybie wymuszającym lub zezwalającym.

## Powiązane materiały

- [Docker](/pl/install/docker)
- [Proces Gateway działający w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
