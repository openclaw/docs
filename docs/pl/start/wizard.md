---
read_when:
    - Uruchamianie lub konfigurowanie wdrażania za pomocą CLI
    - Konfigurowanie nowej maszyny
sidebarTitle: 'Onboarding: CLI'
summary: 'Wdrażanie za pomocą CLI: zweryfikuj inferencję, a następnie przekaż pozostałą konfigurację do OpenClaw'
title: Wdrażanie (CLI)
x-i18n:
    generated_at: "2026-07-16T19:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Wdrażanie za pomocą CLI jest zalecaną ścieżką konfiguracji w terminalu w systemach macOS, Linux i
Windows (natywnie lub przez WSL2). Domyślnie wykrywa dostępny już na
komputerze dostęp do AI, weryfikuje go za pomocą rzeczywistego wygenerowania odpowiedzi i uruchamia OpenClaw, aby
skonfigurować obszar roboczy, Gateway oraz funkcje opcjonalne. `openclaw setup` uruchamia ten sam proces ([Konfiguracja](/pl/cli/setup) opisuje
wariant `--baseline` obejmujący wyłącznie konfigurację). Użytkownicy aplikacji komputerowej Windows mogą również rozpocząć
od [centrum Windows](/pl/platforms/windows).

Wdrażanie z przewodnikiem najpierw ustanawia inferencję. Wykrywa dostępny dostęp do AI,
wymaga rzeczywistego wygenerowania odpowiedzi i dopiero wtedy uruchamia [OpenClaw](/cli/openclaw),
aby skonfigurować pozostałą część OpenClaw. Wybranie opcji **Pomiń na razie** kończy wdrażanie
bez uruchamiania OpenClaw.

Klasyczny kreator pozostaje dostępny dla niestandardowych dostawców, konfiguracji zdalnego Gateway,
parowania kanałów, sterowania demonem, umiejętności i importowania. Należy uruchomić go jawnie
za pomocą `openclaw onboard --classic`; selektor inferencji z przewodnikiem nie przekazuje
do niego sterowania. Po pomyślnym przejściu inferencji OpenClaw może użyć `open channel wizard for
<channel>`, aby przekazać konfigurację kanałów wymagającą sekretów do maskowanego kreatora terminalowego.
Aby zmienić dostawcę modelu lub jego uwierzytelnianie, należy zamknąć OpenClaw i uruchomić
`openclaw onboard`; OpenClaw nie otwiera procesów dostawcy z przewodnikiem ani klasycznych.

<Info>
Najszybsza droga do pierwszego czatu: ukończyć konfigurację z przewodnikiem, uruchomić `openclaw dashboard` i rozmawiać w
przeglądarce za pośrednictwem interfejsu sterowania. Dokumentacja: [Pulpit](/pl/web/dashboard).
</Info>

## Ustawienia regionalne

Kreator lokalizuje stałe teksty wdrażania. Kolejność rozstrzygania: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, a następnie angielski. Obsługiwane ustawienia regionalne: `en`,
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
`--json` nie oznacza trybu nieinteraktywnego. W skryptach należy użyć `--non-interactive` (zobacz [Automatyzacja CLI](/pl/start/wizard-cli-automation)).
</Note>

<Tip>
Klasyczny kreator zawiera etap wyszukiwania w internecie, na którym można wybrać dostawcę: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG lub Tavily. Niektóre wymagają klucza API, a inne
działają bez klucza. Można to skonfigurować później za pomocą `openclaw configure --section web`. Dokumentacja:
[Narzędzia internetowe](/pl/tools/web).
</Tip>

## Domyślny proces z przewodnikiem

Zwykłe `openclaw onboard` realizuje następujący proces:

1. Zaakceptowanie informacji o zabezpieczeniach.
2. Wykrycie skonfigurowanych modeli, zmiennych środowiskowych kluczy API, obsługiwanych lokalnych
   narzędzi CLI AI oraz już zainstalowanych modeli obsługujących narzędzia z osiągalnych serwerów Ollama lub LM
   Studio na hoście Gateway. Ten przebieg tylko do odczytu nigdy nie pobiera
   modelu. Instalacje Gemini CLI i Antigravity są zgłaszane, ale nie są automatycznie testowane,
   ponieważ nie mogą wymusić testu bez użycia narzędzi.
3. Przetestowanie pierwszego wykrytego kandydata za pomocą rzeczywistego wygenerowania odpowiedzi. W razie niepowodzenia wyświetlenie
   przyczyny i przejście do następnego użytecznego kandydata.
4. Po wyczerpaniu możliwości wykrywania wybranie OpenAI, Anthropic, xAI (Grok), Google lub
   OpenRouter albo wybranie opcji **Więcej…** w celu wyświetlenia pozostałych dostawców. Regiony,
   plany i obsługiwane metody przeglądarkowe, urządzeniowe, z kluczem API lub tokenem każdego dostawcy
   pojawiają się w drugim menu i są testowane za pomocą tego samego rzeczywistego wygenerowania odpowiedzi.
   Wybranie opcji **Pomiń na razie** kończy proces bez uruchamiania OpenClaw.
