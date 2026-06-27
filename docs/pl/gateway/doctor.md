---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian konfiguracji powodujących niezgodność wstecz
sidebarTitle: Doctor
summary: 'Polecenie doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Lekarz
x-i18n:
    generated_at: "2026-06-27T17:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie do naprawy i migracji dla OpenClaw. Naprawia przestarzałą konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

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
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Stosuje zalecane naprawy bez monitów (naprawy + restarty tam, gdzie jest to bezpieczne).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Uruchamia ustrukturyzowane kontrole kondycji dla CI lub automatyzacji preflight. Ten tryb jest
    tylko do odczytu: nie wyświetla monitów, nie naprawia, nie migruje konfiguracji, nie restartuje usług ani
    nie dotyka stanu.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija akcje restartu/usługi/sandboxa, które wymagają potwierdzenia przez człowieka. Migracje stanu legacy uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gatewaya (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracyjny:

```bash
cat ~/.openclaw/openclaw.json
```

## Tryb lint tylko do odczytu

`openclaw doctor --lint` to przyjazny automatyzacji odpowiednik
`openclaw doctor --fix`. Oba używają kontroli kondycji doctora, ale ich podejście jest
inne:

| Tryb                     | Monity    | Zapisuje konfigurację/stan | Dane wyjściowe                    | Użyj do                          |
| ------------------------ | --------- | -------------------------- | --------------------------------- | -------------------------------- |
| `openclaw doctor`        | tak       | nie                        | przyjazny raport kondycji         | sprawdzania statusu przez człowieka |
| `openclaw doctor --fix`  | czasami   | tak, zgodnie z polityką napraw | przyjazny dziennik naprawy      | stosowania zatwierdzonych napraw |
| `openclaw doctor --lint` | nie       | nie                        | ustrukturyzowane ustalenia        | CI, preflight i bramek przeglądu |

Zmodernizowane kontrole kondycji mogą udostępniać opcjonalną implementację `repair()`.
`doctor --fix` stosuje te naprawy, gdy istnieją, i nadal używa
istniejącego przepływu napraw doctora dla kontroli, które jeszcze nie zostały zmigrowane.
Ustrukturyzowany kontrakt napraw oddziela także raportowanie napraw od wykrywania:
`detect()` raportuje bieżące ustalenia, natomiast `repair()` może raportować zmiany,
różnice konfiguracji/plików oraz skutki uboczne niezwiązane z plikami. Dzięki temu ścieżka migracji pozostaje otwarta
dla przyszłych `doctor --fix --dry-run` i danych wyjściowych diff bez zmuszania kontroli lint
do planowania mutacji.

Przykłady:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Dane wyjściowe JSON obejmują:

- `ok`: czy jakiekolwiek widoczne ustalenie spełniło wybrany próg ważności
- `checksRun`: liczba wykonanych kontroli kondycji
- `checksSkipped`: kontrole pominięte przez wybrany profil, `--only` lub `--skip`
- `findings`: ustrukturyzowana diagnostyka z `checkId`, `severity`, `message` oraz
  opcjonalnymi `path`, `line`, `column`, `ocPath` i `fixHint`

Kody wyjścia:

- `0`: brak ustaleń na wybranym progu lub powyżej niego
- `1`: co najmniej jedno ustalenie spełniło wybrany próg
- `2`: awaria polecenia/środowiska uruchomieniowego, zanim można było wyemitować ustalenia lintowania

Użyj `--severity-min info|warning|error`, aby kontrolować zarówno to, co jest wypisywane, jak i to, co
powoduje niezerowy kod wyjścia lintowania. Użyj `--all`, aby uruchomić pełny zestaw lintowania,
w tym głębsze kontrole opt-in wykluczone z domyślnego zestawu automatyzacji. Użyj `--only <id>` dla wąskich bramek preflight oraz
`--skip <id>`, aby tymczasowo wykluczyć hałaśliwą kontrolę, zachowując aktywną resztę
przebiegu lintowania.
Opcje wyjścia lintowania, takie jak `--json`, `--severity-min`, `--all`, `--only` i
`--skip`, muszą być sparowane z `--lint`; zwykłe uruchomienia doctor i naprawy odrzucają
je.

## Co robi (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, UI i aktualizacje">
    - Opcjonalna aktualizacja pre-flight dla instalacji git (tylko interaktywnie).
    - Kontrola świeżości protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
    - Kontrola kondycji + monit o ponowne uruchomienie.
    - Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status Plugin.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji dla wartości legacy.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migracja starszego dostawcy/profilu OpenAI Codex (`openai-codex` → `openai`) i ostrzeżenia o przesłanianiu dla nieaktualnego `models.providers.openai-codex`.
    - Kontrola wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
    - Ostrzeżenia allowlist Plugin/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale polityka narzędzi nadal żąda wildcard lub narzędzi należących do Plugin.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/auth WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola delivery/payload najwyższego poziomu, payload `provider`, zastępcze zadania Webhook `notify: true`).
    - Czyszczenie starszej polityki środowiska uruchomieniowego całego agenta; polityka środowiska uruchomieniowego dostawcy/modelu jest aktywnym selektorem trasy.
    - Czyszczenie nieaktualnej konfiguracji Plugin, gdy plugins są włączone; gdy `plugins.enabled=false`, nieaktualne odwołania do Plugin są traktowane jako nieaktywna konfiguracja ograniczająca i są zachowywane.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Inspekcja plików blokady sesji i czyszczenie nieaktualnych blokad.
    - Naprawa transkrypcji sesji dla zduplikowanych gałęzi przepisywania promptów utworzonych przez dotknięte tym kompilacje 2026.4.24.
    - Wykrywanie tombstone odzyskiwania po restarcie zablokowanego podagenta, z obsługą `--fix` do czyszczenia nieaktualnych flag przerwanego odzyskiwania, aby uruchamianie nie traktowało dalej procesu potomnego jako przerwanego przez restart.
    - Kontrole integralności stanu i uprawnień (sesje, transkrypcje, katalog stanu).
    - Kontrole uprawnień pliku konfiguracji (chmod 600) przy uruchamianiu lokalnym.
    - Kondycja autoryzacji modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu autoryzacji.

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu sandbox, gdy sandboxing jest włączony.
    - Migracja starszej usługi i wykrywanie dodatkowego gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Kontrole środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
    - Ostrzeżenia statusu kanału (sondowane z działającego gateway).
    - Kontrole uprawnień specyficzne dla kanału znajdują się pod `openclaw channels capabilities`; na przykład uprawnienia kanału głosowego Discord są audytowane za pomocą `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kontrole responsywności WhatsApp dla obniżonej kondycji pętli zdarzeń Gateway przy nadal działających lokalnych klientach TUI; `--fix` zatrzymuje tylko zweryfikowanych lokalnych klientów TUI.
    - Naprawa trasy Codex dla starszych referencji modeli `openai-codex/*` w modelach głównych, fallbackach, modelach generowania obrazów/wideo, nadpisaniach heartbeat/podagenta/Compaction, hookach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*`, migruje profile/kolejność auth `openai-codex:*` do `openai:*`, usuwa nieaktualne przypięcia środowiska uruchomieniowego sesji/całego agenta i pozostawia kanoniczne referencje agentów OpenAI na domyślnym harnessie Codex.
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie osadzonego środowiska proxy dla usług gateway, które przechwyciły wartości shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Kontrole najlepszych praktyk środowiska uruchomieniowego Gateway (Node kontra Bun, ścieżki menedżera wersji).
    - Diagnostyka kolizji portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Autoryzacja, bezpieczeństwo i parowanie">
    - Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
    - Kontrole auth Gateway dla trybu tokenu lokalnego (oferuje wygenerowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenu).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, dryf nieaktualnego lokalnego cache tokenu urządzenia oraz dryf auth sparowanego rekordu).

  </Accordion>
  <Accordion title="Workspace i shell">
    - Kontrola systemd linger w systemie Linux.
    - Kontrola rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
    - Kontrola gotowości Skills dla domyślnego agenta; raportuje dozwolone skills z brakującymi binariami, env, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne skills w `skills.entries`.
    - Kontrola statusu uzupełniania shell i automatyczna instalacja/aktualizacja.
    - Kontrola gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarium QMD).
    - Kontrole instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakujące binarium tsx).
    - Zapisuje zaktualizowaną konfigurację + metadane kreatora.

  </Accordion>
</AccordionGroup>

## Wypełnianie wstecz i reset UI Dreams

Scena Dreams w Control UI obejmuje akcje **Wypełnij wstecz**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu pracy ugruntowanego Dreaming. Te akcje używają metod RPC w stylu gateway doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Wypełnij wstecz** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia ugruntowany przebieg dziennika REM i zapisuje odwracalne wpisy wypełnienia wstecz do `DREAMS.md`.
- **Resetuj** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika wypełnienia wstecz.
- **Wyczyść ugruntowane** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie ugruntowane, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze bieżącego przypomnienia ani dziennego wsparcia.

Czego same **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów do aktywnego magazynu krótkoterminowej promocji, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtworzenie wpływało na normalny pas głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, przed uruchomieniem doctor oferuje aktualizację (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

    Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, a konfiguracja głosu realtime to `talk.realtime.*`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców i przepisuje starsze selektory realtime najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega także, gdy `plugins.allow` nie jest puste, a zasady narzędzi używają wpisów z symbolem wieloznacznym lub wpisów narzędzi należących do Plugin. `tools.allow: ["*"]` dopasowuje tylko narzędzia z Plugin, które faktycznie się wczytują; nie omija wyłącznej listy dozwolonych Plugin.

  </Accordion>
  <Accordion title="2. Migracje przestarzałych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą o uruchomienie `openclaw doctor`.

    Doctor:

    - Wyjaśni, które przestarzałe klucze znaleziono.
    - Pokaże zastosowaną migrację.
    - Przepisze `~/.openclaw/openclaw.json` ze zaktualizowanym schematem.

    Uruchomienie Gateway odrzuca przestarzałe formaty konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas uruchamiania. Migracje magazynu zadań Cron są także obsługiwane przez `openclaw doctor --fix`.

    Obecne migracje:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - usuń wycofane `channels.webchat` i `gateway.webchat`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → najwyższego poziomu `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - przestarzałe `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - przestarzałe selektory Talk czasu rzeczywistego najwyższego poziomu (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` i `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` i `messages.tts.providers.microsoft`
    - pola wyboru mówcy TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` i `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` i `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - W przypadku kanałów z nazwanymi `accounts`, ale z pozostającymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - usuń `agents.defaults.llm`; użyj `models.providers.<id>.timeoutSeconds` dla limitów czasu wolnych dostawców/modeli i utrzymuj limit czasu agenta/uruchomienia powyżej tej wartości, gdy całe uruchomienie musi trwać dłużej
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - usuń `browser.relayBindHost` (przestarzałe ustawienie przekaźnika rozszerzenia)
    - przestarzałe `models.providers.*.api: "openai"` → `"openai-completions"` (uruchomienie Gateway pomija także dostawców, których `api` jest ustawione na przyszłą lub nieznaną wartość wyliczenia, zamiast odmawiać działania)
    - usuń `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze zachowuje natywne dla Codex narzędzia obszaru roboczego jako natywne

    Ostrzeżenia Doctor obejmują także wskazówki dotyczące domyślnego konta dla kanałów z wieloma kontami:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `openclaw/plugin-sdk/llm`. Może to wymusić modele na niewłaściwym API albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routing API oraz koszty dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta:

    - `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
    - `browser.relayBindHost` jest usuwane

    Doctor audytuje także ścieżkę Chrome MCP lokalną dla hosta, gdy używasz `defaultProfile: "user"` lub skonfigurowanego profilu `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć za Ciebie ustawienia po stronie Chrome. Chrome MCP lokalne dla hosta nadal wymaga:

    - przeglądarki opartej na Chromium w wersji 144+ na hoście Gateway/węzła
    - lokalnie uruchomionej przeglądarki
    - zdalnego debugowania włączonego w tej przeglądarce
    - zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

    Gotowość tutaj dotyczy wyłącznie lokalnych wymagań wstępnych do dołączenia. Existing-session zachowuje bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i akcje wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP.

    Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów headless. One nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne OAuth TLS">
    Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor sonduje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli sonda nie powiedzie się z błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat z podpisem własnym), doctor wypisuje wskazówki naprawcze specyficzne dla platformy. W macOS z Node z Homebrew naprawą jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa nawet wtedy, gdy Gateway jest zdrowy.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy OAuth Codex">
    Jeśli wcześniej dodano przestarzałe ustawienia transportu OpenAI pod `models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę dostawcy OAuth Codex, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi te stare ustawienia transportu obok OAuth Codex, aby można było usunąć lub przepisać przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/awaryjne. Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.
  </Accordion>
  <Accordion title="2f. Naprawa tras Codex">
    Doctor sprawdza przestarzałe odwołania do modeli `openai-codex/*`. Natywny routing uprzęży Codex używa kanonicznych odwołań do modeli `openai/*`; tury agentów OpenAI przechodzą przez uprząż serwera aplikacji Codex zamiast przez ścieżkę dostawcy OpenAI w OpenClaw.

    W trybie `--fix` / `--repair` doctor przepisuje dotknięte odwołania agenta domyślnego i poszczególnych agentów, w tym modele główne, awaryjne, modele generowania obrazów/wideo, nadpisania heartbeat/subagent/compaction, hooks, nadpisania modeli kanałów i przestarzały utrwalony stan tras sesji:

    - `openai-codex/gpt-*` staje się `openai/gpt-*`.
    - Intencja Codex przenosi się do wpisów `agentRuntime.id: "codex"` o zakresie dostawcy/modelu dla naprawionych odwołań do modeli agentów.
    - Przestarzała konfiguracja środowiska uruchomieniowego całego agenta i utrwalone przypięcia środowiska uruchomieniowego sesji są usuwane, ponieważ wybór środowiska uruchomieniowego ma zakres dostawcy/modelu.
    - Istniejące zasady środowiska uruchomieniowego dostawcy/modelu są zachowywane, chyba że naprawiane przestarzałe odwołanie do modelu wymaga routingu Codex, aby zachować starą ścieżkę uwierzytelniania.
    - Istniejące listy modeli awaryjnych są zachowywane z przepisanymi przestarzałymi wpisami; skopiowane ustawienia dla poszczególnych modeli przenoszą się z przestarzałego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone sesyjne `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia o modelach awaryjnych i przypięcia profili uwierzytelniania są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - `/codex ...` oznacza „steruj lub powiąż natywną konwersację Codex z czatu”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użyj zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje także wykryte magazyny sesji agentów pod kątem przestarzałego, automatycznie utworzonego stanu tras po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy należącej do Plugin, takiej jak Codex.

    `openclaw doctor --fix` może wyczyścić automatycznie utworzony przestarzały stan, taki jak przypięcia modelu `modelOverrideSource: "auto"`, metadane modelu środowiska uruchomieniowego, przypięte identyfikatory uprzęży, powiązania sesji CLI i automatyczne nadpisania profilu uwierzytelniania, gdy należąca do nich trasa nie jest już skonfigurowana. Wyraźne wybory użytkownika lub przestarzałych modeli sesji są zgłaszane do ręcznego przeglądu i pozostawiane bez zmian; przełącz je za pomocą `/model ...`, `/new` albo zresetuj sesję, gdy ta trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje przestarzałego stanu (układ dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji + transkrypcje:
      - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta:
      - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys):
      - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
      - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane w trybie najlepszej próby i są idempotentne; doctor wyemituje ostrzeżenia, gdy pozostawi jakiekolwiek przestarzałe foldery jako kopie zapasowe. Gateway/CLI automatycznie migruje także przestarzałe sesje + katalog agenta podczas uruchamiania, aby historia/uwierzytelnianie/modele trafiły do ścieżki dla poszczególnych agentów bez ręcznego uruchamiania doctor. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz według równości strukturalnej, więc różnice dotyczące wyłącznie kolejności kluczy nie wywołują już powtarzanych zmian `doctor --fix`, które nic nie robią.

  </Accordion>
  <Accordion title="3a. Starsze migracje manifestu Plugin">
    Doctor skanuje wszystkie manifesty zainstalowanych Plugin pod kątem przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Gdy je znajdzie, proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Starsze migracje magazynu Cron">
    Doctor sprawdza też magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie albo `cron.store`, gdy został nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal akceptuje ze względów zgodności.

    Bieżące porządki Cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - starsze zadania awaryjne Webhook z `notify: true` → jawne dostarczanie Webhook z `cron.webhook`, gdy jest ustawione; zadania ogłoszeń zachowują dostarczanie czatu i otrzymują `delivery.completionDestination`. Gdy `cron.webhook` nie jest ustawione, bezczynny znacznik najwyższego poziomu `notify` jest usuwany dla zadań bez celu (istniejące dostarczanie, w tym ogłoszenia, jest zachowywane), ponieważ dostarczanie w czasie wykonywania nigdy go nie odczytuje

    Gateway oczyszcza też nieprawidłowe wiersze Cron podczas ładowania, aby poprawne zadania nadal działały. Surowe nieprawidłowe wiersze są kopiowane do `jobs-quarantine.json` obok aktywnego magazynu przed usunięciem ich z `jobs.json`; doctor raportuje wiersze poddane kwarantannie, aby można je było przejrzeć lub naprawić ręcznie.

    Uruchomienie Gateway normalizuje projekcję czasu wykonywania i ignoruje znacznik najwyższego poziomu `notify`, ale pozostawia utrwaloną konfigurację Cron do naprawy przez doctor. Gdy `cron.webhook` nie jest ustawione, doctor usuwa bezczynny znacznik dla zadań bez celu migracji (`delivery.mode` brak/nieobecne, nieużywalny cel Webhook albo istniejące dostarczanie ogłoszenia/czatu), pozostawiając istniejące dostarczanie bez zmian, więc powtarzane uruchomienia `doctor --fix` nie ostrzegają już ponownie o tym samym zadaniu. Jeśli `cron.webhook` jest ustawione, ale nie jest prawidłowym adresem URL HTTP(S), doctor nadal ostrzega i pozostawia znacznik, aby można było poprawić adres URL.

    W systemie Linux doctor ostrzega też, gdy crontab użytkownika nadal wywołuje starsze `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżący OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` do `~/.openclaw/logs/whatsapp-health.log`, gdy Cron nie może dotrzeć do magistrali użytkownika systemd. Usuń przestarzały wpis crontab za pomocą `crontab -e`; do bieżących kontroli stanu używaj `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta pod kątem przestarzałych plików blokady zapisu — plików pozostawionych po nienormalnym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest uznawana za przestarzałą (martwy PID, nieprawidłowe metadane właściciela, starsza niż 30 minut albo żywy PID, który można udowodnić jako należący do procesu innego niż OpenClaw). W trybie `--fix` / `--repair` automatycznie usuwa blokady z martwymi, osieroconymi, ponownie użytymi, starymi nieprawidłowymi lub nie-OpenClaw właścicielami. Stare blokady, które nadal należą do żywego procesu OpenClaw, są raportowane, ale pozostają na miejscu, aby doctor nie odciął aktywnego zapisującego transkrypcję.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agenta pod kątem zduplikowanego kształtu gałęzi utworzonego przez błąd przepisywania transkrypcji promptu z 2026.4.24: porzucony zwrot użytkownika z wewnętrznym kontekstem czasu wykonywania OpenClaw oraz aktywne rodzeństwo zawierające ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego dotkniętego pliku obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu historia Gateway i czytniki pamięci nie widzą już zduplikowanych zwrotów.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, tracisz sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, pyta o ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień (i emituje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O oraz wyścigi blokad/synchronizacji.
    - **Katalog stanu Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`, ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej się zużywać przy zapisach sesji i poświadczeń.
    - **Ulotny katalog stanu Linux**: ostrzega, gdy stan rozwiązuje się do `tmpfs` lub `ramfs`, ponieważ sesje, poświadczenia, konfiguracja oraz stan SQLite wraz z plikami pobocznymi WAL/dziennika znikną po ponownym uruchomieniu. Montowania Docker `overlay` celowo nie są oznaczane, ponieważ ich warstwy zapisywalne utrzymują się między restartami hosta, dopóki kontener pozostaje.
    - **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są wymagane do utrwalania historii i unikania awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące pliki transkrypcji.
    - **Główna sesja „1-line JSONL”**: oznacza, gdy główna transkrypcja ma tylko jeden wiersz (historia się nie akumuluje).
    - **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może podzielić się między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się tam).
    - **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest odczytywalny dla grupy/świata i proponuje zaostrzenie do `600`.

  </Accordion>
  <Accordion title="5. Stan uwierzytelniania modeli (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny wygasają/wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil Anthropic OAuth/token jest nieaktualny, sugeruje klucz API Anthropic albo ścieżkę tokenu konfiguracji Anthropic. Monity o odświeżenie pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth kończy się trwale niepowodzeniem (na przykład `refresh_token_reused`, `invalid_grant` albo provider każe ponownie się zalogować), doctor raportuje, że wymagana jest ponowna autoryzacja, i wypisuje dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor raportuje też profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

    - krótkich okresów wyciszenia (limity szybkości/limity czasu/niepowodzenia uwierzytelniania)
    - dłuższych wyłączeń (niepowodzenia rozliczeń/kredytów)

    Starsze profile OAuth Codex, których tokeny znajdują się w macOS Keychain (starsze wdrożenie sprzed układu sidecar opartego na plikach), są naprawiane tylko przez doctor. Uruchom `openclaw doctor --fix` raz z interaktywnego terminala, aby zmigrować starsze tokeny oparte na Keychain w miejscu do `auth-profiles.json`; potem osadzone zwroty (Telegram, Cron, wysyłka podagentów) rozwiązują je jako kanoniczne profile OpenAI OAuth.

  </Accordion>
  <Accordion title="6. Walidacja modelu hooków">
    Jeśli `hooks.gmail.model` jest ustawione, doctor waliduje referencję modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie zostanie rozwiązana lub jest niedozwolona.
  </Accordion>
  <Accordion title="7. Naprawa obrazu piaskownicy">
    Gdy piaskownica jest włączona, doctor sprawdza obrazy Docker i proponuje zbudowanie lub przełączenie na starsze nazwy, jeśli bieżący obraz jest brakujący.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Plugin">
    Doctor usuwa starszy stan przygotowania zależności Plugin wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`. Obejmuje to przestarzałe wygenerowane katalogi główne zależności, stare katalogi etapu instalacji, lokalne dla pakietu pozostałości po wcześniejszym kodzie naprawy zależności dołączanych Plugin oraz osierocone lub odzyskane zarządzane kopie npm dołączanych Plugin `@openclaw/*`, które mogą przesłaniać bieżący dołączony manifest. Doctor ponownie łączy też pakiet hosta `openclaw` z zarządzanymi Plugin npm, które deklarują `peerDependencies.openclaw`, aby lokalne dla pakietu importy czasu wykonywania, takie jak `openclaw/plugin-sdk/*`, nadal rozwiązywały się po aktualizacjach lub naprawach npm.

    Doctor może też ponownie zainstalować brakujące Plugin do pobrania, gdy konfiguracja się do nich odwołuje, ale lokalny rejestr Plugin nie może ich znaleźć. Przykłady obejmują materialne `plugins.entries`, skonfigurowane ustawienia kanału/providera/wyszukiwania oraz skonfigurowane środowiska wykonawcze agentów. Podczas aktualizacji pakietów doctor unika uruchamiania naprawy Plugin przez menedżera pakietów, gdy pakiet core jest podmieniany; uruchom `openclaw doctor --fix` ponownie po aktualizacji, jeśli skonfigurowany Plugin nadal wymaga odzyskania. Uruchomienie Gateway i ponowne ładowanie konfiguracji nie uruchamiają menedżerów pakietów; instalacje Plugin pozostają jawną pracą doctor/install/update.

  </Accordion>
  <Accordion title="8. Migracje usług Gateway i wskazówki czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw z użyciem bieżącego portu Gateway. Może też skanować w poszukiwaniu dodatkowych usług podobnych do Gateway i wypisywać wskazówki czyszczenia. Usługi Gateway OpenClaw nazwane profilem są uznawane za pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Sprawdź za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usuń duplikat albo ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy nadzorca systemowy jest właścicielem cyklu życia Gateway.

  </Accordion>
  <Accordion title="8b. Migracja startowa Matrix">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania starszą migrację stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę przedmigracyjną, a następnie uruchamia kroki migracji w trybie najlepszych starań: migrację starszego stanu Matrix oraz przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
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
    - lokalne buforowane wpisy tokenów urządzeń dla bieżącej maszyny, które poprzedzają rotację tokenu po stronie Gateway albo zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego wypisuje dokładne kolejne kroki:

    - sprawdź oczekujące żądania za pomocą `openclaw devices list`
    - zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
    - zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usuń i ponownie zatwierdź przestarzały rekord za pomocą `openclaw devices remove <deviceId>`

    To zamyka częstą lukę „już sparowano, ale nadal pojawia się wymaganie parowania”: doctor odróżnia teraz pierwsze parowanie od oczekujących aktualizacji roli/zakresu oraz od nieaktualnego tokenu lub dryfu tożsamości urządzenia.

  </Accordion>
  <Accordion title="9. Ostrzeżenia bezpieczeństwa">
    Doctor emituje ostrzeżenia, gdy provider jest otwarty na wiadomości prywatne bez listy dozwolonych, albo gdy policy skonfigurowano w niebezpieczny sposób.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby gateway pozostawał aktywny po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan workspace (Skills, pluginy i TaskFlows)">
    Doctor wypisuje podsumowanie stanu workspace dla domyślnego agenta:

    - **Stan Skills**: zlicza Skills kwalifikujące się, z brakującymi wymaganiami oraz zablokowane przez listę dozwolonych.
    - **Stan pluginów**: zlicza włączone/wyłączone/błędne pluginy; wymienia identyfikatory pluginów dla wszystkich błędów; raportuje capabilities pluginów pakietowych.
    - **Ostrzeżenia zgodności pluginów**: oznacza pluginy, które mają problemy ze zgodnością z bieżącym runtime.
    - **Diagnostyka pluginów**: ujawnia wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez rejestr pluginów.
    - **Odzyskiwanie TaskFlow**: ujawnia podejrzane zarządzane TaskFlows, które wymagają ręcznej inspekcji lub anulowania.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku bootstrap">
    Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego budżetu znaków albo go przekraczają. Raportuje dla każdego pliku surową liczbę znaków względem wstrzykniętej, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako część całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wypisuje wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnego pluginu kanału">
    Gdy `openclaw doctor --fix` usuwa brakujący plugin kanału, usuwa także wiszącą konfigurację o zakresie kanału, która odwoływała się do tego pluginu: wpisy `channels.<id>`, cele Heartbeat wskazujące kanał oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, w których runtime kanału już nie istnieje, ale konfiguracja nadal każe gateway się do niego powiązać.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki (zsh, bash, fish lub PowerShell):

    - Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu pliku z cache.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache, doctor automatycznie regeneruje cache.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor proponuje jego instalację (tylko tryb interaktywny; pomijane z `--non-interactive`).

    Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

  </Accordion>
  <Accordion title="12. Kontrole auth Gateway (token lokalny)">
    Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem gateway.

    - Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje wygenerowanie tokenu.
    - Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano SecretRef tokenu.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu świadome SecretRef">
    Niektóre przepływy napraw muszą sprawdzić skonfigurowane credentials bez osłabiania zachowania runtime typu fail-fast.

    - `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu na potrzeby ukierunkowanych napraw konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych credentials bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor raportuje, że credential jest skonfigurowany, lecz niedostępny, i pomija automatyczne rozpoznawanie zamiast kończyć się awarią lub błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + restart">
    Doctor uruchamia kontrolę kondycji i proponuje restart gateway, gdy wygląda na niesprawny.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania pamięci">
    Doctor sprawdza, czy skonfigurowany provider embeddingów wyszukiwania pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i providera:

    - **Backend QMD**: sprawdza, czy binarium `qmd` jest dostępne i można je uruchomić. Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm oraz opcję ręcznej ścieżki do binarium.
    - **Jawny provider lokalny**: sprawdza lokalny plik modelu albo rozpoznany zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na providera zdalnego.
    - **Jawny provider zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest obecny w środowisku lub magazynie auth. Jeśli go brakuje, wypisuje praktyczne wskazówki naprawy.
    - **Starszy provider auto**: traktuje `memorySearch.provider: "auto"` jako OpenAI, sprawdza gotowość OpenAI, a `doctor --fix` przepisuje go na `provider: "openai"`.

    Gdy dostępny jest wynik sondy gateway z cache (gateway był sprawny w chwili kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i odnotowuje każdą rozbieżność. Doctor nie uruchamia świeżego pinga embeddingów na domyślnej ścieżce; użyj głębokiego polecenia statusu pamięci, gdy chcesz sprawdzić providera na żywo.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o stanie kanałów">
    Jeśli gateway jest sprawny, doctor uruchamia sondę stanu kanałów i raportuje ostrzeżenia z sugerowanymi poprawkami.
  </Accordion>
  <Accordion title="15. Audyt konfiguracji supervisora + naprawa">
    Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd network-online i opóźnienia restartu). Gdy znajdzie niezgodność, zaleca aktualizację i może przepisać plik usługi/zadanie do bieżących wartości domyślnych.

    Uwagi:

    - `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
    - `openclaw doctor --yes` akceptuje domyślne monity naprawy.
    - `openclaw doctor --fix` stosuje zalecane poprawki bez monitów (`--repair` jest aliasem).
    - `openclaw doctor --fix --force` nadpisuje niestandardowe konfiguracje supervisora.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje doctor w trybie tylko do odczytu dla cyklu życia usługi gateway. Nadal raportuje kondycję usługi i uruchamia naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/restart/bootstrap usługi, przepisywanie konfiguracji supervisora i czyszczenie starszych usług, ponieważ ten cykl życia należy do zewnętrznego supervisora.
    - W systemie Linux doctor nie przepisuje metadanych polecenia/entrypoint, gdy pasująca jednostka systemd gateway jest aktywna. Ignoruje też nieaktywne, niebędące starszymi dodatkowymi jednostki podobne do gateway podczas skanowania zduplikowanych usług, aby towarzyszące pliki usług nie generowały szumu czyszczenia.
    - Jeśli auth tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi doctor waliduje SecretRef, ale nie utrwala rozwiązanych wartości tokenu w tekście jawnym w metadanych środowiska usługi supervisora.
    - Doctor wykrywa wartości środowiska usługi zarządzane przez `.env`/oparte na SecretRef, które starsze instalacje LaunchAgent, systemd lub Windows Scheduled Task osadziły inline, i przepisuje metadane usługi tak, aby te wartości były ładowane ze źródła runtime zamiast z definicji supervisora.
    - Doctor wykrywa, gdy polecenie usługi nadal przypina stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli auth tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, doctor blokuje ścieżkę instalacji/naprawy z praktycznymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
    - Dla jednostek user-systemd w systemie Linux kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych auth usługi.
    - Naprawy usługi doctor odmawiają przepisania, zatrzymania lub restartu usługi gateway ze starszego binarium OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + diagnostyka portów">
    Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portów na porcie gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Najlepsze praktyki runtime Gateway">
    Doctor ostrzega, gdy usługa gateway działa na Bun albo ścieżce Node zarządzanej wersjami (`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node, a ścieżki menedżerów wersji mogą zepsuć się po aktualizacjach, ponieważ usługa nie ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione macOS LaunchAgents używają kanonicznego systemowego PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiować PATH interaktywnej powłoki, dzięki czemu binaria systemowe zarządzane przez Homebrew pozostają dostępne, a Volta, asdf, fnm, pnpm i inne katalogi menedżerów wersji nie zmieniają tego, który Node jest rozpoznawany przez procesy potomne. Usługi Linux nadal zachowują jawne korzenie środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi user-bin, ale odgadnięte katalogi awaryjne menedżerów wersji są zapisywane w PATH usługi tylko wtedy, gdy istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji + metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zapisać uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki workspace (backup + system pamięci)">
    Doctor sugeruje system pamięci workspace, gdy go brakuje, i wypisuje wskazówkę backupu, jeśli workspace nie jest jeszcze pod kontrolą git.

    Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po strukturze workspace i backupie git (zalecane prywatne GitHub lub GitLab).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
