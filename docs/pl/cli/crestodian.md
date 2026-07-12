---
read_when:
    - Ukończono konfigurację inferencji i chcesz, aby Crestodian skonfigurował resztę
    - Musisz sprawdzić lub naprawić OpenClaw za pomocą lokalnego agenta konfiguracji
    - Projektujesz lub włączasz tryb awaryjny kanału wiadomości
summary: Dokumentacja CLI i model zabezpieczeń narzędzia pomocniczego Crestodian do konfiguracji i naprawy, opartego na wnioskowaniu
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T14:58:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Konwersacyjny Crestodian jest lokalnym agentem OpenClaw do konfiguracji, naprawy i zarządzania ustawieniami. Uruchamia się dopiero po wykonaniu rzeczywistej interakcji przez efektywny model domyślny. W nowych instalacjach najpierw konfigurowane jest wnioskowanie; nieprawidłowa konfiguracja pozostaje obsługiwana przez klasyczną ścieżkę doctor.

## Kiedy się uruchamia

Uruchomienie `openclaw` bez podpolecenia wybiera ścieżkę na podstawie stanu konfiguracji:

- Brak konfiguracji albo konfiguracja bez ustawień utworzonych przez użytkownika (pusta lub zawierająca tylko klucze `$schema`/`meta`): rozpoczyna prowadzone wdrażanie z weryfikacją przez działającą AI.
- Konfiguracja istnieje, ale nie przechodzi walidacji: rozpoczyna klasyczne wdrażanie, które zgłasza problemy i kieruje do `openclaw doctor`.
- Konfiguracja istnieje i jest prawidłowa: otwiera zwykły interfejs TUI agenta. Osiągalny, skonfigurowany Gateway, którego domyślny agent ma model, przechodzi bezpośrednio do tego interfejsu bez wdrażania ani Crestodiana. Aby później przejść do Crestodiana, użyj `/crestodian` w TUI albo uruchom bezpośrednio `openclaw crestodian`.

Polecenie `openclaw crestodian` najpierw testuje skonfigurowany model domyślny w rzeczywistej interakcji. Pomyślna interakcja uruchamia Crestodiana. Interaktywny błąd otwiera prowadzoną konfigurację wnioskowania i po pomyślnym sprawdzeniu kandydata przekazuje sterowanie Crestodianowi. Jednorazowe żądania, żądania JSON i inne żądania nieinteraktywne kończą się niepowodzeniem z instrukcją uruchomienia `openclaw onboard`, gdy wnioskowanie jest niedostępne. `openclaw --help` i `openclaw --version` zachowują swoje zwykłe szybkie ścieżki.

Nieinteraktywne uruchomienie samego `openclaw` (bez TTY) kończy się krótkim komunikatem zamiast wyświetlania głównej pomocy: w nowej lub nieprawidłowej instalacji wskazuje nieinteraktywne wdrażanie, a przy prawidłowej konfiguracji — `openclaw agent --local ...`.

`openclaw onboard --modern` pozostaje aliasem zgodności dla Crestodiana, ale używa tej samej bramki wnioskowania: działające wnioskowanie otwiera czat, błędy interaktywne uruchamiają prowadzoną konfigurację wnioskowania, a błędy nieinteraktywne powodują zakończenie z instrukcjami dotyczącymi wdrażania. `openclaw onboard --classic` otwiera pełny kreator krok po kroku.

## Co pokazuje Crestodian

Interaktywny Crestodian otwiera tę samą powłokę TUI co `openclaw tui`, z backendem czatu Crestodiana. Powitanie przy uruchomieniu obejmuje:

- prawidłowość konfiguracji i domyślnego agenta
- zweryfikowany model używany przez Crestodiana
- osiągalność Gateway ustaloną podczas pierwszej próby przy uruchomieniu
- następną zalecaną czynność diagnostyczną

Nie ujawnia sekretów ani nie ładuje poleceń CLI pluginów wyłącznie na potrzeby uruchomienia.

Użyj `status`, aby wyświetlić szczegółowy wykaz: ścieżkę konfiguracji, ścieżki dokumentacji/kodu źródłowego, lokalne testy CLI, obecność kluczy/tokenów, agentów, model oraz szczegóły Gateway.

