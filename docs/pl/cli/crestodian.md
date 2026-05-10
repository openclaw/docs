---
read_when:
    - Uruchamiasz openclaw bez polecenia i chcesz zrozumieć Crestodian
    - Potrzebujesz sposobu bezpiecznego bez konfiguracji, aby sprawdzić lub naprawić OpenClaw
    - Projektujesz lub włączasz tryb ratunkowy kanału wiadomości
summary: Referencja CLI i model bezpieczeństwa dla Crestodian, pomocnika konfiguracji i naprawy bezpiecznego dla pracy bez konfiguracji
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian to lokalny pomocnik OpenClaw do konfiguracji, naprawy i ustawień.
Zaprojektowano go tak, aby pozostawał dostępny, gdy zwykła ścieżka agenta jest uszkodzona.

Uruchomienie `openclaw` bez polecenia uruchamia Crestodian w interaktywnym terminalu.
Uruchomienie `openclaw crestodian` jawnie uruchamia tego samego pomocnika.

## Co pokazuje Crestodian

Podczas startu interaktywny Crestodian otwiera tę samą powłokę TUI, której używa
`openclaw tui`, z backendem czatu Crestodian. Dziennik czatu zaczyna się krótkim
powitaniem:

- kiedy uruchomić Crestodian
- model lub deterministyczna ścieżka planisty, której Crestodian faktycznie używa
- poprawność konfiguracji i domyślny agent
- osiągalność Gateway z pierwszej sondy startowej
- następna czynność debugowania, którą Crestodian może wykonać

Nie zrzuca sekretów ani nie ładuje poleceń CLI Plugin tylko po to, aby wystartować. TUI
nadal udostępnia normalny nagłówek, dziennik czatu, wiersz stanu, stopkę, autouzupełnianie
i kontrolki edytora.

Użyj `status`, aby uzyskać szczegółowy inwentarz ze ścieżką konfiguracji, ścieżkami dokumentacji/źródeł,
lokalnymi sondami CLI, obecnością kluczy API, agentami, modelem i szczegółami Gateway.

Crestodian używa tego samego wykrywania referencji OpenClaw co zwykli agenci. W kopii Git
wskazuje lokalne `docs/` i lokalne drzewo źródeł. W instalacji pakietu npm
używa dokumentacji dołączonej do pakietu i linkuje do
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), z wyraźną
wskazówką, aby przejrzeć źródła, gdy dokumentacja nie wystarcza.

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Bezpieczny start

Ścieżka startowa Crestodian jest celowo mała. Może działać, gdy:

- brakuje `openclaw.json`
- `openclaw.json` jest nieprawidłowy
- Gateway nie działa
- rejestracja poleceń Plugin jest niedostępna
- żaden agent nie został jeszcze skonfigurowany

`openclaw --help` i `openclaw --version` nadal używają normalnych szybkich ścieżek.
Nieinteraktywne `openclaw` kończy działanie krótkim komunikatem zamiast wypisywać główną
pomoc, ponieważ produktem bez polecenia jest Crestodian.

## Operacje i zatwierdzanie

Crestodian używa typowanych operacji zamiast doraźnego edytowania konfiguracji.

Operacje tylko do odczytu mogą działać natychmiast:

- pokaż przegląd
- wyświetl agentów
- wyświetl zainstalowane Plugin
- wyszukaj Plugin ClawHub
- pokaż status modelu/backendu
- uruchom kontrole statusu lub kondycji
- sprawdź osiągalność Gateway
- uruchom doctor bez interaktywnych napraw
- zweryfikuj konfigurację
- pokaż ścieżkę dziennika audytu

Operacje trwałe wymagają zatwierdzenia w rozmowie w trybie interaktywnym, chyba że
przekażesz `--yes` dla bezpośredniego polecenia:

- zapisz konfigurację
- uruchom `config set`
- ustaw obsługiwane wartości SecretRef przez `config set-ref`
- uruchom bootstrap konfiguracji/onboardingu
- zmień domyślny model
- uruchom, zatrzymaj lub zrestartuj Gateway
- utwórz agentów
- zainstaluj Plugin z ClawHub lub npm
- odinstaluj Plugin
- uruchom naprawy doctor, które przepisują konfigurację lub stan

Zastosowane zapisy są rejestrowane w:

```text
~/.openclaw/audit/crestodian.jsonl
```

Wykrywanie nie jest audytowane. Rejestrowane są tylko zastosowane operacje i zapisy.

`openclaw onboard --modern` uruchamia Crestodian jako nowoczesny podgląd onboardingu.
Zwykłe `openclaw onboard` nadal uruchamia klasyczny onboarding.

## Bootstrap konfiguracji

`setup` to onboardingowy bootstrap skoncentrowany na czacie. Zapisuje wyłącznie przez typowane
operacje konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Gdy żaden model nie jest skonfigurowany, setup wybiera pierwszy użyteczny backend w tej
kolejności i informuje, co wybrał:

- istniejący jawny model, jeśli jest już skonfigurowany
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jeśli żaden nie jest dostępny, setup nadal zapisuje domyślny workspace i pozostawia
model nieustawiony. Zainstaluj lub zaloguj się do Codex/Claude Code albo udostępnij
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, a następnie uruchom setup ponownie.

## Planista Wspomagany Modelem

Crestodian zawsze startuje w trybie deterministycznym. Dla nieprecyzyjnych poleceń, których
deterministyczny parser nie rozumie, lokalny Crestodian może wykonać jedną ograniczoną
turę planisty przez normalne ścieżki uruchomieniowe OpenClaw. Najpierw używa
skonfigurowanego modelu OpenClaw. Jeśli żaden skonfigurowany model nie jest jeszcze użyteczny,
może wrócić do lokalnych środowisk uruchomieniowych już obecnych na komputerze:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness serwera aplikacji Codex: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

