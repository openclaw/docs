---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować narzędzia, zezwolić na ich użycie lub go odmówić
    - Decydujesz między wbudowanymi narzędziami, Skills i plugins
summary: 'Omówienie narzędzi i pluginów OpenClaw: co agent może robić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-04-30T10:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia umożliwiają agentowi odczytywanie plików, uruchamianie poleceń, przeglądanie sieci, wysyłanie
wiadomości oraz interakcję z urządzeniami.

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
    Skills dostarczają agentowi kontekstu, ograniczeń i wskazówek krok po kroku dotyczących
    skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane wewnątrz pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie stron z sieci, wyszukiwanie w sieci i nie tylko. Niektóre pluginy są **core** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i dostępne bez instalowania jakichkolwiek pluginów:

| Narzędzie                                  | Co robi                                                               | Strona                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Zatwierdzenia Exec](/pl/tools/exec-approvals) |
| `code_execution`                           | Uruchamia zdalną analizę Python w piaskownicy                         | [Wykonywanie kodu](/pl/tools/code-execution)                    |
| `browser`                                  | Steruje przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu)  | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | Przeszukuje sieć, przeszukuje wpisy X, pobiera treść stron            | [Sieć](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch)   |
| `read` / `write` / `edit`                  | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                              | Wieloczęściowe poprawki plików                                        | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                  | Wysyła wiadomości we wszystkich kanałach                              | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `canvas`                                   | Obsługuje node Canvas (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | Wykrywa sparowane urządzenia i kieruje do nich działania              |                                                              |
| `cron` / `gateway`                         | Zarządza zaplanowanymi zadaniami; sprawdza, poprawia, restartuje lub aktualizuje gateway |                                                              |
| `image` / `image_generate`                 | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                           | Generuje ścieżki muzyczne                                             | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                           | Generuje filmy                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja podagentów                 | [Podagenci](/pl/tools/subagents)                                |
| `session_status`                           | Lekki odczyt zwrotny w stylu `/status` i nadpisanie modelu sesji      | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli kierujesz żądanie do `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcy obrazów, najpierw skonfiguruj uwierzytelnienie/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli kierujesz żądanie do `google/*`, `minimax/*` albo innego niedomyślnego dostawcy muzyki, najpierw skonfiguruj uwierzytelnienie/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli kierujesz żądanie do `qwen/*` albo innego niedomyślnego dostawcy wideo, najpierw skonfiguruj uwierzytelnienie/klucz API tego dostawcy.

Do generowania audio sterowanego przepływem pracy używaj `music_generate`, gdy rejestruje je plugin taki jak
ComfyUI. Jest to oddzielne od `tts`, które służy do zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu zwrotnego w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/pamięci podręcznej oraz
etykietę aktywnego modelu wykonawczego z najnowszego wpisu użycia w transkrypcie.

`gateway` to narzędzie runtime tylko dla właściciela do operacji na gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego ścieżką przed edycjami
- `config.get` dla bieżącego zrzutu konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko dla zastąpienia pełnej konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

Przy zmianach częściowych preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Szerszą dokumentację konfiguracji znajdziesz w [Konfiguracja](/pl/gateway/configuration) i
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Przykłady:

- [Diffy](/pl/tools/diffs) — przeglądarka i renderer diffów
- [Zadanie LLM](/pl/tools/llm-task) — krok LLM tylko w JSON do ustrukturyzowanego wyjścia
- [Lobster](/pl/tools/lobster) — typowany runtime przepływu pracy z wznawialnymi zatwierdzeniami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na przepływach pracy
- [OpenProse](/pl/prose) — orkiestracja przepływów pracy z markdown jako formatem podstawowym
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

## Konfiguracja narzędzi

### Listy dozwolonych i zabronionych

Kontroluj, które narzędzia agent może wywoływać, przez `tools.allow` / `tools.deny` w
konfiguracji. Zabronienie zawsze ma pierwszeństwo przed zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw kończy działanie bez dostępu, gdy jawna lista dozwolonych nie daje żadnych wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany plugin faktycznie
rejestruje `query_db`. Jeśli żadne wbudowane narzędzie, plugin ani dołączone narzędzie MCP nie pasuje do
listy dozwolonych, uruchomienie zatrzymuje się przed wywołaniem modelu zamiast kontynuować jako
uruchomienie tylko tekstowe, które mogłoby halucynować wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nieograniczona baza dla szerszego dostępu do poleceń/kontroli; taka sama jak pozostawienie `tools.profile` bez ustawienia                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` jest celowo wąski dla agentów skupionych na kanałach.
Pomija szersze narzędzia poleceń/kontroli, takie jak system plików, runtime,
przeglądarka, canvas, węzły, cron i kontrola gateway. Użyj `tools.profile: "full"`
jako nieograniczonej bazy dla szerszego dostępu do poleceń/kontroli, a następnie przytnij
dostęp przez `tools.allow` / `tools.deny`, gdy będzie to potrzebne.
</Note>

`coding` obejmuje lekkie narzędzia sieciowe (`web_search`, `web_fetch`, `x_search`),
ale nie pełne narzędzie do sterowania przeglądarką. Automatyzacja przeglądarki może sterować prawdziwymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo dla konkretnego agenta przez
`agents.list[].tools.alsoAllow: ["browser"]`.

Profile `coding` i `messaging` pozwalają też na skonfigurowane narzędzia bundle MCP
pod kluczem pluginu `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje normalne narzędzia wbudowane, ale ukrył wszystkie skonfigurowane narzędzia MCP.
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
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowany jako alias dla `exec`)                             |
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
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem narzędzi pluginów)                                  |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołanych danych. Usuwa
znaczniki myślenia, strukturę pomocniczą `<relevant-memories>`, ładunki XML
wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowaną strukturę pomocniczą wywołań narzędzi, ujawnione tokeny sterujące
modelu ASCII/pełnej szerokości oraz nieprawidłowy XML wywołań narzędzi MiniMax
z tekstu asystenta, a następnie stosuje redakcję/obcinanie i możliwe symbole
zastępcze dla zbyt dużych wierszy zamiast działać jako surowy zrzut transkryptu.

### Ograniczenia specyficzne dla dostawcy

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla konkretnych dostawców bez
zmiany globalnych ustawień domyślnych:

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
