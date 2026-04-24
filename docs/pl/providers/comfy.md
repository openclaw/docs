---
read_when:
    - Chcesz używać lokalnych workflow ComfyUI z OpenClaw.
    - Chcesz używać Comfy Cloud z workflow obrazów, wideo albo muzyki.
    - Potrzebujesz kluczy konfiguracji dołączonego Pluginu Comfy.
summary: Konfiguracja generowania obrazów, wideo i muzyki przez workflow ComfyUI w OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T09:27:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw dostarcza dołączony Plugin `comfy` do uruchamiania workflow ComfyUI. Plugin jest całkowicie oparty na workflow, więc OpenClaw nie próbuje mapować ogólnych kontrolek typu `size`, `aspectRatio`, `resolution`, `durationSeconds` ani kontrolek w stylu TTS na twój graf.

| Właściwość      | Szczegóły                                                                            |
| --------------- | ------------------------------------------------------------------------------------ |
| Dostawca        | `comfy`                                                                              |
| Modele          | `comfy/workflow`                                                                     |
| Współdzielone powierzchnie | `image_generate`, `video_generate`, `music_generate`                       |
| Auth            | Brak dla lokalnego ComfyUI; `COMFY_API_KEY` albo `COMFY_CLOUD_API_KEY` dla Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` oraz Comfy Cloud `/api/*`                  |

## Co obsługuje

- Generowanie obrazów z workflow JSON
- Edycję obrazów z 1 przesłanym obrazem referencyjnym
- Generowanie wideo z workflow JSON
- Generowanie wideo z 1 przesłanym obrazem referencyjnym
- Generowanie muzyki albo audio przez współdzielone narzędzie `music_generate`
- Pobieranie wyników z określonego node albo ze wszystkich pasujących node wyjściowych

## Pierwsze kroki

Wybierz między uruchamianiem ComfyUI na własnej maszynie a użyciem Comfy Cloud.

<Tabs>
  <Tab title="Lokalnie">
    **Najlepsze dla:** uruchamiania własnej instancji ComfyUI na twojej maszynie albo w LAN.

    <Steps>
      <Step title="Uruchom lokalnie ComfyUI">
        Upewnij się, że twoja lokalna instancja ComfyUI działa (domyślnie `http://127.0.0.1:8188`).
      </Step>
      <Step title="Przygotuj workflow JSON">
        Wyeksportuj albo utwórz plik workflow JSON ComfyUI. Zanotuj identyfikatory node dla node wejścia promptu i node wyjściowego, z którego OpenClaw ma odczytywać wynik.
      </Step>
      <Step title="Skonfiguruj dostawcę">
        Ustaw `mode: "local"` i wskaż plik workflow. Oto minimalny przykład dla obrazów:

        ```json5
        {
          models: {
            providers: {
              comfy: {
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
        }
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        Wskaż OpenClaw model `comfy/workflow` dla skonfigurowanej możliwości:

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
    **Najlepsze dla:** uruchamiania workflow w Comfy Cloud bez zarządzania lokalnymi zasobami GPU.

    <Steps>
      <Step title="Pobierz klucz API">
        Zarejestruj się na [comfy.org](https://comfy.org) i wygeneruj klucz API w panelu konta.
      </Step>
      <Step title="Ustaw klucz API">
        Podaj klucz jedną z tych metod:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Przygotuj workflow JSON">
        Wyeksportuj albo utwórz plik workflow JSON ComfyUI. Zanotuj identyfikatory node dla wejścia promptu i node wyjściowego.
      </Step>
      <Step title="Skonfiguruj dostawcę">
        Ustaw `mode: "cloud"` i wskaż plik workflow:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        W trybie cloud `baseUrl` domyślnie ma wartość `https://cloud.comfy.org`. `baseUrl` trzeba ustawiać tylko wtedy, gdy używasz niestandardowego endpointu cloud.
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

Comfy obsługuje współdzielone ustawienia połączenia najwyższego poziomu oraz sekcje workflow per możliwość (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
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
}
```

### Współdzielone klucze

| Klucz                 | Typ                    | Opis                                                                                     |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                | `"local"` albo `"cloud"` | Tryb połączenia.                                                                       |
| `baseUrl`             | string                 | Domyślnie `http://127.0.0.1:8188` dla local albo `https://cloud.comfy.org` dla cloud.  |
| `apiKey`              | string                 | Opcjonalny klucz inline, alternatywa dla zmiennych env `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Zezwala na prywatny/LAN `baseUrl` w trybie cloud.                                       |

### Klucze per możliwość

Te klucze mają zastosowanie wewnątrz sekcji `image`, `video` albo `music`:

| Klucz                        | Wymagany | Domyślnie | Opis                                                                       |
| ---------------------------- | -------- | --------- | -------------------------------------------------------------------------- |
| `workflow` albo `workflowPath` | Tak    | --        | Ścieżka do pliku workflow JSON ComfyUI.                                    |
| `promptNodeId`               | Tak      | --        | Identyfikator node, który otrzymuje prompt tekstowy.                       |
| `promptInputName`            | Nie      | `"text"`  | Nazwa wejścia na node promptu.                                             |
| `outputNodeId`               | Nie      | --        | Identyfikator node, z którego odczytywany jest wynik. Jeśli pominięty, używane są wszystkie pasujące node wyjściowe. |
| `pollIntervalMs`             | Nie      | --        | Interwał odpytywania w milisekundach dla zakończenia zadania.              |
| `timeoutMs`                  | Nie      | --        | Timeout w milisekundach dla wykonania workflow.                            |

Sekcje `image` i `video` obsługują także:

| Klucz                 | Wymagany                              | Domyślnie | Opis                                                     |
| --------------------- | ------------------------------------- | --------- | -------------------------------------------------------- |
| `inputImageNodeId`    | Tak (przy przekazywaniu obrazu referencyjnego) | -- | Identyfikator node, który otrzymuje przesłany obraz referencyjny. |
| `inputImageInputName` | Nie                                   | `"image"` | Nazwa wejścia na node obrazu.                           |

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
      models: {
        providers: {
          comfy: {
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
    OpenClaw nie przekazuje wejściowych plików wideo do workflow Comfy. Jako wejścia obsługiwane są tylko prompty tekstowe i pojedyncze obrazy referencyjne.
    </Note>

  </Accordion>

  <Accordion title="Workflow muzyki">
    Dołączony Plugin rejestruje dostawcę generowania muzyki dla wyjść audio albo muzyki zdefiniowanych przez workflow, udostępnianych przez współdzielone narzędzie `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Użyj sekcji konfiguracji `music`, aby wskazać workflow JSON audio i node wyjściowy.

  </Accordion>

  <Accordion title="Kompatybilność wsteczna">
    Istniejąca konfiguracja obrazu najwyższego poziomu (bez zagnieżdżonej sekcji `image`) nadal działa:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw traktuje ten starszy kształt jako konfigurację workflow obrazu. Nie musisz migrować od razu, ale zagnieżdżone sekcje `image` / `video` / `music` są zalecane dla nowych konfiguracji.

    <Tip>
    Jeśli używasz tylko generowania obrazów, starsza płaska konfiguracja i nowa zagnieżdżona sekcja `image` są funkcjonalnie równoważne.
    </Tip>

  </Accordion>

  <Accordion title="Testy live">
    Istnieje coverage live typu opt-in dla dołączonego Pluginu:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Test live pomija poszczególne przypadki obrazów, wideo albo muzyki, jeśli odpowiadająca sekcja workflow Comfy nie jest skonfigurowana.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Konfiguracja i użycie narzędzia generowania obrazów.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Konfiguracja i użycie narzędzia generowania wideo.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Konfiguracja narzędzia do generowania muzyki i audio.
  </Card>
  <Card title="Katalog dostawców" href="/pl/providers/index" icon="layers">
    Przegląd wszystkich dostawców i odwołań do modeli.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień domyślnych agenta.
  </Card>
</CardGroup>
