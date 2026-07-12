---
read_when:
    - Chcesz wyświetlić lub edytować pojedynczy element końcowy w pliku obszaru roboczego z poziomu terminala
    - Tworzysz skrypt korzystający ze stanu obszaru roboczego i potrzebujesz stabilnego schematu adresowania niezależnego od rodzaju zasobu
    - Decydujesz, czy włączyć opcjonalny plugin `oc-path` na samodzielnie hostowanym Gatewayu
summary: 'Dołączony Plugin `oc-path`: dostarcza CLI `openclaw path` dla schematu adresowania plików obszaru roboczego `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T15:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Dołączony Plugin `oc-path` dodaje interfejs CLI [`openclaw path`](/pl/cli/path) dla
schematu adresowania plików obszaru roboczego `oc://`. Jest dostarczany w repozytorium OpenClaw w
`extensions/oc-path/`, ale wymaga jawnego włączenia: po instalacji lub kompilacji pozostaje nieaktywny, dopóki go
nie włączysz.

Adresy `oc://` wskazują pojedynczy element końcowy (lub zestaw elementów końcowych określony symbolem wieloznacznym) wewnątrz
pliku obszaru roboczego. Plugin obsługuje cztery rodzaje plików:

- **markdown** (`.md`): metadane frontmatter, sekcje, elementy, pola
- **jsonc** (`.jsonc`, `.json`): z zachowaniem komentarzy i formatowania
- **jsonl** (`.jsonl`, `.ndjson`): rekordy zorientowane wierszowo
- **yaml** (`.yaml`, `.yml`, `.lobster`): węzły map, sekwencji i wartości skalarnych za pośrednictwem
  API `Document` pakietu `yaml`

Administratorzy samodzielnie hostowanych instalacji i rozszerzenia edytorów używają CLI do odczytu lub zapisu pojedynczego elementu końcowego
bez bezpośredniego tworzenia skryptów korzystających z SDK; agenci i hooki traktują go jako
deterministyczną warstwę bazową, dzięki czemu operacje odczytu i ponownego zapisu zachowują wierność na poziomie bajtów, a
ochrona znacznika redakcji działa jednolicie dla wszystkich rodzajów plików. Pełną gramatykę, listę flag dla poszczególnych poleceń oraz
praktyczne przykłady dla każdego rodzaju pliku zawiera
[dokumentacja CLI](/pl/cli/path); ta strona wyjaśnia, dlaczego i jak włączyć
Plugin.

## Dlaczego warto go włączyć

Włącz `oc-path`, gdy skrypty, hooki lub lokalne narzędzia agentów muszą wskazywać
dokładny fragment stanu obszaru roboczego bez osobnego parsera dla każdego formatu pliku. Jeden
adres `oc://` może wskazywać klucz frontmatter Markdown, element sekcji,
wartość końcową konfiguracji JSONC, pole zdarzenia JSONL lub krok przepływu pracy YAML.

Ma to znaczenie w przepływach pracy opiekunów, w których zmiana powinna pozostać niewielka,
możliwa do audytu i powtarzalna: sprawdź jedną wartość, znajdź pasujące rekordy, wykonaj próbny
zapis, a następnie zastosuj zmianę tylko do tego elementu końcowego, pozostawiając bez zmian komentarze, zakończenia wierszy i
pobliskie formatowanie.

Typowe powody włączenia:

- **Lokalna automatyzacja**: skrypty powłoki odczytują lub aktualizują jedną wartość obszaru roboczego
  za pomocą `openclaw path … --json`, zamiast zawierać osobny kod analizujący Markdown, JSONC,
  JSONL i YAML.
- **Edycje widoczne dla agenta**: przed zapisem agent pokazuje różnicę z wykonania próbnego dla jednego zaadresowanego
  elementu końcowego, co łatwiej sprawdzić niż swobodne
  przepisanie pliku.
- **Integracje z edytorami**: edytor odwzorowuje `oc://AGENTS.md/tools/gh` na
  dokładny węzeł Markdown i numer wiersza bez zgadywania na podstawie tekstu nagłówka.
- **Diagnostyka**: `emit` przeprowadza plik przez parser i generator,
  dzięki czemu można sprawdzić, czy dany rodzaj pliku zachowuje identyczną reprezentację bajtową, zanim zacznie się polegać na
  automatycznych edycjach.

