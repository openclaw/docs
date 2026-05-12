---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niezgodnych wstecznie zmian w konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-12T08:45:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje praktyczne kroki naprawcze.

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

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy restartu/usługi/piaskownicy, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez monitów (naprawy + restarty tam, gdzie jest to bezpieczne).

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

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/piaskownicy wymagające potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gatewaya (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OAuth OpenAI Codex.
    - Ostrzeżenia listy dozwolonych Plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal wymaga symbolu wieloznacznego lub narzędzi należących do Plugin.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/autoryzacja WhatsApp).
    - Migracja starszego klucza kontraktu manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola najwyższego poziomu delivery/payload, payload `provider`, proste zadania awaryjne webhook `notify: true`).
    - Czyszczenie starszej polityki uruchomieniowej całego agenta; polityka uruchomieniowa dostawcy/modelu jest aktywnym selektorem trasy.
    - Czyszczenie nieaktualnej konfiguracji Plugin, gdy wtyczki są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do Plugin są traktowane jako bezwładna konfiguracja izolacji i zachowywane.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspekcja plików blokady sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte kompilacje 2026.4.24.
    - Wykrywanie tombstone’ów odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia nieaktualnych przerwanych flag odzyskiwania, aby start nie traktował dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) przy uruchomieniu lokalnym.
    - Kondycja autoryzacji modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profilu autoryzacji.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszej usługi i wykrywanie dodatkowych gatewayów.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska uruchomieniowego Gateway (usługa zainstalowana, ale niedziałająca; buforowana etykieta launchd).
    - Ostrzeżenia statusu kanału (sprawdzane z działającego gatewaya).
    - Sprawdzenia uprawnień specyficzne dla kanału znajdują się pod `openclaw channels capabilities`; na przykład uprawnienia kanału głosowego Discord są audytowane przez `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Sprawdzenia responsywności WhatsApp dla pogorszonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI.
    - Naprawa tras Codex dla starszych referencji modeli `openai-codex/*` w modelach podstawowych, fallbackach, nadpisaniach Heartbeat/subagent/Compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*`, usuwa nieaktualne przypięcia uruchomieniowe sesji/całego agenta i pozostawia kanoniczne referencje agentów OpenAI na domyślnym harnessie Codex.
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług gatewaya, które przechwyciły wartości shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia najlepszych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
    - Sprawdzenia autoryzacji Gateway dla trybu tokena lokalnego (oferuje generowanie tokena, gdy nie istnieje źródło tokena; nie nadpisuje konfiguracji tokenów SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące podniesienia roli/zakresu, dryf nieaktualnej lokalnej pamięci podręcznej tokena urządzenia oraz dryf autoryzacji sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrapu workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone umiejętności z brakującymi binariami, zmiennymi środowiskowymi, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne umiejętności w `skills.entries`.
    - Sprawdzenie statusu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, klucz zdalnego API lub binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnienie i reset UI Dreams

Scena Dreams w Control UI zawiera akcje **Uzupełnij**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Uzupełnij** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg ugruntowanego dziennika REM i zapisuje odwracalne wpisy uzupełnienia w `DREAMS.md`.
- **Resetuj** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika uzupełnienia.
- **Wyczyść ugruntowane** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie ugruntowane, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze żywego przypomnienia ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów ugruntowanych do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na zwykłą głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w magazynie krótkoterminowego Dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jeśli jest to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu w czasie rzeczywistym to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców oraz przepisuje starsze selektory czasu rzeczywistego najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega też, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego lub wpisów narzędzi należących do Plugin. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych pluginów.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji list dozwolonych, aby zachować istniejące zachowanie dostawców wbudowanych, a
    następnie wskazuje bardziej rygorystyczne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Gdy konfiguracja zawiera wycofane klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Uruchomienie Gateway odmawia starszych formatów konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas startu. Migracje magazynu zadań Cron są również obsługiwane przez `openclaw doctor --fix`.

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
    - starsze selektory Talk realtime najwyższego poziomu (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Dla kanałów z nazwanymi `accounts`, ale z utrzymującymi się wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu powolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem)
    - usuń `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze pozostawia narzędzia obszaru roboczego natywne dla Codex jako natywne

    Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że trasowanie awaryjne może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@earendil-works/pi-ai`. Może to wymusić użycie niewłaściwego API przez modele albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić trasowanie API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor sprawdza też ścieżkę Chrome MCP lokalną dla hosta, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Chrome MCP lokalny dla hosta nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - przeglądarki działającej lokalnie
    - zdalnego debugowania włączonego w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

    Gotowość dotyczy tutaj tylko lokalnych wymagań wstępnych do dołączenia. Existing-session zachowuje obecne limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub profilu raw CDP.

    Ta kontrola **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych przepływów bezgłowych. One nadal używają raw CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos Node/OpenSSL TLS potrafi zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doctor wyświetla wskazówki naprawy specyficzne dla platformy. W systemie macOS z Node z Homebrew poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa nawet wtedy, gdy Gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie trasowania/awaryjne. Niestandardowe proxy i nadpisania obejmujące wyłącznie nagłówki są nadal obsługiwane i nie wyzwalają tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa tras Codex">
    Doctor sprawdza starsze referencje modeli `openai-codex/*`. Natywne trasowanie harnessa Codex używa kanonicznych referencji modeli `openai/*`; tury agenta OpenAI przechodzą przez harness serwera aplikacji Codex zamiast przez ścieżkę OpenClaw PI OpenAI.

    W trybie `--fix` / `--repair` doctor przepisuje objęte zmianą referencje agenta domyślnego i poszczególnych agentów, w tym modele podstawowe, fallbacki, nadpisania heartbeat/subagent/compaction, hooki, nadpisania modeli kanałów i przestarzały utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Intencja Codex przechodzi do wpisów `agentRuntime.id: "codex"` o zakresie dostawcy/modelu dla naprawionych referencji modeli agentów, dzięki czemu profile auth `openai-codex:...` nadal mogą zostać wybrane po zmianie referencji modelu na `openai/*`.
    - Przestarzała konfiguracja runtime całego agenta i utrwalone przypięcia runtime sesji są usuwane, ponieważ wybór runtime ma zakres dostawcy/modelu.
    - Istniejąca polityka runtime dostawcy/modelu jest zachowywana, chyba że naprawiona starsza referencja modelu wymaga trasowania Codex, aby zachować starą ścieżkę auth.
    - Istniejące listy fallbacków modeli są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli przechodzą ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone w sesji `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia o fallbackach i przypięcia profili auth są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną konwersację Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje też wykryte magazyny sesji agentów pod kątem przestarzałego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub runtime poza trasę należącą do Pluginu, taką jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony przestarzały stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modeli runtime, przypięte identyfikatory harnessów, powiązania sesji CLI i automatyczne nadpisania profili auth, gdy ich trasa właścicielska nie jest już skonfigurowana. Jawne wybory modeli użytkownika lub starszej sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypcje:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan auth WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są best-effort i idempotentne; doctor emituje ostrzeżenia, gdy pozostawi starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje + katalog agenta przy uruchamianiu, dzięki czemu historia/auth/modele trafiają do ścieżki dla poszczególnych agentów bez ręcznego uruchamiania doctor. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz po równości strukturalnej, więc różnice wynikające wyłącznie z kolejności kluczy nie wywołują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Pluginów">
    Doctor skanuje wszystkie zainstalowane manifesty Pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, oferuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu cron">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy jest nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania awaryjne Webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy awaryjny mechanizm powiadomień z istniejącym trybem dostarczania innym niż Webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń przestarzały wpis crontab za pomocą `crontab -e`; do bieżących kontroli kondycji używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu przestarzałych plików blokad zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za przestarzałą (martwy PID, starsza niż 30 minut albo żywy PID, który da się udowodnić jako należący do procesu spoza OpenClaw). W trybie `--fix` / `--repair` automatycznie usuwa przestarzałe pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywną gałąź siostrzaną zawierającą ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby historia gateway i czytniki pamięci nie widziały już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje podpowiedź `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu na SD lub eMMC w Linux**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik podczas zapisów sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy niedawne wpisy sesji mają brakujące pliki transkryptów.
    - **Główna sesja „1-wierszowy JSONL”**: zgłasza, gdy główny transkrypt ma tylko jeden wiersz (historia się nie akumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może rozdzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wkrótce wygasną lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokena konfiguracyjnego Anthropic. Monity o odświeżenie pojawiają się tylko podczas uruchomienia interaktywnego (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza też profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/przekroczenia czasu/niepowodzenia uwierzytelniania)
    - dłuższych wyłączeń (niepowodzenia rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się jej rozwiązać albo jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandbox">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy, wygenerowany przez OpenClaw stan przygotowania zależności Plugin w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to przestarzałe wygenerowane korzenie zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności wbudowanych pluginów oraz osierocone lub odzyskane zarządzane kopie npm wbudowanych pluginów `@openclaw/*`, które mogą przesłaniać bieżący wbudowany manifest. Doctor ponownie dowiązuje też pakiet hosta `openclaw` do zarządzanych pluginów npm, które deklarują `peerDependencies.openclaw`, aby lokalne dla pakietu importy runtime, takie jak `openclaw/plugin-sdk/*`, nadal rozwiązywały się po aktualizacjach lub naprawach npm.

    Doctor może też ponownie zainstalować brakujące pobieralne pluginy, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr pluginów nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanałów/dostawców/wyszukiwania oraz skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy pluginów przez menedżera pakietów, gdy pakiet core jest podmieniany; uruchom ponownie `openclaw doctor --fix` po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i przeładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje pluginów pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu gateway. Może też skanować dodatkowe usługi podobne do gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane profilem są uznawane za pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny nadzorca systemowy odpowiada za cykl życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja uruchomieniowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie uruchamia najlepsze możliwe kroki migracji: migrację starszego stanu Matrix i przygotowanie starszego zaszyfrowanego stanu. Oba kroki nie są krytyczne; błędy są logowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń w ramach normalnego przebiegu kondycji.

    Co zgłasza:

    - oczekujące żądania pierwszego parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokena dla zatwierdzonej roli
    - sparowane tokeny, których zakresy odbiegają od zatwierdzonej bazowej konfiguracji parowania
    - lokalnie buforowane wpisy tokenów urządzenia dla bieżącej maszyny, które poprzedzają rotację tokena po stronie gateway lub zawierają przestarzałe metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani automatycznie nie rotuje tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź przestarzały rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka powszechną lukę „już sparowano, ale nadal wymagane jest parowanie”: doctor rozróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od przestarzałego tokena/dryfu tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że linger jest włączony, aby gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, pluginy i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: zlicza Skills kwalifikujące się, z brakującymi wymaganiami i blokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne pluginy; wypisuje identyfikatory pluginów dla wszelkich błędów; zgłasza możliwości pluginów z pakietu.
    - **Ostrzeżenia zgodności Plugin**: wskazuje pluginy, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Zgłasza dla każdego pliku liczbę znaków surowych względem wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie przestarzałego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa też wiszącą konfigurację o zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele Heartbeat nazwane kanałem oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których runtime kanału zniknął, ale konfiguracja nadal każe gateway powiązać się z nim.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa powolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), narzędzie doctor aktualizuje go do szybszego wariantu z plikiem w pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, narzędzie doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, narzędzie doctor pyta o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Narzędzie doctor sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, narzędzie doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, narzędzie doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzić skonfigurowane dane uwierzytelniające bez osłabiania zachowania szybkiego przerywania działania w czasie wykonywania.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, narzędzie doctor zgłasza, że dane uwierzytelniające są skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Narzędzie doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Narzędzie doctor sprawdza, czy skonfigurowany dostawca osadzania wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i można go uruchomić. Jeśli nie, drukuje wskazówki naprawy obejmujące pakiet npm i opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny adres URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Drukuje praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje kolejno każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest zapisany w pamięci podręcznej wynik sondy Gateway (Gateway był sprawny w momencie kontroli), narzędzie doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Narzędzie doctor nie uruchamia świeżego pingu osadzania na domyślnej ścieżce; użyj głębokiego polecenia statusu pamięci, gdy chcesz wykonać kontrolę dostawcy na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie wykonywania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanałów">
    Jeśli Gateway jest sprawny, narzędzie doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji nadzorcy + naprawa">
    Narzędzie doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje narzędzie doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszych usług, ponieważ zewnętrzny nadzorca jest właścicielem tego cyklu życia.
    - W systemie Linux narzędzie doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy zgodna jednostka systemd Gateway jest aktywna. Ignoruje także nieaktywne dodatkowe jednostki podobne do Gateway, które nie są starszymi jednostkami, podczas skanowania zduplikowanych usług, aby pliki usług towarzyszących nie generowały szumu czyszczenia.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez narzędzie doctor weryfikuje SecretRef, ale nie utrwala rozwiązanych wartości tokenu w tekście jawnym w metadanych środowiska usługi nadzorcy.
    - Narzędzie doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła czasu wykonywania zamiast z definicji nadzorcy.
    - Narzędzie doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianach `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, narzędzie doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, narzędzie doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek Linux user-systemd kontrole dryfu tokenu narzędzia doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług przez narzędzie doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie za pomocą `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka czasu wykonywania Gateway + portu">
    Narzędzie doctor sprawdza czas wykonywania usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki czasu wykonywania Gateway">
    Narzędzie doctor ostrzega, gdy usługa Gateway działa na Bun albo ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Narzędzie doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione macOS LaunchAgents używają kanonicznego systemowego PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiowania PATH interaktywnej powłoki, więc systemowe pliki binarne zarządzane przez Homebrew pozostają dostępne, podczas gdy Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, który Node jest rozwiązywany przez procesy potomne. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi binarne użytkownika, ale odgadywane katalogi zapasowe menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Narzędzie doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować uruchomienie narzędzia doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące obszaru roboczego (kopia zapasowa + system pamięci)">
    Narzędzie doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i drukuje wskazówkę dotyczącą kopii zapasowej, jeśli obszar roboczy nie jest jeszcze pod kontrolą git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze obszaru roboczego i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
