---
read_when:
    - Projektowanie nadzoru nad flotą Codex
    - Tworzenie narzędzi OpenClaw, które odczytują, sterują lub uruchamiają sesje Codex
    - Wybór między wdrożeniem lokalnym, Cloudflare i VPS dla nadzorowanego Codex
summary: Plan nadzoru floty dla sesji serwera aplikacji Codex kontrolowanych przez OpenClaw.
title: Claw Supervisor
x-i18n:
    generated_at: "2026-06-27T18:21:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Nadzorca Claw

## Cel

Nadzorca Claw pozwala jednej stale działającej instancji OpenClaw monitorować flotę sesji Codex i kierować nią bez zmieniania normalnego doświadczenia użytkownika Codex. Użytkownik może połączyć się z hostem przez SSH, uruchomić Codex, pracować w TUI, a nadzorca nadal może czytać sesję, sterować nią, przerywać ją, tworzyć powiązane sesje i przyjmować przekazania. Sesje Codex mogą też wywoływać OpenClaw zwrotnie przez MCP.

## Model Produktu

Codex pozostaje główną powierzchnią pracy. OpenClaw nadzoruje Codex, zamiast ukrywać Codex wewnątrz nieprzezroczystego podagenta OpenClaw.

Plugin OpenClaw nazywa się `codex-supervisor`. `crabfleet` pozostaje profilem wdrożenia
i floty hostów dla maszyn CRAB, a nie nazwą wielokrotnego użytku Plugin.

Model ma trzy role:

- Codex podłączony do człowieka: normalny interaktywny Codex TUI uruchomiony przez współdzielony app-server.
- Autonomiczny Codex: wątek app-server Codex utworzony przez nadzorcę, do którego człowiek może później się podłączyć.
- Claw nadzorcy: stale działający agent OpenClaw z narzędziami do stanu floty, odczytu transkrypcji, sterowania, przerywania, tworzenia i przekazywania.

OpenClaw może używać wewnętrznie istniejącego mechanizmu podagentów, ale zewnętrzny kontrakt to podłączalna sesja Codex z identyfikatorem wątku Codex.

## Architektura

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Każdy host obsługujący Codex uruchamia:

- Demon app-server Codex.
- Program uruchamiający, który zawsze startuje interaktywny Codex z `--remote`.
- Łącznik, który rejestruje punkty końcowe app-server i aktywne wątki u nadzorcy.

Nadzorca uruchamia:

- Rejestr punktów końcowych.
- Rejestr sesji.
- Pulę klientów JSON-RPC app-server Codex.
- Serwer MCP dla wywołań z Codex do Claw.
- Narzędzia OpenClaw do sterowania z Claw do Codex.
- Silnik zasad dla działań autonomicznych, zatwierdzeń i zapobiegania pętlom.

## Kontrakt App-Server Codex

Używaj API app-server Codex jako kanonicznej płaszczyzny sterowania:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Interaktywny Codex musi być uruchamiany z `codex --remote <endpoint>`, aby TUI i nadzorca łączyły się z tym samym app-server. Samodzielne `codex exec` nie jest dziś sesją współdzieloną na żywo; używaj API app-server do pracy autonomicznej, dopóki Codex nie będzie obsługiwać `exec --remote`.

## Rejestr Sesji

Nadzorca przechowuje po jednym rekordzie dla każdego zaobserwowanego wątku Codex:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

Lokalna implementacja może wyprowadzić większość pól z metadanych wątku Codex. Wdrożenie floty powinno wzbogacać rekordy o tożsamość hosta, stan podłączenia użytkownika, stan git i kondycję sidecar.

## Powierzchnia MCP Dla Codex

Każdy nadzorowany Codex otrzymuje serwer MCP o nazwie `openclaw-codex-supervisor`.

Narzędzia:

- `codex_sessions_list`: wyświetl widoczne sesje Codex.
- `codex_session_read`: odczytaj jedną transkrypcję.
- `codex_session_send`: wyślij wiadomość do bezczynnego wątku albo steruj aktywnym wątkiem.
- `codex_session_interrupt`: przerwij aktywną turę.
- `codex_endpoint_probe`: zweryfikuj łączność z punktem końcowym.
- `claw_report_progress`: opublikuj bieżący stan zadania do nadzorcy.
- `claw_ask`: poproś nadzorcę o pomoc lub delegację.
- `codex_spawn`: utwórz nową autonomiczną sesję Codex.
- `codex_handoff`: poproś o przejęcie przez człowieka lub równorzędną sesję.

