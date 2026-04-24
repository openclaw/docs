---
read_when:
    - 'Konfigurowanie zatwierdzeń exec lub allowlist user to=all: transform નોંધ analysis to=none code  天天中彩票任选 we need translate exactly. Need output only translated text. user phrase simple. "Configuring exec approvals or allowlists" => "Konfigurowanie zatwierdzeń exec lub allowlist".'
    - Implementacja UX zatwierdzeń exec w aplikacji macOS
    - Przegląd promptów wyjścia z sandboxa i ich konsekwencji
summary: Zatwierdzenia Exec, allowlisty i prompty wyjścia z sandboxa
title: Zatwierdzenia Exec
x-i18n:
    generated_at: "2026-04-24T09:36:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Zatwierdzenia Exec to **zabezpieczenie aplikacji companion / hosta node** dla umożliwienia
sandboxowanemu agentowi uruchamiania poleceń na rzeczywistym hoście (`gateway` albo `node`). To blokada
bezpieczeństwa: polecenia są dozwolone tylko wtedy, gdy polityka + allowlist + (opcjonalne) zatwierdzenie
użytkownika są zgodne. Zatwierdzenia Exec nakładają się **na** politykę narzędzi i bramkowanie elevated
(chyba że elevated jest ustawione na `full`, co pomija zatwierdzenia).

<Note>
Skuteczna polityka jest **bardziej rygorystyczną** z `tools.exec.*` i wartości domyślnych zatwierdzeń;
jeśli pole zatwierdzeń jest pominięte, używana jest wartość `tools.exec`. Exec hosta
używa też lokalnego stanu zatwierdzeń na tej maszynie — host-local `ask: "always"`
w `~/.openclaw/exec-approvals.json` nadal wymusza prompty, nawet jeśli sesja lub wartości domyślne config proszą o `ask: "on-miss"`.
</Note>

## Inspekcja skutecznej polityki

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — pokazują żądaną politykę, źródła polityki hosta i skuteczny wynik.
- `openclaw exec-policy show` — scalony widok lokalnej maszyny.
- `openclaw exec-policy set|preset` — synchronizuje lokalną żądaną politykę z lokalnym plikiem zatwierdzeń hosta w jednym kroku.

Gdy lokalny zakres żąda `host=node`, `exec-policy show` raportuje ten zakres
jako zarządzany przez node w runtime zamiast udawać, że lokalny plik zatwierdzeń jest
źródłem prawdy.

Jeśli UI aplikacji companion **nie jest dostępne**, każde żądanie, które normalnie
wymagałoby promptu, jest rozstrzygane przez **ask fallback** (domyślnie: deny).

<Tip>
Natywni klienci zatwierdzeń czatu mogą zasiewać affordance specyficzne dla kanału w
wiadomości oczekującej na zatwierdzenie. Na przykład Matrix zasiewa skróty reakcji (`✅`
zezwól raz, `❌` odmów, `♾️` zezwól zawsze), pozostawiając jednocześnie polecenia
`/approve ...` w wiadomości jako fallback.
</Tip>

## Gdzie to obowiązuje

Zatwierdzenia Exec są egzekwowane lokalnie na hoście wykonania:

- **host gateway** → proces `openclaw` na maszynie gateway
- **host node** → runner node (aplikacja companion macOS albo bezgłowy host node)

Uwaga o modelu zaufania:

- Wywołujący uwierzytelnieni względem Gateway są zaufanymi operatorami tego Gateway.
- Sparowane Node rozszerzają tę możliwość zaufanego operatora na host node.
- Zatwierdzenia Exec zmniejszają ryzyko przypadkowego wykonania, ale nie są granicą auth per użytkownik.
- Zatwierdzone uruchomienia na hoście node wiążą kanoniczny kontekst wykonania: kanoniczne cwd, dokładne argv, powiązanie env
  gdy jest obecne, oraz przypiętą ścieżkę wykonywalną, jeśli ma zastosowanie.
- Dla skryptów shella i bezpośrednich wywołań plików interpretera/runtime OpenClaw także próbuje wiązać
  jeden konkretny lokalny operand pliku. Jeśli ten związany plik zmieni się po zatwierdzeniu, ale przed wykonaniem,
  uruchomienie zostaje odrzucone zamiast wykonywać zmienioną treść.
