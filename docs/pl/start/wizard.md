---
read_when:
    - Uruchamianie lub konfigurowanie onboardingu CLI
    - Konfigurowanie nowego komputera
sidebarTitle: 'Onboarding: CLI'
summary: 'Wprowadzanie do CLI: konfiguracja z przewodnikiem dla Gateway, obszaru roboczego, kanałów i Skills'
title: Wprowadzenie (CLI)
x-i18n:
    generated_at: "2026-06-28T20:46:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

Onboarding CLI jest **zalecaną** ścieżką konfiguracji terminalowej OpenClaw na
macOS, Linux lub Windows. Użytkownicy pulpitu Windows mogą też zacząć od
[Centrum Windows](/pl/platforms/windows).
Konfiguruje lokalny Gateway albo połączenie ze zdalnym Gateway, a także kanały, Skills
i domyślne ustawienia obszaru roboczego w jednym prowadzonym procesie.

```bash
openclaw onboard
```

Szybki start zwykle zajmuje tylko kilka minut, ale pełny onboarding może potrwać dłużej,
gdy logowanie do dostawcy, parowanie kanałów, instalacja demona, pobieranie z sieci,
Skills lub opcjonalne Plugin wymagają dodatkowej konfiguracji. Kreator pokazuje ten harmonogram
na początku, a kroki opcjonalne można pominąć i wrócić do nich później za pomocą
`openclaw configure`.

## Ustawienia regionalne

Kreator CLI lokalizuje stałe teksty onboardingu. Ustala ustawienia regionalne z
`OPENCLAW_LOCALE`, następnie `LC_ALL`, potem `LC_MESSAGES`, potem `LANG`, a w razie potrzeby
wraca do angielskiego. Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nazwy i stabilne identyfikatory pozostają dosłowne: `OpenClaw`, `Gateway`, `Tailscale`,
polecenia, klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety pluginów/kanałów
nie są tłumaczone.

<Info>
Najszybszy pierwszy czat: otwórz Control UI (konfiguracja kanału nie jest potrzebna). Uruchom
`openclaw dashboard` i czatuj w przeglądarce. Dokumentacja: [Panel](/pl/web/dashboard).
</Info>

Aby później zmienić konfigurację:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach użyj `--non-interactive`.
</Note>

<Tip>
Onboarding CLI obejmuje krok wyszukiwania w sieci, w którym możesz wybrać dostawcę
takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG lub Tavily. Niektórzy dostawcy wymagają
klucza API, inni działają bez klucza. Możesz też skonfigurować to później za pomocą
`openclaw configure --section web`. Dokumentacja: [Narzędzia webowe](/pl/tools/web).
</Tip>

## Szybki start a tryb zaawansowany

Onboarding zaczyna się od wyboru **Szybkiego startu** (ustawienia domyślne) albo **Zaawansowanego** (pełna kontrola).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Lokalny Gateway (loopback)
    - Domyślny obszar roboczy (albo istniejący obszar roboczy)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowane automatycznie, nawet na loopback)
    - Domyślna polityka narzędzi dla nowych konfiguracji lokalnych: `tools.profile: "coding"` (istniejący jawny profil jest zachowywany)
    - Domyślna izolacja DM: lokalny onboarding zapisuje `session.dmScope: "per-channel-peer"`, gdy nie jest ustawione. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Ekspozycja Tailscale **Wyłączona**
    - DM Telegram + WhatsApp domyślnie używają **listy dozwolonych** (pojawi się prośba o podanie numeru telefonu)

  </Tab>
  <Tab title="Advanced (full control)">
    - Udostępnia każdy krok (tryb, obszar roboczy, Gateway, kanały, demon, Skills).

  </Tab>
</Tabs>

## Co konfiguruje onboarding

**Tryb lokalny (domyślny)** prowadzi przez te kroki:

