---
read_when:
    - Potrzebujesz szczegółowego opisu działania `openclaw onboard`
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna referencja przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modeli, wyników i elementów wewnętrznych
title: Referencja konfiguracji CLI
x-i18n:
    generated_at: "2026-04-05T14:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referencja konfiguracji CLI

Ta strona zawiera pełną referencję dla `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) przeprowadza Cię przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki bootstrap
- Ustawienia gateway (`port`, `bind`, `auth`, `tailscale`)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles i inne dołączone wtyczki kanałów)
- Instalację daemon (`LaunchAgent`, jednostka użytkownika `systemd` lub natywne zadanie Windows Scheduled Task z awaryjnym fallbackiem do folderu Startup)
- Kontrolę stanu zdrowia
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z gateway uruchomionym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na hoście zdalnym.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Zachowaj, Zmodyfikuj lub Zresetuj.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Resetuj (lub przekażesz `--reset`).
    - `--reset` w CLI domyślnie obejmuje `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także obszar roboczy)
  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w sekcji [Opcje uwierzytelniania i modeli](#auth-and-model-options).
  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy pliki obszaru roboczego potrzebne do bootstrapowego rytuału pierwszego uruchomienia.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb auth i ekspozycję przez Tailscale.
    - Zalecenie: pozostaw auth oparte na tokenie włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena konfiguracja interaktywna oferuje:
      - **Generowanie/przechowywanie tokena w postaci jawnej** (domyślnie)
      - **Użycie SecretRef** (opcjonalnie)
    - W trybie hasła konfiguracja interaktywna również obsługuje przechowywanie w postaci jawnej lub jako SecretRef.
    - Ścieżka SecretRef dla tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłączaj auth tylko wtedy, gdy w pełni ufasz każdemu procesowi lokalnemu.
    - Powiązania inne niż loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie kodem QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + `baseUrl`
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` lub użyj allowlist.
  </Step>
  <Step title="Instalacja daemon">
    - macOS: `LaunchAgent`
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj własnego `LaunchDaemon` (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika `systemd`
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby gateway pozostawał uruchomiony po wylogowaniu.
      - Może poprosić o `sudo` (zapis do `/var/lib/systemd/linger`); najpierw próbuje bez `sudo`.
    - Natywny Windows: najpierw `Scheduled Task`
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi awaryjnie do elementu logowania per-user w folderze Startup i natychmiast uruchamia gateway.
      - `Scheduled Task` pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór runtime: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.
  </Step>
  <Step title="Kontrola stanu zdrowia">
    - Uruchamia gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje aktywną sondę stanu zdrowia gateway do danych statusu, w tym sondy kanałów tam, gdzie są obsługiwane.
  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: npm, pnpm lub bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje dla aplikacji iOS, Android i macOS.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wypisuje instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; fallback to `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z gateway uruchomionym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na hoście zdalnym.
</Info>

Co ustawiasz:

- URL zdalnego gateway (`ws://...`)
- Token, jeśli zdalny gateway wymaga auth (zalecane)

<Note>
- Jeśli gateway jest dostępny tylko przez loopback, użyj tunelowania SSH lub sieci tailnet.
- Wskazówki dotyczące wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, lub prosi o klucz, a następnie zapisuje go do użycia przez daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Ponownie wykorzystuje lokalne logowanie Claude CLI na hoście gateway i przełącza wybór modelu
    na kanoniczną referencję `claude-cli/claude-*`.

    To dostępna lokalna ścieżka fallbacku w `openclaw onboard` i
    `openclaw configure`. W środowisku produkcyjnym preferuj klucz API Anthropic.

    - macOS: sprawdza wpis Keychain „Claude Code-credentials”
    - Linux i Windows: ponownie używa `~/.claude/.credentials.json`, jeśli istnieje

    Na macOS wybierz „Always Allow”, aby uruchomienia przez `launchd` nie były blokowane.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (ponowne użycie Codex CLI)">
    Jeśli istnieje `~/.codex/auth.json`, kreator może użyć go ponownie.
    Ponownie użyte poświadczenia Codex CLI pozostają zarządzane przez Codex CLI; po ich wygaśnięciu OpenClaw
    najpierw ponownie odczytuje to źródło i, gdy dostawca może je odświeżyć, zapisuje
    odświeżone poświadczenie z powrotem do pamięci Codex zamiast samodzielnie przejmować
    nad nim kontrolę.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ przeglądarkowy; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model nie jest ustawiony lub ma postać `openai/*`.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, lub prosi o klucz, a następnie zapisuje poświadczenie w profilach auth.

    Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` lub `openai-codex/*`.

  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Zapisuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Prosi o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o ID konta, ID gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Hostowana wartość domyślna to `MiniMax-M2.7`; konfiguracja przez klucz API używa
    `minimax/...`, a konfiguracja przez OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla StepFun standard lub Step Plan na endpointach China albo globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud i lokalne modele otwarte)">
    Prosi o `baseUrl` (domyślnie `http://127.0.0.1:11434`), a następnie oferuje tryb Cloud + Local lub Local.
    Wykrywa dostępne modele i sugeruje wartości domyślne.
    Więcej szczegółów: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Niestandardowy dostawca">
    Działa z endpointami zgodnymi z OpenAI i Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania klucza API co inne przepływy klucza API dostawcy:
    - **Wklej teraz klucz API** (tekst jawny)
    - **Użyj referencji do sekretu** (referencja środowiskowa lub skonfigurowana referencja dostawcy, z walidacją preflight)

    Flagi trybu nieinteraktywnego:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; fallback do `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|anthropic>` (opcjonalne; domyślnie `openai`)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia auth nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz model domyślny z wykrytych opcji albo wprowadź dostawcę i model ręcznie.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modelu automatycznie
  preferuje tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  dopasowuje również ich warianty planu kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli taki filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast pokazywać brak modeli.
- Kreator wykonuje kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje auth.

Ścieżki poświadczeń i profili:

- Profile auth (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu zapisuje klucze API jako wartości jawne w profilach auth.
- `--secret-input-mode ref` włącza tryb referencyjny zamiast przechowywania klucza jako tekst jawny.
  W konfiguracji interaktywnej możesz wybrać jedno z poniższych:
  - referencja do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowana referencja dostawcy (`file` lub `exec`) z aliasem dostawcy + ID
- Interaktywny tryb referencyjny wykonuje szybką walidację preflight przed zapisaniem.
  - Referencje środowiskowe: weryfikuje nazwę zmiennej + niepustą wartość w bieżącym środowisku onboardingu.
  - Referencje dostawcy: weryfikuje konfigurację dostawcy i rozwiązuje żądane ID.
  - Jeśli preflight się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` jest obsługiwany tylko dla środowiska.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu.
  - Flagi z kluczem inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie onboarding kończy się szybkim błędem.
  - Dla niestandardowych dostawców nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding kończy się szybkim błędem.
- Poświadczenia auth gateway obsługują w konfiguracji interaktywnej wybór tekstu jawnego i SecretRef:
  - Tryb tokena: **Generate/store plaintext token** (domyślnie) lub **Use SecretRef**.
  - Tryb hasła: tekst jawny lub SecretRef.
- Ścieżka SecretRef dla tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z tekstem jawnym nadal działają bez zmian.

<Note>
Wskazówka dla środowisk headless i serwerowych: zakończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` lub odpowiadającą mu ścieżkę
`$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
to tylko starsze źródło importu.
</Note>

## Wyniki i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, jeśli wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (`mode`, `bind`, `auth`, `tailscale`)
- `session.dmScope` (lokalny onboarding domyślnie ustawia `per-channel-peer`, jeśli wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlisty kanałów (Slack, Discord, Matrix, Microsoft Teams), jeśli włączysz je podczas promptów (nazwy są rozwiązywane do ID, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Ręczna konfiguracja może nadal później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako wtyczki. Po wybraniu ich podczas konfiguracji kreator
prosi o instalację wtyczki (npm lub ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Buildy JVM wymagają Java 21
- Jeśli są dostępne, używane są buildy natywne
- Windows używa WSL2 i postępuje zgodnie z przepływem Linux `signal-cli` wewnątrz WSL

## Powiązane dokumenty

- Hub onboardingu: [Onboarding (CLI)](/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/cli/onboard)
