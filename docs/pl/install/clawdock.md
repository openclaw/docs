---
read_when:
    - Często uruchamiasz OpenClaw za pomocą Dockera i chcesz korzystać na co dzień z krótszych poleceń
    - Potrzebujesz warstwy pomocniczej do panelu, dzienników, konfiguracji tokenów i procesów parowania
summary: Pomocnicze funkcje powłoki ClawDock do instalacji OpenClaw opartych na Dockerze
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T15:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock to niewielka warstwa pomocniczych skryptów powłoki do instalacji OpenClaw opartych na Dockerze.

Udostępnia krótkie polecenia, takie jak `clawdock-start`, `clawdock-dashboard` i `clawdock-fix-token`, zamiast dłuższych wywołań `docker compose ...`.

Jeśli Docker nie został jeszcze skonfigurowany, zacznij od strony [Docker](/pl/install/docker).

## Instalacja

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli wcześniej zainstalowano ClawDock z `scripts/shell-helpers/clawdock-helpers.sh`, zainstaluj go ponownie, korzystając z bieżącej ścieżki `scripts/clawdock/clawdock-helpers.sh`; stara bezpośrednia ścieżka GitHub została usunięta.

Przy pierwszym użyciu skrypty pomocnicze automatycznie wykrywają lokalną kopię repozytorium OpenClaw (sprawdzając typowe ścieżki, takie jak `~/openclaw` i `~/projects/openclaw`) oraz zapisują wynik w pamięci podręcznej w `~/.clawdock/config`. Jeśli lokalna kopia znajduje się gdzie indziej, ustaw samodzielnie `CLAWDOCK_DIR`.

## Dostępne funkcje

### Podstawowe operacje

| Polecenie          | Opis                         |
| ------------------ | ---------------------------- |
| `clawdock-start`   | Uruchamia Gateway            |
| `clawdock-stop`    | Zatrzymuje Gateway           |
| `clawdock-restart` | Ponownie uruchamia Gateway   |
| `clawdock-status`  | Sprawdza stan kontenera      |
| `clawdock-logs`    | Śledzi dzienniki Gateway     |

### Dostęp do kontenera

| Polecenie                 | Opis                                           |
| ------------------------- | ---------------------------------------------- |
| `clawdock-shell`          | Otwiera powłokę w kontenerze Gateway           |
| `clawdock-cli <command>`  | Uruchamia polecenia CLI OpenClaw w Dockerze    |
| `clawdock-exec <command>` | Wykonuje dowolne polecenie w kontenerze        |

### Interfejs WWW i parowanie

| Polecenie               | Opis                                      |
| ----------------------- | ----------------------------------------- |
| `clawdock-dashboard`    | Otwiera adres URL interfejsu sterowania   |
| `clawdock-devices`      | Wyświetla oczekujące parowania urządzeń   |
| `clawdock-approve <id>` | Zatwierdza żądanie parowania              |

### Konfiguracja i konserwacja

| Polecenie            | Opis                                                        |
| -------------------- | ----------------------------------------------------------- |
| `clawdock-fix-token` | Zapisuje token Gateway w konfiguracji kontenera             |
| `clawdock-update`    | Pobiera zmiany, przebudowuje i ponownie uruchamia           |
| `clawdock-rebuild`   | Przebudowuje tylko obraz Dockera                             |
| `clawdock-clean`     | Usuwa kontenery i wolumeny                                  |

### Narzędzia

| Polecenie              | Opis                                                   |
| ---------------------- | ------------------------------------------------------ |
| `clawdock-health`      | Sprawdza stan Gateway                                  |
| `clawdock-token`       | Wyświetla token Gateway                                |
| `clawdock-cd`          | Przechodzi do katalogu projektu OpenClaw               |
| `clawdock-config`      | Otwiera `~/.openclaw`                                  |
| `clawdock-show-config` | Wyświetla pliki konfiguracyjne z zamaskowanymi wartościami |
| `clawdock-workspace`   | Otwiera katalog przestrzeni roboczej                   |
| `clawdock-help`        | Wyświetla wszystkie polecenia ClawDock                 |

## Pierwsze uruchomienie

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Jeśli przeglądarka informuje, że wymagane jest parowanie:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfiguracja i dane poufne

ClawDock odczytuje dwa oddzielne pliki `.env`, zgodnie z podziałem opisanym na stronie [Docker](/pl/install/docker):

- Projektowy plik `.env` obok `docker-compose.yml`: wartości specyficzne dla Dockera, takie jak nazwa obrazu, porty i `OPENCLAW_GATEWAY_TOKEN`. Polecenie `clawdock-token` odczytuje token z tego pliku.
- `~/.openclaw/.env` (zamontowany w kontenerze): dane poufne oparte na zmiennych środowiskowych, którymi zarządza sam OpenClaw, wraz z `openclaw.json` i `agents/<agentId>/agent/auth-profiles.json`.

Polecenie `clawdock-fix-token` kopiuje token z projektowego pliku `.env` do wartości konfiguracyjnych `gateway.remote.token` i `gateway.auth.token` w kontenerze, a następnie ponownie uruchamia Gateway.

Użyj `clawdock-show-config`, aby szybko sprawdzić `openclaw.json` i oba pliki `.env`; w wyświetlanych danych polecenie maskuje wartości z plików `.env`.

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="docker">
    Standardowa instalacja OpenClaw w Dockerze.
  </Card>
  <Card title="Środowisko uruchomieniowe maszyny wirtualnej Docker" href="/pl/install/docker-vm-runtime" icon="cube">
    Zarządzane przez Dockera środowisko uruchomieniowe maszyny wirtualnej zapewniające wzmocnioną izolację.
  </Card>
  <Card title="Aktualizowanie" href="/pl/install/updating" icon="arrow-up-right-from-square">
    Aktualizowanie pakietu OpenClaw i zarządzanych usług.
  </Card>
</CardGroup>
