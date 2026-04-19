---
read_when:
    - Konfigurowanie nowej maszyny
    - Chcesz mieć „najnowsze i najlepsze” bez psucia swojej osobistej konfiguracji
summary: Zaawansowana konfiguracja oraz przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-19T09:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Konfiguracja

<Note>
Jeśli konfigurujesz wszystko po raz pierwszy, zacznij od [Pierwsze kroki](/pl/start/getting-started).
Szczegóły wdrożenia znajdziesz w [Wdrożenie (CLI)](/pl/start/wizard).
</Note>

## W skrócie

- **Dostosowanie znajduje się poza repozytorium:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (konfiguracja).
- **Stabilny przepływ pracy:** zainstaluj aplikację macOS; pozwól jej uruchamiać dołączony Gateway.
- **Przepływ pracy bleeding edge:** uruchamiaj Gateway samodzielnie przez `pnpm gateway:watch`, a następnie pozwól aplikacji macOS dołączyć w trybie Local.

## Wymagania wstępne (ze źródeł)

- Zalecany Node 24 (Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany)
- Preferowany `pnpm` (lub Bun, jeśli celowo używasz [przepływu pracy Bun](/pl/install/bun))
- Docker (opcjonalnie; tylko do konfiguracji skonteneryzowanej/e2e — zobacz [Docker](/pl/install/docker))

## Strategia dostosowania (żeby aktualizacje nie sprawiały problemów)

Jeśli chcesz mieć „w 100% dostosowane do mnie” _i_ łatwe aktualizacje, trzymaj swoje dostosowania w:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (w stylu JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompty, pamięci; zrób z tego prywatne repozytorium git)

Jednorazowa inicjalizacja:

```bash
openclaw setup
```

Z poziomu tego repozytorium użyj lokalnego wpisu CLI:

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
2. Ukończ checklistę wdrożenia/uprawnień (monity TCC).
3. Upewnij się, że Gateway działa w trybie **Local** i jest uruchomiony (aplikacja nim zarządza).
4. Połącz powierzchnie komunikacyjne (na przykład: WhatsApp):

```bash
openclaw channels login
```

5. Szybka kontrola:

```bash
openclaw health
```

Jeśli wdrożenie nie jest dostępne w Twojej kompilacji:

- Uruchom `openclaw setup`, potem `openclaw channels login`, a następnie uruchom Gateway ręcznie (`openclaw gateway`).

## Przepływ pracy bleeding edge (Gateway w terminalu)

Cel: pracować nad TypeScript Gateway, mieć hot reload i nadal mieć podłączony interfejs aplikacji macOS.

### 0) (Opcjonalnie) Uruchom także aplikację macOS ze źródeł

Jeśli chcesz też mieć aplikację macOS w wersji bleeding edge:

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

`gateway:watch` uruchamia Gateway w trybie watch i przeładowuje go przy odpowiednich zmianach w źródłach,
konfiguracji i metadanych dołączonych Plugin.
`pnpm openclaw setup` to jednorazowy krok inicjalizacji lokalnej konfiguracji/workspace dla świeżo sklonowanego repozytorium.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, więc po zmianach w `ui/` uruchom ponownie `pnpm ui:build` albo użyj `pnpm ui:dev` podczas pracy nad Control UI.

Jeśli celowo używasz przepływu pracy Bun, równoważne polecenia to:

```bash
bun install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/workspace OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Skieruj aplikację macOS na działający Gateway

W **OpenClaw.app**:

- Tryb połączenia: **Local**
  Aplikacja dołączy do działającego gateway na skonfigurowanym porcie.

### 3) Zweryfikuj

- W aplikacji status Gateway powinien brzmieć **„Using existing gateway …”**
- Albo przez CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Niewłaściwy port:** domyślny WS Gateway to `ws://127.0.0.1:18789`; aplikacja i CLI muszą używać tego samego portu.
- **Gdzie znajduje się stan:**
  - Stan kanałów/providerów: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje: `~/.openclaw/agents/<agentId>/sessions/`
  - Logi: `/tmp/openclaw/`

## Mapa przechowywania poświadczeń

Użyj tego podczas debugowania uwierzytelniania albo przy decydowaniu, co warto zarchiwizować:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: config/env lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne są odrzucane)
- **Token bota Discord**: config/env lub SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: config/env (`channels.slack.*`)
- **Listy dozwolonych parowań**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów oparty na pliku (opcjonalny)**: `~/.openclaw/secrets.json`
- **Import starszego OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej szczegółów: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez demolowania konfiguracji)

- Traktuj `~/.openclaw/workspace` i `~/.openclaw/` jako „Twoje rzeczy”; nie umieszczaj osobistych promptów/konfiguracji w repozytorium `openclaw`.
- Aktualizacja źródeł: `git pull` + wybrany krok instalacji menedżera pakietów (`pnpm install` domyślnie; `bun install` dla przepływu pracy Bun) + dalsze używanie odpowiedniego polecenia `gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje na Linuxie używają usługi użytkownika systemd. Domyślnie systemd zatrzymuje
usługi użytkownika po wylogowaniu/bezczynności, co wyłącza Gateway. Wdrożenie próbuje
włączyć lingering za Ciebie (może wymagać sudo). Jeśli nadal jest wyłączone, uruchom:

```bash
sudo loginctl enable-linger $USER
```

W przypadku serwerów zawsze włączonych lub wieloużytkownikowych rozważ usługę **systemową** zamiast
usługi użytkownika (wtedy lingering nie jest potrzebny). Zobacz [Instrukcja operacyjna Gateway](/pl/gateway), aby poznać uwagi dotyczące systemd.

## Powiązana dokumentacja

- [Instrukcja operacyjna Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji + przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (tagi odpowiedzi + ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia gateway)
