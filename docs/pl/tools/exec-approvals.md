---
read_when:
    - Konfigurowanie zatwierdzeń exec lub list dozwolonych
    - Implementacja UX zatwierdzania exec w aplikacji macOS
    - Analiza promptów ucieczki z piaskownicy i ich implikacji
sidebarTitle: Exec approvals
summary: 'Zatwierdzanie wykonywania na hoście: opcje polityki, listy dozwolonych elementów i przepływ pracy YOLO/strict'
title: Zatwierdzenia wykonywania poleceń
x-i18n:
    generated_at: "2026-04-30T10:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Zatwierdzenia wykonywania poleceń są **zabezpieczeniem aplikacji towarzyszącej / hosta Node**, które pozwala agentowi w piaskownicy uruchamiać polecenia na rzeczywistym hoście (`gateway` lub `node`). To blokada bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + lista dozwolonych + (opcjonalne) zatwierdzenie użytkownika są zgodne. Zatwierdzenia wykonywania poleceń są nakładane **dodatkowo na** politykę narzędzi i bramkowanie podniesionych uprawnień (chyba że podniesione uprawnienia są ustawione na `full`, co pomija zatwierdzenia).

<Note>
Efektywna polityka jest **bardziej restrykcyjna** spośród wartości domyślnych `tools.exec.*` i zatwierdzeń; jeśli pole zatwierdzeń zostanie pominięte, używana jest wartość `tools.exec`. Wykonywanie poleceń na hoście używa także lokalnego stanu zatwierdzeń na tej maszynie — lokalne dla hosta `ask: "always"` w `~/.openclaw/exec-approvals.json` nadal wyświetla monity, nawet jeśli ustawienia domyślne sesji lub konfiguracji żądają `ask: "on-miss"`.
</Note>

## Sprawdzanie efektywnej polityki

| Polecenie                                                        | Co pokazuje                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Żądaną politykę, źródła polityki hosta i efektywny wynik.                              |
| `openclaw exec-policy show`                                      | Scalony widok maszyny lokalnej.                                                        |
| `openclaw exec-policy set` / `preset`                            | Synchronizuje lokalną żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku. |

Gdy zakres lokalny żąda `host=node`, `exec-policy show` zgłasza ten zakres jako zarządzany przez Node w czasie działania, zamiast udawać, że lokalny plik zatwierdzeń jest źródłem prawdy.

Jeśli interfejs aplikacji towarzyszącej jest **niedostępny**, każde żądanie, które normalnie wyświetliłoby monit, jest rozstrzygane przez **wartość awaryjną ask** (domyślnie: `deny`).

<Tip>
Natywni klienci zatwierdzeń czatu mogą wstępnie ustawiać udogodnienia specyficzne dla kanału w oczekującej wiadomości zatwierdzenia. Na przykład Matrix ustawia skróty reakcji (`✅` pozwól raz, `❌` odmów, `♾️` zawsze pozwalaj), nadal pozostawiając polecenia `/approve ...` w wiadomości jako rozwiązanie awaryjne.
</Tip>

## Gdzie ma zastosowanie

Zatwierdzenia wykonywania poleceń są egzekwowane lokalnie na hoście wykonawczym:

- **Host Gateway** → proces `openclaw` na maszynie Gateway.
- **Host Node** → runner Node (aplikacja towarzysząca macOS lub bezgłowy host Node).

### Model zaufania

