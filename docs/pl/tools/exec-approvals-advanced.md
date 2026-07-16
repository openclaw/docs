---
read_when:
    - Konfigurowanie bezpiecznych programów lub niestandardowych profili bezpiecznych programów
    - Przekazywanie próśb o zatwierdzenie do Slacka/Discorda/Telegramu lub innych kanałów czatu
    - Implementacja natywnego klienta zatwierdzania dla kanału
summary: 'Zaawansowane zatwierdzanie poleceń exec: bezpieczne pliki binarne, powiązanie interpretera, przekazywanie zatwierdzeń, natywne dostarczanie'
title: Zatwierdzanie wykonywania poleceń — zaawansowane
x-i18n:
    generated_at: "2026-07-16T19:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Zaawansowane zagadnienia dotyczące zatwierdzania wykonania: szybka ścieżka `safeBins`, wiązanie interpretera/środowiska uruchomieniowego
oraz przekazywanie zatwierdzeń do kanałów czatu (w tym dostarczanie natywne).
Podstawowe zasady i przepływ zatwierdzania opisano w sekcji [Zatwierdzanie wykonania](/pl/tools/exec-approvals).

## Bezpieczne pliki binarne (tylko stdin)

`tools.exec.safeBins` określa pliki binarne działające **wyłącznie ze stdin** (na przykład `cut`), które
działają w trybie listy dozwolonych **bez** jawnych wpisów na tej liście. Bezpieczne pliki binarne odrzucają
pozycyjne argumenty plików i tokeny przypominające ścieżki, dlatego mogą operować wyłącznie na
strumieniu wejściowym. Należy traktować to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie
ogólną listę zaufanych programów.

