---
read_when:
    - Często uruchamiasz OpenClaw z Docker i chcesz krótszych poleceń na co dzień
    - Chcesz warstwę pomocniczą dla dashboardu, logów, konfiguracji tokena i przepływów parowania
summary: Pomocniki powłoki ClawDock dla instalacji OpenClaw opartych na Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T09:15:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock to niewielka warstwa pomocników powłoki dla instalacji OpenClaw opartych na Docker.

Daje krótkie polecenia, takie jak `clawdock-start`, `clawdock-dashboard` i `clawdock-fix-token`, zamiast dłuższych wywołań `docker compose ...`.

Jeśli nie masz jeszcze skonfigurowanego Docker, zacznij od [Docker](/pl/install/docker).

## Instalacja

Użyj kanonicznej ścieżki pomocnika:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli wcześniej instalowałeś ClawDock z `scripts/shell-helpers/clawdock-helpers.sh`, zainstaluj ponownie z nowej ścieżki `scripts/clawdock/clawdock-helpers.sh`. Stara surowa ścieżka GitHub została usunięta.

## Co otrzymujesz

### Podstawowe operacje

| Command            | Description                 |
| ------------------ | --------------------------- |
| `clawdock-start`   | Uruchom gateway            |
| `clawdock-stop`    | Zatrzymaj gateway          |
| `clawdock-restart` | Uruchom ponownie gateway   |
| `clawdock-status`  | Sprawdź status kontenera   |
| `clawdock-logs`    | Śledź logi gateway         |

### Dostęp do kontenera

| Command                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `clawdock-shell`          | Otwórz powłokę wewnątrz kontenera gateway          |
| `clawdock-cli <command>`  | Uruchamiaj polecenia CLI OpenClaw w Docker         |
| `clawdock-exec <command>` | Wykonaj dowolne polecenie w kontenerze             |

### Web UI i parowanie

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `clawdock-dashboard`    | Otwórz URL Control UI               |
| `clawdock-devices`      | Wyświetl oczekujące parowania urządzeń |
| `clawdock-approve <id>` | Zatwierdź żądanie parowania         |

### Konfiguracja i utrzymanie

| Command              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `clawdock-fix-token` | Skonfiguruj token gateway wewnątrz kontenera          |
| `clawdock-update`    | Pobierz, przebuduj i uruchom ponownie                 |
| `clawdock-rebuild`   | Przebuduj tylko obraz Docker                          |
| `clawdock-clean`     | Usuń kontenery i wolumeny                             |

### Narzędzia pomocnicze

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `clawdock-health`      | Uruchom sprawdzenie kondycji gateway         |
| `clawdock-token`       | Wypisz token gateway                         |
| `clawdock-cd`          | Przejdź do katalogu projektu OpenClaw        |
| `clawdock-config`      | Otwórz `~/.openclaw`                         |
| `clawdock-show-config` | Wypisz pliki konfiguracji z zredagowanymi wartościami |
| `clawdock-workspace`   | Otwórz katalog obszaru roboczego             |

## Przepływ przy pierwszym uruchomieniu

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Jeśli przeglądarka mówi, że wymagane jest parowanie:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfiguracja i sekrety

ClawDock działa z tym samym podziałem konfiguracji Docker opisanym w [Docker](/pl/install/docker):

- `<project>/.env` dla wartości specyficznych dla Docker, takich jak nazwa obrazu, porty i token gateway
- `~/.openclaw/.env` dla kluczy dostawców i tokenów botów opartych na env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dla zapisanych poświadczeń OAuth/kluczy API dostawców
- `~/.openclaw/openclaw.json` dla konfiguracji zachowania

Użyj `clawdock-show-config`, gdy chcesz szybko sprawdzić pliki `.env` i `openclaw.json`. Redaguje wartości `.env` w wypisywanym wyjściu.

## Powiązane strony

- [Docker](/pl/install/docker)
- [Środowisko wykonawcze Docker VM](/pl/install/docker-vm-runtime)
- [Aktualizowanie](/pl/install/updating)
