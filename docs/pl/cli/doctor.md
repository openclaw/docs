---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonej naprawy
    - Zaktualizowano system i chcesz wykonać kontrolę poprawności
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + prowadzone naprawy)
title: doctor
x-i18n:
    generated_at: "2026-04-05T13:48:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Kontrole stanu + szybkie naprawy dla gateway i kanałów.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Bezpieczeństwo](/gateway/security)

## Przykłady

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opcje

- `--no-workspace-suggestions`: wyłącza sugestie pamięci/wyszukiwania workspace
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy bez pytania
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchamia bez pytań; tylko bezpieczne migracje
- `--generate-gateway-token`: generuje i konfiguruje token gateway
- `--deep`: skanuje usługi systemowe pod kątem dodatkowych instalacji gateway

Uwagi:

- Interaktywne podpowiedzi (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezobsługowe (cron, Telegram, brak terminala) pomijają podpowiedzi.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji i mogą archiwizować je jako `.deleted.<timestamp>`, aby bezpiecznie odzyskać miejsce.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je w miejscu, zanim scheduler będzie musiał automatycznie je normalizować w czasie działania.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń osadzania.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokim znaczeniu wraz z instrukcją naprawy (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje zapasowych poświadczeń jawnym tekstem.
- Jeśli inspekcja kanałowego SecretRef nie powiedzie się na ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Automatyczne rozwiązywanie nazw użytkowników w `allowFrom` Telegrama (`doctor --fix`) wymaga rozwiązywalnego tokena Telegrama w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
