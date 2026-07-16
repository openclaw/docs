---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niezgodnych wstecznie zmian konfiguracji
sidebarTitle: Doctor
summary: 'Polecenie Doctor: kontrole kondycji, migracje konfiguracji i kroki naprawcze'
title: Diagnostyka
x-i18n:
    generated_at: "2026-07-16T18:37:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` to narzędzie do naprawy i migracji OpenClaw. Naprawia przestarzałą konfigurację i stan, sprawdza kondycję oraz podaje możliwe do wykonania kroki naprawcze.

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

    Akceptuje wartości domyślne bez monitów (w tym kroki naprawy ponownego uruchomienia, usługi i piaskownicy, gdy mają zastosowanie).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Stosuje zalecane naprawy bez monitów (`--repair` jest aliasem).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Uruchamia ustrukturyzowane kontrole kondycji na potrzeby CI lub automatyzacji wstępnej. Tylko do odczytu: bez
    monitów, napraw, migracji, ponownych uruchomień ani zapisów stanu.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Stosuje również agresywne naprawy (nadpisuje niestandardowe konfiguracje nadzorcy).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Uruchamia bez monitów, stosując tylko bezpieczne migracje (normalizacja konfiguracji +
    przenoszenie stanu na dysku). Pomija działania ponownego uruchomienia, usługi i piaskownicy, które wymagają
    potwierdzenia przez człowieka. Starsze migracje stanu nadal uruchamiają się automatycznie po wykryciu.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Aby przejrzeć zmiany przed zapisem, należy najpierw otworzyć plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Tryb lint tylko do odczytu

`openclaw doctor --lint` to przyjazny automatyzacji odpowiednik
`openclaw doctor --fix`. Oba korzystają z tego samego rejestru reguł Doctor, ale
nie wybierają ani nie wykonują reguł w ten sam sposób:

| Tryb                     | Monity   | Zapis konfiguracji/stanu     | Dane wyjściowe                 | Zastosowanie                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | tak       | nie                      | czytelny raport kondycji | ręczne sprawdzanie stanu         |
| `openclaw doctor --fix`  | czasami | tak, zgodnie z zasadami naprawy | czytelny dziennik napraw    | stosowanie zatwierdzonych napraw       |
| `openclaw doctor --lint` | nie        | nie                      | ustrukturyzowane ustalenia    | CI, kontrole wstępne i bramki przeglądu |

Domyślne `doctor --lint` uruchamia szeroki, bezpieczny profil automatyzacji: kontrole, które są
statyczne, lokalne i przydatne w danych wyjściowych CI lub kontroli wstępnej. Pomija kontrole opcjonalne, które
mają charakter doradczy, zależą od środowiska lub działającej usługi, obejmują inwentaryzację kont i przestrzeni roboczych
albo historyczne porządki. Aby przeprowadzić
pełny zarejestrowany audyt lint, w tym kontrole opcjonalne, należy użyć `doctor --lint --all`, a do
kontroli ukierunkowanej — `--only <id>`.

`doctor --fix` nie używa domyślnego profilu lint i nie akceptuje
`--all`. Uruchamia uporządkowaną ścieżkę naprawczą Doctor: nowoczesne kontrole kondycji mogą udostępniać
opcjonalną implementację `repair()`, a starsze obszary nadal korzystają ze swojej starszej
ścieżki naprawczej Doctor. Niektóre ustalenia lint są celowo wyłącznie diagnostyczne, więc
pojawienie się kontroli w `--lint --all` nie oznacza, że `--fix` zmodyfikuje ten obszar.
Kontrakt oddziela `detect()` (raportuje ustalenia) od `repair()` (raportuje
zmiany/różnice/skutki uboczne), co pozostawia możliwość przyszłego
`doctor --fix --dry-run` bez przekształcania kontroli lint w planery modyfikacji.

Niektóre wbudowane kontrole są wewnętrznie domyślnie wyłączone, dzięki czemu pozostają dostępne dla
`--all`, `--only` i ścieżek naprawczych Doctor, nie stając się częścią domyślnego
profilu automatyzacji `doctor --lint`. Poziom ważności ustalenia jest nadal emitowany dla każdego
ustalenia (`info`, `warning` lub `error`); domyślny wybór nie jest poziomem
ważności.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Pola danych wyjściowych JSON:

