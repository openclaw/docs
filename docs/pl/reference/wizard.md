---
read_when:
    - Szukasz konkretnego kroku lub flagi onboardingu
    - Automatyzujesz onboarding w trybie nieinteraktywnym
    - Debugujesz zachowanie onboardingu
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja CLI onboarding: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja onboarding
x-i18n:
    generated_at: "2026-04-07T09:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a142b9ec4323fabb9982d05b64375d2b4a4007dffc910acbee3a38ff871a7236
    source_path: reference/wizard.md
    workflow: 15
---

# Dokumentacja onboarding

To jest pełna dokumentacja dla `openclaw onboard`.
Aby zobaczyć ogólny przegląd, zajrzyj do [Onboarding (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Keep / Modify / Reset**.
    - Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset**
      (lub przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i prosi,
      aby przed kontynuacją uruchomić `openclaw doctor`.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także workspace)
  </Step>
  <Step title="Model/Auth">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demon.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic w onboardingu/configure.
    - **Anthropic setup-token**: nadal dostępny w onboarding/configure, chociaż OpenClaw teraz preferuje ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (Codex CLI)**: jeśli istnieje `~/.codex/auth.json`, onboarding może go ponownie użyć. Poświadczenia Codex CLI użyte ponownie pozostają zarządzane przez Codex CLI; po wygaśnięciu OpenClaw najpierw ponownie odczytuje to źródło i, gdy dostawca może je odświeżyć, zapisuje odświeżone poświadczenie z powrotem do magazynu Codex zamiast samodzielnie przejmować nad nim kontrolę.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ przeglądarkowy; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model nie jest ustawiony albo ma postać `openai/*`.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach auth.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` albo `openai-codex/*`.
    - **Klucz API xAI (Grok)**: prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go z https://opencode.ai/auth) i pozwala wybrać katalog Zen lub Go.
    - **Ollama**: prosi o bazowy URL Ollama, oferuje tryb **Cloud + Local** albo **Local**, wykrywa dostępne modele i automatycznie pobiera wybrany model lokalny, gdy jest to potrzebne.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (wielomodelowe proxy)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o Account ID, Gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślny model hostowany to `MiniMax-M2.7`.
      Konfiguracja klucza API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na endpointach chińskich lub globalnych.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Pomiń**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz domyślny model spośród wykrytych opcji (albo wpisz ręcznie `provider/model`). Dla najlepszej jakości i mniejszego ryzyka prompt injection wybierz najmocniejszy dostępny model najnowszej generacji w swoim zestawie dostawców.
    - Onboarding uruchamia kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje auth.
    - Tryb przechowywania kluczy API domyślnie używa jawnych wartości w profilach auth. Użyj `--secret-input-mode ref`, aby zamiast tego zapisywać odwołania oparte na env (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile auth znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` to starsze źródło tylko do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla trybu headless/serwerowego: ukończ OAuth na komputerze z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy początkowe pliki workspace potrzebne do rytuału bootstrap agenta.
    - Pełny układ workspace + przewodnik kopii zapasowej: [Agent workspace](/pl/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, tryb auth, ekspozycja Tailscale.
    - Zalecenie dotyczące auth: zachowaj **Token** nawet dla loopback, aby lokalni klienci WS nadal musieli się uwierzytelnić.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Wygenerowanie/zapis jawnego tokenu** (domyślnie)
      - **Użycie SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef z `gateway.auth.token` u dostawców `env`, `file` i `exec` do sondy onboarding/dashboard bootstrap.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie da się go rozwiązać, onboarding kończy się błędem wcześnie z jasnym komunikatem naprawczym zamiast po cichu osłabiać auth runtime.
    - W trybie hasła konfiguracja interaktywna również obsługuje przechowywanie jawne albo SecretRef.
    - Ścieżka SecretRef tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłączaj auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania inne niż loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie przez QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + webhook audience.
    - [Mattermost](/pl/channels/mattermost) (plugin): token bota + bazowy URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych.
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź go przez `openclaw pairing approve <channel> <code>` albo użyj allowlist.
  </Step>
  <Step title="Wyszukiwanie w sieci">
    - Wybierz obsługiwanego dostawcę, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG lub Tavily (albo pomiń).
    - Dostawcy wspierani przez API mogą używać zmiennych env lub istniejącej konfiguracji do szybkiej konfiguracji; dostawcy bez kluczy używają swoich własnych wymagań wstępnych.
    - Pomiń przez `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Onboarding próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway pozostał aktywny po wylogowaniu.
      - Może poprosić o sudo (zapis do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun jest **niezalecany**.
    - Jeśli auth tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie zapisuje rozwiązanego tokenu jawnego do metadanych środowiska usługi supervisora.
    - Jeśli auth tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu nie został rozwiązany, instalacja demona jest blokowana z konkretnymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona jest blokowana, dopóki tryb nie zostanie ustawiony jawnie.
  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje do wyniku statusu aktywną sondę stanu gateway, w tym sondy kanałów, gdy są obsługiwane (wymaga dostępnego gateway).
  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżer węzłów: **npm / pnpm** (bun jest niezalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + kolejne kroki, w tym aplikacje iOS/Android/macOS dla dodatkowych funkcji.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, onboarding wypisuje instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, onboarding próbuje je zbudować; ścieżką awaryjną jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować onboarding lub uruchamiać go ze skryptów:

```bash
openclaw onboard --non-interactive \
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

SecretRef tokenu gateway w trybie nieinteraktywnym:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.

<Note>
`--json` **nie** oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

Przykłady poleceń specyficznych dla dostawców znajdują się w [CLI Automation](/pl/start/wizard-cli-automation#provider-specific-examples).
Używaj tej strony dokumentacji dla semantyki flag i kolejności kroków.

### Dodanie agenta (tryb nieinteraktywny)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC kreatora Gateway

Gateway udostępnia przepływ onboardingu przez RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienci (aplikacja macOS, Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

## Konfiguracja Signal (`signal-cli`)

Onboarding może zainstalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` w konfiguracji.

Uwagi:

- Buildy JVM wymagają **Java 21**.
- Jeśli są dostępne, używane są buildy natywne.
- Windows używa WSL2; instalacja signal-cli przebiega według przepływu linuksowego wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (szczegóły zachowania: [CLI Setup Reference](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlisty kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy wybierzesz tę opcję podczas promptów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Ręczna konfiguracja nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako pluginy. Gdy wybierzesz taki kanał podczas konfiguracji, onboarding
poprosi o jego instalację (npm lub ścieżka lokalna), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Przegląd onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Onboarding w aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Gateway configuration](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (legacy)
- Skills: [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config)
