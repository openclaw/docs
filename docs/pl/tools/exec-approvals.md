---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementacja UX zatwierdzania exec w aplikacji macOS
    - Analiza promptów ucieczki z piaskownicy i ich implikacji
sidebarTitle: Exec approvals
summary: 'Zatwierdzenia wykonywania poleceń na hoście: parametry zasad, listy dozwolonych elementów i przepływ pracy YOLO/rygorystyczny'
title: Zatwierdzenia wykonywania poleceń
x-i18n:
    generated_at: "2026-05-06T09:32:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzenia exec są **zabezpieczeniem aplikacji towarzyszącej / hosta node**, które pozwala
agentowi w piaskownicy uruchamiać polecenia na rzeczywistym hoście (`gateway` lub `node`). To
blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych +
(opcjonalne) zatwierdzenie użytkownika są zgodne. Zatwierdzenia exec działają **ponad**
polityką narzędzi i bramkowaniem podwyższonych uprawnień (chyba że podwyższone uprawnienia są ustawione na `full`, co
pomija zatwierdzenia).

<Note>
Efektywna polityka jest **bardziej restrykcyjna** spośród wartości `tools.exec.*` i domyślnych wartości zatwierdzeń;
jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość `tools.exec`.
Exec na hoście używa także lokalnego stanu zatwierdzeń na tej maszynie - lokalne dla hosta
`ask: "always"` w `~/.openclaw/exec-approvals.json` nadal powoduje wyświetlanie monitów,
nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

| Polecenie                                                        | Co pokazuje                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądana polityka, źródła polityki hosta oraz efektywny wynik.                          |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                       |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalnie żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku. |

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten
zakres w czasie wykonywania jako zarządzany przez node, zamiast udawać, że lokalny
plik zatwierdzeń jest źródłem prawdy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie, które
normalnie wywołałoby monit, jest rozstrzygane przez **awaryjną wartość ask** (domyślnie: `deny`).

<Tip>
Natywni klienci zatwierdzania na czacie mogą zasilać oczekujący komunikat zatwierdzenia funkcjami specyficznymi dla kanału.
Na przykład Matrix dodaje skróty reakcji
(`✅` zezwól raz, `❌` odmów, `♾️` zawsze zezwalaj), jednocześnie pozostawiając
polecenia `/approve ...` w wiadomości jako opcję awaryjną.
</Tip>

## Gdzie ma zastosowanie

Zatwierdzenia exec są egzekwowane lokalnie na hoście wykonania:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host node** → uruchamiacz node (aplikacja towarzysząca macOS lub bezgłowy host node).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami tego Gateway.
- Sparowane node rozszerzają tę zdolność zaufanego operatora na host node.
- Zatwierdzenia exec ograniczają ryzyko przypadkowego wykonania, ale **nie** stanowią granicy uwierzytelniania dla każdego użytkownika.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczny cwd, dokładny argv, wiązanie env, gdy jest obecne, oraz przypiętą ścieżkę wykonywalną, gdy ma zastosowanie.
- W przypadku skryptów powłoki i bezpośrednich wywołań plików interpretera/środowiska uruchomieniowego OpenClaw próbuje także powiązać jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonania zmienionej treści.
- Wiązanie plików jest celowo realizowane na zasadzie best-effort, **nie** jako kompletny model semantyczny każdej ścieżki ładowania interpretera/środowiska uruchomieniowego. Jeśli tryb zatwierdzeń nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku do powiązania, odmawia utworzenia uruchomienia opartego na zatwierdzeniu, zamiast udawać pełne pokrycie.

### Podział w macOS

- **Usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalny IPC.
- **Aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonania:

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
  - `deny` - blokuj wszystkie żądania exec hosta.
  - `allowlist` - zezwalaj tylko na polecenia z listy dozwolonych.
  - `full` - zezwalaj na wszystko (równoważne podwyższonym uprawnieniom).

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
  nawet jeśli sam plik binarny interpretera znajduje się na liście dozwolonych. Obrona warstwowa
  dla loaderów interpretera, które nie mapują się jednoznacznie na jeden stabilny
  operand pliku.
</ParamField>

Przykłady, które wychwytuje tryb ścisły:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie ścisłym te polecenia nadal wymagają jawnego zatwierdzenia, a
`allow-always` nie utrwala automatycznie dla nich nowych wpisów listy dozwolonych.

## Tryb YOLO (bez zatwierdzeń)

