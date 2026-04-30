---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania w iMessage
summary: Starsza obsługa iMessage przez imsg (JSON-RPC przez stdio). Nowe konfiguracje powinny używać BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T09:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
W przypadku nowych wdrożeń iMessage użyj <a href="/pl/channels/bluebubbles">BlueBubbles</a>.

Integracja `imsg` jest starsza i może zostać usunięta w przyszłej wersji.
</Warning>

Status: starsza integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu).

<CardGroup cols={3}>
  <Card title="BlueBubbles (zalecane)" icon="message-circle" href="/pl/channels/bluebubbles">
    Preferowana ścieżka iMessage dla nowych konfiguracji.
  </Card>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne iMessage domyślnie używają trybu parowania.
  </Card>
  <Card title="Dokumentacja konfiguracji" icon="settings" href="/pl/gateway/config-channels#imessage">
    Pełna dokumentacja pól iMessage.
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

      <Step title="Uruchom gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Zatwierdź pierwsze parowanie wiadomości prywatnej (domyślne dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Żądania parowania wygasają po 1 godzinie.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Zdalny Mac przez SSH">
    OpenClaw wymaga tylko zgodnego ze stdio `cliPath`, więc możesz wskazać `cliPath` na skrypt opakowujący, który łączy się przez SSH ze zdalnym Makiem i uruchamia `imsg`.

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
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jeśli `remoteHost` nie jest ustawione, OpenClaw próbuje wykryć je automatycznie, analizując skrypt opakowujący SSH.
    `remoteHost` musi mieć postać `host` albo `user@host` (bez spacji ani opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta przekaźnika musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są sprawdzane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Aplikacja Wiadomości musi być zalogowana na Macu uruchamiającym `imsg`.
- Pełny dostęp do dysku jest wymagany dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Wiadomości).
- Uprawnienie automatyzacji jest wymagane do wysyłania wiadomości przez Messages.app.

<Tip>
Uprawnienia są przyznawane dla każdego kontekstu procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe polecenie interaktywne w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady wiadomości prywatnych">
    `channels.imessage.dmPolicy` kontroluje wiadomości bezpośrednie:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisy listy dozwolonych mogą być uchwytami lub celami czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Zasady grup + wzmianki">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślnie, gdy skonfigurowane)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Rezerwowe zachowanie w czasie działania: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grup iMessage wraca do `allowFrom`, gdy jest dostępne.
    Uwaga dotycząca czasu działania: jeśli `channels.imessage` całkowicie brakuje, czas działania wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli `channels.defaults.groupPolicy` jest ustawione).

    Bramkowanie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców bramkowania wzmianek nie da się egzekwować

    Polecenia kontrolne od autoryzowanych nadawców mogą pomijać bramkowanie wzmianek w grupach.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - Wiadomości prywatne używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości prywatne iMessage są zwijane do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage przy użyciu metadanych kanału/celu pochodzenia.

    Zachowanie wątków przypominających grupy:

    Niektóre wątki iMessage z wieloma uczestnikami mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania konwersacji ACP

Starsze czaty iMessage mogą też być powiązane z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości prywatnej lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji iMessage trafią do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu wiadomości prywatnej, takiego jak `+15555550123` albo `user@example.com`
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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Wzorce wdrożeń

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik macOS bota (osobna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Wiadomości.

    Typowy przepływ:

    1. Utwórz dedykowanego użytkownika macOS / zaloguj się na niego.
    2. Zaloguj się w Wiadomościach przy użyciu Apple ID bota dla tego użytkownika.
    3. Zainstaluj `imsg` dla tego użytkownika.
    4. Utwórz opakowanie SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Wskaż `channels.imessage.accounts.<id>.cliPath` i `.dbPath` na profil tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń GUI (Automatyzacja + Pełny dostęp do dysku) w sesji tego użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - gateway działa na Linux/VM
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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP działały nieinteraktywnie.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` zostało uzupełnione.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację dla poszczególnych kont w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i listy dozwolonych katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Media, dzielenie na części i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i multimedia">
    - pobieranie załączników przychodzących jest opcjonalne: `channels.imessage.includeAttachments`
    - zdalne ścieżki załączników można pobierać przez SCP, gdy `remoteHost` jest ustawione
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalnie)
      - `channels.imessage.remoteAttachmentRoots` (tryb zdalnego SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar multimediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących">
    - limit części tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie z pierwszeństwem akapitów)

  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Obsługiwane są też cele uchwytów:

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
  <Accordion title="Nie znaleziono imsg albo RPC nie jest obsługiwane">
    Zweryfikuj plik binarny i obsługę RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jeśli próba zgłasza brak obsługi RPC, zaktualizuj `imsg`.

  </Accordion>

  <Accordion title="Wiadomości prywatne są ignorowane">
    Sprawdź:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - zatwierdzenia parowania (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Wiadomości grupowe są ignorowane">
    Sprawdź:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - zachowanie listy dozwolonych `channels.imessage.groups`
    - konfigurację wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Zdalne załączniki nie działają">
    Sprawdź:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - uwierzytelnianie kluczem SSH/SCP z hosta gateway
    - klucz hosta istnieje w `~/.ssh/known_hosts` na hoście gateway
    - czytelność zdalnej ścieżki na Macu uruchamiającym Wiadomości

  </Accordion>

  <Accordion title="Pominięto monity uprawnień macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Potwierdź, że Pełny dostęp do dysku + Automatyzacja są przyznane dla kontekstu procesu, który uruchamia OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Odnośniki do dokumentacji konfiguracji

- [Dokumentacja konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)
- [BlueBubbles](/pl/channels/bluebubbles)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
