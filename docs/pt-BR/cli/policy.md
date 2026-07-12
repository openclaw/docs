---
read_when:
    - Você quer verificar as configurações do OpenClaw em relação a um policy.jsonc definido manualmente
    - Você quer que o lint do doctor detecte violações de política
    - Você precisa de um hash de atestação de política como evidência de auditoria
summary: Referência da CLI para verificações de conformidade de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-11T23:49:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` é fornecido pelo Plugin de Política incluído. Ele é uma camada
de conformidade empresarial sobre as configurações existentes do OpenClaw, não
um segundo sistema de configuração. Você define os requisitos em `policy.jsonc`;
o OpenClaw observa o workspace ativo como evidência; a política relata desvios
por meio de `doctor --lint`. A política não impõe chamadas de ferramentas nem
reescreve o comportamento do runtime no momento da solicitação e não atesta
armazenamentos de credenciais por agente, como `auth-profiles.json`.

A política verifica canais configurados, servidores MCP, provedores de modelos,
postura de SSRF da rede, acesso de entrada/canais, exposição do Gateway e postura
de comandos de Node, acesso dos agentes ao workspace, postura de sandbox, postura
de tratamento de dados, postura de provedores de segredos/perfis de autenticação
e metadados de ferramentas sob governança (`TOOLS.md`). Use-a quando um workspace
precisar de uma declaração durável e verificável, como "o Telegram não deve estar
habilitado" ou "ferramentas sob governança devem declarar metadados de risco e
responsável". Se você precisar apenas de comportamento local, sem atestação ou
detecção de desvios, a configuração comum é suficiente.

## Início rápido

```bash
openclaw plugins enable policy
```

O Plugin permanece habilitado mesmo quando `policy.jsonc` está ausente, para que
o doctor possa relatar a ausência do artefato em vez de ignorar silenciosamente
as verificações.

Crie `policy.jsonc` manualmente; ele não é gerado com base nas configurações
atuais. Cada seção de nível superior é um namespace de regras: uma verificação
só é executada quando há uma regra concreta nela (seções ou chaves não
compatíveis falham como `policy/policy-jsonc-invalid`, em vez de serem ignoradas
silenciosamente). Exemplo mínimo que abrange todas as seções compatíveis:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Observações abrangentes que não são evidentes nas tabelas de regras abaixo:

- Omitir `gateway.bind` enquanto associações que não sejam local loopback são
  negadas significa que você aceita o padrão do runtime; defina
  `gateway.bind: "loopback"` para obter conformidade estrita.
- Para um agente somente leitura, defina o `mode` do sandbox como `all` ou
  `non-main` nos padrões ou no agente aplicável e defina `workspaceAccess` como
  `none` ou `ro`. Um modo de sandbox ausente ou definido como `off` não atende a
  uma política somente leitura.
- `agents.workspace.denyTools` aceita `exec`, `process`, `write`, `edit`,
  `apply_patch`. Os grupos de negação de ferramentas da configuração `group:fs`
  (alteração de arquivos) e `group:runtime` (shell/processo) atendem à postura
  equivalente.
- As verificações de aprovações de execução leem o artefato ativo
  `exec-approvals.json` somente quando há uma regra `execApprovals`; um artefato
  ausente ou inválido constitui evidência não observável, não uma aprovação
  sintética.
- As evidências de segredos e perfis de autenticação registram apenas a postura
  do provedor/origem e os metadados de SecretRef, nunca valores brutos. A
  política não lê nem atesta armazenamentos de credenciais por agente, como
  `auth-profiles.json`.
- A evidência de tratamento de dados representa apenas a postura no nível da
  configuração (modo de redação, controle de captura de telemetria, modo de
  manutenção de sessões e configuração de indexação de transcrições). Ela não
  inspeciona logs, exportações de telemetria, transcrições ou arquivos de
  memória, e um resultado sem problemas não comprova que eles não contenham
  dados pessoais ou segredos.

### Referência das regras de política

Todas as regras abaixo são opcionais; uma verificação só é executada quando a
regra está presente. O estado observado corresponde à configuração existente do
OpenClaw ou aos metadados do workspace.

#### Sobreposições com escopo

Use `scopes.<scopeName>` quando agentes ou canais específicos precisarem de uma
política mais estrita que a linha de base de nível superior. O nome do escopo é
apenas um rótulo; a correspondência usa o seletor dentro do escopo. As
sobreposições são aditivas: a regra global continua sendo executada, e a regra
com escopo pode adicionar sua própria constatação sobre a mesma evidência.

| Seletor      | Seções compatíveis                                                             | Use quando                                                     |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Um ou mais agentes de runtime precisam de regras mais estritas. |
| `channelIds` | `ingress.channels`                                                             | Um ou mais canais precisam de regras de entrada mais estritas. |

Se uma entrada de `agentIds` não estiver presente em `agents.list[]`, o OpenClaw
avalia a regra com escopo em relação à postura global/padrão herdada para esse
ID de agente de runtime, em vez de ignorá-la.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

O mesmo agente pode aparecer em vários escopos se cada escopo controlar um campo
diferente, como no exemplo acima. Um campo com escopo repetido para o mesmo
agente deve ser igualmente ou mais restritivo; uma declaração duplicada mais
permissiva é rejeitada (listas de permissões devem ser subconjuntos, listas de
negações devem ser superconjuntos e booleanos obrigatórios são fixos).

As regras de postura de contêiner (`sandbox.containers.*`) são verificadas apenas
em relação às evidências que o backend de sandbox do agente correspondente
consegue expor. Se um backend não puder observar uma regra habilitada para ele,
a política relatará `policy/sandbox-container-posture-unobservable` em vez de
aprová-la; aplique as regras de contêiner aos grupos de agentes que usam um
backend capaz de expô-las.

`ingress.session.requireDmScope` no nível superior permanece global;
`session.dmScope` não é uma evidência atribuível a um canal e, portanto, não
pode receber escopo por `channelIds`.

Todos os escopos presentes em `policy.jsonc` devem ser válidos e aplicáveis.

#### Canais

| Campo da política                    | Estado observado                       | Use quando                                                           |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Provedor e estado habilitado de `channels.*` | Para negar canais configurados de um provedor como `telegram`. |
| `channels.denyRules[].reason`        | Mensagem da constatação e contexto da orientação de correção | Para explicar por que o provedor é negado. |

#### Servidores MCP

| Campo da política   | Estado observado     | Use quando                                                                  |
| ------------------- | -------------------- | --------------------------------------------------------------------------- |
| `mcp.servers.allow` | IDs de `mcp.servers.*` | Para exigir que todos os servidores MCP configurados estejam em uma lista de permissões. |
| `mcp.servers.deny`  | IDs de `mcp.servers.*` | Para negar IDs específicos de servidores MCP configurados.                 |

#### Provedores de modelos

| Campo da política        | Estado observado                                        | Use quando                                                                                       |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `models.providers.allow` | IDs de `models.providers.*` e referências de modelos selecionadas | Para exigir que provedores configurados e referências de modelos selecionadas usem provedores aprovados. |
| `models.providers.deny`  | IDs de `models.providers.*` e referências de modelos selecionadas | Para negar provedores configurados e referências de modelos selecionadas pelo ID do provedor.            |

#### Rede

| Campo da política              | Estado observado                           | Use quando                                                                       |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Mecanismos de escape de SSRF da rede privada | Defina como `false` para exigir que o acesso à rede privada permaneça desabilitado. |

#### Entrada e acesso a canais

| Campo da política                           | Estado observado                                               | Use quando                                                                       |
| ------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`            | `session.dmScope`                                              | Exigir um escopo revisado de isolamento de mensagens diretas.                    |
| `ingress.channels.allowDmPolicies`          | `channels.*.dmPolicy` e campos legados de política de DM do canal | Permitir apenas políticas revisadas de canais de mensagens diretas.              |
| `ingress.channels.denyOpenGroups`           | Política de entrada de canal, conta e grupo                    | Negar entrada de grupos abertos para canais e contas configurados.               |
| `ingress.channels.requireMentionInGroups`   | Configuração de restrição por menção de canal, conta, grupo, servidor e níveis aninhados | Exigir restrições por menção quando a entrada de grupos estiver aberta ou condicionada a menções. |

