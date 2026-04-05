---
read_when:
    - Konfigurowanie nowej maszyny
    - Chcesz mieć „latest + greatest” bez psucia swojej osobistej konfiguracji
summary: Zaawansowane przepływy konfiguracji i rozwoju dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-05T14:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Konfiguracja

<Note>
Jeśli konfigurujesz wszystko po raz pierwszy, zacznij od [Pierwsze kroki](/start/getting-started).
Szczegóły dotyczące onboardingu znajdziesz w [Onboarding (CLI)](/start/wizard).
</Note>

## TL;DR

- **Dostosowanie znajduje się poza repozytorium:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Stabilny przepływ pracy:** zainstaluj aplikację macOS; pozwól jej uruchamiać dołączony Gateway.
- **Przepływ bleeding edge:** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie Local.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (obsługiwany jest też Node 22 LTS, obecnie `22.14+`)
- Preferowany `pnpm` (lub Bun, jeśli świadomie używasz [przepływu Bun](/pl/install/bun))
- Docker (opcjonalny; tylko do konfiguracji/testów e2e w kontenerach — zobacz [Docker](/pl/install/docker))

## Strategia dostosowywania (żeby aktualizacje nie szkodziły)

Jeśli chcesz mieć coś „w 100% dostosowanego do mnie” _i_ łatwe aktualizacje, trzymaj własne dostosowania w:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompty, pamięci; najlepiej jako prywatne repozytorium git)

Zainicjalizuj to raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego punktu wejścia CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze globalnej instalacji, uruchom to przez `pnpm openclaw setup` (lub `bun run openclaw setup`, jeśli używasz przepływu Bun).

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowane CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ checklistę onboardingu/uprawnień (prompty TCC).
3. Upewnij się, że Gateway jest ustawiony jako **Local** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie integracji (na przykład: WhatsApp):

```bash
openclaw channels login
```

5. Szybka kontrola:

```bash
openclaw health
```

Jeśli onboarding nie jest dostępny w twoim buildzie:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Przepływ bleeding edge (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i jednocześnie pozostawić podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom także aplikację macOS ze źródeł

Jeśli chcesz mieć także aplikację macOS w wersji bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom deweloperski Gateway

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` uruchamia gateway w trybie watch i przeładowuje go po odpowiednich zmianach w źródłach,
config oraz metadanych wbudowanych wtyczek.

Jeśli świadomie używasz przepływu Bun, równoważne polecenia to:

```bash
bun install
bun run gateway:watch
```

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja podłączy się do działającego gateway na skonfigurowanym porcie.

### 3) Weryfikacja

- Stan Gateway w aplikacji powinien brzmieć **„Using existing gateway …”**
- Lub przez CLI:

```bash
openclaw health
```

### Częste pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanałów/dostawców: `~/.openclaw/credentials/`
  - Profile auth modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania auth lub decydowania, co należy archiwizować:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki są odrzucane)
- **Token bota Discord**: config/env lub SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Listy dozwolonych dla parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile auth modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów opartych na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizacje (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „twoje rzeczy”; nie umieszczaj osobistych promptów/config w repozytorium `openclaw`.
- Aktualizacja ze źródeł: `git pull` + wybrany krok instalacji menedżera pakietów (`pnpm install` domyślnie; `bun install` dla przepływu Bun) + dalsze używanie pasującego polecenia `gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje Linux używają usługi użytkownika systemd. Domyślnie systemd zatrzymuje usługi użytkownika
po wylogowaniu/bezczynności, co wyłącza Gateway. Onboarding próbuje włączyć
lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączony, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów zawsze włączonych lub wieloużytkownikowych rozważ użycie usługi systemowej zamiast
usługi użytkownika (nie wymaga lingering). Zobacz [Instrukcja Gateway](/pl/gateway), aby przeczytać uwagi o systemd.

## Powiązana dokumentacja

- [Instrukcja Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat config + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/start/openclaw)
- [Aplikacja macOS](/platforms/macos) (cykl życia gateway)
