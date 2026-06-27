---
read_when:
    - Budujesz zewnętrzną aplikację, skrypt, pulpit, zadanie CI lub rozszerzenie IDE, które komunikuje się z OpenClaw
    - Wybierasz między Gateway RPC a Plugin SDK
    - Integrujesz się z uruchomieniami agentów Gateway, sesjami, zdarzeniami, zatwierdzeniami, modelami lub narzędziami
sidebarTitle: External apps
summary: Aktualna ścieżka integracji dla zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE
title: Integracje Gateway dla aplikacji zewnętrznych
x-i18n:
    generated_at: "2026-06-27T17:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplikacje zewnętrzne powinny dziś komunikować się z OpenClaw przez protokół Gateway. Używaj
Gateway WebSocket i metod RPC, gdy skrypt, dashboard, zadanie CI, rozszerzenie IDE
lub inny proces chce uruchamiać przebiegi agentów, strumieniować zdarzenia, czekać na
wyniki, anulować pracę albo sprawdzać zasoby Gateway.

<Warning>
  Nie ma jeszcze publicznego pakietu klienta npm. Nie dodawaj nazw pakietów klienta
  OpenClaw jako zależności aplikacji, dopóki informacje o wydaniu nie ogłoszą opublikowanego
  pakietu, a ta strona nie będzie zawierać instrukcji instalacji.
</Warning>

<Note>
  Ta strona jest przeznaczona dla kodu poza procesem OpenClaw. Kod Plugin, który działa
  wewnątrz OpenClaw, powinien zamiast tego używać udokumentowanych podścieżek `openclaw/plugin-sdk/*`.
</Note>

## Co jest dziś dostępne

| Powierzchnia                            | Status | Użyj do                                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Protokół Gateway](/pl/gateway/protocol)   | Gotowe | Transport WebSocket, uzgadnianie połączenia, zakresy autoryzacji, wersjonowanie protokołu i zdarzenia. |
| [Dokumentacja RPC Gateway](/pl/reference/rpc) | Gotowe | Bieżące metody Gateway dla agentów, sesji, zadań, modeli, narzędzi, artefaktów i zatwierdzeń. |
| [`openclaw agent`](/pl/cli/agent)          | Gotowe | Jednorazowa integracja skryptowa, gdy wystarczy wywołanie CLI z powłoki.                      |
| [`openclaw message`](/pl/cli/message)      | Gotowe | Wysyłanie wiadomości lub akcji kanału ze skryptów.                                            |

Drzewo źródłowe zawiera wewnętrzne prace pakietowe nad przyszłą biblioteką klienta, ale
nie jest to publiczna powierzchnia instalacji. Traktuj ją jako szczegół implementacji w wersji zapoznawczej,
dopóki pakiety nie zostaną opublikowane i wersjonowane.

## Zalecana ścieżka

1. Uruchom lub wykryj Gateway.
2. Połącz się przez [protokół Gateway](/pl/gateway/protocol).
3. Wywołuj udokumentowane metody RPC z [dokumentacji RPC Gateway](/pl/reference/rpc).
4. Przypnij wersję OpenClaw, względem której testujesz.
5. Przy aktualizacji OpenClaw ponownie sprawdź dokumentację RPC.

W przypadku przebiegów agentów zacznij od RPC `agent` i połącz go z `agent.wait`, gdy
potrzebujesz wyniku końcowego. Do trwałego stanu konwersacji używaj metod `sessions.*`.
W przypadku integracji UI subskrybuj zdarzenia Gateway i renderuj tylko te rodziny
zdarzeń, które rozumie Twoja aplikacja.

## Kod aplikacji a kod Plugin

Używaj Gateway RPC, gdy kod działa poza OpenClaw:

- skrypty Node, które uruchamiają lub obserwują przebiegi agentów
- zadania CI, które wywołują Gateway
- dashboardy i panele administracyjne
- rozszerzenia IDE
- zewnętrzne mosty, które nie muszą stać się Plugin kanałów
- testy integracyjne z fałszywymi lub rzeczywistymi transportami Gateway

Używaj Plugin SDK, gdy kod działa wewnątrz OpenClaw:

- Plugin dostawców
- Plugin kanałów
- hooki narzędzi lub cyklu życia
- Plugin uprzęży agentów
- zaufane pomocniki środowiska uruchomieniowego

Aplikacje zewnętrzne nie powinny importować `openclaw/plugin-sdk/*`; te podścieżki są przeznaczone dla
Plugin ładowanych przez OpenClaw.

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Dokumentacja RPC Gateway](/pl/reference/rpc)
- [Polecenie CLI agent](/pl/cli/agent)
- [Polecenie CLI message](/pl/cli/message)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Sesje](/pl/concepts/session)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