Crestodian korzysta z tego samego mechanizmu odnajdywania materiałów referencyjnych co zwykli agenci: w kopii roboczej Git wskazuje lokalny katalog `docs/` i drzewo kodu źródłowego; w instalacji npm używa dołączonej dokumentacji i odsyła do [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), zalecając sprawdzenie kodu źródłowego, gdy dokumentacja nie wystarcza.

## Przykłady

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

W TUI Crestodiana:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operacje i zatwierdzanie

Crestodian używa operacji typowanych zamiast doraźnej edycji konfiguracji.

Operacje tylko do odczytu są wykonywane natychmiast: wyświetlenie przeglądu, wyświetlenie listy agentów, wyświetlenie listy zainstalowanych pluginów, wyszukiwanie pluginów ClawHub, wyświetlenie stanu modelu/backendu, wykonanie kontroli stanu/kondycji, sprawdzenie osiągalności Gateway, uruchomienie doctor bez interaktywnych napraw, walidacja konfiguracji oraz wyświetlenie ścieżki dziennika audytu.

Rozpoczęcie prowadzonej konfiguracji kanału (`connect telegram`) również następuje natychmiast. Kreator zbiera jednoznaczne odpowiedzi i odpowiada za wynikające z nich zapisy.

Operacje trwałe wymagają zatwierdzenia w rozmowie (lub opcji `--yes` w przypadku bezpośredniego polecenia): zapis konfiguracji, `config set`, `config set-ref`, inicjalizacja konfiguracji/wdrażania, zmiana modelu domyślnego, uruchomienie/zatrzymanie/ponowne uruchomienie Gateway, tworzenie agentów i instalowanie pluginów.

Naprawy doctor są niedostępne w Crestodianie, ponieważ mogą zmienić dostawcę, uwierzytelnianie lub trasę wnioskowania domyślnego agenta, od której zależy sesja. Zamknij Crestodiana i uruchom `openclaw doctor --fix` w terminalu. Tryb `doctor` tylko do odczytu pozostaje dostępny w Crestodianie.

Nowi agenci dziedziczą zweryfikowaną w działającej interakcji domyślną trasę wnioskowania. Identyfikator agenta `crestodian` jest zarezerwowany dla uprzywilejowanego wirtualnego zarządcy i nie można utworzyć zwykłego agenta o takim identyfikatorze.

`config set` i `config set-ref` nie mogą zmieniać stanu trasy wnioskowania, w tym poświadczeń dostawcy wnioskowania, nadrzędnych ustawień `auth.*`, katalogów modeli, backendów CLI, domyślnych tras modeli ani tras modeli poszczególnych agentów, parametrów/narzędzi agentów ani głównych ustawień `tools.*`. Surowe zapisy w `env.*`, `secrets.*`, `plugins.*` i `$include` również są odrzucane, ponieważ mogą zastąpić mechanizm rozpoznawania poświadczeń lub aktywację dostawcy. Uwierzytelnianie Gateway i kanałów pozostaje zwykłą częścią konfiguracji. Używaj typowanych przepływów pracy pluginów/kanałów oraz `set default model <provider/model>` dla już skonfigurowanej trasy; przed zapisaniem trasa jest testowana w działającej interakcji. Aby skonfigurować lub naprawić dostęp do dostawcy/uwierzytelniania, zamknij Crestodiana i uruchom `openclaw onboard`.

Odinstalowanie pluginu jest odrzucane w Crestodianie, ponieważ usunięcie pluginu dostawcy mogłoby wyłączyć trasę wnioskowania, od której zależy sesja. Zamknij Crestodiana i uruchom w terminalu `openclaw plugins uninstall <id>`.

Zatwierdzenie wyrażasz własnymi słowami: jednoznaczne odpowiedzi („tak”, „jasne”, „kontynuuj”, „nie teraz”) są rozpoznawane na podstawie zamkniętej, deterministycznej listy. Gdy skonfigurowana trasa obsługuje oddzielne wywołanie generowania odpowiedzi, inne odpowiedzi mogą być klasyfikowane wyłącznie na podstawie Twojej wiadomości i oczekującej propozycji — nigdy przez sam model prowadzący rozmowę, który nie może sam siebie zatwierdzić. Niesklasyfikowane lub niejednoznaczne odpowiedzi pozostawiają propozycję w stanie oczekiwania, a rozmowa ponownie prosi o decyzję.

