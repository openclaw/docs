---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych poleceń
    - Wdrażanie UX zatwierdzania exec w aplikacji macOS
    - Przeglądanie promptów ucieczki z sandboxa i ich konsekwencji
sidebarTitle: Exec approvals
summary: 'Zatwierdzenia host exec: ustawienia zasad, listy dozwolonych poleceń i przepływ pracy YOLO/strict'
title: Zatwierdzenia exec
x-i18n:
    generated_at: "2026-04-26T11:42:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Zatwierdzenia exec to **zabezpieczenie aplikacji towarzyszącej / hosta node** umożliwiające
agentowi działającemu w sandboxie uruchamianie poleceń na rzeczywistym hoście (`gateway` lub `node`). To
blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy zgadzają się
zasada + lista dozwolonych poleceń + (opcjonalnie) zatwierdzenie użytkownika. Zatwierdzenia exec nakładają się **ponad**
zasady narzędzi i bramkowanie elevated (chyba że elevated ustawiono na `full`, co
pomija zatwierdzenia).

<Note>
Efektywna zasada jest **bardziej rygorystyczną** z `tools.exec.*` i domyślnych ustawień
zatwierdzeń; jeśli pole zatwierdzeń jest pominięte, używana jest wartość z
`tools.exec`. Host exec używa także lokalnego stanu zatwierdzeń na tej maszynie —
lokalne dla hosta `ask: "always"` w `~/.openclaw/exec-approvals.json` będzie nadal
wyświetlać prompt, nawet jeśli domyślne ustawienia sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej zasady

| Polecenie                                                        | Co pokazuje                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądaną zasadę, źródła zasad hosta i wynik efektywny.                                  |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                       |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalną żądaną zasadę z lokalnym plikiem zatwierdzeń hosta w jednym kroku. |

Gdy lokalny zakres żąda `host=node`, `exec-policy show` raportuje ten
zakres jako zarządzany przez node w czasie działania, zamiast udawać, że lokalny
plik zatwierdzeń jest źródłem prawdy.

Jeśli UI aplikacji towarzyszącej jest **niedostępne**, każde żądanie, które normalnie
wyświetliłoby prompt, jest rozstrzygane przez **rezerwę ask** (domyślnie: `deny`).

<Tip>
Natywni klienci zatwierdzeń w czacie mogą zasilać wiadomość oczekującego zatwierdzenia
udogodnieniami specyficznymi dla kanału. Na przykład Matrix dodaje skróty reakcji
(`✅` zezwól raz, `❌` odmów, `♾️` zezwól zawsze), nadal pozostawiając
polecenia `/approve ...` w wiadomości jako rozwiązanie awaryjne.
</Tip>

## Gdzie ma to zastosowanie

Zatwierdzenia exec są wymuszane lokalnie na hoście wykonawczym:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host Node** → runner node (aplikacja towarzysząca macOS lub bezgłowy host node).

### Model zaufania

- Wywołujący uwierzytelnieni w Gateway są zaufanymi operatorami dla tego Gateway.
- Sparowane node’y rozszerzają tę zdolność zaufanego operatora na host node.
- Zatwierdzenia exec zmniejszają ryzyko przypadkowego wykonania, ale **nie** są granicą uwierzytelniania per użytkownik.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczny cwd, dokładne argv, powiązanie env, gdy występuje, oraz przypiętą ścieżkę wykonywalną, gdy ma to zastosowanie.
- Dla skryptów powłoki i bezpośrednich wywołań plików interpretera/środowiska wykonawczego OpenClaw próbuje też powiązać jeden konkretny lokalny operand pliku. Jeśli ten powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonywać zmienioną treść.
- Powiązanie pliku jest celowo best-effort, **nie** stanowi pełnego modelu semantycznego każdej ścieżki ładowania interpretera/środowiska wykonawczego. Jeśli tryb zatwierdzania nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego pliku do powiązania, odmawia utworzenia uruchomienia opartego na zatwierdzeniu zamiast udawać pełne pokrycie.

### Podział macOS

