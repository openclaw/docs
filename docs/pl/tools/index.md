---
doc-schema-version: 1
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Decydujesz między wbudowanymi narzędziami, Skills i pluginami
    - Potrzebujesz właściwego punktu wejścia do dokumentacji dotyczącej zasad narzędzi, automatyzacji lub koordynacji agentów
summary: 'Przegląd narzędzi, Skills i pluginów OpenClaw: co mogą wywoływać agenci i jak je rozszerzać'
title: Przegląd
x-i18n:
    generated_at: "2026-05-12T01:00:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Użyj tej strony, aby wybrać właściwą powierzchnię Capabilities. **Narzędzia** to wywoływalne działania, **Skills** uczą agentów, jak pracować, a **pluginy** dodają możliwości środowiska wykonawczego, takie jak narzędzia, dostawcy, kanały, hooki i spakowane Skills.

To jest strona przeglądowa i kierująca. Pełną politykę narzędzi, wartości domyślne, przynależność do grup, ograniczenia dostawców i pola konfiguracji znajdziesz w
[Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Zacznij tutaj

W przypadku większości agentów zacznij od wbudowanych kategorii narzędzi, a następnie dostosuj politykę tylko wtedy, gdy agent powinien widzieć mniej narzędzi lub potrzebuje jawnego dostępu do hosta.

| Jeśli musisz...                                      | Najpierw użyj                                      | Następnie przeczytaj                                                               |
| ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Pozwolić agentowi działać z istniejącymi możliwościami | [Wbudowane narzędzia](#built-in-tool-categories)   | [Kategorie narzędzi](#built-in-tool-categories)                                    |
| Kontrolować, co agent może wywoływać                 | [Polityka narzędzi](#configure-access-and-approvals) | [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools)                     |
| Nauczyć agenta przepływu pracy                       | [Skills](#choose-tools-skills-or-plugins)          | [Skills](/pl/tools/skills) i [Tworzenie Skills](/pl/tools/creating-skills)              |
| Dodać nową integrację lub powierzchnię wykonawczą    | [Pluginy](#extend-capabilities)                    | [Pluginy](/pl/tools/plugin) i [Budowanie pluginów](/pl/plugins/building-plugins)        |
| Uruchomić pracę później lub w tle                    | [Automatyzacja](/pl/automation)                       | [Przegląd automatyzacji](/pl/automation)                                             |
| Koordynować wielu agentów lub harnessy               | [Podagenci](/pl/tools/subagents)                      | [Agenci ACP](/pl/tools/acp-agents) i [Wysyłanie agenta](/pl/tools/agent-send)           |
| Przeszukać duży katalog narzędzi PI                  | [Wyszukiwanie narzędzi](/pl/tools/tool-search)        | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                                       |

## Wybierz narzędzia, Skills albo pluginy

<Steps>
  <Step title="Użyj narzędzia, gdy agent musi działać">
    Narzędzie to typowana funkcja, którą agent może wywołać, na przykład `exec`, `browser`,
    `web_search`, `message` lub `image_generate`. Używaj narzędzi, gdy agent
    musi odczytać dane, zmienić pliki, wysłać wiadomości, wywołać dostawcę lub obsłużyć
    inny system. Widoczne narzędzia są wysyłane do modelu jako ustrukturyzowane definicje funkcji.

    Model widzi tylko narzędzia, które przejdą przez aktywny profil, politykę allow/deny,
    ograniczenia dostawcy, stan sandboxa, uprawnienia kanału i dostępność
    pluginów.

  </Step>

  <Step title="Użyj Skills, gdy agent potrzebuje instrukcji">
    Skill to pakiet instrukcji `SKILL.md` ładowany do promptu agenta. Użyj
    Skill, gdy agent ma już potrzebne narzędzia, ale potrzebuje powtarzalnego
    przepływu pracy, rubryki przeglądu, sekwencji poleceń albo ograniczenia operacyjnego.

    Skills mogą znajdować się w obszarze roboczym, współdzielonym katalogu Skills, zarządzanym katalogu głównym OpenClaw
    Skills albo pakiecie pluginu.

    [Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills) | [Konfiguracja Skills](/pl/tools/skills-config)

  </Step>

  <Step title="Użyj pluginu, gdy OpenClaw potrzebuje nowej możliwości">
    Plugin może dodać narzędzia, Skills, kanały, dostawców modeli, mowę, głos w czasie rzeczywistym,
    generowanie mediów, wyszukiwanie w sieci, pobieranie z sieci, hooki i inne możliwości
    środowiska wykonawczego. Użyj pluginu, gdy dana możliwość ma kod, poświadczenia,
    hooki cyklu życia, metadane manifestu albo instalowalne pakowanie. Istniejące
    pluginy można instalować z ClawHub, npm, git, katalogów lokalnych albo
    archiwów.

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Budowanie pluginów](/pl/plugins/building-plugins) | [Plugin SDK](/pl/plugins/sdk-overview)

  </Step>
</Steps>

## Wbudowane kategorie narzędzi

Tabela zawiera reprezentatywne narzędzia, aby ułatwić rozpoznanie powierzchni. Nie jest
pełną referencją polityki. Dokładne grupy, wartości domyślne oraz semantykę allow/deny
znajdziesz w [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

| Kategoria              | Użyj, gdy agent musi...                                                    | Reprezentatywne narzędzia                                            | Przeczytaj dalej                                                       |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Środowisko wykonawcze  | Uruchamiać polecenia, zarządzać procesami albo używać analizy Python opartej na dostawcy | `exec`, `process`, `code_execution`                                  | [Exec](/pl/tools/exec), [Wykonywanie kodu](/pl/tools/code-execution)         |
| Pliki                  | Odczytywać i zmieniać pliki obszaru roboczego                              | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/pl/tools/apply-patch)                                      |
| Sieć                   | Przeszukiwać sieć, przeszukiwać posty X albo pobierać czytelną treść stron | `web_search`, `x_search`, `web_fetch`                                | [Narzędzia sieciowe](/pl/tools/web), [Pobieranie z sieci](/pl/tools/web-fetch) |
| Przeglądarka           | Obsługiwać sesję przeglądarki                                              | `browser`                                                            | [Przeglądarka](/pl/tools/browser)                                         |
| Wiadomości i kanały    | Wysyłać odpowiedzi lub działania kanału                                    | `message`                                                            | [Wysyłanie agenta](/pl/tools/agent-send)                                  |
| Sesje i agenci         | Sprawdzać sesje, delegować pracę, sterować innym uruchomieniem albo raportować status | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Podagenci](/pl/tools/subagents), [Narzędzie sesji](/pl/concepts/session-tool) |
| Automatyzacja          | Planować pracę albo odpowiadać na zdarzenia w tle                          | `cron`, `heartbeat_respond`                                          | [Automatyzacja](/pl/automation)                                           |
| Gateway i węzły        | Sprawdzać stan Gateway albo sparowane urządzenia docelowe                  | `gateway`, `nodes`                                                   | [Konfiguracja Gateway](/pl/gateway/configuration), [Węzły](/pl/nodes)        |
| Media                  | Analizować, generować albo odtwarzać głosowo media                         | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Przegląd mediów](/pl/tools/media-overview)                               |
| Duże katalogi PI       | Wyszukiwać i wywoływać wiele kwalifikujących się narzędzi bez wysyłania każdego schematu do modelu | `tool_search_code`, `tool_search`, `tool_describe`                   | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                            |

<Note>
Wyszukiwanie narzędzi to eksperymentalna powierzchnia agentów PI. Uruchomienia harnessa Codex używają
natywnego trybu kodu Codex, natywnego wyszukiwania narzędzi, odroczonych narzędzi dynamicznych i zagnieżdżonych
wywołań narzędzi zamiast `tools.toolSearch`.
</Note>

## Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Autorzy pluginów podłączają narzędzia przez
`api.registerTool(...)` i `contracts.tools` manifestu; szczegóły kontraktu znajdziesz w
[Plugin SDK](/pl/plugins/sdk-overview) i [Manifeście pluginu](/pl/plugins/manifest).

Typowe narzędzia dostarczane przez pluginy obejmują:

- [Diffy](/pl/tools/diffs) do renderowania różnic plików i markdown
- [Zadanie LLM](/pl/tools/llm-task) do kroków przepływu pracy wyłącznie w JSON
- [Lobster](/pl/tools/lobster) do typowanych przepływów pracy ze wznawialnymi zatwierdzeniami
- [Tokenjuice](/pl/tools/tokenjuice) do kompaktowania zaszumionych danych wyjściowych narzędzi `exec` i `bash`
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) do odkrywania i wywoływania dużych katalogów narzędzi bez umieszczania każdego schematu w prompcie
- [Canvas](/pl/plugins/reference/canvas) do sterowania node Canvas i renderowania A2UI

## Skonfiguruj dostęp i zatwierdzenia

Polityka narzędzi jest egzekwowana przed wywołaniem modelu. Jeśli polityka usunie narzędzie, model nie otrzyma schematu tego narzędzia w danej turze. Uruchomienie może utracić narzędzia z powodu konfiguracji globalnej, konfiguracji per agent, polityki kanału, ograniczeń dostawcy, reguł sandboxa, bramkowania tylko dla właściciela albo dostępności pluginu.

- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) dokumentuje profile narzędzi,
  listy allow/deny, ograniczenia specyficzne dla dostawcy, wykrywanie pętli i
  ustawienia narzędzi opartych na dostawcy.
