---
read_when:
    - Potrzebujesz szczegółowego opisu działania polecenia openclaw onboard
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Kompletne odniesienie dla przepływu konfiguracji CLI, konfiguracji uwierzytelniania/modelu, danych wyjściowych i elementów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-06-30T22:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona jest pełnym opisem referencyjnym dla `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) przeprowadza Cię przez:

- Konfigurację modelu i uwierzytelniania (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki inicjalizacyjne
- Ustawienia Gateway (port, powiązanie, uwierzytelnianie, tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage i inne dołączone Plugin kanałów)
- Instalację demona (LaunchAgent, jednostka użytkownika systemd lub natywne zadanie Harmonogramu zadań Windows z awaryjną opcją folderu Autostart)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę do łączenia się z gatewayem w innym miejscu.
Nie instaluje ani nie modyfikuje niczego na hoście zdalnym.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli `~/.openclaw/openclaw.json` istnieje, wybierz Zachowaj, Modyfikuj albo Resetuj.
    - Ponowne uruchomienie kreatora niczego nie kasuje, chyba że wyraźnie wybierzesz Resetuj (albo przekażesz `--reset`).
    - `--reset` w CLI domyślnie oznacza `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w [Opcje uwierzytelniania i modeli](#auth-and-model-options).

  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Zasila pliki obszaru roboczego potrzebne do rytuału inicjalizacji przy pierwszym uruchomieniu.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Pyta o port, powiązanie, tryb uwierzytelniania i ekspozycję tailscale.
    - Zalecane: pozostaw uwierzytelnianie tokenem włączone nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token w postaci jawnego tekstu** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła konfiguracja interaktywna obsługuje też zapis w postaci jawnego tekstu albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokenu: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu procesowi lokalnemu.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorcy Webhook
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Messages; użyj wrappera SSH, gdy Gateway działa poza Maciem
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu bez ekranu użyj niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje `loginctl enable-linger <user>`, aby gateway pozostawał aktywny po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Zaplanowane zadanie
      - Jeśli utworzenie zadania zostanie odmówione, OpenClaw przełącza się na element logowania w folderze Autostart użytkownika i natychmiast uruchamia gateway.
      - Zaplanowane zadania pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór środowiska uruchomieniowego: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.

  </Step>
  <Step title="Kontrola kondycji">
    - Uruchamia gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje sondę kondycji aktywnego gatewaya do wyjścia statusu, w tym sondy kanałów, gdy są obsługiwane.

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
Jeśli GUI nie zostanie wykryty, kreator wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; rozwiązaniem awaryjnym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę do łączenia się z gatewayem w innym miejscu.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na hoście zdalnym.
</Info>

Co ustawiasz:

- URL zdalnego gatewaya (`ws://...`)
- Token, jeśli wymagane jest uwierzytelnianie zdalnego gatewaya (zalecane)

<Note>
- Jeśli gateway działa tylko na loopback, użyj tunelowania SSH albo tailnetu.
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
    Przepływ przez przeglądarkę; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli istnieje, albo prosi o klucz, a następnie przechowuje poświadczenie w profilach uwierzytelniania.

    Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, ma postać `openai/*` albo jest starszym odwołaniem do modelu Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Logowanie w przeglądarce dla kwalifikujących się kont SuperGrok lub X Premium. To
    zalecana ścieżka xAI dla większości użytkowników. OpenClaw przechowuje powstały profil
    uwierzytelniania dla modeli Grok, Grok `web_search`, `x_search` i `code_execution`.
  </Accordion>
  <Accordion title="Kod urządzenia xAI (Grok)">
    Przyjazne dla pracy zdalnej logowanie w przeglądarce z krótkim kodem zamiast wywołania zwrotnego localhost.
    Używaj tego z hostów SSH, Docker lub VPS.
  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli. Użyj tego,
    gdy chcesz użyć klucza API xAI Console zamiast subskrypcji OAuth.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen lub Go.
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
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M3`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla standardowego StepFun lub Step Plan na endpointach chińskich albo globalnych.
    Standardowo obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
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
    `Cloud + Local` sprawdza też, czy dany host Ollama jest zalogowany do dostępu do chmury.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Dostawca niestandardowy">
    Działa z endpointami zgodnymi z OpenAI i zgodnymi z Anthropic.

    Interaktywny onboarding obsługuje takie same wybory przechowywania klucza API jak inne przepływy kluczy API dostawców:
    - **Wklej klucz API teraz** (jawny tekst)
    - **Użyj odwołania do sekretu** (odwołanie do env albo skonfigurowanego dostawcy, z walidacją wstępną)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalnie; używa awaryjnie `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalnie)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcjonalnie; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalnie; zastępuje wywnioskowaną obsługę wejścia modelu)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz domyślny model spośród wykrytych opcji albo ręcznie wprowadź dostawcę i model.
- Onboarding dostawcy niestandardowego wnioskuje obsługę obrazów dla typowych identyfikatorów modeli i pyta tylko wtedy, gdy nazwa modelu jest nieznana.
- Gdy onboarding zaczyna się od wyboru uwierzytelniania dostawcy, selektor modelu automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  dopasowuje także ich warianty planu kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor wraca do
  pełnego katalogu zamiast pokazywać brak modeli.
- Kreator uruchamia kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.

Ścieżki poświadczeń i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu zapisuje klucze API jako wartości tekstowe w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb referencji zamiast przechowywania klucza w postaci tekstowej.
  W konfiguracji interaktywnej możesz wybrać jedno z poniższych:
  - referencja do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - skonfigurowana referencja dostawcy (`file` lub `exec`) z aliasem dostawcy + id
- Interaktywny tryb referencji uruchamia szybką walidację preflight przed zapisaniem.
  - Referencje env: sprawdza nazwę zmiennej + niepustą wartość w bieżącym środowisku onboardingu.
  - Referencje dostawcy: sprawdza konfigurację dostawcy i rozwiązuje żądany id.
  - Jeśli preflight się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` korzysta wyłącznie ze zmiennych env.
  - Ustaw zmienną env dostawcy w środowisku procesu onboardingu.
  - Flagi klucza inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej env; w przeciwnym razie onboarding szybko zakończy się błędem.
  - Dla niestandardowych dostawców nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding szybko zakończy się błędem.
- Dane uwierzytelniające Gateway obsługują wybór wartości tekstowych i SecretRef w konfiguracji interaktywnej:
  - Tryb tokena: **Wygeneruj/zapisz token tekstowy** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: wartość tekstowa albo SecretRef.
- Nieinteraktywna ścieżka tokena SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje tekstowe nadal działają bez zmian.

<Note>
Wskazówka dla trybu headless i serwera: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Wyjścia i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie używa `"coding"`, gdy wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia to na `per-channel-peer`, gdy wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy wyrazisz zgodę podczas promptów (nazwy są rozwiązywane na identyfikatory, gdy to możliwe)
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
prosi o zainstalowanie pluginu (npm lub ścieżka lokalna) przed konfiguracją kanału.
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
- Windows używa WSL2 i stosuje przepływ signal-cli dla Linuksa wewnątrz WSL

## Powiązana dokumentacja

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
