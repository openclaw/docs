---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementacja UX zatwierdzania exec w aplikacji macOS
    - Analiza promptów ucieczki z piaskownicy i ich konsekwencji
sidebarTitle: Exec approvals
summary: 'Zatwierdzenia host exec: parametry zasad, listy dozwolonych i przepływ pracy YOLO/strict'
title: Zatwierdzenia wykonywania poleceń
x-i18n:
    generated_at: "2026-05-11T20:38:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzenia exec są **zabezpieczeniem aplikacji towarzyszącej / hosta node**, które pozwala
agentowi w piaskownicy uruchamiać polecenia na rzeczywistym hoście (`gateway` lub `node`). To
blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych +
(opcjonalne) zatwierdzenie użytkownika są zgodne. Zatwierdzenia exec nakładają się **na**
politykę narzędzi i bramkowanie podwyższonego trybu (chyba że elevated jest ustawione na `full`, co
pomija zatwierdzenia).

<Note>
Efektywna polityka jest **surowszą** z wartości `tools.exec.*` i domyślnych
zatwierdzeń; jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość
`tools.exec`. Host exec używa również lokalnego stanu zatwierdzeń na tej maszynie - lokalne dla hosta
`ask: "always"` w `~/.openclaw/exec-approvals.json` nadal wyświetla monity, nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

| Polecenie                                                        | Co pokazuje                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądana polityka, źródła polityki hosta oraz efektywny wynik.                           |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                        |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalnie żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku. |

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten
zakres w czasie wykonywania jako zarządzany przez node, zamiast udawać, że lokalny
plik zatwierdzeń jest źródłem prawdy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie, które
normalnie wyświetliłoby monit, jest rozstrzygane przez **awaryjne zachowanie ask** (domyślnie: `deny`).

<Tip>
Natywne klienty zatwierdzania czatu mogą inicjalizować udogodnienia specyficzne dla kanału w
oczekującej wiadomości zatwierdzenia. Na przykład Matrix inicjalizuje skróty reakcji
(`✅` zezwól raz, `❌` odmów, `♾️` zezwalaj zawsze), nadal pozostawiając
polecenia `/approve ...` w wiadomości jako rozwiązanie awaryjne.
</Tip>

## Gdzie ma zastosowanie

Zatwierdzenia exec są wymuszane lokalnie na hoście wykonawczym:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host Node** → runner node (aplikacja towarzysząca macOS lub bezgłowy host node).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane node rozszerzają tę zdolność zaufanego operatora na host node.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale **nie** są granicą uwierzytelniania per użytkownik ani polityką tylko do odczytu systemu plików.
- Po zatwierdzeniu polecenie może modyfikować pliki zgodnie z wybranymi uprawnieniami hosta lub piaskownicy do systemu plików.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env, gdy jest obecne, oraz przypiętą ścieżkę pliku wykonywalnego, gdy ma to zastosowanie.
- Dla skryptów powłoki i bezpośrednich wywołań plików interpretera/runtime OpenClaw próbuje również powiązać jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonania zmienionej treści.
- Powiązanie pliku jest celowo najlepszym możliwym podejściem, **nie** pełnym modelem semantycznym każdej ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku do powiązania, odmawia wybicia uruchomienia opartego na zatwierdzeniu, zamiast udawać pełne pokrycie.

### Podział macOS

- **Usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **Aplikacja macOS** wymusza zatwierdzenia i wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonawczym:

