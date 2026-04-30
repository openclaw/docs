---
read_when:
    - Konfigurowanie nowej maszyny
    - Chcesz „najnowsze i najlepsze” bez psucia swojej osobistej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy deweloperskiej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-30T10:19:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwszych kroków](/pl/start/getting-started).
Szczegóły wdrażania znajdziesz w [Wdrażanie (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji na podstawie tego, jak często chcesz aktualizować oraz czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowania żyją poza repozytorium:** przechowuj konfigurację i przestrzeń roboczą w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy z najnowszymi zmianami (dev):** uruchom Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie Local.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, nadal obsługiwany)
- Preferowany `pnpm` (lub Bun, jeśli świadomie używasz [przepływu pracy Bun](/pl/install/bun))
- Docker (opcjonalnie; tylko dla konfiguracji kontenerowej/e2e — zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (aby aktualizacje nie przeszkadzały)

Jeśli chcesz konfigurację „100% pode mnie” _i_ łatwe aktualizacje, przechowuj swoje dostosowania w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Przestrzeń robocza:** `~/.openclaw/workspace` (Skills, prompty, pamięci; zrób z tego prywatne repozytorium git)

Uruchom bootstrap raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego wejścia CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw setup` (lub `bun run openclaw setup`, jeśli używasz przepływu pracy Bun).

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowane CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ listę kontrolną wdrażania/uprawnień (monity TCC).
3. Upewnij się, że Gateway jest w trybie **Local** i działa (zarządza nim aplikacja).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Kontrola poprawności:

```bash
openclaw health
```

Jeśli wdrażanie nie jest dostępne w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Przepływ pracy z najnowszymi zmianami (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i utrzymywać podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródeł

Jeśli chcesz również mieć aplikację macOS na najnowszych zmianach:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom deweloperski Gateway

```bash
pnpm install
# Tylko pierwsze uruchomienie (lub po zresetowaniu lokalnej konfiguracji/przestrzeni roboczej OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub restartuje proces obserwowania Gateway w nazwanej
sesji tmux i automatycznie podłącza się z interaktywnych terminali. Powłoki
nieinteraktywne pozostają odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby utrzymać interaktywne uruchomienie
w stanie odłączonym, albo `pnpm gateway:watch:raw` dla trybu obserwowania na pierwszym planie. Obserwator
przeładowuje się przy istotnych zmianach źródeł, konfiguracji i metadanych dołączonych Plugin.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/przestrzeni roboczej dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` albo używaj `pnpm ui:dev` podczas rozwijania Control UI.

Jeśli świadomie używasz przepływu pracy Bun, równoważne polecenia to:

```bash
bun install
# Tylko pierwsze uruchomienie (lub po zresetowaniu lokalnej konfiguracji/przestrzeni roboczej OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Skieruj aplikację macOS do działającego Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja podłączy się do działającego Gateway na skonfigurowanym porcie.

### 3) Zweryfikuj

- Status Gateway w aplikacji powinien brzmieć **„Using existing gateway …”**
- Albo przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie żyje stan:**
  - Stan kanału/dostawcy: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modelu: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania albo decydowania, co tworzyć w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env albo `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: config/env albo SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Listy dozwolonych parowań**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modelu**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie wkładaj osobistych promptów/konfiguracji do repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + wybrany krok instalacji menedżera pakietów (`pnpm install` domyślnie; `bun install` dla przepływu pracy Bun) + dalsze używanie pasującego polecenia `gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje Linuksa używają usługi systemd **użytkownika**. Domyślnie systemd zatrzymuje usługi
użytkownika po wylogowaniu/bezczynności, co zabija Gateway. Wdrażanie próbuje włączyć
lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączone, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów zawsze włączonych lub wieloużytkownikowych rozważ usługę **systemową** zamiast
usługi użytkownika (lingering nie jest potrzebny). Zobacz [runbook Gateway](/pl/gateway), aby uzyskać notatki systemd.

## Powiązane dokumenty

- [Runbook Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia Gateway)