Zasoby:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Powierzchnia Sterowania Claw

Stale działający Claw otrzymuje te same prymitywy co narzędzia wewnętrzne:

- wyświetlanie sesji i punktów końcowych
- odczyt transkrypcji
- wysyłanie/sterowanie tekstem
- przerywanie aktywnej pracy
- tworzenie nowych sesji
- podsumowywanie i przypisywanie sesji
- rozgłaszanie instrukcji do filtrowanej grupy
- oznaczanie sesji jako zablokowanych, ukończonych lub porzuconych

Zachowanie narzędzi:

- Jeśli docelowy wątek jest bezczynny, `codex_session_send` mapuje się na `turn/start`.
- Jeśli docelowy wątek jest aktywny i widoczny jest identyfikator trwającej tury, mapuje się na `turn/steer`.
- Jeśli nie da się zidentyfikować aktywnej tury, narzędzie kończy się niepowodzeniem w trybie zamkniętym, zamiast tworzyć niepowiązaną turę.
- Kontrolki zapisu MCP udostępniane Codex pozostają wyłączone, chyba że zaufana zasada tylko dla nadzorcy je włączy.
- Odczyty surowych transkrypcji pozostają wyłączone, chyba że zaufana zasada tylko dla nadzorcy je włączy.
- Domyślne zatwierdzanie autonomiczne odmawia zatwierdzeń narzędzi/plików, chyba że jawna zasada stanowi inaczej.

## Przepływ Uruchamiania

Interaktywne logowanie na hoście:

1. Użytkownik łączy się przez SSH z hostem CRAB.
2. Usługa SSH uruchamia lub weryfikuje `codex app-server daemon start`.
3. Wrapper logowania uruchamia `codex --remote unix:// --cd <workspace>`.
4. Łącznik hosta rejestruje punkt końcowy i załadowany wątek.
5. Nadzorca emituje zdarzenie floty o wysokim priorytecie: nowa sesja Codex, obszar roboczy, stan podłączenia człowieka, podgląd bieżącego zadania.
6. Claw nadzorcy może natychmiast czytać i sterować.

Tworzenie autonomiczne:

1. Nadzorca wybiera host i obszar roboczy.
2. Łącznik hosta otwiera lub wznawia wątek app-server Codex.
3. Nadzorca rozpoczyna pierwszą turę z tekstem zadania i konfiguracją MCP.
4. Rejestr sesji oznacza ją jako autonomiczną i podłączalną.
5. Człowiek może później podłączyć się za pomocą `codex --remote <endpoint> resume <threadId>`, gdy Codex będzie obsługiwać dokładnie taki UX, albo przez obecny przepływ wznawiania na tym samym app-server.

## Wdrożenie

Preferowana płaszczyzna sterowania:

- Łączniki hostów utrzymują wychodzące połączenia WebSocket z nadzorcą.
- Stan nadzorcy znajduje się w magazynie OpenClaw Gateway.
- App-server Codex pozostaje lokalny dla każdego hosta; nigdy nie wystawiaj surowego, nieuwierzytelnionego app-server do publicznego internetu.

Przydatność Cloudflare:

- Dobre dla rejestru, durable objects, agregacji WebSocket, lekkiego routingu zdarzeń oraz publicznych punktów końcowych MCP/Gateway.
- Samo w sobie niewystarczające do bezpośredniego sterowania prywatnym hostem, ponieważ Workers nie mogą łączyć się z dowolnymi prywatnymi gniazdami Unix ani app-serverami local loopback.
- Używaj Cloudflare, gdy każdy łącznik hosta zgłasza się do domu przez wychodzący WebSocket.

Awaryjny VPS:

- Używaj usługi Hetzner, gdy potrzebne jest długotrwałe sterowanie procesami, tunele SSH, routing sieci prywatnej lub dostęp do lokalnego systemu plików.
- Zachowaj ten sam protokół: wychodzące łączniki hostów, centralny rejestr nadzorcy, lokalny app-server Codex.

## Bezpieczeństwo

