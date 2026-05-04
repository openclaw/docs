---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania ściągnięcia
    - Dodawanie scenariuszy dla Discord, Slack, WhatsApp lub innych transportów na żywo
    - Debugowanie uruchomień QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu przez VNC
summary: Mantis to wizualny system kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw na aktywnych transportach, rejestrowania materiału dowodowego sprzed i po poprawce oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-04T02:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają rzeczywistego
runtime, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz względem znanego
błędnego ref, przechwytuje dowody, uruchamia ten sam scenariusz względem ref kandydata i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR lub
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam wartościową pierwszą ścieżkę:
rzeczywiste uwierzytelnianie bota, rzeczywiste kanały serwera, reakcje, wątki, natywne polecenia oraz
interfejs przeglądarki, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR w GitHub z takim samym kształtem transportu, jaki widzą
  użytkownicy.
- Przechwycić artefakt **przed** na bazowym ref przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na ref kandydata po zastosowaniu poprawki.
- Używać deterministycznej wyroczni zawsze, gdy to możliwe, takiej jak odczyt reakcji
  Discord REST lub sprawdzenie transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczająco dużo stanu maszyny do ratunkowego VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie providera się zablokuje.
- Publikować zwięzły status na operatorskim kanale Discord, gdy uruchomienie jest zablokowane,
  wymaga ręcznej pomocy przez VNC albo się kończy.

## Poza Zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis powinno zwykle stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest normalną szybką bramką CI. Jest wolniejszy, używa danych uwierzytelniających na żywo i
  jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka w normalnej pracy. Ręczne VNC to ścieżka ratunkowa,
  nie ścieżka domyślna.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem runtime scenariuszy, adapterów transportu, schematu dowodów i
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem części harnessu transportu live, helperów przechwytywania przeglądarki i
  writerów artefaktów.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów,
  dispatchowania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania,
  debugowania lub raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, harmonogramowanie maszyn w
Crabbox, a klej workflow maintainera w ClawSweeper.

## Kształt Polecenia

Pierwsze lokalne polecenie weryfikuje bota Discord, serwer, kanał, wysłanie wiadomości,
wysłanie reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po akceptuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone worktree bazowe i kandydata pod katalogiem wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status bazowy to `fail`, a status kandydata to `pass`.

Pierwszym prymitywem VM/przeglądarki jest desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Wynajmuje lub ponownie używa maszyny desktopowej Crabbox, uruchamia widoczną przeglądarkę wewnątrz
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
providera Hetzner, ponieważ jest pierwszym providerem z działającym pokryciem desktop/VNC
w ścieżce Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` lub
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz na innej flocie Crabbox.

Przydatne flagi desktop smoke:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje lokalny dla repo artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwycenia wygenerowanej osi czasu reakcji statusu Discord przez rzeczywisty desktop Crabbox.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` pozostawia nowo utworzoną, przechodzącą dzierżawę otwartą do inspekcji VNC. Nieudane uruchomienia domyślnie zachowują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny oraz czas życia dzierżawy.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po
dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Akceptuje:

- `baseline_ref`: ref, po którym oczekuje się odtworzenia zachowania tylko queued.
- `candidate_ref`: ref, po którym oczekuje się pokazania `queued -> thinking -> done`.

Checkoutuje ref harnessu workflow, buduje osobne worktree bazowe i kandydata,
uruchamia `discord-status-reactions-tool-only` względem każdego worktree i
przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje też HTML osi czasu każdej ścieżki w desktopowej przeglądarce Crabbox
i publikuje te zrzuty ekranu VNC obok deterministycznych PNG osi czasu w komentarzu PR.
Workflow buduje CLI Crabbox z `openclaw/crabbox` main, aby móc użyć bieżących flag dzierżawy desktop/przeglądarka
przed wydaniem następnej wersji binarnej Crabbox.

Możesz też wywołać uruchomienie status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarzem jest celowo wąski. Uruchamia się tylko na komentarzach pull request
od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko
żądania reakcji statusu Discord. Domyślnie używa znanego błędnego ref bazowego
oraz bieżącego SHA głowy PR jako kandydata. Maintainerzy mogą nadpisać dowolny
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skoncentrowane na scenariuszu. Drugie może później mapować PR
lub issue na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików i
ustaleń z przeglądu ClawSweeper.

## Cykl Życia Uruchomienia

1. Pozyskaj dane uwierzytelniające.
2. Przydziel lub ponownie użyj VM.
3. Przygotuj profil desktop/przeglądarka, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla bazowego ref.
5. Zainstaluj zależności i zbuduj tylko to, czego potrzebuje scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, providera, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj Gateway i zachowaj logi.
10. Przygotuj ref kandydata w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śladu.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu PR lub Discord.

Scenariusz powinien móc nie powieść się na dwa różne sposoby:

- **Błąd odtworzony**: baza nie powiodła się w oczekiwany sposób.
- **Awaria harnessu**: konfiguracja środowiska, dane uwierzytelniające, API Discord, przeglądarka lub
  provider zawiodły, zanim wyrocznia błędu była znacząca.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili niestabilnego
środowiska z zachowaniem produktu.

## MVP Discord

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach serwera, gdzie
tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobry zalążek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, uwierzytelnianie bota Discord, dispatch wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąski, aby utrzymać pierwszą implementację uczciwą.

Oczekiwany kształt scenariusza:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Dowody bazowe powinny pokazywać reakcję potwierdzenia queued, ale bez
przejścia cyklu życia w trybie tylko narzędziowym. Dowody kandydata powinny pokazywać działające reakcje
statusu cyklu życia, gdy `messages.statusReactions.enabled` jest jawnie
true.

