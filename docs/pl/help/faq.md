---
read_when:
    - Odpowiedzi na typowe pytania dotyczące konfiguracji, instalacji, onboardingu lub wsparcia środowiska uruchomieniowego
    - Wstępna analiza problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i użytkowania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-06-27T17:40:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostykę środowiska uruchomieniowego znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełną dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś jest zepsute

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: OS + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja providera + problemy środowiska uruchomieniowego (gdy gateway jest dostępny).

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

   Uruchamia sondę kondycji live gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga dostępnego gateway). Zobacz [Kondycja](/pl/gateway/health).

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

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Pyta działający gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

Pytania i odpowiedzi dla pierwszego uruchomienia — instalacja, onboard, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w komunikatorach, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone Plugin kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + live Canvas. **Gateway** to zawsze działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    zdolnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, z
    sesjami stanowymi, pamięcią i narzędziami - bez oddawania kontroli nad przepływami pracy hostowanemu
    SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i trzymaj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i przełączaniem awaryjnym.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** oddzielni agenci per kanał, konto lub zadanie, każdy z własnym
      obszarem roboczym i ustawieniami domyślnymi.
    - **Open source i łatwy do modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj witrynę (WordPress, Shopify albo prostą witrynę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmail i automatyzuj podsumowania lub follow-upy.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na fazy i
    użyjesz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i wiadomości, które Cię interesują.
    - **Research i tworzenie szkiców:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i follow-upy:** ponaglenia i listy kontrolne sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik z powrotem w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w pozyskiwaniu leadów, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia szkiców**. Może skanować witryny, budować krótkie listy,
    podsumowywać potencjalnych klientów oraz pisać szkice outreachu lub tekstów reklamowych.

    W przypadku **outreachu lub kampanii reklamowych** zachowaj udział człowieka w procesie. Unikaj spamu, przestrzegaj lokalnego prawa i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować szkic, a zatwierdzenie zostawić Tobie.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są przewagi względem Claude Code w tworzeniu stron internetowych?">
    OpenClaw jest **osobistym asystentem** i warstwą koordynacji, a nie zamiennikiem IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + obszar roboczy** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Zawsze działający Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Nodes** do lokalnej przeglądarki/ekranu/kamery/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez utrzymywania brudnego repozytorium?">
    Używaj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z dołączonymi skills bez dotykania git. Jeśli potrzebujesz skill zainstalowanego globalnie, ale widocznego tylko dla części agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repozytorium i trafiać jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z własnego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższe pierwszeństwo). Domyślna kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli lub ustawień do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` per zadanie.
    - **Agenci**: kieruj zadania do oddzielnych agentów z różnymi domyślnymi modelami, poziomami myślenia i parametrami strumienia.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Na przykład użyj tego samego modelu z różnymi ustawieniami per agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Umieść współdzielone ustawienia domyślne per model w `agents.defaults.models["provider/model"].params`, a następnie umieść nadpisania specyficzne dla agentów w płaskim `agents.list[].params`. Nie definiuj oddzielnych zagnieżdżonych wpisów `agents.list[].models["provider/model"].params` dla tego samego modelu; `agents.list[].models` służy do katalogu modeli per agent i nadpisań środowiska uruchomieniowego.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent), [Konfiguracja](/pl/gateway/config-agents) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „spawn a sub-agent for this task”, albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt jest istotny, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem na Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby wiadomości follow-up w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Spawnuj za pomocą `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych follow-upów).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne usuwanie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne wiązanie przy spawnowaniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw na `false`, aby wyłączyć spawnowanie sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja o zakończeniu trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę żądającego:

    - Dostarczanie subagenta w trybie completion preferuje dowolny powiązany wątek lub trasę rozmowy, gdy istnieje.
    - Jeśli źródło completion niesie tylko kanał, OpenClaw używa awaryjnie zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie powieść, a wynik wraca do kolejkowanego dostarczania sesji zamiast natychmiastowej publikacji w czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić awaryjne użycie kolejki albo końcową awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować wcześniejszy nieaktualny postęp.
    - Dane wyjściowe Tool/toolResult nie są promowane do tekstu wyniku dziecka; wynikiem jest najnowsza widoczna odpowiedź asystenta dziecka.

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
    - Sprawdź, czy Gateway działa 24/7 (bez uśpienia/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` względem strefy czasowej hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja](/pl/automation).

  </Accordion>

  <Accordion title="Cron został uruchomiony, ale nic nie wysłano do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie oczekuje się awaryjnego wysłania przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner również pomija kolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` kontroluje tylko awaryjną ścieżkę runnera
    dla końcowego tekstu, którego agent jeszcze nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron przełączyło modele lub ponowiło próbę raz?">
    To zwykle ścieżka przełączania modelu na żywo, a nie zduplikowane planowanie.

    Izolowany cron może utrwalić przekazanie modelu środowiska uruchomieniowego i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowe nadpisanie profilu uwierzytelniania, cron
    utrwala je również przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu hooka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` przypisany do zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponowień jest ograniczona. Po początkowej próbie plus 2 ponowieniach przełączenia
    cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs Skills dla macOS nie jest dostępny w systemie Linux.
    Przeglądaj Skills na [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Natywne `openclaw skills install` domyślnie zapisuje do katalogu `skills/`
    aktywnego obszaru roboczego. Dodaj `--global`, aby zainstalować w udostępnionym zarządzanym
    katalogu Skills dla wszystkich lokalnych agentów. Zainstaluj osobne CLI `clawhub`
    tylko wtedy, gdy chcesz publikować lub synchronizować własne Skills. Użyj
    `agents.defaults.skills` lub `agents.list[].skills`, jeśli chcesz zawęzić,
    którzy agenci mogą widzieć udostępnione Skills.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub ciągle w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zaplanowanych lub powtarzalnych zadań (utrzymują się po restartach).
    - **Heartbeat** do okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills przeznaczone tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz to ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z Linuksa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja paska menu) i ustaw **Polecenia uruchamiania Node** na „Zawsze pytaj” lub „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie doda to polecenie do listy dozwolonych.

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

    4. Rozpocznij nową sesję, aby migawka Skills została odświeżona.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Dziś nie jest wbudowana.

    Opcje:

    - **Niestandardowy skill / plugin:** najlepszy do niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na awarie.

    Jeśli chcesz utrzymywać kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz zgłoszenie funkcji lub zbuduj skill
    ukierunkowany na te API.

    Zainstaluj Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku udostępnionych Skills dla wszystkich lokalnych agentów użyj `openclaw skills install @owner/<skill-slug> --global` (albo umieść je ręcznie w `~/.openclaw/skills/<name>/SKILL.md`). Jeśli tylko niektórzy agenci powinni widzieć udostępnioną instalację, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew dla Linuksa powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/clawhub).

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

    Ta ścieżka może używać lokalnej przeglądarki hosta lub podłączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na `ref`, nie na selektorach CSS
    - przesyłanie wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). W przypadku konfiguracji specyficznej dla Docker (pełny gateway w Docker lub obrazy sandbox), zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować DM jako prywatne, ale grupy uczynić publicznymi/sandboxowanymi z jednym agentem?">
    Tak - jeśli Twój prywatny ruch to **DM**, a publiczny ruch to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie sandbox, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: osobiste DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa referencja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak powiązać folder hosta z sandboxem?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne i przypisane do agenta wiązania są scalane; wiązania przypisane do agenta są ignorowane, gdy `scope: "shared"`. Użyj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że wiązania omijają ściany systemu plików sandboxa.

    OpenClaw weryfikuje źródła wiązań względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez nadrzędne dowiązania symboliczne nadal kończą się zamknięciem nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a sprawdzenia dozwolonych korzeni nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox vs zasady narzędzi vs podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Starannie opracowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia również **ciche opróżnianie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały zapamiętane?">
    Poproś bota, aby **zapisał fakt do pamięci**. Długoterminowe notatki należą do `MEMORY.md`,
    a krótkoterminowy kontekst trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i utrzymują się, dopóki ich nie usuniesz. Limitem jest
    pamięć masowa, nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać skompaktowane albo ucięte. Dlatego istnieje
    wyszukiwanie w pamięci - przywraca do kontekstu tylko istotne części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie w pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth albo
    logowanie Codex CLI)** nie pomaga przy semantycznym wyszukiwaniu w pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw używa embeddingów OpenAI. Starsze
    konfiguracje, które nadal mają `memorySearch.provider = "auto"`, również rozwiązywane są do OpenAI.
    Jeśli nie ma dostępnego klucza API OpenAI, semantyczne wyszukiwanie w pamięci pozostaje niedostępne
    do czasu skonfigurowania klucza albo jawnego wybrania innego dostawcy.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, zgodne z OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra albo lokalne** -
    szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co im wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i obszar roboczy znajdują się na hoście Gateway
      (`~/.openclaw` + katalog Twojego obszaru roboczego).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz ślad danych:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery kanału.

    Powiązane: [Obszar roboczy agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                         | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import starszego OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny, plikowy ładunek sekretów dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` wyczyszczone)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan dla każdego agenta (agentDir + sesje)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (na agenta)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (na agenta)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **obszar roboczy** (AGENTS.md, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **obszarze roboczym agenta**, nie w `~/.openclaw`.

    - **Obszar roboczy (na agenta)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Główny plik `memory.md` zapisany małymi literami jest tylko wejściem naprawy dla starszej zgodności; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy istnieją oba pliki.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi
      oraz współdzielone Skills (`~/.openclaw/skills`).

    Domyślny obszar roboczy to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa
    obszaru roboczego **hosta Gateway**, a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał to w
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Obszar roboczy agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Czy mogę powiększyć SOUL.md?">
    Tak. `SOUL.md` jest jednym z plików rozruchowych obszaru roboczego wstrzykiwanych do
    kontekstu agenta. Domyślny limit wstrzyknięcia na plik to `20000` znaków,
    a łączny budżet rozruchowy dla wszystkich plików to `60000` znaków.

    Zmień współdzielone wartości domyślne w konfiguracji OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Albo nadpisz ustawienia jednego agenta:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Użyj `/context`, aby sprawdzić rozmiary surowe względem wstrzykniętych oraz czy doszło do ucięcia.
    Utrzymuj `SOUL.md` skupiony na głosie, postawie i osobowości; reguły operacyjne umieszczaj
    w `AGENTS.md`, a trwałe fakty w pamięci.

    Zobacz [Kontekst](/pl/concepts/context) i [Konfiguracja agenta](/pl/gateway/config-agents).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **obszar roboczy agenta** w **prywatnym** repozytorium git i wykonuj jego kopię zapasową w miejscu
    prywatnym (na przykład GitHub private). Obejmuje to pamięć oraz pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego spod `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, wykonuj kopie zapasowe zarówno obszaru roboczego, jak i katalogu stanu
    oddzielnie (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza obszarem roboczym?">
    Tak. Obszar roboczy jest **domyślnym cwd** i kotwicą pamięci, a nie twardą piaskownicą.
    Ścieżki względne są rozwiązywane wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandboxingu dla konkretnego agenta. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; utrzymuj
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

  <Accordion title="Tryb zdalny: gdzie jest magazyn sesji?">
    Stan sesji należy do **hosta Gateway**. Jeśli jesteś w trybie zdalnym, istotny dla Ciebie magazyn sesji znajduje się na zdalnej maszynie, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
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

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Wiązania inne niż loopback **wymagają poprawnej ścieżki uwierzytelniania Gateway**. W praktyce oznacza to:

    - uwierzytelnianie wspólnym sekretem: token albo hasło
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

    - `gateway.remote.token` / `.password` **nie** włączają samodzielnie lokalnego uwierzytelniania Gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalne rozwiązanie awaryjne).
    - Konfiguracje Control UI ze wspólnym sekretem uwierzytelniają się przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania wspólnych sekretów w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` zwrotne proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie Gateway, w tym loopback. W normalnej ścieżce domyślnej oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie Gateway rozwiązuje się do trybu tokena i generuje token tylko na czas działania dla tego uruchomienia, więc **lokalni klienci WS muszą się uwierzytelnić**. Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` albo `OPENCLAW_GATEWAY_PASSWORD`, gdy klienci potrzebują stabilnego sekretu pomiędzy restartami. Blokuje to innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla reverse proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwartego loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, a dla krytycznych wykonuje restart
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

    - `off`: ukrywa tekst sloganu, ale zachowuje wiersz tytułu/wersji banera.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie z sieci)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
    - Grok może ponownie użyć OAuth xAI z uwierzytelniania modelu albo użyć awaryjnie `XAI_API_KEY` / konfiguracji wyszukiwania w sieci Pluginu.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza / jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy środowiskowe:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
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

    Konfiguracja wyszukiwania w sieci specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` nadal tymczasowo się ładują dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja awaryjna pobierania z sieci Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` jest pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego awaryjnego dostawcę pobierania na podstawie dostępnych poświadczeń. Oficjalny Plugin Firecrawl zapewnia ten fallback.
    - Daemony odczytują zmienne env z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji wykonywane przez OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy wykonywane przez OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje start lub hot reload, Gateway zamyka się bezpiecznie albo pomija reload; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą konfigurację, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` albo `config reload skipped (invalid config)`.
    - Obejrzyj najnowszy `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` i `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego payloadu, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki albo kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zostaw tylko do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` przeznaczonego dla agentów z uruchomienia agenta, nadal będzie odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfiguruj](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **node’y** i **agenty**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Node’y (urządzenia):** Maci/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenty (workery):** osobne mózgi/przestrzenie robocze dla specjalnych ról (np. „Hetzner ops”, „Personal data”).
    - **Subagenty:** uruchamiają pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agenty/sesje.

    Dokumentacja: [Node’y](/pl/nodes), [Zdalny dostęp](/pl/gateway/remote), [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenty](/pl/tools/subagents), [TUI](/pl/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać headless?">
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

    Domyślnie jest `false` (z widocznym oknem). Tryb headless częściej uruchamia kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarkę Brave (albo dowolną przeglądarkę opartą na Chromium) i zrestartuj Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne Gatewaye i node’y

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i node’ami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje node’y przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node’a:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node’y nie widzą przychodzącego ruchu od dostawcy; otrzymują tylko wywołania RPC node’ów.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście zawsze włączonym (VPS/serwer domowy).
    2. Umieść host Gateway + swój komputer w tej samej tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Osobny most TCP nie jest wymagany; node’y łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie node’a macOS pozwala na `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i przeczytaj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Node’y](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączone, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanału: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że twoje listy dozwolonych (DM albo grupa) obejmują twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Zdalny dostęp](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale możesz to spiąć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (generyczny):** uruchom skrypt, który wywołuje drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, celując w czat, na którym nasłuchuje drugi bot.
    Jeśli jeden bot jest na zdalnym VPS, skieruj CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Zdalny dostęp](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może dotrzeć do docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych
    kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Zdalny dostęp](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie utrzymuj jeden Gateway i
    używaj wielu agentów lub subagentów.

  </Accordion>

  <Accordion title="Czy korzystanie z węzła na moim osobistym laptopie zamiast SSH z VPS daje jakieś korzyści?">
    Tak - węzły są podstawowym sposobem dostępu do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS albo urządzenie klasy Raspberry Pi; 4 GB RAM to aż nadto), więc częsta
    konfiguracja to zawsze włączony host oraz laptop jako węzeł.

    - **Przychodzące SSH nie jest wymagane.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze sterowanie wykonywaniem.** `system.run` jest ograniczane przez listy dozwolonych węzłów/zatwierdzenia na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host węzła na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH sprawdza się przy doraźnym dostępie do powłoki, ale węzły są prostsze dla stałych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę Gateway?">
    Nie. Na host powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Węzły są urządzeniami peryferyjnymi, które łączą się
    z gatewayem (węzły iOS/Android albo macOS „tryb węzła” w aplikacji paska menu). Dla bezgłowych hostów węzłów
    i sterowania z CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i powierzchni hostowanego pluginu.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC do zastosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobierz bieżący snapshot + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: zweryfikuj + zastąp pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie runtime `gateway` dostępne dla agenta nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ustawia to workspace i ogranicza, kto może wyzwalać bota.

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

  <Accordion title="Jak połączyć węzeł Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Węzły łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tej samej sieci tailnet**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnet).
       Aplikacja zestawi tunel do portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na gatewayu:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [Tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy mam zainstalować na drugim laptopie, czy po prostu dodać węzeł?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **węzeł**. Pozwala to zachować jeden Gateway i uniknąć zdublowanej konfiguracji. Lokalne narzędzia węzłów są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

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
    Zmienne poświadczeń dostawców są wyjątkiem dla workspace `.env`: klucze takie jak
    `GEMINI_API_KEY`, `XAI_API_KEY` lub `MISTRAL_API_KEY` są ignorowane z workspace
    `.env` i powinny znajdować się w środowisku procesu, `~/.openclaw/.env` albo konfiguracji `env`.

    Możesz też definiować zmienne środowiskowe inline w konfiguracji (stosowane tylko, jeśli brakuje ich w środowisku procesu):

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

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały pobrane nawet wtedy, gdy usługa nie dziedziczy środowiska twojej powłoki.
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

    To uruchamia twoją powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje „Shell env: off.” Dlaczego?'>
    `openclaw models status` informuje, czy włączony jest **import środowiska powłoki**. „Shell env: off”
    **nie** oznacza, że brakuje twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska twojej powłoki.
    Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosuje się tylko, jeśli brakuje).

    Następnie zrestartuj gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (również `GH_TOKEN` / `GITHUB_TOKEN`).
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
    wiadomość po okresie bezczynności rozpoczyna świeży identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transkryptów - po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy istnieje sposób na stworzenie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **podagentów**. Możesz utworzyć jednego agenta koordynującego
    oraz kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często jest
    mniej wydajne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    zakładamy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać podagentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został ucięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyjścia narzędzi albo wiele
    plików może wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Przechowuj ważny kontekst w workspace i poproś bota, aby go odczytał.
    - Używaj podagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli dzieje się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale pozostawić go zainstalowanego?">
    Użyj polecenia resetowania:

    ```bash
    openclaw reset
    ```

    Pełny reset bez interakcji:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie uruchom ponownie konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Otrzymuję błędy „context too large” - jak zresetować albo skompaktować?'>
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

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby ograniczać stare wyjścia narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę „LLM request rejected: messages.content.tool_use.input field required”?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij świeżą sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego otrzymuję wiadomości Heartbeat co 30 minut?">
    Heartbeat działa domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je albo wyłącz:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest faktycznie pusty (zawiera tylko puste wiersze,
    komentarze Markdown/HTML, nagłówki Markdown takie jak `# Heading`, znaczniki bloków kodu
    albo puste szkielety checklist), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** możesz wyzwalać odpowiedzi w grupie:

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

    Opcja 2 (jeśli jest już skonfigurowana/dodana do listy dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Bramkowanie wzmianką jest włączone (domyślnie). Musisz @wspomnieć bota (lub dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na liście dozwolonych.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są osobnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile obszarów roboczych i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost danych na dysku:** sesje + transkrypty znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania, obszary robocze i routing kanałów dla poszczególnych agentów.

    Wskazówki:

    - Utrzymuj jeden **aktywny** obszar roboczy na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL lub wpisy magazynu), jeśli dysk rośnie.
    - Używaj `openclaw doctor`, aby znaleźć zbędne obszary robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **routingu wielu agentów**, aby uruchamiać wielu odizolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/rozmówcy. Slack jest obsługiwany jako kanał i może być przypisany do konkretnych agentów.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „może zrobić wszystko, co człowiek” - mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanał(y) Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP albo węzeł, gdy potrzeba.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi dotyczące modeli — wartości domyślne, wybór, aliasy, przełączanie, przełączanie awaryjne, profile uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już działa” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (Control UI, hooki itd.).

    Kolejność pierwszeństwa:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z WebSocket Gateway.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co faktycznie jest przypisane do portu)
    - `Last gateway error:` (częsta główna przyczyna, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracyjny, podczas gdy usługa działa z innym (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Poprawka:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę środowiska uruchomieniowego przez natychmiastowe przypisanie nasłuchiwacza WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli przypisanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Poprawka: zatrzymaj drugą instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` to `local` (albo przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracyjny i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to tylko poświadczenia zdalne po stronie klienta; same nie włączają uwierzytelniania lokalnego Gateway.

  </Accordion>

  <Accordion title='Control UI mówi „unauthorized” (albo ciągle łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą spróbować jednego ograniczonego ponowienia z buforowanym tokenem urządzenia, gdy Gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów przechowywanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć buforowane zakresy.
    - Poza tą ścieżką ponowienia kolejność uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, następnie zapisany token urządzenia, a potem token bootstrap.
    - Wbudowany bootstrap kodu konfiguracji działa tylko dla węzłów. Po zatwierdzeniu zwraca token urządzenia węzła z `scopes: []` i nie zwraca przekazanego tokenu operatora.

    Poprawka:

    - Najszybciej: `openclaw dashboard` (drukuje + kopiuje URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bez ekranu).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowane proxy świadome tożsamości, a nie surowy URL Gateway. Proxy loopback na tym samym hoście wymagają też `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednym ponowieniu, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal problem? Uruchom `openclaw status --all` i wykonaj kroki z [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind tailnet, ale nie może się przypisać i nic nie nasłuchuje">
    Przypisanie `tailnet` wybiera IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma do czego się przypisać.

    Poprawka:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz przypisania wyłącznie do tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów komunikacji i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja obszaru roboczego)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` dla uruchomień ręcznych).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele Gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwsza wiadomość będzie
    ramką `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzono URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyto złego portu lub ścieżki.
    - Proxy albo tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie inne niż Gateway.

    Szybkie poprawki:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

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

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logowania do pliku jest kontrolowany przez `logging.level`. Szczegółowość konsoli jest kontrolowana przez `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/nadzorcy (gdy gateway działa przez launchd/systemd):

    - stdout launchd w macOS: `~/Library/Logs/openclaw/gateway.log` (profile używają `gateway-<profile>.log`; stderr jest wyciszone)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w sekcji [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

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
    Istnieją **trzy tryby instalacji w Windows**:

    **1) Lokalna konfiguracja Windows Hub:** natywna aplikacja zarządza lokalnym Gateway WSL należącym do aplikacji.

    Otwórz **OpenClaw Companion** z menu Start lub zasobnika, a następnie użyj
    **Konfiguracji Gateway** albo karty Połączenia.

    **2) Ręczny Gateway WSL2:** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie zrestartuj:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli usługa nigdy nie została zainstalowana, uruchom ją na pierwszym planie:

    ```bash
    openclaw gateway run
    ```

    **3) Natywny CLI/Gateway Windows:** Gateway działa bezpośrednio w Windows.

    Otwórz PowerShell i uruchom:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz go ręcznie (bez usługi), użyj:

    ```powershell
    openclaw gateway run
    ```

    Dokumentacja: [Windows](/pl/platforms/windows), [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie docierają. Co sprawdzić?">
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
    - WebChat/panel jest otwarty bez właściwego tokena.

    Jeśli jesteś zdalnie, potwierdź, że tunel/połączenie Tailscale działa oraz że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Rozłączono z gateway: brak powodu" - co teraz?'>
    Zwykle oznacza to, że interfejs użytkownika utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest w dobrym stanie? `openclaw status`
    3. Czy interfejs użytkownika ma właściwy token? `openclaw dashboard`
    4. Jeśli jesteś zdalnie, czy połączenie tunelu/Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Panel](/pl/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands kończy się błędem. Co sprawdzić?">
    Zacznij od logów i stanu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Zmniejsz liczbę poleceń pluginu/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzące HTTPS jest dozwolone i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że patrzysz na logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnego wyjścia. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale
    czatu, upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia z ukośnikiem](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli usługa została zainstalowana:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd w macOS, systemd w Linuksie).
    Użyj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz ją na pierwszym planie, zatrzymaj ją za pomocą Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart a openclaw gateway">
    - `openclaw gateway restart`: uruchamia ponownie **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli usługa została zainstalowana, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowo uruchomić ją na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś zawiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik dziennika pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Moja skill wygenerowała obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą używać strukturalnych pól multimediów, takich jak `media`, `mediaUrl`, `path` lub `filePath`. Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie z CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje multimedia wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru providera (obrazy są zmniejszane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ze ścieżek lokalnych do workspace, katalogu tymczasowego/magazynu multimediów i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala strukturalnym lokalnym wysyłkom multimediów używać plików lokalnych hosta, które agent może już odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF, dokumenty Office oraz zweryfikowane dokumenty tekstowe, takie jak Markdown/MD, TXT, JSON, YAML i YML). To nie jest skaner sekretów: możliwy do odczytu przez agenta plik `secret.txt` lub `config.json` może zostać załączony, gdy rozszerzenie i walidacja treści pasują. Trzymaj poufne pliki poza ścieżkami możliwymi do odczytu przez agenta albo pozostaw `tools.fs.workspaceOnly=true`, aby zaostrzyć wysyłanie ze ścieżek lokalnych.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące wiadomości prywatne jest bezpieczne?">
    Traktuj przychodzące wiadomości prywatne jako niezaufane dane wejściowe. Domyślne ustawienia zaprojektowano tak, aby ograniczać ryzyko:

    - Domyślne zachowanie w kanałach obsługujących wiadomości prywatne to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie wiadomości prywatnych wymaga jawnego włączenia (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby ujawnić ryzykowne zasady dotyczące wiadomości prywatnych.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanych treści**, nie tylko tego, kto może wysłać wiadomość prywatną do bota.
    Jeśli asystent czyta zewnętrzne treści (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko występuje, gdy narzędzia są włączone: model może zostać nakłoniony do
    wyeksfiltrowania kontekstu lub wywołania narzędzi w Twoim imieniu. Ogranicz zasięg szkód przez:

    - używanie agenta „czytelnika” tylko do odczytu lub bez narzędzi do streszczania niezaufanych treści
    - wyłączenie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu także jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej, zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy OpenClaw jest mniej bezpieczny, ponieważ używa TypeScript/Node zamiast Rust/WASM?">
    Język i środowisko uruchomieniowe mają znaczenie, ale nie są głównym ryzykiem dla osobistego
    agenta. Praktyczne ryzyka w OpenClaw to wystawienie gateway, to, kto może wysłać wiadomość do
    bota, prompt injection, zakres narzędzi, obsługa poświadczeń, dostęp do przeglądarki, dostęp do exec
    oraz zaufanie do skill lub pluginu firmy trzeciej.

    Rust i WASM mogą zapewnić silniejszą izolację dla niektórych klas kodu, ale
    nie rozwiązują prompt injection, błędnych list dozwolonych, publicznego wystawienia gateway,
    zbyt szerokich narzędzi ani profilu przeglądarki, który jest już zalogowany na poufne
    konta. Traktuj poniższe elementy jako podstawowe mechanizmy kontroli:

    - utrzymuj Gateway jako prywatny lub uwierzytelniony
    - używaj parowania i list dozwolonych dla wiadomości prywatnych i grup
    - odmawiaj lub sandboxuj ryzykowne narzędzia dla niezaufanych danych wejściowych
    - instaluj tylko zaufane pluginy i Skills
    - uruchom `openclaw security audit --deep` po zmianach konfiguracji

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security), [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Widziałem raporty o wystawionych instancjach OpenClaw. Co sprawdzić?">
    Najpierw sprawdź swoje faktyczne wdrożenie:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Bezpieczniejsza baza to:

    - Gateway przypięty do `loopback` albo wystawiony tylko przez uwierzytelniony prywatny
      dostęp, taki jak tailnet, tunel SSH, uwierzytelnianie tokenem/hasłem lub poprawnie
      skonfigurowane zaufane proxy
    - wiadomości prywatne w trybie `pairing` lub `allowlist`
    - grupy na liście dozwolonych i wymagające wzmianki, chyba że każdy członek jest zaufany
    - narzędzia wysokiego ryzyka (`exec`, `browser`, `gateway`, `cron`) odrzucone lub ściśle
      ograniczone dla agentów czytających niezaufane treści
    - sandboxing włączony tam, gdzie wykonywanie narzędzi wymaga mniejszego zasięgu szkód

    Publiczne wiązania bez uwierzytelniania, otwarte wiadomości prywatne/grupy z narzędziami oraz wystawiona
    kontrola przeglądarki to ustalenia do naprawienia w pierwszej kolejności. Szczegóły:
    [Lista kontrolna audytu bezpieczeństwa](/pl/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Czy Skills z ClawHub i pluginy firm trzecich są bezpieczne do instalacji?">
    Traktuj Skills i pluginy firm trzecich jako kod, któremu decydujesz się zaufać.
    Strony Skills w ClawHub pokazują stan skanowania przed instalacją, ale skanowania nie są
    pełną granicą bezpieczeństwa. OpenClaw nie uruchamia wbudowanego lokalnego
    blokowania niebezpiecznego kodu podczas przepływów instalacji/aktualizacji pluginów lub Skills; używaj
    zarządzanej przez operatora polityki `security.installPolicy` do lokalnych decyzji zezwalania/blokowania.

    Bezpieczniejszy wzorzec:

    - preferuj zaufanych autorów i przypięte wersje
    - przeczytaj skill lub plugin przed włączeniem
    - utrzymuj wąskie listy dozwolonych pluginów i Skills
    - uruchamiaj przepływy pracy z niezaufanymi danymi wejściowymi w sandboxie z minimalną liczbą narzędzi
    - unikaj dawania kodowi firm trzecich szerokiego dostępu do systemu plików, exec, przeglądarki lub sekretów

    Szczegóły: [Skills](/pl/tools/skills), [Pluginy](/pl/tools/plugin),
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny adres e-mail, konto GitHub lub numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota za pomocą osobnych kont i numerów telefonu
    zmniejsza zakres szkód, jeśli coś pójdzie nie tak. Ułatwia to również rotację
    poświadczeń lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Przyznaj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerz
    go później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy jest to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi prywatnymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Utrzymuj wiadomości prywatne w **trybie parowania** lub na ścisłej liście dozwolonych.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować wersję roboczą, a następnie **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i trzymaj je odizolowane. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent działa tylko jako czat, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejęcie instrukcji, więc unikaj ich w przypadku agentów z włączonymi narzędziami
    lub podczas odczytywania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj go w piaskownicy. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie otrzymałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    włączone jest `dmPolicy: "pairing"`. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz uzyskać natychmiastowy dostęp, dodaj identyfikator nadawcy do listy dozwolonych lub ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłać wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna polityka wiadomości prywatnych WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne wiadomości prywatne były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli uruchamiasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzymuje”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączono
    **verbose**, **trace** lub **reasoning**.

    Napraw to na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo szumu, sprawdź ustawienia sesji w interfejsie Control UI i ustaw verbose
    na **inherit**. Upewnij się też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i tryb verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    To są wyzwalacze przerwania (nie polecenia z ukośnikiem).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń z ukośnikiem: zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **osobna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa także w treści wiadomości dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wysyłanie wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle wiadomości do Discord, chyba że jawnie na to zezwolisz.

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

    Po edycji konfiguracji uruchom ponownie gateway.

  </Accordion>

  <Accordion title='Dlaczego mam wrażenie, że bot „ignoruje” szybko wysyłane wiadomości?'>
    Monity wysłane w trakcie działania są domyślnie kierowane do aktywnego uruchomienia. Użyj `/queue`, aby wybrać zachowanie aktywnego uruchomienia:

    - `steer` - pokieruj aktywnym uruchomieniem przy następnej granicy modelu
    - `followup` - ustaw wiadomości w kolejce i uruchamiaj je pojedynczo po zakończeniu bieżącego uruchomienia
    - `collect` - ustaw zgodne wiadomości w kolejce i odpowiedz raz po zakończeniu bieżącego uruchomienia
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Domyślny tryb to `steer`. Dla trybów kolejkowanych możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są rozdzielone. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale faktyczny model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) lub otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrażanie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — diagnoza według objawów
