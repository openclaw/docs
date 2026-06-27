---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz skorzystać z prowadzonych poprawek
    - Po aktualizacji chcesz sprawdzić, czy wszystko jest w porządku
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole kondycji + prowadzone naprawy)
title: Diagnostyka
x-i18n:
    generated_at: "2026-06-27T17:20:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole kondycji + szybkie poprawki dla Gateway i kanałów.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Dlaczego warto go używać

`openclaw doctor` to powierzchnia kontroli kondycji OpenClaw. Użyj jej, gdy Gateway,
kanały, pluginy, Skills, routing modeli, stan lokalny lub migracje konfiguracji
nie działają zgodnie z oczekiwaniami i potrzebujesz jednego polecenia, które wyjaśni,
co jest nie tak.

Doctor ma trzy tryby działania:

| Tryb | Polecenie                | Zachowanie                                                                      |
| ---- | ------------------------ | ------------------------------------------------------------------------------- |
| Inspekcja | `openclaw doctor`        | Kontrole zorientowane na człowieka i prowadzone monity.                         |
| Naprawa | `openclaw doctor --fix`  | Stosuje obsługiwane naprawy, używając monitów, chyba że bezpieczna jest naprawa nieinteraktywna. |
| Lint | `openclaw doctor --lint` | Tylko do odczytu, ustrukturyzowane wyniki dla CI, preflight i bramek przeglądu. |

Preferuj `--lint`, gdy automatyzacja potrzebuje stabilnego wyniku. Preferuj `--fix`, gdy
operator świadomie chce, aby doctor edytował konfigurację lub stan.

## Przykłady

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

W przypadku uprawnień specyficznych dla kanału używaj sond kanału zamiast `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Ukierunkowana sonda możliwości Discord zgłasza efektywne uprawnienia bota w kanale; sonda stanu audytuje skonfigurowane kanały Discord i docelowe miejsca automatycznego dołączania głosowego.

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: zaakceptuj wartości domyślne bez monitowania
- `--repair`: zastosuj zalecane naprawy niezwiązane z usługami bez monitowania; instalacje i przepisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia lub jawnych poleceń Gateway
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy jest to potrzebne
- `--non-interactive`: uruchom bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--allow-exec`: zezwól doctor na wykonywanie skonfigurowanych exec SecretRefs podczas weryfikowania sekretów
- `--deep`: skanuj usługi systemowe pod kątem dodatkowych instalacji Gateway i zgłaszaj ostatnie przekazania restartów nadzorcy Gateway
- `--lint`: uruchom zmodernizowane kontrole kondycji w trybie tylko do odczytu i emituj wyniki diagnostyczne
- `--post-upgrade`: uruchom sondy zgodności pluginów po aktualizacji; emituje wyniki do stdout; kończy z kodem 1, jeśli obecne są jakiekolwiek wyniki na poziomie błędu
- `--json`: z `--lint` emituj wyniki JSON zamiast wyjścia czytelnego dla człowieka; z `--post-upgrade` emituj czytelną maszynowo kopertę JSON (`{ probesRun, findings }`)
- `--severity-min <level>`: z `--lint` odrzuć wyniki poniżej `info`, `warning` lub `error`
- `--all`: z `--lint` uruchom wszystkie zarejestrowane kontrole, w tym kontrole opt-in wykluczone z domyślnego zestawu automatyzacji
- `--skip <id>`: z `--lint` pomiń id kontroli; powtórz, aby pominąć więcej niż jedną
- `--only <id>`: z `--lint` uruchom tylko id kontroli; powtórz, aby uruchomić mały wybrany zestaw

## Tryb Lint

