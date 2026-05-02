---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub obsługi w czasie działania
    - Wstępna klasyfikacja problemów zgłoszonych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące instalacji, konfiguracji i korzystania z OpenClaw
title: Najczęściej zadawane pytania
x-i18n:
    generated_at: "2026-05-02T09:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

Szybkie odpowiedzi oraz bardziej szczegółowe rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, wielu agentów, OAuth/klucze API, awaryjne przełączanie modeli). Diagnostykę środowiska wykonawczego znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting). Pełną dokumentację konfiguracji znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie podsumowanie lokalne: system operacyjny + aktualizacja, osiągalność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy środowiska wykonawczego (gdy Gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko wykonawcze nadzorcy względem osiągalności RPC, docelowy adres URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Dogłębne sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia sondę stanu Gateway na żywo, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Stan](/pl/gateway/health).

5. **Śledź najnowszy log**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj awaryjnie:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Rejestrowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

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

   Prosi działający Gateway o pełną migawkę (tylko WS). Zobacz [Health](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

Pytania i odpowiedzi dotyczące pierwszego uruchomienia — instalacji, onboardingu, tras uwierzytelniania, subskrypcji, początkowych błędów —
znajdują się w [FAQ pierwszego uruchomienia](/pl/help/faq-first-run).

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada w miejscach komunikacji, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone Plugin kanałów, takie jak QQ Bot), a na obsługiwanych platformach może także obsługiwać głos + Canvas na żywo. **Gateway** to stale działająca płaszczyzna sterowania; produktem jest asystent.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper Claude”. To **lokalna w pierwszej kolejności płaszczyzna sterowania**, która pozwala uruchamiać
    wydajnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    sesjami stanowymi, pamięcią i narzędziami - bez oddawania kontroli nad przepływami pracy hostowanej
    usłudze SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i przechowuj
      obszar roboczy + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależny od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      i przełączaniem awaryjnym dla poszczególnych agentów.
    - **Opcja tylko lokalna:** uruchamiaj lokalne modele, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wieloagentowy:** oddzielni agenci dla kanału, konta lub zadania, każdy z własnym
      obszarem roboczym i ustawieniami domyślnymi.
    - **Open source i łatwy do modyfikacji:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie skonfigurowałem OpenClaw - co zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połącz Gmail i automatyzuj podsumowania lub działania następcze.

    OpenClaw potrafi obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na etapy i
    używasz podagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i wiadomości, które Cię interesują.
    - **Research i redagowanie:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i listy kontrolne sterowane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik w czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w pozyskiwaniu leadów, działaniach outreach, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia wersji roboczych**. Może skanować witryny, tworzyć krótkie listy,
    podsumowywać potencjalnych klientów oraz pisać wersje robocze wiadomości outreach lub tekstów reklam.

    W przypadku **działań outreach lub kampanii reklamowych** zachowaj udział człowieka w procesie. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy model to pozwolić
    OpenClaw przygotować wersję roboczą, a następnie ją zatwierdzić.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety w porównaniu z Claude Code przy tworzeniu stron internetowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu z różnych urządzeń i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, planowanie, hooki)
    - **Zawsze włączony Gateway** (uruchom na VPS, korzystaj z dowolnego miejsca)
    - **Nodes** do lokalnej przeglądarki/ekranu/kamery/wykonywania poleceń

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania repozytorium w stanie dirty?">
    Użyj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → wbudowane → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają pierwszeństwo przed wbudowanymi Skills bez dotykania git. Jeśli Skills ma być zainstalowane globalnie, ale widoczne tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność za pomocą `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany nadające się do upstreamu powinny znajdować się w repozytorium i trafiać jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślna kolejność pierwszeństwa to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → wbudowane → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli Skills ma być widoczne tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane modele pracy to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` dla każdego zadania.
    - **Subagenci**: kieruj zadania do osobnych agentów z różnymi domyślnymi modelami.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Polecenia ukośnika](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak mogę ją oddelegować?">
    Użyj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „utworzył subagenta do tego zadania”, albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem w Discord?">
    Użyj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub docelową sesją, aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Utwórz przez `sessions_spawn` z użyciem `thread: true` (i opcjonalnie `mode: "session"` dla trwałej kontynuacji).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne cofanie fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Domyślne ustawienia globalne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy tworzeniu: `channels.discord.threadBindings.spawnSessions` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć tworzenie sesji powiązanych z wątkiem.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja konfiguracji](/pl/gateway/configuration-reference), [Polecenia ukośnika](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja o ukończeniu trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę żądającego:

    - Dostarczanie subagenta w trybie ukończenia preferuje dowolny powiązany wątek lub trasę konwersacji, jeśli istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), dzięki czemu bezpośrednie dostarczenie nadal może się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie powieść, a wynik wraca do kolejkowanego dostarczenia do sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić fallback do kolejki albo końcową porażkę dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta potomnego jest dokładnie cichym tokenem `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo wstrzymuje ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Jeśli proces potomny przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

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

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie jest oczekiwane awaryjne wysłanie przez runner.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia ją zablokowały.
    - Cichy wynik izolowany (tylko `NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner również wstrzymuje kolejkowane dostarczanie awaryjne.

    W przypadku izolowanych zadań cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy dostępna jest trasa czatu. `--announce` kontroluje tylko awaryjną ścieżkę runnera
    dla tekstu końcowego, którego agent wcześniej sam nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron zmieniło modele lub ponowiło próbę raz?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie zduplikowane planowanie.

    Izolowany cron może utrwalić przekazanie modelu w czasie działania i ponowić próbę, gdy aktywne
    uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowna próba zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, cron
    również je utrwala przed ponowieniem próby.

    Powiązane reguły wyboru:

    - Nadpisanie modelu haka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` dla danego zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji cron.
    - Następnie standardowy wybór modelu agenta/domyślnego.

    Pętla ponawiania jest ograniczona. Po początkowej próbie plus 2 ponownych próbach przełączenia
    cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI cron](/pl/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills w systemie Linux?">
    Użyj natywnych poleceń `openclaw skills` albo dodaj Skills do obszaru roboczego. Interfejs Skills dla macOS nie jest dostępny w systemie Linux.
    Przeglądaj Skills pod adresem [https://clawhub.ai](https://clawhub.ai).

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
    aktywnego obszaru roboczego. Zainstaluj osobny CLI `clawhub` tylko wtedy, jeśli chcesz publikować lub
    synchronizować własne Skills. W przypadku instalacji współdzielonych między agentami umieść skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu lub stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zaplanowanych lub cyklicznych zadań (utrwalane między restartami).
    - **Heartbeat** do okresowych sprawdzeń „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają wiadomości do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills tylko dla Apple macOS z systemu Linux?">
    Nie bezpośrednio. Skills dla macOS są bramkowane przez `metadata.openclaw.os` oraz wymagane pliki binarne, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. W systemie Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz bramkowanie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją pliki binarne macOS, a następnie połącz się z systemu Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj węzła macOS (bez SSH).**
    Uruchom Gateway w systemie Linux, sparuj węzeł macOS (aplikacja paska menu) i ustaw **Polecenia uruchamiania węzła** na „Zawsze pytaj” albo „Zawsze zezwalaj” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane pliki binarne istnieją na węźle. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Zawsze pytaj”, zatwierdzenie „Zawsze zezwalaj” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - proxy plików binarnych macOS przez SSH (zaawansowane).**
    Pozostaw Gateway w systemie Linux, ale spraw, aby wymagane pliki binarne CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz skill, aby zezwalał na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla pliku binarnego (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane skill (obszar roboczy albo `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Obecnie nie jest wbudowana.

    Opcje:

    - **Niestandardowy skill / Plugin:** najlepsze rozwiązanie dla niezawodnego dostępu przez API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz zachować kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobrał tę stronę na początku sesji.

    Jeśli chcesz natywną integrację, otwórz prośbę o funkcję albo zbuduj skill
    ukierunkowany na te API.

    Zainstaluj Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego obszaru roboczego. W przypadku współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują plików binarnych zainstalowanych przez Homebrew; w systemie Linux oznacza to Linuxbrew (zobacz wpis FAQ Homebrew Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego zalogowanego Chrome z OpenClaw?">
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

    Ta ścieżka może używać lokalnej przeglądarki hosta lub połączonego węzła przeglądarki. Jeśli Gateway działa gdzie indziej, uruchom host węzła na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na odwołaniach, a nie na selektorach CSS
    - przesyłanie wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Piaskownica i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje dedykowana dokumentacja piaskownicy?">
    Tak. Zobacz [Piaskownica](/pl/gateway/sandboxing). Konfigurację specyficzną dla Docker (pełny gateway w Docker lub obrazy piaskownicy) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby pamięci podręczne przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączony CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne wiadomości DM, ale uczynić grupy publicznymi/w piaskownicy z jednym agentem?">
    Tak - jeśli ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w skonfigurowanym backendzie piaskownicy, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz narzędzia dostępne w sesjach w piaskownicy przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: osobiste DM + grupy publiczne](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowa dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podłączyć folder hosta do piaskownicy?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne wiązania i wiązania dla agenta są scalane; wiązania dla agenta są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że wiązania omijają ściany systemu plików piaskownicy.

    OpenClaw sprawdza źródła wiązań zarówno względem znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodziców dowiązań symbolicznych nadal są domyślnie blokowane, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a sprawdzenia dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu dowiązań symbolicznych.

    Zobacz [Piaskownica](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Piaskownica vs zasady narzędzi vs podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w obszarze roboczym agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Wybrane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia również **ciche opróżnianie pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatyczną Compaction. Działa to tylko wtedy, gdy obszar roboczy
    jest zapisywalny (piaskownice tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby je zachowała?">
    Poproś bota, aby **zapisał fakt w pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a kontekst krótkoterminowy trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypomnienie modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć trwa wiecznie? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Limitem jest Twoja
    przestrzeń dyskowa, nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą być kompaktowane lub obcinane. Dlatego istnieje
    wyszukiwanie pamięci - przywraca do kontekstu tylko istotne fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/uzupełnienia i
    **nie** przyznaje dostępu do embeddingów, więc **zalogowanie się przez Codex (OAuth albo
    logowanie Codex CLI)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz dostawcy jawnie, OpenClaw automatycznie wybiera dostawcę, gdy
    może rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne środowiskowe).
    Preferuje OpenAI, jeśli da się rozwiązać klucz OpenAI, w przeciwnym razie Gemini, jeśli da się rozwiązać klucz Gemini,
    następnie Voyage, potem Mistral. Jeśli żaden klucz zdalny nie jest dostępny, wyszukiwanie
    pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną
    ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana po jawnym ustawieniu
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz używać embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub lokalne** -
    szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie - **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co do nich wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i obszar roboczy znajdują się na hoście Gateway
      (`~/.openclaw` + katalog obszaru roboczego).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Kontrolujesz zakres danych:** używanie modeli lokalnych zatrzymuje prompty na twojej maszynie, ale ruch kanału
      nadal przechodzi przez serwery kanału.

    Powiązane: [Obszar roboczy agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Przeznaczenie                                                     |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy ładunek sekretów dla dostawców SecretRef typu `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` wyczyszczone)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (per agent)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                        |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **obszar roboczy** (AGENTS.md, pliki pamięci, skills itd.) jest osobny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **obszarze roboczym agenta**, a nie w `~/.openclaw`.

    - **Obszar roboczy (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
      Katalog główny pisany małymi literami `memory.md` jest tylko starszym wejściem naprawy; `openclaw doctor --fix`
      może scalić go z `MEMORY.md`, gdy oba pliki istnieją.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      oraz współdzielone skills (`~/.openclaw/skills`).

    Domyślny obszar roboczy to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po ponownym uruchomieniu, potwierdź, że Gateway używa tego samego
    obszaru roboczego przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa obszaru roboczego
    **hosta gateway**, nie twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania albo preferencji, poproś bota, aby **zapisał to w
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Obszar roboczy agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **obszar roboczy agenta** w **prywatnym** repozytorium git i wykonuj jego kopie zapasowe w
    prywatnym miejscu (na przykład GitHub private). Obejmuje to pamięć + pliki AGENTS/SOUL/USER
    i pozwala później przywrócić „umysł” asystenta.

    **Nie** commituj niczego pod `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, wykonaj kopię zapasową zarówno obszaru roboczego, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza obszarem roboczym?">
    Tak. Obszar roboczy jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandboxa per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, wskaż `workspace` tego agenta
    na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    obszar roboczy osobno, chyba że celowo chcesz, aby agent pracował w jego wnętrzu.

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
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, istotny magazyn sesji znajduje się na zdalnej maszynie, a nie na twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli pliku brakuje, używa dość bezpiecznych ustawień domyślnych (w tym domyślnego obszaru roboczego `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi, że brak autoryzacji'>
    Powiązania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie współdzielonym sekretem: token albo hasło
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

    - `gateway.remote.token` / `.password` **nie** włączają same z siebie lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako mechanizmu zapasowego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania zdalnym mechanizmem zapasowym).
    - Konfiguracje Control UI ze współdzielonym sekretem uwierzytelniają się przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania współdzielonych sekretów w URL-ach.
    - Z `gateway.auth.mode: "trusted-proxy"` odwrotne proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true` oraz wpisu loopback w `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, start gateway rozwiązuje się do trybu tokena i automatycznie go generuje, zapisując go w `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. Blokuje to innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla odwrotnych proxy świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może w dowolnym momencie wygenerować dla ciebie token: `openclaw doctor --generate-gateway-token`.

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
    - `default`: używa `All your chats, one OpenClaw.` za każdym razem.
    - `random`: rotujące zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i pobieranie z sieci)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają swojej normalnej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywne zmienne środowiskowe:

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
              provider: "firecrawl", // opcjonalne; pomiń, aby wykryć automatycznie
            },
          },
        },
    }
    ```

    Konfiguracja wyszukiwania w sieci specyficzna dla dostawcy znajduje się teraz w `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawcy `tools.web.search.*` są nadal tymczasowo wczytywane dla zgodności, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja zapasowa pobierania z sieci Firecrawl znajduje się w `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego zapasowego dostawcę pobierania na podstawie dostępnych danych uwierzytelniających. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia sieciowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak ją odzyskać i uniknąć tego w przyszłości?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz częściowy obiekt, cała
    reszta zostanie usunięta.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw sprawdzają pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe lub destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja psuje uruchamianie lub hot reload, Gateway przywraca ostatnią znaną dobrą konfigurację i zapisuje odrzucony plik jako `openclaw.json.clobbered.*`.
    - Główny agent otrzymuje ostrzeżenie rozruchowe po odzyskaniu, aby nie zapisał ponownie błędnej konfiguracji bez sprawdzenia.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Config auto-restored from last-known-good`, `Config write rejected:` lub `config reload restored last-known-good config`.
    - Obejrzyj najnowszy `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Zachowaj aktywną przywróconą konfigurację, jeśli działa, a następnie skopiuj z powrotem tylko zamierzone klucze za pomocą `openclaw config set` albo `config.patch`.
    - Uruchom `openclaw config validate` i `openclaw doctor`.
    - Jeśli nie masz ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo uruchom ponownie `openclaw doctor` i skonfiguruj ponownie kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację lub dowolną kopię zapasową.
    - Lokalny agent programistyczny często może odtworzyć działającą konfigurację z logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` wyłącznie do zastępowania pełnej konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla właściciela z uruchomienia agenta, nadal odrzuci ono zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek wykonywania).

    Dokumentacja: [Konfiguracja](/pl/cli/config), [Konfigurowanie](/pl/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi pracownikami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **węzły** i **agenci**:

    - **Gateway (centralny):** posiada kanały (Signal/WhatsApp), routing i sesje.
    - **Węzły (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (pracownicy):** osobne mózgi/przestrzenie robocze dla specjalnych ról (np. „operacje Hetzner”, „Dane osobiste”).
    - **Podagenci:** uruchamiają pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
    - **TUI:** połącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Węzły](/pl/nodes), [Zdalny dostęp](/pl/gateway/remote), [Routing wieloagentowy](/pl/concepts/multi-agent), [Podagenci](/pl/tools/subagents), [TUI](/pl/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać bez interfejsu graficznego?">
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

    Wartość domyślna to `false` (z interfejsem graficznym). Tryb bez interfejsu graficznego częściej uruchamia kontrole antybotowe w niektórych witrynach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb bez interfejsu graficznego używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (użyj zrzutów ekranu, jeśli potrzebujesz widoku).
    - Niektóre witryny są bardziej restrykcyjne wobec automatyzacji w trybie bez interfejsu graficznego (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje bez interfejsu graficznego.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarkę Brave (albo dowolną przeglądarkę opartą na Chromium) i uruchom ponownie Gateway.
    Zobacz pełne przykłady konfiguracji w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne Gateway i węzły

<AccordionGroup>
  <Accordion title="Jak polecenia są przekazywane między Telegram, gateway i węzłami?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje węzły przez **Gateway WebSocket**, gdy potrzebne jest narzędzie węzła:

    Telegram → Gateway → Agent → `node.*` → Węzeł → Gateway → Telegram

    Węzły nie widzą przychodzącego ruchu dostawcy; otrzymują tylko wywołania RPC węzła.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako węzeł**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway + swój komputer w tej samej tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (wiązanie tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako węzeł.
    5. Zatwierdź węzeł na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; węzły łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: parowanie węzła macOS pozwala na `system.run` na tej maszynie. Paruj tylko
    urządzenia, którym ufasz, i przejrzyj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Węzły](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączone, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan Gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie sprawdź uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM lub grupa) zawierają Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Zdalny dostęp](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą ze sobą rozmawiać (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale możesz to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, celując w czat, którego nasłuchuje drugi bot.
    Jeśli jeden bot działa na zdalnym VPS, skieruj swoje CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Zdalny dostęp](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może osiągnąć docelowy Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj zabezpieczenie, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy
    dozwolonych kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Zdalny dostęp](/pl/gateway/remote), [CLI agenta](/pl/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własną przestrzenią roboczą, domyślnymi modelami
    i routingiem. To normalna konfiguracja, znacznie tańsza i prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub podagentów.

  </Accordion>

  <Accordion title="Czy używanie węzła na moim osobistym laptopie zamiast SSH z VPS daje korzyści?">
    Tak - węzły są pierwszorzędnym sposobem dostępu do laptopa ze zdalnego Gateway i
    odblokowują więcej niż dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (mały VPS albo maszyna klasy Raspberry Pi wystarczy; 4 GB RAM w zupełności wystarcza), więc typowa
    konfiguracja to zawsze włączony host plus laptop jako węzeł.

    - **Bez wymaganego przychodzącego SSH.** Węzły łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrole wykonywania.** `system.run` jest bramkowane przez listy dozwolonych/zatwierdzenia węzła na tym laptopie.
    - **Więcej narzędzi urządzenia.** Węzły udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host węzła na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH sprawdza się przy doraźnym dostępie do powłoki, ale węzły są prostsze dla stałych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy węzły uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na host, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gateway](/pl/gateway/multiple-gateways)). Węzły są urządzeniami peryferyjnymi, które łączą się
    z gateway (węzły iOS/Android albo „tryb węzła” macOS w aplikacji paska menu). Dla hostów węzłów bez interfejsu graficznego
    i kontroli CLI zobacz [CLI hosta Node](/pl/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobierz bieżący snapshot + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); wykonuje hot reload, gdy to możliwe, i restart, gdy wymagane
    - `config.apply`: zweryfikuj + zastąp pełną konfigurację; wykonuje hot reload, gdy to możliwe, i restart, gdy wymagane
    - Narzędzie runtime `gateway` dostępne tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek wykonywania

  </Accordion>

  <Accordion title="Minimalna rozsądna konfiguracja dla pierwszej instalacji">
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

    Jeśli chcesz korzystać z interfejsu sterowania bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje przypięty do loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć węzeł Mac ze zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **interfejs sterowania Gateway + WS**. Węzły łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tym samym tailnecie**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnetu).
       Aplikacja zestawi tunel do portu Gateway i połączy się jako węzeł.
    3. **Zatwierdź węzeł** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Wykrywanie](/pl/gateway/discovery), [Tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy zainstalować na drugim laptopie, czy tylko dodać węzeł?">
    Jeśli potrzebujesz tylko **narzędzi lokalnych** (ekran/kamera/exec) na drugim laptopie, dodaj go jako
    **węzeł**. Dzięki temu zachowasz jeden Gateway i unikniesz zduplikowanej konfiguracji. Lokalne narzędzia węzła są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Zainstaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes), [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (shell, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy plik `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

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

    Pełną kolejność pierwszeństwa i źródła znajdziesz w [/środowisko](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwa typowe rozwiązania:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy środowiska shell.
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

    To uruchamia twój shell logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale status modeli pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` informuje, czy **import środowiska shell** jest włączony. "Shell env: off"
    **nie** oznacza, że brakuje twoich zmiennych środowiskowych - oznacza tylko, że OpenClaw nie załaduje
    automatycznie twojego shell logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy twojego
    środowiska shell. Napraw to jedną z tych metod:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z shell (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko wtedy, gdy brakuje go w środowisku).

    Następnie zrestartuj gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (także `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/koncepcje/dostawcy-modeli](/pl/concepts/model-providers) i [/środowisko](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć nową rozmowę?">
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie po bezczynności. Gdy jest włączone, **następna**
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
    Tak, przez **routing wieloagentowy** i **subagentów**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów wykonawczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **ciekawy eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    przewidujemy, to jeden bot, z którym rozmawiasz, oraz różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby tworzyć subagentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Subagenci](/pl/tools/subagents), [CLI agentów](/pl/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został ucięty w środku zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony oknem modelu. Długie czaty, duże wyniki narzędzi albo wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami oraz `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota o jego ponowne odczytanie.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat pozostał mniejszy.
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

    - Onboarding także oferuje **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Otrzymuję błędy "context too large" - jak zresetować albo wykonać compact?'>
    Użyj jednej z tych opcji:

    - **Compact** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli problem nadal występuje:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby skracać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna albo uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Rozwiązanie: rozpocznij świeżą sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości Heartbeat co 30 minut?">
    Heartbeat domyślnie działa co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj je albo wyłącz:

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
    takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, Heartbeat nadal działa, a model decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **ty** mógł wywoływać odpowiedzi w grupie:

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

    Opcja 2 (jeśli już skonfigurowano/dodano do allowlist): wypisz grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Katalog](/pl/cli/directory), [Logi](/pl/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramka wzmianek jest włączona (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowlist.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z wiadomościami prywatnymi?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są oddzielnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Brak twardych limitów. Dziesiątki (nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Wzrost użycia dysku:** sesje + transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe równoczesne użycie modeli.
    - **Koszt operacyjny:** profile uwierzytelniania, workspace i routing kanałów per agent.

    Wskazówki:

    - Utrzymuj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL albo wpisy magazynu), jeśli zużycie dysku rośnie.
    - Użyj `openclaw doctor`, aby wykryć zbędne workspace i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **routingu wielu agentów**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/uczestnika. Slack jest obsługiwany jako kanał i można go przypisać do konkretnych agentów.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „zrób wszystko, co może człowiek” - mechanizmy antybotowe, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, użyj lokalnego Chrome MCP na hoście
    albo użyj CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (wiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP lub węzeł, gdy jest potrzebna.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Węzły](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele, przełączanie awaryjne i profile uwierzytelniania

Pytania i odpowiedzi dotyczące modeli — wartości domyślnych, wyboru, aliasów, przełączania, przełączania awaryjnego, profili uwierzytelniania —
znajdują się w [FAQ modeli](/pl/help/faq-models).

## Gateway: porty, „już uruchomiony” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (interfejs sterowania, haki itd.).

    Kolejność pierwszeństwa:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje „Runtime: running”, ale „Connectivity probe: failed”?'>
    Ponieważ „running” to widok **nadzorcy** (launchd/systemd/schtasks). Sonda łączności to CLI faktycznie łączące się z WebSocket Gateway.

    Użyj `openclaw gateway status` i zaufaj tym wierszom:

    - `Probe target:` (adres URL faktycznie użyty przez sondę)
    - `Listening:` (co faktycznie jest powiązane z portem)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa uruchamia inny (często niedopasowanie `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego ma używać usługa.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę czasu uruchomienia, natychmiast wiążąc nasłuchiwanie WebSocket podczas startu (domyślnie `ws://127.0.0.1:18789`). Jeśli wiązanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że inna instancja już nasłuchuje.

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo gdy przekażesz flagę nadpisującą).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to wyłącznie zdalne poświadczenia po stronie klienta; same nie włączają lokalnego uwierzytelniania Gateway.

  </Accordion>

  <Accordion title='Interfejs sterowania pokazuje „unauthorized” (albo stale łączy się ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Gateway i metoda uwierzytelniania interfejsu nie pasują do siebie.

    Fakty (z kodu):

    - Interfejs sterowania przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą wykonać jedną ograniczoną próbę ponowienia z buforowanym tokenem urządzenia, gdy Gateway zwróci wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ta próba ponowienia z buforowanym tokenem używa teraz ponownie buforowanych zatwierdzonych zakresów przechowywanych z tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć buforowane zakresy.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, potem token bootstrap.
    - Sprawdzanie zakresów tokenu bootstrap używa prefiksów ról. Wbudowana lista dozwolonych operatorów bootstrap spełnia tylko żądania operatora; węzły lub inne role niebędące operatorami nadal potrzebują zakresów z prefiksem własnej roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje i kopiuje adres URL panelu, próbuje go otworzyć; pokazuje wskazówkę SSH, jeśli środowisko jest bezgłowe).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb współdzielonego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach interfejsu sterowania.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy adres URL loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb zaufanego proxy: upewnij się, że przechodzisz przez skonfigurowany proxy świadomy tożsamości, a nie surowy adres URL Gateway. Proxy loopback na tym samym hoście również wymagają `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jeśli niedopasowanie utrzymuje się po jednej próbie ponowienia, obróć/zatwierdź ponownie sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotacji mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanego urządzenia mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywaniem problemów](/pl/gateway/troubleshooting). Zobacz [Panel](/pl/web/dashboard), aby poznać szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind na tailnet, ale nie może powiązać i nic nie nasłuchuje">
    Wiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma z czym się powiązać.

    Naprawa:

    - Uruchom Tailscale na tym hoście (aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz wiązania tylko z tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie - jeden Gateway może obsługiwać wiele kanałów wiadomości i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja na instancję)
    - `OPENCLAW_STATE_DIR` (stan na instancję)
    - `agents.defaults.workspace` (izolacja obszaru roboczego)
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
    - Użyłeś złego portu lub ścieżki.
    - Proxy lub tunel usunął nagłówki uwierzytelniania albo wysłał żądanie niebędące żądaniem Gateway.

    Szybkie naprawy:

    1. Użyj adresu URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

    Jeśli używasz CLI lub TUI, adres URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Rejestrowanie i debugowanie

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

    Logi usługi/nadzorcy (gdy Gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Zobacz [Rozwiązywanie problemów](/pl/gateway/troubleshooting), aby uzyskać więcej informacji.

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
    Istnieją **dwa tryby instalacji Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

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

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Podręcznik uruchamiania usługi Gateway](/pl/gateway).

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

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście Gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokuje odpowiedzi (sprawdź konfigurację kanału i logi).
    - WebChat/Panel jest otwarty bez właściwego tokenu.

    Jeśli działasz zdalnie, potwierdź, że tunel/połączenie Tailscale jest aktywne i że
    WebSocket Gateway jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='„Disconnected from gateway: no reason” - co teraz?'>
    Zwykle oznacza to, że interfejs utracił połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest w dobrym stanie? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy tunel/łącze Tailscale działa?

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

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą komend, ale część wpisów menu nadal trzeba usunąć. Ogranicz komendy pluginu/Skills/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` lub podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że patrzysz na logi na hoście Gateway.

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

    Dokumentacja: [TUI](/pl/web/tui), [Polecenia z ukośnikiem](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowano usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linuksie).
    Użyj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz go na pierwszym planie, zatrzymaj za pomocą Ctrl-C, a potem:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart a openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia Gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowano usługę, używaj poleceń Gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób na uzyskanie więcej szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modeli i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Mój Skills wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Załączniki wychodzące od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje multimedia wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, tymczasowego magazynu/magazynu multimediów oraz plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent może już odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki wyglądające na tajne nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy wystawienie OpenClaw na przychodzące DM-y jest bezpieczne?">
    Traktuj przychodzące DM-y jako niezaufane dane wejściowe. Domyślne ustawienia mają ograniczać ryzyko:

    - Domyślnym zachowaniem w kanałach obsługujących DM-y jest **parowanie**:
      - Nieznani nadawcy otrzymują kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź za pomocą: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące prośby są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM-ów wymaga jawnej zgody (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM-ów.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent czyta treści zewnętrzne (wyszukiwanie/pobieranie z sieci, strony przeglądarki, e-maile,
    dokumenty, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć kontrolę nad modelem. Może się to zdarzyć nawet wtedy, gdy **jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się, gdy narzędzia są włączone: model może zostać nakłoniony do
    wykradania kontekstu albo wywoływania narzędzi w Twoim imieniu. Ogranicz zasięg skutków przez:

    - używanie agenta „czytelnika” tylko do odczytu albo bez narzędzi do streszczania niezaufanych treści
    - pozostawienie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu pliku/dokumentu również jako niezaufanego: OpenResponses
      `input_file` oraz wyodrębnianie załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota osobnymi kontami i numerami telefonu
    ogranicza zasięg skutków, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    poświadczeń albo cofnięcie dostępu bez wpływu na konta osobiste.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których faktycznie potrzebujesz, i rozszerzaj
    później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi prywatnymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Trzymaj DM-y w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Użyj **oddzielnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować szkic, a potem **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je odizolowane. Zobacz
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

    Sprawdź oczekujące prośby:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie wysyłał wiadomości do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślną zasadą DM w WhatsApp jest **parowanie**. Nieznani nadawcy otrzymują tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które uruchomisz.

    Zatwierdź parowanie za pomocą:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące prośby:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM-y były dozwolone. Nie służy do automatycznego wysyłania. Jeśli używasz swojego osobistego numeru WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to się nie zatrzymuje”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączone są
    **verbose**, **trace** albo **reasoning**.

    Napraw to na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt dużo komunikatów, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Myślenie i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
    Wyślij dowolne z tych wyrażeń **jako samodzielną wiadomość** (bez ukośnika):

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

    Przegląd poleceń z ukośnikiem: zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (np. `/status`) działa też w treści wiadomości dla nadawców z listy dozwolonych.

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

    Po edycji konfiguracji uruchom ponownie Gateway.

  </Accordion>

  <Accordion title='Dlaczego wydaje się, że bot „ignoruje” szybkie serie wiadomości?'>
    Tryb kolejki kontroluje, jak nowe wiadomości wchodzą w interakcję z trwającym uruchomieniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - kolejkuj wszystkie oczekujące wskazówki do następnej granicy modelu w bieżącym uruchomieniu
    - `queue` - starsze wskazówki pojedynczo
    - `followup` - uruchamiaj wiadomości pojedynczo
    - `collect` - grupuj wiadomości i odpowiedz raz
    - `steer-backlog` - steruj teraz, a potem przetwórz zaległości
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Domyślny tryb to `steer`. Możesz dodać opcje takie jak `debounce:0.5s cap:25 drop:summarize` dla trybów followup. Zobacz [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic przy użyciu klucza API?'>
    W OpenClaw dane uwierzytelniające i wybór modelu są rozdzielone. Ustawienie `ANTHROPIC_API_KEY` (lub zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywistym domyślnym modelem jest ten skonfigurowany w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` lub `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć danych uwierzytelniających Anthropic w oczekiwanym pliku `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal masz problem? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHub](https://github.com/openclaw/openclaw/discussions).

## Powiązane

- [FAQ pierwszego uruchomienia](/pl/help/faq-first-run) — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, wczesne błędy
- [FAQ dotyczące modeli](/pl/help/faq-models) — wybór modelu, przełączanie awaryjne, profile uwierzytelniania
- [Rozwiązywanie problemów](/pl/help/troubleshooting) — diagnostyka według objawów
