---
read_when:
    - Uruchamianie lub konfigurowanie wdrażania w CLI
    - Konfigurowanie nowego komputera
sidebarTitle: 'Onboarding: CLI'
summary: 'Wdrażanie przez CLI: zweryfikuj wnioskowanie, a następnie przekaż pozostałą konfigurację Crestodianowi'
title: Wdrażanie (CLI)
x-i18n:
    generated_at: "2026-07-12T15:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Wdrażanie przez CLI jest zalecaną ścieżką konfiguracji w terminalu na macOS, Linuxie i
Windowsie (natywnie lub przez WSL2). Domyślnie wykrywa dostęp do AI już dostępny na
komputerze, weryfikuje go za pomocą rzeczywistego ukończenia i uruchamia Crestodian,
aby skonfigurować przestrzeń roboczą, Gateway oraz funkcje opcjonalne. `openclaw setup` uruchamia ten sam proces ([Konfiguracja](/pl/cli/setup) opisuje
wariant `--baseline`, który konfiguruje wyłącznie ustawienia). Użytkownicy wersji klasycznej Windowsa mogą również rozpocząć
od [Windows Hub](/pl/platforms/windows).

Wdrażanie z przewodnikiem najpierw ustanawia inferencję. Wykrywa dostępny dostęp do AI,
wymaga rzeczywistego ukończenia i dopiero wtedy uruchamia [Crestodian](/pl/cli/crestodian),
aby skonfigurować pozostałą część OpenClaw. W procesie z przewodnikiem nie ma możliwości
uruchomienia Crestodian przed inferencją ani pominięcia AI.

Klasyczny kreator pozostaje dostępny do logowania u dostawcy, konfiguracji zdalnego
Gateway, parowania kanałów, sterowania demonem, Skills i importowania. Uruchom go jawnie
za pomocą `openclaw onboard --classic`; ekran kandydatów inferencji w procesie z przewodnikiem
nie przekazuje do niego sterowania. Po pomyślnym przejściu inferencji Crestodian może użyć
`open channel wizard for <channel>`, aby przekazać konfigurację kanału wymagającą sekretów do
maskowanego kreatora terminalowego. Aby zmienić dostawcę modelu lub jego uwierzytelnianie,
zamknij Crestodian i uruchom `openclaw onboard`; Crestodian nie otwiera procesów dostawcy
z przewodnikiem ani klasycznych.

<Info>
Najszybsza pierwsza rozmowa: ukończ konfigurację z przewodnikiem, uruchom `openclaw dashboard`
i rozmawiaj w przeglądarce przez interfejs Control UI. Dokumentacja: [Panel sterowania](/pl/web/dashboard).
</Info>

## Ustawienia regionalne

Kreator lokalizuje stałe teksty wdrażania. Kolejność rozstrzygania: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, a następnie język angielski. Obsługiwane ustawienia regionalne: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nazwy produktów, polecenia, klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz
etykiety pluginów i kanałów pozostają w języku angielskim niezależnie od ustawień regionalnych.

Aby później ponownie skonfigurować ustawienia niezwiązane z inferencją:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (zobacz [Automatyzacja CLI](/pl/start/wizard-cli-automation)).
</Note>

<Tip>
Klasyczny kreator zawiera krok wyszukiwania internetowego, w którym możesz wybrać dostawcę: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG lub Tavily. Niektóre wymagają klucza API, a inne
działają bez niego. Skonfiguruj to później za pomocą `openclaw configure --section web`. Dokumentacja:
[Narzędzia internetowe](/pl/tools/web).
</Tip>

## Domyślny proces z przewodnikiem

Zwykłe `openclaw onboard` przebiega następująco:

1. Zaakceptuj informację dotyczącą bezpieczeństwa.
2. Wykryj skonfigurowane modele, zmienne środowiskowe z kluczami API oraz obsługiwane lokalne
   interfejsy CLI AI.
3. Przetestuj pierwszego wykrytego kandydata za pomocą rzeczywistego ukończenia. W przypadku niepowodzenia wyświetl
   przyczynę i przejdź do następnego użytecznego kandydata.
4. Jeśli możliwości wykrywania zostaną wyczerpane, ponów próbę z wykrytym kandydatem lub wprowadź klucz API
   dostawcy w maskowanym monicie. Wdrażanie z przewodnikiem
   nie oferuje Crestodian ani możliwości zakończenia z pominięciem AI, dopóki inferencja nie zadziała.
5. Zachowaj tylko zweryfikowaną trasę modelu oraz wymagany przez nią stan danych logowania lub pluginu.
   Ustawienia przestrzeni roboczej i Gateway pozostają niezmienione.
