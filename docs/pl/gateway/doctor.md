---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niekompatybilnych zmian w konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie Doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-04-30T09:53:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację i stan, sprawdza kondycję oraz podaje wykonalne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryby headless i automatyzacji

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy restartu, usługi i sandboxa, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez monitów (naprawy i restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji i przeniesienia stanu na dysku). Pomija działania restartu, usługi i sandboxa, które wymagają potwierdzenia przez użytkownika. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji z git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji i monit o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) oraz status Plugin.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/autoryzacja WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola dostarczania/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne webhook `notify: true`).
    - Migracja starszej polityki środowiska uruchomieniowego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie przestarzałej konfiguracji Plugin, gdy pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odwołania do Plugin są traktowane jako nieaktywna konfiguracja ograniczająca i zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja pliku blokady sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte błędem kompilacje 2026.4.24.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja autoryzacji modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączone dla profili autoryzacji.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i supervisory">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego Gateway).
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska wbudowanego proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Autoryzacja, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dotyczące otwartych polityk DM.
    - Sprawdzenia autoryzacji Gateway dla lokalnego trybu tokenu (proponuje wygenerowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji tokenu SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, rozjazd przestarzałej lokalnej pamięci podręcznej tokenów urządzeń oraz rozjazd autoryzacji sparowanych rekordów).

  </Accordion>
  <Accordion title="Workspace i powłoka">
    - Sprawdzenie linger systemd w Linuksie.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu lub zbliżaniu się do limitu dla plików kontekstu).
    - Sprawdzenie statusu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, klucz zdalnego API albo binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację i metadane kreatora.

  </Accordion>
</AccordionGroup>

