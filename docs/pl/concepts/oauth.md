---
read_when:
    - Chcesz zrozumieć OAuth w OpenClaw od początku do końca
    - Występują u Ciebie problemy z unieważnianiem tokenów / wylogowywaniem
    - Chcesz używać przepływów uwierzytelniania Claude CLI lub OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce obsługi wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:51:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje „uwierzytelnianie subskrypcyjne” przez OAuth dla dostawców, którzy je oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
wygląda teraz tak:

- **Klucz API Anthropic**: standardowe rozliczanie API Anthropic
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone

OAuth OpenAI Codex jest jawnie obsługiwany do użycia w zewnętrznych narzędziach takich jak
OpenClaw.

OpenClaw przechowuje zarówno uwierzytelnianie kluczem API OpenAI, jak i OAuth ChatGPT/Codex pod
kanonicznym identyfikatorem dostawcy `openai`. Starsze identyfikatory profili `openai-codex:*` i
wpisy `auth.order.openai-codex` są stanem legacy naprawianym przez
`openclaw doctor --fix`; dla nowej konfiguracji używaj identyfikatorów profili `openai:*` i `auth.order.openai`.

W przypadku Anthropic w produkcji bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

Ta strona wyjaśnia:

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie **przechowywane** są tokeny (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla sesji)

OpenClaw obsługuje też **Pluginy dostawców**, które dostarczają własne przepływy OAuth lub kluczy API.
Uruchamiaj je przez:

```bash
openclaw models auth login --provider <id>
```

## Ujście tokenów (dlaczego istnieje)

Dostawcy OAuth często tworzą **nowy token odświeżania** podczas logowania lub odświeżania. Niektórzy dostawcy (albo klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy dla tego samego użytkownika/aplikacji zostanie wydany nowy.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **ujście tokenów**:

- runtime odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i routować je deterministycznie
- ponowne użycie zewnętrznego CLI jest specyficzne dla dostawcy: Codex CLI może zainicjować pusty
  profil `openai:default`, ale gdy OpenClaw ma lokalny profil OAuth,
  lokalny token odświeżania jest kanoniczny. Jeśli ten lokalny token odświeżania zostanie odrzucony,
  OpenClaw zgłasza zarządzany profil do ponownego uwierzytelnienia zamiast używać
  materiału tokenów Codex CLI jako zapasowego runtime równoległego. Inne integracje mogą
  pozostać zarządzane zewnętrznie i ponownie odczytywać swój magazyn uwierzytelniania CLI
- ścieżki statusu i uruchamiania, które już znają skonfigurowany zakres dostawców,
  ograniczają wykrywanie zewnętrznego CLI do tego zestawu, więc niepowiązany magazyn logowania CLI nie jest
  sprawdzany przy konfiguracji z jednym dostawcą

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane w magazynach uwierzytelniania agenta:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne odwołania na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Plik zgodności legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są usuwane po wykryciu)

Plik legacy tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe respektują też `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji migawek runtime znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).

Gdy agent pomocniczy nie ma lokalnego profilu uwierzytelniania, OpenClaw używa dziedziczenia z odczytem
z domyślnego/głównego magazynu agenta. Nie klonuje przy odczycie pliku
`auth-profiles.json` głównego agenta. Tokeny odświeżania OAuth są szczególnie
wrażliwe: standardowe przepływy kopiowania domyślnie je pomijają, ponieważ niektórzy dostawcy rotują
lub unieważniają tokeny odświeżania po użyciu. Skonfiguruj osobne logowanie OAuth dla
agenta, gdy potrzebuje niezależnego konta.

## Zgodność z tokenami legacy Anthropic

<Warning>
Publiczna dokumentacja Claude Code firmy Anthropic mówi, że bezpośrednie użycie Claude Code pozostaje w ramach
limitów subskrypcji Claude, a pracownicy Anthropic poinformowali nas, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw traktuje ponowne użycie Claude CLI i
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualne dokumenty Anthropic dotyczące planów dla bezpośredniego Claude Code znajdziesz w [Używanie Claude Code
z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz korzystać z innych opcji w stylu subskrypcji w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax),
oraz [Z.AI / GLM Coding Plan](/pl/providers/zai).
</Warning>

OpenClaw udostępnia też setup-token Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/konfiguracja mogą użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `openclaw/plugin-sdk/llm` i podłączone do kreatorów/poleceń.

### setup-token Anthropic

Kształt przepływu:

1. uruchom setup-token Anthropic albo wklej-token z OpenClaw
2. OpenClaw zapisuje wynikowe poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje przy `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofania/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex jest jawnie obsługiwany do użycia poza Codex CLI, w tym w przepływach OpenClaw.

Polecenie logowania nadal używa kanonicznego identyfikatora dostawcy OpenAI:

```bash
openclaw models auth login --provider openai
```

Użyj `--profile-id openai:<name>` dla wielu kont ChatGPT/Codex OAuth w
jednym agencie. Nie używaj `openai-codex:<name>` dla nowych profili. Doctor migruje
ten starszy prefiks do bezkolizyjnego identyfikatora profilu `openai:*`; po naprawie uruchom
`openclaw models auth list --provider openai` przed skopiowaniem
identyfikatorów profili do `auth.order` albo `/model ...@<profileId>`.

Kształt przepływu (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback pod `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może zostać zbindowany (albo pracujesz zdalnie/bez interfejsu), wklej URL/kod przekierowania
5. wykonaj wymianę pod `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W runtime:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- jeśli agent pomocniczy odczytuje odziedziczony profil OAuth głównego agenta, odświeżenie
  zapisuje z powrotem do magazynu głównego agenta zamiast kopiować token odświeżania do
  magazynu agenta pomocniczego
- wyjątek: niektóre zewnętrzne poświadczenia CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje te magazyny uwierzytelniania CLI zamiast zużywać skopiowane tokeny odświeżania.
  Bootstrap Codex CLI jest celowo węższy: może zasiać pusty
  `openai:default` albo jawnie zażądany profil OpenAI tylko zanim OpenClaw
  przejmie OAuth dla dostawcy. Następnie odświeżenia należące do OpenClaw utrzymują lokalne
  profile jako kanoniczne, a wykrywanie nie dodaje uwierzytelniania Codex CLI w żadnym równoległym
  slocie. Jeśli zarządzane odświeżenie zawiedzie, OpenClaw zgłasza dotknięty profil do
  ponownego uwierzytelnienia zamiast zwracać zewnętrzny materiał tokenów CLI.

Przepływ odświeżania jest automatyczny; zazwyczaj nie musisz ręcznie zarządzać tokenami.

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

- globalnie przez kolejność konfiguracji (`auth.order`)
- dla sesji przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak zobaczyć istniejące identyfikatory profili:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązane dokumenty:

- [Failover modeli](/pl/concepts/model-failover) (reguły rotacji + cooldown)
- [Polecenia slash](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) - omówienie uwierzytelniania dostawców modeli
- [Sekrety](/pl/gateway/secrets) - przechowywanie poświadczeń i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) - klucze konfiguracji uwierzytelniania