6. Uruchom Crestodian ze zweryfikowanym modelem, aby mógł skonfigurować przestrzeń roboczą,
   Gateway, kanały, agentów, pluginy oraz pozostałe opcjonalne elementy konfiguracji.

Ponowne uruchomienie polecenia w skonfigurowanej instalacji najpierw testuje bieżący model
domyślny, dzięki czemu proces z przewodnikiem służy do weryfikacji i naprawy. Nieudana
kontrola nigdy nie zastępuje automatycznie skonfigurowanego modelu; wdrażanie zostaje zatrzymane i
pyta, jak kontynuować. Uruchom `openclaw channels add` lub `openclaw configure`, aby
później dodać elementy niezwiązane z inferencją; użyj `openclaw onboard`, aby zmienić trasę
dostawcy lub uwierzytelniania.

## Klasyczny kreator: QuickStart a Advanced

Uruchom `openclaw onboard --classic`, aby otworzyć pełny kreator. Rozpoczyna się on od
wyboru między **QuickStart** (wartości domyślne) a **Advanced** (pełna kontrola). Przekaż
`--flow quickstart` lub `--flow advanced` (alias `manual`), aby wybrać klasyczny
proces i pominąć ten monit.

<Tabs>
  <Tab title="QuickStart (wartości domyślne)">
    - Lokalny Gateway, powiązanie z adresem loopback
    - Domyślna przestrzeń robocza (lub istniejąca przestrzeń robocza)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowany automatycznie, nawet dla adresu loopback)
    - Zasady narzędzi: `tools.profile: "coding"` dla nowych konfiguracji (istniejący jawny profil zostaje zachowany)
    - Izolacja wiadomości prywatnych: `session.dmScope: "per-channel-peer"` dla nowych konfiguracji. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Udostępnianie przez Tailscale **Off**
    - Wiadomości prywatne Telegrama i WhatsApp domyślnie używają **allowlist**: Telegram prosi o numeryczny identyfikator użytkownika Telegrama, a WhatsApp o numer telefonu

  </Tab>
  <Tab title="Advanced (pełna kontrola)">
    - Udostępnia każdy krok: tryb, przestrzeń roboczą, Gateway, kanały, demona i Skills

  </Tab>
</Tabs>

Tryb zdalny (`--mode remote`) zawsze używa procesu zaawansowanego; konfiguruje wyłącznie
ten komputer do łączenia z Gateway znajdującym się gdzie indziej i nigdy nie instaluje
ani nie zmienia niczego na zdalnym hoście.

## Co konfiguruje klasyczne wdrażanie

Tryb lokalny (domyślny) prowadzi przez następujące kroki:

1. **Model/uwierzytelnianie** — wybierz proces uwierzytelniania dostawcy (klucz API, OAuth lub
   ręczne uwierzytelnianie właściwe dla dostawcy), w tym dostawcę niestandardowego
   (zgodnego z OpenAI, zgodnego z OpenAI Responses, zgodnego z Anthropic lub
   wykrywanego automatycznie jako nieznany). Wybierz model domyślny.
   Nowa konfiguracja klucza API OpenAI domyślnie używa `openai/gpt-5.6` (sam bezpośredni
   identyfikator API jest rozpoznawany jako Sol); nowa konfiguracja ChatGPT/Codex domyślnie używa
   `openai/gpt-5.6-sol`. Ponowne uruchomienie konfiguracji zachowuje istniejący jawnie ustawiony model,
   w tym `openai/gpt-5.5`. Wybierz jawnie `openai/gpt-5.5`, jeśli
   konto nie udostępnia GPT-5.6.
   Uwaga dotycząca bezpieczeństwa: jeśli ten agent będzie uruchamiał narzędzia lub przetwarzał treść
   webhooków/hooków, wybierz najsilniejszy dostępny model najnowszej generacji i utrzymuj
   rygorystyczne zasady narzędzi — słabsze lub starsze poziomy są bardziej podatne na wstrzykiwanie poleceń.
   W przypadku uruchomień nieinteraktywnych `--secret-input-mode ref` zapisuje odwołania oparte na zmiennych środowiskowych
   zamiast wartości kluczy API w postaci zwykłego tekstu; wskazana zmienna środowiskowa musi być już
   ustawiona, w przeciwnym razie wdrażanie natychmiast zakończy się niepowodzeniem. Interaktywny tryb odwołań do sekretów może
   wskazywać zmienną środowiskową lub skonfigurowane odwołanie dostawcy (`file` albo
   `exec`), z szybką kontrolą wstępną przed zapisaniem. Po konfiguracji modelu i uwierzytelniania
   kreator oferuje opcjonalny test ukończenia na żywo; po niepowodzeniu można raz wrócić do
   konfiguracji modelu i uwierzytelniania albo zignorować błąd bez blokowania pozostałej części
   klasycznego kreatora. Zignorowanie błędu nie odblokowuje Crestodian; konfiguracja konwersacyjna
   nadal wymaga pomyślnego sprawdzenia inferencji.