```text
~/.openclaw/exec-approvals.json
```

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

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokuj wszystkie żądania host exec.
  - `allowlist` - zezwalaj tylko na polecenia z listy dozwolonych.
  - `full` - zezwalaj na wszystko (równoważne elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nigdy nie wyświetlaj monitu.
  - `on-miss` - wyświetlaj monit tylko wtedy, gdy lista dozwolonych nie pasuje.
  - `always` - wyświetlaj monit przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** tłumi monitów, gdy efektywny tryb ask to `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Rozstrzygnięcie, gdy monit jest wymagany, ale żaden UI nie jest osiągalny.

- `deny` - blokuj.
- `allowlist` - zezwalaj tylko wtedy, gdy lista dozwolonych pasuje.
- `full` - zezwalaj.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy `true`, OpenClaw traktuje formy inline code-eval jako wymagające wyłącznie zatwierdzenia,
  nawet jeśli sam binarny interpreter jest na liście dozwolonych. Obrona w głąb
  dla loaderów interpretera, które nie mapują się czysto na jeden stabilny
  operand pliku.
</ParamField>

Przykłady wychwytywane przez tryb ścisły:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie ścisłym te polecenia nadal wymagają jawnego zatwierdzenia, a
`allow-always` nie utrwala dla nich automatycznie nowych wpisów listy dozwolonych.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Kontroluje tylko prezentację w monitach zatwierdzania exec. Po włączeniu
  OpenClaw może dołączać zakresy poleceń wyprowadzone z parsera, aby internetowe
  monity zatwierdzeń mogły wyróżniać tokeny poleceń. Ustaw na `true`, aby włączyć
  wyróżnianie tekstu polecenia.
</ParamField>

To ustawienie **nie** zmienia `security`, `ask`, dopasowywania listy dozwolonych,
ścisłego zachowania inline-eval, przekazywania zatwierdzeń ani wykonywania poleceń.
Można je ustawić globalnie w `tools.exec.commandHighlighting` albo dla danego
agenta w `agents.list[].tools.exec.commandHighlighting`.

## Tryb YOLO (bez zatwierdzania)

Jeśli chcesz, aby host exec działał bez monitów zatwierdzania, musisz otworzyć
**obie** warstwy polityki - żądaną politykę exec w konfiguracji OpenClaw
(`tools.exec.*`) **oraz** lokalną dla hosta politykę zatwierdzeń w
`~/.openclaw/exec-approvals.json`.

YOLO jest domyślnym zachowaniem hosta, chyba że je jawnie zaostrzysz:

| Warstwa               | Ustawienie YOLO            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera **gdzie** działa exec: piaskownica, gdy jest dostępna, w przeciwnym razie Gateway.
- YOLO wybiera **jak** zatwierdzany jest host exec: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemnionych poleceń ani warstwy odrzucania skryptów przed uruchomieniem ponad skonfigurowaną politykę host exec.
- `auto` nie sprawia, że trasowanie przez Gateway staje się darmowym obejściem z sesji w piaskownicy. Żądanie per wywołanie `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy żadne środowisko uruchomieniowe piaskownicy nie jest aktywne. Dla stabilnej domyślnej wartości innej niż auto ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

</Warning>

Dostawcy wspierani przez CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień,
mogą stosować tę politykę. Claude CLI dodaje
`--permission-mode bypassPermissions`, gdy żądana przez OpenClaw polityka exec
to YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude
w `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
na przykład `--permission-mode default`, `acceptEdits` albo
`bypassPermissions`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz dowolną warstwę z powrotem do
`allowlist` / `on-miss` albo `deny`.

### Trwała konfiguracja „nigdy nie pytaj” dla hosta Gateway

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
- Domyślne ustawienia lokalnego `~/.openclaw/exec-approvals.json`.

Jest celowo tylko lokalny. Aby zmienić zatwierdzenia hosta Gateway lub hosta node
zdalnie, użyj `openclaw approvals set --gateway` albo
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Dla hosta node zastosuj zamiast tego ten sam plik zatwierdzeń na tym node:

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

- `openclaw exec-policy` nie synchronizuje zatwierdzeń node.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia exec node są pobierane z node w czasie wykonywania, więc aktualizacje kierowane do node muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót, który również pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje surowszy niż konfiguracja, surowsza polityka
hosta nadal wygrywa.

## Lista dozwolonych (per agent)

Listy dozwolonych są **per agent**. Jeśli istnieje wielu agentów, przełącz w aplikacji macOS agenta,
którego edytujesz. Wzorce są dopasowaniami glob.

Wzorcami mogą być globy rozstrzygniętych ścieżek binarnych albo globy samych nazw poleceń.
Same nazwy pasują tylko do poleceń wywołanych przez `PATH`, więc `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale **nie** do `./rg` ani
`/tmp/rg`. Użyj globu ścieżki, gdy chcesz zaufać jednej konkretnej lokalizacji binarnej.

Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu
spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Ograniczanie argumentów za pomocą argPattern

Dodaj `argPattern`, gdy wpis listy dozwolonych powinien pasować do pliku binarnego i
konkretnego kształtu argumentów. OpenClaw ocenia wyrażenie regularne
względem sparsowanych argumentów polecenia, z wyłączeniem tokenu pliku wykonywalnego
(`argv[0]`). Dla wpisów tworzonych ręcznie argumenty są łączone
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

Ten wpis zezwala na `python3 safe.py`; `python3 other.py` jest brakiem dopasowania listy dozwolonych. Jeśli obecny jest także wpis tylko ścieżki dla tego samego pliku binarnego, niedopasowane
argumenty nadal mogą wrócić do tego wpisu tylko ścieżki. Pomiń wpis tylko ścieżki,
gdy celem jest ograniczenie pliku binarnego do zadeklarowanych argumentów.

Wpisy zapisane przez przepływy zatwierdzania mogą używać wewnętrznego formatu separatora do
dokładnego dopasowywania argv. Preferuj UI lub przepływ zatwierdzania do ponownego wygenerowania tych
wpisów zamiast ręcznej edycji zakodowanej wartości. Jeśli OpenClaw nie może
przeanalizować argv dla segmentu polecenia, wpisy z `argPattern` nie pasują.

Każdy wpis listy dozwolonych obsługuje:

| Pole               | Znaczenie                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob rozwiązanej ścieżki binarnej lub glob samej nazwy polecenia |
| `argPattern`       | Opcjonalne wyrażenie regularne argv; pominięte wpisy są tylko ścieżkowe |
| `id`               | Stabilny UUID używany jako tożsamość w UI                     |
| `source`           | Źródło wpisu, na przykład `allow-always`                      |
| `commandText`      | Tekst polecenia przechwycony, gdy przepływ zatwierdzania utworzył wpis |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia                              |
| `lastUsedCommand`  | Ostatnie pasujące polecenie                                   |
| `lastResolvedPath` | Ostatnia rozwiązana ścieżka binarna                           |

## Automatyczne zezwalanie na CLI Skills

Gdy **Automatyczne zezwalanie na CLI Skills** jest włączone, pliki wykonywalne wskazywane przez
znane Skills są traktowane jako znajdujące się na liście dozwolonych na węzłach (węzeł macOS lub bezgłowy
host węzła). Używa to `skills.bins` przez RPC Gateway, aby pobrać
listę binariów Skills. Wyłącz to, jeśli chcesz używać ściśle ręcznych list dozwolonych.

<Warning>
- To jest **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla zaufanych środowisk operatorskich, w których Gateway i węzeł znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ściśle jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.

</Warning>

## Bezpieczne binaria i przekazywanie zatwierdzeń

Informacje o bezpiecznych binariach (szybka ścieżka tylko przez stdin), szczegółach wiązania interpreterów oraz
sposobie przekazywania monitów zatwierdzania do Slack/Discord/Telegram (lub uruchamiania ich jako
natywnych klientów zatwierdzania) znajdziesz w
[Zatwierdzenia exec - zaawansowane](/pl/tools/exec-approvals-advanced).

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Zatwierdzenia exec**, aby edytować wartości domyślne,
nadpisania dla agentów i listy dozwolonych. Wybierz zakres (Domyślne lub agent),
dostosuj politykę, dodaj/usuń wzorce listy dozwolonych, a następnie kliknij **Zapisz**. UI
pokazuje metadane ostatniego użycia dla każdego wzorca, dzięki czemu możesz utrzymać listę w porządku.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) lub **Node**.
Węzły muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub
bezgłowy host węzła). Jeśli węzeł nie ogłasza jeszcze zatwierdzeń exec,
edytuj bezpośrednio jego lokalny plik `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję Gateway lub węzła - zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, gateway rozgłasza
`exec.approval.requested` do klientów operatorskich. Control UI i aplikacja macOS
rozwiązują go przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta węzła.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek
`systemRunPlan`. Gateway używa tego planu jako autorytatywnego
kontekstu command/cwd/session podczas przekazywania zatwierdzonych żądań `system.run`.

Ma to znaczenie dla opóźnienia zatwierdzania asynchronicznego:

- Ścieżka exec węzła przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i metadane jego wiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu zamiast ufać późniejszym edycjom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuci przekazany przebieg jako niezgodność zatwierdzenia.

## Zdarzenia systemowe

Cykl życia exec jest udostępniany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekracza próg powiadomienia o działaniu).
- `Exec finished`.
- `Exec denied`.

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez węzeł.
Zatwierdzenia exec hostowane przez Gateway emitują te same zdarzenia cyklu życia po
zakończeniu polecenia (oraz opcjonalnie, gdy działa dłużej niż próg).
Exec wymagające zatwierdzenia ponownie używają identyfikatora zatwierdzenia jako `runId` w tych
komunikatach, aby ułatwić korelację.

## Zachowanie po odmowie zatwierdzenia

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi
ponowne użycie danych wyjściowych z dowolnego wcześniejszego uruchomienia tego samego polecenia w sesji.
Powód odmowy jest przekazywany z wyraźną wskazówką, że żadne dane wyjściowe polecenia
nie są dostępne, co powstrzymuje agenta przed twierdzeniem, że istnieją nowe dane wyjściowe, lub
powtarzaniem odrzuconego polecenia z nieaktualnymi wynikami z wcześniejszego pomyślnego
uruchomienia.

## Konsekwencje

- **`full`** jest potężne; preferuj listy dozwolonych, gdy to możliwe.
- **`ask`** utrzymuje Cię w pętli, nadal umożliwiając szybkie zatwierdzenia.
- Listy dozwolonych dla poszczególnych agentów zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygoda na poziomie sesji dla autoryzowanych operatorów i celowo pomija zatwierdzenia. Aby twardo zablokować exec hosta, ustaw zabezpieczenie zatwierdzeń na `deny` lub odmów narzędzia `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia exec - zaawansowane" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne binaria, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby sandboxa i dostęp do obszaru roboczego.
  </Card>
  <Card title="Security" href="/pl/gateway/security" icon="lock">
    Model zabezpieczeń i utwardzanie.
  </Card>
  <Card title="Sandbox kontra polityka narzędzi kontra tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgnąć po każdą z kontrolek.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania wspierane przez Skills.
  </Card>
</CardGroup>
