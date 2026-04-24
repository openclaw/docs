---
read_when:
    - Uruchamianie lub konfigurowanie onboardingu CLI
    - Konfigurowanie nowej maszyny
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: konfiguracja z przewodnikiem dla gateway, obszaru roboczego, kanałów i Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T09:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

Onboarding CLI to **zalecany** sposób konfiguracji OpenClaw na macOS,
Linux lub Windows (przez WSL2; zdecydowanie zalecane).
Konfiguruje lokalny Gateway albo połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia obszaru roboczego w jednym prowadzonym przepływie.

```bash
openclaw onboard
```

<Info>
Najszybszy pierwszy czat: otwórz Control UI (konfiguracja kanałów nie jest potrzebna). Uruchom
`openclaw dashboard` i czatuj w przeglądarce. Dokumentacja: [Dashboard](/pl/web/dashboard).
</Info>

Aby później skonfigurować ponownie:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. Dla skryptów użyj `--non-interactive`.
</Note>

<Tip>
Onboarding CLI obejmuje krok wyszukiwania w internecie, w którym możesz wybrać dostawcę,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy dostawcy wymagają
klucza API, podczas gdy inni są bezkluczowi. Możesz też skonfigurować to później przez
`openclaw configure --section web`. Dokumentacja: [Narzędzia internetowe](/pl/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding zaczyna się od wyboru **QuickStart** (ustawienia domyślne) albo **Advanced** (pełna kontrola).

<Tabs>
  <Tab title="QuickStart (ustawienia domyślne)">
    - Lokalny gateway (loopback)
    - Domyślny obszar roboczy (lub istniejący obszar roboczy)
    - Port Gateway **18789**
    - Gateway auth **Token** (generowany automatycznie, nawet na loopback)
    - Domyślna polityka narzędzi dla nowych lokalnych konfiguracji: `tools.profile: "coding"` (istniejący jawny profil jest zachowywany)
    - Domyślna izolacja DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, jeśli nie jest ustawione. Szczegóły: [CLI Setup Reference](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **Wyłączona**
    - Domyślnie Telegram + WhatsApp DM używają **allowlist** (zostaniesz poproszony o podanie swojego numeru telefonu)
  </Tab>
  <Tab title="Advanced (pełna kontrola)">
    - Ujawnia każdy krok (tryb, obszar roboczy, gateway, kanały, daemon, Skills).
  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** przeprowadza cię przez te kroki:

1. **Model/Auth** — wybierz dowolny obsługiwany przepływ dostawcy/auth (klucz API, OAuth albo ręczny auth specyficzny dla dostawcy), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic albo Unknown auto-detect). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiać narzędzia albo przetwarzać treść webhook/hooks, wybieraj najsilniejszy dostępny model najnowszej generacji i utrzymuj ścisłą politykę narzędzi. Słabsze/starsze poziomy łatwiej poddają się prompt injection.
   Dla przebiegów nieinteraktywnych `--secret-input-mode ref` przechowuje referencje oparte na env w profilach auth zamiast jawnych wartości kluczy API.
   W nieinteraktywnym trybie `ref` zmienna env dostawcy musi być ustawiona; przekazywanie inline flag klucza bez tej zmiennej env kończy się natychmiastowym błędem.
   W przebiegach interaktywnych wybór trybu secret reference pozwala wskazać albo zmienną środowiskową, albo skonfigurowaną referencję dostawcy (`file` albo `exec`), z szybkim sprawdzeniem wstępnym przed zapisaniem.
   Dla Anthropic interaktywne onboarding/configure oferuje **Anthropic Claude CLI** jako preferowaną ścieżkę lokalną i **Anthropic API key** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token pozostaje także dostępny jako obsługiwana ścieżka auth oparta na tokenie.
2. **Workspace** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Zasiewa pliki bootstrapowania.
3. **Gateway** — port, adres bind, tryb auth, ekspozycja Tailscale.
   W interaktywnym trybie tokenu wybierz domyślne przechowywanie tokenu jako plaintext albo przejdź na SecretRef.
   Nieinteraktywna ścieżka tokenu SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — wbudowane i dołączone kanały czatu, takie jak BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Daemon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne zadanie Scheduled Task w Windows z per-user fallbackiem do folderu Startup.
   Jeśli token auth wymaga tokenu i `gateway.auth.token` jest zarządzane przez SecretRef, instalacja daemon weryfikuje go, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi supervisor.
   Jeśli token auth wymaga tokenu, a skonfigurowany token SecretRef nie może zostać rozwiązany, instalacja daemon jest blokowana z konkretnymi wskazówkami.
   Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemon jest blokowana do czasu jawnego ustawienia trybu.
6. **Health check** — uruchamia Gateway i weryfikuje, że działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (albo przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje config, poświadczenia i sesje; użyj `--reset-scope full`, aby uwzględnić obszar roboczy.
Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, onboarding poprosi cię najpierw o uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do łączenia się z Gateway działającym gdzie indziej.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami auth. Uruchomienie bez `--workspace` rozpoczyna onboarding.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby kierować wiadomości przychodzące (onboarding potrafi to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja referencyjna

Szczegółowy opis krok po kroku i wyników konfiguracji znajdziesz w
[CLI Setup Reference](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [CLI Automation](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Onboarding Reference](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)
- Przegląd onboardingu: [Onboarding Overview](/pl/start/onboarding-overview)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Agent Bootstrapping](/pl/start/bootstrapping)