#### Gateway

| Campo da política                         | Estado observado                                      | Use quando                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`   | `gateway.bind`                                        | Definir como `false` para exigir que o Gateway seja vinculado ao loopback.                       |
| `gateway.exposure.allowTailscaleFunnel`   | Postura de serviço/funil do Gateway no Tailscale      | Definir como `false` para negar a exposição pelo Tailscale Funnel.                               |
| `gateway.auth.requireAuth`                | `gateway.auth.mode`                                   | Definir como `true` para rejeitar a autenticação desativada do Gateway.                          |
| `gateway.auth.requireExplicitRateLimit`   | `gateway.auth.rateLimit`                              | Definir como `true` para exigir uma configuração explícita de limite de taxa de autenticação.   |
| `gateway.controlUi.allowInsecure`         | Opções inseguras de autenticação/dispositivo/origem da interface de controle | Definir como `false` para negar opções de exposição insegura da interface de controle.          |
| `gateway.remote.allow`                    | Modo/configuração de Gateway remoto                   | Definir como `false` para negar o modo de Gateway remoto.                                        |
| `gateway.http.denyEndpoints`              | Endpoints da API HTTP do Gateway                      | Negar IDs de endpoints, como `chatCompletions` ou `responses`.                                   |
| `gateway.http.requireUrlAllowlists`       | Entradas de busca de URL do Gateway via HTTP          | Definir como `true` para exigir listas de permissões de URLs nas entradas de busca de URL.       |
| `gateway.nodes.denyCommands`              | `gateway.nodes.denyCommands`                          | Exigir que IDs exatos de comandos de Node, como `system.run`, sejam negados na configuração do OpenClaw. |

`gateway.nodes.denyCommands` é uma regra exata, com distinção entre maiúsculas e minúsculas, que exige um superconjunto de negações.
Use-a quando a política precisar comprovar que comandos privilegiados de Node estão explicitamente
negados pela configuração do OpenClaw. Uma implantação que permita intencionalmente um comando
privilegiado de Node deve atualizar `policy.jsonc` após a revisão, em vez de depender
apenas de `gateway.nodes.allowCommands`.

#### Espaço de trabalho do agente

| Campo da política                  | Estado observado                                                                       | Use quando                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `agents.workspace.allowedAccess`   | `agents.defaults.sandbox.workspaceAccess` e `agents.list[].sandbox.workspaceAccess`    | Permitir apenas valores de acesso ao espaço de trabalho do sandbox, como `none` ou `ro`.          |
| `agents.workspace.denyTools`       | Configuração global e por agente de negação de ferramentas                             | Exigir que as ferramentas de mutação (`exec`, `process`, `write`, `edit`, `apply_patch`) sejam negadas. |

#### Postura do sandbox

| Campo da política                                     | Estado observado                                          | Use quando                                                           |
| ----------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` e modo por agente           | Permitir apenas modos de sandbox revisados, como `all` ou `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` e backend por agente     | Permitir apenas backends de sandbox revisados, como `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | Modo de rede de sandbox/navegador baseado em contêiner     | Negar o modo de rede do host.                                         |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modo de rede de sandbox/navegador baseado em contêiner     | Negar a associação ao namespace de rede de outro contêiner.           |
| `sandbox.containers.requireReadOnlyMounts`            | Modo de montagem de sandbox/navegador baseado em contêiner | Exigir que as montagens sejam somente leitura.                        |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montagem de sandbox/navegador baseado em contêiner | Negar montagens de sockets do runtime de contêineres.              |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura dos perfis de segurança de contêiner               | Negar perfis de segurança de contêiner sem confinamento.              |
| `sandbox.browser.requireCdpSourceRange`               | Intervalo de origem do CDP do navegador do sandbox         | Exigir que a exposição do CDP do navegador declare um intervalo de origem. |

A política considera a ausência de `sandbox.mode` como seu padrão implícito `off`; portanto,
`sandbox.requireMode` informa que um sandbox novo ou não configurado está fora de uma
lista de permissões como `["all"]`.

#### Tratamento de dados

| Campo da política                                    | Estado observado                                                                       | Use quando                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`     | `logging.redactSensitive`                                                              | Definir como `true` para rejeitar `logging.redactSensitive: "off"`.                 |
| `dataHandling.telemetry.denyContentCapture`          | `diagnostics.otel.captureContent`                                                      | Definir como `true` para rejeitar a captura de conteúdo por telemetria.             |
| `dataHandling.retention.requireSessionMaintenance`   | `session.maintenance.mode`                                                             | Definir como `true` para exigir o modo efetivo de manutenção de sessão `enforce`.   |
| `dataHandling.memory.denySessionTranscriptIndexing`  | `memory.qmd.sessions.enabled` e `agents.*.memorySearch.experimental.sessionMemory`     | Definir como `true` para rejeitar a indexação de transcrições de sessões na memória. |

