---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian konfiguracji łamiących zgodność
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-05T01:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
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

    Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Stosuje zalecane naprawy bez pytań (naprawy + restarty, gdy jest to bezpieczne).

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

    Uruchamia się bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa, które wymagają potwierdzenia przez człowieka. Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracyjny:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
    - Sprawdzenie świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Sprawdzenie kondycji + pytanie o restart.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status pluginów.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla starszych wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Sprawdzenia migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach providera OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Ostrzeżenia o przysłanianiu OAuth Codex (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
    - Ostrzeżenia allowlisty pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal prosi o wildcard lub narzędzia należące do pluginu.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostawy/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne Webhook `notify: true`).
    - Migracja starszej polityki runtime agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie przestarzałej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, przestarzałe odniesienia do pluginów są traktowane jako nieaktywna konfiguracja izolująca i zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Kontrola plików blokad sesji i czyszczenie przestarzałych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptu utworzonych przez objęte problemem kompilacje 2026.4.24.
    - Wykrywanie tombstone'ów odzyskiwania po restarcie zablokowanego subagenta, z obsługą `--fix` do czyszczenia przestarzałych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracyjnego (chmod 600) podczas uruchamiania lokalnego.
    - Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączone profili uwierzytelniania.
    - Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i supervisory">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia runtime Gateway (usługa zainstalowana, ale nieuruchomiona; etykieta launchd w pamięci podręcznej).
    - Ostrzeżenia o statusie kanałów (sondowane z działającego gateway).
    - Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług gateway, które przechwyciły wartości shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia dobrych praktyk runtime Gateway (Node vs Bun, ścieżki menedżera wersji).
    - Diagnostyka konfliktów portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Sprawdzenia uwierzytelniania Gateway dla lokalnego trybu tokena (oferuje wygenerowanie tokena, gdy nie istnieje żadne źródło tokena; nie nadpisuje konfiguracji SecretRef tokena).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze prośby o parowanie, oczekujące podniesienia roli/zakresu, przestarzały dryf lokalnej pamięci podręcznej tokena urządzenia i dryf uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i shell">
    - Sprawdzenie systemd linger w Linuksie.
    - Sprawdzenie rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone umiejętności z brakującymi binariami, env, konfiguracją lub wymaganiami OS, a `--fix` może wyłączyć niedostępne umiejętności w `skills.entries`.
    - Sprawdzenie statusu uzupełniania shell i automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości providera embeddingów wyszukiwania pamięci (model lokalny, klucz zdalnego API lub binarium QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i resetowanie Dreams UI

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu grounded dreaming. Te akcje używają metod RPC w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia przebieg grounded REM diary i zapisuje odwracalne wpisy uzupełnienia w `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy uzupełnienia dziennika.
- **Clear Grounded** usuwa tylko przygotowane wpisy krótkoterminowe wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze przywołań na żywo ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie kandydatów grounded do aktywnego krótkoterminowego magazynu promocji, chyba że najpierw wyraźnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby historyczne odtworzenie grounded wpływało na zwykły tor deep promotion, użyj zamiast tego przepływu CLI:

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

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy providerów.

    Doctor ostrzega też, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    wpisów wildcard lub narzędzi należących do pluginu. `tools.allow: ["*"]` dopasowuje tylko narzędzia
    z pluginów, które faktycznie się ładują; nie omija wyłącznej allowlisty pluginów. Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji allowlisty, aby zachować istniejące zachowanie bundled providerów, a
    następnie wskazuje bardziej rygorystyczne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway również automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc przestarzałe konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

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
    - przestarzałe `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - `agent.*` → `agents.defaults` + `tools.*` (narzędzia/podniesione uprawnienia/wykonanie/sandbox/subagenci)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (przestarzałe ustawienie przekaźnika rozszerzenia)
    - przestarzałe `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość wyliczenia, zamiast kończyć się błędem)

    Ostrzeżenia doktora obejmują też wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doktor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doktor ostrzega i wypisuje skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API albo wyzerować koszty. Doktor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doktor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnie na hoście:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doktor audytuje też lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doktor nie może włączyć za Ciebie ustawienia po stronie Chrome. Lokalny dla hosta Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście Gateway/Node
    - przeglądarki działającej lokalnie
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy wyłącznie lokalnych wymagań wstępnych do dołączania. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ta kontrola **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych przepływów bezgłowych. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doktor sprawdza punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli próba kończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doktor wypisuje wskazówki naprawcze właściwe dla platformy. Na macOS z Node z Homebrew poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` próba jest uruchamiana nawet wtedy, gdy Gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano przestarzałe ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doktor ostrzega, gdy widzi te stare ustawienia transportu razem z Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjnego przełączania. Niestandardowe proxy i nadpisania samych nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia tras pluginu Codex">
    Gdy dołączony plugin Codex jest włączony, doktor sprawdza też, czy odwołania do modelu podstawowego `openai-codex/*` nadal są rozwiązywane przez domyślny runner PI. Ta kombinacja jest poprawna, gdy chcesz używać uwierzytelniania Codex OAuth/subskrypcji przez PI, ale łatwo pomylić ją z natywnym środowiskiem app-server Codex. Doktor ostrzega i wskazuje jawną postać app-server: `openai/*` plus `agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.

    Doktor nie naprawia tego automatycznie, ponieważ obie trasy są poprawne:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subskrypcji przez normalny runner OpenClaw”.
    - `openai/*` + `agentRuntime.id: "codex"` oznacza „uruchom osadzoną turę przez natywny app-server Codex”.
    - `/codex ...` oznacza „kontroluj lub powiąż natywną rozmowę Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Pozostaw ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="2g. Czyszczenie trasy sesji">
    Doktor skanuje też magazyn aktywnych sesji pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanego modelu domyślnego/awaryjnego lub środowiska uruchomieniowego poza trasę należącą do pluginu, taką jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modelu środowiska uruchomieniowego, przypięte identyfikatory środowisk, powiązania sesji CLI i automatyczne nadpisania profili uwierzytelniania, gdy ich trasa właścicielska nie jest już skonfigurowana. Jawne wybory modeli użytkownika lub przestarzałych sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje przestarzałego stanu (układ na dysku)">
    Doktor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypty:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - z przestarzałego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane w trybie najlepszych starań i są idempotentne; doktor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek przestarzałe foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też przestarzałe sesje + katalog agenta przy uruchamianiu, aby historia/uwierzytelnianie/modele trafiły do ścieżki dla danego agenta bez ręcznego uruchamiania doktora. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz według równości strukturalnej, więc różnice dotyczące wyłącznie kolejności kluczy nie wywołują już powtarzanych zmian no-op `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje przestarzałych manifestów pluginów">
    Doktor skanuje wszystkie manifesty zainstalowanych pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, przestarzały klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje przestarzałego magazynu cron">
    Doktor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy nadpisano) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania payload `provider` → jawne `delivery.channel`
    - proste przestarzałe zadania awaryjne webhook `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doktor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy przestarzały awaryjny notify z istniejącym trybem dostarczania innym niż webhook, doktor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega także, gdy crontab użytkownika nadal wywołuje przestarzały `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Usuń nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli kondycji używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokad zapisu — plików pozostawionych, gdy sesja zakończyła się nieprawidłowo. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, informację, czy PID nadal działa, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkryptu sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkryptu promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem wykonawczym OpenClaw oraz aktywną gałąź siostrzaną zawierającą ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego objętego problemem pliku obok oryginału i przepisuje transkrypt do aktywnej gałęzi, dzięki czemu historia Gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu na SD lub eMMC w systemie Linux**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkryptu**: ostrzega, gdy najnowsze wpisy sesji mają brakujące pliki transkryptu.
    - **Główna sesja „1-line JSONL”**: oznacza przypadki, gdy główny transkrypt ma tylko jeden wiersz (historia się nie kumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy wiele folderów `~/.openclaw` istnieje w różnych katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może zostać rozdzielona między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracji Anthropic. Prompty odświeżania pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca każe zalogować się ponownie), doctor zgłasza, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza także profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów cooldown (limity szybkości/przekroczenia czasu/niepowodzenia uwierzytelniania)
    - dłuższych wyłączeń (niepowodzenia rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli ustawiono `hooks.gmail.model`, doctor weryfikuje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozwiązać albo jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa przestarzały stan staging zależności Plugin wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane korzenie zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności wbudowanych Plugin oraz osierocone lub odzyskane zarządzane kopie npm wbudowanych Plugin `@openclaw/*`, które mogą przesłaniać bieżący wbudowany manifest.

    Doctor może także ponownie instalować brakujące pobieralne Plugin, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanałów/dostawców/wyszukiwania oraz skonfigurowane środowiska wykonawcze agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet rdzeniowy jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i ponowne wczytanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki czyszczenia">
    Doctor wykrywa przestarzałe usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz instalację usługi OpenClaw z użyciem bieżącego portu Gateway. Może także skanować dodatkowe usługi podobne do Gateway i wypisywać wskazówki czyszczenia. Usługi OpenClaw Gateway nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa OpenClaw Gateway na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy zewnętrzny nadzorca odpowiada za cykl życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja startowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub wymagającą działania migrację stanu starszego typu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie uruchamia kroki migracji typu best-effort: migrację starszego stanu Matrix oraz przygotowanie starszego zaszyfrowanego stanu. Oba kroki nie są krytyczne; błędy są logowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i dryf uwierzytelniania">
    Doctor sprawdza teraz stan parowania urządzeń w ramach normalnego przebiegu kontroli kondycji.

    Co zgłasza:

    - oczekujące żądania pierwszego parowania
    - oczekujące podniesienia roli dla już sparowanych urządzeń
    - oczekujące podniesienia zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal pasuje, ale tożsamość urządzenia nie pasuje już do zatwierdzonego rekordu
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę parowania
    - lokalne buforowane wpisy tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway lub zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal wymaga parowania”: doctor rozróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor zapewnia włączenie lingering, aby Gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan przestrzeni roboczej (Skills, Plugin i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu przestrzeni roboczej dla domyślnego agenta:

    - **Stan Skills**: zlicza kwalifikujące się Skills, Skills z brakującymi wymaganiami oraz Skills zablokowane przez listę dozwolonych.
    - **Starsze katalogi przestrzeni roboczej**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi przestrzeni roboczej istnieją obok bieżącej przestrzeni roboczej.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne Plugin; wypisuje identyfikatory Plugin dla wszelkich błędów; zgłasza możliwości wbudowanych Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza Plugin, które mają problemy zgodności z bieżącym środowiskiem wykonawczym.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap przestrzeni roboczej (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Zgłasza dla każdego pliku liczbę znaków surowych względem wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako część całego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa także wiszącą konfigurację o zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele Heartbeat, które nazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, w których środowisko wykonawcze kanału zniknęło, ale konfiguracja nadal każe Gateway się z nim powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z buforowanym plikiem.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest skonfigurowane wcale, doctor proponuje jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego tokenu Gateway.

    - Jeśli tryb tokenu potrzebuje tokenu, a nie istnieje żadne źródło tokenu, doctor proponuje wygenerowanie go.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano żadnego tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzić skonfigurowane poświadczenia bez osłabiania zachowania szybkiego kończenia błędem środowiska wykonawczego.

    - `openclaw doctor --fix` używa teraz tego samego tylko do odczytu modelu podsumowania SecretRef co polecenia z rodziny statusu do ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii lub błędnie zgłaszać brak tokena.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzania wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawcze obejmujące pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/możliwy do pobrania URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie uwierzytelniania. Wypisuje praktyczne wskazówki naprawcze, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest buforowany wynik sondy Gateway (Gateway był sprawny w chwili kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia świeżego pinga osadzania w domyślnej ścieżce; użyj szczegółowego polecenia statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia statusu kanałów">
    Jeśli Gateway jest sprawny, doctor uruchamia sondę statusu kanałów i zgłasza ostrzeżenia wraz z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji nadzorcy + naprawa">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i wykonuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy oraz czyszczenie starszych usług, ponieważ ten cykl życia jest własnością zewnętrznego nadzorcy.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd Gateway jest aktywna. Ignoruje też nieaktywne, niestare dodatkowe jednostki podobne do Gateway podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie tworzyły szumu przy czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi doctor waliduje SecretRef, ale nie utrwala rozwiązanych wartości tokena w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadzały inline, i przepisuje metadane usługi tak, aby te wartości ładowały się ze źródła runtime zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek user-systemd w systemie Linux kontrole dryfu tokenów doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka runtime Gateway + portu">
    Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także kolizje portów na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa Gateway działa na Bun albo ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą psuć się po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione LaunchAgents w macOS używają kanonicznej systemowej PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, więc Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, które procesy potomne Node są rozwiązywane. Usługi Linux nadal zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi user-bin, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zapisać uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci workspace, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli workspace nie jest jeszcze pod kontrolą git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze workspace i kopii zapasowej git (zalecany prywatny GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
