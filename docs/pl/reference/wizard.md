---
read_when:
    - Wyszukiwanie konkretnego kroku wdrażania lub flagi
    - Automatyzowanie wdrażania w trybie nieinteraktywnym
    - Debugowanie zachowania procesu wprowadzania
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja referencyjna onboardingu CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja referencyjna wdrażania
x-i18n:
    generated_at: "2026-05-06T09:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

To jest pełna dokumentacja referencyjna dla `openclaw onboard`.
Ogólny przegląd znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Existing config detection">
    - Jeśli `~/.openclaw/openclaw.json` istnieje, wybierz **Keep / Modify / Reset**.
    - Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że wyraźnie wybierzesz **Reset**
      (lub przekażesz `--reset`).
    - CLI `--reset` domyślnie oznacza `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model/Auth">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic w onboardingu/konfiguracji.
    - **Token konfiguracyjny Anthropic**: nadal dostępny w onboardingu/konfiguracji, choć OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ w przeglądarce; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, `openai/*` albo `openai-codex/*`.
    - **Klucz API xAI (Grok)**: prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go na https://opencode.ai/auth) i pozwala wybrać katalog Zen albo Go.
    - **Ollama**: najpierw oferuje **Cloud + Local**, **Cloud only** albo **Local only**. `Cloud only` prosi o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście proszą o bazowy URL Ollama, wykrywają dostępne modele i w razie potrzeby automatycznie pobierają wybrany model lokalny; `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu w chmurze.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: przechowuje klucz za Ciebie.
    - **Vercel AI Gateway (proxy wielomodelowe)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o identyfikator konta, identyfikator Gateway oraz `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślny model hostowany to `MiniMax-M2.7`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla standardowego StepFun albo Step Plan na punktach końcowych w Chinach lub globalnych.
    - Standard obejmuje obecnie `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Pomiń**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz domyślny model spośród wykrytych opcji (albo ręcznie wprowadź dostawcę/model). Aby uzyskać najlepszą jakość i niższe ryzyko prompt injection, wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie dostawców.
    - Onboarding uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.
    - Tryb przechowywania kluczy API domyślnie używa wartości profilu uwierzytelniania w formie zwykłego tekstu. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać odwołania oparte na zmiennych środowiskowych (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` to starsze źródło wyłącznie do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla środowisk bez interfejsu graficznego/serwerów: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
    jest wyłącznie starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy początkowe pliki obszaru roboczego potrzebne do rytuału bootstrapu agenta.
    - Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, tryb uwierzytelniania, ekspozycja przez Tailscale.
    - Zalecenie dotyczące uwierzytelniania: zachowaj **Token** nawet dla loopback, aby lokalne klienty WS musiały się uwierzytelniać.
    - W trybie tokenu interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token w zwykłym tekście** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` u dostawców `env`, `file` i `exec` do próby onboardingu/bootstrapu panelu.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, onboarding kończy się wcześnie z jasnym komunikatem naprawczym zamiast cichego osłabienia uwierzytelniania w czasie działania.
    - W trybie hasła interaktywna konfiguracja obsługuje także przechowywanie w zwykłym tekście albo SecretRef.
    - Nieinteraktywna ścieżka tokenu SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + bazowy URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB.
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza DM wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.

  </Step>
  <Step title="Web search">
    - Wybierz obsługiwanego dostawcę, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG albo Tavily (lub pomiń).
    - Dostawcy oparci na API mogą używać zmiennych środowiskowych albo istniejącej konfiguracji do szybkiej konfiguracji; dostawcy bez klucza używają zamiast tego własnych wymagań wstępnych.
    - Pomiń za pomocą `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu bez interfejsu użyj niestandardowego LaunchDaemon (niedostarczany).
    - Linux (i Windows przez WSL2): jednostka użytkownika systemd
      - Onboarding próbuje włączyć linger przez `loginctl enable-linger <user>`, aby Gateway pozostawał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecany; wymagany dla WhatsApp/Telegram). Bun jest **niezalecany**.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie zapisuje rozwiązanych wartości tokenu w zwykłym tekście w metadanych środowiska usługi nadzorcy.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja demona jest blokowana z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja demona jest blokowana do czasu jawnego ustawienia trybu.

  </Step>
  <Step title="Health check">
    - Uruchamia Gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje aktywną sondę kondycji Gateway do danych statusu, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego gatewaya).

  </Step>
  <Step title="Skills (recommended)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: **npm / pnpm** (bun niezalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Finish">
    - Podsumowanie + następne kroki, w tym aplikacje iOS/Android/macOS dla dodatkowych funkcji.

  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, onboarding wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, onboarding próbuje je zbudować; fallback to `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować onboarding albo użyć go w skrypcie:

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

Dodaj `--json`, aby uzyskać podsumowanie czytelne maszynowo.

Gateway token SecretRef w trybie nieinteraktywnym:

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
`--json` **nie** implikuje trybu nieinteraktywnego. Użyj `--non-interactive` (oraz `--workspace`) w skryptach.
</Note>

Przykłady poleceń specyficzne dla dostawców znajdują się w [Automatyzacja CLI](/pl/start/wizard-cli-automation#provider-specific-examples).
Użyj tej strony referencyjnej do semantyki flag i kolejności kroków.

### Dodaj agenta (nieinteraktywnie)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC kreatora Gateway

Gateway udostępnia przepływ onboardingu przez RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienci (aplikacja macOS, Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

## Konfiguracja Signal (signal-cli)

Onboarding może zainstalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` w Twojej konfiguracji.

Uwagi:

- Kompilacje JVM wymagają **Java 21**.
- Kompilacje natywne są używane, gdy są dostępne.
- Windows używa WSL2; instalacja signal-cli przebiega zgodnie z przepływem dla Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalne wdrażanie domyślnie używa `"coding"`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, tailscale)
- `session.dmScope` (szczegóły zachowania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Konfiguracja ręczna nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane logowania WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako pluginy. Gdy wybierzesz taki kanał podczas konfiguracji, wdrażanie
poprosi o jego zainstalowanie (z npm albo ścieżki lokalnej), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Omówienie wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (starsze)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
