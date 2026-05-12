---
read_when:
    - Nowa instalacja, zablokowane wdrażanie lub błędy przy pierwszym uruchomieniu
    - Wybieranie uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja pierwszego uruchomienia — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-05-12T00:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Szybki start oraz pytania i odpowiedzi dotyczące pierwszego uruchomienia. Codzienne operacje, modele, uwierzytelnianie, sesje
  i rozwiązywanie problemów opisuje główne [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja pierwszego uruchomienia

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, aby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twoją maszynę**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**, których
    zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Przekaż im **pełne pobranie źródeł** przez
    instalację modyfikowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z pobranego repozytorium git**, dzięki czemu agent może czytać kod i dokumentację oraz
    wnioskować o dokładnej wersji, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHubie albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij ich wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki zrzut stanu Gateway/agenta oraz podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy i dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](/pl/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/sam nagłówkowy szkielet
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie nadszedł
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu terminu są przesuwane dopiero po ukończeniu rzeczywistego uruchomienia Heartbeat.
    Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/deweloperzy):

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
    Kreator otwiera przeglądarkę z czystym (bez tokenizacji) adresem URL dashboardu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wydrukowany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli nie skonfigurowano jeszcze współdzielonego sekretu, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bind na local loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejanego współdzielonego sekretu, przy założeniu zaufanego hosta Gateway); API HTTP nadal wymagają uwierzytelniania współdzielonym sekretem, chyba że celowo użyjesz prywatnego ingressu `none` albo uwierzytelniania HTTP przez zaufane proxy.
      Błędne równoczesne próby uwierzytelnienia Serve z tego samego klienta są serializowane, zanim limiter nieudanego uwierzytelnienia je zapisze, więc druga błędna ponowna próba może już pokazać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący współdzielony sekret w ustawieniach dashboardu.
    - **Reverse proxy świadome tożsamości**: trzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy. Proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Dashboard](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby bind oraz szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego istnieją dwie konfiguracje zatwierdzeń exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity o zatwierdzenie do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko, gdzie
    pojawiają się monity o zatwierdzenie i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` na tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw teraz automatycznie włącza natywne zatwierdzenia z priorytetem DM, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest ścieżką podstawową; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być również przekazywane do innych czatów lub jawnych pokoi operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy jawnie chcesz, aby monity o zatwierdzenie były publikowane z powrotem w źródłowym pokoju/wątku.
    - Zatwierdzenia Plugin są znowu osobne: domyślnie używają `/approve` na tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową natywną obsługę zatwierdzeń Plugin.

    Krótko: przekazywanie służy do routingu, a konfiguracja klienta natywnego do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku jako wystarczające do użytku osobistego oraz zauważa, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć większy zapas (logi, media, inne usługi), **zalecane jest 2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a na laptopie/telefonie możesz parować **węzły** do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się nierówności.

    - Użyj systemu operacyjnego **64-bit** i utrzymuj Node >= 22.
    - Preferuj **instalację modyfikowalną (git)**, aby widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, potem dodawaj je po kolei.
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

  <Accordion title="Czy mogę przenieść moją konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie raz uruchom Doctor. To
    zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historia sesji, uwierzytelnianie i stan kanałów),
    o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane uwierzytelniające WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHuba, tworzysz kopię zapasową
    **pamięci + plików startowych**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](/pl/help/faq#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie sprawdzić, co nowego jest w najnowszej wersji?">
    Sprawdź changelog na GitHubie:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Najważniejsze**, **Zmiany** i
    **Poprawki** (plus sekcje dokumentacji/inne, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz dotrzeć do strony, dokumentacja jest zmirrorowana na GitHubie:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między wersją stable i beta">
    **Stable** i **beta** to **npm dist-tags**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable trafia najpierw do **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta i dev?">
    **Beta** to npm dist-tag `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma głowa `main` (git); po opublikowaniu używa npm dist-tag `dev`.

    Jednolinijkowe polecenia (macOS/Linux):

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

    Otrzymasz lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

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
    Przybliżone wartości:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **obszernym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z obszernym wyjściem:

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

  <Accordion title="Instalacja w Windows zgłasza, że nie znaleziono git albo openclaw nie jest rozpoznawany">
    Dwa typowe problemy w Windows:

    **1) Błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a następnie uruchom instalator ponownie.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie znajduje się w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego użytkownika PATH (w Windows nie jest potrzebny sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Po zaktualizowaniu PATH zamknij i ponownie otwórz PowerShell.

    Jeśli chcesz najprostszej konfiguracji w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec w Windows pokazuje zniekształcony tekst chiński - co zrobić?">
    To zwykle niezgodność strony kodowej konsoli w natywnych powłokach Windows.

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

    Jeśli nadal możesz to odtworzyć w najnowszym OpenClaw, śledź/zgłoś to tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji do modyfikacji (git)**, aby mieć pełne źródła i dokumentację lokalnie, a potem zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł przeczytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linux, a potem uruchom onboarding.

    - Szybka ścieżka dla Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Dowolny VPS z Linux zadziała. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dostać się do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **centrum hostingu** z popularnymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj hosta jako źródło prawdy i wykonuj jego kopie zapasowe.

    Możesz sparować **węzły** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskiwać dostęp
    do lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na laptopie, utrzymując
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway zdalny](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw o samodzielną aktualizację?">
    Krótka odpowiedź: **możliwe, niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co przerywa aktywną sesję), może wymagać czystego git checkout i
    może poprosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz zautomatyzować to z agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez:

    - **Konfigurację modelu/auth** (OAuth dostawcy, klucze API, Anthropic setup-token oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki startowe
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone pluginy kanałów, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent w macOS; jednostka użytkownika systemd w Linux/WSL2)
    - **Kontrole zdrowia** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany lub brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **modelami wyłącznie lokalnymi**, aby Twoje dane pozostały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: standardowe rozliczanie Anthropic API
    - **Claude CLI / uwierzytelnianie subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      poinformowali nas, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwałych hostów Gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwany dla zewnętrznych
    narzędzi, takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcji, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [GLM Models](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcji Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic poinformowali nas, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token jest nadal dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla obciążeń produkcyjnych lub wieloużytkownikowych uwierzytelnianie kluczem API Anthropic jest nadal
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [GLM
    Models](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    To oznacza, że Twój **limit quota/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na reset okna lub przejdź na wyższy plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i podnieś limity w razie potrzeby.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety kontekstu 1M Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model awaryjny**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma ograniczoną przepustowość.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiska AWS, OpenClaw może automatycznie wykryć katalog strumieniowy/tekstowy Bedrock i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ klucza, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` w typowej konfiguracji: uwierzytelnianie subskrypcji ChatGPT/Codex oraz
    natywne wykonywanie na serwerze aplikacji Codex. Odwołania do modeli `openai-codex/gpt-*` są
    starszą konfiguracją naprawianą przez `openclaw doctor --fix`. Bezpośredni dostęp kluczem API OpenAI
    pozostaje dostępny dla powierzchni OpenAI API innych niż agenci oraz dla modeli agentów
    przez uporządkowany profil klucza API `openai-codex`.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu uwierzytelniania dla OAuth ChatGPT/Codex.
    Starsze konfiguracje używały go także jako prefiksu modelu:

    - `openai/gpt-5.5` = uwierzytelnianie subskrypcji ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex dla tur agenta
    - `openai-codex/gpt-5.5` = starsza ścieżka modelu naprawiana przez `openclaw doctor --fix`
    - `openai/gpt-5.5` plus uporządkowany profil klucza API `openai-codex` = uwierzytelnianie kluczem API dla modelu agenta OpenAI
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie odwołanie do modelu

    Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelniania subskrypcji ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex`. Pozostaw odwołanie do modelu jako
    `openai/gpt-5.5`; odwołania do modeli `openai-codex/*` to starsza konfiguracja, którą
    `openclaw doctor --fix` przepisuje.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą różnić się od ChatGPT w przeglądarce?">
    Codex OAuth używa zarządzanych przez OpenAI okien limitów zależnych od planu. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać obecnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie tworzy ani nie normalizuje uprawnień ChatGPT w przeglądarce
    na bezpośredni dostęp API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjne OAuth OpenAI Code (Codex)**.
    OpenAI wyraźnie zezwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania wtyczki**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz wtyczkę: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania zawodzą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway

    To przechowuje tokeny OAuth w profilach uwierzytelniania na hoście Gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnych zabezpieczeń; małe karty obcinają i ujawniają dane. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanego modelu w konkretnym regionie?">
    Wybierz punkty końcowe przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymieniać Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, dzięki czemu modele awaryjne pozostają dostępne przy poszanowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuksie (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też działa.

    Maca potrzebujesz tylko **do narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [iMessage](/pl/channels/imessage) z `imsg` na dowolnym Macu zalogowanym w Wiadomościach. Jeśli Gateway działa na Linuksie albo gdzie indziej, ustaw `channels.imessage.cliPath` na wrapper SSH uruchamiający `imsg` na tym Macu. Jeśli chcesz innych narzędzi dostępnych wyłącznie na macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes), [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Maca mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego w Wiadomościach. To **nie** musi być Mac mini -
    zadziała dowolny Mac. **Użyj [iMessage](/pl/channels/imessage)** z `imsg`; Gateway może działać na tym Macu albo gdzie indziej z wrapperem SSH `cliPath`.

    Typowe konfiguracje:

    - Uruchom Gateway na Linuksie/VPS i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg` na Macu zalogowanym w Wiadomościach.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes),
    [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Maca mini do uruchomienia OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gateway - zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/płótno i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Macu mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Obserwujemy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych bram.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na nieprodukcyjnej bramie
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram ludzkiego nadawcy** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij wiadomość prywatną do bota, potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij wiadomość prywatną do bota, potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne (mniej prywatne):

    - Wyślij wiadomość prywatną do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Przypisz każdą wiadomość prywatną **DM** nadawcy w WhatsApp (peer `kind: "direct"`, nadawca E.164 jak `+15551234567`) do innego `agentId`, aby każda osoba miała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal wychodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta "szybkiego czatu" i agenta "Opus do kodowania"?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny domyślny model, a potem przypisz trasy przychodzące (konto dostawcy albo konkretne peery) do każdego agenta. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuksie?">
    Tak. Homebrew obsługuje Linuksa (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach nielogujących.
    Najnowsze kompilacje poprzedzają też typowe katalogi bin użytkownika w usługach systemd na Linuksie (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między modyfikowalną instalacją git a instalacją npm">
    - **Modyfikowalna instalacja (git):** pełne pobranie źródeł, edytowalne, najlepsze dla kontrybutorów.
      Kompilacje uruchamiasz lokalnie i możesz poprawiać kod/dokumentację.
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

    Dodaj `--dry-run`, aby najpierw podejrzeć planowane przełączenie trybu. Aktualizator uruchamia
    dalsze kroki Doctor, odświeża źródła wtyczek dla kanału docelowego i
    restartuje Gateway, chyba że przekażesz `--no-restart`.

    Instalator także może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia tworzenia kopii zapasowych](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchomić Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniej tarć i akceptujesz uśpienie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do plików lokalnych, aktywne okno przeglądarki.
    - **Wady:** uśpienie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają działanie, musi pozostawać wybudzony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecana opcja domyślna:** VPS, jeśli wcześniej występowały rozłączenia Gateway. Lokalnie sprawdza się świetnie, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw spowodowanych usypianiem lub restartami, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/komputer stacjonarny:** w pełni wystarczający do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przechodzi w stan uśpienia lub się aktualizuje.

    Jeśli chcesz połączyć zalety obu podejść, trzymaj Gateway na dedykowanym hoście i sparuj laptopa jako **node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej dla zapasu (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego współczesnego Debiana/Ubuntu). Ścieżka instalacji na Linuksie jest najlepiej przetestowana właśnie tam.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco dużo
    RAM dla Gateway oraz wszystkich kanałów, które włączysz.

    Podstawowe wytyczne:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny współczesny Debian/Ubuntu.

    Jeśli korzystasz z Windows, **WSL2 jest najłatwiejszą konfiguracją w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
