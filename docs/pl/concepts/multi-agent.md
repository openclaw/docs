---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Trasowanie wieloagentowe: izolowani agenci, konta kanałów i powiązania'
title: Routing wieloagentowy
x-i18n:
    generated_at: "2026-04-30T09:48:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Uruchamiaj wiele _izolowanych_ agentów — każdy z własnym obszarem roboczym, katalogiem stanu (`agentDir`) i historią sesji — oraz wiele kont kanałów (np. dwa konta WhatsApp) w jednym działającym Gateway. Wiadomości przychodzące są kierowane do właściwego agenta przez powiązania.

**Agent** oznacza tutaj pełny zakres dla danej persony: pliki obszaru roboczego, profile uwierzytelniania, rejestr modeli i magazyn sesji. `agentDir` to katalog stanu na dysku, który przechowuje tę konfigurację dla agenta w `~/.openclaw/agents/<agentId>/`. **Powiązanie** mapuje konto kanału (np. obszar roboczy Slack lub numer WhatsApp) na jednego z tych agentów.

## Czym jest „jeden agent”?

**Agent** to w pełni wydzielony mózg z własnymi:

- **Obszarem roboczym** (pliki, AGENTS.md/SOUL.md/USER.md, lokalne notatki, reguły persony).
- **Katalogiem stanu** (`agentDir`) dla profili uwierzytelniania, rejestru modeli i konfiguracji danego agenta.
- **Magazynem sesji** (historia czatu + stan routingu) w `~/.openclaw/agents/<agentId>/sessions`.

