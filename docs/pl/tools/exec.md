---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie exec
x-i18n:
    generated_at: "2026-04-21T10:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Narzędzie exec

Uruchamiaj polecenia powłoki w workspace. Obsługuje wykonanie na pierwszym planie i w tle przez `process`.
Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

- `command` (wymagane)
- `workdir` (domyślnie cwd)
- `env` (nadpisania klucz/wartość)
- `yieldMs` (domyślnie 10000): automatyczne przejście do tła po opóźnieniu
- `background` (bool): natychmiast do tła
- `timeout` (sekundy, domyślnie 1800): zabicie po upływie czasu
- `pty` (bool): uruchamia w pseudo-terminalu, gdy jest dostępny (CLI tylko z TTY, coding agents, terminalowe UI)
- `host` (`auto | sandbox | gateway | node`): gdzie wykonać
- `security` (`deny | allowlist | full`): tryb wymuszania dla `gateway`/`node`
- `ask` (`off | on-miss | always`): prompty zatwierdzenia dla `gateway`/`node`
- `node` (string): id/nazwa node dla `host=node`
- `elevated` (bool): żąda trybu podniesionego (wyjście z sandboxa na skonfigurowaną ścieżkę hosta); `security=full` jest wymuszane tylko wtedy, gdy elevated rozwiąże się do `full`

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy runtime sandboxa jest aktywny dla sesji, w przeciwnym razie gateway.
- `auto` to domyślna strategia routowania, a nie wildcard. `host=node` per wywołanie jest dozwolone z `auto`; `host=gateway` per wywołanie jest dozwolone tylko wtedy, gdy żaden runtime sandboxa nie jest aktywny.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak sandboxa oznacza rozwiązanie do `gateway`; aktywny sandbox utrzymuje wykonanie w sandboxie.
- `elevated` wychodzi z sandboxa na skonfigurowaną ścieżkę hosta: domyślnie `gateway`, albo `node`, gdy `tools.exec.host=node` (lub domyślna sesja to `host=node`). Jest dostępne tylko wtedy, gdy podniesiony dostęp jest włączony dla bieżącej sesji/providera.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego node (aplikacja towarzysząca lub bezgłowy host node).
- Jeśli dostępnych jest wiele node, ustaw `exec.node` albo `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonania powłoki dla node; starszy wrapper `nodes.run` został usunięty.
- Na hostach innych niż Windows exec używa `SHELL`, jeśli jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (albo `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a potem wraca do `SHELL`, jeśli żaden z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonanie na hoście (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przejęciu binarek albo wstrzykniętemu kodowi.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym wykonanie PTY i sandbox), aby reguły shell/profile mogły wykrywać kontekst narzędzia exec.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się bezpieczną odmową zamiast po cichu
  uruchamiać na hoście gateway. Włącz sandboxing albo użyj `host=gateway` ze zgodami.
- Kontrole preflight skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, preflight dla
  tego pliku jest pomijany.
- Dla długotrwałej pracy, która ma się rozpocząć teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście albo kończy się błędem.
  Używaj `process` do logów, statusu, wejścia lub interwencji; nie emuluj
  harmonogramowania pętlami sleep, pętlami timeout ani powtarzanym pollingiem.
