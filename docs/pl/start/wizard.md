---
read_when:
    - Uruchamianie lub konfigurowanie procesu wprowadzania CLI
    - Konfigurowanie nowej maszyny
sidebarTitle: 'Onboarding: CLI'
summary: 'Wprowadzanie w CLI: prowadzona konfiguracja Gateway, przestrzeni roboczej, kanałów i Skills'
title: Wprowadzenie (CLI)
x-i18n:
    generated_at: "2026-04-30T10:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

Onboarding przez CLI to **zalecany** sposób konfiguracji OpenClaw na macOS,
Linuksie lub Windows (przez WSL2; zdecydowanie zalecane).
Konfiguruje lokalny Gateway albo połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia obszaru roboczego w jednym prowadzonym procesie.

```bash
openclaw onboard
```

<Info>
Najszybszy pierwszy czat: otwórz Control UI (konfiguracja kanału nie jest potrzebna). Uruchom
`openclaw dashboard` i rozmawiaj w przeglądarce. Dokumentacja: [Dashboard](/pl/web/dashboard).
</Info>

Aby później ponownie skonfigurować:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>

<Tip>
Onboarding przez CLI obejmuje krok wyszukiwania w sieci, w którym możesz wybrać dostawcę,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG albo Tavily. Niektórzy dostawcy wymagają
klucza API, a inni go nie wymagają. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia webowe](/pl/tools/web).
</Tip>

## QuickStart kontra Zaawansowane

Onboarding zaczyna się od wyboru **QuickStart** (ustawienia domyślne) albo **Zaawansowane** (pełna kontrola).

<Tabs>
  <Tab title="QuickStart (ustawienia domyślne)">
    - Lokalny Gateway (loopback)
    - Domyślny obszar roboczy (albo istniejący obszar roboczy)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowane automatycznie, nawet na loopback)
    - Domyślna polityka narzędzi dla nowych konfiguracji lokalnych: `tools.profile: "coding"` (istniejący jawny profil zostaje zachowany)
    - Domyślna izolacja DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, gdy wartość nie jest ustawiona. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **Wyłączona**
    - DM w Telegram + WhatsApp domyślnie używają **listy dozwolonych** (pojawi się prośba o podanie numeru telefonu)

  </Tab>
  <Tab title="Zaawansowane (pełna kontrola)">
    - Udostępnia każdy krok (tryb, obszar roboczy, Gateway, kanały, demon, Skills).

  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** przeprowadza Cię przez te kroki:

1. **Model/Uwierzytelnianie** — wybierz dowolnego obsługiwanego dostawcę albo przepływ uwierzytelniania (klucz API, OAuth albo ręczne uwierzytelnianie specyficzne dla dostawcy), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic albo Unknown z automatycznym wykrywaniem). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiać narzędzia albo przetwarzać treści z webhooków/hooków, wybierz najsilniejszy dostępny model najnowszej generacji i utrzymuj rygorystyczną politykę narzędzi. Słabsze/starsze poziomy są bardziej podatne na prompt injection.
   W uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje odwołania oparte na env w profilach uwierzytelniania zamiast jawnych wartości kluczy API.
   W nieinteraktywnym trybie `ref` zmienna env dostawcy musi być ustawiona; przekazanie flag z kluczem inline bez tej zmiennej env kończy się szybkim błędem.
   W uruchomieniach interaktywnych wybór trybu odwołania do sekretu pozwala wskazać zmienną środowiskową albo skonfigurowane odwołanie dostawcy (`file` lub `exec`), z szybką walidacją preflight przed zapisaniem.
   Dla Anthropic interaktywny onboarding/configure oferuje **Anthropic Claude CLI** jako preferowaną lokalną ścieżkę oraz **klucz API Anthropic** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token pozostaje też dostępny jako obsługiwana ścieżka uwierzytelniania tokenem.
2. **Obszar roboczy** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Dodaje początkowe pliki bootstrap.
3. **Gateway** — port, adres powiązania, tryb uwierzytelniania, ekspozycja Tailscale.
   W interaktywnym trybie tokena wybierz domyślne przechowywanie tokena w postaci jawnego tekstu albo włącz SecretRef.
   Nieinteraktywna ścieżka SecretRef dla tokena: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i dołączone kanały czatu, takie jak BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Demon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne Zaplanowane zadanie Windows z awaryjną obsługą folderu Autostart dla użytkownika.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja demona je waliduje, ale nie utrwala rozwiązanego tokena w metadanych środowiska usługi nadzorującej.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena nie jest rozwiązany, instalacja demona zostaje zablokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona zostaje zablokowana do czasu jawnego ustawienia trybu.
6. **Kontrola stanu** — uruchamia Gateway i sprawdza, czy działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Resetuj** (albo przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia i sesje; użyj `--reset-scope full`, aby uwzględnić obszar roboczy.
Jeśli konfiguracja jest nieprawidłowa albo zawiera przestarzałe klucze, onboarding poprosi najpierw o uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do łączenia się z Gateway w innym miejscu.
Nie instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` rozpoczyna onboarding.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby trasować wiadomości przychodzące (onboarding może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Szczegółowe omówienia krok po kroku i wyniki konfiguracji znajdziesz w
[Dokumentacji konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [Automatyzacji CLI](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Dokumentacji onboardingu](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja poleceń CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie onboardingu: [Omówienie onboardingu](/pl/start/onboarding-overview)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Bootstrap agenta](/pl/start/bootstrapping)
