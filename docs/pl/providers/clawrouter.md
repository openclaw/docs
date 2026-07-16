---
read_when:
    - Chcesz używać jednego zarządzanego klucza dla wielu dostawców modeli
    - Potrzebne jest wykrywanie modeli ClawRouter lub raportowanie limitów w OpenClaw
summary: Kieruj modele objęte zakresem poświadczeń przez ClawRouter i wyświetlaj zarządzane limity przydziału
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T18:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter udostępnia OpenClaw jeden klucz o zakresie określonym przez zasady dla wielu nadrzędnych
dostawców modeli. Dołączony Plugin `clawrouter` wykrywa wyłącznie modele dozwolone
dla tego klucza, kieruje każdy model przez zadeklarowany dla niego protokół i raportuje
budżet klucza oraz łączne użycie w interfejsach użycia OpenClaw.

Poświadczenia nadrzędne i przekazywanie specyficzne dla dostawcy pozostają w ClawRouter, dlatego
nie trzeba instalować ani uwierzytelniać każdego Pluginu dostawcy nadrzędnego na hoście
OpenClaw. Plugin jest dołączony do OpenClaw (`enabledByDefault: true`);
potrzebne jest tylko wydane poświadczenie ClawRouter.

| Właściwość       | Wartość                                  |
| ------------- | ---------------------------------------- |
| Dostawca      | `clawrouter`                             |
| Plugin        | dołączony (zawarty w OpenClaw)           |
| Uwierzytelnianie | `CLAWROUTER_API_KEY`                     |
| Domyślny adres URL | `https://clawrouter.openclaw.ai`         |
| Katalog modeli | Ograniczony zakresem poświadczenia przez `/v1/catalog`      |
| Limity        | Miesięczny budżet i użycie przez `/v1/usage` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskanie poświadczenia o określonym zakresie">
    Należy poprosić administratora ClawRouter o poświadczenie, którego zasady obejmują
    dostawców, modele i miesięczny budżet przeznaczone do użycia. Poświadczenia są
    ujawniane jednokrotnie podczas wydawania.
  </Step>
  <Step title="Konfigurowanie OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` jest dołączony i domyślnie włączony. Jeśli konfiguracja ustawia
    `plugins.allow`, przed włączeniem należy dodać `clawrouter` do tej listy. W przypadku
    niestandardowego wdrożenia należy ustawić `models.providers.clawrouter.baseUrl` na źródło
    ClawRouter; wartość domyślna to `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Wyświetlanie przyznanych modeli">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Zwróconych odwołań do modeli należy używać dokładnie w pokazanej postaci. Zachowują one nadrzędną
    przestrzeń nazw, na przykład `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` lub
    `clawrouter/google/gemini-3.5-flash`. Jeśli `agents.defaults.models` jest listą dozwolonych
    w konfiguracji, należy dodać do niej każde wybrane odwołanie ClawRouter.

  </Step>
  <Step title="Wybieranie modelu">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Zwrócony model można również wybrać dla pojedynczego uruchomienia za pomocą
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Zarządzane wdrożenie nieinteraktywne

Klucz serwera proxy należy przechowywać w mechanizmie wstrzykiwania sekretów obciążenia, a w
`openclaw.json` zapisać wyłącznie SecretRef. Kanoniczne pola zarządzane to:

| Przeznaczenie | Pole konfiguracji lub środowiska                                          |
| ------------- | ------------------------------------------------------------------------ |
| Źródło routera | `models.providers.clawrouter.baseUrl`                                    |
| Poświadczenie | `models.providers.clawrouter.apiKey` -> środowiskowy SecretRef                    |
| Wartość sekretu | `CLAWROUTER_API_KEY` w środowisku procesu Gateway                  |
| Model domyślny | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Znacznik obciążenia | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcjonalnie) |

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

Jeśli wdrożenie ustawia `plugins.allow`, należy zachować istniejące wpisy i dodać
`clawrouter`. Walidację i zastosowanie bez interaktywnego kreatora wykonuje się następująco:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Przebieg próbny rozwiązuje SecretRef, ale nigdy nie wyświetla jego wartości. Aby przeprowadzić rotację
poświadczenia, należy zaktualizować zewnętrzny Secret dostarczający `CLAWROUTER_API_KEY` i
ponownie uruchomić obciążenie Gateway, aby zostało wczytane nowe środowisko procesu. Plik
konfiguracji i odwołanie do modelu nie ulegają zmianie.

W przypadku samodzielnego Gateway Docker zbudowanego ze źródeł ClawRouter jest już zawarty w
głównym środowisku uruchomieniowym. Należy wybrać tylko Plugin kanału wymagający oddzielnego pakowania,
na przykład `OPENCLAW_EXTENSIONS=clickclack`, `slack` lub `msteams`; zobacz
[obrazy zbudowane ze źródeł z wybranymi Pluginami](/pl/install/docker#source-built-images-with-selected-plugins).
Wdrożenia archiwalne lub urządzeniowe muszą pakować ten sam wdrożony kod źródłowy za pośrednictwem własnego
potoku artefaktów zamiast korzystać z obrazu OCI.

## Gotowość i weryfikacja na żywo

Te kontrole potwierdzają różne granice; nie należy zastępować jednej drugą:

```bash
# Tylko kondycja procesu ClawRouter; nie jest używane poświadczenie ani model nadrzędny.
curl -fsS https://clawrouter.internal.example/v1/health

