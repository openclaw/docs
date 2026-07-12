---
read_when:
    - Chcesz używać jednego zarządzanego klucza dla wielu dostawców modeli
    - Potrzebujesz wykrywania modeli ClawRouter lub raportowania limitów w OpenClaw
summary: Kieruj modele z poświadczeniami przez ClawRouter i wyświetlaj zarządzane limity wykorzystania
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T15:31:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter udostępnia OpenClaw jeden klucz o zakresie określonym przez zasady dla wielu nadrzędnych
dostawców modeli. Dołączony plugin `clawrouter` wykrywa wyłącznie modele dozwolone
dla tego klucza, kieruje każdy model przez zadeklarowany dla niego protokół i raportuje
budżet klucza oraz zagregowane użycie w interfejsach użycia OpenClaw.

Nadrzędne dane uwierzytelniające i przekazywanie specyficzne dla dostawców pozostają w ClawRouter,
dlatego na hoście OpenClaw nie trzeba instalować ani uwierzytelniać pluginu każdego
nadrzędnego dostawcy. Plugin jest dołączony do OpenClaw (`enabledByDefault: true`);
potrzebujesz jedynie wydanych danych uwierzytelniających ClawRouter.

| Właściwość      | Wartość                                    |
| --------------- | ------------------------------------------ |
| Dostawca        | `clawrouter`                               |
| Plugin          | dołączony (zawarty w OpenClaw)             |
| Uwierzytelnianie | `CLAWROUTER_API_KEY`                      |
| Domyślny adres URL | `https://clawrouter.openclaw.ai`        |
| Katalog modeli  | Ograniczony zakresem danych uwierzytelniających przez `/v1/catalog` |
| Limity          | Miesięczny budżet i użycie przez `/v1/usage` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj dane uwierzytelniające o określonym zakresie">
    Poproś administratora ClawRouter o dane uwierzytelniające, których zasady obejmują
    dostawców, modele i miesięczny budżet, z których masz korzystać. Dane uwierzytelniające są
    ujawniane tylko raz podczas wydawania.
  </Step>
  <Step title="Skonfiguruj OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` jest dołączony i domyślnie włączony. Jeśli konfiguracja ustawia
    `plugins.allow`, dodaj `clawrouter` do tej listy przed jego włączeniem. W przypadku
    niestandardowego wdrożenia ustaw `models.providers.clawrouter.baseUrl` na adres bazowy
    ClawRouter; domyślnie jest to `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Wyświetl przyznane modele">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Używaj zwróconych odwołań do modeli dokładnie w pokazanej postaci. Zachowują one nadrzędną
    przestrzeń nazw, na przykład `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` lub
    `clawrouter/google/gemini-3.5-flash`. Jeśli `agents.defaults.models` jest
    listą dozwolonych elementów w konfiguracji, dodaj do niej każde wybrane odwołanie ClawRouter.

  </Step>
  <Step title="Wybierz model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Możesz również wybrać zwrócony model dla pojedynczego uruchomienia za pomocą
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Zarządzane wdrożenie nieinteraktywne

Przechowuj klucz proxy w mechanizmie wstrzykiwania sekretów obciążenia, a w
`openclaw.json` zapisuj wyłącznie SecretRef. Kanoniczne pola zarządzane to:

| Przeznaczenie       | Pole konfiguracji lub środowiska                                              |
| ------------------- | ----------------------------------------------------------------------------- |
| Adres bazowy routera | `models.providers.clawrouter.baseUrl`                                        |
| Dane uwierzytelniające | `models.providers.clawrouter.apiKey` -> środowiskowy SecretRef              |
| Wartość sekretu     | `CLAWROUTER_API_KEY` w środowisku procesu Gateway                              |
| Model domyślny      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`             |
| Znacznik obciążenia | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcjonalnie)    |

Na przykład kontroler wdrożenia może zarządzać następującą poprawką JSON5:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Jeśli wdrożenie ustawia `plugins.allow`, zachowaj istniejące wpisy i dodaj
`clawrouter`. Zweryfikuj i zastosuj bez interaktywnego kreatora:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Przebieg próbny rozwiązuje SecretRef, ale nigdy nie wyświetla jego wartości. Aby zmienić
dane uwierzytelniające, zaktualizuj zewnętrzny Secret dostarczający `CLAWROUTER_API_KEY` i
uruchom ponownie obciążenie Gateway, aby wczytać nowe środowisko procesu. Plik
konfiguracyjny i odwołanie do modelu pozostają bez zmian.

