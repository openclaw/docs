---
read_when:
    - Konfigurowanie bezpiecznych binarek lub niestandardowych profili bezpiecznych binarek
    - Przekazywanie zatwierdzeń do Slack, Discord, Telegram lub innych kanałów czatu
    - Implementowanie natywnego klienta zatwierdzeń dla kanału
summary: 'Zaawansowane zatwierdzenia exec: bezpieczne binarki, wiązanie interpreterów, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia exec — zaawansowane
x-i18n:
    generated_at: "2026-04-24T09:36:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Zaawansowane zagadnienia związane z zatwierdzeniami exec: szybka ścieżka `safeBins`, wiązanie interpretera/środowiska uruchomieniowego oraz przekazywanie zatwierdzeń do kanałów czatu (w tym natywne dostarczanie).
Opis podstawowej polityki i przepływu zatwierdzeń znajdziesz w [Zatwierdzeniach exec](/pl/tools/exec-approvals).

## Safe bins (tylko stdin)

`tools.exec.safeBins` definiuje małą listę binarek **działających wyłącznie na stdin** (na przykład `cut`), które mogą działać w trybie allowlisty **bez** jawnych wpisów na allowliście. Safe bins odrzucają pozycyjne argumenty plików i tokeny przypominające ścieżki, więc mogą działać wyłącznie na strumieniu wejściowym. Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie jako ogólną listę zaufania.

