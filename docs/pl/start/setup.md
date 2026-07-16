---
read_when:
    - Konfigurowanie nowego komputera
    - Chcesz mieć „najnowsze i najlepsze” rozwiązania bez naruszania swojej konfiguracji osobistej
summary: Zaawansowana konfiguracja i przepływy pracy programistycznej dla OpenClaw
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-16T19:08:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Jeśli konfiguracja jest przeprowadzana po raz pierwszy, należy zacząć od [Pierwszych kroków](/pl/start/getting-started).
Szczegółowe informacje o wdrażaniu zawiera strona [Wdrażanie (CLI)](/pl/start/wizard).
</Note>

## W skrócie

Należy wybrać sposób konfiguracji zależnie od oczekiwanej częstotliwości aktualizacji i tego, czy Gateway ma być uruchamiany samodzielnie:

- **Dostosowania znajdują się poza repozytorium:** konfigurację i obszar roboczy należy przechowywać w `~/.openclaw/openclaw.json` oraz `~/.openclaw/workspace/`, aby aktualizacje repozytorium ich nie modyfikowały.
- **Stabilny sposób pracy (zalecany dla większości użytkowników):** należy zainstalować aplikację macOS i pozwolić jej uruchamiać dołączony Gateway.
- **Sposób pracy z najnowszą wersją rozwojową (dev):** należy samodzielnie uruchomić Gateway za pomocą `pnpm gateway:watch`, a następnie połączyć z nim aplikację macOS w trybie Local.

## Wymagania wstępne (dla kodu źródłowego)

- Zalecany jest Node 24.15+ (Node 22 LTS, obecnie `22.22.3+`, jest nadal obsługiwany)
- `pnpm` jest wymagane w przypadku kopii roboczych kodu źródłowego. W trybie programistycznym OpenClaw ładuje dołączone pluginy z pakietów obszaru roboczego pnpm
  `extensions/*`, dlatego główne polecenie `npm install` nie
  przygotowuje całego drzewa źródłowego.
- Docker (opcjonalnie; tylko do konfiguracji kontenerowej/E2E — zobacz [Docker](/pl/install/docker))

## Strategia dostosowywania (aby aktualizacje nie powodowały problemów)

Aby uzyskać konfigurację „w 100% dostosowaną do własnych potrzeb” _i_ łatwe aktualizacje, własne ustawienia należy przechowywać w następujących lokalizacjach:

- **Konfiguracja:** `~/.openclaw/openclaw.json` (JSON/format zbliżony do JSON5)
- **Obszar roboczy:** `~/.openclaw/workspace` (Skills, prompty, wspomnienia; warto utworzyć z niego prywatne repozytorium git)

Foldery konfiguracji i obszaru roboczego można jednorazowo zainicjować bez uruchamiania pełnego kreatora wdrażania:

```bash
openclaw setup --baseline
```

Nie przeprowadzono jeszcze instalacji globalnej? Zamiast tego należy uruchomić polecenie z tego repozytorium:

```bash
pnpm openclaw setup --baseline
```

(Samo `openclaw setup`, bez `--baseline`, jest aliasem polecenia `openclaw onboard` i uruchamia pełny interaktywny kreator).

## Uruchamianie Gateway z tego repozytorium

Po wykonaniu `pnpm build` można bezpośrednio uruchomić spakowane CLI:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabilny sposób pracy (najpierw aplikacja macOS)

1. Należy zainstalować i uruchomić aplikację **OpenClaw.app** (na pasku menu).
2. Należy wykonać listę kontrolną wdrażania i uprawnień (monity TCC).
3. Należy upewnić się, że Gateway działa w trybie **Local** (zarządza nim aplikacja).
4. Należy połączyć kanały (na przykład WhatsApp):

```bash
openclaw channels login
```

5. Kontrola poprawności:

```bash
openclaw health
```

Jeśli wdrażanie nie jest dostępne w używanej kompilacji:

- Należy uruchomić `openclaw setup`, następnie `openclaw channels login`, a potem ręcznie uruchomić Gateway (`openclaw gateway`).

## Sposób pracy z najnowszą wersją rozwojową (Gateway w terminalu)

Cel: praca nad Gateway napisanym w TypeScript, automatyczne przeładowywanie i zachowanie połączenia z interfejsem aplikacji macOS.

### 0) (Opcjonalnie) Uruchamianie również aplikacji macOS z kodu źródłowego

Aby używać także najnowszej wersji rozwojowej aplikacji macOS:

```bash
./scripts/restart-mac.sh
```

### 1) Uruchamianie deweloperskiego Gateway