2. **Przestrzeń robocza** — katalog plików agenta (domyślnie `~/.openclaw/workspace`). Tworzy początkowe pliki rozruchowe.
3. **Gateway** — port, adres powiązania, tryb uwierzytelniania i udostępnianie przez Tailscale. W
   interaktywnym trybie tokenu wybierz przechowywanie tokenu w postaci zwykłego tekstu (domyślne) albo
   wybierz SecretRef. Nieinteraktywna ścieżka SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** — wbudowane kanały czatu i kanały oficjalnych pluginów, w tym
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Demon** — instaluje LaunchAgent (macOS), jednostkę użytkownika systemd
   (Linux/WSL2) albo natywne Zaplanowane zadanie Windows z awaryjnym użyciem
   folderu Startup bieżącego użytkownika.
   Jeśli wymagane jest uwierzytelnianie tokenem, a `gateway.auth.token` jest zarządzany przez SecretRef,
   instalacja demona weryfikuje go, ale nie zapisuje rozpoznanego tokenu w
   metadanych środowiska usługi nadzorującej; nierozpoznany SecretRef blokuje
   instalację i wyświetla wskazówki. Jeśli zarówno `gateway.auth.token`, jak i
   `gateway.auth.password` są ustawione, a `gateway.auth.mode` nie jest ustawione, instalacja
   jest blokowana do czasu jawnego ustawienia trybu.
6. **Kontrola kondycji** — uruchamia Gateway i sprawdza, czy jest osiągalny.
7. **Skills** — instaluje zalecane Skills i ich opcjonalne zależności.

<Note>
Ponowne uruchomienie wdrażania **nie** usuwa żadnych danych, chyba że jawnie wybierzesz
**Reset** (lub przekażesz `--reset`). Opcja CLI `--reset` domyślnie obejmuje konfigurację, dane logowania
i sesje; użyj `--reset-scope full`, aby usunąć również przestrzeń roboczą. Jeśli
konfiguracja jest nieprawidłowa lub zawiera starsze klucze, wdrażanie poprosi najpierw o uruchomienie
`openclaw doctor`.
</Note>

`--flow import` uruchamia wykryty proces migracji (na przykład Hermes) w
klasycznym kreatorze zamiast nowej konfiguracji; zobacz [Migracja](/pl/cli/migrate) oraz przewodniki migracji w sekcji
[Instalacja](/pl/install/migrating-hermes). `openclaw onboard --modern` jest
aliasem zgodności dla [Crestodian](/pl/cli/crestodian). Używa tej samej
bramki inferencji co `openclaw crestodian`: zweryfikowana inferencja uruchamia
asystenta, natomiast niepowodzenie interaktywne powoduje powrót do konfiguracji inferencji z przewodnikiem.

## Dodawanie kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własną
przestrzenią roboczą, sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` rozpoczyna
interaktywny proces wyboru nazwy, przestrzeni roboczej, uwierzytelniania, kanałów i powiązań — nie jest to
pełny kreator `openclaw onboard`.

Konfigurowane wartości:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślna przestrzeń robocza: `~/.openclaw/workspace-<agentId>` (albo w katalogu
  `agents.defaults.workspace`, jeśli został ustawiony).
- Dodaj `bindings`, aby kierować wiadomości przychodzące do tego agenta (wdrażanie może zrobić to za Ciebie).
- Flagi trybu nieinteraktywnego: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Szczegółowy opis działania poszczególnych kroków i wynikowej konfiguracji znajduje się w
[Dokumentacji konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady trybu nieinteraktywnego znajdują się w [Automatyzacji CLI](/pl/start/wizard-cli-automation).
Pełna dokumentacja flag znajduje się w [`openclaw onboard`](/pl/cli/onboard).

## Powiązana dokumentacja

- Dokumentacja poleceń CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie wdrażania: [Omówienie wdrażania](/pl/start/onboarding-overview)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Rytuał pierwszego uruchomienia agenta: [Inicjalizacja agenta](/pl/start/bootstrapping)
