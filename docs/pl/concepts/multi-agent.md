---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing wieloagentowy: izolowane agenty, konta kanałów i powiązania'
title: Routing wieloagentowy
x-i18n:
    generated_at: "2026-06-27T17:27:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

  Uruchamiaj wielu _izolowanych_ agentów — każdego z własnym obszarem roboczym, katalogiem stanu (`agentDir`) i historią sesji — oraz wiele kont kanałów (np. dwa konta WhatsApp) w jednym działającym Gateway. Wiadomości przychodzące są kierowane do właściwego agenta przez powiązania.

  **Agent** oznacza tutaj pełny zakres dla danej persony: pliki obszaru roboczego, profile uwierzytelniania, rejestr modeli i magazyn sesji. `agentDir` to katalog stanu na dysku, który przechowuje tę konfigurację per agent w `~/.openclaw/agents/<agentId>/`. **Powiązanie** mapuje konto kanału (np. obszar roboczy Slack lub numer WhatsApp) na jednego z tych agentów.

  ## Czym jest „jeden agent”?

  **Agent** to w pełni wydzielony mózg z własnymi:

  - **Obszarem roboczym** (pliki, AGENTS.md/SOUL.md/USER.md, notatki lokalne, reguły persony).
  - **Katalogiem stanu** (`agentDir`) dla profili uwierzytelniania, rejestru modeli i konfiguracji per agent.
  - **Magazynem sesji** (historia czatu + stan routingu) w `~/.openclaw/agents/<agentId>/sessions`.

  Profile uwierzytelniania są **per agent**. Każdy agent czyta z własnego:

  ```text
  ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
  ```

  <Note>
  `sessions_history` jest tutaj także bezpieczniejszą ścieżką przypominania między sesjami: zwraca ograniczony, oczyszczony widok, a nie surowy zrzut transkrypcji. Przypominanie asystenta usuwa tagi myślenia, rusztowanie `<relevant-memories>`, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), zdegradowane rusztowanie wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/pełnej szerokości oraz niepoprawny XML wywołań narzędzi MiniMax przed redakcją/obcięciem.
  </Note>

  <Warning>
  Nigdy nie używaj ponownie `agentDir` między agentami (powoduje to kolizje uwierzytelniania/sesji). Agenci
  mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają
  profilu lokalnego, ale OpenClaw nie klonuje tokenów odświeżania OAuth do
  magazynu agenta pomocniczego. Jeśli chcesz niezależne konto OAuth, zaloguj się z poziomu
  tego agenta; jeśli kopiujesz poświadczenia ręcznie, kopiuj tylko przenośne statyczne
  profile `api_key` lub `token`.
  </Warning>

  Skills są ładowane z obszaru roboczego każdego agenta oraz ze współdzielonych katalogów głównych, takich jak `~/.openclaw/skills`, a następnie filtrowane według efektywnej listy dozwolonych Skills agenta, gdy jest skonfigurowana. Użyj `agents.defaults.skills` jako współdzielonej bazy i `agents.list[].skills` jako zastąpienia per agent. Zobacz [Skills: per agent a współdzielone](/pl/tools/skills#per-agent-vs-shared-skills) oraz [Skills: listy dozwolonych Skills agenta](/pl/tools/skills#agent-allowlists).

  Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

  <Note>
  **Uwaga o obszarze roboczym:** obszar roboczy każdego agenta jest **domyślnym cwd**, a nie twardą piaskownicą. Ścieżki względne rozwiązują się wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą sięgać innych lokalizacji hosta, chyba że włączono piaskownicę. Zobacz [Piaskownica](/pl/gateway/sandboxing).
  </Note>

  ## Ścieżki (szybka mapa)

  - Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
  - Katalog stanu: `~/.openclaw` (lub `OPENCLAW_STATE_DIR`)
  - Obszar roboczy: `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<agentId>`)
  - Katalog agenta: `~/.openclaw/agents/<agentId>/agent` (lub `agents.list[].agentDir`)
  - Sesje: `~/.openclaw/agents/<agentId>/sessions`

  ### Tryb jednego agenta (domyślny)

  Jeśli nic nie zrobisz, OpenClaw uruchamia pojedynczego agenta:

  - `agentId` domyślnie ma wartość **`main`**.
  - Sesje są kluczowane jako `agent:main:<mainKey>`.
  - Obszar roboczy domyślnie to `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`).
  - Stan domyślnie to `~/.openclaw/agents/main/agent`.

  ## Pomocnik agentów

  Użyj kreatora agentów, aby dodać nowego izolowanego agenta:

  ```bash
  openclaw agents add work
  ```

  Następnie dodaj `bindings` (albo pozwól zrobić to kreatorowi), aby kierować wiadomości przychodzące.

  Zweryfikuj za pomocą:

  ```bash
  openclaw agents list --bindings
  ```

  ## Szybki start

  <Steps>
  <Step title="Utwórz obszar roboczy każdego agenta">
    Użyj kreatora albo utwórz obszary robocze ręcznie:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Każdy agent otrzymuje własny obszar roboczy z `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` oraz magazyn sesji w `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Utwórz konta kanałów">
    Utwórz po jednym koncie na agenta w preferowanych kanałach:

    - Discord: jeden bot na agenta, włącz Message Content Intent, skopiuj każdy token.
    - Telegram: jeden bot na agenta przez BotFather, skopiuj każdy token.
    - WhatsApp: połącz każdy numer telefonu per konto.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zobacz przewodniki po kanałach: [Discord](/pl/channels/discord), [Telegram](/pl/channels/telegram), [WhatsApp](/pl/channels/whatsapp).

  </Step>
  <Step title="Dodaj agentów, konta i powiązania">
    Dodaj agentów w `agents.list`, konta kanałów w `channels.<channel>.accounts` i połącz je za pomocą `bindings` (przykłady poniżej).
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

Przy **wielu agentach** każdy `agentId` staje się **w pełni odizolowaną personą**:

- **Różne numery telefonów/konta** (dla każdego kanału `accountId`).
- **Różne osobowości** (pliki przestrzeni roboczej dla poszczególnych agentów, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne uwierzytelnianie + sesje** (bez przenikania rozmów, chyba że zostanie jawnie włączone).

Dzięki temu **wiele osób** może współdzielić jeden serwer Gateway, zachowując izolację swoich „mózgów” AI i danych.

## Wyszukiwanie pamięci QMD między agentami

Jeśli jeden agent ma przeszukiwać transkrypcje sesji QMD innego agenta, dodaj dodatkowe kolekcje w `agents.list[].memorySearch.qmd.extraCollections`. Używaj `agents.defaults.memorySearch.qmd.extraCollections` tylko wtedy, gdy każdy agent ma dziedziczyć te same współdzielone kolekcje transkrypcji.

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

Ścieżka dodatkowej kolekcji może być współdzielona między agentami, ale nazwa kolekcji pozostaje jawna, gdy ścieżka znajduje się poza przestrzenią roboczą agenta. Ścieżki wewnątrz przestrzeni roboczej pozostają przypisane do agenta, dzięki czemu każdy agent zachowuje własny zestaw wyszukiwania transkrypcji.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM WhatsApp** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasuj nadawcę w formacie E.164 (np. `+15551234567`) za pomocą `peer.kind: "direct"`. Odpowiedzi nadal przychodzą z tego samego numeru WhatsApp (bez osobnej tożsamości nadawcy dla agenta).

<Note>
Czaty bezpośrednie zwijają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta na osobę**.
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

- Kontrola dostępu DM jest **globalna dla konta WhatsApp** (parowanie/lista dozwolonych), a nie osobna dla agenta.
- W przypadku współdzielonych grup powiąż grupę z jednym agentem albo użyj [grup rozgłoszeniowych](/pl/channels/broadcast-groups).

## Reguły routingu (jak wiadomości wybierają agenta)

Powiązania są **deterministyczne** i **wygrywa najbardziej szczegółowe**:

<Steps>
  <Step title="dopasowanie peer">
    Dokładny identyfikator DM/grupy/kanału.
  </Step>
  <Step title="dopasowanie parentPeer">
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
  <Step title="dopasowanie accountId dla kanału">
    Rezerwowe ustawienie dla konta.
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
    - Jeśli wiele powiązań pasuje na tym samym poziomie, wygrywa pierwsze w kolejności konfiguracji.
    - Jeśli powiązanie ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wymagane są wszystkie wskazane pola (semantyka `AND`).

  </Accordion>
  <Accordion title="Szczegóły zakresu konta">
    - Powiązanie, które pomija `accountId`, pasuje tylko do konta domyślnego. Nie pasuje do wszystkich kont.
    - Użyj `accountId: "*"` jako rezerwowego ustawienia dla całego kanału we wszystkich kontach.
    - Użyj `accountId: "<name>"`, aby dopasować jedno konto.
    - Jeśli później dodasz to samo powiązanie dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw podniesie istniejące powiązanie wyłącznie kanałowe do zakresu konta zamiast je duplikować.

  </Accordion>
</AccordionGroup>

## Wiele kont / numerów telefonów

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikowania każdego logowania. Każdy `accountId` może być kierowany do innego agenta, więc jeden serwer może obsługiwać wiele numerów telefonów bez mieszania sesji.

Jeśli chcesz mieć domyślne konto dla całego kanału, gdy `accountId` jest pominięty, ustaw `channels.<channel>.defaultAccount` (opcjonalne). Gdy nie jest ustawione, OpenClaw używa rezerwowo `default`, jeśli istnieje, w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (po sortowaniu).

Typowe kanały obsługujące ten wzorzec obejmują:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Pojęcia

- `agentId`: jeden „mózg” (przestrzeń robocza, uwierzytelnianie dla agenta, magazyn sesji dla agenta).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` kontra `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` i opcjonalnie identyfikatorów gildii/zespołu.
- Czaty bezpośrednie zwijają się do `agent:<agentId>:<mainKey>` („main” dla agenta; `session.mainKey`).