```bash
pnpm install
# Tylko przy pierwszym uruchomieniu (lub po zresetowaniu lokalnej konfiguracji/obszaru roboczego OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` uruchamia lub ponownie uruchamia proces obserwujący Gateway w nazwanej sesji tmux
(`openclaw-gateway-watch-main`) i automatycznie dołącza do niej z interaktywnych
terminali. Powłoki nieinteraktywne pozostają odłączone i wyświetlają
`tmux attach -t openclaw-gateway-watch-main`; aby interaktywne uruchomienie
pozostało odłączone, należy użyć `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`,
a do uruchomienia obserwatora na pierwszym planie — `pnpm gateway:watch:raw`. Przed przejęciem
skonfigurowanego/domyślnego portu obserwator zatrzymuje zainstalowaną usługę Gateway aktywnego profilu,
zapobiegając zastąpieniu procesu źródłowego przez nadzorcę usługi.
Usługa pozostaje zainstalowana; po zakończeniu obserwowania należy uruchomić `pnpm openclaw gateway start`.
Panel tmux pozostaje dostępny po nieudanym uruchomieniu,
dzięki czemu inny terminal lub agent może się do niego dołączyć albo przechwycić jego dzienniki. Obserwator
przeładowuje proces po istotnych zmianach kodu źródłowego, konfiguracji i metadanych dołączonych pluginów. Jeśli
obserwowany Gateway zakończy działanie podczas uruchamiania, `gateway:watch` jednokrotnie uruchamia
`openclaw doctor --fix --non-interactive` i ponawia próbę; aby wyłączyć tę naprawę przeznaczoną wyłącznie dla trybu programistycznego,
należy ustawić `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`.
`pnpm gateway:watch` nie przebudowuje `dist/control-ui`, dlatego po zmianach w `ui/` należy ponownie uruchomić `pnpm ui:build` lub podczas tworzenia interfejsu Control UI używać `pnpm ui:dev`.

### 2) Łączenie aplikacji macOS z uruchomionym Gateway

W aplikacji **OpenClaw.app**:

- Connection Mode: **Local**
  Aplikacja połączy się z uruchomionym Gateway na skonfigurowanym porcie.

### 3) Weryfikacja

- Stan Gateway w aplikacji powinien brzmieć **"Using existing gateway …"**
- Alternatywnie za pośrednictwem CLI:

```bash
openclaw health
```

### Typowe pułapki

- **Nieprawidłowy port:** domyślny port WS Gateway to `ws://127.0.0.1:18789`; aplikacja i CLI muszą korzystać z tego samego portu.
- **Lokalizacje przechowywania stanu:**
  - Stan kanałów/dostawców: `~/.openclaw/credentials/`
  - Profile uwierzytelniania modeli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesje i transkrypcje: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Starsze/archiwalne artefakty sesji: `~/.openclaw/agents/<agentId>/sessions/`
  - Dzienniki: `/tmp/openclaw/`

## Mapa przechowywania danych uwierzytelniających

Przydaje się podczas debugowania uwierzytelniania lub wybierania danych do utworzenia kopii zapasowej:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bota Telegram**: konfiguracja/zmienna środowiskowa lub `channels.telegram.tokenFile` (wyłącznie zwykły plik; dowiązania symboliczne są odrzucane)
- **Token bota Discord**: konfiguracja/zmienna środowiskowa lub SecretRef (dostawcy env/file/exec)
- **Tokeny Slack**: konfiguracja/zmienna środowiskowa (`channels.slack.*`)
- **Listy dozwolone parowania**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (konto domyślne)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (konta inne niż domyślne)
- **Profile uwierzytelniania modeli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Ładunek sekretów przechowywany w pliku (opcjonalnie)**: `~/.openclaw/secrets.json`
- **Import starszych danych OAuth**: `~/.openclaw/credentials/oauth.json`
  Więcej informacji: [Bezpieczeństwo](/pl/gateway/security#credential-storage-map).

## Aktualizowanie (bez niszczenia konfiguracji)

- `~/.openclaw/workspace` i `~/.openclaw/` należy traktować jako „własne dane”; osobistych promptów ani konfiguracji nie należy umieszczać w repozytorium `openclaw`.
- Aktualizowanie kodu źródłowego: `git pull` + `pnpm install` + dalsze używanie `pnpm gateway:watch`.

## Linux (usługa użytkownika systemd)

Instalacje w systemie Linux korzystają z usługi systemd typu **user**. Domyślnie systemd zatrzymuje usługi
użytkownika po wylogowaniu lub podczas bezczynności, co powoduje zakończenie działania Gateway. Proces wdrażania próbuje włączyć
pozostawianie usług użytkownika w tle (może wyświetlić monit o użycie sudo). Jeśli nadal jest wyłączone, należy uruchomić:

```bash
sudo loginctl enable-linger $USER
```

W przypadku serwerów działających stale lub obsługujących wielu użytkowników warto rozważyć usługę typu **system** zamiast
usługi użytkownika (pozostawianie w tle nie jest wtedy potrzebne). Uwagi dotyczące systemd zawiera [podręcznik operacyjny Gateway](/pl/gateway).

## Powiązana dokumentacja

- [Podręcznik operacyjny Gateway](/pl/gateway) (flagi, nadzór, porty)
- [Konfiguracja Gateway](/pl/gateway/configuration) (schemat konfiguracji i przykłady)
- [Discord](/pl/channels/discord) i [Telegram](/pl/channels/telegram) (znaczniki odpowiedzi i ustawienia replyToMode)
- [Konfiguracja asystenta OpenClaw](/pl/start/openclaw)
- [Aplikacja macOS](/pl/platforms/macos) (cykl życia Gateway)