<Warning>
**Nie** należy dodawać plików binarnych interpreterów ani środowisk uruchomieniowych (na przykład `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) do `safeBins`. Jeśli polecenie z założenia może interpretować kod,
wykonywać podpolecenia lub odczytywać pliki, należy używać jawnych wpisów na liście dozwolonych
i pozostawić włączone monity o zatwierdzenie. Niestandardowe bezpieczne pliki binarne muszą mieć jawnie
zdefiniowany profil w `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Domyślne bezpieczne pliki binarne:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Po ich włączeniu należy zachować jawne
wpisy na liście dozwolonych dla przepływów pracy, które nie używają stdin. W przypadku `grep` działającego jako bezpieczny plik binarny
wzorzec należy podać za pomocą `-e`/`--regexp`; pozycyjna postać wzorca jest odrzucana,
aby nie można było przemycić operandów plikowych jako niejednoznacznych argumentów pozycyjnych.

### Walidacja argv i niedozwolone flagi

Walidacja jest deterministyczna i opiera się wyłącznie na strukturze argv (bez sprawdzania istnienia
plików w systemie hosta), co zapobiega działaniu różnic między zezwoleniem a odmową jako wyroczni
ujawniającej istnienie pliku. Opcje dotyczące plików są niedozwolone dla domyślnych bezpiecznych plików binarnych; długie
opcje są walidowane w trybie bezpiecznej odmowy (nieznane flagi i niejednoznaczne skróty są
odrzucane). Rozpoznawane logiczne flagi tylko do odczytu domyślnych plików binarnych (na przykład
`wc -l`, `tr -d`, `uniq -c`) są akceptowane, natomiast nierozpoznane krótkie flagi pozostają
w trybie bezpiecznej odmowy i wymagają ręcznego zatwierdzenia.

Flagi niedozwolone według profilu bezpiecznego pliku binarnego:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bezpieczne pliki binarne wymuszają również traktowanie tokenów argv jako **tekstu literalnego** podczas wykonywania
(bez rozwijania symboli wieloznacznych ani `$VARS`) w segmentach używających tylko stdin, dlatego
wzorców takich jak `*` lub `$HOME/...` nie można używać do przemycania odczytu plików. `awk`,
`sed` i `jq` są zawsze odrzucane jako bezpieczne pliki binarne, ponieważ nie można zweryfikować,
że ich semantyka ogranicza się do stdin: `jq` może odczytywać dane środowiskowe i ładować kod jq z
modułów lub plików startowych. Zamiast `safeBins` należy dla tych narzędzi użyć jawnego wpisu
na liście dozwolonych lub monitu o zatwierdzenie.

### Zaufane katalogi plików binarnych

Bezpieczne pliki binarne muszą być rozpoznawane w zaufanych katalogach plików binarnych (domyślne katalogi
systemowe oraz opcjonalny `tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane.
Domyślne zaufane katalogi są celowo ograniczone do minimum: `/bin`, `/usr/bin`. Jeśli
bezpieczny plik wykonywalny znajduje się w ścieżkach menedżera pakietów lub użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), należy jawnie
dodać je do `tools.exec.safeBinTrustedDirs`.

### Łączenie poleceń powłoki, programy opakowujące i multipleksery

Łączenie poleceń powłoki (`&&`, `||`, `;`) jest dozwolone, gdy każdy segment najwyższego poziomu
spełnia wymagania listy dozwolonych (w tym jako bezpieczny plik binarny lub dzięki automatycznemu zezwoleniu Skills). Przekierowania
pozostają nieobsługiwane w trybie listy dozwolonych. Podstawianie poleceń (`$()` / odwrotne apostrofy) jest
odrzucane podczas analizy listy dozwolonych, również wewnątrz podwójnych cudzysłowów; aby użyć
literalnego tekstu `$()`, należy zastosować pojedyncze cudzysłowy.

W przypadku zatwierdzeń w aplikacji towarzyszącej dla systemu macOS nieprzetworzony tekst powłoki zawierający składnię sterowania
powłoką lub rozwijania (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest
traktowany jako brak dopasowania do listy dozwolonych, chyba że sam plik binarny powłoki znajduje się na tej liście.

W przypadku programów opakowujących powłokę (`bash|sh|zsh ... -c/-lc`) przesłonięcia zmiennych środowiskowych ograniczone do żądania
są redukowane do niewielkiej jawnej listy dozwolonych wartości (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

W przypadku decyzji `allow-always` w trybie listy dozwolonych przezroczyste programy opakowujące przekazywanie
(na przykład `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają
ścieżkę wewnętrznego pliku wykonywalnego zamiast ścieżki programu opakowującego. Multipleksery powłoki
(`busybox`, `toybox`) są rozpakowywane w ten sam sposób w przypadku apletów powłoki (`sh`, `ash` itd.).
Jeśli programu opakowującego lub multipleksera nie można bezpiecznie rozpakować, żaden wpis na liście dozwolonych
nie jest automatycznie utrwalany.

Jeśli na liście dozwolonych umieszczane są interpretery takie jak `python3` lub `node`, zaleca się
`tools.exec.strictInlineEval=true`, aby interpretacja kodu wbudowanego nadal wymagała jawnego
zatwierdzenia. W trybie ścisłym `allow-always` może nadal utrwalać nieszkodliwe
wywołania interpretera/skryptu, ale nośniki interpretacji kodu wbudowanego nie są utrwalane
automatycznie.

### Bezpieczne pliki binarne a lista dozwolonych

| Temat            | `tools.exec.safeBins`                                  | Lista dozwolonych (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cel              | Automatyczne zezwalanie na wąski zakres filtrów stdin  | Jawne zaufanie określonym plikom wykonywalnym                                           |
| Typ dopasowania  | Nazwa pliku wykonywalnego + zasady argv bezpiecznego pliku binarnego | Glob rozpoznanej ścieżki pliku wykonywalnego lub glob samej nazwy polecenia dla poleceń wywoływanych przez PATH |
| Zakres argumentów | Ograniczony przez profil bezpiecznego pliku binarnego i reguły tokenów literalnych | Domyślnie dopasowanie ścieżki; opcjonalny `argPattern` może ograniczyć przeanalizowane argv |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe narzędzia CLI                                     |
| Najlepsze zastosowanie | Przekształcenia tekstu niskiego ryzyka w potokach | Dowolne narzędzie o szerszym działaniu lub skutkach ubocznych                              |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` lub `agents.list[].tools.exec.safeBins` dla danego agenta).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` lub `agents.list[].tools.exec.safeBinTrustedDirs` dla danego agenta).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` lub `agents.list[].tools.exec.safeBinProfiles` dla danego agenta). Klucze profilu danego agenta zastępują klucze globalne.
- wpisy listy dozwolonych znajdują się w lokalnym dla hosta pliku zatwierdzeń w `agents.<id>.allowlist` (lub są dostępne za pośrednictwem interfejsu Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` wyświetla ostrzeżenie `tools.exec.safe_bins_interpreter_unprofiled`, gdy pliki binarne interpreterów/środowisk uruchomieniowych występują w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles.<bin>` jako `{}` (następnie należy je przejrzeć i zaostrzyć). Pliki binarne interpreterów/środowisk uruchomieniowych nie są automatycznie dodawane do szkieletu.

Przykład profilu niestandardowego:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Polecenia interpreterów/środowisk uruchomieniowych

Uruchomienia interpreterów/środowisk uruchomieniowych oparte na zatwierdzeniu są celowo obsługiwane zachowawczo:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie postacie skryptu powłoki i pliku środowiska uruchomieniowego są w miarę możliwości wiązane z jedną konkretną lokalną
  migawką pliku.
- Typowe postacie programów opakowujących menedżera pakietów, które nadal wskazują jeden bezpośredni plik lokalny (na przykład
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozpakowywane przed wiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego pliku lokalnego dla polecenia interpretera/środowiska uruchomieniowego
  (na przykład w przypadku skryptów pakietów, postaci interpretujących kod, łańcuchów modułów ładujących specyficznych dla środowiska uruchomieniowego lub niejednoznacznych postaci obejmujących wiele plików),
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast deklarowania pokrycia semantycznego, którego
  nie zapewnia.
- W takich przepływach pracy zaleca się izolację w piaskownicy, oddzielną granicę hosta lub jawnie zaufaną
  listę dozwolonych/pełny przepływ pracy, w którym operator akceptuje szerszą semantykę środowiska uruchomieniowego.

Gdy zatwierdzenia są wymagane, narzędzie wykonawcze natychmiast zwraca identyfikator zatwierdzenia. Tego identyfikatora należy użyć do
korelowania późniejszych zdarzeń systemowych zatwierdzonego uruchomienia (`Exec finished` oraz `Exec running`, jeśli jest skonfigurowane).
Jeśli przed upływem limitu czasu nie nadejdzie decyzja, żądanie jest traktowane jako przekroczenie limitu czasu zatwierdzenia i
zgłaszane jako końcowa odmowa wykonania polecenia hosta. W przypadku asynchronicznych zatwierdzeń głównego agenta z sesją
źródłową OpenClaw wznawia również tę sesję za pomocą wewnętrznej kontynuacji, dzięki czemu agent otrzymuje informację,
że polecenie nie zostało uruchomione, zamiast później próbować naprawić brakujący wynik. Oczekujące zatwierdzenia wykonania wygasają
domyślnie po 30 minutach.

### Sposób dostarczania kontynuacji

Po zakończeniu zatwierdzonego wykonania asynchronicznego OpenClaw wysyła do tej samej sesji turę kontynuacji `agent`.
Odrzucone zatwierdzenia asynchroniczne używają tej samej ścieżki kontynuacji sesji głównej do przekazania stanu odmowy, ale
nie rejestrują przekazań do środowiska uruchomieniowego o podwyższonych uprawnieniach ani nie uruchamiają polecenia. Odmowy bez możliwej do wznowienia
sesji głównej są pomijane albo zgłaszane bezpieczną ścieżką bezpośrednią, jeśli taka istnieje.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczania (kanał obsługujący dostarczanie oraz cel `to`), kontynuacja jest dostarczana przez ten kanał.
- W przepływach obejmujących wyłącznie czat internetowy lub sesję wewnętrzną, bez zewnętrznego celu, kontynuacja jest dostarczana wyłącznie do sesji (`deliver: false`).
- Jeśli wywołujący jawnie zażąda ścisłego dostarczania zewnętrznego bez możliwego do ustalenia kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli `bestEffortDeliver` jest włączone i nie można ustalić kanału zewnętrznego, dostarczanie zostaje ograniczone do sesji zamiast zakończyć się błędem.

## Przekazywanie zatwierdzeń do kanałów czatu

Monity o zatwierdzenie wykonania można przekazywać do dowolnego kanału czatu (w tym kanałów Pluginów) i zatwierdzać
je za pomocą `/approve`. Odbywa się to przez standardowy potok dostarczania wychodzącego.

Konfiguracja:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Odpowiedź na czacie:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Polecenie `/approve` obsługuje zarówno zatwierdzenia wykonania, jak i zatwierdzenia pluginów. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia wykonania, automatycznie sprawdzane są zamiast tego zatwierdzenia pluginów. Ten mechanizm rezerwowy jest ograniczony do błędów „nie znaleziono zatwierdzenia”; rzeczywista odmowa lub błąd zatwierdzenia wykonania nie powoduje cichej ponownej próby jako zatwierdzenie pluginu.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów korzysta z tego samego potoku dostarczania co zatwierdzenia wykonania, ale ma własną
niezależną konfigurację w `approvals.plugin`. Włączenie lub wyłączenie jednego mechanizmu nie wpływa na drugi.
Informacje o zachowaniu podczas tworzenia pluginów, polach żądań i semantyce decyzji zawiera sekcja
[Żądania uprawnień pluginów](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Struktura konfiguracji jest identyczna jak w `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają w ten sam sposób.

Kanały obsługujące współdzielone interaktywne odpowiedzi wyświetlają te same przyciski zatwierdzania zarówno dla zatwierdzeń wykonania, jak i
pluginów. Kanały bez współdzielonego interaktywnego interfejsu użytkownika używają zwykłego tekstu z instrukcjami
`/approve`. Żądania zatwierdzenia pluginów mogą ograniczać dostępne decyzje: interfejsy zatwierdzania używają
zestawu decyzji zadeklarowanego w żądaniu, a Gateway odrzuca próby przesłania decyzji, której
nie zaoferowano.

### Zatwierdzanie na tym samym czacie w dowolnym kanale

Gdy żądanie zatwierdzenia wykonania lub pluginu pochodzi z powierzchni czatu obsługującej dostarczanie, ten sam czat
może je domyślnie zatwierdzić za pomocą `/approve`. Dotyczy to Slack, Matrix, Microsoft Teams i
podobnych czatów obsługujących dostarczanie, oprócz istniejących przepływów w internetowym i terminalowym interfejsie użytkownika, z użyciem
standardowego modelu uwierzytelniania kanału dla tej konwersacji. Jeśli czat źródłowy może już wysyłać polecenia
i odbierać odpowiedzi, oczekujące żądania zatwierdzenia nie wymagają już osobnego natywnego adaptera dostarczania.

Discord, Telegram i bot QQ również obsługują `/approve` na tym samym czacie, ale te kanały nadal używają
ustalonej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą również działać jako natywne klienty zatwierdzania: Discord, Slack, Telegram, Matrix i bot QQ.
Natywne klienty dodają wiadomości prywatne do zatwierdzających, rozsyłanie do czatu źródłowego i interaktywny interfejs zatwierdzania właściwy dla kanału
do współdzielonego przepływu `/approve` na tym samym czacie.

Gdy dostępne są natywne karty lub przyciski zatwierdzania, ten natywny interfejs użytkownika jest główną ścieżką dla agenta.
Agent nie powinien dodatkowo powtarzać zduplikowanego polecenia `/approve` na zwykłym czacie, chyba że wynik narzędzia wskazuje,
że zatwierdzanie przez czat jest niedostępne lub zatwierdzenie ręczne jest jedyną pozostałą ścieżką.

Jeśli skonfigurowano natywnego klienta zatwierdzania, ale dla kanału źródłowego nie działa żadne natywne środowisko
uruchomieniowe, OpenClaw pozostawia widoczny lokalny, deterministyczny monit `/approve`. Jeśli natywne środowisko uruchomieniowe
jest aktywne i podejmuje próbę dostarczenia, ale żaden cel nie otrzyma karty, OpenClaw wysyła na tym samym czacie powiadomienie
rezerwowe z dokładnym poleceniem `/approve <id> <decision>`, aby nadal można było rozstrzygnąć żądanie.

Model ogólny:

- zasady wykonywania hosta nadal określają, czy zatwierdzenie wykonania jest wymagane
- `approvals.exec` steruje przekazywaniem monitów zatwierdzania do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` określa, czy natywne klienty właściwe dla kanałów, takich jak Discord, Slack, Telegram, bot QQ i podobne,
  są włączone
- zatwierdzenia pluginów Slack mogą używać natywnego klienta zatwierdzania Slack, gdy żądanie pochodzi ze Slack
  i uda się ustalić zatwierdzających pluginy Slack; `approvals.plugin` może również kierować zatwierdzenia pluginów do sesji
  lub celów Slack, nawet gdy zatwierdzenia wykonania Slack są wyłączone
- natywne karty zatwierdzania Google Chat obsługują zatwierdzenia wykonania i pluginów pochodzące z pokoi lub wątków Google
  Chat, gdy stabilni zatwierdzający `users/<id>` zostaną ustaleni z `dm.allowFrom` lub
  `defaultTo`; nie używają zdarzeń reakcji do podejmowania decyzji
- dostarczanie zatwierdzeń przez reakcje w WhatsApp i Signal jest kontrolowane przez `approvals.exec` i
  `approvals.plugin`; nie mają one bloków `channels.<channel>.execApprovals`

Natywne klienty zatwierdzania automatycznie włączają dostarczanie najpierw przez wiadomości prywatne, gdy spełnione są wszystkie poniższe warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można ustalić na podstawie jawnej wartości `execApprovals.approvers` lub tożsamości
  właściciela, takiej jak `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` nie jest ustawione lub ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzania. Ustaw `enabled: true`, aby wymusić
jego włączenie po ustaleniu zatwierdzających. Publiczne dostarczanie do czatu źródłowego pozostaje jawnie konfigurowane przez
`channels.<channel>.execApprovals.target`. Gdy natywne `target` włącza dostarczanie do czatu źródłowego,
monity zatwierdzania zawierają tekst polecenia.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzania wykonania dla zatwierdzeń na czacie?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- bot QQ: `channels.qqbot.execApprovals.*`
- Google Chat: skonfiguruj stabilnych zatwierdzających za pomocą `channels.googlechat.dm.allowFrom` lub
  `channels.googlechat.defaultTo`; blok `execApprovals` nie jest wymagany
- WhatsApp: użyj `approvals.exec` i `approvals.plugin`, aby kierować monity zatwierdzania do WhatsApp
- Signal: użyj `approvals.exec` i `approvals.plugin`, aby kierować monity zatwierdzania do Signal

Trasowanie właściwe dla natywnych klientów:

- Telegram domyślnie wysyła wiadomości prywatne do zatwierdzających (`target: "dm"`). Przełącz na `channel` lub `both`, aby również wyświetlać
  monity zatwierdzania na źródłowym czacie lub w temacie Telegram. W przypadku tematów forum Telegram OpenClaw
  zachowuje temat dla monitu zatwierdzania i dalszej wiadomości po zatwierdzeniu.
- zatwierdzający w Discord i Telegram mogą być określeni jawnie (`execApprovals.approvers`) lub wywnioskowani z
  `commands.ownerAllowFrom`; zatwierdzać lub odrzucać mogą wyłącznie ustaleni zatwierdzający.
- zatwierdzający w Slack mogą być określeni jawnie (`execApprovals.approvers`) lub wywnioskowani z
  `commands.ownerAllowFrom`. Wiadomości prywatne z zatwierdzeniami pluginów Slack używają zatwierdzających pluginy Slack z `allowFrom`
  oraz domyślnego trasowania konta, a nie zatwierdzających wykonanie w Slack. Natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia,
  dzięki czemu identyfikatory `plugin:` mogą rozstrzygać zatwierdzenia pluginów bez drugiej, lokalnej warstwy rezerwowej Slack.
- natywne karty Google Chat zachowują ręczny mechanizm rezerwowy `/approve` w tekście wiadomości, ale wywołania zwrotne
  przycisków kart przenoszą wyłącznie nieprzezroczyste tokeny akcji; identyfikator zatwierdzenia i decyzja są odtwarzane z
  oczekującego stanu po stronie serwera.
- zatwierdzenia za pomocą emoji w WhatsApp obsługują zarówno monity wykonania, jak i pluginów, gdy odpowiadająca im nadrzędna
  rodzina przekazywania kieruje je do WhatsApp. Monity natywnego pochodzenia są wiązane bezpośrednio; współdzielone dostarczanie w trybie celu
  wiąże te same typowane metadane zatwierdzenia z potwierdzeniem odebrania zaakceptowanej wiadomości WhatsApp.
- zatwierdzenia przez reakcje Signal obsługują zarówno monity wykonania, jak i pluginów wyłącznie wtedy, gdy odpowiadająca im nadrzędna
  rodzina przekazywania jest włączona i kieruje je do Signal. Bezpośrednie zatwierdzenia wykonania Signal na tym samym czacie mogą
  wyłączyć lokalny mechanizm rezerwowy `/approve` bez jawnie określonych zatwierdzających; rozstrzyganie reakcji Signal
  nadal wymaga jawnych zatwierdzających Signal z `channels.signal.allowFrom` lub `defaultTo`.
- natywne trasowanie Matrix do wiadomości prywatnych lub kanałów oraz skróty reakcji obsługują zarówno zatwierdzenia wykonania, jak i pluginów;
  autoryzacja pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`. Natywne monity Matrix
  zawierają niestandardową treść zdarzenia `com.openclaw.approval` w pierwszym zdarzeniu monitu, dzięki czemu klienty
  Matrix obsługujące OpenClaw mogą odczytać ustrukturyzowany stan zatwierdzenia, podczas gdy standardowe klienty zachowują zwykły tekstowy
  mechanizm rezerwowy `/approve`.
- natywne przyciski zatwierdzania Discord i Telegram przenoszą jawny rodzaj właściciela — wykonanie lub plugin —
  w prywatnych danych wywołania zwrotnego transportu i rozstrzygają wyłącznie tego właściciela. Starsze elementy sterujące `/approve`, które nie mają
  rodzaju, pozostają ograniczoną ścieżką zgodności: próbują wyłącznie rodzajów właścicieli, które aktor może zatwierdzić,
  kontynuują tylko po wyniku „nie znaleziono zatwierdzenia” i nigdy nie wnioskują własności na podstawie identyfikatora zatwierdzenia.
- osoba wysyłająca żądanie nie musi być zatwierdzającym.
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzania nie może przyjąć żądania, monit używa mechanizmu rezerwowego
  `askFallback`.

Poufne polecenia grupowe dostępne wyłącznie dla właściciela, takie jak `/diagnostics` i `/export-trajectory`, używają prywatnego
trasowania do właściciela dla monitów zatwierdzania i wyników końcowych. OpenClaw najpierw próbuje użyć prywatnej trasy na tej samej
powierzchni, na której właściciel uruchomił polecenie. Jeśli ta powierzchnia nie ma prywatnej trasy do właściciela, używana jest
pierwsza dostępna trasa właściciela z `commands.ownerAllowFrom`, dzięki czemu polecenie grupowe Discord
może nadal wysłać zatwierdzenie i wynik do prywatnej wiadomości właściciela w Telegram, gdy Telegram jest skonfigurowanym
podstawowym interfejsem prywatnym. Czat grupowy otrzymuje tylko krótkie potwierdzenie.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [bot QQ](/channels/qqbot)

### Oficjalne aplikacje operatora na urządzenia mobilne

Oficjalne aplikacje na iOS i Android mogą również przeglądać należące do Gateway oczekujące zatwierdzenia
wykonania, gdy używane jest połączenie `operator.admin` lub gdy sparowane z nimi
urządzenie `operator.approvals` zostało jawnie wskazane jako cel żądania. Odczytują
ten sam oczyszczony, trwały rekord, którego używa
Control UI, przesyłają decyzję uwzględniającą rodzaj i wyświetlają kanoniczny wynik
pierwszej odpowiedzi z Gateway. Apple Watch odzwierciedla te monity zatwierdzania za pośrednictwem
sparowanego iPhone'a, udostępniając akcje jednorazowego zezwolenia i odmowy. Bezpośredni tryb Gateway na zegarku
nie umożliwia przeglądania zatwierdzeń.

Utrata potwierdzenia rozstrzygnięcia nie powoduje, że przesłany wybór staje się wiążący:
aplikacja wyłącza elementy sterujące i ponownie odczytuje rekord. Jeśli inna powierzchnia
odpowiedziała jako pierwsza, aplikacja wyświetla zapisaną decyzję. Oczekujące monity pozostają powiązane z
Gateway, który je wystawił, więc przełączenie aktywnego Gateway nie może przekierować
starego identyfikatora zatwierdzenia.

### Przepływ IPC w macOS

```
Gateway -> Usługa Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Aplikacja Mac (interfejs użytkownika + zatwierdzenia + system.run)
```

Uwagi dotyczące bezpieczeństwa:

- tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- kontrola równorzędnego procesu o tym samym UID.
- wyzwanie/odpowiedź (nonce + token HMAC + skrót żądania) + krótki TTL.

## FAQ

### Kiedy wartości `accountId` i `threadId` byłyby używane w celu zatwierdzania?

Użyj `accountId`, gdy kanał ma wiele skonfigurowanych tożsamości, a monit zatwierdzania musi
zostać wysłany przez jedno konkretne konto. Użyj `threadId`, gdy miejsce docelowe obsługuje tematy lub
wątki, a monit powinien pozostać w tym wątku zamiast na najwyższym poziomie czatu.

Konkretnym przypadkiem w Telegram jest supergrupa operacyjna z tematami forum i dwoma kontami
botów Telegram. Wartość `to` wskazuje supergrupę, `accountId` wybiera konto bota, a `threadId`
wybiera temat forum:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Przy takiej konfiguracji przekazywane zatwierdzenia wykonania są publikowane przez konto Telegram `ops-bot` w temacie
`77` czatu `-1001234567890`. Cel bez `accountId` używa domyślnego konta kanału, a
cel bez `threadId` publikuje w miejscu docelowym najwyższego poziomu.

### Gdy zatwierdzenia są wysyłane do sesji, czy każda osoba w tej sesji może ich dokonać?

Nie. Dostarczanie do sesji określa jedynie, gdzie pojawia się monit. Samo w sobie nie upoważnia każdego
uczestnika tego czatu do zatwierdzania.

W przypadku ogólnych operacji `/approve` na tym samym czacie nadawca musi już mieć uprawnienia do wykonywania poleceń w tej
sesji kanału. Jeśli kanał udostępnia jawną listę osób zatwierdzających, mogą one autoryzować
działanie `/approve`, nawet jeśli nie mają innych uprawnień do wykonywania poleceń w tej sesji.

Niektóre kanały stosują bardziej rygorystyczne zasady. Natywne wiadomości prywatne dotyczące zatwierdzeń w Discord, Telegram, Matrix i Slack oraz podobne
natywne klienty zatwierdzania używają ustalonych list osób zatwierdzających do autoryzacji zatwierdzeń. Na przykład
monit o zatwierdzenie w temacie forum Telegram może być widoczny dla wszystkich osób w tym temacie, ale tylko numeryczne
identyfikatory użytkowników Telegram ustalone na podstawie `channels.telegram.execApprovals.approvers` lub
`commands.ownerAllowFrom` mogą go zatwierdzić lub odrzucić.

## Powiązane

- [Zatwierdzenia wykonywania](/pl/tools/exec-approvals) — podstawowe zasady i przepływ zatwierdzania
- [Narzędzie wykonywania](/pl/tools/exec)
- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
- [Skills](/pl/tools/skills) — automatyczne zezwalanie oparte na umiejętnościach
