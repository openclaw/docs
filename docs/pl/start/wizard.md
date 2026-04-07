---
read_when:
    - Uruchamiasz lub konfigurujesz onboarding CLI
    - Konfigurujesz nową maszynę
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: konfiguracja krok po kroku dla gateway, workspace, kanałów i Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-07T09:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

Onboarding CLI to **zalecany** sposób konfiguracji OpenClaw na macOS,
Linuxie lub Windowsie (przez WSL2; zdecydowanie zalecane).
Konfiguruje lokalny Gateway lub połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia workspace w jednym prowadzonym przepływie.

```bash
openclaw onboard
```

<Info>
Najszybszy pierwszy czat: otwórz Control UI (konfiguracja kanału nie jest potrzebna). Uruchom
`openclaw dashboard` i rozmawiaj w przeglądarce. Dokumentacja: [Dashboard](/web/dashboard).
</Info>

Aby później zmienić konfigurację:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. W skryptach użyj `--non-interactive`.
</Note>

<Tip>
Onboarding CLI zawiera krok wyszukiwania w sieci, w którym możesz wybrać dostawcę,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy dostawcy wymagają
klucza API, podczas gdy inni go nie wymagają. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia web](/pl/tools/web).
</Tip>

## QuickStart a Advanced

Onboarding zaczyna się od wyboru **QuickStart** (ustawienia domyślne) albo **Advanced** (pełna kontrola).

<Tabs>
  <Tab title="QuickStart (ustawienia domyślne)">
    - Lokalny gateway (`loopback`)
    - Domyślny workspace (lub istniejący workspace)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowany automatycznie, nawet na `loopback`)
    - Domyślna polityka narzędzi dla nowych lokalnych konfiguracji: `tools.profile: "coding"` (istniejący jawny profil jest zachowywany)
    - Domyślna izolacja DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, jeśli nie jest ustawione. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **Wyłączona**
    - Telegram i WhatsApp DM domyślnie używają **allowlisty** (zostaniesz poproszony o podanie swojego numeru telefonu)
  </Tab>
  <Tab title="Advanced (pełna kontrola)">
    - Udostępnia każdy krok (tryb, workspace, gateway, kanały, daemon, Skills).
  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** prowadzi Cię przez następujące kroki:

1. **Model/Uwierzytelnianie** — wybierz dowolnego obsługiwanego dostawcę/przepływ uwierzytelniania (klucz API, OAuth lub ręczne uwierzytelnianie specyficzne dla dostawcy), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic lub Unknown auto-detect). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiał narzędzia lub przetwarzał treść webhooków/hooków, preferuj najsilniejszy dostępny model najnowszej generacji i utrzymuj ścisłą politykę narzędzi. Słabsze/starsze klasy są bardziej podatne na prompt injection.
   W uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje referencje oparte na env w profilach uwierzytelniania zamiast jawnych wartości kluczy API.
   W nieinteraktywnym trybie `ref` zmienna środowiskowa dostawcy musi być ustawiona; przekazanie flag z kluczem inline bez tej zmiennej env kończy się natychmiastowym błędem.
   W uruchomieniach interaktywnych wybranie trybu referencji sekretu pozwala wskazać albo zmienną środowiskową, albo skonfigurowaną referencję dostawcy (`file` lub `exec`), z szybką walidacją wstępną przed zapisaniem.
   Dla Anthropic interaktywny onboarding/configure oferuje **Anthropic Claude CLI** jako preferowaną ścieżkę lokalną oraz **Anthropic API key** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token nadal pozostaje dostępną obsługiwaną ścieżką uwierzytelniania tokenem.
2. **Workspace** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Tworzy pliki bootstrap.
3. **Gateway** — port, adres bindowania, tryb uwierzytelniania, ekspozycja Tailscale.
   W interaktywnym trybie tokena wybierz domyślne przechowywanie tokena w jawnym tekście lub przejdź na SecretRef.
   Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i dołączone kanały czatu, takie jak BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Daemon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne zadanie Harmonogramu zadań Windows z zapasowym uruchamianiem z folderu Autostart dla użytkownika.
   Jeśli uwierzytelnianie tokenem wymaga tokena i `gateway.auth.token` jest zarządzane przez SecretRef, instalacja daemon weryfikuje go, ale nie zapisuje rozwiązanego tokena do metadanych środowiska usługi nadzorującej.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef nie może zostać rozwiązany, instalacja daemon jest blokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemon jest blokowana, dopóki tryb nie zostanie ustawiony jawnie.
6. **Kontrola zdrowia** — uruchamia Gateway i sprawdza, czy działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (lub przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia i sesje; użyj `--reset-scope full`, aby objąć też workspace.
Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, onboarding poprosi Cię o wcześniejsze uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do połączenia z Gateway działającym gdzie indziej.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym workspace,
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

Aby uzyskać szczegółowy podział krok po kroku i wyniki konfiguracji, zobacz
[Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [Automatyzacja CLI](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Dokumentacja onboardingu](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja polecenia CLI: [`openclaw onboard`](/cli/onboard)
- Przegląd onboardingu: [Przegląd onboardingu](/pl/start/onboarding-overview)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Bootstrap agenta](/pl/start/bootstrapping)
