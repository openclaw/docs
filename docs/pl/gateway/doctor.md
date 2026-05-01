---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian konfiguracji powodujących niezgodność wsteczną
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-01T09:58:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje wykonalne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryby bezobsługowe i automatyzacji

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/piaskownicy, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez pytań (naprawy i restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Stosuje również agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia się bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji i przeniesienia stanu na dysku). Pomija działania restartu/usługi/piaskownicy, które wymagają potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe pod kątem dodatkowych instalacji gatewaya (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, interfejs użytkownika i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji i pytanie o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status Plugin.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniu dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth w Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
    - Ostrzeżenia allowlisty Plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda wildcard lub narzędzi należących do Plugin.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola delivery/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne Webhook `notify: true`).
    - Migracja starszej runtime-policy agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie nieaktualnej konfiguracji Plugin, gdy pluginy są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do Plugin są traktowane jako nieaktywna konfiguracja izolacyjna i są zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja pliku blokady sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptu sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte kompilacje 2026.4.24.
    - Wykrywanie znaczników tombstone odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby startup nie traktował dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnego.
    - Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i supervisory">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszej usługi i wykrywanie dodatkowego gatewaya.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia runtime Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego gatewaya).
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska wbudowanego proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk runtime Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Sprawdzenia uwierzytelniania Gateway dla lokalnego trybu tokenu (oferuje wygenerowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenu).
    - Wykrywanie problemów z parowaniem urządzenia (oczekujące żądania pierwszego parowania, oczekujące uaktualnienia roli/zakresu, nieaktualny dryf lokalnego cache tokenu urządzenia oraz dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i powłoka">
    - Sprawdzenie systemd linger w Linuksie.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/zbliżeniu do limitu dla plików kontekstu).
    - Sprawdzenie statusu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację i metadane kreatora.

  </Accordion>
</AccordionGroup>

## Backfill i reset interfejsu Dreams

