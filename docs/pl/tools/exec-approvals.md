---
read_when:
    - Konfigurowanie zatwierdzeń wykonywania lub list dozwolonych elementów
    - Implementacja interfejsu zatwierdzania wykonywania poleceń w aplikacji macOS
    - Analiza promptów dotyczących ucieczki z piaskownicy i ich konsekwencji
sidebarTitle: Exec approvals
summary: 'Zatwierdzanie wykonywania poleceń na hoście: ustawienia zasad, listy dozwolonych elementów oraz przepływ pracy YOLO/ścisły'
title: Zatwierdzanie wykonywania poleceń
x-i18n:
    generated_at: "2026-07-12T15:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzanie wykonywania poleceń stanowi **mechanizm ochronny aplikacji towarzyszącej / hosta węzła**, umożliwiający agentowi działającemu w piaskownicy uruchamianie poleceń na rzeczywistym hoście (`gateway` lub `node`). Polecenia są uruchamiane tylko wtedy, gdy zasady, lista dozwolonych poleceń oraz (opcjonalnie) zgoda użytkownika są zgodne.
Zatwierdzanie działa **oprócz** zasad narzędzi i bramkowania podwyższonych uprawnień (tryb podwyższonych uprawnień `full` je pomija).

Omówienie trybów `deny`, `allowlist`, `ask`, `auto`, `full`, mapowania Codex Guardian oraz uprawnień środowiska ACPX znajduje się w sekcji
[Tryby uprawnień](/pl/tools/permission-modes).

<Note>
Obowiązująca zasada jest **bardziej restrykcyjną** z wartości `tools.exec.*` i domyślnych ustawień zatwierdzania: zatwierdzanie może jedynie zaostrzyć zabezpieczenia lub wymaganie potwierdzenia wynikające z konfiguracji, nigdy ich złagodzić. Jeśli pole zatwierdzania zostanie pominięte, używana jest wartość `tools.exec`. Wykonywanie poleceń na hoście korzysta również z lokalnego stanu zatwierdzania na tej maszynie — lokalne dla hosta ustawienie `ask: "always"` w pliku zatwierdzania hosta wykonawczego nadal powoduje wyświetlanie monitów, nawet jeśli domyślne ustawienia sesji lub konfiguracji wskazują `ask: "on-miss"`.
</Note>

## Zakres zastosowania

Zatwierdzanie wykonywania poleceń jest wymuszane lokalnie na hoście wykonawczym:

- **Host Gateway** -> proces `openclaw` na maszynie Gateway.
- **Host węzła** -> moduł uruchamiający węzła (aplikacja towarzysząca na macOS lub bezobsługowy host węzła).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane węzły rozszerzają możliwości zaufanego operatora na host węzła.
- Zatwierdzanie zmniejsza ryzyko przypadkowego wykonania, ale **nie** stanowi granicy uwierzytelniania poszczególnych użytkowników ani zasady dostępu tylko do odczytu w systemie plików.
- Po zatwierdzeniu polecenie może modyfikować pliki zgodnie z uprawnieniami systemu plików wybranego hosta lub piaskownicy.
- Zatwierdzone uruchomienia na hoście węzła są powiązane z kanonicznym kontekstem wykonania: katalogiem roboczym, dokładną tablicą argv, powiązaniem ze środowiskiem, jeśli występuje, oraz przypiętą ścieżką do pliku wykonywalnego, gdy ma to zastosowanie.
- W przypadku skryptów powłoki i bezpośrednich wywołań plików przez interpreter lub środowisko uruchomieniowe OpenClaw próbuje również powiązać jeden konkretny lokalny operand plikowy. Jeśli plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonania zmienionej zawartości.
- Powiązanie pliku jest realizowane na zasadzie najlepszej możliwej dokładności i nie stanowi kompletnego modelu wszystkich ścieżek ładowania interpreterów lub środowisk uruchomieniowych. Jeśli nie można zidentyfikować dokładnie jednego konkretnego pliku lokalnego, OpenClaw odmawia utworzenia uruchomienia opartego na zatwierdzeniu, zamiast pozorować pełne pokrycie.

### Podział na macOS

- **Usługa hosta węzła** przekazuje `system.run` do **aplikacji macOS** przez lokalny IPC.
- **Aplikacja macOS** wymusza zatwierdzanie i wykonuje polecenie w kontekście interfejsu użytkownika.

## Sprawdzanie obowiązujących zasad

