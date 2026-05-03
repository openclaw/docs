---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania ściągnięcia
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych
    - Debugowanie przebiegów QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw na działających transportach, rejestrowania dowodów sprzed i po zmianie oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-03T21:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają rzeczywistego
środowiska uruchomieniowego, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz względem znanego
błędnego refa, przechwytuje dowody, uruchamia ten sam scenariusz względem kandydującego refa i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a lub
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam wartościową pierwszą ścieżkę:
rzeczywiste uwierzytelnianie bota, rzeczywiste kanały serwera, reakcje, wątki, natywne polecenia oraz
interfejs użytkownika w przeglądarce, gdzie ludzie mogą wizualnie potwierdzić to, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR-a GitHub z takim samym kształtem transportu, jaki widzą
  użytkownicy.
- Przechwycić artefakt **przed** na bazowym refie przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na kandydującym refie po zastosowaniu poprawki.
- Używać deterministycznej wyroczni zawsze, gdy to możliwe, na przykład odczytu reakcji przez Discord REST
  albo sprawdzenia transkryptu kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczająco dużo stanu maszyny na potrzeby ratunkowego VNC, gdy logowanie, automatyzacja przeglądarki albo
  uwierzytelnianie providera utknie.
- Publikować zwięzły status na operatorskim kanale Discord, gdy uruchomienie jest zablokowane,
  wymaga ręcznej pomocy przez VNC albo kończy się.

## Poza Zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis powinno zwykle stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest standardową szybką bramką CI. Jest wolniejszy, używa aktywnych danych uwierzytelniających i
  jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka w normalnym działaniu. Ręczne VNC jest ścieżką ratunkową,
  nie ścieżką oczekiwaną.
- Mantis nie zapisuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów oraz
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem części harnessu transportu live, helperów przechwytywania z przeglądarki oraz
  zapisujących artefakty.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów,
  uruchamiania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania,
  debugowania albo raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej workflow maintainerów w ClawSweeper.

## Kształt Polecenia

Pierwsze lokalne polecenie weryfikuje bota Discord, serwer, kanał, wysłanie wiadomości,
wysłanie reakcji i ścieżkę artefaktu:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po przyjmuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone worktree baseline i candidate pod katalogiem wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status baseline to `fail`, a status candidate to `pass`.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po
dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Przyjmuje:

- `baseline_ref`: ref, który powinien odtworzyć zachowanie tylko w kolejce.
- `candidate_ref`: ref, który powinien pokazać `queued -> thinking -> done`.

Checkoutuje ref harnessu workflow, buduje osobne worktree baseline i candidate,
uruchamia `discord-status-reactions-tool-only` względem każdego worktree i
przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions.

Możesz też uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarzem jest celowo wąski. Uruchamia się tylko na komentarzach pull request
od użytkowników z dostępem write, maintain albo admin i rozpoznaje wyłącznie
żądania reakcji statusu Discord. Domyślnie używa znanego błędnego refa baseline
i bieżącego SHA nagłówka PR jako candidate. Maintainerzy mogą nadpisać dowolny
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później mapować PR
albo issue na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików i
ustaleń review ClawSweeper.

## Cykl Uruchomienia

1. Pozyskaj dane uwierzytelniające.
2. Przydziel albo ponownie użyj VM.
3. Przygotuj czysty checkout dla refa baseline.
4. Zainstaluj zależności i zbuduj tylko to, czego wymaga scenariusz.
5. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
6. Skonfiguruj transport live, providera, model i profil przeglądarki.
7. Uruchom scenariusz i przechwyć dowody baseline.
8. Zatrzymaj gateway i zachowaj logi.
9. Przygotuj ref candidate w tej samej VM.
10. Uruchom ten sam scenariusz i przechwyć dowody candidate.
11. Porównaj wyniki wyroczni i dowody wizualne.
12. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śladu.
13. Prześlij artefakty GitHub Actions.
14. Opublikuj zwięzłą wiadomość statusu PR albo Discord.

Scenariusz powinien móc nie powieść się na dwa różne sposoby:

- **Błąd odtworzony**: baseline zawiódł w oczekiwany sposób.
- **Awaria harnessu**: konfiguracja środowiska, dane uwierzytelniające, Discord API, przeglądarka albo
  provider zawiodły, zanim wyrocznia błędu miała znaczenie.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili niestabilnego
środowiska z zachowaniem produktu.

## MVP Discord

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach serwera, w których
tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobre ziarno Mantis:

- Jest widoczne w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, uwierzytelnianie bota Discord, wysyłkę wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąskie, aby utrzymać pierwszą implementację w ryzach.

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

Dowody baseline powinny pokazać reakcję potwierdzenia kolejki, ale bez
przejścia cyklu życia w trybie tylko narzędziowym. Dowody candidate powinny pokazać uruchomione
reakcje statusu cyklu życia, gdy `messages.statusReactions.enabled` jest jawnie
true.

Pierwszy wykonywalny wycinek to opt-in scenariusz QA live Discord:

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
odpytuje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji
`👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` i
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące Elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę Discord live z botami driver i
  SUT.
- Runner transportu live już zapisuje raporty i artefakty zaobserwowanych wiadomości
  pod `.artifacts/qa-e2e/`.