W przypadku samodzielnego Gateway Docker zbudowanego ze źródeł ClawRouter jest już zawarty w
głównym środowisku uruchomieniowym. Wybierz tylko plugin kanału wymagający osobnego pakowania,
na przykład `OPENCLAW_EXTENSIONS=clickclack`, `slack` lub `msteams`; zobacz
[obrazy zbudowane ze źródeł z wybranymi pluginami](/pl/install/docker#source-built-images-with-selected-plugins).
Wdrożenia archiwalne i urządzeniowe muszą pakować ten sam włączony kod źródłowy we własnym
potoku artefaktów zamiast korzystać z obrazu OCI.

## Gotowość i weryfikacja na żywo

Te kontrole potwierdzają różne granice; nie zastępuj jednej drugą:

```bash
# Wyłącznie kondycja procesu ClawRouter; dane uwierzytelniające ani nadrzędny model nie są sprawdzane.
curl -fsS https://clawrouter.internal.example/v1/health

# Wyłącznie gotowość uruchomienia Gateway OpenClaw; wywołanie modelu nie jest wykonywane.
curl -fsS http://127.0.0.1:18789/readyz

# Wykrywanie katalogu ograniczonego zakresem danych uwierzytelniających.
openclaw models list --all --provider clawrouter --json

# Minimalna rzeczywista próba wnioskowania przez skonfigurowanego dostawcę ClawRouter.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Test kanarkowy obciążenia z użyciem dokładnego przyznanego odwołania do modelu.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Użyj modelu zwróconego przez katalog o określonym zakresie zamiast bezrefleksyjnie kopiować
model z przykładu. Pomyślna odpowiedź `/readyz` oznacza, że Gateway może obsługiwać
żądania; nie potwierdza gotowości ClawRouter, jego danych uwierzytelniających ani nadrzędnego
dostawcy. Próba modelu i test kanarkowy agenta stanowią weryfikację wnioskowania.

Aby przeprowadzić diagnostykę na żywo, uruchom test kanarkowy i sprawdź standardowe dzienniki Gateway.
Istniejące diagnostyki transportu modelu, zawierające wyłącznie metadane, generują wiersze w postaci:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin wysyła ograniczone nagłówki `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` i
`X-ClawRouter-Session-Id`, gdy te identyfikatory są dostępne. Mapuje również
diagnostyczny `callId` wywołania modelu (`<run-id>:model:<n>`) na
`X-Request-ID`, dzięki czemu zdarzenie wywołania modelu OpenClaw można powiązać ze
ścieżką audytu ClawRouter zawierającą wyłącznie metadane. Wartości mieszczące się w limicie
128 znaków dla identyfikatora żądania są identyczne. Dłuższe wartości zachowują sufiks
`:model:<n>` i deterministyczny skrót, dzięki czemu odrębne wywołania pozostają ograniczone
i możliwe do powiązania. Statyczne metadane wdrożenia, takie jak
`X-ClawRouter-Project-Id`, można ustawić w mapie `headers` dostawcy.
Nagłówki przypisania agenta i sesji zachowują osobny limit 256 znaków.
Automatyczne identyfikatory żądań zawierające znaki spoza zestawu identyfikatorów ASCII
ClawRouter używają tej samej deterministycznej, ograniczonej postaci.
Jawnie skonfigurowane nagłówki, w tym dowolny wariant wielkości liter `X-Request-ID`, mają
pierwszeństwo przed wartościami automatycznymi. Diagnostyka transportu rejestruje metadane
routingu i odpowiedzi; nie zapisuje danych uwierzytelniających, identyfikatorów żądań,
promptów ani ukończonych odpowiedzi. Własne zdarzenie audytu ClawRouter udostępnia wybranego
nadrzędnego dostawcę i stan przechowywania treści.

## Wykrywanie modeli

`GET /v1/catalog` zwraca `{ providers: [...] }`, gdzie każdy wpis dostawcy
zawiera własne `models[]` (z nadrzędnym identyfikatorem, możliwościami i cennikiem) oraz
obsługiwane trasy żądań. OpenClaw nie dostarcza drugiej, stałej listy
modeli ClawRouter. Model katalogowy jest przedstawiany jako model OpenClaw, gdy:

- zasady danych uwierzytelniających przyznają dostęp do jego dostawcy;
- model katalogowy deklaruje obsługiwaną możliwość LLM (`llm.responses`,
  `llm.chat`, `llm.messages` lub `llm.stream` z pasującą trasą
  strumieniową); oraz
- dostawca udostępnia pasującą trasę dla jednego z poniższych transportów.

Dodanie modelu do obsługiwanego dostawcy ClawRouter nie wymaga wydania nowej wersji OpenClaw:
następne odświeżenie katalogu (buforowanego przez 60 sekund dla każdego zakresu danych uwierzytelniających)
wykryje go. Model wymagający nowego protokołu komunikacji wymaga najpierw obsługi przez plugin.

## Protokoły i pluginy dostawców

ClawRouter zarządza nadrzędnymi danymi uwierzytelniającymi; jego katalog informuje OpenClaw,
którego transportu użyć, dzięki czemu nie trzeba instalować pluginu uwierzytelniania każdej
nadrzędnej firmy.

| Możliwość / trasa katalogu                               | Transport OpenClaw      |
| -------------------------------------------------------- | ----------------------- |
| `llm.responses` (dostawca zgodny z OpenAI)               | `openai-responses`      |
| `llm.chat` (dostawca zgodny z OpenAI)                    | `openai-completions`    |
| `llm.messages` + trasa `anthropic.messages`              | `anthropic-messages`    |
| `llm.stream` + strumieniowa trasa `google.generate_content` | `google-generative-ai` |

Plugin stosuje również odpowiednie zasady odtwarzania i schematów narzędzi dla tych
rodzin (zgodność schematów narzędzi OpenAI/DeepSeek/Gemini; natywne zasady odtwarzania
Anthropic i Google Gemini). Dostawca katalogowy udostępniający wyłącznie
nieobsługiwany format żądań celowo nie jest przedstawiany jako model tekstowy OpenClaw.
Normalizuj takich dostawców do jednego z obsługiwanych kontraktów w
ClawRouter zamiast wysyłać niezgodny ładunek.

## Limity i użycie

Odpowiedź `/v1/usage` ClawRouter zasila standardowe interfejsy użycia dostawcy
OpenClaw: sumy żądań, tokenów i wydatków, a także miesięczne okno budżetowe, gdy
klucz ma określony limit. Klucze bez limitu nadal pokazują zagregowane użycie bez
okna procentowego.

Wyszukiwanie limitu używa tego samego klucza o określonym zakresie co wykrywanie modeli. Nieudane
wyszukiwanie limitu nie blokuje wykonywania modelu.

Sprawdź bieżący obraz stanu za pomocą:

```bash
openclaw status --usage
openclaw models status
```

Ten sam obraz stanu dostawcy jest dostępny dla `/status` na czacie oraz w interfejsie
użycia OpenClaw. Budżet obowiązuje dla całych zasad, więc żądania wykonane przez innego klienta
korzystającego z tych samych zasad ClawRouter mogą zmienić pozostałą wartość procentową.

## Rozwiązywanie problemów

| Objaw                                    | Kontrola                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Brak modeli ClawRouter                   | Potwierdź, że plugin jest włączony i dozwolony przez `plugins.allow`, a następnie sprawdź, czy dane uwierzytelniające są aktywne i przyznają dostęp do co najmniej jednego gotowego dostawcy. |
| Brakuje skonfigurowanego modelu ClawRouter | Sprawdź obsługę jego możliwości i tras w `/v1/catalog`. Nieobsługiwane kontrakty transportu są celowo odfiltrowywane.                           |
| `Unknown model: clawrouter/...`          | Dodaj dokładne odwołanie katalogowe do `agents.defaults.models`, gdy ta mapa konfiguracji jest używana jako lista dozwolonych elementów.       |
| `401` lub `403` z katalogu albo interfejsu użycia | Wydaj ponownie dane uwierzytelniające ClawRouter lub zmień ich zakres; OpenClaw nie przełącza się awaryjnie na klucze nadrzędnych dostawców. |
| Wywołanie modelu kończy się niepowodzeniem po wykryciu | Sprawdź połączenie dostawcy i kondycję usługi nadrzędnej w ClawRouter, a następnie ponów próbę po przywróceniu stanu gotowości.          |
| Użycie zawiera sumy, ale nie wartość procentową | Zasady nie mają limitu; dodaj miesięczny budżet w ClawRouter, aby udostępnić okno procentowe.                                            |

## Zachowanie zabezpieczeń

- Wykrywanie katalogu jest ograniczone do skonfigurowanego klucza proxy i buforowane osobno dla każdego zakresu poświadczeń (katalogu agenta, katalogu obszaru roboczego, identyfikatora profilu uwierzytelniania i bazowego adresu URL).
- Klucz proxy jest dołączany wyłącznie podczas wysyłania żądania; nie jest przechowywany w metadanych modelu.
- Wartości automatycznego przypisania autorstwa i korelacji żądań są przed wysłaniem przycinane, a wartości zawierające znaki sterujące są odrzucane. Wartości przypisania autorstwa są ograniczone do 256 znaków, a identyfikatory żądań — do 128.
- Diagnostyka transportu modelu zawiera wyłącznie metadane i nigdy nie obejmuje klucza proxy ani treści modelu.
- Natywne identyfikatory modeli Anthropic i Gemini są zamieniane na ich identyfikatory nadrzędne wyłącznie podczas wysyłania żądania.
- Nieobsługiwane lub nieprzyznane pozycje katalogu są domyślnie odrzucane i nie można ich wybrać.

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Konfiguracja dostawcy i wybór modelu.
  </Card>
  <Card title="Śledzenie użycia" href="/pl/concepts/usage-tracking" icon="chart-line">
    Widoki użycia i stanu OpenClaw.
  </Card>
</CardGroup>
