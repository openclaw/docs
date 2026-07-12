---
read_when:
    - Chcesz zrozumieć cały proces OAuth w OpenClaw
    - Napotykasz problemy z unieważnieniem tokenu / wylogowaniem
    - Potrzebujesz przepływów uwierzytelniania Claude CLI lub OAuth
    - Potrzebujesz wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce obsługi wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T15:06:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje OAuth („uwierzytelnianie subskrypcyjne”) dla dostawców, którzy je oferują,
w szczególności **OpenAI Codex (ChatGPT OAuth)** oraz **ponowne użycie Anthropic Claude CLI**.
W przypadku Anthropic praktyczny podział wygląda następująco:

- **Klucz API Anthropic**: standardowe rozliczenia API Anthropic.
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone, dlatego OpenClaw uznaje ponowne użycie Claude CLI oraz
  korzystanie z `claude -p` za zatwierdzone dla tej integracji, chyba że Anthropic
  opublikuje nową politykę. W środowisku produkcyjnym z Anthropic uwierzytelnianie kluczem API nadal
  pozostaje bezpieczniejszą zalecaną metodą.

OpenClaw przechowuje zarówno uwierzytelnianie kluczem API OpenAI, jak i ChatGPT/Codex OAuth pod
kanonicznym identyfikatorem dostawcy `openai`. Starsze identyfikatory profili `openai-codex:*` oraz
wpisy `auth.order.openai-codex` są stanem starszego formatu naprawianym przez
`openclaw doctor --fix`; w nowej konfiguracji używaj identyfikatorów profili `openai:*` oraz `auth.order.openai`.

Ta strona opisuje:

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie są **przechowywane** tokeny (i dlaczego)
- jak obsługiwać **wiele kont** (profile i nadpisania dla poszczególnych sesji)

Pluginy dostawców, które udostępniają własny przepływ OAuth lub klucza API, korzystają z
tego samego punktu wejścia:

```bash
openclaw models auth login --provider <id>
```

## Miejsce docelowe tokenów (dlaczego istnieje)

Dostawcy OAuth często generują nowy token odświeżania przy każdym logowaniu lub odświeżeniu.
Niektórzy dostawcy unieważniają poprzedni token odświeżania, gdy dla tego samego
użytkownika i aplikacji zostanie wydany nowy. Praktyczny objaw: logujesz się przez OpenClaw _oraz_
przez Claude Code / Codex CLI, a później jedno z nich zostaje losowo wylogowane.

Aby ograniczyć ten problem, OpenClaw traktuje magazyn profili uwierzytelniania jako **miejsce docelowe tokenów**:

- środowisko uruchomieniowe odczytuje dane uwierzytelniające z jednego miejsca dla każdego agenta
- wiele profili może współistnieć i być kierowanych deterministycznie
- ponowne użycie zewnętrznego CLI zależy od dostawcy: gdy OpenClaw jest właścicielem lokalnego profilu OAuth
  dla dostawcy, lokalny token odświeżania jest kanoniczny. Jeśli ten lokalny
  token odświeżania zostanie odrzucony, OpenClaw zgłasza profil wymagający
  ponownego uwierzytelnienia zamiast wracać do materiału tokenowego zewnętrznego CLI.
  Inicjalizacja z Codex CLI jest jeszcze bardziej ograniczona: może jedynie wypełnić pusty
  profil w stylu `openai:default`, zanim OpenClaw przejmie OAuth dla tego
  dostawcy; później odświeżenia należące do OpenClaw pozostają kanoniczne
- ścieżki stanu i uruchamiania ograniczają wykrywanie zewnętrznego CLI do zestawu
  już skonfigurowanych dostawców, dzięki czemu w konfiguracji z jednym dostawcą
  nie jest sprawdzany magazyn logowania niepowiązanego CLI

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane osobno dla każdego agenta pod nazwą logiczną `auth-profiles.json` (
bazowy magazyn to baza danych SQLite agenta; nazwa JSON została zachowana ze względu na
zgodność i prezentację w narzędziach):

- Profile uwierzytelniania (OAuth, klucze API i opcjonalne odwołania na poziomie wartości):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy plik zgodności: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są usuwane po wykryciu)

Starszy plik służący wyłącznie do importu (nadal obsługiwany, ale niebędący głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do magazynu profili uwierzytelniania przy pierwszym użyciu)

