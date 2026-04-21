---
read_when:
    - Konfigurowanie zatwierdzeń exec albo list dozwolonych
    - Implementowanie UX zatwierdzeń exec w aplikacji macOS
    - Przegląd promptów wyjścia z sandboxa i ich konsekwencji
summary: Zatwierdzenia exec, listy dozwolonych i prompty wyjścia z sandboxa
title: Zatwierdzenia exec
x-i18n:
    generated_at: "2026-04-21T10:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Zatwierdzenia exec

Zatwierdzenia exec to **zabezpieczenie aplikacji towarzyszącej / hosta node** pozwalające sandboxowanemu agentowi uruchamiać
polecenia na rzeczywistym hoście (`gateway` albo `node`). Myśl o tym jak o blokadzie bezpieczeństwa:
polecenia są dozwolone tylko wtedy, gdy polityka + allowlist + (opcjonalne) zatwierdzenie użytkownika się zgadzają.
Zatwierdzenia exec działają **dodatkowo** do polityki narzędzi i bramkowania elevated (chyba że elevated ma wartość `full`, co pomija zatwierdzenia).
Efektywna polityka to **bardziej restrykcyjna** z `tools.exec.*` i domyślnych ustawień zatwierdzeń; jeśli pole zatwierdzeń jest pominięte, używana jest wartość `tools.exec`.
Exec na hoście także używa lokalnego stanu zatwierdzeń na tej maszynie. Lokalne ustawienie hosta
`ask: "always"` w `~/.openclaw/exec-approvals.json` nadal wymusza prompt, nawet jeśli
domyślne ustawienia sesji albo config żądają `ask: "on-miss"`.
Użyj `openclaw approvals get`, `openclaw approvals get --gateway` albo
`openclaw approvals get --node <id|name|ip>`, aby sprawdzić żądaną politykę,
źródła polityki hosta i wynik efektywny.
Dla maszyny lokalnej `openclaw exec-policy show` pokazuje ten sam widok scalony, a
`openclaw exec-policy set|preset` może zsynchronizować lokalną żądaną politykę z
lokalnym plikiem zatwierdzeń hosta w jednym kroku. Gdy lokalny scope żąda `host=node`,
`openclaw exec-policy show` raportuje ten scope jako zarządzany przez node w runtime zamiast
udawać, że lokalny plik zatwierdzeń jest efektywnym źródłem prawdy.

Jeśli UI aplikacji towarzyszącej **nie jest dostępne**, każde żądanie wymagające promptu jest
rozwiązywane przez **ask fallback** (domyślnie: deny).

Natywne klienci zatwierdzeń w czacie mogą także udostępniać affordance specyficzne dla kanału na
wiadomości oczekującego zatwierdzenia. Na przykład Matrix może dodać skróty reakcji do
promptu zatwierdzenia (`✅` allow once, `❌` deny i `♾️` allow always, gdy dostępne),
jednocześnie pozostawiając polecenia `/approve ...` w wiadomości jako fallback.

## Gdzie to ma zastosowanie

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonania:

- **host gateway** → proces `openclaw` na maszynie gateway
- **host node** → runner node (aplikacja towarzysząca macOS albo headless host node)

Uwaga o modelu zaufania:

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane node’y rozszerzają tę możliwość zaufanego operatora na host node.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale nie są granicą auth per użytkownik.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env,
  gdy występuje, oraz przypiętą ścieżkę wykonywalną, gdy ma zastosowanie.
- Dla skryptów shell i bezpośrednich wywołań plików interpretera/runtime OpenClaw także próbuje powiązać
  jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem,
  uruchomienie zostaje odrzucone zamiast wykonywać zdryfowaną treść.
- To powiązanie pliku jest celowo best-effort, a nie pełnym semantycznym modelem każdej
  ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie potrafi zidentyfikować dokładnie
  jednego konkretnego lokalnego pliku do powiązania, odmawia wystawienia uruchomienia opartego na zatwierdzeniu zamiast udawać pełne pokrycie.

Podział macOS:

- **usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **aplikacja macOS** egzekwuje zatwierdzenia + wykonuje polecenie w kontekście UI.

## Ustawienia i storage

Zatwierdzenia są przechowywane w lokalnym pliku JSON na hoście wykonania:

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

## Tryb "YOLO" bez zatwierdzeń

