---
read_when:
    - Uruchamiasz openclaw bez polecenia po konfiguracji i chcesz zrozumieć Crestodian
    - Potrzebujesz sposobu bezpiecznego przy braku konfiguracji, aby sprawdzić lub naprawić OpenClaw
    - Projektujesz lub włączasz tryb ratunkowy kanału wiadomości
summary: Odniesienie CLI i model bezpieczeństwa dla Crestodian, pomocnika do bezpiecznej bezkonfiguracyjnej konfiguracji i naprawy
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian to lokalny pomocnik OpenClaw do konfiguracji, naprawy i ustawień. Jest
zaprojektowany tak, aby pozostawał dostępny, gdy zwykła ścieżka agenta jest uszkodzona.

Uruchomienie `openclaw` bez polecenia najpierw rozpoczyna klasyczne wdrażanie, gdy
aktywny plik konfiguracji nie istnieje albo nie ma autorskich ustawień (jest pusty lub
zawiera tylko metadane). Gdy plik konfiguracji ma już autorskie ustawienia, uruchomienie
`openclaw` bez polecenia uruchamia Crestodian w interaktywnym terminalu. Uruchomienie
`openclaw crestodian` jawnie uruchamia tego samego pomocnika.

## Co pokazuje Crestodian

Przy starcie interaktywny Crestodian otwiera tę samą powłokę TUI, której używa
`openclaw tui`, z backendem czatu Crestodian. Dziennik czatu zaczyna się krótkim
powitaniem:

- kiedy uruchamiać Crestodian
- model lub ścieżkę deterministycznego planera, której Crestodian faktycznie używa
- poprawność konfiguracji i domyślnego agenta
- osiągalność Gateway z pierwszej próby startowej
- następną czynność debugowania, którą Crestodian może wykonać

Nie zrzuca sekretów ani nie ładuje poleceń CLI wtyczek tylko po to, aby wystartować. TUI
nadal udostępnia zwykły nagłówek, dziennik czatu, wiersz stanu, stopkę, autouzupełnianie
i elementy sterujące edytora.

Użyj `status`, aby uzyskać szczegółowy spis ze ścieżką konfiguracji, ścieżkami docs/source,
lokalnymi próbami CLI, obecnością kluczy API, agentami, modelem oraz szczegółami Gateway.

Crestodian używa tego samego mechanizmu wykrywania odniesień OpenClaw co zwykli agenci. W kopii Git
wskazuje sobie lokalne `docs/` i lokalne drzewo źródeł. W instalacji pakietu npm
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
- rejestracja poleceń wtyczek jest niedostępna
- nie skonfigurowano jeszcze żadnego agenta

`openclaw --help` i `openclaw --version` nadal używają zwykłych szybkich ścieżek.
Nieinteraktywne, gołe `openclaw` kończy działanie z krótkim komunikatem zamiast drukować
pomoc główną. W świeżej instalacji komunikat wskazuje na nieinteraktywne wdrażanie;
po konfiguracji wskazuje na jednorazowe polecenia Crestodian.

## Operacje i zatwierdzanie

Crestodian używa typowanych operacji zamiast doraźnie edytować konfigurację.

Operacje tylko do odczytu mogą działać natychmiast:

- pokaż przegląd
- wyświetl agentów
- wyświetl zainstalowane wtyczki
- wyszukaj wtyczki ClawHub
- pokaż stan modelu/backendu
- uruchom kontrole stanu lub kondycji
- sprawdź osiągalność Gateway
- uruchom doctor bez interaktywnych poprawek
- zweryfikuj konfigurację
- pokaż ścieżkę dziennika audytu

Operacje trwałe wymagają zatwierdzenia w rozmowie w trybie interaktywnym, chyba że
przekażesz `--yes` dla bezpośredniego polecenia:

- zapisz konfigurację
- uruchom `config set`
- ustaw obsługiwane wartości SecretRef przez `config set-ref`
- uruchom bootstrap konfiguracji/wdrażania
- zmień domyślny model
- uruchom, zatrzymaj lub zrestartuj Gateway
- utwórz agentów
- zainstaluj wtyczki z ClawHub lub npm
- odinstaluj wtyczki
- uruchom naprawy doctor, które przepisują konfigurację lub stan

Zastosowane zapisy są rejestrowane w:

```text
~/.openclaw/audit/crestodian.jsonl
```

Wykrywanie nie jest audytowane. Rejestrowane są tylko zastosowane operacje i zapisy.

`openclaw onboard --modern` uruchamia Crestodian jako podgląd nowoczesnego wdrażania.
Zwykłe `openclaw onboard` nadal uruchamia klasyczne wdrażanie.

## Bootstrap konfiguracji

`setup` to bootstrap wdrażania z podejściem najpierw przez czat. Zapisuje tylko przez typowane
operacje konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Gdy nie skonfigurowano żadnego modelu, setup wybiera pierwszy użyteczny backend w tej
kolejności i informuje, co wybrał:

