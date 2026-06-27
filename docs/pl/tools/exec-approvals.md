---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementowanie UX zatwierdzania exec w aplikacji macOS
    - Przegląd promptów dotyczących ucieczki z piaskownicy i ich implikacji
sidebarTitle: Exec approvals
summary: 'Zatwierdzenia wykonywania na hoście: przełączniki zasad, listy dozwolonych działań i przepływ YOLO/strict'
title: Zatwierdzenia wykonywania poleceń
x-i18n:
    generated_at: "2026-06-27T18:26:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzenia exec są **zabezpieczeniem aplikacji towarzyszącej / hosta węzła**, które pozwala
agentowi w piaskownicy uruchamiać polecenia na prawdziwym hoście (`gateway` lub `node`). To
blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych +
(opcjonalne) zatwierdzenie użytkownika są zgodne. Zatwierdzenia exec nakładają się **na**
politykę narzędzi i bramkowanie podwyższone (chyba że podwyższenie jest ustawione na `full`, co
pomija zatwierdzenia).

Omówienie trybów `deny`, `allowlist`, `ask`, `auto`, `full`,
mapowania Codex Guardian oraz uprawnień uprzęży ACPX w ujęciu od trybu znajdziesz w
[Tryby uprawnień](/pl/tools/permission-modes).

<Note>
Efektywna polityka jest **bardziej restrykcyjna** z `tools.exec.*` i domyślnych
zatwierdzeń; jeśli pole zatwierdzeń jest pominięte, używana jest wartość
`tools.exec`. Exec hosta używa też lokalnego stanu zatwierdzeń na tej maszynie - lokalne dla hosta
`ask: "always"` w pliku zatwierdzeń hosta wykonawczego nadal będzie
pytać, nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

| Polecenie                                                        | Co pokazuje                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądana polityka, źródła polityki hosta i efektywny wynik.                             |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                       |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalnie żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku. |

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten
zakres w czasie działania jako zarządzany przez węzeł, zamiast udawać, że lokalny
plik zatwierdzeń jest źródłem prawdy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie, które
normalnie wywołałoby monit, jest rozstrzygane przez **awaryjny tryb ask** (domyślnie: `deny`).

<Tip>
Natywni klienci zatwierdzania w czacie mogą inicjować udogodnienia specyficzne dla kanału w
oczekującej wiadomości zatwierdzenia. Na przykład Matrix inicjuje skróty reakcji
(`✅` zezwól raz, `❌` odmów, `♾️` zawsze zezwalaj), nadal pozostawiając
polecenia `/approve ...` w wiadomości jako rozwiązanie awaryjne.
</Tip>

## Gdzie to ma zastosowanie

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonawczym:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host węzła** → uruchamiacz węzła (aplikacja towarzysząca macOS lub bezgłowy host węzła).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane węzły rozszerzają tę możliwość zaufanego operatora na host węzła.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale **nie** są granicą uwierzytelniania per użytkownik ani polityką tylko do odczytu systemu plików.
- Po zatwierdzeniu polecenie może modyfikować pliki zgodnie z wybranymi uprawnieniami hosta lub systemu plików piaskownicy.
- Zatwierdzone uruchomienia na hoście węzła wiążą kanoniczny kontekst wykonania: kanoniczny cwd, dokładne argv, wiązanie env, gdy jest obecne, oraz przypiętą ścieżkę pliku wykonywalnego, gdy ma zastosowanie.
- W przypadku skryptów powłoki oraz bezpośrednich wywołań plików interpretera/środowiska uruchomieniowego OpenClaw próbuje też powiązać jeden konkretny lokalny operand plikowy. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonywania treści, która uległa zmianie.
- Wiązanie plików jest celowo najlepszym możliwym przybliżeniem, **nie** kompletnym modelem semantycznym każdej ścieżki ładowania interpretera/środowiska uruchomieniowego. Jeśli tryb zatwierdzania nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku do powiązania, odmawia wystawienia uruchomienia opartego na zatwierdzeniu, zamiast udawać pełne pokrycie.

