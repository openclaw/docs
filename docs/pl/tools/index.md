---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw.
    - Musisz skonfigurować, zezwolić na lub zablokować narzędzia.
    - Decydujesz między narzędziami wbudowanymi, Skills i pluginami.
summary: 'Przegląd narzędzi i pluginów OpenClaw: co agent potrafi robić i jak go rozszerzać'
title: Narzędzia i Pluginy
x-i18n:
    generated_at: "2026-04-22T09:52:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# Narzędzia i Pluginy

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia określają, w jaki sposób agent czyta pliki, uruchamia polecenia, przegląda internet, wysyła
wiadomości i wchodzi w interakcje z urządzeniami.

## Narzędzia, Skills i pluginy

OpenClaw ma trzy warstwy, które współpracują ze sobą:

<Steps>
  <Step title="Narzędzia są tym, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **narzędzi wbudowanych**, a
    pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako uporządkowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta kiedy i jak">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dostarczają agentowi kontekst, ograniczenia i wskazówki krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim workspace, we współdzielonych folderach
    lub są dostarczane wewnątrz pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo,
    pobieranie z sieci, wyszukiwanie w sieci i inne. Niektóre pluginy są **core** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane na npm przez społeczność).

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Narzędzia wbudowane

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek pluginów:

| Narzędzie                                 | Co robi                                                               | Strona                                      |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                        | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec)                         |
| `code_execution`                          | Uruchamia sandboxowaną zdalną analizę w Pythonie                      | [Code Execution](/pl/tools/code-execution)     |
| `browser`                                 | Steruje przeglądarką Chromium (nawigacja, klikanie, zrzuty ekranu)    | [Browser](/pl/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`   | Przeszukuje internet, przeszukuje posty X, pobiera zawartość stron    | [Web](/pl/tools/web)                           |
| `read` / `write` / `edit`                 | Operacje wejścia/wyjścia na plikach w workspace                       |                                             |
| `apply_patch`                             | Łaty plików z wieloma fragmentami                                     | [Apply Patch](/pl/tools/apply-patch)           |
| `message`                                 | Wysyła wiadomości przez wszystkie kanały                              | [Agent Send](/pl/tools/agent-send)             |
| `canvas`                                  | Steruje node Canvas (present, eval, snapshot)                         |                                             |
| `nodes`                                   | Wykrywa sparowane urządzenia i kieruje do nich działania              |                                             |
| `cron` / `gateway`                        | Zarządza zaplanowanymi zadaniami; sprawdza, łata, restartuje lub aktualizuje Gateway |                                             |
| `image` / `image_generate`                | Analizuje lub generuje obrazy                                         | [Image Generation](/pl/tools/image-generation) |
| `music_generate`                          | Generuje utwory muzyczne                                              | [Music Generation](/pl/tools/music-generation) |
| `video_generate`                          | Generuje wideo                                                        | [Video Generation](/pl/tools/video-generation) |
| `tts`                                     | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list`| Zarządzanie sesjami, status i orkiestracja sub-agentów                | [Sub-agents](/pl/tools/subagents)              |
| `session_status`                          | Lekkie odczyty w stylu `/status` i nadpisanie modelu dla sesji        | [Session Tools](/pl/concepts/session-tool)     |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli kierujesz żądania do `openai/*`, `google/*`, `fal/*` lub innego niedomyślnego dostawcy obrazów, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli kierujesz żądania do `google/*`, `minimax/*` lub innego niedomyślnego dostawcy muzyki, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli kierujesz żądania do `qwen/*` lub innego niedomyślnego dostawcy wideo, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do generowania audio sterowanego workflow używaj `music_generate`, gdy plugin taki jak
ComfyUI go rejestruje. Jest to osobne od `tts`, które odpowiada za syntezę mowy z tekstu.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla danej sesji; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać brakujące liczniki tokenów/cache oraz
etykietę aktywnego modelu runtime na podstawie najnowszego wpisu użycia w transkrypcie.

`gateway` to narzędzie runtime tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego do ścieżki przed edycją
- `config.get` dla bieżącej migawki konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do pełnej zamiany konfiguracji
- `update.run` do jawnej samoaktualizacji + restartu

W przypadku częściowych zmian preferuj `config.schema.lookup`, a następnie `config.patch`. Używaj
`config.apply` tylko wtedy, gdy świadomie zastępujesz całą konfigurację.
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Diffs](/pl/tools/diffs) — przeglądarka i renderer diffów
- [LLM Task](/pl/tools/llm-task) — krok LLM zwracający wyłącznie JSON do uporządkowanego wyjścia
- [Lobster](/pl/tools/lobster) — typowany runtime workflow z możliwymi do wznowienia zatwierdzeniami
- [Music Generation](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja workflow oparta przede wszystkim na markdown
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

## Konfiguracja narzędzi

### Listy dozwolonych i blokowanych

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

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych narzędzi przed zastosowaniem `allow`/`deny`.
Nadpisanie per agent: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Bez ograniczeń (tak samo jak brak ustawienia)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Tylko `session_status`                                                                                                                             |

### Grupy narzędzi

Używaj skrótów `group:*` w listach allow/deny:

| Grupa              | Narzędzia                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowany jako alias `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem narzędzi pluginów)                                  |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przypomnienia. Usuwa
tagi rozumowania, rusztowanie `<relevant-memories>`, ładunki XML wywołań narzędzi w zwykłym tekście
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi),
zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterujące modelu ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/obcięcie i ewentualne placeholdery dla zbyt dużych wierszy zamiast działać
jak surowy zrzut transkryptu.

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
