---
read_when:
    - Você quer verificar as configurações do OpenClaw em relação a um policy.jsonc criado manualmente
    - Você quer resultados de política na verificação do doctor
    - Você precisa de um hash de atestado de política como evidência de auditoria
summary: Referência da CLI para verificações de conformidade de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-12T15:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` é fornecido pelo Plugin Policy incluído. Ele é uma camada de
conformidade empresarial sobre as configurações existentes do OpenClaw, não um
segundo sistema de configuração. Você define os requisitos em `policy.jsonc`; o
OpenClaw observa o workspace ativo como evidência; a política relata desvios por
meio de `doctor --lint`. A política não impõe chamadas de ferramentas nem
reescreve o comportamento do runtime durante as solicitações e não atesta
repositórios de credenciais por agente, como `auth-profiles.json`.

A política verifica canais configurados, servidores MCP, provedores de modelos,
postura de SSRF da rede, acesso de entrada/canais, exposição do Gateway e postura
de comandos de Node, acesso ao workspace do agente, postura do sandbox, postura
de tratamento de dados, postura do provedor de segredos/perfil de autenticação e
metadados de ferramentas governadas (`TOOLS.md`). Use-a quando um workspace
precisar de uma declaração durável e verificável, como "O Telegram não deve
estar habilitado" ou "as ferramentas governadas devem declarar metadados de
risco e proprietário". Se você precisar apenas de comportamento local, sem
atestação ou detecção de desvios, a configuração comum é suficiente.

## Início rápido

```bash
openclaw plugins enable policy
```

O Plugin permanece habilitado mesmo quando `policy.jsonc` está ausente, para que
o doctor possa relatar a ausência do artefato em vez de ignorar silenciosamente
as verificações.

Crie `policy.jsonc` manualmente; ele não é gerado a partir das configurações
atuais. Cada seção de nível superior é um namespace de regras: uma verificação
só é executada quando há uma regra concreta nela (seções ou chaves não
compatíveis falham como `policy/policy-jsonc-invalid` em vez de serem ignoradas
silenciosamente). Exemplo mínimo que abrange todas as seções compatíveis:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "O Telegram não é aprovado para este workspace.",
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

Observações abrangentes que não ficam evidentes nas tabelas de regras abaixo:

- Omitir `gateway.bind` ao negar associações fora do loopback significa que você
  aceita o padrão do runtime; defina `gateway.bind: "loopback"` para
  conformidade estrita.
- Para um agente somente leitura, defina o `mode` do sandbox como `all` ou
  `non-main` nos padrões/agente aplicáveis e `workspaceAccess` como `none` ou
  `ro`. Um modo de sandbox ausente ou definido como `off` não atende a uma
  política somente leitura.
- `agents.workspace.denyTools` aceita `exec`, `process`, `write`, `edit`,
  `apply_patch`. Os grupos de negação de ferramentas da configuração `group:fs`
  (alteração de arquivos) e `group:runtime` (shell/processo) atendem à postura
  equivalente.
- As verificações de aprovações de execução leem o artefato ativo
  `exec-approvals.json` somente quando uma regra `execApprovals` está presente;
  um artefato ausente ou inválido é uma evidência não observável, não uma
  aprovação sintética.
- As evidências de segredos e perfis de autenticação registram somente a postura
  do provedor/origem e os metadados de SecretRef, nunca os valores brutos. A
  política não lê nem atesta repositórios de credenciais por agente, como
  `auth-profiles.json`.
- A evidência de tratamento de dados representa apenas a postura no nível da
  configuração (modo de redação, opção de captura de telemetria, modo de
  manutenção de sessões, configuração de indexação de transcrições). Ela não
  inspeciona logs, exportações de telemetria, transcrições ou arquivos de
  memória, e um resultado sem problemas não comprova que eles não contenham
  dados pessoais ou segredos.

### Referência das regras de política

Todas as regras abaixo são opcionais; uma verificação só é executada quando a
regra está presente. O estado observado corresponde à configuração existente
do OpenClaw ou aos metadados do workspace.

#### Sobreposições com escopo

Use `scopes.<scopeName>` quando agentes ou canais específicos precisarem de uma
política mais rigorosa do que a linha de base de nível superior. O nome do
escopo é apenas um rótulo; a correspondência usa o seletor dentro do escopo. As
sobreposições são aditivas: a regra global continua sendo executada, e a regra
com escopo pode adicionar sua própria constatação sobre a mesma evidência.

| Seletor      | Seções compatíveis                                                             | Use quando                                                   |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Um ou mais agentes de runtime precisam de regras mais rígidas. |
| `channelIds` | `ingress.channels`                                                             | Um ou mais canais precisam de regras de entrada mais rígidas. |

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

O mesmo agente pode aparecer em vários escopos se cada um deles controlar um
campo diferente, como acima. Um campo com escopo repetido para o mesmo agente
deve ser igualmente ou mais restritivo; uma declaração duplicada mais permissiva
é rejeitada (listas de permissões são subconjuntos, listas de negações são
superconjuntos e booleanos obrigatórios são fixos).

As regras de postura de contêiner (`sandbox.containers.*`) são verificadas apenas
em relação às evidências que o backend de sandbox do agente correspondente pode
expor. Se um backend não conseguir observar uma regra que você habilitou para
ele, a política relatará `policy/sandbox-container-posture-unobservable` em vez
de aprová-la; restrinja as regras de contêiner aos grupos de agentes que usam um
backend capaz de expô-las.

`ingress.session.requireDmScope` no nível superior permanece global;
`session.dmScope` não é uma evidência atribuível a um canal, portanto não pode
ter seu escopo definido por `channelIds`.

Todos os escopos presentes em `policy.jsonc` devem ser válidos e aplicáveis.

#### Canais

| Campo da política                     | Estado observado                         | Use quando                                                           |
| ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `channels.denyRules[].when.provider`  | Provedor e estado habilitado de `channels.*` | Negar canais configurados de um provedor como `telegram`.            |
| `channels.denyRules[].reason`         | Mensagem da constatação e contexto da sugestão de reparo | Explicar por que o provedor é negado.                    |

#### Servidores MCP

| Campo da política    | Estado observado      | Use quando                                                             |
| -------------------- | --------------------- | ---------------------------------------------------------------------- |
| `mcp.servers.allow`  | IDs de `mcp.servers.*` | Exigir que todos os servidores MCP configurados estejam em uma lista de permissões. |
| `mcp.servers.deny`   | IDs de `mcp.servers.*` | Negar IDs específicos de servidores MCP configurados.                  |

#### Provedores de modelos

| Campo da política          | Estado observado                                         | Use quando                                                                                      |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `models.providers.allow`   | IDs de `models.providers.*` e referências de modelos selecionados | Exigir que provedores configurados e referências de modelos selecionados usem provedores aprovados. |
| `models.providers.deny`    | IDs de `models.providers.*` e referências de modelos selecionados | Negar provedores configurados e referências de modelos selecionados pelo ID do provedor.            |

#### Rede

| Campo da política                  | Estado observado                       | Use quando                                                                   |
| ---------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `network.privateNetwork.allow`     | Exceções de escape de SSRF para redes privadas | Defina como `false` para exigir que o acesso à rede privada permaneça desabilitado. |

#### Entrada e acesso a canais

| Campo da política                          | Estado observado                                               | Use quando                                                                 |
| ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`           | `session.dmScope`                                              | Exigir um escopo revisado de isolamento de mensagens diretas.              |
| `ingress.channels.allowDmPolicies`         | `channels.*.dmPolicy` e campos legados de política de MD do canal | Permitir somente políticas revisadas de canal de mensagens diretas.        |
| `ingress.channels.denyOpenGroups`          | Política de entrada de canal, conta e grupo                    | Negar entrada de grupos abertos nos canais e contas configurados.          |
| `ingress.channels.requireMentionInGroups`  | Configuração de controle de menções de canal, conta, grupo, servidor e controles aninhados | Exigir controles de menção quando a entrada de grupos estiver aberta ou condicionada a menções. |

