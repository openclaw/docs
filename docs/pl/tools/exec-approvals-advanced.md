---
read_when:
    - Konfigurowanie bezpiecznych katalogów binarnych lub niestandardowych profili bezpiecznych katalogów binarnych
    - Przekazywanie zatwierdzeń do Slack/Discord/Telegram lub innych kanałów czatu
    - Implementacja natywnego klienta zatwierdzeń dla kanału
summary: 'Zaawansowane zatwierdzenia exec: bezpieczne binaria, wiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia wykonania — zaawansowane
x-i18n:
    generated_at: "2026-05-07T01:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Zaawansowane tematy zatwierdzania exec: szybka ścieżka `safeBins`, wiązanie interpretera/środowiska uruchomieniowego
oraz przekazywanie zatwierdzeń do kanałów czatu (w tym dostarczanie natywne).
Zasadniczą politykę i przepływ zatwierdzania opisuje [zatwierdzanie exec](/pl/tools/exec-approvals).

## Bezpieczne binaria (tylko stdin)

`tools.exec.safeBins` definiuje krótką listę binariów **tylko stdin** (na
przykład `cut`), które mogą działać w trybie allowlisty **bez** jawnych wpisów
allowlisty. Bezpieczne binaria odrzucają pozycyjne argumenty plików i tokeny
podobne do ścieżek, więc mogą działać tylko na przychodzącym strumieniu. Traktuj
to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie ogólną listę zaufania.

