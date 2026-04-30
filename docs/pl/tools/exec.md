---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie do wykonywania poleceń
x-i18n:
    generated_at: "2026-04-30T10:21:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Uruchamia polecenia powłoki w obszarze roboczym. Obsługuje wykonywanie na pierwszym planie i w tle przez `process`.
Jeśli `process` jest niedozwolony, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są przypisane do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska w postaci klucz/wartość, scalane nałożone na odziedziczone środowisko.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenieś polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Przenieś polecenie do tła natychmiast zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisuje skonfigurowany limit czasu exec dla tego wywołania. Ustaw `timeout: 0` tylko wtedy, gdy polecenie ma działać bez limitu czasu procesu exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchamia w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i terminalowych UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Gdzie wykonać. `auto` rozwiązuje się do `sandbox`, gdy aktywne jest środowisko uruchomieniowe sandbox, a w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Tryb egzekwowania dla wykonywania przez `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie monitu o zatwierdzenie dla wykonywania przez `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Żąda trybu podwyższonego — wyjścia z sandbox do skonfigurowanej ścieżki hosta. `security=full` jest wymuszane tylko wtedy, gdy `elevated` rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy środowisko uruchomieniowe sandbox jest aktywne dla sesji, w przeciwnym razie gateway.
- `host` akceptuje tylko `auto`, `sandbox`, `gateway` albo `node`. Nie jest selektorem nazwy hosta; wartości przypominające nazwy hostów są odrzucane przed uruchomieniem polecenia.
- `auto` to domyślna strategia routingu, a nie wieloznacznik. `host=node` w pojedynczym wywołaniu jest dozwolone z `auto`; `host=gateway` w pojedynczym wywołaniu jest dozwolone tylko wtedy, gdy żadne środowisko uruchomieniowe sandbox nie jest aktywne.
- Bez dodatkowej konfiguracji `host=auto` nadal po prostu działa: brak sandbox oznacza rozwiązanie do `gateway`; aktywny sandbox oznacza pozostanie w sandbox.
- `elevated` wychodzi z sandbox do skonfigurowanej ścieżki hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślna sesji to `host=node`). Jest dostępne tylko wtedy, gdy podwyższony dostęp jest włączony dla bieżącej sesji/dostawcy.
- Zatwierdzeniami `gateway`/`node` steruje `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej albo bezgłowego hosta Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` albo `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonywania powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- `timeout` dotyczy wykonywania na pierwszym planie, w tle, `yieldMs`, gateway, sandbox i Node `system.run`. Jeśli zostanie pominięty, OpenClaw używa `tools.exec.timeoutSec`; jawne `timeout: 0` wyłącza limit czasu procesu exec dla tego wywołania.
- Na hostach innych niż Windows exec używa `SHELL`, gdy jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (albo `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a potem wraca do `SHELL`, jeśli żadne z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonywanie na hoście (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przechwyceniu binariów lub wstrzykniętemu kodowi.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym wykonywania PTY i sandbox), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- `openclaw channels login` jest blokowane z `exec`, ponieważ jest interaktywnym przepływem uwierzytelniania kanału; uruchom je w terminalu na hoście gateway albo użyj natywnego dla kanału narzędzia logowania z czatu, gdy istnieje.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się bezpieczną odmową zamiast cicho
  uruchamiać na hoście gateway. Włącz sandboxing albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole wstępne skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, kontrola wstępna jest pomijana dla
  tego pliku.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście albo kończy się niepowodzeniem.
  Używaj `process` do logów, statusu, wejścia lub interwencji; nie emuluj
  harmonogramowania pętlami sleep, pętlami timeout ani powtarzanym odpytywaniem.