| Polecenie                                                        | Co pokazuje                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądaną zasadę, źródła zasad hosta oraz obowiązujący wynik.                              |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                         |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalną żądaną zasadę z lokalnym plikiem zatwierdzania hosta w jednym kroku. |

<Note>
Nadpisania `/exec` dla poszczególnych sesji nie są uwzględniane. Uruchom `/exec` w odpowiedniej sesji, aby sprawdzić jej bieżące ustawienia domyślne. Zobacz [nadpisania sesji](/pl/tools/exec#session-overrides-exec).
</Note>

Pełna dokumentacja CLI (flagi, dane wyjściowe JSON, dodawanie i usuwanie wpisów listy dozwolonych poleceń): [CLI zatwierdzania](/pl/cli/approvals).

Gdy zakres lokalny żąda `host=node`, polecenie `exec-policy show` zgłasza ten zakres jako zarządzany w czasie działania przez węzeł, zamiast traktować lokalny plik zatwierdzania jako źródło prawdy.

Jeśli interfejs aplikacji towarzyszącej **nie jest dostępny**, każde żądanie, które normalnie wyświetliłoby monit, jest rozstrzygane zgodnie z **zachowaniem zastępczym dla zapytania** (domyślnie: `deny`).

<Tip>
Natywne klienty zatwierdzania na czacie mogą dodawać funkcje właściwe dla danego kanału do wiadomości o oczekującym zatwierdzeniu. Matrix dodaje skróty reakcji (`✅` zezwól jednorazowo, `♾️` zezwalaj zawsze, `❌` odmów), pozostawiając jednocześnie `/approve ...` w wiadomości jako rozwiązanie zastępcze.
</Tip>

## Ustawienia i przechowywanie

Zatwierdzenia są przechowywane w lokalnym pliku JSON na hoście wykonawczym. Gdy ustawiono `OPENCLAW_STATE_DIR`, plik znajduje się w tym katalogu stanu; w przeciwnym razie używany jest domyślny katalog stanu OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# w przeciwnym razie
~/.openclaw/exec-approvals.json
```

Domyślne gniazdo zatwierdzania znajduje się w tym samym katalogu głównym:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` lub
`~/.openclaw/exec-approvals.sock`, gdy zmienna nie jest ustawiona.

Wydania wcześniejsze niż 2026.6.6 zawsze przechowywały ten plik w `~/.openclaw`. Jeśli
`OPENCLAW_STATE_DIR` wskazuje inne miejsce, a plik zatwierdzania nadal istnieje
w katalogu domyślnym, uruchom raz bezpośrednio `openclaw doctor --fix`, aby
zaimportować go do katalogu stanu (oryginał zostanie zarchiwizowany z sufiksem
`.migrated`). Interaktywny tryb diagnostyczny może również wyświetlić podgląd
importu i poprosić o jego potwierdzenie. Automatyczne aktualizacje i naprawy
uruchamiane przez obserwatora Gateway nigdy nie importują danych między
katalogami stanu: tymczasowy lub przejściowy katalog stanu nie może przejąć
zatwierdzeń domyślnej instalacji. Ta sama granica dotyczy importowania starszych
plików `plugin-binding-approvals.json` do współdzielonego stanu SQLite.

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
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Parametry zasad

### `tools.exec.mode`

`tools.exec.mode` jest preferowaną, znormalizowaną powierzchnią zasad wykonywania poleceń na hoście:

| Wartość     | Zachowanie                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Blokuje wykonywanie poleceń na hoście.                                                                                                                                          |
| `allowlist` | Uruchamia bez pytania tylko polecenia znajdujące się na liście dozwolonych.                                                                                                      |
| `ask`       | Stosuje zasadę listy dozwolonych poleceń i pyta w przypadku braku dopasowania.                                                                                                   |
| `auto`      | Stosuje zasadę listy dozwolonych poleceń, bezpośrednio uruchamia deterministyczne dopasowania, a brakujące zatwierdzenia przekazuje natywnemu automatycznemu recenzentowi OpenClaw, zanim skorzysta z zastępczej ścieżki zatwierdzania przez człowieka. |
| `full`      | Uruchamia polecenia na hoście bez monitów o zatwierdzenie.                                                                                                                       |

Starsze ustawienia `tools.exec.security` / `tools.exec.ask` pozostają obsługiwane i nadal
obowiązują wszędzie tam, gdzie `mode` nie jest ustawiony w danym zakresie.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — blokuje wszystkie żądania wykonania poleceń na hoście.
  - `allowlist` — zezwala tylko na polecenia znajdujące się na liście dozwolonych.
  - `full` — zezwala na wszystko (odpowiednik podwyższonych uprawnień).

Wartość domyślna dla hostów Gateway/węzła to `full`; host `sandbox` ma zamiast tego
domyślną wartość `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Skonfigurowana zasada pytania dla wykonywania poleceń na hoście. Steruje bazowym zachowaniem
  monitów o zatwierdzenie wynikającym z `tools.exec.ask` i domyślnych ustawień zatwierdzania hosta.
  Wartość domyślna to `off`. Parametr narzędzia `ask` dla pojedynczego wywołania (zobacz
  [Narzędzie Exec](/pl/tools/exec#parameters)) może jedynie zaostrzyć tę wartość bazową, a
  wywołania modelu pochodzące z kanału ignorują go, gdy obowiązujące ustawienie pytania hosta ma wartość `off`.

- `off` — nigdy nie wyświetla monitu.
- `on-miss` — wyświetla monit tylko wtedy, gdy lista dozwolonych poleceń nie zawiera dopasowania.
- `always` — wyświetla monit przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** wyłącza monitów, gdy obowiązujący tryb pytania ma wartość `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Sposób rozstrzygnięcia, gdy monit jest wymagany, ale żaden interfejs użytkownika nie jest dostępny (lub
  upłynie limit czasu monitu). W przypadku pominięcia wartością domyślną jest `deny`.

- `deny` — blokuje.
- `allowlist` — zezwala tylko w przypadku dopasowania do listy dozwolonych poleceń.
- `full` — zezwala.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy ma wartość `true`, traktuje formy bezpośredniego wykonywania kodu jako wymagające zatwierdzenia, nawet jeśli
  sam plik binarny interpretera znajduje się na liście dozwolonych. Stanowi dodatkową warstwę ochrony dla
  mechanizmów ładowania interpreterów, których nie można jednoznacznie powiązać z jednym stabilnym operandem plikowym.
</ParamField>

Przykłady wykrywane przez tryb ścisły: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (a także bezpośrednie formy `awk`,
`sed`, `make`, `find -exec` i `xargs`).

W trybie ścisłym te polecenia wymagają zatwierdzenia przez recenzenta lub jawnego zatwierdzenia. Przy
`tools.exec.mode: "auto"` recenzent może zezwolić na jedno wykonanie o niskim ryzyku, jeśli
polecenie ma możliwy do wyegzekwowania plan; w przeciwnym razie OpenClaw pyta człowieka.
Zatwierdzenia poleceń `Codex app-server`, które trafiają do recenzenta zastępczego, wymagają decyzji
człowieka, ponieważ ich żądania zatwierdzenia nie udostępniają możliwego do wyegzekwowania, rozpoznanego
pliku wykonywalnego.
`allow-always` nie utrwala nowych wpisów na liście dozwolonych dla poleceń wykonujących kod bezpośrednio.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Dotyczy wyłącznie prezentacji: po włączeniu OpenClaw może dołączać zakresy poleceń
  ustalone przez parser, aby internetowe monity o zatwierdzenie mogły wyróżniać tokeny polecenia. **Nie**
  zmienia ustawień `security`, `ask`, dopasowywania do listy dozwolonych, ścisłego zachowania
  bezpośredniego wykonywania kodu, przekazywania zatwierdzeń ani wykonywania poleceń.
</ParamField>

Ustaw globalnie w `tools.exec.commandHighlighting` lub dla poszczególnych agentów w
`agents.list[].tools.exec.commandHighlighting`.

## Tryb YOLO (bez zatwierdzania)

Aby uruchamiać polecenia na hoście bez monitów o zatwierdzenie, otwórz **obie** warstwy zasad:
żądaną zasadę wykonywania w konfiguracji OpenClaw (`tools.exec.*`) **oraz**
lokalną dla hosta zasadę zatwierdzania w pliku zatwierdzania hosta wykonawczego.

Pominięte `askFallback` ma domyślną wartość `deny`. Ustaw jawnie wartość `full` dla
hostowego `askFallback`, gdy monit o zatwierdzenie bez dostępnego interfejsu ma domyślnie zezwalać.

| Warstwa               | Ustawienie YOLO             |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node`  |
| `tools.exec.ask`      | `off`                       |
| Hostowe `askFallback` | `full`                      |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` określa, **gdzie** wykonywane są polecenia: w piaskownicy, jeśli jest dostępna, a w przeciwnym razie na Gateway.
- YOLO określa, **jak** zatwierdzane jest wykonywanie poleceń na hoście: `security=full` oraz `ask=off`.
- YOLO **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemnionych poleceń ani warstwy odrzucania skryptów przed uruchomieniem ponad skonfigurowaną zasadę wykonywania poleceń na hoście.
- `auto` nie umożliwia swobodnego wymuszania routingu do Gateway z sesji działającej w piaskownicy. Żądanie `host=node` dla pojedynczego wywołania jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy żadne środowisko uruchomieniowe piaskownicy nie jest aktywne. Aby uzyskać stabilne ustawienie domyślne inne niż automatyczne, ustaw `tools.exec.host` lub jawnie użyj `/exec host=...`.

</Warning>

Dostawcy oparci na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień, mogą stosować tę zasadę. Claude CLI dodaje
`--permission-mode bypassPermissions`, gdy efektywna polityka wykonywania poleceń OpenClaw to YOLO. W zarządzanych przez OpenClaw sesjach Claude na żywo efektywna polityka wykonywania poleceń OpenClaw ma pierwszeństwo przed natywnym trybem uprawnień Claude:
YOLO normalizuje uruchomienia na żywo do `--permission-mode bypassPermissions`, a
restrykcyjna efektywna polityka wykonywania poleceń normalizuje uruchomienia na żywo do
`--permission-mode default`, nawet jeśli nieprzetworzone argumenty backendu Claude określają inny
tryb.

Jeśli chcesz zastosować bardziej zachowawczą konfigurację, zaostrz politykę wykonywania poleceń OpenClaw z powrotem do
`allowlist` / `on-miss` lub `deny`.

### Trwała konfiguracja „nigdy nie pytaj” na hoście Gateway

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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
  </Step>
</Steps>

### Skrót lokalny

```bash
openclaw exec-policy preset yolo
```

Aktualizuje zarówno lokalne ustawienia `tools.exec.host/security/ask`, jak i wartości domyślne lokalnego
pliku zatwierdzeń (w tym `askFallback: "full"`). Celowo działa
wyłącznie lokalnie. Aby zdalnie zmienić zatwierdzenia hosta Gateway lub hosta Node, użyj
`openclaw approvals set --gateway` albo `openclaw approvals set --node
<id|name|ip>`.

Inne wbudowane ustawienia wstępne: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) oraz `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Zastosuj je w ten sam sposób:
`openclaw exec-policy preset cautious`.

Aby ustawić poszczególne pola zamiast pełnego ustawienia wstępnego, użyj
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` z dowolnym podzbiorem tych flag.

