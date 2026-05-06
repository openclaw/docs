---
read_when:
    - Uruchamianie lub konfigurowanie procesu wdrażania CLI
    - Konfigurowanie nowej maszyny
sidebarTitle: 'Onboarding: CLI'
summary: 'Wprowadzenie do CLI: prowadzona konfiguracja Gateway, obszaru roboczego, kanałów i Skills'
title: Wprowadzenie (CLI)
x-i18n:
    generated_at: "2026-05-06T09:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding to **zalecany** sposób konfiguracji OpenClaw w systemach macOS,
Linux lub Windows (przez WSL2; zdecydowanie zalecane).
Konfiguruje lokalny Gateway lub połączenie ze zdalnym Gateway, a także kanały, skills
i domyślne ustawienia obszaru roboczego w jednym prowadzonym procesie.

```bash
openclaw onboard
```

<Info>
Najszybszy pierwszy czat: otwórz interfejs Control UI (konfiguracja kanału nie jest potrzebna). Uruchom
`openclaw dashboard` i czatuj w przeglądarce. Dokumentacja: [Panel](/pl/web/dashboard).
</Info>

Aby zmienić konfigurację później:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>

<Tip>
CLI onboarding obejmuje krok wyszukiwania w sieci, w którym możesz wybrać dostawcę,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy dostawcy wymagają
klucza API, a inni działają bez klucza. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia webowe](/pl/tools/web).
</Tip>

## Szybki start a zaawansowane

Onboarding zaczyna się od wyboru **Szybki start** (ustawienia domyślne) albo **Zaawansowane** (pełna kontrola).

<Tabs>
  <Tab title="Szybki start (ustawienia domyślne)">
    - Lokalny Gateway (loopback)
    - Domyślny obszar roboczy (lub istniejący obszar roboczy)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowane automatycznie, nawet na loopback)
    - Domyślna polityka narzędzi dla nowych konfiguracji lokalnych: `tools.profile: "coding"` (istniejący jawny profil zostaje zachowany)
    - Domyślna izolacja wiadomości DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, gdy nie jest ustawione. Szczegóły: [Dokumentacja referencyjna konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Udostępnienie przez Tailscale **Wyłączone**
    - Wiadomości DM w Telegram + WhatsApp domyślnie używają **listy dozwolonych** (pojawi się prośba o podanie numeru telefonu)

  </Tab>
  <Tab title="Zaawansowane (pełna kontrola)">
    - Udostępnia każdy krok (tryb, obszar roboczy, gateway, kanały, daemon, skills).

  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** prowadzi przez następujące kroki:

1. **Model/Auth** — wybierz dowolnego obsługiwanego dostawcę lub przepływ uwierzytelniania (klucz API, OAuth albo ręczne uwierzytelnianie specyficzne dla dostawcy), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic albo Unknown z automatycznym wykrywaniem). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiał narzędzia lub przetwarzał zawartość webhook/hooks, wybierz najsilniejszy dostępny model najnowszej generacji i utrzymuj rygorystyczną politykę narzędzi. Słabsze/starsze poziomy łatwiej poddać prompt injection.
   W uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje referencje oparte na zmiennych środowiskowych w profilach uwierzytelniania zamiast wartości kluczy API w postaci zwykłego tekstu.
   W nieinteraktywnym trybie `ref` zmienna środowiskowa dostawcy musi być ustawiona; przekazanie flag klucza inline bez tej zmiennej środowiskowej szybko kończy się błędem.
   W uruchomieniach interaktywnych wybór trybu referencji sekretu pozwala wskazać zmienną środowiskową albo skonfigurowaną referencję dostawcy (`file` lub `exec`), z szybką walidacją przed zapisem.
   Dla Anthropic interaktywny onboarding/configure oferuje **Anthropic Claude CLI** jako preferowaną ścieżkę lokalną oraz **Anthropic API key** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token pozostaje też dostępny jako obsługiwana ścieżka uwierzytelniania tokenem.
2. **Obszar roboczy** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Tworzy pliki startowe.
3. **Gateway** — port, adres wiązania, tryb uwierzytelniania, udostępnienie przez Tailscale.
   W interaktywnym trybie tokenu wybierz domyślne przechowywanie tokenu w postaci zwykłego tekstu albo przełącz się na SecretRef.
   Nieinteraktywna ścieżka tokenu SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i dołączone kanały czatu, takie jak BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Daemon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne zadanie Windows Scheduled Task z awaryjnym użyciem folderu Startup dla danego użytkownika.
   Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja daemona go waliduje, ale nie utrwala rozwiązanego tokenu w metadanych środowiska usługi nadzorującej.
   Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, instalacja daemona zostaje zablokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemona zostaje zablokowana do czasu jawnego ustawienia trybu.
6. **Kontrola kondycji** — uruchamia Gateway i sprawdza, czy działa.
7. **Skills** — instaluje zalecane skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (albo przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia i sesje; użyj `--reset-scope full`, aby objąć także obszar roboczy.
Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, onboarding poprosi najpierw o uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do łączenia się z Gateway w innym miejscu.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodawanie kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` rozpoczyna onboarding.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby kierować wiadomości przychodzące (onboarding może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja referencyjna

Szczegółowy opis krok po kroku i wyników konfiguracji znajdziesz w
[Dokumentacji referencyjnej konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [Automatyzacji CLI](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Dokumentacji referencyjnej onboardingu](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja referencyjna polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie onboardingu: [Omówienie onboardingu](/pl/start/onboarding-overview)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Bootstrapowanie agenta](/pl/start/bootstrapping)