### Podział macOS

- **Usługa hosta węzła** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **Aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście interfejsu użytkownika.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonawczym. Gdy
`OPENCLAW_STATE_DIR` jest ustawione, plik podąża za tym katalogiem stanu;
w przeciwnym razie używa domyślnego katalogu stanu OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Domyślne gniazdo zatwierdzeń używa tego samego katalogu głównego:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` albo
`~/.openclaw/exec-approvals.sock`, gdy zmienna nie jest ustawiona.

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Pokrętła polityki

### `tools.exec.mode`

`tools.exec.mode` to preferowana znormalizowana powierzchnia polityki dla exec hosta.
Wartości to:

- `deny` - blokuje exec hosta.
- `allowlist` - uruchamia tylko polecenia z listy dozwolonych bez pytania.
- `ask` - używa polityki listy dozwolonych i pyta przy chybieniach.
- `auto` - używa polityki listy dozwolonych, uruchamia deterministyczne dopasowania bezpośrednio i wysyła chybienia zatwierdzeń przez natywnego automatycznego recenzenta OpenClaw przed powrotem do ścieżki zatwierdzenia przez człowieka.
- `full` - uruchamia exec hosta bez monitów o zatwierdzenie.

Starsze `tools.exec.security` / `tools.exec.ask` pozostają obsługiwane i nadal wygrywają,
gdy są ustawione w węższym zakresie sesji lub agenta.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokuje wszystkie żądania exec hosta.
  - `allowlist` - zezwala tylko na polecenia z listy dozwolonych.
  - `full` - zezwala na wszystko (równoważne podwyższeniu).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Skonfigurowana polityka ask dla exec hosta. Kontroluje bazowe zachowanie
  monitu o zatwierdzenie z `tools.exec.ask` oraz domyślnych zatwierdzeń hosta. Parametr narzędzia
  `ask` dla pojedynczego wywołania (zobacz [Narzędzie exec](/pl/tools/exec#parameters))
  może tylko zaostrzyć tę bazę, a wywołania modelu pochodzące z kanału ignorują go,
  gdy efektywne ask hosta to `off`.

- `off` - nigdy nie pokazuj monitu.
- `on-miss` - pokazuj monit tylko wtedy, gdy lista dozwolonych nie pasuje.
- `always` - pokazuj monit przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** tłumi monitów, gdy efektywny tryb ask to `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Rozstrzygnięcie, gdy monit jest wymagany, ale żaden interfejs użytkownika nie jest osiągalny. Jeśli to
  pole jest pominięte, OpenClaw domyślnie używa `deny`.

- `deny` - blokuj.
- `allowlist` - zezwól tylko, jeśli pasuje lista dozwolonych.
- `full` - zezwól.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy `true`, OpenClaw traktuje formularze inline code-eval jako wymagające wyłącznie zatwierdzenia,
  nawet jeśli sam plik binarny interpretera znajduje się na liście dozwolonych. Obrona warstwowa
  dla loaderów interpreterów, które nie mapują się czysto na jeden stabilny operand
  plikowy.
</ParamField>

Przykłady, które wychwytuje tryb ścisły:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie ścisłym te polecenia nadal wymagają wyraźnego zatwierdzenia, a
`allow-always` nie utrwala dla nich automatycznie nowych wpisów listy dozwolonych.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Kontroluje tylko prezentację w monitach zatwierdzeń exec. Po włączeniu
  OpenClaw może dołączać zakresy poleceń wyprowadzone z parsera, aby monity zatwierdzania
  w sieci Web mogły podświetlać tokeny polecenia. Ustaw na `true`, aby włączyć
  podświetlanie tekstu polecenia.
</ParamField>

To ustawienie **nie** zmienia `security`, `ask`, dopasowywania listy dozwolonych,
zachowania ścisłego inline-eval, przekazywania zatwierdzeń ani wykonywania poleceń.
Można je ustawić globalnie w `tools.exec.commandHighlighting` lub dla
agenta w `agents.list[].tools.exec.commandHighlighting`.

