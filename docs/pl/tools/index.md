---
doc-schema-version: 1
read_when:
    - Chcesz dowiedzieć się, jakie narzędzia udostępnia OpenClaw
    - Wybierasz między wbudowanymi narzędziami, Skills i pluginami
    - Potrzebujesz odpowiedniego punktu wejścia do dokumentacji dotyczącej zasad używania narzędzi, automatyzacji lub koordynacji agentów
summary: 'Przegląd narzędzi, Skills i pluginów OpenClaw: z czego mogą korzystać agenci i jak rozszerzać ich możliwości'
title: Przegląd
x-i18n:
    generated_at: "2026-07-12T15:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Użyj tej strony, aby wybrać odpowiednią powierzchnię możliwości. **Narzędzia**
udostępniają działania, które można wywoływać, **Skills** uczą agentów sposobu
pracy, a **pluginy** dodają możliwości środowiska uruchomieniowego, takie jak
narzędzia, dostawcy, kanały, hooki i pakiety Skills.

Ta strona zawiera przegląd i wskazuje właściwe sekcje dokumentacji. Pełne
informacje o zasadach narzędzi, wartościach domyślnych, przynależności do grup,
ograniczeniach dostawców i polach konfiguracji znajdziesz w sekcji
[Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Zacznij tutaj

W przypadku większości agentów zacznij od wbudowanych kategorii narzędzi,
a następnie dostosuj zasady tylko wtedy, gdy agent powinien widzieć mniej
narzędzi lub potrzebuje jawnego dostępu do hosta.

| Jeśli chcesz...                                                        | Najpierw użyj                                             | Następnie przeczytaj                                                                                                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Umożliwić agentowi działanie przy użyciu istniejących możliwości       | [Wbudowane narzędzia](#built-in-tool-categories)          | [Kategorie narzędzi](#built-in-tool-categories)                                                                                   |
| Kontrolować, co agent może wywoływać                                   | [Zasady narzędzi](#configure-access-and-approvals)        | [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools)                                                                      |
| Nauczyć agenta przepływu pracy                                         | [Skills](#choose-tools-skills-or-plugins)                 | [Skills](/pl/tools/skills), [Tworzenie Skills](/pl/tools/creating-skills) i [Warsztat Skills](/pl/tools/skill-workshop)                     |
| Dodać nową integrację lub powierzchnię środowiska uruchomieniowego     | [Pluginy](#extend-capabilities)                           | [Pluginy](/pl/tools/plugin) i [Tworzenie pluginów](/pl/plugins/building-plugins)                                                        |
| Uruchomić zadanie później lub w tle                                    | [Automatyzacja](/pl/automation)                              | [Przegląd automatyzacji](/pl/automation)                                                                                             |
| Koordynować wielu agentów lub środowiska wykonawcze                    | [Agenci podrzędni](/pl/tools/subagents)                      | [Agenci ACP](/pl/tools/acp-agents) i [Wysyłanie przez agenta](/pl/tools/agent-send)                                                     |
| Przeszukać duży katalog narzędzi OpenClaw                              | [Wyszukiwanie narzędzi](/pl/tools/tool-search)               | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                                                                                       |

## Wybór narzędzi, Skills lub pluginów

<Steps>
  <Step title="Użyj narzędzia, gdy agent musi wykonać działanie">
    Narzędzie jest funkcją z określonym typem, którą agent może wywołać, na
    przykład `exec`, `browser`, `web_search`, `message` lub `image_generate`.
    Używaj narzędzi, gdy agent musi odczytać dane, zmienić pliki, wysłać
    wiadomości, wywołać dostawcę lub obsługiwać inny system. Widoczne narzędzia
    są przekazywane do modelu jako ustrukturyzowane definicje funkcji.

    Model widzi tylko narzędzia, które pozostają dostępne po zastosowaniu
    aktywnego profilu, zasad zezwalania i blokowania, ograniczeń dostawcy, stanu
    piaskownicy, uprawnień kanału oraz dostępności pluginów.

  </Step>

  <Step title="Użyj Skills, gdy agent potrzebuje instrukcji">
    Skills to pakiet instrukcji `SKILL.md` ładowany do promptu agenta. Używaj
    Skills, gdy agent ma już potrzebne narzędzia, ale wymaga powtarzalnego
    przepływu pracy, kryteriów przeglądu, sekwencji poleceń lub ograniczeń
    operacyjnych.

    Skills mogą znajdować się w przestrzeni roboczej, współdzielonym katalogu
    Skills, zarządzanym katalogu głównym Skills OpenClaw lub pakiecie pluginu.

    [Skills](/pl/tools/skills) | [Warsztat Skills](/pl/tools/skill-workshop) | [Tworzenie Skills](/pl/tools/creating-skills) | [Konfiguracja Skills](/pl/tools/skills-config)

  </Step>

  <Step title="Użyj pluginu, gdy OpenClaw potrzebuje nowej możliwości">
    Plugin może dodawać narzędzia, Skills, kanały, dostawców modeli, mowę,
    głos w czasie rzeczywistym, generowanie multimediów, wyszukiwanie w
    internecie, pobieranie treści z internetu, hooki i inne możliwości
    środowiska uruchomieniowego. Użyj pluginu, gdy dana możliwość wymaga kodu,
    danych uwierzytelniających, hooków cyklu życia, metadanych manifestu lub
    pakietu możliwego do zainstalowania. Istniejące pluginy można instalować
    z ClawHub, npm, git, katalogów lokalnych lub archiwów.

    [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin) | [Tworzenie pluginów](/pl/plugins/building-plugins) | [SDK pluginów](/pl/plugins/sdk-overview)

  </Step>
</Steps>

## Kategorie wbudowanych narzędzi

Tabela zawiera reprezentatywne narzędzia, aby ułatwić rozpoznanie powierzchni.
Nie stanowi pełnego źródła informacji o zasadach. Dokładne informacje o grupach,
wartościach domyślnych oraz semantyce zezwoleń i blokad znajdziesz w sekcji
[Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

| Kategoria                  | Użyj, gdy agent musi...                                                               | Reprezentatywne narzędzia                                                                            | Następnie przeczytaj                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Środowisko uruchomieniowe  | Uruchamiać polecenia, zarządzać procesami lub używać analizy Python obsługiwanej przez dostawcę | `exec`, `process`, `code_execution`                                                           | [Exec](/pl/tools/exec), [Wykonywanie kodu](/pl/tools/code-execution)                                          |
| Pliki                      | Odczytywać i zmieniać pliki przestrzeni roboczej                                      | `read`, `write`, `edit`, `apply_patch`                                                               | [Stosowanie poprawki](/pl/tools/apply-patch)                                                               |
| Internet                   | Przeszukiwać internet i wpisy w serwisie X lub pobierać czytelną treść stron          | `web_search`, `x_search`, `web_fetch`                                                                | [Narzędzia internetowe](/pl/tools/web), [Pobieranie treści z internetu](/pl/tools/web-fetch)                   |
| Przeglądarka               | Obsługiwać sesję przeglądarki                                                         | `browser`                                                                                            | [Przeglądarka](/pl/tools/browser)                                                                          |
| Wiadomości i kanały        | Wysyłać odpowiedzi lub wykonywać działania w kanałach                                 | `message`                                                                                            | [Wysyłanie przez agenta](/pl/tools/agent-send)                                                             |
| Sesje i agenci             | Sprawdzać sesje, delegować pracę, sterować innym uruchomieniem lub raportować stan    | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Cel](/pl/tools/goal), [Agenci podrzędni](/pl/tools/subagents), [Narzędzie sesji](/pl/concepts/session-tool)     |
| Automatyzacja              | Planować zadania lub reagować na zdarzenia w tle                                      | `cron`, `heartbeat_respond`                                                                          | [Automatyzacja](/pl/automation)                                                                            |
| Gateway i węzły            | Sprawdzać stan Gateway lub sparowane urządzenia docelowe                              | `gateway`, `nodes`                                                                                   | [Konfiguracja Gateway](/pl/gateway/configuration), [Węzły](/pl/nodes)                                        |
| Multimedia                 | Analizować, generować lub odtwarzać głosowo multimedia                               | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Przegląd multimediów](/pl/tools/media-overview)                                                           |
| Duże katalogi OpenClaw     | Wyszukiwać i wywoływać wiele kwalifikujących się narzędzi bez przesyłania każdego schematu do modelu | `tool_search_code`, `tool_search`, `tool_describe`                                     | [Wyszukiwanie narzędzi](/pl/tools/tool-search)                                                             |

<Note>
Wyszukiwanie narzędzi jest eksperymentalną powierzchnią agenta OpenClaw.
Uruchomienia w środowisku Codex używają natywnego dla Codex trybu kodu,
natywnego wyszukiwania narzędzi, odroczonych narzędzi dynamicznych oraz
zagnieżdżonych wywołań narzędzi zamiast `tools.toolSearch`.
</Note>

## Narzędzia udostępniane przez pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Autorzy pluginów podłączają je
za pomocą `api.registerTool(...)` i właściwości `contracts.tools` manifestu;
szczegóły kontraktu znajdziesz w sekcjach
[SDK pluginów](/pl/plugins/sdk-overview) oraz
[Manifest pluginu](/pl/plugins/manifest).

Typowe narzędzia udostępniane przez pluginy obejmują:

- [Różnice](/pl/tools/diffs) do renderowania różnic w plikach i Markdown
- [Wyświetlanie widżetu](/tools/show-widget) do samodzielnych, osadzonych elementów SVG i HTML w czacie internetowym
- [Zadanie LLM](/pl/tools/llm-task) do kroków przepływu pracy zwracających wyłącznie JSON
- [Lobster](/pl/tools/lobster) do przepływów pracy z określonymi typami i wznawialnymi zatwierdzeniami
- [Tokenjuice](/pl/tools/tokenjuice) do kompresowania nadmiarowych danych
  wyjściowych narzędzi `exec` i `bash`
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) do odkrywania i wywoływania
  dużych katalogów narzędzi bez umieszczania każdego schematu w prompcie
- [Canvas](/pl/plugins/reference/canvas) do sterowania Canvas węzła i renderowania
  A2UI

## Konfigurowanie dostępu i zatwierdzeń

Zasady narzędzi są egzekwowane przed wywołaniem modelu. Jeśli zasady usuną
narzędzie, model nie otrzyma jego schematu w danej turze. Uruchomienie może
utracić narzędzia z powodu konfiguracji globalnej, konfiguracji danego agenta,
zasad kanału, ograniczeń dostawcy, reguł piaskownicy, zasad kanału lub środowiska
uruchomieniowego albo dostępności pluginów.

- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) opisują profile
  narzędzi, listy zezwoleń i blokad, ograniczenia specyficzne dla dostawców,
  wykrywanie pętli oraz ustawienia narzędzi obsługiwanych przez dostawców.
- [Zatwierdzanie Exec](/pl/tools/exec-approvals) opisuje zasady zatwierdzania
  poleceń hosta.
- [Exec z podwyższonymi uprawnieniami](/pl/tools/elevated) opisuje kontrolowane
  wykonywanie poza piaskownicą.
- [Piaskownica a zasady narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
  wyjaśnia, która warstwa kontroluje dostęp do plików i procesów.
- [Ograniczenia piaskownicy i narzędzi dla poszczególnych agentów](/pl/tools/multi-agent-sandbox-tools)
  opisują ograniczenia dotyczące agentów w delegowanych uruchomieniach.

## Rozszerzanie możliwości

Wybierz sposób rozszerzenia odpowiednio do zadania, które ma wykonywać OpenClaw:

- Zainstaluj istniejący plugin lub zarządzaj nim za pomocą sekcji
  [Pluginy](/pl/tools/plugin).
- Utwórz nową integrację, dostawcę, kanał, narzędzie lub hook, korzystając z
  sekcji [Tworzenie pluginów](/pl/plugins/building-plugins).
- Dodaj lub dostosuj instrukcje agenta wielokrotnego użytku za pomocą sekcji
  [Skills](/pl/tools/skills) i [Tworzenie Skills](/pl/tools/creating-skills).
- Użyj [SDK pluginów](/pl/plugins/sdk-overview) i
  [Manifestu pluginu](/pl/plugins/manifest), gdy potrzebujesz kontraktów
  implementacyjnych.

## Rozwiązywanie problemów z brakującymi narzędziami

Jeśli model nie widzi narzędzia lub nie może go wywołać, zacznij od sprawdzenia
zasad obowiązujących w bieżącej turze:

1. Sprawdź aktywny profil, `tools.allow` i `tools.deny` w sekcji
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).
2. Sprawdź ograniczenia specyficzne dla dostawcy w sekcji
   [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) i potwierdź,
   że wybrany [dostawca modelu](/pl/concepts/model-providers) obsługuje daną
   postać narzędzia.
3. Sprawdź uprawnienia kanału, stan piaskownicy i dostęp z podwyższonymi
   uprawnieniami w sekcjach
   [Piaskownica a zasady narzędzi a podwyższone uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
   oraz [Exec z podwyższonymi uprawnieniami](/pl/tools/elevated).
4. Sprawdź w sekcji [Pluginy](/pl/tools/plugin), czy plugin będący właścicielem
   narzędzia jest zainstalowany i włączony.
5. W przypadku delegowanych uruchomień sprawdź ograniczenia poszczególnych
   agentów w sekcji
   [Ograniczenia piaskownicy i narzędzi dla poszczególnych agentów](/pl/tools/multi-agent-sandbox-tools).
6. W przypadku dużych katalogów OpenClaw sprawdź, czy uruchomienie korzysta
   z bezpośredniego udostępniania narzędzi, czy z
   [Wyszukiwania narzędzi](/pl/tools/tool-search).

## Powiązane

- [Automatyzacja](/pl/automation) — Cron, zadania, Heartbeat, zobowiązania, hooki,
  stałe polecenia i TaskFlow
- [Agenci](/pl/concepts/agent) — model agenta, sesje, pamięć i
  koordynacja wielu agentów
- [Narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools) — kanoniczna
  dokumentacja zasad dotyczących narzędzi
- [Pluginy](/pl/tools/plugin) — instalowanie Pluginów i zarządzanie nimi
- [SDK Pluginów](/pl/plugins/sdk-overview) — dokumentacja dla autorów Pluginów
- [Skills](/pl/tools/skills) — kolejność ładowania, warunki aktywacji i konfiguracja Skills
- [Warsztat Skills](/pl/tools/skill-workshop) — tworzenie generowanych i
  weryfikowanych Skills
- [Wyszukiwanie narzędzi](/pl/tools/tool-search) — przeszukiwanie kompaktowego
  katalogu narzędzi OpenClaw
