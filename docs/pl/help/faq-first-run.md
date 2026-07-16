---
read_when:
    - Nowa instalacja, zablokowane wdrażanie lub błędy przy pierwszym uruchomieniu
    - Wybór uwierzytelniania i subskrypcji dostawców
    - Brak dostępu do docs.openclaw.ai, nie można otworzyć panelu, instalacja się zawiesiła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, wdrożenie, uwierzytelnianie, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-07-16T18:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

Szybki start oraz pytania i odpowiedzi dotyczące pierwszego uruchomienia. Informacje o codziennej obsłudze, modelach, uwierzytelnianiu, sesjach
i rozwiązywaniu problemów znajdują się w głównej sekcji [FAQ](/pl/help/faq).

## Szybki start i konfiguracja pierwszego uruchomienia

<AccordionGroup>
  <Accordion title="Nie mogę ruszyć dalej — najszybszy sposób rozwiązania problemu">
    Należy użyć lokalnego agenta AI, który **widzi maszynę**. Większość przypadków „nie mogę ruszyć dalej”
    wynika z **lokalnej konfiguracji lub problemów ze środowiskiem**, których zdalna osoba pomagająca nie może sprawdzić,
    dlatego jest to lepsze rozwiązanie niż pytanie na Discordzie.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Należy udostępnić agentowi pełną kopię kodu źródłowego za pomocą instalacji umożliwiającej modyfikacje (git), aby mógł odczytać
    kod i dokumentację oraz przeanalizować dokładnie używaną wersję:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Należy poprosić agenta o zaplanowanie i nadzorowanie naprawy krok po kroku, a następnie wykonanie wyłącznie
    niezbędnych poleceń — mniejsze różnice łatwiej skontrolować.

    Prosząc o pomoc (na Discordzie lub w zgłoszeniu GitHub), należy udostępnić wyniki tych poleceń:

    | Polecenie | Wyświetlane informacje |
    | --- | --- |
    | `openclaw status` | Stan Gateway/agenta i podstawowy przegląd konfiguracji |
    | `openclaw status --all` | Pełna diagnostyka tylko do odczytu, gotowa do wklejenia |
    | `openclaw models status` | Uwierzytelnianie dostawcy i dostępność modeli |
    | `openclaw doctor` | Sprawdza i naprawia typowe problemy z konfiguracją lub stanem |
    | `openclaw logs --follow` | Bieżący podgląd dziennika |
    | `openclaw gateway status --deep` | Szczegółowa kontrola stanu Gateway, konfiguracji i pluginów |
    | `openclaw health --verbose` | Szczegółowy raport o stanie |

    Znaleziono rzeczywisty błąd lub rozwiązanie? Należy utworzyć zgłoszenie albo wysłać PR:
    [Zgłoszenia](https://github.com/openclaw/openclaw/issues) /
    [Pull requesty](https://github.com/openclaw/openclaw/pulls).

    Szybka pętla debugowania: [Pierwsze 60 sekund po wystąpieniu awarii](/pl/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat jest ciągle pomijany. Co oznaczają przyczyny pominięcia?">
    | Przyczyna pominięcia | Znaczenie |
    | --- | --- |
    | `quiet-hours` | Poza skonfigurowanym przedziałem aktywnych godzin |
    | `empty-heartbeat-file` | `HEARTBEAT.md` istnieje, ale zawiera jedynie pusty tekst, komentarz, nagłówek, ogrodzenie lub szkielet pustej listy kontrolnej |
    | `no-tasks-due` | Tryb zadania jest aktywny, ale nie nadszedł jeszcze termin żadnego interwału zadania |
    | `alerts-disabled` | Cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone) |

    W trybie zadania znaczniki czasu terminów są przesuwane dopiero po zakończeniu rzeczywistego uruchomienia Heartbeat.
    Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Ze źródeł (dla współtwórców/programistów):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Brak jeszcze instalacji globalnej? Zamiast tego należy uruchomić `pnpm openclaw onboard`. Jeśli brakuje zasobów Control UI,
    proces wdrażania próbuje zbudować je samodzielnie, a w razie niepowodzenia używa `pnpm ui:build`.

  </Accordion>

  <Accordion title="Jak otworzyć panel po wdrożeniu?">
    Bezpośrednio po konfiguracji proces wdrażania otwiera w przeglądarce czysty (bez tokenu) adres URL panelu
    i wyświetla łącze w podsumowaniu. Należy pozostawić tę kartę otwartą. Jeśli nie została uruchomiona,
    należy skopiować i wkleić wyświetlony adres URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić panel na hoście lokalnym, a jak zdalnie?">
    **Host lokalny (ta sama maszyna):**

    - Otworzyć `http://127.0.0.1:18789/`.
    - Jeśli pojawi się prośba o uwierzytelnienie za pomocą współdzielonego sekretu, wkleić skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Nie skonfigurowano jeszcze współdzielonego sekretu? Uruchomić `openclaw doctor --generate-gateway-token` (lub `openclaw doctor --fix --generate-gateway-token`).

    **Poza hostem lokalnym:**

    - **Tailscale Serve** (zalecane): pozostawić powiązanie z interfejsem pętli zwrotnej, uruchomić `openclaw gateway --tailscale serve`, a następnie otworzyć `https://<magicdns>/`. Przy `gateway.auth.allowTailscale: true` nagłówki tożsamości spełniają wymagania uwierzytelniania Control UI/WebSocket (bez wklejania współdzielonego sekretu; zakłada zaufany host Gateway); interfejsy API HTTP nadal wymagają uwierzytelniania za pomocą współdzielonego sekretu, chyba że celowo użyto prywatnego wejścia `none` lub uwierzytelniania HTTP przez zaufany serwer proxy.
      Równoczesne próby Serve z błędnym uwierzytelnieniem pochodzące od tego samego klienta są serializowane, zanim ogranicznik nieudanych uwierzytelnień je zarejestruje, dlatego już druga błędna próba może wyświetlić `retry later`.
    - **Powiązanie z tailnetem**: uruchomić `openclaw gateway --bind tailnet --token "<token>"` (lub skonfigurować uwierzytelnianie hasłem), otworzyć `http://<tailscale-ip>:18789/`, a następnie wkleić odpowiedni współdzielony sekret w ustawieniach panelu.
    - **Serwer reverse proxy rozpoznający tożsamość**: pozostawić Gateway za zaufanym serwerem proxy, ustawić `gateway.auth.mode: "trusted-proxy"`, a następnie otworzyć adres URL serwera proxy. Serwery proxy pętli zwrotnej na tym samym hoście wymagają jawnego ustawienia `gateway.auth.trustedProxy.allowLoopback: true`.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, a następnie otworzyć `http://127.0.0.1:18789/`. Uwierzytelnianie za pomocą współdzielonego sekretu nadal obowiązuje w tunelu; po wyświetleniu monitu należy wkleić skonfigurowany token lub hasło.

    Tryby powiązania i szczegóły uwierzytelniania opisano w sekcjach [Panel](/pl/web/dashboard) i [Interfejsy internetowe](/pl/web).

  </Accordion>

  <Accordion title="Dlaczego istnieją dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec` — przekazuje monity o zatwierdzenie do miejsc docelowych czatu.
    - `channels.<channel>.execApprovals` — przekształca ten kanał w natywnego klienta zatwierdzeń dla operacji exec.

    Zasady exec hosta pozostają właściwą bramą zatwierdzeń; konfiguracja czatu kontroluje jedynie, gdzie
    pojawiają się monity i jak użytkownicy na nie odpowiadają.

    Rzadko potrzebne są obie konfiguracje:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` na tym samym czacie działa przez wspólną ścieżkę.
    - Gdy obsługiwany kanał natywny może bezpiecznie ustalić osoby zatwierdzające, OpenClaw automatycznie włącza natywne zatwierdzenia z pierwszeństwem wiadomości prywatnych, jeśli `channels.<channel>.execApprovals.enabled` nie jest ustawione lub ma wartość `"auto"`.
    - Gdy dostępne są natywne karty lub przyciski zatwierdzania, ten interfejs jest podstawowy; ręczne polecenie `/approve` należy wymienić tylko wtedy, gdy wynik narzędzia wskazuje, że zatwierdzenia na czacie są niedostępne.
    - Używać `approvals.exec` tylko wtedy, gdy monity muszą również docierać do innych czatów lub wskazanych pokojów operacyjnych.
    - Używać `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy monity o zatwierdzenie mają być publikowane z powrotem w pokoju lub temacie źródłowym.
    - Zatwierdzenia pluginów są oddzielne: domyślnie `/approve` na tym samym czacie, opcjonalne przekazywanie przez `approvals.plugin`, a tylko niektóre kanały natywne zachowują także ich natywną obsługę.

    W skrócie: przekazywanie służy do routingu, a konfiguracja klienta natywnego zapewnia bogatszy interfejs właściwy dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **22.22.3+**, **24.15+** lub **25.9+** (zalecany Node 24). `pnpm` jest menedżerem pakietów repozytorium.
    Bun może instalować zależności i uruchamiać skrypty pakietów, ale nie może uruchamiać CLI ani Gateway OpenClaw, ponieważ nie obsługuje `node:sqlite`.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak, ale najpierw należy sprawdzić pamięć RAM: optymalne są Pi 5 i Pi 4 (2 GB+); Pi 3B+ (1 GB) działa, ale wolno; Pi Zero 2 W (512 MB) nie jest zalecany.

    | Model | RAM | Przydatność |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Najlepsza |
    | Pi 4 | 4 GB | Dobra |
    | Pi 4 | 2 GB | W porządku, należy dodać pamięć wymiany |
    | Pi 4 | 1 GB | Na granicy |
    | Pi 3B+ | 1 GB | Wolna praca |
    | Pi Zero 2 W | 512 MB | Niezalecany |

    Bezwzględne minimum: 1 GB RAM, 1 rdzeń, 500 MB wolnego miejsca na dysku, 64-bitowy system operacyjny. Ponieważ Pi uruchamia tylko
    Gateway (modele wywołują interfejsy API w chmurze), nawet skromny Pi radzi sobie z obciążeniem.

    Mały Pi/VPS może również hostować wyłącznie Gateway, podczas gdy **węzły** na
    laptopie/telefonie są parowane na potrzeby lokalnego ekranu, kamery, obszaru roboczego lub wykonywania poleceń. Zobacz [Węzły](/pl/nodes).

    Pełny przewodnik konfiguracji: [Raspberry Pi](/pl/install/raspberry-pi).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    - Używać **64-bitowego** systemu operacyjnego; nie używać 32-bitowego Raspberry Pi OS.
    - Na płytkach z 2 GB pamięci lub mniej dodać pamięć wymiany.
    - Ze względu na wydajność i trwałość preferować **dysk SSD USB** zamiast karty SD.
    - Preferować instalację umożliwiającą modyfikacje (git), aby mieć dostęp do dzienników i szybko przeprowadzać aktualizacje.
    - Rozpocząć bez kanałów/Skills i dodawać je pojedynczo.
    - Nietypowe błędy plików binarnych („exec format error”) zwykle wynikają z braku kompilacji ARM64 dla opcjonalnego narzędzia Skills.

    Pełny przewodnik: [Raspberry Pi](/pl/install/raspberry-pi). Zobacz również [Linux](/pl/platforms/linux).

  </Accordion>

  <Accordion title="Proces zatrzymał się na „wake up my friend” / wdrażanie się nie kończy. Co teraz?">
    Ten ekran wymaga osiągalnego i uwierzytelnionego Gateway. TUI również automatycznie wysyła
    „Wake up, my friend!” przy pierwszym uruchomieniu, gdy skonfigurowany jest dostawca modelu. Jeśli
    pominięto konfigurację modelu lub uwierzytelniania, proces wdrażania wyświetla komunikat „Model auth missing” i otwiera
    TUI bez wysyłania czegokolwiek — należy dodać dostawcę za pomocą `openclaw configure --section model`.
    Jeśli widać wiersz wybudzania, ale **brak odpowiedzi**, a liczba tokenów pozostaje równa 0, agent nie został uruchomiony.

    1. Uruchomić ponownie Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdzić stan i uwierzytelnianie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Nadal się zawiesza? Uruchomić:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, należy potwierdzić, że połączenie tunelowe/Tailscale działa, a interfejs
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy można przenieść konfigurację na nową maszynę bez ponownego wdrażania?">
    Tak. Należy skopiować **katalog stanu** i **przestrzeń roboczą**, a następnie jednokrotnie uruchomić Doctor:

    1. Zainstalować OpenClaw na nowej maszynie.
    2. Skopiować `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiować przestrzeń roboczą (domyślnie: `~/.openclaw/workspace`).
    4. Uruchomić `openclaw doctor` i ponownie uruchomić usługę Gateway.

    Pozwala to zachować konfigurację, profile uwierzytelniania, dane uwierzytelniające WhatsApp, sesje i pamięć — bot pozostanie
    dokładnie taki sam, pod warunkiem skopiowania **obu** lokalizacji. W trybie zdalnym
    host Gateway jest właścicielem magazynu sesji i przestrzeni roboczej.

    **Ważne:** jeśli do GitHuba zostanie zatwierdzona/wysłana tylko przestrzeń robocza, kopia zapasowa obejmie
    **pamięć i pliki inicjalizacyjne**, ale nie historię sesji ani dane uwierzytelniania. Znajdują się one w
    `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Powiązane tematy: [Migracja](/pl/install/migrating), [Lokalizacja danych na dysku](/pl/help/faq#where-things-live-on-disk),
    [Przestrzeń robocza agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie można sprawdzić nowości w najnowszej wersji?">
    Należy sprawdzić dziennik zmian w serwisie GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy znajdują się na górze. Jeśli górna sekcja to **Niewydane**, następna sekcja
    opatrzona datą dotyczy najnowszej wydanej wersji. Wpisy są grupowane w sekcjach **Najważniejsze informacje**, **Zmiany**
    i **Poprawki** (oraz w sekcjach dokumentacji/innych, gdy jest to potrzebne).

  </Accordion>

  <Accordion title="Brak dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity nieprawidłowo blokują `docs.openclaw.ai` za pośrednictwem funkcji Xfinity
    Advanced Security. Należy ją wyłączyć lub dodać `docs.openclaw.ai` do listy dozwolonych, a następnie spróbować ponownie. Można pomóc
    w usunięciu blokady: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nadal coś blokuje? Dokumentacja jest dostępna również w serwisie GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między wersją stabilną a beta">
    **Wersja stabilna** i **beta** to **znaczniki dist-tag npm**, a nie oddzielne linie kodu:

    - `latest` = wersja stabilna
    - `beta` = wczesna kompilacja do testów (wraca do `latest`, gdy brakuje wersji beta lub jest ona starsza niż bieżące wydanie stabilne)

    Wydanie stabilne zwykle trafia najpierw do kanału **beta**, a następnie jawny krok promocji
    przenosi tę samą wersję do `latest` bez zmiany numeru wersji. Opiekunowie
    mogą również publikować bezpośrednio do `latest`. Dlatego po promocji wersje beta i stabilna mogą wskazywać
    **tę samą wersję**.

    Zobacz, co się zmieniło: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Jednowierszowe polecenia instalacyjne oraz różnicę między wersjami beta i dev opisano w następnej sekcji.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i czym różni się ona od wersji dev?">
    **Beta** to znacznik dist-tag npm `beta` (po promocji może być zgodny z `latest`).
    **Dev** to zmieniająca się najnowsza rewizja `main` (git); po opublikowaniu w npm używa znacznika dist-tag `dev`.

    Polecenia jednowierszowe (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator dla systemu Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Więcej informacji: [Kanały rozwojowe](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowszą wersję?">
    Dostępne są dwie opcje:

    1. **Kanał dev (istniejąca instalacja):**

    ```bash
    openclaw update --channel dev
    ```

    Powoduje to przełączenie na kopię roboczą git `main`, wykonanie rebase względem repozytorium nadrzędnego, kompilację i instalację
    CLI z tej kopii roboczej.

    2. **Modyfikowalna instalacja (git) (nowa maszyna):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Zalecane jest ręczne sklonowanie repozytorium:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Kanały rozwojowe](/pl/install/development-channels), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Ile zwykle trwa instalacja i wstępna konfiguracja?">
    Orientacyjne czasy:

    - **Instalacja:** 2-5 minut.
    - **Wstępna konfiguracja QuickStart:** kilka minut (Gateway w pętli zwrotnej, automatyczny token, domyślny obszar roboczy).
    - **Zaawansowana/pełna konfiguracja wstępna:** trwa dłużej, gdy logowanie u dostawcy, parowanie kanału, instalacja demona, pobieranie przez sieć lub skills wymagają dodatkowej konfiguracji.

    Kreator od razu przedstawia przewidywany czas. Opcjonalne kroki można pominąć i wrócić do nich później za pomocą
    `openclaw configure`.

    Proces się zawiesił? Zobacz sekcję [Proces się zatrzymał](#quick-start-and-first-run-setup) powyżej.

  </Accordion>

  <Accordion title="Instalator się zawiesił? Jak uzyskać więcej informacji?">
    Uruchom ponownie z opcją `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` nie ma osobnego przełącznika trybu szczegółowego; zamiast tego należy ująć go w `Set-PSDebug -Trace 1` /
    `-Trace 0`. Pełna lista flag: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalator w systemie Windows zgłasza brak git lub nierozpoznane polecenie openclaw">
    Dwa typowe problemy w systemie Windows:

    **1) Błąd npm „spawn git” / nie znaleziono git**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` znajduje się w zmiennej PATH.
    - Zamknij i ponownie otwórz PowerShell, a następnie ponownie uruchom instalator.

    **2) Polecenie openclaw nie jest rozpoznawane po instalacji**

    - Globalny katalog plików binarnych npm nie znajduje się w zmiennej PATH.
    - Sprawdź go: `npm config get prefix`.
    - Dodaj ten katalog do zmiennej PATH użytkownika (przyrostek `\bin` nie jest potrzebny; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell.

    Preferowana jest aplikacja komputerowa? Użyj **Windows Hub**. W przypadku konfiguracji wyłącznie
    terminalowej obsługiwane są zarówno instalator PowerShell, jak i ścieżki Gateway WSL2. Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe wykonywania w systemie Windows zawierają zniekształcony tekst chiński — co zrobić?">
    Zwykle przyczyną jest niezgodność strony kodowej konsoli w natywnych powłokach systemu Windows.

    Objawy: dane wyjściowe `system.run`/`exec` wyświetlają chińskie znaki jako zniekształcony tekst; to samo polecenie
    wygląda prawidłowo w innym profilu terminala.

    Obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie uruchom ponownie Gateway i ponów próbę:

    ```powershell
    openclaw gateway restart
    ```

    Problem nadal występuje w najnowszej wersji OpenClaw? Śledź lub zgłoś go tutaj: [Zgłoszenie nr 30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="Dokumentacja nie zawiera odpowiedzi na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj modyfikowalnej instalacji (git), aby mieć pełny kod źródłowy i dokumentację lokalnie, a następnie zadaj pytanie
    botowi (lub Claude/Codex) **z tego katalogu**, aby mógł odczytać repozytorium i udzielić precyzyjnej odpowiedzi.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej informacji: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw w systemie Linux?">
    - Szybka ścieżka dla systemu Linux i instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator i aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na serwerze VPS?">
    Odpowiedni jest dowolny serwer VPS z systemem Linux. Zainstaluj OpenClaw na serwerze, a następnie łącz się z Gateway przez SSH/Tailscale.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Zdalny dostęp do Gateway](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie znajdują się przewodniki instalacji w chmurze/na VPS?">
    Centrum informacji o hostingu u popularnych dostawców:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    W chmurze **Gateway działa na serwerze**, a dostęp do niego z laptopa/telefonu odbywa się
    przez interfejs Control UI (lub Tailscale/SSH). Stan i obszar roboczy znajdują się na serwerze, dlatego
    host należy traktować jako źródło prawdy i tworzyć jego kopie zapasowe.

    Sparuj **węzły** (Mac/iOS/Android/bez interfejsu graficznego) z tym Gateway w chmurze, aby używać lokalnie
    ekranu/kamery/canvas lub wykonywać polecenia na laptopie, podczas gdy Gateway pozostaje
    w chmurze.

    Centrum: [Platformy](/pl/platforms). Dostęp zdalny: [Zdalny dostęp do Gateway](/pl/gateway/remote).
    Węzły: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy można polecić OpenClaw samodzielną aktualizację?">
    Jest to możliwe, ale niezalecane. Proces aktualizacji może ponownie uruchomić Gateway (przerywając
    aktywną sesję), może wymagać czystej kopii roboczej git i może wyświetlić prośbę o potwierdzenie.
    Bezpieczniej jest uruchamiać aktualizacje z powłoki jako operator.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatyzacja z poziomu agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi konfiguracja wstępna?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez następujące kroki:

    1. **Model/uwierzytelnianie** — OAuth dostawcy, klucze API lub ręczne uwierzytelnianie (w tym opcje lokalne, takie jak LM Studio); wybór modelu domyślnego.
    2. **Obszar roboczy** — lokalizacja i pliki początkowe.
    3. **Gateway** — port, adres powiązania, tryb uwierzytelniania, udostępnianie przez Tailscale.
    4. **Kanały** — wbudowane kanały czatu i kanały oficjalnych pluginów: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
    5. **Demon** — LaunchAgent (macOS), jednostka użytkownika systemd (Linux/WSL2) lub natywne zaplanowane zadanie systemu Windows.
    6. **Kontrola kondycji** — uruchamia Gateway i sprawdza, czy działa.
    7. **Skills** — instaluje zalecane umiejętności i opcjonalne zależności.

    Na początku podaje przewidywany czas trwania i ostrzega, jeśli skonfigurowany model jest nieznany
    lub brakuje uwierzytelniania. Pełny opis: [Konfiguracja wstępna (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Czy do uruchomienia potrzebna jest subskrypcja Claude lub OpenAI?">
    Nie. OpenClaw można uruchamiać z **kluczami API** (Anthropic/OpenAI/innych dostawców) lub **wyłącznie modelami lokalnymi**,
    dzięki czemu dane pozostają na urządzeniu. Subskrypcje (Claude Pro/Max, ChatGPT/Codex) są
    opcjonalnymi metodami uwierzytelniania u tych dostawców.

    W przypadku Anthropic: **klucz API** zapewnia standardowe rozliczanie według użycia; **Claude CLI**
    ponownie wykorzystuje istniejące logowanie Claude Code na tym samym hoście. Anthropic obecnie traktuje
    nieinteraktywną ścieżkę `claude -p` narzędzia Claude CLI jako użycie Agent SDK/programistyczne, które
    nadal obciąża limity planu subskrypcji — przed poleganiem na sposobie działania subskrypcji należy sprawdzić aktualną dokumentację
    rozliczeń Anthropic. W przypadku długotrwale działających hostów Gateway i współdzielonej
    automatyzacji klucz API Anthropic jest bardziej przewidywalnym wyborem.

    OAuth OpenAI Codex (subskrypcja ChatGPT/Codex) jest w pełni obsługiwany dla modeli agentów.
    OpenClaw obsługuje również hostowane opcje subskrypcyjne, w tym **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** oraz **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax), [Z.AI (GLM)](/pl/providers/zai),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy można używać subskrypcji Claude Max bez klucza API?">
    Tak. OpenClaw obsługuje ponowne użycie Claude CLI w planach Pro/Max/Team/Enterprise. Anthropic
    obecnie traktuje używaną przez OpenClaw ścieżkę `claude -p` jako użycie planu subskrypcji podlegające
    limitom tego planu, a nie oddzielny bezpłatny limit — aktualne informacje o rozliczeniach i odnośniki do
    artykułów pomocy Anthropic znajdują się na stronie
    [Anthropic](/pl/providers/anthropic). Aby uzyskać najbardziej przewidywalną konfigurację po stronie serwera, należy zamiast tego użyć
    klucza API Anthropic.
  </Accordion>

  <Accordion title="Czy obsługiwane jest uwierzytelnianie za pomocą subskrypcji Claude (Claude Pro lub Max)?">
    Tak, przez ponowne użycie Claude CLI. Sposób rozliczania przez Anthropic użycia `claude -p`/Agent SDK
    zmieniał się z czasem; przed poleganiem na konkretnym sposobie
    rozliczania należy sprawdzić aktualny stan i opatrzone datami odnośniki do artykułów pomocy Anthropic na stronie [Anthropic](/pl/providers/anthropic).

    Uwierzytelnianie za pomocą tokena konfiguracyjnego Anthropic również nadal jest obsługiwaną ścieżką tokenową, ale OpenClaw preferuje
    ponowne użycie Claude CLI i `claude -p`, gdy są dostępne. W przypadku obciążeń produkcyjnych lub
    wieloużytkownikowych klucz API Anthropic pozostaje bezpieczniejszym i bardziej przewidywalnym wyborem. Inne
    hostowane opcje subskrypcyjne: [OpenAI](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Z.AI (GLM)](/pl/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę błąd HTTP 429 rate_limit_error od Anthropic?">
    **Limit przydziału/częstotliwości Anthropic** został wyczerpany w bieżącym oknie. W przypadku **Claude
    CLI** należy poczekać na zresetowanie okna lub przejść na wyższy plan. W przypadku **klucza API Anthropic**
    należy sprawdzić użycie i rozliczenia w Anthropic Console oraz w razie potrzeby zwiększyć limity.

    Jeśli komunikat brzmi dokładnie `Extra usage is required for long context requests`,
    żądanie próbuje użyć okna kontekstu Anthropic o rozmiarze 1M (modelu Claude 4.x
    z obsługą 1M w wersji GA albo starszej konfiguracji `params.context1m: true`), a bieżące dane uwierzytelniające
    nie kwalifikują się do rozliczania długiego kontekstu.

    Należy ustawić **model zapasowy**, aby OpenClaw nadal odpowiadał, gdy dostawca ogranicza częstotliwość żądań.
    Zobacz [Modele](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [Błąd Anthropic 429 wymagający dodatkowego użycia dla długiego kontekstu](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw zawiera wbudowanego dostawcę **Amazon Bedrock (Converse)**. Gdy są obecne
    znaczniki środowiska AWS (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw automatycznie włącza niejawnego dostawcę Bedrock na potrzeby wykrywania modeli; w przeciwnym razie
    należy ustawić `plugins.entries.amazon-bedrock.config.discovery.enabled: true` lub dodać ręczny
    wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) oraz [Dostawcy modeli](/pl/providers/models).
    Jeśli preferowany jest zarządzany przepływ kluczy, nadal można użyć zgodnego z OpenAI serwera proxy przed Bedrock.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Codex** za pośrednictwem OAuth (logowanie do ChatGPT). Nowa
    konfiguracja bez modelu głównego używa dokładnie `openai/gpt-5.6-sol` do
    uwierzytelniania subskrypcji ChatGPT/Codex oraz natywnego wykonywania przez serwer aplikacji Codex.
    Ponowne uwierzytelnienie zachowuje istniejący jawnie określony model, w tym
    `openai/gpt-5.5`. Jeśli obszar roboczy Codex nie udostępnia GPT-5.6, należy jawnie wybrać
    `openai/gpt-5.5`; OpenClaw nie przechodzi niejawnie na starszą wersję. Starsze
    odwołania do modeli z prefiksem Codex są starszą konfiguracją naprawianą przez `openclaw doctor
    --fix`. Bezpośredni dostęp za pomocą klucza API OpenAI pozostaje dostępny dla nieagentowych
    powierzchni API OpenAI, a poprzez uporządkowany profil klucza API `openai` również dla modeli
    agentowych. Zobacz [Dostawcy modeli](/pl/concepts/model-providers) oraz
    [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina starszy prefiks OpenAI Codex?">
    `openai` to bieżący identyfikator dostawcy i profilu uwierzytelniania zarówno dla kluczy API OpenAI, jak i
    OAuth ChatGPT/Codex — OpenAI Codex został do niego włączony. Starszy prefiks
    `openai-codex` może być nadal widoczny w starszej konfiguracji i ostrzeżeniach dotyczących migracji:

    - `openai/gpt-5.6-sol` = nowa konfiguracja subskrypcji ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex dla tur agenta.
    - `openai/gpt-5.5` = jawnie obsługiwany wybór dla istniejącej konfiguracji lub kont bez dostępu do GPT-5.6.
    - Starsze odwołania do modeli `openai-codex/*` = starsza trasa naprawiana przez `openclaw doctor --fix`.
    - `openai/gpt-5.5` wraz z uporządkowanym profilem klucza API `openai` = uwierzytelnianie za pomocą klucza API dla modelu agenta OpenAI.
    - Starsze identyfikatory profili uwierzytelniania `openai-codex` = starsze identyfikatory migrowane przez `openclaw doctor --fix`.

    Aby korzystać z bezpośrednich rozliczeń OpenAI Platform, należy ustawić `OPENAI_API_KEY`. Aby korzystać z uwierzytelniania
    subskrypcji ChatGPT/Codex, należy uruchomić `openclaw models auth login --provider openai`. Odwołania do
    modeli należy zachować pod kanonicznym dostawcą `openai/*`. Nowa konfiguracja subskrypcji
    używa dokładnie `openai/gpt-5.6-sol`; doctor naprawia starsze odwołania z prefiksem Codex
    bez aktualizowania jawnego wyboru `openai/gpt-5.5`.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od limitów ChatGPT w przeglądarce?">
    OAuth Codex korzysta z zarządzanych przez OpenAI, zależnych od planu okien przydziału, które mogą różnić się od
    środowiska witryny/aplikacji ChatGPT, nawet na tym samym koncie.

    `openclaw models status` pokazuje aktualnie widoczne okna użycia/przydziału dostawcy, ale
    nie tworzy ani nie przekształca uprawnień ChatGPT w przeglądarce na bezpośredni dostęp do API. Aby korzystać
    z bezpośredniej ścieżki rozliczeń/limitów OpenAI Platform, należy użyć `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługiwane jest uwierzytelnianie subskrypcji OpenAI (OAuth Codex)?">
    Tak, w pełni. OpenAI wyraźnie zezwala na używanie OAuth subskrypcji w zewnętrznych
    narzędziach i przepływach pracy, takich jak OpenClaw. Proces wdrażania może przeprowadzić przepływ OAuth.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) oraz [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować OAuth Gemini CLI?">
    Gemini CLI używa **przepływu uwierzytelniania Pluginu**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    1. Należy zainstalować Gemini CLI lokalnie, aby `gemini` znajdował się w `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google/gemini-3.1-pro-preview` (środowisko wykonawcze `google-gemini-cli`)
    5. Żądania kończą się niepowodzeniem po zalogowaniu? Ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.

    Tokeny OAuth są przechowywane w profilach uwierzytelniania na hoście Gateway. Szczegóły: [Google](/pl/providers/google), [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych rozmów?">
    Zwykle nie. OpenClaw wymaga dużego kontekstu i silnych zabezpieczeń; małe karty skracają kontekst
    i pomijają filtry bezpieczeństwa po stronie dostawcy. Jeśli jest to konieczne, należy lokalnie uruchomić **największą**
    możliwą kompilację modelu (LM Studio) — zobacz [Modele lokalne](/pl/gateway/local-models). Mniejsze/skwantyzowane
    modele zwiększają ryzyko wstrzyknięcia polecenia — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak ograniczyć ruch hostowanego modelu do określonego regionu?">
    Należy wybrać punkty końcowe przypisane do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi
    i GLM; wybór wariantu hostowanego w USA pozwala zachować dane w regionie. Nadal można umieścić
    Anthropic/OpenAI obok nich za pomocą `models.mode: "merge"`, aby modele zapasowe pozostały
    dostępne przy jednoczesnym przestrzeganiu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy trzeba kupić Maca mini, aby to zainstalować?">
    Nie. OpenClaw działa w systemie macOS lub Linux (Windows przez WSL2). Mac mini jest popularnym
    wyborem stale włączonego hosta, ale mały VPS, serwer domowy lub urządzenie klasy Raspberry Pi również się nadaje.

    Mac jest potrzebny tylko **do narzędzi dostępnych wyłącznie w macOS**. W przypadku iMessage należy użyć [iMessage](/pl/channels/imessage)
    z `imsg` na dowolnym Macu zalogowanym do Messages — jeśli Gateway działa w systemie Linux lub gdzie indziej,
    należy ustawić `channels.imessage.cliPath` na opakowanie SSH, które uruchamia `imsg` na tym Macu. W przypadku innych
    narzędzi dostępnych wyłącznie w macOS należy uruchomić Gateway na Macu lub sparować węzeł macOS.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes), [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy obsługa iMessage wymaga Maca mini?">
    Potrzebne jest **dowolne urządzenie z macOS** zalogowane do Messages — niekoniecznie Mac mini;
    nadaje się każdy Mac. Należy użyć [iMessage](/pl/channels/imessage) z `imsg`; Gateway może działać na tym
    Macu lub w innym miejscu z opakowaniem SSH `cliPath`.

    Typowe konfiguracje:

    - Gateway w systemie Linux/na VPS, z `channels.imessage.cliPath` ustawionym na opakowanie SSH uruchamiające `imsg` na Macu zalogowanym do Messages.
    - Wszystko na jednym Macu, aby uzyskać najprostszą konfigurację jednego komputera.

    Dokumentacja: [iMessage](/pl/channels/imessage), [Węzły](/pl/nodes), [Tryb zdalny Maca](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy po zakupie Maca mini do uruchamiania OpenClaw można połączyć go z MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a MacBook Pro łączy się jako **węzeł**
    (urządzenie towarzyszące). Węzły nie uruchamiają Gateway — dodają funkcje takie jak
    ekran/kamera/canvas i `system.run` na tym urządzeniu.

    Typowy schemat: Gateway na stale włączonym Macu mini; MacBook Pro uruchamia aplikację macOS lub
    hosta węzła i paruje się z Gateway. Stan można sprawdzić za pomocą `openclaw nodes status` / `openclaw nodes list`.

    Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy można używać Bun?">
    Bun może służyć do instalowania zależności lub uruchamiania skryptów pakietów. CLI OpenClaw i
    Gateway wymagają **Node**, ponieważ kanoniczny magazyn stanu używa `node:sqlite`; Bun
    nie udostępnia tego API.
  </Accordion>

  <Accordion title="Telegram: co należy umieścić w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram będącego nadawcą** (liczbowy),
    a nie nazwa użytkownika bota. Konfiguracja wymaga wyłącznie liczbowych identyfikatorów użytkowników; `openclaw doctor --fix`
    może spróbować rozpoznać starsze wpisy `@username`.

    Bezpieczniej (bez bota innej firmy): należy wysłać wiadomość prywatną do swojego bota, uruchomić `openclaw logs --follow` i odczytać `from.id`.

    Oficjalne Bot API: należy wysłać wiadomość prywatną do swojego bota, wywołać `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytać `message.from.id`.

    Usługa innej firmy (mniejsza prywatność): należy wysłać wiadomość prywatną do `@userinfobot` lub `@getidsbot`.

    Zobacz [Kontrola dostępu Telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, dzięki **routowaniu wielu agentów**. Należy powiązać wiadomość prywatną WhatsApp każdego nadawcy (`peer: { kind: "direct", id: "+15551234567" }`) z innym `agentId`, zapewniając każdej osobie własny obszar roboczy i magazyn sesji. Odpowiedzi nadal pochodzą z **tego samego konta WhatsApp**; kontrola dostępu do wiadomości prywatnych (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla każdego konta. Zobacz [Routowanie wielu agentów](/pl/concepts/multi-agent) oraz [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy można uruchomić agenta „szybkiego czatu” i agenta „Opus do programowania”?'>
    Tak. Należy użyć routowania wielu agentów: przypisać każdemu agentowi własny model domyślny, a następnie powiązać
    trasy przychodzące (konto dostawcy lub określonych partnerów) z każdym agentem. Przykładowa konfiguracja:
    [Routowanie wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) oraz
    [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa w systemie Linux?">
    Tak, za pośrednictwem Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Przy uruchamianiu OpenClaw przez systemd należy upewnić się, że zmienna PATH usługi zawiera
    `/home/linuxbrew/.linuxbrew/bin` (lub używany prefiks brew), aby narzędzia zainstalowane przez `brew`
    były dostępne w powłokach bez logowania. Najnowsze kompilacje dodają również na początku typowe katalogi binarne użytkownika w usługach
    systemd systemu Linux (na przykład `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) oraz respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` i `FNM_DIR`, jeśli są ustawione.

  </Accordion>

  <Accordion title="Różnica między modyfikowalną instalacją z git a instalacją z npm">
    - **Modyfikowalna instalacja (git):** pełna kopia źródeł, edytowalna, najlepsza dla współtwórców. Kompilacja odbywa się lokalnie i można modyfikować kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”. Aktualizacje pochodzą ze znaczników dystrybucji npm.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy później można przełączać się między instalacjami npm i git?">
    Tak, za pomocą `openclaw update --channel ...` w istniejącej instalacji. **Nie
    usuwa to danych** — zmienia się tylko instalacja kodu OpenClaw. Stan (`~/.openclaw`) i
    obszar roboczy (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm na git:

    ```bash
    openclaw update --channel dev
    ```

    Z git na npm:

    ```bash
    openclaw update --channel stable
    ```

    Dodaj `--dry-run`, aby najpierw wyświetlić podgląd planowanej zmiany trybu. Aktualizator wykonuje
    działania uzupełniające Doctor, odświeża źródła pluginów dla kanału docelowego i ponownie uruchamia Gateway,
    chyba że zostanie przekazane `--no-restart`.

    Instalator również może wymusić dowolny z tych trybów:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowych: [Gdzie znajdują się dane na dysku](/pl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy uruchomić Gateway na laptopie, czy na VPS?">
    Potrzebna jest niezawodność 24/7? Użyj **VPS**. Jeśli najważniejsza jest łatwość obsługi, a
    usypianie i ponowne uruchamianie nie stanowią problemu, uruchom go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki.
    - **Wady:** uśpienie lub przerwy w sieci powodują rozłączenie, aktualizacje i ponowne uruchomienia systemu przerywają działanie, laptop musi pozostawać aktywny.

    **VPS / chmura**

    - **Zalety:** ciągła dostępność, stabilna sieć, brak problemów z usypianiem laptopa, łatwiejsze utrzymanie działania.
    - **Wady:** często bez interfejsu graficznego (należy korzystać ze zrzutów ekranu), wyłącznie zdalny dostęp do plików, aktualizacje wymagają SSH.

    WhatsApp/Telegram/Slack/Mattermost/Discord działają bez problemu z VPS — rzeczywistym
    kompromisem jest wybór między przeglądarką bez interfejsu graficznego a widocznym oknem. Zobacz [Przeglądarka](/pl/tools/browser).

    Domyślne zalecenie: VPS, jeśli wcześniej zdarzały się rozłączenia Gateway; środowisko lokalne sprawdza się świetnie,
    gdy Mac jest aktywnie używany i potrzebny jest lokalny dostęp do plików lub automatyzacja
    interfejsu przeglądarki widocznego na ekranie.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale zalecane ze względu na niezawodność i izolację.

    - **Dedykowany host (VPS/Mac mini/Raspberry Pi):** działa stale, rzadziej występują przerwy spowodowane uśpieniem lub ponownym uruchomieniem, uprawnienia są prostsze, a utrzymanie ciągłego działania — łatwiejsze.
    - **Współdzielony laptop/komputer stacjonarny:** nadaje się do testowania i aktywnego użytkowania, ale należy spodziewać się przerw, gdy maszyna przechodzi w tryb uśpienia lub instaluje aktualizacje.

    Najlepsze połączenie obu rozwiązań: Gateway działa na dedykowanym hoście, a laptop jest
    sparowany jako **węzeł** na potrzeby lokalnych narzędzi obsługujących ekran, kamerę i wykonywanie poleceń. Zobacz [Węzły](/pl/nodes) i [Zabezpieczenia](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB miejsca na dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB+ RAM, aby zapewnić zapas zasobów (dzienniki, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: **Ubuntu LTS** (lub dowolny nowoczesny Debian/Ubuntu) — najlepiej przetestowana ścieżka instalacji w systemie Linux.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy można uruchomić OpenClaw w maszynie wirtualnej i jakie są wymagania?">
    Tak. Maszynę wirtualną należy traktować jak VPS: musi być stale włączona, osiągalna i mieć wystarczającą ilość pamięci RAM
    dla Gateway oraz wszystkich włączonych kanałów.

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB+ RAM w przypadku wielu kanałów, automatyzacji przeglądarki lub narzędzi multimedialnych.
    - **System operacyjny:** Ubuntu LTS lub inny nowoczesny Debian/Ubuntu.

    W systemie Windows należy użyć **Windows Hub** do konfiguracji środowiska komputerowego lub WSL2, aby utworzyć maszynę wirtualną Gateway w stylu systemu Linux
    z szeroką zgodnością narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Uruchamianie macOS w maszynie wirtualnej: zobacz [Maszyna wirtualna macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Często zadawane pytania](/pl/help/faq) — główna sekcja często zadawanych pytań (modele, sesje, Gateway, zabezpieczenia i inne)
- [Omówienie instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