Zastosowane zapisy są rejestrowane w `~/.openclaw/audit/crestodian.jsonl`. Odnajdywanie nie podlega audytowi; rejestrowane są wyłącznie zastosowane operacje i zapisy.

Konfiguracja kanału może odbywać się jako hostowana rozmowa, dopóki nie będzie wymagany sekret. Lokalne TUI Crestodiana nie przyjmuje poufnych odpowiedzi kreatora, ponieważ dane wprowadzane w czacie terminalowym są widoczne. Natychmiast proponuje `open channel wizard`, przekazując wybrany kanał do terminalowego kreatora z maskowaniem danych; możesz też później uruchomić `openclaw channels add --channel <channel>`.

### Przełączanie na konfigurację kanału z maskowaniem danych

Lokalny czat może przekazać sterowanie kreatorowi kanału z maskowaniem danych:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` otwiera konfigurację kanału z maskowaniem danych po zamknięciu TUI czatu. Najpierw użyj `channel info <channel>`, aby wyświetlić etykietę kanału, stan konfiguracji, podsumowanie wymagań wstępnych i odsyłacz do dokumentacji.

Crestodian nigdy nie zmienia dostępu do dostawcy/uwierzytelniania z poziomu własnej sesji: sesja już zależy od tej trasy wnioskowania. W przypadku konfiguracji lub naprawy dostawcy modelu polecenie `configure model provider` zwraca instrukcje dotyczące zakończenia i wdrażania, nie uruchamiając kreatora ani nie zapisując konfiguracji. Zamknij Crestodiana i uruchom `openclaw onboard`; wdrażanie przygotowuje poświadczenia i zapisuje wyłącznie trasę, która pomyślnie wykonuje rzeczywistą interakcję. Po pomyślnym zakończeniu wdrażania ponownie uruchom Crestodiana.

## Inicjalizacja konfiguracji

`setup` konfiguruje pozostały stan obszaru roboczego i Gateway po wcześniejszym skonfigurowaniu wnioskowania przez prowadzone wdrażanie. Zapisuje dane wyłącznie za pomocą typowanych operacji konfiguracji i najpierw prosi o zatwierdzenie.

```text
setup
setup workspace ~/Projects/work
```

`setup` zachowuje zweryfikowany efektywny model. Nie konfiguruje ani nie zastępuje wnioskowania.

Jeśli brakuje wnioskowania lub jego test w działającej interakcji kończy się niepowodzeniem, zamknij Crestodiana i uruchom `openclaw onboard`. Prowadzone wdrażanie wykrywa skonfigurowane modele, klucze API i uwierzytelnione lokalne CLI, prosi każdego kandydata o rzeczywistą odpowiedź i utrwala tylko działającą trasę. Crestodian uruchamia się natychmiast po przekroczeniu tej granicy i może następnie skonfigurować obszar roboczy, Gateway, kanały, agentów, pluginy oraz inne funkcje opcjonalne.

Aplikacja macOS całkowicie pomija tę sekwencję, gdy uzyska dostęp do skonfigurowanego Gateway, którego domyślny agent ma już skonfigurowany model; otwiera zwykły interfejs agenta.
W przypadku nowego lub niekompletnego Gateway aplikacja przeprowadza sekwencję konfiguracji wnioskowania za pomocą metod Gateway `crestodian.setup.detect` i `crestodian.setup.activate`: detect wyświetla wszystkich znalezionych kandydatów na backend, activate testuje jednego kandydata w działającej interakcji (rzeczywiste wygenerowanie odpowiedzi „reply with OK”), a dopiero po pomyślnym teście utrwala model, poświadczenie oraz stan dostawcy/środowiska wykonawczego wymagany dla tej trasy. Ustawienia domyślne obszaru roboczego i Gateway pozostają do skonfigurowania przez Crestodiana. Kandydat, który nie przejdzie testu, nigdy nie zmienia konfiguracji; aplikacja automatycznie przechodzi przez kolejne poziomy sekwencji, a na końcu proponuje ręczne wprowadzenie klucza/tokenu, wstępnie uzupełnione na podstawie aktywnych pluginów dostawców wnioskowania tekstowego Gateway. Wybrany dostawca określa swój model początkowy i konfigurację, a poświadczenie jest weryfikowane w ten sam sposób przed zapisaniem.

Nadzór Codex i inne opcjonalne funkcje pluginów pozostają poza tą transakcją aktywacji wnioskowania. Konfiguruj je dopiero po uruchomieniu wnioskowania i Crestodiana; istniejące zasady pluginów i jawne rezygnacje z nadzoru pozostają niezmienione podczas konfiguracji wnioskowania.

## Rozmowa z AI

Swobodna rozmowa w interaktywnym Crestodianie korzysta z tej samej pętli agenta co zwykli agenci OpenClaw, ale jest ograniczona do jednego narzędzia OpenClaw o najwyższym poziomie uprawnień, `crestodian`, które opakowuje operacje typowane. Czynności odczytu są wykonywane swobodnie, mutacje wymagają Twojego zatwierdzenia w rozmowie dla dokładnie tej operacji (zobacz Operacje i zatwierdzanie), a każdy zastosowany zapis podlega audytowi i ponownej walidacji. Sesja agenta jest utrwalana, dzięki czemu Crestodian ma rzeczywistą pamięć obejmującą wiele interakcji. Jeśli zweryfikowana trasa wnioskowania później przestanie działać, wróć do `openclaw onboard` i napraw ją przed kontynuowaniem.

Host nie przekształca żądań w języku naturalnym na operacje. Swobodne wiadomości — w tym tekst przypominający polecenia oraz pytania, takie jak „dlaczego mój gateway przestał działać?” — trafiają do AI, która może odwzorować żądanie na typowaną operację za pomocą narzędzia `crestodian`.

Gdy mutacja oczekuje na decyzję, bez wnioskowania rozpoznawane są wyłącznie jednoznaczne frazy zatwierdzenia lub odmowy z zamkniętej listy. Niejednoznaczna zgoda jest przekazywana do oddzielnego skonfigurowanego wywołania generowania odpowiedzi, a gdy jest ono niedostępne, operacja jest bezpiecznie odrzucana. Ustrukturyzowane pola kreatora i dokładna nawigacja hosta są elementami sterującymi interfejsu, a nie mechanizmem interpretowania operacji w języku naturalnym. Szczególnie ważny jest jeden wyjątek dotyczący ochrony sekretów: dokładne polecenie `config set` dotyczące poufnej ścieżki (tokenów, kluczy, haseł) nigdy nie trafia do modelu. Host tworzy zredagowaną propozycję, a wartość jest maskowana w historii widocznej dla AI. W przypadku sekretów preferuj `config set-ref <path> env <ENV_VAR>`.

Tryb ratunkowy kanałów wiadomości nigdy nie korzysta z planera wspomaganego przez model. Zdalne odzyskiwanie pozostaje deterministyczne, aby uszkodzona lub przejęta zwykła ścieżka agenta nie mogła służyć jako edytor konfiguracji.

### Model zaufania mechanizmu CLI

Osadzone środowiska wykonawcze i mechanizm serwera aplikacji Codex bezpośrednio wymuszają ograniczenie najwyższego poziomu uprawnień: uruchomienie zawiera listę dozwolonych narzędzi OpenClaw obejmującą wyłącznie narzędzie `crestodian`. W przypadku Codex OpenClaw wyłącza również dla tego uruchomienia środowiska, natywne wykonywanie, obsługę wielu agentów, cel, powierzchnie aplikacji/pluginów, Skills/MCP, wyszukiwanie w sieci oraz `request_user_input`. Codex nadal wstrzykuje swoje nieaktywne natywne narzędzie `update_plan`; może ono aktualizować tymczasową listę kontrolną modelu, ale nie może zapisywać plików ani konfiguracji OpenClaw. Mechanizmy CLI nie korzystają z listy dozwolonych narzędzi OpenClaw, dlatego Crestodian dopuszcza wyłącznie backendy, których własny kontrakt wyboru narzędzi może zagwarantować takie samo ograniczenie:

- Wybieralne backendy, w tym Claude Code, uruchamiają się z pustym wyborem
  narzędzi natywnych i jednym narzędziem MCP: `crestodian`. Wygenerowana przez
  Claude konfiguracja MCP jest stosowana z flagą `--strict-mcp-config`, więc
  żadne inne serwery MCP nie są ładowane.
- Backendy, które nie deklarują żadnych narzędzi natywnych, otrzymują ten sam
  dedykowany serwer MCP Crestodian.
- Backendy z narzędziami natywnymi zawsze włączonymi lub o nieznanym stanie
  odmawiają działania przed wnioskowaniem; nie mogą obsługiwać sesji Crestodian.

Tylko sesje Crestodian otrzymują serwer MCP crestodian; zwykłe uruchomienia
agentów nigdy nie widzą tego narzędzia. Wybieralne backendy CLI bez narzędzi
natywnych oraz modele korzystające z klucza API wymuszają zatem dosłowną pętlę
z jednym narzędziem. Modele serwera aplikacji Codex wymuszają jedno narzędzie
kontrolne OpenClaw oraz nieaktywne natywne narzędzie planowania. We wszystkich
trzech przypadkach zapisy konfiguracji pozostają ograniczone do audytowanej
umowy zatwierdzania Crestodian.

Gemini CLI pozostaje dostępny dla zwykłych agentów, ale nie może wymusić testu
bez narzędzi wymaganego przez bramkę wnioskowania, więc nie może obsługiwać
Crestodian.

## Przełączanie do agenta

Użyj selektora w języku naturalnym, aby opuścić Crestodian i otworzyć zwykły TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` i `openclaw terminal` otwierają bezpośrednio
zwykły TUI agenta; nie uruchamiają Crestodian. Po przełączeniu do zwykłego TUI
polecenie `/crestodian` powraca do Crestodian, opcjonalnie z dodatkowym żądaniem:

