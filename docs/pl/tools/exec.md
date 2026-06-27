---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie Exec
x-i18n:
    generated_at: "2026-06-27T18:26:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Uruchamiaj polecenia powłoki w workspace. `exec` to mutująca powierzchnia powłoki: polecenia mogą tworzyć, edytować lub usuwać pliki wszędzie tam, gdzie pozwala na to wybrany host albo system plików sandboxa. Wyłączenie narzędzi systemu plików OpenClaw, takich jak `write`, `edit` czy `apply_patch`, nie czyni `exec` tylko do odczytu.

Obsługuje wykonywanie na pierwszym planie i w tle przez `process`. Jeśli `process` jest niedozwolony, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska w postaci klucz/wartość scalane na wierzchu odziedziczonego środowiska.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenieś polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Przenieś polecenie do tła natychmiast zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisz skonfigurowany limit czasu exec dla tego wywołania. Ustaw `timeout: 0` tylko wtedy, gdy polecenie ma działać bez limitu czasu procesu exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchom w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i terminalowych UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Gdzie wykonać polecenie. `auto` rozwiązuje się do `sandbox`, gdy aktywne jest środowisko uruchomieniowe sandboxa, a w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorowane dla normalnych wywołań narzędzi. Bezpieczeństwem `gateway` / `node` sterują
`tools.exec.security` i plik zatwierdzeń hosta; tryb podwyższony może
wymusić `security=full` tylko wtedy, gdy operator jawnie przyzna podwyższony dostęp.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Bazowy tryb pytania pochodzi z `tools.exec.ask` i zatwierdzeń hosta.
Dla wywołań modelu pochodzących z kanału `ask` na poziomie wywołania jest ignorowane, gdy
efektywne pytanie hosta to `off`; w przeciwnym razie może tylko zaostrzyć tryb.
Zaufani wewnętrzni/API wywołujący, którzy konstruują narzędzia exec z
jawną wartością `ask`, pozostają bez zmian.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Zażądaj trybu podwyższonego — opuść sandbox na skonfigurowaną ścieżkę hosta. `security=full` jest wymuszane tylko wtedy, gdy elevated rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: sandbox, gdy środowisko uruchomieniowe sandboxa jest aktywne dla sesji, w przeciwnym razie Gateway.
- `host` akceptuje tylko `auto`, `sandbox`, `gateway` albo `node`. Nie jest selektorem nazwy hosta; wartości podobne do nazw hostów są odrzucane przed uruchomieniem polecenia.
- `auto` to domyślna strategia routingu, a nie symbol wieloznaczny. `host=node` na poziomie wywołania jest dozwolone z `auto`; `host=gateway` na poziomie wywołania jest dozwolone tylko wtedy, gdy nie jest aktywne środowisko uruchomieniowe sandboxa.
- `tools.exec.mode` to znormalizowane pokrętło polityki. Wartości to `deny`, `allowlist`, `ask`, `auto` i `full`. `auto` uruchamia deterministyczne dopasowania allowlist/safe-bin bezpośrednio i kieruje każdy pozostały przypadek zatwierdzenia exec przez natywnego automatycznego recenzenta OpenClaw przed zapytaniem człowieka. `ask` / `ask=always` nadal pyta człowieka za każdym razem.
- Bez dodatkowej konfiguracji `host=auto` nadal po prostu działa: brak sandboxa oznacza rozwiązanie do `gateway`; aktywny sandbox oznacza pozostanie w sandboxie.
- `elevated` opuszcza sandbox na skonfigurowaną ścieżkę hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślna wartość sesji to `host=node`). Jest dostępne tylko wtedy, gdy podwyższony dostęp jest włączony dla bieżącej sesji/providera.
- Zatwierdzeniami `gateway`/`node` steruje plik zatwierdzeń hosta.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej albo bezgłowego hosta Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` albo `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonywania powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- `timeout` dotyczy wykonywania na pierwszym planie, w tle, `yieldMs`, Gateway, sandboxa oraz `system.run` na Node. Jeśli zostanie pominięte, OpenClaw używa `tools.exec.timeoutSec`; jawne `timeout: 0` wyłącza limit czasu procesu exec dla tego wywołania.
- Na hostach innych niż Windows exec używa `SHELL`, gdy jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (albo `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a potem wraca do `SHELL`, jeśli żadne z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Na hostach Gateway innych niż Windows polecenia exec bash i zsh używają migawki startowej. OpenClaw przechwytuje możliwe do source'owania
  aliasy/funkcje i mały bezpieczny zestaw środowiska z plików startowych powłoki do
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, a następnie source'uje tę migawkę przed każdym poleceniem exec.
  Zmienne wyglądające jak sekrety są wykluczane; exec w sandboxie i na Node nie używa tej migawki. Ustaw
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` w środowisku procesu Gateway, aby wyłączyć tę ścieżkę migawki.
- Wykonywanie na hoście (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec podmianie binariów albo wstrzykniętemu kodowi.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym przy wykonywaniu w PTY i sandboxie), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- Dla uruchomień pochodzących z kanału OpenClaw udostępnia także wąski ładunek JSON tożsamości nadawcy/czatu w
  `OPENCLAW_CHANNEL_CONTEXT`, gdy kanał dostarczył te identyfikatory.
- `openclaw channels login` jest blokowane z `exec`, ponieważ jest interaktywnym przepływem uwierzytelniania kanału; uruchom je w terminalu na hoście Gateway albo użyj natywnego narzędzia logowania kanału z czatu, gdy takie istnieje.
- Ważne: sandboxing jest **domyślnie wyłączony**. Jeśli sandboxing jest wyłączony, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się zamkniętą porażką zamiast po cichu
  uruchamiać polecenie na hoście Gateway. Włącz sandboxing albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole preflight skryptów (dla typowych pomyłek składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, preflight jest pomijany dla
  tego pliku.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po ukończeniu, gdy jest włączone i polecenie emituje wyjście albo kończy się błędem.
  Używaj `process` do logów, statusu, wejścia albo interwencji; nie emuluj
  planowania pętlami sleep, pętlami timeout ani powtarzanym odpytywaniem.
- Dla pracy, która ma wydarzyć się później albo według harmonogramu, użyj Cron zamiast
  wzorców sleep/delay przez `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione do tła dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy wyjściu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): wyemituj pojedyncze powiadomienie „działa”, gdy exec z bramką zatwierdzenia działa dłużej niż tyle (0 wyłącza).
- `tools.exec.timeoutSec` (domyślnie: 1800): domyślny limit czasu exec na polecenie w sekundach. `timeout` na poziomie wywołania go nadpisuje; `timeout: 0` na poziomie wywołania wyłącza limit czasu procesu exec.
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy środowisko uruchomieniowe sandboxa jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla sandboxa, `full` dla Gateway + Node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Exec hosta bez zatwierdzeń jest domyślne dla Gateway + Node. Jeśli chcesz zachowanie zatwierdzeń/allowlist, zaostrz zarówno `tools.exec.*`, jak i plik zatwierdzeń hosta; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO pochodzi z domyślnych polityk hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing przez Gateway albo Node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` exec hosta bezpośrednio przestrzega skonfigurowanej polityki; nie ma dodatkowej heurystycznej warstwy prefiltra maskowania poleceń ani odrzucania preflight skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formularze eval interpreterów inline, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, wymagają recenzenta albo jawnego zatwierdzenia. W `mode=auto` normalna ścieżka zatwierdzania exec może pozwolić natywnemu automatycznemu recenzentowi dopuścić jednoznacznie niskiego ryzyka jednorazowe polecenie; bezpośrednie wywołania `system.run` na hoście Node nadal wymagają jawnego zatwierdzenia, ponieważ nie mogą przekazać polecenia do ludzkiej ścieżki zatwierdzania. Jeśli recenzent pyta, żądanie trafia do człowieka. `allow-always` nadal może utrwalać łagodne wywołania interpretera/skryptu, ale formularze inline-eval nie stają się trwałymi regułami allow.
- `tools.exec.commandHighlighting` (domyślnie: false): gdy true, monity zatwierdzeń mogą podświetlać zakresy poleceń wyprowadzone przez parser w tekście polecenia. Ustaw na `true` globalnie albo per agent, aby włączyć podświetlanie tekstu polecenia bez zmiany polityki zatwierdzania exec.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początku `PATH` dla uruchomień exec (tylko Gateway + sandbox).
- `tools.exec.safeBins`: bezpieczne binaria tylko ze stdin, które mogą działać bez jawnych wpisów allowlist. Szczegóły zachowania znajdziesz w [Bezpieczne binaria](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa polityka argv per bezpieczne binarium (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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
  odrzucane dla wykonywania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Aby zapobiec nadpisywaniu ścieżek priorytetowych podczas startu przez konfigurację powłoki użytkownika (taką jak `~/.zshenv` albo `/etc/zshenv`), wpisy `tools.exec.pathPrepend` są bezpiecznie dodawane na początek końcowego `PATH` wewnątrz polecenia powłoki tuż przed wykonaniem.
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, więc `/etc/profile` może zresetować `PATH`.
  OpenClaw dodaje `env.PATH` po source'owaniu profilu przez wewnętrzną zmienną env (bez interpolacji powłoki);
  `tools.exec.pathPrepend` ma tu także zastosowanie.
- `host=node`: do Node wysyłane są tylko nieblokowane nadpisania env, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Wiązanie Node per agent (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Exec node binding” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić domyślne wartości **per sesja** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby pokazać bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest respektowane tylko dla **autoryzowanych nadawców** (listy dozwolonych kanału/parowanie oraz `commands.useAccessGroups`).
Aktualizuje wyłącznie **stan sesji** i nie zapisuje konfiguracji. Autoryzowani nadawcy z kanałów zewnętrznych mogą
ustawiać te domyślne wartości sesji. Wewnętrzni klienci gateway/webchat potrzebują `operator.admin`, aby je utrwalić.
Aby całkowicie wyłączyć exec, zablokuj je przez politykę narzędzi (`tools.deny: ["exec"]` lub per agent). Zatwierdzenia hosta
nadal obowiązują, chyba że jawnie ustawisz `security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host węzła)

Agenci w sandboxie mogą wymagać zatwierdzenia dla każdego żądania, zanim `exec` uruchomi się na Gateway lub hoście węzła.
Zobacz [zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać politykę, listę dozwolonych i przepływ UI.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca
`status: "approval-pending"` oraz identyfikator zatwierdzenia. Po zatwierdzeniu (albo odrzuceniu / przekroczeniu limitu czasu)
Gateway emituje zdarzenia systemowe postępu polecenia i zakończenia tylko dla zatwierdzonych uruchomień
(`Exec running` / `Exec finished`). Odrzucone zatwierdzenia lub te po przekroczeniu limitu czasu są terminalne i nie
wybudzają sesji agenta zdarzeniem systemowym odmowy.
W kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien najpierw polegać na tym
natywnym UI i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia
jednoznacznie mówi, że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Lista dozwolonych + bezpieczne binaria

Ręczne egzekwowanie listy dozwolonych dopasowuje globy rozwiązanych ścieżek binarnych oraz globy samych nazw poleceń.
Same nazwy dopasowują tylko polecenia wywołane przez PATH, więc `rg` może dopasować
`/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale nie `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku
jest na liście dozwolonych albo jest bezpiecznym binarium. Łączenie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie listy dozwolonych, chyba że każdy segment najwyższego poziomu spełnia
listę dozwolonych (w tym bezpieczne binaria). Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: połączone polecenie nadal wymaga, aby każdy
segment najwyższego poziomu pasował.

`autoAllowSkills` to osobna wygodna ścieżka w zatwierdzeniach exec. Nie jest tym samym co
ręczne wpisy ścieżek na liście dozwolonych. Dla ścisłego, jawnego zaufania pozostaw `autoAllowSkills` wyłączone.

Używaj tych dwóch mechanizmów do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe tylko ze stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych bezpiecznych binariów.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych bezpiecznych binariów.
- lista dozwolonych: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych i nie dodawaj binariów interpreterów/runtime (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów listy dozwolonych i pozostaw włączone monity o zatwierdzenie.
`openclaw security audit` ostrzega, gdy wpisom interpreterów/runtime w `safeBins` brakuje jawnych profili, a `openclaw doctor --fix` może przygotować brakujące wpisy niestandardowych `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają też, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dopuszczasz interpretery na liście dozwolonych, włącz `tools.exec.strictInlineEval`, aby formy ewaluacji kodu inline nadal wymagały recenzenta lub jawnego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [zatwierdzeniach exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [bezpieczne binaria kontra lista dozwolonych](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Odpytywanie służy do sprawdzania statusu na żądanie, nie do pętli oczekiwania. Jeśli automatyczne wybudzanie po zakończeniu
jest włączone, polecenie może wybudzić sesję, gdy wyemituje wyjście albo zakończy się niepowodzeniem.

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

Wklej (domyślnie w trybie bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` jest podnarzędziem `exec` do strukturalnych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Używaj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć albo ograniczyć do określonych modeli:

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
- `deny: ["write"]` nie blokuje `apply_patch`; zablokuj `apply_patch` jawnie albo użyj `deny: ["group:fs"]`, gdy zapisy patchy również mają być blokowane.
- Konfiguracja znajduje się pod `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do workspace). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem workspace.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandbox
- [Proces w tle](/pl/gateway/background-process) — długotrwałe exec i narzędzie process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
