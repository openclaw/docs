---
read_when:
    - Konfigurowanie zatwierdzeń exec lub allowlist
    - Implementowanie UX zatwierdzeń exec w aplikacji macOS
    - Przeglądanie promptów ucieczki z sandboxa i ich skutków
summary: Zatwierdzenia exec, allowlisty i prompty ucieczki z sandboxa
title: Zatwierdzenia exec
x-i18n:
    generated_at: "2026-04-05T14:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Zatwierdzenia exec

Zatwierdzenia exec to **zabezpieczenie aplikacji towarzyszącej / hosta węzła** pozwalające sandboxowanemu agentowi uruchamiać
polecenia na rzeczywistym hoście (`gateway` lub `node`). Potraktuj to jak blokadę bezpieczeństwa:
polecenia są dozwolone tylko wtedy, gdy polityka + allowlista + (opcjonalnie) zatwierdzenie użytkownika są zgodne.
Zatwierdzenia exec działają **dodatkowo** względem polityki narzędzi i elevated gatingu (chyba że elevated ma wartość `full`, co pomija zatwierdzenia).
Skuteczna polityka jest **bardziej restrykcyjna** z `tools.exec.*` i domyślnych ustawień zatwierdzeń; jeśli pole zatwierdzeń jest pominięte, używana jest wartość `tools.exec`.
Host exec używa także lokalnego stanu zatwierdzeń na danej maszynie. Lokalne dla hosta
`ask: "always"` w `~/.openclaw/exec-approvals.json` będzie nadal wyświetlać prompty, nawet jeśli
ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
Użyj `openclaw approvals get`, `openclaw approvals get --gateway` lub
`openclaw approvals get --node <id|name|ip>`, aby sprawdzić żądaną politykę,
źródła polityki hosta i wynik końcowy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie wymagające promptu
jest rozstrzygane przez **ask fallback** (domyślnie: deny).

## Gdzie to ma zastosowanie

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonania:

- **host gateway** → proces `openclaw` na maszynie gateway
- **host węzła** → runner węzła (aplikacja towarzysząca macOS lub bezgłowy host węzła)

Uwaga dotycząca modelu zaufania:

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane węzły rozszerzają tę możliwość zaufanego operatora na host węzła.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale nie są granicą uwierzytelniania per użytkownik.
- Zatwierdzone uruchomienia na hoście węzła wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env
  jeśli występuje, oraz przypiętą ścieżkę do pliku wykonywalnego, gdy ma to zastosowanie.
- Dla skryptów powłoki i bezpośrednich wywołań plików interpretera/runtime OpenClaw próbuje również powiązać
  jeden konkretny lokalny operand plikowy. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem,
  uruchomienie zostanie odrzucone zamiast wykonać zmienioną treść.
- To powiązanie pliku jest celowo rozwiązaniem best-effort, a nie pełnym modelem semantycznym każdej
  ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie może zidentyfikować dokładnie jednego konkretnego lokalnego
  pliku do powiązania, odmawia utworzenia uruchomienia opartego na zatwierdzeniu zamiast udawać pełne pokrycie.

Podział w macOS:

- **usługa hosta węzła** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **aplikacja macOS** egzekwuje zatwierdzenia + wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonania:

`~/.openclaw/exec-approvals.json`

Przykładowy schemat:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Tryb „YOLO” bez zatwierdzeń

Jeśli chcesz, aby host exec działał bez promptów zatwierdzeń, musisz otworzyć **obie** warstwy polityki:

- żądaną politykę exec w konfiguracji OpenClaw (`tools.exec.*`)
- lokalną dla hosta politykę zatwierdzeń w `~/.openclaw/exec-approvals.json`

To jest teraz domyślne zachowanie hosta, chyba że jawnie je zaostrzysz:

