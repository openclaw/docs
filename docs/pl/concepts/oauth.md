---
read_when:
    - Chcesz zrozumieć OAuth w OpenClaw od początku do końca
    - |-
      Masz problemy z unieważnianiem tokenów / wylogowywaniemიკაშიassistant to=final code  天天中彩票未translated_text = """Masz problemy z unieważnianiem tokenów / wylogowywaniem"""
      print(translated_text)
    - Chcesz używać przepływów uwierzytelniania Claude CLI lub OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T09:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw obsługuje „uwierzytelnianie subskrypcyjne” przez OAuth dla providerów, którzy je oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
jest obecnie następujący:

- **Klucz API Anthropic**: zwykłe rozliczanie API Anthropic
- **Anthropic Claude CLI / uwierzytelnianie subskrypcyjne wewnątrz OpenClaw**: pracownicy Anthropic
  powiedzieli nam, że to użycie jest ponownie dozwolone

OpenAI Codex OAuth jest jawnie obsługiwany do użytku w narzędziach zewnętrznych takich jak
OpenClaw. Ta strona wyjaśnia:

W przypadku Anthropic w środowisku produkcyjnym bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla poszczególnych sesji)

OpenClaw obsługuje również **Pluginy providerów**, które dostarczają własne przepływy OAuth lub API‑key.
Uruchamiaj je przez:

```bash
openclaw models auth login --provider <id>
```

## Token sink (dlaczego istnieje)

Providery OAuth często tworzą **nowy token odświeżania** podczas przepływów logowania/odświeżania. Niektórzy providerzy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy nowy zostanie wydany dla tego samego użytkownika/aplikacji.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich losowo zostaje później „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **token sink**:

- runtime odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i kierować je deterministycznie
- gdy poświadczenia są używane ponownie z zewnętrznego CLI, takiego jak Codex CLI, OpenClaw
  odzwierciedla je wraz z pochodzeniem i ponownie odczytuje to zewnętrzne źródło zamiast
  samodzielnie obracać token odświeżania

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane **per agent**:

- Profile auth (OAuth + klucze API + opcjonalne odwołania na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy plik zgodności: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są scrubowane po wykryciu)

Starszy plik tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe lokalizacje respektują również `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych odwołaniach do sekretów i zachowaniu aktywacji snapshotu runtime znajdziesz w [Zarządzaniu sekretami](/pl/gateway/secrets).

## Zgodność ze starszym tokenem Anthropic

<Warning>
Publiczna dokumentacja Claude Code od Anthropic mówi, że bezpośrednie użycie Claude Code pozostaje w granicach
limitów subskrypcji Claude, a pracownicy Anthropic powiedzieli nam, że użycie Claude
CLI w stylu OpenClaw jest ponownie dozwolone. OpenClaw traktuje więc ponowne użycie Claude CLI i
użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic
opublikuje nową politykę.

Aktualną dokumentację Anthropic dotyczącą planów direct-Claude-Code znajdziesz w [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz innych opcji w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/pl/providers/glm).
</Warning>

OpenClaw udostępnia również setup-token Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboard/configure może użyć go ponownie bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Anthropic setup-token

Kształt przepływu:

1. uruchom Anthropic setup-token lub paste-token z OpenClaw
2. OpenClaw zapisuje wynikowe poświadczenie Anthropic w profilu auth
3. wybór modelu pozostaje na `anthropic/...`
4. istniejące profile auth Anthropic pozostają dostępne dla rollbacku/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest jawnie obsługiwany do użycia poza Codex CLI, w tym w przepływach pracy OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj verifier/challenge PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback na `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może się związać (lub jesteś zdalnie/headless), wklej URL/code przekierowania
5. wymień w `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór auth `openai-codex`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W runtime:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- wyjątek: ponownie używane poświadczenia zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje magazyn auth CLI i nigdy sam nie zużywa skopiowanego tokenu odświeżania

Przepływ odświeżania jest automatyczny; zasadniczo nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + routing

Dwa wzorce:

### 1) Preferowane: oddzielni agenci

Jeśli chcesz, aby „osobiste” i „służbowe” nigdy się nie stykały, użyj izolowanych agentów (oddzielne sesje + poświadczenia + obszar roboczy):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj auth per agent (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego providera.

Wybierz, który profil ma być używany:

- globalnie przez kolejność konfiguracji (`auth.order`)
- per sesja przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [/concepts/model-failover](/pl/concepts/model-failover) (reguły rotacji + cooldown)
- [/tools/slash-commands](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) — przegląd uwierzytelniania providerów modeli
- [Sekrety](/pl/gateway/secrets) — przechowywanie poświadczeń i SecretRef
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji auth
