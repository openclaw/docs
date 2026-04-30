---
read_when:
    - Nowa instalacja, zablokowany proces wdrażania lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybkie rozpoczęcie pracy i konfiguracja pierwszego uruchomienia — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-04-30T09:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  Szybki start i pytania oraz odpowiedzi dotyczące pierwszego uruchomienia. Informacje o codziennych operacjach, modelach, uwierzytelnianiu, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja pierwszego uruchomienia

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, aby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twoją maszynę**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków „utknąłem” to **problemy z lokalną konfiguracją lub środowiskiem**, których
    zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im **pełny checkout źródeł** przez
    instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, więc agent może czytać kod i dokumentację oraz
    rozumować o dokładnej wersji, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** poprawkę (krok po kroku), a następnie wykonywał tylko
    niezbędne polecenia. Dzięki temu zmiany pozostają małe i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, prosząc o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki podgląd stanu Gateway/agenta i podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy i dostępność modeli.
    - `openclaw doctor`: waliduje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko puste szablony lub same nagłówki
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie nadszedł
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wykonania są przesuwane dopiero po zakończeniu prawdziwego uruchomienia heartbeat.
    Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i używanie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zazwyczaj uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (dla kontrybutorów/deweloperów):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym (bez tokenu w URL) adresem dashboardu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj i wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnienie współdzielonym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli żaden współdzielony sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zachowaj bindowanie do loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejania współdzielonego sekretu, przy założeniu zaufanego hosta Gateway); API HTTP nadal wymagają uwierzytelniania współdzielonym sekretem, chyba że celowo użyjesz prywatnego wejścia `none` albo uwierzytelniania HTTP przez zaufane proxy.
      Błędne równoczesne próby uwierzytelniania Serve z tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc druga błędna ponowna próba może już pokazać `retry later`.
    - **Bindowanie tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący współdzielony sekret w ustawieniach dashboardu.
    - **Reverse proxy świadome tożsamości**: utrzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, potem otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Dashboard](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby bindowania i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity zatwierdzania do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko, gdzie
    pojawiają się monity zatwierdzania i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez współdzieloną ścieżkę.
    - Jeśli obsługiwany natywny kanał może bezpiecznie wywnioskować zatwierdzających, OpenClaw teraz automatycznie włącza natywne zatwierdzenia najpierw przez DM, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być też przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy wyraźnie chcesz, aby monity zatwierdzania były publikowane z powrotem w źródłowym pokoju/temacie.
    - Zatwierdzenia Plugin są znów oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre natywne kanały utrzymują dodatkową natywną obsługę zatwierdzania Plugin.

    W skrócie: przekazywanie służy do routingu, natywna konfiguracja klienta do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku jako wystarczające do użytku osobistego oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz większy zapas (logi, media, inne usługi), **zalecane są 2GB**, ale nie jest to
    twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a na laptopie/telefonie możesz sparować **węzły** dla
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    W skrócie: działa, ale spodziewaj się nierówności.

    - Użyj **64-bitowego** systemu operacyjnego i utrzymuj Node >= 22.
    - Preferuj **instalację hackable (git)**, aby móc oglądać logi i szybko aktualizować.
    - Zacznij bez kanałów/skills, potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy z binariami, zwykle jest to problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding się nie wykluwa. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz ten wiersz **bez odpowiedzi**
    i tokeny zostają na 0, agent nigdy się nie uruchomił.

    1. Zrestartuj Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status i uwierzytelnianie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal się zawiesza, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść moją konfigurację na nową maszynę (Mac mini) bez ponawiania onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a potem raz uruchom Doctor. To
    zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i stan kanałów),
    o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane uwierzytelniające WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHub, tworzysz kopię zapasową
    **pamięci i plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie sprawdzić, co nowego jest w najnowszej wersji?">
    Sprawdź changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Highlights**, **Changes** i
    **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie mogę uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, potem spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz wejść na stronę, dokumentacja ma mirror na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między wersją stabilną a beta">
    **Stable** i **beta** to **tagi dist npm**, a nie osobne linie kodu:

    - `latest` = stabilna
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stabilne trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stabilna mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta a dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się beta od dev?">
    **Beta** to tag dist npm `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma głowa `main` (git); po opublikowaniu używa tagu dist npm `dev`.

    Jednolinijkowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator dla Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały rozwojowe](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze bity?">
    Dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja do modyfikacji (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Otrzymasz lokalne repozytorium, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czyste klonowanie, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Kanały rozwojowe](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i wdrożenie początkowe?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Wdrożenie początkowe:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesi, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **pełnymi danymi wyjściowymi**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z pełnymi danymi wyjściowymi:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji do modyfikacji (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Odpowiednik dla Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja w Windows mówi, że nie znaleziono git albo openclaw nie jest rozpoznawany">
    Dwa częste problemy w Windows:

    **1) Błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem uruchom instalator ponownie.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie znajduje się w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego PATH użytkownika (w Windows nie jest wymagany sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz najwygodniejszej konfiguracji w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe exec w Windows pokazują zniekształcony tekst chiński - co zrobić?">
    Zwykle jest to niezgodność strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - Dane wyjściowe `system.run`/`exec` renderują język chiński jako mojibake
    - To samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie zrestartuj Gateway i spróbuj ponownie uruchomić polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Zgłoszenie #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji do modyfikacji (git)**, aby mieć pełne źródła i dokumentację lokalnie, a potem zapytaj
    swojego bota (albo Claude/Codex) _z tego folderu_, aby mógł przeczytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw w Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linux, a potem uruchom wdrożenie początkowe.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Działa dowolny VPS z Linux. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby połączyć się z Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **centrum hostingu** z popularnymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez interfejs sterowania (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz parować **węzły** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskiwać dostęp do
    lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, pozostawiając
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw o samodzielną aktualizację?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co przerwie aktywną sesję), może wymagać czystego checkoutu git i
    może poprosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz automatyzować z agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi wdrożenie początkowe?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez:

    - **Konfiguracja modelu/uwierzytelniania** (OAuth dostawcy, klucze API, token konfiguracyjny Anthropic oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizacja **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone pluginy kanałów, takie jak QQ Bot)
    - **Instalacja daemona** (LaunchAgent w macOS; jednostka użytkownika systemd w Linux/WSL2)
    - **Kontrole kondycji** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **modelami wyłącznie lokalnymi**, aby Twoje dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max albo OpenAI Codex) to opcjonalne sposoby uwierzytelniania tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczanie API Anthropic
    - **Claude CLI / uwierzytelnianie subskrypcją Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że takie użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długo działających hostów Gateway klucze API Anthropic pozostają bardziej
    przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla narzędzi
    zewnętrznych takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcji, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcją Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, zamiast tego użyj klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją Claude (Claude Pro albo Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że takie użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Token konfiguracyjny Anthropic nadal jest dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla obciążeń produkcyjnych albo wieloużytkownikowych uwierzytelnianie kluczem API Anthropic nadal jest
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    Oznacza to, że Twój **limit przydziału/szybkości Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na zresetowanie okna albo podnieś plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i zwiększ limity w razie potrzeby.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API albo
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma ograniczoną przepustowość.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiska AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla streamingu/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai-codex/gpt-5.5` dla Codex OAuth przez domyślny runner PI. Użyj
    `openai/gpt-5.5` dla bezpośredniego dostępu kluczem API OpenAI. GPT-5.5 może też używać
    subskrypcji/OAuth przez `openai-codex/gpt-5.5` albo natywnych uruchomień serwera aplikacji Codex
    z `openai/gpt-5.5` i `agentRuntime.id: "codex"`.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu uwierzytelniania dla ChatGPT/Codex OAuth.
    Jest to także jawny prefiks modelu PI dla Codex OAuth:

    - `openai/gpt-5.5` = obecna bezpośrednia ścieżka klucza API OpenAI w PI
    - `openai-codex/gpt-5.5` = ścieżka Codex OAuth w PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = natywna ścieżka serwera aplikacji Codex
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie referencja modelu

    Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelniania subskrypcji ChatGPT/Codex, zaloguj się za pomocą
    `openclaw models auth login --provider openai-codex` i używaj
    referencji modeli `openai-codex/*` dla uruchomień PI.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą różnić się od ChatGPT w przeglądarce?">
    Codex OAuth używa zarządzanych przez OpenAI, zależnych od planu okien limitów. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać obecnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT w przeglądarce
    do bezpośredniego dostępu API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **OpenAI Code (Codex) subscription OAuth**.
    OpenAI jawnie zezwala na użycie subskrypcji OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj Gemini CLI lokalnie, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To przechowuje tokeny OAuth w profilach uwierzytelniania na hoście gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnych zabezpieczeń; małe karty ucinają dane i powodują wycieki. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/skwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanych modeli w konkretnym regionie?">
    Wybierz punkty końcowe przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz listować Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele zapasowe pozostały dostępne przy jednoczesnym respektowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, domowy serwer albo urządzenie klasy Raspberry Pi też działa.

    Maca potrzebujesz tylko **do narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) - serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linux lub gdzie indziej. Jeśli chcesz innych narzędzi dostępnych wyłącznie na macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes), [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Wiadomości. **Nie** musi to być Mac mini -
    działa dowolny Mac. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage - serwer BlueBubbles działa na macOS, a Gateway może działać na Linux lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Wiadomości.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszej konfiguracji na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes),
    [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBook Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gateway - zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/canvas oraz `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS lub host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Obserwujemy błędy runtime, zwłaszcza z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych gatewayów.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na gatewayu nieprodukcyjnym
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram ludzkiego nadawcy** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozpoznać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Przypisz każdą **DM** WhatsApp nadawcy (peer `kind: "direct"`, nadawca E.164 jak `+15551234567`) do innego `agentId`, aby każda osoba miała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal przychodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „szybkiego czatu” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie przypisz trasy przychodzące (konto dostawcy lub konkretne peery) do każdego agenta. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozpoznawane w powłokach nielogowania.
    Najnowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między modyfikowalną instalacją git a instalacją npm">
    - **Modyfikowalna instalacja (git):** pełny checkout źródeł, edytowalny, najlepszy dla kontrybutorów.
      Uruchamiasz kompilacje lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tags npm.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacjami npm i git?">
    Tak. Użyj `openclaw update --channel ...`, gdy OpenClaw jest już zainstalowany.
    To **nie usuwa Twoich danych** - zmienia tylko instalację kodu OpenClaw.
    Twój stan (`~/.openclaw`) i obszar roboczy (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm na git:

    ```bash
    openclaw update --channel dev
    ```

    Z git na npm:

    ```bash
    openclaw update --channel stable
    ```

    Dodaj `--dry-run`, aby najpierw podejrzeć planowaną zmianę trybu. Aktualizator uruchamia
    kolejne kroki Doctor, odświeża źródła pluginów dla kanału docelowego i
    restartuje gateway, chyba że przekażesz `--no-restart`.

    Instalator też może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowej: zobacz [Strategia kopii zapasowej](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszego tarcia i akceptujesz uśpienie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do lokalnych plików, żywe okno przeglądarki.
    - **Wady:** uśpienie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają pracę, musi pozostawać wybudzony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka headless** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane domyślnie:** VPS, jeśli wcześniej występowały rozłączenia Gateway. Lokalna instalacja świetnie sprawdza się, gdy aktywnie używasz Maca i chcesz mieć lokalny dostęp do plików lub automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw spowodowanych uśpieniem lub ponownym uruchomieniem, przejrzystsze uprawnienia, łatwiej utrzymać go w działaniu.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarczy do testowania i aktywnego użycia, ale należy spodziewać się przerw, gdy maszyna przechodzi w tryb uśpienia lub instaluje aktualizacje.

    Jeśli chcesz połączyć zalety obu podejść, utrzymuj Gateway na dedykowanym hoście i sparuj laptop jako **Node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB miejsca na dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej jako zapas (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji dla Linuksa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w maszynie wirtualnej i jakie są wymagania?">
    Tak. Traktuj maszynę wirtualną tak samo jak VPS: musi być stale włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway oraz wszystkich kanałów, które włączysz.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najprostsza konfiguracja w stylu maszyny wirtualnej** i zapewnia najlepszą
    zgodność narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w maszynie wirtualnej, zobacz [Maszyna wirtualna macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, Gateway, bezpieczeństwo i więcej)
- [Omówienie instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
