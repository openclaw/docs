---
doc-schema-version: 1
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Decydujesz między wbudowanymi narzędziami, Skills i pluginami
    - Potrzebujesz właściwego punktu wejścia do dokumentacji dla zasad narzędzi, automatyzacji lub koordynacji agentów
summary: 'Omówienie narzędzi, Skills i pluginów OpenClaw: co agenci mogą wywoływać i jak je rozszerzać'
title: Przegląd
x-i18n:
    generated_at: "2026-06-27T18:28:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Użyj tej strony, aby wybrać właściwy obszar Capabilities. **Narzędzia** to wywoływalne
akcje, **Skills** uczą agentów sposobu pracy, a **pluginy** dodają możliwości
runtime, takie jak narzędzia, dostawcy, kanały, haki i spakowane Skills.

To jest strona przeglądowa i kierująca. Pełne zasady dotyczące narzędzi, wartości
domyślne, przynależność do grup, ograniczenia dostawców i pola konfiguracji znajdziesz w
[Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Zacznij tutaj

W przypadku większości agentów zacznij od wbudowanych kategorii narzędzi, a następnie dostosuj zasady
tylko wtedy, gdy agent powinien widzieć mniej narzędzi albo potrzebuje jawnego dostępu do hosta.

| Jeśli chcesz...                                      | Najpierw użyj                                      | Następnie przeczytaj                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Pozwolić agentowi działać z istniejącymi możliwościami | [Wbudowane narzędzia](#built-in-tool-categories)   | [Kategorie narzędzi](#built-in-tool-categories)                                                                               |
| Kontrolować, co agent może wywoływać                 | [Zasady narzędzi](#configure-access-and-approvals) | [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools)                                                                  |
| Nauczyć agenta przepływu pracy                       | [Skills](#choose-tools-skills-or-plugins)          | [Skills](/pl/tools/skills), [Tworzenie Skills](/pl/tools/creating-skills) i [Warsztat Skills](/pl/tools/skill-workshop)                |
| Dodać nową integrację lub obszar runtime             | [Pluginy](#extend-capabilities)                    | [Pluginy](/pl/tools/plugin) i [Budowanie pluginów](/pl/plugins/building-plugins)                                                    |
| Uruchomić pracę później albo w tle                   | [Automatyzacja](/pl/automation)                       | [Przegląd automatyzacji](/pl/automation)                                                                                         |
| Koordynować wielu agentów lub harnessy               | [Podagenci](/pl/tools/subagents)                      | [Agenci ACP](/pl/tools/acp-agents) i [Wysyłanie do agenta](/pl/tools/agent-send)                                                    |
| Przeszukać duży katalog narzędzi OpenClaw            | [Wyszukiwanie narzędzi](/pl/tools/tool-search)        | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                                                                                   |

## Wybierz narzędzia, Skills albo pluginy

<Steps>
  <Step title="Use a tool when the agent needs to act">
    Narzędzie to typowana funkcja, którą agent może wywołać, taka jak `exec`, `browser`,
    `web_search`, `message` albo `image_generate`. Używaj narzędzi, gdy agent
    musi odczytać dane, zmienić pliki, wysłać wiadomości, wywołać dostawcę albo obsłużyć
    inny system. Widoczne narzędzia są wysyłane do modelu jako strukturalne definicje
    funkcji.

    Model widzi tylko narzędzia, które przejdą przez aktywny profil, zasady allow/deny,
    ograniczenia dostawcy, stan sandboxa, uprawnienia kanału i dostępność
    pluginów.

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill to pakiet instrukcji `SKILL.md` ładowany do promptu agenta. Używaj
    Skill, gdy agent ma już potrzebne narzędzia, ale potrzebuje powtarzalnego
    przepływu pracy, rubryki recenzji, sekwencji poleceń albo ograniczenia operacyjnego.

    Skills mogą znajdować się w workspace, współdzielonym katalogu Skills, zarządzanym przez OpenClaw
    katalogu głównym Skills albo w pakiecie pluginu.

    [Skills](/pl/tools/skills) | [Warsztat Skills](/pl/tools/skill-workshop) | [Tworzenie Skills](/pl/tools/creating-skills) | [Konfiguracja Skills](/pl/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Plugin może dodać narzędzia, Skills, kanały, dostawców modeli, mowę, głos w czasie rzeczywistym,
    generowanie mediów, wyszukiwanie w sieci, pobieranie stron, haki i inne możliwości
    runtime. Używaj pluginu, gdy dana możliwość obejmuje kod, dane uwierzytelniające,
    haki cyklu życia, metadane manifestu albo instalowalne pakietowanie. Istniejące
    pluginy można instalować z ClawHub, npm, git, lokalnych katalogów albo
    archiwów.

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Budowanie pluginów](/pl/plugins/building-plugins) | [Plugin SDK](/pl/plugins/sdk-overview)

  </Step>
</Steps>

## Wbudowane kategorie narzędzi

Tabela pokazuje reprezentatywne narzędzia, aby ułatwić rozpoznanie obszaru. Nie jest to
pełne odniesienie do zasad. Dokładne grupy, wartości domyślne oraz semantykę allow/deny
znajdziesz w [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

| Kategoria               | Użyj, gdy agent musi...                                                               | Reprezentatywne narzędzia                                           | Następnie przeczytaj                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Runtime                 | Uruchamiać polecenia, zarządzać procesami albo używać analizy Python wspieranej przez dostawcę | `exec`, `process`, `code_execution`                                  | [Exec](/pl/tools/exec), [Wykonywanie kodu](/pl/tools/code-execution)                                            |
| Pliki                   | Odczytywać i zmieniać pliki workspace                                                  | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/pl/tools/apply-patch)                                                                         |
| Sieć                    | Przeszukiwać sieć, przeszukiwać posty X albo pobierać czytelną treść strony             | `web_search`, `x_search`, `web_fetch`                                | [Narzędzia webowe](/pl/tools/web), [Pobieranie stron](/pl/tools/web-fetch)                                      |
| Przeglądarka            | Obsługiwać sesję przeglądarki                                                          | `browser`                                                            | [Przeglądarka](/pl/tools/browser)                                                                            |
| Wiadomości i kanały     | Wysyłać odpowiedzi albo akcje kanału                                                    | `message`                                                            | [Wysyłanie do agenta](/pl/tools/agent-send)                                                                  |
| Sesje i agenci          | Sprawdzać sesje, delegować pracę, kierować innym uruchomieniem albo raportować status   | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Cel](/pl/tools/goal), [Podagenci](/pl/tools/subagents), [Narzędzie sesji](/pl/concepts/session-tool)              |
| Automatyzacja           | Planować pracę albo reagować na zdarzenia w tle                                         | `cron`, `heartbeat_respond`                                          | [Automatyzacja](/pl/automation)                                                                              |
| Gateway i węzły         | Sprawdzać stan Gateway albo sparowane urządzenia docelowe                               | `gateway`, `nodes`                                                   | [Konfiguracja Gateway](/pl/gateway/configuration), [Węzły](/pl/nodes)                                          |
| Media                   | Analizować, generować albo wypowiadać media                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Przegląd mediów](/pl/tools/media-overview)                                                                  |
| Duże katalogi OpenClaw  | Wyszukiwać i wywoływać wiele kwalifikujących się narzędzi bez wysyłania każdego schematu do modelu | `tool_search_code`, `tool_search`, `tool_describe`                   | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                                                               |

<Note>
Wyszukiwanie narzędzi to eksperymentalny obszar agenta OpenClaw. Uruchomienia harnessa Codex używają
natywnego dla Codex trybu kodu, natywnego wyszukiwania narzędzi, odroczonych narzędzi dynamicznych i zagnieżdżonych
wywołań narzędzi zamiast `tools.toolSearch`.
</Note>

## Narzędzia dostarczane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Autorzy pluginów podłączają narzędzia przez
`api.registerTool(...)` i `contracts.tools` manifestu; szczegóły kontraktu znajdziesz w
[Plugin SDK](/pl/plugins/sdk-overview) i [Manifeście pluginu](/pl/plugins/manifest).

Typowe narzędzia dostarczane przez pluginy obejmują:

- [Różnice](/pl/tools/diffs) do renderowania różnic plików i markdown
- [Zadanie LLM](/pl/tools/llm-task) do kroków przepływu pracy wyłącznie w JSON
- [Lobster](/pl/tools/lobster) do typowanych przepływów pracy z wznawialnymi zatwierdzeniami
- [Tokenjuice](/pl/tools/tokenjuice) do kompaktowania zaszumionego wyjścia narzędzi `exec` i `bash`
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) do odkrywania i wywoływania dużych katalogów narzędzi
  bez umieszczania każdego schematu w prompcie
- [Canvas](/pl/plugins/reference/canvas) do sterowania Canvas w Node i renderowania
  A2UI

## Konfigurowanie dostępu i zatwierdzeń

Zasady narzędzi są egzekwowane przed wywołaniem modelu. Jeśli zasady usuną narzędzie, model
nie otrzyma schematu tego narzędzia w danej turze. Uruchomienie może utracić narzędzia
z powodu konfiguracji globalnej, konfiguracji per agent, zasad kanału, ograniczeń
dostawcy, reguł sandboxa, zasad kanału/runtime albo dostępności pluginów.

- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) dokumentują profile narzędzi,
  listy allow/deny, ograniczenia specyficzne dla dostawcy, wykrywanie pętli i
  ustawienia narzędzi wspieranych przez dostawcę.
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) dokumentują zasady zatwierdzania poleceń hosta.
- [Podwyższone exec](/pl/tools/elevated) dokumentuje kontrolowane wykonywanie poza
  sandboxem.