- [Zatwierdzenia exec](/pl/tools/exec-approvals) dokumentuje politykę zatwierdzania poleceń hosta.
- [Podwyższony exec](/pl/tools/elevated) dokumentuje kontrolowane wykonywanie poza
  sandboxem.
- [Sandbox vs polityka narzędzi vs podwyższenie](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) wyjaśnia, która warstwa kontroluje dostęp do plików i procesów.
- [Ograniczenia sandboxa i narzędzi per agent](/pl/tools/multi-agent-sandbox-tools)
  dokumentuje ograniczenia specyficzne dla agentów w uruchomieniach delegowanych.

## Rozszerz możliwości

Wybierz ścieżkę rozszerzenia według zadania, które OpenClaw ma wykonać:

- Zainstaluj istniejący plugin lub zarządzaj nim za pomocą [Pluginy](/pl/tools/plugin).
- Zbuduj nową integrację, dostawcę, kanał, narzędzie albo hook za pomocą
  [Budowanie pluginów](/pl/plugins/building-plugins).
- Dodaj lub dostrój wielokrotnego użytku instrukcje agenta za pomocą [Skills](/pl/tools/skills) i
  [Tworzenie Skills](/pl/tools/creating-skills).
- Pakuj materiały przepływu pracy wielokrotnego użytku za pomocą
  [Warsztat Skill](/pl/plugins/skill-workshop), gdy przepływ pracy należy do pakietu Skills dystrybuowanego przez plugin.