# Tylko gotowość uruchomienia Gateway OpenClaw; nie jest wykonywane wywołanie modelu.
curl -fsS http://127.0.0.1:18789/readyz

# Wykrywanie katalogu ograniczone zakresem poświadczenia.
openclaw models list --all --provider clawrouter --json

# Minimalna rzeczywista próba inferencji przez skonfigurowanego dostawcę ClawRouter.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Test kanarkowy obciążenia wykorzystujący dokładne odwołanie do przyznanego modelu.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Odpowiedz dokładnie: CLAWROUTER_CANARY_OK" \
  --json
```

Należy użyć modelu zwróconego przez katalog o określonym zakresie zamiast bezrefleksyjnie kopiować model
z przykładu. Pomyślna odpowiedź `/readyz` oznacza, że Gateway może obsługiwać
żądania; nie potwierdza ona gotowości ClawRouter, jego poświadczenia ani dostawcy
nadrzędnego. Próba modelu i test kanarkowy agenta stanowią weryfikację inferencji.

W celu diagnostyki na żywo należy wykonać test kanarkowy i sprawdzić standardowe dzienniki Gateway.
Istniejąca diagnostyka transportu modelu obejmująca wyłącznie metadane emituje wiersze o następującej postaci:

```text
[model-fetch] uruchomienie provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] odpowiedź provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin wysyła ograniczone nagłówki `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` i
`X-ClawRouter-Session-Id`, gdy te identyfikatory są dostępne. Odwzorowuje również
diagnostyczny identyfikator `callId` (`<run-id>:model:<n>`) wywołania modelu na
`X-Request-ID`, dzięki czemu zdarzenie wywołania modelu OpenClaw można połączyć ze
ścieżką audytu ClawRouter obejmującą wyłącznie metadane. Wartości mieszczące się w limicie 128 znaków
dla identyfikatora żądania są identyczne. Dłuższe wartości zachowują sufiks `:model:<n>`
oraz deterministyczny skrót, dzięki czemu różne wywołania pozostają ograniczone i możliwe do powiązania. Statyczne metadane wdrożenia,
takie jak `X-ClawRouter-Project-Id`, można ustawić w mapie `headers`
dostawcy. Nagłówki atrybucji agenta i sesji zachowują oddzielny limit
256 znaków. Automatyczne identyfikatory żądań zawierające znaki spoza zestawu identyfikatorów ASCII
ClawRouter używają tej samej deterministycznej, ograniczonej postaci.
Jawnie skonfigurowane nagłówki, w tym dowolny wariant wielkości liter `X-Request-ID`, mają pierwszeństwo
przed wartościami automatycznymi. Diagnostyka transportu rejestruje metadane routingu i odpowiedzi;
nie rejestruje poświadczeń, identyfikatorów żądań, promptów ani ukończeń.
Własne zdarzenie audytu ClawRouter zawiera wybranego dostawcę nadrzędnego oraz
stan przechowywania treści.

## Wykrywanie modeli

`GET /v1/catalog` zwraca `{ providers: [...] }`, gdzie każdy wpis dostawcy
zawiera własne `models[]` (z identyfikatorem nadrzędnym, możliwościami i cenami) oraz
obsługiwane trasy żądań. OpenClaw nie dostarcza drugiej, stałej listy
modeli ClawRouter. Model katalogowy jest udostępniany jako model OpenClaw, gdy:

- zasady poświadczenia przyznają dostęp do jego dostawcy;
- model katalogowy deklaruje obsługiwaną możliwość LLM (`llm.responses`,
  `llm.chat`, `llm.messages` lub `llm.stream` z pasującą trasą
  strumieniowania); oraz
- dostawca udostępnia pasującą trasę dla jednego z poniższych transportów.

Dodanie modelu do obsługiwanego dostawcy ClawRouter nie wymaga wydania nowej wersji OpenClaw:
zostanie on wykryty przy następnym odświeżeniu katalogu (buforowanym przez 60 sekund dla każdego zakresu poświadczenia).
Model wymagający nowego protokołu transmisji wymaga najpierw obsługi przez Plugin.

## Protokoły i Pluginy dostawców

ClawRouter zarządza poświadczeniami nadrzędnymi; jego katalog informuje OpenClaw, którego
transportu użyć, więc nie trzeba instalować Pluginu uwierzytelniającego każdej firmy nadrzędnej.