#### Gateway

| Campo da política                        | Estado observado                                      | Use quando                                                                                 |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind`  | `gateway.bind`                                        | Definir como `false` para exigir que o Gateway seja vinculado à interface de loopback.      |
| `gateway.exposure.allowTailscaleFunnel`  | Postura de serviço/funil do Gateway no Tailscale      | Definir como `false` para negar a exposição pelo Tailscale Funnel.                          |
| `gateway.auth.requireAuth`               | `gateway.auth.mode`                                   | Definir como `true` para rejeitar a autenticação desativada do Gateway.                     |
| `gateway.auth.requireExplicitRateLimit`  | `gateway.auth.rateLimit`                              | Definir como `true` para exigir configuração explícita de limite de taxa da autenticação.   |
| `gateway.controlUi.allowInsecure`        | Opções inseguras de autenticação/dispositivo/origem da interface de controle | Definir como `false` para negar opções inseguras de exposição da interface de controle. |
| `gateway.remote.allow`                   | Modo/configuração remota do Gateway                   | Definir como `false` para negar o modo remoto do Gateway.                                   |
| `gateway.http.denyEndpoints`             | Endpoints da API HTTP do Gateway                      | Negar IDs de endpoint, como `chatCompletions` ou `responses`.                               |
| `gateway.http.requireUrlAllowlists`      | Entradas de busca de URL via HTTP do Gateway          | Definir como `true` para exigir listas de URLs permitidas nas entradas de busca de URL.     |
| `gateway.nodes.denyCommands`             | `gateway.nodes.denyCommands`                          | Exigir que IDs exatos de comandos de Node, como `system.run`, sejam negados na configuração do OpenClaw. |

`gateway.nodes.denyCommands` é uma regra exata de superconjunto de negação, com distinção entre maiúsculas e minúsculas.
Use-a quando a política precisar comprovar que comandos privilegiados de Node estão explicitamente
negados pela configuração do OpenClaw. Uma implantação que permita intencionalmente um comando privilegiado
de Node deve atualizar `policy.jsonc` após a revisão, em vez de depender somente de
`gateway.nodes.allowCommands`.

#### Espaço de trabalho do agente

| Campo da política                  | Estado observado                                                                        | Use quando                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess`   | `agents.defaults.sandbox.workspaceAccess` e `agents.list[].sandbox.workspaceAccess`     | Permitir somente valores de acesso do sandbox ao espaço de trabalho, como `none` ou `ro`.          |
| `agents.workspace.denyTools`       | Configuração global e por agente de negação de ferramentas                              | Exigir que ferramentas de mutação (`exec`, `process`, `write`, `edit`, `apply_patch`) sejam negadas. |

