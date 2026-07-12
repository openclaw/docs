---
read_when:
    - Chcesz uruchamiać lub tworzyć pliki przepływu pracy .prose
    - Chcesz włączyć plugin OpenProse
    - Musisz zrozumieć, jak OpenProse mapuje się na prymitywy OpenClaw
sidebarTitle: OpenProse
summary: OpenProse to format przepływu pracy oparty przede wszystkim na Markdownie, przeznaczony do wieloagentowych sesji AI. W OpenClaw jest dostarczany jako plugin z poleceniem ukośnikowym /prose i pakietem Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T15:33:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse to przenośny format przepływów pracy, oparty przede wszystkim na Markdown, służący do koordynowania sesji AI. W OpenClaw jest dostarczany jako Plugin, który instaluje pakiet Skills OpenProse oraz polecenie ukośnikowe `/prose`. Programy są przechowywane w plikach `.prose` i mogą uruchamiać wielu podagentów z jawnym sterowaniem przepływem.

<CardGroup cols={3}>
  <Card title="Instalacja" icon="download" href="#install">
    Włącz Plugin OpenProse i uruchom ponownie Gateway.
  </Card>
  <Card title="Uruchamianie programu" icon="play" href="#slash-command">
    Użyj `/prose run`, aby wykonać plik `.prose` lub program zdalny.
  </Card>
  <Card title="Tworzenie programów" icon="pencil" href="#example-parallel-research-and-synthesis">
    Twórz wieloagentowe przepływy pracy z krokami równoległymi i sekwencyjnymi.
  </Card>
</CardGroup>

## Instalacja

<Steps>
  <Step title="Włącz Plugin">
    OpenProse jest dołączony, ale domyślnie wyłączony. Włącz go:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Sprawdź">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` powinien być oznaczony jako włączony. Polecenie Skills `/prose` jest teraz dostępne na czacie.

  </Step>
</Steps>

Z kopii roboczej repozytorium możesz zainstalować Plugin bezpośrednio:
`openclaw plugins install ./extensions/open-prose`

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

`/prose run <handle/slug>` jest rozwijane do `https://p.prose.md/<handle>/<slug>`.
Bezpośrednie adresy URL są pobierane bez zmian za pomocą narzędzia `web_fetch`.

Zdalne uruchomienia najwyższego poziomu są jawne. Zdalne importy wewnątrz programu `.prose` są przechodnimi zależnościami kodu: zanim OpenProse pobierze jakikolwiek zdalny cel `use`, wyświetla listę rozwiązanych importów i wymaga, aby operator odpowiedział dokładnie `approve remote prose imports` dla danego uruchomienia.

## Możliwości

- Wieloagentowe badania i synteza z jawną równoległością.
- Powtarzalne przepływy pracy z bezpiecznym zatwierdzaniem (przegląd kodu, segregacja incydentów, potoki treści).
- Wielokrotnego użytku programy `.prose`, które można uruchamiać w obsługiwanych środowiskach wykonawczych agentów.

## Przykład: równoległe badania i synteza

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

## Odwzorowanie środowiska wykonawczego OpenClaw

Programy OpenProse są odwzorowywane na elementy podstawowe OpenClaw:

| Pojęcie OpenProse                    | Narzędzie OpenClaw                              |
| ------------------------------------ | ----------------------------------------------- |
| Utworzenie sesji / narzędzie Task    | `sessions_spawn`                                |
| Odczyt / zapis pliku                 | `read` / `write`                                |
| Pobieranie z internetu               | `web_fetch` (`exec` + curl, gdy wymagany jest POST) |

<Warning>
  Jeśli lista dozwolonych narzędzi blokuje `sessions_spawn`, `read`, `write` lub
  `web_fetch`, programy OpenProse zakończą się niepowodzeniem. Sprawdź
  [konfigurację listy dozwolonych narzędzi](/pl/gateway/config-tools).
</Warning>

## Lokalizacje plików

OpenProse przechowuje stan w katalogu `.prose/` w obszarze roboczym:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Trwali agenci na poziomie użytkownika (współdzieleni między projektami) znajdują się w:

```text
~/.prose/agents/
```

## Mechanizmy przechowywania stanu

<AccordionGroup>
  <Accordion title="system plików (domyślny)">
    Stan jest zapisywany w `.prose/runs/...` w obszarze roboczym. Nie są wymagane żadne dodatkowe zależności.
  </Accordion>
  <Accordion title="w kontekście">
    Stan przejściowy jest przechowywany w oknie kontekstu; wybierz za pomocą `--in-context`.
    Rozwiązanie odpowiednie dla małych, krótkotrwałych programów.
  </Accordion>
  <Accordion title="sqlite (eksperymentalny)">
    Wybierz za pomocą `--state=sqlite`. Wymaga pliku binarnego `sqlite3` dostępnego w `PATH`
    (w razie jego braku używany jest system plików); stan jest zapisywany w
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (eksperymentalny)">
    Wybierz za pomocą `--state=postgres`. Wymaga `psql` oraz ciągu połączenia w
    `OPENPROSE_POSTGRES_URL` (ustaw go w `.prose/.env`).

    <Warning>
      Dane uwierzytelniające Postgres trafiają do dzienników podagentów. Użyj dedykowanej bazy danych z minimalnymi uprawnieniami.
    </Warning>

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo

Traktuj pliki `.prose` jak kod. Przejrzyj je przed uruchomieniem, w tym zdalne importy `use`. Żądania najwyższego poziomu `/prose run https://...` są jawne, ale przechodnie zdalne importy wymagają zatwierdzenia dla każdego uruchomienia, zanim zostaną pobrane lub wykonane. Używaj list dozwolonych narzędzi OpenClaw i bramek zatwierdzania do kontrolowania efektów ubocznych. W przypadku deterministycznych przepływów pracy wymagających zatwierdzenia porównaj z
[Lobster](/pl/tools/lobster).

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dokumentacja Skills" href="/pl/tools/skills" icon="puzzle-piece">
    Sposób ładowania pakietu Skills OpenProse oraz obowiązujące bramki.
  </Card>
  <Card title="Podagenci" href="/pl/tools/subagents" icon="users">
    Natywna warstwa koordynacji wieloagentowej OpenClaw.
  </Card>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="volume-high">
    Dodawanie wyjścia dźwiękowego do przepływów pracy.
  </Card>
  <Card title="Polecenia ukośnikowe" href="/pl/tools/slash-commands" icon="terminal">
    Wszystkie dostępne polecenia czatu, w tym /prose.
  </Card>
</CardGroup>

Oficjalna witryna: [https://www.prose.md](https://www.prose.md)
