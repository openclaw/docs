---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niekompatybilnych zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-10T19:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację i stan, sprawdza kondycję oraz podaje wykonalne kroki naprawcze.

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

    Akceptuj wartości domyślne bez monitów (w tym kroki naprawy restartu, usługi i piaskownicy, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Zastosuj zalecane naprawy bez monitów (naprawy i restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Zastosuj także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchom bez monitów i stosuj tylko bezpieczne migracje (normalizacja konfiguracji oraz przeniesienia stanu na dysku). Pomija działania restartu, usługi i piaskownicy, które wymagają potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Przeskanuj usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracyjny:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji z git (tylko interaktywnie).
    - Kontrola aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Kontrola kondycji i monit o restart.
    - Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) oraz stanu plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome oraz gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Kontrola wymagań wstępnych TLS dla profili OAuth OpenAI Codex.
    - Ostrzeżenia dotyczące listy dozwolonych plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda symbolu wieloznacznego lub narzędzi należących do plugin.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostawy/ładunku najwyższego poziomu, `provider` w ładunku, proste zadania awaryjne Webhook `notify: true`).
    - Czyszczenie starszej polityki runtime całego agenta; polityka runtime dostawcy/modelu jest aktywnym selektorem trasy.
    - Czyszczenie przestarzałej konfiguracji plugin, gdy pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odwołania do plugin są traktowane jako nieaktywna konfiguracja izolująca i zachowywane.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspekcja plików blokad sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte problemem buildy 2026.4.24.
    - Wykrywanie tombstone odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia przestarzałych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało nadal procesu podrzędnego jako przerwanego przez restart.
    - Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Kontrole uprawnień pliku konfiguracyjnego (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszej usługi i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Kontrole runtime Gateway (usługa zainstalowana, ale niedziałająca; buforowana etykieta launchd).
    - Ostrzeżenia o stanie kanału (sondowane z działającego Gateway).
    - Kontrole uprawnień specyficzne dla kanałów znajdują się w `openclaw channels capabilities`; na przykład uprawnienia kanału głosowego Discord są audytowane za pomocą `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kontrole responsywności WhatsApp dla pogorszonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowane lokalne klienty TUI.
    - Naprawa tras Codex dla starszych referencji modeli `openai-codex/*` w modelach głównych, fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*`, usuwa przestarzałe przypięcia runtime sesji/całego agenta i pozostawia kanoniczne referencje agentów OpenAI w domyślnym harness Codex.
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Kontrole najlepszych praktyk runtime Gateway (Node kontra Bun, ścieżki menedżerów wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Kontrole uwierzytelniania Gateway dla trybu tokena lokalnego (oferuje generowanie tokena, gdy nie istnieje żadne źródło tokena; nie nadpisuje konfiguracji SecretRef tokena).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące podniesienia roli/zakresu, dryf przestarzałej lokalnej pamięci podręcznej tokena urządzenia oraz dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Kontrola systemd linger w Linuksie.
    - Kontrola rozmiaru pliku bootstrap workspace (ostrzeżenia o ucięciu/bliskości limitu dla plików kontekstu).
    - Kontrola gotowości Skills dla domyślnego agenta; raportuje dozwolone Skills z brakującymi plikami binarnymi, środowiskiem, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne Skills w `skills.entries`.
    - Kontrola stanu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Kontrola gotowości dostawcy osadzeń wyszukiwania pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Kontrole instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację i metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnienie wsteczne i reset Dreams UI

Scena Dreams w Control UI zawiera akcje **Uzupełnij wstecz**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu ugruntowanego Dreaming. Te akcje używają metod RPC w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Uzupełnij wstecz** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia ugruntowany przebieg dziennika REM i zapisuje odwracalne wpisy uzupełnienia wstecznego do `DREAMS.md`.
- **Resetuj** usuwa tylko te oznaczone wpisy dziennika uzupełnienia wstecznego z `DREAMS.md`.
- **Wyczyść ugruntowane** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie ugruntowane, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze bieżącego przywołania ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów w aktywnym magazynie promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na normalną głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu czasu rzeczywistego to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców oraz przepisuje starsze selektory czasu rzeczywistego najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego lub wpisów narzędzi należących do plugin. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych plugin.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie dołączonych dostawców, a
    następnie wskazuje na bardziej restrykcyjne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Uruchamianie Gateway odrzuca starsze formaty konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas uruchamiania. Migracje magazynu zadań Cron są również obsługiwane przez `openclaw doctor --fix`.

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
    - W przypadku kanałów z nazwanymi `accounts`, ale utrzymującymi się wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` ustawiono na przyszłą lub nieznaną wartość enum, zamiast kończyć się niepowodzeniem w trybie fail-closed)
    - usuń `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze zachowuje natywne narzędzia przestrzeni roboczej Codex jako natywne

    Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` ani `accounts.default`, doctor ostrzega, że routing zastępczy może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` ustawiono na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu podłączania lokalnego dla hosta Chrome MCP:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` zostaje usunięte

    Doctor sprawdza też lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` albo skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Lokalny dla hosta Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - przeglądarki działającej lokalnie
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na podłączenie w przeglądarce

    Gotowość tutaj dotyczy wyłącznie lokalnych wymagań wstępnych podłączenia. Existing-session zachowuje obecne limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo profilu surowego CDP.

    To sprawdzenie **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat albo certyfikat samopodpisany), doctor wyświetla wskazówki naprawy specyficzne dla platformy. Na macOS z Homebrew Node naprawą zwykle jest `brew postinstall ca-certificates`. Z `--deep` sonda uruchamia się nawet wtedy, gdy gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć albo przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/rezerwowe. Niestandardowe serwery proxy i nadpisania ograniczone do nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa trasy Codex">
    Doctor sprawdza starsze referencje modeli `openai-codex/*`. Natywny routing uprzęży Codex używa kanonicznych referencji modeli `openai/*`; tury agenta OpenAI przechodzą przez uprząż serwera aplikacji Codex zamiast przez ścieżkę OpenClaw PI OpenAI.

    W trybie `--fix` / `--repair` doctor przepisuje objęte zmianą referencje agenta domyślnego i poszczególnych agentów, w tym modele podstawowe, fallbacki, nadpisania heartbeat/subagent/compaction, hooki, nadpisania modeli kanałów i przestarzały utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Intencja Codex przechodzi do wpisów `agentRuntime.id: "codex"` o zakresie dostawca/model dla naprawionych referencji modeli agentów, aby profile uwierzytelniania `openai-codex:...` nadal mogły być wybierane po zmianie referencji modelu na `openai/*`.
    - Przestarzała konfiguracja środowiska uruchomieniowego całego agenta i utrwalone przypięcia środowiska uruchomieniowego sesji są usuwane, ponieważ wybór środowiska uruchomieniowego ma zakres dostawca/model.
    - Istniejąca polityka środowiska uruchomieniowego dostawca/model jest zachowywana, chyba że naprawiona starsza referencja modelu wymaga routingu Codex, aby zachować starą ścieżkę uwierzytelniania.
    - Istniejące listy fallbacków modeli są zachowywane z przepisanymi starszymi wpisami; skopiowane ustawienia dla poszczególnych modeli są przenoszone ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone sesyjne `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia fallbacków i przypięcia profili uwierzytelniania są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „steruj natywną rozmową Codex z czatu albo ją powiąż”.
    - `/acp ...` albo `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje też wykryte magazyny sesji agentów pod kątem przestarzałego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy należącej do plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony przestarzały stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modelu środowiska uruchomieniowego, przypięte identyfikatory uprzęży, powiązania sesji CLI i automatyczne nadpisania profili uwierzytelniania, gdy trasa, do której należą, nie jest już skonfigurowana. Jawne wybory modelu sesji użytkownika lub starszej sesji są zgłaszane do ręcznego przeglądu i pozostają bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ dysku)">
    Doctor może zmigrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypcje:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są best-effort i idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje + katalog agenta podczas uruchamiania, aby historia/uwierzytelnianie/modele trafiły do ścieżki dla danego agenta bez ręcznego uruchamiania doctor. Normalizacja dostawcy Talk/mapy dostawców porównuje teraz przez równość strukturalną, więc różnice dotyczące wyłącznie kolejności kluczy nie wywołują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów plugin">
    Doctor skanuje wszystkie manifesty zainstalowanych pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz zostaje usunięty bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu cron">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy został nadpisany) pod kątem starych kształtów zadań, które scheduler nadal akceptuje dla zgodności.

    Bieżące czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - proste starsze zadania zapasowe Webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje tylko zadania `notify: true`, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy zapasowy mechanizm powiadomień z istniejącym trybem dostarczania innym niż Webhook, Doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux Doctor ostrzega także, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez obecny OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy Cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli kondycji używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokady zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal jest aktywny, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID, starsza niż 30 minut albo aktywny PID, co do którego można udowodnić, że należy do procesu innego niż OpenClaw). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokady; w przeciwnym razie wyświetla notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem uruchomieniowym OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` Doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, aby historia Gateway i czytniki pamięci nie widziały już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracisz sesje, poświadczenia, dzienniki i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje podpowiedź `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan wskazuje ścieżkę pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki wspierane synchronizacją mogą powodować wolniejsze we/wy oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu na SD lub eMMC w systemie Linux**: ostrzega, gdy stan wskazuje źródło montowania `mmcblk*`, ponieważ losowe we/wy oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik podczas zapisów sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji nie mają plików transkrypcji.
    - **Główna sesja „1-wierszowy JSONL”**: oznacza sytuację, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może rozdzielić się między instalacjami).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, Doctor przypomina, aby uruchomić go na zdalnym hoście (tam znajduje się stan).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wkrótce wygasną lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracyjnego Anthropic. Prompty odświeżania pojawiają się tylko podczas działania interaktywnego (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth kończy się trwałą porażką (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), Doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wyświetla dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza także profile uwierzytelniania, które są tymczasowo bezużyteczne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/przekroczenia czasu/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, Doctor waliduje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie uda się go rozwiązać albo jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, Doctor sprawdza obrazy Docker i oferuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan etapowania zależności Plugin wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane katalogi główne zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności wbudowanych Plugin oraz osierocone lub odzyskane zarządzane kopie npm wbudowanych Plugin `@openclaw/*`, które mogą przesłaniać bieżący wbudowany manifest.

    Doctor może także ponownie zainstalować brakujące pobieralne Plugin, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanałów/dostawców/wyszukiwania oraz skonfigurowane środowiska uruchomieniowe agentów. Podczas aktualizacji pakietów Doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet rdzeniowy jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą Doctor/instalacji/aktualizacji.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i podpowiedzi czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu Gateway. Może także skanować dodatkowe usługi podobne do Gateway i wyświetlać podpowiedzi czyszczenia. Usługi Gateway OpenClaw nazwane profilami są traktowane jako pierwszorzędne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, Doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny nadzorca jest właścicielem cyklu życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja Matrix przy uruchamianiu">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, Doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki są niefatalne; błędy są rejestrowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń jako część normalnego przebiegu kontroli kondycji.

    Co raportuje:

    - oczekujące żądania pierwszego parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalnie buforowane wpisy tokenu urządzenia dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wyświetla dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal pojawia się wymaganie parowania”: Doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od nieaktualnego dryfu tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, Doctor zapewnia, że lingering jest włączony, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, Plugin i starsze katalogi)">
    Doctor wyświetla podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Status Skills**: zlicza kwalifikujące się Skills, Skills z brakującymi wymaganiami oraz Skills zablokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Status Plugin**: zlicza włączone/wyłączone/błędne Plugin; wyświetla identyfikatory Plugin dla wszelkich błędów; raportuje możliwości wbudowanego Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza Plugin, które mają problemy ze zgodnością z bieżącym środowiskiem uruchomieniowym.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku surową liczbę znaków względem liczby znaków po wstrzyknięciu, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz całkowitą liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte albo blisko limitu, Doctor wyświetla wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa także wiszącą konfigurację o zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele Heartbeat, które nazwały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, w których środowisko uruchomieniowe kanału zniknęło, ale konfiguracja nadal każe Gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), Doctor aktualizuje go do szybszego wariantu z plikiem pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, Doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie w ogóle nie jest skonfigurowane, Doctor prosi o jego zainstalowanie (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego tokenu Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy świadome SecretRef w trybie tylko do odczytu">
    Niektóre przepływy napraw muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania runtime typu fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązanie zamiast ulegać awarii lub błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Sprawdzenie kondycji Gateway + ponowne uruchomienie">
    Doctor uruchamia sprawdzenie kondycji i proponuje ponowne uruchomienie gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca embeddingów wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy obejmujące pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Wypisuje praktyczne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy gateway z pamięci podręcznej (gateway był sprawny w momencie sprawdzania), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pingu embeddingów na domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia statusu kanału">
    Jeśli gateway jest sprawny, doctor uruchamia sondę statusu kanału i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd od network-online i opóźnienia ponownego uruchomienia). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal raportuje kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchamianie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora i czyszczenie starszych usług, ponieważ tym cyklem życia zarządza zewnętrzny supervisor.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca im jednostka systemd Gateway jest aktywna. Ignoruje także nieaktywne, dodatkowe, niestarsze jednostki podobne do Gateway podczas skanowania zduplikowanych usług, aby pliki usług towarzyszących nie generowały szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja/naprawa usługi przez doctor waliduje SecretRef, ale nie utrwala rozwiązanych wartości tokena w postaci zwykłego tekstu w metadanych środowiska usługi supervisora.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła runtime zamiast z definicji supervisora.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy, podając użyteczne wskazówki.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
    - Dla jednostek user-systemd w systemie Linux kontrole dryfu tokena wykonywane przez doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi wykonywane przez doctor odmawiają przepisania, zatrzymania lub zrestartowania usługi Gateway ze starszego binarium OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie za pomocą `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway i portu">
    Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale w rzeczywistości nie działa. Sprawdza także kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżera wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor oferuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione macOS LaunchAgents używają kanonicznego systemowego PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, więc binaria systemowe zarządzane przez Homebrew pozostają dostępne, podczas gdy Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, który Node jest rozwiązywany przez procesy potomne. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi user-bin, ale odgadywane katalogi zapasowe menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji i metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (kopia zapasowa i system pamięci)">
    Doctor sugeruje system pamięci przestrzeni roboczej, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli przestrzeń robocza nie jest jeszcze objęta git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze przestrzeni roboczej i kopii zapasowej git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
