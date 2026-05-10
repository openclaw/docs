---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing wieloagentowy: odizolowani agenci, konta kanałów i powiązania'
title: Routing wieloagentowy
x-i18n:
    generated_at: "2026-05-10T19:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Uruchom wiele _izolowanych_ agentów — każdy z własnym workspace, katalogiem stanu (`agentDir`) i historią sesji — oraz wiele kont kanałów (np. dwa konta WhatsApp) w jednym działającym Gateway. Wiadomości przychodzące są kierowane do właściwego agenta przez wiązania.

**Agent** oznacza tutaj pełny zakres dla danej persony: pliki workspace, profile uwierzytelniania, rejestr modeli i magazyn sesji. `agentDir` to katalog stanu na dysku, który przechowuje tę konfigurację per agent w `~/.openclaw/agents/<agentId>/`. **Wiązanie** mapuje konto kanału (np. workspace Slack albo numer WhatsApp) na jednego z tych agentów.

## Czym jest „jeden agent”?

**Agent** to w pełni wydzielony mózg z własnymi:

- **Workspace** (pliki, AGENTS.md/SOUL.md/USER.md, notatki lokalne, reguły persony).
- **Katalogiem stanu** (`agentDir`) na profile uwierzytelniania, rejestr modeli i konfigurację per agent.
- **Magazynem sesji** (historia czatu + stan routingu) pod `~/.openclaw/agents/<agentId>/sessions`.

Profile uwierzytelniania są **per agent**. Każdy agent czyta z własnego:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` jest tutaj także bezpieczniejszą ścieżką przywoływania kontekstu między sesjami: zwraca ograniczony, oczyszczony widok, a nie surowy zrzut transkrypcji. Przywoływanie po stronie asystenta usuwa znaczniki myślenia, rusztowanie `<relevant-memories>`, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), zdegradowane rusztowanie wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/pełnej szerokości oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/ucięciem.
</Note>

<Warning>
Nigdy nie używaj ponownie `agentDir` między agentami (powoduje to kolizje uwierzytelniania/sesji). Agenci
mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają
profilu lokalnego, ale OpenClaw nie klonuje tokenów odświeżania OAuth do
magazynu agenta dodatkowego. Jeśli chcesz niezależne konto OAuth, zaloguj się z poziomu
tego agenta; jeśli kopiujesz poświadczenia ręcznie, kopiuj tylko przenośne statyczne
profile `api_key` lub `token`.
</Warning>

Skills są ładowane z workspace każdego agenta oraz współdzielonych katalogów głównych, takich jak `~/.openclaw/skills`, a następnie filtrowane według efektywnej listy dozwolonych Skills agenta, gdy jest skonfigurowana. Użyj `agents.defaults.skills` jako współdzielonej bazy i `agents.list[].skills` jako zamiany per agent. Zobacz [Skills: per agent a współdzielone](/pl/tools/skills#per-agent-vs-shared-skills) oraz [Skills: listy dozwolonych Skills agenta](/pl/tools/skills#agent-skill-allowlists).

Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

<Note>
**Uwaga dotycząca workspace:** workspace każdego agenta jest **domyślnym cwd**, a nie twardym sandboxem. Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą sięgać do innych lokalizacji hosta, chyba że włączono sandboxing. Zobacz [Sandboxing](/pl/gateway/sandboxing).
</Note>

## Ścieżki (szybka mapa)

- Konfiguracja: `~/.openclaw/openclaw.json` (albo `OPENCLAW_CONFIG_PATH`)
- Katalog stanu: `~/.openclaw` (albo `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (albo `~/.openclaw/workspace-<agentId>`)
- Katalog agenta: `~/.openclaw/agents/<agentId>/agent` (albo `agents.list[].agentDir`)
- Sesje: `~/.openclaw/agents/<agentId>/sessions`

### Tryb pojedynczego agenta (domyślny)

Jeśli nic nie zrobisz, OpenClaw uruchamia jednego agenta:

- `agentId` domyślnie ma wartość **`main`**.
- Sesje są kluczowane jako `agent:main:<mainKey>`.
- Workspace domyślnie ma wartość `~/.openclaw/workspace` (albo `~/.openclaw/workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`).
- Stan domyślnie ma wartość `~/.openclaw/agents/main/agent`.

## Pomocnik agenta

Użyj kreatora agentów, aby dodać nowego izolowanego agenta:

```bash
openclaw agents add work
```

Następnie dodaj `bindings` (albo pozwól kreatorowi to zrobić), aby kierować wiadomości przychodzące.

Zweryfikuj za pomocą:

```bash
openclaw agents list --bindings
```