5. Utrwalenie wyłącznie zweryfikowanej trasy modelu oraz wymaganego przez nią stanu poświadczeń lub pluginu.
   Ustawienia obszaru roboczego i Gateway pozostają bez zmian.
6. Uruchomienie OpenClaw ze zweryfikowanym modelem, aby umożliwić konfigurację obszaru roboczego,
   Gateway, kanałów, agentów, pluginów i pozostałych opcjonalnych ustawień.

Ponowne uruchomienie polecenia w skonfigurowanej instalacji najpierw testuje bieżący model domyślny,
dzięki czemu proces z przewodnikiem służy do weryfikacji i naprawy. Nieudana
kontrola nigdy nie zastępuje automatycznie skonfigurowanego modelu; wdrażanie zatrzymuje się i
pyta, jak kontynuować. W przypadku późniejszego dodawania elementów niezwiązanych z inferencją należy uruchomić `openclaw channels add` lub `openclaw configure`;
do zmiany dostawcy lub trasy uwierzytelniania należy użyć `openclaw onboard`.

## Klasyczny kreator: QuickStart a Advanced

Uruchomienie `openclaw onboard --classic` otwiera pełny kreator. Rozpoczyna się on od
wyboru między **QuickStart** (ustawienia domyślne) a **Advanced** (pełna kontrola). Przekazanie
`--flow quickstart` lub `--flow advanced` (alias `manual`) wybiera klasyczny
proces i pomija ten monit.

<Tabs>
  <Tab title="QuickStart (ustawienia domyślne)">
    - Lokalny Gateway, powiązanie z interfejsem pętli zwrotnej
    - Domyślny obszar roboczy (lub istniejący obszar roboczy)
    - Port Gateway **18789**
    - Uwierzytelnianie Gateway **Token** (generowany automatycznie, nawet w interfejsie pętli zwrotnej)
    - Zasady narzędzi: `tools.profile: "coding"` w nowych konfiguracjach (istniejący jawny profil jest zachowywany)
    - Izolacja wiadomości prywatnych: `session.dmScope: "per-channel-peer"` w nowych konfiguracjach. Szczegóły: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals)
    - Udostępnianie przez Tailscale **Wyłączone**
    - Wiadomości prywatne Telegram i WhatsApp domyślnie używają **listy dozwolonych**: Telegram prosi o numeryczny identyfikator użytkownika Telegram, a WhatsApp o numer telefonu

  </Tab>
  <Tab title="Advanced (pełna kontrola)">
    - Udostępnia każdy etap: tryb, obszar roboczy, Gateway, kanały, demon, umiejętności

  </Tab>
</Tabs>

Tryb zdalny (`--mode remote`) zawsze korzysta z procesu zaawansowanego; wyłącznie
konfiguruje ten komputer do łączenia się z Gateway w innej lokalizacji i nigdy nie instaluje
ani nie zmienia niczego na hoście zdalnym.

## Co konfiguruje klasyczne wdrażanie

Tryb lokalny (domyślny) przeprowadza przez następujące etapy:

1. **Model/uwierzytelnianie** - wybór procesu uwierzytelniania dostawcy (klucz API, OAuth lub
   ręczne uwierzytelnianie właściwe dla dostawcy), w tym dostawcy niestandardowego
   (zgodnego z OpenAI, zgodnego z OpenAI Responses, zgodnego z Anthropic lub
   wykrywanego automatycznie jako nieznany). Wybór modelu domyślnego.
   Nowa konfiguracja klucza API OpenAI domyślnie używa `openai/gpt-5.6` (sam podstawowy identyfikator
   bezpośredniego API jest rozpoznawany jako Sol); nowa konfiguracja ChatGPT/Codex domyślnie używa
   `openai/gpt-5.6-sol`. Ponowne uruchomienie konfiguracji zachowuje istniejący jawnie ustawiony model,
   w tym `openai/gpt-5.5`. Jeśli konto nie udostępnia GPT-5.6, należy jawnie
   wybrać `openai/gpt-5.5`.
   Uwaga dotycząca zabezpieczeń: jeśli ten agent będzie uruchamiać narzędzia lub przetwarzać treści
   z webhooków/hooków, należy preferować najsilniejszy dostępny model najnowszej generacji i utrzymywać
   rygorystyczne zasady narzędzi — słabsze lub starsze poziomy łatwiej poddają się wstrzykiwaniu poleceń.
   W przebiegach nieinteraktywnych `--secret-input-mode ref` przechowuje odwołania oparte na zmiennych środowiskowych
   zamiast wartości kluczy API w postaci zwykłego tekstu; wskazywana zmienna środowiskowa musi być już
   ustawiona, w przeciwnym razie wdrażanie natychmiast kończy się niepowodzeniem. Interaktywny tryb odwołań do sekretów może
   wskazywać zmienną środowiskową lub skonfigurowane odwołanie dostawcy (`file` lub
   `exec`), z szybką kontrolą wstępną przed zapisaniem. Po skonfigurowaniu modelu i uwierzytelniania
   kreator oferuje opcjonalny test rzeczywistego wygenerowania odpowiedzi; po niepowodzeniu można jednokrotnie powrócić do
   konfiguracji modelu i uwierzytelniania albo zignorować błąd bez blokowania pozostałej części
   klasycznego kreatora. Zignorowanie go nie odblokowuje OpenClaw; konfiguracja konwersacyjna
   nadal wymaga pomyślnego sprawdzenia inferencji.
