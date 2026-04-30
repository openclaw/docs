---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i chcesz skorzystać z prowadzonych napraw
    - Po aktualizacji chcesz wykonać kontrolę poprawności
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy prowadzone)
title: Diagnostyka
x-i18n:
    generated_at: "2026-04-30T20:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
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

- `--no-workspace-suggestions`: wyłącza sugestie pamięci obszaru roboczego/wyszukiwania
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy bez pytania
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisywanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez monitów; tylko bezpieczne migracje
- `--generate-gateway-token`: generuje i konfiguruje token Gateway
- `--deep`: skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway

Uwagi:

- Interaktywne monity (takie jak poprawki pęku kluczy/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bezgłowe (cron, Telegram, bez terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie pluginów, dzięki czemu bezgłowe kontrole kondycji pozostają szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezgłowe pozostawiają je na miejscu.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) w poszukiwaniu starszych kształtów zadań cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- Doctor naprawia brakujące zależności uruchomieniowe dołączonych pluginów bez zapisywania do spakowanych instalacji globalnych. W przypadku instalacji npm należących do roota lub utwardzonych jednostek systemd ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na zapisywalny katalog, taki jak `/var/lib/openclaw/plugin-runtime-deps`; może to być też lista ścieżek, taka jak `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, gdzie wcześniejsze katalogi główne są warstwami wyszukiwania tylko do odczytu, a końcowy katalog główny jest celem naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa prawidłowo.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, więc inne pluginy i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal raportuje kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalowanie/uruchamianie/restart/bootstrap usługi oraz czyszczenie starszej usługi.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia działającej usługi Gateway systemd. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają ani nie stosują już normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń osadzania.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala tylko komuś rozmawiać z botem; jeśli zatwierdziłeś nadawcę, zanim istniał bootstrap pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowani są agenci w trybie Codex i w katalogu domowym Codex operatora istnieją osobiste zasoby Codex CLI. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych dla poszczególnych agentów, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy awansować celowo.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza wyraźne ostrzeżenie z działaniem naprawczym (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń awaryjnych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie przedwcześnie.
- Automatyczne rozwiązywanie nazwy użytkownika Telegram `allowFrom` (`doctor --fix`) wymaga rozwiązywalnego tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiłeś `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracyjny i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
