---
read_when:
    - Konfigurowanie bezpiecznych katalogów binarnych lub niestandardowych profili safe-bin
    - Przekazywanie zatwierdzeń do Slack/Discord/Telegram lub innych kanałów czatu
    - Implementacja natywnego klienta zatwierdzeń dla kanału
summary: 'Zaawansowane zatwierdzenia exec: bezpieczne binaria, powiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia wykonywania poleceń — zaawansowane
x-i18n:
    generated_at: "2026-05-06T09:32:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Zaawansowane tematy zatwierdzania wykonywania: szybka ścieżka `safeBins`, wiązanie interpretera/środowiska uruchomieniowego oraz przekazywanie zatwierdzeń do kanałów czatu (w tym dostarczanie natywne). Podstawowe zasady i przepływ zatwierdzania opisano w [Zatwierdzeniach wykonywania](/pl/tools/exec-approvals).

## Bezpieczne binaria (tylko stdin)

`tools.exec.safeBins` definiuje krótką listę binariów **tylko stdin** (na przykład `cut`), które mogą działać w trybie listy dozwolonych **bez** jawnych wpisów na liście dozwolonych. Bezpieczne binaria odrzucają pozycyjne argumenty plików i tokeny przypominające ścieżki, więc mogą działać wyłącznie na strumieniu wejściowym. Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie ogólną listę zaufania.

<Warning>
**Nie** dodawaj binariów interpreterów ani środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie może oceniać kod, wykonywać podpolecenia albo z założenia odczytywać pliki, preferuj jawne wpisy listy dozwolonych i pozostaw włączone monity zatwierdzeń. Niestandardowe bezpieczne binaria muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne bezpieczne binaria:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na domyślnej liście. Jeśli je włączysz, zachowaj jawne wpisy listy dozwolonych dla ich przepływów pracy innych niż stdin. Dla `grep` w trybie bezpiecznego binarium podaj wzorzec za pomocą `-e`/`--regexp`; forma pozycyjna wzorca jest odrzucana, aby operandów plików nie dało się przemycić jako niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i zabronione flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia systemu plików hosta), co zapobiega zachowaniu wyroczni istnienia pliku wynikającemu z różnic między zezwoleniem a odmową. Opcje zorientowane na pliki są zabronione dla domyślnych bezpiecznych binariów; długie opcje są walidowane w trybie fail-closed (nieznane flagi i niejednoznaczne skróty są odrzucane).

Zabronione flagi według profilu bezpiecznego binarium:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bezpieczne binaria wymuszają także traktowanie tokenów argv jako **dosłownego tekstu** podczas wykonywania (bez globowania i bez rozwijania `$VARS`) dla segmentów tylko stdin, więc wzorce takie jak `*` albo `$HOME/...` nie mogą zostać użyte do przemycenia odczytów plików.

### Zaufane katalogi binariów

