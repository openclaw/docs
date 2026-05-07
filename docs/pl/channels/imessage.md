---
read_when:
    - Konfigurowanie obsługi iMessage
    - Debugowanie wysyłania/odbierania w iMessage
summary: Natywna obsługa iMessage za pośrednictwem imsg (JSON-RPC przez stdio). Preferowane dla nowych konfiguracji OpenClaw iMessage, gdy wymagania hosta są spełnione.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
W przypadku nowych wdrożeń OpenClaw iMessage zacznij tutaj, gdy możesz uruchomić `imsg` na hoście macOS Messages z aktywnym logowaniem. BlueBubbles pozostaje dostępne jako starsza opcja awaryjna dla istniejących konfiguracji zależnych od jego serwera HTTP, webhooków lub bogatszych działań prywatnego API.
</Note>

Status: natywna integracja z zewnętrznym CLI. Gateway uruchamia `imsg rpc` i komunikuje się przez JSON-RPC na stdio (bez osobnego demona/portu).

<CardGroup cols={3}>
  <Card title="BlueBubbles (starsza opcja awaryjna)" icon="message-circle" href="/pl/channels/bluebubbles">
    Używaj go nadal dla istniejącego routingu opartego na BlueBubbles; unikaj go w nowych konfiguracjach, gdy pasuje imsg.
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
    OpenClaw wymaga tylko zgodnej ze stdio wartości `cliPath`, więc możesz wskazać `cliPath` na skrypt opakowujący, który łączy się przez SSH ze zdalnym komputerem Mac i uruchamia `imsg`.

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
    `remoteHost` musi mieć postać `host` lub `user@host` (bez spacji ani opcji SSH).
    OpenClaw używa ścisłego sprawdzania klucza hosta dla SCP, więc klucz hosta pośredniczącego musi już istnieć w `~/.ssh/known_hosts`.
    Ścieżki załączników są sprawdzane względem dozwolonych katalogów głównych (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Wymagania i uprawnienia (macOS)

- Messages musi być zalogowane na Macu uruchamiającym `imsg`.
- Full Disk Access jest wymagany dla kontekstu procesu uruchamiającego OpenClaw/`imsg` (dostęp do bazy danych Messages).
- Uprawnienie Automation jest wymagane do wysyłania wiadomości przez Messages.app.

<Tip>
Uprawnienia są przyznawane dla każdego kontekstu procesu. Jeśli gateway działa bez interfejsu (LaunchAgent/SSH), uruchom jednorazowe interaktywne polecenie w tym samym kontekście, aby wywołać monity:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady wiadomości prywatnych">
    `channels.imessage.dmPolicy` kontroluje wiadomości prywatne:

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    Pole listy dozwolonych: `channels.imessage.allowFrom`.

    Wpisy listy dozwolonych mogą być uchwytami lub celami czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Zasady grup + wzmianki">
    `channels.imessage.groupPolicy` kontroluje obsługę grup:

    - `allowlist` (domyślne po skonfigurowaniu)
    - `open`
    - `disabled`

    Lista dozwolonych nadawców grupowych: `channels.imessage.groupAllowFrom`.

    Awaryjne zachowanie runtime: jeśli `groupAllowFrom` nie jest ustawione, sprawdzanie nadawców grupowych iMessage przechodzi na `allowFrom`, gdy jest dostępne.
    Uwaga dotycząca runtime: jeśli `channels.imessage` całkowicie brakuje, runtime przechodzi na `groupPolicy="allowlist"` i zapisuje ostrzeżenie (nawet jeśli `channels.defaults.groupPolicy` jest ustawione).

    Bramkowanie wzmianek dla grup:

    - iMessage nie ma natywnych metadanych wzmianek
    - wykrywanie wzmianek używa wzorców regex (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - bez skonfigurowanych wzorców bramkowania wzmianek nie da się wymusić

    Polecenia kontrolne od autoryzowanych nadawców mogą omijać bramkowanie wzmianek w grupach.

  </Tab>

  <Tab title="Sesje i deterministyczne odpowiedzi">
    - Wiadomości prywatne używają routingu bezpośredniego; grupy używają routingu grupowego.
    - Przy domyślnym `session.dmScope=main` wiadomości prywatne iMessage trafiają do głównej sesji agenta.
    - Sesje grupowe są izolowane (`agent:<agentId>:imessage:group:<chat_id>`).
    - Odpowiedzi są kierowane z powrotem do iMessage z użyciem metadanych kanału/celu pochodzenia.

    Zachowanie wątków podobnych do grupowych:

    Niektóre wieloosobowe wątki iMessage mogą przychodzić z `is_group=false`.
    Jeśli ten `chat_id` jest jawnie skonfigurowany w `channels.imessage.groups`, OpenClaw traktuje go jako ruch grupowy (bramkowanie grupowe + izolacja sesji grupowej).

  </Tab>
</Tabs>

## Powiązania rozmów ACP

Starsze czaty iMessage można też powiązać z sesjami ACP.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości prywatnej lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej rozmowie iMessage są kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "imessage"`.

`match.peer.id` może używać:

- znormalizowanego uchwytu wiadomości prywatnej, takiego jak `+15555550123` lub `user@example.com`
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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać współdzielone zachowanie powiązań ACP.

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany użytkownik bota macOS (osobna tożsamość iMessage)">
    Użyj dedykowanego Apple ID i użytkownika macOS, aby ruch bota był odizolowany od Twojego osobistego profilu Messages.

    Typowy przepływ:

    1. Utwórz/zaloguj dedykowanego użytkownika macOS.
    2. Zaloguj się do Messages z Apple ID bota w tym użytkowniku.
    3. Zainstaluj `imsg` w tym użytkowniku.
    4. Utwórz skrypt opakowujący SSH, aby OpenClaw mógł uruchamiać `imsg` w kontekście tego użytkownika.
    5. Wskaż `channels.imessage.accounts.<id>.cliPath` i `.dbPath` na profil tego użytkownika.

    Pierwsze uruchomienie może wymagać zatwierdzeń GUI (Automation + Full Disk Access) w sesji użytkownika bota.

  </Accordion>

  <Accordion title="Zdalny Mac przez Tailscale (przykład)">
    Typowa topologia:

    - gateway działa na Linux/VM
    - iMessage + `imsg` działa na Macu w Twojej sieci tailnet
    - skrypt opakowujący `cliPath` używa SSH do uruchomienia `imsg`
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

    Użyj kluczy SSH, aby zarówno SSH, jak i SCP były nieinteraktywne.
    Najpierw upewnij się, że klucz hosta jest zaufany (na przykład `ssh bot@mac-mini.tailnet-1234.ts.net`), aby `known_hosts` został uzupełniony.

  </Accordion>

  <Accordion title="Wzorzec wielu kont">
    iMessage obsługuje konfigurację dla każdego konta w `channels.imessage.accounts`.

    Każde konto może nadpisywać pola takie jak `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ustawienia historii i listy dozwolonych katalogów głównych załączników.

  </Accordion>
</AccordionGroup>

## Media, dzielenie na części i cele dostarczania

<AccordionGroup>
  <Accordion title="Załączniki i media">
    - pobieranie załączników przychodzących jest opcjonalne: `channels.imessage.includeAttachments`
    - zdalne ścieżki załączników można pobierać przez SCP, gdy `remoteHost` jest ustawione
    - ścieżki załączników muszą pasować do dozwolonych katalogów głównych:
      - `channels.imessage.attachmentRoots` (lokalne)
      - `channels.imessage.remoteAttachmentRoots` (tryb zdalnego SCP)
      - domyślny wzorzec katalogu głównego: `/Users/*/Library/Messages/Attachments`
    - SCP używa ścisłego sprawdzania klucza hosta (`StrictHostKeyChecking=yes`)
    - rozmiar mediów wychodzących używa `channels.imessage.mediaMaxMb` (domyślnie 16 MB)

  </Accordion>

  <Accordion title="Dzielenie wiadomości wychodzących na części">
    - limit części tekstu: `channels.imessage.textChunkLimit` (domyślnie 4000)
    - tryb dzielenia na części: `channels.imessage.chunkMode`
      - `length` (domyślnie)
      - `newline` (dzielenie najpierw według akapitów)

  </Accordion>

  <Accordion title="Formaty adresowania">
    Preferowane jawne cele:

    - `chat_id:123` (zalecane dla stabilnego routingu)
    - `chat_guid:...`
    - `chat_identifier:...`

    Cele uchwytów też są obsługiwane:

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
    - możliwość odczytu zdalnej ścieżki na Macu uruchamiającym Messages

  </Accordion>

  <Accordion title="Pominięto monity uprawnień macOS">
    Uruchom ponownie w interaktywnym terminalu GUI w tym samym kontekście użytkownika/sesji i zatwierdź monity:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Potwierdź, że Full Disk Access + Automation są przyznane dla kontekstu procesu, który uruchamia OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Odnośniki do dokumentacji konfiguracji

- [Dokumentacja konfiguracji - iMessage](/pl/gateway/config-channels#imessage)
- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Parowanie](/pl/channels/pairing)
- [BlueBubbles](/pl/channels/bluebubbles)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i kontrola wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
