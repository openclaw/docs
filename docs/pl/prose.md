---
read_when:
    - Chcesz uruchamiać lub pisać przepływy `.prose`
    - Chcesz włączyć Plugin OpenProse
    - Musisz zrozumieć przechowywanie stanu
summary: 'OpenProse: przepływy `.prose`, polecenia slash i stan w OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T09:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse to przenośny, oparty na Markdown format przepływów pracy do orkiestracji sesji AI. W OpenClaw jest dostarczany jako Plugin, który instaluje pakiet Skills OpenProse oraz polecenie slash `/prose`. Programy żyją w plikach `.prose` i mogą uruchamiać wiele podagentów z jawnym sterowaniem przepływem.

Oficjalna strona: [https://www.prose.md](https://www.prose.md)

## Co potrafi

- Badania i synteza z wieloma agentami z jawną równoległością.
- Powtarzalne przepływy pracy bezpieczne pod względem zatwierdzeń (przegląd kodu, triage incydentów, potoki treści).
- Wielokrotnego użytku programy `.prose`, które można uruchamiać w obsługiwanych środowiskach agentów.

## Instalacja i włączenie

Dołączone Plugins są domyślnie wyłączone. Aby włączyć OpenProse:

```bash
openclaw plugins enable open-prose
```

Po włączeniu Plugin uruchom ponownie Gateway.

Lokalny checkout deweloperski: `openclaw plugins install ./path/to/local/open-prose-plugin`

Powiązana dokumentacja: [Plugins](/pl/tools/plugin), [Manifest Plugin](/pl/plugins/manifest), [Skills](/pl/tools/skills).

## Polecenie slash

OpenProse rejestruje `/prose` jako polecenie Skills wywoływane przez użytkownika. Kieruje ono do instrukcji maszyny wirtualnej OpenProse i pod spodem używa narzędzi OpenClaw.

Typowe polecenia:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Przykład: prosty plik `.prose`

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Lokalizacje plików

OpenProse przechowuje stan pod `.prose/` w Twoim obszarze roboczym:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Trwali agenci na poziomie użytkownika znajdują się pod:

```
~/.prose/agents/
```

## Tryby stanu

OpenProse obsługuje wiele backendów stanu:

- **filesystem** (domyślnie): `.prose/runs/...`
- **in-context**: tymczasowy, dla małych programów
- **sqlite** (eksperymentalny): wymaga binarnego `sqlite3`
- **postgres** (eksperymentalny): wymaga `psql` i connection string

Uwagi:

- sqlite/postgres są opcjonalne i eksperymentalne.
- Poświadczenia postgres przepływają do logów podagentów; używaj dedykowanej bazy danych o minimalnych uprawnieniach.

## Programy zdalne

`/prose run <handle/slug>` rozwiązuje do `https://p.prose.md/<handle>/<slug>`.
Bezpośrednie URL-e są pobierane bez zmian. Używa to narzędzia `web_fetch` (lub `exec` dla POST).

## Mapowanie runtime OpenClaw

Programy OpenProse mapują się na prymitywy OpenClaw:

| Pojęcie OpenProse         | Narzędzie OpenClaw |
| ------------------------- | ------------------ |
| Uruchomienie sesji / narzędzie Task | `sessions_spawn`   |
| Odczyt/zapis plików       | `read` / `write`   |
| Pobieranie web            | `web_fetch`        |

Jeśli Twoja allowlista narzędzi blokuje te narzędzia, programy OpenProse będą kończyć się błędem. Zobacz [Konfiguracja Skills](/pl/tools/skills-config).

## Bezpieczeństwo i zatwierdzenia

Traktuj pliki `.prose` jak kod. Przejrzyj je przed uruchomieniem. Używaj allowlist narzędzi OpenClaw i bramek zatwierdzeń, aby kontrolować skutki uboczne.

Dla deterministycznych przepływów pracy z bramkowaniem zatwierdzeń porównaj z [Lobster](/pl/tools/lobster).

## Powiązane

- [Text-to-speech](/pl/tools/tts)
- [Formatowanie Markdown](/pl/concepts/markdown-formatting)
