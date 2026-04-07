---
read_when:
    - Dodajesz lub modyfikujesz migracje doctor
    - Wprowadzasz niezgodne wstecz zmiany konfiguracji
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-07T09:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a834dc7aec79c20d17bc23d37fb5f5e99e628d964d55bd8cf24525a7ee57130c
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` to narzędzie naprawcze i migracyjne dla OpenClaw. Naprawia nieaktualną
konfigurację i stan, sprawdza kondycję systemu oraz podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb headless / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez pytań (w tym kroki naprawcze związane z restartem/usługą/sandboxem, gdy mają zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez pytań (naprawy + restarty tam, gdzie to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

```bash
openclaw doctor --non-interactive
```

Uruchamia się bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania dotyczące restartu/usług/sandboxa, które wymagają potwierdzenia człowieka.
Migracje starszego stanu są uruchamiane automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe pod kątem dodatkowych instalacji gateway (`launchd/systemd/schtasks`).

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
- Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Kontrola stanu + propozycja restartu.
- Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) i stanu pluginów.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Sprawdzenie wymagań wstępnych TLS dla OAuth OpenAI Codex.
- Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktów manifestów pluginów (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu zadań cron (`jobId`, `schedule.cron`, pola delivery/payload na poziomie głównym, `provider` w payload, proste zadania zapasowe webhook z `notify: true`).
- Inspekcja plików blokad sesji i usuwanie nieaktualnych blokad.
- Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
- Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżyć tokeny bliskie wygaśnięcia i raportuje stany cooldown/disabled profili auth.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
- Migracja starszych usług i wykrywanie dodatkowych gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole środowiska uruchomieniowego gateway (usługa zainstalowana, ale nie działa; zapisany label `launchd`).
- Ostrzeżenia o stanie kanałów (sondowane z działającego gateway).
- Audyt konfiguracji supervisora (`launchd/systemd/schtasks`) z opcjonalną naprawą.
- Kontrole dobrych praktyk środowiska uruchomieniowego gateway (Node vs Bun, ścieżki menedżerów wersji).
- Diagnostyka kolizji portu gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych polityk wiadomości prywatnych.
- Kontrole uwierzytelniania gateway dla lokalnego trybu tokenu (oferuje wygenerowanie tokenu, gdy nie istnieje jego źródło; nie nadpisuje konfiguracji tokenu opartych na SecretRef).
- Sprawdzenie `systemd linger` na Linuksie.
- Kontrola rozmiaru plików bootstrap workspace (ostrzeżenia o obcięciu/blisko limitu dla plików kontekstu).
- Kontrola stanu autouzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
- Kontrola gotowości dostawcy embeddingów dla wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niedopasowanie workspace pnpm, brak zasobów UI, brak binarki tsx).
- Zapisuje zaktualizowaną konfigurację i metadane kreatora.

## Szczegółowe działanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli to checkout git i doctor działa interaktywnie, oferuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego
schematu.

Dotyczy to także starszych płaskich pól Talk. Aktualny publiczny model konfiguracji Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje starsze
kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy dostawców.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą,
aby uruchomić `openclaw doctor`.

Doctor:

- wyjaśnia, które starsze klucze zostały znalezione,
- pokazuje zastosowaną migrację,
- przepisuje `~/.openclaw/openclaw.json` do zaktualizowanego schematu.

Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje
starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji.
Migracje magazynu zadań cron są obsługiwane przez `openclaw doctor --fix`.

Bieżące migracje:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` na poziomie głównym
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Dla kanałów z nazwanymi `accounts`, ale z pozostawionymi wartościami kanału na najwyższym poziomie dla pojedynczego konta, przenieś te wartości przypisane do zakresu konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/dom yślny cel)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuwa `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)

Ostrzeżenia doctor zawierają też wskazówki dotyczące kont domyślnych w kanałach wielokontowych:

- Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymuszać używanie niewłaściwego API przez modele albo zerować koszty. Doctor ostrzega, aby
usunąć nadpisanie i przywrócić routing API oraz koszty per model.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do aktualnego modelu podłączania host-local Chrome MCP:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile:
"user"` lub skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych
  profili automatycznego łączenia,
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144,
- przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć tego ustawienia po stronie Chrome za Ciebie. Host-local Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gateway/node,
- lokalnie uruchomionej przeglądarki,
- włączonego zdalnego debugowania w tej przeglądarce,
- zaakceptowania pierwszego monitu o zgodę na podłączenie w przeglądarce.

Gotowość w tym miejscu dotyczy wyłącznie lokalnych wymagań wstępnych dla podłączania. Existing-session zachowuje
obecne ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobierania i działania wsadowe, nadal wymagają zarządzanej
przeglądarki lub surowego profilu CDP.

Ta kontrola **nie** dotyczy przepływów Docker, sandbox, remote-browser ani innych
trybów headless. One nadal używają surowego CDP.

