---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, onboardingu lub wsparcia w runtime
    - Wstępna analiza problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-21T09:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz głębsze rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny development, VPS, wielu agentów, OAuth/klucze API, fallback modeli). Diagnostykę runtime znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełną dokumentację referencyjną konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja providera + problemy runtime (gdy Gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnostyka tylko do odczytu z końcówką logów (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje runtime supervisora względem osiągalności RPC, docelowy URL sondy oraz której konfiguracji usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia sondę stanu Gateway na żywo, w tym sondy kanałów, jeśli są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Health](/pl/gateway/health).

5. **Śledzenie najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj zamiast tego:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielne od logów usługi; zobacz [Logging](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom Doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole zdrowia. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Odpytuje działający Gateway o pełną migawkę (tylko WS). Zobacz [Health](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twoją maszynę**. To jest znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawić
    konfigurację na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Przekaż im
    **pełne checkout źródeł** przez instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może czytać kod + dokumentację i
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do audytu.

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

    - `openclaw status`: szybka migawka stanu Gateway/agenta + podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie providera + dostępność modeli.
    - `openclaw doctor`: sprawdza i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś nie działa](#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle się pomija. Co oznaczają powody pomijania?">
    Typowe powody pomijania Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/nagłówkowy szkielet
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagalny
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po zakończeniu
    rzeczywistego uruchomienia heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może również automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/dev):

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
    Kreator otwiera przeglądarkę z czystym (bez tokena) URL dashboardu zaraz po onboardingu i wypisuje także link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost w porównaniu ze zdalnym hostem?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli pojawi się prośba o uwierzytelnianie shared secret, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokena: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli shared secret nie jest jeszcze skonfigurowany, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bindowanie loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejania shared secret, zakłada zaufany host Gateway); API HTTP nadal wymagają uwierzytelniania shared secret, chyba że celowo użyjesz private-ingress `none` albo uwierzytelniania HTTP trusted-proxy.
      Równoczesne nieudane próby uwierzytelnienia Serve z tego samego klienta są serializowane, zanim ogranicznik nieudanych uwierzytelnień je zarejestruje, więc druga błędna próba może już pokazać `retry later`.
    - **Tailnet bind**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący shared secret w ustawieniach dashboardu.
    - **Reverse proxy świadome tożsamości**: pozostaw Gateway za trusted proxy innym niż loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie shared secret nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli zostaniesz o to poproszony.

    Zobacz [Dashboard](/web/dashboard) i [Powierzchnie webowe](/web), aby poznać tryby bind i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń w czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje prompty zatwierdzania do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Polityka host exec nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko to, gdzie pojawiają się
    prompty zatwierdzania i jak ludzie mogą odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` nie jest ustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, to natywne UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy prompty muszą być również przekazywane do innych czatów lub jawnych pokoi operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy jawnie chcesz, aby prompty zatwierdzania były publikowane z powrotem w pokoju/temacie źródłowym.
    - Zatwierdzenia Plugin są znowu osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre natywne kanały utrzymują dodatkowo natywną obsługę zatwierdzania pluginów.

    Krótko: przekazywanie służy do routingu, a natywna konfiguracja klienta służy do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego runtime potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    dysku jako wystarczające do użytku osobistego oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć większy zapas (logi, multimedia, inne usługi), zalecane jest **2GB**,
    ale nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz parować **nodes** na laptopie/telefonie do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    W skrócie: działa, ale spodziewaj się pewnych niedoskonałości.

    - Używaj systemu **64-bitowego** i utrzymuj Node >= 22.
    - Preferuj instalację **hackable (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je po jednym.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz tę linię bez **żadnej odpowiedzi**
    i liczba tokenów pozostaje na 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

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

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego przechodzenia onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom raz Doctor. To
    zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i
    stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i uruchom ponownie usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, poświadczenia WhatsApp, sesje i pamięć. Jeśli używasz
    trybu zdalnego, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój workspace do GitHub, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    w `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego jest w najnowszej wersji?">
    Sprawdź changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna datowana
    sekcja to najnowsza wydana wersja. Wpisy są pogrupowane według **Highlights**, **Changes** i
    **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz ją albo dodaj `docs.openclaw.ai` do listy dozwolonych, a potem spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz uzyskać dostępu do strony, dokumentacja jest kopiowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle stabilne wydanie trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję na `latest`. Maintainerzy mogą też
    publikować bezpośrednio na `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Aby zobaczyć jednolinijkowe polecenia instalacji oraz różnicę między beta a dev, sprawdź poniższy accordion.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma głowa `main` (git); po publikacji używa npm dist-tag `dev`.

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

  <Accordion title="Jak wypróbować najnowsze elementy?">
    Dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackable (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daje to lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz samodzielnie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/cli/update), [Kanały rozwojowe](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Jak długo zwykle trwa instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut zależnie od liczby skonfigurowanych kanałów/modeli

    Jeśli się zawiesi, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania z [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnej?">
    Uruchom ponownie instalator z **szczegółowym wyjściem**:

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

    Odpowiednik w Windows (PowerShell):

    ```powershell
    # install.ps1 nie ma jeszcze osobnej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja w Windows mówi git not found lub openclaw not recognized">
    Dwa częste problemy w Windows:

    **1) błąd npm spawn git / git not found**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i otwórz ponownie PowerShell, a następnie ponownie uruchom instalator.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (w Windows nie potrzeba sufiksu `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i otwórz ponownie PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz możliwie najpłynniejszej konfiguracji Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec w Windows pokazuje zniekształcony chiński tekst — co zrobić?">
    Zwykle jest to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - wyjście `system.run`/`exec` wyświetla chiński tekst jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie uruchom ponownie Gateway i spróbuj ponownie wykonać polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackable (git)**, aby mieć lokalnie pełne źródła i dokumentację, a następnie zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł czytać repozytorium i precyzyjnie odpowiadać.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem Linux, a potem uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Dowolny Linux VPS działa. Zainstaluj na serwerze, a następnie użyj SSH/Tailscale, aby uzyskać dostęp do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Prowadzimy **hub hostingu** z popularnymi providerami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy providerzy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz parować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie przy jednoczesnym
    utrzymaniu Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway remote](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby zaktualizował się sam?">
    Krótka odpowiedź: **to możliwe, ale niezalecane**. Przepływ aktualizacji może uruchomić ponownie
    Gateway (co zrywa aktywną sesję), może wymagać czystego checkoutu git i
    może prosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

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

    Dokumentacja: [Aktualizacja](/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza przez:

    - **Konfigurację modelu/uwierzytelniania** (OAuth providera, klucze API, token konfiguracji Anthropic oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone pluginy kanałowe, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole zdrowia** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany lub brakuje uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw za pomocą **kluczy API** (Anthropic/OpenAI/innych) albo z
    **wyłącznie lokalnymi modelami**, aby Twoje dane pozostawały na urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych providerów.

    W przypadku Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: zwykłe rozliczanie API Anthropic
    - **Uwierzytelnianie Claude CLI / subskrypcją Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest znowu dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwale działających hostów gateway klucze API Anthropic są nadal bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwane dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [GLM Models](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcją Claude i użycie `claude -p` jako zatwierdzone
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że takie użycie jest znowu dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Token konfiguracji Anthropic nadal jest dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub obciążeń wieloużytkownikowych uwierzytelnianie kluczem API Anthropic nadal jest
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [GLM
    Models](/pl/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
To oznacza, że Twój **limit/quota Anthropic** został wyczerpany w bieżącym oknie. Jeśli
używasz **Claude CLI**, poczekaj na reset okna albo przejdź na wyższy plan. Jeśli
używasz **klucza API Anthropic**, sprawdź Anthropic Console
pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety 1M kontekstu Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł dalej odpowiadać, gdy provider ma ograniczenie szybkości.
    Zobacz [Models](/cli/models), [OAuth](/pl/concepts/oauth) i
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego providera **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiska AWS, OpenClaw może automatycznie wykryć katalog streaming/text Bedrock i scalić go jako niejawnego providera `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis providera. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Providerzy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Onboarding może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy to odpowiednie. Zobacz [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego ChatGPT GPT-5.4 nie odblokowuje openai/gpt-5.4 w OpenClaw?">
    OpenClaw traktuje te dwie ścieżki oddzielnie:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = bezpośrednie API OpenAI Platform

    W OpenClaw logowanie ChatGPT/Codex jest podłączone do ścieżki `openai-codex/*`,
    a nie do bezpośredniej ścieżki `openai/*`. Jeśli chcesz bezpośredniej ścieżki API w
    OpenClaw, ustaw `OPENAI_API_KEY` (lub równoważną konfigurację providera OpenAI).
    Jeśli chcesz logowania ChatGPT/Codex w OpenClaw, użyj `openai-codex/*`.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą różnić się od ChatGPT web?">
    `openai-codex/*` używa ścieżki Codex OAuth, a jego użyteczne okna limitów są
    zarządzane przez OpenAI i zależne od planu. W praktyce te limity mogą różnić się od
    doświadczenia na stronie/aplikacji ChatGPT, nawet gdy oba są powiązane z tym samym kontem.

    OpenClaw może pokazywać aktualnie widoczne okna użycia/limitu providera w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na używanie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może uruchomić za Ciebie przepływ OAuth.

    Zobacz [OAuth](/pl/concepts/oauth), [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania zawodzą, ustaw `GOOGLE_CLOUD_PROJECT` albo `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście gateway. Szczegóły: [Providerzy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnych zabezpieczeń; małe karty obcinają i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Security](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanego modelu w określonym regionie?">
    Wybieraj endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić obok nich Anthropic/OpenAI, używając `models.mode: "merge"`, aby fallbacki pozostały dostępne przy jednoczesnym zachowaniu wybranego providera regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy lub urządzenie klasy Raspberry Pi też się sprawdzi.

    Maca potrzebujesz tylko do **narzędzi wyłącznie dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linux albo gdzie indziej. Jeśli chcesz innych narzędzi wyłącznie dla macOS, uruchom Gateway na Macu albo sparuj node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. To **nie** musi być Mac mini —
    dowolny Mac wystarczy. Dla iMessage **użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) — serwer BlueBubbles działa na macOS, podczas gdy Gateway może działać na Linux albo gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBook Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może łączyć się jako
    **node** (urządzenie towarzyszące). Nodes nie uruchamiają Gateway — zapewniają dodatkowe
    możliwości, takie jak screen/camera/canvas oraz `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo host node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy runtime, szczególnie z WhatsApp i Telegram.
    Używaj **Node** dla stabilnych gateway.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co trafia do allowFrom?">
    `channels.telegram.allowFrom` to **Telegram user ID ludzkiego nadawcy** (numeryczny). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi tylko o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne narzędzie (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż WhatsApp **DM** każdego nadawcy (peer `kind: "direct"`, E.164 nadawcy, np. `+15551234567`) z innym `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą pochodzić z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla całego konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „fast chat” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto providera lub konkretni peerzy) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozpoznawane w nieinteraktywnych powłokach.
    Nowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i uwzględniają `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackable git a npm install">
    - **Instalacja hackable (git):** pełny checkout źródeł, możliwość edycji, najlepsze dla współtwórców.
      Uruchamiasz buildy lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza, gdy chcesz „po prostu uruchomić”.
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm a git?">
    Tak. Zainstaluj drugi wariant, a następnie uruchom Doctor, aby usługa gateway wskazywała nowy entrypoint.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
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

    Doctor wykrywa niedopasowanie entrypointu usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszych trudności i akceptujesz uśpienia/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki na żywo.
    - **Wady:** uśpienie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają działanie, maszyna musi pozostać wybudzona.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bezgłowo (używaj zrzutów ekranu), tylko zdalny dostęp do plików, musisz używać SSH do aktualizacji.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają dobrze z VPS. Jedyny realny kompromis to **bezgłowa przeglądarka** versus widoczne okno. Zobacz [Browser](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej zdarzały Ci się rozłączenia gateway. Lokalnie świetnie działa wtedy, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw z powodu uśpienia/restartów, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie w porządku do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przechodzi w uśpienie albo się aktualizuje.

    Jeśli chcesz połączyć oba światy, utrzymuj Gateway na dedykowanym hoście i sparuj laptop jako **node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: używaj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway i wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność narzędziową. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw, w jednym akapicie?">
    OpenClaw to osobisty asystent AI uruchamiany na własnych urządzeniach. Odpowiada na platformach komunikacyjnych, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone pluginy kanałowe, takie jak QQ Bot), a także może obsługiwać głos + live Canvas na wspieranych platformach. **Gateway** to zawsze włączona płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie jest „po prostu wrapper Claude”. To **local-first płaszczyzna sterowania**, która pozwala uruchamiać
    zaawansowanego asystenta na **Twoim własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    trwałymi sesjami, pamięcią i narzędziami — bez oddawania kontroli nad swoimi przepływami pracy hostowanemu
    SaaS.

    Najważniejsze zalety:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS) i trzymaj
      lokalnie workspace + historię sesji.
    - **Prawdziwe kanały, nie sandbox webowy:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      a także mobilny voice i Canvas na wspieranych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      per agent i failover.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** oddzielni agenci per kanał, konto lub zadanie, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackable:** sprawdzaj, rozszerzaj i self-hostuj bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wielu agentów](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem — co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (sprzątanie, nazewnictwo, tagowanie).
    - Podłącz Gmail i zautomatyzuj podsumowania albo follow-upy.

    Może obsługiwać duże zadania, ale działa najlepiej, gdy dzielisz je na fazy i
    używasz sub-agentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i interesujących Cię wiadomości.
    - **Research i tworzenie szkiców:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i follow-upy:** ponaglenia i checklisty napędzane przez Cron lub Heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway wykonać je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, w przypadku **researchu, kwalifikacji i tworzenia szkiców**. Może skanować strony, budować shortlisty,
    podsumowywać potencjalnych klientów i pisać szkice outreachu albo copy reklamowego.

    W przypadku **outreachu albo uruchamiania reklam** trzymaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform, i sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to pozwolić
    OpenClaw tworzyć szkice, a Tobie je zatwierdzać.

    Dokumentacja: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu stron internetowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramowanie, hooki)
    - **Zawsze włączony Gateway** (uruchamiasz na VPS, korzystasz z dowolnego miejsca)
    - **Nodes** dla lokalnych funkcji browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez pozostawiania repozytorium w brudnym stanie?">
    Używaj zarządzanych nadpisań zamiast edytowania kopii w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet jest następujący: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają pierwszeństwo nad dołączonymi Skills bez dotykania gita. Jeśli Skill ma być zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte wniesienia upstream powinny żyć w repozytorium i wychodzić jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` w następnej sesji. Jeśli Skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` albo `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: odizolowane zadania mogą ustawiać nadpisanie `model` dla każdego zadania.
    - **Sub-agenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie zmienić model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **sub-agentów** do długich lub równoległych zadań. Sub-agenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „uruchomił sub-agenta dla tego zadania”, albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i sub-agenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla sub-agentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje sub-agentów powiązane z wątkiem na Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z sub-agentem albo celem sesji, tak aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych odpowiedzi następczych).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne odwiązanie.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference), [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Sub-agent zakończył działanie, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozpoznaną trasę żądającego:

    - Dostarczanie completion-mode sub-agenta preferuje dowolny powiązany wątek albo trasę rozmowy, jeśli taka istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca wtedy do kolejkowanego dostarczenia sesji zamiast natychmiastowego opublikowania na czacie.
    - Nieprawidłowe albo nieaktualne cele nadal mogą wymusić fallback do kolejki albo końcową awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta podrzędnego to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo pomija ogłoszenie zamiast publikować nieaktualny wcześniejszy postęp.
    - Jeśli podrzędny proces przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzia sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron albo przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa stale,
    zaplanowane zadania nie będą się uruchamiać.

    Lista kontrolna:

    - Potwierdź, że Cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpień/restartów).
    - Zweryfikuj ustawienia strefy czasowej zadania (`--tz` względem strefy czasowej hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać fallbackowego wysłania przez runner.
    - Brakujący albo nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął wychodzące dostarczenie.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wynik, ale poświadczenia to zablokowały.
    - Cichy wynik odizolowany (`NO_REPLY` / `no_reply`) jest traktowany jako celowo niedostarczalny, więc runner również pomija kolejkowane dostarczenie fallbackowe.

    W przypadku odizolowanych zadań Cron agent nadal może wysyłać bezpośrednio za pomocą narzędzia `message`,
    gdy trasa czatu jest dostępna. `--announce` kontroluje tylko ścieżkę
    fallbackową runnera dla końcowego tekstu, którego agent jeszcze sam nie wysłał.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego odizolowane uruchomienie Cron przełączyło modele albo wykonało jedno ponowienie?">
    Zwykle jest to ścieżka przełączania modelu na żywo, a nie zduplikowane harmonogramowanie.

    Odizolowany Cron może utrwalić przekazanie modelu w runtime i wykonać
    ponowienie, gdy aktywne uruchomienie zgłosi `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    providera/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, Cron
    zapisuje je również przed ponowieniem.

    Powiązane zasady wyboru:

    - Nadpisanie modelu hooka Gmail ma pierwszeństwo, gdy ma zastosowanie.
    - Następnie `model` dla danego zadania.
    - Następnie dowolne zapisane nadpisanie modelu sesji Cron.
    - Następnie zwykły wybór modelu domyślnego/agenta.

    Pętla ponowień jest ograniczona. Po początkowej próbie i 2 ponowieniach przełączenia modelu
    Cron przerywa działanie zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills na Linux?">
    Używaj natywnych poleceń `openclaw skills` albo umieszczaj Skills w swoim workspace. Interfejs Skills UI na macOS nie jest dostępny na Linux.
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

    Natywne `openclaw skills install` zapisuje do katalogu `skills/`
    aktywnego workspace. Osobne CLI `clawhub` instaluj tylko wtedy, gdy chcesz publikować albo
    synchronizować własne Skills. W przypadku współdzielonych instalacji między agentami umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz ograniczyć, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** dla zadań zaplanowanych albo cyklicznych (trwają po restartach).
    - **Heartbeat** dla okresowych kontroli „głównej sesji”.
    - **Zadania odizolowane** dla autonomicznych agentów, które publikują podsumowania albo dostarczają je na czaty.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Apple Skills tylko dla macOS z Linux?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane binaria, a Skills pojawiają się w prompcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. Na Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie załadują się, chyba że nadpiszesz to ograniczenie.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a następnie łącz się z Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj node macOS (bez SSH).**
    Uruchom Gateway na Linux, sparuj node macOS (aplikacja menu bar) i ustaw **Node Run Commands** na „Always Ask” albo „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binaria istnieją na node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w prompcie doda to polecenie do listy dozwolonych.

    **Opcja C - proxy binariów macOS przez SSH (zaawansowane).**
    Pozostaw Gateway na Linux, ale spraw, aby wymagane binaria CLI były rozwiązywane do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill tak, aby zezwalał na Linux, by pozostał kwalifikujący się.

    1. Utwórz wrapper SSH dla binarium (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (workspace albo `~/.openclaw/skills`), aby zezwalały na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Zarządzaj Apple Notes przez CLI memo na macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć snapshot Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie wbudowaną.

    Opcje:

    - **Własny Skill / Plugin:** najlepsze do niezawodnego dostępu do API (zarówno Notion, jak i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz utrzymywać kontekst dla każdego klienta osobno (przepływy agencyjne), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobierał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz prośbę o funkcję albo zbuduj Skill
    dla tych API.

    Zainstaluj Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do katalogu `skills/` aktywnego workspace. W przypadku współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci powinni widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują binariów instalowanych przez Homebrew; na Linux oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz własnej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo podłączonego browser node. Jeśli Gateway działa gdzie indziej, uruchom host node na maszynie przeglądarki albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - działania są oparte na `ref`, a nie na selektorach CSS
    - uploady wymagają `ref` / `inputRef` i obecnie obsługują tylko jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i działania wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobny dokument o sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Dla konfiguracji specyficznej dla Docker (pełny Gateway w Docker albo obrazy sandbox) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` przez `OPENCLAW_HOME_VOLUME`, aby cache przetrwały.
    - Wbuduj zależności systemowe do obrazu przez `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować DM jako prywatne, ale zrobić grupy publiczne/w sandboxie z jednym agentem?">
    Tak — jeśli Twój prywatny ruch to **DM**, a publiczny ruch to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grupowe/kanałowe (klucze non-main) działały w skonfigurowanym backendzie sandbox, podczas gdy główna sesja DM pozostaje na hoście. Docker jest domyślnym backendem, jeśli nie wybierzesz innego. Następnie ogranicz, jakie narzędzia są dostępne w sesjach sandboxowanych, przez `tools.sandbox.tools`.

    Pełny opis konfiguracji + przykładowa konfiguracja: [Grupy: osobiste DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Dokumentacja referencyjna kluczowej konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podpiąć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne + per agent są scalane; powiązania per agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego wrażliwego i pamiętaj, że bindy omijają ściany systemu plików sandboxa.

    OpenClaw sprawdza źródła bind zarówno względem znormalizowanej ścieżki, jak i ścieżki kanonicznej rozpoznanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez nadrzędny symlink nadal kończą się bezpiecznym odrzuceniem nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) i [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Kuratorowane notatki długoterminowe w `MEMORY.md` (tylko główne/prywatne sesje)

    OpenClaw uruchamia też **cichy flush pamięci przed compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed auto-Compaction. Działa to tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały?">
    Poproś bota, aby **zapisał ten fakt do pamięci**. Notatki długoterminowe należą do `MEMORY.md`,
    a krótkoterminowy kontekst trafia do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominać modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    workspace przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się bez końca? Jakie są ograniczenia?">
    Pliki pamięci żyją na dysku i utrzymują się, dopóki ich nie usuniesz. Ograniczeniem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony oknem kontekstu modelu,
    więc długie rozmowy mogą być kompaktowane albo obcinane. Dlatego istnieje
    wyszukiwanie pamięci — pobiera z powrotem do kontekstu tylko odpowiednie fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. Codex OAuth obejmuje chat/completions i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth albo
    logowanie Codex CLI)** nie pomaga przy semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie providera, OpenClaw automatycznie wybierze providera, gdy
    będzie w stanie rozpoznać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne środowiskowe).
    Preferuje OpenAI, jeśli można rozpoznać klucz OpenAI, w przeciwnym razie Gemini, jeśli można rozpoznać klucz Gemini,
    potem Voyage, a potem Mistral. Jeśli nie ma dostępnego zdalnego klucza, wyszukiwanie pamięci
    pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną
    ścieżkę modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local** —
    szczegóły konfiguracji znajdziesz w [Pamięć](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane przez OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do providerów modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz ślad:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch
      kanałowy nadal przechodzi przez serwery danego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Ścieżka                                                        | Przeznaczenie                                                      |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Opcjonalny ładunek sekretów oparty na pliku dla providerów SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Starszy plik zgodności (statyczne wpisy `api_key` są czyszczone)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stan providera (np. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Historia i stan rozmów (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadane sesji (per agent)                                         |

    Starsza ścieżka jednego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (AGENTS.md, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (albo starszy fallback `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/providerów, profile uwierzytelniania, sesje, logi,
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowany przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa **workspace hosta gateway**,
    a nie lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania albo preferencji, poproś bota, aby **zapisał to do
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i twórz jego kopię zapasową
    w miejscu prywatnym (na przykład GitHub private). To przechwytuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, twórz osobne kopie zapasowe zarówno workspace, jak i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz osobny przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza workspace?">
    Tak. Workspace jest **domyślnym cwd** i kotwicą pamięci, a nie twardym sandboxem.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandbox per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, skieruj
    `workspace` tego agenta do katalogu głównego repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace oddzielnie, chyba że celowo chcesz, aby agent pracował w jego wnętrzu.

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

  <Accordion title="Tryb zdalny: gdzie znajduje się magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, interesujący Cię magazyn sesji znajduje się na zdalnej maszynie, a nie na lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używa bezpiecznych-ish wartości domyślnych (w tym domyślnego workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Bindowania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie shared secret: token albo hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym identity-aware reverse proxy innym niż loopback

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

    - `gateway.remote.token` / `.password` same z siebie **nie** włączają lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` wraz z `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozpoznane, rozpoznanie kończy się bezpiecznym odrzuceniem (brak maskującego zdalnego fallbacku).
    - Konfiguracje shared-secret Control UI uwierzytelniają się przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby niosące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania shared secret w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback na tym samym hoście nadal **nie** spełniają uwierzytelniania trusted-proxy. Trusted proxy musi być skonfigurowanym źródłem innym niż loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, również dla loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnie ścieżki uwierzytelniania, uruchomienie gateway przechodzi do trybu tokena i automatycznie go generuje, zapisując w `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. To blokuje innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla identity-aware reverse proxy innych niż loopback, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może w każdej chwili wygenerować token: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę zrobić restart po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuj na gorąco, krytyczne wymagają restartu
    - obsługiwane są też `hot`, `restart`, `off`

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

    - `off`: ukrywa tekst sloganu, ale zachowuje tytuł banera/wiersz wersji.
    - `default`: zawsze używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć web search (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    providera:

    - Providerzy opierający się na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają zwykłej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest to nieoficjalna integracja oparta na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz providera.
    Alternatywy przez zmienne środowiskowe:

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
              provider: "firecrawl", // opcjonalne; pomiń dla auto-detect
            },
          },
        },
    }
    ```

    Konfiguracja web-search specyficzna dla providera znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki providera `tools.web.search.*` są nadal tymczasowo ładowane dla zgodności, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja fallbacku web-fetch Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że jawnie je wyłączysz).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego providera fallbackowego fetch na podstawie dostępnych poświadczeń. Obecnie dołączonym providerem jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyścił moją konfigurację. Jak to odzyskać i jak tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Obecny OpenClaw chroni przed wieloma przypadkowymi nadpisaniami:

    - Zapisy konfiguracji należące do OpenClaw sprawdzają pełną konfigurację po zmianie przed zapisem.
    - Nieprawidłowe albo destrukcyjne zapisy należące do OpenClaw są odrzucane i zapisywane jako `openclaw.json.rejected.*`.
    - Jeśli bezpośrednia edycja zepsuje start albo hot reload, Gateway przywraca ostatnią znaną dobrą konfigurację i zapisuje odrzucony plik jako `openclaw.json.clobbered.*`.
    - Główny agent otrzymuje ostrzeżenie rozruchowe po odzyskaniu, aby nie zapisywał ponownie ślepo złej konfiguracji.

    Odzyskiwanie:

    - Sprawdź `openclaw logs --follow` pod kątem `Config auto-restored from last-known-good`, `Config write rejected:` albo `config reload restored last-known-good config`.
    - Sprawdź najnowszy `openclaw.json.clobbered.*` albo `openclaw.json.rejected.*` obok aktywnej konfiguracji.
    - Zachowaj aktywną przywróconą konfigurację, jeśli działa, a następnie skopiuj z powrotem tylko zamierzone klucze przez `openclaw config set` albo `config.patch`.
    - Uruchom `openclaw config validate` i `openclaw doctor`.
    - Jeśli nie masz żadnej ostatniej znanej dobrej konfiguracji ani odrzuconego ładunku, przywróć z kopii zapasowej albo ponownie uruchom `openclaw doctor` i ponownie skonfiguruj kanały/modele.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent do kodowania często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Użyj najpierw `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki albo kształtu pola; zwraca płytki węzeł schematu wraz z podsumowaniami bezpośrednich elementów podrzędnych do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; pozostaw `config.apply` wyłącznie do pełnej zamiany konfiguracji.
    - Jeśli używasz narzędzia `gateway` tylko dla właściciela z uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/cli/config), [Configure](/cli/configure), [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway z wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **nodes** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Nodes (urządzenia):** Maki/iOS/Android łączą się jako peryferia i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne „mózgi”/workspace dla wyspecjalizowanych ról (np. „Hetzner ops”, „Personal data”).
    - **Sub-agenci:** uruchamiaj pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łącz się z Gateway i przełączaj agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing wielu agentów](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać bezgłowo?">
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

    Domyślna wartość to `false` (z interfejsem). Tryb bezgłowy częściej uruchamia kontrole antybotowe na niektórych stronach. Zobacz [Browser](/pl/tools/browser).

    Tryb bezgłowy używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (jeśli potrzebujesz wizualizacji, używaj zrzutów ekranu).
    - Niektóre strony są bardziej rygorystyczne wobec automatyzacji w trybie bezgłowym (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje bezgłowe.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarium Brave (albo dowolnej przeglądarki opartej na Chromium) i uruchom ponownie Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Browser](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gateway i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i nodes?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą przychodzącego ruchu providera; odbierają tylko wywołania RPC node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (screen, camera, system) na lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tym samym tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (tailnet bind albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (albo bezpośredni tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nie jest wymagany osobny most TCP; nodes łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie node macOS pozwala na `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przeczytaj [Security](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [tryb zdalny macOS](/pl/platforms/mac/remote), [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan Gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie sprawdź uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM albo grupa) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to skonfigurować na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem pozwól Botowi B odpowiedzieć jak zwykle.

    **Most CLI (generyczny):** uruchom skrypt, który wywoła drugi Gateway za pomocą
    `openclaw agent --message ... --deliver`, kierując do czatu, na którym nasłuchuje drugi bot.
    Jeśli jeden bot działa na zdalnym VPS, skieruj CLI do tego zdalnego Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może osiągnąć docelowy Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj guardrail, aby dwa boty nie zapętlały się bez końca (tylko wzmianki, listy dozwolonych kanałów
    albo zasada „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [Agent CLI](/cli/agent), [Wysyłanie agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własnym workspace, domyślnymi modelami
    i routingiem. To normalna konfiguracja i jest znacznie tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Osobnych VPS używaj tylko wtedy, gdy potrzebujesz twardej izolacji (granice bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie utrzymuj jeden Gateway i
    używaj wielu agentów albo sub-agentów.

  </Accordion>

  <Accordion title="Czy używanie node na moim osobistym laptopie zamiast SSH z VPS daje korzyści?">
    Tak — nodes to pierwszorzędny sposób docierania do laptopa ze zdalnego Gateway i
    dają więcej niż tylko dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS albo urządzenie klasy Raspberry Pi; 4 GB RAM to aż nadto), więc typowa
    konfiguracja to zawsze włączony host plus laptop jako node.

    - **Nie wymaga przychodzącego SSH.** Nodes łączą się wychodząco do Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrolki wykonania.** `system.run` jest ograniczone przez listy dozwolonych/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host node na laptopie albo podłączaj się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do okazjonalnego dostępu do powłoki, ale nodes są prostsze dla stałych przepływów pracy agenta i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Browser](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Na hoście powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz odizolowane profile (zobacz [Wiele gateway](/pl/gateway/multiple-gateways)). Nodes to peryferia, które łączą się
    z gateway (nodes iOS/Android albo tryb „node mode” macOS w aplikacji menu bar). Dla bezgłowych hostów node
    i sterowania przez CLI zobacz [Node host CLI](/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje sposób API / RPC na zastosowanie konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); wykonuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - `config.apply`: sprawdza poprawność + zastępuje całą konfigurację; wykonuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - Narzędzie runtime `gateway` tylko dla właściciela nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia workspace i ogranicza, kto może wyzwalać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj i zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj i zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    To utrzymuje gateway zbindowany do loopback i wystawia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak podłączyć node Mac do zdalnego Gateway (Tailscale Serve)?">
    Serve wystawia **Gateway Control UI + WS**. Nodes łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tym samym tailnet**.
    2. **Użyj aplikacji macOS w trybie Remote** (celem SSH może być nazwa hosta tailnet).
       Aplikacja zestawi tunel do portu Gateway i połączy się jako node.
    3. **Zatwierdź node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem zainstalować to na drugim laptopie, czy po prostu dodać node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **node**. To pozwala zachować jeden Gateway i unika zduplikowanej konfiguracji. Lokalne narzędzia node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Drugi Gateway instaluj tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też zdefiniować w konfiguracji wbudowane zmienne środowiskowe (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Zobacz [/environment](/pl/help/environment), aby poznać pełny priorytet i źródła.

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwie częste poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały pobrane nawet wtedy, gdy usługa nie dziedziczy środowiska powłoki.
    2. Włącz import powłoki (wygoda opt-in):

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

    To uruchamia login shell i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` informuje, czy **import zmiennych środowiskowych z powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że Twoje zmienne środowiskowe nie istnieją — oznacza tylko, że OpenClaw nie będzie ładował
    automatycznie Twojej login shell.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    Twojej powłoki. Napraw to w jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko wtedy, gdy brakuje).

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
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie bezczynności. Po włączeniu **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    To nie usuwa transkryptów — po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy istnieje sposób na zrobienie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wielu agentów** i **sub-agentów**. Możesz utworzyć jednego agenta
    koordynatora i kilku agentów-workerów z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **zabawny eksperyment**. Zużywa dużo tokenów i często
    jest mniej efektywne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    sobie wyobrażamy, to jeden bot, z którym rozmawiasz, ale z różnymi sesjami dla pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać sub-agentów.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w połowie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony oknem modelu. Długie czaty, duże wyjścia narzędzi albo wiele
    plików może wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota, aby podsumował bieżący stan i zapisał go do pliku.
    - Użyj `/compact` przed długimi zadaniami i `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby ponownie go odczytał.
    - Używaj sub-agentów do długiej albo równoległej pracy, aby główny czat był mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli dzieje się to często.

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

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" — jak zresetować albo skompaktować?'>
    Użyj jednego z tych sposobów:

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

    Jeśli problem się powtarza:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby przycinać stare wyjście narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji providera: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna albo uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję przez `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości Heartbeat co 30 minut?">
    Heartbeats uruchamiają się domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj albo wyłącz je:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie pusty (tylko puste linie i nagłówki
    Markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie Heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku nie ma, Heartbeat nadal się uruchamia, a model decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi grupowe są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wyzwalać odpowiedzi grupowe:

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

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowano/dodano do listy dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Ograniczanie wzmianek jest włączone (domyślnie). Musisz @wspomnieć bota (albo dopasować `mentionPatterns`).
    - Skonfigurowałeś `channels.whatsapp.groups` bez `"*"`, a grupa nie znajduje się na liście dozwolonych.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to oddzielne sesje. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Nie ma sztywnych limitów. Dziesiątki (a nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost danych na dysku:** sesje + transkrypty znajdują się pod `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoległego użycia modeli.
    - **Narzut operacyjny:** profile uwierzytelniania per agent, workspace i routing kanałów.

    Wskazówki:

    - Utrzymuj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Czyść stare sesje (usuń JSONL albo wpisy magazynu), jeśli rośnie zużycie dysku.
    - Używaj `openclaw doctor`, aby wykrywać zbędne workspace i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów albo czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **routingu wielu agentów**, aby uruchamiać wiele odizolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peera. Slack jest obsługiwany jako kanał i może być przypisywany do konkretnych agentów.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co może człowiek” — antyboty, CAPTCHA i MFA nadal mogą
    blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, używaj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która rzeczywiście uruchamia przeglądarkę.

    Konfiguracja zgodna z najlepszymi praktykami:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP albo node, gdy jest potrzebna.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Browser](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: ustawienia domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Co to jest „model domyślny”?'>
    Domyślny model OpenClaw to to, co ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołuje się jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego providera dla dokładnego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego providera jako przestarzałej ścieżki zgodności. Jeśli ten provider nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego providera/modelu zamiast pokazywać nieaktualne ustawienie domyślne usuniętego providera. Nadal powinieneś **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany model domyślny:** używaj najmocniejszego modelu najnowszej generacji dostępnego w Twoim stosie providerów.
    **Dla agentów z narzędziami albo z niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Dla rutynowego czatu / zadań o niskiej stawce:** używaj tańszych modeli zapasowych i kieruj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki Cię stać** do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu albo podsumowań. Możesz kierować modele per agent i używać sub-agentów do
    równoleglenia długich zadań (każdy sub-agent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) oraz
    [Sub-agenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze/nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Security](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez wyczyszczenia konfiguracji?">
    Używaj **poleceń modelu** albo edytuj tylko pola **modelu**. Unikaj pełnego zastępowania konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup daje znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu i podsumowania bezpośrednich elementów podrzędnych
    dla częściowych aktualizacji.
    Jeśli nadpisałeś konfigurację, przywróć ją z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby naprawić problem.

    Dokumentacja: [Modele](/pl/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka do modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, np. `ollama pull gemma4`
    3. Jeśli chcesz także modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe plus lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - przy ręcznym przełączaniu użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze albo mocno skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli mimo to chcesz małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Providerzy modeli](/pl/concepts/model-providers), [Security](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji providera.
    - Sprawdź bieżące ustawienie runtime na każdym gateway przez `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo / używających narzędzi używaj najmocniejszego dostępnego modelu najnowszej generacji.
  </Accordion>

  <Accordion title="Jak przełączać modele w locie (bez restartu)?">
    Użyj polecenia `/model` jako samodzielnej wiadomości:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    To wbudowane aliasy. Własne aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić przez `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje kompaktowy, numerowany wybór. Wybieraj przez numer:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla providera (per sesja):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint providera (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Ponownie uruchom `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do ustawienia domyślnego, wybierz je przez `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.2 do codziennych zadań i Codex 5.3 do kodowania?">
    Tak. Ustaw jeden jako domyślny i przełączaj w razie potrzeby:

    - **Szybkie przełączanie (per sesja):** `/model gpt-5.4` do codziennych zadań, `/model openai-codex/gpt-5.4` do kodowania z Codex OAuth.
    - **Domyślny + przełączanie:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.4`, a następnie przełączaj na `openai-codex/gpt-5.4` przy kodowaniu (albo odwrotnie).
    - **Sub-agenci:** kieruj zadania związane z kodowaniem do sub-agentów z innym modelem domyślnym.

    Zobacz [Modele](/pl/concepts/models) i [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować fast mode dla GPT 5.4?">
    Użyj przełącznika sesji albo domyślnego ustawienia w konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.4` albo `openai-codex/gpt-5.4`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.4"].params.fastMode` na `true`.
    - **Także dla Codex OAuth:** jeśli używasz też `openai-codex/gpt-5.4`, ustaw tam tę samą flagę.

    Przykład:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Dla OpenAI fast mode mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Przesłonięcia sesji `/fast` mają pierwszeństwo nad ustawieniami domyślnymi z konfiguracji.

    Zobacz [Thinking and fast mode](/pl/tools/thinking) i [OpenAI fast mode](/pl/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę "Model ... is not allowed", a potem brak odpowiedzi?'>
    Jeśli `agents.defaults.models` jest ustawione, staje się ono **listą dozwolonych** dla `/model` i dowolnych
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Naprawa: dodaj model do
    `agents.defaults.models`, usuń listę dozwolonych albo wybierz model z `/model list`.

  </Accordion>

  <Accordion title='Dlaczego widzę "Unknown model: minimax/MiniMax-M2.7"?'>
    To oznacza, że **provider nie jest skonfigurowany** (nie znaleziono konfiguracji providera MiniMax ani
    profilu uwierzytelniania), więc model nie może zostać rozpoznany.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącej wersji OpenClaw (albo uruchamiaj ze źródeł `main`), a następnie uruchom ponownie gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON), albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby można było wstrzyknąć pasującego providera
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisane OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji
       z kluczem API, albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Używaj **MiniMax jako domyślnego** i przełączaj modele **per sesja**, gdy jest to potrzebne.
    Fallbacki służą do obsługi **błędów**, a nie „trudnych zadań”, więc używaj `/model` albo osobnego agenta.

    **Opcja A: przełączanie per sesja**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Następnie:

    ```
    /model gpt
    ```

    **Opcja B: oddzielni agenci**

    - Agent A domyślnie: MiniMax
    - Agent B domyślnie: OpenAI
    - Kieruj według agenta albo używaj `/agent` do przełączania

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wielu agentów](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw dostarcza kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jeśli ustawisz własny alias o tej samej nazwie, Twoja wartość ma pierwszeństwo.

  </Accordion>

  <Accordion title="Jak definiować/nadpisywać skróty modeli (aliasy)?">
    Aliasy pochodzą z `agents.defaults.models.<modelId>.alias`. Przykład:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Wtedy `/model sonnet` (albo `/<alias>`, gdy jest obsługiwane) rozpoznaje ten identyfikator modelu.

  </Accordion>

  <Accordion title="Jak dodać modele od innych providerów, takich jak OpenRouter albo Z.AI?">
    OpenRouter (płatność za token; wiele modeli):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modele GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jeśli odwołasz się do `provider/model`, ale brakuje wymaganego klucza providera, dostaniesz błąd uwierzytelniania runtime (np. `No API key found for provider "zai"`).

    **No API key found for provider po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest per agent i
    jest przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj `auth-profiles.json` z `agentDir` głównego agenta do `agentDir` nowego agenta.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Failover modeli i „All models failed”

<AccordionGroup>
  <Accordion title="Jak działa failover?">
    Failover odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w obrębie tego samego providera.
    2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Cooldowny obowiązują dla zawodzących profili (wykładniczy backoff), dzięki czemu OpenClaw może nadal odpowiadać nawet wtedy, gdy provider ma ograniczenie szybkości albo tymczasowo zawodzi.

    Koszyk limitu szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje także komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako warte failoveru
    limity szybkości.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli provider zwróci
    jawny tekst rozliczeniowy przy `401` albo `403`, OpenClaw nadal może zachować to w
    ścieżce rozliczeniowej, ale dopasowania tekstowe specyficzne dla providera pozostają ograniczone do
    providera, do którego należą (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda zamiast tego jak możliwy do ponowienia limit okna użycia albo
    limit wydatków organizacji/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długie wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` albo `ollama error: context length
    exceeded` pozostają na ścieżce compaction/ponowienia zamiast przechodzić do
    fallbacku modelu.

    Generyczny tekst błędów serwera jest celowo węższy niż „wszystko z
    unknown/error w środku”. OpenClaw traktuje przejściowe kształty ograniczone do providera,
    takie jak samo `An unknown error occurred` w Anthropic, samo
    `Provider returned error` w OpenRouter, błędy reason stop, takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości providera, takie jak `ModelNotReadyException`, jako
    warte failoveru sygnały timeout/przeciążenia, gdy kontekst providera
    pasuje.
    Ogólny wewnętrzny tekst fallbacku, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam z siebie nie uruchamia fallbacku modelu.

  </Accordion>

  <Accordion title='Co oznacza "No credentials found for profile anthropic:default"?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć poświadczeń do niego w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe vs starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może go nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje wielu agentów oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź stan modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy providerzy są uwierzytelnieni.

    **Lista kontrolna naprawy dla "No credentials found for profile anthropic"**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz używać klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść wszelkie przypięte kolejności, które wymuszają brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i się nie udało?">
    Jeśli konfiguracja modelu zawiera Google Gemini jako fallback (albo przełączyłeś się na skrót Gemini), OpenClaw spróbuje go użyć podczas fallbacku modelu. Jeśli nie skonfigurowałeś poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: albo podaj uwierzytelnianie Google, albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback tam nie trafiał.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często z
    przerwanego/częściowego streamu). Google Antigravity wymaga sygnatur dla bloków thinking.

    Naprawa: OpenClaw usuwa teraz bloki thinking bez sygnatur dla Google Antigravity Claude. Jeśli problem nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Co to jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth albo klucz API) powiązany z providerem. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Jak wyglądają typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem providera, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - własne identyfikatory, które wybierzesz (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili i kolejność per provider (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje identyfikatory na provider/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się on w krótkim **cooldown** (limity szybkości/timeouty/błędy uwierzytelniania) albo dłuższym stanie **disabled** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Cooldowny limitów szybkości mogą być ograniczone do modelu. Profil, który jest w cooldown
    dla jednego modelu, może nadal nadawać się do użycia dla modelu pokrewnego u tego samego providera,
    podczas gdy okna billing/disabled nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Domyślnie używa skonfigurowanego domyślnego agenta (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Zablokuj rotację do jednego profilu (próbuj tylko tego jednego)
    openclaw models auth order set --provider anthropic anthropic:default

    # Albo ustaw jawnie kolejność (fallback w obrębie providera)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść nadpisanie (powrót do config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby sprawdzić, co rzeczywiście zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, sonda zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth vs klucz API — jaka jest różnica?">
    OpenClaw obsługuje oba:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczania pay-per-token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth i klucze API.

  </Accordion>
</AccordionGroup>

## Gateway: porty, „already running” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` kontroluje pojedynczy multipleksowany port dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status mówi "Runtime: running", ale "Connectivity probe: failed"?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności to CLI, które rzeczywiście łączy się z gateway WebSocket.

    Użyj `openclaw gateway status` i zwracaj uwagę na te linie:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co naprawdę jest zbindowane na porcie)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces żyje, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego openclaw gateway status pokazuje różne "Config (cli)" i "Config (service)"?'>
    Edytujesz jeden plik konfiguracyjny, podczas gdy usługa działa na innym (często niedopasowanie `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tym samym `--profile` / środowiskiem, którego usługa ma używać.

  </Accordion>

  <Accordion title='Co oznacza "another gateway instance is already listening"?'>
    OpenClaw wymusza blokadę runtime przez natychmiastowe zbindowanie listenera WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli bindowanie nie powiedzie się z `EADDRINUSE`, zgłasza `GatewayLockError`, wskazując, że nasłuchuje już inna instancja.

    Naprawa: zatrzymaj inną instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie z poświadczeniami zdalnymi shared secret:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` to `local` (albo przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to wyłącznie poświadczenia zdalne po stronie klienta; same z siebie nie włączają lokalnego uwierzytelniania gateway.

  </Accordion>

  <Accordion title='Control UI mówi "unauthorized" (albo ciągle się ponownie łączy). Co teraz?'>
    Ścieżka uwierzytelniania gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL gateway, więc odświeżenia w tej samej karcie nadal działają bez przywracania długotrwałego przechowywania tokena w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą wykonać jedno ograniczone ponowienie z buforowanym tokenem urządzenia, gdy gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z buforowanym tokenem używa teraz zapisanych zatwierdzonych zakresów przechowywanych razem z tokenem urządzenia. Jawni wywołujący z `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z cache.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania connect wygląda tak: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu bootstrap token.
    - Kontrole zakresów bootstrap token są poprzedzone prefiksem roli. Wbudowana lista dozwolonych bootstrap operator spełnia tylko żądania operatora; role node lub inne niż operator nadal potrzebują zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje + kopiuje URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bezgłowo).
    - Jeśli nie masz jeszcze tokena: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw zestaw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb shared-secret: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz URL Serve, a nie surowy URL loopback/tailnet omijający nagłówki tożsamości Tailscale.
    - Tryb trusted-proxy: upewnij się, że przychodzisz przez skonfigurowane identity-aware proxy inne niż loopback, a nie przez proxy loopback na tym samym hoście ani surowy URL gateway.
    - Jeśli po jednym ponowieniu niedopasowanie nadal występuje, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to wywołanie rotate mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem gateway.bind tailnet, ale nie może się zbindować i nic nie nasłuchuje">
    Bindowanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs nie działa), nie ma do czego się zbindować.

    Naprawa:

    - Uruchom Tailscale na tym hoście (tak, aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz bindowania tylko dla tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może uruchamiać wiele kanałów wiadomości i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. bot ratunkowy) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecane):

    - Używaj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy ręcznych uruchomieniach).
    - Zainstaluj usługę per profil: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza "invalid handshake" / code 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwszą wiadomością
    będzie ramka `connect`. Jeśli otrzyma cokolwiek innego, zamknie połączenie
    z **kodem 1008** (naruszenie zasad).

    Typowe przyczyny:

    - Otworzyłeś URL **HTTP** w przeglądarce (`http://...`) zamiast w kliencie WS.
    - Użyłeś niewłaściwego portu albo ścieżki.
    - Proxy albo tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie niebędące żądaniem Gateway.

    Szybkie poprawki:

    1. Użyj URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

    Jeśli używasz CLI albo TUI, URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stałą ścieżkę przez `logging.file`. Poziom logów plikowych kontroluje `logging.level`. Szczegółowość konsoli kontrolują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/ponownie uruchomić usługę Gateway?">
    Użyj pomocników gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może przejąć port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem terminal w Windows — jak ponownie uruchomić OpenClaw?">
    Istnieją **dwa tryby instalacji w Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie uruchom ponownie:

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

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie przychodzą. Co sprawdzić?">
    Zacznij od szybkiego przeglądu stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokują odpowiedzi (sprawdź konfigurację kanału + logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokena.

    Jeśli działasz zdalnie, potwierdź, że tunel/połączenie Tailscale działa i że
    Gateway WebSocket jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — co teraz?'>
    Zwykle oznacza to, że UI utraciło połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli zdalnie, czy tunel/połączenie Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands nie działa. Co sprawdzić?">
    Zacznij od logów i stanu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Ogranicz polecenia Plugin/Skills/własne albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` albo podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzący HTTPS jest dozwolony i że DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że sprawdzasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnego wyjścia. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale czatu,
    upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/web/tui), [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowałeś usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linux).
    Używaj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz go na pierwszym planie, zatrzymaj przez Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: uruchamia ponownie **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowałeś usługę, używaj poleceń gateway. Używaj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób, aby uzyskać więcej szczegółów, gdy coś nie działa">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Media i załączniki

<AccordionGroup>
  <Accordion title="Mój Skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Wychodzące załączniki od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (w osobnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Proszę bardzo" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje media wychodzące i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru providera (obrazy są zmieniane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, temp/media-store i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla mediów i bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki podobne do sekretów nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy bezpiecznie jest wystawić OpenClaw na przychodzące DM?">
    Traktuj przychodzące DM jako niezaufane wejście. Domyślne ustawienia są zaprojektowane tak, aby ograniczać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **pairing**:
      - Nieznani nadawcy dostają kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdź przez: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnego opt-in (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection to problem tylko dla publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli asystent odczytuje treści zewnętrzne (web search/fetch, strony w przeglądarce, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **Ty jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się wtedy, gdy włączone są narzędzia: model może zostać oszukany i
    wyciągnąć kontekst albo wywołać narzędzia w Twoim imieniu. Ogranicz zasięg szkód przez:

    - używanie agenta „reader” tylko do odczytu albo bez narzędzi do podsumowywania niezaufanej treści
    - utrzymywanie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu z plików/dokumentów również jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granic treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota przez oddzielne konta i numery telefonów
    zmniejsza zasięg szkód, jeśli coś pójdzie nie tak. Ułatwia to również rotację
    poświadczeń albo cofnięcie dostępu bez wpływu na Twoje osobiste konta.

    Zacznij od małej skali. Daj dostęp tylko do narzędzi i kont, których naprawdę potrzebujesz, i rozszerzaj
    później, jeśli będzie to konieczne.

    Dokumentacja: [Security](/pl/gateway/security), [Pairing](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi osobistymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM w trybie **pairing** albo przy ścisłej liście dozwolonych.
    - Używaj **oddzielnego numeru albo konta**, jeśli chcesz, aby pisał wiadomości w Twoim imieniu.
    - Pozwól mu tworzyć szkice, a potem **zatwierdzaj przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj je odizolowane. Zobacz
    [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent obsługuje tylko czat, a wejście jest zaufane. Mniejsze klasy są
    bardziej podatne na przejęcie przez instrukcje, więc unikaj ich dla agentów z włączonymi narzędziami
    albo przy odczytywaniu niezaufanej treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj w sandboxie. Zobacz [Security](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem /start w Telegram, ale nie dostałem kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj swój identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisał do moich kontaktów? Jak działa pairing?">
    Nie. Domyślna zasada WhatsApp DM to **pairing**. Nieznani nadawcy dostają tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzyma, albo na jawne wysyłki, które sam wyzwolisz.

    Zatwierdź parowanie przez:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetl oczekujące żądania:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt numeru telefonu w kreatorze: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM były dozwolone. Nie służy do automatycznego wysyłania. Jeśli działasz na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „nie chce się zatrzymać”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość wiadomości wewnętrznych albo narzędzi pojawia się tylko wtedy, gdy dla tej sesji włączone są **verbose**, **trace** albo **reasoning**.

    Naprawa na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest głośno, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Thinking and verbose](/pl/tools/thinking), [Security](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować działające zadanie?">
    Wyślij dowolne z tych poleceń **jako samodzielną wiadomość** (bez ukośnika):

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

    To wyzwalacze przerwania (a nie slash commands).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Przegląd slash commands: zobacz [Slash commands](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (jak `/status`) działa także inline dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? ("Cross-context messaging denied")'>
    OpenClaw domyślnie blokuje wiadomości **między providerami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle na Discord, chyba że jawnie na to zezwolisz.

    Włącz wiadomości między providerami dla agenta:

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

    Uruchom ponownie gateway po edycji konfiguracji.

  </Accordion>

  <Accordion title='Dlaczego wygląda to tak, jakby bot „ignorował” wiadomości wysyłane jedna po drugiej?'>
    Tryb kolejki kontroluje, jak nowe wiadomości oddziałują z uruchomieniem będącym w toku. Użyj `/queue`, aby zmienić tryby:

    - `steer` - nowe wiadomości przekierowują bieżące zadanie
    - `followup` - uruchamiaj wiadomości jedna po drugiej
    - `collect` - grupuj wiadomości i odpowiadaj raz (domyślnie)
    - `steer-backlog` - przekieruj teraz, a potem przetwarzaj backlog
    - `interrupt` - przerwij bieżące uruchomienie i zacznij od nowa

    Możesz dodać opcje takie jak `debounce:2s cap:25 drop:summarize` dla trybów followup.

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są oddzielone. Ustawienie `ANTHROPIC_API_KEY` (albo zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to to, co skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal utknąłeś? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję GitHub](https://github.com/openclaw/openclaw/discussions).
