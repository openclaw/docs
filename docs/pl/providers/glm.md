---
read_when:
    - Chcesz używać modeli GLM w OpenClaw
    - Potrzebujesz konwencji nazewnictwa modeli i konfiguracji
summary: Omówienie rodziny modeli GLM i sposób jej używania w OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:26:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM to rodzina modeli (nie firma) dostępna przez platformę [Z.AI](https://z.ai). W OpenClaw modele GLM są dostępne przez dołączonego dostawcę `zai` z odwołaniami takimi jak `zai/glm-5.1`.

| Właściwość          | Wartość                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| Identyfikator dostawcy | `zai`                                                                    |
| Plugin              | dołączony, `enabledByDefault: true`                                         |
| Zmienne środowiskowe uwierzytelniania | `ZAI_API_KEY` lub `Z_AI_API_KEY`                         |
| Opcje onboardingu   | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | zgodne z OpenAI                                                             |
| Domyślny bazowy URL | `https://api.z.ai/api/paas/v4`                                              |
| Sugerowana wartość domyślna | `zai/glm-5.1`                                                       |
| Domyślny model obrazu | `zai/glm-4.6v`                                                            |

## Pierwsze kroki

<Steps>
  <Step title="Wybierz trasę uwierzytelniania i uruchom onboarding">
    Wybierz opcję onboardingu zgodną z Twoim planem Z.AI i regionem. Ogólna opcja `zai-api-key` automatycznie wykrywa pasujący punkt końcowy na podstawie kształtu klucza; użyj jawnych opcji regionalnych, gdy chcesz wymusić konkretny Coding Plan lub ogólną powierzchnię API.

    | Opcja uwierzytelniania | Najlepsze dla                                      |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Ogólny klucz API z automatycznym wykrywaniem punktu końcowego |
    | `zai-coding-global` | Użytkownicy Coding Plan (globalnie)                 |
    | `zai-coding-cn`     | Użytkownicy Coding Plan (region Chin)               |
    | `zai-global`        | Ogólne API (globalnie)                              |
    | `zai-cn`            | Ogólne API (region Chin)                            |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Ustaw GLM jako domyślny model">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Przykład konfiguracji

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` pozwala OpenClaw wykryć pasujący punkt końcowy Z.AI na podstawie kształtu klucza i automatycznie zastosować właściwy bazowy URL. Użyj jawnych opcji regionalnych, gdy chcesz przypiąć konkretny Coding Plan lub ogólną powierzchnię API.
</Tip>

## Wbudowany katalog

Dołączony dostawca `zai` inicjuje 13 odwołań do modeli GLM. Wszystkie wpisy obsługują rozumowanie, chyba że zaznaczono inaczej; `glm-5v-turbo` i `glm-4.6v` akceptują dane wejściowe obrazu oraz tekst.

| Odwołanie do modelu  | Uwagi                                             |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Model domyślny. Rozumowanie, tylko tekst, kontekst 202k. |
| `zai/glm-5`          | Rozumowanie, tylko tekst, kontekst 202k.           |
| `zai/glm-5-turbo`    | Rozumowanie, tylko tekst, kontekst 202k.           |
| `zai/glm-5v-turbo`   | Rozumowanie, tekst + obraz, kontekst 202k.         |
| `zai/glm-4.7`        | Rozumowanie, tylko tekst, kontekst 204k.           |
| `zai/glm-4.7-flash`  | Rozumowanie, tylko tekst, kontekst 200k.           |
| `zai/glm-4.7-flashx` | Rozumowanie, tylko tekst.                          |
| `zai/glm-4.6`        | Rozumowanie, tylko tekst.                          |
| `zai/glm-4.6v`       | Rozumowanie, tekst + obraz. Domyślny model obrazu. |
| `zai/glm-4.5`        | Rozumowanie, tylko tekst.                          |
| `zai/glm-4.5-air`    | Rozumowanie, tylko tekst.                          |
| `zai/glm-4.5-flash`  | Rozumowanie, tylko tekst.                          |
| `zai/glm-4.5v`       | Rozumowanie, tekst + obraz.                        |

<Note>
  Wersje i dostępność GLM mogą się zmieniać. Uruchom `openclaw models list --provider zai`, aby zobaczyć wiersze katalogu znane Twojej zainstalowanej wersji, i sprawdź dokumentację Z.AI pod kątem nowo dodanych lub wycofanych modeli.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Automatyczne wykrywanie punktu końcowego">
    Gdy używasz opcji uwierzytelniania `zai-api-key`, OpenClaw sprawdza kształt klucza, aby określić właściwy bazowy URL Z.AI. Jawne opcje regionalne (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) zastępują automatyczne wykrywanie i bezpośrednio przypinają punkt końcowy.
  </Accordion>

  <Accordion title="Szczegóły dostawcy">
    Modele GLM są obsługiwane przez dostawcę runtime `zai`. Pełną konfigurację dostawcy, regionalne punkty końcowe i dodatkowe możliwości znajdziesz na [stronie dostawcy Z.AI](/pl/providers/zai).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawca Z.AI" href="/pl/providers/zai" icon="server">
    Pełna konfiguracja dostawcy Z.AI i regionalne punkty końcowe.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołania do modeli i zachowanie przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy `/think` dla rodziny GLM obsługującej rozumowanie.
  </Card>
  <Card title="FAQ modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile uwierzytelniania, przełączanie modeli i rozwiązywanie błędów „no profile”.
  </Card>
</CardGroup>