#### Segredos

| Campo da política                    | Estado observado                                             | Use quando                                                                          |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`    | SecretRefs da configuração e declarações `secrets.providers.*` | Definir como `true` para exigir que SecretRefs apontem para provedores declarados. |
| `secrets.denySources`                | Fontes de provedores de segredos e fontes de SecretRef       | Negar fontes como `exec`, `file` ou outro nome de fonte configurado.                |
| `secrets.allowInsecureProviders`     | Indicadores de postura insegura de provedores de segredos    | Definir como `false` para rejeitar provedores que optem por uma postura insegura.   |

#### Aprovações de execução

As verificações de aprovação de execução leem o artefato de runtime `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` por padrão ou
`$OPENCLAW_STATE_DIR/exec-approvals.json` quando `OPENCLAW_STATE_DIR` estiver definido.
As regras de postura em `execApprovals.defaults.*` ou `execApprovals.agents.*`
exigem evidências legíveis do artefato; um artefato ausente ou inválido é informado como
evidência não observável, em vez de uma aprovação baseada em melhor esforço. Quando o artefato é legível, os campos
omitidos herdam os padrões do runtime: a ausência de `defaults.security` equivale a `full`, e
a ausência da segurança do agente herda esse padrão. As evidências incluem `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, o `argPattern` opcional, a postura efetiva de
`autoAllowSkills` e a origem da entrada — nunca o caminho/token do socket,
`commandText`, `lastUsedCommand`, caminhos resolvidos ou carimbos de data e hora.

