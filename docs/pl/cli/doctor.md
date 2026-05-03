---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i chcesz skorzystać z napraw krok po kroku
    - Po aktualizacji chcesz sprawdzić poprawność
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-03T21:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole kondycji + szybkie poprawki dla Gateway i kanałów.

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

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługami bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway

Uwagi:

- Monity interaktywne (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez terminala (Cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie pluginów, dzięki czemu kontrole kondycji bez terminala pozostają szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez terminala pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je w miejscu, zanim scheduler będzie musiał automatycznie znormalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie Gateway WhatsApp, gdy Cron nie ma środowiska magistrali użytkownika systemd.
- Doctor czyści starszy stan stagingu zależności pluginów utworzony przez starsze wersje OpenClaw. Naprawia też brakujące skonfigurowane pluginy do pobrania, gdy rejestr może je rozpoznać, a przebieg doctor z 2026.5.2 automatycznie instaluje pluginy do pobrania, których starsza konfiguracja już używa, zanim oznaczy konfigurację jako dotkniętą w tym wydaniu.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanału, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa prawidłowo.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, dzięki czemu inne pluginy i kanały mogą dalej działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal zgłasza kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługami, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi Gateway systemd podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embeddingu.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych per agent, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy świadomie wypromować.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills przez `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz zachować aktywną umiejętność.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza konkretnie przydatne ostrzeżenie z naprawą (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do shardowanych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje awaryjnych poświadczeń w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od awaryjnego env, a `TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozpoznawanie nazwy użytkownika Telegram `allowFrom` (`doctor --fix`) wymaga rozpoznawalnego tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozpoznawanie dla tego przebiegu.

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