- Dla pracy, która ma odbyć się później albo według harmonogramu, użyj cron zamiast
  wzorców sleep/delay w `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, przeniesione do tła sesje exec dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy wyjściu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „działa”, gdy exec wymagający zatwierdzenia działa dłużej niż ta wartość (0 wyłącza).
- `tools.exec.timeoutSec` (domyślnie: 1800): domyślny limit czasu exec dla pojedynczego polecenia w sekundach. `timeout` w pojedynczym wywołaniu go nadpisuje; `timeout: 0` w pojedynczym wywołaniu wyłącza limit czasu procesu exec.
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy środowisko uruchomieniowe sandbox jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandbox, `full` dla gateway + Node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Exec hosta bez zatwierdzeń jest domyślne dla gateway + Node. Jeśli chcesz zachowanie z zatwierdzeniami/listą dozwolonych, zaostrz zarówno `tools.exec.*`, jak i hostowe `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#no-approval-yolo-mode).
- YOLO wynika z domyślnych polityki hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing przez gateway lub Node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` exec hosta bezpośrednio przestrzega skonfigurowanej polityki; nie ma dodatkowej heurystycznej warstwy wstępnego filtrowania zaciemniania poleceń ani odrzucania kontroli wstępnej skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formy ewaluacji inline interpreterów, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalić łagodne wywołania interpretera/skryptu, ale formy inline-eval nadal wyświetlają monit za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dołączenia na początku `PATH` dla uruchomień exec (tylko gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binaria tylko ze stdin, które mogą działać bez jawnych wpisów allowlist. Szczegóły zachowania znajdziesz w [Bezpieczne binaria](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa polityka argv dla każdego bezpiecznego binarium (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: scala `PATH` powłoki logowania z użytkownika ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, więc `/etc/profile` może zresetować `PATH`.
  OpenClaw dołącza `env.PATH` na początku po wczytaniu profilu przez wewnętrzną zmienną środowiskową (bez interpolacji powłoki);
  `tools.exec.pathPrepend` też ma tu zastosowanie.
- `host=node`: tylko nieblokowane nadpisania środowiska, które przekażesz, są wysyłane do Node. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node dla agenta (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Powiązanie Node exec” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić domyślne **dla sesji** wartości `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby wyświetlić bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (allowlisty/parowanie kanałów plus `commands.useAccessGroups`).
Aktualizuje **wyłącznie stan sesji** i nie zapisuje konfiguracji. Aby trwale wyłączyć exec, odmów go przez
politykę narzędzi (`tools.deny: ["exec"]` albo dla pojedynczego agenta). Zatwierdzenia hosta nadal mają zastosowanie, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host Node)

Agenci w sandbox mogą wymagać zatwierdzenia dla każdego żądania, zanim `exec` uruchomi się na hoście gateway lub Node.
Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać politykę, allowlist i przepływ UI.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca natychmiast
`status: "approval-pending"` i identyfikator zatwierdzenia. Po zatwierdzeniu (albo odmowie / upływie czasu)
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
Na kanałach z natywnymi kartami/przyciskami zatwierdzeń agent powinien najpierw polegać na tym
natywnym UI i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia
jawnie mówi, że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Allowlist + bezpieczne binaria

Ręczne egzekwowanie allowlist dopasowuje globy rozwiązanych ścieżek binarnych i globy gołych nazw poleceń. Gołe nazwy pasują tylko do poleceń wywołanych przez PATH, więc `rg` może pasować
do `/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale nie do `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku
jest na allowlist albo jest bezpiecznym binarium. Łączenie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie allowlist, chyba że każdy segment najwyższego poziomu spełnia
allowlist (w tym bezpieczne binaria). Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łączone nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna wygodna ścieżka w zatwierdzeniach exec. Nie jest tym samym co
ręczne wpisy allowlist ścieżek. Aby uzyskać ścisłe jawne zaufanie, pozostaw `autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe tylko ze stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych bezpiecznych binariów.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych bezpiecznych binariów.
- allowlist: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych i nie dodawaj binariów interpreterów/środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów na liście dozwolonych i pozostaw włączone monity o zatwierdzenie.
`openclaw security audit` ostrzega, gdy wpisom interpreterów/środowisk uruchomieniowych w `safeBins` brakuje jawnych profili, a `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają też, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim działaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do listy dozwolonych, włącz `tools.exec.strictInlineEval`, aby wbudowane formy ewaluacji kodu nadal wymagały nowego zatwierdzenia.

Pełne szczegóły zasad i przykłady znajdziesz w [Zatwierdzeniach Exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [Bezpieczne binaria a lista dozwolonych](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Na pierwszym planie:

```json
{ "tool": "exec", "command": "ls -la" }
```

Tło + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do sprawdzania statusu na żądanie, a nie do pętli oczekiwania. Jeśli automatyczne wybudzanie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy wyemituje dane wyjściowe lub zakończy się niepowodzeniem.

Wyślij klawisze (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Zatwierdź (wyślij tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej (domyślnie w trybie bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` jest podnarzędziem `exec` do uporządkowanych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Użyj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć lub ograniczyć do określonych modeli:

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
- Zasady narzędzi nadal obowiązują; `allow: ["write"]` niejawnie zezwala na `apply_patch`.
- Konfiguracja znajduje się w `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało pliki poza katalogiem obszaru roboczego.

## Powiązane

- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Piaskownica](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach piaskownicy
- [Proces w tle](/pl/gateway/background-process) — długotrwałe narzędzie exec i process
- [Bezpieczeństwo](/pl/gateway/security) — zasady narzędzi i podwyższony dostęp
