---
doc-schema-version: 1
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de Plugin
    - Você está escolhendo entre documentação de canal, provedor, backend da CLI, ferramenta ou hook
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-07-04T08:44:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins estendem o OpenClaw sem alterar o núcleo. Um Plugin pode adicionar um
canal de mensagens, provedor de modelo, backend de CLI local, ferramenta de agente,
hook, provedor de mídia ou outra capacidade pertencente ao Plugin.

Você não precisa adicionar um Plugin externo ao repositório do OpenClaw. Publique
o pacote no [ClawHub](/pt-BR/clawhub) e os usuários o instalam com:

```bash
openclaw plugins install clawhub:<package-name>
```

Especificações de pacote simples ainda são instaladas do npm durante a transição
de lançamento. Use o prefixo `clawhub:` quando quiser a resolução do ClawHub.

## Requisitos

- Use Node 22.19+, Node 23.11+ ou Node 24+ e um gerenciador de pacotes como `npm` ou `pnpm`.
- Tenha familiaridade com módulos TypeScript ESM.
- Para trabalho com Plugin empacotado no repositório, clone o repositório e execute `pnpm install`.
  O desenvolvimento de Plugin em checkout de código-fonte usa apenas pnpm, porque o OpenClaw carrega Plugins
  empacotados dos pacotes de workspace `extensions/*`.

## Escolha o formato do Plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens.
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo, mídia, busca, fetch, fala ou tempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Execute uma CLI de IA local por meio do fallback de modelo do OpenClaw.
  </Card>
  <Card title="Plugin de ferramenta" icon="wrench" href="/pt-BR/plugins/tool-plugins">
    Registre ferramentas de agente.
  </Card>
</CardGroup>

## Início rápido

Crie um Plugin de ferramenta mínimo registrando uma ferramenta de agente obrigatória. Este é o
formato de Plugin útil mais curto e mostra o pacote, o manifesto, o ponto de entrada e
a prova local.

<Steps>
  <Step title="Criar metadados do pacote">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugins externos publicados devem apontar entradas de runtime para arquivos JavaScript
    compilados. Consulte [pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para ver o contrato completo de
    ponto de entrada.

    Todo Plugin precisa de um manifesto, mesmo quando não tem configuração. Ferramentas de runtime
    devem aparecer em `contracts.tools` para que o OpenClaw possa descobrir a propriedade sem
    carregar ansiosamente todo runtime de Plugin. Defina `activation.onStartup`
    intencionalmente. Este exemplo inicia na inicialização do Gateway.

    Superfícies de Plugin confiáveis pelo host também são controladas por manifesto e exigem habilitação
    explícita para Plugins instalados. Se um Plugin instalado registrar
    `api.registerAgentToolResultMiddleware(...)`, declare cada runtime de destino em
    `contracts.agentToolResultMiddleware`. Se ele registrar
    `api.registerTrustedToolPolicy(...)`, declare cada ID de política em
    `contracts.trustedToolPolicies`. Essas declarações mantêm a inspeção no momento da instalação
    e o registro de runtime alinhados.

    Para todos os campos do manifesto, consulte [manifesto do Plugin](/pt-BR/plugins/manifest).

  </Step>

  <Step title="Registrar a ferramenta">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Use `definePluginEntry` para Plugins que não sejam de canal. Plugins de canal usam
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Testar o runtime">
    Para um Plugin instalado ou externo, inspecione o runtime carregado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se o Plugin registrar um comando de CLI, execute esse comando também. Por exemplo,
    um comando de demonstração deve ter uma prova de execução como
    `openclaw demo-plugin ping`.

    Para um Plugin empacotado neste repositório, o OpenClaw descobre pacotes de Plugin
    em checkout de código-fonte no workspace `extensions/*`. Execute o teste direcionado
    mais próximo:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publicar">
    Valide o pacote antes de publicar:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Os snippets canônicos do ClawHub ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instale o pacote publicado por meio do ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrando ferramentas

Ferramentas podem ser obrigatórias ou opcionais. Ferramentas obrigatórias estão sempre disponíveis quando o
Plugin está habilitado. Ferramentas opcionais exigem adesão do usuário.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda ferramenta registrada com `api.registerTool(...)` também deve ser declarada no
manifesto do Plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Usuários aderem com `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Ferramentas opcionais controlam se uma ferramenta é exposta ao modelo. Use
[solicitações de permissão de Plugin](/pt-BR/plugins/plugin-permission-requests) quando uma ferramenta
ou hook deve pedir aprovação depois que o modelo a seleciona e antes que a
ação seja executada.

Use ferramentas opcionais para efeitos colaterais, binários incomuns ou capacidades que
não devem ser expostas por padrão. Nomes de ferramentas não podem entrar em conflito com ferramentas do núcleo;
conflitos são ignorados e relatados nos diagnósticos de Plugin. Registros
malformados, incluindo descritores de ferramenta sem `parameters`, são ignorados e
relatados da mesma forma. Ferramentas registradas são funções tipadas que o modelo pode chamar
depois que as verificações de política e lista de permissões passam.

Fábricas de ferramentas recebem um objeto de contexto fornecido pelo runtime. Use `ctx.activeModel`
quando uma ferramenta precisa registrar, exibir ou se adaptar ao modelo ativo para o turno
atual. O objeto pode incluir `provider`, `modelId` e `modelRef`. Trate-o como
metadados informacionais de runtime, não como um limite de segurança contra o operador
local, código de Plugin instalado ou um runtime do OpenClaw modificado. Ferramentas locais
sensíveis ainda devem exigir adesão explícita do Plugin ou do operador e falhar fechadas
quando metadados do modelo ativo estiverem ausentes ou forem inadequados.

O manifesto declara propriedade e descoberta; a execução ainda chama a implementação
registrada ativa da ferramenta. Mantenha `toolMetadata.<tool>.optional: true`
alinhado com `api.registerTool(..., { optional: true })` para que o OpenClaw possa evitar
carregar esse runtime de Plugin até que a ferramenta seja explicitamente permitida.

## Convenções de importação

Importe de subcaminhos focados do SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Não importe do barrel raiz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro do pacote do seu Plugin, use arquivos barrel locais como `api.ts` e
`runtime-api.ts` para importações internas. Não importe seu próprio Plugin por meio de um
caminho do SDK. Helpers específicos de provedor devem permanecer no pacote do provedor, a menos que
o ponto de integração seja realmente genérico.

Métodos RPC personalizados do Gateway são um ponto de entrada avançado. Mantenha-os em um
prefixo específico do Plugin; namespaces administrativos do núcleo como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` permanecem reservados
e resolvem para `operator.admin`. A ponte
`openclaw/plugin-sdk/gateway-method-runtime` é reservada para rotas HTTP de Plugin
que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para o mapa completo de importação, consulte [visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Lista de verificação pré-envio

<Check>**package.json** tem metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugins no repositório)</Check>

## Testar contra versões beta

1. Acompanhe tags de lançamento do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta têm o formato `v2026.3.N-beta.1`. Você também pode ativar notificações da conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de lançamento.
2. Teste seu Plugin contra a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique no tópico do seu Plugin no canal `plugin-forum` do Discord depois de testar, com `all good` ou o que quebrou. Se você ainda não tiver um tópico, crie um.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue no seu tópico.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto no seu tópico do Discord. Contribuidores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem PR podem ser lançados mesmo assim. Mantenedores acompanham esses tópicos durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entra no próximo ciclo.

## Próximas etapas

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo
  </Card>
  <Card title="Plugins de backend de CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Registre um backend de CLI de IA local
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, busca, subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture)
