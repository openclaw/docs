---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian konfiguracji niezgodnych wstecz
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-07T13:17:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryby bezinterakcyjne i automatyzacji

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Akceptuje wartości domyślne bez pytania (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

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

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia się bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia człowieka. Migracje starszego stanu są uruchamiane automatycznie po wykryciu.

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
    - Opcjonalna aktualizacja wstępna dla instalacji z git (tylko interaktywnie).
    - Sprawdzenie świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + pytanie o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) oraz status Pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu Codex OAuth (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
    - Ostrzeżenia dotyczące listy dozwolonych Pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda symbolu wieloznacznego albo narzędzi należących do Pluginu.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu Pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostarczania/ładunku najwyższego poziomu, `provider` ładunku, proste zadania awaryjne Webhook `notify: true`).
    - Migracja starszej polityki środowiska uruchomieniowego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie przestarzałej konfiguracji Pluginów, gdy Pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odwołania do Pluginów są traktowane jako nieaktywna konfiguracja ograniczająca i zostają zachowane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokad sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte problemem buildy 2026.4.24.
    - Wykrywanie tombstone’ów odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia przestarzałych flag przerwanego odzyskiwania, aby start nie traktował nadal dziecka jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i supervisory">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszych usług i wykrywanie dodatkowych gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego gateway).
    - Sprawdzenia uprawnień specyficznych dla kanału znajdują się pod `openclaw channels capabilities`; na przykład uprawnienia kanału głosowego Discord są audytowane za pomocą `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Sprawdzenia responsywności WhatsApp pod kątem pogorszonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI.
    - Naprawa routingu Codex dla starszych referencji modeli `openai-codex/*` w modelach podstawowych, fallbackach, nadpisaniach Heartbeat/subagenta/Compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*` i wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy Plugin Codex jest zainstalowany, włączony, wnosi harness `codex` i ma używalne OAuth. W przeciwnym razie wybiera `agentRuntime.id: "pi"`.
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług gateway, które przechwyciły wartości shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Sprawdzenia uwierzytelniania Gateway dla trybu lokalnego tokena (oferuje generowanie tokena, gdy nie istnieje źródło tokena; nie nadpisuje konfiguracji tokenów SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze prośby o parowanie, oczekujące podniesienia roli/zakresu, rozjazd przestarzałej lokalnej pamięci podręcznej tokenu urządzenia oraz rozjazd uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i shell">
    - Sprawdzenie systemd linger w Linux.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone Skills z brakującymi binariami, środowiskiem, konfiguracją albo wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne Skills w `skills.entries`.
    - Sprawdzenie statusu uzupełniania shella oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (lokalny model, klucz zdalnego API albo binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Backfill i reset UI Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia grounded REM diary pass i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika backfill.
- **Clear Grounded** usuwa tylko zainscenizowane krótkoterminowe wpisy grounded-only, które pochodzą z historycznego odtwarzania i nie zgromadziły jeszcze live recall ani daily support.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie inscenizują automatycznie kandydatów grounded w aktywnym magazynie promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz zainscenizowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtwarzanie grounded wpływało na normalną ścieżkę głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To inscenizuje trwałych kandydatów grounded w krótkoterminowym magazynie dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git i doctor działa interaktywnie, proponuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu realtime to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców oraz przepisuje starsze selektory realtime najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego albo wpisów narzędzi należących do Pluginu. `tools.allow: ["*"]` dopasowuje tylko narzędzia
    z Pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych Pluginów.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie dołączonego dostawcy, a
    następnie wskazuje bardziej restrykcyjne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Uruchomienie Gateway odmawia starszych formatów konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas startu. Migracje magazynu zadań Cron są także obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfiguracje skonfigurowanych kanałów bez widocznej polityki odpowiedzi → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` najwyższego poziomu
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - starsze selektory Talk czasu rzeczywistego najwyższego poziomu (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - W przypadku kanałów z nazwanymi `accounts`, ale z pozostającymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący cel nazwany/domyślny)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem w trybie zamkniętym)

    Ostrzeżenia doctora obejmują też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

    - Jeśli skonfigurowano co najmniej dwie pozycje `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla listę skonfigurowanych identyfikatorów kont.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, zastępuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` zostaje usunięte

    Doctor audytuje też ścieżkę Chrome MCP lokalną dla hosta, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Chrome MCP lokalne dla hosta nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście Gateway/Node
    - przeglądarki uruchomionej lokalnie
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

    Gotowość tutaj dotyczy tylko lokalnych wymagań wstępnych dołączania. Existing-session zachowuje obecne limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów bezgłowych. Nadal używają one surowego CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor sprawdza punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli próba zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat samopodpisany), doctor wypisuje wskazówki naprawy właściwe dla platformy. W systemie macOS z Node z Homebrew poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` próba jest uruchamiana nawet wtedy, gdy gateway działa poprawnie.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjne. Niestandardowe proxy i nadpisania tylko nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor sprawdza starsze referencje modeli `openai-codex/*`. Natywny routing uprzęży Codex używa kanonicznych referencji modeli `openai/*`; tury agenta OpenAI przechodzą przez uprząż app-server Codex zamiast przez ścieżkę OpenClaw PI OpenAI.

    W trybie `--fix` / `--repair` doctor przepisuje objęte referencje agenta domyślnego i poszczególnych agentów, w tym modele główne, fallbacki, nadpisania heartbeat/subagent/compaction, haki, nadpisania modeli kanałów oraz nieaktualny utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Pasujące środowisko uruchomieniowe agenta staje się `agentRuntime.id: "codex"` tylko wtedy, gdy Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma używalne OAuth.
    - W przeciwnym razie pasujące środowisko uruchomieniowe agenta staje się `agentRuntime.id: "pi"`.
    - Istniejące listy fallbacków modeli są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli przenoszą się ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone sesyjne `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia fallbacków, przypięcia profili uwierzytelniania i przypięcia uprzęży Codex są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „steruj natywną rozmową Codex z czatu albo ją powiąż”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor skanuje też wykryte magazyny sesji agentów pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy należącej do Plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modeli środowiska uruchomieniowego, przypięte identyfikatory uprzęży, powiązania sesji CLI i automatyczne nadpisania profili uwierzytelniania, gdy ich trasa właścicielska nie jest już skonfigurowana. Jawne wybory modeli użytkownika lub starszej sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane na zasadzie best-effort i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta podczas uruchamiania, aby historia/uwierzytelnianie/modele trafiały do ścieżki per-agent bez ręcznego uruchamiania doctora. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie wywołują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące porządki cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania fallback webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje tylko zadania `notify: true`, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback powiadomień z istniejącym trybem dostarczania innym niż Webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab poleceniem `crontab -e`; do bieżących kontroli stanu używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokad zapisu — plików pozostawionych po nietypowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub więcej niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptów z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu historia gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, pyta o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryto niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą macOS**: ostrzega, gdy stan wskazuje ścieżkę w iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan wskazuje źródło montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej się zużywać podczas zapisów sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-line JSONL”**: flaguje sytuację, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy w katalogach domowych istnieje wiele folderów `~/.openclaw` lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może zostać rozdzielona między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracyjnego**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i oferuje zaostrzenie uprawnień do `600`.

  </Accordion>
  <Accordion title="5. Stan autoryzacji modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie autoryzacji, ostrzega, gdy tokeny wygasają/są wygasłe, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil Anthropic OAuth/token jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Prompty odświeżania pojawiają się tylko podczas uruchamiania interaktywnego (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), doctor zgłasza, że wymagana jest ponowna autoryzacja, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza też profile autoryzacji, które są tymczasowo niedostępne z powodu:

    - krótkich cooldownów (limity szybkości/limity czasu/błędy autoryzacji)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor weryfikuje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się jej rozwiązać lub jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandbox">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan stagingu zależności pluginów wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane katalogi główne zależności, stare katalogi etapów instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności bundled-plugin oraz osierocone lub odzyskane zarządzane kopie npm dołączonych pluginów `@openclaw/*`, które mogą przesłaniać bieżący dołączony manifest.

    Doctor może też ponownie instalować brakujące pluginy do pobrania, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr pluginów nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanału/dostawcy/wyszukiwania oraz skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy pluginów przez menedżera pakietów, gdy pakiet core jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany plugin nadal wymaga odzyskania. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje pluginów pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu gateway. Może też skanować dodatkowe usługi podobne do gateway i wypisywać wskazówki czyszczenia. Usługi OpenClaw gateway nazwane według profilu są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi gateway na poziomie użytkownika, ale istnieje usługa OpenClaw gateway na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy systemowy nadzorca odpowiada za cykl życia gateway.

  </Accordion>
  <Accordion title="8b. Migracja Startup Matrix">
    Gdy konto kanału Matrix ma oczekującą lub wykonalną migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia migrację best-effort: migrację starszego stanu Matrix i przygotowanie starszego szyfrowanego stanu. Oba kroki nie są fatalne; błędy są logowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf autoryzacji">
    Doctor sprawdza teraz stan parowania urządzeń jako część zwykłego przebiegu kontroli stanu.

    Co zgłasza:

    - oczekujące pierwsze żądania parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy id urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalnie buforowane wpisy tokenu urządzenia dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i zatwierdź ponownie nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal pojawia się wymóg parowania”: doctor rozróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby gateway pozostał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan przestrzeni roboczej (skills, pluginy i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu przestrzeni roboczej dla domyślnego agenta:

    - **Stan Skills**: zlicza kwalifikujące się, z brakującymi wymaganiami i blokowane przez listę dozwolonych skills.
    - **Starsze katalogi przestrzeni roboczej**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi przestrzeni roboczej istnieją obok bieżącej przestrzeni roboczej.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne pluginy; wypisuje identyfikatory pluginów dla wszystkich błędów; zgłasza możliwości pluginów pakietu.
    - **Ostrzeżenia zgodności Plugin**: flaguje pluginy, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap przestrzeni roboczej (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Zgłasza dla każdego pliku surowe vs. wstrzyknięte liczby znaków, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego pluginu kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa też wiszącą konfigurację w zakresie kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele Heartbeat nazwane od kanału oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których runtime kanału zniknął, ale konfiguracja nadal każe gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z plikiem cache.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache, doctor automatycznie regeneruje cache.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor pyta o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

  </Accordion>
  <Accordion title="12. Kontrole autoryzacji Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnej autoryzacji tokenu gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor oferuje wygenerowanie go.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano SecretRef tokenu.

  </Accordion>
  <Accordion title="12b. Naprawy uwzględniające SecretRef tylko do odczytu">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane dane uwierzytelniające bez osłabiania szybkiego zgłaszania błędów w czasie działania.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie gatewaya, gdy wygląda on na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania w pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzania dla wyszukiwania w pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wyświetla wskazówki naprawy obejmujące pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): sprawdza, czy klucz API jest obecny w środowisku albo magazynie uwierzytelniania. Jeśli go brakuje, wyświetla praktyczne wskazówki naprawy.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest zapisany w pamięci podręcznej wynik sondy gatewaya (gateway był sprawny w czasie kontroli), doctor porównuje ten wynik z konfiguracją widoczną dla CLI i odnotowuje każdą rozbieżność. Doctor nie uruchamia nowego pingu osadzania w domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia statusu kanałów">
    Jeśli gateway jest sprawny, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd od network-online i opóźnienia ponownego uruchomienia). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gatewaya. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszej usługi, ponieważ zewnętrzny nadzorca jest właścicielem tego cyklu życia.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca jednostka systemd gatewaya jest aktywna. Ignoruje także nieaktywne, niestarsze, dodatkowe jednostki podobne do gatewaya podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie powodowały szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła czasu działania zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek systemd użytkownika w systemie Linux kontrole rozbieżności tokenu w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług przez doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi gatewaya ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka czasu działania i portu Gateway">
    Doctor sprawdza środowisko uruchomieniowe usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także kolizje portów na porcie gatewaya (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki czasu działania Gateway">
    Doctor ostrzega, gdy usługa gatewaya działa na Bun albo ścieżce Node zarządzanej przez wersje (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżera wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione LaunchAgenty macOS używają kanonicznej systemowej PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiowania PATH z interaktywnej powłoki, więc Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają, który Node jest rozwiązywany przez procesy potomne. Usługi Linuksa nadal zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi binarne użytkownika, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby odnotować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci przestrzeni roboczej, gdy go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej, jeśli przestrzeń robocza nie jest jeszcze objęta git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze przestrzeni roboczej i kopii zapasowej git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
