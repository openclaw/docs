---
read_when:
    - Wybór ścieżki wdrożenia
    - Konfigurowanie nowego środowiska
sidebarTitle: Onboarding Overview
summary: Przegląd opcji i procesów wdrażania OpenClaw
title: Omówienie wdrażania
x-i18n:
    generated_at: "2026-07-12T15:38:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw udostępnia wdrażanie w terminalu i aplikacji macOS. Obie metody najpierw konfigurują inferencję:
wykrywają istniejący dostęp do AI, wymagają pomyślnego wykonania zapytania na żywo, a dopiero potem uruchamiają
Crestodian w celu skonfigurowania pozostałych elementów. Jeśli osiągalny, skonfigurowany Gateway
ma już skonfigurowany model dla domyślnego agenta, wdrażanie jest pomijane i otwierany jest
standardowy interfejs agenta. Proces terminalowy udostępnia także pełny klasyczny kreator
szczegółowej konfiguracji.

## Którą metodę wybrać?

|                  | Wdrażanie przez CLI                          | Wdrażanie w aplikacji macOS       |
| ---------------- | -------------------------------------------- | --------------------------------- |
| **Platformy**    | macOS, Linux, Windows (natywnie lub w WSL2)  | Tylko macOS                       |
| **Interfejs**    | Konfiguracja inferencji, następnie Crestodian | Konfiguracja inferencji, następnie Crestodian |
| **Najlepsze dla** | Serwerów, środowisk bez interfejsu graficznego, pełnej kontroli | Komputera Mac, konfiguracji wizualnej |
| **Automatyzacja** | `--non-interactive` dla skryptów             | Tylko ręczna                      |
| **Polecenie**    | `openclaw onboard`                           | Uruchomienie aplikacji            |

Większość użytkowników powinna zacząć od **wdrażania przez CLI** — działa ono wszędzie i zapewnia
największą kontrolę.

## Co konfiguruje wdrażanie

Prowadzony etap inferencji konfiguruje wyłącznie:

1. **Dostawcę modelu i uwierzytelnianie** — wykryty dostęp lub zweryfikowany klucz API
2. **Zweryfikowaną inferencję** — rzeczywiste wykonanie zapytania przy użyciu efektywnego
   modelu domyślnego agenta

Po pomyślnym wykonaniu zapytania Crestodian może skonfigurować przestrzeń roboczą, Gateway,
usługę Gateway, kanały, agentów, pluginy i inne funkcje opcjonalne.

Klasyczny kreator CLI może dodatkowo skonfigurować:

1. **Kanały** (opcjonalnie) — wbudowane i dołączone kanały czatu, takie jak
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp i inne
2. **Zaawansowane ustawienia Gateway** — tryb zdalny, ustawienia sieci i opcje demona

## Wdrażanie przez CLI

Uruchom w dowolnym terminalu:

```bash
openclaw onboard
```

Prowadzony proces wykrywa istniejący dostęp do AI, testuje kandydatów na żywo w określonej kolejności,
po niepowodzeniu przechodzi do kolejnego i umożliwia ręczne wprowadzenie klucza z maskowaniem. Zapisuje
model i dane uwierzytelniające dopiero po pomyślnym wykonaniu zapytania, a następnie uruchamia Crestodian,
aby skonfigurować przestrzeń roboczą, Gateway, kanały, agentów, pluginy i inne
funkcje opcjonalne. Przed inferencją Crestodian nie jest uruchamiany, nie istnieje ścieżka pomijająca AI ani
możliwość przejścia do klasycznego kreatora w trakcie procesu. Aby zamiast tego użyć
klasycznego kreatora, zakończ proces i uruchom `openclaw onboard --classic`.

Po pomyślnej inferencji Crestodian może przekazać konfigurację kanałów kreatorowi terminalowemu
z maskowaniem danych. Nie otwiera prowadzonej ani klasycznej konfiguracji dostawcy; aby
zmienić dostawcę modelu lub jego uwierzytelnianie, zakończ działanie Crestodian i
uruchom `openclaw onboard`.

Użyj `openclaw onboard --classic`, aby szczegółowo skonfigurować model i uwierzytelnianie, kanały, Skills,
zdalny Gateway lub import. Dodanie `--install-daemon` również wybiera
klasyczny proces i instaluje usługę działającą w tle w jednym kroku. Użyj `openclaw
crestodian` do konwersacyjnej konfiguracji niezwiązanej z inferencją oraz naprawy. `openclaw
onboard --modern` jest aliasem zgodności korzystającym z tej samej bramki
inferencji na żywo.

Pełna dokumentacja: [Wdrażanie (CLI)](/pl/start/wizard)
Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)

## Wdrażanie w aplikacji macOS

Otwórz aplikację OpenClaw. Jeśli skonfigurowany lokalny lub zdalny Gateway jest osiągalny,
a domyślny agent ma już skonfigurowany model, aplikacja pomija wdrażanie
oraz Crestodian i natychmiast otwiera standardowy interfejs agenta.

W przypadku nowego lub niekompletnie skonfigurowanego Gateway proces pierwszego uruchomienia wykrywa istniejący
dostęp do AI (Claude Code, Codex lub klucze API), testuje na żywo najlepszą
opcję i zapisuje ją dopiero po uzyskaniu rzeczywistej odpowiedzi — w razie potrzeby automatycznie
przechodząc do kolejnych opcji i oferując zweryfikowany etap ręcznego wprowadzenia klucza API,
gdy niczego nie wykryto. Poufne dane uwierzytelniające są wprowadzane z maskowaniem. Po pomyślnym
przejściu inferencji uruchamia się Crestodian i pomaga skonfigurować pozostałe elementy.

Gemini CLI pozostaje dostępne dla zwykłych agentów po zakończeniu konfiguracji, ale nie jest
oferowane na potrzeby tej bramki inferencji, ponieważ nie może wymusić testu bez użycia narzędzi.

Pełna dokumentacja: [Wdrażanie (aplikacja macOS)](/pl/start/onboarding)

## Dostawcy niestandardowi lub nieuwzględnieni na liście

Jeśli dostawcy nie ma na liście, uruchom `openclaw onboard --classic`, wybierz
**Dostawca niestandardowy** i wprowadź:

- Zgodność punktu końcowego: zgodny z OpenAI (`/chat/completions`), zgodny z OpenAI Responses (`/responses`), zgodny z Anthropic (`/messages`) lub nieznany (testuje wszystkie trzy i automatycznie wykrywa zgodność)
- Bazowy adres URL i klucz API (klucz API jest opcjonalny, jeśli punkt końcowy go nie wymaga)
- Identyfikator modelu i opcjonalny alias modelu

Można jednocześnie używać wielu niestandardowych punktów końcowych — każdy otrzymuje własny identyfikator punktu końcowego.

## Powiązane materiały

- [Pierwsze kroki](/pl/start/getting-started)
- [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference)
