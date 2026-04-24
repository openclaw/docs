---
read_when:
    - Dostosowywanie wartości domyślnych trybu elevated, allowlist lub zachowania poleceń slash
    - Zrozumienie, jak sandboxowane agenty mogą uzyskiwać dostęp do hosta
summary: 'Tryb elevated exec: uruchamianie poleceń poza sandboxem z poziomu sandboxowanego agenta'
title: Tryb elevated
x-i18n:
    generated_at: "2026-04-24T09:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Gdy agent działa w sandboxie, jego polecenia `exec` są ograniczone do
środowiska sandboxa. **Tryb elevated** pozwala agentowi wyjść poza sandbox i uruchamiać polecenia
zamiast tego poza sandboxem, z konfigurowalnymi bramkami zatwierdzeń.

<Info>
  Tryb elevated zmienia zachowanie tylko wtedy, gdy agent jest **sandboxowany**. Dla
  agentów bez sandboxa exec już działa na hoście.
</Info>

## Dyrektywy

Steruj trybem elevated per sesja za pomocą poleceń slash:

| Directive        | What it does                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Uruchamiaj poza sandboxem na skonfigurowanej ścieżce hosta, zachowaj zatwierdzenia    |
| `/elevated ask`  | To samo co `on` (alias)                                                   |
| `/elevated full` | Uruchamiaj poza sandboxem na skonfigurowanej ścieżce hosta i pomijaj zatwierdzenia |
| `/elevated off`  | Wróć do wykonywania ograniczonego do sandboxa                                   |

Dostępne również jako `/elev on|off|ask|full`.

Wyślij `/elevated` bez argumentu, aby zobaczyć bieżący poziom.

## Jak to działa

<Steps>
  <Step title="Sprawdź dostępność">
    Elevated musi być włączony w konfiguracji, a nadawca musi znajdować się na allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Ustaw poziom">
    Wyślij wiadomość zawierającą tylko dyrektywę, aby ustawić domyślną wartość sesji:

    ```
    /elevated full
    ```

    Albo użyj jej inline (dotyczy tylko tej wiadomości):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Polecenia uruchamiają się poza sandboxem">
    Gdy elevated jest aktywne, wywołania `exec` opuszczają sandbox. Efektywnym hostem jest
    domyślnie `gateway`, albo `node`, gdy skonfigurowanym/per-sesja celem exec jest
    `node`. W trybie `full` zatwierdzenia exec są pomijane. W trybie `on`/`ask`
    nadal obowiązują skonfigurowane reguły zatwierdzeń.
  </Step>
</Steps>

## Kolejność rozstrzygania

1. **Dyrektywa inline** w wiadomości (dotyczy tylko tej wiadomości)
2. **Nadpisanie sesji** (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę)
3. **Globalna wartość domyślna** (`agents.defaults.elevatedDefault` w konfiguracji)

## Dostępność i allowlisty

- **Globalna bramka**: `tools.elevated.enabled` (musi mieć wartość `true`)
- **Allowlist nadawcy**: `tools.elevated.allowFrom` z listami per kanał
- **Bramka per agent**: `agents.list[].tools.elevated.enabled` (może tylko dodatkowo ograniczać)
- **Allowlist per agent**: `agents.list[].tools.elevated.allowFrom` (nadawca musi pasować zarówno do globalnej, jak i per agent)
- **Fallback Discord**: jeśli `tools.elevated.allowFrom.discord` jest pominięte, jako fallback używane jest `channels.discord.allowFrom`
- **Wszystkie bramki muszą przejść**; w przeciwnym razie elevated jest traktowane jako niedostępne

Formaty wpisów allowlist:

| Prefix                  | Matches                         |
| ----------------------- | ------------------------------- |
| (brak)                  | ID nadawcy, E.164 lub pole From |
| `name:`                 | Nazwa wyświetlana nadawcy             |
| `username:`             | Nazwa użytkownika nadawcy                 |
| `tag:`                  | Tag nadawcy                      |
| `id:`, `from:`, `e164:` | Jawne kierowanie na tożsamość     |

## Czego elevated nie kontroluje

- **Polityka narzędzi**: jeśli `exec` jest zabronione przez politykę narzędzi, elevated nie może tego nadpisać
- **Polityka wyboru hosta**: elevated nie zamienia `auto` w dowolne nadpisanie między hostami. Używa skonfigurowanych/per-sesja reguł celu exec, wybierając `node` tylko wtedy, gdy celem jest już `node`.
- **Osobne od `/exec`**: dyrektywa `/exec` dostosowuje domyślne ustawienia exec per sesja dla autoryzowanych nadawców i nie wymaga trybu elevated

## Powiązane

- [Narzędzie Exec](/pl/tools/exec) — wykonywanie poleceń shella
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — system zatwierdzeń i allowlist
- [Sandboxing](/pl/gateway/sandboxing) — konfiguracja sandboxa
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