### Host Node

Zamiast tego zastosuj ten sam plik zatwierdzeń na Node:

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

<Note>
**Ograniczenia dotyczące działania wyłącznie lokalnego:**

- `openclaw exec-policy` nie synchronizuje zatwierdzeń Node.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia wykonywania poleceń Node są pobierane z Node w czasie działania, dlatego aktualizacje skierowane do Node muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót dotyczący tylko sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót, który pomija zatwierdzenia wykonywania poleceń tylko
  wtedy, gdy zarówno żądana polityka, jak i plik zatwierdzeń hosta dają w wyniku
  `security: "full"` oraz `ask: "off"`. Bardziej restrykcyjny plik hosta, na przykład `ask:
"always"`, nadal powoduje wyświetlenie monitu.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż konfiguracja, nadal obowiązuje
bardziej restrykcyjna polityka hosta.

## Lista dozwolonych (dla każdego agenta)

Listy dozwolonych są definiowane **dla każdego agenta**. Jeśli istnieje wielu agentów, w aplikacji macOS przełącz agenta,
którego ustawienia edytujesz. Wzorce są dopasowywane jako globy.

Wzorcami mogą być globy rozwiązanych ścieżek plików binarnych albo globy samych nazw poleceń.
Same nazwy pasują wyłącznie do poleceń wywoływanych przez `PATH`, dlatego `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale **nie** do `./rg` ani
`/tmp/rg`. Użyj globu ścieżki, aby zaufać jednej konkretnej lokalizacji pliku binarnego.

Starsze wpisy `agents.default` są podczas wczytywania migrowane do `agents.main`.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu
spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Ograniczanie argumentów za pomocą argPattern

Dodaj `argPattern`, gdy wpis listy dozwolonych powinien pasować do pliku binarnego oraz
określonego układu argumentów. OpenClaw na każdym hoście używa semantyki wyrażeń
regularnych ECMAScript (JavaScript) i sprawdza wyrażenie względem
przetworzonych argumentów polecenia z wyłączeniem tokenu pliku wykonywalnego (`argv[0]`).
W przypadku wpisów tworzonych ręcznie argumenty są łączone pojedynczą spacją, dlatego
użyj kotwic we wzorcu, jeśli potrzebujesz dokładnego dopasowania.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Ten wpis zezwala na `python3 safe.py`; `python3 other.py` nie pasuje do listy
dozwolonych. Jeśli istnieje również wpis tylko ze ścieżką dla tego samego pliku binarnego, niedopasowane
argumenty nadal mogą zostać obsłużone przez ten wpis. Pomiń wpis
tylko ze ścieżką, jeśli celem jest ograniczenie pliku binarnego do zadeklarowanych argumentów.

Wpisy zapisane przez przepływy zatwierdzania używają wewnętrznego formatu separatora do dokładnego
dopasowywania argv. Zamiast ręcznie edytować zakodowaną wartość, użyj interfejsu użytkownika lub przepływu zatwierdzania,
aby ponownie wygenerować te wpisy. Jeśli OpenClaw nie może przetworzyć argv
dla segmentu polecenia, wpisy z `argPattern` nie pasują.

Każdy wpis listy dozwolonych obsługuje:

| Pole               | Znaczenie                                                    |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob rozwiązanej ścieżki pliku binarnego lub samej nazwy polecenia |
| `argPattern`       | Opcjonalne wyrażenie regularne argv ECMAScript; pominięcie oznacza wpis tylko ze ścieżką |
| `id`               | Stabilny nieprzezroczysty identyfikator; w razie braku generowany jako UUID |
| `source`           | Źródło wpisu, na przykład `allow-always`                     |
| `commandText`      | Starsze dane wejściowe w postaci zwykłego tekstu; odrzucane podczas wczytywania |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia                             |
| `lastUsedCommand`  | Ostatnie dopasowane polecenie                                |
| `lastResolvedPath` | Ostatnia rozwiązana ścieżka pliku binarnego                  |

## Automatyczne zezwalanie na CLI Skills

Gdy opcja **Automatycznie zezwalaj na CLI Skills** (`autoAllowSkills`) jest włączona, pliki wykonywalne,
do których odwołują się znane Skills, są traktowane jako dozwolone na Node (Node macOS
lub bezinterfejsowy host Node). Mechanizm używa `skills.bins` przez RPC Gateway, aby
pobrać listę plików binarnych Skills. Wyłącz tę opcję, jeśli chcesz stosować ściśle ręczne
listy dozwolonych.

<Warning>
- Jest to **niejawna lista dozwolonych dla wygody**, odrębna od ręcznych wpisów ścieżek na liście dozwolonych.
- Jest przeznaczona dla zaufanych środowisk operatora, w których Gateway i Node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ścisłego, jawnego zaufania, zachowaj `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów ścieżek na liście dozwolonych.

