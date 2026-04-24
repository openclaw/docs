---
read_when:
    - Szukasz konkretnego kroku lub flagi onboardingu
    - Automatyzacja onboardingu w trybie nieinteraktywnym
    - Debugowanie zachowania onboardingu
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja onboardingu CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja onboardingu
x-i18n:
    generated_at: "2026-04-24T09:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

To pełna dokumentacja `openclaw onboard`.
Aby zobaczyć ogólny przegląd, zobacz [Onboarding (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb local)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Keep / Modify / Reset**.
    - Ponowne uruchomienie onboardingu **nie** czyści niczego, chyba że jawnie wybierzesz **Reset**
      (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także obszar roboczy)
  </Step>
  <Step title="Model/Auth">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli istnieje, albo pyta o klucz, a następnie zapisuje go do użycia przez daemon.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic w onboardingu/configure.
    - **Anthropic setup-token**: nadal dostępny w onboarding/configure, choć OpenClaw teraz preferuje ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ przeglądarkowy; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przeglądarkowy przepływ parowania z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo należy już do rodziny OpenAI.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli istnieje, albo pyta o klucz, a następnie zapisuje go w profilach auth.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` albo `openai-codex/*`.
    - **Klucz API xAI (Grok)**: pyta o `XAI_API_KEY` i konfiguruje xAI jako providera modelu.
    - **OpenCode**: pyta o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`, pobierz go na https://opencode.ai/auth) i pozwala wybrać katalog Zen albo Go.
    - **Ollama**: najpierw oferuje **Cloud + Local**, **Cloud only** albo **Local only**. `Cloud only` pyta o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście pytają o base URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, gdy jest potrzebny; `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu cloud.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (proxy wielu modeli)**: pyta o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: pyta o Account ID, Gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; hostowaną wartością domyślną jest `MiniMax-M2.7`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na endpointach China albo global.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje też `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (kompatybilne z Anthropic)**: pyta o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Skip**: auth nie jest jeszcze skonfigurowane.
    - Wybierz model domyślny z wykrytych opcji (albo wpisz ręcznie provider/model). Dla najlepszej jakości i mniejszego ryzyka prompt injection wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie providerów.
    - Onboarding uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje auth.
    - Tryb przechowywania klucza API domyślnie używa wartości plaintext auth-profile. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać refy oparte na env (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile auth znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` jest starszym źródłem tylko do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla środowisk headless/server: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Zasiewa pliki obszaru roboczego potrzebne do rytuału bootstrap agenta.
    - Pełny układ obszaru roboczego + przewodnik kopii zapasowej: [Agent workspace](/pl/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, tryb auth, ekspozycja tailscale.
    - Zalecenie auth: zachowaj **Token** nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelnić.
    - W trybie token interaktywna konfiguracja oferuje:
      - **Generate/store plaintext token** (domyślnie)
      - **Use SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` z providerów `env`, `file` i `exec` dla onboarding probe/dashboard bootstrap.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, onboarding kończy się wcześnie z czytelnym komunikatem naprawczym zamiast po cichu degradować auth runtime.
    - W trybie hasła interaktywna konfiguracja także obsługuje przechowywanie plaintext albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboarding.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindowanie inne niż loopback nadal wymaga auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + audience webhooka.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + base URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB.
    - Bezpieczeństwo DM: domyślnie pairing. Pierwszy DM wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Web search">
    - Wybierz obsługiwanego providera, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG albo Tavily (albo pomiń).
    - Providerzy oparci na API mogą używać zmiennych env albo istniejącej konfiguracji do szybkiej konfiguracji; providerzy bez klucza używają swoich provider-specyficznych wymagań wstępnych.
    - Pomiń przez `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla środowisk headless użyj niestandardowego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Onboarding próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapis do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun jest **niezalecany**.
    - Jeśli auth tokenem wymaga tokena i `gateway.auth.token` jest zarządzane przez SecretRef, instalacja daemona je waliduje, ale nie utrwala rozwiązanych wartości tokena plaintext w metadanych środowiska usługi supervisora.
    - Jeśli auth tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązywalny, instalacja daemona jest blokowana z konkretnymi wskazówkami.
    - Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemona jest blokowana do czasu jawnego ustawienia trybu.
  </Step>
  <Step title="Health check">
    - Uruchamia Gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje do danych wyjściowych statusu live probe zdrowia gateway, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego gateway).
  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: **npm / pnpm** (bun niezalecany).
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

Użyj `--non-interactive`, aby zautomatyzować albo oskryptować onboarding:

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

SecretRef tokena Gateway w trybie nieinteraktywnym:

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
`--json` **nie** implikuje trybu nieinteraktywnego. Dla skryptów używaj `--non-interactive` (i `--workspace`).
</Note>

Przykłady poleceń specyficznych dla providerów znajdują się w [CLI Automation](/pl/start/wizard-cli-automation#provider-specific-examples).
Używaj tej strony dokumentacji dla semantyki flag i kolejności kroków.

### Dodawanie agenta (nieinteraktywnie)

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
Klienci (aplikacja macOS, Control UI) mogą renderować kroki bez ponownego implementowania logiki onboardingu.

## Konfiguracja Signal (`signal-cli`)

Onboarding może zainstalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Przechowuje go pod `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` do konfiguracji.

Uwagi:

- Buildy JVM wymagają **Java 21**.
- Gdy to możliwe, używane są buildy natywne.
- Windows używa WSL2; instalacja `signal-cli` przebiega zgodnie z przepływem Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy brak wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (szczegóły zachowania: [CLI Setup Reference](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy włączysz je podczas promptów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Konfiguracja ręczna nadal może używać `yarn`, ustawiając bezpośrednio `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane pod `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako Pluginy. Gdy wybierzesz taki kanał podczas konfiguracji, onboarding
poprosi o jego instalację (npm albo lokalna ścieżka), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Przegląd onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Gateway configuration](/pl/gateway/configuration)
- Providerzy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (starsze)
- Skills: [Skills](/pl/tools/skills), [Skills config](/pl/tools/skills-config)