## Szybki start

<Steps>
  <Step title="Utwórz workspace każdego agenta">
    Użyj kreatora albo utwórz workspace ręcznie:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Każdy agent otrzymuje własny workspace z `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` oraz magazyn sesji pod `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Utwórz konta kanałów">
    Utwórz po jednym koncie per agent w preferowanych kanałach:

    - Discord: jeden bot per agent, włącz Message Content Intent, skopiuj każdy token.
    - Telegram: jeden bot per agent przez BotFather, skopiuj każdy token.
    - WhatsApp: połącz każdy numer telefonu per konto.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zobacz przewodniki po kanałach: [Discord](/pl/channels/discord), [Telegram](/pl/channels/telegram), [WhatsApp](/pl/channels/whatsapp).

  </Step>
  <Step title="Dodaj agentów, konta i wiązania">
    Dodaj agentów pod `agents.list`, konta kanałów pod `channels.<channel>.accounts` i połącz je za pomocą `bindings` (przykłady poniżej).
  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Wielu agentów = wiele osób, wiele osobowości

Przy **wielu agentach** każdy `agentId` staje się **w pełni izolowaną personą**:

- **Różne numery telefonu/konta** (per kanał `accountId`).
- **Różne osobowości** (pliki workspace per agent, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne uwierzytelnianie + sesje** (bez komunikacji między nimi, chyba że zostanie jawnie włączona).

Pozwala to **wielu osobom** współdzielić jeden serwer Gateway przy zachowaniu izolacji ich „mózgów” AI i danych.

## Wyszukiwanie pamięci QMD między agentami

Jeśli jeden agent powinien przeszukiwać transkrypcje sesji QMD innego agenta, dodaj dodatkowe kolekcje pod `agents.list[].memorySearch.qmd.extraCollections`. Używaj `agents.defaults.memorySearch.qmd.extraCollections` tylko wtedy, gdy każdy agent powinien dziedziczyć te same współdzielone kolekcje transkrypcji.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Ścieżka dodatkowej kolekcji może być współdzielona między agentami, ale nazwa kolekcji pozostaje jawna, gdy ścieżka znajduje się poza workspace agenta. Ścieżki wewnątrz workspace pozostają ograniczone do agenta, więc każdy agent zachowuje własny zestaw wyszukiwania transkrypcji.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM WhatsApp** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasuj nadawcę E.164 (np. `+15551234567`) za pomocą `peer.kind: "direct"`. Odpowiedzi nadal przychodzą z tego samego numeru WhatsApp (brak tożsamości nadawcy per agent).

<Note>
Czaty bezpośrednie zwijają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta per osoba**.
</Note>

Przykład:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Uwagi:

- Kontrola dostępu DM jest **globalna per konto WhatsApp** (parowanie/lista dozwolonych), a nie per agent.
- W przypadku współdzielonych grup powiąż grupę z jednym agentem albo użyj [grup broadcast](/pl/channels/broadcast-groups).

## Reguły routingu (jak wiadomości wybierają agenta)

Wiązania są **deterministyczne** i wygrywa **najbardziej szczegółowe**:

<Steps>
  <Step title="Dopasowanie peer">
    Dokładny identyfikator DM/grupy/kanału.
  </Step>
  <Step title="Dopasowanie parentPeer">
    Dziedziczenie wątku.
  </Step>
  <Step title="guildId + role">
    Routing według ról Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="Dopasowanie accountId dla kanału">
    Rezerwowa obsługa per konto.
  </Step>
  <Step title="Dopasowanie na poziomie kanału">
    `accountId: "*"`.
  </Step>
  <Step title="Agent domyślny">
    Rezerwowo `agents.list[].default`, w przeciwnym razie pierwszy wpis listy, domyślnie: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Rozstrzyganie remisów i semantyka AND">
    - Jeśli w tej samej warstwie pasuje wiele wiązań, wygrywa pierwsze w kolejności konfiguracji.
    - Jeśli wiązanie ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wymagane są wszystkie określone pola (semantyka `AND`).

  </Accordion>
  <Accordion title="Szczegóły zakresu konta">
    - Wiązanie, które pomija `accountId`, pasuje tylko do konta domyślnego.
    - Użyj `accountId: "*"`, aby uzyskać rezerwową obsługę całego kanału dla wszystkich kont.
    - Jeśli później dodasz takie samo wiązanie dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw ulepszy istniejące wiązanie wyłącznie kanałowe do zakresu konta zamiast je duplikować.

  </Accordion>
</AccordionGroup>

## Wiele kont / numerów telefonu

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikacji każdego logowania. Każde `accountId` może być kierowane do innego agenta, więc jeden serwer może hostować wiele numerów telefonu bez mieszania sesji.

Jeśli chcesz domyślne konto dla całego kanału, gdy `accountId` jest pominięte, ustaw `channels.<channel>.defaultAccount` (opcjonalnie). Gdy nie jest ustawione, OpenClaw wraca do `default`, jeśli istnieje, w przeciwnym razie do pierwszego skonfigurowanego identyfikatora konta (posortowanego).

Typowe kanały obsługujące ten wzorzec obejmują:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Koncepcje

- `agentId`: jeden „mózg” (workspace, uwierzytelnianie per agent, magazyn sesji per agent).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` kontra `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów gildii/zespołu.
- Czaty bezpośrednie zwijają się do `agent:<agentId>:<mainKey>` („main” per agent; `session.mainKey`).

## Przykłady platform

<AccordionGroup>
  <Accordion title="Boty Discord per agent">
    Każde konto bota Discord mapuje się na unikatowy `accountId`. Powiąż każde konto z agentem i utrzymuj listy dozwolonych per bot.

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - Zaproś każdego bota do serwera i włącz Message Content Intent.
    - Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Boty Telegrama dla poszczególnych agentów">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - Utwórz po jednym bocie dla każdego agenta za pomocą BotFather i skopiuj każdy token.
    - Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Numery WhatsApp dla poszczególnych agentów">
    Połącz każde konto przed uruchomieniem Gateway:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Typowe wzorce

<Tabs>
  <Tab title="Codzienna obsługa WhatsApp + głęboka praca w Telegramie">
    Podziel według kanału: kieruj WhatsApp do szybkiego agenta codziennego użytku, a Telegram do agenta Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    Uwagi:

    - Jeśli masz wiele kont dla kanału, dodaj `accountId` do powiązania (na przykład `{ channel: "whatsapp", accountId: "personal" }`).
    - Aby skierować pojedynczą wiadomość DM/grupę do Opus, pozostawiając resztę na czacie, dodaj powiązanie `match.peer` dla tego peera; dopasowania peerów zawsze wygrywają z regułami obejmującymi cały kanał.

  </Tab>
  <Tab title="Ten sam kanał, jeden peer do Opus">
    Pozostaw WhatsApp na szybkim agencie, ale skieruj jedną wiadomość DM do Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    Powiązania peerów zawsze wygrywają, więc umieść je nad regułą obejmującą cały kanał.

  </Tab>
  <Tab title="Agent rodzinny powiązany z grupą WhatsApp">
    Powiąż dedykowanego agenta rodzinnego z jedną grupą WhatsApp, z bramkowaniem przez wzmianki i ściślejszą polityką narzędzi:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    Uwagi:

    - Listy dozwolonych/zabronionych narzędzi są **narzędziami**, a nie Skills. Jeśli skill musi uruchomić plik binarny, upewnij się, że `exec` jest dozwolone, a plik binarny istnieje w piaskownicy.
    - Aby uzyskać ściślejsze bramkowanie, ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw włączone listy dozwolonych grup dla kanału.

  </Tab>
</Tabs>

## Konfiguracja piaskownicy i narzędzi dla poszczególnych agentów

Każdy agent może mieć własne ograniczenia piaskownicy i narzędzi:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` znajduje się pod `sandbox.docker` i uruchamia się raz podczas tworzenia kontenera. Nadpisania `sandbox.docker.*` dla poszczególnych agentów są ignorowane, gdy rozstrzygnięty zakres to `"shared"`.
</Note>

**Korzyści:**

- **Izolacja bezpieczeństwa**: ogranicz narzędzia dla niezaufanych agentów.
- **Kontrola zasobów**: uruchamiaj określonych agentów w piaskownicy, pozostawiając innych na hoście.
- **Elastyczne polityki**: różne uprawnienia dla poszczególnych agentów.

<Note>
`tools.elevated` jest **globalne** i oparte na nadawcy; nie można go konfigurować dla poszczególnych agentów. Jeśli potrzebujesz granic dla poszczególnych agentów, użyj `agents.list[].tools`, aby zablokować `exec`. Do kierowania w grupach użyj `agents.list[].groupChat.mentionPatterns`, aby @wzmianki były jednoznacznie mapowane na zamierzonego agenta.
</Note>

Zobacz [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby uzyskać szczegółowe przykłady.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — uruchamianie zewnętrznych harnessów kodujących
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Obecność](/pl/concepts/presence) — obecność i dostępność agenta
- [Sesja](/pl/concepts/session) — izolacja i routing sesji
- [Podagenci](/pl/tools/subagents) — uruchamianie agentów działających w tle
