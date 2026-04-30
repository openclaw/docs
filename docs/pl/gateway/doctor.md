---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian w konfiguracji łamiących kompatybilność
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-04-30T16:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje wykonalne kroki naprawcze.

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

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

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

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia się bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracyjny:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji z git (tylko interaktywnie).
    - Sprawdzenie świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit o restart.
    - Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) i stanu pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o maskowaniu Codex OAuth (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola delivery/payload najwyższego poziomu, `provider` w payload, proste zadania awaryjne webhooka `notify: true`).
    - Migracja starszej polityki runtime agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie nieaktualnej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do pluginów są traktowane jako nieaktywna konfiguracja izolująca i zostają zachowane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja pliku blokady sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptu sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte kompilacje 2026.4.24.
    - Wykrywanie tombstone odzyskiwania po restarcie zaklinowanego subagenta, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby startup nie traktował dalej dziecka jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracyjnego (chmod 600) przy uruchomieniu lokalnym.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia runtime Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia o stanie kanałów (sondowane z uruchomionego Gateway).
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska wbudowanego proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk runtime Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
    - Sprawdzenia uwierzytelniania Gateway dla trybu tokenu lokalnego (oferuje generowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenów).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, nieaktualny dryf lokalnej pamięci podręcznej tokenu urządzenia oraz dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i powłoka">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrapu workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie stanu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy osadzania wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i reset interfejsu Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu Gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg dziennika grounded REM i zapisuje odwracalne wpisy uzupełnienia w `DREAMS.md`.
