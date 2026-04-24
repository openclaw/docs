---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz prowadzonych poprawek
    - Zaktualizowałeś OpenClaw i chcesz wykonać podstawowe sprawdzenie poprawności
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + prowadzone naprawy)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Kontrole stanu + szybkie naprawy dla gateway i kanałów.

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
- `--repair`: stosuje zalecane naprawy bez pytania
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez promptów; tylko bezpieczne migracje
- `--generate-gateway-token`: generuje i konfiguruje token gateway
- `--deep`: skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gateway

Uwagi:

- Interaktywne prompty (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia headless (cron, Telegram, brak terminala) pomijają prompty.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają wstępne ładowanie Pluginów, aby headless kontrole stanu pozostały szybkie. Sesje interaktywne nadal w pełni ładują Pluginy, gdy kontrola wymaga ich wkładu.
- `--fix` (alias `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji i mogą archiwizować je jako `.deleted.<timestamp>`, aby bezpiecznie odzyskać miejsce.
- Doctor skanuje również `~/.openclaw/cron/jobs.json` (lub `cron.store`) w poszukiwaniu starszych kształtów zadań cron i może przepisać je na miejscu, zanim harmonogram będzie musiał automatycznie normalizować je w runtime.
- Doctor naprawia brakujące zależności runtime dołączonych Pluginów bez wymagania dostępu do zapisu do zainstalowanego pakietu OpenClaw. W przypadku instalacji npm należących do roota lub utwardzonych jednostek systemd ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na katalog z prawem zapisu, taki jak `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie raportują już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń osadzania.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej czytelności z zaleceniem naprawy (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje jawnych zastępczych poświadczeń.
- Jeśli inspekcja SecretRef kanału zakończy się niepowodzeniem w ścieżce naprawy, doctor kontynuuje działanie i zgłasza ostrzeżenie zamiast kończyć pracę przedwcześnie.
- Automatyczne rozstrzyganie nazwy użytkownika Telegram w `allowFrom` (`doctor --fix`) wymaga tokenu Telegram możliwego do rozstrzygnięcia w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozstrzyganie w tym przebiegu.

## macOS: nadpisania zmiennych środowiskowych `launchctl`

Jeśli wcześniej uruchomiłeś `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor gateway](/pl/gateway/doctor)