## Tryb YOLO (bez zatwierdzeń)

Jeśli chcesz, aby exec hosta działał bez monitów o zatwierdzenie, musisz otworzyć
**obie** warstwy polityki - żądaną politykę exec w konfiguracji OpenClaw
(`tools.exec.*`) **oraz** lokalną dla hosta politykę zatwierdzeń w
pliku zatwierdzeń hosta wykonawczego.

OpenClaw domyślnie ustawia pominięte `askFallback` na `deny`. Ustaw hostowe
`askFallback` jawnie na `full`, gdy monit zatwierdzenia bez interfejsu użytkownika ma
awaryjnie zezwalać.

| Warstwa               | Ustawienie YOLO             |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node`  |
| `tools.exec.ask`      | `off`                       |
| Host `askFallback`    | `full`                      |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera **gdzie** działa exec: piaskownica, gdy jest dostępna, w przeciwnym razie gateway.
- YOLO wybiera **jak** zatwierdzany jest exec hosta: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemniania poleceń ani warstwy odrzucania skryptów przed wykonaniem na wierzchu skonfigurowanej polityki exec hosta.
- `auto` nie czyni routingu Gateway swobodnym nadpisaniem z sesji w piaskownicy. Żądanie per wywołanie `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy żadne środowisko uruchomieniowe piaskownicy nie jest aktywne. Aby uzyskać stabilne ustawienie domyślne inne niż auto, ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

</Warning>

Dostawcy wspierani przez CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień,
mogą stosować tę politykę. Claude CLI dodaje
`--permission-mode bypassPermissions`, gdy efektywna polityka exec OpenClaw
to YOLO. W przypadku sesji live Claude zarządzanych przez OpenClaw efektywna
polityka exec OpenClaw jest nadrzędna wobec natywnego trybu uprawnień Claude:
YOLO normalizuje uruchomienia live do `--permission-mode bypassPermissions`, a
restrykcyjna efektywna polityka exec normalizuje uruchomienia live do
`--permission-mode default`, nawet jeśli surowe argumenty backendu Claude określają inny
tryb.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz politykę exec OpenClaw z powrotem do
`allowlist` / `on-miss` albo `deny`.

### Trwała konfiguracja hosta Gateway „nigdy nie pytaj”

<Steps>
  <Step title="Ustaw żądaną politykę konfiguracji">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Dopasuj plik zatwierdzeń hosta">
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

### Lokalny skrót

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje oba elementy:

- Lokalne `tools.exec.host/security/ask`.
- Domyślne wartości lokalnego pliku zatwierdzeń, w tym `askFallback: "full"`.

Jest on celowo tylko lokalny. Aby zdalnie zmienić zatwierdzenia hosta Gateway lub hosta węzła, użyj `openclaw approvals set --gateway` albo
`openclaw approvals set --node <id|name|ip>`.

### Host węzła

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

<Note>
**Ograniczenia tylko lokalne:**

- `openclaw exec-policy` nie synchronizuje zatwierdzeń węzła.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia exec węzła są pobierane z węzła w czasie działania, więc aktualizacje kierowane do węzła muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót, który pomija zatwierdzenia exec tylko wtedy, gdy
  zarówno żądana polityka, jak i plik zatwierdzeń hosta rozpoznają się jako
  `security: "full"` i `ask: "off"`. Surowszy plik hosta, taki jak
  `ask: "always"`, nadal wyświetla monit.

Jeśli plik zatwierdzeń hosta pozostaje surowszy niż konfiguracja, surowsza
polityka hosta nadal wygrywa.

## Lista dozwolonych (na agenta)

Listy dozwolonych są **na agenta**. Jeśli istnieje wielu agentów, przełącz w aplikacji macOS,
którego agenta edytujesz. Wzorce są dopasowaniami glob.