Profile uwierzytelniania są **przypisane do agenta**. Każdy agent odczytuje je z własnego:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` jest tu również bezpieczniejszą ścieżką przywoływania między sesjami: zwraca ograniczony, oczyszczony widok, a nie surowy zrzut transkrypcji. Przywoływanie asystenta usuwa znaczniki myślenia, rusztowanie `<relevant-memories>`, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), obniżone rusztowanie wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/pełnej szerokości oraz niepoprawny XML wywołań narzędzi MiniMax przed redakcją/ucięciem.
</Note>

<Warning>
Nigdy nie używaj ponownie `agentDir` między agentami (powoduje to kolizje uwierzytelniania/sesji). Agenci
mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają
profilu lokalnego, ale OpenClaw nie klonuje tokenów odświeżania OAuth do
magazynu agenta pomocniczego. Jeśli chcesz niezależnego konta OAuth, zaloguj się z poziomu
tego agenta; jeśli ręcznie kopiujesz poświadczenia, kopiuj tylko przenośne statyczne
profile `api_key` lub `token`.
</Warning>

Skills są ładowane z obszaru roboczego każdego agenta oraz współdzielonych katalogów głównych, takich jak `~/.openclaw/skills`, a następnie filtrowane przez efektywną listę dozwolonych Skills agenta, jeśli jest skonfigurowana. Użyj `agents.defaults.skills` jako współdzielonej bazy oraz `agents.list[].skills` jako zastąpienia dla danego agenta. Zobacz [Skills: dla agenta a współdzielone](/pl/tools/skills#per-agent-vs-shared-skills) oraz [Skills: listy dozwolonych Skills agenta](/pl/tools/skills#agent-skill-allowlists).

Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

<Note>
**Uwaga dotycząca obszaru roboczego:** obszar roboczy każdego agenta jest **domyślnym cwd**, a nie twardą piaskownicą. Ścieżki względne są rozwiązywane wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą sięgać innych lokalizacji hosta, chyba że włączono sandboxing. Zobacz [Sandboxing](/pl/gateway/sandboxing).
</Note>

## Ścieżki (szybka mapa)

- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu: `~/.openclaw` (lub `OPENCLAW_STATE_DIR`)
- Obszar roboczy: `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<agentId>`)
- Katalog agenta: `~/.openclaw/agents/<agentId>/agent` (lub `agents.list[].agentDir`)
- Sesje: `~/.openclaw/agents/<agentId>/sessions`

### Tryb jednego agenta (domyślny)

Jeśli nic nie zrobisz, OpenClaw uruchamia jednego agenta:

- `agentId` ma domyślnie wartość **`main`**.
- Sesje są kluczowane jako `agent:main:<mainKey>`.
- Obszar roboczy domyślnie to `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`).
- Stan domyślnie to `~/.openclaw/agents/main/agent`.

## Pomocnik agenta

Użyj kreatora agenta, aby dodać nowego izolowanego agenta:

```bash
openclaw agents add work
```

Następnie dodaj `bindings` (lub pozwól kreatorowi to zrobić), aby kierować wiadomości przychodzące.

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
    - WhatsApp: połącz każdy numer telefonu z kontem.

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

Przy **wielu agentach** każdy `agentId` staje się **w pełni izolowaną personą**:

- **Różne numery telefonów/konta** (dla kanału `accountId`).
- **Różne osobowości** (pliki obszaru roboczego danego agenta, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne uwierzytelnianie + sesje** (bez wzajemnego przenikania, chyba że zostanie jawnie włączone).

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

Ścieżka dodatkowej kolekcji może być współdzielona między agentami, ale nazwa kolekcji pozostaje jawna, gdy ścieżka znajduje się poza obszarem roboczym agenta. Ścieżki wewnątrz obszaru roboczego pozostają ograniczone do agenta, więc każdy agent zachowuje własny zestaw wyszukiwania transkrypcji.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM WhatsApp** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasuj według nadawcy E.164 (np. `+15551234567`) z `peer.kind: "direct"`. Odpowiedzi nadal pochodzą z tego samego numeru WhatsApp (brak tożsamości nadawcy dla danego agenta).

<Note>
Czaty bezpośrednie zapadają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta na osobę**.
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

- Kontrola dostępu DM jest **globalna dla konta WhatsApp** (parowanie/lista dozwolonych), a nie dla agenta.
- W przypadku współdzielonych grup powiąż grupę z jednym agentem albo użyj [Grup rozgłoszeniowych](/pl/channels/broadcast-groups).

## Reguły routingu (jak wiadomości wybierają agenta)

Powiązania są **deterministyczne** i **wygrywa najbardziej szczegółowe**:

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
    Fallback dla konta.
  </Step>
  <Step title="Dopasowanie na poziomie kanału">
    `accountId: "*"`.
  </Step>
  <Step title="Agent domyślny">
    Fallback do `agents.list[].default`, w przeciwnym razie pierwszy wpis listy, domyślnie: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Rozstrzyganie remisów i semantyka AND">
    - Jeśli wiele powiązań pasuje na tym samym poziomie, wygrywa pierwsze w kolejności konfiguracji.
    - Jeśli powiązanie ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wymagane są wszystkie określone pola (semantyka `AND`).

  </Accordion>
  <Accordion title="Szczegóły zakresu konta">
    - Powiązanie, które pomija `accountId`, pasuje tylko do konta domyślnego.
    - Użyj `accountId: "*"` jako fallbacku dla całego kanału na wszystkich kontach.
    - Jeśli później dodasz to samo powiązanie dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw uaktualni istniejące powiązanie tylko dla kanału do zakresu konta zamiast je duplikować.

  </Accordion>
</AccordionGroup>

## Wiele kont / numerów telefonów

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikowania każdego logowania. Każde `accountId` może być kierowane do innego agenta, więc jeden serwer może hostować wiele numerów telefonów bez mieszania sesji.

Jeśli chcesz mieć domyślne konto dla całego kanału, gdy `accountId` zostanie pominięte, ustaw `channels.<channel>.defaultAccount` (opcjonalnie). Gdy nie jest ustawione, OpenClaw wraca do `default`, jeśli istnieje, w przeciwnym razie do pierwszego skonfigurowanego identyfikatora konta (posortowanego).

Typowe kanały obsługujące ten wzorzec obejmują:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Pojęcia

- `agentId`: jeden „mózg” (obszar roboczy, uwierzytelnianie dla agenta, magazyn sesji dla agenta).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` kontra `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów guild/team.
- Czaty bezpośrednie zapadają się do `agent:<agentId>:<mainKey>` („main” dla agenta; `session.mainKey`).

## Przykłady platform

<AccordionGroup>
  <Accordion title="Boty Discord dla każdego agenta">
    Każde konto bota Discord jest mapowane na unikalne `accountId`. Powiąż każde konto z agentem i utrzymuj listy dozwolonych dla każdego bota.

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

    - Zaproś każdego bota na serwer i włącz Message Content Intent.
    - Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

    - Utwórz jednego bota na agenta za pomocą BotFather i skopiuj każdy token.
    - Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
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
  <Tab title="WhatsApp daily + Telegram deep work">
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
    - Aby skierować pojedynczą wiadomość DM/grupę do Opus, pozostawiając resztę w czacie, dodaj powiązanie `match.peer` dla tego peera; dopasowania peerów zawsze mają pierwszeństwo przed regułami dla całego kanału.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
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

    Powiązania peerów zawsze mają pierwszeństwo, więc trzymaj je nad regułą dla całego kanału.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Powiąż dedykowanego agenta rodzinnego z jedną grupą WhatsApp, z bramkowaniem wzmiankami i bardziej rygorystyczną polityką narzędzi:

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

    - Listy zezwoleń/odmów narzędzi to **tools**, nie Skills. Jeśli skill musi uruchomić plik binarny, upewnij się, że `exec` jest dozwolone, a plik binarny istnieje w sandbox.
    - Aby uzyskać bardziej rygorystyczne bramkowanie, ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw listy dozwolonych grup włączone dla kanału.

  </Tab>
</Tabs>

## Konfiguracja sandbox i narzędzi dla poszczególnych agentów

Każdy agent może mieć własne ograniczenia sandbox i narzędzi:

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
- **Kontrola zasobów**: umieszczaj konkretnych agentów w sandbox, pozostawiając innych na hoście.
- **Elastyczne polityki**: różne uprawnienia dla każdego agenta.

<Note>
`tools.elevated` jest **globalne** i oparte na nadawcy; nie można go konfigurować dla poszczególnych agentów. Jeśli potrzebujesz granic per agent, użyj `agents.list[].tools`, aby odmówić `exec`. W przypadku kierowania do grup użyj `agents.list[].groupChat.mentionPatterns`, aby @wzmianki jednoznacznie mapowały się na docelowego agenta.
</Note>

Zobacz [Multi-agent sandbox and tools](/pl/tools/multi-agent-sandbox-tools), aby uzyskać szczegółowe przykłady.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — uruchamianie zewnętrznych środowisk kodowania
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Obecność](/pl/concepts/presence) — obecność i dostępność agenta
- [Sesja](/pl/concepts/session) — izolacja i routing sesji
- [Subagenci](/pl/tools/subagents) — uruchamianie agentów w tle
