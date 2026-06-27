---
read_when:
    - Potrzebujesz hooka Plugin lub narzędzia, aby zapytać przed wykonaniem efektu ubocznego
    - Musisz skonfigurować miejsce dostarczania monitów o zatwierdzenie Plugin
    - Decydujesz między opcjonalnymi narzędziami, zatwierdzeniami exec i zatwierdzeniami pluginów
sidebarTitle: Permission requests
summary: Proś użytkowników o zatwierdzanie wywołań narzędzi Plugin i promptów uprawnień należących do Plugin
title: Żądania uprawnień Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Żądania uprawnień Plugin pozwalają kodowi Plugin wstrzymać wywołanie narzędzia lub operację należącą do Plugin do czasu, aż użytkownik ją zatwierdzi albo odrzuci. Używają przepływu Gateway `plugin.approval.*` oraz tych samych powierzchni UI zatwierdzania, które obsługują przyciski zatwierdzania w czacie i polecenia `/approve`.

Używaj żądań uprawnień Plugin do uprawnień Plugin/aplikacji. Nie zastępują one zatwierdzeń wykonywania poleceń hosta, opcjonalnych list dozwolonych narzędzi ani natywnego przeglądu uprawnień Codex.

## Wybierz właściwą bramkę

Wybierz bramkę pasującą do punktu decyzyjnego, którego potrzebujesz:

| Bramka                            | Użyj jej, gdy                                                               | Co kontroluje                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Opcjonalne narzędzia              | Narzędzie nie powinno być widoczne dla modelu, dopóki użytkownik go nie włączy. | Ekspozycję narzędzi przez `tools.allow`.                                                                                    |
| Żądania uprawnień Plugin          | Hook Plugin lub operacja należąca do Plugin musi zapytać przed wykonaniem jednej akcji. | Zatwierdzanie w czasie działania przez `plugin.approval.*`.                                                                 |
| Zatwierdzenia exec                | Polecenie hosta lub narzędzie podobne do powłoki wymaga zatwierdzenia operatora. | Politykę exec hosta i trwałe listy dozwolonych exec.                                                                        |
| Natywne żądania uprawnień Codex   | Codex pyta przed natywnymi akcjami powłoki, plików, MCP lub serwera aplikacji. | Obsługę zatwierdzania serwera aplikacji Codex lub natywnego hooka, kierowaną przez zatwierdzenia Plugin, gdy OpenClaw jest właścicielem promptu. |
| Wywołania zatwierdzeń MCP         | Serwer MCP Codex żąda zatwierdzenia wywołania narzędzia.                    | Odpowiedzi zatwierdzeń MCP przekazywane przez zatwierdzenia Plugin OpenClaw.                                                |

Opcjonalne narzędzia są bramką czasu wykrywania. Żądania uprawnień Plugin są bramką dla pojedynczego wywołania. Używaj obu, gdy wrażliwe narzędzie powinno wymagać wyraźnego włączenia, zanim model będzie mógł je zobaczyć, oraz zatwierdzenia przed wykonaniem akcji.

## Żądaj zatwierdzenia przed wywołaniem narzędzia

Większość promptów tworzonych przez Plugin powinna zaczynać się w hooku `before_tool_call`. Hook działa po tym, jak model wybierze narzędzie, a przed tym, jak OpenClaw je wykona:

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
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Pisz tekst promptu dla osoby, która będzie zatwierdzać akcję:

- `title` powinien być krótki i skupiony na akcji. Gateway akceptuje do 80 znaków.
- `description` powinien być konkretny i ograniczony zakresem. Gateway akceptuje do 256 znaków.
- Uwzględnij akcję, cel i ryzyko. Nie uwzględniaj sekretów, tokenów ani prywatnych danych, które nie powinny pojawić się na powierzchniach zatwierdzania w czacie.
- Używaj `severity: "critical"` tylko dla akcji, przy których błędna decyzja może spowodować szkody produkcyjne lub utratę danych.
- Używaj `allowedDecisions: ["allow-once", "deny"]`, gdy trwałe zaufanie jest niebezpieczne dla tej akcji.

## Zachowanie decyzji

OpenClaw tworzy oczekujące zatwierdzenie z ID `plugin:`, dostarcza je do dostępnych powierzchni zatwierdzania i czeka na decyzję.

| Decyzja           | Wynik                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Bieżące wywołanie jest kontynuowane.                                      |
| `allow-always`    | Bieżące wywołanie jest kontynuowane, a decyzja jest przekazywana do Plugin. |
| `deny`            | Wywołanie jest blokowane z wynikiem narzędzia oznaczającym odmowę.        |
| Przekroczenie czasu | Wywołanie jest blokowane, chyba że `timeoutBehavior` ma wartość `"allow"`. |
| Anulowanie        | Wywołanie jest blokowane, gdy przebieg zostanie przerwany.                |
| Brak ścieżki zatwierdzenia | Wywołanie jest blokowane, ponieważ żadna połączona powierzchnia zatwierdzania nie może go rozstrzygnąć. |

