---
read_when:
    - Chcesz zrozumieć działanie OAuth w OpenClaw od początku do końca
    - Masz problemy z unieważnianiem tokenów / wylogowywaniem
    - Chcesz używać Claude CLI lub przepływów uwierzytelniania OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce dla wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-04-07T09:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw obsługuje „subscription auth” przez OAuth dla dostawców, którzy to oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
jest teraz następujący:

- **Klucz API Anthropic**: standardowe rozliczanie przez API Anthropic
- **Anthropic Claude CLI / subscription auth w OpenClaw**: pracownicy Anthropic
  poinformowali nas, że takie użycie jest ponownie dozwolone

OpenAI Codex OAuth jest oficjalnie wspierany do użycia w narzędziach zewnętrznych, takich jak
OpenClaw. Ta strona wyjaśnia:

W przypadku Anthropic w środowisku produkcyjnym bezpieczniejszą zalecaną ścieżką pozostaje uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla sesji)

OpenClaw obsługuje także **pluginy dostawców**, które dostarczają własne przepływy OAuth lub API-key.
Uruchom je za pomocą:

```bash
openclaw models auth login --provider <id>
```

## Token sink (dlaczego istnieje)

Dostawcy OAuth często generują **nowy token odświeżania** podczas logowania lub odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy nowy zostanie wydany dla tego samego użytkownika/aplikacji.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **token sink**:

- środowisko uruchomieniowe odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i kierować ruch do nich w sposób deterministyczny
- gdy poświadczenia są ponownie używane z zewnętrznego CLI, takiego jak Codex CLI, OpenClaw
  odzwierciedla je wraz z informacją o pochodzeniu i ponownie odczytuje to zewnętrzne źródło zamiast
  samodzielnie obracać token odświeżania

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane **per agent**:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne odwołania na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Plik zgodności z wersjami starszymi: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są czyszczone po wykryciu)

Starszy plik tylko do importu (nadal wspierany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe lokalizacje respektują także `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełne odniesienie: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji migawek w środowisku uruchomieniowym znajdziesz w [Secrets Management](/pl/gateway/secrets).

## Zgodność ze starszymi tokenami Anthropic

<Warning>
Publiczna dokumentacja Claude Code od Anthropic mówi, że bezpośrednie użycie Claude Code pozostaje w granicach
limitów subskrypcji Claude, a pracownicy Anthropic poinformowali nas, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. Dlatego OpenClaw traktuje ponowne użycie Claude CLI oraz
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualną dokumentację planów Anthropic dla bezpośredniego Claude Code znajdziesz tutaj: [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz korzystać w OpenClaw z innych opcji w stylu subskrypcyjnym, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/pl/providers/glm).
</Warning>

OpenClaw udostępnia także setup-token Anthropic jako wspieraną ścieżkę uwierzytelniania tokenem, ale obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/configure może użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Anthropic setup-token

Kształt przepływu:

1. uruchom setup-token Anthropic lub wklej token z poziomu OpenClaw
2. OpenClaw zapisuje wynikowe poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje ustawiony na `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne do wycofania zmian/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest oficjalnie wspierany do użycia poza Codex CLI, w tym w przepływach OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj verifier/challenge PKCE oraz losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback pod adresem `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może się zbindować (lub pracujesz zdalnie/bez interfejsu), wklej URL przekierowania/kod
5. wymień token pod adresem `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka w kreatorze to `openclaw onboard` → wybór uwierzytelniania `openai-codex`.

## Odświeżanie i wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W środowisku uruchomieniowym:

- jeśli `expires` wskazuje przyszłość → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- wyjątek: ponownie używane poświadczenia z zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje magazyn uwierzytelniania CLI i nigdy sam nie wykorzystuje skopiowanego tokenu odświeżania

Przepływ odświeżania jest automatyczny; zwykle nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + routing

Dwa wzorce:

### 1) Zalecane: oddzielni agenci

Jeśli chcesz, aby konto „osobiste” i „służbowe” nigdy się nie stykały, używaj izolowanych agentów (oddzielne sesje + poświadczenia + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie per agent (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego dostawcy.

Wybierz, który profil ma być używany:

- globalnie przez kolejność w konfiguracji (`auth.order`)
- dla konkretnej sesji przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [/concepts/model-failover](/pl/concepts/model-failover) (reguły rotacji i cooldown)
- [/tools/slash-commands](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Authentication](/pl/gateway/authentication) — przegląd uwierzytelniania dostawców modeli
- [Secrets](/pl/gateway/secrets) — przechowywanie poświadczeń i SecretRef
- [Configuration Reference](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
