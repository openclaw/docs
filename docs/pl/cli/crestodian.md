---
read_when:
    - Uruchamiasz openclaw bez żadnego polecenia i chcesz zrozumieć Crestodian
    - Potrzebujesz sposobu bezpiecznego bez konfiguracji, aby sprawdzić lub naprawić OpenClaw
    - Projektujesz lub włączasz tryb ratunkowy kanału wiadomości
summary: Dokumentacja CLI i model bezpieczeństwa Crestodian, pomocnika konfiguracji i naprawy bezpiecznego w trybie bez konfiguracji
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T09:42:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian to lokalny pomocnik OpenClaw do konfiguracji, naprawy i ustawień. Został
zaprojektowany tak, aby pozostawał dostępny, gdy normalna ścieżka agenta jest uszkodzona.

Uruchomienie `openclaw` bez polecenia uruchamia Crestodian w interaktywnym terminalu.
Uruchomienie `openclaw crestodian` jawnie uruchamia tego samego pomocnika.

## Co pokazuje Crestodian

Przy starcie interaktywny Crestodian otwiera tę samą powłokę TUI, której używa
`openclaw tui`, z backendem czatu Crestodian. Dziennik czatu zaczyna się od krótkiego
powitania:

- kiedy uruchomić Crestodian
- model lub ścieżka deterministycznego planera, której Crestodian faktycznie używa
- poprawność konfiguracji i domyślny agent
- osiągalność Gateway z pierwszej sondy startowej
- następna czynność debugowania, którą Crestodian może wykonać

Nie zrzuca sekretów ani nie ładuje poleceń CLI pluginu tylko po to, aby się uruchomić. TUI
nadal udostępnia normalny nagłówek, dziennik czatu, wiersz stanu, stopkę, autouzupełnianie
i kontrolki edytora.

Użyj `status`, aby uzyskać szczegółowy spis ze ścieżką konfiguracji, ścieżkami dokumentacji/źródeł,
lokalnymi sondami CLI, obecnością kluczy API, agentami, modelem i szczegółami Gateway.

Crestodian używa tego samego mechanizmu odkrywania referencji OpenClaw co zwykli agenci. W checkoutcie Git
wskazuje na lokalne `docs/` i lokalne drzewo źródeł. W instalacji pakietu npm
używa dołączonej dokumentacji pakietu i linkuje do
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), z wyraźnym
zaleceniem przejrzenia źródeł, gdy dokumentacja nie wystarcza.

## Przykłady

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

W TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Bezpieczny start

Ścieżka startowa Crestodian jest celowo mała. Może działać, gdy:

- brakuje `openclaw.json`
- `openclaw.json` jest niepoprawny
- Gateway nie działa
- rejestracja poleceń pluginów jest niedostępna
- nie skonfigurowano jeszcze żadnego agenta

`openclaw --help` i `openclaw --version` nadal używają normalnych szybkich ścieżek.
Nieinteraktywny `openclaw` kończy działanie krótkim komunikatem zamiast drukować pomoc główną,
ponieważ produktem bez polecenia jest Crestodian.

## Operacje i zatwierdzanie

Crestodian używa typowanych operacji zamiast doraźnego edytowania konfiguracji.

Operacje tylko do odczytu mogą zostać uruchomione od razu:

- pokaż przegląd
- wyświetl agentów
- pokaż stan modelu/backendu
- uruchom sprawdzenia stanu lub kondycji
- sprawdź osiągalność Gateway
- uruchom doctor bez interaktywnych napraw
- zweryfikuj konfigurację
- pokaż ścieżkę dziennika audytu

Operacje trwałe wymagają konwersacyjnego zatwierdzenia w trybie interaktywnym, chyba że
przekażesz `--yes` dla bezpośredniego polecenia:

- zapisz konfigurację
- uruchom `config set`
- ustaw obsługiwane wartości SecretRef przez `config set-ref`
- uruchom bootstrap konfiguracji/onboardingu
- zmień domyślny model
- uruchom, zatrzymaj lub zrestartuj Gateway
- utwórz agentów
- uruchom naprawy doctor, które przepisują konfigurację lub stan

Zastosowane zapisy są rejestrowane w:

```text
~/.openclaw/audit/crestodian.jsonl
```

Odkrywanie nie jest audytowane. Rejestrowane są tylko zastosowane operacje i zapisy.

`openclaw onboard --modern` uruchamia Crestodian jako nowoczesny podgląd onboardingu.
Zwykłe `openclaw onboard` nadal uruchamia klasyczny onboarding.

## Bootstrap konfiguracji

`setup` to bootstrap onboardingu nastawiony na czat. Zapisuje tylko przez typowane
operacje konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Gdy nie skonfigurowano modelu, setup wybiera pierwszy użyteczny backend w tej
kolejności i informuje, co wybrał:

- istniejący jawny model, jeśli już skonfigurowany
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jeśli żaden nie jest dostępny, setup nadal zapisuje domyślny workspace i pozostawia
model nieustawiony. Zainstaluj lub zaloguj się do Codex/Claude Code albo udostępnij
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, a następnie uruchom setup ponownie.

## Planer wspomagany modelem

