---
read_when:
    - Potrzebujesz szczegółowego opisu działania `openclaw onboard`
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna dokumentacja referencyjna przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i elementów wewnętrznych
title: Dokumentacja referencyjna konfiguracji CLI
x-i18n:
    generated_at: "2026-04-24T09:34:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ta strona jest pełną dokumentacją referencyjną dla `openclaw onboard`.
Krótki przewodnik znajdziesz tutaj: [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) przeprowadza Cię przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację workspace i pliki bootstrap
- Ustawienia gateway (port, bind, auth, Tailscale)
- Kanały i providery (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles oraz inne dołączone pluginy kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd lub natywne zadanie Harmonogramu zadań Windows z awaryjnym użyciem folderu Autostart)
- Kontrolę stanu
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z gateway uruchomionym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Keep, Modify lub Reset.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Reset (lub przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera przestarzałe klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także workspace)
  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w sekcji [Opcje uwierzytelniania i modeli](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (można zmienić).
    - Tworzy pliki workspace potrzebne do bootstrapu przy pierwszym uruchomieniu.
    - Układ workspace: [Workspace agenta](/pl/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb auth i ekspozycję przez Tailscale.
    - Zalecane: pozostaw auth tokenem włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token jawny** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła konfiguracja interaktywna również obsługuje zapis jawny lub SecretRef.
    - Ścieżka SecretRef dla tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindy inne niż loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie kodem QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` lub użyj list dozwolonych.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Harmonogram zadań
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przełącza się na element logowania per użytkownik w folderze Autostart i natychmiast uruchamia gateway.
      - Harmonogram zadań pozostaje preferowany, ponieważ zapewnia lepszy status nadzorcy.
    - Wybór runtime: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.
  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje sondę stanu działającego gateway do danych wyjściowych statusu, w tym sondy kanałów, jeśli są obsługiwane.
  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: npm, pnpm lub bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje aplikacji na iOS, Androida i macOS.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wypisze instrukcje przekierowania portów SSH dla interfejsu Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; ścieżką awaryjną jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z gateway uruchomionym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego gateway (`ws://...`)
- Token, jeśli zdalny gateway wymaga auth (zalecane)

<Note>
- Jeśli gateway jest dostępny tylko przez loopback, użyj tunelowania SSH lub tailnet.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ przeglądarkowy; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje dane uwierzytelniające w profilach auth.

    Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` lub `openai-codex/*`.

  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako providera modelu.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen lub Go.
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
    Prosi o ID konta, ID gateway oraz `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M2.7`; konfiguracja przez klucz API używa
    `minimax/...`, a konfiguracja przez OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla standardowego StepFun lub Step Plan na endpointach China albo globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud i lokalne modele open)">
    Najpierw prosi o wybór `Cloud + Local`, `Cloud only` lub `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście proszą o bazowy URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` dodatkowo sprawdza, czy ten host Ollama jest zalogowany do dostępu chmurowego.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Własny provider">
    Działa z endpointami zgodnymi z OpenAI i zgodnymi z Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania kluczy API co inne przepływy kluczy API providerów:
    - **Wklej teraz klucz API** (jawnie)
    - **Użyj odwołania do sekretu** (odwołanie do zmiennej środowiskowej lub skonfigurowanego providera, z walidacją wstępną)

    Flagi trybu nieinteraktywnego:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; wraca do `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|anthropic>` (opcjonalne; domyślnie `openai`)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia auth nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz model domyślny z wykrytych opcji albo wpisz ręcznie providera i model.
- Gdy onboarding zaczyna się od wyboru auth providera, selektor modeli automatycznie preferuje
  tego providera. W przypadku Volcengine i BytePlus to samo preferowanie
  obejmuje także ich warianty planów kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli taki filtr preferowanego providera byłby pusty, selektor wraca do
  pełnego katalogu zamiast nie pokazywać żadnych modeli.
- Kreator wykonuje kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje auth.

Ścieżki danych uwierzytelniających i profili:

- Profile auth (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania danych uwierzytelniających:

- Domyślne zachowanie onboardingu zapisuje klucze API jako jawne wartości w profilach auth.
- `--secret-input-mode ref` włącza tryb odwołań zamiast jawnego przechowywania kluczy.
  W konfiguracji interaktywnej możesz wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - odwołanie do skonfigurowanego providera (`file` lub `exec`) z aliasem providera + ID
- Interaktywny tryb odwołań wykonuje szybką walidację wstępną przed zapisaniem.
  - Odwołania env: sprawdza nazwę zmiennej i niepustą wartość w bieżącym środowisku onboardingu.
  - Odwołania providera: sprawdza konfigurację providera i rozwiązuje żądane ID.
  - Jeśli walidacja wstępna się nie powiedzie, onboarding pokaże błąd i pozwoli spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` działa tylko dla env.
  - Ustaw zmienną środowiskową providera w środowisku procesu onboardingu.
  - Flagi kluczy inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej env; w przeciwnym razie onboarding kończy się szybkim błędem.
  - Dla własnych providerów nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku własnego providera `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding kończy się szybkim błędem.
- Dane uwierzytelniające auth gateway obsługują wybór zapisu jawnego i SecretRef w konfiguracji interaktywnej:
  - Tryb tokenu: **Wygeneruj/zapisz token jawny** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: zapis jawny albo SecretRef.
- Ścieżka SecretRef dla tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje jawne nadal działają bez zmian.

<Note>
Wskazówka dla środowisk headless i serwerów: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Dane wyjściowe i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano MiniMax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia `per-channel-peer`, gdy wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas promptów (nazwy są rozwiązywane do ID, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Ręczna konfiguracja nadal może później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako Pluginy. Po wybraniu ich podczas konfiguracji kreator
prosi o zainstalowanie Pluginu (npm lub lokalna ścieżka) przed konfiguracją kanału.
</Note>

RPC kreatora gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownego implementowania logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni asset wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Jeśli są dostępne, używane są kompilacje natywne
- Windows używa WSL2 i wykonuje przepływ `signal-cli` dla Linux wewnątrz WSL

## Powiązane dokumenty

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
