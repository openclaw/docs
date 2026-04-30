---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub wsparcia w czasie działania
    - Wstępna klasyfikacja problemów zgłoszonych przez użytkowników przed szczegółowym debugowaniem
summary: Często zadawane pytania dotyczące instalacji, konfiguracji i użytkowania OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-04-30T09:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostykę środowiska uruchomieniowego znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełne omówienie konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsze sprawdzenie)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja dostawców + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe nadzorcy w porównaniu z dostępnością RPC, docelowy URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia sondę kondycji Gateway na żywo, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Śledzenie najnowszego logu**

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

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Pyta działający Gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja pierwszego uruchomienia

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacja, onboarding, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI uruchamiany na Twoich własnych urządzeniach. Odpowiada w kanałach komunikacji, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone pluginy kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + Canvas na żywo. **Gateway** to stale działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw nie jest „tylko wrapperem Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    zaawansowanego asystenta na **Twoim własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, z
    sesjami ze stanem, pamięcią i narzędziami - bez oddawania kontroli nad Twoimi przepływami pracy hostowanej
    usłudze SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i przechowuj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modeli:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      i przełączaniem awaryjnym dla poszczególnych agentów.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli tego chcesz.
    - **Routing wielu agentów:** osobni agenci dla kanału, konta lub zadania, każdy z własnym
      obszarem roboczym i wartościami domyślnymi.
    - **Open source i łatwy do modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmaila i automatyzuj podsumowania lub działania następcze.

    Radzi sobie z dużymi zadaniami, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz podagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie są pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i ważnych dla Ciebie wiadomości.
    - **Research i tworzenie szkiców:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i listy kontrolne sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia szkiców**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać potencjalnych klientów i pisać szkice outreachu lub tekstów reklamowych.

    Przy **outreachu lub kampaniach reklamowych** zachowaj udział człowieka. Unikaj spamu, przestrzegaj lokalnego prawa i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować szkic, a następnie samodzielnie go zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    potrzebujesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + obszar roboczy** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Stale działający Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Node’y** dla lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania repozytorium w stanie dirty?">
    Użyj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z dołączonymi Skills bez dotykania gita. Jeśli Skill ma być zainstalowany globalnie, ale widoczny tylko dla części agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny trafić do repozytorium i wyjść jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli Skill ma być widoczny tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawiać nadpisanie `model` dla każdego zadania.
    - **Podagenci**: kieruj zadania do osobnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Użyj **podagentów** do długich lub równoległych zadań. Podagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują główny czat responsywnym.

    Poproś bota, aby „utworzył podagenta dla tego zadania”, albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i podagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla podagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje podagentów powiązane z wątkiem na Discord?">
    Użyj powiązań wątków. Możesz powiązać wątek Discord z podagentem lub celem sesji, aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Utwórz za pomocą `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"` dla trwałej kontynuacji).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne wyłączenie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne wartości domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy tworzeniu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Podagent zakończył pracę, ale aktualizacja zakończenia trafiła w złe miejsce albo nigdy się nie pojawiła. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę żądającego:

    - Dostarczanie podagenta w trybie zakończenia preferuje dowolny powiązany wątek lub trasę rozmowy, jeśli istnieje.
    - Jeśli źródło zakończenia zawiera tylko kanał, OpenClaw używa awaryjnie zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik zamiast natychmiastowego opublikowania na czacie trafi awaryjnie do kolejki dostarczania sesji.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić awaryjne przejście do kolejki albo ostateczną porażkę dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta potomnego jest dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować wcześniejszy, nieaktualny postęp.
    - Jeśli proces potomny przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzia.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa ciągle,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że Cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` kontra strefa czasowa hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron został uruchomiony, ale nic nie wysłano do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie jest oczekiwana wysyłka awaryjna przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia ją zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner tłumi także zakolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` kontroluje tylko ścieżkę awaryjną runnera
    dla końcowego tekstu, którego agent nie wysłał wcześniej samodzielnie.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron zmieniło modele lub ponowiło próbę raz?">
    To zwykle ścieżka przełączania modelu na żywo, a nie zduplikowane harmonogramowanie.

    Izolowany cron może utrwalić przekazanie modelu w czasie wykonywania i ponowić próbę,
    gdy aktywne uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowe nadpisanie profilu uwierzytelniania, cron
    utrwala je również przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu przez hak Gmail ma pierwszeństwo, gdy ma zastosowanie.
    - Następnie `model` dla zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponowień jest ograniczona. Po początkowej próbie plus 2 ponowieniach przełączenia
    cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [CLI cron](/pl/cli/cron).

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
    aktywnego obszaru roboczego. Zainstaluj oddzielne CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. W przypadku współdzielonych instalacji między agentami umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub ciągle w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania cron** dla zaplanowanych lub cyklicznych zadań (utrzymują się po restartach).
    - **Heartbeat** dla okresowych sprawdzeń „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills dostępne tylko na Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy są kwalifikowalne na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie załadują się, chyba że nadpiszesz ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z Linuxa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja na pasku menu) i ustaw **Polecenia uruchamiane przez Node** na „Zawsze pytaj” albo „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikowalne, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie dodaje to polecenie do listy dozwolonych.

    **Opcja C - pośrednicz w plikach binarnych macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikowalny.

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

    - **Niestandardowy Skill / Plugin:** najlepsze dla niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

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

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz powyższy wpis FAQ Homebrew dla Linuxa). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz niestandardową nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom hosta węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na referencjach, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Piaskownica i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowany dokument o piaskownicy?">
    Tak. Zobacz [Piaskownica](/pl/gateway/sandboxing). Konfiguracja specyficzna dla Docker (pełny Gateway w Docker albo obrazy piaskownicy) jest opisana w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wypiecz zależności systemowe w obrazie za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować wiadomości prywatne jako osobiste, ale uczynić grupy publicznymi/w piaskownicy za pomocą jednego agenta?">
    Tak - jeśli Twój ruch prywatny to **wiadomości prywatne**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie piaskownicy, podczas gdy główna sesja wiadomości prywatnych pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach piaskownicy przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: osobiste wiadomości prywatne + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do piaskownicy?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne i per-agent powiązania są scalane; powiązania per-agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że powiązania omijają ściany systemu plików piaskownicy.

    OpenClaw weryfikuje źródła powiązań względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązywanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego dowiązaniem symbolicznym nadal kończą się bezpiecznie odmową, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a sprawdzenia dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Piaskownica](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Piaskownica kontra polityka narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia także **ciche opróżnianie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (piaskownice tylko do odczytu je pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby je zachowała?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi, aby przechowywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Limitem jest Twoja
    przestrzeń dyskowa, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać skompaktowane lub obcięte. Dlatego
    istnieje wyszukiwanie pamięci - przywraca do kontekstu tylko odpowiednie części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne przeszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. Codex OAuth obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth lub
    logowanie w Codex CLI)** nie pomaga w semantycznym przeszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozpoznać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli rozpoznany jest klucz OpenAI, w przeciwnym razie Gemini, jeśli rozpoznany jest klucz Gemini,
    następnie Voyage, a potem Mistral. Jeśli nie ma dostępnego klucza zdalnego, przeszukiwanie
    pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną
    ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub lokalne**
    - szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co do nich wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i obszar roboczy znajdują się na hoście Gateway
      (`~/.openclaw` + katalog Twojego obszaru roboczego).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itp.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itp.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres danych:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Obszar roboczy agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import starszego OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretu dla dostawców SecretRef `file`  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Plik zgodności ze starszymi wersjami (statyczne wpisy `api_key` usunięte) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan poszczególnych agentów (agentDir + sesje)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia i stan rozmów (dla każdego agenta)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (dla każdego agenta)                                |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **obszar roboczy** (AGENTS.md, pliki pamięci, Skills itp.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **obszarze roboczym agenta**, a nie w `~/.openclaw`.

    - **Obszar roboczy (dla każdego agenta)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      `memory.md` małymi literami w katalogu głównym jest wyłącznie starszym wejściem naprawczym; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy istnieją oba pliki.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślny obszar roboczy to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, potwierdź, że Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa obszaru roboczego
    **hosta gateway**, a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałe zachowanie lub preferencję, poproś bota, aby **zapisał je w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Obszar roboczy agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia tworzenia kopii zapasowych">
    Umieść swój **obszar roboczy agenta** w **prywatnym** repozytorium git i wykonuj jego kopię zapasową w miejscu
    prywatnym (na przykład GitHub private). Obejmuje to pamięć + pliki AGENTS/SOUL/USER
    i pozwala później przywrócić „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego przywrócenia, wykonaj kopię zapasową zarówno obszaru roboczego, jak i katalogu stanu
    oddzielnie (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza obszarem roboczym?">
    Tak. Obszar roboczy jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane w obszarze roboczym, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączony jest sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandboxa dla poszczególnych agentów. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    obszar roboczy oddzielnie, chyba że celowo chcesz, aby agent pracował w jego wnętrzu.

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

  <Accordion title="Tryb zdalny: gdzie znajduje się magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, interesujący Cię magazyn sesji znajduje się na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli brakuje pliku, używa w miarę bezpiecznych wartości domyślnych (w tym domyślnego obszaru roboczego `~/.openclaw/workspace`).

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

    - `gateway.remote.token` / `.password` **nie** włączają samodzielnie uwierzytelniania lokalnego gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - W przypadku uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania zdalnym fallbackiem).
    - Konfiguracje współdzielonego sekretu Control UI uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania współdzielonych sekretów w adresach URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej ścieżce domyślnej oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie gateway przechodzi w tryb tokenu i automatycznie go generuje, zapisując do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. Blokuje to innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (lub, w przypadku reverse proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w swojej konfiguracji. Doctor może wygenerować dla Ciebie token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, a przy krytycznych wykonuje restart
    - Obsługiwane są także `hot`, `restart`, `off`

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

    - `off`: ukrywa tekst sloganu, ale pozostawia wiersz tytułu/wersji banera.
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
    Starsze ścieżki dostawcy `tools.web.search.*` nadal są tymczasowo ładowane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja zapasowego pobierania z sieci Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że wyłączono je jawnie).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego zapasowego dostawcę pobierania na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (lub ze środowiska usługi).

    Dokumentacja: [Narzędzia sieciowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego w przyszłości?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja zepsuje uruchamianie lub przeładowanie na gorąco, Gateway przywraca ostatnią znaną dobrą konfigurację i zapisuje odrzucony plik jako `openclaw.json.clobbered.*`.
    - Główny agent otrzymuje ostrzeżenie rozruchowe po odzyskaniu, aby nie zapisał ponownie na ślepo błędnej konfiguracji.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Config auto-restored from last-known-good`, `Config write rejected:` lub `config reload restored last-known-good config`.
    - Sprawdź najnowszy plik `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Zachowaj aktywną przywróconą konfigurację, jeśli działa, a następnie skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Uruchom `openclaw config validate` i `openclaw doctor`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo ponownie uruchom `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację lub dowolną kopię zapasową.
    - Lokalny agent programistyczny często potrafi odtworzyć działającą konfigurację na podstawie logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszego przechodzenia.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla właściciela z uruchomienia agenta, nadal odrzuci ono zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek wykonywania).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurowanie](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze specjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) oraz **nodes** i **agenci**:

    - **Gateway (centralny):** obsługuje kanały (Signal/WhatsApp), routing i sesje.
    - **Nodes (urządzenia):** Maci/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne mózgi/przestrzenie robocze dla ról specjalnych (np. „operacje Hetzner”, „Dane osobiste”).
    - **Subagenci:** uruchamiają pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Zdalny dostęp](/pl/gateway/remote), [Routing wielu agentów](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [TUI](/pl/web/tui).

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

    Wartość domyślna to `false` (z interfejsem graficznym). Tryb headless częściej wywołuje kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej rygorystyczne wobec automatyzacji w trybie headless (CAPTCHA, zabezpieczenia antybotowe).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak użyć Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik wykonywalny Brave (lub dowolną przeglądarkę opartą na Chromium) i uruchom ponownie Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gatewaye i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gatewayem i nodes?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą przychodzącego ruchu dostawcy; odbierają tylko wywołania RPC node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na twoim lokalnym komputerze przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway + swój komputer w tej samej tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (powiązanie tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Zdalnie przez SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; nodes łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie node macOS umożliwia `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przeczytaj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie otrzymuję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan Gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że twoje listy dozwolonych (DM lub grupa) obejmują twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Zdalny dostęp](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale możesz połączyć je na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a następnie Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując do czatu, w którym słucha drugi bot.
    Jeśli jeden bot jest na zdalnym VPS, skieruj swój CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Zdalny dostęp](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może dosięgnąć docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby oba boty nie zapętlały się bez końca (tylko wzmianki, listy
    dozwolonych kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Zdalny dostęp](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi ustawieniami modelu
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj oddzielnych VPS tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów albo subagentów.

  </Accordion>

  <Accordion title="Czy używanie node na moim osobistym laptopie zamiast SSH z VPS ma zalety?">
    Tak - nodes to pierwszorzędny sposób dotarcia do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS albo urządzenie klasy Raspberry Pi wystarczy; 4 GB RAM to sporo), więc typowa
    konfiguracja to zawsze włączony host plus laptop jako node.

    - **Brak wymaganego przychodzącego SSH.** Nodes łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrole wykonywania.** `system.run` jest ograniczane przez listy dozwolonych/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host node na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH nadaje się do doraźnego dostępu do powłoki, ale nodes są prostsze dla ciągłych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na hoście, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Nodes to urządzenia peryferyjne, które łączą się
    z gatewayem (nodes iOS/Android albo „tryb node” macOS w aplikacji paska menu). Dla hostów node
    headless i sterowania CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżący zrzut + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: waliduje + zastępuje pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie runtime `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek wykonywania

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ustawia to workspace i ogranicza, kto może uruchamiać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj i zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj i zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnetu.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnetu**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu Gateway pozostaje powiązany z interfejsem pętli zwrotnej i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć węzeł Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Control UI Gateway + WS**. Węzły łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tym samym tailnecie**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnetu).
       Aplikacja utworzy tunel dla portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na bramie:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [Tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy po prostu dodać węzeł?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec), dodaj go jako
    **węzeł**. Dzięki temu zachowasz jeden Gateway i unikniesz duplikowania konfiguracji. Lokalne narzędzia węzłów są
    obecnie dostępne tylko w macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** lub dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Wiele bram](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoki, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny awaryjny plik `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

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

    Pełną kolejność pierwszeństwa i źródła znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
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

    To uruchamia powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki w zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje „Shell env: off”. Dlaczego?'>
    `openclaw models status` informuje, czy włączony jest **import środowiska powłoki**. „Shell env: off”
    **nie** oznacza, że brakuje zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy Twojego
    środowiska powłoki. Napraw to w jeden z tych sposobów:

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
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie po bezczynności. Gdy jest włączone, **następna**
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

  <Accordion title="Czy da się stworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **subagentów**. Możesz utworzyć jednego agenta koordynującego
    oraz kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    przewidujemy, to jeden bot, z którym rozmawiasz, z różnymi sesjami do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać subagentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w środku zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota o ponowne odczytanie go.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
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

    Następnie uruchom konfigurację ponownie:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding także oferuje **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dla trybu deweloperskiego; czyści konfigurację deweloperską + dane logowania + sesje + workspace).

  </Accordion>

  <Accordion title='Otrzymuję błędy „context too large” - jak zresetować lub skompaktować?'>
    Użyj jednej z tych opcji:

    - **Kompaktowanie** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli problem się powtarza:

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby usuwać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę „LLM request rejected: messages.content.tool_use.input field required”?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego pola
    `input`. Zwykle oznacza to, że historia sesji jest przestarzała lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij nową sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego co 30 minut dostaję wiadomości heartbeat?">
    Heartbeat domyślnie działa co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je lub wyłącz:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie pusty (tylko puste linie i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł uruchamiać odpowiedzi w grupie:

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

    Poszukaj `chatId` (lub `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli jest już skonfigurowana/na liście dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Włączone jest bramkowanie wzmianką (domyślnie). Musisz oznaczyć bota przez @mention (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na liście dozwolonych.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są osobnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Nie ma twardych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Wzrost użycia dysku:** sesje + transkrypty znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe równoczesne użycie modeli.
    - **Narzucone działania operacyjne:** profile uwierzytelniania per agent, workspace i routing kanałów.

    Wskazówki:

    - Zachowaj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuwaj JSONL lub wpisy magazynu), jeśli rośnie użycie dysku.
    - Użyj `openclaw doctor`, aby wykryć zbędne workspace i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **routingu wieloagentowego**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peera. Slack jest obsługiwany jako kanał i można go przypisać do konkretnych agentów.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „rób wszystko, co może człowiek” - mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo użyj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (przypisania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP lub węzeł, gdy jest potrzebna.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi o modelach — wartości domyślne, wybór, aliasy, przełączanie, przełączanie awaryjne, profile uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już uruchomiony” i tryb zdalny

<AccordionGroup>
  <Accordion title="Którego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Próba łączności to CLI faktycznie łączące się z WebSocket Gateway.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez próbę)
    - `Listening:` (co faktycznie jest przypięte do portu)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracyjny, podczas gdy usługa używa innego (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę runtime przez natychmiastowe przypięcie nasłuchiwania WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli przypięcie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

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

    - `openclaw gateway` startuje tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo gdy przekażesz flagę nadpisującą).
    - Aplikacja macOS obserwuje plik konfiguracyjny i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje „unauthorized” (albo stale łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą wykonać jedną ograniczoną ponowną próbę z buforowanym tokenem urządzenia, gdy Gateway zwraca podpowiedzi ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ta ponowna próba z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
    - Kontrole zakresu tokenu bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; węzeł lub inne role niebędące operatorem nadal potrzebują zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje i kopiuje adres URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli środowisko jest bezgłowe).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy adres loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowane proxy świadome tożsamości, a nie surowy adres URL Gateway. Proxy loopback na tym samym hoście również wymagają `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej ponownej próbie, obróć/zatwierdź ponownie sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że odmówiono dostępu, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywaniem problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboardzie](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może się przypiąć i nic nie nasłuchuje">
    Przypięcie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma do czego się przypiąć.

    Naprawa:

    - Uruchom Tailscale na tym hoście (tak aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz przypięcia tylko do tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów komunikacyjnych i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja dla instancji)
    - `OPENCLAW_STATE_DIR` (stan dla instancji)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy uruchomieniach ręcznych).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiks do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwszą wiadomością
    będzie ramka `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzyłeś adres URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś niewłaściwego portu lub ścieżki.
    - Proxy albo tunel usunął nagłówki uwierzytelniania lub wysłał żądanie inne niż Gateway.

    Szybkie naprawy:

    1. Użyj adresu URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, uwzględnij token/hasło w ramce `connect`.

    Jeśli używasz CLI albo TUI, adres URL powinien wyglądać tak:

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

    Stabilną ścieżkę możesz ustawić przez `logging.file`. Poziom logów plikowych jest kontrolowany przez `logging.level`. Szczegółowość konsoli jest kontrolowana przez `--verbose` i `logging.consoleLevel`.

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

    **1) WSL2 (zalecany):** Gateway działa wewnątrz Linuksa.

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

    Jeśli jesteś zdalnie, potwierdź, że tunel/połączenie Tailscale działa i że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='„Disconnected from gateway: no reason” - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy tunel/połączenie Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/pl/web/dashboard), [Zdalny dostęp](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands kończy się niepowodzeniem. Co sprawdzić?">
    Zacznij od logów i statusu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Ogranicz polecenia pluginu/skill/custom lub wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że przeglądasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnego wyjścia. Co sprawdzić?">
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
    Jeśli zainstalowano usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linux).
    Użyj tego, gdy Gateway działa w tle jako daemon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart kontra openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowano usługę, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie więcej szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem błędów uwierzytelniania kanałów, routingu modeli i RPC.
  </Accordion>
</AccordionGroup>

## Media i załączniki

<AccordionGroup>
  <Accordion title="Mój skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane maksymalnie do 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, temp/media-store i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla mediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki wyglądające jak sekrety nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawianie OpenClaw na przychodzące DM jest bezpieczne?">
    Traktuj przychodzące DM jako niezaufane dane wejściowe. Domyślne ustawienia zaprojektowano tak, aby zmniejszyć ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnej zgody (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby ujawnić ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysyłać DM do bota.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), mogą one zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko występuje, gdy narzędzia są włączone: model można nakłonić do
    eksfiltracji kontekstu albo wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg skutków przez:

    - używanie agenta „reader” tylko do odczytu lub bez narzędzi do podsumowywania niezaufanych treści
    - pozostawienie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu także jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny adres e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota przy użyciu oddzielnych kont i numerów telefonu
    zmniejsza zasięg skutków, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    poświadczeń lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, a potem rozszerz
    go później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi SMS-ami i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi prywatnymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować wersję roboczą, a następnie **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je odizolowane. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent służy tylko do czatu, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas czytania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj w sandboxie. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowy dostęp, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłać wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna zasada DM dla WhatsApp to **parowanie**. Nieznani nadawcy dostają tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli używasz swojego prywatnego numeru WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzymuje”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych w czacie?">
    Większość komunikatów wewnętrznych lub narzędzi pojawia się tylko wtedy, gdy dla tej sesji włączone jest
    **verbose**, **trace** lub **reasoning**.

    Napraw w czacie, w którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo szumu, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **dziedziczenie**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Thinking i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
    Wyślij dowolne z poniższych **jako osobną wiadomość** (bez ukośnika):

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

    Większość poleceń trzeba wysłać jako **osobną** wiadomość zaczynającą się od `/`, ale kilka skrótów (np. `/status`) działa też w treści wiadomości dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Odmówiono wiadomości między kontekstami”)'>
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

    Zrestartuj gateway po edycji konfiguracji.

  </Accordion>

  <Accordion title='Dlaczego wygląda na to, że bot „ignoruje” szybko wysyłane wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości współdziałają z uruchomionym przebiegiem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - ustaw w kolejce wszystkie oczekujące sterowania do następnej granicy modelu w bieżącym przebiegu
    - `queue` - starsze sterowanie pojedynczo
    - `followup` - uruchamiaj wiadomości pojedynczo
    - `collect` - zbieraj wiadomości i odpowiedz raz
    - `steer-backlog` - steruj teraz, a następnie przetwórz zaległości
    - `interrupt` - przerwij bieżący przebieg i zacznij od nowa

    Tryb domyślny to `steer`. Do trybów followup możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty domyślny model to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz komunikat `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHubie](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — klasyfikacja według objawów