- **Usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **Aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście UI.

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Ustawienia zasad

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — blokuje wszystkie żądania host exec.
  - `allowlist` — zezwala tylko na polecenia z listy dozwolonych.
  - `full` — zezwala na wszystko (odpowiednik elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nigdy nie wyświetla promptu.
  - `on-miss` — wyświetla prompt tylko wtedy, gdy lista dozwolonych nie pasuje.
  - `always` — wyświetla prompt przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** wyłącza promptów, gdy efektywny tryb ask to `always`.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Rozstrzygnięcie, gdy prompt jest wymagany, ale nie można dotrzeć do UI.

- `deny` — blokuje.
- `allowlist` — zezwala tylko wtedy, gdy pasuje lista dozwolonych.
- `full` — zezwala.
</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy ma wartość `true`, OpenClaw traktuje formy inline code-eval jako wymagające wyłącznie zatwierdzenia,
  nawet jeśli sama binarka interpretera znajduje się na liście dozwolonych. To obrona warstwowa
  dla loaderów interpreterów, które nie mapują się czysto na jeden stabilny
  operand pliku.
</ParamField>

Przykłady wykrywane przez tryb strict:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie strict te polecenia nadal wymagają jawnego zatwierdzenia, a
`allow-always` nie utrwala dla nich automatycznie nowych wpisów listy dozwolonych.

## Tryb YOLO (bez zatwierdzeń)

Jeśli chcesz, aby host exec działał bez promptów zatwierdzeń, musisz otworzyć
**obie** warstwy zasad — żądaną zasadę exec w konfiguracji OpenClaw
(`tools.exec.*`) **i** lokalną dla hosta zasadę zatwierdzeń w
`~/.openclaw/exec-approvals.json`.

YOLO jest domyślnym zachowaniem hosta, chyba że jawnie je zaostrzysz:

| Warstwa              | Ustawienie YOLO            |
| -------------------- | -------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera **gdzie** działa exec: w sandboxie, jeśli jest dostępny, w przeciwnym razie na gateway.
- YOLO wybiera **jak** host exec jest zatwierdzany: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzenia dla zaciemniania poleceń ani warstwy odrzucania skryptów przed uruchomieniem ponad skonfigurowaną zasadę host exec.
- `auto` nie czyni routingu do gateway darmowym nadpisaniem z sesji działającej w sandboxie. Żądanie per wywołanie `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywne środowisko wykonawcze sandbox. Aby uzyskać stabilne domyślne ustawienie inne niż auto, ustaw `tools.exec.host` lub użyj jawnie `/exec host=...`.
</Warning>

Dostawcy oparci na CLI, którzy udostępniają własny tryb nieinteraktywnych uprawnień,
mogą podążać za tą zasadą. Claude CLI dodaje
`--permission-mode bypassPermissions`, gdy żądana przez OpenClaw zasada exec
to YOLO. Zastąp to zachowanie backendu jawnymi argumentami Claude
w `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
na przykład `--permission-mode default`, `acceptEdits` lub
`bypassPermissions`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz którąkolwiek warstwę z powrotem do
`allowlist` / `on-miss` albo `deny`.

### Trwała konfiguracja hosta Gateway „nigdy nie wyświetlaj promptu”

<Steps>
  <Step title="Ustaw żądaną zasadę konfiguracji">
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

### Skrót lokalny

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje jednocześnie:

- Lokalne `tools.exec.host/security/ask`.
- Domyślne lokalne `~/.openclaw/exec-approvals.json`.

Jest on celowo tylko lokalny. Aby zdalnie zmienić zatwierdzenia hosta gateway lub hosta node,
użyj `openclaw approvals set --gateway` lub
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Dla hosta node zastosuj ten sam plik zatwierdzeń na tym node:

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
- Zatwierdzenia exec node są pobierane z node w czasie działania, więc aktualizacje kierowane do node muszą używać `openclaw approvals --node ...`.
</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót break-glass, który także pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej rygorystyczny niż konfiguracja, nadal wygrywa
bardziej rygorystyczna zasada hosta.

## Lista dozwolonych poleceń (per agent)

Listy dozwolonych poleceń są **per agent**. Jeśli istnieje wielu agentów, przełącz,
którego agenta edytujesz w aplikacji macOS. Wzorce są dopasowaniami glob.

Wzorce mogą być globami rozstrzygniętej ścieżki binarki albo globami samych nazw poleceń.
Same nazwy pasują tylko do poleceń wywoływanych przez `PATH`, więc `rg` może pasować do
`/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale **nie** do `./rg` ani
`/tmp/rg`. Użyj globu ścieżki, gdy chcesz zaufać jednej konkretnej lokalizacji
binarki.

Starsze wpisy `agents.default` są podczas ładowania migrowane do `agents.main`.
Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu
spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis listy dozwolonych śledzi:

| Pole               | Znaczenie                           |
| ------------------ | ----------------------------------- |
| `id`               | Stabilny UUID używany jako tożsamość UI |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia    |
| `lastUsedCommand`  | Ostatnie polecenie, które pasowało  |
| `lastResolvedPath` | Ostatnia rozstrzygnięta ścieżka binarki |

## Automatyczne zezwalanie na CLI Skills

Gdy włączona jest opcja **Automatycznie zezwalaj na CLI Skills**, pliki wykonywalne wskazywane przez
znane Skills są traktowane jako znajdujące się na liście dozwolonych na node’ach (macOS node lub bezgłowy
host node). Wykorzystuje to `skills.bins` przez RPC Gateway do pobrania listy binarek
Skills. Wyłącz to, jeśli chcesz ściśle ręcznych list dozwolonych.

<Warning>
- To **domyślna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla środowisk zaufanych operatorów, w których Gateway i node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ściśle jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.
</Warning>

## Safe bins i przekazywanie zatwierdzeń

Informacje o safe bins (szybkiej ścieżce tylko ze stdin), szczegółach wiązania interpreterów oraz
o tym, jak przekazywać prompty zatwierdzeń do Slack/Discord/Telegram (lub uruchamiać je jako
natywnych klientów zatwierdzeń), znajdziesz w
[Zatwierdzenia exec — zaawansowane](/pl/tools/exec-approvals-advanced).

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować wartości domyślne,
nadpisania per agent i listy dozwolonych poleceń. Wybierz zakres (Defaults lub agent),
dostosuj zasadę, dodaj/usuń wzorce listy dozwolonych poleceń, a następnie kliknij **Save**. UI
pokazuje metadane ostatniego użycia dla każdego wzorca, aby ułatwić utrzymanie porządku na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**.
Node’y muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS lub
bezgłowy host node). Jeśli node nie ogłasza jeszcze zatwierdzeń exec,
edytuj jego lokalny plik `~/.openclaw/exec-approvals.json` bezpośrednio.

CLI: `openclaw approvals` obsługuje edycję gateway lub node — zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzeń

Gdy wymagany jest prompt, gateway rozsyła
`exec.approval.requested` do klientów operatorów. Control UI i aplikacja macOS
rozwiązują to przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek
`systemRunPlan`. Gateway używa tego planu jako autorytatywnego
kontekstu polecenia/cwd/sesji podczas przekazywania zatwierdzonych żądań
`system.run`.

Ma to znaczenie przy opóźnieniach asynchronicznego zatwierdzania:

- Ścieżka exec node przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i jego metadane powiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu, zamiast ufać późniejszym zmianom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuci przekazane uruchomienie jako niedopasowanie zatwierdzenia.

## Zdarzenia systemowe

Cykl życia exec jest ujawniany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg komunikatu o uruchomieniu).
- `Exec finished`.
- `Exec denied`.

Są one publikowane do sesji agenta po zgłoszeniu zdarzenia przez node.
Zatwierdzenia exec na hoście Gateway emitują te same zdarzenia cyklu życia, gdy
polecenie się zakończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Execi objęte zatwierdzeniami używają ponownie identyfikatora zatwierdzenia jako `runId` w tych
wiadomościach, aby ułatwić korelację.

## Zachowanie przy odrzuconym zatwierdzeniu

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi
ponowne użycie danych wyjściowych z wcześniejszego uruchomienia tego samego polecenia w sesji.
Powód odrzucenia jest przekazywany wraz z jawną informacją, że żadne dane wyjściowe polecenia
nie są dostępne, co powstrzymuje agenta przed twierdzeniem, że istnieją nowe dane wyjściowe, lub
przed powtarzaniem odrzuconego polecenia ze starymi wynikami z wcześniejszego udanego
uruchomienia.

## Konsekwencje

- **`full`** jest potężne; jeśli to możliwe, preferuj listy dozwolonych poleceń.
- **`ask`** utrzymuje Cię w pętli, jednocześnie pozwalając na szybkie zatwierdzenia.
- Listy dozwolonych poleceń per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia mają zastosowanie tylko do żądań host exec od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygodne ustawienie na poziomie sesji dla autoryzowanych operatorów i zgodnie z projektem pomija zatwierdzenia. Aby twardo zablokować host exec, ustaw zatwierdzenia security na `deny` lub zabroń narzędzia `exec` przez zasadę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia exec — zaawansowane" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Safe bins, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb elevated" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka break-glass, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby sandboxa i dostęp do obszaru roboczego.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Sandbox a zasada narzędzi a elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgnąć po każdą z tych kontrolek.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania oparte na Skills.
  </Card>
</CardGroup>