Crestodian zawsze startuje w trybie deterministycznym. Dla nieprecyzyjnych poleceń, których
deterministyczny parser nie rozumie, lokalny Crestodian może wykonać jedną ograniczoną
turę planera przez normalne ścieżki runtime OpenClaw. Najpierw używa
skonfigurowanego modelu OpenClaw. Jeśli żaden skonfigurowany model nie jest jeszcze użyteczny, może
przejść awaryjnie na lokalne runtime'y już obecne na maszynie:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- uprząż Codex app-server: `openai/gpt-5.5` z `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Planer wspomagany modelem nie może bezpośrednio mutować konfiguracji. Musi przetłumaczyć
żądanie na jedno z typowanych poleceń Crestodian, a następnie obowiązują normalne reguły
zatwierdzania i audytu. Crestodian drukuje model, którego użył, oraz zinterpretowane
polecenie, zanim cokolwiek uruchomi. Tury planera awaryjnego bez konfiguracji są
tymczasowe, z wyłączonymi narzędziami tam, gdzie runtime to obsługuje, i używają tymczasowego
workspace/sesji.

Tryb ratunkowy kanału wiadomości nie używa planera wspomaganego modelem. Zdalne
ratowanie pozostaje deterministyczne, aby uszkodzona lub przejęta normalna ścieżka agenta nie mogła
zostać użyta jako edytor konfiguracji.

## Przełączanie na agenta

Użyj selektora w języku naturalnym, aby opuścić Crestodian i otworzyć normalny TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` nadal otwierają bezpośrednio normalny
TUI agenta. Nie uruchamiają Crestodian.

Po przełączeniu do normalnego TUI użyj `/crestodian`, aby wrócić do Crestodian.
Możesz dołączyć kolejne żądanie:

```text
/crestodian
/crestodian restart gateway
```

Przełączenia agentów wewnątrz TUI zostawiają ślad informujący, że `/crestodian` jest dostępny.

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości to punkt wejścia kanału wiadomości dla Crestodian. Służy do
przypadku, gdy normalny agent nie działa, ale zaufany kanał, taki jak WhatsApp,
nadal odbiera polecenia.

Obsługiwane polecenie tekstowe:

- `/crestodian <request>`

Przepływ operatora:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Tworzenie agenta można również zakolejkować z lokalnego promptu lub trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Zdalny tryb ratunkowy jest powierzchnią administracyjną. Należy go traktować jak zdalną
naprawę konfiguracji, a nie jak normalny czat.

Kontrakt bezpieczeństwa dla zdalnego ratowania:

- Wyłączone, gdy sandboxing jest aktywny. Jeśli agent/sesja działa w piaskownicy,
  Crestodian musi odmówić zdalnego ratowania i wyjaśnić, że wymagana jest
  lokalna naprawa CLI.
- Domyślny stan efektywny to `auto`: zezwalaj na zdalne ratowanie tylko w zaufanej
  operacji YOLO, gdzie runtime ma już lokalne uprawnienia bez piaskownicy.
- Wymagaj jawnej tożsamości właściciela. Ratowanie nie może akceptować reguł nadawcy z symbolem wieloznacznym,
  otwartej polityki grupy, nieuwierzytelnionych webhooków ani anonimowych kanałów.
- Domyślnie tylko wiadomości DM właściciela. Ratowanie grup/kanałów wymaga jawnego opt-in.
- Zdalne ratowanie nie może otwierać lokalnego TUI ani przełączać się do interaktywnej
  sesji agenta. Do przekazania agenta użyj lokalnego `openclaw`.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Audytuj każdą zastosowaną operację ratunkową. Ratowanie przez kanał wiadomości rejestruje kanał,
  konto, nadawcę i metadane adresu źródłowego. Operacje mutujące konfigurację rejestrują również
  skróty konfiguracji przed i po.
- Nigdy nie powtarzaj sekretów. Inspekcja SecretRef powinna zgłaszać dostępność, a nie
  wartości.
- Jeśli Gateway działa, preferuj typowane operacje Gateway. Jeśli Gateway nie działa,
  używaj tylko minimalnej lokalnej powierzchni naprawy, która nie zależy od
  normalnej pętli agenta.

Kształt konfiguracji:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` powinno akceptować:

- `"auto"`: domyślne. Zezwalaj tylko wtedy, gdy efektywny runtime to YOLO i
  sandboxing jest wyłączony.
- `false`: nigdy nie zezwalaj na ratowanie przez kanał wiadomości.
- `true`: jawnie zezwalaj na ratowanie, gdy kontrole właściciela/kanału przejdą pomyślnie. To
  nadal nie może omijać odmowy wynikającej z sandboxingu.

Domyślna postawa YOLO dla `"auto"` to:

- tryb piaskownicy rozwiązuje się do `off`
- `tools.exec.security` rozwiązuje się do `full`
- `tools.exec.ask` rozwiązuje się do `off`

Zdalne ratowanie jest objęte ścieżką Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Awaryjny lokalny planer bez konfiguracji jest objęty przez:

```bash
pnpm test:docker:crestodian-planner
```

Opcjonalny live smoke powierzchni poleceń kanału sprawdza `/crestodian status` oraz
trwałą rundę zatwierdzenia przez handler ratunkowy:

```bash
pnpm test:live:crestodian-rescue-channel
```

Świeży setup bez konfiguracji przez Crestodian jest objęty przez:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka zaczyna od pustego katalogu stanu, kieruje samo `openclaw` do Crestodian,
ustawia domyślny model, tworzy dodatkowego agenta, konfiguruje Discord przez
włączenie pluginu oraz SecretRef tokenu, weryfikuje konfigurację i sprawdza dziennik audytu.
QA Lab ma również scenariusz oparty na repozytorium dla tego samego przepływu Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Sandbox](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
