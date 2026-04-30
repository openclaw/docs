---
read_when:
    - Wyszukiwanie konkretnego kroku onboardingu lub flagi
    - Automatyzacja wdrażania w trybie nieinteraktywnym
    - Debugowanie zachowania procesu wdrażania
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja referencyjna wdrażania CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja referencyjna wdrażania
x-i18n:
    generated_at: "2026-04-30T10:18:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

To jest pełna dokumentacja referencyjna dla `openclaw onboard`.
Ogólny przegląd znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Zachowaj / Zmień / Zresetuj**.
    - Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że wyraźnie wybierzesz **Reset**
      (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie obejmuje `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuowaniem.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także workspace)

  </Step>
  <Step title="Model/Auth">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez daemona.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic w onboardingu/konfiguracji.
    - **setup-token Anthropic**: nadal dostępny w onboardingu/konfiguracji, choć OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ w przeglądarce; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, `openai/*` albo `openai-codex/*`.
    - **Klucz API xAI (Grok)**: prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`, pobierz go z https://opencode.ai/auth) i pozwala wybrać katalog Zen lub Go.
    - **Ollama**: najpierw oferuje **Chmura + lokalnie**, **Tylko chmura** albo **Tylko lokalnie**. `Cloud only` prosi o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście proszą o bazowy URL Ollama, wykrywają dostępne modele i w razie potrzeby automatycznie pobierają wybrany model lokalny; `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu w chmurze.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (proxy wielomodelowe)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o identyfikator konta, identyfikator Gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślny model hostowany to `MiniMax-M2.7`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na punktach końcowych w Chinach lub globalnych.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Pomiń**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz domyślny model spośród wykrytych opcji (albo ręcznie wpisz dostawcę/model). Dla najlepszej jakości i mniejszego ryzyka prompt-injection wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie dostawców.
    - Onboarding uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.
    - Tryb przechowywania klucza API domyślnie używa wartości profilu uwierzytelniania w tekście jawnym. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać odwołania oparte na zmiennych środowiskowych (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` jest wyłącznie starszym źródłem importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla trybu bez interfejsu/serwera: ukończ OAuth na komputerze z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy początkowe pliki workspace potrzebne do rytuału bootstrap agenta.
    - Pełny układ workspace + przewodnik po kopiach zapasowych: [Workspace agenta](/pl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, tryb uwierzytelniania, ekspozycja przez tailscale.
    - Zalecenie dotyczące uwierzytelniania: pozostaw **Token** nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokenu interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token w tekście jawnym** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRefs `gateway.auth.token` u dostawców `env`, `file` i `exec` na potrzeby próby onboardingu/bootstrapu panelu.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, onboarding kończy się wcześnie z jasnym komunikatem naprawczym zamiast po cichu obniżać poziom uwierzytelniania runtime.
    - W trybie hasła interaktywna konfiguracja obsługuje także przechowywanie w tekście jawnym albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokenu: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + bazowy URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych.
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza DM wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.

  </Step>
  <Step title="Wyszukiwanie w sieci">
    - Wybierz obsługiwanego dostawcę, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG albo Tavily (albo pomiń).
    - Dostawcy oparci na API mogą używać zmiennych środowiskowych albo istniejącej konfiguracji do szybkiej konfiguracji; dostawcy niewymagający klucza używają zamiast tego własnych wymagań wstępnych.
    - Pomiń przez `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.

  </Step>
  <Step title="Instalacja daemona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu bez interfejsu użyj niestandardowego LaunchDaemon (niedostarczany).
    - Linux (oraz Windows przez WSL2): jednostka użytkownika systemd
      - Onboarding próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway pozostał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun **nie jest zalecany**.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja daemona go weryfikuje, ale nie zapisuje rozwiązanych wartości tokenu w tekście jawnym w metadanych środowiska usługi nadzorcy.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja daemona jest blokowana z praktycznymi wskazówkami.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawiony, instalacja daemona jest blokowana do czasu jawnego ustawienia trybu.

  </Step>
  <Step title="Sprawdzenie kondycji">
    - Uruchamia Gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje aktywną próbę kondycji Gateway do wyjścia statusu, w tym próby kanałów, gdy są obsługiwane (wymaga osiągalnego Gateway).

  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: **npm / pnpm** (bun nie jest zalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + następne kroki, w tym aplikacje iOS/Android/macOS dla dodatkowych funkcji.

  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, onboarding wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, onboarding próbuje je zbudować; mechanizmem awaryjnym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować onboarding albo używać go w skryptach:

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

SecretRef tokenu Gateway w trybie nieinteraktywnym:

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
`--json` **nie** oznacza trybu nieinteraktywnego. Użyj `--non-interactive` (oraz `--workspace`) w skryptach.
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
- `gateway.*` (`mode`, `bind`, `auth`, `tailscale`)
- `session.dmScope` (szczegóły zachowania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Ręczna konfiguracja nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako Pluginy. Gdy wybierzesz jeden z nich podczas konfiguracji, wdrażanie
wyświetli monit o jego zainstalowanie (z npm albo ścieżki lokalnej), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Omówienie wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (starsze)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