- [Sandbox kontra zasady narzędzi kontra podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) wyjaśnia, która warstwa kontroluje dostęp do plików i procesów.
- [Sandbox i ograniczenia narzędzi per agent](/pl/tools/multi-agent-sandbox-tools)
  dokumentuje ograniczenia specyficzne dla agenta w delegowanych uruchomieniach.

## Rozszerzanie możliwości

Wybierz ścieżkę rozszerzenia według zadania, które OpenClaw ma wykonać:

- Zainstaluj istniejący plugin albo zarządzaj nim za pomocą [Pluginy](/pl/tools/plugin).
- Zbuduj nową integrację, dostawcę, kanał, narzędzie albo hak za pomocą
  [Budowanie pluginów](/pl/plugins/building-plugins).
- Dodaj albo dostrój instrukcje agenta wielokrotnego użytku za pomocą [Skills](/pl/tools/skills) i
  [Tworzenie Skills](/pl/tools/creating-skills).
- Użyj [Plugin SDK](/pl/plugins/sdk-overview) i [Manifestu pluginu](/pl/plugins/manifest), gdy potrzebujesz kontraktów implementacyjnych.

## Rozwiązywanie problemów z brakującymi narzędziami

Jeśli model nie widzi albo nie może wywołać narzędzia, zacznij od efektywnych zasad dla
bieżącej tury:

