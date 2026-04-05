---
read_when:
    - Chcesz mieć powtarzalne instalacje z możliwością rollbacku
    - Używasz już Nix/NixOS/Home Manager
    - Chcesz mieć wszystko przypięte i zarządzane deklaratywnie
summary: Instalacja OpenClaw deklaratywnie przy użyciu Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Instalacja Nix

Zainstaluj OpenClaw deklaratywnie za pomocą **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — kompletnego modułu Home Manager.

<Info>
Repozytorium [nix-openclaw](https://github.com/openclaw/nix-openclaw) jest źródłem prawdy dla instalacji Nix. Ta strona to szybki przegląd.
</Info>

## Co otrzymujesz

- Gateway + aplikację macOS + narzędzia (whisper, spotify, cameras) — wszystko przypięte
- Usługę Launchd, która przetrwa restarty
- System pluginów z konfiguracją deklaratywną
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
    Skonfiguruj token bota wiadomości i klucz API providera modelu. Zwykłe pliki w `~/.secrets/` działają dobrze.
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

Pełną listę opcji modułu i przykłady znajdziesz w [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Zachowanie runtime w trybie Nix

Gdy ustawione jest `OPENCLAW_NIX_MODE=1` (automatycznie z nix-openclaw), OpenClaw przechodzi w tryb deterministyczny, który wyłącza przepływy automatycznej instalacji.

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
- UI pokazuje baner tylko do odczytu dla trybu Nix

### Ścieżki config i stanu

OpenClaw odczytuje config JSON5 z `OPENCLAW_CONFIG_PATH` i przechowuje zmienne dane w `OPENCLAW_STATE_DIR`. Podczas działania pod Nix ustaw je jawnie na lokalizacje zarządzane przez Nix, aby stan runtime i config pozostawały poza niemutowalnym store.

| Zmienna               | Domyślnie                               |
| --------------------- | --------------------------------------- |
| `OPENCLAW_HOME`       | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`  | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

## Powiązane

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — pełny przewodnik konfiguracji
- [Wizard](/start/wizard) — konfiguracja CLI poza Nix
- [Docker](/install/docker) — konfiguracja kontenerowa