- `ok`: czy którekolwiek ustalenie osiągnęło wybrany próg ważności
- `checksRun` / `checksSkipped`: liczby (pominięte przez profil, `--only` lub `--skip`)
- `findings`: ustrukturyzowana diagnostyka z `checkId`, `severity`, `message` oraz opcjonalnymi `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Kody wyjścia:

| Kod | Znaczenie                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | brak ustaleń na wybranym progu lub powyżej niego           |
| `1`  | co najmniej jedno ustalenie osiągnęło wybrany próg          |
| `2`  | awaria polecenia/środowiska wykonawczego przed wyemitowaniem ustaleń |

Flagi:

- `--severity-min info|warning|error` (domyślnie `warning`): określa zarówno to, co jest wyświetlane, jak i to, co powoduje niezerowy kod wyjścia.
- `--all`: uruchamia każdą zarejestrowaną kontrolę lint, w tym kontrole opcjonalne wykluczone z domyślnego zestawu automatyzacji.
- `--only <id>` (można powtarzać): uruchamia tylko kontrole o podanych identyfikatorach; nieznany identyfikator jest raportowany jako ustalenie błędu.
- `--skip <id>` (można powtarzać): wyklucza kontrolę, pozostawiając aktywną resztę przebiegu.
- `--json`, `--severity-min`, `--all`, `--only` i `--skip` wymagają `--lint`; zwykłe przebiegi `openclaw doctor` i `--fix` je odrzucają.

## Działanie (podsumowanie)

<AccordionGroup>
  <Accordion title="Kondycja, interfejs i aktualizacje">
    - Opcjonalna aktualizacja wstępna instalacji git (tylko interaktywnie).
    - Kontrola aktualności protokołu interfejsu (przebudowuje interfejs sterowania, gdy schemat protokołu jest nowszy).
    - Kontrola kondycji i monit o ponowne uruchomienie.
    - Uwagi dotyczące wyłącznie problematycznych umiejętności i pluginów; prawidłowa inwentaryzacja pozostaje w `openclaw skills check` i `openclaw plugins list`.

  </Accordion>
  <Accordion title="Konfiguracja i migracje">
    - Normalizacja konfiguracji starszych postaci wartości.
    - Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
    - Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
    - Ostrzeżenia o nadpisaniu dostawcy OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migracja starszego dostawcy/profilu OpenAI Codex (`openai-codex` → `openai`) oraz ostrzeżenia o przesłanianiu przez przestarzałe `models.providers.openai-codex`.
    - Kontrola wymagań wstępnych TLS dla profili OAuth OpenAI Codex.
    - Ostrzeżenia dotyczące list dozwolonych pluginów/narzędzi, gdy `plugins.allow` jest restrykcyjne, ale zasady narzędzi nadal żądają symbolu wieloznacznego lub narzędzi należących do pluginów.
    - Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
    - Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola dostarczania/ładunku najwyższego poziomu, `provider` ładunku, zadania awaryjne webhooka `notify: true`).
    - Naprawa przypięcia środowiska wykonawczego Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) w `agents.defaults`, `agents.list[]` i `models.providers.*` (w tym wpisach poszczególnych modeli).
    - Czyszczenie przestarzałej konfiguracji pluginów, gdy pluginy są włączone; przy `plugins.enabled=false` przestarzałe odwołania do pluginów są zachowywane jako nieaktywna konfiguracja izolacyjna.

  </Accordion>
  <Accordion title="Stan i integralność">
    - Kontrola plików blokad sesji i usuwanie nieaktualnych blokad.
    - Naprawa transkrypcji sesji w przypadku zduplikowanych gałęzi przepisywania promptów utworzonych przez wadliwe kompilacje 2026.4.24.
    - Wykrywanie zakleszczonych znaczników nagrobnych odzyskiwania po ponownym uruchomieniu podagentów, z obsługą `--fix` służącą do usuwania nieaktualnych flag przerwanego odzyskiwania, aby podczas uruchamiania proces potomny nie był stale traktowany jako przerwany wskutek ponownego uruchomienia.
    - Kontrole integralności stanu i uprawnień (sesje, transkrypcje, katalog stanu).
    - Kontrole uprawnień pliku konfiguracji (chmod 600) podczas działania lokalnego.
    - Kondycja uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany okresu karencji/wyłączenia profilu uwierzytelniania.

  </Accordion>
  <Accordion title="Gateway, usługi i nadzorcy">
    - Naprawa obrazu piaskownicy, gdy piaskownica jest włączona.
    - Migracja starszych usług i wykrywanie dodatkowych instancji Gateway.
    - Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
    - Kontrole środowiska wykonawczego Gateway (usługa zainstalowana, ale nieuruchomiona; buforowana etykieta launchd).
    - Ostrzeżenia o stanie kanałów (sondowane z działającego Gateway).
    - Kontrole uprawnień właściwe dla kanałów znajdują się w `openclaw channels capabilities`; na przykład uprawnienia kanałów głosowych Discord są audytowane za pomocą `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kontrole responsywności WhatsApp pod kątem pogorszonej kondycji pętli zdarzeń Gateway, gdy lokalne klienty TUI nadal działają; `--fix` zatrzymuje wyłącznie zweryfikowane lokalne klienty TUI.
    - Naprawa tras Codex dla starszych odwołań do modeli `openai-codex/*` w modelach podstawowych, modelach rezerwowych, modelach generowania obrazów/wideo, nadpisaniach heartbeat/podagentów/compaction, hakach, nadpisaniach modeli kanałów i przypięciach tras sesji; `--fix` przepisuje je na `openai/*`, migruje profile/kolejność uwierzytelniania `openai-codex:*` do `openai:*`, usuwa przestarzałe przypięcia środowiska wykonawczego sesji/całego agenta i pozwala naprawionej trasie efektywnej określić zgodność z Codex.
    - Audyt konfiguracji nadzorcy (launchd/systemd/schtasks) z opcjonalną naprawą.
    - Czyszczenie osadzonych zmiennych środowiskowych serwera proxy dla usług Gateway, które przechwyciły wartości powłoki `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` podczas instalacji lub aktualizacji.
    - Kontrole środowiska wykonawczego Gateway (nieobsługiwane starsze usługi Bun, ścieżki menedżera wersji).
    - Diagnostyka konfliktów portu Gateway (domyślnie `18789`).

  </Accordion>
  <Accordion title="Uwierzytelnianie, bezpieczeństwo i parowanie">
    - Ostrzeżenia dotyczące bezpieczeństwa dla otwartych zasad wiadomości bezpośrednich.
    - Kontrole uwierzytelniania Gateway w lokalnym trybie tokenu (oferuje wygenerowanie tokenu, gdy nie istnieje żadne jego źródło; nie nadpisuje konfiguracji tokenu SecretRef).
    - Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące rozszerzenia roli/zakresu, rozbieżność nieaktualnej lokalnej pamięci podręcznej tokenu urządzenia oraz rozbieżność uwierzytelniania sparowanego rekordu).

  </Accordion>
  <Accordion title="Przestrzeń robocza i powłoka">
    - Kontrola utrzymywania sesji systemd w systemie Linux.
    - Kontrola rozmiaru pliku inicjalizacyjnego przestrzeni roboczej (ostrzeżenia o obcięciu lub zbliżeniu się plików kontekstu do limitu).
    - Kontrola gotowości Skills dla domyślnego agenta; raportuje dozwolone umiejętności z brakującymi plikami binarnymi, zmiennymi środowiskowymi, konfiguracją lub wymaganiami systemu operacyjnego, a `--fix` może wyłączyć niedostępne umiejętności w `skills.entries`.
    - Kontrola stanu uzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
    - Kontrola gotowości dostawcy osadzania do wyszukiwania w pamięci (model lokalny, klucz zdalnego API lub plik binarny QMD).
    - Kontrole instalacji ze źródeł (niezgodność przestrzeni roboczej pnpm, brakujące zasoby interfejsu, brakujący plik binarny tsx).
    - Zapisuje zaktualizowaną konfigurację i metadane kreatora.

  </Accordion>
</AccordionGroup>

## Uzupełnianie i resetowanie interfejsu Dreams UI

Scena Dreams w interfejsie Control UI zawiera akcje **Uzupełnij wstecznie**, **Resetuj** i **Wyczyść ugruntowane** dla przepływu ugruntowanego Dreaming. Korzystają one z metod RPC Gateway w stylu doctor, ale **nie** stanowią części naprawy/migracji CLI `openclaw doctor`.

| Akcja                  | Działanie                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uzupełnij wstecznie    | Skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym obszarze roboczym, uruchamia ugruntowany przebieg dziennika REM i zapisuje odwracalne wpisy uzupełnienia wstecznego w `DREAMS.md`. |
| Resetuj                | Usuwa z `DREAMS.md` tylko oznaczone wpisy dziennika utworzone przez uzupełnienie wsteczne.                                                                                              |
| Wyczyść ugruntowane    | Usuwa z odtwarzania historii tylko przygotowane, wyłącznie ugruntowane wpisy krótkoterminowe, które nie zgromadziły jeszcze aktywnych przywołań ani codziennego wsparcia.                        |

Żadna z tych akcji nie edytuje `MEMORY.md`, nie uruchamia pełnych migracji doctor ani samodzielnie nie przygotowuje ugruntowanych kandydatów w aktywnym magazynie awansu krótkoterminowego. Aby przekazać ugruntowane odtwarzanie historii do standardowej ścieżki głębokiego awansu, należy zamiast tego użyć przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Powoduje to przygotowanie ugruntowanych trwałych kandydatów w krótkoterminowym magazynie Dreaming, podczas gdy `DREAMS.md` pozostaje powierzchnią przeglądu.

## Szczegółowe działanie i uzasadnienie

