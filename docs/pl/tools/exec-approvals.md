---
read_when:
    - Konfigurowanie zatwierdzeń lub list dozwolonych dla exec
    - Implementacja UX zatwierdzania exec w aplikacji macOS
    - Analiza promptów umożliwiających ucieczkę z piaskownicy i ich konsekwencji
sidebarTitle: Exec approvals
summary: 'Zatwierdzenia wykonywania poleceń na hoście: ustawienia zasad, listy dozwolonych elementów i przepływ pracy YOLO/strict'
title: Zatwierdzenia wykonania poleceń
x-i18n:
    generated_at: "2026-05-10T19:57:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzenia exec to **mechanizm bezpieczeństwa aplikacji towarzyszącej / hosta Node**, który pozwala agentowi w piaskownicy uruchamiać polecenia na rzeczywistym hoście (`gateway` lub `node`). To blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy zgadzają się polityka + allowlista + (opcjonalnie) zatwierdzenie użytkownika. Zatwierdzenia exec nakładają się **na** politykę narzędzi i bramkowanie podwyższonych uprawnień (chyba że tryb podwyższony jest ustawiony na `full`, co pomija zatwierdzenia).

<Note>
Efektywna polityka jest **bardziej rygorystyczną** z wartości `tools.exec.*` i domyślnych ustawień zatwierdzeń; jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość `tools.exec`. Exec hosta używa też lokalnego stanu zatwierdzeń na danej maszynie - lokalne dla hosta `ask: "always"` w `~/.openclaw/exec-approvals.json` nadal wyświetla monity, nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

| Polecenie                                                        | Co pokazuje                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądana polityka, źródła polityki hosta i efektywny wynik.                             |
| `openclaw exec-policy show`                                      | Scalony widok lokalnej maszyny.                                                       |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalną żądaną politykę z lokalnym plikiem zatwierdzeń hosta jednym krokiem. |

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten zakres w czasie działania jako zarządzany przez Node, zamiast udawać, że lokalny plik zatwierdzeń jest źródłem prawdy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie, które normalnie wyświetliłoby monit, jest rozstrzygane przez **fallback ask** (domyślnie: `deny`).

<Tip>
Natywne klienty zatwierdzania czatu mogą inicjować udogodnienia specyficzne dla kanału w oczekującej wiadomości zatwierdzenia. Na przykład Matrix inicjuje skróty reakcji (`✅` zezwól raz, `❌` odmów, `♾️` zawsze zezwalaj), nadal pozostawiając polecenia `/approve ...` w wiadomości jako fallback.
</Tip>

## Gdzie ma zastosowanie

Zatwierdzenia exec są wymuszane lokalnie na hoście wykonawczym:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host Node** → runner Node (aplikacja towarzysząca macOS albo bezgłowy host Node).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami dla tego Gateway.
- Sparowane węzły rozszerzają tę możliwość zaufanego operatora na host Node.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale **nie** są granicą uwierzytelniania dla poszczególnych użytkowników ani polityką systemu plików tylko do odczytu.
- Po zatwierdzeniu polecenie może modyfikować pliki zgodnie z wybranymi uprawnieniami hosta lub piaskownicy do systemu plików.
- Zatwierdzone uruchomienia na hoście Node wiążą kanoniczny kontekst wykonania: kanoniczny cwd, dokładny argv, powiązanie env, jeśli obecne, oraz przypiętą ścieżkę pliku wykonywalnego, gdy ma to zastosowanie.
- Dla skryptów powłoki i bezpośrednich wywołań plików interpretera/runtime OpenClaw próbuje też powiązać jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonania treści, która uległa dryfowi.
- Wiązanie plików jest celowo oparte na najlepszych staraniach, **nie** jest kompletnym modelem semantycznym każdej ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku do powiązania, odmawia wystawienia uruchomienia opartego na zatwierdzeniu zamiast udawać pełne pokrycie.

### Podział w macOS

