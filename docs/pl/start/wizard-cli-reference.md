---
read_when:
    - Potrzebny jest szczegółowy opis działania konkretnego kroku `openclaw onboard`
    - Debugujesz wyniki wdrażania lub integrujesz klientów wdrażania
sidebarTitle: CLI reference
summary: 'Działanie `openclaw onboard` krok po kroku: co robi każdy krok, jaką konfigurację zapisuje i jak działa wewnętrznie'
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-07-16T19:11:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Ta strona opisuje krok po kroku przebieg wdrażania, jego wyniki i mechanizmy wewnętrzne.
Przewodnik znajduje się w sekcji [Wdrażanie (CLI)](/pl/start/wizard). Pełna dokumentacja flag CLI
(wszystkie `--flag`, przykłady nieinteraktywne, polecenia specyficzne dla dostawców)
znajduje się w sekcji [`openclaw onboard`](/pl/cli/onboard).

## Działanie kreatora

Tryb lokalny (domyślny) prowadzi przez następujące etapy:

- Konfiguracja modelu i uwierzytelniania (Anthropic, OAuth subskrypcji OpenAI Code, xAI, OpenCode, niestandardowe punkty końcowe i inne przepływy uwierzytelniania należące do dostawców)
- Lokalizacja obszaru roboczego i pliki inicjalizacyjne
- Ustawienia Gateway (port, powiązanie, uwierzytelnianie, Tailscale)
- Kanały i dostawcy (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp oraz inne kanały wbudowane lub udostępniane przez pluginy)
- Dostawca wyszukiwania internetowego (opcjonalnie)
- Instalacja demona (LaunchAgent, jednostka użytkownika systemd lub natywne zadanie Harmonogramu zadań systemu Windows z mechanizmem rezerwowym wykorzystującym folder Autostart)
- Kontrola stanu
- Konfiguracja Skills

Tryb zdalny konfiguruje ten komputer do łączenia się z Gateway działającym w innym miejscu. Nie
instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Zachowaj bieżące wartości**, **Przejrzyj i zaktualizuj** lub **Zresetuj przed konfiguracją**.
    - Ponowne uruchomienie kreatora nie usuwa żadnych danych, chyba że jawnie wybrano opcję Reset (lub przekazano `--reset`).
    - Opcja CLI `--reset` domyślnie przyjmuje wartość `config+creds+sessions`; aby usunąć również obszar roboczy, użyj `--reset-scope full`.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i przed kontynuowaniem prosi o uruchomienie `openclaw doctor`.
    - Resetowanie przenosi stan do Kosza (nigdy nie usuwa go bezpośrednio) i udostępnia następujące zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa również obszar roboczy)

  </Step>
  <Step title="Model i uwierzytelnianie">
    - Pełna macierz opcji znajduje się w sekcji [Opcje uwierzytelniania i modelu](#auth-and-model-options).

  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (wartość konfigurowalna).
    - Tworzy początkowe pliki obszaru roboczego wymagane do inicjalizacji przy pierwszym uruchomieniu.
    - Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Prosi o podanie portu, powiązania, trybu uwierzytelniania i sposobu udostępniania przez Tailscale.
    - Zalecenie: pozostaw uwierzytelnianie tokenem włączone nawet dla interfejsu pętli zwrotnej, aby lokalne klienty WS musiały się uwierzytelniać.
    - W trybie tokenu konfiguracja interaktywna udostępnia następujące opcje:
      - **Wygeneruj/zapisz token w postaci zwykłego tekstu** (domyślnie)
      - **Użyj SecretRef** (opcja wymagająca włączenia)
    - W trybie hasła konfiguracja interaktywna również obsługuje przechowywanie w postaci zwykłego tekstu lub SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokenu: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrażania.
      - Nie można łączyć z `--gateway-token`.
    - Uwierzytelnianie należy wyłączać tylko wtedy, gdy wszystkie lokalne procesy są w pełni zaufane.
    - Powiązania inne niż z interfejsem pętli zwrotnej nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie za pomocą kodu QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): plik JSON konta usługi + grupa odbiorców webhooka
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy adres URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Messages; jeśli Gateway działa poza komputerem Mac, użyj opakowania SSH
    - Bezpieczeństwo wiadomości prywatnych: domyślnie stosowane jest parowanie. Pierwsza wiadomość prywatna wysyła kod; zatwierdź go za pomocą
      `openclaw pairing approve <channel> <code>` lub użyj list dozwolonych.
  </Step>
  <Step title="Wyszukiwanie internetowe">
    - Wybierz dostawcę (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) albo pomiń ten krok.
    - Pomiń ten krok za pomocą `--skip-search`; późniejszą ponowną konfigurację można przeprowadzić za pomocą `openclaw configure --section web`.

  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; w środowisku bez interfejsu graficznego użyj niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby Gateway działał nadal po wylogowaniu.
      - Może poprosić o użycie sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw zadanie Harmonogramu zadań
      - Jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi na element logowania dla bieżącego użytkownika w folderze Autostart i natychmiast uruchamia Gateway.
      - Zadania Harmonogramu zadań pozostają preferowane, ponieważ zapewniają lepsze informacje o stanie nadzorcy.
    - Wybór środowiska uruchomieniowego: Node jest wymagany, ponieważ kanoniczny magazyn stanu środowiska uruchomieniowego OpenClaw używa `node:sqlite`.

  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (w razie potrzeby) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje aktywne badanie stanu Gateway do danych wyjściowych stanu, w tym badania kanałów, jeśli są obsługiwane.

  </Step>
  <Step title="Skills">
    - Odczytuje dostępne umiejętności i sprawdza wymagania.
    - Umożliwia wybór menedżera Node: npm, pnpm lub bun.
    - Instaluje opcjonalne zależności zaufanych wbudowanych umiejętności, gdy wymagany
      instalator jest dostępny.
    - Pomija niedostępne instalatory Homebrew, uv i Go, a następnie grupuje objęte tym
      umiejętności wraz z instrukcjami ręcznej konfiguracji. Po zainstalowaniu
      brakujących wymagań wstępnych uruchom `openclaw doctor`.

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i dalsze kroki, w tym opcje aplikacji dla systemów iOS, Android i macOS.

  </Step>
