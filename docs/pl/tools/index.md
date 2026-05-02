---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie lub odmówić ich użycia.
    - Wybierasz między wbudowanymi narzędziami, Skills i pluginami
summary: 'Omówienie narzędzi i Pluginów OpenClaw: co agent może robić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-05-02T20:58:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się za pomocą **narzędzi**.
Narzędzia pozwalają agentowi odczytywać pliki, uruchamiać polecenia, przeglądać internet, wysyłać
wiadomości i wchodzić w interakcje z urządzeniami.

## Narzędzia, Skills i pluginy

OpenClaw ma trzy warstwy, które działają razem:

<Steps>
  <Step title="Narzędzia są tym, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw zawiera zestaw **wbudowanych narzędzi**, a
    pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako strukturalne definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta, kiedy i jak działać">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dostarczają agentowi kontekstu, ograniczeń i wskazówek krok po kroku
    dotyczących skutecznego korzystania z narzędzi. Skills znajdują się w Twoim obszarze roboczym, w folderach współdzielonych
    albo są dostarczane wewnątrz pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie z internetu, wyszukiwanie w internecie i więcej. Niektóre pluginy są **podstawowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek pluginów:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamianie poleceń powłoki, zarządzanie procesami w tle             | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamianie izolowanej zdalnej analizy Python                        | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Sterowanie przeglądarką Chromium (nawigacja, kliknięcie, zrzut ekranu) | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Wyszukiwanie w internecie, wyszukiwanie postów X, pobieranie treści strony | [Internet](/pl/tools/web), [Pobieranie z internetu](/pl/tools/web-fetch) |
| `read` / `write` / `edit`                  | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                  | Wysyłanie wiadomości we wszystkich kanałach                           | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `canvas`                                   | Sterowanie Canvas Node (prezentacja, ewaluacja, migawka)              |                                                              |
| `nodes`                                    | Wykrywanie sparowanych urządzeń i kierowanie do nich działań          |                                                              |
| `cron` / `gateway`                         | Zarządzanie zaplanowanymi zadaniami; sprawdzanie, poprawianie, restartowanie lub aktualizowanie Gateway |                                                              |
| `image` / `image_generate`                 | Analizowanie lub generowanie obrazów                                  | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generowanie ścieżek muzycznych                                        | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generowanie wideo                                                     | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja subagentów                 | [Subagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekki odczyt zwrotny w stylu `/status` i nadpisanie modelu sesji      | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli wskazujesz `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli wskazujesz `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli wskazujesz `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania audio sterowanego przepływem pracy używaj `music_generate`, gdy rejestruje je Plugin taki jak
ComfyUI. To funkcja odrębna od `tts`, czyli zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu zwrotnego w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` usuwa to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/pamięci podręcznej oraz
etykietę aktywnego modelu wykonawczego z najnowszego wpisu użycia w transkrypcie.

`gateway` to narzędzie wykonawcze tylko dla właściciela, przeznaczone do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego do ścieżki przed edycjami
- `config.get` dla bieżącego zrzutu konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do zastąpienia całej konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

W przypadku częściowych zmian preferuj najpierw `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) oraz
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez Plugin

Pluginy mogą rejestrować dodatkowe narzędzia. Przykłady:

- [Diffs](/pl/tools/diffs) — przeglądarka i renderer diffów
- [LLM Task](/pl/tools/llm-task) — krok LLM wyłącznie w JSON do uporządkowanych danych wyjściowych
- [Lobster](/pl/tools/lobster) — typowane środowisko uruchomieniowe workflow ze wznawialnymi zatwierdzeniami
- [Music Generation](/pl/tools/music-generation) — wspólne narzędzie `music_generate` z providerami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja workflow z podejściem markdown-first
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

Narzędzia Plugin nadal są tworzone za pomocą `api.registerTool(...)` i deklarowane na liście
`contracts.tools` w manifeście Plugin. OpenClaw przechwytuje zweryfikowany
deskryptor narzędzia podczas wykrywania i buforuje go według źródła Plugin oraz kontraktu, dzięki czemu
późniejsze planowanie narzędzi może pominąć ładowanie środowiska uruchomieniowego Plugin. Wykonanie narzędzia nadal ładuje
właścicielski Plugin i wywołuje aktywną zarejestrowaną implementację.

## Konfiguracja narzędzi

### Listy dozwolonych i zabronionych

Kontroluj, które narzędzia agent może wywoływać, używając `tools.allow` / `tools.deny` w
konfiguracji. Odmowa zawsze ma pierwszeństwo przed zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw zamyka dostęp, gdy jawna lista dozwolonych nie wskazuje żadnych możliwych do wywołania narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany Plugin faktycznie
rejestruje `query_db`. Jeśli żadne wbudowane narzędzie, Plugin ani dołączone narzędzie MCP nie pasuje do
listy dozwolonych, przebieg zatrzymuje się przed wywołaniem modelu zamiast kontynuować jako
przebieg wyłącznie tekstowy, który mógłby zmyślić wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nieograniczona baza dla szerszego dostępu do poleceń/sterowania; to samo co pozostawienie `tools.profile` bez ustawienia                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skoncentrowanych na kanałach.
Pomija szersze narzędzia poleceń/sterowania, takie jak system plików, środowisko uruchomieniowe,
przeglądarka, canvas, węzły, cron i sterowanie Gateway. Użyj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu do poleceń/sterowania, a następnie w razie potrzeby ogranicz
dostęp za pomocą `tools.allow` / `tools.deny`.
</Note>

`coding` obejmuje lekkie narzędzia webowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie do sterowania przeglądarką. Automatyzacja przeglądarki może obsługiwać rzeczywiste
sesje i zalogowane profile, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla konkretnego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Konfiguracja `tools.exec` lub `tools.fs` pod restrykcyjnym profilem (`messaging`, `minimal`) nie rozszerza niejawnie listy dozwolonych tego profilu. Dodaj jawne wpisy `tools.alsoAllow` (na przykład `["exec", "process"]` dla exec albo `["read", "write", "edit"]` dla fs), gdy chcesz, aby restrykcyjny profil używał tych skonfigurowanych sekcji. OpenClaw rejestruje ostrzeżenie startowe, gdy sekcja konfiguracji jest obecna bez pasującego przyznania `alsoAllow`.
</Note>

Profile `coding` i `messaging` pozwalają też na skonfigurowane narzędzia bundle MCP
pod kluczem Plugin `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje zwykłe wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie obejmuje narzędzi bundle MCP.

Przykład (domyślnie najszersza powierzchnia narzędzi):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupy narzędzi

Używaj skrótów `group:*` na listach dozwolonych/zabronionych:

| Grupa              | Narzędzia                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias dla `exec`)                             |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem narzędzi Plugin)                                    |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
tagi myślenia, szkielet `<relevant-memories>`, zwykłotekstowe ładunki XML wywołań narzędzi
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
obniżony szkielet wywołań narzędzi, ujawnione tokeny sterowania modelem ASCII/pełnej szerokości
oraz nieprawidłowy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/obcinanie i ewentualne placeholdery dla zbyt dużych wierszy zamiast działać
jako surowy zrzut transkrypcji.

### Ograniczenia specyficzne dla dostawcy

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla konkretnych dostawców bez
zmieniania globalnych wartości domyślnych:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