Scena Dreams w Control UI zawiera działania **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy ugruntowanego Dreaming. Te działania używają metod RPC w stylu doctora gatewaya, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg ugruntowanego dziennika REM i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa tylko te oznaczone wpisy dziennika backfill z `DREAMS.md`.
- **Clear Grounded** usuwa tylko przygotowane, wyłącznie ugruntowane wpisy krótkoterminowe, które pochodzą z odtworzenia historii i nie zgromadziły jeszcze żywego recall ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctora
- nie przygotowują automatycznie ugruntowanych kandydatów w magazynie promocji krótkoterminowej na żywo, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na zwykłą ścieżkę głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, proponuje aktualizację (fetch/rebase/build) przed uruchomieniem doctora.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    wpisów wildcard lub narzędzi należących do Plugin. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej allowlisty Plugin.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway automatycznie uruchamia też migracje doctora przy starcie, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` najwyższego poziomu
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
    - W przypadku kanałów z nazwanymi `accounts`, ale pozostawionymi jednokontowymi wartościami kanału najwyższego poziomu, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący zgodny nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (podczas uruchamiania Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć działanie błędem)

    Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwym API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty per model.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Host-local Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście gateway/node
    - lokalnie uruchomionej przeglądarki
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy tylko lokalnych wymagań dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor odpytuje punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli próba zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doctor wypisuje wskazówki naprawy specyficzne dla platformy. W macOS z Node z Homebrew naprawą zwykle jest `brew postinstall ca-certificates`. Z `--deep` próba działa nawet wtedy, gdy gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu razem z Codex OAuth, aby można było usunąć albo przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/fallback. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia tras Pluginu Codex">
    Gdy włączony jest dołączony Plugin Codex, doctor sprawdza też, czy referencje modeli głównych `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Taka kombinacja jest poprawna, gdy chcesz używać uwierzytelniania Codex OAuth/subskrypcji przez PI, ale łatwo pomylić ją z natywną uprzężą app-server Codex. Doctor ostrzega i wskazuje jawną postać app-server: `openai/*` plus `agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są poprawne:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subskrypcji przez normalny runner OpenClaw”.
    - `openai/*` + `runtime: "codex"` oznacza „uruchom osadzoną turę przez natywny app-server Codex”.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną konwersację Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Zachowaj ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

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

    Te migracje są wykonywane według najlepszych starań i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta podczas uruchamiania, dzięki czemu historia/uwierzytelnianie/modele trafiają do ścieżki per agent bez ręcznego uruchamiania doctor. Normalizacja dostawcy/mapy dostawców talk porównuje teraz przez równość strukturalną, więc różnice dotyczące wyłącznie kolejności kluczy nie wywołują już powtarzanych zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Pluginów">
    Doctor skanuje wszystkie zainstalowane manifesty Pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu oferuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu Cron">
    Doctor sprawdza też magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla kompatybilności.

    Bieżące porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola delivery najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy delivery `provider` w payload → jawne `delivery.channel`
    - proste starsze zadania fallback webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym trybem delivery innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokad zapisu — plików pozostawionych po nienormalnym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal żyje, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID albo starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby historia gateway i czytniki pamięci nie widziały już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym rdzeniem. Jeśli zniknie, utracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryto niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan jest rozwiązywany pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux SD lub eMMC**: ostrzega, gdy stan jest rozwiązywany do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i zużywać się szybciej przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-line JSONL”**: sygnalizuje, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może rozdzielić się między instalacjami).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na hoście zdalnym (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modelu (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wkrótce wygasną lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Monity o odświeżenie pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca poleci ponowne zalogowanie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza też profile uwierzytelniania, które są tymczasowo niedostępne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/limity czasu/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie uda się go rozwiązać albo jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu piaskownicy">
    Gdy piaskownica jest włączona, doctor sprawdza obrazy Docker i oferuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.
  </Accordion>
  <Accordion title="7b. Zależności runtime dołączonych pluginów">
    Doctor weryfikuje zależności runtime tylko dla dołączonych pluginów, które są aktywne w bieżącej konfiguracji lub włączone przez domyślne ustawienie ich dołączonego manifestu, na przykład `plugins.entries.discord.enabled: true`, starsze `channels.discord.enabled: true`, skonfigurowane `models.providers.*` / odwołania do modeli agentów albo domyślnie włączony dołączony plugin bez własności dostawcy. Jeśli czegoś brakuje, doctor zgłasza pakiety i instaluje je w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne pluginy nadal używają `openclaw plugins install` / `openclaw plugins update`; doctor nie instaluje zależności dla dowolnych ścieżek pluginów.

    Podczas naprawy doctor instalacje npm zależności runtime dołączonych pluginów zgłaszają postęp spinnera w sesjach TTY i okresowy postęp liniowy w wyjściu potokowanym/bezgłowym. Uruchamianie Gateway i ponowne ładowanie konfiguracji przechodzą w tryb planowania pluginów przed importem modułów runtime dołączonych pluginów; zwykłe importy runtime służą wyłącznie weryfikacji i nie uruchamiają naprawy menedżera pakietów. Te instalacje są ograniczone do katalogu głównego instalacji runtime pluginu, uruchamiane z wyłączonymi skryptami, nie zapisują blokady pakietów i są chronione blokadą katalogu głównego instalacji, aby równoległe uruchomienia CLI lub Gateway nie mutowały tego samego drzewa `node_modules` w tym samym czasie. Nieaktualne starsze blokady po zabitych uruchomieniach Docker/kontenera są odzyskiwane, gdy ich metadane właściciela nie mogą potwierdzić bieżącej inkarnacji procesu, a pliki blokad są stare.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu gateway. Może też skanować dodatkowe usługi podobne do gateway i wypisywać wskazówki czyszczenia. Usługi OpenClaw gateway nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi gateway na poziomie użytkownika, ale istnieje usługa OpenClaw gateway na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny supervisor zarządza cyklem życia gateway.

  </Accordion>
  <Accordion title="8b. Migracja uruchomieniowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) to sprawdzenie jest całkowicie pomijane.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część zwykłego przebiegu kontroli kondycji.

    Co zgłasza:

    - oczekujące pierwsze żądania parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące rozszerzenia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy id urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalne wpisy pamięci podręcznej tokenów urządzenia dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie gateway albo mają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal wymagane jest parowanie”: doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby gateway pozostał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Status obszaru roboczego (skills, pluginy i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Status Skills**: zlicza skills kwalifikujące się, z brakującymi wymaganiami i blokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Status Plugin**: zlicza włączone/wyłączone/błędne pluginy; wymienia ID pluginów dla wszelkich błędów; zgłasza możliwości pluginów pakietu.
    - **Ostrzeżenia kompatybilności Plugin**: sygnalizuje pluginy, które mają problemy z kompatybilnością z bieżącym runtime.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Zgłasza dla każdego pliku surowe i wstrzyknięte liczby znaków, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego pluginu kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa też wiszącą konfigurację w zakresie kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele heartbeat, które wskazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, gdy runtime kanału zniknął, ale konfiguracja nadal wymaga, aby gateway się z nim powiązał.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu pliku z pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor pyta o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Sprawdzenia uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor oferuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania runtime fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status dla ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii lub błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Sprawdzenie kondycji Gateway + restart">
    Doctor uruchamia sprawdzenie kondycji i oferuje ponowne uruchomienie gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzania wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy binarka `qmd` jest dostępna i możliwa do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki do binarki.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu lub rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Wypisuje praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy Gateway z pamięci podręcznej (Gateway był sprawny w chwili sprawdzania), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingu osadzania na domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz wykonać bieżące sprawdzenie dostawcy.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanałów">
    Jeśli Gateway jest sprawny, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszych usług, ponieważ tym cyklem życia zarządza zewnętrzny nadzorca.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, niestarsze dodatkowe jednostki podobne do Gateway podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie generowały szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor weryfikuje SecretRef, ale nie utrwala rozwiązanych wartości tokenów w postaci jawnego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły bezpośrednio, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła wykonawczego zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie może zostać rozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek systemd użytkownika w systemie Linux kontrole dryfu tokenów w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług przez doctor odmawiają przepisania, zatrzymania lub zrestartowania usługi Gateway ze starszego binarium OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka środowiska wykonawczego i portu Gateway">
    Doctor sprawdza środowisko wykonawcze usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki środowiska wykonawczego Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun albo na ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp i Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione usługi zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi binarne użytkownika, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku. Dzięki temu wygenerowana PATH nadzorcy pozostaje zgodna z tym samym audytem minimalnej PATH, który doctor uruchamia później.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji i metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące obszaru roboczego (kopia zapasowa i system pamięci)">
    Doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli obszar roboczy nie jest jeszcze objęty git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze obszaru roboczego i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