`openclaw doctor --lint` to postawa automatyzacji tylko do odczytu dla kontroli doctor.
Używa ustrukturyzowanej ścieżki kontroli kondycji, nie monituje oraz nie naprawia
ani nie przepisuje konfiguracji/stanu. Używaj jej w CI, skryptach preflight i przepływach
przeglądu, gdy zamiast prowadzonych monitów naprawy potrzebujesz wyników czytelnych maszynowo.
Opcje wyjścia lint, takie jak `--json`, `--severity-min`, `--all`, `--only` i `--skip`,
są akceptowane tylko z `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Wyjście czytelne dla człowieka jest zwięzłe:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

Wyjście JSON jest powierzchnią skryptową dla uruchomień lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Zachowanie kodu wyjścia:

- `0`: brak wyników na wybranym progu ważności lub powyżej niego
- `1`: co najmniej jeden wynik spełnia wybrany próg
- `2`: awaria polecenia/środowiska uruchomieniowego przed wygenerowaniem wyników lint

`--severity-min` kontroluje zarówno widoczne wyniki, jak i próg wyjścia. Na
przykład `openclaw doctor --lint --severity-min error` może nie wypisać żadnych wyników i
zakończyć się kodem `0`, nawet gdy istnieją wyniki o niższej ważności `info` lub `warning`.

`--all` kontroluje, które kontrole są wybierane przed filtrowaniem ważności. Domyślne
uruchomienie lint jest stabilną bramką automatyzacji i wyklucza kontrole, które są
celowo opt-in, ponieważ są głębokie, historyczne lub z większym prawdopodobieństwem
ujawniają naprawialne pozostałości legacy. Użyj `--all`, gdy potrzebujesz pełnej
inwentaryzacji lint bez wymieniania każdego id kontroli. `--only <id>` pozostaje najbardziej precyzyjnym
selektorem i może uruchomić dowolną zarejestrowaną kontrolę według id.

## Ustrukturyzowane kontrole kondycji

Nowoczesne kontrole doctor używają małego ustrukturyzowanego kontraktu:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` zasila `doctor --lint`. `repair()` jest opcjonalne i jest brane pod uwagę tylko
przez `doctor --fix` / `doctor --repair`. Kontrole, które nie zostały zmigrowane do tego
kształtu, nadal używają legacy przepływu kontrybucji doctor.

Ten podział jest celowy: `detect()` odpowiada za diagnozę, podczas gdy `repair()` odpowiada za
raportowanie tego, co zmieniło lub zmieniłoby. Konteksty naprawy mogą przenosić
żądania `dryRun`/`diff`, a wyniki naprawy mogą zwracać ustrukturyzowane `diffs` dla
edycji konfiguracji/plików oraz `effects` dla efektów ubocznych dotyczących usług, procesów, pakietów, stanu lub innych
efektów ubocznych. Dzięki temu skonwertowane kontrole mogą ewoluować w stronę `doctor --fix --dry-run`
i raportowania diff bez przenoszenia planowania mutacji do `detect()`.

`repair()` zgłasza, czy podjęło próbę żądanej naprawy, używając `status:
"repaired" | "skipped" | "failed"`. Pominięty status oznacza `repaired`, więc proste
kontrole naprawy muszą zwracać tylko zmiany. Gdy naprawa zwraca `skipped` lub
`failed`, doctor zgłasza powód i nie uruchamia walidacji dla tej kontroli.

Po udanej ustrukturyzowanej naprawie doctor ponownie uruchamia `detect()` z
naprawionymi wynikami jako zakresem. Kontrole mogą używać wybranych wyników, ścieżek lub wartości `ocPath`
do ukierunkowanej walidacji. Jeśli wynik nadal jest obecny, doctor zgłasza
ostrzeżenie naprawy zamiast traktować zmianę jako cicho ukończoną.

Wynik zawiera:

| Pole              | Cel                                                    |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabilne id dla filtrów skip/only i allowlist CI.      |
| `severity`        | `info`, `warning` lub `error`.                         |
| `message`         | Czytelny dla człowieka opis problemu.                  |
| `path`            | Konfiguracja, plik lub ścieżka logiczna, gdy dostępna. |
| `line` / `column` | Lokalizacja w źródle, gdy dostępna.                    |
| `ocPath`          | Precyzyjny adres `oc://`, gdy kontrola może go wskazać. |
| `fixHint`         | Sugerowane działanie operatora lub podsumowanie naprawy. |

Zmodernizowane podstawowe kontrole doctor pozostają przypięte do uporządkowanej kontrybucji doctor,
która odpowiada za ich ludzkie zachowanie `doctor` / `doctor --fix`. Wspólny ustrukturyzowany
rejestr kondycji jest punktem rozszerzeń: kontrole pakietowe i wspierane przez pluginy uruchamiają się
po podstawowych kontrolach doctor, gdy ich pakiet właścicielski zarejestruje je w aktywnej
ścieżce polecenia. Podścieżka `openclaw/plugin-sdk/health` udostępnia ten sam
kontrakt tym konsumentom rozszerzeń.

## Wybór kontroli