2. **Obszar roboczy** - katalog plików agenta (domyślnie `~/.openclaw/workspace`). Tworzy początkowe pliki uruchomieniowe.
3. **Gateway** - port, adres powiązania, tryb uwierzytelniania, udostępnianie przez Tailscale. W
   interaktywnym trybie tokenu można wybrać przechowywanie tokenu w postaci zwykłego tekstu (domyślne) lub
   użycie SecretRef. Nieinteraktywna ścieżka SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanały** - wbudowane i oficjalne kanały czatu pluginów, w tym
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp i inne.
5. **Demon** - instaluje LaunchAgent (macOS), jednostkę użytkownika systemd
   (Linux/WSL2) lub natywne zaplanowane zadanie Windows z rezerwowym użyciem folderu
   Autostart poszczególnego użytkownika.
   Jeśli wymagane jest uwierzytelnianie tokenem, a `gateway.auth.token` jest zarządzany przez SecretRef,
   instalacja demona weryfikuje go, ale nie utrwala rozpoznanego tokenu w
   metadanych środowiska usługi nadzorującej; nierozpoznany SecretRef blokuje
   instalację i wyświetla instrukcje. Jeśli jednocześnie ustawiono `gateway.auth.token` i
   `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja
   zostaje zablokowana do czasu jawnego ustawienia trybu.
6. **Kontrola kondycji** - uruchamia Gateway i sprawdza jego dostępność.
7. **Skills** - instaluje zalecane umiejętności i ich opcjonalne zależności.

<Note>
Ponowne uruchomienie wdrażania **nie** usuwa żadnych danych, chyba że jawnie wybrano
**Resetuj** (lub przekazano `--reset`). Polecenie CLI `--reset` domyślnie obejmuje konfigurację, poświadczenia
i sesje; aby usunąć również obszar roboczy, należy użyć `--reset-scope full`. Jeśli
konfiguracja jest nieprawidłowa lub zawiera starsze klucze, wdrażanie prosi najpierw o uruchomienie
`openclaw doctor`.
</Note>

`--flow import` uruchamia wykryty proces migracji (na przykład Hermes) w
klasycznym kreatorze zamiast nowej konfiguracji; zobacz [Migracja](/pl/cli/migrate) i przewodniki migracji w sekcji
[Instalacja](/pl/install/migrating-hermes). `openclaw onboard --modern` jest
aliasem zgodności dla [OpenClaw](/cli/openclaw). Korzysta z tej samej
bramki inferencji co `openclaw setup`: zweryfikowana inferencja uruchamia
asystenta, natomiast interaktywne niepowodzenie powoduje powrót do konfiguracji inferencji z przewodnikiem.

## Dodawanie kolejnego agenta

`openclaw agents add <name>` służy do utworzenia oddzielnego agenta z własnym
obszarem roboczym, sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` rozpoczyna
interaktywny proces dotyczący nazwy, obszaru roboczego, uwierzytelniania, kanałów i powiązań — nie jest to
pełny kreator `openclaw onboard`.

Konfigurowane elementy:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślny obszar roboczy: `~/.openclaw/workspace-<agentId>` (lub w
  `agents.defaults.workspace`, jeśli ta wartość jest ustawiona).
- Dodanie `bindings` kieruje wiadomości przychodzące do tego agenta (wdrażanie może zrobić to automatycznie).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Pełna dokumentacja

Szczegółowy opis działania poszczególnych etapów i wynikowej konfiguracji zawiera
[Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference).
Przykłady nieinteraktywne zawiera [Automatyzacja CLI](/pl/start/wizard-cli-automation).
Pełną dokumentację flag zawiera strona [`openclaw onboard`](/pl/cli/onboard).

## Powiązana dokumentacja

- Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)
- Omówienie wdrażania: [Omówienie wdrażania](/pl/start/onboarding-overview)
- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Procedura pierwszego uruchomienia agenta: [Inicjalizacja agenta](/pl/start/bootstrapping)