- **Usługa hosta Node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
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
  - `deny` - blokuje wszystkie żądania exec hosta.
  - `allowlist` - zezwala tylko na polecenia z allowlisty.
  - `full` - zezwala na wszystko (równoważne z trybem podwyższonym).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nigdy nie wyświetla monitu.
  - `on-miss` - wyświetla monit tylko wtedy, gdy allowlista nie pasuje.
  - `always` - wyświetla monit przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** tłumi monitów, gdy efektywny tryb ask to `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Rozstrzygnięcie, gdy monit jest wymagany, ale nie można osiągnąć UI.

- `deny` - blokuje.
- `allowlist` - zezwala tylko wtedy, gdy allowlista pasuje.
- `full` - zezwala.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy `true`, OpenClaw traktuje formy inline code-eval jako wymagające wyłącznie zatwierdzenia, nawet jeśli sam binarny plik interpretera znajduje się na allowliście. Obrona w głąb dla loaderów interpretera, których nie da się czysto zmapować na jeden stabilny operand pliku.
</ParamField>

Przykłady, które wychwytuje tryb rygorystyczny:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie rygorystycznym te polecenia nadal wymagają jawnego zatwierdzenia, a `allow-always` nie utrwala automatycznie nowych wpisów allowlisty dla nich.

## Tryb YOLO (bez zatwierdzania)

Jeśli chcesz, aby exec hosta działał bez monitów zatwierdzenia, musisz otworzyć **obie** warstwy polityki - żądaną politykę exec w konfiguracji OpenClaw (`tools.exec.*`) **oraz** lokalną dla hosta politykę zatwierdzeń w `~/.openclaw/exec-approvals.json`.

YOLO jest domyślnym zachowaniem hosta, chyba że jawnie je zaostrzysz:

| Warstwa               | Ustawienie YOLO           |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera, **gdzie** działa exec: piaskownica, gdy jest dostępna, w przeciwnym razie Gateway.
- YOLO wybiera, **jak** zatwierdzany jest exec hosta: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemniania poleceń ani warstwy odrzucania skryptów przed uruchomieniem ponad skonfigurowaną politykę exec hosta.
- `auto` nie sprawia, że routing Gateway jest darmowym obejściem z sesji w piaskownicy. Żądanie per wywołanie `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywny żaden runtime piaskownicy. Aby uzyskać stabilne domyślne ustawienie inne niż auto, ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

</Warning>

Dostawcy oparci na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień, mogą stosować tę politykę. Claude CLI dodaje `--permission-mode bypassPermissions`, gdy żądana polityka exec OpenClaw to YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude w `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` - na przykład `--permission-mode default`, `acceptEdits` albo `bypassPermissions`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz dowolną z warstw z powrotem do `allowlist` / `on-miss` albo `deny`.

### Trwała konfiguracja „nigdy nie pytaj” dla hosta Gateway

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

### Lokalny skrót

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje oba elementy:

- Lokalne `tools.exec.host/security/ask`.
- Domyślne ustawienia lokalnego `~/.openclaw/exec-approvals.json`.

Jest celowo tylko lokalny. Aby zdalnie zmienić zatwierdzenia hosta Gateway lub hosta Node, użyj `openclaw approvals set --gateway` albo `openclaw approvals set --node <id|name|ip>`.

### Host Node

Dla hosta Node zastosuj zamiast tego ten sam plik zatwierdzeń na tym węźle:

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

- `openclaw exec-policy` nie synchronizuje zatwierdzeń Node.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia exec Node są pobierane z Node w czasie działania, więc aktualizacje ukierunkowane na Node muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` jest skrótem awaryjnym, który także pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej rygorystyczny niż konfiguracja, bardziej rygorystyczna polityka hosta nadal wygrywa.

## Allowlista (per agent)

Allowlisty są **per agent**. Jeśli istnieje wielu agentów, przełącz w aplikacji macOS agenta, którego edytujesz. Wzorce są dopasowaniami glob.

Wzorce mogą być globami rozwiązywanych ścieżek binarnych albo globami prostych nazw poleceń. Proste nazwy pasują tylko do poleceń wywoływanych przez `PATH`, więc `rg` może pasować do `/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale **nie** do `./rg` ani `/tmp/rg`. Użyj globu ścieżki, gdy chcesz zaufać jednej konkretnej lokalizacji pliku binarnego.

Starsze wpisy `agents.default` są migrowane przy ładowaniu do `agents.main`. Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły allowlisty.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Ograniczanie argumentów za pomocą argPattern

Dodaj `argPattern`, gdy wpis allowlisty powinien dopasowywać plik binarny i konkretny kształt argumentów. OpenClaw ocenia wyrażenie regularne względem sparsowanych argumentów polecenia, z wyłączeniem tokenu pliku wykonywalnego (`argv[0]`). Dla wpisów pisanych ręcznie argumenty są łączone pojedynczą spacją, więc zakotwicz wzorzec, gdy potrzebujesz dokładnego dopasowania.

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

Ten wpis zezwala na `python3 safe.py`; `python3 other.py` jest chybieniem allowlisty. Jeśli dla tego samego pliku binarnego istnieje też wpis tylko ze ścieżką, niedopasowane argumenty nadal mogą wrócić do tego wpisu tylko ze ścieżką. Pomiń wpis tylko ze ścieżką, gdy celem jest ograniczenie pliku binarnego do zadeklarowanych argumentów.

Wpisy zapisane przez przepływy zatwierdzania mogą używać wewnętrznego formatu separatora do dokładnego dopasowania argv. Preferuj UI lub przepływ zatwierdzania do ponownego wygenerowania tych wpisów zamiast ręcznej edycji zakodowanej wartości. Jeśli OpenClaw nie może sparsować argv dla segmentu polecenia, wpisy z `argPattern` nie pasują.

Każdy wpis allowlisty obsługuje:

