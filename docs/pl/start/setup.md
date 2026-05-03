---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz mieć „najnowsze + najlepsze” bez psucia swojej osobistej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-03T21:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwszych kroków](/pl/start/getting-started).
Szczegóły wdrażania znajdziesz w [Wdrażaniu (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz przepływ konfiguracji na podstawie tego, jak często chcesz aktualizować i czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowania pozostają poza repozytorium:** trzymaj konfigurację i obszar roboczy w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie naruszały.
- **Stabilny przepływ pracy (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy na najnowszej wersji (dev):** uruchom Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie lokalnym.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, nadal obsługiwany)
- `pnpm` jest wymagany dla checkoutów źródłowych. OpenClaw ładuje dołączone plugins z pakietów obszaru roboczego pnpm `extensions/*` w trybie dev, więc główne `npm install` nie przygotowuje pełnego drzewa źródeł.
- Docker (opcjonalnie; tylko do konfiguracji skonteneryzowanej/e2e — zobacz [Docker](/pl/install/docker))

## Strategia dostosowywania (aby aktualizacje nie szkodziły)

Jeśli chcesz „100% dostosowane do mnie” _i_ łatwych aktualizacji, trzymaj swoje dostosowania w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Obszar roboczy:** `~/.openclaw/workspace` (skills, prompty, pamięci; zrób z niego prywatne repozytorium git)

Zainicjalizuj raz:

```bash
openclaw setup
```

Z wnętrza tego repozytorium użyj lokalnego wejścia CLI:

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
2. Ukończ listę kontrolną wdrażania/uprawnień (monity TCC).
3. Upewnij się, że Gateway jest w trybie **Local** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Sprawdzenie poprawności:

```bash
openclaw health
```

Jeśli wdrażanie nie jest dostępne w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie uruchom Gateway ręcznie (`openclaw gateway`).

## Przepływ pracy na najnowszej wersji (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, uzyskać hot reload, utrzymać UI aplikacji macOS podłączone.

### 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródeł

Jeśli chcesz także aplikacji macOS na najnowszej wersji:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchom dev Gateway

```bash
pnpm install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/obszaru roboczego OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub restartuje proces obserwowania Gateway w nazwanej sesji tmux i automatycznie dołącza z terminali interaktywnych. Powłoki nieinteraktywne pozostają odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby utrzymać interaktywne uruchomienie odłączone, albo `pnpm gateway:watch:raw` dla trybu obserwowania na pierwszym planie. Obserwator przeładowuje po istotnych zmianach źródeł, konfiguracji i metadanych dołączonych plugins. Jeśli obserwowany Gateway zakończy działanie podczas startu, `gateway:watch` uruchamia raz `openclaw doctor --fix --non-interactive` i ponawia próbę; ustaw `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, aby wyłączyć tę naprawę tylko dla trybu dev.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/obszaru roboczego dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc uruchom ponownie `pnpm ui:build` po zmianach w `ui/` albo używaj `pnpm ui:dev` podczas rozwijania Control UI.

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja podłączy się do działającego Gateway na skonfigurowanym porcie.

### 3) Zweryfikuj

- Status Gateway w aplikacji powinien brzmieć **„Używanie istniejącego gateway …”**
- Albo przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; utrzymuj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanału/providera: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modelu: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania lub decydowania, co uwzględnić w kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/env lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane)
- **Token bota Discord**: konfiguracja/env lub SecretRef (providery env/file/exec)
- **Tokeny Slack**: konfiguracja/env (`channels.slack.*`)
- **Listy dozwolonych dla parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modelu**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez zniszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie umieszczaj osobistych promptów/konfiguracji w repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje na Linux używają usługi **użytkownika** systemd. Domyślnie systemd zatrzymuje usługi użytkownika po wylogowaniu/bezczynności, co zabija Gateway. Wdrażanie próbuje włączyć lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączone, uruchom:

```bash
sudo loginctl enable-linger $USER
```

W przypadku serwerów zawsze włączonych lub wieloużytkownikowych rozważ usługę **systemową** zamiast usługi użytkownika (lingering nie jest potrzebny). Zobacz [Runbook Gateway](/pl/gateway), aby poznać uwagi dotyczące systemd.

## Powiązane dokumenty

- [Runbook Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia Gateway)
