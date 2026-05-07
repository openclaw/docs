---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niezgodnych zmian w konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-07T01:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie do naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

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

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy restartu/usługi/piaskownicy, gdy mają zastosowanie).

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

    Uruchamia się bez monitów i stosuje tylko bezpieczne migracje (normalizację konfiguracji i przenoszenie stanu na dysku). Pomija działania restartu/usługi/piaskownicy wymagające potwierdzenia przez człowieka. Migracje stanu ze starszych wersji uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji z git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji i monit o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalizacja konfiguracji dla wartości ze starszych wersji.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Ostrzeżenia o liście dozwolonych Plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal wymaga wildcard lub narzędzi należących do Plugin.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostarczania/ładunku najwyższego poziomu, `provider` ładunku, proste zadania awaryjne Webhook `notify: true`).
    - Migracja starszej polityki środowiska wykonawczego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie nieaktualnej konfiguracji Plugin, gdy Plugin są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do Plugin są traktowane jako nieaktywna konfiguracja ograniczająca i są zachowywane.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte problemem kompilacje 2026.4.24.
    - Wykrywanie znaczników tombstone zablokowanego odzyskiwania po restarcie subagenta, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby start nie traktował nadal procesu potomnego jako przerwanego przez restart.
    - Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Kontrole uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu obszaru roboczego (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszych usług i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Kontrole środowiska wykonawczego Gateway (usługa zainstalowana, ale nieuruchomiona; zapisana w pamięci podręcznej etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego Gateway).
    - Kontrole responsywności WhatsApp pod kątem pogorszonej kondycji pętli zdarzeń Gateway, gdy lokalne klienty TUI nadal działają; `--fix` zatrzymuje tylko zweryfikowane lokalne klienty TUI.
    - Naprawa tras Codex dla starszych odwołań modeli `openai-codex/*` w modelach głównych, fallbackach, nadpisaniach Heartbeat/subagenta/Compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*` i wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy Plugin Codex jest zainstalowany, włączony, dostarcza harness `codex` i ma użyteczne OAuth. W przeciwnym razie wybiera `agentRuntime.id: "pi"`.
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie osadzonego środowiska proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Kontrole najlepszych praktyk środowiska wykonawczego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Kontrole uwierzytelniania Gateway dla lokalnego trybu tokenu (oferuje wygenerowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji tokenów SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, nieaktualny dryf lokalnej pamięci podręcznej tokenu urządzenia oraz dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrap obszaru roboczego (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone Skills z brakującymi plikami binarnymi, środowiskiem, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne Skills w `skills.entries`.
    - Sprawdzenie statusu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy osadzania wyszukiwania w pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Kontrole instalacji ze źródeł (niezgodność obszaru roboczego pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację i metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i reset interfejsu Dreams

Scena Dreams w Control UI zawiera akcje **Uzupełnij**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu pracy ugruntowanego Dreaming. Te akcje używają metod RPC w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Uzupełnij** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym obszarze roboczym, uruchamia ugruntowany przebieg dziennika REM i zapisuje odwracalne wpisy uzupełnienia w `DREAMS.md`.
- **Resetuj** usuwa z `DREAMS.md` tylko oznaczone wpisy dziennika uzupełnienia.
- **Wyczyść ugruntowane** usuwa tylko przygotowane, wyłącznie ugruntowane krótkoterminowe wpisy, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze aktywnego przypomnienia ani codziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów w aktywnym krótkoterminowym magazynie promocji, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na normalną ścieżkę głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, proponuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu w czasie rzeczywistym to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców oraz przepisuje starsze selektory czasu rzeczywistego najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega też, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    wpisów wildcard lub narzędzi należących do Plugin. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z Plugin, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych Plugin.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować dotychczasowe zachowanie dołączonych dostawców, a
    następnie wskazuje bardziej restrykcyjne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Start Gateway odmawia obsługi starszych formatów konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` przy starcie. Migracje magazynu zadań Cron są także obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfiguracje skonfigurowanego kanału bez widocznej polityki odpowiedzi → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższego poziomu `bindings`
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
    - W przypadku kanałów z nazwanymi `accounts`, ale z pozostawionymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do awansowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem zamkniętym)

    Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` zostaje usunięte

    Doctor sprawdza też ścieżkę Chrome MCP lokalną dla hosta, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć ustawienia po stronie Chrome za Ciebie. Chrome MCP lokalny dla hosta nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście gateway/node
    - lokalnie uruchomionej przeglądarki
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość dotyczy tutaj tylko lokalnych wymagań wstępnych do dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów headless. Nadal używają one surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor odpytuje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos Node/OpenSSL TLS może zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doctor wypisuje wskazówki naprawcze specyficzne dla platformy. W systemie macOS z Homebrew Node poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa nawet wtedy, gdy gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy Codex OAuth, z której nowsze wydania korzystają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu razem z Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/fallback. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa trasy Codex">
    Doctor sprawdza starsze referencje modeli `openai-codex/*`. Natywny routing uprzęży Codex używa kanonicznych referencji modeli `openai/*` oraz `agentRuntime.id: "codex"`, aby tura przechodziła przez uprząż serwera aplikacji Codex zamiast ścieżki OpenClaw PI OpenAI.

    W trybie `--fix` / `--repair` doctor przepisuje dotknięte referencje agenta domyślnego i poszczególnych agentów, w tym modele podstawowe, fallbacki, nadpisania heartbeat/subagent/compaction, hooki, nadpisania modeli kanałów oraz nieaktualny utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Pasujące środowisko uruchomieniowe agenta staje się `agentRuntime.id: "codex"` tylko wtedy, gdy Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma użyteczny OAuth.
    - W przeciwnym razie pasujące środowisko uruchomieniowe agenta staje się `agentRuntime.id: "pi"`.
    - Istniejące listy fallbacków modeli są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli są przenoszone ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone sesyjne `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia fallback, przypięcia profili uwierzytelniania oraz przypięcia uprzęży Codex są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną rozmowę Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie trasy sesji">
    Doctor skanuje też wykryte magazyny sesji agentów pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy należącej do Plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modeli środowiska uruchomieniowego, przypięte identyfikatory uprzęży, powiązania sesji CLI oraz automatyczne nadpisania profili uwierzytelniania, gdy ich właścicielska trasa nie jest już skonfigurowana. Jawne wybory modelu użytkownika lub starszej sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

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

    Te migracje działają w trybie best-effort i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta przy uruchomieniu, aby historia/uwierzytelnianie/modele trafiły do ścieżki przypisanej do agenta bez ręcznego uruchamiania doctor. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz przez równość strukturalną, więc różnice wyłącznie w kolejności kluczy nie wyzwalają już powtarzanych zmian bez efektu po `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Plugin">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu oferuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz zostaje usunięty bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu cron">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które scheduler nadal akceptuje dla zgodności.

    Bieżące czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania payload `provider` → jawne `delivery.channel`
    - nieprawidłowe utrwalone sentinele cron `payload.model` (`"default"`, `"null"`, puste ciągi, JSON `null`) → usunięte nadpisanie modelu
    - proste starsze zadania fallback Webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy mechanizm fallback notify z istniejącym trybem dostarczania innym niż webhook, doctor wyświetla ostrzeżenie i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez obecne OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli stanu używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokady zapisu — plików pozostawionych po nienormalnym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal jest aktywny, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub więcej niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta w poszukiwaniu zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptów z 2026.4.24: porzucona tura użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywna siostrzana gałąź zawierająca ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, dzięki czemu historia Gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, dane uwierzytelniające, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą macOS**: ostrzega, gdy stan wskazuje na iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan wskazuje na źródło montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i danych uwierzytelniających.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji nie mają plików transkryptu.
    - **Główna sesja „1-wierszowy JSONL”**: sygnalizuje, gdy główny transkrypt ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy w katalogach domowych istnieje wiele folderów `~/.openclaw` lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może rozdzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na hoście zdalnym (tam znajduje się stan).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Stan uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil Anthropic OAuth/token jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Prompty odświeżania pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca informuje, że trzeba zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor raportuje też profile uwierzytelniania, które są tymczasowo bezużyteczne z powodu:

    - krótkich okresów cooldown (limity szybkości/timeouty/awarie uwierzytelniania)
    - dłuższych wyłączeń (awarie rozliczeń/kredytu)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odniesienie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie uda się go rozwiązać lub jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje zbudowanie albo przełączenie na starsze nazwy, jeśli brakuje bieżącego obrazu.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan stagingu zależności Plugin generowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane korzenie zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności bundlowanych Plugin oraz osierocone lub odzyskane zarządzane kopie npm bundlowanych Plugin `@openclaw/*`, które mogą przesłaniać bieżący bundlowany manifest.

    Doctor może też ponownie zainstalować brakujące pobieralne Plugin, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanału/dostawcy/wyszukiwania oraz skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy Plugin przez menedżer pakietów, gdy pakiet core jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchomienie Gateway i ponowne wczytanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu gateway. Może też skanować dodatkowe usługi podobne do gateway i wypisywać wskazówki czyszczenia. Usługi OpenClaw gateway nazwane profilem są traktowane jako pierwszorzędne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi gateway na poziomie użytkownika, ale istnieje usługa OpenClaw gateway na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy systemowy nadzorca odpowiada za cykl życia gateway.

  </Accordion>
  <Accordion title="8b. Migracja startowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki są niefatalne; błędy są logowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część zwykłego przebiegu kontroli stanu.

    Co raportuje:

    - oczekujące pierwsze żądania parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdzie identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy odchyliły się poza zatwierdzoną bazę parowania
    - lokalne wpisy pamięci podręcznej tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - obróć świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal pojawia się wymaganie parowania”: doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor zapewnia włączenie lingering, aby gateway pozostał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan workspace (Skills, Plugin i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu workspace dla domyślnego agenta:

    - **Stan Skills**: zlicza Skills kwalifikujące się, z brakującymi wymaganiami i blokowane przez listę dozwolonych.
    - **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace istnieją obok bieżącego workspace.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne Plugin; wypisuje identyfikatory Plugin dla wszystkich błędów; raportuje możliwości bundlowanych Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza Plugin, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka Plugin**: pokazuje wszelkie ostrzeżenia lub błędy emitowane przez rejestr Plugin w czasie ładowania.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`, `CLAUDE.md` albo inne wstrzyknięte pliki kontekstu) zbliżają się do skonfigurowanego budżetu znaków lub go przekraczają. Raportuje dla każdego pliku surową liczbę znaków względem liczby wstrzykniętej, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa też wiszącą konfigurację o zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele heartbeat, które wskazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których runtime kanału już nie istnieje, ale konfiguracja nadal żąda, aby gateway się z nim powiązał.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z plikiem cache.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache, doctor automatycznie regeneruje cache.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor prosi o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor oferuje wygenerowanie go.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza wygenerowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu uwzględniające SecretRef">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane dane uwierzytelniające bez osłabiania działania runtime fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusów na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale jest niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, lecz niedostępne, i pomija automatyczne rozwiązanie zamiast ulegać awarii albo błędnie zgłaszać brak tokena.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania w pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania w pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny URL modelu dostępnego do pobrania. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): sprawdza, czy klucz API jest obecny w środowisku albo magazynie autoryzacji. Wypisuje praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy gateway z pamięci podręcznej (gateway był sprawny w chwili kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje każdą rozbieżność. Doctor nie uruchamia świeżego pingu osadzeń w domyślnej ścieżce; użyj głębokiego polecenia statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia statusu kanałów">
    Jeśli gateway jest sprawny, doctor uruchamia sondę statusu kanału i zgłasza ostrzeżenia wraz z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji supervisora">
    Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem brakujących lub przestarzałych wartości domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora i czyszczenie starszych usług, ponieważ zewnętrzny supervisor zarządza tym cyklem życia.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca mu jednostka gateway systemd jest aktywna. Ignoruje też nieaktywne, nienależące do starszego typu dodatkowe jednostki podobne do gateway podczas skanowania zduplikowanych usług, aby pliki usług towarzyszących nie generowały szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi doctor weryfikuje SecretRef, ale nie utrwala rozwiązanych wartości tokena w postaci zwykłego tekstu w metadanych środowiska usługi supervisora.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd albo Windows Scheduled Task osadziły inline, i przepisuje metadane usługi tak, aby te wartości ładowały się ze źródła runtime zamiast z definicji supervisora.
    - Doctor wykrywa, kiedy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek systemd użytkownika w systemie Linux kontrole dryfu tokena w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portu">
    Doctor sprawdza runtime usługi (PID, ostatni status zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun albo ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione macOS LaunchAgents używają kanonicznego systemowego PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiowania PATH z interaktywnej powłoki, dzięki czemu katalogi Volta, asdf, fnm, pnpm i innych menedżerów wersji nie zmieniają tego, które procesy potomne Node są rozwiązywane. Usługi Linux nadal zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi user-bin, ale odgadnięte katalogi zapasowe menedżerów wersji są zapisywane w PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszystkie zmiany konfiguracji i stempluje metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące obszaru roboczego (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli obszar roboczy nie jest jeszcze objęty git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze obszaru roboczego i kopii zapasowej git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
