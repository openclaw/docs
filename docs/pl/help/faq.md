---
read_when:
    - Odpowiadasz na typowe pytania dotyczące konfiguracji, instalacji, onboardingu lub wsparcia środowiska uruchomieniowego
    - Triagujesz problemy zgłaszane przez użytkowników przed głębszym debugowaniem
summary: Najczęściej zadawane pytania dotyczące konfiguracji, ustawiania i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-07T09:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2ad2fc35fb5b1d6c8fb75e7c0c409089dff033a9810c863c3f7ef64834a9b77
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz bardziej szczegółowe rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny development, VPS, multi-agent, OAuth/klucze API, failover modeli). Diagnostykę runtime znajdziesz w [Troubleshooting](/pl/gateway/troubleshooting). Pełne odniesienie do konfiguracji znajdziesz w [Configuration](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś jest zepsute

1. **Szybki status (pierwsze sprawdzenie)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: OS + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy runtime (gdy gateway jest osiągalny).

2. **Raport gotowy do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnostyka tylko do odczytu z ogonem logów (tokeny są zamaskowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje runtime nadzorcy względem dostępności RPC, docelowy URL sondy oraz której konfiguracji usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę stanu gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego gateway). Zobacz [Health](/pl/gateway/health).

5. **Podgląd najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, przełącz się na:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielne od logów usługi; zobacz [Logging](/pl/logging) i [Troubleshooting](/pl/gateway/troubleshooting).

6. **Uruchom Doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje config i stan + uruchamia kontrole zdrowia. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę configu przy błędach
   ```

   Pyta działający gateway o pełną migawkę (tylko WS). Zobacz [Health](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem, jaki jest najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twoją maszynę**. To jest znacznie skuteczniejsze niż pytanie
    na Discordzie, ponieważ większość przypadków „utknąłem” to **lokalne problemy z configiem lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repo, uruchamiać polecenia, sprawdzać logi i pomagać naprawić konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki auth). Daj im **pełne checkout źródeł** przez
    instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może czytać kod + dokumentację
    i analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do stable,
    uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a potem wykonał tylko
    potrzebne polecenia. Dzięki temu zmiany pozostają małe i łatwiejsze do przejrzenia.

    Jeśli odkryjesz rzeczywisty błąd lub poprawkę, zgłoś issue na GitHubie albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybka migawka zdrowia gateway/agenta + podstawowy config.
    - `openclaw models status`: sprawdza auth dostawcy + dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z configiem/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](#pierwsze-60-sekund-jesli-cos-jest-zepsute).
    Dokumentacja instalacji: [Install](/pl/install), [Flagi instalatora](/pl/install/installer), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle jest pomijany. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/szkieletowy nagłówek
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie nadszedł
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wykonania są przesuwane dopiero po zakończeniu rzeczywistego uruchomienia heartbeat.
    Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automation & Tasks](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zazwyczaj uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # automatycznie instaluje zależności UI przy pierwszym uruchomieniu
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym adresem dashboardu (bez tokenu) zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost vs zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli prosi o auth ze wspólnym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli wspólny sekret nie jest jeszcze skonfigurowany, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Nie na localhost:**

    - **Tailscale Serve** (zalecane): zostaw bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania auth dla Control UI/WebSocket (bez wklejania wspólnego sekretu, zakłada zaufanego hosta gateway); HTTP API nadal wymagają auth ze wspólnym sekretem, chyba że celowo używasz private-ingress `none` lub trusted-proxy HTTP auth.
      Nieudane równoczesne próby auth Serve z tego samego klienta są serializowane, zanim ogranicznik failed-auth je zarejestruje, więc druga zła próba może już pokazać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj auth hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący wspólny sekret w ustawieniach dashboardu.
    - **Identity-aware reverse proxy**: pozostaw Gateway za trusted proxy bez loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Auth ze wspólnym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Dashboard](/web/dashboard) i [Web surfaces](/web), aby poznać tryby bind i szczegóły auth.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzeń exec dla zatwierdzeń z czatu?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje prompty zatwierdzeń do miejsc docelowych na czacie
    - `channels.<channel>.execApprovals`: sprawia, że dany kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Polityka host exec nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu steruje tylko tym,
    gdzie pojawiają się prompty zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez ścieżkę współdzieloną.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować zatwierdzających, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` nie jest ustawione lub ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzeń, ta natywna ścieżka UI jest podstawowa; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.
    - Użyj `approvals.exec` tylko wtedy, gdy prompty mają być też przekazywane do innych czatów lub jawnych pokoi ops.
    - Użyj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy jawnie chcesz, by prompty zatwierdzeń były publikowane z powrotem w pokoju/wątku źródłowym.
    - Zatwierdzenia pluginów są znów oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkowo natywną obsługę plugin approvals.

    W skrócie: forwarding służy do routingu, a konfiguracja natywnego klienta do bogatszego UX specyficznego dla kanału.
    Zobacz [Exec Approvals](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy to działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje, że do użytku osobistego wystarcza **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku, oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć większy zapas (logi, media, inne usługi), zalecane jest **2GB**,
    ale nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz sparować **nodes** na laptopie/telefonie,
    aby mieć lokalny ekran/kamerę/canvas lub wykonywanie poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dla instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się pewnych niedoskonałości.

    - Używaj systemu **64-bitowego** i utrzymuj Node >= 22.
    - Preferuj **instalację hackable (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je po kolei.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Install](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding się nie wykluwa. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI automatycznie wysyła też
    „Wake up, my friend!” przy pierwszym hatch. Jeśli widzisz ten wiersz **bez odpowiedzi**
    i tokeny pozostają na 0, agent nigdy się nie uruchomił.

    1. Zrestartuj Gateway:

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

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Remote access](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść swoją konfigurację na nową maszynę (Mac mini) bez ponownego przechodzenia onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom Doctor raz. To
    zachowa Twojego bota „dokładnie takiego samego” (pamięć, historię sesji, auth i stan
    kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje config, profile auth, poświadczenia WhatsApp, sesje i pamięć. Jeśli używasz
    trybu zdalnego, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHuba, tworzysz kopię
    zapasową **pamięci + plików bootstrap**, ale **nie** historii sesji ani auth. One znajdują się
    w `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migrating](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#gdzie-rzeczy-znajduja-sie-na-dysku),
    [Agent workspace](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Remote mode](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego w najnowszej wersji?">
    Sprawdź changelog na GitHubie:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli najwyższa sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja to najnowsza wydana wersja. Wpisy są pogrupowane jako **Highlights**, **Changes** i
    **Fixes** (oraz w razie potrzeby sekcje docs/inne).

  </Accordion>

  <Accordion title="Nie mogę otworzyć docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz ją albo dodaj `docs.openclaw.ai` do allowlist, a potem spróbuj ponownie.
    Pomóż nam odblokować tę domenę, zgłaszając to tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz otworzyć witryny, dokumentacja jest mirrorowana na GitHubie:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **dist-tagi npm**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesny build do testów

    Zwykle wydanie stable trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowce instalacyjne i różnicę między beta a dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to dist-tag npm `beta` (może odpowiadać `latest` po promocji).
    **Dev** to ruchoma głowa `main` (git); po publikacji używa dist-tagu npm `dev`.

    Jednolinijkowce (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Development channels](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Są dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackable (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dzięki temu dostajesz lokalne repo, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Update](/cli/update), [Development channels](/pl/install/development-channels),
    [Install](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle zajmuje instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, w zależności od liczby kanałów/modeli, które konfigurujesz

    Jeśli proces się zawiesza, użyj [Problem z instalatorem](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania z [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnej?">
    Uruchom instalator ponownie z **szczegółowym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Odpowiednik w Windows (PowerShell):

    ```powershell
    # install.ps1 nie ma jeszcze dedykowanej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja na Windows mówi git not found albo openclaw not recognized">
    Dwa typowe problemy w Windows:

    **1) błąd npm spawn git / git not found**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest na Twoim PATH.
    - Zamknij i ponownie otwórz PowerShell, a następnie uruchom instalator ponownie.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny katalog bin npm nie jest na PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego user PATH (na Windows nie potrzeba sufiksu `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz uzyskać możliwie najpłynniejszą konfigurację Windows, używaj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wynik exec na Windows pokazuje zniekształcony chiński tekst — co zrobić?">
    Zwykle oznacza to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - wynik `system.run`/`exec` renderuje chiński tekst jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie zrestartuj Gateway i spróbuj ponownie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem na najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackable (git)**, aby mieć lokalnie pełne źródła i dokumentację, a potem zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł czytać repo i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Install](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a potem uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Getting Started](/pl/start/getting-started).
    - Instalator + aktualizacje: [Install & updates](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Działa każdy VPS z Linuxem. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dostać się do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Zdalny dostęp: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **hub hostingowy** z typowymi dostawcami. Wybierz jednego z nich i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    żyją na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na laptopie, trzymając
    Gateway w chmurze.

    Hub: [Platforms](/pl/platforms). Zdalny dostęp: [Gateway remote](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby zaktualizował się sam?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co zrywa aktywną sesję), może wymagać czystego checkoutu git
    i może prosić o potwierdzenie. Bezpieczniej jest uruchamiać aktualizacje z powłoki jako operator.

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

    Dokumentacja: [Update](/cli/update), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie local** prowadzi Cię przez:

    - **Konfigurację modelu/auth** (OAuth dostawcy, klucze API, setup-token Anthropic oraz lokalne opcje modeli, takie jak LM Studio)
    - lokalizację **workspace** + pliki bootstrap
    - **ustawienia Gateway** (bind/port/auth/tailscale)
    - **kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz bundlowane plugins kanałów, takie jak QQ Bot)
    - **instalację demona** (LaunchAgent na macOS; user unit systemd na Linux/WSL2)
    - **kontrole zdrowia** oraz wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany lub brakuje dla niego auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude albo OpenAI, żeby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **lokalnymi modelami**, dzięki czemu dane pozostają na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) to opcjonalne sposoby uwierzytelniania u tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: zwykłe rozliczanie API Anthropic
    - **Claude CLI / auth subskrypcji Claude w OpenClaw**: personel Anthropic
      poinformował nas, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zaakceptowane dla tej integracji, chyba że Anthropic opublikuje nowe
      zasady

    Dla długo działających hostów gateway klucze API Anthropic są nadal bardziej
    przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [GLM Models](/pl/providers/glm),
    [Local models](/pl/gateway/local-models), [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Personel Anthropic poinformował nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje auth subskrypcji Claude i użycie `claude -p` jako zaakceptowane
    dla tej integracji, chyba że Anthropic opublikuje nowe zasady. Jeśli chcesz
    najbardziej przewidywalną konfigurację po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Personel Anthropic poinformował nas, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zaakceptowane dla tej integracji,
    chyba że Anthropic opublikuje nowe zasady.

    Setup-token Anthropic jest nadal dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub wieloużytkownikowych auth kluczem API Anthropic nadal jest
    bezpieczniejszym, bardziej przewidywalnym wyborem. Jeśli chcesz w OpenClaw innych hostowanych opcji
    w stylu subskrypcyjnym, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [GLM
    Models](/pl/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error z Anthropic?">
To oznacza, że Twój **limit/quota Anthropic** wyczerpał się w bieżącym oknie. Jeśli
używasz **Claude CLI**, poczekaj, aż okno się zresetuje, albo podnieś plan. Jeśli
używasz **klucza API Anthropic**, sprawdź Anthropic Console
pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety 1M context Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania long-context (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **fallback model**, aby OpenClaw mógł dalej odpowiadać, gdy dostawca jest ograniczony przez rate limit.
    Zobacz [Models](/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma bundlowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są markery env AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla streamingu/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` lub dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Model providers](/pl/providers/models). Jeśli wolisz zarządzany przepływ z kluczem, zgodny z OpenAI proxy przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa auth Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Onboarding może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy będzie to odpowiednie. Zobacz [Model providers](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego ChatGPT GPT-5.4 nie odblokowuje openai/gpt-5.4 w OpenClaw?">
    OpenClaw traktuje te dwie ścieżki osobno:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = bezpośrednie API OpenAI Platform

    W OpenClaw logowanie ChatGPT/Codex jest podłączone do ścieżki `openai-codex/*`,
    a nie do bezpośredniej ścieżki `openai/*`. Jeśli chcesz w
    OpenClaw bezpośredniej ścieżki API, ustaw `OPENAI_API_KEY` (lub równoważny config dostawcy OpenAI).
    Jeśli chcesz logowanie ChatGPT/Codex w OpenClaw, użyj `openai-codex/*`.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT web?">
    `openai-codex/*` używa ścieżki OAuth Codex, a jego używalne okna quota są
    zarządzane przez OpenAI i zależne od planu. W praktyce te limity mogą różnić się od
    doświadczenia na stronie/aplikacji ChatGPT, nawet jeśli oba są powiązane z tym samym kontem.

    OpenClaw może pokazywać aktualnie widoczne okna użycia/quota dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu do API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie auth subskrypcji OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **OAuth subskrypcji OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie OAuth subskrypcji w zewnętrznych narzędziach/przepływach
    takich jak OpenClaw. Onboarding może uruchomić ten przepływ za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Model providers](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu auth pluginu**, a nie client id lub secret w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, tak aby `gemini` było na `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania kończą się błędem, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach auth na hoście gateway. Szczegóły: [Model providers](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do luźnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnego bezpieczeństwa; małe karty przycinają i przeciekają. Jeśli musisz, uruchom lokalnie **największy** build modelu, jaki możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Security](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w określonym regionie?">
    Wybieraj endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, tak aby fallbacki pozostały dostępne przy jednoczesnym poszanowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuxie (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako stale działającego hosta, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też się nadaje.

    Potrzebujesz Maca tylko do **narzędzi wyłącznie dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie lub gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Mac remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy do obsługi iMessage potrzebuję Mac mini?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. To **nie** musi być Mac mini —
    dowolny Mac wystarczy. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage — serwer BlueBubbles działa na macOS, a Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linuxie/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Mac remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini, żeby uruchamiać OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może łączyć się jako
    **node** (urządzenie towarzyszące). Nodes nie uruchamiają Gateway — zapewniają dodatkowe
    możliwości, takie jak screen/camera/canvas oraz `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS lub host node i paruje się z Gateway.
    - Używaj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy runtime, szczególnie z WhatsApp i Telegram.
    Do stabilnych gateway używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać w allowFrom?">
    `channels.telegram.allowFrom` to **Telegram user ID ludzkiego nadawcy** (liczbowe). To nie jest nazwa użytkownika bota.

    Onboarding akceptuje wejście `@username` i rozwiązuje je do ID numerycznego, ale autoryzacja OpenClaw używa wyłącznie ID numerycznych.

    Bezpieczniej (bez zewnętrznego bota):

    - Napisz DM do swojego bota, a potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Napisz DM do swojego bota, a potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne narzędzia (mniej prywatne):

    - Napisz DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **multi-agent routing**. Powiąż DM WhatsApp każdego nadawcy (**peer** `kind: "direct"`, nadawca E.164 jak `+15551234567`) z innym `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą wychodziły z **tego samego konta WhatsApp**, a kontrola dostępu do DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Multi-Agent Routing](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę mieć agenta "szybki czat" i agenta "Opus do kodowania"?'>
    Tak. Użyj multi-agent routing: przypisz każdemu agentowi własny model domyślny, a potem powiąż przychodzące trasy (konto dostawcy lub konkretne peer) z każdym agentem. Przykładowa konfiguracja znajduje się w [Multi-Agent Routing](/pl/concepts/multi-agent). Zobacz też [Models](/pl/concepts/models) i [Configuration](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linuxa (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach niebędących login shell.
    Ostatnie buildy poprzedzają też typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) oraz honorują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, jeśli są ustawione.

  </Accordion>

  <Accordion title="Różnica między hackable install git a npm install">
    - **Instalacja hackable (git):** pełny checkout źródeł, edytowalny, najlepszy dla współtwórców.
      Buildy uruchamiasz lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repo, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tagów npm.

    Dokumentacja: [Getting started](/pl/start/getting-started), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm a git?">
    Tak. Zainstaluj drugi wariant, a potem uruchom Doctor, aby usługa gateway wskazywała na nowy entrypoint.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
    (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm na git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Z git na npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor wykrywa niedopasowanie entrypointu usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (użyj `--repair` w automatyzacji).

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](#gdzie-rzeczy-znajduja-sie-na-dysku).

  </Accordion>

  <Accordion title="Czy uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najmniejszym tarciu i akceptujesz usypianie/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki.
    - **Wady:** uśpienie/zerwanie sieci = rozłączenia, aktualizacje/rebooty OS przerywają pracę, maszyna musi być stale aktywna.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa headless (używaj screenshotów), dostęp tylko do zdalnych plików, do aktualizacji potrzebujesz SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają dobrze z VPS. Jedyny realny kompromis to **przeglądarka headless** vs widoczne okno. Zobacz [Browser](/pl/tools/browser).

    **Zalecane domyślne podejście:** VPS, jeśli wcześniej miałeś rozłączenia gateway. Lokalnie jest świetnie, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane dla niezawodności i izolacji**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez uśpienie/rebooty, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** w pełni OK do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna śpi lub się aktualizuje.

    Jeśli chcesz połączyć oba światy, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki bezpieczeństwa znajdziesz w [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania dla VPS i jaki OS jest zalecany?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Bezwzględne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia node i automatyzacja przeglądarki mogą być zasobożerne.

    OS: używaj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). To najlepiej przetestowana ścieżka instalacji na Linuxie.

    Dokumentacja: [Linux](/pl/platforms/linux), [VPS hosting](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć dość
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Bazowe wskazówki:

    - **Bezwzględne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **OS:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli jesteś na Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [VPS hosting](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada na powierzchniach komunikacyjnych, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz bundlowane plugins kanałów, takie jak QQ Bot) i może też obsługiwać głos + live Canvas na wspieranych platformach. **Gateway** to zawsze włączona płaszczyzna sterowania; produktem jest asystent.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „tylko wrapper na Claude”. To **lokalna płaszczyzna sterowania (local-first)**, która pozwala uruchamiać
    kompetentnego asystenta na **Twoim własnym sprzęcie**, dostępnego z aplikacji czatu, których już używasz, z
    sesjami stanowymi, pamięcią i narzędziami — bez oddawania kontroli nad przepływami pracy hostowanemu
    SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway gdzie chcesz (Mac, Linux, VPS) i trzymaj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie sandbox webowy:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage itd.,
      plus mobilny głos i Canvas na wspieranych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i failover.
    - **Opcja tylko lokalna:** uruchamiaj lokalne modele, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Multi-agent routing:** oddzielni agenci dla kanału, konta lub zadania, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackable:** sprawdzaj, rozszerzaj i self-hostuj bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Channels](/pl/channels), [Multi-agent](/pl/concepts/multi-agent),
    [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem — co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (sprzątanie, nazewnictwo, tagowanie).
    - Połącz Gmail i zautomatyzuj podsumowania lub follow-upy.

    Potrafi obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na fazy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i interesujących Cię wiadomości.
    - **Research i drafty:** szybki research, podsumowania i pierwsze wersje maili lub dokumentów.
    - **Przypomnienia i follow-upy:** szturchnięcia i checklisty sterowane cron lub heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, jeśli chodzi o **research, kwalifikację i drafty**. Może skanować strony, budować shortlisty,
    podsumowywać prospectów i pisać szkice outreachu lub copy reklamowego.

    W przypadku **outreachu lub uruchamiania reklam** trzymaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform, a wszystko przeglądaj przed wysłaniem. Najbezpieczniejszy wzorzec to
    pozwolić OpenClaw przygotować szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie ma przewagi nad Claude Code przy tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repo. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu z wielu urządzeń i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooks)
    - **Gateway zawsze włączony** (uruchamiasz na VPS, wchodzisz z dowolnego miejsca)
    - **Nodes** dla lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez brudzenia repo?">
    Używaj zarządzanych override’ów zamiast edytować kopię w repo. Umieść swoje zmiany w `~/.openclaw/skills/<name>/SKILL.md` (lub dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, więc zarządzane override’y nadal wygrywają z bundlowanymi Skills bez dotykania gita. Jeśli Skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i steruj widocznością przez `agents.defaults.skills` i `agents.list[].skills`. Tylko zmiany warte upstreamu powinny trafiać do repo i wychodzić jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z własnego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` instaluje domyślnie do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli Skill ma być widoczny tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Cron jobs**: odizolowane zadania mogą ustawić override `model` per zadanie.
    - **Sub-agents**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w każdej chwili przełączyć model bieżącej sesji.

    Zobacz [Cron jobs](/pl/automation/cron-jobs), [Multi-Agent Routing](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot się zawiesza podczas ciężkiej pracy. Jak to odciążyć?">
    Użyj **sub-agentów** do długich lub równoległych zadań. Sub-agenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „utworzył subagenta do tego zadania” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt jest problemem, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem na Discordzie?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych kolejnych wiadomości).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby sterować automatycznym odwiązywaniem.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Domyślne globalne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override’y Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne wiązanie przy spawn: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Discord](/pl/channels/discord), [Configuration Reference](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja o zakończeniu trafiła w złe miejsce albo nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requestera:

    - Dostarczanie completion-mode subagent preferuje każdy powiązany wątek lub trasę rozmowy, jeśli taka istnieje.
    - Jeśli origin ukończenia niesie tylko kanał, OpenClaw wraca do zapisanej trasy sesji requestera (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca do kolejki dostarczenia sesji zamiast zostać opublikowany od razu na czacie.
    - Nieprawidłowe lub nieaktualne cele mogą nadal wymusić fallback do kolejki lub ostateczną porażkę dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować starszy, nieaktualny postęp.
    - Jeśli dziecko przekroczyło timeout po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyniki narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agents](/pl/tools/subagents), [Background Tasks](/pl/automation/tasks), [Session Tools](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron albo przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa bez przerwy,
    zaplanowane zadania nie będą się uruchamiały.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i że `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpień/restartów).
    - Zweryfikuj ustawienia strefy czasowej zadania (`--tz` vs strefa czasowa hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Automation & Tasks](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie oczekuje się żadnej zewnętrznej wiadomości.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy auth kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć, ale poświadczenia to zablokowały.
    - Cichy odizolowany wynik (`NO_REPLY` / `no_reply` tylko) jest traktowany jako celowo nienadający się do dostarczenia, więc runner tłumi też fallback do dostarczania z kolejki.

    W przypadku odizolowanych cron jobs runner zarządza końcowym dostarczeniem. Oczekuje się, że agent
    zwróci zwykłe podsumowanie tekstowe do wysłania przez runner. `--no-deliver` zachowuje
    ten wynik wewnętrznie; nie pozwala agentowi wysłać go bezpośrednio narzędziem
    message.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego odizolowane uruchomienie cron przełączyło model albo spróbowało ponownie raz?">
    Zwykle jest to ścieżka live model-switch, a nie podwójne planowanie.

    Odizolowany cron może zapisać runtime handoff modelu i ponowić próbę, gdy aktywne
    uruchomienie rzuci `LiveSessionModelSwitchError`. Retry zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie niosło nowy override profilu auth, cron
    też go zapisuje przed retry.

    Powiązane zasady wyboru:

    - Override modelu Gmail hook wygrywa jako pierwszy, gdy ma zastosowanie.
    - Następnie `model` per job.
    - Następnie dowolny zapisany override modelu sesji cron.
    - Następnie normalny wybór modelu domyślnego/agenta.

    Pętla retry jest ograniczona. Po początkowej próbie plus 2 retry przełączenia modelu
    cron przerywa zamiast zapętlać się w nieskończoność.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills na Linuxie?">
    Używaj natywnych poleceń `openclaw skills` albo wrzucaj Skills do swojego workspace. Interfejs Skills dla macOS nie jest dostępny na Linuxie.
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

    Natywne `openclaw skills install` zapisuje do katalogu `skills/` w aktywnym workspace.
    Osobny CLI `clawhub` instaluj tylko wtedy, gdy chcesz publikować albo
    synchronizować własne Skills. Dla współdzielonych instalacji między agentami umieść Skill w `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo ciągle w tle?">
    Tak. Użyj schedulera Gateway:

    - **Cron jobs** dla zadań zaplanowanych lub cyklicznych (utrzymują się po restartach).
    - **Heartbeat** dla okresowych kontroli „głównej sesji”.
    - **Isolated jobs** dla autonomicznych agentów, którzy publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Automation & Tasks](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Apple Skills tylko dla macOS z Linuxa?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane binaria, a Skills pojawiają się w system prompcie tylko wtedy, gdy kwalifikują się na **hoście Gateway**. Na Linuxie Skills tylko dla `darwin` (jak `apple-notes`, `apple-reminders`, `things-mac`) nie będą się ładować, chyba że nadpiszesz gating.

    Istnieją trzy obsługiwane wzorce:

    **Opcja A — uruchom Gateway na Macu (najprościej).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a następnie łącz się z Linuxa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B — użyj node macOS (bez SSH).**
    Uruchom Gateway na Linuxie, sparuj node macOS (aplikacja menubar) i ustaw **Node Run Commands** na „Always Ask” albo „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binaria istnieją na node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w promcie dodaje to polecenie do allowlist.

    **Opcja C — proxy binariów macOS przez SSH (zaawansowane).**
    Zachowaj Gateway na Linuxie, ale spraw, aby wymagane binaria CLI były rozwiązywane do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill, by dopuścić Linux, tak aby nadal się kwalifikował.

    1. Utwórz wrapper SSH dla binarnego pliku (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper na `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (workspace lub `~/.openclaw/skills`), aby dopuścić Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć snapshot Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie jako wbudowaną funkcję.

    Opcje:

    - **Własny Skill / plugin:** najlepsze do niezawodnego dostępu do API (Notion/HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz utrzymywać kontekst per klient (przepływy agencyjne), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobierał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz prośbę o funkcję albo zbuduj Skill
    korzystający z tych API.

    Instalacja Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalacje natywne trafiają do katalogu `skills/` aktywnego workspace. Dla współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli wspólna instalacja ma być widoczna tylko dla niektórych agentów, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre Skills oczekują binariów zainstalowanych przez Homebrew; na Linuxie oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linuxie powyżej). Zobacz [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz własną nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka jest lokalna dla hosta. Jeśli Gateway działa gdzie indziej, albo uruchom host node na maszynie z przeglądarką, albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na ref, a nie selektorach CSS
    - uploady wymagają `ref` / `inputRef` i obecnie obsługują jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandbox i pamięć

<AccordionGroup>
  <Accordion title="Czy jest osobny dokument o sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Dla konfiguracji specyficznej dla Dockera (pełny gateway w Dockerze albo obrazy sandbox) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani bundlowanych przeglądarek. Dla pełniejszej konfiguracji:

    - Zachowaj `/home/node` przez `OPENCLAW_HOME_VOLUME`, aby cache przetrwał.
    - Wbuduj zależności systemowe do obrazu przez `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez bundlowane CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest trwała.

    Dokumentacja: [Docker](/pl/install/docker), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować DM jako prywatne, a grupy jako publiczne/sandboxowane jednym agentem?">
    Tak — jeśli prywatny ruch to **DM**, a publiczny ruch to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż main) działały w Dockerze, a główna sesja DM pozostawała na hoście. Następnie ogranicz, które narzędzia są dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowy config: [Groups: personal DMs + public groups](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowe odniesienie do konfiguracji: [Gateway configuration](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxu?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne bindy i bindy per agent są scalane; bindy per agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że bindy omijają ściany systemu plików sandboxu.

    OpenClaw waliduje źródła bind zarówno względem ścieżki znormalizowanej, jak i kanonicznej ścieżki rozwiązywanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego symlinkiem nadal kończą się fail closed, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonych rootów nadal mają zastosowanie po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) i [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi o bezpieczeństwie.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Notatki dzienne w `memory/YYYY-MM-DD.md`
    - Kuratorowane notatki długoterminowe w `MEMORY.md` (tylko sesje main/prywatne)

    OpenClaw uruchamia też **cichy flush pamięci przed kompaktowaniem**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatycznym kompaktowaniem. To działa tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle o czymś zapomina. Jak sprawić, żeby to zostało?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafiać do `MEMORY.md`,
    a krótkoterminowy kontekst do `memory/YYYY-MM-DD.md`.

    To wciąż obszar, który ulepszamy. Pomaga przypominanie modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    workspace przy każdym uruchomieniu.

    Dokumentacja: [Memory](/pl/concepts/memory), [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się na zawsze? Jakie są limity?">
    Pliki pamięci żyją na dysku i utrzymują się, dopóki ich nie usuniesz. Limitem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony przez
    okno kontekstu modelu, więc długie rozmowy mogą zostać skompaktowane lub przycięte. Dlatego
    istnieje wyszukiwanie pamięci — przywraca do kontekstu tylko istotne fragmenty.

    Dokumentacja: [Memory](/pl/concepts/memory), [Context](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje chat/completions i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth lub login
    Codex CLI)** nie pomaga przy semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybierze dostawcę, gdy
    uda się rozwiązać klucz API (profile auth, `models.providers.*.apiKey` albo zmienne env).
    Preferuje OpenAI, jeśli uda się rozwiązać klucz OpenAI, w przeciwnym razie Gemini, potem Voyage, a potem Mistral.
    Jeśli nie ma dostępnego zdalnego klucza, wyszukiwanie pamięci
    pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwane, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingi Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local** —
    szczegóły konfiguracji znajdziesz w [Memory](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co do nich wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, config i workspace żyją na hoście Gateway
      (`~/.openclaw` + Twój katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI itd.) trafiają do
      ich API, a platformy czatu (WhatsApp/Telegram/Slack itd.) przechowują dane wiadomości na
      swoich serwerach.
    - **Ty kontrolujesz ślad:** użycie modeli lokalnych trzyma prompty na Twojej maszynie, ale ruch kanałowy
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Agent workspace](/pl/concepts/agent-workspace), [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Path                                                            | Przeznaczenie                                                      |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główny config (JSON5)                                              |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import legacy OAuth (kopiowany do profili auth przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile auth (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny payload sekretu w pliku dla dostawców `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Plik zgodności legacy (statyczne wpisy `api_key` są czyszczone)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Ścieżka legacy dla pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (`AGENTS.md`, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (lub fallback legacy `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: config, stan kanału/dostawcy, profile auth, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa workspace **hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania albo preferencji, poproś bota, aby **zapisał je do
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Agent workspace](/pl/concepts/agent-workspace) i [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repo git i twórz jego kopię zapasową gdzieś
    prywatnie (na przykład prywatny GitHub). To przechwytuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych payloadów sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, twórz osobne kopie zapasowe workspace i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz osobny przewodnik: [Uninstall](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza workspace?">
    Tak. Workspace to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne rozwiązują się wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandbox per agent. Jeśli
    chcesz, aby repo było domyślnym katalogiem roboczym, wskaż `workspace`
    tego agenta na root repo. Repo OpenClaw to tylko kod źródłowy; trzymaj
    workspace oddzielnie, chyba że celowo chcesz, aby agent pracował w nim.

    Przykład (repo jako domyślny cwd):

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
  <Accordion title="Jaki format ma config? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalny config **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używane są dość bezpieczne wartości domyślne (w tym domyślny workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Bindowanie bez loopback **wymaga poprawnej ścieżki gateway auth**. W praktyce oznacza to:

    - auth ze wspólnym sekretem: token lub hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym non-loopback identity-aware reverse proxy

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

    - `gateway.remote.token` / `.password` same w sobie **nie** włączają lokalnego gateway auth.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla auth hasłem ustaw `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się fail closed (bez maskującego fallbacku zdalnego).
    - Konfiguracje Control UI ze wspólnym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania wspólnych sekretów w URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy z loopback na tym samym hoście nadal **nie** spełnia trusted-proxy auth. Trusted proxy musi być skonfigurowanym źródłem bez loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu nawet na localhost?">
    OpenClaw wymusza gateway auth domyślnie, także dla loopback. W normalnej domyślnej ścieżce oznacza to auth tokenem: jeśli nie skonfigurowano jawnie ścieżki auth, start gateway przechodzi do trybu token i automatycznie go generuje, zapisując do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. To blokuje innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę auth, możesz jawnie wybrać tryb hasła (lub, dla non-loopback identity-aware reverse proxy, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w configu. Doctor może wygenerować token w każdej chwili: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy po zmianie configu muszę restartować?">
    Gateway obserwuje config i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosowane na gorąco, krytyczne wymagają restartu
    - obsługiwane są także `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Jak wyłączyć zabawne tagline w CLI?">
    Ustaw `cli.banner.taglineMode` w configu:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ukrywa tekst tagline, ale pozostawia tytuł banera/linię wersji.
    - `default`: zawsze używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe tagline (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć web search (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci o API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają zwykłej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest to nieoficjalna integracja oparta na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy env:

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
              provider: "firecrawl", // opcjonalne; pomiń dla auto-detekcji
            },
          },
        },
    }
    ```

    Konfiguracja web-search specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Ścieżki dostawców legacy `tools.web.search.*` nadal tymczasowo się ładują dla zgodności, ale nie powinny być używane w nowych configach.
    Konfiguracja fallbacku Firecrawl web-fetch znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz allowlist, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest włączone domyślnie (chyba że zostało jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykryje pierwszego gotowego dostawcę fetch fallback na podstawie dostępnych poświadczeń. Obecnie bundlowanym dostawcą jest Firecrawl.
    - Demony odczytują zmienne env z `~/.openclaw/.env` (lub ze środowiska usługi).

    Dokumentacja: [Web tools](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyścił mój config. Jak odzyskać dane i jak tego uniknąć?">
    `config.apply` zastępuje **cały config**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Odzyskiwanie:

    - Przywróć z kopii zapasowej (git albo skopiowany `~/.openclaw/openclaw.json`).
    - Jeśli nie masz kopii, uruchom ponownie `openclaw doctor` i ponownie skonfiguruj kanały/modele.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatni znany config albo dowolną kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działający config z logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw użyj `config.schema.lookup`, gdy nie jesteś pewien dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zostaw wyłącznie do pełnej zamiany configu.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla ownera podczas uruchomienia agenta, nadal odrzuci ono zapisy do `tools.exec.ask` / `tools.exec.security` (w tym aliasy legacy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway z wyspecjalizowanymi workerami na wielu urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **nodes** i **agents**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Nodes (urządzenia):** Maki/iOS/Android podłączają się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agents (workery):** oddzielne „mózgi”/workspace dla wyspecjalizowanych ról (np. „Hetzner ops”, „Dane osobiste”).
    - **Sub-agents:** uruchamiają pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Remote access](/pl/gateway/remote), [Multi-Agent Routing](/pl/concepts/multi-agent), [Sub-agents](/pl/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać w trybie headless?">
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

    Wartość domyślna to `false` (z oknem). Tryb headless częściej wywołuje kontrole antybotowe na niektórych stronach. Zobacz [Browser](/pl/tools/browser).

    Headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (używaj screenshotów, jeśli potrzebujesz wizualizacji).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarium Brave (lub dowolnej przeglądarki opartej na Chromium) i zrestartuj Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Browser](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gateway i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegramem, gateway i nodes?">
    Wiadomości z Telegrama są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą ruchu przychodzącego od dostawców; otrzymują tylko wywołania RPC node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (screen, camera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na hoście zawsze włączonym (VPS/serwer domowy).
    2. Umieść host Gateway i komputer w tej samej tailnet.
    3. Upewnij się, że WS Gateway jest osiągalny (bind tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nie jest wymagany żaden osobny most TCP; nodes łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie node macOS umożliwia `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i zapoznaj się z [Security](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Gateway protocol](/pl/gateway/protocol), [macOS remote mode](/pl/platforms/mac/remote), [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan Gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie zweryfikuj auth i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że allowlisty (DM lub grupy) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Remote access](/pl/gateway/remote), [Channels](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to spiąć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (generyczny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, celując w czat, którego drugi bot
    nasłuchuje. Jeśli jeden bot jest na zdalnym VPS, skieruj swoje CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Remote access](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może dotrzeć do docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj guardrail, aby oba boty nie zapętliły się bez końca (tylko wzmianki, allowlisty kanałów
    albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Remote access](/pl/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy do wielu agentów potrzebuję osobnych VPS-ów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własnym workspace, domyślnymi modelami
    i routingiem. To jest normalna konfiguracja i jest dużo tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granice bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie trzymaj jeden Gateway i
    używaj wielu agentów albo subagentów.

  </Accordion>

  <Accordion title="Czy jest korzyść z używania node na moim osobistym laptopie zamiast SSH z VPS?">
    Tak — nodes to rozwiązanie pierwszej klasy do docierania zdalnym Gateway do Twojego laptopa i
    otwierają więcej niż sam dostęp do powłoki. Gateway działa na macOS/Linuxie (Windows przez WSL2) i jest
    lekki (mały VPS albo urządzenie klasy Raspberry Pi wystarczą; 4 GB RAM to dużo), więc typowa
    konfiguracja to host zawsze włączony plus laptop jako node.

    - **Bez przychodzącego SSH.** Nodes łączą się wychodząco do Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze sterowanie wykonaniem.** `system.run` jest ograniczane przez allowlisty/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host node na laptopie albo dołączaj do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale nodes są prostsze dla ciągłych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na hosta, chyba że celowo uruchamiasz izolowane profile (zobacz [Multiple gateways](/pl/gateway/multiple-gateways)). Nodes są urządzeniami peryferyjnymi, które łączą się
    z gateway (nodes iOS/Android albo tryb „node mode” macOS w aplikacji menubar). Dla headless hostów node
    i sterowania CLI zobacz [Node host CLI](/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania configu?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo configu z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC)
    - `config.apply`: zweryfikuj + zastąp cały config, a następnie zrestartuj
    - Narzędzie runtime `gateway`, dostępne tylko dla ownera, nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; aliasy legacy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalny sensowny config dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia Twój workspace i ogranicza, kto może wywołać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tej samej tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    To utrzymuje gateway przypięty do loopback i wystawia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć node Mac z zdalnym Gateway (Tailscale Serve)?">
    Serve wystawia **Gateway Control UI + WS**. Nodes łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tej samej tailnet**.
    2. **Używaj aplikacji macOS w trybie Remote** (celem SSH może być nazwa hosta tailnet).
       Aplikacja przetuneluje port Gateway i połączy się jako node.
    3. **Zatwierdź node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Gateway protocol](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [macOS remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem instalować to na drugim laptopie, czy po prostu dodać node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **node**. Dzięki temu zachowujesz pojedynczy Gateway i unikasz duplikowania configu. Lokalne narzędzia node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Instaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch w pełni oddzielnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne env i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne env z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny fallback `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych env.

    Możesz też definiować w configu wbudowane zmienne env (stosowane tylko wtedy, gdy brakuje ich w env procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełny priorytet i źródła znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne env zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy Twojego env z powłoki.
    2. Włącz import z powłoki (opcja convenience):

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

    To uruchamia Twoją login shell i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` raportuje, czy **import env z powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że brakuje Twoich zmiennych env — oznacza tylko, że OpenClaw nie będzie
    automatycznie ładował Twojej login shell.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska Twojej powłoki.
    Naprawa przez jedno z poniższych:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w configu (stosowane tylko, gdy brakuje).

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
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Session management](/pl/concepts/session).
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

  <Accordion title="Czy da się zbudować zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **multi-agent routing** i **sub-agents**. Możesz utworzyć jednego
    koordynującego agenta i kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **zabawny eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z osobnymi sesjami. Typowy model, który
    zakładamy, to jeden bot, z którym rozmawiasz, z różnymi sesjami dla pracy równoległej. Ten
    bot może też uruchamiać subagentów, gdy to potrzebne.

    Dokumentacja: [Multi-agent routing](/pl/concepts/multi-agent), [Sub-agents](/pl/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został przycięty w środku zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże wyniki narzędzi lub wiele
    plików mogą wywołać kompaktowanie albo przycinanie.

    Co pomaga:

    - Poproś bota, aby podsumował bieżący stan i zapisał go do pliku.
    - Użyj `/compact` przed długimi zadaniami, a `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby odczytał go ponownie.
    - Używaj subagentów do długiej lub równoległej pracy, aby główny czat był mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli to zdarza się często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zachować instalację?">
    Użyj polecenia reset:

    ```bash
    openclaw reset
    ```

    Nieinteraktywny pełny reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie ponownie uruchom konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding również oferuje **Reset**, jeśli wykryje istniejący config. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (tylko dev; czyści config dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" — jak zresetować albo skompaktować?'>
    Użyj jednego z poniższych:

    - **Compact** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli to ciągle się dzieje:

    - Włącz lub dostrój **session pruning** (`agents.defaults.contextPruning`), aby przycinać stare wyniki narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Session pruning](/pl/concepts/session-pruning), [Session management](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję przez `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości heartbeat co 30 minut?">
    Heartbeat uruchamia się domyślnie co **30m** (**1h** przy użyciu auth OAuth). Dostosuj lub wyłącz:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // lub "0m", aby wyłączyć
          },
        },
      },
    }
    ```

    Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki
    markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.

    Override’y per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją zobaczyć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie dopuścisz nadawców (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wywoływać odpowiedzi grupowe:

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
    Opcja 1 (najszybsza): śledź logi i wyślij testową wiadomość do grupy:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowane/w allowlist): wypisz grupy z configu:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Bramka wzmianki jest włączona (domyślnie). Musisz oznaczyć bota przez @mention (albo dopasować `mentionPatterns`).
    - Skonfigurowałeś `channels.whatsapp.groups` bez `"*"`, a grupa nie znajduje się na allowlist.

    Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zapadają się do sesji głównej. Grupy/kanały mają własne klucze sesji, a tematy Telegrama / wątki Discorda są oddzielnymi sesjami. Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Nie ma twardych limitów. Dziesiątki (a nawet setki) są w porządku, ale uważaj na:

    - **Wzrost zużycia dysku:** sesje + transkrypty żyją w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile auth per agent, workspace i routing kanałów.

    Wskazówki:

    - Trzymaj jeden **aktywny** workspace per agent (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuń JSONL albo wpisy store), jeśli rośnie zużycie dysku.
    - Używaj `openclaw doctor`, aby wykrywać osierocone workspace i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **Multi-Agent Routing**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peer. Slack jest obsługiwany jako kanał i może być powiązany z konkretnymi agentami.

    Dostęp przez przeglądarkę jest potężny, ale nie oznacza „zrób wszystko, co może człowiek” — antybot, CAPTCHA i MFA
    nadal mogą blokować automatyzację. Dla najbardziej niezawodnego sterowania przeglądarką używaj lokalnego Chrome MCP na hoście,
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Zalecana konfiguracja:

    - Host Gateway zawsze włączony (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP albo node w razie potrzeby.

    Dokumentacja: [Multi-Agent Routing](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Browser](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: wartości domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Co to jest "domyślny model"?'>
    Domyślny model OpenClaw to to, co ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołuje się jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie jednoznacznego dopasowania do skonfigurowanego dostawcy dla dokładnego ID modelu, a dopiero potem wraca do skonfigurowanego dostawcy domyślnego jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast eksponować nieaktualną wartość domyślną usuniętego dostawcy. Nadal jednak powinieneś **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany model domyślny:** używaj najmocniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Dla rutynowego/niskiego ryzyka czatu:** używaj tańszych modeli fallback i kieruj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Local models](/pl/gateway/local-models).

    Zasada kciuka: do zadań o wysokiej stawce używaj **najlepszego modelu, na jaki Cię stać**, a tańszego
    modelu do rutynowego czatu lub podsumowań. Możesz kierować modele per agent i używać subagentów do
    równoleglenia długich zadań (każdy subagent zużywa tokeny). Zobacz [Models](/pl/concepts/models) i
    [Sub-agents](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze/nadmiernie kwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowanie. Zobacz [Security](/pl/gateway/security).

    Więcej kontekstu: [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączać modele bez niszczenia configu?">
    Używaj **poleceń modelu** albo edytuj tylko pola **modelu**. Unikaj pełnego zastępowania configu.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko config modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że zamierzasz zastąpić cały config.
    Przy edycjach RPC najpierw sprawdzaj przez `config.schema.lookup` i preferuj `config.patch`. Payload lookup daje znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu i podsumowania bezpośrednich dzieci
    dla częściowych aktualizacji.
    Jeśli jednak nadpisałeś config, przywróć go z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby go naprawić.

    Dokumentacja: [Models](/pl/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najłatwiejsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz lokalny model, np. `ollama pull glm-4.7-flash`
    3. Jeśli chcesz też modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje Ci modele chmurowe oraz lokalne modele Ollama
    - modele chmurowe takie jak `kimi-k2.5:cloud` nie wymagają lokalnego pobrania
    - do ręcznego przełączania używaj `openclaw models list` oraz `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno kwantyzowane modele są bardziej podatne na