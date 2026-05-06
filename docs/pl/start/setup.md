---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz mieć „najnowsze + najlepsze” bez psucia swojej osobistej konfiguracji
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-06T09:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfigurujesz po raz pierwszy, zacznij od [Pierwsze kroki](/pl/start/getting-started).
Szczegóły onboardingu znajdziesz w [Onboarding (CLI)](/pl/start/wizard).
</Note>

## TL;DR

Wybierz workflow konfiguracji w zależności od tego, jak często chcesz aktualizować i czy chcesz samodzielnie uruchamiać Gateway:

- **Dostosowanie żyje poza repozytorium:** trzymaj konfigurację i workspace w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie dotykały.
- **Stabilny workflow (zalecany dla większości):** zainstaluj aplikację macOS i pozwól jej uruchamiać dołączony Gateway.
- **Workflow bleeding edge (dev):** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS podłączyć się w trybie Local.

## Wymagania wstępne (ze źródła)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, nadal obsługiwany)
- `pnpm` jest wymagany dla checkoutów źródłowych. OpenClaw ładuje dołączone pluginy z pakietów workspace pnpm
  `extensions/*` w trybie dev, więc główne `npm install`
  nie przygotowuje pełnego drzewa źródeł.
- Docker (opcjonalnie; tylko do konfiguracji skonteneryzowanej/e2e - zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (aby aktualizacje nie szkodziły)

Jeśli chcesz „w 100% dostosowane do mnie” _i_ łatwe aktualizacje, trzymaj swoją personalizację w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompty, pamięci; zrób z niego prywatne repozytorium git)

Jednorazowy bootstrap:

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

## Stabilny workflow (najpierw aplikacja macOS)

1. Zainstaluj i uruchom **OpenClaw.app** (pasek menu).
2. Ukończ checklistę onboardingu/uprawnień (prompty TCC).
3. Upewnij się, że Gateway jest **Local** i działa (aplikacja nim zarządza).
4. Połącz powierzchnie (przykład: WhatsApp):

```bash
openclaw channels login
```

5. Kontrola poprawności:

```bash
openclaw health
```

Jeśli onboarding nie jest dostępny w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie ręcznie uruchom Gateway (`openclaw gateway`).

## Workflow bleeding edge (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i utrzymywać podłączony UI aplikacji macOS.

### 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródeł

Jeśli chcesz także aplikację macOS w wersji bleeding edge:

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

`gateway:watch` uruchamia lub restartuje proces watch Gateway w nazwanej sesji tmux
i automatycznie podłącza się z interaktywnych terminali. Powłoki nieinteraktywne pozostają
odłączone i wypisują `tmux attach -t openclaw-gateway-watch-main`; użyj
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, aby pozostawić interaktywne uruchomienie
odłączone, albo `pnpm gateway:watch:raw` dla trybu watch na pierwszym planie. Watcher
przeładowuje się przy odpowiednich zmianach źródeł, konfiguracji i metadanych dołączonych pluginów. Jeśli
obserwowany Gateway zakończy działanie podczas startu, `gateway:watch` uruchamia
`openclaw doctor --fix --non-interactive` raz i ponawia próbę; ustaw
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, aby wyłączyć ten przebieg naprawczy tylko dla dev.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/workspace dla świeżego checkoutu.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` albo używaj `pnpm ui:dev` podczas rozwijania Control UI.

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Connection Mode: **Local**
  Aplikacja podłączy się do działającego gateway na skonfigurowanym porcie.

### 3) Zweryfikuj

- Status Gateway w aplikacji powinien pokazywać **"Using existing gateway …"**
- Albo przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Zły port:** Gateway WS domyślnie używa `ws://127.0.0.1:18789`; trzymaj aplikację i CLI na tym samym porcie.
- **Gdzie znajduje się stan:**
  - Stan kanału/providera: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Używaj tego podczas debugowania auth lub decydowania, co backupować:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env albo `channels.telegram.tokenFile` (tylko zwykły plik; symlinki odrzucane)
- **Token bota Discord**: config/env albo SecretRef (providery env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Allowlisty parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta niedomyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload sekretów oparty na pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Security](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez niszczenia konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „swoje rzeczy”; nie umieszczaj osobistych promptów/konfiguracji w repozytorium `openclaw`.
- Aktualizowanie źródeł: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje Linux używają usługi systemd **user**. Domyślnie systemd zatrzymuje usługi
użytkownika przy wylogowaniu/bezczynności, co zabija Gateway. Onboarding próbuje włączyć
lingering za Ciebie (może poprosić o sudo). Jeśli nadal jest wyłączony, uruchom:

```bash
sudo loginctl enable-linger $USER
```

Dla serwerów always-on lub wieloużytkownikowych rozważ usługę **system** zamiast
usługi użytkownika (lingering nie jest potrzebny). Zobacz [Gateway runbook](/pl/gateway), aby znaleźć notatki systemd.

## Powiązane dokumenty

- [Gateway runbook](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia gateway)
