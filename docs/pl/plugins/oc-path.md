---
read_when:
    - Chcesz sprawdzić lub edytować pojedynczy element końcowy w pliku obszaru roboczego z poziomu terminala
    - Tworzysz skrypty korzystające ze stanu przestrzeni roboczej i potrzebujesz stabilnego schematu adresowania niezależnego od rodzaju.
    - Decydujesz, czy włączyć opcjonalny Plugin `oc-path` w samodzielnie hostowanym Gateway
summary: 'Dołączony Plugin `oc-path`: dostarcza CLI `openclaw path` dla schematu adresowania plików obszaru roboczego `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-10T19:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Dołączony Plugin `oc-path` dodaje CLI [`openclaw path`](/pl/cli/path) dla
schematu adresowania plików obszaru roboczego `oc://`. Jest dostarczany w repozytorium OpenClaw pod
`extensions/oc-path/`, ale jest opcjonalny — instalacja/budowanie pozostawia go nieaktywnym, dopóki go
nie włączysz.

Adresy `oc://` wskazują pojedynczy liść (albo zestaw liści z symbolem wieloznacznym) wewnątrz
pliku obszaru roboczego. Plugin obecnie obsługuje trzy rodzaje plików:

- **markdown** (`.md`, `.mdx`): frontmatter, sekcje, elementy, pola
- **jsonc** (`.jsonc`, `.json5`, `.json`): komentarze i formatowanie zachowane
- **jsonl** (`.jsonl`, `.ndjson`): rekordy zorientowane liniowo

Osoby hostujące samodzielnie i rozszerzenia edytorów używają CLI do odczytu lub zapisu pojedynczego liścia
bez bezpośredniego pisania skryptów względem SDK; agenci i hooki traktują go jako
deterministyczną warstwę bazową, dzięki czemu rundy z zachowaniem wierności bajtowej oraz zabezpieczenie
sentinelem redakcji działają jednolicie dla wszystkich rodzajów.

## Dlaczego warto go włączyć

Włącz `oc-path`, gdy chcesz, aby skrypty, hooki albo lokalne narzędzia agentów wskazywały
precyzyjny fragment stanu obszaru roboczego bez wymyślania parsera dla każdego
kształtu pliku. Pojedynczy adres `oc://` może nazwać klucz frontmatter w Markdown, element
sekcji, liść konfiguracji JSONC albo pole zdarzenia JSONL.

Ma to znaczenie w przepływach pracy maintainerów, gdzie zmiana powinna być mała,
audytowalna i powtarzalna: sprawdź jedną wartość, znajdź pasujące rekordy, wykonaj próbny
zapis, a następnie zastosuj tylko ten liść, pozostawiając komentarze, zakończenia linii i
pobliskie formatowanie bez zmian. Utrzymanie tego jako opcjonalnego Plugin daje zaawansowanym użytkownikom
warstwę adresowania bez dodawania zależności parserów ani powierzchni CLI do
core w instalacjach, które nigdy jej nie potrzebują.

Typowe powody, aby go włączyć:

- **Automatyzacja lokalna**: skrypty powłoki mogą rozwiązać albo zaktualizować jedną wartość obszaru roboczego
  za pomocą `openclaw path … --json`, zamiast utrzymywać osobny kod parsowania Markdown, JSONC
  i JSONL.
- **Edycje widoczne dla agenta**: agent może pokazać diff próbnego uruchomienia dla jednego zaadresowanego
  liścia przed zapisem, co łatwiej przejrzeć niż swobodne przepisanie pliku.
- **Integracje edytorów**: edytor może odwzorować `oc://AGENTS.md/tools/gh` na
  dokładny węzeł Markdown i numer wiersza bez zgadywania na podstawie tekstu nagłówka.
- **Diagnostyka**: `emit` przepuszcza plik przez parser i emiter, więc
  możesz sprawdzić, czy dany rodzaj pliku jest stabilny bajtowo, zanim polegniesz na automatycznych
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

