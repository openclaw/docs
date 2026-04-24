---
read_when:
    - Dodawanie albo modyfikowanie migracji doctor.
    - Wprowadzanie zmian powodujących niezgodność w konfiguracji.
summary: 'Polecenie Doctor: health checks, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:09:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` to narzędzie naprawy + migracji dla OpenClaw. Naprawia nieaktualny
stan/konfigurację, sprawdza health i podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezgłowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez pytania (w tym kroki naprawcze restartu/usługi/sandbox, gdy mają zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez pytania (naprawy + restarty tam, gdzie to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

```bash
openclaw doctor --non-interactive
```

Uruchamia bez monitów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/sandbox wymagające potwierdzenia człowieka.
Starsze migracje stanu są uruchamiane automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji gateway (`launchd/systemd/schtasks`).

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
- Kontrola aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Kontrola health + monit o restart.
- Podsumowanie statusu Skills (kwalifikujące się/brakujące/zablokowane) i status Pluginów.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
- Kontrola wymagań wstępnych OAuth TLS dla profili OpenAI Codex OAuth.
- Migracja starszego stanu na dysku (sessions/katalog agenta/auth WhatsApp).
- Migracja starszych kluczy kontraktów manifestu Pluginów (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola delivery/payload najwyższego poziomu, payload `provider`, proste zadania fallbacku Webhook z `notify: true`).
- Inspekcja pliku blokady sesji i czyszczenie nieaktualnych blokad.
- Kontrole integralności stanu i uprawnień (sessions, transkrypty, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
- Health uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profilu auth.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandbox, gdy sandboxing jest włączony.
- Migracja starszej usługi i wykrywanie dodatkowych gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole runtime Gateway (usługa zainstalowana, ale nieuruchomiona; cache etykiety `launchd`).
- Ostrzeżenia o statusie kanałów (sprawdzane z działającego gateway).
- Audyt konfiguracji supervisora (`launchd/systemd/schtasks`) z opcjonalną naprawą.
- Kontrole najlepszych praktyk runtime Gateway (Node vs Bun, ścieżki menedżera wersji).
- Diagnostyka konfliktu portu Gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
- Kontrole auth Gateway dla lokalnego trybu tokenu (oferuje generowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji SecretRef tokenu).
- Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwsze żądania parowania, oczekujące rozszerzenia roli/zakresu, nieaktualny lokalny dryf cache device-token oraz dryf auth sparowanego rekordu).
- Kontrola `systemd linger` w Linuksie.
- Kontrola rozmiaru pliku bootstrap workspace (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstu).
- Kontrola statusu autouzupełniania powłoki i automatyczna instalacja/aktualizacja.
- Kontrola gotowości dostawcy embeddingów dla wyszukiwania pamięci (model lokalny, zdalny klucz API albo binarium QMD).
- Kontrole instalacji źródłowej (niezgodność workspace `pnpm`, brak zasobów UI, brak binarium `tsx`).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Backfill i reset Dreams UI

Scena Dreams w Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded**
dla ugruntowanego przepływu Dreaming. Te akcje używają metod RPC w stylu gateway
doctor, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym
  workspace, uruchamia ugruntowany przebieg REM diary i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy dziennika backfill.
- **Clear Grounded** usuwa tylko przygotowane ugruntowane wpisy krótkoterminowe, które
  pochodzą z historycznego odtwarzania i nie zgromadziły jeszcze przypomnienia live ani dziennego
  wsparcia.

Czego same nie robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów do magazynu promocji live short-term,
  chyba że wcześniej jawnie uruchomisz przygotowywaną ścieżkę CLI

Jeśli chcesz, aby ugruntowane historyczne odtwarzanie wpływało na normalną ścieżkę
głębokiej promocji, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w magazynie short-term Dreaming, przy jednoczesnym
zachowaniu `DREAMS.md` jako powierzchni przeglądu.

## Szczegółowe zachowanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli to checkout git i doctor działa interaktywnie, proponuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego
schematu.

Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare
kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy dostawców.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą
o uruchomienie `openclaw doctor`.

Doctor:

- wyjaśni, które starsze klucze zostały znalezione.
- pokaże zastosowaną migrację.
- przepisze `~/.openclaw/openclaw.json` do zaktualizowanego schematu.

Gateway także automatycznie uruchamia migracje doctor przy starcie, gdy wykryje
starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji.
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
- Dla kanałów z nazwanymi `accounts`, ale z zalegającymi wartościami najwyższego poziomu kanału dla pojedynczego konta, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący cel nazwany/domyslny)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuń `browser.relayBindHost` (starsze ustawienie extension relay)

Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing fallback może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wyświetla skonfigurowane identyfikatory kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` albo `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić użycie niewłaściwego API przez modele albo wyzerować koszty. Doctor ostrzega, aby
usunąć nadpisanie i przywrócić routing per model API + koszty.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do bieżącego modelu dołączania host-local Chrome MCP:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje także ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile:
"user"` albo skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych
  profili auto-connect
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspect przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  albo `edge://inspect/#remote-debugging`)

Doctor nie może włączyć ustawienia po stronie Chrome za ciebie. Host-local Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gateway/node
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

Gotowość tutaj dotyczy tylko wymagań wstępnych lokalnego dołączenia. Existing-session zachowuje
bieżące limity tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobierania i akcje wsadowe nadal wymagają zarządzanej
przeglądarki albo surowego profilu CDP.

Ta kontrola **nie** dotyczy Dockera, sandbox, remote-browser ani innych
przepływów bezgłowych. One nadal używają surowego CDP.

### 2d) Wymagania wstępne OAuth TLS

Gdy skonfigurowano profil OpenAI Codex OAuth, doctor sprawdza endpoint autoryzacji
OpenAI, aby zweryfikować, czy lokalny stos TLS Node/OpenSSL potrafi
zwalidować łańcuch certyfikatów. Jeśli probe zakończy się błędem certyfikatu (na
przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat albo certyfikat self-signed),
doctor wyświetla wskazówki naprawy specyficzne dla platformy. Na macOS z Node z Homebrew
naprawą jest zwykle `brew postinstall ca-certificates`. Przy `--deep` probe działa
nawet wtedy, gdy gateway jest zdrowy.

### 2c) Nadpisania dostawcy Codex OAuth

Jeśli wcześniej dodano starsze ustawienia transportu OpenAI pod
`models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę
dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy widzi
te stare ustawienia transportu obok Codex OAuth, aby można było usunąć albo przepisać
nieaktualne nadpisanie transportu i przywrócić wbudowane zachowanie routingu/fallbacku.
Niestandardowe proxy i nadpisania tylko nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypty:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan auth WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są wykonywane w trybie best-effort i są idempotentne; doctor emituje ostrzeżenia, gdy
pozostawia starsze katalogi jako kopie zapasowe. Gateway/CLI także automatycznie migruje
starsze sesje + katalog agenta przy starcie, więc historia/auth/modele trafiają do
ścieżki per agent bez ręcznego uruchamiania doctor. Auth WhatsApp jest celowo
migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz
według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie powodują już
powtarzających się zmian no-op w `doctor --fix`.

### 3a) Migracje starszych manifestów Pluginów

Doctor skanuje wszystkie zainstalowane manifesty Pluginów pod kątem przestarzałych kluczy
możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Gdy zostaną znalezione, proponuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu Cron

Doctor sprawdza także magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie,
albo `cron.store`, jeśli nadpisano) pod kątem starych kształtów zadań, które scheduler nadal
akceptuje dla kompatybilności.

Bieżące porządki Cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy dostarczania `provider` w payload → jawne `delivery.channel`
- proste starsze zadania fallbacku Webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez
zmiany zachowania. Jeśli zadanie łączy starszy fallback notify z istniejącym
trybem dostarczania innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokad zapisu — plików
pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal działa, wiek blokady i czy jest
uznawana za nieaktualną (martwy PID albo starsza niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa nieaktualne pliki blokad; w przeciwnym razie wypisuje informację i
prosi o ponowne uruchomienie z `--fix`.

### 4) Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu. Jeśli zniknie, tracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; proponuje naprawę uprawnień
  (i emituje wskazówkę `chown`, gdy wykryto niezgodność właściciela/grupy).
- **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan wskazuje ścieżkę w iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) albo
  `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O
  i wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux SD albo eMMC**: ostrzega, gdy stan wskazuje źródło montowania `mmcblk*`,
  ponieważ losowe I/O na nośnikach SD albo eMMC może być wolniejsze i szybciej się zużywać
  przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do utrwalania historii i unikania awarii `ENOENT`.
- **Niezgodność transkryptów**: ostrzega, gdy ostatnie wpisy sesji mają brakujące
  pliki transkryptów.
- **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jeden
  wiersz (historia się nie kumuluje).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych
  katalogach domowych albo gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może
  dzielić się między instalacjami).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na hoście zdalnym (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  czytelny dla grupy/świata, i proponuje zaostrzenie do `600`.

### 5) Health auth modelu (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie auth, ostrzega, gdy tokeny
wygasają/wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo
ścieżkę setup-token Anthropic.
Monity o odświeżenie pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive`
pomija próby odświeżenia.

Gdy odświeżenie OAuth kończy się trwałym niepowodzeniem (na przykład `refresh_token_reused`,
`invalid_grant` albo dostawca informuje, że trzeba zalogować się ponownie), doctor raportuje,
że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...`,
które należy uruchomić.

Doctor raportuje także profile auth, które są tymczasowo nieużywalne z powodu:

- krótkich cooldownów (limity szybkości/timeouty/błędy auth)
- dłuższych wyłączeń (błędy billing/credit)

### 6) Walidacja modelu hooków

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie modelu względem
katalogu i listy dozwolonych oraz ostrzega, gdy nie da się go rozwiązać albo jest niedozwolone.

### 7) Naprawa obrazu sandbox

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje build albo
przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.

### 7b) Zależności runtime dołączonych Pluginów

Doctor weryfikuje zależności runtime tylko dla dołączonych Pluginów, które są aktywne w
bieżącej konfiguracji albo włączone domyślnie przez dołączony manifest, na przykład
`plugins.entries.discord.enabled: true`, starsze
`channels.discord.enabled: true` albo domyślnie włączony dołączony dostawca. Jeśli którejś
brakuje, doctor raportuje pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne Pluginy nadal
używają `openclaw plugins install` / `openclaw plugins update`; doctor nie
instaluje zależności dla dowolnych ścieżek Pluginów.

### 8) Migracje usługi Gateway i wskazówki czyszczenia

Doctor wykrywa starsze usługi gateway (`launchd/systemd/schtasks`) i
proponuje ich usunięcie oraz instalację usługi OpenClaw przy użyciu bieżącego portu gateway.
Może także skanować w poszukiwaniu dodatkowych usług podobnych do gateway i wypisywać wskazówki czyszczenia.
Usługi OpenClaw gateway nazwane profilem są traktowane jako pełnoprawne i nie są
oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą albo możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy snapshot przed migracją, a następnie
uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix i przygotowanie starszego zaszyfrowanego stanu. Oba kroki nie są krytyczne; błędy są logowane, a start trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 8c) Parowanie urządzeń i dryf auth