<Warning>
**Nie** dodawaj binariów interpreterów ani środowisk uruchomieniowych (na
przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli
polecenie może oceniać kod, wykonywać podpolecenia lub z założenia czytać pliki,
preferuj jawne wpisy allowlisty i pozostaw włączone monity o zatwierdzenie.
Niestandardowe bezpieczne binaria muszą definiować jawny profil w
`tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne bezpieczne binaria:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na domyślnej liście. Jeśli się na nie zdecydujesz,
zachowaj jawne wpisy allowlisty dla ich przepływów innych niż stdin. Dla `grep` w
trybie bezpiecznego binarium podaj wzorzec przez `-e`/`--regexp`; forma wzorca
pozycyjnego jest odrzucana, aby operandów plików nie dało się przemycić jako
niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i zabronione flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez
sprawdzania istnienia w systemie plików hosta), co zapobiega zachowaniu wyroczni
istnienia plików wynikającemu z różnic między zezwoleniem a odmową. Opcje
zorientowane na pliki są zabronione dla domyślnych bezpiecznych binariów; długie
opcje są walidowane w trybie fail-closed (nieznane flagi i niejednoznaczne skróty
są odrzucane).

Zabronione flagi według profilu bezpiecznego binarium:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bezpieczne binaria wymuszają też traktowanie tokenów argv jako **tekstu literalnego**
podczas wykonywania (bez globowania i bez rozwijania `$VARS`) dla segmentów tylko stdin,
więc wzorce takie jak `*` lub `$HOME/...` nie mogą zostać użyte do przemycenia odczytów plików.

### Zaufane katalogi binariów

Bezpieczne binaria muszą być rozwiązywane z zaufanych katalogów binariów (domyślne
systemowe plus opcjonalne `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy
nie są automatycznie uznawane za zaufane. Domyślne zaufane katalogi są celowo
minimalne: `/bin`, `/usr/bin`. Jeśli plik wykonywalny bezpiecznego binarium
znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je
jawnie do `tools.exec.safeBinTrustedDirs`.

### Łączenie poleceń powłoki, wrappery i multipleksery

Łączenie poleceń powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment
najwyższego poziomu spełnia wymagania allowlisty (w tym bezpieczne binaria lub
automatyczne zezwolenie umiejętności). Przekierowania pozostają nieobsługiwane w
trybie allowlisty. Podstawianie poleceń (`$()` / backticks) jest odrzucane podczas
parsowania allowlisty, również wewnątrz podwójnych cudzysłowów; użyj pojedynczych
cudzysłowów, jeśli potrzebujesz literalnego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej na macOS surowy tekst powłoki zawierający
składnię sterowania powłoką lub rozwijania (`&&`, `||`, `;`, `|`, `` ` ``, `$`,
`<`, `>`, `(`, `)`) jest traktowany jako brak trafienia allowlisty, chyba że samo
binarium powłoki znajduje się na allowliście.

Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env zakresu żądania
są redukowane do małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie allowlisty znane wrappery dyspozytorskie
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżkę wewnętrznego
pliku wykonywalnego zamiast ścieżki wrappera. Multipleksery powłoki (`busybox`,
`toybox`) są rozwijane dla apletów powłoki (`sh`, `ash` itd.) w taki sam sposób.
Jeśli wrappera lub multipleksera nie da się bezpiecznie rozwinąć, żaden wpis
allowlisty nie jest automatycznie utrwalany.

Jeśli dodajesz do allowlisty interpretery takie jak `python3` lub `node`, preferuj
`tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał jawnego
zatwierdzenia. W trybie ścisłym `allow-always` nadal może utrwalać nieszkodliwe
wywołania interpretera/skryptu, ale nośniki inline eval nie są utrwalane automatycznie.

### Bezpieczne binaria a allowlista

| Temat            | `tools.exec.safeBins`                                  | Allowlista (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cel              | Automatyczne zezwalanie na wąskie filtry stdin         | Jawne zaufanie konkretnym plikom wykonywalnym                                      |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv bezpiecznego binarium | Glob rozwiązanej ścieżki pliku wykonywalnego lub glob samej nazwy polecenia dla poleceń wywoływanych przez PATH |
| Zakres argumentów | Ograniczony przez profil bezpiecznego binarium i reguły tokenów literalnych | Domyślnie dopasowanie ścieżki; opcjonalne `argPattern` może ograniczyć sparsowane argv |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI                              |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w potokach        | Dowolne narzędzie o szerszym zachowaniu lub skutkach ubocznych                     |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` lub per agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` lub per agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` lub per agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per agent zastępują klucze globalne.
- Wpisy allowlisty znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (lub przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega przez `tools.exec.safe_bins_interpreter_unprofiled`, gdy binaria interpreterów/środowisk uruchomieniowych występują w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles.<bin>` jako `{}` (potem przejrzyj i zaostrz). Binaria interpreterów/środowisk uruchomieniowych nie są automatycznie szkicowane.

Przykład niestandardowego profilu:
__OC_I18N_900000__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuca wbudowane `env` w trybie
bezpiecznego binarium, więc `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej
ścieżki allowlisty lub monitu o zatwierdzenie.

## Polecenia interpreterów/środowisk uruchomieniowych

Uruchomienia interpreterów/środowisk uruchomieniowych wspierane zatwierdzeniami są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptów powłoki i bezpośrednie formy plików środowiska uruchomieniowego są w miarę możliwości wiązane z jedną konkretną migawką pliku lokalnego.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego pliku lokalnego (na przykład `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed wiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla środowiska uruchomieniowego lub niejednoznaczne formy wieloplikowe), wykonanie wspierane zatwierdzeniem jest odrzucane zamiast deklarowania pokrycia semantycznego, którego nie ma.
- Dla tych przepływów preferuj sandboxing, osobną granicę hosta albo jawnie zaufaną allowlistę/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę środowiska uruchomieniowego.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca wynik natychmiast z identyfikatorem zatwierdzenia. Użyj tego identyfikatora, aby skorelować późniejsze zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli żadna decyzja nie nadejdzie przed limitem czasu, żądanie jest traktowane jako timeout zatwierdzenia i prezentowane jako powód odmowy.

### Zachowanie dostarczania odpowiedzi uzupełniającej

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła uzupełniający turn `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczania (kanał z możliwością dostarczenia plus docelowe `to`), dostarczanie uzupełniające używa tego kanału.
- W przepływach tylko webchat lub sesji wewnętrznych bez zewnętrznego celu dostarczanie uzupełniające pozostaje tylko sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie żąda ścisłego dostarczania zewnętrznego bez rozwiązywalnego kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli `bestEffortDeliver` jest włączone i nie można rozwiązać kanału zewnętrznego, dostarczanie jest obniżane do tylko sesyjnego zamiast kończyć się błędem.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów pluginów) i zatwierdzać
je przez `/approve`. Używa to zwykłego potoku dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedz na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów. Jeśli ID nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia pluginów.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację pod `approvals.plugin`. Włączenie lub wyłączenie jednego nie wpływa na drugie.
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone interaktywne odpowiedzi renderują te same przyciski zatwierdzania zarówno dla zatwierdzeń exec, jak i
pluginów. Kanały bez współdzielonego interaktywnego UI wracają do zwykłego tekstu z instrukcjami `/approve`.
Żądania zatwierdzeń pluginów mogą ograniczać dostępne decyzje. Powierzchnie zatwierdzania używają zadeklarowanego zestawu decyzji żądania, a Gateway odrzuca próby przesłania decyzji, która nie została zaoferowana.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub pluginu pochodzi z dostarczalnej powierzchni czatu, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka polecenia tekstowego używa zwykłego modelu autoryzacji kanału dla tej rozmowy. Jeśli
czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzenia nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, aby pozostać oczekujące.

Discord i Telegram również obsługują `/approve` w tym samym czacie, ale te kanały nadal używają swojej
rozwiązanej listy zatwierdzających do autoryzacji nawet wtedy, gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzania, które wywołują Gateway bezpośrednio,
ten fallback jest celowo ograniczony do niepowodzeń „nie znaleziono zatwierdzenia”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie ponawia po cichu próby jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą również działać jako natywni klienci zatwierdzania. Natywni klienci dodają wiadomości DM do zatwierdzających, rozsyłanie do czatu źródłowego oraz specyficzny dla kanału interaktywny interfejs zatwierdzania UX ponad współdzielony przepływ `/approve` w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny interfejs UI jest główną ścieżką widoczną dla agenta. Agent nie powinien dodatkowo powielać zwykłego polecenia czatu `/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Jeśli skonfigurowano natywnego klienta zatwierdzania, ale dla kanału źródłowego nie jest aktywne żadne natywne środowisko uruchomieniowe, OpenClaw pozostawia widoczny lokalny deterministyczny monit `/approve`. Jeśli natywne środowisko uruchomieniowe jest aktywne i próbuje dostarczyć kartę, ale żaden cel jej nie otrzyma, OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve <id> <decision>`, aby żądanie nadal można było rozwiązać.

Model ogólny:

- zasada wykonywania hosta nadal decyduje, czy wymagane jest zatwierdzenie wykonywania
- `approvals.exec` steruje przekazywaniem monitów zatwierdzania do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` steruje tym, czy dany kanał działa jako natywny klient zatwierdzania

Natywni klienci zatwierdzania automatycznie włączają dostarczanie najpierw przez DM, gdy spełnione są wszystkie te warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można rozpoznać z jawnych `execApprovals.approvers` lub tożsamości właściciela, takiej jak `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` nie jest ustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzania. Ustaw `enabled: true`, aby wymusić jego włączenie, gdy zatwierdzający zostaną rozpoznani. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez `channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń wykonywania dla zatwierdzeń przez czat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzania dodają kierowanie przez DM i opcjonalne rozsyłanie do kanału ponad współdzielony przepływ `/approve` w tym samym czacie oraz współdzielone przyciski zatwierdzania.

Współdzielone zachowanie:

- Slack, Matrix, Microsoft Teams i podobne czaty z możliwością dostarczania używają normalnego modelu autoryzacji kanału dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzania włącza się automatycznie, domyślnym natywnym celem dostarczania są wiadomości DM do zatwierdzających
- w Discord i Telegram tylko rozpoznani zatwierdzający mogą zatwierdzać lub odmawiać
- zatwierdzający w Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający w Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający w Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginu bez drugiej lokalnej warstwy awaryjnej Slack
- natywne kierowanie DM/kanału w Matrix i skróty reakcji obsługują zarówno zatwierdzenia wykonywania, jak i pluginu; autoryzacja pluginu nadal pochodzi z `channels.matrix.dm.allowFrom`
- natywne monity Matrix zawierają niestandardową treść zdarzenia `com.openclaw.approval` w pierwszym zdarzeniu monitu, aby klienci Matrix świadomi OpenClaw mogli odczytać ustrukturyzowany stan zatwierdzenia, podczas gdy standardowi klienci zachowują zwykły tekst awaryjny `/approve`
- osoba żądająca nie musi być zatwierdzającym
- czat źródłowy może zatwierdzać bezpośrednio przez `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzania Discord kierują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają bezpośrednio do zatwierdzeń pluginu, a wszystko inne trafia do zatwierdzeń wykonywania
- natywne przyciski zatwierdzania Telegram stosują ten sam ograniczony awaryjny przepływ od wykonywania do pluginu co `/approve`
- gdy natywne `target` włącza dostarczanie do czatu źródłowego, monity zatwierdzania zawierają tekst polecenia
- oczekujące zatwierdzenia wykonywania domyślnie wygasają po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzania nie może przyjąć żądania, monit wraca awaryjnie do `askFallback`

Wrażliwe polecenia grupowe przeznaczone tylko dla właściciela, takie jak `/diagnostics` i `/export-trajectory`, używają prywatnego kierowania właściciela dla monitów zatwierdzania i końcowych wyników. OpenClaw najpierw próbuje użyć prywatnej trasy na tej samej powierzchni, na której właściciel uruchomił polecenie. Jeśli ta powierzchnia nie ma prywatnej trasy właściciela, przełącza się na pierwszą dostępną trasę właściciela z `commands.ownerAllowFrom`, dzięki czemu polecenie grupowe Discord nadal może wysłać zatwierdzenie i wynik do DM właściciela w Telegram, gdy Telegram jest skonfigurowanym głównym interfejsem prywatnym. Czat grupowy otrzymuje tylko krótkie potwierdzenie.

Telegram domyślnie używa wiadomości DM do zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` albo `both`, gdy chcesz, aby monity zatwierdzania pojawiały się również w źródłowym czacie/temacie Telegram. W przypadku tematów forum Telegram OpenClaw zachowuje temat dla monitu zatwierdzania i dalszej wiadomości po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC w macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera o tym samym UID.
- Wyzwanie/odpowiedź (nonce + token HMAC + hash żądania) + krótki TTL.

## Powiązane

- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals) — główna zasada i przepływ zatwierdzania
- [Narzędzie exec](/pl/tools/exec)
- [Tryb podwyższony](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie automatycznego zezwalania oparte na skillach
