---
read_when:
    - Chcesz używać lokalnych workflow ComfyUI z OpenClaw
    - Chcesz używać Comfy Cloud z workflow obrazów, wideo lub muzyki
    - Potrzebujesz kluczy konfiguracji wbudowanego pluginu Comfy
summary: Konfiguracja generowania obrazów, wideo i muzyki przez workflow ComfyUI w OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw dostarcza wbudowany plugin `comfy` do uruchamiania ComfyUI sterowanego workflow. Plugin jest w pełni sterowany przez workflow, więc OpenClaw nie próbuje mapować ogólnych ustawień `size`, `aspectRatio`, `resolution`, `durationSeconds` ani kontrolek w stylu TTS na Twój graf.

| Właściwość      | Szczegóły                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| Dostawca        | `comfy`                                                                          |
| Modele          | `comfy/workflow`                                                                 |
| Współdzielone powierzchnie | `image_generate`, `video_generate`, `music_generate`                  |
| Auth            | Brak dla lokalnego ComfyUI; `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` oraz Comfy Cloud `/api/*`               |

## Co jest obsługiwane

- Generowanie obrazów z workflow JSON
- Edycja obrazów z 1 przesłanym obrazem referencyjnym
- Generowanie wideo z workflow JSON
- Generowanie wideo z 1 przesłanym obrazem referencyjnym
- Generowanie muzyki lub audio przez współdzielone narzędzie `music_generate`
- Pobieranie wyjścia ze skonfigurowanego node albo ze wszystkich pasujących node wyjściowych

## Pierwsze kroki

Wybierz między uruchamianiem ComfyUI na własnej maszynie a używaniem Comfy Cloud.

