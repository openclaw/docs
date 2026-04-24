---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Obsługa starszego iMessage przez imsg (JSON-RPC przez stdio). Nowe konfiguracje powinny używać BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T08:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (starsza wersja: imsg)

<Warning>
W przypadku nowych wdrożeń iMessage używaj <a href="/pl/channels/bluebubbles">BlueBubbles</a>.

Integracja `imsg` jest starsza i może zostać usunięta w przyszłym wydaniu.
</Warning>

Status: starsza zewnętrzna integracja CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu).

<CardGroup cols={3}>
  <Card title="BlueBubbles (zalecane)" icon="message-circle" href="/pl/channels/bluebubbles">
    Preferowana ścieżka iMessage dla nowych konfiguracji.
  </Card>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Wiadomości DM iMessage domyślnie używają trybu pairingu.
  </Card>
  <Card title="Odwołanie do konfiguracji" icon="settings" href="/pl/gateway/config-channels#imessage">
    Pełne odwołanie do pól iMessage.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Lokalny Mac (szybka ścieżka)">
    <Steps>
      <Step title="Zainstaluj i zweryfikuj imsg">

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
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Zatwierdź pierwszy pairing DM (domyślna `dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania pairingu wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    OpenClaw wymaga jedynie zgodnego ze stdio `cliPath`, więc możesz wskazać w `cliPath` skrypt opakowujący, który łączy się przez SSH ze zdalnym Mac i uruchamia `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Zalecana konfiguracja, gdy załączniki są włączone:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // używane do pobierania załączników przez SCP
      includeAttachments: true,
      // Opcjonalne: nadpisanie dozwolonych katalogów głównych załączników.
      // Domyślne obejmują /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie przez analizę skryptu opakowującego SSH.
    `remoteHost` musi mieć postać `host` lub `user@host` (bez spacji i opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są walidowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Mac, na którym działa `imsg`.
- Wymagany jest Full Disk Access dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Do wysyłania wiadomości przez Messages.app wymagane jest uprawnienie Automation.

<Tip>
Uprawnienia są przyznawane dla kontekstu procesu. Jeśli Gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe interaktywne polecenie w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# lub
imsg send <handle> "test"
```

</Tip>

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasada DM">
    `channels.imessage.dmPolicy` kontroluje wiadomości bezpośrednie:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisami listy dozwolonych mogą być handle lub cele czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Zasada grup i wzmianki">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślnie po skonfigurowaniu)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Rezerwa w czasie działania: jeśli `groupAllowFrom` nie jest ustawione, sprawdzenia nadawców grup iMessage w czasie działania korzystają z `allowFrom`, jeśli jest dostępne.
    Uwaga dotycząca działania: jeśli `channels.imessage` jest całkowicie nieobecne, środowisko działania wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Ograniczanie wzmiankami dla grup:

    - iMessage nie ma natywnych metadanych wzmianki
    - wykrywanie wzmianki używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, rezerwa: `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców egzekwowanie ograniczania wzmiankami nie jest możliwe

    Polecenia sterujące od autoryzowanych nadawców mogą omijać ograniczanie wzmiankami w grupach.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - DM używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości DM iMessage są zwijane do głównej sesji agenta.
    - Sesje grupowe są odizolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału/celu źródłowego.

    Zachowanie wątków podobnych do grup:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli taki `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jak ruch grupowy (ograniczanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania rozmów ACP

Starsze czaty iMessage można również powiązać z sesjami ACP.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości DM lub dozwolonym czacie grupowym.
- Kolejne wiadomości w tej samej rozmowie iMessage będą kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują to samo powiązane sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego handle DM, takiego jak `+15555550123` lub `user@example.com`
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

Informacje o współdzielonym zachowaniu powiązań ACP znajdziesz w [ACP Agents](/pl/tools/acp-agents).

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik bota macOS (oddzielna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz i zaloguj dedykowanego użytkownika macOS.
    2. Zaloguj się do Messages przy użyciu Apple ID bota na tym użytkowniku.
    3. Zainstaluj `imsg` dla tego użytkownika.
    4. Utwórz opakowanie SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Ustaw `channels.imessage.accounts.<id>.cliPath` i `.dbPath` na profil tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń w GUI (Automation + Full Disk Access) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - Gateway działa na Linux/VM
    - iMessage + `imsg` działa na Mac w Twojej sieci tailnet
    - opakowanie `cliPath` używa SSH do uruchomienia `imsg`
    - `remoteHost` włącza pobieranie załączników przez SCP

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

    Używaj kluczy SSH, aby zarówno SSH, jak i SCP były nieinteraktywne.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` zostało wypełnione.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację per konto w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii oraz listy dozwolonych katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Multimedia, dzielenie i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - pobieranie przychodzących załączników jest opcjonalne: `channels.imessage.includeAttachments`
    - zdalne ścieżki załączników mogą być pobierane przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar wychodzących multimediów używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)
  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw po akapitach)
  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są również cele oparte na handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie zezwala na zapisy konfiguracji inicjowane przez kanał (dla `/config set|unset`, gdy `commands.config: true`).

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
    Zweryfikuj binarkę i obsługę RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jeśli probe zgłasza brak obsługi RPC, zaktualizuj `imsg`.

  </Accordion>

  <Accordion title="Wiadomości DM są ignorowane">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia pairingu (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Wiadomości grupowe są ignorowane">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - zachowanie listy dozwolonych `channels.imessage.groups`
    - konfigurację wzorców wzmianki (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Zdalne załączniki nie działają">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta Gateway
    - czy klucz hosta istnieje w `~/.ssh/known_hosts` na hoście Gateway
    - możliwość odczytu zdalnej ścieżki na Mac, na którym działa Messages

  </Accordion>

  <Accordion title="Pominięto monity o uprawnienia macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Potwierdź, że Full Disk Access + Automation są przyznane dla kontekstu procesu uruchamiającego OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Wskaźniki odwołania do konfiguracji

- [Odwołanie do konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Pairing](/pl/channels/pairing)
- [BlueBubbles](/pl/channels/bluebubbles)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie wzmiankami
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
