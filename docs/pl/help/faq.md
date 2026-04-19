---
read_when:
    - Odpowiadanie na typowe pytania dotyczące konfiguracji, instalacji, wdrożenia lub działania w czasie wykonywania
    - Wstępna ocena problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i korzystania z OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-19T09:34:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz bardziej szczegółowe rozwiązywanie problemów dla rzeczywistych konfiguracji (lokalny development, VPS, środowisko wieloagentowe, klucze OAuth/API, przełączanie awaryjne modeli). Informacje o diagnostyce środowiska uruchomieniowego znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełne informacje referencyjne o konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Pierwsze 60 sekund, gdy coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność Gateway/usługi, agenci/sesje, konfiguracja dostawców + problemy środowiska uruchomieniowego (gdy Gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje stan supervisora w środowisku uruchomieniowym względem osiągalności RPC, docelowy adres URL sondy oraz której konfiguracji usługa prawdopodobnie użyła.

4. **Dogłębne sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę kondycji Gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Kondycja](/pl/gateway/health).

5. **Podgląd najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj awaryjnie:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielne od logów usługi; zobacz [Rejestrowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom Doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Prosi uruchomiony Gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem/utknęłam — najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który potrafi **widzieć Twój komputer**. To jest znacznie skuteczniejsze niż pytanie
    na Discordzie, ponieważ większość przypadków „utknąłem/utknęłam” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą odczytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawić konfigurację
    na poziomie komputera (PATH, usługi, uprawnienia, pliki uwierzytelniania). Udostępnij im **pełne checkout źródeł**
    przez instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może odczytać kod + dokumentację i
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są niewielkie i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś proszę issue na GitHubie albo wyślij PR:
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
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole w CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, gdy coś nie działa](#pierwsze-60-sekund-gdy-coś-nie-działa).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Najczęstsze powody pomijania Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem active-hours
    - `empty-heartbeat-file`: plik `HEARTBEAT.md` istnieje, ale zawiera tylko pusty/nagłówkowy szablon
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagalny
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po
    zakończeniu rzeczywistego uruchomienia heartbeat. Pominięte uruchomienia
    nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może także automatycznie zbudować zasoby interfejsu użytkownika. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/development):

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
    Kreator otwiera przeglądarkę z czystym (bez tokena) adresem URL dashboardu zaraz po onboardingu i wypisuje też link w podsumowaniu. Zachowaj tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany adres URL na tym samym komputerze.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ten sam komputer):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokena: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli wspólny sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bind loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania uwierzytelniania Control UI/WebSocket (bez wklejanego wspólnego sekretu, przy założeniu zaufanego hosta gateway); interfejsy API HTTP nadal wymagają uwierzytelniania wspólnym sekretem, chyba że celowo używasz prywatnego ingress `none` lub uwierzytelniania HTTP trusted-proxy.
      Nieprawidłowe równoczesne próby uwierzytelniania Serve z tego samego klienta są serializowane, zanim ogranicznik nieudanych uwierzytelnień je zarejestruje, więc druga nieudana próba może już pokazać `retry later`.
    - **Bind tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący wspólny sekret w ustawieniach dashboardu.
    - **Reverse proxy ze świadomością tożsamości**: pozostaw Gateway za zaufanym proxy innym niż loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie wspólnym sekretem nadal obowiązuje przez tunel; po wyświetleniu monitu wklej skonfigurowany token lub hasło.

    Szczegółowe informacje o trybach bind i uwierzytelnianiu znajdziesz w [Dashboard](/web/dashboard) i [Powierzchnie webowe](/web).

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje monity o zatwierdzenie do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że dany kanał działa jako natywny klient zatwierdzeń exec

    Zasada exec po stronie hosta nadal jest właściwą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko to, gdzie pojawiają się
    monity o zatwierdzenie i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez współdzieloną ścieżkę.
    - Jeśli obsługiwany kanał natywny potrafi bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ta natywna warstwa UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być także przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy wyraźnie chcesz, aby monity o zatwierdzenie były publikowane z powrotem do pokoju/tematu, z którego pochodzą.
    - Zatwierdzenia Plugin są jeszcze oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne dodatkowo utrzymują natywną obsługę zatwierdzania Plugin.

    W skrócie: przekazywanie służy do routingu, a konfiguracja klienta natywnego — do bogatszego, specyficznego dla kanału UX.
    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje, że do użytku osobistego wystarczy **512 MB–1 GB RAM**, **1 rdzeń** i około **500 MB**
    miejsca na dysku, oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć większy zapas (logi, multimedia, inne usługi), zalecane są **2 GB**,
    ale nie jest to sztywne minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz sparować **nodes** na laptopie/telefonie do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Czy są jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    W skrócie: działa, ale spodziewaj się pewnych niedoskonałości.

    - Używaj systemu **64-bitowego** i zachowaj Node >= 22.
    - Preferuj **instalację hackable (git)**, aby mieć wgląd w logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je po jednym.
    - Jeśli trafisz na dziwne problemy z binariami, zwykle chodzi o **zgodność z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na „wake up my friend” / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI także automatycznie wysyła
    „Wake up, my friend!” przy pierwszym wykluciu. Jeśli widzisz tę linię **bez odpowiedzi**
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

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa oraz że interfejs UI
    jest skierowany na właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nowy komputer (Mac mini) bez ponownego przechodzenia onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom Doctor jeden raz. To
    zachowa Twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i
    stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowym komputerze.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starego komputera.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, poświadczenia WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host Gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/wypychasz swój workspace do GitHub, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    w `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#gdzie-rzeczy-znajdują-się-na-dysku),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę sprawdzić, co nowego jest w najnowszej wersji?">
    Sprawdź changelog na GitHubie:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli najwyższa sekcja jest oznaczona jako **Unreleased**, następna sekcja
    z datą to najnowsza opublikowana wersja. Wpisy są pogrupowane według **Highlights**, **Changes** i
    **Fixes** (plus sekcje dokumentacji/inne, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity nieprawidłowo blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz tę funkcję lub dodaj `docs.openclaw.ai` do allowlisty, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając problem tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz połączyć się ze stroną, dokumentacja jest mirrorowana na GitHubie:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle stabilne wydanie trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    w razie potrzeby publikować bezpośrednio do `latest`. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma główka `main` (git); po publikacji używa npm dist-tag `dev`.

    Jednolinijkowce (macOS/Linux):

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

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackable (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To daje lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/cli/update), [Kanały deweloperskie](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle zajmuje instalacja i onboarding?">
    Orientacyjnie:

    - **Instalacja:** 2–5 minut
    - **Onboarding:** 5–15 minut w zależności od liczby skonfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, użyj [Instalator utknął](#szybki-start-i-konfiguracja-przy-pierwszym-uruchomieniu)
    oraz szybkiej pętli debugowania z [Utknąłem/utknęłam](#szybki-start-i-konfiguracja-przy-pierwszym-uruchomieniu).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnych?">
    Uruchom instalator ponownie z **pełnym wyjściem diagnostycznym**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z pełnym wyjściem:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Odpowiednik dla Windows (PowerShell):

    ```powershell
    # install.ps1 nie ma jeszcze dedykowanej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja w Windows mówi, że nie znaleziono git lub openclaw nie jest rozpoznawany">
    Dwa częste problemy w Windows:

    **1) błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` znajduje się w PATH.
    - Zamknij i ponownie otwórz PowerShell, a następnie ponownie uruchom instalator.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Twój globalny katalog bin npm nie znajduje się w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego użytkownika PATH (w Windows nie jest potrzebny sufiks `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po aktualizacji PATH.

    Jeśli chcesz uzyskać możliwie najpłynniejszą konfigurację w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe exec w Windows pokazują zniekształcony chiński tekst — co zrobić?">
    Zwykle jest to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - dane wyjściowe `system.run`/`exec` renderują chiński tekst jako mojibake
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

    Jeśli nadal możesz odtworzyć ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackable (git)**, aby mieć lokalnie pełne źródła i dokumentację, a następnie zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł odczytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a następnie uruchom onboarding.

    - Szybka ścieżka dla Linuxa + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Każdy VPS z Linuxem działa. Zainstaluj na serwerze, a następnie użyj SSH/Tailscale, aby uzyskać dostęp do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway zdalnie](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/na VPS?">
    Utrzymujemy **centrum hostingu** z najpopularniejszymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj hosta jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na laptopie, jednocześnie trzymając
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway zdalnie](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby zaktualizował się sam?">
    Krótka odpowiedź: **to możliwe, ale niezalecane**. Proces aktualizacji może zrestartować
    Gateway (co kończy aktywną sesję), może wymagać czystego checkoutu git i
    może prosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

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

    Dokumentacja: [Aktualizacja](/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi Cię przez:

    - **Konfigurację modeli/uwierzytelniania** (OAuth dostawców, klucze API, setup-token Anthropic oraz opcje modeli lokalnych, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Plugin kanałów, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent w macOS; jednostka użytkownika systemd w Linux/WSL2)
    - **Kontrole kondycji** i wybór **Skills**

    Ostrzega także, jeśli skonfigurowany model jest nieznany lub brakuje dla niego uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw za pomocą **kluczy API** (Anthropic/OpenAI/inne) albo
    z użyciem **wyłącznie modeli lokalnych**, aby Twoje dane pozostawały na urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych dostawców.

    W praktyce dla Anthropic w OpenClaw podział wygląda tak:

    - **Klucz API Anthropic**: standardowe rozliczanie API Anthropic
    - **Uwierzytelnianie Claude CLI / subskrypcją Claude w OpenClaw**: pracownicy Anthropic
      poinformowali nas, że ten sposób użycia jest znowu dozwolony, a OpenClaw traktuje użycie `claude -p`
      jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwale działających hostów Gateway klucze API Anthropic nadal są
    bardziej przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje także inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcją Claude oraz użycie `claude -p` jako usankcjonowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że ten sposób użycia jest znowu dozwolony, więc OpenClaw traktuje
    ponowne użycie Claude CLI oraz użycie `claude -p` jako usankcjonowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Setup-token Anthropic nadal jest dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub wieloużytkownikowych uwierzytelnianie kluczem API Anthropic pozostaje
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) oraz [Modele
    GLM](/pl/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error z Anthropic?">
To oznacza, że Twój **limit/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
używasz **Claude CLI**, poczekaj na reset okna albo podnieś plan. Jeśli
używasz **klucza API Anthropic**, sprawdź konsolę Anthropic
pod kątem użycia/rozliczeń i zwiększ limity w razie potrzeby.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczanie kluczem API albo
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca ma rate limit.
    Zobacz [Modele](/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego dostawcę **Amazon Bedrock (Converse)**. Przy obecnych znacznikach środowiskowych AWS OpenClaw może automatycznie wykrywać katalog Bedrock dla streamingu/tekstu i scalać go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Onboarding może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy będzie to odpowiednie. Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego ChatGPT GPT-5.4 nie odblokowuje openai/gpt-5.4 w OpenClaw?">
    OpenClaw traktuje te dwie ścieżki osobno:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = bezpośrednie API platformy OpenAI

    W OpenClaw logowanie ChatGPT/Codex jest podłączone do ścieżki `openai-codex/*`,
    a nie do bezpośredniej ścieżki `openai/*`. Jeśli chcesz bezpośredniej ścieżki API w
    OpenClaw, ustaw `OPENAI_API_KEY` (lub równoważną konfigurację dostawcy OpenAI).
    Jeśli chcesz logowania ChatGPT/Codex w OpenClaw, użyj `openai-codex/*`.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT w przeglądarce?">
    `openai-codex/*` używa ścieżki OAuth Codex, a jej użyteczne okna limitów są
    zarządzane przez OpenAI i zależne od planu. W praktyce te limity mogą różnić się od
    doświadczenia w witrynie/aplikacji ChatGPT, nawet jeśli oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitu dostawcy w
    `openclaw models status`, ale nie tworzy ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może uruchomić dla Ciebie przepływ OAuth.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie client id ani secret w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było dostępne w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnych zabezpieczeń; małe karty obcinają i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w konkretnym regionie?">
    Wybierz endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymieniać obok nich Anthropic/OpenAI, używając `models.mode: "merge"`, aby modele zapasowe pozostawały dostępne przy jednoczesnym poszanowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuxie (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako host działający cały czas, ale mały VPS, domowy serwer lub urządzenie klasy Raspberry Pi też się sprawdzi.

    Mac jest potrzebny tylko dla **narzędzi wyłącznie macOS**. Dla iMessage używaj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie lub gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Wiadomości. To **nie** musi być Mac mini —
    dowolny Mac wystarczy. Dla iMessage **używaj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) — serwer BlueBubbles działa na macOS, a Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linuxie/VPS i serwer BlueBubbles na dowolnym Macu zalogowanym do Wiadomości.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednym komputerze.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini, aby uruchamiać OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **node** (urządzenie towarzyszące). Nodes nie uruchamiają Gateway — zapewniają dodatkowe
    możliwości, takie jak screen/camera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Macu mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo hosta node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, zwłaszcza z WhatsApp i Telegram.
    Do stabilnych gateway używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisuje się w allowFrom?">
    `channels.telegram.allowFrom` to **Telegram user ID nadawcy będącego człowiekiem** (liczbowe). To nie jest nazwa użytkownika bota.

    Onboarding akceptuje dane wejściowe `@username` i rozwiązuje je do numerycznego ID, ale autoryzacja OpenClaw używa wyłącznie numerycznych ID.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne narzędzia (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wieloagentowy**. Przypisz DM WhatsApp każdego nadawcy (**peer** `kind: "direct"`, E.164 nadawcy, np. `+15551234567`) do innego `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą pochodzić z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Routing wieloagentowy](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „szybkiego czatu” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wieloagentowego: nadaj każdemu agentowi własny model domyślny, a następnie przypisz trasy przychodzące (konto dostawcy lub konkretnych peerów) do każdego agenta. Przykładowa konfiguracja znajduje się w [Routing wieloagentowy](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linuxa (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozpoznawane w nieinteraktywnych powłokach.
    Najnowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i uwzględniają `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackable git a npm install">
    - **Instalacja hackable (git):** pełny checkout źródeł, możliwość edycji, najlepsza dla współtwórców.
      Uruchamiasz buildy lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza, gdy chcesz „po prostu to uruchomić”.
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacjami npm i git?">
    Tak. Zainstaluj drugi wariant, a następnie uruchom Doctor, aby usługa gateway wskazywała nowy entrypoint.
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

    Doctor wykrywa niedopasowanie entrypoint usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](#gdzie-rzeczy-znajdują-się-na-dysku).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniej tarcia i akceptujesz usypianie/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki na żywo.
    - **Wady:** usypianie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają pracę, komputer musi pozostać wybudzony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać działanie.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają dobrze z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecana opcja domyślna:** VPS, jeśli wcześniej występowały rozłączenia gateway. Lokalnie jest świetnie, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików lub automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanym komputerze?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw z powodu uśpienia/restartów, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie w porządku do testów i aktywnego użycia, ale spodziewaj się przerw, gdy komputer przechodzi w stan uśpienia lub się aktualizuje.

    Jeśli chcesz mieć to, co najlepsze z obu światów, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB miejsca na dysku.
    - **Zalecane:** 1–2 vCPU, 2 GB RAM lub więcej dla zapasu (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać sporo zasobów.

    System operacyjny: używaj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji dla Linuxa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki lub narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada na używanych już przez Ciebie powierzchniach komunikacyjnych (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone Plugin kanałów, takie jak QQ Bot), a na obsługiwanych platformach oferuje także głos + Canvas na żywo. **Gateway** to zawsze aktywna płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw nie jest „po prostu wrapperem dla Claude”. To **lokalna płaszczyzna sterowania local-first**, która pozwala uruchamiać
    wydajnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    trwałymi sesjami, pamięcią i narzędziami — bez oddawania kontroli nad przepływami pracy hostowanemu
    SaaS.

    Najważniejsze zalety:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i trzymaj
      lokalnie workspace + historię sesji.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage itd.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem
      i przełączaniem awaryjnym per agent.
    - **Opcja wyłącznie lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wieloagentowy:** oddzielni agenci per kanał, konto lub zadanie, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackable:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wieloagentowość](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem/-am — co powinienem/powinnam zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbudować stronę internetową (WordPress, Shopify lub prostą statyczną stronę).
    - Stworzyć prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Uporządkować pliki i foldery (czyszczenie, nazewnictwo, tagowanie).
    - Połączyć Gmail i zautomatyzować podsumowania lub follow-upy.

    Potrafi obsługiwać duże zadania, ale najlepiej działa, gdy dzielisz je na etapy i
    używasz subagentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki odbiorczej, kalendarza i interesujących Cię wiadomości.
    - **Research i tworzenie szkiców:** szybki research, podsumowania i pierwsze szkice maili lub dokumentów.
    - **Przypomnienia i follow-upy:** Cron lub Heartbeat napędzające przypomnienia i checklisty.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, w zakresie **researchu, kwalifikacji i przygotowywania szkiców**. Może skanować strony, budować shortlisty,
    podsumowywać potencjalnych klientów i pisać szkice wiadomości outreach lub tekstów reklamowych.

    W przypadku **outreachu lub uruchamiania kampanii reklamowych** zachowaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnego prawa i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to
    pozwolić OpenClaw przygotować szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy tworzeniu stron internetowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code lub Codex dla najszybszej bezpośredniej pętli programistycznej w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramy, hooki)
    - **Zawsze aktywny Gateway** (uruchamiany na VPS, interakcja z dowolnego miejsca)
    - **Nodes** dla lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez utrzymywania brudnego repozytorium?">
    Używaj zarządzanych nadpisań zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (lub dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają wyższy priorytet niż dołączone Skills bez dotykania git. Jeśli potrzebujesz Skill zainstalowanego globalnie, ale widocznego tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte wniesienia upstream powinny trafiać do repozytorium i wychodzić jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli Skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` lub `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Dziś obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawić nadpisanie `model` dla każdego zadania.
    - **Subagenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing wieloagentowy](/pl/concepts/multi-agent) oraz [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **subagentów** do długich lub równoległych zadań. Subagenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota, aby „uruchomił subagenta dla tego zadania” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i subagenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla subagentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagentów powiązane z wątkiem na Discordzie?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z subagentem lub celem sesji, aby kolejne wiadomości w tym wątku pozostawały w tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałej kontynuacji).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby sterować automatycznym odwiązywaniem.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Ustawienia domyślne globalne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Subagenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Konfiguracja referencyjna](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja ukończenia trafiła w niewłaściwe miejsce albo w ogóle nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requestera:

    - Dostarczanie completion-mode przez subagenta preferuje każdy powiązany wątek lub trasę rozmowy, jeśli taka istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji requestera (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się powieść.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca wtedy do dostarczenia przez kolejkę sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić powrót do kolejki albo ostateczne niepowodzenie dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta podrzędnego to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować wcześniejsze, nieaktualne postępy.
    - Jeśli podrzędny proces przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowych postępów zamiast odtwarzać surowe dane wyjściowe narzędzi.

    Diagnostyka:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzie sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia nie uruchamiają się. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że Cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpienia/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` względem strefy czasowej hosta).

    Diagnostyka:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać żadnej wiadomości zewnętrznej.
    - Brakujący lub nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy wynik izolowany (`NO_REPLY` / `no_reply` i nic więcej) jest traktowany jako celowo nienadający się do dostarczenia, więc runner tłumi także awaryjne dostarczanie przez kolejkę.

    Dla izolowanych zadań Cron runner odpowiada za końcowe dostarczenie. Od agenta
    oczekuje się zwrócenia podsumowania w zwykłym tekście, które runner wyśle. `--no-deliver` zachowuje
    ten wynik wewnętrznie; nie pozwala agentowi wysyłać bezpośrednio za pomocą
    message tool.

    Diagnostyka:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie Cron przełączyło modele albo ponowiło próbę raz?">
    Zwykle jest to ścieżka aktywnego przełączania modeli, a nie zduplikowane planowanie.

    Izolowany Cron może utrwalić przekazanie modelu w środowisku uruchomieniowym i ponowić próbę, gdy aktywne
    uruchomienie rzuci `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, Cron
    utrwala je również przed ponowieniem.

    Powiązane reguły wyboru:

    - Nadpisanie modelu hooka Gmail wygrywa jako pierwsze, gdy ma zastosowanie.
    - Następnie `model` per zadanie.
    - Następnie każde zapisane nadpisanie modelu sesji Cron.
    - Następnie zwykły wybór modelu agenta/domyslnego.

    Pętla ponowień jest ograniczona. Po próbie początkowej i 2 ponowieniach przełączenia
    Cron przerywa zamiast zapętlać się w nieskończoność.

    Diagnostyka:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills na Linuxie?">
    Używaj natywnych poleceń `openclaw skills` albo umieszczaj Skills w swoim workspace. Interfejs Skills UI dla macOS nie jest dostępny na Linuxie.
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

    Natywne `openclaw skills install` zapisuje do aktywnego katalogu `skills/`
    workspace. Oddzielne CLI `clawhub` instaluj tylko wtedy, gdy chcesz publikować lub
    synchronizować własne Skills. W przypadku współdzielonych instalacji między agentami umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj schedulera Gateway:

    - **Zadania Cron** do zadań zaplanowanych lub cyklicznych (trwają po restartach).
    - **Heartbeat** do okresowych kontroli „głównej sesji”.
    - **Zadania izolowane** dla autonomicznych agentów, które publikują podsumowania lub dostarczają je do czatów.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać apple macOS-only Skills z Linuxa?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane binaria, a Skills pojawiają się w system prompt tylko wtedy, gdy kwalifikują się na **hoście Gateway**. Na Linuxie Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz te ograniczenia.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a następnie łącz się z Linuxa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj node macOS (bez SSH).**
    Uruchom Gateway na Linuxie, sparuj node macOS (aplikacja paska menu) i ustaw **Node Run Commands** na „Always Ask” lub „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binaria istnieją na node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w monicie doda to polecenie do allowlisty.

    **Opcja C - pośrednicz binaria macOS przez SSH (zaawansowane).**
    Trzymaj Gateway na Linuxie, ale spraw, aby wymagane binaria CLI były rozwiązywane do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill tak, aby dopuszczał Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla binarnego pliku (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (workspace lub `~/.openclaw/skills`), aby dopuścić Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Uruchom nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion lub HeyGen?">
    Obecnie nie jako wbudowaną.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze do niezawodnego dostępu do API (zarówno Notion, jak i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na błędy.

    Jeśli chcesz utrzymywać kontekst per klient (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobierał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz prośbę o funkcję albo zbuduj Skill
    dla tych API.

    Instalowanie Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do aktywnego katalogu `skills/` w workspace. W przypadku współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują binariów instalowanych przez Homebrew; na Linuxie oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linuxie powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać istniejącej, zalogowanej przeglądarki Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz niestandardowej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka jest lokalna dla hosta. Jeśli Gateway działa gdzie indziej, uruchom hosta node na komputerze z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - działania są oparte na ref, a nie na selektorach CSS
    - upload wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i działania wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobny dokument o sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Konfigurację specyficzną dla Docker (pełny gateway w Docker albo obrazy sandbox) znajdziesz w [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby cache przetrwały.
    - Wbuduj zależności systemowe w obraz za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez dołączone CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ta ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatność DM, ale sprawić, że grupy będą publiczne/izolowane z jednym agentem?">
    Tak — jeśli Twój ruch prywatny to **DM**, a publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grupowe/kanałowe (klucze inne niż główne) działały w Docker, podczas gdy główna sesja DM pozostaje na hoście. Następnie ogranicz, jakie narzędzia są dostępne w sesjach sandboxowanych przez `tools.sandbox.tools`.

    Instrukcja konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencja kluczowej konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak powiązać folder hosta z sandboxem?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne + per agent są scalane; powiązania per agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że powiązania omijają granice systemu plików sandboxa.

    OpenClaw weryfikuje źródła bind względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego symlinkiem nadal kończą się bezpiecznym odrzuceniem nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinków.

    Przykłady i uwagi dotyczące bezpieczeństwa znajdziesz w [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Dzienne notatki w `memory/YYYY-MM-DD.md`
    - Kuratorowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia też **ciche opróżnienie pamięci przed Compaction**, aby przypomnieć modelowi,
    żeby zapisywał trwałe notatki przed automatycznym Compaction. Działa to tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu pomijają ten krok). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina. Jak sprawić, żeby coś się utrwaliło?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafiać do `MEMORY.md`,
    a krótkoterminowy kontekst do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi, aby zapisywał wspomnienia;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa tego samego
    workspace przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć jest trwała na zawsze? Jakie są ograniczenia?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Ograniczeniem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać poddane compaction albo obcięte. Dlatego
    istnieje wyszukiwanie pamięci — przywraca do kontekstu tylko istotne fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/completions i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth albo
    logowanie CLI Codex)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie dostawcy, OpenClaw automatycznie wybiera dostawcę, gdy
    potrafi rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne środowiskowe).
    Preferuje OpenAI, jeśli można rozwiązać klucz OpenAI, w przeciwnym razie Gemini, jeśli można rozwiązać klucz Gemini,
    potem Voyage, potem Mistral. Jeśli żaden zdalny klucz nie jest dostępny, wyszukiwanie pamięci
    pozostaje wyłączone do czasu jego skonfigurowania. Jeśli masz skonfigurowaną i obecną ścieżkę
    lokalnego modelu, OpenClaw
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
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Domyślnie lokalnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog Twojego workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz zakres:** używanie modeli lokalnych utrzymuje prompty na Twoim komputerze, ale ruch
      kanałów nadal przechodzi przez serwery danego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import zgodności ze starszym OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny ładunek sekretów opartych na pliku dla dostawców `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Plik zgodności ze starszym systemem (statyczne wpisy `api_key` są czyszczone) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawców (np. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia rozmów i stan (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka jednoagentowa: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (`AGENTS.md`, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (albo starszy fallback `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanałów/dostawców, profile uwierzytelniania, sesje, logi
      oraz współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowany przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, upewnij się, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa **workspace hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał je w
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i twórz kopie zapasowe
    w prywatnym miejscu (na przykład w prywatnym GitHub). Dzięki temu zachowasz pamięć + pliki AGENTS/SOUL/USER
    i później odtworzysz „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, twórz osobne kopie zapasowe zarówno workspace, jak i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz osobny przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza workspace?">
    Tak. Workspace to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że włączony jest sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandbox per agent. Jeśli chcesz, aby
    repozytorium było domyślnym katalogiem roboczym, ustaw `workspace`
    tego agenta na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
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

  <Accordion title="Tryb zdalny: gdzie znajduje się magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, interesujący Cię magazyn sesji jest na maszynie zdalnej, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki jest format konfiguracji? Gdzie ona się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używane są dość bezpieczne wartości domyślne (w tym domyślny workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem/ustawiłam gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Powiązania nie-loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie wspólnym sekretem: token albo hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym reverse proxy ze świadomością tożsamości, działającym poza loopback

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
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpiecznym odrzuceniem (brak maskującego zdalnego fallbacku).
    - Konfiguracje Control UI ze wspólnym sekretem uwierzytelniają się przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania wspólnych sekretów w URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback na tym samym hoście nadal **nie** spełniają wymagań uwierzytelniania trusted-proxy. Zaufane proxy musi być skonfigurowanym źródłem spoza loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, również dla loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie gateway przechodzi w tryb tokena i automatycznie go generuje, zapisując go w `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. To blokuje innym lokalnym procesom możliwość wywoływania Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla reverse proxy ze świadomością tożsamości spoza loopback, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może w dowolnym momencie wygenerować dla Ciebie token: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosowane na gorąco, krytyczne wymagają restartu
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

    - `off`: ukrywa tekst sloganu, ale pozostawia linię tytułu/wersji banera.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe slogany (domyślne zachowanie).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy opierający się na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest to nieoficjalna integracja oparta na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
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
              provider: "firecrawl", // opcjonalne; pomiń dla automatycznego wykrywania
            },
          },
        },
    }
    ```

    Konfiguracja wyszukiwania w sieci specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawców `tools.web.search.*` nadal są tymczasowo wczytywane dla zgodności, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja fallbacku web-fetch dla Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz allowlist, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostanie jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę fallbacku fetch na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyścił moją konfigurację. Jak ją odzyskać i jak tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Odzyskiwanie:

    - Przywróć z kopii zapasowej (git albo skopiowany `~/.openclaw/openclaw.json`).
    - Jeśli nie masz kopii zapasowej, uruchom ponownie `openclaw doctor` i ponownie skonfiguruj kanały/modele.
    - Jeśli było to nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo jakąkolwiek kopię zapasową.
    - Lokalny agent kodujący często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego unikać:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do interaktywnych edycji.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszej analizy.
    - Używaj `config.patch` do częściowych edycji przez RPC; zachowaj `config.apply` wyłącznie do pełnej wymiany konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla ownera z poziomu uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Konfiguracja](/cli/config), [Configure](/cli/configure), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze specjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **nodes** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Nodes (urządzenia):** komputery Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne „mózgi”/workspace dla wyspecjalizowanych ról (np. „Hetzner ops”, „Dane osobiste”).
    - **Sub-agenci:** uruchamiają pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing wieloagentowy](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać bez interfejsu graficznego?">
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

    Wartość domyślna to `false` (z interfejsem graficznym). Tryb bez interfejsu graficznego częściej uruchamia mechanizmy antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa przy większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (jeśli potrzebujesz obrazu, używaj zrzutów ekranu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarkę Brave (lub dowolnej przeglądarki opartej na Chromium) i uruchom ponownie Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Przeglądarka](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gateway i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegramem, gateway i nodes?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą przychodzącego ruchu dostawców; otrzymują tylko wywołania RPC node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twoim lokalnym komputerze przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na stale działającym hoście (VPS/serwer domowy).
    2. Umieść host Gateway i swój komputer w tym samym tailnet.
    3. Upewnij się, że Gateway WS jest osiągalny (bind tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; nodes łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie node macOS pozwala na `system.run` na tej maszynie. Paryj
    tylko zaufane urządzenia i zapoznaj się z [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gateway: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie sprawdź uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje allowlisty (DM albo grupa) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, na którym drugi bot
    nasłuchuje. Jeśli jeden bot działa na zdalnym VPS, skieruj swoje CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchamiany z maszyny, która może osiągnąć docelowy Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj ograniczenie ochronne, aby oba boty nie zapętliły się bez końca (tylko wzmianki, allowlisty kanałów albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI Agent](/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, z których każdy ma własny workspace, domyślne modele
    i routing. To normalna konfiguracja i jest znacznie tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj oddzielnych VPS tylko wtedy, gdy potrzebujesz twardej izolacji (granice bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie zachowaj jeden Gateway i
    używaj wielu agentów albo sub-agentów.

  </Accordion>

  <Accordion title="Czy używanie node na moim prywatnym laptopie zamiast SSH z VPS daje jakieś korzyści?">
    Tak — nodes to podstawowy sposób uzyskania dostępu do laptopa ze zdalnego Gateway i
    dają więcej niż tylko dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS lub urządzenie klasy Raspberry Pi; 4 GB RAM to aż nadto), więc częsta
    konfiguracja to stale działający host plus Twój laptop jako node.

    - **Bez przychodzącego SSH.** Nodes łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsza kontrola wykonywania.** `system.run` jest ograniczane przez allowlisty/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Zachowaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez hosta node na laptopie albo podłącz się do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku do doraźnego dostępu do powłoki, ale nodes są prostsze dla ciągłych przepływów pracy agenta i
    automatyzacji urządzenia.

    Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Na hoście powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gateway](/pl/gateway/multiple-gateways)). Nodes to urządzenia peryferyjne, które łączą
    się z gateway (nodes iOS/Android albo tryb „node mode” macOS w aplikacji paska menu). Informacje o bezgłowych
    hostach node i sterowaniu z CLI znajdziesz w [CLI hosta node](/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdza jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobiera bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); stosuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - `config.apply`: weryfikuje + zastępuje pełną konfigurację; stosuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - Narzędzie środowiska uruchomieniowego `gateway`, dostępne tylko dla ownera, nadal odmawia przepisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia Twój workspace i ogranicza, kto może wywołać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z mojego Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na swoim Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dzięki temu gateway pozostaje zbindowany do loopback i jest udostępniany przez HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć node Mac z zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Control UI + WS Gateway**. Nodes łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tym samym tailnet**.
    2. **Użyj aplikacji macOS w trybie Remote** (cel SSH może być nazwą hosta tailnet).
       Aplikacja utworzy tunel portu Gateway i połączy się jako node.
    3. **Zatwierdź node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem/powinnam instalować na drugim laptopie, czy po prostu dodać node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **node**. Pozwala to zachować jeden Gateway i unika zduplikowanej konfiguracji. Lokalne narzędzia node są
    obecnie dostępne tylko dla macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Drugi Gateway instaluj tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/cli/nodes), [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny awaryjny `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden plik `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też definiować inline zmienne środowiskowe w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w env procesu):

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

  <Accordion title="Uruchomiłem/uruchomiłam Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwie częste poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy env Twojej powłoki.
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

    To uruchamia Twoją login shell i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki w zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem/ustawiłam `COPILOT_GITHUB_TOKEN`, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` raportuje, czy **import env z powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że brakuje Twoich zmiennych środowiskowych — oznacza tylko, że OpenClaw nie będzie
    automatycznie ładować Twojej login shell.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    Twojej powłoki. Napraw to na jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosowane tylko, jeśli go brakuje).

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
    Wyślij `/new` lub `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale ta funkcja jest **domyślnie wyłączona** (wartość domyślna **0**).
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

  <Accordion title="Czy istnieje sposób na stworzenie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wieloagentowy** i **sub-agentów**. Możesz utworzyć jednego koordynującego
    agenta i kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **zabawny eksperyment**. Zużywa dużo tokenów i często
    jest mniej wydajne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    sobie wyobrażamy, to jeden bot, z którym rozmawiasz, z różnymi sesjami do pracy równoległej. Taki
    bot może też w razie potrzeby uruchamiać sub-agentów.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże dane wyjściowe narzędzi albo wiele
    plików mogą wywołać compaction albo obcięcie.

    Co pomaga:

    - Poproś bota, aby podsumował bieżący stan i zapisał go do pliku.
    - Używaj `/compact` przed długimi zadaniami i `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby go ponownie odczytał.
    - Używaj sub-agentów do długiej lub równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli to zdarza się często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale pozostawić go zainstalowanego?">
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
    - Jeśli używałeś/używałaś profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Reset dla developmentu: `openclaw gateway --dev --reset` (tylko development; czyści konfigurację deweloperską + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy „context too large” — jak zresetować lub zrobić compaction?'>
    Użyj jednej z tych opcji:

    - **Compaction** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli to się powtarza:

    - Włącz lub dostrój **pruning sesji** (`agents.defaults.contextPruning`), aby przycinać stare dane wyjściowe narzędzi.
    - Używaj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Pruning sesji](/pl/concepts/session-pruning), [Zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę „LLM request rejected: messages.content.tool_use.input field required”?'>
    To błąd walidacji dostawcy: model zwrócił blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna lub uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję za pomocą `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości Heartbeat co 30 minut?">
    Heartbeat uruchamia się domyślnie co **30 min** (**1 h** przy użyciu uwierzytelniania OAuth). Dostosuj lub wyłącz go:

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki
    Markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku nie ma, heartbeat nadal działa i model decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane do czasu zezwolenia nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** móc wywoływać odpowiedzi w grupie:

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
    Opcja 1 (najszybciej): śledź logi i wyślij wiadomość testową w grupie:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (lub `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowane/na allowlist): wylistuj grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logi](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Ograniczanie przez wzmianki jest włączone (domyślnie). Musisz oznaczyć bota przez @mention (albo dopasować `mentionPatterns`).
    - Skonfigurowałeś/-aś `channels.whatsapp.groups` bez `"*"`, a grupa nie znajduje się na allowliście.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie są domyślnie zwijane do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord to oddzielne sesje. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Brak sztywnych limitów. Dziesiątki (a nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost danych na dysku:** sesje + transkrypty znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe równoległe użycie modeli.
    - **Narzut operacyjny:** profile uwierzytelniania per agent, workspace i routing kanałów.

    Wskazówki:

    - Zachowaj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuwaj wpisy JSONL lub wpisy magazynu), jeśli zużycie dysku rośnie.
    - Używaj `openclaw doctor`, aby wykrywać osierocone workspace i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów lub czatów jednocześnie (Slack) i jak powinienem to skonfigurować?">
    Tak. Użyj **routingu wieloagentowego**, aby uruchamiać wiele odizolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peer. Slack jest obsługiwany jako kanał i może być przypisywany do określonych agentów.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co może człowiek” — mechanizmy antybotowe, CAPTCHA i MFA nadal mogą
    blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, używaj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Konfiguracja zgodna z dobrymi praktykami:

    - Host Gateway działający zawsze (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP albo node, gdy jest potrzebna.

    Dokumentacja: [Routing wieloagentowy](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: wartości domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Co to jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołuje się jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego dostawcy domyślnego jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać nieaktualny domyślny model z usuniętego dostawcy. Nadal powinieneś/powinnaś **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany model domyślny:** używaj najmocniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z narzędziami lub z niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Do rutynowego/niskiego ryzyka czatu:** używaj tańszych modeli zapasowych i kieruj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki Cię stać** do zadań wysokiej stawki, a tańszego
    modelu do rutynowego czatu lub podsumowań. Możesz kierować modele per agent i używać sub-agentów do
    równoległego wykonywania długich zadań (każdy sub-agent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Sub-agenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze/nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączać modele bez wyczyszczenia konfiguracji?">
    Używaj **poleceń modelu** albo edytuj tylko pola **modelu**. Unikaj pełnej wymiany konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że chcesz zastąpić całą konfigurację.
    W przypadku edycji RPC najpierw sprawdzaj przez `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup zawiera znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu oraz podsumowania bezpośrednich elementów podrzędnych
    dla częściowych aktualizacji.
    Jeśli nadpisałeś/-aś konfigurację, przywróć ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Configure](/cli/configure), [Konfiguracja](/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka do modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz lokalny model, na przykład `ollama pull gemma4`
    3. Jeśli chcesz też modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje Ci modele chmurowe plus Twoje lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania używaj `openclaw models list` oraz `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli mimo to chcesz małych modeli, włącz sandboxing i ścisłe allowlisty narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie środowiska uruchomieniowego na każdym gateway przez `openclaw models status`.
    - W przypadku agentów wrażliwych na bezpieczeństwo/z włączonymi narzędziami używaj najmocniejszego modelu najnowszej generacji.
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

    To są wbudowane aliasy. Niestandardowe aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić przez `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje zwięzły, numerowany selektor. Wybieraj po numerze:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (per sesja):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint dostawcy (`baseUrl`) oraz tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.2 do codziennych zadań, a Codex 5.3 do kodowania?">
    Tak. Ustaw jeden jako domyślny i przełączaj w razie potrzeby:

    - **Szybkie przełączanie (per sesja):** `/model gpt-5.4` do codziennych zadań, `/model openai-codex/gpt-5.4` do kodowania z Codex OAuth.
    - **Domyślny + przełączanie:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.4`, a potem przełączaj na `openai-codex/gpt-5.4` podczas kodowania (albo odwrotnie).
    - **Sub-agenci:** kieruj zadania kodowania do sub-agentów z innym modelem domyślnym.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować fast mode dla GPT 5.4?">
    Użyj przełącznika sesji albo ustawienia domyślnego w konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.4` albo `openai-codex/gpt-5.4`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.4"].params.fastMode` na `true`.
    - **Także dla Codex OAuth:** jeśli używasz również `openai-codex/gpt-5.4`, ustaw tam tę samą flagę.

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

    Dla OpenAI fast mode mapuje się na `service_tier = "priority"` przy obsługiwanych natywnych żądaniach Responses. Sesyjne nadpisania `/fast` mają wyższy priorytet niż wartości domyślne z konfiguracji.

    Zobacz [Thinking i fast mode](/pl/tools/thinking) oraz [OpenAI fast mode](/pl/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem nie ma odpowiedzi?'>
    Jeśli ustawione jest `agents.defaults.models`, staje się ono **allowlistą** dla `/model` i wszelkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Naprawa: dodaj model do
    `agents.defaults.models`, usuń allowlistę albo wybierz model z `/model list`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    To oznacza, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani
    profilu uwierzytelniania), więc modelu nie da się rozwiązać.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącej wersji OpenClaw (albo uruchamiaj ze źródła `main`), a następnie zrestartuj gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON) albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisane OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z rozróżnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji z kluczem API,
       albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako domyślnego** i przełączaj modele **per sesja** w razie potrzeby.
    Fallbacki są dla **błędów**, a nie dla „trudnych zadań”, więc używaj `/model` albo osobnego agenta.

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
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wieloagentowy](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

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

  <Accordion title="Jak zdefiniować/nadpisać skróty modeli (aliasy)?">
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

    Wtedy `/model sonnet` (albo `/<alias>`, gdy jest obsługiwane) rozwiązuje się do tego identyfikatora modelu.

  </Accordion>

  <Accordion title="Jak dodać modele od innych dostawców, takich jak OpenRouter lub Z.AI?">
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

    Jeśli odwołujesz się do `provider/model`, ale brakuje wymaganego klucza dostawcy, dostaniesz błąd uwierzytelniania w środowisku uruchomieniowym (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest per agent i
    jest przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie podczas działania kreatora.
    - Albo skopiuj `auth-profiles.json` z `agentDir` głównego agenta do `agentDir` nowego agenta.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Fallback modeli i „All models failed”

<AccordionGroup>
  <Accordion title="Jak działa failover?">
    Failover odbywa się dwuetapowo:

    1. **Rotacja profili uwierzytelniania** w obrębie tego samego dostawcy.
    2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Dla nieudanych profili stosowane są cooldowny (wykładniczy backoff), dzięki czemu OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca ma rate limit albo tymczasowo zawodzi.

    Koszyk rate limit obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje również komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako
    rate limit kwalifikujący się do failover.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie mają kodu `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli dostawca zwróci
    jawny tekst rozliczeniowy przy `401` albo `403`, OpenClaw nadal może trzymać to
    w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który jest ich właścicielem (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak ponawialne okno użycia albo
    limit wydatków organizacji/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje to jako
    `rate_limit`, a nie długotrwałe wyłączenie rozliczeń.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` albo `ollama error: context length
    exceeded` pozostają na ścieżce compaction/retry zamiast uruchamiać
    fallback modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „wszystko, co
    zawiera unknown/error”. OpenClaw traktuje jednak przejściowe wzorce zależne od dostawcy,
    takie jak samo `An unknown error occurred` z Anthropic, samo
    `Provider returned error` z OpenRouter, błędy z powodem zatrzymania typu `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem błędu serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, jako
    sygnały timeout/przeciążenia kwalifikujące się do failover, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst fallbacku, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam z siebie nie wywołuje fallbacku modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie znalazł dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe vs starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - W konfiguracjach wieloagentowych może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź poprawność stanu modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może znaleźć go w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz używać klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść każde przypięte uporządkowanie, które wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i się nie udało?">
    Jeśli konfiguracja modelu zawiera Google Gemini jako fallback (albo przełączyłeś/-aś się na skrót Gemini), OpenClaw spróbuje go podczas fallbacku modelu. Jeśli nie skonfigurowałeś/-aś poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: albo podaj uwierzytelnianie Google, albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback tam nie kierował.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków thinking.

    Naprawa: OpenClaw teraz usuwa niepodpisane bloki thinking dla Claude Google Antigravity. Jeśli nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth albo klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - niestandardowe identyfikatory wybrane przez Ciebie (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili i kolejność per dostawca (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli jest w krótkim **cooldownie** (rate limit, timeouty, błędy uwierzytelniania) albo w dłuższym stanie **disabled** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Strojenie: `auth.cooldowns.billingBackoffHours*`.

    Cooldowny rate limit mogą być ograniczone do modelu. Profil, który jest w cooldownie
    dla jednego modelu, może nadal nadawać się do użycia dla sąsiedniego modelu u tego samego dostawcy,
    podczas gdy okna billing/disabled nadal blokują cały profil.

    Możesz także ustawić nadpisanie kolejności **per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Domyślnie dotyczy skonfigurowanego agenta domyślnego (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Zablokuj rotację do jednego profilu (próbuj tylko tego)
    openclaw models auth order set --provider anthropic anthropic:default

    # Albo ustaw jawny porządek (fallback w obrębie dostawcy)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść nadpisanie (powrót do config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby zweryfikować, co faktycznie będzie próbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnym porządku, probe raportuje
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth vs klucz API — jaka jest różnica?">
    OpenClaw obsługuje oba warianty:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma zastosowanie).
    - **Klucze API** używają rozliczania za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth oraz klucze API.

  </Accordion>
</AccordionGroup>

## Gateway: porty, „already running” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > domyślnie 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego `openclaw gateway status` pokazuje „Runtime: running”, ale „RPC probe: failed”?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda RPC to CLI, które faktycznie łączy się z gateway WebSocket i wywołuje `status`.

    Użyj `openclaw gateway status` i ufaj tym liniom:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co jest faktycznie zbindowane na porcie)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces działa, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego `openclaw gateway status` pokazuje różne „Config (cli)” i „Config (service)”?'>
    Edytujesz jeden plik konfiguracyjny, podczas gdy usługa działa na innym (często chodzi o niedopasowanie `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego usługa ma używać.

  </Accordion>

  <Accordion title='Co oznacza „another gateway instance is already listening”?'>
    OpenClaw wymusza blokadę środowiska uruchomieniowego przez natychmiastowe zbindowanie listenera WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli bind zwróci błąd `EADDRINUSE`, rzucany jest `GatewayLockError`, wskazujący, że inna instancja już nasłuchuje.

    Naprawa: zatrzymaj drugą instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny URL WebSocket, opcjonalnie ze zdalnymi poświadczeniami wspólnego sekretu:

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

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracyjny i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to tylko zdalne poświadczenia po stronie klienta; same z siebie nie włączają lokalnego uwierzytelniania gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje „unauthorized” (albo ciągle się przełącza ponownie). Co teraz?'>
    Ścieżka uwierzytelniania Twojego gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego URL gateway, więc odświeżenia tej samej karty nadal działają bez przywracania trwałego przechowywania tokena w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą wykonać jedną ograniczoną ponowną próbę z użyciem zbuforowanego tokena urządzenia, gdy gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z użyciem zbuforowanego tokena wykorzystuje teraz ponownie zbuforowane zatwierdzone zakresy przechowywane z tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zakresy z pamięci podręcznej.
    - Poza tą ścieżką ponowienia priorytet uwierzytelniania połączenia wygląda następująco: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - Kontrole zakresu tokena bootstrap mają prefiksy ról. Wbudowana allowlista operatora bootstrap spełnia tylko żądania operatora; node lub inne role niebędące operatorem nadal wymagają zakresów pod własnym prefiksem roli.

    Naprawa:

    - Najszybciej: `openclaw dashboard` (wypisuje + kopiuje URL dashboardu, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bez interfejsu graficznego).
    - Jeśli nie masz jeszcze tokena: `openclaw doctor --generate-gateway-token`.
    - Jeśli zdalnie, najpierw utwórz tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`.
    - Tryb wspólnego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i że otwierasz URL Serve, a nie surowy URL loopback/tailnet omijający nagłówki tożsamości Tailscale.
    - Tryb trusted-proxy: upewnij się, że ruch przechodzi przez skonfigurowane proxy ze świadomością tożsamości spoza loopback, a nie przez proxy loopback na tym samym hoście ani surowy URL gateway.
    - Jeśli niedopasowanie utrzymuje się po jednej próbie ponowienia, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli to polecenie rotate mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą wykraczać poza bieżące zakresy operatora wywołującego
    - Nadal utknąłeś/utknęłaś? Uruchom `openclaw status --all` i postępuj zgodnie z [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem/ustawiłam gateway.bind tailnet, ale nie może się zbindować i nic nie nasłuchuje">
    Bind `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs nie działa), nie ma do czego się zbindować.

    Naprawa:

    - Uruchom Tailscale na tym hoście (tak aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz bind tylko do tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchomić wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może obsługiwać wiele kanałów komunikacyjnych i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. rescue bot) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Używaj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalny `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` dla uruchomień ręcznych).
    - Zainstaluj usługę per profil: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza „invalid handshake” / kod 1008?'>
    Gateway jest **serwerem WebSocket** i oczekuje, że pierwsza wiadomość będzie
    ramką `connect`. Jeśli otrzyma coś innego, zamyka połączenie
    kodem **1008** (naruszenie zasad).

    Typowe przyczyny:

    - Otworzyłeś/-aś adres **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyto niewłaściwego portu lub ścieżki.
    - Proxy lub tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie niebędące żądaniem Gateway.

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

## Rejestrowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stałą ścieżkę przez `logging.file`. Poziom logów plikowych jest sterowany przez `logging.level`. Szczegółowość konsoli jest sterowana przez `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logu:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/zrestartować usługę Gateway?">
    Użyj pomocniczych poleceń gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może przejąć port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem/zamknęłam terminal w Windows — jak zrestartować OpenClaw?">
    Istnieją **dwa tryby instalacji w Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linuxa.

    Otwórz PowerShell, wejdź do WSL, a następnie zrestartuj:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli nigdy nie instalowałeś/-aś usługi, uruchom ją na pierwszym planie:

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
    Zacznij od szybkiego przeglądu kondycji:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście gateway** (sprawdź `models status`).
    - Parowanie kanału/allowlista blokuje odpowiedzi (sprawdź konfigurację kanału + logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokena.

    Jeśli działasz zdalnie, potwierdź, że tunel/połączenie Tailscale działa i że
    Gateway WebSocket jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — co teraz?'>
    Zwykle oznacza to, że UI utracił połączenie WebSocket. Sprawdź:

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
    Zacznij od logów i statusu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre wpisy menu nadal trzeba usunąć. Ogranicz polecenia Plugin/Skill/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` albo podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, potwierdź, że wychodzące HTTPS jest dozwolone i DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że sprawdzasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnych danych wyjściowych. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale
    czatu, upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/web/tui), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowałeś/-aś usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd w macOS, systemd w Linuxie).
    Używaj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz w pierwszym planie, zatrzymaj przez Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: restartuje **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **w pierwszym planie** dla tej sesji terminala.

    Jeśli masz zainstalowaną usługę, używaj poleceń gateway. Używaj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia w pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób, aby uzyskać więcej szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Mój Skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Wychodzące załączniki od agenta muszą zawierać linię `MEDIA:<path-or-url>` (w osobnej linii). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Kanał docelowy obsługuje wysyłanie multimediów i nie jest blokowany przez allowlisty.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są zmniejszane maksymalnie do 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie ścieżek lokalnych do workspace, temp/media-store i plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki przypominające sekrety są nadal blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy bezpiecznie jest wystawić OpenClaw na przychodzące DM?">
    Traktuj przychodzące DM jako niezaufane dane wejściowe. Wartości domyślne są zaprojektowane tak, aby zmniejszać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **pairing**:
      - Nieznani nadawcy otrzymują kod pairing; bot nie przetwarza ich wiadomości.
      - Zatwierdź przez: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące żądania są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnego opt-in (`dmPolicy: "open"` i allowlista `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection to problem tylko dla publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysłać DM do bota.
    Jeśli Twój asystent odczytuje zewnętrzne treści (web search/fetch, strony w przeglądarce, e-maile,
    dokumenty, załączniki, wklejone logi), ta treść może zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć, nawet jeśli **Ty jesteś jedynym nadawcą**.

    Największe ryzyko pojawia się wtedy, gdy włączone są narzędzia: model może zostać nakłoniony do
    wyprowadzania kontekstu albo wywoływania narzędzi w Twoim imieniu. Ogranicz promień rażenia przez:

    - używanie agenta „czytelnika” tylko do odczytu lub z wyłączonymi narzędziami do podsumowywania niezaufanych treści
    - utrzymywanie `web_search` / `web_fetch` / `browser` wyłączonych dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu plików/dokumentów również jako niezaufanego: OpenResponses
      `input_file` oraz ekstrakcja z załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granic treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe allowlisty narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub lub numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota za pomocą osobnych kont i numerów telefonów
    zmniejsza promień rażenia, jeśli coś pójdzie nie tak. Ułatwia to też rotację
    poświadczeń lub cofnięcie dostępu bez wpływu na Twoje osobiste konta.

    Zacznij od małej skali. Daj dostęp tylko do narzędzi i kont, których naprawdę potrzebujesz, i rozszerzaj
    później, jeśli będzie to wymagane.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Pairing](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi osobistymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Trzymaj DM w **trybie pairing** albo na ścisłej allowliście.
    - Używaj **oddzielnego numeru lub konta**, jeśli chcesz, aby wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować szkic, a potem **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i zachowaj izolację. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent służy tylko do czatu, a dane wejściowe są zaufane. Mniejsze poziomy są
    bardziej podatne na przejmowanie instrukcji, więc unikaj ich dla agentów z włączonymi narzędziami
    albo przy odczytywaniu niezaufanych treści. Jeśli musisz używać mniejszego modelu, zablokuj
    narzędzia i uruchamiaj wewnątrz sandboxa. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem/uruchomiłam /start w Telegramie, ale nie dostałem/-am kodu pairing">
    Kody pairing są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    `dmPolicy: "pairing"` jest włączone. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące żądania:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj swój sender id do allowlisty albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisał do moich kontaktów? Jak działa pairing?">
    Nie. Domyślna zasada DM WhatsApp to **pairing**. Nieznani nadawcy dostają tylko kod pairing, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które sam wywołasz.

    Zatwierdzanie pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista oczekujących żądań:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **allowlisty/ownera**, aby Twoje własne DM były dozwolone. Nie służy do automatycznego wysyłania. Jeśli uruchamiasz na własnym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „to nie chce się zatrzymać”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych lub narzędziowych pojawia się tylko wtedy, gdy dla tej sesji włączone są **verbose**, **trace** lub **reasoning**.

    Napraw to na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt głośno, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z ustawionym `verboseDefault`
    na `on` w konfiguracji.

    Dokumentacja: [Thinking i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
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

    To są wyzwalacze przerwania (nie polecenia slash).

    Dla procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Przegląd poleceń slash: zobacz [Polecenia slash](/pl/tools/slash-commands).

    Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (jak `/status`) działa także inline dla nadawców z allowlisty.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegrama? („Cross-context messaging denied”)'>
    OpenClaw domyślnie blokuje wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegramem, nie wyśle na Discord, chyba że jawnie na to zezwolisz.

    Włącz wiadomości między dostawcami dla agenta:

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

    Po edycji konfiguracji zrestartuj gateway.

  </Accordion>

  <Accordion title='Dlaczego wygląda to tak, jakby bot „ignorował” wiadomości wysyłane jedna po drugiej?'>
    Tryb kolejki kontroluje, jak nowe wiadomości wchodzą w interakcję z trwającym uruchomieniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - nowe wiadomości przekierowują bieżące zadanie
    - `followup` - uruchamia wiadomości jedna po drugiej
    - `collect` - grupuje wiadomości i odpowiada raz (domyślnie)
    - `steer-backlog` - przekierowuje teraz, potem przetwarza backlog
    - `interrupt` - przerywa bieżące uruchomienie i zaczyna od nowa

    Możesz dodać opcje takie jak `debounce:2s cap:25 drop:summarize` dla trybów followup.

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są od siebie oddzielone. Ustawienie `ANTHROPIC_API_KEY` (albo zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale faktyczny model domyślny to ten, który skonfigurujesz w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym `auth-profiles.json` dla uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal utknąłeś/utknęłaś? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHubie](https://github.com/openclaw/openclaw/discussions).
