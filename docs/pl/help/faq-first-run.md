---
read_when:
    - Nowa instalacja, zablokowane wdrażanie lub błędy przy pierwszym uruchomieniu
    - Wybór subskrypcji uwierzytelniania i dostawcy
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć dashboardu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'Często zadawane pytania: szybki start i konfiguracja pierwszego uruchomienia — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-06-27T17:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące szybkiego startu i pierwszego uruchomienia. Informacje o codziennej obsłudze, modelach, uwierzytelnianiu, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja przy pierwszym uruchomieniu

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twoją maszynę**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im **pełne pobranie źródeł** przez
    hackowalną instalację (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z pobranego repozytorium git**, więc agent może czytać kod i dokumentację oraz
    rozumować o dokładnej wersji, którą uruchamiasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany pozostają małe i łatwiejsze do audytu.

    Jeśli znajdziesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHub albo wyślij PR:
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
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze, komentarze, nagłówek, blok kodu albo pusty szkielet listy kontrolnej
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie nadszedł
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu terminu są przesuwane dopiero po zakończeniu rzeczywistego uruchomienia heartbeat.
    Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zazwyczaj uruchamiasz Gateway na porcie **18789**.

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
    Kreator otwiera przeglądarkę z czystym (bez tokenu w URL) adresem pulpitu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić pulpit na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (albo `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli współdzielony sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zachowaj bindowanie do loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania uwierzytelniania Control UI/WebSocket (bez wklejanego współdzielonego sekretu, przy założeniu zaufanego hosta gateway); API HTTP nadal wymagają uwierzytelniania współdzielonym sekretem, chyba że celowo używasz `none` dla prywatnego wejścia albo uwierzytelniania HTTP zaufanego proxy.
      Nieudane równoczesne próby uwierzytelnienia Serve od tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelnienia je zapisze, więc druga nieudana ponowna próba może już pokazać `retry later`.
    - **Bindowanie do tailnetu**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a potem wklej pasujący współdzielony sekret w ustawieniach pulpitu.
    - **Reverse proxy świadome tożsamości**: trzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a potem otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Szczegóły trybów bindowania i uwierzytelniania znajdziesz w [Pulpit](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web).

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity o zatwierdzenie do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko, gdzie
    pojawiają się monity o zatwierdzenie i jak można na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować zatwierdzających, OpenClaw automatycznie włącza teraz natywne zatwierdzenia z priorytetem DM, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być też przekazywane do innych czatów albo jawnych pokojów ops.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy jawnie chcesz, aby monity o zatwierdzenie były publikowane z powrotem w pokoju/temacie źródłowym.
    - Zatwierdzenia Plugin są znowu oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową natywną obsługę zatwierdzania Plugin.

    Krótko: przekazywanie służy do routingu, a konfiguracja klienta natywnego do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    dysku jako wystarczające do użytku osobistego oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), zalecane jest **2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: małe Raspberry Pi/VPS może hostować Gateway, a z laptopa/telefonu możesz parować **węzły** do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dla instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się ostrych krawędzi.

    - Użyj **64-bitowego** systemu operacyjnego i utrzymuj Node >= 22.
    - Preferuj **hackowalną instalację (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym wykluciu. Jeśli widzisz tę linię bez **żadnej odpowiedzi**
    i tokeny pozostają na 0, agent nigdy się nie uruchomił.

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

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść swoją konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a potem raz uruchom Doctor. To
    zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historia sesji, uwierzytelnianie i stan kanałów),
    o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane logowania WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHub, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](/pl/help/faq#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego jest w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Najważniejsze**, **Zmiany** i
    **Poprawki** (plus sekcje dokumentacji/inne, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie mogę uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity nieprawidłowo blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a potem spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz otworzyć strony, dokumentacja jest zmirrorowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable trafia najpierw do **beta**, a następnie jawny
    krok promowania przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    w razie potrzeby publikować bezpośrednio do `latest`. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promowaniu.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w sekcji accordion poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się beta od dev?">
    **Beta** to npm dist-tag `beta` (po promowaniu może odpowiadać `latest`).
    **Dev** to zmieniający się aktualny stan `main` (git); po opublikowaniu używa npm dist-tag `dev`.

    Jednolinijkowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały developerskie](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Dwie opcje:

    1. **Kanał dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja możliwa do modyfikowania (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dzięki temu otrzymasz lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czyste klonowanie, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Kanały developerskie](/pl/install/development-channels),
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
    Uruchom instalator ponownie z **pełnymi komunikatami wyjściowymi**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z pełnymi komunikatami:

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

  <Accordion title="Instalacja w Windows zgłasza, że git nie został znaleziony albo openclaw nie jest rozpoznawany">
    Dwa typowe problemy w Windows:

    **1) błąd npm spawn git / git nie został znaleziony**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem ponownie uruchom instalator.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie znajduje się w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (w Windows sufiks `\bin` nie jest potrzebny; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Do konfiguracji desktopowej użyj natywnej aplikacji **Windows Hub**. Do konfiguracji
    wyłącznie terminalowej obsługiwane są zarówno ścieżki instalatora PowerShell, jak i WSL2 Gateway.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe exec w Windows pokazują zniekształcony chiński tekst - co zrobić?">
    Zwykle jest to niezgodność strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - dane wyjściowe `system.run`/`exec` renderują chiński jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

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

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji możliwej do modyfikowania (git)**, aby mieć pełne źródła i dokumentację lokalnie, a następnie zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł przeczytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a następnie uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Dowolny Linux VPS zadziała. Zainstaluj na serwerze, a następnie użyj SSH/Tailscale, aby połączyć się z Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **hub hostingowy** z typowymi providerami. Wybierz jeden i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy providerzy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a dostęp uzyskujesz
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **węzły** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, utrzymując
    Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby zaktualizował się sam?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może ponownie uruchomić
    Gateway (co rozłącza aktywną sesję), może wymagać czystego git checkout i
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

    - **Konfigurację modelu/auth** (OAuth providera, klucze API, Anthropic setup-token oraz opcje modeli lokalnych, takie jak LM Studio)
    - Lokalizację **workspace** + pliki startowe
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Pluginy kanałów, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - Wybór **kontroli stanu** i **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **modelami wyłącznie lokalnymi**, aby Twoje dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) to opcjonalne sposoby uwierzytelniania u tych providerów.

    W przypadku Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczanie Anthropic API
    - **Claude CLI / auth subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako sankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    W przypadku długodziałających hostów gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje także inne hostowane opcje w stylu subskrypcji, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Z.AI (GLM)](/pl/providers/zai),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
    OpenClaw traktuje auth subskrypcji Claude i użycie `claude -p` jako sankcjonowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako sankcjonowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token jest nadal dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    W przypadku obciążeń produkcyjnych lub wieloużytkownikowych auth za pomocą klucza API Anthropic jest nadal
    bezpieczniejszym, bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele
    GLM](/pl/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    Oznacza to, że Twój **limit quota/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na zresetowanie okna albo podnieś plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    okna kontekstu 1M Anthropic (model Claude 4.x 1M obsługujący GA albo starsza
    konfiguracja `context1m: true`). Działa to tylko wtedy, gdy Twoje poświadczenie kwalifikuje się
    do rozliczania długiego kontekstu (rozliczanie klucza API albo ścieżka logowania Claude w OpenClaw
    z włączonym Extra Usage).

    Wskazówka: ustaw **model awaryjny**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma ograniczoną przepustowość.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiskowe AWS, OpenClaw może automatycznie wykryć katalog Bedrock do strumieniowania/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` dla typowej konfiguracji: uwierzytelnianie subskrypcji ChatGPT/Codex plus
    natywne wykonywanie przez serwer aplikacji Codex. Starsze odwołania GPT Codex to
    starsza konfiguracja naprawiana przez `openclaw doctor --fix`. Bezpośredni dostęp
    kluczem API OpenAI pozostaje dostępny dla powierzchni API OpenAI innych niż agenty oraz dla modeli
    agentów przez uporządkowany profil klucza API `openai`.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina starszy prefiks OpenAI Codex?">
    `openai` to identyfikator dostawcy i profilu uwierzytelniania zarówno dla kluczy API OpenAI, jak i
    OAuth ChatGPT/Codex. Nadal możesz widzieć starszy prefiks OpenAI Codex w starszej konfiguracji i
    ostrzeżeniach migracji.
    Starsze konfiguracje używały go także jako prefiksu modelu:

    - `openai/gpt-5.5` = uwierzytelnianie subskrypcji ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex dla tur agenta
    - starsze odwołanie Codex GPT-5.5 = starsza trasa modelu naprawiana przez `openclaw doctor --fix`
    - `openai/gpt-5.5` plus uporządkowany profil klucza API `openai` = uwierzytelnianie kluczem API dla modelu agenta OpenAI
    - starsze identyfikatory profili uwierzytelniania Codex = starszy identyfikator profilu uwierzytelniania migrowany przez `openclaw doctor --fix`

    Jeśli chcesz korzystać z bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelnianie subskrypcji ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai`. Pozostaw odwołanie do modelu jako
    `openai/gpt-5.5`; starsze odwołania modeli Codex to starsza konfiguracja, którą
    `openclaw doctor --fix` przepisuje.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT w przeglądarce?">
    OAuth Codex używa zarządzanych przez OpenAI okien limitów zależnych od planu. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT w przeglądarce
    do bezpośredniego dostępu API. Jeśli chcesz korzystać z bezpośredniej ścieżki
    rozliczeń/limitów OpenAI Platform, użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji OpenAI (OAuth Codex)?">
    Tak. OpenClaw w pełni obsługuje **OAuth subskrypcji OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie OAuth subskrypcji w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).

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
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` albo `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście Gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do luźnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnego bezpieczeństwa; małe karty obcinają i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch modeli hostowanych w określonym regionie?">
    Wybierz punkty końcowe przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele awaryjne pozostawały dostępne przy jednoczesnym respektowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS albo Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako zawsze włączonego hosta, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też działa.

    Mac jest potrzebny tylko **dla narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [iMessage](/pl/channels/imessage) z `imsg` na dowolnym Macu zalogowanym do Messages. Jeśli Gateway działa na Linuxie albo gdzie indziej, ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na tym Macu. Jeśli chcesz używać innych narzędzi wyłącznie dla macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. To **nie** musi być Mac mini -
    działa dowolny Mac. **Użyj [iMessage](/pl/channels/imessage)** z `imsg`; Gateway może działać na tym Macu albo może działać gdzie indziej z wrapperem SSH `cliPath`.

    Typowe konfiguracje:

    - Uruchom Gateway na Linuxie/VPS i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBook Pro?">
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
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, zwłaszcza z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych Gateway.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na nieprodukcyjnym Gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram nadawcy-człowieka** (liczbowy). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi wyłącznie o liczbowe identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij DM do `@userinfobot` albo `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **trasowanie wielu agentów**. Powiąż **DM** WhatsApp każdego nadawcy (peer `kind: "direct"`, nadawca E.164 jak `+15551234567`) z innym `agentId`, aby każda osoba dostała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal pochodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Trasowanie wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „szybkiego czatu” i agenta „Opus do kodowania”?'>
    Tak. Użyj trasowania wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto dostawcy albo konkretne peery) z każdym agentem. Przykładowa konfiguracja znajduje się w [Trasowanie wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach nielogujących.
    Najnowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach systemd na Linuxie (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) oraz honorują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między hackowalną instalacją git a instalacją npm">
    - **Hackowalna instalacja (git):** pełne pobranie źródeł, edytowalne, najlepsze dla kontrybutorów.
      Kompilacje uruchamiasz lokalnie i możesz łatać kod/dokumentację.
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

    Dodaj `--dry-run`, aby najpierw podejrzeć planowane przełączenie trybu. Aktualizator uruchamia
    dalsze kroki Doctor, odświeża źródła pluginów dla kanału docelowego i
    restartuje Gateway, chyba że przekażesz `--no-restart`.

    Instalator także może wymusić dowolny z trybów:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchomić Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najmniejszej liczbie przeszkód i akceptujesz usypianie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do lokalnych plików, aktywne okno przeglądarki.
    - **Wady:** usypianie/problemy z siecią = rozłączenia, aktualizacje/restarty systemu przerywają działanie, musi pozostawać wybudzony.

    **VPS / chmura**

    - **Zalety:** stałe działanie, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, do aktualizacji musisz używać SSH.

    **Uwaga dotycząca OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane domyślne rozwiązanie:** VPS, jeśli wcześniej występowały rozłączenia gatewaya. Lokalna konfiguracja jest świetna, gdy aktywnie używasz Maca i potrzebujesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Raspberry Pi):** stałe działanie, mniej przerw przez usypianie/restarty, czystsze uprawnienia, łatwiejsze utrzymanie działania.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarcza do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przejdzie w stan uśpienia lub się zaktualizuje.

    Jeśli chcesz mieć najlepsze z obu światów, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **węzeł** dla lokalnych narzędzi ekranu/kamery/wykonywania poleceń. Zobacz [Węzły](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji na Linuxie jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być stale włączona, osiągalna i mieć wystarczająco dużo
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, użyj **Windows Hub** do konfiguracji desktopowej albo WSL2, gdy
    konkretnie chcesz VM Gateway w stylu Linuxa z szeroką zgodnością
    narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Omówienie instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
