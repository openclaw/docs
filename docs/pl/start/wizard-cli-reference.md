---
read_when:
    - Potrzebujesz szczegółowych informacji o zachowaniu polecenia openclaw onboard
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Kompletny opis referencyjny przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i mechanizmów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-06-27T18:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona jest pełnym odniesieniem dla `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, CLI Anthropic Claude albo klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację przestrzeni roboczej i pliki inicjalizacyjne
- Ustawienia Gateway (port, bind, uwierzytelnianie, Tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage i inne dołączone Pluginy kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd albo natywne Zaplanowane zadanie Windows z awaryjną opcją folderu Autostart)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway działającym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Zachowaj, Modyfikuj albo Resetuj.
    - Ponowne uruchomienie kreatora niczego nie usuwa, chyba że jawnie wybierzesz Resetuj (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie oznacza `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także przestrzeń roboczą.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera przestarzałe klucze, kreator zatrzyma się i poprosi o uruchomienie `openclaw doctor` przed kontynuowaniem.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także przestrzeń roboczą)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w [Opcje uwierzytelniania i modeli](#auth-and-model-options).

  </Step>
  <Step title="Przestrzeń robocza">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Dodaje pliki przestrzeni roboczej potrzebne do rytuału inicjalizacji przy pierwszym uruchomieniu.
    - Układ przestrzeni roboczej: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb uwierzytelniania i ekspozycję przez Tailscale.
    - Zalecane: pozostaw uwierzytelnianie tokenem włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token jako zwykły tekst** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła konfiguracja interaktywna obsługuje również zapis jako zwykły tekst albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindy inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca Webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Wiadomości; użyj wrappera SSH, gdy Gateway działa poza Makiem
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwszy DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj własnego LaunchDaemon (niedołączony).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby gateway pozostał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Zaplanowane zadanie
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi awaryjnie na element logowania w folderze Autostart użytkownika i natychmiast uruchamia gateway.
      - Zaplanowane zadania pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór środowiska uruchomieniowego: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Kontrola kondycji">
    - Uruchamia gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje do wyniku statusu sondę kondycji działającego gateway, w tym sondy kanałów, gdy są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i następne kroki, w tym opcje aplikacji na iOS, Androida i macOS.

  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wypisuje instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; opcją awaryjną jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z Gateway działającym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego gateway (`ws://...`)
- Token, jeśli zdalny gateway wymaga uwierzytelniania (zalecane)

<Note>
- Jeśli gateway działa tylko na loopback, użyj tunelowania SSH albo tailnetu.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opcje uwierzytelniania i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo pyta o klucz, a następnie zapisuje go do użycia przez demona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ w przeglądarce; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model jest nieustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model jest nieustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo pyta o klucz, a następnie zapisuje dane uwierzytelniające w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model jest nieustawiony, ma postać `openai/*` albo jest przestarzałą referencją modelu Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Logowanie w przeglądarce dla uprawnionych kont SuperGrok lub X Premium. To jest
    zalecana ścieżka xAI dla większości użytkowników. OpenClaw zapisuje wynikowy profil
    uwierzytelniania dla modeli Grok, Grok `web_search`, `x_search` i `code_execution`.
  </Accordion>
  <Accordion title="Kod urządzenia xAI (Grok)">
    Przyjazne dla zdalnych hostów logowanie w przeglądarce z krótkim kodem zamiast
    callbacku localhost. Użyj tego z hostów SSH, Docker albo VPS.
  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Pyta o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli. Użyj tego,
    gdy chcesz użyć klucza API xAI Console zamiast OAuth subskrypcji.
  </Accordion>
  <Accordion title="OpenCode">
    Pyta o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Zapisuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Pyta o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Pyta o ID konta, ID gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M3`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na punktach końcowych w Chinach lub globalnych.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Pyta o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (chmura i lokalne otwarte modele)">
    Najpierw pyta o `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście pytają o bazowy URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu w chmurze.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Dostawca niestandardowy">
    Działa z punktami końcowymi zgodnymi z OpenAI i zgodnymi z Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania klucza API co inne przepływy kluczy API dostawców:
    - **Wklej teraz klucz API** (zwykły tekst)
    - **Użyj referencji sekretu** (referencja env albo skonfigurowana referencja dostawcy, z walidacją preflight)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalnie; awaryjnie używa `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalnie)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcjonalnie; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalnie; zastępuje wywnioskowaną zdolność wejścia modelu)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz model domyślny spośród wykrytych opcji albo wpisz dostawcę i model ręcznie.
- Onboarding dostawcy niestandardowego wnioskuje obsługę obrazów dla typowych ID modeli i pyta tylko wtedy, gdy nazwa modelu jest nieznana.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  pasuje także do ich wariantów planów kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast nie pokazywać żadnych modeli.
- Kreator uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

Ścieżki danych uwierzytelniających i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import przestarzałego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania danych uwierzytelniających:

- Domyślne zachowanie wdrażania utrwala klucze API jako wartości tekstu jawnego w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb referencji zamiast przechowywania klucza w tekście jawnym.
  W konfiguracji interaktywnej możesz wybrać:
  - referencję zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowaną referencję dostawcy (`file` lub `exec`) z aliasem dostawcy + id
- Interaktywny tryb referencji uruchamia szybką walidację wstępną przed zapisaniem.
  - Referencje env: sprawdza nazwę zmiennej + niepustą wartość w bieżącym środowisku wdrażania.
  - Referencje dostawcy: sprawdza konfigurację dostawcy i rozwiązuje żądane id.
  - Jeśli walidacja wstępna się nie powiedzie, wdrażanie pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` jest obsługiwany tylko przez zmienne środowiskowe.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrażania.
  - Wbudowane flagi kluczy (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie wdrażanie szybko kończy się niepowodzeniem.
  - Dla dostawców niestandardowych nieinteraktywny tryb `ref` przechowuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W takim przypadku dostawcy niestandardowego `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie wdrażanie szybko kończy się niepowodzeniem.
- Poświadczenia uwierzytelniania Gateway obsługują wybór tekstu jawnego i SecretRef w konfiguracji interaktywnej:
  - Tryb tokenu: **Wygeneruj/przechowaj token w tekście jawnym** (domyślnie) lub **Użyj SecretRef**.
  - Tryb hasła: tekst jawny lub SecretRef.
- Ścieżka SecretRef dla tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z tekstem jawnym nadal działają bez zmian.

<Note>
Wskazówka dla trybu bez interfejsu i serwera: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
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
- `tools.profile` (lokalne wdrażanie domyślnie używa `"coding"`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, tailscale)
- `session.dmScope` (lokalne wdrażanie domyślnie ustawia to na `per-channel-peer`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna może nadal później ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako plugins. Gdy zostaną wybrane podczas konfiguracji, kreator
wyświetla monit o zainstalowanie plugin (npm lub ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownego implementowania logiki wdrażania.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni zasób wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Kompilacje JVM wymagają Java 21
- Kompilacje natywne są używane, gdy są dostępne
- Windows używa WSL2 i w WSL podąża za linuksowym przepływem signal-cli

## Powiązana dokumentacja

- Centrum wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja poleceń: [`openclaw onboard`](/pl/cli/onboard)
