---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i potrzebujesz wskazówek dotyczących naprawy.
    - Po aktualizacji chcesz przeprowadzić kontrolę poprawności
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole kondycji + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-02T20:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole stanu + szybkie naprawy dla Gateway i kanałów.

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
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługą bez pytania; instalacje i przepisywanie usług Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługą
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway

Uwagi:

- Monity interaktywne (takie jak poprawki pęku kluczy/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezobsługowe (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają chętne ładowanie Plugin, dzięki czemu bezobsługowe kontrole stanu pozostają szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy kontrola wymaga ich wkładu.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wymieniając każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić program uruchamiający.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezobsługowe pozostawiają je na miejscu.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie WhatsApp Gateway, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Doctor czyści starszy stan etapowania zależności Plugin utworzony przez starsze wersje OpenClaw. Naprawia też brakujące skonfigurowane Plugin do pobrania, gdy rejestr może je rozwiązać, a przebieg doctor z 2026.5.2 automatycznie instaluje Plugin do pobrania, których starsza konfiguracja już używa, zanim oznaczy konfigurację jako dotkniętą dla tego wydania.
- Doctor naprawia nieaktualną konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.entries`, wraz z pasującą osieroconą konfiguracją kanałów, celami heartbeat i nadpisaniami modeli kanałów, gdy wykrywanie Plugin działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy Plugin, więc inne Plugin i kanały mogą dalej działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal raportuje stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny program uruchamiający.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i powiązane) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor obejmuje kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających osadzania.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora, które może uruchamiać polecenia tylko dla właściciela i zatwierdzać niebezpieczne działania. Parowanie przez DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy agenci w trybie Codex są skonfigurowani, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych na agenta, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy świadomie awansować.
- Doctor ostrzega, gdy skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz utrzymać skill aktywny.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, doctor zgłasza wyraźne ostrzeżenie z naprawą (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń awaryjnych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od awaryjnego środowiska, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozwiązania tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania środowiska `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „brak autoryzacji”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
