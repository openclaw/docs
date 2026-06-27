---
read_when:
    - Chcesz sprawdzić lub edytować pojedynczy liść w pliku obszaru roboczego z terminala
    - Piszesz skrypty działające na stanie przestrzeni roboczej i potrzebujesz stabilnego schematu adresowania niezależnego od rodzaju
    - Decydujesz, czy włączyć opcjonalny Plugin `oc-path` na samodzielnie hostowanym Gateway
summary: 'Dołączony `oc-path` Plugin: dostarcza CLI `openclaw path` dla schematu adresowania plików obszaru roboczego `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:56:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Dołączony Plugin `oc-path` dodaje CLI [`openclaw path`](/pl/cli/path) dla schematu
adresowania plików obszaru roboczego `oc://`. Jest dostarczany w repozytorium OpenClaw w
`extensions/oc-path/`, ale jest opcjonalny — instalacja/kompilacja pozostawia go nieaktywnym, dopóki go
nie włączysz.

Adresy `oc://` wskazują pojedynczy liść (lub zestaw liści z symbolem wieloznacznym) wewnątrz
pliku obszaru roboczego. Plugin obsługuje dziś cztery rodzaje plików:

- **markdown** (`.md`, `.mdx`): frontmatter, sekcje, elementy, pola
- **jsonc** (`.jsonc`, `.json5`, `.json`): komentarze i formatowanie zachowane
- **jsonl** (`.jsonl`, `.ndjson`): rekordy zorientowane na wiersze
- **yaml** (`.yaml`, `.yml`, `.lobster`): węzły map/sekwencji/skalarów przez
  interfejs API dokumentu YAML

Osoby hostujące samodzielnie i rozszerzenia edytorów używają CLI do odczytu lub zapisu pojedynczego liścia
bez bezpośredniego skryptowania względem SDK; agenci i hooki traktują go jako
deterministyczną warstwę bazową, dzięki czemu rundy zapisu i odczytu z wiernością bajtową oraz strażnik
sentinela redakcji działają jednolicie dla wszystkich rodzajów.

## Dlaczego warto go włączyć

Włącz `oc-path`, gdy chcesz, aby skrypty, hooki lub lokalne narzędzia agentowe wskazywały
precyzyjny fragment stanu obszaru roboczego bez wymyślania parsera dla każdego
kształtu pliku. Pojedynczy adres `oc://` może nazwać klucz frontmatter w Markdown, element
sekcji, liść konfiguracji JSONC, pole zdarzenia JSONL albo krok przepływu pracy YAML.

Ma to znaczenie w przepływach pracy maintainerów, gdzie zmiana powinna być mała,
audytowalna i powtarzalna: sprawdź jedną wartość, znajdź pasujące rekordy, wykonaj próbny zapis,
a potem zastosuj tylko ten liść, pozostawiając komentarze, zakończenia wierszy i
pobliskie formatowanie bez zmian. Utrzymanie tego jako opcjonalnego Pluginu daje zaawansowanym użytkownikom
warstwę adresowania bez wprowadzania zależności parserów ani powierzchni CLI do
core dla instalacji, które nigdy jej nie potrzebują.

Typowe powody włączenia:

- **Lokalna automatyzacja**: skrypty powłoki mogą rozwiązać lub zaktualizować jedną wartość obszaru roboczego
  za pomocą `openclaw path … --json`, zamiast utrzymywać osobny kod parsowania Markdown, JSONC,
  JSONL i YAML.
- **Edycje widoczne dla agenta**: agent może pokazać różnicę próbnego zapisu dla jednego zaadresowanego
  liścia przed zapisem, co łatwiej przejrzeć niż swobodny przepis pliku.
- **Integracje edytora**: edytor może zmapować `oc://AGENTS.md/tools/gh` na
  dokładny węzeł Markdown i numer wiersza bez zgadywania na podstawie tekstu nagłówka.
- **Diagnostyka**: `emit` przepuszcza plik przez parser i emiter tam i z powrotem, więc
  możesz sprawdzić, czy dany rodzaj pliku jest stabilny bajtowo, zanim oprzesz się na automatycznych
  edycjach.