- Użyj [Plugin SDK](/pl/plugins/sdk-overview) i [Manifestu pluginu](/pl/plugins/manifest), gdy potrzebujesz kontraktów implementacyjnych.

## Rozwiązywanie problemów z brakującymi narzędziami

Jeśli model nie widzi narzędzia albo nie może go wywołać, zacznij od efektywnej polityki dla
bieżącej tury:

1. Sprawdź aktywny profil, `tools.allow` i `tools.deny` w
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).
2. Sprawdź ograniczenia specyficzne dla dostawcy w
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) i potwierdź, że wybrany
   [dostawca modelu](/pl/concepts/model-providers) obsługuje kształt narzędzia.
3. Sprawdź uprawnienia kanału, stan sandboxa i dostęp podwyższony za pomocą
   [Sandbox vs polityka narzędzi vs podwyższenie](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) i [Podwyższony exec](/pl/tools/elevated).
4. Sprawdź, czy plugin będący właścicielem jest zainstalowany i włączony w
   [Pluginy](/pl/tools/plugin).
5. W przypadku uruchomień delegowanych sprawdź ograniczenia per agent w
   [Ograniczenia sandboxa i narzędzi per agent](/pl/tools/multi-agent-sandbox-tools).
6. W przypadku dużych katalogów PI potwierdź, czy uruchomienie używa bezpośredniej ekspozycji narzędzi, czy
   [Wyszukiwania narzędzi](/pl/tools/tool-search).

## Powiązane

- [Automatyzacja](/pl/automation) dla cron, zadań, Heartbeat, zobowiązań, hooków, stałych poleceń i Task Flow
- [Agenci](/pl/concepts/agent) dla modelu agenta, sesji, pamięci i koordynacji wielu agentów
- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) jako kanoniczna referencja polityki narzędzi
- [Pluginy](/pl/tools/plugin) do instalacji pluginów i zarządzania nimi
- [Plugin SDK](/pl/plugins/sdk-overview) jako referencja dla autorów pluginów
- [Skills](/pl/tools/skills) dla kolejności ładowania Skills, bramkowania i konfiguracji
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) do kompaktowego odkrywania katalogu narzędzi PI
