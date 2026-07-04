---
read_when:
    - Chcesz mieć jeden zarządzany klucz dla wielu dostawców modeli
    - Potrzebujesz wykrywania modeli ClawRouter lub raportowania limitów w OpenClaw
summary: Kieruj modele ograniczone zakresem poświadczeń przez ClawRouter i pokazuj zarządzane limity
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T04:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter daje OpenClaw jeden klucz ograniczony zasadami dla wielu nadrzędnych
dostawców modeli. Dołączony Plugin wykrywa tylko modele dozwolone dla tego klucza,
kieruje każdy model przez zadeklarowany protokół i raportuje budżet klucza
oraz łączne użycie w powierzchniach użycia OpenClaw.

Nie instalujesz ani nie uwierzytelniasz każdego nadrzędnego Plugin dostawcy na hoście
OpenClaw. Poświadczenia nadrzędne i przekazywanie specyficzne dla dostawcy pozostają w
ClawRouter. OpenClaw potrzebuje tylko dołączonego Plugin `@openclaw/clawrouter` oraz
wydanego poświadczenia ClawRouter.

| Właściwość   | Wartość                                  |
| ------------ | ---------------------------------------- |
| Dostawca     | `clawrouter`                             |
| Pakiet       | `@openclaw/clawrouter`                   |
| Uwierzytelnianie | `CLAWROUTER_API_KEY`                 |
| Domyślny URL | `https://clawrouter.openclaw.ai`         |
| Katalog modeli | Ograniczony poświadczeniem przez `/v1/catalog` |
| Limity       | Miesięczny budżet i użycie przez `/v1/usage` |

## Pierwsze kroki