Wszystkie powyższe ścieżki uwzględniają również `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration-reference#auth-storage](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji migawki środowiska uruchomieniowego znajdziesz w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

Gdy agent dodatkowy nie ma lokalnego profilu uwierzytelniania, OpenClaw stosuje dziedziczenie
z odczytem z magazynu agenta domyślnego/głównego; podczas odczytu nie klonuje magazynu
głównego agenta. Tokeny odświeżania OAuth są szczególnie wrażliwe: standardowe
przepływy kopiowania domyślnie je pomijają, ponieważ niektórzy dostawcy rotują lub unieważniają
tokeny odświeżania po użyciu. Skonfiguruj osobne logowanie OAuth dla agenta, gdy
potrzebuje on niezależnego konta.

## Ponowne użycie Anthropic Claude CLI

OpenClaw obsługuje ponowne użycie Anthropic Claude CLI oraz `claude -p` jako zatwierdzoną
metodę uwierzytelniania. Jeśli na hoście istnieje już lokalne logowanie Claude,
proces wdrażania/konfiguracji może użyć go bezpośrednio. Token konfiguracyjny Anthropic nadal
jest dostępny jako obsługiwana metoda uwierzytelniania tokenem, ale OpenClaw preferuje ponowne użycie Claude CLI,
gdy jest ono dostępne.

<Warning>
Publiczna dokumentacja Claude Code firmy Anthropic mówi, że bezpośrednie korzystanie z Claude Code mieści się w
limitach subskrypcji Claude, a pracownicy Anthropic poinformowali nas, że korzystanie z Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw uznaje ponowne użycie Claude CLI oraz
korzystanie z `claude -p` za zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualną dokumentację planów Anthropic dotyczącą bezpośredniego korzystania z Claude Code znajdziesz w artykułach [Korzystanie z Claude Code
z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Korzystanie z Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli interesują Cię inne opcje oparte na subskrypcji w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Plan programistyczny Qwen Cloud](/pl/providers/qwen), [Plan programistyczny MiniMax](/pl/providers/minimax)
oraz [Plan programistyczny Z.AI / GLM](/pl/providers/zai).
</Warning>

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `openclaw/plugin-sdk/llm.ts` i połączone z kreatorami/poleceniami.

### Token konfiguracyjny Anthropic

Przebieg:

1. uruchom token konfiguracyjny Anthropic lub wklejanie tokenu z OpenClaw
2. OpenClaw zapisuje uzyskane dane uwierzytelniające Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje w przestrzeni `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofania zmian lub sterowania kolejnością

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest jawnie obsługiwany poza Codex CLI, w tym w przepływach pracy OpenClaw.

Polecenie logowania używa kanonicznego identyfikatora dostawcy OpenAI:

```bash
openclaw models auth login --provider openai
```

Użyj `--profile-id openai:<name>` dla wielu kont ChatGPT/Codex OAuth w obrębie
jednego agenta. Nie używaj `openai-codex:<name>` dla nowych profili. Doctor migruje
ten starszy prefiks do bezkolizyjnego identyfikatora profilu `openai:*`; po naprawie uruchom
`openclaw models auth list --provider openai`, zanim skopiujesz
identyfikatory profili do `auth.order` lub `/model ...@<profileId>`.

Przebieg (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE oraz losową wartość `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...` (zakres
   `openid profile email offline_access`)
3. spróbuj przechwycić wywołanie zwrotne pod adresem `http://localhost:1455/auth/callback` (
   host wywołania zwrotnego domyślnie ma wartość `localhost` i akceptuje wyłącznie hosty local loopback;
   można go nadpisać za pomocą `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. jeśli możesz wkleić kod przed nadejściem wywołania zwrotnego (lub pracujesz
   zdalnie/bez interfejsu i nie można powiązać wywołania zwrotnego), wklej zamiast tego adres URL przekierowania/kod
   — ręczne wklejenie konkuruje z wywołaniem zwrotnym przeglądarki i wygrywa to,
   które zakończy się jako pierwsze
5. wymień kod pod adresem `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai`.

## Odświeżanie i wygaśnięcie

Profile przechowują znacznik czasu `expires`. W czasie działania:

- jeśli `expires` wskazuje przyszłość, używany jest zapisany token dostępu
- jeśli token wygasł, jest odświeżany (pod blokadą pliku), a zapisane dane uwierzytelniające są nadpisywane
- jeśli agent dodatkowy odczytuje odziedziczony profil OAuth głównego agenta,
  odświeżenie jest zapisywane z powrotem w magazynie głównego agenta zamiast kopiowania tokenu odświeżania
  do magazynu agenta dodatkowego
- dane uwierzytelniające CLI zarządzane zewnętrznie (Claude CLI, ograniczona inicjalizacja Codex CLI;
  zobacz [Miejsce docelowe tokenów](#the-token-sink-why-it-exists)) są odczytywane ponownie zamiast
  zużywania skopiowanego tokenu odświeżania. Jeśli zarządzane odświeżenie nie powiedzie się, OpenClaw
  zgłasza profil, którego dotyczy problem, jako wymagający ponownego uwierzytelnienia, zamiast zwracać
  materiał tokenowy zewnętrznego CLI.

Proces odświeżania jest automatyczny; zazwyczaj nie trzeba ręcznie zarządzać tokenami.

## Wiele kont (profile) i kierowanie

Dwa wzorce:

### 1) Zalecane: oddzielni agenci

Jeśli chcesz, aby konta „osobiste” i „służbowe” nigdy na siebie nie oddziaływały, użyj odizolowanych agentów (oddzielne sesje, dane uwierzytelniające i obszary robocze):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie osobno dla każdego agenta (za pomocą kreatora) i kieruj czaty do odpowiedniego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

Magazyn profili uwierzytelniania obsługuje wiele identyfikatorów profili dla tego samego dostawcy.
Wybierz używany profil:

- globalnie za pomocą kolejności w konfiguracji (`auth.order`)
- dla poszczególnych sesji za pomocą `/model ...@<profileId>`

Przykład (nadpisanie dla sesji):

- `/model Opus@anthropic:work`

Wyświetl istniejące identyfikatory profili za pomocą:

```bash
openclaw models auth list --provider <id>
```

Powiązana dokumentacja:

- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) (reguły rotacji i okresu oczekiwania)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands) (interfejs poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) — przegląd uwierzytelniania dostawców modeli
- [Sekrety](/pl/gateway/secrets) — przechowywanie danych uwierzytelniających i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
