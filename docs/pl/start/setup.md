---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz mieć „najnowsze i najlepsze” bez psucia własnej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-07T13:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwszych kroków](/pl/start/getting-started).
Szczegóły wdrażania znajdziesz w [Wdrażanie (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji na podstawie tego, jak często chcesz otrzymywać aktualizacje i czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowanie znajduje się poza repozytorium:** trzymaj konfigurację i obszar roboczy w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy na najnowszych zmianach (dev):** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie lokalnym.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.16+`, nadal obsługiwany)
- `pnpm` jest wymagany dla checkoutów źródłowych. OpenClaw ładuje dołączone pluginy z pakietów obszaru roboczego pnpm
  `extensions/*` w trybie dev, więc główne `npm install` nie przygotowuje
  pełnego drzewa źródeł.
- Docker (opcjonalnie; tylko dla konfiguracji kontenerowej/e2e - zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (aby aktualizacje nie szkodziły)

Jeśli chcesz „100% dostosowane do mnie” _i_ łatwe aktualizacje, trzymaj własne dostosowania w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/około JSON5)
- **Obszar roboczy:** `~/.openclaw/workspace` (Skills, prompty, pamięci; zrób z niego prywatne repozytorium git)

Zainicjuj raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego wpisu CLI:

```bash
openclaw setup
```

Jeśli nie masz jeszcze instalacji globalnej, uruchom przez `pnpm openclaw setup`.

## Uruchamianie Gateway z tego repozytorium

Po `pnpm build` możesz uruchomić spakowane CLI bezpośrednio:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny przepływ pracy (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ listę kontrolną wdrażania/uprawnień (prompty TCC).
3. Upewnij się, że Gateway jest **lokalny** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Sprawdzenie poprawności:

```bash
openclaw health
```

Jeśli wdrażanie nie jest dostępne w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Przepływ pracy na najnowszych zmianach (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć przeładowywanie na gorąco i utrzymywać podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródeł

Jeśli chcesz mieć także aplikację macOS na najnowszych zmianach:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom Gateway dev

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub restartuje proces obserwowania Gateway w nazwanej
sesji tmux i automatycznie podłącza się z terminali interaktywnych. Powłoki nieinteraktywne pozostają
odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby utrzymać interaktywne uruchomienie
odłączone, albo `pnpm gateway:watch:raw` dla trybu obserwowania na pierwszym planie. Obserwator
przeładowuje się przy istotnych zmianach źródeł, konfiguracji i metadanych dołączonych pluginów. Jeśli
obserwowany Gateway zakończy działanie podczas startu, `gateway:watch` uruchamia
`openclaw doctor --fix --non-interactive` raz i ponawia próbę; ustaw
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, aby wyłączyć tę naprawę tylko dla dev.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/obszaru roboczego dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc uruchom ponownie `pnpm ui:build` po zmianach w `ui/` albo używaj `pnpm ui:dev` podczas rozwijania interfejsu sterowania.

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Tryb połączenia: **lokalny**
  Aplikacja podłączy się do działającego gateway na skonfigurowanym porcie.

### 3) Weryfikacja

- Status Gateway w aplikacji powinien brzmieć **„Używanie istniejącego gateway …”**
- Albo przez CLI:

```bash
openclaw health
```

### Częste pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanału/providera: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania lub decydowania, co uwzględnić w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env albo `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: konfiguracja/env albo SecretRef (providery env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolone dla parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie wkładaj osobistych promptów/konfiguracji do repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje Linux używają usługi systemd **użytkownika**. Domyślnie systemd zatrzymuje usługi
użytkownika po wylogowaniu/bezczynności, co zabija Gateway. Wdrażanie próbuje włączyć
lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączone, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów zawsze włączonych lub wieloużytkownikowych rozważ usługę **systemową** zamiast
usługi użytkownika (bez potrzeby lingering). Zobacz [runbook Gateway](/pl/gateway), aby uzyskać notatki systemd.

## Powiązane dokumenty

- [Runbook Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia gateway)
