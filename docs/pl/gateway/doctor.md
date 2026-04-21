---
read_when:
    - Dodawanie lub modyfikowanie migracji Doctor
    - Wprowadzanie niekompatybilnych zmian konfiguracji
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T09:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` to narzędzie naprawy + migracji dla OpenClaw. Naprawia nieaktualny
stan/konfigurację, sprawdza stan i podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezobsługowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/sandbox, gdy ma to zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez pytań (naprawy + restarty tam, gdzie jest to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje również agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

```bash
openclaw doctor --non-interactive
```

Uruchamia bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/sandbox wymagające potwierdzenia człowieka.
Migracje starszego stanu uruchamiają się automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway (`launchd/systemd/schtasks`).

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
- Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Kontrola stanu + monit o restart.
- Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i statusu pluginów.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniu dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Ostrzeżenia o zasłonięciu OAuth Codex (`models.providers.openai-codex`).
- Kontrola wymagań TLS OAuth dla profili OAuth OpenAI Codex.
- Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktów manifestu pluginów (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola delivery/payload najwyższego poziomu, `provider` w payloadzie, proste zadania zapasowe Webhook z `notify: true`).
- Inspekcja pliku blokady sesji i czyszczenie przestarzałych blokad.
- Kontrole integralności stanu i uprawnień (sesje, transkrypcje, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) podczas uruchamiania lokalnie.
- Stan uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profili uwierzytelniania.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandbox, gdy sandboxing jest włączony.
- Migracja starszej usługi i wykrywanie dodatkowych Gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole środowiska uruchomieniowego Gateway (usługa zainstalowana, ale nieuruchomiona; zapisany w pamięci podręcznej label `launchd`).
- Ostrzeżenia o statusie kanałów (sondowane z uruchomionego Gateway).
- Audyt konfiguracji supervisora (`launchd/systemd/schtasks`) z opcjonalną naprawą.
- Kontrole dobrych praktyk środowiska uruchomieniowego Gateway (Node vs Bun, ścieżki menedżera wersji).
- Diagnostyka konfliktów portów Gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych zasad DM.
- Kontrole uwierzytelniania Gateway dla lokalnego trybu tokena (oferuje wygenerowanie tokena, gdy nie istnieje żadne źródło tokena; nie nadpisuje konfiguracji tokena opartych na SecretRef).
- Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące aktualizacje roli/zakresu, przestarzały dryf lokalnej pamięci podręcznej tokena urządzenia i dryf uwierzytelniania sparowanych rekordów).
- Kontrola `linger` systemd w Linuksie.
- Kontrola rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/blisko limitu dla plików kontekstu).
- Kontrola statusu uzupełniania poleceń powłoki i automatyczna instalacja/aktualizacja.
- Kontrola gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niedopasowanie workspace pnpm, brak zasobów UI, brak binarki tsx).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Uzupełnianie i reset Dreams UI

Scena Dreams w Control UI zawiera działania **Backfill**, **Reset** i **Clear Grounded**
dla workflow grounded Dreaming. Te działania używają metod RPC
w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym
  workspace, uruchamia grounded pass dziennika REM i zapisuje odwracalne wpisy
  backfill w `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika backfill.
- **Clear Grounded** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie grounded,
  które pochodzą z historycznego odtwarzania i nie zgromadziły jeszcze wsparcia
  z żywego przywołania ani z dnia codziennego.

Czego same nie robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie grounded candidates do żywego magazynu
  promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby grounded historical replay wpływało na normalny etap głębokiej promocji,
zamiast tego użyj przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje grounded durable candidates w magazynie krótkoterminowego Dreaming, jednocześnie
zachowując `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe zachowanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli to checkout git i doctor działa interaktywnie, oferuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego
schematu.

Obejmuje to starsze płaskie pola Talk. Aktualna publiczna konfiguracja Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare
kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy dostawców.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą
o uruchomienie `openclaw doctor`.

Doctor:

- Wyjaśnia, które starsze klucze zostały znalezione.
- Pokazuje zastosowaną migrację.
- Przepisuje `~/.openclaw/openclaw.json` przy użyciu zaktualizowanego schematu.

Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje
starszy format konfiguracji, więc przestarzałe konfiguracje są naprawiane bez ręcznej interwencji.
Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Dla kanałów z nazwanymi `accounts`, ale z pozostawionymi wartościami kanału najwyższego poziomu dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyslny cel)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuń `browser.relayBindHost` (starsze ustawienie przekazywania rozszerzenia)

Ostrzeżenia doctor obejmują także wskazówki dotyczące konta domyślnego dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing zapasowy może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla listę skonfigurowanych identyfikatorów kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić użycie niewłaściwego API dla modeli albo wyzerować koszty. Doctor ostrzega, aby
usunąć nadpisanie i przywrócić routing API per model + koszty.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do bieżącego modelu dołączania host-local Chrome MCP:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje także ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile:
"user"` lub skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowane na tym samym hoście dla domyślnych
  profili auto-connect
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspect przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć ustawienia po stronie Chrome za ciebie. Host-local Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście Gateway/Node
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zatwierdzenia pierwszego monitu zgody na dołączenie w przeglądarce