- Wywołujący uwierzytelnieni przez Gateway są zaufanymi operatorami dla tego Gateway.
- Sparowane węzły rozszerzają tę zdolność zaufanego operatora na host Node.
- Zatwierdzenia wykonywania poleceń zmniejszają ryzyko przypadkowego wykonania, ale **nie** są granicą uwierzytelniania na użytkownika.
- Zatwierdzone uruchomienia na hoście Node wiążą kanoniczny kontekst wykonania: kanoniczny cwd, dokładne argv, powiązanie env, gdy jest obecne, oraz przypiętą ścieżkę pliku wykonywalnego, gdy ma to zastosowanie.
- W przypadku skryptów powłoki i bezpośrednich wywołań plików interpretera/środowiska uruchomieniowego OpenClaw próbuje też powiązać jeden konkretny lokalny operand pliku. Jeśli powiązany plik zmieni się po zatwierdzeniu, ale przed wykonaniem, uruchomienie zostanie odrzucone zamiast wykonania zmienionej treści.
- Wiązanie plików jest celowo najlepszym możliwym przybliżeniem, **nie** kompletnym modelem semantycznym każdej ścieżki ładowania interpretera/środowiska uruchomieniowego. Jeśli tryb zatwierdzania nie może dokładnie wskazać jednego konkretnego pliku lokalnego do powiązania, odmawia wystawienia uruchomienia opartego na zatwierdzeniu, zamiast udawać pełne pokrycie.

### Podział macOS

- **Usługa hosta Node** przekazuje `system.run` do **aplikacji macOS** przez lokalny IPC.
- **Aplikacja macOS** egzekwuje zatwierdzenia i wykonuje polecenie w kontekście interfejsu użytkownika.

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
  - `deny` — blokuj wszystkie żądania wykonywania poleceń na hoście.
  - `allowlist` — zezwalaj tylko na polecenia z listy dozwolonych.
  - `full` — zezwalaj na wszystko (odpowiednik podniesionych uprawnień).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nigdy nie wyświetlaj monitu.
  - `on-miss` — wyświetlaj monit tylko wtedy, gdy lista dozwolonych nie pasuje.
  - `always` — wyświetlaj monit przy każdym poleceniu. Trwałe zaufanie `allow-always` **nie** wyłącza monitów, gdy efektywny tryb ask to `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Rozstrzygnięcie, gdy monit jest wymagany, ale interfejs użytkownika jest nieosiągalny.

- `deny` — blokuj.
- `allowlist` — zezwalaj tylko wtedy, gdy lista dozwolonych pasuje.
- `full` — zezwalaj.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Gdy `true`, OpenClaw traktuje formularze inline code-eval jako wymagające wyłącznie zatwierdzenia, nawet jeśli sam plik binarny interpretera znajduje się na liście dozwolonych. To obrona warstwowa dla loaderów interpreterów, które nie odwzorowują się czysto na jeden stabilny operand pliku.
</ParamField>

Przykłady wykrywane przez tryb ścisły:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

W trybie ścisłym te polecenia nadal wymagają jawnego zatwierdzenia, a `allow-always` nie utrwala dla nich automatycznie nowych wpisów listy dozwolonych.

## Tryb YOLO (bez zatwierdzania)

Jeśli chcesz, aby wykonywanie poleceń na hoście działało bez monitów o zatwierdzenie, musisz otworzyć **obie** warstwy polityki — żądaną politykę exec w konfiguracji OpenClaw (`tools.exec.*`) **oraz** lokalną dla hosta politykę zatwierdzeń w `~/.openclaw/exec-approvals.json`.

YOLO jest domyślnym zachowaniem hosta, chyba że jawnie je zaostrzysz:

| Warstwa               | Ustawienie YOLO            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` na `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Ważne rozróżnienia:**

- `tools.exec.host=auto` wybiera, **gdzie** działa exec: w piaskownicy, gdy jest dostępna, w przeciwnym razie na Gateway.
- YOLO wybiera, **jak** zatwierdzane jest wykonywanie poleceń na hoście: `security=full` plus `ask=off`.
- W trybie YOLO OpenClaw **nie** dodaje osobnej heurystycznej bramki zatwierdzania zaciemniania poleceń ani warstwy odrzucania preflight skryptów ponad skonfigurowaną politykę wykonywania poleceń na hoście.
- `auto` nie sprawia, że routing przez Gateway staje się wolnym obejściem z sesji w piaskownicy. Żądanie per wywołanie `host=node` jest dozwolone z `auto`; `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywne środowisko uruchomieniowe piaskownicy. Aby uzyskać stabilną wartość domyślną inną niż auto, ustaw `tools.exec.host` albo użyj jawnie `/exec host=...`.