</Steps>

<Note>
Jeśli nie zostanie wykryty interfejs graficzny, zamiast otwierać przeglądarkę kreator wyświetli instrukcje przekierowania portów SSH dla interfejsu Control UI.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; rozwiązaniem rezerwowym jest `pnpm ui:build` (automatycznie instaluje zależności interfejsu).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje ten komputer do łączenia się z Gateway działającym w innym miejscu. Nie
instaluje ani nie modyfikuje niczego na zdalnym hoście.

Konfigurowane elementy:

- Adres URL zdalnego Gateway (`ws://...` lub `wss://...`)
- Token, hasło lub brak uwierzytelniania, zgodnie z konfiguracją zdalnego Gateway

<Steps>
  <Step title="Wykrywanie (opcjonalne)">
    Jeśli dostępne jest `dns-sd` (macOS) lub `avahi-browse` (Linux), proces wdrażania
    proponuje wyszukanie sygnałów nawigacyjnych Gateway przez Bonjour/mDNS, zanim przejdzie do
    ręcznego wprowadzania adresu URL. Jeśli skonfigurowano wykrywanie DNS-SD w sieci rozległej,
    również zostanie podjęta taka próba. Dokumentacja: [Wykrywanie Gateway](/pl/gateway/discovery), [Bonjour](/pl/gateway/bonjour).
  </Step>
  <Step title="Metoda połączenia">
    Po wybraniu sygnału nawigacyjnego wybierz bezpośrednie połączenie WebSocket lub tunel SSH:
    - **Bezpośrednio**: łączy przez `wss://` i prosi o zaufanie wykrytemu
      odciskowi TLS (przypinanie na zasadzie zaufania przy pierwszym użyciu; zostanie przypięty tylko po zaakceptowaniu).
    - **Tunel SSH**: wyświetla polecenie `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`,
      które należy najpierw uruchomić, a następnie łączy z lokalnym punktem końcowym tunelu.
  </Step>
  <Step title="Uwierzytelnianie">
    Wybierz token (zalecane), hasło albo brak uwierzytelniania, a następnie opcjonalnie zapisz te dane
    jako SecretRef zamiast zwykłego tekstu.
  </Step>
</Steps>

