---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Starsza obsługa iMessage przez imsg (JSON-RPC przez stdio). W nowych wdrożeniach należy używać BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T13:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (starsze: imsg)

<Warning>
W przypadku nowych wdrożeń iMessage używaj <a href="/channels/bluebubbles">BlueBubbles</a>.

Integracja `imsg` jest starsza i może zostać usunięta w przyszłym wydaniu.
</Warning>

Status: starsza zewnętrzna integracja CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu).

<CardGroup cols={3}>
  <Card title="BlueBubbles (zalecane)" icon="message-circle" href="/channels/bluebubbles">
    Preferowana ścieżka iMessage dla nowych konfiguracji.
  </Card>
  <Card title="Parowanie" icon="link" href="/channels/pairing">
    Prywatne wiadomości iMessage domyślnie używają trybu parowania.
  </Card>
  <Card title="Dokumentacja konfiguracji" icon="settings" href="/gateway/configuration-reference#imessage">
    Pełna dokumentacja pól iMessage.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Lokalny Mac (szybka ścieżka)">
    <Steps>
      <Step title="Zainstaluj i sprawdź imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Skonfiguruj OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Uruchom gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Zatwierdź pierwsze parowanie w wiadomości prywatnej (domyślne dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    OpenClaw wymaga jedynie `cliPath` zgodnego ze stdio, więc możesz skierować `cliPath` na skrypt opakowujący, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Zalecana konfiguracja przy włączonych załącznikach:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // używane do pobierania załączników przez SCP
      includeAttachments: true,
      // Opcjonalnie: nadpisanie dozwolonych katalogów głównych załączników.
      // Domyślnie obejmuje /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie przez analizę skryptu opakowującego SSH.
    `remoteHost` musi mieć postać `host` lub `user@host` (bez spacji i opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są sprawdzane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Macu, na którym działa `imsg`.
- Dla kontekstu procesu uruchamiającego OpenClaw/`imsg` wymagany jest Full Disk Access (dostęp do bazy danych Messages).
- Do wysyłania wiadomości przez Messages.app wymagane jest uprawnienie Automation.

<Tip>
Uprawnienia są przyznawane dla każdego kontekstu procesu osobno. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowo interaktywne polecenie w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# lub
imsg send <handle> "test"
```

</Tip>

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady dla wiadomości prywatnych">
    `channels.imessage.dmPolicy` steruje wiadomościami prywatnymi:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole allowlisty: `channels.imessage.allowFrom`.

    Wpisami allowlisty mogą być identyfikatory lub cele czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Zasady dla grup i wzmianek">
    `channels.imessage.groupPolicy` steruje obsługą grup:

    - `allowlist` (domyślnie, gdy skonfigurowane)
    - `open`
    - `disabled`

    Allowlista nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Fallback środowiska uruchomieniowego: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage wraca do `allowFrom`, jeśli jest dostępne.
    Uwaga środowiska uruchomieniowego: jeśli `channels.imessage` całkowicie nie istnieje, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Ograniczanie według wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców egzekwowanie ograniczania według wzmianek nie jest możliwe

    Polecenia sterujące od autoryzowanych nadawców mogą omijać ograniczanie według wzmianek w grupach.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - Prywatne wiadomości używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` prywatne wiadomości iMessage są scalane do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału/docelowego odbiorcy z wiadomości źródłowej.

    Zachowanie wątków podobnych do grup:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jak ruch grupowy (ograniczanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage mogą być także powiązane z sesjami ACP.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości prywatnej lub dozwolonym czacie grupowym.
- Kolejne wiadomości w tej samej konwersacji iMessage są kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego identyfikatora wiadomości prywatnej, takiego jak `+15555550123` lub `user@example.com`
- `chat_id:<id>` (zalecane dla stabilnych powiązań grupowych)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Zobacz [Agenci ACP](/tools/acp-agents), aby poznać współdzielone zachowanie powiązań ACP.

## Wzorce wdrożeń

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik bota w macOS (oddzielna tożsamość iMessage)">
    Używaj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odseparowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz/zaloguj dedykowanego użytkownika macOS.
    2. Zaloguj się do Messages przy użyciu Apple ID bota w ramach tego użytkownika.
    3. Zainstaluj `imsg` dla tego użytkownika.
    4. Utwórz opakowanie SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` na profil tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń w GUI (Automation + Full Disk Access) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - gateway działa na Linuksie/VM
    - iMessage + `imsg` działa na Macu w Twoim tailnecie
    - opakowanie `cliPath` używa SSH do uruchamiania `imsg`
    - `remoteHost` umożliwia pobieranie załączników przez SCP

    Przykład:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Używaj kluczy SSH, aby zarówno SSH, jak i SCP działały bez interakcji.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby uzupełnić `known_hosts`.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację per konto w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i allowlisty katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Multimedia, dzielenie na części i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - przyjmowanie załączników przychodzących jest opcjonalne: `channels.imessage.includeAttachments`
    - ścieżki zdalnych załączników mogą być pobierane przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar multimediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)
  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących na części">
    - limit długości fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia na części: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw według akapitów)
  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są także cele będące identyfikatorami:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie pozwala na zapisy konfiguracji inicjowane przez kanał (dla `/config set|unset`, gdy `commands.config: true`).

Wyłącz:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie znaleziono imsg lub RPC nie jest obsługiwane">
    Zweryfikuj plik wykonywalny i obsługę RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jeśli test zgłasza brak obsługi RPC, zaktualizuj `imsg`.

  </Accordion>

  <Accordion title="Prywatne wiadomości są ignorowane">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia parowania (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Wiadomości grupowe są ignorowane">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - zachowanie allowlisty `channels.imessage.groups`
    - konfigurację wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Zdalne załączniki nie działają">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta gateway
    - czy klucz hosta istnieje w `~/.ssh/known_hosts` na hoście gateway
    - możliwość odczytu zdalnej ścieżki na Macu, na którym działa Messages

  </Accordion>

  <Accordion title="Pominięto monity o uprawnienia macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Potwierdź, że Full Disk Access i Automation są przyznane dla kontekstu procesu uruchamiającego OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Wskaźniki do dokumentacji konfiguracji

- [Dokumentacja konfiguracji - iMessage](/gateway/configuration-reference#imessage)
- [Konfiguracja Gateway](/gateway/configuration)
- [Parowanie](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Powiązane

- [Przegląd kanałów](/channels) — wszystkie obsługiwane kanały
- [Parowanie](/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/channels/groups) — zachowanie czatów grupowych i ograniczanie według wzmianek
- [Routing kanałów](/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