</Warning>

## Bezpieczne pliki binarne i przekazywanie zatwierdzeń

Informacje o bezpiecznych plikach binarnych (szybkiej ścieżce korzystającej wyłącznie ze stdin), szczegółach wiązania interpretera oraz
przekazywaniu monitów o zatwierdzenie do Slack/Discord/Telegram (lub uruchamianiu ich jako
natywnych klientów zatwierdzania) zawiera strona
[Zatwierdzenia wykonywania poleceń — zaawansowane](/pl/tools/exec-approvals-advanced).

## Edytowanie w interfejsie sterowania

Użyj karty **Interfejs sterowania -> Node -> Zatwierdzenia wykonywania poleceń**, aby edytować wartości domyślne,
nadpisania dla poszczególnych agentów oraz listy dozwolonych. Wybierz zakres (Wartości domyślne lub agent),
dostosuj politykę, dodaj lub usuń wzorce listy dozwolonych, a następnie wybierz **Zapisz**. Interfejs
wyświetla metadane ostatniego użycia dla każdego wzorca, co ułatwia utrzymanie porządku na liście.

Selektor celu pozwala wybrać **Gateway** (zatwierdzenia lokalne) albo **Node**.
Node muszą udostępniać `system.execApprovals.get/set` (aplikacja macOS lub bezinterfejsowy
host Node). Jeśli Node nie udostępnia jeszcze zatwierdzeń wykonywania poleceń, edytuj jego
lokalny plik zatwierdzeń bezpośrednio.