Gotowość tutaj dotyczy tylko wymagań wstępnych lokalnego dołączania. Existing-session zachowuje
bieżące ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobrań i działania wsadowe, nadal wymagają zarządzanej
przeglądarki lub surowego profilu CDP.

Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych
przepływów headless. Nadal używają one surowego CDP.

### 2d) Wymagania TLS OAuth

Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor sonduje punkt końcowy autoryzacji OpenAI,
aby zweryfikować, czy lokalny stos TLS Node/OpenSSL może
zweryfikować łańcuch certyfikatów. Jeśli sonda nie powiedzie się z błędem certyfikatu (na
przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat self-signed),
doctor wyświetla wskazówki naprawy zależne od platformy. Na macOS z Node z Homebrew
naprawą jest zwykle `brew postinstall ca-certificates`. Przy `--deep` sonda działa
nawet wtedy, gdy Gateway jest w dobrym stanie.

### 2c) Nadpisania dostawcy OAuth Codex

Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w
`models.providers.openai-codex`, mogą one zasłaniać wbudowaną ścieżkę
dostawcy OAuth Codex, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi
te stare ustawienia transportu obok OAuth Codex, aby można było usunąć lub przepisać
przestarzałe nadpisanie transportu i odzyskać wbudowane zachowanie routingu/zapasowe.
Niestandardowe proxy i nadpisania wyłącznie nagłówków są nadal obsługiwane i nie
wywołują tego ostrzeżenia.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypcje:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są best-effort i idempotentne; doctor emituje ostrzeżenia, gdy
pozostawi jakiekolwiek starsze katalogi jako kopie zapasowe. Gateway/CLI także automatycznie migruje
starsze sesje + katalog agenta przy starcie, więc historia/uwierzytelnianie/modele trafiają do
ścieżki per agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo
migrowane wyłącznie przez `openclaw doctor`. Normalizacja Talk provider/provider-map teraz
porównuje przez równość strukturalną, więc różnice wyłącznie w kolejności kluczy nie wywołują już
powtarzających się zmian bez efektu z `doctor --fix`.

### 3a) Migracje starszych manifestów pluginów

Doctor skanuje wszystkie zainstalowane manifesty pluginów w poszukiwaniu przestarzałych kluczy
możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu Cron

Doctor sprawdza też magazyn zadań Cron (domyślnie `~/.openclaw/cron/jobs.json`,
lub `cron.store`, jeśli zostało nadpisane) pod kątem starych kształtów zadań, które scheduler nadal
akceptuje dla zgodności.