- `tools.exec.security`: `full` na `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Ważne rozróżnienie:

- `tools.exec.host=auto` wybiera miejsce wykonania exec: sandbox, gdy jest dostępny, w przeciwnym razie gateway.
- YOLO wybiera sposób zatwierdzania host exec: `security=full` plus `ask=off`.
- `auto` nie sprawia, że routing do gateway staje się darmowym obejściem z sesji sandboxowanej. Żądanie per wywołanie `host=node` jest dozwolone z `auto`, a `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie ma aktywnego runtime sandboxa. Jeśli chcesz stabilną wartość domyślną inną niż auto, ustaw `tools.exec.host` lub użyj jawnie `/exec host=...`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz z powrotem dowolną warstwę do `allowlist` / `on-miss`
lub `deny`.

Trwała konfiguracja hosta gateway „nigdy nie pytaj”:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Następnie ustaw plik zatwierdzeń hosta tak, aby pasował:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Dla hosta węzła zastosuj zamiast tego ten sam plik zatwierdzeń na tym węźle:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Skrót tylko dla sesji:

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to skrót awaryjny break-glass, który również pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż konfiguracja, bardziej restrykcyjna polityka hosta nadal wygrywa.

## Ustawienia polityki

### Security (`exec.security`)

- **deny**: blokuj wszystkie żądania host exec.
- **allowlist**: zezwalaj tylko na polecenia z allowlisty.
- **full**: zezwalaj na wszystko (odpowiednik elevated).

### Ask (`exec.ask`)

- **off**: nigdy nie pokazuj promptu.
- **on-miss**: pokazuj prompt tylko wtedy, gdy allowlista nie pasuje.
- **always**: pokazuj prompt dla każdego polecenia.
- trwałe zaufanie `allow-always` nie wyłącza promptów, gdy skuteczny tryb ask to `always`

### Ask fallback (`askFallback`)

Jeśli prompt jest wymagany, ale żaden interfejs UI nie jest osiągalny, fallback decyduje:

- **deny**: blokuj.
- **allowlist**: zezwalaj tylko wtedy, gdy allowlista pasuje.
- **full**: zezwalaj.

### Utwardzenie inline eval interpretera (`tools.exec.strictInlineEval`)

Gdy `tools.exec.strictInlineEval=true`, OpenClaw traktuje formy inline code-eval jako wymagające zatwierdzenia, nawet jeśli samo binarium interpretera znajduje się na allowliście.

Przykłady:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

To defense-in-depth dla loaderów interpreterów, które nie mapują się czysto do jednego stabilnego operandu plikowego. W trybie strict:

- te polecenia nadal wymagają jawnego zatwierdzenia;
- `allow-always` nie zapisuje automatycznie nowych wpisów allowlisty dla nich.

## Allowlista (per agent)

Allowlisty są **per agent**. Jeśli istnieje wielu agentów, przełącz agenta, którego
edytujesz, w aplikacji macOS. Wzorce to **dopasowania glob bez rozróżniania wielkości liter**.
Wzorce powinny rozwiązywać się do **ścieżek binariów** (wpisy zawierające tylko basename są ignorowane).
Starsze wpisy `agents.default` są migrowane do `agents.main` podczas wczytywania.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły allowlisty.

Przykłady:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis allowlisty śledzi:

- **id** stabilny UUID używany do identyfikacji w UI (opcjonalnie)
- **last used** znacznik czasu
- **last used command**
- **last resolved path**

## Auto-allow dla CLI należących do Skills

Gdy włączone jest **Auto-allow skill CLIs**, pliki wykonywalne, do których odwołują się znane Skills,
są traktowane jak wpisy allowlisty na węzłach (węzeł macOS lub bezgłowy host węzła). Używa to
`skills.bins` przez Gateway RPC do pobrania listy binariów Skill. Wyłącz to, jeśli chcesz ścisłych ręcznych allowlist.

Ważne uwagi dotyczące zaufania:

- To **niejawna wygodna allowlista**, oddzielna od ręcznych wpisów allowlisty ścieżek.
- Jest przeznaczona dla środowisk zaufanych operatorów, w których Gateway i węzeł znajdują się w tej samej granicy zaufania.
- Jeśli potrzebujesz ścisłego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów allowlisty ścieżek.

## Safe bins (tylko stdin)

