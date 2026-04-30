---
read_when:
    - Konfigurowanie bezpiecznych koszy lub niestandardowych profili bezpiecznych koszy
    - Przekazywanie zatwierdzeń do Slack/Discord/Telegram lub innych kanałów czatu
    - Implementacja natywnego klienta zatwierdzania dla kanału
summary: 'Zaawansowane zatwierdzenia exec: bezpieczne binaria, wiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia wykonywania poleceń — zaawansowane
x-i18n:
    generated_at: "2026-04-30T10:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Zaawansowane tematy zatwierdzania exec: szybka ścieżka `safeBins`, wiązanie interpretera/środowiska uruchomieniowego oraz przekazywanie zatwierdzeń do kanałów czatu (w tym dostarczanie natywne). Podstawowe zasady i przepływ zatwierdzania opisano w [Zatwierdzeniach exec](/pl/tools/exec-approvals).

## Bezpieczne binaria (tylko stdin)

`tools.exec.safeBins` definiuje niewielką listę binariów **tylko stdin** (na przykład `cut`), które mogą działać w trybie listy dozwolonych **bez** jawnych wpisów na liście dozwolonych. Bezpieczne binaria odrzucają pozycyjne argumenty plików i tokeny przypominające ścieżki, więc mogą działać wyłącznie na przychodzącym strumieniu. Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie ogólną listę zaufania.

<Warning>
**Nie** dodawaj binariów interpreterów ani środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie może ewaluować kod, wykonywać podpolecenia albo z założenia czytać pliki, preferuj jawne wpisy listy dozwolonych i pozostaw włączone monity zatwierdzeń. Niestandardowe bezpieczne binaria muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne bezpieczne binaria:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na domyślnej liście. Jeśli je włączysz, zachowaj jawne wpisy listy dozwolonych dla ich przepływów pracy innych niż stdin. Dla `grep` w trybie bezpiecznego binarium podaj wzorzec za pomocą `-e`/`--regexp`; forma pozycyjna wzorca jest odrzucana, aby operandów plików nie dało się przemycić jako niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i zabronione flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia plików w systemie hosta), co zapobiega zachowaniom wyroczni istnienia plików wynikającym z różnic allow/deny. Opcje zorientowane na pliki są zabronione dla domyślnych bezpiecznych binariów; długie opcje są walidowane w trybie fail-closed (nieznane flagi i niejednoznaczne skróty są odrzucane).

Zabronione flagi według profilu bezpiecznego binarium:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bezpieczne binaria wymuszają też traktowanie tokenów argv jako **tekstu dosłownego** w czasie wykonania (bez globowania i bez rozwijania `$VARS`) dla segmentów tylko stdin, więc wzorce takie jak `*` lub `$HOME/...` nie mogą zostać użyte do przemycenia odczytów plików.

### Zaufane katalogi binariów