Jeśli chcesz, aby exec hosta działał bez monitów zatwierdzenia, musisz otworzyć
**obie** warstwy polityki - żądaną politykę exec w konfiguracji OpenClaw
(`tools.exec.*`) **oraz** lokalną dla hosta politykę zatwierdzeń w
`~/.openclaw/exec-approvals.json`.

YOLO jest domyślnym zachowaniem hosta, chyba że wyraźnie je zaostrzysz:

| Warstwa               | Ustawienie YOLO           |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera **gdzie** działa exec: w piaskownicy, gdy jest dostępna, w przeciwnym razie na Gateway.
- YOLO wybiera **jak** zatwierdzany jest exec hosta: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemniania poleceń ani warstwy odrzucania skryptów przed uruchomieniem ponad skonfigurowaną polityką exec hosta.
- `auto` nie sprawia, że routing przez Gateway staje się darmowym obejściem z sesji w piaskownicy. Żądanie per-call `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy żadne środowisko piaskownicy nie jest aktywne. Aby uzyskać stabilną wartość domyślną inną niż auto, ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

</Warning>

Dostawcy oparci na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień,
mogą przestrzegać tej polityki. Claude CLI dodaje
`--permission-mode bypassPermissions`, gdy żądana przez OpenClaw polityka exec
to YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude
pod `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
na przykład `--permission-mode default`, `acceptEdits` lub
`bypassPermissions`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz dowolną warstwę z powrotem do
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
- Domyślne wartości lokalnego `~/.openclaw/exec-approvals.json`.

Jest celowo wyłącznie lokalny. Aby zdalnie zmienić zatwierdzenia hosta Gateway lub hosta node,
użyj `openclaw approvals set --gateway` albo
`openclaw approvals set --node <id|name|ip>`.

### Host node

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
**Ograniczenia wyłącznie lokalne:**

- `openclaw exec-policy` nie synchronizuje zatwierdzeń node.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia exec node są pobierane z node w czasie wykonywania, więc aktualizacje kierowane do node muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót, który także pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż konfiguracja, bardziej restrykcyjna
polityka hosta nadal wygrywa.

## Lista dozwolonych (na agenta)

Listy dozwolonych są **per agent**. Jeśli istnieje wielu agentów, przełącz w aplikacji macOS agenta,
którego edytujesz. Wzorce są dopasowaniami glob.

Wzorce mogą być globami rozwiązanych ścieżek binarnych albo globami samych nazw poleceń.
Same nazwy pasują tylko do poleceń wywołanych przez `PATH`, więc `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale **nie** do `./rg` ani
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
względem sparsowanych argumentów polecenia, z wyłączeniem tokenu wykonywalnego
(`argv[0]`). W przypadku ręcznie tworzonych wpisów argumenty są łączone pojedynczą
spacją, więc zakotwicz wzorzec, gdy potrzebujesz dokładnego dopasowania.

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

Ten wpis zezwala na `python3 safe.py`; `python3 other.py` jest chybieniem listy dozwolonych.
Jeśli obecny jest także wpis tylko ze ścieżką dla tego samego pliku binarnego, niedopasowane
argumenty nadal mogą wrócić do tego wpisu tylko ze ścieżką. Pomiń wpis tylko ze ścieżką,
gdy celem jest ograniczenie pliku binarnego do zadeklarowanych argumentów.

Wpisy zapisane przez przepływy zatwierdzania mogą używać wewnętrznego formatu separatora do
dokładnego dopasowania argv. Preferuj UI lub przepływ zatwierdzania do ponownego wygenerowania tych
wpisów zamiast ręcznej edycji zakodowanej wartości. Jeśli OpenClaw nie może
sparsować argv dla segmentu polecenia, wpisy z `argPattern` nie pasują.

Każdy wpis listy dozwolonych obsługuje:

| Pole               | Znaczenie                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Rozwinięty glob ścieżki binarnej lub glob samej nazwy polecenia |
| `argPattern`       | Opcjonalny regex argv; pominięte wpisy dotyczą tylko ścieżki |
| `id`               | Stabilny UUID używany jako tożsamość UI |
| `source`           | Źródło wpisu, takie jak `allow-always` |
| `commandText`      | Tekst polecenia przechwycony, gdy przepływ zatwierdzania utworzył wpis |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia |
| `lastUsedCommand`  | Ostatnie dopasowane polecenie |
| `lastResolvedPath` | Ostatnio rozwinięta ścieżka binarna |

## Automatyczne zezwalanie na CLI Skills

Gdy **Automatyczne zezwalanie na CLI Skills** jest włączone, pliki wykonywalne wskazywane przez
znane Skills są traktowane jako znajdujące się na liście dozwolonych na Node (Node macOS lub bezgłowy
host Node). To używa `skills.bins` przez RPC Gateway do pobrania
listy bin Skills. Wyłącz to, jeśli chcesz mieć ścisłe ręczne listy dozwolonych.

<Warning>
- To jest **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla zaufanych środowisk operatora, w których Gateway i Node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ścisłego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.

</Warning>

## Bezpieczne pliki binarne i przekazywanie zatwierdzeń

Informacje o bezpiecznych plikach binarnych (szybka ścieżka tylko przez stdin), szczegółach wiązania interpretera oraz
przekazywaniu monitów zatwierdzania do Slack/Discord/Telegram (albo uruchamianiu ich jako
natywnych klientów zatwierdzania) znajdziesz w
[Zatwierdzenia Exec - zaawansowane](/pl/tools/exec-approvals-advanced).

## Edycja w interfejsie sterowania

Użyj karty **Interfejs sterowania → Node → Zatwierdzenia Exec**, aby edytować wartości domyślne,
nadpisania dla poszczególnych agentów oraz listy dozwolonych. Wybierz zakres (Domyślne lub agent),
dostosuj zasady, dodaj/usuń wzorce listy dozwolonych, a następnie **Zapisz**. UI
pokazuje metadane ostatniego użycia dla każdego wzorca, aby ułatwić utrzymanie listy w porządku.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**.
Node muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub
bezgłowy host Node). Jeśli Node nie ogłasza jeszcze zatwierdzeń Exec,
edytuj bezpośrednio jego lokalny plik `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję Gateway albo Node - zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, Gateway rozgłasza
`exec.approval.requested` do klientów operatora. Interfejs sterowania i aplikacja macOS
rozwiązują go przez `exec.approval.resolve`, a następnie Gateway przekazuje
zatwierdzone żądanie do hosta Node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek
`systemRunPlan`. Gateway używa tego planu jako autorytatywnego
kontekstu polecenia/cwd/sesji podczas przekazywania zatwierdzonych żądań
`system.run`.

