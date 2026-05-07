---
read_when:
    - Nowa instalacja, zablokowany proces wprowadzania lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, onboarding, uwierzytelnianie, subskrypcje, początkowe awarie'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-05-07T13:18:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące szybkiego startu oraz pierwszego uruchomienia. Codzienne operacje, modele, uwierzytelnianie, sesje
  i rozwiązywanie problemów opisuje główne [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja przy pierwszym uruchomieniu

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, aby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **zobaczyć twoją maszynę**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**, których
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
    wnioskować o dokładnej wersji, którą uruchamiasz. Zawsze możesz później wrócić do wersji stable,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do sprawdzenia.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki obraz stanu gateway/agent + podstawowa konfiguracja.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy + dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](/pl/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/same nagłówki szkielet
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagany
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wykonania są przesuwane dopiero po ukończeniu
    prawdziwego uruchomienia heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i używanie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (kontrybutorzy/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom ją przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym (bez tokenizacji) adresem URL dashboardu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli współdzielony sekret nie jest jeszcze skonfigurowany, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zachowaj bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejanego współdzielonego sekretu, przy założeniu zaufanego hosta Gateway); API HTTP nadal wymagają uwierzytelniania współdzielonym sekretem, chyba że celowo używasz private-ingress `none` albo uwierzytelniania HTTP trusted-proxy.
      Błędne równoczesne próby uwierzytelniania Serve od tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc druga błędna ponowna próba może już pokazać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący współdzielony sekret w ustawieniach dashboardu.
    - **Reverse proxy świadome tożsamości**: umieść Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; jeśli pojawi się monit, wklej skonfigurowany token lub hasło.

    Zobacz [Dashboard](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby bind i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzeń exec dla zatwierdzeń czatu?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity zatwierdzeń do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Polityka exec hosta nadal jest prawdziwą bramką zatwierdzeń. Konfiguracja czatu kontroluje tylko, gdzie
    pojawiają się monity zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany natywny kanał może bezpiecznie wywnioskować zatwierdzających, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być też przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy wyraźnie chcesz, aby monity zatwierdzeń były publikowane z powrotem w pierwotnym pokoju/wątku.
    - Zatwierdzenia Plugin są znów osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre natywne kanały utrzymują dodatkową obsługę plugin-approval-native.

    W skrócie: przekazywanie służy do routingu, a konfiguracja natywnego klienta do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Node **>= 22** jest wymagany. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    dysku jako wystarczające do użytku osobistego oraz zauważa, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), zalecane jest **2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a ty możesz parować **węzły** na laptopie/telefonie do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    W skrócie: działa, ale spodziewaj się szorstkich krawędzi.

    - Użyj **64-bitowego** systemu operacyjnego i utrzymuj Node >= 22.
    - Preferuj **instalację hackable (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz tę linię **bez odpowiedzi**,
    a tokeny zostają na 0, agent nigdy się nie uruchomił.

    1. Zrestartuj Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + uwierzytelnianie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal się zawiesza, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa oraz że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść swoją konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom raz Doctor. To
    utrzymuje bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i stan kanałów),
    o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, poświadczenia WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHub, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](/pl/help/faq#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co jest nowe w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli najwyższa sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Highlights**, **Changes** i
    **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity nieprawidłowo blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a potem spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz uzyskać dostępu do strony, dokumentacja jest zdublowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable najpierw trafia do **beta**, a potem jawny
    krok promowania przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promowaniu.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się beta od dev?">
    **Beta** to npm dist-tag `beta` (po promowaniu może odpowiadać `latest`).
    **Dev** to ruchoma głowica `main` (git); po opublikowaniu używa npm dist-tag `dev`.

    Jednolinijkowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały rozwojowe](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Dwie opcje:

    1. **Kanał dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja do modyfikacji (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dzięki temu otrzymasz lokalne repozytorium, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty klon, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Kanały rozwojowe](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesi, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **pełnym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z pełnym wyjściem:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji do modyfikacji (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Odpowiednik w Windows (PowerShell):

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
    - Zamknij i ponownie otwórz PowerShell, a następnie uruchom instalator ponownie.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego PATH użytkownika (w Windows nie jest potrzebny sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz najpłynniejszej konfiguracji w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec w Windows pokazuje zniekształcony tekst chiński - co zrobić?">
    Zwykle jest to niezgodność strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - wyjście `system.run`/`exec` renderuje chiński jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

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

    Jeśli nadal możesz odtworzyć ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

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
    Krótka odpowiedź: skorzystaj z przewodnika dla Linux, a potem uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Działa dowolny VPS z Linux. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby uzyskać dostęp do Gateway.

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
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, utrzymując
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [CLI Nodes](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby zaktualizował się sam?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co zrywa aktywną sesję), może wymagać czystego git checkout i
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

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza Cię przez:

    - **Konfigurację modelu/auth** (OAuth dostawcy, klucze API, setup-token Anthropic oraz opcje modeli lokalnych, takie jak LM Studio)
    - lokalizację **Workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Plugin kanałów, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole kondycji** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, żeby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inni) albo z
    **modelami wyłącznie lokalnymi**, aby Twoje dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max albo OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział jest następujący:

    - **Klucz API Anthropic**: normalne rozliczanie Anthropic API
    - **Claude CLI / auth subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwale działających hostów gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcji, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
    OpenClaw traktuje auth subskrypcji Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji
    chyba że Anthropic opublikuje nową politykę.

    setup-token Anthropic jest nadal dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub obciążeń wielu użytkowników auth kluczem API Anthropic jest nadal
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) oraz [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    Oznacza to, że Twój **limit quota/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na zresetowanie okna albo przejdź na wyższy plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i zwiększ limity w razie potrzeby.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API albo
    ścieżka logowania OpenClaw Claude z włączoną opcją Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca jest ograniczany limitami.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki env AWS, OpenClaw może automatycznie wykryć katalog streaming/text Bedrock i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla typowej konfiguracji:
    uwierzytelnianie subskrypcją ChatGPT/Codex plus natywne wykonywanie przez serwer aplikacji Codex. Użyj
    `openai-codex/gpt-5.5` tylko wtedy, gdy chcesz OAuth Codex przez domyślne
    środowisko wykonawcze Codex. Bezpośredni dostęp kluczem API OpenAI pozostaje dostępny dla powierzchni
    API OpenAI niebędących agentami oraz dla modeli agentów przez uporządkowany
    profil klucza API `openai-codex`.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu uwierzytelniania dla OAuth ChatGPT/Codex.
    Starsze konfiguracje używały go także jako prefiksu modelu:

    - `openai/gpt-5.5` = uwierzytelnianie subskrypcją ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex dla tur agenta
    - `openai-codex/gpt-5.5` = starsza trasa modelu naprawiana przez `openclaw doctor --fix`
    - `openai/gpt-5.5` plus uporządkowany profil klucza API `openai-codex` = uwierzytelnianie kluczem API dla modelu agenta OpenAI
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie referencja modelu

    Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelnianie subskrypcją ChatGPT/Codex, zaloguj się za pomocą
    `openclaw models auth login --provider openai-codex`. Zachowaj referencję modelu jako
    `openai/gpt-5.5`; referencje modeli `openai-codex/*` są starszą konfiguracją, którą
    `openclaw doctor --fix` przepisuje.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT web?">
    OAuth Codex używa zarządzanych przez OpenAI, zależnych od planu okien limitów. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie tworzy ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (OAuth Codex)?">
    Tak. OpenClaw w pełni obsługuje **OAuth subskrypcji OpenAI Code (Codex)**.
    OpenAI wyraźnie zezwala na użycie OAuth subskrypcji w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może uruchomić dla Ciebie przepływ OAuth.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować OAuth Gemini CLI?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` albo `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do luźnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnego bezpieczeństwa; małe karty obcinają i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanych modeli w konkretnym regionie?">
    Wybierz endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele zapasowe pozostały dostępne przy jednoczesnym respektowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako stale włączony host, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też działa.

    Potrzebujesz Maca tylko **do narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) - serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie albo gdzie indziej. Jeśli chcesz innych narzędzi dostępnych wyłącznie na macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. Nie musi to być Mac mini -
    działa dowolny Mac. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage - serwer BlueBubbles działa na macOS, podczas gdy Gateway może działać na Linuxie albo gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchomienia OpenClaw, czy mogę podłączyć go do mojego MacBooka Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gateway - zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska wykonawczego, szczególnie z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych gatewayów.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gatewayu
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram ludzkiego nadawcy** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja pyta tylko o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij DM do `@userinfobot` albo `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż **DM** WhatsApp każdego nadawcy (peer `kind: "direct"`, nadawca E.164 taki jak `+15551234567`) z innym `agentId`, aby każda osoba miała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal pochodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta "szybkiego czatu" i agenta "Opus do kodowania"?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto dostawcy albo konkretne peery) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach bez logowania.
    Najnowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) oraz respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między hackowalną instalacją git a instalacją npm">
    - **Hackowalna instalacja (git):** pełny checkout źródeł, edytowalny, najlepszy dla współtwórców.
      Uruchamiasz kompilacje lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tags npm.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizowanie](/pl/install/updating).

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
    czynności następcze Doctor, odświeża źródła pluginów dla kanału docelowego i
    restartuje gateway, chyba że przekażesz `--no-restart`.

    Instalator też może wymusić jeden z trybów:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowej: zobacz [Strategia kopii zapasowych](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najmniejszym tarciu i akceptujesz uśpienie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki na żywo.
    - **Wady:** uśpienie/problemy z siecią = rozłączenia, aktualizacje/restarty systemu przerywają działanie, komputer musi pozostawać aktywny.

    **VPS / chmura**

    - **Zalety:** stale dostępny, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga dotycząca OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają bez problemu z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej występowały rozłączenia Gateway. Lokalnie sprawdza się świetnie, gdy aktywnie używasz Maca i chcesz mieć dostęp do lokalnych plików albo automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane dla niezawodności i izolacji**.

    - **Dedykowany host (VPS/Mac mini/Pi):** stale dostępny, mniej przerw spowodowanych uśpieniem/restartem, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarczający do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przejdzie w stan uśpienia lub będzie się aktualizować.

    Jeśli chcesz połączyć zalety obu podejść, trzymaj Gateway na dedykowanym hoście i sparuj laptopa jako **Node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą wymagać sporo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debiana/Ubuntu). Ścieżka instalacji dla Linuksa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w maszynie wirtualnej i jakie są wymagania?">
    Tak. Traktuj maszynę wirtualną tak samo jak VPS: musi być stale włączona, osiągalna i mieć wystarczającą ilość
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli korzystasz z Windows, **WSL2 to najłatwiejszy wariant konfiguracji w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w maszynie wirtualnej, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