1. **Model/Uwierzytelnianie** — wybierz dowolnego obsługiwanego dostawcę/przepływ uwierzytelniania (klucz API, OAuth albo ręczne uwierzytelnianie specyficzne dla dostawcy), w tym Custom Provider
   (zgodny z OpenAI, zgodny z Anthropic albo automatyczne wykrywanie Unknown). Wybierz model domyślny.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiać narzędzia lub przetwarzać treści Webhook/hooków, preferuj najmocniejszy dostępny model najnowszej generacji i utrzymuj ścisłą politykę narzędzi. Słabsze/starsze poziomy łatwiej podatne są na prompt injection.
   W uruchomieniach nieinteraktywnych `--secret-input-mode ref` zapisuje referencje oparte na zmiennych środowiskowych w profilach uwierzytelniania zamiast wartości kluczy API w tekście jawnym.
   W nieinteraktywnym trybie `ref` zmienna środowiskowa dostawcy musi być ustawiona; przekazanie flag klucza inline bez tej zmiennej środowiskowej szybko kończy się błędem.
   W uruchomieniach interaktywnych wybór trybu referencji sekretu pozwala wskazać zmienną środowiskową albo skonfigurowaną referencję dostawcy (`file` lub `exec`), z szybką walidacją wstępną przed zapisaniem.
   Dla Anthropic interaktywny onboarding/konfiguracja oferuje **Anthropic Claude CLI** jako preferowaną ścieżkę lokalną oraz **klucz API Anthropic** jako zalecaną ścieżkę produkcyjną. Anthropic setup-token pozostaje też dostępny jako obsługiwana ścieżka uwierzytelniania tokenem.
2. **Obszar roboczy** — lokalizacja plików agenta (domyślnie `~/.openclaw/workspace`). Zasiewa pliki startowe.
3. **Gateway** — port, adres bindowania, tryb uwierzytelniania, ekspozycja Tailscale.
   W interaktywnym trybie tokena wybierz domyślne przechowywanie tokena w tekście jawnym albo włącz SecretRef.
   Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane i oficjalne kanały czatu Plugin, takie jak iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Demon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd (Linux/WSL2) albo natywne zadanie Harmonogramu zadań Windows z awaryjną ścieżką folderu Startup dla użytkownika.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja demona je waliduje, ale nie utrwala rozwiązanego tokena w metadanych środowiska usługi nadzorującej.
   Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef jest nierozwiązany, instalacja demona jest blokowana z praktycznymi wskazówkami.
   Jeśli skonfigurowane są jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja demona jest blokowana do czasu jawnego ustawienia trybu.
6. **Kontrola kondycji** — uruchamia Gateway i sprawdza, czy działa.
7. **Skills** — instaluje zalecane Skills i opcjonalne zależności.

<Note>
Ponowne uruchomienie onboardingu **nie** usuwa niczego, chyba że jawnie wybierzesz **Reset** (albo przekażesz `--reset`).
CLI `--reset` domyślnie obejmuje konfigurację, dane uwierzytelniające i sesje; użyj `--reset-scope full`, aby uwzględnić obszar roboczy.
Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, onboarding poprosi o wcześniejsze uruchomienie `openclaw doctor`.
</Note>

**Tryb zdalny** konfiguruje tylko lokalnego klienta do łączenia się z Gateway w innym miejscu.
**Nie** instaluje ani nie zmienia niczego na zdalnym hoście.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` uruchamia onboarding.

Co ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze używają `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby kierować wiadomości przychodzące (onboarding może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Szczegółowy opis krok po kroku i dane wyjściowe konfiguracji znajdziesz w
[Dokumentacji konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne znajdziesz w [Automatyzacji CLI](/pl/start/wizard-cli-automation).
Głębszą dokumentację techniczną, w tym szczegóły RPC, znajdziesz w
[Dokumentacji onboardingu](/pl/reference/wizard).

## Powiązana dokumentacja

- Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie onboardingu: [Omówienie onboardingu](/pl/start/onboarding-overview)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Bootstrap agenta](/pl/start/bootstrapping)
