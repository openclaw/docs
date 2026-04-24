---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji początkowej, instalacji, onboardingu lub działania w runtime
    - Triaging problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Najczęściej zadawane pytania dotyczące konfiguracji początkowej, konfiguracji i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-24T09:14:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Szybkie odpowiedzi oraz głębsze wskazówki do rozwiązywania problemów dla rzeczywistych konfiguracji (lokalny development, VPS, wiele agentów, OAuth/klucze API, model failover). Diagnostykę runtime znajdziesz w [Troubleshooting](/pl/gateway/troubleshooting). Pełne odwołanie do konfiguracji znajdziesz w [Configuration](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś nie działa

1. **Szybki status (pierwsze sprawdzenie)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, osiągalność gateway/usługi, agenci/sesje, konfiguracja dostawców + problemy runtime (gdy gateway jest osiągalny).

2. **Raport gotowy do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logów (tokeny zredagowane).

3. **Stan daemona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje runtime supervisora vs osiągalność RPC, docelowy URL probe i to, której konfiguracji usługa prawdopodobnie użyła.

4. **Głębokie proby**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną probę kondycji gateway, w tym proby kanałów, gdy są obsługiwane
   (wymaga osiągalnego gateway). Zobacz [Health](/pl/gateway/health).

5. **Śledzenie najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj fallbacku:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logging](/pl/logging) i [Troubleshooting](/pl/gateway/troubleshooting).