</Warning>

Dostawcy oparci na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień, mogą przestrzegać tej polityki. Claude CLI dodaje `--permission-mode bypassPermissions`, gdy żądana polityka exec OpenClaw to YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude w `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` — na przykład `--permission-mode default`, `acceptEdits` albo `bypassPermissions`.

Jeśli chcesz bardziej konserwatywnej konfiguracji, zaostrz dowolną warstwę z powrotem do `allowlist` / `on-miss` albo `deny`.

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

### Skrót lokalny

```bash
openclaw exec-policy preset yolo
```

Ten skrót lokalny aktualizuje oba elementy:

- Lokalne `tools.exec.host/security/ask`.
- Lokalne wartości domyślne `~/.openclaw/exec-approvals.json`.

Jest celowo wyłącznie lokalny. Aby zmienić zatwierdzenia hosta Gateway lub hosta Node zdalnie, użyj `openclaw approvals set --gateway` albo `openclaw approvals set --node <id|name|ip>`.

### Host Node

W przypadku hosta Node zastosuj zamiast tego ten sam plik zatwierdzeń na tym węźle:

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

- `openclaw exec-policy` nie synchronizuje zatwierdzeń Node.
- `openclaw exec-policy set --host node` jest odrzucane.
- Zatwierdzenia wykonywania poleceń Node są pobierane z węzła w czasie działania, więc aktualizacje ukierunkowane na Node muszą używać `openclaw approvals --node ...`.

</Note>

### Skrót tylko dla sesji

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to awaryjny skrót, który także pomija zatwierdzenia wykonywania poleceń dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej restrykcyjny niż konfiguracja, bardziej restrykcyjna polityka hosta nadal wygrywa.

## Lista dozwolonych (na agenta)

Listy dozwolonych są **na agenta**. Jeśli istnieje wiele agentów, przełącz w aplikacji macOS, którego agenta edytujesz. Wzorce są dopasowaniami glob.

Wzorce mogą być globami rozstrzygniętych ścieżek binarnych albo globami samych nazw poleceń. Same nazwy pasują tylko do poleceń wywołanych przez `PATH`, więc `rg` może pasować do `/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale **nie** do `./rg` ani `/tmp/rg`. Użyj globu ścieżki, gdy chcesz zaufać jednej konkretnej lokalizacji pliku binarnego.

Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania. Łańcuchy powłoki, takie jak `echo ok && pwd`, nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły listy dozwolonych.

Przykłady:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis listy dozwolonych śledzi:

| Pole               | Znaczenie                                  |
| ------------------ | ------------------------------------------ |
| `id`               | Stabilny UUID używany dla tożsamości w UI  |
| `lastUsedAt`       | Znacznik czasu ostatniego użycia           |
| `lastUsedCommand`  | Ostatnie polecenie, które pasowało         |
| `lastResolvedPath` | Ostatnia rozstrzygnięta ścieżka binarna    |

## Automatyczne zezwalanie na CLI Skills

Gdy włączone jest **automatyczne zezwalanie na CLI Skills**, pliki wykonywalne wskazywane przez znane Skills są traktowane jako znajdujące się na liście dozwolonych na węzłach (Node macOS lub bezgłowy host Node). Używa to `skills.bins` przez RPC Gateway do pobrania listy bin Skills. Wyłącz to, jeśli chcesz rygorystycznych ręcznych list dozwolonych.

<Warning>
- To jest **niejawna wygodna lista dozwolonych**, oddzielna od ręcznych wpisów listy dozwolonych ścieżek.
- Jest przeznaczona dla środowisk zaufanych operatorów, w których Gateway i Node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ścisłego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów listy dozwolonych ścieżek.

</Warning>

## Bezpieczne bin i przekazywanie zatwierdzeń

Informacje o bezpiecznych bin (szybka ścieżka tylko przez stdin), szczegółach wiązania interpreterów oraz o przekazywaniu monitów zatwierdzeń do Slack/Discord/Telegram (albo uruchamianiu ich jako natywnych klientów zatwierdzeń) znajdziesz w
[Zatwierdzenia wykonywania poleceń — zaawansowane](/pl/tools/exec-approvals-advanced).

## Edycja w UI sterowania

Użyj karty **UI sterowania → Węzły → Zatwierdzenia wykonywania poleceń**, aby edytować wartości domyślne, nadpisania per agent i listy dozwolonych. Wybierz zakres (wartości domyślne lub agenta), dostosuj politykę, dodaj/usuń wzorce listy dozwolonych, a następnie kliknij **Zapisz**. UI pokazuje metadane ostatniego użycia per wzorzec, aby ułatwić utrzymanie porządku na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**.
Nodes muszą ogłaszać `system.execApprovals.get/set` (aplikacja macOS albo
bezgłowy host Node). Jeśli Node nie ogłasza jeszcze zatwierdzeń exec,
edytuj bezpośrednio jego lokalny plik `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję Gateway lub Node — zobacz
[CLI zatwierdzeń](/pl/cli/approvals).