```text
/crestodian
/crestodian restart gateway
```

## Tryb ratunkowy wiadomości

Tryb ratunkowy wiadomości jest punktem wejścia do Crestodian przez kanał
wiadomości: użyj go, gdy zwykły agent nie działa, ale zaufany kanał (na przykład
WhatsApp) nadal odbiera polecenia.

Jest to deterministyczny mechanizm obsługi poleceń awaryjnych, a nie
konwersacyjny agent Crestodian. Nie inicjuje nowej konfiguracji ani nie łagodzi
bramki wnioskowania dla czatu Crestodian.

Obsługiwane polecenie: `/crestodian <request>`. Tryb ratunkowy akceptuje
wyłącznie dokładną, wpisaną składnię polecenia — język naturalny jest odrzucany
z podpowiedzią, nigdy nie jest domyślnie interpretowany jako operacja i żaden
model nie jest nigdy używany.

```text
Ty, w zaufanej wiadomości prywatnej właściciela: /crestodian status
OpenClaw: Tryb ratunkowy Crestodian. Gateway osiągalny: nie. Konfiguracja poprawna: nie.
Ty: /crestodian restart gateway
OpenClaw: Plan: uruchomić ponownie Gateway. Odpowiedz /crestodian yes, aby zastosować.
Ty: /crestodian yes
OpenClaw: Zastosowano. Zapisano wpis audytu.
```

