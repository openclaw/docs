---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie exec
x-i18n:
    generated_at: "2026-05-10T19:56:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

Uruchamiaj polecenia powłoki w obszarze roboczym. `exec` to mutująca powierzchnia powłoki: polecenia mogą tworzyć, edytować lub usuwać pliki wszędzie tam, gdzie pozwala na to wybrany host albo system plików piaskownicy. Wyłączenie narzędzi systemu plików OpenClaw, takich jak `write`, `edit` lub `apply_patch`, nie sprawia, że `exec` działa tylko do odczytu.

Obsługuje wykonywanie na pierwszym planie i w tle przez `process`. Jeśli `process` jest niedozwolony, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje działające w tle są ograniczone do danego agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska w postaci klucz/wartość scalane z dziedziczonym środowiskiem.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenieś polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Natychmiast przenieś polecenie do tła zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisz skonfigurowany limit czasu exec dla tego wywołania. Ustaw `timeout: 0` tylko wtedy, gdy polecenie powinno działać bez limitu czasu procesu exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchom w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i terminalowych interfejsów użytkownika.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Miejsce wykonania. `auto` rozwiązuje się do `sandbox`, gdy aktywne jest środowisko uruchomieniowe piaskownicy, a w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Tryb egzekwowania dla wykonania przez `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie monitu o zatwierdzenie dla wykonania przez `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Zażądaj trybu podwyższonego — wyjdź z piaskownicy na skonfigurowaną ścieżkę hosta. `security=full` jest wymuszane tylko wtedy, gdy tryb podwyższony rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: piaskownica, gdy dla sesji aktywne jest środowisko uruchomieniowe piaskownicy, w przeciwnym razie Gateway.
- `host` akceptuje tylko `auto`, `sandbox`, `gateway` albo `node`. Nie jest selektorem nazwy hosta; wartości przypominające nazwę hosta są odrzucane przed uruchomieniem polecenia.
- `auto` to domyślna strategia routingu, nie wieloznacznik. `host=node` dla pojedynczego wywołania jest dozwolone z `auto`; `host=gateway` dla pojedynczego wywołania jest dozwolone tylko wtedy, gdy nie jest aktywne środowisko uruchomieniowe piaskownicy.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak piaskownicy oznacza rozwiązanie do `gateway`; aktywna piaskownica oznacza pozostanie w piaskownicy.
- `elevated` wychodzi z piaskownicy na skonfigurowaną ścieżkę hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślna wartość sesji to `host=node`). Jest dostępne tylko wtedy, gdy dostęp podwyższony jest włączony dla bieżącej sesji/providera.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej albo bezgłowego hosta Node).
- Jeśli dostępnych jest kilka Node, ustaw `exec.node` albo `tools.exec.node`, aby wybrać jeden.
- `exec host=node` jest jedyną ścieżką wykonywania poleceń powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- `timeout` dotyczy wykonywania na pierwszym planie, w tle, `yieldMs`, Gateway, piaskownicy oraz `system.run` na Node. Jeśli zostanie pominięty, OpenClaw używa `tools.exec.timeoutSec`; jawne `timeout: 0` wyłącza limit czasu procesu exec dla tego wywołania.
- Na hostach innych niż Windows exec używa `SHELL`, gdy jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (albo `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a następnie wraca do `SHELL`, jeśli żadne z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, a następnie PATH),
  a potem wraca do Windows PowerShell 5.1.
- Wykonanie na hoście (`gateway`/`node`) odrzuca `env.PATH` oraz nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przechwyceniu binariów lub wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym przy wykonaniu PTY i w piaskownicy), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- `openclaw channels login` jest blokowane z `exec`, ponieważ jest to interaktywny przepływ uwierzytelniania kanału; uruchom je w terminalu na hoście Gateway albo użyj natywnego dla kanału narzędzia logowania z czatu, jeśli istnieje.
- Ważne: piaskownica jest **domyślnie wyłączona**. Jeśli piaskownica jest wyłączona, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się zamkniętą porażką zamiast po cichu
  uruchamiać polecenie na hoście Gateway. Włącz piaskownicę albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole wstępne skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, kontrola wstępna jest pomijana dla
  tego pliku.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje dane wyjściowe albo kończy się niepowodzeniem.
  Używaj `process` do logów, statusu, danych wejściowych albo interwencji; nie emuluj
  harmonogramowania pętlami sleep, pętlami timeout ani powtarzanym odpytywaniem.
- W przypadku pracy, która ma nastąpić później albo zgodnie z harmonogramem, użyj Cron zamiast
  wzorców sleep/opóźnienia z `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione do tła dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy wyjściu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „running”, gdy exec wymagający zatwierdzenia działa dłużej niż ta wartość (0 wyłącza).
- `tools.exec.timeoutSec` (domyślnie: 1800): domyślny limit czasu exec na polecenie w sekundach. `timeout` dla pojedynczego wywołania go nadpisuje; `timeout: 0` dla pojedynczego wywołania wyłącza limit czasu procesu exec.
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy środowisko uruchomieniowe piaskownicy jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla piaskownicy, `full` dla Gateway + Node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Exec na hoście bez zatwierdzenia jest domyślne dla Gateway + Node. Jeśli chcesz zachowanie zatwierdzeń/listy dozwolonych, zaostrz zarówno `tools.exec.*`, jak i hostowe `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO wynika z domyślnych zasad hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing przez Gateway albo Node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` exec na hoście bezpośrednio stosuje skonfigurowane zasady; nie ma dodatkowego heurystycznego prefiltra zaciemniania poleceń ani warstwy odrzucania przez kontrolę wstępną skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formy inline eval interpreterów, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalać łagodne wywołania interpreterów/skryptów, ale formy inline eval nadal wyświetlają monit za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początku `PATH` dla uruchomień exec (tylko Gateway + piaskownica).
- `tools.exec.safeBins`: bezpieczne binaria wyłącznie stdin, które mogą działać bez jawnych wpisów listy dozwolonych. Szczegóły zachowania znajdziesz w [Bezpiecznych binariach](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalne niestandardowe zasady argv dla każdego bezpiecznego binarium (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Przykład:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Obsługa PATH

- `host=gateway`: scala `PATH` z Twojej powłoki logowania ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, więc `/etc/profile` może resetować `PATH`.
  OpenClaw dodaje `env.PATH` na początku po wczytaniu profilu przez wewnętrzną zmienną środowiskową (bez interpolacji powłoki);
  `tools.exec.pathPrepend` ma tu również zastosowanie.
- `host=node`: do Node wysyłane są tylko nieblokowane nadpisania środowiska, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node dla agenta (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interfejs sterowania: karta Nodes zawiera mały panel „Powiązanie Node dla exec” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić **sesyjne** wartości domyślne dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby pokazać bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (listy dozwolonych/parowanie kanału plus `commands.useAccessGroups`).
Aktualizuje **wyłącznie stan sesji** i nie zapisuje konfiguracji. Aby trwale wyłączyć exec, odmów go przez zasady narzędzi
(`tools.deny: ["exec"]` albo dla konkretnego agenta). Zatwierdzenia hosta nadal obowiązują, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host Node)

Agenci w piaskownicy mogą wymagać zatwierdzenia dla każdego żądania, zanim `exec` uruchomi się na hoście Gateway albo Node.
Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać zasady, listę dozwolonych i przepływ interfejsu użytkownika.

Gdy wymagane są zatwierdzenia, narzędzie exec zwraca natychmiast
`status: "approval-pending"` i identyfikator zatwierdzenia. Po zatwierdzeniu (albo odmowie / przekroczeniu limitu czasu)
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
W kanałach z natywnymi kartami/przyciskami zatwierdzeń agent powinien najpierw polegać na tym
natywnym interfejsie i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia
wyraźnie mówi, że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Lista dozwolonych + bezpieczne binaria

Ręczne egzekwowanie listy dozwolonych dopasowuje globy rozwiązanych ścieżek binariów oraz globy samych nazw poleceń. Same nazwy dopasowują tylko polecenia wywołane przez PATH, więc `rg` może dopasować
`/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale nie `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku
jest na liście dozwolonych albo jest bezpiecznym binarium. Łączenie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie listy dozwolonych, chyba że każdy segment najwyższego poziomu spełnia
listę dozwolonych (w tym bezpieczne binaria). Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łączone nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna wygodna ścieżka w zatwierdzeniach exec. Nie jest tym samym co
ręczne wpisy listy dozwolonych ścieżek. Aby uzyskać ścisłe jawne zaufanie, pozostaw `autoAllowSkills` wyłączone.

Używaj tych dwóch kontrolek do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe wyłącznie stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych bezpiecznych binariów.
- `tools.exec.safeBinProfiles`: jawna zasada argv dla niestandardowych bezpiecznych binariów.
- lista dozwolonych: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych elementów i nie dodawaj binariów interpreterów/runtime’ów (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów listy dozwolonych elementów i pozostaw włączone monity o zatwierdzenie.
`openclaw security audit` ostrzega, gdy wpisy interpreterów/runtime’ów w `safeBins` nie mają jawnych profili, a `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają także, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do listy dozwolonych elementów, włącz `tools.exec.strictInlineEval`, aby formy inline code-eval nadal wymagały świeżego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w sekcjach [zatwierdzenia Exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [bezpieczne binaria a lista dozwolonych elementów](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Pierwszy plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Tło + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do sprawdzania stanu na żądanie, nie do pętli oczekiwania. Jeśli automatyczne wybudzanie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy wyemituje dane wyjściowe lub zakończy się niepowodzeniem.

Wyślij klawisze (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Prześlij (wyślij tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej (domyślnie w trybie bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` jest podnarzędziem `exec` do ustrukturyzowanych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Używaj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć albo ograniczyć do konkretnych modeli:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Uwagi:

- Dostępne tylko dla modeli OpenAI/OpenAI Codex.
- Polityka narzędzi nadal obowiązuje; `allow: ["write"]` niejawnie zezwala na `apply_patch`.
- `deny: ["write"]` nie blokuje `apply_patch`; zablokuj `apply_patch` jawnie albo użyj `deny: ["group:fs"]`, gdy zapisy przez łatki także mają być blokowane.
- Konfiguracja znajduje się pod `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczenie do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem obszaru roboczego.

## Powiązane

- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach izolowanych
- [Proces w tle](/pl/gateway/background-process) — długotrwałe narzędzie exec i process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
