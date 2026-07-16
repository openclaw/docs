---
read_when:
    - Potrzebny jest hak pluginu lub narzędzie, aby zapytać przed wykonaniem operacji wywołującej efekt uboczny
    - Musisz skonfigurować miejsce dostarczania monitów o zatwierdzenie pluginów
    - Podejmujesz decyzję między opcjonalnymi narzędziami, zatwierdzaniem wykonywania poleceń a zatwierdzaniem pluginów
sidebarTitle: Permission requests
summary: Proś użytkowników o zatwierdzanie wywołań narzędzi Pluginu i należących do Pluginu monitów o uprawnienia
title: Żądania uprawnień Pluginu
x-i18n:
    generated_at: "2026-07-16T18:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Żądania uprawnień Pluginu umożliwiają kodowi Pluginu wstrzymanie wywołania narzędzia lub operacji należącej do Pluginu do czasu jej zatwierdzenia albo odrzucenia przez użytkownika. Korzystają z przepływu Gateway
`plugin.approval.*` oraz tych samych interfejsów zatwierdzania, które obsługują przyciski zatwierdzania na czacie i polecenia `/approve`.

Żądań uprawnień Pluginu należy używać do uprawnień Pluginu/aplikacji. Nie zastępują one zatwierdzeń wykonywania poleceń na hoście, opcjonalnych list dozwolonych narzędzi ani natywnej weryfikacji uprawnień przez Codex.

## Wybór właściwej bramy

Należy wybrać bramę odpowiadającą wymaganemu punktowi decyzyjnemu:

| Brama                            | Kiedy jej używać                                                         | Co kontroluje                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Opcjonalne narzędzia             | Narzędzie nie powinno być widoczne dla modelu, dopóki użytkownik go nie włączy. | Udostępnianie narzędzi przez `tools.allow`.                                                                   |
| Żądania uprawnień Pluginu        | Hook Pluginu lub operacja należąca do Pluginu musi poprosić o zgodę przed wykonaniem działania. | Zatwierdzanie w czasie wykonywania przez `plugin.approval.*`.                                                |
| Zatwierdzenia wykonywania        | Polecenie hosta lub narzędzie przypominające powłokę wymaga zatwierdzenia przez operatora. | Zasady wykonywania na hoście i trwałe listy dozwolonych poleceń.                                            |
| Natywne żądania uprawnień Codex  | Codex pyta przed natywnymi działaniami powłoki, plikowymi, MCP lub serwera aplikacji. | Obsługa zatwierdzeń serwera aplikacji Codex lub natywnych hooków, kierowana przez zatwierdzenia Pluginu, gdy OpenClaw jest właścicielem monitu. |
| Żądania zatwierdzenia MCP        | Serwer MCP Codex żąda zatwierdzenia wywołania narzędzia.                 | Odpowiedzi zatwierdzające MCP przekazywane przez zatwierdzenia Pluginu OpenClaw.                                         |

Opcjonalne narzędzia stanowią bramę na etapie wykrywania. Żądania uprawnień Pluginu stanowią bramę dla każdego wywołania. Należy użyć obu, gdy wrażliwe narzędzie powinno wymagać jawnego włączenia, zanim model będzie mógł je zobaczyć, oraz zatwierdzenia przed wykonaniem działania.

## Żądanie zatwierdzenia przed wywołaniem narzędzia

Większość monitów tworzonych przez Plugin powinna rozpoczynać się w hooku `before_tool_call`. Hook jest uruchamiany po wybraniu narzędzia przez model, ale przed jego wykonaniem przez OpenClaw:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Tekst monitu należy napisać z myślą o osobie, która będzie zatwierdzać działanie:

- Pole `title` powinno być krótkie i skoncentrowane na działaniu; Gateway ogranicza je do 80 znaków.
- Pole `description` powinno być konkretne i precyzyjnie ograniczone; Gateway ogranicza je do 512
  znaków.
- Należy uwzględnić działanie, cel i ryzyko. Nie należy podawać sekretów, tokenów ani
  prywatnych ładunków, które nie powinny pojawiać się w interfejsach zatwierdzania na czacie.
- Jeśli pominięto `severity`, domyślnie przyjmuje ono wartość `"warning"`. Wartości `"critical"` należy używać wyłącznie w przypadku
  działań, przy których błędna decyzja może spowodować szkody w środowisku produkcyjnym lub utratę danych.
- Jeśli pominięto `allowedDecisions`, domyślnie przyjmuje ono wartość `["allow-once", "allow-always", "deny"]`.
  Wartość `["allow-once", "deny"]` należy przekazać, gdy trwałe zaufanie jest niebezpieczne dla
  danego działania.
- Domyślna wartość `timeoutMs` wynosi 120000 (2 minuty), a maksymalna 600000 (10
  minut), niezależnie od żądanej wartości.

## Sposób obsługi decyzji

OpenClaw tworzy oczekujące zatwierdzenie z identyfikatorem `plugin:`, przekazuje je do
dostępnych interfejsów zatwierdzania i oczekuje na decyzję.

| Decyzja           | Wynik                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Bieżące wywołanie jest kontynuowane.                                      |
| `allow-always`    | Bieżące wywołanie jest kontynuowane, a decyzja zostaje przekazana do Pluginu. |
| `deny`            | Wywołanie zostaje zablokowane z wynikiem odmowy wykonania narzędzia.       |
| Przekroczenie limitu czasu | Wywołanie zostaje zablokowane.                                       |
| Anulowanie        | Wywołanie zostaje zablokowane po przerwaniu przebiegu.                    |
| Brak trasy zatwierdzania | Wywołanie zostaje zablokowane, ponieważ żaden połączony interfejs zatwierdzania nie może go rozstrzygnąć. |

