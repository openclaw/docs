---
read_when:
    - Dodawanie lub modyfikowanie migracji diagnostycznych
    - Wprowadzanie niekompatybilnych zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawy'
title: Diagnostyka
x-i18n:
    generated_at: "2026-05-05T08:25:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

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

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia przez człowieka. Starsze migracje stanu uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

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
    - Ostrzeżenia o przesłanianiu Codex OAuth (`models.providers.openai-codex`).
    - Sprawdzenie wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
    - Ostrzeżenia dotyczące listy dozwolonych pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal wymaga symbolu wieloznacznego lub narzędzi należących do pluginu.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostarczania/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne Webhook `notify: true`).
    - Migracja starszej polityki środowiska uruchomieniowego agenta do `agents.defaults.agentRuntime` i `agents.list[].agentRuntime`.
    - Czyszczenie nieaktualnej konfiguracji pluginów, gdy pluginy są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do pluginów są traktowane jako nieaktywna konfiguracja ograniczająca i zostają zachowane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkryptów sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte problemem kompilacje 2026.4.24.
    - Wykrywanie znaczników odzyskiwania po restarcie zablokowanych podagentów, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej procesu potomnego jako przerwanego przez restart.
    - Sprawdzenia integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
    - Sprawdzenia uprawnień pliku konfiguracji (chmod 600) przy uruchomieniu lokalnym.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/wyłączenia profilu uwierzytelniania.
    - Wykrywanie dodatkowego katalogu obszaru roboczego (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Sprawdzenia środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nie działa; zapisana w pamięci podręcznej etykieta launchd).
    - Ostrzeżenia o stanie kanału (sondowane z działającego Gateway).
    - Sprawdzenia responsywności WhatsApp pod kątem zdegradowanej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI.
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie środowiska osadzonego proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Sprawdzenia najlepszych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka konfliktów portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
    - Sprawdzenia uwierzytelniania Gateway dla trybu tokenu lokalnego (oferuje generowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji tokenów SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, rozjazd nieaktualnej lokalnej pamięci podręcznej tokenów urządzenia oraz rozjazd uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Obszar roboczy i powłoka">
    - Sprawdzenie systemd linger w systemie Linux.
    - Sprawdzenie rozmiaru pliku bootstrap obszaru roboczego (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Sprawdzenie gotowości Skills dla domyślnego agenta; raportuje dozwolone skills z brakującymi plikami binarnymi, środowiskiem, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne skills w `skills.entries`.
    - Sprawdzenie stanu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Sprawdzenie gotowości dostawcy osadzania wyszukiwania pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Sprawdzenia instalacji ze źródeł (niezgodność obszaru roboczego pnpm, brakujące zasoby UI, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i reset UI Dreams

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded** dla przepływu pracy ugruntowanego Dreaming. Te akcje używają metod RPC w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym obszarze roboczym, uruchamia ugruntowany przebieg dziennika REM i zapisuje odwracalne wpisy uzupełniające do `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika uzupełniającego.
- **Clear Grounded** usuwa tylko przygotowane, wyłącznie ugruntowane wpisy krótkoterminowe, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze aktywnego przywołania ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów w aktywnym magazynie promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na normalną głęboką ścieżkę promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje z git)">
    Jeśli jest to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a polityka narzędzi używa
    symbolu wieloznacznego lub wpisów narzędzi należących do pluginu. `tools.allow: ["*"]` pasuje tylko do narzędzi
    z pluginów, które faktycznie się ładują; nie omija wyłącznej listy dozwolonych pluginów.
    Doctor zapisuje `plugins.bundledDiscovery: "compat"` dla zmigrowanych
    starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie dołączonych dostawców, a
    następnie wskazuje na bardziej rygorystyczne ustawienie `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które starsze klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Gateway automatycznie uruchamia także migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji. Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

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
    - Dla kanałów z nazwanymi `accounts`, ale z pozostałymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (starsze ustawienie przekaźnika rozszerzenia)
    - starsze `models.providers.*.api: "openai"` → `"openai-completions"` (uruchamianie Gateway pomija też dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość wyliczeniową, zamiast kończyć się błędem)

    Ostrzeżenia doctor obejmują też wskazówki dotyczące konta domyślnego dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` ani `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla listę skonfigurowanych identyfikatorów kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`. Może to wymusić modele na niewłaściwe API lub wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Host-local Chrome MCP nadal wymaga:

    - przeglądarki opartej na Chromium 144+ na hoście gateway/node
    - lokalnie uruchomionej przeglądarki
    - włączonego zdalnego debugowania w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość dotyczy tutaj tylko lokalnych wymagań wstępnych dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ten test **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów headless. Nadal używają one surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sprawdza punkt końcowy autoryzacji OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli sprawdzenie zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat samopodpisany), doctor wyświetla wskazówki naprawy właściwe dla platformy. W macOS z Homebrew Node poprawką jest zwykle `brew postinstall ca-certificates`. Z `--deep` sprawdzenie działa nawet wtedy, gdy Gateway jest sprawny.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy Codex OAuth">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy wykryje te stare ustawienia transportu obok Codex OAuth, aby można było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjnego przełączania. Niestandardowe proxy i nadpisania samych nagłówków są nadal obsługiwane i nie wyzwalają tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Ostrzeżenia tras Pluginu Codex">
    Gdy włączony jest dołączony Plugin Codex, doctor sprawdza też, czy odwołania do modelu podstawowego `openai-codex/*` nadal rozwiązują się przez domyślny runner PI. Ta kombinacja jest prawidłowa, gdy chcesz używać uwierzytelniania Codex OAuth/subskrypcji przez PI, ale łatwo pomylić ją z natywnym mechanizmem app-server Codex. Doctor ostrzega i wskazuje jawny kształt app-server: `openai/*` plus `agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor nie naprawia tego automatycznie, ponieważ obie trasy są prawidłowe:

    - `openai-codex/*` + PI oznacza „użyj uwierzytelniania Codex OAuth/subskrypcji przez normalny runner OpenClaw”.
    - `openai/*` + `agentRuntime.id: "codex"` oznacza „uruchom osadzoną turę przez natywny app-server Codex”.
    - `/codex ...` oznacza „steruj natywną rozmową Codex z czatu lub ją powiąż”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

    Jeśli pojawi się ostrzeżenie, wybierz zamierzoną trasę i ręcznie edytuj konfigurację. Pozostaw ostrzeżenie bez zmian, gdy PI Codex OAuth jest zamierzone.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje też magazyn aktywnych sesji pod kątem nieaktualnego, automatycznie utworzonego stanu trasy po przeniesieniu skonfigurowanego domyślnego/awaryjnego modelu lub runtime poza trasę należącą do Pluginu, taką jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modelu runtime, przypięte identyfikatory mechanizmów, powiązania sesji CLI i automatyczne nadpisania profili uwierzytelniania, gdy ich trasa właściciela nie jest już skonfigurowana. Jawne wybory modeli użytkownika lub starszych sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

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

    Te migracje są wykonywane w trybie best-effort i są idempotentne; doctor emituje ostrzeżenia, gdy pozostawi starsze foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje też starsze sesje i katalog agenta przy uruchomieniu, aby historia/uwierzytelnianie/modele trafiały do ścieżki właściwej dla agenta bez ręcznego uruchamiania doctor. Ujednolicanie dostawcy Talk/mapy dostawców porównuje teraz według równości strukturalnej, więc różnice dotyczące wyłącznie kolejności kluczy nie wyzwalają już powtarzających się, bezoperacyjnych zmian `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów Pluginów">
    Doctor skanuje wszystkie zainstalowane manifesty Pluginów pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu Cron">
    Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie lub `cron.store`, gdy został nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje dla zgodności.

    Bieżące porządki cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w payload → jawne `delivery.channel`
    - proste starsze zadania awaryjne webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

    Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez zmiany zachowania. Jeśli zadanie łączy starsze awaryjne notify z istniejącym trybem dostarczania innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

    W systemie Linux doctor ostrzega również, gdy crontab użytkownika nadal wywołuje starszy skrypt `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może uzyskać dostępu do magistrali użytkownika systemd. Usuń nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli kondycji używaj `openclaw channels status --probe`, `openclaw doctor` oraz `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokad zapisu — plików pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje uwagę i instruuje, aby uruchomić ponownie z `--fix`.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agentów pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptu z 2026.4.24: porzuconą turę użytkownika z wewnętrznym kontekstem runtime OpenClaw oraz aktywną gałąź równorzędną zawierającą ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu historia gateway i czytniki pamięci nie widzą już zduplikowanych tur.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, dane uwierzytelniające, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, prosi o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryta zostanie niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze operacje I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe operacje I/O oparte na SD lub eMMC mogą być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i danych uwierzytelniających.
    - **Brak katalogów sesji**: `sessions/` oraz katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie kumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy wiele folderów `~/.openclaw` istnieje w różnych katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może podzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (tam znajduje się stan).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest czytelny dla grupy/świata i oferuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają/wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic lub ścieżkę setup-token Anthropic. Prompty odświeżania pojawiają się tylko podczas działania interaktywnego (TTY); `--non-interactive` pomija próby odświeżania.

    Gdy odświeżenie OAuth kończy się trwałym niepowodzeniem (na przykład `refresh_token_reused`, `invalid_grant` albo dostawca informuje, że trzeba zalogować się ponownie), doctor raportuje, że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor raportuje również profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/limity czasu/niepowodzenia uwierzytelniania)
    - dłuższych wyłączeń (niepowodzenia rozliczeń/kredytów)

  </Accordion>
  <Accordion title="6. Walidacja modelu hooks">
    Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozwiązać lub jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu sandboxa">
    Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje zbudowanie lub przełączenie na starsze nazwy, jeśli brakuje bieżącego obrazu.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan przygotowywania zależności Plugin wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to nieaktualne wygenerowane katalogi główne zależności, stare katalogi etapów instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności bundled-plugin oraz osierocone lub odzyskane zarządzane kopie npm bundled `@openclaw/*` plugins, które mogą przesłaniać bieżący bundled manifest.

    Doctor może również ponownie zainstalować brakujące plugins do pobrania, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanałów/dostawców/wyszukiwania oraz skonfigurowane runtime agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet core jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchamianie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje plugins pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu gateway. Może również skanować dodatkowe usługi podobne do gateway i wypisywać wskazówki czyszczenia. Usługi OpenClaw gateway nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi gateway na poziomie użytkownika, ale istnieje usługa OpenClaw gateway na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy nadzorca systemowy odpowiada za cykl życia gateway.

  </Accordion>
  <Accordion title="8b. Migracja startowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub wykonalną migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy snapshot sprzed migracji, a następnie uruchamia kroki migracji best-effort: migrację starszego stanu Matrix oraz przygotowanie starszego zaszyfrowanego stanu. Oba kroki są nietrwałymi błędami; błędy są logowane, a start jest kontynuowany. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
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
    - lokalne buforowane wpisy tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie gateway lub zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne następne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka typową lukę „już sparowane, ale nadal wymaga parowania”: doctor odróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu oraz od dryfu nieaktualnego tokenu/tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez listy dozwolonych albo gdy polityka jest skonfigurowana w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że linger jest włączony, aby gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan obszaru roboczego (skills, plugins i starsze katalogi)">
    Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

    - **Stan Skills**: zlicza skills kwalifikujące się, z brakującymi wymaganiami i zablokowane przez listę dozwolonych.
    - **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego istnieją obok bieżącego obszaru roboczego.
    - **Stan Plugin**: zlicza włączone/wyłączone/błędne plugins; wypisuje identyfikatory Plugin dla wszystkich błędów; raportuje możliwości bundled Plugin.
    - **Ostrzeżenia zgodności Plugin**: oznacza plugins, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka Plugin**: ujawnia wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez rejestr Plugin.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`, `CLAUDE.md` albo inne wstrzyknięte pliki kontekstu) są blisko skonfigurowanego budżetu znaków lub go przekraczają. Raportuje dla każdego pliku liczbę znaków surowych względem wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako część całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego Plugin kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa również wiszącą konfigurację o zakresie kanału, która odwoływała się do tego Plugin: wpisy `channels.<id>`, cele heartbeat, które wskazywały kanał, oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom rozruchowym Gateway, w których runtime kanału zniknął, ale konfiguracja nadal żąda od gateway powiązania z nim.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa powolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu pliku z pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie regeneruje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor prosi o jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnym tokenem gateway.

    - Jeśli tryb tokenu wymaga tokenu, a nie istnieje żadne źródło tokenu, doctor oferuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy naprawy muszą sprawdzić skonfigurowane dane uwierzytelniające bez osłabiania zachowania runtime fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowań SecretRef tylko do odczytu co polecenia z rodziny statusu dla ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii albo błędnie zgłaszać token jako brakujący.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje ponowne uruchomienie gateway, gdy wygląda na niezdrowy.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzeń wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego zaplecza i dostawcy:

    - **Zaplecze QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wypisuje wskazówki naprawy obejmujące pakiet npm oraz opcję ręcznej ścieżki do pliku binarnego.
    - **Jawny dostawca lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny adres URL modelu. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawny dostawca zdalny** (`openai`, `voyage` itd.): sprawdza, czy klucz API jest obecny w środowisku albo magazynie uwierzytelniania. Wypisuje możliwe do wykonania wskazówki naprawy, jeśli go brakuje.
    - **Dostawca automatyczny**: najpierw sprawdza dostępność lokalnego modelu, a potem próbuje każdego dostawcy zdalnego w kolejności automatycznego wyboru.

    Gdy dostępny jest wynik sondy gateway z pamięci podręcznej (gateway był zdrowy w chwili sprawdzania), doctor zestawia jego wynik z konfiguracją widoczną dla CLI i odnotowuje każdą rozbieżność. Doctor nie uruchamia świeżego pingu osadzeń na domyślnej ścieżce; użyj głębokiego polecenia statusu pamięci, gdy chcesz sprawdzić dostawcę na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzeń w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia statusu kanału">
    Jeśli gateway jest zdrowy, doctor uruchamia sondę statusu kanału i zgłasza ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji nadzorcy + naprawa">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących albo przestarzałych wartości domyślnych (np. zależności systemd od network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
    - `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gateway. Nadal zgłasza kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji nadzorcy i czyszczenie starszych usług, ponieważ zewnętrzny nadzorca zarządza tym cyklem życia.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/punktu wejścia, gdy pasująca jednostka systemd gateway jest aktywna. Ignoruje też nieaktywne, niedziedziczone dodatkowe jednostki podobne do gateway podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie generowały szumu czyszczenia.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi przez doctor waliduje SecretRef, ale nie zapisuje rozwiązanych wartości tokena w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła czasu działania zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stare `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy z możliwymi do wykonania wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek Linux user-systemd kontrole dryfu tokena w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usługi przez doctor odmawiają przepisania, zatrzymania albo restartu usługi gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka czasu działania Gateway + portu">
    Doctor sprawdza czas działania usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale w rzeczywistości nie działa. Sprawdza też kolizje portów na porcie gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki czasu działania Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun albo na ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane albo naprawione LaunchAgents systemu macOS używają kanonicznej systemowej PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować interaktywną PATH powłoki, więc katalogi Volta, asdf, fnm, pnpm i innych menedżerów wersji nie zmieniają tego, który Node zostanie rozwiązany przez procesy potomne. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) i stabilne katalogi user-bin, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane do PATH usługi tylko wtedy, gdy te katalogi istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby zapisać uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące obszaru roboczego (kopia zapasowa + system pamięci)">
    Doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i wypisuje wskazówkę dotyczącą kopii zapasowej, jeśli obszar roboczy nie jest jeszcze pod kontrolą git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze obszaru roboczego i kopii zapasowej git (zalecane prywatne GitHub albo GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
