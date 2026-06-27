---
read_when:
    - Uruchamianie lub konfigurowanie wdrażania przez CLI
    - Konfigurowanie nowego komputera
sidebarTitle: 'Onboarding: CLI'
summary: 'Wprowadzanie do CLI: konfiguracja z przewodnikiem dla Gateway, obszaru roboczego, kanałów i Skills'
title: Wdrażanie (CLI)
x-i18n:
    generated_at: "2026-06-27T18:23:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

Wprowadzanie przez CLI jest **zalecaną** ścieżką konfiguracji terminalowej OpenClaw na
macOS, Linux lub Windows. Użytkownicy pulpitu Windows mogą też zacząć od
[Windows Hub](/pl/platforms/windows).
Konfiguruje lokalny Gateway lub połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia obszaru roboczego w jednym prowadzonym przepływie.

```bash
openclaw onboard
```

## Ustawienia regionalne

Kreator CLI lokalizuje stałe treści wprowadzania. Ustala ustawienia regionalne z
`OPENCLAW_LOCALE`, następnie `LC_ALL`, potem `LC_MESSAGES`, potem `LANG`, a w razie
potrzeby wraca do angielskiego. Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nazwy i stabilne identyfikatory pozostają dosłowne: `OpenClaw`, `Gateway`, `Tailscale`,
polecenia, klucze konfiguracji, adresy URL, identyfikatory providerów, identyfikatory modeli oraz etykiety pluginów/kanałów
nie są tłumaczone.

<Info>
Najszybszy pierwszy czat: otwórz Control UI (konfiguracja kanału nie jest potrzebna). Uruchom
`openclaw dashboard` i rozmawiaj w przeglądarce. Dokumentacja: [Panel](/pl/web/dashboard).
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
Wprowadzanie przez CLI obejmuje krok wyszukiwania w sieci, w którym możesz wybrać providera,
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy providerzy wymagają
klucza API, a inni działają bez klucza. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia webowe](/pl/tools/web).
</Tip>

## Szybki start a tryb zaawansowany

Wprowadzanie zaczyna się od wyboru **Szybki start** (ustawienia domyślne) albo **Zaawansowany** (pełna kontrola).

<Tabs>
  <Tab title="Szybki start (ustawienia domyślne)">
    - Lokalny Gateway (loopback)
    - Domyślny obszar roboczy (lub istniejący obszar roboczy)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowany automatycznie, nawet przy loopback)
    - Domyślna polityka narzędzi dla nowych konfiguracji lokalnych: `tools.profile: "coding"` (istniejący jawny profil zostaje zachowany)
    - Domyślna izolacja DM: lokalne wprowadzanie zapisuje `session.dmScope: "per-channel-peer"`, gdy nie jest ustawione. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **wyłączona**
    - DM w Telegram + WhatsApp domyślnie używają **listy dozwolonych** (pojawi się prośba o numer telefonu)

  </Tab>
  <Tab title="Zaawansowany (pełna kontrola)">
    - Ujawnia każdy krok (tryb, obszar roboczy, Gateway, kanały, daemon, Skills).

  </Tab>
</Tabs>

## Co konfiguruje wprowadzanie

**Tryb lokalny (domyślny)** prowadzi przez te kroki:

1. **Model/uwierzytelnianie** — wybierz dowolny obsługiwany przepływ providera/uwierzytelniania (klucz API, OAuth albo ręczne uwierzytelnianie specyficzne dla providera), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic albo automatyczne wykrywanie Unknown). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiał narzędzia albo przetwarzał treść Webhook/hooków, preferuj najmocniejszy dostępny model najnowszej generacji i utrzymuj ścisłą politykę narzędzi. Słabsze/starsze poziomy łatwiej poddać prompt injection.
   Przy uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje odwołania oparte na zmiennych środowiskowych w profilach uwierzytelniania zamiast wartości kluczy API w tekście jawnym.
   W nieinteraktywnym trybie `ref` zmienna środowiskowa providera musi być ustawiona; przekazanie wbudowanych flag klucza bez tej zmiennej powoduje szybkie niepowodzenie.
   W uruchomieniach interaktywnych wybór trybu odwołania do sekretu pozwala wskazać zmienną środowiskową albo skonfigurowane odwołanie providera (`file` lub `exec`), z szybką walidacją przed zapisem.
   Dla Anthropic interaktywne onboarding/configure oferuje **Anthropic Claude CLI** jako preferowaną ścieżkę lokalną oraz **klucz API Anthropic** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token pozostaje też dostępny jako obsługiwana ścieżka uwierzytelniania tokenem.
2. **Obszar roboczy** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Zasila pliki startowe.
3. **Gateway** — port, adres wiązania, tryb uwierzytelniania, ekspozycja Tailscale.
   W interaktywnym trybie tokenu wybierz domyślne przechowywanie tokenu w tekście jawnym albo użyj SecretRef.
   Nieinteraktywna ścieżka SecretRef dla tokenu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i oficjalne kanały czatu pluginów, takie jak iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Daemon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne Windows Scheduled Task z awaryjną ścieżką folderu Startup dla użytkownika.
   Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja daemona waliduje go, ale nie zapisuje rozwiązanego tokenu w metadanych środowiska usługi nadzorcy.
   Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany SecretRef tokenu nie może zostać rozwiązany, instalacja daemona zostaje zablokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemona zostaje zablokowana do czasu jawnego ustawienia trybu.
6. **Kontrola kondycji** — uruchamia Gateway i sprawdza, czy działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie wprowadzania **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (albo przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia i sesje; użyj `--reset-scope full`, aby objąć też obszar roboczy.
Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, wprowadzanie poprosi najpierw o uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do łączenia się z Gateway w innym miejscu.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` uruchamia wprowadzanie.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze używają wzorca `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby kierować wiadomości przychodzące (wprowadzanie może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Szczegółowe omówienia krok po kroku i wyniki konfiguracji znajdziesz w
[Dokumentacji konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [Automatyzacji CLI](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Dokumentacji wprowadzania](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja poleceń CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie wprowadzania: [Omówienie wprowadzania](/pl/start/onboarding-overview)
- Wprowadzanie aplikacji macOS: [Wprowadzanie](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Inicjalizacja agenta](/pl/start/bootstrapping)
