---
read_when:
    - Chcesz zrozumieć OAuth w OpenClaw od początku do końca
    - Masz problemy z unieważnianiem tokenów / wylogowywaniem
    - Chcesz używać Claude CLI lub przepływów uwierzytelniania OAuth
    - Chcesz używać wielu kont lub routingu profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T13:51:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw obsługuje „subscription auth” przez OAuth dla dostawców, którzy to oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku subskrypcji Anthropic nowa
konfiguracja powinna używać lokalnej ścieżki logowania **Claude CLI** na hoście gateway, ale
Anthropic rozróżnia bezpośrednie użycie Claude Code od ścieżki ponownego użycia w OpenClaw.
Publiczna dokumentacja Anthropic dotycząca Claude Code mówi, że bezpośrednie użycie Claude Code
pozostaje w ramach limitów subskrypcji Claude. Osobno Anthropic powiadomił użytkowników
OpenClaw **4 kwietnia 2026 o 12:00 PT / 20:00 BST**, że OpenClaw jest traktowany jako
zewnętrzny harness i teraz wymaga **Extra Usage** dla tego ruchu.
OAuth OpenAI Codex jest jawnie obsługiwany do użycia w narzędziach zewnętrznych, takich jak
OpenClaw. Ta strona wyjaśnia:

W przypadku Anthropic w środowisku produkcyjnym bezpieczniejszą zalecaną ścieżką jest uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania dla poszczególnych sesji)

OpenClaw obsługuje także **provider plugins**, które dostarczają własne przepływy OAuth lub
uwierzytelniania kluczem API. Uruchamiaj je przez:

```bash
openclaw models auth login --provider <id>
```

## Token sink (dlaczego istnieje)

Dostawcy OAuth często wystawiają **nowy token odświeżania** podczas przepływów logowania/odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze tokeny odświeżania, gdy nowy zostanie wystawiony dla tego samego użytkownika/aplikacji.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich później losowo zostaje „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **token sink**:

- środowisko wykonawcze odczytuje poświadczenia z **jednego miejsca**
- możemy przechowywać wiele profili i routować je deterministycznie
- gdy poświadczenia są ponownie używane z zewnętrznego CLI, takiego jak Codex CLI, OpenClaw
  odzwierciedla je z informacją o pochodzeniu i ponownie odczytuje to zewnętrzne źródło zamiast
  samodzielnie obracać token odświeżania

## Przechowywanie (gdzie znajdują się tokeny)

Sekrety są przechowywane **per agent**:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne referencje na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Plik zgodności wstecznej: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są czyszczone po wykryciu)

Starszy plik tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe ścieżki uwzględniają też `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Informacje o statycznych referencjach do sekretów i zachowaniu aktywacji migawki w runtime znajdziesz w [Zarządzanie sekretami](/gateway/secrets).

## Zgodność starszych tokenów Anthropic

<Warning>
Publiczna dokumentacja Anthropic dotycząca Claude Code mówi, że bezpośrednie użycie Claude Code pozostaje w ramach
limitów subskrypcji Claude. Osobno Anthropic poinformował użytkowników OpenClaw
**4 kwietnia 2026 o 12:00 PT / 20:00 BST**, że **OpenClaw jest traktowany jako
zewnętrzny harness**. Istniejące profile tokenów Anthropic pozostają technicznie
używalne w OpenClaw, ale Anthropic twierdzi, że ścieżka OpenClaw wymaga teraz **Extra
Usage** (rozliczanego oddzielnie w modelu pay-as-you-go, poza subskrypcją) dla tego ruchu.

Aktualną dokumentację Anthropic dotyczącą bezpośredniego planu Claude Code znajdziesz tutaj: [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz korzystać z innych opcji typu subskrypcyjnego w OpenClaw, zobacz [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax)
oraz [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw ponownie udostępnia teraz setup-token Anthropic jako starszą/ręczną ścieżkę.
Ostrzeżenie Anthropic dotyczące rozliczeń specyficznych dla OpenClaw nadal dotyczy tej ścieżki, więc
używaj jej ze świadomością, że Anthropic wymaga **Extra Usage** dla ruchu logowania Claude sterowanego przez OpenClaw.

## Migracja Anthropic Claude CLI

Jeśli Claude CLI jest już zainstalowane i zalogowane na hoście gateway, możesz
przełączyć wybór modelu Anthropic na lokalny backend CLI. Jest to
obsługiwana ścieżka OpenClaw, gdy chcesz ponownie wykorzystać lokalne logowanie Claude CLI na
tym samym hoście.

Wymagania wstępne:

- binarka `claude` jest zainstalowana na hoście gateway
- Claude CLI jest już tam uwierzytelnione przez `claude auth login`

Polecenie migracji:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Skrót w onboardingu:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Zachowuje to istniejące profile uwierzytelniania Anthropic na potrzeby wycofania zmian, ale przepisuje główną
ścieżkę modelu domyślnego z `anthropic/...` na `claude-cli/...`, przepisuje pasujące
zapasowe modele Anthropic Claude i dodaje pasujące wpisy listy dozwolonych `claude-cli/...`
w `agents.defaults.models`.

Weryfikacja:

```bash
openclaw models status
```

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Anthropic Claude CLI

Kształt przepływu:

Ścieżka Claude CLI:

1. zaloguj się przez `claude auth login` na hoście gateway
2. uruchom `openclaw models auth login --provider anthropic --method cli --set-default`
3. nie zapisuj nowego profilu uwierzytelniania; przełącz wybór modelu na `claude-cli/...`
4. zachowaj istniejące profile uwierzytelniania Anthropic na potrzeby wycofania zmian

Publiczna dokumentacja Anthropic dotycząca Claude Code opisuje ten bezpośredni przepływ
logowania subskrypcyjnego Claude dla samego `claude`. OpenClaw może ponownie użyć tego lokalnego logowania, ale
Anthropic osobno klasyfikuje ścieżkę kontrolowaną przez OpenClaw jako użycie zewnętrznego
harness do celów rozliczeniowych.

Ścieżka interaktywnego asystenta:

- `openclaw onboard` / `openclaw configure` → wybór uwierzytelniania `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex jest jawnie obsługiwany do użycia poza Codex CLI, w tym w przepływach OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj verifier/challenge PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback pod `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może się zbindować (lub pracujesz zdalnie/bez interfejsu), wklej URL przekierowania/kod
5. wymień token pod `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka w kreatorze to `openclaw onboard` → wybór uwierzytelniania `openai-codex`.

## Odświeżanie + wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W runtime:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- wyjątek: poświadczenia ponownie używane z zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje magazyn uwierzytelniania CLI i nigdy samodzielnie nie zużywa skopiowanego tokenu odświeżania

Przepływ odświeżania jest automatyczny; zwykle nie trzeba ręcznie zarządzać tokenami.

## Wiele kont (profile) + routing

Dwa wzorce:

### 1) Preferowane: oddzielni agenci

Jeśli chcesz, aby „osobiste” i „służbowe” nigdy się nie stykały, użyj izolowanych agentów (oddzielne sesje + poświadczenia + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie per agent (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego dostawcy.

Wybór używanego profilu:

- globalnie przez kolejność w konfiguracji (`auth.order`)
- per sesja przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [/concepts/model-failover](/concepts/model-failover) (reguły rotacji + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Authentication](/gateway/authentication) — przegląd uwierzytelniania dostawców modeli
- [Secrets](/gateway/secrets) — przechowywanie poświadczeń i SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
