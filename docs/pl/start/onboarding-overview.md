---
read_when:
    - Wybór ścieżki wdrożenia
    - Konfigurowanie nowego środowiska
sidebarTitle: Onboarding Overview
summary: Omówienie opcji i procesów wdrażania OpenClaw
title: Przegląd wdrażania
x-i18n:
    generated_at: "2026-07-16T19:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw oferuje wdrażanie w terminalu i aplikacji macOS. Oba procesy najpierw konfigurują inferencję:
wykrywają istniejący dostęp do AI, wymagają pomyślnego rzeczywistego ukończenia i dopiero wtedy uruchamiają
OpenClaw w celu skonfigurowania pozostałych elementów. Jeśli skonfigurowany Gateway jest osiągalny,
a jego domyślny agent ma już skonfigurowany model, proces wdrażania jest pomijany i otwierany
jest standardowy interfejs agenta. Proces terminalowy oferuje również pełny klasyczny kreator
do szczegółowej konfiguracji.

## Której ścieżki użyć?

|                 | Wdrażanie przez CLI                              | Wdrażanie w aplikacji macOS       |
| --------------- | ------------------------------------------------ | --------------------------------- |
| **Platformy**   | macOS, Linux, Windows (natywnie lub przez WSL2)  | Tylko macOS                       |
| **Interfejs**   | Konfiguracja inferencji, następnie OpenClaw      | Konfiguracja inferencji, następnie OpenClaw |
| **Najlepsze do** | Serwerów, pracy bez interfejsu graficznego, pełnej kontroli | Komputera Mac, konfiguracji wizualnej |
| **Automatyzacja** | `--non-interactive` dla skryptów                | Tylko ręcznie                     |
| **Polecenie**   | `openclaw onboard`                               | Uruchomienie aplikacji             |

Większość użytkowników powinna zacząć od **wdrażania przez CLI** — działa ono wszędzie i zapewnia
największą kontrolę.

## Co konfiguruje proces wdrażania

Prowadzony etap inferencji konfiguruje wyłącznie:

1. **Dostawcę modelu i uwierzytelnianie** — wykryty dostęp albo zweryfikowane logowanie do dostawcy,
   klucz API lub token
2. **Zweryfikowaną inferencję** — rzeczywiste ukończenie przy użyciu efektywnego modelu
   domyślnego agenta

Po pomyślnym ukończeniu OpenClaw może skonfigurować obszar roboczy, Gateway,
usługę Gateway, kanały, agentów, pluginy i inne funkcje opcjonalne.

Klasyczny kreator CLI może dodatkowo skonfigurować:

1. **Kanały** (opcjonalnie) — wbudowane i dołączone kanały czatu, takie jak
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp i inne
2. **Zaawansowane ustawienia Gateway** — tryb zdalny, ustawienia sieci i wybór demona

## Wdrażanie przez CLI

Uruchom w dowolnym terminalu:

```bash
openclaw onboard
```

Prowadzony proces wykrywa istniejący dostęp do AI, kolejno testuje kandydatów na żywo
i w razie niepowodzenia przechodzi do następnego. Po wyczerpaniu możliwości wykrywania najpierw wyświetla OpenAI,
Anthropic, xAI (Grok), Google i OpenRouter. **Więcej…** zawiera
pozostałych dostawców podzielonych na grupy, a drugie menu przedstawia regiony, plany oraz obsługiwane
metody wykorzystujące przeglądarkę, urządzenie, klucz API lub token. Model
i dane uwierzytelniające są zapisywane dopiero po pomyślnym ukończeniu, a następnie uruchamiany jest OpenClaw w celu
skonfigurowania obszaru roboczego, Gateway, kanałów, agentów, pluginów i innych opcjonalnych
funkcji. **Pomiń na razie** kończy proces bez uruchamiania OpenClaw. W ramach tego procesu
nie można przejść do klasycznego kreatora; aby zamiast niego użyć klasycznego kreatora, zakończ proces i uruchom `openclaw onboard --classic`.

Po pomyślnej inferencji OpenClaw może przekazać konfigurację kanałów do kreatora terminalowego
z maskowanymi danymi wejściowymi. Nie otwiera on prowadzonej ani klasycznej konfiguracji dostawcy; aby
zmienić dostawcę modelu lub jego uwierzytelnianie, zamknij OpenClaw i uruchom
`openclaw onboard`.

Użyj `openclaw onboard --classic`, aby szczegółowo skonfigurować model i uwierzytelnianie, kanał, skill,
zdalny Gateway lub import. Dodanie `--install-daemon` również wybiera
klasyczny proces i instaluje usługę działającą w tle w jednym kroku. Użyj `openclaw
openclaw` do konwersacyjnej konfiguracji niezwiązanej z inferencją i naprawy. `openclaw
onboard --modern` to alias zgodności korzystający z tej samej
bramki inferencji na żywo.

Pełna dokumentacja: [Wdrażanie (CLI)](/pl/start/wizard)
Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)

## Wdrażanie w aplikacji macOS

Otwórz aplikację OpenClaw. Jeśli jej skonfigurowany lokalny lub zdalny Gateway jest osiągalny,
a domyślny agent ma już skonfigurowany model, aplikacja pomija proces wdrażania
oraz OpenClaw i natychmiast otwiera standardowy interfejs agenta.

W przypadku nowego lub niekompletnie skonfigurowanego Gateway proces pierwszego uruchomienia wykrywa istniejący dostęp do AI
(Claude Code, Codex lub klucze API), testuje na żywo najlepszą
opcję i zapisuje ją dopiero po uzyskaniu rzeczywistej odpowiedzi — automatycznie przechodząc do opcji zastępczych i
oferując zweryfikowany ręczny etap wprowadzania klucza API, gdy niczego nie wykryto. Poufne
dane uwierzytelniające są wprowadzane w sposób maskowany. Po pomyślnej inferencji uruchamiany jest OpenClaw,
który pomaga skonfigurować pozostałe elementy.

Gemini CLI pozostaje dostępny dla zwykłych agentów po zakończeniu konfiguracji, ale nie jest
oferowany dla tej bramki inferencji, ponieważ nie może wymusić próby bez użycia narzędzi.

Pełna dokumentacja: [Wdrażanie (aplikacja macOS)](/pl/start/onboarding)

## Niestandardowi lub niewymienieni dostawcy

Jeśli dostawcy nie ma na liście, uruchom `openclaw onboard --classic`, wybierz
**Dostawca niestandardowy** i wprowadź:

- Zgodność punktu końcowego: zgodny z OpenAI (`/chat/completions`), zgodny z OpenAI Responses (`/responses`), zgodny z Anthropic (`/messages`) lub nieznany (testuje wszystkie trzy i wykrywa automatycznie)
- Bazowy adres URL i klucz API (klucz API jest opcjonalny, jeśli punkt końcowy go nie wymaga)
- Identyfikator modelu i opcjonalny alias modelu

Może współistnieć wiele niestandardowych punktów końcowych — każdy otrzymuje własny identyfikator punktu końcowego.

## Powiązane materiały

- [Pierwsze kroki](/pl/start/getting-started)
- [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference)