<Note>
Jeśli Gateway działa wyłącznie na interfejsie pętli zwrotnej i nie można go wykryć, użyj ręcznie tunelowania SSH lub sieci tailnet.
`ws://` w postaci zwykłego tekstu jest akceptowany dla interfejsu pętli zwrotnej, literałów prywatnych adresów IP, `.local` oraz adresów URL Tailnet `*.ts.net`; inne prywatne nazwy DNS wymagają `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opcje uwierzytelniania i modelu

Jeśli etap konfiguracji dostawcy nie powiedzie się podczas interaktywnego wdrażania (na przykład opcja ponownego użycia CLI
bez lokalnego zalogowania), kreator wyświetla błąd i wraca do wyboru dostawcy,
zamiast kończyć działanie. Jawne uruchomienia `--auth-choice` nadal natychmiast kończą się niepowodzeniem na potrzeby automatyzacji.

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest dostępny, albo prosi o klucz, a następnie zapisuje go do użytku przez demona.
  </Accordion>
  <Accordion title="CLI Anthropic Claude">
    Preferowana ścieżka lokalna podczas interaktywnego wdrażania lub konfigurowania; ponownie wykorzystuje istniejące logowanie CLI Claude, jeśli jest dostępne.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ w przeglądarce; wklej `code#state`.

    W nowej konfiguracji bez modelu podstawowego ustawia `agents.defaults.model` na
    `openai/gpt-5.6-sol` za pośrednictwem środowiska uruchomieniowego Codex.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    W nowej konfiguracji bez modelu podstawowego ustawia `agents.defaults.model` na
    `openai/gpt-5.6-sol` za pośrednictwem środowiska uruchomieniowego Codex.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest dostępny, albo prosi o klucz, a następnie zapisuje dane uwierzytelniające w profilach uwierzytelniania.

    W nowej konfiguracji bez modelu podstawowego ustawia `agents.defaults.model` na
    `openai/gpt-5.6`; sam identyfikator modelu bezpośredniego API jest rozpoznawany jako poziom Sol.

    Dodanie lub ponowne uwierzytelnienie OpenAI zachowuje istniejący, jawnie ustawiony model podstawowy,
    w tym `openai/gpt-5.5`. Jeśli konto nie udostępnia GPT-5.6,
    wybierz jawnie `openai/gpt-5.5`; OpenClaw nie obniża jego wersji automatycznie.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Logowanie w przeglądarce dla kwalifikujących się kont SuperGrok lub X Premium. Jest to
    zalecana ścieżka xAI dla większości użytkowników. OpenClaw przechowuje wynikowy profil
    uwierzytelniania dla modeli Grok, Grok `web_search`, `x_search` i `code_execution`.
  </Accordion>
  <Accordion title="Kod urządzenia xAI (Grok)">
    Przyjazne dla środowisk zdalnych logowanie w przeglądarce za pomocą krótkiego kodu zamiast
    wywołania zwrotnego localhost. Należy używać tej metody na hostach SSH, Docker lub VPS.
  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Wyświetla monit o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli. Należy użyć tej
    opcji, aby korzystać z klucza API xAI Console zamiast OAuth w ramach subskrypcji.
  </Accordion>
  <Accordion title="OpenCode">
    Wyświetla monit o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`) i umożliwia wybór katalogu Zen lub Go (jeden klucz API obsługuje oba).
    Adres konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Przechowuje klucz.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Wyświetla monit o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Wyświetla monit o identyfikator konta, identyfikator Gateway oraz `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślna wartość hostowana to `MiniMax-M3`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla standardowej usługi StepFun lub Step Plan w chińskich albo globalnych punktach końcowych.
    Wariant standardowy obejmuje obecnie `step-3.5-flash`, a Step Plan obejmuje również `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Wyświetla monit o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modele otwarte w chmurze i lokalne)">
    Najpierw wyświetla monit o `Cloud + Local`, `Cloud only` lub `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście wyświetlają monit o bazowy adres URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza również, czy ten host Ollama jest zalogowany w celu uzyskania dostępu do chmury.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Niestandardowy dostawca">
    Działa z punktami końcowymi zgodnymi z OpenAI, OpenAI Responses i Anthropic.

    Interaktywne wdrażanie obsługuje te same opcje przechowywania klucza API co inne przepływy kluczy API dostawców:
    - **Wklej klucz API teraz** (tekst jawny)
    - **Użyj odwołania do sekretu** (odwołanie do zmiennej środowiskowej lub skonfigurowanego dostawcy, ze wstępną walidacją)

    Wdrażanie wykrywa obsługę obrazów dla popularnych identyfikatorów modeli wizyjnych (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral i podobnych) i pyta o nią tylko wtedy, gdy nazwa modelu jest nieznana.

    Flagi trybu nieinteraktywnego:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; wartością zastępczą jest `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcjonalne; domyślnie `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcjonalne; zastępuje wykrytą możliwość wejściową modelu)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia uwierzytelnianie nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Należy wybrać domyślny model spośród wykrytych opcji albo ręcznie wprowadzić dostawcę i model.
