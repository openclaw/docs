---
read_when:
    - Konfiguracja wnioskowania została zakończona, a pozostałą część ma skonfigurować OpenClaw
    - Trzeba sprawdzić lub naprawić OpenClaw za pomocą lokalnego agenta konfiguracji
    - Projektowanie lub włączanie trybu ratunkowego kanału wiadomości
summary: Dokumentacja CLI i model zabezpieczeń opartego na wnioskowaniu narzędzia pomocniczego do konfiguracji i naprawy OpenClaw
title: Agent konfiguracji OpenClaw
x-i18n:
    generated_at: "2026-07-16T18:28:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw jest dostarczany z wbudowanym agentem systemowym — przedstawiającym się jako „OpenClaw” — przeznaczonym do
lokalnej konfiguracji, naprawy i zarządzania ustawieniami (wcześniej nazywanym Crestodian). Uruchamia się on dopiero po wykonaniu rzeczywistej tury przez efektywny model domyślny.
W nowych instalacjach najpierw konfigurowane jest wnioskowanie; nieprawidłowa konfiguracja pozostaje obsługiwana przez
klasyczną ścieżkę narzędzia doctor.

## Kiedy się uruchamia

Uruchomienie `openclaw` bez podpolecenia wybiera ścieżkę na podstawie stanu konfiguracji:

- Brak konfiguracji albo konfiguracja istnieje bez ustawień utworzonych przez użytkownika (jest pusta lub zawiera tylko klucze `$schema`/`meta`): uruchamia wspomagane wdrażanie z weryfikacją AI na żywo.
- Konfiguracja istnieje, ale nie przechodzi walidacji: uruchamia klasyczne wdrażanie, które zgłasza problemy i kieruje do `openclaw doctor`.
- Konfiguracja istnieje i jest prawidłowa: otwiera standardowy interfejs TUI agenta. Osiągalny
  skonfigurowany Gateway, którego domyślny agent ma model, przechodzi bezpośrednio do tego interfejsu
  bez wdrażania ani OpenClaw. Aby później przejść do OpenClaw, użyj `/openclaw` wewnątrz TUI lub uruchom
  bezpośrednio `openclaw setup`.

Uruchomienie `openclaw setup` najpierw testuje na żywo skonfigurowany model domyślny. Pomyślna tura uruchamia OpenClaw. Interaktywny błąd otwiera wspomaganą konfigurację wnioskowania i przekazuje sterowanie do OpenClaw po pomyślnym przetestowaniu kandydata. Gdy wnioskowanie jest niedostępne, żądania jednorazowe, JSON i inne nieinteraktywne kończą się błędem z instrukcją uruchomienia `openclaw onboard`. `openclaw --help` i `openclaw --version` zachowują swoje standardowe szybkie ścieżki.

Nieinteraktywne uruchomienie samego `openclaw` (bez TTY) kończy działanie z krótkim komunikatem zamiast wyświetlać pomoc główną: wskazuje nieinteraktywne wdrażanie w nowej lub nieprawidłowej instalacji albo `openclaw agent --local ...`, gdy konfiguracja jest prawidłowa.

`openclaw onboard --modern` pozostaje aliasem zgodności dla OpenClaw, ale używa tej samej bramki wnioskowania: działające wnioskowanie otwiera czat, błędy interaktywne uruchamiają wspomaganą konfigurację wnioskowania, a błędy nieinteraktywne kończą działanie ze wskazówkami dotyczącymi wdrażania. `openclaw onboard --classic` otwiera pełny kreator krok po kroku.

## Co wyświetla OpenClaw

Interaktywny OpenClaw otwiera tę samą powłokę TUI co `openclaw tui`, z zapleczem czatu OpenClaw. Powitanie przy uruchomieniu obejmuje:

- prawidłowość konfiguracji i domyślnego agenta
- zweryfikowany model używany przez OpenClaw
- osiągalność Gateway ustaloną podczas pierwszego testu przy uruchomieniu
- następne zalecane działanie diagnostyczne

