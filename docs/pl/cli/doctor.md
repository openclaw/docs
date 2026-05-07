---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonej naprawy
    - Po aktualizacji chcesz wykonać szybką kontrolę
summary: Dokumentacja referencyjna CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-07T13:13:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole stanu i szybkie poprawki dla Gateway i kanałów.

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

Do uprawnień specyficznych dla kanału używaj sond kanałów zamiast `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Ukierunkowana sonda możliwości Discord zgłasza efektywne uprawnienia bota w kanale; sonda statusu audytuje skonfigurowane kanały Discord oraz cele automatycznego dołączania do kanałów głosowych.

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: zaakceptuj wartości domyślne bez pytania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługami bez pytania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia albo jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłoś ostatnie przekazania restartu nadzorcy Gateway

Uwagi:

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole `doctor` tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niezmienny. Zamiast tego edytuj źródło Nix dla tej instalacji; dla nix-openclaw użyj agent-first [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
- Monity interaktywne (takie jak poprawki keychain/OAuth) uruchamiają się tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezobsługowe (cron, Telegram, bez terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają zachłanne ładowanie Plugin, dzięki czemu bezobsługowe kontrole stanu pozostają szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy kontrola potrzebuje ich wkładu.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ani nie przepisuje ich poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` w przypadku brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezobsługowe pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (albo `cron.store`) pod kątem starszych kształtów zadań cron i może przepisać je na miejscu, zanim harmonogram będzie musiał automatycznie normalizować je w czasie działania.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może rejestrować fałszywe awarie Gateway WhatsApp, gdy cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway z nadal działającymi lokalnymi klientami `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie trafiały do kolejki za przestarzałymi pętlami odświeżania TUI.
- Doctor przepisuje starsze odwołania modeli `openai-codex/*` na kanoniczne odwołania `openai/*` w modelach podstawowych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów oraz nieaktualnych pinach tras sesji. `--fix` wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy Plugin Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma używalne OAuth; w przeciwnym razie wybiera `agentRuntime.id: "pi"`, aby trasa pozostała na domyślnym runnerze OpenClaw.
- Doctor czyści starszy stan przygotowania zależności Plugin utworzony przez starsze wersje OpenClaw. Naprawia też brakujące pobieralne Plugin, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawcy/wyszukiwania albo skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietów doctor pomija naprawę Plugin przez menedżera pakietów do czasu zakończenia podmiany pakietu; uruchom potem ponownie `openclaw doctor --fix`, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis Plugin na potrzeby kolejnej próby naprawy.
- Doctor naprawia nieaktualną konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.entries`, a także pasującą osieroconą konfigurację kanału, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie Plugin jest prawidłowe.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już teraz pomija tylko ten wadliwy Plugin, aby inne Plugin i kanały mogły nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca jest właścicielem cyklu życia Gateway. Doctor nadal zgłasza stan Gateway/usługi i stosuje naprawy niezwiązane z usługami, ale pomija instalację/uruchomienie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i nie przepisuje metadanych polecenia/punktu wejścia dla działającej usługi systemd Gateway podczas naprawy. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embedding.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto ludzkiego operatora uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM tylko pozwala komuś rozmawiać z botem; jeśli zatwierdzono nadawcę przed istnieniem bootstrapu pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor ostrzega, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby CLI Codex istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych dla poszczególnych agentów, więc użyj `openclaw migrate codex --dry-run`, aby zinwentaryzować zasoby, które powinny zostać celowo wypromowane.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku uruchomieniowym, ponieważ brakuje binariów, zmiennych środowiskowych, konfiguracji albo wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz zachować aktywny skill.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza konkretny, użyteczny alert z działaniem naprawczym (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli obecne są starsze pliki rejestru sandbox (`~/.openclaw/sandbox/containers.json` albo `~/.openclaw/sandbox/browsers.json`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do podzielonych katalogów rejestru i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje zastępczych poświadczeń w postaci zwykłego tekstu.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie wcześniej.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku środowiskowego, a `TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga możliwego do rozwiązania tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie dla tego przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (albo `...PASSWORD`), ta wartość nadpisuje plik konfiguracyjny i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Gateway doctor](/pl/gateway/doctor)
