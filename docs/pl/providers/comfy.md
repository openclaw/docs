---
read_when:
    - Chcesz używać lokalnych przepływów pracy ComfyUI z OpenClaw
    - Chcesz używać Comfy Cloud z przepływami pracy dotyczącymi obrazów, wideo lub muzyki
    - Potrzebujesz kluczy konfiguracji dołączonego pluginu comfy
summary: Konfiguracja generowania obrazów, filmów i muzyki za pomocą przepływów pracy ComfyUI w OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T15:31:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw zawiera wbudowany plugin `comfy` do uruchamiania ComfyUI sterowanego przepływami pracy. Plugin jest w pełni sterowany przepływem pracy: OpenClaw nie odwzorowuje ogólnych parametrów `size`, `aspectRatio`, `resolution`, `durationSeconds` ani kontrolek typowych dla TTS na graf użytkownika.

| Właściwość       | Szczegóły                                                                        |
| ---------------- | -------------------------------------------------------------------------------- |
| Dostawca         | `comfy`                                                                          |
| Model            | `comfy/workflow`                                                                 |
| Narzędzia wspólne | `image_generate`, `video_generate`, `music_generate`                             |
| Uwierzytelnianie | Brak dla lokalnego ComfyUI; `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                   |

## Obsługiwane funkcje

- Generowanie i edycja obrazów na podstawie przepływu pracy JSON (edycja przyjmuje 1 przesłany obraz referencyjny)
- Generowanie wideo na podstawie przepływu pracy JSON, z tekstu lub obrazu (1 obraz referencyjny)
- Generowanie muzyki/dźwięku za pomocą wspólnego narzędzia `music_generate`, opcjonalnie z 1 obrazem referencyjnym
- Pobieranie wyniku ze skonfigurowanego Node lub ze wszystkich pasujących wyjściowych Node, gdy żaden nie został skonfigurowany

## Pierwsze kroki

Wybierz między uruchamianiem ComfyUI na własnym komputerze a korzystaniem z Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Najlepsze zastosowanie:** uruchamianie własnej instancji ComfyUI na komputerze lub w sieci LAN.

    <Steps>
      <Step title="Start ComfyUI locally">
        Upewnij się, że lokalna instancja ComfyUI jest uruchomiona (domyślnie pod adresem `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare your workflow JSON">
        Wyeksportuj lub utwórz plik JSON przepływu pracy ComfyUI. Zanotuj identyfikatory Node wejścia promptu oraz wyjściowego Node, z którego OpenClaw ma odczytywać dane.
      </Step>
      <Step title="Configure the provider">
        Ustaw `mode: "local"` i wskaż plik przepływu pracy. Minimalny przykład dla obrazu:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Set the default model">
        Skieruj OpenClaw do modelu `comfy/workflow` dla skonfigurowanej możliwości:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Najlepsze zastosowanie:** uruchamianie przepływów pracy w Comfy Cloud bez zarządzania lokalnymi zasobami GPU.

    <Steps>
      <Step title="Get an API key">
        Zarejestruj się w serwisie [comfy.org](https://comfy.org) i wygeneruj klucz API w panelu swojego konta.
      </Step>
      <Step title="Set the API key">
        Podaj klucz jedną z poniższych metod:

        ```bash
        # Flaga wdrażania
        openclaw onboard --comfy-api-key "your-key"

        # Zmienna środowiskowa (preferowana dla demonów)
        export COMFY_API_KEY="your-key"

        # Alternatywna zmienna środowiskowa
        export COMFY_CLOUD_API_KEY="your-key"

        # Lub bezpośrednio w konfiguracji
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare your workflow JSON">
        Wyeksportuj lub utwórz plik JSON przepływu pracy ComfyUI. Zanotuj identyfikatory Node wejścia promptu oraz wyjściowego Node.
      </Step>
      <Step title="Configure the provider">
        Ustaw `mode: "cloud"` i wskaż plik przepływu pracy:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        W trybie chmurowym `baseUrl` ma domyślnie wartość `https://cloud.comfy.org`. Ustaw `baseUrl` tylko dla niestandardowego punktu końcowego w chmurze.
        </Tip>
      </Step>
      <Step title="Set the default model">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja

Comfy obsługuje wspólne ustawienia połączenia najwyższego poziomu oraz sekcje przepływu pracy dla poszczególnych możliwości (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Klucze wspólne

| Klucz                 | Typ                    | Opis                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` lub `"cloud"` | Tryb połączenia. Wartość domyślna to `"local"`.                                      |
| `baseUrl`             | ciąg znaków            | Wartość domyślna to `http://127.0.0.1:8188` lokalnie lub `https://cloud.comfy.org` w chmurze. |
| `apiKey`              | ciąg znaków            | Opcjonalny klucz podany bezpośrednio, stanowiący alternatywę dla zmiennych środowiskowych `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | wartość logiczna       | Zezwala na prywatny/sieciowy `baseUrl` w trybie chmurowym lub lokalną nazwę FQDN w prywatnym DNS. |

<Note>
W trybie `local` literały adresów IP local loopback/prywatnych oraz jednoczłonowe nazwy usług, takie jak `http://comfyui:8188`, działają bez `allowPrivateNetwork`. Wyglądające na publiczne nazwy FQDN w prywatnym DNS, takie jak `https://comfy.local.example.com`, wymagają `allowPrivateNetwork: true`. Zaufanie do prywatnego źródła pozostaje ograniczone do skonfigurowanego schematu, nazwy hosta i portu; lokalne przekierowania nie mogą opuścić skonfigurowanej nazwy hosta, natomiast przekierowania z chmury do publicznych sieci CDN są sprawdzane zgodnie z domyślnymi zasadami SSRF.
</Note>

### Klucze poszczególnych możliwości

Te klucze mają zastosowanie wewnątrz sekcji `image`, `video` lub `music`:

| Klucz                        | Wymagany | Domyślnie | Opis                                                                         |
| ---------------------------- | -------- | --------- | ---------------------------------------------------------------------------- |
| `workflow` lub `workflowPath` | Tak     | --        | Przepływ pracy JSON podany bezpośrednio lub ścieżka do pliku JSON przepływu pracy ComfyUI. |
| `promptNodeId`               | Tak      | --        | Identyfikator Node, który otrzymuje prompt tekstowy.                         |
| `promptInputName`            | Nie      | `"text"`  | Nazwa wejścia w Node promptu.                                                |
| `outputNodeId`               | Nie      | --        | Identyfikator Node, z którego odczytywany jest wynik. Jeśli go pominięto, używane są wszystkie pasujące wyjściowe Node. |
| `pollIntervalMs`             | Nie      | `1500`    | Interwał odpytywania w milisekundach w oczekiwaniu na ukończenie zadania.    |
| `timeoutMs`                  | Nie      | `300000`  | Limit czasu uruchomienia przepływu pracy w milisekundach.                    |

Sekcje `image` i `video` obsługują również wejściowy Node obrazu referencyjnego:

| Klucz                 | Wymagany                                         | Domyślnie | Opis                                                  |
| --------------------- | ------------------------------------------------ | --------- | ----------------------------------------------------- |
| `inputImageNodeId`    | Tak (podczas przekazywania obrazu referencyjnego) | --       | Identyfikator Node, który otrzymuje przesłany obraz referencyjny. |
| `inputImageInputName` | Nie                                              | `"image"` | Nazwa wejścia w Node obrazu.                         |

`apiKey` przyjmuje literał ciągu znaków albo obiekt [odwołania do sekretu](/pl/gateway/configuration-reference#secrets).

## Szczegóły przepływu pracy

<AccordionGroup>
  <Accordion title="Image workflows">
    Ustaw domyślny model obrazu na `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Przykład edycji z obrazem referencyjnym:**

    Aby włączyć edycję obrazów przy użyciu przesłanego obrazu referencyjnego, dodaj `inputImageNodeId` do konfiguracji obrazu:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
    Ustaw domyślny model wideo na `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Przepływy pracy wideo Comfy obsługują generowanie wideo z tekstu i obrazu za pośrednictwem skonfigurowanego grafu.

    <Note>
    OpenClaw nie przekazuje wejściowych plików wideo do przepływów pracy Comfy. Jako dane wejściowe obsługiwane są wyłącznie prompty tekstowe i pojedyncze obrazy referencyjne.
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    Wbudowany plugin rejestruje dostawcę generowania muzyki dla wyników dźwiękowych lub muzycznych zdefiniowanych przez przepływ pracy, udostępnianego za pomocą wspólnego narzędzia `music_generate`. Przyjmuje ono opcjonalny obraz referencyjny (maksymalnie 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Użyj sekcji konfiguracji `music`, aby wskazać plik JSON przepływu pracy dźwięku oraz wyjściowy Node.

  </Accordion>

  <Accordion title="Backward compatibility">
    Istniejąca konfiguracja obrazu najwyższego poziomu (bez zagnieżdżonej sekcji `image`) nadal działa:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw traktuje ten starszy kształt jako konfigurację przepływu pracy obrazu. Nie musisz przeprowadzać migracji natychmiast, ale zagnieżdżone sekcje `image` / `video` / `music` są zalecane dla nowych konfiguracji. Jeśli używasz wyłącznie generowania obrazów, starsza płaska konfiguracja i nowa zagnieżdżona sekcja `image` są funkcjonalnie równoważne.

  </Accordion>

  <Accordion title="Live tests">
    Dla wbudowanego pluginu dostępne są opcjonalne testy na żywo:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Test na żywo pomija poszczególne przypadki obrazów, filmów lub muzyki, chyba że skonfigurowano odpowiednią sekcję przepływu pracy Comfy.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Konfiguracja i użycie narzędzia do generowania obrazów.
  </Card>
  <Card title="Generowanie filmów" href="/pl/tools/video-generation" icon="video">
    Konfiguracja i użycie narzędzia do generowania filmów.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Konfiguracja narzędzia do generowania muzyki i dźwięku.
  </Card>
  <Card title="Katalog dostawców" href="/pl/providers/index" icon="layers">
    Przegląd wszystkich dostawców i odwołań do modeli.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień domyślnych agentów.
  </Card>
</CardGroup>
