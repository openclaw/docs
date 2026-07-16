---
read_when:
    - Zmiana działania mechanizmu zastępczego modelu lub interfejsu wyboru
    - Debugowanie błędu „model jest niedozwolony” lub nieaktualnego mechanizmu awaryjnego domyślnego dostawcy
    - Praca nad scalaniem pliku models.json i obsługą sekretów
sidebarTitle: Models CLI
summary: Jak OpenClaw rozpoznaje odwołania do dostawców/modeli, klucze konfiguracji oraz polecenie czatu `/model`
title: CLI modeli
x-i18n:
    generated_at: "2026-07-16T18:15:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Przełączanie awaryjne modeli" href="/pl/concepts/model-failover">
    Rotacja profili uwierzytelniania, okresy oczekiwania i ich współdziałanie z modelami rezerwowymi.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers">
    Krótkie omówienie dostawców i przykłady.
  </Card>
  <Card title="Dokumentacja CLI modeli" href="/pl/cli/models">
    Pełna dokumentacja polecenia `openclaw models` i jego flag.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults">
    Klucze konfiguracji modeli, wartości domyślne i przykłady.
  </Card>
</CardGroup>

Odwołanie do modelu (`provider/model`) wybiera dostawcę i model, a nie niskopoziomowe
środowisko uruchomieniowe agenta. Gdy zasady środowiska uruchomieniowego nie są ustawione lub mają wartość `auto`, należące do dostawcy OpenAI
zasady trasowania mogą wybrać Codex wyłącznie dla dokładnej, oficjalnej trasy HTTPS Platform
Responses lub ChatGPT Responses bez nadpisania żądania przez autora; sam prefiks
`openai/*` nigdy nie wybiera Codex. Adaptery Completions, niestandardowe
punkty końcowe oraz zachowanie żądania określone przez autora pozostają w OpenClaw. Oficjalne
punkty końcowe HTTP przesyłające tekst jawny są odrzucane. Zobacz [Niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).

Odwołania subskrypcji Copilot (`github-copilot/*`) można jawnie włączyć do zewnętrznego
pluginu środowiska uruchomieniowego agenta GitHub Copilot, ale ta ścieżka zawsze jest jawna (nigdy
nie wybiera jej `auto`). Nadpisania środowiska uruchomieniowego należy ustawiać w zasadach dostawcy/modelu, a nie dla
całego agenta lub sesji. Wybór środowiska uruchomieniowego nie określa sposobu rozliczania:
poświadczenia klucza API OpenAI oraz subskrypcji ChatGPT/Codex pozostają odrębne. Zobacz
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) oraz
[Środowisko uruchomieniowe agenta GitHub Copilot](/pl/plugins/copilot).

## Kolejność wyboru

<Steps>
  <Step title="Model podstawowy">
    `agents.defaults.model.primary` (lub `agents.defaults.model` jako zwykły ciąg znaków).
  </Step>
  <Step title="Modele rezerwowe">
    `agents.defaults.model.fallbacks`, wypróbowywane kolejno.
  </Step>
  <Step title="Przełączanie awaryjne uwierzytelniania">
    Rotacja profili uwierzytelniania odbywa się w obrębie dostawcy, zanim OpenClaw przejdzie do następnego modelu rezerwowego.
  </Step>
</Steps>

Powiązane obszary konfiguracji modeli:

- `agents.defaults.models` to lista dozwolonych modeli i katalog modeli, z których może korzystać OpenClaw, wraz z aliasami. Wpisy `provider/*` pozwalają dopuścić wszystkie wykryte modele dostawcy bez wymieniania każdego z nich.
- `agents.defaults.utilityModel` to opcjonalny, tańszy model do krótkich zadań wewnętrznych, takich jak generowanie tytułów sesji panelu, tytułów wątków/tematów obsługiwanych kanałów oraz opisów postępu. Ustawienie `agents.list[].utilityModel` dla konkretnego agenta je nadpisuje. Gdy nie jest ustawione, OpenClaw używa zadeklarowanego przez podstawowego dostawcę domyślnego małego modelu, jeśli taki istnieje (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), a w przeciwnym razie podstawowego modelu agenta; ustawienie pustego ciągu znaków wyłącza trasowanie zadań pomocniczych. Zadania pomocnicze są osobnymi wywołaniami modelu i mogą wysyłać ograniczoną zawartość zadania do wybranego dostawcy modelu.
- `agents.defaults.imageModel` jest używany tylko wtedy, gdy model podstawowy nie może przyjmować obrazów.
- `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli nie jest ustawiony, narzędzie używa kolejno `imageModel`, a następnie ustalonego modelu sesji/modelu domyślnego.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` oraz `videoGenerationModel` obsługują współdzielone narzędzia generowania multimediów. Jeśli nie są ustawione, każde narzędzie ustala domyślnego dostawcę z dostępnym uwierzytelnianiem: najpierw bieżącego dostawcę domyślnego, a następnie pozostałych zarejestrowanych dostawców danej funkcji w kolejności identyfikatorów dostawców. Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby wyłączyć takie ustalanie między dostawcami, zachowując jawne modele rezerwowe.
- Ustawienie `agents.list[].model` dla konkretnego agenta (wraz z powiązaniami) nadpisuje `agents.defaults.model` — zobacz [Trasowanie wielu agentów](/pl/concepts/multi-agent).