Niektóre hosty Node, w tym aplikacja towarzysząca dla systemu Windows, używają innego formatu polityki
zatwierdzania. Interfejs sterowania wyświetla te natywne polityki hosta tylko do odczytu. Aby je
edytować, użyj aplikacji towarzyszącej albo `openclaw approvals set --node <id|name|ip>` z natywną
strukturą polityki; zobacz [CLI zatwierdzeń](/pl/cli/approvals).

CLI: `openclaw approvals` obsługuje edytowanie Gateway lub Node — zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, Gateway rozgłasza
`exec.approval.requested` do klientów operatora. Interfejs sterowania i aplikacja macOS
rozstrzygają go przez `exec.approval.resolve`, a następnie Gateway przekazuje
zatwierdzone żądanie do hosta Node.

W przypadku `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek `systemRunPlan`.
Gateway używa tego planu jako autorytatywnego kontekstu polecenia/katalogu roboczego/sesji
podczas przekazywania zatwierdzonych żądań `system.run`:

- Ścieżka wykonywania poleceń Node przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania.
- Po zatwierdzeniu końcowe przekazywane wywołanie `system.run` ponownie wykorzystuje zapisany plan, zamiast ufać późniejszym zmianom wprowadzonym przez wywołującego.
- Jeśli po utworzeniu żądania zatwierdzenia wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey`, Gateway odrzuca przekazane uruchomienie z powodu niezgodności zatwierdzenia.

