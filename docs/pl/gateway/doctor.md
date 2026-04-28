---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niekompatybilnych zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` to narzędzie naprawcze + migracyjne dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryby bezgłowe i automatyzacja

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez pytań (naprawy + restarty tam, gdzie jest to bezpieczne).

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

    Uruchamia bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia człowieka. Starsze migracje stanu są uruchamiane automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co to robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Kontrola kondycji + monit o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i statusu Pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia dotyczące nadpisania dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przysłonięciu OAuth Codex (`models.providers.openai-codex`).
    - Kontrola wymagań wstępnych OAuth TLS dla profili OAuth OpenAI Codex.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/autoryzacja WhatsApp).
    - Migracja starszych kluczy kontraktów manifestu Pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola delivery/payload na najwyższym poziomie, `provider` w payload, proste zadania fallback webhook z `notify: true`).
    - Migracja starszej polityki runtime agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi prompt-rewrite utworzonych przez dotknięte kompilacje 2026.4.24.
    - Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
    - Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i zgłasza stany cooldown/disabled profilu auth.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i supervisory">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszych usług i wykrywanie dodatkowych gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Kontrole runtime Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego gateway).
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Kontrole dobrych praktyk runtime Gateway (Node vs Bun, ścieżki menedżera wersji).
    - Diagnostyka konfliktów portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i pairing">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Kontrole uwierzytelniania Gateway dla lokalnego trybu tokenów (oferuje wygenerowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji token SecretRef).
    - Wykrywanie problemów z pairowaniem urządzeń (oczekujące żądania pairingu przy pierwszym użyciu, oczekujące podniesienia ról/zakresów, dryf nieaktualnej lokalnej pamięci podręcznej tokenu urządzenia i dryf uwierzytelniania sparowanych rekordów).

  </Accordion>
  <Accordion title="Workspace i shell">
    - Kontrola linger systemd w Linux.
    - Kontrola rozmiaru plików bootstrap workspace (ostrzeżenia o obcięciu/blisko limitu dla plików kontekstowych).
    - Kontrola statusu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
    - Kontrola gotowości dostawcy embeddingów dla wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
    - Kontrole instalacji ze źródła (niedopasowanie workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i resetowanie UI Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu grounded dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia grounded pass dziennika REM i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika backfill.
- **Clear Grounded** usuwa tylko tymczasowe wpisy grounded-only pochodzące z historycznego odtwarzania, które nie zgromadziły jeszcze aktywnego recall ani dziennego wsparcia.

Czego same nie robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie grounded candidates do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz ścieżkę CLI staged

Jeśli chcesz, aby grounded historical replay wpływało na zwykłą ścieżkę deep promotion, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje grounded durable candidates do magazynu short-term dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor wykona następujące działania:

    - Wyjaśni, które starsze klucze zostały znalezione.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` do zaktualizowanego schematu.

    Gateway również automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

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
    - W kanałach z nazwanymi `accounts`, ale z pozostawionymi pojedynczymi wartościami kanału na najwyższym poziomie, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/docelowy default)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)

    Ostrzeżenia doctor obejmują także wskazówki dotyczące kont domyślnych dla kanałów wielokontowych:

    - Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że fallback routing może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić użycie niewłaściwego API dla modeli lub wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API + koszty per model.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania do lokalnego hosta Chrome MCP:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje także lokalną na hoście ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili auto-connect
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć tego ustawienia po stronie Chrome za Ciebie. Lokalny na hoście Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - lokalnie uruchomionej przeglądarki
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

    Gotowość tutaj dotyczy tylko wymagań wstępnych lokalnego dołączania. Existing-session zachowuje bieżące ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ta kontrola **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje endpoint autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi zweryfikować łańcuch certyfikatów. Jeśli sondowanie zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat self-signed), doctor wypisuje wskazówki naprawy specyficzne dla platformy. Na macOS z Node z Homebrew naprawą jest zwykle `brew postinstall ca-certificates`. Przy `--deep` sondowanie uruchamia się nawet wtedy, gdy gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przysłaniać wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/fallback. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia dotyczące tras Pluginu Codex">
    Gdy dołączony Plugin Codex jest włączony, doctor sprawdza także, czy referencje modeli podstawowych `openai-codex/*` nadal są rozwiązywane przez domyślny runner PI. To połączenie jest poprawne, gdy chcesz używać uwierzytelniania Codex OAuth/subscription przez PI, ale łatwo je pomylić z natywnym harnessem app-server Codex. Doctor ostrzega i wskazuje jawny kształt app-server: `openai/*` plus `agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są poprawne:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subscription przez zwykły runner OpenClaw.”
    - `openai/*` + `runtime: "codex"` oznacza „uruchom osadzoną turę przez natywny app-server Codex.”
    - `/codex ...` oznacza „steruj natywną konwersacją Codex z czatu lub ją powiąż.”
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx.”

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Pozostaw ostrzeżenie bez zmian, jeśli PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="3. Starsze migracje stanu (układ na dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są best-effort i idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI także automatycznie migruje starsze sesje + katalog agenta przy starcie, więc historia/auth/modele trafiają do ścieżki per agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja provider/provider-map Talk porównuje teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie wywołują już powtarzających się zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Starsze migracje manifestów Pluginów">
    Doctor skanuje wszystkie zainstalowane manifesty Pluginów w poszukiwaniu przestarzałych kluczy możliwości na najwyższym poziomie (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu in-place. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Starsze migracje magazynu Cron">
    Doctor sprawdza także magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie lub `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które scheduler nadal akceptuje dla kompatybilności.

    Bieżące porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload na najwyższym poziomie (`message`, `model`, `thinking`, ...) → `payload`
    - pola delivery na najwyższym poziomie (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy delivery `provider` w payload → jawne `delivery.channel`
    - proste starsze zadania fallback webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym trybem delivery innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokad zapisu — plików pozostawionych, gdy sesja zakończyła się nienormalnie. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal działa, wiek blokady i czy jest uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta w poszukiwaniu zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu w 2026.4.24: porzuconej tury użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywnego rodzeństwa zawierającego ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, dzięki czemu historia gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu to operacyjny pień mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje odtworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niedopasowanie właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą na macOS**: ostrzega, gdy stan rozwiązuje się pod `iCloud Drive` (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O i wyścigi blokad/synchronizacji.
    - **Katalog stanu na Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niedopasowanie transkryptów**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkryptów.
    - **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jedną linię (historia się nie kumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może rozdzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (tam znajduje się stan).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor analizuje profile OAuth w magazynie auth, ostrzega, gdy tokeny wygasają/wygasły, i może je odświeżać, gdy jest to bezpieczne. Jeśli profil Anthropic OAuth/token jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę setup-token Anthropic. Monity odświeżenia pojawiają się tylko podczas uruchamiania interaktywnego (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth zakończy się trwałym niepowodzeniem (na przykład `refresh_token_reused`, `invalid_grant` lub dostawca informuje o konieczności ponownego logowania), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...`, które należy uruchomić.

    Doctor zgłasza także profile auth, które są tymczasowo nieużywalne z powodu:

    - krótkich cooldownów (limity szybkości/timeouty/błędy auth)
    - dłuższych wyłączeń (błędy rozliczeń/kredytu)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje referencję modelu względem katalogu i allowlisty oraz ostrzega, gdy nie zostanie rozwiązana lub jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie lub przełączenie na starsze nazwy, jeśli brakuje bieżącego obrazu.
  </Accordion>
  <Accordion title="7b. Zależności runtime dołączonych Pluginów">
    Doctor weryfikuje zależności runtime tylko dla dołączonych Pluginów, które są aktywne w bieżącej konfiguracji lub włączone przez domyślny manifest dołączony, na przykład `plugins.entries.discord.enabled: true`, starsze `channels.discord.enabled: true` lub domyślnie włączony dołączony dostawca. Jeśli którychkolwiek brakuje, doctor zgłasza pakiety i instaluje je w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne Pluginy nadal używają `openclaw plugins install` / `openclaw plugins update`; doctor nie instaluje zależności dla dowolnych ścieżek Pluginów.

    Gateway i lokalne CLI mogą także naprawiać zależności runtime aktywnych dołączonych Pluginów na żądanie przed zaimportowaniem dołączonego Pluginu. Te instalacje mają zakres do katalogu instalacji runtime Pluginu, są uruchamiane z wyłączonymi skryptami, nie zapisują package lock i są chronione blokadą katalogu instalacji, aby równoległe uruchomienia CLI lub Gateway nie modyfikowały jednocześnie tego samego drzewa `node_modules`.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki dotyczące czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu gateway. Może także skanować w poszukiwaniu dodatkowych usług podobnych do gateway i wypisywać wskazówki dotyczące czyszczenia. Usługi gateway OpenClaw nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.
  </Accordion>
  <Accordion title="8b. Migracja Matrix przy starcie">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania starszą migrację stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Pairing urządzeń i dryf auth">
    Doctor analizuje teraz stan pairingu urządzeń jako część zwykłego przebiegu kontroli kondycji.

    Co raportuje:

    - oczekujące żądania pierwszego pairingu
    - oczekujące podniesienia ról dla już sparowanych urządzeń
    - oczekujące podniesienia zakresów dla już sparowanych urządzeń
    - naprawy niedopasowania klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy odbiegają od zatwierdzonej bazy pairing
    - lokalne wpisy w pamięci podręcznej tokenów urządzenia dla bieżącej maszyny, które pochodzą sprzed rotacji tokenu po stronie gateway lub zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań pairingu ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne kolejne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - obróć nowy token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i zatwierdź ponownie nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka częstą lukę „już sparowane, ale nadal pojawia się pairing required”: doctor rozróżnia teraz pierwszy pairing, oczekujące podniesienia roli/zakresu oraz dryf nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM-y bez allowlisty lub gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że linger jest włączony, aby gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, Pluginy i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu workspace dla domyślnego agenta:

    - **Status Skills**: liczba Skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlistę.
    - **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace istnieją obok bieżącego workspace.
    - **Status Pluginów**: zlicza Pluginy włączone/wyłączone/z błędami; wypisuje identyfikatory Pluginów dla wszystkich błędów; raportuje możliwości Pluginów w bundle.
    - **Ostrzeżenia o kompatybilności Pluginów**: oznacza Pluginy mające problemy zgodności z bieżącym runtime.
    - **Diagnostyka Pluginów**: pokazuje wszelkie ostrzeżenia lub błędy przy ładowaniu emitowane przez rejestr Pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstowe) są blisko skonfigurowanego budżetu znaków lub go przekraczają. Raportuje dla każdego pliku liczbę znaków surowych vs. wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące strojenia `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z plikiem cache.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache, doctor automatycznie regeneruje cache.
    - Jeśli uzupełnianie w ogóle nie jest skonfigurowane, doctor proponuje jego instalację (tylko tryb interaktywny; pomijane przy `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

  </Accordion>
  <Accordion title="12. Kontrole auth Gateway (lokalny token)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego tokenu gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go plaintextem.
    - `openclaw doctor --generate-gateway-token` wymusza wygenerowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy uwzględniające SecretRef w trybie tylko do odczytu">
    Niektóre przepływy naprawy muszą analizować skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status do ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa `@username` dla `allowFrom` / `groupAllowFrom` w Telegram próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane-ale-niedostępne, i pomija autoresolution zamiast się wywracać lub błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje restart gateway, gdy wygląda on na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca embeddingów wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i możliwa do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki binarki.
    - **Jawny lokalny dostawca**: sprawdza obecność lokalnego pliku modelu lub rozpoznawanego zdalnego/pobieralnego URL modelu. Jeśli go brak, sugeruje przełączenie na zdalnego dostawcę.
    - **Jawny zdalny dostawca** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie auth. Jeśli go brakuje, wypisuje praktyczne wskazówki naprawy.
    - **Dostawca auto**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego zdalnego dostawcę w kolejności auto-selection.

    Gdy dostępny jest wynik sondowania gateway (gateway był sprawny w czasie kontroli), doctor zestawia jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanałów">
    Jeśli gateway jest sprawny, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia wraz z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji supervisora + naprawa">
    Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy wykryje niedopasowanie, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez pytań.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gateway. Nadal raportuje stan usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchamianie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora i czyszczenie starszych usług, ponieważ tym cyklem życia zarządza zewnętrzny supervisor.
    - Jeśli auth tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, doctor przy instalacji/naprawie usługi waliduje SecretRef, ale nie utrwala rozwiązanych wartości plaintext tokenu w metadanych środowiska usługi supervisora.
    - Jeśli auth tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i podaje praktyczne wskazówki.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
    - Dla jednostek user-systemd w Linux kontrole dryfu tokenów doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` przy porównywaniu metadanych auth usługi.
    - Naprawy usług doctor odmawiają przepisania, zatrzymania lub zrestartowania usługi gateway ze starszej binarki OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portów">
    Doctor analizuje runtime usługi (PID, ostatni status zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Dobre praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun lub na ścieżce Node zarządzanej przez menedżera wersji (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i zapisuje metadane kreatora, aby odnotować przebieg doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące workspace (backup + system pamięci)">
    Doctor sugeruje system pamięci workspace, gdy go brakuje, i wypisuje wskazówkę dotyczącą backupu, jeśli workspace nie znajduje się już pod git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze workspace i backupie git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów Gateway](/pl/gateway/troubleshooting)