## Backfill i reset UI Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu Gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg dziennika grounded REM i zapisuje odwracalne wpisy backfill w `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika backfill.
- **Clear Grounded** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie grounded, które pochodzą z odtwarzania historycznego i nie zgromadziły jeszcze aktywnego przywołania ani codziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded w aktywnym magazynie promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtwarzanie grounded wpływało na normalną ścieżkę głębokiej promocji, użyj zamiast tego przepływu CLI:

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
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze zostały znalezione.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc przestarzałe konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższy poziom `bindings`
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
    - Dla kanałów z nazwanymi `accounts`, ale pozostającymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenosi te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuwa `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuwa `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchomienie Gateway pomija też dostawców, których `api` ustawiono na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem w trybie fail-closed)

    Ostrzeżenia doctor obejmują także wskazówki dotyczące konta domyślnego dla kanałów wielokontowych:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić kierowanie modeli do niewłaściwego API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego względem hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor sprawdza także ścieżkę Chrome MCP lokalną względem hosta, gdy używasz `defaultProfile: "user"` albo skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego połączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Chrome MCP lokalny względem hosta nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście gateway/node
    - przeglądarki uruchomionej lokalnie
    - zdalnego debugowania włączonego w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy wyłącznie lokalnych wymagań dołączania. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ten test **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowano profil OAuth OpenAI Codex, doctor sonduje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat albo certyfikat samopodpisany), doctor wypisuje wskazówki naprawy specyficzne dla platformy. W systemie macOS z Node z Homebrew naprawą jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa nawet wtedy, gdy gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy OAuth Codex">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przysłaniać wbudowaną ścieżkę dostawcy OAuth Codex, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu razem z OAuth Codex, aby można było usunąć albo przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/rezerwowe. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia tras Plugin Codex">
    Gdy wbudowany Plugin Codex jest włączony, doctor sprawdza także, czy podstawowe referencje modeli `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Ta kombinacja jest prawidłowa, gdy chcesz używać OAuth/subskrypcji Codex przez PI, ale łatwo pomylić ją z natywną uprzężą serwera aplikacji Codex. Doctor ostrzega i wskazuje jawny kształt serwera aplikacji: `openai/*` plus `agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są prawidłowe:

    - `openai-codex/*` + PI oznacza „użyj OAuth/subskrypcji Codex przez normalny runner OpenClaw”.
    - `openai/*` + `runtime: "codex"` oznacza „uruchom osadzoną turę przez natywny serwer aplikacji Codex”.
    - `/codex ...` oznacza „kontroluj albo powiąż natywną rozmowę Codex z czatu”.
    - `/acp ...` albo `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Pozostaw ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszych `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane według najlepszych starań i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI również automatycznie migruje starsze sesje i katalog agenta podczas uruchamiania, aby historia/uwierzytelnianie/modele trafiły do ścieżki per agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy talk/mapy dostawców porównuje teraz przez równość strukturalną, więc różnice wyłącznie w kolejności kluczy nie wywołują już powtarzanych zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Plugin">
    Doctor skanuje wszystkie manifesty zainstalowanych pluginów pod kątem przestarzałych kluczy funkcjonalności najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu Cron">
    Doctor sprawdza także magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy zostało nadpisane) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla kompatybilności.

    Bieżące porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania rezerwowe Webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy mechanizm rezerwowy notify z istniejącym trybem dostarczania innym niż Webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokady zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, czy PID nadal żyje, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID albo starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokady; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby historia gateway i czytniki pamięci nie widziały już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje podpowiedź `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) albo `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD albo eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD albo eMMC może być wolniejsze i zużywać nośnik szybciej podczas zapisów sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii oraz unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkryptów.
    - **Główna sesja „1-wierszowy JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może zostać podzielona między instalacje).
    - **Przypomnienie trybu zdalnego**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają/są wygasłe, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Monity odświeżania pojawiają się tylko podczas pracy interaktywnej (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza także profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów cooldown (limity szybkości/limity czasu/niepowodzenia uwierzytelniania)
    - dłuższych wyłączeń (niepowodzenia rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się jej rozwiązać albo jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandbox">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie albo przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Zależności runtime wbudowanych pluginów">
    Doctor weryfikuje zależności runtime tylko dla wbudowanych pluginów, które są aktywne w bieżącej konfiguracji albo włączone przez domyślne ustawienie ich wbudowanego manifestu, na przykład `plugins.entries.discord.enabled: true`, starsze `channels.discord.enabled: true`, skonfigurowane referencje `models.providers.*` / modeli agenta albo domyślnie włączony wbudowany Plugin bez własności dostawcy. Jeśli jakichkolwiek brakuje, doctor zgłasza pakiety i instaluje je w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne pluginy nadal używają `openclaw plugins install` / `openclaw plugins update`; doctor nie instaluje zależności dla dowolnych ścieżek pluginów.

    Podczas naprawy przez doctor instalacje npm dołączonych zależności środowiska wykonawczego zgłaszają postęp przez spinner w sesjach TTY oraz okresowy postęp liniowy w wyjściu potokowanym/bez interfejsu. Gateway i lokalny CLI mogą także naprawiać aktywne zależności środowiska wykonawczego dołączonych Plugin na żądanie przed zaimportowaniem dołączonego Plugin. Te instalacje są ograniczone do katalogu głównego instalacji środowiska wykonawczego Plugin, uruchamiane z wyłączonymi skryptami, nie zapisują blokady pakietów i są chronione blokadą katalogu głównego instalacji, aby równoczesne uruchomienia CLI lub Gateway nie modyfikowały tego samego drzewa `node_modules` w tym samym czasie.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu Gateway. Może także skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane według profilu są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny nadzorca zarządza cyklem życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja uruchomieniowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są rejestrowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część zwykłej kontroli kondycji.

    Co raportuje:

    - oczekujące żądania pierwszego parowania
    - oczekujące podwyższenia roli dla już sparowanych urządzeń
    - oczekujące rozszerzenia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy wykraczają poza zatwierdzoną bazę parowania
    - lokalnie buforowane wpisy tokenu urządzenia dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne kolejne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - wygeneruj świeży token przez rotację za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    Zamyka to typową lukę „już sparowane, ale nadal wymagane jest parowanie”: doctor odróżnia teraz pierwsze parowanie od oczekujących podwyższeń roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych nadawców albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor zapewnia włączenie linger, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, Plugin i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: liczy Skills kwalifikujące się, z niespełnionymi wymaganiami i zablokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan Plugin**: liczy włączone/wyłączone/błędne Plugin; wypisuje identyfikatory Plugin dla wszystkich błędów; raportuje możliwości dołączonych Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza Plugin, które mają problemy ze zgodnością z bieżącym środowiskiem wykonawczym.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku liczbę znaków surowych i wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte albo blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa także wiszącą konfigurację zakresu kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele heartbeat, które wskazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których środowisko wykonawcze kanału zniknęło, ale konfiguracja nadal każe Gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z plikiem pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor prosi o jego instalację (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano żadnego tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast środowiska wykonawczego.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusów na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor raportuje, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozpoznawanie zamiast ulegać awarii albo błędnie raportować brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i można go uruchomić. Jeśli nie, wypisuje wskazówki naprawy obejmujące pakiet npm i opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny adres URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku albo magazynie uwierzytelniania. Wypisuje praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest zapisany w pamięci podręcznej wynik sondy Gateway (Gateway był zdrowy w chwili kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingowania osadzeń na domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w środowisku wykonawczym.

  </Accordion>
  <Accordion title="14. Ostrzeżenia stanu kanału">
    Jeśli Gateway jest zdrowy, doctor uruchamia sondę stanu kanału i raportuje ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal raportuje kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszych usług, ponieważ ten cykl życia należy do zewnętrznego nadzorcy.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca jednostka Gateway systemd jest aktywna. Ignoruje także nieaktywne, niestarsze dodatkowe jednostki podobne do Gateway podczas skanowania zduplikowanych usług, aby pliki usług towarzyszących nie tworzyły szumu związanego z czyszczeniem.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor waliduje SecretRef, ale nie utrwala rozpoznanych wartości tokenu w tekście jawnym w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa wartości środowiska usługi zarządzane przez `.env`/oparte na SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły bezpośrednio, i przepisuje metadane usługi, aby te wartości były ładowane ze źródła środowiska wykonawczego zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianach `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - W przypadku jednostek systemd użytkownika w systemie Linux kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi przez doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Środowisko uruchomieniowe Gateway + diagnostyka portów">
    Doctor sprawdza środowisko uruchomieniowe usługi (PID, ostatni status zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale w rzeczywistości nie działa. Sprawdza także kolizje portów na porcie gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki środowiska uruchomieniowego Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione usługi zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi plików binarnych użytkownika, ale odgadnięte zapasowe katalogi menedżerów wersji są zapisywane w `PATH` usługi tylko wtedy, gdy te katalogi istnieją na dysku. Dzięki temu wygenerowany `PATH` nadzorcy pozostaje zgodny z tym samym audytem minimalnego `PATH`, który doctor uruchamia później.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i dodaje metadane kreatora, aby zapisać uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci przestrzeni roboczej, gdy go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej, jeśli przestrzeń robocza nie znajduje się jeszcze w git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze przestrzeni roboczej i kopii zapasowej git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
