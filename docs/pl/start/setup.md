---
read_when:
    - Konfigurowanie nowej maszyny
    - Chcesz mieć „najnowsze i najlepsze” bez psucia własnej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy deweloperskiej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-24T09:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Jeśli konfigurujesz wszystko po raz pierwszy, zacznij od [Pierwszych kroków](/pl/start/getting-started).
Szczegóły onboardingu znajdziesz w [Onboarding (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji zależnie od tego, jak często chcesz aktualizacje i czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowanie żyje poza repozytorium:** trzymaj swoją konfigurację i workspace w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ bleeding edge (dev):** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie Local.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, jest nadal obsługiwany)
- Preferowany `pnpm` (lub Bun, jeśli celowo używasz [przepływu Bun](/pl/install/bun))
- Docker (opcjonalnie; tylko do konfiguracji kontenerowej/e2e — zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (żeby aktualizacje nie bolały)

Jeśli chcesz czegoś „w 100% dopasowanego do mnie” _i_ łatwych aktualizacji, przechowuj własne dostosowania w:

- **Konfiguracji:** `~/.openclaw/openclaw.json` (JSON/zbliżony do JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompty, pamięci; najlepiej jako prywatne repozytorium git)

Jednorazowa inicjalizacja:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego wpisu CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw setup` (lub `bun run openclaw setup`, jeśli używasz przepływu Bun).

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowane CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ checklistę onboardingu/uprawnień (monity TCC).
3. Upewnij się, że Gateway jest ustawiony na **Local** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Kontrola poprawności:

```bash
openclaw health
```

Jeśli onboarding nie jest dostępny w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie uruchom Gateway ręcznie (`openclaw gateway`).

## Przepływ bleeding edge (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i zachować podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom także aplikację macOS ze źródeł

Jeśli chcesz również mieć aplikację macOS w wersji bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom Gateway w trybie deweloperskim

```bash
pnpm install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/workspace OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia gateway w trybie watch i przeładowuje go przy odpowiednich zmianach źródeł,
konfiguracji i metadanych dołączonych pluginów.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/workspace dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` lub użyj `pnpm ui:dev` podczas prac nad Control UI.

Jeśli celowo używasz przepływu Bun, równoważne polecenia to:

```bash
bun install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/workspace OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Skieruj aplikację macOS na uruchomiony Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja podłączy się do działającego gateway na skonfigurowanym porcie.

### 3) Weryfikacja

- Status Gateway w aplikacji powinien pokazywać **„Using existing gateway …”**
- Lub przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Zły port:** domyślny Gateway WS to `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie przechowywany jest stan:**
  - Stan kanału/dostawcy: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania lub decydowania, co kopiować zapasowo:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki są odrzucane)
- **Token bota Discord**: config/env lub SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Listy dozwolonych parowań**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów opartych na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Starszy import OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez demolowania własnej konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „Twoje rzeczy”; nie umieszczaj osobistych promptów/konfiguracji w repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + wybrany krok instalacji menedżera pakietów (`pnpm install` domyślnie; `bun install` dla przepływu Bun) + dalsze używanie odpowiedniego polecenia `gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje na Linuksie używają usługi użytkownika systemd. Domyślnie systemd zatrzymuje
usługi użytkownika po wylogowaniu/bezczynności, co wyłącza Gateway. Onboarding próbuje
włączyć lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączony, uruchom:

```bash
sudo loginctl enable-linger $USER
```

W przypadku serwerów zawsze aktywnych lub wieloużytkownikowych rozważ usługę **systemową** zamiast
usługi użytkownika (wtedy lingering nie jest potrzebny). Zobacz uwagi dotyczące systemd w [Gateway runbook](/pl/gateway).

## Powiązana dokumentacja

- [Gateway runbook](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia gateway)