Pełna dokumentacja kluczy, wartości domyślnych i przykłady JSON5: [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults).

## Źródło wyboru i rygor modeli rezerwowych

To samo ustawienie `provider/model` działa inaczej w zależności od źródła:

| Źródło                                                                  | Zachowanie                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skonfigurowana wartość domyślna (`agents.defaults.model.primary`, model podstawowy agenta) | Zwykły punkt początkowy; używa `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Automatyczny model rezerwowy                                            | Tymczasowy stan odzyskiwania zapisany jako `modelOverrideSource: "auto"`. OpenClaw okresowo ponownie sprawdza pierwotny model podstawowy, po odzyskaniu usuwa automatyczny wybór i jednokrotnie ogłasza przejście na model rezerwowy lub odzyskanie przy każdej zmianie stanu.                              |
| Wybór użytkownika w sesji                                               | Dokładny i rygorystyczny. `/model`, selektor modelu, `session_status(model=...)` oraz `sessions.patch` zapisują `modelOverrideSource: "user"`. Jeśli ten dostawca/model stanie się niedostępny, uruchomienie kończy się widocznym błędem zamiast przejścia do innego skonfigurowanego modelu. |
| Cron `--model` / ładunek `model`                                        | Model podstawowy dla zadania. Nadal używa skonfigurowanych modeli rezerwowych, chyba że zadanie dostarcza własny `fallbacks` w ładunku (`fallbacks: []` wymusza rygorystyczne uruchomienie).                                                                                                                    |

Pozostałe zasady wyboru:

- Zmiana `agents.defaults.model.primary` nie modyfikuje istniejących przypięć sesji. Jeśli stan wskazuje `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, uruchom `/model default`, aby usunąć przypięcie.
- Selektory domyślnego modelu i listy dozwolonych modeli w CLI respektują `models.mode: "replace"`, wyświetlając tylko `models.providers.*.models` zamiast pełnego wbudowanego katalogu.
- Selektor modelu w interfejsie Control UI pobiera z Gateway skonfigurowany widok modeli: `agents.defaults.models`, jeśli jest ustawione (w tym wpisy wieloznaczne `provider/*`), a w przeciwnym razie `models.providers.*.models` oraz dostawców z działającym uwierzytelnianiem. Pełny wbudowany katalog jest zarezerwowany dla jawnych widoków przeglądania (`models.list` z `view: "all"` lub `openclaw models list --all`).
- Interfejsy wykazu dostawców używają `models.list` z `view: "provider-config"`, aby wyświetlać pochodzące ze źródła wiersze `models.providers.*.models` bez stosowania list dozwolonych modeli selektora.

Pełny opis mechanizmu: [Przełączanie awaryjne modeli](/pl/concepts/model-failover).

## Szybkie zasady dotyczące modeli

- Jako model podstawowy ustaw najsilniejszy dostępny model najnowszej generacji.
- Używaj modeli rezerwowych do zadań wrażliwych na koszt lub opóźnienia oraz do mniej istotnych rozmów.
- W przypadku agentów korzystających z narzędzi lub niezaufanych danych wejściowych unikaj starszych lub słabszych klas modeli.

## Konfiguracja początkowa

```bash
openclaw onboard
```

Konfiguruje model i uwierzytelnianie dla popularnych dostawców bez ręcznego edytowania konfiguracji, w tym OAuth subskrypcji OpenAI Codex oraz Anthropic (klucz API lub ponowne użycie Claude CLI).

Jeśli nie skonfigurowano modelu podstawowego, nowa konfiguracja klucza API OpenAI wybiera
`openai/gpt-5.6`; sam identyfikator bezpośredniego API wskazuje klasę Sol. Nowa
konfiguracja OAuth ChatGPT/Codex wybiera dokładne odwołanie katalogowe `openai/gpt-5.6-sol`.
Ponowne uwierzytelnienie zachowuje istniejący jawnie ustawiony model podstawowy, w tym
`openai/gpt-5.5`. Jeśli GPT-5.6 jest niedostępny dla konta, należy jawnie wybrać
`openai/gpt-5.5`; OpenClaw nie obniża jego wersji automatycznie.

