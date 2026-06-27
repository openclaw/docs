---
read_when:
    - Konfigurowanie bezpiecznych przedziałów lub niestandardowych profili bezpiecznych przedziałów
    - Przekazywanie zatwierdzeń do Slack/Discord/Telegram lub innych kanałów czatu
    - Implementowanie natywnego klienta zatwierdzeń dla kanału
summary: 'Zaawansowane zatwierdzanie exec: bezpieczne pliki binarne, powiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzenia exec — zaawansowane
x-i18n:
    generated_at: "2026-06-27T18:26:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Zaawansowane tematy zatwierdzania exec: szybka ścieżka `safeBins`, wiązanie interpreter/runtime
oraz przekazywanie zatwierdzeń do kanałów czatu (w tym dostarczanie natywne).
Podstawową politykę i przepływ zatwierdzania opisano w [Zatwierdzeniach exec](/pl/tools/exec-approvals).

## Bezpieczne binaria (tylko stdin)

`tools.exec.safeBins` definiuje krótką listę binariów **tylko stdin** (na
przykład `cut`), które mogą działać w trybie listy dozwolonych **bez** jawnych
wpisów na liście dozwolonych. Bezpieczne binaria odrzucają pozycyjne argumenty
plików i tokeny podobne do ścieżek, więc mogą działać wyłącznie na strumieniu
wejściowym. Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych,
a nie ogólną listę zaufania.

