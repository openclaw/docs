---
read_when:
    - Nowa instalacja, zawieszona konfiguracja początkowa lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'Często zadawane pytania: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-05-02T22:19:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  Szybki start i pytania oraz odpowiedzi dotyczące pierwszego uruchomienia. Informacje o codziennej obsłudze, modelach, uwierzytelnianiu, sesjach i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja pierwszego uruchomienia

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twój komputer**. To znacznie skuteczniejsze niż pytanie na Discord, ponieważ większość przypadków „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**, których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację na poziomie komputera (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im **pełne pobranie źródeł** przez instalację hackowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z pobranego repozytorium git**, więc agent może czytać kod i dokumentację oraz rozumować o dokładnej wersji, której używasz. Zawsze możesz później wrócić do wersji stabilnej, uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a potem wykonywał tylko niezbędne polecenia. Dzięki temu zmiany pozostają małe i łatwiejsze do audytu.

    Jeśli znajdziesz rzeczywisty błąd lub poprawkę, zgłoś problem na GitHub albo wyślij PR:
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
    - `openclaw models status`: sprawdza uwierzytelnianie dostawców i dostępność modeli.
    - `openclaw doctor`: waliduje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](/pl/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle się pomija. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/sam nagłówkowy szkielet
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagalny
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po zakończeniu rzeczywistego uruchomienia Heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

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

  <Accordion title="Jak otworzyć pulpit po onboardingu?">
    Kreator otwiera przeglądarkę z czystym (bez tokenu w URL) adresem pulpitu od razu po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tym samym komputerze.
  </Accordion>

  <Accordion title="Jak uwierzytelnić pulpit na localhost i zdalnie?">
    **Localhost (ten sam komputer):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli wspólny sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zachowaj wiązanie z loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejanego wspólnego sekretu, przy założeniu zaufanego hosta Gateway); HTTP API nadal wymagają uwierzytelniania wspólnym sekretem, chyba że celowo użyjesz prywatnego wejścia `none` albo uwierzytelniania HTTP przez zaufane proxy.
      Nieudane równoczesne próby uwierzytelniania Serve od tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc druga błędna ponowna próba może już pokazać `retry later`.
    - **Wiązanie Tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący wspólny sekret w ustawieniach pulpitu.
    - **Reverse proxy świadome tożsamości**: trzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a potem otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie wspólnym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Pulpit](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby wiązania i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego istnieją dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje monity zatwierdzeń do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzeń. Konfiguracja czatu kontroluje tylko, gdzie pojawiają się monity zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` na tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany natywny kanał może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw automatycznie włącza teraz natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` nie jest ustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest główną ścieżką; agent powinien zawierać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być także przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy jawnie chcesz publikować monity zatwierdzeń z powrotem w pierwotnym pokoju/wątku.
    - Zatwierdzenia Pluginów są znów oddzielne: domyślnie używają `/approve` na tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują obsługę plugin-approval-native na wierzchu.

    Krótko: przekazywanie służy do routingu, konfiguracja natywnego klienta do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku jako wystarczające do użytku osobistego oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), **zalecane są 2GB**, ale nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz parować **węzły** na laptopie/telefonie dla lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się niedociągnięć.

    - Użyj systemu operacyjnego **64-bit** i utrzymuj Node >= 22.
    - Preferuj **instalację hackowalną (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem ze **zgodnością ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding się nie wykluwa. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też automatycznie „Wake up, my friend!” przy pierwszym wykluciu. Jeśli widzisz tę linię **bez odpowiedzi**, a tokeny pozostają na 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

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

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nowy komputer (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a potem uruchom Doctor raz. To zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowym komputerze.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starego komputera.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane uwierzytelniające WhatsApp, sesje i pamięć. Jeśli jesteś w trybie zdalnym, pamiętaj, że host Gateway posiada magazyn sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHub, tworzysz kopię zapasową **pamięci i plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](/pl/help/faq#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie zobaczę, co nowego jest w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna sekcja z datą jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Highlights**, **Changes** i **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie mogę uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a potem spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz dotrzeć do strony, dokumentacja jest zdublowana na GitHubie:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testowania

    Zwykle wydanie stable najpierw trafia na **beta**, a potem jawny krok
    promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednowierszowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (po promocji może odpowiadać `latest`).
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

    Więcej szczegółów: [Kanały rozwojowe](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze bity?">
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

    Dzięki temu otrzymasz lokalne repo, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

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
    - **Onboarding:** 5-15 minut w zależności od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, użyj [Instalator utknął](#quick-start-and-first-run-setup)
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

    **1) błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem uruchom instalator ponownie.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (w Windows nie jest potrzebny sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po aktualizacji PATH.

    Jeśli chcesz najpłynniejszą konfigurację w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec w Windows pokazuje zniekształcony chiński tekst - co zrobić?">
    To zwykle niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - wyjście `system.run`/`exec` renderuje chiński jako mojibake
    - To samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie uruchom ponownie Gateway i ponów polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal możesz odtworzyć to w najnowszym OpenClaw, śledź/zgłoś to tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji do modyfikacji (git)**, aby mieć pełne źródła i dokumentację lokalnie, a potem zapytaj
    swojego bota (albo Claude/Codex) _z tego folderu_, aby mógł odczytać repo i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a potem uruchom onboarding.

    - Szybka ścieżka dla Linuxa + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Działa dowolny VPS z Linuxem. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dotrzeć do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **centrum hostingu** z popularnymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a dostęp uzyskujesz
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i wykonuj jego kopie zapasowe.

    Możesz sparować **węzły** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, utrzymując
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby zaktualizował się sam?">
    Krótka odpowiedź: **możliwe, niezalecane**. Przepływ aktualizacji może ponownie uruchomić
    Gateway (co zrywa aktywną sesję), może wymagać czystego checkoutu git i
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
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez:

    - **Konfigurację modelu/uwierzytelniania** (OAuth dostawcy, klucze API, setup-token Anthropic oraz opcje modeli lokalnych, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone pluginy kanałów, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole zdrowia** i wybór **skills**

    Ostrzega również, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inni) albo z
    **wyłącznie lokalnymi modelami**, aby Twoje dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max albo OpenAI Codex) to opcjonalne sposoby uwierzytelniania tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczanie API Anthropic
    - **Claude CLI / uwierzytelnianie subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwałych hostów Gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje także inne hostowane opcje w stylu subskrypcji, w tym
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
    OpenClaw traktuje uwierzytelnianie subskrypcji Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalną konfigurację po stronie serwera, zamiast tego użyj klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token nadal jest dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla produkcyjnych albo wieloużytkownikowych obciążeń uwierzytelnianie kluczem API Anthropic nadal jest
    bezpieczniejszym, bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    To oznacza, że Twój **limit quota/rate Anthropic** został wyczerpany dla bieżącego okna. Jeśli
    używasz **Claude CLI**, poczekaj na zresetowanie okna albo przejdź na wyższy plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i podnieś limity w razie potrzeby.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    wersji beta kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    dane uwierzytelniające kwalifikują się do rozliczania długiego kontekstu (rozliczanie kluczem API albo
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model awaryjny**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma ograniczenie liczby żądań.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiskowe AWS, OpenClaw może automatycznie wykryć katalog streaming/tekst Bedrock i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) oraz [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ klucza, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla typowej konfiguracji:
    uwierzytelnianie subskrypcją ChatGPT/Codex plus natywne wykonywanie przez serwer aplikacji Codex. Użyj
    `openai-codex/gpt-5.5` tylko wtedy, gdy chcesz użyć Codex OAuth przez domyślny
    runner PI. Użyj `openai/gpt-5.5` bez nadpisania runtime Codex dla
    bezpośredniego dostępu przez klucz API OpenAI.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) oraz [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu uwierzytelniania dla ChatGPT/Codex OAuth.
    To także jawny prefiks modelu PI dla Codex OAuth:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = uwierzytelnianie subskrypcją ChatGPT/Codex z natywnym runtime Codex
    - `openai-codex/gpt-5.5` = ścieżka Codex OAuth w PI
    - `openai/gpt-5.5` bez nadpisania runtime Codex = bezpośrednia ścieżka klucza API OpenAI w PI
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie odwołanie do modelu

    Jeśli chcesz używać bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelnianie subskrypcją ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex`. Dla natywnego runtime Codex
    zachowaj odwołanie do modelu jako `openai/gpt-5.5` i ustaw
    `agentRuntime.id: "codex"`. Odwołań do modeli `openai-codex/*` używaj tylko dla uruchomień
    PI.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą się różnić od ChatGPT w przeglądarce?">
    Codex OAuth używa zarządzanych przez OpenAI okien limitów zależnych od planu. W praktyce
    te limity mogą różnić się od doświadczenia na stronie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz używać bezpośredniej ścieżki
    rozliczeń/limitów OpenAI Platform, użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjne OAuth OpenAI Code (Codex)**.
    OpenAI jawnie pozwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) oraz [Onboarding (CLI)](/pl/start/wizard).

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
    5. Jeśli żądania zawodzą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście Gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do zwykłych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnego bezpieczeństwa; małe karty obcinają i ujawniają dane. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/skwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanego modelu w konkretnym regionie?">
    Wybierz endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele awaryjne pozostały dostępne przy jednoczesnym respektowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też działa.

    Mac jest potrzebny tylko **do narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) - serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linux lub gdzie indziej. Jeśli chcesz używać innych narzędzi dostępnych wyłącznie na macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego w Wiadomościach. To **nie** musi być Mac mini -
    dowolny Mac wystarczy. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage - serwer BlueBubbles działa na macOS, a Gateway może działać na Linux lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym w Wiadomościach.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBook Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gateway - dostarczają dodatkowe
    możliwości, takie jak ekran/kamera/canvas oraz `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy runtime, zwłaszcza z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych Gateway.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na nieprodukcyjnym Gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram nadawcy-człowieka** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij DM do `@userinfobot` albo `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż **DM** WhatsApp każdego nadawcy (peer `kind: "direct"`, nadawca E.164, np. `+15551234567`) z innym `agentId`, aby każda osoba dostała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal wychodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) oraz [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta do „szybkiego czatu” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny domyślny model, a potem powiąż trasy przychodzące (konto dostawcy albo konkretne peery) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) oraz [Konfiguracja](/pl/gateway/configuration).
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
    Najnowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między hakowalną instalacją git a instalacją npm">
    - **Hakowalna instalacja (git):** pełny checkout źródeł, edytowalny, najlepszy dla kontrybutorów.
      Uruchamiasz kompilacje lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tagów npm.

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
    działania następcze Doctor, odświeża źródła Plugin dla kanału docelowego i
    restartuje Gateway, chyba że przekażesz `--no-restart`.

    Instalator też może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowej: zobacz [Strategia kopii zapasowej](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchomić Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najmniejszym tarciu i akceptujesz uśpienie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do plików lokalnych, aktywne okno przeglądarki.
    - **Wady:** uśpienie/problemy z siecią = rozłączenia, aktualizacje/restarty systemu przerywają pracę, urządzenie musi pozostać aktywne.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiejsze utrzymanie działania.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga dotycząca OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej występowały rozłączenia gateway. Lokalnie sprawdza się świetnie, gdy aktywnie używasz Maca i chcesz mieć dostęp do plików lokalnych albo automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez uśpienie/restart, czystsze uprawnienia, łatwiejsze utrzymanie działania.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarczający do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przejdzie w uśpienie lub zainstaluje aktualizacje.

    Jeśli chcesz połączyć oba podejścia, utrzymuj Gateway na dedykowanym hoście i sparuj laptop jako **węzeł** dla narzędzi lokalnego ekranu/kamery/wykonywania poleceń. Zobacz [Węzły](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Bezwzględne minimum:** 1 vCPU, 1 GB RAM, około 500 MB dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej jako zapas (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą wymagać dużo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji dla Linuksa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w maszynie wirtualnej i jakie są wymagania?">
    Tak. Traktuj maszynę wirtualną tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczającą ilość
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Wytyczne bazowe:

    - **Bezwzględne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu maszyny wirtualnej** i zapewnia najlepszą
    zgodność narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w maszynie wirtualnej, zobacz [Maszyna wirtualna macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Omówienie instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
