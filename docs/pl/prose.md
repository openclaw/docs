---
read_when:
    - Chcesz uruchamiać lub pisać przepływy `.prose`
    - Chcesz włączyć plugin OpenProse
    - Musisz zrozumieć przechowywanie stanu
summary: 'OpenProse: przepływy `.prose`, polecenia slash i stan w OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T14:02:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse to przenośny, oparty na Markdown format przepływów pracy do orkiestracji sesji AI. W OpenClaw jest dostarczany jako plugin, który instaluje pakiet Skills OpenProse oraz polecenie slash `/prose`. Programy znajdują się w plikach `.prose` i mogą uruchamiać wiele subagentów z jawną kontrolą przepływu.

Oficjalna strona: [https://www.prose.md](https://www.prose.md)

## Co potrafi

- Badania i synteza z użyciem wielu agentów z jawną równoległością.
- Powtarzalne przepływy bezpieczne pod względem zatwierdzeń (code review, triage incydentów, pipeline treści).
- Wielokrotnego użytku programy `.prose`, które można uruchamiać w obsługiwanych runtime agentów.

## Instalacja i włączenie

Dołączone pluginy są domyślnie wyłączone. Włącz OpenProse:

```bash
openclaw plugins enable open-prose
```

Po włączeniu pluginu uruchom Gateway ponownie.

Checkout dev/lokalny: `openclaw plugins install ./path/to/local/open-prose-plugin`

Powiązana dokumentacja: [Pluginy](/tools/plugin), [Manifest pluginu](/plugins/manifest), [Skills](/tools/skills).

## Polecenie slash

OpenProse rejestruje `/prose` jako polecenie Skills wywoływane przez użytkownika. Kieruje ono do instrukcji VM OpenProse i pod spodem używa narzędzi OpenClaw.

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

OpenProse przechowuje stan w `.prose/` w twoim workspace:

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

Trwałe agenty na poziomie użytkownika znajdują się w:

```
~/.prose/agents/
```

## Tryby stanu

OpenProse obsługuje wiele backendów stanu:

- **filesystem** (domyślnie): `.prose/runs/...`
- **in-context**: tymczasowy, dla małych programów
- **sqlite** (eksperymentalny): wymaga binarki `sqlite3`
- **postgres** (eksperymentalny): wymaga `psql` i connection string

Uwagi:

- sqlite/postgres są opcjonalne i eksperymentalne.
- Poświadczenia postgres trafiają do logów subagentów; używaj dedykowanej bazy danych z minimalnymi uprawnieniami.

## Programy zdalne

`/prose run <handle/slug>` rozwiązuje się do `https://p.prose.md/<handle>/<slug>`.
Bezpośrednie URL-e są pobierane bez zmian. Używa to narzędzia `web_fetch` (lub `exec` dla POST).

## Mapowanie runtime OpenClaw

Programy OpenProse mapują się na prymitywy OpenClaw:

| OpenProse concept         | OpenClaw tool    |
| ------------------------- | ---------------- |
| Uruchomienie sesji / narzędzie Task | `sessions_spawn` |
| Odczyt/zapis pliku        | `read` / `write` |
| Pobieranie z sieci        | `web_fetch`      |

Jeśli allowlista narzędzi blokuje te narzędzia, programy OpenProse zakończą się błędem. Zobacz [Konfiguracja Skills](/tools/skills-config).

## Bezpieczeństwo i zatwierdzenia

Traktuj pliki `.prose` jak kod. Przeglądaj je przed uruchomieniem. Używaj allowlist narzędzi OpenClaw i bramek zatwierdzeń do kontrolowania skutków ubocznych.

W przypadku deterministycznych przepływów kontrolowanych zatwierdzeniami porównaj z [Lobster](/tools/lobster).
