---
read_when:
    - Chcesz mieć powtarzalne instalacje z możliwością rollbacku.
    - Używasz już Nix/NixOS/Home Manager.
    - Chcesz, aby wszystko było przypięte i zarządzane deklaratywnie.
summary: Deklaratywna instalacja OpenClaw za pomocą Nix
title: Nix
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:50:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

Zainstaluj OpenClaw deklaratywnie za pomocą **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — modułu Home Manager z kompletem funkcji.

<Info>
Repozytorium [nix-openclaw](https://github.com/openclaw/nix-openclaw) jest źródłem prawdy dla instalacji Nix. Ta strona to szybki przegląd.
</Info>

## Co otrzymujesz

- Gateway + aplikacja macOS + narzędzia (whisper, spotify, kamery) — wszystko przypięte
- Usługa launchd, która przetrwa restarty
- System Pluginów z konfiguracją deklaratywną
- Natychmiastowy rollback: `home-manager switch --rollback`

## Szybki start

<Steps>
  <Step title="Zainstaluj Determinate Nix">
    Jeśli Nix nie jest jeszcze zainstalowany, postępuj zgodnie z instrukcjami [instalatora Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Utwórz lokalny flake">
    Użyj szablonu agent-first z repozytorium nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Skopiuj templates/agent-first/flake.nix z repozytorium nix-openclaw
    ```
  </Step>
  <Step title="Skonfiguruj sekrety">
    Skonfiguruj token bota komunikacyjnego i klucz API dostawcy modelu. Zwykłe pliki w `~/.secrets/` w zupełności wystarczą.
  </Step>
  <Step title="Uzupełnij placeholdery w szablonie i wykonaj switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Zweryfikuj">
    Potwierdź, że usługa launchd działa i że Twój bot odpowiada na wiadomości.
  </Step>
</Steps>

Pełne opcje modułu i przykłady znajdziesz w [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Zachowanie runtime’u w trybie Nix

Gdy ustawione jest `OPENCLAW_NIX_MODE=1` (automatycznie z nix-openclaw), OpenClaw przechodzi w tryb deterministyczny, który wyłącza przepływy auto-install.

Możesz też ustawić to ręcznie:

```bash
export OPENCLAW_NIX_MODE=1
```

Na macOS aplikacja GUI nie dziedziczy automatycznie zmiennych środowiskowych powłoki. Zamiast tego włącz tryb Nix przez defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Co zmienia się w trybie Nix

- Przepływy auto-install i self-mutation są wyłączone
- Brakujące zależności pokazują komunikaty naprawcze specyficzne dla Nix
- UI pokazuje baner tylko do odczytu informujący o trybie Nix

### Ścieżki konfiguracji i stanu

OpenClaw odczytuje konfigurację JSON5 z `OPENCLAW_CONFIG_PATH` i zapisuje dane zmienne w `OPENCLAW_STATE_DIR`. Podczas działania w Nix ustaw je jawnie na lokalizacje zarządzane przez Nix, aby runtime state i konfiguracja pozostawały poza niemutowalnym store.

| Zmienna               | Domyślnie                               |
| --------------------- | --------------------------------------- |
| `OPENCLAW_HOME`       | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`  | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

### Wykrywanie PATH usługi

Usługa Gateway launchd/systemd automatycznie wykrywa binaria profilu Nix, dzięki czemu
Pluginy i narzędzia wywołujące pliki wykonywalne zainstalowane przez `nix` działają bez
ręcznej konfiguracji PATH:

- Gdy ustawione jest `NIX_PROFILES`, każdy wpis jest dodawany do PATH usługi w
  priorytecie od prawej do lewej (zgodnie z priorytetem powłoki Nix — skrajny prawy wygrywa).
- Gdy `NIX_PROFILES` nie jest ustawione, jako fallback dodawane jest `~/.nix-profile/bin`.

Dotyczy to zarówno środowisk usług launchd na macOS, jak i systemd na Linuksie.

## Powiązane

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — pełny przewodnik konfiguracji
- [Wizard](/pl/start/wizard) — konfiguracja CLI bez Nix
- [Docker](/pl/install/docker) — konfiguracja kontenerowa
