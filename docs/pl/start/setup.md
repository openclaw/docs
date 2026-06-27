---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz „najnowsze i najlepsze” bez psucia swojej osobistej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-27T18:23:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwszych kroków](/pl/start/getting-started).
Szczegóły onboardingu znajdziesz w [Onboarding (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji na podstawie tego, jak często chcesz aktualizować i czy chcesz samodzielnie uruchamiać Gateway:

- **Personalizacja żyje poza repozytorium:** trzymaj konfigurację i obszar roboczy w `~/.openclaw/openclaw.json` i `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy na najnowszej wersji rozwojowej (dev):** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie lokalnym.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.19+`, nadal obsługiwany)
- `pnpm` jest wymagany dla checkoutów ze źródeł. OpenClaw ładuje dołączone pluginy z pakietów przestrzeni roboczej pnpm
  `extensions/*` w trybie dev, więc główne `npm install` nie przygotowuje
  pełnego drzewa źródeł.
- Docker (opcjonalnie; tylko dla konfiguracji/e2e w kontenerach - zobacz [Docker](/pl/install/docker))

## Strategia personalizacji (aby aktualizacje nie szkodziły)

Jeśli chcesz „100% dopasowania do mnie” _i_ łatwych aktualizacji, trzymaj swoją personalizację w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (w stylu JSON/JSON5)
- **Obszar roboczy:** `~/.openclaw/workspace` (Skills, prompty, pamięci; zrób z niego prywatne repozytorium git)

Zainicjalizuj raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego punktu wejścia CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw setup`.

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowane CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ listę kontrolną onboardingu/uprawnień (monity TCC).
3. Upewnij się, że Gateway jest **lokalny** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Kontrola poprawności:

```bash
openclaw health
```

Jeśli onboarding nie jest dostępny w twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Przepływ pracy na najnowszej wersji rozwojowej (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i utrzymać podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom również aplikację macOS ze źródeł

Jeśli chcesz także mieć aplikację macOS na najnowszej wersji rozwojowej:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom dev Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub restartuje proces obserwujący Gateway w nazwanej
sesji tmux i automatycznie dołącza z interaktywnych terminali. Powłoki nieinteraktywne pozostają
odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby zachować odłączone uruchomienie
interaktywne, albo `pnpm gateway:watch:raw` dla trybu obserwacji na pierwszym planie. Obserwator
przeładowuje się przy istotnych zmianach źródeł, konfiguracji i metadanych dołączonych pluginów. Jeśli
obserwowany Gateway zakończy działanie podczas startu, `gateway:watch` uruchamia
`openclaw doctor --fix --non-interactive` jeden raz i próbuje ponownie; ustaw
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, aby wyłączyć ten wyłącznie deweloperski przebieg naprawczy.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/obszaru roboczego dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` albo używaj `pnpm ui:dev` podczas rozwijania Control UI.

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Tryb połączenia: **lokalny**
  Aplikacja podłączy się do działającego gatewaya na skonfigurowanym porcie.

### 3) Zweryfikuj

- Status Gateway w aplikacji powinien brzmieć **„Używa istniejącego gatewaya …”**
- Albo przez CLI:

```bash
openclaw health
```

### Częste pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanału/providera: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modelu: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania lub decydowania, co archiwizować:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki odrzucane)
- **Token bota Discord**: konfiguracja/env lub SecretRef (providery env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolonego parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modelu**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie wkładaj osobistych promptów/konfiguracji do repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje na Linuksie używają usługi **użytkownika** systemd. Domyślnie systemd zatrzymuje usługi
użytkownika po wylogowaniu/bezczynności, co zabija Gateway. Onboarding próbuje włączyć
utrzymywanie usług po wylogowaniu za ciebie (może poprosić o sudo). Jeśli nadal jest wyłączone, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów always-on lub wieloużytkownikowych rozważ usługę **systemową** zamiast
usługi użytkownika (utrzymywanie po wylogowaniu nie jest potrzebne). Zobacz [runbook Gateway](/pl/gateway), aby poznać notatki systemd.

## Powiązana dokumentacja

- [Runbook Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia gatewaya)
