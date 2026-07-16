---
read_when:
    - Chcesz zrozumieć pełny przepływ OAuth w OpenClaw
    - Występują problemy z unieważnianiem tokenów / wylogowywaniem
    - Potrzebne są przepływy uwierzytelniania Claude CLI lub OAuth
    - Potrzebna jest obsługa wielu kont lub kierowanie według profilu
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce obsługi wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T18:32:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje OAuth („uwierzytelnianie subskrypcyjne”) dla dostawców, którzy je oferują,
w szczególności **OpenAI Codex (OAuth ChatGPT)** oraz **ponowne wykorzystanie Anthropic Claude CLI**.
W przypadku Anthropic praktyczny podział wygląda następująco:

- **Klucz API Anthropic**: standardowe rozliczenia za korzystanie z API Anthropic.
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone, dlatego OpenClaw uznaje ponowne
  wykorzystanie Claude CLI oraz użycie `claude -p` za zatwierdzone dla tej integracji,
  chyba że Anthropic opublikuje nowe zasady. W środowisku produkcyjnym nadal
  bezpieczniejszą zalecaną metodą uwierzytelniania w Anthropic jest klucz API.

OpenClaw przechowuje zarówno uwierzytelnianie kluczem API OpenAI, jak i OAuth ChatGPT/Codex
pod kanonicznym identyfikatorem dostawcy `openai`. Starsze identyfikatory profili
`openai-codex:*` oraz wpisy `auth.order.openai-codex` stanowią starszy stan naprawiany przez
`openclaw doctor --fix`; w nowej konfiguracji należy używać identyfikatorów profili
`openai:*` oraz `auth.order.openai`.

Na tej stronie opisano:

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie **przechowywane** są tokeny (i dlaczego)
- jak obsługiwać **wiele kont** (profile i zastąpienia dla poszczególnych sesji)

Pluginy dostawców udostępniające własny przepływ OAuth lub klucza API korzystają
z tego samego punktu wejścia:

```bash
openclaw models auth login --provider <id>
```

## Magazyn tokenów (dlaczego istnieje)

Dostawcy OAuth często generują nowy token odświeżania przy każdym logowaniu lub odświeżeniu.
Niektórzy dostawcy unieważniają poprzedni token odświeżania, gdy dla tego samego
użytkownika i aplikacji zostanie wydany nowy. Praktyczny objaw: po zalogowaniu się zarówno
przez OpenClaw, _jak i_ przez Claude Code / Codex CLI, jedno z nich zostaje później
losowo wylogowane.

Aby ograniczyć ten problem, OpenClaw traktuje magazyn profili uwierzytelniania jako
**magazyn tokenów**:

- środowisko uruchomieniowe odczytuje dane uwierzytelniające z jednego miejsca dla każdego agenta
- wiele profili może współistnieć i być kierowanych w sposób deterministyczny
- ponowne wykorzystanie zewnętrznego CLI zależy od dostawcy: gdy OpenClaw
  dysponuje lokalnym profilem OAuth danego dostawcy, lokalny token odświeżania
  jest kanoniczny. Jeśli ten lokalny token odświeżania zostanie odrzucony,
  OpenClaw zgłasza profil jako wymagający ponownego uwierzytelnienia zamiast
  wracać do materiału tokenowego zewnętrznego CLI. Inicjalizacja z Codex CLI
  jest jeszcze bardziej ograniczona: może jedynie zainicjować pusty profil
  w stylu `openai:default`, zanim OpenClaw przejmie obsługę OAuth tego
  dostawcy; później kanoniczne pozostają odświeżenia zarządzane przez OpenClaw
- ścieżki stanu i uruchamiania ograniczają wykrywanie zewnętrznych CLI
  do już skonfigurowanego zestawu dostawców, dzięki czemu magazyn logowania
  niepowiązanego CLI nie jest sprawdzany w konfiguracji z jednym dostawcą

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane osobno dla każdego agenta pod nazwą logiczną
`auth-profiles.json` (bazowym magazynem jest baza danych SQLite agenta; nazwa JSON
została zachowana na potrzeby zgodności i wyświetlania w narzędziach):