Bieżące porządki Cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy dostarczania `provider` w payloadzie → jawne `delivery.channel`
- proste starsze zadania zapasowe Webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez
zmiany zachowania. Jeśli zadanie łączy starszy mechanizm zapasowy notify z istniejącym
trybem dostarczania innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta w poszukiwaniu przestarzałych plików blokad zapisu — plików
pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal żyje, wiek blokady oraz czy jest
uznawana za przestarzałą (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa przestarzałe pliki blokad; w przeciwnym razie wyświetla notatkę i
poleca ponowne uruchomienie z `--fix`.

### 4) Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu. Jeśli zniknie, tracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, pyta o ponowne utworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i emituje wskazówkę `chown`, gdy wykryte zostanie niedopasowanie właściciela/grupy).
- **Katalog stanu synchronizowany przez chmurę w macOS**: ostrzega, gdy stan rozwiązuje się w iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O
  oraz wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`,
  ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej się zużywać
  przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do zachowania historii i uniknięcia awarii `ENOENT`.
- **Niedopasowanie transkrypcji**: ostrzega, gdy ostatnie wpisy sesji mają brakujące
  pliki transkrypcji.
- **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główna transkrypcja ma tylko jeden
  wiersz (historia nie jest kumulowana).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może
  rozdzielić się między instalacje).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na zdalnym hoście (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

### 5) Stan uwierzytelniania modelu (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny
wygasają/są wygasłe, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest przestarzały, sugeruje klucz API Anthropic lub
ścieżkę setup-token Anthropic.
Monity o odświeżenie pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive`
pomija próby odświeżania.

Gdy odświeżenie OAuth zawiedzie trwale (na przykład `refresh_token_reused`,
`invalid_grant` lub dostawca nakaże ponowne logowanie), doctor zgłasza,
że wymagane jest ponowne uwierzytelnienie, i wyświetla dokładne polecenie `openclaw models auth login --provider ...`,
które należy uruchomić.

Doctor raportuje też profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

- krótkich cooldownów (limity szybkości/timeouty/błędy uwierzytelniania)
- dłuższych wyłączeń (błędy rozliczeń/kredytów)

### 6) Walidacja modelu Hooks

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem
katalogu i allowlisty oraz ostrzega, gdy nie da się go rozwiązać albo jest niedozwolone.

### 7) Naprawa obrazu sandbox

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje ich zbudowanie albo
przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.

### 7b) Zależności runtime bundlowanych pluginów

Doctor weryfikuje zależności runtime tylko dla bundlowanych pluginów aktywnych w
bieżącej konfiguracji albo włączonych przez domyślne ustawienie ich bundlowanego manifestu, na przykład
`plugins.entries.discord.enabled: true`, starsze
`channels.discord.enabled: true` lub dostawca bundlowany włączony domyślnie. Jeśli jakichkolwiek
brakuje, doctor raportuje pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne pluginy nadal
używają `openclaw plugins install` / `openclaw plugins update`; doctor nie
instaluje zależności dla dowolnych ścieżek pluginów.

### 8) Migracje usługi Gateway i wskazówki czyszczenia

Doctor wykrywa starsze usługi Gateway (`launchd/systemd/schtasks`) i
proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu Gateway.
Może też skanować w poszukiwaniu dodatkowych usług podobnych do Gateway i wyświetlać wskazówki czyszczenia.
Nazwane profilami usługi Gateway OpenClaw są traktowane jako pełnoprawne i nie są
oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie
uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a
uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 8c) Parowanie urządzeń i dryf uwierzytelniania

Doctor sprawdza teraz stan parowania urządzeń jako część zwykłego przebiegu kontroli stanu.

Co raportuje:

- oczekujące pierwsze żądania parowania
- oczekujące podniesienia roli dla już sparowanych urządzeń
- oczekujące podniesienia zakresu dla już sparowanych urządzeń
- naprawy niedopasowania klucza publicznego, gdy identyfikator urządzenia nadal się zgadza, ale
  tożsamość urządzenia nie zgadza się już z zatwierdzonym rekordem
- sparowane rekordy bez aktywnego tokena dla zatwierdzonej roli
- sparowane tokeny, których zakresy odbiegają od zatwierdzonej bazowej linii parowania
- lokalne wpisy pamięci podręcznej tokena urządzenia dla bieżącej maszyny, które poprzedzają
  rotację tokena po stronie Gateway lub zawierają przestarzałe metadane zakresu

Doctor nie zatwierdza automatycznie żądań parowania ani nie wykonuje automatycznej rotacji tokenów urządzeń. Zamiast tego
wyświetla dokładne kolejne kroki:

- sprawdź oczekujące żądania przez `openclaw devices list`
- zatwierdź dokładne żądanie przez `openclaw devices approve <requestId>`
- obróć świeży token przez `openclaw devices rotate --device <deviceId> --role <role>`
- usuń i zatwierdź ponownie przestarzały rekord przez `openclaw devices remove <deviceId>`

To zamyka częstą lukę „już sparowane, ale nadal pojawia się wymagane parowanie”:
doctor rozróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu
oraz od przestarzałego dryfu tokena/tożsamości urządzenia.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez allowlisty albo
gdy zasada jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że włączone jest lingering, aby
Gateway pozostawał aktywny po wylogowaniu.

### 11) Status workspace (Skills, pluginy i starsze katalogi)

Doctor wyświetla podsumowanie stanu workspace dla domyślnego agenta:

- **Status Skills**: liczba Skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlistę.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Status pluginów**: liczba pluginów załadowanych/wyłączonych/z błędem; wyświetla identyfikatory pluginów dla wszystkich
  błędów; raportuje możliwości bundlowanych pluginów.