## Przykłady platform

<AccordionGroup>
  <Accordion title="Boty Discord dla poszczególnych agentów">
    Każde konto bota Discord mapuje się na unikalny `accountId`. Powiąż każde konto z agentem i utrzymuj listy dozwolonych osobno dla każdego bota.

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

    - Zaproś każdego bota na serwer i włącz Intencję treści wiadomości.
    - Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Boty Telegram dla poszczególnych agentów">
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

    - Utwórz po jednym bocie na agenta za pomocą BotFather i skopiuj każdy token.
    - Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).
    - W przypadku wielu botów w tej samej grupie Telegram zaproś każdego bota i wspomnij bota, który powinien odpowiedzieć.
    - Wyłącz tryb prywatności BotFather dla każdego bota grupowego, a następnie dodaj bota ponownie, aby Telegram zastosował ustawienie.
    - Zezwalaj na grupy za pomocą `channels.telegram.groups` albo użyj `groupPolicy: "open"` tylko dla zaufanych wdrożeń grupowych.
    - Umieść identyfikatory użytkowników nadawców w `groupAllowFrom`. Identyfikatory grup i supergrup należą do `channels.telegram.groups`, a nie do `groupAllowFrom`.
    - Powiąż według `accountId`, aby każdy bot kierował do własnego agenta.

  </Accordion>
  <Accordion title="Numery WhatsApp dla poszczególnych agentów">
    Połącz każde konto przed uruchomieniem gateway:

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
  <Tab title="Codzienna praca w WhatsApp + głęboka praca w Telegram">
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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Uwagi:

    - Te przykłady używają `accountId: "*"`, więc powiązania będą nadal działać, jeśli później dodasz konta.
    - Aby skierować pojedynczą wiadomość prywatną/grupę do Opus, pozostawiając resztę na czacie, dodaj powiązanie `match.peer` dla tego peera; dopasowania peer zawsze wygrywają z regułami dla całego kanału.

  </Tab>
  <Tab title="Ten sam kanał, jeden peer do Opus">
    Pozostaw WhatsApp na szybkim agencie, ale skieruj jedną wiadomość prywatną do Opus:

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Powiązania peer zawsze wygrywają, więc trzymaj je nad regułą dla całego kanału.

  </Tab>
  <Tab title="Agent rodzinny powiązany z grupą WhatsApp">
    Powiąż dedykowanego agenta rodzinnego z jedną grupą WhatsApp, z bramkowaniem przez wzmiankę i bardziej rygorystyczną polityką narzędzi:

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

    - Listy dozwolonych/zabronionych narzędzi dotyczą **narzędzi**, a nie Skills. Jeśli skill musi uruchomić plik binarny, upewnij się, że `exec` jest dozwolone i że plik binarny istnieje w sandbox.
    - Aby uzyskać bardziej rygorystyczne bramkowanie, ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw listy dozwolonych grup włączone dla kanału.

  </Tab>
