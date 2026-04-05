---
read_when:
    - Dodajesz lub modyfikujesz migracje doctor
    - Wprowadzasz niekompatybilne zmiany konfiguracji
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T13:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualny
stan/konfigurację, sprawdza kondycję i podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezgłowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez pytań (naprawy + restarty tam, gdzie to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

```bash
openclaw doctor --non-interactive
```

Uruchamia bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania dotyczące restartu/usługi/sandboxa, które wymagają potwierdzenia człowieka.
Starsze migracje stanu są uruchamiane automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gateway (launchd/systemd/schtasks).

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed startem dla instalacji git (tylko interaktywnie).
- Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Sprawdzenie kondycji + pytanie o restart.
- Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) i stanu pluginów.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniu providera OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Sprawdzenie wymagań wstępnych TLS OAuth dla profili OpenAI Codex OAuth.
- Migracja starszego stanu na dysku (sesje/agent dir/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktów manifestu pluginów (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola delivery/payload na najwyższym poziomie, payload `provider`, proste zadania awaryjnego webhooka `notify: true`).
- Inspekcja plików blokady sesji i czyszczenie nieaktualnych blokad.
- Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
- Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżyć wygasające tokeny i raportuje stany cooldown/wyłączenia profili auth.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
- Migracja starszych usług i wykrywanie dodatkowych gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole runtime Gateway (usługa zainstalowana, ale nieuruchomiona; cache label launchd).
- Ostrzeżenia o stanie kanałów (sondowane z uruchomionej gateway).
- Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
- Kontrole dobrych praktyk runtime Gateway (Node vs Bun, ścieżki menedżerów wersji).
- Diagnostyka kolizji portu Gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
- Kontrole uwierzytelniania Gateway dla lokalnego trybu tokenu (oferuje generowanie tokenu, gdy nie istnieje jego źródło; nie nadpisuje konfiguracji token SecretRef).
- Kontrola systemd linger na Linuksie.
- Kontrola rozmiaru plików bootstrap workspace (ostrzeżenia o obcięciu / blisko limitu dla plików kontekstu).
- Kontrola stanu shell completion oraz automatyczna instalacja/aktualizacja.
- Kontrola gotowości providera embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niedopasowanie workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Szczegółowe zachowanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli to checkout git i doctor działa interaktywnie, oferuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do aktualnego
schematu.

Dotyczy to także starszych płaskich pól Talk. Aktualna publiczna konfiguracja Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare
kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy providerów.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą
o uruchomienie `openclaw doctor`.

Doctor wykona wtedy:

- Wyjaśnienie, które starsze klucze zostały znalezione.
- Pokazanie zastosowanej migracji.
- Przepisanie `~/.openclaw/openclaw.json` z użyciem zaktualizowanego schematu.

Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje
starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji.
Migracje magazynu zadań cron obsługuje `openclaw doctor --fix`.

Aktualne migracje:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → top-level `bindings`
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
- Dla kanałów z nazwanymi `accounts`, ale z pozostawionymi wartościami kanału jednokontowego na najwyższym poziomie, przenieś te wartości o zakresie konta do wypromowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący cel nazwany/domyslny)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuwa `browser.relayBindHost` (starsze ustawienie extension relay)

Ostrzeżenia doctor zawierają też wskazówki dotyczące kont domyślnych dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing awaryjny może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` ustawiono na nieznane ID konta, doctor ostrzega i wypisuje skonfigurowane ID kont.

### 2b) Nadpisania providera OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić kierowanie modeli do niewłaściwego API albo wyzerować koszty. Doctor ostrzega, aby
usunąć nadpisanie i przywrócić routing API + koszty per model.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do bieżącego modelu host-local Chrome MCP attach:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile:
"user"` lub skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych
  profili auto-connect
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspect przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć tego ustawienia po stronie Chrome za Ciebie. Host-local Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gateway/node
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zatwierdzenia pierwszego komunikatu zgody na dołączenie w przeglądarce

Gotowość tutaj dotyczy wyłącznie wymagań wstępnych lokalnego attach. Existing-session zachowuje
obecne ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobierania i działania wsadowe, nadal wymagają zarządzanej
przeglądarki albo surowego profilu CDP.

Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych
przepływów headless. Te nadal używają surowego CDP.

### 2d) Wymagania wstępne TLS OAuth

Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje punkt końcowy autoryzacji OpenAI,
aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi zweryfikować łańcuch certyfikatów. Jeśli
sonda zakończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat self-signed),
doctor wypisze wskazówki naprawcze specyficzne dla platformy. Na macOS z Node z Homebrew
naprawą jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa
nawet wtedy, gdy gateway jest zdrowa.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do aktualnej struktury:

- Magazyn sesji + transkrypty:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Agent dir:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (oprócz `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślne account id: `default`)

Te migracje działają w trybie best-effort i są idempotentne; doctor emituje ostrzeżenia, gdy
pozostawia jakiekolwiek starsze katalogi jako kopie zapasowe. Gateway/CLI także automatycznie migruje
starsze sesje + agent dir przy starcie, aby historia/auth/modele trafiały do
ścieżki per agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane tylko przez `openclaw doctor`. Normalizacja map provider/provider Talk porównuje teraz
przez równość strukturalną, więc różnice wyłącznie w kolejności kluczy nie wywołują już
powtarzających się pustych zmian `doctor --fix`.

### 3a) Migracje starszych manifestów pluginów

Doctor skanuje wszystkie zainstalowane manifesty pluginów pod kątem przestarzałych kluczy
możliwości na najwyższym poziomie (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Po ich znalezieniu oferuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Migracja jest idempotentna;
jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu cron

Doctor sprawdza też magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie,
lub `cron.store`, jeśli nadpisano) pod kątem starych kształtów zadań, które scheduler nadal
akceptuje dla zgodności.

Aktualne porządki cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload na najwyższym poziomie (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery na najwyższym poziomie (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy delivery `provider` w payload → jawne `delivery.channel`
- proste starsze zadania awaryjnego webhooka `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez
zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym
trybem delivery innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokady zapisu — plików pozostawionych
po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal żyje, wiek blokady i czy jest
uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa nieaktualne pliki blokady; w przeciwnym razie wypisuje notatkę i
poleca ponowne uruchomienie z `--fix`.

### 4) Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu. Jeśli zniknie, tracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, pyta o odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i emituje wskazówkę `chown`, gdy wykryje niedopasowanie owner/group).
- **Katalog stanu synchronizowany z chmurą na macOS**: ostrzega, gdy stan rozwiązuje się do iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O
  i wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`,
  ponieważ losowe I/O na nośnikach SD lub eMMC może być wolniejsze i szybciej zużywać nośnik
  przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do utrwalenia historii i unikania awarii `ENOENT`.
- **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji nie mają
  odpowiadających plików transkryptu.
- **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jedną
  linię (historia się nie kumuluje).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może
  dzielić się między instalacje).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, by uruchomić
  go na zdalnym hoście (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  czytelny dla grupy/świata i oferuje zaostrzenie do `600`.

### 5) Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie auth, ostrzega, gdy tokeny
wygasają/wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
Anthropic OAuth/token jest nieaktualny, sugeruje migrację do Claude CLI lub
klucza API Anthropic.
Pytania o odświeżenie pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive`
pomija próby odświeżenia.

Doctor raportuje także profile auth, które są tymczasowo nieużywalne z powodu:

- krótkich cooldownów (limity szybkości/timeouty/błędy auth)
- dłuższych wyłączeń (błędy rozliczeń/kredytu)

### 6) Walidacja modelu hooków

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem
katalogu i allowlist oraz ostrzega, gdy nie zostanie rozwiązane lub jest niedozwolone.

### 7) Naprawa obrazu sandboxa

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje ich zbudowanie albo
przełączenie na starsze nazwy, jeśli bieżącego obrazu brakuje.

### 7b) Runtime deps bundlowanych pluginów

Doctor weryfikuje, czy runtime dependencies bundlowanych pluginów (na przykład
pakiety runtime pluginu Discord) są obecne w katalogu głównym instalacji OpenClaw.
Jeśli którychś brakuje, doctor raportuje pakiety i instaluje je w
trybie `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migracje usług Gateway i wskazówki dotyczące czyszczenia

Doctor wykrywa starsze usługi gateway (launchd/systemd/schtasks) i
oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego
portu gateway. Może też skanować w poszukiwaniu dodatkowych usług podobnych do gateway i drukować wskazówki dotyczące czyszczenia.
Usługi OpenClaw gateway nazwane profilem są traktowane jako pełnoprawne i nie są
oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie
uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie starszego
stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane i
start jest kontynuowany. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy provider jest otwarty na DM bez allowlist, lub
gdy polityka jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby
gateway działała po wylogowaniu.

### 11) Stan workspace (Skills, pluginy i starsze katalogi)

Doctor drukuje podsumowanie stanu workspace dla domyślnego agenta:

- **Stan Skills**: liczby Skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlist.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Stan pluginów**: liczby pluginów załadowanych/wyłączonych/z błędami; wypisuje ID pluginów dla
  wszelkich błędów; raportuje możliwości bundle plugin.
- **Ostrzeżenia zgodności pluginów**: oznacza pluginy, które mają problemy ze zgodnością z
  bieżącym runtime.
- **Diagnostyka pluginów**: pokazuje wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez
  rejestr pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko lub ponad
skonfigurowanym limitem znaków. Raportuje per plik liczbę znaków surowych vs. wstrzykniętych, procent
obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcinane lub blisko limitu,
doctor drukuje wskazówki dotyczące strojenia `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki
(zsh, bash, fish lub PowerShell):

- Jeśli profil powłoki używa wolnego dynamicznego wzorca completion
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem cache.
- Jeśli completion jest skonfigurowane w profilu, ale brakuje pliku cache,
  doctor automatycznie odtwarza cache.
- Jeśli completion w ogóle nie jest skonfigurowane, doctor proponuje jego instalację
  (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie odtworzyć cache.

### 12) Kontrole uwierzytelniania Gateway (lokalny token)

Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem gateway.

- Jeśli tryb tokenu wymaga tokenu, a nie istnieje jego źródło, doctor oferuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzane przez SecretRef, ale niedostępne, doctor ostrzega i nie nadpisuje tego jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano token SecretRef.

### 12b) Naprawy tylko do odczytu z uwzględnieniem SecretRef

Niektóre przepływy naprawcze muszą sprawdzić skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu, co polecenia rodziny status do ukierunkowanych napraw konfiguracji.
- Przykład: naprawa `allowFrom` / `groupAllowFrom` `@username` dla Telegram próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane-ale-niedostępne i pomija autoresolution zamiast powodować awarię lub błędnie zgłaszać brak tokenu.

### 13) Kontrola kondycji Gateway + restart

Doctor uruchamia kontrolę kondycji i proponuje restart gateway, gdy wygląda ona
na niezdrową.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany provider embeddingów wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i providera:

- **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i da się ją uruchomić.
  Jeśli nie, drukuje wskazówki naprawcze, w tym pakiet npm i opcję ręcznej ścieżki do binarki.
- **Jawny provider lokalny**: sprawdza obecność lokalnego pliku modelu albo rozpoznawanego
  zdalnego/pobieralnego adresu URL modelu. Jeśli brakuje, sugeruje przełączenie na zdalnego providera.
- **Jawny provider zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API
  jest obecny w środowisku lub magazynie auth. Drukuje konkretne wskazówki naprawcze, jeśli go brakuje.
- **Provider auto**: najpierw sprawdza dostępność modelu lokalnego, a potem próbuje każdego zdalnego
  providera w kolejności auto-selection.

Gdy wynik sondy gateway jest dostępny (gateway była zdrowa w czasie
kontroli), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i wskazuje
ewentualne rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o stanie kanałów

Jeśli gateway jest zdrowa, doctor uruchamia sondę stanu kanałów i raportuje
ostrzeżenia wraz z sugerowanymi naprawami.

### 15) Audyt konfiguracji nadzorcy + naprawa

Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem
brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd network-online i
opóźnienia restartu). Po wykryciu niedopasowania rekomenduje aktualizację i może
przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji nadzorcy.
- `openclaw doctor --yes` akceptuje domyślne pytania o naprawę.
- `openclaw doctor --repair` stosuje zalecane poprawki bez pytań.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, ścieżka instalacji/naprawy usługi doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanego tokenu w postaci jawnego tekstu do metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i podaje konkretne wskazówki.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
- Dla jednostek user-systemd na Linuksie kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych auth usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka runtime Gateway + portu

Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portu
gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już
działa, tunel SSH).

### 17) Dobre praktyki runtime Gateway

Doctor ostrzega, gdy usługa gateway działa na Bun albo na ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie
ładuje init Twojej powłoki. Doctor oferuje migrację do systemowej instalacji Node, gdy
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor zapisuje wszystkie zmiany konfiguracji i stempluje metadane kreatora, aby odnotować uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)

Doctor sugeruje system pamięci workspace, jeśli go brakuje, i drukuje wskazówkę dotyczącą kopii zapasowej,
jeśli workspace nie jest już pod kontrolą git.

Zobacz [/concepts/agent-workspace](/concepts/agent-workspace), aby poznać pełny przewodnik po
strukturze workspace i kopiach zapasowych git (zalecane prywatne GitHub lub GitLab).
