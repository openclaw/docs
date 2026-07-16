---
read_when:
    - Wyszukiwanie konkretnego kroku wdrażania lub flagi
    - Automatyzacja wdrażania w trybie nieinteraktywnym
    - Debugowanie działania procesu wdrażania
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja wdrażania za pomocą CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja procesu wdrażania
x-i18n:
    generated_at: "2026-07-16T19:08:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

To jest pełna dokumentacja referencyjna dla `openclaw onboard`.
Ogólny przegląd znajduje się w sekcji [Wprowadzanie (CLI)](/pl/start/wizard). Szczegółowy opis
działania i danych wyjściowych znajduje się w [dokumentacji konfiguracji CLI](/pl/start/wizard-cli-reference).

## Szczegóły przebiegu (tryb lokalny)

<Steps>
  <Step title="Resetowanie (opcjonalne)">
    - `--reset` resetuje stan przed uruchomieniem konfiguracji; bez tej opcji ponowne uruchomienie procesu wprowadzania
      zachowuje istniejącą konfigurację i używa jej ponownie jako wartości domyślnych.
    - `--reset-scope` określa, co usuwa `--reset`: `config` (tylko plik
      konfiguracyjny), `config+creds+sessions` (domyślnie) lub `full` (usuwa również
      obszar roboczy).
    - Jeśli plik konfiguracyjny jest nieprawidłowy, proces wprowadzania zostaje zatrzymany i wyświetla polecenie, aby najpierw uruchomić
      `openclaw doctor`, a następnie ponownie uruchomić konfigurację.
    - Resetowanie przenosi stan do Kosza (nigdy nie usuwa go bezpośrednio).

  </Step>
  <Step title="Potwierdzenie ryzyka">
    - Przy pierwszym uruchomieniu (lub każdym uruchomieniu przed ustawieniem `wizard.securityAcknowledgedAt`)
      wymagane jest potwierdzenie świadomości, że agenci mają duże możliwości, a pełny
      dostęp do systemu wiąże się z ryzykiem.
    - `--non-interactive` wymaga jawnego podania `--accept-risk`; bez niego
      proces wprowadzania kończy się błędem zamiast wyświetlenia monitu.
    - Uruchomienia interaktywne wyświetlają monit o potwierdzenie zamiast użycia flagi; odmowa
      anuluje konfigurację.

  </Step>
  <Step title="Model/uwierzytelnianie">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest dostępny, lub prosi o klucz, a następnie zapisuje go do użytku przez demona.
    - **CLI Anthropic Claude**: preferowana ścieżka lokalna, gdy istnieje już logowanie w CLI Claude; OpenClaw nadal obsługuje uwierzytelnianie Anthropic za pomocą tokenu konfiguracyjnego jako alternatywę.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: proces w przeglądarce; należy wkleić `code#state`.
      - W nowej konfiguracji bez modelu głównego ustawia `agents.defaults.model` na `openai/gpt-5.6-sol` za pośrednictwem środowiska wykonawczego Codex.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: proces parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - W nowej konfiguracji bez modelu głównego ustawia `agents.defaults.model` na `openai/gpt-5.6-sol` za pośrednictwem środowiska wykonawczego Codex.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest dostępny, lub prosi o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - W nowej konfiguracji bez modelu głównego ustawia `agents.defaults.model` na `openai/gpt-5.6`; sam identyfikator modelu bezpośredniego API wskazuje poziom Sol.
    - Dodanie lub ponowne uwierzytelnienie OpenAI zachowuje istniejący, jawnie określony model główny, w tym `openai/gpt-5.5`. Jeśli konto nie udostępnia GPT-5.6, należy jawnie wybrać `openai/gpt-5.5`; OpenClaw nie obniża modelu automatycznie.
    - **OAuth xAI**: logowanie w przeglądarce za pomocą kodu urządzenia, bez konieczności używania wywołania zwrotnego localhost, dzięki czemu działa również przez SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Klucz API xAI**: prosi o `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` nadal działa jako ręczny alias zgodności dla tego samego procesu OAuth xAI z kodem urządzenia; w nowych skryptach należy używać `xai-oauth`.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`; można go uzyskać na stronie https://opencode.ai/auth) i umożliwia wybór katalogu Zen lub Go.
    - **Ollama**: najpierw oferuje **chmurę i tryb lokalny**, **tylko chmurę** lub **tylko tryb lokalny**. `Cloud only` prosi o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście proszą o bazowy adres URL Ollama (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i w razie potrzeby automatycznie pobierają wybrany model lokalny; `Cloud + Local` sprawdza również, czy ten host Ollama jest zalogowany w celu uzyskania dostępu do chmury.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz.
    - **Vercel AI Gateway (proxy wielu modeli)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o identyfikator konta, identyfikator Gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślna wartość hostowana to `MiniMax-M3`.
      Konfiguracja za pomocą klucza API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla standardowego StepFun lub Step Plan w chińskich albo globalnych punktach końcowych.
    - Wariant standardowy ma obecnie domyślną wartość `step-3.5-flash`; Step Plan zawiera również `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Niestandardowy dostawca**: działa z punktami końcowymi zgodnymi z OpenAI, OpenAI Responses lub Anthropic. Flagi trybu nieinteraktywnego: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcjonalna; wartość zastępcza to `CUSTOM_API_KEY`), `--custom-provider-id` (opcjonalna; wyprowadzana automatycznie z bazowego adresu URL), `--custom-compatibility openai|openai-responses|anthropic` (domyślnie `openai`), `--custom-image-input` / `--custom-text-input` (zastępują wywnioskowane wykrywanie modelu wizyjnego).
    - **Pomiń**: uwierzytelnianie nie zostało jeszcze skonfigurowane.
    - Należy wybrać model domyślny spośród wykrytych opcji (lub ręcznie wprowadzić dostawcę/model). Aby uzyskać najlepszą jakość i zmniejszyć ryzyko wstrzyknięcia poleceń, należy wybrać najsilniejszy dostępny model najnowszej generacji w stosie dostawcy.
    - Proces wprowadzania sprawdza model i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje uwierzytelniania.
    - Domyślny tryb przechowywania kluczy API to wartości profilu uwierzytelniania w postaci zwykłego tekstu. Aby zamiast tego przechowywać odwołania oparte na zmiennych środowiskowych, należy użyć `--secret-input-mode ref` (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); wskazana zmienna środowiskowa musi być już ustawiona, w przeciwnym razie proces wprowadzania natychmiast zakończy się niepowodzeniem.
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` służy wyłącznie do importowania starszych danych.
    - Więcej szczegółów: [OAuth](/pl/concepts/oauth)
    <Note>
    Wskazówka dotycząca środowiska bez interfejsu graficznego/serwera: należy ukończyć OAuth na komputerze z przeglądarką, a następnie skopiować
    plik `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` lub odpowiadającą mu
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
    jest wyłącznie starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (wartość konfigurowalna).
    - Tworzy wstępne pliki obszaru roboczego wymagane do rytuału inicjalizacji agenta.
    - Pełny układ obszaru roboczego i przewodnik tworzenia kopii zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port (domyślnie **18789**), powiązanie, tryb uwierzytelniania, udostępnianie przez Tailscale.
    - Zalecenie dotyczące uwierzytelniania: należy zachować **Token** nawet dla interfejsu loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Generowanie/przechowywanie tokenu w postaci zwykłego tekstu** (domyślnie)
      - **Użycie SecretRef** (opcjonalne)
      - Szybka konfiguracja ponownie wykorzystuje istniejące odwołania SecretRef `gateway.auth.token` u dostawców `env`, `file` i `exec` na potrzeby testu procesu wprowadzania/inicjalizacji panelu.
      - Jeśli to odwołanie SecretRef jest skonfigurowane, ale nie można go rozpoznać, proces wprowadzania kończy się wcześnie z jasnym komunikatem dotyczącym rozwiązania problemu, zamiast niejawnie osłabiać uwierzytelnianie środowiska wykonawczego.
    - W trybie hasła konfiguracja interaktywna obsługuje również przechowywanie w postaci zwykłego tekstu lub SecretRef.
    - Ścieżka SecretRef tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu wprowadzania.
      - Nie można łączyć z `--gateway-token`.
    - Uwierzytelnianie należy wyłączyć tylko wtedy, gdy wszystkie lokalne procesy są w pełni zaufane.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie kodem QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): plik JSON konta usługi + odbiorca webhooka.
    - [Mattermost](/pl/channels/mattermost) (plugin): token bota + bazowy adres URL.
    - [Signal](/pl/channels/signal) (plugin): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Wiadomości; gdy Gateway działa poza komputerem Mac, należy użyć opakowania SSH.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack i inne kanały są dostarczane jako
      pluginy, które proces wprowadzania może zainstalować. Pełny katalog: [Kanały](/pl/channels).
    - Bezpieczeństwo wiadomości prywatnych: domyślnie używane jest parowanie. Pierwsza wiadomość prywatna wysyła kod; należy go zatwierdzić za pomocą `openclaw pairing approve <channel> <code>` lub użyć list dozwolonych elementów.

  </Step>
  <Step title="Wyszukiwanie w internecie">
    - Należy wybrać obsługiwanego dostawcę, takiego jak Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG lub Tavily (albo pominąć).
    - Dostawcy korzystający z API mogą używać zmiennych środowiskowych lub istniejącej konfiguracji do szybkiej konfiguracji; dostawcy niewymagający klucza korzystają zamiast tego z własnych wymagań wstępnych.
    - Pomijanie za pomocą `--skip-search`.
    - Późniejsza konfiguracja: `openclaw configure --section web`.

  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; w środowisku bez interfejsu graficznego należy użyć niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Proces wprowadzania próbuje włączyć utrzymywanie za pomocą `loginctl enable-linger <user>`, aby Gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny system Windows: najpierw Zaplanowane zadanie; jeśli utworzenie zadania zostanie odrzucone, OpenClaw przechodzi na element logowania w folderze Autostart danego użytkownika i natychmiast uruchamia Gateway.
    - **Wybór środowiska wykonawczego:** Node jest wymagany, ponieważ kanoniczny magazyn stanu środowiska wykonawczego używa `node:sqlite`. Starsze usługi Bun są migrowane do Node podczas naprawy.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona sprawdza go, ale nie zapisuje rozpoznanych wartości tokenu w postaci zwykłego tekstu w metadanych środowiska usługi nadzorującej.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowanego odwołania SecretRef tokenu nie można rozpoznać, instalacja demona zostaje zablokowana ze wskazówkami umożliwiającymi rozwiązanie problemu.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja demona zostaje zablokowana do czasu jawnego ustawienia trybu.

  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (w razie potrzeby) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje aktywne sprawdzenie stanu Gateway do danych wyjściowych stanu, w tym testy kanałów, jeśli są obsługiwane (wymaga osiągalnego Gateway).

  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne umiejętności i sprawdza wymagania.
    - Umożliwia wybór menedżera Node: **npm / pnpm / bun**.
    - Automatycznie instaluje opcjonalne zależności dla zaufanych, dołączonych umiejętności (niektóre używają Homebrew w systemie macOS).
    - Pomija umiejętności, których wymagany instalator Homebrew, uv lub Go jest niedostępny, grupuje je wraz z instrukcjami ręcznej konfiguracji i wskazuje `openclaw doctor` po zainstalowaniu wymaganego narzędzia.

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i następne kroki, w tym monit **Jak uruchomić agenta?** z opcjami Terminal, Przeglądarka lub później.

  </Step>
</Steps>

<Note>
Jeśli nie wykryto graficznego interfejsu użytkownika, proces wdrażania wyświetla instrukcje przekierowania portu SSH dla interfejsu Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów interfejsu Control UI, proces wdrażania próbuje je zbudować; rozwiązaniem rezerwowym jest `pnpm ui:build` (automatycznie instaluje zależności interfejsu użytkownika).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive --accept-risk`, aby zautomatyzować proces wdrażania lub obsłużyć go skryptem (ta
flaga stanowi wymagane potwierdzenie ryzyka; bez niej proces wdrażania kończy się
błędem):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Dodaj `--json`, aby uzyskać podsumowanie w formacie czytelnym maszynowo.

