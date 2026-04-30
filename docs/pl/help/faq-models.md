---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Omówienie profili uwierzytelniania i zarządzania nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne modele, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-04-30T09:58:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Model- and auth-profile Q&A. For setup, sessions, gateway, channels, and
  troubleshooting, see the main [FAQ](/pl/help/faq).

  ## Models: defaults, selection, aliases, switching

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    OpenClaw's default model is whatever you set as:

    ```
    agents.defaults.model.primary
    ```

    Models are referenced as `provider/model` (example: `openai/gpt-5.5` or `openai-codex/gpt-5.5`). If you omit the provider, OpenClaw first tries an alias, then a unique configured-provider match for that exact model id, and only then falls back to the configured default provider as a deprecated compatibility path. If that provider no longer exposes the configured default model, OpenClaw falls back to the first configured provider/model instead of surfacing a stale removed-provider default. You should still **explicitly** set `provider/model`.

  </Accordion>

  <Accordion title="What model do you recommend?">
    **Recommended default:** use the strongest latest-generation model available in your provider stack.
    **For tool-enabled or untrusted-input agents:** prioritize model strength over cost.
    **For routine/low-stakes chat:** use cheaper fallback models and route by agent role.

    MiniMax has its own docs: [MiniMax](/pl/providers/minimax) and
    [Local models](/pl/gateway/local-models).

    Rule of thumb: use the **best model you can afford** for high-stakes work, and a cheaper
    model for routine chat or summaries. You can route models per agent and use sub-agents to
    parallelize long tasks (each sub-agent consumes tokens). See [Models](/pl/concepts/models) and
    [Sub-agents](/pl/tools/subagents).

    Strong warning: weaker/over-quantized models are more vulnerable to prompt
    injection and unsafe behavior. See [Security](/pl/gateway/security).

    More context: [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    Use **model commands** or edit only the **model** fields. Avoid full config replaces.

    Safe options:

    - `/model` in chat (quick, per-session)
    - `openclaw models set ...` (updates just model config)
    - `openclaw configure --section model` (interactive)
    - edit `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Avoid `config.apply` with a partial object unless you intend to replace the whole config.
    For RPC edits, inspect with `config.schema.lookup` first and prefer `config.patch`. The lookup payload gives you the normalized path, shallow schema docs/constraints, and immediate child summaries.
    for partial updates.
    If you did overwrite config, restore from backup or re-run `openclaw doctor` to repair.

    Docs: [Models](/pl/concepts/models), [Configure](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    Yes. Ollama is the easiest path for local models.

    Quickest setup:

    1. Install Ollama from `https://ollama.com/download`
    2. Pull a local model such as `ollama pull gemma4`
    3. If you want cloud models too, run `ollama signin`
    4. Run `openclaw onboard` and choose `Ollama`
    5. Pick `Local` or `Cloud + Local`

    Notes:

    - `Cloud + Local` gives you cloud models plus your local Ollama models
    - cloud models such as `kimi-k2.5:cloud` do not need a local pull
    - for manual switching, use `openclaw models list` and `openclaw models set ollama/<model>`

    Security note: smaller or heavily quantized models are more vulnerable to prompt
    injection. We strongly recommend **large models** for any bot that can use tools.
    If you still want small models, enable sandboxing and strict tool allowlists.

    Docs: [Ollama](/pl/providers/ollama), [Local models](/pl/gateway/local-models),
    [Model providers](/pl/concepts/model-providers), [Security](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - These deployments can differ and may change over time; there is no fixed provider recommendation.
    - Check the current runtime setting on each gateway with `openclaw models status`.
    - For security-sensitive/tool-enabled agents, use the strongest latest-generation model available.

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
    Use the `/model` command as a standalone message:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    These are the built-in aliases. Custom aliases can be added via `agents.defaults.models`.

    You can list available models with `/model`, `/model list`, or `/model status`.

    `/model` (and `/model list`) shows a compact, numbered picker. Select by number:

    ```
    /model 3
    ```

    You can also force a specific auth profile for the provider (per session):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` shows which agent is active, which `auth-profiles.json` file is being used, and which auth profile will be tried next.
    It also shows the configured provider endpoint (`baseUrl`) and API mode (`api`) when available.

    **How do I unpin a profile I set with @profile?**

    Re-run `/model` **without** the `@profile` suffix:

    ```
    /model anthropic/claude-opus-4-6
    ```

    If you want to return to the default, pick it from `/model` (or send `/model <default provider/model>`).
    Use `/model status` to confirm which auth profile is active.

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    Yes. Set one as default and switch as needed:

    - **Quick switch (per session):** `/model openai/gpt-5.5` for current direct OpenAI API-key tasks or `/model openai-codex/gpt-5.5` for GPT-5.5 Codex OAuth tasks.
    - **Default:** set `agents.defaults.model.primary` to `openai/gpt-5.5` for API-key usage or `openai-codex/gpt-5.5` for GPT-5.5 Codex OAuth usage.
    - **Sub-agents:** route coding tasks to sub-agents with a different default model.

    See [Models](/pl/concepts/models) and [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    Use either a session toggle or a config default:

    - **Per session:** send `/fast on` while the session is using `openai/gpt-5.5` or `openai-codex/gpt-5.5`.
    - **Per model default:** set `agents.defaults.models["openai/gpt-5.5"].params.fastMode` or `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` to `true`.

    Example:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    For OpenAI, fast mode maps to `service_tier = "priority"` on supported native Responses requests. Session `/fast` overrides beat config defaults.

    See [Thinking and fast mode](/pl/tools/thinking) and [OpenAI fast mode](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    If `agents.defaults.models` is set, it becomes the **allowlist** for `/model` and any
    session overrides. Choosing a model that isn't in that list returns:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    That error is returned **instead of** a normal reply. Fix: add the model to
    `agents.defaults.models`, remove the allowlist, or pick a model from `/model list`.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    This means the **provider isn't configured** (no MiniMax provider config or auth
    profile was found), so the model can't be resolved.

    Fix checklist:

    1. Upgrade to a current OpenClaw release (or run from source `main`), then restart the gateway.
    2. Make sure MiniMax is configured (wizard or JSON), or that MiniMax auth
       exists in env/auth profiles so the matching provider can be injected
       (`MINIMAX_API_KEY` for `minimax`, `MINIMAX_OAUTH_TOKEN` or stored MiniMax
       OAuth for `minimax-portal`).
    3. Use the exact model id (case-sensitive) for your auth path:
       `minimax/MiniMax-M2.7` or `minimax/MiniMax-M2.7-highspeed` for API-key
       setup, or `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` for OAuth setup.
    4. Run:

       ```bash
       openclaw models list
       ```

       and pick from the list (or `/model list` in chat).

    See [MiniMax](/pl/providers/minimax) and [Models](/pl/concepts/models).

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    Yes. Use **MiniMax as the default** and switch models **per session** when needed.
    Fallbacks are for **errors**, not "hard tasks," so use `/model` or a separate agent.

    **Option A: switch per session**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Then:

    ```
    /model gpt
    ```

    **Option B: separate agents**

    - Agent A default: MiniMax
    - Agent B default: OpenAI
    - Route by agent or use `/agent` to switch

    Docs: [Models](/pl/concepts/models), [Multi-Agent Routing](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    Yes. OpenClaw ships a few default shorthands (only applied when the model exists in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` for API-key setups, or `openai-codex/gpt-5.5` when configured for Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    If you set your own alias with the same name, your value wins.

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
    Aliases come from `agents.defaults.models.<modelId>.alias`. Example:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Then `/model sonnet` (or `/<alias>` when supported) resolves to that model ID.

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
    OpenRouter (pay-per-token; many models):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM models):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jeśli odwołasz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd uwierzytelniania w czasie działania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest osobne dla każdego agenta i
    jest przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje on własnego konta; w przeciwnym razie OpenClaw może odczytywać dane z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „All models failed”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Awaryjny wybór modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Okresy wyciszenia dotyczą profili, które zawodzą (wykładnicze opóźnienie ponawiania), dzięki czemu OpenClaw może nadal odpowiadać, nawet gdy dostawca ma ograniczoną przepustowość lub tymczasowo zawodzi.

    Kategoria limitów szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do przełączenia awaryjnego.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tej przejściowej kategorii. Jeśli dostawca zwróci
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw może nadal utrzymać go w
    ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak możliwe do ponowienia okno użycia lub
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długie wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do
    awaryjnego wyboru modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „wszystko, co zawiera
    unknown/error”. OpenClaw traktuje tymczasowe kształty ograniczone do dostawcy,
    takie jak surowe `An unknown error occurred` od Anthropic, surowe
    `Provider returned error` od OpenRouter, błędy przyczyn zatrzymania typu `Unhandled stop reason:
    error`, ładunki JSON `api_error` z tymczasowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, jako
    sygnały limitu czasu/przeciążenia kwalifikujące się do przełączenia awaryjnego, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown
    error.`, pozostaje konserwatywny i sam nie wyzwala awaryjnego wyboru modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe i starsze ścieżki)
      - Bieżąca: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsza: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchomisz Gateway przez systemd/launchd, może jej nie dziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje z wieloma agentami oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Wykonaj kontrolę poprawności stanu modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście bramy.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście bramy**.
      - Wyczyść przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście bramy**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie bramy, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego spróbowano też Google Gemini i zakończyło się to niepowodzeniem?">
    Jeśli konfiguracja modelu obejmuje Google Gemini jako opcję awaryjną (albo przełączysz się na skrót Gemini), OpenClaw spróbuje go podczas awaryjnego wyboru modelu. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby ścieżka awaryjna nie kierowała do nich.

    **Żądanie LLM odrzucone: wymagana sygnatura myślenia (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki myślenia bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków myślenia.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki myślenia dla Google Antigravity Claude. Jeśli problem nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth lub klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - niestandardowe identyfikatory wybrane przez Ciebie (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane dla profili oraz kolejność dla każdego dostawcy (`auth.order.<provider>`). Nie przechowuje to **żadnych** sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się w krótkim **okresie wyciszenia** (limity szybkości/limity czasu/niepowodzenia uwierzytelniania) lub w dłuższym stanie **wyłączonym** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wyciszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest wyciszony
    dla jednego modelu, może nadal nadawać się do użycia dla pokrewnego modelu u tego samego dostawcy,
    natomiast okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **dla agenta** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby sprawdzić, co faktycznie zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, próba zgłasza
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth a klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba rozwiązania:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (gdy ma zastosowanie).
    - **Klucze API** używają rozliczeń płatnych za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth oraz klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