<AccordionGroup>
  <Accordion title="0. Opcjonalna aktualizacja (instalacje git)">
    Jeśli jest to checkout git, a doctor działa interaktywnie, przed uruchomieniem procedury doctor proponuje aktualizację (pobranie/rebase/kompilację).
  </Accordion>
  <Accordion title="1. Normalizacja konfiguracji">
    Doctor normalizuje starsze postacie wartości do bieżącego schematu. Bieżąca konfiguracja mowy Talk to `talk.provider` + `talk.providers.<provider>`, natomiast konfiguracja głosu w czasie rzeczywistym znajduje się w `talk.realtime.*`. Doctor przepisuje stare postacie `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców, a starsze selektory czasu rzeczywistego najwyższego poziomu (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) do `talk.realtime`.

    Doctor ostrzega również, gdy `plugins.allow` nie jest pusty, a zasady narzędzi używają symboli wieloznacznych lub wpisów narzędzi należących do Pluginów. `tools.allow: ["*"]` dopasowuje wyłącznie narzędzia z Pluginów, które faktycznie zostały załadowane; nie omija wyłącznej listy dozwolonych Pluginów.

  </Accordion>
  <Accordion title="2. Migracje starszych kluczy konfiguracji">
    Gdy konfiguracja zawiera przestarzały klucz z aktywną migracją, inne polecenia odmawiają działania i proszą o uruchomienie `openclaw doctor`. Doctor wyjaśnia, które starsze klucze znaleziono, przedstawia zastosowaną migrację i przepisuje `~/.openclaw/openclaw.json` przy użyciu zaktualizowanego schematu. Uruchamianie Gateway odrzuca starsze formaty konfiguracji i prosi o uruchomienie `openclaw doctor --fix`; nie przepisuje `openclaw.json` podczas uruchamiania. Migracje magazynu zadań Cron również obsługuje `openclaw doctor --fix`.

    <Note>
      Doctor zachowuje automatyczne migracje tylko przez około dwa miesiące od
      wycofania klucza. Starsze klucze historyczne (na przykład pierwotne
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` najwyższego poziomu lub `identity`
      najwyższego poziomu ze struktury konfiguracji sprzed obsługi wielu agentów) nie mają już ścieżki migracji;
      konfiguracja, która ich używa, nie przechodzi obecnie walidacji zamiast zostać przepisana. Przed
      kontynuowaniem procedury doctor należy ręcznie poprawić te klucze zgodnie z bieżącą dokumentacją
      konfiguracji.
    </Note>

    Aktywne migracje:

    | Starszy klucz                                                                                 | Bieżący klucz                                                                 |
    | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                           | `channels.whatsapp.allowFrom`                                                            |
    | `routing.groupChat.requireMention`                                                                           | `channels.whatsapp/telegram/imessage.groups."*".requireMention`                                                            |
    | `routing.groupChat.historyLimit`                                                                           | `messages.groupChat.historyLimit`                                                            |
    | `routing.groupChat.mentionPatterns`                                                                           | `messages.groupChat.mentionPatterns`                                                            |
    | `channels.telegram.requireMention`                                                                           | `channels.telegram.groups."*".requireMention`                                                            |
    | `channels.webchat`, `gateway.webchat`                                                       | usunięto (WebChat został wycofany)                                            |
    | `channels.feishu.accounts.<accountId>.botName`                                                                           | `channels.feishu.accounts.<accountId>.name`                                                            |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (oraz dla poszczególnych kont)                         | `...threadBindings.idleHours`                                                            |
    | starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` | `talk.provider` + `talk.providers.<provider>`                               |
    | starsze selektory Talk czasu rzeczywistego najwyższego poziomu (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) | `messages.tts.providers.<provider>`                                                         |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                                       | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`                                      |
    | pola mówcy TTS `voice`/`voiceName`/`voiceId`                       | `speakerVoice`/`speakerVoiceId`                                        |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (wszystkie kanały oprócz Discord)                      | `...tts.providers.<provider>`                                                            |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (wszystkie kanały, w tym Discord)                      | `...voice.tts.providers.<provider>`                                                            |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) | `plugins.entries.voice-call.config.tts.providers.<provider>`                                                         |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                                                       | `provider: "microsoft"` / `...tts.providers.microsoft`                                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                                                           | `"mock"`                                                            |
    | `plugins.entries.voice-call.config.twilio.from`                                                                           | `plugins.entries.voice-call.config.fromNumber`                                                            |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                                                           | `plugins.entries.voice-call.config.streaming.provider`                                                            |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold`                   | `plugins.entries.voice-call.config.streaming.providers.openai.*`                                                            |
    | `models.providers.*.api: "openai"`                                                                           | `"openai-completions"` (podczas uruchamiania Gateway pomijani są również dostawcy, których `api` jest przyszłą/nieznaną wartością wyliczenia, zamiast powodować odrzucenie) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                                           | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                                                            |
    | `browser.profiles.*.driver: "extension"`                                                                           | `"existing-session"`                                                            |
    | `browser.relayBindHost`                                                                           | usunięto (starsze ustawienie przekaźnika rozszerzenia Chrome)                 |
    | `mcp.servers.*.type` (aliasy natywne dla CLI)                                                   | `mcp.servers.*.transport`                                                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                                                           | usunięto (serwer aplikacji Codex zawsze zachowuje narzędzia obszaru roboczego natywne dla Codex jako natywne) |
    | `commands.modelsWrite`                                                                           | usunięto (`/models add` jest przestarzałe)                               |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                                                       | usunięto (dokładna wartość `NO_REPLY` nie jest już przepisywana na widoczny tekst zastępczy) |
    | `agents.defaults/list[].systemPromptOverride`                                                                           | usunięto (OpenClaw jest właścicielem wygenerowanego monitu systemowego)       |
    | `agents.defaults/list[].embeddedPi`                                                                           | `embeddedAgent`                                                            |
    | `agents.defaults/list[].sandbox.perSession`                                                                           | `sandbox.scope`                                                            |
    | `agents.defaults.llm`                                                                           | usunięto (dla limitów czasu wolnego modelu/dostawcy należy użyć `models.providers.<id>.timeoutSeconds`, utrzymując je poniżej górnego limitu czasu agenta/uruchomienia) |
    | `memorySearch` najwyższego poziomu                                                        | `agents.defaults.memorySearch`                                                            |
    | `memorySearch.provider: "auto"`                                                                           | `"openai"`                                                            |
    | `memorySearch.store.path` (na dowolnym poziomie)                                                    | usunięto (indeksy pamięci znajdują się w bazie danych każdego agenta)         |
    | `heartbeat` najwyższego poziomu                                                        | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                                      |
    | identyfikatory zasad `plugins.openai-codex`                                                       | `plugins.openai`                                                            |
    | `tools.web.x_search.apiKey`                                                                           | `plugins.entries.xai.config.webSearch.apiKey`                                                            |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                                       | usunięto (przestarzałe)                                                       |
    | `diagnostics.memoryPressureBundle`                                                                           | `diagnostics.memoryPressureSnapshot`                                                            |

    <Note>
      Powyższe wiersze `plugins.entries.voice-call.config.*` są normalizowane przez
      sam Plugin Voice Call przy każdym wczytaniu konfiguracji, a nie przez `openclaw
      doctor`. Plugin rejestruje również podczas uruchamiania ostrzeżenie wskazujące na `openclaw
      doctor --fix`, ale doctor obecnie nie przepisuje
      `openclaw.json` dla tych kluczy; zmiana jest stosowana w czasie działania
      przez własną normalizację Pluginu.
    </Note>

    Wskazówki dotyczące domyślnego konta dla kanałów obsługujących wiele kont:

    - Jeśli skonfigurowano co najmniej dwa wpisy `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing zastępczy może wybrać nieoczekiwane konto.
    - Jeśli `channels.<channel>.defaultAccount` wskazuje nieznany identyfikator konta, doctor wyświetla ostrzeżenie i listę identyfikatorów skonfigurowanych kont.

  </Accordion>
  <Accordion title="2b. Nadpisania dostawcy OpenCode">
    Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, powoduje to nadpisanie wbudowanego katalogu OpenCode z `openclaw/plugin-sdk/llm`. Może to wymusić używanie przez modele niewłaściwego API lub wyzerować koszty. Doctor ostrzega, aby umożliwić usunięcie nadpisania i przywrócenie routingu API oraz kosztów dla poszczególnych modeli.
  </Accordion>
  <Accordion title="2c. Migracja przeglądarki i gotowość Chrome MCP">
    Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP lokalnego dla hosta (`browser.profiles.*.driver: "extension"` → `"existing-session"`; usunięto `browser.relayBindHost`).

    Doctor sprawdza również ścieżkę Chrome MCP lokalną dla hosta, gdy używany jest profil `defaultProfile: "user"` lub skonfigurowany profil `existing-session`:

    - sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście w przypadku domyślnych profili automatycznego łączenia
    - sprawdza wykrytą wersję Chrome i ostrzega, gdy jest ona niższa niż Chrome 144
    - przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

    Doctor nie może włączyć tego ustawienia po stronie Chrome. Chrome MCP lokalne dla hosta nadal wymaga przeglądarki opartej na Chromium w wersji 144+ na hoście gateway/node, uruchomionej lokalnie, z włączonym zdalnym debugowaniem oraz zatwierdzonym w przeglądarce pierwszym monitem o zgodę na dołączenie.

    Gotowość w tym przypadku obejmuje wyłącznie lokalne wymagania wstępne dołączenia. Tryb istniejącej sesji zachowuje bieżące ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport plików PDF, przechwytywanie pobierania i działania wsadowe, nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP. Ta kontrola nie dotyczy platformy Docker, piaskownicy, zdalnej przeglądarki ani innych przepływów bez interfejsu graficznego, które nadal używają surowego CDP.

  </Accordion>
  <Accordion title="2d. Wymagania wstępne TLS dla OAuth">
    Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor testuje punkt końcowy autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL może zweryfikować łańcuch certyfikatów. Jeśli test zakończy się niepowodzeniem z powodu błędu certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasłego certyfikatu lub certyfikatu z podpisem własnym), doctor wyświetla instrukcje naprawy odpowiednie dla danej platformy. W systemie macOS z Node zainstalowanym przez Homebrew rozwiązaniem jest zwykle `brew postinstall ca-certificates`. W przypadku `--deep` test jest wykonywany nawet wtedy, gdy gateway działa prawidłowo.
  </Accordion>
  <Accordion title="2e. Nadpisania dostawcy OAuth Codex">
    Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w `models.providers.openai-codex`, mogą one przesłonić wbudowaną ścieżkę dostawcy OAuth Codex. Doctor ostrzega, gdy wykryje te stare ustawienia transportu obok OAuth Codex, aby umożliwić usunięcie lub przepisanie nieaktualnego nadpisania transportu i przywrócenie bieżącego routingu. Niestandardowe serwery proxy i nadpisania dotyczące wyłącznie nagłówków nadal są obsługiwane i nie wywołują tego ostrzeżenia, ale utworzone w ten sposób trasy żądań nie kwalifikują się do niejawnego wyboru Codex.
  </Accordion>
  <Accordion title="2f. Naprawa trasy Codex">
    Doctor sprawdza starsze odwołania do modeli `openai-codex/*`. Natywny routing środowiska Codex używa kanonicznych odwołań do modeli `openai/*`, ale sam prefiks nigdy nie wybiera Codex. Gdy zasady środowiska uruchomieniowego nie są ustawione lub ustawiono `auto`, kwalifikuje się wyłącznie dokładna oficjalna trasa HTTPS Platform Responses lub ChatGPT Responses bez utworzonego nadpisania żądania. Zobacz [Niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).

    W trybie `--fix` / `--repair` doctor przepisuje odwołania domyślnego agenta i poszczególnych agentów, w tym modele główne, modele rezerwowe, modele generowania obrazów i filmów, nadpisania heartbeat/subagenta/compaction, hooki, nadpisania modeli kanałów oraz nieaktualny utrwalony stan trasy sesji:

    - `openai-codex/gpt-*` zmienia się na `openai/gpt-*`.
    - Zamiar użycia Codex zostaje przeniesiony do wpisów `agentRuntime.id: "codex"` o zakresie dostawcy/modelu dla naprawionych odwołań do modeli agentów.
    - Nieaktualna konfiguracja środowiska uruchomieniowego całego agenta i utrwalone przypięcia środowiska uruchomieniowego sesji są usuwane, ponieważ wybór środowiska uruchomieniowego ma zakres dostawcy/modelu.
    - Istniejące zasady środowiska uruchomieniowego dostawcy/modelu są zachowywane, chyba że naprawiane starsze odwołanie do modelu wymaga routingu Codex w celu zachowania starej ścieżki uwierzytelniania.
    - Istniejące listy modeli rezerwowych są zachowywane, a ich starsze wpisy zostają przepisane; skopiowane ustawienia poszczególnych modeli są przenoszone ze starszego klucza do kanonicznego klucza `openai/*`.
    - Utrwalone elementy sesji `modelProvider`/`providerOverride`, `model`/`modelOverride`, powiadomienia o przełączeniu awaryjnym i przypięcia profili uwierzytelniania są naprawiane we wszystkich wykrytych magazynach sesji agentów.
    - Doctor oddzielnie naprawia nieaktualne przypięcia `agentRuntime.id: "codex-cli"` (odrębny starszy identyfikator środowiska uruchomieniowego), zmieniając je na `"codex"` we wpisach modeli `agents.defaults`, `agents.list[]` i `models.providers.*`.
    - `/codex ...` oznacza „sterowanie natywną konwersacją Codex z poziomu czatu lub powiązanie jej z nim”.
    - `/acp ...` lub `runtime: "acp"` oznacza „użycie zewnętrznego adaptera ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Czyszczenie tras sesji">
    Doctor skanuje również wykryte magazyny sesji agentów w poszukiwaniu nieaktualnego, automatycznie utworzonego stanu tras po przeniesieniu skonfigurowanych modeli lub środowiska uruchomieniowego z trasy należącej do pluginu, takiej jak Codex.

    `openclaw doctor --fix` może usunąć automatycznie utworzony nieaktualny stan, taki jak przypięcia modeli `modelOverrideSource: "auto"`, metadane modelu środowiska uruchomieniowego, przypięte identyfikatory środowiska, powiązania sesji CLI i automatyczne nadpisania profilu uwierzytelniania, gdy trasa będąca ich właścicielem nie jest już skonfigurowana. Jawne wybory modelu sesji dokonane przez użytkownika lub pochodzące ze starszych wersji są zgłaszane do ręcznej weryfikacji i pozostawiane bez zmian; należy je przełączyć za pomocą `/model ...`, `/new` lub zresetować sesję, gdy dana trasa nie jest już zamierzona.

  </Accordion>
  <Accordion title="3. Migracje starszego stanu (układ na dysku)">
    Doctor może migrować starsze układy na dysku do bieżącej struktury:

    - Magazyn sesji i transkrypcje: z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
    - Katalog agenta: z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
    - Stan uwierzytelniania WhatsApp (Baileys): ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`) do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

    Te migracje są wykonywane w miarę możliwości i są idempotentne; doctor emituje ostrzeżenia, gdy pozostawia starsze foldery jako kopie zapasowe. Gateway/CLI również automatycznie migruje starsze sesje i katalog agenta podczas uruchamiania, dzięki czemu historia, uwierzytelnianie i modele trafiają do ścieżki poszczególnego agenta bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane wyłącznie za pomocą `openclaw doctor`. Normalizacja dostawcy Talk/mapy dostawców porównuje dane według równości strukturalnej, dzięki czemu różnice dotyczące wyłącznie kolejności kluczy nie wywołują już powtarzających się, niewprowadzających zmian operacji `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migracje starszych manifestów pluginów">
    Doctor skanuje wszystkie manifesty zainstalowanych pluginów w poszukiwaniu przestarzałych kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu `contracts` i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna; jeśli `contracts` zawiera już te same wartości, starszy klucz jest usuwany bez duplikowania danych.
  </Accordion>
  <Accordion title="3b. Migracje starszego magazynu cron">
    Doctor sprawdza również magazyn zadań cron (domyślnie `~/.openclaw/cron/jobs.json` lub `cron.store` po nadpisaniu) w poszukiwaniu starych postaci zadań, które harmonogram nadal akceptuje ze względu na zgodność.

    Bieżące operacje czyszczenia cron obejmują:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - pola ładunku najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
    - pola dostarczania najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliasy dostarczania `provider` w ładunku → jawne `delivery.channel`
    - starsze zadania awaryjne webhooka `notify: true` → jawne dostarczanie przez webhook z `cron.webhook`, gdy jest ustawione; zadania ogłoszeń zachowują dostarczanie na czacie i otrzymują `delivery.completionDestination`. Gdy `cron.webhook` nie jest ustawione, nieaktywny znacznik najwyższego poziomu `notify` jest usuwany z zadań bez celu (istniejący sposób dostarczania, w tym ogłoszenia, zostaje zachowany), ponieważ mechanizm dostarczania środowiska uruchomieniowego nigdy go nie odczytuje.

    Gateway oczyszcza również nieprawidłowo ukształtowane wiersze cron podczas ładowania, aby prawidłowe zadania nadal działały. Surowe, nieprawidłowo ukształtowane wiersze są kopiowane do `jobs-quarantine.json` obok aktywnego magazynu przed usunięciem z `jobs.json`; doctor zgłasza wiersze poddane kwarantannie, aby umożliwić ich ręczne sprawdzenie lub naprawienie.

    Podczas uruchamiania Gateway normalizuje projekcję środowiska uruchomieniowego i ignoruje znacznik najwyższego poziomu `notify`, ale pozostawia utrwaloną konfigurację cron do naprawienia przez doctor. Gdy `cron.webhook` nie jest ustawione, doctor usuwa nieaktywny znacznik z zadań bez celu migracji (`delivery.mode` ma wartość „none” lub nie występuje, cel webhooka jest bezużyteczny albo istnieje już dostarczanie ogłoszeń/czatu), pozostawiając istniejący sposób dostarczania bez zmian, dzięki czemu kolejne uruchomienia `doctor --fix` nie ostrzegają już ponownie o tym samym zadaniu. Jeśli `cron.webhook` jest ustawione, ale nie jest prawidłowym adresem URL HTTP(S), doctor nadal ostrzega i pozostawia znacznik, aby umożliwić poprawienie adresu URL.

    W systemie Linux doctor ostrzega również, gdy crontab użytkownika nadal wywołuje starszy `~/.openclaw/bin/ensure-whatsapp.sh`. Ten lokalny dla hosta skrypt nie jest utrzymywany przez bieżącą wersję OpenClaw i może zapisywać fałszywe komunikaty `Gateway inactive` w `~/.openclaw/logs/whatsapp-health.log`, gdy cron nie może połączyć się z magistralą użytkownika systemd. Należy usunąć nieaktualny wpis crontab za pomocą `crontab -e`; do bieżących kontroli kondycji należy używać `openclaw channels status --probe`, `openclaw doctor` i `openclaw gateway status`.

  </Accordion>
  <Accordion title="3c. Czyszczenie blokad sesji">
    Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokady zapisu pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady zgłasza: ścieżkę, PID, informację, czy PID nadal działa, wiek blokady oraz informację, czy jest ona uznawana za nieaktualną (martwy PID, nieprawidłowe metadane właściciela, wiek powyżej 30 minut lub działający PID, którego przynależność do procesu innego niż OpenClaw została potwierdzona). W trybie `--fix` / `--repair` automatycznie usuwa blokady z martwymi, osieroconymi, ponownie wykorzystanymi, nieprawidłowymi i starymi właścicielami lub właścicielami innymi niż OpenClaw. Stare blokady nadal należące do działającego procesu OpenClaw są zgłaszane, ale pozostawiane na miejscu, aby doctor nie przerwał aktywnego procesu zapisu transkrypcji.
  </Accordion>
  <Accordion title="3d. Naprawa gałęzi transkrypcji sesji">
    Doctor skanuje pliki JSONL sesji agentów w poszukiwaniu zduplikowanej struktury gałęzi utworzonej przez błąd przepisywania transkrypcji promptu z wersji 2026.4.24: porzuconej wypowiedzi użytkownika z wewnętrznym kontekstem środowiska uruchomieniowego OpenClaw oraz aktywnej gałęzi równorzędnej zawierającej ten sam widoczny prompt użytkownika. W trybie `--fix` / `--repair` doctor tworzy kopię zapasową każdego pliku, którego dotyczy problem, obok oryginału i przepisuje transkrypcję do aktywnej gałęzi, dzięki czemu czytniki historii Gateway i pamięci nie widzą już zduplikowanych wypowiedzi.
  </Accordion>
  <Accordion title="4. Kontrole integralności stanu (utrwalanie sesji, routing i bezpieczeństwo)">
    Katalog stanu jest operacyjnym pniem mózgu. Jeśli zniknie, utracone zostaną sesje, dane uwierzytelniające, dzienniki i konfiguracja, chyba że istnieją ich kopie zapasowe w innym miejscu.

    Doctor sprawdza:

    - **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje ponowne utworzenie katalogu i przypomina, że nie może odzyskać brakujących danych.
    - **Uprawnienia katalogu stanu**: sprawdza możliwość zapisu; proponuje naprawę uprawnień (i wyświetla wskazówkę `chown` w przypadku wykrycia niezgodności właściciela/grupy).
    - **Katalog stanu synchronizowany z chmurą w systemie macOS**: ostrzega, gdy stan znajduje się w iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub `~/Library/CloudStorage/...`, ponieważ ścieżki objęte synchronizacją mogą powodować wolniejsze operacje wejścia/wyjścia oraz konflikty blokad i synchronizacji.
    - **Katalog stanu na nośniku SD lub eMMC w systemie Linux**: ostrzega, gdy stan znajduje się w źródle montowania `mmcblk*`, ponieważ losowe operacje wejścia/wyjścia na nośnikach SD/eMMC mogą być wolniejsze, a nośniki mogą szybciej się zużywać wskutek zapisu sesji i danych uwierzytelniających.
    - **Ulotny katalog stanu w systemie Linux**: ostrzega, gdy stan znajduje się w `tmpfs` lub `ramfs`, ponieważ sesje, dane uwierzytelniające, konfiguracja i stan SQLite (wraz z plikami pomocniczymi WAL/dziennika) znikają po ponownym uruchomieniu. Montowania Docker `overlay` celowo nie są oznaczane, ponieważ ich zapisywalne warstwy zachowują się po ponownym uruchomieniu hosta, dopóki kontener istnieje.
    - **Brak katalogów sesji**: katalogi `sessions/` i magazynu sesji są wymagane do zachowania historii i uniknięcia awarii `ENOENT`.
    - **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji nie mają plików transkrypcji.
    - **„Jednowierszowy JSONL” sesji głównej**: sygnalizuje, gdy główna transkrypcja ma tylko jeden wiersz (historia nie jest gromadzona).
    - **Wiele katalogów stanu**: ostrzega, gdy w katalogach domowych istnieje wiele folderów `~/.openclaw` lub gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może zostać rozdzielona między instalacje).
    - **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić go na zdalnym hoście (stan znajduje się właśnie tam).
    - **Uprawnienia pliku konfiguracyjnego**: ostrzega, jeśli `~/.openclaw/openclaw.json` może być odczytywany przez grupę lub wszystkich użytkowników, i proponuje ograniczenie uprawnień do `600`.

  </Accordion>
  <Accordion title="5. Stan uwierzytelniania modelu (wygaśnięcie OAuth)">
    Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega o wygasających lub wygasłych tokenach i może je bezpiecznie odświeżyć. Jeśli profil OAuth/tokenu Anthropic jest nieaktualny, sugeruje klucz API Anthropic lub ścieżkę tokenu konfiguracyjnego Anthropic. Monity o odświeżenie pojawiają się tylko podczas pracy interaktywnej (TTY); `--non-interactive` pomija próby odświeżenia.

    Gdy odświeżenie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`, `invalid_grant` lub dostawca wymaga ponownego zalogowania), doctor informuje o konieczności ponownego uwierzytelnienia i wyświetla dokładne polecenie `openclaw models auth login --provider ...` do uruchomienia.

    Doctor zgłasza również profile uwierzytelniania, które są tymczasowo niedostępne z powodu krótkich okresów karencji (limity szybkości, przekroczenia limitu czasu lub błędy uwierzytelniania) albo dłuższych wyłączeń (problemy z rozliczeniami lub środkami).

    Starsze profile OAuth Codex, których tokeny znajdują się w Pęku kluczy macOS (starsze wdrożenie sprzed układu z plikiem pomocniczym), są naprawiane wyłącznie przez doctor. Należy raz uruchomić `openclaw doctor --fix` w interaktywnym terminalu, aby przenieść starsze tokeny z Pęku kluczy bezpośrednio do `auth-profiles.json`; od tego momentu osadzone wywołania (Telegram, cron, delegowanie podagentów) rozpoznają je jako kanoniczne profile OAuth OpenAI.

  </Accordion>
  <Accordion title="6. Walidacja modelu punktów zaczepienia">
    Jeśli ustawiono `hooks.gmail.model`, doctor sprawdza odwołanie do modelu względem katalogu i listy dozwolonych oraz ostrzega, gdy nie można go rozpoznać lub jest niedozwolone.
  </Accordion>
  <Accordion title="7. Naprawa obrazu piaskownicy">
    Gdy piaskownica jest włączona, doctor sprawdza obrazy Docker i proponuje zbudowanie obrazu lub przełączenie na starsze nazwy, jeśli brakuje bieżącego obrazu.
  </Accordion>
  <Accordion title="7b. Czyszczenie instalacji Pluginów">
    Doctor usuwa starszy stan przygotowywania zależności Pluginów wygenerowany przez OpenClaw w trybie `openclaw doctor --fix` / `openclaw doctor --repair`: nieaktualne wygenerowane katalogi główne zależności, stare katalogi etapów instalacji, pozostałości lokalne pakietów po wcześniejszym kodzie naprawy zależności dołączonych Pluginów oraz osierocone lub odzyskane zarządzane kopie npm dołączonych Pluginów `@openclaw/*`, które mogą przesłaniać bieżący manifest dołączony do pakietu. Doctor ponownie dowiązuje także pakiet hosta `openclaw` do zarządzanych Pluginów npm deklarujących `peerDependencies.openclaw`, dzięki czemu lokalne dla pakietu importy środowiska uruchomieniowego, takie jak `openclaw/plugin-sdk/*`, pozostają rozpoznawalne po aktualizacjach lub naprawach npm.

    Doctor może również ponownie zainstalować brakujące Pluginy dostępne do pobrania, gdy odwołuje się do nich konfiguracja, ale lokalny rejestr Pluginów nie może ich znaleźć (istotne `plugins.entries`, skonfigurowane ustawienia kanału/dostawcy/wyszukiwania, skonfigurowane środowiska uruchomieniowe agentów). Podczas aktualizacji pakietów doctor unika ponownej instalacji pakietów Pluginów w trakcie wymiany pakietu podstawowego; jeśli skonfigurowany Plugin nadal wymaga odzyskania, po aktualizacji należy ponownie uruchomić `openclaw doctor --fix`. Poza opisanym poniżej wyjątkiem dotyczącym uruchamiania obrazu kontenera uruchomienie Gateway i ponowne wczytanie konfiguracji nie wykonują naprawy pakietów; instalacje Pluginów pozostają jawnymi operacjami doctor/install/update.

    Uruchamianie skonteneryzowanego Gateway ma wąski wyjątek dotyczący aktualizacji: gdy `openclaw gateway run` uruchamia się w nowej wersji OpenClaw, przed osiągnięciem gotowości wykonuje bezpieczne migracje stanu i istniejącą synchronizację Pluginów po aktualizacji rdzenia, a następnie zapisuje punkt kontrolny dla danej wersji. Ten przebieg startowy może wyczyścić nieaktualne rekordy dołączonych Pluginów, naprawić lokalne dowiązania Pluginów, ponownie zainstalować skonfigurowane pakiety Pluginów, gdy wymaga tego ścieżka synchronizacji, oraz sprawdzić aktywne ładunki Pluginów. Jeśli podczas uruchamiania nie można bezpiecznie wykonać naprawy, należy jednokrotnie uruchomić ten sam obraz z `openclaw doctor --fix` względem tego samego zamontowanego stanu i konfiguracji, a następnie normalnie ponownie uruchomić kontener.

  </Accordion>
  <Accordion title="8. Migracje usługi Gateway i wskazówki dotyczące czyszczenia">
    Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i proponuje ich usunięcie oraz zainstalowanie usługi OpenClaw korzystającej z bieżącego portu Gateway. Może również wyszukać dodatkowe usługi przypominające Gateway i wyświetlić wskazówki dotyczące ich usuwania. Usługi Gateway OpenClaw nazwane według profilu są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

    W systemie Linux, jeśli brakuje usługi Gateway na poziomie użytkownika, ale istnieje usługa Gateway OpenClaw na poziomie systemu, doctor nie instaluje automatycznie drugiej usługi na poziomie użytkownika. Należy sprawdzić stan za pomocą `openclaw gateway status --deep` lub `openclaw doctor --deep`, a następnie usunąć duplikat albo ustawić `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy cyklem życia Gateway zarządza nadzorca systemowy.

  </Accordion>
  <Accordion title="8b. Migracja Matrix podczas uruchamiania">
    Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu, doctor (w trybie `--fix` / `--repair`) tworzy migawkę sprzed migracji, a następnie podejmuje próbę wykonania kroków migracji: migracji starszego stanu Matrix i przygotowania starszego zaszyfrowanego stanu. Oba kroki nie powodują przerwania działania; błędy są rejestrowane, a uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola jest całkowicie pomijana.
  </Accordion>
  <Accordion title="8c. Parowanie urządzeń i rozbieżności uwierzytelniania">
    Doctor sprawdza stan parowania urządzeń w ramach standardowej kontroli kondycji i zgłasza:

    - oczekujące żądania pierwszego parowania
    - oczekujące rozszerzenia roli lub zakresu dla już sparowanych urządzeń
    - naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal jest zgodny, ale tożsamość urządzenia nie odpowiada już zatwierdzonemu rekordowi
    - sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
    - sparowane tokeny, których zakresy wykraczają poza zatwierdzoną wartość bazową parowania
    - lokalne wpisy pamięci podręcznej tokenów urządzenia dla bieżącej maszyny, które pochodzą sprzed rotacji tokenu po stronie Gateway lub zawierają nieaktualne metadane zakresu

    Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Wyświetla dokładne następne kroki:

    - sprawdzenie oczekujących żądań za pomocą `openclaw devices list`
    - zatwierdzenie dokładnego żądania za pomocą `openclaw devices approve <requestId>`
    - rotacja nowego tokenu za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
    - usunięcie i ponowne zatwierdzenie nieaktualnego rekordu za pomocą `openclaw devices remove <deviceId>`

    Pozwala to odróżnić pierwsze parowanie od oczekujących rozszerzeń roli/zakresu oraz od rozbieżności nieaktualnego tokenu lub tożsamości urządzenia, eliminując częsty problem polegający na tym, że urządzenie jest „już sparowane, ale nadal pojawia się wymóg parowania”.

  </Accordion>
  <Accordion title="9. Ostrzeżenia dotyczące bezpieczeństwa">
    Doctor wyświetla uwagę dotyczącą bezpieczeństwa tylko wtedy, gdy znajdzie ostrzeżenie, na przykład dostawcę dostępnym dla wiadomości prywatnych bez listy dozwolonych albo niebezpiecznie skonfigurowaną politykę. Pełny wykaz zabezpieczeń można uzyskać za pomocą `openclaw security audit`.
  </Accordion>
  <Accordion title="10. Pozostawanie systemd (Linux)">
    W przypadku działania jako usługa użytkownika systemd doctor zapewnia włączenie pozostawania, aby Gateway działał nadal po wylogowaniu.
  </Accordion>
  <Accordion title="11. Stan przestrzeni roboczej (Skills, Pluginy i TaskFlows)">
    Doctor wyświetla problemy i działania dla domyślnego agenta, a nie wykaz prawidłowego stanu:

    - **Skills**: wyświetla nazwy dozwolonych, ale niedostępnych umiejętności; szczegóły wymagań i pełne liczby można uzyskać za pomocą `openclaw skills check`.
    - **Pluginy**: zgłasza tylko identyfikatory Pluginów z błędami; wykaz załadowanych, zaimportowanych, wyłączonych i dołączonych Pluginów można uzyskać za pomocą `openclaw plugins list`.
    - **Ostrzeżenia dotyczące zgodności Pluginów**: wskazuje Pluginy mające problemy ze zgodnością z bieżącym środowiskiem uruchomieniowym.
    - **Diagnostyka Pluginów**: przedstawia wszystkie ostrzeżenia i błędy emitowane przez rejestr Pluginów podczas ładowania.
    - **Odzyskiwanie TaskFlow**: wskazuje podejrzane zarządzane przepływy TaskFlow, które wymagają ręcznego sprawdzenia lub anulowania.
    - **CLI Claude**: zgłasza tylko problemy z plikiem wykonywalnym, uwierzytelnianiem, profilem, przestrzenią roboczą lub katalogiem projektu; szczegóły prawidłowych kontroli są pomijane.

  </Accordion>
  <Accordion title="11b. Rozmiar pliku inicjalizacyjnego">
    Doctor sprawdza, czy pliki inicjalizacyjne przestrzeni roboczej (na przykład `AGENTS.md`, `CLAUDE.md` lub inne wstrzykiwane pliki kontekstu) zbliżają się do skonfigurowanego budżetu znaków lub go przekraczają. Dla każdego pliku zgłasza liczbę znaków pierwotnych i wstrzykniętych, procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych znaków jako część całkowitego budżetu. Gdy pliki są obcięte lub zbliżają się do limitu, doctor wyświetla wskazówki dotyczące dostrajania `agents.defaults.bootstrapMaxChars` i `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Uzupełnianie powłoki">
    Doctor sprawdza, czy dla bieżącej powłoki (zsh, bash, fish lub PowerShell) zainstalowano uzupełnianie klawiszem Tab:

    - Jeśli profil powłoki używa wolnego wzorca dynamicznego uzupełniania (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego wariantu z plikiem pamięci podręcznej.
    - Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku pamięci podręcznej, doctor automatycznie ponownie generuje pamięć podręczną.
    - Jeśli uzupełnianie nie jest w ogóle skonfigurowane, doctor proponuje jego instalację (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

    Aby ręcznie ponownie wygenerować pamięć podręczną, należy uruchomić `openclaw completion --write-state`.

  </Accordion>
  <Accordion title="11d. Czyszczenie nieaktualnych Pluginów kanałów">
    Gdy `openclaw doctor --fix` usuwa brakujący Plugin kanału, usuwa również osieroconą konfigurację tego kanału, która odwoływała się do Pluginu: wpisy `channels.<id>`, cele Heartbeat wskazujące ten kanał oraz nadpisania `agents.*.models["<channel>/*"]`. Zapobiega to pętlom uruchamiania Gateway, w których środowisko uruchomieniowe kanału już nie istnieje, ale konfiguracja nadal wymaga od Gateway powiązania z nim.
  </Accordion>
  <Accordion title="12. Kontrole uwierzytelniania Gateway (token lokalny)">
    Doctor sprawdza gotowość uwierzytelniania lokalnego Gateway za pomocą tokenu.

    - Jeśli tryb tokenu wymaga tokenu, ale nie istnieje żadne jego źródło, doctor proponuje jego wygenerowanie.
    - Jeśli `gateway.auth.token` jest zarządzane przez SecretRef, ale niedostępne, doctor ostrzega i nie zastępuje go tekstem jawnym.
    - `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano żadnego tokenu SecretRef.

  </Accordion>
  <Accordion title="12b. Naprawy tylko do odczytu uwzględniające SecretRef">
    Niektóre procedury naprawcze muszą sprawdzać skonfigurowane dane uwierzytelniające bez osłabiania mechanizmu szybkiego przerywania działania środowiska uruchomieniowego.

    - `openclaw doctor --fix` używa tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny statusu przy ukierunkowanych naprawach konfiguracji.
    - Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych danych uwierzytelniających bota, gdy są dostępne.
    - Jeśli token bota Telegram jest skonfigurowany za pośrednictwem SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że dane uwierzytelniające są skonfigurowane, lecz niedostępne, i pomija automatyczne rozwiązywanie zamiast ulegać awarii lub błędnie zgłaszać brak tokenu.

  </Accordion>
  <Accordion title="13. Kontrola kondycji Gateway + ponowne uruchomienie">
    Doctor przeprowadza kontrolę kondycji i proponuje ponowne uruchomienie Gateway, gdy wykryje nieprawidłowe działanie.
  </Accordion>
  <Accordion title="13b. Gotowość wyszukiwania w pamięci">
    Doctor sprawdza, czy skonfigurowany dostawca osadzania dla wyszukiwania w pamięci jest gotowy dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

    - **Backend QMD**: sprawdza, czy plik binarny `qmd` jest dostępny i możliwy do uruchomienia. Jeśli nie, wyświetla wskazówki dotyczące naprawy, w tym `npm install -g @tobilu/qmd` (lub odpowiednik dla Bun), oraz opcję ręcznego podania ścieżki do pliku binarnego.
    - **Jawnie wskazany dostawca lokalny**: sprawdza obecność lokalnego pliku modelu lub rozpoznawanego adresu URL modelu zdalnego albo możliwego do pobrania. Jeśli go brakuje, sugeruje przełączenie na dostawcę zdalnego.
    - **Jawnie wskazany dostawca zdalny** (`openai`, `voyage` itd.): sprawdza, czy klucz API znajduje się w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wyświetla praktyczne wskazówki dotyczące naprawy.
    - **Starszy automatyczny dostawca**: traktuje `memorySearch.provider: "auto"` jako OpenAI, sprawdza gotowość OpenAI, a `doctor --fix` przepisuje go na `provider: "openai"`.

    Gdy dostępny jest wynik kontroli Gateway z pamięci podręcznej (Gateway był sprawny w chwili kontroli), doctor porównuje ten wynik z konfiguracją widoczną w CLI i odnotowuje wszelkie rozbieżności. Doctor nie uruchamia nowego testu osadzania w domyślnej ścieżce; aby przeprowadzić kontrolę dostawcy na żywo, należy użyć polecenia szczegółowego statusu pamięci.

    Użyj `openclaw memory status --deep`, aby zweryfikować gotowość osadzania w czasie działania.

  </Accordion>
  <Accordion title="14. Ostrzeżenia o stanie kanałów">
    Jeśli Gateway działa prawidłowo, doctor przeprowadza kontrolę stanu kanałów i zgłasza ostrzeżenia wraz z sugerowanymi rozwiązaniami.
  </Accordion>
  <Accordion title="15. Audyt i naprawa konfiguracji nadzorcy">
    Doctor sprawdza zainstalowaną konfigurację nadzorcy (launchd/systemd/schtasks) pod kątem brakujących lub nieaktualnych wartości domyślnych (na przykład zależności systemd od network-online i opóźnienia ponownego uruchomienia). Po wykryciu niezgodności zaleca aktualizację i może przepisać plik usługi lub zadanie zgodnie z bieżącymi wartościami domyślnymi.

    Uwagi:

    - `openclaw doctor` wyświetla monit przed przepisaniem konfiguracji nadzorcy.
    - `openclaw doctor --yes` akceptuje domyślne monity o naprawę.
    - `openclaw doctor --fix` stosuje zalecane poprawki bez monitów (`--repair` jest aliasem).
    - `openclaw doctor --fix --force` zastępuje niestandardowe konfiguracje nadzorcy.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` utrzymuje działanie doctor w trybie tylko do odczytu w zakresie cyklu życia usługi Gateway. Nadal zgłasza kondycję usługi i wykonuje naprawy niezwiązane z usługą, ale pomija instalację, uruchamianie, ponowne uruchamianie i inicjalizację usługi, przepisywanie konfiguracji nadzorcy oraz usuwanie starszych usług, ponieważ tym cyklem życia zarządza zewnętrzny nadzorca.
    - W systemie Linux doctor nie przepisuje metadanych polecenia ani punktu wejścia, gdy odpowiadająca im jednostka systemd Gateway jest aktywna. Podczas skanowania w poszukiwaniu zduplikowanych usług ignoruje również nieaktywne, dodatkowe jednostki podobne do Gateway, które nie są starszymi jednostkami, dzięki czemu towarzyszące pliki usług nie generują zbędnych komunikatów o czyszczeniu.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja lub naprawa usługi przez doctor sprawdza poprawność SecretRef, ale nie zapisuje rozwiązanych wartości tokenu w postaci zwykłego tekstu w metadanych środowiska usługi nadzorcy.
    - Doctor wykrywa zarządzane wartości środowiska usługi oparte na `.env`/SecretRef, które starsze instalacje LaunchAgent, systemd lub Zaplanowanego zadania systemu Windows osadzały bezpośrednio, i przepisuje metadane usługi tak, aby wartości te były ładowane ze źródła środowiska uruchomieniowego zamiast z definicji nadzorcy.
    - Doctor wykrywa, gdy polecenie usługi nadal wymusza stary `--port` po zmianie `gateway.port`, i przepisuje metadane usługi na bieżący port.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu pozostaje nierozwiązany, doctor blokuje ścieżkę instalacji lub naprawy i wyświetla praktyczne wskazówki.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, doctor blokuje instalację lub naprawę do czasu jawnego ustawienia trybu.
    - W przypadku jednostek systemd użytkownika w systemie Linux kontrole rozbieżności tokenu wykonywane przez doctor uwzględniają zarówno źródła `Environment=`, jak i `EnvironmentFile=` podczas porównywania metadanych uwierzytelniania usługi.
    - Naprawy usług wykonywane przez doctor odmawiają przepisania, zatrzymania lub ponownego uruchomienia usługi Gateway ze starszego pliku binarnego OpenClaw, gdy konfiguracja została ostatnio zapisana przez nowszą wersję. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Zawsze można wymusić pełne przepisanie za pomocą `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostyka środowiska uruchomieniowego i portu Gateway">
    Doctor sprawdza środowisko uruchomieniowe usługi (PID, stan ostatniego zakończenia) i ostrzega, gdy usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza również kolizje na porcie Gateway (domyślnie `18789`) i zgłasza prawdopodobne przyczyny (Gateway już działa, tunel SSH).
  </Accordion>
  <Accordion title="17. Dobre praktyki dotyczące środowiska uruchomieniowego Gateway">
    Doctor ostrzega, gdy usługa Gateway działa w środowisku Bun lub przy użyciu ścieżki Node zarządzanej przez menedżera wersji (`nvm`, `fnm`, `volta`, `asdf` itd.). Bun nie może otworzyć magazynu stanu `node:sqlite` OpenClaw, dlatego naprawy migrują starsze usługi Bun do Node. Ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie ładuje pliku inicjalizacyjnego powłoki. Doctor proponuje migrację do systemowej instalacji Node, jeśli jest dostępna (Homebrew/apt/choco).

    Nowo zainstalowane lub naprawione agenty LaunchAgent systemu macOS używają kanonicznej systemowej zmiennej PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) zamiast kopiowania zmiennej PATH z interaktywnej powłoki, dzięki czemu systemowe pliki binarne zarządzane przez Homebrew pozostają dostępne, a katalogi Volta, asdf, fnm, pnpm i innych menedżerów wersji nie zmieniają sposobu rozpoznawania Node przez procesy potomne. Usługi systemu Linux nadal zachowują jawne katalogi główne środowiska (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) oraz stabilne katalogi plików binarnych użytkownika, ale domyślne katalogi awaryjne menedżerów wersji są zapisywane w zmiennej PATH usługi tylko wtedy, gdy istnieją na dysku.

  </Accordion>
  <Accordion title="18. Zapis konfiguracji i metadane kreatora">
    Doctor utrwala wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować uruchomienie doctor.
  </Accordion>
  <Accordion title="19. Wskazówki dotyczące przestrzeni roboczej (kopia zapasowa + system pamięci)">
    Doctor sugeruje utworzenie systemu pamięci przestrzeni roboczej, jeśli go brakuje, oraz wyświetla wskazówkę dotyczącą kopii zapasowej, jeśli przestrzeń robocza nie znajduje się jeszcze pod kontrolą git.

    Pełny przewodnik dotyczący struktury przestrzeni roboczej i kopii zapasowej w git (zalecane prywatne repozytorium GitHub lub GitLab) znajduje się w sekcji [/concepts/agent-workspace](/pl/concepts/agent-workspace).

  </Accordion>
</AccordionGroup>

## Powiązane

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