- Domyślne bindowanie to lokalne gniazdo Unix.
- Zdalny app-server używa tokena albo podpisanego uwierzytelniania bearer.
- Łącznik hosta uwierzytelnia się u nadzorcy za pomocą ograniczonego tokena hosta.
- Narzędzia nadzorcy egzekwują zasady dla każdej sesji: odczyt, sterowanie, przerywanie, tworzenie, zatwierdzanie.
- Wiadomości między agentami zawierają `originSessionId`; echo własne jest odrzucane.
- Rozgłaszanie wymaga jawnego filtra i ograniczonej liczby celów.
- Odczyty transkrypcji redagują sekrety na granicy OpenClaw.
- Prośby o zatwierdzenie domyślnie są odrzucane dla tur pochodzących od nadzorcy, chyba że zasada na nie pozwala.

## Plan Implementacji

Faza 1: MVP lokalnego nadzorcy

- Dodaj klienta JSON-RPC app-server Codex dla proxy stdio i punktów końcowych WebSocket.
- Dodaj rejestr punktów końcowych/sesji nadzorcy.
- Dodaj narzędzia MCP: lista, odczyt, wysyłanie, przerywanie, probe.
- Dodaj lokalną konfigurację env dla punktów końcowych.
- Dodaj testy fałszywego app-server i jeden lokalny smoke live app-server.

Faza 2: Integracja OpenClaw

- Zarejestruj narzędzia nadzorcy w Plugin `codex-supervisor`.
- Wstrzyknij MCP nadzorcy do konfiguracji wątku Codex.
- Dodaj podsumowania sesji do kontekstu agenta.
- Dodaj powiadomienia o zdarzeniach, gdy pojawiają się nowe wątki Codex.
- Dodaj konfigurację zasad dla autonomicznego wysyłania/przerywania/tworzenia.

Faza 3: Łącznik floty

- Sidecar hosta rejestruje punkt końcowy app-server, metadane hosta, metadane git/obszaru roboczego i stan podłączenia człowieka.
- Dodaj wychodzący łącznik WebSocket dla płaszczyzny sterowania Cloudflare lub VPS.
- Dodaj ponowne łączenie, Heartbeat i czyszczenie nieaktualnych sesji.
- Dodaj wrapper uruchamiania CRAB SSH.

Faza 4: Działanie autonomiczne

- Dodaj przepływy tworzenia/wznawiania/przejęcia.
- Dodaj rozgłaszanie i delegowanie.
- Dodaj raporty postępu i podsumowania stanu zadań.
- Dodaj zapobieganie pętlom i limity szybkości.
- Dodaj widoki pulpitu.

Faza 5: Multi-Claw

- Podziel sesje według grup.
- Dodaj przywództwo/dzierżawę dla każdej sesji.
- Dodaj dziennik audytu i odtwarzanie.
- Dodaj eskalację między grupami Claw.

## Testy Akceptacyjne

- Człowiek uruchamia Codex TUI przez współdzielony app-server.
- Nadzorca wyświetla aktywny wątek przez `thread/loaded/list`.
- Nadzorca odczytuje transkrypcję przez `thread/read`.
- Nadzorca wysyła tekst do bezczynnego wątku przez `turn/start`.
- Nadzorca steruje aktywnym wątkiem przez `turn/steer`.
- Przerwanie przez nadzorcę zatrzymuje aktywną turę przez `turn/interrupt`.
- Codex wywołuje MCP nadzorcy i wyświetla sesje równorzędne.
- Autonomiczny Codex zostaje utworzony i później podłączony do człowieka.
- Utrata łącznika hosta oznacza sesje jako nieaktualne bez usuwania historii.

## Otwarte Pytania

- Dokładny UX podłączania Codex TUI do wątku app-server utworzonego bez TUI.
- Czy Codex powinien dodać `exec --remote` dla bezgłowych przebiegów współdzielonych na żywo.
- Właściciel trwałego stanu: baza danych OpenClaw Gateway, Cloudflare Durable Object czy baza danych VPS.
- Szczegółowość zasad zatwierdzania dla tur pochodzących od nadzorcy.
- Ile podsumowania transkrypcji należy wstrzykiwać do kontekstu stale działającego Claw, a ile trzymać jako narzędzie/zasób.