- To wiązanie pliku jest celowo best-effort, a nie kompletnym modelem semantycznym każdej
  ścieżki ładowania interpretera/runtime. Jeśli tryb zatwierdzania nie potrafi zidentyfikować dokładnie jednego konkretnego lokalnego
  pliku do związania, odmawia utworzenia uruchomienia wspartego zatwierdzeniem zamiast udawać pełne pokrycie.

Podział macOS:

- **usługa hosta node** przekazuje `system.run` do **aplikacji macOS** przez lokalne IPC.
- **aplikacja macOS** egzekwuje zatwierdzenia + wykonuje polecenie w kontekście UI.

## Ustawienia i przechowywanie

Zatwierdzenia znajdują się w lokalnym pliku JSON na hoście wykonania:

`~/.openclaw/exec-approvals.json`

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

## Tryb „YOLO” bez zatwierdzeń

Jeśli chcesz, aby exec hosta działał bez promptów zatwierdzeń, musisz otworzyć **obie** warstwy polityki:

- żądana polityka exec w config OpenClaw (`tools.exec.*`)
- host-local polityka zatwierdzeń w `~/.openclaw/exec-approvals.json`

To jest teraz domyślne zachowanie hosta, chyba że jawnie je zaostrzysz:

- `tools.exec.security`: `full` na `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Ważne rozróżnienie:

- `tools.exec.host=auto` wybiera miejsce uruchomienia exec: sandbox, gdy jest dostępny, w przeciwnym razie gateway.
- YOLO wybiera sposób zatwierdzania exec hosta: `security=full` plus `ask=off`.
- Dostawcy oparci na CLI, którzy udostępniają własny nieinteraktywny tryb uprawnień, mogą stosować tę politykę.
  Claude CLI dodaje `--permission-mode bypassPermissions`, gdy żądana polityka exec OpenClaw to
  YOLO. Nadpisz to zachowanie backendu jawnymi argumentami Claude w
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, na przykład
  `--permission-mode default`, `acceptEdits` lub `bypassPermissions`.
- W trybie YOLO OpenClaw nie dodaje osobnej heurystycznej bramki zatwierdzania zaciemniania poleceń ani warstwy odrzucania skryptów przed lotem ponad skonfigurowaną politykę exec hosta.
- `auto` nie zamienia routingu gateway w darmowe nadpisanie z sandboxowanej sesji. Żądanie per wywołanie `host=node` jest dozwolone z `auto`, a `host=gateway` jest dozwolone z `auto` tylko wtedy, gdy nie jest aktywny runtime sandboxa. Jeśli chcesz stabilnej wartości domyślnej innej niż auto, ustaw jawnie `tools.exec.host` albo użyj `/exec host=...`.

Jeśli chcesz bardziej zachowawczej konfiguracji, zaostrz z powrotem dowolną warstwę do `allowlist` / `on-miss`
albo `deny`.

Trwała konfiguracja hosta gateway „nigdy nie pytaj”:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Następnie ustaw zgodny plik zatwierdzeń hosta:

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

Lokalny skrót dla tej samej polityki hosta gateway na bieżącej maszynie:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje oba elementy:

- lokalne `tools.exec.host/security/ask`
- lokalne wartości domyślne `~/.openclaw/exec-approvals.json`

Jest on celowo tylko lokalny. Jeśli musisz zmienić zatwierdzenia hosta gateway albo hosta node
zdalnie, nadal używaj `openclaw approvals set --gateway` albo
`openclaw approvals set --node <id|name|ip>`.

Dla hosta node zastosuj ten sam plik zatwierdzeń na tym node zamiast tego:

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

Ważne ograniczenie tylko lokalne:

- `openclaw exec-policy` nie synchronizuje zatwierdzeń node
- `openclaw exec-policy set --host node` jest odrzucane
- zatwierdzenia exec node są pobierane z node w runtime, więc aktualizacje skierowane do node muszą używać `openclaw approvals --node ...`

Skrót tylko dla sesji:

- `/exec security=full ask=off` zmienia tylko bieżącą sesję.
- `/elevated full` to skrót break-glass, który również pomija zatwierdzenia exec dla tej sesji.

Jeśli plik zatwierdzeń hosta pozostaje bardziej rygorystyczny niż config, nadal wygrywa bardziej rygorystyczna polityka hosta.

## Pokrętła polityki

### Security (`exec.security`)

- **deny**: blokuj wszystkie żądania exec hosta.
- **allowlist**: zezwalaj tylko na polecenia z allowlist.
- **full**: zezwalaj na wszystko (odpowiednik elevated).

### Ask (`exec.ask`)

- **off**: nigdy nie wyświetlaj promptu.
- **on-miss**: wyświetlaj prompt tylko wtedy, gdy allowlist nie pasuje.
- **always**: wyświetlaj prompt przy każdym poleceniu.
- trwałe zaufanie `allow-always` nie tłumi promptów, gdy skuteczny tryb ask to `always`

### Ask fallback (`askFallback`)

Jeśli prompt jest wymagany, ale żaden UI nie jest osiągalny, fallback decyduje:

- **deny**: blokuj.
- **allowlist**: zezwalaj tylko, jeśli allowlist pasuje.
- **full**: zezwalaj.

### Utwardzanie inline interpreter eval (`tools.exec.strictInlineEval`)

Gdy `tools.exec.strictInlineEval=true`, OpenClaw traktuje formy inline code-eval jako wymagające wyłącznie zatwierdzenia, nawet jeśli sam binarny interpreter znajduje się na allowlist.

Przykłady:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

To defense-in-depth dla loaderów interpreterów, które nie mapują się czysto na jeden stabilny operand pliku. W trybie ścisłym:

- te polecenia nadal wymagają jawnego zatwierdzenia;
- `allow-always` nie utrwala dla nich automatycznie nowych wpisów allowlist.

## Allowlist (per agent)

Allowlisty są **per agent**. Jeśli istnieje wielu agentów, przełącz, którego agenta
edytujesz, w aplikacji macOS. Wzorce są **glob matchami niewrażliwymi na wielkość liter**.
Wzorce powinny rozwiązywać się do **ścieżek binarnych** (wpisy zawierające tylko basename są ignorowane).
Starsze wpisy `agents.default` są migrowane do `agents.main` podczas ładowania.
Łańcuchy shella takie jak `echo ok && pwd` nadal wymagają, aby każdy segment najwyższego poziomu spełniał reguły allowlist.

Przykłady:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Każdy wpis allowlist śledzi:

- **id** stabilny UUID używany dla tożsamości w UI (opcjonalnie)
- znacznik czasu **last used**
- **last used command**
- **last resolved path**

## Automatyczne zezwalanie na CLI Skills

Gdy włączone jest **Auto-allow skill CLIs**, pliki wykonywalne, do których odwołują się znane Skills,
są traktowane na Node jak wpisy z allowlist (macOS node albo bezgłowy host node). Używa to
`skills.bins` przez Gateway RPC do pobrania listy bin Skill. Wyłącz to, jeśli chcesz ścisłych ręcznych allowlist.

Ważne uwagi o zaufaniu:

- To **niejawna wygodna allowlist**, oddzielna od ręcznych wpisów allowlist ścieżek.
- Jest przeznaczona dla środowisk zaufanego operatora, gdzie Gateway i node znajdują się w tej samej granicy zaufania.
- Jeśli wymagasz ścisłego jawnego zaufania, pozostaw `autoAllowSkills: false` i używaj wyłącznie ręcznych wpisów allowlist ścieżek.

## Safe bins i przekazywanie zatwierdzeń

Informacje o safe bins (szybka ścieżka tylko-stdin), szczegółach wiązania interpreterów i o tym,
jak przekazywać prompty zatwierdzeń do Slack/Discord/Telegram (albo uruchamiać je jako natywnych
klientów zatwierdzeń), znajdziesz w [Exec approvals — advanced](/pl/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Edycja w Control UI

Użyj karty **Control UI → Nodes → Exec approvals**, aby edytować wartości domyślne, nadpisania
per agent i allowlisty. Wybierz zakres (Defaults albo agent), dostrój politykę,
dodaj/usuń wzorce allowlist, a następnie kliknij **Save**. UI pokazuje metadane **last used**
dla każdego wzorca, aby łatwo utrzymać porządek na liście.

Selektor celu wybiera **Gateway** (lokalne zatwierdzenia) albo **Node**. Node
muszą reklamować `system.execApprovals.get/set` (aplikacja macOS albo bezgłowy host node).
Jeśli node nie reklamuje jeszcze exec approvals, edytuj bezpośrednio jego lokalne
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` obsługuje edycję gateway albo node (zobacz [CLI zatwierdzeń](/pl/cli/approvals)).