Doctor sprawdza teraz stan parowania urządzeń jako część normalnego przebiegu health.

Co raportuje:

- oczekujące pierwsze żądania parowania
- oczekujące rozszerzenia ról dla już sparowanych urządzeń
- oczekujące rozszerzenia zakresów dla już sparowanych urządzeń
- naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal się zgadza, ale tożsamość urządzenia
  nie zgadza się już z zatwierdzonym rekordem
- sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
- sparowane tokeny, których zakresy odbiegają od zatwierdzonej bazowej linii parowania
- lokalne wpisy cache device-token dla bieżącej maszyny, które poprzedzają
  rotację tokenu po stronie gateway albo zawierają nieaktualne metadane zakresu

Doctor nie zatwierdza automatycznie żądań parowania ani nie obraca automatycznie tokenów urządzeń. Zamiast tego
wypisuje dokładne kolejne kroki:

- sprawdź oczekujące żądania przez `openclaw devices list`
- zatwierdź dokładne żądanie przez `openclaw devices approve <requestId>`
- obróć świeży token przez `openclaw devices rotate --device <deviceId> --role <role>`
- usuń i zatwierdź ponownie nieaktualny rekord przez `openclaw devices remove <deviceId>`

To zamyka częstą lukę „już sparowane, ale nadal pojawia się pairing required”:
doctor rozróżnia teraz pierwsze parowanie od oczekujących rozszerzeń roli/zakresu
oraz od nieaktualnego dryfu tokenu/tożsamości urządzenia.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez listy dozwolonych albo
gdy polityka jest skonfigurowana w niebezpieczny sposób.

