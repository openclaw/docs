---
read_when:
    - Chcesz powtarzalnych instalacji z możliwością wycofania
    - Już używasz Nix/NixOS/Home Manager
    - Chcesz, aby wszystko było przypięte i zarządzane deklaratywnie
summary: Zainstaluj OpenClaw deklaratywnie za pomocą Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Zainstaluj OpenClaw deklaratywnie za pomocą **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - modułu Home Manager z kompletnym zestawem narzędzi.

<Info>
Repozytorium [nix-openclaw](https://github.com/openclaw/nix-openclaw) jest źródłem prawdy dla instalacji Nix. Ta strona to szybki przegląd.
</Info>

## Co otrzymujesz

- Gateway + aplikacja macOS + narzędzia (whisper, spotify, cameras) -- wszystko przypięte do konkretnych wersji
- Usługa launchd, która działa po ponownym uruchomieniu
- System Plugin z deklaratywną konfiguracją
- Natychmiastowe wycofanie zmian: `home-manager switch --rollback`

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
    Skonfiguruj token bota komunikatora i klucz API dostawcy modelu. Zwykłe pliki w `~/.secrets/` sprawdzą się dobrze.
  </Step>
  <Step title="Uzupełnij placeholdery w szablonie i przełącz">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Zweryfikuj">
    Upewnij się, że usługa launchd działa i że bot odpowiada na wiadomości.
  </Step>
</Steps>

Pełne opcje modułu i przykłady znajdziesz w pliku [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Zachowanie środowiska uruchomieniowego w trybie Nix

Gdy ustawione jest `OPENCLAW_NIX_MODE=1` (automatycznie z nix-openclaw), OpenClaw przechodzi w tryb deterministyczny, który wyłącza przepływy automatycznej instalacji.

Możesz też ustawić to ręcznie:

```bash
export OPENCLAW_NIX_MODE=1
```

W macOS aplikacja GUI nie dziedziczy automatycznie zmiennych środowiskowych powłoki. Zamiast tego włącz tryb Nix przez defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Co zmienia się w trybie Nix

- Przepływy automatycznej instalacji i samomodyfikacji są wyłączone
- Brakujące zależności wyświetlają komunikaty naprawcze specyficzne dla Nix
- UI wyświetla baner trybu Nix tylko do odczytu

### Ścieżki konfiguracji i stanu

OpenClaw odczytuje konfigurację JSON5 z `OPENCLAW_CONFIG_PATH` i przechowuje dane modyfikowalne w `OPENCLAW_STATE_DIR`. Podczas uruchamiania w Nix ustaw je jawnie na lokalizacje zarządzane przez Nix, aby stan środowiska uruchomieniowego i konfiguracja pozostawały poza niezmiennym magazynem.

| Zmienna                | Domyślnie                               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Wykrywanie PATH usługi

Usługa Gateway launchd/systemd automatycznie wykrywa pliki binarne profilu Nix, dzięki czemu
Pluginy i narzędzia uruchamiające pliki wykonywalne zainstalowane przez `nix` działają bez
ręcznej konfiguracji PATH:

- Gdy ustawione jest `NIX_PROFILES`, każdy wpis jest dodawany do PATH usługi w
  kolejności pierwszeństwa od prawej do lewej (zgodnie z pierwszeństwem powłoki Nix - wygrywa wpis najbardziej po prawej).
- Gdy `NIX_PROFILES` nie jest ustawione, `~/.nix-profile/bin` jest dodawane jako wartość zastępcza.

Dotyczy to zarówno środowisk usług macOS launchd, jak i Linux systemd.

## Powiązane

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Źródłowy moduł Home Manager i pełny przewodnik konfiguracji.
  </Card>
  <Card title="Kreator konfiguracji" href="/pl/start/wizard" icon="wand-magic-sparkles">
    Instruktaż konfiguracji CLI poza Nix.
  </Card>
  <Card title="Docker" href="/pl/install/docker" icon="docker">
    Konfiguracja kontenerowa jako alternatywa poza Nix.
  </Card>
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="arrow-up-right-from-square">
    Aktualizowanie instalacji zarządzanych przez Home Manager wraz z pakietem.
  </Card>
</CardGroup>
