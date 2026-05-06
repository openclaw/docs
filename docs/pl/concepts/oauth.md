---
read_when:
    - Chcesz zrozumieć OAuth w OpenClaw od początku do końca
    - Napotykasz problemy z unieważnianiem tokenów / wylogowaniem
    - Potrzebujesz przepływów uwierzytelniania Claude CLI lub OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce obsługi wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T09:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje „uwierzytelnianie subskrypcyjne” przez OAuth dla dostawców, którzy je oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). Dla Anthropic praktyczny podział
wygląda teraz tak:

- **klucz API Anthropic**: standardowe rozliczanie API Anthropic
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  przekazali nam, że takie użycie jest ponownie dozwolone

OpenAI Codex OAuth jest jawnie obsługiwany do użycia w zewnętrznych narzędziach, takich jak
OpenClaw. Ta strona wyjaśnia:

W przypadku Anthropic w produkcji bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + zastąpienia dla poszczególnych sesji)

OpenClaw obsługuje też **pluginy dostawców**, które dostarczają własne przepływy OAuth lub
kluczy API. Uruchamiaj je przez:

```bash
openclaw models auth login --provider <id>
```

## Odbiornik tokenów (dlaczego istnieje)

Dostawcy OAuth często tworzą **nowy token odświeżania** podczas przepływów logowania/odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy dla tego samego użytkownika/aplikacji zostanie wydany nowy.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **odbiornik tokenów**:

- runtime odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i kierować je deterministycznie
- ponowne użycie zewnętrznego CLI zależy od dostawcy: Codex CLI może zainicjować pusty
  profil `openai-codex:default`, ale gdy OpenClaw ma lokalny profil OAuth,
  lokalny token odświeżania jest kanoniczny; inne integracje mogą pozostać
  zarządzane zewnętrznie i ponownie odczytywać swój magazyn uwierzytelniania CLI
- ścieżki statusu i uruchamiania, które już znają skonfigurowany zestaw dostawców, ograniczają
  odkrywanie zewnętrznego CLI do tego zestawu, dzięki czemu niepowiązany magazyn logowania CLI
  nie jest sondowany w konfiguracji z jednym dostawcą

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane w magazynach uwierzytelniania agenta:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne odwołania na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy plik zgodności: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są czyszczone po wykryciu)

Starszy plik tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe ścieżki respektują też `$OPENCLAW_STATE_DIR` (zastąpienie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji migawki runtime znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).

Gdy agent dodatkowy nie ma lokalnego profilu uwierzytelniania, OpenClaw używa
dziedziczenia z odczytem z magazynu domyślnego/głównego agenta. Nie klonuje
`auth-profiles.json` głównego agenta podczas odczytu. Tokeny odświeżania OAuth są szczególnie
wrażliwe: zwykłe przepływy kopiowania domyślnie je pomijają, ponieważ niektórzy dostawcy rotują
lub unieważniają tokeny odświeżania po użyciu. Skonfiguruj osobne logowanie OAuth dla
agenta, gdy potrzebuje niezależnego konta.

## Zgodność ze starszymi tokenami Anthropic

<Warning>
Publiczna dokumentacja Claude Code firmy Anthropic mówi, że bezpośrednie użycie Claude Code mieści się w
limitach subskrypcji Claude, a pracownicy Anthropic przekazali nam, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw traktuje ponowne użycie Claude CLI i
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualne dokumenty Anthropic dotyczące planów bezpośredniego Claude Code znajdziesz w [Używanie Claude Code
z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz używać innych opcji subskrypcyjnych w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/pl/providers/glm).
</Warning>

OpenClaw udostępnia też token konfiguracyjny Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/konfiguracja może użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Token konfiguracyjny Anthropic

Kształt przepływu:

1. uruchom token konfiguracyjny Anthropic lub wklej-token z OpenClaw
2. OpenClaw zapisuje wynikowe poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje przy `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofania/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest jawnie obsługiwany do użycia poza Codex CLI, w tym w przepływach OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić wywołanie zwrotne na `http://127.0.0.1:1455/auth/callback`
4. jeśli nie można powiązać wywołania zwrotnego (albo pracujesz zdalnie/bez interfejsu graficznego), wklej URL przekierowania/kod
5. wykonaj wymianę pod `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai-codex`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W runtime:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- jeśli agent dodatkowy odczytuje odziedziczony profil OAuth głównego agenta, odświeżenie
  zapisuje z powrotem do magazynu głównego agenta zamiast kopiować token odświeżania do
  magazynu agenta dodatkowego
- wyjątek: niektóre poświadczenia zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje te magazyny uwierzytelniania CLI zamiast zużywać skopiowane tokeny odświeżania.
  Inicjowanie z Codex CLI jest celowo węższe: zasiewa pusty
  profil `openai-codex:default`, a następnie odświeżenia należące do OpenClaw utrzymują lokalny
  profil jako kanoniczny.

Przepływ odświeżania jest automatyczny; zwykle nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + kierowanie

Dwa wzorce:

### 1) Preferowane: osobni agenci

Jeśli chcesz, aby „osobiste” i „służbowe” nigdy nie oddziaływały na siebie, użyj izolowanych agentów (osobne sesje + poświadczenia + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie dla każdego agenta (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego dostawcy.

Wybierz, który profil jest używany:

- globalnie przez kolejność konfiguracji (`auth.order`)
- dla poszczególnych sesji przez `/model ...@<profileId>`

Przykład (zastąpienie sesji):

- `/model Opus@anthropic:work`

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązane dokumenty:

- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) (rotacja + reguły cooldown)
- [Polecenia slash](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) - omówienie uwierzytelniania dostawców modeli
- [Sekrety](/pl/gateway/secrets) - przechowywanie poświadczeń i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) - klucze konfiguracji uwierzytelniania
