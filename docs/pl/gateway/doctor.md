---
read_when:
    - Dodawanie lub modyfikowanie migracji diagnostycznych
    - Wprowadzanie niezgodnych wstecz zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-04T09:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację i stan, sprawdza kondycję oraz podaje możliwe do wykonania kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryby bez interfejsu i automatyzacji

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Akceptuje wartości domyślne bez pytania (w tym kroki naprawy restartu/usługi/piaskownicy, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez pytania (naprawy + restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/piaskownicy, które wymagają potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe pod kątem dodatkowych instalacji gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit restartu.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przysłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Ostrzeżenia listy dozwolonych pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda symbolu wieloznacznego lub narzędzi należących do pluginu.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola dostawy/ładunku najwyższego poziomu, `provider` ładunku, proste zadania awaryjne webhook `notify: true`).
    - Migracja starszej polityki środowiska wykonawczego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie przestarzałej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odwołania do pluginów są traktowane jako nieaktywna konfiguracja ograniczająca i zostają zachowane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokady sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptu sesji dla zduplikowanych gałęzi przepisywania promptu utworzonych przez dotknięte problemem kompilacje 2026.4.24.
    - Wykrywanie nagrobków odzyskiwania po restarcie zakleszczonego subagenta, z obsługą `--fix` do czyszczenia przestarzałych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej dziecka jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu obszaru roboczego (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszej usługi i wykrywanie dodatkowego gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska wykonawczego Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia statusu kanału (sondowane z działającego gateway).
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska wbudowanego proxy dla usług gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia najlepszych praktyk środowiska wykonawczego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka konfliktów portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
    - Sprawdzenia uwierzytelniania Gateway dla trybu tokenu lokalnego (proponuje wygenerowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji tokenu SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące aktualizacje roli/zakresu, dryf przestarzałej lokalnej pamięci podręcznej tokenu urządzenia oraz dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Obszar roboczy i powłoka">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrap obszaru roboczego (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone Skills z brakującymi plikami binarnymi, zmiennymi środowiskowymi, konfiguracją lub wymaganiami OS, a `--fix` może wyłączyć niedostępne Skills w `skills.entries`.
    - Sprawdzenie statusu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy osadzeń wyszukiwania pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Sprawdzenia instalacji ze źródeł (niedopasowanie obszaru roboczego pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnienie i reset interfejsu Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu doctor gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym obszarze roboczym, uruchamia przebieg grounded REM diary i zapisuje odwracalne wpisy uzupełniające w `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko oznaczone wpisy dziennika uzupełnienia.
- **Clear Grounded** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze bieżącego przypomnienia ani dziennego wsparcia.

Czego **nie** robią samodzielnie:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded do aktywnego magazynu promocji krótkoterminowej, chyba że wcześniej jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na normalną głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje trwałych kandydatów grounded w krótkoterminowym magazynie dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git i doctor działa interaktywnie, proponuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do obecnego schematu.

    Obejmuje to starsze płaskie pola Talk. Obecna publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego lub wpisów narzędzi należących do pluginu. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych pluginów.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway również automatycznie uruchamia migracje doctor podczas startu, gdy wykryje starszy format konfiguracji, więc przestarzałe konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

    Obecne migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - konfiguracje skonfigurowanych kanałów bez widocznej polityki odpowiedzi → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższego poziomu `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` i `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` i `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` i `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` i `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - W przypadku kanałów z nazwanymi `accounts`, ale z pozostałymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do wypromowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (narzędzia/podwyższone uprawnienia/wykonywanie/sandbox/subagenci)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija także dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się niepowodzeniem w trybie zamkniętym)

    Ostrzeżenia doctora obejmują także wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wymienia skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić użycie przez modele niewłaściwego API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` zostaje usunięte

    Doctor sprawdza też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Host-local Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście gateway/node
    - przeglądarki uruchomionej lokalnie
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość dotyczy tutaj tylko lokalnych wymagań wstępnych dołączania. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ta kontrola **nie** dotyczy Dockera, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne TLS dla OAuth">
    Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor bada punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli próba zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doctor wypisuje wskazówki naprawy specyficzne dla platformy. W systemie macOS z Node z Homebrew rozwiązaniem jest zwykle `brew postinstall ca-certificates`. Z `--deep` próba jest uruchamiana nawet wtedy, gdy gateway działa poprawnie.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy OAuth Codex">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy OAuth Codex, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok OAuth Codex, aby można było usunąć albo przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjnego przełączania. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia tras pluginu Codex">
    Gdy wbudowany plugin Codex jest włączony, doctor sprawdza też, czy referencje modelu podstawowego `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Ta kombinacja jest prawidłowa, gdy chcesz używać uwierzytelniania OAuth/subskrypcyjnego Codex przez PI, ale łatwo ją pomylić z natywnym mechanizmem app-server Codex. Doctor ostrzega i wskazuje jawną postać app-server: `openai/*` plus `agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są prawidłowe:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania OAuth/subskrypcyjnego Codex przez normalny runner OpenClaw”.
    - `openai/*` + `agentRuntime.id: "codex"` oznacza „uruchom osadzoną turę przez natywny app-server Codex”.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną konwersację Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Zachowaj ostrzeżenie bez zmian, gdy OAuth PI Codex jest zamierzony.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane na zasadzie best-effort i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje + katalog agenta przy uruchomieniu, dzięki czemu historia/uwierzytelnianie/modele trafiają do ścieżki per-agent bez ręcznego uruchamiania doctora. Ujednolicanie dostawcy talk/mapy dostawców porównuje teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie powodują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów pluginów">
    Doctor skanuje wszystkie manifesty zainstalowanych pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu cron">
    Doctor sprawdza też magazyn zadań cron (domyślnie `~/.openclaw/cron/jobs.json` albo `cron.store`, gdy nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące porządki cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania awaryjne webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy awaryjny notify z istniejącym trybem dostarczania innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starsze `~/.openclaw/bin/ensure-whatsapp.sh`. Ten skrypt host-local nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń przestarzały wpis crontaba za pomocą `crontab -e`; używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status` do bieżących kontroli stanu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agentów pod kątem przestarzałych plików blokad zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, informację, czy PID nadal działa, wiek blokady oraz czy jest uznawana za przestarzałą (martwy PID albo starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa przestarzałe pliki blokad; w przeciwnym razie wypisuje uwagę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agentów pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem środowiska uruchomieniowego OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu historia Gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, dane uwierzytelniające, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, pyta o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu macOS synchronizowany z chmurą**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) albo `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i danych uwierzytelniających.
    - **Brak katalogów sesji**: `sessions/` oraz katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-wierszowy JSONL”**: oznacza przypadek, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie akumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może dzielić się między instalacjami).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają/wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracyjnego Anthropic. Monity odświeżania pojawiają się tylko podczas uruchamiania interaktywnego (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza również profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/przekroczenia czasu/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor weryfikuje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozwiązać albo jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Dockera i oferuje zbudowanie albo przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji pluginów">
    Doctor usuwa starszy, wygenerowany przez OpenClaw stan etapowania zależności pluginów w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to przestarzałe wygenerowane korzenie zależności, stare katalogi etapów instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności dołączonych pluginów oraz osierocone lub odzyskane zarządzane kopie npm dołączonych pluginów `@openclaw/*`, które mogą przesłaniać bieżący dołączony manifest.

    Doctor może również ponownie zainstalować skonfigurowane pluginy do pobrania, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr pluginów nie może ich znaleźć. Dla eksternalizacji dołączonych pluginów z 2026.5.2 doctor automatycznie instaluje pluginy do pobrania, których istniejąca konfiguracja już używa, a następnie polega na `meta.lastTouchedVersion`, aby uruchomić ten przebieg wydania tylko raz. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje pluginów pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz instalację usługi OpenClaw z użyciem bieżącego portu Gateway. Może również skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane profilem są uznawane za pierwszorzędne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje systemowa usługa Gateway OpenClaw, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` albo `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy systemowy supervisor zarządza cyklem życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja przy starcie Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki są niekrytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń w ramach normalnego przebiegu sprawdzania kondycji.

    Co zgłasza:

    - oczekujące pierwsze żądania parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące rozszerzenia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdzie identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy wykraczają poza zatwierdzoną bazę parowania
    - lokalne buforowane wpisy tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway albo zawierają przestarzałe metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź przestarzały rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal pojawia się wymaganie parowania”: doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od przestarzałego dryfu tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (skills, pluginy i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: zlicza skills kwalifikujące się, z brakującymi wymaganiami i blokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` albo inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan pluginów**: zlicza włączone/wyłączone/błędne pluginy; wypisuje identyfikatory pluginów dla wszelkich błędów; zgłasza możliwości pluginów pakietowych.
    - **Ostrzeżenia zgodności pluginów**: oznacza pluginy, które mają problemy ze zgodnością z bieżącym środowiskiem uruchomieniowym.
    - **Diagnostyka pluginów**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` albo inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków lub go przekraczają. Zgłasza dla każdego pliku liczby znaków surowych i wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` albo `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całego budżetu. Gdy pliki są obcięte albo blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie przestarzałych pluginów kanałów">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa również wiszącą konfigurację zakresu kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele Heartbeat, które nazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których środowisko uruchomieniowe kanału zniknęło, ale konfiguracja nadal każe Gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish albo PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu pliku w pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor pyta o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego tokenu Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor oferuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzać skonfigurowane dane uwierzytelniające bez osłabiania zachowania środowiska uruchomieniowego typu fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu dla ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie zgłaszać token jako brakujący.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + ponowne uruchomienie">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy binarka `qmd` jest dostępna i możliwa do uruchomienia. Jeśli nie, wyświetla wskazówki naprawcze obejmujące pakiet npm oraz opcję ręcznej ścieżki do binarki.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/możliwy do pobrania URL modelu. Jeśli go brakuje, sugeruje przełączenie na zdalnego dostawcę.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wyświetla praktyczne wskazówki naprawcze.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność lokalnego modelu, a potem próbuje każdego zdalnego dostawcy w kolejności automatycznego wyboru.

    Gdy dostępny jest buforowany wynik sondowania Gateway (Gateway był zdrowy w chwili sprawdzenia), doctor zestawia jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingowania osadzeń na domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanału">
    Jeśli Gateway jest zdrowy, doctor uruchamia sondowanie statusu kanału i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt + naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy oraz czyszczenie starszych usług, ponieważ ten cykl życia należy do zewnętrznego nadzorcy.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, nielegacy dodatkowe jednostki podobne do Gateway podczas skanowania duplikatów usług, aby towarzyszące pliki usług nie generowały zbędnego szumu czyszczenia.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w postaci zwykłego tekstu do metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości ładowały się ze źródła runtime zamiast z definicji nadzorcy.
    - Doctor wykrywa, kiedy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek Linux user-systemd kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszej binarki OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portu">
    Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione LaunchAgenty macOS używają kanonicznego systemowego PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, więc Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, które procesy potomne Node są rozwiązywane. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi binarne użytkownika, ale odgadywane katalogi awaryjne menedżerów wersji są zapisywane w PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci przestrzeni roboczej, gdy go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej, jeśli przestrzeń robocza nie jest jeszcze pod git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby przeczytać pełny przewodnik po strukturze przestrzeni roboczej i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