```bash
# Czy Plugin GitHub jest włączony w tej konfiguracji?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Jakie nazwy wywołań narzędzi występują w tym dzienniku sesji?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Jakie bajty zapisałaby ta drobna zmiana konfiguracji?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` celowo nie odpowiada za semantykę wyższego poziomu. Pluginy
pamięci nadal odpowiadają za zapisywanie pamięci, polecenia konfiguracji nadal odpowiadają za pełne zarządzanie
konfiguracją, a mechanizm odzyskiwania ostatniej znanej dobrej konfiguracji (LKG) nadal odpowiada za
przywracanie i zatwierdzanie. `oc-path` stanowi wąską warstwę adresowania oraz operacji na plikach z zachowaniem
bajtów, wokół której mogą działać te narzędzia wyższego poziomu.

## Gdzie działa

Plugin działa **wewnątrz procesu CLI `openclaw`** na hoście, na którym
wywołujesz polecenie. Nie wymaga działającego Gateway i nie otwiera żadnych
gniazd sieciowych; każde polecenie wykonuje wyłącznie przekształcenie wskazanego pliku.

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

`onStartup: false` wyklucza Plugin ze ścieżki uruchamiania Gateway.
`commandAliases` i `activation.onCommands` nakazują CLI leniwe załadowanie Pluginu
przy pierwszym uruchomieniu `openclaw path …`, dzięki czemu instalacje, które nigdy nie korzystają
z tego polecenia, nie ponoszą żadnego kosztu.

## Włączanie

```bash
openclaw plugins enable oc-path
```

Uruchom ponownie Gateway (jeśli z niego korzystasz), aby migawka manifestu uwzględniła nowy
stan. Bezpośrednie wywołania `openclaw path` działają natychmiast na tym samym hoście;
CLI ładuje Plugin na żądanie.

Wyłączanie:

```bash
openclaw plugins disable oc-path
```

## Zależności

Wszystkie zależności parserów są lokalne dla Pluginu; włączenie `oc-path` nie dodaje
nowych pakietów do podstawowego środowiska wykonawczego:

| Zależność      | Przeznaczenie                                                                      |
| -------------- | ---------------------------------------------------------------------------------- |
| `commander`    | Obsługa podpoleceń `resolve`, `find`, `set`, `validate`, `emit`.                   |
| `jsonc-parser` | Analiza JSONC i edycja elementów końcowych z zachowaniem komentarzy i końcowych przecinków. |
| `markdown-it`  | Tokenizacja Markdown na potrzeby modelu sekcji, elementów i pól.                   |
| `yaml`         | Analiza, generowanie i edycja `Document` YAML z zachowaniem komentarzy i stylu przepływowego. |

Obsługa JSONL pozostaje napisana ręcznie: analiza wierszowa jest prostsza niż użycie jakiejkolwiek
zależności, a analiza poszczególnych wierszy i tak korzysta z `jsonc-parser`.

## Udostępniane funkcje

| Powierzchnia                    | Zapewniana przez                                         |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Parser i formater `oc://`      | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Analiza, generowanie i edycja poszczególnych rodzajów | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Uniwersalne odczytywanie, wyszukiwanie i ustawianie | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Ochrona znacznika redakcji     | `extensions/oc-path/src/oc-path/sentinel.ts`             |

CLI jest obecnie jedynym publicznym interfejsem. Polecenia warstwy bazowej są prywatną częścią
Pluginu; użytkownicy korzystają z CLI (lub tworzą własny Plugin przy użyciu
SDK).

## Relacje z innymi Pluginami

- **`memory-*`**: zapisywanie pamięci odbywa się przez Pluginy pamięci, a nie
  `oc-path`. `oc-path` jest ogólną warstwą bazową operacji na plikach; Pluginy pamięci nakładają
  na nią własną semantykę.
- **LKG**: `path` nie obsługuje przywracania ostatniej znanej dobrej konfiguracji. Jeśli
  plik edytowany przez `path` jest również śledzony przez LKG, następny cykl obserwacji
  konfiguracji zdecyduje, czy go zatwierdzić, czy odzyskać; traktuj edycję przez `path`
  tak samo jak każdy inny bezpośredni zapis do tego pliku.

## Bezpieczeństwo

`set` zapisuje surowe bajty przez ścieżkę generowania warstwy bazowej, która automatycznie stosuje
ochronę znacznika redakcji. Zapis elementu końcowego zawierającego
`__OPENCLAW_REDACTED__` (dosłownie lub jako podciąg) zostaje odrzucony
z błędem `OC_EMIT_SENTINEL`. CLI usuwa również dosłowny znacznik ze wszystkich
wyświetlanych danych wyjściowych przeznaczonych dla człowieka lub w formacie JSON, zastępując go ciągiem `[REDACTED]`, aby zrzuty
terminala i potoki nigdy nie ujawniły tego znacznika.

## Powiązane materiały

- [Dokumentacja CLI `openclaw path`](/pl/cli/path)
- [Zarządzanie Pluginami](/pl/plugins/manage-plugins)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
