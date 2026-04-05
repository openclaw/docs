---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować, zezwolić na narzędzia lub ich zabronić
    - Decydujesz między wbudowanymi narzędziami, Skills i pluginami
summary: 'Przegląd narzędzi i pluginów OpenClaw: co agent potrafi robić i jak go rozszerzać'
title: Narzędzia i pluginy
x-i18n:
    generated_at: "2026-04-05T14:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Narzędzia i pluginy

Wszystko, co agent robi poza generowaniem tekstu, odbywa się przez **narzędzia**.
Narzędzia umożliwiają agentowi odczytywanie plików, uruchamianie poleceń, przeglądanie Web, wysyłanie
wiadomości i interakcję z urządzeniami.

## Narzędzia, Skills i pluginy

OpenClaw ma trzy warstwy, które współpracują ze sobą:

<Steps>
  <Step title="Narzędzia to to, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta kiedy i jak">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do system prompt.
    Skills dają agentowi kontekst, ograniczenia i instrukcje krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim workspace, we współdzielonych katalogach
    albo są dostarczane wewnątrz pluginów.

    [Dokumentacja Skills](/tools/skills) | [Tworzenie Skills](/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję realtime,
    głos realtime, rozumienie mediów, generowanie obrazów, generowanie wideo,
    web fetch, web search i inne. Niektóre pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane przez społeczność na npm).

    [Instalowanie i konfigurowanie pluginów](/tools/plugin) | [Zbuduj własny](/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania pluginów:

| Narzędzie                                  | Co robi                                                              | Strona                                  |
| ------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Uruchamianie poleceń powłoki, zarządzanie procesami w tle            | [Exec](/tools/exec)                     |
| `code_execution`                           | Uruchamianie sandboxowanej zdalnej analizy w Pythonie                | [Code Execution](/tools/code-execution) |
| `browser`                                  | Sterowanie przeglądarką opartą na Chromium (nawigacja, kliknięcia, zrzuty ekranu) | [Browser](/tools/browser)      |
| `web_search` / `x_search` / `web_fetch`    | Wyszukiwanie w Web, wyszukiwanie postów X, pobieranie treści stron   | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | Operacje I/O na plikach w workspace                                  |                                         |
| `apply_patch`                              | Wielosegmentowe łatki plików                                         | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Wysyłanie wiadomości przez wszystkie kanały                          | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Sterowanie Canvas węzła (present, eval, snapshot)                    |                                         |
| `nodes`                                    | Wykrywanie i kierowanie do sparowanych urządzeń                      |                                         |
| `cron` / `gateway`                         | Zarządzanie zadaniami harmonogramu; inspekcja, poprawki, restart lub aktualizacja gateway |                                         |
| `image` / `image_generate`                 | Analiza lub generowanie obrazów                                      |                                         |
| `tts`                                      | Jednorazowa konwersja tekstu na mowę                                 | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja podagentów                | [Sub-agents](/tools/subagents)          |
| `session_status`                           | Lekkie odczyty w stylu `/status` i nadpisanie modelu dla sesji       | [Session Tools](/concepts/session-tool) |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli kierujesz żądania do `openai/*`, `google/*`, `fal/*` lub innego niedomyślnego dostawcy obrazów, najpierw skonfiguruj uwierzytelnianie / klucz API tego dostawcy.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sessions.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla sesji; `model=default` usuwa to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/cache oraz
aktywną etykietę modelu środowiska uruchomieniowego na podstawie najnowszego wpisu usage w transkrypcie.

`gateway` to narzędzie runtime tylko dla właściciela do operacji na gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego do ścieżki przed edycją
- `config.get` dla bieżącej migawki konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do pełnej wymiany konfiguracji
- `update.run` dla jawnej samoaktualizacji + restartu

W przypadku częściowych zmian preferuj `config.schema.lookup`, a następnie `config.patch`. Używaj
`config.apply` tylko wtedy, gdy świadomie zastępujesz całą konfigurację.
Narzędzie odmawia również zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Lobster](/tools/lobster) — typowane środowisko uruchomieniowe workflow z zatwierdzeniami wznawialnymi
- [LLM Task](/tools/llm-task) — krok LLM tylko w JSON dla ustrukturyzowanego wyjścia
- [Diffs](/tools/diffs) — przeglądarka i renderer diffów
- [OpenProse](/prose) — orkiestracja workflow w podejściu markdown-first

## Konfiguracja narzędzi

### Listy dozwolonych i zabronionych

Kontroluj, które narzędzia agent może wywoływać, przez `tools.allow` / `tools.deny` w
konfiguracji. Zakaz zawsze ma pierwszeństwo przed zezwoleniem.

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

| Profil      | Co zawiera                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `full`      | Brak ograniczeń (to samo co brak ustawienia)                                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                    |
| `minimal`   | Tylko `session_status`                                                                                       |

### Grupy narzędzi

Używaj skrótów `group:*` w listach dozwolonych/zabronionych:

| Grupa              | Narzędzia                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias dla `exec`)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                               |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status   |
| `group:memory`     | memory_search, memory_get                                                                                    |
| `group:web`        | web_search, x_search, web_fetch                                                                              |
| `group:ui`         | browser, canvas                                                                                              |
| `group:automation` | cron, gateway                                                                                                |
| `group:messaging`  | message                                                                                                      |
| `group:nodes`      | nodes                                                                                                        |
| `group:agents`     | agents_list                                                                                                  |
| `group:media`      | image, image_generate, tts                                                                                   |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (bez narzędzi pluginów)                                               |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok odczytu historii. Usuwa
tagi myślenia, rusztowanie `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterujące modelem ASCII/pełnoszerokie,
a także błędny XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/obcinanie i ewentualne placeholdery zbyt dużych wierszy zamiast działać
jak surowy zrzut transkryptu.

### Ograniczenia specyficzne dla dostawcy

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla określonych dostawców bez
zmiany ustawień globalnych:

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