- Gdy wdrażanie rozpoczyna się od wyboru uwierzytelniania dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. W przypadku Volcengine i BytePlus ta sama preferencja
  obejmuje również ich warianty planów programistycznych (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy nie zwróciłby żadnych wyników, selektor używa
  pełnego katalogu zamiast wyświetlać brak modeli.
- Kreator przeprowadza kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje uwierzytelniania.

Ścieżki poświadczeń i profili:

- Profile uwierzytelniania (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie wdrażania zapisuje klucze API jako wartości tekstu jawnego w profilach uwierzytelniania.
- `--secret-input-mode ref` włącza tryb odwołań zamiast przechowywania kluczy jako tekstu jawnego.
  W konfiguracji interaktywnej można wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - odwołanie do skonfigurowanego dostawcy (`file` lub `exec`) z aliasem i identyfikatorem dostawcy
- Interaktywny tryb odwołań przeprowadza szybką wstępną walidację przed zapisaniem.
  - Odwołania do zmiennych środowiskowych: sprawdzają nazwę zmiennej i niepustą wartość w bieżącym środowisku wdrażania.
  - Odwołania do dostawców: sprawdzają konfigurację dostawcy i rozwiązują żądany identyfikator.
  - Jeśli wstępna walidacja zakończy się niepowodzeniem, wdrażanie wyświetla błąd i umożliwia ponowienie próby.
- W trybie nieinteraktywnym `--secret-input-mode ref` korzysta wyłącznie ze zmiennych środowiskowych.
  - Należy ustawić zmienną środowiskową dostawcy w środowisku procesu wdrażania.
  - Flagi kluczy wbudowanych (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie wdrażanie natychmiast kończy się niepowodzeniem.
  - W przypadku niestandardowych dostawców nieinteraktywny tryb `ref` przechowuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie wdrażanie natychmiast kończy się niepowodzeniem.
- Poświadczenia uwierzytelniania Gateway obsługują w konfiguracji interaktywnej tekst jawny i SecretRef:
  - Tryb tokenu: **Wygeneruj/przechowaj token jako tekst jawny** (domyślnie) lub **Użyj SecretRef**.
  - Tryb hasła: tekst jawny lub SecretRef.
- Nieinteraktywna ścieżka SecretRef tokenu: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z tekstem jawnym nadal działają bez zmian.

<Note>
Wskazówka dla środowisk bez interfejsu graficznego i serwerów: należy ukończyć OAuth na komputerze z przeglądarką, a następnie skopiować
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` lub odpowiednią ścieżkę
`$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest wyłącznie starszym źródłem importu.
</Note>

## Dane wyjściowe i mechanizmy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalne wdrażanie domyślnie ustawia `"coding"`, gdy wartość nie jest ustawiona; istniejące wartości jawne są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, Tailscale)
- `session.dmScope` (lokalne wdrażanie domyślnie ustawia tę wartość na `per-channel-peer`, gdy nie jest ustawiona; istniejące wartości jawne są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Discord, iMessage, Signal, Slack, Telegram, WhatsApp), gdy zostaną wybrane w monitach; Discord i Slack rozwiązują również wprowadzone nazwy na identyfikatory
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` przyjmuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna może później nadal ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalny `bindings`.

Poświadczenia WhatsApp są umieszczane w `~/.openclaw/credentials/whatsapp/<accountId>/`.
Aktywne sesje i transkrypcje są przechowywane w
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Katalog
`~/.openclaw/agents/<agentId>/sessions/` służy do przechowywania danych wejściowych starszych migracji
oraz artefaktów archiwalnych i pomocy technicznej.

<Note>
Niektóre kanały są dostarczane jako pluginy. Po wybraniu ich podczas konfiguracji kreator
wyświetla monit o zainstalowanie pluginu (z npm lub ścieżki lokalnej) przed konfiguracją kanału.
</Note>

## Konfiguracja nieinteraktywna

`--non-interactive` wymaga `--accept-risk` (potwierdza świadomość, że agenci są
potężni, a pełny dostęp do systemu jest ryzykowny):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Pełna dokumentacja flag i przykłady specyficzne dla dostawców: [`openclaw onboard`](/pl/cli/onboard), [Automatyzacja CLI](/pl/start/wizard-cli-automation).

## RPC kreatora Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i interfejs Control UI) mogą renderować kroki bez ponownego implementowania logiki wdrażania.

## Zachowanie konfiguracji Signal

- Pobiera odpowiedni zasób wydania z oficjalnych wydań GitHub `signal-cli` (kompilacja natywna, tylko Linux x86-64)
- Na innych platformach (macOS, Linux inny niż x64) instaluje zamiast tego przez Homebrew
- Przechowuje instalację zasobu wydania w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Natywny system Windows nie jest jeszcze obsługiwany; należy uruchomić wdrażanie wewnątrz WSL2, aby uzyskać ścieżkę instalacji systemu Linux

## Powiązana dokumentacja

- Centrum wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