Ma to znaczenie dla opóźnienia zatwierdzania asynchronicznego:

- Ścieżka exec Node przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i jego metadane wiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu zamiast ufać późniejszym zmianom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` po utworzeniu żądania zatwierdzenia, Gateway odrzuci przekazane uruchomienie jako niezgodność zatwierdzenia.

## Zdarzenia systemowe

Cykl życia Exec jest ujawniany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o działaniu).
- `Exec finished`.
- `Exec denied`.

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez Node.
Zatwierdzenia Exec hostowane przez Gateway emitują te same zdarzenia cyklu życia, gdy
polecenie się zakończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Polecenia exec objęte zatwierdzeniem ponownie używają identyfikatora zatwierdzenia jako `runId` w tych
komunikatach, aby ułatwić korelację.

## Zachowanie po odmowie zatwierdzenia

Gdy asynchroniczne zatwierdzenie Exec zostanie odrzucone, OpenClaw uniemożliwia agentowi
ponowne użycie wyjścia z wcześniejszego uruchomienia tego samego polecenia w sesji.
Powód odmowy jest przekazywany z wyraźną wskazówką, że żadne wyjście polecenia
nie jest dostępne, co powstrzymuje agenta przed twierdzeniem, że pojawiło się nowe wyjście, lub
powtarzaniem odrzuconego polecenia z nieaktualnymi wynikami z poprzedniego udanego
uruchomienia.

## Implikacje

- **`full`** daje duże możliwości; preferuj listy dozwolonych, gdy to możliwe.
- **`ask`** utrzymuje Cię w pętli, nadal pozwalając na szybkie zatwierdzenia.
- Listy dozwolonych dla poszczególnych agentów zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wywołać `/exec`.
- `/exec security=full` to wygoda na poziomie sesji dla autoryzowanych operatorów i celowo pomija zatwierdzenia. Aby twardo zablokować exec hosta, ustaw zabezpieczenia zatwierdzeń na `deny` albo odmów narzędzia `exec` przez zasady narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia Exec - zaawansowane" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne pliki binarne, wiązanie interpretera i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie Exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby piaskownicy i dostęp do obszaru roboczego.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Piaskownica a zasady narzędzi a tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgać po każdą kontrolę.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania oparte na Skills.
  </Card>
</CardGroup>