Jeśli chcesz, aby exec na hoście działał bez promptów zatwierdzeń, musisz otworzyć **obie** warstwy polityki:

- żądaną politykę exec w config OpenClaw (`tools.exec.*`)
- lokalną politykę zatwierdzeń hosta w `~/.openclaw/exec-approvals.json`

To jest teraz domyślne zachowanie hosta, chyba że jawnie je zaostrzysz:

- `tools.exec.security`: `full` na `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Ważne rozróżnienie:

- `tools.exec.host=auto` wybiera miejsce uruchamiania exec: sandbox, jeśli jest dostępny, w przeciwnym razie gateway.
- YOLO wybiera sposób zatwierdzania exec na hoście: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw nie dodaje osobnej heurystycznej bramki zatwierdzeń dla maskowania poleceń ani warstwy odrzucania preflight skryptów ponad skonfigurowaną politykę exec hosta.
- `auto` nie czyni routowania do gateway darmowym nadpisaniem z sandboxowanej sesji. Żądanie per call `host=node` jest dozwolone z `auto`, a `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie ma aktywnego runtime sandbox. Jeśli chcesz stabilnej domyślnej wartości nie-auto, ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

Jeśli chcesz bardziej konserwatywną konfigurację, zaostrz ponownie dowolną warstwę do `allowlist` / `on-miss`
albo `deny`.

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

Lokalny skrót dla tej samej polityki hosta gateway na bieżącej maszynie:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje oba elementy:

- lokalne `tools.exec.host/security/ask`
- lokalne domyślne ustawienia `~/.openclaw/exec-approvals.json`

Jest celowo lokalny-only. Jeśli musisz zmienić zatwierdzenia hosta gateway albo hosta node
zdalnie, nadal używaj `openclaw approvals set --gateway` albo
`openclaw approvals set --node <id|name|ip>`.

Dla hosta node zastosuj ten sam plik zatwierdzeń na tym node zamiast tego:

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

Ważne ograniczenie tylko lokalne:

- `openclaw exec-policy` nie synchronizuje zatwierdzeń node
- `openclaw exec-policy set --host node` jest odrzucane
- zatwierdzenia exec node są pobierane z node w runtime, więc aktualizacje kierowane do node muszą używać `openclaw approvals --node ...`

Skrót tylko na sesję:

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót break-glass, który także pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż config, nadal wygrywa bardziej restrykcyjna polityka hosta.

## Pokrętła polityki

### Security (`exec.security`)

- **deny**: blokuje wszystkie żądania exec na hoście.
- **allowlist**: zezwala tylko na polecenia z allowlist.
- **full**: zezwala na wszystko (równoważne elevated).

### Ask (`exec.ask`)

- **off**: nigdy nie pokazuj promptu.
- **on-miss**: pytaj tylko wtedy, gdy allowlist nie pasuje.
- **always**: pytaj przy każdym poleceniu.
- trwałe zaufanie `allow-always` nie tłumi promptów, gdy efektywny tryb ask to `always`

### Ask fallback (`askFallback`)

Jeśli prompt jest wymagany, ale żadne UI nie jest osiągalne, fallback decyduje:

- **deny**: blokuj.
- **allowlist**: zezwól tylko, jeśli allowlist pasuje.
- **full**: zezwól.

### Utwardzanie inline eval interpretera (`tools.exec.strictInlineEval`)

Gdy `tools.exec.strictInlineEval=true`, OpenClaw traktuje formy inline code-eval jako wymagające zatwierdzenia, nawet jeśli sam binarny interpreter znajduje się na allowlist.

Przykłady:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

To defense-in-depth dla loaderów interpreterów, które nie mapują się czysto do jednego stabilnego operandu pliku. W trybie strict:

- te polecenia nadal wymagają jawnego zatwierdzenia;
- `allow-always` nie utrwala dla nich automatycznie nowych wpisów allowlist.

## Allowlist (per agent)

Allowlisty są **per agent**. Jeśli istnieje wielu agentów, przełącz, którego agenta
edytujesz w aplikacji macOS. Wzorce to **dopasowania glob bez rozróżniania wielkości liter**.
Wzorce powinny rozwiązywać się do **ścieżek binarnych** (wpisy tylko z basename są ignorowane).
Starsze wpisy `agents.default` są migrowane przy ładowaniu do `agents.main`.
Łańcuchy shell, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły allowlist.

Przykłady:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis allowlist śledzi:

