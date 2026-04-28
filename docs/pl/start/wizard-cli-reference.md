---
read_when:
    - Potrzebujesz szczegółowego opisu działania `openclaw onboard`
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna dokumentacja przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i elementów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-04-26T11:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ta strona jest pełną dokumentacją `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboardingu (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi Cię przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację workspace i pliki bootstrap
- Ustawienia Gateway (port, bind, auth, tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles i inne dołączone Pluginy kanałów)
- Instalację daemona (LaunchAgent, jednostka użytkownika systemd lub natywne zadanie Scheduled Task w Windows z mechanizmem rezerwowym w folderze Startup)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway uruchomionym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Keep, Modify albo Reset.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Reset (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także workspace)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w [Opcjach uwierzytelniania i modeli](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (można skonfigurować).
    - Dodaje pliki workspace potrzebne do bootstrap ritual przy pierwszym uruchomieniu.
    - Układ workspace: [Workspace agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb auth i ekspozycję Tailscale.
    - Zalecane: pozostaw uwierzytelnianie tokenem włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token w postaci jawnej** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła interaktywna konfiguracja także obsługuje przechowywanie jawne lub SecretRef.
    - Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboardingu.
      - Nie można jej łączyć z `--gateway-token`.
    - Wyłącz auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania inne niż loopback nadal wymagają auth.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + base URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB
    - Bezpieczeństwo DM: domyślnie używane jest pairing. Pierwsza wiadomość DM wysyła kod; zatwierdź go przez
      `openclaw pairing approve <channel> <code>` albo użyj allowlist.
  </Step>
  <Step title="Instalacja daemona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby Gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Scheduled Task
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi na element logowania w folderze Startup dla danego użytkownika i natychmiast uruchamia Gateway.
      - Scheduled Tasks pozostają preferowane, ponieważ zapewniają lepszy status supervisor.
    - Wybór środowiska uruchomieniowego: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Kontrola kondycji">
    - Uruchamia Gateway (jeśli to potrzebne) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje aktywne sprawdzanie kondycji Gateway do danych wyjściowych statusu, łącznie z kontrolami kanałów, gdy są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje dla aplikacji iOS, Android i macOS.

  </Step>
</Steps>

<Note>
Jeśli nie zostanie wykryty żaden interfejs GUI, kreator wypisuje instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; mechanizmem rezerwowym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway uruchomionym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- Zdalny adres URL Gateway (`ws://...`)
- Token, jeśli zdalny Gateway wymaga auth (zalecane)

<Note>
- Jeśli Gateway działa tylko na loopback, użyj tunelowania SSH albo tailnet.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez daemona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ przeglądarkowy; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (pairing urządzenia)">
    Przepływ pairingu w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje poświadczenie w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, ma postać `openai/*` albo `openai-codex/*`.

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
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o identyfikator konta, identyfikator Gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M2.7`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na punktach końcowych China lub globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje też `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodne z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud i lokalne modele otwarte)">
    Najpierw prosi o `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście pytają o base URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza również, czy ten host Ollama jest zalogowany do dostępu cloud.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Dostawca niestandardowy">
    Działa z punktami końcowymi zgodnymi z OpenAI i Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania klucza API co inne przepływy z kluczem API dostawcy:
    - **Wklej teraz klucz API** (jawnie)
    - **Użyj odwołania do sekretu** (odwołanie env lub skonfigurowanego dostawcy, z walidacją przed zapisem)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalnie; używa wartości z `CUSTOM_API_KEY`, jeśli nie podano)
    - `--custom-provider-id` (opcjonalnie)
    - `--custom-compatibility <openai|anthropic>` (opcjonalnie; domyślnie `openai`)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia auth nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modeli:

- Wybierz model domyślny z wykrytych opcji albo ręcznie wprowadź dostawcę i model.
- Gdy onboarding zaczyna się od wyboru auth dostawcy, selektor modelu automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus to samo preferowanie
  obejmuje także ich warianty planów kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast pokazywać brak modeli.
- Kreator uruchamia kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje auth.

Ścieżki poświadczeń i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu zapisuje klucze API jako jawne wartości w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb odwołań zamiast przechowywania kluczy w postaci jawnej.
  W konfiguracji interaktywnej możesz wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - odwołanie do skonfigurowanego dostawcy (`file` lub `exec`) z aliasem dostawcy + identyfikatorem
- Interaktywny tryb odwołań wykonuje szybką walidację przed zapisem.
  - Odwołania env: sprawdza nazwę zmiennej i niepustą wartość w bieżącym środowisku onboardingu.
  - Odwołania dostawcy: sprawdza konfigurację dostawcy i rozwiązuje żądany identyfikator.
  - Jeśli walidacja przed zapisem się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` działa tylko w oparciu o env.
  - Ustaw zmienną env dostawcy w środowisku procesu onboardingu.
  - Wbudowane flagi kluczy (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej env; w przeciwnym razie onboarding kończy się szybkim błędem.
  - Dla dostawców niestandardowych nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku dostawcy niestandardowego `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding kończy się szybkim błędem.
- Poświadczenia auth Gateway obsługują w konfiguracji interaktywnej opcje jawne i SecretRef:
  - Tryb tokena: **Wygeneruj/zapisz token w postaci jawnej** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: jawnie albo SecretRef.
- Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje jawne nadal działają bez zmian.

<Note>
Wskazówka dla trybu headless i serwerów: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą ścieżkę
`$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
to tylko starsze źródło importu.
</Note>

## Dane wyjściowe i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, bind, auth, tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia tu `per-channel-peer`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas promptów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Ręczna konfiguracja nadal może później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako Pluginy. Gdy zostaną wybrane podczas konfiguracji, kreator
prosi o zainstalowanie Pluginu (npm albo ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownego implementowania logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Zapisuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Jeśli są dostępne, używane są kompilacje natywne
- Windows używa WSL2 i stosuje przepływ Linux signal-cli wewnątrz WSL

## Powiązana dokumentacja

- Hub onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