1. Sprawdź aktywny profil, `tools.allow` i `tools.deny` w
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).
2. Sprawdź ograniczenia specyficzne dla dostawcy w
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) i potwierdź, że wybrany
   [dostawca modelu](/pl/concepts/model-providers) obsługuje kształt narzędzia.
3. Sprawdź uprawnienia kanału, stan sandboxa i dostęp podwyższony za pomocą
   [Sandbox kontra zasady narzędzi kontra podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) i [Podwyższone exec](/pl/tools/elevated).
4. Sprawdź, czy właścicielski plugin jest zainstalowany i włączony w
   [Pluginy](/pl/tools/plugin).
5. Dla delegowanych uruchomień sprawdź ograniczenia per agent w
   [Sandbox i ograniczenia narzędzi per agent](/pl/tools/multi-agent-sandbox-tools).
6. Dla dużych katalogów OpenClaw potwierdź, czy uruchomienie używa bezpośredniego udostępniania narzędzi, czy
   [Wyszukiwania narzędzi](/pl/tools/tool-search).

## Powiązane

- [Automatyzacja](/pl/automation) dla cron, zadań, heartbeat, zobowiązań, haków, stałych poleceń i przepływu zadań
- [Agenci](/pl/concepts/agent) dla modelu agenta, sesji, pamięci i koordynacji wielu agentów
- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) jako kanoniczne odniesienie do zasad narzędzi
- [Pluginy](/pl/tools/plugin) do instalowania pluginów i zarządzania nimi
- [Plugin SDK](/pl/plugins/sdk-overview) jako odniesienie dla autorów pluginów
- [Skills](/pl/tools/skills) dla kolejności ładowania, bramkowania i konfiguracji Skills
- [Warsztat Skills](/pl/tools/skill-workshop) do generowanego i recenzowanego tworzenia Skills
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) do kompaktowego odkrywania katalogu narzędzi OpenClaw
