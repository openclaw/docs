---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub wsparcia w czasie działania
    - Wstępna klasyfikacja problemów zgłaszanych przez użytkowników przed głębszą diagnostyką
summary: Najczęściej zadawane pytania dotyczące instalacji, konfiguracji i użytkowania OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-05-07T13:19:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz bardziej szczegółowe rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, awaryjne przełączanie modeli). Diagnostykę działania znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełny opis konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, osiągalność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy w czasie działania (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką dziennika (tokeny ukryte).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko wykonawcze nadzorcy względem osiągalności RPC, docelowy adres URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę kondycji gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Śledź najnowszy dziennik**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj zapasowo:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dzienniki plikowe są oddzielne od dzienników usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację/stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Pobiera pełną migawkę z działającego gateway (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacja, onboarding, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w używanych już przez Ciebie kanałach komunikacji (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone Plugin kanałów, takie jak QQ Bot), a na obsługiwanych platformach może także obsługiwać głos + aktywny Canvas. **Gateway** to stale działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    wydajnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, z
    sesjami stanowymi, pamięcią i narzędziami - bez przekazywania kontroli nad Twoimi przepływami pracy hostowanemu
    SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i przechowuj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modeli:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i awaryjnym przełączaniem.
    - **Opcja tylko lokalna:** uruchamiaj lokalne modele, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** osobni agenci na kanał, konto lub zadanie, każdy z własnym
      obszarem roboczym i ustawieniami domyślnymi.
    - **Open source i łatwość modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmaila i zautomatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz podagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i wiadomości, które Cię interesują.
    - **Research i redagowanie:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i listy kontrolne sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w generowaniu leadów, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i redagowania**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać prospektów i pisać wersje robocze outreachu lub tekstów reklamowych.

    W przypadku **outreachu lub kampanii reklamowych** zachowaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować wersję roboczą, a następnie ją zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code w tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania wewnątrz repozytorium. Używaj OpenClaw, gdy
    potrzebujesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + obszar roboczy** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramowanie, hooki)
    - **Stale działający Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Nodes** dla lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania brudnego repozytorium?">
    Użyj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (lub dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z dołączonymi Skills bez dotykania git. Jeśli Skill musi być zainstalowany globalnie, ale widoczny tylko dla części agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repozytorium i trafiać jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślna kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli Skill powinien być widoczny tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` per zadanie.
    - **Podagenci**: kieruj zadania do osobnych agentów z różnymi domyślnymi modelami.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak przenieść to poza główny wątek?">
    Używaj **podagentów** do długich lub równoległych zadań. Podagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota o „spawn a sub-agent for this task” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi w tej chwili (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i podagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla podagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje podagentów powiązane z wątkiem w Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z podagentem lub docelową sesją, aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"` dla trwałych odpowiedzi następczych).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne cofanie skupienia.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw na `false`, aby wyłączyć tworzenie sesji powiązanych z wątkiem.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Podagent zakończył pracę, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę zlecającego:

    - Dostarczanie podagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, gdy taka istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji zlecającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wróci do kolejkowanego dostarczania sesji zamiast natychmiastowego opublikowania na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić zapasową kolejkę albo ostateczną awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo pomija ogłoszenie zamiast publikować wcześniejszy nieaktualny postęp.
    - Jeśli dziecko przekroczyło limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie zostaną uruchomione.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpienia/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` względem strefy czasowej hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron został uruchomiony, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie jest oczekiwane awaryjne wysłanie przez runnera.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale dane logowania to zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner także pomija zakolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` kontroluje tylko awaryjną ścieżkę runnera
    dla tekstu końcowego, którego agent nie wysłał już samodzielnie.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron zmieniło modele lub ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie zdublowane harmonogramowanie.

    Izolowany Cron może utrwalić przekazanie modelu w czasie działania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowna próba zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowieniem próby.

    Powiązane reguły wyboru:

    - Nadpisanie modelu haka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` na poziomie zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji Cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponowień jest ograniczona. Po początkowej próbie oraz 2 ponowieniach przełączenia
    Cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI Cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs Skills dla macOS nie jest dostępny w systemie Linux.
    Przeglądaj Skills na [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Natywne `openclaw skills install` zapisuje do katalogu `skills/`
    aktywnego obszaru roboczego. Zainstaluj osobne CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. W przypadku instalacji współdzielonych między agentami umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania zgodnie z harmonogramem lub stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zadań zaplanowanych lub cyklicznych (trwałe między restartami).
    - **Heartbeat** do okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprościej).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja w pasku menu) i ustaw **Node Run Commands** na „Always Ask” albo „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills za pomocą narzędzia `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - proxy plików binarnych macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI wskazywały na wrappery SSH uruchamiane na Macu. Następnie nadpisz Skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla pliku binarnego (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (obszar roboczy albo `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na błędy.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywną integrację, otwórz zgłoszenie funkcji albo zbuduj Skill
    ukierunkowany na te API.

    Zainstaluj Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku Skills współdzielonych między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć instalację współdzieloną, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak użyć istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który dołącza przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz użyć własnej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na ref, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobierania oraz akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Izolowanie i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja izolowania?">
    Tak. Zobacz [Izolowanie](/pl/gateway/sandboxing). Konfigurację specyficzną dla Docker (pełny Gateway w Docker albo obrazy piaskownicy) opisuje [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Pełniejsza konfiguracja:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne wiadomości DM jako osobiste, a grupy jako publiczne/izolowane z jednym agentem?">
    Tak - jeśli Twój ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż główne) działały w skonfigurowanym backendzie izolowania, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach izolowanych za pomocą `tools.sandbox.tools`.

    Instrukcja konfiguracji + przykładowa konfiguracja: [Grupy: osobiste DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podłączyć folder hosta do piaskownicy?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Dowiązania globalne i na poziomie agenta są scalane; dowiązania na poziomie agenta są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że dowiązania omijają ściany systemu plików piaskownicy.

    OpenClaw weryfikuje źródła dowiązań względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego dowiązaniem symbolicznym nadal kończą się niepowodzeniem w sposób zamknięty, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Izolowanie](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Piaskownica vs polityka narzędzi vs podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby znaleźć przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia również **cichy zapis pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (piaskownice tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina różne rzeczy. Jak sprawić, żeby zostały zapamiętane?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są ograniczenia?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Ograniczeniem jest Twoja
    przestrzeń dyskowa, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu modelu,
    więc długie rozmowy mogą zostać skompaktowane albo przycięte. Dlatego istnieje wyszukiwanie w pamięci - przywraca do kontekstu tylko istotne części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy wyszukiwanie pamięci semantycznej wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddings OpenAI**. Codex OAuth obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddings, więc **zalogowanie się przez Codex (OAuth lub
    logowanie CLI Codex)** nie pomaga przy wyszukiwaniu pamięci semantycznej. Embeddings OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli rozwiąże się klucz OpenAI, w przeciwnym razie Gemini, jeśli rozwiąże się klucz Gemini,
    potem Voyage, potem Mistral. Jeśli nie jest dostępny żaden zdalny klucz, wyszukiwanie
    pamięci pozostaje wyłączone do czasu skonfigurowania. Jeśli masz skonfigurowaną
    i obecną ścieżkę modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddings Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama lub local**
    - szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i obszar roboczy znajdują się na hoście Gateway
      (`~/.openclaw` + katalog obszaru roboczego).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Obszar roboczy agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Przeznaczenie                                                      |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` wyczyszczone)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan na agenta (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia i stan rozmów (na agenta)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (na agenta)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **obszar roboczy** (AGENTS.md, pliki pamięci, skills, itd.) jest osobny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **obszarze roboczym agenta**, nie w `~/.openclaw`.

    - **Obszar roboczy (na agenta)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Główny plik `memory.md` małymi literami jest tylko starszym wejściem naprawczym; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      i współdzielone skills (`~/.openclaw/skills`).

    Domyślny obszar roboczy to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, potwierdź, że Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa obszaru roboczego
    **hosta gateway**, a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz zachować trwałe zachowanie lub preferencję, poproś bota, aby **zapisał je w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Obszar roboczy agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **obszar roboczy agenta** w **prywatnym** repozytorium git i wykonuj jego kopię zapasową w prywatnym miejscu
    (na przykład GitHub private). To obejmuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później przywrócić „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego przywrócenia, wykonaj kopię zapasową zarówno obszaru roboczego, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza obszarem roboczym?">
    Tak. Obszar roboczy jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane w obszarze roboczym, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandboxa dla konkretnego agenta. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; utrzymuj
    obszar roboczy osobno, chyba że celowo chcesz, aby agent pracował w nim.

    Przykład (repozytorium jako domyślne cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb zdalny: gdzie jest magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, istotny dla Ciebie magazyn sesji znajduje się na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli pliku brakuje, używa dość bezpiecznych wartości domyślnych (w tym domyślnego obszaru roboczego `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (lub "tailnet") i teraz nic nie nasłuchuje / UI pokazuje brak autoryzacji'>
    Bindowania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie współdzielonym sekretem: token lub hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym odwrotnym proxy świadomym tożsamości

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Uwagi:

    - `gateway.remote.token` / `.password` **nie** włączają samodzielnie lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalny fallback).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania współdzielonych sekretów w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` odwrotne proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej ścieżce domyślnej oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, start gateway rozwiązuje się do trybu tokena i generuje token tylko na czas działania dla tego uruchomienia, więc **lokalni klienci WS muszą się uwierzytelnić**. Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub `OPENCLAW_GATEWAY_PASSWORD`, gdy klienci potrzebują stabilnego sekretu między restartami. To blokuje innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (lub, dla odwrotnych proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w swojej konfiguracji. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): stosuje bezpieczne zmiany na gorąco, restartuje dla krytycznych
    - obsługiwane są też `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Jak wyłączyć zabawne slogany CLI?">
    Ustaw `cli.banner.taglineMode` w konfiguracji:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ukrywa tekst sloganu, ale zachowuje linię tytułu/wersji banera.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie z sieci)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają swojej standardowej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy środowiskowe:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` lub `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` lub `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Konfiguracja wyszukiwania w internecie specyficzna dla dostawcy znajduje się teraz w `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` nadal są tymczasowo wczytywane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja awaryjna pobierania stron przez Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostanie jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego awaryjnego dostawcę pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia web](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja zepsuje uruchamianie lub przeładowanie na gorąco, Gateway kończy bezpiecznie albo pomija przeładowanie; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą konfigurację, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` lub `config reload skipped (invalid config)`.
    - Sprawdź najnowszy `openclaw.json.clobbered.*` lub `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` i `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo ponownie uruchom `openclaw doctor` i skonfiguruj ponownie kanały/modele.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent programistyczny często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnej.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki albo kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszej eksploracji.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zachowaj wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz właścicielskiego narzędzia `gateway` z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfiguruj](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na wielu urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **węzły** i **agenci**:

    - **Gateway (centralny):** posiada kanały (Signal/WhatsApp), routing i sesje.
    - **Węzły (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** osobne mózgi/przestrzenie robocze do specjalnych ról (np. „Operacje Hetzner”, „Dane osobiste”).
    - **Subagenci:** uruchamiaj pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Węzły](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [TUI](/pl/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać w trybie headless?">
    Tak. To opcja konfiguracji:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Wartość domyślna to `false` (z widocznym oknem). Tryb headless częściej wyzwala kontrole antybotowe w niektórych witrynach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa w większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre witryny są bardziej rygorystyczne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak użyć Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (albo dowolną przeglądarkę opartą na Chromium) i uruchom ponownie Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gatewaye i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gatewayem i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Węzeł → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu dostawcy; odbierają tylko wywołania RPC węzła.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na twoim lokalnym komputerze przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście działającym stale (VPS/serwer domowy).
    2. Umieść host Gateway + swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Zdalnie przez SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: parowanie węzła macOS pozwala na `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączone, ale nie otrzymuję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanału: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że twoje listy dozwolonych (DM lub grupa) zawierają twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-bot”, ale możesz go skonfigurować na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a następnie Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, którego słucha drugi bot.
    Jeśli jeden bot jest na zdalnym VPS, skieruj CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może połączyć się z docelowym Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy
    dozwolonych kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów albo subagentów.

  </Accordion>

  <Accordion title="Czy korzystanie z węzła na moim osobistym laptopie zamiast SSH z VPS ma zalety?">
    Tak - węzły są pierwszoplanowym sposobem dostępu do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS albo urządzenie klasy Raspberry Pi wystarczy; 4 GB RAM to dużo), więc typową
    konfiguracją jest stale działający host plus laptop jako węzeł.

    - **Brak wymaganego przychodzącego SSH.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrolki wykonywania.** `system.run` jest ograniczane listami dozwolonych/zatwierdzeniami węzła na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zostaw Gateway na VPS, ale uruchom Chrome lokalnie przez host węzła na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH nadaje się do doraźnego dostępu do powłoki, ale węzły są prostsze dla stałych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę gateway?">
    Nie. Na host powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Węzły są urządzeniami peryferyjnymi, które łączą się
    z gatewayem (węzły iOS/Android albo „tryb węzła” macOS w aplikacji paska menu). Dla bezgłowych hostów węzłów
    i sterowania CLI zobacz [CLI hosta węzła](/pl/cli/node).

    Pełny restart jest wymagany dla zmian powierzchni `gateway`, `discovery` i hostowanego Plugin.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżącą migawkę + skrót
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i uruchamia ponownie, gdy jest to wymagane
    - `config.apply`: zweryfikuj + zastąp całą konfigurację; przeładowuje na gorąco, gdy to możliwe, i uruchamia ponownie, gdy jest to wymagane
    - Narzędzie uruchomieniowe `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia workspace i ogranicza, kto może uruchamiać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnetu.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnetu**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz korzystać z Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje przypisany do local loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć węzeł Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Węzły łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tym samym tailnecie**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (cel SSH może być nazwą hosta tailnetu).
       Aplikacja zestawi tunel dla portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy tylko dodać węzeł?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **węzeł**. Dzięki temu zachowasz jeden Gateway i unikniesz zduplikowanej konfiguracji. Lokalne narzędzia węzła są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie osobnych botów.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też definiować wbudowane zmienne środowiskowe w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełną kolejność pierwszeństwa i źródła znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały wczytane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
    2. Włącz import z powłoki (opcjonalne ułatwienie):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    To uruchamia powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` informuje, czy **import środowiska powłoki** jest włączony. "Shell env: off"
    **nie** oznacza, że brakuje zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko wtedy, gdy brakuje go w środowisku).

    Następnie uruchom ponownie gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (także `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/concepts/model-providers](/pl/concepts/model-providers) i [/environment](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć nową rozmowę?">
    Wyślij `/new` albo `/reset` jako osobną wiadomość. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transkrypcji - po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy da się utworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wielu agentów** i **sub-agentów**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów wykonawczych z własnymi workspace’ami i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często jest
    mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    zakładamy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać sub-agentów.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyjścia narzędzi lub wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Przechowuj ważny kontekst w workspace i poproś bota, aby go odczytał.
    - Używaj sub-agentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale pozostawić go zainstalowanego?">
    Użyj polecenia resetowania:

    ```bash
    openclaw reset
    ```

    Pełny reset nieinteraktywny:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie ponownie uruchom konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Otrzymuję błędy "context too large" - jak zresetować albo wykonać compact?'>
    Użyj jednej z tych opcji:

    - **Compact** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli to nadal się zdarza:

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby usuwać stare wyjścia narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij nową sesję poleceniem `/new` (osobna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego otrzymuję wiadomości Heartbeat co 30 minut?">
    Heartbeat działa domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostrój je lub wyłącz:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie pusty (tylko puste wiersze i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wywoływać odpowiedzi w grupie:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Jak uzyskać JID grupy WhatsApp?">
    Opcja 1 (najszybsza): śledź logi i wyślij wiadomość testową w grupie:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowano/dodano do allowlisty): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramka wzmianek jest włączona (domyślnie). Musisz wspomnieć bota przez @mention (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowliście.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM-ami?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to osobne sesje. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile obszarów roboczych i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (nawet setki) są w porządku, ale zwróć uwagę na:

    - **Wzrost zajętości dysku:** sesje + transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania, obszary robocze i routing kanałów dla każdego agenta.

    Wskazówki:

    - Utrzymuj jeden **aktywny** obszar roboczy na agenta (`agents.defaults.workspace`).
    - Usuwaj stare sesje (usuń JSONL lub wpisy magazynu), jeśli dysk się zapełnia.
    - Użyj `openclaw doctor`, aby wykryć zbędne obszary robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak należy to skonfigurować?">
    Tak. Użyj **routingu wieloagentowego**, aby uruchamiać wielu izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/rozmówcy. Slack jest obsługiwany jako kanał i można go powiązać z konkretnymi agentami.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza możliwości „zrobienia wszystkiego, co może człowiek” — mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanał(y) Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP lub węzeł, gdy jest potrzebna.

    Dokumentacja: [routing wieloagentowy](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [przeglądarka](/pl/tools/browser), [węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi dotyczące modeli — ustawień domyślnych, wyboru, aliasów, przełączania, przełączania awaryjnego i profili uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już działa” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?' >
    Ponieważ „running” to widok **nadzorcy** (launchd/systemd/schtasks). Sonda łączności to faktyczne połączenie CLI z WebSocket Gateway.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez sondę)
    - `Listening:` (co faktycznie nasłuchuje na porcie)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne wartości „Config (cli)” i „Config (service)”?' >
    Edytujesz jeden plik konfiguracji, podczas gdy usługa działa z innym (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Poprawka:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?' >
    OpenClaw wymusza blokadę runtime przez natychmiastowe powiązanie listenera WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli bind kończy się błędem `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Poprawka: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny adres URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami współdzielonego sekretu:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Uwagi:

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo gdy przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje „unauthorized” (albo ciągle łączy się ponownie). Co teraz?' >
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałej trwałości tokena w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą spróbować jednej ograniczonej ponownej próby z buforowanym tokenem urządzenia, gdy Gateway zwróci wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ta ponowna próba z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a potem token bootstrap.
    - Kontrole zakresu tokena bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatora bootstrap spełnia tylko żądania operatora; węzły lub inne role nieoperatorskie nadal potrzebują zakresów z własnym prefiksem roli.

    Poprawka:

    - Najszybciej: `openclaw dashboard` (drukuje + kopiuje adres URL pulpitu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli host jest bezgłowy).
    - Jeśli nie masz jeszcze tokena: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy adres local loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przychodzisz przez skonfigurowane proxy świadome tożsamości, a nie przez surowy adres URL Gateway. Proxy local loopback na tym samym hoście również wymagają `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej ponownej próbie, obróć/zatwierdź ponownie sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą obracać tylko swoje **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i skorzystaj z [rozwiązywania problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Bind `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma z czym się powiązać.

    Poprawka:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x) albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz powiązania tylko z tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może obsługiwać wiele kanałów komunikacji i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz nadmiarowości (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja dla instancji)
    - `OPENCLAW_STATE_DIR` (stan dla instancji)
    - `agents.defaults.workspace` (izolacja obszaru roboczego)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy uruchomieniach ręcznych).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiks do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [wiele Gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?' >
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwsza wiadomość będzie
    ramką `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Typowe przyczyny:

    - Otworzyłeś adres URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś niewłaściwego portu lub ścieżki.
    - Proxy albo tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie inne niż Gateway.

    Szybkie poprawki:

    1. Użyj adresu URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

    Jeśli używasz CLI albo TUI, adres URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [protokół Gateway](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stałą ścieżkę przez `logging.file`. Poziom logów plikowych jest kontrolowany przez `logging.level`. Szczegółowość konsoli jest kontrolowana przez `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/nadzorcy (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej w [rozwiązywaniu problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Użyj helperów gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows — jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji Windows**:

    **1) WSL2 (zalecane):** Gateway działa w Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie zrestartuj:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli nigdy nie instalowałeś usługi, uruchom ją na pierwszym planie:

    ```bash
    openclaw gateway run
    ```

    **2) Natywny Windows (niezalecane):** Gateway działa bezpośrednio w Windows.

    Otwórz PowerShell i uruchom:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz go ręcznie (bez usługi), użyj:

    ```powershell
    openclaw gateway run
    ```

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie przychodzą. Co sprawdzić?">
    Zacznij od szybkiego przeglądu stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Autoryzacja modelu nie została załadowana na **hoście Gateway** (sprawdź `models status`).
    - Parowanie kanału / lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli łączysz się zdalnie, potwierdź, że tunel/połączenie Tailscale działa i że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Rozłączono z Gateway: brak powodu" - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest sprawny? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli łączysz się zdalnie, czy tunel/łącze Tailscale działa?

    Następnie obserwuj logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/pl/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands kończy się niepowodzeniem. Co sprawdzić?">
    Zacznij od logów i statusu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele pozycji. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale część pozycji menu nadal trzeba usunąć. Zmniejsz liczbę poleceń pluginów/skillów/niestandardowych albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli działasz na VPS lub za proxy, potwierdź, że wychodzące HTTPS jest dozwolone i DNS działa dla `api.telegram.org`.

    Jeśli Gateway działa zdalnie, upewnij się, że przeglądasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnych danych wyjściowych. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale czatu,
    upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowano usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linuksie).
    Użyj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz go na pierwszym planie, zatrzymaj go za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart a openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowano usługę, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie więcej szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem autoryzacji kanałów, routingu modeli i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Mój skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź także:

    - Kanał docelowy obsługuje multimedia wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane do maks. 2048px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do obszaru roboczego, katalogu tymczasowego/magazynu mediów oraz plików zweryfikowanych przez piaskownicę.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać pliki lokalne hosta, które agent już może odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Pliki tekstowe i pliki wyglądające jak sekrety nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy bezpiecznie jest wystawić OpenClaw na przychodzące wiadomości prywatne?">
    Traktuj przychodzące wiadomości prywatne jako niezaufane dane wejściowe. Ustawienia domyślne mają ograniczać ryzyko:

    - Domyślnym zachowaniem w kanałach obsługujących wiadomości prywatne jest **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące prośby są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie wiadomości prywatnych wymaga jawnego włączenia (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady wiadomości prywatnych.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, nie tylko tego, kto może wysłać botowi wiadomość prywatną.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model można nakłonić do
    eksfiltracji kontekstu lub wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg szkód przez:

    - używanie agenta „czytelnika” tylko do odczytu lub bez narzędzi do streszczania niezaufanej treści
    - wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu również jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granic treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - używanie piaskownicy i ścisłych list dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub lub numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota za pomocą oddzielnych kont i numerów telefonów
    ogranicza zasięg szkód, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    poświadczeń lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerz
    go później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi wiadomościami osobistymi. Najbezpieczniejszy wzorzec to:

    - Trzymaj wiadomości prywatne w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **oddzielnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować szkic, a potem **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i trzymaj je odizolowane. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent obsługuje tylko czat, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie przez instrukcje, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas czytania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w piaskownicy. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca wysyła wiadomość do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące prośby:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłać wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna polityka wiadomości prywatnych WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące prośby:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne wiadomości prywatne były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzymuje”

<AccordionGroup>
  <Accordion title="Jak powstrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączono
    **verbose**, **trace** lub **reasoning**.

    Napraw to w czacie, w którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo komunikatów, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **dziedzicz**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować działające zadanie?">
    Wyślij dowolne z tych poleceń **jako osobną wiadomość** (bez ukośnika):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    To są wyzwalacze przerwania (nie polecenia ukośnikowe).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Przegląd poleceń ukośnikowych: zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **osobna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa też w treści wiadomości dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wysyłanie wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle do Discord, chyba że jawnie na to zezwolisz.

    Włącz wysyłanie wiadomości między dostawcami dla agenta:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Po edycji konfiguracji zrestartuj gateway.

  </Accordion>

  <Accordion title='Dlaczego wygląda, jakby bot „ignorował” szybko wysyłane wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości wchodzą w interakcję z uruchomionym przebiegiem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - umieść wszystkie oczekujące wskazówki w kolejce do następnej granicy modelu w bieżącym przebiegu
    - `queue` - starsze sterowanie po jednej wiadomości naraz
    - `followup` - uruchamiaj wiadomości pojedynczo
    - `collect` - grupuj wiadomości i odpowiedz raz
    - `steer-backlog` - steruj teraz, potem przetwórz zaległości
    - `interrupt` - przerwij bieżący przebieg i zacznij od nowa

    Trybem domyślnym jest `steer`. Dla trybów kontynuacji możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw dane uwierzytelniające i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć danych uwierzytelniających Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHubie](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — triage zaczynający się od objawów