</Tabs>

## Konfiguracja sandbox i narzędzi dla poszczególnych agentów

Każdy agent może mieć własny sandbox i ograniczenia narzędzi:

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
`setupCommand` znajduje się pod `sandbox.docker` i uruchamia się raz podczas tworzenia kontenera. Nadpisania `sandbox.docker.*` dla poszczególnych agentów są ignorowane, gdy rozpoznany zakres to `"shared"`.
</Note>

**Korzyści:**

- **Izolacja bezpieczeństwa**: ogranicz narzędzia dla niezaufanych agentów.
- **Kontrola zasobów**: uruchamiaj wybranych agentów w sandbox, pozostawiając innych na hoście.
- **Elastyczne polityki**: różne uprawnienia dla poszczególnych agentów.

<Note>
`tools.elevated` jest **globalne** i oparte na nadawcy; nie można go konfigurować dla poszczególnych agentów. Jeśli potrzebujesz granic dla poszczególnych agentów, użyj `agents.list[].tools`, aby zabronić `exec`. Do kierowania grupowego użyj `agents.list[].groupChat.mentionPatterns`, aby @wzmianki jednoznacznie mapowały się na zamierzonego agenta.
</Note>

Zobacz [Sandbox i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegółowe przykłady.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — uruchamianie zewnętrznych harnessów kodowania
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Obecność](/pl/concepts/presence) — obecność i dostępność agenta
- [Sesja](/pl/concepts/session) — izolacja i routing sesji
- [Subagenci](/pl/tools/subagents) — uruchamianie agentów w tle
