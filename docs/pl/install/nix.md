---
read_when:
    - Chcesz powtarzalnych instalacji z możliwością wycofania
    - Już korzystasz z Nix/NixOS/Home Manager
    - Chcesz, aby wszystko było przypięte i zarządzane deklaratywnie
summary: Zainstaluj OpenClaw deklaratywnie za pomocą Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:58:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Zainstaluj OpenClaw deklaratywnie za pomocą **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - oficjalnego modułu Home Manager z pełnym zestawem funkcji.

<Info>
Repozytorium [nix-openclaw](https://github.com/openclaw/nix-openclaw) jest źródłem prawdy dla instalacji Nix. Ta strona to krótki przegląd.
</Info>

## Co otrzymujesz

- Gateway + aplikacja macOS + narzędzia (whisper, spotify, cameras) -- wszystko przypięte
- Usługa launchd działająca po ponownym uruchomieniu
- System Plugin z deklaratywną konfiguracją
- Natychmiastowe wycofanie: `home-manager switch --rollback`

## Szybki start

<Steps>
  <Step title="Zainstaluj Determinate Nix">
    Jeśli Nix nie jest jeszcze zainstalowany, postępuj zgodnie z instrukcjami [instalatora Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Utwórz lokalny flake">
    Użyj szablonu agent-first z repozytorium nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Skonfiguruj sekrety">
    Skonfiguruj token bota komunikatora i klucz API dostawcy modelu. Zwykłe pliki w `~/.secrets/` działają dobrze.
  </Step>
  <Step title="Wypełnij symbole zastępcze w szablonie i przełącz">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Zweryfikuj">
    Potwierdź, że usługa launchd działa, a bot odpowiada na wiadomości.
  </Step>
</Steps>

Pełne opcje modułu i przykłady znajdziesz w [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Zachowanie runtime w trybie Nix

Gdy ustawione jest `OPENCLAW_NIX_MODE=1` (automatycznie z nix-openclaw), OpenClaw przechodzi w deterministyczny tryb dla instalacji zarządzanych przez Nix. Inne pakiety Nix mogą ustawić ten sam tryb; nix-openclaw jest oficjalnym punktem odniesienia.

Możesz też ustawić go ręcznie:

```bash
export OPENCLAW_NIX_MODE=1
```

W macOS aplikacja GUI nie dziedziczy automatycznie zmiennych środowiskowych powłoki. Zamiast tego włącz tryb Nix przez defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Co zmienia się w trybie Nix

- Przepływy automatycznej instalacji i samomodyfikacji są wyłączone
- `openclaw.json` jest traktowany jako niezmienny. Wartości domyślne wyprowadzone podczas uruchamiania pozostają tylko w runtime, a zapisujące konfigurację mechanizmy, takie jak setup, onboarding, modyfikujące `openclaw update`, instalacja/aktualizacja/odinstalowanie/włączenie pluginu, `doctor --fix`, `doctor --generate-gateway-token` i `openclaw config set`, odmawiają edycji pliku.
- Agenci powinni zamiast tego edytować źródło Nix. Dla nix-openclaw użyj agent-first [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) i ustaw konfigurację w `programs.openclaw.config` lub `instances.<name>.config`.
- Brakujące zależności wyświetlają komunikaty naprawcze specyficzne dla Nix
- UI wyświetla baner trybu Nix tylko do odczytu

### Ścieżki konfiguracji i stanu

OpenClaw odczytuje konfigurację JSON5 z `OPENCLAW_CONFIG_PATH` i przechowuje dane mutowalne w `OPENCLAW_STATE_DIR`. Podczas działania w Nix ustaw je jawnie na lokalizacje zarządzane przez Nix, aby stan runtime i konfiguracja pozostały poza niezmiennym magazynem.

| Zmienna                | Domyślnie                               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Wykrywanie PATH usługi

Usługa gateway launchd/systemd automatycznie wykrywa pliki binarne z profilu Nix, dzięki czemu
pluginy i narzędzia wywołujące pliki wykonywalne zainstalowane przez `nix` działają bez
ręcznej konfiguracji PATH:

- Gdy ustawione jest `NIX_PROFILES`, każdy wpis jest dodawany do PATH usługi z
  priorytetem od prawej do lewej (zgodnie z priorytetem powłoki Nix - wygrywa skrajnie prawy).
- Gdy `NIX_PROFILES` nie jest ustawione, `~/.nix-profile/bin` jest dodawane jako rezerwa.

Dotyczy to zarówno środowisk usług macOS launchd, jak i Linux systemd.

## Powiązane

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Moduł Home Manager będący źródłem prawdy oraz pełny przewodnik konfiguracji.
  </Card>
  <Card title="Kreator konfiguracji" href="/pl/start/wizard" icon="wand-magic-sparkles">
    Przewodnik konfiguracji CLI bez Nix.
  </Card>
  <Card title="Docker" href="/pl/install/docker" icon="docker">
    Konfiguracja kontenerowa jako alternatywa bez Nix.
  </Card>
  <Card title="Aktualizacja" href="/pl/install/updating" icon="arrow-up-right-from-square">
    Aktualizowanie instalacji zarządzanych przez Home Manager wraz z pakietem.
  </Card>
</CardGroup>