Nie ujawnia sekretów ani nie ładuje poleceń CLI pluginów wyłącznie w celu uruchomienia.

Użyj `status`, aby uzyskać szczegółowy wykaz: ścieżkę konfiguracji, ścieżki dokumentacji i źródeł, lokalne testy CLI, obecność klucza/tokenu, agentów, model oraz szczegóły Gateway.

OpenClaw używa tego samego mechanizmu wykrywania materiałów referencyjnych co zwykli agenci: w kopii roboczej Git wskazuje lokalny `docs/` i drzewo źródeł; w instalacji npm korzysta z dołączonej dokumentacji i podaje łącze do [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), zalecając sprawdzenie źródeł, gdy dokumentacja jest niewystarczająca.

## Przykłady

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "modele"
openclaw setup --message "zweryfikuj konfigurację"
openclaw setup --message "skonfiguruj obszar roboczy ~/Projects/work" --yes
openclaw setup --message "ustaw domyślny model openai/gpt-5.6" --yes
openclaw onboard --modern
```

W TUI OpenClaw:

```text
stan
kondycja
doctor
zweryfikuj konfigurację
konfiguracja
skonfiguruj obszar roboczy ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
stan gateway
uruchom ponownie gateway
agenci
utwórz agenta work z obszarem roboczym ~/Projects/work
modele
skonfiguruj dostawcę modelu
ustaw domyślny model openai/gpt-5.6
kanały
informacje o kanale slack
połącz slack
otwórz kreator kanału dla slack
lista pluginów
wyszukaj pluginy slack
plugin install clawhub:openclaw-codex-app-server
rozmawiaj z agentem work
rozmawiaj z agentem dla ~/Projects/work
audyt
zakończ
```

## Operacje i zatwierdzanie

OpenClaw używa operacji z określonymi typami zamiast doraźnego edytowania konfiguracji.

Operacje tylko do odczytu są wykonywane natychmiast: wyświetlenie przeglądu, wyświetlenie listy agentów, wyświetlenie listy zainstalowanych pluginów, wyszukiwanie pluginów ClawHub, wyświetlenie stanu modelu/zaplecza, uruchomienie kontroli stanu/kondycji, sprawdzenie osiągalności Gateway, uruchomienie narzędzia doctor bez interaktywnych poprawek, walidacja konfiguracji oraz wyświetlenie ścieżki dziennika audytu.

Uruchomienie wspomaganej konfiguracji kanału (`connect telegram`) również następuje natychmiast. Kreator zbiera jednoznaczne odpowiedzi i zarządza wynikowymi zapisami.

Operacje trwałe wymagają zatwierdzenia w rozmowie (lub `--yes` w przypadku polecenia bezpośredniego): zapis konfiguracji, `config set`, `config set-ref`, inicjalizacja konfiguracji/wdrażania, zmiana modelu domyślnego, uruchomienie/zatrzymanie/ponowne uruchomienie Gateway, tworzenie agentów i instalowanie pluginów.

Naprawy narzędzia doctor są niedostępne wewnątrz OpenClaw, ponieważ mogą przepisać dostawcę, uwierzytelnianie lub trasę wnioskowania domyślnego agenta, na której opiera się sesja. Zakończ OpenClaw i uruchom `openclaw doctor --fix` w terminalu. `doctor` działający tylko do odczytu pozostaje dostępny wewnątrz OpenClaw.

Nowi agenci dziedziczą zweryfikowaną na żywo domyślną trasę wnioskowania. Identyfikatory agentów `openclaw` i `crestodian` są zarezerwowane dla agenta systemowego i nie można ich używać do tworzenia zwykłych agentów. Wycofany identyfikator pozostaje zablokowany, aby stara konfiguracja nie mogła go przejąć.

`config set` i `config set-ref` nie mogą zmieniać stanu trasy wnioskowania,
w tym danych uwierzytelniających dostawcy wnioskowania, ustawienia `auth.*` najwyższego poziomu, katalogów modeli,
zapleczy CLI, domyślnych tras modeli i tras poszczególnych agentów, parametrów/narzędzi agentów ani głównego ustawienia
`tools.*`. Bezpośrednie zapisy w `env.*`, `secrets.*`, `plugins.*` i `$include`
są również odrzucane, ponieważ mogą zastąpić mechanizm rozpoznawania danych uwierzytelniających lub aktywację
dostawcy. Uwierzytelnianie Gateway i kanałów pozostaje zwykłym obszarem konfiguracji. Używaj typowanych przepływów pracy pluginów/kanałów oraz
`set default model <provider/model>` dla już
skonfigurowanej trasy; przed zapisaniem trasa jest testowana na żywo. Aby skonfigurować lub
naprawić dostęp dostawcy/uwierzytelniania, zakończ OpenClaw i uruchom `openclaw onboard`.

Odinstalowanie pluginu jest odrzucane wewnątrz OpenClaw, ponieważ usunięcie pluginu
dostawcy mogłoby wyłączyć trasę wnioskowania, na której opiera się sesja. Zakończ OpenClaw
i uruchom `openclaw plugins uninstall <id>` w terminalu.

Zatwierdzenie jest wyrażane własnymi słowami: jednoznaczne odpowiedzi („tak”, „jasne”, „kontynuuj”, „nie teraz”) są rozpoznawane na podstawie zamkniętej, deterministycznej listy. Gdy skonfigurowana trasa obsługuje oddzielne wywołanie uzupełniania, inne odpowiedzi mogą być klasyfikowane wyłącznie na podstawie wiadomości i oczekującej propozycji — nigdy przez sam model prowadzący rozmowę, który nie może sam się zatwierdzić. Niesklasyfikowane lub niejednoznaczne odpowiedzi pozostawiają propozycję w stanie oczekiwania, a system ponownie prosi o decyzję.

Zastosowane zapisy są rejestrowane w `~/.openclaw/audit/system-agent.jsonl`. Wykrywanie nie podlega audytowi; rejestrowane są tylko zastosowane operacje i zapisy.

Konfiguracja kanału może przebiegać jako hostowana rozmowa, dopóki nie będzie wymagany sekret.
Lokalny interfejs TUI OpenClaw nie przyjmuje poufnych odpowiedzi kreatora, ponieważ dane wejściowe
czatu terminalowego są widoczne. Natychmiast proponuje `open channel wizard`, przekazując
wybrany kanał do terminalowego kreatora z maskowaniem; można też później uruchomić
`openclaw channels add --channel <channel>`.

### Przejście do konfiguracji kanału z maskowaniem

Lokalny czat może przekazać sterowanie do kreatora kanału z maskowaniem:

```text
otwórz kreator kanału dla slack
informacje o kanale slack
```

`open channel wizard for <channel>` otwiera konfigurację kanału z maskowaniem po zamknięciu
TUI czatu. Najpierw użyj `channel info <channel>`, aby uzyskać etykietę kanału, stan konfiguracji,
podsumowanie wymagań wstępnych i łącze do dokumentacji.

OpenClaw nigdy nie zmienia dostępu dostawcy/uwierzytelniania z poziomu własnej sesji:
sesja już zależy od tej trasy wnioskowania. W przypadku konfiguracji lub
naprawy dostawcy modelu `configure model provider` zwraca wskazówki dotyczące zakończenia działania/wdrażania bez
uruchamiania kreatora ani zapisywania konfiguracji. Zakończ OpenClaw i uruchom `openclaw
onboard`; wdrażanie przygotowuje dane uwierzytelniające i zapisuje tylko trasę, która
pomyślnie wykona rzeczywistą turę na żywo. Po pomyślnym wdrożeniu ponownie uruchom OpenClaw.

## Inicjalizacja konfiguracji

`setup` konfiguruje pozostały stan obszaru roboczego i Gateway po wcześniejszym skonfigurowaniu wnioskowania przez wspomagane wdrażanie. Zapisuje wyłącznie za pośrednictwem typowanych operacji konfiguracji i najpierw prosi o zatwierdzenie.

```text
konfiguracja
skonfiguruj obszar roboczy ~/Projects/work
```

`setup` zachowuje zweryfikowany efektywny model. Nie konfiguruje ani
nie zastępuje wnioskowania.

Jeśli brakuje wnioskowania lub jego test na żywo kończy się niepowodzeniem, opuść OpenClaw i uruchom `openclaw onboard`. Wspomagane wdrażanie wykrywa skonfigurowane modele, klucze API i uwierzytelnione lokalne interfejsy CLI, żąda rzeczywistej odpowiedzi od każdego kandydata i utrwala tylko działającą trasę. OpenClaw uruchamia się natychmiast po przekroczeniu tej granicy i może następnie skonfigurować obszar roboczy, Gateway, kanały, agentów, pluginy i inne opcjonalne funkcje.

Aplikacja macOS całkowicie pomija tę sekwencję, gdy uzyska dostęp do skonfigurowanego Gateway,
którego domyślny agent ma już skonfigurowany model; otwiera standardowy interfejs
agenta.
W przypadku nowego lub niekompletnego Gateway aplikacja przeprowadza sekwencję wnioskowania przy użyciu
metod Gateway `openclaw.setup.detect` i `openclaw.setup.activate`:
wykrywanie wyświetla listę wszystkich znalezionych zapleczy kandydatów, aktywacja testuje na żywo jednego
kandydata (rzeczywiste uzupełnienie „odpowiedz OK”) i dopiero po pomyślnym teście utrwala model,
dane uwierzytelniające oraz stan dostawcy/środowiska uruchomieniowego wymagany dla tej trasy. Wartości domyślne obszaru roboczego i Gateway pozostają do skonfigurowania przez OpenClaw. Kandydat, który nie przejdzie testu,
nigdy nie zmienia konfiguracji; aplikacja automatycznie przechodzi w dół listy i na końcu
oferuje ręczne wprowadzenie klucza/tokenu, uzupełnione na podstawie aktywnych
pluginów dostawców wnioskowania tekstowego Gateway. Wybrany dostawca określa swój model
początkowy i konfigurację, a dane uwierzytelniające są weryfikowane w ten sam sposób przed zapisaniem.

Nadzór Codex i inne opcjonalne funkcje pluginów pozostają poza tą
transakcją aktywacji wnioskowania. Konfiguruj je dopiero po uruchomieniu
wnioskowania i OpenClaw; istniejące zasady pluginów i jawne
rezygnacje z nadzoru pozostają nienaruszone podczas konfiguracji wnioskowania.

## Rozmowa z AI

Swobodna rozmowa w interaktywnym OpenClaw korzysta z tej samej pętli agenta co zwykli agenci OpenClaw, ograniczonej do jednego narzędzia uprawnień OpenClaw poziomu zerowego, `openclaw`, które opakowuje typowane operacje. Działania odczytu są wykonywane swobodnie, mutacje wymagają zatwierdzenia w rozmowie dla dokładnie tej operacji (patrz Operacje i zatwierdzanie), a każdy zastosowany zapis podlega audytowi i ponownej walidacji. Sesja agenta jest trwała, więc OpenClaw ma rzeczywistą pamięć obejmującą wiele tur. Jeśli zweryfikowana trasa wnioskowania później przestanie działać, wróć do `openclaw onboard` i napraw ją przed kontynuowaniem.

Host nie przekształca żądań w języku naturalnym w operacje. Swobodne
wiadomości — w tym tekst przypominający polecenia oraz pytania takie jak „dlaczego mój
gateway się zatrzymał?” — trafiają do AI, która może zmapować żądanie na typowaną operację
za pośrednictwem narzędzia `openclaw`.

Gdy mutacja oczekuje na zatwierdzenie, bez użycia wnioskowania rozpoznawane są wyłącznie jednoznaczne frazy zatwierdzenia lub odrzucenia z
zamkniętej listy. Niejednoznaczna zgoda trafia do
oddzielnego skonfigurowanego wywołania uzupełniania, a w przeciwnym razie jest domyślnie odrzucana. Ustrukturyzowane
pola kreatora i dokładna nawigacja hosta są elementami sterującymi interfejsu, a nie mechanizmem analizowania operacji
w języku naturalnym. Szczególnie ważny jest jeden wyjątek dotyczący ochrony sekretów: dokładne
`config set` dotyczące poufnej ścieżki (tokenów, kluczy, haseł) nigdy nie trafia
do modelu. Host tworzy zredagowaną propozycję, a wartość jest maskowana w
historii widocznej dla AI. W przypadku sekretów preferuj `config set-ref <path> env <ENV_VAR>`.

Tryb ratunkowy kanałów wiadomości nigdy nie korzysta z planera wspomaganego przez model. Zdalny tryb ratunkowy pozostaje deterministyczny, aby uszkodzona lub przejęta standardowa ścieżka agenta nie mogła służyć jako edytor konfiguracji.

### Model zaufania środowiska testowego CLI

Osadzone środowiska uruchomieniowe oraz mechanizm testowy serwera aplikacji Codex bezpośrednio wymuszają
ograniczenie poziomu zero: uruchomienie zawiera listę dozwolonych narzędzi OpenClaw obejmującą wyłącznie
narzędzie `openclaw`. W przypadku Codex OpenClaw wyłącza również dla tego uruchomienia środowiska, natywne
wykonywanie, obsługę wielu agentów, cele, aplikacje/pluginy, Skills/MCP, wyszukiwanie w sieci oraz
powierzchnie `request_user_input`. Codex nadal wstrzykuje swoje nieaktywne natywne narzędzie `update_plan`;
może ono aktualizować tymczasową listę kontrolną modelu, ale nie może zapisywać plików
ani konfiguracji OpenClaw. Mechanizmy testowe CLI nie korzystają z listy dozwolonych narzędzi OpenClaw,
dlatego OpenClaw dopuszcza wyłącznie backendy, których własny kontrakt wyboru narzędzi może wykazać
to samo ograniczenie:

- Backendy z możliwością wyboru, w tym Claude Code, są uruchamiane z pustym wyborem narzędzi natywnych
  i jednym narzędziem MCP: `openclaw`. Wygenerowana konfiguracja MCP Claude jest
  stosowana za pomocą `--strict-mcp-config`, dzięki czemu nie są ładowane żadne inne serwery MCP.
- Backendy deklarujące brak narzędzi natywnych otrzymują ten sam dedykowany serwer
  MCP OpenClaw.
- Backendy z zawsze aktywnymi lub nieznanymi narzędziami natywnymi są bezpiecznie odrzucane przed wnioskowaniem;
  nie mogą obsługiwać sesji OpenClaw.

Tylko sesje OpenClaw otrzymują serwer MCP openclaw; zwykłe uruchomienia agentów
nigdy nie widzą tego narzędzia. Backendy CLI z możliwością wyboru lub bez narzędzi natywnych oraz modele
korzystające z klucza API wymuszają zatem dosłowną pętlę jednego narzędzia. Modele serwera aplikacji Codex wymuszają
jedno narzędzie uprawnień OpenClaw oraz nieaktywne natywne narzędzie planowania. We wszystkich
trzech przypadkach zapisy konfiguracji pozostają ograniczone do audytowanego kontraktu
zatwierdzania OpenClaw.

Gemini CLI pozostaje dostępne dla zwykłych agentów, ale nie może wymusić
próby bez narzędzi wymaganej przez bramę wnioskowania, dlatego nie może obsługiwać OpenClaw.

## Przełączanie na agenta

Aby opuścić OpenClaw i otworzyć zwykły TUI, należy użyć selektora w języku naturalnym:

```text
porozmawiaj z agentem
porozmawiaj z agentem roboczym
przełącz na głównego agenta
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` otwierają bezpośrednio zwykły TUI agenta; nie uruchamiają OpenClaw. Po przełączeniu do zwykłego TUI polecenie `/openclaw` powoduje powrót do OpenClaw, opcjonalnie z dodatkowym żądaniem:

```text
/openclaw
/openclaw uruchom ponownie gateway
```

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości jest punktem wejścia kanału wiadomości do OpenClaw: należy go użyć, gdy zwykły agent nie działa, ale zaufany kanał (na przykład WhatsApp) nadal odbiera polecenia.

Jest to deterministyczny mechanizm obsługi poleceń awaryjnych, a nie konwersacyjny
agent OpenClaw. Nie inicjuje nowej konfiguracji ani nie łagodzi bramy wnioskowania
dla czatu OpenClaw.

Obsługiwane polecenie: `/openclaw <request>`. Tryb ratunkowy akceptuje wyłącznie dokładną gramatykę wpisanego polecenia — język naturalny jest odrzucany z podpowiedzią, nigdy nie jest interpretowany jako operacja, a model nigdy nie jest używany.

```text
Ty, w zaufanej wiadomości prywatnej właściciela: /openclaw status
OpenClaw: Tryb ratunkowy OpenClaw. Gateway osiągalny: nie. Konfiguracja prawidłowa: nie.
Ty: /openclaw restart gateway
OpenClaw: Plan: uruchomić ponownie Gateway. Odpowiedz /openclaw yes, aby zastosować.
Ty: /openclaw yes
OpenClaw: Zastosowano. Zapisano wpis audytu.
```

Tworzenie agenta można również umieścić w lokalnej kolejce lub wykonać przez tryb ratunkowy:

```text
utwórz agenta work z obszarem roboczym ~/Projects/work i modelem openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Podczas tworzenia agenta można wskazać wyłącznie bieżący, zweryfikowany na żywo model domyślny. Pominięcie
modelu powoduje odziedziczenie tej trasy.

