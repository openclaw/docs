---
read_when:
    - Nowa instalacja, zablokowany onboarding albo błędy przy pierwszym uruchomieniu
    - Wybór auth i subskrypcji dostawców
    - Brak dostępu do docs.openclaw.ai, brak możliwości otwarcia dashboardu, zablokowana instalacja
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, onboarding, auth, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-04-24T09:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Pytania i odpowiedzi dotyczące szybkiego startu i pierwszej konfiguracji. Informacje o codziennej pracy, modelach, auth, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja przy pierwszym uruchomieniu

  <AccordionGroup>
  <Accordion title="Utknąłem, jaka jest najszybsza droga, żeby ruszyć dalej?">
    Użyj lokalnego agenta AI, który potrafi **widzieć twoją maszynę**. To jest dużo skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją albo środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia potrafią czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki auth). Daj im **pełny checkout źródeł** przez
    instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, więc agent może czytać kod + dokumentację i
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do stable,
    uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a potem wykonał tylko
    potrzebne polecenia. Dzięki temu zmiany pozostają małe i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd albo poprawkę, zgłoś issue na GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij dane wyjściowe, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki snapshot health gateway/agenta + podstawowa konfiguracja.
    - `openclaw models status`: sprawdza auth dostawców + dostępność modeli.
    - `openclaw doctor`: waliduje i naprawia typowe problemy konfiguracji/stanu.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat jest ciągle pomijany. Co oznaczają powody pominięcia?">
    Typowe powody pomijania Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pustą treść albo sam szablon nagłówków
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze należny
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu należności są przesuwane dopiero po zakończeniu rzeczywistego przebiegu Heartbeat.
    Pominięte przebiegi nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może także automatycznie zbudować zasoby UI. Po onboardingu Gateway zwykle działa na porcie **18789**.

    Ze źródeł (contributorzy/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom onboarding przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym adresem dashboardu (bez tokenu w URL) zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli prosi o shared-secret auth, wklej skonfigurowany token albo hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (albo `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli nie skonfigurowano jeszcze shared secret, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają auth Control UI/WebSocket (bez wklejania shared secret, przy założeniu zaufanego hosta gateway); API HTTP nadal wymagają shared-secret auth, chyba że świadomie używasz `none` dla private-ingress albo auth HTTP trusted-proxy.
      Błędne współbieżne próby auth Serve z tego samego klienta są serializowane, zanim limiter nieudanych auth zapisze zdarzenie, więc druga błędna próba może już pokazywać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj auth hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący shared secret w ustawieniach dashboardu.
    - **Reverse proxy z kontrolą tożsamości**: trzymaj Gateway za nie-loopbackowym trusted proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Shared-secret auth nadal obowiązuje przez tunel; wklej skonfigurowany token albo hasło, jeśli pojawi się monit.

    Informacje o trybach bind i auth znajdziesz w [Dashboard](/pl/web/dashboard) i [Powierzchniach Web](/pl/web).

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzeń exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje prompty zatwierdzeń do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że dany kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzeń. Konfiguracja czatu kontroluje tylko to,
    gdzie pojawiają się prompty zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny potrafi bezpiecznie wywnioskować zatwierdzających, OpenClaw teraz automatycznie włącza zatwierdzenia natywne DM-first, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, to natywne UI jest ścieżką podstawową; agent powinien uwzględnić ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy prompty mają być także przekazywane do innych czatów albo jawnych pokoi ops.
    - Użyj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy jawnie chcesz, aby prompty zatwierdzeń były publikowane z powrotem w pokoju/temacie źródłowym.
    - Zatwierdzenia Pluginów są znowu osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkowo natywną obsługę zatwierdzeń Pluginów.

    Krótko: forwarding służy do routingu, a konfiguracja natywnego klienta do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    dysku jako wystarczające do użytku osobistego, oraz zaznacza, że **Raspberry Pi 4 potrafi go uruchomić**.

    Jeśli chcesz trochę większego zapasu (logi, media, inne usługi), zalecane jest **2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a **Node** możesz sparować na laptopie/telefonie do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Node](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się ostrych krawędzi.

    - Używaj systemu **64-bitowego** i utrzymuj Node >= 22.
    - Preferuj instalację **hackable (git)**, aby widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy z binariami, zwykle jest to problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI także wysyła
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz tę linię i **brak odpowiedzi**,
    a liczba tokenów pozostaje 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal wisi, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom raz Doctor. To
    zachowuje twojego bota „dokładnie takiego samego” (pamięć, historia sesji, auth i stan
    kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i uruchom ponownie usługę Gateway.

    To zachowuje konfigurację, profile auth, poświadczenia WhatsApp, sesje i pamięć. Jeśli używasz
    trybu zdalnego, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/wypychasz swój workspace na GitHub, robisz backup
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani auth. Te znajdują się
    w `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć nowości w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli najwyższa sekcja jest oznaczona jako **Unreleased**, następna sekcja z datą
    to najnowsza wydana wersja. Wpisy są grupowane według **Highlights**, **Changes** i
    **Fixes** (plus sekcje dokumentacji/inne, gdy są potrzebne).

  </Accordion>

  <Accordion title="Brak dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz tę funkcję albo dodaj `docs.openclaw.ai` do allowlist, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz wejść na stronę, dokumentacja jest mirrorowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesny build do testów

    Zwykle stabilne wydanie trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest taka potrzeba. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednowierszowe polecenia instalacji i różnicę między beta a dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się beta od dev?">
    **Beta** to npm dist-tag `beta` (może być taki sam jak `latest` po promocji).
    **Dev** to ruchoma głowa `main` (git); po opublikowaniu używa npm dist-tag `dev`.

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

  <Accordion title="Jak wypróbować najnowsze rzeczy?">
    Masz dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackable (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To daje lokalne repozytorium, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Update](/pl/cli/update), [Kanały rozwojowe](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut w zależności od tego, ile kanałów/modeli konfigurujesz

    Jeśli się zawiesi, użyj [Zablokowany instalator](#quick-start-and-first-run-setup)
    i szybkiej pętli debugowania z [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator się zawiesił? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **szczegółowym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta ze szczegółowym wyjściem:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji hackable (git):

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

  <Accordion title="Instalacja na Windows mówi git not found albo openclaw not recognized">
    Dwa typowe problemy na Windows:

    **1) Błąd npm spawn git / git not found**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i otwórz ponownie PowerShell, a następnie uruchom instalator ponownie.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego PATH użytkownika (na Windows nie potrzeba sufiksu `\bin`; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i otwórz ponownie PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz uzyskać możliwie najgładszą konfigurację na Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Na Windows wynik exec pokazuje zniekształcony chiński tekst - co zrobić?">
    Zwykle jest to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - Dane wyjściowe `system.run`/`exec` wyświetlają chiński tekst jako mojibake
    - To samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie uruchom ponownie Gateway i powtórz polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem na najnowszym OpenClaw, śledź go albo zgłoś tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj instalacji **hackable (git)**, aby mieć pełne źródła i dokumentację lokalnie, a potem zapytaj
    swojego bota (albo Claude/Codex) _z tego folderu_, aby mógł czytać repozytorium i odpowiadać precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linux, a potem uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Każdy Linux VPS działa. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dotrzeć do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway zdalnie](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Mamy **hub hostingu** z popularnymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz kopie zapasowe.

    Możesz sparować **Node** (Mac/iOS/Android/bezdłowy), aby ten gateway w chmurze uzyskał dostęp do
    lokalnego ekranu/kamery/canvas albo uruchamiał polecenia na laptopie przy jednoczesnym
    pozostawieniu Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway zdalnie](/pl/gateway/remote).
    Node: [Node](/pl/nodes), [CLI Node](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby sam się zaktualizował?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co rozłącza aktywną sesję), może wymagać czystego checkoutu git i
    może pytać o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz zautomatyzować to z poziomu agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Update](/pl/cli/update), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza cię przez:

    - **Konfigurację modeli/auth** (OAuth dostawcy, klucze API, setup-token Anthropic oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Pluginy kanałów, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent na macOS; user unit `systemd` na Linux/WSL2)
    - **Health checks** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, żeby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **wyłącznie lokalnymi modelami**, aby dane pozostały na twoim urządzeniu. Subskrypcje (Claude
    Pro/Max albo OpenAI Codex) to opcjonalne sposoby uwierzytelniania u tych dostawców.

    W przypadku Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: zwykłe rozliczenie przez Anthropic API
    - **Claude CLI / auth subskrypcji Claude w OpenClaw**: personel Anthropic
      powiedział nam, że takie użycie jest znowu dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długo działających hostów gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwane dla zewnętrznych
    narzędzi, takich jak OpenClaw.

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

    Personel Anthropic powiedział nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
    OpenClaw traktuje auth subskrypcji Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji Claude (Claude Pro albo Max)?">
    Tak.

    Personel Anthropic powiedział nam, że to użycie jest znowu dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Setup-token Anthropic nadal jest dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    W przypadku obciążeń produkcyjnych albo wieloużytkownikowych auth kluczem API Anthropic nadal pozostaje
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele
    GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error z Anthropic?">
    To oznacza, że twój **limit/limit szybkości Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na reset okna albo podnieś plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i zwiększ limity w razie potrzeby.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    wersji beta 1M kontekstu Anthropic (`context1m: true`). To działa tylko wtedy, gdy twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API albo
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model fallback**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma ograniczenia rate limit.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki env AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla streamingu/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa auth Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Używaj
    `openai-codex/gpt-5.5` dla Codex OAuth przez domyślny runner PI. Używaj
    `openai/gpt-5.4` dla bieżącego bezpośredniego dostępu kluczem API OpenAI. Bezpośredni
    dostęp kluczem API do GPT-5.5 będzie obsługiwany, gdy OpenAI włączy go w publicznym API; obecnie
    GPT-5.5 używa subskrypcji/OAuth przez `openai-codex/gpt-5.5` albo natywnych uruchomień serwera aplikacji Codex z `openai/gpt-5.5` i `embeddedHarness.runtime: "codex"`.
    Zobacz [Dostawców modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu auth dla OAuth ChatGPT/Codex.
    Jest to także jawny prefiks modelu PI dla Codex OAuth:

    - `openai/gpt-5.4` = bieżąca bezpośrednia ścieżka klucza API OpenAI w PI
    - `openai/gpt-5.5` = przyszła bezpośrednia ścieżka klucza API po włączeniu GPT-5.5 przez OpenAI w API
    - `openai-codex/gpt-5.5` = ścieżka Codex OAuth w PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = natywna ścieżka serwera aplikacji Codex
    - `openai-codex:...` = identyfikator profilu auth, a nie odwołanie do modelu

    Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz auth subskrypcji ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex` i używaj
    odwołań do modeli `openai-codex/*` dla uruchomień PI.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą różnić się od ChatGPT web?">
    Codex OAuth używa zarządzanych przez OpenAI okien limitów zależnych od planu. W praktyce
    te limity mogą różnić się od doświadczenia na stronie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazywać aktualnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu do API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może uruchomić ten przepływ OAuth za ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawców modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu auth Pluginu**, a nie client id albo secret w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po logowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania zawodzą, ustaw `GOOGLE_CLOUD_PROJECT` albo `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach auth na hoście gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do luźnych czatów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnego bezpieczeństwa; małe karty obcinają i przeciekają. Jeśli musisz, uruchom **największy** build modelu, jaki możesz lokalnie (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w określonym regionie?">
    Wybierz endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić obok nich Anthropic/OpenAI, używając `models.mode: "merge"`, aby fallbacki pozostały dostępne przy jednoczesnym zachowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS albo Linux (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy albo maszyna klasy Raspberry Pi też działa.

    Mac jest potrzebny tylko do **narzędzi tylko dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Mac, a Gateway może działać na Linux albo gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Mac albo sparuj node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Node](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. **Nie** musi to być Mac mini —
    wystarczy dowolny Mac. Dla iMessage **użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) — serwer BlueBubbles działa na macOS, a Gateway może działać na Linux albo gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Mac zalogowanym do Messages.
    - Uruchom wszystko na Mac, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Node](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBook Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a MacBook Pro może połączyć się jako
    **node** (urządzenie towarzyszące). Node nie uruchamiają Gateway — zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo hosta node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Node](/pl/nodes), [CLI Node](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy runtime, szczególnie z kanałami WhatsApp i Telegram.
    Używaj **Node** dla stabilnych gateway.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisuje się w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram człowieka** (liczbowy). Nie jest to nazwa użytkownika bota.

    Konfiguracja prosi tylko o liczbowe identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota firm trzecich):

    - Wyślij DM do swojego bota, a potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Strony trzecie (mniej prywatne):

    - Wyślij DM do `@userinfobot` albo `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż DM WhatsApp każdego nadawcy (peer `kind: "direct"`, nadawca E.164, np. `+15551234567`) z innym `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą wychodzić z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna per konto WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę mieć agenta „fast chat” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie przypisz trasy przychodzące (konto dostawcy albo konkretni peery) do każdego agenta. Przykładowa konfiguracja znajduje się w [Routingu wielu agentów](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) i [Konfigurację](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez `systemd`, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach niebędących powłokami logowania.
    Nowsze buildy dodają także na początku typowe katalogi bin użytkownika w usługach Linux `systemd` (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackable git a npm install">
    - **Instalacja hackable (git):** pełny checkout źródeł, możliwość edycji, najlepsza dla contributorów.
      Budujesz lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm a git?">
    Tak. Zainstaluj drugi wariant, a potem uruchom Doctor, aby usługa gateway wskazywała nowy punkt wejścia.
    To **nie usuwa twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
    (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm do git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Z git do npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor wykrywa niezgodność punktu wejścia usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące backupu: zobacz [Strategię kopii zapasowych](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    minimalnego tarcia i akceptujesz uśpienie/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, aktywne okno przeglądarki.
    - **Wady:** uśpienie/zaniki sieci = rozłączenia, aktualizacje/rebooty systemu przerywają pracę, komputer musi pozostać włączony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działanie bezgłowe (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bezgłowa** vs widoczne okno. Zobacz [Przeglądarkę](/pl/tools/browser).

    **Zalecany domyślny wybór:** VPS, jeśli wcześniej zdarzały ci się rozłączenia gateway. Lokalnie jest świetnie, gdy aktywnie używasz Mac i chcesz mieć dostęp do lokalnych plików albo automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez uśpienie/reboot, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie OK do testów i aktywnego używania, ale spodziewaj się przerw, gdy maszyna przechodzi w stan uśpienia albo się aktualizuje.

    Jeśli chcesz mieć to, co najlepsze z obu światów, trzymaj Gateway na dedykowanym hoście, a laptop sparuj jako **node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Node](/pl/nodes).
    Wskazówki bezpieczeństwa znajdziesz w [Bezpieczeństwie](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i jaki system operacyjny jest zalecany?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM, około 500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki potrafią zużywać sporo zasobów.

    System operacyjny: używaj **Ubuntu LTS** (albo dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji dla Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway i wszystkich włączonych kanałów.

    Bazowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia mediów.
    - **System operacyjny:** Ubuntu LTS albo inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i zapewnia najlepszą
    zgodność narzędziową. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
