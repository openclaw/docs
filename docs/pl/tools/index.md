---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować, zezwolić na narzędzia lub ich zabronić
    - Decydujesz między wbudowanymi narzędziami, Skills i Pluginami
summary: 'Przegląd narzędzi i Pluginów OpenClaw: co agent może robić i jak go rozszerzać'
title: Narzędzia i Pluginy
x-i18n:
    generated_at: "2026-04-24T09:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Wszystko, co agent robi poza generowaniem tekstu, dzieje się przez **narzędzia**.
Narzędzia to sposób, w jaki agent odczytuje pliki, uruchamia polecenia, przegląda sieć, wysyła
wiadomości i wchodzi w interakcję z urządzeniami.

## Narzędzia, Skills i Pluginy

OpenClaw ma trzy warstwy, które współpracują ze sobą:

<Steps>
  <Step title="Narzędzia to to, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    Pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta kiedy i jak">
    Skills to plik markdown (`SKILL.md`) wstrzykiwany do system promptu.
    Skills dają agentowi kontekst, ograniczenia i instrukcje krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane wewnątrz Pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję realtime,
    głos realtime, rozumienie multimediów, generowanie obrazów, generowanie wideo,
    web fetch, web search i inne. Niektóre Pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Instalacja i konfiguracja Pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek Pluginów:

| Narzędzie                                 | Co robi                                                               | Strona                                                       |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Akceptacje Exec](/pl/tools/exec-approvals) |
| `code_execution`                          | Uruchamia sandboxowaną zdalną analizę w Pythonie                      | [Code Execution](/pl/tools/code-execution)                      |
| `browser`                                 | Steruje przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu)  | [Przeglądarka](/pl/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`   | Przeszukuje sieć, przeszukuje posty X, pobiera zawartość stron        | [Sieć](/pl/tools/web), [Web Fetch](/pl/tools/web-fetch)            |
| `read` / `write` / `edit`                 | Operacje wejścia/wyjścia na plikach w obszarze roboczym               |                                                              |
| `apply_patch`                             | Wielohunkowe patche plików                                            | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                 | Wysyła wiadomości przez wszystkie kanały                              | [Wysyłanie przez agenta](/pl/tools/agent-send)                  |
| `canvas`                                  | Steruje Node Canvas (present, eval, snapshot)                         |                                                              |
| `nodes`                                   | Wykrywa i wskazuje sparowane urządzenia                               |                                                              |
| `cron` / `gateway`                        | Zarządza zadaniami harmonogramu; sprawdza, łata, restartuje lub aktualizuje Gateway |                                                              |
| `image` / `image_generate`                | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                          | Generuje utwory muzyczne                                              | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                          | Generuje filmy                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                     | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, stan i orkiestracja subagentów                  | [Sub-agenci](/pl/tools/subagents)                               |
| `session_status`                          | Lekki odczyt w stylu `/status` i nadpisanie modelu dla sesji          | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy, a `image_generate` do generowania lub edycji. Jeśli celujesz w `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli celujesz w `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli celujesz w `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj uwierzytelnianie/klucz API tego dostawcy.

Do generowania dźwięku sterowanego przepływem pracy używaj `music_generate`, gdy rejestruje je Plugin taki jak
ComfyUI. Jest to oddzielne od `tts`, które służy do zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla pojedynczej sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/cache oraz
etykietę aktywnego modelu runtime z najnowszego wpisu użycia w transkrypcji.

`gateway` to narzędzie runtime tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego do ścieżki przed edycjami
- `config.get` dla bieżącej migawki konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do pełnego zastąpienia konfiguracji
- `update.run` do jawnej samodzielnej aktualizacji + restartu

Dla częściowych zmian preferuj `config.schema.lookup`, a następnie `config.patch`. Używaj
`config.apply` tylko wtedy, gdy świadomie zastępujesz całą konfigurację.
Narzędzie odmawia również zmiany `tools.exec.ask` lub `tools.exec.security`;
przestarzałe aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez Pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Diffs](/pl/tools/diffs) — podgląd i renderer diff
- [LLM Task](/pl/tools/llm-task) — krok LLM tylko-JSON do ustrukturyzowanego wyniku
- [Lobster](/pl/tools/lobster) — typowane środowisko uruchomieniowe przepływu pracy z wznawialnymi akceptacjami
- [Generowanie muzyki](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja przepływu pracy markdown-first
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktowe wyniki narzędzi `exec` i `bash` z dużym szumem

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

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed zastosowaniem `allow`/`deny`.
Nadpisanie dla agenta: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Bez ograniczeń (to samo co brak ustawienia)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | Tylko `session_status`                                                                                                                           |

Profile `coding` i `messaging` pozwalają również na skonfigurowane narzędzia bundle MCP
pod kluczem Plugin `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje normalne wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie obejmuje narzędzi bundle MCP.

### Grupy narzędzi

Używaj skrótów `group:*` w listach dozwolonych/zabronionych:

| Grupa              | Narzędzia                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowany jako alias `exec`)                             |
| `group:fs`         | read, write, edit, apply_patch                                                                        |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                             |
| `group:web`        | web_search, x_search, web_fetch                                                                       |
| `group:ui`         | browser, canvas                                                                                       |
| `group:automation` | cron, gateway                                                                                         |
| `group:messaging`  | message                                                                                               |
| `group:nodes`      | nodes                                                                                                 |
| `group:agents`     | agents_list                                                                                           |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                            |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (bez narzędzi Plugin)                                          |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok odczytu historii. Usuwa
tagi myślenia, szkielety `<relevant-memories>`, payloady XML wywołań narzędzi w zwykłym tekście
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowane szkielety wywołań narzędzi, wyciekłe tokeny sterujące modelem ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/obcinanie i możliwe placeholdery zbyt dużych wierszy zamiast działać
jak surowy zrzut transkrypcji.

### Ograniczenia specyficzne dla dostawcy

Używaj `tools.byProvider`, aby ograniczać narzędzia dla konkretnych dostawców bez
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
