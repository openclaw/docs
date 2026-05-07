---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie lub je zablokować.
    - Decydujesz między wbudowanymi narzędziami, Skills i Pluginami
summary: 'Omówienie narzędzi i Pluginów OpenClaw: co agent może zrobić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-05-07T13:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia umożliwiają agentowi odczytywanie plików, uruchamianie poleceń, przeglądanie sieci, wysyłanie
wiadomości oraz interakcję z urządzeniami.

## Narzędzia, Skills i Pluginy

OpenClaw ma trzy warstwy, które działają razem:

<Steps>
  <Step title="Tools are what the agent calls">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    Pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills teach the agent when and how">
    Skill to plik Markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dają agentowi kontekst, ograniczenia i szczegółowe wskazówki dotyczące
    skutecznego używania narzędzi. Skills znajdują się w obszarze roboczym, we współdzielonych folderach
    albo są dostarczane wewnątrz Pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre Pluginy są **core** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane w npm przez społeczność).

    [Zainstaluj i skonfiguruj Pluginy](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek Pluginów:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamia zdalną analizę Python w piaskownicy                         | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Kontroluje przeglądarkę Chromium (nawigacja, kliknięcia, zrzuty ekranu) | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Przeszukuje sieć, przeszukuje posty X, pobiera zawartość stron        | [Sieć](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch)   |
| `read` / `write` / `edit`                  | Operacje wejścia/wyjścia na plikach w obszarze roboczym               |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Zastosuj poprawkę](/pl/tools/apply-patch)                      |
| `message`                                  | Wysyła wiadomości przez wszystkie kanały                              | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `nodes`                                    | Wykrywa i wybiera sparowane urządzenia                                |                                                              |
| `cron` / `gateway`                         | Zarządza zaplanowanymi zadaniami; sprawdza, poprawia, restartuje lub aktualizuje Gateway |                                                              |
| `image` / `image_generate`                 | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generuje utwory muzyczne                                              | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generuje filmy                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja podagentów                 | [Podagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekki odczyt w stylu `/status` i nadpisanie modelu sesji              | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli wskazujesz `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli wskazujesz `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli wskazujesz `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania audio sterowanego przepływem pracy używaj `music_generate`, gdy rejestruje je Plugin, taki jak
ComfyUI. Jest to oddzielne od `tts`, które służy do zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/pamięci podręcznej oraz
etykietę aktywnego modelu środowiska uruchomieniowego z najnowszego wpisu użycia transkryptu.

`gateway` to narzędzie środowiska uruchomieniowego dostępne tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego ścieżką przed edycją
- `config.get` dla bieżącego zrzutu konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko dla zastąpienia pełnej konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

Przy częściowych zmianach preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) i
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez Pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Przykłady:

- [Canvas](/pl/plugins/reference/canvas) — eksperymentalny dołączony Plugin do kontroli node Canvas i renderowania A2UI
- [Diffs](/pl/tools/diffs) — przeglądarka i renderer różnic
- [Zadanie LLM](/pl/tools/llm-task) — krok LLM tylko JSON dla ustrukturyzowanego wyjścia
- [Lobster](/pl/tools/lobster) — typowane środowisko uruchomieniowe przepływów pracy ze wznawialnymi zatwierdzeniami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na przepływie pracy
- [OpenProse](/pl/prose) — orkiestracja przepływów pracy z Markdown jako podstawą
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

Narzędzia Pluginów nadal są tworzone za pomocą `api.registerTool(...)` i deklarowane na
liście `contracts.tools` w manifeście Pluginu. OpenClaw przechwytuje zweryfikowany
deskryptor narzędzia podczas wykrywania i zapisuje go w pamięci podręcznej według źródła Pluginu i kontraktu, dzięki czemu
późniejsze planowanie narzędzi może pominąć ładowanie środowiska uruchomieniowego Pluginu. Wykonanie narzędzia nadal ładuje
Plugin właściciela i wywołuje zarejestrowaną na żywo implementację.

## Konfiguracja narzędzi

### Listy dozwolonych i blokowanych

Kontroluj, które narzędzia agent może wywoływać, przez `tools.allow` / `tools.deny` w
konfiguracji. Blokada zawsze ma pierwszeństwo przed zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw domyślnie odmawia działania, gdy jawna lista dozwolonych nie rozwiązuje się do żadnych wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany Plugin faktycznie
rejestruje `query_db`. Jeśli żadne wbudowane narzędzie, Plugin ani dołączone narzędzie MCP nie pasuje do
listy dozwolonych, uruchomienie zatrzymuje się przed wywołaniem modelu zamiast kontynuować jako
uruchomienie tekstowe, które mogłoby zmyślić wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Wszystkie narzędzia core i opcjonalnych Pluginów; nieograniczona baza dla szerszego dostępu do poleceń/kontroli                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skoncentrowanych na kanałach.
Pomija szersze narzędzia poleceń/kontroli, takie jak system plików, środowisko uruchomieniowe,
przeglądarka, canvas, nodes, Cron i kontrola Gateway. Używaj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu do poleceń/kontroli, a następnie ograniczaj
dostęp przez `tools.allow` / `tools.deny` w razie potrzeby.
</Note>

`coding` obejmuje lekkie narzędzia sieciowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie kontroli przeglądarki. Automatyzacja przeglądarki może sterować prawdziwymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla danego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Skonfigurowanie `tools.exec` lub `tools.fs` pod restrykcyjnym profilem (`messaging`, `minimal`) nie poszerza automatycznie listy dozwolonych profilu. Dodaj jawne wpisy `tools.alsoAllow` (na przykład `["exec", "process"]` dla exec albo `["read", "write", "edit"]` dla fs), gdy chcesz, aby restrykcyjny profil używał tych skonfigurowanych sekcji. OpenClaw zapisuje ostrzeżenie startowe, gdy sekcja konfiguracji jest obecna bez pasującego przyznania `alsoAllow`.
</Note>

Profile `coding` i `messaging` dopuszczają też skonfigurowane dołączone narzędzia MCP
pod kluczem Pluginu `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje normalne wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
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

Używaj skrótów `group:*` na listach allow/deny:

| Grupa              | Narzędzia                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias dla `exec`)                              |
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
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem narzędzi Plugin)                                   |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
znaczniki myślenia, szkielet `<relevant-memories>`, tekstowe ładunki XML wywołań narzędzi
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi),
obniżony szkielet wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/pełnej szerokości
oraz wadliwy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/ucinanie i możliwe symbole zastępcze dla zbyt dużych wierszy, zamiast działać
jako surowy zrzut transkryptu.

### Ograniczenia specyficzne dla dostawcy

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla określonych dostawców bez
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