| Możliwość/trasa katalogu                              | Transport OpenClaw     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (dostawca zgodny z OpenAI)             | `openai-responses`     |
| `llm.chat` (dostawca zgodny z OpenAI)                  | `openai-completions`   |
| `llm.messages` + trasa `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + strumieniowa trasa `google.generate_content` | `google-generative-ai` |

Plugin stosuje również odpowiednie zasady ponawiania i schematów narzędzi dla tych
rodzin (zgodność schematów narzędzi OpenAI/DeepSeek/Gemini/Perplexity; natywne
zasady ponawiania Anthropic i Google Gemini). Modele Perplexity otrzymują rygorystyczne
przekształcenie schematu: `patternProperties` i `additionalProperties` są usuwane, a
każdy schemat obiektu deklaruje `properties`, ponieważ Perplexity odrzuca schematy
narzędzi bez tych deklaracji. Dostawca katalogowy udostępniający wyłącznie
nieobsługiwany format żądań celowo nie jest udostępniany jako tekstowy model OpenClaw.
Takich dostawców należy normalizować w ClawRouter do jednego z obsługiwanych kontraktów
zamiast wysyłać niezgodny ładunek.

## Limity i użycie

Odpowiedź `/v1/usage` ClawRouter zasila standardowe interfejsy użycia dostawców
OpenClaw: sumy żądań, tokenów i wydatków oraz miesięczne okno budżetowe, gdy
klucz ma określony limit. Klucze bez limitu nadal pokazują łączne użycie bez
okna procentowego.

Wyszukiwanie limitu używa tego samego klucza o określonym zakresie co wykrywanie modeli. Nieudane
wyszukanie limitu nie blokuje wykonywania modelu.

Bieżący stan można sprawdzić za pomocą:

```bash
openclaw status --usage
openclaw models status
```

Ten sam stan dostawcy jest dostępny dla `/status` na czacie oraz w
interfejsie użycia OpenClaw. Budżet obejmuje całe zasady, dlatego żądania wykonane przez innego klienta używającego
tych samych zasad ClawRouter mogą zmienić pozostałą wartość procentową.

## Rozwiązywanie problemów

| Objaw                                    | Kontrola                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Brak modeli ClawRouter                   | Należy potwierdzić, że Plugin jest włączony i dozwolony przez `plugins.allow`, a następnie sprawdzić, czy poświadczenie jest aktywne i przyznaje dostęp do co najmniej jednego gotowego dostawcy. |
| Brakuje skonfigurowanego modelu ClawRouter | Należy sprawdzić jego możliwość `/v1/catalog` i obsługę tras. Nieobsługiwane kontrakty transportu są celowo odfiltrowywane.                 |
| `Unknown model: clawrouter/...`                       | Należy dodać dokładne odwołanie katalogowe do `agents.defaults.models`, gdy ta mapa konfiguracji jest używana jako lista dozwolonych.                 |
| `401` lub `403` z katalogu lub danych użycia | Należy ponownie wydać poświadczenie ClawRouter lub zmienić jego zakres; OpenClaw nie przełącza się awaryjnie na klucze dostawców nadrzędnych. |
| Wywołanie modelu kończy się niepowodzeniem po jego wykryciu | Należy sprawdzić połączenie z dostawcą i kondycję systemu nadrzędnego w ClawRouter, a następnie ponowić próbę po przywróceniu jego gotowości. |
| Użycie zawiera sumy, ale nie wartość procentową | Zasady nie mają limitu; należy dodać miesięczny budżet w ClawRouter, aby udostępnić okno procentowe.                                      |

## Zachowanie zabezpieczeń

- Wykrywanie katalogu jest ograniczone do skonfigurowanego klucza serwera proxy i buforowane osobno dla każdego zakresu poświadczeń (katalog agenta, katalog obszaru roboczego, identyfikator profilu uwierzytelniania i bazowy adres URL).
- Klucz serwera proxy jest dołączany dopiero podczas wysyłania żądania; nie jest przechowywany w metadanych modelu.
- Wartości automatycznego przypisania i korelacji żądań są przed wysłaniem przycinane, a wartości zawierające znaki sterujące — odrzucane. Wartości przypisania są ograniczone do 256 znaków, a identyfikatory żądań — do 128.
- Dane diagnostyczne transportu modelu zawierają wyłącznie metadane i nigdy nie obejmują klucza serwera proxy ani treści modelu.
- Natywne identyfikatory modeli Anthropic i Gemini są zastępowane identyfikatorami systemów nadrzędnych dopiero podczas wysyłania.
- Nieobsługiwane lub nieprzyznane pozycje katalogu są domyślnie odrzucane i nie można ich wybrać.

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Konfiguracja dostawców i wybór modelu.
  </Card>
  <Card title="Śledzenie użycia" href="/pl/concepts/usage-tracking" icon="chart-line">
    Interfejsy OpenClaw dotyczące użycia i stanu.
  </Card>
</CardGroup>