Tworzenie agenta można również umieścić w kolejce lokalnie lub za pośrednictwem
trybu ratunkowego:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Podczas tworzenia agenta można wskazać wyłącznie bieżący, zweryfikowany na żywo
model domyślny. Pomiń model, aby odziedziczyć tę trasę.

Zdalny tryb ratunkowy jest powierzchnią administracyjną i musi być traktowany
jak zdalna naprawa konfiguracji, a nie zwykły czat.

Umowa bezpieczeństwa dla zdalnego trybu ratunkowego:

- Jest wyłączony, gdy dla agenta lub sesji aktywna jest piaskownica; Crestodian
  odmawia zdalnego trybu ratunkowego i wskazuje lokalną naprawę przez CLI.
- Domyślny stan efektywny to `auto`: zdalny tryb ratunkowy jest dozwolony tylko
  w zaufanym trybie YOLO, w którym środowisko wykonawcze ma już lokalne
  uprawnienia bez piaskownicy (`tools.exec.security` przyjmuje wartość `full`,
  a `tools.exec.ask` wartość `off`, przy trybie piaskownicy `off`).
- Wymaga jawnej tożsamości właściciela; niedozwolone są reguły nadawców
  z symbolami wieloznacznymi, otwarte zasady grup, nieuwierzytelnione webhooki
  ani anonimowe kanały.
