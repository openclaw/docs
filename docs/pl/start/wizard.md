---
read_when:
    - Uruchamiasz lub konfigurujesz onboarding CLI
    - Konfigurujesz nową maszynę
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: konfiguracja krok po kroku dla gateway, workspace, kanałów i Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-05T14:06:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

Onboarding CLI to **zalecany** sposób konfiguracji OpenClaw w systemach macOS,
Linux lub Windows (przez WSL2; zdecydowanie zalecane).
Konfiguruje lokalny Gateway lub połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia workspace w jednym prowadzonym przepływie.

```bash
openclaw onboard
```

<Info>
Najszybszy sposób na pierwszy czat: otwórz Control UI (konfiguracja kanałów nie jest potrzebna). Uruchom
`openclaw dashboard` i rozmawiaj w przeglądarce. Dokumentacja: [Dashboard](/web/dashboard).
</Info>

Aby później zmienić konfigurację:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. Dla skryptów użyj `--non-interactive`.
</Note>

<Tip>
Onboarding CLI obejmuje krok wyszukiwania w internecie, w którym możesz wybrać providera,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy providerzy wymagają
klucza API, a inni nie. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia internetowe](/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding rozpoczyna się od wyboru **QuickStart** (domyślne ustawienia) lub **Advanced** (pełna kontrola).

<Tabs>
  <Tab title="QuickStart (ustawienia domyślne)">
    - Lokalny gateway (loopback)
    - Domyślny workspace (lub istniejący workspace)
    - Port gateway **18789**
    - Uwierzytelnianie gateway **Token** (generowane automatycznie, nawet dla loopback)
    - Domyślna polityka narzędzi dla nowych konfiguracji lokalnych: `tools.profile: "coding"` (istniejący jawny profil jest zachowywany)
    - Domyślna izolacja DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, jeśli nie jest ustawione. Szczegóły: [Dokumentacja konfiguracji CLI](/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **Wyłączona**
    - Wiadomości prywatne Telegram + WhatsApp domyślnie używają **allowlist** (pojawi się prośba o podanie numeru telefonu)
  </Tab>
  <Tab title="Advanced (pełna kontrola)">
    - Udostępnia każdy krok (tryb, workspace, gateway, kanały, demon, Skills).
  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** prowadzi przez następujące kroki:

1. **Model/Uwierzytelnianie** — wybierz dowolny obsługiwany przepływ provider/uwierzytelniania (klucz API, OAuth lub ręczne uwierzytelnianie specyficzne dla providera), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic lub Unknown z automatycznym wykrywaniem). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiał narzędzia lub przetwarzał treści webhooków/hooków, preferuj najsilniejszy dostępny model najnowszej generacji i utrzymuj ścisłą politykę narzędzi. Słabsze/starsze poziomy łatwiej poddać prompt injection.
   W uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje referencje oparte na env w profilach uwierzytelniania zamiast jawnych wartości kluczy API.
   W nieinteraktywnym trybie `ref` zmienna env providera musi być ustawiona; przekazanie flag z kluczem inline bez tej zmiennej env kończy się natychmiastowym błędem.
   W uruchomieniach interaktywnych wybór trybu referencji sekretu pozwala wskazać zmienną środowiskową albo skonfigurowaną referencję providera (`file` lub `exec`), z szybką walidacją preflight przed zapisaniem.
   Dla Anthropic onboarding/konfiguracja interaktywna oferuje **Anthropic Claude CLI** jako lokalny fallback oraz **klucz API Anthropic** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token jest także ponownie dostępny jako starsza/ręczna ścieżka OpenClaw, z oczekiwaniem rozliczeniowym Anthropic dotyczącym **Extra Usage** specyficznym dla OpenClaw.
2. **Workspace** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Tworzy pliki bootstrap.
3. **Gateway** — port, adres bind, tryb uwierzytelniania, ekspozycja Tailscale.
   W interaktywnym trybie tokena wybierz domyślne przechowywanie tokena jako jawny tekst albo opcjonalnie SecretRef.
   Ścieżka SecretRef tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i dołączone kanały czatu, takie jak BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Demon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne zadanie zaplanowane Windows z awaryjnym per-user fallbackiem do folderu Startup.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja demona weryfikuje go, ale nie zapisuje rozwiązanego tokena w metadanych środowiska usługi nadzorcy.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie jest rozwiązany, instalacja demona jest blokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona jest blokowana do czasu jawnego ustawienia trybu.
6. **Kontrola stanu** — uruchamia Gateway i weryfikuje, że działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (lub przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia i sesje; użyj `--reset-scope full`, aby uwzględnić workspace.
Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, onboarding poprosi o najpierw uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do połączenia z Gateway znajdującym się gdzie indziej.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć oddzielnego agenta z własnym workspace,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` uruchamia onboarding.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne workspace mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby routować wiadomości przychodzące (onboarding może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Aby uzyskać szczegółowy opis krok po kroku i danych wyjściowych konfiguracji, zobacz
[Dokumentacja konfiguracji CLI](/start/wizard-cli-reference).
Aby zobaczyć przykłady nieinteraktywne, zobacz [Automatyzacja CLI](/start/wizard-cli-automation).
Aby uzyskać głębszą dokumentację techniczną, w tym szczegóły RPC, zobacz
[Dokumentacja onboardingu](/reference/wizard).

## Powiązane dokumenty

- Dokumentacja polecenia CLI: [`openclaw onboard`](/cli/onboard)
- Przegląd onboardingu: [Przegląd onboardingu](/start/onboarding-overview)
- Onboarding w aplikacji macOS: [Onboarding](/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Bootstrap agenta](/start/bootstrapping)