- **Reset** usuwa tylko te oznaczone wpisy dziennika uzupełnienia z `DREAMS.md`.
- **Clear Grounded** usuwa tylko przygotowane wpisy krótkoterminowe wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze żywego recall ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na normalną głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Przygotowuje to trwałych kandydatów grounded w magazynie krótkoterminowego Dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, przed uruchomieniem doctor oferuje aktualizację (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawcy.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera wycofane klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron obsługuje `openclaw doctor --fix`.

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
    - Dla kanałów z nazwanymi `accounts`, ale utrzymującymi się wartościami kanału najwyższego poziomu dla pojedynczego konta, przenosi te wartości o zakresie konta do wypromowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuwa `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuwa `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (startup Gateway także pomija dostawców, których `api` ustawiono na przyszłą lub nieznaną wartość enum, zamiast kończyć się niepowodzeniem w trybie zamkniętym)

    Ostrzeżenia doctor zawierają także wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` ani `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, zastępuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje także lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Lokalny dla hosta Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - lokalnie uruchomionej przeglądarki
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy wyłącznie lokalnych wymagań wstępnych dołączania. Existing-session zachowuje obecne limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ta kontrola **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Gdy skonfigurowano profil OpenAI Codex OAuth, doctor sprawdza punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL potrafi zweryfikować łańcuch certyfikatów. Jeśli test zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat albo certyfikat samopodpisany), doctor wypisuje wskazówki naprawy właściwe dla platformy. W macOS z Node z Homebrew naprawą jest zwykle `brew postinstall ca-certificates`. Z `--deep` test działa nawet wtedy, gdy Gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/fallback. Niestandardowe proxy i nadpisania obejmujące tylko nagłówki są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Gdy włączony jest dołączony Plugin Codex, doctor sprawdza także, czy główne referencje modeli `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Ta kombinacja jest prawidłowa, gdy chcesz używać uwierzytelniania Codex OAuth/subskrypcji przez PI, ale łatwo pomylić ją z natywnym harness app-server Codex. Doctor ostrzega i wskazuje jawną postać app-server: `openai/*` plus `agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są prawidłowe:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subskrypcji przez zwykły runner OpenClaw”.
    - `openai/*` + `runtime: "codex"` oznacza „uruchom osadzony turn przez natywny app-server Codex”.
    - `/codex ...` oznacza „kontroluj albo podłącz natywną rozmowę Codex z czatu”.
    - `/acp ...` albo `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Pozostaw ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji i transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są best-effort i idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta przy uruchomieniu, aby historia/uwierzytelnianie/modele trafiły do ścieżki per-agent bez ręcznego uruchamiania doctor. Ujednolicanie dostawcy talk/mapy dostawców porównuje teraz według równości strukturalnej, więc różnice wynikające wyłącznie z kolejności kluczy nie wywołują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor sprawdza także magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy został nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące porządki cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w payload → jawne `delivery.channel`
    - proste starsze zadania fallback webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym trybem dostarczania innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor skanuje każdy katalog sesji agenta pod kątem przestarzałych plików blokad zapisu — plików pozostawionych, gdy sesja zakończyła się nienormalnie. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal żyje, wiek blokady oraz czy uznaje się ją za przestarzałą (martwy PID albo starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa przestarzałe pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu prompt z 2026.4.24: porzucony turn użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywny sibling zawierający ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, aby czytniki historii gateway i pamięci nie widziały już zduplikowanych turnów.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) albo `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O i wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD albo eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD albo eMMC może być wolniejsze i szybciej się zużywać przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy najnowsze wpisy sesji mają brakujące pliki transkryptu.
    - **Główna sesja „1-line JSONL”**: sygnalizuje, gdy główny transkrypt ma tylko jeden wiersz (historia się nie kumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może zostać podzielona między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wkrótce wygasną lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/token Anthropic jest przestarzały, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Monity odświeżania pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca informujący, że trzeba zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor raportuje też profile uwierzytelniania, które są tymczasowo niedostępne z powodu:

    - krótkich cooldownów (limity szybkości/timeouty/błędy uwierzytelniania)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli `hooks.gmail.model` jest ustawione, narzędzie diagnostyczne waliduje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozpoznać albo jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu piaskownicy">
    Gdy piaskownica jest włączona, narzędzie diagnostyczne sprawdza obrazy Docker i proponuje zbudowanie albo przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Zależności środowiska uruchomieniowego dołączonych pluginów">
    Narzędzie diagnostyczne weryfikuje zależności środowiska uruchomieniowego tylko dla dołączonych pluginów, które są aktywne w bieżącej konfiguracji albo włączone przez domyślne ustawienie w dołączonym manifeście, na przykład `plugins.entries.discord.enabled: true`, starsze `channels.discord.enabled: true`, skonfigurowane `models.providers.*` / odwołania do modeli agentów albo dołączony plugin domyślnie włączony bez przypisania do dostawcy. Jeśli czegoś brakuje, narzędzie diagnostyczne zgłasza pakiety i instaluje je w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne pluginy nadal używają `openclaw plugins install` / `openclaw plugins update`; narzędzie diagnostyczne nie instaluje zależności dla dowolnych ścieżek pluginów.

    Podczas naprawy wykonywanej przez narzędzie diagnostyczne instalacje zależności npm środowiska uruchomieniowego dołączonych pluginów raportują postęp spinnerem w sesjach TTY oraz okresowymi wierszami postępu w wyjściu potokowanym/beznadzorowym. Gateway i lokalny CLI mogą także na żądanie naprawiać zależności środowiska uruchomieniowego aktywnych dołączonych pluginów przed zaimportowaniem dołączonego pluginu. Te instalacje są ograniczone do katalogu głównego instalacji środowiska uruchomieniowego pluginu, działają z wyłączonymi skryptami, nie zapisują pliku blokady pakietów i są chronione blokadą katalogu głównego instalacji, aby równoczesne uruchomienia CLI lub Gateway nie modyfikowały tego samego drzewa `node_modules` w tym samym czasie.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki czyszczenia">
    Narzędzie diagnostyczne wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu Gateway. Może też skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane według profilu są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway poziomu użytkownika, ale istnieje usługa Gateway OpenClaw poziomu systemu, narzędzie diagnostyczne nie instaluje automatycznie drugiej usługi poziomu użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` albo `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy nadzorca systemowy zarządza cyklem życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja Matrix podczas uruchamiania">
    Gdy konto kanału Matrix ma oczekującą lub wymagającą działania migrację starszego stanu, narzędzie diagnostyczne (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie próbuje wykonać kroki migracji: migrację starszego stanu Matrix oraz przygotowanie starszego stanu szyfrowanego. Oba kroki są niekrytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf autoryzacji">
    Narzędzie diagnostyczne sprawdza teraz stan parowania urządzeń jako część zwykłego przebiegu kontroli kondycji.

    Co raportuje:

    - oczekujące żądania pierwszego parowania
    - oczekujące aktualizacje ról dla już sparowanych urządzeń
    - oczekujące aktualizacje zakresów dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy odbiegły od zatwierdzonej linii bazowej parowania
    - lokalne wpisy tokenów urządzenia w pamięci podręcznej dla bieżącej maszyny, które są starsze niż rotacja tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresów

    Narzędzie diagnostyczne nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typowy problem „już sparowane, ale nadal wymagane jest parowanie”: narzędzie diagnostyczne odróżnia teraz pierwsze parowanie od oczekujących aktualizacji ról/zakresów oraz od dryfu nieaktualnego tokenu lub tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Narzędzie diagnostyczne emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy zasada jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. Utrzymywanie systemd (Linux)">
    Jeśli działa jako usługa użytkownika systemd, narzędzie diagnostyczne zapewnia włączenie utrzymywania, aby Gateway pozostał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, pluginy i starsze katalogi)">
    Narzędzie diagnostyczne wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Status Skills**: zlicza kwalifikujące się Skills, Skills z brakującymi wymaganiami oraz Skills zablokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` albo inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Status Plugin**: zlicza włączone/wyłączone/błędne pluginy; wypisuje identyfikatory pluginów dla wszelkich błędów; raportuje możliwości dołączonych pluginów.
    - **Ostrzeżenia dotyczące zgodności Plugin**: oznacza pluginy, które mają problemy ze zgodnością z bieżącym środowiskiem uruchomieniowym.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku inicjalizacyjnego">
    Narzędzie diagnostyczne sprawdza, czy pliki inicjalizacyjne obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` albo inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku liczbę znaków surowych i wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` albo `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte albo blisko limitu, narzędzie diagnostyczne wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego pluginu kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa także osieroconą konfigurację zakresu kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele Heartbeat nazwane kanałem oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, gdy środowisko uruchomieniowe kanału już nie istnieje, ale konfiguracja nadal żąda, aby Gateway się z nim powiązał.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Narzędzie diagnostyczne sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish albo PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), narzędzie diagnostyczne aktualizuje go do szybszego wariantu z plikiem w pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, narzędzie diagnostyczne automatycznie odtwarza pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, narzędzie diagnostyczne prosi o jego instalację (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie odtworzyć pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Narzędzie diagnostyczne sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

    - Jeśli tryb tokenu wymaga tokenu, a nie istnieje żadne źródło tokenu, narzędzie diagnostyczne proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, narzędzie diagnostyczne ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano SecretRef tokenu.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania szybkiego przerywania przy błędzie w czasie wykonywania.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu dla ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa `allowFrom` / `groupAllowFrom` `@username` w Telegram próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, narzędzie diagnostyczne raportuje, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozpoznawanie zamiast kończyć się awarią albo błędnie zgłaszać token jako brakujący.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Narzędzie diagnostyczne uruchamia kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Narzędzie diagnostyczne sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego zaplecza i dostawcy:

    - **Zaplecze QMD**: sonduje, czy plik binarny `qmd` jest dostępny i można go uruchomić. Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku albo magazynie uwierzytelniania. Wypisuje konkretne wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest zapisany w pamięci podręcznej wynik sondy Gateway (Gateway był zdrowy w momencie kontroli), narzędzie diagnostyczne porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Narzędzie diagnostyczne nie uruchamia nowego pingu osadzeń na domyślnej ścieżce; użyj głębokiego polecenia stanu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie wykonywania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia stanu kanałów">
    Jeśli Gateway jest zdrowy, narzędzie diagnostyczne uruchamia sondę stanu kanałów i raportuje ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt + naprawa konfiguracji nadzorcy">
    Narzędzie diagnostyczne sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub przestarzałych wartości domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawcze.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` pozostawia doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal raportuje stan usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchamianie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora oraz czyszczenie starszych usług, ponieważ zewnętrzny supervisor jest właścicielem tego cyklu życia.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy odpowiadająca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, niestarsze dodatkowe jednostki podobne do Gateway podczas skanowania zduplikowanych usług, aby pliki usług towarzyszących nie powodowały zbędnego szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja/naprawa usługi przez doctor sprawdza SecretRef, ale nie zapisuje rozwiązanych wartości tokenów w postaci jawnego tekstu w metadanych środowiska usługi supervisora.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Zaplanowanego zadania Windows osadziły inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła uruchomieniowego zamiast z definicji supervisora.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
    - Dla jednostek systemd użytkownika w systemie Linux kontrole rozbieżności tokena w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług przez doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie za pomocą `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Środowisko uruchomieniowe Gateway + diagnostyka portów">
    Doctor sprawdza środowisko uruchomieniowe usługi (PID, ostatni status zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki środowiska uruchomieniowego Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione usługi zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi binarne użytkownika, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku. Dzięki temu wygenerowany PATH supervisora pozostaje zgodny z tym samym audytem minimalnego PATH, który doctor uruchamia później.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor zapisuje wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (backup + system pamięci)">
    Doctor sugeruje system pamięci przestrzeni roboczej, gdy go brakuje, i wyświetla wskazówkę dotyczącą backupu, jeśli przestrzeń robocza nie jest jeszcze objęta git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby poznać pełny przewodnik po strukturze przestrzeni roboczej i backupie git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
