---
read_when:
    - Wyszukiwanie konkretnego kroku onboardingu lub flagi
    - Automatyzowanie onboardingu w trybie nieinteraktywnym
    - Debugowanie zachowania onboardingu
sidebarTitle: Onboarding Reference
summary: 'Pełne odniesienie do onboardingu CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja referencyjna onboardingu
x-i18n:
    generated_at: "2026-06-27T18:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

To jest pełna dokumentacja referencyjna dla `openclaw onboard`.
Ogólny opis znajdziesz w [Wprowadzanie (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Zachowaj bieżące wartości**, **Przejrzyj i zaktualizuj** albo **Zresetuj przed konfiguracją**.
    - Ponowne uruchomienie wprowadzania **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset**
      (lub przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera przestarzałe klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + dane uwierzytelniające + sesje
      - Pełny reset (usuwa także obszar roboczy)

  </Step>
  <Step title="Model/uwierzytelnianie">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez demona.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic we wprowadzaniu/konfiguracji.
    - **Anthropic setup-token**: nadal dostępny we wprowadzaniu/konfiguracji, choć OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ w przeglądarce; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5` przez środowisko uruchomieniowe Codex, gdy model nie jest ustawiony albo już należy do rodziny OpenAI.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach uwierzytelniania.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.5`, gdy model nie jest ustawiony, ma postać `openai/*` albo jest przestarzałym odwołaniem do modelu Codex.
    - **xAI (Grok) OAuth / klucz API**: loguje przez xAI OAuth po wybraniu tej opcji albo prosi o `XAI_API_KEY` w ścieżce klucza API i konfiguruje xAI jako dostawcę modelu.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go z https://opencode.ai/auth) i pozwala wybrać katalog Zen albo Go.
    - **Ollama**: najpierw oferuje **Chmura + lokalnie**, **Tylko chmura** albo **Tylko lokalnie**. `Cloud only` prosi o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście proszą o bazowy URL Ollama, wykrywają dostępne modele i w razie potrzeby automatycznie pobierają wybrany model lokalny; `Cloud + Local` sprawdza także, czy ten host Ollama jest zalogowany do dostępu w chmurze.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (proxy wielu modeli)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o ID konta, ID Gateway i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślna wartość hostowana to `MiniMax-M3`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla standardowego StepFun albo Step Plan na punktach końcowych chińskich lub globalnych.
    - Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Pomiń**: uwierzytelnianie nie jest jeszcze skonfigurowane.
    - Wybierz model domyślny z wykrytych opcji (albo ręcznie wprowadź dostawcę/model). Aby uzyskać najlepszą jakość i niższe ryzyko wstrzyknięcia promptu, wybierz najsilniejszy dostępny model najnowszej generacji w swoim stosie dostawców.
    - Wprowadzanie uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje uwierzytelniania.
    - Tryb przechowywania kluczy API domyślnie używa wartości profilu uwierzytelniania w postaci zwykłego tekstu. Użyj `--secret-input-mode ref`, aby zamiast tego przechowywać odwołania oparte na zmiennych środowiskowych (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile uwierzytelniania znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` jest wyłącznie przestarzałym źródłem importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla trybu bezgłowego/serwera: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
    jest tylko przestarzałym źródłem importu.
    </Note>
  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Inicjuje pliki obszaru roboczego potrzebne do rytuału startowego agenta.
    - Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, powiązanie, tryb uwierzytelniania, ekspozycja tailscale.
    - Zalecenie dotyczące uwierzytelniania: zachowaj **Token** nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelnić.
    - W trybie tokenu konfiguracja interaktywna oferuje:
      - **Wygeneruj/zapisz token w zwykłym tekście** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` u dostawców `env`, `file` i `exec` na potrzeby sondy wprowadzania/uruchomienia dashboardu.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, wprowadzanie kończy się wcześnie jasnym komunikatem naprawczym zamiast po cichu obniżać poziom uwierzytelniania środowiska uruchomieniowego.
    - W trybie hasła konfiguracja interaktywna obsługuje także przechowywanie w zwykłym tekście albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokenu: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu wprowadzania.
      - Nie można jej łączyć z `--gateway-token`.
    - Wyłącz uwierzytelnianie tylko wtedy, gdy w pełni ufasz każdemu procesowi lokalnemu.
    - Powiązania inne niż loopback nadal wymagają uwierzytelniania.

  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + odbiorca webhooka.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + bazowy URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [iMessage](/pl/channels/imessage): ścieżka CLI `imsg` + dostęp do bazy danych Messages; użyj opakowania SSH, gdy Gateway działa poza komputerem Mac.
    - Bezpieczeństwo wiadomości prywatnych: domyślnie używane jest parowanie. Pierwsza wiadomość prywatna wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.

  </Step>
  <Step title="Wyszukiwanie w sieci">
    - Wybierz obsługiwanego dostawcę, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG lub Tavily (albo pomiń).
    - Dostawcy oparci na API mogą używać zmiennych środowiskowych albo istniejącej konfiguracji do szybkiej konfiguracji; dostawcy bez klucza używają zamiast tego swoich wymagań wstępnych specyficznych dla dostawcy.
    - Pomiń za pomocą `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.

  </Step>
  <Step title="Instalacja demona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; w trybie bezgłowym użyj niestandardowego LaunchDaemon (niedostarczany).
    - Linux (i Windows przez WSL2): jednostka użytkownika systemd
      - Wprowadzanie próbuje włączyć pozostawanie po wylogowaniu przez `loginctl enable-linger <user>`, aby Gateway działał dalej po wylogowaniu.
      - Może poprosić o sudo (zapisuje `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór środowiska uruchomieniowego:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun **nie jest zalecany**.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie utrwala rozwiązanych wartości tokenu w zwykłym tekście w metadanych środowiska usługi nadzorcy.
    - Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja demona zostaje zablokowana z praktycznymi wskazówkami.
    - Jeśli skonfigurowano jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona zostaje zablokowana do czasu jawnego ustawienia trybu.

  </Step>
  <Step title="Sprawdzenie kondycji">
    - Uruchamia Gateway (w razie potrzeby) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje sondę kondycji aktywnego gatewaya do wyjścia statusu, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego gatewaya).

  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera node: **npm / pnpm** (bun niezalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).

  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + następne kroki, w tym prompt **Jak chcesz wykluć swojego agenta?** dla terminala, przeglądarki albo później.

  </Step>
</Steps>

<Note>
Jeśli GUI nie zostanie wykryte, wprowadzanie wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, wprowadzanie próbuje je zbudować; rozwiązaniem awaryjnym jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować albo oskryptować wprowadzanie:

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

Gateway udostępnia przepływ wprowadzania przez RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienci (aplikacja macOS, Control UI) mogą renderować kroki bez ponownego implementowania logiki wprowadzania.

## Konfiguracja Signal (signal-cli)

Wprowadzanie może zainstalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` w Twojej konfiguracji.

Uwagi:

- Kompilacje JVM wymagają **Java 21**.
- Kompilacje natywne są używane, gdy są dostępne.
- Windows używa WSL2; instalacja signal-cli przebiega zgodnie z przepływem Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano Minimax)
- `tools.profile` (lokalne wdrażanie domyślnie używa `"coding"`, gdy nie ustawiono wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (szczegóły działania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy włączysz je podczas monitów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Konfiguracja ręczna nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Dane uwierzytelniające WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako pluginy. Gdy wybierzesz taki kanał podczas konfiguracji, wdrażanie
wyświetli monit o jego zainstalowanie (npm lub ścieżka lokalna), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Omówienie wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dostawcy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [iMessage](/pl/channels/imessage)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
