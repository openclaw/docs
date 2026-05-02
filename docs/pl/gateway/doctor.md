---
read_when:
    - Dodawanie lub modyfikowanie migracji polecenia doctor
    - Wprowadzanie zmian konfiguracji łamiących zgodność
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-02T09:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację/stan, sprawdza kondycję i podaje wykonalne kroki naprawcze.

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

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia przez człowieka. Migracje stanu starszego typu uruchamiają się automatycznie po wykryciu.

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
  <Accordion title="Health, UI, and updates">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + monit o restart.
    - Podsumowanie statusu Skills (eligible/missing/blocked) i status Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalizacja konfiguracji dla wartości starszego typu.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych OAuth TLS dla profili OAuth OpenAI Codex.
    - Ostrzeżenia listy dozwolonych Plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda symbolu wieloznacznego lub narzędzi należących do Plugin.
    - Migracja starszego stanu na dysku (sessions/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja kluczy kontraktu manifestu starszego Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola dostarczania/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne webhook `notify: true`).
    - Migracja starszej polityki runtime agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie przestarzałej konfiguracji Plugin, gdy pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odniesienia do pluginów są traktowane jako nieaktywna konfiguracja ograniczająca i zachowywane.

  </Accordion>
  <Accordion title="State and integrity">
    - Kontrola plików blokad sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte kompilacje 2026.4.24.
    - Wykrywanie znaczników tombstone odzyskiwania po restarcie zablokowanych subagentów, z obsługą `--fix` do czyszczenia przestarzałych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej procesu podrzędnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) podczas uruchamiania lokalnie.
    - Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profili uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowych gatewayów.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia runtime Gateway (usługa zainstalowana, ale nieuruchomiona; zapisany w pamięci podręcznej label launchd).
    - Ostrzeżenia statusu kanałów (sprawdzane z działającego gatewaya).
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk runtime Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Sprawdzenia uwierzytelniania Gateway dla trybu tokenu lokalnego (oferuje wygenerowanie tokenu, gdy nie istnieje żadne źródło tokenu; nie nadpisuje konfiguracji tokenów SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące podniesienia roli/zakresu, rozjazd przestarzałej lokalnej pamięci podręcznej tokenu urządzenia oraz rozjazd uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie statusu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, klucz zdalnego API lub binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Backfill i reset Dreams UI

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy grounded dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia grounded REM diary pass i zapisuje odwracalne wpisy backfill w `DREAMS.md`.
- **Reset** usuwa tylko te oznaczone wpisy dziennika backfill z `DREAMS.md`.
- **Clear Grounded** usuwa tylko przygotowane, krótkoterminowe wpisy typu grounded-only, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze live recall ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded do aktywnego magazynu krótkoterminowej promocji, chyba że najpierw wyraźnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na normalną ścieżkę deep promotion, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje trwałych kandydatów grounded w magazynie krótkoterminowego dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jeśli jest to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez zastąpienia specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawcy.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego lub wpisów narzędzi należących do Plugin. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych Plugin.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway również automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc przestarzałe konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań cron są obsługiwane przez `openclaw doctor --fix`.

    Bieżące migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższego poziomu `bindings`
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
    - W przypadku kanałów z nazwanymi `accounts`, ale pozostawionymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości z zakresem konta do wypromowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość enum, zamiast kończyć się błędem w trybie zamkniętym)

    Ostrzeżenia doctor zawierają też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że trasowanie awaryjne może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić użycie niewłaściwego API przez modele albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić trasowanie API oraz koszty per model.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do obecnego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje też lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Lokalny dla hosta Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście Gateway/Node
    - przeglądarki uruchomionej lokalnie
    - zdalnego debugowania włączonego w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy tylko lokalnych wymagań wstępnych dołączenia. Existing-session zachowuje obecne limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

    Ten test **nie** dotyczy przepływów Docker, sandbox, zdalnej przeglądarki ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Gdy skonfigurowano profil OpenAI Codex OAuth, doctor sprawdza punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli próba zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat samopodpisany), doctor wypisuje wskazówki naprawy specyficzne dla platformy. W macOS z Node z Homebrew poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` próba jest wykonywana nawet wtedy, gdy Gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie trasowania/awaryjne. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Gdy dołączony Plugin Codex jest włączony, doctor sprawdza też, czy odwołania do modelu głównego `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Ta kombinacja jest poprawna, gdy chcesz używać uwierzytelniania Codex OAuth/subskrypcji przez PI, ale łatwo ją pomylić z natywnym harness serwera aplikacji Codex. Doctor ostrzega i wskazuje jawny kształt serwera aplikacji: `openai/*` plus `agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są poprawne:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subskrypcji przez normalny runner OpenClaw”.
    - `openai/*` + `agentRuntime.id: "codex"` oznacza „uruchom osadzoną turę przez natywny serwer aplikacji Codex”.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną rozmowę Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Zachowaj ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor może migrować starsze układy na dysku do obecnej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są best-effort i idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje + katalog agenta przy uruchomieniu, aby historia/uwierzytelnianie/modele trafiły do ścieżki per agent bez ręcznego uruchamiania doctor. Normalizacja dostawcy/mapy dostawców talk porównuje teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie wywołują już powtarzanych zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor sprawdza też magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy go nadpisano) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Obecne porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania payload `provider` → jawne `delivery.channel`
    - proste starsze zadania fallback Webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym trybem dostarczania innym niż Webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starsze `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez obecny OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy Cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab poleceniem `crontab -e`; używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status` do obecnych kontroli stanu.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Narzędzie diagnostyczne skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokad zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub wiek powyżej 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje uwagę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Narzędzie diagnostyczne skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptów z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem wykonawczym OpenClaw oraz aktywną gałąź siostrzaną zawierającą ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` narzędzie diagnostyczne tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu historia Gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Narzędzie diagnostyczne sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, pyta o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą na macOS**: ostrzega, gdy stan znajduje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki obsługiwane przez synchronizację mogą powodować wolniejsze operacje I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu na SD lub eMMC w Linuksie**: ostrzega, gdy stan wskazuje źródło montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-wierszowy JSONL”**: oznacza przypadek, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie gromadzi).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może zostać podzielona między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, narzędzie diagnostyczne przypomina, aby uruchomić je na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata, i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja autoryzacji modeli (wygaśnięcie OAuth)">
    Narzędzie diagnostyczne sprawdza profile OAuth w magazynie autoryzacji, ostrzega, gdy tokeny wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracyjnego Anthropic. Prompty odświeżania pojawiają się tylko podczas pracy interaktywnej (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo provider każe zalogować się ponownie), narzędzie diagnostyczne raportuje, że wymagana jest ponowna autoryzacja, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Narzędzie diagnostyczne raportuje także profile autoryzacji, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów karencji (limity szybkości/limity czasu/błędy autoryzacji)
    - dłuższych wyłączeń (błędy rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, narzędzie diagnostyczne weryfikuje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się jej rozwiązać albo jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu piaskownicy">
    Gdy piaskownica jest włączona, narzędzie diagnostyczne sprawdza obrazy Docker i proponuje zbudowanie albo przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji pluginu">
    Narzędzie diagnostyczne usuwa starszy, wygenerowany przez OpenClaw stan przygotowania zależności pluginu w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane korzenie zależności, stare katalogi etapu instalacji oraz lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności dołączonych pluginów.

    Narzędzie diagnostyczne może też ponownie zainstalować skonfigurowane pobieralne pluginy, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr pluginów nie może ich znaleźć. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje pluginów pozostają jawną pracą diagnostyczną/instalacyjną/aktualizacyjną.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki czyszczenia">
    Narzędzie diagnostyczne wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu Gateway. Może też skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane profilem są traktowane jako pierwszorzędne i nie są oznaczane jako „dodatkowe”.

    W Linuksie, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, narzędzie diagnostyczne nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` albo `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy cyklem życia Gateway zarządza supervisor systemowy.

  </Accordion>
  <Accordion title="8b. Migracja Startup Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację stanu legacy, narzędzie diagnostyczne (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie uruchamia kroki migracji typu best-effort: migrację starszego stanu Matrix oraz przygotowanie starszego zaszyfrowanego stanu. Oba kroki są niekrytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf autoryzacji">
    Narzędzie diagnostyczne sprawdza teraz stan parowania urządzeń w ramach zwykłego przebiegu kontroli kondycji.

    Co raportuje:

    - oczekujące żądania pierwszego parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalne wpisy tokenów urządzeń z pamięci podręcznej dla bieżącej maszyny, które są starsze niż rotacja tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresu

    Narzędzie diagnostyczne nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka częstą lukę „już sparowane, ale nadal wymagane jest parowanie”: narzędzie diagnostyczne odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Narzędzie diagnostyczne emituje ostrzeżenia, gdy provider jest otwarty na wiadomości DM bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, narzędzie diagnostyczne upewnia się, że linger jest włączony, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (Skills, pluginy i katalogi legacy)">
    Narzędzie diagnostyczne wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Status Skills**: zlicza Skills kwalifikujące się, z brakującymi wymaganiami i zablokowane przez listę dozwolonych.
    - **Katalogi obszaru roboczego legacy**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Status pluginów**: zlicza włączone/wyłączone/błędne pluginy; wymienia identyfikatory pluginów dla wszelkich błędów; raportuje możliwości pluginu pakietowego.
    - **Ostrzeżenia zgodności pluginów**: oznacza pluginy, które mają problemy zgodności z bieżącym środowiskiem wykonawczym.
    - **Diagnostyka pluginów**: ujawnia wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez rejestr pluginów.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku rozruchowego">
    Narzędzie diagnostyczne sprawdza, czy pliki rozruchowe obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku liczbę znaków surowych względem wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` albo `max/total`) oraz łączną liczbę wstrzykniętych znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte albo blisko limitu, narzędzie diagnostyczne wypisuje wskazówki dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego pluginu kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa także wiszącą konfigurację o zakresie kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele Heartbeat wskazujące kanał oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których środowisko wykonawcze kanału zniknęło, ale konfiguracja nadal każe Gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Narzędzie diagnostyczne sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), narzędzie diagnostyczne aktualizuje go do szybszego wariantu pliku z pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, narzędzie diagnostyczne automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, narzędzie diagnostyczne pyta o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole autoryzacji Gateway (token lokalny)">
    Narzędzie diagnostyczne sprawdza gotowość autoryzacji lokalnego tokenu Gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, narzędzie diagnostyczne proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, narzędzie diagnostyczne ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano SecretRef tokenu.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania szybkiego niepowodzenia środowiska wykonawczego.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusów dla ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, narzędzie diagnostyczne raportuje, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie raportować brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Narzędzie diagnostyczne uruchamia kontrolę kondycji i proponuje restart Gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Narzędzie diagnostyczne sprawdza, czy skonfigurowany provider embeddingów wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i providera:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy obejmujące pakiet npm i opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany adres URL modelu zdalnego/możliwego do pobrania. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku albo magazynie uwierzytelniania. Jeśli go brakuje, wypisuje praktyczne wskazówki naprawy.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje kolejno każdego dostawcy zdalnego zgodnie z kolejnością automatycznego wyboru.

    Gdy dostępny jest wynik sondy Gateway z pamięci podręcznej (Gateway był sprawny w momencie sprawdzenia), doctor porównuje go z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego testu ping dla osadzania na domyślnej ścieżce; użyj polecenia głębokiego statusu pamięci, gdy chcesz wykonać sprawdzenie dostawcy na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o statusie kanałów">
    Jeśli Gateway jest sprawny, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji nadzorcy + naprawa">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszych usług, ponieważ ten cykl życia należy do zewnętrznego nadzorcy.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, dodatkowe jednostki podobne do Gateway, które nie są starszymi jednostkami, podczas skanowania zduplikowanych usług, aby pomocnicze pliki usług nie powodowały szumu związanego z czyszczeniem.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi doctor waliduje SecretRef, ale nie zapisuje rozpoznanych wartości tokenu w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła runtime zamiast z definicji nadzorcy.
    - Doctor wykrywa, kiedy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozpoznany, doctor blokuje ścieżkę instalacji/naprawy, podając praktyczne wskazówki.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek systemd użytkownika w systemie Linux kontrole rozbieżności tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi doctor odmawiają przepisania, zatrzymania lub zrestartowania usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portu">
    Doctor sprawdza runtime usługi (PID, ostatni status zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun lub ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżera wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione usługi zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi user-bin, ale odgadnięte katalogi awaryjne menedżera wersji są zapisywane w PATH usługi tylko wtedy, gdy istnieją na dysku. Dzięki temu wygenerowany PATH nadzorcy pozostaje zgodny z tym samym audytem minimalnego PATH, który doctor uruchamia później.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci workspace, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli workspace nie jest jeszcze w git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze workspace i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
