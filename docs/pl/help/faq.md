---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub wsparcia w czasie działania
    - Klasyfikowanie problemów zgłoszonych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące instalacji, konfiguracji i użytkowania OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-05-12T00:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostykę działania znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting). Pełną dokumentację konfiguracji znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś jest zepsute

1. **Szybki status (pierwszy test)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, osiągalność gateway/usługi, agenci/sesje, konfiguracja dostawców + problemy wykonawcze (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko wykonawcze nadzorcy względem osiągalności RPC, docelowy URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia sondę kondycji działającego gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Śledź najnowszy log**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj awaryjnie:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację/stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Prosi działający gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja pierwszego uruchomienia

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacja, wdrożenie, ścieżki uwierzytelniania, subskrypcje, początkowe błędy —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w używanych już przez Ciebie powierzchniach komunikacji (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone pluginy kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + aktywny Canvas. **Gateway** to zawsze działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchamiać
    zdolnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, ze
    stanowymi sesjami, pamięcią i narzędziami - bez oddawania kontroli nad przepływami pracy hostowanej
    usłudze SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i utrzymuj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus mobilny głos i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      i przełączaniem awaryjnym per agent.
    - **Opcja tylko lokalnie:** uruchamiaj lokalne modele, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** osobni agenci dla kanału, konta lub zadania, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i łatwe dostosowywanie:** przeglądaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prosta strona statyczna).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmail i zautomatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na etapy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i interesujących Cię wiadomości.
    - **Research i redagowanie:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** zachęty i checklisty sterowane przez cron lub heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań w sieci.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w generowaniu leadów, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i redagowania**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać potencjalnych klientów oraz pisać wersje robocze outreachu lub tekstów reklamowych.

    Przy **outreachu lub kampaniach reklamowych** zachowaj człowieka w procesie. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować wersję roboczą, a następnie ją zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu aplikacji webowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    potrzebujesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Zawsze działający Gateway** (uruchamiaj na VPS, korzystaj z dowolnego miejsca)
    - **Node** do lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania repozytorium w stanie dirty?">
    Używaj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z dołączonymi Skills bez dotykania git. Jeśli skill musi być zainstalowany globalnie, ale widoczny tylko dla części agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repozytorium i trafiać jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślna kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli skill powinien być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` per zadanie.
    - **Subagenci**: kieruj zadania do osobnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „utworzył subagenta do tego zadania”, albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt jest ważny, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem w Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby wiadomości uzupełniające w tym wątku pozostawały w powiązanej sesji.

    Podstawowy przepływ:

    - Utwórz za pomocą `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"` dla trwałych odpowiedzi uzupełniających).
    - Albo ręcznie powiąż za pomocą `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne odłączanie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy utworzeniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw na `false`, aby wyłączyć tworzenie sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja o ukończeniu trafiła w złe miejsce albo nigdy się nie opublikowała. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę żądającego:

    - Dostarczanie subagenta w trybie ukończenia preferuje każdy powiązany wątek lub trasę konwersacji, gdy taka istnieje.
    - Jeśli źródło ukończenia niesie tylko kanał, OpenClaw awaryjnie używa zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik zamiast natychmiastowej publikacji na czacie trafia awaryjnie do kolejki dostarczania sesji.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić awaryjny powrót do kolejki albo końcowe niepowodzenie dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply`, albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo pomija ogłoszenie zamiast publikować wcześniejszy, nieaktualny postęp.
    - Jeśli dziecko przekroczyło limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe dane wyjściowe narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
    - Zweryfikuj ustawienia strefy czasowej zadania (`--tz` względem strefy czasowej hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja](/pl/automation).

  </Accordion>

  <Accordion title="Cron został uruchomiony, ale nic nie wysłano do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie jest oczekiwane rezerwowe wysłanie przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczenie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale dane uwierzytelniające to zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner tłumi także kolejkowane dostarczenie rezerwowe.

    W przypadku izolowanych zadań cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` kontroluje tylko rezerwową ścieżkę runner
    dla tekstu końcowego, którego agent wcześniej nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron zmieniło modele albo ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączenia modelu na żywo, a nie zduplikowane harmonogramowanie.

    Izolowany cron może utrwalić przekazanie modelu w czasie działania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowe nadpisanie profilu uwierzytelniania, cron
    utrwala je także przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu z haka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` dla zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji cron.
    - Następnie zwykły wybór modelu agenta/domyślnego.

    Pętla ponowień jest ograniczona. Po początkowej próbie plus 2 ponowieniach przełączenia
    cron przerywa zamiast zapętlać się w nieskończoność.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs Skills UI z macOS nie jest dostępny w systemie Linux.
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
    w aktywnym obszarze roboczym. Zainstaluj oddzielne CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. W przypadku instalacji współdzielonych między agentami umieść skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** dla zadań zaplanowanych lub cyklicznych (utrwalane między restartami).
    - **Heartbeat** dla okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są bramkowane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompt systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz bramkowanie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z Linuxa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikację na pasku menu) i ustaw **Polecenia uruchamiania Node** na „Zawsze pytaj” albo „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - pośrednicz pliki binarne macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla pliku binarnego (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane skill (w obszarze roboczym albo `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Uruchom nową sesję, aby odświeżyć snapshot Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy skill / plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywną integrację, otwórz zgłoszenie funkcji albo zbuduj skill
    kierowany do tych API.

    Instalowanie Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalacje natywne trafiają do katalogu `skills/` w aktywnym obszarze roboczym. W przypadku Skills współdzielonych między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko część agentów ma widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) oraz [ClawHub](/pl/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego, zalogowanego Chrome z OpenClaw?">
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

    Ta ścieżka może używać lokalnej przeglądarki hosta albo podłączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na `ref`, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). W przypadku konfiguracji specyficznej dla Dockera (pełny Gateway w Dockerze albo obrazy sandboxa) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby cache przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować DM jako prywatne, a grupy jako publiczne/sandboxowane z jednym agentem?">
    Tak - jeśli Twój ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie sandboxa, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz, które narzędzia są dostępne w sesjach sandboxowanych, przez `tools.sandbox.tools`.

    Instrukcja konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowe odniesienie konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne i per-agentowe podpięcia są scalane; per-agentowe podpięcia są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że podpięcia omijają ściany systemu plików sandboxa.

    OpenClaw waliduje źródła podpięć zarówno względem znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego symlinkiem nadal są bezpiecznie blokowane nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox vs polityka narzędzi vs podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby znaleźć przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia także **cichy flush pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi, aby przechowywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Limitem jest Twoja
    pamięć masowa, nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą być kompaktowane lub przycinane. Dlatego
    istnieje wyszukiwanie w pamięci - przywraca do kontekstu tylko istotne części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy wyszukiwanie pamięci semantycznej wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth lub
    logowanie w CLI Codex)** nie pomaga przy wyszukiwaniu pamięci semantycznej. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozpoznać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli rozpozna klucz OpenAI, w przeciwnym razie Gemini, jeśli rozpozna klucz Gemini,
    następnie Voyage, a potem Mistral. Jeśli żaden zdalny klucz nie jest dostępny, wyszukiwanie
    pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną
    ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local**
    - szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co im wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, konfiguracja i przestrzeń robocza znajdują się na hoście Gateway
      (`~/.openclaw` + katalog Twojej przestrzeni roboczej).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz ślad danych:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanałów
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` usunięte)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twoja **przestrzeń robocza** (AGENTS.md, pliki pamięci, Skills itd.) jest oddzielna i konfigurowana przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **przestrzeni roboczej agenta**, a nie w `~/.openclaw`.

    - **Przestrzeń robocza (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Główny plik `memory.md` pisany małymi literami jest tylko starszym wejściem naprawczym; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy istnieją oba pliki.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślna przestrzeń robocza to `~/.openclaw/workspace`, konfigurowalna przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, sprawdź, czy Gateway używa tej samej
    przestrzeni roboczej przy każdym starcie (i pamiętaj: tryb zdalny używa przestrzeni roboczej **hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał to w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Przestrzeń robocza agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swoją **przestrzeń roboczą agenta** w **prywatnym** repozytorium git i twórz jej kopię zapasową w
    prywatnym miejscu (na przykład GitHub private). Obejmuje to pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (danych uwierzytelniających, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, wykonaj osobne kopie zapasowe przestrzeni roboczej i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza przestrzenią roboczą?">
    Tak. Przestrzeń robocza jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozpoznawane w przestrzeni roboczej, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandboxa per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    przestrzeń roboczą oddzielnie, chyba że celowo chcesz, aby agent pracował wewnątrz niej.

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
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, istotny dla Ciebie magazyn sesji znajduje się na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używa względnie bezpiecznych wartości domyślnych (w tym domyślnej przestrzeni roboczej `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (lub "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Powiązania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie współdzielonym sekretem: token lub hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym zwrotnym proxy świadomym tożsamości

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

    - `gateway.remote.token` / `.password` **nie** włączają same z siebie lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozpoznawanie kończy się bezpieczną odmową (bez maskowania przez zdalne rozwiązanie awaryjne).
    - Konfiguracje Control UI z uwierzytelnianiem współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania współdzielonych sekretów w adresach URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` zwrotne proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` i wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie gateway przechodzi w tryb tokenu i generuje token tylko na czas tego uruchomienia, więc **lokalni klienci WS muszą się uwierzytelnić**. Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub `OPENCLAW_GATEWAY_PASSWORD`, gdy klienci potrzebują stabilnego sekretu między restartami. Blokuje to innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (lub, dla zwrotnych proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może w dowolnym momencie wygenerować dla Ciebie token: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, a przy krytycznych wykonuje restart
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

    - `off`: ukrywa tekst sloganu, ale zachowuje wiersz tytułu/wersji banera.
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
    - SearXNG nie wymaga klucza i może być self-hosted; skonfiguruj `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl`.

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
    Konfiguracja zapasowa pobierania stron przez Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` lub `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego zapasowego dostawcę pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (lub ze środowiska usługi).

    Dokumentacja: [Narzędzia internetowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego problemu?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    pozostałe zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji wykonywane przez OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem.
    - Nieprawidłowe lub destrukcyjne zapisy wykonywane przez OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje uruchamianie lub przeładowanie na gorąco, Gateway zamyka się bezpiecznie albo pomija przeładowanie; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą konfigurację, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` lub `config reload skipped (invalid config)`.
    - Sprawdź najnowszy `openclaw.json.clobbered.*` lub `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` oraz `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` lub `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo ponownie uruchom `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację lub dowolną kopię zapasową.
    - Lokalny agent programistyczny często potrafi odtworzyć działającą konfigurację z logów lub historii.

    Jak tego unikać:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zachowaj wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla właściciela z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurator](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **węzły** i **agenci**:

    - **Gateway (centralny):** obsługuje kanały (Signal/WhatsApp), routing i sesje.
    - **Węzły (urządzenia):** komputery Mac/iOS/Android łączą się jako peryferia i udostępniają narzędzia lokalne (`system.run`, `canvas`, `camera`).
    - **Agenci (workerzy):** osobne mózgi/przestrzenie robocze dla specjalnych ról (np. „Operacje Hetzner”, „Dane osobiste”).
    - **Subagenci:** uruchamiaj pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
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

    Wartość domyślna to `false` (z widocznym interfejsem). Tryb headless częściej wywołuje kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, ochrona antybotowa).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (lub dowolną przeglądarkę opartą na Chromium) i zrestartuj Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne Gateway i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu dostawcy; otrzymują tylko wywołania RPC węzłów.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście działającym stale (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnet lub tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Zdalnie przez SSH** (lub bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie węzła macOS pozwala używać `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan Gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że twoje listy dozwolonych (DM lub grupa) obejmują twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem pozwól Botowi B odpowiedzieć jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, w którym nasłuchuje drugi bot.
    Jeśli jeden bot działa na zdalnym VPS, skieruj CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może połączyć się z docelowym Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych
    kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS-a na agenta.

    Używaj oddzielnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub subagentów.

  </Accordion>

  <Accordion title="Czy jest korzyść z używania węzła na moim osobistym laptopie zamiast SSH z VPS?">
    Tak - węzły są pierwszorzędnym sposobem dostępu do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS lub maszyna klasy Raspberry Pi wystarczy; 4 GB RAM to dużo), więc typowa
    konfiguracja to host działający stale plus laptop jako węzeł.

    - **Brak wymaganego przychodzącego SSH.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrolki wykonywania.** `system.run` jest ograniczane listami dozwolonych/zatwierdzeniami węzła na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host węzła na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale węzły są prostsze dla stałych przepływów pracy agenta i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na host, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Węzły to peryferia, które łączą się
    z gateway (węzły iOS/Android albo „tryb węzła” macOS w aplikacji z paska menu). Dla bezgłowych hostów węzłów
    i sterowania CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany dla zmian w `gateway`, `discovery` oraz hostowanej powierzchni Plugin.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdza jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobiera bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana przy większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: waliduje + zastępuje pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie środowiska uruchomieniowego `gateway`, dostępne tylko dla właściciela, nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek wykonywania

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia obszar roboczy i ogranicza, kto może uruchamiać bota.

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

    Jeśli chcesz używać UI sterowania bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    To utrzymuje gateway powiązany z loopbackiem i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć węzeł Mac ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **UI sterowania Gateway + WS**. Węzły łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tym samym tailnecie**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnetu).
       Aplikacja utworzy tunel do portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Wykrywanie](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy po prostu dodać węzeł?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **węzeł**. Dzięki temu zachowujesz jeden Gateway i unikasz zduplikowanej konfiguracji. Lokalne narzędzia węzła są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** lub dwóch w pełni oddzielnych botów.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoki, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny awaryjny `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też zdefiniować wbudowane zmienne środowiskowe w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Zobacz [/environment](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa i źródła.

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwa typowe rozwiązania:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
    2. Włącz import z powłoki (opcjonalne udogodnienie):

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
    `openclaw models status` informuje, czy włączony jest **import środowiska powłoki**. "Shell env: off"
    **nie** oznacza, że brakuje Twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy Twojego środowiska
    powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko wtedy, gdy go brakuje).

    Następnie zrestartuj gateway i sprawdź ponownie:

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
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (wartość domyślna **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie po bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    To nie usuwa transkryptów - po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy da się stworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wielu agentów** i **podagentów**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów wykonawczych z własnymi obszarami roboczymi i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej efektywne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    zakładamy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać podagentów.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został ucięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Przechowuj ważny kontekst w obszarze roboczym i poproś bota, aby go odczytał.
    - Używaj podagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zachować instalację?">
    Użyj polecenia resetowania:

    ```bash
    openclaw reset
    ```

    Pełny reset bez interakcji:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie ponownie uruchom konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko deweloperski; czyści konfigurację deweloperską + dane uwierzytelniające + sesje + obszar roboczy).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" - jak zresetować albo skompaktować?'>
    Użyj jednej z tych opcji:

    - **Kompaktuj** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Zresetuj** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli nadal się to dzieje:

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby skracać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości heartbeat co 30 minut?">
    Heartbeaty domyślnie działają co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je albo wyłącz:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (tylko puste wiersze i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija przebieg heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wyzwalać odpowiedzi w grupie:

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

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramka wzmianki jest włączona (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowlist.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są oddzielnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile przestrzeni roboczych i agentów mogę utworzyć?">
    Brak twardych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Wzrost użycia dysku:** sesje + transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania, przestrzenie robocze i routing kanałów dla każdego agenta.

    Wskazówki:

    - Zachowaj jedną **aktywną** przestrzeń roboczą na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL lub wpisy magazynu), jeśli dysk rośnie.
    - Użyj `openclaw doctor`, aby znaleźć zbłąkane przestrzenie robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak mam to skonfigurować?">
    Tak. Użyj **routingu wielu agentów**, aby uruchamiać wielu izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/rozmówcy. Slack jest obsługiwany jako kanał i może być powiązany z konkretnymi agentami.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „zrób wszystko, co może zrobić człowiek” - mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo użyj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP lub węzeł, gdy jest potrzebna.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, failover i profile uwierzytelniania

Pytania i odpowiedzi o modelach — domyślne ustawienia, wybór, aliasy, przełączanie, failover, profile uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już uruchomiony” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Kolejność pierwszeństwa:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status mówi "Runtime: running", ale "Connectivity probe: failed"?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z WebSocket Gateway.

    Użyj `openclaw gateway status` i ufaj tym wierszom:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co faktycznie nasłuchuje na porcie)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne "Config (cli)" i "Config (service)"?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa używa innego (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Poprawka:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza "another gateway instance is already listening"?'>
    OpenClaw wymusza blokadę runtime, natychmiast wiążąc listener WebSocket podczas startu (domyślnie `ws://127.0.0.1:18789`). Jeśli wiązanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Poprawka: zatrzymaj drugą instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami opartymi na wspólnym sekrecie:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo gdy podasz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI mówi "unauthorized" (albo ciągle łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL Gateway, więc odświeżenia tej samej karty nadal działają bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z buforowanym tokenem urządzenia, gdy Gateway zwróci wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem używa teraz buforowanych zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć buforowane zakresy.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia jest następujące: najpierw jawny wspólny token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a potem token bootstrap.
    - Sprawdzanie zakresów tokenu bootstrap używa prefiksów ról. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; węzły lub inne role niebędące operatorami nadal potrzebują zakresów pod własnym prefiksem roli.

    Poprawka:

    - Najszybciej: `openclaw dashboard` (wypisuje + kopiuje URL panelu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bez ekranu).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb wspólnego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowane proxy świadome tożsamości, a nie przez surowy URL Gateway. Proxy loopback na tym samym hoście także potrzebują `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednym ponowieniu, obróć/zatwierdź ponownie sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą rotować tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i skorzystaj z [rozwiązywania problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może wykonać bind i nic nie nasłuchuje">
    Bind `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma do czego wykonać bind.

    Poprawka:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz bind tylko dla tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów wiadomości i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja dla każdej instancji)
    - `OPENCLAW_STATE_DIR` (stan dla każdej instancji)
    - `agents.defaults.workspace` (izolacja przestrzeni roboczej)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy ręcznych uruchomieniach).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele Gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza "invalid handshake" / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwszą wiadomością
    będzie ramka `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzyłeś URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś złego portu lub ścieżki.
    - Proxy lub tunel usunął nagłówki uwierzytelniania albo wysłał żądanie niebędące żądaniem Gateway.

    Szybkie poprawki:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, uwzględnij token/hasło w ramce `connect`.

    Jeśli używasz CLI lub TUI, URL powinien wyglądać tak:

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

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logowania pliku jest kontrolowany przez `logging.level`. Szczegółowość konsoli jest kontrolowana przez `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy Gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji: [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Użyj helperów Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz Gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows - jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie zrestartuj:

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

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie docierają. Co sprawdzić?">
    Zacznij od szybkiego przeglądu kondycji:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Częste przyczyny:

    - Uwierzytelnianie modeli nie jest załadowane na **hoście Gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli jesteś zdalnie, potwierdź, że tunel/połączenie Tailscale działa oraz że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Odłączono od gateway: brak powodu" - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest w dobrym stanie? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli pracujesz zdalnie, czy tunel/łącze Tailscale działa?

    Następnie śledź logi:

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

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma za dużo pozycji. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre pozycje menu nadal trzeba usunąć. Zmniejsz liczbę poleceń pluginów/umiejętności/niestandardowych albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli używasz VPS albo jesteś za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że przeglądasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje wyjścia. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale czatu,
    upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia ukośnikiem](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowano usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linuxie).
    Użyj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart kontra openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowano usługę, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanałów, routingu modeli i błędów RPC.
  </Accordion>
</AccordionGroup>

## Media i załączniki

<AccordionGroup>
  <Accordion title="Moja umiejętność wygenerowała obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są skalowane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do obszaru roboczego, tymczasowego magazynu multimediów oraz plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla mediów i bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Pliki zwykłego tekstu i pliki przypominające sekrety nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące wiadomości DM jest bezpieczne?">
    Traktuj przychodzące wiadomości DM jako niezaufane dane wejściowe. Ustawienia domyślne są zaprojektowane tak, aby ograniczać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnej zgody (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne polityki DM.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanych treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent czyta zewnętrzne treści (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumentację, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model może zostać nakłoniony do
    eksfiltracji kontekstu albo wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg skutków przez:

    - używanie agenta „reader” tylko do odczytu lub bez narzędzi do streszczania niezaufanych treści
    - wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu także jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granic treści zewnętrznych zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota za pomocą osobnych kont i numerów telefonów
    ogranicza zasięg skutków, jeśli coś pójdzie nie tak. Ułatwia też rotację
    poświadczeń albo odebranie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij skromnie. Przyznaj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerzaj
    go później, jeśli będzie to konieczne.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi wiadomościami prywatnymi. Najbezpieczniejszy wzorzec to:

    - Trzymaj DM w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować wersję roboczą, a następnie **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent służy tylko do czatu, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas czytania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w sandboxie. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisał do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna polityka DM WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które wywołasz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzyma”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych w czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączono
    **verbose**, **trace** lub **reasoning**.

    Napraw w czacie, w którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest za dużo komunikatów, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **dziedzicz**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Thinking i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
    Wyślij dowolne z poniższych **jako samodzielną wiadomość** (bez ukośnika):

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

    To są wyzwalacze przerwania (nie polecenia ukośnikiem).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń ukośnikiem: zobacz [Polecenia ukośnikiem](/pl/tools/slash-commands).

    Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa też w treści wiadomości dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle do Discord, chyba że jawnie na to pozwolisz.

    Włącz wiadomości między dostawcami dla agenta:

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
    Tryb kolejki kontroluje, jak nowe wiadomości oddziałują z uruchomionym przebiegiem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - kolejkowanie wszystkich oczekujących wskazówek do następnej granicy modelu w bieżącym przebiegu
    - `queue` - starsze sterowanie po jednym elemencie naraz
    - `followup` - uruchamianie wiadomości po jednej naraz
    - `collect` - grupowanie wiadomości i jedna odpowiedź
    - `steer-backlog` - steruj teraz, potem przetwórz zaległości
    - `interrupt` - przerwij bieżący przebieg i zacznij od nowa

    Tryb domyślny to `steer`. Dla trybów kontynuacji możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw dane uwierzytelniające i wybór modelu są odrębne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć danych uwierzytelniających Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — diagnozowanie zaczynające się od objawów
