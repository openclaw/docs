---
read_when:
    - Chcesz uruchamiać lub pisać pliki workflow .prose
    - Chcesz włączyć plugin OpenProse
    - Musisz zrozumieć, jak OpenProse mapuje się na prymitywy OpenClaw
sidebarTitle: OpenProse
summary: OpenProse to format przepływu pracy oparty przede wszystkim na Markdown dla wieloagentowych sesji AI. W OpenClaw jest dostarczany jako plugin z poleceniem ukośnikowym /prose i pakietem Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:09:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse to przenośny, zorientowany na Markdown format przepływu pracy do orkiestracji sesji AI. W OpenClaw jest dostarczany jako Plugin, który instaluje pakiet Skills OpenProse oraz polecenie ukośnikowe `/prose`. Programy znajdują się w plikach `.prose` i mogą uruchamiać wielu podagentów z jawnym przepływem sterowania.

<CardGroup cols={3}>
  <Card title="Zainstaluj" icon="download" href="#install">
    Włącz Plugin OpenProse i uruchom ponownie Gateway.
  </Card>
  <Card title="Uruchom program" icon="play" href="#slash-command">
    Użyj `/prose run`, aby wykonać plik `.prose` lub program zdalny.
  </Card>
  <Card title="Pisz programy" icon="pencil" href="#example">
    Twórz wieloagentowe przepływy pracy z krokami równoległymi i sekwencyjnymi.
  </Card>
</CardGroup>

## Instalacja

<Steps>
  <Step title="Włącz Plugin">
    Dołączone Pluginy są domyślnie wyłączone. Włącz OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Zweryfikuj">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` powinien być widoczny jako włączony. Polecenie Skills `/prose`
    jest teraz dostępne na czacie.

  </Step>
</Steps>

Dla lokalnego checkoutu: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Polecenie ukośnikowe

OpenProse rejestruje `/prose` jako polecenie Skills wywoływane przez użytkownika:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` jest rozwiązywane do `https://p.prose.md/<handle>/<slug>`.
Bezpośrednie adresy URL są pobierane bez zmian za pomocą narzędzia `web_fetch`.

Zdalne uruchomienia najwyższego poziomu są jawne. Zdalne importy wewnątrz programu `.prose`
są przechodnimi zależnościami kodu: zanim OpenProse pobierze dowolny zdalny cel `use`,
pokazuje rozwiązaną listę importów i wymaga, aby operator odpowiedział dokładnie
`approve remote prose imports` dla tego uruchomienia.

## Co potrafi

- Wieloagentowe badanie i synteza z jawną równoległością.
- Powtarzalne przepływy pracy bezpieczne pod względem zatwierdzania (przegląd kodu, triage incydentów, potoki treści).
- Wielokrotnego użytku programy `.prose`, które można uruchamiać w obsługiwanych środowiskach uruchomieniowych agentów.

## Przykład: równoległe badanie i synteza

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

## Mapowanie środowiska uruchomieniowego OpenClaw

Programy OpenProse mapują się na prymitywy OpenClaw:

| Koncepcja OpenProse       | Narzędzie OpenClaw |
| ------------------------- | ------------------ |
| Spawn session / Task tool | `sessions_spawn`   |
| File read / write         | `read` / `write`   |
| Web fetch                 | `web_fetch`        |

<Warning>
  Jeśli allowlista narzędzi blokuje `sessions_spawn`, `read`, `write` lub
  `web_fetch`, programy OpenProse zakończą się niepowodzeniem. Sprawdź
  [konfigurację allowlisty narzędzi](/pl/gateway/config-tools).
</Warning>

## Lokalizacje plików

OpenProse przechowuje stan w katalogu `.prose/` w Twoim workspace:

```text
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

```text
~/.prose/agents/
```

## Backendy stanu

<AccordionGroup>
  <Accordion title="filesystem (domyślnie)">
    Stan jest zapisywany w `.prose/runs/...` w workspace. Nie są wymagane
    dodatkowe zależności.
  </Accordion>
  <Accordion title="in-context">
    Stan przejściowy przechowywany w oknie kontekstu. Odpowiednie dla małych,
    krótkotrwałych programów.
  </Accordion>
  <Accordion title="sqlite (eksperymentalne)">
    Wymaga pliku binarnego `sqlite3` w `PATH`.
  </Accordion>
  <Accordion title="postgres (eksperymentalne)">
    Wymaga `psql` oraz ciągu połączenia.

    <Warning>
      Dane uwierzytelniające Postgres trafiają do logów podagentów. Użyj
      dedykowanej bazy danych o minimalnych uprawnieniach.
    </Warning>

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

Traktuj pliki `.prose` jak kod. Przejrzyj je przed uruchomieniem, w tym zdalne
importy `use`. Żądania najwyższego poziomu `/prose run https://...` są jawne, ale
przechodnie zdalne importy wymagają zatwierdzenia dla każdego uruchomienia, zanim
zostaną pobrane lub wykonane. Używaj allowlist narzędzi OpenClaw i bramek
zatwierdzania, aby kontrolować efekty uboczne. W przypadku deterministycznych
przepływów pracy z bramkami zatwierdzania porównaj z
[Lobster](/pl/tools/lobster).

## Powiązane

<CardGroup cols={2}>
  <Card title="Referencja Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Jak ładuje się pakiet Skills OpenProse i jakie bramki mają zastosowanie.
  </Card>
  <Card title="Podagenci" href="/pl/tools/subagents" icon="users">
    Natywna warstwa koordynacji wieloagentowej OpenClaw.
  </Card>
  <Card title="Text-to-speech" href="/pl/tools/tts" icon="volume-high">
    Dodaj wyjście audio do swoich przepływów pracy.
  </Card>
  <Card title="Polecenia ukośnikowe" href="/pl/tools/slash-commands" icon="terminal">
    Wszystkie dostępne polecenia czatu, w tym /prose.
  </Card>
</CardGroup>

Oficjalna strona: [https://www.prose.md](https://www.prose.md)