- Dla pracy, która ma wykonać się później albo według harmonogramu, użyj Cron zamiast
  wzorców sleep/delay z `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione do tła dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy zakończeniu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „running”, gdy exec objęty zatwierdzeniem działa dłużej niż to ustawienie (0 wyłącza).
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy runtime sandboxa jest aktywny, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandboxa, `full` dla gateway + node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Host exec bez zatwierdzenia jest domyślny dla gateway + node. Jeśli chcesz zachowania z zatwierdzeniami/listą dozwolonych, zaostrz zarówno `tools.exec.*`, jak i host `~/.openclaw/exec-approvals.json`; zobacz [Exec approvals](/pl/tools/exec-approvals#no-approval-yolo-mode).
- YOLO wynika z domyślnych polityk hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routowanie do gateway albo node, ustaw `tools.exec.host` lub użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` host exec podąża bezpośrednio za skonfigurowaną polityką; nie ma dodatkowej heurystycznej warstwy prefiltru maskowania poleceń ani odrzucania w preflight skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formy inline eval interpreterów, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalać zaufanie do nieszkodliwych wywołań interpretera/skryptu, ale formy inline eval nadal będą pytać za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początek `PATH` dla uruchomień exec (tylko gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binarki tylko dla stdin, które mogą działać bez jawnych wpisów listy dozwolonych. Szczegóły zachowania znajdziesz w [Safe bins](/pl/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek wykonywalnych `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna własna polityka argv dla każdego safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: scala `PATH` z twojej powłoki logowania ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście. Sam demon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłoka logowania) wewnątrz kontenera, więc `/etc/profile` może resetować `PATH`.
  OpenClaw dodaje `env.PATH` na początek po załadowaniu profilu przez wewnętrzną zmienną env (bez interpolacji powłoki);
  `tools.exec.pathPrepend` też ma tu zastosowanie.
- `host=node`: do node wysyłane są tylko przekazane przez ciebie nadpisania env, które nie są zablokowane. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście i ignorowane przez hosty node. Jeśli potrzebujesz dodatkowych wpisów PATH na node,
  skonfiguruj środowisko usługi hosta node (systemd/launchd) albo instaluj narzędzia w standardowych lokalizacjach.

Powiązanie node per agent (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Exec node binding” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Używaj `/exec`, aby ustawić **domyślne wartości per sesja** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby pokazać bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (listy dozwolonych kanałów/pairing plus `commands.useAccessGroups`).
Aktualizuje **tylko stan sesji** i nie zapisuje konfiguracji. Aby całkowicie wyłączyć exec, zablokuj je przez politykę
narzędzi (`tools.deny: ["exec"]` albo per agent). Zgody hosta nadal mają zastosowanie, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zgody exec (aplikacja towarzysząca / host node)

Agenci sandboxowani mogą wymagać zatwierdzenia per żądanie, zanim `exec` uruchomi się na hoście gateway albo node.
Zobacz [Exec approvals](/pl/tools/exec-approvals), aby poznać politykę, listę dozwolonych i przepływ UI.

Gdy zatwierdzenia są wymagane, narzędzie exec zwraca natychmiast
`status: "approval-pending"` oraz id zatwierdzenia. Po zatwierdzeniu (albo odmowie / przekroczeniu czasu),
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
Na kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien
najpierw polegać na tym natywnym UI i dołączać ręczne polecenie `/approve` tylko wtedy, gdy
wynik narzędzia jawnie mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie
jest jedyną ścieżką.

## Allowlist + safe bins

Ręczne wymuszanie listy dozwolonych dopasowuje tylko **rozwiązane ścieżki binarek** (bez dopasowań po samej nazwie). Gdy
`security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku jest
na liście dozwolonych albo jest safe bin. Łączenie (`;`, `&&`, `||`) i przekierowania są odrzucane w
trybie allowlist, chyba że każdy segment najwyższego poziomu spełnia listę dozwolonych (w tym safe bins).
Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej zasady: polecenie łączone nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna ścieżka wygody w zgodach exec. Nie jest tym samym co
ręczne wpisy listy dozwolonych ścieżek. Dla ścisłego jawnego zaufania pozostaw `autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieni tylko dla stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych safe-bin.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla własnych safe bins.
- allowlist: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych i nie dodawaj binarek interpreterów/runtime (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów listy dozwolonych i pozostaw włączone prompty zatwierdzeń.
`openclaw security audit` ostrzega, gdy wpisy interpretera/runtime w `safeBins` nie mają jawnych profili, a `openclaw doctor --fix` może utworzyć brakujące wpisy własnych `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają także, gdy jawnie dodasz z powrotem do `safeBins` binarki o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie umieszczasz interpretery na liście dozwolonych, włącz `tools.exec.strictInlineEval`, aby formy inline code-eval nadal wymagały świeżego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [Exec approvals](/pl/tools/exec-approvals#safe-bins-stdin-only) oraz [Safe bins versus allowlist](/pl/tools/exec-approvals#safe-bins-versus-allowlist).

## Przykłady

Pierwszy plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Tło + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling służy do statusu na żądanie, a nie do pętli oczekiwania. Jeśli automatyczne wybudzenie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy emituje wyjście albo kończy się błędem.

Wysyłanie klawiszy (styl tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (wysyła tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (domyślnie z bracketami):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` to podnarzędzie `exec` do uporządkowanych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Używaj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć albo ograniczyć do konkretnych modeli:

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
- Polityka narzędzi nadal ma zastosowanie; `allow: ["write"]` niejawnie zezwala na `apply_patch`.
- Konfiguracja znajduje się pod `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do workspace). Ustaw `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem workspace.

## Powiązane

- [Exec Approvals](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandboxowanych
- [Background Process](/pl/gateway/background-process) — długotrwały exec i narzędzie process
- [Security](/pl/gateway/security) — polityka narzędzi i podniesiony dostęp