#### Postura do sandbox

| Campo da política                                    | Estado observado                                         | Use quando                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` e modo por agente         | Permitir somente modos de sandbox revisados, como `all` ou `non-main`.  |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` e backend por agente   | Permitir somente backends de sandbox revisados, como `docker`.          |
| `sandbox.containers.denyHostNetwork`                 | Modo de rede do sandbox/navegador baseado em contêiner   | Negar o modo de rede do host.                                           |
| `sandbox.containers.denyContainerNamespaceJoin`      | Modo de rede do sandbox/navegador baseado em contêiner   | Negar a associação ao namespace de rede de outro contêiner.             |
| `sandbox.containers.requireReadOnlyMounts`           | Modo de montagem do sandbox/navegador baseado em contêiner | Exigir que as montagens sejam somente leitura.                        |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montagem do sandbox/navegador baseado em contêiner | Negar montagens de sockets do runtime de contêiner.                 |
| `sandbox.containers.denyUnconfinedProfiles`          | Postura do perfil de segurança do contêiner              | Negar perfis de segurança de contêiner sem confinamento.                |
| `sandbox.browser.requireCdpSourceRange`              | Intervalo de origem do CDP do navegador do sandbox       | Exigir que a exposição do CDP do navegador declare um intervalo de origem. |

A política trata a ausência de `sandbox.mode` como seu padrão implícito `off`, portanto
`sandbox.requireMode` considera um sandbox novo ou não configurado como fora de uma
lista de permissões como `["all"]`.

#### Tratamento de dados

| Campo da política                                   | Estado observado                                                                     | Use quando                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Defina como `true` para rejeitar `logging.redactSensitive: "off"`.                |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Defina como `true` para rejeitar a captura de conteúdo de telemetria.             |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Defina como `true` para exigir o modo efetivo de manutenção de sessão `enforce`.  |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` e `agents.*.memorySearch.experimental.sessionMemory`   | Defina como `true` para rejeitar a indexação de transcrições de sessão na memória. |

#### Segredos

| Campo da política                      | Estado observado                                           | Use quando                                                                       |
| -------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`      | SecretRefs da configuração e declarações `secrets.providers.*` | Defina como `true` para exigir que SecretRefs apontem para provedores declarados. |
| `secrets.denySources`                  | Origens dos provedores de segredos e das SecretRefs        | Negue origens como `exec`, `file` ou outro nome de origem configurado.            |
| `secrets.allowInsecureProviders`       | Sinalizadores de postura insegura de provedores de segredos | Defina como `false` para rejeitar provedores que optem por uma postura insegura.  |

#### Aprovações de execução

