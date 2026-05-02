---
read_when:
    - Odpowiadanie na częste pytania dotyczące konfiguracji, instalacji, wdrażania lub obsługi środowiska uruchomieniowego
    - Wstępna analiza problemów zgłoszonych przez użytkowników przed głębszą diagnostyką
summary: Najczęściej zadawane pytania dotyczące instalacji, konfiguracji i używania OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-05-02T22:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny development, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostyka środowiska uruchomieniowego: zobacz [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełna dokumentacja konfiguracji: zobacz [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie podsumowanie lokalne: system operacyjny + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja providera + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe supervisora względem osiągalności RPC, docelowy URL próby oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie próby**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną próbę stanu Gateway, w tym próby kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Śledź najnowszy log**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj awaryjnie:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom doktora (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację/stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Pyta działający Gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

Pytania i odpowiedzi z pierwszego uruchomienia — instalacja, onboarding, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w miejscach komunikacji, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone plugins kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + aktywny Canvas. **Gateway** to zawsze włączona płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw nie jest „tylko wrapperem Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    kompetentnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, ze
    stanowymi sesjami, pamięcią i narzędziami - bez oddawania kontroli nad swoimi przepływami pracy hostowanej
    usłudze SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, twoje dane:** uruchamiaj Gateway gdzie chcesz (Mac, Linux, VPS) i zachowuj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależny od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i przełączaniem awaryjnym.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły zostać na twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** oddzielni agenci dla kanału, konta lub zadania, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i łatwy do modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prostą stronę statyczną).
    - Przygotuj prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmail i automatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i wiadomości, które cię interesują.
    - **Research i redagowanie:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i listy kontrolne sterowane przez cron lub heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc z lead generation, outreach, reklamami i blogami dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i redagowania**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać potencjalnych klientów oraz pisać szkice wiadomości outreach lub tekstów reklam.

    Przy **kampaniach outreach lub reklamowych** utrzymuj człowieka w procesie. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować szkic, a następnie zatwierdzić go samodzielnie.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są przewagi względem Claude Code w web developmencie?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    potrzebujesz trwałej pamięci, dostępu z wielu urządzeń i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Zawsze włączony Gateway** (uruchamiany na VPS, interakcja z dowolnego miejsca)
    - **Nodes** dla lokalnej przeglądarki/ekranu/kamery/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować skills bez zostawiania repozytorium w stanie dirty?">
    Użyj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z dołączonymi skills bez dotykania git. Jeśli skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność za pomocą `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repozytorium i trafiać jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawiać nadpisanie `model` per zadanie.
    - **Subagenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) oraz [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak ją odciążyć?">
    Użyj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują główny czat responsywnym.

    Poproś bota, aby „spawn a sub-agent for this task”, albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem na Discord?">
    Użyj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby kolejne wiadomości w tym wątku pozostały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Spawnuj za pomocą `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych odpowiedzi następczych).
    - Albo ręcznie powiąż za pomocą `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne zdjęcie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy spawnie: `channels.discord.threadBindings.spawnSessions` ma domyślnie wartość `true`; ustaw ją na `false`, aby wyłączyć spawny sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył działanie, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy się nie opublikowała. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requester:

    - Dostarczanie subagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, gdy istnieje.
    - Jeśli origin ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji requester (`lastChannel` / `lastTo` / `lastAccountId`), więc bezpośrednie dostarczenie nadal może się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca do dostarczania w kolejce sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić fallback do kolejki albo końcową awarię dostarczania.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo wycisza ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
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
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
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

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie oczekuje się wysyłki awaryjnej przez runnera.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia ją zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner również pomija kolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` steruje tylko awaryjną ścieżką runnera
    dla tekstu końcowego, którego agent wcześniej nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron przełączyło modele albo ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie zduplikowane planowanie.

    Izolowany Cron może utrwalić przekazanie modelu w czasie wykonywania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie przeniosło nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu hooka Gmail ma pierwszeństwo, gdy ma zastosowanie.
    - Następnie `model` dla zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji Cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponawiania jest ograniczona. Po pierwszej próbie plus 2 ponowieniach po przełączeniu
    Cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI Cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs macOS Skills nie jest dostępny w systemie Linux.
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
    `agents.list[].skills`, jeśli chcesz zawęzić listę agentów, które mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może wykonywać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zaplanowanych lub cyklicznych zadań (utrzymują się po restartach).
    - **Heartbeat** do okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania albo dostarczają wiadomości do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz to ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja paska menu) i ustaw **Node Run Commands** na „Always Ask” albo „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - pośrednicz pliki binarne macOS przez SSH (zaawansowane).**
    Zachowaj Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill, aby zezwolić na Linux, tak aby pozostał kwalifikujący się.

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

    4. Uruchom nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy Skill / plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na problemy.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobrał tę stronę na początku sesji.

    Jeśli chcesz natywną integrację, otwórz zgłoszenie funkcji albo zbuduj Skill
    ukierunkowany na te API.

    Zainstaluj Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku Skills współdzielonych między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak użyć istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który podłącza się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz użyć niestandardowej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zamiast tego zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - działania są oparte na ref, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i działania wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Izolacja i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja izolacji?">
    Tak. Zobacz [Izolacja](/pl/gateway/sandboxing). Konfigurację specyficzną dla Docker (pełny Gateway w Docker albo obrazy izolacji) opisuje [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Dodaj zależności systemowe do obrazu za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne DM-y, ale uczynić grupy publicznymi/izolowanymi przy użyciu jednego agenta?">
    Tak - jeśli Twój prywatny ruch to **DM-y**, a publiczny ruch to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze niegłówne) działały w skonfigurowanym backendzie izolacji, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach izolowanych za pomocą `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM-y + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak powiązać folder hosta z izolacją?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne i dla agenta są scalane; powiązania dla agenta są ignorowane, gdy `scope: "shared"`. Użyj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że powiązania omijają ściany systemu plików izolacji.

    OpenClaw weryfikuje źródła powiązań względem zarówno ścieżki znormalizowanej, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego dowiązaniem symbolicznym nadal kończą się zamknięciem dostępu, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Izolacja](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Izolacja vs polityka narzędzi vs uprawnienia podwyższone](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby znaleźć przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wybrane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia również **ciche opróżnianie pamięci przed Compaction**, aby przypomnieć modelowi,
    żeby zapisał trwałe notatki przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (izolacje tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby je zachowała?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypomnienie modelowi, aby przechowywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są ograniczenia?">
    Pliki pamięci znajdują się na dysku i utrzymują się, dopóki ich nie usuniesz. Ograniczeniem jest Twoja
    przestrzeń dyskowa, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać skompaktowane albo przycięte. Dlatego istnieje
    wyszukiwanie pamięci - przywraca do kontekstu tylko odpowiednie części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne przeszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. Codex OAuth obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth lub
    logowanie Codex CLI)** nie pomaga w semantycznym przeszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne env).
    Preferuje OpenAI, jeśli dostępny jest klucz OpenAI, w przeciwnym razie Gemini, jeśli
    dostępny jest klucz Gemini, potem Voyage, potem Mistral. Jeśli żaden zdalny klucz nie jest dostępny,
    przeszukiwanie pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną
    i dostępną ścieżkę do lokalnego modelu, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub lokalne**
    - szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co do nich wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres danych:** używanie lokalnych modeli zatrzymuje prompty na twoim komputerze, ale ruch
      kanału nadal przechodzi przez serwery kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Cel                                                                |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Import starszego OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Plik zgodności ze starszymi wersjami (statyczne wpisy `api_key` wyczyszczone) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stan poszczególnych agentów (agentDir + sesje)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Historia i stan rozmów (na agenta)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadane sesji (na agenta)                                         |

    Starsza ścieżka dla pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (AGENTS.md, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (na agenta)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Małe `memory.md` w katalogu głównym jest tylko wejściem naprawy dla starszych wersji; `openclaw doctor --fix`
      może scalić je z `MEMORY.md`, gdy istnieją oba pliki.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, upewnij się, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa workspace **hosta gateway**,
    nie twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał je w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowej">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i twórz jego kopię zapasową w prywatnym miejscu
    (na przykład prywatnie w GitHub). Obejmuje to pamięć + pliki AGENTS/SOUL/USER
    i pozwala później przywrócić „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego przywrócenia, wykonaj osobno kopię zapasową workspace i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza workspace?">
    Tak. Workspace jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandboxu dla konkretnego agenta. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, skieruj `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; utrzymuj
    workspace oddzielnie, chyba że celowo chcesz, aby agent pracował wewnątrz niego.

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
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, istotny magazyn sesji znajduje się na zdalnej maszynie, nie na twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli pliku brakuje, używa względnie bezpiecznych ustawień domyślnych (w tym domyślnego workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Bindy inne niż loopback **wymagają poprawnej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie shared-secret: token albo hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym identity-aware reverse proxy

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
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` jest nieustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalny fallback).
    - Konfiguracje Control UI z shared-secret uwierzytelniają przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania shared secrets w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy na tym samym hoście przez loopback wymaga jawnego `gateway.auth.trustedProxy.allowLoopback = true` i wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchamianie gateway rozwiązuje się do trybu tokena i automatycznie go generuje, zapisując go w `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. Blokuje to innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla identity-aware reverse proxies, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): stosuje bezpieczne zmiany na gorąco, restartuje przy krytycznych
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

    - `off`: ukrywa tekst sloganu, ale zachowuje linię tytułu/wersji banera.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie z sieci)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają swojej zwykłej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza / jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy środowiskowe:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` albo `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` albo `OPENROUTER_API_KEY`
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

    Konfiguracja wyszukiwania w sieci dla konkretnego dostawcy znajduje się teraz w `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawcy `tools.web.search.*` nadal są tymczasowo wczytywane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja zastępczego pobierania z sieci Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego dostawcę zastępczego pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia web](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Aktualny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji wykonywane przez OpenClaw weryfikują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy wykonywane przez OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja przerwie uruchamianie lub hot reload, Gateway przywraca ostatnią znaną dobrą konfigurację i zapisuje odrzucony plik jako `openclaw.json.clobbered.*`.
    - Główny agent otrzymuje ostrzeżenie przy starcie po odzyskaniu, aby nie zapisał ponownie bezrefleksyjnie błędnej konfiguracji.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Config auto-restored from last-known-good`, `Config write rejected:` albo `config reload restored last-known-good config`.
    - Sprawdź najnowszy plik `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Zachowaj aktywną przywróconą konfigurację, jeśli działa, a następnie skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Uruchom `openclaw config validate` i `openclaw doctor`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i ponownie skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działającą konfigurację na podstawie logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszego przechodzenia.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` wyłącznie do zastępowania całej konfiguracji.
    - Jeśli używasz narzędzia właścicielskiego `gateway` z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurowanie](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **węzły** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Węzły (urządzenia):** komputery Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne mózgi/przestrzenie robocze dla specjalnych ról (np. „operacje Hetzner”, „Dane osobowe”).
    - **Podagenci:** uruchamiają pracę w tle z głównego agenta, gdy chcesz uzyskać równoległość.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Węzły](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing wieloagentowy](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [TUI](/pl/web/tui).

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

    Domyślnie jest to `false` (z interfejsem graficznym). Tryb headless częściej uruchamia kontrole antybotowe w niektórych witrynach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa w większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre witryny są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, ochrona antybotowa).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (albo dowolną przeglądarkę opartą na Chromium) i uruchom ponownie Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne Gateway i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu od dostawcy; otrzymują tylko wywołania RPC węzłów.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na stale włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: parowanie węzła macOS pozwala uruchamiać `system.run` na tej maszynie. Paruj tylko
    zaufane urządzenia i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie otrzymuję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanału: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM lub grupa) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą ze sobą rozmawiać (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale możesz to skonfigurować na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a następnie Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, którego słucha drugi bot.
    Jeśli jeden bot jest na zdalnym VPS, skieruj swoje CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchamiany z maszyny, która może osiągnąć docelowy Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętliły się bez końca (tylko wzmianki, listy dozwolonych kanałów
    albo regułę „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj oddzielnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub podagentów.

  </Accordion>

  <Accordion title="Czy korzystanie z węzła na moim osobistym laptopie zamiast SSH z VPS daje korzyści?">
    Tak — węzły są podstawowym sposobem dotarcia do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS albo urządzenie klasy Raspberry Pi wystarczy; 4 GB RAM to spory zapas), więc typowa
    konfiguracja to stale włączony host plus laptop jako węzeł.

    - **Brak wymaganego przychodzącego SSH.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrole wykonywania.** `system.run` jest ograniczane przez listy dozwolonych/zatwierdzenia węzła na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez hosta węzła na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH nadaje się do doraźnego dostępu do powłoki, ale węzły są prostsze dla stałych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na host, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gateway](/pl/gateway/multiple-gateways)). Węzły są urządzeniami peryferyjnymi, które łączą się
    z gateway (węzły iOS/Android albo „tryb węzła” macOS w aplikacji z paska menu). Dla bezgłowych hostów węzłów
    i sterowania z CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną podpowiedzią UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (zalecana dla większości edycji RPC); wykonuje hot reload, gdy to możliwe, i restart, gdy jest wymagany
    - `config.apply`: zweryfikuj + zastąp pełną konfigurację; wykonuje hot reload, gdy to możliwe, i restart, gdy jest wymagany
    - Właścicielskie narzędzie runtime `gateway` nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ustawia to przestrzeń roboczą i ogranicza osoby, które mogą uruchomić bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tej samej sieci tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administratora Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać interfejsu Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje przypisany do loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć węzeł Mac ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Węzły łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tej samej sieci tailnet**.
    2. **Użyj aplikacji macOS w trybie Remote** (celem SSH może być nazwa hosta tailnet).
       Aplikacja utworzy tunel dla portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Wykrywanie](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy po prostu dodać węzeł?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **węzeł**. Dzięki temu zachowasz jeden Gateway i unikniesz duplikowania konfiguracji. Lokalne narzędzia węzła są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Instaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoki, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też definiować wbudowane zmienne środowiskowe w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

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

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały wczytane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
    2. Włącz import powłoki (opcjonalne ułatwienie):

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

    Uruchamia to powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje „Shell env: off”. Dlaczego?'>
    `openclaw models status` informuje, czy włączony jest **import środowiska powłoki**. „Shell env: off”
    **nie** oznacza, że brakuje zmiennych środowiskowych - oznacza tylko, że OpenClaw nie będzie automatycznie ładować
    powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import powłoki (`env.shellEnv.enabled: true`).
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
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie po bezczynności. Po włączeniu **następna**
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

  <Accordion title="Czy istnieje sposób na utworzenie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **podagentów**. Możesz utworzyć jednego agenta koordynatora
    i kilku agentów wykonawczych z własnymi przestrzeniami roboczymi i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, jaki
    przewidujemy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać podagentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Przechowuj ważny kontekst w przestrzeni roboczej i poproś bota o jego odczytanie.
    - Używaj podagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zachować instalację?">
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

    - Onboarding także oferuje **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko deweloperskie; usuwa konfigurację dev + dane uwierzytelniające + sesje + przestrzeń roboczą).

  </Accordion>

  <Accordion title='Otrzymuję błędy „context too large” - jak zresetować albo skompaktować?'>
    Użyj jednej z tych opcji:

    - **Kompaktuj** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli nadal się to zdarza:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby usuwać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę „LLM request rejected: messages.content.tool_use.input field required”?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij nową sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego otrzymuję wiadomości heartbeat co 30 minut?">
    Heartbeat działa domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostrój albo wyłącz je:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste wiersze i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
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
    Opcja 1 (najszybsza): obserwuj logi i wyślij wiadomość testową w grupie:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowano/dodano do listy dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramka wzmianek jest włączona (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na liście dozwolonych.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z wiadomościami prywatnymi?">
    Czaty bezpośrednie są domyślnie zwijane do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są oddzielnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile przestrzeni roboczych i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost użycia dysku:** sesje + transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe współbieżne użycie modeli.
    - **Narzut operacyjny:** profile uwierzytelniania, przestrzenie robocze i routing kanałów dla każdego agenta.

    Wskazówki:

    - Utrzymuj jedną **aktywną** przestrzeń roboczą na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL albo wpisy magazynu), jeśli dysk się zapełnia.
    - Użyj `openclaw doctor`, aby wykryć zbędne przestrzenie robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **trasowania wielu agentów**, aby uruchamiać wielu izolowanych agentów i trasować wiadomości przychodzące według
    kanału/konta/partnera. Slack jest obsługiwany jako kanał i można go przypisać do konkretnych agentów.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „możliwości zrobienia wszystkiego, co człowiek” - zabezpieczenia przed botami, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze działający host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP lub node, gdy jest potrzebna.

    Dokumentacja: [Trasowanie wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi o modelach — wartości domyślne, wybór, aliasy, przełączanie, przełączanie awaryjne, profile uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już uruchomiony” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (Control UI, hooki itd.).

    Pierwszeństwo:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status mówi „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **nadzorcy** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z WebSocket Gateway.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co faktycznie jest powiązane z portem)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa uruchamia inny (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Poprawka:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę środowiska uruchomieniowego, natychmiast wiążąc listener WebSocket podczas startu (domyślnie `ws://127.0.0.1:18789`). Jeśli wiązanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Poprawka: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami współdzielonego sekretu:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` to `local` (albo gdy przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI mówi „unauthorized” (albo ciągle łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL Gateway, więc odświeżenia w tej samej karcie działają dalej bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną próbę ponowną z tokenem urządzenia z pamięci podręcznej, gdy Gateway zwróci wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ta próba ponowna z tokenem z pamięci podręcznej używa teraz ponownie zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, potem token bootstrap.
    - Sprawdzenia zakresów tokenu bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; node lub inne role nieoperatorów nadal potrzebują zakresów pod własnym prefiksem roli.

    Poprawka:

    - Najszybciej: `openclaw dashboard` (wypisuje i kopiuje URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli środowisko jest bezgłowe).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw zestaw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przychodzisz przez skonfigurowany proxy świadomy tożsamości, a nie przez surowy URL Gateway. Proxy local loopback na tym samym hoście także potrzebują `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej próbie ponownej, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą rotować tylko **własne** urządzenie, chyba że mają także `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywaniem problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboardzie](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Wiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma z czym się powiązać.

    Poprawka:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz wiązanie tylko do tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów komunikacyjnych i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja na instancję)
    - `OPENCLAW_STATE_DIR` (stan na instancję)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` dla uruchomień ręcznych).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają także sufiks do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwszą wiadomością będzie
    ramka `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzyłeś URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś niewłaściwego portu lub ścieżki.
    - Proxy albo tunel usunął nagłówki uwierzytelniania lub wysłał żądanie nieprzeznaczone dla Gateway.

    Szybkie poprawki:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

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
    Logi plikowe (strukturalne):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logów plikowych kontroluje `logging.level`. Szczegółowość konsoli kontrolują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/nadzorcy (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Użyj helperów gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows - jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji w Windows**:

    **1) WSL2 (zalecany):** Gateway działa w Linux.

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

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie przychodzą. Co sprawdzić?">
    Zacznij od szybkiego przeglądu stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Częste przyczyny:

    - Uwierzytelnianie modelu nie jest załadowane na **hoście gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli pracujesz zdalnie, potwierdź, że połączenie tunelu/Tailscale działa i że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='„Disconnected from gateway: no reason” - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest sprawny? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli jest zdalny, czy tunel/łącze Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/pl/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands kończy się niepowodzeniem. Co sprawdzić?">
    Zacznij od logów i stanu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele pozycji. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre pozycje menu nadal trzeba usunąć. Zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli działasz na VPS albo za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że oglądasz logi na hoście Gateway.

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

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli usługa jest zainstalowana:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd w macOS, systemd w Linux).
    Użyj tego, gdy Gateway działa w tle jako daemon.

    Jeśli uruchamiasz go na pierwszym planie, zatrzymaj go Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart kontra openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli usługa jest zainstalowana, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem autoryzacji kanału, routingu modelu i błędów RPC.
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

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są skalowane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, temp/media-store oraz plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla mediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki wyglądające jak tajne nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące DM-y jest bezpieczne?">
    Traktuj przychodzące DM-y jako niezaufane dane wejściowe. Domyślne ustawienia zaprojektowano tak, aby zmniejszać ryzyko:

    - Domyślne zachowanie w kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź poleceniem: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM-ów wymaga wyraźnej zgody (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby ujawnić ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko występuje, gdy narzędzia są włączone: model można nakłonić do
    eksfiltracji kontekstu lub wywoływania narzędzi w Twoim imieniu. Zmniejsz zakres skutków przez:

    - używanie tylko do odczytu lub pozbawionego narzędzi agenta „reader” do streszczania niezaufanych treści
    - pozostawienie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu również jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub lub numer telefonu?">
    Tak, w większości konfiguracji. Odizolowanie bota za pomocą osobnych kont i numerów telefonów
    zmniejsza zakres skutków, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    poświadczeń lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerz
    później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi SMS-ami i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi wiadomościami osobistymi. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM-y w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować szkic, a potem **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent jest tylko czatowy, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas czytania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w sandboxie. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca wysyła wiadomość do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj swój identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisać do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna zasada DM w WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, lub na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie poleceniem:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM-y były dozwolone. Nie służy do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzyma”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączone są
    **verbose**, **trace** lub **reasoning**.

    Napraw to w czacie, w którym je widzisz:

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

  <Accordion title="Jak zatrzymać/anulować działające zadanie?">
    Wyślij dowolny z tych tekstów **jako osobną wiadomość** (bez ukośnika):

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

    Przegląd poleceń slash: zobacz [Polecenia slash](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **osobna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa też w tekście wiadomości dla nadawców z listy dozwolonych.

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

    Po edycji konfiguracji zrestartuj gateway.

  </Accordion>

  <Accordion title='Dlaczego wydaje się, że bot „ignoruje” szybko wysyłane wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości współdziałają z uruchomionym zadaniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - kolejkuje wszystkie oczekujące sterowania do następnej granicy modelu w bieżącym uruchomieniu
    - `queue` - starsze sterowanie po jednym naraz
    - `followup` - uruchamia wiadomości pojedynczo
    - `collect` - grupuje wiadomości i odpowiada raz
    - `steer-backlog` - steruje teraz, a następnie przetwarza zaległości
    - `interrupt` - przerywa bieżące uruchomienie i zaczyna od nowa

    Tryb domyślny to `steer`. Możesz dodać opcje, takie jak `debounce:0.5s cap:25 drop:summarize`, dla trybów followup. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='What is the default model for Anthropic with an API key?'>
    W OpenClaw poświadczenia i wybór modelu są rozdzielone. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty domyślny model to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne awarie
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — diagnozowanie według objawów
