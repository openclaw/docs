---
read_when:
    - Potrzebujesz szczegółowego opisu zachowania dla openclaw onboard
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna dokumentacja przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, wyników i elementów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-07-04T06:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona jest pełnym opisem referencyjnym `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, CLI Anthropic Claude lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki bootstrap
- Ustawienia Gateway (port, bind, uwierzytelnianie, Tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage i inne dołączone pluginy kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd albo natywne Zadanie Harmonogramu zadań Windows z mechanizmem awaryjnym folderu Autostart)
- Kontrolę stanu
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway w innym miejscu.
Nie instaluje ani nie modyfikuje niczego na hoście zdalnym.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Zachowaj, Zmodyfikuj albo Zresetuj.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Zresetuj (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera przestarzałe klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w [Opcje uwierzytelniania i modelu](#auth-and-model-options).

  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Dodaje początkowe pliki obszaru roboczego potrzebne do rytuału bootstrap przy pierwszym uruchomieniu.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb uwierzytelniania i ekspozycję Tailscale.
    - Zalecane: pozostaw uwierzytelnianie tokenem włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token w postaci jawnej** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła interaktywna konfiguracja obsługuje także zapis w postaci jawnej albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef dla tokenu: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindy inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorcy webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Messages; użyj wrappera SSH, gdy Gateway działa poza Maciem
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj niestandardowego LaunchDaemon (niedołączony).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby Gateway pozostawał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Zadanie Harmonogramu
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi awaryjnie na element logowania w folderze Autostart dla użytkownika i natychmiast uruchamia Gateway.
      - Zadania Harmonogramu pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór runtime: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje do wyniku statusu aktywną sondę stanu Gateway, w tym sondy kanałów, gdy są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności dla zaufanych dołączonych Skills, gdy wymagany
      instalator jest dostępny.
    - Pomija niedostępne instalatory Homebrew, uv i Go, a następnie grupuje dotknięte
      Skills z instrukcjami ręcznej konfiguracji. Uruchom `openclaw doctor` po zainstalowaniu
      brakujących wymagań wstępnych.

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i następne kroki, w tym opcje aplikacji iOS, Android i macOS.

  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; mechanizmem awaryjnym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway w innym miejscu.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na hoście zdalnym.
</Info>

Co ustawiasz:

- URL zdalnego Gateway (`ws://...`)
- Token, jeśli zdalny Gateway wymaga uwierzytelniania (zalecane)

<Note>
- Jeśli Gateway działa tylko na loopback, użyj tunelowania SSH albo sieci tailnet.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opcje uwierzytelniania i modelu

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ w przeglądarce; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez runtime Codex, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez runtime Codex, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje poświadczenie w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, ma postać `openai/*` albo jest przestarzałym odwołaniem do modelu Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Logowanie w przeglądarce dla kwalifikujących się kont SuperGrok lub X Premium. To jest
    zalecana ścieżka xAI dla większości użytkowników. OpenClaw zapisuje wynikowy profil
    uwierzytelniania dla modeli Grok, Grok `web_search`, `x_search` i `code_execution`.
  </Accordion>
  <Accordion title="Kod urządzenia xAI (Grok)">
    Przyjazne pracy zdalnej logowanie w przeglądarce z krótkim kodem zamiast callbacka
    localhost. Użyj tego z hostów SSH, Docker albo VPS.
  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli. Użyj tego,
    gdy chcesz użyć klucza API xAI Console zamiast OAuth subskrypcji.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Zapisuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Prosi o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o ID konta, ID Gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M3`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla standardowego StepFun albo Step Plan na endpointach chińskich lub globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (chmura i lokalne modele otwarte)">
    Najpierw prosi o wybór `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście proszą o bazowy URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu chmurowego.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Dostawca niestandardowy">
    Działa z endpointami zgodnymi z OpenAI i zgodnymi z Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania klucza API co inne przepływy kluczy API dostawców:
    - **Wklej teraz klucz API** (tekst jawny)
    - **Użyj odwołania do sekretu** (odwołanie env albo skonfigurowane odwołanie dostawcy, z walidacją preflight)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; awaryjnie używa `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcjonalne; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalne; nadpisuje wywnioskowaną obsługę wejścia modelu)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz domyślny model z wykrytych opcji albo ręcznie wprowadź dostawcę i model.
- Onboarding dostawcy niestandardowego wnioskuje obsługę obrazów dla popularnych ID modeli i pyta tylko wtedy, gdy nazwa modelu jest nieznana.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  pasuje także do ich wariantów planów kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor przechodzi awaryjnie do
  pełnego katalogu zamiast pokazywać brak modeli.
- Kreator uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

Ścieżki poświadczeń i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import przestarzałego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu utrwala klucze API jako wartości tekstowe w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb referencji zamiast przechowywania klucza jako tekstu jawnego.
  W konfiguracji interaktywnej możesz wybrać:
  - referencję do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowaną referencję dostawcy (`file` lub `exec`) z aliasem dostawcy + identyfikatorem
- Interaktywny tryb referencji uruchamia szybką walidację wstępną przed zapisaniem.
  - Referencje env: sprawdzają nazwę zmiennej + niepustą wartość w bieżącym środowisku onboardingu.
  - Referencje dostawcy: sprawdzają konfigurację dostawcy i rozwiązują żądany identyfikator.
  - Jeśli walidacja wstępna się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` korzysta wyłącznie ze zmiennych środowiskowych.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu.
  - Flagi klucza inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie onboarding szybko kończy się błędem.
  - W przypadku niestandardowych dostawców nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding szybko kończy się błędem.
- Dane uwierzytelniające Gateway obsługują wybór tekstu jawnego i SecretRef w konfiguracji interaktywnej:
  - Tryb tokena: **Wygeneruj/zapisz token jako tekst jawny** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: tekst jawny albo SecretRef.
- Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z tekstem jawnym nadal działają bez zmian.

<Note>
Wskazówka dla środowisk headless i serwerów: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo pasującą
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Wyniki i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie używa `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia to na `per-channel-peer`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane na identyfikatory, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Ręczna konfiguracja nadal może później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako pluginy. Po wybraniu ich podczas konfiguracji kreator
prosi o zainstalowanie pluginu (npm albo ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Kompilacje natywne są używane, gdy są dostępne
- Windows używa WSL2 i wykonuje linuksowy przepływ signal-cli wewnątrz WSL

## Powiązane dokumenty

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Odniesienie polecenia: [`openclaw onboard`](/pl/cli/onboard)
