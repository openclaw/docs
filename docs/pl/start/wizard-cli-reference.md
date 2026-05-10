---
read_when:
    - Potrzebujesz szczegółowego opisu działania polecenia openclaw onboard
    - Diagnozujesz wyniki wdrażania lub integrujesz klientów wdrażania
sidebarTitle: CLI reference
summary: Pełne odniesienie dotyczące przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i mechanizmów wewnętrznych
title: Dokumentacja referencyjna konfiguracji CLI
x-i18n:
    generated_at: "2026-05-10T19:55:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona jest pełną dokumentacją referencyjną dla `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) przeprowadza Cię przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, CLI Anthropic Claude lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki startowe
- Ustawienia Gateway (port, bind, uwierzytelnianie, tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage i inne dołączone Plugin kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd albo natywne Windows Scheduled Task z rezerwowym użyciem folderu Autostart)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z gatewayem w innym miejscu.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Zachowaj, Modyfikuj albo Resetuj.
    - Ponowne uruchomienie kreatora nie usuwa niczego, chyba że wyraźnie wybierzesz Resetuj (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w [Opcje uwierzytelniania i modeli](#auth-and-model-options).

  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (można skonfigurować).
    - Dodaje początkowe pliki obszaru roboczego potrzebne do rytuału bootstrap przy pierwszym uruchomieniu.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb uwierzytelniania i ekspozycję tailscale.
    - Zalecenie: pozostaw włączone uwierzytelnianie tokenem nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token w postaci jawnego tekstu** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła konfiguracja interaktywna również obsługuje przechowywanie w postaci jawnego tekstu albo SecretRef.
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
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Wiadomości; użyj opakowania SSH, gdy Gateway działa poza Makiem
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu bezgłowego użyj niestandardowego LaunchDaemon (niedołączony).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Scheduled Task
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi awaryjnie na element logowania w folderze Autostart użytkownika i natychmiast uruchamia gateway.
      - Scheduled Tasks pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór runtime: Node (zalecany; wymagany dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Kontrola kondycji">
    - Uruchamia gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje aktywną sondę kondycji gatewaya do wyjścia statusu, w tym sondy kanałów, gdy są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności (część używa Homebrew na macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje aplikacji iOS, Android i macOS.

  </Step>
</Steps>

<Note>
Jeśli GUI nie zostanie wykryte, kreator wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; ścieżką awaryjną jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z gatewayem w innym miejscu.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego gatewaya (`ws://...`)
- Token, jeśli wymagane jest uwierzytelnianie zdalnego gatewaya (zalecane)

<Note>
- Jeśli gateway jest ograniczony tylko do loopback, użyj tunelowania SSH albo tailnetu.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli istnieje, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ przeglądarkowy; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez runtime Codex, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez runtime Codex, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli istnieje, albo prosi o klucz, a następnie przechowuje dane uwierzytelniające w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, `openai/*` albo `openai-codex/*`.

  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Przechowuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Prosi o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o identyfikator konta, identyfikator gatewaya i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Hostowana wartość domyślna to `MiniMax-M2.7`; konfiguracja z kluczem API używa
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
  <Accordion title="Ollama (chmurowe i lokalne modele otwarte)">
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

    Interaktywny onboarding obsługuje te same wybory przechowywania klucza API co inne przepływy kluczy API dostawców:
    - **Wklej teraz klucz API** (jawny tekst)
    - **Użyj odwołania do sekretu** (env ref albo skonfigurowany provider ref, z walidacją preflight)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalnie; używa awaryjnie `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalnie)
    - `--custom-compatibility <openai|anthropic>` (opcjonalnie; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalnie; nadpisuje wywnioskowaną możliwość wejścia modelu)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz domyślny model z wykrytych opcji albo wprowadź dostawcę i model ręcznie.
- Onboarding dostawcy niestandardowego wnioskuje obsługę obrazów dla typowych identyfikatorów modeli i pyta tylko wtedy, gdy nazwa modelu jest nieznana.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  dopasowuje także ich warianty planów coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast nie pokazywać żadnych modeli.
- Kreator uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

Ścieżki danych uwierzytelniających i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania danych uwierzytelniających:

- Domyślne zachowanie onboardingu zapisuje klucze API jako wartości jawnego tekstu w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb odwołań zamiast przechowywania kluczy w postaci jawnego tekstu.
  W konfiguracji interaktywnej możesz wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowany provider ref (`file` albo `exec`) z aliasem dostawcy + id
- Interaktywny tryb odwołań uruchamia szybką walidację preflight przed zapisaniem.
  - Env refs: sprawdza nazwę zmiennej + niepustą wartość w bieżącym środowisku onboardingu.
  - Provider refs: sprawdza konfigurację dostawcy i rozwiązuje żądany id.
  - Jeśli preflight się nie powiedzie, onboarding pokazuje błąd i pozwala ponowić próbę.
- W trybie nieinteraktywnym `--secret-input-mode ref` jest obsługiwany tylko przez env.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu.
  - Flagi kluczy inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie onboarding szybko zakończy się błędem.
  - Dla dostawców niestandardowych nieinteraktywny tryb `ref` przechowuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku dostawcy niestandardowego `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding szybko zakończy się błędem.
- Dane uwierzytelniające Gateway obsługują wybór jawnego tekstu i SecretRef w konfiguracji interaktywnej:
  - Tryb tokenu: **Wygeneruj/zapisz token w postaci jawnego tekstu** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: jawny tekst albo SecretRef.
- Nieinteraktywna ścieżka SecretRef dla tokenu: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z jawnym tekstem nadal działają bez zmian.

<Note>
Wskazówka dla trybu headless i serwera: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
plik `auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Dane wyjściowe i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalna konfiguracja początkowa domyślnie używa `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokalna konfiguracja początkowa domyślnie ustawia to na `per-channel-peer`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane na identyfikatory, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Ręczna konfiguracja może później nadal ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako plugins. Po wybraniu ich podczas konfiguracji kreator
prosi o zainstalowanie plugin (npm albo ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i interfejs Control UI) mogą renderować kroki bez ponownej implementacji logiki konfiguracji początkowej.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Kompilacje natywne są używane, gdy są dostępne
- Windows używa WSL2 i stosuje linuksowy przepływ signal-cli wewnątrz WSL

## Powiązana dokumentacja

- Centrum konfiguracji początkowej: [Konfiguracja początkowa (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
