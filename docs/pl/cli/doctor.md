---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z poprowadzonych napraw
    - Po aktualizacji chcesz wykonać szybkie sprawdzenie
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole kondycji + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-04-30T09:43:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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
- `--repair`: zastosuj zalecane naprawy bez pytania
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway

Uwagi:

- Interaktywne monity (takie jak poprawki pęku kluczy/OAuth) działają tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez interfejsu (Cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie pluginów, aby kontrole kondycji bez interfejsu pozostały szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Archiwizacja ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez interfejsu pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- Doctor naprawia brakujące zależności środowiska uruchomieniowego dołączonych pluginów bez zapisywania do spakowanych instalacji globalnych. Dla instalacji npm należących do roota lub wzmocnionych jednostek systemd ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na zapisywalny katalog, taki jak `/var/lib/openclaw/plugin-runtime-deps`; może to być też lista ścieżek, taka jak `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, gdzie wcześniejsze katalogi główne są warstwami wyszukiwania tylko do odczytu, a końcowy katalog główny jest celem naprawy.
- Doctor naprawia przestarzałą konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą wiszącą konfigurację kanałów, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając wpis `plugins.entries.<id>` objęty problemem i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już teraz pomija tylko ten wadliwy plugin, więc inne pluginy i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal raportuje kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz sprzątanie starszej usługi.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny program uruchamiający.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i pokrewne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie raportują już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala jedynie rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej wartości informacyjnej z naprawą (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje zastępczych poświadczeń w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie przedwcześnie.
- Automatyczne rozwiązywanie nazwy użytkownika Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozpoznania tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania env `launchctl`

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