Zdalny tryb ratunkowy jest powierzchnią administracyjną i musi być traktowany jak zdalna naprawa konfiguracji, a nie zwykły czat.

Kontrakt bezpieczeństwa zdalnego trybu ratunkowego:

- Wyłączony, gdy dla agenta lub sesji aktywna jest izolacja; OpenClaw odmawia zdalnego trybu ratunkowego i wskazuje lokalną naprawę przez CLI.
- Domyślny stan efektywny to `auto`: zezwalaj na zdalny tryb ratunkowy tylko podczas zaufanego działania YOLO, gdy środowisko uruchomieniowe ma już nieizolowane uprawnienia lokalne (`tools.exec.security` przyjmuje wartość `full`, a `tools.exec.ask` przyjmuje wartość `off`, przy trybie izolacji `off`).
- Wymaga jawnej tożsamości właściciela; niedozwolone są reguły nadawców z symbolami wieloznacznymi, otwarte zasady grup, nieuwierzytelnione webhooki ani anonimowe kanały.
- Domyślnie tylko wiadomości prywatne właściciela; tryb ratunkowy w grupie lub kanale wymaga jawnego włączenia.
- Wyszukiwanie i wyświetlanie listy pluginów jest tylko do odczytu. Instalacja pluginów jest zawsze dostępna wyłącznie lokalnie (zablokowana w trybie ratunkowym, nawet jeśli poza nim jest włączona), ponieważ pobiera kod wykonywalny. Odinstalowanie pluginu jest odrzucane zarówno w lokalnym OpenClaw, jak i w trybie ratunkowym; należy uruchomić `openclaw plugins uninstall <id>` w terminalu.
- Zdalny tryb ratunkowy nie może otworzyć lokalnego TUI ani przełączyć się do interaktywnej sesji agenta; do przekazania sterowania agentowi należy użyć lokalnego `openclaw`.
- Trwałe zapisy nadal wymagają zatwierdzenia, również w trybie ratunkowym.
- Oczekujące zatwierdzenia są jednorazowe. Każde nowsze polecenie ratunkowe dla tego samego konta, kanału i nadawcy unieważnia starszy plan; nieudane wykonanie również zużywa zatwierdzenie, dlatego w celu ponowienia należy ponownie wysłać polecenie.
- Każda zastosowana operacja ratunkowa jest rejestrowana w audycie. Tryb ratunkowy kanału wiadomości zapisuje metadane kanału, konta, nadawcy i adresu źródłowego; operacje zmieniające konfigurację zapisują również skróty konfiguracji przed zmianą i po niej.
- Sekrety nigdy nie są wyświetlane. Kontrola SecretRef informuje o dostępności, a nie o wartościach.
- Jeśli Gateway działa, tryb ratunkowy preferuje typowane operacje Gateway; jeśli nie działa, korzysta wyłącznie z minimalnej lokalnej powierzchni naprawczej, która nie zależy od zwykłej pętli agenta.

