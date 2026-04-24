---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie exec
x-i18n:
    generated_at: "2026-04-24T09:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Uruchamiaj polecenia powłoki w obszarze roboczym. Obsługuje wykonanie na pierwszym planie i w tle przez `process`.
Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska key/value scalane na wierzchu dziedziczonego środowiska.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenosi polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Natychmiast przenosi polecenie do tła zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Zabija polecenie po tylu sekundach.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchamia w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i interfejsów terminalowych.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Miejsce wykonania. `auto` rozwiązuje się do `sandbox`, gdy aktywny jest runtime sandbox dla sesji, a w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Tryb egzekwowania dla wykonania `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie promptu zatwierdzenia dla wykonania `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node przy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Żąda trybu elevated — ucieczki z sandboxa do skonfigurowanej ścieżki hosta. `security=full` jest wymuszane tylko wtedy, gdy elevated rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy aktywny jest runtime sandbox dla sesji, w przeciwnym razie gateway.
- `auto` to domyślna strategia routingu, a nie wildcard. Per-call `host=node` jest dozwolone z `auto`; per-call `host=gateway` jest dozwolone tylko wtedy, gdy nie jest aktywny żaden runtime sandbox.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: bez sandboxa rozwiązuje się do `gateway`; aktywny sandbox pozostaje w sandboxie.
- `elevated` ucieka z sandboxa do skonfigurowanej ścieżki hosta: domyślnie `gateway`, albo `node`, gdy `tools.exec.host=node` (albo domyślną wartością sesji jest `host=node`). Jest dostępne tylko wtedy, gdy dostęp elevated jest włączony dla bieżącej sesji/providera.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacja towarzysząca albo bezgłowy host Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` albo `tools.exec.node`, aby wybrać jeden.
- `exec host=node` jest jedyną ścieżką wykonywania powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- Na hostach innych niż Windows exec używa `SHELL`, jeśli jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (albo `sh`)
  z `PATH`, aby uniknąć skryptów niekompatybilnych z fish, a następnie wraca do `SHELL`, jeśli żaden nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonanie na hoście (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiegać przejęciu binariów albo wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym dla wykonania PTY i sandbox), aby reguły shell/profile mogły wykrywać kontekst narzędzia exec.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się w trybie fail-closed zamiast po cichu
  działać na hoście gateway. Włącz sandboxing albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole preflight skryptów (dla typowych błędów składni shell w Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, preflight jest pomijany dla
  tego pliku.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście albo kończy się błędem.
  Używaj `process` do logów, statusu, wejścia albo interwencji; nie emuluj
  harmonogramu przez pętle sleep, pętle timeout ani powtarzany polling.
- Dla pracy, która ma się wydarzyć później albo według harmonogramu, używaj cron zamiast
  wzorców sleep/delay z `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione do tła umieszczają zdarzenie systemowe w kolejce i żądają heartbeat przy wyjściu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituje pojedyncze powiadomienie „running”, gdy exec wymagający zatwierdzenia działa dłużej niż ten czas (0 wyłącza).
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy aktywny jest runtime sandbox, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandbox, `full` dla gateway + node, gdy nie ustawiono)
- `tools.exec.ask` (domyślnie: `off`)
- Exec na hoście bez zatwierdzenia to wartość domyślna dla gateway + node. Jeśli chcesz zachowania z zatwierdzeniami/listą dozwolonych, zaostrz zarówno `tools.exec.*`, jak i politykę hosta `~/.openclaw/exec-approvals.json`; zobacz [Exec approvals](/pl/tools/exec-approvals#no-approval-yolo-mode).
- YOLO pochodzi z domyślnych ustawień polityki hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing gateway albo node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` exec na hoście postępuje bezpośrednio według skonfigurowanej polityki; nie ma dodatkowej heurystycznej warstwy prefiltrowania zaciemniania poleceń ani odrzucania script-preflight.
- `tools.exec.node` (domyślnie: brak)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formy inline eval interpretera, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalać zaufanie do łagodnych wywołań interpretera/skryptu, ale formy inline-eval i tak pytają za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dołączenia na początku `PATH` dla uruchomień exec (tylko gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binaria tylko-stdin, które mogą działać bez jawnych wpisów listy dozwolonych. Szczegóły zachowania znajdziesz w [Safe bins](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla sprawdzeń ścieżek wykonywalnych `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa polityka argv dla bezpiecznych binariów (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: scala `PATH` z powłoki logowania z środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłoka logowania) wewnątrz kontenera, więc `/etc/profile` może resetować `PATH`.
  OpenClaw dołącza `env.PATH` na początku po źródłowaniu profilu przez wewnętrzną zmienną env (bez interpolacji powłoki);
  `tools.exec.pathPrepend` także ma tu zastosowanie.
- `host=node`: do Node wysyłane są tylko nieblokowane nadpisania env, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo instaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node per agent (użyj indeksu listy agentów w konfiguracji):

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

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (listy dozwolonych/pairing kanałów plus `commands.useAccessGroups`).
Aktualizuje tylko **stan sesji** i nie zapisuje konfiguracji. Aby twardo wyłączyć exec, zabroń go przez politykę narzędzi (`tools.deny: ["exec"]` albo per agent). Zatwierdzenia hosta nadal obowiązują, chyba że jawnie ustawisz `security=full` i `ask=off`.

## Exec approvals (aplikacja towarzysząca / host Node)

Agenci sandboxowani mogą wymagać zatwierdzenia każdego żądania, zanim `exec` uruchomi się na hoście gateway albo node.
Zobacz [Exec approvals](/pl/tools/exec-approvals), aby poznać politykę, listę dozwolonych i przepływ UI.

Gdy wymagane są zatwierdzenia, narzędzie exec natychmiast zwraca
`status: "approval-pending"` oraz identyfikator zatwierdzenia. Po zatwierdzeniu (albo odrzuceniu / timeout),
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
Na kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien
najpierw polegać na tym natywnym UI i dołączać ręczne polecenie `/approve`
tylko wtedy, gdy wynik narzędzia jawnie mówi, że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Allowlist + safe bins

Ręczne egzekwowanie listy dozwolonych dopasowuje **tylko rozwiązane ścieżki binariów** (bez dopasowań po basename). Gdy
`security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku jest
na liście dozwolonych albo jest safe bin. Łańcuchowanie (`;`, `&&`, `||`) i przekierowania są odrzucane w
trybie allowlist, chyba że każdy segment najwyższego poziomu spełnia listę dozwolonych (w tym safe bins).
Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łańcuchowe nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna ścieżka wygody w zatwierdzeniach exec. To nie to samo co
ręczne wpisy ścieżek na liście dozwolonych. Dla ścisłego jawnego zaufania trzymaj
`autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe tylko-stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych safe-bin.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych safe bins.
- allowlist: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jak generycznej listy dozwolonych i nie dodawaj binariów interpreterów/runtime (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, używaj jawnych wpisów allowlist i pozostaw włączone prompty zatwierdzania.
`openclaw security audit` ostrzega, gdy wpisom `safeBins` dla interpreterów/runtime brakuje jawnych profili, a `openclaw doctor --fix` może wygenerować brakujące wpisy `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają także, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do allowlist, włącz `tools.exec.strictInlineEval`, aby formy inline code-eval nadal wymagały świeżego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [Exec approvals](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [Safe bins versus allowlist](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling służy do statusu na żądanie, a nie do pętli oczekiwania. Jeśli włączone
jest automatyczne wybudzanie po zakończeniu, polecenie może wybudzić sesję, gdy wyemituje wyjście albo zakończy się błędem.

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

Wklejanie (domyślnie w nawiasach bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## `apply_patch`

`apply_patch` to subnarzędzie `exec` do ustrukturyzowanych edycji wielu plików.
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
- Konfiguracja znajduje się pod `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem obszaru roboczego.

## Powiązane

- [Exec Approvals](/pl/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandboxowanych
- [Background Process](/pl/gateway/background-process) — długotrwały exec i narzędzie process
- [Security](/pl/gateway/security) — polityka narzędzi i dostęp elevated
