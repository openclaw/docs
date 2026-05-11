---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niezgodnych wstecznie zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawy'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-11T20:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

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

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez monitów (naprawy + restarty, gdy jest to bezpieczne).

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

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia przez użytkownika. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

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
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit o restart.
    - Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) oraz stan pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Ostrzeżenia dotyczące listy dozwolonych pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda wieloznacznika lub narzędzi należących do pluginu.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/autoryzacja WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola dostarczania/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne webhook `notify: true`).
    - Czyszczenie starszej polityki runtime całego agenta; polityka runtime dostawcy/modelu jest aktywnym selektorem trasy.
    - Czyszczenie nieaktualnej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do pluginów są traktowane jako bezczynna konfiguracja izolacyjna i są zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte wersje 2026.4.24.
    - Wykrywanie tombstone’ów odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby startup nie traktował dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja autoryzacji modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu autoryzacji.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia runtime Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
    - Ostrzeżenia o stanie kanałów (sondowane z działającego Gateway).
    - Sprawdzenia uprawnień specyficzne dla kanału znajdują się w `openclaw channels capabilities`; na przykład uprawnienia kanału głosowego Discord są audytowane za pomocą `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Sprawdzenia responsywności WhatsApp pod kątem pogorszonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowane lokalne klienty TUI.
    - Naprawa tras Codex dla starszych odwołań do modeli `openai-codex/*` w modelach głównych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*`, usuwa nieaktualne przypięcia runtime sesji/całego agenta i pozostawia kanoniczne odwołania do agentów OpenAI na domyślnym harnessie Codex.
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług Gateway, które przechwyciły wartości shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk runtime Gateway (Node vs Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Autoryzacja, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Sprawdzenia autoryzacji Gateway dla trybu tokenu lokalnego (oferuje wygenerowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenu).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, nieaktualne rozbieżności lokalnej pamięci podręcznej tokenu urządzenia i rozbieżności autoryzacji sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i shell">
    - Sprawdzenie systemd linger na Linux.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone skills z brakującymi binariami, środowiskiem, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne skills w `skills.entries`.
    - Sprawdzenie stanu uzupełniania shell i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub plik binarny QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i reset Dreams UI

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla workflow grounded dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg dziennika grounded REM i zapisuje odwracalne wpisy backfill w `DREAMS.md`.
- **Reset** usuwa tylko te oznaczone wpisy dziennika backfill z `DREAMS.md`.
- **Clear Grounded** usuwa tylko etapowane krótkoterminowe wpisy wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze żywego recall ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie etapują automatycznie kandydatów grounded do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz etapowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na normalną głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To etapie trwałych kandydatów grounded do krótkoterminowego magazynu dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git i doctor działa interaktywnie, proponuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu realtime to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców oraz przepisuje starsze selektory realtime najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega także, gdy `plugins.allow` jest niepuste, a polityka narzędzi używa
    wieloznacznika lub wpisów narzędzi należących do pluginu. `tools.allow: ["*"]` dopasowuje tylko narzędzia
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych pluginów.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie bundled provider,
    a następnie wskazuje na bardziej rygorystyczne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Startup Gateway odmawia starszych formatów konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas startupu. Migracje magazynu zadań cron są również obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfiguracje skonfigurowanych kanałów, którym brakuje polityki widocznych odpowiedzi → `messages.groupChat.visibleReplies: "message_tool"`
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
    - W przypadku kanałów z nazwanymi `accounts`, ale z utrzymującymi się wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do wypromowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący cel nazwany/domyślny)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem zamkniętym)
    - usuń `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze zachowuje natywne narzędzia obszaru roboczego Codex jako natywne

    Ostrzeżenia narzędzia doctor obejmują też wskazówki dotyczące kont domyślnych dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wymienia skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Zastąpienia dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, zastępuje to wbudowany katalog OpenCode z `@earendil-works/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć zastąpienie i przywrócić routing API + koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje też lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` albo skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Lokalny dla hosta Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście Gateway/Node
    - przeglądarki uruchomionej lokalnie
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

    Gotowość tutaj dotyczy tylko lokalnych wymagań wstępnych dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów bezinterfejsowych. Nadal używają one surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowano profil OpenAI Codex OAuth, doctor sonduje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli sonda nie powiedzie się z błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat albo certyfikat z podpisem własnym), doctor wypisuje wskazówki naprawcze właściwe dla platformy. Na macOS z Node z Homebrew naprawą zwykle jest `brew postinstall ca-certificates`. Z `--deep` sonda działa nawet wtedy, gdy Gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Zastąpienia dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć albo przepisać nieaktualne zastąpienie transportu i odzyskać wbudowane zachowanie routingu/fallbacku. Niestandardowe proxy i zastąpienia ograniczone do nagłówków są nadal obsługiwane i nie wyzwalają tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa trasy Codex">
    Doctor sprawdza starsze odwołania do modeli `openai-codex/*`. Natywne trasowanie mechanizmu Codex używa kanonicznych odwołań do modeli `openai/*`; tury agentów OpenAI przechodzą przez mechanizm app-server Codex zamiast przez ścieżkę OpenAI w OpenClaw PI.

    W trybie `--fix` / `--repair` doctor przepisuje objęte odwołania agenta domyślnego i poszczególnych agentów, w tym modele główne, fallbacki, zastąpienia Heartbeat/subagenta/Compaction, hooki, zastąpienia modeli kanałów i nieaktualny utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Intencja Codex jest przenoszona do wpisów `agentRuntime.id: "codex"` ograniczonych zakresem dostawcy/modelu dla naprawionych odwołań do modeli agenta, aby profile uwierzytelniania `openai-codex:...` nadal można było wybierać po zmianie odwołania do modelu na `openai/*`.
    - Nieaktualna konfiguracja środowiska uruchomieniowego całego agenta i utrwalone przypięcia środowiska uruchomieniowego sesji są usuwane, ponieważ wybór środowiska uruchomieniowego jest ograniczony zakresem dostawcy/modelu.
    - Istniejąca polityka środowiska uruchomieniowego dostawcy/modelu jest zachowywana, chyba że naprawione starsze odwołanie do modelu wymaga routingu Codex, aby zachować starą ścieżkę uwierzytelniania.
    - Istniejące listy modeli zapasowych są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli są przenoszone ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone w sesjach `modelProvider`/`providerOverride`, `model`/`modelOverride`, komunikaty o modelach zapasowych i przypięcia profili uwierzytelniania są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „kontrolowanie lub powiązanie natywnej konwersacji Codex z poziomu czatu”.
    - `/acp ...` albo `runtime: "acp"` oznacza „użycie zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje też wykryte magazyny sesji agentów pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy, której właścicielem jest Plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modelu środowiska uruchomieniowego, przypięte identyfikatory mechanizmu, powiązania sesji CLI i automatyczne zastąpienia profilu uwierzytelniania, gdy ich trasa właścicielska nie jest już skonfigurowana. Jawne wybory modeli dokonane przez użytkownika albo pochodzące ze starszych sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

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

    Te migracje są podejmowane w miarę możliwości i idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje + katalog agenta przy uruchamianiu, aby historia/uwierzytelnianie/modele trafiły do ścieżki dla danego agenta bez ręcznego uruchomienia doctor. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz według równości strukturalnej, więc różnice wynikające wyłącznie z kolejności kluczy nie wyzwalają już powtarzających się bezoperacyjnych zmian `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Plugin">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu Cron">
    Doctor sprawdza też magazyn zadań Cron (domyślnie `~/.openclaw/cron/jobs.json` albo `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Aktualne porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania awaryjne Webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy awaryjny mechanizm powiadamiania z istniejącym trybem dostarczania innym niż Webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega również, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżące OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab poleceniem `crontab -e`; używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status` do bieżących kontroli stanu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem przestarzałych plików blokad zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za przestarzałą (martwy PID, starsza niż 30 minut albo żywy PID, który można udowodnić jako należący do procesu innego niż OpenClaw). W trybie `--fix` / `--repair` automatycznie usuwa przestarzałe pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzucony zwrot użytkownika z wewnętrznym kontekstem uruchomieniowym OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby historia Gateway i czytniki pamięci nie widziały już zduplikowanych zwrotów.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan wskazuje ścieżkę pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze operacje wejścia/wyjścia oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan wskazuje źródło montowania `mmcblk*`, ponieważ losowe operacje wejścia/wyjścia na SD lub eMMC mogą być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji nie mają plików transkryptu.
    - **Główna sesja „1-wierszowy JSONL”**: flaguje sytuację, gdy główny transkrypt ma tylko jeden wiersz (historia się nie kumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może rozdzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracyjnego**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Stan uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wkrótce wygasną lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Prompty odświeżania pojawiają się tylko podczas działania interaktywnego (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca informujący, że trzeba zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza również profile uwierzytelniania tymczasowo niedostępne z powodu:

    - krótkich okresów odnowienia (limity szybkości/przekroczenia czasu/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie uda się jej rozwiązać albo jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandbox">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie albo przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan przygotowywania zależności Plugin generowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane korzenie zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności dołączonych Plugin oraz osierocone lub odzyskane zarządzane kopie npm dołączonych Plugin `@openclaw/*`, które mogą przesłaniać bieżący dołączony manifest.

    Doctor może również ponownie zainstalować brakujące pobieralne Plugin, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanałów/dostawców/wyszukiwania oraz skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet rdzenia jest wymieniany; uruchom ponownie `openclaw doctor --fix` po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu Gateway. Może również skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane profilami są traktowane jako pełnoprawne i nie są flagowane jako „dodatkowe”.

    W systemie Linux, jeśli usługa Gateway na poziomie użytkownika jest brakująca, ale istnieje usługa Gateway OpenClaw na poziomie systemowym, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny nadzorca zarządza cyklem życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja Startup Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki są niekrytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i rozjazd uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część normalnego przebiegu kontroli stanu.

    Co zgłasza:

    - oczekujące prośby o pierwsze parowanie
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy wykraczają poza zatwierdzoną bazę parowania
    - lokalne buforowane wpisy tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie próśb o parowanie ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące prośby za pomocą `openclaw devices list`
    - zatwierdź dokładną prośbę za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal wymagane jest parowanie”: doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od rozjazdu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, Plugin i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: zlicza kwalifikujące się Skills, Skills z brakującymi wymaganiami oraz Skills zablokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne Plugin; wymienia identyfikatory Plugin dla wszelkich błędów; zgłasza możliwości dołączonych Plugin.
    - **Ostrzeżenia zgodności Plugin**: flaguje Plugin, które mają problemy ze zgodnością z bieżącym środowiskiem uruchomieniowym.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` albo inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków lub go przekraczają. Zgłasza dla każdego pliku liczby znaków surowych względem wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnych kanałów Plugin">
    Gdy `openclaw doctor --fix` usuwa brakujący kanał Plugin, usuwa również osieroconą konfigurację w zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele Heartbeat, które nazwały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których środowisko uruchomieniowe kanału zniknęło, ale konfiguracja nadal każe gateway się z nim związać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu pliku z pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor prosi o jego zainstalowanie (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego tokenu Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale jest niedostępny, doctor ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu, świadome SecretRef">
    Niektóre przepływy napraw muszą sprawdzić skonfigurowane poświadczenia bez osłabiania zachowania szybkiego kończenia przy błędzie w czasie działania.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu, aby wykonywać ukierunkowane naprawy konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + ponowne uruchomienie">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wyświetla wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Wyświetla praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy Gateway z pamięci podręcznej (Gateway był zdrowy w momencie kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingu osadzeń w domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz wykonać kontrolę dostawcy na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanału">
    Jeśli Gateway jest zdrowy, doctor uruchamia sondę statusu kanału i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji nadzorcy + naprawa">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub przestarzałych wartości domyślnych (np. zależności systemd network-online i opóźnienia ponownego uruchomienia). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalowanie/uruchamianie/ponowne uruchamianie/bootstrap usługi, przepisywanie konfiguracji nadzorcy oraz czyszczenie starszych usług, ponieważ tym cyklem życia zarządza zewnętrzny nadzorca.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, dodatkowe jednostki przypominające Gateway, które nie są starszego typu, podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie generowały zbędnego szumu czyszczenia.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w tekście jawnym do metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa wartości środowiska usługi zarządzane przez `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła runtime zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
    - W przypadku jednostek user-systemd w systemie Linux kontrole dryfu tokenu wykonywane przez doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi przez doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portu">
    Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun albo ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione LaunchAgents w systemie macOS używają kanonicznej systemowej ścieżki PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, dzięki czemu binaria systemowe zarządzane przez Homebrew pozostają dostępne, a katalogi Volta, asdf, fnm, pnpm i innych menedżerów wersji nie zmieniają tego, który Node rozwiązują procesy potomne. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi binarne użytkownika, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci workspace, gdy go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej, jeśli workspace nie jest jeszcze objęty git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze workspace i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