Bezpieczne binaria muszą być rozwiązywane z zaufanych katalogów binariów (domyślne systemowe plus opcjonalne `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane. Domyślne zaufane katalogi są celowo minimalne: `/bin`, `/usr/bin`. Jeśli plik wykonywalny bezpiecznego binarium znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie do `tools.exec.safeBinTrustedDirs`.

### Łączenie powłoki, wrappery i multipleksery

Łączenie powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu spełnia listę dozwolonych (w tym bezpieczne binaria albo automatyczne zezwolenie Skills). Przekierowania pozostają nieobsługiwane w trybie listy dozwolonych. Podstawianie poleceń (`$()` / odwrotne apostrofy) jest odrzucane podczas parsowania listy dozwolonych, także wewnątrz cudzysłowów podwójnych; użyj cudzysłowów pojedynczych, jeśli potrzebujesz dosłownego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst powłoki zawierający składnię sterowania lub rozwijania powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak dopasowania listy dozwolonych, chyba że samo binarium powłoki znajduje się na liście dozwolonych.

Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env o zakresie żądania są redukowane do małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie listy dozwolonych znane wrappery dyspozytorskie (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżkę wewnętrznego pliku wykonywalnego zamiast ścieżki wrappera. Multipleksery powłoki (`busybox`, `toybox`) są rozwijane dla apletów powłoki (`sh`, `ash` itd.) w ten sam sposób. Jeśli wrappera lub multipleksera nie da się bezpiecznie rozwinąć, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.

Jeśli dodajesz do listy dozwolonych interpretery takie jak `python3` albo `node`, preferuj `tools.exec.strictInlineEval=true`, aby ewaluacja inline nadal wymagała jawnego zatwierdzenia. W trybie ścisłym `allow-always` może nadal utrwalać nieszkodliwe wywołania interpreter/skrypt, ale nośniki ewaluacji inline nie są utrwalane automatycznie.

### Bezpieczne binaria a lista dozwolonych

| Temat            | `tools.exec.safeBins`                                  | Lista dozwolonych (`exec-approvals.json`)                                          |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cel              | Automatycznie zezwalaj na wąskie filtry stdin          | Jawnie ufaj określonym plikom wykonywalnym                                         |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv bezpiecznego binarium | Glob rozwiązanej ścieżki pliku wykonywalnego albo glob samej nazwy polecenia dla poleceń wywoływanych przez PATH |
| Zakres argumentów | Ograniczony przez profil bezpiecznego binarium i reguły tokenów dosłownych | Domyślnie dopasowanie ścieżki; opcjonalne `argPattern` może ograniczać parsowane argv |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI                              |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w potokach        | Każde narzędzie o szerszym zachowaniu lub skutkach ubocznych                       |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` albo per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` albo per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` albo per-agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per-agent zastępują klucze globalne.
- Wpisy listy dozwolonych znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (albo przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega za pomocą `tools.exec.safe_bins_interpreter_unprofiled`, gdy binaria interpreterów/środowisk uruchomieniowych pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć brakujące niestandardowe wpisy `safeBinProfiles.<bin>` jako `{}` (potem przejrzyj i zaostrz). Binaria interpreterów/środowisk uruchomieniowych nie są tworzone automatycznie.

Przykład niestandardowego profilu:
__OC_I18N_900000__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuca wbudowane `env` w trybie bezpiecznego binarium, więc `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej ścieżki listy dozwolonych albo monitu zatwierdzenia.

## Polecenia interpreterów/środowisk uruchomieniowych

Uruchomienia interpreterów/środowisk uruchomieniowych oparte na zatwierdzeniach są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptów powłoki i bezpośrednie formy plików środowiska uruchomieniowego są w najlepszym razie wiązane z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed wiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla środowiska uruchomieniowego albo niejednoznaczne formy wieloplikowe), wykonywanie oparte na zatwierdzeniu jest odmawiane zamiast deklarowania pokrycia semantycznego, którego nie ma.
- Dla tych przepływów pracy preferuj sandboxing, osobną granicę hosta albo jawnie zaufaną listę dozwolonych/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę środowiska uruchomieniowego.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia. Użyj tego identyfikatora, aby skorelować późniejsze zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli żadna decyzja nie nadejdzie przed upływem limitu czasu, żądanie jest traktowane jako przekroczenie czasu zatwierdzenia i prezentowane jako powód odmowy.

### Zachowanie dostarczania kontynuacji

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła kontynuacyjny zwrot `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczenia (kanał dostarczalny plus cel `to`), dostarczanie kontynuacji używa tego kanału.
- W przepływach tylko webchat albo sesjach wewnętrznych bez zewnętrznego celu dostarczanie kontynuacji pozostaje wyłącznie sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie zażąda ścisłego dostarczenia zewnętrznego bez rozwiązywalnego kanału zewnętrznego, żądanie kończy się niepowodzeniem z `INVALID_REQUEST`.
- Jeśli `bestEffortDeliver` jest włączone i nie można rozwiązać żadnego kanału zewnętrznego, dostarczanie jest obniżane do wyłącznie sesyjnego zamiast kończyć się niepowodzeniem.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów pluginów) i zatwierdzać je za pomocą `/approve`. Używa to normalnego potoku dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedz na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia pluginów.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną niezależną konfigurację pod `approvals.plugin`. Włączenie lub wyłączenie jednego nie wpływa na drugie.
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzeń zarówno dla zatwierdzeń exec, jak i pluginów. Kanały bez współdzielonego interfejsu interaktywnego wracają do zwykłego tekstu z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec albo pluginu pochodzi z dostarczalnej powierzchni czatu, ten sam czat może teraz domyślnie je zatwierdzić za pomocą `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i Microsoft Teams oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka polecenia tekstowego używa normalnego modelu uwierzytelniania kanału dla tej konwersacji. Jeśli czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już osobnego natywnego adaptera dostarczania tylko po to, aby pozostać oczekującymi.

Discord i Telegram także obsługują `/approve` w tym samym czacie, ale te kanały nadal używają rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń, które wywołują Gateway bezpośrednio, ten fallback jest celowo ograniczony do niepowodzeń „nie znaleziono zatwierdzenia”. Rzeczywista odmowa/błąd zatwierdzenia exec nie ponawia po cichu próby jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą także działać jako natywni klienci zatwierdzeń. Klienci natywni dodają wiadomości prywatne do zatwierdzających, rozsyłanie do czatu źródłowego i specyficzny dla kanału interaktywny UX zatwierdzania ponad współdzielony przepływ `/approve` w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny interfejs jest główną
ścieżką widoczną dla agenta. Agent nie powinien również powielać zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia wskazuje, że zatwierdzenia przez czat są niedostępne albo
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Jeśli skonfigurowano natywnego klienta zatwierdzania, ale dla kanału źródłowego nie działa
natywne środowisko uruchomieniowe, OpenClaw pozostawia widoczny lokalny deterministyczny
monit `/approve`. Jeśli natywne środowisko uruchomieniowe działa i próbuje dostarczyć kartę,
ale żaden cel jej nie otrzyma, OpenClaw wysyła w tym samym czacie zastępcze powiadomienie z
dokładnym poleceniem `/approve <id> <decision>`, aby żądanie nadal można było rozstrzygnąć.

Model ogólny:

- zasada wykonywania hosta nadal decyduje, czy wymagane jest zatwierdzenie exec
- `approvals.exec` kontroluje przekazywanie monitów zatwierdzenia do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy dany kanał działa jako natywny klient zatwierdzania

Natywni klienci zatwierdzania automatycznie włączają dostarczanie najpierw przez DM, gdy spełnione są wszystkie te warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- osoby zatwierdzające można ustalić z jawnych `execApprovals.approvers` albo z tożsamości
  właściciela, takiej jak `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzania. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy osoby zatwierdzające zostaną ustalone. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzania exec dla zatwierdzeń czatu?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzania dodają routing DM i opcjonalne rozsyłanie do kanałów na wspólnym
przepływie `/approve` w tym samym czacie oraz wspólnych przyciskach zatwierdzania.

Wspólne zachowanie:

- Slack, Matrix, Microsoft Teams i podobne czaty z możliwością dostarczenia używają normalnego modelu autoryzacji kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzania włącza się automatycznie, domyślnym natywnym celem dostarczenia są DM osób zatwierdzających
- w Discord i Telegram tylko ustalone osoby zatwierdzające mogą zatwierdzić albo odrzucić
- osoby zatwierdzające w Discord mogą być jawne (`execApprovals.approvers`) albo wywnioskowane z `commands.ownerAllowFrom`
- osoby zatwierdzające w Telegram mogą być jawne (`execApprovals.approvers`) albo wywnioskowane z `commands.ownerAllowFrom`
- osoby zatwierdzające w Slack mogą być jawne (`execApprovals.approvers`) albo wywnioskowane z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozstrzygać zatwierdzenia pluginów
  bez drugiej lokalnej warstwy zastępczej Slack
- natywny routing DM/kanału w Matrix oraz skróty reakcji obsługują zarówno zatwierdzenia exec, jak i pluginów;
  autoryzacja pluginu nadal pochodzi z `channels.matrix.dm.allowFrom`
- natywne monity Matrix zawierają niestandardową zawartość zdarzenia `com.openclaw.approval` w pierwszym zdarzeniu
  monitu, dzięki czemu klienci Matrix świadomi OpenClaw mogą odczytać ustrukturyzowany stan zatwierdzenia, a standardowi klienci
  zachowują zwykły tekstowy fallback `/approve`
- osoba zgłaszająca żądanie nie musi być osobą zatwierdzającą
- czat źródłowy może zatwierdzać bezpośrednio za pomocą `/approve`, gdy ten czat obsługuje już polecenia i odpowiedzi
- natywne przyciski zatwierdzania Discord routują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń pluginów, a wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzania Telegram stosują ten sam ograniczony fallback z exec do pluginu co `/approve`
- gdy natywne `target` włącza dostarczanie do czatu źródłowego, monity zatwierdzania zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzania nie może przyjąć żądania, monit wraca do `askFallback`

Wrażliwe polecenia grupowe dostępne tylko dla właściciela, takie jak `/diagnostics` i `/export-trajectory`, używają prywatnego
routingu właściciela dla monitów zatwierdzania i końcowych wyników. OpenClaw najpierw próbuje użyć prywatnej trasy na tej
samej powierzchni, na której właściciel uruchomił polecenie. Jeśli ta powierzchnia nie ma prywatnej trasy właściciela, następuje
fallback do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, dzięki czemu polecenie grupowe Discord
nadal może wysłać zatwierdzenie i wynik do DM właściciela w Telegram, gdy Telegram jest skonfigurowany jako
główny prywatny interfejs. Czat grupowy otrzymuje tylko krótkie potwierdzenie.

Telegram domyślnie używa DM osób zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` albo `both`, gdy
chcesz, aby monity zatwierdzania pojawiały się również w źródłowym czacie/temacie Telegram. W przypadku tematów forum Telegram
OpenClaw zachowuje temat dla monitu zatwierdzenia i dalszej odpowiedzi po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC w macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera z tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — główna zasada i przepływ zatwierdzania
- [Narzędzie exec](/pl/tools/exec)
- [Tryb podwyższony](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie automatycznego zezwalania wspierane przez Skills