| Pole               | Znaczenie                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Rozwiązany glob ścieżki binarnej lub glob samej nazwy polecenia |
| `argPattern`       | Opcjonalne wyrażenie regularne argv; pominięte wpisy dotyczą tylko ścieżki |
| `id`               | Stabilny UUID używany jako tożsamość UI                       |
| `source`           | Źródło wpisu, takie jak `allow-always`                        |
| `commandText`      | Tekst polecenia przechwycony, gdy przepływ zatwierdzania utworzył wpis |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia                              |
| `lastUsedCommand`  | Ostatnie dopasowane polecenie                                 |
| `lastResolvedPath` | Ostatnia rozwiązana ścieżka binarna                           |

## Automatyczne zezwalanie na CLI Skills

Gdy **Automatyczne zezwalanie na CLI Skills** jest włączone, pliki wykonywalne wskazywane przez
znane Skills są traktowane jako znajdujące się na liście dozwolonych na węzłach (Node macOS lub bezgłowy
host Node). Używa to `skills.bins` przez RPC Gateway, aby pobrać
listę binariów Skills. Wyłącz to, jeśli chcesz ściśle ręczne listy dozwolonych.

<Warning>
- To jest **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla zaufanych środowisk operatorów, w których Gateway i Node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ściśle jawnego zaufania, zachowaj `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.

</Warning>

## Bezpieczne binaria i przekazywanie zatwierdzeń

Informacje o bezpiecznych binariach (szybkiej ścieżce tylko przez stdin), szczegółach wiązania interpreterów oraz
sposobie przekazywania monitów zatwierdzeń do Slack/Discord/Telegram (lub uruchamiania ich jako
natywnych klientów zatwierdzeń) znajdziesz w
[Zatwierdzenia Exec - zaawansowane](/pl/tools/exec-approvals-advanced).

## Edycja w Control UI

Użyj karty **Control UI → Node → Zatwierdzenia Exec**, aby edytować wartości domyślne,
nadpisania dla agentów i listy dozwolonych. Wybierz zakres (Domyślne lub agent),
dostosuj politykę, dodaj/usuń wzorce listy dozwolonych, a następnie kliknij **Zapisz**. UI
pokazuje metadane ostatniego użycia dla każdego wzorca, aby ułatwić utrzymanie listy w porządku.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**.
Node musi ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub
be zgłowy host Node). Jeśli Node nie ogłasza jeszcze zatwierdzeń exec,
edytuj bezpośrednio jego lokalny plik `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję Gateway lub Node - zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, Gateway rozgłasza
`exec.approval.requested` do klientów operatora. Control UI i aplikacja macOS
rozwiązują go przez `exec.approval.resolve`, a następnie Gateway przekazuje
zatwierdzone żądanie do hosta Node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek
`systemRunPlan`. Gateway używa tego planu jako autorytatywnego
kontekstu polecenia/cwd/sesji podczas przekazywania zatwierdzonych żądań
`system.run`.

Ma to znaczenie dla opóźnienia zatwierdzania asynchronicznego:

- Ścieżka exec Node przygotowuje jeden kanoniczny plan z góry.
- Rekord zatwierdzenia przechowuje ten plan i jego metadane wiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` używa ponownie zapisanego planu zamiast ufać późniejszym edycjom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` po utworzeniu żądania zatwierdzenia, Gateway odrzuci przekazane uruchomienie jako niezgodność zatwierdzenia.

## Zdarzenia systemowe

Cykl życia exec jest widoczny jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o działaniu).
- `Exec finished`.
- `Exec denied`.

Są one publikowane w sesji agenta po tym, jak Node zgłosi zdarzenie.
Zatwierdzenia exec hostowane przez Gateway emitują te same zdarzenia cyklu życia po
zakończeniu polecenia (oraz opcjonalnie, gdy działa dłużej niż próg).
Exec wymagające zatwierdzenia używają ponownie identyfikatora zatwierdzenia jako `runId` w tych
komunikatach, aby ułatwić korelację.

## Zachowanie po odmowie zatwierdzenia

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi
ponowne użycie wyjścia z dowolnego wcześniejszego uruchomienia tego samego polecenia w sesji.
Powód odmowy jest przekazywany z jednoznaczną wskazówką, że wyjście polecenia
nie jest dostępne, co powstrzymuje agenta przed twierdzeniem, że istnieje nowe wyjście, lub
powtarzaniem odrzuconego polecenia ze starymi wynikami z wcześniejszego udanego
uruchomienia.

## Implikacje

- **`full`** jest potężne; preferuj listy dozwolonych, gdy to możliwe.
- **`ask`** utrzymuje cię w pętli, nadal umożliwiając szybkie zatwierdzenia.
- Listy dozwolonych dla poszczególnych agentów zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia mają zastosowanie tylko do żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wywoływać `/exec`.
- `/exec security=full` to wygoda na poziomie sesji dla autoryzowanych operatorów i celowo pomija zatwierdzenia. Aby twardo zablokować exec hosta, ustaw bezpieczeństwo zatwierdzeń na `deny` lub odmów narzędzia `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia Exec - zaawansowane" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne binaria, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie Exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która także pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby piaskownicy i dostęp do przestrzeni roboczej.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Piaskownica kontra polityka narzędzi kontra tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgnąć po każdą z kontrolek.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania wspierane przez Skills.
  </Card>
</CardGroup>