### 10) `systemd linger` (Linux)

Jeśli działa jako usługa użytkownika `systemd`, doctor upewnia się, że lingering jest włączony, aby
gateway pozostawał aktywny po wylogowaniu.

### 11) Status workspace (Skills, Pluginy i starsze katalogi)

Doctor wypisuje podsumowanie stanu workspace dla domyślnego agenta:

- **Status Skills**: liczba Skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlist.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` albo inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Status Pluginów**: liczba załadowanych/wyłączonych/błędnych Pluginów; wypisuje identyfikatory Pluginów dla wszelkich
  błędów; raportuje możliwości dołączonych Pluginów.
- **Ostrzeżenia o zgodności Pluginów**: oznacza Pluginy, które mają problemy zgodności z
  bieżącym runtime.
- **Diagnostyka Pluginów**: pokazuje wszelkie ostrzeżenia albo błędy czasu ładowania emitowane przez
  rejestr Pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` albo inne wstrzykiwane pliki kontekstu) są blisko albo powyżej skonfigurowanego
budżetu znaków. Raportuje dla każdego pliku liczbę surowych vs. wstrzykniętych znaków, procent obcięcia,
przyczynę obcięcia (`max/file` albo `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcinane albo zbliżają się do limitu,
doctor wypisuje wskazówki dotyczące strojenia `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autouzupełnianie powłoki

Doctor sprawdza, czy autouzupełnianie tab zostało zainstalowane dla bieżącej powłoki
(zsh, bash, fish albo PowerShell):

- Jeśli profil powłoki używa powolnego dynamicznego wzorca autouzupełniania
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem cache.
- Jeśli autouzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache,
  doctor automatycznie regeneruje cache.
- Jeśli autouzupełnianie w ogóle nie jest skonfigurowane, doctor proponuje jego instalację
  (tylko tryb interaktywny; pomijane przy `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie odtworzyć cache.

### 12) Kontrole auth Gateway (lokalny token)

Doctor sprawdza gotowość lokalnego auth tokenu Gateway.

- Jeśli tryb tokenu wymaga tokenu i nie istnieje źródło tokenu, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzane przez SecretRef, ale niedostępne, doctor ostrzega i nie nadpisuje go jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

### 12b) Naprawy read-only uwzględniające SecretRef

Niektóre przepływy naprawcze muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status dla ukierunkowanych napraw konfiguracji.
- Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje używać skonfigurowanych poświadczeń bota, gdy są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor raportuje, że poświadczenie jest skonfigurowane, ale niedostępne, i pomija automatyczne rozwiązywanie zamiast się wykrzaczać albo błędnie raportować brak tokenu.

### 13) Kontrola health Gateway + restart

Doctor uruchamia kontrolę health i proponuje restart gateway, gdy wygląda na
niezdrowy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddingów dla wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sprawdza, czy binarium `qmd` jest dostępne i może się uruchomić.
  Jeśli nie, wypisuje wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki do binarium.
- **Jawny dostawca lokalny**: sprawdza obecność lokalnego pliku modelu albo rozpoznanego
  zdalnego/pobieralnego URL modelu. Jeśli brak, sugeruje przełączenie na dostawcę zdalnego.
- **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest
  obecny w środowisku albo magazynie auth. Jeśli brak, wypisuje konkretne wskazówki naprawy.
- **Dostawca auto**: najpierw sprawdza dostępność modelu lokalnego, a potem próbuje każdego zdalnego
  dostawcę w kolejności automatycznego wyboru.

Gdy dostępny jest wynik probe gateway (gateway był zdrowy w czasie
kontroli), doctor porównuje ten wynik z konfiguracją widoczną dla CLI i wskazuje
każdą rozbieżność.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o statusie kanałów

Jeśli gateway jest zdrowy, doctor uruchamia probe statusu kanałów i raportuje
ostrzeżenia wraz z sugerowanymi poprawkami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (`launchd/systemd/schtasks`) pod kątem
brakujących albo nieaktualnych ustawień domyślnych (np. zależności `systemd network-online` i
opóźnienia restartu). Gdy wykryje niezgodność, zaleca aktualizację i może
przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne monity naprawcze.
- `openclaw doctor --repair` stosuje zalecane poprawki bez monitów.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli auth tokenu wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja/naprawa usługi doctor waliduje SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w jawnym tekście do metadanych środowiska usługi supervisora.
- Jeśli auth tokenu wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i podaje konkretne wskazówki.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
- Dla jednostek Linux user-systemd kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` przy porównywaniu metadanych auth usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka runtime Gateway + portu

Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także kolizje portów
na porcie gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już
działa, tunel SSH).

### 17) Najlepsze praktyki runtime Gateway

Doctor ostrzega, gdy usługa gateway działa na Bun albo ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżera wersji mogą psuć się po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor utrwala wszelkie zmiany konfiguracji i zapisuje metadane kreatora, aby odnotować
uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (backup + system pamięci)

Doctor sugeruje system pamięci workspace, gdy go brakuje, i wypisuje wskazówkę o kopii zapasowej,
jeśli workspace nie jest już pod git.

Pełny przewodnik po strukturze workspace i kopiach zapasowych git (zalecane prywatne GitHub albo GitLab) znajdziesz w [/concepts/agent-workspace](/pl/concepts/agent-workspace).

## Powiązane

- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Runbook Gateway](/pl/gateway)