Wzorce mogą być globami rozpoznanych ścieżek binarnych albo gołymi globami nazw poleceń.
Gołe nazwy pasują tylko do poleceń wywoływanych przez `PATH`, więc `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale **nie** do `./rg` ani
`/tmp/rg`. Użyj globu ścieżki, gdy chcesz zaufać jednej konkretnej lokalizacji
pliku binarnego.

Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu
spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Ograniczanie argumentów za pomocą argPattern

Dodaj `argPattern`, gdy wpis listy dozwolonych ma pasować do pliku binarnego i
konkretnego kształtu argumentów. OpenClaw ocenia wyrażenie regularne
względem przeanalizowanych argumentów polecenia, z wyłączeniem tokenu wykonywalnego
(`argv[0]`). W przypadku wpisów pisanych ręcznie argumenty są łączone
pojedynczą spacją, więc zakotwicz wzorzec, gdy potrzebujesz dokładnego dopasowania.

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

Ten wpis zezwala na `python3 safe.py`; `python3 other.py` nie trafia w listę dozwolonych.
Jeśli istnieje też wpis tylko ze ścieżką dla tego samego pliku binarnego, niedopasowane
argumenty mogą nadal wrócić do tego wpisu tylko ze ścieżką. Pomiń wpis tylko ze ścieżką,
gdy celem jest ograniczenie pliku binarnego do zadeklarowanych argumentów.

Wpisy zapisane przez przepływy zatwierdzania mogą używać wewnętrznego formatu separatora do
dokładnego dopasowywania argv. Preferuj UI albo przepływ zatwierdzania, aby ponownie wygenerować te
wpisy, zamiast ręcznie edytować zakodowaną wartość. Jeśli OpenClaw nie może
przeanalizować argv dla segmentu polecenia, wpisy z `argPattern` nie pasują.

Każdy wpis listy dozwolonych obsługuje:

| Pole               | Znaczenie                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob rozpoznanej ścieżki binarnej albo goły glob nazwy polecenia |
| `argPattern`       | Opcjonalny regex argv; pominięte wpisy są tylko ścieżkami      |
| `id`               | Stabilny UUID używany do tożsamości w UI                       |
| `source`           | Źródło wpisu, takie jak `allow-always`                         |
| `commandText`      | Tekst polecenia przechwycony, gdy przepływ zatwierdzania utworzył wpis |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia                               |
| `lastUsedCommand`  | Ostatnie polecenie, które pasowało                             |
| `lastResolvedPath` | Ostatnia rozpoznana ścieżka binarna                            |

## Automatyczne zezwalanie na CLI Skills

Gdy **Automatyczne zezwalanie na CLI Skills** jest włączone, pliki wykonywalne wskazywane przez
znane Skills są traktowane jako dozwolone na Node (Node macOS albo bezgłowy
host Node). Używa to `skills.bins` przez Gateway RPC, aby pobrać
listę binariów Skills. Wyłącz to, jeśli chcesz mieć ściśle ręczne listy dozwolonych.

<Warning>
- To jest **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla zaufanych środowisk operatorów, w których Gateway i Node są w tej samej granicy zaufania.
- Jeśli wymagasz ściśle jawnego zaufania, zachowaj `autoAllowSkills: false` i używaj tylko ręcznych wpisów listy dozwolonych ścieżek.

</Warning>

## Bezpieczne binaria i przekazywanie zatwierdzeń

Informacje o bezpiecznych binariach (szybka ścieżka tylko przez stdin), szczegółach wiązania interpreterów oraz
o tym, jak przekazywać monity zatwierdzeń do Slack/Discord/Telegram (albo uruchamiać je jako
natywnych klientów zatwierdzeń), znajdziesz w
[Zatwierdzenia exec - zaawansowane](/pl/tools/exec-approvals-advanced).

## Edytowanie w Control UI

Użyj karty **Control UI → Node → Zatwierdzenia exec**, aby edytować wartości domyślne,
nadpisania na agenta i listy dozwolonych. Wybierz zakres (Domyślne albo agent),
dostosuj politykę, dodaj/usuń wzorce listy dozwolonych, a potem wybierz **Zapisz**. UI
pokazuje metadane ostatniego użycia dla każdego wzorca, aby można było utrzymać listę w porządku.

Selektor celu wybiera **Gateway** (zatwierdzenia lokalne) albo **Node**.
Node muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS albo
bezgłowy host Node). Jeśli Node jeszcze nie ogłasza zatwierdzeń exec,
edytuj bezpośrednio jego lokalny plik zatwierdzeń.

CLI: `openclaw approvals` obsługuje edytowanie Gateway albo Node - zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, Gateway rozgłasza
`exec.approval.requested` do klientów operatora. Control UI i aplikacja macOS
rozwiązują go przez `exec.approval.resolve`, a następnie Gateway przekazuje
zatwierdzone żądanie do hosta Node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny payload `systemRunPlan`.
Gateway używa tego planu jako autorytatywnego
kontekstu command/cwd/session podczas przekazywania zatwierdzonych żądań `system.run`.

Ma to znaczenie dla opóźnień zatwierdzeń asynchronicznych:

- Ścieżka exec Node przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i jego metadane wiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu, zamiast ufać późniejszym edycjom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` albo `sessionKey` po utworzeniu żądania zatwierdzenia, Gateway odrzuca przekazane uruchomienie jako niezgodność zatwierdzenia.