- **Ostrzeżenia o zgodności pluginów**: oznacza pluginy, które mają problemy zgodności z
  bieżącym runtime.
- **Diagnostyka pluginów**: pokazuje wszystkie ostrzeżenia lub błędy z czasu ładowania emitowane przez
  rejestr pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) są blisko lub powyżej skonfigurowanego
budżetu znaków. Raportuje dla każdego pliku liczbę znaków surowych względem wstrzykniętych, procent obcięcia,
przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu, doctor wyświetla wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Uzupełnianie poleceń powłoki

Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki
(zsh, bash, fish lub PowerShell):

- Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem pamięci podręcznej.
- Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej,
  doctor automatycznie regeneruje pamięć podręczną.
- Jeśli uzupełnianie w ogóle nie jest skonfigurowane, doctor pyta o jego instalację
  (tylko w trybie interaktywnym; pomijane przy `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować pamięć podręczną.

### 12) Kontrole uwierzytelniania Gateway (token lokalny)

Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

- Jeśli tryb tokena wymaga tokena i nie istnieje żadne źródło tokena, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzane przez SecretRef, ale niedostępne, doctor ostrzega i nie nadpisuje go zwykłym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza wygenerowanie tylko wtedy, gdy nie skonfigurowano żadnego tokena SecretRef.

### 12b) Naprawy tylko do odczytu świadome SecretRef

Niektóre przepływy naprawy wymagają sprawdzenia skonfigurowanych poświadczeń bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status do ukierunkowanych napraw konfiguracji.
- Przykład: naprawa `@username` dla Telegram `allowFrom` / `groupAllowFrom` próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast kończyć się awarią lub błędnie zgłaszać brak tokena.

### 13) Kontrola stanu Gateway + restart

Doctor uruchamia kontrolę stanu i proponuje restart Gateway, gdy wygląda on
na niezdrowy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddingów wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i możliwa do uruchomienia.
  Jeśli nie, wyświetla wskazówki naprawy, w tym pakiet npm i ręczną opcję ścieżki do binarki.
- **Jawny dostawca lokalny**: sprawdza obecność lokalnego pliku modelu lub rozpoznanego
  zdalnego/pobieralnego adresu URL modelu. Jeśli brakuje, sugeruje przełączenie na zdalnego dostawcę.
- **Jawny dostawca zdalny** (`openai`, `voyage` itp.): weryfikuje, czy klucz API jest
  obecny w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wyświetla konkretne wskazówki naprawy.
- **Dostawca auto**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego zdalnego
  dostawcy w kolejności automatycznego wyboru.

Gdy dostępny jest wynik sondy Gateway (Gateway był zdrowy w czasie
kontroli), doctor porównuje ten wynik z konfiguracją widoczną dla CLI i odnotowuje
wszelkie rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o statusie kanałów

Jeśli Gateway jest zdrowy, doctor uruchamia sondę statusu kanałów i zgłasza
ostrzeżenia wraz z sugerowanymi naprawami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (`launchd/systemd/schtasks`) pod kątem
brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd `network-online` i
opóźnienia restartu). Gdy wykryje niedopasowanie, zaleca aktualizację i może
przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne monity naprawy.
- `openclaw doctor --repair` stosuje zalecane naprawy bez pytań.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, doctor podczas instalacji/naprawy usługi weryfikuje SecretRef, ale nie zapisuje rozwiązanych wartości tokena w zwykłym tekście do metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i podaje konkretne wskazówki.
- Jeśli skonfigurowano jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
- Dla jednostek Linux user-systemd kontrole dryfu tokena w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka runtime Gateway + portów

Doctor sprawdza runtime usługi (PID, ostatni status zakończenia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też konflikty portów
na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już
działa, tunel SSH).

### 17) Dobre praktyki runtime Gateway

Doctor ostrzega, gdy usługa Gateway działa na Bun lub ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itp.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżera wersji mogą psuć się po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor zapisuje wszelkie zmiany konfiguracji i stempluje metadane kreatora, aby zapisać
uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (backup + system pamięci)

Doctor sugeruje system pamięci workspace, gdy go brakuje, i wyświetla wskazówkę o backupie,
jeśli workspace nie jest już objęty git.

Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby uzyskać pełny przewodnik po
strukturze workspace i backupie git (zalecane prywatne GitHub lub GitLab).
