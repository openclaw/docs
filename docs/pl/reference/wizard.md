---
read_when:
    - Szukasz konkretnego kroku onboardingu lub flagi
    - Automatyzujesz onboarding w trybie nieinteraktywnym
    - Debugujesz zachowanie onboardingu
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja onboardingu CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja onboardingu
x-i18n:
    generated_at: "2026-04-05T14:06:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Dokumentacja onboardingu

To jest pełna dokumentacja `openclaw onboard`.
Aby uzyskać ogólny przegląd, zobacz [Onboarding (CLI)](/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Keep / Modify / Reset**.
    - Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset**
      (lub przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuowaniem.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także workspace)
  </Step>
  <Step title="Model/Uwierzytelnianie">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demon.
    - **Anthropic Claude CLI**: preferowana opcja asystenta Anthropic w onboardingu/konfiguracji. W macOS onboarding sprawdza element Keychain „Claude Code-credentials” (wybierz „Always Allow”, aby uruchomienia launchd nie były blokowane); w Linux/Windows używa ponownie `~/.claude/.credentials.json`, jeśli istnieje, i przełącza wybór modelu na kanoniczne odwołanie `claude-cli/claude-*`.
    - **Anthropic setup-token (legacy/manual)**: ponownie dostępne w onboardingu/konfiguracji, ale Anthropic poinformował użytkowników OpenClaw, że ścieżka logowania OpenClaw Claude jest traktowana jako użycie zewnętrznego harnessu i wymaga **Extra Usage** na koncie Claude.
    - **Subskrypcja OpenAI Code (Codex) (Codex CLI)**: jeśli istnieje `~/.codex/auth.json`, onboarding może go ponownie użyć. Ponownie użyte poświadczenia Codex CLI pozostają zarządzane przez Codex CLI; po wygaśnięciu OpenClaw najpierw ponownie odczytuje to źródło, a gdy provider potrafi je odświeżyć, zapisuje odświeżone poświadczenie z powrotem do magazynu Codex zamiast samemu przejmować nad nim kontrolę.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ przeglądarkowy; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model nie jest ustawiony lub ma postać `openai/*`.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` lub `openai-codex/*`.
    - **Klucz API xAI (Grok)**: prosi o `XAI_API_KEY` i konfiguruje xAI jako providera modeli.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go na https://opencode.ai/auth) i pozwala wybrać katalog Zen lub Go.
    - **Ollama**: prosi o base URL Ollama, oferuje tryb **Cloud + Local** lub **Local**, wykrywa dostępne modele i w razie potrzeby automatycznie pobiera wybrany model lokalny.
    - Więcej szczegółów: [Ollama](/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (wielomodelowe proxy)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o Account ID, Gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; hostowany model domyślny to `MiniMax-M2.7`.
      Konfiguracja klucza API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla StepFun standard lub Step Plan na endpointach China albo globalnych.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Skip**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz model domyślny z wykrytych opcji (lub ręcznie wpisz provider/model). Aby uzyskać najlepszą jakość i mniejsze ryzyko prompt injection, wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie providerów.
    - Onboarding uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje uwierzytelniania.
    - Tryb przechowywania kluczy API domyślnie używa jawnych wartości profili uwierzytelniania. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać referencje oparte na env (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` jest starszym źródłem tylko do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla środowisk headless/server: zakończ OAuth na maszynie z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (można zmienić).
    - Tworzy pliki workspace potrzebne do rytuału bootstrapu agenta.
    - Pełny układ workspace + przewodnik po kopiach zapasowych: [Workspace agenta](/pl/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, tryb uwierzytelniania, ekspozycja Tailscale.
    - Zalecenie dotyczące uwierzytelniania: zachowaj **Token** nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena konfiguracja interaktywna oferuje:
      - **Generate/store plaintext token** (domyślnie)
      - **Use SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` przez providery `env`, `file` i `exec` dla sond onboardingu/bootstrapu dashboardu.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, onboarding kończy się wcześnie z jasnym komunikatem naprawczym zamiast po cichu pogarszać uwierzytelnianie runtime.
    - W trybie hasła konfiguracja interaktywna także obsługuje przechowywanie jawnego tekstu lub SecretRef.
    - Ścieżka SecretRef tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłączaj uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie kodem QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka.
    - [Mattermost](/pl/channels/mattermost) (wtyczka): token bota + base URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB.
    - Bezpieczeństwo wiadomości prywatnych: domyślnie używane jest parowanie. Pierwsza wiadomość prywatna wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Wyszukiwanie w internecie">
    - Wybierz obsługiwanego providera, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG lub Tavily (albo pomiń).
    - Providery oparte na API mogą używać zmiennych env lub istniejącej konfiguracji do szybkiej konfiguracji; providery bez klucza używają własnych wymagań wstępnych providera.
    - Pomiń przez `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.
  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla headless użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Onboarding próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway działał dalej po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecany; wymagany dla WhatsApp/Telegram). Bun jest **niezalecany**.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie zapisuje rozwiązanych jawnych wartości tokena w metadanych środowiska usługi nadzorcy.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie jest rozwiązany, instalacja demona jest blokowana z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona jest blokowana do czasu jawnego ustawienia trybu.
  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (jeśli to konieczne) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje sondę stanu działającego gateway do wyjścia statusu, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego gateway).
  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: **npm / pnpm** (bun jest niezalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + kolejne kroki, w tym aplikacje iOS/Android/macOS zapewniające dodatkowe funkcje.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, onboarding wypisuje instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, onboarding próbuje je zbudować; mechanizm zapasowy to `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować onboarding lub tworzyć skrypty:

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

SecretRef tokena gateway w trybie nieinteraktywnym:

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
`--json` **nie** implikuje trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

Przykłady poleceń specyficzne dla providerów znajdują się w [Automatyzacji CLI](/start/wizard-cli-automation#provider-specific-examples).
Używaj tej strony dokumentacji do semantyki flag i kolejności kroków.

### Dodaj agenta (tryb nieinteraktywny)

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

## Konfiguracja Signal (signal-cli)

Onboarding może instalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Zapisuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` do Twojej konfiguracji.

Uwagi:

- Buildy JVM wymagają **Java 21**.
- Buildy natywne są używane, gdy są dostępne.
- Windows używa WSL2; instalacja signal-cli przebiega zgodnie z przepływem Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, bind, uwierzytelnianie, tailscale)
- `session.dmScope` (szczegóły zachowania: [Dokumentacja konfiguracji CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane do identyfikatorów, jeśli to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna może nadal używać `yarn`, ustawiając bezpośrednio `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako wtyczki. Gdy wybierzesz jeden z nich podczas konfiguracji, onboarding
poprosi o jego instalację (npm lub ścieżka lokalna), zanim będzie można go skonfigurować.

## Powiązane dokumenty

- Przegląd onboardingu: [Onboarding (CLI)](/start/wizard)
- Onboarding w aplikacji macOS: [Onboarding](/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Providery: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (legacy)
- Skills: [Skills](/tools/skills), [Konfiguracja Skills](/tools/skills-config)