6. **Uruchom doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Prosi działający gateway o pełną migawkę (tylko WS). Zobacz [Health](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacja, onboarding, ścieżki uwierzytelniania, subskrypcje, początkowe błędy —
znajdziesz w [First-run FAQ](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw, w jednym akapicie?">
    OpenClaw to osobisty asystent AI uruchamiany na własnych urządzeniach. Odpowiada na używanych już przez Ciebie powierzchniach komunikacyjnych (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączonych Pluginach kanałów, takich jak QQ Bot) i może też obsługiwać głos + działający na żywo Canvas na obsługiwanych platformach. **Gateway** to zawsze aktywna warstwa sterowania; produktem jest sam asystent.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna warstwa sterowania przede wszystkim**, która pozwala uruchamiać
    zdolnego asystenta na **własnym sprzęcie**, dostępnego z używanych już aplikacji czatowych, z
    sesjami stanowymi, pamięcią i narzędziami — bez oddawania kontroli nad przepływami pracy hostowanemu
    SaaS.

    Najważniejsze elementy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS) i trzymaj
      przestrzeń roboczą + historię sesji lokalnie.
    - **Prawdziwe kanały, a nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus mobilny głos i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i failover.
    - **Opcja wyłącznie lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli tego chcesz.
    - **Routing wielu agentów:** oddzielni agenci per kanał, konto lub zadanie, każdy z własną
      przestrzenią roboczą i ustawieniami domyślnymi.
    - **Open source i możliwość modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Channels](/pl/channels), [Multi-agent](/pl/concepts/multi-agent),
    [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem(-am) — co powinienem/powinnam zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbudować stronę internetową (WordPress, Shopify lub prostą statyczną stronę).
    - Stworzyć prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkować pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Podłączyć Gmail i zautomatyzować podsumowania lub działania następcze.

    Potrafi obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na fazy i
    użyjesz podagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i ważnych dla Ciebie wiadomości.
    - **Research i szkice:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i checklisty sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway wykonać je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc przy lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia szkiców**. Potrafi skanować strony, budować krótkie listy,
    podsumowywać potencjalnych klientów i pisać szkice outreachu lub tekstów reklamowych.

    W przypadku **outreachu lub uruchamiania reklam** zachowaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to taki, w którym
    OpenClaw przygotowuje szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu aplikacji webowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania wewnątrz repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + przestrzeń robocza** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramowanie, hooki)
    - **Zawsze aktywny Gateway** (uruchomiony na VPS, dostępny z dowolnego miejsca)
    - **Node** do lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez utrzymywania brudnego repozytorium?">
    Używaj zarządzanych nadpisań zamiast edytować kopię z repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Pierwszeństwo to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają pierwszeństwo nad dołączonymi Skills bez dotykania gita. Jeśli Skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` i `agents.list[].skills`. Tylko zmiany warte wysłania upstream powinny trafiać do repozytorium i wychodzić jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższe pierwszeństwo). Domyślne pierwszeństwo to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` instaluje domyślnie do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli Skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: odizolowane zadania mogą ustawiać nadpisanie `model` per zadanie.
    - **Podagenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Cron jobs](/pl/automation/cron-jobs), [Multi-Agent Routing](/pl/concepts/multi-agent) i [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się przy ciężkiej pracy. Jak to odciążyć?">
    Używaj **podagentów** do długich lub równoległych zadań. Podagenci działają w swojej własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, by „uruchomił podagenta do tego zadania” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i podagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla podagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje podagentów związane z wątkiem na Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z podagentem lub celem sesji, aby kolejne wiadomości w tym wątku pozostawały na tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn`, używając `thread: true` (i opcjonalnie `mode: "session"` dla trwałych działań następczych).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby sterować automatycznym odwiązywaniem.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Domyślne ustawienia globalne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne wiązanie przy uruchamianiu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Discord](/pl/channels/discord), [Configuration Reference](/pl/gateway/configuration-reference), [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Podagent zakończył pracę, ale aktualizacja o zakończeniu trafiła w złe miejsce albo w ogóle się nie pojawiła. Co sprawdzić?">
    Najpierw sprawdź rozstrzygniętą trasę żądającego:

    - Dostarczanie zakończenia podagenta w trybie completion preferuje dowolny powiązany wątek lub trasę rozmowy, jeśli istnieje.
    - Jeśli źródło zakończenia niesie tylko kanał, OpenClaw używa fallbacku do zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik użyje fallbacku do dostarczenia przez kolejkę sesji zamiast natychmiastowego opublikowania na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymuszać fallback do kolejki albo końcową porażkę dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Jeśli dziecko przekroczyło limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Background Tasks](/pl/automation/tasks), [Session Tools](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron albo przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że Cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` vs strefa hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Automation & Tasks](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać fallbackowego wysłania przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczenie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć, ale poświadczenia to zablokowały.
    - Cichy wynik odizolowany (`NO_REPLY` / `no_reply` tylko) jest traktowany jako celowo nienadający się do dostarczenia, więc runner tłumi też fallbackowe dostarczenie przez kolejkę.

    W przypadku odizolowanych zadań Cron agent nadal może wysyłać bezpośrednio narzędziem `message`,
    gdy dostępna jest trasa czatu. `--announce` steruje tylko fallbackową ścieżką runnera
    dla końcowego tekstu, którego agent jeszcze sam nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego odizolowane uruchomienie Cron przełączyło modele albo ponowiło próbę raz?">
    To zwykle ścieżka przełączania modelu na żywo, a nie zduplikowane planowanie.

    Odizolowany Cron może utrwalić przekazanie modelu w runtime i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowieniem.

    Powiązane reguły wyboru:

    - Najpierw wygrywa nadpisanie modelu hooka Gmail, jeśli ma zastosowanie.
    - Następnie `model` per zadanie.
    - Następnie dowolne zapisane nadpisanie modelu sesji Cron.
    - Następnie zwykły wybór modelu agenta/dom yślnego.

    Pętla ponawiania jest ograniczona. Po początkowej próbie plus 2 ponowieniach przełączenia
    Cron przerywa działanie zamiast zapętlać się w nieskończoność.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [cron CLI](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak instalować Skills w Linux?">
    Używaj natywnych poleceń `openclaw skills` lub wrzucaj Skills do swojej przestrzeni roboczej. Interfejs Skills dla macOS nie jest dostępny w Linux.
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

    Natywne `openclaw skills install` zapisuje do aktywnego katalogu `skills/` przestrzeni roboczej. Instaluj osobne CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. Dla współdzielonych instalacji między agentami umieść Skill pod
    `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Używaj harmonogramu Gateway:

    - **Zadania Cron** dla zadań planowanych lub cyklicznych (utrwalane po restartach).
    - **Heartbeat** dla okresowych sprawdzeń „głównej sesji”.
    - **Zadania odizolowane** dla autonomicznych agentów publikujących podsumowania lub dostarczających wyniki do czatów.

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Automation & Tasks](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać apple macOS-only Skills z Linux?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` plus wymagane binaria, a Skills pojawiają się w promptcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W Linux Skills tylko dla `darwin` (jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A — uruchom Gateway na Mac (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a potem łącz się z Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B — użyj Node macOS (bez SSH).**
    Uruchom Gateway na Linux, sparuj Node macOS (aplikacja paska menu) i ustaw **Node Run Commands** na „Always Ask” lub „Always Allow” na Mac. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binaria istnieją na Node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w monicie doda to polecenie do listy dozwolonych.

    **Opcja C — proxy binariów macOS przez SSH (zaawansowane).**
    Pozostaw Gateway na Linux, ale spraw, aby wymagane binaria CLI były rozstrzygane do wrapperów SSH uruchamianych na Mac. Następnie nadpisz Skill, aby dopuścić Linux i utrzymać jego kwalifikowalność.

    1. Utwórz wrapper SSH dla binarnego pliku (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (workspace lub `~/.openclaw/skills`), aby dopuścić Linux:

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
    Dziś nie jest wbudowana.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze do niezawodnego dostępu do API (Notion i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz zachować kontekst per klient (przepływy agencyjne), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywną integrację, otwórz prośbę o funkcję albo zbuduj Skill
    kierowany do tych API.

    Instalacja Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnej przestrzeni roboczej. Dla współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują binariów instalowanych przez Homebrew; w Linux oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który dołącza się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz niestandardową nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo podłączonego Node przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host Node na maszynie przeglądarki albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na ref, a nie na selektorach CSS
    - wysyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje tylko jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobna dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Konfigurację specyficzną dla Dockera (pełny Gateway w Docker lub obrazy sandboxa) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Dla pełniejszej konfiguracji:

    - Utrwal `/home/node` przez `OPENCLAW_HOME_VOLUME`, aby cache przetrwały.
    - Wypiecz zależności systemowe do obrazu przez `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne DM, ale uczynić grupy publicznymi/sandboxowanymi przy użyciu jednego agenta?">
    Tak — jeśli Twój ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grupowe/kanałowe (klucze nie-main) działały w skonfigurowanym backendzie sandboxa, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz, które narzędzia są dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Instrukcja konfiguracji + przykład: [Groups: personal DMs + public groups](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Odwołanie do kluczowej konfiguracji: [Gateway configuration](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne + per-agent binds są scalane; binds per agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego wrażliwego i pamiętaj, że binds omijają ściany systemu plików sandboxa.

    OpenClaw waliduje źródła bind zarówno względem ścieżki znormalizowanej, jak i ścieżki kanonicznej rozstrzygniętej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez nadrzędne symlinki nadal kończą się bezpieczną odmową, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonych katalogów głównych nadal obowiązują po rozstrzygnięciu symlinków.

    Przykłady i uwagi dotyczące bezpieczeństwa znajdziesz w [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) i [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w przestrzeni roboczej agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia także **cichy flush pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Dzieje się to tylko wtedy, gdy przestrzeń robocza
    jest zapisywalna (sandboxy tylko do odczytu to pomijają). Zobacz [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafiać do `MEMORY.md`,
    a kontekst krótkoterminowy do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi o zapisywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tej samej
    przestrzeni roboczej przy każdym uruchomieniu.

    Dokumentacja: [Memory](/pl/concepts/memory), [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć pozostaje na zawsze? Jakie są limity?">
    Pliki pamięci żyją na dysku i pozostają, dopóki ich nie usuniesz. Limitem jest
    miejsce na dysku, a nie model. **Kontekst sesji** jest jednak nadal ograniczony przez
    okno kontekstu modelu, więc długie rozmowy mogą być kompaktowane lub przycinane. Właśnie dlatego
    istnieje wyszukiwanie pamięci — przywraca do kontekstu tylko odpowiednie fragmenty.

    Dokumentacja: [Memory](/pl/concepts/memory), [Context](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy wyszukiwanie semantyczne pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/completions i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth lub
    logowanie przez CLI Codex)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybiera dostawcę, gdy
    potrafi rozstrzygnąć klucz API (profile uwierzytelniania, `models.providers.*.apiKey` lub zmienne env).
    Preferuje OpenAI, jeśli rozstrzygnie klucz OpenAI, w przeciwnym razie Gemini, jeśli
    rozstrzygnie klucz Gemini, następnie Voyage, a potem Mistral. Jeśli nie ma dostępnego zdalnego klucza,
    wyszukiwanie pamięci pozostaje wyłączone do czasu jego skonfigurowania. Jeśli masz skonfigurowaną i obecną
    ścieżkę modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local**
    — szczegóły konfiguracji znajdziesz w [Memory](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, konfiguracja i przestrzeń robocza znajdują się na hoście Gateway
      (`~/.openclaw` + katalog przestrzeni roboczej).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na
      swoich serwerach.
    - **Ty kontrolujesz ślad:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanałowy
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Agent workspace](/pl/concepts/agent-workspace), [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Cel                                                                |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Opcjonalny ładunek sekretu oparty na pliku dla dostawców SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Starszy plik zgodności (statyczne wpisy `api_key` są czyszczone)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Historia rozmów i stan (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadane sesji (per agent)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twoja **przestrzeń robocza** (`AGENTS.md`, pliki pamięci, Skills itd.) jest oddzielna i konfigurowana przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **przestrzeni roboczej agenta**, a nie w `~/.openclaw`.

    - **Przestrzeń robocza (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Małe litery w głównym katalogu `memory.md` to tylko starsze dane wejściowe do naprawy; `openclaw doctor --fix`
      może scalić je do `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi,
      oraz współdzielone Skills (`~/.openclaw/skills`).

    Domyślna przestrzeń robocza to `~/.openclaw/workspace`, konfigurowana przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tej samej
    przestrzeni roboczej przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa **przestrzeni roboczej hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał to do
    AGENTS.md lub MEMORY.md** zamiast polegać na historii czatu.

    Zobacz [Agent workspace](/pl/concepts/agent-workspace) i [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swoją **przestrzeń roboczą agenta** w **prywatnym** repozytorium git i wykonuj jej kopię zapasową w
    prywatnym miejscu (na przykład GitHub private). Pozwala to przechwycić pamięć + pliki AGENTS/SOUL/USER
    i później przywrócić „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego przywrócenia, wykonaj kopię zapasową zarówno przestrzeni roboczej, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Uninstall](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza przestrzenią roboczą?">
    Tak. Przestrzeń robocza to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne są rozstrzygane wewnątrz przestrzeni roboczej, ale ścieżki bezwzględne mogą uzyskać dostęp do innych
    lokalizacji hosta, chyba że włączony jest sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandboxa per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, ustaw `workspace`
    tego agenta na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    przestrzeń roboczą osobno, chyba że celowo chcesz, by agent działał wewnątrz niego.

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
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, interesujący Cię magazyn sesji znajduje się na zdalnej maszynie, a nie na Twoim lokalnym laptopie. Zobacz [Session management](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używa dość bezpiecznych ustawień domyślnych (w tym domyślnej przestrzeni roboczej `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem(-am) gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI pokazuje unauthorized'>
    Powiązania nie-loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie współdzielonym sekretem: token lub hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym nie-loopback proxy odwrotnym świadomym tożsamości

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

    - `gateway.remote.token` / `.password` same w sobie **nie** włączają lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` plus `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozstrzygnięte, rozstrzyganie kończy się bezpiecznym zamknięciem (bez maskującego zdalnego fallbacku).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania współdzielonych sekretów w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` proxy odwrotne loopback na tym samym hoście nadal **nie** spełniają uwierzytelniania trusted-proxy. Zaufane proxy musi być skonfigurowanym źródłem nie-loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie egzekwuje uwierzytelnianie gateway, także na loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, start gateway rozstrzyga się do trybu tokenu i automatycznie go generuje, zapisując do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelniać**. Blokuje to innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (lub, dla nie-loopback proxy odwrotnych świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwartego loopbacka, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy po zmianie konfiguracji muszę restartować?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, dla krytycznych wykonuje restart
    - obsługiwane są także `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Jak wyłączyć zabawne tagline CLI?">
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

    - `off`: ukrywa tekst tagline, ale zachowuje wiersz tytułu/wersji bannera.
    - `default`: zawsze używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe tagline (domyślne zachowanie).
    - Jeśli nie chcesz żadnego bannera, ustaw env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć web search (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają zwykłej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza / może być self-hosted; skonfiguruj `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy oparte na zmiennych środowiskowych:

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
              provider: "firecrawl", // opcjonalne; pomiń dla automatycznego wykrywania
            },
          },
        },
    }
    ```

    Konfiguracja web search specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` są nadal tymczasowo ładowane dla zgodności, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja fallbacku web fetch dla Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` lub `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostanie jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` jest pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę fallbacku fetch na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Daemony odczytują zmienne env z `~/.openclaw/.env` (lub ze środowiska usługi).

    Dokumentacja: [Web tools](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyścił moją konfigurację. Jak to odzyskać i jak tego unikać?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, wszystko
    inne zostanie usunięte.

    Obecnie OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje start lub hot reload, Gateway przywraca ostatnią dobrą konfigurację i zapisuje odrzucony plik jako `openclaw.json.clobbered.*`.
    - Główny agent otrzymuje ostrzeżenie przy starcie po odzyskaniu, aby nie zapisał ponownie ślepo złej konfiguracji.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Config auto-restored from last-known-good`, `Config write rejected:` lub `config reload restored last-known-good config`.
    - Sprawdź najnowszy `openclaw.json.clobbered.*` lub `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Zachowaj aktywną przywróconą konfigurację, jeśli działa, a następnie skopiuj z powrotem tylko zamierzone klucze przez `openclaw config set` lub `config.patch`.
    - Uruchom `openclaw config validate` i `openclaw doctor`.
    - Jeśli nie masz ostatniej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i skonfiguruj kanały/modele od nowa.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent coding często potrafi odtworzyć działającą konfigurację z logów lub historii.

    Jak tego unikać:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw używaj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego drążenia.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` tylko do pełnej wymiany konfiguracji.
    - Jeśli używasz narzędzia runtime `gateway`, dostępnego tylko dla właściciela, z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/pl/cli/config), [Configure](/pl/cli/configure), [Gateway troubleshooting](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway z wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **Node** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Node (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workerzy):** oddzielne „mózgi”/przestrzenie robocze dla wyspecjalizowanych ról (np. „Hetzner ops”, „Dane osobiste”).
    - **Podagenci:** uruchamiają pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Remote access](/pl/gateway/remote), [Multi-Agent Routing](/pl/concepts/multi-agent), [Sub-agents](/pl/tools/subagents), [TUI](/pl/web/tui).

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

    Domyślnie jest `false` (tryb z interfejsem). Tryb headless częściej uruchamia kontrole antybotowe na niektórych stronach. Zobacz [Browser](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (jeśli potrzebujesz obrazu, użyj zrzutów ekranu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antyboty).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarny plik Brave (lub dowolnej przeglądarki opartej na Chromium) i uruchom ponownie Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Browser](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gatewaye i Node

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i Node?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje Node przez **Gateway WebSocket**, gdy potrzebne jest narzędzie Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node nie widzą ruchu przychodzącego od dostawców; otrzymują tylko wywołania RPC Node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako Node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze aktywnym hoście (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tej samej sieci tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (bind tailnet lub tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (lub bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako Node.
    5. Zatwierdź Node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nie jest wymagany osobny most TCP; Node łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie Node macOS pozwala na `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przejrzyj [Security](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Gateway protocol](/pl/gateway/protocol), [macOS remote mode](/pl/platforms/mac/remote), [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest poprawnie ustawione.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM lub grupa) zawierają Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Remote access](/pl/gateway/remote), [Channels](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech bot A wyśle wiadomość do bota B, a potem bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, celując w czat, na którym drugi bot
    nasłuchuje. Jeśli jeden bot działa na zdalnym VPS, skieruj swoje CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Remote access](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchamiany z maszyny, która może osiągnąć docelowy Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych kanałów lub reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Remote access](/pl/gateway/remote), [Agent CLI](/pl/cli/agent), [Agent send](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, z których każdy ma własną przestrzeń roboczą, domyślne modele
    i routing. To jest typowa konfiguracja i jest znacznie tańsze oraz prostsze niż uruchamianie
    jednego VPS-a na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie utrzymuj jeden Gateway i
    używaj wielu agentów lub podagentów.

  </Accordion>

  <Accordion title="Czy używanie Node na moim osobistym laptopie daje korzyści względem SSH z VPS?">
    Tak — Node to podstawowy sposób dotarcia do laptopa ze zdalnego Gateway, a do tego
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS lub maszyna klasy Raspberry Pi; 4 GB RAM w zupełności wystarczy), więc typową
    konfiguracją jest zawsze aktywny host plus Twój laptop jako Node.

    - **Nie wymaga przychodzącego SSH.** Node łączą się wychodząco z Gateway WebSocket i używają pairingu urządzenia.
    - **Bezpieczniejsze sterowanie wykonywaniem.** `system.run` jest ograniczone listami dozwolonych/zatwierdzeniami Node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Node udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host Node na laptopie albo dołącz do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale Node są prostsze dla stałych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/pl/cli/nodes), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy Node uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na hoście, chyba że celowo uruchamiasz odizolowane profile (zobacz [Multiple gateways](/pl/gateway/multiple-gateways)). Node to urządzenia peryferyjne, które łączą
    się z gateway (Node iOS/Android albo tryb „node mode” macOS w aplikacji paska menu). Informacje o bezgłowych
    hostach Node i sterowaniu CLI znajdziesz w [Node host CLI](/pl/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); wykonuje hot-reload, gdy to możliwe, i restart, gdy wymagane
    - `config.apply`: waliduje + zastępuje pełną konfigurację; wykonuje hot-reload, gdy to możliwe, i restart, gdy wymagane
    - Narzędzie runtime `gateway`, dostępne tylko dla właściciela, nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia przestrzeń roboczą i ogranicza, kto może wyzwalać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z mojego Mac?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na swoim Mac**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje powiązany z loopback i jest wystawiany przez HTTPS za pośrednictwem Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć Node Mac ze zdalnym Gateway (Tailscale Serve)?">
    Serve wystawia **Gateway Control UI + WS**. Node łączą się przez ten sam punkt końcowy Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tym samym tailnet**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (cel SSH może być nazwą hosta tailnet).
       Aplikacja tuneluje port Gateway i łączy się jako Node.
    3. **Zatwierdź Node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Gateway protocol](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [macOS remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem/powinnam instalować na drugim laptopie, czy po prostu dodać Node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (ekran/kamera/exec) na drugim laptopie, dodaj go jako
    **Node**. Pozwala to zachować jeden Gateway i uniknąć duplikowania konfiguracji. Lokalne narzędzia Node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** lub dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/pl/cli/nodes), [Multiple gateways](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne env i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne env z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny fallback `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych env.

    Możesz też definiować zmienne env inline w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełne informacje o pierwszeństwie i źródłach znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem(-am) Gateway przez usługę i moje zmienne env zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały pobrane nawet wtedy, gdy usługa nie dziedziczy env z Twojej powłoki.
    2. Włącz import z powłoki (wygodna funkcja typu opt-in):

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

    To uruchamia Twoją powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem(-am) COPILOT_GITHUB_TOKEN, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` raportuje, czy **import env z powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że Twoich zmiennych env brakuje — oznacza tylko, że OpenClaw nie będzie
    automatycznie ładował Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy Twojego środowiska
    powłoki. Napraw to w jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko wtedy, gdy go brakuje).

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
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Session management](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale ta funkcja jest **domyślnie wyłączona** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transkryptów — po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy jest sposób na zbudowanie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wielu agentów** i **podagentów**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów roboczych z własnymi przestrzeniami roboczymi i modelami.

    To powiedziawszy, najlepiej traktować to jako **zabawny eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    przewidujemy, to jeden bot, z którym rozmawiasz, z różnymi sesjami dla pracy równoległej. Ten
    bot może też uruchamiać podagentów, gdy to potrzebne.

    Dokumentacja: [Multi-agent routing](/pl/concepts/multi-agent), [Sub-agents](/pl/tools/subagents), [Agents CLI](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został przycięty w środku zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików mogą wywołać Compaction albo przycięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami i `/new` przy zmianie tematu.
    - Przechowuj ważny kontekst w przestrzeni roboczej i poproś bota o jego ponowne odczytanie.
    - Używaj podagentów do długiej lub równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli zdarza się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zachować go zainstalowanego?">
    Użyj polecenia reset:

    ```bash
    openclaw reset
    ```

    Pełny reset nieinteraktywny:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie uruchom ponownie konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używałeś(-aś) profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie są to `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dla dev; czyści konfigurację dev + poświadczenia + sesje + przestrzeń roboczą).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" — jak zresetować albo wykonać compaction?'>
    Użyj jednej z tych opcji:

    - **Compaction** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli to się powtarza:

    - Włącz lub dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby usuwać stare wyniki narzędzi.
    - Używaj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Session pruning](/pl/concepts/session-pruning), [Session management](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij świeżą sesję przez `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości Heartbeat co 30 minut?">
    Heartbeat uruchamiają się domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je albo wyłącz:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // albo "0m", aby wyłączyć
          },
        },
      },
    }
    ```

    Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie puste (tylko puste wiersze i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi grupowe są blokowane, dopóki nie dopuścisz nadawców (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** móc wyzwalać odpowiedzi grupowe:

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
    Opcja 1 (najszybsza): śledź logi i wyślij testową wiadomość w grupie:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (lub `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowano / dodano do listy dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/pl/cli/directory), [Logs](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Ograniczanie wzmianką jest włączone (domyślnie). Musisz wspomnieć bota przez @ (albo dopasować `mentionPatterns`).
    - Skonfigurowałeś(-aś) `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na liście dozwolonych.

    Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to osobne sesje. Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile przestrzeni roboczych i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (a nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost danych na dysku:** sesje + transkrypty są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania per agent, przestrzenie robocze i routing kanałów.

    Wskazówki:

    - Utrzymuj jedną **aktywną** przestrzeń roboczą per agent (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuwaj JSONL lub wpisy magazynu), jeśli rośnie zużycie dysku.
    - Używaj `openclaw doctor`, aby wykrywać zbędne przestrzenie robocze i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **Multi-Agent Routing**, aby uruchamiać wielu odizolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peera. Slack jest obsługiwany jako kanał i może być powiązany z konkretnymi agentami.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co człowiek może” — antyboty, CAPTCHA i MFA mogą
    nadal blokować automatyzację. Dla najbardziej niezawodnego sterowania przeglądarką używaj lokalnego Chrome MCP na hoście,
    albo używaj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Konfiguracja zgodna ze sprawdzonymi praktykami:

    - Zawsze aktywny host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (bindings).
    - Kanał(y) Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP lub Node, gdy potrzebna.

    Dokumentacja: [Multi-Agent Routing](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Browser](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, failover i profile uwierzytelniania

Pytania i odpowiedzi o modelach — ustawienia domyślne, wybór, aliasy, przełączanie, failover, profile uwierzytelniania —
znajdziesz w [Models FAQ](/pl/help/faq-models).

## Gateway: porty, „already running” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Pierwszeństwo:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > domyślne 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje "Runtime: running", ale "Connectivity probe: failed"?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Probe łączności to faktyczne połączenie CLI z gateway WebSocket.

    Użyj `openclaw gateway status` i zwracaj uwagę na te wiersze:

    - `Probe target:` (URL, którego probe faktycznie użyła)
    - `Listening:` (co jest rzeczywiście powiązane na porcie)
    - `Last gateway error:` (częsta główna przyczyna, gdy proces żyje, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne "Config (cli)" i "Config (service)"?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa uruchomiona jest z innym (często niedopasowanie `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tym samym `--profile` / środowiskiem, którego usługa ma używać.

  </Accordion>

  <Accordion title='Co oznacza "another gateway instance is already listening"?'>
    OpenClaw egzekwuje blokadę runtime przez natychmiastowe powiązanie listenera WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli powiązanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie z poświadczeniami zdalnymi opartymi na współdzielonym sekrecie:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (lub przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo przy zmianie tych wartości.
    - `gateway.remote.token` / `.password` to tylko poświadczenia zdalne po stronie klienta; same w sobie nie włączają lokalnego uwierzytelniania gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje "unauthorized" (albo ciągle się przełącza ponownie). Co teraz?'>
    Ścieżka uwierzytelniania gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania trwałego przechowywania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z buforowanym tokenem urządzenia, gdy gateway zwróci wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów przechowywanych razem z tokenem urządzenia. Jawne wywołania `deviceToken` / jawne `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z cache.
    - Poza tą ścieżką ponawiania pierwszeństwo uwierzytelniania connect to jawny współdzielony token/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - Kontrole zakresu tokenów bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatora bootstrap spełnia tylko żądania operatora; Node lub inne role niebędące operatorem nadal potrzebują zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje + kopiuje URL dashboard i próbuje otworzyć; w trybie headless pokazuje wskazówkę SSH).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw zestaw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb trusted-proxy: upewnij się, że przychodzisz przez skonfigurowane nie-loopback proxy świadome tożsamości, a nie przez loopback proxy na tym samym hoście lub surowy URL gateway.
    - Jeśli niedopasowanie utrzymuje się po jednej próbie ponowienia, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to polecenie rotate mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą obracać tylko **własne** urządzenie, chyba że mają również `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś(-aś)? Uruchom `openclaw status --all` i postępuj zgodnie z [Troubleshooting](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/pl/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem(-am) gateway.bind na tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Powiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs nie działa), nie ma do czego się powiązać.

    Naprawa:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz powiązania tylko z tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może uruchamiać wiele kanałów komunikacyjnych i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) lub twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja przestrzeni roboczej)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Używaj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalne `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy ręcznych uruchomieniach).
    - Zainstaluj usługę per profil: `openclaw --profile <name> gateway install`.

    Profile dodają także sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Multiple gateways](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza "invalid handshake" / kod 1008?'>
    Gateway to **serwer WebSocket**, który oczekuje, że pierwsza wiadomość będzie
    ramką `connect`. Jeśli otrzyma cokolwiek innego, zamknie połączenie
    z **kodem 1008** (naruszenie polityki).

    Typowe przyczyny:

    - Otworzyłeś(-aś) **URL HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyłeś(-aś) niewłaściwego portu lub ścieżki.
    - Proxy lub tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie inne niż do Gateway.

    Szybkie poprawki:

    1. Używaj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło do ramki `connect`.

    Jeśli używasz CLI lub TUI, URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [Gateway protocol](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logów plikowych jest kontrolowany przez `logging.level`. Szczegółowość konsoli jest kontrolowana przez `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [Troubleshooting](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Używaj pomocników gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może przejąć port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem(-am) terminal w Windows — jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a potem zrestartuj:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli nigdy nie zainstalowałeś(-aś) usługi, uruchom ją na pierwszym planie:

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

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Gateway service runbook](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie docierają. Co sprawdzić?">
    Zacznij od szybkiego przeglądu kondycji:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście gateway** (sprawdź `models status`).
    - Pairing/lista dozwolonych kanału blokuje odpowiedzi (sprawdź konfigurację kanału + logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli pracujesz zdalnie, potwierdź, że tunel/połączenie Tailscale działa i że
    Gateway WebSocket jest osiągalny.

    Dokumentacja: [Channels](/pl/channels), [Troubleshooting](/pl/gateway/troubleshooting), [Remote access](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — co teraz?'>
    To zwykle oznacza, że UI utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest w dobrej kondycji? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy tunel/połączenie Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/pl/web/dashboard), [Remote access](/pl/gateway/remote), [Troubleshooting](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands w Telegram nie działa. Co sprawdzić?">
    Zacznij od logów i stanu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina do limitu Telegram i ponawia z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Ogranicz polecenia Pluginów/Skills/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli działasz na VPS albo za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że patrzysz na logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Channel troubleshooting](/pl/channels/troubleshooting).

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

    Dokumentacja: [TUI](/pl/web/tui), [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowałeś(-aś) usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **usługę nadzorowaną** (launchd na macOS, systemd na Linux).
    Używaj tego, gdy Gateway działa w tle jako daemon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj przez Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Gateway service runbook](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowałeś(-aś) usługę, używaj poleceń gateway. Używaj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie większej liczby szczegółów, gdy coś zawodzi">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów na konsoli. Następnie sprawdź plik logu pod kątem błędów uwierzytelniania kanału, routingu modelu i RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Mój Skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Wychodzące załączniki od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [OpenClaw assistant setup](/pl/start/openclaw) i [Agent send](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje wychodzące multimedia i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są skalowane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie lokalnych ścieżek do przestrzeni roboczej, temp/media-store i plików zwalidowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla multimediów i bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki przypominające sekrety są nadal blokowane.

    Zobacz [Images](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Security i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące DM jest bezpieczne?">
    Traktuj przychodzące DM jako niezaufane wejście. Ustawienia domyślne zostały zaprojektowane tak, aby ograniczać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **pairing**:
      - Nieznani nadawcy otrzymują kod pairingu; bot nie przetwarza ich wiadomości.
      - Zatwierdzenie przez: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Liczba oczekujących żądań jest ograniczona do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnego opt-in (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection jest problemem tylko dla botów publicznych?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli Twój asystent czyta zewnętrzną treść (web search/fetch, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **Ty jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy włączone są narzędzia: model może zostać nakłoniony do
    wynoszenia kontekstu lub wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg szkód przez:

    - używanie agenta „czytającego” tylko do odczytu lub bez narzędzi do podsumowywania niezaufanej treści
    - wyłączanie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu plików/dokumentów także jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst
      jawnymi znacznikami granic treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Odizolowanie bota przy użyciu oddzielnych kont i numerów telefonu
    zmniejsza zasięg szkód, jeśli coś pójdzie nie tak. Ułatwia to także rotację
    poświadczeń albo cofnięcie dostępu bez wpływu na Twoje konta osobiste.

    Zacznij od małej skali. Daj dostęp tylko do narzędzi i kont, których naprawdę potrzebujesz, a później
    rozszerzaj zakres, jeśli będzie to wymagane.

    Dokumentacja: [Security](/pl/gateway/security), [Pairing](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to jest bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi osobistymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM w **trybie pairingu** albo na ścisłej liście dozwolonych.
    - Używaj **oddzielnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Niech przygotowuje szkic, a potem **zatwierdzaj przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je w izolacji. Zobacz
    [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent działa tylko na czacie, a wejście jest zaufane. Mniejsze klasy modeli są
    bardziej podatne na przejmowanie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo przy czytaniu niezaufanej treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj w sandboxie. Zobacz [Security](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem(-am) /start w Telegram, ale nie dostałem(-am) kodu pairingu">
    Kody pairingu są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj swój identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisał do moich kontaktów? Jak działa pairing?">
    Nie. Domyślną zasadą DM WhatsApp jest **pairing**. Nieznani nadawcy dostają tylko kod pairingu, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które sam wyzwolisz.

    Zatwierdź pairing przez:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli działasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to nie chce się zatrzymać”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych wiadomości systemowych na czacie?">
    Większość wewnętrznych wiadomości lub wiadomości narzędzi pojawia się tylko wtedy, gdy dla tej sesji włączone są **verbose**, **trace** lub **reasoning**.

    Naprawa na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt głośno, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Thinking and verbose](/pl/tools/thinking), [Security](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować działające zadanie?">
    Wyślij dowolne z poniższych **jako samodzielną wiadomość** (bez slash):

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

    To wyzwalacze przerwania (nie polecenia slash).

    Dla procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Przegląd poleceń slash: zobacz [Slash commands](/pl/tools/slash-commands).

    Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (jak `/status`) działa też inline dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? ("Cross-context messaging denied")'>
    OpenClaw domyślnie blokuje wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle na Discord, chyba że jawnie na to zezwolisz.

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

    Po edycji konfiguracji uruchom ponownie gateway.

  </Accordion>

  <Accordion title='Dlaczego mam wrażenie, że bot "ignoruje" wiadomości wysyłane szybko jedna po drugiej?'>
    Tryb kolejki kontroluje, jak nowe wiadomości wchodzą w interakcję z uruchomieniem będącym w toku. Użyj `/queue`, aby zmienić tryb:

    - `steer` — nowe wiadomości przekierowują bieżące zadanie
    - `followup` — wiadomości są uruchamiane jedna po drugiej
    - `collect` — grupuje wiadomości i odpowiada raz (domyślnie)
    - `steer-backlog` — steruj teraz, potem przetwarzaj backlog
    - `interrupt` — przerwij bieżące uruchomienie i zacznij od nowa

    Możesz dodać opcje takie jak `debounce:2s cap:25 drop:summarize` dla trybów followup.

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic przy użyciu klucza API?'>
    W OpenClaw poświadczenia i wybór modelu są rozdzielone. Ustawienie `ANTHROPIC_API_KEY` (albo zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal utknąłeś(-aś)? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [First-run FAQ](/pl/help/faq-first-run) — instalacja, onboarding, uwierzytelnianie, subskrypcje, wczesne błędy
- [Models FAQ](/pl/help/faq-models) — wybór modelu, failover, profile uwierzytelniania
- [Troubleshooting](/pl/help/troubleshooting) — triage oparty na objawach