`allow-always` jest trwałe tylko wtedy, gdy żądający Plugin lub runtime implementuje tę trwałość. Dla zwykłych hooków `before_tool_call.requireApproval` OpenClaw traktuje `allow-once` i `allow-always` jako decyzje zatwierdzające dla bieżącego wywołania i przekazuje rozstrzygniętą wartość do `onResolution`. Jeśli Twój Plugin oferuje `allow-always`, udokumentuj i zaimplementuj dokładnie, którym przyszłym wywołaniom ufa.

Jeśli hook zwraca także `params`, OpenClaw stosuje te zmiany parametrów dopiero po pomyślnym zatwierdzeniu. Hook o niższym priorytecie nadal może zablokować wywołanie po tym, jak hook o wyższym priorytecie zażądał zatwierdzenia.

`allowedDecisions` ogranicza przyciski i polecenia pokazywane użytkownikowi. Gateway odrzuca próbę rozstrzygnięcia dla każdej decyzji, której żądanie nie oferowało.

## Kieruj prompty zatwierdzania

Prompty zatwierdzania mogą być rozstrzygane w lokalnych powierzchniach UI albo w kanałach czatu obsługujących zatwierdzanie. Aby przekazywać prompty zatwierdzania Plugin do jawnych celów czatu, skonfiguruj `approvals.plugin`:

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

`approvals.plugin` jest niezależne od `approvals.exec`. Włączenie przekazywania zatwierdzeń exec nie kieruje promptów zatwierdzania Plugin, a włączenie przekazywania zatwierdzeń Plugin nie zmienia polityki exec hosta.

Gdy prompt zawiera ręczny tekst zatwierdzania, rozstrzygnij go jedną z oferowanych decyzji:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Zobacz [Zaawansowane zatwierdzenia exec](/pl/tools/exec-approvals-advanced#plugin-approval-forwarding), aby poznać pełny model przekazywania, zachowanie zatwierdzania w tym samym czacie, natywne dostarczanie kanałami oraz reguły zatwierdzających specyficzne dla kanału.

## Natywne uprawnienia Codex

Natywne prompty uprawnień Codex mogą również przechodzić przez zatwierdzenia Plugin, ale mają inną własność niż hooki tworzone przez Plugin.

- Żądania zatwierdzenia serwera aplikacji Codex są kierowane przez OpenClaw po przeglądzie Codex.
- Natywny przekaźnik hooka `permission_request` może pytać przez `plugin.approval.request`, gdy ten przekaźnik jest włączony.
- Wywołania zatwierdzeń narzędzi MCP są kierowane przez zatwierdzenia Plugin, gdy Codex oznaczy `_meta.codex_approval_kind` jako `"mcp_tool_call"`.

Zobacz [Runtime uprzęży Codex](/pl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations), aby poznać zachowanie specyficzne dla Codex i reguły awaryjne.

## Rozwiązywanie problemów

**Narzędzie informuje, że zatwierdzenia Plugin są niedostępne.** Żaden UI zatwierdzania ani skonfigurowana ścieżka zatwierdzenia nie zaakceptowała żądania. Podłącz klienta obsługującego zatwierdzanie, użyj kanału obsługującego `/approve` w tym samym czacie albo skonfiguruj `approvals.plugin`.

**Pojawia się `allow-always`, ale następne wywołanie ponownie pokazuje prompt.** Ogólny przepływ zatwierdzania Plugin nie utrwala automatycznie zaufania dla dowolnych hooków. Utrwal zaufanie należące do Plugin w swoim Plugin po `onResolution("allow-always")` albo oferuj tylko `allow-once` i `deny`.

**`/approve` odrzuca decyzję.** Żądanie ograniczyło `allowedDecisions`. Użyj jednej z decyzji wypisanych w prompcie.

**Prompt Slack, Discord, Telegram lub Matrix jest kierowany inaczej niż zatwierdzenia exec.** Zatwierdzenia Plugin i zatwierdzenia exec używają oddzielnej konfiguracji i mogą używać różnych kontroli autoryzacji. Zweryfikuj `approvals.plugin` oraz obsługę zatwierdzeń Plugin w kanale zamiast sprawdzać tylko `approvals.exec`.

## Powiązane

- [Hooki Plugin](/pl/plugins/hooks#tool-call-policy)
- [Tworzenie Plugin](/pl/plugins/building-plugins#registering-agent-tools)
- [Zaawansowane zatwierdzenia exec](/pl/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protokół Gateway](/pl/gateway/protocol)
- [Runtime uprzęży Codex](/pl/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
