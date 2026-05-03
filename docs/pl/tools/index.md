---
read_when:
    - Chcesz zrozumieć, jakie narzędzia oferuje OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie lub odmówić ich użycia
    - Decydujesz między wbudowanymi narzędziami, Skills i Pluginami
summary: 'Przegląd narzędzi i pluginów OpenClaw: co agent może robić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-05-03T21:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia umożliwiają agentowi odczytywanie plików, uruchamianie poleceń, przeglądanie sieci, wysyłanie
wiadomości i interakcję z urządzeniami.

## Narzędzia, Skills i plugins

OpenClaw ma trzy współpracujące ze sobą warstwy:

<Steps>
  <Step title="Narzędzia są tym, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    plugins mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako strukturalne definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta, kiedy i jak działać">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dają agentowi kontekst, ograniczenia i wskazówki krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane wewnątrz plugins.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Plugins pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre plugins są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Instalowanie i konfigurowanie plugins](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania żadnych plugins:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamianie poleceń powłoki, zarządzanie procesami w tle             | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamianie zdalnej analizy Python w piaskownicy                     | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Sterowanie przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu) | [Przeglądarka](/pl/tools/browser)                              |
| `web_search` / `x_search` / `web_fetch`    | Wyszukiwanie w sieci, wyszukiwanie postów X, pobieranie treści stron  | [Sieć](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch)   |
| `read` / `write` / `edit`                  | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                  | Wysyłanie wiadomości przez wszystkie kanały                           | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `canvas`                                   | Sterowanie node Canvas (prezentacja, eval, snapshot)                  |                                                              |
| `nodes`                                    | Wykrywanie i wybieranie sparowanych urządzeń                          |                                                              |
| `cron` / `gateway`                         | Zarządzanie zaplanowanymi zadaniami; inspekcja, poprawianie, restartowanie lub aktualizowanie gateway |                                                              |
| `image` / `image_generate`                 | Analizowanie lub generowanie obrazów                                  | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generowanie utworów muzycznych                                        | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generowanie wideo                                                     | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja subagentów                 | [Subagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekkie odczytanie zwrotne w stylu `/status` i nadpisanie modelu sesji | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami użyj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli wybierasz `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką użyj `music_generate`. Jeśli wybierasz `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo użyj `video_generate`. Jeśli wybierasz `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania audio sterowanego przepływem pracy użyj `music_generate`, gdy Plugin taki jak
ComfyUI go rejestruje. Jest to oddzielne od `tts`, które oznacza tekst na mowę.

`session_status` to lekkie narzędzie statusu/odczytu zwrotnego w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/pamięci podręcznej oraz
aktywną etykietę modelu runtime z najnowszego wpisu użycia w transkrypcie.

`gateway` to narzędzie runtime tylko dla właściciela do operacji gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego do ścieżki przed edycjami
- `config.get` dla bieżącego snapshotu konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko dla zastąpienia pełnej konfiguracji
- `update.run` dla jawnej samodzielnej aktualizacji + restartu

Przy częściowych zmianach preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) i
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez plugins

Plugins mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Diffy](/pl/tools/diffs) — przeglądarka i renderer diffów
- [LLM Task](/pl/tools/llm-task) — krok LLM tylko w JSON do ustrukturyzowanych danych wyjściowych
- [Lobster](/pl/tools/lobster) — typowany runtime przepływów pracy z wznawialnymi zatwierdzeniami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na przepływach pracy
- [OpenProse](/pl/prose) — orkiestracja przepływów pracy markdown-first
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktowanie zaszumionych wyników narzędzi `exec` i `bash`

Narzędzia Plugin nadal są tworzone z użyciem `api.registerTool(...)` i deklarowane na liście
`contracts.tools` w manifeście plugin. OpenClaw przechwytuje zweryfikowany
deskryptor narzędzia podczas wykrywania i buforuje go według źródła plugin oraz kontraktu, dzięki czemu
późniejsze planowanie narzędzi może pominąć ładowanie runtime plugin. Wykonanie narzędzia nadal ładuje
właścicielski plugin i wywołuje zarejestrowaną implementację na żywo.

## Konfiguracja narzędzi

### Listy dozwolone i blokowane

Kontroluj, które narzędzia agent może wywoływać, przez `tools.allow` / `tools.deny` w
konfiguracji. Blokada zawsze wygrywa z zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw kończy działanie w trybie zamkniętym, gdy jawna lista dozwolonych elementów nie rozwiązuje się do żadnych wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany plugin faktycznie
rejestruje `query_db`. Jeśli żadne wbudowane narzędzie, plugin ani dołączone narzędzie MCP nie pasuje do
listy dozwolonych, uruchomienie zatrzymuje się przed wywołaniem modelu zamiast kontynuować jako
uruchomienie tylko tekstowe, które mogłoby halucynować wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych elementów przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co zawiera                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Wszystkie rdzeniowe i opcjonalne narzędzia plugins; nieograniczona baza dla szerszego dostępu do poleceń/kontroli                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skupionych na kanałach.
Pomija szersze narzędzia poleceń/kontroli, takie jak system plików, runtime,
przeglądarka, canvas, nodes, cron i sterowanie gateway. Użyj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu do poleceń/kontroli, a następnie przytnij
dostęp za pomocą `tools.allow` / `tools.deny`, gdy to potrzebne.
</Note>

`coding` zawiera lekkie narzędzia sieciowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie sterowania przeglądarką. Automatyzacja przeglądarki może sterować prawdziwymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla konkretnego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Konfigurowanie `tools.exec` lub `tools.fs` pod restrykcyjnym profilem (`messaging`, `minimal`) nie rozszerza automatycznie listy dozwolonych elementów profilu. Dodaj jawne wpisy `tools.alsoAllow` (na przykład `["exec", "process"]` dla exec albo `["read", "write", "edit"]` dla fs), gdy chcesz, aby restrykcyjny profil używał tych skonfigurowanych sekcji. OpenClaw rejestruje ostrzeżenie startowe, gdy sekcja konfiguracji jest obecna bez odpowiadającego przyznania `alsoAllow`.
</Note>

Profile `coding` i `messaging` pozwalają też na skonfigurowane narzędzia bundle MCP
pod kluczem plugin `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje normalne wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie zawiera narzędzi bundle MCP.

Przykład (domyślnie najszersza powierzchnia narzędzi):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupy narzędzi

Używaj skrótów `group:*` na listach dozwolonych/blokowanych:

| Grupa              | Narzędzia                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowany jako alias dla `exec`)                              |
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
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (nie obejmuje narzędzi Plugin)                                     |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
tagi myślenia, strukturę pomocniczą `<relevant-memories>`, ładunki XML wywołań narzędzi
w zwykłym tekście (w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowaną strukturę pomocniczą wywołań narzędzi, ujawnione tokeny sterujące modelu
w ASCII/pełnej szerokości oraz nieprawidłowy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/skracanie i możliwe symbole zastępcze dla nadmiernie dużych wierszy zamiast działać
jako surowy zrzut transkrypcji.

### Ograniczenia specyficzne dla dostawcy

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla określonych dostawców bez
zmieniania globalnych ustawień domyślnych:

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
