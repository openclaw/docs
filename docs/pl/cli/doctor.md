---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i chcesz uzyskać wskazówki dotyczące ich naprawy
    - Po aktualizacji chcesz sprawdzić, czy wszystko działa poprawnie
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + prowadzone naprawy)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-04T02:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole stanu i szybkie poprawki dla Gateway oraz kanałów.

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

- `--no-workspace-suggestions`: wyłącza sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy niezwiązane z usługą bez pytania; instalacje i ponowne zapisy usług Gateway nadal wymagają interaktywnego potwierdzenia albo jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisywanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługą
- `--generate-gateway-token`: generuje i konfiguruje token Gateway
- `--deep`: skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway

Uwagi:

- Interaktywne monity (takie jak poprawki pęku kluczy/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezinterfejsowe (cron, Telegram, bez terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie pluginów, aby bezinterfejsowe kontrole stanu pozostawały szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie zapisuje ponownie poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezinterfejsowe pozostawiają je na miejscu.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie normalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Doctor czyści starszy stan etapowania zależności pluginów utworzony przez starsze wersje OpenClaw. Naprawia też brakujące skonfigurowane pluginy do pobrania, gdy rejestr potrafi je rozwiązać, a przebieg doctor w wersji 2026.5.2 automatycznie instaluje pluginy do pobrania, których starsza konfiguracja już używa, zanim oznaczy konfigurację jako dotkniętą dla tego wydania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis pluginu na kolejną próbę naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą wiszącą konfigurację kanału, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, dzięki czemu inne pluginy i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszej usługi.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora będącego człowiekiem, któremu wolno uruchamiać polecenia tylko dla właściciela i zatwierdzać niebezpieczne działania. Parowanie DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy agenci w trybie Codex są skonfigurowani, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych dla każdego agenta, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy świadomie wypromować.
- Doctor ostrzega, gdy skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku wykonawczym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji albo wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz zachować aktywną skill.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, doctor zgłasza konkretny komunikat ostrzegawczy z działaniem naprawczym (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli istnieją starsze pliki rejestru piaskownicy (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do podzielonych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń zastępczych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od zastępczych zmiennych środowiskowych, a `TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozwiązania tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania środowiska `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (albo `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