Planista wspomagany modelem nie może bezpośrednio mutować konfiguracji. Musi przetłumaczyć
żądanie na jedno z typowanych poleceń Crestodian, a następnie stosowane są normalne reguły
zatwierdzania i audytu. Crestodian wypisuje model, którego użył, oraz zinterpretowane
polecenie, zanim cokolwiek uruchomi. Tury awaryjnego planisty bez konfiguracji są
tymczasowe, z wyłączonymi narzędziami tam, gdzie runtime to obsługuje, i używają tymczasowego
workspace/sesji.

Tryb ratunkowy kanału wiadomości nie używa planisty wspomaganego modelem. Zdalny
tryb ratunkowy pozostaje deterministyczny, aby uszkodzona lub przejęta normalna ścieżka agenta
nie mogła zostać użyta jako edytor konfiguracji.

## Przełączanie do agenta

Użyj selektora w języku naturalnym, aby opuścić Crestodian i otworzyć normalne TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` nadal otwierają bezpośrednio normalne
TUI agenta. Nie uruchamiają Crestodian.

Po przełączeniu do normalnego TUI użyj `/crestodian`, aby wrócić do Crestodian.
Możesz dołączyć kolejne żądanie:

```text
/crestodian
/crestodian restart gateway
```

Przełączenia agentów wewnątrz TUI zostawiają ślad informujący, że `/crestodian` jest dostępne.

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości to punkt wejścia kanału wiadomości dla Crestodian. Jest przeznaczony
na przypadek, gdy normalny agent nie działa, ale zaufany kanał taki jak WhatsApp
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

Tworzenie agenta można także zakolejkować z lokalnego promptu lub trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Zdalny tryb ratunkowy to powierzchnia administracyjna. Należy traktować go jak zdalną
naprawę konfiguracji, a nie jak zwykły czat.

Kontrakt bezpieczeństwa dla zdalnego trybu ratunkowego:

- Wyłączony, gdy aktywne jest sandboxing. Jeśli agent/sesja działa w sandboxie,
  Crestodian musi odmówić zdalnego trybu ratunkowego i wyjaśnić, że wymagana jest
  lokalna naprawa CLI.
- Domyślny stan efektywny to `auto`: zezwalaj na zdalny tryb ratunkowy tylko w zaufanej
  pracy YOLO, gdzie runtime ma już niesandboxowane uprawnienia lokalne.
- Wymagaj jawnej tożsamości właściciela. Tryb ratunkowy nie może akceptować reguł nadawcy
  z wildcardami, otwartej polityki grupowej, nieuwierzytelnionych webhooków ani anonimowych kanałów.
- Domyślnie tylko DM właściciela. Tryb ratunkowy w grupie/kanale wymaga jawnego opt-in.
- Wyszukiwanie i lista Plugin są tylko do odczytu. Instalacja Plugin jest domyślnie tylko lokalna,
  ponieważ pobiera wykonywalny kod. Odinstalowanie Plugin może być dozwolone jako
  zatwierdzona operacja naprawcza, gdy polityka trybu ratunkowego pozwala na trwałe zapisy.
- Zdalny tryb ratunkowy nie może otworzyć lokalnego TUI ani przełączyć się do interaktywnej
  sesji agenta. Użyj lokalnego `openclaw` do przekazania do agenta.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Audytuj każdą zastosowaną operację trybu ratunkowego. Tryb ratunkowy kanału wiadomości rejestruje kanał,
  konto, nadawcę i metadane adresu źródłowego. Operacje mutujące konfigurację rejestrują także
  hashe konfiguracji przed i po.
- Nigdy nie wypisuj sekretów. Inspekcja SecretRef powinna raportować dostępność, nie
  wartości.
- Jeśli Gateway działa, preferuj typowane operacje Gateway. Jeśli Gateway nie działa,
  używaj tylko minimalnej lokalnej powierzchni naprawczej, która nie zależy od
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

- `"auto"`: domyślne. Zezwalaj tylko wtedy, gdy efektywny runtime to YOLO, a
  sandboxing jest wyłączony.
- `false`: nigdy nie zezwalaj na tryb ratunkowy kanału wiadomości.
- `true`: jawnie zezwól na tryb ratunkowy, gdy kontrole właściciela/kanału przejdą. To
  nadal nie może omijać odmowy z powodu sandboxingu.

Domyślna postawa YOLO `"auto"` to:

- tryb sandbox rozwiązuje się do `off`
- `tools.exec.security` rozwiązuje się do `full`
- `tools.exec.ask` rozwiązuje się do `off`

Zdalny tryb ratunkowy jest objęty ścieżką Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Lokalny awaryjny planista bez konfiguracji jest objęty przez:

```bash
pnpm test:docker:crestodian-planner
```

Opcjonalny smoke test powierzchni poleceń kanału live sprawdza `/crestodian status` oraz
trwały obieg zatwierdzenia przez handler trybu ratunkowego:

```bash
pnpm test:live:crestodian-rescue-channel
```

Świeża konfiguracja bez istniejącej konfiguracji przez Crestodian jest objęta przez:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka zaczyna od pustego katalogu stanu, kieruje gołe `openclaw` do Crestodian,
ustawia domyślny model, tworzy dodatkowego agenta, konfiguruje Discord przez
włączenie Plugin oraz SecretRef tokenu, weryfikuje konfigurację i sprawdza dziennik audytu.
QA Lab ma także scenariusz oparty na repozytorium dla tego samego przepływu Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Referencja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Sandbox](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
