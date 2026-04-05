---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia Exec, tryby stdin i obsługa TTY
title: Narzędzie Exec
x-i18n:
    generated_at: "2026-04-05T14:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Narzędzie Exec

Uruchamia polecenia powłoki w workspace. Obsługuje wykonanie na pierwszym planie i w tle przez `process`.
Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje działające w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

- `command` (wymagane)
- `workdir` (domyślnie cwd)
- `env` (nadpisania klucz/wartość)
- `yieldMs` (domyślnie 10000): automatyczne przejście w tło po opóźnieniu
- `background` (bool): natychmiastowe uruchomienie w tle
- `timeout` (sekundy, domyślnie 1800): zakończenie po upływie czasu
- `pty` (bool): uruchamia w pseudoterminalu, gdy jest dostępny (CLI tylko dla TTY, agenci kodujący, terminalowe interfejsy UI)
- `host` (`auto | sandbox | gateway | node`): gdzie wykonać
- `security` (`deny | allowlist | full`): tryb wymuszania dla `gateway`/`node`
- `ask` (`off | on-miss | always`): prompty zatwierdzeń dla `gateway`/`node`
- `node` (string): identyfikator/nazwa node dla `host=node`
- `elevated` (bool): żądanie trybu podwyższonego (wyjście z sandboxa na skonfigurowaną ścieżkę hosta); `security=full` jest wymuszane tylko wtedy, gdy `elevated` zostanie rozwiązane do `full`

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy dla sesji aktywne jest środowisko sandbox, w przeciwnym razie gateway.
- `auto` to domyślna strategia routingu, a nie wildcard. Wywołanie per-call `host=node` jest dozwolone z `auto`; per-call `host=gateway` jest dozwolone tylko wtedy, gdy nie jest aktywne żadne środowisko sandbox.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak sandboxa oznacza rozstrzygnięcie do `gateway`; aktywny sandbox oznacza pozostanie w sandboxie.
- `elevated` wychodzi z sandboxa na skonfigurowaną ścieżkę hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślnie sesji ustawiono `host=node`). Jest dostępne tylko wtedy, gdy dla bieżącej sesji/dostawcy włączono dostęp podwyższony.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego node (aplikacja towarzysząca lub bezgłowy host node).
- Jeśli dostępnych jest wiele node, ustaw `exec.node` lub `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonywania powłoki dla node; starszy wrapper `nodes.run` został usunięty.
- Na hostach innych niż Windows exec używa `SHELL`, jeśli jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (lub `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a dopiero potem wraca do `SHELL`, jeśli żaden z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, a potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonanie na hoście (`gateway`/`node`) odrzuca `env.PATH` oraz nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przejęciu binariów lub wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym PTY i wykonania w sandboxie), aby reguły powłoki/profilu mogły wykrywać kontekst narzędzia exec.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozstrzyga się do `gateway`. Jawne `host=sandbox` nadal bezpiecznie kończy się odmową zamiast po cichu
  uruchamiać się na hoście gateway. Włącz sandboxing albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole wstępne skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  skutecznej granicy `workdir`. Jeśli ścieżka skryptu rozstrzyga się poza `workdir`, kontrola wstępna jest pomijana dla
  tego pliku.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest ono włączone i polecenie generuje dane wyjściowe lub kończy się błędem.
  Używaj `process` do logów, statusu, wejścia lub interwencji; nie emuluj
  harmonogramowania za pomocą pętli sleep, timeout ani powtarzanego odpytywania.
- Dla pracy, która ma zostać wykonana później lub według harmonogramu, używaj cron zamiast
  wzorców sleep/delay z `exec`.

## Config