- Profile uwierzytelniania (OAuth, klucze API i opcjonalne odwołania na poziomie wartości):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy plik zgodności: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są usuwane po wykryciu)

Starszy plik przeznaczony wyłącznie do importu (nadal obsługiwany, ale niebędący głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do magazynu profili uwierzytelniania przy pierwszym użyciu)

Wszystkie powyższe elementy respektują również `$OPENCLAW_STATE_DIR` (zastąpienie katalogu stanu). Pełna dokumentacja: [/gateway/configuration-reference#auth-storage](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji migawek środowiska uruchomieniowego zawiera strona [Zarządzanie sekretami](/pl/gateway/secrets).

Gdy agent dodatkowy nie ma lokalnego profilu uwierzytelniania, OpenClaw stosuje
dziedziczenie z odczytem z magazynu agenta domyślnego/głównego; podczas odczytu
nie klonuje magazynu głównego agenta. Tokeny odświeżania OAuth są szczególnie
wrażliwe: standardowe przepływy kopiowania domyślnie je pomijają, ponieważ
niektórzy dostawcy rotują lub unieważniają tokeny odświeżania po użyciu. Jeśli
agent potrzebuje niezależnego konta, należy skonfigurować dla niego osobne
logowanie OAuth.

## Ponowne wykorzystanie Anthropic Claude CLI

OpenClaw obsługuje ponowne wykorzystanie Anthropic Claude CLI oraz
`claude -p` jako zatwierdzoną ścieżkę uwierzytelniania. Jeśli na hoście
istnieje już lokalne logowanie Claude, kreator wdrażania lub konfiguracji może
wykorzystać je bezpośrednio. Token konfiguracyjny Anthropic pozostaje dostępną
i obsługiwaną ścieżką uwierzytelniania tokenem, ale OpenClaw preferuje ponowne
wykorzystanie Claude CLI, gdy jest ono dostępne.

<Warning>
Publiczna dokumentacja Claude Code firmy Anthropic podaje, że bezpośrednie
korzystanie z Claude Code mieści się w limitach subskrypcji Claude, a pracownicy
Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie
dozwolone. Dlatego OpenClaw uznaje ponowne wykorzystanie Claude CLI oraz użycie
`claude -p` za zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nowe zasady.

Aktualną dokumentację planów Anthropic dotyczącą bezpośredniego korzystania
z Claude Code zawierają strony [Korzystanie z Claude Code
w planie Pro lub
Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Korzystanie z Claude Code w planie Team lub
Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Inne opcje oparte na subskrypcji w OpenClaw opisano na stronach [OpenAI
Codex](/pl/providers/openai), [Plan Qwen Cloud Coding
Plan](/pl/providers/qwen), [Plan MiniMax Coding Plan](/pl/providers/minimax)
oraz [Plan Z.AI / GLM Coding Plan](/pl/providers/zai).
</Warning>

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w
`openclaw/plugin-sdk/llm.ts` i połączone z kreatorami oraz poleceniami.

### Token konfiguracyjny Anthropic

Przebieg procesu:

1. utwórz token, uruchamiając `claude setup-token` na dowolnym urządzeniu z Claude Code, a następnie rozpocznij w OpenClaw konfigurację tokenu konfiguracyjnego Anthropic lub wklej token
2. OpenClaw zapisuje uzyskane dane uwierzytelniające Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje ustawiony na `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofywania zmian i sterowania kolejnością

### OpenAI Codex (OAuth ChatGPT)

OAuth OpenAI Codex jest jawnie obsługiwany poza Codex CLI, w tym w przepływach pracy OpenClaw.

Polecenie logowania używa kanonicznego identyfikatora dostawcy OpenAI:

```bash
openclaw models auth login --provider openai
```

Aby korzystać z wielu kont OAuth ChatGPT/Codex w jednym agencie, należy używać
`--profile-id openai:<name>`. W nowych profilach nie należy używać `openai-codex:<name>`.
Doctor migruje ten starszy prefiks do identyfikatora profilu
`openai:*`, który nie powoduje kolizji; po naprawie należy uruchomić
`openclaw models auth list --provider openai` przed skopiowaniem identyfikatorów profili do
`auth.order` lub `/model ...@<profileId>`.

Przebieg procesu (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE oraz losową wartość `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...` (zakres
   `openid profile email offline_access`)
3. spróbuj przechwycić wywołanie zwrotne pod adresem `http://localhost:1455/auth/callback` (host
   wywołania zwrotnego ma domyślnie wartość `localhost` i akceptuje wyłącznie hosty
   pętli zwrotnej; można go zastąpić za pomocą `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. jeśli kod można wkleić przed nadejściem wywołania zwrotnego
   (albo środowisko jest zdalne/bez interfejsu graficznego i nie można powiązać
   wywołania zwrotnego), zamiast tego wklej adres URL przekierowania lub kod —
   ręczne wklejenie ściga się z wywołaniem zwrotnym przeglądarki i wygrywa
   operacja, która zakończy się jako pierwsza
5. wymień kod pod adresem `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai`.

## Odświeżanie i wygaśnięcie

Profile przechowują znacznik czasu `expires`. W czasie działania:

- jeśli `expires` wskazuje przyszłość, użyj zapisanego tokenu dostępu
- jeśli token wygasł, odśwież go (z blokadą pliku) i nadpisz zapisane dane uwierzytelniające
- jeśli agent dodatkowy odczytuje odziedziczony profil OAuth głównego agenta,
  odświeżenie jest zapisywane z powrotem w magazynie głównego agenta zamiast
  kopiowania tokenu odświeżania do magazynu agenta dodatkowego
- dane uwierzytelniające CLI zarządzane zewnętrznie (Claude CLI oraz ograniczona
  inicjalizacja z Codex CLI; zobacz [Magazyn tokenów](#the-token-sink-why-it-exists))
  są odczytywane ponownie zamiast zużywania skopiowanego tokenu odświeżania.
  Jeśli zarządzane odświeżenie się nie powiedzie, OpenClaw zgłasza profil
  wymagający ponownego uwierzytelnienia zamiast zwracać materiał tokenowy
  zewnętrznego CLI.

Przepływ odświeżania jest automatyczny; zazwyczaj nie trzeba ręcznie zarządzać tokenami.

## Wiele kont (profile) i kierowanie

Dwa wzorce:

### 1) Zalecane: osobne agenty

Aby konta „osobiste” i „służbowe” nigdy ze sobą nie współdziałały, należy używać
izolowanych agentów (osobne sesje, dane uwierzytelniające i obszary robocze):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie należy skonfigurować uwierzytelnianie osobno dla każdego agenta
(w kreatorze) i kierować czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

Magazyn profili uwierzytelniania obsługuje wiele identyfikatorów profili
tego samego dostawcy. Profil używany w danym przypadku można wybrać:

- globalnie za pomocą kolejności w konfiguracji (`auth.order`)
- dla poszczególnych sesji za pomocą `/model ...@<profileId>`

Przykład (zastąpienie dla sesji):

- `/model Opus@anthropic:work`

Istniejące identyfikatory profili można wyświetlić za pomocą:

```bash
openclaw models auth list --provider <id>
```

Powiązana dokumentacja:

- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) (reguły rotacji i okresu oczekiwania)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands) (interfejs poleceń)

## Powiązane materiały

- [Uwierzytelnianie](/pl/gateway/authentication) — omówienie uwierzytelniania u dostawców modeli
- [Sekrety](/pl/gateway/secrets) — przechowywanie danych uwierzytelniających i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
