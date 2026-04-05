---
read_when:
    - Często uruchamiasz OpenClaw z Dockerem i chcesz krótszych poleceń do codziennej pracy
    - Chcesz warstwy pomocniczej dla dashboardu, logów, konfiguracji tokena i przepływów parowania
summary: Pomocnicze funkcje powłoki ClawDock dla instalacji OpenClaw opartych na Dockerze
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T13:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock to mała warstwa pomocnicza powłoki dla instalacji OpenClaw opartych na Dockerze.

Daje krótkie polecenia, takie jak `clawdock-start`, `clawdock-dashboard` i `clawdock-fix-token`, zamiast dłuższych wywołań `docker compose ...`.

Jeśli nie masz jeszcze skonfigurowanego Dockera, zacznij od [Docker](/install/docker).

## Instalacja

Użyj kanonicznej ścieżki helpera:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli wcześniej zainstalowałeś ClawDock z `scripts/shell-helpers/clawdock-helpers.sh`, zainstaluj ponownie z nowej ścieżki `scripts/clawdock/clawdock-helpers.sh`. Stara ścieżka raw GitHub została usunięta.

## Co otrzymujesz

### Podstawowe operacje

| Polecenie          | Opis                    |
| ------------------ | ----------------------- |
| `clawdock-start`   | Uruchom gateway         |
| `clawdock-stop`    | Zatrzymaj gateway       |
| `clawdock-restart` | Uruchom gateway ponownie |
| `clawdock-status`  | Sprawdź stan kontenera  |
| `clawdock-logs`    | Śledź logi gateway      |

### Dostęp do kontenera

| Polecenie                 | Opis                                          |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Otwórz powłokę wewnątrz kontenera gateway     |
| `clawdock-cli <command>`  | Uruchamiaj polecenia CLI OpenClaw w Dockerze  |
| `clawdock-exec <command>` | Wykonaj dowolne polecenie w kontenerze        |

### Web UI i parowanie

| Polecenie               | Opis                           |
| ----------------------- | ------------------------------ |
| `clawdock-dashboard`    | Otwórz URL Control UI          |
| `clawdock-devices`      | Wyświetl oczekujące parowania urządzeń |
| `clawdock-approve <id>` | Zatwierdź żądanie parowania    |

### Konfiguracja i utrzymanie

| Polecenie            | Opis                                             |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Skonfiguruj token gateway wewnątrz kontenera     |
| `clawdock-update`    | Pobierz, przebuduj i uruchom ponownie            |
| `clawdock-rebuild`   | Przebuduj tylko obraz Docker                     |
| `clawdock-clean`     | Usuń kontenery i woluminy                        |

### Narzędzia pomocnicze

| Polecenie              | Opis                                      |
| ---------------------- | ----------------------------------------- |
| `clawdock-health`      | Uruchom kontrolę stanu gateway            |
| `clawdock-token`       | Wyświetl token gateway                    |
| `clawdock-cd`          | Przejdź do katalogu projektu OpenClaw     |
| `clawdock-config`      | Otwórz `~/.openclaw`                      |
| `clawdock-show-config` | Wyświetl pliki konfiguracyjne z ukrytymi wartościami |
| `clawdock-workspace`   | Otwórz katalog workspace                  |

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

ClawDock działa z tym samym podziałem konfiguracji Dockera opisanym w [Docker](/install/docker):

- `<project>/.env` dla wartości specyficznych dla Dockera, takich jak nazwa obrazu, porty i token gateway
- `~/.openclaw/.env` dla kluczy dostawców i tokenów botów opartych na env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dla zapisanych danych uwierzytelniania dostawców OAuth/klucz API
- `~/.openclaw/openclaw.json` dla konfiguracji zachowania

Użyj `clawdock-show-config`, gdy chcesz szybko sprawdzić pliki `.env` i `openclaw.json`. Ukrywa wartości `.env` w drukowanym wyniku.

## Powiązane strony

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Aktualizowanie](/install/updating)