## Zdarzenia systemowe

Cykl życia exec jest pokazywany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o działaniu).
- `Exec finished`.

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez Node.
Odmówione zatwierdzenia exec są terminalne dla samego polecenia hosta: polecenie
nie zostaje uruchomione. W przypadku asynchronicznych zatwierdzeń głównego agenta z sesją źródłową
OpenClaw publikuje odmowę z powrotem do tej sesji jako wewnętrzną kontynuację, aby
agent mógł przestać czekać na polecenie asynchroniczne i uniknąć naprawy brakującego wyniku.
Jeśli nie ma sesji albo sesji nie można wznowić, OpenClaw nadal może
zgłosić zwięzłą odmowę operatorowi albo bezpośredniej trasie czatu. Odmowy dla
sesji subagentów nie są publikowane z powrotem do subagenta.
Zatwierdzenia exec hostowane przez Gateway emitują te same zdarzenia cyklu życia, gdy
polecenie się kończy (i opcjonalnie, gdy działa dłużej niż próg).
Exec ograniczone zatwierdzeniem ponownie używają id zatwierdzenia jako `runId` w tych
komunikatach, aby ułatwić korelację.

## Zachowanie przy odmowie zatwierdzenia

Gdy asynchroniczne zatwierdzenie exec zostanie odmówione, OpenClaw traktuje polecenie hosta jako
terminalne i zamknięte odmową. W sesjach głównego agenta odmowa jest dostarczana jako
wewnętrzna kontynuacja sesji, która mówi agentowi, że polecenie asynchroniczne nie zostało uruchomione.
Zachowuje to ciągłość transkryptu bez ujawniania nieaktualnego wyjścia polecenia. Jeśli
dostarczenie do sesji jest niedostępne, OpenClaw wraca do zwięzłej odmowy dla operatora albo
bezpośredniego czatu, gdy istnieje bezpieczna trasa.

## Implikacje

- **`full`** jest potężne; preferuj listy dozwolonych, gdy to możliwe.
- **`ask`** utrzymuje cię w obiegu, a jednocześnie pozwala na szybkie zatwierdzenia.
- Listy dozwolonych na agenta zapobiegają przeciekaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wywołać `/exec`.
- `/exec security=full` to wygoda na poziomie sesji dla autoryzowanych operatorów i z założenia pomija zatwierdzenia. Aby twardo zablokować exec hosta, ustaw zabezpieczenia zatwierdzeń na `deny` albo odmów narzędzia `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne binaria, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Exec tool" href="/pl/tools/exec" icon="terminal">
    Narzędzie wykonywania poleceń powłoki.
  </Card>
  <Card title="Elevated mode" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby piaskownicy i dostęp do obszaru roboczego.
  </Card>
  <Card title="Security" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgać po każdą kontrolę.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania oparte na Skills.
  </Card>
</CardGroup>