Konkretne przykłady:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin celowo nie jest właścicielem semantyki wyższego poziomu. Pluginy pamięci
nadal odpowiadają za zapisy w pamięci, polecenia konfiguracji nadal odpowiadają za pełne zarządzanie
konfiguracją, a logika LKG nadal odpowiada za odtwarzanie/promowanie. `oc-path` to wąska
warstwa adresowania i zachowujących bajty operacji na plikach, wokół której te narzędzia wyższego poziomu
mogą budować.

## Gdzie działa

Plugin działa **w procesie wewnątrz CLI `openclaw`** na hoście, na którym
wywołujesz polecenie. Nie wymaga działającego Gateway i nie otwiera żadnych
gniazd sieciowych — każdy czasownik jest czystą transformacją pliku, który wskażesz.

Metadane Pluginu znajdują się w `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` utrzymuje Plugin poza gorącą ścieżką Gateway. `onCommands:
["path"]` informuje CLI, aby leniwie załadować Plugin przy pierwszym uruchomieniu
`openclaw path …`, więc instalacje, które nigdy nie używają tego czasownika, nie ponoszą kosztu.

## Włączanie

```bash
openclaw plugins enable oc-path
```

Uruchom ponownie Gateway (jeśli go używasz), aby migawka manifestu uwzględniła nowy
stan. Proste wywołania `openclaw path` działają od razu na tym samym hoście —
CLI ładuje Plugin na żądanie.

Wyłącz za pomocą:

```bash
openclaw plugins disable oc-path
```

## Zależności

Wszystkie zależności parserów są lokalne dla Pluginu — włączenie `oc-path` nie wciąga
nowych pakietów do runtime core:

| Zależność      | Cel                                                                    |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Okablowanie podpoleceń dla `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parsowanie JSONC + edycje liści z zachowaniem komentarzy i końcowych przecinków. |
| `markdown-it`  | Tokenizacja Markdown dla modelu sekcji / elementów / pól.              |
| `yaml`         | Parsowanie / emitowanie / edycja `Document` YAML z zachowaniem komentarzy i stylu przepływowego. |

JSONL pozostaje napisany ręcznie — parsowanie zorientowane na wiersze jest prostsze niż jakakolwiek
zależność, a parsowanie JSONC dla każdego wiersza i tak przechodzi przez `jsonc-parser`.

## Co udostępnia

| Powierzchnia                   | Dostarczane przez                                      |
| ------------------------------ | ------------------------------------------------------ |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`               |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`            |
| Parsowanie / emitowanie / edycja dla rodzaju | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Uniwersalne resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Strażnik sentinela redakcji    | `extensions/oc-path/src/oc-path/sentinel.ts`           |

CLI jest dziś jedyną publiczną powierzchnią. Czasowniki warstwy bazowej są prywatne dla
Pluginu; konsumenci używają CLI (albo budują własny Plugin względem SDK).

## Relacja z innymi Pluginami

- **`memory-*`**: zapisy pamięci przechodzą przez Pluginy pamięci, a nie `oc-path`.
  `oc-path` jest ogólną warstwą bazową plików; Pluginy pamięci nakładają na nią własną
  semantykę.
- **LKG**: `path` nie wie nic o odtwarzaniu konfiguracji Last-Known-Good. Jeśli
  plik jest śledzony przez LKG, następne wywołanie `observe` decyduje, czy promować, czy
  odzyskiwać; `set --batch` dla atomowego wielokrotnego ustawiania przez cykl życia promote/recover LKG
  jest planowane wraz z warstwą bazową odzyskiwania LKG.

## Bezpieczeństwo

`set` zapisuje surowe bajty przez ścieżkę emitowania warstwy bazowej, która automatycznie stosuje
strażnika sentinela redakcji. Liść zawierający
`__OPENCLAW_REDACTED__` (dosłownie lub jako podciąg) jest odrzucany w czasie zapisu
z `OC_EMIT_SENTINEL`. CLI usuwa też dosłowny sentinel z każdego
wyjścia dla człowieka lub JSON, które wypisuje, zastępując go `[REDACTED]`, aby przechwytywania
terminala i potoki nigdy nie ujawniały znacznika.

## Powiązane

- [Dokumentacja referencyjna CLI `openclaw path`](/pl/cli/path)
- [Zarządzanie Pluginami](/pl/plugins/manage-plugins)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
