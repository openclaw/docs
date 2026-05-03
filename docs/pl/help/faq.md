---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub pomocy w czasie działania
    - Wstępna klasyfikacja problemów zgłoszonych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące instalacji, konfiguracji i użytkowania OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-05-03T21:33:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostyka środowiska uruchomieniowego: zobacz [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełna dokumentacja konfiguracji: zobacz [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwszy test)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: OS + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe nadzorcy względem dostępności RPC, docelowy URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia sondę kondycji Gateway na żywo, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Śledź najnowszy log**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj awaryjnie:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielne od logów usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom diagnostę (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację/stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Pyta działający Gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja pierwszego uruchomienia

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacja, wdrożenie, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w używanych już przez Ciebie kanałach wiadomości (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączonych Plugin kanałów, takich jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + aktywny Canvas. **Gateway** to zawsze włączona płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchamiać
    sprawnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    sesjami stanowymi, pamięcią i narzędziami — bez oddawania kontroli nad przepływami pracy hostowanemu
    SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i przechowuj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i przełączaniem awaryjnym.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** oddzielni agenci dla kanału, konta lub zadania, każdy z własnym
      obszarem roboczym i wartościami domyślnymi.
    - **Open source i łatwe dostosowywanie:** analizuj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem — co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (porządki, nazewnictwo, tagowanie).
    - Podłącz Gmail i automatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i ważnych dla Ciebie wiadomości.
    - **Badania i szkice:** szybkie badania, podsumowania oraz pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i listy kontrolne sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w pozyskiwaniu leadów, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **badań, kwalifikacji i szkicowania**. Może skanować strony, budować krótkie listy,
    podsumowywać potencjalnych klientów i pisać szkice outreachu lub tekstów reklamowych.

    W przypadku **outreachu lub kampanii reklamowych** utrzymuj udział człowieka w procesie. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować szkic, a następnie samodzielnie go zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety w porównaniu z Claude Code przy tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex, aby uzyskać najszybszą bezpośrednią pętlę kodowania w repozytorium. Używaj OpenClaw, gdy
    potrzebujesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + obszar roboczy** między sesjami
    - **Dostęp na wielu platformach** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Zawsze włączony Gateway** (uruchamiany na VPS, dostęp z dowolnego miejsca)
    - **Węzły** do lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania brudnego repozytorium?">
    Użyj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają pierwszeństwo przed dołączonymi Skills bez dotykania git. Jeśli Skills mają być zainstalowane globalnie, ale widoczne tylko dla niektórych agentów, przechowuj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repozytorium i trafiać jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z własnego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli Skills powinny być widoczne tylko dla określonych agentów, połącz to z `agents.defaults.skills` albo `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` dla każdego zadania.
    - **Subagenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie zmienić model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak ją odciążyć?">
    Użyj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota: „spawn a sub-agent for this task” albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem na Discord?">
    Użyj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby wiadomości uzupełniające w tym wątku pozostały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych działań uzupełniających).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne usuwanie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne wartości domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw na `false`, aby wyłączyć uruchamianie sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja o ukończeniu trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę zgłaszającego:

    - Dostarczanie subagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, gdy istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw używa awaryjnie zapisanej trasy sesji zgłaszającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się powieść.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie powieść, a wynik trafi do kolejkowanego dostarczania sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić awaryjne przejście do kolejki albo końcową awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Jeśli dziecko przekroczyło limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa stale,
    zaplanowane zadania nie będą uruchamiane.

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

  <Accordion title="Cron został uruchomiony, ale nic nie wysłano do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie oczekuje się awaryjnej wysyłki przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia ją zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner pomija też kolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` steruje tylko ścieżką awaryjną runnera
    dla końcowego tekstu, którego agent jeszcze nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron przełączyło modele albo ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie podwójne planowanie.

    Izolowany Cron może utrwalić przekazanie modelu w czasie działania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowna próba zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowieniem próby.

    Powiązane reguły wyboru:

    - Nadpisanie modelu hooka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` dla zadania.
    - Następnie każde zapisane nadpisanie modelu sesji Cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponawiania jest ograniczona. Po początkowej próbie plus 2 ponowieniach przełączenia
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

    Natywne `openclaw skills install` zapisuje w katalogu `skills/`
    aktywnego obszaru roboczego. Instaluj osobny CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. W przypadku współdzielonych instalacji między agentami umieść skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zadań zaplanowanych lub cyklicznych (utrzymują się po restartach).
    - **Heartbeat** do okresowych kontroli „głównej sesji”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają wiadomości do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills dostępne tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w promptcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja paska menu) i ustaw **Polecenia uruchamiania Node** na „Zawsze pytaj” lub „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills za pomocą narzędzia `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w promptcie dodaje to polecenie do listy dozwolonych.

    **Opcja C - proxy plików binarnych macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla pliku binarnego (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane skill (obszar roboczy lub `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Uruchom nową sesję, aby migawka Skills została odświeżona.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Dziś nie jest wbudowana.

    Opcje:

    - **Niestandardowy skill / plugin:** najlepsze rozwiązanie do niezawodnego dostępu API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywną integrację, otwórz prośbę o funkcję albo zbuduj skill
    ukierunkowany na te API.

    Instalowanie Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak użyć mojego istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który dołącza przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz niestandardową nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom hosta węzła na maszynie z przeglądarką albo użyj zamiast tego zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na ref, a nie na selektorach CSS
    - przesyłanie wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Konfigurację specyficzną dla Dockera (pełny Gateway w Dockerze albo obrazy sandboxa) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz jest zaprojektowany z myślą o bezpieczeństwie i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączony CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatność DM, ale ustawić grupy jako publiczne/sandboxowane jednym agentem?">
    Tak - jeśli Twój ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie sandboxa, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Bindy globalne i dla agenta są łączone; bindy dla agenta są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że bindy omijają granice systemu plików sandboxa.

    OpenClaw weryfikuje źródła bindów względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica-symlink nadal są domyślnie blokowane nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox vs polityka narzędzi vs podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia też **ciche opróżnienie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe powinny trafić do `MEMORY.md`,
    a kontekst krótkoterminowy do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi o przechowywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i utrzymują się, dopóki ich nie usuniesz. Limitem jest Twoja
    pamięć masowa, nie model. **Kontekst sesji** nadal jest ograniczony oknem kontekstu modelu,
    więc długie rozmowy mogą zostać skompaktowane albo obcięte. Dlatego istnieje
    wyszukiwanie w pamięci - przywraca do kontekstu tylko odpowiednie fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie w pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. Codex OAuth obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth lub
    logowanie Codex CLI)** nie pomaga w semantycznym wyszukiwaniu w pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw automatycznie wybiera dostawcę, gdy
    może odnaleźć klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli odnaleziono klucz OpenAI; w przeciwnym razie Gemini, jeśli
    odnaleziono klucz Gemini, potem Voyage, potem Mistral. Jeśli żaden zdalny klucz nie jest dostępny, wyszukiwanie w pamięci
    pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną ścieżkę modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local**
    - szczegóły konfiguracji znajdziesz w sekcji [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie elementy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co do nich wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres danych:** używanie modeli lokalnych utrzymuje prompty na Twoim komputerze, ale ruch kanału
      nadal przechodzi przez serwery tego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                         | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` usunięte)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia konwersacji i stan (per agent)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (AGENTS.md, pliki pamięci, Skills itd.) jest osobny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Małymi literami w katalogu głównym `memory.md` to tylko starsze wejście naprawcze; `openclaw doctor --fix`
      może scalić je z `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      i współdzielone skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa workspace **hosta Gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałe zachowanie lub preferencję, poproś bota, aby **zapisał to w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia tworzenia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i wykonuj jego kopie zapasowe w miejscu
    prywatnym (na przykład GitHub private). Obejmuje to pamięć oraz pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego przywrócenia, wykonaj kopię zapasową zarówno workspace, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza workspace?">
    Tak. Workspace jest **domyślnym cwd** i punktem odniesienia dla pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandbox per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, skieruj `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace osobno, chyba że celowo chcesz, aby agent pracował w jego wnętrzu.

    Przykład (repozytorium jako domyślny cwd):

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
    Stan sesji należy do **hosta Gateway**. Jeśli jesteś w trybie zdalnym, istotny dla Ciebie magazyn sesji znajduje się na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli pliku brakuje, używa w miarę bezpiecznych wartości domyślnych (w tym domyślnego workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (lub "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Powiązania inne niż loopback **wymagają poprawnej ścieżki uwierzytelniania Gateway**. W praktyce oznacza to:

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

    - `gateway.remote.token` / `.password` **nie** włączają samodzielnie lokalnego uwierzytelniania Gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - W przypadku uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania zdalnym fallbackiem).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania współdzielonych sekretów w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` odwrotne proxy samego hosta przez loopback wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie Gateway, w tym loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie Gateway przechodzi w tryb tokena i automatycznie go generuje, zapisując go w `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. Blokuje to innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (lub, dla odwrotnych proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwartego loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): stosuje bezpieczne zmiany na gorąco, restartuje przy krytycznych
    - `hot`, `restart`, `off` również są obsługiwane

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

    - `off`: ukrywa tekst sloganu, ale zostawia tytuł banera / linię wersji.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli w ogóle nie chcesz banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie stron)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza / jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    Konfiguracja wyszukiwania w sieci specyficzna dla dostawcy znajduje się teraz w `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` nadal są tymczasowo wczytywane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja awaryjnego pobierania z sieci Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego awaryjnego dostawcę pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia sieciowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego problemu?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje uruchamianie lub przeładowanie na gorąco, Gateway zamyka się bezpiecznie albo pomija przeładowanie; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą konfigurację, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` albo `config reload skipped (invalid config)`.
    - Sprawdź najnowszy `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` i `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i skonfiguruj kanały/modele od nowa.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent kodujący często może odtworzyć działającą konfigurację z logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego przeglądania.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz dostępnego tylko dla właściciela narzędzia `gateway` z uruchomienia agenta, nadal odrzuci ono zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek wykonywania).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurowanie](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze specjalizowanymi pracownikami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) oraz **węzły** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), trasowaniem i sesjami.
    - **Węzły (urządzenia):** komputery Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (pracownicy):** oddzielne mózgi/przestrzenie robocze dla specjalnych ról (np. „Operacje Hetzner”, „Dane osobiste”).
    - **Podagenci:** uruchamiają pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Węzły](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Trasowanie wieloagentowe](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [TUI](/pl/web/tui).

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

    Domyślna wartość to `false` (z interfejsem). Tryb headless częściej może wyzwalać kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (albo dowolną przeglądarkę opartą na Chromium) i uruchom ponownie Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne bramy i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, bramą i węzłami?">
    Wiadomości Telegram są obsługiwane przez **bramę**. Brama uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Węzły nie widzą ruchu przychodzącego od dostawców; otrzymują tylko wywołania RPC węzłów.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście działającym stale (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że WS Gateway jest osiągalny (wiązanie tailnet lub tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Remote over SSH** (lub bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Osobny most TCP nie jest wymagany; nodes łączą się przez WebSocket Gateway.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie macOS node pozwala na `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i zapoznaj się z sekcją [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione prawidłowo.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że listy dozwolonych (DM lub grupa) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale możesz połączyć je na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a następnie Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując do czatu, na którym drugi bot
    nasłuchuje. Jeśli jeden bot działa na zdalnym VPS, skieruj swoje CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchamiany z maszyny, która może dosięgnąć docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętliły się bez końca (tylko wzmianki, listy
    dozwolonych kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własnym obszarem roboczym, domyślnymi modelami
    i routingiem. To standardowa konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) lub bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub podagentów.

  </Accordion>

  <Accordion title="Czy jest korzyść z używania node na moim osobistym laptopie zamiast SSH z VPS?">
    Tak - nodes są podstawowym sposobem dostępu do laptopa ze zdalnego Gateway i
    dają więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS lub urządzenie klasy Raspberry Pi wystarczy; 4 GB RAM to dużo), więc typowa
    konfiguracja to stale działający host oraz laptop jako node.

    - **Nie wymaga przychodzącego SSH.** Nodes łączą się wychodząco z WebSocket Gateway i używają parowania urządzeń.
    - **Bezpieczniejsze kontrole wykonywania.** `system.run` jest ograniczane przez listy dozwolonych/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host node na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale nodes są prostsze dla ciągłych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na host, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gateways](/pl/gateway/multiple-gateways)). Nodes są urządzeniami peryferyjnymi, które łączą się
    z gateway (nodes iOS/Android albo „tryb node” macOS w aplikacji paska menu). Dla bezgłowych hostów node
    i sterowania CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdza jedno poddrzewo konfiguracji z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobiera bieżący snapshot + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: waliduje i zastępuje pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie runtime `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia przestrzeń roboczą i ogranicza, kto może uruchamiać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj i zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj i zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tej samej sieci tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta w tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz korzystać z Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje powiązany z loopbackiem i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć Node Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Node'y łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tej samej sieci tailnet**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta w tailnet).
       Aplikacja zestawi tunel do portu Gateway i połączy się jako Node.
    3. **Zatwierdź Node** w gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [protokół Gateway](/pl/gateway/protocol), [wykrywanie](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy instalować na drugim laptopie, czy po prostu dodać Node?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **Node**. Dzięki temu zachowujesz jeden Gateway i unikasz powielania konfiguracji. Lokalne narzędzia Node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Node'y](/pl/nodes), [CLI Node'ów](/pl/cli/nodes), [wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny awaryjny `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też zdefiniować zmienne środowiskowe inline w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełną kolejność pierwszeństwa i źródła opisuje [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były wykrywane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
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

    To uruchamia powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy ich nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` informuje, czy włączony jest **import środowiska powłoki**. "Shell env: off"
    **nie** oznacza, że brakuje Twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    Twojej powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko, jeśli go brakuje).

    Następnie uruchom ponownie gateway i sprawdź jeszcze raz:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (także `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/concepts/model-providers](/pl/concepts/model-providers) i [/environment](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć świeżą rozmowę?">
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transkryptów - po prostu zaczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy da się utworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **subagentów**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów roboczych z własnymi przestrzeniami roboczymi i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej efektywne niż użycie jednego bota z oddzielnymi sesjami. Typowy model, jaki
    sobie wyobrażamy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby tworzyć subagentów.

    Dokumentacja: [routing wieloagentowy](/pl/concepts/multi-agent), [subagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został ucięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi albo wiele
    plików mogą wywołać Compaction lub przycięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w przestrzeni roboczej i poproś bota, aby go ponownie odczytał.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zostawić go zainstalowanego?">
    Użyj polecenia resetowania:

    ```bash
    openclaw reset
    ```

    Pełny reset nieinteraktywny:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie uruchom konfigurację ponownie:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev, dane uwierzytelniające, sesje i przestrzeń roboczą).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" - jak zresetować albo skompaktować?'>
    Użyj jednej z tych opcji:

    - **Compaction** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby wskazać, jak ma wyglądać podsumowanie.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli problem się powtarza:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby usuwać stare wyjście narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [przycinanie sesji](/pl/concepts/session-pruning), [zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij świeżą sesję wiadomością `/new` (samodzielną wiadomością).

  </Accordion>

  <Accordion title="Dlaczego co 30 minut dostaję wiadomości heartbeat?">
    Heartbeat działa domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je lub wyłącz:

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
    typu `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw ją widzi.
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

    Opcja 2 (jeśli już skonfigurowano/dodano do allowlist): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [katalog](/pl/cli/directory), [logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramkowanie wzmianką jest włączone (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowlist.

    Zobacz [grupy](/pl/channels/groups) i [wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z wiadomościami prywatnymi?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są oddzielnymi sesjami. Zobacz [grupy](/pl/channels/groups) i [wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile przestrzeni roboczych i agentów mogę utworzyć?">
    Nie ma twardych limitów. Dziesiątki (nawet setki) są w porządku, ale uważaj na:

    - **Przyrost użycia dysku:** sesje i transkrypty znajdują się pod `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania per agent, przestrzenie robocze i routing kanałów.

    Wskazówki:

    - Utrzymuj jedną **aktywną** przestrzeń roboczą na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL albo wpisy w magazynie), jeśli rośnie użycie dysku.
    - Użyj `openclaw doctor`, aby wykryć porzucone przestrzenie robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **Multi-Agent Routing**, aby uruchamiać wielu izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peera. Slack jest obsługiwany jako kanał i może być przypisany do konkretnych agentów.

    Dostęp przez przeglądarkę jest wydajny, ale nie oznacza możliwości „zrobienia wszystkiego, co człowiek” - mechanizmy antybotowe, CAPTCHA i MFA nadal mogą
    blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo użyj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Stale działający host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP lub node, gdy jest potrzebna.

    Dokumentacja: [Multi-Agent Routing](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Node’y](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, failover i profile uwierzytelniania

Pytania i odpowiedzi o modelach — wartości domyślne, wybór, aliasy, przełączanie, failover, profile uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już działa” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności to faktyczne połączenie CLI z gateway WebSocket.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez sondę)
    - `Listening:` (co faktycznie jest powiązane z portem)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces żyje, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa uruchamia inny (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę czasu wykonywania, natychmiast wiążąc listener WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli wiązanie zakończy się błędem `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj drugą instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami opartymi na współdzielonym sekrecie:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo gdy przekażesz flagę nadpisującą).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje „unauthorized” (albo ciągle ponownie się łączy). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałej trwałości tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z buforowanym tokenem urządzenia, gdy Gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują swój żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, potem token bootstrap.
    - Kontrole zakresu tokenu bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; node lub inne role nieoperatorskie nadal potrzebują zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje i kopiuje URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli host jest headless).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw zestaw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że łączysz się przez skonfigurowane proxy świadome tożsamości, a nie przez surowy URL Gateway. Proxy local loopback na tym samym hoście również wymagają `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej próbie ponowienia, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że odmówiono dostępu, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą rotować tylko **własne** urządzenie, chyba że mają także `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywaniem problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Wiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma czego powiązać.

    Naprawa:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz wiązania tylko w tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateways na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów komunikacji i agentów. Używaj wielu Gateways tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz izolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalne `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy uruchomieniach ręcznych).
    - Zainstaluj usługę per profil: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiks do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gateways](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwsza wiadomość
    będzie ramką `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzyłeś URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś niewłaściwego portu lub ścieżki.
    - Proxy albo tunel usunęły nagłówki uwierzytelniania lub wysłały żądanie nieprzeznaczone dla Gateway.

    Szybkie naprawy:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, uwzględnij token/hasło w ramce `connect`.

    Jeśli używasz CLI albo TUI, URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Stabilną ścieżkę możesz ustawić przez `logging.file`. Poziom logowania do pliku kontroluje `logging.level`. Szczegółowość konsoli kontrolują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/ponownie uruchomić usługę Gateway?">
    Użyj pomocników gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows - jak ponownie uruchomić OpenClaw?">
    Istnieją **dwa tryby instalacji Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie uruchom ponownie:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli nigdy nie zainstalowałeś usługi, uruchom ją na pierwszym planie:

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

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie przychodzą. Co sprawdzić?">
    Zacznij od szybkiego sprawdzenia stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Częste przyczyny:

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli jesteś zdalnie, potwierdź, że tunel/połączenie Tailscale działa oraz że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='„Disconnected from gateway: no reason” - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli działa zdalnie, czy tunel/łącze Tailscale jest aktywne?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Panel](/pl/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands kończy się niepowodzeniem. Co sprawdzić?">
    Zacznij od logów i statusu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma za dużo wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale część wpisów menu nadal trzeba usunąć. Zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli korzystasz z VPS lub jesteś za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway działa zdalnie, upewnij się, że patrzysz na logi na hoście Gateway.

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

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia ukośnika](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowano usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd w macOS, systemd w Linux).
    Używaj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart a openclaw gateway">
    - `openclaw gateway restart`: ponownie uruchamia **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowano usługę, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Media i załączniki

<AccordionGroup>
  <Accordion title="Mój skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie z CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez allowlisty.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane do maks. 2048px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ze ścieżek lokalnych do workspace, temp/media-store i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko w przypadku mediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykłe pliki tekstowe i pliki przypominające sekrety nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące DM jest bezpieczne?">
    Traktuj przychodzące DM jako niezaufane dane wejściowe. Domyślne ustawienia zaprojektowano tak, aby zmniejszyć ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnego wyboru (`dmPolicy: "open"` i allowlista `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection jest problemem tylko w przypadku publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony w przeglądarce, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć kontrolę nad modelem. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model może zostać skłoniony do
    wyprowadzania kontekstu lub wywoływania narzędzi w Twoim imieniu. Zmniejsz zakres szkód przez:

    - używanie agenta „czytnika” w trybie tylko do odczytu lub bez narzędzi do streszczania niezaufanej treści
    - wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie odkodowanego tekstu pliku/dokumentu również jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe allowlisty narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub lub numer telefonu?">
    Tak, w większości konfiguracji. Odizolowanie bota za pomocą osobnych kont i numerów telefonów
    zmniejsza zakres szkód, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    danych uwierzytelniających lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerzaj
    później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi prywatnymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Trzymaj DM w **trybie parowania** lub na ścisłej allowliście.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować wersję roboczą, a następnie **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, zrób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent obsługuje tylko czat, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie przez instrukcje, więc unikaj ich w przypadku agentów z włączonymi narzędziami
    lub podczas czytania niezaufanej treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w sandboxie. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca wysyła wiadomość do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz uzyskać natychmiastowy dostęp, dodaj identyfikator nadawcy do allowlisty albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłać wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna zasada DM w WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzyma, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **allowlisty/właściciela**, aby Twoje własne DM były dozwolone. Nie służy do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzymuje”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączono
    **verbose**, **trace** lub **reasoning**.

    Napraw to w czacie, w którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo komunikatów, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
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

    To są wyzwalacze przerwania (nie polecenia ukośnika).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń ukośnika: zobacz [Polecenia ukośnika](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **osobna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa też w treści wiadomości dla nadawców z allowlisty.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wysyłanie wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle do Discord, chyba że jawnie na to zezwolisz.

    Włącz wysyłanie między dostawcami dla agenta:

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

    Uruchom ponownie gateway po edycji konfiguracji.

  </Accordion>

  <Accordion title='Dlaczego mam wrażenie, że bot „ignoruje” szybkie serie wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości oddziałują z trwającym uruchomieniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - ustaw w kolejce wszystkie oczekujące sterowania dla następnej granicy modelu w bieżącym uruchomieniu
    - `queue` - starsze sterowanie po jednym elemencie naraz
    - `followup` - uruchamiaj wiadomości po jednej naraz
    - `collect` - grupuj wiadomości i odpowiedz raz
    - `steer-backlog` - steruj teraz, potem przetwórz zaległości
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Domyślny tryb to `steer`. Możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize` dla trybów followup. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal utknąłeś? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — triage od objawów