## „Model jest niedozwolony” (i dlaczego odpowiedzi przestają się pojawiać)

Jeśli ustawiono `agents.defaults.models`, staje się ono listą dozwolonych modeli dla `/model` i nadpisań sesji. Wybranie modelu spoza tej listy zwraca następujący komunikat, zanim zostanie wygenerowana zwykła odpowiedź:

```text
Model „provider/model” jest niedozwolony. Użyj /models, aby wyświetlić dostawców, lub /models <provider>, aby wyświetlić modele.
Dodaj go za pomocą: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Aby rozwiązać problem, dodaj model do `agents.defaults.models`, całkowicie usuń listę dozwolonych modeli (usuń klucz) lub wybierz model z `/model list`. Jeśli odrzucone polecenie zawierało nadpisanie środowiska uruchomieniowego, takie jak `/model openai/gpt-5.5 --runtime codex`, najpierw popraw listę dozwolonych modeli, a następnie ponów to samo polecenie `/model ... --runtime ...`.

W przypadku modeli lokalnych/GGUF lista dozwolonych modeli musi zawierać pełne odwołanie z prefiksem dostawcy, na przykład `ollama/gemma4:26b` lub `lmstudio/Gemma4-26b-a4-it-gguf` — dokładny ciąg można sprawdzić za pomocą `openclaw models list --provider <provider>`. Same nazwy plików lub nazwy wyświetlane nie wystarczą po włączeniu listy dozwolonych modeli.

Aby ograniczyć dostawców bez wymieniania każdego modelu, użyj wpisów wieloznacznych `provider/*`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models` oraz selektory modeli wyświetlają wtedy wykryty katalog wyłącznie dla tych dostawców, a nowe modele mogą pojawiać się bez edytowania listy dozwolonych modeli. Połącz dokładne wpisy `provider/model` z wpisami `provider/*`, aby uwzględnić jeden konkretny model innego dostawcy.

Przykładowa lista dozwolonych modeli z aliasami:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Bezpieczne edytowanie listy dozwolonych modeli z CLI">
Do zmian uzupełniających używaj `--merge`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` odrzuca przypisania zwykłych obiektów do `agents.defaults.models`, `models.providers` lub `models.providers.<id>.models`, jeśli spowodowałyby usunięcie istniejących wpisów; używaj `--replace` tylko wtedy, gdy nowa wartość ma stać się pełną wartością docelową. Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` już scalają wybory dotyczące dostawcy z listą dozwolonych modeli, więc dodanie dostawcy nie usuwa niepowiązanych wpisów; konfiguracja zachowuje istniejące `agents.defaults.model.primary`. Jawne polecenia, takie jak `openclaw models auth login --provider <id> --set-default` i `openclaw models set <model>`, nadal zastępują model podstawowy.
</Accordion>

## `/model` na czacie

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` i `/model list` wyświetlają kompaktowy numerowany selektor (rodzina modeli + dostępni dostawcy); `/model <#>` dokonuje z niego wyboru. W Discord otwiera to listy rozwijane dostawcy/modelu z krokiem Submit; w Telegram wybory w selektorze mają zakres sesji i nigdy nie nadpisują trwałej wartości domyślnej agenta w `openclaw.json`. `/models add` jest przestarzałe i zamiast rejestrować modele z czatu, zwraca komunikat.
- `/model` natychmiast utrwala nowy wybór sesji. Jeśli agent jest bezczynny, następne uruchomienie używa go od razu; jeśli uruchomienie jest już aktywne, przełączenie zostaje umieszczone w kolejce do następnego bezpiecznego punktu ponowienia (lub późniejszego, jeśli aktywność narzędzi albo generowanie odpowiedzi już się rozpoczęły).
- `/model default` usuwa wybór sesji, aby ponownie dziedziczyła skonfigurowany model podstawowy.
- Wybrane przez użytkownika odwołanie `/model` jest ściśle obowiązujące w tej sesji: jeśli stanie się nieosiągalne, odpowiedź zakończy się widocznym błędem zamiast niejawnie przechodzić przez `agents.defaults.model.fallbacks`. Skonfigurowane wartości domyślne i modele podstawowe zadań cron nadal korzystają z łańcuchów zastępczych.
- `/model status` to widok szczegółowy: kandydaci uwierzytelniania dla każdego dostawcy oraz — jeśli skonfigurowano — punkt końcowy dostawcy `baseUrl` i tryb `api`.
- Odwołania do modeli są analizowane przez podział przy pierwszym `/`; należy wpisać `provider/model`. Jeśli sam identyfikator modelu zawiera `/` (jak w OpenRouter), należy dodać prefiks dostawcy, np. `/model openrouter/moonshotai/kimi-k2`. Jeśli dostawca zostanie pominięty, OpenClaw próbuje kolejno: (1) dopasować alias, (2) znaleźć unikatowe dopasowanie skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu bez prefiksu, (3) użyć skonfigurowanego domyślnego dostawcy (przestarzały mechanizm zastępczy) — a jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, zamiast niego użyć pierwszej skonfigurowanej pary dostawca/model, aby nie ujawniać nieaktualnej wartości domyślnej po usuniętym dostawcy.
- Odwołania do modeli są normalizowane do małych liter; poza tym identyfikatory dostawców są rozróżniane dokładnie, dlatego należy użyć identyfikatora ogłaszanego przez plugin.

Pełne zachowanie poleceń i konfiguracja: [Polecenia z ukośnikiem](/pl/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` bez podpolecenia jest skrótem do `models status`, które wyświetla również czas wygaśnięcia OAuth dla profili magazynu uwierzytelniania (domyślnie ostrzega w ciągu 24h przed wygaśnięciem). Pełne flagi, struktury JSON i podpolecenia profili uwierzytelniania: [Dokumentacja CLI modeli](/pl/cli/models).

<AccordionGroup>
  <Accordion title="Skanowanie (bezpłatne modele OpenRouter)">
    `openclaw models scan` sprawdza publiczny katalog bezpłatnych modeli OpenRouter i może na żywo testować kandydatów pod kątem obsługi narzędzi i obrazów. Sam katalog jest publiczny, więc skanowanie wyłącznie metadanych (`--no-probe`) nie wymaga klucza; testowanie na żywo oraz `--set-default`/`--set-image` wymagają klucza API OpenRouter (profilu uwierzytelniania lub `OPENROUTER_API_KEY`), a bez niego bezpiecznie ograniczają wynik wyłącznie do metadanych.

    Wyniki są klasyfikowane kolejno według: obsługi obrazów, opóźnienia narzędzi, rozmiaru kontekstu i liczby parametrów. W TTY przetestowane wyniki wyświetlają interaktywny monit wyboru modelu zastępczego; tryb nieinteraktywny wymaga `--yes`, aby zaakceptować wartości domyślne.

  </Accordion>
</AccordionGroup>

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy skonfigurowani w `models.providers` są zapisywani do `models.json` w katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Katalogi pluginów dostawców są przechowywane osobno jako wygenerowane fragmenty katalogu należące do pluginów i wczytywane automatycznie. Domyślnie ten plik jest scalany z konfiguracją; ustaw `models.mode: "replace"`, aby używać wyłącznie skonfigurowanych dostawców.

<AccordionGroup>
  <Accordion title="Pierwszeństwo w trybie scalania">
    Dla zgodnych identyfikatorów dostawców:

    - Pierwszeństwo ma niepuste `baseUrl`, które już istnieje w pliku agenta `models.json`.
    - Niepuste `apiKey` w `models.json` ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
    - Wartości `apiKey` zarządzane przez SecretRef są odświeżane ze znaczników źródłowych zamiast utrwalania rozwiązanych sekretów: nazwą zmiennej środowiskowej dla odwołań do środowiska oraz `secretref-managed` dla odwołań do pliku/polecenia.
    - Wartości nagłówków zarządzane przez SecretRef są odświeżane w ten sam sposób, z użyciem `secretref-env:ENV_VAR_NAME` dla odwołań do środowiska.
    - Puste lub brakujące `apiKey`/`baseUrl` w `models.json` korzystają zastępczo z konfiguracji `models.providers`.
    - Pozostałe pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogowych.

  </Accordion>
</AccordionGroup>

Utrwalanie znaczników opiera się na autorytatywnym źródle: za każdym razem, gdy OpenClaw ponownie generuje `models.json` — w tym w ścieżkach uruchamianych poleceniami, takich jak `openclaw agent` — zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (sprzed rozwiązania), a nie rozwiązane wartości sekretów środowiska wykonawczego.

## Powiązane

- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) — OpenClaw, Codex i inne środowiska uruchomieniowe pętli agentów
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazów
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) — łańcuchy zastępcze
- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Dokumentacja CLI modeli](/pl/cli/models) — pełna dokumentacja poleceń i flag
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
