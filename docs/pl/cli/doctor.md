---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonych napraw
    - Po aktualizacji chcesz sprawdzić, czy wszystko działa poprawnie
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-06T17:53:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania w workspace
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługą bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługą
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: skanuj usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway i zgłaszaj ostatnie przekazania restartu nadzorcy Gateway

Uwagi:

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole doctor tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niezmienny. Zamiast tego edytuj źródło Nix dla tej instalacji; w przypadku nix-openclaw użyj [szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first.
- Monity interaktywne (takie jak poprawki keychain/OAuth) działają tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez interfejsu (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie pluginów, dzięki czemu bezterminalowe kontrole stanu pozostają szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezterminalowe pozostawiają je na miejscu.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je w miejscu, zanim scheduler będzie musiał automatycznie normalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska user-bus systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway przy nadal działających lokalnych klientach `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowane lokalne klienty TUI, aby odpowiedzi WhatsApp nie były kolejkowane za przestarzałymi pętlami odświeżania TUI.
- Doctor przepisuje starsze referencje modeli `openai-codex/*` na kanoniczne referencje `openai/*` w modelach podstawowych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i przestarzałych przypięciach tras sesji. `--fix` wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy plugin Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma użyteczne OAuth; w przeciwnym razie wybiera `agentRuntime.id: "pi"`, aby trasa pozostała na domyślnym runnerze OpenClaw.
- Doctor czyści starszy stan przygotowania zależności pluginów utworzony przez starsze wersje OpenClaw. Naprawia też brakujące pluginy do pobrania, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawcy/wyszukiwania lub skonfigurowane środowiska wykonawcze agentów. Podczas aktualizacji pakietów doctor pomija naprawę pluginów przez menedżera pakietów do czasu zakończenia podmiany pakietu; uruchom ponownie `openclaw doctor --fix` po niej, jeśli skonfigurowany plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis pluginu na następną próbę naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa prawidłowo.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, więc inne pluginy i kanały mogą dalej działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca jest właścicielem cyklu życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi Gateway systemd podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają ani nie stosują już normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających do embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora-człowieka uprawnione do uruchamiania poleceń wyłącznie właścicielskich i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala komuś tylko rozmawiać z botem; jeśli zatwierdziłeś nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych per agent, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy świadomie promować.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku wykonawczym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz utrzymać skill aktywny.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej wartości informacyjnej z działaniem naprawczym (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do katalogów rejestru podzielonych na shardy i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje awaryjnych danych uwierzytelniających w tekście jawnym.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku przez środowisko, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` są niedostępne dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga rozwiązywalnego tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie dla tego przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracyjny i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