- Domyślnie dozwolone są tylko wiadomości prywatne właściciela; tryb ratunkowy
  w grupie lub kanale wymaga jawnego włączenia.
- Wyszukiwanie i wyświetlanie listy Pluginów jest tylko do odczytu. Instalowanie
  Pluginów jest zawsze dostępne wyłącznie lokalnie (zablokowane w trybie
  ratunkowym, nawet jeśli w innym przypadku jest włączone), ponieważ pobiera
  kod wykonywalny. Odinstalowywanie Pluginów jest niedozwolone zarówno
  w lokalnym Crestodian, jak i w trybie ratunkowym; uruchom
  `openclaw plugins uninstall <id>` w terminalu.
- Zdalny tryb ratunkowy nie może otworzyć lokalnego TUI ani przełączyć się do
  interaktywnej sesji agenta; do przekazania sterowania agentowi użyj lokalnego
  polecenia `openclaw`.
- Trwałe zapisy nadal wymagają zatwierdzenia, nawet w trybie ratunkowym.
- Każda zastosowana operacja ratunkowa jest audytowana. Tryb ratunkowy kanału
  wiadomości rejestruje kanał, konto, nadawcę i metadane adresu źródłowego;
  operacje modyfikujące konfigurację rejestrują również skróty konfiguracji
  przed zmianą i po niej.
- Sekrety nigdy nie są wyświetlane. Kontrola SecretRef informuje
  o dostępności, a nie o wartościach.
- Jeśli Gateway działa, tryb ratunkowy preferuje typowane operacje Gateway;
  jeśli nie działa, używa wyłącznie minimalnej lokalnej powierzchni naprawczej,
  która nie zależy od zwykłej pętli agenta.

Struktura konfiguracji:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (wartość domyślna) zezwala na tryb ratunkowy tylko wtedy,
  gdy efektywne środowisko wykonawcze działa w trybie YOLO, a piaskownica jest
  wyłączona; `false` nigdy nie zezwala na tryb ratunkowy przez kanał wiadomości;
  `true` jawnie zezwala na tryb ratunkowy po przejściu kontroli właściciela
  i kanału (nadal z uwzględnieniem odmowy przy aktywnej piaskownicy).
- `ownerDmOnly`: ogranicza tryb ratunkowy do wiadomości prywatnych właściciela.
  Wartość domyślna to `true`.
- `pendingTtlMinutes`: czas, przez jaki oczekujący zapis ratunkowy pozostaje
  dostępny do zatwierdzenia poleceniem `/crestodian yes`, zanim wygaśnie.
  Wartość domyślna to `15`.

Zdalny tryb ratunkowy jest objęty ścieżką testów Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Opcjonalny test dymny powierzchni poleceń aktywnego kanału sprawdza
`/crestodian status` oraz pełny cykl trwałego zatwierdzenia za pośrednictwem
mechanizmu obsługi trybu ratunkowego:

```bash
pnpm test:live:crestodian-rescue-channel
```

Jednorazowa konfiguracja pakietowa chroniona bramką wnioskowania jest objęta
poleceniem:

```bash
pnpm test:docker:crestodian-first-run
```

Ta ścieżka pakietowego CLI rozpoczyna pracę z pustym katalogiem stanu i dowodzi,
że Crestodian odmawia działania bez wnioskowania. Następnie testuje i aktywuje
fałszywy Claude za pomocą pakietowego modułu aktywacji. Dopiero potem nieprecyzyjne
żądanie trafia do planisty i zostaje przekształcone w typowaną konfigurację,
po czym wykonywane są jednorazowe polecenia, które tworzą dodatkowego agenta,
konfigurują Discord przez włączenie Pluginu oraz SecretRef tokenu, sprawdzają
poprawność konfiguracji i kontrolują dziennik audytu. Ta ścieżka dostarcza
pomocniczych dowodów działania bramki i operacji; nie obejmuje interaktywnego
wdrażania ani rozmowy z agentem Crestodian dotyczącej narzędzi i zatwierdzeń.
Poniższy scenariusz laboratorium kontroli jakości przekierowuje do tej samej
ścieżki Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/cli/doctor)
- [TUI](/pl/cli/tui)
- [Piaskownica](/pl/cli/sandbox)
- [Bezpieczeństwo](/pl/cli/security)