Użyj `--only` i `--skip`, gdy przepływ pracy potrzebuje ukierunkowanej bramki:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` i `--skip` akceptują pełne id kontroli i mogą być powtarzane. Jeśli id `--only`
nie jest zarejestrowane, dla tego id nie zostanie uruchomiona żadna kontrola; użyj pól `checksRun`
i `checksSkipped` polecenia, aby zweryfikować, że ukierunkowana bramka wybiera kontrole, których
oczekujesz.

## Tryb po aktualizacji

`openclaw doctor --post-upgrade` uruchamia sondy zgodności pluginów przeznaczone do
łańcuchowego uruchamiania po kompilacji lub aktualizacji. Wyniki są emitowane do stdout; polecenie
kończy się kodem 1, jeśli jakikolwiek wynik ma `level: "error"`. Dodaj `--json`, aby otrzymać
czytelną maszynowo kopertę (`{ probesRun, findings }`) odpowiednią dla CI,
społecznościowej umiejętności `fork-upgrade` i innych narzędzi smoke po aktualizacji. Jeśli
indeks zainstalowanych pluginów jest brakujący lub zniekształcony, tryb JSON nadal emituje tę
kopertę z wynikiem błędu `plugin.index_unavailable`.

Uwagi:

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole doctor tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niemutowalny. Zamiast tego edytuj źródło Nix dla tej instalacji; w przypadku nix-openclaw użyj podejścia agent-first z [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktywne monity (takie jak naprawy keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY, a `--non-interactive` **nie** jest ustawione. Uruchomienia bez interfejsu (cron, Telegram, brak terminala) pominą monity.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają gorliwe ładowanie Plugin, dzięki czemu bezterminalowe kontrole kondycji pozostają szybkie. Interaktywne sesje doctor nadal ładują powierzchnie Plugin potrzebne przez starszy przepływ kondycji i naprawy.
- `--lint` jest bardziej rygorystyczne niż `--non-interactive`: zawsze działa tylko do odczytu, nigdy nie wyświetla monitów i nigdy nie stosuje bezpiecznych migracji. Uruchom `doctor --fix` lub `doctor --repair`, gdy chcesz, aby doctor wprowadził zmiany.
- Domyślnie doctor nie wykonuje SecretRefs typu `exec` podczas sprawdzania sekretów. Używaj `openclaw doctor --allow-exec` lub `openclaw doctor --lint --allow-exec` tylko wtedy, gdy celowo chcesz, aby doctor uruchomił te skonfigurowane resolvery sekretów.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową w `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Zmodernizowane kontrole kondycji mogą udostępniać ścieżkę `repair()` dla `doctor --fix`; kontrole, które jej nie udostępniają, nadal przechodzą przez istniejący przepływ naprawy doctor.
- `doctor --fix --non-interactive` zgłasza brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. Uruchom `openclaw gateway install` dla brakującej usługi albo `openclaw gateway install --force`, gdy celowo chcesz zastąpić launcher.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bezterminalowe pozostawiają je na miejscu.
- Doctor skanuje także `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań cron i przepisuje je przed zaimportowaniem kanonicznych wierszy do SQLite.
- Doctor zgłasza zadania cron z jawnymi nadpisaniami `payload.model`, w tym liczbę przestrzeni nazw providerów i niezgodności względem `agents.defaults.model`, dzięki czemu zaplanowane zadania, które nie dziedziczą domyślnego modelu, są widoczne podczas dochodzeń dotyczących uwierzytelniania lub rozliczeń.
- W systemie Linux doctor ostrzega, gdy crontab użytkownika nadal uruchamia starszy `~/.openclaw/bin/ensure-whatsapp.sh`; ten skrypt nie jest już utrzymywany i może logować fałszywe awarie WhatsApp Gateway, gdy cron nie ma środowiska user-bus systemd.
- Gdy WhatsApp jest włączony, doctor sprawdza zdegradowaną pętlę zdarzeń Gateway przy nadal działających lokalnych klientach `openclaw-tui`. `doctor --fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie były kolejkowane za nieaktualnymi pętlami odświeżania TUI.
- Doctor przepisuje starsze referencje modeli `openai-codex/*` na kanoniczne referencje `openai/*` w modelach głównych, fallbackach, modelach generowania obrazów/wideo, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i nieaktualnych przypięciach tras sesji. `--fix` migruje także starsze profile uwierzytelniania `openai-codex:*` i wpisy `auth.order.openai-codex` do `openai:*`, przenosi intencję Codex do wpisów `agentRuntime.id: "codex"` ograniczonych do providera/modelu, usuwa nieaktualne przypięcia runtime całego agenta/sesji i utrzymuje naprawione referencje agentów OpenAI na routingu uwierzytelniania Codex zamiast bezpośredniego uwierzytelniania kluczem API OpenAI.
- Doctor czyści starszy stan stagingu zależności Plugin utworzony przez starsze wersje OpenClaw i ponownie linkuje pakiet hosta `openclaw` dla zarządzanych Plugin npm, które deklarują go jako zależność peer. Naprawia także brakujące pobieralne Plugin, do których odwołuje się konfiguracja, takie jak `plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia providerów/wyszukiwania lub skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor pomija naprawę Plugin przez menedżera pakietów, dopóki podmiana pakietu się nie zakończy; uruchom potem ponownie `openclaw doctor --fix`, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Jeśli pobieranie się nie powiedzie, doctor zgłasza błąd instalacji i zachowuje skonfigurowany wpis Plugin na kolejną próbę naprawy.
- Doctor naprawia nieaktualną konfigurację Plugin, usuwając brakujące identyfikatory Plugin z `plugins.allow`/`plugins.deny`/`plugins.entries`, a także pasującą osieroconą konfigurację kanałów, cele heartbeat i nadpisania modeli kanałów, gdy wykrywanie Plugin działa poprawnie.
- Doctor poddaje kwarantannie nieprawidłową konfigurację Plugin, wyłączając dotknięty wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy payload `config`. Uruchamianie Gateway już pomija tylko ten wadliwy Plugin, więc inne Plugin i kanały mogą nadal działać.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny supervisor zarządza cyklem życia Gateway. Doctor nadal zgłasza kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchamianie/restart/bootstrap usługi oraz czyszczenie starszych usług.
- W systemie Linux doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/entrypointu dla działającej usługi Gateway systemd. Najpierw zatrzymaj usługę albo użyj `openclaw gateway install --force`, gdy celowo chcesz zastąpić aktywny launcher.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i powiązane) do `talk.provider` + `talk.providers.<provider>`.
- Powtarzane uruchomienia `doctor --fix` nie zgłaszają już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embeddingów.
- Doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właściciel poleceń to konto operatora-człowieka uprawnione do uruchamiania poleceń tylko dla właściciela i zatwierdzania niebezpiecznych działań. Parowanie DM pozwala jedynie rozmawiać z botem; jeśli zatwierdzono nadawcę, zanim istniał bootstrap pierwszego właściciela, ustaw jawnie `commands.ownerAllowFrom`.
- Doctor zgłasza notatkę informacyjną, gdy skonfigurowano agentów w trybie Codex, a osobiste zasoby Codex CLI istnieją w katalogu domowym Codex operatora. Lokalne uruchomienia app-server Codex używają izolowanych katalogów domowych per agent, więc w razie potrzeby najpierw zainstaluj Plugin Codex, a następnie użyj `openclaw migrate plan codex`, aby zinwentaryzować zasoby, które należy celowo wypromować.
- Doctor usuwa wycofane `plugins.entries.codex.config.codexDynamicToolsProfile`; app-server Codex zawsze utrzymuje natywne narzędzia workspace Codex jako natywne.
- Doctor ostrzega, gdy Skills dozwolone dla domyślnego agenta są niedostępne w bieżącym środowisku runtime, ponieważ brakuje binariów, zmiennych env, konfiguracji lub wymagań systemu operacyjnego. `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; zamiast tego zainstaluj/skonfiguruj brakujące wymaganie, gdy chcesz zachować aktywny Skill.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokim sygnale wraz z naprawą (`install Docker` albo `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli istnieją starsze pliki rejestru sandbox lub katalogi shardów (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` lub `~/.openclaw/sandbox/browsers/`), doctor je zgłasza; `openclaw doctor --fix` migruje prawidłowe wpisy do SQLite i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje poświadczeń fallback w postaci zwykłego tekstu. W przypadku SecretRefs opartych na exec doctor pomija wykonanie, chyba że obecne jest `--allow-exec`.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie przedwcześnie.
- Po migracjach katalogu stanu doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od fallbacku env, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępny dla procesu doctor.
- Automatyczne rozpoznawanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga rozwiązywalnego tokena Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokena jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozpoznawanie w tym przebiegu.

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