| Campo da política                              | Estado observado                                                                        | Use quando                                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                    | Caminho ativo de runtime de `exec-approvals.json`                                       | Definir como `true` para exigir que o artefato de aprovações exista e possa ser analisado.         |
| `execApprovals.defaults.allowSecurity`         | `defaults.security`, com padrão `full`                                                  | Permitir apenas modos aprovados de segurança padrão das aprovações.                                |
| `execApprovals.agents.allowSecurity`           | `agents.*.security`, herdando os padrões                                                | Permitir apenas modos efetivos aprovados de segurança das aprovações por agente.                   |
| `execApprovals.agents.allowAutoAllowSkills`    | `defaults.autoAllowSkills` e `agents.*.autoAllowSkills`, herdando os padrões do runtime | Definir como `false` para exigir listas de permissões manuais estritas sem aprovação implícita da CLI de Skills. |
| `execApprovals.agents.allowlist.expected`      | Conjunto agregado de padrões de `agents.*.allowlist[]` e entradas opcionais de argPattern | Exigir que a lista de permissões das aprovações corresponda ao conjunto de padrões revisado.     |

Exemplo: exigir o artefato de aprovações, negar padrões permissivos e permitir
apenas a postura revisada de aprovação de execução para agentes selecionados.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Modos de segurança: "deny", "allowlist" ou "full".
      // Este padrão permite apenas a postura restritiva "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Os agentes selecionados podem usar a postura "allowlist" revisada, mas não "full".
          "allowSecurity": ["allowlist"],
          // false significa que as CLIs de Skills devem constar na allowlist revisada, em vez de
          // serem aprovadas implicitamente por autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entrada simples: padrão exato revisado do executável, sem argPattern.
              "travel-hub",
              // Entrada restrita: padrão acompanhado de uma expressão regular revisada para argumentos.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Perfis de autenticação

| Campo da política                | Estado observado                              | Use quando                                                                                                            |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata`  | Metadados de provedor e modo de `auth.profiles.*` | Exigir chaves de metadados como `provider` e `mode` nos perfis de autenticação da configuração.                       |
| `auth.profiles.allowModes`       | `auth.profiles.*.mode`                        | Permitir apenas modos compatíveis de perfil de autenticação, como `api_key`, `aws-sdk`, `oauth` ou `token`.           |

#### Metadados de ferramentas

| Campo da política        | Estado observado                  | Use quando                                                                                                     |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata`  | Declarações regidas em `TOOLS.md` | Exigir que as ferramentas regidas declarem chaves de metadados como `risk`, `sensitivity` ou `owner`.         |

#### Postura das ferramentas

| Campo da política                | Estado observado                                             | Use quando                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`           | `tools.profile` e `agents.list[].tools.profile`              | Permitir apenas IDs de perfil de ferramentas, como `minimal`, `messaging` ou `coding`.                                      |
| `tools.fs.requireWorkspaceOnly`  | `tools.fs.workspaceOnly` e substituições de `tools.fs` por agente | Definir como `true` para exigir que a postura da ferramenta de sistema de arquivos fique restrita ao espaço de trabalho.    |
| `tools.exec.allowSecurity`       | `tools.exec.security` e segurança de execução por agente     | Permitir apenas modos de segurança de execução, como `deny` ou `allowlist`.                                                  |
| `tools.exec.requireAsk`          | `tools.exec.ask` e modo de solicitação de execução por agente | Exigir uma postura de aprovação como `always`.                                                                                |
| `tools.exec.allowHosts`          | `tools.exec.host` e roteamento do host de execução por agente | Permitir apenas modos de roteamento do host de execução, como `sandbox`.                                                      |
| `tools.elevated.allow`           | `tools.elevated.enabled` e postura elevada por agente        | Definir como `false` para exigir que o modo elevado de ferramentas permaneça desativado.                                    |
| `tools.alsoAllow.expected`       | `tools.alsoAllow` e `tools.alsoAllow` por agente             | Exigir entradas exatas de `alsoAllow` e relatar concessões adicionais de ferramentas ausentes ou inesperadas.               |
| `tools.denyTools`                | `tools.deny` e `agents.list[].tools.deny`                    | Exigir que as listas configuradas de bloqueio de ferramentas incluam IDs ou grupos, como `group:runtime` e `group:fs`.      |

## Executar verificações

Execute verificações exclusivas da política durante a criação:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` executa apenas o conjunto de verificações da política e emite evidências, constatações
e hashes de atestado. As mesmas constatações também aparecem em
`openclaw doctor --lint` quando o Plugin Policy está ativado.