<Warning>
**Nie** dodawaj interpreterów ani binariów runtime (na przykład `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie z założenia może
ewaluować kod, wykonywać podpolecenia albo czytać pliki, preferuj jawne wpisy
na liście dozwolonych i pozostaw włączone monity o zatwierdzenie. Niestandardowe
bezpieczne binaria muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne bezpieczne binaria:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na domyślnej liście. Jeśli je włączysz, zachowaj
jawne wpisy na liście dozwolonych dla ich przepływów pracy innych niż stdin.
Dla `grep` w trybie bezpiecznego binarium podaj wzorzec przez `-e`/`--regexp`;
forma pozycyjna wzorca jest odrzucana, aby operandów plików nie dało się
przemycić jako niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i odrzucane flagi

Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez
sprawdzania istnienia plików w systemie hosta), co zapobiega zachowaniu wyroczni
istnienia plików wynikającemu z różnic między zezwoleniem a odmową. Opcje
ukierunkowane na pliki są odrzucane dla domyślnych bezpiecznych binariów; długie
opcje są walidowane w trybie fail-closed (nieznane flagi i niejednoznaczne
skróty są odrzucane).

Odrzucane flagi według profilu bezpiecznego binarium:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bezpieczne binaria wymuszają także traktowanie tokenów argv jako **tekstu
literalnego** w czasie wykonania (bez globowania i bez rozwijania `$VARS`) dla
segmentów tylko stdin, więc wzorców takich jak `*` albo `$HOME/...` nie można
użyć do przemycenia odczytu plików.

### Zaufane katalogi binariów

Bezpieczne binaria muszą rozwiązywać się z zaufanych katalogów binariów
(domyślne katalogi systemowe oraz opcjonalne `tools.exec.safeBinTrustedDirs`).
Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane. Domyślne zaufane
katalogi są celowo minimalne: `/bin`, `/usr/bin`. Jeśli wykonywalny plik
bezpiecznego binarium znajduje się w ścieżkach menedżera pakietów lub użytkownika
(na przykład `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`),
dodaj je jawnie do `tools.exec.safeBinTrustedDirs`.

### Łączenie powłoki, wrappery i multipleksery

Łączenie powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego
poziomu spełnia listę dozwolonych (w tym bezpieczne binaria lub automatyczne
zezwolenie Skills). Przekierowania pozostają nieobsługiwane w trybie listy
dozwolonych. Podstawianie poleceń (`$()` / backticki) jest odrzucane podczas
parsowania listy dozwolonych, także wewnątrz podwójnych cudzysłowów; użyj
pojedynczych cudzysłowów, jeśli potrzebujesz literalnego tekstu `$()`.

W zatwierdzeniach aplikacji towarzyszącej na macOS surowy tekst powłoki
zawierający składnię sterowania powłoką lub rozwijania (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
jest traktowany jako brak dopasowania do listy dozwolonych, chyba że sama
powłoka znajduje się na liście dozwolonych.

Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env ograniczone do
żądania są redukowane do małej jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`,
`COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Dla decyzji `allow-always` w trybie listy dozwolonych znane wrappery dyspozycji
(`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżkę
wewnętrznego pliku wykonywalnego zamiast ścieżki wrappera. Multipleksery powłoki
(`busybox`, `toybox`) są rozwijane dla apletów powłoki (`sh`, `ash` itd.) w ten
sam sposób. Jeśli wrappera lub multipleksera nie da się bezpiecznie rozwinąć,
żaden wpis listy dozwolonych nie jest utrwalany automatycznie.

Jeśli dodajesz interpretery takie jak `python3` lub `node` do listy dozwolonych,
preferuj `tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał
jawnego zatwierdzenia. W trybie ścisłym `allow-always` wciąż może utrwalać
łagodne wywołania interpreter/skrypt, ale nośniki inline-eval nie są utrwalane
automatycznie.

### Bezpieczne binaria a lista dozwolonych

| Temat | `tools.exec.safeBins` | Lista dozwolonych (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cel | Automatycznie zezwalaj na wąskie filtry stdin | Jawnie ufaj konkretnym plikom wykonywalnym |
| Typ dopasowania | Nazwa pliku wykonywalnego + polityka argv bezpiecznego binarium | Glob rozwiązanej ścieżki pliku wykonywalnego albo glob samej nazwy polecenia dla poleceń wywoływanych przez PATH |
| Zakres argumentów | Ograniczony przez profil bezpiecznego binarium i reguły tokenów literalnych | Domyślnie dopasowanie ścieżki; opcjonalny `argPattern` może ograniczać sparsowane argv |
| Typowe przykłady | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI |
| Najlepsze zastosowanie | Niskiego ryzyka transformacje tekstu w potokach | Dowolne narzędzie o szerszym zachowaniu lub skutkach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` albo per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` albo per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` albo per-agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profilu per-agent nadpisują klucze globalne.
- Wpisy listy dozwolonych znajdują się w lokalnym dla hosta pliku zatwierdzeń pod `agents.<id>.allowlist` (albo przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega przez `tools.exec.safe_bins_interpreter_unprofiled`, gdy binaria interpreter/runtime pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles.<bin>` jako `{}` (potem przejrzyj i zaostrz). Binaria interpreter/runtime nie są automatycznie szkicowane.

Przykład profilu niestandardowego:
__OC_I18N_900000__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuca wbudowane `env` w trybie
bezpiecznego binarium, więc `jq -n env` nie może zrzucić środowiska procesu hosta bez
jawnej ścieżki na liście dozwolonych albo monitu o zatwierdzenie.

## Polecenia interpreter/runtime

Uruchomienia interpreter/runtime wspierane zatwierdzeniami są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze powiązany.
- Bezpośrednie formy skryptu powłoki i bezpośrednie formy pliku runtime są w najlepszym razie powiązane z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego pliku lokalnego (na przykład `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed wiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpreter/runtime (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla runtime albo niejednoznaczne formy wieloplikowe), wykonanie wspierane zatwierdzeniem jest odrzucane zamiast deklarować pokrycie semantyczne, którego nie ma.
- Dla tych przepływów pracy preferuj sandboxing, osobną granicę hosta albo jawnie zaufaną listę dozwolonych/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę runtime.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca identyfikator zatwierdzenia.
Użyj tego identyfikatora, aby powiązać późniejsze zdarzenia systemowe zatwierdzonego uruchomienia
(`Exec finished` oraz `Exec running`, gdy jest skonfigurowane). Jeśli decyzja nie nadejdzie przed
limitem czasu, żądanie jest traktowane jako timeout zatwierdzenia i ujawniane jako terminalna odmowa
polecenia hosta. Dla asynchronicznych zatwierdzeń głównego agenta z sesją źródłową OpenClaw także
wznawia tę sesję wewnętrznym followupem, aby agent zauważył, że polecenie nie zostało uruchomione,
zamiast później naprawiać brakujący wynik.

### Zachowanie dostarczania followupu

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła followup `agent` turn do tej
samej sesji. Odrzucone zatwierdzenia asynchroniczne używają tej samej ścieżki followupu sesji
głównej dla statusu odmowy, ale nie rejestrują podwyższonych przekazań runtime i nie uruchamiają
polecenia. Odmowy bez możliwej do wznowienia sesji głównej są albo tłumione, albo zgłaszane przez
bezpieczną trasę bezpośrednią, gdy taka istnieje.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczania (dostarczalny kanał plus cel `to`), dostarczanie followupu używa tego kanału.
- W przepływach wyłącznie webchat albo sesji wewnętrznej bez zewnętrznego celu dostarczanie followupu pozostaje wyłącznie sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie zażąda ścisłego dostarczenia zewnętrznego bez możliwego do rozwiązania kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli `bestEffortDeliver` jest włączone i nie można rozwiązać kanału zewnętrznego, dostarczanie jest obniżane do wyłącznie sesyjnego zamiast kończyć się błędem.

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać monity zatwierdzania exec do dowolnego kanału czatu (w tym kanałów Plugin) i zatwierdzać
je przez `/approve`. Używa to normalnego potoku dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900001__
Odpowiedź na czacie:
__OC_I18N_900002__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia Plugin. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia Plugin.

### Przekazywanie zatwierdzeń Plugin

Przekazywanie zatwierdzeń Plugin używa tego samego potoku dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację pod `approvals.plugin`. Włączenie lub wyłączenie jednego nie wpływa na drugie.
Zachowanie podczas tworzenia Plugin, pola żądania i semantykę decyzji opisano w
[Żądaniach uprawnień Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzania
zarówno dla zatwierdzeń exec, jak i Plugin. Kanały bez współdzielonego interaktywnego UI wracają
do zwykłego tekstu z instrukcjami `/approve`.
Żądania zatwierdzenia Plugin mogą ograniczać dostępne decyzje. Powierzchnie zatwierdzania używają
zadeklarowanego przez żądanie zestawu decyzji, a Gateway odrzuca próby przesłania decyzji, która
nie została zaoferowana.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub Plugin pochodzi z dostarczalnej powierzchni czatu, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka poleceń tekstowych używa zwykłego modelu autoryzacji kanału dla tej rozmowy. Jeśli
czat źródłowy może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzenia nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, aby pozostać w stanie oczekiwania.

Discord i Telegram obsługują też `/approve` w tym samym czacie, ale te kanały nadal używają swojej
rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

W przypadku Telegram i innych natywnych klientów zatwierdzania, które wywołują Gateway bezpośrednio,
ta ścieżka awaryjna jest celowo ograniczona do błędów „nie znaleziono zatwierdzenia”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie ponawia po cichu próby jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą też działać jako natywni klienci zatwierdzania. Natywni klienci dodają DM-y do zatwierdzających, rozsyłanie do czatu źródłowego
oraz interaktywny UX zatwierdzania specyficzny dla kanału ponad współdzielonym przepływem `/approve`
w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest podstawową
ścieżką widoczną dla agenta. Agent nie powinien także powtarzać zduplikowanego zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia przez czat są niedostępne albo
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Jeśli natywny klient zatwierdzania jest skonfigurowany, ale dla kanału źródłowego
nie działa żadne natywne środowisko uruchomieniowe, OpenClaw pozostawia widoczny lokalny deterministyczny
prompt `/approve`. Jeśli natywne środowisko uruchomieniowe jest aktywne i próbuje dostarczyć żądanie, ale żaden
cel nie otrzyma karty, OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z
dokładnym poleceniem `/approve <id> <decision>`, aby nadal można było rozstrzygnąć żądanie.

Model ogólny:

- polityka exec hosta nadal decyduje, czy zatwierdzenie exec jest wymagane
- `approvals.exec` kontroluje przekazywanie promptów zatwierdzenia do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy włączone są specyficzne dla kanałów natywne klienty Discord, Slack, Telegram i podobne
- zatwierdzenia pluginów Slack mogą używać natywnego klienta zatwierdzania Slack, gdy żądanie pochodzi ze Slack
  i da się rozwiązać zatwierdzających pluginu Slack; `approvals.plugin` może też kierować zatwierdzenia pluginów do sesji
  lub celów Slack nawet wtedy, gdy zatwierdzenia exec Slack są wyłączone
- natywne karty zatwierdzania Google Chat obsługują zatwierdzenia exec i pluginów, które pochodzą z przestrzeni
  lub wątków Google Chat, gdy stabilni zatwierdzający `users/<id>` zostaną rozwiązani z `dm.allowFrom` lub
  `defaultTo`; nie używają zdarzeń reakcji do decyzji
- dostarczanie zatwierdzeń reakcjami WhatsApp i Signal jest bramkowane przez `approvals.exec` i
  `approvals.plugin`; nie mają bloków `channels.<channel>.execApprovals`

Natywni klienci zatwierdzania automatycznie włączają dostarczanie najpierw przez DM, gdy wszystkie te warunki są spełnione:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można rozwiązać z jawnych `execApprovals.approvers` lub tożsamości właściciela,
  takiej jak `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzania. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy da się rozwiązać zatwierdzających. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń czatu?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: skonfiguruj stabilnych zatwierdzających za pomocą `channels.googlechat.dm.allowFrom` lub
  `channels.googlechat.defaultTo`; blok `execApprovals` nie jest wymagany
- WhatsApp: użyj `approvals.exec` i `approvals.plugin`, aby kierować prompty zatwierdzenia do WhatsApp
- Signal: użyj `approvals.exec` i `approvals.plugin`, aby kierować prompty zatwierdzenia do Signal

Ci natywni klienci zatwierdzania dodają routing DM i opcjonalne rozsyłanie kanałowe ponad współdzielonym
przepływem `/approve` w tym samym czacie oraz współdzielonymi przyciskami zatwierdzania.

Wspólne zachowanie:

- Slack, Matrix, Microsoft Teams i podobne dostarczalne czaty używają zwykłego modelu autoryzacji kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzania włącza się automatycznie, domyślnym natywnym celem dostarczania są DM-y zatwierdzających
- w przypadku Discord i Telegram tylko rozwiązani zatwierdzający mogą zatwierdzić lub odmówić
- zatwierdzający Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- DM-y zatwierdzeń pluginów Slack używają zatwierdzających pluginu Slack z `allowFrom` i domyślnego routingu
  konta, a nie zatwierdzających exec Slack
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginów
  bez drugiej lokalnej warstwy awaryjnej Slack
- natywne karty Google Chat zachowują ręczną ścieżkę awaryjną `/approve` w tekście wiadomości, ale wywołania zwrotne przycisków kart
  przenoszą tylko nieprzezroczyste tokeny akcji; identyfikator zatwierdzenia i decyzja są odzyskiwane z oczekującego stanu
  po stronie serwera
- zatwierdzenia emoji WhatsApp obsługują prompty exec i pluginów tylko wtedy, gdy pasująca nadrzędna
  rodzina przekazywania jest włączona i kieruje do WhatsApp; przekazywanie tylko do celu WhatsApp pozostaje na
  współdzielonej ścieżce przekazywania, chyba że pasuje do tego samego natywnego celu źródłowego
- zatwierdzenia reakcjami Signal obsługują prompty exec i pluginów tylko wtedy, gdy pasująca nadrzędna
  rodzina przekazywania jest włączona i kieruje do Signal. Bezpośrednie zatwierdzenia exec Signal w tym samym czacie mogą
  wyciszyć lokalną ścieżkę awaryjną `/approve` bez jawnych zatwierdzających; rozwiązywanie reakcji Signal
  nadal wymaga jawnych zatwierdzających Signal z `channels.signal.allowFrom` lub `defaultTo`.
- natywny routing DM/kanału Matrix i skróty reakcji obsługują zatwierdzenia exec i pluginów;
  autoryzacja pluginu nadal pochodzi z `channels.matrix.dm.allowFrom`
- natywne prompty Matrix zawierają niestandardową treść zdarzenia `com.openclaw.approval` w pierwszym zdarzeniu
  promptu, dzięki czemu klienty Matrix świadome OpenClaw mogą odczytać ustrukturyzowany stan zatwierdzenia, podczas gdy standardowe klienty
  zachowują zwykłą tekstową ścieżkę awaryjną `/approve`
- zgłaszający żądanie nie musi być zatwierdzającym
- czat źródłowy może zatwierdzać bezpośrednio za pomocą `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzania Discord kierują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń pluginów, wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzania Telegram podążają za tą samą ograniczoną ścieżką awaryjną exec-do-pluginu co `/approve`
- gdy natywny `target` włącza dostarczanie do czatu źródłowego, prompty zatwierdzenia zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żaden UI operatora ani skonfigurowany klient zatwierdzania nie może przyjąć żądania, prompt wraca do `askFallback`

Wrażliwe polecenia grupowe tylko dla właściciela, takie jak `/diagnostics` i `/export-trajectory`, używają prywatnego
routingu właściciela dla promptów zatwierdzenia i wyników końcowych. OpenClaw najpierw próbuje prywatnej trasy na tej
samej powierzchni, na której właściciel uruchomił polecenie. Jeśli ta powierzchnia nie ma prywatnej trasy właściciela, następuje
powrót do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, więc polecenie grupowe Discord
nadal może wysłać zatwierdzenie i wynik do DM właściciela w Telegram, gdy Telegram jest skonfigurowanym
podstawowym prywatnym interfejsem. Czat grupowy otrzymuje tylko krótkie potwierdzenie.

Telegram domyślnie używa DM-ów zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` lub `both`, gdy
chcesz, aby prompty zatwierdzenia pojawiały się także w źródłowym czacie/temacie Telegram. W przypadku tematów forum Telegram
OpenClaw zachowuje temat dla promptu zatwierdzenia i dalszej wiadomości po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC macOS
__OC_I18N_900004__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Kontrola peera z tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## FAQ

### Kiedy `accountId` i `threadId` byłyby używane w celu zatwierdzenia?

Użyj `accountId`, gdy kanał ma wiele skonfigurowanych tożsamości, a prompt zatwierdzenia musi
wyjść przez jedno konkretne konto. Użyj `threadId`, gdy miejsce docelowe obsługuje tematy lub
wątki, a prompt powinien pozostać wewnątrz tego wątku zamiast w czacie najwyższego poziomu.

Konkretny przypadek Telegram to supergrupa operacyjna z tematami forum i dwoma kontami bota Telegram.
Wartość `to` wskazuje supergrupę, `accountId` wybiera konto bota, a `threadId`
wybiera temat forum:
__OC_I18N_900005__
Przy takiej konfiguracji przekazywane zatwierdzenia exec są publikowane przez konto Telegram `ops-bot` w temacie
`77` czatu `-1001234567890`. Cel bez `accountId` używa domyślnego konta kanału, a
cel bez `threadId` publikuje do miejsca docelowego najwyższego poziomu.

### Gdy zatwierdzenia są wysyłane do sesji, czy każda osoba w tej sesji może je zatwierdzić?

Nie. Dostarczanie do sesji kontroluje tylko miejsce pojawienia się promptu. Samo w sobie nie upoważnia każdego
uczestnika tego czatu do zatwierdzania.

W przypadku ogólnego `/approve` w tym samym czacie nadawca musi już mieć autoryzację do poleceń w tej
sesji kanału. Jeśli kanał ujawnia jawnych zatwierdzających, ci zatwierdzający mogą autoryzować
akcję `/approve`, nawet gdy poza tym nie mają autoryzacji do poleceń w tej sesji.

Niektóre kanały są bardziej rygorystyczne. Discord, Telegram, Matrix, natywne DM-y zatwierdzeń Slack i podobne
natywne klienty zatwierdzania używają swoich rozwiązanych list zatwierdzających do autoryzacji zatwierdzeń. Na przykład
prompt zatwierdzenia w temacie forum Telegram może być widoczny dla wszystkich w temacie, ale tylko numeryczne
identyfikatory użytkowników Telegram rozwiązane z `channels.telegram.execApprovals.approvers` lub
`commands.ownerAllowFrom` mogą go zatwierdzić lub odrzucić.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — główna polityka i przepływ zatwierdzania
- [Narzędzie exec](/pl/tools/exec)
- [Tryb elevated](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — zachowanie automatycznego zezwalania oparte na Skills
