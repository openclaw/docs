---
read_when:
    - Wyszukiwanie konkretnego kroku lub flagi wdrażania
    - Automatyzacja wdrażania w trybie nieinteraktywnym
    - Debugowanie działania wdrażania
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja wdrażania w CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja wdrażania
x-i18n:
    generated_at: "2026-04-26T11:41:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

To jest pełna dokumentacja `openclaw onboard`.
Aby zobaczyć ogólny przegląd, zobacz [Wdrażanie (CLI)](/pl/start/wizard).

## Szczegóły przebiegu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Zachowaj / Zmodyfikuj / Zresetuj**.
    - Ponowne uruchomienie wdrażania **nie** czyści niczego, chyba że jawnie wybierzesz **Zresetuj**
      (lub przekażesz `--reset`).
    - `--reset` w CLI domyślnie obejmuje `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzyma się i poprosi
      o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model/Uwierzytelnianie">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, lub pyta o klucz, a następnie zapisuje go do użycia przez demon.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic podczas wdrażania/konfiguracji.
    - **Token konfiguracji Anthropic**: nadal dostępny podczas wdrażania/konfiguracji, chociaż OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ w przeglądarce; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony lub należy już do rodziny OpenAI.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony lub należy już do rodziny OpenAI.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, lub pyta o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, jest `openai/*` lub `openai-codex/*`.
    - **Klucz API xAI (Grok)**: pyta o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
    - **OpenCode**: pyta o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go na stronie https://opencode.ai/auth) i pozwala wybrać katalog Zen lub Go.
    - **Ollama**: najpierw oferuje **Cloud + Local**, **Cloud only** lub **Local only**. `Cloud only` pyta o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście pytają o bazowy URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, gdy jest to potrzebne; `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu do chmury.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (wielomodelowy serwer proxy)**: pyta o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: pyta o Account ID, Gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślnym modelem hostowanym jest `MiniMax-M2.7`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla standardowego StepFun lub Step Plan na chińskich albo globalnych punktach końcowych.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: pyta o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Pomiń**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz model domyślny spośród wykrytych opcji (lub wpisz dostawcę/model ręcznie). Aby uzyskać najlepszą jakość i mniejsze ryzyko prompt injection, wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie dostawców.
    - Wdrażanie uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje uwierzytelniania.
    - Tryb przechowywania kluczy API domyślnie używa wartości profilu uwierzytelniania zapisanych jawnym tekstem. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać odwołania oparte na zmiennych środowiskowych (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` to starsze źródło tylko do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla środowisk bezgłowych/serwerowych: ukończ OAuth na komputerze z przeglądarką, a następnie skopiuj `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` lub odpowiadającą mu ścieżkę
    `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (można skonfigurować).
    - Tworzy pliki obszaru roboczego potrzebne do rytuału bootstrapu agenta.
    - Pełny układ obszaru roboczego + przewodnik tworzenia kopii zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, powiązanie, tryb uwierzytelniania, ekspozycja Tailscale.
    - Zalecenie dotyczące uwierzytelniania: pozostaw **Token** nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelnić.
    - W trybie tokena konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token jawnym tekstem** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` dla dostawców `env`, `file` i `exec` na potrzeby sondy wdrażania/bootstrapu panelu.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, wdrażanie kończy się wcześnie z jasnym komunikatem naprawczym zamiast po cichu pogarszać uwierzytelnianie w czasie działania.
    - W trybie hasła konfiguracja interaktywna również obsługuje przechowywanie jawnym tekstem lub przez SecretRef.
    - Ścieżka SecretRef tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrażania.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu procesowi lokalnemu.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie kodem QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca Webhook.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + bazowy URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych.
    - Bezpieczeństwo wiadomości prywatnych: domyślnie używane jest parowanie. Pierwsza wiadomość prywatna wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` lub użyj list dozwolonych.

  </Step>
  <Step title="Wyszukiwanie w sieci">
    - Wybierz obsługiwanego dostawcę, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG lub Tavily (albo pomiń).
    - Dostawcy oparti na API mogą używać zmiennych środowiskowych lub istniejącej konfiguracji do szybkiej konfiguracji; dostawcy niewymagający klucza używają zamiast tego własnych wymagań wstępnych.
    - Pomiń za pomocą `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.

  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; w przypadku środowisk bezgłowych użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Wdrażanie próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór środowiska uruchomieniowego:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun **nie jest zalecany**.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie utrwala rozwiązanych jawnych wartości tokena w metadanych środowiska usługi nadzorcy.
    - Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie jest rozwiązany, instalacja demona jest blokowana z instrukcjami możliwymi do wykonania.
    - Jeśli skonfigurowane są jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona jest blokowana do momentu jawnego ustawienia trybu.

  </Step>
  <Step title="Kontrola stanu">
    - Uruchamia Gateway (jeśli to konieczne) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje sondę stanu działającego Gateway do danych wyjściowych statusu, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego Gateway).

  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: **npm / pnpm** (bun nie jest zalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew w systemie macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + kolejne kroki, w tym aplikacje iOS/Android/macOS dla dodatkowych funkcji.

  </Step>
</Steps>

<Note>
Jeśli nie zostanie wykryty interfejs GUI, wdrażanie wypisze instrukcje przekierowania portów SSH dla interfejsu Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów interfejsu Control UI, wdrażanie podejmie próbę ich zbudowania; trybem zapasowym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować lub oskryptować wdrażanie:

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
`--json` **nie** oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

Przykłady poleceń specyficznych dla dostawców znajdują się w [Automatyzacja CLI](/pl/start/wizard-cli-automation#provider-specific-examples).
Używaj tej strony dokumentacji jako źródła semantyki flag i kolejności kroków.

### Dodawanie agenta (tryb nieinteraktywny)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC kreatora Gateway

Gateway udostępnia przebieg wdrażania przez RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienci (aplikacja macOS, Control UI) mogą renderować kroki bez ponownego implementowania logiki wdrażania.

## Konfiguracja Signal (`signal-cli`)

Wdrażanie może zainstalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Zapisuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` do Twojej konfiguracji.

Uwagi:

- Kompilacje JVM wymagają **Java 21**.
- Gdy są dostępne, używane są kompilacje natywne.
- Windows używa WSL2; instalacja signal-cli przebiega według ścieżki Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalne wdrażanie domyślnie ustawia `"coding"`, jeśli wartość nie jest ustawiona; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, powiązanie, uwierzytelnianie, Tailscale)
- `session.dmScope` (szczegóły działania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy wybierzesz tę opcję w promptach (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna nadal może używać `yarn`, ustawiając bezpośrednio `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako Pluginy. Gdy wybierzesz jeden z nich podczas konfiguracji, wdrażanie
poprosi o jego zainstalowanie (npm lub ścieżka lokalna), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Przegląd wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (starsza wersja)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
