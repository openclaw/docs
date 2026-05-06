---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian konfiguracji powodujących niezgodność wsteczną
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-06T09:12:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

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

    Akceptuj wartości domyślne bez monitowania (w tym kroki restartu/usługi/naprawy sandboxa, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Zastosuj zalecane naprawy bez monitowania (naprawy + restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Zastosuj także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchom bez monitów i zastosuj tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia przez człowieka. Starsze migracje stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuj usługi systemowe pod kątem dodatkowych instalacji gateway (launchd/systemd/schtasks).

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
    - Sprawdzenie świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i statusu pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji rozmowy ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Ostrzeżenia dotyczące listy dozwolonych pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda symboli wieloznacznych lub narzędzi należących do pluginów.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola najwyższego poziomu delivery/payload, payload `provider`, proste zastępcze zadania webhook `notify: true`).
    - Migracja starszej polityki środowiska uruchomieniowego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie nieaktualnej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do pluginów są traktowane jako nieaktywna konfiguracja ograniczająca i zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte problemem kompilacje 2026.4.24.
    - Wykrywanie tombstone’ów odzyskiwania po restarcie zablokowanych subagentów, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profili uwierzytelniania.
    - Wykrywanie dodatkowego katalogu przestrzeni roboczej (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszych usług i wykrywanie dodatkowych gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego gateway).
    - Sprawdzenia responsywności WhatsApp dla pogorszonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI.
    - Naprawa tras Codex dla starszych referencji modeli `openai-codex/*` w modelach głównych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*` i wybiera `agentRuntime.id: "codex"` tylko wtedy, gdy plugin Codex jest zainstalowany, włączony, dostarcza uprząż `codex` i ma użyteczny OAuth. W przeciwnym razie wybiera `agentRuntime.id: "pi"`.
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia najlepszych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
    - Sprawdzenia uwierzytelniania Gateway dla trybu lokalnego tokenu (oferuje generowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenów).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące podniesienia roli/zakresu, drift nieaktualnej lokalnej pamięci podręcznej tokenów urządzeń i drift uwierzytelniania sparowanych rekordów).

  </Accordion>
  <Accordion title="Przestrzeń robocza i powłoka">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrap przestrzeni roboczej (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone umiejętności z brakującymi plikami binarnymi, środowiskiem, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączać niedostępne umiejętności w `skills.entries`.
    - Sprawdzenie statusu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność przestrzeni roboczej pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie wsteczne i reset interfejsu Dreams

Scena Dreams w Control UI zawiera działania **Uzupełnij wstecz**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu pracy grounded dreaming. Te działania używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Uzupełnij wstecz** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnej przestrzeni roboczej, uruchamia przebieg dziennika grounded REM i zapisuje odwracalne wpisy uzupełnienia wstecznego do `DREAMS.md`.
- **Resetuj** usuwa z `DREAMS.md` tylko oznaczone wpisy dziennika z uzupełnienia wstecznego.
- **Wyczyść ugruntowane** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze żywego recall ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na normalną ścieżkę głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Przygotowuje to trwałych kandydatów grounded w krótkoterminowym magazynie dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Obecna publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu w czasie rzeczywistym to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawcy oraz przepisuje starsze selektory najwyższego poziomu czasu rzeczywistego (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symboli wieloznacznych lub wpisów narzędzi należących do pluginów. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych pluginów.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie dostawców w pakiecie,
    a następnie wskazuje bardziej restrykcyjne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway automatycznie uruchamia też migracje doctor podczas startu, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań cron obsługuje `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfiguracje skonfigurowanych kanałów bez widocznej polityki odpowiedzi → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższego poziomu `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - starsze selektory realtime Talk najwyższego poziomu (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - W przypadku kanałów z nazwanymi `accounts`, ale z pozostałymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchomienie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem)

    Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wymienia skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli dodano ręcznie `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić użycie niewłaściwego API dla modeli albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` zmienia się na `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor sprawdza też ścieżkę Chrome MCP lokalną dla hosta, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Chrome MCP lokalny dla hosta nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - przeglądarki uruchomionej lokalnie
    - zdalnego debugowania włączonego w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

    Gotowość dotyczy tutaj wyłącznie lokalnych wymagań wstępnych dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów bezgłowych. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor odpytuje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos Node/OpenSSL TLS może zweryfikować łańcuch certyfikatów. Jeśli próba kończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasłym certyfikatem lub certyfikatem samopodpisanym), doctor wyświetla wskazówki naprawcze właściwe dla platformy. W macOS z Node z Homebrew poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` próba jest wykonywana nawet wtedy, gdy Gateway działa prawidłowo.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjne. Niestandardowe proxy i nadpisania obejmujące tylko nagłówki są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa trasy Codex">
    Doctor sprawdza starsze odwołania do modeli `openai-codex/*`. Natywny routing mechanizmu Codex używa kanonicznych odwołań do modeli `openai/*` oraz `agentRuntime.id: "codex"`, aby tura przechodziła przez mechanizm serwera aplikacji Codex zamiast przez ścieżkę OpenClaw PI OpenAI.

    W trybie `--fix` / `--repair` doctor przepisuje dotknięte odwołania agenta domyślnego i poszczególnych agentów, w tym modele podstawowe, modele awaryjne, nadpisania heartbeat/subagent/compaction, hooki, nadpisania modeli kanałów oraz nieaktualny utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` zmienia się na `openai/gpt-*`.
    - Pasujące środowisko wykonawcze agenta zmienia się na `agentRuntime.id: "codex"` tylko wtedy, gdy Codex jest zainstalowany, włączony, udostępnia mechanizm `codex` i ma użyteczny OAuth.
    - W przeciwnym razie pasujące środowisko wykonawcze agenta zmienia się na `agentRuntime.id: "pi"`.
    - Istniejące listy modeli awaryjnych są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli są przenoszone ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia o modelach awaryjnych, przypięcia profili autoryzacji i przypięcia mechanizmu Codex są naprawiane we wszystkich odkrytych magazynach sesji agentów.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną konwersację Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje też odkryte magazyny sesji agentów pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub środowiska wykonawczego z trasy należącej do Plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modeli środowiska wykonawczego, przypięte identyfikatory mechanizmów, powiązania sesji CLI i automatyczne nadpisania profili autoryzacji, gdy ich trasa właścicielska nie jest już skonfigurowana. Jawne wybory modeli użytkownika lub starszych sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ na dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypcje:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan autoryzacji WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane best-effort i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze katalogi jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta przy uruchamianiu, aby historia/autoryzacja/modele trafiły do ścieżki przypisanej do agenta bez ręcznego uruchamiania doctor. Normalizacja dostawcy Talk/mapy dostawców porównuje teraz według równości strukturalnej, więc różnice wynikające wyłącznie z kolejności kluczy nie wywołują już powtarzanych, bezczynnych zmian `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Plugin">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, oferuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu Cron">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy zostanie nadpisane) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania awaryjne webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje tylko zadania `notify: true`, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback powiadomień z istniejącym trybem dostarczania innym niż webhook, Doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux Doctor ostrzega również, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli stanu używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokady zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agentów pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywną gałąź siostrzaną zawierającą ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` Doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby historia Gateway i czytniki pamięci nie widziały już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, dane uwierzytelniające, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje podpowiedź `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki wspierane synchronizacją mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu na SD lub eMMC w systemie Linux**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i danych uwierzytelniających.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji nie mają plików transkryptu.
    - **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może rozdzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, Doctor przypomina, aby uruchomić go na zdalnym hoście (tam znajduje się stan).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Stan uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil Anthropic OAuth/tokenu jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracyjnego Anthropic. Prompty odświeżania pojawiają się tylko podczas pracy interaktywnej (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` lub dostawca każe zalogować się ponownie), Doctor raportuje, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor raportuje również profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/limity czasu/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, Doctor waliduje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozwiązać lub jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, Doctor sprawdza obrazy Docker i proponuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy, wygenerowany przez OpenClaw stan etapowania zależności Plugin w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane korzenie zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności wbudowanych Plugin oraz osierocone lub odzyskane zarządzane kopie npm wbudowanych Plugin `@openclaw/*`, które mogą przesłaniać bieżący wbudowany manifest.

    Doctor może również ponownie zainstalować brakujące pobieralne Plugin, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanału/dostawcy/wyszukiwania oraz skonfigurowane runtime agentów. Podczas aktualizacji pakietów Doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet core jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i przeładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i podpowiedzi czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu Gateway. Może również skanować dodatkowe usługi podobne do Gateway i wypisywać podpowiedzi czyszczenia. Usługi Gateway OpenClaw nazwane profilami są uznawane za pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, Doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy systemowy nadzorca zarządza cyklem życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja rozruchowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub wykonalną migrację stanu starszej wersji, Doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie uruchamia kroki migracji best-effort: migrację starszego stanu Matrix oraz przygotowanie starszego stanu szyfrowanego. Oba kroki są niekrytyczne; błędy są logowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część normalnego przebiegu kontroli stanu.

    Co raportuje:

    - oczekujące pierwsze żądania parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalne buforowane wpisy tokenu urządzenia dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway lub zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - obróć świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    Zamyka to częstą lukę „już sparowane, ale nadal wymagane parowanie”: Doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, Doctor upewnia się, że lingering jest włączony, aby gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, Plugin i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: zlicza kwalifikujące się, niespełniające wymagań oraz zablokowane przez listę dozwolonych Skills.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne Plugin; wymienia identyfikatory Plugin dla wszelkich błędów; raportuje możliwości wbudowanych Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza Plugin, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka Plugin**: pokazuje wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku surowe i wstrzyknięte liczby znaków, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, Doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnych Plugin kanałów">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa również wiszącą konfigurację w zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele Heartbeat, które nazwały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których runtime kanału zniknął, ale konfiguracja nadal każe gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), Doctor uaktualnia go do szybszego wariantu z plikiem cache.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache, Doctor automatycznie regeneruje cache.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, Doctor prosi o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, Doctor proponuje wygenerowanie go.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, Doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano żadnego tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy świadome SecretRef w trybie tylko do odczytu">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane dane uwierzytelniające bez osłabiania fail-fast w czasie działania.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef w trybie tylko do odczytu co polecenia z rodziny statusu do ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązanie zamiast ulegać awarii lub błędnie zgłaszać brak tokena.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie gateway, gdy wygląda na nieprawidłowo działający.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawcze obejmujące pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Wypisuje praktyczne wskazówki naprawcze, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy Gateway z pamięci podręcznej (Gateway był zdrowy w chwili sprawdzenia), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingu osadzeń w domyślnej ścieżce; użyj głębokiego polecenia statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanałów">
    Jeśli Gateway jest zdrowy, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji supervisora">
    Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora oraz czyszczenie starszych usług, ponieważ zewnętrzny supervisor jest właścicielem tego cyklu życia.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd gateway jest aktywna. Ignoruje też nieaktywne, niestarsze dodatkowe jednostki podobne do gateway podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie generowały szumu związanego z czyszczeniem.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor waliduje SecretRef, ale nie utrwala rozwiązanych wartości tokena w postaci zwykłego tekstu w metadanych środowiska usługi supervisora.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości ładowały się ze źródła czasu działania zamiast z definicji supervisora.
    - Doctor wykrywa, kiedy polecenie usługi nadal przypina stare `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` jest nieustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - W przypadku jednostek Linux user-systemd kontrole rozbieżności tokenów w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług w doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka czasu działania Gateway i portu">
    Doctor sprawdza czas działania usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także kolizje portów na porcie gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki czasu działania Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione macOS LaunchAgents używają kanonicznej systemowej PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, dzięki czemu Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, który Node rozpoznają procesy potomne. Usługi Linux nadal zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi binarne użytkownika, ale odgadywane katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszystkie zmiany konfiguracji i stempluje metadane kreatora, aby odnotować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące obszaru roboczego (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli obszar roboczy nie jest jeszcze pod kontrolą git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze obszaru roboczego i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