SecretRef tokenu Gateway w trybie nieinteraktywnym:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.

<Note>
`--json` **nie** włącza trybu nieinteraktywnego. W skryptach użyj `--non-interactive --accept-risk` (oraz `--workspace`).
</Note>

Przykłady poleceń specyficznych dla dostawców znajdują się w sekcji [Automatyzacja CLI](/pl/start/wizard-cli-automation#provider-specific-examples).
Na tej stronie referencyjnej opisano znaczenie flag i kolejność kroków.

### Dodawanie agenta (tryb nieinteraktywny)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` jest zarezerwowanym identyfikatorem agenta i nie można go użyć dla `openclaw agents add`.

## RPC kreatora Gateway

Gateway udostępnia proces wdrażania za pośrednictwem RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienty (aplikacja macOS, Control UI) mogą wyświetlać kroki bez ponownego implementowania logiki wdrażania.

## Konfiguracja Signal (signal-cli)

Proces wdrażania wykrywa, czy `signal-cli` znajduje się w `PATH`, a jeśli go brakuje, proponuje instalację:

- Linux x86-64: pobiera oficjalną natywną kompilację GraalVM z wydań `signal-cli` w serwisie GitHub i zapisuje ją w `~/.openclaw/tools/signal-cli/<version>/`.
- macOS i inne architektury: instaluje zamiast tego przez Homebrew.
- Natywny Windows: nie jest jeszcze obsługiwany; uruchom proces wdrażania w środowisku WSL2, aby skorzystać ze ścieżki instalacji dla systemu Linux.
- W obu przypadkach zapisuje `channels.signal.cliPath` w konfiguracji.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny proces wdrażania domyślnie ustawia `"coding"`, jeśli wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, Tailscale)
- `session.dmScope` (lokalny proces wdrażania domyślnie ustawia tę wartość na `"per-channel-peer"`, jeśli nie jest ustawiona; istniejące jawne wartości są zachowywane. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych wiadomości prywatnych kanałów, jeśli podczas monitów dotyczących kanałów wybrano tę opcję. Discord, Matrix, Microsoft Teams i Slack w miarę możliwości przekształcają nazwy na identyfikatory; inne kanały przyjmują identyfikatory bezpośrednio (na przykład numeryczne identyfikatory nadawców Telegram lub numery telefonów WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalnie `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Aktywne sesje i transkrypcje są przechowywane w
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Katalog
`~/.openclaw/agents/<agentId>/sessions/` służy do przechowywania danych wejściowych starszych migracji
oraz artefaktów archiwalnych i pomocy technicznej.

Niektóre kanały są dostarczane jako pluginy. Po wybraniu takiego kanału podczas konfiguracji proces wdrażania
poprosi o jego zainstalowanie (z npm lub ze ścieżki lokalnej), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Omówienie procesu wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Dokumentacja konfiguracji CLI: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference)
- Wdrażanie w aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [iMessage](/pl/channels/imessage)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