## Przepływ zatwierdzania

Gdy wymagany jest monit, Gateway rozgłasza
`exec.approval.requested` do klientów operatora. Interfejs Control UI i aplikacja macOS
rozwiązują go przez `exec.approval.resolve`, a następnie Gateway przekazuje
zatwierdzone żądanie do hosta Node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek
`systemRunPlan`. Gateway używa tego planu jako autorytatywnego
kontekstu polecenia/cwd/sesji podczas przekazywania zatwierdzonych żądań
`system.run`.

Ma to znaczenie dla opóźnień zatwierdzania asynchronicznego:

- Ścieżka exec Node przygotowuje z góry jeden kanoniczny plan.
- Rekord zatwierdzenia przechowuje ten plan i metadane jego powiązania.
- Po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa zapisanego planu zamiast ufać późniejszym zmianom wywołującego.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub `sessionKey` po utworzeniu żądania zatwierdzenia, Gateway odrzuca przekazane uruchomienie jako niezgodność zatwierdzenia.

## Zdarzenia systemowe

Cykl życia exec jest prezentowany jako komunikaty systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o działaniu).
- `Exec finished`.
- `Exec denied`.

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez Node.
Zatwierdzenia exec hostowane przez Gateway emitują te same zdarzenia cyklu życia, gdy
polecenie się zakończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Exec wymagające zatwierdzenia ponownie używają identyfikatora zatwierdzenia jako `runId` w tych
komunikatach, aby ułatwić korelację.

## Zachowanie po odmowie zatwierdzenia

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi
ponowne użycie wyniku dowolnego wcześniejszego uruchomienia tego samego polecenia w sesji.
Powód odmowy jest przekazywany z jednoznaczną wskazówką, że żaden wynik polecenia
nie jest dostępny, co powstrzymuje agenta przed twierdzeniem, że pojawił się nowy wynik, albo
przed powtarzaniem odrzuconego polecenia z nieaktualnymi rezultatami z wcześniejszego udanego
uruchomienia.

## Implikacje

- **`full`** jest potężne; gdy to możliwe, preferuj listy dozwolonych elementów.
- **`ask`** utrzymuje Cię w pętli decyzyjnej, nadal umożliwiając szybkie zatwierdzanie.
- Listy dozwolone per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia dotyczą tylko żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygoda na poziomie sesji dla autoryzowanych operatorów i z założenia pomija zatwierdzenia. Aby twardo zablokować exec hosta, ustaw zabezpieczenia zatwierdzeń na `deny` albo odmów narzędziu `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia exec — zaawansowane" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Bezpieczne katalogi binarne, wiązanie interpretera i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń powłoki.
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka awaryjna, która także pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby sandboxa i dostęp do obszaru roboczego.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Sandbox kontra polityka narzędzi kontra tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgać po każdy mechanizm kontroli.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie automatycznego zezwalania wspierane przez Skills.
  </Card>
</CardGroup>
