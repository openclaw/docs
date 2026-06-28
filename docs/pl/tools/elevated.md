---
read_when:
    - Dostosowywanie domyślnych ustawień trybu podwyższonego, list dozwolonych lub zachowania poleceń ukośnikowych
    - Zrozumienie, jak agenci działający w piaskownicy mogą uzyskiwać dostęp do hosta
summary: 'Tryb wykonywania z podwyższonymi uprawnieniami: uruchamianie poleceń poza piaskownicą z agenta działającego w piaskownicy'
title: Tryb podwyższonych uprawnień
x-i18n:
    generated_at: "2026-05-06T09:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Gdy agent działa w piaskownicy, jego polecenia `exec` są ograniczone do
środowiska piaskownicy. **Tryb podwyższonych uprawnień** pozwala agentowi wyjść poza nią i zamiast tego uruchamiać polecenia
poza piaskownicą, z konfigurowalnymi bramkami zatwierdzania.

<Info>
  Tryb podwyższonych uprawnień zmienia zachowanie tylko wtedy, gdy agent jest **uruchomiony w piaskownicy**. W przypadku
  agentów bez piaskownicy exec już działa na hoście.
</Info>

## Dyrektywy

Kontroluj tryb podwyższonych uprawnień dla sesji za pomocą poleceń slash:

| Dyrektywa        | Co robi                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Uruchamia poza piaskownicą na skonfigurowanej ścieżce hosta, zachowuje zatwierdzenia    |
| `/elevated ask`  | To samo co `on` (alias)                                                   |
| `/elevated full` | Uruchamia poza piaskownicą na skonfigurowanej ścieżce hosta i pomija zatwierdzenia |
| `/elevated off`  | Wraca do wykonywania ograniczonego do piaskownicy                                   |

Dostępne także jako `/elev on|off|ask|full`.

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
    Wyślij wiadomość zawierającą tylko dyrektywę, aby ustawić domyślną wartość sesji:

    ```
    /elevated full
    ```

    Albo użyj jej w treści wiadomości (dotyczy tylko tej wiadomości):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Polecenia działają poza piaskownicą">
    Przy aktywnych podwyższonych uprawnieniach wywołania `exec` opuszczają piaskownicę. Efektywnym hostem jest
    domyślnie `gateway` albo `node`, gdy skonfigurowanym/sesyjnym celem exec jest
    `node`. W trybie `full` zatwierdzenia exec są pomijane. W trybie `on`/`ask`
    skonfigurowane reguły zatwierdzania nadal obowiązują.
  </Step>
</Steps>

## Kolejność rozstrzygania

1. **Dyrektywa w treści wiadomości** (dotyczy tylko tej wiadomości)
2. **Nadpisanie sesji** (ustawione przez wysłanie wiadomości zawierającej tylko dyrektywę)
3. **Globalna wartość domyślna** (`agents.defaults.elevatedDefault` w konfiguracji)

## Dostępność i listy dozwolonych

- **Globalna bramka**: `tools.elevated.enabled` (musi być `true`)
- **Lista dozwolonych nadawców**: `tools.elevated.allowFrom` z listami dla poszczególnych kanałów
- **Bramka dla agenta**: `agents.list[].tools.elevated.enabled` (może tylko dodatkowo ograniczać)
- **Lista dozwolonych dla agenta**: `agents.list[].tools.elevated.allowFrom` (nadawca musi pasować zarówno do globalnej, jak i tej dla agenta)
- **Awaryjne ustawienie Discord**: jeśli `tools.elevated.allowFrom.discord` jest pominięte, jako wartość awaryjna używane jest `channels.discord.allowFrom`
- **Wszystkie bramki muszą przejść pomyślnie**; w przeciwnym razie tryb podwyższonych uprawnień jest traktowany jako niedostępny

Formaty wpisów listy dozwolonych:

| Prefiks                  | Dopasowuje                         |
| ----------------------- | ------------------------------- |
| (brak)                  | Identyfikator nadawcy, E.164 lub pole From |
| `name:`                 | Wyświetlana nazwa nadawcy             |
| `username:`             | Nazwa użytkownika nadawcy                 |
| `tag:`                  | Tag nadawcy                      |
| `id:`, `from:`, `e164:` | Jawne wskazanie tożsamości     |

## Czego nie kontroluje tryb podwyższonych uprawnień

- **Polityka narzędzi**: jeśli `exec` jest zabroniony przez politykę narzędzi, tryb podwyższonych uprawnień nie może tego nadpisać.
- **Polityka wyboru hosta**: tryb podwyższonych uprawnień nie zmienia `auto` w swobodne nadpisanie między hostami. Używa skonfigurowanych/sesyjnych reguł celu exec, wybierając `node` tylko wtedy, gdy celem już jest `node`.
- **Niezależne od `/exec`**: dyrektywa `/exec` dostosowuje domyślne ustawienia exec dla sesji dla autoryzowanych nadawców i nie wymaga trybu podwyższonych uprawnień.

<Note>
  Polecenie czatu bash (prefiks `!`; alias `/bash`) to osobna bramka, która wymaga włączenia `tools.elevated` oprócz własnej flagi `tools.bash.enabled`. Wyłączenie trybu podwyższonych uprawnień blokuje również polecenia powłoki `!`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Wykonywanie poleceń powłoki przez agenta.
  </Card>
  <Card title="Zatwierdzenia exec" href="/pl/tools/exec-approvals" icon="shield">
    System zatwierdzania i list dozwolonych dla `exec`.
  </Card>
  <Card title="Piaskownica" href="/pl/gateway/sandboxing" icon="box">
    Konfiguracja piaskownicy na poziomie Gateway.
  </Card>
  <Card title="Piaskownica a polityka narzędzi a tryb podwyższonych uprawnień" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Jak trzy bramki składają się podczas wywołania narzędzia.
  </Card>
</CardGroup>
