---
read_when:
    - Chcesz zrozumieć przepływ OAuth OpenClaw od początku do końca
    - Napotykasz problemy z unieważnieniem tokena / wylogowaniem
    - Chcesz używać przepływów uwierzytelniania Claude CLI lub OAuth
    - Chcesz korzystać z wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:28:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje „uwierzytelnianie subskrypcyjne” przez OAuth dla dostawców, którzy je oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
jest teraz następujący:

- **Klucz API Anthropic**: standardowe rozliczanie Anthropic API
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone

OpenAI Codex OAuth jest jawnie wspierany do użycia w narzędziach zewnętrznych, takich jak
OpenClaw.

OpenClaw przechowuje zarówno uwierzytelnianie kluczem API OpenAI, jak i ChatGPT/Codex OAuth pod
kanonicznym identyfikatorem dostawcy `openai`. Starsze identyfikatory profili `openai-codex:*` oraz
wpisy `auth.order.openai-codex` są stanem legacy naprawianym przez
`openclaw doctor --fix`; dla nowej konfiguracji używaj identyfikatorów profili `openai:*` oraz `auth.order.openai`.

W przypadku Anthropic w środowisku produkcyjnym bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

Ta strona wyjaśnia:

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla sesji)

OpenClaw obsługuje również **Pluginy dostawców**, które dostarczają własne przepływy OAuth lub kluczy API.
Uruchamiaj je za pomocą:

```bash
openclaw models auth login --provider <id>
```

## Ujście tokenów (dlaczego istnieje)

Dostawcy OAuth często tworzą **nowy token odświeżania** podczas przepływów logowania/odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy dla tego samego użytkownika/aplikacji zostanie wydany nowy.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **ujście tokenów**:

- środowisko uruchomieniowe odczytuje poświadczenia z **jednego miejsca**
- możemy przechowywać wiele profili i kierować je deterministycznie
- ponowne użycie zewnętrznego CLI zależy od dostawcy: Codex CLI może zainicjować pusty
  profil `openai:default`, ale gdy OpenClaw ma lokalny profil OAuth,
  lokalny token odświeżania jest kanoniczny. Jeśli ten lokalny token odświeżania zostanie odrzucony,
  OpenClaw może użyć działającego tokenu Codex CLI dla tego samego konta jako awaryjnej ścieżki tylko w czasie działania; inne integracje mogą pozostać zarządzane zewnętrznie i ponownie odczytywać swój
  magazyn uwierzytelniania CLI
- ścieżki statusu i uruchamiania, które już znają skonfigurowany zestaw dostawców, ograniczają
  wykrywanie zewnętrznego CLI do tego zestawu, dzięki czemu niepowiązany magazyn logowania CLI nie jest
  sprawdzany w konfiguracji z jednym dostawcą

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane w magazynach uwierzytelniania agentów:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne referencje na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Plik zgodności legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są czyszczone po wykryciu)

Plik legacy tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe elementy respektują również `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych referencjach do sekretów i zachowaniu aktywacji migawki środowiska uruchomieniowego znajdziesz w [Zarządzanie sekretami](/pl/gateway/secrets).

Gdy agent pomocniczy nie ma lokalnego profilu uwierzytelniania, OpenClaw używa dziedziczenia przez odczyt
z domyślnego/głównego magazynu agenta. Nie klonuje pliku
`auth-profiles.json` głównego agenta podczas odczytu. Tokeny odświeżania OAuth są szczególnie
wrażliwe: standardowe przepływy kopiowania domyślnie je pomijają, ponieważ niektórzy dostawcy rotują
lub unieważniają tokeny odświeżania po użyciu. Skonfiguruj osobne logowanie OAuth dla
agenta, gdy potrzebuje niezależnego konta.

## Zgodność z tokenami legacy Anthropic

<Warning>
Publiczna dokumentacja Anthropic Claude Code mówi, że bezpośrednie użycie Claude Code mieści się w
limitach subskrypcji Claude, a pracownicy Anthropic poinformowali nas, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw traktuje ponowne użycie Claude CLI i
użycie `claude -p` jako zatwierdzone dla tej integracji, dopóki Anthropic
nie opublikuje nowej polityki.

Aktualną dokumentację planów Anthropic dla bezpośredniego użycia Claude Code znajdziesz w [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz innych opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/pl/providers/zai).
</Warning>

OpenClaw udostępnia również setup-token Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/konfiguracja może użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `openclaw/plugin-sdk/llm` i podłączone do kreatorów/poleceń.

### Anthropic setup-token

Kształt przepływu:

1. uruchom Anthropic setup-token lub paste-token z OpenClaw
2. OpenClaw zapisuje wynikowe poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje na `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do cofnięcia/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest jawnie wspierany do użycia poza Codex CLI, w tym w przepływach pracy OpenClaw.

Polecenie logowania nadal używa kanonicznego identyfikatora dostawcy OpenAI:

```bash
openclaw models auth login --provider openai
```

Użyj `--profile-id openai:<name>` dla wielu kont ChatGPT/Codex OAuth w
jednym agencie. Nie używaj `openai-codex:<name>` dla nowych profili. Doctor migruje
ten starszy prefiks do bezkolizyjnego identyfikatora profilu `openai:*`; po naprawie uruchom
`openclaw models auth list --provider openai`, zanim skopiujesz
identyfikatory profili do `auth.order` lub `/model ...@<profileId>`.

Kształt przepływu (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback pod `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może się zbindować (lub pracujesz zdalnie/bez interfejsu), wklej URL/kod przekierowania
5. wykonaj wymianę pod `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W czasie działania:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- jeśli agent pomocniczy odczytuje odziedziczony profil OAuth głównego agenta, odświeżenie
  zapisuje z powrotem do magazynu głównego agenta zamiast kopiować token odświeżania do
  magazynu agenta pomocniczego
- wyjątek: część zewnętrznych poświadczeń CLI pozostaje zarządzana zewnętrznie; OpenClaw
  ponownie odczytuje te magazyny uwierzytelniania CLI zamiast zużywać skopiowane tokeny odświeżania.
  Inicjowanie Codex CLI jest celowo węższe: zasila pusty
  profil `openai:default`, a następnie odświeżenia zarządzane przez OpenClaw utrzymują lokalny
  profil jako kanoniczny. Jeśli lokalne odświeżenie Codex się nie powiedzie, a Codex CLI ma
  użyteczny token dla tego samego konta, OpenClaw może użyć tego tokenu dla bieżącego
  żądania środowiska uruchomieniowego bez zapisywania go z powrotem do `auth-profiles.json`.

Przepływ odświeżania jest automatyczny; zwykle nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + routing

Dwa wzorce:

### 1) Preferowane: osobni agenci

Jeśli chcesz, aby „osobiste” i „służbowe” nigdy na siebie nie wpływały, użyj izolowanych agentów (osobne sesje + poświadczenia + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie dla każdego agenta (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego dostawcy.

Wybierz, który profil ma być używany:

- globalnie przez kolejność w konfiguracji (`auth.order`)
- dla sesji przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak zobaczyć istniejące identyfikatory profili:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) (reguły rotacji + cooldown)
- [Polecenia slash](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) - omówienie uwierzytelniania dostawców modeli
- [Sekrety](/pl/gateway/secrets) - przechowywanie poświadczeń i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) - klucze konfiguracji uwierzytelniania