- Dzierżawy danych uwierzytelniających Convex już zapewniają wyłączny dostęp do współdzielonych danych uwierzytelniających
  transportu live.
- Usługa kontroli przeglądarki już obsługuje zrzuty ekranu, snapshoty,
  zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po ponad tymi
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

`mantis-summary.json` powinien być maszynowo czytelnym źródłem prawdy. Raport
Markdown służy do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- testowane refy i SHA
- transport i id scenariusza
- providera maszyny oraz id maszyny albo id dzierżawy
- źródło danych uwierzytelniających bez wartości sekretów
- wynik baseline
- wynik candidate
- czy błąd odtworzył się na baseline
- czy candidate go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji albo sprzątania

Zrzuty ekranu są dowodem, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników albo treść wiadomości. Dla publicznych PR-ów
preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji
nie będzie mocniejsza.

## Przeglądarka I VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright albo kontrola przeglądarki OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączone na tej samej VM, gdy logowanie, MFA, automatyzacja antyautomatyzacyjna Discord
  albo debugowanie wizualne wymaga człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby unikać
logowania przy każdym uruchomieniu, ale izolowany od osobistego stanu przeglądarki. Profil
należy do puli maszyn Mantis, nie do laptopa developera.

Gdy Mantis utknie, publikuje wiadomość statusu Discord z:

- id uruchomienia
- id scenariusza
- providerem maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC albo noVNC, jeśli są dostępne
- krótkim opisem blokera

Pierwsze prywatne wdrożenie może publikować te wiadomości na istniejącym kanale operatorskim
i później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox dla pierwszej zdalnej implementacji.
Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i
sprzątanie. Jeśli pojemność AWS jest zbyt wolna albo niedostępna, dodaj providera Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome albo Chromium zdolną do pracy z pulpitem
- dostęp CDP dla automatyzacji przeglądarki
- VNC albo noVNC do ratunku
- Node 22 i pnpm
- checkout OpenClaw i cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, providerów modeli i brokera danych uwierzytelniających

VM nie powinna przechowywać długowiecznych surowych sekretów poza oczekiwanymi magazynami danych uwierzytelniających albo
profilu przeglądarki.

## Sekrety

Sekrety żyją w sekretach organizacji albo repozytorium GitHub dla zdalnych uruchomień oraz w
lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` do publicznego przesyłania artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

W dłuższej perspektywie pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń transportu live. Sekrety GitHub inicjalizują brokera i ścieżki awaryjne.

Runner Mantis nigdy nie może wypisywać:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych payloadów poświadczeń

Publiczne przesyłanie artefaktów powinno także redagować metadane celu Discord, takie jak bot, gildia, kanał i identyfikatory wiadomości. Workflow smoke GitHub włącza z tego powodu `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR, czatu lub logu, obróć go po zapisaniu nowego sekretu.

## Artefakty GitHub I Komentarze PR

Workflow Mantis powinny przesyłać pełny pakiet dowodowy jako krótkotrwały artefakt Actions. Gdy workflow jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien także publikować zredagowane zrzuty ekranu PNG w gałęzi `qa-artifacts` i dodać lub zaktualizować komentarz w tym zgłoszeniu błędu albo PR z poprawką, z osadzonymi zrzutami ekranu przed/po. Nie publikuj głównego dowodu tylko w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Produkcyjne workflow powinny publikować te komentarze za pomocą Mantis GitHub App, a nie przez `github-actions[bot]`. Zapisz identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions `MANTIS_GITHUB_APP_ID` oraz `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow używa ukrytego znacznika jako klucza upsert, aktualizuje ten komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy starszego znacznika należącego do bota nie można edytować.

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

Gdy uruchomienie nie powiedzie się, ponieważ zawiódł harness, komentarz musi to powiedzieć zamiast sugerować, że zawiódł kandydat.

## Prywatne Notatki Wdrożeniowe

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej aplikacji zamiast tworzyć kolejną, jeśli ma odpowiednie uprawnienia bota i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia. Najpierw może wskazywać istniejący kanał maintainerów lub operacyjny, a następnie zostać przeniesiony do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC. Przechowuj je w sekretach GitHub, brokerze poświadczeń albo lokalnym magazynie sekretów operatora.

## Dodawanie Scenariusza

Scenariusz Mantis powinien deklarować:

- id i tytuł
- transport
- wymagane poświadczenia
- politykę referencji baseline
- politykę referencji kandydata
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwane oracle baseline
- oczekiwane oracle kandydata
- cele przechwytywania wizualnego
- budżet timeoutu
- kroki czyszczenia

Scenariusze powinny preferować małe, typowane oracle:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- thread ts Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym wynikiem

Kontrole wizyjne powinny być addytywne. Jeśli API platformy może udowodnić błąd, użyj API jako oracle zaliczenia/niezaliczenia, a zrzuty ekranu zachowaj dla zaufania człowieka.

## Rozszerzenie Dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki o aplikacji, modale, przesyłanie plików.
- Email: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy konektory nie wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, multimedia, reakcje.
- Telegram: bramkowanie wzmianek w grupie, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznawianie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i co najmniej jeden scenariusz klasy błędu. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte Pytania

- Który bot Discord powinien być driverem, a który SUT, gdy istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego, czy tylko dowodów REST czytelnych dla bota w pierwszej fazie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR?