## Zdarzenia systemowe i odmowy

Cykl życia wykonywania polecenia publikuje komunikat systemowy `Wykonywanie zakończone` w sesji agenta
po zgłoszeniu zakończenia przez Node. OpenClaw może również wyemitować
powiadomienie o trwającym wykonywaniu po udzieleniu zatwierdzenia i upływie
`tools.exec.approvalRunningNoticeMs` (domyślnie `10000`; wartość `0` je wyłącza).
Odrzucone zatwierdzenia wykonywania poleceń są stanem końcowym dla polecenia hosta: polecenie
nie jest wykonywane.

- W przypadku asynchronicznych zatwierdzeń głównego agenta z sesją źródłową OpenClaw
  publikuje odmowę z powrotem w tej sesji jako wewnętrzną wiadomość uzupełniającą, aby
  agent mógł przestać oczekiwać na polecenie asynchroniczne i uniknąć
  naprawy brakującego wyniku.
- Jeśli sesja nie istnieje lub nie można jej wznowić, OpenClaw nadal może
  przekazać zwięzłą informację o odmowie operatorowi lub bezpośrednią trasą czatu.
- Odmowy dotyczące sesji podagentów i Cron nie są publikowane z powrotem w tych
  sesjach.

Zatwierdzenia wykonywania poleceń na hoście Gateway emitują to samo zdarzenie zakończenia cyklu życia.
Wykonania wymagające zatwierdzenia ponownie wykorzystują identyfikator zatwierdzenia, aby skorelować oczekujące
żądanie z komunikatem o jego zakończeniu lub odmowie (`Wykonywanie zakończone (gateway
id=...)` / `Wykonywanie odrzucone (gateway id=...)`).

## Konsekwencje

- **`full`** daje duże możliwości; gdy to możliwe, preferuj listy dozwolonych.
- **`ask`** pozwala zachować kontrolę, a jednocześnie umożliwia szybkie zatwierdzanie.
- Listy dozwolonych dla poszczególnych agentów zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą wyłącznie żądań wykonywania poleceń na hoście pochodzących od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wywołać `/exec`.
- `/exec security=full` to udogodnienie na poziomie sesji dla autoryzowanych operatorów, które z założenia pomija zatwierdzenia. Aby bezwzględnie zablokować wykonywanie poleceń na hoście, ustaw zabezpieczenie zatwierdzeń na `deny` albo zablokuj narzędzie `exec` za pomocą polityki narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne pliki binarne, wiązanie interpretera i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Exec tool" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Elevated mode" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby piaskownicy i dostęp do obszaru roboczego.
  </Card>
  <Card title="Security" href="/pl/gateway/security" icon="lock">
    Model zabezpieczeń i wzmacnianie ochrony.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy używać każdego z tych mechanizmów sterowania.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Automatyczne zezwalanie oparte na Skills.
  </Card>
</CardGroup>
