---
read_when:
    - Nowa instalacja, zablokowany proces wdrażania lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-05-02T09:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  Szybki start oraz pytania i odpowiedzi dotyczące pierwszego uruchomienia. Informacje o codziennych operacjach, modelach, uwierzytelnianiu, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja pierwszego uruchomienia

  <AccordionGroup>
  <Accordion title="Utknąłem, najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć twój komputer**. To znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**, których
    osoby pomagające zdalnie nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Daj im **pełną kopię roboczą źródeł** przez
    instalację modyfikowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, więc agent może czytać kod i dokumentację oraz
    wnioskować na podstawie dokładnej wersji, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, utwórz zgłoszenie GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, prosząc o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybki podgląd stanu Gateway/agenta i podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy i dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne sprawdzenia CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat jest ciągle pomijany. Co oznaczają powody pominięcia?">
    Typowe powody pomijania Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko puste rusztowanie albo same nagłówki
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań nie jest jeszcze wymagalny
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po ukończeniu
    rzeczywistego uruchomienia Heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może także automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (kontrybutorzy/deweloperzy):

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

  <Accordion title="Jak otworzyć panel po onboardingu?">
    Kreator otwiera przeglądarkę z czystym adresem URL panelu (bez tokenu) zaraz po onboardingu, a także wypisuje link w podsumowaniu. Zostaw tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić panel na localhost i zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token albo hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (albo `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli nie skonfigurowano jeszcze współdzielonego sekretu, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Poza localhostem:**

    - **Tailscale Serve** (zalecane): zachowaj bindowanie loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają uwierzytelnianie Control UI/WebSocket (bez wklejania współdzielonego sekretu, zakłada zaufany host Gateway); interfejsy API HTTP nadal wymagają uwierzytelniania współdzielonym sekretem, chyba że celowo używasz prywatnego ingressu `none` albo uwierzytelniania HTTP przez trusted-proxy.
      Nieudane równoczesne próby uwierzytelnienia Serve od tego samego klienta są serializowane, zanim limiter nieudanych uwierzytelnień je zapisze, więc druga nieudana ponowna próba może już pokazać `retry later`.
    - **Bindowanie Tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a potem wklej pasujący współdzielony sekret w ustawieniach panelu.
    - **Reverse proxy świadomy tożsamości**: trzymaj Gateway za zaufanym proxy, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a potem otwórz URL proxy. Proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; jeśli pojawi się monit, wklej skonfigurowany token albo hasło.

    Zobacz [Panel](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać tryby bindowania i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego istnieją dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje monity zatwierdzania do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Polityka exec hosta nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko to, gdzie
    pojawiają się monity zatwierdzania i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez wspólną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw automatycznie włącza teraz natywne zatwierdzenia najpierw przez DM, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ten natywny UI jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    - Używaj `approvals.exec` tylko wtedy, gdy monity muszą być także przekazywane do innych czatów albo jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy wyraźnie chcesz, aby monity zatwierdzania były publikowane z powrotem w pierwotnym pokoju/temacie.
    - Zatwierdzenia pluginów są znowu oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową obsługę natywnych zatwierdzeń pluginów.

    Krótko: przekazywanie służy do routingu, a konfiguracja klienta natywnego do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki - dokumentacja podaje, że **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku wystarczają do użytku osobistego, oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć dodatkowy zapas (logi, media, inne usługi), **zalecane jest 2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a na laptopie/telefonie możesz sparować **węzły** dla
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się niedociągnięć.

    - Użyj **64-bitowego** systemu operacyjnego i zachowaj Node >= 22.
    - Preferuj **instalację modyfikowalną (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je pojedynczo.
    - Jeśli trafisz na dziwne problemy z binariami, zwykle jest to problem ze **zgodnością z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na obudź się, mój przyjacielu / onboarding się nie wykluwa. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Obudź się, mój przyjacielu!” automatycznie przy pierwszym wykluciu. Jeśli widzisz ten wiersz **bez odpowiedzi**,
    a tokeny pozostają na 0, agent nigdy się nie uruchomił.

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

    3. Jeśli nadal wisi, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść moją konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **obszar roboczy**, a potem uruchom Doctor raz. To
    zachowuje twojego bota „dokładnie takiego samego” (pamięć, historię sesji, uwierzytelnianie i stan kanałów),
    o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój obszar roboczy (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, poświadczenia WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host Gateway jest właścicielem magazynu sesji i obszaru roboczego.

    **Ważne:** jeśli tylko commitujesz/pushujesz swój obszar roboczy do GitHub, tworzysz kopię zapasową
    **pamięci i plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#where-things-live-on-disk),
    [Obszar roboczy agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie sprawdzić, co jest nowe w najnowszej wersji?">
    Sprawdź dziennik zmian GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Nieopublikowane**, następna datowana
    sekcja jest najnowszą wydaną wersją. Wpisy są pogrupowane według **Najważniejszych zmian**, **Zmian** i
    **Poprawek** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz otworzyć witryny, dokumentacja ma kopię lustrzaną na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable i beta">
    **Stable** i **beta** to **znaczniki dystrybucyjne npm**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable trafia najpierw na **beta**, a następnie osobny krok
    promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się beta od dev?">
    **Beta** to znacznik dystrybucyjny npm `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma głowica `main` (git); po opublikowaniu używa znacznika dystrybucyjnego npm `dev`.

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

    Jeśli proces się zawiesza, skorzystaj z [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnej?">
    Uruchom instalator ponownie z **pełniejszym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z pełniejszym wyjściem:

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
    Dwa częste problemy w Windows:

    **1) Błąd npm spawn git / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem uruchom instalator ponownie.

    **2) openclaw nie jest rozpoznawany po instalacji**

    - Globalny folder bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego użytkownika PATH (w Windows nie jest potrzebny sufiks `\bin`; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz najpłynniejszej konfiguracji w Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec w Windows pokazuje zniekształcony chiński tekst - co zrobić?">
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

    Jeśli nadal odtwarzasz to w najnowszym OpenClaw, śledź/zgłoś to tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji do modyfikacji (git)**, aby mieć pełne źródła i dokumentację lokalnie, a następnie zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł przeczytać repozytorium i odpowiedzieć precyzyjnie.

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
    Działa dowolny VPS z Linux. Zainstaluj na serwerze, a potem użyj SSH/Tailscale, aby dotrzeć do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Utrzymujemy **centrum hostingu** z popularnymi dostawcami. Wybierz jednego i postępuj według przewodnika:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (lub Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i rób jego kopie zapasowe.

    Możesz sparować **węzły** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp
    do lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na laptopie, trzymając
    Gateway w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny Gateway](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, aby zaktualizował się sam?">
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

    Jeśli musisz automatyzować z agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza Cię przez:

    - **Konfigurację modelu/uwierzytelniania** (OAuth dostawcy, klucze API, setup-token Anthropic oraz opcje modeli lokalnych, takie jak LM Studio)
    - lokalizację **workspace** + pliki startowe
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Pluginy kanałów, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole stanu** i wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje mu uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchomić OpenClaw z **kluczami API** (Anthropic/OpenAI/inne) albo z
    **modelami wyłącznie lokalnymi**, aby dane pozostawały na Twoim urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych dostawców.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczenia Anthropic API
    - **Uwierzytelnianie Claude CLI / subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwałych hostów gateway klucze API Anthropic nadal są bardziej
    przewidywalną konfiguracją. OpenAI Codex OAuth jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcji, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
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
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token jest nadal dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    W przypadku obciążeń produkcyjnych lub wieloużytkownikowych uwierzytelnianie kluczem API Anthropic nadal jest
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych
    opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    To oznacza, że Twój **limit przydziału/częstotliwości Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na reset okna albo podnieś plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety kontekstu 1M Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczeń długiego kontekstu (rozliczenia klucza API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł dalej odpowiadać, gdy dostawca ma ograniczoną przepustowość.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiskowe AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla strumieniowania/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) oraz [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ klucza, proxy zgodne z OpenAI przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai/gpt-5.5` z `agentRuntime.id: "codex"` w typowej konfiguracji:
    uwierzytelnianie subskrypcją ChatGPT/Codex oraz natywne wykonywanie na serwerze aplikacji Codex. Użyj
    `openai-codex/gpt-5.5` tylko wtedy, gdy chcesz OAuth Codex przez domyślny
    runner PI. Użyj `openai/gpt-5.5` bez nadpisania środowiska uruchomieniowego Codex dla
    bezpośredniego dostępu kluczem API OpenAI.
    Zobacz [Dostawcy modeli](/pl/concepts/model-providers) oraz [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator dostawcy i profilu uwierzytelniania dla OAuth ChatGPT/Codex.
    Jest to także jawny prefiks modelu PI dla OAuth Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = uwierzytelnianie subskrypcją ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex
    - `openai-codex/gpt-5.5` = trasa OAuth Codex w PI
    - `openai/gpt-5.5` bez nadpisania środowiska uruchomieniowego Codex = bezpośrednia trasa klucza API OpenAI w PI
    - `openai-codex:...` = identyfikator profilu uwierzytelniania, nie odwołanie do modelu

    Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz uwierzytelnianie subskrypcją ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex`. Dla natywnego
    środowiska uruchomieniowego Codex pozostaw odwołanie do modelu jako `openai/gpt-5.5` i ustaw
    `agentRuntime.id: "codex"`. Używaj odwołań do modeli `openai-codex/*` tylko dla uruchomień PI.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT w przeglądarce?">
    OAuth Codex używa zarządzanych przez OpenAI, zależnych od planu okien limitów. W praktyce
    te limity mogą różnić się od doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie tworzy ani nie normalizuje uprawnień ChatGPT w przeglądarce
    do bezpośredniego dostępu API. Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform, użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (OAuth Codex)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI wyraźnie zezwala na użycie OAuth subskrypcji w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) oraz [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować OAuth Gemini CLI?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj Gemini CLI lokalnie, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście Gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnych zabezpieczeń; małe karty obcinają dane i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/skwantyzowane modele zwiększają ryzyko prompt injection - zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch modeli hostowanych w określonym regionie?">
    Wybierz punkty końcowe przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wyświetlać Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, dzięki czemu modele zapasowe pozostają dostępne z poszanowaniem wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, aby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linux (Windows przez WSL2). Mac mini jest opcjonalny - niektórzy
    kupują go jako stale włączony host, ale mały VPS, serwer domowy albo komputer klasy Raspberry Pi też się sprawdzi.

    Maca potrzebujesz tylko **do narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) - serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie lub gdzie indziej. Jeśli chcesz innych narzędzi dostępnych tylko na macOS, uruchom Gateway na Macu albo sparuj węzeł macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Maca mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia z macOS** zalogowanego do Messages. Nie musi to być Mac mini -
    dowolny Mac wystarczy. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage - serwer BlueBubbles działa na macOS, a Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS i uruchom serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszej konfiguracji na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Węzły](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Maca mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **węzeł** (urządzenie towarzyszące). Węzły nie uruchamiają Gateway - zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/canvas oraz `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Macu mini (stale włączony).
    - MacBook Pro uruchamia aplikację macOS albo host węzła i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Obserwujemy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Używaj **Node** do stabilnych Gateway.

    Jeśli nadal chcesz eksperymentować z Bun, rób to na nieprodukcyjnym Gateway
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
    Tak, przez **routing wielu agentów**. Powiąż DM każdej osoby w WhatsApp (peer `kind: "direct"`, nadawca E.164, np. `+15551234567`) z innym `agentId`, aby każda osoba miała własny obszar roboczy i magazyn sesji. Odpowiedzi nadal pochodzą z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta do "szybkiego czatu" i agenta "Opus do kodowania"?'>
    Tak. Użyj routingu wielu agentów: nadaj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto dostawcy lub określonych peerów) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routingu wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa w systemie Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozpoznawane w powłokach nielogowania.
    Najnowsze buildy dodają też na początku typowe katalogi bin użytkownika w usługach systemd na Linuksie (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między hakowalną instalacją z git a instalacją npm">
    - **Hakowalna instalacja (git):** pełny checkout źródeł, edytowalny, najlepszy dla kontrybutorów.
      Buildy uruchamiasz lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza, gdy chcesz "po prostu uruchomić".
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm i git?">
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
    działania następcze Doctor, odświeża źródła Pluginów dla kanału docelowego i
    restartuje Gateway, chyba że przekażesz `--no-restart`.

    Instalator również może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia tworzenia kopii zapasowych](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli zależy Ci na
    najniższym progu wejścia i akceptujesz uśpienie/restartowanie, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztu serwera, bezpośredni dostęp do plików lokalnych, aktywne okno przeglądarki.
    - **Wady:** uśpienie/spadki sieci = rozłączenia, aktualizacje/restart systemu przerywają działanie, musi pozostawać wybudzony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiejsze utrzymanie działania.
    - **Wady:** często działa bez interfejsu graficznego (używaj zrzutów ekranu), tylko zdalny dostęp do plików, do aktualizacji musisz używać SSH.

    **Uwaga dotycząca OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bez interfejsu graficznego** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej występowały rozłączenia Gateway. Lokalnie sprawdza się świetnie, gdy aktywnie używasz Maca i chcesz mieć lokalny dostęp do plików lub automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="How important is it to run OpenClaw on a dedicated machine?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw spowodowanych uśpieniem lub ponownym uruchomieniem, czystsze uprawnienia, łatwiejsze utrzymanie działania.
    - **Współdzielony laptop/komputer stacjonarny:** całkowicie wystarczający do testowania i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna przechodzi w stan uśpienia lub się aktualizuje.

    Jeśli chcesz uzyskać najlepsze z obu rozwiązań, utrzymuj Gateway na dedykowanym hoście i sparuj laptopa jako **węzeł** dla lokalnych narzędzi ekranu/kamery/wykonywania poleceń. Zobacz [Węzły](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="What are the minimum VPS requirements and recommended OS?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, około 500 MB dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej dla zapasu (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą wymagać większych zasobów.

    OS: użyj **Ubuntu LTS** (lub dowolnego nowoczesnego Debiana/Ubuntu). Ścieżka instalacji dla Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Can I run OpenClaw in a VM and what are the requirements?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    RAM dla Gateway oraz wszystkich kanałów, które włączysz.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **OS:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najprostsza konfiguracja w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