Bezpieczne binaria muszą być rozwiązywane z zaufanych katalogów binariów (domyślne systemowe plus opcjonalne `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie zaufane. Domyślne zaufane katalogi są celowo minimalne: `/bin`, `/usr/bin`. Jeśli wykonywalny plik bezpiecznego binarium znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie do `tools.exec.safeBinTrustedDirs`.

### Łączenie powłoki, wrappery i multipleksery

Łączenie powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu spełnia listę dozwolonych (w tym bezpieczne binaria lub automatyczne zezwolenie Skills). Przekierowania pozostają nieobsługiwane w trybie listy dozwolonych. Podstawianie poleceń (`$()` / backticki) jest odrzucane podczas parsowania listy dozwolonych, także wewnątrz podwójnych cudzysłowów; użyj pojedynczych cudzysłowów, jeśli potrzebujesz dosłownego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst powłoki zawierający składnię sterowania powłoką lub rozwijania (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak trafienia na liście dozwolonych, chyba że samo binarium powłoki jest na liście dozwolonych.

Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env o zakresie żądania są redukowane do małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie listy dozwolonych znane wrappery uruchamiania (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżkę wewnętrznego pliku wykonywalnego zamiast ścieżki wrappera. Multipleksery powłoki (`busybox`, `toybox`) są rozpakowywane dla apletów powłoki (`sh`, `ash` itd.) w ten sam sposób. Jeśli wrappera lub multipleksera nie da się bezpiecznie rozpakować, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.

Jeśli dodajesz do listy dozwolonych interpretery takie jak `python3` lub `node`, preferuj `tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał jawnego zatwierdzenia. W trybie ścisłym `allow-always` nadal może utrwalać nieszkodliwe wywołania interpretera/skryptu, ale nośniki inline-eval nie są utrwalane automatycznie.

### Bezpieczne binaria a lista dozwolonych

| Temat | `tools.exec.safeBins` | Lista dozwolonych (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cel | Automatycznie zezwalać na wąskie filtry stdin | Jawnie ufać określonym plikom wykonywalnym |
| Typ dopasowania | Nazwa pliku wykonywalnego + zasady argv bezpiecznego binarium | Glob rozwiązanej ścieżki pliku wykonywalnego albo glob samej nazwy polecenia dla poleceń uruchamianych przez PATH |
| Zakres argumentów | Ograniczony przez profil bezpiecznego binarium i reguły tokenów dosłownych | Tylko dopasowanie ścieżki; za argumenty odpowiadasz poza tym samodzielnie |
| Typowe przykłady | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI |
| Najlepsze użycie | Transformacje tekstu niskiego ryzyka w potokach | Każde narzędzie o szerszym zachowaniu lub skutkach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` albo per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` albo per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` albo per-agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per-agent zastępują klucze globalne.
- Wpisy listy dozwolonych znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (albo przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega za pomocą `tools.exec.safe_bins_interpreter_unprofiled`, gdy binaria interpretera/środowiska uruchomieniowego pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć brakujące niestandardowe wpisy `safeBinProfiles.<bin>` jako `{}` (potem przejrzyj je i zaostrz). Binaria interpretera/środowiska uruchomieniowego nie są automatycznie tworzone.

Przykład niestandardowego profilu:
__OC_I18N_900000__
Jeśli jawnie włączysz `jq` do `safeBins`, OpenClaw nadal odrzuca wbudowane `env` w trybie bezpiecznego binarium, więc `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej ścieżki listy dozwolonych albo monitu zatwierdzenia.

## Polecenia interpretera/środowiska uruchomieniowego

Uruchomienia interpretera/środowiska uruchomieniowego oparte na zatwierdzeniach są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptu powłoki i bezpośrednie formy pliku środowiska uruchomieniowego są best-effort wiązane z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego pliku lokalnego (na przykład `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozpakowywane przed wiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla środowiska uruchomieniowego albo niejednoznaczne formy wieloplikowe), wykonanie oparte na zatwierdzeniu jest odrzucane zamiast deklarowania pokrycia semantycznego, którego nie ma.
- Dla takich przepływów pracy preferuj sandboxing, osobną granicę hosta albo jawnie zaufaną listę dozwolonych/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę środowiska uruchomieniowego.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia. Użyj tego identyfikatora do korelowania późniejszych zdarzeń systemowych (`Exec finished` / `Exec denied`). Jeśli decyzja nie nadejdzie przed timeoutem, żądanie jest traktowane jako timeout zatwierdzenia i prezentowane jako powód odmowy.

### Zachowanie dostarczania followup

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła followup turn `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczania (dostarczalny kanał plus docelowe `to`), dostarczanie followup używa tego kanału.
- W przepływach tylko webchat lub sesjach wewnętrznych bez zewnętrznego celu dostarczanie followup pozostaje tylko w sesji (`deliver: false`).
- Jeśli wywołujący jawnie zażąda ścisłego zewnętrznego dostarczania bez rozwiązywalnego kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli `bestEffortDeliver` jest włączone i nie da się rozwiązać żadnego kanału zewnętrznego, dostarczanie jest obniżane do trybu tylko sesyjnego zamiast zakończyć się błędem.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów Plugin) i zatwierdzać je za pomocą `/approve`. Używa to standardowego potoku dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedź na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia Plugin. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia Plugin.

### Przekazywanie zatwierdzeń Plugin

Przekazywanie zatwierdzeń Plugin używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną niezależną konfigurację pod `approvals.plugin`. Włączenie lub wyłączenie jednego nie wpływa na drugie.
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone interaktywne odpowiedzi renderują te same przyciski zatwierdzania zarówno dla zatwierdzeń exec, jak i Plugin. Kanały bez współdzielonego interaktywnego UI wracają do zwykłego tekstu z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub Plugin pochodzi z dostarczalnej powierzchni czatu, ten sam czat może teraz domyślnie je zatwierdzić za pomocą `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i Microsoft Teams, oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka polecenia tekstowego używa standardowego modelu autoryzacji kanału dla tej konwersacji. Jeśli czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już osobnego natywnego adaptera dostarczania tylko po to, aby pozostać w stanie oczekiwania.

Discord i Telegram także obsługują `/approve` w tym samym czacie, ale te kanały nadal używają swojej rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń, które wywołują Gateway bezpośrednio, ten fallback jest celowo ograniczony do niepowodzeń typu „approval not found”. Rzeczywista odmowa/błąd zatwierdzenia exec nie ponawia po cichu próby jako zatwierdzenie Plugin.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą także działać jako natywni klienci zatwierdzeń. Natywni klienci dodają prywatne wiadomości do zatwierdzających, fanout czatu źródłowego oraz specyficzny dla kanału interaktywny UX zatwierdzania na warstwie współdzielonego przepływu `/approve` w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny interfejs użytkownika jest podstawową ścieżką dla agenta. Agent nie powinien także powielać zwykłego polecenia czatu `/approve`, chyba że wynik narzędzia wskazuje, że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Jeśli natywny klient zatwierdzeń jest skonfigurowany, ale żadne natywne środowisko wykonawcze nie jest aktywne dla kanału źródłowego, OpenClaw pozostawia widoczny lokalny deterministyczny monit `/approve`. Jeśli natywne środowisko wykonawcze jest aktywne i próbuje dostarczyć kartę, ale żaden cel jej nie otrzymuje, OpenClaw wysyła w tym samym czacie powiadomienie zastępcze z dokładnym poleceniem `/approve <id> <decision>`, aby żądanie nadal można było rozstrzygnąć.

Model ogólny:

- polityka wykonywania hosta nadal decyduje, czy zatwierdzenie exec jest wymagane
- `approvals.exec` steruje przekazywaniem monitów zatwierdzenia do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` steruje tym, czy dany kanał działa jako natywny klient zatwierdzeń

Natywni klienci zatwierdzeń automatycznie włączają dostarczanie najpierw przez DM, gdy spełnione są wszystkie te warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można ustalić z jawnego `execApprovals.approvers` albo tożsamości właściciela, takiej jak `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić jego włączenie, gdy zatwierdzający zostaną ustaleni. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez `channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń na czacie?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzeń dodają routing DM i opcjonalne rozsyłanie do kanałów na bazie współdzielonego przepływu `/approve` w tym samym czacie oraz współdzielonych przycisków zatwierdzania.

Wspólne zachowanie:

- Slack, Matrix, Microsoft Teams i podobne czaty z możliwością dostarczania używają normalnego modelu uwierzytelniania kanału dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym natywnym celem dostarczania są DM zatwierdzających
- w przypadku Discord i Telegram tylko ustaleni zatwierdzający mogą zatwierdzać albo odmawiać
- zatwierdzający w Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający w Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający w Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginów bez drugiej, lokalnej dla Slack warstwy zastępczej
- natywny routing DM/kanału w Matrix oraz skróty reakcji obsługują zarówno zatwierdzenia exec, jak i pluginów; autoryzacja pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`
- natywne monity Matrix zawierają niestandardową treść zdarzenia `com.openclaw.approval` w pierwszym zdarzeniu monitu, aby klienci Matrix świadomi OpenClaw mogli odczytywać ustrukturyzowany stan zatwierdzenia, podczas gdy standardowi klienci zachowują zwykły tekst zastępczy `/approve`
- zgłaszający nie musi być zatwierdzającym
- czat źródłowy może zatwierdzać bezpośrednio za pomocą `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzania Discord kierują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają bezpośrednio do zatwierdzeń pluginów, a wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzania Telegram stosują ten sam ograniczony mechanizm zastępczy exec-do-pluginu co `/approve`
- gdy natywny `target` włącza dostarczanie do czatu źródłowego, monity zatwierdzenia zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, monit przechodzi na `askFallback`

Wrażliwe polecenia grupowe tylko dla właściciela, takie jak `/diagnostics` i `/export-trajectory`, używają prywatnego routingu właściciela dla monitów zatwierdzenia i wyników końcowych. OpenClaw najpierw próbuje użyć prywatnej trasy na tej samej powierzchni, na której właściciel uruchomił polecenie. Jeśli ta powierzchnia nie ma prywatnej trasy właściciela, przechodzi na pierwszą dostępną trasę właściciela z `commands.ownerAllowFrom`, więc polecenie grupowe Discord nadal może wysłać zatwierdzenie i wynik do DM właściciela w Telegram, gdy Telegram jest skonfigurowanym podstawowym interfejsem prywatnym. Czat grupowy otrzymuje tylko krótkie potwierdzenie.

Telegram domyślnie używa DM zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` albo `both`, gdy chcesz, aby monity zatwierdzenia pojawiały się także w źródłowym czacie/temacie Telegram. Dla tematów forum Telegram OpenClaw zachowuje temat dla monitu zatwierdzenia i dalszej wiadomości po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC w macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera o tym samym UID.
- Wyzwanie/odpowiedź (nonce + token HMAC + skrót żądania) + krótki TTL.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — podstawowa polityka i przepływ zatwierdzania
- [Narzędzie exec](/pl/tools/exec)
- [Tryb podwyższony](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie automatycznego zezwalania wspierane przez Skills
