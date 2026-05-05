---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz przeprowadzić naprawę krok po kroku
    - Po aktualizacji chcesz sprawdzić poprawność
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
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

- `--no-workspace-suggestions`: wyłącza sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy niedotyczące usług bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia albo jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez pytań; tylko bezpieczne migracje i naprawy niedotyczące usług
- `--generate-gateway-token`: generuje i konfiguruje token Gateway
- `--deep`: skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway

Uwagi:

- Interaktywne monity (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bez terminala (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie Plugin, aby bezterminalowe kontrole stanu pozostały szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy dana kontrola wymaga ich wkładu.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Ich archiwizacja jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez terminala pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je w miejscu, zanim scheduler będzie musiał automatycznie normalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie WhatsApp Gateway, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Doctor czyści starszy stan stagingu zależności Plugin utworzony przez starsze wersje OpenClaw. Naprawia także brakujące pobieralne Plugin, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawców/wyszukiwania lub skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietów doctor pomija naprawę Plugin przez menedżera pakietów, dopóki wymiana pakietu nie zostanie ukończona; uruchom potem ponownie `openclaw doctor --fix`, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis Plugin na potrzeby następnej próby naprawy.
- Doctor naprawia nieaktualną konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie Plugin działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już pomija tylko ten wadliwy Plugin, więc inne Plugin i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny supervisor zarządza cyklem życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niedotyczące usług, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor obejmuje kontrolę gotowości wyszukiwania pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora-człowieka uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex i osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych per agent, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy świadomie wypromować.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills przez `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz pozostawić daną skill aktywną.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza wyraźne ostrzeżenie z remediacją (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do shardowanych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń awaryjnych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku env, a `TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN` są niedostępne dla procesu doctor.
- Automatyczne rozwiązywanie nazwy użytkownika Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozwiązania tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

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
- [Gateway doctor](/pl/gateway/doctor)