Struktura konfiguracji:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (wartość domyślna) zezwala na tryb ratunkowy tylko wtedy, gdy efektywne środowisko uruchomieniowe działa w trybie YOLO, a izolacja jest wyłączona; `false` nigdy nie zezwala na tryb ratunkowy kanału wiadomości; `true` jawnie zezwala na tryb ratunkowy, gdy kontrole właściciela i kanału zakończą się pomyślnie (nadal z uwzględnieniem odmowy przy aktywnej izolacji).
- `ownerDmOnly`: ogranicza tryb ratunkowy do bezpośrednich wiadomości właściciela. Wartość domyślna: `true`.
- `pendingTtlMinutes`: czas, przez jaki oczekujący zapis ratunkowy pozostaje otwarty na zatwierdzenie `/openclaw yes` przed wygaśnięciem. Wartość domyślna: `15`.

`openclaw doctor --fix` migruje starszy blok konfiguracji `crestodian` do
`systemAgent`. Środowisko uruchomieniowe odczytuje wyłącznie blok kanoniczny.

Zdalny tryb ratunkowy jest objęty ścieżką Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Opcjonalny test dymny powierzchni poleceń aktywnego kanału sprawdza `/openclaw status` oraz pełny cykl trwałego zatwierdzenia za pośrednictwem mechanizmu trybu ratunkowego:

```bash
pnpm test:live:system-agent-rescue-channel
```

Pakietowa jednorazowa konfiguracja ograniczona bramą wnioskowania jest objęta przez:

```bash
pnpm test:docker:system-agent-first-run
```

Ta ścieżka pakietowego CLI rozpoczyna działanie z pustym katalogiem stanu i dowodzi, że OpenClaw
bezpiecznie odmawia działania bez wnioskowania. Następnie testuje i aktywuje atrapę Claude za pośrednictwem
pakietowego modułu aktywacji. Dopiero potem nieprecyzyjne żądanie dociera do
planisty i zostaje przekształcone w typowaną konfigurację, po czym wykonywane są jednorazowe polecenia, które tworzą
dodatkowego agenta, konfigurują Discord przez włączenie pluginu i token
SecretRef, weryfikują konfigurację oraz sprawdzają dziennik audytu. Ta ścieżka dostarcza pomocniczych
dowodów działania bramy i operacji; nie obejmuje interaktywnego wdrażania ani
konwersacji dotyczącej agenta, narzędzia i zatwierdzania w OpenClaw. Poniższy scenariusz QA Lab przekierowuje
do tej samej ścieżki Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Izolacja](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
