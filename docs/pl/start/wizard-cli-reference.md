---
read_when:
    - Potrzebujesz szczegółowego opisu działania openclaw onboard
    - Diagnozujesz wyniki wdrażania lub integrujesz klientów wdrażania
sidebarTitle: CLI reference
summary: Kompletna dokumentacja referencyjna przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i mechanizmów wewnętrznych
title: Dokumentacja referencyjna konfiguracji CLI
x-i18n:
    generated_at: "2026-04-30T10:19:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona jest pełną dokumentacją referencyjną dla `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki bootstrap
- Ustawienia Gateway (port, powiązanie, uwierzytelnianie, Tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles i inne dołączone pluginy kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd albo natywne Zadanie Harmonogramu zadań Windows z awaryjnym wpisem w folderze Autostart)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway w innym miejscu.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Existing config detection">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Zachowaj, Modyfikuj albo Resetuj.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Resetuj (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuowaniem.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model and auth">
    - Pełna macierz opcji znajduje się w sekcji [Opcje uwierzytelniania i modeli](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (można skonfigurować).
    - Zasiewa pliki obszaru roboczego potrzebne do pierwszego rytuału bootstrap.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, powiązanie, tryb uwierzytelniania i ekspozycję Tailscale.
    - Zalecane: pozostaw włączone uwierzytelnianie tokenem nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token w postaci jawnej** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła interaktywna konfiguracja obsługuje także zapis w postaci jawnej albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboarding.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu procesowi lokalnemu.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca Webhook
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + Webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; w trybie headless użyj niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby Gateway pozostawał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Zadanie Harmonogramu
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi awaryjnie na wpis logowania w folderze Autostart użytkownika i natychmiast uruchamia Gateway.
      - Zadania Harmonogramu pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór środowiska uruchomieniowego: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Health check">
    - Uruchamia Gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje aktywną sondę kondycji Gateway do wyniku statusu, w tym sondy kanałów, gdy są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Finish">
    - Podsumowanie i kolejne kroki, w tym opcje aplikacji iOS, Android i macOS.

  </Step>
</Steps>

<Note>
Jeśli GUI nie zostanie wykryte, kreator wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; awaryjnie używa `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway w innym miejscu.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego Gateway (`ws://...`)
- Token, jeśli wymagane jest uwierzytelnianie zdalnego Gateway (zalecane)

<Note>
- Jeśli Gateway jest dostępny tylko przez loopback, użyj tunelowania SSH albo tailnetu.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Przepływ w przeglądarce; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="OpenAI API key">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje dane uwierzytelniające w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, ma postać `openai/*` albo `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    Zapisuje klucz za ciebie.
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
    Konfiguracja jest zapisywana automatycznie dla standardowego StepFun albo Step Plan na punktach końcowych w Chinach lub globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    Najpierw prosi o wybór `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście proszą o bazowy URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu chmurowego.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    Działa z punktami końcowymi zgodnymi z OpenAI i Anthropic.

    Interaktywny onboarding obsługuje te same wybory zapisu klucza API co inne przepływy kluczy API dostawców:
    - **Wklej klucz API teraz** (postać jawna)
    - **Użyj odniesienia do sekretu** (odniesienie env albo skonfigurowane odniesienie dostawcy, z walidacją wstępną)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; awaryjnie używa `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|anthropic>` (opcjonalne; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalne; nadpisuje wywnioskowaną możliwość wejścia modelu)

  </Accordion>
  <Accordion title="Skip">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz domyślny model z wykrytych opcji albo ręcznie wpisz dostawcę i model.
- Onboarding niestandardowego dostawcy wnioskuje obsługę obrazów dla typowych identyfikatorów modeli i pyta tylko wtedy, gdy nazwa modelu jest nieznana.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  dopasowuje także ich warianty planów kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli ten filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast nie pokazywać żadnych modeli.
- Kreator wykonuje sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

Ścieżki danych uwierzytelniających i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania danych uwierzytelniających:

- Domyślne zachowanie onboardingu utrwala klucze API jako wartości w postaci jawnej w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb odniesień zamiast przechowywania kluczy w postaci jawnej.
  W konfiguracji interaktywnej możesz wybrać:
  - odniesienie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowane odniesienie dostawcy (`file` albo `exec`) z aliasem dostawcy + id
- Interaktywny tryb odniesień uruchamia szybką walidację wstępną przed zapisaniem.
  - Odniesienia env: waliduje nazwę zmiennej + niepustą wartość w bieżącym środowisku onboardingu.
  - Odniesienia dostawcy: waliduje konfigurację dostawcy i rozwiązuje żądane id.
  - Jeśli walidacja wstępna się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` jest obsługiwany tylko przez env.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu.
  - Flagi kluczy inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie onboarding szybko kończy się błędem.
  - Dla niestandardowych dostawców nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding szybko kończy się błędem.
- Dane uwierzytelniające Gateway obsługują wybory postaci jawnej i SecretRef w konfiguracji interaktywnej:
  - Tryb tokena: **Wygeneruj/zapisz token w postaci jawnej** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: postać jawna albo SecretRef.
- Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje w postaci jawnej nadal działają bez zmian.

<Note>
Wskazówka dla trybu headless i serwera: ukończ OAuth na komputerze z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Wyniki i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalne wdrażanie domyślnie używa `"coding"`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, tailscale)
- `session.dmScope` (lokalne wdrażanie domyślnie ustawia to na `per-channel-peer`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane na identyfikatory, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Ręczna konfiguracja nadal może później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako plugins. Po wybraniu podczas konfiguracji kreator
monituje o zainstalowanie plugin (npm lub ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownej implementacji logiki wdrażania.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Kompilacje natywne są używane, gdy są dostępne
- Windows używa WSL2 i stosuje linuksowy przepływ signal-cli wewnątrz WSL

## Powiązane dokumenty

- Centrum wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