<Steps>
  <Step title="Get a scoped credential">
    Poproś administratora ClawRouter o poświadczenie, którego zasady obejmują
    dostawców, modele i miesięczny budżet, z których masz korzystać. Poświadczenia są
    ujawniane jednorazowo w momencie wydania.
  </Step>
  <Step title="Configure OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Plugin jest dołączony do OpenClaw. Jeśli Twoja konfiguracja ustawia
    `plugins.allow`, dodaj `clawrouter` do tej listy przed jego włączeniem. W przypadku
    niestandardowego wdrożenia ustaw `models.providers.clawrouter.baseUrl` na źródło
    ClawRouter; wartość domyślna to `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="List granted models">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Używaj zwróconych odwołań do modeli dokładnie tak, jak pokazano. Zachowują one
    nadrzędną przestrzeń nazw, taką jak `clawrouter/openai/...`, `clawrouter/anthropic/...` lub
    `clawrouter/google/...`. Jeśli `agents.defaults.models` jest listą dozwolonych
    w Twojej konfiguracji, dodaj do niej każde wybrane odwołanie ClawRouter.

  </Step>
  <Step title="Select a model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Możesz też wybrać zwrócony model dla pojedynczego uruchomienia za pomocą
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Wykrywanie modeli

`GET /v1/catalog` jest źródłem prawdy. OpenClaw nie dostarcza drugiej,
stałej listy modeli ClawRouter. Model skonfigurowany w ClawRouter pojawia się, gdy:

- zasady poświadczenia przyznają dostęp do jego dostawcy;
- połączenie dostawcy jest włączone i gotowe;
- model katalogu ogłasza obsługiwaną zdolność LLM; oraz
- katalog udostępnia kontrakt transportowy obsługiwany przez Plugin.

Dodanie kolejnego modelu do obsługiwanego dostawcy ClawRouter nie wymaga więc
wydania OpenClaw ani kolejnego Plugin dostawcy. Następne odświeżenie katalogu
go wykryje. Model, który wymaga nowego protokołu przewodowego, wymaga obsługi
w Plugin ClawRouter, zanim OpenClaw go ogłosi.

## Protokół i Plugin dostawcy

Nie musisz instalować Plugin uwierzytelniania każdej firmy nadrzędnej. ClawRouter
posiada poświadczenia nadrzędne; jego katalog mówi OpenClaw, którego transportu użyć.
Plugin obsługuje:

| Trasa katalogu                  | Transport OpenClaw      |
| ------------------------------- | ----------------------- |
| Czat zgodny z OpenAI            | `openai-completions`    |
| Responses zgodne z OpenAI       | `openai-responses`      |
| Natywne Anthropic Messages      | `anthropic-messages`    |
| Natywne strumieniowanie Google Gemini | `google-generative-ai` |

Plugin stosuje również pasujące zasady odtwarzania i schematu narzędzi dla tych
rodzin. Wiersze katalogu używające innego formatu żądania/strumienia celowo
nie są ogłaszane jako modele tekstowe OpenClaw. Normalizuj tych dostawców do jednego
z obsługiwanych kontraktów w ClawRouter zamiast wysyłać niezgodny payload.

## Limity i użycie

Odpowiedź `/v1/usage` z ClawRouter zasila standardowe powierzchnie użycia dostawcy
OpenClaw. `/status` i powiązany status pulpitu pokazują miesięczne okno budżetu,
gdy klucz ma limit, a także łączne wartości żądań, tokenów i wydatków. Klucze
bez pomiaru nadal pokazują łączne użycie bez okna procentowego.

Wyszukiwanie limitu używa tego samego ograniczonego klucza co wykrywanie modeli.
Nieudane wyszukanie limitu nie blokuje wykonania modelu.

Sprawdź bieżący zrzut za pomocą:

```bash
openclaw status --usage
openclaw models status
```

Ten sam zrzut dostawcy jest dostępny dla `/status` na czacie i w interfejsie użycia
OpenClaw. Budżet obejmuje całe zasady, więc żądania wykonane przez innego klienta
używającego tych samych zasad ClawRouter mogą zmienić pozostały procent.

## Rozwiązywanie problemów

| Objaw                                    | Sprawdź                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brak modeli ClawRouter                   | Potwierdź, że Plugin jest włączony i dozwolony przez `plugins.allow`, a następnie sprawdź, czy poświadczenie jest aktywne i przyznaje dostęp do co najmniej jednego gotowego dostawcy. |
| Brakuje skonfigurowanego modelu ClawRouter | Sprawdź jego zdolność i format trasy w `/v1/catalog`. Nieobsługiwane kontrakty transportowe są celowo filtrowane.                              |
| `Unknown model: clawrouter/...`          | Dodaj dokładne odwołanie z katalogu do `agents.defaults.models`, gdy ta mapa konfiguracji jest używana jako lista dozwolonych.                  |
| `401` lub `403` z katalogu albo użycia   | Wydaj ponownie albo zmień zakres poświadczenia ClawRouter; OpenClaw nie przełącza się awaryjnie na klucze nadrzędnych dostawców.               |
| Wywołanie modelu kończy się niepowodzeniem po wykryciu | Sprawdź połączenie dostawcy i kondycję nadrzędną w ClawRouter, a następnie ponów próbę po przywróceniu stanu gotowości.                       |
| Użycie ma sumy, ale nie ma procentu      | Zasady są niemierzone; dodaj miesięczny budżet w ClawRouter, aby udostępnić okno procentowe.                                                    |

## Zachowanie bezpieczeństwa

- Wykrywanie katalogu jest ograniczone do skonfigurowanego klucza proxy i buforowane per klucz.
- Klucz proxy jest dołączany tylko podczas wysyłania żądania; nie jest przechowywany w metadanych modelu.
- Natywne identyfikatory modeli Anthropic i Gemini są przepisywane na ich identyfikatory nadrzędne tylko podczas wysyłania.
- Nieobsługiwane lub nieprzyznane wiersze katalogu zawodzą w sposób zamknięty i nie można ich wybrać.

## Powiązane

<CardGroup cols={2}>
  <Card title="Model providers" href="/pl/concepts/model-providers" icon="layers">
    Konfiguracja dostawcy i wybór modelu.
  </Card>
  <Card title="Usage tracking" href="/pl/concepts/usage-tracking" icon="chart-line">
    Powierzchnie użycia i statusu OpenClaw.
  </Card>
</CardGroup>