- istniejący jawny model, jeśli jest już skonfigurowany
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` przez harness app-server Codex

Jeśli żaden nie jest dostępny, setup nadal zapisuje domyślny workspace i pozostawia
model bez ustawienia. Zainstaluj lub zaloguj się do Codex/Claude Code albo udostępnij
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, a następnie ponownie uruchom setup.

## Planer wspomagany modelem

Crestodian zawsze startuje w trybie deterministycznym. Dla nieprecyzyjnych poleceń, których
deterministyczny parser nie rozumie, lokalny Crestodian może wykonać jeden ograniczony
krok planera przez zwykłe ścieżki runtime OpenClaw. Najpierw używa
skonfigurowanego modelu OpenClaw. Jeśli żaden skonfigurowany model nie jest jeszcze użyteczny, może
wrócić do lokalnych runtime już obecnych na maszynie:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- harness app-server Codex: `openai/gpt-5.5`

Planer wspomagany modelem nie może bezpośrednio modyfikować konfiguracji. Musi przetłumaczyć
żądanie na jedno z typowanych poleceń Crestodian, a następnie obowiązują zwykłe reguły
zatwierdzania i audytu. Crestodian wypisuje model, którego użył, oraz zinterpretowane
polecenie, zanim cokolwiek uruchomi. Zapasowe kroki planera bez konfiguracji są
tymczasowe, bez narzędzi tam, gdzie runtime to obsługuje, i używają tymczasowego
workspace/sesji.

Tryb ratunkowy kanału wiadomości nie używa planera wspomaganego modelem. Zdalne
ratowanie pozostaje deterministyczne, aby uszkodzona lub przejęta zwykła ścieżka agenta nie
mogła zostać użyta jako edytor konfiguracji.

## Przełączanie na agenta

Użyj selektora w języku naturalnym, aby opuścić Crestodian i otworzyć zwykłe TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` nadal otwierają bezpośrednio zwykłe
TUI agenta. Nie uruchamiają Crestodian.

Po przełączeniu do zwykłego TUI użyj `/crestodian`, aby wrócić do Crestodian.
Możesz dołączyć żądanie uzupełniające:

```text
/crestodian
/crestodian restart gateway
```

Przełączenia agentów wewnątrz TUI zostawiają wskazówkę, że `/crestodian` jest dostępne.

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości to punkt wejścia kanału wiadomości dla Crestodian. Jest przeznaczony
na przypadek, gdy zwykły agent nie działa, ale zaufany kanał, taki jak WhatsApp,
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

Tworzenie agenta można też zakolejkować z lokalnego promptu lub trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Zdalny tryb ratunkowy jest powierzchnią administracyjną. Należy go traktować jak zdalną
naprawę konfiguracji, a nie jak zwykły czat.

Kontrakt bezpieczeństwa dla zdalnego ratowania:

- Wyłączone, gdy aktywny jest sandboxing. Jeśli agent/sesja działa w sandboxie,
  Crestodian musi odmówić zdalnego ratowania i wyjaśnić, że wymagana jest naprawa lokalnym CLI.
- Domyślny stan efektywny to `auto`: zezwalaj na zdalne ratowanie tylko w zaufanej
  operacji YOLO, gdy runtime ma już niesandboxowane lokalne uprawnienia.
- Wymagaj jawnej tożsamości właściciela. Ratowanie nie może akceptować reguł nadawcy z symbolami wieloznacznymi,
  otwartej polityki grupowej, nieuwierzytelnionych Webhooków ani anonimowych kanałów.
- Domyślnie tylko wiadomości DM właściciela. Ratowanie w grupie/kanale wymaga jawnej zgody.
- Wyszukiwanie i lista wtyczek są tylko do odczytu. Instalacja wtyczek jest domyślnie tylko lokalna,
  ponieważ pobiera wykonywalny kod. Odinstalowanie wtyczki może być dozwolone jako
  zatwierdzona operacja naprawy, gdy polityka ratunkowa zezwala na trwałe zapisy.
- Zdalne ratowanie nie może otworzyć lokalnego TUI ani przełączyć do interaktywnej sesji
  agenta. Użyj lokalnego `openclaw` do przekazania do agenta.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Audytuj każdą zastosowaną operację ratunkową. Ratowanie przez kanał wiadomości zapisuje metadane kanału,
  konta, nadawcy i adresu źródłowego. Operacje modyfikujące konfigurację zapisują również
  skróty konfiguracji przed i po.
- Nigdy nie echo sekretów. Inspekcja SecretRef powinna zgłaszać dostępność, a nie
  wartości.
- Jeśli Gateway działa, preferuj typowane operacje Gateway. Jeśli Gateway nie działa, używaj tylko
  minimalnej lokalnej powierzchni naprawczej, która nie zależy od zwykłej pętli agenta.

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

- `"auto"`: domyślnie. Zezwalaj tylko wtedy, gdy efektywny runtime to YOLO, a
  sandboxing jest wyłączony.
- `false`: nigdy nie zezwalaj na ratowanie przez kanał wiadomości.
- `true`: jawnie zezwalaj na ratowanie, gdy kontrole właściciela/kanału przejdą pomyślnie. To
  nadal nie może omijać odmowy z powodu sandboxingu.

Domyślna postawa YOLO `"auto"` to:

- tryb sandbox rozwiązuje się do `off`
- `tools.exec.security` rozwiązuje się do `full`
- `tools.exec.ask` rozwiązuje się do `off`

Zdalne ratowanie obejmuje ścieżka Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Zapasowy lokalny planer bez konfiguracji obejmuje:

```bash
pnpm test:docker:crestodian-planner
```

Opcjonalny smoke dla powierzchni poleceń kanału na żywo sprawdza `/crestodian status` oraz
trwały roundtrip zatwierdzania przez handler ratunkowy:

```bash
pnpm test:live:crestodian-rescue-channel
```

Konfigurację bez configu przez jawne polecenia Crestodian obejmuje:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka zaczyna od pustego katalogu stanu, weryfikuje punkt wejścia nowoczesnego wdrażania Crestodian,
ustawia domyślny model, tworzy dodatkowego agenta, konfiguruje
Discord przez włączenie wtyczki oraz SecretRef tokenu, weryfikuje konfigurację i
sprawdza dziennik audytu. QA Lab ma też scenariusz oparty na repozytorium dla tego samego przepływu Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Sandbox](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
