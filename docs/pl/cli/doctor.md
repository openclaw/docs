---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i chcesz przejść przez zalecane kroki naprawcze
    - Po aktualizacji chcesz wykonać kontrolę poprawności
summary: Referencja CLI dla `openclaw doctor` (kontrole stanu + prowadzone naprawy)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-05T08:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole stanu + szybkie poprawki dla Gateway i kanałów.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Przykłady

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opcje

- `--no-workspace-suggestions`: wyłącza sugestie pamięci/przeszukiwania obszaru roboczego
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy niezwiązane z usługami bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisywanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: generuje i konfiguruje token Gateway
- `--deep`: skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłasza ostatnie przekazania restartów nadzorcy Gateway

Uwagi:

- Monity interaktywne (takie jak poprawki pęku kluczy/OAuth) uruchamiają się tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez interfejsu (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie pluginów, dzięki czemu bezterminalowe kontrole stanu pozostają szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wymieniając każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` oraz uruchomienia bez interfejsu pozostawiają je na miejscu.
- Doctor skanuje również `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway z nadal działającymi lokalnymi klientami `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowane lokalne klienty TUI, aby odpowiedzi WhatsApp nie trafiały do kolejki za przestarzałymi pętlami odświeżania TUI.
- Doctor czyści starszy stan tymczasowy zależności pluginów utworzony przez starsze wersje OpenClaw. Naprawia też brakujące pluginy do pobrania, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawcy/wyszukiwania lub skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietów doctor pomija naprawę pluginów przez menedżera pakietów do czasu zakończenia podmiany pakietu; uruchom ponownie `openclaw doctor --fix` później, jeśli skonfigurowany plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis pluginu na następną próbę naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą wiszącą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając wpis `plugins.entries.<id>` którego dotyczy problem i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, dzięki czemu inne pluginy i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niezwiązane z usługami, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają ani nie stosują już normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor obejmuje kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających osadzeń.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora będącego człowiekiem, któremu wolno uruchamiać polecenia tylko dla właściciela i zatwierdzać niebezpieczne działania. Parowanie DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem pierwszego bootstrapu właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych na agenta, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy celowo wypromować.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje plików binarnych, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz zachować aktywną umiejętność.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, doctor zgłasza konkretny sygnał ostrzegawczy z remediacją (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru piaskownicy (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do dzielonych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje jawnych zastępczych danych uwierzytelniających.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od awaryjnych zmiennych środowiskowych, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozpoznawanie nazwy użytkownika Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozstrzygnięcia tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozpoznawanie dla tego przebiegu.

## macOS: nadpisania środowiska `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracyjny i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
