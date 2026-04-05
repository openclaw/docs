---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, onboardingu lub wsparcia środowiska uruchomieniowego
    - Triaging problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-05T14:05:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz głębsze wskazówki dotyczące rozwiązywania problemów dla rzeczywistych konfiguracji (lokalny dev, VPS, multi-agent, OAuth/klucze API, failover modeli). Informacje o diagnostyce środowiska uruchomieniowego znajdziesz w [Troubleshooting](/pl/gateway/troubleshooting). Pełne odniesienie do konfiguracji znajdziesz w [Configuration](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność gateway/service, agenci/sesje, konfiguracja dostawców + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnostyka tylko do odczytu z końcówką logu (tokeny są ukryte).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe supervisora względem osiągalności RPC, docelowy URL dla sondy oraz której konfiguracji usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę kondycji gateway, w tym sondy kanałów, jeśli są obsługiwane
   (wymaga osiągalnego gateway). Zobacz [Health](/pl/gateway/health).

5. **Śledzenie najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj zamiast tego:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logging](/pl/logging) i [Troubleshooting](/pl/gateway/troubleshooting).

6. **Uruchom Doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę config przy błędach
   ```

   Pyta uruchomiony gateway o pełną migawkę (tylko WS). Zobacz [Health](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem, jaki jest najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który potrafi **widzieć Twój komputer**. To jest dużo skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomagający nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia potrafią czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawić
    konfigurację na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im
    **pełny checkout kodu źródłowego** przez instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może czytać kod + dokumentację i
    wnioskować na podstawie dokładnej wersji, której używasz. Zawsze możesz później wrócić do stabilnej
    wersji, ponownie uruchamiając instalator bez `--install-method git`.

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

    - `openclaw status`: szybka migawka kondycji gateway/agenta + podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawców + dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją i stanem.

    Inne przydatne kontrole w CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, gdy coś nie działa](#pierwsze-60-sekund-gdy-coś-nie-działa).
    Dokumentacja instalacji: [Install](/pl/install), [Installer flags](/pl/install/installer), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle jest pomijany. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/header-only szablon
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żadne interwały zadań jeszcze nie są wymagalne
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu due są przesuwane dopiero po ukończeniu
    rzeczywistego uruchomienia heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automation & Tasks](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # automatycznie instaluje zależności UI przy pierwszym uruchomieniu
    openclaw onboard
    ```

    Jeśli nie masz jeszcze globalnej instalacji, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym adresem dashboardu (bez tokena) zaraz po onboardingu i wypisuje też link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost vs zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli prosi o uwierzytelnienie shared-secret, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokena: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli nie masz jeszcze skonfigurowanego shared secret, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnienie Control UI/WebSocket (bez wklejania shared secret, zakłada zaufanego hosta gateway); HTTP API nadal wymagają uwierzytelnienia shared-secret, chyba że świadomie używasz private-ingress `none` lub uwierzytelnienia HTTP trusted-proxy.
      Nieprawidłowe równoczesne próby uwierzytelnienia Serve z tego samego klienta są serializowane, zanim limiter failed-auth je zarejestruje, więc druga błędna próba może już pokazać `retry later`.
    - **Tailnet bind**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący shared secret w ustawieniach dashboardu.
    - **Identity-aware reverse proxy**: pozostaw Gateway za trusted proxy innym niż loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie shared-secret nadal obowiązuje przez tunnel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Dashboard](/web/dashboard) i [Web surfaces](/web), aby poznać tryby bind i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego istnieją dwie konfiguracje zatwierdzania exec dla zatwierdzeń w czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje prompty zatwierdzeń do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że dany kanał działa jako natywny klient zatwierdzeń dla zatwierdzeń exec

    Zasada host exec policy nadal jest właściwą bramką zatwierdzania. Konfiguracja czatu steruje tylko tym,
    gdzie pojawiają się prompty zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje komendy i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany natywny kanał potrafi bezpiecznie wywnioskować approvers, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione lub ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ta natywna UI jest główną ścieżką; agent powinien dołączyć ręczną komendę `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatowe są niedostępne lub ręczne zatwierdzenie to jedyna ścieżka.
    - Używaj `approvals.exec` tylko wtedy, gdy prompty muszą być też przekazywane do innych czatów lub jawnych pokoi ops.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy wyraźnie chcesz, aby prompty zatwierdzania były publikowane z powrotem w pokoju/wątku źródłowym.
    - Zatwierdzenia plugin są znów oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre natywne kanały utrzymują dodatkowo natywną obsługę zatwierdzeń plugin.

    Krótko: forwarding służy do routingu, a konfiguracja natywnego klienta — do bogatszego, specyficznego dla kanału UX.
    Zobacz [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku jako wystarczające do użytku osobistego oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), **2GB jest zalecane**, ale nie
    jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz sparować **nodes** na laptopie/telefonie dla
    lokalnego ekranu/kamery/canvas lub wykonywania poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    W skrócie: działa, ale spodziewaj się pewnych niedoskonałości.

    - Użyj systemu **64-bit** i utrzymuj Node >= 22.
    - Preferuj **instalację hackable (git)**, aby mieć dostęp do logów i szybciej aktualizować.
    - Zacznij bez channels/skills, a potem dodawaj je po kolei.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Install](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding się nie wykluwa. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz ten wiersz i **nie ma odpowiedzi**,
    a tokeny pozostają na 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + uwierzytelnienie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal się zawiesza, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunnel/połączenie Tailscale działa i że UI
    wskazuje na właściwy Gateway. Zobacz [Remote access](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego przechodzenia onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie raz uruchom Doctor. To
    zachowa bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnienie i
    stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje config, profile auth, poświadczenia WhatsApp, sesje i pamięć. Jeśli działasz w
    trybie zdalnym, pamiętaj, że host gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/wypychasz workspace do GitHub, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One żyją
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migrating](/pl/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Remote mode](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego jest w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna sekcja z datą
    to najnowsza wydana wersja. Wpisy są pogrupowane jako **Highlights**, **Changes** i
    **Fixes** (oraz sekcje docs/other, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie mogę uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz tę funkcję albo dodaj `docs.openclaw.ai` do allowlist, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz dotrzeć do strony, dokumentacja jest mirrorowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle stabilne wydanie trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    opublikować bezpośrednio do `latest`, jeśli zajdzie taka potrzeba. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednowierszowe polecenia instalacji oraz różnice między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (może odpowiadać `latest` po promocji).
    **Dev** to ruchomy head gałęzi `main` (git); po publikacji używa npm dist-tag `dev`.

    Jednowierszowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator dla Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Development channels](/pl/install/development-channels) i [Installer flags](/pl/install/installer).

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

    Dokumentacja: [Update](/cli/update), [Development channels](/pl/install/development-channels),
    [Install](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut w zależności od liczby skonfigurowanych kanałów/modeli

    Jeśli się zawiesi, użyj [Installer stuck](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **verbose output**:

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

    Odpowiednik dla Windows (PowerShell):

    ```powershell
    # install.ps1 nie ma jeszcze osobnej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Installer flags](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja na Windows mówi git not found lub openclaw not recognized">
    Dwa typowe problemy w Windows:

    **1) błąd npm spawn git / git not found**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i otwórz ponownie PowerShell, a następnie ponownie uruchom instalator.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (w Windows nie potrzeba sufiksu `\bin`; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po aktualizacji PATH.

    Jeśli chcesz mieć najpłynniejszą konfigurację w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Output exec na Windows pokazuje zniekształcony chiński tekst — co zrobić?">
    Zwykle jest to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - output `system.run`/`exec` wyświetla chiński tekst jako mojibake
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

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackable (git)**, aby mieć lokalnie pełne źródła i dokumentację, a potem zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, żeby mógł czytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Install](/pl/install) i [Installer flags](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a potem uruchom onboarding.

    - Szybka ścieżka dla Linuxa + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Getting Started](/start/getting-started).
    - Instalator + aktualizacje: [Install & updates](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Zadziała dowolny VPS z Linuxem. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dotrzeć do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Mamy **hub hostingowy** z typowymi dostawcami. Wybierz jednego i postępuj według przewodnika:

    - [VPS hosting](/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    żyją na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na laptopie, zachowując
    Gateway w chmurze.

    Hub: [Platforms](/pl/platforms). Dostęp zdalny: [Gateway remote](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby sam się zaktualizował?">
    Krótka odpowiedź: **to możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
    Gateway (co zrywa aktywną sesję), może wymagać czystego checkoutu git
    i może poprosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz to zautomatyzować z agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Update](/cli/update), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **local mode** prowadzi Cię przez:

    - **Konfigurację modelu/auth** (OAuth dostawcy, ponowne użycie Claude CLI i klucze API są obsługiwane, plus lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz bundled channel plugins, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent w macOS; systemd user unit w Linux/WSL2)
    - **Kontrole kondycji** i wybór **skills**

    Ostrzega także, jeśli skonfigurowany model jest nieznany lub brakuje auth.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchomić OpenClaw z użyciem **kluczy API** (Anthropic/OpenAI/innych) lub
    z **wyłącznie lokalnymi modelami**, dzięki czemu Twoje dane zostają na urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych dostawców.

    Uważamy, że fallback Claude Code CLI jest prawdopodobnie dozwolony dla lokalnej,
    zarządzanej przez użytkownika automatyzacji na podstawie publicznej dokumentacji CLI Anthropic. Mimo to
    polityka Anthropic dotycząca harnessów firm trzecich tworzy wystarczająco dużo niejasności wokół
    użycia opartego na subskrypcji w produktach zewnętrznych, że nie zalecamy tego
    w środowisku produkcyjnym. Anthropic poinformował też użytkowników OpenClaw **4 kwietnia 2026
    o 12:00 PM PT / 8:00 PM BST**, że ścieżka logowania Claude w **OpenClaw**
    liczy się jako użycie harnessu firmy trzeciej i wymaga teraz **Extra Usage**
    rozliczanego oddzielnie od subskrypcji. OpenAI Codex OAuth jest jawnie
    obsługiwany dla zewnętrznych narzędzi, takich jak OpenClaw.

    OpenClaw obsługuje również inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [GLM Models](/providers/glm),
    [Local models](/pl/gateway/local-models), [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak, przez lokalne logowanie **Claude CLI** na hoście gateway.

    Subskrypcje Claude Pro/Max **nie zawierają klucza API**, więc ponowne użycie Claude CLI
    jest lokalną ścieżką fallback w OpenClaw. Uważamy, że fallback Claude Code CLI
    jest prawdopodobnie dozwolony dla lokalnej, zarządzanej przez użytkownika automatyzacji
    na podstawie publicznej dokumentacji CLI Anthropic. Mimo to polityka Anthropic dotycząca harnessów firm trzecich
    tworzy wystarczająco dużo niejasności wokół użycia opartego na subskrypcji w produktach zewnętrznych,
    że nie zalecamy tego w środowisku produkcyjnym. Zamiast tego zalecamy
    klucze API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcyjne Claude (Claude Pro lub Max)?">
    Tak. Użyj ponownie lokalnego logowania **Claude CLI** na hoście gateway za pomocą `openclaw models auth login --provider anthropic --method cli --set-default`.

    Anthropic setup-token jest ponownie dostępny jako starsza/ręczna ścieżka OpenClaw. Nadal obowiązuje przy tym komunikat Anthropic o rozliczaniu specyficzny dla OpenClaw, więc używaj tego z założeniem, że Anthropic wymaga **Extra Usage**. Zobacz [Anthropic](/providers/anthropic) i [OAuth](/pl/concepts/oauth).

    Ważne: Uważamy, że fallback Claude Code CLI jest prawdopodobnie dozwolony dla lokalnej,
    zarządzanej przez użytkownika automatyzacji na podstawie publicznej dokumentacji CLI Anthropic. Mimo to
    polityka Anthropic dotycząca harnessów firm trzecich tworzy wystarczająco dużo niejasności wokół
    użycia opartego na subskrypcji w produktach zewnętrznych, że nie zalecamy tego
    w środowisku produkcyjnym. Anthropic poinformował także użytkowników OpenClaw 4 kwietnia 2026 o
    12:00 PM PT / 8:00 PM BST, że ścieżka logowania Claude w **OpenClaw**
    wymaga **Extra Usage** rozliczanego oddzielnie od subskrypcji.

    Dla środowisk produkcyjnych lub obciążeń wieloużytkownikowych uwierzytelnianie kluczem API Anthropic jest
    bezpieczniejszym, zalecanym wyborem. Jeśli chcesz innych hostowanych opcji
    w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax) i
    [GLM Models](/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
To oznacza, że Twoja **kwota/limit szybkości Anthropic** został wyczerpany dla bieżącego okna. Jeśli
używasz **Claude CLI**, poczekaj na reset okna albo podnieś plan. Jeśli
używasz **klucza API Anthropic**, sprawdź Anthropic Console
pod kątem użycia/rozliczeń i zwiększ limity w razie potrzeby.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, to żądanie próbuje użyć
    bety 1M context Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania long-context (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **fallback model**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca jest ograniczony przez rate limit.
    Zobacz [Models](/cli/models), [OAuth](/pl/concepts/oauth) i
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma bundled dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiska AWS, OpenClaw może automatycznie wykrywać katalog Bedrock streaming/text i scalać go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/providers/bedrock) i [Model providers](/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Onboarding może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy będzie to właściwe. Zobacz [Model providers](/pl/concepts/model-providers) i [Onboarding (CLI)](/start/wizard).
  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcyjne OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na używanie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach,
    takich jak OpenClaw. Onboarding może uruchomić ten przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Model providers](/pl/concepts/model-providers) i [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **plugin auth flow**, a nie client id czy secret w `openclaw.json`.

    Kroki:

    1. Zainstaluj Gemini CLI lokalnie, aby `gemini` było dostępne w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po logowaniu: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Jeśli żądania kończą się niepowodzeniem, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach auth na hoście gateway. Szczegóły: [Model providers](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do zwykłych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnych zabezpieczeń; małe karty obcinają i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, na jaką możesz sobie pozwolić (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/skwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Security](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w określonym regionie?">
    Wybieraj endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymieniać obok nich Anthropic/OpenAI, używając `models.mode: "merge"`, tak aby fallbacki pozostawały dostępne przy zachowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuxie (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy lub urządzenie klasy Raspberry Pi też się sprawdzi.

    Mac jest potrzebny tylko do **narzędzi wyłącznie dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) —
    serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie lub gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj node z macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Mac remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia z macOS** zalogowanego do Messages. To **nie** musi być Mac mini —
    zadziała dowolny Mac. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) do iMessage —
    serwer BlueBubbles działa na macOS, a Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linuxie/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Mac remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z MacBook Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **node** (urządzenie towarzyszące). Nodes nie uruchamiają Gateway — dostarczają dodatkowe
    możliwości, takie jak screen/camera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS lub host node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Dla stabilnych gateway używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co powinno znaleźć się w allowFrom?">
    `channels.telegram.allowFrom` to **Telegram user ID nadawcy będącego człowiekiem** (liczbowe). To nie jest nazwa użytkownika bota.

    Onboarding przyjmuje dane wejściowe `@username` i rozwiązuje je do numerycznego ID, ale autoryzacja OpenClaw używa wyłącznie numerycznych ID.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a potem uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a potem wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne narzędzia (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **multi-agent routing**. Powiąż WhatsApp **DM** każdego nadawcy (peer `kind: "direct"`, E.164 nadawcy jak `+15551234567`) z innym `agentId`, tak aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą pochodzić z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla całego konta WhatsApp. Zobacz [Multi-Agent Routing](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta "fast chat" i agenta "Opus for coding"?'>
    Tak. Użyj multi-agent routing: nadaj każdemu agentowi własny domyślny model, a następnie przypisz trasy przychodzące (konto dostawcy lub określone peers) do każdego z nich. Przykładowa konfiguracja znajduje się w [Multi-Agent Routing](/pl/concepts/multi-agent). Zobacz także [Models](/pl/concepts/models) i [Configuration](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefix brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach bez logowania.
    Nowsze kompilacje poprzedzają również typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackable git a npm install">
    - **Instalacja hackable (git):** pełny checkout źródeł, możliwość edycji, najlepsza dla współtwórców.
      Uruchamiasz buildy lokalnie i możesz patchować kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Getting started](/start/getting-started), [Updating](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm a git?">
    Tak. Zainstaluj drugą wersję, a potem uruchom Doctor, aby usługa gateway wskazywała nowy entrypoint.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
    (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nienaruszone.

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

    Doctor wykrywa niedopasowanie entrypointu usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące kopii zapasowych: zobacz [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszego tarcia i akceptujesz usypianie/restarty, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki.
    - **Wady:** usypianie/zanik sieci = rozłączenia, aktualizacje/rebooty systemu przerywają działanie, komputer musi być aktywny.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działają headless (używaj zrzutów ekranu), zdalny dostęp tylko do plików, do aktualizacji potrzebujesz SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają dobrze na VPS. Jedyny realny kompromis to **przeglądarka headless** vs widoczne okno. Zobacz [Browser](/tools/browser).

    **Zalecane domyślnie:** VPS, jeśli wcześniej miałeś rozłączenia gateway. Lokalnie jest świetnie, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez usypianie/rebooty, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie OK do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna śpi lub się aktualizuje.

    Jeśli chcesz mieć to, co najlepsze z obu światów, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki bezpieczeństwa znajdziesz w [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatowego:

    - **Bezwzględne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia node i automatyzacja przeglądarki mogą być zasobożerne.

    System operacyjny: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć dość
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Bezwzględne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia do mediów.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/platforms/windows), [VPS hosting](/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada na powierzchniach komunikacyjnych, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz bundled channel plugins, takich jak QQ Bot) i może też obsługiwać głos + aktywny Canvas na wspieranych platformach. **Gateway** to zawsze włączona płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie „po prostu wrapper Claude”. To **local-first control plane**, które pozwala uruchomić
    zaawansowanego asystenta na **Twoim własnym sprzęcie**, dostępnego z używanych przez Ciebie aplikacji czatowych,
    ze stanowymi sesjami, pamięcią i narzędziami — bez oddawania kontroli nad swoimi przepływami pracy
    hostowanemu SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway gdzie chcesz (Mac, Linux, VPS) i trzymaj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie piaskownica webowa:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus głos mobilny i Canvas na wspieranych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itp. z routingiem
      i failover per agent.
    - **Opcja tylko lokalna:** uruchamiaj lokalne modele, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Multi-agent routing:** oddzielni agenci per kanał, konto lub zadanie, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackable:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Channels](/pl/channels), [Multi-agent](/pl/concepts/multi-agent),
    [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem — co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify lub prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkuj pliki i foldery (sprzątanie, nazewnictwo, tagowanie).
    - Podłącz Gmail i zautomatyzuj podsumowania lub follow-upy.

    Potrafi obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na fazy i
    użyjesz sub agents do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najczęstszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i ważnych dla Ciebie wiadomości.
    - **Research i szkice:** szybki research, podsumowania i pierwsze wersje e-maili lub dokumentów.
    - **Przypomnienia i follow-upy:** cron lub heartbeat jako źródło przypomnień i checklist.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway wykonać je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc przy lead gen, outreachu, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i tworzenia szkiców**. Może skanować strony, budować shortlisty,
    podsumowywać potencjalnych klientów i pisać szkice outreachu lub copy reklamowego.

    W przypadku **outreachu lub kampanii reklamowych** trzymaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnego prawa i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to taki, w którym
    OpenClaw przygotowuje szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu stron?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooks)
    - **Zawsze włączony Gateway** (uruchom na VPS, korzystaj skądkolwiek)
    - **Nodes** dla lokalnego browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować skills bez utrzymywania brudnego repozytorium?">
    Używaj zarządzanych override'ów zamiast edytowania kopii w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, więc zarządzane override'y nadal mają pierwszeństwo przed bundled skills bez dotykania gita. Jeśli skill ma być zainstalowany globalnie, ale widoczny tylko dla części agentów, trzymaj wspólną kopię w `~/.openclaw/skills` i steruj widocznością przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte upstreamu powinny żyć w repozytorium i wychodzić jako PR-y.
  </Accordion>

  <Accordion title="Czy mogę ładować skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` instaluje domyślnie do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli skill ma być widoczny tylko dla wybranych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Cron jobs**: izolowane zadania mogą ustawiać override `model` dla danego zadania.
    - **Sub-agents**: kieruj zadania do osobnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Cron jobs](/pl/automation/cron-jobs), [Multi-Agent Routing](/pl/concepts/multi-agent) i [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Użyj **sub-agents** do długich lub równoległych zadań. Sub-agents działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „utworzył sub-agent dla tego zadania” lub użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi właśnie teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i sub-agents zużywają tokeny. Jeśli koszt jest problemem, ustaw
    tańszy model dla sub-agents przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agents](/tools/subagents), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkami na Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z celem subagenta lub sesji, aby kolejne wiadomości w tym wątku pozostawały przypisane do tej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (opcjonalnie z `mode: "session"` dla trwałego follow-upu).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby sterować automatycznym unfocus.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania dla Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agents](/tools/subagents), [Discord](/pl/channels/discord), [Configuration Reference](/pl/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja ukończenia trafiła w złe miejsce albo w ogóle się nie opublikowała. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requester:

    - Dostarczanie completion-mode subagent preferuje dowolny powiązany wątek lub trasę konwersacji, jeśli taka istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji requester (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie ma ani powiązanej trasy, ani użytecznej zapisanej trasy, bezpośrednie dostarczenie może się nie udać, a wynik wraca do dostarczenia przez kolejkę sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić fallback do kolejki albo ostateczną awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować przestarzały wcześniejszy postęp.
    - Jeśli dziecko przekroczyło czas tylko po wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowy output narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agents](/tools/subagents), [Background Tasks](/pl/automation/tasks), [Session Tools](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa stale,
    zaplanowane zadania nie będą się uruchamiać.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
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

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać zewnętrznej wiadomości.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelnienia kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy izolowany wynik (`NO_REPLY` / `no_reply` tylko) jest traktowany jako celowo nienadający się do dostarczenia, więc runner tłumi też dostarczenie fallback przez kolejkę.

    W przypadku izolowanych cron jobs runner odpowiada za końcowe dostarczenie. Od agenta oczekuje się
    zwrócenia podsumowania w postaci zwykłego tekstu do wysłania przez runner.
    `--no-deliver` zachowuje ten wynik wewnętrznie; nie pozwala agentowi wysłać go
    bezpośrednio narzędziem wiadomości.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Background Tasks](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron przełączyło modele albo ponowiło próbę raz?">
    To zwykle jest ścieżka live model-switch, a nie zduplikowane harmonogramowanie.

    Izolowany cron może utrwalić przekazanie modelu środowiska uruchomieniowego i ponowić próbę, gdy aktywne
    uruchomienie rzuci `LiveSessionModelSwitchError`. Ponowienie próby zachowuje przełączonego
    provider/model, a jeśli przełączenie zawierało nowe nadpisanie auth profile, cron
    utrwala również to przed ponowieniem próby.

    Powiązane zasady wyboru:

    - Override modelu dla hook Gmail wygrywa jako pierwszy, gdy ma zastosowanie.
    - Następnie `model` per zadanie.
    - Następnie dowolny zapisany override modelu sesji cron.
    - Następnie normalny wybór modelu domyślnego/agenta.

    Pętla ponowień ma ograniczenie. Po pierwszej próbie plus 2 ponowieniach po przełączeniu
    cron przerywa zamiast zapętlać się w nieskończoność.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować skills na Linuxie?">
    Użyj natywnych poleceń `openclaw skills` albo umieść skills w swoim workspace. UI Skills na macOS nie jest dostępne na Linuxie.
    Przeglądaj skills na [https://clawhub.ai](https://clawhub.ai).

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

    Natywne `openclaw skills install` zapisuje do aktywnego katalogu `skills/`
    w workspace. Instaluj osobne CLI `clawhub` tylko wtedy, gdy chcesz publikować lub
    synchronizować własne skills. Dla współdzielonych instalacji między agentami umieść skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` lub
    `agents.list[].skills`, jeśli chcesz zawęzić widoczność do wybranych agentów.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj scheduler Gateway:

    - **Cron jobs** dla zaplanowanych lub cyklicznych zadań (trwają po restartach).
    - **Heartbeat** dla okresowych kontroli „głównej sesji”.
    - **Isolated jobs** dla autonomicznych agentów, które publikują podsumowania lub dostarczają je na czaty.

    Dokumentacja: [Cron jobs](/pl/automation/cron-jobs), [Automation & Tasks](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Apple macOS-only skills z Linuxa?">
    Nie bezpośrednio. Skills dla macOS są bramkowane przez `metadata.openclaw.os` oraz wymagane binaria, a skills pojawiają się w system prompt tylko wtedy, gdy kwalifikują się na **hoście Gateway**. Na Linuxie skills tylko dla `darwin` (jak `apple-notes`, `apple-reminders`, `things-mac`) nie załadują się, chyba że nadpiszesz tę bramkę.

    Masz trzy wspierane wzorce:

    **Opcja A — uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a następnie łącz się z Linuxa w [remote mode](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills załadują się normalnie, bo host Gateway to macOS.

    **Opcja B — użyj node z macOS (bez SSH).**
    Uruchom Gateway na Linuxie, sparuj node z macOS (aplikacja w pasku menu) i ustaw **Node Run Commands** na „Always Ask” lub „Always Allow” na Macu. OpenClaw może traktować skills tylko dla macOS jako kwalifikujące się, jeśli wymagane binaria istnieją na node. Agent uruchamia te skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w monicie dodaje to polecenie do allowlist.

    **Opcja C — proxy dla binariów macOS przez SSH (zaawansowane).**
    Zachowaj Gateway na Linuxie, ale spraw, by wymagane binaria CLI były rozwiązywane do wrapperów SSH uruchamianych na Macu. Następnie nadpisz skill, aby zezwalał na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla binarnego pliku (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane skill (workspace lub `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Zarządzaj Apple Notes przez CLI memo na macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć migawkę skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Dziś nie wbudowaną.

    Opcje:

    - **Custom skill / plugin:** najlepsze do niezawodnego dostępu API (zarówno Notion, jak i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz utrzymywać kontekst per klient (przepływy agencyjne), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobierał tę stronę na początku sesji.

    Jeśli chcesz natywną integrację, otwórz prośbę o funkcję albo zbuduj skill
    używający tych API.

    Instalacja skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do aktywnego katalogu `skills/` w workspace. Dla współdzielonych skills między agentami umieszczaj je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` lub `agents.list[].skills`. Niektóre skills oczekują binariów instalowanych przez Homebrew; na Linuxie oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linuxie powyżej). Zobacz [Skills](/tools/skills), [Skills config](/tools/skills-config) i [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać mojego istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz niestandardową nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka jest lokalna dla hosta. Jeśli Gateway działa gdzie indziej, uruchom host node na maszynie z przeglądarką lub zamiast tego użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na ref, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań oraz akcje wsadowe nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobny dokument o sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Dla konfiguracji specyficznej dla Docker (pełny gateway w Docker albo obrazy sandbox) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia na bezpieczeństwo i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani bundled browsers. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby cache przetrwał.
    - Wbuduj zależności systemowe w obraz przez `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować DM jako prywatne, ale uczynić grupy publicznymi/sandboxowanymi przy użyciu jednego agenta?">
    Tak — jeśli Twój prywatny ruch to **DM**, a publiczny ruch to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grupowe/kanałowe (klucze inne niż main) działały w Docker, podczas gdy główna sesja DM pozostaje na hoście. Następnie ogranicz, jakie narzędzia są dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowy config: [Groups: personal DMs + public groups](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowe odniesienie do konfiguracji: [Gateway configuration](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak powiązać folder hosta z sandboxem?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne + per-agent są scalane; powiązania per-agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że bindy omijają ściany systemu plików sandboxa.

    OpenClaw weryfikuje źródła bind zarówno względem znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez symlink-parent nadal kończą się fail closed, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole allowed-root nadal obowiązują po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) i [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Kuratorowane notatki długoterminowe w `MEMORY.md` (tylko sesje main/private)

    OpenClaw uruchamia też **cichy pre-compaction memory flush**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatycznym kompaktowaniem. Dzieje się to tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby coś zostało?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafić do `MEMORY.md`,
    a kontekst krótkoterminowy do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominać modelowi o zapisywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    workspace przy każdym uruchomieniu.

    Dokumentacja: [Memory](/pl/concepts/memory), [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć pozostaje na zawsze? Jakie są limity?">
    Pliki pamięci są przechowywane na dysku i pozostają tam, dopóki ich nie usuniesz. Limitem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstowe
    modelu, więc długie rozmowy mogą być kompaktowane lub obcinane. Dlatego
    istnieje wyszukiwanie pamięci — przywraca do kontekstu tylko istotne fragmenty.

    Dokumentacja: [Memory](/pl/concepts/memory), [Context](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddings OpenAI**. Codex OAuth obejmuje chat/completions i
    **nie** daje dostępu do embeddings, więc **logowanie przez Codex (OAuth lub
    login Codex CLI)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddings OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` lub `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybierze dostawcę, gdy
    potrafi rozwiązać klucz API (auth profiles, `models.providers.*.apiKey` lub zmienne środowiskowe).
    Preferuje OpenAI, jeśli da się rozwiązać klucz OpenAI, w przeciwnym razie Gemini, jeśli
    da się rozwiązać klucz Gemini, potem Voyage, a następnie Mistral. Jeśli nie ma dostępnego zdalnego klucza,
    wyszukiwanie pamięci pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną
    i obecną ścieżkę lokalnego modelu, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddings Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (lub
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local** —
    szczegóły konfiguracji znajdziesz w [Memory](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co do nich wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog Twojego workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/etc.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/etc.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz ślad:** używanie lokalnych modeli zatrzymuje prompty na Twojej maszynie, ale ruch kanałowy
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Agent workspace](/pl/concepts/agent-workspace), [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Path                                                            | Przeznaczenie                                                      |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główny config (JSON5)                                              |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do auth profiles przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, klucze API i opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny plikowy payload secret dla dostawców `file` SecretRef   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` są scrubbed)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per-agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka single-agent: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (`AGENTS.md`, pliki pamięci, skills itp.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (lub starszy fallback `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: config, stan kanałów/dostawców, auth profiles, sesje, logi
      i współdzielone skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowany przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: remote mode używa **workspace hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał to do
    AGENTS.md lub MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Agent workspace](/pl/concepts/agent-workspace) i [Memory](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowej">
    Umieść **workspace agenta** w **prywatnym** repozytorium git i twórz jego kopię zapasową w
    prywatnym miejscu (na przykład GitHub private). To zapisuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (credentials, sessions, tokens ani zaszyfrowanych payloadów secret).
    Jeśli potrzebujesz pełnego odtworzenia, twórz kopię zapasową zarówno workspace, jak i katalogu stanu
    oddzielnie (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Agent workspace](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz dedykowany przewodnik: [Uninstall](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza workspace?">
    Tak. Workspace to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) lub ustawień sandbox per agent. Jeśli
    chcesz, aby repozytorium było domyślnym katalogiem roboczym, wskaż `workspace`
    danego agenta na root repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace osobno, chyba że celowo chcesz, aby agent pracował wewnątrz niego.

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

  <Accordion title="Remote mode: gdzie jest magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w remote mode, interesujący Cię magazyn sesji znajduje się na zdalnej maszynie, a nie na Twoim lokalnym laptopie. Zobacz [Session management](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki jest format config? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalny config **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używa w miarę bezpiecznych ustawień domyślnych (w tym domyślnego workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Bindy inne niż loopback **wymagają poprawnej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie shared-secret: token lub hasło
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

    - `gateway.remote.token` / `.password` same w sobie **nie** włączają lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się fail closed (bez maskującego fallbacku remote).
    - Konfiguracje Control UI z shared-secret uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach app/UI). Tryby oparte na tożsamości, takie jak Tailscale Serve lub `trusted-proxy`, używają zamiast tego nagłówków żądania. Unikaj umieszczania shared secrets w URL-ach.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy na tym samym hoście z loopback nadal **nie** spełnia trusted-proxy auth. Trusted proxy musi być skonfigurowanym źródłem innym niż loopback.

  </Accordion>

  <Accordion title="Dlaczego potrzebuję teraz tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, w tym dla loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki auth, startup gateway przechodzi do trybu token i automatycznie go generuje, zapisując do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. To blokuje innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę auth, możesz jawnie wybrać tryb hasła (lub dla non-loopback identity-aware reverse proxy `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w config. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje config i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosuje na gorąco, dla krytycznych wykonuje restart
    - obsługiwane są też `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Jak wyłączyć zabawne tagline w CLI?">
    Ustaw `cli.banner.taglineMode` w config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ukrywa tekst tagline, ale zachowuje linię z tytułem/wersją bannera.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe tagline (domyślne zachowanie).
    - Jeśli nie chcesz żadnego bannera, ustaw env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć web search (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci o API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają zwykłej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą o HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy w zmiennych środowiskowych:

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
              provider: "firecrawl", // opcjonalne; pomiń dla auto-detect
            },
          },
        },
    }
    ```

    Konfiguracja web-search specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawcy `tools.web.search.*` nadal tymczasowo się ładują dla zgodności, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja fallbacku web-fetch Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz allowlist, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że jawnie je wyłączysz).
    - Jeśli pominięto `tools.web.fetch.provider`, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę fallback fetch na podstawie dostępnych poświadczeń. Obecnie bundled dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (lub środowiska usługi).

    Dokumentacja: [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyścił mój config. Jak odzyskać i jak tego uniknąć?">
    `config.apply` zastępuje **cały config**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Odzyskiwanie:

    - Przywróć z kopii zapasowej (git lub skopiowany `~/.openclaw/openclaw.json`).
    - Jeśli nie masz kopii, ponownie uruchom `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatni znany config albo dowolną kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działający config z logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu plus podsumowania bezpośrednich dzieci do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; zachowaj `config.apply` tylko dla pełnej wymiany config.
    - Jeśli używasz narzędzia `gateway` tylko dla właściciela z poziomu uruchomienia agenta, nadal będzie odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway z wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **nodes** i **agents**:

    - **Gateway (centralny):** posiada channels (Signal/WhatsApp), routing i sesje.
    - **Nodes (urządzenia):** komputery Mac/iOS/Android łączą się jako peryferia i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agents (workery):** oddzielne „mózgi”/workspace dla wyspecjalizowanych ról (np. „Hetzner ops”, „Personal data”).
    - **Sub-agents:** uruchamiaj pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** łącz się z Gateway i przełączaj agents/sessions.

    Dokumentacja: [Nodes](/pl/nodes), [Remote access](/pl/gateway/remote), [Multi-Agent Routing](/pl/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać headless?">
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

    Domyślnie jest `false` (headful). Headless częściej wywołuje kontrole antybotowe na niektórych stronach. Zobacz [Browser](/tools/browser).

    Headless używa **tego samego silnika Chromium** i działa dla większości automatyzacji (formularze, kliknięcia, scraping, logowanie). Główne różnice:

    - Brak widocznego okna przeglądarki (używaj zrzutów ekranu, jeśli potrzebujesz obrazu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarkę Brave (lub dowolną przeglądarkę opartą na Chromium) i zrestartuj Gateway.
    Zobacz pełne przykłady konfiguracji w [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gateway i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i nodes?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą ruchu przychodzącego od dostawcy; otrzymują tylko wywołania RPC node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (screen, camera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host Gateway + swój komputer w tym samym tailnet.
    3. Upewnij się, że WS Gateway jest osiągalny (bind tailnet lub SSH tunnel).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (lub bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nie jest wymagany osobny most TCP; nodes łączą się przez Gateway WebSocket.

    Przypomnienie dotyczące bezpieczeństwa: sparowanie node z macOS umożliwia `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przeczytaj [Security](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Gateway protocol](/pl/gateway/protocol), [macOS remote mode](/pl/platforms/mac/remote), [Security](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączone, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj auth i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez SSH tunnel, potwierdź, że lokalny tunnel działa i wskazuje właściwy port.
    - Upewnij się, że Twoje allowlisty (DM lub group) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Remote access](/pl/gateway/remote), [Channels](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj normalnego kanału czatowego, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem pozwól Botowi B odpowiedzieć jak zwykle.

    **Most CLI (generyczny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, kierując wiadomość na czat, którego nasłuchuje drugi bot.
    Jeśli jeden bot działa na zdalnym VPS, skieruj CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Remote access](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która może dotrzeć do docelowego Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj guardrail, aby oba boty nie zapętliły się bez końca (tylko wzmianki, channel
    allowlists lub zasada „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Remote access](/pl/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własnym workspace, modelami domyślnymi
    i routingiem. To normalna konfiguracja i jest znacznie tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS tylko wtedy, gdy potrzebujesz twardej izolacji (granice bezpieczeństwa) lub bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów lub sub-agentów.

  </Accordion>

  <Accordion title="Czy używanie node na moim prywatnym laptopie ma przewagę nad SSH z VPS?">
    Tak — nodes to pierwszoklasowy sposób dostępu do laptopa ze zdalnego Gateway i
    dają więcej niż sam dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS lub urządzenie klasy Raspberry Pi; 4 GB RAM to aż nadto), więc częstą
    konfiguracją jest zawsze włączony host oraz laptop jako node.

    - **Bez przychodzącego SSH.** Nodes łączą się wychodząco do Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze kontrole wykonywania.** `system.run` jest bramkowane przez allowlisty/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez host node na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale nodes są prostsze dla stałych przepływów agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Tylko **jeden gateway** powinien działać na hoście, chyba że celowo uruchamiasz izolowane profile (zobacz [Multiple gateways](/pl/gateway/multiple-gateways)). Nodes to urządzenia peryferyjne, które łączą
    się z gateway (nodes iOS/Android lub „node mode” w macOS w aplikacji menu bar). Dla headless node
    hostów i sterowania przez CLI zobacz [Node host CLI](/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdź jedno poddrzewo config wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobierz bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC)
    - `config.apply`: waliduje + zastępuje cały config, a potem restartuje
    - Narzędzie środowiska uruchomieniowego `gateway`, dostępne tylko dla właściciela, nadal odmawia przepisania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalny sensowny config dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia Twój workspace i ogranicza, kto może uruchomić bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
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

    To utrzymuje gateway przypięty do loopback i wystawia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć node z Maca ze zdalnym Gateway (Tailscale Serve)?">
    Serve wystawia **Gateway Control UI + WS**. Nodes łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tym samym tailnet**.
    2. **Użyj aplikacji macOS w Remote mode** (celem SSH może być nazwa hosta tailnet).
       Aplikacja utworzy tunnel dla portu Gateway i połączy się jako node.
    3. **Zatwierdź node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Gateway protocol](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [macOS remote mode](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem instalować to na drugim laptopie, czy po prostu dodać node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **node**. Dzięki temu zachowasz pojedynczy Gateway i unikniesz duplikowania konfiguracji. Lokalne narzędzia node są
    obecnie dostępne tylko dla macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Instaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** lub dwóch w pełni oddzielnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itp.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też definiować inline env vars w config (stosowane tylko wtedy, gdy brakuje ich w process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełny porządek pierwszeństwa i źródła znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje env vars zniknęły. Co teraz?">
    Dwie typowe poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy env z Twojej powłoki.
    2. Włącz import z powłoki (opcjonalne ułatwienie):

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

    To uruchamia Twoją powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki w zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` raportuje, czy **import shell env** jest włączony. „Shell env: off”
    **nie** oznacza, że brakuje Twoich env vars — oznacza tylko, że OpenClaw nie będzie automatycznie ładował
    Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    Twojej powłoki. Napraw to jednym z poniższych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import z powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w config (stosowane tylko, jeśli go brakuje).

    Następnie zrestartuj gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (również `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/concepts/model-providers](/pl/concepts/model-providers) i [/environment](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć nową rozmowę?">
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Session management](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygaśnięcie bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    Nie usuwa to transcriptów — po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy da się zbudować zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **multi-agent routing** i **sub-agents**. Możesz utworzyć jednego agenta koordynującego
    i kilku agentów roboczych z własnymi workspace i modelami.

    Warto jednak traktować to jako **ciekawy eksperyment**. Jest to kosztowne pod względem tokenów i często
    mniej wydajne niż używanie jednego bota z oddzielnymi sesjami. Typowy model,
    jaki sobie wyobrażamy, to jeden bot, z którym rozmawiasz, i różne sesje do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać sub-agents.

    Dokumentacja: [Multi-agent routing](/pl/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w środku zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże outputy narzędzi lub wiele
    plików może wywołać kompaktowanie albo obcięcie.

    Co pomaga:

    - Poproś bota, aby podsumował bieżący stan i zapisał go do pliku.
    - Użyj `/compact` przed długimi zadaniami, a `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby odczytał go ponownie.
    - Używaj sub-agents do długiej lub równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstowym, jeśli zdarza się to często.

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

    - Onboarding oferuje też **Reset**, jeśli wykryje istniejący config. Zobacz [Onboarding (CLI)](/start/wizard).
    - Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), resetuj każdy katalog stanu (domyślnie są to `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (tylko dev; czyści config dev + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" — jak zresetować lub skompaktować?'>
    Użyj jednej z tych opcji:

    - **Compact** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby sterować podsumowaniem.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli nadal się to dzieje:

    - Włącz lub dostrój **session pruning** (`agents.defaults.contextPruning`), aby przycinać stare outputy narzędzi.
    - Użyj modelu z większym oknem kontekstowym.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Session pruning](/pl/concepts/session-pruning), [Session management](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    lub zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję przez `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości heartbeat co 30 minut?">
    Heartbeat uruchamia się domyślnie co **30m** (**1h** przy użyciu auth OAuth). Dostosuj lub wyłącz go:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie puste (tylko puste linie i markdownowe
    nagłówki jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku brakuje, heartbeat nadal się uruchamia, a model decyduje, co zrobić.

    Nadpisania per-agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodawać "konto bota" do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wywoływać odpowiedzi w grupie:

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
    Opcja 1 (najszybciej): śledź logi i wyślij wiadomość testową do grupy:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (lub `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowane/dodane do allowlist): wyświetl grupy z config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie typowe przyczyny:

    - Mention gating jest włączone (domyślnie). Musisz oznaczyć bota przez @mention (lub dopasować `mentionPatterns`).
    - Skonfigurowałeś `channels.whatsapp.groups` bez `"*"` i ta grupa nie jest w allowlist.

    Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie domyślnie zwijają się do sesji main. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to oddzielne sesje. Zobacz [Groups](/pl/channels/groups) i [Group messages](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (a nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Wzrost zużycia dysku:** sesje + transkrypty znajdują się pod `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** auth profiles per-agent, workspace i routing kanałów.

    Wskazówki:

    - Utrzymuj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuwaj JSONL lub wpisy magazynu), jeśli dysk rośnie.
    - Używaj `openclaw doctor`, aby wykrywać osierocone workspace i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak powinienem to skonfigurować?">
    Tak. Użyj **Multi-Agent Routing**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peer. Slack jest obsługiwany jako kanał i może być powiązany z określonymi agentami.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co człowiek może” — antybot, CAPTCHA i MFA nadal mogą
    blokować automatyzację. Dla najbardziej niezawodnego sterowania przeglądarką użyj lokalnego Chrome MCP na hoście,
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Konfiguracja zgodna z najlepszymi praktykami:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (bindings).
    - Kanały Slack powiązane z tymi agentami.
    - Lokalna przeglądarka przez Chrome MCP lub node, gdy jest potrzebna.

    Dokumentacja: [Multi-Agent Routing](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Browser](/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Czym jest "default model"?'>
    Domyślny model OpenClaw to wszystko, co ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz provider, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania exact model id do skonfigurowanego dostawcy, a dopiero potem wraca do skonfigurowanego default provider jako starszej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego provider/model zamiast ujawniać nieaktualny domyślny model z usuniętego dostawcy. Nadal powinieneś **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany domyślny:** używaj najmocniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z włączonymi narzędziami lub z niezaufanym wejściem:** stawiaj siłę modelu ponad kosztem.
    **Do rutynowych/niskiego ryzyka rozmów:** używaj tańszych modeli fallback i kieruj ruch według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/providers/minimax) i
    [Local models](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki Cię stać** do pracy wysokiej stawki, a tańszego
    modelu do rutynowych rozmów lub podsumowań. Możesz routować modele per agent i używać sub-agents do
    równoległego wykonywania długich zadań (każdy sub-agent zużywa tokeny). Zobacz [Models](/pl/concepts/models) i
    [Sub-agents](/tools/subagents).

    Mocne ostrzeżenie: słabsze/nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowanie. Zobacz [Security](/pl/gateway/security).

    Więcej kontekstu: [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez wyczyszczenia config?">
    Używaj **poleceń modelu** albo edytuj tylko pola **model**. Unikaj pełnych zamian config.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko config modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że zamierzasz wymienić cały config.
    Dla edycji RPC najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`. Payload lookup daje znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu oraz podsumowania bezpośrednich dzieci
    dla częściowych aktualizacji.
    Jeśli nadpisałeś config, przywróć z kopii zapasowej lub ponownie uruchom `openclaw doctor`, aby naprawić.

    Dokumentacja: [Models](/pl/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najłatwiejsza ścieżka do lokalnych modeli.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz lokalny model, np. `ollama pull glm-4.7-flash`
    3. Jeśli chcesz także modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe plus lokalne modele Ollama
    - modele ch