- `tools.exec.notifyOnExit` (domyślnie: true): gdy ma wartość true, sesje exec uruchomione w tle dodają zdarzenie systemowe do kolejki i żądają heartbeat po zakończeniu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „running”, gdy exec wymagający zatwierdzenia działa dłużej niż ten czas (0 wyłącza).
- `tools.exec.host` (domyślnie: `auto`; rozstrzyga się do `sandbox`, gdy środowisko sandbox jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandbox, `full` dla gateway + node, gdy nie ustawiono)
- `tools.exec.ask` (domyślnie: `off`)
- Wykonanie hosta bez zatwierdzeń jest domyślne dla gateway + node. Jeśli chcesz zachowania z zatwierdzeniami/allowlist, zaostrz zarówno `tools.exec.*`, jak i hostowe `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia Exec](/tools/exec-approvals#no-approval-yolo-mode).
- YOLO wynika z domyślnych zasad hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing do gateway lub node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy ma wartość true, formy eval inline interpretera, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalać zaufanie dla nieszkodliwych wywołań interpretera/skryptu, ale formy inline-eval nadal pytają za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów dodawanych na początek `PATH` dla uruchomień exec (tylko gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binaria tylko dla stdin, które mogą działać bez jawnych wpisów allowlist. Szczegóły zachowania: [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla sprawdzania ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane. Wbudowane domyślne wartości to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa polityka argv dla każdego safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: scala `PATH` twojej powłoki logowania ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłoka logowania) wewnątrz kontenera, więc `/etc/profile` może resetować `PATH`.
  OpenClaw dodaje `env.PATH` na początek po wczytaniu profilu przez wewnętrzną zmienną środowiskową (bez interpolacji powłoki);
  `tools.exec.pathPrepend` działa tutaj również.
- `host=node`: do node wysyłane są tylko nieblokowane nadpisania env, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście i ignorowane przez hosty node. Jeśli potrzebujesz dodatkowych wpisów PATH na node,
  skonfiguruj środowisko usługi hosta node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie node per agent (użyj indeksu z listy agentów w config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Exec node binding” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić **domyślne wartości per sesja** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby wyświetlić bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (allowlisty kanałów/parowanie plus `commands.useAccessGroups`).
Aktualizuje **tylko stan sesji** i nie zapisuje config. Aby całkowicie wyłączyć exec, zablokuj je przez politykę
narzędzi (`tools.deny: ["exec"]` lub per agent). Zatwierdzenia hosta nadal mają zastosowanie, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia Exec (aplikacja towarzysząca / host node)

Agenci działający w sandboxie mogą wymagać zatwierdzenia każdego żądania przed uruchomieniem `exec` na hoście gateway lub node.
Zobacz [Zatwierdzenia Exec](/tools/exec-approvals), aby poznać zasady, allowlist i przepływ w UI.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca
`status: "approval-pending"` i identyfikator zatwierdzenia. Po zatwierdzeniu (lub odmowie / przekroczeniu czasu),
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
Na kanałach z natywnymi kartami/przyciskami zatwierdzeń agent powinien najpierw polegać na tym
natywnym UI i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik
narzędzia wyraźnie mówi, że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną
drogą.

## Allowlist + safe bins

Ręczne wymuszanie allowlist dopasowuje **tylko rozpoznane ścieżki binariów** (bez dopasowań po basename). Gdy
`security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment pipeline jest
na allowlist albo jest safe bin. Łączenie (`;`, `&&`, `||`) i przekierowania są odrzucane w
trybie allowlist, chyba że każdy segment najwyższego poziomu spełnia allowlistę (w tym safe bins).
Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łańcuchowe nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna wygodna ścieżka w zatwierdzeniach exec. To nie to samo co
ręczne wpisy allowlist dla ścieżek. Jeśli potrzebujesz ścisłego jawnego zaufania, pozostaw
`autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieni tylko dla stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych safe-bin.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych safe-bin.
- allowlist: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej allowlisty i nie dodawaj binariów interpreterów/runtime (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów allowlist i pozostaw włączone prompty zatwierdzeń.
`openclaw security audit` ostrzega, gdy wpisy interpreterów/runtime w `safeBins` nie mają jawnych profili, a `openclaw doctor --fix` może utworzyć brakujące wpisy niestandardowe `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają także, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do allowlisty, włącz `tools.exec.strictInlineEval`, aby formy eval kodu inline nadal wymagały nowego zatwierdzenia.

Pełne szczegóły zasad i przykłady znajdziesz w [Zatwierdzenia Exec](/tools/exec-approvals#safe-bins-stdin-only) i [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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

Odpytywanie służy do pobierania statusu na żądanie, a nie do pętli oczekiwania. Jeśli automatyczne wybudzenie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy wygeneruje dane wyjściowe lub zakończy się błędem.

Wysyłanie klawiszy (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (wysyła tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklejanie (domyślnie z bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` to podnarzędzie `exec` do uporządkowanej edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Używaj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć lub ograniczyć do określonych modeli:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Uwagi:

- Dostępne tylko dla modeli OpenAI/OpenAI Codex.
- Polityka narzędzi nadal ma zastosowanie; `allow: ["write"]` domyślnie zezwala także na `apply_patch`.
- Konfiguracja znajduje się w `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczenie do workspace). Ustaw `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usunęło pliki poza katalogiem workspace.

## Powiązane

- [Zatwierdzenia Exec](/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandbox
- [Proces w tle](/pl/gateway/background-process) — długotrwałe exec i narzędzie process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
