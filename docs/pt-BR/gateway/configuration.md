---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando para seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-11T02:44:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuração

O OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 suporta comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.

Se o arquivo não existir, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens para o bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Veja a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para uma configuração interativa ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para ver configurações completas prontas para copiar e colar.
</Tip>

## Configuração mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando a configuração

<Tabs>
  <Tab title="Assistente interativo">
    ```bash
    openclaw onboard       # fluxo completo de onboarding
    openclaw configure     # assistente de configuração
    ```
  </Tab>
  <Tab title="CLI (comandos de uma linha)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Control UI renderiza um formulário a partir do esquema de configuração ativo, incluindo metadados de documentação de campo `title` / `description`, além de esquemas de plugin e canal quando disponíveis, com um editor **Raw JSON** como alternativa. Para UIs de navegação detalhada e outras ferramentas, o gateway também expõe `config.schema.lookup` para buscar um nó de esquema delimitado a um caminho, junto com resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway monitora o arquivo e aplica as alterações automaticamente (veja [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondam totalmente ao esquema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem com que o Gateway **se recuse a iniciar**. A única exceção no nível raiz é `$schema` (string), para que os editores possam anexar metadados de JSON Schema.
</Warning>

Notas sobre as ferramentas de esquema:

- `openclaw config schema` imprime a mesma família de JSON Schema usada pela Control UI e pela validação de configuração.
- Trate essa saída de esquema como o contrato canônico legível por máquina para `openclaw.json`; esta visão geral e a referência de configuração a resumem.
- Os valores de campo `title` e `description` são transportados para a saída do esquema para ferramentas de editor e formulário.
- Entradas de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos metadados de documentação quando existe documentação de campo correspondente.
- Ramos de composição `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação, para que variantes de união/interseção mantenham a mesma ajuda de campo.
- `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de esquema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns e campos de validação semelhantes), metadados de dica de UI correspondentes e resumos imediatos dos filhos para ferramentas de navegação detalhada.
- Esquemas de plugin/canal em runtime são mesclados quando o gateway consegue carregar o registro de manifestos atual.
- `pnpm config:docs:check` detecta divergências entre os artefatos de baseline de configuração voltados à documentação e a superfície atual do esquema.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar correções

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Veja a página dedicada de cada canal para as etapas de configuração:

    - [WhatsApp](/pt-BR/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/pt-BR/channels/telegram) — `channels.telegram`
    - [Discord](/pt-BR/channels/discord) — `channels.discord`
    - [Feishu](/pt-BR/channels/feishu) — `channels.feishu`
    - [Google Chat](/pt-BR/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/pt-BR/channels/msteams) — `channels.msteams`
    - [Slack](/pt-BR/channels/slack) — `channels.slack`
    - [Signal](/pt-BR/channels/signal) — `channels.signal`
    - [iMessage](/pt-BR/channels/imessage) — `channels.imessage`
    - [Mattermost](/pt-BR/channels/mattermost) — `channels.mattermost`

    Todos os canais compartilham o mesmo padrão de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Escolher e configurar modelos">
    Defina o modelo principal e fallbacks opcionais:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define o catálogo de modelos e atua como a allowlist para `/model`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagens em transcrição/ferramenta (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Veja [Models CLI](/pt-BR/concepts/models) para trocar de modelo no chat e [Model Failover](/pt-BR/concepts/model-failover) para comportamento de rotação de autenticação e fallback.
    - Para provedores personalizados/hospedados por conta própria, veja [Provedores personalizados](/pt-BR/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens para o bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento pareado de allow)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar bloqueio por menção em chat de grupo">
    As mensagens de grupo, por padrão, **exigem menção**. Configure padrões por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menções de metadados**: @-mentions nativas (toque para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#group-chat-mention-gating) para overrides por canal e modo de conversa consigo mesmo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` para uma base compartilhada e depois sobrescreva agentes específicos com `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para não ter Skills.
    - Veja [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e a [Referência de configuração](/pt-BR/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de saúde de canais do gateway">
    Controle quão agressivamente o gateway reinicia canais que parecem estar obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Defina `gateway.channelHealthCheckMinutes: 0` para desativar globalmente os reinícios por monitoramento de saúde.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desativar reinicializações automáticas de um canal ou conta sem desativar o monitor global.
    - Veja [Health Checks](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
    As sessões controlam a continuidade e o isolamento da conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartilhado) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para roteamento de sessão vinculado a thread (o Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Veja [Gerenciamento de sessão](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Ativar sandboxing">
    Execute sessões de agente em contêineres Docker isolados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Primeiro, crie a imagem: `scripts/sandbox-setup.sh`

    Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Ativar push com relay para builds oficiais do iOS">
    O push com relay é configurado em `openclaw.json`.

    Defina isto na configuração do gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente na CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isso faz:

    - Permite que o gateway envie `push.test`, sinais de wake e wakes de reconexão por meio do relay externo.
    - Usa uma permissão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay válido para toda a implantação.
    - Vincula cada registro com relay ao identificador do gateway com o qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds locais/manuais do iOS em APNs direto. Envios com relay se aplicam apenas a builds oficiais distribuídos que se registraram por meio do relay.
    - Deve corresponder à URL base do relay incorporada no build oficial/TestFlight do iOS, para que o tráfego de registro e envio alcance a mesma implantação de relay.

    Fluxo de ponta a ponta:

    1. Instale um build oficial/TestFlight do iOS que tenha sido compilado com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Pareie o app iOS com o gateway e permita que as sessões de nó e operador se conectem.
    4. O app iOS busca a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e, em seguida, publica o payload `push.apns.register` com relay para o gateway pareado.
    5. O gateway armazena o handle do relay e a permissão de envio, depois os usa para `push.test`, sinais de wake e wakes de reconexão.

    Notas operacionais:

    - Se você trocar o app iOS para outro gateway, reconecte o app para que ele possa publicar um novo registro de relay vinculado àquele gateway.
    - Se você distribuir um novo build do iOS apontando para outra implantação de relay, o app atualiza seu registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Nota de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como overrides temporários por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma válvula de escape de desenvolvimento apenas para loopback; não persista URLs HTTP de relay na configuração.

    Veja [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar heartbeat (check-ins periódicos)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desativar.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de heartbeat no estilo DM
    - Veja [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar jobs cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: remove sessões concluídas de execuções isoladas de `sessions.json` (padrão `24h`; defina `false` para desativar).
    - `runLog`: faz a limpeza de `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Jobs cron](/pt-BR/automation/cron-jobs) para visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Ative endpoints HTTP de webhook no Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota de segurança:
    - Trate todo o conteúdo de payload de hook/webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook é apenas por header (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desativadas as flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração rigidamente delimitada.
    - Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão escolhidas pelo chamador.
    - Para agentes acionados por hooks, prefira tiers modernos e fortes de modelo e uma política estrita de ferramentas (por exemplo, apenas mensagens mais sandboxing quando possível).

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multiagente">
    Execute vários agentes isolados com workspaces e sessões separados:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Veja [Multi-Agent](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/configuration-reference#multi-agent-routing) para regras de binding e perfis de acesso por agente.

  </Accordion>

  <Accordion title="Dividir a configuração em vários arquivos ($include)">
    Use `$include` para organizar configurações grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Arquivo único**: substitui o objeto que o contém
    - **Array de arquivos**: faz merge profundo em ordem (o último vence)
    - **Chaves irmãs**: são mescladas após os includes (sobrescrevem os valores incluídos)
    - **Includes aninhados**: suportados até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parse e includes circulares

  </Accordion>
</AccordionGroup>

## Hot reload da configuração

O Gateway monitora `~/.openclaw/openclaw.json` e aplica alterações automaticamente — não é necessário reiniciar manualmente para a maioria das configurações.

### Modos de reload

| Modo                   | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão)  | Aplica a quente alterações seguras instantaneamente. Reinicia automaticamente para as críticas. |
| **`hot`**              | Aplica a quente apenas alterações seguras. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.               |
| **`off`**              | Desativa o monitoramento do arquivo. As alterações entram em vigor na próxima reinicialização manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado a quente e o que precisa de reinicialização

A maioria dos campos é aplicada a quente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria            | Campos                                                               | Reinicialização necessária? |
| -------------------- | -------------------------------------------------------------------- | --------------------------- |
| Canais               | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de extensão | Não                    |
| Agente e modelos     | `agent`, `agents`, `models`, `routing`                               | Não                         |
| Automação            | `hooks`, `cron`, `agent.heartbeat`                                   | Não                         |
| Sessões e mensagens  | `session`, `messages`                                                | Não                         |
| Ferramentas e mídia  | `tools`, `browser`, `skills`, `audio`, `talk`                        | Não                         |
| UI e diversos        | `ui`, `logging`, `identity`, `bindings`                              | Não                         |
| Servidor do gateway  | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Sim**                     |
| Infraestrutura       | `discovery`, `canvasHost`, `plugins`                                 | **Sim**                     |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** dispara uma reinicialização.
</Note>

## Config RPC (atualizações programáticas)

<Note>
RPCs de escrita do plano de controle (`config.apply`, `config.patch`, `update.run`) têm limite de taxa de **3 requisições por 60 segundos** por `deviceId+clientIp`. Quando o limite é atingido, o RPC retorna `UNAVAILABLE` com `retryAfterMs`.
</Note>

Fluxo seguro/padrão:

- `config.schema.lookup`: inspeciona uma subárvore de configuração delimitada por caminho com um nó de esquema superficial, metadados de dica correspondentes e resumos imediatos dos filhos
- `config.get`: busca o snapshot atual + hash
- `config.patch`: caminho preferido para atualização parcial
- `config.apply`: substituição da configuração completa apenas
- `update.run`: autoatualização explícita + reinicialização

Quando você não estiver substituindo a configuração inteira, prefira `config.schema.lookup` e depois `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (substituição completa)">
    Valida + grava a configuração completa e reinicia o Gateway em uma única etapa.

    <Warning>
    `config.apply` substitui a **configuração inteira**. Use `config.patch` para atualizações parciais ou `openclaw config set` para chaves individuais.
    </Warning>

    Parâmetros:

    - `raw` (string) — payload JSON5 da configuração inteira
    - `baseHash` (opcional) — hash da configuração retornado por `config.get` (obrigatório quando a configuração já existe)
    - `sessionKey` (opcional) — chave de sessão para o ping de reativação após a reinicialização
    - `note` (opcional) — observação para o sentinela de reinicialização
    - `restartDelayMs` (opcional) — atraso antes da reinicialização (padrão 2000)

    Solicitações de reinicialização são consolidadas enquanto uma já está pendente/em andamento, e um cooldown de 30 segundos é aplicado entre ciclos de reinicialização.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (atualização parcial)">
    Mescla uma atualização parcial à configuração existente (semântica de JSON merge patch):

    - Objetos são mesclados recursivamente
    - `null` exclui uma chave
    - Arrays substituem

    Parâmetros:

    - `raw` (string) — JSON5 apenas com as chaves a serem alteradas
    - `baseHash` (obrigatório) — hash da configuração retornado por `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — iguais a `config.apply`

    O comportamento de reinicialização corresponde ao de `config.apply`: reinicializações pendentes consolidadas mais um cooldown de 30 segundos entre ciclos de reinicialização.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai e também de:

- `.env` no diretório de trabalho atual (se existir)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos sobrescreve variáveis de ambiente já existentes. Você também pode definir variáveis inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de env do shell (opcional)">
  Se estiver ativado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente em variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Referencie variáveis de ambiente em qualquer valor de string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram um erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referências de segredo (env, file, exec)">
  Para campos que suportam objetos SecretRef, você pode usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Os detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Os caminhos de credenciais compatíveis estão listados em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Veja [Environment](/pt-BR/help/environment) para a precedência completa e as fontes.

## Referência completa

Para a referência completa campo por campo, veja **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_
