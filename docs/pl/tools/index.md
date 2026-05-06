---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie albo go odmówić
    - Wybierasz między wbudowanymi narzędziami, Skills i pluginami
summary: 'Przegląd narzędzi i pluginów OpenClaw: co potrafi agent i jak go rozszerzyć'
title: Narzędzia i Pluginy
x-i18n:
    generated_at: "2026-05-06T09:33:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia pozwalają agentowi czytać pliki, uruchamiać polecenia, przeglądać sieć, wysyłać
wiadomości i wchodzić w interakcję z urządzeniami.

## Narzędzia, Skills i pluginy

OpenClaw ma trzy współpracujące ze sobą warstwy:

<Steps>
  <Step title="Narzędzia są tym, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw zawiera zestaw **wbudowanych narzędzi**, a
    pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta, kiedy i jak działać">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dają agentowi kontekst, ograniczenia i instrukcje krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane w pluginach.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane przez społeczność w npm).

    [Zainstaluj i skonfiguruj pluginy](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania żadnych pluginów:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamia izolowaną zdalną analizę Python                             | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Steruje przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu)  | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Przeszukuje sieć, przeszukuje wpisy X, pobiera zawartość stron        | [Sieć](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch)   |
| `read` / `write` / `edit`                  | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                  | Wysyła wiadomości przez wszystkie kanały                              | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `canvas`                                   | Steruje node Canvas (prezentacja, ewaluacja, migawka)                 |                                                              |
| `nodes`                                    | Wykrywa sparowane urządzenia i kieruje do nich działania              |                                                              |
| `cron` / `gateway`                         | Zarządza zaplanowanymi zadaniami; sprawdza, poprawia, restartuje lub aktualizuje Gateway |                                                              |
| `image` / `image_generate`                 | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generuje utwory muzyczne                                              | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generuje filmy                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja podagentów                 | [Podagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekki odczyt w stylu `/status` i nadpisanie modelu sesji              | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli wybierasz `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli wybierasz `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli wybierasz `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania audio sterowanego workflow używaj `music_generate`, gdy rejestruje je plugin taki jak
ComfyUI. To jest oddzielne od `tts`, które służy do zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` usuwa to
nadpisanie. Podobnie jak `/status`, może uzupełniać skąpe liczniki tokenów/pamięci podręcznej oraz
etykietę aktywnego modelu runtime na podstawie najnowszego wpisu użycia w transkrypcie.

`gateway` to narzędzie runtime przeznaczone tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego ścieżką przed edycją
- `config.get` dla bieżącej migawki konfiguracji + hash
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do zastąpienia pełnej konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

Przy zmianach częściowych preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) i
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia także zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Przykłady:

- [Diffy](/pl/tools/diffs) — przeglądarka i renderer różnic
- [Zadanie LLM](/pl/tools/llm-task) — krok LLM tylko JSON dla ustrukturyzowanego wyniku
- [Lobster](/pl/tools/lobster) — typowany runtime workflow z wznawialnymi zatwierdzeniami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja workflow z markdown jako formatem podstawowym
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

Narzędzia pluginów nadal są tworzone przy użyciu `api.registerTool(...)` i deklarowane na
liście `contracts.tools` w manifeście pluginu. OpenClaw przechwytuje zweryfikowany
deskryptor narzędzia podczas wykrywania i buforuje go według źródła pluginu oraz kontraktu, dzięki czemu
późniejsze planowanie narzędzi może pominąć ładowanie runtime pluginu. Wykonanie narzędzia nadal ładuje
właścicielski plugin i wywołuje aktywną zarejestrowaną implementację.

## Konfiguracja narzędzi

### Listy dozwolone i blokowane

Kontroluj, które narzędzia agent może wywoływać, za pomocą `tools.allow` / `tools.deny` w
konfiguracji. Blokada zawsze ma pierwszeństwo przed zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw kończy niepowodzeniem w trybie zamkniętym, gdy jawna allowlista nie prowadzi do żadnych możliwych do wywołania narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany plugin faktycznie
rejestruje `query_db`. Jeśli żadne wbudowane narzędzie, plugin ani dołączone narzędzie MCP nie pasuje do
allowlisty, uruchomienie zatrzymuje się przed wywołaniem modelu, zamiast kontynuować jako
uruchomienie wyłącznie tekstowe, które mogłoby zmyślić wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową allowlistę przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Wszystkie rdzeniowe i opcjonalne narzędzia pluginów; nieograniczona baza dla szerszego dostępu do poleceń/kontroli                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skupionych na kanałach.
Pomija szersze narzędzia poleceń/kontroli, takie jak system plików, runtime,
przeglądarka, canvas, nodes, cron i kontrola gateway. Użyj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu do poleceń/kontroli, a następnie ogranicz
dostęp za pomocą `tools.allow` / `tools.deny`, gdy jest to potrzebne.
</Note>

`coding` obejmuje lekkie narzędzia sieciowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie sterowania przeglądarką. Automatyzacja przeglądarki może sterować prawdziwymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla konkretnego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Konfigurowanie `tools.exec` lub `tools.fs` pod restrykcyjnym profilem (`messaging`, `minimal`) nie rozszerza domyślnie allowlisty profilu. Dodaj jawne wpisy `tools.alsoAllow` (na przykład `["exec", "process"]` dla exec albo `["read", "write", "edit"]` dla fs), gdy chcesz, aby restrykcyjny profil używał tych skonfigurowanych sekcji. OpenClaw zapisuje ostrzeżenie podczas startu, gdy sekcja konfiguracji istnieje bez odpowiadającego jej uprawnienia `alsoAllow`.
</Note>

Profile `coding` i `messaging` pozwalają także na skonfigurowane narzędzia bundle MCP
pod kluczem pluginu `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy chcesz,
aby profil zachował swoje normalne wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
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

Używaj skrótów `group:*` na listach dozwolonych/blokowanych:

| Grupa              | Narzędzia                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias dla `exec`)                             |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (bez narzędzi Plugin)                                              |

`sessions_history` zwraca ograniczony, przefiltrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
tagi myślenia, strukturę pomocniczą `<relevant-memories>`, zwykłotekstowe ładunki XML
wywołań narzędzi (w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowaną strukturę pomocniczą wywołań narzędzi, ujawnione tokeny sterujące modelu
ASCII/pełnej szerokości oraz niepoprawnie sformatowany XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/obcinanie i ewentualne symbole zastępcze dla zbyt dużych wierszy, zamiast działać
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
