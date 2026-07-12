---
read_when:
    - Dostosowywanie ustawień domyślnych trybu podwyższonych uprawnień, list dozwolonych elementów lub działania poleceń z ukośnikiem
    - Jak agenci działający w piaskownicy mogą uzyskiwać dostęp do hosta
summary: 'Tryb wykonywania z podwyższonymi uprawnieniami: uruchamianie poleceń poza piaskownicą z poziomu agenta działającego w piaskownicy'
title: Tryb podwyższonych uprawnień
x-i18n:
    generated_at: "2026-07-12T15:41:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Gdy agent działa w piaskownicy, jego polecenia `exec` są ograniczone do środowiska piaskownicy. **Tryb podwyższonych uprawnień** pozwala agentowi opuścić piaskownicę i wykonywać polecenia poza nią, z konfigurowalnymi mechanizmami zatwierdzania.

<Info>
  Tryb podwyższonych uprawnień zmienia zachowanie tylko wtedy, gdy agent działa **w piaskownicy**. W przypadku agentów działających bez piaskownicy polecenia exec są już wykonywane na hoście.
</Info>

## Dyrektywy

Steruj trybem podwyższonych uprawnień dla poszczególnych sesji za pomocą poleceń z ukośnikiem:

| Dyrektywa        | Działanie                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Wykonuje polecenia poza piaskownicą w skonfigurowanej ścieżce hosta i zachowuje zatwierdzanie                                                             |
| `/elevated ask`  | To samo co `on` (alias)                                                                                                                                  |
| `/elevated full` | Wykonuje polecenia poza piaskownicą w skonfigurowanej ścieżce hosta i pomija zatwierdzanie, gdy zasady zatwierdzania dla trybu/hosta już na to pozwalają |
| `/elevated off`  | Przywraca wykonywanie poleceń ograniczone do piaskownicy                                                                                                  |

Dostępna jest również skrócona forma `/elev on|off|ask|full`.

Wyślij `/elevated` bez argumentu, aby zobaczyć bieżący poziom.

## Jak to działa

<Steps>
  <Step title="Sprawdź dostępność">
    Tryb podwyższonych uprawnień musi być włączony w konfiguracji, a nadawca musi znajdować się na liście dozwolonych:

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
    Wyślij wiadomość zawierającą wyłącznie dyrektywę, aby ustawić wartość domyślną sesji:

    ```
    /elevated full
    ```

    Możesz też użyć jej w treści wiadomości (dotyczy tylko tej wiadomości):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Polecenia są wykonywane poza piaskownicą">
    Gdy tryb podwyższonych uprawnień jest aktywny, wywołania `exec` opuszczają piaskownicę. Domyślnym efektywnym hostem jest
    `gateway`, a gdy skonfigurowanym lub sesyjnym celem exec jest
    `node` — hostem jest `node`. W trybie `full` zatwierdzanie poleceń exec jest pomijane, gdy obowiązujące
    zasady zatwierdzania dla trybu/hosta exec są już całkowicie liberalne (bezpieczeństwo `full`,
    pytanie `off`); w przeciwnym razie nadal obowiązują zwykłe zasady zatwierdzania. W trybie
    `on`/`ask` skonfigurowane reguły zatwierdzania obowiązują zawsze.
  </Step>
</Steps>

## Kolejność rozstrzygania

1. **Dyrektywa w treści** wiadomości (dotyczy tylko tej wiadomości)
2. **Nadpisanie sesji** (ustawione przez wysłanie wiadomości zawierającej wyłącznie dyrektywę)
3. **Globalna wartość domyślna** (`agents.defaults.elevatedDefault` w konfiguracji)

## Dostępność i listy dozwolonych

- **Brama globalna**: `tools.elevated.enabled` (musi mieć wartość `true`)
- **Lista dozwolonych nadawców**: `tools.elevated.allowFrom` z listami dla poszczególnych kanałów
- **Brama dla agenta**: `agents.list[].tools.elevated.enabled` (może jedynie dodatkowo ograniczać dostęp; zarówno brama globalna, jak i brama dla agenta muszą mieć wartość `true`)
- **Lista dozwolonych dla agenta**: `agents.list[].tools.elevated.allowFrom` (nadawca musi pasować zarówno do listy globalnej, jak i listy dla agenta)
- **Zastępcza lista dozwolonych udostępniana przez kanał**: pluginy kanałów mogą opcjonalnie dostarczyć zastępczą listę dozwolonych za pośrednictwem punktu rozszerzenia adaptera SDK, używaną, gdy `tools.elevated.allowFrom.<provider>` nie jest skonfigurowane. Żaden wbudowany kanał obecnie nie implementuje tego punktu rozszerzenia, dlatego w praktyce każdy dostawca wymaga dziś jawnego wpisu `tools.elevated.allowFrom.<provider>`.
- **Wszystkie bramy muszą zezwolić na dostęp**; w przeciwnym razie tryb podwyższonych uprawnień jest uznawany za niedostępny

Formaty wpisów na liście dozwolonych:

| Prefiks                 | Dopasowanie                           |
| ----------------------- | ------------------------------------- |
| (brak)                  | Identyfikator nadawcy, E.164 lub pole From |
| `name:`                 | Wyświetlana nazwa nadawcy             |
| `username:`             | Nazwa użytkownika nadawcy             |
| `tag:`                  | Znacznik nadawcy                      |
| `id:`, `from:`, `e164:` | Jawne wskazanie tożsamości            |

## Czego nie kontroluje tryb podwyższonych uprawnień

- **Zasady narzędzi**: jeśli zasady narzędzi zabraniają użycia `exec`, tryb podwyższonych uprawnień nie może tego zmienić.
- **Zasady wyboru hosta**: tryb podwyższonych uprawnień nie zmienia ustawienia `auto` w swobodne przełączanie między hostami. Korzysta ze skonfigurowanych lub sesyjnych reguł celu exec i wybiera `node` tylko wtedy, gdy celem już jest `node`.
- **Niezależność od `/exec`**: dyrektywa `/exec` dostosowuje sesyjne wartości domyślne exec (host, bezpieczeństwo, pytanie, węzeł) dla upoważnionych nadawców i nie wymaga trybu podwyższonych uprawnień.

<Note>
  Polecenie czatu bash (prefiks `!`; alias `/bash`) podlega osobnej bramie, która oprócz własnej flagi `tools.bash.enabled` wymaga włączenia `tools.elevated`. Wyłączenie trybu podwyższonych uprawnień blokuje również polecenia powłoki `!`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Wykonywanie poleceń powłoki przez agenta.
  </Card>
  <Card title="Zatwierdzanie exec" href="/pl/tools/exec-approvals" icon="shield">
    System zatwierdzania i list dozwolonych dla `exec`.
  </Card>
  <Card title="Piaskownica" href="/pl/gateway/sandboxing" icon="box">
    Konfiguracja piaskownicy na poziomie Gateway.
  </Card>
  <Card title="Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Sposób współdziałania tych trzech bram podczas wywołania narzędzia.
  </Card>
</CardGroup>
