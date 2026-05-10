---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub wsparcia w czasie działania
    - Wstępna analiza problemów zgłoszonych przez użytkowników przed głębszym debugowaniem
summary: Najczęściej zadawane pytania dotyczące instalacji, konfiguracji i użytkowania OpenClaw
title: Często zadawane pytania
x-i18n:
    generated_at: "2026-05-10T19:40:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny dev, VPS, wiele agentów, OAuth/klucze API, awaryjne przełączanie modeli). Diagnostykę runtime znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełną referencję konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś jest zepsute

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: OS + aktualizacja, osiągalność Gateway/usługi, agenci/sesje, konfiguracja providera + problemy runtime (gdy Gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan daemona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje runtime supervisora względem osiągalności RPC, docelowy URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę kondycji Gateway, w tym sondy kanałów, gdy są obsługiwane
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

6. **Uruchom doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację/stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Pyta działający Gateway o pełny snapshot (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja pierwszego uruchomienia

Q&A pierwszego uruchomienia — instalacja, onboarding, trasy auth, subskrypcje, początkowe awarie —
znajduje się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w używanych już przez Ciebie powierzchniach komunikacyjnych (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone pluginy kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + aktywny Canvas. **Gateway** to zawsze działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    sprawnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, ze
    stanowymi sesjami, pamięcią i narzędziami - bez oddawania kontroli nad swoimi workflow hostowanemu
    SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i trzymaj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus mobilny głos i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i awaryjnym przełączaniem.
    - **Opcja wyłącznie lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli tego chcesz.
    - **Routing wielu agentów:** oddzielni agenci per kanał, konto lub zadanie, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i możliwość modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wiele agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmail i zautomatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na fazy i
    użyjesz podagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i ważnych dla Ciebie wiadomości.
    - **Research i pisanie:** szybki research, podsumowania oraz pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i checklisty sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc z lead gen, outreach, reklamami i blogami dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia wersji roboczych**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać prospektów oraz pisać wersje robocze outreachu lub copy reklamowego.

    W przypadku **outreachu lub kampanii reklamowych** zachowaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować wersję roboczą, a Tobie ją zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy web developmencie?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repo. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramowanie, hooki)
    - **Zawsze działający Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Nodes** dla lokalnej przeglądarki/ekranu/kamery/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez zostawiania repo w stanie dirty?">
    Używaj zarządzanych override'ów zamiast edytować kopię w repo. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane override'y nadal wygrywają z dołączonymi Skills bez dotykania git. Jeśli skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj wspólną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny mieszkać w repo i trafiać jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli skill ma być widoczny tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić override `model` per zadanie.
    - **Podagenci**: kieruj zadania do osobnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Użyj **podagentów** do długich lub równoległych zadań. Podagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota o „spawn a sub-agent for this task” albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i podagenci zużywają tokeny. Jeśli koszt jest problemem, ustaw
    tańszy model dla podagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje podagentów przypisane do wątku na Discord?">
    Użyj powiązań wątków. Możesz powiązać wątek Discord z podagentem lub celem sesji, aby wiadomości follow-up w tym wątku pozostały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom z `sessions_spawn`, używając `thread: true` (i opcjonalnie `mode: "session"` dla trwałego follow-upu).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczny unfocus.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne wartości domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override'y Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy spawn: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw na `false`, aby wyłączyć spawnowanie sesji przypisanych do wątku.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Referencja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Podagent zakończył pracę, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requester:

    - Dostarczanie podagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, gdy istnieje.
    - Jeśli origin ukończenia niesie tylko kanał, OpenClaw używa awaryjnie zapisanej trasy sesji requester (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik trafia awaryjnie do dostarczania w kolejce sesji zamiast natychmiastowej publikacji w czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić fallback do kolejki albo ostateczne niepowodzenie dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta child to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Jeśli child przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa ciągle,
    zaplanowane zadania nie zostaną uruchomione.

    Checklista:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpienia/restartów).
    - Zweryfikuj ustawienia strefy czasowej zadania (`--tz` względem strefy czasowej hosta).

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
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner pomija także kolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` steruje tylko ścieżką awaryjną runner
    dla końcowego tekstu, którego agent wcześniej nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron przełączyło modele albo ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie zduplikowane harmonogramowanie.

    Izolowany Cron może utrwalić przekazanie modelu w czasie wykonywania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowna próba zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowną próbą.

    Powiązane reguły wyboru:

    - Nadpisanie modelu przez hook Gmaila ma pierwszeństwo, gdy ma zastosowanie.
    - Następnie `model` dla danego zadania.
    - Następnie każde zapisane nadpisanie modelu sesji Cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponawiania prób jest ograniczona. Po początkowej próbie plus 2 ponownych próbach przełączenia
    Cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI Cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs użytkownika Skills dla macOS nie jest dostępny w systemie Linux.
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
    synchronizować własne Skills. W przypadku instalacji współdzielonych przez agentów umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zadań zaplanowanych lub cyklicznych (utrzymują się po restartach).
    - **Heartbeat** do okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są bramkowane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz bramkowanie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja na pasku menu) i ustaw **Polecenia uruchamiania Node** na „Zawsze pytaj” albo „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills za pomocą narzędzia `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - pośrednicz pliki binarne macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla pliku binarnego (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (obszar roboczy lub `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Uruchom nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na błędy.

    Jeśli chcesz utrzymywać kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobrał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz prośbę o funkcję albo zbuduj Skill
    ukierunkowany na te API.

    Instalowanie Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku Skills współdzielonych przez agentów umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć instalację współdzieloną, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który dołącza przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz użyć niestandardowej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo podłączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zamiast tego zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na referencjach, a nie na selektorach CSS
    - przesyłanie wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Konfigurację specyficzną dla Dockera (pełny Gateway w Dockerze albo obrazy sandboxa) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wypiecz zależności systemowe w obrazie za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalona.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne DM-y, ale uczynić grupy publicznymi/sandboxowanymi przy użyciu jednego agenta?">
    Tak - jeśli Twój ruch prywatny to **DM-y**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie sandboxa, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM-y + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa referencja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Bindowania globalne i dla poszczególnych agentów są scalane; bindowania dla poszczególnych agentów są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że bindowania omijają ściany systemu plików sandboxa.

    OpenClaw waliduje źródła bindowań względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez nadrzędne symlinki nadal kończą się odmową nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinków.

    Przykłady i uwagi dotyczące bezpieczeństwa znajdziesz w [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox kontra polityka narzędzi kontra podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia także **ciche opróżnianie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć wciąż zapomina rzeczy. Jak sprawić, żeby je zachowała?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi o zapisywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są ograniczenia?">
    Pliki pamięci znajdują się na dysku i utrzymują się, dopóki ich nie usuniesz. Ograniczeniem jest Twoja
    przestrzeń dyskowa, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać skompaktowane albo ucięte. Dlatego istnieje
    wyszukiwanie w pamięci - przywraca do kontekstu tylko odpowiednie części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie w pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth lub
    logowanie w Codex CLI)** nie pomaga w semantycznym wyszukiwaniu w pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozpoznać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli uda się rozpoznać klucz OpenAI, w przeciwnym razie Gemini, jeśli uda się
    rozpoznać klucz Gemini, potem Voyage, a następnie Mistral. Jeśli nie ma dostępnego klucza zdalnego, wyszukiwanie
    w pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną
    i obecną ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub lokalne** -
    szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co do nich wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres danych:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Cel                                                                |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Opcjonalny ładunek sekretów oparty na pliku dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Starszy plik kompatybilności (statyczne wpisy `api_key` wyczyszczone) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Historia i stan konwersacji (per agent)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadane sesji (per agent)                                         |

    Starsza ścieżka dla pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (AGENTS.md, pliki pamięci, Skills itd.) jest osobny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Małoliterowy główny plik `memory.md` jest tylko starszym wejściem naprawy; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi
      oraz współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa workspace **hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał je w
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i wykonuj kopie zapasowe w miejscu
    prywatnym (na przykład GitHub private). Obejmuje to pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego spod `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, wykonaj kopię zapasową zarówno workspace, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza workspace?">
    Tak. Workspace jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandboxa per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, skieruj `workspace` tego agenta
    do katalogu głównego repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace oddzielnie, chyba że celowo chcesz, aby agent pracował w jego wnętrzu.

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

  <Accordion title="Tryb zdalny: gdzie znajduje się magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, istotny magazyn sesji znajduje się na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
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
    Powiązania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie współdzielonym sekretem: token lub hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym reverse proxy świadomym tożsamości

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

    - `gateway.remote.token` / `.password` same z siebie **nie** włączają lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - W przypadku uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie da się go rozwiązać, rozwiązywanie kończy się zamknięciem (bez maskowania przez zdalny fallback).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania współdzielonych sekretów w adresach URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback na tym samym hoście wymaga jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej ścieżce domyślnej oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, start gateway rozwiązuje się do trybu tokena i generuje token tylko na czas działania dla tego uruchomienia, więc **lokalni klienci WS muszą się uwierzytelnić**. Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub `OPENCLAW_GATEWAY_PASSWORD`, gdy klienci potrzebują stabilnego sekretu między restartami. Blokuje to innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, w przypadku reverse proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie w konfiguracji `gateway.auth.mode: "none"`. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, a dla krytycznych wykonuje restart
    - `hot`, `restart`, `off` są również obsługiwane

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

    - `off`: ukrywa tekst sloganu, ale pozostawia tytuł banera i linię wersji.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie z sieci)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
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

    Konfiguracja wyszukiwania w sieci specyficzna dla dostawcy znajduje się teraz w `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` nadal są tymczasowo wczytywane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja awaryjnego pobierania stron Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` lub `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego awaryjnego dostawcę pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (lub ze środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego problemu?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Bieżący OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja zepsuje uruchamianie lub przeładowanie na gorąco, Gateway bezpiecznie odmawia działania albo pomija przeładowanie; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą konfigurację, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` lub `config reload skipped (invalid config)`.
    - Obejrzyj najnowszy `openclaw.json.clobbered.*` lub `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` oraz `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` lub `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i skonfiguruj ponownie kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację lub dowolną kopię zapasową.
    - Lokalny agent programistyczny często może odtworzyć działającą konfigurację na podstawie logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Użyj najpierw `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zachowaj wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla właściciela z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfiguracja interaktywna](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **węzły** i **agenci**:

    - **Gateway (centralny):** odpowiada za kanały (Signal/WhatsApp), trasowanie i sesje.
    - **Węzły (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workerzy):** oddzielne mózgi/przestrzenie robocze dla specjalnych ról (np. „Operacje Hetzner”, „Dane osobiste”).
    - **Podagenci:** uruchamiają pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agentów/sesje.

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

    Wartość domyślna to `false` (z widocznym oknem). Tryb headless częściej wyzwala kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa w większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, zabezpieczenia antybotowe).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (lub dowolną przeglądarkę opartą na Chromium) i zrestartuj Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gatewaye i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gatewayem i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu od dostawcy; otrzymują tylko wywołania RPC węzła.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (powiązanie tailnet lub tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Zdalnie przez SSH** (lub bezpośredni tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie węzła macOS pozwala na `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i trasowanie:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM lub grupa) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując do czatu, na którym drugi bot
    nasłuchuje. Jeśli jeden bot jest na zdalnym VPS, skieruj CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może dotrzeć do docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby oba boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych
    kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdego z własną przestrzenią roboczą, domyślnymi modelami
    i trasowaniem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj oddzielnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) lub bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub podagentów.

  </Accordion>

  <Accordion title="Czy używanie węzła na moim osobistym laptopie ma przewagę nad SSH z VPS?">
    Tak - węzły są podstawowym sposobem dotarcia do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS lub maszyna klasy Raspberry Pi wystarczy; 4 GB RAM to dużo), więc typowa
    konfiguracja to zawsze włączony host plus laptop jako węzeł.

    - **Nie jest wymagane przychodzące SSH.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze mechanizmy kontroli wykonywania.** `system.run` jest ograniczane listami dozwolonych/zatwierdzeniami węzła na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host węzła na laptopie albo podłącz lokalny Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale węzły są prostsze w stałych przepływach pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na host, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Węzły to urządzenia peryferyjne, które łączą się
    z gatewayem (węzły iOS/Android lub „tryb węzła” macOS w aplikacji z paska menu). Dla hostów węzłów headless
    i sterowania z CLI zobacz [CLI hosta węzła](/pl/cli/node).

    Pełny restart jest wymagany dla zmian powierzchni `gateway`, `discovery` i hostowanych Plugin.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżący zrzut + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: zweryfikuj + zastąp pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie uruchomieniowe `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia Twój obszar roboczy i ogranicza, kto może uruchamiać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z mojego Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tej samej sieci tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje przypisany do loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć Node Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Node łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tej samej sieci tailnet**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnet).
       Aplikacja utworzy tunel do portu Gateway i połączy się jako Node.
    3. **Zatwierdź Node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Wykrywanie](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy po prostu dodać Node?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **Node**. Pozwala to zachować pojedynczy Gateway i uniknąć zdublowanej konfiguracji. Lokalne narzędzia Node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Node](/pl/nodes), [CLI Node](/pl/cli/nodes), [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i wczytywanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw wczytuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (shell, launchd/systemd, CI itd.) i dodatkowo wczytuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy plik `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też definiować w konfiguracji wbudowane zmienne środowiskowe (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

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
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy środowiska Twojego shell.
    2. Włącz import z shell (opcjonalne ułatwienie):

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

    To uruchamia Twój shell logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje „Shell env: off”. Dlaczego?'>
    `openclaw models status` zgłasza, czy włączony jest **import środowiska shell**. „Shell env: off”
    **nie** oznacza, że brakuje Twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie będzie automatycznie wczytywać
    Twojego shell logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy Twojego środowiska
    shell. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z shell (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosuje się tylko wtedy, gdy go brakuje).

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
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transkryptów - po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy istnieje sposób na utworzenie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **subagentów**. Możesz utworzyć jednego agenta
    koordynującego i kilku agentów roboczych z własnymi obszarami roboczymi i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    przewidujemy, to jeden bot, z którym rozmawiasz, z różnymi sesjami do pracy równoległej. Ten
    bot może także uruchamiać subagentów, gdy jest to potrzebne.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików może wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami, a `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w obszarze roboczym i poproś bota, aby go ponownie odczytał.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale pozostawić go zainstalowanym?">
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
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dla deweloperów; czyści konfigurację deweloperską + dane uwierzytelniające + sesje + obszar roboczy).

  </Accordion>

  <Accordion title='Otrzymuję błędy „context too large” - jak wykonać reset lub compact?'>
    Użyj jednej z tych opcji:

    - **Compact** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli problem nadal występuje:

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby przycinać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę komunikat „LLM request rejected: messages.content.tool_use.input field required”?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij świeżą sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego otrzymuję wiadomości heartbeat co 30 minut?">
    Heartbeat domyślnie uruchamia się co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostrój je lub wyłącz:

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
    takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku brakuje, heartbeat nadal się uruchamia, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
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

    Szukaj `chatId` (lub `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli jest już skonfigurowana/dodana do allowlisty): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Bramka wzmianek jest włączona (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest dodana do allowlisty.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z wiadomościami bezpośrednimi?">
    Czaty bezpośrednie domyślnie składają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to osobne sesje. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile obszarów roboczych i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (nawet setki) są w porządku, ale zwróć uwagę na:

    - **Wzrost użycia dysku:** sesje i transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe równoczesne użycie modeli.
    - **Narzut operacyjny:** profile uwierzytelniania, obszary robocze i trasowanie kanałów dla każdego agenta.

    Wskazówki:

    - Utrzymuj jeden **aktywny** obszar roboczy na agenta (`agents.defaults.workspace`).
    - Usuwaj stare sesje (usuń JSONL lub wpisy magazynu), jeśli dysk się zapełnia.
    - Użyj `openclaw doctor`, aby wykryć zbędne obszary robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **trasowania wielu agentów**, aby uruchomić wiele izolowanych agentów i trasować wiadomości przychodzące według
    kanału/konta/rozmówcy. Slack jest obsługiwany jako kanał i może być powiązany z konkretnymi agentami.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „zrób wszystko, co może człowiek” - mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Stale działający host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP lub w razie potrzeby przez węzeł.

    Dokumentacja: [trasowanie wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [przeglądarka](/pl/tools/browser), [węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi dotyczące modeli — wartości domyślnych, wyboru, aliasów, przełączania, przełączania awaryjnego i profili uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już działa” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (Control UI, haki itd.).

    Kolejność pierwszeństwa:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z WebSocketem Gateway.

    Użyj `openclaw gateway status` i ufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez sondę)
    - `Listening:` (co faktycznie nasłuchuje na porcie)
    - `Last gateway error:` (częsta główna przyczyna, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa działa z innym (często jest to niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tym samym `--profile` / środowiskiem, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę uruchomieniową przez natychmiastowe powiązanie listenera WebSocket podczas startu (domyślnie `ws://127.0.0.1:18789`). Jeśli powiązanie nie powiedzie się z `EADDRINUSE`, zgłaszany jest `GatewayLockError`, wskazujący, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny adres URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami ze współdzielonym sekretem:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` to `local` (albo gdy przekażesz flagę nadpisującą).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same w sobie nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje „unauthorized” (albo ciągle ponownie się łączy). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z buforowanym tokenem urządzenia, gdy Gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem wykorzystuje teraz buforowane zatwierdzone zakresy zapisane z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują swój żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
    - Sprawdzanie zakresu tokenu bootstrap używa prefiksów ról. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; węzły lub inne role nieoperatora nadal potrzebują zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje i kopiuje URL dashboardu, próbuje go otworzyć; pokazuje podpowiedź SSH, jeśli działa bez ekranu).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowane proxy świadome tożsamości, a nie przez surowy URL Gateway. Proxy local loopback na tym samym hoście także wymagają `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej próbie ponowienia, obróć/zatwierdź ponownie sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko **własne** urządzenie, chyba że mają także `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [rozwiązywaniem problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Powiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs nie działa), nie ma z czym się powiązać.

    Naprawa:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz powiązania tylko dla tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów wiadomości i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz nadmiarowości (np. bota ratunkowego) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja dla instancji)
    - `OPENCLAW_STATE_DIR` (stan dla instancji)
    - `agents.defaults.workspace` (izolacja obszaru roboczego)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalne `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy ręcznych uruchomieniach).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiks do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwsza wiadomość
    będzie ramką `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Typowe przyczyny:

    - Otworzyłeś **HTTP** URL w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś niewłaściwego portu lub ścieżki.
    - Proxy lub tunel usunął nagłówki uwierzytelniania albo wysłał żądanie inne niż Gateway.

    Szybkie poprawki:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w normalnej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

    Jeśli używasz CLI lub TUI, URL powinien wyglądać tak:

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

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logowania do pliku kontroluje `logging.level`. Szczegółowością konsoli sterują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [rozwiązywaniu problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Użyj pomocników gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows - jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji w Windows**:

    **1) WSL2 (zalecany):** Gateway działa w Linuksie.

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

    **2) Natywny Windows (niezalecany):** Gateway działa bezpośrednio w Windows.

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

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie docierają. Co sprawdzić?">
    Zacznij od szybkiego przeglądu stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Uwierzytelnianie modelu nie zostało wczytane na **hoście Gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Panel jest otwarty bez właściwego tokenu.

    Jeśli jesteś zdalnie, potwierdź, że połączenie tunelu/Tailscale działa i że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Odłączono od gateway: brak powodu" - co teraz?'>
    To zwykle oznacza, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy połączenie tunelu/Tailscale działa?

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

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Ogranicz polecenia plugin/skill/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` albo podobne błędy sieciowe: jeśli korzystasz z VPS albo jesteś za proxy, potwierdź, że wychodzące HTTPS jest dozwolone i że DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że patrzysz na logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje danych wyjściowych. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale
    czatu, upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a następnie uruchomić Gateway?">
    Jeśli usługa została zainstalowana:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linux).
    Użyj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart a openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli usługa została zainstalowana, użyj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś zawiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Moja skill wygenerowała obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać linię `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie z CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź także:

    - Kanał docelowy obsługuje multimedia wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, temp/media-store i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki wyglądające jak tajne dane nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące wiadomości DM jest bezpieczne?">
    Traktuj przychodzące DM jako niezaufane dane wejściowe. Ustawienia domyślne są zaprojektowane tak, aby ograniczać ryzyko:

    - Domyślne zachowanie w kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwieranie DM wymaga wyraźnej zgody (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli twój asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model może zostać nakłoniony do
    eksfiltracji kontekstu albo wywoływania narzędzi w twoim imieniu. Ogranicz zasięg skutków przez:

    - używanie agenta „reader” tylko do odczytu albo z wyłączonymi narzędziami do streszczania niezaufanej treści
    - pozostawienie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu także jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granic treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Odizolowanie bota za pomocą oddzielnych kont i numerów telefonu
    zmniejsza zasięg skutków, jeśli coś pójdzie nie tak. Ułatwia to także rotację
    poświadczeń albo cofnięcie dostępu bez wpływu na konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerz
    go później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad twoimi wiadomościami osobistymi. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **oddzielnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w twoim imieniu.
    - Niech przygotuje wersję roboczą, a następnie **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, zrób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent obsługuje tylko czat, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas czytania niezaufanej treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w sandboxie. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca wysyła wiadomość do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłać wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna zasada DM w WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia twojej **listy dozwolonych/właściciela**, aby twoje własne DM były dozwolone. Nie służy do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „nie chce się zatrzymać”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość wewnętrznych komunikatów lub komunikatów narzędzi pojawia się tylko wtedy, gdy dla tej sesji włączone jest **verbose**, **trace** albo **reasoning**.

    Napraw w czacie, w którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo szumu, sprawdź ustawienia sesji w UI kontroli i ustaw verbose
    na **dziedziczenie**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    To są wyzwalacze przerwania (nie polecenia slash).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń slash: zobacz [Polecenia slash](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa też w tekście dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wysyłanie wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle do Discord, chyba że jawnie na to pozwolisz.

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

    Zrestartuj gateway po edycji konfiguracji.

  </Accordion>

  <Accordion title='Dlaczego wydaje się, że bot „ignoruje” szybko wysyłane wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości oddziałują z trwającym uruchomieniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - kolejkuj całe oczekujące sterowanie do następnej granicy modelu w bieżącym uruchomieniu
    - `queue` - starszy tryb sterowania pojedynczo
    - `followup` - uruchamiaj wiadomości pojedynczo
    - `collect` - grupuj wiadomości i odpowiedz raz
    - `steer-backlog` - steruj teraz, potem przetwórz zaległości
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Trybem domyślnym jest `steer`. Dla trybów uzupełniających możesz dodać opcje, takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty domyślny model to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz komunikat `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrażanie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — diagnozowanie według objawów
