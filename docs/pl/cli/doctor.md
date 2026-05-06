---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z napraw prowadzonych krok po kroku
    - Po aktualizacji chcesz wykonać szybką kontrolę poprawności
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + naprawy prowadzone)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-06T09:05:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole stanu i szybkie poprawki dla Gateway oraz kanałów.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Audyt zabezpieczeń: [Zabezpieczenia](/pl/gateway/security)

## Przykłady

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/przeszukiwania obszaru roboczego
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługą bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia albo jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługą
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłoś ostatnie przekazania restartu nadzorcy Gateway

Uwagi:

- Monity interaktywne (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezgłowe (cron, Telegram, bez terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie Plugin, aby bezgłowe kontrole stanu pozostały szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy kontrola potrzebuje ich wkładu.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` w przypadku brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezgłowe pozostawiają je na miejscu.
- Doctor skanuje również `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych formatów zadań cron i może przepisać je na miejscu, zanim harmonogram będzie musiał automatycznie je znormalizować w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway przy nadal działających lokalnych klientach `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie były kolejkowane za przestarzałymi pętlami odświeżania TUI.
- Doctor przepisuje starsze odwołania do modeli `openai-codex/*` na kanoniczne odwołania `openai/*` w modelach podstawowych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i przestarzałych przypięciach tras sesji. `--fix` wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy Plugin Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma używalne OAuth; w przeciwnym razie wybiera `agentRuntime.id: "pi"`, aby trasa pozostała na domyślnym runnerze OpenClaw.
- Doctor czyści starszy stan przygotowania zależności Plugin utworzony przez starsze wersje OpenClaw. Naprawia też brakujące możliwe do pobrania Plugin, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia providerów/wyszukiwania lub skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietu doctor pomija naprawę Plugin przez menedżera pakietów, dopóki podmiana pakietu się nie zakończy; potem uruchom ponownie `openclaw doctor --fix`, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis Plugin na potrzeby następnej próby naprawy.
- Doctor naprawia przestarzałą konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.entries`, a także pasujące wiszące konfiguracje kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie Plugin działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Start Gateway już teraz pomija tylko ten wadliwy Plugin, dzięki czemu inne Plugin i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny supervisor zarządza cyklem życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszej usługi.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i pokrewne) do `talk.provider` + `talk.providers.<provider>`.
- Kolejne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających do osadzania.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora-człowieka uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala komuś tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapa pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy agenci w trybie Codex są skonfigurowani, a osobiste zasoby Codex CLI istnieją w domu Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych domów osobnych dla każdego agenta, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które powinny zostać świadomie wypromowane.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; zainstaluj/skonfiguruj brakujące wymaganie, jeśli chcesz utrzymać Skill jako aktywny.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej wartości informacyjnej z remediacją (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru piaskownicy (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do shardowanych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń awaryjnych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku środowiskowego, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozpoznawanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozpoznania tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozpoznawanie w tym przebiegu.

## macOS: nadpisania zmiennych środowiskowych `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor Gateway](/pl/gateway/doctor)