### 2d) Wymagania wstępne TLS dla OAuth

Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor sonduje punkt autoryzacji OpenAI,
aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi
zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na
przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat self-signed),
doctor wyświetla wskazówki naprawcze specyficzne dla platformy. Na macOS z Node z Homebrew
naprawą jest zwykle `brew postinstall ca-certificates`. Przy `--deep` sonda działa
nawet wtedy, gdy gateway jest zdrowy.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypty:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są wykonywane w trybie best-effort i są idempotentne; doctor wyemituje ostrzeżenia, jeśli
pozostawi starsze katalogi jako kopie zapasowe. Gateway/CLI także automatycznie migrują
starsze sesje + katalog agenta przy starcie, aby historia/auth/modele trafiły do ścieżki
per agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy/mapy dostawców Talk
porównuje teraz równość strukturalną, więc różnice wyłącznie w kolejności kluczy nie powodują już
powtarzających się, pustych zmian `doctor --fix`.

### 3a) Migracje starszych manifestów pluginów

Doctor skanuje wszystkie zainstalowane manifesty pluginów pod kątem przestarzałych kluczy
możliwości na poziomie głównym (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Po ich znalezieniu oferuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` zawiera już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu cron

Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie,
lub `cron.store`, jeśli został nadpisany) pod kątem starych kształtów zadań, które scheduler
nadal akceptuje ze względów zgodności.

Bieżące porządki cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload na poziomie głównym (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery na poziomie głównym (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy delivery `provider` w payload → jawne `delivery.channel`
- proste starsze zadania zapasowe webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez
zmiany zachowania. Jeśli zadanie łączy starszy mechanizm zapasowy notify z istniejącym
trybem delivery innym niż webhook, doctor ostrzega i pozostawia takie zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje katalog sesji każdego agenta w poszukiwaniu nieaktualnych plików blokad zapisu — plików
pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy
jest uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wyświetla uwagę i
poleca ponownie uruchomić z `--fix`.

### 4) Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu systemu. Jeśli zniknie, tracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i wyświetla wskazówkę `chown`, gdy wykryje niedopasowanie właściciela/grupy).
- **Katalog stanu zsynchronizowany z chmurą na macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O
  oraz wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`,
  ponieważ losowe I/O na kartach SD lub eMMC może być wolniejsze i szybciej zużywać nośnik
  przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do utrwalania historii i unikania awarii `ENOENT`.
- **Niedopasowanie transkryptów**: ostrzega, gdy ostatnie wpisy sesji mają brakujące
  pliki transkryptów.
- **Główna sesja „1-line JSONL”**: sygnalizuje, gdy główny transkrypt ma tylko jedną
  linię (historia się nie kumuluje).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może się rozdzielić między instalacje).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na zdalnym hoście (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` ma prawa
  odczytu dla grupy/wszystkich, i oferuje ich zaostrzenie do `600`.

### 5) Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)

Doctor analizuje profile OAuth w magazynie auth, ostrzega, gdy tokeny
wygasają lub już wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest nieaktualny, sugeruje użycie klucza API Anthropic albo
ścieżki Anthropic setup-token.
Monity o odświeżenie pojawiają się tylko podczas uruchomienia interaktywnego (TTY); `--non-interactive`
pomija próby odświeżania.

Doctor raportuje także profile auth, które są tymczasowo niedostępne z powodu:

- krótkich cooldownów (rate limits/timeouts/błędy auth),
- dłuższych wyłączeń (błędy rozliczeń/braku środków).

### 6) Walidacja modelu hooks

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem
katalogu i allowlisty oraz ostrzega, gdy nie zostanie rozwiązane albo jest niedozwolone.

### 7) Naprawa obrazu sandboxa

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje ich zbudowanie albo
przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.

### 7b) Zależności runtime pakietów pluginów bundlowanych

Doctor weryfikuje, czy zależności runtime bundlowanych pluginów (na przykład pakiety
runtime pluginu Discord) są obecne w katalogu głównym instalacji OpenClaw.
Jeśli którychś brakuje, doctor raportuje te pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migracje usług gateway i wskazówki dotyczące czyszczenia

Doctor wykrywa starsze usługi gateway (`launchd/systemd/schtasks`) i
oferuje ich usunięcie oraz instalację usługi OpenClaw przy użyciu bieżącego portu gateway.
Może też skanować w poszukiwaniu dodatkowych usług podobnych do gateway i wyświetlać wskazówki czyszczenia.
Usługi OpenClaw gateway nazwane według profilu są traktowane jako pełnoprawne i nie są
oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie
uruchamia kroki migracji best-effort: migrację starszego stanu Matrix oraz przygotowanie
starszego stanu zaszyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a
start jest kontynuowany. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na wiadomości prywatne bez allowlisty lub
gdy polityka jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że włączone jest lingering,
aby gateway pozostał aktywny po wylogowaniu.

### 11) Stan workspace (Skills, pluginy i starsze katalogi)

Doctor wyświetla podsumowanie stanu workspace dla domyślnego agenta:

- **Stan Skills**: zlicza Skills kwalifikujące się, z brakującymi wymaganiami i zablokowane przez allowlistę.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Stan pluginów**: zlicza pluginy załadowane/wyłączone/z błędami; wyświetla identyfikatory pluginów dla
  błędów; raportuje możliwości bundle pluginów.
- **Ostrzeżenia o zgodności pluginów**: oznacza pluginy mające problemy zgodności z
  bieżącym runtime.
- **Diagnostyka pluginów**: pokazuje wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez
  rejestr pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko skonfigurowanego
limitu znaków albo go przekraczają. Raportuje dla każdego pliku liczbę surowych i wstrzykniętych znaków, procent obcięcia,
przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu,
doctor wyświetla wskazówki dotyczące dostrojenia `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autouzupełnianie powłoki

Doctor sprawdza, czy autouzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki
(zsh, bash, fish lub PowerShell):

- Jeśli profil powłoki używa wolnego dynamicznego wzorca autouzupełniania
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem cache.
- Jeśli autouzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache,
  doctor automatycznie regeneruje cache.
- Jeśli autouzupełnianie nie jest w ogóle skonfigurowane, doctor proponuje jego instalację
  (tylko w trybie interaktywnym; pomijane przy `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie odtworzyć cache.

### 12) Kontrole uwierzytelniania gateway (lokalny token)

Doctor sprawdza gotowość uwierzytelniania tokenem lokalnego gateway.

- Jeśli tryb tokenu wymaga tokenu i nie istnieje jego źródło, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza wygenerowanie tylko wtedy, gdy nie skonfigurowano SecretRef tokenu.

### 12b) Naprawy tylko do odczytu, świadome SecretRef

Niektóre przepływy naprawcze muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu, co polecenia z rodziny status, do ukierunkowanych napraw konfiguracji.
- Przykład: naprawa `allowFrom` / `groupAllowFrom` z `@username` w Telegram próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązanie zamiast kończyć się awarią lub błędnie raportować brak tokenu.

### 13) Kontrola stanu gateway + restart

Doctor uruchamia kontrolę stanu i oferuje restart gateway, gdy wygląda
na niezdatny do pracy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddingów dla wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i daje się uruchomić.
  Jeśli nie, wyświetla wskazówki naprawcze, w tym pakiet npm i opcję ręcznej ścieżki do binarki.
- **Jawny dostawca lokalny**: sprawdza obecność lokalnego pliku modelu albo rozpoznawanego
  zdalnego/pobieralnego URL modelu. Jeśli go brakuje, sugeruje przełączenie na zdalnego dostawcę.
- **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest
  obecny w środowisku lub magazynie auth. Jeśli go brakuje, wyświetla konkretne wskazówki naprawcze.
- **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a potem próbuje każdego zdalnego
  dostawcy zgodnie z kolejnością automatycznego wyboru.

Gdy wynik sondy gateway jest dostępny (gateway był zdrowy w momencie
sprawdzenia), doctor porównuje go z konfiguracją widoczną dla CLI i odnotowuje
wszelkie rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o stanie kanałów

Jeśli gateway jest zdrowy, doctor uruchamia sondę stanu kanałów i raportuje
ostrzeżenia wraz z sugerowanymi poprawkami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (`launchd/systemd/schtasks`) pod kątem
brakujących lub nieaktualnych ustawień domyślnych (np. zależności `network-online` w systemd oraz
opóźnienia restartu). Po wykryciu niedopasowania rekomenduje aktualizację i może
przepisać plik usługi/zadanie do bieżących wartości domyślnych.

Uwagi:

- `openclaw doctor` pyta o potwierdzenie przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne monity naprawcze.
- `openclaw doctor --repair` stosuje zalecane poprawki bez pytań.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, ścieżka instalacji/naprawy usługi w doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanego tokenu w postaci jawnego tekstu do metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu nie został rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i wyświetla konkretne wskazówki.
- Jeśli skonfigurowano jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie jawnie ustawiony.
- Dla jednostek user-systemd na Linuksie kontrole rozjazdu tokenów w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka runtime gateway i portu

Doctor analizuje runtime usługi (PID, ostatni status zakończenia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także kolizje portu
gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już działa,
tunel SSH).

### 17) Dobre praktyki runtime gateway

Doctor ostrzega, gdy usługa gateway działa na Bun albo na ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp i Telegram wymagają Node,
a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki użytkownika. Doctor oferuje migrację do systemowej instalacji Node, jeśli
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor zapisuje wszystkie zmiany konfiguracji i oznacza metadane kreatora, aby odnotować
uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (backup + system pamięci)

Doctor sugeruje system pamięci workspace, jeśli go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej,
jeśli workspace nie jest już pod kontrolą git.

Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po
strukturze workspace i kopiach zapasowych git (zalecane prywatne GitHub lub GitLab).