<Warning>
Nie dodawaj binarek interpreterów ani środowisk uruchomieniowych (na przykład `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie potrafi wykonywać kod,
uruchamiać podpolecenia lub z założenia odczytywać pliki, preferuj jawne wpisy allowlisty
i pozostaw włączone monity o zatwierdzenie. Niestandardowe safe bins muszą definiować jawny
profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Jeśli świadomie je włączysz, zachowaj jawne
wpisy allowlisty dla ich przebiegów pracy innych niż stdin. W trybie safe-bin dla `grep`
podawaj wzorzec przez `-e`/`--regexp`; pozycyjna forma wzorca jest odrzucana, aby nie dało się
przemycić operandów plików jako niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i zabronione flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia
plików w systemie hosta), co zapobiega zachowaniu typu oracle ujawniającemu istnienie plików na podstawie
różnic między allow i deny. Dla domyślnych safe bins blokowane są opcje zorientowane na pliki; długie
opcje są walidowane w trybie fail-closed (nieznane flagi i niejednoznaczne skróty są
odrzucane).

Zabronione flagi według profilu safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins wymuszają także traktowanie tokenów argv jako **dosłownego tekstu** w czasie wykonania
(brak globbingu i rozwijania `$VARS`) dla segmentów działających wyłącznie na stdin, dzięki czemu wzorce
takie jak `*` czy `$HOME/...` nie mogą zostać użyte do przemycenia odczytu plików.

### Zaufane katalogi binarek

Safe bins muszą być rozwiązywane z zaufanych katalogów binarek (domyślne katalogi systemowe plus
opcjonalne `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane.
Domyślne zaufane katalogi są celowo minimalne: `/bin`, `/usr/bin`. Jeśli
wykonywalny plik safe-bin znajduje się w ścieżkach menedżera pakietów lub użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie do `tools.exec.safeBinTrustedDirs`.

### Łańcuchowanie powłoki, wrappery i multipleksery

Łańcuchowanie powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu
spełnia wymagania allowlisty (w tym safe bins lub automatyczne dopuszczenie Skill). Przekierowania
pozostają nieobsługiwane w trybie allowlisty. Podstawianie poleceń (`$()` / backticks) jest
odrzucane podczas parsowania allowlisty, także wewnątrz podwójnych cudzysłowów; użyj pojedynczych
cudzysłowów, jeśli potrzebujesz dosłownego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej na macOS surowy tekst powłoki zawierający składnię sterowania
lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest
traktowany jako brak dopasowania do allowlisty, chyba że sama binarka powłoki jest na allowliście.

Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env w zakresie żądania są redukowane do
małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie allowlisty znane wrappery dyspozytorskie (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzną ścieżkę pliku wykonywalnego zamiast
ścieżki wrappera. Multipleksery powłoki (`busybox`, `toybox`) są rozwijane dla
apletów powłoki (`sh`, `ash` itd.) w ten sam sposób. Jeśli wrappera lub multipleksera nie da się
bezpiecznie rozwinąć, żaden wpis allowlisty nie jest automatycznie utrwalany.

Jeśli dodajesz interpretery takie jak `python3` lub `node` do allowlisty, preferuj
`tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał jawnego zatwierdzenia.
W trybie ścisłym `allow-always` nadal może utrwalać nieszkodliwe wywołania
interpreterów/skryptów, ale nośniki inline-eval nie są utrwalane automatycznie.

### Safe bins a allowlista

| Temat            | `tools.exec.safeBins`                                  | Allowlista (`exec-approvals.json`)                           |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Cel              | Automatyczne dopuszczanie wąskich filtrów stdin        | Jawne zaufanie do konkretnych plików wykonywalnych           |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv safe-bin     | Glob wzorca dla rozwiązanej ścieżki pliku wykonywalnego      |
| Zakres argumentów| Ograniczony przez profil safe-bin i reguły tokenów dosłownych | Tylko dopasowanie ścieżki; za argumenty odpowiadasz już sam |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI        |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w potokach        | Dowolne narzędzie o szerszym zachowaniu lub efektach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` lub per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` lub per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` lub per-agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per-agent nadpisują klucze globalne.
- wpisy allowlisty znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` w `agents.<id>.allowlist` (lub przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega kodem `tools.exec.safe_bins_interpreter_unprofiled`, gdy binarki interpretera/środowiska uruchomieniowego pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może wygenerować brakujące wpisy `safeBinProfiles.<bin>` jako `{}` (potem je przejrzyj i zaostrz). Binarki interpreterów/środowisk uruchomieniowych nie są generowane automatycznie.

Przykład niestandardowego profilu:
__OC_I18N_900000__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuci builtin `env` w trybie safe-bin,
tak aby `jq -n env` nie mogło zrzucić środowiska procesu hosta bez jawnej ścieżki allowlisty
lub monitu o zatwierdzenie.

## Polecenia interpretera/środowiska uruchomieniowego

Uruchomienia interpreterów/środowisk uruchomieniowych wspierane przez zatwierdzenia są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptów powłoki i bezpośrednie formy plików środowiska uruchomieniowego są wiązane best-effort z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed wiązaniem.
- Jeśli OpenClaw nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego (na przykład skryptów pakietów, form eval, łańcuchów loaderów specyficznych dla środowiska uruchomieniowego lub niejednoznacznych form wieloplikowych), wykonanie wspierane przez zatwierdzenia jest odrzucane zamiast deklarować pokrycie semantyczne, którego faktycznie nie ma.
- Dla takich przebiegów pracy preferuj sandboxing, oddzielną granicę hosta albo jawną zaufaną allowlistę/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę środowiska uruchomieniowego.

Gdy wymagane są zatwierdzenia, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia. Użyj tego identyfikatora do
skorelowania późniejszych zdarzeń systemowych (`Exec finished` / `Exec denied`). Jeśli przed upływem limitu czasu
nie nadejdzie żadna decyzja, żądanie jest traktowane jako przekroczenie czasu zatwierdzenia i zgłaszane jako powód odmowy.

### Zachowanie dostarczania follow-upów

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła follow-upową turę `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczania (kanał umożliwiający dostarczenie oraz docelowe `to`), follow-up jest dostarczany przez ten kanał.
- W przebiegach tylko z webchatem lub sesją wewnętrzną, bez celu zewnętrznego, follow-up pozostaje wyłącznie w sesji (`deliver: false`).
- Jeśli wywołujący jawnie żąda ścisłego zewnętrznego dostarczania bez możliwego do rozwiązania kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli włączone jest `bestEffortDeliver` i nie da się rozwiązać zewnętrznego kanału, dostarczanie jest obniżane do trybu tylko sesyjnego zamiast kończyć się błędem.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów Pluginów) i zatwierdzać
je przez `/approve`. Wykorzystuje to zwykły potok dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedz na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia Pluginów. Jeśli ID nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdzane są zatwierdzenia Pluginów.

### Przekazywanie zatwierdzeń Pluginów

Przekazywanie zatwierdzeń Pluginów używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację w `approvals.plugin`. Włączenie lub wyłączenie jednego nie wpływa na drugie.
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak w `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzeń zarówno dla exec, jak i
dla zatwierdzeń Pluginów. Kanały bez współdzielonego interfejsu interaktywnego wracają do zwykłego tekstu z instrukcjami
`/approve`.

### Zatwierdzenia na tym samym czacie w dowolnym kanale

Gdy żądanie zatwierdzenia exec lub Pluginu pochodzi z powierzchni czatu umożliwiającej dostarczenie, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams, oprócz istniejących już przebiegów w Web UI i TUI.

Ta współdzielona ścieżka polecenia tekstowego używa zwykłego modelu uwierzytelniania kanału dla danej rozmowy. Jeśli
czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, aby pozostać oczekujące.

Discord i Telegram również obsługują `/approve` na tym samym czacie, ale te kanały nadal używają
swojej rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

W przypadku Telegrama i innych natywnych klientów zatwierdzeń, którzy wywołują Gateway bezpośrednio,
ten fallback jest celowo ograniczony do błędów typu „approval not found”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie powoduje cichej ponownej próby jako zatwierdzenie Pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą też działać jako natywni klienci zatwierdzeń. Natywni klienci dodają DM-y do zatwierdzających, fanout do czatu źródłowego
oraz interaktywny UX zatwierdzeń specyficzny dla kanału ponad współdzielony przebieg `/approve` na tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzeń, ten natywny interfejs jest podstawową
ścieżką widoczną dla agenta. Agent nie powinien dodatkowo wypisywać zduplikowanego zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Model ogólny:

- polityka exec hosta nadal decyduje, czy wymagane jest zatwierdzenie exec
- `approvals.exec` steruje przekazywaniem monitów o zatwierdzenie do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` steruje tym, czy dany kanał działa jako natywny klient zatwierdzeń

Natywni klienci zatwierdzeń automatycznie włączają dostarczanie najpierw przez DM, gdy wszystkie poniższe warunki są spełnione:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- osoby zatwierdzające można rozwiązać na podstawie jawnego `execApprovals.approvers` lub udokumentowanych źródeł fallbacku dla tego kanału
- `channels.<channel>.execApprovals.enabled` nie jest ustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy osoby zatwierdzające zostaną rozwiązane. Publiczne dostarczanie do czatu źródłowego pozostaje jawnie kontrolowane przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń na czacie?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzeń dodają routing DM i opcjonalny fanout do kanału ponad współdzielony
przebieg `/approve` na tym samym czacie i współdzielone przyciski zatwierdzeń.

Współdzielone zachowanie:

- Slack, Matrix, Microsoft Teams i podobne czaty z możliwością dostarczenia używają zwykłego modelu uwierzytelniania kanału
  dla `/approve` na tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym natywnym celem dostarczenia są DM-y do zatwierdzających
- w przypadku Discord i Telegrama tylko rozwiązane osoby zatwierdzające mogą zatwierdzać lub odrzucać
- osoby zatwierdzające w Discordzie mogą być jawne (`execApprovals.approvers`) lub wywnioskowane z `commands.ownerAllowFrom`
- osoby zatwierdzające w Telegramie mogą być jawne (`execApprovals.approvers`) lub wywnioskowane z istniejącej konfiguracji właściciela (`allowFrom` oraz `defaultTo` dla wiadomości bezpośrednich, tam gdzie jest obsługiwane)
- osoby zatwierdzające w Slack mogą być jawne (`execApprovals.approvers`) lub wywnioskowane z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia Pluginów
  bez drugiej warstwy fallbacku lokalnej dla Slacka
- natywny routing DM/kanału i skróty reakcji w Matrix obsługują zarówno zatwierdzenia exec, jak i Pluginów;
  autoryzacja Pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`
- żądający nie musi być osobą zatwierdzającą
- czat źródłowy może zatwierdzić bezpośrednio przez `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzeń w Discordzie trasują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń Pluginów, a wszystko pozostałe do zatwierdzeń exec
- natywne przyciski zatwierdzeń w Telegramie stosują ten sam ograniczony fallback z exec do Pluginów co `/approve`
- gdy natywny `target` włącza dostarczanie do czatu źródłowego, monity o zatwierdzenie zawierają tekst polecenia
- oczekujące zatwierdzenia exec wygasają domyślnie po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, monit wraca do `askFallback`

Telegram domyślnie używa DM-ów do zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` lub `both`, jeśli
chcesz, aby monity o zatwierdzenie pojawiały się również w źródłowym czacie/wątku Telegrama. Dla tematów forum w Telegramie
OpenClaw zachowuje temat dla monitu o zatwierdzenie i follow-upu po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC w macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzanie peera z tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — podstawowa polityka i przepływ zatwierdzeń
- [Narzędzie exec](/pl/tools/exec)
- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie automatycznego dopuszczania oparte na Skills
