---
read_when:
    - Nowa instalacja, zablokowany proces wdrożenia lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, wprowadzenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'Często zadawane pytania: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-05-10T19:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące szybkiego startu i pierwszego uruchomienia. Informacje o codziennej obsłudze, modelach, uwierzytelnianiu, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja przy pierwszym uruchomieniu

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, aby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć twoją maszynę**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomagający nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im **pełny checkout źródeł** przez
    instalację hackowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, więc agent może czytać kod i dokumentację oraz
    rozumować o dokładnej wersji, której używasz. Zawsze możesz później wrócić do stabilnej wersji,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do audytu.

    Jeśli odkryjesz rzeczywisty błąd lub poprawkę, zgłoś issue w GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki obraz stanu Gateway/agenta i podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy i dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](/pl/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/sam nagłówkowy szkielet
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagalny
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po zakończeniu
    rzeczywistego uruchomienia Heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

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

    Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć pulpit po onboardingu?">
    Kreator otwiera przeglądarkę z czystym (bez tokenu w URL) adresem pulpitu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić pulpit na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie shared-secret, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (albo `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli shared secret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zachowaj bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejanego shared secret, przy założeniu zaufanego hosta gateway); API HTTP nadal wymagają uwierzytelniania shared-secret, chyba że celowo użyjesz private-ingress `none` albo uwierzytelniania HTTP trusted-proxy.
      Nieudane współbieżne próby uwierzytelniania Serve z tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelnienia je zarejestruje, więc druga błędna ponowna próba może już pokazać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący shared secret w ustawieniach pulpitu.
    - **Reverse proxy świadomy tożsamości**: trzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie shared-secret nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Pulpit](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby bind i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zgód exec dla zgód na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity o zgodę do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zgód dla zgód exec

    Polityka exec hosta nadal jest właściwą bramką zgód. Konfiguracja czatu kontroluje tylko, gdzie
    pojawiają się monity o zgodę i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw teraz automatycznie włącza natywne zgody z priorytetem DM, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zgód, ten natywny UI jest ścieżką podstawową; agent powinien dołączyć ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zgody na czacie są niedostępne albo ręczna zgoda jest jedyną ścieżką.
    - Użyj `approvals.exec` tylko wtedy, gdy monity muszą być także przekazywane do innych czatów albo jawnych pokojów operacyjnych.
    - Użyj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy jawnie chcesz, aby monity o zgodę były publikowane z powrotem w pokoju/wątku źródłowym.
    - Zgody Plugin są znowu osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową obsługę plugin-approval-native.

    Krótko: przekazywanie służy do routingu, a konfiguracja klienta natywnego do bogatszego UX specyficznego dla kanału.
    Zobacz [Zgody Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    dysku jako wystarczające do użytku osobistego oraz zauważa, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), **zalecane jest 2GB**, ale nie jest to
    twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a ty możesz sparować **węzły** na laptopie/telefonie dla
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się niedoskonałości.

    - Użyj systemu **64-bitowego** i zachowaj Node >= 22.
    - Preferuj **instalację hackowalną (git)**, aby widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym wykluciu. Jeśli widzisz tę linię **bez odpowiedzi**
    i tokeny pozostają na 0, agent nigdy się nie uruchomił.

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

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie raz uruchom Doctor. To
    zachowuje twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i stan kanałów),
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

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](/pl/help/faq#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie zobaczę, co jest nowego w najnowszej wersji?">
    Sprawdź changelog w GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są grupowane według **Highlights**, **Changes** i
    **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity nieprawidłowo blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz uzyskać dostępu do strony, dokumentacja jest lustrzanie dostępna na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable trafia najpierw do **beta**, a następnie jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednowierszowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (po promocji może być taki sam jak `latest`).
    **Dev** to ruchoma głowica `main` (git); po opublikowaniu używa npm dist-tag `dev`.

    Jednowierszowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały deweloperskie](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Dwie opcje:

    1. **Kanał dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródła.

    2. **Instalacja możliwa do modyfikowania (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daje to lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty klon, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Kanały deweloperskie](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, użyj [Zablokowany instalator](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator się zablokował? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **szczegółowym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta ze szczegółowym wyjściem:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji możliwej do modyfikowania (git):

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

  <Accordion title="Instalacja Windows zgłasza, że nie znaleziono git albo openclaw nie jest rozpoznawany">
    Dwa częste problemy w Windows:

    **1) błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem uruchom instalator jeszcze raz.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego PATH użytkownika (w Windows nie jest potrzebny sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz mieć najpłynniejszą konfigurację w Windows, użyj **WSL2** zamiast natywnego Windows.
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

    Następnie zrestartuj Gateway i ponów polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji możliwej do modyfikowania (git)**, aby mieć pełne źródła i dokumentację lokalnie, a następnie zapytaj
    swojego bota (albo Claude/Codex) _z tego folderu_, aby mógł przeczytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem Linux, a potem uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik krok po kroku: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Działa dowolny VPS z Linux. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dostać się do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Zdalny dostęp: [Zdalny Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **hub hostingowy** z typowymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a dostęp do niego uzyskujesz
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz parować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, utrzymując
    Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Zdalny dostęp: [Zdalny Gateway](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [CLI Nodes](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby sam się zaktualizował?">
    Krótka odpowiedź: **możliwe, niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co przerywa aktywną sesję), może wymagać czystego checkoutu git i
    może poprosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz zautomatyzować z agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez:

    - **Konfigurację modelu/auth** (provider OAuth, klucze API, Anthropic setup-token oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Pluginy kanałów, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole kondycji** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **modelami wyłącznie lokalnymi**, aby dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania u tych providerów.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczanie Anthropic API
    - **Claude CLI / auth subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długo działających hostów gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje również inne hostowane opcje w stylu subskrypcji, w tym
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
    OpenClaw traktuje auth subskrypcji Claude i użycie `claude -p` jako usankcjonowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token nadal jest dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla obciążeń produkcyjnych lub wieloużytkownikowych auth przez klucz API Anthropic nadal jest
    bezpieczniejszym, bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    Oznacza to, że Twój **limit quota/rate limit Anthropic** został wyczerpany dla bieżącego okna. Jeśli
    używasz **Claude CLI**, poczekaj na reset okna albo podnieś swój plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i w razie potrzeby podnieś limity.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    wersji beta kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy provider ma ograniczenie szybkości.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego providera **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiskowe AWS, OpenClaw może automatycznie wykryć katalog streaming/tekst Bedrock i scalić go jako niejawnego providera `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis providera. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Providerzy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` w typowej konfiguracji: uwierzytelnianie subskrypcją ChatGPT/Codex plus
    natywne wykonywanie na serwerze aplikacji Codex. Odwołania do modeli `openai-codex/gpt-*` to
    starsza konfiguracja naprawiana przez `openclaw doctor --fix`. Bezpośredni dostęp kluczem API OpenAI
    pozostaje dostępny dla powierzchni API OpenAI niebędących agentami oraz dla modeli agentów
    przez uporządkowany profil klucza API `openai-codex`.
    Zobacz [Providerzy modeli](/pl/concepts/model-providers) i [Wprowadzanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator providera i profilu uwierzytelniania dla OAuth ChatGPT/Codex.
    Starsze konfiguracje używały go także jako prefiksu modelu:

    - `openai/gpt-5.5` = uwierzytelnianie subskrypcją ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex dla tur agentów
    - `openai-codex/gpt-5.5` = starsza trasa modelu naprawiana przez `openclaw doctor --fix`
    - `openai/gpt-5.5` plus uporządkowany profil klucza API `openai-codex` = uwierzytelnianie kluczem API dla modelu agenta OpenAI
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie odwołanie do modelu

    Jeśli chcesz używać ścieżki bezpośredniego rozliczania/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelnianie subskrypcją ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex`. Pozostaw odwołanie do modelu jako
    `openai/gpt-5.5`; odwołania do modeli `openai-codex/*` to starsza konfiguracja, którą
    `openclaw doctor --fix` przepisuje.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT web?">
    OAuth Codex używa zarządzanych przez OpenAI, zależnych od planu okien limitów. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitów providera w
    `openclaw models status`, ale nie tworzy ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz używać ścieżki bezpośredniego
    rozliczania/limitów OpenAI Platform, użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (OAuth Codex)?">
    Tak. OpenClaw w pełni obsługuje **OAuth subskrypcji OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na używanie OAuth subskrypcji w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wprowadzanie może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Providerzy modeli](/pl/concepts/model-providers) i [Wprowadzanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować OAuth Gemini CLI?">
    Gemini CLI używa **przepływu uwierzytelniania pluginu**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj Gemini CLI lokalnie, aby `gemini` był w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gatewaya

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście gatewaya. Szczegóły: [Providerzy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do luźnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnych zabezpieczeń; małe karty obcinają i wyciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko wstrzyknięcia promptu - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanego modelu w konkretnym regionie?">
    Wybierz punkty końcowe przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wyświetlać Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele zapasowe pozostały dostępne przy jednoczesnym respektowaniu wybranego providera regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Maca Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako stale włączony host, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też działa.

    Maca potrzebujesz tylko **do narzędzi dostępnych wyłącznie w macOS**. Dla iMessage użyj [iMessage](/pl/channels/imessage) z `imsg` na dowolnym Macu zalogowanym do Wiadomości. Jeśli Gateway działa na Linux lub gdzie indziej, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na tym Macu. Jeśli chcesz innych narzędzi dostępnych wyłącznie w macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes), [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Maca mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia z macOS** zalogowanego do Wiadomości. To **nie** musi być Mac mini -
    działa dowolny Mac. **Użyj [iMessage](/pl/channels/imessage)** z `imsg`; Gateway może działać na tym Macu albo może działać gdzie indziej z wrapperem SSH `cliPath`.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu zalogowanym do Wiadomości.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes),
    [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Maca mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gatewaya - dostarczają dodatkowe
    możliwości, takie jak ekran/kamera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Macu mini (stale włączony).
    - MacBook Pro uruchamia aplikację macOS albo host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, zwłaszcza z WhatsApp i Telegram.
    Użyj **Node** dla stabilnych gatewayów.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na gatewayu nieprodukcyjnym
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram ludzkiego nadawcy** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników. Jeśli masz już w konfiguracji starsze wpisy `@username`, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż **DM** WhatsApp każdego nadawcy (peer `kind: "direct"`, nadawca E.164, np. `+15551234567`) z innym `agentId`, aby każda osoba miała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal przychodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „fast chat” i agenta „Opus for coding”?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto providera lub konkretne peery) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach nielogowania.
    Ostatnie kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach systemd na Linux (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między hakowalną instalacją git a instalacją npm">
    - **Instalacja hakowalna (git):** pełny checkout źródeł, edytowalny, najlepszy dla kontrybutorów.
      Uruchamiasz kompilacje lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tagów npm.

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
    działania następcze Doctor, odświeża źródła pluginów dla kanału docelowego i
    ponownie uruchamia Gateway, chyba że przekażesz `--no-restart`.

    Instalator też może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowej: zobacz [Strategia kopii zapasowej](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najniższym progu wejścia i akceptujesz uśpienia/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do plików lokalnych, aktywne okno przeglądarki.
    - **Wady:** uśpienie/spadki sieci = rozłączenia, aktualizacje/restarty systemu przerywają działanie, musi pozostawać aktywny.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga dotycząca OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny rzeczywisty kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej występowały rozłączenia gateway. Lokalnie sprawdza się świetnie, gdy aktywnie używasz Maca i chcesz mieć dostęp do plików lokalnych lub automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez uśpienie/restarty, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarczający do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna uśnie lub będzie się aktualizować.

    Jeśli chcesz połączyć oba podejścia, utrzymuj Gateway na dedykowanym hoście i sparuj laptop jako **Node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debiana/Ubuntu). Ścieżka instalacji dla Linuksa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w maszynie VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway oraz wszystkich kanałów, które włączysz.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