As verificações de aprovações de execução leem o artefato `exec-approvals.json` do runtime:
`~/.openclaw/exec-approvals.json` por padrão ou
`$OPENCLAW_STATE_DIR/exec-approvals.json` quando `OPENCLAW_STATE_DIR` está definido.
As regras de postura em `execApprovals.defaults.*` ou `execApprovals.agents.*`
exigem evidências legíveis do artefato; um artefato ausente ou inválido é relatado como
evidência não observável, em vez de uma aprovação baseada no melhor esforço. Quando o artefato é legível, os
campos omitidos herdam os padrões do runtime: a ausência de `defaults.security` equivale a `full`, e a
segurança ausente do agente herda esse padrão. As evidências incluem `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, o `argPattern` opcional, a postura efetiva de
`autoAllowSkills` e a origem da entrada — nunca o caminho/token do soquete,
`commandText`, `lastUsedCommand`, caminhos resolvidos ou carimbos de data e hora.

| Campo da política                            | Estado observado                                                                         | Use quando                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                  | Caminho ativo de `exec-approvals.json` no runtime                                        | Defina como `true` para exigir que o artefato de aprovações exista e possa ser analisado.           |
| `execApprovals.defaults.allowSecurity`       | `defaults.security`, com padrão `full`                                                   | Permita apenas modos de segurança de aprovação padrão aprovados.                                   |
| `execApprovals.agents.allowSecurity`         | `agents.*.security`, herdando os padrões                                                 | Permita apenas modos efetivos aprovados de segurança de aprovação por agente.                       |
| `execApprovals.agents.allowAutoAllowSkills`  | `defaults.autoAllowSkills` e `agents.*.autoAllowSkills`, herdando os padrões do runtime  | Defina como `false` para exigir listas de permissões manuais estritas sem aprovação implícita da CLI de Skills. |
| `execApprovals.agents.allowlist.expected`    | Conjunto agregado de padrões `agents.*.allowlist[]` e entradas opcionais de argPattern   | Exija que a lista de permissões das aprovações corresponda ao conjunto de padrões revisado.         |

Exemplo: exija o artefato de aprovações, negue padrões permissivos e permita
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
          // false significa que as CLIs de Skills devem constar na "allowlist" revisada, em vez de
          // serem aprovadas implicitamente por autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entrada simples: padrão exato e revisado do executável, sem argPattern.
              "travel-hub",
              // Entrada restrita: padrão mais expressão regular revisada para os argumentos.
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

| Campo da política               | Estado observado                                 | Use quando                                                                                                      |
| ------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadados de provedor e modo de `auth.profiles.*` | Exigir chaves de metadados como `provider` e `mode` nos perfis de autenticação da configuração.                  |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                           | Permitir apenas modos de perfil de autenticação compatíveis, como `api_key`, `aws-sdk`, `oauth` ou `token`.      |

#### Metadados de ferramentas

| Campo da política       | Estado observado                  | Use quando                                                                                             |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Declarações regidas em `TOOLS.md` | Exigir que as ferramentas regidas declarem chaves de metadados como `risk`, `sensitivity` ou `owner`. |

#### Postura das ferramentas

| Campo da política               | Estado observado                                             | Use quando                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` e `agents.list[].tools.profile`              | Permitir apenas IDs de perfis de ferramentas como `minimal`, `messaging` ou `coding`.                                       |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` e substituições `tools.fs` por agente | Definir como `true` para exigir que a postura das ferramentas do sistema de arquivos seja restrita ao workspace.          |
| `tools.exec.allowSecurity`      | `tools.exec.security` e segurança de execução por agente     | Permitir apenas modos de segurança de execução como `deny` ou `allowlist`.                                                  |
| `tools.exec.requireAsk`         | `tools.exec.ask` e modo de solicitação de execução por agente | Exigir uma postura de aprovação como `always`.                                                                            |
| `tools.exec.allowHosts`         | `tools.exec.host` e roteamento do host de execução por agente | Permitir apenas modos de roteamento do host de execução como `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` e postura elevada por agente        | Definir como `false` para exigir que o modo elevado das ferramentas permaneça desativado.                                  |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` e `tools.alsoAllow` por agente             | Exigir entradas `alsoAllow` exatas e relatar concessões aditivas de ferramentas ausentes ou inesperadas.                  |
| `tools.denyTools`               | `tools.deny` e `agents.list[].tools.deny`                    | Exigir que as listas configuradas de negação de ferramentas incluam IDs ou grupos de ferramentas como `group:runtime` e `group:fs`. |

## Executar verificações

