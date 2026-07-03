---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub wsparcia w czasie działania
    - Wstępna klasyfikacja problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i użycia OpenClaw
title: Często zadawane pytania
x-i18n:
    generated_at: "2026-07-03T17:47:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny dev, VPS, wielu agentów, OAuth/klucze API, przełączanie awaryjne modeli). Diagnostyka środowiska uruchomieniowego: zobacz [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełna dokumentacja konfiguracji: zobacz [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś jest zepsute

1. **Szybki status (pierwsze sprawdzenie)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: OS + aktualizacja, osiągalność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe supervisora względem osiągalności RPC, docelowy URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

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

   Jeśli RPC nie działa, użyj zastępczo:

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
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Pyta działający Gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i pierwsza konfiguracja

Pytania i odpowiedzi dla pierwszego uruchomienia — instalacja, onboarding, ścieżki uwierzytelniania, subskrypcje, początkowe awarie —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw, w jednym akapicie?">
    OpenClaw to osobisty asystent AI uruchamiany na Twoich własnych urządzeniach. Odpowiada w używanych już przez Ciebie przestrzeniach komunikacyjnych (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone pluginy kanałów, takie jak QQ Bot), a na obsługiwanych platformach może też obsługiwać głos + aktywny Canvas. **Gateway** to stale działająca płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchomić
    zdolnego asystenta na **Twoim własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    sesjami ze stanem, pamięcią i narzędziami - bez oddawania kontroli nad przepływami pracy hostowanej
    usłudze SaaS.

    Najważniejsze:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i przechowuj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i przełączaniem awaryjnym.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli tego chcesz.
    - **Routing wielu agentów:** osobni agenci dla kanału, konta lub zadania, każdy z własnym
      obszarem roboczym i ustawieniami domyślnymi.
    - **Open source i łatwe modyfikowanie:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prostą stronę statyczną).
    - Przygotuj prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmaila i automatyzuj podsumowania lub działania następcze.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie są pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i wiadomości, które Cię interesują.
    - **Research i redagowanie:** szybki research, podsumowania i pierwsze szkice e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i checklisty sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc z pozyskiwaniem leadów, outreach, reklamami i blogami dla SaaS?">
    Tak dla **researchu, kwalifikacji i redagowania**. Może skanować strony, tworzyć krótkie listy,
    podsumowywać prospektów i pisać szkice outreachu lub tekstów reklamowych.

    Przy **outreachu lub kampaniach reklamowych** zostaw człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw przygotować szkic, a następnie samodzielnie go zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania wewnątrz repo. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + obszar roboczy** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Stale działający Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Node'y** dla lokalnej przeglądarki/ekranu/kamery/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez zostawiania repo w brudnym stanie?">
    Używaj zarządzanych nadpisań zamiast edytować kopię w repo. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (lub dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → wbudowane → `skills.load.extraDirs`, więc zarządzane nadpisania nadal wygrywają z wbudowanymi Skills bez dotykania git. Jeśli skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i steruj widocznością przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny znajdować się w repo i trafiać jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → wbudowane → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli lub ustawień dla różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` per zadanie.
    - **Agenci**: kieruj zadania do osobnych agentów z różnymi domyślnymi modelami, poziomami myślenia i parametrami strumienia.
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

    Umieść współdzielone ustawienia domyślne per model w `agents.defaults.models["provider/model"].params`, a następnie umieść nadpisania specyficzne dla agenta w płaskim `agents.list[].params`. Nie definiuj osobnych zagnieżdżonych wpisów `agents.list[].models["provider/model"].params` dla tego samego modelu; `agents.list[].models` służy do katalogu modeli per agent i nadpisań środowiska uruchomieniowego.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent), [Konfiguracja](/pl/gateway/config-agents) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „spawn a sub-agent for this task”, albo użyj `/subagents`.
    Użyj `/status` w czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt jest problemem, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem w Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby wiadomości uzupełniające w tym wątku pozostały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych działań następczych).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązań.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne zdjęcie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć uruchamianie sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę żądającego:

    - Dostarczanie subagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, gdy istnieje.
    - Jeśli źródło ukończenia niesie tylko kanał, OpenClaw wraca do zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca do kolejkowanego dostarczenia sesji zamiast natychmiastowego publikowania na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić powrót do kolejki albo ostateczną awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładny cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo wycisza ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Dane wyjściowe tool/toolResult nie są promowane do tekstu wyniku dziecka; wynikiem jest najnowsza widoczna odpowiedź asystenta dziecka.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Podagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że Cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
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

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie oczekuje się awaryjnej wysyłki przez mechanizm uruchamiający.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że mechanizm uruchamiający pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że mechanizm uruchamiający próbował dostarczyć wiadomość, ale dane uwierzytelniające ją zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc mechanizm uruchamiający blokuje także zakolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia
    `message`, gdy dostępna jest trasa czatu. `--announce` kontroluje tylko awaryjną
    ścieżkę mechanizmu uruchamiającego dla tekstu końcowego, którego agent jeszcze nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron przełączyło modele lub ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie podwójne planowanie.

    Izolowany Cron może utrwalić przekazanie modelu w czasie wykonywania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, Cron
    także je utrwala przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu z haka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` dla zadania.
    - Następnie każde zapisane nadpisanie modelu sesji Cron.
    - Następnie normalny wybór modelu agenta/domyślnego.

    Pętla ponowień jest ograniczona. Po początkowej próbie oraz 2 ponowieniach przełączenia
    Cron przerywa działanie zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI Cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim obszarze roboczym. Interfejs Skills dla macOS nie jest dostępny w systemie Linux.
    Przeglądaj Skills pod adresem [https://clawhub.ai](https://clawhub.ai).

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
    aktywnego obszaru roboczego. Dodaj `--global`, aby zainstalować w udostępnionym
    zarządzanym katalogu Skills dla wszystkich lokalnych agentów. Zainstaluj osobne CLI `clawhub`
    tylko wtedy, gdy chcesz publikować lub synchronizować własne Skills. Użyj
    `agents.defaults.skills` albo `agents.list[].skills`, jeśli chcesz zawęzić,
    którzy agenci mogą widzieć udostępnione Skills.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** dla zaplanowanych lub cyklicznych zadań (utrzymują się po restartach).
    - **Heartbeat** dla okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja na pasku menu) i ustaw **Polecenia uruchamiania Node** na „Zawsze pytaj” albo „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills za pomocą narzędzia `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - pośrednicz pliki binarne macOS przez SSH (zaawansowane).**
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

    4. Uruchom nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobrał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz zgłoszenie funkcji albo zbuduj Skill
    ukierunkowany na te API.

    Instalowanie Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. Dla Skills udostępnionych wszystkim lokalnym agentom użyj `openclaw skills install @owner/<skill-slug> --global` (albo umieść je ręcznie w `~/.openclaw/skills/<name>/SKILL.md`). Jeśli tylko niektórzy agenci powinni widzieć udostępnioną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis Homebrew Linux FAQ powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/clawhub).

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

    Ta ścieżka może używać lokalnej przeglądarki hosta albo połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - działania są oparte na referencjach, a nie na selektorach CSS
    - przesyłanie wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobierania i działania wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Konfigurację specyficzną dla Docker (pełny Gateway w Docker albo obrazy sandboxu) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalona.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować wiadomości prywatne jako osobiste, ale uczynić grupy publicznymi/sandboxowanymi z jednym agentem?">
    Tak - jeśli Twój ruch prywatny to **wiadomości prywatne (DM)**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie sandboxu, podczas gdy główna sesja wiadomości prywatnych pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach sandboxowanych za pomocą `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: osobiste wiadomości prywatne + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxu?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne i dla agenta są scalane; powiązania dla agenta są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że powiązania omijają ściany systemu plików sandboxu.

    OpenClaw weryfikuje źródła powiązań względem zarówno ścieżki znormalizowanej, jak i ścieżki kanonicznej rozwiązywanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego dowiązaniem symbolicznym nadal kończą się zamknięciem, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox kontra polityka narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia także **ciche opróżnienie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby je zapamiętała?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Warto przypominać modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tej samej
    przestrzeni roboczej przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Przestrzeń robocza agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć trwa wiecznie? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Limitem jest
    pamięć masowa, nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać skompaktowane lub przycięte. Właśnie dlatego
    istnieje wyszukiwanie w pamięci - przywraca do kontekstu tylko istotne części.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie w pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **osadzeń OpenAI**. Codex OAuth obejmuje czat/uzupełnienia i
    **nie** daje dostępu do osadzeń, więc **zalogowanie się przez Codex (OAuth lub
    logowanie Codex CLI)** nie pomaga w semantycznym wyszukiwaniu w pamięci. Osadzenia OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw używa osadzeń OpenAI. Starsze
    konfiguracje, które nadal mają `memorySearch.provider = "auto"`, także rozwiązują się do OpenAI.
    Jeśli klucz API OpenAI nie jest dostępny, semantyczne wyszukiwanie w pamięci pozostaje niedostępne,
    dopóki nie skonfigurujesz klucza lub jawnie nie wybierzesz innego dostawcy.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać osadzeń Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele osadzeń **OpenAI, zgodne z OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra lub lokalne** -
    szczegóły konfiguracji znajdziesz w [Pamięci](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i przestrzeń robocza znajdują się na hoście Gateway
      (`~/.openclaw` + katalog przestrzeni roboczej).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery kanału.

    Powiązane: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                         | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` wyczyszczone)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan dla poszczególnych agentów (agentDir + sesje)                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia i stan rozmów (dla danego agenta)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (dla danego agenta)                                 |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twoja **przestrzeń robocza** (AGENTS.md, pliki pamięci, Skills, itd.) jest oddzielna i konfigurowana przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **przestrzeni roboczej agenta**, a nie w `~/.openclaw`.

    - **Przestrzeń robocza (na agenta)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Główny plik `memory.md` pisany małymi literami jest tylko wejściem starszej naprawy; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślna przestrzeń robocza to `~/.openclaw/workspace`, konfigurowalna przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, potwierdź, że Gateway używa tej samej
    przestrzeni roboczej przy każdym starcie (i pamiętaj: tryb zdalny używa przestrzeni roboczej
    **hosta gateway**, a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz utrwalić zachowanie lub preferencję, poproś bota, aby **zapisał to w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Przestrzeń robocza agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Czy mogę powiększyć SOUL.md?">
    Tak. `SOUL.md` jest jednym z plików startowych przestrzeni roboczej wstrzykiwanych do
    kontekstu agenta. Domyślny limit wstrzykiwania na plik wynosi `20000` znaków,
    a łączny budżet startowy dla plików wynosi `60000` znaków.

    Zmień współdzielone ustawienia domyślne w konfiguracji OpenClaw:

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

    Użyj `/context`, aby sprawdzić rozmiary surowe i wstrzyknięte oraz czy nastąpiło przycięcie.
    Skup `SOUL.md` na głosie, postawie i osobowości; reguły działania umieść
    w `AGENTS.md`, a trwałe fakty w pamięci.

    Zobacz [Kontekst](/pl/concepts/context) i [Konfiguracja agenta](/pl/gateway/config-agents).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swoją **przestrzeń roboczą agenta** w **prywatnym** repozytorium git i twórz jej kopię zapasową w miejscu
    prywatnym (na przykład GitHub private). Obejmuje to pamięć oraz pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego spod `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, wykonaj osobne kopie zapasowe przestrzeni roboczej i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza przestrzenią roboczą?">
    Tak. Przestrzeń robocza jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne rozwiązują się wewnątrz przestrzeni roboczej, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączono sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandboxa dla agenta. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    przestrzeń roboczą oddzielnie, chyba że celowo chcesz, aby agent pracował w niej.

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

    Jeśli pliku brakuje, używa w miarę bezpiecznych wartości domyślnych (w tym domyślnej przestrzeni roboczej `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Powiązania inne niż local loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

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
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się odmową (bez maskowania przez zdalny fallback).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania współdzielonych sekretów w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` zwrotne proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, także dla loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, start gateway rozwiązuje się do trybu tokenu i generuje token tylko na czas tego uruchomienia, więc **lokalni klienci WS muszą się uwierzytelnić**. Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub `OPENCLAW_GATEWAY_PASSWORD`, gdy klienci potrzebują stabilnego sekretu między restartami. Blokuje to innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla reverse proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwartego local loopback, ustaw jawnie `gateway.auth.mode: "none"` w swojej konfiguracji. Doctor może w dowolnym momencie wygenerować token za Ciebie: `openclaw doctor --generate-gateway-token`.

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

    - `off`: ukrywa tekst sloganu, ale zachowuje wiersz tytułu banera i wersji.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie stron)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
    - Grok może ponownie użyć xAI OAuth z uwierzytelniania modelu albo przejść na `XAI_API_KEY` / konfigurację wyszukiwania w sieci Pluginu.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza/może być hostowany samodzielnie; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

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
    Starsze ścieżki dostawcy `tools.web.search.*` nadal są tymczasowo ładowane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja zapasowa web-fetch Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego zapasowego dostawcę pobierania na podstawie dostępnych poświadczeń. Oficjalny Plugin Firecrawl zapewnia tę ścieżkę zapasową.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia sieciowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego problemu?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje uruchamianie albo hot reload, Gateway zamyka się bezpiecznie albo pomija przeładowanie; nie przepisuje `openclaw.json`.
    - `openclaw doctor --fix` odpowiada za naprawę i może przywrócić ostatnią znaną dobrą wersję, zapisując odrzucony plik jako `openclaw.json.clobbered.*`.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Invalid config at`, `Config write rejected:` albo `config reload skipped (invalid config)`.
    - Obejrzyj najnowszy `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Uruchom `openclaw config validate` i `openclaw doctor --fix`.
    - Skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Jeśli nie masz ostatniej znanej dobrej wersji ani odrzuconego ładunku, odtwórz z kopii zapasowej albo ponownie uruchom `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki albo kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów potomnych do dalszego drążenia.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` skierowanego do agenta z przebiegu agenta, nadal odrzuci ono zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurowanie](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze specjalizowanymi workerami na wielu urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) oraz **węzły** i **agenci**:

    - **Gateway (centralny):** odpowiada za kanały (Signal/WhatsApp), routing i sesje.
    - **Węzły (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** osobne mózgi/przestrzenie robocze dla specjalnych ról (np. „Operacje Hetzner”, „Dane osobiste”).
    - **Sub-agenci:** uruchamiaj pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Węzły](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing multi-agent](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [TUI](/pl/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać headless?">
    Tak. To opcja konfiguracyjna:

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

    Wartość domyślna to `false` (z interfejsem graficznym). Tryb headless częściej uruchamia mechanizmy antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scrapowanie, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (albo dowolną przeglądarkę opartą na Chromium) i zrestartuj Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne bramy i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero wtedy wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Węzeł → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu od dostawcy; odbierają tylko wywołania RPC węzła.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście działającym stale (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tym samym tailnecie.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnetu albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł w Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Osobny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie węzła macOS pozwala na `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM albo grupa) zawierają Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-bot”, ale możesz to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, na którym drugi bot
    nasłuchuje. Jeśli jeden bot jest na zdalnym VPS, skieruj swój CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może połączyć się z docelowym Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby oba boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych
    kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów albo sub-agentów.

  </Accordion>

  <Accordion title="Czy korzystanie z node’a na moim osobistym laptopie zamiast SSH z VPS ma jakąś zaletę?">
    Tak - node’y są podstawowym sposobem dostępu do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS lub urządzenie klasy Raspberry Pi wystarczy; 4 GB RAM to aż nadto), więc częsta
    konfiguracja to stale włączony host oraz laptop jako node.

    - **Nie jest wymagane przychodzące SSH.** Node’y łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrolki wykonywania.** `system.run` jest ograniczane przez listy dozwolonych node’ów/akceptacje na tym laptopie.
    - **Więcej narzędzi urządzenia.** Node’y udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez hosta node’a na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH sprawdza się przy doraźnym dostępie do powłoki, ale node’y są prostsze w ciągłych przepływach pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Node’y](/pl/nodes), [CLI node’ów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy node’y uruchamiają usługę Gateway?">
    Nie. Na host powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Node’y to urządzenia peryferyjne, które łączą się
    z gatewayem (node’y iOS/Android albo „tryb node’a” macOS w aplikacji paska menu). W przypadku bezgłowych hostów node’ów
    i sterowania przez CLI zobacz [CLI hosta node’a](/pl/cli/node).

    Pełny restart jest wymagany przy zmianach powierzchni `gateway`, `discovery` i hostowanych pluginów.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC do zastosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji z jego płytkim węzłem schematu, dopasowaną podpowiedzią UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - `config.apply`: zweryfikuj + zastąp pełną konfigurację; przeładowuje na gorąco, gdy to możliwe, i restartuje, gdy jest to wymagane
    - Narzędzie runtime `gateway` dostępne dla agenta nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna rozsądna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia twój obszar roboczy i ogranicza, kto może uruchamiać bota.

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

    Jeśli chcesz korzystać z Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje związany z loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć node Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Node’y łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tej samej sieci tailnet**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (cel SSH może być nazwą hosta tailnet).
       Aplikacja utworzy tunel do portu Gateway i połączy się jako node.
    3. **Zatwierdź node** na gatewayu:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [Tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy tylko dodać node?">
    Jeśli na drugim laptopie potrzebujesz tylko **narzędzi lokalnych** (screen/camera/exec), dodaj go jako
    **node**. Pozwala to zachować jeden Gateway i uniknąć duplikowania konfiguracji. Lokalne narzędzia node’a są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Node’y](/pl/nodes), [CLI node’ów](/pl/cli/nodes), [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.
    Wyjątkiem dla `.env` obszaru roboczego są zmienne poświadczeń dostawców: klucze takie jak
    `GEMINI_API_KEY`, `XAI_API_KEY` lub `MISTRAL_API_KEY` są ignorowane z `.env`
    obszaru roboczego i powinny znajdować się w środowisku procesu, `~/.openclaw/.env` albo `env` konfiguracji.

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
    Dwie typowe poprawki:

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

    To uruchamia twoją powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje „Shell env: off.”. Dlaczego?'>
    `openclaw models status` informuje, czy **import środowiska powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że brakuje twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko, jeśli go brakuje).

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
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Po włączeniu **następna**
    wiadomość po okresie bezczynności rozpoczyna świeży identyfikator sesji dla tego klucza czatu.
    To nie usuwa transkrypcji - po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy da się stworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **subagentów**. Możesz utworzyć jednego agenta koordynatora
    i kilku agentów roboczych z własnymi obszarami roboczymi i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    przewidujemy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać subagentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został przycięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi albo wiele
    plików mogą wywołać Compaction lub obcięcie.

    Co pomaga:

    - Poproś bota, aby podsumował bieżący stan i zapisał go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w obszarze roboczym i poproś bota, aby go odczytał.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
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

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dev; usuwa konfigurację dev + poświadczenia + sesje + obszar roboczy).

  </Accordion>

  <Accordion title='Dostaję błędy „context too large” - jak zresetować albo skompaktować?'>
    Użyj jednej z tych opcji:

    - **Kompaktowanie** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

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
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Poprawka: rozpocznij świeżą sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości Heartbeat co 30 minut?">
    Heartbeat działa domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj lub wyłącz:

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
    komentarze Markdown/HTML, nagłówki Markdown takie jak `# Heading`, znaczniki bloków kodu,
    albo puste szkielety list kontrolnych), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania dla poszczególnych agentów używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** można było wyzwalać odpowiedzi w grupie:

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

    Opcja 2 (jeśli już skonfigurowano/dodano do allowlist): wyświetl listę grup z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Bramka wzmianek jest włączona (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowlist.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do sesji głównej. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są osobnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile obszarów roboczych i agentów mogę utworzyć?">
    Brak twardych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Wzrost użycia dysku:** sesje + transkrypty znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Koszt operacyjny:** profile uwierzytelniania, obszary robocze i routing kanałów dla każdego agenta.

    Wskazówki:

    - Utrzymuj jeden **aktywny** obszar roboczy na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL albo wpisy magazynu), jeśli dysk rośnie.
    - Użyj `openclaw doctor`, aby wykryć zbędne obszary robocze i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **routingu wieloagentowego**, aby uruchamiać wielu odizolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/rozmówcy. Slack jest obsługiwany jako kanał i może być powiązany z konkretnymi agentami.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „może zrobić wszystko, co człowiek” — mechanizmy antybotowe, CAPTCHA i MFA mogą
    nadal blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo użyj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP albo węzeł, gdy jest potrzebna.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Węzły](/pl/nodes).

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

  <Accordion title='Dlaczego openclaw gateway status mówi „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **nadzorcy** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z gateway WebSocket.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez sondę)
    - `Listening:` (co faktycznie jest powiązane na porcie)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa używa innego (często niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę runtime, wiążąc listener WebSocket natychmiast podczas uruchamiania (domyślnie `ws://127.0.0.1:18789`). Jeśli bindowanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny adres URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami opartymi na współdzielonym sekrecie:

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
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmienią.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania gateway.

  </Accordion>

  <Accordion title='Control UI mówi „unauthorized” (albo ciągle łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałej trwałości tokena w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z buforowanym tokenem urządzenia, gdy gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ta ponowna próba z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów zapisanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć buforowane zakresy.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, potem token bootstrap.
    - Wbudowany bootstrap z kodem konfiguracji zwraca token urządzenia węzła z `scopes: []` oraz ograniczony token przekazania operatora dla zaufanego onboardingu mobilnego. Przekazanie operatora może odczytywać natywną konfigurację z czasu konfiguracji, ale nie przyznaje zakresów mutacji parowania ani `operator.admin`.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje + kopiuje adres URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bez monitora).
    - Jeśli nie masz jeszcze tokena: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy adres URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowane proxy świadome tożsamości, a nie surowy adres URL gateway. Proxy loopback na tym samym hoście wymagają też `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niezgodność utrzymuje się po jednej ponownej próbie, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko swoje **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywaniem problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboardzie](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind tailnet, ale nie może się zbindować i nic nie nasłuchuje">
    Bindowanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs nie działa), nie ma do czego się zbindować.

    Naprawa:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz bindowania tylko w tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może obsługiwać wiele kanałów wiadomości i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bota ratunkowego) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja dla instancji)
    - `OPENCLAW_STATE_DIR` (stan dla instancji)
    - `agents.defaults.workspace` (izolacja obszaru roboczego)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Użyj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy uruchomieniach ręcznych).
    - Zainstaluj usługę dla profilu: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwszą wiadomością będzie
    ramka `connect`. Jeśli otrzyma cokolwiek innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Częste przyczyny:

    - Otworzono adres URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyto niewłaściwego portu lub ścieżki.
    - Proxy albo tunel usunął nagłówki uwierzytelniania lub wysłał żądanie inne niż Gateway.

    Szybkie poprawki:

    1. Użyj adresu URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

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
    Logi plikowe (strukturalne):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logowania do pliku kontroluje `logging.level`. Szczegółowość konsoli kontrolują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/nadzorcy (gdy Gateway działa przez launchd/systemd):

    - stdout launchd w macOS: `~/Library/Logs/openclaw/gateway.log` (profile używają `gateway-<profile>.log`; stderr jest wyciszone)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting).

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
    Istnieją **trzy tryby instalacji w Windows**:

    **1) Lokalna konfiguracja Windows Hub:** natywna aplikacja zarządza lokalnym Gateway WSL należącym do aplikacji.

    Otwórz **OpenClaw Companion** z menu Start lub zasobnika, a następnie użyj
    **Konfiguracji Gateway** albo karty Połączenia.

    **2) Ręczny Gateway WSL2:** Gateway działa w Linuksie.

    Otwórz PowerShell, wejdź do WSL, a potem zrestartuj:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli usługa nigdy nie została zainstalowana, uruchom ją na pierwszym planie:

    ```bash
    openclaw gateway run
    ```

    **3) Natywny CLI/Gateway w Windows:** Gateway działa bezpośrednio w Windows.

    Otwórz PowerShell i uruchom:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz go ręcznie (bez usługi), użyj:

    ```powershell
    openclaw gateway run
    ```

    Dokumentacja: [Windows](/pl/platforms/windows), [procedura obsługi usługi Gateway](/pl/gateway).

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

    - Uwierzytelnianie modelu nie jest załadowane na **hoście Gateway** (sprawdź `models status`).
    - Parowanie/lista dozwolonych kanału blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokena.

    Jeśli jesteś zdalnie, potwierdź, że tunel/połączenie Tailscale działa oraz że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Rozłączono z gateway: brak powodu" - co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy łącze tunelu/Tailscale działa?

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

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele pozycji. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre pozycje menu nadal trzeba usunąć. Ogranicz polecenia plugin/skill/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzące HTTPS jest dozwolone i DNS działa dla `api.telegram.org`.

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

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a następnie uruchomić Gateway?">
    Jeśli usługa została zainstalowana:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd w macOS, systemd w Linuksie).
    Użyj tego, gdy Gateway działa w tle jako daemon.

    Jeśli uruchamiasz na pierwszym planie, zatrzymaj za pomocą Ctrl-C, a potem:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [procedura obsługi usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart kontra openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli usługa została zainstalowana, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanałów, routingu modeli i błędów RPC.
  </Accordion>
</AccordionGroup>

## Media i załączniki

<AccordionGroup>
  <Accordion title="Mój skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą używać uporządkowanych pól mediów, takich jak `media`, `mediaUrl`, `path` lub `filePath`. Zobacz [konfigurację asystenta OpenClaw](/pl/start/openclaw) i [wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie z CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane do maks. 2048px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do obszaru roboczego, magazynu temp/media oraz plików zweryfikowanych przez piaskownicę.
    - `tools.fs.workspaceOnly=false` pozwala uporządkowanym wysyłkom lokalnych mediów używać plików lokalnych na hoście, które agent może już odczytać, ale tylko dla mediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF, dokumenty Office oraz zweryfikowane dokumenty tekstowe, takie jak Markdown/MD, TXT, JSON, YAML i YML). To nie jest skaner sekretów: możliwy do odczytu przez agenta plik `secret.txt` lub `config.json` może zostać załączony, gdy rozszerzenie i walidacja treści pasują. Trzymaj pliki wrażliwe poza ścieżkami możliwymi do odczytu przez agenta albo pozostaw `tools.fs.workspaceOnly=true` dla bardziej rygorystycznego wysyłania ścieżek lokalnych.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawianie OpenClaw na przychodzące DM-y jest bezpieczne?">
    Traktuj przychodzące DM-y jako niezaufane dane wejściowe. Domyślne ustawienia są zaprojektowane tak, aby ograniczać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM-y to **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM-ów wymaga jawnego włączenia (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection jest problemem tylko dla publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model może zostać nakłoniony do
    eksfiltracji kontekstu albo wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg skutków przez:

    - używanie agenta „czytającego” tylko do odczytu lub bez narzędzi do streszczania niezaufanej treści
    - pozostawienie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu plików/dokumentów również jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja załączników medialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - piaskownicę i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy OpenClaw jest mniej bezpieczny, ponieważ używa TypeScript/Node zamiast Rust/WASM?">
    Język i środowisko uruchomieniowe mają znaczenie, ale nie są głównym ryzykiem dla osobistego
    agenta. Praktyczne ryzyka OpenClaw to ekspozycja Gateway, kto może wysyłać wiadomości do
    bota, prompt injection, zakres narzędzi, obsługa poświadczeń, dostęp przeglądarki, dostęp exec
    oraz zaufanie do skill lub plugin firm trzecich.

    Rust i WASM mogą zapewniać silniejszą izolację dla niektórych klas kodu, ale
    nie rozwiązują prompt injection, złych list dozwolonych, publicznej ekspozycji Gateway,
    zbyt szerokich narzędzi ani profilu przeglądarki, który jest już zalogowany na wrażliwe
    konta. Traktuj je jako podstawowe mechanizmy kontroli:

    - utrzymuj Gateway jako prywatny lub uwierzytelniony
    - używaj parowania i list dozwolonych dla DM-ów i grup
    - odmawiaj ryzykownym narzędziom lub uruchamiaj je w piaskownicy dla niezaufanych danych wejściowych
    - instaluj tylko zaufane pluginy i skills
    - uruchom `openclaw security audit --deep` po zmianach konfiguracji

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security), [Piaskownica](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Widziałem zgłoszenia o wystawionych instancjach OpenClaw. Co sprawdzić?">
    Najpierw sprawdź swoje rzeczywiste wdrożenie:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Bezpieczniejsza baza to:

    - Gateway powiązany z `loopback` albo wystawiony tylko przez uwierzytelniony prywatny
      dostęp, taki jak tailnet, tunel SSH, uwierzytelnianie tokenem/hasłem albo poprawnie
      skonfigurowane zaufane proxy
    - DM-y w trybie `pairing` lub `allowlist`
    - grupy na liście dozwolonych i ograniczone wymogiem wzmianki, chyba że każdy członek jest zaufany
    - narzędzia wysokiego ryzyka (`exec`, `browser`, `gateway`, `cron`) odrzucone lub ściśle
      ograniczone dla agentów czytających niezaufaną treść
    - piaskownica włączona tam, gdzie wykonywanie narzędzi potrzebuje mniejszego zasięgu skutków

    Publiczne powiązania bez uwierzytelniania, otwarte DM-y/grupy z narzędziami oraz wystawiona
    kontrola przeglądarki to problemy do naprawienia w pierwszej kolejności. Szczegóły:
    [Lista kontrolna audytu bezpieczeństwa](/pl/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Czy skills z ClawHub i pluginy firm trzecich są bezpieczne do instalacji?">
    Traktuj skills i pluginy firm trzecich jako kod, któremu decydujesz się zaufać.
    Strony skills w ClawHub pokazują stan skanowania przed instalacją, ale skany nie są
    kompletną granicą bezpieczeństwa. OpenClaw nie uruchamia wbudowanego lokalnego
    blokowania niebezpiecznego kodu podczas przepływów instalacji/aktualizacji plugin lub skill; używaj
    należącego do operatora `security.installPolicy` do lokalnych decyzji o zezwalaniu/blokowaniu.

    Bezpieczniejszy wzorzec:

    - preferuj zaufanych autorów i przypięte wersje
    - przeczytaj skill lub plugin przed jego włączeniem
    - utrzymuj wąskie listy dozwolonych dla pluginów i skills
    - uruchamiaj przepływy z niezaufanymi danymi wejściowymi w piaskownicy z minimalnym zestawem narzędzi
    - unikaj nadawania kodowi firm trzecich szerokiego dostępu do systemu plików, exec, przeglądarki lub sekretów

    Szczegóły: [Skills](/pl/tools/skills), [Pluginy](/pl/tools/plugin),
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny adres e-mail, konto GitHub lub numer telefonu?">
    Tak, w przypadku większości konfiguracji. Odizolowanie bota przez osobne konta i numery telefonów
    zmniejsza zakres szkód, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    danych uwierzytelniających lub cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerzaj
    go później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy jest to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi wiadomościami osobistymi. Najbezpieczniejszy wzorzec to:

    - Utrzymuj wiadomości prywatne w **trybie parowania** lub na ścisłej liście dozwolonych.
    - Użyj **osobnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować wersję roboczą, a potem **zatwierdź ją przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent obsługuje wyłącznie czat, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przechwycenie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    lub podczas odczytywania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, ogranicz
    narzędzia i uruchamiaj go w piaskownicy. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie otrzymałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    włączone jest `dmPolicy: "pairing"`. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące prośby:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisać do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna polityka wiadomości prywatnych WhatsApp to **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzyma, albo na jawne wysyłki, które uruchomisz.

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
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączono
    tryb **szczegółowy**, **śledzenie** lub **rozumowanie**.

    Napraw to na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo komunikatów, sprawdź ustawienia sesji w Control UI i ustaw tryb szczegółowy
    na **dziedziczony**. Upewnij się też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i tryb szczegółowy](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    To są wyzwalacze przerwania (nie polecenia z ukośnikiem).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń z ukośnikiem: zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (takich jak `/status`) działa również w treści wiadomości dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? („Odmowa obsługi wiadomości między kontekstami”)'>
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

    Po edycji konfiguracji uruchom ponownie Gateway.

  </Accordion>

  <Accordion title='Dlaczego wydaje się, że bot „ignoruje” szybko wysyłane wiadomości?'>
    Monity w trakcie uruchomienia są domyślnie kierowane do aktywnego uruchomienia. Użyj `/queue`, aby wybrać zachowanie aktywnego uruchomienia:

    - `steer` - prowadź aktywne uruchomienie przy następnej granicy modelu
    - `followup` - kolejkowanie wiadomości i uruchamianie ich pojedynczo po zakończeniu bieżącego uruchomienia
    - `collect` - kolejkowanie zgodnych wiadomości i jedna odpowiedź po zakończeniu bieżącego uruchomienia
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Domyślny tryb to `steer`. Dla trybów kolejkowanych możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize`. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw dane uwierzytelniające i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty domyślny model to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć danych uwierzytelniających Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal nie możesz rozwiązać problemu? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — triage według objawów