## Przepływ zatwierdzeń

Gdy wymagany jest prompt, gateway rozgłasza `exec.approval.requested` do klientów operatora.
Control UI i aplikacja macOS rozstrzygają go przez `exec.approval.resolve`, a następnie gateway przekazuje
zatwierdzone żądanie do hosta node.

Dla `host=node` żądania zatwierdzenia zawierają kanoniczny ładunek `systemRunPlan`. Gateway używa
tego planu jako autorytatywnego kontekstu polecenia/cwd/sesji przy przekazywaniu zatwierdzonych żądań `system.run`.

Ma to znaczenie przy opóźnieniu asynchronicznego zatwierdzania:

- ścieżka exec node przygotowuje z góry jeden kanoniczny plan
- rekord zatwierdzenia przechowuje ten plan i jego metadane wiązania
- po zatwierdzeniu końcowe przekazane wywołanie `system.run` ponownie używa przechowanego planu,
  zamiast ufać późniejszym edycjom wywołującego
- jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` albo
  `sessionKey` po utworzeniu żądania zatwierdzenia, gateway odrzuca
  przekazane uruchomienie jako niedopasowanie zatwierdzenia

## Zdarzenia systemowe

Cykl życia Exec jest prezentowany jako wiadomości systemowe:

- `Exec running` (tylko jeśli polecenie przekroczy próg powiadomienia o uruchomieniu)
- `Exec finished`
- `Exec denied`

Są one publikowane w sesji agenta po zgłoszeniu zdarzenia przez node.
Zatwierdzenia exec hosta gateway emitują te same zdarzenia cyklu życia, gdy polecenie się zakończy (oraz opcjonalnie, gdy działa dłużej niż próg).
Exec z bramkowaniem zatwierdzeń ponownie używa identyfikatora zatwierdzenia jako `runId` w tych wiadomościach dla łatwej korelacji.

## Zachowanie przy odrzuconym zatwierdzeniu

Gdy asynchroniczne zatwierdzenie exec zostanie odrzucone, OpenClaw uniemożliwia agentowi ponowne użycie
wyniku z jakiegokolwiek wcześniejszego uruchomienia tego samego polecenia w sesji. Powód odrzucenia
jest przekazywany wraz z jawną informacją, że żaden wynik polecenia nie jest dostępny, co powstrzymuje
agenta przed twierdzeniem, że istnieje nowy wynik, albo przed ponownym powtórzeniem odrzuconego polecenia z
nieaktualnymi wynikami z wcześniejszego udanego uruchomienia.

## Konsekwencje

- **full** jest potężne; gdy to możliwe, preferuj allowlisty.
- **ask** utrzymuje cię w pętli, nadal pozwalając na szybkie zatwierdzenia.
- Allowlisty per agent zapobiegają przenikaniu zatwierdzeń jednego agenta do innych.
- Zatwierdzenia mają zastosowanie tylko do żądań exec hosta od **autoryzowanych nadawców**. Nieautoryzowani nadawcy nie mogą wydawać `/exec`.
- `/exec security=full` to wygodny skrót na poziomie sesji dla autoryzowanych operatorów i zgodnie z projektem pomija zatwierdzenia. Aby całkowicie zablokować exec hosta, ustaw security zatwierdzeń na `deny` albo zabroń narzędzia `exec` przez politykę narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/pl/tools/exec-approvals-advanced" icon="gear">
    Safe bins, wiązanie interpreterów i przekazywanie zatwierdzeń do czatu.
  </Card>
  <Card title="Exec tool" href="/pl/tools/exec" icon="terminal">
    Narzędzie do wykonywania poleceń shella.
  </Card>
  <Card title="Elevated mode" href="/pl/tools/elevated" icon="shield-exclamation">
    Ścieżka break-glass, która również pomija zatwierdzenia.
  </Card>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing" icon="box">
    Tryby sandboxa i dostęp do obszaru roboczego.
  </Card>
  <Card title="Security" href="/pl/gateway/security" icon="lock">
    Model bezpieczeństwa i utwardzanie.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kiedy sięgać po każdą z tych kontrolek.
  </Card>
  <Card title="Skills" href="/pl/tools/skills" icon="sparkles">
    Zachowanie auto-allow oparte na Skills.
  </Card>
</CardGroup>
