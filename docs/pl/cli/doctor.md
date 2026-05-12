---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i chcesz przeprowadzić naprawę krok po kroku
    - Po aktualizacji chcesz wykonać szybkie sprawdzenie poprawności
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-12T08:45:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole kondycji i szybkie naprawy dla Gateway i kanałów.

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

Ukierunkowana sonda możliwości Discord zgłasza efektywne uprawnienia bota w kanale; sonda stanu audytuje skonfigurowane kanały Discord oraz cele automatycznego dołączania do głosu.

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/przeszukiwania obszaru roboczego
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługami bez pytania; instalacje i przepisywanie usług Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłoś ostatnie przekazania restartu nadzorcy Gateway

Uwagi:

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole `doctor` tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niezmienny. Zamiast tego edytuj źródło Nix dla tej instalacji; w przypadku nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first.
- Monity interaktywne (takie jak naprawy pęku kluczy/OAuth) działają tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez terminala (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie pluginów, aby kontrole kondycji bez terminala pozostawały szybkie. Sesje interaktywne nadal w pełni ładują pluginy, gdy dana kontrola wymaga ich wkładu.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić program uruchamiający.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez terminala pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) w poszukiwaniu starszych kształtów zadań cron i może przepisać je w miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- W Linuksie doctor ostrzega, gdy crontab użytkownika nadal uruchamia przestarzały `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway z lokalnymi klientami `openclaw-tui`, które nadal działają. `doctor --fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie były kolejkowane za przestarzałymi pętlami odświeżania TUI.
- Doctor przepisuje starsze odwołania modeli `openai-codex/*` na kanoniczne odwołania `openai/*` w modelach podstawowych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów oraz nieaktualnych przypięciach tras sesji. `--fix` przenosi intencję Codex do wpisów `agentRuntime.id: "codex"` o zakresie dostawcy/modelu, zachowuje przypięcia profili uwierzytelniania sesji, takie jak `openai-codex:...`, usuwa nieaktualne przypięcia runtime całego agenta/sesji i utrzymuje naprawione odwołania agentów OpenAI na trasowaniu uwierzytelniania Codex zamiast bezpośredniego uwierzytelniania kluczem API OpenAI.
- Doctor czyści starszy stan przygotowania zależności pluginów utworzony przez starsze wersje OpenClaw i ponownie linkuje pakiet hosta `openclaw` dla zarządzanych pluginów npm, które deklarują go jako zależność równorzędną. Naprawia też brakujące pluginy do pobrania, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawcy/wyszukiwania lub skonfigurowane runtime'y agentów. Podczas aktualizacji pakietów doctor pomija naprawę pluginów menedżera pakietów do czasu ukończenia wymiany pakietu; uruchom ponownie `openclaw doctor --fix` później, jeśli skonfigurowany plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis pluginu na kolejną próbę naprawy.
- Doctor naprawia nieaktualną konfigurację pluginów, usuwając brakujące identyfikatory pluginów z `plugins.allow`/`plugins.deny`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa prawidłowo.
- Doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Uruchamianie Gateway już pomija tylko ten wadliwy plugin, aby inne pluginy i kanały mogły nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Doctor nadal zgłasza kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługami, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W Linuksie doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny program uruchamiający.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i pokrewne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń osadzania.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora będącego człowiekiem, które może uruchamiać polecenia wyłącznie dla właściciela i zatwierdzać niebezpieczne działania. Parowanie DM pozwala jedynie rozmawiać z botem; jeśli zatwierdzono nadawcę, zanim istniał bootstrap pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex i w katalogu domowym Codex operatora istnieją osobiste zasoby CLI Codex. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych per agent, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które należy celowo awansować.
- Doctor usuwa wycofane `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze utrzymuje natywne narzędzia obszaru roboczego Codex jako natywne.
- Doctor ostrzega, gdy skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym z powodu brakujących binariów, zmiennych środowiskowych, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne skills za pomocą `skills.entries.<skill>.enabled=false`; zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz utrzymać skill aktywną.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza wyraźne ostrzeżenie z działaniem naprawczym (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` lub `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do podzielonych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń zastępczych w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału zawiedzie w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześnie.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku env, a `TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozstrzygnięcia tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

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
