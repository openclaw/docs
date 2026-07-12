---
read_when:
    - Chcesz powtarzalnych instalacji z możliwością wycofania zmian
    - Korzystasz już z Nix/NixOS/Home Manager
    - Chcesz, aby wszystko było przypięte do konkretnych wersji i zarządzane deklaratywnie
summary: Zainstaluj OpenClaw deklaratywnie za pomocą Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T15:16:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Zainstaluj OpenClaw deklaratywnie za pomocą **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — oficjalnego, kompletnego modułu Home Manager.

<Info>
Repozytorium [nix-openclaw](https://github.com/openclaw/nix-openclaw) jest źródłem prawdy w zakresie instalacji Nix. Ta strona zawiera krótkie omówienie.
</Info>

## Co otrzymujesz

- Gateway, aplikację macOS i narzędzia (whisper, spotify, kamery) — wszystkie w przypiętych wersjach
- Usługę launchd, która działa również po ponownym uruchomieniu
- System Pluginów z konfiguracją deklaratywną
- Natychmiastowe wycofanie zmian: `home-manager switch --rollback`

## Szybki start

<Steps>
  <Step title="Zainstaluj Determinate Nix">
    Jeśli Nix nie jest jeszcze zainstalowany, postępuj zgodnie z instrukcjami [instalatora Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Utwórz lokalny flake">
    Użyj szablonu przeznaczonego przede wszystkim dla agenta z repozytorium nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Skopiuj templates/agent-first/flake.nix z repozytorium nix-openclaw
    ```
  </Step>
  <Step title="Skonfiguruj dane poufne">
    Skonfiguruj token bota komunikatora oraz klucz API dostawcy modelu. Zwykłe pliki w `~/.secrets/` sprawdzą się doskonale.
  </Step>
  <Step title="Uzupełnij symbole zastępcze w szablonie i zastosuj konfigurację">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Sprawdź">
    Upewnij się, że usługa launchd działa, a bot odpowiada na wiadomości.
  </Step>
</Steps>

Pełną listę opcji modułu i przykłady znajdziesz w pliku [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Działanie środowiska uruchomieniowego w trybie Nix

Gdy ustawiona jest zmienna `OPENCLAW_NIX_MODE=1` (automatycznie w przypadku nix-openclaw), OpenClaw przechodzi w tryb deterministyczny przeznaczony dla instalacji zarządzanych przez Nix. Inne pakiety Nix również mogą ustawić ten tryb; nix-openclaw jest oficjalną implementacją referencyjną.

Możesz także ustawić go ręcznie:

```bash
export OPENCLAW_NIX_MODE=1
```

W systemie macOS aplikacja z graficznym interfejsem użytkownika nie dziedziczy zmiennych środowiskowych powłoki. Zamiast tego włącz tryb Nix za pomocą `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Co zmienia się w trybie Nix

- Mechanizmy automatycznej instalacji i samoczynnej modyfikacji są wyłączone.
- Plik `openclaw.json` jest traktowany jako niezmienny. Wartości domyślne wyznaczane podczas uruchamiania obowiązują tylko w środowisku uruchomieniowym, a mechanizmy zapisujące konfigurację (konfiguracja początkowa, wdrażanie, modyfikujące polecenie `openclaw update`, instalowanie/aktualizowanie/odinstalowywanie/włączanie Pluginów, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) odmawiają edycji tego pliku.
- Zamiast tego edytuj źródło Nix. W przypadku nix-openclaw skorzystaj z sekcji [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start) przeznaczonej przede wszystkim dla agenta i ustaw konfigurację w `programs.openclaw.config` lub `instances.<name>.config`.
- Brakujące zależności powodują wyświetlenie komunikatów dotyczących rozwiązania problemu specyficznych dla Nix.
- Interfejs użytkownika wyświetla baner trybu Nix informujący o dostępie tylko do odczytu.

### Ścieżki konfiguracji i stanu

OpenClaw odczytuje konfigurację JSON5 ze ścieżki `OPENCLAW_CONFIG_PATH` i przechowuje modyfikowalne dane w katalogu `OPENCLAW_STATE_DIR`. W środowisku Nix ustaw je jawnie na lokalizacje zarządzane przez Nix, aby stan środowiska uruchomieniowego i konfiguracja znajdowały się poza niezmiennym magazynem.

| Zmienna                | Wartość domyślna                        |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Wykrywanie PATH usługi

Usługa Gateway uruchamiana przez launchd/systemd automatycznie wykrywa pliki wykonywalne w profilach Nix, dzięki czemu Pluginy i narzędzia uruchamiające zewnętrzne pliki wykonywalne zainstalowane przez `nix` działają bez ręcznej konfiguracji PATH:

- Gdy ustawiona jest zmienna `NIX_PROFILES`, każdy jej wpis jest dodawany do PATH usługi z priorytetem od prawej do lewej (zgodnie z priorytetem powłoki Nix: wygrywa wpis położony najbardziej na prawo).
- Gdy zmienna `NIX_PROFILES` nie jest ustawiona, jako lokalizacja zapasowa dodawany jest katalog `~/.nix-profile/bin`.

Dotyczy to zarówno środowisk usług launchd w systemie macOS, jak i systemd w systemie Linux.

## Powiązane

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Moduł Home Manager będący źródłem prawdy oraz kompletny przewodnik konfiguracji.
  </Card>
  <Card title="Kreator konfiguracji" href="/pl/start/wizard" icon="wand-magic-sparkles">
    Instrukcja konfiguracji za pomocą CLI bez użycia Nix.
  </Card>
  <Card title="Docker" href="/pl/install/docker" icon="docker">
    Konfiguracja kontenerowa jako alternatywa dla Nix.
  </Card>
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="arrow-up-right-from-square">
    Aktualizowanie instalacji zarządzanych przez Home Manager wraz z pakietem.
  </Card>
</CardGroup>