Plugin celowo nie jest właścicielem semantyki wyższego poziomu. Plugin pamięci
nadal są właścicielami zapisów pamięci, polecenia konfiguracji nadal są właścicielami pełnego zarządzania
konfiguracją, a logika LKG nadal jest właścicielem przywracania/promowania. `oc-path` to wąska
warstwa adresowania i operacji na plikach z zachowaniem bajtów, wokół której te narzędzia wyższego poziomu
mogą budować.

## Gdzie działa

Plugin działa **w procesie wewnątrz CLI `openclaw`** na hoście, na którym
wywołujesz polecenie. Nie wymaga działającego Gateway i nie otwiera żadnych
gniazd sieciowych — każdy czasownik jest czystą transformacją na wskazanym pliku.

Metadane Plugin znajdują się w `extensions/oc-path/openclaw.plugin.json`:

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
["path"]` informuje CLI, aby leniwie załadowało Plugin przy pierwszym uruchomieniu
`openclaw path …`, więc instalacje, które nigdy nie używają tego czasownika, nie ponoszą żadnego kosztu.

## Włączanie

```bash
openclaw plugins enable oc-path
```

Uruchom ponownie Gateway (jeśli go używasz), aby migawka manifestu uwzględniła nowy
stan. Bezpośrednie wywołania `openclaw path` działają od razu na tym samym hoście —
CLI ładuje Plugin na żądanie.

Wyłącz za pomocą:

```bash
openclaw plugins disable oc-path
```

## Zależności

Wszystkie zależności parserów są lokalne dla Plugin — włączenie `oc-path` nie dodaje
nowych pakietów do środowiska uruchomieniowego core:

| Zależność      | Cel                                                                 |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Okablowanie podpoleceń dla `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parsowanie JSONC + edycje liści z zachowaniem komentarzy i końcowych przecinków. |
| `markdown-it`  | Tokenizacja Markdown dla modelu sekcji / elementów / pól.           |

JSONL pozostaje ręcznie obsługiwany — parsowanie zorientowane liniowo jest prostsze niż jakakolwiek
zależność, a parsowanie JSONC per wiersz i tak przechodzi przez `jsonc-parser`.

## Co zapewnia

| Powierzchnia                   | Zapewniane przez                                         |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formater `oc://`      | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parsowanie / emisja / edycja per rodzaj | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Uniwersalne resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Zabezpieczenie sentinelem redakcji | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI jest dziś jedyną publiczną powierzchnią. Czasowniki warstwy bazowej są prywatne dla
Plugin; konsumenci używają CLI (albo budują własny Plugin względem SDK).

## Relacja do innych Plugin

- **`memory-*`**: zapisy pamięci przechodzą przez Plugin pamięci, a nie przez `oc-path`.
  `oc-path` jest ogólną warstwą bazową plików; Plugin pamięci nakładają na nią własną
  semantykę.
- **LKG**: `path` nie zna przywracania konfiguracji Last-Known-Good. Jeśli
  plik jest śledzony przez LKG, następne wywołanie `observe` decyduje, czy promować, czy
  odzyskać; `set --batch` do atomowego wielokrotnego ustawiania przez cykl życia promowania/odzyskiwania
  LKG jest planowane razem z warstwą bazową odzyskiwania LKG.

## Bezpieczeństwo

`set` zapisuje surowe bajty przez ścieżkę emisji warstwy bazowej, która automatycznie stosuje
zabezpieczenie sentinelem redakcji. Liść zawierający
`__OPENCLAW_REDACTED__` (dosłownie albo jako podciąg) jest odrzucany podczas zapisu
z `OC_EMIT_SENTINEL`. CLI czyści też dosłowny sentinel z każdego
wyjścia dla człowieka lub JSON, które wypisuje, zastępując go `[REDACTED]`, aby przechwycenia
terminala i potoki nigdy nie ujawniały znacznika.

## Powiązane

- [Dokumentacja CLI `openclaw path`](/pl/cli/path)
- [Zarządzanie Plugin](/pl/plugins/manage-plugins)
- [Budowanie Plugin](/pl/plugins/building-plugins)