Pierwszym wykonywalnym wycinkiem jest opcjonalny scenariusz Discord live QA:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT z zawsze włączoną obsługą serwera, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Wyrocznia
polluje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji
`👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` oraz
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące Elementy QA

Mantis powinien bazować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę Discord live z botami drivera i
  SUT.
- Runner transportu live już zapisuje raporty i artefakty zaobserwowanych wiadomości
  pod `.artifacts/qa-e2e/`.
- Dzierżawy danych uwierzytelniających Convex już zapewniają wyłączny dostęp do współdzielonych danych uwierzytelniających
  transportu live.
- Usługa kontroli przeglądarki już obsługuje zrzuty ekranu, migawki,
  zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po nad tymi
elementami, plus jedna warstwa dowodów wizualnych.

## Model Dowodów

Każde uruchomienie zapisuje stabilny katalog artefaktów:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` powinien być maszynowo odczytywalnym źródłem prawdy. Raport
Markdown jest przeznaczony do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- przetestowane refy i SHA
- transport i id scenariusza
- providera maszyny oraz id maszyny lub id dzierżawy
- źródło danych uwierzytelniających bez wartości sekretów
- wynik bazowy
- wynik kandydata
- czy błąd odtworzono na bazie
- czy kandydat go naprawił
- ścieżki artefaktów
- oczyszczone problemy z konfiguracją lub sprzątaniem

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. Dla publicznych PR
preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji
nie będzie mocniejsza.

## Przeglądarka I VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright lub kontrola przeglądarki OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączone na tej samej VM, gdy logowanie, MFA, antyautomatyzacja Discord
  lub debugowanie wizualne wymaga człowieka.

Obserwacyjny profil przeglądarki Discord powinien być wystarczająco trwały, aby nie wymagać logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil należy do puli maszyn Mantis, a nie do laptopa dewelopera.

Gdy Mantis się zablokuje, publikuje komunikat statusu na Discord zawierający:

- identyfikator uruchomienia
- identyfikator scenariusza
- dostawcę maszyny
- katalog artefaktów
- instrukcje połączenia VNC lub noVNC, jeśli są dostępne
- krótki opis blokady

Pierwsze prywatne wdrożenie może publikować te komunikaty w istniejącym kanale operatorów, a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej zdalnej implementacji.
Crabbox zapewnia nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i
sprzątanie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium obsługującą środowisko graficzne
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratunkowego dostępu
- Node 22 i pnpm
- checkout OpenClaw i pamięć podręczna zależności
- pamięć podręczna przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco dużo CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub profili przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla zdalnych uruchomień oraz w lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesyłek artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Długoterminowo pula poświadczeń Convex powinna pozostać standardowym źródłem poświadczeń transportu na żywo. Sekrety GitHub uruchamiają brokera i ścieżki awaryjne.
Przepływ status-reactions Discord mapuje sekrety Mantis Crabbox z powrotem na zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`, których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają akceptowane jako awaryjna kompatybilność.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- plików cookie przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych ładunków poświadczeń

Publiczne przesyłki artefaktów powinny również redagować metadane celu Discord, takie jak identyfikatory bota, gildii, kanału i wiadomości. Z tego powodu przepływ smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR, czatu lub logu, obróć go po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Przepływy Mantis powinny przesyłać pełny pakiet dowodowy jako krótkotrwały artefakt Actions. Gdy przepływ jest uruchamiany dla raportu błędu lub PR z poprawką, powinien również opublikować zredagowane zrzuty ekranu PNG do gałęzi `qa-artifacts` i wykonać upsert komentarza w tym błędzie lub PR z poprawką, z osadzonymi zrzutami ekranu przed/po. Nie publikuj głównego dowodu tylko w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Przepływy produkcyjne powinny publikować te komentarze za pomocą Mantis GitHub App, a nie za pomocą `github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`. Przepływ używa ukrytego znacznika jako klucza upsert, aktualizuje ten komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy starszego znacznika należącego do bota nie można edytować.

Komentarz PR powinien być krótki i wizualny:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Gdy uruchomienie kończy się niepowodzeniem, ponieważ zawiódł harness, komentarz musi to powiedzieć, zamiast sugerować, że kandydat zawiódł.

## Notatki dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej aplikacji zamiast tworzyć kolejną, gdy ma odpowiednie uprawnienia bota i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia. Może on najpierw wskazywać istniejący kanał maintainerów lub operacyjny, a następnie przejść do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, plików cookie przeglądarki ani haseł VNC. Przechowuj je w sekretach GitHub, brokerze poświadczeń albo lokalnym magazynie sekretów operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- politykę ref bazowego
- politykę ref kandydata
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię bazową
- oczekiwaną wyrocznię kandydata
- cele przechwytywania wizualnego
- budżet czasu oczekiwania
- kroki sprzątania

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- ts wątku Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów poczty e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym elementem

Kontrole wizyjne powinny być addytywne. Jeśli API platformy może udowodnić błąd, użyj API jako wyroczni powodzenia/niepowodzenia i zachowaj zrzuty ekranu dla ludzkiej pewności.

## Rozszerzenie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy konektory nie wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, multimedia, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątku lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke oraz co najmniej jeden scenariusz klasy błędów. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego, czy tylko dowodów REST czytelnych dla bota w pierwszej fazie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub kadrowane przed przesłaniem dla publicznych PR?
