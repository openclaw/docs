---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie albo odmówić im dostępu.
    - Decydujesz między wbudowanymi narzędziami, Skills i pluginami
summary: 'Omówienie narzędzi i pluginów OpenClaw: co agent może robić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-05-10T19:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia pozwalają agentowi czytać pliki, uruchamiać polecenia, przeglądać sieć, wysyłać
wiadomości i wchodzić w interakcje z urządzeniami.

## Narzędzia, Skills i pluginy

OpenClaw ma trzy współpracujące ze sobą warstwy:

<Steps>
  <Step title="Narzędzia są tym, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta, kiedy i jak działać">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dostarczają agentowi kontekst, ograniczenia i instrukcje krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane w pluginach.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów, generowanie wideo,
    pobieranie treści z sieci, wyszukiwanie w sieci i więcej. Niektóre pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Zainstaluj i skonfiguruj pluginy](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i dostępne bez instalowania żadnych pluginów:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamia zdalną analizę Python w piaskownicy                         | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Steruje przeglądarką Chromium (nawigacja, kliknięcie, zrzut ekranu)   | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Wyszukuje w sieci, wyszukuje posty X, pobiera zawartość strony        | [Sieć](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch)   |
| `read` / `write` / `edit`                  | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Zastosuj poprawkę](/pl/tools/apply-patch)                      |
| `message`                                  | Wysyła wiadomości we wszystkich kanałach                              | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `nodes`                                    | Wykrywa i adresuje sparowane urządzenia                               |                                                              |
| `cron` / `gateway`                         | Zarządza zaplanowanymi zadaniami; sprawdza, poprawia, restartuje lub aktualizuje Gateway |                                                              |
| `image` / `image_generate`                 | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generuje ścieżki muzyczne                                             | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generuje filmy                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja podagentów                 | [Podagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekki odczyt zwrotny w stylu `/status` i nadpisanie modelu sesji      | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami użyj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli celujesz w `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką użyj `music_generate`. Jeśli celujesz w `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo użyj `video_generate`. Jeśli celujesz w `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania audio sterowanego przepływem pracy użyj `music_generate`, gdy plugin taki jak
ComfyUI je rejestruje. Jest to osobne od `tts`, czyli zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu zwrotnego w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/pamięci podręcznej oraz
etykietę aktywnego modelu runtime z najnowszego wpisu użycia transkryptu.

`gateway` to narzędzie runtime tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego ścieżką przed edycjami
- `config.get` dla bieżącego zrzutu konfiguracji + skrótu
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko dla pełnego zastąpienia konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

Przy częściowych zmianach preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) i
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Przykłady:

- [Canvas](/pl/plugins/reference/canvas) — eksperymentalny dołączony plugin do sterowania Canvas w Node i renderowania A2UI
- [Diffy](/pl/tools/diffs) — przeglądarka i renderer diffów
- [Zadanie LLM](/pl/tools/llm-task) — krok LLM wyłącznie JSON do ustrukturyzowanego wyjścia
- [Lobster](/pl/tools/lobster) — typowany runtime przepływów pracy z wznawialnymi zatwierdzeniami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na przepływach pracy
- [OpenProse](/pl/prose) — orkiestracja przepływów pracy z markdown jako pierwszym formatem
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

Narzędzia pluginów nadal są tworzone za pomocą `api.registerTool(...)` i deklarowane na liście
`contracts.tools` w manifeście pluginu. OpenClaw przechwytuje zweryfikowany
deskryptor narzędzia podczas wykrywania i buforuje go według źródła pluginu i kontraktu, dzięki czemu
późniejsze planowanie narzędzi może pominąć ładowanie runtime pluginu. Wykonanie narzędzia nadal ładuje
plugin będący właścicielem i wywołuje zarejestrowaną implementację na żywo.

[Wyszukiwanie narzędzi](/pl/tools/tool-search) to kompaktowa powierzchnia
dla dużych katalogów. Zamiast umieszczać każdy schemat narzędzia OpenClaw, MCP lub klienta
w prompcie, OpenClaw może dać modelowi izolowany runtime Node
z `openclaw.tools.search`, `openclaw.tools.describe` i
`openclaw.tools.call`. Wywołania nadal wracają przez Gateway, więc zasady
narzędzi, zatwierdzenia, hooki i dzienniki sesji pozostają autorytatywne.

## Konfiguracja narzędzi

### Listy zezwoleń i odmów

Kontroluj, które narzędzia agent może wywoływać, przez `tools.allow` / `tools.deny` w
konfiguracji. Odmowa zawsze wygrywa z zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw kończy bez uprawnień, gdy jawna lista zezwoleń nie rozwiązuje się do żadnych wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany plugin faktycznie
rejestruje `query_db`. Jeśli żadne narzędzie wbudowane, plugin ani dołączone narzędzie MCP nie pasuje do
listy zezwoleń, uruchomienie zatrzymuje się przed wywołaniem modelu, zamiast kontynuować jako
uruchomienie wyłącznie tekstowe, które mogłoby halucynować wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową listę zezwoleń przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co zawiera                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Wszystkie rdzeniowe i opcjonalne narzędzia pluginów; nieograniczona baza dla szerszego dostępu poleceń/kontroli                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skupionych na kanałach.
Pomija szersze narzędzia poleceń/kontroli, takie jak system plików, runtime,
przeglądarka, canvas, nodes, cron i kontrola Gateway. Użyj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu poleceń/kontroli, a następnie przytnij
dostęp przez `tools.allow` / `tools.deny`, gdy to potrzebne.
</Note>

`coding` obejmuje lekkie narzędzia sieciowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie sterowania przeglądarką. Automatyzacja przeglądarki może sterować rzeczywistymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla konkretnego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Konfigurowanie `tools.exec` lub `tools.fs` pod restrykcyjnym profilem (`messaging`, `minimal`) nie poszerza domyślnie listy zezwoleń profilu. Dodaj jawne wpisy `tools.alsoAllow` (na przykład `["exec", "process"]` dla exec albo `["read", "write", "edit"]` dla fs), gdy chcesz, aby restrykcyjny profil używał tych skonfigurowanych sekcji. OpenClaw rejestruje ostrzeżenie startowe, gdy sekcja konfiguracji jest obecna bez pasującego uprawnienia `alsoAllow`.
</Note>

Profile `coding` i `messaging` pozwalają także na skonfigurowane dołączone narzędzia MCP
pod kluczem pluginu `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje normalne narzędzia wbudowane, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie obejmuje dołączonych narzędzi MCP.

Przykład (domyślnie najszersza powierzchnia narzędzi):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupy narzędzi

Używaj skrótów `group:*` na listach zezwoleń/odmów:

| Grupa              | Narzędzia                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias dla `exec`)                             |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas, gdy dołączony Plugin Canvas jest włączony                                                |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem narzędzi Plugin)                                    |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
tagi myślenia, rusztowanie `<relevant-memories>`, zwykłotekstowe ładunki XML
wywołań narzędzi (w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi),
obniżone rusztowanie wywołań narzędzi, ujawnione tokeny sterujące modelu w formacie ASCII/pełnej szerokości
oraz zniekształcony XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/ucięcie i możliwe symbole zastępcze dla zbyt dużych wierszy, zamiast działać
jako surowy zrzut transkrypcji.

### Ograniczenia specyficzne dla dostawców

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla konkretnych dostawców bez
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