Compare um arquivo de política do operador com uma linha de base criada:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compara a sintaxe de um arquivo de política com a sintaxe de outro arquivo de política; ele
não inspeciona o estado de execução, as evidências, as credenciais nem os segredos. Ele usa os mesmos
metadados de regras que regem as sobreposições por escopo: as allowlists devem permanecer iguais ou
mais restritas, as listas de bloqueio devem permanecer iguais ou mais abrangentes, os booleanos obrigatórios devem manter
seu valor, as strings ordenadas só podem avançar em direção à extremidade mais restritiva da
ordem configurada e as listas exatas devem corresponder. A linha de base pode ser uma
política criada pela organização; a política verificada pode adicionar valores mais restritivos ou
regras adicionais. Uma regra de nível superior na política verificada pode satisfazer uma regra de linha de base com escopo quando
for igualmente ou mais restritiva. Os nomes dos escopos não precisam coincidir entre os
arquivos; a comparação é indexada pelo seletor (`agentIds`/`channelIds`) e pelo campo.

Comparação sem constatações (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

A saída sem constatações de `policy check --json` inclui hashes estáveis que um operador ou
supervisor pode registrar:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Configurar a política

A configuração da política fica em `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Configuração               | Finalidade                                                                        |
| -------------------------- | --------------------------------------------------------------------------------- |
| `enabled`                  | Ativar as verificações da política mesmo antes de `policy.jsonc` existir.         |
| `workspaceRepairs`         | Permitir que `doctor --fix` edite configurações do espaço de trabalho regidas pela política. |
| `expectedHash`             | Bloqueio opcional por hash para o artefato de política aprovado.                  |
| `expectedAttestationHash`  | Bloqueio opcional por hash para a última verificação da política aceita sem constatações. |
| `path`                     | Local do artefato de política relativo ao espaço de trabalho.                     |

Defina `plugins.entries.policy.config.enabled` como `false` para desativar as
verificações da política em um espaço de trabalho sem desinstalar o Plugin.

## Aceitar o estado da política

Exemplo de saída JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` identifica o artefato de regras criado. `evidence`
registra o estado observado do OpenClaw usado pelas verificações, e
`workspace.hash` identifica essa carga de evidências. `findingsHash` identifica
o conjunto exato de constatações. `checkedAt` registra quando a verificação foi executada.
`attestationHash` identifica a declaração estável (hash da política, hash das evidências,
hash das constatações e estado sem/com constatações) e exclui deliberadamente `checkedAt`,
portanto o mesmo estado da política sempre produz o mesmo hash de atestado. Juntos,
esses quatro valores formam a tupla de auditoria de uma verificação da política.

Se um Gateway ou supervisor usar a política para bloquear, aprovar ou anotar uma
ação de execução, ele deverá registrar o hash de atestado da última verificação
sem constatações. `checkedAt` permanece na saída JSON para os logs de auditoria, mas não faz parte do
hash estável.

Ciclo de vida para aceitar o estado da política:

1. Crie ou revise `policy.jsonc`.
2. Execute `openclaw policy check --json`.
3. Se não houver constatações, registre `attestation.policy.hash` como `expectedHash`.
4. Registre `attestation.attestationHash` como `expectedAttestationHash`.
5. Execute novamente `openclaw doctor --lint` na CI ou nos controles de lançamento.

Se as regras de política mudarem intencionalmente, atualize ambos os hashes aceitos com base em uma
verificação limpa. Se apenas as configurações do espaço de trabalho mudarem (a política permanecer igual),
normalmente apenas `expectedAttestationHash` será alterado.

Ativar ou atualizar as regras de `agents.workspace` adiciona evidências de `agentWorkspace`
ao hash do espaço de trabalho e ao hash de atestação; revise as novas evidências e
atualize os hashes de atestação aceitos após a ativação. Ativar ou atualizar
as regras de postura das ferramentas adiciona evidências de `toolPosture` da mesma forma.

`openclaw policy watch` executa novamente a verificação e informa quando as evidências atuais
deixam de corresponder a `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Use `--once` em CI ou scripts que precisem de uma única avaliação de desvio. Sem
`--once`, por padrão, ele consulta a cada dois segundos; use `--interval-ms` para alterar
o intervalo.

## Constatações

| ID da verificação                                        | Constatação                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | A política está ativada, mas `policy.jsonc` está ausente.                                                           |
| `policy/policy-jsonc-invalid`                            | Não é possível analisar a política ou ela contém entradas de regras malformadas.                                   |
| `policy/policy-hash-mismatch`                            | A política não corresponde ao `expectedHash` configurado.                                                          |
| `policy/attestation-hash-mismatch`                       | As evidências atuais da política deixaram de corresponder à atestação aceita.                                       |
| `policy/policy-conformance-invalid`                      | Um arquivo de política de referência ou verificado tem uma sintaxe de comparação inválida.                         |
| `policy/policy-conformance-missing`                      | Um arquivo de política verificado não contém uma regra exigida pelo arquivo de política de referência.             |
| `policy/policy-conformance-weaker`                       | Um arquivo de política verificado tem um valor menos restritivo que o arquivo de política de referência.           |
| `policy/channels-denied-provider`                        | Um canal ativado corresponde a uma regra de negação de canal.                                                       |
| `policy/mcp-denied-server`                               | Um servidor MCP configurado é negado pela política.                                                                 |
| `policy/mcp-unapproved-server`                           | Um servidor MCP configurado não está na lista de permissões.                                                        |
| `policy/models-denied-provider`                          | Um provedor de modelos ou uma referência de modelo configurada usa um provedor negado.                             |
| `policy/models-unapproved-provider`                      | Um provedor de modelos ou uma referência de modelo configurada não está na lista de permissões.                    |
| `policy/network-private-access-enabled`                  | Uma válvula de escape de SSRF para redes privadas está ativada quando a política a nega.                            |
| `policy/ingress-dm-policy-unapproved`                    | Uma política de mensagens diretas de canal não está na lista de permissões da política.                            |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` não corresponde ao escopo de isolamento de mensagens diretas exigido pela política.              |
| `policy/ingress-open-groups-denied`                      | Uma política de grupo de canal é `open` enquanto a política nega a entrada de grupos abertos.                      |
| `policy/ingress-group-mention-required`                  | Uma entrada de canal ou grupo desativa os controles de menção enquanto a política os exige.                        |
| `policy/gateway-non-loopback-bind`                       | A postura de vinculação do Gateway permite exposição fora de local loopback quando a política a nega.              |
| `policy/gateway-auth-disabled`                           | A autenticação do Gateway está desativada quando a política exige autenticação.                                     |
| `policy/gateway-rate-limit-missing`                      | A postura de limitação de taxa da autenticação do Gateway não é explícita quando a política a exige.               |
| `policy/gateway-control-ui-insecure`                     | As opções de exposição insegura da interface de controle do Gateway estão ativadas.                                |
| `policy/gateway-tailscale-funnel`                        | A exposição do Gateway pelo Tailscale Funnel está ativada quando a política a nega.                                 |
| `policy/gateway-remote-enabled`                          | O modo remoto do Gateway está ativo quando a política o nega.                                                       |
| `policy/gateway-http-endpoint-enabled`                   | Um endpoint da API HTTP do Gateway está ativado, embora seja negado pela política.                                  |
| `policy/gateway-http-url-fetch-unrestricted`             | A entrada de busca de URL por HTTP do Gateway não tem uma lista de URLs permitidas obrigatória.                     |
| `policy/gateway-node-command-denied`                     | Um comando de Node negado pela política não está negado na configuração do OpenClaw.                               |
| `policy/agents-workspace-access-denied`                  | O modo de sandbox do agente ou o acesso ao espaço de trabalho não está na lista de permissões da política.         |
| `policy/agents-tool-not-denied`                          | A configuração de um agente ou a configuração padrão não nega uma ferramenta cuja negação é exigida pela política.|
| `policy/tools-profile-unapproved`                        | Um perfil de ferramentas global ou por agente configurado não está na lista de permissões.                         |
| `policy/tools-fs-workspace-only-required`                | As ferramentas do sistema de arquivos não estão configuradas com uma postura de caminhos restrita ao espaço de trabalho. |
| `policy/tools-exec-security-unapproved`                  | O modo de segurança de execução não está na lista de permissões da política.                                        |
| `policy/tools-exec-ask-unapproved`                       | O modo de solicitação de execução não está na lista de permissões da política.                                      |
| `policy/tools-exec-host-unapproved`                      | O roteamento de host de execução não está na lista de permissões da política.                                       |
| `policy/tools-elevated-enabled`                          | O modo elevado de ferramentas está ativado quando a política o nega.                                                |
| `policy/tools-also-allow-missing`                        | Uma lista `alsoAllow` configurada não contém uma entrada exigida pela política.                                     |
| `policy/tools-also-allow-unexpected`                     | Uma lista `alsoAllow` configurada contém uma entrada não esperada pela política.                                    |
| `policy/tools-required-deny-missing`                     | Uma lista global ou por agente de ferramentas negadas não inclui uma ferramenta cuja negação é obrigatória.       |
| `policy/sandbox-mode-unapproved`                         | O modo de sandbox não está na lista de permissões da política.                                                      |
| `policy/sandbox-backend-unapproved`                      | O backend de sandbox não está na lista de permissões da política.                                                   |
| `policy/sandbox-container-posture-unobservable`          | Uma regra de postura de contêiner está ativada para um backend que não consegue observá-la.                         |
| `policy/sandbox-container-host-network-denied`           | Um sandbox ou navegador baseado em contêiner usa o modo de rede do host.                                            |
| `policy/sandbox-container-namespace-join-denied`         | Um sandbox ou navegador baseado em contêiner ingressa no namespace de outro contêiner.                             |
| `policy/sandbox-container-mount-mode-required`           | Uma montagem de sandbox ou navegador baseada em contêiner não é somente leitura.                                   |
| `policy/sandbox-container-runtime-socket-mount`          | Uma montagem de sandbox ou navegador baseada em contêiner expõe o soquete do runtime de contêiner.                 |
| `policy/sandbox-container-unconfined-profile`            | O perfil do sandbox de contêiner não está confinado quando a política nega essa condição.                           |
| `policy/sandbox-browser-cdp-source-range-missing`        | O intervalo de origem CDP do navegador no sandbox está ausente quando a política exige um.                         |
| `policy/data-handling-redaction-disabled`                | A redação de dados sensíveis nos logs está desativada quando a política a exige.                                   |
| `policy/data-handling-telemetry-content-capture`         | A captura de conteúdo de telemetria está ativada quando a política a nega.                                          |
| `policy/data-handling-session-retention-not-enforced`    | A manutenção da retenção de sessões não é aplicada quando a política a exige.                                      |
| `policy/data-handling-session-transcript-memory-enabled` | A indexação na memória das transcrições de sessão está ativada quando a política a nega.                            |
| `policy/secrets-unmanaged-provider`                      | Uma SecretRef da configuração referencia um provedor não declarado em `secrets.providers`.                         |
| `policy/secrets-denied-provider-source`                  | Um provedor de segredos da configuração ou uma SecretRef usa uma origem negada pela política.                      |
| `policy/secrets-insecure-provider`                       | Um provedor de segredos adota uma postura insegura quando a política a nega.                                        |
| `policy/auth-profile-invalid-metadata`                   | Um perfil de autenticação da configuração não contém metadados válidos de provedor ou modo.                        |
| `policy/auth-profile-unapproved-mode`                    | O modo de um perfil de autenticação da configuração não está na lista de permissões da política.                   |
| `policy/exec-approvals-missing`                          | A política exige `exec-approvals.json`, mas o artefato está ausente.                                                |
| `policy/exec-approvals-invalid`                          | Não é possível analisar o artefato de aprovações de execução configurado.                                           |
| `policy/exec-approvals-default-security-unapproved`      | Os padrões de aprovação de execução usam um modo de segurança que não está na lista de permissões da política.     |
| `policy/exec-approvals-agent-security-unapproved`        | O modo de segurança efetivo de aprovação de execução por agente não está na lista de permissões.                   |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Um agente de aprovação de execução permite implicitamente e de forma automática CLIs de Skills quando a política nega isso. |
| `policy/exec-approvals-allowlist-missing`                | A lista de permissões de aprovações não contém um padrão exigido pela política.                                     |
| `policy/exec-approvals-allowlist-unexpected`             | A lista de permissões de aprovações contém um padrão não esperado pela política.                                    |
| `policy/tools-missing-risk-level`                        | Uma declaração de ferramenta regida não contém metadados de risco.                                                  |
| `policy/tools-unknown-risk-level`                        | Uma declaração de ferramenta regida usa um valor de risco desconhecido.                                            |
| `policy/tools-missing-sensitivity-token`                 | Uma declaração de ferramenta regida não contém metadados de sensibilidade.                                         |
| `policy/tools-missing-owner`                             | Uma declaração de ferramenta regida não contém metadados de proprietário.                                          |
| `policy/tools-unknown-sensitivity-token`                 | Uma declaração de ferramenta regida usa um valor de sensibilidade desconhecido.                                    |

Uma constatação pode incluir tanto `target` (o item observado no espaço de trabalho que
não está em conformidade) quanto `requirement` (a regra definida que originou a constatação).
Atualmente, ambos são strings de endereço `oc://`, mas os nomes dos campos descrevem a função
na política, e não o formato do endereço.

Exemplos de constatações:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparo

`doctor --lint` e `policy check` são somente leitura.

`doctor --fix` edita as configurações do espaço de trabalho gerenciadas por política somente quando
`workspaceRepairs` está explicitamente habilitado; caso contrário, as verificações informam o que
reparariam e deixam as configurações inalteradas.

Nesta versão, o reparo pode desabilitar canais negados por `channels.denyRules` e
aplicar os reparos automáticos de restrição listados abaixo. Habilite `workspaceRepairs`
somente depois que o arquivo de política tiver sido revisado, pois uma regra válida pode alterar
a configuração do espaço de trabalho:

- definir `tools.elevated.enabled=false` quando uma política global proíbe ferramentas elevadas
- adicionar IDs ausentes de ferramentas cuja negação é obrigatória a `tools.deny` ou
  `agents.list[].tools.deny` quando a política exige que essas ferramentas sejam negadas
- definir opções inseguras de `gateway.controlUi.*` como `false`
- definir `gateway.mode=local` quando a política nega o modo remoto do Gateway
- definir os caminhos informados de `gateway.http.endpoints.*.enabled` como `false` quando a política
  nega endpoints da API HTTP do Gateway
- definir os caminhos informados de `groupPolicy` da entrada do canal como `allowlist` quando a política
  nega a entrada aberta de grupos
- definir os caminhos informados de `requireMention` da entrada do canal como `true` quando a política
  exige menções em grupos
- definir `logging.redactSensitive=tools` quando a política exige a ocultação de dados
  sensíveis nos logs
- definir `diagnostics.otel.captureContent=false`, ou
  `diagnostics.otel.captureContent.enabled=false` para configurações de captura de telemetria
  no formato de objeto, quando a política nega a captura de conteúdo de telemetria

Os reparos com escopo para ferramentas elevadas são somente de detecção. Os reparos com escopo para tratamento de dados
também são ignorados quando a constatação informa uma configuração compartilhada de logs ou telemetria,
pois alterar a configuração compartilhada afetaria mais do que o alvo da política com escopo.

Os reparos com escopo para negação obrigatória são ignorados quando a constatação informa
`tools.deny` raiz herdado, pois adicionar a ferramenta obrigatória à configuração raiz afetaria
mais do que o alvo da política com escopo. Os reparos de negação obrigatória locais do agente podem atualizar
o caminho informado de `agents.list[].tools.deny`.

Os reparos com escopo da entrada do canal são ignorados quando a constatação informa
`channels.defaults.*` herdado, pois alterar o padrão compartilhado do canal afetaria
mais do que o alvo da política com escopo. As constatações de lista de permissões para busca de URLs HTTP do Gateway
permanecem manuais, pois o reparo automático não pode escolher os valores corretos da
lista de permissões de URLs do endpoint.

As constatações de vinculação e de comandos de Node do Gateway continuam exigindo revisão. Quando
`policy/gateway-non-loopback-bind` ou `policy/gateway-node-command-denied`
podem ser mapeadas para um caminho de configuração, `doctor --fix` informa a alteração proposta
de `gateway.bind` ou `gateway.nodes.denyCommands` como uma orientação de prévia
ignorada. Ele não aplica a alteração, e a constatação não é considerada
reparada até que um operador revise e atualize a configuração ou a política.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Códigos de saída

| Comando          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Nenhuma constatação no limite.                         | Uma ou mais constatações atingiram o limite.                        | Falha de argumento ou de execução. |
| `policy compare` | O arquivo de política é pelo menos tão rigoroso quanto a linha de base. | O arquivo de política é inválido, está ausente ou é menos rigoroso que as regras da linha de base. | Falha de argumento ou de execução. |
| `policy watch`   | Nenhuma constatação, e o hash aceito está atualizado.  | Existem constatações ou a atestação aceita está desatualizada.      | Falha de argumento ou de execução. |

## Relacionado

- [Modo lint do Doctor](/pt-BR/cli/doctor#lint-mode)
- [CLI de caminhos](/pt-BR/cli/path)
