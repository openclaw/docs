---
read_when:
    - Dostosowujesz domyślne ustawienia trybu podwyższonego, allowlisty lub zachowanie poleceń slash
    - Chcesz zrozumieć, jak sandboxowani agenci mogą uzyskać dostęp do hosta
summary: 'Tryb podwyższony exec: uruchamianie poleceń poza sandboxem z poziomu sandboxowanego agenta'
title: Tryb podwyższony
x-i18n:
    generated_at: "2026-04-05T14:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Tryb podwyższony

Gdy agent działa wewnątrz sandboxa, jego polecenia `exec` są ograniczone do
środowiska sandboxa. **Tryb podwyższony** pozwala agentowi wyjść poza to ograniczenie i uruchamiać polecenia
zamiast tego poza sandboxem, z konfigurowalnymi bramkami zatwierdzania.

<Info>
  Tryb podwyższony zmienia zachowanie tylko wtedy, gdy agent jest **sandboxowany**. Dla
  agentów niesandboxowanych `exec` i tak działa na hoście.
</Info>

## Dyrektywy

Kontroluj tryb podwyższony dla każdej sesji za pomocą poleceń slash:

| Dyrektywa       | Co robi                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `/elevated on`   | Uruchamia poza sandboxem na skonfigurowanej ścieżce hosta, zachowuje zatwierdzanie |
| `/elevated ask`  | To samo co `on` (alias)                                                 |
| `/elevated full` | Uruchamia poza sandboxem na skonfigurowanej ścieżce hosta i pomija zatwierdzanie |
| `/elevated off`  | Wraca do wykonywania ograniczonego do sandboxa                          |

Dostępne także jako `/elev on|off|ask|full`.

Wyślij `/elevated` bez argumentu, aby zobaczyć bieżący poziom.

## Jak to działa

<Steps>
  <Step title="Sprawdź dostępność">
    Tryb podwyższony musi być włączony w konfiguracji, a nadawca musi znajdować się na allowliście:

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
    Wyślij wiadomość zawierającą tylko dyrektywę, aby ustawić domyślne zachowanie dla sesji:

    ```
    /elevated full
    ```

    Możesz też użyć jej inline (dotyczy tylko tej wiadomości):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Polecenia są uruchamiane poza sandboxem">
    Gdy tryb podwyższony jest aktywny, wywołania `exec` wychodzą poza sandbox. Efektywnym hostem jest
    domyślnie `gateway`, albo `node`, gdy skonfigurowany/sesyjny cel `exec` to
    `node`. W trybie `full` zatwierdzanie `exec` jest pomijane. W trybie `on`/`ask`
    skonfigurowane reguły zatwierdzania nadal mają zastosowanie.
  </Step>
</Steps>

## Kolejność rozstrzygania

1. **Dyrektywa inline** w wiadomości (dotyczy tylko tej wiadomości)
2. **Nadpisanie sesji** (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę)
3. **Globalna wartość domyślna** (`agents.defaults.elevatedDefault` w konfiguracji)

## Dostępność i allowlisty

- **Globalna bramka**: `tools.elevated.enabled` (musi mieć wartość `true`)
- **Allowlista nadawców**: `tools.elevated.allowFrom` z listami dla poszczególnych kanałów
- **Bramka per-agent**: `agents.list[].tools.elevated.enabled` (może tylko dalej ograniczać)
- **Allowlista per-agent**: `agents.list[].tools.elevated.allowFrom` (nadawca musi pasować zarówno do globalnej, jak i per-agent)
- **Fallback Discord**: jeśli `tools.elevated.allowFrom.discord` jest pominięte, jako fallback używane jest `channels.discord.allowFrom`
- **Wszystkie bramki muszą przejść**; w przeciwnym razie tryb podwyższony jest traktowany jako niedostępny

Formaty wpisów allowlisty:

| Prefiks                 | Do czego pasuje                    |
| ----------------------- | ---------------------------------- |
| (brak)                  | ID nadawcy, E.164 lub pole From    |
| `name:`                 | Nazwa wyświetlana nadawcy          |
| `username:`             | Nazwa użytkownika nadawcy          |
| `tag:`                  | Tag nadawcy                        |
| `id:`, `from:`, `e164:` | Jawne wskazanie tożsamości         |

## Czego tryb podwyższony nie kontroluje

- **Polityka narzędzi**: jeśli `exec` jest zabronione przez politykę narzędzi, tryb podwyższony nie może tego nadpisać
- **Polityka wyboru hosta**: tryb podwyższony nie zamienia `auto` w swobodne nadpisanie między hostami. Używa reguł skonfigurowanego/sesyjnego celu `exec`, wybierając `node` tylko wtedy, gdy celem już jest `node`.
- **Oddzielnie od `/exec`**: dyrektywa `/exec` dostosowuje domyślne ustawienia `exec` dla sesji dla autoryzowanych nadawców i nie wymaga trybu podwyższonego

## Powiązane

- [Narzędzie exec](/tools/exec) — wykonywanie poleceń powłoki
- [Zatwierdzanie exec](/tools/exec-approvals) — system zatwierdzania i allowlist
- [Sandboxing](/pl/gateway/sandboxing) — konfiguracja sandboxa
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)