`tools.exec.safeBins` definiuje niewielką listę binariów **tylko stdin** (na przykład `cut`),
które mogą działać w trybie allowlist **bez** jawnych wpisów allowlisty. Safe bins odrzucają
pozycyjne argumenty plików i tokeny podobne do ścieżek, więc mogą działać tylko na strumieniu wejściowym.
Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie ogólną listę zaufania.
**Nie** dodawaj binariów interpreterów ani runtime (na przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`.
Jeśli polecenie z definicji może wykonywać eval kodu, uruchamiać podpolecenia lub odczytywać pliki, preferuj jawne wpisy allowlisty i pozostaw włączone prompty zatwierdzeń.
Niestandardowe safe bins muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia plików w systemie hosta),
co zapobiega zachowaniu typu file-existence oracle wynikającemu z różnic allow/deny.
Opcje zorientowane na pliki są odrzucane dla domyślnych safe bins (na przykład `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins wymuszają też jawną politykę flag per binarium dla opcji, które łamią zachowanie tylko-stdin
(na przykład `sort -o/--output/--compress-program` i rekurencyjne flagi grep).
Długie opcje są walidowane fail-closed w trybie safe-bin: nieznane flagi i niejednoznaczne
skróty są odrzucane.
Odrzucone flagi według profilu safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins wymuszają również, aby tokeny argv były traktowane podczas wykonania jako **literał tekstowy** (bez globbingu
i bez rozwijania `$VARS`) dla segmentów tylko-stdin, dzięki czemu wzorce takie jak `*` lub `$HOME/...` nie mogą
zostać użyte do przemycenia odczytów plików.
Safe bins muszą też rozwiązywać się z zaufanych katalogów binariów (domyślne katalogi systemowe plus opcjonalne
`tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane.
Domyślne zaufane katalogi safe-bin są celowo minimalne: `/bin`, `/usr/bin`.
Jeśli Twoje binarium safe-bin znajduje się w ścieżkach menedżera pakietów/użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie
do `tools.exec.safeBinTrustedDirs`.
Łańcuchy powłoki i przekierowania nie są automatycznie dozwolone w trybie allowlist.

Łańcuchy powłoki (`&&`, `||`, `;`) są dozwolone, gdy każdy segment najwyższego poziomu spełnia warunki allowlisty
(w tym safe bins lub auto-allow dla Skills). Przekierowania pozostają nieobsługiwane w trybie allowlist.
Podstawienie poleceń (`$()` / backticks) jest odrzucane podczas parsowania allowlisty, także wewnątrz
cudzysłowów; użyj apostrofów, jeśli potrzebujesz dosłownego tekstu `$()`.
W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst powłoki zawierający składnię sterowania lub rozwijania powłoki
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak dopasowania allowlisty, chyba że
samo binarium powłoki znajduje się na allowliście.
Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania env o zakresie żądania są redukowane do
małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Dla decyzji allow-always w trybie allowlist znane wrappery dyspozytorskie
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) zapisują wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek wrapperów. Multipleksery powłoki (`busybox`, `toybox`) są również rozwijane dla apletów powłoki (`sh`, `ash`,
itd.), tak aby zapisywać wewnętrzne pliki wykonywalne zamiast binariów multipleksera. Jeśli wrapper lub
multiplekser nie może zostać bezpiecznie rozwinięty, żaden wpis allowlisty nie jest zapisywany automatycznie.
Jeśli umieszczasz na allowliście interpretery takie jak `python3` lub `node`, preferuj `tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał jawnego zatwierdzenia. W trybie strict
`allow-always` nadal może zapisywać nieszkodliwe wywołania interpretera/skryptu, ale nośniki inline-eval nie są zapisywane automatycznie.

Domyślne safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Jeśli jawnie je włączysz, zachowaj jawne wpisy allowlisty dla
ich przepływów pracy innych niż stdin.
Dla `grep` w trybie safe-bin podaj wzorzec przez `-e`/`--regexp`; forma wzorca pozycyjnego jest
odrzucana, aby operandów plikowych nie dało się przemycić jako niejednoznacznych argumentów pozycyjnych.

### Safe bins a allowlista

| Temat            | `tools.exec.safeBins`                                 | Allowlista (`exec-approvals.json`)                           |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Cel              | Automatycznie zezwalać na wąskie filtry stdin         | Jawnie ufać konkretnym plikom wykonywalnym                   |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv safe-bin    | Wzorzec glob rozwiązanej ścieżki pliku wykonywalnego         |
| Zakres argumentów | Ograniczony profilem safe-bin i regułami tokenów literalnych | Tylko dopasowanie ścieżki; za argumenty odpowiadasz samodzielnie |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI        |
| Najlepsze zastosowanie | Niskiego ryzyka przekształcenia tekstu w pipeline'ach | Dowolne narzędzie o szerszym zachowaniu lub skutkach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z konfiguracji (`tools.exec.safeBins` lub per agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z konfiguracji (`tools.exec.safeBinTrustedDirs` lub per agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z konfiguracji (`tools.exec.safeBinProfiles` lub per agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per agent nadpisują klucze globalne.
- wpisy allowlisty znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (lub przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega przez `tools.exec.safe_bins_interpreter_unprofiled`, gdy binaria interpretera/runtime pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może utworzyć brakujące wpisy `safeBinProfiles.<bin>` jako `{}` (po tym przejrzyj je i zaostrz). Binaria interpretera/runtime nie są tworzone automatycznie.

Przykład niestandardowego profilu:
__OC_I18N_900004__
Jeśli jawnie włączysz `jq` do `safeBins`, OpenClaw nadal odrzuca w trybie safe-bin builtin `env`,
tak aby `jq -n env` nie mogło zrzucić środowiska procesu hosta bez jawnej ścieżki na allowliście
lub promptu zatwierdzenia.

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować ustawienia domyślne, nadpisania per agent
i allowlisty. Wybierz zakres (Defaults lub agent), zmień politykę,
dodaj/usuń wzorce allowlisty, a następnie kliknij **Save**. UI pokazuje metadane **last used**
dla każdego wzorca, aby ułatwić utrzymanie porządku na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**. Węzły
muszą reklamować `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host węzła).
Jeśli węzeł nie reklamuje jeszcze zatwierdzeń exec, edytuj jego lokalny plik
`~/.openclaw/exec-approvals.json` bezpośrednio.

CLI: `openclaw approvals` obsługuje edycję gateway lub węzła (zobacz [CLI zatwierdzeń](/cli/approvals)).

## Przepływ zatwierdzania

Gdy prompt jest wymagany, gateway rozgłasza `exec.approval.requested` do klientów operatora.
Control UI i aplikacja macOS rozwiązują to przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta węzła.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny payload `systemRunPlan`. Gateway używa
tego planu jako autorytatywnego kontekstu polecenia/cwd/sesji przy przekazywaniu zatwierdzonych żądań `system.run`.

To ma znaczenie przy opóźnieniach asynchronicznego zatwierdzania:

- ścieżka node exec przygotowuje jeden kanoniczny plan z góry
- rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania
- po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu
  zamiast ufać późniejszym zmianom po stronie wywołującego
- jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuci
  przekazane uruchomienie jako niedopasowanie zatwierdzenia

## Polecenia interpretera/runtime

Uruchomienia interpretera/runtime oparte na zatwierdzeniach są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptów powłoki i bezpośrednich plików runtime są wiązane best-effort do jednej konkretnej migawki lokalnego
  pliku.
- Typowe formy wrapperów menedżerów pakietów, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed powiązaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime
  (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla runtime lub
  niejednoznaczne formy wieloplikowe), wykonanie oparte na zatwierdzeniu jest odrzucane zamiast twierdzić, że obejmuje semantykę,
  której faktycznie nie obejmuje.
- Dla takich przepływów pracy preferuj sandboxing, osobną granicę hosta albo jawny
  zaufany przepływ allowlist/full, w którym operator akceptuje szerszą semantykę runtime.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca od razu identyfikator zatwierdzenia. Użyj tego identyfikatora do
powiązania późniejszych zdarzeń systemowych (`Exec finished` / `Exec denied`). Jeśli żadna decyzja nie nadejdzie przed
upływem limitu czasu, żądanie jest traktowane jako timeout zatwierdzenia i pokazywane jako powód odmowy.

### Zachowanie dostarczania follow-up

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła follow-up `agent` do tej samej sesji.

- Jeśli istnieje prawidłowy zewnętrzny cel dostarczenia (kanał możliwy do dostarczenia plus cel `to`), follow-up jest dostarczany tym kanałem.
- W przepływach tylko-webchat lub sesji wewnętrznych bez zewnętrznego celu dostarczenie follow-up pozostaje tylko sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie żąda ścisłego zewnętrznego dostarczenia bez możliwego do rozwiązania kanału zewnętrznego, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli włączone jest `bestEffortDeliver` i nie można rozwiązać żadnego zewnętrznego kanału, dostarczenie jest obniżane do trybu tylko sesyjnego zamiast kończyć się błędem.

Okno potwierdzenia zawiera:

- polecenie + argumenty
- cwd
- id agenta
- rozwiązaną ścieżkę pliku wykonywalnego
- host + metadane polityki

Działania:

- **Allow once** → uruchom teraz
- **Always allow** → dodaj do allowlisty + uruchom
- **Deny** → blokuj

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać prompty zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów pluginów) i zatwierdzać
je przez `/approve`. Używa to zwykłego pipeline'u dostarczania wychodzącego.

Konfiguracja:
__OC_I18N_900005__
Odpowiedz na czacie:
__OC_I18N_900006__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów. Jeśli identyfikator nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia pluginów.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów używa tego samego pipeline'u dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację pod `approvals.plugin`. Włączenie lub wyłączenie jednej opcji nie wpływa na drugą.
__OC_I18N_900007__
Kształt konfiguracji jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone interaktywne odpowiedzi renderują te same przyciski zatwierdzania zarówno dla exec, jak i
zatwierdzeń pluginów. Kanały bez współdzielonego interaktywnego UI wracają do zwykłego tekstu z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec lub pluginu pochodzi z powierzchni czatu, do której można dostarczać wiadomości, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams oprócz istniejących przepływów Web UI i terminal UI.

Ta współdzielona ścieżka poleceń tekstowych używa zwykłego modelu uwierzytelniania kanału dla danej rozmowy. Jeśli
źródłowy czat może już wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, by pozostać oczekujące.

Discord i Telegram również obsługują `/approve` w tym samym czacie, ale te kanały nadal używają
rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń, którzy wywołują Gateway bezpośrednio,
ten fallback jest celowo ograniczony do błędów typu „nie znaleziono zatwierdzenia”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie jest po cichu ponawiana jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą działać także jako natywni klienci zatwierdzeń. Natywni klienci dodają DM do zatwierdzających, fanout do czatu źródłowego
i interaktywne UX zatwierdzeń specyficzne dla kanału ponad współdzielony przepływ `/approve`
w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzeń, to natywne UI jest główną
ścieżką widoczną dla agenta. Agent nie powinien dodatkowo wypisywać zduplikowanego zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne lub
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Model ogólny:

- polityka host exec nadal decyduje, czy zatwierdzenie exec jest wymagane
- `approvals.exec` kontroluje przekazywanie promptów zatwierdzeń do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy dany kanał działa jako natywny klient zatwierdzeń

Natywni klienci zatwierdzeń automatycznie włączają dostarczanie najpierw do DM, gdy spełnione są wszystkie poniższe warunki:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzających można rozwiązać z jawnego `execApprovals.approvers` albo z udokumentowanych źródeł fallback danego kanału
- `channels.<channel>.execApprovals.enabled` jest nieustawione lub ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy zatwierdzający mogą zostać rozwiązani. Publiczne dostarczanie do czatu źródłowego pozostaje
ustawiane jawnie przez `channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń czatowych?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ci natywni klienci zatwierdzeń dodają routing DM i opcjonalny fanout kanałowy ponad współdzielony
przepływ `/approve` w tym samym czacie i współdzielone przyciski zatwierdzeń.

Współdzielone zachowanie:

- Slack, Matrix, Microsoft Teams i podobne czaty, do których można dostarczać wiadomości, używają zwykłego modelu uwierzytelniania kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym natywnym celem dostarczania są DM do zatwierdzających
- dla Discord i Telegram tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać
- zatwierdzający Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z istniejącej konfiguracji właściciela (`allowFrom`, plus direct-message `defaultTo`, gdy jest obsługiwane)
- zatwierdzający Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginów
  bez drugiej warstwy fallback lokalnej dla Slack
- natywny routing DM/kanał w Matrix jest tylko dla exec; zatwierdzenia pluginów Matrix pozostają przy współdzielonym
  `/approve` w tym samym czacie i opcjonalnych ścieżkach przekazywania `approvals.plugin`
- zgłaszający nie musi być zatwierdzającym
- źródłowy czat może zatwierdzić bezpośrednio przez `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzeń Discord kierują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń pluginów, wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzeń Telegram stosują ten sam ograniczony fallback z exec do pluginu co `/approve`
- gdy natywne `target` włącza dostarczanie do czatu źródłowego, prompty zatwierdzeń zawierają tekst polecenia
- oczekujące zatwierdzenia exec wygasają domyślnie po 30 minutach
- jeśli żaden interfejs operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, prompt wraca do `askFallback`

Telegram domyślnie używa DM do zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` lub `both`, jeśli
chcesz, aby prompty zatwierdzeń pojawiały się także w źródłowym czacie/wątku Telegram. Dla tematów forum Telegram
OpenClaw zachowuje temat dla promptu zatwierdzenia i follow-up po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC w macOS
__OC_I18N_900008__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera z tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## Zdarzenia systemowe

Cykl życia exec jest pokazywany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o uruchomieniu)
- `Exec finished`
- `Exec denied`

Są one publikowane do sesji agenta po zgłoszeniu zdarzenia przez węzeł.
Zatwierdzenia exec hosta gateway emitują te same zdarzenia cyklu życia, gdy polecenie się zakończy (oraz opcjonalnie po dłuższym działaniu niż próg).
Exec z gatingiem zatwierdzeń ponownie używa identyfikatora zatwierdzenia jako `runId` w tych komunikatach, co ułatwia powiązanie.

## Zachowanie przy odrzuconym zatwierdzeniu

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi ponowne użycie
wyniku z dowolnego wcześniejszego uruchomienia tego samego polecenia w sesji. Powód odmowy
jest przekazywany razem z jawną informacją, że nie ma dostępnego wyniku polecenia, co powstrzymuje
agenta przed twierdzeniem, że istnieje nowy wynik, lub przed powtarzaniem odrzuconego polecenia ze
starymi rezultatami z wcześniejszego udanego uruchomienia.

## Skutki

- **full** jest potężne; tam, gdzie to możliwe, preferuj allowlisty.
- **ask** pozwala Ci zachować kontrolę przy jednoczesnym szybkim zatwierdzaniu.
- Allowlisty per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań host exec od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wywoływać `/exec`.
- `/exec security=full` jest wygodnym ustawieniem na poziomie sesji dla autoryzowanych operatorów i z założenia pomija zatwierdzenia.
  Aby twardo zablokować host exec, ustaw security zatwierdzeń na `deny` albo zablokuj narzędzie `exec` przez politykę narzędzi.

Powiązane:

- [Narzędzie exec](/tools/exec)
- [Tryb elevated](/tools/elevated)
- [Skills](/tools/skills)

## Powiązane

- [Exec](/tools/exec) — narzędzie do wykonywania poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — tryby sandboxa i dostęp do workspace
- [Security](/pl/gateway/security) — model bezpieczeństwa i hardening
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — kiedy używać którego