Execute verificações somente de política durante a criação:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` executa apenas o conjunto de verificações de política e emite evidências, constatações
e hashes de atestado. As mesmas constatações também aparecem em
`openclaw doctor --lint` quando o Plugin Policy está ativado.

Compare um arquivo de política do operador com uma linha de base criada:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` verifica a sintaxe de um arquivo de política em relação à sintaxe de outro arquivo de política; ele
não inspeciona o estado de execução, evidências, credenciais nem segredos. Ele usa os mesmos
metadados de regras que regem as sobreposições com escopo: listas de permissões devem permanecer iguais ou
mais restritas, listas de negações devem permanecer iguais ou mais abrangentes, booleanos obrigatórios devem manter
seu valor, strings ordenadas só podem avançar para a extremidade mais restrita da
ordem configurada e listas exatas devem corresponder. A linha de base pode ser uma
política criada pela organização; a política verificada pode adicionar valores mais restritos ou
regras extras. Uma regra verificada no nível superior pode satisfazer uma regra com escopo da linha de base quando
for igualmente ou mais restritiva. Os nomes dos escopos não precisam corresponder entre
os arquivos; a comparação é indexada pelo seletor (`agentIds`/`channelIds`) e pelo campo.

Comparação sem problemas (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

A saída sem problemas de `policy check --json` inclui hashes estáveis que um operador ou
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

| Configuração              | Finalidade                                                                  |
| ------------------------- | --------------------------------------------------------------------------- |
| `enabled`                 | Ativar verificações de política mesmo antes que `policy.jsonc` exista.      |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite configurações do workspace geridas pela política. |
| `expectedHash`            | Bloqueio opcional por hash para o artefato de política aprovado.            |
| `expectedAttestationHash` | Bloqueio opcional por hash para a última verificação de política aceita sem problemas. |
| `path`                    | Local relativo ao workspace do artefato de política.                        |

Defina `plugins.entries.policy.config.enabled` como `false` para desativar as verificações de
política em um workspace, mantendo o plugin instalado.

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
`workspace.hash` identifica esse conteúdo de evidências. `findingsHash` identifica
o conjunto exato de constatações. `checkedAt` registra quando a verificação foi executada.
`attestationHash` identifica a declaração estável (hash da política, hash das evidências,
hash das constatações e estado sem problemas/com problemas) e exclui deliberadamente `checkedAt`,
de modo que o mesmo estado da política sempre produza o mesmo hash de atestado. Em conjunto,
esses quatro valores formam a tupla de auditoria de uma verificação de política.

Se um Gateway ou supervisor usar a política para bloquear, aprovar ou anotar uma
ação de execução, ele deverá registrar o hash de atestado da última verificação
sem problemas. `checkedAt` permanece na saída JSON para os logs de auditoria, mas não faz parte do
hash estável.

Ciclo de vida para aceitar o estado da política:

1. Crie ou revise `policy.jsonc`.
2. Execute `openclaw policy check --json`.
3. Se não houver problemas, registre `attestation.policy.hash` como `expectedHash`.
4. Registre `attestation.attestationHash` como `expectedAttestationHash`.
5. Execute novamente `openclaw doctor --lint` na CI ou nos gates de lançamento.

Se as regras de política forem alteradas intencionalmente, atualize ambos os hashes aceitos a partir de uma
verificação limpa. Se apenas as configurações do workspace forem alteradas (a política permanecer igual),
normalmente apenas `expectedAttestationHash` será alterado.

Ativar ou atualizar as regras de `agents.workspace` adiciona evidências de `agentWorkspace`
ao hash do workspace e ao hash de atestação; revise as novas evidências e
atualize os hashes de atestação aceitos após a ativação. Ativar ou atualizar
as regras de postura de ferramentas adiciona evidências de `toolPosture` da mesma forma.

`openclaw policy watch` executa novamente a verificação e informa quando as evidências atuais
deixam de corresponder a `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Use `--once` em CI ou scripts que precisem de uma única avaliação de desvio. Sem
`--once`, por padrão, ele verifica a cada dois segundos; use `--interval-ms` para alterar
o intervalo.

## Constatações

| ID da verificação                                        | Constatação                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | A política está ativada, mas `policy.jsonc` está ausente.                          |
| `policy/policy-jsonc-invalid`                            | Não é possível analisar a política, ou ela contém entradas de regras malformadas. |
| `policy/policy-hash-mismatch`                            | A política não corresponde ao `expectedHash` configurado.                         |
| `policy/attestation-hash-mismatch`                       | As evidências atuais da política deixaram de corresponder à atestação aceita.      |
| `policy/policy-conformance-invalid`                      | Um arquivo de política de referência ou verificado tem sintaxe de comparação inválida. |
| `policy/policy-conformance-missing`                      | Um arquivo de política verificado não contém uma regra exigida pelo arquivo de política de referência. |
| `policy/policy-conformance-weaker`                       | Um arquivo de política verificado tem um valor mais fraco que o arquivo de política de referência. |
| `policy/channels-denied-provider`                        | Um canal ativado corresponde a uma regra de negação de canal.                      |
| `policy/mcp-denied-server`                               | Um servidor MCP configurado é negado pela política.                               |
| `policy/mcp-unapproved-server`                           | Um servidor MCP configurado está fora da lista de permissões.                      |
| `policy/models-denied-provider`                          | Um provedor de modelo ou uma referência de modelo configurada usa um provedor negado. |
| `policy/models-unapproved-provider`                      | Um provedor de modelo ou uma referência de modelo configurada está fora da lista de permissões. |
| `policy/network-private-access-enabled`                  | Uma válvula de escape de SSRF para rede privada está ativada quando a política a nega. |
| `policy/ingress-dm-policy-unapproved`                    | Uma política de mensagens diretas de canal está fora da lista de permissões da política. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` não corresponde ao escopo de isolamento de mensagens diretas exigido pela política. |
| `policy/ingress-open-groups-denied`                      | Uma política de grupo de canal é `open` enquanto a política nega a entrada de grupos abertos. |
| `policy/ingress-group-mention-required`                  | Uma entrada de canal ou grupo desativa os controles de menção enquanto a política os exige. |
| `policy/gateway-non-loopback-bind`                       | A postura de vinculação do Gateway permite exposição fora de loopback quando a política a nega. |
| `policy/gateway-auth-disabled`                           | A autenticação do Gateway está desativada quando a política exige autenticação.    |
| `policy/gateway-rate-limit-missing`                      | A postura de limite de taxa da autenticação do Gateway não está explícita quando a política a exige. |
| `policy/gateway-control-ui-insecure`                     | As opções de exposição insegura da interface de controle do Gateway estão ativadas. |
| `policy/gateway-tailscale-funnel`                        | A exposição do Gateway pelo Tailscale Funnel está ativada quando a política a nega. |
| `policy/gateway-remote-enabled`                          | O modo remoto do Gateway está ativo quando a política o nega.                      |
| `policy/gateway-http-endpoint-enabled`                   | Um endpoint da API HTTP do Gateway está ativado embora seja negado pela política.  |
| `policy/gateway-http-url-fetch-unrestricted`             | A entrada de busca de URL HTTP do Gateway não tem uma lista de permissões de URLs obrigatória. |
| `policy/gateway-node-command-denied`                     | Um comando de Node negado pela política não é negado pela configuração do OpenClaw. |
| `policy/agents-workspace-access-denied`                  | O modo de sandbox do agente ou o acesso ao workspace está fora da lista de permissões da política. |
| `policy/agents-tool-not-denied`                          | Uma configuração de agente ou padrão não nega uma ferramenta cuja negação é exigida pela política. |
| `policy/tools-profile-unapproved`                        | Um perfil de ferramentas global ou por agente configurado está fora da lista de permissões. |
| `policy/tools-fs-workspace-only-required`                | As ferramentas do sistema de arquivos não estão configuradas com postura de caminho restrita ao workspace. |
| `policy/tools-exec-security-unapproved`                  | O modo de segurança de execução está fora da lista de permissões da política.      |
| `policy/tools-exec-ask-unapproved`                       | O modo de solicitação de execução está fora da lista de permissões da política.    |
| `policy/tools-exec-host-unapproved`                      | O roteamento do host de execução está fora da lista de permissões da política.     |
| `policy/tools-elevated-enabled`                          | O modo elevado de ferramentas está ativado quando a política o nega.               |
| `policy/tools-also-allow-missing`                        | Uma lista `alsoAllow` configurada não contém uma entrada exigida pela política.    |
| `policy/tools-also-allow-unexpected`                     | Uma lista `alsoAllow` configurada inclui uma entrada não esperada pela política.   |
| `policy/tools-required-deny-missing`                     | Uma lista global ou por agente de ferramentas negadas não inclui uma ferramenta cuja negação é obrigatória. |
| `policy/sandbox-mode-unapproved`                         | O modo de sandbox está fora da lista de permissões da política.                    |
| `policy/sandbox-backend-unapproved`                      | O backend de sandbox está fora da lista de permissões da política.                 |
| `policy/sandbox-container-posture-unobservable`          | Uma regra de postura de contêiner está ativada para um backend que não consegue observá-la. |
| `policy/sandbox-container-host-network-denied`           | Um sandbox ou navegador baseado em contêiner usa o modo de rede do host.           |
| `policy/sandbox-container-namespace-join-denied`         | Um sandbox ou navegador baseado em contêiner ingressa no namespace de outro contêiner. |
| `policy/sandbox-container-mount-mode-required`           | Uma montagem de sandbox ou navegador baseada em contêiner não é somente leitura.  |
| `policy/sandbox-container-runtime-socket-mount`          | Uma montagem de sandbox ou navegador baseada em contêiner expõe o socket do runtime de contêiner. |
| `policy/sandbox-container-unconfined-profile`            | O perfil do sandbox de contêiner não está confinado quando a política nega essa condição. |
| `policy/sandbox-browser-cdp-source-range-missing`        | O intervalo de origem CDP do navegador do sandbox está ausente quando a política exige um. |
| `policy/data-handling-redaction-disabled`                | A redação de dados sensíveis nos logs está desativada quando a política a exige.   |
| `policy/data-handling-telemetry-content-capture`         | A captura de conteúdo de telemetria está ativada quando a política a nega.         |
| `policy/data-handling-session-retention-not-enforced`    | A manutenção da retenção de sessões não é aplicada quando a política a exige.      |
| `policy/data-handling-session-transcript-memory-enabled` | A indexação na memória das transcrições de sessão está ativada quando a política a nega. |
| `policy/secrets-unmanaged-provider`                      | Uma SecretRef da configuração referencia um provedor não declarado em `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Um provedor de segredos ou uma SecretRef da configuração usa uma origem negada pela política. |
| `policy/secrets-insecure-provider`                       | Um provedor de segredos opta por uma postura insegura quando a política a nega.    |
| `policy/auth-profile-invalid-metadata`                   | Um perfil de autenticação da configuração não contém metadados válidos de provedor ou modo. |
| `policy/auth-profile-unapproved-mode`                    | O modo de um perfil de autenticação da configuração está fora da lista de permissões da política. |
| `policy/exec-approvals-missing`                          | A política exige `exec-approvals.json`, mas o artefato está ausente.               |
| `policy/exec-approvals-invalid`                          | Não é possível analisar o artefato de aprovações de execução configurado.          |
| `policy/exec-approvals-default-security-unapproved`      | Os padrões de aprovação de execução usam um modo de segurança fora da lista de permissões da política. |
| `policy/exec-approvals-agent-security-unapproved`        | Um modo efetivo de segurança de aprovação de execução por agente está fora da lista de permissões. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Um agente de aprovação de execução permite implicitamente e de forma automática as CLIs de Skills quando a política nega isso. |
| `policy/exec-approvals-allowlist-missing`                | A lista de permissões de aprovações não contém um padrão exigido pela política.    |
| `policy/exec-approvals-allowlist-unexpected`             | A lista de permissões de aprovações inclui um padrão não esperado pela política.   |
| `policy/tools-missing-risk-level`                        | Uma declaração de ferramenta controlada não contém metadados de risco.            |
| `policy/tools-unknown-risk-level`                        | Uma declaração de ferramenta controlada usa um valor de risco desconhecido.       |
| `policy/tools-missing-sensitivity-token`                 | Uma declaração de ferramenta controlada não contém metadados de sensibilidade.    |
| `policy/tools-missing-owner`                             | Uma declaração de ferramenta controlada não contém metadados de proprietário.     |
| `policy/tools-unknown-sensitivity-token`                 | Uma declaração de ferramenta controlada usa um valor de sensibilidade desconhecido. |

Uma constatação pode incluir tanto `target` (o elemento observado no workspace que não
está em conformidade) quanto `requirement` (a regra definida que gerou a constatação).
Atualmente, ambos são strings de endereço `oc://`, mas os nomes dos campos descrevem a função
na política, e não o formato do endereço.

Exemplos de constatações:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "O canal 'telegram' usa o provedor negado 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "O Telegram não está aprovado para este workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "A ferramenta 'deploy' de TOOLS.md não tem uma classificação de risco explícita.",
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
  "message": "O servidor MCP 'remote' não está na lista de permissões da política.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "A referência de modelo 'anthropic/claude-sonnet-4.7' usa o provedor não aprovado 'anthropic'.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "A configuração de rede 'browser-private-network' permite acesso à rede privada.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "A configuração de vinculação do Gateway 'gateway-bind' permite exposição fora da interface de loopback.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "O comando de Node do Gateway 'system.run' é negado pela política, mas não pela configuração do OpenClaw.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Adicione 'system.run' a gateway.nodes.denyCommands ou atualize a política após a revisão."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "O workspaceAccess 'rw' do sandbox de agents.defaults não é permitido pela política.",
  "source": "policy",
  "path": "configuração do openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparo

`doctor --lint` e `policy check` são somente leitura.

`doctor --fix` só edita configurações do espaço de trabalho gerenciadas por política quando
`workspaceRepairs` está explicitamente habilitado; caso contrário, as verificações informam o que
reparariam e deixam as configurações inalteradas.

Nesta versão, o reparo pode desabilitar canais negados por `channels.denyRules` e
aplicar os reparos automáticos de restrição listados abaixo. Habilite `workspaceRepairs`
somente após a revisão do arquivo de política, pois uma regra válida pode alterar a
configuração do espaço de trabalho:

- definir `tools.elevated.enabled=false` quando uma política global proíbe ferramentas elevadas
- adicionar IDs de ferramentas obrigatoriamente negadas ausentes a `tools.deny` ou
  `agents.list[].tools.deny` quando a política exige que essas ferramentas sejam negadas
- definir opções inseguras de `gateway.controlUi.*` como `false`
- definir `gateway.mode=local` quando a política nega o modo remoto do Gateway
- definir os caminhos informados de `gateway.http.endpoints.*.enabled` como `false` quando a política
  nega endpoints da API HTTP do Gateway
- definir os caminhos informados de entrada de canais `groupPolicy` como `allowlist` quando a política
  nega a entrada aberta de grupos
- definir os caminhos informados de entrada de canais `requireMention` como `true` quando a política
  exige menções em grupos
- definir `logging.redactSensitive=tools` quando a política exige a ocultação de dados
  sensíveis nos logs
- definir `diagnostics.otel.captureContent=false` ou
  `diagnostics.otel.captureContent.enabled=false` para configurações de captura de telemetria
  no formato de objeto, quando a política nega a captura de conteúdo de telemetria

Os reparos de ferramentas elevadas com escopo são apenas de detecção. Os reparos de tratamento de dados com escopo
também são ignorados quando a constatação informa uma configuração compartilhada de logs ou telemetria,
pois alterar a configuração compartilhada afetaria mais do que o alvo da política com escopo.

Os reparos de negação obrigatória com escopo são ignorados quando a constatação informa o
`tools.deny` raiz herdado, pois adicionar a ferramenta obrigatória à configuração raiz afetaria
mais do que o alvo da política com escopo. Os reparos de negação obrigatória locais do agente podem atualizar
o caminho informado `agents.list[].tools.deny`.

Os reparos de entrada de canais com escopo são ignorados quando a constatação informa
`channels.defaults.*` herdado, pois alterar o padrão compartilhado do canal afetaria
mais do que o alvo da política com escopo. As constatações da lista de permissões de busca de URLs HTTP do Gateway
permanecem manuais, pois o reparo automático não pode escolher os valores corretos da
lista de permissões de URLs de endpoints.

As constatações de vinculação e de comandos de Node do Gateway continuam exigindo revisão. Quando
`policy/gateway-non-loopback-bind` ou `policy/gateway-node-command-denied`
podem ser mapeados para um caminho de configuração, `doctor --fix` informa a alteração proposta de
`gateway.bind` ou `gateway.nodes.denyCommands` como orientação de prévia ignorada.
Ele não aplica a alteração, e a constatação não é considerada reparada até que um operador
revise e atualize a configuração ou a política.

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

| Comando          | `0`                                                          | `1`                                                                        | `2`                              |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | Nenhuma constatação no limite.                               | Uma ou mais constatações atingiram o limite.                               | Falha de argumento ou execução.  |
| `policy compare` | O arquivo de política é pelo menos tão rigoroso quanto a base de referência. | O arquivo de política é inválido, está ausente ou é menos rigoroso que as regras da base de referência. | Falha de argumento ou execução.  |
| `policy watch`   | Nenhuma constatação e o hash aceito está atualizado.         | Há constatações ou a atestação aceita está desatualizada.                   | Falha de argumento ou execução.  |

## Relacionado

- [Modo lint do Doctor](/pt-BR/cli/doctor#lint-mode)
- [CLI de caminhos](/pt-BR/cli/path)
