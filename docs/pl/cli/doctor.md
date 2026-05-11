---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonych poprawek
    - Po wprowadzeniu aktualizacji chcesz szybkiej kontroli poprawności
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-11T20:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

W przypadku uprawnień specyficznych dla kanału użyj sond kanału zamiast `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Docelowa sonda możliwości Discord raportuje efektywne uprawnienia bota w kanale; sonda stanu audytuje skonfigurowane kanały Discord oraz cele automatycznego dołączania do głosu.

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/przeszukiwania workspace
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługą bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługą
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłoś ostatnie przekazania restartu przez nadzorcę Gateway

Uwagi:

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole `doctor` tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niezmienny. Zamiast tego edytuj źródło Nix dla tej instalacji; w przypadku nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first.
- Monity interaktywne (takie jak poprawki keychain/OAuth) działają tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezgłowe (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie pluginów, dzięki czemu bezgłowe kontrole stanu pozostają szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezgłowe pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je w miejscu, zanim scheduler będzie musiał automatycznie normalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie Gateway WhatsApp, gdy Cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway przy nadal działających lokalnych klientach `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie były kolejkowane za nieaktualnymi pętlami odświeżania TUI.
- Doctor przepisuje starsze refy modeli `openai-codex/*` na kanoniczne refy `openai/*` w modelach głównych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i nieaktualnych przypięciach tras sesji. `--fix` przenosi intencję Codex do wpisów `agentRuntime.id: "codex"` o zakresie provider/model, zachowuje przypięcia profili uwierzytelniania sesji takie jak `openai-codex:...`, usuwa nieaktualne przypięcia runtime całego agenta/sesji i utrzymuje naprawione refy agentów OpenAI na routingu uwierzytelniania Codex zamiast bezpośredniego uwierzytelniania kluczem API OpenAI.
- Doctor czyści starszy stan stagingu zależności pluginów utworzony przez starsze wersje OpenClaw. Naprawia także brakujące pobieralne pluginy, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia providera/wyszukiwania lub skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor pomija naprawę pluginów przez menedżera pakietów, dopóki podmiana pakietu się nie zakończy; uruchom potem ponownie `openclaw doctor --fix`, jeśli skonfigurowany plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis pluginu do następnej próby naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.deny`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów jest zdrowe.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, aby inne pluginy i kanały mogły nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal raportuje stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalowanie/uruchamianie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd przypominające Gateway i nie przepisuje metadanych polecenia/entrypoint dla działającej usługi Gateway systemd podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor obejmuje kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających do embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora będącego człowiekiem, któremu wolno uruchamiać polecenia tylko dla właściciela i zatwierdzać niebezpieczne działania. Parowanie DM pozwala tylko rozmawiać z botem; jeśli zatwierdzono nadawcę, zanim istniał bootstrap pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a w domu Codex operatora istnieją osobiste zasoby Codex CLI. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych domów per-agent, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które powinny zostać świadomie wypromowane.
- Doctor usuwa wycofane `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze utrzymuje natywne narzędzia workspace Codex jako natywne.
- Doctor ostrzega, gdy skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku runtime, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz utrzymać skill aktywny.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokiej wartości sygnału z remediacją (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do shardowanych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje awaryjnych danych uwierzytelniających w formie zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku env, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników `allowFrom` Telegram (`doctor --fix`) wymaga rozwiązywalnego tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Referencja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
