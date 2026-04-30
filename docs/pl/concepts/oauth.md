---
read_when:
    - Chcesz zrozumieć OAuth w OpenClaw od początku do końca
    - Napotykasz problemy z unieważnieniem tokenu / wylogowaniem
    - Chcesz używać przepływów uwierzytelniania Claude CLI lub OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce obsługi wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T09:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw obsługuje „uwierzytelnianie subskrypcyjne” przez OAuth dla dostawców, którzy je oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
wygląda teraz tak:

- **Klucz API Anthropic**: standardowe rozliczenia API Anthropic
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone

OpenAI Codex OAuth jest wyraźnie obsługiwany do użycia w narzędziach zewnętrznych, takich jak
OpenClaw. Ta strona wyjaśnia:

W środowisku produkcyjnym dla Anthropic bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla sesji)

OpenClaw obsługuje też **Pluginy dostawców**, które dostarczają własne przepływy OAuth lub kluczy API.
Uruchom je przez:

```bash
openclaw models auth login --provider <id>
```

## Ujście tokenów (dlaczego istnieje)

Dostawcy OAuth często wydają **nowy token odświeżania** podczas przepływów logowania/odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy nowy zostanie wydany dla tego samego użytkownika/aplikacji.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **ujście tokenów**:

- runtime odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i kierować je deterministycznie
- ponowne użycie zewnętrznego CLI zależy od dostawcy: Codex CLI może zainicjować pusty
  profil `openai-codex:default`, ale gdy OpenClaw ma lokalny profil OAuth,
  lokalny token odświeżania jest kanoniczny; inne integracje mogą pozostać
  zarządzane zewnętrznie i ponownie odczytywać magazyn uwierzytelniania swojego CLI
- ścieżki statusu i uruchamiania, które już znają skonfigurowany zestaw dostawców, ograniczają
  wykrywanie zewnętrznego CLI do tego zestawu, więc niepowiązany magazyn logowania CLI nie jest
  sprawdzany w konfiguracji z jednym dostawcą

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane w magazynach uwierzytelniania agentów:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne referencje na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy plik zgodności: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są usuwane po wykryciu)

Starszy plik tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe ścieżki respektują też `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych referencjach sekretów i zachowaniu aktywacji migawek w runtime znajdziesz w [Zarządzanie sekretami](/pl/gateway/secrets).

Gdy agent pomocniczy nie ma lokalnego profilu uwierzytelniania, OpenClaw używa
dziedziczenia z odczytem przez magazyn domyślnego/głównego agenta. Nie klonuje pliku
`auth-profiles.json` głównego agenta podczas odczytu. Tokeny odświeżania OAuth są szczególnie
wrażliwe: normalne przepływy kopiowania domyślnie je pomijają, ponieważ niektórzy dostawcy rotują
lub unieważniają tokeny odświeżania po użyciu. Skonfiguruj osobne logowanie OAuth dla
agenta, gdy potrzebuje niezależnego konta.

## Zgodność ze starszymi tokenami Anthropic

<Warning>
Publiczna dokumentacja Claude Code Anthropic mówi, że bezpośrednie użycie Claude Code mieści się w
limitach subskrypcji Claude, a pracownicy Anthropic poinformowali nas, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw traktuje ponowne użycie Claude CLI i
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualną dokumentację Anthropic dotyczącą planów bezpośredniego Claude Code znajdziesz w [Używanie Claude Code
z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz korzystać z innych opcji w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/pl/providers/glm).
</Warning>

OpenClaw udostępnia też setup-token Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/konfiguracja może użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Anthropic setup-token

Kształt przepływu:

1. uruchom Anthropic setup-token albo paste-token z OpenClaw
2. OpenClaw przechowuje wynikowe poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje przy `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofania/sterowania kolejnością

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest wyraźnie obsługiwany do użycia poza Codex CLI, w tym w przepływach pracy OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj weryfikator/wyzwanie PKCE + losowe `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback na `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może nasłuchiwać (albo pracujesz zdalnie/bez interfejsu), wklej URL/kod przekierowania
5. wykonaj wymianę pod `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokena dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai-codex`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W runtime:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokena dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- jeśli agent pomocniczy odczytuje odziedziczony profil OAuth głównego agenta, odświeżenie
  zapisuje z powrotem do magazynu głównego agenta zamiast kopiować token odświeżania do
  magazynu agenta pomocniczego
- wyjątek: niektóre poświadczenia zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje te magazyny uwierzytelniania CLI zamiast zużywać skopiowane tokeny odświeżania.
  Inicjowanie z Codex CLI jest celowo węższe: tworzy pusty profil
  `openai-codex:default`, a następnie odświeżenia należące do OpenClaw utrzymują lokalny
  profil jako kanoniczny.

Przepływ odświeżania jest automatyczny; zwykle nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + kierowanie

Dwa wzorce:

### 1) Zalecane: osobni agenci

Jeśli chcesz, aby „osobiste” i „służbowe” nigdy ze sobą nie wchodziły w interakcję, użyj izolowanych agentów (osobne sesje + poświadczenia + obszar roboczy):

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

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [Przełączanie modeli po awarii](/pl/concepts/model-failover) (rotacja + reguły cooldown)
- [Polecenia ukośnikowe](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) — przegląd uwierzytelniania dostawców modeli
- [Sekrety](/pl/gateway/secrets) — przechowywanie poświadczeń i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