<Tabs>
  <Tab title="Lokalnie">
    **Najlepsze do:** uruchamiania własnej instancji ComfyUI na swojej maszynie lub w sieci LAN.

    <Steps>
      <Step title="Uruchom ComfyUI lokalnie">
        Upewnij się, że lokalna instancja ComfyUI działa (domyślnie pod `http://127.0.0.1:8188`).
      </Step>
      <Step title="Przygotuj workflow JSON">
        Wyeksportuj lub utwórz plik workflow JSON ComfyUI. Zanotuj identyfikatory node dla node wejścia promptu i node wyjścia, z którego OpenClaw ma odczytywać dane.
      </Step>
      <Step title="Skonfiguruj dostawcę">
        Ustaw `mode: "local"` i wskaż plik workflow. Oto minimalny przykład dla obrazu:

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
      <Step title="Ustaw model domyślny">
        Skieruj OpenClaw na model `comfy/workflow` dla skonfigurowanej capability:

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
      <Step title="Zweryfikuj">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Najlepsze do:** uruchamiania workflow w Comfy Cloud bez zarządzania lokalnymi zasobami GPU.

    <Steps>
      <Step title="Pobierz klucz API">
        Zarejestruj się na [comfy.org](https://comfy.org) i wygeneruj klucz API w panelu swojego konta.
      </Step>
      <Step title="Ustaw klucz API">
        Przekaż klucz jedną z tych metod:

        ```bash
        # Zmienna środowiskowa (zalecane)
        export COMFY_API_KEY="your-key"

        # Alternatywna zmienna środowiskowa
        export COMFY_CLOUD_API_KEY="your-key"

        # Albo bezpośrednio w konfiguracji
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Przygotuj workflow JSON">
        Wyeksportuj lub utwórz plik workflow JSON ComfyUI. Zanotuj identyfikatory node dla node wejścia promptu i node wyjścia.
      </Step>
      <Step title="Skonfiguruj dostawcę">
        Ustaw `mode: "cloud"` i wskaż plik workflow:

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
        W trybie cloud `baseUrl` domyślnie ma wartość `https://cloud.comfy.org`. `baseUrl` trzeba ustawiać tylko wtedy, gdy używasz niestandardowego punktu końcowego chmury.
        </Tip>
      </Step>
      <Step title="Ustaw model domyślny">
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
      <Step title="Zweryfikuj">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja

Comfy obsługuje współdzielone ustawienia połączenia najwyższego poziomu oraz sekcje workflow dla poszczególnych capability (`image`, `video`, `music`):

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

### Współdzielone klucze

| Klucz                 | Typ                    | Opis                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` or `"cloud"` | Tryb połączenia.                                                                      |
| `baseUrl`             | string                 | Domyślnie `http://127.0.0.1:8188` lokalnie lub `https://cloud.comfy.org` w chmurze.  |
| `apiKey`              | string                 | Opcjonalny klucz w konfiguracji, alternatywa dla zmiennych środowiskowych `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Zezwala na prywatny/LAN `baseUrl` w trybie cloud.                                     |

### Klucze dla poszczególnych capability

Te klucze obowiązują w sekcjach `image`, `video` lub `music`:

| Klucz                        | Wymagane | Domyślnie | Opis                                                                         |
| ---------------------------- | -------- | --------- | ---------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | Tak      | --        | Ścieżka do pliku workflow JSON ComfyUI.                                      |
| `promptNodeId`               | Tak      | --        | Identyfikator node, który otrzymuje prompt tekstowy.                         |
| `promptInputName`            | Nie      | `"text"`  | Nazwa wejścia w node promptu.                                                |
| `outputNodeId`               | Nie      | --        | Identyfikator node, z którego odczytywane jest wyjście. Jeśli pominięty, używane są wszystkie pasujące node wyjściowe. |
| `pollIntervalMs`             | Nie      | --        | Interwał odpytywania w milisekundach dla zakończenia zadania.                |
| `timeoutMs`                  | Nie      | --        | Limit czasu w milisekundach dla uruchomienia workflow.                       |

Sekcje `image` i `video` obsługują także:

| Klucz                 | Wymagane                              | Domyślnie | Opis                                                    |
| --------------------- | ------------------------------------- | --------- | ------------------------------------------------------- |
| `inputImageNodeId`    | Tak (przy przekazywaniu obrazu referencyjnego) | --        | Identyfikator node, który otrzymuje przesłany obraz referencyjny. |
| `inputImageInputName` | Nie                                   | `"image"` | Nazwa wejścia w node obrazu.                            |

## Szczegóły workflow

<AccordionGroup>
  <Accordion title="Workflow obrazów">
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

    Aby włączyć edycję obrazu z przesłanym obrazem referencyjnym, dodaj `inputImageNodeId` do konfiguracji obrazu:

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

  <Accordion title="Workflow wideo">
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

    Workflow wideo Comfy obsługują text-to-video i image-to-video przez skonfigurowany graf.

    <Note>
    OpenClaw nie przekazuje wejściowych plików wideo do workflow Comfy. Jako wejście obsługiwane są tylko prompty tekstowe i pojedyncze obrazy referencyjne.
    </Note>

  </Accordion>

  <Accordion title="Workflow muzyki">
    Wbudowany plugin rejestruje dostawcę generowania muzyki dla wyjść audio lub muzyki zdefiniowanych przez workflow, udostępnianych przez współdzielone narzędzie `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Użyj sekcji konfiguracji `music`, aby wskazać workflow JSON audio i node wyjścia.

  </Accordion>

  <Accordion title="Zgodność wsteczna">
    Dotychczasowa konfiguracja obrazu najwyższego poziomu (bez zagnieżdżonej sekcji `image`) nadal działa:

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

    OpenClaw traktuje ten starszy kształt jako konfigurację workflow obrazu. Nie musisz migrować od razu, ale w nowych konfiguracjach zalecane są zagnieżdżone sekcje `image` / `video` / `music`.

    <Tip>
    Jeśli używasz tylko generowania obrazów, starsza płaska konfiguracja i nowa zagnieżdżona sekcja `image` są funkcjonalnie równoważne.
    </Tip>

  </Accordion>

  <Accordion title="Testy live">
    Dla wbudowanego pluginu istnieje opcjonalny zakres testów live:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Test live pomija poszczególne przypadki obrazów, wideo lub muzyki, chyba że skonfigurowano odpowiadającą sekcję workflow Comfy.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Konfiguracja i użycie narzędzia do generowania obrazów.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Konfiguracja i użycie narzędzia do generowania wideo.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Konfiguracja narzędzia do generowania muzyki i audio.
  </Card>
  <Card title="Katalog dostawców" href="/pl/providers/index" icon="layers">
    Przegląd wszystkich dostawców i odwołań do modeli.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień domyślnych agentów.
  </Card>
</CardGroup>