- **id** stabilne UUID używane do tożsamości w UI (opcjonalne)
- **last used** znacznik czasu
- **last used command**
- **last resolved path**

## Auto-allow CLI Skills

Gdy **Auto-allow skill CLIs** jest włączone, pliki wykonywalne wskazane przez znane Skills
są traktowane jako wpisy allowlist na node’ach (macOS node albo headless host node). Używa to
`skills.bins` przez Gateway RPC do pobrania listy binarek Skills. Wyłącz to, jeśli chcesz ścisłych ręcznych allowlist.

Ważne uwagi dotyczące zaufania:

- To **niejawna wygodna allowlist**, oddzielna od ręcznych wpisów allowlist ścieżek.
- Jest przeznaczona do zaufanych środowisk operatora, gdzie Gateway i node są w tej samej granicy zaufania.
- Jeśli potrzebujesz ścisłego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj tylko ręcznych wpisów allowlist ścieżek.

## Safe bins (tylko stdin)

`tools.exec.safeBins` definiuje małą listę binarek **tylko stdin** (na przykład `cut`),
które mogą działać w trybie allowlist **bez** jawnych wpisów allowlist. Safe bins odrzucają
pozycyjne argumenty plików i tokeny podobne do ścieżek, więc mogą działać tylko na strumieniu wejściowym.
Traktuj to jako wąską szybką ścieżkę dla filtrów strumieniowych, a nie ogólną listę zaufania.
**Nie** dodawaj binarek interpreterów ani runtime (na przykład `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) do `safeBins`.
Jeśli polecenie z założenia potrafi wykonywać eval kodu, uruchamiać podpolecenia albo czytać pliki, preferuj jawne wpisy allowlist i pozostaw prompty zatwierdzeń włączone.
Niestandardowe safe bins muszą definiować jawny profil w `tools.exec.safeBinProfiles.<bin>`.
Walidacja jest deterministyczna wyłącznie na podstawie kształtu argv (bez sprawdzania istnienia w systemie plików hosta), co
zapobiega zachowaniu oracle istnienia pliku wynikającemu z różnic allow/deny.
Opcje zorientowane na pliki są odrzucane dla domyślnych safe bins (na przykład `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins także egzekwują jawne polityki flag per binarka dla opcji, które łamią zachowanie stdin-only
(na przykład `sort -o/--output/--compress-program` oraz flagi rekurencyjne grep).
Długie opcje są walidowane fail-closed w trybie safe-bin: nieznane flagi i niejednoznaczne
skróty są odrzucane.
Odrzucone flagi według profilu safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins wymuszają też, aby tokeny argv były traktowane podczas wykonania jako **tekst dosłowny** (bez globbingu
i bez rozwijania `$VARS`) dla segmentów tylko stdin, więc wzorce takie jak `*` albo `$HOME/...` nie mogą
być użyte do przemycania odczytów plików.
Safe bins muszą też rozwiązywać się z zaufanych katalogów binarnych (domyślne katalogi systemowe plus opcjonalne
`tools.exec.safeBinTrustedDirs`). Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane.
Domyślne zaufane katalogi safe-bin są celowo minimalne: `/bin`, `/usr/bin`.
Jeśli Twój plik wykonywalny safe-bin znajduje się w ścieżkach package managera/użytkownika (na przykład
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), dodaj je jawnie
do `tools.exec.safeBinTrustedDirs`.
Łańcuchy shell i przekierowania nie są automatycznie dozwalane w trybie allowlist.

Łańcuchy shell (`&&`, `||`, `;`) są dozwolone, gdy każdy segment najwyższego poziomu spełnia allowlist
(w tym safe bins albo auto-allow Skill). Przekierowania pozostają nieobsługiwane w trybie allowlist.
Podstawianie poleceń (`$()` / backticks) jest odrzucane podczas parsowania allowlist, także wewnątrz
podwójnych cudzysłowów; użyj pojedynczych cudzysłowów, jeśli potrzebujesz dosłownego tekstu `$()`.
W zatwierdzeniach aplikacji towarzyszącej macOS surowy tekst shell zawierający składnię kontroli albo rozwijania shella
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako brak dopasowania allowlist, chyba że
sama binarka shell znajduje się na allowlist.
Dla wrapperów shell (`bash|sh|zsh ... -c/-lc`) nadpisania env o zasięgu żądania są redukowane do
małej jawnej allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Dla decyzji allow-always w trybie allowlist znane wrappery dispatch
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają ścieżki wewnętrznych plików wykonywalnych zamiast ścieżek wrapperów. Multipleksery shell (`busybox`, `toybox`) także są rozwijane dla apletów shell (`sh`, `ash`,
itd.), tak aby utrwalane były wewnętrzne pliki wykonywalne zamiast binarek multipleksera. Jeśli wrapper albo
multiplekser nie może zostać bezpiecznie rozwinięty, żaden wpis allowlist nie jest automatycznie utrwalany.
Jeśli umieszczasz interpretery takie jak `python3` albo `node` na allowlist, preferuj `tools.exec.strictInlineEval=true`, aby inline eval nadal wymagał jawnego zatwierdzenia. W trybie strict `allow-always` nadal może utrwalać nieszkodliwe wywołania interpreter/skrypt, ale nośniki inline-eval nie są utrwalane automatycznie.

Domyślne safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` i `sort` nie znajdują się na liście domyślnej. Jeśli włączysz je jawnie, zachowaj jawne wpisy allowlist dla
ich przepływów nieopartych o stdin.
Dla `grep` w trybie safe-bin podaj wzorzec przez `-e`/`--regexp`; pozycyjna forma wzorca jest
odrzucana, aby operandy plików nie mogły być przemycane jako niejednoznaczne argumenty pozycyjne.

### Safe bins versus allowlist

| Temat            | `tools.exec.safeBins`                                | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Cel              | Automatyczne dopuszczanie wąskich filtrów stdin      | Jawne zaufanie określonym plikom wykonywalnym                |
| Typ dopasowania  | Nazwa pliku wykonywalnego + polityka argv safe-bin   | Wzorzec glob rozwiązanej ścieżki pliku wykonywalnego         |
| Zakres argumentów | Ograniczony profilem safe-bin i regułami literałów tokenów | Tylko dopasowanie ścieżki; za argumenty odpowiadasz już sam |
| Typowe przykłady | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, niestandardowe CLI        |
| Najlepsze użycie | Niskiego ryzyka transformacje tekstu w pipeline’ach  | Każde narzędzie o szerszym zachowaniu albo efektach ubocznych |

Lokalizacja konfiguracji:

- `safeBins` pochodzi z config (`tools.exec.safeBins` albo per agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` pochodzi z config (`tools.exec.safeBinTrustedDirs` albo per agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` pochodzi z config (`tools.exec.safeBinProfiles` albo per agent `agents.list[].tools.exec.safeBinProfiles`). Klucze profili per agent nadpisują klucze globalne.
- wpisy allowlist znajdują się w lokalnym dla hosta `~/.openclaw/exec-approvals.json` pod `agents.<id>.allowlist` (albo przez Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` ostrzega `tools.exec.safe_bins_interpreter_unprofiled`, gdy binarki interpreterów/runtime pojawiają się w `safeBins` bez jawnych profili.
- `openclaw doctor --fix` może przygotować brakujące wpisy niestandardowe `safeBinProfiles.<bin>` jako `{}` (potem je przejrzyj i zaostrz). Binarki interpreterów/runtime nie są przygotowywane automatycznie.

Przykład niestandardowego profilu:
__OC_I18N_900005__
Jeśli jawnie dodasz `jq` do `safeBins`, OpenClaw nadal odrzuca builtin `env` w trybie safe-bin,
więc `jq -n env` nie może zrzucić środowiska procesu hosta bez jawnej ścieżki allowlist
albo promptu zatwierdzenia.

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować ustawienia domyślne, nadpisania per agent
i allowlisty. Wybierz scope (Defaults albo agent), zmień politykę,
dodaj/usuń wzorce allowlist, a następnie kliknij **Save**. UI pokazuje metadane **last used**
dla każdego wzorca, dzięki czemu można utrzymać porządek na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**. Node’y
muszą reklamować `system.execApprovals.get/set` (aplikacja macOS albo headless host node).
Jeśli node nie reklamuje jeszcze zatwierdzeń exec, edytuj jego lokalny
`~/.openclaw/exec-approvals.json` bezpośrednio.

CLI: `openclaw approvals` obsługuje edycję gateway albo node (zobacz [CLI zatwierdzeń](/cli/approvals)).

## Przepływ zatwierdzania

Gdy prompt jest wymagany, gateway rozgłasza `exec.approval.requested` do klientów operatora.
Control UI i aplikacja macOS rozwiązują go przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny payload `systemRunPlan`. Gateway używa
tego planu jako autorytatywnego kontekstu polecenia/cwd/sesji przy przekazywaniu zatwierdzonych żądań `system.run`.

To ma znaczenie przy opóźnieniu asynchronicznego zatwierdzenia:

- ścieżka exec node przygotowuje z góry jeden kanoniczny plan
- rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania
- po zatwierdzeniu końcowe przekazane wywołanie `system.run` używa ponownie przechowanego planu
  zamiast ufać późniejszym zmianom wywołującego
- jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` albo
  `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuca
  przekazane uruchomienie jako niedopasowanie zatwierdzenia

## Polecenia interpretera/runtime

Uruchomienia interpretera/runtime oparte na zatwierdzeniach są celowo konserwatywne:

- Dokładny kontekst argv/cwd/env jest zawsze wiązany.
- Bezpośrednie formy skryptów shell i bezpośrednich plików runtime są best-effort wiązane z jedną konkretną lokalną migawką pliku.
- Typowe formy wrapperów package managera, które nadal rozwiązują się do jednego bezpośredniego lokalnego pliku (na przykład
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), są rozwijane przed powiązaniem.
- Jeśli OpenClaw nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/runtime
  (na przykład skrypty pakietów, formy eval, łańcuchy loaderów specyficzne dla runtime albo niejednoznaczne formy
  wieloplikowe), wykonanie oparte na zatwierdzeniu jest odrzucane zamiast twierdzić, że pokrywa semantykę, której
  faktycznie nie ma.
- Dla takich przepływów preferuj sandboxing, oddzielną granicę hosta albo jawny zaufany
  przepływ allowlist/full, w którym operator akceptuje szerszą semantykę runtime.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca natychmiast identyfikator zatwierdzenia. Użyj tego identyfikatora, aby
skorelować późniejsze zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli żadna decyzja nie nadejdzie przed
timeoutem, żądanie jest traktowane jako timeout zatwierdzenia i pokazywane jako powód odmowy.

### Zachowanie dostarczania follow-up

Po zakończeniu zatwierdzonego asynchronicznego exec OpenClaw wysyła follow-up typu `agent` do tej samej sesji.

- Jeśli istnieje poprawny zewnętrzny cel dostarczania (dostarczalny kanał plus cel `to`), dostarczanie follow-up używa tego kanału.
- W przepływach tylko webchat albo sesji wewnętrznych bez celu zewnętrznego dostarczanie follow-up pozostaje tylko sesyjne (`deliver: false`).
- Jeśli wywołujący jawnie żąda ścisłego zewnętrznego dostarczenia bez rozwiązywalnego zewnętrznego kanału, żądanie kończy się błędem `INVALID_REQUEST`.
- Jeśli włączone jest `bestEffortDeliver` i nie można rozwiązać żadnego zewnętrznego kanału, dostarczanie jest degradowane do tylko sesyjnego zamiast kończyć się błędem.

Okno potwierdzenia zawiera:

- polecenie + argumenty
- cwd
- identyfikator agenta
- rozwiązaną ścieżkę pliku wykonywalnego
- metadane hosta + polityki

Akcje:

- **Allow once** → uruchom teraz
- **Always allow** → dodaj do allowlist + uruchom
- **Deny** → zablokuj

## Przekazywanie zatwierdzeń do kanałów czatu

Możesz przekazywać prompty zatwierdzeń exec do dowolnego kanału czatu (w tym kanałów pluginów) i zatwierdzać
je przez `/approve`. Używa to normalnego pipeline dostarczania outbound.

Config:
__OC_I18N_900006__
Odpowiedź w czacie:
__OC_I18N_900007__
Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów. Jeśli ID nie pasuje do oczekującego zatwierdzenia exec, automatycznie sprawdza zamiast tego zatwierdzenia pluginów.

### Przekazywanie zatwierdzeń pluginów

Przekazywanie zatwierdzeń pluginów używa tego samego pipeline dostarczania co zatwierdzenia exec, ale ma własną
niezależną konfigurację pod `approvals.plugin`. Włączenie albo wyłączenie jednego nie wpływa na drugie.
__OC_I18N_900008__
Kształt config jest identyczny jak `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` i `targets` działają tak samo.

Kanały obsługujące współdzielone odpowiedzi interaktywne renderują te same przyciski zatwierdzeń dla zatwierdzeń exec i
pluginów. Kanały bez współdzielonego interaktywnego UI przechodzą zapasowo do zwykłego tekstu z instrukcjami `/approve`.

### Zatwierdzenia w tym samym czacie na dowolnym kanale

Gdy żądanie zatwierdzenia exec albo pluginu pochodzi z dostarczalnej powierzchni czatu, ten sam czat
może teraz domyślnie zatwierdzić je przez `/approve`. Dotyczy to kanałów takich jak Slack, Matrix i
Microsoft Teams, oprócz istniejących już przepływów Web UI i terminal UI.

Ta współdzielona ścieżka poleceń tekstowych używa normalnego modelu auth kanału dla tej rozmowy. Jeśli
czat źródłowy już potrafi wysyłać polecenia i odbierać odpowiedzi, żądania zatwierdzeń nie potrzebują już
osobnego natywnego adaptera dostarczania tylko po to, aby pozostać oczekujące.

Discord i Telegram także obsługują `/approve` w tym samym czacie, ale te kanały nadal używają
swojej rozwiązanej listy zatwierdzających do autoryzacji, nawet gdy natywne dostarczanie zatwierdzeń jest wyłączone.

Dla Telegram i innych natywnych klientów zatwierdzeń, które wywołują Gateway bezpośrednio,
ten fallback jest celowo ograniczony do błędów typu „approval not found”. Rzeczywista
odmowa/błąd zatwierdzenia exec nie jest po cichu ponawiana jako zatwierdzenie pluginu.

### Natywne dostarczanie zatwierdzeń

Niektóre kanały mogą także działać jako natywne klienci zatwierdzeń. Natywne klienty dodają DM zatwierdzających, fanout czatu źródłowego
i interaktywny UX zatwierdzeń specyficzny dla kanału ponad współdzielony przepływ `/approve`
w tym samym czacie.

Gdy dostępne są natywne karty/przyciski zatwierdzeń, to natywne UI jest podstawową
ścieżką widoczną dla agenta. Agent nie powinien dodatkowo wysyłać zduplikowanego zwykłego polecenia czatu
`/approve`, chyba że wynik narzędzia mówi, że zatwierdzenia w czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną pozostałą ścieżką.

Model ogólny:

- polityka exec hosta nadal decyduje, czy zatwierdzenie exec jest wymagane
- `approvals.exec` kontroluje przekazywanie promptów zatwierdzeń do innych miejsc docelowych czatu
- `channels.<channel>.execApprovals` kontroluje, czy dany kanał działa jako natywny klient zatwierdzeń

Natywne klienci zatwierdzeń automatycznie włączają dostarczanie DM-first, gdy wszystkie te warunki są spełnione:

- kanał obsługuje natywne dostarczanie zatwierdzeń
- zatwierdzający mogą zostać rozwiązani z jawnego `execApprovals.approvers` albo z
  udokumentowanych źródeł zapasowych danego kanału
- `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`

Ustaw `enabled: false`, aby jawnie wyłączyć natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby wymusić
jego włączenie, gdy zatwierdzający się rozwiązują. Publiczne dostarczanie do czatu źródłowego pozostaje jawne przez
`channels.<channel>.execApprovals.target`.

FAQ: [Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń w czacie?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Te natywne klienci zatwierdzeń dodają routowanie DM i opcjonalny fanout kanału ponad współdzielony
przepływ `/approve` w tym samym czacie i współdzielone przyciski zatwierdzeń.

Współdzielone zachowanie:

- Slack, Matrix, Microsoft Teams i podobne dostarczalne czaty używają normalnego modelu auth kanału
  dla `/approve` w tym samym czacie
- gdy natywny klient zatwierdzeń włącza się automatycznie, domyślnym natywnym celem dostarczenia są DM zatwierdzających
- dla Discord i Telegram tylko rozwiązani zatwierdzający mogą zatwierdzać albo odrzucać
- zatwierdzający Discord mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- zatwierdzający Telegram mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z istniejącej konfiguracji właściciela (`allowFrom`, plus `defaultTo` wiadomości bezpośrednich tam, gdzie jest obsługiwane)
- zatwierdzający Slack mogą być jawni (`execApprovals.approvers`) albo wywnioskowani z `commands.ownerAllowFrom`
- natywne przyciski Slack zachowują rodzaj identyfikatora zatwierdzenia, więc identyfikatory `plugin:` mogą rozwiązywać zatwierdzenia pluginów
  bez drugiej lokalnej warstwy fallback Slack
- natywne routowanie DM/kanału Matrix i skróty reakcji obsługują zarówno zatwierdzenia exec, jak i pluginów;
  autoryzacja pluginów nadal pochodzi z `channels.matrix.dm.allowFrom`
- żądający nie musi być zatwierdzającym
- czat źródłowy może zatwierdzić bezpośrednio przez `/approve`, gdy ten czat już obsługuje polecenia i odpowiedzi
- natywne przyciski zatwierdzeń Discord routują według rodzaju identyfikatora zatwierdzenia: identyfikatory `plugin:` trafiają
  bezpośrednio do zatwierdzeń pluginów, wszystko inne trafia do zatwierdzeń exec
- natywne przyciski zatwierdzeń Telegram stosują ten sam ograniczony fallback exec-do-plugin co `/approve`
- gdy natywne `target` włącza dostarczanie do czatu źródłowego, prompty zatwierdzeń zawierają tekst polecenia
- oczekujące zatwierdzenia exec domyślnie wygasają po 30 minutach
- jeśli żadne UI operatora ani skonfigurowany klient zatwierdzeń nie może przyjąć żądania, prompt przechodzi zapasowo do `askFallback`

Telegram domyślnie używa DM zatwierdzających (`target: "dm"`). Możesz przełączyć na `channel` albo `both`, gdy
chcesz, aby prompty zatwierdzeń pojawiały się także w źródłowym czacie/temacie Telegram. Dla tematów forum Telegram
OpenClaw zachowuje temat zarówno dla promptu zatwierdzenia, jak i dla dalszych działań po zatwierdzeniu.

Zobacz:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Przepływ IPC macOS
__OC_I18N_900009__
Uwagi dotyczące bezpieczeństwa:

- Tryb gniazda Unix `0600`, token przechowywany w `exec-approvals.json`.
- Sprawdzenie peera o tym samym UID.
- Challenge/response (nonce + token HMAC + hash żądania) + krótki TTL.

## Zdarzenia systemowe

Lifecycle exec jest ujawniany jako wiadomości systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o uruchomieniu)
- `Exec finished`
- `Exec denied`

Są one publikowane do sesji agenta po zgłoszeniu zdarzenia przez node.
Zatwierdzenia exec na hoście gateway emitują te same zdarzenia lifecycle, gdy polecenie się kończy (i opcjonalnie także, gdy działa dłużej niż próg).
Exec objęte zatwierdzeniem używają ponownie identyfikatora zatwierdzenia jako `runId` w tych wiadomościach dla łatwej korelacji.

## Zachowanie przy odrzuconym zatwierdzeniu

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi ponowne użycie
wyjścia z wcześniejszego uruchomienia tego samego polecenia w sesji. Powód odmowy
jest przekazywany z jawną informacją, że żadne wyjście polecenia nie jest dostępne, co zatrzymuje
agenta przed twierdzeniem, że istnieje nowe wyjście albo przed powtarzaniem odrzuconego polecenia z
przestarzałymi wynikami z wcześniejszego udanego uruchomienia.

## Konsekwencje

- **full** jest potężne; gdy to możliwe, preferuj allowlisty.
- **ask** utrzymuje Cię w pętli, jednocześnie umożliwiając szybkie zatwierdzenia.
- Allowlisty per agent zapobiegają wyciekaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia mają zastosowanie tylko do żądań exec na hoście od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygodne ustawienie na poziomie sesji dla autoryzowanych operatorów i z założenia pomija zatwierdzenia.
  Aby twardo zablokować exec na hoście, ustaw security zatwierdzeń na `deny` albo zablokuj narzędzie `exec` przez politykę narzędzi.

Powiązane:

- [Narzędzie Exec](/pl/tools/exec)
- [Tryb Elevated](/pl/tools/elevated)
- [Skills](/pl/tools/skills)

## Powiązane

- [Exec](/pl/tools/exec) — narzędzie wykonywania poleceń shell
- [Sandboxing](/pl/gateway/sandboxing) — tryby sandboxa i dostęp do workspace
- [Bezpieczeństwo](/pl/gateway/security) — model bezpieczeństwa i utwardzanie
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — kiedy używać którego
