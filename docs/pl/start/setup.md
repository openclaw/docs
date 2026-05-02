---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz mieć „najnowsze + najlepsze” bez psucia swojej własnej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-02T10:02:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwsze kroki](/pl/start/getting-started).
Szczegóły wdrażania znajdziesz w [Wdrażanie (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji na podstawie tego, jak często chcesz otrzymywać aktualizacje i czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowania znajdują się poza repozytorium:** trzymaj konfigurację i obszar roboczy w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy bleeding edge (dev):** uruchom Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie lokalnym.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, nadal obsługiwany)
- `pnpm` jest wymagany dla checkoutów źródłowych. OpenClaw w trybie deweloperskim ładuje dołączone pluginy z pakietów obszaru roboczego pnpm `extensions/*`, więc główne `npm install` nie przygotowuje pełnego drzewa źródłowego.
- Docker (opcjonalnie; tylko dla konfiguracji kontenerowej/e2e — zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (aby aktualizacje nie szkodziły)

Jeśli chcesz „100% dostosowania do mnie” _i_ łatwych aktualizacji, trzymaj swoje dostosowania w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/podobne do JSON5)
- **Obszar roboczy:** `~/.openclaw/workspace` (Skills, prompty, pamięci; zrób z niego prywatne repozytorium git)

Uruchom bootstrap raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego punktu wejścia CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze globalnej instalacji, uruchom to przez `pnpm openclaw setup`.

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowany CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ checklistę wdrażania/uprawnień (monity TCC).
3. Upewnij się, że Gateway jest ustawiony na **Local** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Sprawdzenie podstawowe:

```bash
openclaw health
```

Jeśli wdrażanie nie jest dostępne w Twoim buildzie:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Przepływ pracy bleeding edge (Gateway w terminalu)

Cel: praca nad TypeScript Gateway, hot reload, utrzymanie podłączonego UI aplikacji macOS.

### 0) (Opcjonalnie) Uruchom także aplikację macOS ze źródeł

Jeśli chcesz mieć też aplikację macOS na bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom deweloperski Gateway

```bash
pnpm install
# Tylko pierwsze uruchomienie (lub po zresetowaniu lokalnej konfiguracji/obszaru roboczego OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub restartuje proces obserwowania Gateway w nazwanej sesji tmux i automatycznie dołącza z interaktywnych terminali. Powłoki nieinteraktywne pozostają odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby utrzymać interaktywne uruchomienie w stanie odłączonym, albo `pnpm gateway:watch:raw` dla trybu obserwowania na pierwszym planie. Obserwator przeładowuje się przy istotnych zmianach źródeł, konfiguracji i metadanych dołączonych pluginów.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/obszaru roboczego dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` albo używaj `pnpm ui:dev` podczas rozwijania Control UI.

### 2) Skieruj aplikację macOS do działającego Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja podłączy się do działającego Gateway na skonfigurowanym porcie.

### 3) Weryfikacja

- Status Gateway w aplikacji powinien pokazywać **„Używanie istniejącego gateway …”**
- Albo przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Nieprawidłowy port:** domyślny WS Gateway to `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanału/providera: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modelu: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Używaj tego podczas debugowania uwierzytelniania lub decydowania, co zarchiwizować:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env albo `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: konfiguracja/env albo SecretRef (providery env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolonych parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modelu**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizacja (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie umieszczaj osobistych promptów/konfiguracji w repozytorium `openclaw`.
- Aktualizacja źródeł: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje Linux używają usługi **użytkownika** systemd. Domyślnie systemd zatrzymuje usługi użytkownika przy wylogowaniu/bezczynności, co zabija Gateway. Wdrażanie próbuje włączyć lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączony, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów zawsze włączonych lub wieloużytkownikowych rozważ usługę **systemową** zamiast usługi użytkownika (bez potrzeby lingerowania). Zobacz [Runbook Gateway](/pl/gateway), aby znaleźć notatki dotyczące systemd.

## Powiązane dokumenty

- [Runbook Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia Gateway)
