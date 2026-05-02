---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonych napraw
    - Po aktualizacji chcesz szybko sprawdzić poprawność
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-02T09:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania w obszarze roboczym
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługami bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway

Uwagi:

- Monity interaktywne (takie jak poprawki keychain/OAuth) działają tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez interfejsu (cron, Telegram, bez terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie Plugin, aby kontrole kondycji bez interfejsu pozostawały szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy kontrola potrzebuje ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez interfejsu pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych struktur zadań Cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie je znormalizować w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie WhatsApp Gateway, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Doctor czyści starszy stan przygotowania zależności Plugin utworzony przez starsze wersje OpenClaw. Naprawia też brakujące skonfigurowane Plugin do pobrania, gdy rejestr może je rozwiązać.
- Doctor naprawia nieaktualną konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie Plugin działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając objęty problemem wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy Plugin, więc pozostałe Plugin i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca odpowiada za cykl życia Gateway. Doctor nadal zgłasza kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługami, ale pomija instalowanie/uruchamianie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor obejmuje kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających osadzania.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala tylko komuś rozmawiać z botem; jeśli zatwierdzono nadawcę, zanim istniał bootstrap pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych na agenta, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które powinny zostać celowo awansowane.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej wartości sygnału wraz z remediacją (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje zapasowych danych uwierzytelniających w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od rezerwowego env, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników `allowFrom` Telegram (`doctor --fix`) wymaga możliwego do rozwiązania tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

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