Na wykonanie zezwalają wyłącznie dokładne decyzje `allow-once` i `allow-always` dozwolone przez
żądanie. Decyzje nieznane, nieprawidłowe, niedopasowane, brakujące oraz otrzymane po przekroczeniu limitu czasu
powodują bezpieczną odmowę. Starsze pole `timeoutBehavior` pozostaje akceptowane ze względu na
zgodność Pluginów, ale jest przestarzałe i ignorowane; nie należy go ustawiać w nowych hookach.

Wartość `allow-always` jest trwała tylko wtedy, gdy żądający Plugin lub środowisko wykonawcze implementuje
taką trwałość. W przypadku zwykłych hooków `before_tool_call.requireApproval`
OpenClaw traktuje `allow-once` i `allow-always` jako decyzje zatwierdzające dla
bieżącego wywołania i przekazuje rozstrzygniętą wartość do `onResolution`. Jeśli Plugin
oferuje `allow-always`, należy udokumentować i zaimplementować dokładny zakres przyszłych wywołań, którym
ufa.

Jeśli hook zwraca również `params`, OpenClaw stosuje te zmiany parametrów dopiero
po pomyślnym zatwierdzeniu. Hook o niższym priorytecie może nadal zablokować działanie po tym, jak
hook o wyższym priorytecie zażądał zatwierdzenia.

`allowedDecisions` ogranicza przyciski i polecenia wyświetlane użytkownikowi.
Gateway odrzuca próbę rozstrzygnięcia przy użyciu decyzji, której nie oferowało żądanie.

## Kierowanie monitów zatwierdzania

Monity zatwierdzania mogą być rozstrzygane w lokalnych interfejsach użytkownika lub w kanałach czatu
obsługujących zatwierdzanie. Aby przekazywać monity zatwierdzania Pluginu do określonych
celów czatu, należy skonfigurować `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` jest niezależne od `approvals.exec`. Włączenie przekazywania zatwierdzeń
wykonywania nie kieruje monitów zatwierdzania Pluginu, a włączenie przekazywania zatwierdzeń Pluginu
nie zmienia zasad wykonywania na hoście.

Gdy monit zawiera tekst do ręcznego zatwierdzenia, należy rozstrzygnąć go przy użyciu jednej z oferowanych
decyzji:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Pełny model przekazywania, zatwierdzanie na tym samym czacie, natywne dostarczanie do kanałów
oraz reguły osób zatwierdzających specyficzne dla kanałów opisano w sekcji [Zaawansowane zatwierdzenia wykonywania](/pl/tools/exec-approvals-advanced#plugin-approval-forwarding).

## Natywne uprawnienia Codex

Natywne monity o uprawnienia Codex mogą być również przekazywane przez zatwierdzenia Pluginu, ale
mają innego właściciela niż hooki tworzone przez Plugin.

- Żądania zatwierdzenia serwera aplikacji Codex są kierowane przez OpenClaw po weryfikacji przez Codex.
- Przekaźnik natywnego hooka `permission_request` może wysyłać żądania przez
  `plugin.approval.request`, gdy ten przekaźnik jest włączony.
- Żądania zatwierdzenia narzędzi MCP są kierowane przez zatwierdzenia Pluginu, gdy Codex oznaczy
  `_meta.codex_approval_kind` jako `"mcp_tool_call"`.

Zachowanie specyficzne dla Codex i reguły awaryjne opisano w sekcji [Środowisko wykonawcze uprzęży Codex](/pl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations).

## Rozwiązywanie problemów

**Narzędzie informuje, że zatwierdzenia Pluginu są niedostępne.** Żaden interfejs zatwierdzania ani skonfigurowana
trasa zatwierdzania nie przyjęły żądania. Należy podłączyć klienta obsługującego zatwierdzanie, użyć
kanału obsługującego `/approve` na tym samym czacie albo skonfigurować `approvals.plugin`.

**Pojawia się `allow-always`, ale kolejne wywołanie ponownie wyświetla monit.** Ogólny przepływ
zatwierdzania Pluginu nie utrwala automatycznie zaufania dla dowolnych hooków. Zaufanie należące
do Pluginu należy utrwalić w Pluginie po `onResolution("allow-always")` albo
oferować wyłącznie `allow-once` i `deny`.

**`/approve` odrzuca decyzję.** Żądanie ograniczyło
`allowedDecisions`. Należy użyć jednej z decyzji wyświetlonych w monicie.

**Monit Discord, Matrix, Slack lub Telegram jest kierowany inaczej niż zatwierdzenia
wykonywania.** Zatwierdzenia Pluginu i zatwierdzenia wykonywania korzystają z oddzielnych konfiguracji i mogą stosować
różne mechanizmy autoryzacji. Zamiast sprawdzać wyłącznie `approvals.exec`, należy zweryfikować `approvals.plugin` oraz obsługę
zatwierdzeń Pluginu przez dany kanał.

## Powiązane

- [Hooki Pluginu](/pl/plugins/hooks#tool-call-policy)
- [Tworzenie Pluginów](/pl/plugins/building-plugins#registering-tools)
- [Zaawansowane zatwierdzenia wykonywania](/pl/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protokół Gateway](/pl/gateway/protocol)
- [Środowisko wykonawcze uprzęży Codex](/pl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
