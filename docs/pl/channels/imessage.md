---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania iMessage
summary: Starsza obsługa iMessage za pośrednictwem `imsg` (JSON-RPC przez stdio). Nowe konfiguracje powinny używać BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (starsza wersja: imsg)

<Warning>
W przypadku nowych wdrożeń iMessage używaj <a href="/pl/channels/bluebubbles">BlueBubbles</a>.

Integracja `imsg` jest przestarzała i może zostać usunięta w przyszłym wydaniu.
</Warning>

Status: przestarzała zewnętrzna integracja CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu).

<CardGroup cols={3}>
  <Card title="BlueBubbles (zalecane)" icon="message-circle" href="/pl/channels/bluebubbles">
    Preferowana ścieżka iMessage dla nowych konfiguracji.
  </Card>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Prywatne wiadomości iMessage domyślnie używają trybu parowania.
  </Card>
  <Card title="Dokumentacja konfiguracji" icon="settings" href="/pl/gateway/configuration-reference#imessage">
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
      dbPath: "/Users/user/Library/Messages/chat.db",
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

      <Step title="Zatwierdź pierwsze parowanie prywatnej wiadomości (domyślne `dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    OpenClaw wymaga jedynie zgodnego ze stdio `cliPath`, więc możesz wskazać w `cliPath` skrypt opakowujący, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.

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
      // Opcjonalnie: nadpisz dozwolone katalogi główne załączników.
      // Domyślnie obejmują /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie, analizując skrypt opakowujący SSH.
    `remoteHost` musi mieć postać `host` lub `user@host` (bez spacji i opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są weryfikowane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Wiadomości muszą być zalogowane na Macu, na którym działa `imsg`.
- Full Disk Access jest wymagane dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Uprawnienie Automation jest wymagane do wysyłania wiadomości przez Messages.app.

<Tip>
Uprawnienia są przyznawane dla konkretnego kontekstu procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowo interaktywne polecenie w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# lub
imsg send <handle> "test"
```

</Tip>

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Polityka prywatnych wiadomości">
    `channels.imessage.dmPolicy` steruje bezpośrednimi wiadomościami:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole allowlist: `channels.imessage.allowFrom`.

    Wpisy allowlist mogą być identyfikatorami lub celami czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Polityka grup + wzmianki">
    `channels.imessage.groupPolicy` steruje obsługą grup:

    - `allowlist` (domyślnie po skonfigurowaniu)
    - `open`
    - `disabled`

    Allowlist nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Zachowanie awaryjne w runtime: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage w runtime korzysta z `allowFrom`, jeśli jest dostępne.
    Uwaga dotycząca runtime: jeśli `channels.imessage` jest całkowicie nieobecne, runtime przełącza się na `groupPolicy="allowlist"` i rejestruje ostrzeżenie (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Ograniczanie na podstawie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców ograniczanie na podstawie wzmianek nie może być egzekwowane

    Polecenia sterujące od autoryzowanych nadawców mogą omijać ograniczanie na podstawie wzmianek w grupach.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - Prywatne wiadomości używają trasowania bezpośredniego; grupy używają trasowania grupowego.
    - Przy domyślnym `session.dmScope=main` prywatne wiadomości iMessage są zwijane do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału/celu pochodzenia.

    Zachowanie wątków podobnych do grup:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli dany `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (ograniczanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage mogą być także powiązane z sesjami ACP.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` w prywatnej wiadomości lub dozwolonym czacie grupowym.
- Kolejne wiadomości w tej samej konwersacji iMessage będą kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego identyfikatora prywatnej wiadomości, takiego jak `+15555550123` lub `user@example.com`
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

Zobacz [ACP Agents](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Wzorce wdrożeniowe

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik macOS dla bota (oddzielna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odseparowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz/zaloguj dedykowanego użytkownika macOS.
    2. Zaloguj się do Messages za pomocą Apple ID bota na tym użytkowniku.
    3. Zainstaluj `imsg` dla tego użytkownika.
    4. Utwórz opakowanie SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Skieruj `channels.imessage.accounts.<id>.cliPath` i `.dbPath` do profilu tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń w GUI (Automation + Full Disk Access) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - gateway działa na Linuxie/VM
    - iMessage + `imsg` działa na Macu w Twojej sieci tailnet
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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP działały bez interakcji.
    Upewnij się najpierw, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby wypełnić `known_hosts`.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację per konto w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i allowlisty katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Multimedia, dzielenie na fragmenty i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - przyjmowanie załączników przychodzących jest opcjonalne: `channels.imessage.includeAttachments`
    - zdalne ścieżki załączników mogą być pobierane przez SCP, gdy ustawiono `remoteHost`
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (zdalny tryb SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar multimediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)
  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących na fragmenty">
    - limit fragmentu tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw po akapitach)
  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego trasowania)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są także cele w formie identyfikatorów:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Zapisy konfiguracji

iMessage domyślnie umożliwia zapisy konfiguracji inicjowane przez kanał (dla `/config set|unset`, gdy `commands.config: true`).

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
    Zweryfikuj plik binarny i obsługę RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jeśli sprawdzenie zgłasza brak obsługi RPC, zaktualizuj `imsg`.

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
    - zachowanie allowlist `channels.imessage.groups`
    - konfigurację wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Zdalne załączniki nie działają">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta gateway
    - czy klucz hosta istnieje w `~/.ssh/known_hosts` na hoście gateway
    - czytelność zdalnej ścieżki na Macu z uruchomionym Messages

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

- [Dokumentacja konfiguracji - iMessage](/pl/gateway/configuration-reference#imessage)
- [Konfiguracja gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)
- [BlueBubbles](/pl/channels/bluebubbles)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie prywatnych wiadomości i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i ograniczanie na podstawie wzmianek
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
